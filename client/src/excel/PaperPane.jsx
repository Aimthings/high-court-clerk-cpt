// Left pane — the printed question paper, set in a SERIF face on warm white so
// it reads as a photocopied exam sheet (deck artboard 20). A satisfied part gets
// a mint tick in the margin (completion, NOT correctness); nothing marks a part
// wrong while the clock runs. Marks appear only after submit.
export default function PaperPane({ spec, attempted, result }) {
  return (
    <div className="paper-pane">
      <div className="exam-sheet">
        <div className="exam-title">PRACTICAL EXERCISE</div>
        <p className="exam-scenario">{spec.scenario}</p>

        {spec.tables.map((t) => (
          <div className="exam-table-wrap" key={t.index}>
            <div className="exam-table-name">Table {t.index}. {t.name}</div>
            <div className="exam-table-scroll">
              <table className="exam-table">
                <thead><tr>{t.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody><tr>{t.values.map((v, i) => <td key={i}>{v}</td>)}</tr></tbody>
              </table>
            </div>
          </div>
        ))}

        <ol className="exam-parts">
          {spec.parts.map((p) => {
            const partResult = result?.parts?.find((rp) => rp.ref === p.ref);
            const tick = attempted?.[p.ref];
            return (
              <li className="exam-part" key={p.ref}>
                <span className="exam-tick">{tick && !result ? '✓' : ''}</span>
                <span className="exam-part-label">{p.label}</span>
                <span className="exam-part-marks">
                  {result
                    ? <b>{partResult ? `${partResult.marks} / ${partResult.max}` : `0 / ${p.marks}`}</b>
                    : <i>[{p.marks} marks]</i>}
                </span>
              </li>
            );
          })}
        </ol>

        {result && (
          <div className={`exam-summary ${result.passed ? 'exam-pass' : 'exam-fail'}`}>
            {result.passed ? '✓' : '✕'} {result.marks} / {result.totalMarks} —{' '}
            {result.passed ? 'qualified' : `short by ${result.passMarks - result.marks}`}
          </div>
        )}

        <div className="exam-footnote">
          Practice material built from the official S.S.S.C. C.P.T. criteria. Save the workbook as{' '}
          <b>{spec.saveAs}</b>. Chart: {spec.chart.chartType} · title “{spec.chart.title}” · x-axis “
          {spec.chart.categoryAxis}” · y-axis “{spec.chart.valueAxis}”.
        </div>
      </div>
    </div>
  );
}
