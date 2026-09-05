// Entitlement service. A purchase grants 2 months of access to a product's
// capabilities, no auto-renewal. Capabilities are resolved by unioning the caps
// of every active entitlement the user holds.
import { pool } from '../db.js';
import { capsOf, isAdminEmail, ALL_CAPS } from '../config.js';

export const PASS_DAYS = 60; // 2 months

// Is this user a master admin (by their account email)? Admins hold every
// capability at all times. Cheap single lookup; the result is only consulted in
// capability checks, not on every request.
export async function isAdminUser(userId) {
  if (!userId) return false;
  try {
    const [[u]] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);
    return isAdminEmail(u?.email);
  } catch {
    return false;
  }
}

// Compute an expiry PASS_DAYS after a start instant (pure — unit-tested).
export function passExpiry(startAt = new Date()) {
  return new Date(startAt.getTime() + PASS_DAYS * 24 * 60 * 60 * 1000);
}

// Grant a product entitlement idempotently (unique on user+product+order).
export async function grantEntitlement(userId, product, orderId, startAt = new Date()) {
  const expires = passExpiry(startAt);
  await pool.query(
    `INSERT INTO entitlements (user_id, product, order_id, starts_at, expires_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)`,
    [userId, product, orderId, startAt, expires],
  );
  return expires;
}

// All active (unexpired) products for a user.
export async function activeProducts(userId) {
  if (!userId) return [];
  const [rows] = await pool.query(
    `SELECT product, expires_at FROM entitlements
     WHERE user_id = ? AND expires_at > NOW()`,
    [userId],
  );
  return rows;
}

// The union of capabilities the user currently holds. A master admin always
// holds every capability. Pass { adminAware: false } to get only the caps a user
// has actually purchased (used by the admin console to report real access).
export async function activeCapabilities(userId, { adminAware = true } = {}) {
  if (adminAware && (await isAdminUser(userId))) return new Set(ALL_CAPS);
  const rows = await activeProducts(userId);
  const caps = new Set();
  for (const r of rows) for (const c of capsOf(r.product)) caps.add(c);
  return caps;
}

export async function hasCapability(userId, cap) {
  if (await isAdminUser(userId)) return true;
  const caps = await activeCapabilities(userId);
  return caps.has(cap);
}

// Any active entitlement at all (for a generic "has bought something" check).
export async function hasActivePass(userId) {
  const rows = await activeProducts(userId);
  return rows.length > 0;
}

// The latest expiry across active entitlements (for the nav "Pass · N days").
export async function activePass(userId) {
  const rows = await activeProducts(userId);
  if (!rows.length) return null;
  return rows.reduce((a, b) => (new Date(b.expires_at) > new Date(a.expires_at) ? b : a));
}
