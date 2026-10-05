---
name: verify-content
description: Verify Bitwise Quest content and UI changes end to end - structural and translation validation, real-compiler verification of every claim, typecheck, and a headless playtest with screenshots in each locale. Use after any change to content/ or the game engine.
---

# Verify content

Run in order and fix until everything is clean:

1. `npm run content:check` → 0 errors. Missing translations (`must be localized { en, es, ja }`, `.ja is empty`) are errors. Warnings in files you touched (over-budget text, `run` without `solution`) must be fixed too. Scope with `-- --only=<region-slug>` or `-- --only=exam:`.
2. `npm run content:verify -- --lang=<lang>` → 0 errors. This compiles every `check`, every run `solution` (must print `expect`) and every `starter` (must NOT already print `expect`) on the language runner. `--only=` works here too.
3. `npm run typecheck` (also catches UI dictionaries in `lib/i18n/messages.ts` missing a key).
4. Playtest: start `npm run dev` in the background if it isn't running, then `BASE_URL=http://localhost:3000 npm run playtest -- /play/<lang>/lesson/<slug> --mistakes=1`. Repeat with `--locale=es` and `--locale=ja` (`--out=.playtest/ja`) when text or layout changed. Look at the screenshots in `.playtest/` (dialog, act, questions, wrong-answer feedback, run, result) for overflow and untranslated text. Locked lessons redirect to the map: unlock them locally by completing earlier lessons via `POST /api/complete` in order, and run `npm run db:reset` afterwards.
5. For engine/UI changes also run `npm run build`.

Report the command summaries and anything that looked wrong in the screenshots.
