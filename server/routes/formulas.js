import { Router } from 'express';
import { z } from 'zod';
import { formulas, formulaSummary, getFormula, sanitizeFormula } from '../content.js';
import { gradeFormula } from '../grading/formula.js';
import { hasExcelAccess, isFreeFormula, isHiddenFormula } from '../access.js';

// Formula Library. Tutorials + graded practice. During the free launch (or for
// a buyer) every formula is open; otherwise the per-formula lock map applies:
// free formulas open, locked ones gated to the upsell, hidden ones omitted.
export const formulasRouter = Router();

// GET /api/formulas — list (no answer keys, no lesson data). Each summary
// carries a `free` flag; when locked, hidden formulas are dropped so section
// counts follow the visible cards. `unlocked` tells the client which view to render.
formulasRouter.get('/', async (req, res, next) => {
  try {
    const unlocked = await hasExcelAccess(req);
    const list = formulas
      .filter((f) => unlocked || !isHiddenFormula(f.slug))
      .map((f) => ({ ...formulaSummary(f), free: unlocked || isFreeFormula(f.slug) }));
    return res.json({ formulas: list, unlocked });
  } catch (e) { return next(e); }
});

// GET /api/formulas/:slug — tutorial + practice task, WITHOUT the answer key.
// A locked formula returns only its identity + { locked: true } so the lesson
// page can render the upsell; a hidden one 404s as if it were not there.
formulasRouter.get('/:slug', async (req, res, next) => {
  try {
    const f = getFormula(req.params.slug);
    if (!f) return res.status(404).json({ error: 'That lesson does not exist.' });
    const unlocked = await hasExcelAccess(req);
    if (!unlocked) {
      if (isHiddenFormula(f.slug)) return res.status(404).json({ error: 'That lesson does not exist.' });
      if (!isFreeFormula(f.slug)) {
        return res.json({ slug: f.slug, name: f.name, track: f.track, locked: true });
      }
    }
    return res.json({ ...sanitizeFormula(f), locked: false });
  } catch (e) { return next(e); }
});

// POST /api/formulas/:slug/practice — grade a submission, reveal the model answer.
const body = z.object({ formula: z.string().max(500) });
formulasRouter.post('/:slug/practice', async (req, res, next) => {
  try {
    const f = getFormula(req.params.slug);
    if (!f) return res.status(404).json({ error: 'That lesson does not exist.' });
    const unlocked = await hasExcelAccess(req);
    if (!unlocked && (isHiddenFormula(f.slug) || !isFreeFormula(f.slug))) {
      return res.status(403).json({ error: 'This formula is part of Excel practice.', locked: true });
    }
    const parsed = body.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter a formula.' });
    return res.json(gradeFormula(f, parsed.data.formula));
  } catch (e) { return next(e); }
});
