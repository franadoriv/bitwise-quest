# Authoring lessons and regions

## Teaching principle

The player may know nothing about the language. **Never ask for something the game has not shown before.** Every lesson follows this arc:

1. **Hook** (`dialog`, 1–2 sentences). What problem the concept solves.
2. **Playable demonstration** (`act`). The player presses buttons, the code appears line by line and the world shows the idea with effects. If there is a typical error, show it here with `error`.
3. **Guided practice** (`pick`, `predict`). Small variations of the same pattern, with `setup` and `win` that draw what happens.
4. **Production** (`type`, `order`). The player recalls and writes.
5. **Real code** (`run`). A short program with a bug to fix.

Spread dialogs between questions instead of stacking them at the start. One new idea per dialog.

## "Dopagaki" pacing

- Dialogs under 140 characters. `say` bubbles 22 at most.
- No screen longer than 10–20 seconds without feedback.
- Code of 1–6 lines in questions and at most 12 in `run`.
- `explain` teaches the *why* in one or two sentences. It is what the player reads after a mistake.
- Use `setup` and `win` so every answer has a visible consequence.

## Writing in three languages

Every prose string is written as `L(en, es, ja)`. Write the English version first (it is the primary language), then Spanish and Japanese. Code and identifiers stay in English for every locale. Budgets are checked per locale; Japanese gets about 65% of each budget.

| Field | Budget (en/es) | Budget (ja) |
| --- | --- | --- |
| Dialog `text` | 140 | 91 |
| `explain` | 160 | 104 |
| `error.plain` | 120 | 78 |
| `act` / `run` `prompt` | 70 | 46 |
| Question `prompt` | 60 | 39 |
| Lesson `title` | 28 | 19 |
| `enemyName` | 20 | 13 |
| Step `label` | 16 | 11 |
| `say` / `banner` | 22 | 15 |

Tone and terminology rules are in [i18n.md](i18n.md#translation-guidelines).

```ts
import type { LessonDef } from "../../../lib/content/types.ts";
import { L, say } from "../helpers.ts";

const myLesson: LessonDef = {
  slug: "my-lesson",
  title: L("One owner only", "Un solo dueño", "持ち主はひとり"),
  concept: "ownership",
  mode: "lesson",
  xp: 60,
  enemy: "rust/mite", // a sprite id: one of the planet's bugs (content/<lang>/sprites.ts) or a built-in one
  enemyName: L("THIEF BUG", "BUG LADRÓN", "ドロボウバグ"),
  beats: [
    say(L("Every value has ONE owner.", "Cada valor tiene UN dueño.", "値の持ち主はひとりだけ。")),
    // act, pick, predict, type, order, run ...
  ],
};
```

## Adding a lesson to an existing region

1. Open `content/<lang>/regions/<region-slug>.ts` (for Rust: `let-village`, `ownership-forest`, `lifetime-peaks`, `trait-castle`, `fearless-tower`).
2. Declare `const myLesson: LessonDef = { ... }` following the file's style. Use an English kebab-case `slug` that is unique within the language.
3. Add it to the region's `lessons` array, before the boss.
4. Run the verification below.

## Adding a new region

1. Create `content/<lang>/regions/<slug>.ts` (English kebab-case slug) exporting a `RegionDef` with a `theme` (`village`, `forest`, `mountain`, `castle` or `tower`), localized `name`/`subtitle`, 3 lessons and a boss at the end.
2. Import it in `content/<lang>/index.ts` with a `.ts` extension and place it in learning order. If there was a `status: "soon"` placeholder, replace it.
3. If the region teaches an exam topic, set its slug in `topics.<topic>.region` (`content/<lang>/topics.ts`).

> Player saves are keyed by slug. Renaming or removing a lesson or region slug leaves the old key in every save with nothing to match (orphaned progress): that lesson shows as not completed again. Keep slugs stable. See [save-system.md](save-system.md#why-adding-a-language-doesnt-break-saves).

## Writing with an LLM

Ask for content citing this document, `docs/content-model.md`, `docs/i18n.md` and an existing region file as a style reference. Require `check` on every compiler-dependent question, `solution` on every `run` and `L(en, es, ja)` on every prose field. Then run the verification and fix until there are no errors. The `docs/playbooks/add-lessons` playbook automates this flow.

## Checklist

- [ ] `npm run content:check` with no errors and no warnings in your files (missing translations are errors; over-budget text is a warning).
- [ ] `npm run content:verify -- --lang=<lang> --only=<region-slug>` with no errors. Every claim is compiled.
- [ ] `npm run typecheck` passes.
- [ ] `npm run playtest -- /play/<lang>/lesson/<slug>` finishes. Check the screenshots in `.playtest/`; repeat with `--locale=ja` to catch overflow.
- [ ] No question uses a concept not introduced earlier in the region.
- [ ] TS/TSX packs: snippets follow [content-model.md](content-model.md#writing-snippets-for-the-js-runner) (module bodies, `import React from "react"` for JSX, no Node globals or DOM at runtime, no effects expected to run) and `content:verify` type-checks them with `tsc --strict`.
