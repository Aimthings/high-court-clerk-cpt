# High Court Clerk CPT — repo rules

Practice platform for the **Computer Proficiency Test (C.P.T.)**, the qualifying
practical stage of the Punjab & Haryana High Court / S.S.S.C. Clerk recruitment.
React (client) + Node/Express (server) + MySQL 8, deployed on a Hostinger KVM VPS.

## Exam facts — NEVER "correct" these
- **Typing:** `W.P.M. = (words typed − mistakes) ÷ minutes`, pass at 30. This is the
  S.S.S.C. rule — NOT gross WPM, NOT net WPM. Never substitute a conventional formula.
  Compute and store BOTH mistake models (word + char); display the stricter (char) by default.
- **Excel:** 5 gradeable parts × 2 marks = 10, pass at 4. One scenario with lettered
  sub-parts on an EMPTY sheet. Excel 2007 compatible (no XLOOKUP/IFS/TEXTJOIN/FILTER/
  dynamic arrays/pivots/macros; max one nesting level).
- Both papers are qualifying; marks do not enter the merit list.
- Never claim practice content is real exam material. Label it "practice material built
  from the official S.S.S.C. C.P.T. criteria".

## Engineering rules
1. All scoring runs on the SERVER (`server/grading/`). The client may show a live
   counter, never a final score.
2. `tokenize.js` must be byte-identical in `client/src/typing/` and `server/grading/`.
3. Answer keys never reach the browser before submission.
4. Elapsed time is always derived server-side from `started_at`.
5. Entitlements are checked in ONE middleware (`requirePass`), at `/excel/start` only.
6. All SQL parameterised. No string interpolation into queries.
7. Amounts are server-side constants in paise (`11900`). Never read a price from a request.
8. Razorpay webhook: `express.raw()` before `express.json()`, HMAC via `timingSafeEqual`,
   idempotent on unique `razorpay_payment_id`, always 200. Reconcile stale orders after 15 min.
9. Never commit `.env`, real keys, or a DB dump.
10. No AI/LLM in the grading path — grading is deterministic.

## Design
- Source of truth: `client/src/styles/tokens.css` (transcribed from the "Daylight" deck).
  Never hardcode a colour/radius/shadow/type size — use a token. Do not edit tokens.css
  to make a screen match; surface the discrepancy.
- Navy is ONLY a button fill. Blue is ONLY a link/active tab. One navy button per screen.
- Status colour lives in the VALUE, never the label; verdicts pair colour + word + glyph.
- Radius ladder 16/12/8. Card = 1px hairline + lightest shadow.
- Every judged figure uses `font-variant-numeric: tabular-nums`. Prices use Indian grouping.
- Exam mode drops the canvas tint to full white; the Excel paper pane is serif on warm white.
- No Tailwind, no UI kit, no CSS-in-JS, no chart library (hand-roll SVG).

## Copy
Plain, specific, no exclamation marks, no fake scarcity, no struck-through prices.
Buttons say what happens ("Take a free mock"). "W.P.M." in labels, "WPM" inline in prose.

## Layout
- `client/` React 18 + Vite + react-router v6; `server/` Node 20 + Express 4.
- Public routes are prerendered to static HTML (`client/prerender.js`) for SEO.
- Build: `npm run build` (client build + prerender). Dev: `npm run dev`.

## Phase status
- Phase 1 (scaffold, tokens, public routes, prerender): DONE.
- Phases 2–7: see the build brief. One phase per session.
