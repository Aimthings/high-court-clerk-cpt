import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ListSkeleton } from '../components/Skeletons.jsx';
import './rank.css';

// Public rank list — deck artboards 12/13. Reachable with no account. Percentile
// leads; "Around me" is the default view for signed-in candidates. Wired to
// GET /api/leaderboard (public, cached) and /api/leaderboard/me (never cached).
const BOARDS = [
  { id: 'typing', label: 'Typing', sub: 'best W.P.M.', unit: 'W.P.M.', dp: 1 },
  { id: 'excel', label: 'Spreadsheet', sub: 'best marks', unit: 'marks', dp: 0 },
  { id: 'overall', label: 'Overall', sub: 'readiness', unit: 'readiness', dp: 0 },
];

const tone = (rnk) => (rnk === 1 ? 'amber' : rnk === 3 ? 'flame' : 'neutral');
const fmt = (n, dp) => Number(n).toFixed(dp);

export default function RankList() {
  const { user } = useAuth();
  const [board, setBoard] = useState('typing');
  const [view, setView] = useState('around'); // 'around' | 'top'
  const [data, setData] = useState(null); // public board
  const [me, setMe] = useState(null); // personal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const meta = BOARDS.find((b) => b.id === board);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    Promise.all([
      api.leaderboard(board),
      user ? api.myRank(board).catch(() => null) : Promise.resolve(null),
    ]).then(([b, m]) => {
      if (cancelled) return;
      setData(b); setMe(m); setLoading(false);
      if (!user) setView('top');
    }).catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [board, user]);

  const updated = data?.updatedAt ? timeAgo(data.updatedAt) : null;

  return (
    <div className="page rank-page">
      <div className="rank-col">
        <div className="rank-topline">
          <div className="page-title" style={{ textAlign: 'center', fontSize: 15.5 }}>Rank list</div>
          <div className="rank-fresh">
            {data ? `${data.total.toLocaleString('en-IN')} candidates` : '—'}{updated ? ` · updated ${updated}` : ''}
          </div>
        </div>

        <div className="board-tabs" role="tablist" aria-label="Leaderboard">
          {BOARDS.map((b) => (
            <button key={b.id} role="tab" aria-selected={board === b.id}
              className={`board-tab ${board === b.id ? 'active' : ''}`} onClick={() => setBoard(b.id)}>
              <span className="board-tab-label">{b.label}</span>
              <span className="board-tab-sub">{b.sub}</span>
            </button>
          ))}
        </div>

        {error && <div className="card card-pad" style={{ marginTop: 14, textAlign: 'center' }}><p className="secondary">{error}</p></div>}

        {loading && <div style={{ marginTop: 14 }}><ListSkeleton rows={8} /></div>}

        {!loading && !error && (
          <>
            {/* personal percentile hero (signed-in + ranked) */}
            {me?.ranked && (
              <div className="card percentile">
                <div className="percentile-n num">Top {me.you.pct}%</div>
                <div className="eyebrow" style={{ marginTop: 9 }}>{meta.label} · all time</div>
                <div className="percentile-detail num">
                  <b>#{me.you.rnk.toLocaleString('en-IN')}</b> of <b>{me.total.toLocaleString('en-IN')}</b> ·{' '}
                  <b>{fmt(me.you.metric, meta.dp)} {meta.unit}</b>
                </div>
                {me.you.prevRnk != null && me.you.prevRnk !== me.you.rnk && (
                  <div className={`percentile-move ${me.you.prevRnk > me.you.rnk ? '' : 'move-down'}`}>
                    {me.you.prevRnk > me.you.rnk ? '▲' : '▼'} {Math.abs(me.you.prevRnk - me.you.rnk)} places since last rebuild
                  </div>
                )}
              </div>
            )}

            {/* signed-in but not yet ranked — name the reason + the single fix */}
            {user && me && !me.ranked && (
              <div className="card card-pad rank-eligible" style={{ marginTop: 14, textAlign: 'center' }}>
                <div className="card-h">You are not on this board yet</div>
                <p className="card-meta" style={{ marginTop: 6 }}>
                  Only your first exam-mode attempt on each {board === 'excel' ? 'mock' : 'passage'} is ranked,
                  and board visibility must be on.
                </p>
                <Link to="/mocks" className="btn btn-primary" style={{ marginTop: 14 }}>Take an exam-mode mock</Link>
              </div>
            )}

            {/* guest prompt */}
            {!user && (
              <div className="strip strip-blue" style={{ marginTop: 14, borderRadius: 'var(--r-btn)' }}>
                <Link to="/sign-in" className="link-btn">Sign in</Link> to see where you stand.
              </div>
            )}

            {/* view toggle (only when the candidate has an "around me") */}
            {me?.ranked && (
              <div className="view-toggle">
                <button className={`view-btn ${view === 'around' ? 'active' : ''}`} onClick={() => setView('around')}>Around me</button>
                <button className={`view-btn ${view === 'top' ? 'active' : ''}`} onClick={() => setView('top')}>Top 100</button>
              </div>
            )}

            {/* rows */}
            <RowsCard
              rows={view === 'around' && me?.ranked ? me.around : data.rows}
              meta={meta}
              topMedals={view === 'top' || !me?.ranked}
            />

            {me?.ranked && (
              <a className="btn btn-ghost btn-block" style={{ marginTop: 14 }}
                href={`/api/leaderboard/card.png?board=${board}`} target="_blank" rel="noreferrer">
                Share my rank
              </a>
            )}
            <p className="rank-note">Only exam-mode attempts are ranked. Your first run on each counts.</p>
          </>
        )}
      </div>
    </div>
  );
}

function RowsCard({ rows, meta, topMedals }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="card card-pad" style={{ marginTop: 14, textAlign: 'center' }}>
        <div className="card-h">No ranked attempts yet</div>
        <p className="card-meta" style={{ marginTop: 6 }}>Be the first — take an exam-mode mock.</p>
      </div>
    );
  }
  return (
    <div className="card rank-rows" style={{ marginTop: 14 }}>
      {rows.map((r) => {
        const medal = topMedals && r.rnk <= 3;
        const t = medal ? tone(r.rnk) : 'neutral';
        return (
          <div key={r.rnk + (r.handle || '')} className={`rl-row ${r.you ? 'rl-you' : ''}`}>
            <span className="rl-rnk-wrap">
              {medal
                ? <span className={`pill pill-${t} rl-rnk-pill`}>{r.rnk}</span>
                : <span className={`rl-rnk mono ${r.you ? 'v-blue' : 'muted'}`}>{r.rnk}</span>}
            </span>
            <span className={`rl-av av-${r.you ? 'blue' : t}`}>{initials(r.handle)}</span>
            <span className="rl-id">
              <span className="rl-handle">{r.you ? `You · ${r.handle}` : r.handle}</span>
              <span className="rl-region">{[r.region, `${r.attempts} attempts`].filter(Boolean).join(' · ')}</span>
            </span>
            <span className="rl-metric">
              <span className="rl-m num">{fmt(r.metric, meta.dp)}</span>
              <span className="rl-mk">{meta.unit}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function initials(handle) {
  if (!handle) return '–';
  const parts = handle.replace(/[._]/g, ' ').split(' ').filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || handle.slice(0, 2).toUpperCase();
}
function timeAgo(ts) {
  const s = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return `${h} h ago`;
}
