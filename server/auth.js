// Identity + OTP helpers. Guest-first: a guest gets an anon token cookie; on
// OTP verify the guest's data is merged into the phone-owned account (brief §4).
import crypto from 'node:crypto';
import { NODE_ENV } from './config.js';

const SID = 'sid'; // signed cookie holding the user id
const ANON = 'anon'; // guest anon token cookie
const SESSION_DAYS = 60;

export function hashCode(phone, code) {
  // salted by phone so identical codes for different numbers hash differently
  return crypto.createHash('sha256').update(`${phone}:${code}`).digest('hex');
}

export function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function newAnonToken() {
  return crypto.randomUUID();
}

const cookieOpts = (maxAgeDays) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: NODE_ENV === 'production',
  path: '/',
  maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
});

export function setSession(res, userId) {
  res.cookie(SID, String(userId), { ...cookieOpts(SESSION_DAYS), signed: true });
}
export function clearSession(res) {
  res.clearCookie(SID, { path: '/' });
}
export function getUserId(req) {
  const raw = req.signedCookies?.[SID];
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Ensure the guest has an anon token cookie (for later merge-on-verify).
export function ensureAnon(req, res) {
  let token = req.cookies?.[ANON];
  if (!token) {
    token = newAnonToken();
    res.cookie(ANON, token, cookieOpts(SESSION_DAYS));
  }
  return token;
}
export function getAnon(req) {
  return req.cookies?.[ANON] || null;
}
export function clearAnon(res) {
  res.clearCookie(ANON, { path: '/' });
}

export const E164_IN = /^[6-9]\d{9}$/; // 10-digit Indian mobile
