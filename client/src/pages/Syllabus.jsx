import { Link } from 'react-router-dom';
import './reference.css';
import { Row1, Row2, Strip, InfoStrip } from './refparts.jsx';

// Syllabus — deck artboard 22. Ambiguity is printed, not smoothed over.
export default function Syllabus() {
  return (
    <div className="page">
      <div className="ref-header">
        <h1 className="page-title">What the C.P.T. tests</h1>
        <p className="page-sub">
          Both papers are qualifying · 10 minutes each · marks do not enter the merit list
        </p>
      </div>

      <div className="split-ref">
        <div className="ref-main stack">
          <div className="card">
            <div className="card-head">
              <span className="card-badge badge-xl">XL</span>
              <span className="card-head-text">
                <span className="card-h">Part I — MS Excel</span>
                <span className="card-meta">5 questions · 2 marks each · pass at 4/10</span>
              </span>
              <span className="card-head-chip">125 graded questions</span>
            </div>
            <Row2 ico="▦" head="Formulas and functions" sub="SUM, AVERAGE, MAX, MIN, COUNT, IF" chip="18 mocks" />
            <Row2 ico="⚑" head="Absolute and relative references" sub="Fill down without moving the rate cell" chip="⚡ Most missed" chipClass="pill-flame" />
            <Row2 ico="Aa" head="Formatting" sub="Currency, dates, column width, wrap text" chip="14 mocks" />
            <Row2 ico="⇄" head="Sorting and filtering" sub="Single and multi-column sorts" chip="11 mocks" />
            <Row2 ico="▤" head="Printing and page setup" sub="Print area, orientation, fit to one page" chip="4 mocks" chipClass="pill-amber" />
            <Strip tone="blue">Workbooks are Excel 2007 compatible, as the notice requires.</Strip>
          </div>

          <div className="card">
            <div className="card-head">
              <span className="card-badge badge-key">⌨</span>
              <span className="card-head-text">
                <span className="card-h">Part II — English typing</span>
                <span className="card-meta">10 minutes · printed passage · 30 W.P.M. to pass</span>
              </span>
              <span className="card-head-chip">60 passages</span>
            </div>
            <Row2 ico="▦" head="How the score is computed" sub="(words typed − mistakes) ÷ 10" val={<span className="mono">30.0</span>} />
            <Row2 ico="Aa" head="Passage material" sub="Judgment extracts, bail orders, cause lists, notices" chip="All tiers" />
            <Row2 ico=";" head="What counts as a mistake" sub="Capitalisation, punctuation, transposition, spacing" chip="Notice is silent" chipClass="pill-amber" />
            <Strip tone="mint">The passage is handed out on paper. Practice in exam mode does the same.</Strip>
          </div>
        </div>

        <aside className="ref-rail stack">
          <div className="card">
            <div className="card-simple-head">What the notice does not say</div>
            <div className="policy" style={{ paddingTop: 11, paddingBottom: 11 }}>
              <p className="policy-body" style={{ marginTop: 0 }}>
                Whether a mistake is counted per word or per character. We show the stricter model, so
                your practice score is never flattering.
              </p>
            </div>
            <div className="policy" style={{ paddingTop: 11, paddingBottom: 11 }}>
              <p className="policy-body" style={{ marginTop: 0 }}>
                Which Excel version the centre installs. Every workbook here opens in 2007 and later.
              </p>
            </div>
            <div className="policy" style={{ paddingTop: 11, paddingBottom: 11 }}>
              <p className="policy-body" style={{ marginTop: 0 }}>
                Whether the two papers run back to back. Exam mode lets you run them either way.
              </p>
            </div>
            <InfoStrip tone="amber">Read the official notice before you rely on any of this</InfoStrip>
          </div>

          <div className="card">
            <div className="card-simple-head">On the day</div>
            <Row1 label="Duration per paper" val={<span className="mono">10:00</span>} />
            <Row1 label="Excel pass mark" val={<span className="num">4 / 10</span>} />
            <Row1 label="Typing pass mark" val={<span className="num">30 W.P.M.</span>} />
            <Row1 label="Counts toward merit" val={<span className="v-rose">No</span>} />
          </div>

          <Link to="/mocks" className="btn btn-primary btn-block">Take a free mock</Link>
        </aside>
      </div>
    </div>
  );
}
