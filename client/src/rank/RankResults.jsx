import { useState } from 'react';
import './rank-results.css';

// Full results & analysis, rendered from the real /submit payload. All charts are
// hand-rolled SVG, matching the delivered Daylight design.
const LETTER = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
const inr = (n) => Number(n || 0).toLocaleString('en-IN');
const n2 = (n) => Number(n || 0).toFixed(2);

export default function RankResults({ data, onReset }) {
  const { score, maxScore, rawScore, negLost, correct, wrong, left, accuracy, sections, stats, questions, category, marking, meta, exam } = data;

  return (
    <div className="rr">
      <div className="rr-metastrip">
        <span className="rr-metatag">✓ PDF read</span>
        {meta?.examName && <span className="rr-metaitem">{meta.examName}</span>}
        {meta?.examDate && <span className="rr-metaitem">Exam date · <b>{meta.examDate}</b></span>}
        {meta?.shift && <span className="rr-metaitem">Shift · <b>{meta.shift}</b></span>}
        <span className="rr-metaitem">Category · <b>{category}</b></span>
        <button className="rr-again" onClick={onReset}>Upload another</button>
      </div>

      {/* score hero */}
      <div className="rr-hero">
        <div className="rr-hero-score">
          <div className="rr-kick">Your score</div>
          <div className="rr-scoreline">
            <span className="num rr-scorebig">{n2(score)}</span>
            <span className="num rr-scoreout">/ {inr(maxScore)}</span>
          </div>
          <div className="rr-pctpill num">{stats.percentile}th percentile</div>
        </div>
        <div className="rr-hero-div" />
        <div className="rr-hero-rank">
          <div>
            <div className="rr-kick">Predicted rank</div>
            <div className="num rr-rankbig">
              {stats.projected ? `~${inr(stats.projected.lo)}–${inr(stats.projected.hi)}` : `#${inr(stats.poolRank)}`}
            </div>
            <div className="rr-ranksub">
              {stats.projected
                ? <>{category} · out of <span className="num">{inr(stats.projected.total)}</span> candidates</>
                : <>{category} · {inr(stats.poolRank)} of <span className="num">{inr(stats.poolSize)}</span> in the predictor pool</>}
            </div>
          </div>
          <div className="rr-hero-verdict">
            <div className="rr-kick">Verdict</div>
            <Verdict v={stats.verdict} />
          </div>
        </div>
      </div>

      <div className="rr-grid">
        {/* attempt breakdown */}
        <div className="rr-card">
          <div className="rr-card-h">Attempt breakdown</div>
          <div className="rr-attempt">
            <Donut correct={correct} wrong={wrong} left={left} accuracy={accuracy} />
            <div className="rr-legend">
              <LegendRow c="#0E9F6E" label="Correct" v={correct} />
              <LegendRow c="#D93B47" label="Wrong" v={wrong} />
              <LegendRow c="#C7CFD9" label="Left blank" v={left} />
            </div>
          </div>
        </div>

        {/* negative marking */}
        <div className="rr-card rr-col">
          <div className="rr-card-h">Negative-marking cost</div>
          <div className="rr-neg">
            {marking.neg > 0 ? (
              <>
                <div className="rr-neg-big"><span className="num">−{n2(negLost)}</span><span className="rr-neg-unit">marks lost</span></div>
                <div className="rr-neg-note">−<span className="num">{marking.neg}</span> on each of <span className="num">{wrong}</span> wrong answers. Raw <span className="num">{n2(rawScore)}</span> → net <span className="num">{n2(score)}</span>.</div>
              </>
            ) : (
              <>
                <div className="rr-neg-big"><span className="num" style={{ color: '#0E9F6E' }}>0.00</span><span className="rr-neg-unit">marks lost</span></div>
                <div className="rr-neg-note">No negative marking is applied — raw equals net. Score <span className="num">{n2(score)}</span> from <span className="num">{correct}</span> correct.</div>
              </>
            )}
          </div>
          <div className="rr-negbar">
            <span style={{ width: `${maxScore ? (rawScore / maxScore) * 100 : 0}%`, background: '#0D2846' }} />
            {marking.neg > 0 && <span style={{ width: `${maxScore ? (negLost / maxScore) * 100 : 0}%`, background: '#D93B47' }} />}
          </div>
        </div>

        {/* subject-wise */}
        <div className="rr-card rr-full">
          <div className="rr-card-head"><span className="rr-card-h">Section-wise analysis</span><span className="rr-card-sub">score · accuracy per section</span></div>
          <Subjects rows={sections} />
        </div>

        {/* cohort */}
        <div className="rr-card">
          <div className="rr-card-head"><span className="rr-card-h">Where you stand</span><span className="rr-card-sub">all predictor users</span></div>
          <Cohort stats={stats} you={score} max={maxScore} />
          <div className="rr-cohort-legend">
            <span><i style={{ background: '#2D6BE4', borderRadius: '50%' }} />You · <b className="num">{n2(score)}</b></span>
            <span><i style={{ background: '#8494A8', height: 2 }} />Pool avg <b className="num">{stats.mean}</b></span>
            <span><i style={{ background: '#0E9F6E', height: 2 }} />Top 10% <b className="num">≥{stats.top10}</b></span>
          </div>
        </div>

        {/* cutoff */}
        <div className="rr-card rr-col">
          <div className="rr-card-head"><span className="rr-card-h">Category cutoff</span><span className="rr-card-sub">{category} · estimated</span></div>
          <div className="rr-cutoff">
            <div>
              <div className="rr-kick">Est. last selected</div>
              <div className="num rr-cutoff-big">{stats.cutoff.lo === stats.cutoff.hi ? stats.cutoff.lo : `${stats.cutoff.lo}–${stats.cutoff.hi}`}</div>
            </div>
            <div>
              <div className="rr-kick">Your net</div>
              <div className="num rr-cutoff-big" style={{ color: '#0F1E33' }}>{n2(score)}</div>
            </div>
          </div>
          <div className="rr-cutoff-verdict"><CutoffVerdict v={stats.verdict} /></div>
        </div>

        {/* question review */}
        <div className="rr-card rr-full">
          <div className="rr-card-head"><span className="rr-card-h">Question review</span></div>
          <Review questions={questions} />
        </div>
      </div>

      <div className="rr-actions">
        <button className="rr-primary" onClick={() => window.print()}>Download / print result</button>
        <button className="rr-ghost" onClick={onReset}>Predict another</button>
        <span className="rr-actions-note">Predicted rank only — not the official result. Cutoffs are estimated from past years and this year's predictor pool.</span>
      </div>
    </div>
  );
}

function LegendRow({ c, label, v }) {
  return (
    <div className="rr-legrow">
      <span className="rr-legdot" style={{ background: c }} />
      <span className="rr-leglabel">{label}</span>
      <span className="num rr-legval">{v}</span>
    </div>
  );
}

function Donut({ correct, wrong, left, accuracy, size = 120 }) {
  const total = Math.max(1, correct + wrong + left);
  const data = [{ v: correct, c: '#0E9F6E' }, { v: wrong, c: '#D93B47' }, { v: left, c: '#C7CFD9' }];
  const sw = 16; const r = (size - sw) / 2; const cx = size / 2; const cy = size / 2; const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="rr-donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0F2F6" strokeWidth={sw} />
        {data.map((d, i) => {
          const frac = d.v / total; const dash = frac * C; const off = -acc * C; acc += frac;
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.c} strokeWidth={sw} strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={off} />;
        })}
      </svg>
      <div className="rr-donut-c">
        <span className="num rr-donut-pct">{accuracy}%</span>
        <span className="rr-donut-lab">Accuracy</span>
      </div>
    </div>
  );
}

function Subjects({ rows }) {
  const accColor = (a) => (a >= 85 ? '#0E9F6E' : a >= 75 ? '#B47500' : '#D93B47');
  return (
    <div className="rr-subjects">
      {rows.map((r, i) => (
        <div className="rr-subrow" key={i}>
          <span className="rr-subname">{r.name}</span>
          <span className="rr-subbar"><span style={{ width: `${r.max ? (r.score / r.max) * 100 : 0}%` }} /></span>
          <span className="num rr-subscore">{n2(r.score)} / {r.max}</span>
          <span className="num rr-subacc" style={{ color: accColor(r.acc) }}>{r.acc}%</span>
        </div>
      ))}
    </div>
  );
}

function Cohort({ stats, you, max }) {
  const W = 420; const H = 150; const padX = 8; const base = H - 26; const topPad = 14;
  const lo = 0; const hi = Math.max(max || 100, you, stats.top10, stats.mean + stats.sd * 2);
  const sx = (v) => padX + ((v - lo) / (hi - lo)) * (W - padX * 2);
  const mu = stats.mean; const sd = Math.max(1, stats.sd); const peak = base - topPad;
  const g = (x) => Math.exp(-0.5 * ((x - mu) / sd) ** 2);
  const pts = [];
  for (let v = lo; v <= hi; v += (hi - lo) / 60) pts.push(`${sx(v).toFixed(1)},${(base - g(v) * peak).toFixed(1)}`);
  const area = `M ${padX},${base} L ${pts.join(' L ')} L ${W - padX},${base} Z`;
  const youX = sx(you); const avgX = sx(mu); const topX = sx(stats.top10);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <path d={area} fill="rgba(45,107,228,0.07)" />
      <path d={`M ${pts.join(' L ')}`} fill="none" stroke="#C6D0DE" strokeWidth={1.5} />
      <line x1={padX} y1={base} x2={W - padX} y2={base} stroke="#E6EAF2" strokeWidth={1} />
      <line x1={avgX} y1={base} x2={avgX} y2={base - g(mu) * peak} stroke="#8494A8" strokeWidth={1.5} strokeDasharray="3 3" />
      <line x1={topX} y1={base} x2={topX} y2={base - g(stats.top10) * peak} stroke="#0E9F6E" strokeWidth={1.5} strokeDasharray="3 3" />
      <line x1={youX} y1={base} x2={youX} y2={topPad} stroke="#2D6BE4" strokeWidth={2} />
      <circle cx={youX} cy={topPad} r={5} fill="#2D6BE4" stroke="#fff" strokeWidth={2} />
      <text x={Math.min(W - 14, Math.max(14, youX))} y={topPad - 8} textAnchor="middle" style={{ font: "700 11px/1 'JetBrains Mono',monospace", fill: '#2D6BE4' }}>{Math.round(you)}</text>
      <text x={padX} y={H - 8} style={{ font: "500 10px/1 'JetBrains Mono',monospace", fill: '#A6B0BF' }}>{lo}</text>
      <text x={W - padX} y={H - 8} textAnchor="end" style={{ font: "500 10px/1 'JetBrains Mono',monospace", fill: '#A6B0BF' }}>{Math.round(hi)}</text>
    </svg>
  );
}

const VERD = {
  safe: { g: '✓', t: 'Safe', c: '#0E9F6E', bg: '#E6F6EF', border: '#BDE9D4', sub: 'Your net is comfortably above the estimated cutoff band.' },
  borderline: { g: '◑', t: 'Borderline', c: '#B47500', bg: '#FFF6E0', border: '#F0E0B0', sub: 'Your net sits inside the estimated cutoff band. Selection is likely but not certain.' },
  unlikely: { g: '✕', t: 'Unlikely', c: '#D93B47', bg: '#FCEBEC', border: '#F3C9CD', sub: 'Your net is below the estimated cutoff band on current pool data.' },
};
function Verdict({ v }) {
  const d = VERD[v] || VERD.borderline;
  return <div className="rr-verdict" style={{ background: d.bg }}><span style={{ color: d.c, font: "700 18px/1 'Plus Jakarta Sans',sans-serif" }}>{d.g}</span><span style={{ color: d.c, font: "800 20px/1 'Plus Jakarta Sans',sans-serif" }}>{d.t}</span></div>;
}
function CutoffVerdict({ v }) {
  const d = VERD[v] || VERD.borderline;
  return (
    <div className="rr-cv" style={{ background: d.bg, borderColor: d.border }}>
      <span className="rr-cv-badge" style={{ background: d.c }}>{d.g}</span>
      <div>
        <div className="rr-cv-t" style={{ color: d.c }}>{d.t}</div>
        <div className="rr-cv-s">{d.sub}</div>
      </div>
    </div>
  );
}

function Review({ questions }) {
  const [all, setAll] = useState(false);
  const rows = all ? questions : questions.slice(0, 8);
  const cell = (q) => {
    const attempted = q.chosen && q.chosen !== '--';
    const ok = attempted ? String(q.chosen) === String(q.correct) : null;
    return { you: attempted ? LETTER[q.chosen] || q.chosen : '—', cor: LETTER[q.correct] || q.correct, ok };
  };
  const glyph = (ok) => (ok === true ? { g: '✓', c: '#0E9F6E', t: 'Correct' } : ok === false ? { g: '✕', c: '#D93B47', t: 'Wrong' } : { g: '○', c: '#A6B0BF', t: 'Left blank' });
  return (
    <div className="rr-review">
      <div className="rr-rev-head"><span className="rr-rev-q">Q</span><span className="rr-rev-a">Your answer</span><span className="rr-rev-a">Correct</span><span className="rr-rev-r">Result</span></div>
      {rows.map((q) => {
        const c = cell(q); const s = glyph(c.ok);
        return (
          <div className="rr-rev-row" key={q.q}>
            <span className="num rr-rev-q">{String(q.q).padStart(2, '0')}</span>
            <span className="num rr-rev-a" style={{ color: c.ok === false ? '#D93B47' : c.ok === null ? '#A6B0BF' : '#0F1E33' }}>{c.you}</span>
            <span className="num rr-rev-a" style={{ color: '#0F1E33' }}>{c.cor}</span>
            <span className="rr-rev-r"><span style={{ color: s.c, font: '700 13px/1' }}>{s.g}</span> <span style={{ color: s.c, font: "600 12px/1 'Plus Jakarta Sans',sans-serif" }}>{s.t}</span></span>
          </div>
        );
      })}
      {questions.length > 8 && (
        <button className="rr-rev-more" onClick={() => setAll(!all)}>
          {all ? 'Show fewer' : `Show all ${questions.length} questions ▾`}
        </button>
      )}
    </div>
  );
}
