import { FINGER, FINGER_NAME, KEY_FINGER, KB_ROWS, HOME_KEYS, hexA } from './fingerMap.js';

// On-screen QWERTY keyboard — transcribed from the Typing Master design.
// mode: 'tint' (keys coloured by finger) | 'heat' (per-key accuracy) | 'plain'.
// next: the expected key (glows blue). heat: { key: percent } for heat mode.
function heatColor(v) {
  if (v == null) return ['#F5F7FB', '#B7C0CE', '#E6EAF2'];
  if (v >= 96) return ['#E4F7EF', '#0E9F6E', '#BFE9D6'];
  if (v >= 90) return ['#EAF6E9', '#4C9A5A', '#CDE7C9'];
  if (v >= 80) return ['#FFF6E0', '#B47500', '#F0E0B0'];
  if (v >= 70) return ['#FBEBDD', '#C4691E', '#F0D6BE'];
  return ['#FDE9EB', '#D93B47', '#F4C9CE'];
}

export default function Keyboard({ mode = 'tint', next = '', heat = {}, keySize = 42 }) {
  const size = keySize;
  const gap = Math.round(size * 0.14);
  const nextKey = String(next || '').toLowerCase();

  const keyStyle = (label) => {
    const f = KEY_FINGER[label];
    let bg = '#FFFFFF'; let fg = '#0F1E33'; let border = '#E6EAF2'; let ring = 'none';
    if (mode === 'tint') { const c = FINGER[f] || FINGER.th; bg = hexA(c, 0.16); border = hexA(c, 0.55); fg = '#243244'; }
    else if (mode === 'plain') { bg = '#FFFFFF'; border = '#E6EAF2'; fg = '#4A5A70'; }
    else if (mode === 'heat') { const h = heatColor(heat[label]); [bg, fg, border] = h; }
    if (label === nextKey) { bg = '#2D6BE4'; fg = '#FFFFFF'; border = '#2D6BE4'; ring = '0 0 0 4px rgba(45,107,228,.25)'; }
    return {
      width: size, height: size, borderRadius: 8, border: `1px solid ${border}`,
      background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      font: `700 ${Math.round(size * 0.34)}px/1 'JetBrains Mono', monospace`, textTransform: 'uppercase',
      boxShadow: ring, position: 'relative', flex: 'none',
    };
  };

  const spaceHi = nextKey === 'space' || nextKey === ' ';
  const sh = mode === 'heat' ? heatColor(heat.space) : null;
  const spaceBg = spaceHi ? '#2D6BE4' : (sh ? sh[0] : (mode === 'tint' ? hexA(FINGER.th, 0.16) : '#FFFFFF'));
  const spaceBd = spaceHi ? '#2D6BE4' : (sh ? sh[2] : (mode === 'tint' ? hexA(FINGER.th, 0.55) : '#E6EAF2'));

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap }} aria-hidden="true">
      {KB_ROWS.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap, marginLeft: ri * Math.round(size * 0.5) }}>
          {row.map((label) => {
            const st = keyStyle(label);
            const showBump = HOME_KEYS.has(label) && mode !== 'heat';
            return (
              <div key={label} title={FINGER_NAME[KEY_FINGER[label]] || ''} style={st}>
                {label}
                {showBump && (
                  <span style={{
                    position: 'absolute', bottom: Math.round(size * 0.14),
                    width: Math.round(size * 0.24), height: 2, borderRadius: 2,
                    background: label === nextKey ? '#fff' : hexA(st.color, 0.55),
                  }}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: gap }}>
        <div style={{
          width: size * 6, height: Math.round(size * 0.78), borderRadius: 8,
          border: `1px solid ${spaceBd}`, background: spaceBg,
          boxShadow: spaceHi ? '0 0 0 4px rgba(45,107,228,.25)' : 'none',
        }}
        />
      </div>
    </div>
  );
}
