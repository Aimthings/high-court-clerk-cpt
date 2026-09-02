// Reconciliation: settle orders still 'created' after 15 minutes by asking
// Razorpay for their real status. Guards against a missed/lost webhook.
import { pool } from '../db.js';
import { grantPass } from '../services/entitlements.js';
import { RAZORPAY } from '../config.js';
import Razorpay from 'razorpay';

const STALE_MIN = 15;

export async function reconcileOrders() {
  if (!RAZORPAY.keyId || !RAZORPAY.keySecret) return { skipped: 'no keys' };
  const rzp = new Razorpay({ key_id: RAZORPAY.keyId, key_secret: RAZORPAY.keySecret });

  const [rows] = await pool.query(
    `SELECT id, user_id, razorpay_order_id FROM orders
     WHERE status = 'created' AND created_at < (NOW() - INTERVAL ? MINUTE)`,
    [STALE_MIN],
  );

  let settled = 0;
  for (const ord of rows) {
    try {
      const payments = await rzp.orders.fetchPayments(ord.razorpay_order_id);
      const captured = (payments.items || []).find((p) => p.status === 'captured');
      if (captured) {
        const [r] = await pool.query(
          `UPDATE orders SET status = 'paid', razorpay_payment_id = ?, paid_at = NOW()
           WHERE id = ? AND (razorpay_payment_id IS NULL OR razorpay_payment_id = ?)`,
          [captured.id, ord.id, captured.id],
        );
        if (r.affectedRows > 0) { await grantPass(ord.user_id, ord.id); settled += 1; }
      }
    } catch { /* try again next run */ }
  }
  return { checked: rows.length, settled };
}

// Simple interval scheduler; started from index.js in production.
export function startReconcileCron(everyMs = 5 * 60 * 1000) {
  return setInterval(() => { reconcileOrders().catch(() => {}); }, everyMs);
}
