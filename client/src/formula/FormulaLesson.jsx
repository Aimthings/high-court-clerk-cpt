import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { formulaLocked, recordFormulaPractice } from '../lib/access.js';
import { SoftBlock } from '../components/Upsell.jsx';
import MiniSheet from './MiniSheet.jsx';
import '../pages/reference.css';
import './formula.css';

// A single formula lesson: tutorial + a graded practice on a live mini-sheet.
export default function FormulaLesson() {
  const { slug } = useParams();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState('');
  const [formula, setFormula] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);
  // Locked only once, at open, so passing the cap mid-session doesn't yank the
  // card out from under the guest. No-op while the free launch is on.
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setLesson(null); setFormula(''); setResult(null); setShowHint(false); setError('');
    setLocked(formulaLocked(slug));
    api.getFormula(slug).then(setLesson).catch((e) => setError(e.message));
  }, [slug]);

  async function check(e) {
    e.preventDefault();
    if (!formula.trim()) return;
    setBusy(true); setResult(null);
    try {
      setResult(await api.submitFormula(slug, formula));
      recordFormulaPractice(slug);
    }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  if (error) return <div className="page centre-wrap"><div className="card-420" style={{ textAlign: 'center' }}><p className="secondary">{error}</p><Link to="/practice/formulas" className="btn btn-primary" style={{ marginTop: 16 }}>Back to the library</Link></div></div>;
  if (!lesson) return <div className="page"><div className="skeleton-pane" style={{ height: 360, borderRadius: 16 }} /></div>;

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

          {/* practice — softly blocked once the free formula allowance is spent */}
          {locked ? (
            <SoftBlock product="excel">
              <div className="card">
                <div className="card-block-head">
                  <div className="card-h">Practice · {lesson.name}</div>
                  <div className="card-meta">{lesson.prompt}</div>
                </div>
                <div className="card-pad" style={{ paddingTop: 0 }}>
                  <MiniSheet data={lesson.data} taskCell={lesson.taskCell} formula="" />
                </div>
              </div>
            </SoftBlock>
          ) : (
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
          )}
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
