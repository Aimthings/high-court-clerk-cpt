import { Link } from 'react-router-dom';
import './reference.css';

// Paywall — deck artboard 15. One 420px card, one price, one button.
// No countdown, no struck-through price, no ratings, no photographs.
export default function Paywall() {
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
            {/* Phase 4 wires this to POST /api/orders/create + Razorpay checkout. */}
            <Link to="/pass/status?state=pending" className="btn btn-primary btn-block">
              Unlock everything · ₹119
            </Link>
          </div>
        </div>
        <p className="fineprint">
          The nearest alternative charges ₹149 for two months and covers only the written English
          paper — not the C.P.T.
        </p>
        <p className="fineprint" style={{ marginTop: 9 }}>
          UPI, card or netbanking. No card details are stored.
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
