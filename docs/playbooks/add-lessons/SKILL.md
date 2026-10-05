---
name: add-lessons
description: Add or extend lessons or whole regions in a Bitwise Quest language pack (content/<lang>/regions), fully localized in English, Spanish and Japanese. Use when asked to create new levels, exercises, lessons, regions, or bosses for a language that already exists.
---

# Add lessons or regions

Bitwise Quest content is pure data; the engine needs no changes for new lessons. Every prose string must exist in English, Spanish and Japanese.

## Read first
1. `docs/authoring-lessons.md` (pedagogy, pacing, budgets, checklist) and `docs/content-model.md` (beat kinds, effects, `check`, `Text`).
2. `docs/i18n.md` (translation guidelines and terminology).
3. `lib/content/types.ts` (source of truth for the schema).
4. One existing region file of the same language as a style reference, e.g. `content/rust/regions/ownership-forest.ts`.
5. `content/<lang>/index.ts` and `content/<lang>/topics.ts`.

## Steps
1. Decide what the player must learn and list prerequisites already taught in earlier regions. Never test something not shown before.
2. Write each lesson with the arc: dialog hook → `act` demonstration with in-world effects → pick/predict practice with `setup`/`win` → type/order → `run` with `starter`, `solution`, `expect`, `fallback`.
3. Localize as you write: every prose field is `L(en, es, ja)` (dialog text, prompts, step labels, `error.plain`, `explain`, `hint`, `say`/`banner`, lesson `title`/`enemyName`, region `name`/`subtitle`). Write English first, then neutral Latin American Spanish, then natural beginner-friendly Japanese. Options are plain strings for code tokens and `L(...)` for prose. Code uses English identifiers for every locale; `error.compiler` is the real rustc message, untranslated.
4. Slugs are English kebab-case and unique within the language. New region: file `content/<lang>/regions/<slug>.ts` exporting a `RegionDef` (3 lessons + final `mode: "boss"` lesson), imported with a `.ts` extension in `content/<lang>/index.ts` in learning order (replace any `status: "soon"` placeholder). Link it from `topics.ts` (`region: "<slug>"`) if it teaches an exam topic.
5. Every pick/predict/type whose answer depends on the compiler gets `check: { compiles, stdout? }` (or `check.program` with a full program; `wrongFail: true` on picks whose distractors must not compile).
6. Respect budgets (en/es; Japanese ~65%): dialog 140, question prompt 60, act/run prompt 70, explain 160, error.plain 120, label 16, `say`/`banner` 22.
7. Do not rename existing slugs unless asked: saves are keyed by slug, so renaming makes players lose that lesson's progress.
8. `enemy` is a sprite id: prefer the planet's own bugs (`planet.bugs`, e.g. `"rust/mite"`).

## Verify (do not skip)
Use the `verify-content` playbook: `npm run content:check -- --only=<region-slug>`, `npm run content:verify -- --lang=<lang> --only=<region-slug>`, `npm run typecheck`, and a playtest of at least one new lesson (also with `--locale=ja`). Fix until 0 errors and no warnings in your files. Report what each lesson teaches.
