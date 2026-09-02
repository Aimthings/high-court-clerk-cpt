import './reference.css';
import { Row2 } from './refparts.jsx';

// How scoring works — deck artboard 24. The SINGLE source for both formulas.
// Typing formula = (words typed - mistakes) / minutes; this is the S.S.S.C. rule,
// deliberately not conventional gross/net WPM.
export default function Scoring() {
  return (
    <div className="page">
      <div className="ref-header">
        <h1 className="page-title">Two papers, two formulas</h1>
        <p className="page-sub">
          Both qualifying · 10 minutes each · marks do not enter the merit list
        </p>
      </div>

      <div className="split-ref">
        <div className="ref-main stack">
          <div className="card">
            <div className="card-head">
              <span className="card-badge badge-key">⌨</span>
              <span className="card-head-text">
                <span className="card-h">Part II — English typing</span>
                <span className="card-meta">Printed passage · 10 minutes · 30 w.p.m. required</span>
              </span>
            </div>
            <div className="formula formula-mint">( words typed − mistakes ) ÷ 10</div>
            <Row2 ico="▦" head="Words typed in ten minutes" val={<span className="num">552</span>} />
            <Row2 ico="✕" head="Mistakes counted" val={<span className="v-rose num">41</span>} />
            <Row2 ico="◔" head="Net words" val={<span className="num">511</span>} />
            <Row2 ico="✓" head="Speed" val={<span className="v-mint num">51.1 w.p.m.</span>} />
            <div className="strip strip-neutral">
              A word is five characters including spaces, counted from the typed text and not the
              printed passage.
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <span className="card-badge badge-xl">XL</span>
              <span className="card-head-text">
                <span className="card-h">Part I — MS Excel</span>
                <span className="card-meta">5 questions · 2 marks each · 10 minutes</span>
              </span>
            </div>
            <div className="formula formula-blue">marks out of 10 · pass at 4</div>
            <Row2 ico="▦" head="Marks per question" val={<span className="num">2</span>} />
            <Row2 ico="✓" head="Partial marks" val="Not awarded" />
            <Row2 ico="✕" head="Wrong answer" val="0, no negative marking" />
            <div className="strip strip-neutral">
              The workbook is opened outside the browser. Only the answer to each question is submitted.
            </div>
          </div>
        </div>

        <aside className="ref-rail stack">
          <div className="card">
            <div className="card-block-head">
              <div className="card-h">What counts as a mistake</div>
              <div className="card-meta">The same five classes the result screen reports.</div>
            </div>
            <MistakeClass head="Capitalisation" sub="A capital where the passage has none, or the reverse" />
            <MistakeClass head="Punctuation" sub="A missing, extra or substituted mark" />
            <MistakeClass head="Transposition" sub="Two characters typed in the wrong order" />
            <MistakeClass head="Spacing" sub="A missing space, or two where one is printed" />
            <MistakeClass head="Omission" sub="A word or line skipped" />
            <div className="strip strip-flame">One mistake is counted once, even if it repeats through a line.</div>
          </div>

          <div className="card">
            <div className="card-simple-head">What the notice does not state</div>
            <p className="policy-body" style={{ padding: '0 16px 14px', marginTop: 0 }}>
              Whether backspace is disabled, and whether the passage is handed out before the clock
              starts. This platform allows backspace and starts the clock on your press.
            </p>
          </div>
          <p className="fineprint">
            Read the official notice for the final rules. Where it is silent, this page states what
            the platform does.
          </p>
        </aside>
      </div>
    </div>
  );
}

function MistakeClass({ head, sub }) {
  return (
    <div className="policy" style={{ padding: '12px 16px' }}>
      <div className="policy-h" style={{ fontSize: 13 }}>{head}</div>
      <div className="policy-body" style={{ marginTop: 4, fontSize: 12 }}>{sub}</div>
    </div>
  );
}
