import { useNavigate, useParams, Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Ring, Stars } from './tmUi.jsx';
import { getModule, MODULES } from './courseContent.js';
import {
  load, moduleState, modulePct, moduleStars, lessonStates,
} from './progress.js';
import './typingmaster.css';

function LessonRow({ lesson, state, stars, onStart, last }) {
  const done = state === 'done';
  const active = state === 'active';
  const locked = state === 'locked';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px', borderBottom: last ? 'none' : '1px solid #EEF1F6', background: active ? '#FAFBFE' : 'transparent', opacity: locked ? 0.6 : 1 }}>
      <span style={{
        width: 26, height: 26, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 12px/1',
        background: done ? '#E4F7EF' : active ? '#E7EEFC' : '#F0F2F6',
        color: done ? '#0E9F6E' : active ? '#2D6BE4' : '#B7C0CE',
        border: active ? '2px solid #2D6BE4' : 'none',
      }}
      >
        {done ? '✓' : active ? '▶' : '🔒'}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ font: "700 15px/1.2 'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.01em', color: '#0F1E33' }}>{lesson.title}</div>
        <div style={{ marginTop: 4, font: "500 12.5px/1.2 'Plus Jakarta Sans',sans-serif", color: '#8494A8' }}>{lesson.meta}</div>
      </div>
      {done && <Stars n={stars} />}
      {active && <button type="button" className="tm-btn tm-btn-navy" style={{ padding: '8px 16px', fontSize: 12 }} onClick={onStart}>Start</button>}
      {locked && <span style={{ font: "500 12px/1 'Plus Jakarta Sans',sans-serif", color: '#B7C0CE' }}>Locked</span>}
    </div>
  );
}

export default function ModuleDetail() {
  const { moduleSlug } = useParams();
  const navigate = useNavigate();
  const { caps, launchFree } = useAuth();
  const module = getModule(moduleSlug);
  if (!module) return <div className="tm page"><p className="tm-sub">That module doesn’t exist. <Link to="/learn/typing">Back to the course</Link>.</p></div>;

  if (module.n >= 2 && !(launchFree || (caps || []).includes('typingCourse'))) {
    return (
      <div className="tm page" style={{ maxWidth: 520, margin: '0 auto' }}>
        <Seo pathname="/learn/typing" />
        <div className="tm-card" style={{ padding: '30px 32px', textAlign: 'center' }}>
          <div style={{ font: '800 34px/1', color: '#0D2846' }}>🔒</div>
          <div className="tm-h2" style={{ marginTop: 14 }}>{module.title} is part of the paid course</div>
          <p style={{ marginTop: 10, font: "500 15px/1.55 'Plus Jakarta Sans',sans-serif", color: '#4A5A70' }}>
            The Home row module is free to try. Unlock all 11 modules — top row through exam speed — for ₹69.
          </p>
          <Link to="/pass" className="tm-btn tm-btn-navy" style={{ marginTop: 20, width: '100%' }}>Unlock the full course</Link>
          <div style={{ marginTop: 14 }}><Link to="/learn/typing" style={{ font: "600 13px/1 'Plus Jakarta Sans',sans-serif" }}>Back to the course</Link></div>
        </div>
      </div>
    );
  }

  const p = load();
  const mState = moduleState(module, p);
  const states = lessonStates(module, p);
  const pct = modulePct(module, p);
  const stars = moduleStars(module, p);
  const cleared = states.filter((s) => s === 'done').length;
  const best = module.lessons.map((l) => p.lessons[l.slug]).filter(Boolean);
  const bestAcc = best.length ? Math.max(...best.map((l) => l.bestAccuracy)) : 0;
  const bestWpm = best.length ? Math.max(...best.map((l) => l.bestWpm)) : 0;
  const activeIdx = states.indexOf('active');
  const go = (l) => navigate(`/learn/typing/run/${module.slug}/${l.slug}`);

  return (
    <div className="tm page" style={{ maxWidth: 1120, margin: '0 auto' }}>
      <Seo pathname="/learn/typing" />
      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
        <div style={{ width: 330, flex: '1 1 300px', maxWidth: 360 }}>
          <div style={{ font: "500 13px/1 'Plus Jakarta Sans',sans-serif", color: '#8494A8' }}>
            <Link to="/learn/typing">Course map</Link> · Module {module.n}
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Ring pct={pct} color={pct >= 100 ? '#0E9F6E' : '#2D6BE4'} size={56} />
            <div>
              <div className="tm-h2">{module.title}</div>
              <div style={{ marginTop: 4 }}><Stars n={stars} /></div>
            </div>
          </div>
          <div style={{ marginTop: 18, font: "500 15px/1.55 'Plus Jakarta Sans',sans-serif", color: '#4A5A70' }}>{module.goal}</div>
          <div className="tm-card" style={{ marginTop: 22, padding: '4px 18px' }}>
            {[['Best accuracy', bestAcc ? `${bestAcc}%` : '—', bestAcc >= 95 ? '#0E9F6E' : '#0F1E33'],
              ['Best speed', bestWpm ? `${bestWpm} WPM` : '—', '#0F1E33'],
              ['Lessons cleared', `${cleared} / ${module.lessons.length}`, '#0F1E33']].map(([k, v, c], i) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderTop: i ? '1px solid #EEF1F6' : 'none' }}>
                  <span style={{ font: "500 13px/1 'Plus Jakarta Sans',sans-serif", color: '#4A5A70' }}>{k}</span>
                  <span className="num" style={{ font: "700 13px/1", color: c }}>{v}</span>
                </div>
            ))}
          </div>
          {mState !== 'locked' && activeIdx >= 0 && (
            <button type="button" className="tm-btn tm-btn-navy" style={{ marginTop: 20, width: '100%' }} onClick={() => go(module.lessons[activeIdx])}>
              {cleared ? `Resume lesson ${activeIdx + 1}` : 'Start lesson 1'}
            </button>
          )}
          {mState === 'done' && (
            <div style={{ marginTop: 16, font: "500 13px/1.4 'Plus Jakarta Sans',sans-serif", color: '#0E9F6E' }}>✓ Module complete — every lesson cleared.</div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ font: "700 14px/1 'Plus Jakarta Sans',sans-serif" }}>Lessons</span>
            <span style={{ font: "500 13px/1 'Plus Jakarta Sans',sans-serif", color: '#8494A8' }}>Clear each to unlock the next</span>
          </div>
          <div className="tm-card tm-card-lg" style={{ marginTop: 14, overflow: 'hidden' }}>
            {module.lessons.map((l, i) => (
              <LessonRow
                key={l.slug}
                lesson={l}
                state={mState === 'locked' ? 'locked' : states[i]}
                stars={p.lessons[l.slug]?.stars || 0}
                onStart={() => go(l)}
                last={i === module.lessons.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
