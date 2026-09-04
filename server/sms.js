// OTP delivery. Provider: Fast2SMS (https://www.fast2sms.com).
// With no key configured (or SMS_PROVIDER != 'fast2sms') the code is logged in
// dev and never sent — so local sign-in still works without spending credits.
// Set SMS_PROVIDER=fast2sms + SMS_API_KEY to send real messages (even in dev,
// so the flow can be tested end-to-end).
import { SMS } from './config.js';

const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

// Build the Fast2SMS request body for the configured route. `phone` is the bare
// 10-digit Indian mobile (no +91); `code` is the six-digit OTP.
function buildBody(phone, code) {
  const p = new URLSearchParams();
  p.set('numbers', phone);
  p.set('flash', '0');
  if (SMS.route === 'dlt') {
    // DLT route: uses an approved sender id + template id on your account.
    p.set('route', 'dlt');
    p.set('sender_id', SMS.senderId);
    p.set('message', SMS.dltMessageId);
    p.set('variables_values', code);
  } else {
    // OTP route: Fast2SMS sends "Your OTP: <code>" — no DLT template required.
    p.set('route', 'otp');
    p.set('variables_values', code);
  }
  return p.toString();
}

async function sendViaFast2sms(phone, code) {
  const res = await fetch(FAST2SMS_URL, {
    method: 'POST',
    headers: {
      authorization: SMS.apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: buildBody(phone, code),
  });

  let data = null;
  try { data = await res.json(); } catch { /* non-JSON error body */ }

  // Fast2SMS returns { return: true, request_id, message: [...] } on success.
  if (!res.ok || !data || data.return !== true) {
    const reason = data?.message
      ? (Array.isArray(data.message) ? data.message.join('; ') : String(data.message))
      : `HTTP ${res.status}`;
    // eslint-disable-next-line no-console
    console.error(`[sms] Fast2SMS send failed for ${phone}: ${reason}`);
    throw new Error('Could not send the code. Please try again in a moment.');
  }
  return { delivered: true, requestId: data.request_id };
}

export async function sendOtp(phone, code) {
  // No provider configured → dev fallback: log the code, never send.
  if (SMS.provider !== 'fast2sms' || !SMS.apiKey) {
    // eslint-disable-next-line no-console
    console.log(`[dev OTP] ${phone} -> ${code}`);
    return { delivered: true, dev: true };
  }
  return sendViaFast2sms(phone, code);
}
