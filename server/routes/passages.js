import { Router } from 'express';
import { passages, passageSummary, getPassage } from '../content.js';
import { passOk } from '../requirePass.js';

// GET /api/passages          list (free always; body never included here)
// GET /api/passages/:slug    body — non-free is gated by requirePass in Phase 4
export const passagesRouter = Router();

passagesRouter.get('/', (_req, res) => {
  res.json({ passages: passages.map(passageSummary) });
});

passagesRouter.get('/:slug', async (req, res) => {
  const p = getPassage(req.params.slug);
  if (!p) return res.status(404).json({ error: 'That passage does not exist.' });
  if (!p.is_free && !(await passOk(req))) {
    return res.status(402).json({ error: 'This passage needs the ₹119 pass.', paywall: true });
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
