import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import Keyboard from './Keyboard.jsx';
import { Ring, LockRing, Stars } from './tmUi.jsx';
import { FINGER, FINGER_NAME } from './fingerMap.js';
import { MODULES } from './courseContent.js';
import {
  load, moduleState, modulePct, moduleStars, overallStats, resumeModule, keyHeat, syncFromServer,
} from './progress.js';
import './typingmaster.css';

const LEGEND = [
  ['lp', 'Q A Z 1'], ['ri', 'Y U H J N M'], ['lr', 'W S X 2'], ['rm', 'I K , 8'],
  ['lm', 'E D C 3'], ['rr', 'O L . 9'], ['li', 'R T F G V B'], ['rp', 'P ; / 0'],
];

function ModuleCard({ module, state, paywalled }) {
  const p = load();
  const pct = modulePct(module, p);
  const stars = moduleStars(module, p);
  const locked = state === 'locked' || paywalled;
  const active = state === 'active' && !paywalled;
  const to = paywalled ? '/pass' : `/learn/typing/m/${module.slug}`;
  const card = (
    <div
      className="tm-card"
      style={{
        padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12,
        border: active ? '1px solid var(--tm-blue)' : undefined,
        boxShadow: active ? '0 0 0 3px rgba(45,107,228,.12)' : undefined,
        opacity: locked ? 0.62 : 1, height: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {locked ? <LockRing size={46} /> : <Ring pct={pct} color={pct >= 100 ? '#0E9F6E' : '#2D6BE4'} size={46} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ font: "800 12px/1 'JetBrains Mono',monospace", color: '#8494A8' }}>{String(module.n).padStart(2, '0')}</span>
            <span className={`tm-chip ${active ? 'tm-chip-blue' : locked ? 'tm-chip-grey' : 'tm-chip-mint'}`}>
              {paywalled ? '🔒 ₹69' : active ? 'In progress' : locked ? 'Locked' : '✓ Done'}
            </span>
          </div>
          <div style={{ marginTop: 6, font: "700 16px/1.15 'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.015em', color: '#0F1E33' }}>{module.title}</div>
        </div>
      </div>
      <div style={{ font: "500 13px/1.4 'Plus Jakarta Sans',sans-serif", color: '#4A5A70' }}>{module.goal}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        {paywalled
          ? <span style={{ font: "500 12px/1 'Plus Jakarta Sans',sans-serif", color: '#98A3B3' }}>Part of the paid course</span>
          : locked
            ? <span style={{ font: "500 12px/1 'Plus Jakarta Sans',sans-serif", color: '#98A3B3' }}>Clear module {module.n - 1}</span>
            : <Stars n={stars} />}
        <span style={{ font: "600 12px/1 'Plus Jakarta Sans',sans-serif", color: paywalled ? '#2D6BE4' : locked ? '#B7C0CE' : '#2D6BE4' }}>
          {paywalled ? 'Unlock →' : locked ? '' : active ? 'Continue →' : 'Review →'}
        </span>
      </div>
    </div>
  );
  if (locked && !paywalled) return card;
  return <Link to={to} style={{ textDecoration: 'none' }}>{card}</Link>;
}

function StatTile({ value, label, note, color }) {
  return (
    <div className="tm-card" style={{ flex: 1, padding: '20px 22px' }}>
      <div className="num" style={{ font: "800 30px/1 'Plus Jakarta Sans',sans-serif", color: color || '#0F1E33' }}>{value}</div>
      <div className="tm-stat-lbl">{label}</div>
      {note && <div style={{ marginTop: 6, font: "500 12px/1 'Plus Jakarta Sans',sans-serif", color: color || '#8494A8' }}>{note}</div>}
    </div>
  );
}

function Onboarding() {
  return (
    <div className="tm-card" style={{ padding: '26px 30px', marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div className="tm-h2">Before your first lesson</div>
          <div style={{ marginTop: 6, font: "500 15px/1.4 'Plus Jakarta Sans',sans-serif", color: '#4A5A70' }}>Three habits that make touch-typing stick. Two minutes now saves weeks later.</div>
        </div>
      </div>
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
        {[['01', 'Sit square, wrists up', 'Feet flat, back supported. Float your wrists — don’t rest them on the desk while typing.'],
          ['02', 'Anchor on F and J', 'Feel the raised bumps under each index finger. Every finger returns to its home key after a reach.'],
          ['03', 'Don’t look down', 'Keep your eyes on the screen. Accuracy first — speed follows on its own.']].map(([n, h, b]) => (
            <div key={n} style={{ background: 'var(--tm-panel)', border: '1px solid var(--tm-line)', borderRadius: 12, padding: 20 }}>
              <div style={{ font: '800 22px/1', color: '#0D2846' }}>{n}</div>
              <div style={{ marginTop: 12, font: "700 15px/1.2 'Plus Jakarta Sans',sans-serif" }}>{h}</div>
              <div style={{ marginTop: 8, font: "500 13px/1.5 'Plus Jakarta Sans',sans-serif", color: '#4A5A70' }}>{b}</div>
            </div>
        ))}
      </div>
    </div>
  );
}

export default function CourseMap() {
  const navigate = useNavigate();
  const { user, hasPass, launchFree } = useAuth();
  const [ver, setVer] = useState(0); // bumped after a server sync to re-read progress

  useEffect(() => {
    if (user) syncFromServer(api).then(() => setVer((v) => v + 1));
  }, [user]);

  const p = load();
  const stats = overallStats(p);
  const states = useMemo(() => MODULES.map((m) => moduleState(m, p)), [ver, user]); // eslint-disable-line react-hooks/exhaustive-deps
  const courseUnlocked = launchFree || hasPass;
  const isNew = stats.clearedLessons === 0;
  const resume = resumeModule(p);
  const heat = keyHeat(p);
  const goalPct = Math.min(100, Math.round((stats.currentWpm / 30) * 100));

  return (
    <div className="tm page" style={{ maxWidth: 1120, margin: '0 auto' }}>
      <Seo pathname="/learn/typing" />
      <div className="tm-eyebrow">Typing Master · new section</div>
      <h1 className="tm-h1" style={{ marginTop: 12 }}>Learn to touch-type</h1>
      <p className="tm-sub" style={{ marginTop: 12, maxWidth: 760 }}>
        Eleven modules from the home row to exam speed. Finish the path, then take the
        graded mock that puts you on the rank list.
      </p>

      {/* speed vs goal */}
      <div className="tm-card" style={{ marginTop: 24, padding: '18px 22px', maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="tm-stat-lbl">Current speed vs goal</span>
          <span className="num" style={{ font: "600 12px/1 'JetBrains Mono',monospace", color: stats.currentWpm >= 30 ? '#0E9F6E' : '#B47500' }}>{stats.currentWpm} / 30 WPM</span>
        </div>
        <div style={{ marginTop: 12, height: 10, borderRadius: 6, background: '#EEF1F6', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${goalPct}%`, background: stats.currentWpm >= 30 ? '#0E9F6E' : '#B47500', borderRadius: 6 }} />
        </div>
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', font: "500 11px/1 'Plus Jakarta Sans',sans-serif", color: '#8494A8' }}>
          <span className="num">0</span>
          <span style={{ color: '#4A5A70' }}>{Math.max(0, 30 - Math.floor(stats.currentWpm))} W.P.M. to the pass bar</span>
          <span className="num">30 goal</span>
        </div>
      </div>

      {isNew && <div style={{ marginTop: 32 }}><Onboarding /></div>}

      {/* finger legend + keyboard */}
      <div style={{ marginTop: 40 }} className="tm-eyebrow">The finger system</div>
      <div style={{ marginTop: 16, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <div className="tm-card" style={{ flex: 1, minWidth: 360, padding: '24px 26px' }}>
          <div style={{ font: "700 18px/1.2 'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.015em' }}>Eight muted finger hues</div>
          <div style={{ marginTop: 8, font: "500 14px/1.5 'Plus Jakarta Sans',sans-serif", color: '#4A5A70' }}>
            One hue per finger; thumbs share a neutral slate. Chosen away from the app’s
            navy, blue, mint, amber and rose so a tinted key never reads as a verdict.
          </div>
          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 22px' }}>
            {LEGEND.map(([f, keys]) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, background: FINGER[f], flex: 'none' }} />
                <span style={{ font: "600 13px/1 'Plus Jakarta Sans',sans-serif" }}>{FINGER_NAME[f]}</span>
                <span className="num" style={{ marginLeft: 'auto', font: "500 11px/1 'JetBrains Mono',monospace", color: '#8494A8' }}>{keys}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="tm-card" style={{ padding: '24px 26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Keyboard mode="tint" keySize={38} />
        </div>
      </div>

      {/* module grid */}
      <div style={{ marginTop: 44 }} className="tm-eyebrow">The path · 11 modules</div>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {MODULES.map((m, i) => <ModuleCard key={m.slug} module={m} state={states[i]} paywalled={!courseUnlocked && m.n >= 2} />)}
      </div>

      <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        {stats.courseDone
          ? <Link to="/mocks" className="tm-btn tm-btn-blue">Take the graded mock</Link>
          : (!courseUnlocked && resume.n >= 2)
            ? <Link to="/pass" className="tm-btn tm-btn-navy">Unlock the full course — ₹69</Link>
            : (
              <button type="button" className="tm-btn tm-btn-navy" onClick={() => navigate(`/learn/typing/m/${resume.slug}`)}>
                {isNew ? 'Start — Home row' : `Continue — ${resume.title}`}
              </button>
            )}
        <div style={{ font: "500 14px/1.4 'Plus Jakarta Sans',sans-serif", color: '#8494A8' }}>
          {courseUnlocked
            ? `You’re on module ${Math.min(stats.modulesCleared + 1, MODULES.length)} of ${MODULES.length}`
            : 'Home row is free · the full 11-module course is ₹69'}
          {stats.streak > 0 && <> · <span style={{ color: '#4A5A70' }}>{stats.streak}-day streak</span></>}
        </div>
      </div>

      {/* progress dashboard */}
      {!isNew && (
        <>
          <div style={{ marginTop: 48 }} className="tm-eyebrow">Your progress</div>
          <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <StatTile value={`${stats.modulesCleared}/${stats.totalModules}`} label="Modules cleared" />
            <StatTile value={stats.currentWpm} label="Current W.P.M." note={stats.currentWpm >= 30 ? 'At the goal' : `${Math.max(0, 30 - Math.floor(stats.currentWpm))} below the 30 goal`} color={stats.currentWpm >= 30 ? '#0E9F6E' : '#B47500'} />
            <StatTile value={`${stats.avgAccuracy}%`} label="Avg accuracy" note={stats.avgAccuracy >= 95 ? 'On target' : 'Aim for 95%'} color={stats.avgAccuracy >= 95 ? '#0E9F6E' : '#B47500'} />
            <StatTile value={stats.streak} label="Day streak" />
          </div>
          <div className="tm-card tm-card-lg" style={{ marginTop: 20, padding: '24px 26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ font: "700 16px/1 'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.015em' }}>Per-key accuracy</span>
              <span style={{ font: "500 12px/1 'Plus Jakarta Sans',sans-serif", color: '#8494A8' }}>from your attempts</span>
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', overflowX: 'auto' }}><Keyboard mode="heat" keySize={40} heat={heat} /></div>
            <div style={{ marginTop: 18, display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[['#E4F7EF', '#BFE9D6', '96%+ strong'], ['#FFF6E0', '#F0E0B0', '80–89% shaky'], ['#FDE9EB', '#F4C9CE', 'below 70% weak']].map(([bg, bd, t]) => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, background: bg, border: `1px solid ${bd}` }} />
                  <span style={{ font: "500 12px/1 'Plus Jakarta Sans',sans-serif", color: '#4A5A70' }}>{t}</span>
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
