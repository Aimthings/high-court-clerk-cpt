// Generates client/public/og.png — the 1200x630 social share banner referenced
// by og:image / twitter:image. Run once (or whenever the brand copy changes):
//   node client/scripts/makeOg.mjs
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const W = 1200; const H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Background — deep navy with a subtle diagonal accent panel.
ctx.fillStyle = '#0D2846';
ctx.fillRect(0, 0, W, H);
ctx.fillStyle = 'rgba(45,107,228,0.14)';
ctx.beginPath();
ctx.moveTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(W - 460, H); ctx.closePath();
ctx.fill();

// Accent bar.
ctx.fillStyle = '#2D6BE4';
ctx.fillRect(80, 150, 90, 10);

// Eyebrow.
ctx.fillStyle = '#9DB2D6';
ctx.font = '600 30px Arial';
ctx.fillText('PUNJAB & HARYANA HIGH COURT · S.S.S.C. CLERK C.P.T.', 80, 130);

// Title (two lines).
ctx.fillStyle = '#FFFFFF';
ctx.font = '800 82px Arial';
ctx.fillText('High Court Clerk', 78, 296);
ctx.font = '800 72px Arial';
ctx.fillText('Typing & Excel Practice', 78, 388);

// Sub line.
ctx.fillStyle = '#CBD5E8';
ctx.font = '500 34px Arial';
ctx.fillText('30 W.P.M. typing · Excel out of 10 · a fresh mock every day', 80, 470);

// Footer URL chip.
ctx.fillStyle = '#2D6BE4';
ctx.font = '700 34px Arial';
ctx.fillText('highcourtexam.online', 80, 552);

mkdirSync(join(here, '..', 'public'), { recursive: true });
const out = join(here, '..', 'public', 'og.png');
writeFileSync(out, canvas.toBuffer('image/png'));
console.log('wrote', out);
