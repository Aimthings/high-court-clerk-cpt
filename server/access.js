// Formula access map (deck artboard 29·L — locked preview).
//
// All 37 formulas always exist. This module decides, for a visitor who has NOT
// bought Excel practice, which formulas are FREE (open), which are LOCKED
// (visible with a lock chip, click opens the upsell) and which are HIDDEN
// (absent from the list entirely). Only buyers of the Formula Library capability
// see every formula unlocked — the free launch does NOT unlock formulas (product
// decision: formulas stay on the free/locked map at all times).

import { getUserId } from './auth.js';
import { hasCapability } from './services/entitlements.js';
import { CAPS } from './config.js';

// The free set: the first formula of each track, plus the early Math & stats
// and Text formulas, exactly as the finalized locked-preview artboard shows.
export const FREE_FORMULAS = new Set([
  'sum', 'average', 'count', 'counta', 'countblank', 'max', // Math & stats
  'if',                                                     // Logical
  'sumif',                                                  // Conditional totals
  'len', 'upper', 'lower', 'proper', 'left',               // Text
  'vlookup',                                               // Lookup & reference
  'today',                                                 // Date
  'sumproduct',                                            // Advanced
]);

// Hidden outright from non-buyers (Lookup section then shows 2 formulas).
export const HIDDEN_FORMULAS = new Set(['index', 'match', 'index-match']);

export const isFreeFormula = (slug) => FREE_FORMULAS.has(slug);
export const isHiddenFormula = (slug) => HIDDEN_FORMULAS.has(slug);

// Does this request come from someone who may open EVERY formula?
// Only a holder of the Formula Library capability (Excel Complete / All-Access).
// The free launch does NOT unlock formulas — the locked preview always applies to
// non-buyers, so signed-in visitors during the launch still see free/locked.
export async function hasExcelAccess(req) {
  const userId = getUserId(req);
  if (!userId) return false;
  try {
    return await hasCapability(userId, CAPS.FORMULA_LIBRARY);
  } catch {
    return false; // DB hiccup: fail closed to the locked preview, never crash
  }
}
