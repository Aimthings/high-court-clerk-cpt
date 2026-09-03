import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { tokenize } from './tokenize.js';
import Timer from '../components/Timer.jsx';
import ResultCard from '../components/ResultCard.jsx';
import { PaneSkeleton } from '../components/Skeletons.jsx';
import './typing.css';

const MAX_CHARS = 20000;
const AUTOSAVE_MS = 5000;

// Typing runner — deck artboards 9/10. Full white, no nav/footer/word-counter
// in exam mode. Scoring is server-side; the client shows only a live word count
// (never a score), autosaves every 5s, and resumes on refresh (brief §5).
export default function TypingTest() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const mode = ['practice', 'drill', 'exam'].includes(params.get('mode')) ? params.get('mode') : 'practice';
  const draftKey = `typing:draft:${slug}:${mode}`;

  const [phase, setPhase] = useState('loading'); // loading | preroll | running | submitting | done | error
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(null); // { attemptId, durationSec, passage }
  const [typed, setTyped] = useState('');
  const [remainingMs, setRemainingMs] = useState(0);
  const [result, setResult] = useState(null);
  const [preroll, setPreroll] = useState(0);

  const endAtRef = useRef(0);
  const totalMsRef = useRef(0);
  const typedRef = useRef('');
  typedRef.current = typed;
  const keyTimesRef = useRef([]); // keystroke timestamps for anomaly detection

  // ---- start (or resume) the attempt ----
  useEffect(() => {
    let cancelled = false;
    async function begin() {
      try {
        const saved = readDraft(draftKey);
        if (saved && saved.endAt > Date.now()) {
          setAttempt(saved.attempt);
          setTyped(saved.typed || '');
          endAtRef.current = saved.endAt;
          totalMsRef.current = saved.attempt.durationSec * 1000;
          setRemainingMs(saved.endAt - Date.now());
          setPhase('running');
          return;
        }
        const a = await api.startTyping(slug, mode);
        if (cancelled) return;
        const total = a.durationSec * 1000;
        totalMsRef.current = total;
        setAttempt(a);
        setRemainingMs(total);
        if (mode === 'exam') {
          // 3-2-1 pre-roll before the clock starts (brief §6).
          setPreroll(3);
          setPhase('preroll');
        } else {
          endAtRef.current = Date.now() + total;
          setPhase('running');
          writeDraft(draftKey, { attempt: a, typed: '', endAt: endAtRef.current });
        }
      } catch (e) {
        if (!cancelled) { setError(e.message); setPhase('error'); }
      }
    }
    begin();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, mode]);

  const submit = useCallback(async () => {
    if (!attempt) return;
    setPhase('submitting');
    try {
      const r = await api.submitTyping(attempt.attemptId, typedRef.current, keyTelemetry(keyTimesRef.current));
      clearDraft(draftKey);
      setResult(r);
      setPhase('done');
    } catch (e) {
      setError(e.message);
      setPhase('error');
    }
  }, [attempt, draftKey]);

  // ---- 3-2-1 pre-roll (exam mode) ----
  useEffect(() => {
    if (phase !== 'preroll') return undefined;
    if (preroll <= 0) {
      const total = totalMsRef.current;
      endAtRef.current = Date.now() + total;
      setRemainingMs(total);
      setPhase('running');
      if (attempt) writeDraft(draftKey, { attempt, typed: '', endAt: endAtRef.current });
      return undefined;
    }
    const id = setTimeout(() => setPreroll((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, preroll, attempt, draftKey]);

  // ---- countdown tick ----
  useEffect(() => {
    if (phase !== 'running') return undefined;
    const id = setInterval(() => {
      const left = endAtRef.current - Date.now();
      if (left <= 0) {
        setRemainingMs(0);
        clearInterval(id);
        submit();
      } else {
        setRemainingMs(left);
      }
    }, 250);
    return () => clearInterval(id);
  }, [phase, submit]);

  // ---- autosave every 5s ----
  useEffect(() => {
    if (phase !== 'running' || !attempt) return undefined;
    const id = setInterval(() => {
      writeDraft(draftKey, { attempt, typed: typedRef.current, endAt: endAtRef.current });
    }, AUTOSAVE_MS);
    return () => clearInterval(id);
  }, [phase, attempt, draftKey]);

  if (phase === 'done' && result) return <ResultCard result={result} />;

  if (phase === 'error') {
    return (
      <div className="run-screen run-center">
        <div className="card-420" style={{ textAlign: 'center' }}>
          <h1 className="page-title">Could not start the test</h1>
          <p className="page-sub" style={{ fontSize: 13, marginTop: 10 }}>{error}</p>
          <Link to="/mocks" className="btn btn-primary" style={{ marginTop: 18 }}>Back to the passages</Link>
        </div>
      </div>
    );
  }

  if (phase === 'loading' || !attempt) {
    return (
      <div className="run-screen run-center">
        <div className="run-pane" aria-hidden="true"><PaneSkeleton height={380} /></div>
      </div>
    );
  }

  if (phase === 'preroll') {
    return (
      <div className="run-screen run-center">
        <div className="preroll">
          <div className="preroll-hint">Get the printed passage ready</div>
          <div className="preroll-count">{preroll}</div>
        </div>
      </div>
    );
  }

  const wordsSoFar = tokenize(typed).length;
  const showPassage = mode !== 'exam';

  return (
    <div className="run-screen">
      <div className="run-card">
        <Timer remainingMs={remainingMs} totalMs={totalMsRef.current} />

        <div className="run-pane">
          {showPassage ? (
            <div className="passage-sheet" aria-label="Passage to type">
              <div className="passage-sheet-head">{attempt.passage.title}</div>
              <div className="passage-sheet-body">{attempt.passage.body}</div>
            </div>
          ) : (
            <a className="btn btn-ghost printed-btn" href={`/api/passages/${slug}/pdf`} target="_blank" rel="noreferrer">
              ▤ Printed passage (A4)
            </a>
          )}

          <textarea
            className="type-input mono"
            value={typed}
            onChange={(e) => setTyped(e.target.value.slice(0, MAX_CHARS))}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            onKeyDown={() => keyTimesRef.current.push(Date.now())}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            placeholder={showPassage ? 'Type the passage above…' : 'Type from the printed sheet…'}
            aria-label="Typing area"
            autoFocus
          />

          <div className="run-footer">
            {showPassage ? (
              <span className="muted num">{wordsSoFar} words typed</span>
            ) : (
              <span className="muted">Passage not shown on screen — the exam hands it out on paper</span>
            )}
            <button className="btn btn-primary run-submit" onClick={submit} disabled={phase === 'submitting'}>
              {phase === 'submitting' ? 'Scoring…' : 'Submit for scoring'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// keystroke telemetry for the server's anomaly check (median inter-key interval)
function keyTelemetry(times) {
  const keyEvents = times.length;
  if (keyEvents < 2) return { keyEvents };
  const gaps = [];
  for (let i = 1; i < times.length; i += 1) gaps.push(times[i] - times[i - 1]);
  gaps.sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  const medianIntervalMs = gaps.length % 2 ? gaps[mid] : (gaps[mid - 1] + gaps[mid]) / 2;
  return { keyEvents, medianIntervalMs };
}

// ---- localStorage draft helpers (resume on refresh) ----
function readDraft(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
function writeDraft(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore quota */ }
}
function clearDraft(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}
