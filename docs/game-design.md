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
- **Help is always one tap away:** the guidebook (📖) holds the full explanation of every idea in the lesson, and a hint ticket buys a nudge (see [Learning help](#learning-help-guidebook-and-hints)).

## Planets

Each programming language is a **planet** in a low-poly 3D galaxy (`/galaxy`), with its own guide, bugs and story (`planet` in the language pack, see [content-model.md](content-model.md#planet)).

| Planet | Language | Guide | Status |
| --- | --- | --- | --- |
| Oxide | Rust | Ferro, crab sensei of the forge | Playable |
| Scriptara | TypeScript / JavaScript | Tyto, wise owl of type safety | Active, content in progress |
| Serpentia | Python | Pippa, gentle snake of readable code | Active, content in progress |
| Sharpholm | C# | Hashi, keen fox of the managed realm | Active, content in progress |
| Concurra | Go | Gopi, cheerful tunnel digger | Active, content in progress |
| Velocis | C++ | Vecta, swift steel knight of control | Active, content in progress |
| Comptia | Zig | Iggi, iguana forge engineer | Active, content in progress |
| Lambdara | Haskell | Lambo, wise owl of pure functions | Active, content in progress |
| Rubion | Ruby | Kira, gem-hearted fox of happy code | Active, content in progress |

Scriptara has three framework moons: Reactia (React, guide Orbi), Shadera (WebGL, guide Trix) and Scenara (three.js, guide Polly). Rubion has one: Railhaven (Ruby on Rails, guide Chuff, little engine of convention), which teaches Rails under the hood by building small plain-Ruby versions of its mechanisms.

- **The guide** is the planet's teacher and voice: it speaks the lesson dialogs, explains every mistake and greets the player on the first landing with three choices: start from scratch, take the entry exam, or just look at the map.
- **The bugs** are the language's classic mistakes as monsters (dangling references, deadlocks, leaks...). They are the lesson enemies, and the planet card shows them before landing.
- **The galaxy card** shows the guide, the story, the bugs, the player's progress on that planet and the LAND button. Planets that are not playable yet are shown dimmed and locked.
- **Choosing where to land.** Swipes (or ◀ ▶ and the arrow keys) move between planets. Tapping a planet or one of its moons, the LAND button or Enter dims the screen and opens a "Where to land?" modal listing the planet and each framework moon (guide, name, language or framework, progress). Highlighting a card previews it: the camera moves to that moon, which keeps orbiting, and the card below shows its guide, story and bugs. Choosing one closes the modal, lifts the dim and starts the landing dive. Esc or a tap outside closes it without landing. Framework moons show a floating name tag while their planet is selected.
- Guides and bugs are original designs inspired by each language, not official mascots.

## Memory card

Progress is saved like on a retro console: a **memory card with 15 slots** (`/saves`, see [save-system.md](save-system.md)).

- **New game** asks for the player's name (up to 12 characters) and starts in the galaxy.
- Each slot shows the player name, level, last planet (with its guide), play time and last save date.
- **Autosave:** every result is written immediately; a small light next to the player name blinks red while saving.
- **Export/import:** a slot can be downloaded as a `.bwq` file (`BitwiseQuest_<player>_<date>_<time>.bwq`) and imported into any slot on another browser or device. Importing onto a used slot asks first; deleting a slot shows a warning. Edited or damaged files are rejected.
- Saves live in the browser (localStorage). Clearing site data deletes them, so export to keep a backup.

## Lesson timer

Before every lesson, boss and review (not exams) a timer modal (`components/game/TimerModal.tsx`) asks how to play. The last choice comes preselected (`prefs.timer` in the save, stored with `setTimerPref`), so one tap starts. The modes live in `TIMER_MODES` (`lib/game-rules.ts`):

| Mode | Time per question | Max speed bonus | Notes |
| --- | --- | --- | --- |
| `off` | No timer | 0 | No time pressure and no speed bonus. Not allowed in bosses |
| `relaxed` | base × 1.6 | 40 | |
| `normal` | base | 60 | Default for new saves |
| `fast` | base × 0.65 | 90 | |

- **Base seconds** come from `questionSeconds(beat)`: the beat's `time` if set; 120 for `run`; otherwise 12 (`pick`), 14 (`predict`, `order`) or 16 (`type`) plus 2 s per non-empty code line (3 s per line for `order`), clamped to 10–60 s. Longer code gets more time. The modal shows the lesson's average.
- **`questionLimitMs(beat, mode, boss)`** turns that into milliseconds; bosses are always timed (`off` counts as `normal`).
- In lessons and reviews, running out only loses the speed bonus. In bosses a timeout counts as a mistake. Exams skip the modal and keep their own fixed timer (`time`, or 25 s per question), where a timeout is a wrong answer.
- The timer pauses while the guidebook is open: reading time does not count.

## Scoring (`components/game/LessonGame.tsx`, `questionPoints` in `lib/game-rules.ts`)

| Concept | Rule |
| --- | --- |
| Points per correct answer | `(100 + bonus × speed) × (1 + 0.1 × min(combo − 1, 10))`, where `bonus` is the timer mode's max speed bonus (0, 40, 60 or 90) |
| Guidebook cost | Opening the guidebook during a question removes that question's speed bonus and costs 25% of its points (`× 0.75`), once per question |
| Speed | Fraction of time remaining (0 without a timer). Above 0.66 is PERFECT and above 0.33 is GREAT |
| Combo | Consecutive first-try correct answers. Banner at 3, 6, 9 and then every 5 |
| Hearts | 5 in lessons and 3 in bosses. Only the first mistake on each beat costs a heart |
| Stars | 3 with no mistakes, 2 with up to 2 mistakes, 1 otherwise (`lib/game-rules.ts`) |
| XP | `lesson xp × (0.6 + 0.15 × stars)` (× 0.4 on replays) `+ points / 25`, computed by `completeLesson` in `lib/save/progress.ts` |
| Level | `floor(sqrt(xp / 40)) + 1` |

## Learning help: guidebook and hints

Some questions are hard, and dialogs and `explain` are short by design. Two kinds of help keep a stuck player moving (authoring rules in [authoring-lessons.md](authoring-lessons.md#notes-and-hints)):

**The guidebook (lesson notes).** The book (📖) button opens `components/game/NotePanel.tsx`, the lesson's notes: long explanations of each idea with runnable examples (`LessonDef.notes`). It opens on the note the current question points at (`note`), with the others as tabs. It is available at any time in lessons, bosses and reviews, and from the "read more" button in the wrong-answer box; it is hidden in exams.

- The timer is paused while it is open.
- On a question, the **first** open costs 25% of that question's points and its speed bonus (the button shows `−25%`); later opens for the same question are free, and so is opening it on dialogs, demos or after a wrong answer.

**Hints.** The bulb button on a question (it shows the ticket count) (`takeHint` in `components/game/LessonGame.tsx`) spends one hint ticket (`spendTicket`) and shows the question's `hint` in a box from the guide. On `pick` and `predict` it also strikes out one wrong option (`ChoiceBeatView`'s `struck` prop). One hint per question; a question without a `hint` costs nothing. With no tickets left the button refuses.

**Ticket economy** (`lib/save/progress.ts`, saved as `stats.tickets`):

| Source | Tickets |
| --- | --- |
| New save (and every save migrated from v1) | 5 (`START_TICKETS`) |
| A 3-star lesson clear | +1 |
| First lesson, review or exam of a calendar day (`bumpStreak`) | +1 |
| Buy on the result screen (`components/game/ResultScreen.tsx`, `buyTicket`) | +1 for 40 coins (`TICKET_PRICE`) |
| Using a hint | −1 |

Hints never affect points or stars, so the trade-off is purely the ticket.

## Retention

- **Daily streak** when completing any lesson, review or exam. The first of the day also gives a hint ticket.
- **Play time** is tracked per save and shown on the memory card.
- **Spaced repetition:** every missed beat enters a Leitner box. Intervals are 10 minutes, 1, 3, 7 and 14 days. It shows on the map as "WANDERING BUGS".
- **Per-lesson mastery:** average of the last 20 answers, visible on the map.

## Aesthetics

8-bit pixel art with the Orange (default), Game Boy and NES palettes. Fonts: Press Start 2P (UI), DotGothic16 (dialogs) and VT323 (code). Press Start 2P and VT323 have no Japanese glyphs, so they fall back to DotGothic16, which covers kana and kanji (`app/layout.tsx`, `app/globals.css`). Chiptune music and effects are synthesized at runtime (see [Music](#music)). The map is low poly in Three.js, rendered at low resolution with crisp pixels.

## Music

Everything is synthesized with WebAudio; there are no audio files.

- **Engine.** Sound effects live in `lib/sfx.ts`. Songs are tracker data in `lib/music/songs.ts` (format and helpers in `lib/music/dsl.ts`), played by `lib/music/synth.ts` with a lookahead scheduler (a 25 ms timer schedules notes ~0.12 s ahead on the audio clock). Four NES-style channels: a pulse lead (12.5/25/50% duty, vibrato, slides), a quieter pulse harmony (arpeggios, broken chords, or the lead harmonized a third below `~3` or echoed `~echo`), a triangle bass and a noise drum kit (kick, snare, hats, crash, toms, metal clank). Each song has an `order` of sections (intro, A, B, breakdown...) with per-section transposition and a `loop` point, so the intro plays once. Switching songs cross-fades; scheduling pauses while the tab is hidden; the music toggle in settings is respected.
- **API.** `music.play(name)`, `music.playMap(slug)`, `music.stop()`. Calling `play` with the song already playing keeps it going. `map:<slug>` falls back to `map:default` (moons too); `lesson` picks a random variant.

| Track | Where | Loop | Mood |
| --- | --- | --- | --- |
| `title` | Title screen | 64 s | Hero theme, C major, lifts to D major |
| `card` | Memory card, exam hub | 84 s | Cozy, F major, music-box bridge |
| `galaxy` | Planet select | 91 s | Spacey D lydian with sparkling arpeggios |
| `map:default` | World map fallback | 75 s | Adventurous overworld, G major |
| `map:rust` | Oxide world map | 80 s | Industrial forge, D minor with a hopeful F major middle |
| `map:typescript` | TypeScript world map | 69 s | Bright and techy, A major, lifts to C |
| `map:go` | Concurra (Go) world map | 87 s | Brisk and cheerful, C major, two voices weaving like goroutines |
| `map:python` | Serpentia (Python) world map | 83 s | Friendly swaying 3-3-2 groove, B♭ major, lifts to C |
| `map:cpp` | Velocis (C++) world map | 76 s | Fast and driving, G minor, galloping bass |
| `map:csharp` | Sharpholm (C#) world map | 89 s | Regal fanfare and march, D♭ major, lifts to D |
| `map:webgl` | Shadera (WebGL moon) world map | 76 s | Neon arpeggios, B minor, sections named after the GPU pipeline |
| `map:threejs` | Scenara (three.js moon) world map | 90 s | Airy and spacious, E major, a weightless break |
| `map:zig` | Comptia (Zig) world map | 90 s | Crisp, mechanical F minor forge, 3+3+3+3+2+2 syncopation, an arpeggiated "comptime" break |
| `map:haskell` | Lambdara (Haskell) world map | 96 s | Serene and flowing, A♭ major with a lydian D, a "lazy" break of held notes |
| `map:ruby` | Rubion (Ruby) world map | 91 s | Joyful and sparkling, swung E♭ major, a "glint" break of lone gem sparkles |
| `map:rails` | Railhaven (Rails moon) world map | 81 s | Steady locomotive groove, F♯ minor, chugging train bass, a "whistle stop" break and a lift a tone up |
| `lesson:a`, `lesson:b` | Lessons and reviews (random) | 57 s / 67 s | Light battle grooves (E minor, A dorian) |
| `boss` | Boss lessons | 57 s | Intense and driving, C minor |
| `exam` | Entry exams | 69 s | Tense, steady clock pulse, D minor |
| `result` | Lesson results, exam report | 32 s | Calm victory, D major |
| `jingle:clear`, `jingle:gameover` | One-shots | 3 s / 7 s | Do not loop |

**Adding a planet theme.** Add a `Song` to `lib/music/songs.ts` and register it in `SONGS` as `"map:<language slug>"`; the world map picks it up automatically. Write the melody with `line("E5*2 G5*2 C6*4 | ...")` (16 steps per bar, `*n` = length in 16ths, `-` rest, `/E5` slide), build harmony and bass from chords with `chords("Am F C G", template)` and `bass(...)`, reuse the drum kit, and aim for a 45-120 s loop made of several sections. Songs must be original. `npm test` (`tests/music.test.ts`) checks that patterns exist, channels align, the loop is long enough, notes stay in range and no lead melody is shared between songs.

## Voice

Every guide speaks in short, warm, encouraging sentences. Rust's guide, the crab sensei Ferro, sets the tone: in English and Spanish he is direct and playful; in Japanese he uses a friendly, beginner-friendly sensei tone (casual endings such as 〜だよ, 〜しよう). See [i18n.md](i18n.md#translation-guidelines).
