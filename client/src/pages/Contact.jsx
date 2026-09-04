import './reference.css';
import { Row1, Strip, InfoStrip } from './refparts.jsx';

// Contact & policies — deck artboard 25. Three policies + one contact route.
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
              <div className="policy-sum">One pass, one phone number, one candidate.</div>
              <p className="policy-body">
                A pass is tied to the number that paid and may not be shared. High Court Clerk CPT is
                not affiliated with the Punjab &amp; Haryana High Court or the Subordinate Services
                Selection Commission. Practice material is built from the published C.P.T. criteria and
                marks here do not count toward the final merit list.
              </p>
            </div>
            <div className="policy">
              <div className="policy-h">Privacy</div>
              <div className="policy-sum">
                Phone number, handle, attempts and payment references. Nothing else.
              </div>
              <p className="policy-body">
                Your handle and score appear on the public rank list only while board visibility is on
                in Account. Turning it off removes the row within a minute. Attempt data is kept for the
                recruitment cycle and then deleted.
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
