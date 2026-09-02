import { Link } from 'react-router-dom';
import './reference.css';

// Empty-state placeholders for routes built in later phases. Every nav/footer
// link resolves to a designed screen (no dead links), naming the reason + the
// single action that fixes it.
export function MockList() {
  return (
    <EmptyState
      title="Mocks"
      reason="The Excel simulator and typing runner arrive in the next build phase."
      action={['Read how scoring works', '/scoring']}
      note="The first mock will need no sign-up and no payment."
    />
  );
}

export function Account() {
  return (
    <EmptyState
      title="Account"
      reason="Sign in to see your pass, receipts, handle and board visibility."
      action={['Sign in', '/sign-in']}
    />
  );
}

export function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      reason="That page does not exist, or has moved."
      action={['Go to the home page', '/']}
    />
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
