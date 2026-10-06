<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Bitwise Quest — guide for AI agents

A retro arcade game (Next.js 16 + Three.js + GSAP/SVG) for learning programming languages by playing. Each language is a planet with its own guide, bugs and story, and each framework of a language is a moon of its planet; Rust (planet Oxide) was the first playable one; TypeScript/JavaScript (planet Scriptara) with its React (Reactia), WebGL (Shadera) and three.js (Scenara) moons, Python (Serpentia), C# (Sharpholm), Go (Concurra) and C++ (Velocis) are being written. Player progress lives on the client in a 15-slot memory card; the server only serves content, from memory, with no database. The game is fully localized in English (primary), Spanish and Japanese.

## Before touching anything
- Read `docs/README.md`. Architecture is in `docs/architecture.md`, the save system in `docs/save-system.md`, the content schema in `lib/content/types.ts`, localization in `docs/i18n.md`, backend abuse protection in `docs/security.md`.
- Project playbooks live in `docs/playbooks/`: `add-lessons`, `add-language`, `add-moon`, `add-exam-questions` and `verify-content`.
- The brand lives in `lib/brand.ts` (`BRAND.name`, `BRAND.logo`, `BRAND.tagline`). Never hard-code the game's name.


## Branches
- Commit and push to `develop` (the default branch). There is no `main`.
- `release` is protected: changes reach it only through a pull request from `develop` with CI passing. Never push to it directly.

## Rules
- **Content is data.** Planets, sprites, lessons, regions, topics and exams live in `content/<lang>/`. Do not put language-specific logic in the engine (`components/`, `lib/`).
- **Planets and moons.** A language is a planet pack; a framework of it is a moon: a pack with `parent: "<planet slug>"`, its own slug, guide, bugs, routes and save progress. Moons never orbit moons. Every pack sets `codeLang` (`"rust" | "ts" | "tsx" | "go" | "python" | "cpp" | "csharp"`).
- **Planets.** Every pack has a `planet` (name, story, guide, colors, bugs). Pack sprites go in `content/<lang>/sprites.ts` with ids `<lang>/<name>` and are registered in `content/sprites.ts`. Guides and bugs are original designs inspired by the language, never copies of official mascots.
- **The server stays stateless.** `lib/repo.ts` serves content straight from `LANGUAGE_PACKS` (`content/index.ts`), indexed in memory at module load. There is no database and no disk writes; never add one, nor player data, progress endpoints or server-side saves.
- **Progress logic stays pure** in `lib/save/progress.ts`: functions take a save (plus the content they need) and return a new save, with no I/O. Components persist the result with `useSave().commit()`.
- **Never store content in saves**, only results keyed by stable slugs (language → lesson/review/exam). Unknown keys must be preserved.
- **Save format changes require a migration and a test:** bump `SAVE_VERSION` (`lib/save/schema.ts`), add the step to `MIGRATIONS` (`lib/save/migrate.ts`) and a fixture test in `tests/save.test.ts`. See `docs/save-system.md`.
- **Relative imports with a `.ts` extension in `content/`, `lib/content/`, `lib/i18n/` and `scripts/`.** Node runs those files directly (validator and playtest), without a bundler.
- **Every compiler claim has a `check`**, and every `run` beat has a `solution`. `npm run content:verify` must end with 0 errors. Short snippets are completed per language by `scripts/snippet-wrap.ts`; `check.throws` works for every language except Rust.
- **TS/TSX content must pass `tsc --strict` and the runner.** Snippets are module bodies; `check.compiles` means it type-checks, `check.stdout` is the exact output from `lib/runners/js-core.ts`, `check.throws` the runtime error. TSX snippets `import React from "react"`; no Node globals (`process.nextTick`), no DOM at runtime, effects never run in static renders; `three` is the only other importable module. See `docs/content-model.md`.
- **Go, C++, C# and Python content is verified on the game's own runners** (`scripts/remote-run.ts`: Go Playground and Compiler Explorer with a result cache in `.snippets/`, Python in Pyodide inside Node). Outputs must be deterministic; never claim the output of C++ undefined behavior; Python has no threads, network or `input()`. See `docs/content-model.md`.
- **Every prose field is `L(en, es, ja)`** (type `Text` in `lib/content/types.ts`). Plain strings are only for language-neutral code and identifiers. Code in exercises uses English identifiers in every locale; `error.compiler` is the real compiler or runtime message (rustc, tsc, a JS error, the Go/C++/C# compiler, a Python traceback) and is never translated. `npm run content:check` fails on any missing translation.
- **Text budgets** (latin script; Japanese gets ~65%): dialog 140, question prompt 60, act/run prompt 70, explain 160, error.plain 120, step label 16, `say`/`banner` 22; planet name 20, story 260, guide name 14, guide title 40.
- **UI strings** go in `lib/i18n/messages.ts`: add the key to `en` first, then to `es` and `ja` (TypeScript fails if one is missing). Components read them with `useI18n().t(key, vars)`; content text with `useI18n().tx(text)`.
- **Slugs are English** (regions such as `let-village`, `ownership-forest`; lessons such as `hello-let`) and stable. Saves are keyed by slug, so renaming or removing one leaves the old key orphaned in every save and players lose that lesson's progress.
- **UI sizes are px on the logical canvas** of 1280×720 (or 480 wide in portrait). `GameFrame` scales everything. Use `useOrientation()` to switch layouts.
- **Never execute player code on the server.** No `eval`, `new Function`, `vm` or child processes on player input in server code. Server runners (`lib/runners/index.ts`) forward the snippet to an external sandbox through `/api/run`; browser runners (`BROWSER_RUNNER_IDS` in `lib/runners/ids.ts`: `js-browser`, `py-browser`) run it in a Web Worker in the player's browser, and `/api/run` refuses them.
- Server runners send only the player's snippet: `rust-playground` to the public Rust Playground, `go-playground` to the official Go Playground, `godbolt-cpp` and `godbolt-csharp` to Compiler Explorer. New ones use the safe fetch in `lib/runners/http.ts` (timeout, no redirects, response cap, unavailable on any failure) and set `RunResult.phase`. `BITWISE_RUNNER=off` disables them all.
- Python runs on Pyodide, self-hosted under `public/pyodide/<version>/` (copied by `scripts/copy-pyodide.mjs`, gitignored); never load it from a CDN. Keep `PYODIDE_VERSION` in `lib/runners/py-core.ts` equal to the `pyodide` version in `package.json`.
- `lib/runners/js-core.ts` and `lib/runners/py-core.ts` are shared by the workers and the content validator; any change to them needs a case in `tests/js-runner.test.ts` or `tests/runners.test.ts`.
- Engine code and comments are in English.

## Security rules (backend)
See `docs/security.md` for the full picture. Every new or changed API endpoint must:
- Export only the methods it needs (normally just `POST`).
- Call `assertSameOrigin(req)` first, then take a per-client token from a `TokenBucket` keyed by `clientKey(req.headers)` and return 429 with `rateLimitHeaders` when denied.
- Read the body with `readJson(req, <byte cap>)`, require `isPlainObject`, reject extra fields with `onlyKeys` and validate every field strictly (type, regex, length, count).
- Add a global quota and fail-fast concurrency caps (`Semaphore`, `KeyedConcurrency`) when it calls anything slow or paid upstream, and a timeout plus a response size cap on that call.
- Answer through `json` / `errorResponse` with stable error codes; never return internals, stack traces or upstream error text.
- Keep every number in `LIMITS` in `lib/security/policies.ts` (the single place to tune) and update the table in `docs/security.md`.
- Never log player code, IP addresses or request bodies.
- Do not loosen the CSP in `proxy.ts` or the headers in `next.config.ts`; never use `dangerouslySetInnerHTML`.
- Add a case to `tests/security.test.ts` for any new guard.

## Minimum verification before finishing
`npm run content:check && npm test && npm run typecheck` (`npm test` covers the save system, the security guards, the JS/TS runner, the Python runner, snippet wrapper and highlighter, and the music). If you touched an API route, `proxy.ts` or `lib/security/`, also run the manual probes in `docs/security.md`. If you touched content, also `npm run content:verify` (scope with `-- --lang=<pack> --only=<region-slug>` or `--only=exam:`; TS/TSX packs verify locally with `tsc --strict` and the runner and Python with Pyodide in Node, no network; Go, C++ and C# call their sandboxes with a local cache). If you touched UI, playtest (see `docs/testing.md`, try `--locale=ja` for layout overflow) and run `npm run build`. If you touched `lib/save/`, the memory card, the galaxy or the landing, also run `npm run e2e` with the dev server running.
