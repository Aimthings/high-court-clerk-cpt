import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { mocks, mockSummary, getMock, sanitizeSpec } from '../content.js';
import { gradeExcel } from '../grading/excel.js';

// Excel simulator API (brief §4). /start returns the spec WITHOUT assertions,
// answers or hints; grading is server-side; elapsed derived from the recorded
// start. Persistence + requirePass gating arrive in Phase 4.
export const excelRouter = Router();

const attempts = new Map(); // attemptId -> { code, startedAt }

excelRouter.get('/mocks', (_req, res) => {
  res.json({ mocks: mocks.map(mockSummary) });
});

const startBody = z.object({ mockCode: z.string().min(1) });

excelRouter.post('/start', (req, res) => {
  const parsed = startBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Choose a mock to start.' });
  const m = getMock(parsed.data.mockCode);
  if (!m) return res.status(404).json({ error: 'That mock does not exist.' });
  // TODO Phase 4: requirePass for non-free mocks, checked here only.

  const attemptId = randomUUID();
  attempts.set(attemptId, { code: m.code, startedAt: Date.now() });
  res.json({ attemptId, durationSec: m.spec.durationSec, spec: sanitizeSpec(m.spec) });
});

const submitBody = z.object({
  attemptId: z.string().uuid(),
  workbook: z.object({
    filename: z.string().max(120).optional(),
    cells: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
    chart: z.any().optional(),
    saves: z.array(z.any()).max(50).optional(),
  }),
});

excelRouter.post('/submit', (req, res) => {
  const parsed = submitBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Could not read the workbook.' });
  const { attemptId, workbook } = parsed.data;
  const rec = attempts.get(attemptId);
  if (!rec) return res.status(404).json({ error: 'This attempt has expired. Start the mock again.' });

  const m = getMock(rec.code);
  const elapsedSec = Math.round((Date.now() - rec.startedAt) / 1000);
  const result = gradeExcel(m.spec, workbook || {});
  attempts.delete(attemptId);

  res.json({ attemptId, code: m.code, title: m.title, elapsedSec, ...result });
});
