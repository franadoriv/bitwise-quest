# Contributing to Bitwise Quest

Thanks for wanting to help! The most common contribution is content: lessons, regions, exam questions, new programming languages (each one a planet with its own guide and bugs) or frameworks of a language (each one a moon of its planet, like React for TypeScript/JavaScript). Content is pure data, so you almost never need to touch the engine.

## Before you start

1. Read [`docs/README.md`](docs/README.md) and the guide for your task:
   - Lessons and regions: [`docs/authoring-lessons.md`](docs/authoring-lessons.md)
   - New programming languages (planets) and frameworks (moons): [`docs/adding-a-language.md`](docs/adding-a-language.md)
   - The save system (memory card): [`docs/save-system.md`](docs/save-system.md)
   - Exam questions: [`docs/exams.md`](docs/exams.md)
   - Translations and UI languages: [`docs/i18n.md`](docs/i18n.md)
   - API routes and backend abuse protection: [`docs/security.md`](docs/security.md)
2. Use Node 22.18 or newer (`nvm use`).

## Branches

| Branch | Role | How changes get in |
| --- | --- | --- |
| `develop` | Default branch. All day-to-day work lands here | Direct pushes or PRs from feature branches |
| `release` | What is published | **Only by pull request from `develop`**. The branch is protected: CI (`check`) must pass, conversations must be resolved, no force pushes, no deletion, rules apply to admins too |

There is no `main` branch.

## Workflow

1. Work on `develop`, or create a branch from it: `feat/<topic>`, `fix/<topic>` or `content/<topic>`.
2. Make your changes and verify:
   ```bash
   npm run content:check
   npm run content:verify -- --lang=rust      # compiles every claim against the real compiler
   npm run content:verify -- --lang=react     # TS/TSX packs: tsc --strict + the JS runner, offline
   npm run content:verify -- --lang=python    # Python: Pyodide in Node, offline
   npm run content:verify -- --lang=go        # Go, C++ (cpp), C# (csharp), Zig, Haskell, Ruby (ruby, rails): the game's sandboxes, cached in .snippets/
   npm run typecheck
   npm test                                   # save, security, JS runner, runners and music unit tests
   npm run playtest -- /play/rust/lesson/<slug> --locale=en   # with npm run dev running
   ```
3. Write commits with [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `content:`, `docs:`, `refactor:`, `chore:`.
4. Push to `develop` (or open a pull request into `develop`) explaining what the change teaches or fixes, with screenshots if it affects the UI.
5. To publish, open a pull request from `develop` into `release` and merge it once CI is green.

## Content rules

- Never ask about something the game has not taught yet.
- Every claim about the compiler has a `check`, and every `run` beat has a `solution`.
- Every lesson has `notes` (the guidebook: concept → example → rule → why → common mistakes, with examples that use names and values different from the questions) and every question has a `hint` that nudges without giving the answer away. Never insert, remove or reorder beats in an existing lesson: saved reviews point at questions by beat index. See [`docs/authoring-lessons.md`](docs/authoring-lessons.md#notes-and-hints).
- TS/TSX content must type-check under `tsc --strict` where it claims to, and its output must come from the game's runner (`npm run content:verify`). Avoid Node-only globals, the DOM at runtime and anything that depends on effects running in a static React render.
- Go, C++, C#, Zig, Haskell, Ruby and Python content is verified on the same runners the game uses; outputs must be deterministic (no hash-map iteration order, timing, object addresses or C++ undefined behavior), Python lessons cannot use threads, the network or `input()`, and Ruby has only the standard library (no gems). See [`docs/content-model.md`](docs/content-model.md#go-c-c-zig-haskell-ruby-and-python-packs).
- Frameworks no sandbox can run, such as Rails, are taught with small plain-language versions of their mechanisms (verified with `check`) plus conceptual questions without `check`, explained from the framework's official guides. See [`docs/adding-a-language.md`](docs/adding-a-language.md#a-framework-without-a-sandbox).
- **Every piece of prose is localized** with `L(en, es, ja)`. English is the primary language; write it first, then Spanish and Japanese. Code, compiler output and program output are never translated. See [`docs/i18n.md`](docs/i18n.md).
- Keep text short: dialogs under 140 characters, `say`/`banner` bubbles at most 22 (Japanese gets about 65% of each budget). `npm run content:check` reports anything over budget.
- UI strings go in `lib/i18n/messages.ts`, never hard-coded in components.
- New guides and bugs are original designs inspired by the language, never copies of official mascots or logos.

## Save system rules

- Progress lives on the client; the server only serves content. There is no database; never add one, nor player data in the API.
- Any change to the save shape bumps `SAVE_VERSION`, adds a migration and a fixture test. See [`docs/save-system.md`](docs/save-system.md#changing-the-save-format).

## Security rules

- Every API endpoint uses the guards in `lib/security/`: origin check, per-client rate limit, `readJson` with a byte cap, strict validation with `onlyKeys`, and `errorResponse` with stable error codes. See [`docs/security.md`](docs/security.md#adding-an-endpoint).
- Quotas live only in `LIMITS` (`lib/security/policies.ts`); update the table in `docs/security.md` when you change one.
- Never log player code, IP addresses or request bodies, and never return internal error details.
- Never execute player code on the server. Use an external sandbox behind `/api/run` (Rust Playground, Go Playground, Compiler Explorer for C++, C#, Zig, Haskell and Ruby) or a browser runner in a Web Worker (JS/TS, Python with self-hosted Pyodide); see [`docs/security.md`](docs/security.md#player-code-execution).

## Checklist for a pull request

- [ ] `npm run content:check` reports 0 errors and no warnings in files you touched.
- [ ] `npm run content:verify -- --lang=<lang>` reports 0 errors (content changes).
- [ ] `npm run typecheck` and `npm test` pass (and `npm run build` for engine/UI changes).
- [ ] Save system or memory card changes: `npm run e2e` passes with the dev server running.
- [ ] New text exists in English, Spanish and Japanese.
- [ ] New or changed lessons have `notes`, and every question has a `hint` (and a `note` id when the lesson has several notes); no existing beat was inserted, removed or reordered.
- [ ] API, `proxy.ts` or `lib/security/` changes: every endpoint uses the guards, limits are in `policies.ts`, `tests/security.test.ts` covers new guards and the manual probes in `docs/security.md` give the expected statuses.
- [ ] Playtested at least one affected lesson or exam, ideally in more than one locale.
