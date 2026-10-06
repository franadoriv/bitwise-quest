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
  hint?: Text;
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

export type Beat = DialogBeat | ActBeat | PickBeat | PredictBeat | OrderBeat | TypeBeat | RunBeat;
export type QuestionBeat = PickBeat | PredictBeat | OrderBeat | TypeBeat | RunBeat;

export function isQuestion(b: Beat): b is QuestionBeat {
  return b.kind !== "dialog" && b.kind !== "act";
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
export type ExamQuestion = (PickBeat | PredictBeat | TypeBeat | OrderBeat) & { topic: string; difficulty?: 1 | 2 | 3 };

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
  /** Sprite ids of this planet's bugs, shown on the planet card. */
  bugs: SpriteId[];
}

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
