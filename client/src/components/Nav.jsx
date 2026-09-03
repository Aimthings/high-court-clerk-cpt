import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './nav.css';

// Public top nav — 60px white bar on a hairline (deck artboard 16).
// Blue is only ever a link / active tab; navy is only ever the button fill.
export default function Nav() {
  const { user, hasPass, expiresAt } = useAuth();
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-brand" aria-label="High Court Clerk CPT — home">
          Clerk CPT
        </Link>
        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/the-exam" className="nav-link">The exam</NavLink>
          <NavLink to="/syllabus" className="nav-link">Syllabus</NavLink>
          <NavLink to="/practice/formulas" className="nav-link">Formulas</NavLink>
          <NavLink to="/rank" className="nav-link">Rank list</NavLink>
          <NavLink to="/pricing" className="nav-link">Pricing</NavLink>
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
