// Touch-typing finger system — transcribed from the Typing Master design.
// Eight muted finger hues (thumbs share a neutral slate), chosen away from the
// semantic navy / blue / mint / amber / rose so a tinted key never reads as a verdict.

export const FINGER = {
  lp: '#7E62A8', // left pinky
  lr: '#2E8C8C', // left ring
  lm: '#6F9A55', // left middle
  li: '#B5892F', // left index
  ri: '#BF6A4A', // right index
  rm: '#C079A6', // right middle
  rr: '#5A7CA6', // right ring
  rp: '#9A7C86', // right pinky
  th: '#8A93A0', // thumbs (shared)
};

export const FINGER_NAME = {
  lp: 'Left pinky', lr: 'Left ring', lm: 'Left middle', li: 'Left index',
  ri: 'Right index', rm: 'Right middle', rr: 'Right ring', rp: 'Right pinky',
  th: 'Thumb',
};

// key (lowercase) -> finger id
export const KEY_FINGER = {};
const assign = (keys, f) => keys.split(' ').forEach((k) => { KEY_FINGER[k] = f; });
assign('1 q a z', 'lp');
assign('2 w s x', 'lr');
assign('3 e d c', 'lm');
assign('4 5 r t f g v b', 'li');
assign('6 7 y u h j n m', 'ri');
assign('8 i k ,', 'rm');
assign('9 o l .', 'rr');
assign('0 p ; /', 'rp');
KEY_FINGER[' '] = 'th';

export const KB_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
];

export const HOME_KEYS = new Set(['a', 's', 'd', 'f', 'j', 'k', 'l', ';']);

export const fingerOf = (ch) => KEY_FINGER[String(ch).toLowerCase()] || 'th';
export const fingerNameOf = (ch) => FINGER_NAME[fingerOf(ch)];
export const fingerColorOf = (ch) => FINGER[fingerOf(ch)];

// rgba() from a #rrggbb hex + alpha.
export function hexA(h, a) {
  const n = h.replace('#', '');
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`;
}
