// Leaderboard reads. PUBLIC rows carry a handle and a state only — never a user
// id, phone, email, district or attempt history (brief §5 privacy).
import { pool } from '../db.js';

const METRIC_DP = { typing: 1, excel: 0, overall: 0 };

function shapeRow(r, board) {
  const dp = METRIC_DP[board] ?? 0;
  return {
    rnk: r.rnk,
    handle: r.handle || 'candidate',
    region: r.region || '',
    metric: Number(Number(r.metric).toFixed(dp)),
    attempts: r.attempts,
  };
}

// Live personal rank between rebuilds (brief §5).
export async function personalRank(board, metric) {
  const [[a]] = await pool.query(
    'SELECT COUNT(*) + 1 AS rnk FROM leaderboard_entries WHERE board = ? AND metric > ?',
    [board, metric],
  );
  const [[b]] = await pool.query('SELECT COUNT(*) AS total FROM leaderboard_entries WHERE board = ?', [board]);
  return { rnk: a.rnk, total: b.total };
}

// Public board: top N, plus total + freshness. No identity beyond handle/state.
export async function getBoard(board, { limit = 100 } = {}) {
  const [rows] = await pool.query(
    `SELECT le.rnk, le.metric, le.attempts, p.handle, p.region
     FROM leaderboard_entries le
     JOIN profiles p ON p.user_id = le.user_id
     WHERE le.board = ?
     ORDER BY le.rnk ASC
     LIMIT ?`,
    [board, limit],
  );
  const [[meta]] = await pool.query(
    'SELECT COUNT(*) AS total, MAX(updated_at) AS updated_at FROM leaderboard_entries WHERE board = ?',
    [board],
  );
  return {
    board,
    total: meta.total,
    updatedAt: meta.updated_at,
    rows: rows.map((r) => shapeRow(r, board)),
  };
}

// The signed-in candidate's own rank + the rows around them.
export async function getMe(board, userId) {
  const [[entry]] = await pool.query(
    `SELECT le.rnk, le.pct, le.metric, le.prev_rnk, le.attempts, p.handle, p.region
     FROM leaderboard_entries le JOIN profiles p ON p.user_id = le.user_id
     WHERE le.board = ? AND le.user_id = ?`,
    [board, userId],
  );
  const [[meta]] = await pool.query(
    'SELECT COUNT(*) AS total, MAX(updated_at) AS updated_at FROM leaderboard_entries WHERE board = ?',
    [board],
  );

  if (!entry) {
    return { board, ranked: false, total: meta.total, updatedAt: meta.updated_at, around: [] };
  }

  // neighbours within ±3 ranks
  const [around] = await pool.query(
    `SELECT le.rnk, le.metric, le.attempts, p.handle, p.region, le.user_id
     FROM leaderboard_entries le JOIN profiles p ON p.user_id = le.user_id
     WHERE le.board = ? AND le.rnk BETWEEN ? AND ?
     ORDER BY le.rnk ASC`,
    [board, Math.max(1, entry.rnk - 3), entry.rnk + 3],
  );

  return {
    board,
    ranked: true,
    total: meta.total,
    updatedAt: meta.updated_at,
    you: {
      rnk: entry.rnk, pct: entry.pct, prevRnk: entry.prev_rnk,
      metric: Number(entry.metric), handle: entry.handle, region: entry.region, attempts: entry.attempts,
    },
    around: around.map((r) => ({
      ...shapeRow(r, board),
      you: r.user_id === userId,
    })),
  };
}
