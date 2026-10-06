---
name: verify-content
description: Verify Bitwise Quest content and UI changes end to end - structural and translation validation, real-compiler verification of every claim, typecheck, and a headless playtest with screenshots in each locale. Use after any change to content/ or the game engine.
---

# Verify content

Run in order and fix until everything is clean:

1. `npm run content:check` → 0 errors. Missing translations (`must be localized { en, es, ja }`, `.ja is empty`) are errors. Warnings in files you touched (over-budget text, `run` without `solution`) must be fixed too. Scope with `-- --only=<region-slug>` or `-- --only=exam:`.
2. `npm run content:verify -- --lang=<lang>` → 0 errors. This compiles every `check`, every run `solution` (must print `expect`) and every `starter` (must NOT already print `expect`) on the language runner. `--only=` works here too. `<lang>` is any pack slug, planet or moon.
   - Rust: snippets run on the public Rust Playground (network needed; unreachable snippets become warnings).
   - Go, C++, C#, Zig, Haskell (`--lang=go`, `--lang=cpp`, `--lang=csharp`, `--lang=zig`, `--lang=haskell`): snippets are completed by `scripts/snippet-wrap.ts` and run on the game's own runners (Go Playground, Compiler Explorer) through `scripts/remote-run.ts`. Results are cached in `.snippets/cache-<lang>.json`, so re-runs only send new or changed programs; unreachable snippets become warnings.
   - Python (`--lang=python`): runs offline in Pyodide loaded inside Node, with the same harness as the game (`lib/runners/py-core.ts`).
   - TS/TSX (`--lang=typescript`, `--lang=react`, `--lang=webgl`, `--lang=threejs`): runs offline. Every snippet is type-checked in one batch with `tsc --strict` (`scripts/ts-check.ts`, virtual `.snippets/` folder), then executed with the game's runner core (`lib/runners/js-core.ts`). Typical failures: `expected to type-check but failed: TS<code> ...`, `stdout "..." ≠ expected "..."`, `expected a runtime error containing ...`, and `ReferenceError: React is not defined` (TSX without `import React from "react"`). Verification runs in Node, the game in a browser worker: also reject snippets that use `process`, `document` or `window` even if they pass.
3. `npm run typecheck` (also catches UI dictionaries in `lib/i18n/messages.ts` missing a key).
4. Playtest: start `npm run dev` in the background if it isn't running, then `BASE_URL=http://localhost:3000 npm run playtest -- /play/<lang>/lesson/<slug> --mistakes=1`. Repeat with `--locale=es` and `--locale=ja` (`--out=.playtest/ja`) when text or layout changed. Look at the screenshots in `.playtest/` (dialog, act, questions, wrong-answer feedback, run, result) for overflow and untranslated text. The bot creates its own save in slot 1 with every earlier lesson already cleared (and due reviews for `/play/<lang>/review`), so any lesson is reachable, and it fails if the result was not persisted to the save. For TS/TSX `run` beats, also try code that throws and an infinite loop (`while (true) {}`): both must show "it crashed while running", and the loop must stop after about 3 s without freezing the page. For Python `run` beats the same applies with a 5 s limit (counted once Pyodide has loaded); for Rust, Go, C++, C#, Zig and Haskell, a compile error must show "the compiler complains" and a panic or exception "it crashed while running". If the save format or memory card changed, also run `npm test` and `npm run e2e`. If `lib/runners/` changed, run `npm test` (it includes `tests/js-runner.test.ts` and `tests/runners.test.ts`).
5. For engine/UI changes also run `npm run build`.

Report the command summaries and anything that looked wrong in the screenshots.
