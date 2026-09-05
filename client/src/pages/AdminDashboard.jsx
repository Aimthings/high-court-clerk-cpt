import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './reference.css';

// Master-admin console. Access is enforced on the server (every /api/admin call
// checks the signed-in account's email); this page just refuses to render for
// non-admins. Shows live sign-in counts and every account's access.
export default function AdminDashboard() {
  const { admin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all'); // all | online | paid | founding

  const loadStats = useCallback(() => {
    api.adminStats().then(setStats).catch((e) => setError(e.message));
  }, []);
  const loadUsers = useCallback(() => {
    api.adminUsers().then((d) => setUsers(d.users)).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (authLoading || !admin) return undefined;
    loadStats(); loadUsers();
    const s = setInterval(loadStats, 20_000); // live tiles
    const u = setInterval(loadUsers, 60_000);
    return () => { clearInterval(s); clearInterval(u); };
  }, [admin, authLoading, loadStats, loadUsers]);

  const rows = useMemo(() => {
    let list = users || [];
    if (filter === 'online') list = list.filter((u) => u.online);
    else if (filter === 'paid') list = list.filter((u) => u.products?.length);
    else if (filter === 'founding') list = list.filter((u) => u.founding);
    const needle = q.trim().toLowerCase();
    if (needle) list = list.filter((u) => (u.email || '').toLowerCase().includes(needle) || (u.handle || '').toLowerCase().includes(needle) || (u.access || '').toLowerCase().includes(needle));
    return list;
  }, [users, q, filter]);

  if (authLoading) return <div className="page"><p className="secondary">Loading…</p></div>;
  if (!admin) {
    return (
      <div className="page centre-wrap">
        <div className="card-420" style={{ textAlign: 'center' }}>
          <div style={{ font: '800 34px/1', color: 'var(--navy)' }}>🔒</div>
          <h1 className="page-title" style={{ marginTop: 12, fontSize: 22 }}>Admins only</h1>
          <p className="secondary" style={{ marginTop: 8, fontSize: 13.5 }}>This console is restricted to the master admin account.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="ref-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Admin console</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>Live sign-ins and every account's access. {stats?.at && <span className="muted">Updated {new Date(stats.at).toLocaleTimeString()}</span>}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => { loadStats(); loadUsers(); }}>Refresh now</button>
      </div>

      {error && <div className="card card-pad" style={{ textAlign: 'center', marginBottom: 20 }}><p className="secondary">{error}</p></div>}

      {/* live tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 26 }}>
        <Tile label="Online now" value={stats?.onlineNow} live sub="last 15 min" />
        <Tile label="Active today" value={stats?.activeToday} />
        <Tile label="Total accounts" value={stats?.totalAccounts} />
        <Tile label="Verified" value={stats?.verified} />
        <Tile label="Founding members" value={stats?.foundingMembers} />
        <Tile label="With paid access" value={stats?.withPaidAccess} />
        <Tile label="New · 24h" value={stats?.newLast24h} />
        <Tile label="New · 7 days" value={stats?.newLast7d} />
      </div>

      {/* controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          className="mono"
          style={{ flex: '1 1 260px', minWidth: 220, padding: '9px 12px', border: '1px solid var(--hairline)', borderRadius: 8, fontSize: 13, background: 'var(--surface)', color: 'var(--ink)' }}
          placeholder="Search email, handle or access…"
          value={q} onChange={(e) => setQ(e.target.value)} spellCheck={false}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'online', 'paid', 'founding'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`pill pill-sans ${filter === f ? 'pill-blue' : 'pill-neutral'}`} style={{ cursor: 'pointer', border: 0 }}>
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <span className="muted num">{rows.length} shown</span>
      </div>

      {/* table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--ink-3)', borderBottom: '1px solid var(--hairline)' }}>
              <Th>#</Th><Th>Email</Th><Th>Handle</Th><Th>Access</Th><Th>Founding</Th><Th>Verified</Th><Th>Status</Th><Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {!users && !error && <tr><Td colSpan={8}><span className="secondary">Loading accounts…</span></Td></tr>}
            {users && rows.length === 0 && <tr><Td colSpan={8}><span className="secondary">No accounts match.</span></Td></tr>}
            {rows.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--hairline)' }}>
                <Td><span className="muted num">{i + 1}</span></Td>
                <Td>
                  <span className="mono">{u.email || '—'}</span>
                  {u.admin && <span className="pill pill-sans pill-amber" style={{ marginLeft: 8 }}>Admin</span>}
                </Td>
                <Td>{u.handle ? <span className="mono">{u.handle}</span> : <span className="muted">—</span>}</Td>
                <Td><AccessCell access={u.access} products={u.products} /></Td>
                <Td>{u.founding ? <span className="v-mint">Yes</span> : <span className="muted">No</span>}</Td>
                <Td>{u.verified ? <span className="v-mint">Yes</span> : <span className="v-amber">No</span>}</Td>
                <Td>
                  {u.online
                    ? <span className="v-mint">● Online</span>
                    : <span className="muted">{u.lastSeen ? `Seen ${timeAgo(u.lastSeen)}` : 'Never'}</span>}
                </Td>
                <Td><span className="muted num">{fmtDate(u.joined)}</span></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fineprint" style={{ marginTop: 12 }}>
        Emails are personal data — this page is visible only to the master admin. Access reflects purchased entitlements; during the free launch everyone can use the paid areas regardless of what is shown here.
      </p>
    </div>
  );
}

function Tile({ label, value, sub, live }) {
  return (
    <div className="card card-pad" style={{ padding: 16 }}>
      <div className="muted" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
        {live && <span style={{ width: 8, height: 8, borderRadius: 8, background: 'var(--mint)', display: 'inline-block' }} />}
        {label}
      </div>
      <div className="num" style={{ font: '800 30px/1.1 var(--font)', color: 'var(--navy)', marginTop: 6 }}>
        {value == null ? '—' : Number(value).toLocaleString('en-IN')}
      </div>
      {sub && <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function AccessCell({ access, products }) {
  const tone = access?.includes('admin') ? 'pill-amber' : access === 'Full access' ? 'pill-mint' : access === 'None' ? 'pill-neutral' : 'pill-blue';
  return (
    <span title={products?.length ? `Products: ${products.join(', ')}` : 'No purchases'}>
      <span className={`pill pill-sans ${tone}`}>{access}</span>
    </span>
  );
}

const Th = ({ children }) => <th style={{ padding: '10px 12px', fontWeight: 700, whiteSpace: 'nowrap' }}>{children}</th>;
const Td = ({ children, colSpan }) => <td colSpan={colSpan} style={{ padding: '10px 12px', verticalAlign: 'middle' }}>{children}</td>;

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return '—'; }
}
function timeAgo(d) {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
