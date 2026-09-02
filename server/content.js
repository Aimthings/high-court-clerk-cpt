// Loads seeded content from JSON. In later phases these move to MySQL JSON
// columns (brief §4); the API shape stays the same so the client is unaffected.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export const passages = JSON.parse(
  readFileSync(join(here, 'seed', 'passages.json'), 'utf-8'),
).map((p, idx) => ({
  id: idx + 1,
  ...p,
  word_count: p.body.trim().split(/\s+/).length,
}));

const bySlug = new Map(passages.map((p) => [p.slug, p]));
export const getPassage = (slug) => bySlug.get(slug);

// List view never includes the passage body.
export const passageSummary = (p) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  category: p.category,
  difficulty: p.difficulty,
  word_count: p.word_count,
  is_free: p.is_free,
});
