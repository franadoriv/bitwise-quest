# Adding a programming language

This guide is about adding a new **programming language** (a planet such as a hypothetical Elixir). To add a new **human language** for the UI and content (for example French), see [i18n.md](i18n.md#adding-a-locale).

Every language is a **planet** in the galaxy, with its own **guide** (a mascot that teaches), its own **bugs** (the enemies) and a short **story**. Adding a language means writing a pack with a planet, its sprites, regions, topics and exams. No engine file changes are needed except syntax highlighting and, optionally, a runner.

Example: Go (`content/go/`, planet Concurra), and more recently Zig (`content/zig/`, planet Comptia), Haskell (`content/haskell/`, planet Lambdara) and Ruby (`content/ruby/`, planet Rubion), each started as a "soon" placeholder and is now a full pack. A new language can start the same way: a pack with only a planet and sprites (`content/<lang>/planet.ts`, `content/<lang>/sprites.ts`), registered with the `soon(...)` helper in `content/index.ts`, shows locked in the galaxy; making it playable means adding its lessons and switching it to `active`. The examples below use a hypothetical Elixir as the new language.

## Planet or moon?

| You are adding... | It is a... | Example | How |
| --- | --- | --- | --- |
| A programming language | **Planet**: a top-level pack | Rust (Oxide), TypeScript/JavaScript (Scriptara), Python (Serpentia), C# (Sharpholm), Go (Concurra), C++ (Velocis), Zig (Comptia), Haskell (Lambdara), Ruby (Rubion) | This guide |
| A framework or library of an existing language | **Moon**: a pack with `parent: "<planet slug>"` | React (Reactia), WebGL (Shadera) and three.js (Scenara), moons of Scriptara; Ruby on Rails (Railhaven), moon of Rubion; future: Babylon.js, Django, Laravel | This guide, plus the differences below. Step by step in the [`add-moon` playbook](playbooks/add-moon/SKILL.md) |

A moon is built exactly like a planet (planet/guide/bugs, sprites, regions, topics, exams) with these differences:

- Set `parent` to the planet's slug in the pack. The validator rejects an unknown parent and a moon whose parent is itself a moon.
- The moon has its **own** slug, guide, bugs, sprites (`<moon slug>/<name>`), routes (`/play/<moon slug>`) and save progress. It does not share lessons or progress with its planet.
- It usually shares the planet's `runner` and a compatible `codeLang` (React uses `js-browser` and `tsx`, WebGL and three.js use `js-browser` and `ts`, their planet `js-browser` and `ts`; Rails uses its planet's `godbolt-ruby` and `ruby`).
- It does not appear as a planet in the galaxy: it orbits its planet (accent color, dimmed while `soon`) and appears as a button in the planet card. Its `planet.colors.accent` is the orbiting moon's color; `ring` and `moons` are not drawn for moons.
- Write the moon's lessons assuming the player knows the planet's language basics, and say so in the first dialog.
- If no runner can load the framework, see [A framework without a sandbox](#a-framework-without-a-sandbox).

### A framework without a sandbox

Some frameworks cannot run in any sandbox the game uses: Rails needs gems and a database, and Compiler Explorer's Ruby 3.4.7 has only the standard library. The Rails moon (`content/rails/`) still keeps every claim verifiable by teaching the framework two ways, a pattern that future moons such as Django or Laravel can reuse:

1. **Under the hood (verified).** Lessons build tiny plain-language versions of the framework's mechanisms (a model over an in-memory table, a lazy relation, dynamic finders through `method_missing`, associations through `define_method`, a query-counting DB that makes N+1 visible, validations, a callback chain, a `before_action` filter chain) and every `check` runs on the planet's runner. Mechanisms reused by many questions live in a shared hidden helper file (`content/rails/mini.ts`: `MINI_RECORD` and `MINI_CONTROLLER`) and are prepended to a `check.program` with `withHelper(helper, code)`; players meet them in dialogs, never as their own code. Names and messages mirror the framework where useful, but prose says "our mini version", never "Rails prints". `run` beats are sent as written, so keep their `starter` and `solution` self-contained.
2. **The real API (conceptual).** Facts that only the real framework can show (generators, conventions, defaults such as HTML escaping in views) are `pick` or `type` questions without a `check`, each explained from, and anchored to, the framework's official guides.

Plan the split in the research notes first (see [research/rails-curriculum.md](research/rails-curriculum.md), which tags each question as runtime-verified, verified with the helper, or documentation-only), keep the helper small enough to verify on the runner, and never claim that a mini version's output is what the framework prints.

## Steps

1. **Planet.** Design the planet before any lesson (see [Designing the planet](#designing-the-planet)). Write it as a `PlanetDef` (`lib/content/types.ts`), either inline in `index.ts` like `content/rust/index.ts` or in `content/<lang>/planet.ts` like Go, Python, Zig, Haskell and Ruby:
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
     status: "active", runner: "go-playground", codeLang: "go",
     planet,
     regions: [/* imported from ./regions/*.ts */],
     topics, exams,
   };
   ```
   Copy the structure of `content/rust/`: `helpers.ts`, `topics.ts`, `exams.ts` and `regions/<slug>.ts` (English kebab-case slugs). All prose is `L(en, es, ja)`; see [content-model.md](content-model.md) and [i18n.md](i18n.md). Lesson `enemy` values should be the planet's bugs (`"go/nil-blob"`), and `speaker: "master"` dialogs are spoken by the guide, so write them in the guide's voice.
4. **Registration.** In `content/index.ts`, add the imported pack to `LANGUAGE_PACKS` (as Go, Zig and Haskell did: `import { zig } from "./zig/index.ts"`), replacing its `soon("<slug>", ..., <slug>Planet)` placeholder if it had one.
5. **Code language and highlighting.** Set `codeLang` on the pack. Existing values are `"rust" | "ts" | "tsx" | "go" | "python" | "cpp" | "csharp" | "zig" | "haskell" | "ruby"`. For a new one, add it to `CodeLang` (`lib/content/types.ts`), give it a grammar in `GRAMMARS` in `lib/syntax.ts` (keyed by `codeLang`; keywords and types) and, unless it has Rust-like syntax, a lexer in `LEXERS` built with `lexer(comment, string, macro)` (comment, string and macro/decorator patterns; Go, C++, C#, Zig, Haskell, Ruby and Python are examples). `tests/runners.test.ts` checks that the highlighter knows every code language. `codeLangOf` in `lib/repo.ts` and `scripts/validate-content.ts` defaults a pack without `codeLang` to `"ts"` (except the `rust` pack), so a new language that leaves it unset would be type-checked as TypeScript. An unknown grammar key falls back to the Rust grammar.
6. **Snippet wrapper.** Lesson snippets are short; `wrapSnippet` in `scripts/snippet-wrap.ts` completes them into full programs for verification (Rust adds `fn main`, Go adds `package main`, the imports it detects and `func main`, C++ adds common headers and `int main`, C# adds missing `using` lines, Zig adds `const std = @import("std");` and `pub fn main() !void`, Haskell adds `main :: IO ()` / `main = do`; TS/TSX, Python and Ruby run as written). Add a case for a new compiled language, and a case in `tests/runners.test.ts`. A `check.program` or a `run` beat's full program is never wrapped.
7. **Runner (optional).** Needed for `run` beats and for verifying `check`. See [Choosing a runner](#choosing-a-runner). Without a runner, use only beats that don't need a compiler and omit `check`.
8. **Verify** with the checklist below.

Saves need no change: progress is keyed by language and lesson slug, so a new language simply starts empty in every existing save (see [save-system.md](save-system.md#why-adding-a-language-doesnt-break-saves)).

## Choosing a runner

A runner executes `run` beats in the game. `content:verify` executes `check` and `run` claims with the same toolchain. Runners that exist today:

| Runner id | Kind | Languages (`codeLang`) | Where player code runs | Files | Verified by `content:verify` with |
| --- | --- | --- | --- | --- | --- |
| `rust-playground` | Server | `rust` | Public Rust Playground (play.rust-lang.org) | `lib/runners/rust-playground.ts` | The Rust Playground |
| `go-playground` | Server | `go` | Official Go Playground (`go.dev/_/compile`) | `lib/runners/go-playground.ts` | The same runner through `scripts/remote-run.ts` (cached) |
| `godbolt-cpp` | Server | `cpp` | Compiler Explorer, g++ 14 `-std=c++20 -O1` | `lib/runners/godbolt.ts` | The same runner through `scripts/remote-run.ts` (cached) |
| `godbolt-csharp` | Server | `csharp` | Compiler Explorer, .NET 10 (CoreCLR) | `lib/runners/godbolt.ts` | The same runner through `scripts/remote-run.ts` (cached) |
| `godbolt-zig` | Server | `zig` | Compiler Explorer, Zig 0.15.2 (Debug), 30 s timeout | `lib/runners/godbolt.ts` | The same runner through `scripts/remote-run.ts` (cached) |
| `godbolt-haskell` | Server | `haskell` | Compiler Explorer, GHC 9.8.4 | `lib/runners/godbolt.ts` | The same runner through `scripts/remote-run.ts` (cached) |
| `godbolt-ruby` | Server | `ruby` | Compiler Explorer, Ruby 3.4.7 (standard library only) | `lib/runners/godbolt.ts` | The same runner through `scripts/remote-run.ts` (cached) |
| `js-browser` | Browser | `ts`, `tsx` | A disposable Web Worker in the player's browser | `lib/runners/js-core.ts`, `js-worker.ts`, `browser.ts` | `tsc --strict` (`scripts/ts-check.ts`) plus `js-core.ts` in Node |
| `py-browser` | Browser | `python` | Pyodide (CPython 3.14 in WebAssembly) in a reusable Web Worker in the player's browser | `lib/runners/py-core.ts`, `py-worker.ts`, `browser.ts` | `py-core.ts` with Pyodide in Node, through `scripts/remote-run.ts` |

The two kinds compare like this:

| | Server runner | Browser runner |
| --- | --- | --- |
| Where player code runs | An external sandbox, called from `POST /api/run` | A Web Worker in the player's own browser |
| Server involvement | `/api/run` with every guard in [security.md](security.md) (rate limits, quotas, cache, timeout) | None (it only serves static files such as the self-hosted Pyodide runtime): the server never sees the code, and `/api/run` rejects packs with a browser runner (404 `unknown_language`) |
| Good for | Compiled languages that need a real toolchain and have a public sandbox (Rust, Go, C++, C#, Zig, Haskell), or interpreted ones with a public sandbox (Ruby) | Languages that can run in a browser: JS/TS and its frameworks, or anything with a WebAssembly build (Python) |
| Registered in | `RUNNERS` in `lib/runners/index.ts` | `BROWSER_RUNNER_IDS` in `lib/runners/ids.ts` |

**Never execute player code on the server process itself.** A server runner forwards the snippet to an isolated external sandbox; a browser runner keeps it in the player's browser.

Every runner returns a `RunResult` (`lib/runners/types.ts`) and, when a run fails, sets `phase: "compile"` or `phase: "runtime"`, which `RunBeatView` uses to show "the compiler complains" or "it crashed while running".

### Adding a server runner

- Implement `LanguageRunner` (`lib/runners/types.ts`) in `lib/runners/<id>.ts` and register it in `RUNNERS` in `lib/runners/index.ts`. Use `postJson` from `lib/runners/http.ts` (timeout, no redirects, `User-Agent`, 1 MB response cap, JSON parse, `null` on any failure) and return `UNAVAILABLE` when it fails or the reply has an unexpected shape. Follow `go-playground.ts` and `godbolt.ts`.
- Set `phase` on every failure, and clean the output so it reads like a local build: strip ANSI codes and tool noise, and rename sandbox paths to a normal file name (`prog.go`, `main.cpp`, `Program.cs`, `main.zig`, `Main.hs`, `main.rb`). A Compiler Explorer language is one line in `godbolt.ts` (`godbolt(id, compiler, lang, userArguments, clean, split?, timeoutMs?)`); pass a `Split` hook when program output does not arrive on stdout (Zig's `splitZig` treats `std.debug.print` text on stderr before a panic or a returned `error: Name` as stdout) or when a failure needs a different `phase` (the hook may return one: Ruby's `splitRuby` reports a `SyntaxError` as `compile`, since Ruby has no build step), and a longer timeout for a slow compiler (30 s for Zig).
- Add the language to `REMOTE` and `VERIFIABLE_LANGS` in `scripts/remote-run.ts`, with a small parallelism, so `content:verify` runs `check` and `run` claims on the same runner (results are cached in `.snippets/cache-<lang>.json`). Add a case to `wrapSnippet` in `scripts/snippet-wrap.ts` if short snippets need a wrapper.
- Document what is sent to the third party in [security.md](security.md#upstream-runners-server-runners) and mention the external service to the maintainers; `BITWISE_RUNNER=off` must disable it (it does for every runner returned by `getRunner` in `lib/runners/index.ts`).

### Adding a browser runtime

Follow the `js-browser` and `py-browser` patterns:

1. **Core** (`lib/runners/<lang>-core.ts`): a pure function `code → { ok, stdout, stderr, available: true, phase? }` with no browser or Node specifics, so the game and the validator share it and a snippet prints exactly the same thing in both. Capture output instead of writing to the real console, cap output size, report errors as `stderr` text instead of throwing, and stop when the program and its pending work are finished.
2. **Worker** (`lib/runners/<lang>-worker.ts`): receives `{ code, ... }` by `postMessage`, calls the core with the modules it may import, and posts the result back. A heavy runtime (like Pyodide) can stay loaded in a long-lived worker that answers `{ id, code }` messages.
3. **Client entry**: extend `lib/runners/browser.ts` to create the worker with `new Worker(new URL("./<lang>-worker.ts", import.meta.url), { type: "module" })`. Either one worker per run, terminated after the result or a hard timeout (3 s for `js-browser`), or a warm reusable worker whose time limit starts once the runtime is ready and which is terminated and recreated when a run times out (5 s for `py-browser`, see `warmPython` and `runPythonInBrowser`). Resolve `available: false` if the worker or runtime cannot start, so the beat falls back to its `fallback` regex.
4. **Runtime assets**: self-host them from the game's origin, never from a third-party CDN. `py-browser` copies Pyodide from `node_modules` to the gitignored `public/pyodide/<version>/` with `scripts/copy-pyodide.mjs` (on `postinstall`, `predev` and `prebuild`), serves it with immutable caching from `next.config.ts` and excludes the path from the `proxy.ts` matcher.
5. **Register the id** in `BROWSER_RUNNER_IDS` (`lib/runners/ids.ts`). That makes `getRunner` in `lib/repo.ts` refuse it for `/api/run`. Route it in `RunBeatView` (as `py-browser` is) if it needs a different entry point or options other than `jsx`.
6. **Verification**: call the same core from the validator (`scripts/remote-run.ts` loads Pyodide in Node for Python) and add a static checker if the language has one (`scripts/ts-check.ts` runs `tsc --strict` for TS/TSX).
7. **Tests**: add cases for output formatting, errors, async work and timeouts (see `tests/js-runner.test.ts` and `tests/runners.test.ts`).
8. Keep the worker free of network and storage access you do not need, and read the worker notes in [security.md](security.md#player-code-execution).

## Designing the planet

- **Theme the planet on the language's core ideas.** Oxide (Rust) is iron and gears ruled by the Borrow Dragon; Concurra (Go) is a honeycomb of goroutine tunnels; Comptia (Zig) is a forge world where every allocation is explicit and much of the work runs at compile time; Lambdara (Haskell) floats in pure, calm skies where nothing changes once made; Rubion (Ruby) is a jewel world where everything is an object that answers messages.
- **The guide is an original character inspired by the language**, not a copy of an official mascot, logo or any existing character. Ferro is a crab sensei, Gopi a tunnel digger, Iggi an iguana forge engineer, Lambo an owl, Kira a gem-hearted fox. Give it a one-line `title` and a consistent voice: short, warm, encouraging sentences.
- **Bugs are the language's classic mistakes** turned into monsters: Rust has a mite, a dangler (dangling references), a cog golem and the borrow dragon; Go has a nil blob, a deadlock snail and race twins. Order `bugs` from weakest to strongest: review runs use the first one, and exams use the 1st (junior), 3rd (mid) and 4th (senior), clamped to the list length.
- **Story:** two or three sentences that introduce the world, the bugs and the guide (budget 260).
- **Colors:** `surface` and `accent` blend on the faceted low-poly sphere; `ring` adds a ring; `moons` adds small decorative moons (framework moons are added automatically from packs whose `parent` is this planet).

## Designing the region map

Order regions by teaching dependency, from concrete to abstract. For each language, identify the 4–6 concepts that are hardest for people coming from other languages and dedicate one region to each.

| Language | Suggested regions |
| --- | --- |
| Elixir (hypothetical) | Pattern matching · Immutable data · Processes and messages · OTP supervisors · Macros |
| TypeScript / JavaScript (in progress, `content/typescript/`) | Values and equality · Closures · Prototypes and arrays · Types · Event loop |
| React moon (in progress, `content/react/`) | JSX · State · Effects · Rendering (context, reducers, memoization, Suspense) |

Go, Python, C++, C#, Zig, Haskell, Ruby, WebGL, three.js and Rails are being written; their region plans come from the research notes in [`docs/research/`](research/) (hiring assessments and curriculum per language).

## Checklist

- [ ] The planet has a localized name, story, guide name and guide title within budget, valid `#rrggbb` colors and at least one bug.
- [ ] The guide and every bug have a namespaced 16×16 sprite registered in `content/sprites.ts`; designs are original, not copies of official mascots.
- [ ] Lessons use the planet's bugs as `enemy`.
- [ ] The pack sets `codeLang`; a moon sets `parent` to an existing planet.
- [ ] `npm run content:check` and `npm run content:verify -- --lang=<slug>` with no errors (including translations and sprite checks); a new compiled language has a case in `scripts/snippet-wrap.ts`.
- [ ] A new runner never executes player code on the server process, and has unit tests.
- [ ] The planet appears in the galaxy (`/galaxy`) as active in every locale, and landing shows the guide's intro the first time.
- [ ] `npm run playtest -- /play/<slug>/lesson/<first-lesson>` finishes and reports the result as saved.
- [ ] `npm test && npm run typecheck && npm run build` pass.
