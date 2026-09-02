import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gradeExcel } from './excel.js';
import { numToCol } from './evaluate.js';

const here = dirname(fileURLToPath(import.meta.url));
const mocks = JSON.parse(readFileSync(join(here, '..', 'seed', 'mocks.json'), 'utf-8'));
const spec = mocks[0].spec; // XL01 Mooncity

// Lay both tables out at a chosen origin and fill the result columns with formulas.
// startCol/startRow is 1-based (A=1). Returns a workbook the grader can score.
function buildWorkbook(s, { origin = { col: 1, row: 11 }, useFormulas = true, includeChart = true, gapRows = 4 } = {}) {
  const cells = {};
  const put = (c, r, v) => { cells[`${numToCol(c)}${r}`] = v; };
  const results = ['TOTAL', 'LOWEST', 'HIGHEST', 'MEAN'];
  const fnFor = { TOTAL: 'SUM', LOWEST: 'MIN', HIGHEST: 'MAX', MEAN: 'AVERAGE' };

  function layTable(t, hRow) {
    const c0 = origin.col;
    t.headers.forEach((h, k) => put(c0 + k, hRow, h));
    t.values.forEach((v, k) => put(c0 + k, hRow + 1, v));
    const dataStart = `${numToCol(c0)}${hRow + 1}`;
    const dataEnd = `${numToCol(c0 + t.values.length - 1)}${hRow + 1}`;
    const rc = origin.col + t.values.length; // result columns start here
    results.forEach((rh, k) => {
      put(rc + k, hRow, rh);
      const fnName = rh === 'MEAN' ? `ROUND(AVERAGE(${dataStart}:${dataEnd}),2)` : `${fnFor[rh]}(${dataStart}:${dataEnd})`;
      put(rc + k, hRow + 1, useFormulas ? `=${fnName}` : String(mean(t.values, rh)));
    });
    return { dataStart, dataEnd };
  }
  const r1 = layTable(s.tables[0], origin.row);
  layTable(s.tables[1], origin.row + gapRows + 2);

  const chart = includeChart
    ? {
        present: true, chartType: s.chart.chartType, title: s.chart.title,
        categoryAxis: s.chart.categoryAxis, valueAxis: s.chart.valueAxis,
        sourceRange: `${r1.dataStart.replace(/\d+$/, origin.row)}:${r1.dataEnd}`, placement: 'embedded',
      }
    : { present: false };

  return { filename: s.saveAs, cells, chart, saves: [{ filename: s.saveAs, cells: { ...cells } }] };
}
function mean(vals, rh) {
  if (rh === 'TOTAL') return vals.reduce((a, b) => a + b, 0);
  if (rh === 'LOWEST') return Math.min(...vals);
  if (rh === 'HIGHEST') return Math.max(...vals);
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
}

describe('Excel grader', () => {
  it('scores a correct workbook 10/10 and qualifies', () => {
    const r = gradeExcel(spec, buildWorkbook(spec));
    expect(r.marks).toBe(10);
    expect(r.passed).toBe(true);
  });

  it('is layout-independent (tables placed at a different origin)', () => {
    const r = gradeExcel(spec, buildWorkbook(spec, { origin: { col: 3, row: 20 } }));
    expect(r.marks).toBe(10);
  });

  it('scores typed constants (not formulas) as zero for that cell', () => {
    const wb = buildWorkbook(spec, { useFormulas: false });
    const r = gradeExcel(spec, wb);
    const bi = r.parts.find((p) => p.ref === 'bi');
    expect(bi.marks).toBe(0); // both totals are constants -> no formula -> 0
  });

  it('awards partial credit (1 of 2) when half a part passes', () => {
    const wb = buildWorkbook(spec);
    // break one of the two totals by making it a constant
    const totalRef = Object.keys(wb.cells).find((ref) => wb.cells[ref] === `=SUM(A12:G12)`);
    wb.cells[totalRef] = String(spec.modelAnswers.t1.total); // typed constant
    const r = gradeExcel(spec, wb);
    const bi = r.parts.find((p) => p.ref === 'bi');
    expect(bi.marks).toBe(1);
  });

  it('drops chart marks when no chart is placed', () => {
    const r = gradeExcel(spec, buildWorkbook(spec, { includeChart: false }));
    const c = r.parts.find((p) => p.ref === 'c');
    expect(c.marks).toBe(0);
    expect(r.marks).toBe(8);
  });

  it('MIN returns 0 when a table contains a zero (Mooncity Tuesday)', () => {
    const r = gradeExcel(spec, buildWorkbook(spec));
    const bii = r.parts.find((p) => p.ref === 'bii');
    expect(bii.marks).toBe(2); // lowest=0 handled correctly
  });
});
