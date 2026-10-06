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
4. One existing region file of the same language as a style reference, e.g. `content/rust/regions/ownership-forest.ts`. For TS/TSX packs (`content/typescript`, `content/react`, `content/webgl`, `content/threejs`), also `docs/research/typescript-react-curriculum.md` (or `webgl-threejs-curriculum.md`) and the "TS and TSX packs" and "Writing snippets for the JS runner" sections of `docs/content-model.md`. For Go, C++, C#, Zig, Haskell and Python packs, the "Go, C++, C#, Zig, Haskell and Python packs" section of `docs/content-model.md` and `docs/research/<lang>-curriculum.md`.
5. `content/<lang>/index.ts` and `content/<lang>/topics.ts`.

## Steps
1. Decide what the player must learn and list prerequisites already taught in earlier regions. Never test something not shown before.
2. Write each lesson with the arc: dialog hook → `act` demonstration with in-world effects → pick/predict practice with `setup`/`win` → type/order → `run` with `starter`, `solution`, `expect`, `fallback`.
3. Localize as you write: every prose field is `L(en, es, ja)` (dialog text, prompts, step labels, `error.plain`, `explain`, `hint`, `say`/`banner`, lesson `title`/`enemyName`, region `name`/`subtitle`). Write English first, then neutral Latin American Spanish, then natural beginner-friendly Japanese. Options are plain strings for code tokens and `L(...)` for prose. Code uses English identifiers for every locale; `error.compiler` is the real compiler or runtime message (rustc, tsc, a JS error, Go, g++, the C# compiler, a Python traceback), untranslated.
4. Slugs are English kebab-case and unique within the language. New region: file `content/<lang>/regions/<slug>.ts` exporting a `RegionDef` (3 lessons + final `mode: "boss"` lesson), imported with a `.ts` extension in `content/<lang>/index.ts` in learning order (replace any `status: "soon"` placeholder). Link it from `topics.ts` (`region: "<slug>"`) if it teaches an exam topic.
5. Every pick/predict/type whose answer depends on the compiler gets `check: { compiles, stdout? }` (or `check.program` with a full program; `wrongFail: true` on picks whose distractors must not compile).
   For TS/TSX packs: snippets are module bodies (no `main`); `compiles` means "type-checks under `tsc --strict`"; `stdout` is the exact output of the game's runner (Node-like formatting); use `throws: "TypeError"` (etc.) when the answer is a runtime crash. TSX snippets start with `import React from "react"` and render with `renderToStaticMarkup` from `react-dom/server`. Do not rely on `process`/`process.nextTick`, `document`/`window`, effects or event handlers running, top-level `this` or sloppy-mode behavior.
   For Go, C++, C#, Zig, Haskell and Python packs: short snippets are completed by `scripts/snippet-wrap.ts` (Go `package main`/imports/`func main`, C++ headers/`int main`, C# `using`s, Zig `std` import/`pub fn main() !void`, Haskell `main = do`; Python as is), but `run` beats are full programs. `compiles` means it compiles (no `SyntaxError` in Python); use `throws` for panics and exceptions; outputs must be deterministic; never claim the output of C++ undefined behavior; Zig prints with `std.debug.print` (stderr, counted as output before a panic); Python has no threads, network or `input()`.
6. Respect budgets (en/es; Japanese ~65%): dialog 140, question prompt 60, act/run prompt 70, explain 160, error.plain 120, label 16, `say`/`banner` 22.
7. Do not rename existing slugs unless asked: saves are keyed by slug, so renaming makes players lose that lesson's progress.
8. `enemy` is a sprite id: prefer the planet's own bugs (`planet.bugs`, e.g. `"rust/mite"`).

## Verify (do not skip)
Use the `verify-content` playbook: `npm run content:check -- --only=<region-slug>`, `npm run content:verify -- --lang=<lang> --only=<region-slug>` (for TS/TSX this type-checks with `tsc --strict` and runs every claim locally, e.g. `npm run content:verify -- --lang=react --only=state-forest`; Python runs locally in Pyodide; Go, C++, C#, Zig and Haskell run on the game's sandboxes with a cache in `.snippets/`), `npm run typecheck`, and a playtest of at least one new lesson (also with `--locale=ja`). Fix until 0 errors and no warnings in your files. Report what each lesson teaches.
