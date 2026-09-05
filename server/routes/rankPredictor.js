import { Router } from 'express';
import express from 'express';
import crypto from 'node:crypto';
import { pool } from '../db.js';
import { getUserId } from '../auth.js';
import { isAdminEmail, RANK_PREDICTOR_LIVE, RANK_MARKING, RANK_CATEGORIES, RANK_EXAM } from '../config.js';
import { parseResponseSheet } from '../services/rankParse.js';
import { scoreSheet, poolStats } from '../services/rankScore.js';

// Rank Predictor API. Two steps, so the candidate verifies the parse before it is
// scored (matches the design's confirmation screen):
//   POST /preview  (raw application/pdf)     -> parse only, returns a token + meta
//   POST /submit   (json {token, category})  -> score + store + rank
// Gated: public only when RANK_PREDICTOR_LIVE; admins always (testable early).
export const rankPredictorRouter = Router();

const previews = new Map(); // token -> { questions, meta, at }
const TTL_MS = 15 * 60 * 1000;
const sweep = () => { const now = Date.now(); for (const [k, v] of previews) if (now - v.at > TTL_MS) previews.delete(k); };

async function isAdminReq(req) {
  const uid = getUserId(req);
  if (!uid) return false;
  try {
    const [[u]] = await pool.query('SELECT email FROM users WHERE id = ?', [uid]);
    return isAdminEmail(u?.email);
  } catch { return false; }
}
async function ensureAllowed(req, res) {
  const admin = await isAdminReq(req);
  if (!RANK_PREDICTOR_LIVE && !admin) {
    res.status(403).json({ error: 'The rank predictor opens when the Commission releases the answer key.', comingSoon: true });
    return false;
  }
  return true;
}

rankPredictorRouter.get('/config', async (req, res) => {
  const admin = await isAdminReq(req);
  res.json({
    live: RANK_PREDICTOR_LIVE || admin,
    publicLive: RANK_PREDICTOR_LIVE,
    admin,
    exam: RANK_EXAM.label,
    categories: RANK_CATEGORIES,
    marking: RANK_MARKING,
  });
});

rankPredictorRouter.post('/preview', express.raw({ type: ['application/pdf', 'application/octet-stream'], limit: '15mb' }), async (req, res, next) => {
  try {
    if (!(await ensureAllowed(req, res))) return undefined;
    if (!req.body || !req.body.length) return res.status(400).json({ error: 'Upload your response-sheet PDF.' });

    let parsed;
    try { parsed = await parseResponseSheet(req.body); }
    catch { return res.status(422).json({ error: 'We could not read that PDF. Upload the official response-sheet file with the ✓/✗ marks.' }); }

    const { questions, meta } = parsed;
    const keyed = questions.filter((q) => q.correct).length;
    if (questions.length < 5 || keyed < Math.ceil(questions.length * 0.6)) {
      return res.status(422).json({ error: 'That does not look like the official answer-key sheet (the correct-answer ticks were not found).' });
    }
    sweep();
    const token = crypto.randomUUID();
    previews.set(token, { questions, meta, at: Date.now() });
    const answered = questions.filter((q) => q.chosen && q.chosen !== '--').length;
    return res.json({
      token,
      meta,
      totalQ: questions.length,
      answered,
      left: questions.length - answered,
      exam: RANK_EXAM.label,
    });
  } catch (e) { return next(e); }
});

rankPredictorRouter.post('/submit', async (req, res, next) => {
  try {
    if (!(await ensureAllowed(req, res))) return undefined;
    const { token, category } = req.body || {};
    if (!RANK_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Choose your category.' });
    const rec = token && previews.get(token);
    if (!rec) return res.status(410).json({ error: 'That upload expired — please upload the PDF again.' });

    const { questions, meta } = rec;
    const s = scoreSheet(questions, RANK_MARKING);
    const examKey = (RANK_EXAM.label || 'exam').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
    const rollHash = crypto.createHash('sha256')
      .update(`${examKey}:${meta.rollNo || ''}:${s.totalQ}:${s.correct}:${s.wrong}:${s.answered}`)
      .digest('hex');
    const userId = getUserId(req);

    try {
      await pool.query(
        `INSERT INTO rank_submissions
           (user_id, exam_key, category, roll_hash, total_q, answered, correct, wrong, left_blank, score, max_score, sections)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE category=VALUES(category), score=VALUES(score), correct=VALUES(correct),
           wrong=VALUES(wrong), answered=VALUES(answered), left_blank=VALUES(left_blank), sections=VALUES(sections)`,
        [userId || null, examKey, category, rollHash, s.totalQ, s.answered, s.correct, s.wrong, s.left,
          s.score, s.maxScore, JSON.stringify(s.sections)],
      );
    } catch { /* storage best-effort */ }

    let scores = [s.score];
    try {
      const [rows] = await pool.query('SELECT score FROM rank_submissions WHERE exam_key = ? AND category = ?', [examKey, category]);
      if (rows.length) scores = rows.map((r) => Number(r.score));
    } catch { /* single-point pool */ }
    const stats = poolStats(scores, s.score, { totalCandidates: RANK_EXAM.totalCandidates });

    previews.delete(token);
    return res.json({
      exam: RANK_EXAM.label, category, meta, marking: RANK_MARKING,
      score: s.score, rawScore: s.rawScore, negLost: s.negLost, maxScore: s.maxScore,
      totalQ: s.totalQ, answered: s.answered, correct: s.correct, wrong: s.wrong, left: s.left,
      accuracy: s.accuracy, sections: s.sections,
      questions: questions.map((q) => ({ q: q.q, chosen: q.chosen, correct: q.correct })),
      stats,
    });
  } catch (e) { return next(e); }
});
