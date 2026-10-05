import "server-only";
import { db } from "./db";
import type { Beat, EnemyKind, ExamDef, ExamLevel, ExamQuestion, Theme, TopicDef } from "./content/types";
import { isQuestion } from "./content/types";
import { levelFromXp, levelProgress, starsFor, today } from "./game-rules";

export const PLAYER_ID = 1; // single local profile for now; accounts can come later

// ─── view models (plain objects, safe to pass to client components) ─────────
export interface PlayerView {
  name: string;
  xp: number;
  coins: number;
  streak: number;
  bestStreak: number;
  level: number;
  levelCurrent: number;
  levelNeeded: number;
}

export interface LessonSummary {
  slug: string;
  title: string;
  mode: "lesson" | "boss";
  stars: number;
  completed: boolean;
  skipped: boolean;
  unlocked: boolean;
  mastery: number | null;
}

export interface RegionView {
  slug: string;
  name: string;
  subtitle: string;
  theme: Theme;
  status: "active" | "soon";
  unlocked: boolean;
  completed: boolean;
  lessons: LessonSummary[];
}

export interface LanguageView {
  slug: string;
  name: string;
  tagline: string;
  color: string;
  status: "active" | "soon";
}

export interface WorldView {
  language: LanguageView;
  regions: RegionView[];
  player: PlayerView;
  reviewDue: number;
  isNew: boolean;
}

export interface LessonPlay {
  id: number;
  slug: string;
  title: string;
  mode: "lesson" | "boss" | "review" | "exam";
  /** Present in exam mode. */
  exam?: { slug: string; level: ExamLevel; passPct: number };
  xp: number;
  enemy: EnemyKind;
  enemyName: string;
  theme: Theme;
  regionName: string;
  languageSlug: string;
  beats: PlayBeat[];
}

/** A beat plus where it came from (needed for review mode, which mixes lessons). */
export interface PlayBeat {
  lessonId: number;
  index: number;
  beat: Beat;
}

type Row = Record<string, unknown>;
const plain = <T>(v: unknown): T => JSON.parse(JSON.stringify(v)) as T;

// ─── reads ──────────────────────────────────────────────────────────────────
export function getPlayer(): PlayerView {
  const p = db().prepare("SELECT * FROM players WHERE id = ?").get(PLAYER_ID) as Row;
  const xp = Number(p.xp);
  const lp = levelProgress(xp);
  return {
    name: String(p.name),
    xp,
    coins: Number(p.coins),
    streak: Number(p.streak),
    bestStreak: Number(p.best_streak),
    level: lp.level,
    levelCurrent: lp.current,
    levelNeeded: lp.needed,
  };
}

export function getLanguages(): LanguageView[] {
  const rows = db().prepare("SELECT slug, name, tagline, color, status FROM languages ORDER BY sort").all();
  return plain<LanguageView[]>(rows);
}

function getLanguageRow(slug: string) {
  return db().prepare("SELECT * FROM languages WHERE slug = ?").get(slug) as Row | undefined;
}

export function getWorld(langSlug: string): WorldView | null {
  const d = db();
  const lang = getLanguageRow(langSlug);
  if (!lang) return null;

  const regions = d.prepare("SELECT * FROM regions WHERE language_id = ? ORDER BY sort").all(lang.id as number) as Row[];
  const lessons = d
    .prepare(
      `SELECT l.id, l.region_id, l.slug, l.title, l.mode, p.stars, p.skipped, p.completed_at,
         (SELECT ROUND(AVG(correct) * 100) FROM (SELECT correct FROM attempts a
            WHERE a.player_id = ? AND a.lesson_id = l.id ORDER BY a.id DESC LIMIT 20)) AS mastery
       FROM lessons l LEFT JOIN progress p ON p.lesson_id = l.id AND p.player_id = ?
       WHERE l.language_id = ? ORDER BY l.sort`,
    )
    .all(PLAYER_ID, PLAYER_ID, lang.id as number) as Row[];

  let previousRegionDone = true;
  const regionViews: RegionView[] = regions.map((r) => {
    const status = r.status as "active" | "soon";
    const unlocked = status === "active" && previousRegionDone;
    let previousLessonDone = true;
    const ls: LessonSummary[] = lessons
      .filter((l) => l.region_id === r.id)
      .map((l) => {
        const completed = l.completed_at != null;
        const view: LessonSummary = {
          slug: String(l.slug),
          title: String(l.title),
          mode: l.mode as "lesson" | "boss",
          stars: Number(l.stars ?? 0),
          completed,
          skipped: Number(l.skipped ?? 0) === 1,
          unlocked: unlocked && previousLessonDone,
          mastery: l.mastery == null ? null : Number(l.mastery),
        };
        previousLessonDone = completed;
        return view;
      });
    const completed = ls.length > 0 && ls.every((l) => l.completed);
    previousRegionDone = completed;
    return {
      slug: String(r.slug),
      name: String(r.name),
      subtitle: String(r.subtitle),
      theme: r.theme as Theme,
      status,
      unlocked,
      completed,
      lessons: ls,
    };
  });

  const due = d
    .prepare(
      `SELECT COUNT(*) AS n FROM reviews rv JOIN lessons l ON l.id = rv.lesson_id
       WHERE rv.player_id = ? AND l.language_id = ? AND rv.due_at <= ?`,
    )
    .get(PLAYER_ID, lang.id as number, new Date().toISOString()) as Row;
  const anyProgress = d
    .prepare("SELECT COUNT(*) AS n FROM progress p JOIN lessons l ON l.id = p.lesson_id WHERE p.player_id = ? AND l.language_id = ?")
    .get(PLAYER_ID, lang.id as number) as Row;
  const examTaken = d.prepare("SELECT 1 FROM exam_results WHERE player_id = ? AND language_id = ?").get(PLAYER_ID, lang.id as number);

  return {
    language: plain<LanguageView>({ slug: lang.slug, name: lang.name, tagline: lang.tagline, color: lang.color, status: lang.status }),
    regions: regionViews,
    player: getPlayer(),
    reviewDue: Number(due.n),
    isNew: Number(anyProgress.n) === 0 && !examTaken,
  };
}

export function getLessonPlay(langSlug: string, lessonSlug: string): LessonPlay | null {
  const row = db()
    .prepare(
      `SELECT l.*, r.theme, r.name AS region_name, g.slug AS lang_slug FROM lessons l
       JOIN regions r ON r.id = l.region_id JOIN languages g ON g.id = l.language_id
       WHERE g.slug = ? AND l.slug = ?`,
    )
    .get(langSlug, lessonSlug) as Row | undefined;
  if (!row) return null;
  const beats = JSON.parse(String(row.beats)) as Beat[];
  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: String(row.title),
    mode: row.mode as "lesson" | "boss",
    xp: Number(row.xp),
    enemy: row.enemy as EnemyKind,
    enemyName: String(row.enemy_name),
    theme: row.theme as Theme,
    regionName: String(row.region_name),
    languageSlug: String(row.lang_slug),
    beats: beats.map((beat, index) => ({ lessonId: Number(row.id), index, beat })),
  };
}

export function isLessonUnlocked(langSlug: string, lessonSlug: string) {
  const world = getWorld(langSlug);
  return !!world?.regions.some((r) => r.lessons.some((l) => l.slug === lessonSlug && l.unlocked));
}

export function getReviewPlay(langSlug: string, limit = 8): LessonPlay | null {
  const lang = getLanguageRow(langSlug);
  if (!lang) return null;
  const rows = db()
    .prepare(
      `SELECT rv.lesson_id, rv.beat, l.beats FROM reviews rv JOIN lessons l ON l.id = rv.lesson_id
       WHERE rv.player_id = ? AND l.language_id = ? AND rv.due_at <= ?
       ORDER BY rv.box, rv.due_at LIMIT ?`,
    )
    .all(PLAYER_ID, lang.id as number, new Date().toISOString(), limit) as Row[];
  const beats: PlayBeat[] = [];
  for (const r of rows) {
    const beat = (JSON.parse(String(r.beats)) as Beat[])[Number(r.beat)];
    if (beat && isQuestion(beat) && beat.kind !== "run") {
      beats.push({ lessonId: Number(r.lesson_id), index: Number(r.beat), beat: { ...beat, setup: undefined, win: undefined } });
    }
  }
  return {
    id: 0,
    slug: "review",
    title: "BUGS ERRANTES",
    mode: "review",
    xp: 0,
    enemy: "ghost",
    enemyName: "BUG ERRANTE",
    theme: "forest",
    regionName: "Repaso",
    languageSlug: langSlug,
    beats,
  };
}

// ─── writes ─────────────────────────────────────────────────────────────────
export interface AttemptInput {
  lessonId: number;
  beat: number;
  correct: boolean;
  ms: number;
}

export interface RewardView {
  xpGained: number;
  coinsGained: number;
  stars: number;
  levelBefore: number;
  player: PlayerView;
  nextLesson: string | null;
}

function bumpStreak(): void {
  const d = db();
  const p = d.prepare("SELECT streak, best_streak, last_day FROM players WHERE id = ?").get(PLAYER_ID) as Row;
  const t = today();
  if (p.last_day === t) return;
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const streak = p.last_day === yesterday ? Number(p.streak) + 1 : 1;
  d.prepare("UPDATE players SET streak = ?, best_streak = MAX(best_streak, ?), last_day = ? WHERE id = ?").run(streak, streak, t, PLAYER_ID);
}

function recordAttempts(attempts: AttemptInput[]) {
  const d = db();
  const ins = d.prepare("INSERT INTO attempts (player_id, lesson_id, beat, correct, ms) VALUES (?, ?, ?, ?, ?)");
  const failed = d.prepare(
    `INSERT INTO reviews (player_id, lesson_id, beat, box, due_at) VALUES (?, ?, ?, 1, ?)
     ON CONFLICT(player_id, lesson_id, beat) DO UPDATE SET box = 1, due_at = excluded.due_at`,
  );
  for (const a of attempts) {
    if (a.lessonId <= 0 || a.beat < 0) continue;
    ins.run(PLAYER_ID, a.lessonId, a.beat, a.correct ? 1 : 0, Math.max(0, Math.round(a.ms)));
    if (!a.correct) failed.run(PLAYER_ID, a.lessonId, a.beat, new Date(Date.now() + 10 * 60_000).toISOString());
  }
}

function grant(xp: number, coins: number) {
  db().prepare("UPDATE players SET xp = xp + ?, coins = coins + ? WHERE id = ?").run(xp, coins, PLAYER_ID);
}

export function completeLesson(
  langSlug: string,
  lessonSlug: string,
  input: { score: number; mistakes: number; maxCombo: number; correct: number; attempts: AttemptInput[] },
): RewardView | null {
  const d = db();
  const lesson = getLessonPlay(langSlug, lessonSlug);
  if (!lesson) return null;
  const before = getPlayer();
  const stars = starsFor(input.mistakes);
  const prev = d.prepare("SELECT completed_at, skipped FROM progress WHERE player_id = ? AND lesson_id = ?").get(PLAYER_ID, lesson.id) as Row | undefined;
  const firstClear = !prev || prev.completed_at == null || Number(prev.skipped) === 1;
  const base = Math.round(lesson.xp * (firstClear ? 1 : 0.4) * (0.6 + stars * 0.15));
  const xpGained = base + Math.floor(Math.max(0, input.score) / 25);
  const coinsGained = Math.max(0, input.correct) + Math.min(20, Math.max(0, input.maxCombo));

  d.exec("BEGIN");
  try {
    d.prepare(
      `INSERT INTO progress (player_id, lesson_id, stars, best_score, plays, skipped, completed_at)
       VALUES (?, ?, ?, ?, 1, 0, ?)
       ON CONFLICT(player_id, lesson_id) DO UPDATE SET stars = MAX(stars, excluded.stars),
         best_score = MAX(best_score, excluded.best_score), plays = plays + 1, skipped = 0,
         completed_at = COALESCE(completed_at, excluded.completed_at)`,
    ).run(PLAYER_ID, lesson.id, stars, Math.round(input.score), new Date().toISOString());
    recordAttempts(input.attempts.map((a) => ({ ...a, lessonId: lesson.id })));
    grant(xpGained, coinsGained);
    bumpStreak();
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }

  const world = getWorld(langSlug)!;
  const next = world.regions.flatMap((r) => r.lessons).find((l) => l.unlocked && !l.completed);
  return { xpGained, coinsGained, stars, levelBefore: before.level, player: getPlayer(), nextLesson: next?.slug ?? null };
}

export function completeReview(langSlug: string, results: AttemptInput[], score: number): RewardView {
  const d = db();
  const before = getPlayer();
  const sel = d.prepare("SELECT box FROM reviews WHERE player_id = ? AND lesson_id = ? AND beat = ?");
  const upd = d.prepare("UPDATE reviews SET box = ?, due_at = ? WHERE player_id = ? AND lesson_id = ? AND beat = ?");
  const del = d.prepare("DELETE FROM reviews WHERE player_id = ? AND lesson_id = ? AND beat = ?");
  const ins = d.prepare("INSERT INTO attempts (player_id, lesson_id, beat, correct, ms) VALUES (?, ?, ?, ?, ?)");
  const days = [0, 1, 3, 7, 14];
  let correct = 0;
  d.exec("BEGIN");
  try {
    for (const r of results) {
      ins.run(PLAYER_ID, r.lessonId, r.beat, r.correct ? 1 : 0, Math.round(r.ms));
      const row = sel.get(PLAYER_ID, r.lessonId, r.beat) as Row | undefined;
      if (!row) continue;
      if (r.correct) {
        correct++;
        const box = Number(row.box) + 1;
        if (box >= days.length) del.run(PLAYER_ID, r.lessonId, r.beat);
        else upd.run(box, new Date(Date.now() + days[box] * 86_400_000).toISOString(), PLAYER_ID, r.lessonId, r.beat);
      } else {
        upd.run(1, new Date(Date.now() + 10 * 60_000).toISOString(), PLAYER_ID, r.lessonId, r.beat);
      }
    }
    const xpGained = correct * 8 + Math.floor(score / 50);
    grant(xpGained, correct);
    bumpStreak();
    d.exec("COMMIT");
    return { xpGained, coinsGained: correct, stars: starsFor(results.length - correct), levelBefore: before.level, player: getPlayer(), nextLesson: null };
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}


/** Saves attempts without completing the lesson (e.g. on game over) so mistakes still enter review. */
export function saveAttempts(langSlug: string, lessonSlug: string, attempts: AttemptInput[]) {
  const lesson = getLessonPlay(langSlug, lessonSlug);
  if (!lesson) return false;
  recordAttempts(attempts.map((a) => ({ ...a, lessonId: lesson.id })));
  return true;
}

// ─── entry exams ────────────────────────────────────────────────────────────
export interface ExamSummary {
  slug: string;
  level: ExamLevel;
  title: string;
  description: string;
  count: number;
  passPct: number;
  secondsPerQuestion: number;
  bankSize: number;
  attempts: number;
  best: { pct: number; passed: boolean } | null;
}

export interface ExamReport {
  exam: { slug: string; title: string; level: ExamLevel; passPct: number };
  correct: number;
  total: number;
  pct: number;
  passed: boolean;
  topics: { id: string; name: string; correct: number; total: number; region: string | null; regionName: string | null }[];
  skippedRegions: string[];
  player: PlayerView;
  xpGained: number;
}

function langExams(lang: Row) {
  return {
    exams: JSON.parse(String(lang.exams ?? "[]")) as ExamDef[],
    topics: JSON.parse(String(lang.topics ?? "{}")) as Record<string, TopicDef>,
  };
}

export function getExams(langSlug: string): { language: LanguageView; exams: ExamSummary[] } | null {
  const lang = getLanguageRow(langSlug);
  if (!lang) return null;
  const { exams } = langExams(lang);
  const stats = db().prepare(
    `SELECT exam, COUNT(*) AS n, MAX(pct) AS best, MAX(passed) AS passed FROM exam_results
     WHERE player_id = ? AND language_id = ? GROUP BY exam`,
  ).all(PLAYER_ID, lang.id as number) as Row[];
  const byExam = new Map(stats.map((s) => [String(s.exam), s]));
  return {
    language: plain<LanguageView>({ slug: lang.slug, name: lang.name, tagline: lang.tagline, color: lang.color, status: lang.status }),
    exams: exams.map((e) => {
      const s = byExam.get(e.slug);
      return {
        slug: e.slug, level: e.level, title: e.title, description: e.description, count: e.count, passPct: e.passPct,
        secondsPerQuestion: e.secondsPerQuestion, bankSize: e.questions.length,
        attempts: Number(s?.n ?? 0), best: s ? { pct: Number(s.best), passed: Number(s.passed) === 1 } : null,
      };
    }),
  };
}

/** Hard questions (difficulty 3) get 40% more time, like a real screening that weights them. */
export const questionTime = (exam: ExamDef, q: ExamQuestion) => Math.round(exam.secondsPerQuestion * (q.difficulty === 3 ? 1.4 : 1));

/** Draws `count` questions round-robin across topics so every attempt is balanced and different. */
function sampleQuestions(bank: ExamQuestion[], count: number) {
  const byTopic = new Map<string, number[]>();
  bank.forEach((q, i) => byTopic.set(q.topic, [...(byTopic.get(q.topic) ?? []), i]));
  const pools = [...byTopic.values()].map((ids) => ids.sort(() => Math.random() - 0.5)).sort(() => Math.random() - 0.5);
  const picked: number[] = [];
  while (picked.length < Math.min(count, bank.length)) {
    for (const pool of pools) if (pool.length && picked.length < count) picked.push(pool.pop()!);
  }
  // easier questions first, like a real screening that warms up
  return picked.sort((a, b) => (bank[a].difficulty ?? 2) - (bank[b].difficulty ?? 2));
}

export function getExamPlay(langSlug: string, examSlug: string): LessonPlay | null {
  const lang = getLanguageRow(langSlug);
  if (!lang) return null;
  const exam = langExams(lang).exams.find((e) => e.slug === examSlug);
  if (!exam || exam.questions.length === 0) return null;
  const intro: Beat = {
    kind: "dialog",
    speaker: "master",
    text: `${exam.title}: ${exam.count} preguntas, ${exam.secondsPerQuestion} s cada una. Apruebas con ${exam.passPct}%. ¡Como en una entrevista real!`,
  };
  const ids = sampleQuestions(exam.questions, exam.count);
  return {
    id: 0,
    slug: exam.slug,
    title: `PRUEBA ${exam.level.toUpperCase()}`,
    mode: "exam",
    exam: { slug: exam.slug, level: exam.level, passPct: exam.passPct },
    xp: 0,
    enemy: exam.level === "senior" ? "dragon" : exam.level === "mid" ? "golem" : "slime",
    enemyName: "ENTREVISTADOR",
    theme: exam.level === "senior" ? "tower" : "village",
    regionName: "Prueba de ingreso",
    languageSlug: langSlug,
    beats: [
      { lessonId: 0, index: -1, beat: intro },
      ...ids.map((i) => ({ lessonId: 0, index: i, beat: { ...exam.questions[i], time: questionTime(exam, exam.questions[i]), setup: undefined, win: undefined } as Beat })),
    ],
  };
}

/** Grades on the server (the bank is the source of truth), stores the attempt and skips mastered regions. */
export function completeExam(langSlug: string, examSlug: string, answers: { index: number; correct: boolean }[]): ExamReport | null {
  const d = db();
  const lang = getLanguageRow(langSlug);
  if (!lang) return null;
  const { exams, topics } = langExams(lang);
  const exam = exams.find((e) => e.slug === examSlug);
  if (!exam) return null;

  const seen = new Set<number>();
  const valid = answers.filter((a) => a.index >= 0 && a.index < exam.questions.length && !seen.has(a.index) && seen.add(a.index));
  const tally = new Map<string, { correct: number; total: number }>();
  for (const a of valid) {
    const t = exam.questions[a.index].topic;
    const cur = tally.get(t) ?? { correct: 0, total: 0 };
    cur.total++;
    if (a.correct) cur.correct++;
    tally.set(t, cur);
  }
  const correct = valid.filter((a) => a.correct).length;
  const total = Math.max(valid.length, 1);
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= exam.passPct;

  const regions = d.prepare("SELECT id, slug, name FROM regions WHERE language_id = ? AND status = 'active' ORDER BY sort").all(lang.id as number) as Row[];
  const regionName = new Map(regions.map((r) => [String(r.slug), String(r.name)]));
  const skip = d.prepare(
    `INSERT INTO progress (player_id, lesson_id, stars, skipped, completed_at) VALUES (?, ?, 0, 1, ?)
     ON CONFLICT(player_id, lesson_id) DO NOTHING`,
  );
  const skippedRegions: string[] = [];
  const xpGained = correct * 6 + (passed ? 40 : 0);

  d.exec("BEGIN");
  try {
    // Skip regions in order while the player proves mastery (≥80% over ≥2 questions of that region's topics).
    for (const r of regions) {
      let c = 0, n = 0;
      for (const [id, t] of tally) if (topics[id]?.region === r.slug) { c += t.correct; n += t.total; }
      if (n < 2 || c / n < 0.8) break;
      for (const l of d.prepare("SELECT id FROM lessons WHERE region_id = ?").all(r.id as number) as Row[]) skip.run(PLAYER_ID, l.id as number, new Date().toISOString());
      skippedRegions.push(String(r.name));
    }
    const topicRows = [...tally].map(([id, t]) => ({ id, ...t }));
    d.prepare(
      `INSERT INTO exam_results (player_id, language_id, exam, correct, total, pct, passed, topics, skipped_regions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(PLAYER_ID, lang.id as number, exam.slug, correct, total, pct, passed ? 1 : 0, JSON.stringify(topicRows), skippedRegions.length);
    grant(xpGained, correct);
    bumpStreak();
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }

  return {
    exam: { slug: exam.slug, title: exam.title, level: exam.level, passPct: exam.passPct },
    correct,
    total,
    pct,
    passed,
    topics: [...tally]
      .map(([id, t]) => ({ id, name: topics[id]?.name ?? id, ...t, region: topics[id]?.region ?? null, regionName: regionName.get(topics[id]?.region ?? "") ?? null }))
      .sort((a, b) => a.correct / a.total - b.correct / b.total),
    skippedRegions,
    player: getPlayer(),
    xpGained,
  };
}
