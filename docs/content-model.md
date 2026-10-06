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

## `LanguagePack` fields

| Field | Type | Notes |
| --- | --- | --- |
| `slug` | string | English, kebab-case, unique across all packs. Routes are `/play/<slug>/...` and the save keys progress by it |
| `parent` | string? | Set only on **moons**: the slug of the planet the moon orbits (see [Planets and moons](#planets-and-moons)) |
| `codeLang` | `"rust"` \| `"ts"` \| `"tsx"` \| `"go"` \| `"python"` \| `"cpp"` \| `"csharp"` | Language of the code in the pack (see [`codeLang`](#codelang-the-language-of-the-code)). When omitted it is `"rust"` for the `rust` pack and `"ts"` for every other pack, so always set it explicitly |
| `name` | string | Short upper-case label (`"RUST"`, `"TS/JS"`, `"REACT"`) |
| `tagline` | `L(...)` | Budget 60 |
| `color` | `#rrggbb` | Cartridge color |
| `status` | `"active"` \| `"soon"` | `soon` shows the planet or moon locked; its routes answer 404 |
| `runner` | string? | Runner id: `"rust-playground"`, `"go-playground"`, `"godbolt-cpp"`, `"godbolt-csharp"` (server) or `"js-browser"`, `"py-browser"` (the player's browser). See [adding-a-language.md](adding-a-language.md#choosing-a-runner) |
| `planet` | `PlanetDef` | The planet (or moon) in the galaxy |
| `regions`, `topics`, `exams` | | As below |

## Planets and moons

A **planet** is a programming language. A **moon** is a framework of that language: React, WebGL and three.js are moons of the TypeScript/JavaScript planet, and a future moon could be Babylon.js. A moon is a regular `LanguagePack` with `parent: "<planet slug>"`:

- **Same structure as a planet pack:** `planet` (a `PlanetDef`: name, story, its own guide, colors, bugs), regions, topics and exams. Moon sprites are namespaced by the moon slug (`react/guide`).
- **Its own progress:** saves key progress by pack slug, so a moon's lessons, exams and reviews are stored under the moon's slug, separate from its planet.
- **Its own routes:** `/play/<moon slug>`, `/play/<moon slug>/lesson/<slug>`, `/play/<moon slug>/exam`, `/play/<moon slug>/review`.
- **In the galaxy** (`app/galaxy/page.tsx`) only planets (packs without `parent`) are listed. Each planet's moons orbit it in the 3D view in their `planet.colors.accent` color, dimmed while the moon is `soon` (`components/galaxy/Galaxy3D.tsx`, `frameworkMoons`), and appear as buttons in the planet card (`components/galaxy/GalaxyClient.tsx`) with their guide sprite and progress. `PlanetDef.moons` is separate: it only adds small decorative grey moons.
- **Validator:** `parent` must be the slug of an existing pack, and that pack must not itself be a moon (moons cannot orbit moons).

| Pack | Kind | Slug | Planet / moon | Guide | `codeLang` | Runner | Folder |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rust | planet | `rust` | Oxide | Ferro | `rust` | `rust-playground` | `content/rust/` |
| TypeScript / JavaScript | planet | `typescript` | Scriptara | Tyto (owl) | `ts` | `js-browser` | `content/typescript/` |
| React | moon of `typescript` | `react` | Reactia | Orbi (atom) | `tsx` | `js-browser` | `content/react/` |
| WebGL | moon of `typescript` | `webgl` | Shadera | Trix (hello-triangle) | `ts` | `js-browser` | `content/webgl/` |
| three.js | moon of `typescript` | `threejs` | Scenara | Polly (low-poly cube) | `ts` | `js-browser` | `content/threejs/` |
| Python | planet | `python` | Serpentia | Pippa (snake) | `python` | `py-browser` | `content/python/` |
| C# | planet | `csharp` | Sharpholm | Hashi (fox) | `csharp` | `godbolt-csharp` | `content/csharp/` |
| Go | planet | `go` | Concurra | Gopi (tunnel digger) | `go` | `go-playground` | `content/go/` |
| C++ | planet | `cpp` | Velocis | Vecta (steel knight) | `cpp` | `godbolt-cpp` | `content/cpp/` |

All of these are registered in `content/index.ts`; Zig and Haskell remain `soon` placeholders. The newer packs are still being written, with region plans based on the notes in [`docs/research/`](research/).

## `codeLang`: the language of the code

`codeLang` drives three things:

| | `rust` | `ts` | `tsx` |
| --- | --- | --- | --- |
| Highlighting (`lib/syntax.ts`) | Rust grammar (macros, lifetimes) | TypeScript tokenizer: template literals, `$` identifiers, `n` bigint suffix, TS keywords and utility types | Same TypeScript tokenizer; JSX tags render as punctuation and identifiers (capitalized component names color as types) |
| JSX | no | no | yes (`.tsx` for the type checker, the JSX transform in the runner) |
| Validator (`content:verify`) | Snippets wrapped in `fn main`, run on the Rust Playground | Module bodies, type-checked with `tsc --strict`, run with the JS runner core | Same as `ts`, with JSX |

`go`, `python`, `cpp` and `csharp` have their own grammars and lexers in `lib/syntax.ts` (comments, strings, and preprocessor lines or decorators highlighted as macros); their validator rules are in [Go, C++, C# and Python packs](#go-c-c-and-python-packs).

`codeLang` is what the lesson engine passes to the highlighter as `ctx.lang`, so a grammar in `GRAMMARS` is keyed by `codeLang`, not by pack slug.

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

Moons use the same `PlanetDef` shape (Reactia is in `content/react/planet.ts`).

The guide is the voice of the planet: it speaks every `dialog` with `speaker: "master"`, appears in the mistake explanation box (with its name, e.g. "FERRO: SO CLOSE!"), and gives the landing intro the first time the player lands. "Soon" languages also have a planet (in `content/<lang>/planet.ts`) so they show in the galaxy as locked planets.

| Language | Planet | Guide | Bugs | Files |
| --- | --- | --- | --- | --- |
| Rust | Oxide | Ferro (crab sensei) | `rust/mite`, `rust/dangler`, `rust/cog-golem`, `rust/borrow-dragon` | `content/rust/index.ts`, `content/rust/sprites.ts` |
| TypeScript / JavaScript | Scriptara | Tyto (wise owl of type safety) | `typescript/undefined-ghost`, `typescript/nan-gremlin`, `typescript/callback-spaghetti`, `typescript/any-shifter` | `content/typescript/planet.ts`, `content/typescript/sprites.ts` |
| React (moon of Scriptara) | Reactia | Orbi (little atom who calms renders) | `react/rerender-tornado`, `react/stale-closure`, `react/key-twins` | `content/react/planet.ts`, `content/react/sprites.ts` |
| WebGL (moon of Scriptara) | Shadera | Trix (hello-triangle of the pipeline) | `webgl/black-screen`, `webgl/z-fighting`, `webgl/shader-goblin` | `content/webgl/planet.ts`, `content/webgl/sprites.ts` |
| three.js (moon of Scriptara) | Scenara | Polly (low-poly cube who frames scenes) | `threejs/leak-blob`, `threejs/lost-wanderer`, `threejs/gimbal-knot` | `content/threejs/planet.ts`, `content/threejs/sprites.ts` |
| Python | Serpentia | Pippa (gentle snake of readable code) | `python/indent-gremlin`, `python/mutable-mimic`, `python/none-ghost`, `python/keyerror-key` | `content/python/planet.ts`, `content/python/sprites.ts` |
| C# | Sharpholm | Hashi (keen fox of the managed realm) | `csharp/nullref-ghost`, `csharp/deadlock-hourglass`, `csharp/boxing-mimic`, `csharp/dispose-leak` | `content/csharp/planet.ts`, `content/csharp/sprites.ts` |
| C++ | Velocis | Vecta (swift steel knight of control) | `cpp/segfault-skull`, `cpp/dangling-wraith`, `cpp/leak-slime`, `cpp/ub-imp` | `content/cpp/planet.ts`, `content/cpp/sprites.ts` |
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

An `error` on an `act` step shows the compiler error and a plain-language explanation: `{ compiler: "error[E0382]: ...", plain: L(...) }`. `compiler` is the real compiler or runtime message (rustc for Rust; the `tsc` diagnostic such as `TS2322: Type 'string' is not assignable to type 'number'.` or the runtime error such as `TypeError: ...` for TS/TSX packs) and stays in English for every locale. The following steps continue, so you can show the error and then the fix.

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

`npm run content:verify` builds a program and runs it with the language runner (`scripts/validate-content.ts`, `buildProgram`). `SnippetCheck` fields:

| Field | Meaning |
| --- | --- |
| `program` | Full program that replaces the beat's code entirely. Use it when the snippet alone is not a valid program |
| `compiles` | Whether it must compile (Rust, Go, C++, C#), type-check (TS/TSX) or have no `SyntaxError` (Python) |
| `stdout` | Exact expected output, trimmed on both sides |
| `throws` | All languages except Rust: the program compiles (type-checks) but must fail at runtime; text the error must contain (e.g. `"TypeError"`, `"KeyError"`, `"nil map"`) |
| `wrongFail` | `pick` only: also prove that every wrong option fails |

Common rules:

- In `pick` and `type`, `___` is filled with the correct answer (for `pick`, the English text of the option). `order` joins `lines` in the correct order.
- `check.wrongFail: true` (`pick` only, ignored when `check.program` is set) also builds the program with each wrong option and requires each one **not** to compile (Rust, Go, C++, C#; for Python, to raise a `SyntaxError`) or **not** to type-check (TS/TSX), to avoid ambiguous distractors. Don't use it when a distractor compiles but is semantically worse; explain that in `explain`.

### Rust packs

- If the code has no `fn main`, it is wrapped in `fn main() { ... }` (with `#![allow(unused)]`). Nested functions are valid Rust.
- `compiles` is checked against the real compiler on the Rust Playground; `stdout` against the program's output.
- A program that panics counts as "does not compile" for the validator. Avoid panics in checks.

### TS and TSX packs (`codeLang: "ts"` or `"tsx"`)

- **Snippets are module bodies.** There is no `main` wrapper: the code (with `___` filled) is used as is. Top-level `await` works. `import` is allowed only for the modules the runner provides: `react`, `react-dom/server` and `three` (loaded only for snippets that import it; math and scene graph only, no GPU or DOM, as used by the WebGL and three.js moons).
- **`check.compiles` means "type-checks"** with the real TypeScript compiler in strict mode (`scripts/ts-check.ts`: `strict`, target ES2022, `lib` ES2022 + DOM, `jsx: react`, bundler module resolution, `esModuleInterop`, unused locals/parameters allowed). All snippets are checked in one batch program as files of a virtual `.snippets/` folder (nothing is written to disk; the folder is gitignored).
- **`check.stdout` runs the program** with the same runner core the game uses (`lib/runners/js-core.ts`), so the expected output is exactly what the player sees. Values are formatted like Node's `console.log` for short outputs (`[ 1, 2 ]`, `{ a: 1 }`, `Map(1) { 'k' => 1 }`, nested objects beyond depth 2 as `[Object]`).
- **`check.throws`** proves a runtime error: the program must type-check, then fail at runtime with a message containing the given text (`"TypeError"`, `"ReferenceError"`, `"Cannot read properties of undefined"`). Use it for "what happens?" questions whose answer is a crash.
- A runtime error when no `throws` is set is reported as an error, so `check.stdout` claims must run cleanly.
- `compiles: false` claims only need the type error; the program is not run.

### Go, C++, C# and Python packs

These packs are verified by the same runners the game uses: Go on the official Go Playground, C++ (g++ 14, `-std=c++20 -O1`) and C# (.NET 10) on Compiler Explorer, and Python in Pyodide (CPython 3.14 compiled to WebAssembly), which `content:verify` loads inside Node. Remote results are cached in `.snippets/cache-<lang>.json` (gitignored), so re-running the validator only sends new or changed programs.

- **Short snippets are completed for you** (`scripts/snippet-wrap.ts`); players only see the snippet:
  - Go: without `package main`, the code is placed in `func main() { ... }` (unless it already declares `func main()`) and, unless it has its own `import`, the standard packages it uses (`fmt.`, `strings.`, `errors.`, `sort.`, `sync.`, `time.`, `strconv.`, `slices.`, `maps.`, `context.`, `math.`, `os.`, `unicode.`, `bytes.`, `atomic.`, `cmp.`, `runtime.`, `utf8.`, `fs.`, `io.`) are imported. Remember that unused variables and imports are compile errors in Go.
  - C++: without `#include`, common standard headers are added (`iostream`, `string`, `vector`, `map`, `unordered_map`, `memory`, `algorithm`, `optional`, `variant`, `ranges`...); without `int main(`, the code is placed in `int main() { ... }`. There is no `using namespace std;`: write `std::`.
  - C#: missing `using System;`, `System.Collections.Generic`, `System.Linq`, `System.Text` and `System.Threading.Tasks` are added on top. Top-level statements work; declare types after the statements.
  - Python: used as is.
- **`check.compiles`** means the program compiles (Go, C++, C#) or has no `SyntaxError` (Python).
- **`check.stdout`** must match the program's output exactly (trimmed), so outputs must be deterministic: no map/`Dictionary`/`HashSet`/`set` iteration order, no timing, no addresses, nothing undefined or unspecified in C++.
- **`check.throws`** proves a runtime failure: it compiles, then crashes with stderr containing the given text: a Go panic message (`"assignment to entry in nil map"`, `"index out of range"`, `"all goroutines are asleep"`), a C# exception (`"System.NullReferenceException"`, `"KeyNotFoundException"`), a Python exception (`"KeyError"`, `"ZeroDivisionError"`) or a C++ exception (`"std::out_of_range"`). Never claim the output of C++ undefined behavior: ask "is this UB?" with a check that only compiles.
- **Python in the browser has no threads** (`threading.Thread.start()` raises `RuntimeError: can't start new thread`) and no network or `input()`. `asyncio.run(...)` works. Code runs as `main.py`, so tracebacks read `File "main.py", line N`.
- `run` beats send the full program as written: a Go `starter`/`solution` needs `package main` and `func main()`, C++ needs its `#include`s and `int main()`, C# its `using`s.

### `run` beats

- `solution` is run and its stdout must contain `expect`. For TS/TSX it must also type-check under `tsc --strict`.
- `starter` is run too and must **not** already print `expect` (otherwise there is nothing to fix). A TS/TSX starter that does not type-check is accepted as broken without running it.
- `fallback` is a regex source, or an array of them, used when the runner is unavailable or `BITWISE_RUNNER=off`. Any match passes. No fallback may match `starter`, and at least one must match `solution`. List every alternative valid fix.
- A `run` beat without `solution` produces a warning (it cannot be verified).
- In the game, TS/TSX and Python `run` beats execute in the player's browser; Rust, Go, C++ and C# go through `/api/run` to the same sandboxes the validator uses (see [architecture.md](architecture.md#code-execution)). Types are stripped, not checked, there, so a player's fix is judged by its output; keep the `expect` tied to behavior.

### Writing snippets for the JS runner

The runner (`lib/runners/js-core.ts`) compiles TS/TSX with sucrase and runs it in a function body, which differs from Node in a few ways. Avoid claims that depend on these (see also [research/typescript-react-curriculum.md](research/typescript-react-curriculum.md)):

- **Strict mode always.** The module transform makes code strict: assigning an undeclared variable is a `ReferenceError`, writing to a frozen object throws. Do not write questions whose answer differs between strict and sloppy mode, and do not rely on top-level `this`.
- **No Node globals in the game.** `process`, `process.nextTick`, `Buffer`, `require` of Node modules and `setImmediate` are not available in the browser worker. The runner hides `process`, `global` and `setImmediate` in Node too, so `content:verify` fails exactly where the player would (`Buffer` still exists in Node: don't use it). Use `queueMicrotask`, `Promise.resolve().then`, `setTimeout` and `setInterval` (the runner tracks timers and waits for them, up to about 2.5 s).
- **No DOM at runtime.** `document` and `window` do not exist (the type checker knows DOM types, the runner does not). DOM questions can only be about types, or answered with `[Doc]`-style explanations without a `check`.
- **JSX uses the classic runtime.** A TSX snippet must `import React from "react"` (or `import * as React from "react"`) to use JSX; without it the runner throws `ReferenceError: React is not defined`.
- **React renders are static.** Render with `renderToStaticMarkup` from `react-dom/server` and print the HTML string. Effects (`useEffect`, `useLayoutEffect`) never run, event handlers are never called and state never updates after the first render; test that logic as plain functions with `console.log`.
- **React 19 static-render quirks.** `javascript:` URLs are replaced by a URL that throws; a component that suspends inside `<Suspense>` renders the fallback and one without a boundary throws; `ref` is a regular prop; `<Context value>` works as a provider. Prove each such claim with `check.stdout` rather than from memory.

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
- [ ] TS/TSX packs set `codeLang`; snippets are module bodies, TSX snippets import React, and nothing relies on Node globals, the DOM or effects running.
- [ ] A moon has `parent` set to an existing planet (never to another moon).
- [ ] `npm run content:check` reports 0 errors.
