import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { computeValues } from './evaluate.js';
import Timer from '../components/Timer.jsx';
import { PaneSkeleton } from '../components/Skeletons.jsx';
import PaperPane from './PaperPane.jsx';
import WorkbookPane from './WorkbookPane.jsx';
import ChartBuilder from './ChartBuilder.jsx';
import './excel.css';

// Excel runner — deck artboard 20 and its states. Two panes: printed paper (serif)
// and an empty workbook. Nothing is marked while the clock runs; marks appear only
// after Submit, on the paper pane, and the workbook then locks.
export default function ExcelMock() {
  const { code } = useParams();
  const [phase, setPhase] = useState('loading'); // loading | running | submitting | done | error
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(null); // { attemptId, durationSec, spec }
  const [cells, setCells] = useState({});
  const [active, setActive] = useState('A1');
  const [filename, setFilename] = useState('Book1');
  const [saves, setSaves] = useState([]);
  const [saved, setSaved] = useState(false);
  const [chart, setChart] = useState({ present: false });
  const [showChart, setShowChart] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [result, setResult] = useState(null);

  const endAtRef = useRef(0);
  const totalMsRef = useRef(0);
  const stateRef = useRef({});
  stateRef.current = { cells, filename, saves, chart };

  useEffect(() => {
    let cancelled = false;
    api.startExcel(code).then((a) => {
      if (cancelled) return;
      setAttempt(a);
      totalMsRef.current = a.durationSec * 1000;
      endAtRef.current = Date.now() + a.durationSec * 1000;
      setRemainingMs(a.durationSec * 1000);
      setFilename('Book1');
      setPhase('running');
    }).catch((e) => { if (!cancelled) { setError(e.message); setPhase('error'); } });
    return () => { cancelled = true; };
  }, [code]);

  const submit = useCallback(async () => {
    if (!attempt) return;
    setPhase('submitting');
    try {
      const { cells: c, filename: f, saves: s, chart: ch } = stateRef.current;
      const r = await api.submitExcel(attempt.attemptId, { filename: f, cells: c, saves: s, chart: ch.present ? ch : undefined });
      setResult(r);
      setPhase('done');
    } catch (e) { setError(e.message); setPhase('error'); }
  }, [attempt]);

  useEffect(() => {
    if (phase !== 'running') return undefined;
    const id = setInterval(() => {
      const left = endAtRef.current - Date.now();
      if (left <= 0) { setRemainingMs(0); clearInterval(id); submit(); }
      else setRemainingMs(left);
    }, 250);
    return () => clearInterval(id);
  }, [phase, submit]);

  const values = useMemo(() => computeValues(cells), [cells]);
  const setCell = useCallback((ref, val) => setCells((c) => ({ ...c, [ref]: val })), []);
  const onSave = useCallback(() => {
    setSaves((s) => [...s, { filename: stateRef.current.filename, cells: { ...stateRef.current.cells } }]);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  const attempted = useMemo(
    () => (attempt ? detectAttempted(attempt.spec, cells, filename, saves, chart) : {}),
    [attempt, cells, filename, saves, chart],
  );

  if (phase === 'error') {
    return (
      <div className="xl-screen xl-center">
        <div className="card-420" style={{ textAlign: 'center' }}>
          <h1 className="page-title">Could not start the mock</h1>
          <p className="page-sub" style={{ fontSize: 13, marginTop: 10 }}>{error}</p>
          <Link to="/mocks" className="btn btn-primary" style={{ marginTop: 18 }}>Back to the mocks</Link>
        </div>
      </div>
    );
  }
  if (phase === 'loading' || !attempt) {
    return <div className="xl-screen xl-center"><div style={{ width: 720, maxWidth: '92vw' }}><PaneSkeleton height={420} /></div></div>;
  }

  const spec = attempt.spec;
  const locked = phase === 'done';
  const marksLine = result ? `${result.marks} of ${result.totalMarks} marks · ${result.passed ? 'qualified' : `${result.passMarks} to pass`}` : `0 of ${spec.totalMarks} marks · ${spec.passMarks} to pass`;

  return (
    <div className="xl-screen">
      <header className="xl-header">
        <div className="xl-header-title">{attempt.spec.title} · Spreadsheet practical</div>
        <span className="pill pill-blue pill-sans">Part I · MS Excel</span>
        <span className="xl-header-meta">Practical exercise · 10 marks · 4 to pass · no live marking</span>
      </header>

      <div className="xl-body">
        <PaperPane spec={spec} attempted={attempted} result={result} />
        <WorkbookPane
          cells={cells} values={values} active={active} setActive={setActive} setCell={setCell}
          filename={filename} setFilename={setFilename} onSave={onSave} saved={saved}
          locked={locked} chart={chart} onEditChart={() => setShowChart(true)}
        />
      </div>

      <footer className="xl-status">
        <Timer remainingMs={remainingMs} totalMs={totalMsRef.current} stopped={locked} size={34} />
        <div className="xl-status-marks num">{marksLine}</div>
        {phase === 'done'
          ? <Link to="/mocks" className="btn btn-primary xl-submit">View another mock</Link>
          : <button className="btn btn-primary xl-submit" onClick={submit} disabled={phase === 'submitting'}>
              {phase === 'submitting' ? 'Grading…' : 'Submit'}
            </button>}
      </footer>

      {result && <ResultPanel result={result} />}

      {showChart && (
        <ChartBuilder
          initial={chart.present ? chart : { chartType: spec.chart.chartType }}
          cells={cells}
          onSave={(ch) => { setChart(ch); setShowChart(false); }}
          onClose={() => setShowChart(false)}
        />
      )}
    </div>
  );
}

function ResultPanel({ result }) {
  return (
    <div className="xl-result">
      <div className="card card-pad">
        <div className="card-h">Per-part verdict</div>
        {result.parts.map((p) => (
          <div className="row" key={p.ref}>
            <span className="ico">{p.marks === p.max ? '✓' : p.marks > 0 ? '◑' : '✕'}</span>
            <span className="label">{p.label}</span>
            <span className={`val ${p.marks === p.max ? 'v-mint' : p.marks > 0 ? 'v-amber' : 'v-rose'}`}>{p.marks} / {p.max}</span>
          </div>
        ))}
        {result.commonErrors?.length > 0 && (
          <div className="strip strip-amber" style={{ marginTop: 8, borderRadius: 8 }}>
            Common slip: {result.commonErrors[0]}
          </div>
        )}
      </div>
    </div>
  );
}

// Completion detection for the paper-margin ticks — presence only, never correctness.
function detectAttempted(spec, cells, filename, saves, chart) {
  const vals = Object.values(cells).map((v) => String(v ?? ''));
  const hasFn = (fn) => vals.some((v) => v.trim().startsWith('=') && v.toUpperCase().includes(fn));
  const headerPresent = (t) => vals.some((v) => v.trim().toUpperCase() === String(t.headers[0]).toUpperCase());
  const dataEntered = spec.tables.every(headerPresent);
  return {
    a: dataEntered && filename && filename.toUpperCase() !== 'BOOK1' && saves.length > 0,
    bi: hasFn('SUM'),
    bii: hasFn('MIN') && hasFn('MAX'),
    biii: hasFn('AVERAGE') && saves.length >= 1,
    c: !!chart?.present,
  };
}
