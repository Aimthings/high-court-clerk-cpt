import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { LockGlyph } from './LockGlyph.jsx';
import { CardGridSkeleton } from '../components/Skeletons.jsx';
import '../pages/reference.css';
import './formula.css';

// The one formula a guest may open; everything else needs an account.
export const GUEST_FREE_FORMULA = 'sum';

// Formula Library — deck artboards 29 (bought) and 29·L (locked preview). A calm
// document-like index of every Excel formula, grouped into learn-friendly tracks.
// Non-buyers see free formulas open, the rest locked with a lock chip, and the
// three lookup formulas hidden outright.
const TRACK_ORDER = ['Math & stats', 'Logical', 'Conditional totals', 'Text', 'Lookup & reference', 'Date', 'Advanced'];

export default function FormulaLibrary() {
  const { user, loading } = useAuth();
  const isGuest = !loading && !user;
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
            {isGuest ? (
              <div className="fl-preview-note">
                SUM is free to try. Create a free account to unlock all 37 formulas.
                <span className="fl-lock-legend"><LockGlyph /><span>Locked</span></span>
              </div>
            ) : !unlocked && (
              <div className="fl-preview-note">
                You're previewing the free formulas. Unlock all 37 with Excel Complete for ₹139.
                <span className="fl-lock-legend"><LockGlyph /><span>Locked</span></span>
              </div>
            )}
          </div>
          {isGuest ? (
            <Link to="/sign-in?next=/practice/formulas" className="btn btn-primary fl-unlock-cta">Create a free account</Link>
          ) : !unlocked && (
            <Link to="/pass" className="btn btn-primary fl-unlock-cta">Unlock Excel Complete · ₹139</Link>
          )}
        </div>
      </div>

      {error && <div className="card card-pad" style={{ textAlign: 'center' }}><p className="secondary">{error}</p></div>}
      {!items && !error && <CardGridSkeleton count={12} />}

      {items && tracks.map((track) => (
        <section key={track} className="fl-track">
          <div className="fl-track-head">
            <h2 className="section-label">{track}</h2>
            <span className="muted num">{byTrack[track].length} formula{byTrack[track].length === 1 ? '' : 's'}</span>
          </div>
          <div className="fl-grid">
            {byTrack[track].map((f) => {
              // Guests may only open SUM; otherwise the server's free flag applies.
              const open = isGuest ? f.slug === GUEST_FREE_FORMULA : f.free;
              const to = open
                ? `/practice/formulas/${f.slug}`
                : isGuest
                  ? `/sign-in?next=${encodeURIComponent(`/practice/formulas/${f.slug}`)}`
                  : `/practice/formulas/${f.slug}`;
              return (
                <Link
                  key={f.slug}
                  to={to}
                  className={`card fl-card${open ? '' : ' fl-card-locked'}`}
                >
                  <span className="fl-card-name mono">{f.name}</span>
                  {open
                    ? <span className={`pill pill-sans ${diffTone(f.difficulty)}`}>{diffLabel(f.difficulty)}</span>
                    : <span className="fl-lock-chip" aria-label="Locked"><LockGlyph /></span>}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

const diffLabel = (d) => (d === 1 ? 'Basic' : d === 2 ? 'Core' : 'Advanced');
const diffTone = (d) => (d === 1 ? 'pill-mint' : d === 2 ? 'pill-blue' : 'pill-amber');
