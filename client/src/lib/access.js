// Free-launch access gating (client side of the soft block).
//
// During the launch period LAUNCH_FREE is true and nothing is ever blocked.
// When the operator flips it to false, the free allowances below apply and the
// Upsell soft block (deck artboard 32) appears once an allowance is spent.
// This is the client half only — the server remains the source of truth for a
// paid entitlement; the counters here are a friendly nudge, not a paywall.
//
// Allowances (deck artboard 33): 5 typing mocks · 1 Excel mock · 7 formulas.

export const LAUNCH_FREE = true;

export const FREE_LIMITS = {
  formulas: 7,
  typing: 5,
  excelMock: 1,
};

const KEY = 'hcc.free.practicedFormulas';

// Distinct formula slugs the guest has practised (checked at least once).
function practiced() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

export function formulaPracticeCount() {
  return practiced().length;
}

// Record a practice for `slug`; returns the new distinct count. Idempotent per slug.
export function recordFormulaPractice(slug) {
  const list = practiced();
  if (!list.includes(slug)) {
    list.push(slug);
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* private mode */ }
  }
  return list.length;
}

// Is this formula still open to a free guest? Already-practised formulas stay
// open (work is saved); only a brand-new formula past the cap is blocked.
export function formulaLocked(slug, hasEntitlement = false) {
  if (LAUNCH_FREE || hasEntitlement) return false;
  const list = practiced();
  if (list.includes(slug)) return false;
  return list.length >= FREE_LIMITS.formulas;
}
