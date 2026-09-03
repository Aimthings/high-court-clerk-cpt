import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { PaneSkeleton } from '../components/Skeletons.jsx';
import './reference.css';
import './mocklist.css';

// Combined mock list: Excel spreadsheet practicals + typing passages.
// Loading is a skeleton at the real row geometry; free items are open, the rest
// are gated (requirePass lands in Phase 4).
export default function MockList() {
  const [mocks, setMocks] = useState(null);
  const [passages, setPassages] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listMocks().then((d) => setMocks(d.mocks)).catch((e) => setError(e.message));
    api.listPassages().then((d) => setPassages(d.passages)).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="page">
      <div className="ref-header">
        <h1 className="page-title">Mocks</h1>
        <p className="page-sub">
          Part I — MS Excel practical (10 marks, 4 to pass) and Part II — typing (30 W.P.M. to pass).
          Ten minutes each.
        </p>
      </div>

      {error && (
        <div className="card card-pad" style={{ textAlign: 'center', marginBottom: 24 }}>
          <p className="secondary">{error}</p>
          <p className="fineprint" style={{ marginTop: 8 }}>
            The server may not be running. Start it with <span className="mono">npm run dev:server</span>.
          </p>
        </div>
      )}

      <h2 className="section-label" style={{ marginBottom: 14 }}>Excel spreadsheet mocks</h2>
      {!mocks && !error && <SkeletonGrid />}
      {mocks && (
        <div className="mock-grid" style={{ marginBottom: 34 }}>
          {mocks.map((m) => (
            <div className="card mock-card" key={m.code}>
              <div className="card-pad">
                <div className="mock-card-top">
                  <span className={`pill pill-sans ${m.is_free ? 'pill-mint' : 'pill-neutral'}`}>{m.is_free ? 'Free' : 'Pass'}</span>
                  <span className="pill pill-blue pill-sans">Part I · Excel</span>
                </div>
                <div className="card-h" style={{ marginTop: 12 }}>{m.code} · {m.title}</div>
                <div className="card-meta">Tier {m.difficulty} · {m.totalMarks} marks · {m.passMarks} to pass</div>
              </div>
              <div className="mock-card-foot">
                {m.is_free
                  ? <Link to={`/mocks/${m.code}/excel`} className="btn btn-ghost btn-block">Start 10-minute practical</Link>
                  : <Link to="/pass" className="btn btn-ghost btn-block">Unlock with the ₹119 pass</Link>}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-label" style={{ marginBottom: 14 }}>Typing passages</h2>
      {!passages && !error && <SkeletonGrid />}
      {passages && (
        <div className="mock-grid">
          {passages.map((p) => (
            <div className="card mock-card" key={p.slug}>
              <div className="card-pad">
                <div className="mock-card-top">
                  <span className={`pill pill-sans ${p.is_free ? 'pill-mint' : 'pill-neutral'}`}>{p.is_free ? 'Free' : 'Pass'}</span>
                  <span className="muted num" style={{ fontSize: 11.5 }}>{p.word_count} words</span>
                </div>
                <div className="card-h" style={{ marginTop: 12 }}>{p.title}</div>
                <div className="card-meta">{p.category} · Part II — Typing</div>
              </div>
              <div className="mock-card-foot">
                {p.is_free
                  ? <Link to={`/mocks/${p.slug}/run?mode=practice`} className="btn btn-ghost btn-block">Start 10-minute test</Link>
                  : <Link to="/pass" className="btn btn-ghost btn-block">Unlock with the ₹119 pass</Link>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="mock-grid" style={{ marginBottom: 34 }}>
      {Array.from({ length: 4 }).map((_, i) => <PaneSkeleton key={i} height={92} radius={16} />)}
    </div>
  );
}
