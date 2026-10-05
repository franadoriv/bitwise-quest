---
name: verify-content
description: Verify Bit Forge content and UI changes end to end - structural validation, real-compiler verification of every claim, typecheck, and a headless playtest with screenshots. Use after any change to content/ or the game engine.
---

# Verify content

Run in order and fix until everything is clean:

1. `npm run content:check` → 0 errors. Warnings in files you touched must be fixed too.
2. `npm run content:verify -- --lang=<lang>` → 0 errors. This compiles every `check`, every run `solution` (must print `expect`) and every `starter` (must NOT already print `expect`) on the language runner.
3. `npm run typecheck`.
4. Playtest: start `npm run dev` in the background if it isn't running, then `BASE_URL=http://localhost:3000 npm run playtest -- /play/<lang>/lesson/<slug> --mistakes=1`. Look at the screenshots in `.playtest/` (dialog, act, questions, wrong-answer feedback, run, result). Locked lessons redirect to the map: unlock them locally by completing earlier lessons via `POST /api/complete` in order, and run `npm run db:reset` afterwards.
5. For engine/UI changes also run `npm run build`.

Report the command summaries and anything that looked wrong in the screenshots.
