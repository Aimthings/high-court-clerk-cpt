// Entitlement service. A paid pass grants 45 days of access, no auto-renewal.
import { pool } from '../db.js';

export const PASS_PRODUCT = 'pass';
export const PASS_DAYS = 45;

// Compute an expiry 45 days after a start instant (pure — unit-tested).
export function passExpiry(startAt = new Date()) {
  return new Date(startAt.getTime() + PASS_DAYS * 24 * 60 * 60 * 1000);
}

// Grant a pass idempotently (unique on user+product+order).
export async function grantPass(userId, orderId, startAt = new Date()) {
  const expires = passExpiry(startAt);
  await pool.query(
    `INSERT INTO entitlements (user_id, product, order_id, starts_at, expires_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)`,
    [userId, PASS_PRODUCT, orderId, startAt, expires],
  );
  return expires;
}

// The user's current active pass, or null.
export async function activePass(userId) {
  if (!userId) return null;
  const [rows] = await pool.query(
    `SELECT product, expires_at FROM entitlements
     WHERE user_id = ? AND product = ? AND expires_at > NOW()
     ORDER BY expires_at DESC LIMIT 1`,
    [userId, PASS_PRODUCT],
  );
  return rows[0] || null;
}

export async function hasActivePass(userId) {
  return Boolean(await activePass(userId));
}
