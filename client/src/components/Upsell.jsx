import { Link } from 'react-router-dom';
import './upsell.css';

// Upsell — soft block (deck artboard 32). Shown when a free-launch allowance is
// reached. Two independent products; the card names the allowance used, what
// unlocks, one navy button with the exact price, and a "See what's included" link.
const PRODUCTS = {
  excel: {
    title: "You've used your 7 free formula practices",
    body: 'Unlock all 35 formulas and every Excel mock. Your practice so far is saved.',
    cta: 'Unlock Excel practice · ₹119',
    to: '/pass?product=excel',
  },
  typing: {
    title: "You've used your 5 free typing mocks",
    body: 'Unlock every typing mock, passage and W.P.M. report. Your practice so far is saved.',
    cta: 'Unlock all typing · ₹79',
    to: '/pass?product=typing',
  },
};

export function Upsell({ product = 'excel', title, className = '' }) {
  const p = PRODUCTS[product] || PRODUCTS.excel;
  return (
    <div className={`upsell ${className}`.trim()}>
      <div className="upsell-head">
        <span className="upsell-glyph" aria-hidden="true">▦</span>
        <span className="upsell-title">{title || p.title}</span>
      </div>
      <p className="upsell-body">{p.body}</p>
      <div className="upsell-actions">
        <Link to={p.to} className="btn btn-primary">{p.cta}</Link>
        <Link to="/pricing" className="link-btn">See what's included</Link>
      </div>
    </div>
  );
}

// SoftBlock — the in-context variant: the locked practice stays visible but
// faded and inert behind a white veil, with the Upsell card resting over it.
export function SoftBlock({ product, title, children }) {
  return (
    <div className="softblock">
      <div className="softblock-faded" aria-hidden="true">{children}</div>
      <div className="softblock-veil">
        <Upsell product={product} title={title} />
      </div>
    </div>
  );
}

export default Upsell;
