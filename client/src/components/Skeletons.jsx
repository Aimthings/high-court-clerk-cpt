import ContentLoader from 'react-content-loader';

// Themed loading skeletons (react-content-loader) for the API-driven screens.
// A short fetch delay is unavoidable on first paint of dynamic data. Each
// skeleton mirrors the real layout — a bar the size of the title where the
// title goes, a line where each text line goes, a block where the sheet goes —
// and sits inside the SAME containers (.card, .split-ref, .fl-bar…) as the
// loaded content, so nothing shifts when the data arrives.
// Colours mirror the Daylight tokens --sunken / a slightly lighter sweep (SVG
// gradient stops can't read CSS vars, so the hex is pinned here only).
const BASE = '#eff2f8'; // --sunken
const SWEEP = '#f6f8fc'; // one step lighter, for the shimmer pass

function Loader(props) {
  return <ContentLoader speed={1.6} backgroundColor={BASE} foregroundColor={SWEEP} {...props} />;
}

// ---- primitives ---------------------------------------------------------

// Stacked text lines. `widths` are fractions (0..1) of the container width, one
// per line; height stays 1:1 (viewBox height = pixel height) so bars aren't
// squashed while they stretch horizontally to fill the real text column.
export function Lines({ widths = [1], lineH = 12, gap = 10, style }) {
  const W = 1000;
  const H = widths.length * lineH + (widths.length - 1) * gap;
  return (
    <Loader width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', display: 'block', ...style }}>
      {widths.map((w, i) => (
        <rect key={i} x="0" y={i * (lineH + gap)} rx="5" ry="5" width={Math.round(w * W)} height={lineH} />
      ))}
    </Loader>
  );
}

// A single rounded block sized to a specific element (a pill, a button, a
// sheet, a code strip). `width` may be px or a CSS length; height is px.
export function Block({ width = '100%', height = 40, radius = 10, style }) {
  return (
    <Loader width={width} height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width, display: 'block', ...style }}>
      <rect x="0" y="0" rx={radius} ry={radius} width="100" height={height} />
    </Loader>
  );
}

// A full-area rounded pane — genuine single-surface loads (exam runners, chart).
export function PaneSkeleton({ height = 360, radius = 16 }) {
  return <Block width="100%" height={height} radius={radius} />;
}

// ---- formula library grid ----------------------------------------------

// One formula card (mono name + difficulty pill), inside the real .fl-card.
export function CardTileSkeleton() {
  return (
    <div className="card fl-card" aria-hidden="true">
      <Block width={96} height={13} radius={5} />
      <Block width={48} height={20} radius={8} />
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }) {
  return (
    <div className="fl-grid">
      {Array.from({ length: count }).map((_, i) => <CardTileSkeleton key={i} />)}
    </div>
  );
}

// ---- mock / passage card ------------------------------------------------

// Mirrors a .mock-card: two pills, a title, a meta line, a footer button.
export function MockCardSkeleton() {
  return (
    <div className="card mock-card" aria-hidden="true">
      <div className="card-pad">
        <div className="mock-card-top" style={{ display: 'flex', gap: 8 }}>
          <Block width={44} height={20} radius={8} />
          <Block width={72} height={20} radius={8} />
        </div>
        <div style={{ marginTop: 14 }}><Block width="66%" height={15} radius={5} /></div>
        <div style={{ marginTop: 8 }}><Block width="52%" height={11} radius={5} /></div>
      </div>
      <div className="mock-card-foot"><Block width="100%" height={38} radius={12} /></div>
    </div>
  );
}

export function MockGridSkeleton({ count = 4 }) {
  return (
    <div className="mock-grid" style={{ marginBottom: 34 }}>
      {Array.from({ length: count }).map((_, i) => <MockCardSkeleton key={i} />)}
    </div>
  );
}

// ---- rank list rows -----------------------------------------------------

export function ListRowSkeleton({ height = 44 }) {
  return (
    <Loader width="100%" height={height} viewBox={`0 0 600 ${height}`} preserveAspectRatio="none" style={{ width: '100%', display: 'block' }}>
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

// ---- formula lesson (tutorial + practice + rail) ------------------------

// Mirrors the whole lesson layout at the real sizes: header, tutorial card,
// practice card with sheet + formula bar, and the right rail.
export function FormulaLessonSkeleton() {
  return (
    <div className="page">
      <div className="ref-header">
        <Block width={110} height={12} radius={5} />
        <div style={{ marginTop: 10 }}><Block width={180} height={28} radius={6} /></div>
        <div style={{ marginTop: 10 }}><Block width={130} height={12} radius={5} /></div>
      </div>

      <div className="split-ref">
        <div className="ref-main stack">
          {/* tutorial */}
          <div className="card card-pad">
            <Block width={120} height={14} radius={5} />
            <div style={{ marginTop: 10 }}><Lines widths={[1, 0.82]} lineH={12} gap={8} /></div>
            <div style={{ marginTop: 16 }}><Block width={70} height={9} radius={4} /></div>
            <div style={{ marginTop: 8 }}><Block width="100%" height={40} radius={10} /></div>
            <div style={{ marginTop: 16 }}><Block width={64} height={9} radius={4} /></div>
            <div style={{ marginTop: 8 }}><Block width="100%" height={40} radius={10} /></div>
          </div>

          {/* practice */}
          <div className="card card-pad">
            <Block width={90} height={14} radius={5} />
            <div style={{ marginTop: 8 }}><Block width="72%" height={11} radius={5} /></div>
            <div style={{ marginTop: 16 }}><Block width={360} height={150} radius={8} /></div>
            <div className="fl-bar" style={{ marginTop: 14 }}>
              <Block width={52} height={30} radius={8} />
              <Block width={16} height={16} radius={4} />
              <div style={{ flex: 1 }}><Block width="100%" height={38} radius={10} /></div>
              <Block width={80} height={38} radius={12} />
            </div>
          </div>
        </div>

        <aside className="ref-rail stack">
          <div className="card card-pad">
            <Block width={70} height={13} radius={5} />
            <div style={{ marginTop: 10 }}><Block width={96} height={12} radius={5} /></div>
          </div>
          <div className="card card-pad">
            <Lines widths={[1, 0.75]} lineH={11} gap={8} />
          </div>
          <Block width="100%" height={44} radius={12} />
        </aside>
      </div>
    </div>
  );
}
