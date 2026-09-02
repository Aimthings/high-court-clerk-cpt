import { useState } from 'react';
import { Link } from 'react-router-dom';
import './rank.css';

// Public rank list — deck artboard 12. Reachable with no account (acquisition loop).
// Percentile leads; "Around me" is the default view. Phase 1 uses seed rows;
// Phase 5 wires GET /api/leaderboard + /api/leaderboard/me.
const AROUND = [
  { rnk: 2238, initials: 'RK', handle: 'ravi_kmr', region: 'Haryana · 14 attempts', metric: '36.6' },
  { rnk: 2239, initials: 'SG', handle: 'simran.gill', region: 'Punjab · 9 attempts', metric: '36.5' },
  { rnk: 2240, initials: 'AT', handle: 'amanthakur', region: 'Chandigarh · 21 attempts', metric: '36.4' },
  { rnk: 2241, initials: 'NV', handle: 'You · navdeep_v', region: 'Punjab · 12 attempts', metric: '36.4', you: true },
  { rnk: 2242, initials: 'HB', handle: 'harleen_b', region: 'Haryana · 7 attempts', metric: '36.3' },
  { rnk: 2243, initials: 'MJ', handle: 'manpreet.j', region: 'Punjab · 18 attempts', metric: '36.1' },
  { rnk: 2244, initials: 'DS', handle: 'deepak_singla', region: 'Haryana · 5 attempts', metric: '36.0' },
];

const BOARDS = [
  { id: 'typing', label: 'Typing', sub: 'best W.P.M.' },
  { id: 'excel', label: 'Spreadsheet', sub: 'best marks' },
  { id: 'overall', label: 'Overall', sub: 'readiness' },
];

export default function RankList() {
  const [board, setBoard] = useState('typing');
  const [period, setPeriod] = useState('all');
  const [view, setView] = useState('around'); // 'around' | 'top'

  return (
    <div className="page rank-page">
      <div className="rank-col">
        <div className="rank-topline">
          <div className="page-title" style={{ textAlign: 'center', fontSize: 15.5 }}>Rank list</div>
          <div className="rank-fresh">12,480 candidates · updated 4 min ago</div>
        </div>

        {/* board selector */}
        <div className="board-tabs" role="tablist" aria-label="Leaderboard">
          {BOARDS.map((b) => (
            <button
              key={b.id}
              role="tab"
              aria-selected={board === b.id}
              className={`board-tab ${board === b.id ? 'active' : ''}`}
              onClick={() => setBoard(b.id)}
            >
              <span className="board-tab-label">{b.label}</span>
              <span className="board-tab-sub">{b.sub}</span>
            </button>
          ))}
        </div>

        {/* period chips */}
        <div className="period-chips">
          <button className={`chip ${period === 'all' ? 'active' : ''}`} onClick={() => setPeriod('all')}>All time</button>
          <button className={`chip ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>This week</button>
        </div>

        {/* percentile hero */}
        <div className="card percentile">
          <div className="percentile-n num">Top 18%</div>
          <div className="eyebrow" style={{ marginTop: 9 }}>Typing · all time</div>
          <div className="percentile-detail num">
            <b>#2,241</b> of <b>12,480</b> · <b>36.4 W.P.M.</b>
          </div>
          <div className="percentile-move">▲ 312 places this week</div>
        </div>

        {/* around me / top 100 */}
        <div className="view-toggle">
          <button className={`view-btn ${view === 'around' ? 'active' : ''}`} onClick={() => setView('around')}>Around me</button>
          <button className={`view-btn ${view === 'top' ? 'active' : ''}`} onClick={() => setView('top')}>Top 100</button>
        </div>

        <div className="card rank-rows">
          {AROUND.map((r) => (
            <div key={r.rnk} className={`rl-row ${r.you ? 'rl-you' : ''}`}>
              <span className={`rl-rnk mono ${r.you ? 'v-blue' : 'muted'}`}>{r.rnk}</span>
              <span className={`rl-av ${r.you ? 'av-blue' : 'av-neutral'}`}>{r.initials}</span>
              <span className="rl-id">
                <span className="rl-handle">{r.handle}</span>
                <span className="rl-region">{r.region}</span>
              </span>
              <span className="rl-metric">
                <span className="rl-m num">{r.metric}</span>
                <span className="rl-mk">W.P.M.</span>
              </span>
            </div>
          ))}
        </div>

        <Link to="/mocks" className="btn btn-ghost btn-block" style={{ marginTop: 14 }}>Share my rank</Link>
        <p className="rank-note">Only exam-mode attempts are ranked. Your first run on each passage counts.</p>
      </div>
    </div>
  );
}
