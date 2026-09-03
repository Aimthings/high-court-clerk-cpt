import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ProgressChart from '../components/ProgressChart.jsx';
import { PaneSkeleton } from '../components/Skeletons.jsx';
import '../components/progresschart.css';
import './reference.css';

// Signed-in home — deck artboard 6. Progress over recent attempts (hand-rolled
// SVG with the 30 W.P.M. line) and the last attempts.
export default function Home() {
  const { user, loading } = useAuth();
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api.typingHistory().then((d) => setHistory(d.attempts)).catch((e) => setError(e.message));
  }, [user]);

  if (loading) return <div className="page centre-wrap"><div style={{ width: 680, maxWidth: '100%' }}><PaneSkeleton height={240} /></div></div>;

  if (!user) {
    return (
      <div className="page centre-wrap">
        <div className="card-420" style={{ textAlign: 'center' }}>
          <h1 className="page-title">Your progress</h1>
          <p className="page-sub" style={{ fontSize: 13, marginTop: 10 }}>Sign in to track your W.P.M. over time.</p>
          <Link to="/sign-in" className="btn btn-primary" style={{ marginTop: 18 }}>Sign in</Link>
        </div>
      </div>
    );
  }

  const chronological = history ? [...history].reverse() : [];
  const points = chronological
    .filter((a) => a.sssc_wpm != null)
    .map((a) => ({ wpm: Number(a.sssc_wpm), label: a.title }));

  return (
    <div className="page">
      <div className="ref-header">
        <h1 className="page-title">Your progress</h1>
        <p className="page-sub">S.S.S.C. W.P.M. over your recent typing attempts.</p>
      </div>

      {error && <div className="card card-pad" style={{ textAlign: 'center' }}><p className="secondary">{error}</p></div>}

      {!error && (
        <div className="split-ref">
          <div className="ref-main stack">
            <div className="card card-pad">
              <div className="card-simple-head" style={{ padding: 0, marginBottom: 12 }}>W.P.M. over time</div>
              <ProgressChart points={points} />
            </div>
          </div>
          <aside className="ref-rail stack">
            <div className="card">
              <div className="card-simple-head">Last attempts</div>
              {(!history || history.length === 0) && (
                <p className="policy-body" style={{ padding: '0 16px 14px', marginTop: 0 }}>
                  No attempts yet. <Link to="/mocks" className="link-btn">Take a mock</Link> to start.
                </p>
              )}
              {history && history.slice(0, 8).map((a, i) => (
                <div className="row-1" key={i}>
                  <span className="r1-label">
                    {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {a.title}
                  </span>
                  <span className={`r1-val ${a.passed ? 'v-mint' : 'v-rose'} num`}>{Number(a.sssc_wpm).toFixed(1)}</span>
                </div>
              ))}
            </div>
            <Link to="/mocks" className="btn btn-primary btn-block">Take another test</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
