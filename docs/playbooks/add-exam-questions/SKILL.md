---
name: add-exam-questions
description: Create or extend the entry-exam question banks for a Bitwise Quest language at junior, mid or senior level, based on what companies actually assess when hiring for that language, localized in English, Spanish and Japanese.
---

# Add exam questions

## Read first
`docs/exams.md`, `docs/i18n.md`, `lib/content/types.ts` (`ExamDef`, `ExamQuestion`, `TopicDef`, `SnippetCheck`), `content/<lang>/exams.ts`, `content/<lang>/topics.ts`, and any research in `docs/research/` for that language.

## Steps
1. If there is no research file for the language, research real hiring assessments (skill tests, interview question collections, job postings) per level and save the synthesis with sources to `docs/research/<lang>-hiring-assessments.md`.
2. Add questions to the right `ExamDef` bank. Each has `topic` (an id from `topics.ts`; add new topic ids there with a localized `name` if needed, keep existing ones and their `region` links), `difficulty` 1–3, kind pick/predict/type/order, a short prompt (budget 60), ≤ 12 lines of code, and an `explain` that teaches why (budget 160).
3. Localize every prose field with `L(en, es, ja)`: prompt, explain, prose options. Code-token options stay plain strings; code uses English identifiers for every locale.
4. Keep each bank ≥ 1.6 × `count` and balanced across the level's topics.
5. Add `check` to every question that depends on compiler/runtime behavior. In Rust, avoid panicking programs in checks (they read as compile failures). In every other language (TS/TSX, Go, C++, C#, Zig, Haskell, Ruby, Python), prove a crash with `check.throws: "<error text>"`. Outputs must be deterministic (no hash-map/set iteration order, timing, object addresses or C++ undefined behavior). For a moon whose framework no sandbox can run (Rails), framework API questions have no `check` and the `explain` follows the official guides; mechanism questions use the moon's hidden helpers (`content/rails/mini.ts`) in `check.program`.

## Verify
`npm run content:verify -- --lang=<lang> --only=exam:` with 0 errors, then `npm run playtest -- /play/<lang>/exam/<slug> --mistakes=3` with the dev server running (repeat with `--locale=ja`).
