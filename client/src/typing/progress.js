// Typing Master progress — stored per-browser in localStorage (the course is
// practice, never rankable, so it lives client-side and needs no account).
// Shape: { lessons:{slug:{bestAccuracy,bestWpm,stars,cleared,attempts}},
//          keys:{key:{correct,total}}, recentWpm:[], streak:{count,last}, updatedAt }
import { MODULES, TOTAL_LESSONS } from './courseContent.js';

const KEY = 'tm_progress_v1';
const empty = () => ({ lessons: {}, keys: {}, recentWpm: [], streak: { count: 0, last: null }, updatedAt: 0 });

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw);
    return { ...empty(), ...p, lessons: p.lessons || {}, keys: p.keys || {} };
  } catch { return empty(); }
}

function save(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode / quota — non-fatal */ }
}

const todayStr = () => new Date().toISOString().slice(0, 10);

// Record a finished attempt. keyStats: { key: {correct, total} }.
export function recordAttempt(lessonSlug, { accuracy, wpm, cleared, stars, keyStats }) {
  const p = load();
  const prev = p.lessons[lessonSlug] || { bestAccuracy: 0, bestWpm: 0, stars: 0, cleared: false, attempts: 0 };
  p.lessons[lessonSlug] = {
    bestAccuracy: Math.max(prev.bestAccuracy, Math.round(accuracy)),
    bestWpm: Math.max(prev.bestWpm, Math.round(wpm * 10) / 10),
    stars: Math.max(prev.stars, stars),
    cleared: prev.cleared || cleared,
    attempts: prev.attempts + 1,
  };
  for (const [k, v] of Object.entries(keyStats || {})) {
    const cur = p.keys[k] || { correct: 0, total: 0 };
    cur.correct += v.correct; cur.total += v.total;
    p.keys[k] = cur;
  }
  p.recentWpm = [...(p.recentWpm || []), Math.round(wpm * 10) / 10].slice(-8);
  // streak
  const t = todayStr();
  if (p.streak.last !== t) {
    const yest = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    p.streak = { count: p.streak.last === yest ? p.streak.count + 1 : 1, last: t };
  }
  p.updatedAt = Date.now();
  save(p);
  return p;
}

// 'done' | 'active' | 'locked' for a module, given progress.
export function moduleState(module, p = load()) {
  const idx = MODULES.findIndex((m) => m.slug === module.slug);
  const cleared = (m) => m.lessons.every((l) => p.lessons[l.slug]?.cleared);
  const prevCleared = idx === 0 || cleared(MODULES[idx - 1]);
  if (!prevCleared) return 'locked';
  if (cleared(module)) return 'done';
  return 'active';
}

// 'done' | 'active' | 'locked' for each lesson in a module.
export function lessonStates(module, p = load()) {
  const mState = moduleState(module, p);
  let activeGiven = false;
  return module.lessons.map((l) => {
    const done = !!p.lessons[l.slug]?.cleared;
    if (done) return 'done';
    if (mState !== 'locked' && !activeGiven) { activeGiven = true; return 'active'; }
    return 'locked';
  });
}

export function modulePct(module, p = load()) {
  const done = module.lessons.filter((l) => p.lessons[l.slug]?.cleared).length;
  return Math.round((done / module.lessons.length) * 100);
}
export function moduleStars(module, p = load()) {
  const s = module.lessons.map((l) => p.lessons[l.slug]?.stars || 0);
  const cleared = module.lessons.filter((l) => p.lessons[l.slug]?.cleared).length;
  if (!cleared) return 0;
  return Math.round(s.reduce((a, b) => a + b, 0) / module.lessons.length);
}

export function keyHeat(p = load()) {
  const out = {};
  for (const [k, v] of Object.entries(p.keys)) out[k] = v.total ? Math.round((v.correct / v.total) * 100) : null;
  return out;
}

export function overallStats(p = load()) {
  const clearedLessons = Object.values(p.lessons).filter((l) => l.cleared).length;
  const modulesCleared = MODULES.filter((m) => moduleState(m, p) === 'done').length;
  const recent = p.recentWpm || [];
  const currentWpm = recent.length ? Math.round((recent.reduce((a, b) => a + b, 0) / recent.length) * 10) / 10 : 0;
  const accs = Object.values(p.lessons).map((l) => l.bestAccuracy).filter(Boolean);
  const avgAccuracy = accs.length ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : 0;
  const courseDone = modulesCleared === MODULES.length;
  return {
    clearedLessons, totalLessons: TOTAL_LESSONS, modulesCleared, totalModules: MODULES.length,
    currentWpm, avgAccuracy, streak: p.streak?.count || 0, recentWpm: recent, courseDone,
  };
}

// The module to resume: first non-done unlocked module, else the last.
export function resumeModule(p = load()) {
  const active = MODULES.find((m) => moduleState(m, p) === 'active');
  return active || MODULES[MODULES.length - 1];
}
