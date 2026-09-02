import { Link, useSearchParams } from 'react-router-dom';
import './reference.css';
import { Row1, InfoStrip } from './refparts.jsx';

// Payment status — deck artboard 21. Success and failure share the paywall card
// with a tinted header strip. No confetti; failure never blames the candidate.
export default function PaymentStatus() {
  const [params] = useSearchParams();
  const state = params.get('state') === 'success' ? 'success' : 'failure';
  // Phase 4: derive the real state from /api/orders + webhook reconciliation.
  return (
    <div className="page centre-wrap">
      <div className="card-420">
        {state === 'success' ? <Success /> : <Failure />}
      </div>
    </div>
  );
}

function Success() {
  return (
    <div className="card">
      <div className="pay-banner pay-banner-mint">
        <div className="pay-icon" style={{ background: 'var(--mint)' }}>✓</div>
        <div className="pay-title v-mint">Payment received</div>
        <div className="pay-sub">Everything is unlocked now</div>
      </div>
      <Row1 label="Amount paid" val={<span className="num">₹119</span>} />
      <Row1 label="Method" val="UPI · 1 Sep, 8:52 pm" />
      <Row1 label="Pass ends" val="16 Oct 2026" />
      <Row1 label="Reference" val={<span className="mono">RG-4471-2280</span>} />
      <div className="price-cta" style={{ textAlign: 'center' }}>
        <Link to="/mocks" className="btn btn-primary btn-block">Start Mock 02 now</Link>
        <button className="link-btn" style={{ marginTop: 10 }}>Download the receipt</button>
      </div>
    </div>
  );
}

function Failure() {
  return (
    <div className="card">
      <div className="pay-banner pay-banner-rose">
        <div className="pay-icon" style={{ background: 'var(--rose)' }}>✕</div>
        <div className="pay-title v-rose">The payment did not go through</div>
        <div className="pay-sub">Your bank declined the request. Nothing was charged.</div>
      </div>
      <Row1 label="Amount attempted" val={<span className="num">₹119</span>} />
      <Row1 label="Reason given" val={<span className="v-rose">Declined by bank</span>} />
      <Row1 label="Attempted" val="1 Sep, 8:49 pm" />
      <Row1 label="Reference" val={<span className="mono">RG-4471-2279</span>} />
      <div className="price-cta" style={{ textAlign: 'center' }}>
        <Link to="/pass" className="btn btn-primary btn-block">Try again · ₹119</Link>
        <button className="link-btn" style={{ marginTop: 10 }}>Pay with UPI instead</button>
      </div>
      <InfoStrip tone="amber">
        If money left your account, it returns within 5 working days.
      </InfoStrip>
    </div>
  );
}
