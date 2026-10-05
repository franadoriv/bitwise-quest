<div align="center">

<img src="docs/screenshots/lesson-act.png" alt="Bitwise Quest: your code controls the world" width="100%" />

# BITWISE QUEST

**A retro arcade game for learning programming languages by playing.**
NES/Game Boy pixel art, constant feedback and a world that reacts to your code.
First planet: **Rust** (Oxide).

[![CI](https://github.com/franadoriv/bitwise-quest/actions/workflows/ci.yml/badge.svg)](https://github.com/franadoriv/bitwise-quest/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)
![Three.js](https://img.shields.io/badge/Three.js-low%20poly-049EF4?logo=threedotjs)
![GSAP](https://img.shields.io/badge/GSAP-SVG%20motion-88CE02?logo=greensock&logoColor=white)
![Rust](https://img.shields.io/badge/cartridge-Rust-CE422B?logo=rust)
![Languages](https://img.shields.io/badge/i18n-EN%20%C2%B7%20ES%20%C2%B7%20JA-6b5bd2)

</div>

---

## What is it?

Bitwise Quest teaches hard concepts such as ownership, lifetimes and concurrency to people who have **never** seen the language. It shows each idea first as a playable metaphor and only then asks for code. A variable is a label above a character. A *move* sends the sword flying to a new owner. A `&` borrow is a ghost copy that goes and comes back.

Every language is a **planet** with its own guide, bugs and story: Rust is **Oxide**, a world of iron and gears where Ferro, an old crab sensei, trains new guardians. Every correct answer hits the lesson's bug with particles, combos and chiptune sound. Every mistake comes with an explanation from the planet's guide, and that question comes back at the end. Players who already know the language can jump straight to the **entry exam**, which simulates the technical screening real companies run.

## Languages

The whole game, UI and every piece of content, is available in **English**, **Español** and **日本語**. The language is auto-detected from the browser (`Accept-Language`) on the first visit and can be switched at any time with the language button (EN / ES / 日本) in the settings bar. Code in the exercises always uses English identifiers. See [`docs/i18n.md`](docs/i18n.md).

## Screenshots

| Title | Memory card |
| --- | --- |
| ![Title screen](docs/screenshots/title.png) | ![Memory card with 15 save slots](docs/screenshots/memory-card.png) |
| **Choose a planet** | **Each planet has its own guide and bugs** |
| ![Galaxy: planet Oxide](docs/screenshots/galaxy.png) | ![Galaxy: planet Concurra](docs/screenshots/galaxy-go.png) |
| **Planet map** | **Code controls the world** |
| ![Low poly map](docs/screenshots/map.png) | ![Ownership lesson](docs/screenshots/lesson-act.png) |
| **Mistakes teach** | **Real compiler** |
| ![Error feedback](docs/screenshots/lesson-feedback.png) | ![Real code challenge](docs/screenshots/lesson-run.png) |
| **Region boss** | **Entry exam** |
| ![Boss](docs/screenshots/boss.png) | ![Exam report](docs/screenshots/exam-report.png) |
| **Game Boy palette** | **NES palette** |
| ![Game Boy palette](docs/screenshots/palette-gb.png) | ![NES palette](docs/screenshots/palette-nes.png) |
| **日本語** | **Español** |
| ![Japanese UI](docs/screenshots/locale-ja.png) | ![Spanish UI](docs/screenshots/locale-es.png) |

<p align="center"><img src="docs/screenshots/mobile.png" alt="Mobile view" width="280" /></p>

## How you learn

Each lesson is a series of challenges that take a few seconds each and follow the arc **see → practice → produce**:

| Challenge | What the player does |
| --- | --- |
| Dialog | The planet's guide introduces one idea in one or two sentences |
| Act | Presses buttons: each one writes a line of code and the world reacts |
| Pick | Fills the gap in the code with the right token |
| Predict | Guesses what the code prints or whether it compiles |
| Type | Types the token, with character-by-character feedback |
| Order | Builds the program line by line |
| Run | Fixes a real program and compiles it with the official compiler |

## Features

- **A galaxy of planets:** each language is a low poly 3D planet (with rings, moons and a starfield) that has its own guide, bugs and story. Land on it to reach a planet map with one island per region (Three.js), plus animated 2D pixel art scenes driven by GSAP on SVG.
- **Memory card with 15 save slots,** like a retro console: name your player, autosave as you play, and **export/import** any slot as a `.bwq` file to move it to another browser or keep a backup. Edited or damaged files are rejected.
- **Arcade juice:** combos, PERFECT and GREAT speed tiers, particles, screen shake, chiptune music and sound effects synthesized with WebAudio (no audio files).
- **Persistent progress** in your save: XP, levels, gold, daily streak, stars, per-lesson mastery and play time, kept in the browser (no account, nothing stored on the server).
- **Spaced repetition:** what you miss comes back as "wandering bugs" in Leitner boxes.
- **Junior, mid-level and senior entry exams** based on what companies actually assess, with a per-topic report and skipping of regions you already master.
- **Three languages:** English, Español and 日本語 for both UI and content, switchable in-game.
- **16:9 frame** that scales with the window, with a portrait layout for mobile.
- **Three palettes:** Orange, Game Boy and NES.
- **Verified content:** every claim about the compiler is actually compiled before it ships.

## Rust content

<!-- content-table:start -->
| # | Region | Concepts | Lessons | Questions |
| --- | --- | --- | --- | --- |
| 1 | **Let Village** | Variables · mut · types | 3 + boss | 27 |
| 2 | **Ownership Forest** | Move · clone · borrowing | 3 + boss | 28 |
| 3 | **Lifetime Peaks** | 'a · references that live | 3 + boss | 30 |
| 4 | **Trait Castle** | Traits · generics | 4 + boss | 40 |
| 5 | **Fearless Tower** | Threads · Arc · Mutex | 4 + boss | 45 |

170 lesson questions in total, every compiler claim verified against the real compiler.

**Entry exam**

| Level | Questions per attempt | Pass mark | Time per question |
| --- | --- | --- | --- |
| Junior Rust Developer | 12 from a bank of 25 | 70% | 30 s |
| Mid-level Rust Developer | 14 from a bank of 26 | 70% | 40 s |
| Senior Rust Developer | 15 from a bank of 30 | 75% | 50 s |
<!-- content-table:end -->

## Getting started

Requirements: Node 22.18 or newer (the validator, playtest and test scripts run TypeScript files directly with Node). There is no database to set up: the server reads content straight from the language packs in memory.

```bash
git clone https://github.com/franadoriv/bitwise-quest.git
cd bitwise-quest
npm install
npm run dev
```

Open <http://localhost:3000>, press **START**, pick a memory card slot, name your player and land on a planet.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run content:check` | Validates content structure and translations |
| `npm run content:verify` | Also compiles every claim against the real compiler |
| `npm run playtest -- <path>` | A bot plays a lesson in headless Chrome and saves screenshots |
| `npm run typecheck` | Type checking |
| `npm test` | Unit tests of the save system (codec, migrations, progress rules) and of the backend abuse protection (rate limits, origin checks, body limits) |
| `npm run e2e` | End-to-end memory card test in headless Chrome (with `npm run dev` running) |

> Code challenges send the player's snippet to the public Rust Playground (`play.rust-lang.org`). With `BITWISE_RUNNER=off` no external call is made and validation is done locally. The server is stateless and writes nothing to disk; player saves live in the browser's localStorage.

> The API is protected against abuse: same-origin checks, per-client and global rate limits, concurrency caps, bounded JSON bodies, strict validation, a per-request nonce Content-Security-Policy and security headers. See [`docs/security.md`](docs/security.md).

## Architecture

```
content/      Language packs: planet, sprites, regions, lessons, topics and exams (pure data, localized)
lib/          In-memory content queries, save system, game rules, sound, effects, code runners, i18n, security guards
components/   Lesson engine (SVG stage + GSAP), memory card, 3D galaxy and planet map, exams, UI
app/          Next.js routes (App Router) and API
scripts/      Content validator, playtest bot and memory card end-to-end test
tests/        Save system and security unit tests
docs/         Documentation for humans and AI agents
```

The server only serves content; all player progress lives on the client (see [`docs/save-system.md`](docs/save-system.md)). The engine knows nothing about Rust. Seven challenge kinds and a vocabulary of visual effects work for any language, and adding a new one means writing data. More detail in [`docs/architecture.md`](docs/architecture.md).

## Extend

| I want to... | Guide |
| --- | --- |
| Add lessons or regions | [`docs/authoring-lessons.md`](docs/authoring-lessons.md) |
| Add a programming language | [`docs/adding-a-language.md`](docs/adding-a-language.md) |
| Extend the entry exam | [`docs/exams.md`](docs/exams.md) |
| Translate or add a UI language | [`docs/i18n.md`](docs/i18n.md) |
| Understand the content model | [`docs/content-model.md`](docs/content-model.md) |
| Understand or change the save format | [`docs/save-system.md`](docs/save-system.md) |
| Learn the game design | [`docs/game-design.md`](docs/game-design.md) |
| Understand the backend abuse protection | [`docs/security.md`](docs/security.md) |

AI agents have instructions in [`AGENTS.md`](AGENTS.md) and step-by-step playbooks in [`docs/playbooks/`](docs/playbooks/).

## Roadmap

- [x] Rust cartridge: 5 regions and a 3-level entry exam
- [x] Full localization: English, Español, 日本語
- [x] Planets with their own guide and bugs, and a 15-slot memory card with export/import
- [ ] Go, Zig and Haskell planets (Concurra, Comptia and Lambdara are already in the galaxy, under construction)
- [ ] User accounts and leaderboard
- [ ] More challenge kinds, such as "find the bug" in longer code

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md). Every content contribution must pass `npm run content:verify` and include all three languages.

## License

[MIT](LICENSE) © 2026 Francisco Rivero
