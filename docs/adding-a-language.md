# Adding a programming language

This guide is about adding a new **programming language** (a cartridge such as Go). To add a new **human language** for the UI and content (for example French), see [i18n.md](i18n.md#adding-a-locale).

Example: Go. No engine file changes except syntax highlighting and, optionally, a runner.

## Steps

1. **Pack.** Create `content/go/index.ts` exporting a `LanguagePack`:
   ```ts
   import type { LanguagePack } from "../../lib/content/types.ts";
   import { L } from "../../lib/i18n/text.ts";

   export const go: LanguagePack = {
     slug: "go", name: "GO",
     tagline: L("Simple concurrency with goroutines", "Concurrencia simple con goroutines", "goroutine でシンプルな並行処理"),
     color: "#0099db",
     status: "active", runner: "go-playground",
     regions: [/* imported from ./regions/*.ts */],
     topics, exams,
   };
   ```
   Copy the structure of `content/rust/`: `helpers.ts`, `topics.ts`, `exams.ts` and `regions/<slug>.ts` (English kebab-case slugs). All prose is `L(en, es, ja)`; see [content-model.md](content-model.md) and [i18n.md](i18n.md).
2. **Registration.** In `content/index.ts`, replace `soon("go", ...)` with the imported pack (`import { go } from "./go/index.ts"`).
3. **Highlighting.** Add the grammar to `GRAMMARS` in `lib/syntax.ts` (keywords and types). Without one, the Rust grammar is used.
4. **Runner (optional).** Needed for `run` beats and for verifying `check`:
   - Implement `LanguageRunner` (`lib/runners/types.ts`) in `lib/runners/<id>.ts` and register it in `lib/runners/index.ts`.
   - Add execution in `runRust`/`verify` of `scripts/validate-content.ts`, choosing by `pack.runner`.
   - Adjust `buildProgram` if the language needs a wrapper other than `fn main`.
   Without a runner, use only beats that don't need a compiler and omit `check`.
5. **Verify** with the checklist below.

## Designing the region map

Order regions by teaching dependency, from concrete to abstract. For each language, identify the 4–6 concepts that are hardest for people coming from other languages and dedicate one region to each.

| Language | Suggested regions |
| --- | --- |
| Go | Variables and types · Slices and maps · Interfaces · Goroutines and channels · Errors and context |
| Zig | Types and comptime · Pointers and slices · Allocators · Errors · C interop |
| Haskell | Expressions and types · Pattern matching · Algebraic data types · Typeclasses · Monads and IO |

## Checklist

- [ ] `npm run content:check` and `npm run content:verify -- --lang=<slug>` with no errors (including translations).
- [ ] The cartridge appears active on the title screen in every locale.
- [ ] `npm run playtest -- /play/<slug>/lesson/<first-lesson>` finishes.
- [ ] `npm run typecheck && npm run build` pass.
