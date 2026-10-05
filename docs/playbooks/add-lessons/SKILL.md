---
name: add-lessons
description: Add or extend lessons or whole regions in a Bit Forge language pack (content/<lang>/regions). Use when asked to create new levels, exercises, lessons, regions, or bosses for a language that already exists.
---

# Add lessons or regions

Bit Forge content is pure data; the engine needs no changes for new lessons.

## Read first
1. `docs/authoring-lessons.md` (pedagogy, pacing, checklist) and `docs/content-model.md` (beat kinds, effects, `check`).
2. `lib/content/types.ts` (source of truth for the schema).
3. One existing region file of the same language as a style reference, e.g. `content/rust/regions/bosque-ownership.ts`.
4. `content/<lang>/index.ts` and `content/<lang>/topics.ts`.

## Steps
1. Decide what the player must learn and list prerequisites already taught in earlier regions. Never test something not shown before.
2. Write each lesson with the arc: dialog hook → `act` demonstration with in-world effects → pick/predict practice with `setup`/`win` → type/order → `run` with `starter`, `solution`, `expect`, `fallback`.
3. New region: new file `content/<lang>/regions/<slug>.ts` exporting a `RegionDef` (3 lessons + final `mode: "boss"` lesson), imported with a `.ts` extension in `content/<lang>/index.ts` in learning order (replace any `status: "soon"` placeholder). Link it from `topics.ts` (`region: "<slug>"`) if it teaches an exam topic.
4. Every pick/predict/type whose answer depends on the compiler gets `check: { compiles, stdout? }` (or `check.program` with a full program).
5. Texts in the language of existing content (Spanish today): dialog < 140 chars, `say` ≤ 22 chars, lesson slugs unique per language.

## Verify (do not skip)
Use the `verify-content` skill: `npm run content:check`, `npm run content:verify -- --lang=<lang>`, `npm run typecheck`, and a playtest of at least one new lesson. Fix until 0 errors. Report what each lesson teaches.
