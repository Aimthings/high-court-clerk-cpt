import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './rank-predictor.css';

// Clerk Rank Predictor — Phase 0 (input screen, "coming soon" state), built from
// the delivered Daylight design. The form is shown complete but inert; the submit
// carries a "Coming soon" ribbon (same treatment as the ₹169 "Best value" badge)
// until the Commission releases the 2026 answer key and the parser is wired.
const CHIPS = [
  'Exact score with negative marking',
  'Section-wise analysis',
  'Predicted rank + expected cutoff',
];

const CATEGORIES = 'General · EWS · SC · BC-A · BC-B · Ex-serviceman · PwD';

export default function RankPredictor() {
  const { user } = useAuth();
  // "Notify me" funnels to sign-up (members get emailed when it opens).
  const notifyTo = user ? '/mocks' : '/sign-in?next=/rank-predictor';

  return (
    <div className="page rp">
      <div className="rp-col">
        <header className="rp-head">
          <span className="rp-eyebrow">P&amp;H HIGH COURT · S.S.S.C. CLERK</span>
          <h1 className="rp-title">Clerk Rank Predictor · <span className="num">2026</span></h1>
          <p className="rp-sub">
            Upload your official Response-Sheet-cum-Answer-Key PDF — the one with the green ✓ and red ✗
            marks — and get your score, a detailed analysis and a predicted rank.
          </p>
          <p className="rp-sub2">
            This predicts a candidate's rank in the P&amp;H High Court / S.S.S.C. Clerk exam from the
            Commission's official response sheet.
          </p>
        </header>

        <section className="rp-card" aria-label="Rank predictor form (opens soon)">
          <div className="rp-sechead">
            <span className="rp-kicker">Your response sheet</span>
            <span className="rp-kicker-note">Response-Sheet-cum-Answer-Key</span>
          </div>
          <p className="rp-hint">
            The Commission's sheet already shows the correct answer next to each of your responses —
            that one file is everything we need.
          </p>

          <div className="rp-dropzone" aria-disabled="true">
            <span className="rp-drop-ico">⭱</span>
            <div className="rp-drop-title">Upload the response-sheet PDF</div>
            <div className="rp-drop-sub">Drag &amp; drop it here, or <span className="rp-strong">browse your files</span></div>
          </div>

          <div className="rp-divider"><span /><em>or paste its link</em><span /></div>

          <div className="rp-field" aria-disabled="true">
            <span className="rp-field-ico">🔗</span>
            <span className="rp-field-ph mono">Paste your response-sheet link</span>
          </div>

          <div className="rp-cathead">
            <span className="rp-kicker">Your category</span>
            <span className="rp-req" title="Required">*</span>
            <span className="rp-cat-note">Required · you choose it — it isn't read from the PDF</span>
          </div>
          <div className="rp-field rp-select" aria-disabled="true">
            <span className="rp-field-ph">Select your category</span>
            <span className="rp-cat-opts">{CATEGORIES}</span>
            <span className="rp-caret">▾</span>
          </div>

          <label className="rp-consent">
            <span className="rp-check" aria-hidden="true" />
            <span>I understand this is a prediction, not the official result.</span>
          </label>

          <div className="rp-trust">
            <span className="rp-lock" aria-hidden="true">🔒</span>
            <span>Your PDF is read securely to compute your score; we never show your name or roll number to anyone.</span>
          </div>

          <div className="rp-cta-wrap">
            <span className="rp-ribbon">Coming soon</span>
            <div className="rp-cta" aria-disabled="true">Predict my rank</div>
          </div>
          <p className="rp-opens">
            Opens when the Commission releases the 2026 answer key — we'll switch it on the same day.
          </p>
          <div className="rp-notify">
            <Link to={notifyTo} className="rp-notify-link">
              {user ? "You're signed in — we'll email you when it opens" : 'Notify me when it opens'}
            </Link>
          </div>
        </section>

        <div className="rp-chips">
          {CHIPS.map((label) => (
            <div className="rp-chip" key={label}>
              <span className="rp-chip-glyph">✓</span>
              <span className="rp-chip-label">{label}</span>
            </div>
          ))}
        </div>

        <p className="rp-disclaimer">
          Predicted rank only — not the official result. Not affiliated with the High Court or the Commission.
        </p>
      </div>
    </div>
  );
}
