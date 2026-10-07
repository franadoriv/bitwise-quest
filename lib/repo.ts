import "server-only";
import { LANGUAGE_PACKS } from "@/content/index.ts";
import type { Beat, CodeLang, CodeTaskBeat, DebugBeat, TraceBeat, NoteDef, EnemyKind, ExamDef, ExamLevel, ExamQuestion, LanguagePack, LessonDef, PlanetDef, RegionDef, Theme } from "./content/types";
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
  /** Where the server finds this coding or debug task's tests, when it isn't implied by the play. */
  task?: { scope: "lesson" | "exam"; slug: string; index: number };
}

export interface LessonPlay {
  slug: string;
  title: Text;
  mode: "lesson" | "boss" | "review" | "exam" | "practice";
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
  /** Long explanations by lesson slug (lessons and reviews; never in exams). */
  notes?: Record<string, NoteDef[]>;
  /** Practice mode: the task played and whether it is played on paper. */
  practice?: { slug: string; kind: PracticeKind; paper: boolean };
}

/**
 * A lesson's notes. Until a lesson has its own, its teaching dialogs stand in as a single note, so
 * the explanation button always has something to show.
 */
function notesOf(lesson: LessonDef): NoteDef[] {
  if (lesson.notes?.length) return lesson.notes;
  const blocks: NoteDef["blocks"] = lesson.beats.flatMap((b) =>
    b.kind === "dialog" && b.speaker !== "enemy" ? [{ t: "p" as const, text: b.text }, ...(b.code ? [{ t: "code" as const, code: b.code }] : [])] : [],
  );
  return blocks.length ? [{ id: "lesson", title: lesson.title, blocks }] : [];
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

/**
 * What a player may see of a beat. Coding tasks lose their reference solution and near misses, and
 * with a server runner the hidden tests stay on the server (only their count is sent).
 */
function forPlayer(beat: Beat, pack: LanguagePack): Beat {
  if (beat.kind === "trace") return { ...beat, verify: undefined };
  if (beat.kind !== "code" && beat.kind !== "debug") return beat;
  const serverRun = !!pack.runner && !BROWSER_RUNNER_IDS.has(pack.runner);
  const hidden = beat.tests.filter((t) => t.hidden).length;
  return { ...beat, solution: undefined, nearMiss: undefined, tests: serverRun ? beat.tests.filter((t) => !t.hidden) : beat.tests, hiddenCount: hidden };
}

/** The code language of an active pack (for building coding-task programs). */
export function getCodeLang(langSlug: string): CodeLang {
  const p = PACKS.get(langSlug);
  return p ? codeLangOf(p) : "rust";
}

/** A coding task by its place in the content (lesson beat or exam question), with all its tests. */
export function getCodeTask(langSlug: string, scope: "lesson" | "exam", slug: string, index: number): CodeTaskBeat | DebugBeat | null {
  const pack = PACKS.get(langSlug);
  if (!pack || pack.status !== "active") return null;
  const beat =
    scope === "lesson"
      ? LESSONS.get(langSlug)?.get(slug)?.lesson.beats[index]
      : pack.exams.find((e) => e.slug === slug)?.questions[index];
  return beat?.kind === "code" || beat?.kind === "debug" ? beat : null;
}
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
    beats: lesson.beats.map((beat, index) => ({ lessonId: id, index, beat: forPlayer(beat, pack), lesson: lesson.slug })),
    notes: { [lesson.slug]: notesOf(lesson) },
  };
}

/** Builds a review run from save keys "<lessonSlug>#<beatIndex>" (the client knows which are due). */
export function getReviewPlay(langSlug: string, keys: string[]): LessonPlay | null {
  const pack = PACKS.get(langSlug);
  if (!pack) return null;
  const beats: PlayBeat[] = [];
  const notes: Record<string, NoteDef[]> = {};
  for (const key of keys.slice(0, 12)) {
    const [slug, idx] = key.split("#");
    const entry = LESSONS.get(langSlug)?.get(slug);
    const beat = entry?.lesson.beats[Number(idx)];
    if (entry && beat && isQuestion(beat) && beat.kind !== "run" && beat.kind !== "code" && beat.kind !== "debug") {
      beats.push({ lessonId: entry.id, index: Number(idx), lesson: slug, beat: { ...beat, setup: undefined, win: undefined } });
      notes[slug] ??= notesOf(entry.lesson);
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
    notes,
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
export const questionTime = (exam: ExamDef, q: ExamQuestion) =>
  q.kind === "code" ? q.time ?? (q.mode === "paper" ? 600 : 480)
  : q.kind === "debug" ? q.time ?? (q.mode === "paper" ? 420 : 360)
  : q.kind === "trace" ? q.time ?? 90 + 15 * q.rows.length
  : Math.round(exam.secondsPerQuestion * (q.difficulty === 3 ? 1.4 : 1));

/** Kinds drawn apart from the topic-balanced pool: each exam takes its own count of them, last. */
const SPECIAL_KINDS = ["trace", "debug", "code"] as const;
type SpecialKind = (typeof SPECIAL_KINDS)[number];
const isSpecial = (q: ExamQuestion) => (SPECIAL_KINDS as readonly string[]).includes(q.kind);

/** Draws `count` questions balanced across topics; trace, debug and coding tasks are drawn separately and come last. */
function sampleQuestions(bank: ExamQuestion[], count: number, special: Record<SpecialKind, number>) {
  const extra = SPECIAL_KINDS.flatMap((kind) =>
    bank.map((q, i) => (q.kind === kind ? i : -1)).filter((i) => i >= 0).sort(() => Math.random() - 0.5).slice(0, special[kind]),
  );
  return [...sampleRegular(bank, count - extra.length), ...extra];
}

function sampleRegular(bank: ExamQuestion[], count: number) {
  const byTopic = new Map<string, number[]>();
  bank.forEach((q, i) => { if (!isSpecial(q)) byTopic.set(q.topic, [...(byTopic.get(q.topic) ?? []), i]); });
  const pools = [...byTopic.values()].map((ids) => ids.sort(() => Math.random() - 0.5)).sort(() => Math.random() - 0.5);
  const picked: number[] = [];
  const available = [...byTopic.values()].reduce((n, ids) => n + ids.length, 0);
  while (picked.length < Math.min(count, available)) {
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
  const drawn = (kind: SpecialKind, wanted: number | undefined) => {
    const inBank = exam.questions.filter((q) => q.kind === kind).length;
    return Math.min(inBank, wanted ?? (inBank ? 1 : 0));
  };
  const ids = sampleQuestions(exam.questions, exam.count, { trace: drawn("trace", exam.traceCount), debug: drawn("debug", exam.debugCount), code: drawn("code", exam.codeCount) });
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
      ...ids.map((i) => ({ lessonId: 0, index: i, lesson: "", beat: forPlayer({ ...exam.questions[i], time: questionTime(exam, exam.questions[i]), setup: undefined, win: undefined } as Beat, pack) })),
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

// ─── practice room ──────────────────────────────────────────────────────────
export type PracticeKind = "code" | "trace" | "debug";
export type PracticeLevel = ExamLevel | "boss";

/** A task of the practice room: every coding, trace and debug task of a pack, wherever it lives. */
export interface PracticeItem {
  slug: string;
  kind: PracticeKind;
  level: PracticeLevel;
  /** The task's own mode ("ide" or "paper"); trace tables have none. */
  mode?: "ide" | "paper";
  prompt: Text;
  difficulty: number;
  /** Region name for boss mini projects, topic name for exam tasks. */
  where: Text;
}

interface PracticeSource { item: PracticeItem; beat: CodeTaskBeat | TraceBeat | DebugBeat; task: { scope: "lesson" | "exam"; slug: string; index: number }; theme: Theme }

const isPracticeBeat = (b: Beat): b is CodeTaskBeat | TraceBeat | DebugBeat => (b.kind === "code" || b.kind === "trace" || b.kind === "debug") && !!b.slug;

function practiceSources(pack: LanguagePack): PracticeSource[] {
  const out: PracticeSource[] = [];
  for (const exam of pack.exams) {
    exam.questions.forEach((q, index) => {
      if (!isPracticeBeat(q)) return;
      out.push({
        item: { slug: q.slug!, kind: q.kind, level: exam.level, mode: q.kind === "trace" ? undefined : q.mode ?? "ide", prompt: q.prompt, difficulty: q.difficulty ?? 2, where: pack.topics[q.topic]?.name ?? q.topic },
        beat: q, task: { scope: "exam", slug: exam.slug, index }, theme: exam.level === "senior" ? "tower" : "village",
      });
    });
  }
  for (const region of pack.regions) {
    for (const lesson of region.lessons) {
      lesson.beats.forEach((b, index) => {
        if (!isPracticeBeat(b)) return;
        out.push({
          item: { slug: b.slug!, kind: b.kind, level: "boss", mode: b.kind === "trace" ? undefined : b.mode ?? "ide", prompt: b.prompt, difficulty: 2, where: region.name },
          beat: b, task: { scope: "lesson", slug: lesson.slug, index }, theme: region.theme,
        });
      });
    }
  }
  return out;
}

/** The practice room's list for a planet or moon (null when it has no runner-free or runnable tasks). */
export function getPracticeList(langSlug: string): PracticeItem[] | null {
  const pack = PACKS.get(langSlug);
  if (!pack || pack.status !== "active") return null;
  return practiceSources(pack).map((s) => s.item);
}

/** One practice task as a play: the same engine as lessons, a single beat, `paper` on demand. */
export function getPracticePlay(langSlug: string, taskSlug: string, paper: boolean): LessonPlay | null {
  const pack = PACKS.get(langSlug);
  if (!pack || pack.status !== "active") return null;
  const src = practiceSources(pack).find((s) => s.item.slug === taskSlug);
  if (!src) return null;
  const { beat, item, task } = src;
  const asPaper = paper && beat.kind !== "trace";
  const shaped = { ...beat, setup: undefined, win: undefined, ...(beat.kind === "trace" ? {} : { mode: asPaper ? ("paper" as const) : ("ide" as const) }) } as Beat;
  const bugs = pack.planet.bugs;
  return {
    slug: `practice-${item.slug}`,
    title: item.prompt,
    mode: "practice",
    xp: 0,
    enemy: bugs[Math.min(bugs.length - 1, item.level === "senior" ? 3 : item.level === "mid" ? 2 : item.level === "boss" ? 1 : 0)] ?? "slime",
    enemyName: localized("practice.sparring"),
    theme: src.theme,
    regionName: localized("practice.title"),
    languageSlug: langSlug,
    ...runInfo(pack),
    guide: guideOf(pack),
    beats: [{ lessonId: 0, index: task.index, lesson: task.scope === "lesson" ? task.slug : "", beat: forPlayer(shaped, pack), task }],
    practice: { slug: item.slug, kind: item.kind, paper: asPaper },
  };
}
