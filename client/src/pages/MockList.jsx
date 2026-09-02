import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import './reference.css';
import './mocklist.css';

// Passage list (typing). Excel mocks join this list in Phase 3. Loading is a
// skeleton at the real row geometry; free passages are open, the rest are gated.
export default function MockList() {
  const [passages, setPassages] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listPassages().then((d) => setPassages(d.passages)).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="page">
      <div className="ref-header">
        <h1 className="page-title">Typing passages</h1>
        <p className="page-sub">
          Court-English passages · 10 minutes each · scored as (words typed − mistakes) ÷ 10, pass at
          30 W.P.M.
        </p>
      </div>

      {error && (
        <div className="card card-pad" style={{ textAlign: 'center' }}>
          <p className="secondary">{error}</p>
          <p className="fineprint" style={{ marginTop: 8 }}>
            The scoring server may not be running. Start it with <span className="mono">npm run dev:server</span>.
          </p>
        </div>
      )}

      {!passages && !error && (
        <div className="mock-grid">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card mock-skeleton" />)}
        </div>
      )}

      {passages && (
        <div className="mock-grid">
          {passages.map((p) => (
            <div className="card mock-card" key={p.slug}>
              <div className="card-pad">
                <div className="mock-card-top">
                  <span className={`pill pill-sans ${p.is_free ? 'pill-mint' : 'pill-neutral'}`}>
                    {p.is_free ? 'Free' : 'Pass'}
                  </span>
                  <span className="muted num" style={{ fontSize: 11.5 }}>{p.word_count} words</span>
                </div>
                <div className="card-h" style={{ marginTop: 12 }}>{p.title}</div>
                <div className="card-meta">{p.category} · Part II — Typing</div>
              </div>
              <div className="mock-card-foot">
                {p.is_free ? (
                  <Link to={`/mocks/${p.slug}/run?mode=practice`} className="btn btn-ghost btn-block">
                    Start 10-minute test
                  </Link>
                ) : (
                  <Link to="/pass" className="btn btn-ghost btn-block">Unlock with the ₹99 pass</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
