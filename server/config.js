// Central config. Values come from the environment; amounts are server-side
// constants in paise and are never read from a request (brief §5.7).

export const PORT = Number(process.env.PORT || 4000);
export const NODE_ENV = process.env.NODE_ENV || 'development';

// Free-launch master switch. While true, everything is unlocked (typing mocks,
// Excel mocks and every formula). Flip to false (LAUNCH_FREE=false in the env)
// to end the launch and apply the per-formula lock map to non-buyers.
export const LAUNCH_FREE = process.env.LAUNCH_FREE !== 'false';

export const DB = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'hcc',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hcc_cpt',
  connectionLimit: Number(process.env.DB_POOL || 10),
};

// Product prices, in paise. Constant — never trust a client amount.
export const PRICES = {
  pass119: 11900,
};

export const RAZORPAY = {
  keyId: process.env.RAZORPAY_KEY_ID || '',
  keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
};

export const COOKIE_SECRET = process.env.COOKIE_SECRET || 'dev-only-change-me';
