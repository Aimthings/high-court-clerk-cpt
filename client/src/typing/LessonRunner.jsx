import { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import Keyboard from './Keyboard.jsx';
import { TypingLine, Stars, Hand, handForKey, SignInGate } from './tmUi.jsx';
import { useDrill, fmtTime } from './useDrill.js';
import { fingerOf, fingerNameOf, FINGER } from './fingerMap.js';
import {
  getModule, buildTarget, gradeLesson, MODULES, ACCURACY_TARGETS, DEFAULT_TARGET,
} from './courseContent.js';
import { recordAttempt } from './progress.js';
import './typingmaster.css';

const TARGET_KEY = 'tm_target_accuracy';
function loadTarget() {
  try { const v = Number(localStorage.getItem(TARGET_KEY)); return ACCURACY_TARGETS.includes(v) ? v : DEFAULT_TARGET; } catch { return DEFAULT_TARGET; }
}

function Stat({ value, label, color, mono }) {
  return (
    <div style={{ flex: 1, padding: '14px 0', textAlign: 'center', borderRight: '1px solid #E6EAF2' }}>
      <div className="num" style={{ font: `800 22px/1 ${mono ? "'JetBrains Mono',monospace" : "'Plus Jakarta Sans',sans-serif"}`, color: color || '#0F1E33' }}>{value}</div>
      <div className="tm-stat-lbl">{label}</div>
    </div>
  );
}

function Mark() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <img src="/favicon.svg" alt="" width="24" height="24" style={{ borderRadius: 7, display: 'block' }} />
      <span style={{ font: "800 15px/1 'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.02em', color: '#0D2846' }}>Clerk CPT</span>
    </span>
  );
}

export default function LessonRunner() {
  const { moduleSlug, lessonSlug } = useParams();
  const navigate = useNavigate();
  const { user, caps, launchFree, loading: authLoading } = useAuth();
  const module = getModule(moduleSlug);
  const lesson = module?.lessons.find((l) => l.slug === lessonSlug);
  const paywalled = module ? (module.n >= 2 && !(launchFree || (caps || []).includes('typingCourse'))) : false;

  const [target, setTarget] = useState(loadTarget);
  const [seed, setSeed] = useState(0);
  const [result, setResult] = useState(null);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const on = () => setNarrow(mq.matches);
    on(); mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const drillTarget = useMemo(() => (lesson ? buildTarget(lesson) : ''), [lesson, seed]);

  const onComplete = useCallback((r) => {
    if (!module || !lesson) return;
    const { cleared, stars } = gradeLesson(r.accuracy, r.wpm, target);
    const entry = recordAttempt(lesson.slug, { accuracy: r.accuracy, wpm: r.wpm, cleared, stars, keyStats: r.keyStats });
    if (user) api.saveTypingProgress([{ slug: lesson.slug, ...entry }]).catch(() => {});
    setResult({ ...r, cleared, stars, target });
  }, [module, lesson, user, target]);

  const drill = useDrill(drillTarget, { onComplete });

  // Guests may taste the Home row: after 3 words (3 spacebar presses) send them
  // to sign in. Other modules need an account up front.
  const isGuest = !authLoading && !user;
  const guestTrial = isGuest && module?.slug === 'home-row';
  const GUEST_WORD_LIMIT = 3;
  const signInHere = `/sign-in?next=${encodeURIComponent(`/learn/typing/run/${moduleSlug}/${lessonSlug}`)}`;
  useEffect(() => {
    if (guestTrial && drill.spacesTyped >= GUEST_WORD_LIMIT) navigate(signInHere);
  }, [guestTrial, drill.spacesTyped, navigate, signInHere]);

  function changeTarget(t) {
    setTarget(t);
    try { localStorage.setItem(TARGET_KEY, String(t)); } catch { /* non-fatal */ }
  }

  if (!module || !lesson) {
    return <div className="tm page"><p className="tm-sub">That lesson doesn’t exist. <Link to="/learn/typing">Back to the course</Link>.</p></div>;
  }

  if (authLoading) {
    return <div className="tm tm-runner" style={{ alignItems: 'center', justifyContent: 'center' }}><span style={{ font: "500 14px/1 'Plus Jakarta Sans',sans-serif", color: '#8494A8' }}>Loading…</span></div>;
  }
  // Guests can only taste the Home row; everything else needs an account.
  if (isGuest && module.slug !== 'home-row') {
    return (
      <div className="tm tm-runner" style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <SignInGate next={`/learn/typing/run/${moduleSlug}/${lessonSlug}`} />
      </div>
    );
  }

  if (paywalled) {
    return (
      <div className="tm tm-runner" style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="tm-card" style={{ maxWidth: 460, padding: '30px 32px', textAlign: 'center' }}>
          <div style={{ font: '800 34px/1', color: '#0D2846' }}>🔒</div>
          <div className="tm-h2" style={{ marginTop: 14 }}>This is part of the paid course</div>
          <p style={{ marginTop: 10, font: "500 15px/1.55 'Plus Jakarta Sans',sans-serif", color: '#4A5A70' }}>
            The Home row module is free. Unlock all modules — top row to exam speed — for ₹69.
          </p>
          <Link to="/pass" className="tm-btn tm-btn-navy" style={{ marginTop: 20, width: '100%' }}>Unlock the full course</Link>
          <Link to="/learn/typing" style={{ display: 'inline-block', marginTop: 14, font: "600 13px/1 'Plus Jakarta Sans',sans-serif" }}>Back to the course</Link>
        </div>
      </div>
    );
  }

  const restart = () => { setResult(null); setSeed((s) => s + 1); };

  const lessonIdx = module.lessons.findIndex((l) => l.slug === lesson.slug);
  const moduleIdx = MODULES.findIndex((m) => m.slug === module.slug);
  let next = null;
  if (lessonIdx < module.lessons.length - 1) next = { m: module, l: module.lessons[lessonIdx + 1] };
  else if (moduleIdx < MODULES.length - 1) { const nm = MODULES[moduleIdx + 1]; next = { m: nm, l: nm.lessons[0] }; }
  const goNext = () => { if (!next) return; setResult(null); setSeed(0); navigate(`/learn/typing/run/${next.m.slug}/${next.l.slug}`); };

  const nextChar = drill.nextChar;
  const hand = nextChar ? handForKey(nextChar, fingerOf, FINGER) : { active: -1, color: '#8A93A0', finger: 'th' };
  const fingerLabel = nextChar ? fingerNameOf(nextChar) : 'Done';

  if (narrow) {
    return (
      <div className="tm tm-runner" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}><Mark /><Link to="/learn/typing" style={{ marginLeft: 'auto', font: "600 13px/1 'Plus Jakarta Sans',sans-serif" }}>Exit</Link></div>
        <div className="tm-card" style={{ padding: 20, background: '#FFF6E0', borderColor: '#F0E0B0' }}>
          <div style={{ font: "700 15px/1.3 'Plus Jakarta Sans',sans-serif", color: '#8A5A00' }}>⌨ Use a physical keyboard</div>
          <div style={{ marginTop: 8, font: "500 14px/1.5 'Plus Jakarta Sans',sans-serif", color: '#7A5A2A' }}>
            The exam is a physical typing test, so the lessons need a laptop or desktop keyboard. Open this on a computer to practise.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tm tm-runner">
      <div style={{ minHeight: 56, background: '#fff', borderBottom: '1px solid #E6EAF2', display: 'flex', alignItems: 'center', padding: '8px 24px', gap: 16, flexWrap: 'wrap' }}>
        <Mark />
        <span style={{ width: 1, height: 22, background: '#E6EAF2' }} />
        <span style={{ font: "800 15px/1 'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.02em', color: '#0D2846' }}>{module.title} · {lesson.title.replace(/^Lesson \d+ · /, '')}</span>
        <span style={{ font: "500 12px/1 'Plus Jakarta Sans',sans-serif", color: '#8494A8' }}>{lesson.meta}</span>
        {guestTrial && <span className="tm-chip tm-chip-blue">Guest preview · {GUEST_WORD_LIMIT} words free</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }} title="Clear the lesson when you reach this accuracy">
          <span style={{ font: "600 12px/1 'Plus Jakarta Sans',sans-serif", color: '#8494A8' }}>Advance at</span>
          <div style={{ display: 'inline-flex', border: '1px solid #E6EAF2', borderRadius: 9, overflow: 'hidden' }}>
            {ACCURACY_TARGETS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => changeTarget(t)}
                style={{ border: 'none', cursor: 'pointer', padding: '7px 10px', font: "700 12px/1 'Plus Jakarta Sans',sans-serif", background: t === target ? '#2D6BE4' : '#fff', color: t === target ? '#fff' : '#4A5A70' }}
              >
                {t}%
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={restart} style={{ font: "600 12px/1 'Plus Jakarta Sans',sans-serif", color: '#4A5A70', background: 'none', border: 'none', cursor: 'pointer' }}>Restart</button>
        <button type="button" onClick={() => navigate(`/learn/typing/m/${module.slug}`)} style={{ font: "600 12px/1 'Plus Jakarta Sans',sans-serif", color: '#8494A8', background: 'none', border: 'none', cursor: 'pointer' }}>Exit</button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: 860, maxWidth: '100%', background: '#fff', border: '1px solid #E6EAF2', borderRadius: 16, boxShadow: '0 6px 24px rgba(15,30,51,.06)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '14px 24px', height: 74, boxSizing: 'border-box', background: '#F5F7FB', borderBottom: '1px solid #E6EAF2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
              <span className="tm-stat-lbl" style={{ marginTop: 0 }}>Next key</span>
              <span style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #2D6BE4', background: '#2D6BE4', boxShadow: '0 0 0 4px rgba(45,107,228,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 15px/1 'JetBrains Mono',monospace", color: '#fff', textTransform: 'none' }}>
                {nextChar === ' ' ? '␣' : (nextChar || '✓')}
              </span>
            </div>
            <span style={{ width: 1, alignSelf: 'stretch', background: '#E6EAF2', flex: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 168, flex: 'none' }}>
              <Hand active={hand.active} color={hand.color} />
              <div>
                <div className="tm-stat-lbl" style={{ marginTop: 0 }}>Finger</div>
                <div style={{ marginTop: 5, font: "700 13px/1 'Plus Jakarta Sans',sans-serif", color: hand.color }}>{fingerLabel}</div>
              </div>
            </div>
            <span style={{ width: 1, alignSelf: 'stretch', background: '#E6EAF2', flex: 'none' }} />
            <div style={{ font: `500 13px/1.4 'Plus Jakarta Sans',sans-serif`, color: drill.wrong ? '#D93B47' : '#4A5A70', flex: 1, overflow: 'hidden' }}>
              {drill.wrong ? 'That key was wrong — keep going, or backspace to fix it.' : lesson.tip}
            </div>
          </div>

          <div style={{ padding: '34px 30px 20px', textAlign: 'center' }}>
            <TypingLine chars={drill.chars} />
            <div style={{ height: 18, marginTop: 16 }}>
              {!drill.started && <span style={{ font: "500 13px/1 'Plus Jakarta Sans',sans-serif", color: '#8494A8' }}>Start typing — the clock begins on your first key.</span>}
            </div>
          </div>

          <div style={{ display: 'flex', borderTop: '1px solid #E6EAF2', borderBottom: '1px solid #E6EAF2' }}>
            <Stat value={Math.round(drill.wpm)} label="W.P.M." />
            <Stat value={`${Math.round(drill.accuracy)}%`} label="Accuracy" color={drill.accuracy >= target ? '#0E9F6E' : drill.accuracy >= 80 ? '#B47500' : '#D93B47'} />
            <Stat value={fmtTime(drill.elapsedMs)} label="Time" mono />
            <div style={{ flex: 1, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="tm-stat-lbl" style={{ marginTop: 0 }}>Progress</span>
                <span className="num" style={{ font: '700 12px/1', color: '#0F1E33' }}>{drill.tokensDone} / {drill.tokensTotal}</span>
              </div>
              <div style={{ marginTop: 10, height: 8, borderRadius: 5, background: '#EEF1F6', overflow: 'hidden' }}>
                <div style={{ width: `${drill.length ? (drill.index / drill.length) * 100 : 0}%`, height: '100%', background: '#2D6BE4', borderRadius: 5 }} />
              </div>
            </div>
          </div>

          <div style={{ padding: '26px 0 30px', display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
            <Keyboard mode="tint" next={nextChar} keySize={42} />
          </div>
        </div>
      </div>

      {result && <CompleteOverlay module={module} lesson={lesson} result={result} onRetry={restart} next={next} onNext={goNext} />}
    </div>
  );
}

function CompleteOverlay({ module, lesson, result, onRetry, next, onNext }) {
  const trouble = useMemo(() => Object.entries(result.keyStats || {})
    .map(([k, v]) => ({ k, acc: v.total ? Math.round((v.correct / v.total) * 100) : 100, total: v.total }))
    .filter((x) => x.total >= 2 && x.acc < 100)
    .sort((a, b) => a.acc - b.acc).slice(0, 3), [result]);
  const courseDone = next === null;
  const accColor = result.accuracy >= result.target ? '#0E9F6E' : result.accuracy >= 80 ? '#B47500' : '#D93B47';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,30,51,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50 }}>
      <div style={{ width: 520, maxWidth: '100%', background: '#fff', border: '1px solid #E6EAF2', borderRadius: 16, boxShadow: '0 18px 48px rgba(15,30,51,.28)', overflow: 'hidden' }}>
        <div style={{ background: result.cleared ? '#E4F7EF' : '#FFF6E0', padding: '22px 30px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${result.cleared ? '#CFEBDD' : '#F0E0B0'}` }}>
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: result.cleared ? '#0E9F6E' : '#B47500', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 15px/1', color: '#fff' }}>{result.cleared ? '✓' : '↻'}</span>
          <div>
            <div style={{ font: "800 20px/1.1 'Plus Jakarta Sans',sans-serif", color: result.cleared ? '#0E9F6E' : '#8A5A00' }}>{result.cleared ? 'Lesson cleared' : 'Almost there'}</div>
            <div style={{ marginTop: 3, font: "500 13px/1 'Plus Jakarta Sans',sans-serif", color: result.cleared ? '#4A7A67' : '#7A5A2A' }}>{module.title} · {lesson.title.replace(/^Lesson \d+ · /, '')}{result.cleared ? '' : ` · you set ${result.target}% to advance`}</div>
          </div>
          {result.cleared && <div style={{ marginLeft: 'auto' }}><Stars n={result.stars} size={22} /></div>}
        </div>
        <div style={{ padding: '26px 30px' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            {[[`${Math.round(result.accuracy)}%`, 'Accuracy', accColor],
              [(result.wpm).toFixed(1), 'W.P.M.', '#0F1E33'],
              [fmtTime(result.elapsedMs), 'Time', '#0F1E33']].map(([v, l, c]) => (
                <div key={l} style={{ flex: 1, background: '#F5F7FB', border: '1px solid #E6EAF2', borderRadius: 12, padding: '16px 18px' }}>
                  <div className="num" style={{ font: `800 30px/1 ${l === 'W.P.M.' || l === 'Time' ? "'JetBrains Mono',monospace" : "'Plus Jakarta Sans',sans-serif"}`, color: c }}>{v}</div>
                  <div className="tm-stat-lbl">{l}</div>
                </div>
            ))}
          </div>
          {trouble.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div className="tm-stat-lbl">Trouble keys</div>
              <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {trouble.map((t) => {
                  const weak = t.acc < 80;
                  return (
                    <span key={t.k} style={{ display: 'flex', alignItems: 'center', gap: 7, background: weak ? '#FDE9EB' : '#FFF6E0', borderRadius: 8, padding: '7px 11px' }}>
                      <span style={{ font: "700 13px/1 'JetBrains Mono',monospace", color: weak ? '#D93B47' : '#B47500', textTransform: 'uppercase' }}>{t.k === 'space' ? '␣' : t.k}</span>
                      <span className="num" style={{ font: "600 11px/1 'Plus Jakarta Sans',sans-serif", color: weak ? '#B0333D' : '#8A5A00' }}>{t.acc}%</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {courseDone && result.cleared ? (
            <div style={{ marginTop: 24 }}>
              <div style={{ font: "700 15px/1.4 'Plus Jakarta Sans',sans-serif", color: '#0D2846' }}>That’s the whole course. You’re ready for the graded mock.</div>
              <Link to="/mocks" className="tm-btn tm-btn-blue" style={{ marginTop: 14, width: '100%' }}>Take the graded mock</Link>
            </div>
          ) : (
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button type="button" className="tm-btn tm-btn-ghost" style={{ flex: 1 }} onClick={onRetry}>Retry lesson</button>
              {result.cleared
                ? <button type="button" className="tm-btn tm-btn-navy" style={{ flex: 1 }} onClick={onNext} disabled={!next}>Next lesson</button>
                : <button type="button" className="tm-btn tm-btn-navy" style={{ flex: 1 }} onClick={onRetry}>Try again</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
