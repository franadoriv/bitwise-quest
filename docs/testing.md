# Testing and verification

| Command | What it checks | When |
| --- | --- | --- |
| `npm run content:check` | Structure: `___` slots, answer indices, unique options, valid effects and actors, `fallback` regexes, exam topics, **every prose field localized in en/es/ja**, text budgets | Whenever you edit `content/` |
| `npm run content:verify` | All of the above, plus compiles every `check`, every `solution` and every `starter` against the real compiler | Before accepting new content, especially LLM-generated content |
| `npm run typecheck` | TypeScript types, including that every UI dictionary has every message key | After code changes |
| `npm run playtest -- <path>` | A bot plays the lesson or exam in headless Chrome and saves screenshots to `.playtest/` | After visual or content changes |
| `npm run build` | Production build | Before delivering |

CI (`.github/workflows/ci.yml`) runs `content:check`, `typecheck` and `build` on every push to `main` and every pull request.

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
| `<path>` | `/play/rust/lesson/hello-let` (stale default, always pass a path) | Lesson, exam or review URL |
| `--mistakes=N` | `1` | Wrong answers to make on purpose |
| `--size=WxH` | `1280x720` | Viewport |
| `--out=dir` | `.playtest` | Screenshot folder |
| `--locale=en\|es\|ja` | `en` | UI language (sets the `locale` cookie) |

| Env var | Meaning |
| --- | --- |
| `BASE_URL` | Server URL (default `http://localhost:3000`) |
| `CHROME_PATH` | Chrome binary (default: the macOS install location) |
| `PLAYTEST_DEBUG` | When set, logs every beat the bot recognizes |

The bot answers from the content data (matching prompts in the chosen locale), makes `--mistakes` errors on purpose and exits with code 1 on page errors or if it doesn't reach the end.

Locked lessons redirect to the map. To test an advanced region locally, complete the previous ones or pass an entry exam. Afterwards, `npm run db:reset` leaves the database clean.

## Checklist

- [ ] `npm run content:check` with 0 errors.
- [ ] `npm run content:verify` with 0 errors for touched content.
- [ ] `npm run typecheck` passes.
- [ ] Playtest of an affected lesson; for layout changes, also `--locale=ja` and a portrait `--size`.
- [ ] `npm run build` for engine/UI changes.
