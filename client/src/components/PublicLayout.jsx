import { Outlet, useLocation } from 'react-router-dom';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';
import Seo from './Seo.jsx';
import LaunchBanner from './LaunchBanner.jsx';

// Wraps every public route with the nav, footer and per-route SEO head.
export default function PublicLayout() {
  const { pathname } = useLocation();
  return (
    <>
      <Seo pathname={pathname} />
      <LaunchBanner />
      <Nav />
      <main id="content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
