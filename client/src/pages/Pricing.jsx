import { Link } from 'react-router-dom';
import './reference.css';
import './pricing.css';

// Pricing — deck artboard 33. Two independent one-time products, typing (₹79)
// and Excel (₹119), shown as one comparison table rather than competing cards.
// The Free column states the launch allowances; the Excel column is quietly
// emphasised and carries the only navy button. No struck prices, no scarcity.
export default function Pricing() {
  return (
    <div className="page">
      <div className="ref-header">
        <div className="pr-title-row">
          <h1 className="page-title" style={{ margin: 0 }}>Pricing</h1>
          <span className="pr-ribbon">Free during launch</span>
        </div>
        <p className="page-sub">
          Two products, typing and Excel, each bought once. Not a subscription. The free allowances
          below stay free through the launch period.
        </p>
      </div>

      <div className="pr-table">
        {/* header — tiers and prices */}
        <div className="pr-row pr-head">
          <div className="pr-label"><span className="pr-eyebrow">One-time, no renewal</span></div>
          <div className="pr-cell">
            <div className="pr-tier">Free</div>
            <div className="pr-price">₹0</div>
            <div className="pr-tier-note">5 typing mocks · 1 Excel mock · 7 formulas</div>
          </div>
          <div className="pr-cell">
            <div className="pr-tier">Typing</div>
            <div className="pr-price">₹79</div>
            <div className="pr-tier-note">Every typing mock and report</div>
          </div>
          <div className="pr-cell pr-col-excel">
            <div className="pr-tier">Excel</div>
            <div className="pr-price">₹119</div>
            <div className="pr-tier-note">All 35 formulas · every Excel mock</div>
          </div>
        </div>

        <FeatRow label="Typing mocks" free="5 free during launch" typing="All mocks" excel="All mocks" />
        <FeatRow label="Excel mock" free="1 free" typing="1 free" excel="Every Excel mock" />
        <FeatRow label="Formula practices" free="7 free" typing="7 free" excel="All 35 formulas" />
        <FeatRow label="W.P.M. report & mistakes" free="Basic" typing="Full" excel="Full" />
        <FeatRow label="Rank list entry" free={<Tick />} typing={<Tick />} excel={<Tick />} />
        <FeatRow label="Practice saved forever" free={<Tick />} typing={<Tick />} excel={<Tick />} />

        {/* footer — CTAs */}
        <div className="pr-row pr-foot">
          <div className="pr-label" />
          <div className="pr-cell"><Link to="/mocks" className="btn btn-ghost">Start free</Link></div>
          <div className="pr-cell"><Link to="/pass?product=typing" className="btn btn-ghost">Unlock typing · ₹79</Link></div>
          <div className="pr-cell pr-col-excel"><Link to="/pass?product=excel" className="btn btn-primary">Unlock Excel · ₹119</Link></div>
        </div>
      </div>

      <p className="pr-fine">
        Prices are one-time and include all future formulas and mocks added to that product.
        Read the <Link to="/the-exam" className="link-btn">exam</Link> and{' '}
        <Link to="/scoring" className="link-btn">scoring</Link> pages before you buy.
      </p>
    </div>
  );
}

function FeatRow({ label, free, typing, excel }) {
  return (
    <div className="pr-row pr-feat">
      <div className="pr-label">{label}</div>
      <div className="pr-cell">{free}</div>
      <div className="pr-cell">{typing}</div>
      <div className="pr-cell pr-col-excel">{excel}</div>
    </div>
  );
}

function Tick() {
  return <span className="pr-tick" aria-label="included">✓</span>;
}
