import { Router } from 'express';
import { z } from 'zod';
import { formulas, formulaSummary, getFormula, sanitizeFormula } from '../content.js';
import { gradeFormula } from '../grading/formula.js';

// Formula Library. Tutorials + graded practice. Free during launch; the daily/
// total free cap and the ₹119 gate are layered in with the monetization phase.
export const formulasRouter = Router();

// GET /api/formulas — list (no answer keys, no lesson data).
formulasRouter.get('/', (_req, res) => {
  res.json({ formulas: formulas.map(formulaSummary) });
});

// GET /api/formulas/:slug — tutorial + practice task, WITHOUT the answer key.
formulasRouter.get('/:slug', (req, res) => {
  const f = getFormula(req.params.slug);
  if (!f) return res.status(404).json({ error: 'That lesson does not exist.' });
  return res.json(sanitizeFormula(f));
});

// POST /api/formulas/:slug/practice — grade a submission, reveal the model answer.
const body = z.object({ formula: z.string().max(500) });
formulasRouter.post('/:slug/practice', (req, res) => {
  const f = getFormula(req.params.slug);
  if (!f) return res.status(404).json({ error: 'That lesson does not exist.' });
  const parsed = body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a formula.' });
  return res.json(gradeFormula(f, parsed.data.formula));
});
