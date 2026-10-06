// Language-agnostic content model. A language pack is pure data:
// adding a new language means writing a new pack, not touching the engine.
//
// i18n: every field typed `Text` that is prose (dialog, prompts, explanations, labels,
// titles) must be a Localized object { en, es, ja }. Plain strings are for code and
// identifiers only. `npm run content:check` enforces it.
import type { Text } from "../i18n/text.ts";
export type { Locale, Localized, Text } from "../i18n/text.ts";

export type ActorId = "hero" | "ally" | "enemy";
export type ItemKind = "sword" | "potion" | "gem" | "shield" | "scroll" | "key";
/** Id of a pixel sprite: a built-in one (components/pixel/sprites.ts) or a pack sprite
 *  registered in content/sprites.ts (namespaced, e.g. "rust/mite"). */
export type SpriteId = string;
export type EnemyKind = SpriteId;
export type Theme = "village" | "forest" | "mountain" | "castle" | "tower";

// Visual vocabulary the stage understands. Content describes WHAT happens in the
// world when code runs; the stage decides HOW it looks.
export type Effect =
  | { t: "enter"; actor: ActorId }
  | { t: "exit"; actor: ActorId }
  | { t: "tag"; actor: ActorId; text: string; value?: string } // variable binding label
  | { t: "untag"; actor: ActorId }
  | { t: "value"; actor: ActorId; text: string } // value chip next to the label
  | { t: "dead"; actor: ActorId } // binding invalidated (moved out)
  | { t: "item"; kind: ItemKind; holder: ActorId } // spawn the item
  | { t: "give"; to: ActorId } // move ownership
  | { t: "clone"; to: ActorId } // duplicate the item
  | { t: "lend"; to: ActorId; mut?: boolean } // borrow: ghost copy goes and comes back
  | { t: "drop" } // value destroyed
  | { t: "attack"; from: ActorId; to: ActorId; dmg?: number }
  | { t: "hp"; actor: ActorId; value: number }
  | { t: "say"; actor: ActorId; text: Text }
  | { t: "print"; text: string }
  | { t: "shake" }
  | { t: "banner"; text: Text }
  | { t: "wait"; ms: number };

/**
 * Machine-checkable claim about a snippet. `npm run content:verify` compiles it with the
 * language runner and fails if reality disagrees. Use it on every pick/predict/type beat
 * whose correctness depends on compiler behavior.
 */
export interface SnippetCheck {
  /** Full program to run. If omitted, the beat's `code` (with the answer filled into `___`)
   *  is used, wrapped in `fn main() { ... }` when it has no `fn main`. */
  program?: string;
  /** Whether the program must compile. */
  compiles: boolean;
  /** Expected stdout (trimmed) when it compiles. */
  stdout?: string;
  /** JS/TS packs: the program type-checks but must throw at runtime; text the error must contain (e.g. "TypeError"). */
  throws?: string;
  /** pick only: also prove that every wrong option fails to compile (no ambiguous distractors).
   *  Leave it off when a distractor compiles but is semantically wrong, and say why in `explain`. */
  wrongFail?: boolean;
}

export interface BeatBase {
  concept?: string;
  /** Proof for the validator (see SnippetCheck). */
  check?: SnippetCheck;
  /** Effects that build the scene before the beat starts. Having a setup resets items/tags. */
  setup?: Effect[];
  /** Effects played when the player gets it right. */
  win?: Effect[];
  /** A nudge shown when the player spends a hint ticket: points the way without giving the answer. */
  hint?: Text;
  /** Id of the lesson note that explains this question (defaults to the lesson's first note). */
  note?: string;
  /** Seconds for the speed bonus (and the timeout in boss fights). */
  time?: number;
}

export interface DialogBeat extends BeatBase {
  kind: "dialog";
  speaker: "master" | "hero" | "ally" | "enemy";
  text: Text;
  code?: string;
}

export interface ActStep {
  label: Text;
  line?: string;
  effects?: Effect[];
  output?: string;
  error?: { compiler: string; plain: Text };
}

/** The player presses buttons; each one writes a line of code and the world reacts. */
export interface ActBeat extends BeatBase {
  kind: "act";
  prompt: Text;
  steps: ActStep[];
}

/** Fill the single `___` slot by choosing a token. */
export interface PickBeat extends BeatBase {
  kind: "pick";
  prompt: Text;
  code: string;
  /** Plain strings for code tokens, Localized for prose answers. */
  options: Text[];
  answer: number;
  explain: Text;
}

/** Read code and predict the result. */
export interface PredictBeat extends BeatBase {
  kind: "predict";
  prompt: Text;
  code: string;
  /** Plain strings for code tokens, Localized for prose answers. */
  options: Text[];
  answer: number;
  explain: Text;
  output?: string;
}

/** Tap lines in the right order. `lines` is the correct order. */
export interface OrderBeat extends BeatBase {
  kind: "order";
  prompt: Text;
  lines: string[];
  explain: Text;
}

/** Type the missing token in the `___` slot. Validated char by char. */
export interface TypeBeat extends BeatBase {
  kind: "type";
  prompt: Text;
  code: string;
  answer: string;
  explain: Text;
}

/** Edit and run real code through the language runner. */
export interface RunBeat extends BeatBase {
  kind: "run";
  prompt: Text;
  starter: string;
  /** Substring expected in stdout. */
  expect: string;
  /** Regex source(s) used to validate offline if the runner is unavailable. Any match passes.
   *  Each must not match `starter`; at least one must match `solution`. List alternative valid fixes. */
  fallback?: string | string[];
  /** A correct program. The validator runs it and expects `expect` in stdout. */
  solution?: string;
  explain: Text;
}

/** One test of a coding task: code that prints the result of a call, and the exact expected output. */
export interface CodeTest {
  /** Statement(s) in the pack's language that print one result, e.g. Python `print(top_words("a b a", 1))`. */
  run: string;
  /** Exact output of `run` for a correct solution (compared trimmed). */
  expect: string;
  /** Hidden tests only report pass/fail; with a server runner they never reach the player's browser. */
  hidden?: boolean;
}

/**
 * Coding task: the player implements something from a brief; hidden and visible tests are appended by
 * the engine and run on the real toolchain, so ANY implementation that produces the right results
 * passes. Used in exams (company-style coding rounds) and as region-boss mini projects.
 */
export interface CodeTaskBeat extends BeatBase {
  kind: "code";
  /** Short task title. */
  prompt: Text;
  /** The task statement: what to implement, inputs, outputs, edge cases to consider. */
  brief: Text;
  /** Code the editor starts with: signatures and an empty body (never already passing). */
  starter: string;
  /** Reference solution: the validator proves it passes every test. Never sent to players. */
  solution?: string;
  tests: CodeTest[];
  /** Plausible wrong solutions; each must fail at least one test (validator only, never sent). */
  nearMiss?: string[];
  /**
   * "ide" (default): highlighted editor, run the tests as often as you like, then submit.
   * "paper": written-test style for exams: plain editor, no paste, no runs before the single submission.
   */
  mode?: "ide" | "paper";
  /** Set by the server for players: how many hidden tests exist (their code is not sent). */
  hiddenCount?: number;
  explain: Text;
}

/** One row of a trace table: a moment of the run and the value of every column at that moment. */
export interface TraceRow {
  /** When the row is taken, e.g. "i = 2" (plain) or L("after the loop", ...). */
  label: Text;
  /** Each column's value exactly as the language prints it (compared trimmed, spaces collapsed). */
  cells: string[];
  /** Column indexes shown already filled in (the player fills the rest). */
  given?: number[];
}

/**
 * Trace table (written-test classic, e.g. Japan's FE exam): the player dry-runs `code` in their head
 * and fills the value of each column at each row. No runner at play time: the answers are static,
 * and the validator proves them by running `verify`.
 */
export interface TraceBeat extends BeatBase {
  kind: "trace";
  prompt: Text;
  /** Optional extra instructions (what a row means, how to write a value). */
  brief?: Text;
  code: string;
  /** Column headers: variables or expressions, e.g. ["i", "total"]. */
  columns: string[];
  rows: TraceRow[];
  /**
   * Validator only (never sent): `code` instrumented to print one line per row with the cells joined
   * by " | ", e.g. `1 | 3`. Short snippets are completed like `check` programs.
   */
  verify?: string;
  explain: Text;
}

/**
 * Debugging task: `code` fails the case described in `brief`. The player first taps the buggy line
 * (`bugLine`, 1-based), then fixes the code; the fix is judged by the tests like a coding task, so any
 * correct fix passes. Tapping the wrong line halves the points but the fix can still be made.
 */
export interface DebugBeat extends BeatBase {
  kind: "debug";
  prompt: Text;
  /** The symptom: what the code should do and the case where it goes wrong. */
  brief: Text;
  /** The buggy code shown and edited (it must fail at least one test). */
  code: string;
  /** 1-based line of the bug (the line a reviewer would point at). */
  bugLine: number;
  /** Other lines that are also a fair answer (where an equally correct fix can go). */
  alsoLines?: number[];
  /** The fixed code: the validator proves it passes every test. Never sent to players. */
  solution?: string;
  tests: CodeTest[];
  /** Plausible wrong fixes; each must fail at least one test (validator only, never sent). */
  nearMiss?: string[];
  /** "ide" (default): run the tests freely. "paper" (exams): no runs, one submission. */
  mode?: "ide" | "paper";
  /** Set by the server for players: how many hidden tests exist. */
  hiddenCount?: number;
  explain: Text;
}

export type Beat = DialogBeat | ActBeat | PickBeat | PredictBeat | OrderBeat | TypeBeat | RunBeat | CodeTaskBeat | TraceBeat | DebugBeat;
export type QuestionBeat = PickBeat | PredictBeat | OrderBeat | TypeBeat | RunBeat | CodeTaskBeat | TraceBeat | DebugBeat;

export function isQuestion(b: Beat): b is QuestionBeat {
  return b.kind !== "dialog" && b.kind !== "act";
}

/**
 * A block of a lesson note: a paragraph, or a code example. Examples use values different from the
 * questions; an example with `output` is run by the validator and must print exactly that.
 */
export type NoteBlock =
  | { t: "p"; text: Text }
  | { t: "code"; code: string; output?: string; caption?: Text; check?: SnippetCheck };

/**
 * The long explanation of one idea in a lesson. Players open it at any time from a question
 * (the "📖" button) and come back to where they were. Questions that test the same idea share it.
 */
export interface NoteDef {
  id: string;
  title: Text;
  blocks: NoteBlock[];
}

export interface LessonDef {
  slug: string;
  title: Text;
  concept: string;
  mode: "lesson" | "boss";
  xp: number;
  enemy: EnemyKind;
  enemyName: Text;
  beats: Beat[];
  /** Long explanations for the lesson's ideas, referenced by questions' `note`. */
  notes?: NoteDef[];
}

export interface RegionDef {
  slug: string;
  name: Text;
  subtitle: Text;
  theme: Theme;
  status?: "active" | "soon";
  lessons: LessonDef[];
}

// ─── entry exams (company-style technical screening) ───────────────────────
export type ExamLevel = "junior" | "mid" | "senior";

/** Exam questions are regular beats tagged with a topic from the pack's `topics`. */
export type ExamQuestion = (PickBeat | PredictBeat | TypeBeat | OrderBeat | CodeTaskBeat | TraceBeat | DebugBeat) & { topic: string; difficulty?: 1 | 2 | 3 };

export interface ExamDef {
  slug: string;
  level: ExamLevel;
  title: Text;
  /** Who this exam simulates, e.g. "Initial technical screen for a Junior Rust Developer". */
  description: Text;
  /** Questions drawn per attempt (balanced across topics). The bank can be larger. */
  count: number;
  /** Percentage needed to pass. */
  passPct: number;
  secondsPerQuestion: number;
  questions: ExamQuestion[];
  /** Coding tasks drawn per attempt from the bank's `code` questions (default 1 when the bank has any). */
  codeCount?: number;
  /** Trace tables drawn per attempt (default 1 when the bank has any). */
  traceCount?: number;
  /** Debugging tasks drawn per attempt (default 1 when the bank has any). */
  debugCount?: number;
}

export interface TopicDef {
  name: Text;
  /** Region that teaches this topic. Passing all of a region's topics in an exam skips it. */
  region?: string;
}

/** The planet's mascot: speaks every `speaker: "master"` dialog and explains mistakes. */
export interface GuideDef {
  name: Text;
  sprite: SpriteId;
  /** One-line personality shown on the planet card. */
  title: Text;
}

/** Each language is a planet with its own guide, bugs and story. */
export interface PlanetDef {
  name: Text;
  /** Two or three sentences of lore shown when choosing the planet. */
  story: Text;
  guide: GuideDef;
  /** Colors for the 3D planet (hex). */
  colors: { surface: string; accent: string; ring?: string };
  moons?: number;
  /**
   * Moons only: the 3D shape that hints at what the framework teaches (React an atom, WebGL a
   * triangle, three.js a wireframe cube, Rails a train wheel). Defaults to a faceted orb.
   */
  shape?: MoonShape;
  /** Sprite ids of this planet's bugs, shown on the planet card. */
  bugs: SpriteId[];
}

export type MoonShape = "orb" | "atom" | "tetra" | "cube" | "wheel";

/** Language of the code in a pack: drives highlighting, JSX and how the validator checks snippets. */
export type CodeLang = "rust" | "ts" | "tsx" | "go" | "python" | "cpp" | "csharp" | "zig" | "haskell" | "ruby";

export interface LanguagePack {
  slug: string;
  /** Moons are frameworks of a language: a moon pack names its planet here (e.g. React → "typescript"). */
  parent?: string;
  codeLang?: CodeLang;
  name: string;
  tagline: Text;
  color: string;
  status: "active" | "soon";
  runner?: string;
  planet: PlanetDef;
  regions: RegionDef[];
  topics: Record<string, TopicDef>;
  exams: ExamDef[];
}
