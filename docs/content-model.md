# Content model

Source of truth: `lib/content/types.ts`. This document explains it with examples.

## Hierarchy

```
LanguagePack            content/<lang>/index.ts
├── planet              PlanetDef: the planet in the galaxy, its guide (mascot), bugs and story
├── regions[]           RegionDef: one big concept, one island on the map
│   └── lessons[]       LessonDef: 8–14 beats. The last lesson of each region has mode "boss"
│       └── beats[]     Beat: the smallest unit of play (a few seconds)
├── topics{}            TopicDef: exam topics, linked to the region that teaches them
└── exams[]             ExamDef: junior / mid / senior entry exams
```

## `Text`: localized vs language-neutral

Every field typed `Text` accepts either:

| Value | Meaning | Example |
| --- | --- | --- |
| `L(en, es, ja)` (a `Localized` object `{ en, es, ja }`) | **Prose** shown to the player | `L("Does it compile?", "¿Compila?", "コンパイルできる？")` |
| A plain `string` | **Language-neutral** code, numbers or identifiers | `"&a"`, `"b"`, `"42"` |

`L` is exported from `lib/i18n/text.ts` and re-exported by `content/<lang>/helpers.ts`. The validator (`npm run content:check`) requires `L(...)` on every prose field and reports a plain string there as an error. Full rules in [i18n.md](i18n.md).

Fields that are **always plain strings** (never translated): `code`, `line`, `starter`, `solution`, `expect`, `fallback`, `output`, `lines`, `type` `answer`, `error.compiler`, `tag`/`value`/`print` effect text, slugs and ids.

Fields that **must be `L(...)`**: dialog `text`, every `prompt`, `explain`, act step `label`, `error.plain`, `say`/`banner` effect text, lesson `title`/`enemyName`, region `name`/`subtitle`, topic `name`, exam `title`/`description`, pack `tagline`, planet `name`/`story`, guide `name`/`title`. `hint` is typed `Text` too and should be `L(...)`.

Options in `pick`/`predict` may be either: plain strings for code tokens (`"b"`, `"&mut x"`), `L(...)` for prose answers (`L("No: s1 moved to s2", ...)`).

Code in exercises uses **English identifiers** for every locale (`let sword = ...`, `"potion"`), so the code, `check.stdout` and `expect` are identical in all languages.

### LessonDef

| Field | Type | Notes |
| --- | --- | --- |
| `slug` | string | English, kebab-case, unique within the language. Appears in the URL (`/play/rust/lesson/hello-let`) |
| `title` | `L(...)` | Short, fits on a card (budget 28) |
| `concept` | string | Concept id, usually a `topics` id |
| `mode` | `"lesson"` \| `"boss"` | 5 hearts, or 3 hearts where a timeout counts as a mistake |
| `xp` | number | 40–85 for lessons (more in advanced regions), 120–200 for bosses |
| `enemy` | `EnemyKind` (= `SpriteId`) | Sprite of the lesson's bug: a built-in id (`slime`, `ghost`, `golem`, `dragon`) or a pack sprite such as `"rust/mite"`. Prefer the planet's own bugs. The validator rejects unknown ids |
| `enemyName` | `L(...)` | Upper case, budget 20: `L("THIEF BUG", "BUG LADRÓN", "ドロボウバグ")` |

The lesson's bug has as many hit points as there are questions. Each correct answer removes one and each mistake heals one, because the question comes back at the end.

### RegionDef

| Field | Type | Notes |
| --- | --- | --- |
| `slug` | string | English, kebab-case, matches the file name: `content/rust/regions/ownership-forest.ts` |
| `name` | `L(...)` | Budget 24 |
| `subtitle` | `L(...)` | Concepts covered, budget 40 |
| `theme` | `village` \| `forest` \| `mountain` \| `castle` \| `tower` | Island and stage art |
| `status` | `"active"` \| `"soon"` | `soon` shows a locked placeholder |
| `lessons` | `LessonDef[]` | Last one should be `mode: "boss"` |

## Planet

Each language is a planet with its own guide (mascot), bugs and story. `LanguagePack.planet` is a `PlanetDef`:

| Field | Type | Notes |
| --- | --- | --- |
| `name` | `L(...)` | Planet name, budget 20: `L("Oxide", "Óxido", "オキサイド")` |
| `story` | `L(...)` | Two or three sentences of lore shown on the galaxy card, budget 260 |
| `guide.name` | `L(...)` | The guide's name, budget 14 |
| `guide.sprite` | `SpriteId` | Usually a pack sprite, e.g. `"rust/ferro"` |
| `guide.title` | `L(...)` | One-line personality shown on the planet card, budget 40 |
| `colors` | `{ surface, accent, ring? }` | `#rrggbb` hex colors for the 3D planet; `ring` adds a ring |
| `moons` | number? | Moons orbiting the planet in the galaxy |
| `bugs` | `SpriteId[]` | This planet's bugs, shown on the planet card. Review runs use the first one; exams pick one by level (junior: 1st, mid: 3rd, senior: 4th, clamped to the list) |

The guide is the voice of the planet: it speaks every `dialog` with `speaker: "master"`, appears in the mistake explanation box (with its name, e.g. "FERRO: SO CLOSE!"), and gives the landing intro the first time the player lands. "Soon" languages also have a planet (in `content/<lang>/planet.ts`) so they show in the galaxy as locked planets.

| Language | Planet | Guide | Bugs | Files |
| --- | --- | --- | --- | --- |
| Rust | Oxide | Ferro (crab sensei) | `rust/mite`, `rust/dangler`, `rust/cog-golem`, `rust/borrow-dragon` | `content/rust/index.ts`, `content/rust/sprites.ts` |
| Go | Concurra | Gopi (cheerful tunnel digger) | `go/nil-blob`, `go/deadlock-snail`, `go/race-twins` | `content/go/planet.ts`, `content/go/sprites.ts` |
| Zig | Comptia | Iggi (iguana forge engineer) | `zig/leak-jelly`, `zig/undefined-imp`, `zig/overflow-spark` | `content/zig/planet.ts`, `content/zig/sprites.ts` |
| Haskell | Lambdara | Lambo (wise owl of pure functions) | `haskell/thunk-pile`, `haskell/bottom-wraith`, `haskell/partial-moth` | `content/haskell/planet.ts`, `content/haskell/sprites.ts` |

Guides and bugs are **original designs inspired by the language**, never copies of official mascots or logos.

## Sprites

Sprites are text grids, one string per row, one character per pixel. Legend (`components/pixel/sprites.ts`):

| Char | Color | Char | Color |
| --- | --- | --- | --- |
| `.` | transparent | `0` `1` `2` `3` | palette ramp, dark → light |
| `r` | red | `y` | gold |
| `b` | blue | `s` | skin |
| `w` | white | `g` | good (green) |
| `p` | purple | `c` | cyan |

Every color is a palette CSS variable (`lib/palette.ts`, which defines `purple` and `cyan` in each palette), so sprites recolor with the chosen palette.

- **Built-in sprites** (`hero`, `ally`, `master`, `slime`, `ghost`, `golem`, `dragon`, items...) live in `components/pixel/sprites.ts`.
- **Pack sprites** live in `content/<lang>/sprites.ts` as `Record<string, string[]>` (e.g. `RUST_SPRITES`) and are registered in `content/sprites.ts` (`PACK_SPRITES`). That registry is client-safe: it only imports sprite files, never lesson content.
- **Ids are namespaced** `<lang>/<name>` in kebab-case (`rust/borrow-dragon`).
- Draw them as **16×16** grids, like the built-in characters.
- `getSprite(id)` resolves built-in and pack sprites; an unknown id falls back to `slime`.

`npm run content:check` validates sprites: namespaced ids, 1–24 rows, every row the same width, only legend characters; and that every lesson `enemy`, `planet.guide.sprite` and `planet.bugs` entry is a known sprite, plus the planet color format and prose budgets above.

## Beats

Common fields (`BeatBase`): `setup` (effects before the beat; if present, the scene is reset), `win` (effects on success), `time` (seconds for the speed bonus; in bosses and exams, the time limit), `check` (proof for the validator), `hint` and `concept`.

| kind | Purpose | Key fields |
| --- | --- | --- |
| `dialog` | The planet's guide explains an idea | `speaker` (`master` = the planet's guide, `hero`, `ally`, `enemy` = the lesson's bug), `text` (budget 140), `code?` |
| `act` | **Teach by doing.** Each button writes a line and the world reacts | `prompt` (70), `steps[]: { label (16), line?, effects?, output?, error? }` |
| `pick` | Choose the token that fills `___` | `code` with exactly one `___`, `options` (2–4), `answer` (index), `explain` |
| `predict` | Predict output or whether it compiles | `code`, `options`, `answer`, `explain`, `output?` (printed on success) |
| `type` | Type the token for `___` | `code` with exactly one `___`, exact `answer`, `explain` |
| `order` | Order lines | `lines` in the correct order (unique after `trim`), `explain` |
| `run` | Edit and run real code | `starter` (broken), `solution`, `expect` (stdout substring), `fallback` (offline regex or list of regexes), `explain`, `prompt` (70) |

Question prompts (`pick`, `predict`, `type`, `order`) have a budget of 60, `explain` of 160.

An `error` on an `act` step shows the compiler error and a plain-language explanation: `{ compiler: "error[E0382]: ...", plain: L(...) }`. `compiler` is the real rustc message and stays in English for every locale. The following steps continue, so you can show the error and then the fix.

The `say(text)` and `enemySays(text)` helpers in `content/<lang>/helpers.ts` build `dialog` beats: `say(L("...", "...", "..."))`.

### `act` example (the most important pattern)

```ts
{
  kind: "act",
  prompt: L("Press in order and watch the sword", "Pulsa en orden y observa la espada", "順番に押して、剣をよく見てね"),
  steps: [
    { label: L("FORGE", "FORJAR", "きたえる"), line: 'let a = String::from("sword");',
      effects: [{ t: "item", kind: "sword", holder: "hero" }, { t: "tag", actor: "hero", text: "a" }] },
    { label: L("GIVE TO b", "DAR A b", "b にわたす"), line: "let b = a;",
      effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "b" }, { t: "give", to: "ally" }, { t: "dead", actor: "hero" }] },
    { label: L("USE a", "USAR a", "a を使う"), line: 'println!("{}", a);',
      effects: [{ t: "shake" }, { t: "say", actor: "hero", text: L("I don't have it!", "¡Ya no la tengo!", "もう持ってない！") }],
      error: {
        compiler: "error[E0382]: borrow of moved value: `a`",
        plain: L("a is no longer the owner: the sword MOVED to b.", "a ya no es dueña: la espada se MOVIÓ a b.", "a はもう持ち主じゃない。剣は b にムーブしたよ。"),
      } },
  ],
}
```

### Verifiable question example

```ts
{
  kind: "predict",
  prompt: L("Does it compile?", "¿Compila?", "コンパイルできる？"),
  code: 'let s1 = String::from("gem");\nlet s2 = s1;\nprintln!("{}", s1);',
  options: [L("Yes: prints gem", "Sí: imprime gem", "はい：gem と表示"), L("No: s1 moved to s2", "No: s1 se movió a s2", "いいえ：s1 は s2 にムーブした")],
  answer: 1,
  explain: L("After the move, using s1 is error E0382.", "Tras el move, usar s1 es error E0382.", "ムーブの後に s1 を使うとエラー E0382 になるよ。"),
  check: { compiles: false },
}
```

## `check`: the proof behind every claim

`npm run content:verify` builds a program and runs it with the language runner (`scripts/validate-content.ts`, `buildProgram`):

- In `pick` and `type`, `___` is filled with the correct answer (for `pick`, the English text of the option).
- If the code has no `fn main`, it is wrapped in `fn main() { ... }` (with `#![allow(unused)]`). Nested functions are valid Rust.
- If the snippet alone is not a valid program, use `check.program` with a full program that proves the same thing. It replaces the beat's code entirely.
- `check.compiles` states whether it must compile.
- `check.stdout` compares the exact output (trimmed on both sides).
- `check.wrongFail: true` (`pick` only, ignored when `check.program` is set) also builds the program with each wrong option and requires each one **not** to compile, to avoid ambiguous distractors. Don't use it when a distractor compiles but is semantically worse; explain that in `explain`.
- A program that panics counts as "does not compile" for the validator. Avoid panics in checks.

### `run` beats

- `solution` is run and its stdout must contain `expect`.
- `starter` is run too and must **not** already print `expect` (otherwise there is nothing to fix).
- `fallback` is a regex source, or an array of them, used when the runner is unavailable or `BITWISE_RUNNER=off`. Any match passes. No fallback may match `starter`, and at least one must match `solution`. List every alternative valid fix.
- A `run` beat without `solution` produces a warning (it cannot be verified).

## Visual effects

Actors are `hero`, `ally` and `enemy`. Items are `sword`, `potion`, `gem`, `shield`, `scroll` and `key`.

| Effect | Teaching meaning | Fields |
| --- | --- | --- |
| `enter` / `exit` | An actor enters or leaves the scene | `actor` |
| `tag` | Variable label above the actor (binding) | `actor`, `text` (code, plain string), `value?` |
| `value` | Changes the value shown next to the label | `actor`, `text` |
| `untag` | Removes the label | `actor` |
| `dead` | Crosses out the label: the binding is no longer valid | `actor` |
| `item` | A value appears in an actor's hands | `kind`, `holder` |
| `give` | The value changes owner (move) | `to` |
| `clone` | The value is duplicated | `to` |
| `lend` | Borrow: a ghost copy goes and comes back, with a chain | `to`, `mut?` |
| `drop` | The value is destroyed | – |
| `attack` | An actor hits another | `from`, `to`, `dmg?` |
| `hp` | Shows a world health bar | `actor`, `value` |
| `say` | Speech bubble | `actor`, `text` (`L(...)`, budget 22) |
| `print` | Line in the STDOUT panel | `text` (program output, plain string) |
| `shake` | Screen shake | – |
| `banner` | Big text | `text` (`L(...)`, budget 22) |
| `wait` | Pause | `ms` |

To add a new effect, add it to the `Effect` type, implement it in `one()` in `components/game/Stage.tsx` and add it to the `EFFECTS` list in `scripts/validate-content.ts`. If it carries prose, type it `Text` and call `prose()` for it in `checkEffects`.

## Topics and exams

See [exams.md](exams.md).

## Checklist

- [ ] Every prose field is `L(en, es, ja)`; code fields are plain strings.
- [ ] Every `enemy`, guide sprite and bug is a known sprite id; pack sprites are namespaced `<lang>/<name>`.
- [ ] Every compiler-dependent question has `check`; every `run` has `solution` and `fallback`.
- [ ] `npm run content:check` reports 0 errors.
