// Formula access map (deck artboard 29·L — locked preview).
//
// All 37 formulas always exist. This module decides, for a visitor who has NOT
// bought Excel practice, which formulas are FREE (open), which are LOCKED
// (visible with a lock chip, click opens the upsell) and which are HIDDEN
// (absent from the list entirely). Buyers — and everyone during the free
// launch — see every formula unlocked.

import { capabilityOk } from './requirePass.js';
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
// Unlocked while the launch is free, or for anyone holding the Formula Library
// capability (Excel Complete / All-Access). Otherwise the locked preview applies.
export async function hasExcelAccess(req) {
  try {
    return await capabilityOk(req, CAPS.FORMULA_LIBRARY);
  } catch {
    return false; // DB hiccup: fail closed to the locked preview, never crash
  }
}
