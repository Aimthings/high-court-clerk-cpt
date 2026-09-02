import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { getUserId } from '../auth.js';
import { getBoard, getMe } from '../services/leaderboard.js';
import { BOARDS, validateHandle, daysSince } from '../services/rank.js';
import { renderShareCard } from '../services/shareCard.js';

export const leaderboardRouter = Router();
export const profileRouter = Router();

const boardOf = (q) => (BOARDS.includes(q) ? q : 'typing');
const METRIC_UNIT = { typing: 'W.P.M.', excel: 'marks', overall: 'readiness' };

// 60s in-memory cache for the public board (brief §4).
const cache = new Map();
function cached(key, ttlMs, producer) {
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return Promise.resolve(hit.val);
  return producer().then((val) => { cache.set(key, { val, exp: Date.now() + ttlMs }); return val; });
}

// GET /api/leaderboard — public, no auth, 60s cache. Handle + state only.
leaderboardRouter.get('/', async (req, res, next) => {
  try {
    const board = boardOf(req.query.board);
    const data = await cached(`board:${board}`, 60_000, () => getBoard(board, { limit: 100 }));
    res.set('Cache-Control', 'public, max-age=60');
    res.json(data);
  } catch (e) { next(e); }
});

// GET /api/leaderboard/me — never cached.
leaderboardRouter.get('/me', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Sign in to see your rank.', needsAuth: true });
    const board = boardOf(req.query.board);
    res.set('Cache-Control', 'no-store');
    res.json(await getMe(board, userId));
  } catch (e) { next(e); }
});

// GET /api/leaderboard/card.png — the signed-in candidate's own share card.
leaderboardRouter.get('/card.png', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Sign in first.' });
    const board = boardOf(req.query.board);
    const me = await getMe(board, userId);
    if (!me.ranked) return res.status(404).json({ error: 'No ranked attempt yet.' });
    const png = renderShareCard({
      percentileText: `Top ${me.you.pct}%`,
      boardLabel: board,
      metricText: board === 'typing' ? Number(me.you.metric).toFixed(1) : String(me.you.metric),
      metricUnit: METRIC_UNIT[board],
      handle: me.you.handle,
    });
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'private, max-age=300');
    res.send(png);
  } catch (e) { next(e); }
});

// PATCH /api/profile/handle — once per 30 days, profanity-filtered.
const handleBody = z.object({ handle: z.string().min(1).max(60) });
profileRouter.patch('/handle', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Sign in first.', needsAuth: true });
    const parsed = handleBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter a handle.' });
    const check = validateHandle(parsed.data.handle);
    if (!check.ok) return res.status(400).json({ error: check.error });

    const [[prof]] = await pool.query('SELECT handle_set_at FROM profiles WHERE user_id = ?', [userId]);
    if (prof && daysSince(prof.handle_set_at) < 30) {
      return res.status(429).json({ error: 'A handle can be changed once every 30 days.' });
    }
    await pool.query(
      `INSERT INTO profiles (user_id, handle, handle_set_at, listed) VALUES (?, ?, NOW(), 1)
       ON DUPLICATE KEY UPDATE handle = VALUES(handle), handle_set_at = NOW()`,
      [userId, check.handle],
    );
    return res.json({ handle: check.handle });
  } catch (e) { return next(e); }
});

// PATCH /api/profile/listed — opt out of public listing (removes rows at once).
const listedBody = z.object({ listed: z.boolean() });
profileRouter.patch('/listed', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Sign in first.', needsAuth: true });
    const parsed = listedBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Choose on or off.' });
    const listed = parsed.data.listed ? 1 : 0;
    await pool.query(
      `INSERT INTO profiles (user_id, listed) VALUES (?, ?) ON DUPLICATE KEY UPDATE listed = VALUES(listed)`,
      [userId, listed],
    );
    // Privacy: remove the candidate from the boards immediately when opting out.
    if (!listed) await pool.query('DELETE FROM leaderboard_entries WHERE user_id = ?', [userId]);
    return res.json({ listed: Boolean(listed) });
  } catch (e) { return next(e); }
});
