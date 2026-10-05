# Adding a programming language

This guide is about adding a new **programming language** (a planet such as Go). To add a new **human language** for the UI and content (for example French), see [i18n.md](i18n.md#adding-a-locale).

Every language is a **planet** in the galaxy, with its own **guide** (a mascot that teaches), its own **bugs** (the enemies) and a short **story**. Adding a language means writing a pack with a planet, its sprites, regions, topics and exams. No engine file changes are needed except syntax highlighting and, optionally, a runner.

Example: Go. Go, Zig and Haskell already have a planet and sprites as "soon" placeholders (`content/<lang>/planet.ts`, `content/<lang>/sprites.ts`), so they appear locked in the galaxy; making one playable means adding its lessons and switching it to `active`.

## Steps

1. **Planet.** Design the planet before any lesson (see [Designing the planet](#designing-the-planet)). Write it as a `PlanetDef` (`lib/content/types.ts`), either inline in `index.ts` like `content/rust/index.ts` or in `content/<lang>/planet.ts` like Go, Zig and Haskell:
   ```ts
   import type { PlanetDef } from "../../lib/content/types.ts";
   import { L } from "../../lib/i18n/text.ts";

   export const planet: PlanetDef = {
     name: L("Concurra", "Concurra", "コンカーラ"),                       // budget 20
     story: L("Concurra is a honeycomb of tunnels...", "...", "..."),     // budget 260
     guide: { name: L("Gopi", "Gopi", "ゴピ"), sprite: "go/gopi",          // name budget 14
              title: L("Cheerful tunnel digger", "Alegre cavador de túneles", "陽気なトンネル掘り") }, // budget 40
     colors: { surface: "#...", accent: "#...", ring: "#..." },           // #rrggbb, ring optional
     moons: 3,
     bugs: ["go/nil-blob", "go/deadlock-snail", "go/race-twins"],
   };
   ```
2. **Sprites.** Create `content/<lang>/sprites.ts` exporting `Record<string, string[]>` (e.g. `GO_SPRITES`) with the guide and every bug: 16×16 grids using the sprite legend (`.` `0`–`3` `r` `y` `b` `s` `w` `g` `p` `c`), ids namespaced `<lang>/<name>`. Register it in `content/sprites.ts` (`PACK_SPRITES`). Details in [content-model.md](content-model.md#sprites).
3. **Pack.** Create `content/<lang>/index.ts` exporting a `LanguagePack`:
   ```ts
   import type { LanguagePack } from "../../lib/content/types.ts";
   import { L } from "../../lib/i18n/text.ts";
   import { planet } from "./planet.ts";

   export const go: LanguagePack = {
     slug: "go", name: "GO",
     tagline: L("Simple concurrency with goroutines", "Concurrencia simple con goroutines", "goroutine でシンプルな並行処理"),
     color: "#0099db",
     status: "active", runner: "go-playground",
     planet,
     regions: [/* imported from ./regions/*.ts */],
     topics, exams,
   };
   ```
   Copy the structure of `content/rust/`: `helpers.ts`, `topics.ts`, `exams.ts` and `regions/<slug>.ts` (English kebab-case slugs). All prose is `L(en, es, ja)`; see [content-model.md](content-model.md) and [i18n.md](i18n.md). Lesson `enemy` values should be the planet's bugs (`"go/nil-blob"`), and `speaker: "master"` dialogs are spoken by the guide, so write them in the guide's voice.
4. **Registration.** In `content/index.ts`, replace `soon("go", ..., goPlanet)` with the imported pack (`import { go } from "./go/index.ts"`).
5. **Highlighting.** Add the grammar to `GRAMMARS` in `lib/syntax.ts` (keywords and types). Without one, the Rust grammar is used.
6. **Runner (optional).** Needed for `run` beats and for verifying `check`:
   - Implement `LanguageRunner` (`lib/runners/types.ts`) in `lib/runners/<id>.ts` and register it in `lib/runners/index.ts`.
   - Add execution in `runRust`/`verify` of `scripts/validate-content.ts`, choosing by `pack.runner`.
   - Adjust `buildProgram` if the language needs a wrapper other than `fn main`.
   Without a runner, use only beats that don't need a compiler and omit `check`.
7. **Verify** with the checklist below.

Saves need no change: progress is keyed by language and lesson slug, so a new language simply starts empty in every existing save (see [save-system.md](save-system.md#why-adding-a-language-doesnt-break-saves)).

## Designing the planet

- **Theme the planet on the language's core ideas.** Oxide (Rust) is iron and gears ruled by the Borrow Dragon; Concurra (Go) is a honeycomb of goroutine tunnels; Comptia (Zig) and Lambdara (Haskell) follow the same idea.
- **The guide is an original character inspired by the language**, not a copy of an official mascot, logo or any existing character. Ferro is a crab sensei, Gopi a tunnel digger, Iggi an iguana forge engineer, Lambo an owl. Give it a one-line `title` and a consistent voice: short, warm, encouraging sentences.
- **Bugs are the language's classic mistakes** turned into monsters: Rust has a mite, a dangler (dangling references), a cog golem and the borrow dragon; Go has a nil blob, a deadlock snail and race twins. Order `bugs` from weakest to strongest: review runs use the first one, and exams use the 1st (junior), 3rd (mid) and 4th (senior), clamped to the list length.
- **Story:** two or three sentences that introduce the world, the bugs and the guide (budget 260).
- **Colors:** `surface` and `accent` blend on the faceted low-poly sphere; `ring` adds a ring; `moons` adds orbiting moons.

## Designing the region map

Order regions by teaching dependency, from concrete to abstract. For each language, identify the 4–6 concepts that are hardest for people coming from other languages and dedicate one region to each.

| Language | Suggested regions |
| --- | --- |
| Go | Variables and types · Slices and maps · Interfaces · Goroutines and channels · Errors and context |
| Zig | Types and comptime · Pointers and slices · Allocators · Errors · C interop |
| Haskell | Expressions and types · Pattern matching · Algebraic data types · Typeclasses · Monads and IO |

## Checklist

- [ ] The planet has a localized name, story, guide name and guide title within budget, valid `#rrggbb` colors and at least one bug.
- [ ] The guide and every bug have a namespaced 16×16 sprite registered in `content/sprites.ts`; designs are original, not copies of official mascots.
- [ ] Lessons use the planet's bugs as `enemy`.
- [ ] `npm run content:check` and `npm run content:verify -- --lang=<slug>` with no errors (including translations and sprite checks).
- [ ] The planet appears in the galaxy (`/galaxy`) as active in every locale, and landing shows the guide's intro the first time.
- [ ] `npm run playtest -- /play/<slug>/lesson/<first-lesson>` finishes and reports the result as saved.
- [ ] `npm test && npm run typecheck && npm run build` pass.
