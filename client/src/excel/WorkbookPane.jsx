import { numToCol } from './evaluate.js';

// Right pane — the workbook. File bar (filename + Save/Ctrl+S), formula bar
// (name box, fx, formula), and an EMPTY grid. Active cell = 2px blue ring; the
// formula bar and the ring always name the same cell. Dims + locks on submit.
const NCOLS = 15; // A..O
const NROWS = 26;

export default function WorkbookPane({
  cells, values, active, setActive, setCell, filename, setFilename, onSave, saved, locked, chart, onEditChart,
}) {
  const cols = Array.from({ length: NCOLS }, (_, i) => numToCol(i + 1));
  const rows = Array.from({ length: NROWS }, (_, i) => i + 1);
  const activeRaw = cells[active] ?? '';

  function move(dr, dc) {
    const m = /^([A-Z]+)(\d+)$/.exec(active);
    const col = Math.max(1, Math.min(NCOLS, colNum(m[1]) + dc));
    const row = Math.max(1, Math.min(NROWS, Number(m[2]) + dr));
    setActive(`${numToCol(col)}${row}`);
  }

  return (
    <div className={`wb-pane ${locked ? 'wb-locked' : ''}`}>
      {/* file bar */}
      <div className="wb-filebar">
        <span className="wb-file-label">File</span>
        <span className="wb-filename">
          <input
            className="wb-filename-input mono"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            disabled={locked}
            aria-label="Workbook filename"
            spellCheck={false}
          />
          <span className="wb-pencil">✎</span>
        </span>
        <button className="wb-save" onClick={onSave} disabled={locked}>
          Save <span className="wb-kbd">Ctrl+S</span>
        </button>
        {saved && <span className="wb-saved">Saved</span>}
        <button className="wb-chart-btn" onClick={onEditChart} disabled={locked}>
          {chart?.present ? 'Edit chart' : 'Insert chart'}
        </button>
      </div>

      {/* formula bar */}
      <div className="wb-formulabar">
        <span className="wb-namebox mono">{active}</span>
        <span className="wb-fx">fx</span>
        <input
          className="wb-formula-input mono"
          value={activeRaw}
          onChange={(e) => setCell(active, e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); move(1, 0); } }}
          disabled={locked}
          aria-label={`Formula for ${active}`}
          spellCheck={false}
        />
      </div>

      {/* grid (scrolls inside its own container) */}
      <div className="wb-grid-scroll">
        <table className="wb-grid">
          <thead>
            <tr>
              <th className="wb-corner" />
              {cols.map((c) => <th key={c} className="wb-colhead">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r}>
                <th className="wb-rowhead mono">{r}</th>
                {cols.map((c) => {
                  const ref = `${c}${r}`;
                  const isActive = ref === active;
                  const raw = cells[ref];
                  const val = values[ref];
                  const display = isActive ? undefined : (raw == null || raw === '' ? '' : (typeof val === 'number' ? formatNum(val) : (String(raw).startsWith('=') ? val : raw)));
                  return (
                    <td
                      key={ref}
                      className={`wb-cell ${isActive ? 'wb-active' : ''}`}
                      onClick={() => !locked && setActive(ref)}
                    >
                      {isActive && !locked ? (
                        <input
                          className="wb-cell-input mono"
                          value={raw ?? ''}
                          autoFocus
                          onChange={(e) => setCell(ref, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); move(1, 0); }
                            else if (e.key === 'Tab') { e.preventDefault(); move(0, 1); }
                          }}
                          spellCheck={false}
                        />
                      ) : (
                        <span className="wb-cell-val mono">{display}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* embedded chart floats over the grid */}
        {chart?.present && <EmbeddedChart chart={chart} values={values} spec={chart._spec} />}
      </div>

      {locked && <div className="wb-lock-badge">Submitted · workbook locked</div>}
    </div>
  );
}

function colNum(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}
function formatNum(n) {
  if (typeof n !== 'number') return n;
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

// A CSS-only 3-D-ish column chart of the table's data row (embedded object).
function EmbeddedChart({ chart }) {
  const bars = chart.data && chart.data.length ? chart.data : [];
  const max = Math.max(1, ...bars.map((b) => b.v));
  return (
    <div className="wb-chart">
      <div className="wb-chart-title">{chart.title || 'Chart title'}</div>
      <div className="wb-chart-plot">
        {bars.map((b, i) => (
          <div className="wb-bar-col" key={i}>
            <div className="wb-bar" style={{ height: `${Math.max(4, (b.v / max) * 100)}%` }} />
            <div className="wb-bar-label mono">{b.k}</div>
          </div>
        ))}
      </div>
      <div className="wb-chart-axes">
        <span>{chart.valueAxis}</span><span>{chart.categoryAxis}</span>
      </div>
    </div>
  );
}
