// Hand-rolled SVG line chart of S.S.S.C. W.P.M. over recent attempts, with the
// 30 W.P.M. pass threshold drawn as a dashed line (brief §6). No chart library.
export default function ProgressChart({ points }) {
  const W = 680;
  const H = 220;
  const pad = { t: 16, r: 16, b: 28, l: 34 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  if (!points || points.length === 0) {
    return <div className="chart-empty muted">No attempts yet.</div>;
  }

  const maxWpm = Math.max(40, ...points.map((p) => p.wpm)) * 1.1;
  const n = points.length;
  const x = (i) => pad.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => pad.t + ih - (v / maxWpm) * ih;
  const thresholdY = y(30);

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.wpm).toFixed(1)}`).join(' ');

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="progress-chart" role="img" aria-label="W.P.M. over recent attempts">
        {/* y gridlines */}
        {[0, 20, 40].filter((v) => v <= maxWpm).map((v) => (
          <g key={v}>
            <line x1={pad.l} y1={y(v)} x2={W - pad.r} y2={y(v)} className="chart-grid" />
            <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" className="chart-axis-label">{v}</text>
          </g>
        ))}
        {/* 30 W.P.M. threshold */}
        <line x1={pad.l} y1={thresholdY} x2={W - pad.r} y2={thresholdY} className="chart-threshold" />
        <text x={W - pad.r} y={thresholdY - 5} textAnchor="end" className="chart-threshold-label">30 W.P.M. to pass</text>
        {/* line */}
        <path d={line} className="chart-line" fill="none" />
        {/* points */}
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.wpm)} r="3.5" className={p.wpm >= 30 ? 'chart-dot pass' : 'chart-dot fail'} />
        ))}
      </svg>
    </div>
  );
}
