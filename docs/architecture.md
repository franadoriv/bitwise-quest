# Architecture

## Overview

```
content/<lang>/        Language packs: planet, regions, lessons, topics, exams (pure data, localized with L(en, es, ja))
content/<lang>/sprites.ts   Pack pixel sprites (guide, bugs), registered in content/sprites.ts (client-safe)
        │  imported by
        ▼
lib/repo.ts            Content reads only, straight from LANGUAGE_PACKS (indexed once in memory at module load):
                       languages/planets, world, lesson, review, exams. No database, no disk writes
        │  used by
        ▼
app/                   Next.js routes (App Router). Server pages read lib/repo.ts and pass CONTENT to client components
app/layout.tsx         Fonts, locale negotiation (cookie / Accept-Language), I18nProvider, SaveProvider, GameFrame
app/api/*              Endpoints: run (code runner), review-play (beats for due review keys). POST only, guarded
proxy.ts               Per-request nonce CSP + page rate limit (runs before every page request)
lib/security/          Abuse protection: limits (token bucket, semaphores, TTL cache), http guards, policies (quotas)
        │
        ▼
lib/save/              Client save system: schema, migrations, binary codec, localStorage slots, pure progress rules
components/save/       SaveProvider/useSave/RequireSave, MemoryCard (/saves), PlayerChip (autosave light)
components/galaxy/     Galaxy3D (low-poly planets, rings, moons, starfield) and GalaxyClient (planet card, LAND)
components/world/      Three.js planet map (low poly islands) and its HUD, landing intro by the guide
components/game/       Lesson engine: Stage (SVG+GSAP), beats, LessonGame (orchestrator), ResultScreen
components/exam/       Exam hub and per-topic report
components/title/      Title screen (the planets' guides walk across it)
components/ui/         GameFrame (16:9 scaling), Settings (language, palette, sound), I18n, Providers
components/pixel/      Built-in pixel art sprites as text grids, getSprite() (built-in + pack sprites)
lib/brand.ts           Game name, logo text and localized tagline (single source of truth)
lib/i18n/              text.ts (locales, Text, L, tx, negotiateLocale) and messages.ts (UI dictionaries)
lib/                   fx (particles, banners), sfx (WebAudio chiptune), syntax (highlighting), palette, game-rules
lib/runners/           Per-language code execution adapters
scripts/               validate-content.ts, playtest.mjs, e2e-memory-card.mjs
tests/                 save.test.ts, security.test.ts (npm test)
```

## Client save vs server content

The split is strict:

| Side | Holds | Where |
| --- | --- | --- |
| **Server** | Content only: planets, regions, lessons, topics, exams. Stateless with respect to players | `content/index.ts` (`LANGUAGE_PACKS`), `lib/repo.ts`, `app/**/page.tsx`, `app/api/*` |
| **Client** | All player progress: XP, coins, streak, stars, mastery, reviews, exam results, landings, play time | `lib/save/*`, `components/save/*`, localStorage `bwq:slot:<n>` |

The server never receives or stores a save. Pages send content to client components; the client combines it with the active save through the pure functions in `lib/save/progress.ts` (`worldState`, `completeLesson`, `completeExam`...) and autosaves with `useSave().commit()`. Every screen that needs a player is wrapped in `RequireSave`, which redirects to `/saves` when no slot is loaded. Full details in [save-system.md](save-system.md).

## Screen flow

```
/  Title ──PRESS START──▶ /saves  Memory card (15 slots: new game, continue, import/export)
                               │ choose a slot
                               ▼
                         /galaxy  Choose a planet (3D galaxy + planet card) ──LAND──▶ /play/<lang>  Planet map
                                                                                         │ first visit: landing intro by the guide (saved as landedAt)
                                                                                         ├──▶ /play/<lang>/lesson/<slug>
                                                                                         ├──▶ /play/<lang>/exam  ──▶ /play/<lang>/exam/<slug>
                                                                                         └──▶ /play/<lang>/review
```

| Route | Server loads | Client component |
| --- | --- | --- |
| `/` | `getLanguages()` (guide sprites) | `TitleScreen` |
| `/saves` | `getLanguages()` (planet name and guide sprite per slot) | `MemoryCard` |
| `/galaxy` | `getLanguages()` + lesson slugs per language | `GalaxyClient` + `Galaxy3D` |
| `/play/[lang]` | `getWorldContent(lang)` (404 unless `active`) | `WorldClient` + `WorldMap3D` |
| `/play/[lang]/lesson/[slug]` | `getLessonPlay` + `getWorldContent` | `LessonClient` (redirects to the map if `isUnlocked` is false) |
| `/play/[lang]/exam` | `getExams(lang)` | `ExamHub` |
| `/play/[lang]/exam/[slug]` | `getExamPlay` (includes `exam` meta for client grading) | `LessonClient` |
| `/play/[lang]/review` | `getLanguage(lang)` | `ReviewClient`: reads due keys from the save, then `POST /api/review-play` |

The galaxy starts on the save's `lastLang`. Planets whose language is `soon` are shown locked ("under construction"). The planet card shows the guide, story, bugs, progress (`done/total` lessons) and the LAND button.

## Lesson flow

1. `app/play/[lang]/lesson/[slug]/page.tsx` loads `LessonPlay` (beats, enemy sprite, theme, the planet's `guide`) and the world content from `lib/repo.ts`.
2. `LessonClient` waits for a save (`RequireSave`), checks `isUnlocked` against it and mounts `LessonGame` on the client only, because it uses audio, GSAP and random shuffling.
3. `LessonGame` walks the beat queue. For each beat it runs `setup` on the stage, shows the beat component and waits for `solved` or `wrong`.
4. A correct answer adds points, combo and speed bonus, plays the `win` effects and hits the bug. A wrong answer costs a heart, shows `explain` in a box with the planet's guide and pushes the beat to the end of the queue.
5. At the end, `completeLesson` (or `completeExam` / `completeReview`) computes the reward on the client and the new save is committed to the active slot. On game over, `recordFailedRun` still stores the misses for review.

All content arrives at the client with every locale (`Text` values). Components resolve it at render time with `useI18n().tx(text)`, so switching language never needs a reload. See [i18n.md](i18n.md).

## API

| Endpoint | Body | Returns |
| --- | --- | --- |
| `POST /api/run` | `{ language, code }` (body ≤ 16 KB, code ≤ 10,000 chars and 400 lines) | Runner result `{ ok, stdout, stderr, available }` (output capped at 8,000 chars each) |
| `POST /api/review-play` | `{ lang, keys }` with keys `"<lessonSlug>#<beatIndex>"` (body ≤ 2 KB) | A review `LessonPlay` with those beats (max 12, question beats except `run`), or 400/404 |

Both endpoints only export `POST` (any other method gets 405), require a same-origin `Origin`, are rate limited per client and answer errors as `{ "error": "<code>" }` with a stable code. The full list of checks, quotas and status codes is in [security.md](security.md).

There are no progress endpoints: the old `complete`, `attempts`, `review` and `exam` endpoints were removed when progress moved to the client.

## Stage and effects

`components/game/Stage.tsx` draws an SVG with `viewBox 240×96`. The background extends beyond the viewBox, so it fills any aspect ratio without cropping. The actors are `hero`, `ally` and `enemy`. There is one main item and a "ghost" for clones and borrows. Content never animates anything directly: it describes effects (`give`, `lend`, `drop`...) and the stage decides how they look. The same content keeps working when the art changes.

Sprites are text grids. `getSprite(id)` in `components/pixel/sprites.ts` looks up built-in sprites and pack sprites (`PACK_SPRITES` from `content/sprites.ts`), falling back to `slime` for unknown ids. Colors map to palette CSS variables, so pack sprites follow the selected palette.

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

## Content serving (no database)

There is no database. `lib/repo.ts` imports `LANGUAGE_PACKS` from `content/index.ts` and indexes it once, at module load, into in-memory maps (packs by slug, lessons by language and slug). Every read is computed from that immutable data, so:

- **The server is stateless.** It writes nothing to disk and keeps no player data; any number of instances can serve the same build.
- **Content changes ship with the build.** Editing `content/` and restarting (or rebuilding) is all it takes; there is nothing to seed, migrate or reset.
- **All locales travel together.** `Text` values keep every locale and are resolved on the client with `useI18n().tx(text)`.
- **Renaming or removing a slug** simply leaves the old key in players' saves with nothing to match (orphaned progress): that lesson shows as not completed. Keep slugs stable (see [save-system.md](save-system.md#why-adding-a-language-doesnt-break-saves)).

The only in-memory mutable state on the server is the abuse-protection counters and the run cache in `lib/security/policies.ts` (see [security.md](security.md)).

## Unlock rules

Computed on the client by `worldState` in `lib/save/progress.ts`:

- A region unlocks when every lesson of the previous region is completed or skipped (and the region is `active`).
- A lesson unlocks when the previous lesson in its region is completed.
- An entry exam skips regions in order while the player answers at least 80% of the questions on that region's topics correctly, with a minimum of 2 questions.

## Code execution

`run` beats call `POST /api/run`, which applies the guards described in [security.md](security.md) and picks the language's runner (`lib/runners/index.ts`). The Rust runner (`lib/runners/rust-playground.ts`) sends the player's snippet to the public Rust Playground. With `BITWISE_RUNNER=off` no external call is made and the beat is validated with its `fallback` regex. When the API answers 429 or 503, `RunBeatView` shows "busy, retry in N s" without costing a heart.

## Checklist when changing the architecture

- [ ] Engine stays language-agnostic: nothing Rust-specific in `components/` or `lib/` (except `lib/runners/` and grammars in `lib/syntax.ts`).
- [ ] The server stays stateless with respect to players; progress logic stays pure in `lib/save/progress.ts`.
- [ ] Save shape changes follow the checklist in [save-system.md](save-system.md#changing-the-save-format).
- [ ] New UI strings added to all dictionaries in `lib/i18n/messages.ts`.
- [ ] No database or disk writes on the server; content comes from `LANGUAGE_PACKS` via `lib/repo.ts`.
- [ ] New endpoints follow the rules in [security.md](security.md#adding-an-endpoint).
- [ ] `npm test && npm run typecheck && npm run build` pass.
