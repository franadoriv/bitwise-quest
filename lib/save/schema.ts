// Save-game data model. Everything the player earns lives here, on the client.
//
// Design rules (see docs/save-system.md):
// - Progress is keyed by stable slugs (language → lesson/exam), never by array position or DB id,
//   so adding a language, region or lesson never changes the structure.
// - Unknown keys are preserved untouched (a newer content pack or an older game can round-trip a save).
// - Any change to this shape bumps SAVE_VERSION and adds a migration in migrate.ts.

export const SAVE_VERSION = 1;
export const SLOT_COUNT = 15;
export const NAME_MAX = 12;

export interface LessonRecord {
  stars: number;
  best: number;
  plays: number;
  /** Marked done by an entry exam rather than played. */
  skipped?: boolean;
  /** Epoch ms of the first completion. */
  doneAt: number;
  /** Last ≤20 first-try answers, oldest first: "1" correct, "0" wrong. */
  recent: string;
}

/** Leitner box for a beat that was missed. Key: "<lessonSlug>#<beatIndex>". */
export interface ReviewRecord {
  box: number;
  due: number;
}

export interface ExamRecord {
  attempts: number;
  bestPct: number;
  passed: boolean;
  last?: { pct: number; at: number; topics: Record<string, [correct: number, total: number]> };
}

export interface LangRecord {
  lessons: Record<string, LessonRecord>;
  reviews: Record<string, ReviewRecord>;
  exams: Record<string, ExamRecord>;
  /** Epoch ms the player first landed on this planet (intro shown). */
  landedAt?: number;
  lastPlayedAt?: number;
}

export interface SaveData {
  version: typeof SAVE_VERSION;
  /** Random id: identifies the same save across exports/imports. */
  id: string;
  player: { name: string; createdAt: number; updatedAt: number; playMs: number };
  stats: { xp: number; coins: number; streak: number; bestStreak: number; lastDay: string | null };
  /** Last planet visited. */
  lastLang?: string;
  langs: Record<string, LangRecord>;
}

export const emptyLang = (): LangRecord => ({ lessons: {}, reviews: {}, exams: {} });

export function cleanName(name: string): string {
  return name.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, NAME_MAX);
}

export function newSave(name: string, now = Date.now()): SaveData {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${now}-${Math.random().toString(36).slice(2)}`;
  return {
    version: SAVE_VERSION,
    id,
    player: { name: cleanName(name) || "HERO", createdAt: now, updatedAt: now, playMs: 0 },
    stats: { xp: 0, coins: 0, streak: 0, bestStreak: 0, lastDay: null },
    langs: {},
  };
}

/** Returns the language record, creating it if needed (mutates the save). */
export function langOf(save: SaveData, lang: string): LangRecord {
  return (save.langs[lang] ??= emptyLang());
}
