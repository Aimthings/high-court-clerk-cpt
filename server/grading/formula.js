// Grades a Formula Library practice submission. Deterministic: checks the
// candidate used the required function(s) AND got the right result — a typed
// constant (no formula) scores zero, exactly like the real exam.
import { evaluateFormula, computeValues } from './evaluate.js';

export function gradeFormula(lesson, submitted) {
  const raw = String(submitted || '').trim();
  const values = computeValues(lesson.data);
  const getCell = (ref) => values[ref];

  if (!raw.startsWith('=')) {
    return { correct: false, requireOk: false, message: 'Start with = and use a formula, not a typed value.', solution: lesson._solution };
  }
  const upper = raw.toUpperCase();
  const missing = (lesson._requireFns || []).filter((fn) => !upper.includes(`${fn.toUpperCase()}(`));
  if (missing.length) {
    return { correct: false, requireOk: false, message: `Use the ${missing.join(' and ')} function.`, solution: lesson._solution };
  }

  const value = evaluateFormula(raw, getCell);
  if (value === '#ERROR') {
    return { correct: false, requireOk: true, value, message: 'The formula could not be calculated — check the syntax.', solution: lesson._solution };
  }

  const exp = lesson._expect;
  if (exp.type === 'formula') {
    return { correct: true, requireOk: true, value, message: 'Correct — the right function is used.', solution: lesson._solution };
  }
  let correct;
  if (exp.type === 'number') correct = typeof value === 'number' && Math.abs(value - exp.value) <= (exp.tolerance ?? 0.01);
  else correct = String(value).trim() === String(exp.value).trim();

  return {
    correct,
    requireOk: true,
    value,
    expected: exp.value,
    message: correct ? 'Correct.' : `Not quite — expected ${JSON.stringify(exp.value)}, your formula gave ${JSON.stringify(value)}.`,
    solution: lesson._solution,
  };
}
