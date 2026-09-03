import ContentLoader from 'react-content-loader';

// Themed loading skeletons (react-content-loader) for the API-driven screens.
// A short fetch delay is unavoidable on first paint of dynamic data; these hold
// the exact geometry so nothing jumps when the content arrives (deck loading
// states). Colours mirror the Daylight tokens --sunken / a slightly lighter sweep
// (SVG gradient stops can't read CSS vars, so the hex is pinned here only).
const BASE = '#eff2f8'; // --sunken
const SWEEP = '#f6f8fc'; // one step lighter, for the shimmer pass

function Loader(props) {
  return <ContentLoader speed={1.6} backgroundColor={BASE} foregroundColor={SWEEP} {...props} />;
}

// A single rounded pane — lesson body, dashboards, exam runners.
export function PaneSkeleton({ height = 360, radius = 16, label = 'Loading' }) {
  return (
    <Loader width="100%" height={height} viewBox={`0 0 400 ${height}`} preserveAspectRatio="none" title={label} style={{ width: '100%' }}>
      <rect x="0" y="0" rx={radius} ry={radius} width="400" height={height} />
    </Loader>
  );
}

// One formula card (mono name + difficulty pill), used inside the .fl-grid.
export function CardTileSkeleton() {
  return (
    <div className="card fl-card" aria-hidden="true">
      <Loader width="100%" height="20" viewBox="0 0 240 20" preserveAspectRatio="none" style={{ width: '100%' }}>
        <rect x="0" y="4" rx="5" ry="5" width="96" height="13" />
        <rect x="192" y="0" rx="8" ry="8" width="48" height="20" />
      </Loader>
    </div>
  );
}

// A grid of card tiles (formula library, mock/passage lists).
export function CardGridSkeleton({ count = 8 }) {
  return (
    <div className="fl-grid">
      {Array.from({ length: count }).map((_, i) => <CardTileSkeleton key={i} />)}
    </div>
  );
}

// A single list row (rank list, mock rows).
export function ListRowSkeleton({ height = 44 }) {
  return (
    <Loader width="100%" height={height} viewBox={`0 0 600 ${height}`} preserveAspectRatio="none" style={{ width: '100%' }}>
      <rect x="0" y={height / 2 - 6} rx="5" ry="5" width="180" height="12" />
      <rect x="520" y={height / 2 - 6} rx="5" ry="5" width="60" height="12" />
    </Loader>
  );
}

export function ListSkeleton({ rows = 8, rowHeight = 44 }) {
  return (
    <div className="card" style={{ padding: '4px 16px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ borderTop: i ? '1px solid var(--hairline)' : 'none' }}>
          <ListRowSkeleton height={rowHeight} />
        </div>
      ))}
    </div>
  );
}
