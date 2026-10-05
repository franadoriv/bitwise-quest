import "server-only";
import { db } from "./db";
import type { Beat, EnemyKind, ExamDef, ExamLevel, ExamQuestion, PlanetDef, Theme, TopicDef } from "./content/types";
import { isQuestion } from "./content/types";
import { localized } from "./i18n/messages";
import type { Localized, Text } from "./i18n/text";
import type { ExamMeta, RegionInfo, WorldContent } from "./save/progress";

// The server only serves CONTENT. Player progress lives in the client save (lib/save).

type Row = Record<string, unknown>;

/** Text columns hold JSON (a Localized object or a plain string). */
function txt(v: unknown): Text {
  const raw = String(v ?? "");
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" || (parsed && typeof parsed === "object") ? (parsed as Text) : raw;
  } catch {
    return raw;
  }
}

// ─── view models ────────────────────────────────────────────────────────────
export interface LanguageView {
  slug: string;
  name: string;
  tagline: Text;
  color: string;
  status: "active" | "soon";
  planet: PlanetDef;
}

export interface Guide { name: Text; sprite: string }

export interface PlayBeat {
  lessonId: number;
  index: number;
  beat: Beat;
  /** Lesson slug the beat comes from (review mode mixes lessons). */
  lesson: string;
}

export interface LessonPlay {
  slug: string;
  title: Text;
  mode: "lesson" | "boss" | "review" | "exam";
  xp: number;
  enemy: EnemyKind;
  enemyName: Text;
  theme: Theme;
  regionName: Text;
  languageSlug: string;
  guide: Guide;
  beats: PlayBeat[];
  /** Present in exam mode: what the client needs to grade the attempt. */
  exam?: ExamMeta & { level: ExamLevel };
}

export interface ExamSummary {
  slug: string;
  level: ExamLevel;
  title: Text;
  description: Text;
  count: number;
  passPct: number;
  secondsPerQuestion: number;
  bankSize: number;
}

function langView(r: Row): LanguageView {
  return {
    slug: String(r.slug),
    name: String(r.name),
    tagline: txt(r.tagline),
    color: String(r.color),
    status: r.status as "active" | "soon",
    planet: JSON.parse(String(r.planet ?? "null")) as PlanetDef,
  };
}

const getLanguageRow = (slug: string) => db().prepare("SELECT * FROM languages WHERE slug = ?").get(slug) as Row | undefined;
const guideOf = (lang: LanguageView): Guide => ({ name: lang.planet.guide.name, sprite: lang.planet.guide.sprite });

export function getLanguages(): LanguageView[] {
  return (db().prepare("SELECT * FROM languages ORDER BY sort").all() as Row[]).map(langView);
}

export function getLanguage(slug: string): LanguageView | null {
  const r = getLanguageRow(slug);
  return r ? langView(r) : null;
}

export function getWorldContent(langSlug: string): (WorldContent & { language: LanguageView }) | null {
  const lang = getLanguageRow(langSlug);
  if (!lang) return null;
  const regions = db().prepare("SELECT * FROM regions WHERE language_id = ? ORDER BY sort").all(lang.id as number) as Row[];
  const lessons = db().prepare("SELECT region_id, slug, title, mode, xp FROM lessons WHERE language_id = ? ORDER BY sort").all(lang.id as number) as Row[];
  return {
    language: langView(lang),
    regions: regions.map(
      (r): RegionInfo => ({
        slug: String(r.slug),
        name: txt(r.name),
        subtitle: txt(r.subtitle),
        theme: r.theme as Theme,
        status: r.status as "active" | "soon",
        lessons: lessons
          .filter((l) => l.region_id === r.id)
          .map((l) => ({ slug: String(l.slug), title: txt(l.title), mode: l.mode as "lesson" | "boss", xp: Number(l.xp) })),
      }),
    ),
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
  const lang = getLanguage(langSlug);
  if (!row || !lang) return null;
  const beats = JSON.parse(String(row.beats)) as Beat[];
  return {
    slug: String(row.slug),
    title: txt(row.title),
    mode: row.mode as "lesson" | "boss",
    xp: Number(row.xp),
    enemy: String(row.enemy),
    enemyName: txt(row.enemy_name),
    theme: row.theme as Theme,
    regionName: txt(row.region_name),
    languageSlug: langSlug,
    guide: guideOf(lang),
    beats: beats.map((beat, index) => ({ lessonId: Number(row.id), index, beat, lesson: String(row.slug) })),
  };
}

/** Builds a review run from save keys "<lessonSlug>#<beatIndex>" (the client knows which are due). */
export function getReviewPlay(langSlug: string, keys: string[]): LessonPlay | null {
  const lang = getLanguage(langSlug);
  if (!lang) return null;
  const beats: PlayBeat[] = [];
  const cache = new Map<string, Row | undefined>();
  for (const key of keys.slice(0, 12)) {
    const [slug, idx] = key.split("#");
    if (!cache.has(slug)) cache.set(slug, db().prepare("SELECT l.id, l.beats FROM lessons l JOIN languages g ON g.id = l.language_id WHERE g.slug = ? AND l.slug = ?").get(langSlug, slug) as Row | undefined);
    const row = cache.get(slug);
    const beat = row ? (JSON.parse(String(row.beats)) as Beat[])[Number(idx)] : undefined;
    if (beat && isQuestion(beat) && beat.kind !== "run") beats.push({ lessonId: Number(row!.id), index: Number(idx), lesson: slug, beat: { ...beat, setup: undefined, win: undefined } });
  }
  const enemy = lang.planet.bugs[0] ?? "ghost";
  return {
    slug: "review",
    title: localized("review.title"),
    mode: "review",
    xp: 0,
    enemy,
    enemyName: localized("review.enemy"),
    theme: "forest",
    regionName: localized("review.region"),
    languageSlug: langSlug,
    guide: guideOf(lang),
    beats,
  };
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
  return {
    language: langView(lang),
    exams: langExams(lang).exams.map((e) => ({
      slug: e.slug, level: e.level, title: e.title, description: e.description, count: e.count, passPct: e.passPct,
      secondsPerQuestion: e.secondsPerQuestion, bankSize: e.questions.length,
    })),
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
  return picked.sort((a, b) => (bank[a].difficulty ?? 2) - (bank[b].difficulty ?? 2));
}

export function getExamPlay(langSlug: string, examSlug: string): LessonPlay | null {
  const row = getLanguageRow(langSlug);
  const world = getWorldContent(langSlug);
  if (!row || !world) return null;
  const { exams, topics } = langExams(row);
  const exam = exams.find((e) => e.slug === examSlug);
  if (!exam || exam.questions.length === 0) return null;
  const title = exam.title as Localized;
  const intro: Beat = {
    kind: "dialog",
    speaker: "master",
    text: localized("exam.introDialog", (l) => ({ title: typeof title === "string" ? title : title[l], count: exam.count, secs: exam.secondsPerQuestion, pct: exam.passPct })),
  };
  const ids = sampleQuestions(exam.questions, exam.count);
  const bugs = world.language.planet.bugs;
  return {
    slug: exam.slug,
    title: localized("exam.playTitle", (l) => ({ level: localized(`exam.${exam.level}`)[l] })),
    mode: "exam",
    xp: 0,
    enemy: bugs[Math.min(bugs.length - 1, exam.level === "senior" ? 3 : exam.level === "mid" ? 2 : 0)] ?? "slime",
    enemyName: localized("exam.interviewer"),
    theme: exam.level === "senior" ? "tower" : "village",
    regionName: localized("exam.region"),
    languageSlug: langSlug,
    guide: guideOf(world.language),
    beats: [
      { lessonId: 0, index: -1, lesson: "", beat: intro },
      ...ids.map((i) => ({ lessonId: 0, index: i, lesson: "", beat: { ...exam.questions[i], time: questionTime(exam, exam.questions[i]), setup: undefined, win: undefined } as Beat })),
    ],
    exam: {
      slug: exam.slug,
      level: exam.level,
      title: exam.title,
      passPct: exam.passPct,
      topics: Object.fromEntries(Object.entries(topics).map(([k, t]) => [k, { name: t.name, region: t.region }])),
      regions: world.regions.filter((r) => r.status === "active").map((r) => ({ slug: r.slug, name: r.name, lessons: r.lessons.map((l) => l.slug) })),
    },
  };
}
