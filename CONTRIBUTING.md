# Contributing to Bitwise Quest

Thanks for wanting to help! The most common contribution is content: lessons, regions, exam questions or new programming languages (each one a planet with its own guide and bugs). Content is pure data, so you almost never need to touch the engine.

## Before you start

1. Read [`docs/README.md`](docs/README.md) and the guide for your task:
   - Lessons and regions: [`docs/authoring-lessons.md`](docs/authoring-lessons.md)
   - New programming languages: [`docs/adding-a-language.md`](docs/adding-a-language.md)
   - The save system (memory card): [`docs/save-system.md`](docs/save-system.md)
   - Exam questions: [`docs/exams.md`](docs/exams.md)
   - Translations and UI languages: [`docs/i18n.md`](docs/i18n.md)
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
   npm run typecheck
   npm test                                   # save system unit tests
   npm run playtest -- /play/rust/lesson/<slug> --locale=en   # with npm run dev running
   ```
3. Write commits with [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `content:`, `docs:`, `refactor:`, `chore:`.
4. Push to `develop` (or open a pull request into `develop`) explaining what the change teaches or fixes, with screenshots if it affects the UI.
5. To publish, open a pull request from `develop` into `release` and merge it once CI is green.

## Content rules

- Never ask about something the game has not taught yet.
- Every claim about the compiler has a `check`, and every `run` beat has a `solution`.
- **Every piece of prose is localized** with `L(en, es, ja)`. English is the primary language; write it first, then Spanish and Japanese. Code, compiler output and program output are never translated. See [`docs/i18n.md`](docs/i18n.md).
- Keep text short: dialogs under 140 characters, `say`/`banner` bubbles at most 22 (Japanese gets about 65% of each budget). `npm run content:check` reports anything over budget.
- UI strings go in `lib/i18n/messages.ts`, never hard-coded in components.
- New guides and bugs are original designs inspired by the language, never copies of official mascots or logos.

## Save system rules

- Progress lives on the client; the server only serves content. Never add player data to the database or the API.
- Any change to the save shape bumps `SAVE_VERSION`, adds a migration and a fixture test. See [`docs/save-system.md`](docs/save-system.md#changing-the-save-format).

## Checklist for a pull request

- [ ] `npm run content:check` reports 0 errors and no warnings in files you touched.
- [ ] `npm run content:verify -- --lang=<lang>` reports 0 errors (content changes).
- [ ] `npm run typecheck` and `npm test` pass (and `npm run build` for engine/UI changes).
- [ ] Save system or memory card changes: `npm run e2e` passes with the dev server running.
- [ ] New text exists in English, Spanish and Japanese.
- [ ] Playtested at least one affected lesson or exam, ideally in more than one locale.
