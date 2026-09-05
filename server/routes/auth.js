import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db.js';
import { sendVerificationEmail } from '../email.js';
import { activePass, activeCapabilities } from '../services/entitlements.js';
import { LAUNCH_FREE, isAdminEmail } from '../config.js';
import {
  hashCode, generateCode, setSession, clearSession, getUserId, getAnon, clearAnon, ensureAnon,
} from '../auth.js';

// Email + password sign-up with a six-digit email verification code. Guest-first:
// a guest's practice attempts are merged into the account on verify/login.
export const authRouter = Router();

const CODE_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 10;

// Tight per-route limits (brief §7). Keyed by IP (trust proxy is set in index.js).
const sendLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false });
const verifyLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false });

const emailField = z.string().trim().toLowerCase().pipe(z.string().email().max(255));
const registerSchema = z.object({
  email: emailField,
  password: z.string().min(8, 'at least 8 characters').max(200),
  name: z.string().trim().max(120).optional(),
});
const loginSchema = z.object({ email: emailField, password: z.string().min(1).max(200) });
const verifySchema = z.object({ email: emailField, code: z.string().regex(/^\d{6}$/) });
const emailOnlySchema = z.object({ email: emailField });

// Issue a fresh code for an email: clear older unconsumed codes, insert, send.
async function issueCode(email) {
  const code = generateCode();
  const codeHash = hashCode(email, code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60 * 1000);
  await pool.query('DELETE FROM email_codes WHERE email = ? AND consumed_at IS NULL', [email]);
  await pool.query(
    'INSERT INTO email_codes (email, code_hash, attempts, expires_at) VALUES (?, ?, 0, ?)',
    [email, codeHash, expiresAt],
  );
  await sendVerificationEmail(email, code);
}

// Merge a guest's attempts into a real account, then retire the guest. Best-effort.
async function mergeGuest(req, res, userId) {
  const anon = getAnon(req);
  if (!anon) return;
  try {
    const [grows] = await pool.query('SELECT id FROM users WHERE anon_token = ?', [anon]);
    const guestId = grows[0]?.id;
    if (guestId && guestId !== userId) {
      await pool.query('UPDATE typing_attempts SET user_id = ? WHERE user_id = ?', [userId, guestId]);
      await pool.query('UPDATE excel_attempts SET user_id = ? WHERE user_id = ?', [userId, guestId]);
      await pool.query('DELETE FROM users WHERE id = ?', [guestId]);
    }
  } catch { /* merge is best-effort; never block sign-in */ }
  clearAnon(res);
}

// POST /api/auth/register — create an unverified account, email a code.
authRouter.post('/register', sendLimiter, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and a password of at least 8 characters.' });
    const { email, password, name } = parsed.data;

    const [rows] = await pool.query('SELECT id, email_verified FROM users WHERE email = ?', [email]);
    const existing = rows[0];
    if (existing && existing.email_verified === 1) {
      return res.status(409).json({ error: 'This email is already registered. Please log in.' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    if (existing) {
      // Re-registering an unverified email updates the pending credentials.
      await pool.query('UPDATE users SET password_hash = ?, name = COALESCE(?, name) WHERE id = ?', [passwordHash, name ?? null, existing.id]);
    } else {
      // Accounts created during the free launch are founding members forever.
      await pool.query(
        'INSERT INTO users (email, password_hash, name, email_verified, founding_member) VALUES (?, ?, ?, 0, ?)',
        [email, passwordHash, name ?? null, LAUNCH_FREE ? 1 : 0],
      );
    }
    await issueCode(email);
    return res.json({ sent: true, email, expiresInSec: CODE_TTL_MIN * 60 });
  } catch (e) { return next(e); }
});

// POST /api/auth/verify-email — check the code, mark verified, start a session.
authRouter.post('/verify-email', verifyLimiter, async (req, res, next) => {
  try {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter the six-digit code.' });
    const { email, code } = parsed.data;

    const [rows] = await pool.query(
      `SELECT id, code_hash, attempts, expires_at FROM email_codes
       WHERE email = ? AND consumed_at IS NULL ORDER BY id DESC LIMIT 1`,
      [email],
    );
    const rec = rows[0];
    if (!rec) return res.status(400).json({ error: 'Request a new code.' });
    if (new Date(rec.expires_at) < new Date()) return res.status(400).json({ error: 'That code has expired. Request a new one.' });
    if (rec.attempts >= MAX_ATTEMPTS) return res.status(429).json({ error: 'Too many attempts. Request a new code.' });

    if (hashCode(email, code) !== rec.code_hash) {
      await pool.query('UPDATE email_codes SET attempts = attempts + 1 WHERE id = ?', [rec.id]);
      const left = Math.max(0, MAX_ATTEMPTS - (rec.attempts + 1));
      return res.status(401).json({ error: `That code is wrong. ${left} attempt${left === 1 ? '' : 's'} left.`, attemptsLeft: left });
    }

    await pool.query('UPDATE email_codes SET consumed_at = NOW() WHERE id = ?', [rec.id]);

    const [urows] = await pool.query('SELECT id, name FROM users WHERE email = ?', [email]);
    const user = urows[0];
    if (!user) return res.status(400).json({ error: 'Start sign up again.' });
    await pool.query('UPDATE users SET email_verified = 1 WHERE id = ?', [user.id]);

    // ensure a profile exists (listed on by default; handle is editable)
    await pool.query(
      'INSERT INTO profiles (user_id, handle, listed) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE user_id = user_id',
      [user.id, `clerk_${String(user.id).padStart(4, '0')}`],
    );

    await mergeGuest(req, res, user.id);
    setSession(res, user.id);
    const pass = await activePass(user.id);
    return res.json({
      user: { id: user.id, email, name: user.name },
      hasPass: Boolean(pass),
      expiresAt: pass?.expires_at || null,
    });
  } catch (e) { return next(e); }
});

// POST /api/auth/login — email + password. Unverified accounts get a fresh code.
authRouter.post('/login', verifyLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter your email and password.' });
    const { email, password } = parsed.data;

    const [rows] = await pool.query('SELECT id, name, password_hash, email_verified FROM users WHERE email = ?', [email]);
    const user = rows[0];
    // Generic message — never reveal whether an email exists.
    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Wrong email or password.' });
    }
    if (user.email_verified !== 1) {
      await issueCode(email);
      return res.status(403).json({ error: 'Verify your email to continue. We sent a new code.', needsVerify: true, email });
    }

    await mergeGuest(req, res, user.id);
    setSession(res, user.id);
    const pass = await activePass(user.id);
    return res.json({
      user: { id: user.id, email, name: user.name },
      hasPass: Boolean(pass),
      expiresAt: pass?.expires_at || null,
    });
  } catch (e) { return next(e); }
});

// POST /api/auth/resend-code — resend the verification code (no email enumeration).
authRouter.post('/resend-code', sendLimiter, async (req, res, next) => {
  try {
    const parsed = emailOnlySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter your email.' });
    const { email } = parsed.data;
    const [rows] = await pool.query('SELECT id, email_verified FROM users WHERE email = ?', [email]);
    if (rows[0] && rows[0].email_verified !== 1) await issueCode(email);
    return res.json({ sent: true, email, expiresInSec: CODE_TTL_MIN * 60 });
  } catch (e) { return next(e); }
});

authRouter.get('/me', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) { ensureAnon(req, res); return res.json({ user: null, hasPass: false, expiresAt: null, launchFree: LAUNCH_FREE, founding: false }); }
    const [rows] = await pool.query('SELECT id, email, name, founding_member FROM users WHERE id = ?', [userId]);
    const user = rows[0];
    if (!user) { clearSession(res); return res.json({ user: null, hasPass: false, expiresAt: null, launchFree: LAUNCH_FREE, founding: false }); }
    const pass = await activePass(userId);
    const caps = [...(await activeCapabilities(userId))];
    const [[profile]] = await pool.query('SELECT handle, region, listed FROM profiles WHERE user_id = ?', [userId]);
    return res.json({
      user: { id: user.id, email: user.email, name: user.name },
      profile: profile ? { ...profile, listed: profile.listed === 1 } : null,
      hasPass: Boolean(pass),
      expiresAt: pass?.expires_at || null,
      caps,
      launchFree: LAUNCH_FREE,
      founding: user.founding_member === 1,
      admin: isAdminEmail(user.email),
    });
  } catch (e) { return next(e); }
});

authRouter.post('/logout', (req, res) => { clearSession(res); res.json({ ok: true }); });
