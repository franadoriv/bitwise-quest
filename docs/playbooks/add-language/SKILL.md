---
name: add-language
description: Add a new programming language (planet) to Bitwise Quest, such as Go, Zig or Haskell, including its planet, guide, bugs and sprites, regions, topics, exams, syntax highlighting and optional code runner, with all content localized in English, Spanish and Japanese.
---

# Add a programming language

For a new human language (UI/content locale), follow `docs/i18n.md` instead.

**Planet or moon?** A programming language is a planet (this playbook). A framework or library of a language that already has a planet (React for TypeScript/JavaScript, three.js, Babylon.js, WebGL) is a moon: use the `add-moon` playbook instead.

## Read first
`docs/adding-a-language.md` (including "Choosing a runner"), `docs/architecture.md` (Code execution), `docs/content-model.md` (pack fields, `codeLang`, Planet and Sprites sections), `docs/i18n.md`, `docs/security.md` (Player code execution), and the whole `content/rust/` folder as the reference implementation (planet in `index.ts`, sprites in `sprites.ts`). `content/typescript/` is the reference for a planet with a browser runner.

## Steps
1. Design the planet: name, two-to-three-sentence story, a guide (name, one-line title, personality) and 3–4 bugs based on the language's classic mistakes, ordered weakest to strongest. The guide and bugs must be **original designs inspired by the language**, never copies of official mascots, logos or existing characters. If `content/<slug>/planet.ts` already exists as a "soon" placeholder, start from it.
2. Draw the sprites in `content/<slug>/sprites.ts`: 16×16 grids, legend `.` `0`–`3` `r` `y` `b` `s` `w` `g` `p` `c`, ids namespaced `<slug>/<name>`. Register them in `content/sprites.ts`.
3. Design the region map: 4–6 regions ordered from concrete to abstract, each a concept that is hard for people coming from other languages. Write it down before coding. Pick English kebab-case slugs.
4. Create `content/<slug>/` mirroring `content/rust/` (`index.ts` with `planet`, `helpers.ts`, `topics.ts`, `exams.ts`, `regions/<region-slug>.ts`). Use `.ts` extensions in relative imports. Every prose field (pack `tagline`, planet `name`/`story`, guide `name`/`title`, region names, topic names, exam titles...) is `L(en, es, ja)`. Planet budgets: name 20, story 260, guide name 14, guide title 40.
5. Register it in `content/index.ts`, replacing the `soon(...)` placeholder.
6. Set `codeLang` on the pack. For a language other than `rust`/`ts`/`tsx`, add it to `CodeLang` in `lib/content/types.ts`, add a grammar to `GRAMMARS` in `lib/syntax.ts` keyed by that value, and handle it in `codeLangOf` in `lib/repo.ts` and `scripts/validate-content.ts` (both default an unset `codeLang` to `"ts"`).
7. Runner, if `run` beats or `check` are needed. Choose the kind (see `docs/adding-a-language.md#choosing-a-runner`):
   - **Server runner** (compiled languages, e.g. `rust-playground`): implement `LanguageRunner` in `lib/runners/<id>.ts` with a timeout, response cap and shape check, register it in `lib/runners/index.ts`, and teach `scripts/validate-content.ts` to call it (plus the right program wrapper in `buildProgram`). Prefer an official public sandbox; mention any external service to the user.
   - **Browser runner** (languages that run in a browser, e.g. `js-browser`): a shared core, a Web Worker and a client entry with a hard timeout, the id added to `BROWSER_RUNNER_IDS` in `lib/runners/ids.ts`, the same core called from the validator, and a `tests/<lang>-runner.test.ts`.
   - Never execute player code in the server process.
8. Build the first region with the `add-lessons` playbook (lesson `enemy` = the planet's bugs; `speaker: "master"` dialogs in the guide's voice) and the exam banks with the `add-exam-questions` playbook.

Do not touch `lib/save/`: saves are keyed by slug, so a new language needs no save change.

## Verify
`verify-content` playbook (the validator also checks sprites, guide/bug references and planet budgets), then `npm test` and `npm run build`. For a new runner, also playtest a `run` beat: a correct fix, a wrong output, a crash and an infinite loop (browser runners must stop it after the timeout). Confirm the planet is active in the galaxy (`/galaxy`) in all three locales and that landing shows the guide's intro.
