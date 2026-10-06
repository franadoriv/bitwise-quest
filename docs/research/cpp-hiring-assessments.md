# C++ hiring assessments: what companies test, by level

Research behind the C++ planet (pack `cpp`) and its entry exams (`content/cpp/exams.ts`).
Goal: simulate the technical screening a company runs when hiring C++ developers at junior,
mid-level and senior level, in an arcade format (short, timed, multiple choice), and make sure the
lessons in [cpp-curriculum.md](cpp-curriculum.md) teach everything those screenings ask.

Researched October 2026. The sources are public question collections, assessment vendors' test
descriptions, a published interview book, code-reading quiz sites, real job postings, cppreference
and the C++ Core Guidelines. Interview processes vary a lot between companies and industries (game
studios, trading firms, embedded, infrastructure): treat this as a synthesis, not a standard.

## 1. How C++ screening usually works

| Stage | Typical format | Source evidence |
|---|---|---|
| Online skills test (vendor) | Multiple-choice / code-comprehension questions plus 0-2 coding tasks, 30-60 min; topics are data types, operators, pointers and references, classes, OOP (inheritance, polymorphism, overloading), memory management, STL, templates, exceptions, file I/O, concurrency | Adaface C++ Online Test, iMocha C++ coding tests (basic 30 min / 2 questions, medium, high 60 min) |
| Code-reading quiz | Read a full program and answer: "guaranteed output X", "compilation error", "undefined behavior", "unspecified / implementation-defined" | cppquiz.org (C++23 standard as the reference) |
| Technical interview (concept questions) | Explain pointers vs references, RAII, the rule of 3/5/0, move semantics, smart pointers, virtual dispatch, `map` vs `unordered_map` | techinterview.org 2025 guide, techprep.app (128 questions), The C++ Interview Book (173 questions tagged Junior / Mid / Senior) |
| Live coding (45-60 min) | Write a move-correct class, a small `unique_ptr`, a thread-safe queue, fix a leak or a dangling reference, pick the right container | techinterview.org quant guide, HFT guides |
| Code review round | Spot UB, leaks, slicing, iterator invalidation, data races, false sharing, needless copies in a given snippet | techinterview.org quant guide, quantvault low-latency questions |
| Senior / domain discussion | Virtual functions vs templates (dynamic vs static polymorphism, CRTP), memory ordering, cache behavior, exception-safety guarantees, ABI and API design; embedded: no exceptions / no heap, `volatile`, `constexpr` | HFT guides, game-dev threads, embedded interview collections, job postings |

### Formats worth simulating in the game

| Format | Game kind | Example |
|---|---|---|
| Output prediction | `predict` | `Torch a("a"); Torch b("b");` → `+a+b-b-a` (destruction order) |
| "Does it compile?" | `predict` Yes / No | `auto q = p;` where `p` is a `unique_ptr` → No |
| "Which constructor / special member runs?" | `predict` / `pick` | `const Item a; Item b = std::move(a);` → copy constructor |
| UB spotting ("Is this defined?") | `pick` / `predict` Yes / No | `int big = INT_MAX; big + 1;` → UB (signed overflow). Verified only by compiling; never used as expected runtime output |
| Fill the blank | `type` / `pick` | `void heal(int___ hp)` → `&` |
| Pick the right tool | `pick` | "Ordered iteration by key?" → `std::map` |
| Fix the bug | `run` (lessons only) | Add `virtual`, add `&`, use `std::move`, switch to `weak_ptr` |

## 2. Topics per level

| Area | Junior | Mid-level | Senior |
|---|---|---|---|
| Types, integer division, `auto`, `const` | Core | Assumed | Assumed |
| Value vs reference vs pointer, parameter passing | Core | Core (`const&`, return by value) | Assumed |
| `const` correctness (`const T*` vs `T* const`, `const` member functions) | Basic | Core | "Seniority marker" (quant guide) |
| Stack vs heap, `new`/`delete` and why to avoid them | Core | Core | Allocators, fragmentation (embedded/HFT) |
| Classes, constructors, member init list | Core | Init order, `explicit`, most vexing parse | Assumed |
| Destructors, RAII, order of destruction | Core | Core, stack unwinding | Exception-safety guarantees, constructor that throws |
| Rule of 3 / 5 / 0 | Name it | Core | Design (rule of zero by default) |
| Copy vs move, `std::move`, rvalue references | Basic idea | Core | `noexcept` moves and `vector` growth, `std::forward`, value categories, RVO / NRVO, `return std::move(x)` pessimization |
| Smart pointers | `unique_ptr` basics | `shared_ptr`/`weak_ptr`, cycles | Custom deleters, `shared_ptr` cost (control block, atomics), `make_shared` |
| Undefined behavior | Out-of-bounds, null deref | Dangling refs, uninitialized reads, signed overflow, iterator invalidation | UB vs unspecified vs implementation-defined, data races, `string_view` lifetimes |
| STL containers | `vector`, `string`, `map` | `unordered_map`, complexity, iterator invalidation, erase-remove | Cache behavior, `reserve`, choosing containers for latency |
| Algorithms + lambdas | Basic `sort` | Captures, `mutable`, `count_if`/`transform`/`accumulate` | Ranges/views, dangling captures |
| Inheritance, `virtual`, `override` / `final` | Basic | Core, vtables, abstract classes | Cost of virtual calls, CRTP / static polymorphism, virtual call in constructor, default arguments on virtuals |
| Virtual destructors, object slicing | Know the rule | Core | `shared_ptr` deleter nuance, Core Guidelines C.35 / C.67 |
| Operator overloading | Basic `+`, `<<` | `==`/`<=>` (C++20), prefix vs postfix, `const` | Hidden friends, symmetry |
| Templates | Function templates | Class templates, specialization | SFINAE, concepts, variadic templates, fold expressions, `if constexpr` |
| `constexpr` | Rare | `constexpr` vs `const` | Compile-time computation, `consteval` |
| Initialization | Brace init | Narrowing, `vector{3}` vs `vector(3)`, most vexing parse | Aggregate rules, `initializer_list` overload priority |
| Exceptions, `noexcept` | `try`/`catch` | Unwinding, `noexcept` | Guarantees (basic/strong/nothrow), `noexcept` + `terminate`, exceptions disabled (games/embedded) |
| Concurrency | Rare | `std::thread`, `join`, `mutex`, `lock_guard`, data races | Atomics, memory ordering, deadlock avoidance (`scoped_lock`), lock-free queues, false sharing |
| Modern C++17/20 | `auto`, range-for | Structured bindings, `optional`, `variant` | `string_view` pitfalls, ranges, concepts, `span`, `jthread` |

Sources for the level split: The C++ Interview Book tags each of its 173 questions Junior / Mid / Senior
across 13 parts (types and deduction, const and parameter passing, special members and rules of N,
move semantics, polymorphism, modern idioms, templates and concepts, smart pointers, containers and
algorithms, error handling and UB, a code-reading capstone). The trading-firm guides add the
hardware and memory-model layer at senior level. Job postings ask for "modern C++ (C++17/20)",
multithreading and the C++ memory model.

## 3. Industry flavors

| Industry | What is emphasized | Evidence |
|---|---|---|
| Finance / HFT | Move semantics, templates (CRTP, SFINAE, concepts), memory model, `std::atomic` and acquire/release, lock-free SPSC ring buffer, cache lines, false sharing, branch prediction, cost of virtual calls and exceptions, "spot the UB" code review, RVO and not writing `return std::move(local)` | techinterview.org quant guide, quantvault, Selby Jennings trading postings |
| Game development | vtables and the cost of virtual functions, object slicing, memory management, cache-friendly data, copies vs moves, templates pros and cons; exceptions are often disabled | gamedev.net thread, Glassdoor game developer questions, Adaface blog |
| Embedded | `volatile`, `const` vs `constexpr`, avoiding dynamic allocation (fragmentation), exceptions often disabled, fixed-size containers | embedded interview collections |
| General systems / infra | RAII, smart pointers, STL, concurrency basics, API design | techinterview.org, techprep.app, Workable senior posting |

## 4. Most-asked points, ranked

Ranking is a synthesis of how often each topic appears across the sources below (question
collections, the interview book's table of contents, vendor test descriptions, HFT and game-dev
guides). Each item links to the curriculum lesson that teaches it.

1. **Pointers vs references** (nullability, reseating, `const`) → lessons 1.2, 1.3
2. **RAII, destructors and order of destruction** → 2.2
3. **Smart pointers**: `unique_ptr` vs `shared_ptr` vs `weak_ptr`, breaking cycles → 2.4
4. **Move semantics**: rvalue references, `std::move` only casts, moved-from state → 2.3
5. **Rule of 3 / 5 / 0** → 2.3
6. **Virtual functions, vtables, `override`, pure virtual / abstract classes** → 3.2
7. **Virtual destructors** (deleting through a base pointer) → 3.3
8. **Stack vs heap, `new`/`delete` and why to avoid them** → 1.3, 2.2
9. **`const` correctness** → 1.1, 1.3, 2.1, 3.4
10. **STL container choice and complexity** (`vector`, `map` vs `unordered_map`, `deque`, `list`) → 1.4, 4.2
11. **Iterator / reference invalidation on `vector` growth** → 4.2, boss 4
12. **Undefined behavior spotting** (dangling, out of bounds, signed overflow, uninitialized, data race) → spread across 1.1, 1.3, 1.4, 2.4, 4.2-4.4, boss 4
13. **Templates**: function / class templates, specialization, SFINAE and concepts → 4.1
14. **Object slicing** → 3.3
15. **Lambdas and captures** (by value vs by reference, `mutable`, dangling captures) → 4.2
16. **Concurrency basics**: `std::thread`, `join`, `mutex`, `lock_guard`, data races, `atomic`, deadlock → 4.4
17. **Copy elision / RVO** and `return std::move(local)` → 2.3, senior exam
18. **Exceptions and `noexcept`**: unwinding, constructor that throws, `noexcept` move and `vector` → 2.2, 2.3
19. **Initialization**: brace init and narrowing, `vector{3}` vs `vector(3)`, most vexing parse, member init order → 1.1, 1.4, 2.1, 4.3
20. **Operator overloading** (`+`, `<<`, `==`, `<=>`, prefix vs postfix) → 3.4
21. **`constexpr`, `if constexpr`, `static_assert`** → 4.1
22. **`auto` and `decltype` deduction** (auto drops references and top-level `const`) → 4.3
23. **Modern C++17/20**: structured bindings, `optional`, `variant`, `string_view` pitfalls, ranges, concepts → 4.3, 4.1
24. **Senior specials**: memory ordering, false sharing, CRTP, perfect forwarding (`std::forward`), exception-safety guarantees → senior exam bank (no region)

## 5. Verification constraint for this planet

Content is compiled and executed with **GCC 14 (`g++`, Compiler Explorer id `g142`), `-std=c++20 -O1`**,
single translation unit with `int main()`, stdout captured.

- Expected outputs must be deterministic and must **not** depend on undefined, unspecified or
  implementation-defined behavior. Things to avoid as expected output: moved-from object contents
  (except where the standard guarantees them, like a `std::vector` after its move constructor), NRVO
  (not guaranteed; mandatory elision of prvalues is fine), `unordered_map` iteration order, function
  argument evaluation order, `typeid(...).name()`, exact `sizeof` of classes (use comparisons such as
  `sizeof(B) > sizeof(A)`), thread interleavings, pointer values.
- UB questions are conceptual ("Is this UB?", "Is this safe?"); the validator only proves the snippet
  **compiles** (GCC usually warns: `-Wreturn-local-addr`, `-Wterminate`, `-Wvexing-parse`), and the
  answer is anchored to cppreference's undefined behavior page.
- Every snippet in the curriculum was checked on 2026-10-06 (see the verification notes there).

## Sources

Question collections and books:
- techinterview.org, "C++ Interview Questions 2025: Smart Pointers, Move Semantics, RAII, Templates, STL, Concurrency, Virtual Functions": https://www.techinterview.org/post/3233474462/cpp-interview-questions-2025-smart-pointers-move-semantics-raii-templates-stl-concurrency-memory-model-virtual-functions/
- techinterview.org, "C++ Interview Questions: Memory, Concurrency, and Modern C++": https://www.techinterview.org/post/3233460453/cpp-interview-questions/
- techprep.app, "128 C++ Interview Questions and Answers (2026)": https://www.techprep.app/blog/cpp-interview-questions
- The C++ Interview Book (173 questions, Junior / Mid / Senior tags): https://leanpub.com/cppinterviewbook
- CppQuiz (code-reading quiz, answer categories output / compile error / UB / unspecified): https://cppquiz.org/
- Adaface, C++ interview questions: https://www.adaface.com/blog/cpp-interview-questions
- WeCreateProblems, C++ interview questions: https://www.wecreateproblems.com/interview-questions/cpp-interview-questions

Assessment vendors:
- Adaface C++ Online Test: https://www.adaface.com/fr/assessment-test/cpp-online-test
- iMocha C++ coding test (basic): https://www.imocha.io/tests/cpp-coding-test-basic
- iMocha C++ coding test (medium): https://imocha.io/tests/cpp-coding-test-medium
- iMocha C++ coding test (high): https://imocha.io/tests/cpp-coding-test-high
- iMocha C++ programming language test: https://imocha.io/tests/it-cpp-programming-language-test

Industry-specific:
- techinterview.org, "C++ for Quants: What HFT and Low-Latency Firms Test in C++ Interviews": https://www.techinterview.org/post/3233474597/cpp-quant-interviews/
- techinterview.org, "The quant developer interview loop, round by round": https://www.techinterview.org/post/3233477393/quant-developer-interview-loop/
- QuantVault, C++ low-latency interview questions: https://quantvault.org/cpp-low-latency-interview-questions.html
- Quantt, C++ quant interview questions: https://www.quantt.co.uk/resources/cpp-quant-interview-questions
- GameDev.net, game programmer interview questions thread: https://gamedev.net/forums/topic/489607-game-programmer-interview-questions/
- Glassdoor, game developer interview questions: https://static.glassdoor.com.mx/Interview/game-developer-interview-questions-SRCH_KO0,14_IP34.htm
- Embedded C interview questions (CCBP): https://www.ccbp.in/blog/articles/embedded-c-interview-questions

Job postings (requirements: modern C++17/20, multithreading, memory model, low latency, game engines):
- Selby Jennings, C++ Software Engineer, Front Office Trading Technology: https://www.selbyjennings.com/en-ca/job/cplusplus-software-engineer-front-office-trading-technology-pr598658_1784899257
- Selby Jennings, Senior C++ Software Engineer, Strategy Development: https://www.selbyjennings.com/en-ca/job/senior-cplusplus-software-engineer-strategy-development-pr557099_1776720324
- Workable, Senior C++ Software Engineer: https://jobs.workable.com/jobs/03e7ea2b-99de-444e-94d0-529025ed3617

Reference:
- cppreference, Undefined behavior: https://en.cppreference.com/w/cpp/language/ub
- cppreference, The rule of three/five/zero: https://en.cppreference.com/w/cpp/language/rule_of_three
- cppreference, Copy elision: https://en.cppreference.com/w/cpp/language/copy_elision
- cppreference, `std::vector` (iterator invalidation table): https://en.cppreference.com/w/cpp/container/vector
- cppreference, Virtual function specifier: https://en.cppreference.com/w/cpp/language/virtual
- cppreference, `std::shared_ptr` / `std::weak_ptr`: https://en.cppreference.com/w/cpp/memory/shared_ptr , https://en.cppreference.com/w/cpp/memory/weak_ptr
- cppreference, `std::basic_string_view`: https://en.cppreference.com/w/cpp/string/basic_string_view
- C++ Core Guidelines (rules cited: R.1, R.11, R.20, R.24, C.20, C.21, C.35, C.47, C.66, C.67, C.128, ES.20, ES.23, F.16, F.48, CP.20, CP.25): https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines
