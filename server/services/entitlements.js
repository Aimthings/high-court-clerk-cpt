// Entitlement service. A purchase grants 2 months of access to a product's
// capabilities, no auto-renewal. Capabilities are resolved by unioning the caps
// of every active entitlement the user holds.
import { pool } from '../db.js';
import { capsOf } from '../config.js';

export const PASS_DAYS = 60; // 2 months

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

// The union of capabilities the user currently holds.
export async function activeCapabilities(userId) {
  const rows = await activeProducts(userId);
  const caps = new Set();
  for (const r of rows) for (const c of capsOf(r.product)) caps.add(c);
  return caps;
}

export async function hasCapability(userId, cap) {
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
