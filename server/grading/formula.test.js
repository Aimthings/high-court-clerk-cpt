import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gradeFormula } from './formula.js';

const here = dirname(fileURLToPath(import.meta.url));
const lessons = JSON.parse(readFileSync(join(here, '..', 'seed', 'formulas.json'), 'utf-8'));
const byslug = Object.fromEntries(lessons.map((l) => [l.slug, l]));

describe('formula practice grader', () => {
  it("every lesson's own model solution scores correct", () => {
    for (const l of lessons) {
      const r = gradeFormula(l, l._solution);
      expect(r.correct, `${l.slug} model solution`).toBe(true);
    }
  });

  it('rejects a typed constant (not a formula)', () => {
    const r = gradeFormula(byslug.sum, '268');
    expect(r.correct).toBe(false);
    expect(r.requireOk).toBe(false);
  });

  it('rejects the right answer computed with the wrong function', () => {
    // correct value 268 but built without SUM
    const r = gradeFormula(byslug.sum, '=B2+B3+B4+B5+B6');
    expect(r.correct).toBe(false);
    expect(r.message).toMatch(/SUM/);
  });

  it('rejects a correct function with the wrong result', () => {
    const r = gradeFormula(byslug.sum, '=SUM(B2:B5)'); // omits B6 -> 205, not 268
    expect(r.requireOk).toBe(true);
    expect(r.correct).toBe(false);
  });

  it('accepts an equivalent formula that meets requirement + value (IF)', () => {
    const r = gradeFormula(byslug.if, '=IF(B2>=40,"Pass","Fail")');
    expect(r.correct).toBe(true);
  });

  it('grades TODAY on function usage, not the (daily-changing) value', () => {
    const r = gradeFormula(byslug.today, '=TODAY()');
    expect(r.correct).toBe(true);
  });
});
