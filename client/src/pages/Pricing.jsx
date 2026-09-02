import { Link } from 'react-router-dom';
import './reference.css';
import { Row1, InfoStrip } from './refparts.jsx';

// Pricing — deck artboard 23. One price, one button, no struck-through price,
// no countdown. Free and Pass compared in one table.
export default function Pricing() {
  return (
    <div className="page">
      <div className="ref-header">
        <h1 className="page-title">₹99 for 45 days</h1>
        <p className="page-sub">
          Both papers · no auto-renewal · the first mock is free and needs no sign-up
        </p>
      </div>

      <div className="split-ref">
        <div className="ref-main stack">
          <div className="card">
            <div className="compare-head">
              <span className="c-what">What you get</span>
              <span className="c-col c-free">Free</span>
              <span className="c-col c-pass">Pass · ₹99</span>
            </div>
            <Compare what="Excel mocks" free="1 of 25" pass="25" />
            <Compare what="Court-English passages" free="2 of 60" pass="60" />
            <Compare what="Graded Excel questions" free="5" pass="125" />
            <Compare what="Printed-passage exam mode" free="—" pass="Included" />
            <Compare what="Mistake breakdown and key heat map" free="Summary only" pass="Full" />
            <Compare what="Rank list eligibility" free="Read only" pass="Ranked" />
            <Compare what="A4 passage PDFs" free="—" pass="Included" />
            <div className="strip strip-blue">
              A pass covers both papers. There is no separate price for Part I or Part II.
            </div>
          </div>

          <div>
            <h2 className="section-label" style={{ marginBottom: 14 }}>Payment and refunds</h2>
            <div className="card">
              <div className="card-block-head">
                <div className="card-h">UPI, card or netbanking</div>
                <div className="card-meta">
                  Handled by the payment gateway. No card details are stored by this platform.
                </div>
              </div>
              <Row1 label="Full refund window" val={<span className="v-mint num">48 hours</span>} />
              <Row1 label="Refund credited in" val={<span className="num">5 to 7 working days</span>} />
              <Row1 label="Refund condition" val={<span className="num">Fewer than 3 mocks attempted</span>} />
              <Row1 label="Auto-renewal" val="None" />
              <InfoStrip tone="amber">
                Write to help@highcourtclerkcpt.in with the payment reference to start a refund.
              </InfoStrip>
            </div>
          </div>
        </div>

        <aside className="ref-rail stack">
          <div className="card">
            <div className="price-head">
              <div className="price-amount num">₹99</div>
              <div className="price-term">45 days · no auto-renewal</div>
            </div>
            <PriceFeature>Both papers, all 85 sets</PriceFeature>
            <PriceFeature>Exam mode with printed passages</PriceFeature>
            <PriceFeature>Rank list eligibility</PriceFeature>
            <PriceFeature>Mistake breakdown per attempt</PriceFeature>
            <div className="price-cta" style={{ textAlign: 'center' }}>
              <Link to="/pass" className="btn btn-primary btn-block">Buy the pass</Link>
              <Link to="/mocks" className="link-btn" style={{ display: 'inline-block', marginTop: 10 }}>
                Or take the free mock first
              </Link>
            </div>
          </div>
          <p className="fineprint">
            Practice material is built from the published C.P.T. criteria. Marks here do not count
            toward the final merit list.
          </p>
          <div className="card">
            <div className="card-simple-head">Bought a pass on another number?</div>
            <p className="policy-body" style={{ padding: '0 16px 14px', marginTop: 0 }}>
              A pass is tied to the phone number that paid. Sign in with that number to use it.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Compare({ what, free, pass }) {
  return (
    <div className="compare-row">
      <span className="c-what">{what}</span>
      <span className="c-free num">{free}</span>
      <span className="c-pass num">{pass}</span>
    </div>
  );
}
function PriceFeature({ children }) {
  return (
    <div className="price-feature">
      <span className="price-tick">✓</span>
      <span>{children}</span>
    </div>
  );
}
