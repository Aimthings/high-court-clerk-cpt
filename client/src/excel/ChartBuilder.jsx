import { useState } from 'react';
import { expandRange, parseRef, numToCol } from './evaluate.js';

const CHART_TYPES = [
  'Column', 'Clustered Column', '3-D Column', 'Bar', 'Clustered Bar', '3-D Bar', 'Line', 'Line with Markers',
];

// Modal to place/edit an embedded chart. The candidate fills in the title and
// axis titles from the printed paper and points at the source range; grading
// checks the type, source range (data only), titles and that it is embedded.
export default function ChartBuilder({ initial, cells, onSave, onClose }) {
  const [chartType, setChartType] = useState(initial?.chartType || 'Column');
  const [title, setTitle] = useState(initial?.title || '');
  const [categoryAxis, setCategoryAxis] = useState(initial?.categoryAxis || '');
  const [valueAxis, setValueAxis] = useState(initial?.valueAxis || '');
  const [sourceRange, setSourceRange] = useState(initial?.sourceRange || '');

  function save() {
    const data = buildChartData(cells, sourceRange);
    onSave({
      present: true, chartType, title, categoryAxis, valueAxis,
      sourceRange: sourceRange.toUpperCase(), placement: 'embedded', data,
    });
  }

  return (
    <div className="chart-modal-overlay" role="dialog" aria-label="Insert chart">
      <div className="chart-modal card">
        <div className="card-pad">
          <div className="card-h">Insert chart (embedded object)</div>
          <p className="card-meta">Fill in the title and axis titles exactly as the paper states.</p>

          <label className="cb-field"><span className="field-label">Chart type</span>
            <select className="input" value={chartType} onChange={(e) => setChartType(e.target.value)}>
              {CHART_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="cb-field"><span className="field-label">Source range (e.g. A11:G12)</span>
            <input className="input mono" value={sourceRange} onChange={(e) => setSourceRange(e.target.value)} placeholder="A11:G12" />
          </label>
          <label className="cb-field"><span className="field-label">Chart title</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="cb-field"><span className="field-label">Category (x) axis title</span>
            <input className="input" value={categoryAxis} onChange={(e) => setCategoryAxis(e.target.value)} />
          </label>
          <label className="cb-field"><span className="field-label">Value (y) axis title</span>
            <input className="input" value={valueAxis} onChange={(e) => setValueAxis(e.target.value)} />
          </label>

          <div className="cb-actions">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Place chart</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Build [{k,v}] from the source range: top row = category labels, next row = values.
function buildChartData(cells, sourceRange) {
  const m = /^([A-Z]+\d+):([A-Z]+\d+)$/i.exec((sourceRange || '').trim().toUpperCase());
  if (!m) return [];
  const refs = expandRange(m[1], m[2]);
  if (!refs.length) return [];
  const rows = refs.map((r) => parseRef(r).row);
  const top = Math.min(...rows);
  const labelRow = refs.filter((r) => parseRef(r).row === top);
  const valueRow = refs.filter((r) => parseRef(r).row === top + 1);
  return labelRow.map((lref, i) => {
    const vref = valueRow[i];
    const k = cells[lref] ?? numToCol(parseRef(lref).col);
    const v = Number(cells[vref]) || 0;
    return { k: String(k), v };
  });
}
