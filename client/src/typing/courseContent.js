// Typing Master curriculum — 11 modules, beginner-first. Content is client-side
// (a typing trainer is fully real-time; there are no secret answers). Each lesson
// declares the new keys, the finger + tip, and a drill spec; buildTarget() produces
// a fresh target string per attempt so practice never gets memorised.

const rnd = (n) => Math.floor(Math.random() * n);
const pickN = (arr, n) => { const out = []; for (let i = 0; i < n; i += 1) out.push(arr[rnd(arr.length)]); return out; };

// Grouped single-key drill, e.g. "fjf jfj ffj jjf" from a pool.
function keyGroups(pool, groups = 8, len = 3) {
  const out = [];
  for (let g = 0; g < groups; g += 1) {
    let word = '';
    for (let i = 0; i < len; i += 1) word += pool[rnd(pool.length)];
    out.push(word);
  }
  return out.join(' ');
}

const HOME_WORDS = ['ask', 'add', 'dad', 'fall', 'flask', 'salad', 'gash', 'half', 'hall', 'lag', 'sad', 'lad', 'fad', 'gala', 'flag', 'dash', 'lads', 'shall', 'glass', 'asks', 'falls', 'jak', 'gaff', 'had', 'has'];
const TOP_WORDS = ['type', 'quiet', 'power', 'their', 'write', 'query', 'proper', 'rope', 'wire', 'tore', 'pity', 'requite', 'output', 'either', 'toppr', 'reply', 'party', 'point', 'group', 'quite'];
const BOTTOM_WORDS = ['van', 'cab', 'numb', 'zinc', 'brave', 'comma', 'vibe', 'mix', 'zoom', 'crazy', 'name', 'move', 'combine', 'vacant', 'number', 'convey', 'maze', 'civic', 'buzz', 'vex'];
const COMMON_WORDS = ['the', 'and', 'for', 'you', 'that', 'with', 'have', 'this', 'from', 'they', 'will', 'would', 'there', 'their', 'what', 'about', 'which', 'when', 'make', 'like', 'time', 'just', 'know', 'take', 'into', 'year', 'your', 'good', 'some', 'them', 'other', 'than', 'then', 'look', 'only', 'come', 'over', 'think', 'also', 'back', 'after', 'work', 'first', 'well', 'even', 'want', 'because', 'these', 'give', 'most'];

const CAP_WORDS = ['Delhi', 'India', 'Punjab', 'Court', 'Clerk', 'Ravi', 'Simran', 'Amit', 'Kaur', 'Singh', 'Monday', 'August', 'Chandigarh', 'Haryana', 'Notice', 'Exam'];
const SENTENCES = [
  'the clerk filed every notice before the court opened.',
  'she typed the report and saved it without a single error.',
  'a steady hand and a calm mind beat raw speed every time.',
  'practice each row until your fingers find the keys alone.',
  'good posture and light touch make long passages easy.',
];
const EXAM_TEXT = 'The Computer Proficiency Test rewards a calm, steady rhythm over raw speed. Keep your eyes on the copy, let each finger return to its home key, and correct nothing you cannot see. Accuracy first; the words per minute will follow on their own as your hands learn the board and stop hunting for letters.';

// Build the target text for a fresh attempt at a lesson.
export function buildTarget(lesson) {
  const d = lesson.drill;
  if (d.type === 'keys') return keyGroups(d.pool, d.groups || 8, d.len || 3);
  if (d.type === 'words') return pickN(d.words, d.count || 14).join(' ');
  if (d.type === 'text') return d.text;
  if (d.type === 'sentences') return pickN(d.sentences, d.count || 2).join(' ');
  return '';
}

const L = (slug, title, meta, newKeys, finger, tip, drill) => ({ slug, title, meta, newKeys, finger, tip, drill });

export const MODULES = [
  {
    n: 1, slug: 'home-row', title: 'Home row', goal: 'Anchor A S D F J K L ; without looking.',
    lessons: [
      L('fj', 'Lesson 1 · F and J', 'Find home with your index fingers', ['f', 'j'], 'Index', 'Feel the bumps on F and J — your anchors. Never look down.', { type: 'keys', pool: ['f', 'j'], groups: 10, len: 3 }),
      L('dk', 'Lesson 2 · D and K', 'Middle fingers reach in', ['d', 'k'], 'Middle', 'Reach with the middle finger and let it fall back home.', { type: 'keys', pool: ['f', 'j', 'd', 'k'], groups: 10, len: 3 }),
      L('sl', 'Lesson 3 · S and L', 'Ring fingers join', ['s', 'l'], 'Ring', 'The ring fingers are weaker — go slow and deliberate.', { type: 'keys', pool: ['f', 'j', 'd', 'k', 's', 'l'], groups: 10, len: 3 }),
      L('asemi', 'Lesson 4 · A and ;', 'Pinky fingers, the hardest reach', ['a', ';'], 'Pinky', 'Keep the other fingers on home while the pinky reaches.', { type: 'keys', pool: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], groups: 10, len: 3 }),
      L('home-words', 'Lesson 5 · Home-row words', 'Short words from all eight keys', ['g', 'h'], 'Index', 'G and H are index reaches inward. Keep a steady beat.', { type: 'words', words: HOME_WORDS, count: 14 }),
      L('home-check', 'Lesson 6 · Home-row check', 'Timed accuracy gate to finish', [], 'All', 'Accuracy first — clear 95% to unlock the top row.', { type: 'words', words: HOME_WORDS, count: 20 }),
    ],
  },
  {
    n: 2, slug: 'top-row', title: 'Top row', goal: 'Reach up to Q W E R T Y U I O P and back.',
    lessons: [
      L('ei', 'Lesson 1 · E and I', 'Middle fingers reach up', ['e', 'i'], 'Middle', 'Up-and-back — the finger returns home after every key.', { type: 'keys', pool: ['e', 'i', 'd', 'k', 'f', 'j'], groups: 10, len: 3 }),
      L('ru', 'Lesson 2 · R and U', 'Index fingers reach up', ['r', 'u'], 'Index', 'The index covers two top keys — R and T on the left.', { type: 'keys', pool: ['r', 'u', 'e', 'i', 'f', 'j'], groups: 10, len: 3 }),
      L('ty', 'Lesson 3 · T and Y', 'The inner index stretch', ['t', 'y'], 'Index', 'T and Y are the long inward reaches for the index fingers.', { type: 'keys', pool: ['t', 'y', 'r', 'u', 'e', 'i'], groups: 10, len: 3 }),
      L('wo', 'Lesson 4 · W and O', 'Ring fingers reach up', ['w', 'o'], 'Ring', 'Ring fingers again — slow is smooth, smooth is fast.', { type: 'keys', pool: ['w', 'o', 'e', 'i', 's', 'l'], groups: 10, len: 3 }),
      L('qp', 'Lesson 5 · Q and P', 'Pinky fingers reach up', ['q', 'p'], 'Pinky', 'The pinky corners. Keep the wrist still and reach only the finger.', { type: 'keys', pool: ['q', 'p', 'a', ';', 'w', 'o'], groups: 10, len: 3 }),
      L('top-words', 'Lesson 6 · Top-row words', 'Words across home and top rows', [], 'All', 'Real words now — read one ahead as you type.', { type: 'words', words: TOP_WORDS, count: 16 }),
      L('top-check', 'Lesson 7 · Top-row check', 'Timed accuracy gate', [], 'All', 'Clear 95% to unlock the bottom row.', { type: 'words', words: [...TOP_WORDS, ...HOME_WORDS], count: 22 }),
    ],
  },
  {
    n: 3, slug: 'bottom-row', title: 'Bottom row', goal: 'The Z X C V B N M , . / stretch.',
    lessons: [
      L('vn', 'Lesson 1 · V and N', 'Index fingers reach down', ['v', 'n'], 'Index', 'Down-and-back. The index covers V, B on the left.', { type: 'keys', pool: ['v', 'n', 'f', 'j', 'r', 'u'], groups: 10, len: 3 }),
      L('cm', 'Lesson 2 · C and M', 'Middle fingers reach down', ['c', 'm'], 'Middle', 'Curl the middle finger down and release straight back.', { type: 'keys', pool: ['c', 'm', 'd', 'k', 'v', 'n'], groups: 10, len: 3 }),
      L('xcomma', 'Lesson 3 · X and ,', 'Ring fingers reach down', ['x', ','], 'Ring', 'The comma sits under the right middle — mind the split.', { type: 'keys', pool: ['x', ',', 's', 'l', 'c', 'm'], groups: 10, len: 3 }),
      L('zdot', 'Lesson 4 · Z . and /', 'Pinky fingers reach down', ['z', '.', '/'], 'Pinky', 'The trickiest corners. Go slow and keep everything else home.', { type: 'keys', pool: ['z', '.', '/', 'a', ';', 'x', ','], groups: 10, len: 3 }),
      L('bottom-words', 'Lesson 5 · Bottom-row words', 'Words using the bottom row', [], 'All', 'Full board now — trust your fingers, keep your eyes up.', { type: 'words', words: BOTTOM_WORDS, count: 16 }),
      L('bottom-check', 'Lesson 6 · Bottom-row check', 'Timed accuracy gate', [], 'All', 'Clear 95% to unlock capitals.', { type: 'words', words: [...BOTTOM_WORDS, ...COMMON_WORDS.slice(0, 12)], count: 22 }),
    ],
  },
  {
    n: 4, slug: 'capitals', title: 'Capitals & shift', goal: 'Both shift keys with the opposite hand.',
    lessons: [
      L('shift-basics', 'Lesson 1 · The shift rule', 'Opposite-hand shift', [], 'Pinky', 'Shift with the hand OPPOSITE the letter, then release.', { type: 'words', words: CAP_WORDS, count: 12 }),
      L('names', 'Lesson 2 · Names & places', 'Proper nouns', [], 'Pinky', 'Capital first letter — reach the far pinky and let go cleanly.', { type: 'words', words: CAP_WORDS, count: 16 }),
      L('cap-check', 'Lesson 3 · Capitals check', 'Timed accuracy gate', [], 'All', 'Clear 92% to move on.', { type: 'words', words: CAP_WORDS, count: 20 }),
    ],
  },
  {
    n: 5, slug: 'numbers', title: 'Numbers', goal: 'The number row and tabular figures.',
    lessons: [
      L('num-home', 'Lesson 1 · 4 5 6 7', 'Index fingers on the number row', ['4', '5', '6', '7'], 'Index', 'Long reaches — keep the other fingers anchored on home.', { type: 'keys', pool: ['4', '5', '6', '7', 'f', 'j'], groups: 10, len: 3 }),
      L('num-mid', 'Lesson 2 · 3 8 2 9', 'Middle and ring fingers', ['3', '8', '2', '9'], 'Middle', 'One finger, one column — 3 above E, 8 above I.', { type: 'keys', pool: ['3', '8', '2', '9', '4', '7'], groups: 10, len: 3 }),
      L('num-edge', 'Lesson 3 · 1 0', 'Pinky fingers on the corners', ['1', '0'], 'Pinky', 'The far corners. Reach the pinky, not the whole hand.', { type: 'keys', pool: ['1', '0', '2', '9', '5', '6'], groups: 10, len: 3 }),
      L('num-check', 'Lesson 4 · Figures check', 'Dates and amounts', [], 'All', 'Type figures without looking — clear 92%.', { type: 'keys', pool: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], groups: 12, len: 4 }),
    ],
  },
  {
    n: 6, slug: 'punctuation', title: 'Punctuation', goal: 'Commas, stops, brackets and marks.',
    lessons: [
      L('punct-basics', 'Lesson 1 · . , and ;', 'Everyday marks', [], 'All', 'A stop ends a thought; a comma pauses it. One space after.', { type: 'sentences', sentences: SENTENCES, count: 2 }),
      L('punct-check', 'Lesson 2 · Punctuation check', 'Mixed marks in context', [], 'All', 'Punctuation counts as a mistake in the exam — get it exact.', { type: 'sentences', sentences: SENTENCES, count: 3 }),
    ],
  },
  {
    n: 7, slug: 'common-words', title: 'Common words', goal: 'The most frequent English words by touch.',
    lessons: [
      L('cw-1', 'Lesson 1 · Top 50 words', 'The words you type most', [], 'All', 'These recur everywhere — burn them into muscle memory.', { type: 'words', words: COMMON_WORDS, count: 20 }),
      L('cw-check', 'Lesson 2 · Word sprint', 'Speed on familiar words', [], 'All', 'Push the pace gently — accuracy must hold at 95%.', { type: 'words', words: COMMON_WORDS, count: 28 }),
    ],
  },
  {
    n: 8, slug: 'sentences', title: 'Sentences', goal: 'Full lines with rhythm and spacing.',
    lessons: [
      L('sent-1', 'Lesson 1 · Short sentences', 'Whole lines, one space between words', [], 'All', 'Read one word ahead. Keep a steady, even rhythm.', { type: 'sentences', sentences: SENTENCES, count: 2 }),
      L('sent-check', 'Lesson 2 · Paragraph check', 'A short paragraph', [], 'All', 'Sustain accuracy over length — clear 95%.', { type: 'sentences', sentences: SENTENCES, count: 4 }),
    ],
  },
  {
    n: 9, slug: 'accuracy-drills', title: 'Accuracy drills', goal: 'Slow, deliberate reps on weak keys.',
    lessons: [
      L('acc-1', 'Lesson 1 · Deliberate reps', 'Slow down to speed up', [], 'All', 'Type slower than feels natural. Zero errors is the goal.', { type: 'words', words: [...COMMON_WORDS, ...BOTTOM_WORDS], count: 20 }),
      L('acc-check', 'Lesson 2 · Accuracy gate', 'Hold 98% to pass', [], 'All', 'This gate is strict — 98% accuracy to clear.', { type: 'sentences', sentences: SENTENCES, count: 3 }),
    ],
  },
  {
    n: 10, slug: 'speed-builder', title: 'Speed builder', goal: 'Push past 30 WPM in timed bursts.',
    lessons: [
      L('speed-1', 'Lesson 1 · Timed burst', 'Go faster while accuracy holds', [], 'All', 'Short bursts at your limit, then settle back to clean.', { type: 'words', words: COMMON_WORDS, count: 30 }),
      L('speed-check', 'Lesson 2 · 30 WPM gate', 'Reach 30 WPM at 95%', [], 'All', 'Clear 30 WPM with 95% accuracy to finish the builder.', { type: 'sentences', sentences: SENTENCES, count: 3 }),
    ],
  },
  {
    n: 11, slug: 'exam-warmup', title: 'Exam warm-up', goal: 'A full passage at exam pace and length.',
    lessons: [
      L('warm-1', 'Lesson 1 · Full passage', 'Exam-length copy at exam pace', [], 'All', 'Treat it like the real thing: eyes up, correct nothing you cannot see.', { type: 'text', text: EXAM_TEXT }),
    ],
  },
];

export const MODULE_BY_SLUG = new Map(MODULES.map((m) => [m.slug, m]));
export const getModule = (slug) => MODULE_BY_SLUG.get(slug);
export const TOTAL_LESSONS = MODULES.reduce((s, m) => s + m.lessons.length, 0);

// Pass gate + star rating for a finished drill.
export function gradeLesson(module, accuracy, wpm) {
  // Accuracy bar rises through the course; some checks demand more.
  let bar = 90;
  if (module.n >= 2) bar = 95;
  if (module.slug === 'accuracy-drills') bar = 98;
  const cleared = accuracy >= bar;
  let stars = 0;
  if (cleared) {
    stars = 1;
    if (accuracy >= bar + 2) stars = 2;
    if (accuracy >= 97 && wpm >= 30) stars = 3;
  }
  return { cleared, stars, bar };
}
