import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { LockGlyph } from './LockGlyph.jsx';
import '../pages/reference.css';
import './formula.css';

// Formula Library — deck artboards 29 (bought) and 29·L (locked preview). A calm
// document-like index of every Excel formula, grouped into learn-friendly tracks.
// Non-buyers see free formulas open, the rest locked with a lock chip, and the
// three lookup formulas hidden outright.
const TRACK_ORDER = ['Math & stats', 'Logical', 'Conditional totals', 'Text', 'Lookup & reference', 'Date', 'Advanced'];

export default function FormulaLibrary() {
  const [items, setItems] = useState(null);
  const [unlocked, setUnlocked] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listFormulas()
      .then((d) => { setItems(d.formulas); setUnlocked(d.unlocked !== false); })
      .catch((e) => setError(e.message));
  }, []);

  const byTrack = {};
  (items || []).forEach((f) => { (byTrack[f.track] ||= []).push(f); });
  const tracks = TRACK_ORDER.filter((t) => byTrack[t]);

  return (
    <div className="page">
      <div className="ref-header">
        <div className="fl-head-row">
          <div>
            <h1 className="page-title">Excel formula practice</h1>
            <p className="page-sub" style={{ marginBottom: 0 }}>
              Every formula the C.P.T. can lean on — a short lesson and a graded, hands-on practice for each.
              Excel 2007 compatible.
            </p>
            {!unlocked && (
              <div className="fl-preview-note">
                You're previewing the free formulas. Unlock all 35 for ₹119.
                <span className="fl-lock-legend"><LockGlyph /><span>Locked</span></span>
              </div>
            )}
          </div>
          {!unlocked && (
            <Link to="/pass?product=excel" className="btn btn-primary fl-unlock-cta">Unlock Excel · ₹119</Link>
          )}
        </div>
      </div>

      {error && <div className="card card-pad" style={{ textAlign: 'center' }}><p className="secondary">{error}</p></div>}
      {!items && !error && <div className="mock-grid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card mock-skeleton" style={{ height: 92 }} />)}</div>}

      {items && tracks.map((track) => (
        <section key={track} className="fl-track">
          <div className="fl-track-head">
            <h2 className="section-label">{track}</h2>
            <span className="muted num">{byTrack[track].length} formula{byTrack[track].length === 1 ? '' : 's'}</span>
          </div>
          <div className="fl-grid">
            {byTrack[track].map((f) => (
              <Link
                key={f.slug}
                to={`/practice/formulas/${f.slug}`}
                className={`card fl-card${f.free ? '' : ' fl-card-locked'}`}
              >
                <span className="fl-card-name mono">{f.name}</span>
                {f.free
                  ? <span className={`pill pill-sans ${diffTone(f.difficulty)}`}>{diffLabel(f.difficulty)}</span>
                  : <span className="fl-lock-chip" aria-label="Locked"><LockGlyph /></span>}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const diffLabel = (d) => (d === 1 ? 'Basic' : d === 2 ? 'Core' : 'Advanced');
const diffTone = (d) => (d === 1 ? 'pill-mint' : d === 2 ? 'pill-blue' : 'pill-amber');
