// Authoritative Excel grader (brief §5). Deterministic assertion runner.
// Role is resolved by HEADER TEXT, never by cell address, so grading is
// layout-independent: the candidate may place the tables anywhere.
import { computeValues, parseRef, numToCol } from './evaluate.js';

const norm = (s) => String(s ?? '').trim();
const ci = (s) => norm(s).toUpperCase();

// Find a table by its header sequence appearing contiguously in one row.
// Returns { col, row, len } of the header row, or null.
function findTable(cells, headers) {
  const h0 = ci(headers[0]);
  for (const [ref, raw] of Object.entries(cells)) {
    if (ci(raw) !== h0) continue;
    const at = parseRef(ref);
    if (!at) continue;
    let ok = true;
    for (let k = 1; k < headers.length; k += 1) {
      const cref = `${numToCol(at.col + k)}${at.row}`;
      if (ci(cells[cref]) !== ci(headers[k])) { ok = false; break; }
    }
    if (ok) return { col: at.col, row: at.row, len: headers.length };
  }
  return null;
}

// Locate the result cell for a header (TOTAL/LOWEST/HIGHEST/MEAN) beside a table:
// the header text lives in the table's header row, to the right of the data;
// the value sits one row below it.
function findResultRef(cells, table, resultHeader) {
  const anchor = findTable(cells, table.headers);
  if (!anchor) return null;
  const target = ci(resultHeader);
  // scan the whole header row for the result header, right of the data block
  for (const [ref, raw] of Object.entries(cells)) {
    if (ci(raw) !== target) continue;
    const at = parseRef(ref);
    if (at && at.row === anchor.row && at.col >= anchor.col + anchor.len) {
      return `${numToCol(at.col)}${at.row + 1}`;
    }
  }
  return null;
}

function checkDataEntered(cells, table) {
  const anchor = findTable(cells, table.headers);
  if (!anchor) return false;
  // values row directly below the headers must match the given whole numbers
  for (let k = 0; k < table.values.length; k += 1) {
    const vref = `${numToCol(anchor.col + k)}${anchor.row + 1}`;
    const got = Number(norm(cells[vref]));
    if (Number.isNaN(got) || got !== table.values[k]) return false;
  }
  return true;
}

function checkCell(cells, values, spec, a) {
  const table = spec.tables[a.role.table - 1];
  const ref = findResultRef(cells, table, a.role.header);
  if (!ref) return false;
  const raw = norm(cells[ref]);
  // formulaContains requires a REAL formula — a typed constant scores zero.
  if (a.formulaContains) {
    if (!raw.startsWith('=')) return false;
    if (!raw.toUpperCase().includes(a.formulaContains.toUpperCase())) return false;
  }
  const val = values[ref];
  if (typeof val !== 'number') return false;
  return Math.abs(val - a.value) <= (a.tolerance ?? 0.01);
}

function chartCols(sourceRange) {
  const m = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(norm(sourceRange).toUpperCase());
  if (!m) return null;
  const a = parseRef(m[1] + m[2]); const b = parseRef(m[3] + m[4]);
  return { c1: Math.min(a.col, b.col), c2: Math.max(a.col, b.col) };
}

function checkAssert(cells, values, spec, chart, saves, a) {
  switch (a.type) {
    case 'dataEntered':
      return checkDataEntered(cells, spec.tables[a.table - 1]);
    case 'filename':
      return ci(spec._filename) === ci(a.equals);
    case 'saved': {
      // a save snapshot must satisfy the non-save assertions of the referenced part
      const part = spec.parts.find((p) => p.ref === a.after);
      if (!part) return saves.length > 0;
      return saves.some((snap) => {
        const sv = computeValues(snap.cells || {});
        const specSnap = { ...spec, _filename: snap.filename };
        return part.assert
          .filter((x) => x.type !== 'saved')
          .every((x) => checkAssert(snap.cells || {}, sv, specSnap, chart, [], x));
      });
    }
    case 'cell':
      return checkCell(cells, values, spec, a);
    case 'chart': {
      if (!chart || !chart.present) return false;
      if (a.chartType && ci(chart.chartType) !== ci(a.chartType)) return false;
      const table = spec.tables[a.sourceTable - 1];
      const anchor = findTable(cells, table.headers);
      const cols = chartCols(chart.sourceRange);
      if (!anchor || !cols) return false;
      // source must cover the data columns and NOT the result columns
      if (a.excludesResultColumns && cols.c2 > anchor.col + anchor.len - 1) return false;
      return cols.c1 >= anchor.col && cols.c1 <= anchor.col + anchor.len - 1;
    }
    case 'chartTitle':
      return chart && ci(chart.title) === ci(a.equals);
    case 'axisTitle': {
      if (!chart) return false;
      const got = ci(a.axis === 'category' ? chart.categoryAxis : chart.valueAxis);
      const accepted = [a.equals, ...(a.acceptAlso || [])].map(ci);
      return accepted.includes(got);
    }
    case 'chartPlacement':
      return chart && ci(chart.placement) === ci(a.equals);
    default:
      return false;
  }
}

// Grade a submitted workbook against a mock spec. Returns marks + per-part verdict.
export function gradeExcel(spec, workbook) {
  const cells = workbook.cells || {};
  const values = computeValues(cells);
  const chart = workbook.chart || null;
  const saves = workbook.saves || [];
  const specWithFile = { ...spec, _filename: workbook.filename };

  const parts = spec.parts.map((part) => {
    const verdicts = part.assert.map((a) => ({
      type: a.type,
      pass: checkAssert(cells, values, specWithFile, chart, saves, a),
    }));
    const passed = verdicts.filter((v) => v.pass).length;
    const total = verdicts.length;
    // Partial credit: full if all pass, 1 of 2 if at least half pass, else 0.
    let marks = 0;
    if (passed === total) marks = part.marks;
    else if (passed / total >= 0.5) marks = 1;
    return { ref: part.ref, label: part.label, marks, max: part.marks, passed, total, verdicts };
  });

  const marks = parts.reduce((s, p) => s + p.marks, 0);
  return {
    marks,
    totalMarks: spec.totalMarks,
    passMarks: spec.passMarks,
    passed: marks >= spec.passMarks,
    parts,
    modelAnswers: spec.modelAnswers,
    commonErrors: spec.commonErrors,
  };
}
