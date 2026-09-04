import { Router } from 'express';
import { passages, passageSummary, getPassage } from '../content.js';
import { capabilityOk } from '../requirePass.js';
import { CAPS } from '../config.js';
import { streamPassagePdf } from '../services/passagePdf.js';

// GET /api/passages          list (free always; body never included here)
// GET /api/passages/:slug    body — non-free is gated by requirePass in Phase 4
export const passagesRouter = Router();

passagesRouter.get('/', (_req, res) => {
  res.json({ passages: passages.map(passageSummary) });
});

// A4 printed passage PDF (gated for non-free). Exam mode links here instead of
// rendering the passage on screen.
passagesRouter.get('/:slug/pdf', async (req, res) => {
  const p = getPassage(req.params.slug);
  if (!p) return res.status(404).json({ error: 'That passage does not exist.' });
  if (!p.is_free && !(await capabilityOk(req, CAPS.TYPING_MOCKS))) {
    return res.status(402).json({ error: 'This passage needs Typing Complete.', paywall: true });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${p.slug}.pdf"`);
  return streamPassagePdf(res, p);
});

passagesRouter.get('/:slug', async (req, res) => {
  const p = getPassage(req.params.slug);
  if (!p) return res.status(404).json({ error: 'That passage does not exist.' });
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
