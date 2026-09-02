import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getPassage } from '../content.js';
import { scoreTyping } from '../grading/typing.js';
import { passOk } from '../requirePass.js';
import { getUserId } from '../auth.js';
import { pool } from '../db.js';
import { typingRankable } from '../services/rank.js';
import { personalRank } from '../services/leaderboard.js';

// Typing runner API. Scoring is server-authoritative; elapsed time is derived
// server-side from the recorded start (brief §5.1, §5.4). Persistence to MySQL
// and rankability arrive in Phases 4–5; Phase 2 keeps attempts in memory.
export const typingRouter = Router();

const DURATION_SEC = 600; // 10-minute paper
const attempts = new Map(); // attemptId -> { slug, mode, startedAt }

const startBody = z.object({
  slug: z.string().min(1),
  mode: z.enum(['practice', 'drill', 'exam']).default('practice'),
});

typingRouter.post('/start', async (req, res) => {
  const parsed = startBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Choose a passage to start.' });
  const { slug, mode } = parsed.data;
  const p = getPassage(slug);
  if (!p) return res.status(404).json({ error: 'That passage does not exist.' });

  // Entitlement checked at start only (brief §5.5); free passages are exempt.
  if (!p.is_free && !(await passOk(req))) {
    return res.status(402).json({ error: 'This passage needs the ₹119 pass.', paywall: true });
  }

  const attemptId = randomUUID();
  attempts.set(attemptId, { slug, mode, startedAt: Date.now() });

  res.json({
    attemptId,
    mode,
    durationSec: DURATION_SEC,
    passage: {
      slug: p.slug,
      title: p.title,
      category: p.category,
      word_count: p.word_count,
      // Exam mode renders NO passage text in the DOM — only a printed PDF (Phase 6).
      body: mode === 'exam' ? undefined : p.body,
    },
  });
});

// GET /api/typing/history — last 50 attempts for the signed-in candidate.
typingRouter.get('/history', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Sign in to see your history.', needsAuth: true });
    const [rows] = await pool.query(
      `SELECT ta.created_at, ta.mode, ta.sssc_wpm, ta.accuracy_pct, ta.mistakes_char,
              ta.passed, p.title, p.slug
       FROM typing_attempts ta JOIN passages p ON p.id = ta.passage_id
       WHERE ta.user_id = ? ORDER BY ta.created_at DESC LIMIT 50`,
      [userId],
    );
    return res.json({ attempts: rows });
  } catch (e) { return next(e); }
});

const submitBody = z.object({
  attemptId: z.string().uuid(),
  typed: z.string().max(20000), // 20,000-char cap at the API boundary (brief §5)
  keyEvents: z.number().int().nonnegative().optional(),
  medianIntervalMs: z.number().nonnegative().optional(),
});

typingRouter.post('/attempt', async (req, res, next) => {
  try {
    const parsed = submitBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Could not read the submission.' });
    const { attemptId, typed, keyEvents, medianIntervalMs } = parsed.data;

    const rec = attempts.get(attemptId);
    if (!rec) return res.status(404).json({ error: 'This attempt has expired. Start the passage again.' });
    const p = getPassage(rec.slug);

    // Elapsed derived server-side, capped at the paper duration.
    const elapsedSec = Math.min(DURATION_SEC, Math.round((Date.now() - rec.startedAt) / 1000));
    const durationSec = rec.mode === 'exam' ? DURATION_SEC : Math.max(1, elapsedSec);

    const result = scoreTyping({ passage: p.body, typed, durationSec });
    attempts.delete(attemptId);

    // Persist + set rankability at WRITE time for signed-in candidates.
    const userId = getUserId(req);
    let ranked = null;
    if (userId) {
      try {
        const [[prof]] = await pool.query('SELECT listed FROM profiles WHERE user_id = ?', [userId]);
        const [[prior]] = await pool.query(
          'SELECT COUNT(*) AS n FROM typing_attempts WHERE user_id = ? AND passage_id = ? AND status <> \'abandoned\'',
          [userId, p.id],
        );
        const isFirst = (prior?.n || 0) === 0;
        const { rankable, status } = typingRankable({
          mode: rec.mode, durationSec, isFirst, verified: true, listed: prof?.listed === 1,
          ssscWpm: result.ssscWpm, keyEvents, chars: typed.length, medianIntervalMs,
        });
        await pool.query(
          `INSERT INTO typing_attempts
             (user_id, passage_id, mode, duration_sec, typed_text, words_typed, mistakes_word,
              mistakes_char, sssc_wpm, gross_wpm, accuracy_pct, taxonomy, passed, rankable, status, key_events)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [userId, p.id, rec.mode, durationSec, typed, result.wordsTyped, result.mistakesWord,
            result.mistakesChar, result.ssscWpm, result.grossWpm, result.accuracyPct,
            JSON.stringify(result.taxonomy), result.passed ? 1 : 0, rankable, status, keyEvents ?? null],
        );
        if (rankable) {
          ranked = await personalRank('typing', result.ssscWpm).catch(() => null);
        }
      } catch { /* scoring already returned; persistence is best-effort here */ }
    }

    return res.json({
      attemptId,
      mode: rec.mode,
      passage: { slug: p.slug, title: p.title, word_count: p.word_count },
      durationSec,
      ...result,
      displayModel: 'char', // stricter (char) model is the default
      ranked, // { rnk, total } when this attempt is rankable, else null
    });
  } catch (e) { return next(e); }
});
