// Client-side 1080×1350 result share card (deck artboard 14). Rendered to a
// <canvas> and saved as PNG so it survives WhatsApp compression. No leaderboard
// rows — this is the candidate's own result only.
export function downloadResultCard(result) {
  const W = 1080; const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#F5F7FB'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 60, 60, W - 120, H - 120, 32); ctx.fill();
  ctx.strokeStyle = '#E6EAF2'; ctx.lineWidth = 2;
  roundRect(ctx, 60, 60, W - 120, H - 120, 32); ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#8494A8'; ctx.font = '700 34px sans-serif';
  ctx.fillText('HIGH COURT CLERK CPT · TYPING', W / 2, 220);

  ctx.fillStyle = '#0D2846'; ctx.font = '800 220px sans-serif';
  ctx.fillText(Number(result.ssscWpm).toFixed(1), W / 2, 520);
  ctx.fillStyle = '#8494A8'; ctx.font = '700 40px sans-serif';
  ctx.fillText('S.S.S.C. W.P.M.', W / 2, 590);

  const pass = result.passed;
  ctx.fillStyle = pass ? '#0E9F6E' : '#D93B47';
  ctx.font = '800 52px sans-serif';
  ctx.fillText(pass ? '✓ Qualified' : '✕ Below the bar', W / 2, 720);

  // three figures
  const tiles = [
    [result.wordsTyped, 'Words'],
    [result.mistakesChar, 'Mistakes'],
    [`${result.accuracyPct}%`, 'Accuracy'],
  ];
  const tw = 280; const gap = 30; const startX = W / 2 - (tw * 3 + gap * 2) / 2; const ty = 860;
  tiles.forEach(([n, k], i) => {
    const x = startX + i * (tw + gap);
    ctx.fillStyle = '#F5F7FB'; roundRect(ctx, x, ty, tw, 170, 16); ctx.fill();
    ctx.fillStyle = '#0F1E33'; ctx.font = '700 64px sans-serif';
    ctx.fillText(String(n), x + tw / 2, ty + 90);
    ctx.fillStyle = '#8494A8'; ctx.font = '700 28px sans-serif';
    ctx.fillText(String(k).toUpperCase(), x + tw / 2, ty + 140);
  });

  ctx.fillStyle = '#8494A8'; ctx.font = '500 30px sans-serif';
  ctx.fillText('Practise both C.P.T. papers · first mock free', W / 2, 1220);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'clerk-cpt-result.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
