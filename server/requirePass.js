// The ONE place entitlements are checked (brief §5.5). Used at /excel/start and
// for gated content only — never in React. A hidden button is not a paywall.
import { getUserId } from './auth.js';
import { hasActivePass } from './services/entitlements.js';

export async function requirePass(req, res, next) {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Sign in to use the pass.', needsAuth: true });
  }
  if (!(await hasActivePass(userId))) {
    return res.status(402).json({ error: 'This needs the ₹119 pass.', paywall: true });
  }
  return next();
}

// Inline check for routes that allow a free item but gate the rest.
export async function passOk(req) {
  const userId = getUserId(req);
  return userId ? hasActivePass(userId) : false;
}
