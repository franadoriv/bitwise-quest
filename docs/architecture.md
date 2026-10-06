# Architecture

## Overview

```
content/<lang>/        Language packs: planet, regions, lessons, topics, exams (pure data, localized with L(en, es, ja)).
                       A pack with `parent` is a moon (a framework of its planet's language, e.g. content/react)
content/<lang>/sprites.ts   Pack pixel sprites (guide, bugs), registered in content/sprites.ts (client-safe)
        │  imported by
        ▼
lib/repo.ts            Content reads only, straight from LANGUAGE_PACKS (indexed once in memory at module load):
                       languages/planets, world, lesson, review, exams. No database, no disk writes
        │  used by
        ▼
app/                   Next.js routes (App Router). Server pages read lib/repo.ts and pass CONTENT to client components
app/layout.tsx         Fonts, locale negotiation (cookie / Accept-Language), I18nProvider, SaveProvider, GameFrame
app/api/*              Endpoints: run (code runner), review-play (beats for due review keys). POST only, guarded
proxy.ts               Per-request nonce CSP + page rate limit (runs before every page request; skips /pyodide/*)
next.config.ts         Security headers for every response; immutable caching for /pyodide/*
public/pyodide/<ver>/  Self-hosted Python runtime (Pyodide), copied from node_modules by scripts/copy-pyodide.mjs (gitignored)
lib/security/          Abuse protection: limits (token bucket, semaphores, TTL cache), http guards, policies (quotas)
        │
        ▼
lib/save/              Client save system: schema, migrations, binary codec, localStorage slots, pure progress rules
components/save/       SaveProvider/useSave/RequireSave, MemoryCard (/saves), PlayerChip (autosave light)
components/galaxy/     Galaxy3D (low-poly planets, rings, framework and decorative moons, starfield) and GalaxyClient (planet card, moon buttons, LAND)
components/world/      Three.js planet map (low poly islands) and its HUD, landing intro by the guide
components/game/       Lesson engine: Stage (SVG+GSAP), beats, LessonGame (orchestrator), ResultScreen
components/exam/       Exam hub and per-topic report
components/title/      Title screen (the planets' guides walk across it)
components/ui/         GameFrame (16:9 scaling), Settings (language, palette, sound), I18n, Providers
components/pixel/      Built-in pixel art sprites as text grids, getSprite() (built-in + pack sprites)
lib/brand.ts           Game name, logo text and localized tagline (single source of truth)
lib/i18n/              text.ts (locales, Text, L, tx, negotiateLocale) and messages.ts (UI dictionaries)
lib/                   fx (particles, banners), sfx (WebAudio chiptune), syntax (highlighting), palette, game-rules
lib/runners/           Code execution. Server runners (via /api/run, registered in index.ts): rust-playground,
                       go-playground, godbolt-cpp and godbolt-csharp (godbolt.ts), with the shared safe fetch in http.ts.
                       Browser runners: js-browser (js-core.ts shared with the validator, js-worker.ts) and py-browser
                       (py-core.ts shared with the validator, py-worker.ts); browser.ts starts both; ids.ts lists browser ids
lib/music/             Tracker songs (DSL) played by lib/sfx.ts
scripts/               validate-content.ts, ts-check.ts (tsc --strict batch), snippet-wrap.ts (completes short snippets),
                       remote-run.ts (Go/C++/C#/Python verification), copy-pyodide.mjs, playtest.mjs, e2e-memory-card.mjs, shots.mjs
tests/                 save, security, js-runner, runners and music tests (npm test)
```

## Client save vs server content

The split is strict:

| Side | Holds | Where |
| --- | --- | --- |
| **Server** | Content only: planets, regions, lessons, topics, exams. Stateless with respect to players | `content/index.ts` (`LANGUAGE_PACKS`), `lib/repo.ts`, `app/**/page.tsx`, `app/api/*` |
| **Client** | All player progress: XP, coins, streak, stars, mastery, reviews, exam results, landings, play time | `lib/save/*`, `components/save/*`, localStorage `bwq:slot:<n>` |

The server never receives or stores a save. Pages send content to client components; the client combines it with the active save through the pure functions in `lib/save/progress.ts` (`worldState`, `completeLesson`, `completeExam`...) and autosaves with `useSave().commit()`. Every screen that needs a player is wrapped in `RequireSave`, which redirects to `/saves` when no slot is loaded. Full details in [save-system.md](save-system.md).

## Screen flow

```
/  Title ──PRESS START──▶ /saves  Memory card (15 slots: new game, continue, import/export)
                               │ choose a slot
                               ▼
                         /galaxy  Choose a planet (3D galaxy + planet card) ──LAND──▶ /play/<lang>  Planet map
                                                                                         │ first visit: landing intro by the guide (saved as landedAt)
                                                                                         ├──▶ /play/<lang>/lesson/<slug>
                                                                                         ├──▶ /play/<lang>/exam  ──▶ /play/<lang>/exam/<slug>
                                                                                         └──▶ /play/<lang>/review
```

| Route | Server loads | Client component |
| --- | --- | --- |
| `/` | `getLanguages()` (guide sprites) | `TitleScreen` |
| `/saves` | `getLanguages()` (planet name and guide sprite per slot) | `MemoryCard` |
| `/galaxy` | `getLanguages()` + lesson slugs per language, grouped as planets with their moons | `GalaxyClient` + `Galaxy3D` |
| `/play/[lang]` | `getWorldContent(lang)` (404 unless `active`); `lang` is a planet or a moon slug | `WorldClient` + `WorldMap3D` |
| `/play/[lang]/lesson/[slug]` | `getLessonPlay` + `getWorldContent` | `LessonClient` (redirects to the map if `isUnlocked` is false) |
| `/play/[lang]/exam` | `getExams(lang)` | `ExamHub` |
| `/play/[lang]/exam/[slug]` | `getExamPlay` (includes `exam` meta for client grading) | `LessonClient` |
| `/play/[lang]/review` | `getLanguage(lang)` | `ReviewClient`: reads due keys from the save, then `POST /api/review-play` |

The galaxy starts on the save's `lastLang`. Planets whose language is `soon` are shown locked ("under construction"). The planet card shows the guide, story, bugs, progress (`done/total` lessons) and the LAND button.

### Planets and moons in the galaxy

`app/galaxy/page.tsx` lists only planets (packs without `parent`) and attaches to each one the packs whose `parent` is its slug. In `Galaxy3D` each framework moon orbits its planet as a larger faceted sphere in the moon's `planet.colors.accent` color, dimmed when the moon is not `active`; `PlanetDef.moons` adds smaller grey decorative moons further out. The planet card lists the moons as buttons (guide sprite, name, `done/total` or "soon") that land on `/play/<moon slug>`. Everything after landing (map, lessons, exams, review, save progress) works on the moon's slug exactly as for a planet.

## Lesson flow

1. `app/play/[lang]/lesson/[slug]/page.tsx` loads `LessonPlay` (beats, enemy sprite, theme, the planet's `guide`) and the world content from `lib/repo.ts`.
2. `LessonClient` waits for a save (`RequireSave`), checks `isUnlocked` against it and mounts `LessonGame` on the client only, because it uses audio, GSAP and random shuffling.
3. `LessonGame` walks the beat queue. For each beat it runs `setup` on the stage, shows the beat component and waits for `solved` or `wrong`.
4. A correct answer adds points, combo and speed bonus, plays the `win` effects and hits the bug. A wrong answer costs a heart, shows `explain` in a box with the planet's guide and pushes the beat to the end of the queue.
5. At the end, `completeLesson` (or `completeExam` / `completeReview`) computes the reward on the client and the new save is committed to the active slot. On game over, `recordFailedRun` still stores the misses for review.

All content arrives at the client with every locale (`Text` values). Components resolve it at render time with `useI18n().tx(text)`, so switching language never needs a reload. See [i18n.md](i18n.md).

## API

| Endpoint | Body | Returns |
| --- | --- | --- |
| `POST /api/run` | `{ language, code }` (body ≤ 16 KB, code ≤ 10,000 chars and 400 lines) | Runner result `{ ok, stdout, stderr, available, phase? }` (output capped at 8,000 chars each) |
| `POST /api/review-play` | `{ lang, keys }` with keys `"<lessonSlug>#<beatIndex>"` (body ≤ 2 KB) | A review `LessonPlay` with those beats (max 12, question beats except `run`), or 400/404 |

Both endpoints only export `POST` (any other method gets 405), require a same-origin `Origin`, are rate limited per client and answer errors as `{ "error": "<code>" }` with a stable code. The full list of checks, quotas and status codes is in [security.md](security.md).

There are no progress endpoints: the old `complete`, `attempts`, `review` and `exam` endpoints were removed when progress moved to the client.

## Stage and effects

`components/game/Stage.tsx` draws an SVG with `viewBox 240×96`. The background extends beyond the viewBox, so it fills any aspect ratio without cropping. The actors are `hero`, `ally` and `enemy`. There is one main item and a "ghost" for clones and borrows. Content never animates anything directly: it describes effects (`give`, `lend`, `drop`...) and the stage decides how they look. The same content keeps working when the art changes.

Sprites are text grids. `getSprite(id)` in `components/pixel/sprites.ts` looks up built-in sprites and pack sprites (`PACK_SPRITES` from `content/sprites.ts`), falling back to `slime` for unknown ids. Colors map to palette CSS variables, so pack sprites follow the selected palette.

## 16:9 frame

`components/ui/GameFrame.tsx` draws the UI on a logical 1280×720 canvas and scales it with CSS `zoom` to fill the window. In portrait it uses a 480 px wide canvas and a single column. Components use `useOrientation()` to pick their layout. Every px size refers to the logical canvas.

## Localization

| Piece | Path | Role |
| --- | --- | --- |
| Locale core | `lib/i18n/text.ts` | `LOCALES`, `DEFAULT_LOCALE = "en"`, `Text`, `Localized`, `L()`, `tx()`, `negotiateLocale()` |
| UI dictionaries | `lib/i18n/messages.ts` | `MESSAGES[locale][key]`, `format()`, `localized()` |
| React context | `components/ui/I18n.tsx` | `I18nProvider`, `useI18n()` |
| Initial locale | `app/layout.tsx` | `locale` cookie, else `Accept-Language` |
| Switcher | `components/ui/Settings.tsx` | Cycles EN → ES → 日本 |

Full details in [i18n.md](i18n.md).

## Content serving (no database)

There is no database. `lib/repo.ts` imports `LANGUAGE_PACKS` from `content/index.ts` and indexes it once, at module load, into in-memory maps (packs by slug, lessons by language and slug). Every read is computed from that immutable data, so:

- **The server is stateless.** It writes nothing to disk and keeps no player data; any number of instances can serve the same build.
- **Content changes ship with the build.** Editing `content/` and restarting (or rebuilding) is all it takes; there is nothing to seed, migrate or reset.
- **All locales travel together.** `Text` values keep every locale and are resolved on the client with `useI18n().tx(text)`.
- **Renaming or removing a slug** simply leaves the old key in players' saves with nothing to match (orphaned progress): that lesson shows as not completed. Keep slugs stable (see [save-system.md](save-system.md#why-adding-a-language-doesnt-break-saves)).

The only in-memory mutable state on the server is the abuse-protection counters and the run cache in `lib/security/policies.ts` (see [security.md](security.md)).

## Unlock rules

Computed on the client by `worldState` in `lib/save/progress.ts`:

- A region unlocks when every lesson of the previous region is completed or skipped (and the region is `active`).
- A lesson unlocks when the previous lesson in its region is completed.
- An entry exam skips regions in order while the player answers at least 80% of the questions on that region's topics correctly, with a minimum of 2 questions.

## Code execution

`LessonPlay` carries the pack's `runner` id and `codeLang`. `RunBeatView` (`components/game/beats/RunBeatView.tsx`) picks the path:

```
runner?
├── py-browser       runPythonInBrowser(code)                                 lib/runners/browser.ts
│                    └── one long-lived Web Worker (lib/runners/py-worker.ts), warmed when the exercise opens
│                        └── runPython (lib/runners/py-core.ts) in Pyodide loaded from /pyodide/<version>/
├── js-browser       runInBrowser(code, { jsx: codeLang === "tsx" })         lib/runners/browser.ts
│                    └── new Web Worker (lib/runners/js-worker.ts) per run, terminated after 3 s at most
│                        └── executeJs (lib/runners/js-core.ts) with modules react, react-dom/server (+ three, lazily)
└── server runners   POST /api/run → guards → getRunner(id) (lib/runners/index.ts) → external sandbox
    ├── rust-playground   lib/runners/rust-playground.ts   public Rust Playground (play.rust-lang.org)
    ├── go-playground     lib/runners/go-playground.ts     official Go Playground (go.dev/_/compile)
    ├── godbolt-cpp       lib/runners/godbolt.ts           Compiler Explorer, g++ 14, -std=c++20 -O1
    └── godbolt-csharp    lib/runners/godbolt.ts           Compiler Explorer, .NET 10 (CoreCLR)
```

Browser runner ids are listed in `BROWSER_RUNNER_IDS` (`lib/runners/ids.ts`).

**Server runners.** `POST /api/run` applies the guards described in [security.md](security.md) (rate limits, global quota, concurrency caps, result cache) and picks the language's runner (`lib/runners/index.ts`). Every server runner sends only the player's snippet to its sandbox and nothing else. The Go, C++ and C# runners share `postJson` in `lib/runners/http.ts`: a POST with a timeout (15 s by default, 20 s for Compiler Explorer), no redirects, a fixed `User-Agent`, a 1 MB response cap and JSON parsing; any failure (network, non-2xx, oversized or malformed body, unexpected shape) becomes `available: false` with no upstream details. The Rust runner applies the same rules inline. Each runner cleans its output so it reads like a local build: cargo noise dropped (Rust), ANSI escape codes stripped, sandbox paths renamed to `prog.go`, `main.cpp` or `Program.cs`, and build-tool noise removed. With `BITWISE_RUNNER=off` no external call is made and the beat is validated with its `fallback` regex. When the API answers 429 or 503, `RunBeatView` shows "busy, retry in N s" without costing a heart.

**Browser runners (`js-browser`, `py-browser`).** JS/TS/TSX and Python run in the player's own browser; the server never receives or executes player code, and `getRunner` in `lib/repo.ts` returns `null` for browser runners, so `/api/run` answers 404 `unknown_language` for those packs.

- `lib/runners/js-core.ts` is shared by the worker and the content validator, so a snippet prints the same thing in both. It strips types and converts JSX (classic runtime) and `import`/`export` with sucrase (types are **not** checked at play time), runs the result in strict mode inside an async function (top-level `await` works), captures `console.log/info/debug` to stdout and `console.warn/error` to stderr formatted like Node's `util.inspect` for short values, tracks `setTimeout`/`setInterval` so the run ends when the program and its pending timers finish (pending timers after 2.5 s fail the run), resolves `import` only for the modules it is given, caps output at 8,000 characters and reports errors as `Name: message` text.
- `lib/runners/js-worker.ts` is the JS Web Worker: it receives `{ code, jsx }`, provides `react` and `react-dom/server`, and imports `three` lazily only when the snippet imports it (the WebGL and three.js moons: math and scene graph, no GPU in the worker). It then calls `executeJs` and posts the result back. The validator loads `three` the same way.
- `lib/runners/py-core.ts` is shared by the Python worker and the validator (Pyodide in Node). It pins `PYODIDE_VERSION` (kept in sync with `package.json` by `tests/runners.test.ts`) and installs a small harness: fresh globals per run, the file is named `main.py` and registered in `linecache` so tracebacks show the player's lines, the harness frame is dropped from tracebacks, stdout/stderr are read as raw bytes so output without a final newline is not lost, `asyncio.run()` (and `asyncio.new_event_loop()`) use a small CPython event loop whose selector only sleeps until the next timer, so async code works without WebAssembly stack switching (which some browsers and Node 24 lack), and output is capped at 20,000 characters. A `SyntaxError` is reported with `phase: "compile"`, any other exception with `phase: "runtime"`.
- `lib/runners/py-worker.ts` is a long-lived module worker that loads `/pyodide/<version>/pyodide.mjs` from the game's own origin and answers `{ id, code }` messages.
- `lib/runners/browser.ts` (client only) creates a fresh JS worker for every run and terminates it when the result arrives or after a 3 s hard timeout (the only way to stop an infinite synchronous loop). For Python, loading CPython takes a few seconds, so `warmPython()` starts one worker when a Python exercise opens and `runPythonInBrowser` reuses it; its 5 s limit starts once the interpreter is ready, and a stuck worker is terminated and recreated for the next run. Both answer `available: false` if the worker cannot be created or the runtime cannot load, so the beat falls back to its `fallback` regex.

**Python runtime assets.** Pyodide (CPython 3.14 compiled to WebAssembly) is self-hosted, with no third-party CDN. `scripts/copy-pyodide.mjs` runs on `postinstall`, `predev` and `prebuild` and copies five files (`pyodide.mjs`, `pyodide.asm.mjs`, `pyodide.asm.wasm`, `python_stdlib.zip`, `pyodide-lock.json`) from `node_modules/pyodide` to the gitignored `public/pyodide/<version>/`. `next.config.ts` serves `/pyodide/*` with `Cache-Control: public, max-age=31536000, immutable` (the path is versioned), and the `proxy.ts` matcher excludes `pyodide/`, so those static files skip the page rate limit and the per-request CSP. Limitations of Python in the browser: no threads, no network and no `input()`.

**Results.** Every runner sets `RunResult.phase` (`"compile"` or `"runtime"`, `lib/runners/types.ts`) when a run fails. `RunBeatView` turns the runner answer into one of: correct (`stdout` contains `expect`), wrong output, "the compiler complains" (`phase: "compile"`; without a phase, a JS `SyntaxError`), "it crashed while running" (`phase: "runtime"`: a panic, an exception, a timeout or timers still pending; `run.runtimeError`), offline pass/fail with `fallback`, or busy (server runners only).

## Checklist when changing the architecture

- [ ] Engine stays language-agnostic: nothing language-specific in `components/` or `lib/` (except `lib/runners/` and grammars in `lib/syntax.ts`).
- [ ] Player code never runs in the server process: server runners forward it to an external sandbox, browser runners keep it in a Web Worker.
- [ ] The server stays stateless with respect to players; progress logic stays pure in `lib/save/progress.ts`.
- [ ] Save shape changes follow the checklist in [save-system.md](save-system.md#changing-the-save-format).
- [ ] New UI strings added to all dictionaries in `lib/i18n/messages.ts`.
- [ ] No database or disk writes on the server; content comes from `LANGUAGE_PACKS` via `lib/repo.ts`.
- [ ] New endpoints follow the rules in [security.md](security.md#adding-an-endpoint).
- [ ] `npm test && npm run typecheck && npm run build` pass.
