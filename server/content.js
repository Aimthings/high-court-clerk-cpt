// Loads seeded content from JSON. In later phases these move to MySQL JSON
// columns (brief §4); the API shape stays the same so the client is unaffected.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export const passages = JSON.parse(
  readFileSync(join(here, 'seed', 'passages.json'), 'utf-8'),
).map((p, idx) => ({
  id: idx + 1,
  ...p,
  word_count: p.body.trim().split(/\s+/).length,
}));

const bySlug = new Map(passages.map((p) => [p.slug, p]));
export const getPassage = (slug) => bySlug.get(slug);

// ---- Daily content drip ------------------------------------------------------
// Every passage and Excel mock carries a `release_offset` (default 0). The base
// set (offset 0) is available from launch. From day 7 onward exactly one new
// passage and one new Excel mock unlock each day: offset 1 on day 7, offset 2 on
// day 8, and so on. This gives buyers fresh daily practice without any runtime
// generation — the whole bank is pre-authored and simply revealed on schedule.
//
// Day 0 is LAUNCH_DATE (IST). Override with the LAUNCH_DATE env var if the launch
// anchor ever needs to move; the drip schedule shifts with it.
const LAUNCH_DATE = process.env.LAUNCH_DATE || '2026-09-06';
const DAY_MS = 86_400_000;
const DRIP_START_DAY = 7; // first drip item unlocks on day 7 (after day 6)

export function daysSinceLaunch(now = Date.now()) {
  const anchor = Date.parse(`${LAUNCH_DATE}T00:00:00+05:30`);
  if (Number.isNaN(anchor)) return 0;
  return Math.max(0, Math.floor((now - anchor) / DAY_MS));
}

// Is this item revealed as of `now`? Base items (offset 0) always; a drip item
// with offset k on day (DRIP_START_DAY - 1 + k) = day 6+k.
export function isReleased(item, now = Date.now()) {
  const off = Number(item?.release_offset || 0);
  if (off <= 0) return true;
  return daysSinceLaunch(now) >= (DRIP_START_DAY - 1) + off;
}

export const availablePassages = (now = Date.now()) => passages.filter((p) => isReleased(p, now));
export const availableMocks = (now = Date.now()) => mocks.filter((m) => isReleased(m, now));

// The freshest item unlocked as of `now` — the highest released drip offset.
// null when only the base set is out (before day 7). Used by "Today's practice".
function newestReleased(list, now) {
  const drip = list.filter((x) => Number(x.release_offset || 0) > 0 && isReleased(x, now));
  if (!drip.length) return null;
  return drip.reduce((a, b) => (Number(a.release_offset) >= Number(b.release_offset) ? a : b));
}
export const todaysPassage = (now = Date.now()) => newestReleased(passages, now);
export const todaysMock = (now = Date.now()) => newestReleased(mocks, now);

// ---- Excel mocks ----
export const mocks = JSON.parse(
  readFileSync(join(here, 'seed', 'mocks.json'), 'utf-8'),
).map((m, idx) => ({ id: idx + 1, ...m }));

const byCode = new Map(mocks.map((m) => [m.code, m]));
export const getMock = (code) => byCode.get(code);

export const mockSummary = (m) => ({
  id: m.id,
  code: m.code,
  title: m.title,
  difficulty: m.difficulty,
  is_free: m.is_free,
  durationSec: m.spec.durationSec,
  totalMarks: m.spec.totalMarks,
  passMarks: m.spec.passMarks,
});

// ---- Formula Library lessons ----
export const formulas = JSON.parse(
  readFileSync(join(here, 'seed', 'formulas.json'), 'utf-8'),
);
const byFormulaSlug = new Map(formulas.map((f) => [f.slug, f]));
export const getFormula = (slug) => byFormulaSlug.get(slug);

export const formulaSummary = (f) => ({
  id: f.id, slug: f.slug, name: f.name, track: f.track, difficulty: f.difficulty,
});

// Lesson sent to the browser — answer key (_requireFns/_solution/_expect) removed.
export function sanitizeFormula(f) {
  return {
    id: f.id, slug: f.slug, name: f.name, track: f.track, difficulty: f.difficulty,
    tutorial: f.tutorial, data: f.data, taskCell: f.taskCell, prompt: f.prompt, hint: f.hint,
  };
}

// Spec sent to the browser at /start — assertions, answers and hints removed
// (brief §5.3). The candidate still needs the tables, parts and chart brief.
export function sanitizeSpec(spec) {
  return {
    code: spec.code,
    title: spec.title,
    durationSec: spec.durationSec,
    totalMarks: spec.totalMarks,
    passMarks: spec.passMarks,
    saveAs: spec.saveAs,
    scenario: spec.scenario,
    tables: spec.tables.map((t) => ({ index: t.index, name: t.name, headers: t.headers, values: t.values, resultHeaders: t.resultHeaders })),
    chart: spec.chart,
    parts: spec.parts.map((p) => ({ ref: p.ref, label: p.label, marks: p.marks })),
  };
}

// List view never includes the passage body.
export const passageSummary = (p) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  category: p.category,
  difficulty: p.difficulty,
  word_count: p.word_count,
  is_free: p.is_free,
});
