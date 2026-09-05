import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import RankResults from '../rank/RankResults.jsx';
import './rank-predictor.css';

const CHIPS = [
  'Exact score with negative marking',
  'Section-wise analysis',
  'Predicted rank + expected cutoff',
];
const CATS = ['General', 'EWS', 'SC', 'BC-A', 'BC-B', 'Ex-serviceman', 'PwD'];

export default function RankPredictor() {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  useEffect(() => { api.rankConfig().then(setConfig).catch(() => setConfig({ live: false })); }, []);

  const live = config?.live;
  const cats = config?.categories || CATS;

  // flow state (used only when live)
  const [phase, setPhase] = useState('input'); // input | parsing | confirm | submitting | results
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('');
  const [consent, setConsent] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const reset = () => { setPhase('input'); setFile(null); setPreview(null); setResult(null); setError(''); };

  async function onPredict() {
    if (!file || !category || !consent) return;
    setError(''); setPhase('parsing');
    try {
      const pv = await api.rankPreview(file);
      setPreview(pv); setPhase('confirm');
    } catch (e) { setError(e.message); setPhase('input'); }
  }
  async function onConfirm() {
    setError(''); setPhase('submitting');
    try {
      const r = await api.rankSubmit(preview.token, category);
      setResult(r); setPhase('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { setError(e.message); setPhase('confirm'); }
  }

  if (phase === 'results' && result) {
    return <div className="page"><RankResults data={result} onReset={reset} /></div>;
  }

  return (
    <div className="page rp">
      <div className="rp-col">
        <header className="rp-head">
          <span className="rp-eyebrow">P&amp;H HIGH COURT · S.S.S.C. CLERK</span>
          <h1 className="rp-title">Clerk Rank Predictor · <span className="num">2026</span></h1>
          <p className="rp-sub">
            Upload your official Response-Sheet-cum-Answer-Key PDF — the one with the green ✓ and red ✗
            marks — and get your score, a detailed analysis and a predicted rank.
          </p>
          <p className="rp-sub2">
            This predicts a candidate's rank in the P&amp;H High Court / S.S.S.C. Clerk exam from the
            Commission's official response sheet.
          </p>
        </header>

        {error && <div className="rp-error">{error}</div>}

        {/* PARSING / SUBMITTING */}
        {(phase === 'parsing' || phase === 'submitting') && (
          <section className="rp-card rp-loading">
            <span className="rp-spinner" aria-hidden="true" />
            <div>
              <div className="rp-load-title">{phase === 'parsing' ? 'Reading your response sheet' : 'Scoring & ranking'}</div>
              <div className="rp-load-sub mono">{phase === 'parsing' ? 'matching your answers to the key…' : 'placing you against the pool…'}</div>
            </div>
          </section>
        )}

        {/* CONFIRM (design screen 1b) */}
        {phase === 'confirm' && preview && (
          <section className="rp-card">
            <div style={{ textAlign: 'center' }}>
              <span className="rp-eyebrow" style={{ background: '#E6F6EF', color: '#0E9F6E' }}>✓ PDF READ</span>
              <h2 className="rp-confirm-h">Read from your sheet</h2>
              <p className="rp-hint" style={{ textAlign: 'center' }}>Check these match your sheet before we score it.</p>
            </div>
            <div className="rp-rows">
              <Row k="Questions found" v={`${preview.totalQ}`} />
              <Row k="Answered" v={`${preview.answered}`} />
              <Row k="Left blank" v={`${preview.left}`} />
              {preview.meta?.examDate && <Row k="Exam date" v={preview.meta.examDate} />}
              {preview.meta?.shift && <Row k="Shift" v={preview.meta.shift} />}
              <Row k="Your category" v={category} tag="as you selected" />
            </div>
            <button className="rp-cta-live" onClick={onConfirm}>Confirm &amp; see my rank</button>
            <div className="rp-notify"><button className="rp-linkbtn" onClick={reset}>Something's wrong — upload again</button></div>
          </section>
        )}

        {/* INPUT */}
        {phase === 'input' && (
          <section className="rp-card" aria-label="Rank predictor form">
            <div className="rp-sechead">
              <span className="rp-kicker">Your response sheet</span>
              <span className="rp-kicker-note">Response-Sheet-cum-Answer-Key</span>
            </div>
            <p className="rp-hint">The Commission's sheet already shows the correct answer next to each of your responses — that one file is everything we need.</p>

            <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }}
              onChange={(e) => { setFile(e.target.files[0] || null); setError(''); }} disabled={!live} />
            <button
              type="button"
              className={`rp-dropzone${file ? ' rp-dropzone-set' : ''}`}
              onClick={() => live && fileRef.current?.click()}
              aria-disabled={!live}
            >
              <span className="rp-drop-ico">{file ? '📄' : '⭱'}</span>
              <div className="rp-drop-title">{file ? file.name : 'Upload the response-sheet PDF'}</div>
              <div className="rp-drop-sub">{file ? 'Tap to choose a different file' : <>Drag &amp; drop it here, or <span className="rp-strong">browse your files</span></>}</div>
            </button>

            <div className="rp-cathead">
              <span className="rp-kicker">Your category</span>
              <span className="rp-req" title="Required">*</span>
              <span className="rp-cat-note">Required · you choose it — it isn't read from the PDF</span>
            </div>
            {live ? (
              <select className="rp-selectbox" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select your category</option>
                {cats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <div className="rp-field rp-select" aria-disabled="true">
                <span className="rp-field-ph">Select your category</span>
                <span className="rp-cat-opts">{CATS.join(' · ')}</span>
                <span className="rp-caret">▾</span>
              </div>
            )}

            <label className="rp-consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={!live} className="rp-checkbox" />
              <span>I understand this is a prediction, not the official result.</span>
            </label>

            <div className="rp-trust">
              <span className="rp-lock" aria-hidden="true">🔒</span>
              <span>Your PDF is read securely to compute your score; we never show your name or roll number to anyone.</span>
            </div>

            {live ? (
              <>
                <button className="rp-cta-live" disabled={!file || !category || !consent} onClick={onPredict}>Predict my rank</button>
                {config?.admin && !config?.publicLive && (
                  <p className="rp-admin-note">Admin preview — the predictor is in “coming soon” for the public until you set <span className="mono">RANK_PREDICTOR_LIVE=true</span>.</p>
                )}
              </>
            ) : (
              <>
                <div className="rp-cta-wrap">
                  <span className="rp-ribbon">Coming soon</span>
                  <div className="rp-cta" aria-disabled="true">Predict my rank</div>
                </div>
                <p className="rp-opens">Opens when the Commission releases the 2026 answer key — we'll switch it on the same day.</p>
                <div className="rp-notify">
                  <Link to={user ? '/mocks' : '/sign-in?next=/rank-predictor'} className="rp-notify-link">
                    {user ? "You're signed in — we'll email you when it opens" : 'Notify me when it opens'}
                  </Link>
                </div>
              </>
            )}
          </section>
        )}

        {phase === 'input' && (
          <>
            <div className="rp-chips">
              {CHIPS.map((label) => (
                <div className="rp-chip" key={label}><span className="rp-chip-glyph">✓</span><span className="rp-chip-label">{label}</span></div>
              ))}
            </div>
            <p className="rp-disclaimer">Predicted rank only — not the official result. Not affiliated with the High Court or the Commission.</p>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, tag }) {
  return (
    <div className="rp-row">
      <span className="rp-row-k">{k}</span>
      <span className="rp-row-v">{tag && <em className="rp-row-tag">{tag}</em>}<span className="mono">{v}</span></span>
    </div>
  );
}
