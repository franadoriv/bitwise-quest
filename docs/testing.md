# Testing and verification

| Command | What it checks | When |
| --- | --- | --- |
| `npm run content:check` | Structure: `___` slots, answer indices, unique options, valid effects and actors, `fallback` regexes, exam topics, **every prose field localized in en/es/ja**, text budgets | Whenever you edit `content/` |
| `npm run content:verify` | All of the above, plus compiles every `check`, every `solution` and every `starter` against the real compiler | Before accepting new content, especially LLM-generated content |
| `npm run typecheck` | TypeScript types, including that every UI dictionary has every message key | After code changes |
| `npm run shots` | Regenerates the README screenshots in `docs/screenshots/` | After visible UI changes |
| `npm test` | Unit tests of the save system (`tests/save.test.ts`, `node:test`) | After any change to `lib/save/` or game rules |
| `npm run playtest -- <path>` | A bot plays the lesson, exam or review in headless Chrome, saves screenshots to `.playtest/` and checks the result was saved | After visual or content changes |
| `npm run e2e` | End-to-end memory card flow in headless Chrome | After changes to the save system, memory card, galaxy or landing |
| `npm run build` | Production build | Before delivering |

CI (`.github/workflows/ci.yml`) runs `content:check`, `npm test`, `typecheck` and `build` on every push to `develop` or `release` and on every pull request. The `check` job is required to merge into `release`.

## Unit tests (`npm test`)

`npm test` runs `node --test "tests/**/*.test.ts"`. `tests/save.test.ts` covers:

- **Codec:** encode/decode round-trip (binary and base64); two exports of the same save differ and don't reveal the player name; any modified byte is rejected with `checksum`; a non-save file is rejected with `format`.
- **Migration:** a newer `version` is refused with `newer`; an old, partial shape is normalized (defaults filled, name trimmed, unknown keys and unknown languages preserved).
- **Export file name:** `BitwiseQuest_<player>_<YYYY-MM-DD_HH-MM-SS>.bwq`, with Latin accents folded (Ñandú → Nandu), other scripts kept (ゆうき), punctuation removed, and `Player` when nothing is left.
- **Progress rules:** lessons unlock in order, rewards accumulate, a missed beat becomes a due review and moves up a Leitner box; an exam skips mastered regions in order and unlocks the next one.

When the save format changes, add a fixture test here (see [save-system.md](save-system.md#changing-the-save-format)).

## Content validator flags

`scripts/validate-content.ts` accepts:

| Flag | Effect |
| --- | --- |
| `--verify` | Also runs every snippet on the language runner (this is what `content:verify` adds) |
| `--lang=<slug>` | Only validates that language pack, e.g. `--lang=rust` |
| `--only=<substring>` | Only reports and verifies items whose location contains the substring: a region slug (`--only=ownership-forest`), a lesson slug, or `exam:` for all exams (`--only=exam:senior` for one) |

```bash
npm run content:check -- --only=let-village
npm run content:verify -- --lang=rust --only=exam:
```

Errors (exit code 1) include missing or partial translations (`text must be localized { en, es, ja }, got a plain string ...`, `prompt.ja is empty`). Warnings include text over budget (`text.ja is 98 chars (budget 91)`), a `run` without `solution`, and a prompt that mentions compiling/printing without a `check`. If the runner can't be reached, each snippet becomes a warning instead of an error.

## Playtest

Needs the dev server running and a local Chrome installed.

```bash
npm run dev
BASE_URL=http://localhost:3000 npm run playtest -- /play/rust/lesson/hello-let --mistakes=1
npm run playtest -- /play/rust/exam/senior --mistakes=3 --size=390x844 --out=.playtest/mobile
npm run playtest -- /play/rust/lesson/one-owner --locale=ja --out=.playtest/ja
```

| Option | Default | Meaning |
| --- | --- | --- |
| `<path>` | `/play/rust/lesson/hello-let` | Lesson (`/play/<lang>/lesson/<slug>`), exam (`/play/<lang>/exam/<slug>`) or review (`/play/<lang>/review`) URL |
| `--mistakes=N` | `1` | Wrong answers to make on purpose |
| `--size=WxH` | `1280x720` | Viewport |
| `--out=dir` | `.playtest` | Screenshot folder |
| `--locale=en\|es\|ja` | `en` | UI language (sets the `locale` cookie) |

| Env var | Meaning |
| --- | --- |
| `BASE_URL` | Server URL (default `http://localhost:3000`) |
| `CHROME_PATH` | Chrome binary (default: the macOS install location) |
| `PLAYTEST_DEBUG` | When set, logs every beat the bot recognizes |

The bot answers from the content data (matching prompts in the chosen locale), makes `--mistakes` errors on purpose and exits with code 1 on page errors, if it doesn't reach the end, or if the result was not saved.

**Save injection.** Every page that plays needs a loaded save, so before opening the page the bot builds one with the real save code (`newSave("BOT")` + `completeLesson`) and writes it to `bwq:slot:1` / `bwq:active` in localStorage (only if slot 1 is empty in that fresh browser context):

- For `/play/<lang>/lesson/<slug>`, every lesson before the target is completed, so any lesson is reachable.
- The planet is marked as landed (`landedAt`), so the guide's intro does not cover the page.
- For `/play/<lang>/review`, the first question beats of the first lesson are seeded as due reviews.

**Persistence check.** After the run the bot decodes slot 1 and requires: for a lesson, `lessons.<slug>.doneAt`; for an exam, `exams.<slug>.attempts > 0`; for a review, every seeded key rescheduled into the future. It prints `✓ saved · xp ... · streak ...` or `✗ result was not saved to the slot`.

## Memory card end to end

```bash
npm run dev
BASE_URL=http://localhost:3000 npm run e2e -- --out=.playtest/memory-card
```

Uses the same `BASE_URL` and `CHROME_PATH` as the playtest, in English. Steps, with a screenshot each: title → PRESS START → memory card → new game in slot 1 (name "Ada") → galaxy → LAND on Rust → the guide's landing intro → map. Then it exports slot 1 (checks the file decodes and the name matches `BitwiseQuest_Ada_<date>_<time>.bwq`), imports it into empty slot 3, imports it again onto slot 1 (overwrite warning, then CONFIRM) and finally imports a tampered copy, which must be rejected. It prints the slots in storage and exits with code 1 on page errors or a bad export file name.

## Checklist

- [ ] `npm run content:check` with 0 errors.
- [ ] `npm run content:verify` with 0 errors for touched content.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes; for save or memory card changes, also `npm run e2e`.
- [ ] Playtest of an affected lesson; for layout changes, also `--locale=ja` and a portrait `--size`.
- [ ] `npm run build` for engine/UI changes.
