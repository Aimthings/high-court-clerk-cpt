import { useEffect, useRef, useState } from 'react';

// Character-level drill engine for the Typing Master lesson runner.
// Strict mode (default) blocks advance on a wrong key until it is typed correctly —
// the accuracy-first pedagogy. Tracks live WPM (gross, a learning metric — distinct
// from the SSSC mock formula), accuracy, per-key stats, and fires onComplete once.
export function useDrill(target, { strict = true, onComplete } = {}) {
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [, setTick] = useState(0);
  const startedAt = useRef(null);
  const finishedAt = useRef(null);
  const totals = useRef({ total: 0, correct: 0 });
  const keyStats = useRef({});
  const done = index >= target.length && target.length > 0;

  // reset on a new target (fresh attempt / next lesson)
  useEffect(() => {
    setIndex(0); setWrong(false);
    startedAt.current = null; finishedAt.current = null;
    totals.current = { total: 0, correct: 0 };
    keyStats.current = {};
  }, [target]);

  // live timer for WPM / elapsed while typing
  useEffect(() => {
    if (done || startedAt.current == null) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, [done, index]);

  // fire completion once
  useEffect(() => {
    if (!done) return;
    if (finishedAt.current == null) finishedAt.current = Date.now();
    const elapsed = finishedAt.current - (startedAt.current || finishedAt.current);
    const minutes = elapsed / 60000;
    const wpm = minutes > 0 ? (target.length / 5) / minutes : 0;
    const accuracy = totals.current.total > 0 ? (totals.current.correct / totals.current.total) * 100 : 100;
    onComplete?.({ accuracy, wpm, elapsedMs: elapsed, keyStats: { ...keyStats.current } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  useEffect(() => {
    function handler(e) {
      if (done) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const { key } = e;
      if (key === 'Backspace') { e.preventDefault(); if (index > 0) { setIndex((i) => i - 1); setWrong(false); } return; }
      if (key.length !== 1) return; // ignore Enter, arrows, Shift, etc.
      e.preventDefault();
      if (startedAt.current == null) startedAt.current = Date.now();
      const expected = target[index];
      const matched = key === expected;
      const kk = expected === ' ' ? 'space' : expected.toLowerCase();
      const ks = keyStats.current[kk] || { correct: 0, total: 0 };
      ks.total += 1; if (matched) ks.correct += 1;
      keyStats.current[kk] = ks;
      totals.current.total += 1; if (matched) totals.current.correct += 1;
      if (matched) { setWrong(false); setIndex((i) => i + 1); }
      else if (strict) { setWrong(true); }
      else { setWrong(false); setIndex((i) => i + 1); }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, done, strict, target]);

  const chars = target.split('').map((c, i) => {
    let s = 'pending';
    if (i < index) s = 'done';
    else if (i === index) s = wrong ? 'wrong' : 'current';
    return { c, s };
  });

  const elapsedMs = startedAt.current ? (finishedAt.current || Date.now()) - startedAt.current : 0;
  const minutes = elapsedMs / 60000;
  const wpm = minutes > 0 ? (index / 5) / minutes : 0;
  const accuracy = totals.current.total > 0 ? (totals.current.correct / totals.current.total) * 100 : 100;
  const tokensTotal = target.trim() ? target.trim().split(/\s+/).length : 0;
  const tokensDone = target.slice(0, index).trim() ? target.slice(0, index).trim().split(/\s+/).length : 0;
  const nextChar = index < target.length ? target[index] : '';

  return { chars, index, length: target.length, wrong, wpm, accuracy, elapsedMs, tokensDone, tokensTotal, nextChar, done, started: startedAt.current != null };
}

export function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
