import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifyWebhookSignature, verifyPaymentSignature } from './razorpay.js';
import { passExpiry, PASS_DAYS } from './services/entitlements.js';
import { hashCode, generateCode, E164_IN } from './auth.js';
import { PRICES } from './config.js';

describe('Razorpay webhook signature', () => {
  const secret = 'whsec_test_123';
  const raw = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1' } } } }));
  const good = crypto.createHmac('sha256', secret).update(raw).digest('hex');

  it('accepts a correct HMAC over the raw body', () => {
    expect(verifyWebhookSignature(raw, good, secret)).toBe(true);
  });
  it('rejects a tampered body', () => {
    const tampered = Buffer.from(raw.toString().replace('order_1', 'order_2'));
    expect(verifyWebhookSignature(tampered, good, secret)).toBe(false);
  });
  it('rejects a wrong signature and a missing secret', () => {
    expect(verifyWebhookSignature(raw, 'deadbeef', secret)).toBe(false);
    expect(verifyWebhookSignature(raw, good, '')).toBe(false);
  });
});

describe('Razorpay checkout signature', () => {
  const secret = 'key_secret_test';
  it('verifies order|payment HMAC', () => {
    const sig = crypto.createHmac('sha256', secret).update('order_9|pay_9').digest('hex');
    expect(verifyPaymentSignature('order_9', 'pay_9', sig, secret)).toBe(true);
    expect(verifyPaymentSignature('order_9', 'pay_X', sig, secret)).toBe(false);
  });
});

describe('pricing + entitlement', () => {
  it('price is the server constant 11900 paise (₹119)', () => {
    expect(PRICES.pass119).toBe(11900);
  });
  it('pass expiry is exactly 45 days after start', () => {
    const start = new Date('2026-09-02T10:00:00Z');
    const end = passExpiry(start);
    expect(PASS_DAYS).toBe(45);
    expect(end.getTime() - start.getTime()).toBe(45 * 24 * 60 * 60 * 1000);
  });
});

describe('OTP helpers', () => {
  it('hashCode is deterministic and phone-salted', () => {
    expect(hashCode('9812345678', '123456')).toBe(hashCode('9812345678', '123456'));
    expect(hashCode('9812345678', '123456')).not.toBe(hashCode('9812345679', '123456'));
  });
  it('generateCode is always six digits', () => {
    for (let i = 0; i < 50; i += 1) expect(generateCode()).toMatch(/^\d{6}$/);
  });
  it('accepts valid Indian mobiles, rejects junk', () => {
    expect(E164_IN.test('9812345678')).toBe(true);
    expect(E164_IN.test('1234567890')).toBe(false);
    expect(E164_IN.test('98123')).toBe(false);
  });
});
