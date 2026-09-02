import { describe, it, expect } from 'vitest';
import { typingRankable, excelRankable, overallMetric, validateHandle, daysSince } from './services/rank.js';
import { renderShareCard } from './services/shareCard.js';

const baseTyping = {
  mode: 'exam', durationSec: 600, isFirst: true, verified: true, listed: true,
  ssscWpm: 42, keyEvents: 2500, chars: 2400, medianIntervalMs: 180,
};

describe('typing rankability', () => {
  it('ranks a clean first exam attempt', () => {
    expect(typingRankable(baseTyping)).toEqual({ rankable: 1, status: 'complete' });
  });
  it('never ranks practice/drill mode', () => {
    expect(typingRankable({ ...baseTyping, mode: 'practice' }).rankable).toBe(0);
  });
  it('needs ≥570s of the 600s paper', () => {
    expect(typingRankable({ ...baseTyping, durationSec: 560 }).rankable).toBe(0);
  });
  it('only the first attempt ranks', () => {
    expect(typingRankable({ ...baseTyping, isFirst: false }).rankable).toBe(0);
  });
  it('needs a verified, listed candidate', () => {
    expect(typingRankable({ ...baseTyping, listed: false }).rankable).toBe(0);
    expect(typingRankable({ ...baseTyping, verified: false }).rankable).toBe(0);
  });
  it('quarantines anomalies (fast keystrokes / too few events / >120 wpm)', () => {
    expect(typingRankable({ ...baseTyping, medianIntervalMs: 20 })).toEqual({ rankable: 0, status: 'review' });
    expect(typingRankable({ ...baseTyping, keyEvents: 100, chars: 2400 }).status).toBe('review');
    expect(typingRankable({ ...baseTyping, ssscWpm: 130 }).status).toBe('review');
  });
});

describe('excel rankability', () => {
  it('ranks a first submission ≥120s after start', () => {
    expect(excelRankable({ elapsedSec: 200, isFirst: true, verified: true, listed: true }).rankable).toBe(1);
  });
  it('rejects a too-fast or repeat submission', () => {
    expect(excelRankable({ elapsedSec: 60, isFirst: true, verified: true, listed: true }).rankable).toBe(0);
    expect(excelRankable({ elapsedSec: 200, isFirst: false, verified: true, listed: true }).rankable).toBe(0);
  });
});

describe('overall metric (both halves capped)', () => {
  it('caps each half so neither can dominate', () => {
    expect(overallMetric(40, 8)).toBe(100); // both at the cap
    expect(overallMetric(80, 16)).toBe(100); // beyond the cap still 100
    expect(overallMetric(20, 4)).toBe(50); // half of each
    expect(overallMetric(0, 0)).toBe(0);
  });
});

describe('handle validation', () => {
  it('accepts sane handles', () => {
    expect(validateHandle('navdeep_v').ok).toBe(true);
    expect(validateHandle('gurpreet.s').ok).toBe(true);
  });
  it('rejects too short, bad chars, and profanity', () => {
    expect(validateHandle('a').ok).toBe(false);
    expect(validateHandle('has space').ok).toBe(false);
    expect(validateHandle('admin').ok).toBe(false);
  });
  it('daysSince returns Infinity for null', () => {
    expect(daysSince(null)).toBe(Infinity);
  });
});

describe('share card', () => {
  it('renders a non-trivial PNG buffer', () => {
    const png = renderShareCard({ percentileText: 'Top 18%', boardLabel: 'typing', metricText: '36.4', metricUnit: 'W.P.M.', handle: 'navdeep_v' });
    expect(Buffer.isBuffer(png)).toBe(true);
    expect(png.length).toBeGreaterThan(1000);
    expect(png.slice(0, 8).toString('hex')).toBe('89504e470d0a1a0a'); // PNG signature
  });
});
