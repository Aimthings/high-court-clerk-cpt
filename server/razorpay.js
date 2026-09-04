// Razorpay Orders API + webhook helpers. No Subscriptions, no mandates.
// The amount is a server-side constant in paise — never read from a request.
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { RAZORPAY, priceOf, PRODUCTS } from './config.js';

let client = null;
function rzp() {
  if (!client) {
    if (!RAZORPAY.keyId || !RAZORPAY.keySecret) throw new Error('Razorpay keys not configured');
    client = new Razorpay({ key_id: RAZORPAY.keyId, key_secret: RAZORPAY.keySecret });
  }
  return client;
}

// Create a Razorpay order for a catalog product. The amount is the server-side
// constant price for that product — never read from the request.
export async function createProductOrder(product, receipt) {
  const amount = priceOf(product);
  if (!amount) throw new Error('Unknown product');
  const order = await rzp().orders.create({
    amount,
    currency: 'INR',
    receipt,
    notes: { product, label: PRODUCTS[product].label },
  });
  return order;
}

// Timing-safe HMAC comparison. Returns true only on an exact match.
function safeEqualHex(aHex, bHex) {
  const a = Buffer.from(String(aHex), 'utf8');
  const b = Buffer.from(String(bHex), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Webhook signature: HMAC-SHA256 of the RAW body with the webhook secret.
export function verifyWebhookSignature(rawBody, signature, secret = RAZORPAY.webhookSecret) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}

// Checkout callback signature: HMAC-SHA256 of `${order_id}|${payment_id}`.
export function verifyPaymentSignature(orderId, paymentId, signature, secret = RAZORPAY.keySecret) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqualHex(expected, signature);
}
