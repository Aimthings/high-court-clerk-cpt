// 1080×1350 share card (brief §5). Percentile at ~200px, heavy weights, nothing
// under 28px so it survives WhatsApp compression. NO leaderboard rows — never
// publish anyone else's position in a shareable image.
import { createCanvas } from '@napi-rs/canvas';

const W = 1080;
const H = 1350;
const NAVY = '#0D2846';
const INK3 = '#8494A8';
const MINT = '#0E9F6E';
const CANVAS_BG = '#F5F7FB';
const HAIRLINE = '#E6EAF2';

export function renderShareCard({ percentileText, boardLabel, metricText, metricUnit, handle }) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, 0, W, H);

  // card
  const m = 60;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, m, m, W - 2 * m, H - 2 * m, 32);
  ctx.fill();
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 2;
  roundRect(ctx, m, m, W - 2 * m, H - 2 * m, 32);
  ctx.stroke();

  ctx.textAlign = 'center';

  // eyebrow
  ctx.fillStyle = INK3;
  ctx.font = '700 34px sans-serif';
  ctx.fillText('HIGH COURT CLERK CPT', W / 2, 220);

  // percentile hero
  ctx.fillStyle = NAVY;
  ctx.font = '800 200px sans-serif';
  ctx.fillText(percentileText, W / 2, 500);

  ctx.fillStyle = INK3;
  ctx.font = '700 40px sans-serif';
  ctx.fillText(boardLabel.toUpperCase(), W / 2, 580);

  // metric
  ctx.fillStyle = MINT;
  ctx.font = '800 120px sans-serif';
  ctx.fillText(metricText, W / 2, 820);
  ctx.fillStyle = INK3;
  ctx.font = '700 40px sans-serif';
  ctx.fillText(metricUnit, W / 2, 890);

  // handle
  ctx.fillStyle = NAVY;
  ctx.font = '700 48px sans-serif';
  ctx.fillText(`@${handle}`, W / 2, 1120);

  ctx.fillStyle = INK3;
  ctx.font = '500 30px sans-serif';
  ctx.fillText('Practise both C.P.T. papers · first mock free', W / 2, 1220);

  return canvas.toBuffer('image/png');
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
