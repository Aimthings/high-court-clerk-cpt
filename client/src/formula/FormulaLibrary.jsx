import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import '../pages/reference.css';
import './formula.css';

// Formula Library — deck: a calm document-like index of every Excel formula,
// grouped into learn-friendly tracks. Part of the Excel practice (₹119).
const TRACK_ORDER = ['Math & stats', 'Logical', 'Conditional totals', 'Text', 'Lookup & reference', 'Date', 'Advanced'];

export default function FormulaLibrary() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listFormulas().then((d) => setItems(d.formulas)).catch((e) => setError(e.message));
  }, []);

  const byTrack = {};
  (items || []).forEach((f) => { (byTrack[f.track] ||= []).push(f); });
  const tracks = TRACK_ORDER.filter((t) => byTrack[t]);

  return (
    <div className="page">
      <div className="ref-header">
        <h1 className="page-title">Excel formula practice</h1>
        <p className="page-sub">
          Every formula the C.P.T. can lean on — a short lesson and a graded, hands-on practice for each.
          Excel 2007 compatible.
        </p>
      </div>

      {error && <div className="card card-pad" style={{ textAlign: 'center' }}><p className="secondary">{error}</p></div>}
      {!items && !error && <div className="mock-grid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card mock-skeleton" style={{ height: 92 }} />)}</div>}

      {items && tracks.map((track) => (
        <section key={track} className="fl-track">
          <div className="fl-track-head">
            <h2 className="section-label">{track}</h2>
            <span className="muted num">{byTrack[track].length} formulas</span>
          </div>
          <div className="fl-grid">
            {byTrack[track].map((f) => (
              <Link key={f.slug} to={`/practice/formulas/${f.slug}`} className="card fl-card">
                <span className="fl-card-name mono">{f.name}</span>
                <span className={`pill pill-sans ${diffTone(f.difficulty)}`}>{diffLabel(f.difficulty)}</span>
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
