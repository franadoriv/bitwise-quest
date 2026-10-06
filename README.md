<div align="center">

<img src="docs/screenshots/lesson-act.png" alt="Bitwise Quest: your code controls the world" width="100%" />

# BITWISE QUEST

**A retro arcade game for learning programming languages by playing.**
NES/Game Boy pixel art, constant feedback and a world that reacts to your code.
Playable now: **Rust**, **TypeScript/JavaScript** (with **React**, **WebGL** and **three.js** moons), **Python**, **Go**, **C++**, **C#**, **Zig**, **Haskell** and **Ruby** (with its **Rails** moon).

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

Every language is a **planet** with its own guide, bugs and story: Rust is **Oxide**, a world of iron and gears where Ferro, an old crab sensei, trains new guardians. Frameworks are **moons** that orbit their language's planet: React (**Reactia**), WebGL (**Shadera**) and three.js (**Scenara**) orbit the TypeScript/JavaScript planet **Scriptara**, each with a guide of its own. Python is **Serpentia**, Go is **Concurra**, C++ is **Velocis** and C# is **Sharpholm**. Every correct answer hits the lesson's bug with particles, combos and chiptune sound. Every mistake comes with an explanation from the planet's guide, and that question comes back at the end. Players who already know the language can jump straight to the **entry exam**, which simulates the technical screening real companies run.

## Languages

The whole game, UI and every piece of content, is available in **English**, **Español** and **日本語**. The language is auto-detected from the browser (`Accept-Language`) on the first visit and can be switched at any time with the language button (EN / ES / 日本) in the settings bar. Code in the exercises always uses English identifiers. See [`docs/i18n.md`](docs/i18n.md).

## Screenshots

| Title | Memory card |
| --- | --- |
| ![Title screen](docs/screenshots/title.png) | ![Memory card with 3 save slots](docs/screenshots/memory-card.png) |
| **Choose a planet** | **Each planet has its own guide and bugs** |
| ![Galaxy: planet Oxide](docs/screenshots/galaxy.png) | ![Galaxy: planet Scriptara with its React moon](docs/screenshots/galaxy-ts.png) |
| **Planet Scriptara (TS/JS)** | **Moon Reactia (React), run in the browser** |
| ![TypeScript lesson](docs/screenshots/lesson-ts.png) | ![React exercise rendered in a Web Worker](docs/screenshots/lesson-react.png) |
| **Planet Serpentia: real Python in your browser** | **Planet Concurra (Go)** |
| ![Python async exercise run with CPython in WebAssembly](docs/screenshots/lesson-python.png) | ![Go panic and recover exercise on the Go Playground](docs/screenshots/lesson-go.png) |
| **Planet Comptia (Zig): allocators and the leak checker** | **Planet Lambdara (Haskell)** |
| ![Zig allocator exercise](docs/screenshots/lesson-zig.png) | ![Galaxy: planet Lambdara](docs/screenshots/galaxy-haskell.png) |
| **Planet Rubion (Ruby): pattern matching** | **Moon Railhaven: Rails strong params, rebuilt in Ruby** |
| ![Ruby pattern matching exercise](docs/screenshots/lesson-ruby.png) | ![Rails strong params exercise](docs/screenshots/lesson-rails.png) |
| **Planet Velocis (C++20)** | **Planet Sharpholm (C#, .NET 10)** |
| ![C++ move semantics exercise](docs/screenshots/lesson-cpp.png) | ![C# records exercise](docs/screenshots/lesson-csharp.png) |
| **Planet map** | **Code controls the world** |
| ![Low poly map](docs/screenshots/map.png) | ![Ownership lesson](docs/screenshots/lesson-act.png) |
| **Mistakes teach** | **Real compiler** |
| ![Error feedback](docs/screenshots/lesson-feedback.png) | ![Real code challenge](docs/screenshots/lesson-run.png) |
| **Choose your timer** | **The guidebook: long explanations, any time** |
| ![Timer modal](docs/screenshots/timer-modal.png) | ![Guidebook with verified examples](docs/screenshots/guidebook.png) |
| **Hints strike out a wrong option** | |
| ![Hint](docs/screenshots/hint.png) | |
| **Loading with real progress** | **Planet Concurra (Go)** |
| ![Loading screen downloading the Python interpreter](docs/screenshots/loading.png) | ![Galaxy: planet Concurra](docs/screenshots/galaxy-go.png) |
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
| Run | Fixes a real program and runs it: Rust and Go on their official playgrounds, C++, C#, Zig, Haskell and Ruby on Compiler Explorer, JS/TS/React/three.js and Python right in the browser |

## Features

- **A galaxy of planets with moons:** each language is a low poly 3D planet (with rings and a starfield) that has its own guide, bugs and story, and each framework of that language is a moon orbiting it, with its own guide, lessons and progress. Swipe between planets on touch screens; framework moons are shaped after what they teach (React an atom, WebGL a triangle, three.js a cube, Rails a train wheel). Landing dives into the planet with a widening field of view, then reaches a map with one island per region (Three.js), plus animated 2D pixel art scenes driven by GSAP on SVG.
- **Memory card with 3 save slots,** like a retro console: name your player, autosave as you play, and **export/import** any slot as a `.bwq` file to move it to another browser or keep a backup. Edited or damaged files are rejected.
- **Help when it's hard:** every lesson has a **guidebook** of long explanations (897 notes with 1,900+ verified code examples, using different values than the questions) that you can open from any question and come back to where you were (the first read costs 25% of that question's points). Every question also has a **hint**, paid with hint tickets (earned with perfect lessons and daily play, or bought with coins), and on multiple choice a hint also strikes out a wrong option.
- **Pick your pace:** before each lesson choose no timer, relaxed, normal or fast. Faster timers pay a bigger speed bonus, and the time per question grows with its code.
- **No dead waits:** before a challenge starts, the game downloads what it needs (the game code, the Python interpreter, three.js) behind an arcade loading screen with real progress, where the guide walks toward the bug and tips rotate. Cached content starts instantly.
- **Arcade juice:** combos, PERFECT and GREAT speed tiers, particles, screen shake, chiptune music and sound effects synthesized with WebAudio (no audio files).
- **Persistent progress** in your save: XP, levels, gold, daily streak, stars, per-lesson mastery and play time, kept locally without an account, or optionally synced directly to Supabase with Google login.
- **Spaced repetition:** what you miss comes back as "wandering bugs" in Leitner boxes.
- **Junior, mid-level and senior entry exams** based on what companies actually assess, with a per-topic report and skipping of regions you already master.
- **Three languages:** English, Español and 日本語 for both UI and content, switchable in-game.
- **16:9 frame** that scales with the window, with a portrait layout for mobile.
- **Three palettes:** Orange, Game Boy and NES.
- **Verified content:** every claim about the compiler is actually compiled or run before it ships: Rust and Go on their official playgrounds, C++, C#, Zig, Haskell and Ruby on Compiler Explorer, Python in CPython (WebAssembly), and TypeScript, React, WebGL and three.js with `tsc --strict` plus the game's own runner.
- **JS/TS and Python run in your browser:** TypeScript, React, three.js and Python exercises execute in a sandboxed Web Worker on the player's machine, with a hard timeout (Python is CPython compiled to WebAssembly, served by the game itself); the server never runs player code.

## Planets and moons

| World | Kind | Language / framework | Guide | Code runs | Status |
| --- | --- | --- | --- | --- | --- |
| **Oxide** | Planet | Rust | Ferro, a crab sensei | Official Rust Playground | Playable |
| **Scriptara** | Planet | TypeScript / JavaScript | Tyto, a wise owl | In the browser (Web Worker) | Playable: 5 regions + entry exams |
| **Reactia** | Moon of Scriptara | React | Orbi, a little atom | In the browser (Web Worker) | Playable: 4 regions + entry exams |
| **Shadera** | Moon of Scriptara | WebGL | Trix, a hello-triangle | In the browser (pure math, API type-checked) | Playable: 3 regions + entry exams |
| **Scenara** | Moon of Scriptara | three.js | Polly, a low-poly cube | In the browser (three's math and scene graph) | Playable: 3 regions + entry exams |
| **Serpentia** | Planet | Python | Pippa, a gentle snake | In the browser (CPython in WebAssembly) | Playable: 4 regions + entry exams |
| **Concurra** | Planet | Go | Gopi, a tunnel digger | Official Go Playground | Playable: 4 regions + entry exams |
| **Velocis** | Planet | C++20 | Vecta, a steel knight | Compiler Explorer (g++ 14) | Playable: 4 regions + entry exams |
| **Sharpholm** | Planet | C# | Hashi, a keen fox | Compiler Explorer (.NET 10) | Playable: 4 regions + entry exams |
| **Comptia** | Planet | Zig | Iggi, an iguana forge engineer | Compiler Explorer (Zig 0.15) | Playable: 4 regions + entry exams |
| **Lambdara** | Planet | Haskell | Lambo, a wise owl | Compiler Explorer (GHC 9.8) | Playable: 4 regions + entry exams |
| **Rubion** | Planet | Ruby | Kira, a gem-hearted fox | Compiler Explorer (Ruby 3.4) | Playable: 4 regions + entry exams |
| **Railhaven** | Moon of Rubion | Ruby on Rails | Chuff, a little engine | Compiler Explorer (Ruby 3.4): Rails rebuilt in plain Ruby | Playable: 3 regions + entry exams |

Future moons could cover more frameworks, such as Babylon.js, Vue or Django.

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

## Other worlds

| World | Regions | Lessons | Lesson questions | Entry exams (draws / bank) |
| --- | --- | --- | --- | --- |
| Scriptara (TS/JS) | Value Village · Closure Forest · Prototype Peaks · Type Castle · Event Loop Tower | 24 | 213 | 12/22 · 14/24 · 15/26 |
| Reactia (React) | JSX Village · State Forest · Effect Peaks · Render Tower | 19 | 168 | 12/22 · 14/24 · 15/26 |
| Shadera (WebGL) | Pipeline Village · Buffer Forest · Matrix Mountain | 14 | 134 | 12/22 · 14/24 · 15/26 |
| Scenara (three.js) | Scene Village · Graph Forest · Loop Tower | 13 | 119 | 12/22 · 14/24 · 15/26 |
| Serpentia (Python) | Name Village · Collection Forest · Function Peaks · Object Tower | 19 | 190 | 12/22 · 14/24 · 15/26 |
| Concurra (Go) | Gopher Village · Slice Forest · Interface Castle · Channel Tower | 20 | 222 | 12/22 · 14/24 · 15/26 |
| Velocis (C++) | Value Village · Lifetime Forest · Polymorph Castle · Template Tower | 20 | 227 | 12/22 · 14/24 · 15/26 |
| Sharpholm (C#) | Value Village · Class Forest · Linq Peaks · Task Tower | 19 | 194 | 12/22 · 14/24 · 15/26 |
| Comptia (Zig) | Forge Village · Optional Forest · Struct Mountain · Comptime Tower | 20 | 227 | 12/22 · 14/24 · 15/26 |
| Lambdara (Haskell) | Lambda Village · Fold Forest · Lazy Mountain · Monad Tower | 20 | 201 | 12/22 · 14/24 · 15/26 |
| Rubion (Ruby) | Object Village · Enumerable Forest · Module Castle · Meta Tower | 20 | 230 | 12/22 · 14/24 · 15/26 |
| Railhaven (Rails) | Record Village · Association Forest · Controller Castle | 15 | 143 | 12/22 · 14/24 · 15/26 |

Rails can't run in any of the game's sandboxes, so Railhaven teaches **Rails under the hood**: the player builds small plain-Ruby versions of Active Record, associations (with a query counter that makes N+1 visible), validations, callbacks, routing, strong params and filters, all verified on real Ruby. Rails API facts are taught as conceptual questions explained from the Rails Guides.

Every claim in every world is checked by `npm run content:verify` against the real toolchain: 3,700+ snippets in total. The curricula and exam designs come from research into what companies assess, in [`docs/research/`](docs/research/).

## Getting started

Requirements: Node 22.18 or newer (the validator, playtest and test scripts run TypeScript files directly with Node). There is no database to set up: the server reads content straight from the language packs in memory.

```bash
git clone https://github.com/franadoriv/bitwise-quest.git
cd bitwise-quest
npm install
npm run dev
```

Open <http://localhost:3000>, press **START**, pick a memory card slot, name your player and land on a planet.

To enable optional Google cloud saves, follow [`docs/cloud-saves.md`](docs/cloud-saves.md). Local and cloud cards have three slots each and exchange saves through the same `.bwq` files. Previous local slots 4–15 remain available for export.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run content:check` | Validates content structure and translations |
| `npm run content:verify` | Also compiles every claim against the real compiler (TS/TSX: `tsc --strict` plus the game's runner) |
| `npm run playtest -- <path>` | A bot plays a lesson in headless Chrome and saves screenshots |
| `npm run typecheck` | Type checking |
| `npm test` | Unit tests of the save system (codec, migrations, progress rules), the backend abuse protection (rate limits, origin checks, body limits), the JS/TS and Python runners, the snippet wrapper, the highlighter and the music |
| `npm run e2e` | End-to-end memory card test in headless Chrome (with `npm run dev` running) |

> Rust and Go code challenges send the player's snippet to their official public playgrounds (`play.rust-lang.org`, `go.dev`), and C++, C#, Zig, Haskell and Ruby (and Rails) challenges to Compiler Explorer (`godbolt.org`). Only the snippet is sent, through the same quotas and cache. With `BITWISE_RUNNER=off` no external call is made and validation is done locally. JS/TS/React/three.js and Python challenges run in a Web Worker in the player's own browser and never reach the server. The server is stateless and writes nothing to disk; local saves live in the browser's localStorage; optional cloud saves connect directly to Supabase. See [`docs/cloud-saves.md`](docs/cloud-saves.md).

> The API is protected against abuse: same-origin checks, per-client and global rate limits, concurrency caps, bounded JSON bodies, strict validation, a per-request nonce Content-Security-Policy and security headers. See [`docs/security.md`](docs/security.md).

## Architecture

```
content/      Language packs (planets and their framework moons): planet, sprites, regions, lessons, topics and exams (pure data, localized)
lib/          In-memory content queries, save system, game rules, sound, effects, code runners, i18n, security guards
components/   Lesson engine (SVG stage + GSAP), memory card, 3D galaxy and planet map, exams, UI
app/          Next.js routes (App Router) and API
scripts/      Content validator (with the tsc --strict batch checker), playtest bot and memory card end-to-end test
tests/        Save system, security, JS/TS runner and music unit tests
docs/         Documentation for humans and AI agents
```

The server only serves content; all player progress lives on the client (see [`docs/save-system.md`](docs/save-system.md)). The engine knows nothing about Rust or TypeScript. Seven challenge kinds and a vocabulary of visual effects work for any language, and adding a new one means writing data. More detail in [`docs/architecture.md`](docs/architecture.md).

## Extend

| I want to... | Guide |
| --- | --- |
| Add lessons or regions | [`docs/authoring-lessons.md`](docs/authoring-lessons.md) |
| Add a programming language (planet) or a framework (moon) | [`docs/adding-a-language.md`](docs/adding-a-language.md) |
| Extend the entry exam | [`docs/exams.md`](docs/exams.md) |
| Translate or add a UI language | [`docs/i18n.md`](docs/i18n.md) |
| Understand the content model | [`docs/content-model.md`](docs/content-model.md) |
| Understand or change the save format | [`docs/save-system.md`](docs/save-system.md) |
| Learn the game design | [`docs/game-design.md`](docs/game-design.md) |
| Understand the backend abuse protection and where player code runs | [`docs/security.md`](docs/security.md) |

AI agents have instructions in [`AGENTS.md`](AGENTS.md) and step-by-step playbooks in [`docs/playbooks/`](docs/playbooks/).

## Roadmap

- [x] Rust cartridge: 5 regions and a 3-level entry exam
- [x] Full localization: English, Español, 日本語
- [x] Planets with their own guide and bugs, and a three-slot memory card with export/import
- [x] TypeScript/JavaScript planet (Scriptara) and its React moon (Reactia), running in the browser
- [x] Planets Python, Go, C++, C#, Zig and Haskell, and moons WebGL and three.js
- [x] Planet Ruby with its Rails moon
- [ ] More framework moons, such as Babylon.js, Vue or Django
- [ ] More planets, such as Java, Kotlin, Swift or SQL
- [ ] User accounts and leaderboard
- [ ] More challenge kinds, such as "find the bug" in longer code

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md). Every content contribution must pass `npm run content:verify` and include all three languages.

## License

[MIT](LICENSE) © 2026 Francisco Rivero
