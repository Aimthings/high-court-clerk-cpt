import { useMemo } from 'react';
import { computeValues, parseRef, numToCol } from '../excel/evaluate.js';

// A small read-only spreadsheet for a formula lesson: the given data cells are
// fixed; the task cell shows the LIVE result of the candidate's formula (blue
// ring), computed with the same engine the server grades with.
export default function MiniSheet({ data, taskCell, formula }) {
  const cells = useMemo(() => ({ ...data, [taskCell]: formula || '' }), [data, taskCell, formula]);
  const values = useMemo(() => computeValues(cells), [cells]);

  const refs = [...Object.keys(data), taskCell].map(parseRef).filter(Boolean);
  const maxCol = Math.max(1, ...refs.map((r) => r.col));
  const maxRow = Math.max(1, ...refs.map((r) => r.row));
  const cols = Array.from({ length: maxCol }, (_, i) => numToCol(i + 1));
  const rows = Array.from({ length: maxRow }, (_, i) => i + 1);

  return (
    <div className="ms-scroll">
      <table className="ms-grid">
        <thead>
          <tr>
            <th className="ms-corner" />
            {cols.map((c) => <th key={c} className="ms-colhead">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <th className="ms-rowhead mono">{r}</th>
              {cols.map((c) => {
                const ref = `${c}${r}`;
                const isTask = ref === taskCell;
                const raw = data[ref];
                const v = values[ref];
                const display = isTask
                  ? (formula ? fmt(v) : '')
                  : (raw == null || raw === '' ? '' : fmt(v));
                const numeric = typeof v === 'number';
                return (
                  <td key={ref} className={`ms-cell ${isTask ? 'ms-task' : raw != null && raw !== '' ? 'ms-data' : ''} ${numeric ? 'ms-num' : ''}`}>
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function fmt(v) {
  if (v === '#ERROR') return '#ERROR';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v ?? '');
}
