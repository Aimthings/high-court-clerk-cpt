// Small shared UI atoms for Typing Master — transcribed from the design's
// hand-rolled SVG (no chart library).

export function Ring({ pct, color, size = 46 }) {
  const r = (size - 7) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E9EDF3" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <span className="num" style={{ position: 'absolute', font: `800 ${Math.round(size * 0.28)}px/1 'Plus Jakarta Sans',sans-serif`, color: '#0D2846' }}>{pct}</span>
    </div>
  );
}

export function LockRing({ size = 46 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', border: '2px dashed #D5DCE9', flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: '600 16px/1', color: '#B7C0CE' }}>🔒</div>
  );
}

export function Stars({ n, size = 15 }) {
  return (
    <span style={{ letterSpacing: '2px', whiteSpace: 'nowrap' }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ color: i < n ? '#B47500' : '#D9DEE8', font: `700 ${size}px/1 'Plus Jakarta Sans',sans-serif` }}>★</span>
      ))}
    </span>
  );
}

// Simple 4-finger + thumb hand; the active finger is filled with its hue.
export function Hand({ active, color }) {
  const heights = [30, 42, 46, 40];
  return (
    <svg width="76" height="58" viewBox="0 0 76 58" aria-hidden="true">
      <rect x="4" y="40" width="22" height="10" rx="5" transform="rotate(-32 15 45)" fill="#E3E7EE" stroke="#D5DCE9" strokeWidth="1" />
      {heights.map((h, i) => (
        <rect key={i} x={8 + i * 15} y={52 - h} width="11" height={h} rx="5.5" fill={i === active ? color : '#E3E7EE'} stroke={i === active ? color : '#D5DCE9'} strokeWidth="1" />
      ))}
    </svg>
  );
}

const STATE_STYLE = {
  pending: { color: '#B7C0CE', background: 'transparent', borderBottom: '2px solid transparent' },
  done: { color: '#0F1E33', background: 'transparent', borderBottom: '2px solid transparent' },
  errdone: { color: '#D93B47', background: 'transparent', borderBottom: '2px solid #F4C9CE' },
  wrong: { color: '#D93B47', background: '#FDE9EB', borderBottom: '2px solid #D93B47' },
  current: { color: '#2D6BE4', background: '#E7EEFC', borderBottom: '2px solid #2D6BE4' },
};

// The passage wraps by word so every character that must be typed is visible at
// once — each word is a non-breaking group, and a real space between words gives
// the wrap point. The space also carries its own typed state.
export function TypingLine({ chars, size = 26 }) {
  const charSpan = (ch) => (
    <span
      key={ch.i}
      style={{ font: `500 ${size}px/1.9 'JetBrains Mono',monospace`, padding: '2px 1px', borderRadius: 3, ...(STATE_STYLE[ch.s] || STATE_STYLE.pending) }}
    >
      {ch.c === ' ' ? ' ' : ch.c}
    </span>
  );

  const groups = [];
  let word = [];
  chars.forEach((ch, i) => {
    if (ch.c === ' ') { groups.push({ word, space: { ...ch, i } }); word = []; }
    else word.push({ ...ch, i });
  });
  if (word.length) groups.push({ word, space: null });

  return (
    <div style={{ textAlign: 'left', maxWidth: 720, margin: '0 auto', wordBreak: 'break-word' }}>
      {groups.map((g, gi) => (
        <span key={gi}>
          <span style={{ whiteSpace: 'nowrap' }}>{g.word.map(charSpan)}</span>
          {g.space && charSpan(g.space)}
        </span>
      ))}
    </div>
  );
}

// Home-row reference: the real hands photo with a coloured dot on each finger's
// resting key (positions transcribed from the design). Aspect-locked so the dots
// stay aligned at any width.
const REST_DOTS = [
  { k: 'A', l: 8.3, t: 31.1, c: '#7E62A8' },
  { k: 'S', l: 16.1, t: 13.2, c: '#2E8C8C' },
  { k: 'D', l: 24.0, t: 9.6, c: '#6F9A55' },
  { k: 'F', l: 32.6, t: 17.2, c: '#B5892F' },
  { k: '_l', l: 41.5, t: 56.5, c: '#8A93A0' },
  { k: '_r', l: 58.5, t: 56.5, c: '#8A93A0' },
  { k: 'J', l: 67.4, t: 17.2, c: '#BF6A4A' },
  { k: 'K', l: 76.0, t: 9.6, c: '#C079A6' },
  { k: 'L', l: 83.9, t: 13.2, c: '#5A7CA6' },
  { k: ';', l: 91.7, t: 31.1, c: '#9A7C86' },
];

export function HandsRest({ max = 460 }) {
  return (
    <div style={{ width: '100%', maxWidth: max, margin: '0 auto' }}>
      <div style={{ position: 'relative', width: '100%', paddingTop: '58%' }}>
        <img src="/typinghands.png" alt="Both hands resting on the home row" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
        {REST_DOTS.map((d) => (
          <div
            key={d.k}
            style={{ position: 'absolute', left: `${d.l}%`, top: `${d.t}%`, transform: 'translate(-50%,-50%)', width: 32, height: 32, borderRadius: '50%', background: d.c, border: '2px solid #fff', boxShadow: '0 1px 3px rgba(15,30,51,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "700 12px/1 'JetBrains Mono',monospace", color: '#fff' }}
          >
            {d.k.startsWith('_') ? <span style={{ width: 13, height: 3, borderRadius: 2, background: '#fff' }} /> : d.k}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', padding: '0 8%', font: "600 12px/1 'Plus Jakarta Sans',sans-serif", color: '#8494A8' }}>
        <span>Left hand</span><span>Right hand</span>
      </div>
    </div>
  );
}

// Hand atom props (active finger 0=index..3=pinky, + hue) for a key.
const HAND_IDX = { li: 0, ri: 0, lm: 1, rm: 1, lr: 2, rr: 2, lp: 3, rp: 3, th: -1 };
export function handForKey(ch, fingerOf, FINGER) {
  const f = fingerOf(ch);
  return { active: HAND_IDX[f] ?? 0, color: FINGER[f] || FINGER.th, finger: f };
}
