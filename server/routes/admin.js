import { Router } from 'express';
import { pool } from '../db.js';
import { getUserId } from '../auth.js';
import { capsOf, isAdminEmail, CAPS } from '../config.js';

// Master-admin console API. Everything here is gated to admin accounts (by email,
// server-side). Non-admins get a 404 so the endpoints don't advertise themselves.
export const adminRouter = Router();

async function requireAdmin(req, res, next) {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(404).json({ error: 'Not found.' });
    const [[u]] = await pool.query('SELECT email FROM users WHERE id = ?', [uid]);
    if (!isAdminEmail(u?.email)) return res.status(404).json({ error: 'Not found.' });
    req.adminEmail = u.email;
    return next();
  } catch {
    return res.status(500).json({ error: 'Admin check failed.' });
  }
}

const CAP_LABEL = {
  [CAPS.TYPING_COURSE]: 'Typing course',
  [CAPS.TYPING_MOCKS]: 'Typing mocks',
  [CAPS.EXCEL_MOCKS]: 'Excel mocks',
  [CAPS.FORMULA_LIBRARY]: 'Formulas',
};
const ALL = Object.values(CAPS);

// Turn a user's active products (+admin flag) into a readable access summary.
function accessFor(products, email) {
  if (isAdminEmail(email)) return { label: 'Full access (admin)', caps: ALL };
  const caps = new Set();
  (products || []).forEach((p) => capsOf(p).forEach((c) => caps.add(c)));
  const list = ALL.filter((c) => caps.has(c)); // stable order
  if (list.length === 0) return { label: 'None', caps: [] };
  if (list.length >= ALL.length) return { label: 'Full access', caps: list };
  return { label: list.map((c) => CAP_LABEL[c]).join(', '), caps: list };
}

// Live dashboard tiles. "Online now" = active in the last 15 minutes.
adminRouter.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const [[a]] = await pool.query('SELECT COUNT(*) AS n FROM users');
    const [[v]] = await pool.query('SELECT COUNT(*) AS n FROM users WHERE email_verified = 1');
    const [[f]] = await pool.query('SELECT COUNT(*) AS n FROM users WHERE founding_member = 1');
    const [[on]] = await pool.query('SELECT COUNT(*) AS n FROM users WHERE last_seen > NOW() - INTERVAL 15 MINUTE');
    const [[today]] = await pool.query('SELECT COUNT(*) AS n FROM users WHERE last_seen > NOW() - INTERVAL 1 DAY');
    const [[d1]] = await pool.query('SELECT COUNT(*) AS n FROM users WHERE created_at >= NOW() - INTERVAL 1 DAY');
    const [[d7]] = await pool.query('SELECT COUNT(*) AS n FROM users WHERE created_at >= NOW() - INTERVAL 7 DAY');
    const [[paid]] = await pool.query('SELECT COUNT(DISTINCT user_id) AS n FROM entitlements WHERE expires_at > NOW()');
    return res.json({
      onlineNow: Number(on.n) || 0,
      activeToday: Number(today.n) || 0,
      totalAccounts: Number(a.n) || 0,
      verified: Number(v.n) || 0,
      foundingMembers: Number(f.n) || 0,
      withPaidAccess: Number(paid.n) || 0,
      newLast24h: Number(d1.n) || 0,
      newLast7d: Number(d7.n) || 0,
      at: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ error: 'Could not read stats.' });
  }
});

// Every account with its handle and what access it holds.
adminRouter.get('/users', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.name, u.founding_member, u.email_verified, u.created_at, u.last_seen,
              p.handle,
              GROUP_CONCAT(DISTINCT CASE WHEN e.expires_at > NOW() THEN e.product END) AS products,
              MAX(e.expires_at) AS access_expires
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       LEFT JOIN entitlements e ON e.user_id = u.id
       GROUP BY u.id, u.email, u.name, u.founding_member, u.email_verified, u.created_at, u.last_seen, p.handle
       ORDER BY u.created_at DESC
       LIMIT 2000`,
    );
    const now = Date.now();
    const users = rows.map((r) => {
      const products = r.products ? String(r.products).split(',').filter(Boolean) : [];
      const access = accessFor(products, r.email);
      const lastSeen = r.last_seen ? new Date(r.last_seen).getTime() : 0;
      return {
        id: r.id,
        email: r.email,
        handle: r.handle || null,
        name: r.name || null,
        founding: r.founding_member === 1,
        verified: r.email_verified === 1,
        admin: isAdminEmail(r.email),
        access: access.label,
        products,
        accessExpires: r.access_expires || null,
        joined: r.created_at,
        lastSeen: r.last_seen || null,
        online: lastSeen > 0 && now - lastSeen < 15 * 60 * 1000,
      };
    });
    return res.json({ users, count: users.length });
  } catch (e) {
    return res.status(500).json({ error: 'Could not read accounts.' });
  }
});
