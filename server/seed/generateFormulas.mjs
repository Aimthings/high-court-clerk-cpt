// Generates server/seed/formulas.json — the Formula Library. Each lesson has a
// tutorial and a graded practice. Expected answers are COMPUTED by running the
// model solution through the real engine, so they can never drift.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { evaluateFormula, computeValues } from '../grading/evaluate.js';

const here = dirname(fileURLToPath(import.meta.url));

// Shared datasets (court/clerk themed) reused across lessons.
const MARKS = { A1: 'Candidate', B1: 'Marks', A2: 'Gurpreet', B2: 72, A3: 'Neha', B3: 0, A4: 'Arun', B4: 45, A5: 'Simran', B5: 88, A6: 'Deepak', B6: 63 };
const BLANKS = { A1: 12, A2: '', A3: 25, A4: '', A5: 18 };
const NAMES = { A1: 'gurpreet singh', A2: 'NEHA KAUSHIK', A3: 'arun verma' };
const DIST = { A1: 'Candidate', B1: 'District', C1: 'Marks', A2: 'Gurpreet', B2: 'Punjab', C2: 72, A3: 'Neha', B3: 'Haryana', C3: 45, A4: 'Arun', B4: 'Punjab', C4: 88, A5: 'Simran', B5: 'Haryana', C5: 63 };
const VTABLE = { A1: 'Roll', B1: 'Name', A2: 101, B2: 'Gurpreet', A3: 102, B3: 'Neha', A4: 103, B4: 'Arun', A5: 104, B5: 'Simran' };
const HTABLE = { A1: 'Mon', B1: 'Tue', C1: 'Wed', D1: 'Thu', A2: 12, B2: 8, C2: 15, D2: 4 };
const DATES = { A1: 'Joined', B1: '2019-06-11', A2: 'Today ref', B2: '2026-09-03' };

function lesson(o) { return o; }

const RAW = [
  // ---- Math & basic stats ----
  lesson({ slug: 'sum', name: 'SUM', track: 'Math & stats', difficulty: 1,
    tutorial: { what: 'Adds up a range of numbers.', syntax: '=SUM(range)', example: '=SUM(B2:B6) adds every mark in B2 to B6.' },
    data: MARKS, taskCell: 'B7', prompt: 'In B7, add up all the marks (B2:B6).', requireFns: ['SUM'], solution: '=SUM(B2:B6)', hint: 'Point SUM at the whole marks column.' }),
  lesson({ slug: 'average', name: 'AVERAGE', track: 'Math & stats', difficulty: 1,
    tutorial: { what: 'Returns the arithmetic mean of a range.', syntax: '=AVERAGE(range)', example: '=AVERAGE(B2:B6) is the mean of the marks.' },
    data: MARKS, taskCell: 'B7', prompt: 'In B7, find the average of the marks (B2:B6).', requireFns: ['AVERAGE'], solution: '=AVERAGE(B2:B6)' }),
  lesson({ slug: 'count', name: 'COUNT', track: 'Math & stats', difficulty: 1,
    tutorial: { what: 'Counts how many cells in a range contain NUMBERS.', syntax: '=COUNT(range)', example: '=COUNT(A1:A5) ignores text and blanks.' },
    data: BLANKS, taskCell: 'A6', prompt: 'In A6, count how many cells in A1:A5 hold a number.', requireFns: ['COUNT'], solution: '=COUNT(A1:A5)' }),
  lesson({ slug: 'counta', name: 'COUNTA', track: 'Math & stats', difficulty: 1,
    tutorial: { what: 'Counts cells that are NOT empty (numbers or text).', syntax: '=COUNTA(range)', example: '=COUNTA(A2:A6) counts every filled name.' },
    data: MARKS, taskCell: 'A7', prompt: 'In A7, count how many candidate names are filled in A2:A6.', requireFns: ['COUNTA'], solution: '=COUNTA(A2:A6)' }),
  lesson({ slug: 'countblank', name: 'COUNTBLANK', track: 'Math & stats', difficulty: 2,
    tutorial: { what: 'Counts the EMPTY cells in a range.', syntax: '=COUNTBLANK(range)', example: '=COUNTBLANK(A1:A5) counts the gaps.' },
    data: BLANKS, taskCell: 'A6', prompt: 'In A6, count the blank cells in A1:A5.', requireFns: ['COUNTBLANK'], solution: '=COUNTBLANK(A1:A5)' }),
  lesson({ slug: 'max', name: 'MAX', track: 'Math & stats', difficulty: 1,
    tutorial: { what: 'Returns the largest number in a range.', syntax: '=MAX(range)', example: '=MAX(B2:B6) is the top mark.' },
    data: MARKS, taskCell: 'B7', prompt: 'In B7, find the highest mark (B2:B6).', requireFns: ['MAX'], solution: '=MAX(B2:B6)' }),
  lesson({ slug: 'min', name: 'MIN', track: 'Math & stats', difficulty: 1,
    tutorial: { what: 'Returns the smallest number in a range — a zero counts.', syntax: '=MIN(range)', example: '=MIN(B2:B6) can return 0.' },
    data: MARKS, taskCell: 'B7', prompt: 'In B7, find the lowest mark (B2:B6).', requireFns: ['MIN'], solution: '=MIN(B2:B6)' }),
  lesson({ slug: 'round', name: 'ROUND', track: 'Math & stats', difficulty: 2,
    tutorial: { what: 'Rounds a number to a set number of decimal places.', syntax: '=ROUND(number, digits)', example: '=ROUND(AVERAGE(B2:B6),1) rounds the mean to 1 decimal.' },
    data: MARKS, taskCell: 'B7', prompt: 'In B7, the average of B2:B6 rounded to 1 decimal place.', requireFns: ['ROUND', 'AVERAGE'], solution: '=ROUND(AVERAGE(B2:B6),1)', hint: 'Wrap AVERAGE inside ROUND.' }),
  lesson({ slug: 'product', name: 'PRODUCT', track: 'Math & stats', difficulty: 2,
    tutorial: { what: 'Multiplies all the numbers given to it.', syntax: '=PRODUCT(range)', example: '=PRODUCT(A1,A2) multiplies two cells.' },
    data: { A1: 6, A2: 7, A3: 2 }, taskCell: 'A4', prompt: 'In A4, multiply A1, A2 and A3 together.', requireFns: ['PRODUCT'], solution: '=PRODUCT(A1:A3)' }),
  lesson({ slug: 'sqrt', name: 'SQRT', track: 'Math & stats', difficulty: 2,
    tutorial: { what: 'Returns the square root of a number.', syntax: '=SQRT(number)', example: '=SQRT(A1)' },
    data: { A1: 144 }, taskCell: 'A2', prompt: 'In A2, the square root of A1.', requireFns: ['SQRT'], solution: '=SQRT(A1)' }),

  // ---- Logical ----
  lesson({ slug: 'if', name: 'IF', track: 'Logical', difficulty: 2,
    tutorial: { what: 'Returns one value if a test is TRUE and another if FALSE.', syntax: '=IF(test, value_if_true, value_if_false)', example: '=IF(B2>=40,"Pass","Fail")' },
    data: MARKS, taskCell: 'C2', prompt: 'In C2, show "Pass" if the mark in B2 is 40 or more, else "Fail".', requireFns: ['IF'], solution: '=IF(B2>=40,"Pass","Fail")', hint: 'Text results must be in "quotes".' }),
  lesson({ slug: 'nested-if', name: 'Nested IF', track: 'Logical', difficulty: 3,
    tutorial: { what: 'An IF inside another IF, to pick between three or more outcomes.', syntax: '=IF(test1, a, IF(test2, b, c))', example: '=IF(B2>=75,"A",IF(B2>=40,"B","Fail"))' },
    data: MARKS, taskCell: 'C2', prompt: 'In C2: "A" if B2>=75, else "B" if B2>=40, else "Fail".', requireFns: ['IF'], solution: '=IF(B2>=75,"A",IF(B2>=40,"B","Fail"))', hint: 'Put the second IF in the false slot of the first.' }),
  lesson({ slug: 'iferror', name: 'IFERROR', track: 'Logical', difficulty: 2,
    tutorial: { what: 'Catches an error and shows your own value instead.', syntax: '=IFERROR(formula, value_if_error)', example: '=IFERROR(A1/A2,"n/a") avoids a divide-by-zero error.' },
    data: { A1: 50, A2: 0 }, taskCell: 'A3', prompt: 'In A3, divide A1 by A2 but show "n/a" if it errors.', requireFns: ['IFERROR'], solution: '=IFERROR(A1/A2,"n/a")' }),

  // ---- Conditional totals ----
  lesson({ slug: 'sumif', name: 'SUMIF', track: 'Conditional totals', difficulty: 2,
    tutorial: { what: 'Adds only the values that meet one condition.', syntax: '=SUMIF(criteria_range, criteria, sum_range)', example: '=SUMIF(B2:B5,"Punjab",C2:C5) sums Punjab marks.' },
    data: DIST, taskCell: 'C6', prompt: 'In C6, total the marks (C2:C5) only for the district "Punjab" (B2:B5).', requireFns: ['SUMIF'], solution: '=SUMIF(B2:B5,"Punjab",C2:C5)' }),
  lesson({ slug: 'sumifs', name: 'SUMIFS', track: 'Conditional totals', difficulty: 3,
    tutorial: { what: 'Adds values that meet SEVERAL conditions. Note the order: sum range first.', syntax: '=SUMIFS(sum_range, range1, cond1, range2, cond2)', example: '=SUMIFS(C2:C5,B2:B5,"Punjab",C2:C5,">=50")' },
    data: DIST, taskCell: 'C6', prompt: 'In C6, total marks (C2:C5) where district is "Punjab" AND marks are >= 50.', requireFns: ['SUMIFS'], solution: '=SUMIFS(C2:C5,B2:B5,"Punjab",C2:C5,">=50")', hint: 'SUMIFS puts the sum range FIRST.' }),
  lesson({ slug: 'averageif', name: 'AVERAGEIF', track: 'Conditional totals', difficulty: 2,
    tutorial: { what: 'Averages only the values that meet one condition.', syntax: '=AVERAGEIF(criteria_range, criteria, average_range)', example: '=AVERAGEIF(B2:B5,"Haryana",C2:C5)' },
    data: DIST, taskCell: 'C6', prompt: 'In C6, average the marks (C2:C5) for district "Haryana" (B2:B5).', requireFns: ['AVERAGEIF'], solution: '=AVERAGEIF(B2:B5,"Haryana",C2:C5)' }),

  // ---- Text ----
  lesson({ slug: 'len', name: 'LEN', track: 'Text', difficulty: 1,
    tutorial: { what: 'Counts the characters in a piece of text (spaces included).', syntax: '=LEN(text)', example: '=LEN(A1)' },
    data: NAMES, taskCell: 'B1', prompt: 'In B1, count the characters in the name in A1.', requireFns: ['LEN'], solution: '=LEN(A1)' }),
  lesson({ slug: 'upper', name: 'UPPER', track: 'Text', difficulty: 1,
    tutorial: { what: 'Converts text to UPPERCASE.', syntax: '=UPPER(text)', example: '=UPPER(A1)' },
    data: NAMES, taskCell: 'B1', prompt: 'In B1, put the name in A1 into uppercase.', requireFns: ['UPPER'], solution: '=UPPER(A1)' }),
  lesson({ slug: 'lower', name: 'LOWER', track: 'Text', difficulty: 1,
    tutorial: { what: 'Converts text to lowercase.', syntax: '=LOWER(text)', example: '=LOWER(A2)' },
    data: NAMES, taskCell: 'B2', prompt: 'In B2, put the name in A2 into lowercase.', requireFns: ['LOWER'], solution: '=LOWER(A2)' }),
  lesson({ slug: 'proper', name: 'PROPER', track: 'Text', difficulty: 1,
    tutorial: { what: 'Capitalises The First Letter Of Each Word.', syntax: '=PROPER(text)', example: '=PROPER(A1)' },
    data: NAMES, taskCell: 'B1', prompt: 'In B1, convert the name in A1 to Proper Case.', requireFns: ['PROPER'], solution: '=PROPER(A1)' }),
  lesson({ slug: 'left', name: 'LEFT', track: 'Text', difficulty: 2,
    tutorial: { what: 'Takes a number of characters from the START of text.', syntax: '=LEFT(text, n)', example: '=LEFT(A1,3) takes the first 3 letters.' },
    data: NAMES, taskCell: 'B1', prompt: 'In B1, take the first 3 characters of A1.', requireFns: ['LEFT'], solution: '=LEFT(A1,3)' }),
  lesson({ slug: 'right', name: 'RIGHT', track: 'Text', difficulty: 2,
    tutorial: { what: 'Takes a number of characters from the END of text.', syntax: '=RIGHT(text, n)', example: '=RIGHT(A1,5)' },
    data: NAMES, taskCell: 'B1', prompt: 'In B1, take the last 5 characters of A1.', requireFns: ['RIGHT'], solution: '=RIGHT(A1,5)' }),
  lesson({ slug: 'mid', name: 'MID', track: 'Text', difficulty: 2,
    tutorial: { what: 'Takes characters from the MIDDLE, given a start position and length.', syntax: '=MID(text, start, length)', example: '=MID(A1,1,4)' },
    data: NAMES, taskCell: 'B1', prompt: 'In B1, take 4 characters of A1 starting at position 1.', requireFns: ['MID'], solution: '=MID(A1,1,4)' }),
  lesson({ slug: 'trim', name: 'TRIM', track: 'Text', difficulty: 2,
    tutorial: { what: 'Removes extra spaces, keeping single spaces between words.', syntax: '=TRIM(text)', example: '=TRIM(A1)' },
    data: { A1: '  gurpreet   singh  ' }, taskCell: 'B1', prompt: 'In B1, clean the extra spaces from A1.', requireFns: ['TRIM'], solution: '=TRIM(A1)' }),
  lesson({ slug: 'concatenate', name: 'CONCATENATE', track: 'Text', difficulty: 2,
    tutorial: { what: 'Joins several pieces of text into one.', syntax: '=CONCATENATE(a, b, c)', example: '=CONCATENATE(A1," ",B1)' },
    data: { A1: 'Gurpreet', B1: 'Singh' }, taskCell: 'C1', prompt: 'In C1, join A1 and B1 with a space between them.', requireFns: ['CONCATENATE'], solution: '=CONCATENATE(A1," ",B1)' }),

  // ---- Lookup & reference ----
  lesson({ slug: 'vlookup', name: 'VLOOKUP', track: 'Lookup & reference', difficulty: 2,
    tutorial: { what: 'Looks a value up in the FIRST column of a table and returns a value from another column.', syntax: '=VLOOKUP(value, table, col_index, FALSE)', example: '=VLOOKUP(103,A2:B5,2,FALSE) finds the name for roll 103.' },
    data: VTABLE, taskCell: 'D1', prompt: 'In D1, find the name for roll number 103 using the table A2:B5.', requireFns: ['VLOOKUP'], solution: '=VLOOKUP(103,A2:B5,2,FALSE)', hint: 'Use FALSE for an exact match.' }),
  lesson({ slug: 'hlookup', name: 'HLOOKUP', track: 'Lookup & reference', difficulty: 2,
    tutorial: { what: 'Like VLOOKUP but searches the FIRST ROW of a horizontal table.', syntax: '=HLOOKUP(value, table, row_index, FALSE)', example: '=HLOOKUP("Wed",A1:D2,2,FALSE)' },
    data: HTABLE, taskCell: 'A4', prompt: 'In A4, find the value under "Wed" using the table A1:D2.', requireFns: ['HLOOKUP'], solution: '=HLOOKUP("Wed",A1:D2,2,FALSE)' }),
  lesson({ slug: 'index', name: 'INDEX', track: 'Lookup & reference', difficulty: 3,
    tutorial: { what: 'Returns the value at a given position in a range.', syntax: '=INDEX(range, row_number)', example: '=INDEX(B2:B5,3) returns the 3rd name.' },
    data: VTABLE, taskCell: 'D1', prompt: 'In D1, return the 3rd name from B2:B5 using INDEX.', requireFns: ['INDEX'], solution: '=INDEX(B2:B5,3)' }),
  lesson({ slug: 'match', name: 'MATCH', track: 'Lookup & reference', difficulty: 3,
    tutorial: { what: 'Returns the POSITION of a value within a range.', syntax: '=MATCH(value, range, 0)', example: '=MATCH(103,A2:A5,0) returns 3.' },
    data: VTABLE, taskCell: 'D1', prompt: 'In D1, find the position of roll 104 within A2:A5.', requireFns: ['MATCH'], solution: '=MATCH(104,A2:A5,0)', hint: 'Use 0 for an exact match.' }),
  lesson({ slug: 'index-match', name: 'INDEX + MATCH', track: 'Lookup & reference', difficulty: 3,
    tutorial: { what: 'MATCH finds the row, INDEX returns the value there — a flexible lookup.', syntax: '=INDEX(return_range, MATCH(value, lookup_range, 0))', example: '=INDEX(B2:B5,MATCH(102,A2:A5,0))' },
    data: VTABLE, taskCell: 'D1', prompt: 'In D1, use INDEX+MATCH to return the name for roll 102.', requireFns: ['INDEX', 'MATCH'], solution: '=INDEX(B2:B5,MATCH(102,A2:A5,0))' }),

  // ---- Date ----
  lesson({ slug: 'today', name: 'TODAY', track: 'Date', difficulty: 1,
    tutorial: { what: "Returns today's date. It updates every day.", syntax: '=TODAY()', example: '=TODAY()' },
    data: {}, taskCell: 'A1', prompt: "In A1, show today's date.", requireFns: ['TODAY'], solution: '=TODAY()', gradeOn: 'formula' }),
  lesson({ slug: 'day-month-year', name: 'DAY / MONTH / YEAR', track: 'Date', difficulty: 2,
    tutorial: { what: 'Pull the day, month or year number out of a date.', syntax: '=DAY(date)  =MONTH(date)  =YEAR(date)', example: '=YEAR(B1) returns 2019.' },
    data: DATES, taskCell: 'C1', prompt: 'In C1, return the YEAR of the joining date in B1.', requireFns: ['YEAR'], solution: '=YEAR(B1)' }),
  lesson({ slug: 'datedif', name: 'DATEDIF', track: 'Date', difficulty: 3,
    tutorial: { what: 'Counts whole years, months or days between two dates.', syntax: '=DATEDIF(start, end, "Y")', example: '=DATEDIF(B1,B2,"Y") counts completed years.' },
    data: DATES, taskCell: 'C1', prompt: 'In C1, the number of completed YEARS between B1 (joined) and B2.', requireFns: ['DATEDIF'], solution: '=DATEDIF(B1,B2,"Y")', hint: 'The last argument "Y" means whole years.' }),

  // ---- Advanced ----
  lesson({ slug: 'sumproduct', name: 'SUMPRODUCT', track: 'Advanced', difficulty: 3,
    tutorial: { what: 'Multiplies matching cells of two ranges, then adds the results — great for weighted totals.', syntax: '=SUMPRODUCT(range1, range2)', example: '=SUMPRODUCT(A2:A4,B2:B4) sums qty x price.' },
    data: { A1: 'Qty', B1: 'Price', A2: 3, B2: 20, A3: 5, B3: 12, A4: 2, B4: 50 }, taskCell: 'C1', prompt: 'In C1, the total value = quantity x price summed over rows 2 to 4.', requireFns: ['SUMPRODUCT'], solution: '=SUMPRODUCT(A2:A4,B2:B4)' }),
  lesson({ slug: 'rank', name: 'RANK', track: 'Advanced', difficulty: 2,
    tutorial: { what: 'Returns the rank (position) of a number within a list.', syntax: '=RANK(number, range, 0)', example: '=RANK(B2,B2:B6,0) — 0 means highest ranks first.' },
    data: MARKS, taskCell: 'C2', prompt: 'In C2, the rank of the mark in B2 within B2:B6 (highest = 1).', requireFns: ['RANK'], solution: '=RANK(B2,B2:B6,0)' }),
  lesson({ slug: 'large', name: 'LARGE', track: 'Advanced', difficulty: 2,
    tutorial: { what: 'Returns the k-th LARGEST value in a range.', syntax: '=LARGE(range, k)', example: '=LARGE(B2:B6,2) is the 2nd highest mark.' },
    data: MARKS, taskCell: 'B7', prompt: 'In B7, the 2nd highest mark in B2:B6.', requireFns: ['LARGE'], solution: '=LARGE(B2:B6,2)' }),
  lesson({ slug: 'small', name: 'SMALL', track: 'Advanced', difficulty: 2,
    tutorial: { what: 'Returns the k-th SMALLEST value in a range.', syntax: '=SMALL(range, k)', example: '=SMALL(B2:B6,2) is the 2nd lowest mark.' },
    data: MARKS, taskCell: 'B7', prompt: 'In B7, the 2nd lowest mark in B2:B6.', requireFns: ['SMALL'], solution: '=SMALL(B2:B6,2)' }),
];

const round2 = (n) => Math.round(n * 100) / 100;

const lessons = RAW.map((L, i) => {
  const getCell = (ref) => computeValues(L.data)[ref];
  const result = evaluateFormula(L.solution, getCell);
  let expect;
  if (typeof result === 'number') expect = { type: 'number', value: round2(result), tolerance: 0.01 };
  else expect = { type: 'text', value: String(result) };
  if (L.gradeOn === 'formula') expect = { type: 'formula' }; // e.g. TODAY (value changes daily)

  return {
    id: i + 1,
    slug: L.slug,
    name: L.name,
    track: L.track,
    difficulty: L.difficulty,
    tutorial: L.tutorial,
    data: L.data,
    taskCell: L.taskCell,
    prompt: L.prompt,
    hint: L.hint || null,
    // graded fields (stripped before sending to the browser):
    _requireFns: L.requireFns,
    _solution: L.solution,
    _expect: expect,
  };
});

// sanity: every non-TODAY solution must evaluate without error
for (const L of lessons) {
  if (L._expect.type !== 'formula' && String(L._expect.value).includes('#ERROR')) {
    throw new Error(`lesson ${L.slug} solution errored: ${L._solution}`);
  }
}
console.log(`generated ${lessons.length} lessons across ${new Set(lessons.map((l) => l.track)).size} tracks`);
writeFileSync(join(here, 'formulas.json'), JSON.stringify(lessons, null, 2) + '\n');
console.log('wrote formulas.json');
