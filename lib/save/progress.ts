// Pure game-progress logic over a SaveData. No I/O: callers persist the returned save.
// Content is passed in (WorldContent / ExamMeta), so the save never stores content, only results.
import { levelFromXp, starsFor, today } from "../game-rules.ts";
import type { Text } from "../i18n/text.ts";
import type { Theme } from "../content/types.ts";
import { langOf, type LangRecord, type SaveData } from "./schema.ts";

// ─── content shapes the client receives from the server ────────────────────
export interface LessonInfo { slug: string; title: Text; mode: "lesson" | "boss"; xp: number }
export interface RegionInfo { slug: string; name: Text; subtitle: Text; theme: Theme; status: "active" | "soon"; lessons: LessonInfo[] }
export interface WorldContent { regions: RegionInfo[] }

// ─── derived views ──────────────────────────────────────────────────────────
export interface LessonState extends LessonInfo { stars: number; completed: boolean; skipped: boolean; unlocked: boolean; mastery: number | null }
export interface RegionState extends Omit<RegionInfo, "lessons"> { unlocked: boolean; completed: boolean; lessons: LessonState[] }
export interface WorldState { regions: RegionState[]; reviewDue: number; isNew: boolean }

const DAY = 86_400_000;
const REVIEW_DAYS = [0, 1, 3, 7, 14];
const RETRY_LATER = 10 * 60_000;

export function worldState(content: WorldContent, rec: LangRecord | undefined, now = Date.now()): WorldState {
  const lessons = rec?.lessons ?? {};
  let previousRegionDone = true;
  const regions = content.regions.map((r) => {
    const unlocked = r.status === "active" && previousRegionDone;
    let previousLessonDone = true;
    const ls = r.lessons.map((l) => {
      const p = lessons[l.slug];
      const completed = !!p?.doneAt;
      const recent = p?.recent ?? "";
      const state: LessonState = {
        ...l,
        stars: p?.stars ?? 0,
        completed,
        skipped: !!p?.skipped,
        unlocked: unlocked && previousLessonDone,
        mastery: recent ? Math.round((100 * [...recent].filter((c) => c === "1").length) / recent.length) : null,
      };
      previousLessonDone = completed;
      return state;
    });
    const completed = ls.length > 0 && ls.every((l) => l.completed);
    previousRegionDone = completed;
    return { ...r, unlocked, completed, lessons: ls };
  });
  const reviewDue = Object.values(rec?.reviews ?? {}).filter((v) => v.due <= now).length;
  const isNew = !rec || (Object.keys(rec.lessons).length === 0 && Object.keys(rec.exams).length === 0);
  return { regions, reviewDue, isNew };
}

export function isUnlocked(content: WorldContent, rec: LangRecord | undefined, lessonSlug: string) {
  return worldState(content, rec).regions.some((r) => r.lessons.some((l) => l.slug === lessonSlug && l.unlocked));
}

export function nextLesson(content: WorldContent, rec: LangRecord | undefined): string | null {
  return worldState(content, rec).regions.flatMap((r) => r.lessons).find((l) => l.unlocked && !l.completed)?.slug ?? null;
}

// ─── mutations (return a new save) ──────────────────────────────────────────
const clone = (s: SaveData): SaveData => structuredClone(s);

/** Counts today as played. The first play of a new day gives a hint ticket. */
function bumpStreak(save: SaveData, now: number): number {
  const t = today(new Date(now));
  if (save.stats.lastDay === t) return 0;
  const yesterday = today(new Date(now - DAY));
  save.stats.streak = save.stats.lastDay === yesterday ? save.stats.streak + 1 : 1;
  save.stats.bestStreak = Math.max(save.stats.bestStreak, save.stats.streak);
  save.stats.lastDay = t;
  save.stats.tickets += 1;
  return 1;
}

function touch(save: SaveData, lang: string, now: number) {
  save.player.updatedAt = now;
  save.lastLang = lang;
  langOf(save, lang).lastPlayedAt = now;
}

export interface Attempt { beat: number; correct: boolean }

/** Records first-try answers: mastery history and spaced-repetition boxes for misses. */
function recordAttempts(rec: LangRecord, lessonSlug: string, attempts: Attempt[], now: number) {
  const l = rec.lessons[lessonSlug];
  for (const a of attempts) {
    if (a.beat < 0) continue;
    if (l) l.recent = (l.recent + (a.correct ? "1" : "0")).slice(-20);
    if (!a.correct) rec.reviews[`${lessonSlug}#${a.beat}`] = { box: 1, due: now + RETRY_LATER };
  }
}

export interface Reward { xpGained: number; coinsGained: number; stars: number; levelBefore: number; levelAfter: number; xpAfter: number; nextLesson: string | null; ticketsGained?: number }

export function completeLesson(
  save: SaveData,
  lang: string,
  content: WorldContent,
  lesson: LessonInfo,
  result: { score: number; mistakes: number; maxCombo: number; correct: number; attempts: Attempt[] },
  now = Date.now(),
): { save: SaveData; reward: Reward } {
  const s = clone(save);
  const rec = langOf(s, lang);
  const before = levelFromXp(s.stats.xp);
  const stars = starsFor(result.mistakes);
  const prev = rec.lessons[lesson.slug];
  const firstClear = !prev?.doneAt || !!prev.skipped;
  const xpGained = Math.round(lesson.xp * (firstClear ? 1 : 0.4) * (0.6 + stars * 0.15)) + Math.floor(Math.max(0, result.score) / 25);
  const coinsGained = Math.max(0, result.correct) + Math.min(20, Math.max(0, result.maxCombo));
  rec.lessons[lesson.slug] = {
    stars: Math.max(prev?.skipped ? 0 : prev?.stars ?? 0, stars),
    best: Math.max(prev?.best ?? 0, Math.round(result.score)),
    plays: (prev?.plays ?? 0) + 1,
    doneAt: prev?.doneAt && !prev.skipped ? prev.doneAt : now,
    recent: prev?.recent ?? "",
  };
  recordAttempts(rec, lesson.slug, result.attempts, now);
  s.stats.xp += xpGained;
  s.stats.coins += coinsGained;
  // A perfect (3-star) clear earns a hint ticket, and so does the first play of a day.
  const ticketsGained = (stars === 3 ? 1 : 0) + bumpStreak(s, now);
  if (stars === 3) s.stats.tickets += 1;
  touch(s, lang, now);
  return { save: s, reward: { xpGained, coinsGained, stars, levelBefore: before, levelAfter: levelFromXp(s.stats.xp), xpAfter: s.stats.xp, nextLesson: nextLesson(content, rec), ticketsGained } };
}

/** Game over: keep what was learned (misses enter review) without completing the lesson. */
export function recordFailedRun(save: SaveData, lang: string, lessonSlug: string, attempts: Attempt[], now = Date.now()): SaveData {
  const s = clone(save);
  recordAttempts(langOf(s, lang), lessonSlug, attempts, now);
  touch(s, lang, now);
  return s;
}

export function dueReviews(rec: LangRecord | undefined, now = Date.now(), limit = 8): string[] {
  return Object.entries(rec?.reviews ?? {})
    .filter(([, v]) => v.due <= now)
    .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
    .slice(0, limit)
    .map(([k]) => k);
}

export function completeReview(save: SaveData, lang: string, results: { key: string; correct: boolean }[], score: number, now = Date.now()) {
  const s = clone(save);
  const rec = langOf(s, lang);
  const before = levelFromXp(s.stats.xp);
  let correct = 0;
  for (const r of results) {
    const box = rec.reviews[r.key];
    if (!box) continue;
    if (r.correct) {
      correct++;
      const next = box.box + 1;
      if (next >= REVIEW_DAYS.length) delete rec.reviews[r.key];
      else rec.reviews[r.key] = { box: next, due: now + REVIEW_DAYS[next] * DAY };
    } else {
      rec.reviews[r.key] = { box: 1, due: now + RETRY_LATER };
    }
  }
  const xpGained = correct * 8 + Math.floor(score / 50);
  s.stats.xp += xpGained;
  s.stats.coins += correct;
  bumpStreak(s, now);
  touch(s, lang, now);
  const reward: Reward = { xpGained, coinsGained: correct, stars: starsFor(results.length - correct), levelBefore: before, levelAfter: levelFromXp(s.stats.xp), xpAfter: s.stats.xp, nextLesson: null };
  return { save: s, reward };
}

// ─── entry exams ────────────────────────────────────────────────────────────
export interface ExamMeta {
  slug: string;
  title: Text;
  passPct: number;
  topics: Record<string, { name: Text; region?: string }>;
  regions: { slug: string; name: Text; lessons: string[] }[];
}

export interface ExamReport {
  exam: { slug: string; title: Text; passPct: number };
  correct: number;
  total: number;
  pct: number;
  passed: boolean;
  topics: { id: string; name: Text; correct: number; total: number; region: string | null; regionName: Text | null }[];
  skippedRegions: Text[];
  xpGained: number;
}

/** Grades an attempt; answers carry the question topic. Regions are skipped in order while mastered (≥80% over ≥2 questions). */
export function completeExam(save: SaveData, lang: string, meta: ExamMeta, answers: { topic: string; correct: boolean }[], now = Date.now()) {
  const s = clone(save);
  const rec = langOf(s, lang);
  const tally = new Map<string, { correct: number; total: number }>();
  for (const a of answers) {
    const t = tally.get(a.topic) ?? { correct: 0, total: 0 };
    t.total++;
    if (a.correct) t.correct++;
    tally.set(a.topic, t);
  }
  const correct = answers.filter((a) => a.correct).length;
  const total = Math.max(answers.length, 1);
  const pct = Math.round((100 * correct) / total);
  const passed = pct >= meta.passPct;

  const skippedRegions: Text[] = [];
  for (const r of meta.regions) {
    let c = 0, n = 0;
    for (const [id, t] of tally) if (meta.topics[id]?.region === r.slug) { c += t.correct; n += t.total; }
    if (n < 2 || c / n < 0.8) break;
    for (const l of r.lessons) rec.lessons[l] ??= { stars: 0, best: 0, plays: 0, skipped: true, doneAt: now, recent: "" };
    skippedRegions.push(r.name);
  }

  const prev = rec.exams[meta.slug];
  rec.exams[meta.slug] = {
    attempts: (prev?.attempts ?? 0) + 1,
    bestPct: Math.max(prev?.bestPct ?? 0, pct),
    passed: !!prev?.passed || passed,
    last: { pct, at: now, topics: Object.fromEntries([...tally].map(([k, v]) => [k, [v.correct, v.total]])) },
  };
  const xpGained = correct * 6 + (passed ? 40 : 0);
  s.stats.xp += xpGained;
  s.stats.coins += correct;
  bumpStreak(s, now);
  touch(s, lang, now);

  const regionName = new Map(meta.regions.map((r) => [r.slug, r.name]));
  const report: ExamReport = {
    exam: { slug: meta.slug, title: meta.title, passPct: meta.passPct },
    correct,
    total,
    pct,
    passed,
    topics: [...tally]
      .map(([id, t]) => ({ id, name: meta.topics[id]?.name ?? id, ...t, region: meta.topics[id]?.region ?? null, regionName: regionName.get(meta.topics[id]?.region ?? "") ?? null }))
      .sort((a, b) => a.correct / a.total - b.correct / b.total),
    skippedRegions,
    xpGained,
  };
  return { save: s, report };
}

export function markLanded(save: SaveData, lang: string, now = Date.now()): SaveData {
  const s = clone(save);
  langOf(s, lang).landedAt ??= now;
  touch(s, lang, now);
  return s;
}

export function addPlayTime(save: SaveData, ms: number): SaveData {
  const s = clone(save);
  s.player.playMs += Math.max(0, Math.round(ms));
  return s;
}

// ─── hint tickets and preferences ───────────────────────────────────────────
export const TICKET_PRICE = 40;

/** Spends one hint ticket; null when there are none left. */
export function spendTicket(save: SaveData): SaveData | null {
  if (save.stats.tickets <= 0) return null;
  const s = clone(save);
  s.stats.tickets -= 1;
  return s;
}

/** Buys one hint ticket with coins; null when the player can't afford it. */
export function buyTicket(save: SaveData, price = TICKET_PRICE): SaveData | null {
  if (save.stats.coins < price) return null;
  const s = clone(save);
  s.stats.coins -= price;
  s.stats.tickets += 1;
  return s;
}

export function setTimerPref(save: SaveData, timer: SaveData["prefs"]["timer"]): SaveData {
  const s = clone(save);
  s.prefs = { ...s.prefs, timer };
  return s;
}
