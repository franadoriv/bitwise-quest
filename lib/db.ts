import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { LANGUAGE_PACKS } from "@/content/index.ts";

const DB_PATH = process.env.BITWISE_DB ?? path.join(process.cwd(), "data", "bitwise.db");

declare global {
  // eslint-disable-next-line no-var
  var __bitwiseDb: DatabaseSync | undefined;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS languages (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#ffffff',
  status TEXT NOT NULL DEFAULT 'active',
  runner TEXT,
  topics TEXT NOT NULL DEFAULT '{}',
  exams TEXT NOT NULL DEFAULT '[]',
  planet TEXT NOT NULL DEFAULT 'null',
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS regions (
  id INTEGER PRIMARY KEY,
  language_id INTEGER NOT NULL REFERENCES languages(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  theme TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  sort INTEGER NOT NULL,
  UNIQUE(language_id, slug)
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY,
  region_id INTEGER NOT NULL REFERENCES regions(id),
  language_id INTEGER NOT NULL REFERENCES languages(id),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  concept TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'lesson',
  xp INTEGER NOT NULL DEFAULT 50,
  enemy TEXT NOT NULL,
  enemy_name TEXT NOT NULL,
  beats TEXT NOT NULL,
  sort INTEGER NOT NULL,
  UNIQUE(language_id, slug)
);

-- Player progress is NOT stored here: it lives in client save slots (lib/save).
`;

function contentHash() {
  return createHash("sha1").update(JSON.stringify(LANGUAGE_PACKS)).digest("hex");
}

/** Upserts every language pack into the content tables. Player data is never touched. */
function seed(d: DatabaseSync) {
  const hash = contentHash();
  const row = d.prepare("SELECT value FROM meta WHERE key = 'content_hash'").get() as { value: string } | undefined;
  if (row?.value === hash) return;

  const upLang = d.prepare(`INSERT INTO languages (slug, name, tagline, color, status, runner, topics, exams, planet, sort)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET name=excluded.name, tagline=excluded.tagline, color=excluded.color,
      status=excluded.status, runner=excluded.runner, topics=excluded.topics, exams=excluded.exams, planet=excluded.planet, sort=excluded.sort
    RETURNING id`);
  const upRegion = d.prepare(`INSERT INTO regions (language_id, slug, name, subtitle, theme, status, sort)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(language_id, slug) DO UPDATE SET name=excluded.name, subtitle=excluded.subtitle,
      theme=excluded.theme, status=excluded.status, sort=excluded.sort
    RETURNING id`);
  const upLesson = d.prepare(`INSERT INTO lessons (region_id, language_id, slug, title, concept, mode, xp, enemy, enemy_name, beats, sort)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(language_id, slug) DO UPDATE SET region_id=excluded.region_id, title=excluded.title,
      concept=excluded.concept, mode=excluded.mode, xp=excluded.xp, enemy=excluded.enemy,
      enemy_name=excluded.enemy_name, beats=excluded.beats, sort=excluded.sort`);

  d.exec("BEGIN");
  try {
    LANGUAGE_PACKS.forEach((pack, li) => {
      const { id: langId } = upLang.get(pack.slug, pack.name, JSON.stringify(pack.tagline), pack.color, pack.status, pack.runner ?? null, JSON.stringify(pack.topics), JSON.stringify(pack.exams), JSON.stringify(pack.planet), li) as { id: number };
      pack.regions.forEach((region, ri) => {
        const { id: regionId } = upRegion.get(langId, region.slug, JSON.stringify(region.name), JSON.stringify(region.subtitle), region.theme, region.status ?? "active", ri) as { id: number };
        region.lessons.forEach((lesson, si) => {
          upLesson.run(regionId, langId, lesson.slug, JSON.stringify(lesson.title), lesson.concept, lesson.mode, lesson.xp, lesson.enemy, JSON.stringify(lesson.enemyName), JSON.stringify(lesson.beats), si);
        });
      });
    });
    pruneRemoved(d);
    d.prepare("INSERT INTO meta (key, value) VALUES ('content_hash', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(hash);
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}

/** Additive migrations for databases created by older versions. */
function migrate(d: DatabaseSync) {
  const cols = (d.prepare("PRAGMA table_info(languages)").all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes("topics")) d.exec("ALTER TABLE languages ADD COLUMN topics TEXT NOT NULL DEFAULT '{}'");
  if (!cols.includes("exams")) d.exec("ALTER TABLE languages ADD COLUMN exams TEXT NOT NULL DEFAULT '[]'");
  // v0.2: player progress moved to client save slots; drop the old server-side player tables.
  d.exec("DROP TABLE IF EXISTS progress; DROP TABLE IF EXISTS attempts; DROP TABLE IF EXISTS reviews; DROP TABLE IF EXISTS placements; DROP TABLE IF EXISTS exam_results; DROP TABLE IF EXISTS players;");
  if (!cols.includes("planet")) d.exec("ALTER TABLE languages ADD COLUMN planet TEXT NOT NULL DEFAULT 'null'");
}

/** Deletes lessons/regions that no longer exist in the packs (e.g. renamed slugs). */
function pruneRemoved(d: DatabaseSync) {
  for (const pack of LANGUAGE_PACKS) {
    const lang = d.prepare("SELECT id FROM languages WHERE slug = ?").get(pack.slug) as { id: number } | undefined;
    if (!lang) continue;
    const lessonSlugs = new Set(pack.regions.flatMap((r) => r.lessons.map((l) => l.slug)));
    const regionSlugs = new Set(pack.regions.map((r) => r.slug));
    const lessons = d.prepare("SELECT id, slug FROM lessons WHERE language_id = ?").all(lang.id) as { id: number; slug: string }[];
    for (const l of lessons.filter((l) => !lessonSlugs.has(l.slug))) {
      d.prepare("DELETE FROM lessons WHERE id = ?").run(l.id);
    }
    const regions = d.prepare("SELECT id, slug FROM regions WHERE language_id = ?").all(lang.id) as { id: number; slug: string }[];
    for (const r of regions.filter((r) => !regionSlugs.has(r.slug))) d.prepare("DELETE FROM regions WHERE id = ?").run(r.id);
  }
}

let seededThisModule = false;

export function db(): DatabaseSync {
  if (!globalThis.__bitwiseDb) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const d = new DatabaseSync(DB_PATH);
    d.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    d.exec(SCHEMA);
    migrate(d);
    globalThis.__bitwiseDb = d;
  }
  // Re-check content on every module (re)load so edits to content/ show up in dev.
  if (!seededThisModule) {
    seed(globalThis.__bitwiseDb);
    seededThisModule = true;
  }
  return globalThis.__bitwiseDb;
}
