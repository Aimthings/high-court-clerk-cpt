// Entitlement gates (brief §5.5). While LAUNCH_FREE is on, everything is unlocked
// for everyone. When it is off, a gated resource needs the matching capability.
// A hidden button is not a paywall — these run on the server for gated resources.
import { getUserId } from './auth.js';
import { hasActivePass, hasCapability } from './services/entitlements.js';
import { LAUNCH_FREE } from './config.js';

// Inline check: does this request hold `cap` (or is the launch free)?
export async function capabilityOk(req, cap) {
  if (LAUNCH_FREE) return true;
  const userId = getUserId(req);
  if (!userId) return false;
  return hasCapability(userId, cap);
}

// Middleware: require a specific capability for a route.
export function requireCapability(cap) {
  return async (req, res, next) => {
    if (LAUNCH_FREE) return next();
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Sign in to unlock this.', needsAuth: true });
    if (!(await hasCapability(userId, cap))) {
      return res.status(402).json({ error: 'This needs a purchase to unlock.', paywall: true, cap });
    }
    return next();
  };
}

// Legacy generic pass check (any active entitlement), still honouring the launch.
export async function passOk(req) {
  if (LAUNCH_FREE) return true;
  const userId = getUserId(req);
  return userId ? hasActivePass(userId) : false;
}
