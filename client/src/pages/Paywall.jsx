import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Seo from '../components/Seo.jsx';
import { CATALOG } from '../lib/catalog.js';
import './reference.css';
import './pricing.css';

// Unlock — the product catalog. One-time purchases, 45 days, no auto-renewal.
// While the launch is free, everything is open and the cards link to the content
// instead of a checkout.
const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadCheckout() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = CHECKOUT_SRC;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load the payment window. Check your connection.'));
    document.body.appendChild(s);
    return undefined;
  });
}

export default function Paywall() {
  const { user, caps = [], launchFree, refresh } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const owns = (p) => p.caps.every((c) => caps.includes(c));

  async function buy(p) {
    setError('');
    if (!user) { navigate('/sign-in'); return; }
    setBusy(p.id);
    try {
      const order = await api.createOrder(p.id);
      await loadCheckout();
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: 'High Court Clerk CPT',
        description: `${p.label} · 45 days`,
        handler: async () => { await refresh(); navigate('/pass/status?state=success'); },
        modal: { ondismiss: () => setBusy('') },
        theme: { color: '#0D2846' },
      });
      rzp.on('payment.failed', () => navigate('/pass/status?state=failure'));
      rzp.open();
    } catch (e) { setError(e.message); setBusy(''); }
  }

  return (
    <div className="page">
      <Seo pathname="/pass" />
      <div className="ref-header">
        <h1 className="page-title">Unlock full practice</h1>
        <p className="page-sub">
          One-time purchases. 45 days of access, no auto-renewal. Pick just the paper you need,
          or take everything.
        </p>
      </div>

      {launchFree && (
        <div className="strip strip-mint" style={{ maxWidth: 1080, margin: '0 auto 22px', borderRadius: 'var(--r-btn)' }}>
          <span className="dot" style={{ background: 'var(--mint)' }}>✓</span>
          Everything below is <strong style={{ margin: '0 4px' }}>free during launch</strong> — no payment needed.
          {!user && <> <Link to="/sign-in" style={{ marginLeft: 6 }}>Create a free account</Link> to keep your progress.</>}
        </div>
      )}

      <div className="tiers">
        {CATALOG.map((p) => {
          const owned = owns(p);
          return (
            <div key={p.id} className={`tier${p.highlight ? ' tier-hi' : ''}`}>
              {p.highlight && <div className="tier-badge">Best value</div>}
              <div className="tier-tag">{p.tag}</div>
              <div className="tier-name">{p.label}</div>
              <div className="tier-price num">₹{p.price}</div>
              <div className="tier-term">45 days · no auto-renewal</div>
              <div className="tier-feats">
                {p.features.map((f) => (
                  <div key={f} className="tier-feat"><span className="price-tick">✓</span><span>{f}</span></div>
                ))}
              </div>
              <div className="tier-cta">
                {launchFree ? (
                  <Link to={p.start} className={`btn btn-block ${p.highlight ? 'btn-primary' : 'btn-ghost'}`}>Free now — open</Link>
                ) : owned ? (
                  <Link to={p.start} className="btn btn-block btn-ghost">Owned ✓ — open</Link>
                ) : (
                  <button type="button" className={`btn btn-block ${p.highlight ? 'btn-primary' : 'btn-ghost'}`} onClick={() => buy(p)} disabled={busy === p.id}>
                    {busy === p.id ? 'Opening payment…' : `Unlock · ₹${p.price}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="strip strip-rose" style={{ maxWidth: 1080, margin: '18px auto 0', borderRadius: 'var(--r-btn)' }}>
          <span className="dot" style={{ background: 'var(--rose)' }}>!</span>{error}
        </div>
      )}
      <p className="fineprint" style={{ textAlign: 'center', marginTop: 20 }}>
        UPI, card or netbanking. No card details are stored. {!user && 'You will sign in first.'}
      </p>
    </div>
  );
}
