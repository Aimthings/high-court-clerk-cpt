import { Link } from 'react-router-dom';
import './landing.css';

// Landing — deck artboards 16 (above fold) + 17 (lower page).
// Copy rules: no exclamation marks, no claim that practice questions are real.
export default function Landing() {
  return (
    <div className="landing">
      {/* ---------- Above the fold ---------- */}
      <section className="page landing-hero">
        <div className="hero-main">
          <span className="pill pill-blue pill-sans">P&amp;H High Court · S.S.S.C. Clerk C.P.T.</span>
          <h1 className="hero-title">Both C.P.T. papers, practised the way the exam runs them</h1>
          <p className="hero-sub">
            A 10-minute MS Excel test marked out of 10, and a 10-minute English typing test scored as
            (words typed − mistakes) ÷ 10. Ten minutes each, on a clock that does not pause.
          </p>
          <div className="hero-cta">
            <Link to="/mocks" className="btn btn-primary">Take a free mock</Link>
            <span className="hero-cta-note">No sign-up for the first mock · all-access ₹169 for 2 months</span>
          </div>
          <div className="stats hero-stats">
            <Stat n="12,480" k="Candidates ranked" />
            <Stat n="25" k="Excel mocks" />
            <Stat n="60" k="Court-English passages" />
            <Stat n="4 min" k="Since last update" />
          </div>
        </div>

        <aside className="hero-rail">
          <div className="card free-mock">
            <span className="free-mock-chip">Free · no pass needed</span>
            <div className="card-pad free-mock-head">
              <div className="card-h">Mock 01 · Salary sheet</div>
              <div className="card-meta">Tier 1 · 5 questions · 10 minutes</div>
            </div>
            <div className="rows">
              <Row ico="▦" label="Marked out of" val={<span className="num">10</span>} />
              <Row ico="✓" label="Pass mark" val={<span className="v-mint">4, qualifying</span>} />
              <Row ico="◔" label="Clock" val={<span className="mono">10:00</span>} />
            </div>
            <div className="strip strip-amber">
              <span className="dot dot-amber">i</span>
              Start here if this is your first mock
            </div>
          </div>
          <p className="fineprint">
            Practice material built from the official S.S.S.C. C.P.T. criteria. Marks do not count
            toward the final merit list.
          </p>
        </aside>
      </section>

      {/* two paper cards */}
      <section className="page landing-papers">
        <div className="paper-grid">
          <PaperCard
            badge="XL" badgeClass="paper-xl"
            title="Part I — Spreadsheet"
            meta="Excel 2007 compatible · 5 questions"
            val="4 / 10" valK="to pass"
            strip="Formulas, absolute references, formatting, sorting, totals" stripClass="strip-blue"
          />
          <PaperCard
            badge="⌨" badgeClass="paper-key"
            title="Part II — Typing"
            meta="Printed passage · English"
            val="30" valK="W.P.M."
            strip="Scored as (words typed − mistakes) ÷ 10" stripClass="strip-mint"
          />
        </div>
      </section>

      {/* ---------- Lower page ---------- */}
      <section className="page split landing-lower">
        <div className="main">
          <h2 className="section-label">How a run works</h2>
          <div className="card steps">
            <Step n="01" head="Print the passage, or download the workbook"
              sub="The exam hands the passage out on paper. Practice matches that." />
            <Step n="02" head="Press start and type for ten minutes"
              sub="No pause, no word counter, no live error colouring — as in the hall." />
            <Step n="03" head="Read where the mistakes were"
              sub="Capitalisation, punctuation, transposition, spacing, and the slowest keys." />
          </div>

          <div className="lower-rank-head">
            <h2 className="section-label">The public rank list</h2>
            <span className="muted">No login needed · updated 4 min ago</span>
          </div>
          <div className="card rank-teaser">
            <RankRow rank="1" tone="amber" initials="GS" handle="gurpreet.s" region="Punjab · 63 attempts" wpm="54.8" />
            <RankRow rank="2" tone="neutral" initials="NK" handle="neha_kaushik" region="Haryana · 41 attempts" wpm="53.1" />
            <RankRow rank="3" tone="flame" initials="AV" handle="arun_verma" region="Chandigarh · 55 attempts" wpm="51.9" />
            <div className="strip strip-neutral rank-teaser-foot">
              <span>Only exam-mode attempts are ranked</span>
              <Link to="/rank" className="link-btn">See the full board</Link>
            </div>
          </div>
        </div>

        <aside className="rail">
          <h2 className="section-label">Full access</h2>
          <PriceCard />
          <p className="fineprint">
            The first mock needs no sign-up and no payment. UPI, card or netbanking after that.
            No card details are stored.
          </p>
        </aside>
      </section>
    </div>
  );
}

function Stat({ n, k }) {
  return <div className="stat"><div className="n">{n}</div><div className="k">{k}</div></div>;
}
function Row({ ico, label, val }) {
  return (
    <div className="row">
      <span className="ico">{ico}</span>
      <span className="label">{label}</span>
      <span className="val">{val}</span>
    </div>
  );
}
function PaperCard({ badge, badgeClass, title, meta, val, valK, strip, stripClass }) {
  return (
    <div className="card paper-card">
      <div className="paper-card-body">
        <div className={`paper-badge ${badgeClass}`}>{badge}</div>
        <div className="paper-card-text">
          <div className="card-h">{title}</div>
          <div className="card-meta">{meta}</div>
        </div>
        <div className="paper-card-val">
          <div className="paper-val-n num">{val}</div>
          <div className="paper-val-k">{valK}</div>
        </div>
      </div>
      <div className={`strip ${stripClass}`}>{strip}</div>
    </div>
  );
}
function Step({ n, head, sub }) {
  return (
    <div className="step">
      <span className="step-n mono">{n}</span>
      <span className="step-text">
        <span className="step-head">{head}</span>
        <span className="step-sub">{sub}</span>
      </span>
    </div>
  );
}
function RankRow({ rank, tone, initials, handle, region, wpm }) {
  return (
    <div className="rank-row">
      <span className="rank-num-wrap">
        <span className={`pill pill-${tone} rank-num`}>{rank}</span>
      </span>
      <span className={`rank-avatar av-${tone}`}>{initials}</span>
      <span className="rank-id">
        <span className="rank-handle">{handle}</span>
        <span className="rank-region">{region}</span>
      </span>
      <span className="rank-metric">
        <span className="rank-wpm num">{wpm}</span>
        <span className="rank-wpm-k">W.P.M.</span>
      </span>
    </div>
  );
}
export function PriceCard() {
  return (
    <div className="card price-card">
      <div className="price-head">
        <div className="price-amount num">₹169</div>
        <div className="price-term">All-Access · 2 months · no auto-renewal</div>
      </div>
      <ul className="price-features">
        <PriceFeature>Typing Master course + every typing mock</PriceFeature>
        <PriceFeature>Every Excel mock · 125 graded questions</PriceFeature>
        <PriceFeature>Full Formula Library — 37 lessons</PriceFeature>
        <PriceFeature>Exam mode, rank list & mistake breakdown</PriceFeature>
      </ul>
      <div className="price-cta">
        <Link to="/mocks" className="btn btn-primary btn-block">Take a free mock</Link>
      </div>
      <p className="fineprint" style={{ textAlign: 'center', marginTop: 10 }}>
        Or pick a single paper from ₹69 · <Link to="/pricing" className="link-btn">see all plans</Link>
      </p>
    </div>
  );
}
function PriceFeature({ children }) {
  return (
    <li className="price-feature">
      <span className="price-tick">✓</span>
      <span>{children}</span>
    </li>
  );
}
