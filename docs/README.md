# Bitwise Quest documentation

Bitwise Quest is a retro arcade game (NES/Game Boy pixel art) for **learning** programming languages by playing. This folder explains how it works and how to extend it. It is written for humans and for LLMs: every document is self-contained, uses real repo paths and ends with a checklist where useful.

The game and all its content are localized in **English** (primary), **Spanish** and **Japanese**.

## Document map

| Document | Read it when you want to... |
| --- | --- |
| [architecture.md](architecture.md) | Understand how Next.js, the in-memory content, the client save, the SVG stage and the 3D galaxy and maps fit together |
| [save-system.md](save-system.md) | Understand the memory card: save format, migrations, `.bwq` files, progress rules |
| [content-model.md](content-model.md) | Learn the planet, sprites, every beat kind and every visual effect, with examples |
| [authoring-lessons.md](authoring-lessons.md) | Add lessons or regions to an existing language |
| [adding-a-language.md](adding-a-language.md) | Add a new programming language (a planet with its guide and bugs: Go, Zig, ...) |
| [exams.md](exams.md) | Understand or extend the entry exam (junior, mid, senior) |
| [i18n.md](i18n.md) | Understand localization, translate content or add a UI locale |
| [game-design.md](game-design.md) | Learn the "dopagaki" principles, planets, the memory card, scoring and progression |
| [security.md](security.md) | Understand the backend abuse protection: rate limits, origin checks, body limits, CSP and headers, and how to add a safe endpoint |
| [testing.md](testing.md) | Validate content, run unit and end-to-end tests, play headless and check the build |
| [research/](research/) | Supporting research, such as what companies assess in Rust |

## Key ideas in 30 seconds

1. **Content is data.** Everything the player sees lives in `content/<language>/`, including each language's planet, guide and bugs. The engine knows nothing about Rust.
2. **The engine is generic.** Seven beat kinds and a vocabulary of visual effects cover any language.
3. **Everything is verifiable.** Every compiler claim carries a `check` that `npm run content:verify` actually compiles.
4. **Every prose string is localized.** Content uses `L(en, es, ja)`; UI strings live in `lib/i18n/messages.ts`. The validator rejects missing translations.
5. **The server serves content, the client keeps progress.** The server reads `content/` straight from memory: no database, no disk writes, stateless. All player progress lives in the browser on a 15-slot memory card, keyed by stable slugs, so adding content never breaks a save.
6. **The API is guarded.** Every endpoint checks the origin, rate limits per client, caps the body and validates strictly. See [security.md](security.md).

## Commands

```bash
npm run dev              # development server
npm run content:check    # validates content structure and translations
npm run content:verify   # also compiles every check against the real compiler
npm run playtest -- /play/rust/lesson/hello-let --locale=en   # a bot plays the lesson in headless Chrome
npm test                 # save system and security unit tests
npm run e2e   # memory card end to end (with npm run dev running)
npm run typecheck && npm run build
```

## For AI agents

Read `AGENTS.md` at the repo root first. Ready-made playbooks for the usual tasks are in [`playbooks/`](playbooks/): add lessons, add a language, extend exams and verify content.
