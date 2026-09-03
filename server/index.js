// Express entry point.

import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { PORT, NODE_ENV, COOKIE_SECRET } from './config.js';
import { ping } from './db.js';
import { passagesRouter } from './routes/passages.js';
import { typingRouter } from './routes/typing.js';
import { excelRouter } from './routes/excel.js';
import { authRouter } from './routes/auth.js';
import { ordersRouter, webhookHandler } from './routes/orders.js';
import { leaderboardRouter, profileRouter } from './routes/leaderboard.js';
import { formulasRouter } from './routes/formulas.js';
import { startReconcileCron } from './jobs/reconcileOrders.js';
import { startLeaderboardCron } from './jobs/rebuildLeaderboard.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(pinoHttp({ level: NODE_ENV === 'production' ? 'info' : 'debug' }));
app.use(cookieParser(COOKIE_SECRET));

// The Razorpay webhook MUST parse the RAW body and mount BEFORE express.json()
// so the HMAC is computed over the exact bytes Razorpay signed (brief §5.8).
app.post('/api/orders/webhook', express.raw({ type: '*/*', limit: '1mb' }), webhookHandler);

// JSON parser for every other route.
app.use(express.json({ limit: '256kb' }));

app.use(rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', async (_req, res) => {
  const db = await ping();
  res.json({ status: 'ok', db, env: NODE_ENV });
});

app.use('/api/auth', authRouter);
app.use('/api/passages', passagesRouter);
app.use('/api/typing', typingRouter);
app.use('/api/excel', excelRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/profile', profileRouter);
app.use('/api/formulas', formulasRouter);

// Unknown API routes return JSON, not HTML.
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

// Serve the built React app as a SINGLE deployable web app (Hostinger Web App
// target). On a VPS, nginx serves the static files and only proxies /api here,
// so this is harmless there; set SERVE_CLIENT=false to disable it. The
// `extensions:['html']` option serves the prerendered per-route HTML (SEO), and
// the wildcard falls back to index.html for client-side routes.
const clientDist = join(dirname(fileURLToPath(import.meta.url)), '..', 'client', 'dist');
if (process.env.SERVE_CLIENT !== 'false' && existsSync(clientDist)) {
  app.use(express.static(clientDist, { extensions: ['html'], index: 'index.html' }));
  app.get('*', (_req, res) => res.sendFile(join(clientDist, 'index.html')));
}

// Global error handler — leaks no stack traces (brief §7).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  req.log?.error({ err }, 'unhandled error');
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Something went wrong. Please try again.' : err.message,
  });
});

async function boot() {
  if (process.env.RUN_MIGRATIONS === 'true') {
    try {
      const { migrate } = await import('./db-migrate.js');
      await migrate();
      // eslint-disable-next-line no-console
      console.log('migrations applied');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('migration on boot failed', e.message);
    }
  }
  if (NODE_ENV === 'production') { startReconcileCron(); startLeaderboardCron(); }
  // Bind all interfaces so a managed host's proxy (Hostinger Web App) can reach
  // it; on a VPS, nginx proxies to 127.0.0.1:PORT and the firewall blocks PORT
  // externally. Override with HOST if needed.
  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on ${HOST}:${PORT} (${NODE_ENV})`);
  });
}
boot();

export default app;
