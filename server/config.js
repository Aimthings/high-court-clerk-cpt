// Central config. Values come from the environment; amounts are server-side
// constants in paise and are never read from a request (brief §5.7).

export const PORT = Number(process.env.PORT || 4000);
export const NODE_ENV = process.env.NODE_ENV || 'development';

// Free-launch master switch. While true, LAUNCH_FREE unlocks the paid areas for
// everyone signed in — the Typing Master course and all typing + Excel mocks.
// EXCEPTION: the Formula Library always follows its free/locked map (see
// access.js), so formulas are NOT fully unlocked even during the launch.
// Flip to false (set env LAUNCH_FREE=false, then redeploy) to end the launch:
// non-buyers then get only the Home row, the first typing mock and the first
// Excel mock, everything else gated to the matching purchase.
export const LAUNCH_FREE = process.env.LAUNCH_FREE !== 'false';

export const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'hcc',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hcc_cpt',
  connectionLimit: Number(process.env.DB_POOL || 10),
};

// Product catalog. Prices are server-side constants in paise — never trust a
// client amount (brief §5.7). Each product grants a set of capabilities; a gate
// checks the capability, and LAUNCH_FREE unlocks everything while the launch is on.
export const CAPS = {
  TYPING_COURSE: 'typingCourse', // the learn-to-type modules (home row always free)
  TYPING_MOCKS: 'typingMocks', // rankable typing mocks beyond the free first one
  EXCEL_MOCKS: 'excelMocks', // Excel mocks beyond the free first one
  FORMULA_LIBRARY: 'formulaLibrary', // the locked Formula Library lessons
};

// Two price tiers per product (paise): the founding-member rate for accounts
// created during the launch, and the standard rate (+15%, rounded to the rupee)
// for everyone who joins after the launch ends.
export const PRODUCTS = {
  typing_course: { founding: 6900, standard: 7900, label: 'Typing Master course', caps: [CAPS.TYPING_COURSE] },
  typing_complete: { founding: 9900, standard: 11400, label: 'Typing Complete', caps: [CAPS.TYPING_COURSE, CAPS.TYPING_MOCKS] },
  excel_mock: { founding: 11900, standard: 13700, label: 'Excel Mock', caps: [CAPS.EXCEL_MOCKS] },
  excel_complete: { founding: 13900, standard: 16000, label: 'Excel Complete', caps: [CAPS.EXCEL_MOCKS, CAPS.FORMULA_LIBRARY] },
  all_access: { founding: 16900, standard: 19400, label: 'All-Access', caps: [CAPS.TYPING_COURSE, CAPS.TYPING_MOCKS, CAPS.EXCEL_MOCKS, CAPS.FORMULA_LIBRARY] },
};

// Legacy single pass (pre-catalog) — grants everything so any existing buyer keeps access.
export const LEGACY_PASS_CAPS = [CAPS.TYPING_COURSE, CAPS.TYPING_MOCKS, CAPS.EXCEL_MOCKS, CAPS.FORMULA_LIBRARY];

// Server-side price for a product, honouring founding-member status.
export const priceOf = (product, isFounding = false) => {
  const p = PRODUCTS[product];
  if (!p) return undefined;
  return isFounding ? p.founding : p.standard;
};
export const capsOf = (product) => (product === 'pass' ? LEGACY_PASS_CAPS : (PRODUCTS[product]?.caps || []));

// Back-compat alias used by older code paths.
export const PRICES = { pass119: 11900 };

export const RAZORPAY = {
  keyId: process.env.RAZORPAY_KEY_ID || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
};

export const COOKIE_SECRET = process.env.COOKIE_SECRET || 'dev-only-change-me';

// SMS / OTP delivery. Fast2SMS is the wired provider. With no key set (or
// SMS_PROVIDER unset) the app falls back to logging the code in dev — no send.
//   route 'otp' : Fast2SMS OTP route, sends "Your OTP: <code>" — no DLT needed.
//   route 'dlt' : DLT route, needs an approved SMS_SENDER_ID + SMS_DLT_MESSAGE_ID.
export const SMS = {
  provider: (process.env.SMS_PROVIDER || '').toLowerCase(),
  apiKey: process.env.SMS_API_KEY || '',
  route: (process.env.SMS_ROUTE || 'otp').toLowerCase(),
  senderId: process.env.SMS_SENDER_ID || '',
  dltMessageId: process.env.SMS_DLT_MESSAGE_ID || '',
};

// Email delivery (SMTP) — used for the sign-up verification code. Defaults suit
// a Hostinger mailbox (smtp.hostinger.com:465, SSL). With no SMTP_USER/SMTP_PASS
// the code is logged in dev instead of sent. SMTP_FROM defaults to SMTP_USER.
export const SMTP = {
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT || 465),
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
  fromName: process.env.SMTP_FROM_NAME || 'High Court Clerk CPT',
};
