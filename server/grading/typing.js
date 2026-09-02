// Authoritative typing scorer (brief §5). Deterministic — no AI.
// Score = (words typed − mistakes) ÷ minutes, pass at 30 (the S.S.S.C. rule,
// NOT gross or net WPM). Both the word and char mistake models are computed;
// the stricter (char) model is the default displayed score.

import { tokenize } from './tokenize.js';

const RESYNC_WINDOW = 3;

// Align typed tokens (hyp) against the printed passage (ref) with a limited
// look-ahead resync, so a single dropped/added word does not cascade.
export function alignTokens(ref, hyp) {
  const pairs = []; // { type: 'match' | 'sub' | 'spacing', ref, hyp }
  const dropped = []; // unmatched ref tokens (words the candidate skipped)
  const extra = []; // unmatched typed tokens (words the candidate added)
  let i = 0;
  let j = 0;

  while (i < ref.length && j < hyp.length) {
    if (ref[i] === hyp[j]) {
      pairs.push({ type: 'match', ref: ref[i], hyp: hyp[j] });
      i += 1; j += 1;
      continue;
    }
    // spacing — two ref words typed as one (missing space)
    if (i + 1 < ref.length && hyp[j] === ref[i] + ref[i + 1]) {
      pairs.push({ type: 'spacing', ref: `${ref[i]} ${ref[i + 1]}`, hyp: hyp[j] });
      i += 2; j += 1;
      continue;
    }
    // spacing — one ref word typed as two (extra space)
    if (j + 1 < hyp.length && hyp[j] + hyp[j + 1] === ref[i]) {
      pairs.push({ type: 'spacing', ref: ref[i], hyp: `${hyp[j]} ${hyp[j + 1]}` });
      i += 1; j += 2;
      continue;
    }
    // resync: look ahead up to 3 tokens each side before calling it a substitution
    let resynced = false;
    for (let k = 1; k <= RESYNC_WINDOW; k += 1) {
      if (i + k < ref.length && ref[i + k] === hyp[j]) {
        for (let d = 0; d < k; d += 1) dropped.push(ref[i + d]);
        i += k;
        resynced = true;
        break;
      }
      if (j + k < hyp.length && hyp[j + k] === ref[i]) {
        for (let e = 0; e < k; e += 1) extra.push(hyp[j + e]);
        j += k;
        resynced = true;
        break;
      }
    }
    if (resynced) continue;

    pairs.push({ type: 'sub', ref: ref[i], hyp: hyp[j] });
    i += 1; j += 1;
  }

  // Ref left over once the typed text runs out is the UNTYPED TAIL (the candidate
  // simply stopped) — not a mistake. Distinct from mid-stream `dropped` skips.
  const tail = [];
  while (i < ref.length) { tail.push(ref[i]); i += 1; }
  // Typed tokens beyond the passage are extra (submission longer than the passage).
  while (j < hyp.length) { extra.push(hyp[j]); j += 1; }

  return { pairs, dropped, extra, tail };
}

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, k) => k);
  for (let x = 1; x <= m; x += 1) {
    const cur = [x];
    for (let y = 1; y <= n; y += 1) {
      const cost = a[x - 1] === b[y - 1] ? 0 : 1;
      cur[y] = Math.min(prev[y] + 1, cur[y - 1] + 1, prev[y - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

const stripPunct = (s) => s.replace(/[^\p{L}\p{N}]/gu, '');

function isTransposition(a, b) {
  if (a.length !== b.length) return false;
  const diff = [];
  for (let k = 0; k < a.length; k += 1) if (a[k] !== b[k]) diff.push(k);
  if (diff.length !== 2) return false;
  const [x, y] = diff;
  return y === x + 1 && a[x] === b[y] && a[y] === b[x];
}

// Classify a wrong (substituted) pair into a mistake taxonomy class.
export function classify(ref, hyp) {
  if (ref === hyp) return null;
  if (ref.toLowerCase() === hyp.toLowerCase()) return 'capitalisation';
  const sr = stripPunct(ref);
  if (sr && sr === stripPunct(hyp)) return 'punctuation';
  if (isTransposition(ref, hyp)) return 'transposition';
  return 'spelling';
}

const round2 = (n) => Math.round(n * 100) / 100;
const wpm = (net, minutes) => (minutes > 0 ? round2(Math.max(0, net) / minutes) : 0);

export function scoreTyping({ passage, typed, durationSec }) {
  const ref = tokenize(passage || '');
  const hyp = tokenize(typed || '');
  const wordsTyped = hyp.length;

  const { pairs, dropped, extra, tail } = alignTokens(ref, hyp);

  const taxonomy = {
    capitalisation: 0, punctuation: 0, transposition: 0,
    spacing: 0, dropped: 0, extra: 0, spelling: 0,
  };
  let mistakesWord = 0;
  let mistakesChar = 0;

  for (const p of pairs) {
    if (p.type === 'match') continue;
    if (p.type === 'spacing') {
      taxonomy.spacing += 1;
      mistakesWord += 1;
      mistakesChar += 1;
      continue;
    }
    // substitution
    const cls = classify(p.ref, p.hyp);
    if (cls) taxonomy[cls] += 1;
    mistakesWord += 1;
    mistakesChar += Math.min(levenshtein(p.ref, p.hyp), Math.max(p.ref.length, p.hyp.length));
  }
  for (const e of extra) {
    taxonomy.extra += 1;
    mistakesWord += 1;
    mistakesChar += e.length;
  }
  taxonomy.dropped += dropped.length; // recorded, but not a word/char mistake per the brief

  const minutes = durationSec > 0 ? durationSec / 60 : 0;
  const ssscWpmWord = wpm(wordsTyped - mistakesWord, minutes);
  const ssscWpmChar = wpm(wordsTyped - mistakesChar, minutes);
  const ssscWpm = ssscWpmChar; // stricter model is the default (brief §2)

  const typedChars = (typed || '').trim().length;
  const grossWpm = wpm(typedChars / 5, minutes);
  const correct = pairs.reduce((c, p) => c + (p.type === 'match' ? 1 : 0), 0);
  const accuracyPct = wordsTyped > 0 ? round2((correct / wordsTyped) * 100) : 0;

  return {
    wordsTyped,
    mistakesWord,
    mistakesChar,
    ssscWpm,
    ssscWpmWord,
    ssscWpmChar,
    grossWpm,
    accuracyPct,
    taxonomy,
    dropped,
    extra,
    notReached: tail.length, // untyped tail — informational, never a mistake
    passed: ssscWpm >= 30,
  };
}
