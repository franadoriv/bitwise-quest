# Entry exam

The entry exam simulates the technical screening companies run when hiring for roles that require the language. There are three levels: **junior**, **mid** (mid-level) and **senior**. The supporting research for Rust is in [research/rust-hiring-assessments.md](research/rust-hiring-assessments.md).

## How it works

- Each `ExamDef` has a **bank** of questions larger than `count`. Each attempt draws `count` questions spread across topics (round robin) and sorted from easy to hard (`difficulty` 1–3). Every attempt is different.
- One chance per question, no hearts and no retries, with `secondsPerQuestion` per question (40% more for `difficulty: 3` questions, see `questionTime` in `lib/repo.ts`). Running out of time counts as a miss.
- The server grades using the bank as the source of truth (`completeExam` in `lib/repo.ts`) and stores the attempt in `exam_results` with a per-topic breakdown.
- The report shows the percentage, whether the player passed (`passPct`), per-topic performance and which region to study.
- **Skipping regions:** walking the regions in order, if the player answers at least 80% of the questions on that region's topics correctly (minimum 2), its lessons are marked as skipped. It stops at the first region that doesn't pass.
- Exam UI text generated on the server (the intro dialog, the exam title, the interviewer's name) is built with `localized(key, vars)` from `lib/i18n/messages.ts`, so it reaches the client in every locale.

## Topics

`content/<lang>/topics.ts` defines topic ids with a localized `name`. `region` links a topic to the region slug that teaches it (for Rust: `let-village`, `ownership-forest`, `lifetime-peaks`, `trait-castle`, `fearless-tower`). Topics without a region (errors, collections, async...) count toward the score and report but don't skip regions.

```ts
ownership: { name: L("Ownership and moves", "Ownership y move", "所有権とムーブ"), region: "ownership-forest" },
```

## Exam definition

| Field | Type | Notes |
| --- | --- | --- |
| `slug` | string | `junior`, `mid`, `senior`; URL `/play/<lang>/exam/<slug>` |
| `level` | `"junior"` \| `"mid"` \| `"senior"` | |
| `title` | `L(...)` | Budget 32, e.g. `L("Junior Rust Developer", ...)` |
| `description` | `L(...)` | Who the exam simulates, budget 120 |
| `count` | number | Questions per attempt, must be ≤ bank size |
| `passPct` | number | 1–100 |
| `secondsPerQuestion` | number | Base time per question |
| `questions` | `ExamQuestion[]` | The bank |

## Writing questions

Allowed kinds: `pick`, `predict`, `type` and `order`. Each question has a `topic` and a `difficulty`. All prose is `L(en, es, ja)`; code is English and language-neutral.

```ts
{
  topic: "concurrency", difficulty: 3,
  kind: "predict",
  prompt: L("Does it compile?", "¿Compila?", "コンパイルできる？"),
  code: "use std::rc::Rc;\nuse std::thread;\nlet r = Rc::new(5);\nthread::spawn(move || println!(\"{}\", r));",
  options: [L("Yes", "Sí", "はい"), L("No: Rc is not Send", "No: Rc no es Send", "いいえ：Rc は Send ではない")],
  answer: 1,
  explain: L(
    "Rc uses a non-atomic counter, so it is not Send. Use Arc across threads.",
    "Rc usa un contador no atómico, así que no es Send. Entre hilos se usa Arc.",
    "Rc の参照カウントは非アトミックなので Send ではないよ。スレッド間では Arc を使おう。",
  ),
  check: { compiles: false },
}
```

Rules:
- Reflect what companies ask at that level, not trivia.
- Short prompts (budget 60) and at most 12 lines of code.
- `check` is mandatory when the answer depends on the compiler.
- Keep the bank at least 1.6 × `count` and cover every topic of the level.

## Checklist

- [ ] `npm run content:verify -- --lang=<lang> --only=exam:` with no errors.
- [ ] `npm run playtest -- /play/<lang>/exam/<slug> --mistakes=3` finishes and shows the report (try `--locale=es` and `--locale=ja` too).
