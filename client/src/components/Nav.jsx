import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import './nav.css';

// Public top nav — 60px white bar on a hairline (deck artboard 16).
// Blue is only ever a link / active tab; navy is only ever the button fill.
export default function Nav() {
  const { user, hasPass, expiresAt, admin } = useAuth();
  // Show a "Coming soon" badge on Rank Predictor until it's live for the viewer
  // (hidden for admins, and for everyone once RANK_PREDICTOR_LIVE=true).
  const [rankLive, setRankLive] = useState(true);
  useEffect(() => { api.rankConfig().then((c) => setRankLive(!!c.live)).catch(() => setRankLive(true)); }, [user]);
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-brand" aria-label="High Court Clerk CPT — home">
          <img src="/favicon.svg" alt="" className="nav-mark" width="26" height="26" />
          Clerk CPT
        </Link>
        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/the-exam" className="nav-link">The exam</NavLink>
          <NavLink to="/learn/typing" className="nav-link">Typing Master</NavLink>
          <NavLink to="/syllabus" className="nav-link">Syllabus</NavLink>
          <NavLink to="/practice/formulas" className="nav-link">Formulas</NavLink>
          <NavLink to="/rank" className="nav-link">Rank list</NavLink>
          <span className="nav-rp">
            <NavLink to="/rank-predictor" className="nav-link">Rank Predictor</NavLink>
            {!rankLive && <span className="nav-badge">Coming soon</span>}
          </span>
          <NavLink to="/pricing" className="nav-link">Pricing</NavLink>
          {admin && <NavLink to="/admin" className="nav-link">Admin</NavLink>}
        </nav>
        {user ? (
          <Link to="/account" className="nav-account">
            {hasPass
              ? <span className="pill pill-amber pill-sans">Pass · {daysLeft(expiresAt)} days</span>
              : <span className="nav-signin">Account</span>}
          </Link>
        ) : (
          <Link to="/sign-in" className="nav-signin">Sign in</Link>
        )}
        <Link to="/mocks" className="btn btn-primary nav-cta">Take a free mock</Link>
      </div>
    </header>
  );
}

function daysLeft(expiresAt) {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
