// Typing Master curriculum — beginner-first, TypingMaster-style. Content is
// client-side (a typing trainer is fully real-time; there are no secret answers).
// Each lesson declares the new keys, the finger + tip, and a drill spec;
// buildTarget() produces a fresh target string per attempt so nothing is memorised.

const rnd = (n) => Math.floor(Math.random() * n);
const pickN = (arr, n) => { const out = []; for (let i = 0; i < n; i += 1) out.push(arr[rnd(arr.length)]); return out; };

function keyGroups(pool, groups = 8, len = 3) {
  const out = [];
  for (let g = 0; g < groups; g += 1) {
    let word = '';
    for (let i = 0; i < len; i += 1) word += pool[rnd(pool.length)];
    out.push(word);
  }
  return out.join(' ');
}

const HOME_WORDS = ['ask', 'add', 'dad', 'fall', 'flask', 'salad', 'gash', 'half', 'hall', 'lag', 'sad', 'lad', 'fad', 'gala', 'flag', 'dash', 'lads', 'shall', 'glass', 'asks', 'falls', 'gaff', 'had', 'has', 'jak'];
const TOP_WORDS = ['type', 'quiet', 'power', 'their', 'write', 'query', 'proper', 'rope', 'wire', 'tore', 'pity', 'output', 'either', 'reply', 'party', 'point', 'group', 'quite', 'their', 'wrote'];
const BOTTOM_WORDS = ['van', 'cab', 'numb', 'zinc', 'brave', 'comma', 'vibe', 'mix', 'zoom', 'crazy', 'name', 'move', 'combine', 'vacant', 'number', 'convey', 'maze', 'civic', 'buzz', 'vex'];
const LEFT_HAND = ['was', 'were', 'sat', 'tea', 'dress', 'area', 'cat', 'far', 'tax', 'rest', 'free', 'seat', 'stress', 'extra', 'after', 'water', 'trade', 'great', 'beast', 'cards', 'state', 'star', 'fear', 'wear'];
const RIGHT_HAND = ['you', 'him', 'pin', 'look', 'only', 'pull', 'join', 'milk', 'moon', 'hill', 'loop', 'junk', 'link', 'onion', 'opinion', 'million', 'noon', 'lily', 'pump', 'yolk'];
const BIGRAMS = ['th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd', 'ti', 'es', 'or', 'te', 'of', 'ed', 'is', 'it', 'al', 'ar', 'st', 'to', 'nt', 'ng', 'se', 'ha', 'as', 'ou', 'io', 'le', 've', 'co', 'me', 'de', 'ri', 'ro', 'ic', 'ne', 'ea', 'ce', 'ch', 'll', 'be', 'ma'];
const COMMON_WORDS = ['the', 'and', 'for', 'you', 'that', 'with', 'have', 'this', 'from', 'they', 'will', 'would', 'there', 'their', 'what', 'about', 'which', 'when', 'make', 'like', 'time', 'just', 'know', 'take', 'into', 'year', 'your', 'good', 'some', 'them', 'other', 'than', 'then', 'look', 'only', 'come', 'over', 'think', 'also', 'back', 'after', 'work', 'first', 'well', 'even', 'want', 'because', 'these', 'give', 'most', 'people', 'could', 'should', 'through', 'before', 'between'];
const COURT_WORDS = ['court', 'clerk', 'file', 'notice', 'order', 'case', 'bench', 'hearing', 'affidavit', 'petition', 'register', 'summons', 'judgment', 'appeal', 'record', 'cause', 'list', 'oath', 'stamp', 'copy', 'office', 'clause', 'section', 'draft', 'report', 'entry', 'index', 'seal', 'date', 'fee'];
const CAP_WORDS = ['Delhi', 'India', 'Punjab', 'Court', 'Clerk', 'Ravi', 'Simran', 'Amit', 'Kaur', 'Singh', 'Monday', 'August', 'Chandigarh', 'Haryana', 'Notice', 'Exam', 'Register', 'Bench'];
// Capitals on LEFT-hand letters (Q-T, A-G, Z-B) — typed with the RIGHT shift.
const CAP_LEFT = ['Ravi', 'Data', 'Fact', 'Ward', 'Base', 'Case', 'Test', 'Gate', 'Area', 'Star', 'Team', 'Bear', 'Deed', 'Ever', 'Rate'];
// Capitals on RIGHT-hand letters (Y-P, H-L, N-M) — typed with the LEFT shift.
const CAP_RIGHT = ['Home', 'Lion', 'Nine', 'Milk', 'Judge', 'Kite', 'Lamp', 'Moon', 'Noun', 'Play', 'Unit', 'Yoke', 'Poll', 'Hunt', 'Mill'];
const ALLCAPS_WORDS = ['COURT', 'INDIA', 'NOTICE', 'ORDER', 'CLERK', 'EXAM', 'FILE', 'OATH', 'SEAL', 'BENCH', 'RECORD', 'APPEAL', 'PUNJAB', 'HIGH'];
const CAP_SENTENCES = [
  'The Court opened on Monday in Chandigarh.',
  'Ravi and Simran filed the Notice with the Registrar.',
  'India and Punjab share the High Court at Chandigarh.',
  'The Clerk signed the Order and sealed the File.',
  'Amit Kaur typed the Judgment for the August Bench.',
];

const SENTENCES = [
  'the clerk filed every notice before the court opened.',
  'she typed the report and saved it without a single error.',
  'a steady hand and a calm mind beat raw speed every time.',
  'practice each row until your fingers find the keys alone.',
  'good posture and light touch make long passages easy.',
  'read one word ahead and let your hands keep the rhythm.',
];
const COURT_SENTENCES = [
  'the registrar signed the order and sealed the file.',
  'each petition is numbered and entered in the cause list.',
  'the clerk typed the judgment and filed a fair copy.',
  'hearings are listed by date on the notice board outside.',
  'a stamped copy of the record was sent to the appellant.',
];
const EXAM_TEXT = 'The Computer Proficiency Test rewards a calm, steady rhythm over raw speed. Keep your eyes on the copy, let each finger return to its home key, and correct nothing you cannot see. Accuracy first; the words per minute will follow on their own as your hands learn the board and stop hunting for letters across the keyboard.';

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

// Modules in learning order — the module number (n) is derived from position.
const RAW = [
  {
    slug: 'home-row', title: 'Home row', goal: 'Anchor A S D F J K L ; without looking.',
    lessons: [
      L('fj', 'Lesson 1 · F and J', 'Find home with your index fingers', ['f', 'j'], 'Index', 'Feel the bumps on F and J — your anchors. Never look down.', { type: 'keys', pool: ['f', 'j'], groups: 10, len: 3 }),
      L('dk', 'Lesson 2 · D and K', 'Middle fingers reach in', ['d', 'k'], 'Middle', 'Reach with the middle finger and let it fall back home.', { type: 'keys', pool: ['f', 'j', 'd', 'k'], groups: 10, len: 3 }),
      L('sl', 'Lesson 3 · S and L', 'Ring fingers join', ['s', 'l'], 'Ring', 'The ring fingers are weaker — go slow and deliberate.', { type: 'keys', pool: ['f', 'j', 'd', 'k', 's', 'l'], groups: 10, len: 3 }),
      L('asemi', 'Lesson 4 · A and ;', 'Pinky fingers, the hardest reach', ['a', ';'], 'Pinky', 'Keep the other fingers on home while the pinky reaches.', { type: 'keys', pool: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], groups: 10, len: 3 }),
      L('gh', 'Lesson 5 · G and H', 'Index fingers reach inward', ['g', 'h'], 'Index', 'G and H are inward reaches for the index fingers.', { type: 'keys', pool: ['f', 'g', 'h', 'j', 'd', 'k'], groups: 10, len: 3 }),
      L('home-words', 'Lesson 6 · Home-row words', 'Short words from all eight keys', [], 'All', 'Real words now — keep a steady beat and eyes up.', { type: 'words', words: HOME_WORDS, count: 14 }),
      L('home-check', 'Lesson 7 · Home-row check', 'Put it together', [], 'All', 'Reach your accuracy target to clear the home row.', { type: 'words', words: HOME_WORDS, count: 20 }),
    ],
  },
  {
    slug: 'top-row', title: 'Top row', goal: 'Reach up to Q W E R T Y U I O P and back.',
    lessons: [
      L('ei', 'Lesson 1 · E and I', 'Middle fingers reach up', ['e', 'i'], 'Middle', 'Up-and-back — the finger returns home after every key.', { type: 'keys', pool: ['e', 'i', 'd', 'k', 'f', 'j'], groups: 10, len: 3 }),
      L('ru', 'Lesson 2 · R and U', 'Index fingers reach up', ['r', 'u'], 'Index', 'The index covers two top keys — R and T on the left.', { type: 'keys', pool: ['r', 'u', 'e', 'i', 'f', 'j'], groups: 10, len: 3 }),
      L('ty', 'Lesson 3 · T and Y', 'The inner index stretch', ['t', 'y'], 'Index', 'T and Y are the long inward reaches for the index fingers.', { type: 'keys', pool: ['t', 'y', 'r', 'u', 'e', 'i'], groups: 10, len: 3 }),
      L('wo', 'Lesson 4 · W and O', 'Ring fingers reach up', ['w', 'o'], 'Ring', 'Ring fingers again — slow is smooth, smooth is fast.', { type: 'keys', pool: ['w', 'o', 'e', 'i', 's', 'l'], groups: 10, len: 3 }),
      L('qp', 'Lesson 5 · Q and P', 'Pinky fingers reach up', ['q', 'p'], 'Pinky', 'The pinky corners. Keep the wrist still and reach only the finger.', { type: 'keys', pool: ['q', 'p', 'a', ';', 'w', 'o'], groups: 10, len: 3 }),
      L('top-words', 'Lesson 6 · Top-row words', 'Words across home and top rows', [], 'All', 'Read one word ahead as you type.', { type: 'words', words: TOP_WORDS, count: 16 }),
      L('top-check', 'Lesson 7 · Top-row check', 'Put it together', [], 'All', 'Reach your target to unlock the bottom row.', { type: 'words', words: [...TOP_WORDS, ...HOME_WORDS], count: 22 }),
    ],
  },
  {
    slug: 'bottom-row', title: 'Bottom row', goal: 'The Z X C V B N M , . / stretch.',
    lessons: [
      L('vn', 'Lesson 1 · V and N', 'Index fingers reach down', ['v', 'n'], 'Index', 'Down-and-back. The index covers V, B on the left.', { type: 'keys', pool: ['v', 'n', 'f', 'j', 'r', 'u'], groups: 10, len: 3 }),
      L('cm', 'Lesson 2 · C and M', 'Middle fingers reach down', ['c', 'm'], 'Middle', 'Curl the middle finger down and release straight back.', { type: 'keys', pool: ['c', 'm', 'd', 'k', 'v', 'n'], groups: 10, len: 3 }),
      L('xcomma', 'Lesson 3 · X and ,', 'Ring fingers reach down', ['x', ','], 'Ring', 'The comma sits under the right middle — mind the split.', { type: 'keys', pool: ['x', ',', 's', 'l', 'c', 'm'], groups: 10, len: 3 }),
      L('zdot', 'Lesson 4 · Z . and /', 'Pinky fingers reach down', ['z', '.', '/'], 'Pinky', 'The trickiest corners. Go slow and keep everything else home.', { type: 'keys', pool: ['z', '.', '/', 'a', ';', 'x', ','], groups: 10, len: 3 }),
      L('bottom-words', 'Lesson 5 · Bottom-row words', 'Words using the bottom row', [], 'All', 'Full board now — trust your fingers, keep your eyes up.', { type: 'words', words: BOTTOM_WORDS, count: 16 }),
      L('bottom-check', 'Lesson 6 · Bottom-row check', 'Put it together', [], 'All', 'Reach your target to unlock the next module.', { type: 'words', words: [...BOTTOM_WORDS, ...COMMON_WORDS.slice(0, 12)], count: 22 }),
    ],
  },
  {
    slug: 'capitals', title: 'Capital letters', goal: 'Shift with the opposite hand — capitals, names and ALL CAPS.',
    lessons: [
      L('shift-rule', 'Lesson 1 · The shift rule', 'Shift with the opposite hand', [], 'Pinky', 'Hold Shift with the hand OPPOSITE the letter, tap the letter, then release.', { type: 'words', words: CAP_WORDS, count: 12 }),
      L('right-shift', 'Lesson 2 · Right-shift capitals', 'Capitals on left-hand letters', [], 'Right pinky', 'Left-hand letter? Hold the RIGHT Shift with your right pinky.', { type: 'words', words: CAP_LEFT, count: 14 }),
      L('left-shift', 'Lesson 3 · Left-shift capitals', 'Capitals on right-hand letters', [], 'Left pinky', 'Right-hand letter? Hold the LEFT Shift with your left pinky.', { type: 'words', words: CAP_RIGHT, count: 14 }),
      L('names', 'Lesson 4 · Names & places', 'Proper nouns', [], 'Pinky', 'Capitalise the first letter cleanly, then carry on in lower case.', { type: 'words', words: CAP_WORDS, count: 16 }),
      L('all-caps', 'Lesson 5 · ALL CAPS', 'Whole words in capitals', [], 'Pinky', 'Keep Shift held (or Caps Lock) for a full capitalised word.', { type: 'words', words: ALLCAPS_WORDS, count: 12 }),
      L('cap-sentences', 'Lesson 6 · Sentences with capitals', 'Capitals inside real lines', [], 'All', 'Capital at the start and on names — everything else lower case.', { type: 'sentences', sentences: CAP_SENTENCES, count: 2 }),
      L('cap-check', 'Lesson 7 · Capitals check', 'Put it together', [], 'All', 'Reach your target across mixed-case lines to clear the module.', { type: 'sentences', sentences: CAP_SENTENCES, count: 3 }),
    ],
  },
  {
    slug: 'left-right', title: 'Left & right hand', goal: 'Build each hand on its own, then alternate.',
    lessons: [
      L('left', 'Lesson 1 · Left-hand words', 'Only left-hand keys', [], 'Left hand', 'Words your left hand types alone — Q W E R T · A S D F G · Z X C V B.', { type: 'words', words: LEFT_HAND, count: 16 }),
      L('right', 'Lesson 2 · Right-hand words', 'Only right-hand keys', [], 'Right hand', 'Words your right hand types alone — Y U I O P · H J K L · N M.', { type: 'words', words: RIGHT_HAND, count: 16 }),
      L('alternate', 'Lesson 3 · Alternating hands', 'Both hands, back and forth', [], 'All', 'Fast, even rhythm as the work passes from hand to hand.', { type: 'words', words: [...LEFT_HAND, ...RIGHT_HAND], count: 20 }),
    ],
  },
  {
    slug: 'numbers', title: 'Numbers', goal: 'The number row and tabular figures.',
    lessons: [
      L('num-home', 'Lesson 1 · 4 5 6 7', 'Index fingers on the number row', ['4', '5', '6', '7'], 'Index', 'Long reaches — keep the other fingers anchored on home.', { type: 'keys', pool: ['4', '5', '6', '7', 'f', 'j'], groups: 10, len: 3 }),
      L('num-mid', 'Lesson 2 · 3 8 2 9', 'Middle and ring fingers', ['3', '8', '2', '9'], 'Middle', 'One finger, one column — 3 above E, 8 above I.', { type: 'keys', pool: ['3', '8', '2', '9', '4', '7'], groups: 10, len: 3 }),
      L('num-edge', 'Lesson 3 · 1 0', 'Pinky fingers on the corners', ['1', '0'], 'Pinky', 'The far corners. Reach the pinky, not the whole hand.', { type: 'keys', pool: ['1', '0', '2', '9', '5', '6'], groups: 10, len: 3 }),
      L('num-check', 'Lesson 4 · Figures check', 'Dates and amounts', [], 'All', 'Type figures without looking to clear the module.', { type: 'keys', pool: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], groups: 12, len: 4 }),
    ],
  },
  {
    slug: 'punctuation', title: 'Punctuation', goal: 'Commas, stops, brackets and marks.',
    lessons: [
      L('punct-basics', 'Lesson 1 · . , and ;', 'Everyday marks', [], 'All', 'A stop ends a thought; a comma pauses it. One space after.', { type: 'sentences', sentences: SENTENCES, count: 2 }),
      L('punct-check', 'Lesson 2 · Punctuation check', 'Mixed marks in context', [], 'All', 'Punctuation counts as a mistake in the exam — get it exact.', { type: 'sentences', sentences: SENTENCES, count: 3 }),
    ],
  },
  {
    slug: 'bigrams', title: 'Common bigrams', goal: 'The letter pairs that appear everywhere.',
    lessons: [
      L('bigram-drill', 'Lesson 1 · Letter pairs', 'th he in er an re on at…', [], 'All', 'These two-letter pairs make up most of English — drill them smooth.', { type: 'words', words: BIGRAMS, count: 20 }),
      L('bigram-check', 'Lesson 2 · Pairs at speed', 'Faster, still even', [], 'All', 'Keep the rhythm even; speed comes from smoothness, not force.', { type: 'words', words: BIGRAMS, count: 28 }),
    ],
  },
  {
    slug: 'common-words', title: 'Common words', goal: 'The most frequent English words by touch.',
    lessons: [
      L('cw-1', 'Lesson 1 · Top words', 'The words you type most', [], 'All', 'These recur everywhere — burn them into muscle memory.', { type: 'words', words: COMMON_WORDS, count: 20 }),
      L('cw-2', 'Lesson 2 · More top words', 'Broaden the set', [], 'All', 'Keep your eyes ahead; let the common words flow.', { type: 'words', words: COMMON_WORDS, count: 24 }),
      L('cw-check', 'Lesson 3 · Word sprint', 'Speed on familiar words', [], 'All', 'Push the pace gently — accuracy must hold at your target.', { type: 'words', words: COMMON_WORDS, count: 28 }),
    ],
  },
  {
    slug: 'court-words', title: 'Court & office words', goal: 'The vocabulary of the clerk’s desk.',
    lessons: [
      L('court-1', 'Lesson 1 · Registry words', 'Words from the record room', [], 'All', 'The terms you will type on the job and in the exam copy.', { type: 'words', words: COURT_WORDS, count: 18 }),
      L('court-check', 'Lesson 2 · Registry check', 'At working pace', [], 'All', 'Reach your target on the office vocabulary.', { type: 'words', words: COURT_WORDS, count: 24 }),
    ],
  },
  {
    slug: 'sentences', title: 'Sentences', goal: 'Full lines with rhythm and spacing.',
    lessons: [
      L('sent-1', 'Lesson 1 · Short sentences', 'Whole lines, one space between words', [], 'All', 'Read one word ahead. Keep a steady, even rhythm.', { type: 'sentences', sentences: SENTENCES, count: 2 }),
      L('sent-2', 'Lesson 2 · Court sentences', 'Lines from the registry', [], 'All', 'Real office lines — mind the stops and commas.', { type: 'sentences', sentences: COURT_SENTENCES, count: 2 }),
      L('sent-check', 'Lesson 3 · Paragraph check', 'A short paragraph', [], 'All', 'Sustain accuracy over length to clear the module.', { type: 'sentences', sentences: [...SENTENCES, ...COURT_SENTENCES], count: 4 }),
    ],
  },
  {
    slug: 'accuracy-drills', title: 'Accuracy drills', goal: 'Slow, deliberate reps on weak keys.',
    lessons: [
      L('acc-1', 'Lesson 1 · Deliberate reps', 'Slow down to speed up', [], 'All', 'Type slower than feels natural. Zero errors is the goal.', { type: 'words', words: [...COMMON_WORDS, ...BOTTOM_WORDS], count: 20 }),
      L('acc-check', 'Lesson 2 · Accuracy gate', 'Hold a high target', [], 'All', 'Set a high target (95–100%) and hold it steady.', { type: 'sentences', sentences: [...SENTENCES, ...COURT_SENTENCES], count: 3 }),
    ],
  },
  {
    slug: 'speed-builder', title: 'Speed builder', goal: 'Push past 30 WPM in timed bursts.',
    lessons: [
      L('speed-1', 'Lesson 1 · Timed burst', 'Go faster while accuracy holds', [], 'All', 'Short bursts at your limit, then settle back to clean.', { type: 'words', words: COMMON_WORDS, count: 30 }),
      L('speed-2', 'Lesson 2 · Sustained pace', 'Hold the faster rhythm', [], 'All', 'Keep the quicker beat over a longer run.', { type: 'sentences', sentences: [...SENTENCES, ...COURT_SENTENCES], count: 3 }),
      L('speed-check', 'Lesson 3 · Speed gate', 'Reach 30 WPM at your target', [], 'All', 'Aim for 30 WPM while your accuracy target holds.', { type: 'sentences', sentences: [...SENTENCES, ...COURT_SENTENCES], count: 4 }),
    ],
  },
  {
    slug: 'exam-warmup', title: 'Exam warm-up', goal: 'A full passage at exam pace and length.',
    lessons: [
      L('warm-1', 'Lesson 1 · Full passage', 'Exam-length copy at exam pace', [], 'All', 'Treat it like the real thing: eyes up, correct nothing you cannot see.', { type: 'text', text: EXAM_TEXT }),
    ],
  },
];

export const MODULES = RAW.map((m, i) => ({ ...m, n: i + 1 }));
export const MODULE_BY_SLUG = new Map(MODULES.map((m) => [m.slug, m]));
export const getModule = (slug) => MODULE_BY_SLUG.get(slug);
export const TOTAL_LESSONS = MODULES.reduce((s, m) => s + m.lessons.length, 0);

// Pass gate + star rating. The accuracy target is chosen by the learner (see the
// runner's "Advance at" control); the lesson clears when they reach it.
export function gradeLesson(accuracy, wpm, target = 90) {
  const bar = target;
  const cleared = accuracy >= bar;
  let stars = 0;
  if (cleared) {
    stars = 1;
    if (accuracy >= Math.min(100, bar + 3)) stars = 2;
    if (accuracy >= 98 && wpm >= 30) stars = 3;
  }
  return { cleared, stars, bar };
}

export const ACCURACY_TARGETS = [80, 90, 95, 100];
export const DEFAULT_TARGET = 90;
