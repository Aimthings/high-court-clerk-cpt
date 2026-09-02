// Spreadsheet formula engine — kept BYTE-IDENTICAL with client/src/excel/evaluate.js.
// Supports Excel-2007-safe functions only: SUM, MIN, MAX, AVERAGE, COUNT, ROUND,
// plus arithmetic (+ - * /), parentheses, A1 refs and A1:B2 ranges. One level of
// nesting is enough — ROUND(AVERAGE(...)) is the ceiling (brief §2).
import * as fx from '@formulajs/formulajs';

const FUNCS = {
  SUM: (a) => fx.SUM(...a),
  MIN: (a) => fx.MIN(...a),
  MAX: (a) => fx.MAX(...a),
  AVERAGE: (a) => fx.AVERAGE(...a),
  COUNT: (a) => fx.COUNT(...a),
  ROUND: (a) => fx.ROUND(a[0], a[1] ?? 0),
};

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
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
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

// ---- tokenizer ----
function tokenize(src) {
  const tokens = [];
  let i = 0;
  const re = {
    ws: /\s+/y, range: /[A-Z]+\d+:[A-Z]+\d+/y, ref: /[A-Z]+\d+/y,
    func: /[A-Z]+/y, num: /\d+(\.\d+)?/y, op: /[+\-*/(),]/y,
  };
  while (i < src.length) {
    let m;
    re.ws.lastIndex = i; if ((m = re.ws.exec(src))) { i = re.ws.lastIndex; continue; }
    re.range.lastIndex = i; if ((m = re.range.exec(src)) && m.index === i) { tokens.push({ t: 'range', v: m[0] }); i = re.range.lastIndex; continue; }
    re.ref.lastIndex = i; if ((m = re.ref.exec(src)) && m.index === i) { tokens.push({ t: 'ref', v: m[0] }); i = re.ref.lastIndex; continue; }
    re.func.lastIndex = i; if ((m = re.func.exec(src)) && m.index === i) { tokens.push({ t: 'func', v: m[0] }); i = re.func.lastIndex; continue; }
    re.num.lastIndex = i; if ((m = re.num.exec(src)) && m.index === i) { tokens.push({ t: 'num', v: Number(m[0]) }); i = re.num.lastIndex; continue; }
    re.op.lastIndex = i; if ((m = re.op.exec(src)) && m.index === i) { tokens.push({ t: m[0] }); i = re.op.lastIndex; continue; }
    throw new Error(`bad token at ${i}`);
  }
  return tokens;
}

// ---- recursive-descent parser/evaluator ----
function toNum(v) {
  if (v === '' || v == null) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

export function evaluateFormula(raw, getCell) {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (s === '') return '';
  if (!s.startsWith('=')) {
    const n = Number(s);
    return s !== '' && !Number.isNaN(n) ? n : s; // literal number or text
  }
  let tokens;
  try { tokens = tokenize(s.slice(1)); } catch { return '#ERROR'; }
  let p = 0;
  const peek = () => tokens[p];
  const eat = (t) => { const tok = tokens[p]; if (!tok || (t && tok.t !== t)) throw new Error('parse'); p += 1; return tok; };

  function rangeValues(rangeStr) {
    const [a, b] = rangeStr.split(':');
    return expandRange(a, b).map((ref) => toNum(getCell(ref)));
  }
  function argList() {
    const args = [];
    if (peek() && peek().t !== ')') {
      args.push(arg());
      while (peek() && peek().t === ',') { eat(','); args.push(arg()); }
    }
    return args;
  }
  // an argument is either a range (→ array of numbers) or an expression (→ number)
  function arg() {
    if (peek() && peek().t === 'range') return rangeValues(eat('range').v);
    return expr();
  }
  function expr() {
    let v = term();
    while (peek() && (peek().t === '+' || peek().t === '-')) {
      const op = eat().t; const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  function term() {
    let v = factor();
    while (peek() && (peek().t === '*' || peek().t === '/')) {
      const op = eat().t; const r = factor();
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  function factor() {
    const tok = peek();
    if (!tok) throw new Error('parse');
    if (tok.t === '-') { eat('-'); return -factor(); }
    if (tok.t === '(') { eat('('); const v = expr(); eat(')'); return v; }
    if (tok.t === 'num') { eat('num'); return tok.v; }
    if (tok.t === 'ref') { eat('ref'); return toNum(getCell(tok.v)); }
    if (tok.t === 'func') {
      const name = eat('func').v; eat('(');
      const args = argList().map((a) => (Array.isArray(a) ? a : [a]));
      eat(')');
      const flat = args.flat();
      const fn = FUNCS[name];
      if (!fn) throw new Error('unknown fn');
      return fn(flat);
    }
    throw new Error('parse');
  }

  try {
    const result = expr();
    if (peek()) throw new Error('trailing');
    return typeof result === 'number' && Number.isFinite(result) ? result : '#ERROR';
  } catch {
    return '#ERROR';
  }
}

// Evaluate a whole sheet: cells is { A1: rawString, ... }. Returns { A1: value }.
export function computeValues(cells) {
  const values = {};
  const visiting = new Set();
  function getVal(ref) {
    if (ref in values) return values[ref];
    if (visiting.has(ref)) return 0; // cycle guard
    visiting.add(ref);
    const v = evaluateFormula(cells[ref], getVal);
    visiting.delete(ref);
    values[ref] = v;
    return v;
  }
  for (const ref of Object.keys(cells)) getVal(ref);
  return values;
}
