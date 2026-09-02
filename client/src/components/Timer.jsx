import './timer.css';

// Countdown ring — a conic-gradient donut whose fill is the fraction remaining.
// Recolours to amber in the final 60 seconds; mint when stopped (brief §6).
// Reused by the typing runner (Phase 2) and the Excel runner (Phase 3).
export default function Timer({ remainingMs, totalMs, stopped = false, size = 46 }) {
  const frac = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const amber = !stopped && remainingMs <= 60_000;
  const color = stopped ? 'var(--mint)' : amber ? 'var(--amber)' : 'var(--blue)';
  const inner = size - 8;

  const totalSec = Math.max(0, Math.round(remainingMs / 1000));
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');

  return (
    <div className="timer">
      <div
        className="timer-ring"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${color} 0turn ${frac}turn, var(--hairline) ${frac}turn 1turn)`,
        }}
      >
        <div className="timer-hole" style={{ width: inner, height: inner }} />
      </div>
      <div className="timer-text">
        <div className="timer-time mono" style={{ color: stopped ? 'var(--mint)' : amber ? 'var(--amber)' : 'var(--navy)' }}>
          {mm}:{ss}
        </div>
        <div className="timer-label">Remaining</div>
      </div>
    </div>
  );
}
