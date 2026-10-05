# Rust hiring assessments: what companies test, by level

Research behind the "Prueba de ingreso" exams of Bit Forge (`content/rust/exams.ts`).
Goal: simulate the technical screening a company runs when hiring Rust developers at
junior, mid (semi-senior) and senior level, in an arcade format (short, timed, multiple choice).

Researched October 2026. The sources are public question collections, assessment vendors'
test descriptions, real job postings and the official Rust documentation. Interview processes
vary a lot between companies: treat this as a synthesis, not a standard.

## 1. How Rust screening usually works

| Stage | Typical format | Source evidence |
|---|---|---|
| Online skills test (vendor) | 6-15 multiple-choice or code-comprehension questions plus 0-1 coding task, 15-60 min | Adaface (35 min, 6 MCQ + 1 coding), iMocha (13 questions, 60 min), TestGorilla (entry and intermediate algorithm tests, 15-35 min) |
| Code-reading quiz | Read a snippet and predict output or behavior | dtolnay/rust-quiz (snippet, options, difficulty 1-3, explanation) |
| Technical interview | Talk through ownership trade-offs, picking a concurrency primitive, why the borrow checker rejects some code | Kore1, techinterview.org |
| Short live coding (about 45 min) | Fix code that clones too much, lifetime problems in structs, deadlocks | Kore1 |
| Senior design discussion | A safe API around `unsafe`, FFI boundaries, async architecture, when Rust is the wrong tool | Kore1, job postings |

## 2. Topics per level

| Area | Junior | Mid / Semi-senior | Senior |
|---|---|---|---|
| Syntax, mutability, shadowing, primitive types | Core | Assumed | Assumed |
| Ownership, move vs `Copy`, `clone` | Core | Second nature | Assumed |
| Borrowing (`&` / `&mut`, NLL) | Core | Core | Assumed |
| Enums, `match`, `Option` / `Result` | Core | Core | Assumed |
| Error handling (`?`, `unwrap` discipline) | Basic `?`, `unwrap_or` | `From` conversions, custom error types | Error design: `Box<dyn Error>` vs typed enums (library vs binary) |
| Collections and strings (`Vec`, `HashMap`, `String` vs `&str`) | Core | Core | Assumed |
| Lifetimes | Know why they exist | Annotations in functions and structs, elision rules | Elision edge cases, `T: 'static` meaning, variance (`&mut T` invariant) |
| Traits and generics | Know `derive` | Bounds, `impl Trait`, default methods, static vs dynamic dispatch | Dyn compatibility (object safety), orphan rule, `where Self: Sized`, cost of fat pointers |
| Closures | Not required | `Fn` / `FnMut` / `FnOnce`, `move` | Choosing the exact Fn bound |
| Iterators | Not required | Laziness, adapters, `collect`, `into_iter` moves | Per-element evaluation order, infinite iterators, zero-cost abstractions |
| Smart pointers | Not required | `Box` (recursive types), `Rc` counts | `Rc` vs `Arc`, `Weak` to break cycles, `Cell` / `RefCell` (runtime borrow panics) |
| Concurrency | Not required | `thread::spawn` + `move`, `Arc<Mutex<T>>`, channels | `Send` / `Sync` reasoning (`RefCell: !Sync`, `Mutex<T>: Sync if T: Send`), scoped threads |
| Memory | Not required | Not required | Drop order, `let _` vs `let _x`, niche optimization, `mem::take` |
| Async | Not required | Sometimes mentioned | Lazy futures, `Send` futures (state held across `.await`), `Pin` in `Future::poll`, Tokio |
| Unsafe / FFI | Not required | Not required | What `unsafe` enables (raw-pointer deref, unsafe fn, `static mut`, FFI) and what it does NOT disable (borrow checker); safe API invariants |

### What makes a candidate senior

Per the sources, a senior is not someone who knows more syntax. A senior shows design
judgment the compiler agrees with:

- **Send/Sync and the shared-state decision tree**: `Rc` → `Arc`, then `Mutex`/`RwLock`/atomics for
  mutation (techinterview.org, job postings asking for "Pin, Send, Sync bounds").
- **Async in production**: Tokio, futures, streams, backpressure, why a future is not `Send`.
- **Lifetimes beyond elision**: variance, `'static` bounds, self-referential structs (motivates `Pin`).
- **Trait objects vs generics**: monomorphization vs vtables, dyn compatibility.
- **Interior mutability**: when `RefCell` panics, `Cell` for `Copy` types.
- **Unsafe invariants**: building a sound safe wrapper, FFI boundaries (Rustonomicon).
- **Zero-cost and performance**: iterator fusion, layout and niche optimization, avoiding clones.
- **Error design**: typed error enums for libraries, `Box<dyn Error>` / `anyhow` for applications.

## 3. Question formats that fit the arcade

| Format in the sources | Bit Forge beat | Example in the bank |
|---|---|---|
| "Does this compile?" | `predict` with Sí/No + `check.compiles` | Moving a `String` and then using it |
| Output prediction (rust-quiz style) | `predict` with output options + `check.stdout` | Drop order, iterator evaluation order |
| Pick the right signature or trait bound | `pick` (one `___`) | `FnMut()` vs `Fn()` vs `FnOnce()`; `&'a str` return |
| Fill in the blank | `type` (exact token) | `Sized`, `Pin`, `From`, `unsafe` |
| Reorder statements | `order` | Arc + Mutex + spawn + join |
| Spot the bug | `predict` "¿Compila?" on buggy code; the `explain` names the fix | Elision ties the output to `&self` |

Long-form coding tasks and design discussions don't fit a 30-50 s arcade question. The bank
approximates them with "which fix is right" picks.

## 4. How the banks map to the research

| Exam | Draws / bank | Pass | s/question | Topics in the bank (count) | Kinds |
|---|---|---|---|---|---|
| `junior`, Rust Developer Junior | 12 / 25 | 70% | 30 | variables 3, types 4, ownership 4, borrowing 4, patterns 3, errors 4, collections 3 | predict 17, pick 5, type 2, order 1 |
| `mid`, Rust Developer Semi-Senior | 14 / 26 | 70% | 40 | lifetimes 5, traits 6, errors 3, iterators 4, closures 2, smart_pointers 2, concurrency 3, patterns 1 | predict 16, pick 8, type 1, order 1 |
| `senior`, Rust Developer Senior | 15 / 30 | 75% | 50 | concurrency 5, smart_pointers 4, traits 3, closures 1, lifetimes 4, iterators 2, memory 4, async 3, unsafe_ffi 3, errors 1 | predict 24, pick 3, type 3 |

Notes:

- The engine draws round-robin across topics (`lib/repo.ts`), so each attempt is balanced and different.
- Topic ids that link to a teaching region (`variables`, `types` → aldea-let; `ownership`, `borrowing` →
  bosque-ownership; `lifetimes` → monte-lifetimes; `traits` → castillo-traits; `concurrency` →
  torre-fearless) let a strong result skip those regions. Junior covers the first two regions, mid adds
  lifetimes/traits, senior adds concurrency.
- New topic ids (no region yet): `closures`, `iterators`, `memory`, `async`.
- Every question whose answer depends on the compiler or runtime has a `check` that is verified on the
  Rust Playground (`npm run content:verify -- --lang=rust`). Runtime-panic questions (`None.unwrap()`,
  double `borrow_mut`) use a `check.program` that wraps the code in `catch_unwind` and prints `true`, so
  the program itself doesn't panic.

## 5. Sources

Question collections and interview guides:
- Kore1, Rust developer interview questions (what each level is expected to know): https://www.kore1.com/rust-developer-interview-questions/
- techinterview.org, Rust interview questions (ownership, lifetimes, systems): https://www.techinterview.org/post/3233460429/rust-interview-questions/
- techinterview.org, Rust interview questions 2025 (traits, async, concurrency, level split): https://www.techinterview.org/post/3233474457/rust-interview-questions-2025-ownership-borrowing-lifetimes-traits-async-await-error-handling-smart-pointers-concurrency/
- techinterview.org, Rust interviews at defense-autonomy shops: https://www.techinterview.org/post/3233477224/rust-interview-questions-autonomy-systems/
- adhdecode, Rust senior engineer interview questions: https://adhdecode.com/articles/rust/rust-interview-questions-senior-engineer/
- Hyring, Top 60 Rust interview questions: https://hyring.com/jobseeker-toolkit/interview-questions/technical/rust
- dtolnay/rust-quiz (output-prediction format, difficulty 1-3): https://github.com/dtolnay/rust-quiz

Assessment vendors:
- TestGorilla Rust coding tests: https://www.testgorilla.com/coding-tests/rust/
- TestGorilla Rust entry-level algorithms: https://www.testgorilla.com/test-library/programming-skills-tests/rust-coding-entry-level-algorithms-test/
- TestGorilla Rust intermediate algorithms: https://testgorilla.com/test-library/programming-skills-tests/rust-coding-intermediate-algorithms-test/
- Adaface Rust online test: https://www.adaface.com/assessment-test/rust-online-test
- iMocha Rust programming skills test: https://imocha.io/tests/rust-programming-skills-test
- HR Avatar Rust programming test: https://www.hravatar.com/ta/tests/9621/rust-programming.html
- Mettl Rust coding assessment: https://mettl.com/test/rust-coding-assessment/

Job postings (senior requirements):
- Light-it, Senior Rust Developer (async/Tokio, Pin/Send/Sync, lock-free, proc macros): https://vacancy.light-it.net/senior-rust-developer/
- JustMarkets, Senior Rust Engineer (trading systems): https://job-boards.eu.greenhouse.io/justmarkets/jobs/4850317101
- Djinni, Senior Rust Engineer: https://djinni.co/jobs/810872-senior-rust-engineer/

Official reference topics:
- The Rust Programming Language (the Book): https://doc.rust-lang.org/book/
- The Rustonomicon (unsafe, variance, Send/Sync, drop check): https://doc.rust-lang.org/nomicon/
- Asynchronous Programming in Rust (futures, Pin): https://rust-lang.github.io/async-book/
