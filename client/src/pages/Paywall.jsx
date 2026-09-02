import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './reference.css';

// Paywall — deck artboard 15. One 420px card, one price, one button.
// No countdown, no struck-through price, no ratings, no photographs.
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
  const { user, hasPass, refresh } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function buy() {
    setError('');
    if (!user) { navigate('/sign-in'); return; }
    setBusy(true);
    try {
      const order = await api.createOrder();
      await loadCheckout();
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: 'High Court Clerk CPT',
        description: '45-day pass',
        handler: async () => { await refresh(); navigate('/pass/status?state=success'); },
        modal: { ondismiss: () => setBusy(false) },
        theme: { color: '#0D2846' },
      });
      rzp.on('payment.failed', () => navigate('/pass/status?state=failure'));
      rzp.open();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="page centre-wrap">
      <div className="card-420">
        <div className="card">
          <div className="price-head">
            <div className="price-amount num">₹119</div>
            <div className="price-term">45 days · no auto-renewal</div>
          </div>
          <Feature>25 Excel mocks · 125 graded questions</Feature>
          <Feature>60 court-English passages</Feature>
          <Feature>Printed-passage exam mode with A4 PDFs</Feature>
          <Feature>Mistake breakdown and key heat map</Feature>
          <div className="price-cta">
            {hasPass ? (
              <Link to="/mocks" className="btn btn-primary btn-block">Your pass is active — start a mock</Link>
            ) : (
              <button className="btn btn-primary btn-block" onClick={buy} disabled={busy}>
                {busy ? 'Opening payment…' : 'Unlock everything · ₹119'}
              </button>
            )}
          </div>
          {error && (
            <div className="strip strip-rose" style={{ borderRadius: 0 }}>
              <span className="dot" style={{ background: 'var(--rose)' }}>!</span>{error}
            </div>
          )}
        </div>
        <p className="fineprint">
          The nearest alternative charges ₹149 for two months and covers only the written English
          paper — not the C.P.T.
        </p>
        <p className="fineprint" style={{ marginTop: 9 }}>
          UPI, card or netbanking. No card details are stored. {!user && 'You will sign in first.'}
        </p>
      </div>
    </div>
  );
}

function Feature({ children }) {
  return (
    <div className="price-feature">
      <span className="price-tick">✓</span>
      <span>{children}</span>
    </div>
  );
}
