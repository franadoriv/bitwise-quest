# Architecture

## Overview

```
content/<lang>/        Language packs: regions, lessons, topics, exams (pure data, localized with L(en, es, ja))
        │  imported by
        ▼
lib/db.ts              SQLite schema + idempotent seed (content hash) + pruning + additive migrations
lib/repo.ts            Reads and writes: world, lessons, progress, review, exams
        │  used by
        ▼
app/                   Next.js routes (App Router). Server pages read SQLite and pass data to client components
app/layout.tsx         Fonts, locale negotiation (cookie / Accept-Language), I18nProvider, GameFrame
app/api/*              Endpoints: complete, attempts, review, exam, run
        │
        ▼
components/game/       Lesson engine: Stage (SVG+GSAP), beats, LessonGame (orchestrator), ResultScreen
components/exam/       Exam hub and per-topic report
components/world/      Three.js world map (low poly) and its HUD
components/title/      Title screen and cartridge selection
components/ui/         GameFrame (16:9 scaling), Settings (language, palette, sound), I18n, Providers
components/pixel/      Pixel art sprites defined as text grids
lib/brand.ts           Game name, logo text and localized tagline (single source of truth)
lib/i18n/              text.ts (locales, Text, L, tx, negotiateLocale) and messages.ts (UI dictionaries)
lib/                   fx (particles, banners), sfx (WebAudio chiptune), syntax (highlighting), palette, game-rules
lib/runners/           Per-language code execution adapters
scripts/               validate-content.ts and playtest.mjs
```

## Lesson flow

1. `app/play/[lang]/lesson/[slug]/page.tsx` checks the lesson is unlocked and loads `LessonPlay` from SQLite.
2. `LessonClient` mounts `LessonGame` on the client only, because it uses audio, GSAP and random shuffling.
3. `LessonGame` walks the beat queue. For each beat it runs `setup` on the stage, shows the beat component and waits for `solved` or `wrong`.
4. A correct answer adds points, combo and speed bonus, plays the `win` effects and hits the bug. A wrong answer costs a heart, shows `explain` and pushes the beat to the end of the queue.
5. At the end, `POST /api/complete` stores progress, attempts and reviews and returns XP, gold and the next lesson.

All content arrives at the client with every locale (`Text` values). Components resolve it at render time with `useI18n().tx(text)`, so switching language never needs a reload. See [i18n.md](i18n.md).

## Stage and effects

`components/game/Stage.tsx` draws an SVG with `viewBox 240×96`. The background extends beyond the viewBox, so it fills any aspect ratio without cropping. The actors are `hero`, `ally` and `enemy`. There is one main item and a "ghost" for clones and borrows. Content never animates anything directly: it describes effects (`give`, `lend`, `drop`...) and the stage decides how they look. The same content keeps working when the art changes.

## 16:9 frame

`components/ui/GameFrame.tsx` draws the UI on a logical 1280×720 canvas and scales it with CSS `zoom` to fill the window. In portrait it uses a 480 px wide canvas and a single column. Components use `useOrientation()` to pick their layout. Every px size refers to the logical canvas.

## Localization

| Piece | Path | Role |
| --- | --- | --- |
| Locale core | `lib/i18n/text.ts` | `LOCALES`, `DEFAULT_LOCALE = "en"`, `Text`, `Localized`, `L()`, `tx()`, `negotiateLocale()` |
| UI dictionaries | `lib/i18n/messages.ts` | `MESSAGES[locale][key]`, `format()`, `localized()` |
| React context | `components/ui/I18n.tsx` | `I18nProvider`, `useI18n()` |
| Initial locale | `app/layout.tsx` | `locale` cookie, else `Accept-Language` |
| Switcher | `components/ui/Settings.tsx` | Cycles EN → ES → 日本 |

Full details in [i18n.md](i18n.md).

## Database

Node's built-in SQLite (`node:sqlite`), file `data/bitwise.db`. Override the path with `BITWISE_DB`.

| Table | Contents |
| --- | --- |
| `meta` | `content_hash` of the last seeded content |
| `languages`, `regions`, `lessons` | Copy of the content. Rewritten when the hash of `content/` changes |
| `players` | Single local profile (id 1): XP, gold, streak |
| `progress` | Stars, best score, completed or skipped, per lesson |
| `attempts` | Every answer, used to compute per-lesson mastery |
| `reviews` | Leitner boxes for review ("wandering bugs") |
| `exam_results` | Entry exam attempts with the per-topic breakdown |

Notes:

- **Localized columns are JSON.** Every `Text` field (`tagline`, region `name`/`subtitle`, lesson `title`/`enemy_name`, and the `beats`, `topics` and `exams` blobs) is stored with `JSON.stringify` and parsed back in `lib/repo.ts`.
- **Seeding.** `db()` computes a SHA-1 of `LANGUAGE_PACKS`. If it differs from `meta.content_hash`, `seed()` upserts every language, region and lesson by slug in one transaction.
- **Pruning.** In the same transaction, `pruneRemoved()` deletes lessons and regions whose slug no longer exists in the content, together with that lesson's `progress`, `attempts` and `reviews` rows. Renaming a slug therefore resets player progress for that lesson.
- **Migrations** are additive and live in `migrate()` in `lib/db.ts`. Never drop columns; add new ones.

## Unlock rules

- A region unlocks when every lesson of the previous region is completed or skipped.
- A lesson unlocks when the previous lesson in its region is completed.
- An entry exam skips regions in order while the player answers at least 80% of the questions on that region's topics correctly, with a minimum of 2 questions.

## Code execution

`run` beats call `POST /api/run`, which picks the language's runner (`lib/runners/index.ts`). The Rust runner (`lib/runners/rust-playground.ts`) sends the player's snippet to the public Rust Playground. With `BITWISE_RUNNER=off` no external call is made and the beat is validated with its `fallback` regex.

## Checklist when changing the architecture

- [ ] Engine stays language-agnostic: nothing Rust-specific in `components/` or `lib/` (except `lib/runners/` and grammars in `lib/syntax.ts`).
- [ ] New UI strings added to all dictionaries in `lib/i18n/messages.ts`.
- [ ] Schema changes are additive in `migrate()`.
- [ ] `npm run typecheck && npm run build` pass.
