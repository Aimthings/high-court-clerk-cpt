import { Link } from 'react-router-dom';
import './footer.css';

// Navy footer field: four link columns + one legal line (deck artboard 17).
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-cols">
          <div className="footer-brand-col">
            <div className="footer-brand">High Court Clerk CPT</div>
            <p className="footer-blurb">
              C.P.T. practice for the Punjab &amp; Haryana High Court Clerk recruitment.
            </p>
          </div>
          <FooterCol title="Practice" links={[
            ['Excel mocks', '/mocks'],
            ['Typing passages', '/mocks'],
            ['Exam mode', '/the-exam'],
          ]} />
          <FooterCol title="The exam" links={[
            ['Syllabus', '/syllabus'],
            ['How scoring works', '/scoring'],
            ['Rank list', '/rank'],
          ]} />
          <FooterCol title="Account" links={[
            ['Sign in', '/sign-in'],
            ['Pass and receipts', '/account'],
            ['Contact', '/contact'],
          ]} />
        </div>
        <p className="footer-legal">
          High Court Clerk CPT is not affiliated with the Punjab &amp; Haryana High Court or the
          Subordinate Services Selection Commission. Practice material is built from the published
          C.P.T. criteria.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div className="footer-col">
      <div className="footer-col-title">{title}</div>
      <ul>
        {links.map(([label, to]) => (
          <li key={label}><Link to={to}>{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
