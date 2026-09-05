import { Router } from 'express';
import { passageSummary, getPassage, availablePassages, todaysPassage, isReleased } from '../content.js';
import { capabilityOk } from '../requirePass.js';
import { CAPS } from '../config.js';
import { streamPassagePdf } from '../services/passagePdf.js';

// GET /api/passages          list (free always; body never included here)
// GET /api/passages/:slug    body — non-free is gated by requirePass in Phase 4
export const passagesRouter = Router();

// Only passages released by today's drip schedule are listed; `new: true` marks
// the freshest one so the client can badge today's addition.
passagesRouter.get('/', (_req, res) => {
  const today = todaysPassage();
  res.json({
    passages: availablePassages().map((p) => ({ ...passageSummary(p), new: today ? p.slug === today.slug : false })),
  });
});

// Today's fresh passage (the newest one the drip has unlocked). null before day 7.
passagesRouter.get('/today', (_req, res) => {
  const p = todaysPassage();
  res.json({ passage: p ? passageSummary(p) : null });
});

// A4 printed passage PDF (gated for non-free). Exam mode links here instead of
// rendering the passage on screen.
passagesRouter.get('/:slug/pdf', async (req, res) => {
  const p = getPassage(req.params.slug);
  // A passage not yet reached by the daily drip is treated as non-existent.
  if (!p || !isReleased(p)) return res.status(404).json({ error: 'That passage does not exist.' });
  if (!p.is_free && !(await capabilityOk(req, CAPS.TYPING_MOCKS))) {
    return res.status(402).json({ error: 'This passage needs Typing Complete.', paywall: true });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${p.slug}.pdf"`);
  return streamPassagePdf(res, p);
});

passagesRouter.get('/:slug', async (req, res) => {
  const p = getPassage(req.params.slug);
  // A passage not yet reached by the daily drip is treated as non-existent.
  if (!p || !isReleased(p)) return res.status(404).json({ error: 'That passage does not exist.' });
  if (!p.is_free && !(await capabilityOk(req, CAPS.TYPING_MOCKS))) {
    return res.status(402).json({ error: 'This passage needs Typing Complete.', paywall: true });
  }
  return res.json({
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    difficulty: p.difficulty,
    word_count: p.word_count,
    is_free: p.is_free,
    body: p.body,
  });
});
