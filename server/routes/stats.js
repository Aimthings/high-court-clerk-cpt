import { Router } from 'express';
import crypto from 'node:crypto';
import { pool } from '../db.js';
import { passages, mocks, formulas } from '../content.js';

export const statsRouter = Router();

// The member count is a REAL figure or nothing at all — never a fabricated one.
// Below this floor the public endpoint returns members:null and the landing page
// simply omits the stat. Once verified accounts pass the floor, the true count
// starts to show. Change the floor here if the launch target moves.
export const MEMBER_DISPLAY_FLOOR = 10_000;

// Public counts for the landing page. Cached briefly so a spike of visitors does
// not hammer the DB. Content sizes come from the loaded catalogue (always true);
// the member count is gated by the floor above.
let cache = { at: 0, data: null };
const TTL_MS = 60_000;

statsRouter.get('/', async (_req, res) => {
  const now = Date.now();
  if (cache.data && now - cache.at < TTL_MS) return res.json(cache.data);

  let members = 0;
  try {
    // A "member" is a verified account — the honest headline number.
    const [[r]] = await pool.query('SELECT COUNT(*) AS n FROM users WHERE email_verified = 1');
    members = Number(r.n) || 0;
  } catch {
    members = 0; // DB hiccup: fall back to hiding the number, never guessing.
  }

  const data = {
    passages: passages.length,
    excelMocks: mocks.length,
    formulas: formulas.length,
    // Shown only once real registrations clear the floor; null => client hides it.
    members: members >= MEMBER_DISPLAY_FLOOR ? members : null,
  };
  cache = { at: now, data };
  return res.json(data);
});

// Owner-only live records: total accounts created, founding vs standard split,
// verified count, and recent sign-up velocity. Guarded by a shared secret in the
// x-admin-token header (set ADMIN_TOKEN in the environment). With no token set
// the endpoint stays closed. Never exposed on the public stats above.
statsRouter.get('/admin', async (req, res) => {
  const expected = process.env.ADMIN_TOKEN || '';
  const given = req.get('x-admin-token') || '';
  const ok =
    expected.length > 0 &&
    given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return res.status(404).json({ error: 'Not found.' });

  try {
    const [[tot]] = await pool.query('SELECT COUNT(*) AS n FROM users');
    const [[ver]] = await pool.query('SELECT COUNT(*) AS n FROM users WHERE email_verified = 1');
    const [[found]] = await pool.query('SELECT COUNT(*) AS n FROM users WHERE founding_member = 1');
    const [[std]] = await pool.query('SELECT COUNT(*) AS n FROM users WHERE founding_member = 0');
    const [[d1]] = await pool.query('SELECT COUNT(*) AS n FROM users WHERE created_at >= NOW() - INTERVAL 1 DAY');
    const [[d7]] = await pool.query('SELECT COUNT(*) AS n FROM users WHERE created_at >= NOW() - INTERVAL 7 DAY');
    const [[buyers]] = await pool.query('SELECT COUNT(DISTINCT user_id) AS n FROM orders WHERE status = \'paid\'');

    return res.json({
      accountsCreated: Number(tot.n) || 0,
      verified: Number(ver.n) || 0,
      foundingMembers: Number(found.n) || 0,
      standardMembers: Number(std.n) || 0,
      newLast24h: Number(d1.n) || 0,
      newLast7d: Number(d7.n) || 0,
      payingUsers: Number(buyers.n) || 0,
      memberFloor: MEMBER_DISPLAY_FLOOR,
      publicMemberCountLive: (Number(ver.n) || 0) >= MEMBER_DISPLAY_FLOOR,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Could not read records.' });
  }
});
