// Small presentational helpers shared by the reference pages.

export function Row1({ label, val, valClass = '' }) {
  return (
    <div className="row-1">
      <span className="r1-label">{label}</span>
      <span className={`r1-val ${valClass}`}>{val}</span>
    </div>
  );
}

export function Row2({ ico, head, sub, chip, chipClass = 'pill-mint', val }) {
  return (
    <div className="row-2">
      {ico && <span className="ico">{ico}</span>}
      <span className="r2-text">
        <span className="r2-head">{head}</span>
        {sub && <span className="r2-sub">{sub}</span>}
      </span>
      {chip && <span className={`pill pill-sans ${chipClass}`}>{chip}</span>}
      {val && <span className="r2-val">{val}</span>}
    </div>
  );
}

export function Strip({ tone = 'neutral', children }) {
  return <div className={`strip strip-${tone}`}>{children}</div>;
}

export function InfoStrip({ tone = 'amber', children }) {
  const dotClass = tone === 'amber' ? 'dot-amber' : '';
  return (
    <div className={`strip strip-${tone}`}>
      <span className={`dot ${dotClass}`} style={dotStyle(tone)}>i</span>
      {children}
    </div>
  );
}

function dotStyle(tone) {
  const map = { amber: 'var(--amber)', blue: 'var(--blue)', mint: 'var(--mint)' };
  return { background: map[tone] || 'var(--amber)' };
}
