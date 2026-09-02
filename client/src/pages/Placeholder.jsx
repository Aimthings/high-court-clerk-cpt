import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './reference.css';
import { Row1 } from './refparts.jsx';

// Account — identity, pass and receipts. Board-visibility toggle (the only
// setting that changes public data) lands with the rank list in Phase 5.
export function Account() {
  const { user, hasPass, expiresAt, loading, logout } = useAuth();
  if (loading) {
    return <div className="page centre-wrap"><div className="skeleton-pane" style={{ width: 420, height: 200 }} /></div>;
  }
  if (!user) {
    return (
      <EmptyState
        title="Account"
        reason="Sign in to see your pass, receipts, handle and board visibility."
        action={['Sign in', '/sign-in']}
      />
    );
  }
  return (
    <div className="page centre-wrap">
      <div className="card-420">
        <h1 className="page-title" style={{ marginBottom: 16 }}>Account</h1>
        <div className="card">
          <div className="card-simple-head">Identity</div>
          <Row1 label="Mobile number" val={<span className="mono">+91 {user.phone}</span>} />
          <Row1
            label="Pass"
            val={hasPass
              ? <span className="v-mint">Active · ends {new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              : <span className="v-amber">No pass</span>}
          />
        </div>
        {!hasPass && <Link to="/pass" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>Get the ₹119 pass</Link>}
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
