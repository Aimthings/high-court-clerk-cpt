// OTP delivery. In development the code is logged, never sent. Wire a real
// provider (e.g. MSG91/Gupshup) here for production by implementing sendSms().
import { NODE_ENV } from './config.js';

export async function sendOtp(phone, code) {
  if (NODE_ENV !== 'production' || !process.env.SMS_API_KEY) {
    // eslint-disable-next-line no-console
    console.log(`[dev OTP] ${phone} -> ${code}`);
    return { delivered: true, dev: true };
  }
  // TODO: integrate the chosen SMS provider using SMS_PROVIDER / SMS_API_KEY.
  throw new Error('SMS provider not configured');
}
