---
name: add-exam-questions
description: Create or extend the entry-exam ("prueba de ingreso") question banks for a Bit Forge language at junior, mid or senior level, based on what companies actually assess when hiring for that language.
---

# Add exam questions

## Read first
`docs/exams.md`, `lib/content/types.ts` (`ExamDef`, `ExamQuestion`, `TopicDef`, `SnippetCheck`), `content/<lang>/exams.ts`, `content/<lang>/topics.ts`, and any research in `docs/research/` for that language.

## Steps
1. If there is no research file for the language, research real hiring assessments (skill tests, interview question collections, job postings) per level and save the synthesis with sources to `docs/research/<lang>-hiring-assessments.md`.
2. Add questions to the right `ExamDef` bank. Each has `topic` (an id from `topics.ts`; add new topic ids there if needed, keep existing ones and their `region` links), `difficulty` 1–3, kind pick/predict/type/order, a short prompt, ≤ 12 lines of code, and an `explain` that teaches why.
3. Keep each bank ≥ 1.6 × `count` and balanced across the level's topics.
4. Add `check` to every question that depends on compiler/runtime behavior. Avoid panicking programs in checks (they read as compile failures).

## Verify
`npm run content:verify -- --lang=<lang>` with 0 errors, then `npm run playtest -- /play/<lang>/exam/<slug> --mistakes=3` with the dev server running.
