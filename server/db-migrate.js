// Applies db/schema.sql to the configured database. Run: npm run migrate
// (or set RUN_MIGRATIONS=true to auto-apply on boot). Also seeds passages and
// mocks into their JSON tables if empty.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from './db.js';
import { passages, mocks } from './content.js';

const here = dirname(fileURLToPath(import.meta.url));

export async function migrate() {
  const sql = readFileSync(join(here, '..', 'db', 'schema.sql'), 'utf-8');
  const statements = sql.split(/;\s*[\r\n]/).map((s) => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await pool.query(stmt);
  }
  await migrateAuth();
  await seedContent();
}

// Idempotent column/index adds for the email+password auth (MySQL 8 has no
// ADD COLUMN IF NOT EXISTS, so guard each change against information_schema).
async function columnExists(table, column) {
  const [[r]] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column],
  );
  return r.n > 0;
}
async function indexExists(table, index) {
  const [[r]] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [table, index],
  );
  return r.n > 0;
}
async function migrateAuth() {
  if (!(await columnExists('users', 'password_hash'))) {
    await pool.query('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL');
  }
  if (!(await columnExists('users', 'email_verified'))) {
    await pool.query('ALTER TABLE users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0');
  }
  if (!(await columnExists('users', 'founding_member'))) {
    await pool.query('ALTER TABLE users ADD COLUMN founding_member TINYINT(1) NOT NULL DEFAULT 0');
    // Every account that already exists was created during the free launch —
    // grandfather them all in as founding members (only when the launch is on).
    const { LAUNCH_FREE } = await import('./config.js');
    if (LAUNCH_FREE) await pool.query('UPDATE users SET founding_member = 1');
  }
  // Unique email (allows multiple NULLs in MySQL, so legacy phone-only rows are fine).
  if (!(await indexExists('users', 'email'))) {
    try { await pool.query('ALTER TABLE users ADD UNIQUE KEY email (email)'); }
    catch (e) { console.error('users.email unique index skipped:', e.message); }
  }
}

async function seedContent() {
  // Upsert so the DB always mirrors the seed files. New drip passages and mocks
  // are added on each deploy; existing rows keep their id (so typing-history
  // joins on passage_id stay valid). Insertion order matches the JSON, so DB ids
  // line up with the in-memory content ids.
  for (const p of passages) {
    await pool.query(
      `INSERT INTO passages (slug, title, category, difficulty, body, word_count, is_free)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), category = VALUES(category),
         difficulty = VALUES(difficulty), body = VALUES(body),
         word_count = VALUES(word_count), is_free = VALUES(is_free)`,
      [p.slug, p.title, p.category, p.difficulty || null, p.body, p.word_count, p.is_free ? 1 : 0],
    );
  }
  for (const m of mocks) {
    await pool.query(
      `INSERT INTO excel_mocks (code, title, spec, is_free) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), spec = VALUES(spec), is_free = VALUES(is_free)`,
      [m.code, m.title, JSON.stringify(m.spec), m.is_free ? 1 : 0],
    );
  }
}

// Run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => { console.log('migration complete'); process.exit(0); })
    .catch((e) => { console.error('migration failed', e); process.exit(1); });
}
