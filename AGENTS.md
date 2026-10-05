<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Bitwise Quest — guide for AI agents

A retro arcade game (Next.js 16 + Three.js + GSAP/SVG + Node's built-in SQLite) for learning programming languages by playing. Each language is a planet with its own guide, bugs and story; Rust (planet Oxide) is the first playable one. Player progress lives on the client in a 15-slot memory card; the server only serves content. The game is fully localized in English (primary), Spanish and Japanese.

## Before touching anything
- Read `docs/README.md`. Architecture is in `docs/architecture.md`, the save system in `docs/save-system.md`, the content schema in `lib/content/types.ts`, localization in `docs/i18n.md`.
- Project playbooks live in `docs/playbooks/`: `add-lessons`, `add-language`, `add-exam-questions` and `verify-content`.
- The brand lives in `lib/brand.ts` (`BRAND.name`, `BRAND.logo`, `BRAND.tagline`). Never hard-code the game's name.


## Branches
- Commit and push to `develop` (the default branch). There is no `main`.
- `release` is protected: changes reach it only through a pull request from `develop` with CI passing. Never push to it directly.

## Rules
- **Content is data.** Planets, sprites, lessons, regions, topics and exams live in `content/<lang>/`. Do not put language-specific logic in the engine (`components/`, `lib/`).
- **Planets.** Every pack has a `planet` (name, story, guide, colors, bugs). Pack sprites go in `content/<lang>/sprites.ts` with ids `<lang>/<name>` and are registered in `content/sprites.ts`. Guides and bugs are original designs inspired by the language, never copies of official mascots.
- **The server stays stateless.** `lib/db.ts` and `lib/repo.ts` hold and serve content only; never add player tables, progress endpoints or server-side saves.
- **Progress logic stays pure** in `lib/save/progress.ts`: functions take a save (plus the content they need) and return a new save, with no I/O. Components persist the result with `useSave().commit()`.
- **Never store content in saves**, only results keyed by stable slugs (language → lesson/review/exam). Unknown keys must be preserved.
- **Save format changes require a migration and a test:** bump `SAVE_VERSION` (`lib/save/schema.ts`), add the step to `MIGRATIONS` (`lib/save/migrate.ts`) and a fixture test in `tests/save.test.ts`. See `docs/save-system.md`.
- **Relative imports with a `.ts` extension in `content/`, `lib/content/`, `lib/i18n/` and `scripts/`.** Node runs those files directly (validator and playtest), without a bundler.
- **Every compiler claim has a `check`**, and every `run` beat has a `solution`. `npm run content:verify` must end with 0 errors.
- **Every prose field is `L(en, es, ja)`** (type `Text` in `lib/content/types.ts`). Plain strings are only for language-neutral code and identifiers. Code in exercises uses English identifiers in every locale; `error.compiler` is the real rustc message and is never translated. `npm run content:check` fails on any missing translation.
- **Text budgets** (latin script; Japanese gets ~65%): dialog 140, question prompt 60, act/run prompt 70, explain 160, error.plain 120, step label 16, `say`/`banner` 22; planet name 20, story 260, guide name 14, guide title 40.
- **UI strings** go in `lib/i18n/messages.ts`: add the key to `en` first, then to `es` and `ja` (TypeScript fails if one is missing). Components read them with `useI18n().t(key, vars)`; content text with `useI18n().tx(text)`.
- **Slugs are English** (regions such as `let-village`, `ownership-forest`; lessons such as `hello-let`) and stable. Saves are keyed by slug, so renaming or removing one makes players lose that lesson's progress (and `pruneRemoved` in `lib/db.ts` deletes the old content rows).
- **SQLite migrations are additive only**, in `migrate()` in `lib/db.ts` (content tables only).
- **UI sizes are px on the logical canvas** of 1280×720 (or 480 wide in portrait). `GameFrame` scales everything. Use `useOrientation()` to switch layouts.
- The Rust runner sends snippets to the public Rust Playground. `BITWISE_RUNNER=off` disables it. `BITWISE_DB` overrides the database path (default `data/bitwise.db`).
- Engine code and comments are in English.

## Minimum verification before finishing
`npm run content:check && npm test && npm run typecheck`. If you touched content, also `npm run content:verify` (scope with `--only=<region-slug>` or `--only=exam:`). If you touched UI, playtest (see `docs/testing.md`, try `--locale=ja` for layout overflow) and run `npm run build`. If you touched `lib/save/`, the memory card, the galaxy or the landing, also run `npm run e2e` with the dev server running.
