import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import './reference.css';
import { Row1 } from './refparts.jsx';

// Account is a settings page. Board visibility is the ONLY setting that changes
// what strangers see on the rank list (deck artboard 19).
export function Account() {
  const { user, profile, hasPass, expiresAt, loading, logout, refresh } = useAuth();
  const [handle, setHandle] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) {
    return <div className="page centre-wrap"><div className="skeleton-pane" style={{ width: 420, height: 240 }} /></div>;
  }
  if (!user) {
    return <EmptyState title="Account" reason="Sign in to see your pass, receipts, handle and board visibility." action={['Sign in', '/sign-in']} />;
  }

  async function toggleListed() {
    setErr(''); setMsg('');
    try { await api.setListed(!profile?.listed); await refresh(); }
    catch (e) { setErr(e.message); }
  }
  async function saveHandle(e) {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true);
    try { const r = await api.setHandle(handle); await refresh(); setHandle(''); setMsg(`Handle set to ${r.handle}.`); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  }

  return (
    <div className="page centre-wrap">
      <div className="card-420">
        <h1 className="page-title" style={{ marginBottom: 16 }}>Account</h1>

        <div className="card">
          <div className="card-simple-head">Identity</div>
          <Row1 label="Email" val={<span className="mono">{user.email}</span>} />
          <Row1 label="Handle" val={profile?.handle || '—'} />
          <Row1 label="Pass" val={hasPass
            ? <span className="v-mint">Active · ends {new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            : <span className="v-amber">No pass</span>} />
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-simple-head">Board visibility</div>
          <div className="row-1">
            <span className="r1-label">Show my handle and score on the public rank list</span>
            <button className={`toggle ${profile?.listed ? 'toggle-on' : ''}`} onClick={toggleListed} aria-pressed={!!profile?.listed}>
              <span className="toggle-knob" />
            </button>
          </div>
          <p className="policy-body" style={{ padding: '0 16px 14px', marginTop: 0 }}>
            Turning this off removes your row from the board. Your email is never shown either way.
          </p>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-simple-head">Change handle</div>
          <form onSubmit={saveHandle} style={{ padding: '0 16px 16px' }}>
            <input className="input mono" placeholder="e.g. navdeep_v" value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())} aria-label="New handle" />
            <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} disabled={busy || !handle}>
              {busy ? 'Saving…' : 'Save handle'}
            </button>
            <p className="fineprint" style={{ marginTop: 8 }}>A handle can be changed once every 30 days.</p>
          </form>
        </div>

        {msg && <div className="strip strip-mint" style={{ marginTop: 12, borderRadius: 'var(--r-btn)' }}>{msg}</div>}
        {err && <div className="strip strip-rose" style={{ marginTop: 12, borderRadius: 'var(--r-btn)' }}><span className="dot" style={{ background: 'var(--rose)' }}>!</span>{err}</div>}

        {!hasPass && <Link to="/pass" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>See all plans · from ₹69</Link>}
        <button className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <EmptyState title="Page not found" reason="That page does not exist, or has moved." action={['Go to the home page', '/']} />
  );
}

function EmptyState({ title, reason, action, note }) {
  return (
    <div className="page centre-wrap">
      <div className="card-420" style={{ textAlign: 'center' }}>
        <h1 className="page-title">{title}</h1>
        <p className="page-sub" style={{ fontSize: 13, marginTop: 10 }}>{reason}</p>
        <Link to={action[1]} className="btn btn-primary" style={{ marginTop: 18 }}>{action[0]}</Link>
        {note && <p className="fineprint" style={{ marginTop: 16 }}>{note}</p>}
      </div>
    </div>
  );
}
