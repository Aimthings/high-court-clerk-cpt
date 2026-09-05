import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/PublicLayout.jsx';
import { PaneSkeleton } from './components/Skeletons.jsx';
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
import RankPredictor from './pages/RankPredictor.jsx';
import { Account, NotFound } from './pages/Placeholder.jsx';

// Exam runners are lazy-loaded so the heavy formula engine (formulajs) stays out
// of the initial bundle and public pages keep their LCP budget.
const TypingTest = lazy(() => import('./typing/TypingTest.jsx'));
const ExcelMock = lazy(() => import('./excel/ExcelMock.jsx'));
const FormulaLibrary = lazy(() => import('./formula/FormulaLibrary.jsx'));
const FormulaLesson = lazy(() => import('./formula/FormulaLesson.jsx'));
const CourseMap = lazy(() => import('./typing/CourseMap.jsx'));
const ModuleDetail = lazy(() => import('./typing/ModuleDetail.jsx'));
const LessonRunner = lazy(() => import('./typing/LessonRunner.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));

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
        <Route path="/rank-predictor" element={<RankPredictor />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/scoring" element={<Scoring />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/pass" element={<Paywall />} />
        <Route path="/pass/status" element={<PaymentStatus />} />
        <Route path="/mocks" element={<MockList />} />
        <Route path="/practice/formulas" element={<Suspense fallback={<PageFallback />}><FormulaLibrary /></Suspense>} />
        <Route path="/practice/formulas/:slug" element={<Suspense fallback={<PageFallback />}><FormulaLesson /></Suspense>} />
        <Route path="/learn/typing" element={<Suspense fallback={<PageFallback />}><CourseMap /></Suspense>} />
        <Route path="/learn/typing/m/:moduleSlug" element={<Suspense fallback={<PageFallback />}><ModuleDetail /></Suspense>} />
        <Route path="/home" element={<Home />} />
        <Route path="/admin" element={<Suspense fallback={<PageFallback />}><AdminDashboard /></Suspense>} />
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
      <Route
        path="/learn/typing/run/:moduleSlug/:lessonSlug"
        element={<Suspense fallback={<RunnerFallback />}><LessonRunner /></Suspense>}
      />
    </Routes>
  );
}

function PageFallback() {
  return (
    <div className="page">
      <PaneSkeleton height={360} />
    </div>
  );
}

function RunnerFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--surface)' }}>
      <div style={{ width: 720, maxWidth: '90vw' }}><PaneSkeleton height={360} /></div>
    </div>
  );
}
