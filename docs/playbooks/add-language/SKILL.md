---
name: add-language
description: Add a new programming language (cartridge) to Bitwise Quest, such as Go, Zig or Haskell, including its regions, topics, exams, syntax highlighting and optional code runner, with all content localized in English, Spanish and Japanese.
---

# Add a programming language

For a new human language (UI/content locale), follow `docs/i18n.md` instead.

## Read first
`docs/adding-a-language.md`, `docs/architecture.md`, `docs/content-model.md`, `docs/i18n.md`, and the whole `content/rust/` folder as the reference implementation.

## Steps
1. Design the region map: 4–6 regions ordered from concrete to abstract, each a concept that is hard for people coming from other languages. Write it down before coding. Pick English kebab-case slugs.
2. Create `content/<slug>/` mirroring `content/rust/` (`index.ts`, `helpers.ts`, `topics.ts`, `exams.ts`, `regions/<region-slug>.ts`). Use `.ts` extensions in relative imports. Every prose field (pack `tagline`, region names, topic names, exam titles...) is `L(en, es, ja)`.
3. Register it in `content/index.ts`, replacing the `soon(...)` placeholder.
4. Add a grammar to `GRAMMARS` in `lib/syntax.ts`.
5. Runner, if `run` beats or `check` are needed: implement `LanguageRunner` in `lib/runners/<id>.ts`, register it in `lib/runners/index.ts`, and teach `scripts/validate-content.ts` to call it for `pack.runner` (plus the right program wrapper in `buildProgram`). Prefer an official public playground or a local toolchain; mention any external service to the user.
6. Build the first region with the `add-lessons` playbook and the exam banks with the `add-exam-questions` playbook.

## Verify
`verify-content` playbook, then `npm run build`. Confirm the cartridge is active on the title screen in all three locales.
