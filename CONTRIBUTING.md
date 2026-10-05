# Contributing to Bitwise Quest

Thanks for wanting to help! The most common contribution is content: lessons, regions, exam questions or new programming languages. Content is pure data, so you almost never need to touch the engine.

## Before you start

1. Read [`docs/README.md`](docs/README.md) and the guide for your task:
   - Lessons and regions: [`docs/authoring-lessons.md`](docs/authoring-lessons.md)
   - New programming languages: [`docs/adding-a-language.md`](docs/adding-a-language.md)
   - Exam questions: [`docs/exams.md`](docs/exams.md)
   - Translations and UI languages: [`docs/i18n.md`](docs/i18n.md)
2. Use Node 22.18 or newer (`nvm use`).

## Workflow

1. Create a branch from `main`: `feat/<topic>`, `fix/<topic>` or `content/<topic>`.
2. Make your changes and verify:
   ```bash
   npm run content:check
   npm run content:verify -- --lang=rust      # compiles every claim against the real compiler
   npm run typecheck
   npm run playtest -- /play/rust/lesson/<slug> --locale=en   # with npm run dev running
   ```
3. Write commits with [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `content:`, `docs:`, `refactor:`, `chore:`.
4. Open a pull request explaining what the change teaches or fixes, with screenshots if it affects the UI.

## Content rules

- Never ask about something the game has not taught yet.
- Every claim about the compiler has a `check`, and every `run` beat has a `solution`.
- **Every piece of prose is localized** with `L(en, es, ja)`. English is the primary language; write it first, then Spanish and Japanese. Code, compiler output and program output are never translated. See [`docs/i18n.md`](docs/i18n.md).
- Keep text short: dialogs under 140 characters, `say`/`banner` bubbles at most 22 (Japanese gets about 65% of each budget). `npm run content:check` reports anything over budget.
- UI strings go in `lib/i18n/messages.ts`, never hard-coded in components.

## Checklist for a pull request

- [ ] `npm run content:check` reports 0 errors and no warnings in files you touched.
- [ ] `npm run content:verify -- --lang=<lang>` reports 0 errors (content changes).
- [ ] `npm run typecheck` passes (and `npm run build` for engine/UI changes).
- [ ] New text exists in English, Spanish and Japanese.
- [ ] Playtested at least one affected lesson or exam, ideally in more than one locale.
