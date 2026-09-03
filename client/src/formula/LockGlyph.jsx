// The padlock glyph used on locked formula cards and the legend chip (deck 29·L).
// A thin outline lock in ink-3; inherits currentColor via stroke.
export function LockGlyph({ size = 12 }) {
  return (
    <svg width={size} height={(size * 13) / 12} viewBox="0 0 12 13" fill="none" style={{ display: 'block' }} aria-hidden="true">
      <rect x="1" y="5.5" width="10" height="6.5" rx="1.4" stroke="#8494A8" strokeWidth="1.2" />
      <path d="M3.2 5.5V3.6a2.8 2.8 0 0 1 5.6 0v1.9" stroke="#8494A8" strokeWidth="1.2" />
    </svg>
  );
}

export default LockGlyph;
