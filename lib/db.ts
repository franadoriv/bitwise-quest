import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { LANGUAGE_PACKS } from "@/content/index.ts";

const DB_PATH = process.env.BITFORGE_DB ?? path.join(process.cwd(), "data", "bitforge.db");

declare global {
  // eslint-disable-next-line no-var
  var __bitforgeDb: DatabaseSync | undefined;
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

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'HÉROE',
  xp INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_day TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS progress (
  player_id INTEGER NOT NULL REFERENCES players(id),
  lesson_id INTEGER NOT NULL REFERENCES lessons(id),
  stars INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  plays INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  PRIMARY KEY (player_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY,
  player_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  beat INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS attempts_by_lesson ON attempts(player_id, lesson_id);

-- Leitner boxes for spaced repetition ("wandering bugs").
CREATE TABLE IF NOT EXISTS reviews (
  player_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  beat INTEGER NOT NULL,
  box INTEGER NOT NULL DEFAULT 1,
  due_at TEXT NOT NULL,
  PRIMARY KEY (player_id, lesson_id, beat)
);

-- Entry exam attempts (company-style screening). topics = JSON [{id, correct, total}].
CREATE TABLE IF NOT EXISTS exam_results (
  id INTEGER PRIMARY KEY,
  player_id INTEGER NOT NULL,
  language_id INTEGER NOT NULL,
  exam TEXT NOT NULL,
  correct INTEGER NOT NULL,
  total INTEGER NOT NULL,
  pct INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  topics TEXT NOT NULL,
  skipped_regions INTEGER NOT NULL DEFAULT 0,
  taken_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS exam_results_by_player ON exam_results(player_id, language_id, exam);
`;

function contentHash() {
  return createHash("sha1").update(JSON.stringify(LANGUAGE_PACKS)).digest("hex");
}

/** Upserts every language pack into the content tables. Player data is never touched. */
function seed(d: DatabaseSync) {
  const hash = contentHash();
  const row = d.prepare("SELECT value FROM meta WHERE key = 'content_hash'").get() as { value: string } | undefined;
  if (row?.value === hash) return;

  const upLang = d.prepare(`INSERT INTO languages (slug, name, tagline, color, status, runner, topics, exams, sort)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET name=excluded.name, tagline=excluded.tagline, color=excluded.color,
      status=excluded.status, runner=excluded.runner, topics=excluded.topics, exams=excluded.exams, sort=excluded.sort
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
      const { id: langId } = upLang.get(pack.slug, pack.name, pack.tagline, pack.color, pack.status, pack.runner ?? null, JSON.stringify(pack.topics), JSON.stringify(pack.exams), li) as { id: number };
      pack.regions.forEach((region, ri) => {
        const { id: regionId } = upRegion.get(langId, region.slug, region.name, region.subtitle, region.theme, region.status ?? "active", ri) as { id: number };
        region.lessons.forEach((lesson, si) => {
          upLesson.run(regionId, langId, lesson.slug, lesson.title, lesson.concept, lesson.mode, lesson.xp, lesson.enemy, lesson.enemyName, JSON.stringify(lesson.beats), si);
        });
      });
    });
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
}

let seededThisModule = false;

export function db(): DatabaseSync {
  if (!globalThis.__bitforgeDb) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const d = new DatabaseSync(DB_PATH);
    d.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    d.exec(SCHEMA);
    migrate(d);
    d.prepare("INSERT OR IGNORE INTO players (id) VALUES (1)").run();
    globalThis.__bitforgeDb = d;
  }
  // Re-check content on every module (re)load so edits to content/ show up in dev.
  if (!seededThisModule) {
    seed(globalThis.__bitforgeDb);
    seededThisModule = true;
  }
  return globalThis.__bitforgeDb;
}
