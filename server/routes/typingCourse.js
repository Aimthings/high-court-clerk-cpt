import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { getUserId } from '../auth.js';

// Typing Master progress sync. Practice-only, never rankable — this just lets a
// signed-in candidate's learn-to-type progress follow their account across devices
// and survive a cleared browser. Guests keep progress in localStorage only.
export const typingCourseRouter = Router();

// GET /api/typing-course/progress — the signed-in user's lessons map.
typingCourseRouter.get('/progress', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.json({ lessons: {} });
    const [rows] = await pool.query(
      `SELECT lesson_slug, best_accuracy, best_wpm, stars, cleared, attempts, key_stats
       FROM typing_lesson_progress WHERE user_id = ?`,
      [userId],
    );
    const lessons = {};
    for (const r of rows) {
      lessons[r.lesson_slug] = {
        bestAccuracy: r.best_accuracy,
        bestWpm: Number(r.best_wpm),
        stars: r.stars,
        cleared: r.cleared === 1,
        attempts: r.attempts,
        keyStats: r.key_stats || {},
      };
    }
    return res.json({ lessons });
  } catch (e) { return next(e); }
});

const lessonSchema = z.object({
  slug: z.string().min(1).max(60),
  bestAccuracy: z.number().int().min(0).max(100),
  bestWpm: z.number().min(0).max(400),
  stars: z.number().int().min(0).max(3),
  cleared: z.boolean(),
  attempts: z.number().int().min(0).max(100000),
  keyStats: z.record(z.string(), z.object({ correct: z.number().int().min(0), total: z.number().int().min(0) })).optional(),
});
const bodySchema = z.object({ lessons: z.array(lessonSchema).max(200) });

// POST /api/typing-course/progress — upsert best-merged lessons for the user.
typingCourseRouter.post('/progress', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Sign in to save progress.', needsAuth: true });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Could not read the progress.' });

    for (const l of parsed.data.lessons) {
      // Keep the best of what the server has and what the client sends.
      await pool.query(
        `INSERT INTO typing_lesson_progress
           (user_id, lesson_slug, best_accuracy, best_wpm, stars, cleared, attempts, key_stats)
         VALUES (?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           best_accuracy = GREATEST(best_accuracy, VALUES(best_accuracy)),
           best_wpm      = GREATEST(best_wpm, VALUES(best_wpm)),
           stars         = GREATEST(stars, VALUES(stars)),
           cleared       = GREATEST(cleared, VALUES(cleared)),
           attempts      = GREATEST(attempts, VALUES(attempts)),
           key_stats     = VALUES(key_stats)`,
        [userId, l.slug, l.bestAccuracy, l.bestWpm, l.stars, l.cleared ? 1 : 0, l.attempts, JSON.stringify(l.keyStats || {})],
      );
    }
    return res.json({ saved: true });
  } catch (e) { return next(e); }
});
