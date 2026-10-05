# Adding a programming language

This guide is about adding a new **programming language** (a planet such as Go). To add a new **human language** for the UI and content (for example French), see [i18n.md](i18n.md#adding-a-locale).

Every language is a **planet** in the galaxy, with its own **guide** (a mascot that teaches), its own **bugs** (the enemies) and a short **story**. Adding a language means writing a pack with a planet, its sprites, regions, topics and exams. No engine file changes are needed except syntax highlighting and, optionally, a runner.

Example: Go. Go, Zig and Haskell already have a planet and sprites as "soon" placeholders (`content/<lang>/planet.ts`, `content/<lang>/sprites.ts`), so they appear locked in the galaxy; making one playable means adding its lessons and switching it to `active`.

## Planet or moon?

| You are adding... | It is a... | Example | How |
| --- | --- | --- | --- |
| A programming language | **Planet**: a top-level pack | Rust (Oxide), TypeScript/JavaScript (Scriptara), Go | This guide |
| A framework or library of an existing language | **Moon**: a pack with `parent: "<planet slug>"` | React (Reactia, moon of Scriptara); future: WebGL, three.js, Babylon.js | This guide, plus the differences below. Step by step in the [`add-moon` playbook](playbooks/add-moon/SKILL.md) |

A moon is built exactly like a planet (planet/guide/bugs, sprites, regions, topics, exams) with these differences:

- Set `parent` to the planet's slug in the pack. The validator rejects an unknown parent and a moon whose parent is itself a moon.
- The moon has its **own** slug, guide, bugs, sprites (`<moon slug>/<name>`), routes (`/play/<moon slug>`) and save progress. It does not share lessons or progress with its planet.
- It usually shares the planet's `runner` and a compatible `codeLang` (React uses `js-browser` and `tsx`, its planet `js-browser` and `ts`).
- It does not appear as a planet in the galaxy: it orbits its planet (accent color, dimmed while `soon`) and appears as a button in the planet card. Its `planet.colors.accent` is the orbiting moon's color; `ring` and `moons` are not drawn for moons.
- Write the moon's lessons assuming the player knows the planet's language basics, and say so in the first dialog.

## Steps

1. **Planet.** Design the planet before any lesson (see [Designing the planet](#designing-the-planet)). Write it as a `PlanetDef` (`lib/content/types.ts`), either inline in `index.ts` like `content/rust/index.ts` or in `content/<lang>/planet.ts` like Go, Zig and Haskell:
   ```ts
   import type { PlanetDef } from "../../lib/content/types.ts";
   import { L } from "../../lib/i18n/text.ts";

   export const planet: PlanetDef = {
     name: L("Concurra", "Concurra", "コンカーラ"),                       // budget 20
     story: L("Concurra is a honeycomb of tunnels...", "...", "..."),     // budget 260
     guide: { name: L("Gopi", "Gopi", "ゴピ"), sprite: "go/gopi",          // name budget 14
              title: L("Cheerful tunnel digger", "Alegre cavador de túneles", "陽気なトンネル掘り") }, // budget 40
     colors: { surface: "#...", accent: "#...", ring: "#..." },           // #rrggbb, ring optional
     moons: 3,
     bugs: ["go/nil-blob", "go/deadlock-snail", "go/race-twins"],
   };
   ```
2. **Sprites.** Create `content/<lang>/sprites.ts` exporting `Record<string, string[]>` (e.g. `GO_SPRITES`) with the guide and every bug: 16×16 grids using the sprite legend (`.` `0`–`3` `r` `y` `b` `s` `w` `g` `p` `c`), ids namespaced `<lang>/<name>`. Register it in `content/sprites.ts` (`PACK_SPRITES`). Details in [content-model.md](content-model.md#sprites).
3. **Pack.** Create `content/<lang>/index.ts` exporting a `LanguagePack`:
   ```ts
   import type { LanguagePack } from "../../lib/content/types.ts";
   import { L } from "../../lib/i18n/text.ts";
   import { planet } from "./planet.ts";

   export const go: LanguagePack = {
     slug: "go", name: "GO",
     tagline: L("Simple concurrency with goroutines", "Concurrencia simple con goroutines", "goroutine でシンプルな並行処理"),
     color: "#0099db",
     status: "active", runner: "go-playground",
     planet,
     regions: [/* imported from ./regions/*.ts */],
     topics, exams,
   };
   ```
   Copy the structure of `content/rust/`: `helpers.ts`, `topics.ts`, `exams.ts` and `regions/<slug>.ts` (English kebab-case slugs). All prose is `L(en, es, ja)`; see [content-model.md](content-model.md) and [i18n.md](i18n.md). Lesson `enemy` values should be the planet's bugs (`"go/nil-blob"`), and `speaker: "master"` dialogs are spoken by the guide, so write them in the guide's voice.
4. **Registration.** In `content/index.ts`, replace `soon("go", ..., goPlanet)` with the imported pack (`import { go } from "./go/index.ts"`).
5. **Code language and highlighting.** Set `codeLang` on the pack. If the language is not one of `"rust" | "ts" | "tsx"`, add it to `CodeLang` (`lib/content/types.ts`), give it a grammar in `GRAMMARS` in `lib/syntax.ts` (keyed by `codeLang`; keywords and types), and handle it in `codeLangOf` in both `lib/repo.ts` and `scripts/validate-content.ts`. Both default a pack without `codeLang` to `"ts"` (except the `rust` pack), so a new language that leaves it unset would be type-checked as TypeScript. An unknown grammar key falls back to the Rust grammar.
6. **Runner (optional).** Needed for `run` beats and for verifying `check`. See [Choosing a runner](#choosing-a-runner). Without a runner, use only beats that don't need a compiler and omit `check`.
7. **Verify** with the checklist below.

Saves need no change: progress is keyed by language and lesson slug, so a new language simply starts empty in every existing save (see [save-system.md](save-system.md#why-adding-a-language-doesnt-break-saves)).

## Choosing a runner

A runner executes `run` beats in the game. `content:verify` executes `check` and `run` claims with the same toolchain. There are two kinds:

| | Server runner | Browser runner |
| --- | --- | --- |
| Example | `rust-playground` (`lib/runners/rust-playground.ts`) | `js-browser` (`lib/runners/browser.ts`, `js-worker.ts`, `js-core.ts`) |
| Where player code runs | An external sandbox (the public Rust Playground), called from `POST /api/run` | A disposable Web Worker in the player's own browser |
| Server involvement | `/api/run` with every guard in [security.md](security.md) (rate limits, quotas, cache, timeout) | None: the server never sees the code, and `/api/run` rejects packs with a browser runner (404 `unknown_language`) |
| Good for | Compiled languages that need a real toolchain (Rust, Go, Zig, Haskell) | Languages that can run in a browser: JS/TS and its frameworks, or anything with a WebAssembly build |
| Registered in | `RUNNERS` in `lib/runners/index.ts` | `BROWSER_RUNNER_IDS` in `lib/runners/ids.ts` |

**Never execute player code on the server process itself.** A server runner forwards the snippet to an isolated external sandbox; a browser runner keeps it in the player's browser.

### Adding a server runner

- Implement `LanguageRunner` (`lib/runners/types.ts`) in `lib/runners/<id>.ts` and register it in `lib/runners/index.ts`. Follow `rust-playground.ts`: timeout, no redirects, response size cap, shape check, failures reported as `available: false`.
- Add execution to `verify` in `scripts/validate-content.ts`, choosing by `codeLang`, and adjust `buildProgram` if the language needs a wrapper other than `fn main`.
- Mention the external service to the maintainers; `BITWISE_RUNNER=off` must disable it.

### Adding a browser runtime

Follow the `js-browser` pattern:

1. **Core** (`lib/runners/<lang>-core.ts`): a pure function `code → { ok, stdout, stderr, available: true }` with no browser or Node specifics, so the game and the validator share it and a snippet prints exactly the same thing in both. Capture output instead of writing to the real console, cap output size, report errors as `stderr` text instead of throwing, and stop when the program and its pending work are finished.
2. **Worker** (`lib/runners/<lang>-worker.ts`): receives `{ code, ... }` by `postMessage`, calls the core with the modules it may import, and posts the result back.
3. **Client entry**: extend `lib/runners/browser.ts` (or add a sibling) to create the worker with `new Worker(new URL("./<lang>-worker.ts", import.meta.url), { type: "module" })`, one per run, `terminate()` it after the result or after a hard timeout (3 s for `js-browser`), and resolve `available: false` if the worker cannot start, so the beat falls back to its `fallback` regex.
4. **Register the id** in `BROWSER_RUNNER_IDS` (`lib/runners/ids.ts`). That makes `RunBeatView` run it in the browser and makes `getRunner` in `lib/repo.ts` refuse it for `/api/run`. Route it in `RunBeatView` if it needs options other than `jsx`.
5. **Verification**: call the same core from `scripts/validate-content.ts` and add a static checker if the language has one (`scripts/ts-check.ts` runs `tsc --strict` for TS/TSX).
6. **Tests**: add `tests/<lang>-runner.test.ts` for output formatting, errors, async work and timeouts (see `tests/js-runner.test.ts`).
7. Keep the worker free of network and storage access you do not need, and read the worker notes in [security.md](security.md#player-code-execution).

## Designing the planet

- **Theme the planet on the language's core ideas.** Oxide (Rust) is iron and gears ruled by the Borrow Dragon; Concurra (Go) is a honeycomb of goroutine tunnels; Comptia (Zig) and Lambdara (Haskell) follow the same idea.
- **The guide is an original character inspired by the language**, not a copy of an official mascot, logo or any existing character. Ferro is a crab sensei, Gopi a tunnel digger, Iggi an iguana forge engineer, Lambo an owl. Give it a one-line `title` and a consistent voice: short, warm, encouraging sentences.
- **Bugs are the language's classic mistakes** turned into monsters: Rust has a mite, a dangler (dangling references), a cog golem and the borrow dragon; Go has a nil blob, a deadlock snail and race twins. Order `bugs` from weakest to strongest: review runs use the first one, and exams use the 1st (junior), 3rd (mid) and 4th (senior), clamped to the list length.
- **Story:** two or three sentences that introduce the world, the bugs and the guide (budget 260).
- **Colors:** `surface` and `accent` blend on the faceted low-poly sphere; `ring` adds a ring; `moons` adds small decorative moons (framework moons are added automatically from packs whose `parent` is this planet).

## Designing the region map

Order regions by teaching dependency, from concrete to abstract. For each language, identify the 4–6 concepts that are hardest for people coming from other languages and dedicate one region to each.

| Language | Suggested regions |
| --- | --- |
| Go | Variables and types · Slices and maps · Interfaces · Goroutines and channels · Errors and context |
| Zig | Types and comptime · Pointers and slices · Allocators · Errors · C interop |
| Haskell | Expressions and types · Pattern matching · Algebraic data types · Typeclasses · Monads and IO |
| TypeScript / JavaScript (in progress, `content/typescript/`) | Values and equality · Closures · Prototypes and arrays · Types · Event loop |
| React moon (in progress, `content/react/`) | JSX · State · Effects · Rendering (context, reducers, memoization, Suspense) |

## Checklist

- [ ] The planet has a localized name, story, guide name and guide title within budget, valid `#rrggbb` colors and at least one bug.
- [ ] The guide and every bug have a namespaced 16×16 sprite registered in `content/sprites.ts`; designs are original, not copies of official mascots.
- [ ] Lessons use the planet's bugs as `enemy`.
- [ ] The pack sets `codeLang`; a moon sets `parent` to an existing planet.
- [ ] `npm run content:check` and `npm run content:verify -- --lang=<slug>` with no errors (including translations and sprite checks).
- [ ] A new runner never executes player code on the server process, and has unit tests.
- [ ] The planet appears in the galaxy (`/galaxy`) as active in every locale, and landing shows the guide's intro the first time.
- [ ] `npm run playtest -- /play/<slug>/lesson/<first-lesson>` finishes and reports the result as saved.
- [ ] `npm test && npm run typecheck && npm run build` pass.
