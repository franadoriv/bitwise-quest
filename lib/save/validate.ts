// Treat imports and cloud rows as untrusted data, even when their checksum is correct.
import { SaveError } from "./migrate.ts";

export const MAX_SAVE_BYTES = 2_000_000;
const fail = (): never => { throw new SaveError("corrupt", "Invalid save structure"); };
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail();
  return value as Record<string, unknown>;
};
function number(record: Record<string, unknown>, key: string, max = Number.MAX_SAFE_INTEGER) {
  if (record[key] !== undefined && (!Number.isSafeInteger(record[key]) || Number(record[key]) < 0 || Number(record[key]) > max)) fail();
}
function string(record: Record<string, unknown>, key: string, max: number) {
  if (record[key] !== undefined && (typeof record[key] !== "string" || record[key].length > max)) fail();
}
function boolean(record: Record<string, unknown>, key: string) {
  if (record[key] !== undefined && typeof record[key] !== "boolean") fail();
}
function dictionary(record: Record<string, unknown>, key: string, check: (value: Record<string, unknown>) => void) {
  if (record[key] === undefined) return;
  for (const value of Object.values(object(record[key]))) check(object(value));
}

/** Missing old fields can still migrate; present known fields must have the right type and range. */
export function validateSaveInput(raw: unknown): void {
  const root = object(raw);
  if (!Number.isSafeInteger(root.version) || Number(root.version) < 1) fail();
  const pending: { value: unknown; depth: number }[] = [{ value: raw, depth: 0 }];
  let visited = 0;
  while (pending.length) {
    const { value, depth } = pending.pop()!;
    if (++visited > 50_000 || depth > 48) fail();
    if (!value || typeof value !== "object") continue;
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "constructor", "prototype"].includes(key)) fail();
      pending.push({ value: child, depth: depth + 1 });
    }
  }
  string(root, "id", 128); string(root, "lastLang", 100);
  if (root.player !== undefined) {
    const player = object(root.player);
    string(player, "name", 128);
    for (const key of ["createdAt", "updatedAt", "playMs"]) number(player, key);
  }
  if (root.stats !== undefined) {
    const stats = object(root.stats);
    for (const key of ["xp", "coins", "streak", "bestStreak", "tickets"]) number(stats, key);
    if (stats.lastDay !== undefined && stats.lastDay !== null && (typeof stats.lastDay !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(stats.lastDay))) fail();
  }
  if (root.prefs !== undefined) { const prefs = object(root.prefs); string(prefs, "timer", 32); }
  dictionary(root, "langs", (lang) => {
    number(lang, "landedAt"); number(lang, "lastPlayedAt");
    dictionary(lang, "lessons", (lesson) => {
      number(lesson, "stars", 3);
      for (const key of ["best", "plays", "doneAt"]) number(lesson, key);
      boolean(lesson, "skipped"); string(lesson, "recent", 20);
      if (typeof lesson.recent === "string" && !/^[01]*$/.test(lesson.recent)) fail();
    });
    dictionary(lang, "reviews", (review) => { number(review, "box", 32); number(review, "due"); });
    dictionary(lang, "exams", (exam) => {
      number(exam, "attempts"); number(exam, "bestPct", 100); boolean(exam, "passed");
      if (exam.last !== undefined) {
        const last = object(exam.last); number(last, "pct", 100); number(last, "at");
        if (last.topics !== undefined) for (const counts of Object.values(object(last.topics))) {
          if (!Array.isArray(counts) || counts.length !== 2 || counts.some((n) => !Number.isSafeInteger(n) || n < 0) || counts[0] > counts[1]) fail();
        }
      }
    });
  });
}
