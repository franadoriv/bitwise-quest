import "server-only";
import { LANGUAGE_PACKS } from "@/content/index.ts";
import type { Beat, CodeLang, EnemyKind, ExamDef, ExamLevel, ExamQuestion, LanguagePack, LessonDef, PlanetDef, RegionDef, Theme } from "./content/types";
import { BROWSER_RUNNER_IDS } from "./runners/ids";
import { isQuestion } from "./content/types";
import { localized } from "./i18n/messages";
import type { Localized, Text } from "./i18n/text";
import type { ExamMeta, RegionInfo, WorldContent } from "./save/progress";

// The server only serves CONTENT, straight from the language packs in content/: no database and no
// disk writes, so the process is stateless and runs anywhere. Player progress lives in the client
// save (lib/save). Everything here is computed from immutable data indexed once at module load.

const PACKS = new Map(LANGUAGE_PACKS.map((p) => [p.slug, p]));

interface LessonEntry { lesson: LessonDef; region: RegionDef; id: number }
const LESSONS = new Map<string, Map<string, LessonEntry>>();
for (const pack of LANGUAGE_PACKS) {
  const bySlug = new Map<string, LessonEntry>();
  let id = 0;
  for (const region of pack.regions) for (const lesson of region.lessons) bySlug.set(lesson.slug, { lesson, region, id: ++id });
  LESSONS.set(pack.slug, bySlug);
}

// ─── view models ────────────────────────────────────────────────────────────
export interface LanguageView {
  slug: string;
  /** Set for moons: the slug of the planet they orbit. */
  parent: string | null;
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
  /** Runner id (server "rust-playground" or browser "js-browser") and the code language. */
  runner: string | null;
  codeLang: CodeLang;
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

const langView = (p: LanguagePack): LanguageView => ({ slug: p.slug, parent: p.parent ?? null, name: p.name, tagline: p.tagline, color: p.color, status: p.status, planet: p.planet });
const codeLangOf = (p: LanguagePack): CodeLang => p.codeLang ?? (p.slug === "rust" ? "rust" : "ts");
const runInfo = (p: LanguagePack) => ({ runner: p.runner ?? null, codeLang: codeLangOf(p) });
const guideOf = (p: LanguagePack): Guide => ({ name: p.planet.guide.name, sprite: p.planet.guide.sprite });

// ─── queries ────────────────────────────────────────────────────────────────
export function getLanguages(): LanguageView[] {
  return LANGUAGE_PACKS.map(langView);
}

export function getLanguage(slug: string): LanguageView | null {
  const p = PACKS.get(slug);
  return p ? langView(p) : null;
}

/** Server-side runner of an active language (used to validate /api/run). Browser runners never reach the server. */
export function getRunner(slug: string): string | null {
  const p = PACKS.get(slug);
  if (p?.status !== "active" || !p.runner || BROWSER_RUNNER_IDS.has(p.runner)) return null;
  return p.runner;
}

export function getWorldContent(langSlug: string): (WorldContent & { language: LanguageView }) | null {
  const pack = PACKS.get(langSlug);
  if (!pack) return null;
  return {
    language: langView(pack),
    regions: pack.regions.map(
      (r): RegionInfo => ({
        slug: r.slug,
        name: r.name,
        subtitle: r.subtitle,
        theme: r.theme,
        status: r.status ?? "active",
        lessons: r.lessons.map((l) => ({ slug: l.slug, title: l.title, mode: l.mode, xp: l.xp })),
      }),
    ),
  };
}

export function getLessonPlay(langSlug: string, lessonSlug: string): LessonPlay | null {
  const pack = PACKS.get(langSlug);
  const entry = LESSONS.get(langSlug)?.get(lessonSlug);
  if (!pack || !entry) return null;
  const { lesson, region, id } = entry;
  return {
    slug: lesson.slug,
    title: lesson.title,
    mode: lesson.mode,
    xp: lesson.xp,
    enemy: lesson.enemy,
    enemyName: lesson.enemyName,
    theme: region.theme,
    regionName: region.name,
    languageSlug: langSlug,
    ...runInfo(pack),
    guide: guideOf(pack),
    beats: lesson.beats.map((beat, index) => ({ lessonId: id, index, beat, lesson: lesson.slug })),
  };
}

/** Builds a review run from save keys "<lessonSlug>#<beatIndex>" (the client knows which are due). */
export function getReviewPlay(langSlug: string, keys: string[]): LessonPlay | null {
  const pack = PACKS.get(langSlug);
  if (!pack) return null;
  const beats: PlayBeat[] = [];
  for (const key of keys.slice(0, 12)) {
    const [slug, idx] = key.split("#");
    const entry = LESSONS.get(langSlug)?.get(slug);
    const beat = entry?.lesson.beats[Number(idx)];
    if (entry && beat && isQuestion(beat) && beat.kind !== "run") {
      beats.push({ lessonId: entry.id, index: Number(idx), lesson: slug, beat: { ...beat, setup: undefined, win: undefined } });
    }
  }
  return {
    slug: "review",
    title: localized("review.title"),
    mode: "review",
    xp: 0,
    enemy: pack.planet.bugs[0] ?? "ghost",
    enemyName: localized("review.enemy"),
    theme: "forest",
    regionName: localized("review.region"),
    languageSlug: langSlug,
    ...runInfo(pack),
    guide: guideOf(pack),
    beats,
  };
}

export function getExams(langSlug: string): { language: LanguageView; exams: ExamSummary[] } | null {
  const pack = PACKS.get(langSlug);
  if (!pack) return null;
  return {
    language: langView(pack),
    exams: pack.exams.map((e) => ({
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
  const pack = PACKS.get(langSlug);
  const world = getWorldContent(langSlug);
  if (!pack || !world) return null;
  const exam = pack.exams.find((e) => e.slug === examSlug);
  if (!exam || exam.questions.length === 0) return null;
  const title = exam.title as Localized;
  const intro: Beat = {
    kind: "dialog",
    speaker: "master",
    text: localized("exam.introDialog", (l) => ({ title: typeof title === "string" ? title : title[l], count: exam.count, secs: exam.secondsPerQuestion, pct: exam.passPct })),
  };
  const ids = sampleQuestions(exam.questions, exam.count);
  const bugs = pack.planet.bugs;
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
    ...runInfo(pack),
    guide: guideOf(pack),
    beats: [
      { lessonId: 0, index: -1, lesson: "", beat: intro },
      ...ids.map((i) => ({ lessonId: 0, index: i, lesson: "", beat: { ...exam.questions[i], time: questionTime(exam, exam.questions[i]), setup: undefined, win: undefined } as Beat })),
    ],
    exam: {
      slug: exam.slug,
      level: exam.level,
      title: exam.title,
      passPct: exam.passPct,
      topics: Object.fromEntries(Object.entries(pack.topics).map(([k, t]) => [k, { name: t.name, region: t.region }])),
      regions: world.regions.filter((r) => r.status === "active").map((r) => ({ slug: r.slug, name: r.name, lessons: r.lessons.map((l) => l.slug) })),
    },
  };
}
