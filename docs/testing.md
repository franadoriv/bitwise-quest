# Testing and verification

| Command | What it checks | When |
| --- | --- | --- |
| `npm run content:check` | Structure: `___` slots, answer indices, unique options, valid effects and actors, `fallback` regexes, exam topics, **every prose field localized in en/es/ja**, text budgets | Whenever you edit `content/` |
| `npm run content:verify` | All of the above, plus compiles every `check`, every `solution` and every `starter` against the real compiler (Rust Playground for Rust; `tsc --strict` plus the JS runner core for TS/TSX; Go Playground for Go; Compiler Explorer for C++, C#, Zig, Haskell and Ruby (the Ruby planet and the Rails moon); Pyodide in Node for Python). See [How each language is verified](#how-each-language-is-verified) | Before accepting new content, especially LLM-generated content |
| `npm run typecheck` | TypeScript types, including that every UI dictionary has every message key | After code changes |
| `npm run shots` | Regenerates the README screenshots in `docs/screenshots/` | After visible UI changes |
| `npm test` | Unit tests with `node:test`: save system (`tests/save.test.ts`), abuse-protection guards (`tests/security.test.ts`), JS/TS runner (`tests/js-runner.test.ts`), Python runner, snippet wrapper and highlighter (`tests/runners.test.ts`) and music (`tests/music.test.ts`) | After any change to `lib/save/`, game rules, `lib/security/`, API routes, `proxy.ts`, `lib/runners/`, `lib/syntax.ts`, `scripts/snippet-wrap.ts` or `lib/music/` |
| `npm run playtest -- <path>` | A bot plays the lesson, exam or review in headless Chrome, saves screenshots to `.playtest/` and checks the result was saved | After visual or content changes |
| `npm run e2e` | End-to-end memory card flow in headless Chrome | After changes to the save system, memory card, galaxy or landing |
| `npm run build` | Production build | Before delivering |

CI (`.github/workflows/ci.yml`) runs `content:check`, `npm test`, `typecheck` and `build` on every push to `develop` or `release` and on every pull request. The `check` job is required to merge into `release`.

## Unit tests (`npm test`)

`npm test` runs `node --test "tests/**/*.test.ts"`.

`tests/save.test.ts` covers:

- **Codec:** encode/decode round-trip (binary and base64); two exports of the same save differ and don't reveal the player name; any modified byte is rejected with `checksum`; a non-save file is rejected with `format`.
- **Migration:** a newer `version` is refused with `newer`; an old, partial shape is normalized (defaults filled, name trimmed, unknown keys and unknown languages preserved).
- **Export file name:** `BitwiseQuest_<player>_<YYYY-MM-DD_HH-MM-SS>.bwq`, with Latin accents folded (Ñandú → Nandu), other scripts kept (ゆうき), punctuation removed, and `Player` when nothing is left.
- **Progress rules:** lessons unlock in order, rewards accumulate, a missed beat becomes a due review and moves up a Leitner box; an exam skips mastered regions in order and unlocks the next one.
- **Save v2:** a v1 save migrates with 5 hint tickets and the `"normal"` timer (an invalid timer is repaired, unknown prefs survive); tickets are spent, bought for coins and earned by 3-star clears and the first play of a day.
- **Timer and scoring** (`lib/game-rules.ts`): question time grows with code size and scales with the timer mode, bosses are always timed, and opening the guidebook costs 25% and the speed bonus.

When the save format changes, add a fixture test here (see [save-system.md](save-system.md#changing-the-save-format)).

`tests/js-runner.test.ts` covers the JS/TS runner core (`lib/runners/js-core.ts`) that both the browser worker and the content validator use:

- **Formatting like Node:** arrays, objects with quoted keys, `Map`, `Set`, `undefined`, `-0`, bigint and class instances print as Node's `console.log` would.
- **TypeScript execution:** types are stripped and console output captured.
- **Event loop order:** synchronous code, then microtasks, then timers.
- **Async:** `async`/`await` and top-level `await`.
- **Errors:** runtime errors and syntax errors are returned as `ok: false` with `stderr`, never thrown.
- **React:** a TSX component renders to static markup with `renderToStaticMarkup`.
- **Timeouts:** a pending `setInterval` makes the run time out.

The Web Worker wrapper and the 3 s hard timeout (`lib/runners/js-worker.ts`, `browser.ts`) need a browser: check them by playtesting a TS/TSX `run` beat. Add a test here for any change to `js-core.ts`.

`tests/runners.test.ts` covers the other runner pieces shared by the game and the validator:

- **Pyodide version sync:** `PYODIDE_VERSION` in `lib/runners/py-core.ts` equals the exact `pyodide` version in `package.json` (the worker loads `/pyodide/<version>/`, which `scripts/copy-pyodide.mjs` fills from the installed package).
- **Python harness** (`runPython`, with Pyodide loaded in Node): stdout is captured; a runtime error has `phase: "runtime"` and a clean traceback that points at `main.py` and hides the harness; a syntax error has `phase: "compile"`; `asyncio.run()` works; a partial last line (`print(..., end=" ")`) stays in its own run; each run gets fresh globals.
- **Snippet wrapper** (`scripts/snippet-wrap.ts`): Go gets `package main`, the imports it uses and `func main`; C++ gets headers and `int main`; C# gets the missing `using` lines without duplicates; Zig gets the `std` import and `pub fn main() !void`; Haskell gets `main :: IO ()` / `main = do`; complete programs (a Haskell snippet that defines `main`) are left untouched.
- **Highlighter** (`lib/syntax.ts`): Go, Python, C++, C#, Zig, Haskell and Ruby tokenize keywords, functions, comments, preprocessor lines, Zig builtins (`@import`), Haskell primes (`x'`), Ruby `:symbols` and `@ivars` (as macros, with `#{...}` interpolation kept inside strings) and interpolated strings.

The Python Web Worker, its warm-up and its 5 s limit (`lib/runners/py-worker.ts`, `browser.ts`) need a browser: check them by playtesting a Python `run` beat (after `npm run dev`, which copies Pyodide to `public/pyodide/<version>/`).

`tests/music.test.ts` checks the tracker songs structurally (we cannot listen in CI): every song validates, every channel of every section has the section length, looping songs are long enough, jingles are short one-shots, notes stay in a sensible range, no two songs share a lead pattern, and the track names screens use resolve (with fallbacks).

`tests/security.test.ts` covers the primitives and guards in `lib/security/`:

- **Token bucket:** burst, denial with the right `Retry-After`, independent clients, refill over time, RateLimit headers; memory stays capped at `maxKeys` with LRU eviction.
- **Concurrency:** the semaphore fails fast and a double release frees only one slot; keyed concurrency limits each client separately.
- **TTL cache:** evicts the oldest entry at the cap and expires entries.
- **Client identity:** `clientKey` ignores `X-Forwarded-For` with 0 trusted hops, reads the right-most hop with 1, and rejects non-IP values.
- **Origin check:** same origin and allowlisted origins pass; cross-site and origin-less requests get 403.
- **Body parsing:** `readJson` rejects oversized bodies (413), the wrong content type (415) and invalid JSON (400); `onlyKeys` rejects unknown fields.

## Security probes

After touching an API route, `proxy.ts`, `next.config.ts` or `lib/security/`, run the manual probes in [security.md](security.md#manual-probes) against `npm run dev`: hostile requests (no `Origin`, a foreign `Origin`, wrong content type, oversized or malformed bodies, unknown fields, bursts of calls) must get the listed status codes (403, 415, 413, 400, 404, 429, 503, 405), and pages must carry the nonce CSP and the security headers.

`node scripts/security-probes.mjs` runs the hostile-body/origin, rate-limit and CSP/header probes without calling an external compiler. `node scripts/e2e-cloud-saves.mjs` tests cloud cards with mocked Supabase sessions and transport, including account separation, offline conflicts, recovery, cross-mode import/export and EN/ES/JA layouts. It requires the public cloud environment variables in the dev/build process; see [cloud-saves.md](cloud-saves.md). Database security tests run the real migration on ephemeral PostgreSQL (PGlite) as part of `npm test`.

## Content validator flags

`scripts/validate-content.ts` accepts:

| Flag | Effect |
| --- | --- |
| `--verify` | Also runs every snippet on the language runner (this is what `content:verify` adds) |
| `--lang=<slug>` | Only validates that pack, planet or moon, e.g. `--lang=rust`, `--lang=typescript`, `--lang=react`, `--lang=python`, `--lang=go`, `--lang=cpp`, `--lang=csharp`, `--lang=webgl`, `--lang=threejs`, `--lang=ruby`, `--lang=rails` |
| `--only=<substring>` | Only reports and verifies items whose location contains the substring: a region slug (`--only=ownership-forest`), a lesson slug, `exam:` for all exams (`--only=exam:senior` for one), or `task` for every coding task (solution, starter and near misses) |

```bash
npm run content:check -- --only=let-village
npm run content:verify -- --lang=rust --only=exam:
npm run content:verify -- --lang=typescript --only=closure-forest
npm run content:verify -- --lang=react
npm run content:verify -- --lang=go --only=exam:
npm run content:verify -- --lang=zig --only=task
```

## How each language is verified

| `codeLang` | Packs | `--verify` runs on | Network | Cache |
| --- | --- | --- | --- | --- |
| `rust` | rust | The public Rust Playground (3 in parallel) | Yes | None |
| `ts`, `tsx` | typescript, react, webgl, threejs | `tsc --strict` (`scripts/ts-check.ts`) plus `executeJs` (`lib/runners/js-core.ts`) | No | None |
| `go` | go | The game's `go-playground` runner (official Go Playground, 3 in parallel) | Yes | `.snippets/cache-go.json` |
| `cpp` | cpp | The game's `godbolt-cpp` runner (Compiler Explorer, g++ 14 `-std=c++20 -O1`, 2 in parallel) | Yes | `.snippets/cache-cpp.json` |
| `csharp` | csharp | The game's `godbolt-csharp` runner (Compiler Explorer, .NET 10, 2 in parallel) | Yes | `.snippets/cache-csharp.json` |
| `zig` | zig | The game's `godbolt-zig` runner (Compiler Explorer, Zig 0.15.2 Debug, 30 s timeout, 2 in parallel) | Yes | `.snippets/cache-zig.json` |
| `haskell` | haskell | The game's `godbolt-haskell` runner (Compiler Explorer, GHC 9.8.4, 2 in parallel) | Yes | `.snippets/cache-haskell.json` |
| `ruby` | ruby, rails | The game's `godbolt-ruby` runner (Compiler Explorer, Ruby 3.4.7, standard library only, 2 in parallel). Rails moon checks prepend the plain-Ruby helpers from `content/rails/mini.ts` in `check.program`; conceptual Rails API questions have no `check` | Yes | `.snippets/cache-ruby.json` |
| `python` | python | `runPython` (`lib/runners/py-core.ts`) with Pyodide loaded in Node from `node_modules/pyodide`, one snippet at a time | No | None |

**Programs.** Short snippets are completed by `wrapSnippet` in `scripts/snippet-wrap.ts` (`___` filled with the answer first): Rust gets `#![allow(unused)]` and `fn main`, Go gets `package main`, the standard imports it detects and `func main`, C++ gets common headers and `int main`, C# gets missing `using` lines, Zig gets `const std = @import("std");` and `pub fn main() !void`, Haskell gets `main :: IO ()` / `main = do`; TS/TSX run as module bodies, Python and Ruby as scripts. `check.program` and `run` beats (`solution`, `starter`) are complete programs and are never wrapped.

**Judging rules** (`verifyRunner` in `scripts/validate-content.ts`, used for Go, C++, C#, Zig, Haskell, Ruby and Python; the TS/TSX and Rust paths apply the same idea):

1. A result is "compiled" when it succeeded or failed with `phase: "runtime"`. `check.compiles` must match.
2. If it compiled and has `check.throws`, the run must fail and `stderr` must contain that text. `check.throws` works for every language except Rust.
3. Otherwise any runtime failure is an error (`runtime error: ...`).
4. `check.stdout` must equal the trimmed output; a `run` `solution` must print (contain) `expect`.
5. **Starter NOT-mode:** a `run` `starter` is only run; it is an error if it succeeds and already prints `expect`.

**Remote cache.** `scripts/remote-run.ts` keys each Go, C++, C#, Zig, Haskell and Ruby program by the first 32 hex characters of its SHA-256 and stores results in `.snippets/cache-<lang>.json` (gitignored). Re-runs only call the sandbox for new or changed programs, which keeps verification fast and polite to the public services. Unavailable results are not cached. At the end, the cache is merged with what is on disk and written to a temporary file that is atomically renamed, so several validators can run at once. Delete the file to force a full re-run (for example after a compiler upgrade upstream).

**Python in Node.** Python needs no network: the validator imports the `pyodide` package and runs every snippet through the same harness as the game's worker (`lib/runners/py-core.ts`), so output, tracebacks and `phase` match what players see. The first load takes a few seconds.

If a sandbox can't be reached, each affected snippet becomes a warning (`runner unavailable`) instead of an error; run again later.

### How TS/TSX packs are verified

For packs with `codeLang: "ts"` or `"tsx"`, `--verify` runs locally (no network):

1. Every snippet (module body, `___` filled with the answer) is type-checked in **one batch** with the real TypeScript compiler in strict mode (`scripts/ts-check.ts`). Snippets are virtual files in `.snippets/` (nothing is written; the folder is gitignored). Diagnostics are reported as `TS<code> (line N): <message>`.
2. `check.compiles` must match whether it type-checks. Snippets that type-check and carry `stdout`, `throws` or a `run` `expect` are then executed with `executeJs` from `lib/runners/js-core.ts` (the same core as the game's worker, with `react` and `react-dom/server` available, and `three` when a snippet imports it).
3. `check.stdout` must equal the trimmed output; `check.throws` must appear in the runtime error; any other runtime error is an error. A `run` `solution` must print `expect`; a `starter` that type-checks must not.

Typical errors: `expected to type-check but failed: TS2322 (line 2): ...`, `expected a type error but it type-checks`, `stdout "..." ≠ expected "..."`, `expected a runtime error containing "TypeError", got no error`, `runtime error: ReferenceError: React is not defined` (a TSX snippet without `import React from "react"`).

Verification runs in Node, the game in a browser worker: Node globals such as `process` exist in one and not the other. See [content-model.md](content-model.md#writing-snippets-for-the-js-runner) for what to avoid.

Errors (exit code 1) include missing or partial translations (`text must be localized { en, es, ja }, got a plain string ...`, `prompt.ja is empty`). Warnings include text over budget (`text.ja is 98 chars (budget 91)`), a `run` without `solution`, and a prompt that mentions compiling/printing without a `check`. If the runner can't be reached, each snippet becomes a warning instead of an error.

## Playtest

Needs the dev server running and a local Chrome installed.

```bash
npm run dev
BASE_URL=http://localhost:3000 npm run playtest -- /play/rust/lesson/hello-let --mistakes=1
npm run playtest -- /play/rust/exam/senior --mistakes=3 --size=390x844 --out=.playtest/mobile
npm run playtest -- /play/rust/lesson/one-owner --locale=ja --out=.playtest/ja
```

| Option | Default | Meaning |
| --- | --- | --- |
| `<path>` | `/play/rust/lesson/hello-let` | Lesson (`/play/<lang>/lesson/<slug>`), exam (`/play/<lang>/exam/<slug>`) or review (`/play/<lang>/review`) URL |
| `--mistakes=N` | `1` | Wrong answers to make on purpose |
| `--size=WxH` | `1280x720` | Viewport |
| `--out=dir` | `.playtest` | Screenshot folder |
| `--locale=en\|es\|ja` | `en` | UI language (sets the `locale` cookie) |

| Env var | Meaning |
| --- | --- |
| `BASE_URL` | Server URL (default `http://localhost:3000`) |
| `CHROME_PATH` | Chrome binary (default: the macOS install location) |
| `PLAYTEST_DEBUG` | When set, logs every beat the bot recognizes |
| `PLAYTEST_HELP` | When set (`1`), on the first `pick`/`predict` the bot opens the guidebook and spends a hint ticket, saving `guidebook` and `hint` screenshots |
| `PLAYTEST_TIMER` | `off`, `relaxed`, `normal` or `fast`: the mode to pick in the pre-lesson timer modal (default: the preselected one). The modal is always screenshotted as `timer` |

The bot answers from the content data (matching prompts in the chosen locale), makes `--mistakes` errors on purpose and exits with code 1 on page errors, if it doesn't reach the end, or if the result was not saved.

**Save injection.** Every page that plays needs a loaded save, so before opening the page the bot builds one with the real save code (`newSave("BOT")` + `completeLesson`) and writes it to `bwq:slot:1` / `bwq:active` in localStorage (only if slot 1 is empty in that fresh browser context):

- For `/play/<lang>/lesson/<slug>`, every lesson before the target is completed, so any lesson is reachable.
- The planet is marked as landed (`landedAt`), so the guide's intro does not cover the page.
- For `/play/<lang>/review`, the first question beats of the first lesson are seeded as due reviews.

**Persistence check.** After the run the bot decodes slot 1 and requires: for a lesson, `lessons.<slug>.doneAt`; for an exam, `exams.<slug>.attempts > 0`; for a review, every seeded key rescheduled into the future. It prints `✓ saved · xp ... · streak ...` or `✗ result was not saved to the slot`.

## Memory card end to end

```bash
npm run dev
BASE_URL=http://localhost:3000 npm run e2e -- --out=.playtest/memory-card
```

Uses the same `BASE_URL` and `CHROME_PATH` as the playtest, in English. Steps, with a screenshot each: title → PRESS START → memory card → new game in slot 1 (name "Ada") → galaxy → LAND on Rust → the guide's landing intro → map. Then it exports slot 1 (checks the file decodes and the name matches `BitwiseQuest_Ada_<date>_<time>.bwq`), imports it into empty slot 3, imports it again onto slot 1 (overwrite warning, then CONFIRM) and finally imports a tampered copy, which must be rejected. It prints the slots in storage and exits with code 1 on page errors or a bad export file name.

## Checklist

- [ ] `npm run content:check` with 0 errors.
- [ ] `npm run content:verify` with 0 errors for touched content.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes (save, security, JS runner, runners and music); for save or memory card changes, also `npm run e2e`.
- [ ] For `lib/runners/` changes, a case in `tests/js-runner.test.ts` or `tests/runners.test.ts` and a playtest of an affected `run` beat (TS/TSX, Python, or a server-runner language).
- [ ] For API, `proxy.ts` or `lib/security/` changes, the manual probes in [security.md](security.md#manual-probes) give the expected statuses.
- [ ] Playtest of an affected lesson; for layout changes, also `--locale=ja` and a portrait `--size`.
- [ ] `npm run build` for engine/UI changes.
