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

// ---- Daily drip bank ---------------------------------------------------------
// Only the FIRST SIX mocks are visible at launch (offset 0). Every later mock
// unlocks one per day from day 7 onward. 62 further mocks are generated below so
// the full bank is ~70 — two months + buffer of fresh Excel practice. Data is
// deterministic (seeded), so a re-run reproduces the exact same bank — no runtime
// generation, no drift. release_offset is assigned by final index further down.
const CHARTS = ['Column', 'Clustered Column', '3-D Column', 'Bar', 'Clustered Bar', '3-D Bar', 'Line', 'Line with Markers'];

// mulberry32 — a tiny seeded PRNG so every value is fixed and reproducible.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeVals(seed, n, lo, hi, zero) {
  const r = rng(seed);
  const out = Array.from({ length: n }, () => lo + Math.floor(r() * (hi - lo + 1)));
  if (zero) out[Math.floor(r() * n)] = 0; // ~1/3 of banks carry a genuine 0 (MIN=0)
  return out;
}
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const weekHeads = (n) => Array.from({ length: n }, (_, i) => `W${i + 1}`);

// Each def: [file, title, ctx, place, metric, unit, tag1, n1, cat1, g2mode, r1lo, r1hi, r2lo, r2hi]
// g2mode: 'months' | 'weeks10' | 'weeks11'. Court/clerk/civic themed, Punjab & Haryana.
const DEFS = [
  ['Treasury', 'Treasury cheques cleared', 'The district treasury', 'Panchkula', 'cheques cleared', 'cheques', 'C', 6, 'COUNTER', 'months', 40, 220, 900, 2600],
  ['Registry', 'Deeds registered', 'The sub-registrar office', 'Chandigarh', 'deeds registered', 'deeds', 'S', 7, 'WINDOW', 'weeks10', 8, 60, 180, 520],
  ['Challans', 'Traffic challans issued', 'The traffic police unit', 'Ludhiana', 'challans issued', 'challans', 'Z', 8, 'ZONE', 'months', 60, 340, 1400, 3800],
  ['Passports', 'Passport applications', 'The passport seva kendra', 'Jalandhar', 'applications received', 'applications', 'K', 6, 'KIOSK', 'weeks11', 20, 130, 700, 1900],
  ['Vahan', 'Vehicle registrations', 'The regional transport office', 'Ambala', 'vehicles registered', 'vehicles', 'D', 7, 'DESK', 'months', 15, 95, 520, 1500],
  ['Mutations', 'Land mutations', 'The revenue tehsil', 'Karnal', 'mutations sanctioned', 'mutations', 'H', 6, 'HALQA', 'weeks10', 5, 48, 130, 430],
  ['Ration', 'Ration cards issued', 'The food and supplies office', 'Rohtak', 'ration cards issued', 'cards', 'B', 7, 'BLOCK', 'months', 30, 180, 700, 2100],
  ['Pension', 'Pension cases', 'The social welfare office', 'Hisar', 'pension cases cleared', 'cases', 'S', 6, 'SECTION', 'weeks11', 12, 90, 300, 950],
  ['Scholarship', 'Scholarship forms', 'The education district office', 'Patiala', 'scholarship forms verified', 'forms', 'C', 8, 'CLUSTER', 'months', 40, 260, 900, 2600],
  ['Munsif', 'Cases decided', 'The court of the civil judge', 'Gurugram', 'cases decided', 'cases', 'J', 6, 'JUDGE', 'weeks10', 4, 40, 120, 380],
  ['Summons', 'Summons served', 'The process serving agency', 'Faridabad', 'summons served', 'summons', 'R', 7, 'ROUND', 'months', 20, 140, 560, 1600],
  ['Copying', 'Certified copies', 'The copying agency of the court', 'Bathinda', 'certified copies supplied', 'copies', 'W', 6, 'WINDOW', 'weeks11', 25, 160, 520, 1700],
  ['Nazarat', 'Fee stamps sold', 'The nazarat branch', 'Sangrur', 'fee stamps sold', 'stamps', 'C', 8, 'COUNTER', 'months', 60, 300, 1200, 3400],
  ['Malkhana', 'Case property entries', 'The malkhana store', 'Kaithal', 'property entries made', 'entries', 'A', 6, 'ALMIRAH', 'weeks10', 6, 52, 150, 460],
  ['Diarize', 'Dak diarised', 'The receipt and dispatch branch', 'Yamunanagar', 'letters diarised', 'letters', 'S', 7, 'SEAT', 'months', 50, 280, 1100, 3000],
  ['Estamp', 'e-Stamps generated', 'The e-stamping counter', 'Mohali', 'e-stamps generated', 'e-stamps', 'T', 6, 'TERMINAL', 'weeks11', 30, 170, 640, 1900],
  ['Affidavit', 'Affidavits attested', 'The oath commissioner desk', 'Fatehgarh', 'affidavits attested', 'affidavits', 'O', 8, 'OFFICER', 'months', 45, 240, 900, 2500],
  ['Cause', 'Matters listed', 'The cause list section', 'Kurukshetra', 'matters listed', 'matters', 'B', 6, 'BENCH', 'weeks10', 5, 44, 130, 400],
  ['Warrant', 'Warrants executed', 'The warrant cell', 'Fazilka', 'warrants executed', 'warrants', 'T', 7, 'TEAM', 'months', 10, 80, 300, 900],
  ['Bail', 'Bail bonds accepted', 'The bail section', 'Panipat', 'bail bonds accepted', 'bonds', 'C', 6, 'CLERK', 'weeks11', 8, 70, 220, 720],
  ['Evidence', 'Exhibits marked', 'The record room', 'Jind', 'exhibits marked', 'exhibits', 'R', 8, 'RACK', 'months', 30, 200, 780, 2200],
  ['Notice', 'Notices dispatched', 'The dispatch branch', 'Rewari', 'notices dispatched', 'notices', 'S', 6, 'SEAT', 'weeks10', 12, 96, 260, 840],
  ['Landacq', 'Awards announced', 'The land acquisition collector', 'Sonipat', 'awards announced', 'awards', 'V', 7, 'VILLAGE', 'months', 3, 24, 60, 220],
  ['Stamp', 'Stamp papers vended', 'The stamp vendor counter', 'Moga', 'stamp papers vended', 'papers', 'C', 6, 'COUNTER', 'weeks11', 40, 240, 800, 2600],
  ['Court fee', 'Court fee collected', 'The court fee counter', 'Barnala', 'court fee receipts', 'receipts', 'W', 8, 'WINDOW', 'months', 55, 300, 1300, 3600],
  ['Witness', 'Witnesses examined', 'The trial court', 'Nabha', 'witnesses examined', 'witnesses', 'C', 6, 'COURT', 'weeks10', 4, 38, 110, 360],
  ['Guardian', 'Guardianship petitions', 'The guardian judge court', 'Palwal', 'petitions disposed', 'petitions', 'S', 7, 'SLOT', 'months', 6, 46, 150, 500],
  ['Probate', 'Probate matters', 'The district court', 'Narnaul', 'probate matters filed', 'matters', 'B', 6, 'BRANCH', 'weeks11', 3, 28, 80, 260],
  ['Execution', 'Execution petitions', 'The execution court', 'Tarn Taran', 'execution petitions filed', 'petitions', 'D', 8, 'DESK', 'months', 10, 84, 320, 980],
  ['Legalaid', 'Legal aid cases', 'The legal services authority', 'Mansa', 'legal aid cases taken', 'cases', 'P', 6, 'PANEL', 'weeks10', 5, 42, 120, 400],
  ['Lokadalat', 'Lok Adalat settlements', 'The permanent lok adalat', 'Firozpur', 'matters settled', 'matters', 'B', 7, 'BENCH', 'months', 20, 160, 500, 1600],
  ['Attendance', 'Staff attendance', 'The establishment branch', 'Dabwali', 'members present', 'members', 'W', 6, 'WING', 'weeks11', 18, 60, 200, 620],
  ['Leave', 'Leave applications', 'The office superintendent', 'Gohana', 'leave applications passed', 'applications', 'S', 8, 'SECTION', 'months', 15, 110, 420, 1200],
  ['Stationery', 'Stationery indents', 'The store branch', 'Malerkotla', 'indents cleared', 'indents', 'S', 6, 'STORE', 'weeks10', 6, 50, 130, 440],
  ['Contempt', 'Contempt notices', 'The registry', 'Abohar', 'contempt notices issued', 'notices', 'S', 7, 'SEAT', 'months', 4, 34, 90, 300],
  ['Revenue', 'Revenue recovered', 'The recovery branch', 'Phagwara', 'recovery certificates', 'certificates', 'C', 6, 'CIRCLE', 'weeks11', 10, 88, 260, 860],
  ['Water', 'Water bills raised', 'The public health division', 'Sirhind', 'water bills raised', 'bills', 'Z', 8, 'ZONE', 'months', 60, 360, 1400, 4000],
  ['Sewer', 'Sewerage complaints', 'The municipal council', 'Jagadhri', 'complaints redressed', 'complaints', 'W', 6, 'WARD', 'weeks10', 8, 66, 190, 620],
  ['Streetlight', 'Street lights repaired', 'The municipal engineering wing', 'Pehowa', 'lights repaired', 'lights', 'W', 7, 'WARD', 'months', 12, 96, 300, 980],
  ['Birth', 'Birth certificates', 'The registrar of births', 'Samana', 'birth certificates issued', 'certificates', 'C', 6, 'COUNTER', 'weeks11', 20, 140, 460, 1500],
  ['Death', 'Death certificates', 'The registrar of deaths', 'Ellenabad', 'death certificates issued', 'certificates', 'C', 6, 'COUNTER', 'months', 10, 70, 240, 780],
  ['Marriage', 'Marriage registrations', 'The marriage registrar', 'Dhuri', 'marriages registered', 'marriages', 'S', 7, 'SLOT', 'weeks10', 4, 40, 110, 380],
  ['Trade', 'Trade licences', 'The municipal corporation', 'Kharar', 'trade licences issued', 'licences', 'Z', 8, 'ZONE', 'months', 25, 180, 700, 2000],
  ['Property', 'Property tax receipts', 'The property tax branch', 'Zirakpur', 'property tax receipts', 'receipts', 'W', 6, 'WARD', 'weeks11', 40, 260, 900, 2800],
  ['Grievance', 'Grievances redressed', 'The public grievance cell', 'Shahabad', 'grievances redressed', 'grievances', 'D', 7, 'DESK', 'months', 15, 120, 380, 1200],
  ['Rti', 'RTI applications', 'The public information officer', 'Rajpura', 'RTI applications answered', 'applications', 'S', 6, 'SEAT', 'weeks10', 6, 54, 140, 480],
  ['Immunise', 'Children immunised', 'The primary health centre', 'Naraingarh', 'children immunised', 'children', 'S', 8, 'SESSION', 'months', 30, 200, 760, 2200],
  ['Opd', 'OPD patients seen', 'The community health centre', 'Assandh', 'patients seen', 'patients', 'R', 6, 'ROOM', 'weeks11', 40, 260, 900, 2700],
  ['Bloodbank', 'Blood units collected', 'The blood bank', 'Ratia', 'blood units collected', 'units', 'C', 7, 'CAMP', 'months', 10, 90, 300, 980],
  ['Beds', 'Beds occupied', 'The district hospital', 'Tohana', 'beds occupied', 'beds', 'W', 6, 'WARD', 'weeks10', 12, 80, 220, 720],
  ['Mandi', 'Cotton arrivals', 'The grain market committee', 'Adampur', 'cotton bales weighed', 'bales', 'S', 8, 'SHED', 'months', 200, 1400, 5000, 14000],
  ['Wheat', 'Wheat lifted', 'The procurement agency', 'Rania', 'wheat bags lifted', 'bags', 'G', 6, 'GODOWN', 'weeks11', 300, 1800, 6000, 16000],
  ['Fertiliser', 'Fertiliser sold', 'The cooperative society', 'Cheeka', 'fertiliser bags sold', 'bags', 'D', 7, 'DEPOT', 'months', 100, 900, 3000, 9000],
  ['Seeds', 'Seed packets distributed', 'The agriculture department', 'Ghanaur', 'seed packets distributed', 'packets', 'B', 6, 'BLOCK', 'weeks10', 40, 300, 900, 2800],
  ['Tubewell', 'Tubewell connections', 'The electricity sub-division', 'Budhlada', 'connections released', 'connections', 'F', 8, 'FEEDER', 'months', 8, 70, 260, 820],
  ['Meter', 'Meters replaced', 'The power distribution office', 'Dirba', 'meters replaced', 'meters', 'F', 6, 'FEEDER', 'weeks11', 10, 96, 280, 900],
  ['Busstand', 'Tickets sold', 'The roadways bus stand', 'Dasuya', 'tickets sold (00)', 'tickets', 'R', 7, 'ROUTE', 'months', 80, 520, 2000, 5600],
  ['Toll', 'Toll receipts', 'The toll collection point', 'Lehragaga', 'toll receipts (00)', 'receipts', 'L', 6, 'LANE', 'weeks10', 60, 420, 1200, 3800],
  ['Forest', 'Saplings planted', 'The forest range office', 'Morinda', 'saplings planted', 'saplings', 'B', 8, 'BEAT', 'months', 200, 1600, 5000, 15000],
  ['Fire', 'Fire calls attended', 'The fire brigade station', 'Amloh', 'fire calls attended', 'calls', 'S', 6, 'STATION', 'weeks11', 3, 30, 70, 260],
  ['Police', 'FIRs registered', 'The police station', 'Bassi Pathana', 'FIRs registered', 'FIRs', 'B', 7, 'BEAT', 'months', 8, 64, 200, 640],
  ['Aadhaar', 'Aadhaar updates', 'The enrolment centre', 'Khanna', 'Aadhaar updates done', 'updates', 'K', 6, 'KIOSK', 'weeks10', 30, 220, 620, 2000],
];

DEFS.forEach((d, i) => {
  const [file, title, ctx, place, metric, unit, tag1, n1, cat1, g2mode, r1lo, r1hi, r2lo, r2hi] = d;
  const seed = 1000 + i * 7;
  const g2headers = g2mode === 'months' ? MONTHS : weekHeads(g2mode === 'weeks11' ? 11 : 10);
  const period = g2mode === 'months' ? 'month of the year' : 'week of the year';
  const chart = CHARTS[i % CHARTS.length];
  const ctitle = `${metric.toUpperCase()} BY ${cat1}`;
  scenarios.push({
    code: `XL${String(i + 9).padStart(2, '0')}`,
    difficulty: (i % 3) + 1,
    title,
    scenario: `${ctx} at ${place} records the ${metric} for each ${cat1.toLowerCase()} on a working day, and the ${metric} for each ${period}. Enter both tables and answer the parts below.`,
    filename: file,
    t1: { name: `${title} by ${cat1.toLowerCase()}`, headers: Array.from({ length: n1 }, (_, k) => `${tag1}${k + 1}`), values: makeVals(seed, n1, r1lo, r1hi, i % 3 === 0) },
    t2: { name: `${title} by ${g2mode === 'months' ? 'month' : 'week'}`, headers: g2headers, values: makeVals(seed + 3, g2headers.length, r2lo, r2hi, false) },
    chartType: chart, chartTitle: ctitle, catAxis: cat1, valAxis: unit.toUpperCase(),
  });
});

// Release schedule: first 6 visible at launch (offset 0); each later mock unlocks
// one day at a time from day 7 (offset 1 => day 7, offset 2 => day 8, ...).
scenarios.forEach((s, idx) => { s.release_offset = idx < 6 ? 0 : idx - 5; });

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
    release_offset: s.release_offset,
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
