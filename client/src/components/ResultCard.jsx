import { Link } from 'react-router-dom';
import './resultcard.css';

// Typing result screen — deck artboard 11. One hero number (the S.S.S.C. W.P.M.),
// then quiet detail. The stricter (char) model is the default and it is stated.
// The failed variant changes only the pill.
const CLASS_ROWS = [
  ['capitalisation', 'Aa', 'Capitalisation'],
  ['punctuation', ';', 'Punctuation'],
  ['transposition', '⇄', 'Transposition'],
  ['spacing', '␣', 'Spacing'],
  ['spelling', '▦', 'Spelling'],
  ['dropped', '↧', 'Dropped words'],
  ['extra', '↥', 'Extra words'],
];

export default function ResultCard({ result }) {
  const {
    passage, ssscWpm, ssscWpmWord, wordsTyped, mistakesChar, mistakesWord,
    grossWpm, accuracyPct, taxonomy, passed, durationSec,
  } = result;

  const minutes = durationSec / 60;
  const netWords = wordsTyped - mistakesChar;
  const needed = Math.round(30 * minutes);
  const headroomMistakes = Math.max(0, Math.floor(netWords - needed));
  const shortBy = Math.max(0, Math.ceil(needed - netWords));

  return (
    <div className="result">
      <header className="result-bar">
        <Link to="/" className="nav-brand">Clerk CPT</Link>
        <div className="result-bar-title">
          <div className="card-h" style={{ fontSize: 14 }}>{passage.title}</div>
          <div className="muted" style={{ fontSize: 11.5 }}>Part II — Typing</div>
        </div>
        <button className="link-btn" style={{ marginLeft: 'auto' }}>Share result</button>
      </header>

      <div className="page result-body">
        <div className="result-hero">
          <div className="hero-num num">{ssscWpm.toFixed(1)}</div>
          <div className="eyebrow" style={{ marginTop: 8 }}>S.S.S.C. W.P.M.</div>
          <div className="result-verdict">
            {passed ? (
              <span className="verdict-pill verdict-mint">✓ Qualified · {headroomMistakes} mistakes of headroom</span>
            ) : (
              <span className="verdict-pill verdict-rose">✕ Short by {shortBy} net words</span>
            )}
          </div>
        </div>

        <div className="stat-tiles">
          <Tile n={wordsTyped} k="Words" />
          <Tile n={mistakesChar} k="Mistakes" />
          <Tile n={grossWpm.toFixed(1)} k="Gross" />
          <Tile n={`${accuracyPct}%`} k="Accuracy" />
        </div>

        <div className="split-ref result-detail">
          <div className="ref-main">
            <div className="card">
              <div className="card-simple-head">Where the mistakes were</div>
              {CLASS_ROWS.map(([key, ico, label]) => (
                <div className="row" key={key} style={{ padding: '11px 18px' }}>
                  <span className="ico">{ico}</span>
                  <span className="label">{label}</span>
                  <span className="val num">{taxonomy[key] || 0}</span>
                </div>
              ))}
            </div>
            <p className="fineprint">
              The official notice does not state whether a mistake is counted per word or per
              character. The stricter (character) model is shown here: {mistakesChar} mistakes.
              Under the word model it would be {mistakesWord} ({ssscWpmWord.toFixed(1)} W.P.M.).
            </p>
          </div>

          <aside className="ref-rail stack">
            <div className="card card-pad result-unlock">
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Unlock all 25 mocks</div>
                <div className="num" style={{ fontWeight: 800, fontSize: 20, marginTop: 5 }}>₹99</div>
              </div>
              <Link to="/pass" className="btn btn-primary">Unlock</Link>
            </div>
            <Link to="/mocks" className="btn btn-ghost btn-block">Take another test</Link>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Tile({ n, k }) {
  return (
    <div className="tile">
      <div className="tile-n mono">{n}</div>
      <div className="tile-k">{k}</div>
    </div>
  );
}
