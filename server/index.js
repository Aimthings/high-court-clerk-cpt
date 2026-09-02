// Express entry point. Phase 1 scaffolds the app, security middleware, a health
// check and the error handler. Domain routes are mounted in later phases.

import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { PORT, NODE_ENV, COOKIE_SECRET } from './config.js';
import { ping } from './db.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(pinoHttp({ level: NODE_ENV === 'production' ? 'info' : 'debug' }));

// NOTE: the Razorpay webhook mounts with express.raw() BEFORE express.json()
// (brief §5.8). It is added in Phase 4, ahead of the json parser below.

app.use(express.json({ limit: '256kb' }));
app.use(cookieParser(COOKIE_SECRET));

// Baseline rate limit; per-route limits tightened in Phase 7.
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/api/health', async (_req, res) => {
  const db = await ping();
  res.json({ status: 'ok', db, env: NODE_ENV });
});

// Global error handler — leaks no stack traces (brief §7).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  req.log?.error({ err }, 'unhandled error');
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Something went wrong. Please try again.' : err.message,
  });
});

app.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://127.0.0.1:${PORT} (${NODE_ENV})`);
});

export default app;
