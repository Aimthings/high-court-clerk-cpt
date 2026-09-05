// Pure scoring + ranking maths for the Rank Predictor. Deterministic.

// Score a parsed sheet against a marking scheme. Returns totals + per-section.
export function scoreSheet(questions, marking) {
  const sec = {};
  let correct = 0; let wrong = 0; let left = 0; let answered = 0;
  for (const q of questions) {
    const name = q.section || 'General';
    sec[name] = sec[name] || { correct: 0, wrong: 0, left: 0, total: 0 };
    sec[name].total += 1;
    const attempted = q.chosen && q.chosen !== '--';
    if (!attempted) { left += 1; sec[name].left += 1; continue; }
    answered += 1;
    if (String(q.correct) === String(q.chosen)) { correct += 1; sec[name].correct += 1; }
    else { wrong += 1; sec[name].wrong += 1; }
  }
  const totalQ = questions.length;
  const round2 = (n) => Math.round(n * 100) / 100;
  const sections = Object.entries(sec).map(([name, s]) => ({
    name,
    correct: s.correct, wrong: s.wrong, left: s.left, total: s.total,
    score: round2(s.correct * marking.pos - s.wrong * marking.neg),
    max: round2(s.total * marking.pos),
    acc: (s.correct + s.wrong) ? Math.round((s.correct / (s.correct + s.wrong)) * 100) : 0,
  }));
  return {
    totalQ, answered, correct, wrong, left,
    score: round2(correct * marking.pos - wrong * marking.neg),
    rawScore: round2(correct * marking.pos),
    negLost: round2(wrong * marking.neg),
    maxScore: round2(totalQ * marking.pos),
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    sections,
  };
}

const scoreAtPct = (sortedDesc, pct) => {
  if (!sortedDesc.length) return 0;
  const idx = Math.min(sortedDesc.length - 1, Math.max(0, Math.floor(pct * sortedDesc.length)));
  return sortedDesc[idx];
};

// Rank/percentile/cohort/cutoff from the pool of scores in the same exam+category.
export function poolStats(scores, myScore, { totalCandidates = 0 } = {}) {
  const n = scores.length;
  const below = scores.filter((s) => s < myScore).length;
  const better = scores.filter((s) => s > myScore).length;
  const poolRank = better + 1;
  const percentile = n > 1 ? Math.round((below / (n - 1)) * 100) : 100;
  const mean = n ? scores.reduce((a, b) => a + b, 0) / n : myScore;
  const sd = n > 1 ? Math.sqrt(scores.reduce((a, b) => a + (b - mean) ** 2, 0) / n) : Math.max(1, myScore * 0.15);
  const sortedDesc = [...scores].sort((a, b) => b - a);
  const top10 = scoreAtPct(sortedDesc, 0.1);

  let projected = null;
  if (totalCandidates > 0 && n > 0) {
    const est = Math.max(1, Math.round((poolRank / n) * totalCandidates));
    projected = { lo: Math.max(1, Math.round(est * 0.85)), hi: Math.round(est * 1.15), total: totalCandidates };
  }

  // Rough cutoff band from the pool (labelled an estimate in the UI).
  const cutHi = scoreAtPct(sortedDesc, 0.70);
  const cutLo = scoreAtPct(sortedDesc, 0.78);
  const cutoff = { lo: Math.round(Math.min(cutLo, cutHi)), hi: Math.round(Math.max(cutLo, cutHi)) };

  let verdict = 'unlikely';
  if (percentile >= 85) verdict = 'safe';
  else if (percentile >= 60) verdict = 'borderline';

  return {
    poolSize: n, poolRank, percentile,
    mean: Math.round(mean * 10) / 10, sd: Math.round(sd * 10) / 10, top10: Math.round(top10 * 10) / 10,
    projected, cutoff, verdict,
  };
}
