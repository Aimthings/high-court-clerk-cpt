import './reference.css';
import { Row1, Strip, InfoStrip } from './refparts.jsx';

// Contact & policies — deck artboard 25. Policies + one email contact route.
export default function Contact() {
  return (
    <div className="page">
      <div className="ref-header">
        <h1 className="page-title">Contact and policies</h1>
        <p className="page-sub">
          Write to info@highcourtexam.online · replies on working days between 10 a.m. and 6 p.m.
        </p>
      </div>

      <div className="split-ref">
        <div className="ref-main">
          <div className="card">
            <div className="policy">
              <div className="policy-h">Refund policy</div>
              <div className="policy-sum">
                Full refund within 48 hours of payment if fewer than three mocks have been attempted.
              </div>
              <p className="policy-body">
                Write to info@highcourtexam.online with the payment reference. Refunds are credited to
                the paying instrument in 5 to 7 working days. A pass that has been used for three or
                more mocks is not refundable.
              </p>
            </div>
            <div className="policy">
              <div className="policy-h">Terms of use</div>
              <div className="policy-sum">One pass, one account, one candidate.</div>
              <p className="policy-body">
                A pass is tied to the account that paid and may not be shared. High Court Clerk CPT is
                an independent practice platform and is not affiliated with, endorsed by, or connected
                to the Punjab &amp; Haryana High Court or the Subordinate Services Selection Commission
                (S.S.S.C.). All practice material is built from the publicly published C.P.T. criteria;
                it is not real exam content, and marks here do not count toward the official merit list.
              </p>
            </div>
            <div className="policy">
              <div className="policy-h">Privacy</div>
              <div className="policy-sum">
                Email, handle, attempts and payment references. Nothing else.
              </div>
              <p className="policy-body">
                We collect only your email, the handle you choose, your practice attempts and payment
                references — no phone number, address or documents. Your email is used solely to sign
                you in and send your verification code. We never sell, rent or share it with any third
                party, and it is never shown on the public rank list. Your handle and score appear on
                the board only while board visibility is on in Account; turning it off removes your row
                within a minute. Attempt data is kept for the recruitment cycle and then deleted.
              </p>
            </div>
            <div className="policy">
              <div className="policy-h">Data security</div>
              <div className="policy-sum">Passwords are hashed. Payments run on the gateway.</div>
              <p className="policy-body">
                Passwords are stored only as salted one-way hashes — never in plain text — so no one at
                High Court Clerk CPT can read your password. Payments are processed entirely by the
                payment gateway over an encrypted connection; we never see or store your card, UPI or
                bank details. The site is served over HTTPS end to end.
              </p>
            </div>
            <Strip tone="neutral">
              Last updated 1 September 2026. Changes are announced on this page before they take effect.
            </Strip>
          </div>
        </div>

        <aside className="ref-rail stack">
          <div className="card">
            <div className="card-block-head">
              <div className="card-h">Reach us</div>
              <div className="card-meta">One address for everything. There is no phone queue.</div>
            </div>
            <Row1 label="Email" val="info@highcourtexam.online" />
            <Strip tone="blue">Include the mock name in your email. It halves the reply time.</Strip>
          </div>

          <div className="card">
            <div className="card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-h" style={{ fontSize: 13.5 }}>Found a wrong answer key?</span>
              <a href="mailto:info@highcourtexam.online" className="link-btn">Report it</a>
            </div>
            <p className="policy-body" style={{ padding: '0 16px 14px', marginTop: 0 }}>
              Corrections are checked against the official criteria and published in the mock's notes.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
