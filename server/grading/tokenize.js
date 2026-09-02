// CANONICAL TOKENIZER — this file is kept BYTE-IDENTICAL in two places:
//   client/src/typing/tokenize.js  and  server/grading/tokenize.js
// If you change one, change the other in the SAME commit, or the live counter
// and the graded result will disagree (brief §5.2).
// Punctuation and case are PART of the token — do not strip them.
export function tokenize(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}
