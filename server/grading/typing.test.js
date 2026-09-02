import { describe, it, expect } from 'vitest';
import { scoreTyping } from './typing.js';
import { tokenize } from './tokenize.js';

const words = (n, w = 'notice') => Array.from({ length: n }, () => w).join(' ');

describe('SSSC typing scorer', () => {
  it('a perfect 360-word submission over 600s scores 36.00', () => {
    const passage = words(360);
    const r = scoreTyping({ passage, typed: passage, durationSec: 600 });
    expect(r.wordsTyped).toBe(360);
    expect(r.mistakesWord).toBe(0);
    expect(r.mistakesChar).toBe(0);
    expect(r.ssscWpm).toBe(36.0);
    expect(r.passed).toBe(true);
  });

  it('one word dropped mid-passage does not mark every later word wrong', () => {
    const ref = ['the', 'high', 'court', 'of', 'punjab', 'and', 'haryana', 'at', 'chandigarh', 'today'];
    const typed = [...ref.slice(0, 4), ...ref.slice(5)]; // drop 'punjab' (index 4)
    const r = scoreTyping({ passage: ref.join(' '), typed: typed.join(' '), durationSec: 600 });
    // A single dropped word is not a word-model mistake, and must not cascade.
    expect(r.mistakesWord).toBe(0);
    expect(r.taxonomy.dropped).toBe(1);
    expect(r.wordsTyped).toBe(9);
  });

  it('one word inserted mid-passage does not mark every later word wrong', () => {
    const ref = ['the', 'high', 'court', 'of', 'punjab', 'and', 'haryana'];
    const typed = ['the', 'high', 'XXX', 'court', 'of', 'punjab', 'and', 'haryana'];
    const r = scoreTyping({ passage: ref.join(' '), typed: typed.join(' '), durationSec: 600 });
    expect(r.mistakesWord).toBe(1); // just the extra token
    expect(r.taxonomy.extra).toBe(1);
    expect(r.wordsTyped).toBe(8);
  });

  it('a case-only difference counts in the word model', () => {
    const r = scoreTyping({ passage: 'The Court', typed: 'the Court', durationSec: 600 });
    expect(r.mistakesWord).toBe(1);
    expect(r.taxonomy.capitalisation).toBe(1);
  });

  it('a punctuation-only difference counts in the word model', () => {
    const r = scoreTyping({ passage: 'order,', typed: 'order', durationSec: 600 });
    expect(r.mistakesWord).toBe(1);
    expect(r.taxonomy.punctuation).toBe(1);
  });

  it('an empty submission scores 0 without dividing by zero', () => {
    const r = scoreTyping({ passage: words(300), typed: '', durationSec: 600 });
    expect(r.wordsTyped).toBe(0);
    expect(r.mistakesWord).toBe(0);
    expect(r.ssscWpm).toBe(0);
    expect(Number.isFinite(r.ssscWpm)).toBe(true);
    expect(r.passed).toBe(false);
  });

  it('a submission longer than the passage counts the extras as mistakes', () => {
    const r = scoreTyping({ passage: 'first second third', typed: 'first second third fourth fifth', durationSec: 600 });
    expect(r.wordsTyped).toBe(5);
    expect(r.taxonomy.extra).toBe(2);
    expect(r.mistakesWord).toBeGreaterThanOrEqual(2);
  });

  it('the char model is never below the word model', () => {
    const passage = 'The High Court of Punjab and Haryana, at Chandigarh, disposed of the petition.';
    const typed = 'the Hihg Cort of punjab and Haryana at Chandigarh disposedd of teh petiton'; // messy
    const r = scoreTyping({ passage, typed, durationSec: 600 });
    expect(r.mistakesChar).toBeGreaterThanOrEqual(r.mistakesWord);
  });

  it('uses the SSSC formula (words - mistakes) / minutes, not gross WPM', () => {
    // 200 typed words, 20 word-mistakes, 10 minutes -> (200-20)/10 = 18.0
    const ref = words(200, 'court');
    const typed = tokenize(ref).map((w, i) => (i < 20 ? 'wrongo' : w)).join(' ');
    const r = scoreTyping({ passage: ref, typed, durationSec: 600 });
    expect(r.wordsTyped).toBe(200);
    expect(r.mistakesWord).toBe(20);
    expect(r.ssscWpmWord).toBe(18.0);
  });
});
