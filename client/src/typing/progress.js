// Typing Master progress. localStorage is the instant, offline-first store (works
// for guests and before a sync completes). For signed-in users it is best-merged
// with the server so progress survives a cleared browser and follows the account.
// Shape: { lessons:{slug:{bestAccuracy,bestWpm,stars,cleared,attempts,keyStats:{k:{correct,total}}}},
//          recentWpm:[], streak:{count,last}, updatedAt }
import { MODULES, TOTAL_LESSONS } from './courseContent.js';

const KEY = 'tm_progress_v1';
const empty = () => ({ lessons: {}, recentWpm: [], streak: { count: 0, last: null }, updatedAt: 0 });

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw);
    return { ...empty(), ...p, lessons: p.lessons || {} };
  } catch { return empty(); }
}

function save(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode / quota — non-fatal */ }
}

const todayStr = () => new Date().toISOString().slice(0, 10);

function mergeKeyStats(a = {}, b = {}) {
  const out = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[k] || { correct: 0, total: 0 };
    const y = b[k] || { correct: 0, total: 0 };
    // take the richer sample (more totals) rather than summing, to stay sync-safe
    out[k] = (y.total > x.total) ? y : x;
  }
  return out;
}

function bestLesson(a, b) {
  if (!a) return b; if (!b) return a;
  return {
    bestAccuracy: Math.max(a.bestAccuracy || 0, b.bestAccuracy || 0),
    bestWpm: Math.max(a.bestWpm || 0, b.bestWpm || 0),
    stars: Math.max(a.stars || 0, b.stars || 0),
    cleared: !!(a.cleared || b.cleared),
    attempts: Math.max(a.attempts || 0, b.attempts || 0),
    keyStats: (a.attempts || 0) >= (b.attempts || 0) ? mergeKeyStats(a.keyStats, b.keyStats) : mergeKeyStats(b.keyStats, a.keyStats),
  };
}

// Record a finished attempt into localStorage (instant). Returns the lesson entry
// so the caller can push it to the server when signed in.
export function recordAttempt(lessonSlug, { accuracy, wpm, cleared, stars, keyStats }) {
  const p = load();
  const prev = p.lessons[lessonSlug] || { bestAccuracy: 0, bestWpm: 0, stars: 0, cleared: false, attempts: 0, keyStats: {} };
  const nextKeyStats = { ...(prev.keyStats || {}) };
  for (const [k, v] of Object.entries(keyStats || {})) {
    const cur = nextKeyStats[k] || { correct: 0, total: 0 };
    nextKeyStats[k] = { correct: cur.correct + v.correct, total: cur.total + v.total };
  }
  p.lessons[lessonSlug] = {
    bestAccuracy: Math.max(prev.bestAccuracy, Math.round(accuracy)),
    bestWpm: Math.max(prev.bestWpm, Math.round(wpm * 10) / 10),
    stars: Math.max(prev.stars, stars),
    cleared: prev.cleared || cleared,
    attempts: prev.attempts + 1,
    keyStats: nextKeyStats,
  };
  p.recentWpm = [...(p.recentWpm || []), Math.round(wpm * 10) / 10].slice(-8);
  const t = todayStr();
  if (p.streak.last !== t) {
    const yest = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    p.streak = { count: p.streak.last === yest ? p.streak.count + 1 : 1, last: t };
  }
  p.updatedAt = Date.now();
  save(p);
  return p.lessons[lessonSlug];
}

// Best-merge a server lessons map into localStorage. Returns the merged progress.
export function mergeServer(serverLessons = {}) {
  const p = load();
  for (const slug of new Set([...Object.keys(p.lessons), ...Object.keys(serverLessons)])) {
    p.lessons[slug] = bestLesson(p.lessons[slug], serverLessons[slug]);
  }
  p.updatedAt = Date.now();
  save(p);
  return p;
}

// Lessons shaped for the server POST.
export function toServerLessons(p = load()) {
  return Object.entries(p.lessons).map(([slug, l]) => ({
    slug,
    bestAccuracy: l.bestAccuracy || 0,
    bestWpm: l.bestWpm || 0,
    stars: l.stars || 0,
    cleared: !!l.cleared,
    attempts: l.attempts || 0,
    keyStats: l.keyStats || {},
  }));
}

export function moduleState(module, p = load()) {
  const idx = MODULES.findIndex((m) => m.slug === module.slug);
  const cleared = (m) => m.lessons.every((l) => p.lessons[l.slug]?.cleared);
  const prevCleared = idx === 0 || cleared(MODULES[idx - 1]);
  if (!prevCleared) return 'locked';
  if (cleared(module)) return 'done';
  return 'active';
}

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
  const cleared = module.lessons.filter((l) => p.lessons[l.slug]?.cleared).length;
  if (!cleared) return 0;
  const s = module.lessons.map((l) => p.lessons[l.slug]?.stars || 0);
  return Math.round(s.reduce((a, b) => a + b, 0) / module.lessons.length);
}

export function keyHeat(p = load()) {
  const agg = {};
  for (const l of Object.values(p.lessons)) {
    for (const [k, v] of Object.entries(l.keyStats || {})) {
      const cur = agg[k] || { correct: 0, total: 0 };
      agg[k] = { correct: cur.correct + v.correct, total: cur.total + v.total };
    }
  }
  const out = {};
  for (const [k, v] of Object.entries(agg)) out[k] = v.total ? Math.round((v.correct / v.total) * 100) : null;
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

export function resumeModule(p = load()) {
  const active = MODULES.find((m) => moduleState(m, p) === 'active');
  return active || MODULES[MODULES.length - 1];
}

// Pull the server's progress (signed-in) and merge it locally. Best-effort.
export async function syncFromServer(api) {
  try {
    const { lessons } = await api.getTypingProgress();
    const merged = mergeServer(lessons || {});
    // push the merged set back so the server catches any local-only progress
    api.saveTypingProgress(toServerLessons(merged)).catch(() => {});
    return merged;
  } catch { return load(); }
}
