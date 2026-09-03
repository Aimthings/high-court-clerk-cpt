// Spreadsheet formula engine — kept BYTE-IDENTICAL with client/src/excel/evaluate.js.
// Excel-2007-safe functions only. Extended for the Formula Library: strings,
// comparisons (= <> < > <= >=), & concatenation, and a broad function set
// delegated to formulajs (VLOOKUP, INDEX/MATCH, text, date, logical, etc.).
import * as fx from '@formulajs/formulajs';

// ---- A1 helpers ----
export function colToNum(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}
export function numToCol(n) {
  let s = '';
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
export function parseRef(ref) {
  const m = /^\$?([A-Z]+)\$?(\d+)$/.exec(ref);
  if (!m) return null;
  return { col: colToNum(m[1]), row: Number(m[2]) };
}
export function expandRange(a, b) {
  const A = parseRef(a); const B = parseRef(b);
  if (!A || !B) return [];
  const out = [];
  const c1 = Math.min(A.col, B.col); const c2 = Math.max(A.col, B.col);
  const r1 = Math.min(A.row, B.row); const r2 = Math.max(A.row, B.row);
  for (let r = r1; r <= r2; r += 1) for (let c = c1; c <= c2; c += 1) out.push(`${numToCol(c)}${r}`);
  return out;
}
// 2D grid of a range (rows x cols) using getCell.
function rangeGrid(a, b, getCell) {
  const A = parseRef(a); const B = parseRef(b);
  if (!A || !B) return [[]];
  const c1 = Math.min(A.col, B.col); const c2 = Math.max(A.col, B.col);
  const r1 = Math.min(A.row, B.row); const r2 = Math.max(A.row, B.row);
  const grid = [];
  for (let r = r1; r <= r2; r += 1) {
    const row = [];
    for (let c = c1; c <= c2; c += 1) row.push(coerceScalar(getCell(`${numToCol(c)}${r}`)));
    grid.push(row);
  }
  return grid;
}

// ---- value coercion ----
function coerceScalar(v) {
  if (v === '' || v == null) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  const s = String(v);
  if (s !== '' && !Number.isNaN(Number(s))) return Number(s);
  return s;
}
function toNum(v) {
  if (v === '' || v == null) return 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}
function toStr(v) {
  if (v === '' || v == null) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

// Which functions need a 2D grid vs a flat 1D list for range arguments.
const GRID_FUNCS = new Set(['VLOOKUP', 'HLOOKUP', 'INDEX', 'SUMPRODUCT']);
const DATE_FUNCS = new Set(['DAY', 'MONTH', 'YEAR', 'DATEDIF', 'WEEKDAY']);

// Supported functions (uppercase) → delegate to formulajs.
const FUNCS = new Set([
  'SUM', 'AVERAGE', 'COUNT', 'COUNTA', 'COUNTBLANK', 'MAX', 'MIN', 'ROUND', 'ROUNDUP', 'ROUNDDOWN',
  'PRODUCT', 'SQRT', 'POWER', 'ABS', 'MOD', 'INT',
  'IF', 'IFERROR', 'AND', 'OR', 'NOT',
  'SUMIF', 'SUMIFS', 'AVERAGEIF', 'AVERAGEIFS', 'COUNTIF', 'COUNTIFS',
  'LEN', 'UPPER', 'LOWER', 'PROPER', 'LEFT', 'RIGHT', 'MID', 'TRIM', 'CONCATENATE', 'CONCAT', 'TEXT',
  'VLOOKUP', 'HLOOKUP', 'INDEX', 'MATCH',
  'TODAY', 'NOW', 'DATE', 'DAY', 'MONTH', 'YEAR', 'DATEDIF', 'WEEKDAY',
  'SUMPRODUCT', 'RANK', 'LARGE', 'SMALL',
]);

// Some formulajs functions live under a different export name.
const ALIASES = { RANK: 'RANKEQ' };

function callFunc(name, rawArgs) {
  const fnName = name.toUpperCase();
  if (!FUNCS.has(fnName)) throw new Error(`unknown fn ${fnName}`);
  const fn = fx[ALIASES[fnName] || fnName];
  if (typeof fn !== 'function') throw new Error(`unsupported fn ${fnName}`);

  const args = rawArgs.map((a) => {
    if (a && a.__range) return GRID_FUNCS.has(fnName) ? a.grid : a.grid.flat();
    if (DATE_FUNCS.has(fnName) && typeof a === 'string' && a) {
      const d = new Date(a);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return a;
  });

  let out = fn(...args);
  if (out instanceof Error) return '#ERROR';
  if (typeof out === 'object' && out !== null && !(out instanceof Date) && !Array.isArray(out)) {
    // formulajs may return an error-like object
    if (out.value !== undefined) out = out.value; else return '#ERROR';
  }
  return out;
}

// ---- tokenizer ----
function tokenize(src) {
  const tokens = [];
  let i = 0;
  const re = {
    ws: /\s+/y,
    str: /"(?:[^"]|"")*"/y,
    range: /\$?[A-Z]+\$?\d+:\$?[A-Z]+\$?\d+/y,
    ref: /\$?[A-Z]+\$?\d+/y,
    name: /[A-Z][A-Z0-9._]*/y,
    num: /\d+(\.\d+)?/y,
    cmp: /<=|>=|<>|=|<|>/y,
    op: /[+\-*/&(),%]/y,
  };
  while (i < src.length) {
    let m;
    re.ws.lastIndex = i; if ((m = re.ws.exec(src)) && m.index === i) { i = re.ws.lastIndex; continue; }
    re.str.lastIndex = i; if ((m = re.str.exec(src)) && m.index === i) { tokens.push({ t: 'str', v: m[0].slice(1, -1).replace(/""/g, '"') }); i = re.str.lastIndex; continue; }
    re.range.lastIndex = i; if ((m = re.range.exec(src)) && m.index === i) { tokens.push({ t: 'range', v: m[0] }); i = re.range.lastIndex; continue; }
    re.ref.lastIndex = i; if ((m = re.ref.exec(src)) && m.index === i) { tokens.push({ t: 'ref', v: m[0] }); i = re.ref.lastIndex; continue; }
    re.name.lastIndex = i; if ((m = re.name.exec(src)) && m.index === i) { tokens.push({ t: 'name', v: m[0] }); i = re.name.lastIndex; continue; }
    re.num.lastIndex = i; if ((m = re.num.exec(src)) && m.index === i) { tokens.push({ t: 'num', v: Number(m[0]) }); i = re.num.lastIndex; continue; }
    re.cmp.lastIndex = i; if ((m = re.cmp.exec(src)) && m.index === i) { tokens.push({ t: 'cmp', v: m[0] }); i = re.cmp.lastIndex; continue; }
    re.op.lastIndex = i; if ((m = re.op.exec(src)) && m.index === i) { tokens.push({ t: m[0] }); i = re.op.lastIndex; continue; }
    throw new Error(`bad token at ${i}`);
  }
  return tokens;
}

function compare(op, a, b) {
  const an = typeof a === 'number', bn = typeof b === 'number';
  let x = a; let y = b;
  if (!(an && bn)) { x = toStr(a).toLowerCase(); y = toStr(b).toLowerCase(); }
  switch (op) {
    case '=': return x === y;
    case '<>': return x !== y;
    case '<': return x < y;
    case '>': return x > y;
    case '<=': return x <= y;
    case '>=': return x >= y;
    default: return false;
  }
}

export function evaluateFormula(raw, getCell) {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (s === '') return '';
  if (!s.startsWith('=')) {
    const n = Number(s);
    return s !== '' && !Number.isNaN(n) ? n : s;
  }
  let tokens;
  try { tokens = tokenize(s.slice(1)); } catch { return '#ERROR'; }
  let p = 0;
  const peek = () => tokens[p];
  const eat = (t) => { const tok = tokens[p]; if (!tok || (t && tok.t !== t)) throw new Error('parse'); p += 1; return tok; };

  function expr() { // comparison (lowest precedence)
    let v = concat();
    while (peek() && peek().t === 'cmp') { const op = eat('cmp').v; v = compare(op, v, concat()); }
    return v;
  }
  function concat() {
    let v = addsub();
    while (peek() && peek().t === '&') { eat('&'); v = toStr(v) + toStr(addsub()); }
    return v;
  }
  function addsub() {
    let v = muldiv();
    while (peek() && (peek().t === '+' || peek().t === '-')) {
      const op = eat().t; const r = muldiv();
      v = op === '+' ? toNum(v) + toNum(r) : toNum(v) - toNum(r);
    }
    return v;
  }
  function muldiv() {
    let v = unary();
    while (peek() && (peek().t === '*' || peek().t === '/')) {
      const op = eat().t; const r = unary();
      v = op === '*' ? toNum(v) * toNum(r) : toNum(v) / toNum(r);
    }
    return v;
  }
  function unary() {
    if (peek() && peek().t === '-') { eat('-'); return -toNum(unary()); }
    return primary();
  }
  function argList() {
    const args = [];
    if (peek() && peek().t !== ')') {
      args.push(arg());
      while (peek() && peek().t === ',') { eat(','); args.push(peek() && peek().t === ')' ? '' : arg()); }
    }
    return args;
  }
  function arg() {
    if (peek() && peek().t === 'range') return { __range: true, grid: rangeGrid(...eat('range').v.split(':'), getCell) };
    return expr();
  }
  function primary() {
    const tok = peek();
    if (!tok) throw new Error('parse');
    if (tok.t === 'num') { eat('num'); return tok.v; }
    if (tok.t === 'str') { eat('str'); return tok.v; }
    if (tok.t === '(') { eat('('); const v = expr(); eat(')'); return v; }
    if (tok.t === 'range') { const parts = eat('range').v.split(':'); return { __range: true, grid: rangeGrid(parts[0], parts[1], getCell) }; }
    if (tok.t === 'ref') { eat('ref'); return coerceScalar(getCell(tok.v.replace(/\$/g, ''))); }
    if (tok.t === 'name') {
      const name = eat('name').v;
      if (name === 'TRUE') return true;
      if (name === 'FALSE') return false;
      eat('('); const args = argList(); eat(')');
      return callFunc(name, args);
    }
    throw new Error('parse');
  }

  try {
    const result = expr();
    if (peek()) throw new Error('trailing');
    if (result && result.__range) return '#ERROR';
    if (typeof result === 'number' && !Number.isFinite(result)) return '#ERROR';
    return result;
  } catch {
    return '#ERROR';
  }
}

// Evaluate a whole sheet: cells is { A1: rawString }. Returns { A1: value }.
export function computeValues(cells) {
  const values = {};
  const visiting = new Set();
  function getVal(ref) {
    if (ref in values) return values[ref];
    if (visiting.has(ref)) return 0;
    visiting.add(ref);
    const v = evaluateFormula(cells[ref], getVal);
    visiting.delete(ref);
    values[ref] = v;
    return v;
  }
  for (const ref of Object.keys(cells)) getVal(ref);
  return values;
}
