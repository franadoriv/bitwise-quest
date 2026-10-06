# Bitwise Quest documentation

Bitwise Quest is a retro arcade game (NES/Game Boy pixel art) for **learning** programming languages by playing. This folder explains how it works and how to extend it. It is written for humans and for LLMs: every document is self-contained, uses real repo paths and ends with a checklist where useful.

The game and all its content are localized in **English** (primary), **Spanish** and **Japanese**.

## Document map

| Document | Read it when you want to... |
| --- | --- |
| [architecture.md](architecture.md) | Understand how Next.js, the in-memory content, the client save, the SVG stage and the 3D galaxy and maps fit together |
| [save-system.md](save-system.md) | Understand the memory card: save format, migrations, `.bwq` files, progress rules |
| [cloud-saves.md](cloud-saves.md) | Set up optional Google/Supabase cloud saves, account isolation, sync and recovery |
| [content-model.md](content-model.md) | Learn the pack fields, planets and moons, `codeLang`, sprites, every beat kind, `check` (Rust, TS/TSX, Go, C++, C#, Zig, Haskell, Ruby and Python) and every visual effect, with examples |
| [authoring-lessons.md](authoring-lessons.md) | Add lessons or regions to an existing language |
| [adding-a-language.md](adding-a-language.md) | Add a new programming language (a planet with its guide and bugs, like Zig or Haskell) or a framework moon (React, WebGL, three.js, Rails, ...), including a framework no sandbox can run, and choose or add a runner |
| [exams.md](exams.md) | Understand or extend the entry exam (junior, mid, senior) |
| [i18n.md](i18n.md) | Understand localization, translate content or add a UI locale |
| [game-design.md](game-design.md) | Learn the "dopagaki" principles, planets, the memory card, the lesson timer, scoring, the guidebook and hints, and progression |
| [security.md](security.md) | Understand the backend abuse protection (rate limits, origin checks, body limits, CSP and headers), where player code runs, and how to add a safe endpoint |
| [testing.md](testing.md) | Validate content (TS/TSX type-checking, real compilers and sandboxes for every language, the remote result cache), run unit and end-to-end tests, play headless and check the build |
| [research/](research/) | Supporting research: what companies assess in Rust, TypeScript, React, Go, Python, C++, C#, Zig, Haskell, Ruby, Rails, WebGL and three.js, and the curricula built on it |

## Key ideas in 30 seconds

1. **Content is data.** Everything the player sees lives in `content/<language>/`, including each language's planet, guide and bugs. The engine knows nothing about Rust or TypeScript.
2. **Planets and moons.** A language is a planet; a framework of it is a moon, a pack with `parent` (React, WebGL and three.js orbit the TypeScript/JavaScript planet; Rails orbits Ruby).
3. **The engine is generic.** Seven beat kinds and a vocabulary of visual effects cover any language.
4. **Everything is verifiable.** Every compiler claim carries a `check` that `npm run content:verify` actually compiles and runs on the same toolchain the game uses: Rust Playground, Go Playground, Compiler Explorer (C++, C#, Zig, Haskell, Ruby), `tsc --strict` plus the JS runner (TS/TSX) and Pyodide (Python). Framework facts no sandbox can run (the Rails API) are conceptual questions without a `check`, explained from the framework's official guides.
5. **Every prose string is localized.** Content uses `L(en, es, ja)`; UI strings live in `lib/i18n/messages.ts`. The validator rejects missing translations.
6. **The server serves content, the client keeps progress.** Vercel reads `content/` from memory: no database or progress endpoints. Three-slot local cards stay in the browser; optional cloud cards sync directly to Supabase with Google login. Saves use stable slugs, so adding content never breaks progress.
7. **The API is guarded, and player code never runs on the server.** Every endpoint checks the origin, rate limits per client, caps the body and validates strictly. Rust, Go, C++, C#, Zig, Haskell and Ruby snippets go to external sandboxes; JS/TS and Python (Pyodide, self-hosted) run in a Web Worker in the player's browser. See [security.md](security.md).

## Commands

```bash
npm run dev              # development server
npm run content:check    # validates content structure and translations
npm run content:verify   # also compiles every check against the real compiler
npm run playtest -- /play/rust/lesson/hello-let --locale=en   # a bot plays the lesson in headless Chrome
npm test                 # save, security, JS runner, runners (Python, snippet wrapper, highlighter) and music unit tests
npm run e2e   # memory card end to end (with npm run dev running)
npm run typecheck && npm run build
```

## For AI agents

Read `AGENTS.md` at the repo root first. Ready-made playbooks for the usual tasks are in [`playbooks/`](playbooks/): add lessons, add a language (planet), add a framework moon, extend exams and verify content.
