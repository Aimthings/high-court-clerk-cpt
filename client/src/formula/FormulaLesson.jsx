import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Upsell } from '../components/Upsell.jsx';
import { GUEST_FREE_FORMULA } from './FormulaLibrary.jsx';
import { FormulaLessonSkeleton } from '../components/Skeletons.jsx';
import MiniSheet from './MiniSheet.jsx';
import '../pages/reference.css';
import './formula.css';

// A single formula lesson: tutorial + a graded practice on a live mini-sheet.
export default function FormulaLesson() {
  const { slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const isGuest = !authLoading && !user;
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState('');
  const [formula, setFormula] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setLesson(null); setFormula(''); setResult(null); setShowHint(false); setError('');
    api.getFormula(slug).then(setLesson).catch((e) => setError(e.message));
  }, [slug]);

  async function check(e) {
    e.preventDefault();
    if (!formula.trim()) return;
    setBusy(true); setResult(null);
    try { setResult(await api.submitFormula(slug, formula)); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  // Guests may only practise SUM; every other formula needs an account. Checked
  // before anything API-dependent so a guest never depends on the lesson fetch.
  if (isGuest && slug !== GUEST_FREE_FORMULA) {
    return (
      <div className="page centre-wrap">
        <div className="card-420">
          <div className="card card-pad" style={{ textAlign: 'center' }}>
            <div style={{ font: '800 34px/1', color: 'var(--navy)' }}>🔒</div>
            <div className="card-h" style={{ marginTop: 12, fontSize: 20 }}>Sign in to practise this formula</div>
            <p className="secondary" style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.55 }}>
              <b className="mono">SUM</b> is free to try. Create a free account to practise all 37 formulas — it’s
              free during the launch, and early members keep founding perks.
            </p>
            <Link to={`/sign-in?next=${encodeURIComponent(`/practice/formulas/${slug}`)}`} className="btn btn-primary btn-block" style={{ marginTop: 16 }}>Create free account · sign in</Link>
            <Link to="/practice/formulas" className="link-btn" style={{ display: 'inline-block', marginTop: 14 }}>Back to the library</Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="page centre-wrap"><div className="card-420" style={{ textAlign: 'center' }}><p className="secondary">{error}</p><Link to="/practice/formulas" className="btn btn-primary" style={{ marginTop: 16 }}>Back to the library</Link></div></div>;
  if (authLoading || !lesson) return <FormulaLessonSkeleton />;

  // Locked formula (non-buyer, launch ended): show the upsell in place of the
  // lesson (deck 29·L → 32). No tutorial or answer key is sent for these.
  if (lesson.locked) {
    return (
      <div className="page">
        <div className="ref-header">
          <Link to="/practice/formulas" className="link-btn" style={{ fontSize: 12.5 }}>← Formula library</Link>
          <h1 className="page-title" style={{ marginTop: 8 }}><span className="mono">{lesson.name}</span></h1>
          <p className="page-sub">{lesson.track}</p>
        </div>
        <div className="card-420" style={{ margin: '0 auto' }}>
          <Upsell product="excel" title={`${lesson.name} is part of Excel practice`} />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="ref-header">
        <Link to="/practice/formulas" className="link-btn" style={{ fontSize: 12.5 }}>← Formula library</Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>
          <span className="mono">{lesson.name}</span>
        </h1>
        <p className="page-sub">{lesson.track}</p>
      </div>

      <div className="split-ref">
        <div className="ref-main stack">
          {/* tutorial */}
          <div className="card card-pad">
            <div className="card-simple-head" style={{ padding: 0, marginBottom: 8 }}>What it does</div>
            <p className="secondary" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{lesson.tutorial.what}</p>
            <div className="fl-syntax">
              <span className="eyebrow">Syntax</span>
              <code className="mono">{lesson.tutorial.syntax}</code>
            </div>
            <div className="fl-syntax">
              <span className="eyebrow">Example</span>
              <code className="mono">{lesson.tutorial.example}</code>
            </div>
          </div>

          {/* practice */}
          <div className="card">
            <div className="card-block-head">
              <div className="card-h">Practice</div>
              <div className="card-meta">{lesson.prompt}</div>
            </div>
            <div className="card-pad" style={{ paddingTop: 0 }}>
              <MiniSheet data={lesson.data} taskCell={lesson.taskCell} formula={formula} />
              <form onSubmit={check} className="fl-bar">
                <span className="wb-namebox mono" style={{ minWidth: 42 }}>{lesson.taskCell}</span>
                <span className="wb-fx">fx</span>
                <input
                  className="fl-input mono"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  placeholder={`Type a formula for ${lesson.taskCell}, e.g. =…`}
                  aria-label={`Formula for ${lesson.taskCell}`}
                  spellCheck={false} autoCapitalize="off" autoCorrect="off"
                />
                <button className="btn btn-primary" disabled={busy || !formula.trim()}>{busy ? 'Checking…' : 'Check'}</button>
              </form>

              {result && (
                <div className={`fl-result ${result.correct ? 'fl-ok' : 'fl-no'}`}>
                  <div className="fl-result-head">
                    {result.correct ? '✓ Correct' : '✕ Not yet'} <span className="fl-result-msg">{result.message}</span>
                  </div>
                  {(!result.correct || result.solution) && (
                    <div className="fl-solution">
                      <span className="eyebrow">Model answer</span>
                      <code className="mono">{result.solution}</code>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="ref-rail stack">
          <div className="card card-pad">
            <div className="card-simple-head" style={{ padding: 0 }}>Hint</div>
            {lesson.hint
              ? (showHint
                ? <p className="secondary" style={{ fontSize: 13, marginTop: 8 }}>{lesson.hint}</p>
                : <button className="link-btn" style={{ marginTop: 8 }} onClick={() => setShowHint(true)}>Show a hint</button>)
              : <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>Try it from the syntax above.</p>}
          </div>
          <div className="card card-pad">
            <p className="policy-body" style={{ marginTop: 0 }}>
              A typed number won't pass — you must use the <b className="mono">{lesson.name.replace(/\s.*/, '')}</b> function,
              exactly as the exam marks it.
            </p>
          </div>
          <Link to="/practice/formulas" className="btn btn-ghost btn-block">All formulas</Link>
        </aside>
      </div>
    </div>
  );
}
