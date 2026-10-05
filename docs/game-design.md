# Game design

## Goal

Learn an advanced language by playing, not just review it. The game teaches with visual metaphors before asking for code, and it also serves people who already know the language, through the entry exam and the bosses.

## "Dopagaki" principles

Frequent stimulation and quick rewards, without visual chaos.

- **Every action gets an immediate response:** sound, particles, a floating number, a character reaction.
- **Small wins:** beats last seconds. The bug loses health with every correct answer.
- **Code controls the world:** variables are labels above characters, moves send items flying and borrows go and come back.
- **No dead time:** if the player is idle for 9 seconds, the hero cheers them on.
- **Mistakes teach:** the planet's guide explains why and the question comes back at the end ("the bug is back!").

## Planets

Each programming language is a **planet** in a low-poly 3D galaxy (`/galaxy`), with its own guide, bugs and story (`planet` in the language pack, see [content-model.md](content-model.md#planet)).

| Planet | Language | Guide | Status |
| --- | --- | --- | --- |
| Oxide | Rust | Ferro, crab sensei of the forge | Playable |
| Concurra | Go | Gopi, cheerful tunnel digger | Under construction |
| Comptia | Zig | Iggi, iguana forge engineer | Under construction |
| Lambdara | Haskell | Lambo, wise owl of pure functions | Under construction |

- **The guide** is the planet's teacher and voice: it speaks the lesson dialogs, explains every mistake and greets the player on the first landing with three choices: start from scratch, take the entry exam, or just look at the map.
- **The bugs** are the language's classic mistakes as monsters (dangling references, deadlocks, leaks...). They are the lesson enemies, and the planet card shows them before landing.
- **The galaxy card** shows the guide, the story, the bugs, the player's progress on that planet and the LAND button. Planets that are not playable yet are shown dimmed and locked.
- Guides and bugs are original designs inspired by each language, not official mascots.

## Memory card

Progress is saved like on a retro console: a **memory card with 15 slots** (`/saves`, see [save-system.md](save-system.md)).

- **New game** asks for the player's name (up to 12 characters) and starts in the galaxy.
- Each slot shows the player name, level, last planet (with its guide), play time and last save date.
- **Autosave:** every result is written immediately; a small light next to the player name blinks red while saving.
- **Export/import:** a slot can be downloaded as a `.bwq` file (`BitwiseQuest_<player>_<date>_<time>.bwq`) and imported into any slot on another browser or device. Importing onto a used slot asks first; deleting a slot shows a warning. Edited or damaged files are rejected.
- Saves live in the browser (localStorage). Clearing site data deletes them, so export to keep a backup.

## Scoring (`components/game/LessonGame.tsx`)

| Concept | Rule |
| --- | --- |
| Points per correct answer | `(100 + 60 × speed) × (1 + 0.1 × min(combo − 1, 10))` |
| Speed | Fraction of time remaining. Above 0.66 is PERFECT and above 0.33 is GREAT |
| Combo | Consecutive first-try correct answers. Banner at 3, 6, 9 and then every 5 |
| Hearts | 5 in lessons and 3 in bosses. Only the first mistake on each beat costs a heart |
| Stars | 3 with no mistakes, 2 with up to 2 mistakes, 1 otherwise (`lib/game-rules.ts`) |
| XP | `lesson xp × (0.6 + 0.15 × stars)` (× 0.4 on replays) `+ points / 25`, computed by `completeLesson` in `lib/save/progress.ts` |
| Level | `floor(sqrt(xp / 40)) + 1` |

## Retention

- **Daily streak** when completing any lesson, review or exam.
- **Play time** is tracked per save and shown on the memory card.
- **Spaced repetition:** every missed beat enters a Leitner box. Intervals are 10 minutes, 1, 3, 7 and 14 days. It shows on the map as "WANDERING BUGS".
- **Per-lesson mastery:** average of the last 20 answers, visible on the map.

## Aesthetics

8-bit pixel art with the Orange (default), Game Boy and NES palettes. Fonts: Press Start 2P (UI), DotGothic16 (dialogs) and VT323 (code). Press Start 2P and VT323 have no Japanese glyphs, so they fall back to DotGothic16, which covers kana and kanji (`app/layout.tsx`, `app/globals.css`). Chiptune music and effects are synthesized in `lib/sfx.ts`. The map is low poly in Three.js, rendered at low resolution with crisp pixels.

## Voice

Every guide speaks in short, warm, encouraging sentences. Rust's guide, the crab sensei Ferro, sets the tone: in English and Spanish he is direct and playful; in Japanese he uses a friendly, beginner-friendly sensei tone (casual endings such as 〜だよ, 〜しよう). See [i18n.md](i18n.md#translation-guidelines).
