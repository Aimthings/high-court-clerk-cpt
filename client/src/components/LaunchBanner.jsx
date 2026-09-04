import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Launch announcement bar. Shown while the free launch is on (launchFree) to
// signed-out visitors — drives early sign-ups and promises founding-member perks.
// Honest by design: no fake scarcity, no struck-through prices, no exclamation.
const KEY = 'hcc_launch_banner_dismissed_v1';

export default function LaunchBanner() {
  const { launchFree, user, loading } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
  });

  if (loading || !launchFree || user || dismissed) return null;

  const close = () => {
    setDismissed(true);
    try { localStorage.setItem(KEY, '1'); } catch { /* non-fatal */ }
  };

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', flexWrap: 'wrap',
        padding: '10px 16px', background: '#EAF1FF', borderBottom: '1px solid #D5E1FB',
        font: "500 13.5px/1.4 'Plus Jakarta Sans', sans-serif", color: '#0F1E33',
      }}
      role="region"
      aria-label="Launch announcement"
    >
      <span>
        <strong style={{ fontWeight: 700, color: '#0D2846' }}>Free for everyone during launch.</strong>
        {' '}Create a free account now — founding members keep special perks as we grow.
      </span>
      <Link
        to="/sign-in"
        style={{
          background: '#0D2846', borderBottom: '2px solid #08192E', color: '#fff',
          borderRadius: 9, padding: '7px 15px', font: "700 12.5px/1 'Plus Jakarta Sans', sans-serif", textDecoration: 'none',
        }}
      >
        Create free account
      </Link>
      <button
        type="button"
        onClick={close}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8494A8', font: '600 16px/1', padding: '2px 6px' }}
      >
        ×
      </button>
    </div>
  );
}
