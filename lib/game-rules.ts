// Pure game math shared by client and server.
export const levelFromXp = (xp: number) => Math.floor(Math.sqrt(xp / 40)) + 1;
export const xpForLevel = (level: number) => (level - 1) * (level - 1) * 40;

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current: xp - base, needed: next - base, ratio: (xp - base) / (next - base) };
}

export const starsFor = (mistakes: number) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);

/** Local calendar day "YYYY-MM-DD" (streaks follow the player's clock). */
export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// ─── lesson timer and scoring ───────────────────────────────────────────────
// Kept free of imports so Node can load it directly (save tests, validator).
export type TimerMode = "off" | "relaxed" | "normal" | "fast";

/** How each timer choice scales the time per question, and the most speed bonus it can earn. */
export const TIMER_MODES: Record<TimerMode, { scale: number; bonus: number }> = {
  off: { scale: 0, bonus: 0 },
  relaxed: { scale: 1.6, bonus: 40 },
  normal: { scale: 1, bonus: 60 },
  fast: { scale: 0.65, bonus: 90 },
};

interface TimedBeat { kind: string; time?: number; code?: string; lines?: string[] }

/** Base seconds for a question at "normal": longer code and harder kinds get more time. */
export function questionSeconds(beat: TimedBeat): number {
  if (beat.time) return beat.time;
  if (beat.kind === "run") return 120;
  if (beat.kind === "code") return 300;
  const lines = (beat.code ?? beat.lines?.join("\n") ?? "").split("\n").filter((l) => l.trim()).length;
  const base = beat.kind === "order" ? 14 : beat.kind === "type" ? 16 : beat.kind === "predict" ? 14 : 12;
  const perLine = beat.kind === "order" ? 3 : 2;
  return Math.min(60, Math.max(10, base + lines * perLine));
}

/** Milliseconds allowed for a question, or 0 for no timer. Bosses are always timed. */
export function questionLimitMs(beat: TimedBeat, mode: TimerMode, boss = false): number {
  const m = mode === "off" && boss ? "normal" : mode;
  return Math.round(questionSeconds(beat) * TIMER_MODES[m].scale * 1000);
}

/**
 * Points for a correct first answer: 100 plus a speed bonus (bigger with faster timers), times the
 * combo multiplier. Opening the explanation for this question costs 25% and the speed bonus.
 */
export function questionPoints(opts: { speed: number; combo: number; mode: TimerMode; usedNote: boolean }): number {
  const bonus = opts.usedNote ? 0 : Math.round(Math.max(0, Math.min(1, opts.speed)) * TIMER_MODES[opts.mode].bonus);
  const raw = (100 + bonus) * (1 + Math.min(Math.max(1, opts.combo) - 1, 10) * 0.1);
  return Math.round(opts.usedNote ? raw * 0.75 : raw);
}
