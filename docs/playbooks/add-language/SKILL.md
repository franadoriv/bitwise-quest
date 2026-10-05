---
name: add-language
description: Add a new programming language (planet) to Bitwise Quest, such as Go, Zig or Haskell, including its planet, guide, bugs and sprites, regions, topics, exams, syntax highlighting and optional code runner, with all content localized in English, Spanish and Japanese.
---

# Add a programming language

For a new human language (UI/content locale), follow `docs/i18n.md` instead.

## Read first
`docs/adding-a-language.md`, `docs/architecture.md`, `docs/content-model.md` (Planet and Sprites sections), `docs/i18n.md`, and the whole `content/rust/` folder as the reference implementation (planet in `index.ts`, sprites in `sprites.ts`).

## Steps
1. Design the planet: name, two-to-three-sentence story, a guide (name, one-line title, personality) and 3–4 bugs based on the language's classic mistakes, ordered weakest to strongest. The guide and bugs must be **original designs inspired by the language**, never copies of official mascots, logos or existing characters. If `content/<slug>/planet.ts` already exists as a "soon" placeholder, start from it.
2. Draw the sprites in `content/<slug>/sprites.ts`: 16×16 grids, legend `.` `0`–`3` `r` `y` `b` `s` `w` `g` `p` `c`, ids namespaced `<slug>/<name>`. Register them in `content/sprites.ts`.
3. Design the region map: 4–6 regions ordered from concrete to abstract, each a concept that is hard for people coming from other languages. Write it down before coding. Pick English kebab-case slugs.
4. Create `content/<slug>/` mirroring `content/rust/` (`index.ts` with `planet`, `helpers.ts`, `topics.ts`, `exams.ts`, `regions/<region-slug>.ts`). Use `.ts` extensions in relative imports. Every prose field (pack `tagline`, planet `name`/`story`, guide `name`/`title`, region names, topic names, exam titles...) is `L(en, es, ja)`. Planet budgets: name 20, story 260, guide name 14, guide title 40.
5. Register it in `content/index.ts`, replacing the `soon(...)` placeholder.
6. Add a grammar to `GRAMMARS` in `lib/syntax.ts`.
7. Runner, if `run` beats or `check` are needed: implement `LanguageRunner` in `lib/runners/<id>.ts`, register it in `lib/runners/index.ts`, and teach `scripts/validate-content.ts` to call it for `pack.runner` (plus the right program wrapper in `buildProgram`). Prefer an official public playground or a local toolchain; mention any external service to the user.
8. Build the first region with the `add-lessons` playbook (lesson `enemy` = the planet's bugs; `speaker: "master"` dialogs in the guide's voice) and the exam banks with the `add-exam-questions` playbook.

Do not touch `lib/save/`: saves are keyed by slug, so a new language needs no save change.

## Verify
`verify-content` playbook (the validator also checks sprites, guide/bug references and planet budgets), then `npm test` and `npm run build`. Confirm the planet is active in the galaxy (`/galaxy`) in all three locales and that landing shows the guide's intro.
