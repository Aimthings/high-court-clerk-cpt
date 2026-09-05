import { Link } from 'react-router-dom';
import './reference.css';
import { Row2, Strip, InfoStrip } from './refparts.jsx';

// The exam — deck artboard 26. Scoring is LINKED, never restated.
export default function TheExam() {
  return (
    <div className="page">
      <div className="ref-header">
        <h1 className="page-title">The Computer Proficiency Test</h1>
        <p className="page-sub">
          Punjab &amp; Haryana High Court · Clerk recruitment · qualifying stage after the written paper
        </p>
      </div>

      <div className="split-ref">
        <div className="ref-main stack">
          <div className="card">
            <div className="card-block-head">
              <div className="card-h">What the test is</div>
              <p className="policy-body" style={{ marginTop: 8 }}>
                A twenty-minute practical test sat on a desktop machine in a designated centre. Two
                papers, taken one after the other in the same session. Both are qualifying: you clear
                them or you do not, and the marks are not added to the written score.
              </p>
            </div>
            <Row2 ico="▦" head="Papers" val="Two · Excel and English typing" />
            <Row2 ico="◔" head="Duration" val="10 + 10 minutes" />
            <Row2 ico="✓" head="Typing bar" val={<span className="v-mint">30 w.p.m.</span>} />
            <Row2 ico="✓" head="Excel bar" val={<span className="v-mint">4 marks out of 10</span>} />
            <Row2 ico="⚑" head="Effect on merit" val="Qualifying only" />
            <div className="strip strip-neutral" style={{ justifyContent: 'space-between' }}>
              <span>The two formulas and the mistake classes are set out on one page.</span>
              <Link to="/scoring" className="link-btn">How scoring works</Link>
            </div>
          </div>

          <div className="card">
            <div className="card-block-head">
              <div className="card-h">On the day</div>
              <div className="card-meta">What the centre provides, and what you bring.</div>
            </div>
            <OnDay n="01" head="The passage is handed out on paper"
              sub="You read from the sheet, not from the screen. Exam mode here does the same." />
            <OnDay n="02" head="The machine and the software are the centre's"
              sub="A standard QWERTY keyboard and a licensed copy of MS Office. Nothing is installed by you." />
            <OnDay n="03" head="Carry the admit card and one photo ID"
              sub="Phones, notes and calculators stay outside the hall." />
            <Strip tone="neutral">
              <span className="v-rose" style={{ fontWeight: 600 }}>
                Reporting time is an hour before the slot. Late entry is not permitted once a session
                has started.
              </span>
            </Strip>
          </div>
        </div>

        <aside className="ref-rail stack">
          <div className="card">
            <div className="card-block-head">
              <div className="card-h">Dates for this cycle</div>
              <div className="card-meta">As published in the recruitment notice.</div>
            </div>
            <DateRow label="C.P.T. admit card" pill="Awaited" tone="amber" />
            <DateRow label="C.P.T. window" pill="Not declared" tone="blue" />
            <Strip tone="neutral">
              Dates are copied from the notice on the day it is published, with the date of copying
              shown below.
            </Strip>
          </div>

          <div className="card">
            <div className="card-simple-head">Not stated in the notice</div>
            <p className="policy-body" style={{ padding: '0 16px 14px', marginTop: 0 }}>
              Whether backspace is disabled, the Excel version installed at the centre, and whether the
              two papers may be attempted in either order.
            </p>
            <InfoStrip tone="amber">
              This platform allows backspace and practises on Excel 2019 functions.
            </InfoStrip>
          </div>

          <div className="card">
            <div className="card-pad">
              <div className="card-h" style={{ fontSize: 13.5 }}>Sit one under exam conditions</div>
              <p className="card-meta" style={{ marginTop: 6 }}>
                Printed passage, ten minutes, no live counter. The first mock is free.
              </p>
              <Link to="/mocks" className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
                Take a free mock
              </Link>
            </div>
          </div>
          <p className="fineprint">
            Read the official notice for the final rules. High Court Clerk CPT is not affiliated with
            the Court or the Commission.
          </p>
        </aside>
      </div>
    </div>
  );
}

function OnDay({ n, head, sub }) {
  return (
    <div className="row-2" style={{ alignItems: 'flex-start' }}>
      <span className="ico mono" style={{ fontWeight: 800, fontSize: 15 }}>{n}</span>
      <span className="r2-text">
        <span className="r2-head" style={{ fontSize: 15 }}>{head}</span>
        <span className="r2-sub" style={{ fontSize: 12.5 }}>{sub}</span>
      </span>
    </div>
  );
}

function DateRow({ label, pill, tone }) {
  return (
    <div className="row-1">
      <span className="r1-label">{label}</span>
      <span className={`date-pill pill-${tone}`}>{pill}</span>
    </div>
  );
}
