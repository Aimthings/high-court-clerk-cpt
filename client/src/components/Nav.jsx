import { Link, NavLink } from 'react-router-dom';
import './nav.css';

// Public top nav — 60px white bar on a hairline (deck artboard 16).
// Blue is only ever a link / active tab; navy is only ever the button fill.
export default function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-brand" aria-label="High Court Clerk CPT — home">
          Clerk CPT
        </Link>
        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/the-exam" className="nav-link">The exam</NavLink>
          <NavLink to="/syllabus" className="nav-link">Syllabus</NavLink>
          <NavLink to="/rank" className="nav-link">Rank list</NavLink>
          <NavLink to="/pricing" className="nav-link">Pricing</NavLink>
        </nav>
        <Link to="/sign-in" className="nav-signin">Sign in</Link>
        <Link to="/mocks" className="btn btn-primary nav-cta">Take a free mock</Link>
      </div>
    </header>
  );
}
