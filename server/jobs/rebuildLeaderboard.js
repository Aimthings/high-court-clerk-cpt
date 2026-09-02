// Rebuilds leaderboard_entries every 5 minutes (brief §5). Each user's SINGLE
// BEST attempt row is chosen with ROW_NUMBER() OVER (PARTITION BY user_id ...)
// keeping rn = 1 — never MAX() on columns independently. Only listed, verified,
// rankable attempts are considered; toggling board-visibility off removes a user
// on the next rebuild (and immediately via PATCH /profile/listed).
import { pool } from '../db.js';
import { overallMetric } from '../services/rank.js';

// Best rankable typing row per user, already ranked.
const TYPING_SQL = `
  SELECT user_id, metric, tiebreak, attempts
  FROM (
    SELECT ta.user_id,
           ta.sssc_wpm AS metric,
           ta.accuracy_pct AS tiebreak,
           ROW_NUMBER() OVER (PARTITION BY ta.user_id ORDER BY ta.sssc_wpm DESC, ta.accuracy_pct DESC, ta.created_at ASC) AS rn,
           COUNT(*) OVER (PARTITION BY ta.user_id) AS attempts
    FROM typing_attempts ta
    JOIN profiles p ON p.user_id = ta.user_id AND p.listed = 1
    JOIN users u ON u.id = ta.user_id AND u.phone IS NOT NULL
    WHERE ta.rankable = 1 AND ta.status = 'complete'
  ) x
  WHERE rn = 1
`;

const EXCEL_SQL = `
  SELECT user_id, metric, tiebreak, attempts
  FROM (
    SELECT ea.user_id,
           ea.marks AS metric,
           TIMESTAMPDIFF(SECOND, ea.started_at, ea.submitted_at) AS tiebreak,
           ROW_NUMBER() OVER (PARTITION BY ea.user_id ORDER BY ea.marks DESC, TIMESTAMPDIFF(SECOND, ea.started_at, ea.submitted_at) ASC, ea.submitted_at ASC) AS rn,
           COUNT(*) OVER (PARTITION BY ea.user_id) AS attempts
    FROM excel_attempts ea
    JOIN profiles p ON p.user_id = ea.user_id AND p.listed = 1
    JOIN users u ON u.id = ea.user_id AND u.phone IS NOT NULL
    WHERE ea.rankable = 1 AND ea.status = 'submitted'
  ) x
  WHERE rn = 1
`;

// Rank an array of {user_id, metric, tiebreak, attempts} in JS (dense competition
// ranking) and attach rnk + pct. `higherTiebreakWins` picks accuracy(desc) for
// typing vs time(asc) for excel.
function rankRows(rows, { tiebreakAsc }) {
  const sorted = [...rows].sort((a, b) => {
    if (b.metric !== a.metric) return b.metric - a.metric;
    const t = (a.tiebreak ?? 0) - (b.tiebreak ?? 0);
    return tiebreakAsc ? t : -t;
  });
  const total = sorted.length;
  return sorted.map((r, i) => ({
    ...r,
    rnk: i + 1,
    pct: total > 0 ? Math.max(1, Math.round(100 * ((i + 1) / total))) : 100,
  }));
}

async function writeBoard(conn, board, rows) {
  // carry the previous rank before replacing
  const [prev] = await conn.query('SELECT user_id, rnk FROM leaderboard_entries WHERE board = ?', [board]);
  const prevRnk = new Map(prev.map((p) => [p.user_id, p.rnk]));

  await conn.query('DELETE FROM leaderboard_entries WHERE board = ?', [board]);
  if (rows.length === 0) return;

  const values = rows.map((r) => [
    board, r.user_id, r.metric, r.tiebreak ?? null, r.rnk, r.pct, r.attempts ?? 1,
    prevRnk.has(r.user_id) ? prevRnk.get(r.user_id) : null,
  ]);
  await conn.query(
    `INSERT INTO leaderboard_entries (board, user_id, metric, tiebreak, rnk, pct, attempts, prev_rnk)
     VALUES ?`,
    [values],
  );
}

export async function rebuildLeaderboard() {
  const conn = await pool.getConnection();
  try {
    const [typing] = await conn.query(TYPING_SQL);
    const [excel] = await conn.query(EXCEL_SQL);

    // overall: users rankable on BOTH boards; metric from each user's best.
    const wpmBy = new Map(typing.map((r) => [r.user_id, r.metric]));
    const marksBy = new Map(excel.map((r) => [r.user_id, r.metric]));
    const overall = [];
    for (const [uid, wpm] of wpmBy) {
      if (marksBy.has(uid)) {
        overall.push({ user_id: uid, metric: overallMetric(wpm, marksBy.get(uid)), tiebreak: wpm, attempts: 1 });
      }
    }

    const typingRanked = rankRows(typing, { tiebreakAsc: false });
    const excelRanked = rankRows(excel, { tiebreakAsc: true });
    const overallRanked = rankRows(overall, { tiebreakAsc: false });

    await conn.beginTransaction();
    await writeBoard(conn, 'typing', typingRanked);
    await writeBoard(conn, 'excel', excelRanked);
    await writeBoard(conn, 'overall', overallRanked);
    await conn.commit();

    return { typing: typingRanked.length, excel: excelRanked.length, overall: overallRanked.length };
  } catch (e) {
    await conn.rollback().catch(() => {});
    throw e;
  } finally {
    conn.release();
  }
}

export function startLeaderboardCron(everyMs = 5 * 60 * 1000) {
  return setInterval(() => { rebuildLeaderboard().catch(() => {}); }, everyMs);
}
