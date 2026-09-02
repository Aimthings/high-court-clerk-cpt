// Rank logic. Rankability is decided at WRITE time (brief §5) and stored on the
// attempt row; the rebuild only ever reads rankable rows. The pure functions
// here are unit-tested; the SQL rebuild lives in jobs/rebuildLeaderboard.js.

export const BOARDS = ['typing', 'excel', 'overall'];

// ---- rankability (pure) ----

// Typing attempt qualifies for the board.
export function typingRankable({
  mode, durationSec, isFirst, verified, listed, ssscWpm, keyEvents, chars, medianIntervalMs,
}) {
  // Anomaly quarantine — hold for review, never auto-ban (brief §5 rank rule 6).
  const anomaly =
    (medianIntervalMs != null && medianIntervalMs < 40) ||
    (keyEvents != null && chars != null && keyEvents < chars) ||
    (ssscWpm != null && ssscWpm > 120);
  const status = anomaly ? 'review' : 'complete';

  const rankable =
    mode === 'exam' &&
    isFirst === true &&
    durationSec >= 570 && // ran ≥ 570s of 600
    verified === true &&
    listed === true &&
    !anomaly;

  return { rankable: rankable ? 1 : 0, status };
}

// Excel attempt qualifies for the board.
export function excelRankable({ elapsedSec, isFirst, verified, listed }) {
  const rankable =
    isFirst === true &&
    elapsedSec >= 120 && // submitted ≥ 120s after start
    verified === true &&
    listed === true;
  return { rankable: rankable ? 1 : 0, status: 'submitted' };
}

// Overall readiness — both halves capped because the exam is pass/fail on two
// independent gates (brief §5).
export function overallMetric(bestWpm, bestMarks) {
  const wpm = bestWpm || 0;
  const marks = bestMarks || 0;
  return Math.round(100 * (0.5 * Math.min(1, wpm / 40) + 0.5 * Math.min(1, marks / 8)));
}

// ---- handle validation + profanity ----
const BANNED = ['admin', 'root', 'fuck', 'shit', 'bitch', 'bastard', 'slut', 'rape', 'nazi', 'chutiya', 'madarchod', 'bhenchod', 'randi'];
const HANDLE_RE = /^[a-z0-9][a-z0-9._]{1,38}[a-z0-9]$/; // 3-40 chars, lower, . _ inside

export function validateHandle(raw) {
  const handle = String(raw || '').trim().toLowerCase();
  if (!HANDLE_RE.test(handle)) {
    return { ok: false, error: 'Use 3–40 characters: letters, numbers, dot or underscore.' };
  }
  if (BANNED.some((w) => handle.includes(w))) {
    return { ok: false, error: 'Choose a different handle.' };
  }
  return { ok: true, handle };
}

// Days since a timestamp (for the 30-day handle-change limit).
export function daysSince(ts) {
  if (!ts) return Infinity;
  return (Date.now() - new Date(ts).getTime()) / (24 * 60 * 60 * 1000);
}
