# Save system (the memory card)

Player progress is managed **on the client**, in a retro "memory card" with three save slots. The app server only serves content (see [architecture.md](architecture.md)). An optional Google cloud card syncs directly from the browser to Supabase, independently of the local card; see [cloud-saves.md](cloud-saves.md). This document covers the save model, file format and pure progress rules.

| Piece | Path | Role |
| --- | --- | --- |
| Data model | `lib/save/schema.ts` | `SaveData`, `SAVE_VERSION`, `SLOT_COUNT`, `NAME_MAX`, `newSave`, `langOf` |
| Migrations | `lib/save/migrate.ts` | `SaveError`, `MIGRATIONS`, `normalize`, `migrate` |
| Binary codec | `lib/save/codec.ts` | `.bwq` encode/decode, CRC32, base64, export file name |
| Storage | `lib/save/store.ts` | localStorage slots, active slot, export/import |
| Progress rules | `lib/save/progress.ts` | Pure functions: unlocks, rewards, reviews, exams, hint tickets, timer preference, landing, play time |
| React state | `components/save/SaveProvider.tsx` | `SaveProvider`, `useSave`, `RequireSave` |
| Slot screen | `components/save/MemoryCard.tsx` | `/saves`: new game, continue, export, import, delete |
| HUD chip | `components/save/PlayerChip.tsx` | Player name, level and the autosave light |
| Tests | `tests/save.test.ts` | `npm test` |

## Data model (`lib/save/schema.ts`)

```ts
SAVE_VERSION  = 2     // bump on any shape change (see "Changing the save format")
SLOT_COUNT    = 3     // active slots; old local slots 4–15 stay available for export
NAME_MAX      = 12    // player name length
START_TICKETS = 5     // hint tickets in a new save
TIMER_PREFS   = ["off", "relaxed", "normal", "fast"]  // TimerPref (= TimerMode in lib/game-rules.ts)

interface SaveData {
  version: typeof SAVE_VERSION;
  id: string;                 // random UUID: the same save across exports/imports
  player: { name; createdAt; updatedAt; playMs };
  stats: { xp; coins; streak; bestStreak; lastDay: string | null; tickets };  // tickets: hint tickets (v2)
  prefs: { timer: TimerPref };  // last choice in the pre-lesson timer modal (v2)
  lastLang?: string;          // last planet visited (the galaxy starts there)
  langs: Record<langSlug, LangRecord>;
}

interface LangRecord {
  lessons: Record<lessonSlug, LessonRecord>;   // { stars, best, plays, skipped?, doneAt, recent }
  reviews: Record<"<lessonSlug>#<beatIndex>", ReviewRecord>;  // Leitner box { box, due }
  exams:   Record<examSlug, ExamRecord>;       // { attempts, bestPct, passed, last? { pct, at, topics } }
  practice: Record<taskSlug, PracticeRecord>;  // practice room (v3): { plays, best, solvedAt?, paperAt? }
  landedAt?: number;          // first landing on the planet (intro shown)
  lastPlayedAt?: number;
}
```

- `LessonRecord.recent` holds the last 20 first-try answers as a string of `"1"`/`"0"`; mastery is computed from it.
- `LessonRecord.skipped` marks lessons cleared by an entry exam instead of played.
- `stats.tickets` is the number of hint tickets the player holds; `prefs.timer` is preselected in the timer modal before each lesson (see [game-design.md](game-design.md#lesson-timer)).
- `newSave(name)` creates an empty save with `START_TICKETS` tickets and the `"normal"` timer; the name is cleaned by `cleanName` (control characters and `<>` removed, trimmed, cut to `NAME_MAX`, `"HERO"` if empty).
- `langOf(save, lang)` returns the language record, creating an empty one if needed (it mutates the save, so call it on a clone).

Design rules:

- **Progress is keyed by stable slugs** (language slug → lesson, review or exam slug), never by array position or numeric lesson id.
- **Unknown keys are preserved.** `normalize` spreads the original objects, so fields written by a newer content pack or an older game round-trip untouched.
- **Saves never store content**, only results. Titles, beats and XP values always come from the server.

## Migrations (`lib/save/migrate.ts`)

`migrate(raw)` is called on every decoded save:

1. It rejects anything without a numeric `version` (`SaveError("corrupt")`).
2. A `version` above `SAVE_VERSION` is refused (`SaveError("newer")`): the player must update the game.
3. While `version < SAVE_VERSION`, it applies `MIGRATIONS[version]`, which upgrades version *n* to *n + 1*. A missing step is `SaveError("corrupt")`.
4. `normalize` fills defaults for any missing field (numbers default to 0, `lastDay` to `null`, `stats.tickets` to `START_TICKETS`, an unknown `prefs.timer` to `"normal"`, a missing `id` becomes `legacy-<createdAt>`, missing `lessons`/`reviews`/`exams`/`practice` become `{}`) without dropping unknown fields (including unknown keys in `prefs`).

| Step | Change |
| --- | --- |
| `MIGRATIONS[1]` (v1 → v2) | Adds hint tickets and the timer preference: `stats.tickets = START_TICKETS` (5, the same allowance for everyone) and `prefs = { timer: "normal" }` |
| `MIGRATIONS[2]` (v2 → v3) | Adds the practice room: every planet record gets `practice: {}` (results of coding, trace and debug tasks keyed by the task's `slug`) |

`SaveError.code` is one of:

| Code | Meaning | Memory card message key |
| --- | --- | --- |
| `format` | Not a Bitwise Quest save (bad magic, too short, file over 2 MB) | `card.errFormat` |
| `checksum` | CRC mismatch: the file was edited or damaged | `card.errChecksum` |
| `newer` | Container or save version newer than this game | `card.errNewer` |
| `corrupt` | Truncated, padded, undecompressable, invalid JSON or no migration path | `card.errCorrupt` |

## Binary format (`lib/save/codec.ts`)

A `.bwq` file is a 20-byte header followed by the payload. All integers are little-endian.

| Offset | Type | Field |
| --- | --- | --- |
| 0 | `u8[4]` | Magic `"BWQ!"` |
| 4 | `u8` | Container version (`CONTAINER = 1`) |
| 5 | `u16` | Save version (`SaveData.version`) |
| 7 | `u8` | Flags. Bit 0: payload is `deflate-raw` compressed |
| 8 | `u32` | Seed, random on every encode |
| 12 | `u32` | Payload length |
| 16 | `u32` | CRC32 of the clear (compressed, un-XOR-ed) payload |
| 20 | `u8[]` | Payload: JSON of the save, deflate-raw compressed when `CompressionStream` exists, then XOR-ed with an xorshift32 keystream derived from the seed |

- **This is obfuscation, not encryption.** It makes files unreadable at a glance and tamper-evident (any edited byte fails the CRC), but anyone with the source can decode them. Never put secrets in a save.
- Because the seed changes on every encode, exporting the same save twice produces different files.
- `decodeSave` checks, in order: magic and minimum size, container version, exact length, CRC, decompression, JSON, then `migrate`.
- The codec works in browsers and in Node (the tests and scripts use it directly).
- **localStorage** only holds strings, so slots store the same binary as base64 (`toBase64` / `fromBase64`).
- **Export file name:** `exportFileName(save)` returns `BitwiseQuest_<player>_<YYYY-MM-DD_HH-MM-SS>.bwq` in local time. Latin accents are folded and punctuation removed (`"Ñandú Ada!"` → `NanduAda`), letters of other scripts are kept (`ゆうき` → `ゆうき`), and a name with nothing left becomes `Player`.

## Storage (`lib/save/store.ts`)

| Key | Value |
| --- | --- |
| `bwq:slot:<n>` (`n` = 1..3) | Base64 of the `.bwq` binary; old slots 4–15 are preserved |
| `bwq:active` | Number of the loaded slot |

If localStorage throws (private mode, blocked site data), reads and writes fall back to an in-memory map for the session.

| Function | Purpose |
| --- | --- |
| `listSlots()` | The three active slots; an undecodable slot is returned as `{ save: null, error: <code> }` |
| `listLegacySlots()` | Occupied/damaged original local slots 4–15, preserved for export |
| `readSlot(n)` / `writeSlot(n, save)` | Decode / encode one slot. Writes dispatch a `bwq:slots` window event |
| `deleteSlot(n)` | Removes the slot (and clears `bwq:active` if it was the active one) |
| `getActiveSlot()` / `setActiveSlot(n \| null)` | The loaded slot |
| `exportSlot(n)` | Re-encodes the slot and downloads it as a `.bwq` file |
| `readSaveFile(file)` | Validates an uploaded file (max 2 MB) and returns the decoded save; throws `SaveError` |

## Progress rules (`lib/save/progress.ts`)

All game-progress logic is **pure**: functions take a save (and the content they need) and return a new save; callers persist it with `commit`. Content arrives from the server in two shapes defined in this file:

- `WorldContent`: `{ regions: RegionInfo[] }`, each region with `slug`, `name`, `subtitle`, `theme`, `status` and `lessons: { slug, title, mode, xp }[]` (from `getWorldContent`).
- `ExamMeta`: `{ slug, title, passPct, topics: { [id]: { name, region? } }, regions: { slug, name, lessons }[] }` (the `exam` field of `getExamPlay`).

| Function | What it does |
| --- | --- |
| `worldState(content, rec)` | Derived map view: per region `unlocked`/`completed`, per lesson `stars`/`completed`/`skipped`/`unlocked`/`mastery`, plus `reviewDue` and `isNew` |
| `isUnlocked(content, rec, slug)` | Used by `LessonClient` to redirect locked lessons to the map |
| `nextLesson(content, rec)` | First unlocked, uncompleted lesson |
| `completeLesson(save, lang, content, lesson, result)` | Stars, best score, plays, first-clear XP (40% on replays), coins, attempts, streak, hint tickets (+1 for 3 stars, +1 for the first play of the day); returns `{ save, reward }` (`reward.ticketsGained`) |
| `recordFailedRun(save, lang, slug, attempts)` | Game over: misses still enter review, the lesson is not completed |
| `dueReviews(rec, now, limit = 8)` | Due review keys, lowest box first |
| `completeReview(save, lang, results, score)` | Moves Leitner boxes (correct: next box; wrong: back to box 1 in 10 minutes; past the last box the key is removed) |
| `completeExam(save, lang, meta, answers)` | Grades on the client, stores the attempt and skips mastered regions in order (≥ 80% over ≥ 2 questions); returns `{ save, report }` |
| `completePractice(save, lang, task, result)` | Practice room: plays and best score per task slug; the first solve pays `PRACTICE_XP` by kind (code 40, debug 30, trace 20), the first paper solve pays again, ×1.25 on paper, a quarter on replays; misses only count a play |
| `spendTicket(save)` | Spends one hint ticket; `null` when there are none left |
| `buyTicket(save, price = TICKET_PRICE)` | Buys one ticket for `TICKET_PRICE` (40) coins; `null` when the player can't afford it |
| `setTimerPref(save, timer)` | Stores the timer chosen in the pre-lesson modal |
| `markLanded(save, lang)` | Sets `landedAt` the first time (the guide's landing intro is not shown again) |
| `addPlayTime(save, ms)` | Adds to `player.playMs` |

The streak is bumped by `completeLesson`, `completeReview` and `completeExam` alike, and the first of those on a new calendar day also adds one hint ticket.

Unlock rules: a region unlocks when the previous region is fully completed (lessons skipped by an exam count) and its `status` is `active`; a lesson unlocks when the previous lesson of its region is completed.

## React layer

- **`SaveProvider`** (mounted in `app/layout.tsx`) loads the active slot on start and exposes `useSave()`: `{ ready, slot, save, saving, commit(next), load(slot), eject() }`.
- **`commit(next)`** updates state and immediately writes the active slot (autosave). `saving` stays true for ~600 ms so the HUD can blink.
- **Play time** is credited every minute while a save is loaded and the tab is visible.
- **`RequireSave`** renders its children only with a loaded save; otherwise it redirects to `/saves?next=<current path>`. After choosing a slot, the memory card returns to `next` when it is a `/play/...` path, otherwise to `/galaxy`.
- **`PlayerChip`** shows the player name and level, with a red memory-card light that blinks while autosaving.

## Memory card screen (`components/save/MemoryCard.tsx`, route `/saves`)

- Three slots in a grid (3 columns, stacked in portrait), keyboard navigable (arrows, Enter, Escape). Previous local slots appear separately for export.
- A full slot shows the player name, level, last planet (with that planet's guide sprite), play time and last save date.
- **Empty slot → NEW GAME** asks for the player name (max `NAME_MAX`), creates the save and goes to the galaxy.
- **Full slot → CONTINUE**, **EXPORT** (downloads the `.bwq`) or **DELETE** (with a warning naming the player and slot).
- **IMPORT** reads a `.bwq` file. If it is valid, the player picks a target: an empty slot imports directly; a full slot shows an overwrite warning first. Invalid files show the message for their `SaveError` code.
- A slot that cannot be decoded shows as damaged and can only be deleted.

## Why adding a language doesn't break saves

- `langs` is a map keyed by language slug, and every language record is a map keyed by lesson, review or exam slug. A new language, region or lesson simply has no entry yet; `langOf` creates it on first use and `worldState` treats missing entries as "not played".
- No position or count is stored, so reordering regions or inserting a lesson in the middle never shifts anyone's progress. Unlock state is recomputed from the current content every time.
- Unknown keys are preserved, so a save from a build with more languages still loads in a build with fewer (and keeps that data).
- Content is never copied into the save, so content edits (text, translations, XP values) apply to existing saves immediately.

What **does** affect saves: **renaming or removing a slug.** The old key stays in the save but no longer matches any content, so that lesson shows as not completed (and the following lessons may lock again). Keep slugs stable.

## Changing the save format

Only needed when the **shape** of `SaveData` changes (new required field, renamed field, new structure). Adding content never needs it.

- [ ] Bump `SAVE_VERSION` in `lib/save/schema.ts` and update the types.
- [ ] Add `MIGRATIONS[<old version>]` in `lib/save/migrate.ts` that returns the next version's shape (`{ ...s, version: <old + 1>, ... }`). Never edit an existing step.
- [ ] Give new fields a default in `normalize` if old saves may lack them.
- [ ] Add a fixture test in `tests/save.test.ts` that migrates (or decodes) a save of the old version and checks the new fields.
- [ ] Keep `normalize` preserving unknown keys.
- [ ] If the binary layout itself changes, bump `CONTAINER` in `lib/save/codec.ts` and keep decoding older containers.
- [ ] `npm test`, `npm run typecheck`, and `npm run e2e` with the dev server running.

## Tests

- `npm test` runs `tests/save.test.ts` with `node:test`: codec round-trip (binary and base64), files differ per export and hide the name, any modified byte is rejected, non-save files are rejected, newer versions are refused, normalization of old shapes (defaults plus preserved unknown keys), export file name, lesson unlock order and rewards (including a missed beat becoming a due review and moving up a Leitner box), exam region skipping, the v1 → v2 migration (5 tickets, `"normal"` timer, an invalid timer repaired, unknown prefs kept), the v2 → v3 migration (empty `practice` per planet, unknown keys kept), practice rewards, hint tickets (spend, buy, earned by perfect clears and daily play) and the timer math in `lib/game-rules.ts` (`questionSeconds`, `questionLimitMs`, `questionPoints`).
- `scripts/e2e-memory-card.mjs` drives the real UI; `scripts/playtest.mjs` injects a save and checks the result was persisted. See [testing.md](testing.md).
