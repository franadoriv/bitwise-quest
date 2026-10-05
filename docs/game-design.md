# Game design

## Goal

Learn an advanced language by playing, not just review it. The game teaches with visual metaphors before asking for code, and it also serves people who already know the language, through the entry exam and the bosses.

## "Dopagaki" principles

Frequent stimulation and quick rewards, without visual chaos.

- **Every action gets an immediate response:** sound, particles, a floating number, a character reaction.
- **Small wins:** beats last seconds. The bug loses health with every correct answer.
- **Code controls the world:** variables are labels above characters, moves send items flying and borrows go and come back.
- **No dead time:** if the player is idle for 9 seconds, the hero cheers them on.
- **Mistakes teach:** the sensei explains why and the question comes back at the end ("the bug is back!").

## Scoring (`components/game/LessonGame.tsx`)

| Concept | Rule |
| --- | --- |
| Points per correct answer | `(100 + 60 × speed) × (1 + 0.1 × min(combo − 1, 10))` |
| Speed | Fraction of time remaining. Above 0.66 is PERFECT and above 0.33 is GREAT |
| Combo | Consecutive first-try correct answers. Banner at 3, 6, 9 and then every 5 |
| Hearts | 5 in lessons and 3 in bosses. Only the first mistake on each beat costs a heart |
| Stars | 3 with no mistakes, 2 with up to 2 mistakes, 1 otherwise (`lib/game-rules.ts`) |
| XP | `lesson xp × star factor` (40% on replays) `+ points / 25` |
| Level | `floor(sqrt(xp / 40)) + 1` |

## Retention

- **Daily streak** when completing any lesson, review or exam.
- **Spaced repetition:** every missed beat enters a Leitner box. Intervals are 10 minutes, 1, 3, 7 and 14 days. It shows on the map as "WANDERING BUGS".
- **Per-lesson mastery:** average of the last 20 answers, visible on the map.

## Aesthetics

8-bit pixel art with the Orange (default), Game Boy and NES palettes. Fonts: Press Start 2P (UI), DotGothic16 (dialogs) and VT323 (code). Press Start 2P and VT323 have no Japanese glyphs, so they fall back to DotGothic16, which covers kana and kanji (`app/layout.tsx`, `app/globals.css`). Chiptune music and effects are synthesized in `lib/sfx.ts`. The map is low poly in Three.js, rendered at low resolution with crisp pixels.

## Voice

The sensei, Ferro, speaks in short, warm, encouraging sentences. In English and Spanish he is direct and playful; in Japanese he uses a friendly, beginner-friendly sensei tone (casual endings such as 〜だよ, 〜しよう). See [i18n.md](i18n.md#translation-guidelines).
