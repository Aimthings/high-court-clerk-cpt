import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getPassage } from '../content.js';
import { scoreTyping } from '../grading/typing.js';
import { passOk } from '../requirePass.js';

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

const submitBody = z.object({
  attemptId: z.string().uuid(),
  typed: z.string().max(20000), // 20,000-char cap at the API boundary (brief §5)
});

typingRouter.post('/attempt', (req, res) => {
  const parsed = submitBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Could not read the submission.' });
  const { attemptId, typed } = parsed.data;

  const rec = attempts.get(attemptId);
  if (!rec) return res.status(404).json({ error: 'This attempt has expired. Start the passage again.' });
  const p = getPassage(rec.slug);

  // Elapsed derived server-side, capped at the paper duration.
  const elapsedSec = Math.min(DURATION_SEC, Math.round((Date.now() - rec.startedAt) / 1000));
  const durationSec = rec.mode === 'exam' ? DURATION_SEC : Math.max(1, elapsedSec);

  const result = scoreTyping({ passage: p.body, typed, durationSec });
  attempts.delete(attemptId);

  res.json({
    attemptId,
    mode: rec.mode,
    passage: { slug: p.slug, title: p.title, word_count: p.word_count },
    durationSec,
    ...result,
    // The stricter (char) model is the default; both are returned and labelled.
    displayModel: 'char',
  });
});
