import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/PublicLayout.jsx';
import Landing from './pages/Landing.jsx';
import TheExam from './pages/TheExam.jsx';
import Syllabus from './pages/Syllabus.jsx';
import Pricing from './pages/Pricing.jsx';
import Scoring from './pages/Scoring.jsx';
import Contact from './pages/Contact.jsx';
import SignIn from './pages/SignIn.jsx';
import Paywall from './pages/Paywall.jsx';
import PaymentStatus from './pages/PaymentStatus.jsx';
import RankList from './rank/RankList.jsx';
import MockList from './pages/MockList.jsx';
import Home from './pages/Home.jsx';
import { Account, NotFound } from './pages/Placeholder.jsx';

// Exam runners are lazy-loaded so the heavy formula engine (formulajs) stays out
// of the initial bundle and public pages keep their LCP budget.
const TypingTest = lazy(() => import('./typing/TypingTest.jsx'));
const ExcelMock = lazy(() => import('./excel/ExcelMock.jsx'));

// All routes render under the public layout (nav + footer + SEO) for Phase 1.
// Signed-in shells and exam runners get their own layouts in later phases.
export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/the-exam" element={<TheExam />} />
        <Route path="/syllabus" element={<Syllabus />} />
        <Route path="/rank" element={<RankList />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/scoring" element={<Scoring />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/pass" element={<Paywall />} />
        <Route path="/pass/status" element={<PaymentStatus />} />
        <Route path="/mocks" element={<MockList />} />
        <Route path="/home" element={<Home />} />
        <Route path="/account" element={<Account />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      {/* Exam runners are standalone full-screen routes — no nav/footer. */}
      <Route
        path="/mocks/:slug/run"
        element={<Suspense fallback={<RunnerFallback />}><TypingTest /></Suspense>}
      />
      <Route
        path="/mocks/:code/excel"
        element={<Suspense fallback={<RunnerFallback />}><ExcelMock /></Suspense>}
      />
    </Routes>
  );
}

function RunnerFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--surface)' }}>
      <div className="skeleton-pane" style={{ width: 720, maxWidth: '90vw', height: 360 }} />
    </div>
  );
}
