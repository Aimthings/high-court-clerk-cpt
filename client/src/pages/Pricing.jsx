import { Link } from 'react-router-dom';
import { CATALOG } from '../lib/catalog.js';
import { useAuth } from '../context/AuthContext.jsx';
import './reference.css';
import './pricing.css';

// Pricing — the product catalog. One-time purchases, 45 days, no auto-renewal.
// Free during the launch; the cards drive to /pass to unlock. No struck prices,
// no scarcity. Founding-member rates show during the launch and to founders.
export default function Pricing() {
  const { launchFree, founding } = useAuth();
  const showFounding = launchFree || founding;
  const priceOf = (p) => (showFounding ? p.priceFounding : p.priceStandard);
  return (
    <div className="page">
      <div className="ref-header">
        <div className="pr-title-row">
          <h1 className="page-title" style={{ margin: 0 }}>Pricing</h1>
          <span className="pr-ribbon">Free during launch</span>
        </div>
        <p className="page-sub">
          Buy only the paper you need, or take everything. Each is a one-time purchase with 45 days
          of access — not a subscription. Free for everyone through the launch, and the rates below
          are the founding-member rates — locked in for anyone who joins during the launch.
        </p>
      </div>

      <div className="tiers">
        {CATALOG.map((p) => (
          <div key={p.id} className={`tier${p.highlight ? ' tier-hi' : ''}`}>
            {p.highlight && <div className="tier-badge">Best value</div>}
            <div className="tier-tag">{p.tag}</div>
            <div className="tier-name">{p.label}</div>
            <div className="tier-price num">₹{priceOf(p)}</div>
            <div className="tier-term">{showFounding ? 'Founding-member rate · 45 days' : '45 days · no auto-renewal'}</div>
            <div className="tier-feats">
              {p.features.map((f) => (
                <div key={f} className="tier-feat"><span className="price-tick">✓</span><span>{f}</span></div>
              ))}
            </div>
            <div className="tier-cta">
              <Link to="/pass" className={`btn btn-block ${p.highlight ? 'btn-primary' : 'btn-ghost'}`}>See details</Link>
            </div>
          </div>
        ))}
      </div>

      <p className="pr-fine">
        Prices are one-time and include every future formula and mock added to that product. Read the{' '}
        <Link to="/the-exam" className="link-btn">exam</Link> and{' '}
        <Link to="/scoring" className="link-btn">scoring</Link> pages before you buy.
      </p>
    </div>
  );
}
