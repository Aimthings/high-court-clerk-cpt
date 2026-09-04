// Email delivery via SMTP (nodemailer). Sends the sign-up verification code.
// Defaults target a Hostinger mailbox (smtp.hostinger.com:465, SSL). With no
// SMTP_USER/SMTP_PASS configured the code is logged in dev instead of sent, so
// local sign-up still works without a mailbox.
import nodemailer from 'nodemailer';
import { SMTP } from './config.js';

let transporter = null;
function getTransport() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP.host,
      port: SMTP.port,
      secure: SMTP.port === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user: SMTP.user, pass: SMTP.pass },
    });
  }
  return transporter;
}

function verificationHtml(code) {
  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#0D2846">
    <div style="max-width:480px;margin:24px auto;background:#fff;border:1px solid #e6e8ec;border-radius:12px;padding:28px">
      <div style="font-size:15px;color:#5b6472">High Court Clerk CPT</div>
      <h1 style="font-size:20px;margin:12px 0 4px">Verify your email</h1>
      <p style="font-size:14px;color:#5b6472;margin:0 0 20px">Enter this code to finish signing in. It expires in 10 minutes.</p>
      <div style="font-size:34px;font-weight:700;letter-spacing:8px;background:#f4f5f7;border-radius:10px;padding:16px;text-align:center">${code}</div>
      <p style="font-size:12px;color:#98a0ad;margin:20px 0 0">If you did not request this, you can ignore this email.</p>
    </div>
  </body></html>`;
}

// Send the six-digit verification code to an email address.
export async function sendVerificationEmail(email, code) {
  // No SMTP configured → dev fallback: log the code, never send.
  if (!SMTP.user || !SMTP.pass) {
    // eslint-disable-next-line no-console
    console.log(`[dev EMAIL] ${email} -> ${code}`);
    return { delivered: true, dev: true };
  }
  try {
    const info = await getTransport().sendMail({
      from: `"${SMTP.fromName}" <${SMTP.from}>`,
      to: email,
      subject: `${code} is your verification code`,
      text: `Your High Court Clerk CPT verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
      html: verificationHtml(code),
    });
    return { delivered: true, messageId: info.messageId };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[email] send failed for ${email}: ${e.message}`);
    throw new Error('Could not send the verification email. Please try again in a moment.');
  }
}
