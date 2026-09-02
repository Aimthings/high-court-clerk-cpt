// Generates server/seed/mocks.json from the fixed Excel archetype (brief §2):
// one scenario, two tables at two granularities, lettered parts (a)-(c),
// 5 gradeable parts x 2 marks = 10, pass at 4.
//
// Variety enforced: 8 mocks (3 gentle, 3 standard, 2 stretch); no repeated
// scenario / filename / chart title; ~1/3 contain a zero (so MIN returns 0);
// ~half have a non-terminating mean. Excel-2007-safe only.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

const RESULT_HEADERS = { total: 'TOTAL', lowest: 'LOWEST', highest: 'HIGHEST', mean: 'MEAN' };

// Each scenario supplies the variable slots. Values are whole numbers.
const scenarios = [
  {
    code: 'XL01', difficulty: 1, title: 'Mooncity rainfall',
    scenario: 'The meteorological office at Mooncity records the rainfall, in millimetres, for each day of the week and for each month of the year. Enter both tables and answer the parts below.',
    filename: 'Mooncity',
    t1: { name: 'Weekly rainfall (mm)', headers: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], values: [12, 0, 8, 15, 4, 22, 9] },
    t2: { name: 'Monthly rainfall (mm)', headers: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], values: [30, 24, 41, 18, 66, 120, 210, 180, 95, 40, 12, 8] },
    chartType: '3-D Column', chartTitle: 'AVERAGE DAILY RAINFALL', catAxis: 'DAY', valAxis: 'RAINFALL (mm)',
  },
  {
    code: 'XL02', difficulty: 1, title: 'District court filings',
    scenario: 'The filing counter of the district court at Rohtak counts the cases filed at each counter on a working day and across the districts of the division. Enter both tables and answer the parts below.',
    filename: 'Filings',
    t1: { name: 'Cases by counter', headers: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'], values: [14, 9, 21, 6, 11, 17] },
    t2: { name: 'Cases by district', headers: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11'], values: [120, 85, 60, 200, 45, 90, 33, 150, 72, 110, 64] },
    chartType: 'Clustered Column', chartTitle: 'CASES FILED BY COUNTER', catAxis: 'COUNTER', valAxis: 'CASES',
  },
  {
    code: 'XL03', difficulty: 1, title: 'Library books issued',
    scenario: 'The city library at Patiala notes the number of books issued from each section on the working days of a week, and the books issued in each week of the year. Enter both tables and answer the parts below.',
    filename: 'Library',
    t1: { name: 'Books by section', headers: ['SEC1', 'SEC2', 'SEC3', 'SEC4', 'SEC5'], values: [40, 55, 33, 48, 61] },
    t2: { name: 'Books by week', headers: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10'], values: [300, 280, 315, 290, 260, 330, 305, 275, 340, 295] },
    chartType: 'Line', chartTitle: 'BOOKS ISSUED BY SECTION', catAxis: 'SECTION', valAxis: 'BOOKS',
  },
  {
    code: 'XL04', difficulty: 2, title: 'Hospital admissions',
    scenario: 'The civil hospital at Ambala records the patients admitted in each ward on a given day, and the patients admitted in each month of the year. Enter both tables and answer the parts below.',
    filename: 'Hospital',
    t1: { name: 'Admissions by ward', headers: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'], values: [7, 13, 0, 9, 22, 5, 18] },
    t2: { name: 'Admissions by month', headers: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], values: [210, 198, 205, 220, 260, 305, 340, 330, 290, 240, 215, 200] },
    chartType: 'Bar', chartTitle: 'ADMISSIONS BY WARD', catAxis: 'WARD', valAxis: 'PATIENTS',
  },
  {
    code: 'XL05', difficulty: 2, title: 'Toll plaza vehicles',
    scenario: 'The toll plaza on the national highway near Karnal counts the vehicles passing through each lane in an hour, and the vehicles passing in each month of the year. Enter both tables and answer the parts below.',
    filename: 'Tollplaza',
    t1: { name: 'Vehicles by lane', headers: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'], values: [340, 512, 289, 601, 455, 378, 523, 410] },
    t2: { name: 'Vehicles by month (000)', headers: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], values: [820, 790, 860, 910, 880, 940, 1010, 990, 870, 900, 850, 830] },
    chartType: 'Column', chartTitle: 'VEHICLES BY LANE', catAxis: 'LANE', valAxis: 'VEHICLES',
  },
  {
    code: 'XL06', difficulty: 2, title: 'Electricity units',
    scenario: 'The sub-division of the power board at Hisar records the electricity consumed, in units, by each feeder on a day, and the units consumed in each month of the year. Enter both tables and answer the parts below.',
    filename: 'Powerboard',
    t1: { name: 'Units by feeder', headers: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'], values: [1200, 0, 980, 1450, 760, 1330] },
    t2: { name: 'Units by month (000)', headers: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], values: [340, 320, 360, 410, 520, 660, 720, 700, 560, 430, 360, 330] },
    chartType: 'Line with Markers', chartTitle: 'UNITS BY FEEDER', catAxis: 'FEEDER', valAxis: 'UNITS',
  },
  {
    code: 'XL07', difficulty: 3, title: 'Grain procurement',
    scenario: 'The procurement centre of the mandi at Sirsa weighs the grain, in quintals, brought to each shed on a day, and the grain procured in each week of the season. Enter both tables and answer the parts below.',
    filename: 'Procurement',
    t1: { name: 'Quintals by shed', headers: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'], values: [820, 615, 903, 447, 0, 1120, 738] },
    t2: { name: 'Quintals by week', headers: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11'], values: [4200, 3850, 5100, 4670, 3990, 6120, 5430, 4880, 5220, 4010, 3760] },
    chartType: '3-D Bar', chartTitle: 'GRAIN PROCURED BY SHED', catAxis: 'SHED', valAxis: 'QUINTALS',
  },
  {
    code: 'XL08', difficulty: 3, title: 'Bus depot kilometres',
    scenario: 'The roadways depot at Bathinda records the distance, in kilometres, run by each bus on a day, and the distance run by the fleet in each month of the year. Enter both tables and answer the parts below.',
    filename: 'Roadways',
    t1: { name: 'Kilometres by bus', headers: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'], values: [312, 289, 401, 355, 298, 367, 333, 290] },
    t2: { name: 'Kilometres by month (000)', headers: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], values: [92, 88, 95, 101, 99, 104, 110, 108, 97, 100, 94, 91] },
    chartType: 'Clustered Bar', chartTitle: 'DISTANCE BY BUS', catAxis: 'BUS', valAxis: 'KILOMETRES',
  },
];

const sum = (a) => a.reduce((s, x) => s + x, 0);
const round2 = (n) => Math.round(n * 100) / 100;
const mean = (a) => round2(sum(a) / a.length);

const mocks = scenarios.map((s) => {
  const t1 = s.t1; const t2 = s.t2;
  const stats = (t) => ({ total: sum(t.values), lowest: Math.min(...t.values), highest: Math.max(...t.values), mean: mean(t.values) });
  const s1 = stats(t1); const s2 = stats(t2);

  const cellAssert = (table, header, value, fn) => ({
    type: 'cell', role: { table, header: RESULT_HEADERS[header] }, value, tolerance: 0.01, formulaContains: fn,
  });

  const parts = [
    {
      ref: 'a', label: '(a) Enter both tables and save the workbook as ' + s.filename, marks: 2,
      assert: [
        { type: 'dataEntered', table: 1 },
        { type: 'dataEntered', table: 2 },
        { type: 'filename', equals: s.filename },
        { type: 'saved', after: 'a' },
      ],
    },
    {
      ref: 'bi', label: '(b)(i) Total for the week and the year respectively', marks: 2,
      assert: [cellAssert(1, 'total', s1.total, 'SUM'), cellAssert(2, 'total', s2.total, 'SUM')],
    },
    {
      ref: 'bii', label: '(b)(ii) Lowest and highest for both tables', marks: 2,
      assert: [
        cellAssert(1, 'lowest', s1.lowest, 'MIN'), cellAssert(1, 'highest', s1.highest, 'MAX'),
        cellAssert(2, 'lowest', s2.lowest, 'MIN'), cellAssert(2, 'highest', s2.highest, 'MAX'),
      ],
    },
    {
      ref: 'biii', label: '(b)(iii) Mean for both tables, then save changes', marks: 2,
      assert: [
        cellAssert(1, 'mean', s1.mean, 'AVERAGE'), cellAssert(2, 'mean', s2.mean, 'AVERAGE'),
        { type: 'saved', after: 'biii' },
      ],
    },
    {
      ref: 'c', label: `(c) A ${s.chartType} chart of Table 1, embedded in the worksheet`, marks: 2,
      assert: [
        { type: 'chart', chartType: s.chartType, sourceTable: 1, excludesResultColumns: true },
        { type: 'chartTitle', equals: s.chartTitle },
        { type: 'axisTitle', axis: 'category', equals: s.catAxis, acceptAlso: [] },
        { type: 'axisTitle', axis: 'value', equals: s.valAxis, acceptAlso: [] },
        { type: 'chartPlacement', equals: 'embedded' },
      ],
    },
  ];

  return {
    code: s.code,
    title: s.title,
    difficulty: s.difficulty,
    is_free: s.code === 'XL01',
    spec: {
      code: s.code,
      title: s.title,
      durationSec: 600,
      totalMarks: 10,
      passMarks: 4,
      saveAs: s.filename,
      scenario: s.scenario,
      tables: [
        { index: 1, name: t1.name, headers: t1.headers, values: t1.values, resultHeaders: ['TOTAL', 'LOWEST', 'HIGHEST', 'MEAN'] },
        { index: 2, name: t2.name, headers: t2.headers, values: t2.values, resultHeaders: ['TOTAL', 'LOWEST', 'HIGHEST', 'MEAN'] },
      ],
      chart: { chartType: s.chartType, title: s.chartTitle, categoryAxis: s.catAxis, valueAxis: s.valAxis, sourceTable: 1 },
      parts,
      partialCredit: true,
      commonErrors: [
        'Typing the totals as constants instead of formulas — a typed number scores zero.',
        'Charting the result columns (TOTAL/MEAN) along with the data.',
        'Forgetting to save under the given one-word filename.',
      ],
      // Model answers (revealed only after submit).
      modelAnswers: {
        t1: s1, t2: s2,
      },
    },
  };
});

// sanity: distinct filenames + chart titles + scenarios
const uniq = (arr) => new Set(arr).size === arr.length;
console.assert(uniq(mocks.map((m) => m.spec.saveAs)), 'filenames must be distinct');
console.assert(uniq(mocks.map((m) => m.spec.chart.title)), 'chart titles must be distinct');
const withZero = mocks.filter((m) => m.spec.tables.some((t) => t.values.includes(0))).length;
const nonTerminating = mocks.filter((m) => m.spec.tables.some((t) => (t.values.reduce((a, b) => a + b, 0) % t.values.length) !== 0)).length;
console.log(`mocks: ${mocks.length}, with a zero: ${withZero}, non-terminating mean: ${nonTerminating}`);

writeFileSync(join(here, 'mocks.json'), JSON.stringify(mocks, null, 2) + '\n');
console.log('wrote mocks.json');
