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
