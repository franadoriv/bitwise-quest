---
name: add-moon
description: Add a framework moon (such as React, three.js, Babylon.js, WebGL, Rails, Django or Laravel) to an existing Bitwise Quest planet, as a language pack with parent set to the planet, including its moon, guide, bugs and sprites, regions, topics and exams, localized in English, Spanish and Japanese.
---

# Add a framework moon

A **moon** is a framework or library of a language that already has a planet: React (Reactia), WebGL (Shadera) and three.js (Scenara) orbit the TypeScript/JavaScript planet (Scriptara), and Ruby on Rails (Railhaven) orbits the Ruby planet (Rubion). It is a regular `LanguagePack` with `parent: "<planet slug>"`. For a new programming language, use the `add-language` playbook instead.

## Read first
`docs/adding-a-language.md` ("Planet or moon?" and "Choosing a runner"), `docs/content-model.md` (pack fields, "Planets and moons", `codeLang`, `check` for TS/TSX, "Writing snippets for the JS runner"), `docs/i18n.md`, and `content/react/` as the reference moon (`index.ts`, `planet.ts`, `sprites.ts`, `topics.ts`, `exams.ts`, `regions/`); `content/webgl/` and `content/threejs/` are `ts` moons that use the `three` module. For a framework no sandbox can run, read "A framework without a sandbox" in `docs/adding-a-language.md`, the Ruby bullet in the "Go, C++, C#, Zig, Haskell, Ruby and Python packs" section of `docs/content-model.md`, and `content/rails/` as the reference (`mini.ts` holds the hidden helpers; `docs/research/rails-curriculum.md` shows the plan). Read the parent planet's `content/<planet>/index.ts` too.

## Steps
1. **Check the parent.** It must be a planet (a pack without `parent`): moons cannot orbit moons. Note its slug, `runner` and `codeLang`.
2. **Research and plan.** If there is no research for the framework, write `docs/research/<moon>-hiring-assessments.md` (what companies assess, with sources) and a region plan (3–5 regions, concrete to abstract). Assume the player knows the planet's basics; say so in the first dialog. Decide which claims can be proven by the runner. Anything that needs a real GPU, a canvas, the DOM or user interaction can only be taught with `[Doc]`-style explanations, or by testing pure logic (math, scene-graph data, reducers) with `console.log`. If the framework itself cannot run on the planet's runner (Rails: gems and a database, while Compiler Explorer's Ruby has only the standard library), follow the Rails pattern: tag each planned question as verified on the runner, verified with a shared helper, or documentation-only.
3. **Design the moon.** A `PlanetDef` in `content/<moon>/planet.ts`: name (budget 20), story (260), an original guide (name 14, title 40) and 3–4 bugs from the framework's classic mistakes, weakest to strongest. `colors.accent` is the color of the moon orbiting its planet in the galaxy; `ring` and `moons` are not drawn for moons. Never copy official mascots or logos.
4. **Sprites.** `content/<moon>/sprites.ts` with 16×16 grids, ids `<moon>/<name>`, registered in `content/sprites.ts`.
5. **Pack.** `content/<moon>/index.ts` exporting a `LanguagePack` with its own `slug` (English kebab-case, unique), `parent: "<planet slug>"`, `codeLang` (`"tsx"` for React-style JSX, `"ts"` for plain TypeScript libraries, the planet's own value otherwise, e.g. `"ruby"` for Rails), `runner` (usually the planet's, e.g. `"js-browser"` or `"godbolt-ruby"`), `status: "soon"` until the content is complete, `planet`, `regions`, `topics`, `exams`. Use `.ts` extensions in relative imports and `L(en, es, ja)` for every prose field.
6. **Runtime modules.** The browser runner only resolves the modules the worker passes in (`react` and `react-dom/server` in `lib/runners/js-worker.ts`, plus `three`, imported lazily only for snippets that import it; mirrored in `verifyTs` in `scripts/validate-content.ts`). If the moon needs another library, add it to **both** module maps so the game and the validator agree (lazily, like `three`, if it is large), keep it free of DOM or GPU requirements at import time, add a case to `tests/js-runner.test.ts`, and mention the bundle size impact. Never run player code on the server.
7. **Framework without a sandbox (optional).** When the framework cannot run anywhere, teach it two ways, as Rails does: (a) **under the hood**, with tiny plain-language versions of its mechanisms that the runner can verify; mechanisms shared by many questions go in a hidden helper file (`content/rails/mini.ts`: `MINI_RECORD`, `MINI_CONTROLLER`) prepended to `check.program` with `withHelper(helper, code)`, introduced to the player in dialogs and never shown as their code; prose says "our mini version", never "Rails prints"; `run` beats are sent as written, so keep them self-contained; (b) **the real API**, as conceptual `pick`/`type` questions without `check`, each explained from the framework's official guides. Keep the helper small and deterministic (no default `#inspect` with addresses, no timing).
8. **Register** the pack in `content/index.ts` after its planet.
9. **Content.** Build regions with the `add-lessons` playbook and exams with `add-exam-questions`. Lesson `enemy` values are the moon's bugs; `speaker: "master"` dialogs are in the moon guide's voice.
10. **Go live.** Switch `status` to `"active"` only when every region verifies.

Saves need no change: the moon's progress is keyed by its own slug.

## Verify
1. `npm run content:check -- --lang=<moon>` → 0 errors (includes the parent check: `moon of unknown planet` or `moons cannot orbit other moons`).
2. `npm run content:verify -- --lang=<moon>` → 0 errors (TS/TSX: `tsc --strict` plus the runner, offline; Rails: the planet's `godbolt-ruby` runner with the helpers prepended, cached in `.snippets/`).
3. `npm test && npm run typecheck`.
4. With `npm run dev` running: `/galaxy` shows the moon orbiting its planet (dimmed while `soon`, in the accent color when active) and as a button in the planet card in every locale; landing goes to `/play/<moon>`; `npm run playtest -- /play/<moon>/lesson/<first-lesson>` (also `--locale=ja`) finishes and saves.
5. `npm run build`.
