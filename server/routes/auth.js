import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { pool } from '../db.js';
import { sendOtp } from '../sms.js';
import { activePass } from '../services/entitlements.js';
import {
  hashCode, generateCode, setSession, clearSession, getUserId, getAnon, clearAnon, ensureAnon, E164_IN,
} from '../auth.js';

export const authRouter = Router();

const OTP_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;

// Tight per-route limits (brief §7). Keyed by IP; phone abuse also capped below.
const sendLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false });
const verifyLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false });

const phoneSchema = z.object({ phone: z.string().regex(E164_IN, 'Enter a valid 10-digit mobile number.') });
const verifySchema = phoneSchema.extend({ code: z.string().regex(/^\d{6}$/) });

authRouter.post('/otp/send', sendLimiter, async (req, res, next) => {
  try {
    const parsed = phoneSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number.' });
    const { phone } = parsed.data;

    const code = generateCode();
    const codeHash = hashCode(phone, code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);

    // one live code per phone: clear older unconsumed codes, then insert
    await pool.query('DELETE FROM otp_codes WHERE phone = ? AND consumed_at IS NULL', [phone]);
    await pool.query(
      'INSERT INTO otp_codes (phone, code_hash, attempts, expires_at) VALUES (?, ?, 0, ?)',
      [phone, codeHash, expiresAt],
    );
    await sendOtp(phone, code);
    return res.json({ sent: true, expiresInSec: OTP_TTL_MIN * 60 });
  } catch (e) { return next(e); }
});

authRouter.post('/otp/verify', verifyLimiter, async (req, res, next) => {
  try {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter the six-digit code.' });
    const { phone, code } = parsed.data;

    const [rows] = await pool.query(
      `SELECT id, code_hash, attempts, expires_at FROM otp_codes
       WHERE phone = ? AND consumed_at IS NULL ORDER BY id DESC LIMIT 1`,
      [phone],
    );
    const otp = rows[0];
    if (!otp) return res.status(400).json({ error: 'Request a new code.' });
    if (new Date(otp.expires_at) < new Date()) return res.status(400).json({ error: 'That code has expired. Request a new one.' });
    if (otp.attempts >= MAX_ATTEMPTS) return res.status(429).json({ error: 'Too many attempts. Request a new code.' });

    if (hashCode(phone, code) !== otp.code_hash) {
      await pool.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [otp.id]);
      const left = Math.max(0, MAX_ATTEMPTS - (otp.attempts + 1));
      return res.status(401).json({ error: `That code is wrong. ${left} attempt${left === 1 ? '' : 's'} left.`, attemptsLeft: left });
    }

    await pool.query('UPDATE otp_codes SET consumed_at = NOW() WHERE id = ?', [otp.id]);

    // find-or-create the phone-owned account
    let [urows] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
    let userId = urows[0]?.id;
    if (!userId) {
      const [ins] = await pool.query('INSERT INTO users (phone) VALUES (?)', [phone]);
      userId = ins.insertId;
    }

    // merge guest data (attempts) into this account, then retire the guest
    const anon = getAnon(req);
    if (anon) {
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

    setSession(res, userId);
    const pass = await activePass(userId);
    return res.json({
      user: { id: userId, phone },
      hasPass: Boolean(pass),
      expiresAt: pass?.expires_at || null,
    });
  } catch (e) { return next(e); }
});

authRouter.get('/me', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) { ensureAnon(req, res); return res.json({ user: null, hasPass: false, expiresAt: null }); }
    const [rows] = await pool.query('SELECT id, phone, name FROM users WHERE id = ?', [userId]);
    const user = rows[0];
    if (!user) { clearSession(res); return res.json({ user: null, hasPass: false, expiresAt: null }); }
    const pass = await activePass(userId);
    return res.json({ user, hasPass: Boolean(pass), expiresAt: pass?.expires_at || null });
  } catch (e) { return next(e); }
});

authRouter.post('/logout', (req, res) => { clearSession(res); res.json({ ok: true }); });
