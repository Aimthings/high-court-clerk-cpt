import { Router } from 'express';
import { pool } from '../db.js';
import { getUserId } from '../auth.js';
import { createPassOrder, verifyWebhookSignature } from '../razorpay.js';
import { grantPass, PASS_PRODUCT } from '../services/entitlements.js';
import { PRICES, RAZORPAY } from '../config.js';

export const ordersRouter = Router();

// POST /api/orders/create — must be signed in (a pass ties to the phone).
ordersRouter.post('/create', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Sign in before buying the pass.', needsAuth: true });

    const receipt = `pass_${userId}_${Date.now()}`;
    const order = await createPassOrder(receipt);
    await pool.query(
      `INSERT INTO orders (user_id, product, amount_paise, razorpay_order_id, status)
       VALUES (?, ?, ?, ?, 'created')`,
      [userId, PASS_PRODUCT, PRICES.pass119, order.id],
    );
    return res.json({ razorpayOrderId: order.id, amount: PRICES.pass119, currency: 'INR', keyId: RAZORPAY.keyId });
  } catch (e) { return next(e); }
});

// Raw-body webhook handler (mounted with express.raw BEFORE express.json in
// index.js). HMAC-verified, idempotent via unique razorpay_payment_id, always 200.
export async function webhookHandler(req, res) {
  const signature = req.get('x-razorpay-signature');
  const raw = req.body; // Buffer (express.raw)
  if (!verifyWebhookSignature(raw, signature)) {
    // Do not leak why; a bad signature is simply ignored.
    return res.status(400).json({ received: false });
  }

  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch { return res.status(200).json({ received: true }); }

  try {
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id && payment?.id) {
        // Idempotent: the unique razorpay_payment_id index makes a replay a no-op.
        const [result] = await pool.query(
          `UPDATE orders
             SET status = 'paid', razorpay_payment_id = ?, paid_at = NOW(), raw_payload = ?
           WHERE razorpay_order_id = ? AND (razorpay_payment_id IS NULL OR razorpay_payment_id = ?)`,
          [payment.id, JSON.stringify(event), payment.order_id, payment.id],
        );
        if (result.affectedRows > 0) {
          const [rows] = await pool.query(
            'SELECT id, user_id FROM orders WHERE razorpay_order_id = ? LIMIT 1',
            [payment.order_id],
          );
          const ord = rows[0];
          if (ord) await grantPass(ord.user_id, ord.id);
        }
      }
    }
  } catch {
    // Never fail the webhook — Razorpay retries; reconciliation also settles later.
  }
  // Always 200 so the gateway stops retrying a delivered event.
  return res.status(200).json({ received: true });
}
