import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { getUserId } from '../auth.js';
import { createProductOrder, verifyWebhookSignature } from '../razorpay.js';
import { grantEntitlement } from '../services/entitlements.js';
import { PRODUCTS, priceOf, RAZORPAY } from '../config.js';

export const ordersRouter = Router();

const createSchema = z.object({ product: z.enum(Object.keys(PRODUCTS)) });

// POST /api/orders/create — must be signed in (an entitlement ties to the account).
ordersRouter.post('/create', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Sign in before buying.', needsAuth: true });
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Choose a valid product.' });
    const { product } = parsed.data;

    // Founding-member pricing is decided server-side from the account, never trusted from the client.
    const [[u]] = await pool.query('SELECT founding_member FROM users WHERE id = ?', [userId]);
    const isFounding = u?.founding_member === 1;
    const amount = priceOf(product, isFounding);

    const receipt = `${product}_${userId}_${Date.now()}`.slice(0, 40);
    const order = await createProductOrder(product, isFounding, receipt);
    await pool.query(
      `INSERT INTO orders (user_id, product, amount_paise, razorpay_order_id, status)
       VALUES (?, ?, ?, ?, 'created')`,
      [userId, product, amount, order.id],
    );
    return res.json({
      razorpayOrderId: order.id, amount, currency: 'INR', keyId: RAZORPAY.keyId,
      product, label: PRODUCTS[product].label,
    });
  } catch (e) { return next(e); }
});

// Raw-body webhook handler (mounted with express.raw BEFORE express.json in
// index.js). HMAC-verified, idempotent via unique razorpay_payment_id, always 200.
export async function webhookHandler(req, res) {
  const signature = req.get('x-razorpay-signature');
  const raw = req.body; // Buffer (express.raw)
  if (!verifyWebhookSignature(raw, signature)) {
    return res.status(400).json({ received: false });
  }

  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch { return res.status(200).json({ received: true }); }

  try {
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id && payment?.id) {
        const [result] = await pool.query(
          `UPDATE orders
             SET status = 'paid', razorpay_payment_id = ?, paid_at = NOW(), raw_payload = ?
           WHERE razorpay_order_id = ? AND (razorpay_payment_id IS NULL OR razorpay_payment_id = ?)`,
          [payment.id, JSON.stringify(event), payment.order_id, payment.id],
        );
        if (result.affectedRows > 0) {
          const [rows] = await pool.query(
            'SELECT id, user_id, product FROM orders WHERE razorpay_order_id = ? LIMIT 1',
            [payment.order_id],
          );
          const ord = rows[0];
          if (ord) await grantEntitlement(ord.user_id, ord.product, ord.id);
        }
      }
    }
  } catch {
    // Never fail the webhook — Razorpay retries; reconciliation also settles later.
  }
  return res.status(200).json({ received: true });
}
