---
name: add-language
description: Add a new programming language (planet) to Bitwise Quest, such as Elixir, including its planet, guide, bugs and sprites, regions, topics, exams, syntax highlighting and optional code runner, with all content localized in English, Spanish and Japanese.
---

# Add a programming language

For a new human language (UI/content locale), follow `docs/i18n.md` instead.

**Planet or moon?** A programming language is a planet (this playbook). A framework or library of a language that already has a planet (React, WebGL or three.js for TypeScript/JavaScript, Babylon.js) is a moon: use the `add-moon` playbook instead.

## Read first
`docs/adding-a-language.md` (including "Choosing a runner"), `docs/architecture.md` (Code execution), `docs/content-model.md` (pack fields, `codeLang`, Planet and Sprites sections), `docs/i18n.md`, `docs/security.md` (Player code execution), and the whole `content/rust/` folder as the reference implementation (planet in `index.ts`, sprites in `sprites.ts`). `content/typescript/` (JS) and `content/python/` (Pyodide) are the references for planets with a browser runner; `content/go/`, `content/cpp/`, `content/csharp/`, `content/zig/` and `content/haskell/` for the other server runners (`lib/runners/godbolt.ts` shows the optional `Split` hook Zig uses to treat `std.debug.print` output on stderr as program output).

## Steps
1. Design the planet: name, two-to-three-sentence story, a guide (name, one-line title, personality) and 3–4 bugs based on the language's classic mistakes, ordered weakest to strongest. The guide and bugs must be **original designs inspired by the language**, never copies of official mascots, logos or existing characters. If `content/<slug>/planet.ts` already exists as a "soon" placeholder, start from it.
2. Draw the sprites in `content/<slug>/sprites.ts`: 16×16 grids, legend `.` `0`–`3` `r` `y` `b` `s` `w` `g` `p` `c`, ids namespaced `<slug>/<name>`. Register them in `content/sprites.ts`.
3. Design the region map: 4–6 regions ordered from concrete to abstract, each a concept that is hard for people coming from other languages. Write it down before coding. Pick English kebab-case slugs.
4. Create `content/<slug>/` mirroring `content/rust/` (`index.ts` with `planet`, `helpers.ts`, `topics.ts`, `exams.ts`, `regions/<region-slug>.ts`). Use `.ts` extensions in relative imports. Every prose field (pack `tagline`, planet `name`/`story`, guide `name`/`title`, region names, topic names, exam titles...) is `L(en, es, ja)`. Planet budgets: name 20, story 260, guide name 14, guide title 40.
5. Register it in `content/index.ts` (replacing its `soon(...)` placeholder, if it had one).
6. Set `codeLang` on the pack (existing values: `rust`, `ts`, `tsx`, `go`, `python`, `cpp`, `csharp`, `zig`, `haskell`). For a new value, add it to `CodeLang` in `lib/content/types.ts`, add a grammar to `GRAMMARS` (and usually a lexer to `LEXERS`) in `lib/syntax.ts` keyed by that value plus a case in the highlighter test in `tests/runners.test.ts`, and remember that `codeLangOf` in `lib/repo.ts` and `scripts/validate-content.ts` defaults an unset `codeLang` to `"ts"`.
7. Runner, if `run` beats or `check` are needed. Reuse an existing one when it fits (`rust-playground`, `go-playground`, `godbolt-cpp`, `godbolt-csharp`, `godbolt-zig`, `godbolt-haskell`, `js-browser`, `py-browser`); otherwise choose the kind (see `docs/adding-a-language.md#choosing-a-runner`):
   - **Server runner** (compiled languages with a public sandbox): implement `LanguageRunner` in `lib/runners/<id>.ts` using `postJson` from `lib/runners/http.ts` (timeout, no redirects, response cap, unavailable on failure), check the reply shape, set `phase` (`compile`/`runtime`), clean the output (ANSI, sandbox paths), and register it in `lib/runners/index.ts`. Add the language to `REMOTE` and `VERIFIABLE_LANGS` in `scripts/remote-run.ts` and a snippet wrapper case in `scripts/snippet-wrap.ts` (with a test). Prefer an official public sandbox; document what is sent in `docs/security.md` and mention any external service to the user.
   - **Browser runner** (languages that run in a browser, e.g. `js-browser`, `py-browser`): a shared core, a Web Worker and a client entry in `lib/runners/browser.ts` with a hard timeout, the id added to `BROWSER_RUNNER_IDS` in `lib/runners/ids.ts`, the same core called from the validator, self-hosted runtime assets (no CDN, like `scripts/copy-pyodide.mjs`), and tests.
   - Never execute player code in the server process.
8. Build the first region with the `add-lessons` playbook (lesson `enemy` = the planet's bugs; `speaker: "master"` dialogs in the guide's voice) and the exam banks with the `add-exam-questions` playbook.

Do not touch `lib/save/`: saves are keyed by slug, so a new language needs no save change.

## Verify
`verify-content` playbook (the validator also checks sprites, guide/bug references and planet budgets), then `npm test` and `npm run build`. For a new runner, also playtest a `run` beat: a correct fix, a wrong output, a crash and an infinite loop (browser runners must stop it after the timeout; server runners must report it as a runtime failure or time out without leaking upstream details). Confirm the planet is active in the galaxy (`/galaxy`) in all three locales and that landing shows the guide's intro.
