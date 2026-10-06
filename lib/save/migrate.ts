// Versioned save migrations. Old saves are upgraded step by step to the current SAVE_VERSION.
//
// To change the save shape:
//   1. bump SAVE_VERSION in schema.ts and update the types,
//   2. add MIGRATIONS[<old version>] that returns the next version's shape,
//   3. add a fixture test in tests/save.test.ts that decodes an old save.
import { SAVE_VERSION, START_TICKETS, TIMER_PREFS, cleanName, emptyLang, type LangRecord, type SaveData, type TimerPref } from "./schema.ts";

export type SaveErrorCode = "format" | "checksum" | "newer" | "corrupt";

export class SaveError extends Error {
  code: SaveErrorCode;
  constructor(code: SaveErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

type AnySave = Record<string, unknown> & { version: number };

/** MIGRATIONS[n] upgrades a version-n save to version n+1. */
const MIGRATIONS: Record<number, (s: AnySave) => AnySave> = {
  // v2: hint tickets (everyone starts with the same allowance) and the lesson timer preference.
  1: (s) => ({ ...s, version: 2, stats: { ...obj(s.stats), tickets: START_TICKETS }, prefs: { timer: "normal" } }),
};

const num = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Fills defaults for missing fields without dropping unknown ones. */
function normalize(s: AnySave): SaveData {
  const player = obj(s.player);
  const stats = obj(s.stats);
  const prefs = obj(s.prefs);
  const langs: Record<string, LangRecord> = {};
  for (const [k, v] of Object.entries(obj(s.langs))) {
    const l = obj(v);
    langs[k] = { ...emptyLang(), ...l, lessons: obj(l.lessons), reviews: obj(l.reviews), exams: obj(l.exams) } as LangRecord;
  }
  return {
    ...s,
    version: SAVE_VERSION,
    id: typeof s.id === "string" ? s.id : `legacy-${num(player.createdAt, Date.now())}`,
    player: {
      ...player,
      name: cleanName(String(player.name ?? "")) || "HERO",
      createdAt: num(player.createdAt, Date.now()),
      updatedAt: num(player.updatedAt, Date.now()),
      playMs: num(player.playMs),
    },
    stats: {
      ...stats,
      xp: num(stats.xp),
      coins: num(stats.coins),
      streak: num(stats.streak),
      bestStreak: num(stats.bestStreak),
      lastDay: typeof stats.lastDay === "string" ? stats.lastDay : null,
      tickets: num(stats.tickets, START_TICKETS),
    },
    prefs: { ...prefs, timer: TIMER_PREFS.includes(prefs.timer as TimerPref) ? (prefs.timer as TimerPref) : "normal" },
    langs,
  } as SaveData;
}

export function migrate(raw: unknown): SaveData {
  if (!raw || typeof raw !== "object" || typeof (raw as AnySave).version !== "number") {
    throw new SaveError("corrupt", "Not a save file");
  }
  let s = raw as AnySave;
  if (s.version > SAVE_VERSION) throw new SaveError("newer", `Save version ${s.version} is newer than this game (${SAVE_VERSION})`);
  while (s.version < SAVE_VERSION) {
    const step = MIGRATIONS[s.version];
    if (!step) throw new SaveError("corrupt", `No migration from version ${s.version}`);
    s = step(s);
  }
  return normalize(s);
}
