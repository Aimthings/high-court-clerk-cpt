import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { mocks, mockSummary, getMock, sanitizeSpec } from '../content.js';
import { gradeExcel } from '../grading/excel.js';
import { passOk } from '../requirePass.js';
import { getUserId } from '../auth.js';
import { pool } from '../db.js';
import { excelRankable } from '../services/rank.js';
import { personalRank } from '../services/leaderboard.js';

// Excel simulator API (brief §4). /start returns the spec WITHOUT assertions,
// answers or hints; grading is server-side; elapsed derived from the recorded
// start. Persistence + requirePass gating arrive in Phase 4.
export const excelRouter = Router();

const attempts = new Map(); // attemptId -> { code, startedAt }

excelRouter.get('/mocks', (_req, res) => {
  res.json({ mocks: mocks.map(mockSummary) });
});

const startBody = z.object({ mockCode: z.string().min(1) });

excelRouter.post('/start', async (req, res) => {
  const parsed = startBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Choose a mock to start.' });
  const m = getMock(parsed.data.mockCode);
  if (!m) return res.status(404).json({ error: 'That mock does not exist.' });

  // Entitlement is checked HERE ONLY (brief §5.5): a pass expiring mid-attempt
  // cannot eject the candidate, because it is never re-checked at /submit.
  if (!m.is_free && !(await passOk(req))) {
    return res.status(402).json({ error: 'This mock needs the ₹119 pass.', paywall: true });
  }

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

excelRouter.post('/submit', async (req, res, next) => {
  try {
    const parsed = submitBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Could not read the workbook.' });
    const { attemptId, workbook } = parsed.data;
    const rec = attempts.get(attemptId);
    if (!rec) return res.status(404).json({ error: 'This attempt has expired. Start the mock again.' });

    const m = getMock(rec.code);
    const startedAt = new Date(rec.startedAt);
    const elapsedSec = Math.round((Date.now() - rec.startedAt) / 1000);
    const result = gradeExcel(m.spec, workbook || {});
    attempts.delete(attemptId);

    const userId = getUserId(req);
    let ranked = null;
    if (userId) {
      try {
        const [[prof]] = await pool.query('SELECT listed FROM profiles WHERE user_id = ?', [userId]);
        const [[prior]] = await pool.query(
          'SELECT COUNT(*) AS n FROM excel_attempts WHERE user_id = ? AND mock_id = ? AND status = \'submitted\'',
          [userId, m.id],
        );
        const isFirst = (prior?.n || 0) === 0;
        const { rankable, status } = excelRankable({ elapsedSec, isFirst, verified: true, listed: prof?.listed === 1 });
        await pool.query(
          `INSERT INTO excel_attempts
             (user_id, mock_id, started_at, submitted_at, marks, passed, answers, rankable, status)
           VALUES (?,?,?,NOW(),?,?,?,?,?)`,
          [userId, m.id, startedAt, result.marks, result.passed ? 1 : 0, JSON.stringify(workbook || {}), rankable, status],
        );
        if (rankable) ranked = await personalRank('excel', result.marks).catch(() => null);
      } catch { /* grade already computed; persistence is best-effort */ }
    }

    return res.json({ attemptId, code: m.code, title: m.title, elapsedSec, ...result, ranked });
  } catch (e) { return next(e); }
});
