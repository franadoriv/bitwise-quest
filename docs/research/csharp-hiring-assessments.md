# C# hiring assessments: what companies test, by level

Research behind the entry exams of the C# planet of Bitwise Quest (pack `csharp`, future `content/csharp/exams.ts`).
Goal: simulate the technical screening a company runs when hiring C# / .NET developers at junior, mid-level and
senior level, in an arcade format (short, timed, multiple choice plus small "fix the code" tasks).

Researched October 2026. Sources are public interview question collections, assessment vendors' test descriptions,
real job postings (.NET backend, Unity game development, enterprise) and the official Microsoft Learn documentation.
Interview processes vary a lot between companies: treat this as a synthesis, not a standard. Every code claim used in
the curriculum ([csharp-curriculum.md](csharp-curriculum.md)) was compiled and executed on .NET 10.0.3 (CoreCLR) via
the Compiler Explorer API on 2026-10-06.

## 1. How C# screening usually works

| Stage | Typical format | Source evidence |
|---|---|---|
| Online skills test (vendor) | About 10 scenario-based MCQs plus 1 coding task, 35-40 min, entry / mid / expert variants | Adaface (40 min, 10 MCQ + 1 coding), iMocha C# 6 test (11 questions, 35 min, entry/mid/expert) |
| Coding challenge (vendor) | One algorithm, data-structure or debugging task in C#, 15-35 min | TestGorilla C# coding tests (entry-level algorithms 15 min; intermediate algorithms, debugging, stacks/queues, heaps, graphs 35 min) |
| Code-reading quiz | "What does this print?", "does this compile?", "which exception?" on a 5-15 line snippet | Most question collections (closures in loops, struct copies, deferred LINQ, `throw` vs `throw ex`) |
| Technical interview | Concept questions in a fixed rotation: type system, OOP, LINQ, async, memory | TechPrep (102 questions junior → senior), Hyring (60 questions), Zoutons (70 questions in 7 rounds) |
| Live coding / pair task (45-60 min) | Build a small API endpoint or service class; fix a deadlock (`.Result`), refactor to DI, write a LINQ query | .NET backend postings (ASP.NET Core, DI, EF Core, unit tests) |
| Senior design discussion | Async architecture, allocation and GC pressure, DI lifetimes, `IQueryable` vs `IEnumerable`, SOLID, clean architecture | Senior .NET postings (SOLID, CQRS/Mediator/Repository, profiling with BenchmarkDotNet, OpenTelemetry) |
| Unity variant | C# fundamentals plus GC allocations per frame, structs vs classes, boxing, coroutines (`IEnumerator` / `yield`), `const` vs `readonly` | Glassdoor Unity programmer reports, Braintrust and WeCreateProblems Unity question lists, Dataford |

Interviewers say they test understanding of the **type system** (value vs reference types, boxing), **async**,
**LINQ** and the **.NET runtime** rather than syntax (TechPrep, Zoutons). The vendor MCQ format (one snippet, 4
options) maps directly onto the game's `pick` / `predict` questions; the coding challenge maps onto `run` beats.

## 2. Topics per level

| Area | Junior | Mid-level | Senior |
|---|---|---|---|
| Types, variables, `var`, integer division, casts, `const` vs `readonly` | Core | Assumed | Assumed |
| Strings: immutability, interpolation, `StringBuilder` | Core | Interning, `==` vs `Equals` on `object` | `Span<char>` / `ReadOnlySpan<char>` to avoid allocations |
| Null handling: `?`, `??`, `?.`, `??=`, `Nullable<T>` | Core | Nullable reference types (NRT) warnings and annotations | NRT in API design, `!` (null-forgiving) discipline |
| Value vs reference types, struct vs class, stack vs heap | Core (copy semantics) | Boxing/unboxing cost, struct implementing an interface | `readonly struct`, `in` parameters, `ref` locals, allocation-free code |
| `ref` / `out` / `in`, `params`, optional and named arguments | `out` with `TryParse` | `ref` vs `out` rules | `in` and defensive copies, `ref` returns |
| Equality: `==`, `Equals`, `ReferenceEquals`, `GetHashCode` | `==` on strings vs objects | Equals/GetHashCode contract (`HashSet`, `Dictionary` keys) | `IEquatable<T>`, record equality pitfalls (reference-typed members) |
| OOP: classes, properties, constructors, access modifiers, `static` | Core | Static constructors, `init`, `required` | Primary constructors, immutability strategy |
| Inheritance and polymorphism: `virtual` / `override` / `new` / `sealed`, `base` | Overriding vs overloading | `new` (hiding) vs `override`, `is` / `as`, casting exceptions | Composition over inheritance, `sealed` for performance and design |
| Abstract classes vs interfaces | Know the difference | Default interface methods (C# 8+) | Diamond problem, variance (`out` / `in` type parameters) |
| Records, tuples, deconstruction, `with` | Recognize | Value equality, `record struct`, `ValueTuple` | Shallow `with` copies, records as DTOs / immutable domain types |
| Pattern matching: `is`, `switch` expressions, property and relational patterns | `is` type check | Switch expressions, `when` guards, exhaustiveness | Pattern-based dispatch design |
| Enums and `[Flags]` | Core | `HasFlag`, casting out-of-range values | Not asked |
| Generics and constraints | Benefits of generics, `List<T>` | `where T : ...` constraints, `default(T)` | Covariance/contravariance, generic math |
| Collections: `List`, `Dictionary`, `HashSet`, `Queue`, `Stack`, arrays | Core | `TryGetValue`, modifying during `foreach`, `IEnumerable` / `ICollection` / `IList` | Thread-safe collections, `List<T>` internals (capacity growth) |
| Delegates, `Func` / `Action` / `Predicate`, lambdas | Basic lambdas | Multicast delegates, events, closures | Closure capture in loops, event memory leaks |
| LINQ | `Where` / `Select` / `OrderBy`, `First` vs `FirstOrDefault` | Deferred execution, `Single`, `GroupBy`, `SelectMany`, query syntax, `yield return` | `IEnumerable` vs `IQueryable` (EF Core), multiple enumeration cost |
| Extension methods | Recognize | Write one | API design with extensions |
| Exceptions | `try` / `catch` / `finally`, catch order | `throw;` vs `throw ex;`, exception filters (`when`), custom exceptions, `InnerException` | Exception strategy, `AggregateException` |
| Resource management | `using` | `IDisposable`, `using` declarations, dispose order | Finalizer vs `IDisposable`, dispose pattern, `SafeHandle` |
| Async/await and `Task` | Know `async` / `await` exist | `Task` vs `Task<T>`, `Task.WhenAll`, exceptions through `await`, `async void` | Deadlocks with `.Result` / `.Wait()` under a sync context, `ConfigureAwait(false)`, `ValueTask`, `CancellationToken`, `IAsyncEnumerable` |
| Threads and concurrency | Not required | `Thread` vs `Task` vs thread pool | `lock`, `Interlocked`, races, concurrent collections |
| Memory and runtime | Managed vs unmanaged code, CLR | GC basics (generations), stack vs heap | GC generations / LOH, finalizers, memory leaks in managed code, JIT vs AOT |
| Dependency injection | Not required | IoC, constructor injection | DI lifetimes (singleton / scoped / transient), captive dependencies |
| Modern C# (11-14) | Not required | `required`, collection expressions, primary constructors | Source generators, interceptors (rare) |

## 3. Ranked list of most-asked points

Ranked by how many of the collected sources (question collections, vendor descriptions, job postings, Unity
reports) mention the point. "Level" is where it is first expected.

| Rank | Point | Level | Why companies ask it |
|---|---|---|---|
| 1 | Value types vs reference types; struct vs class; stack vs heap | Junior | Foundation of the type system; every collection lists it |
| 2 | async/await, `Task`, and why `.Result` / `.Wait()` can deadlock | Mid | Backend code is async end to end; deadlocks are a classic production bug |
| 3 | LINQ deferred execution (and `ToList()` to materialize) | Mid | Surprising output, repeated database queries |
| 4 | Interface vs abstract class (plus default interface methods) | Junior/Mid | OOP design |
| 5 | Boxing and unboxing | Mid | Performance, Unity GC pressure |
| 6 | `string` immutability vs `StringBuilder` | Junior | Performance in loops |
| 7 | `==` vs `Equals` (and `ReferenceEquals`, `GetHashCode`) | Mid | Bugs in dictionaries and sets |
| 8 | `throw;` vs `throw ex;` | Mid | Lost stack traces |
| 9 | `IDisposable`, `using`, finalizers vs Dispose | Mid | Resource leaks (files, connections) |
| 10 | Access modifiers; `static`; `const` vs `readonly` | Junior | Encapsulation basics |
| 11 | `virtual` / `override` / `new` / `sealed`; overriding vs overloading | Junior/Mid | Polymorphism |
| 12 | `First` vs `FirstOrDefault` vs `Single` | Junior | Exceptions on empty sequences |
| 13 | Nullable value types and nullable reference types; `?.` / `??` | Junior/Mid | `NullReferenceException` is the most common crash |
| 14 | Delegates, events, `Func` / `Action`, lambdas | Mid | Callbacks, UI and game events |
| 15 | Closures and variable capture (`for` vs `foreach`) | Mid/Senior | Classic "prints 3 3 3" puzzle |
| 16 | `ref` / `out` / `in` | Mid | Parameter passing semantics |
| 17 | Generics and constraints | Mid | Reusable code |
| 18 | Records and value equality, `with` | Mid | Modern C# DTOs |
| 19 | Garbage collection (generations, LOH) and memory leaks | Mid/Senior | Unity frame spikes, server memory |
| 20 | Dependency injection, IoC, lifetimes | Mid/Senior | ASP.NET Core is DI-based |
| 21 | Pattern matching, switch expressions | Mid | Modern idioms |
| 22 | `IEnumerable` vs `IQueryable`; `yield return` | Mid/Senior | EF Core performance |
| 23 | Extension methods | Mid | LINQ is built on them |
| 24 | `var` vs `dynamic` vs `object` | Mid | Static vs dynamic typing |
| 25 | `async void` (only for event handlers) | Mid/Senior | Unobservable, process-crashing exceptions |
| 26 | `ConfigureAwait(false)` | Senior | Library code, deadlock avoidance |
| 27 | `Span<T>` / `Memory<T>` | Senior | Allocation-free parsing |
| 28 | Thread safety: `lock`, `Interlocked`, concurrent collections | Senior | Races |
| 29 | Covariance / contravariance | Senior | Generic API design |
| 30 | Tuples (`ValueTuple`) vs `Tuple` | Mid | Multiple return values |

## 4. Facts confirmed on the runner (affect content design)

- Runner: `dotnet100csharpcoreclr` on Compiler Explorer reports `Environment.Version` = `10.0.3`.
- **Implicit usings are NOT enabled**: `List<int>` without `using System.Collections.Generic;` fails with `CS0246`;
  `.Sum()` without `using System.Linq;` fails with `CS1061`. Always write the `using` lines.
- **Nullable reference types ARE enabled** (`string s = null;` gives warning `CS8600`). Warnings do not fail the build,
  but snippets meant to be "clean" should use `string?`.
- Top-level statements work; a file without them and without `Main` gives `CS5001` (useful for compile-only checks).
- Unhandled exceptions go to **stderr** as `Unhandled exception. System.X: message` with exit code 134; earlier stdout
  lines are kept. `run` beats can rely on "the starter's stdout lacks the expected line".
- Doubles printed with `.` as the decimal separator (`3.5`) on this runner; avoid culture-sensitive output anyway
  where possible (prefer integers).

## 5. What this means for the game

- Junior exam: types and casts, strings, null operators, value vs reference copies, classes and properties,
  inheritance basics, collections, basic LINQ, try/catch.
- Mid exam: boxing, equality, records, interfaces (default methods), generics, delegates and closures, deferred
  LINQ, `throw;`, `using`, async basics (`await`, `WhenAll`, exceptions), pattern matching.
- Senior exam: deadlocks and `ConfigureAwait`, `async void`, `Span<T>`, GC and finalizers, DI lifetimes,
  `IQueryable`, thread safety, variance, `in` / `readonly struct`, interning, Equals/GetHashCode contract.
- Avoid in machine-checked questions: `Dictionary` / `HashSet` enumeration order (not guaranteed), timing races
  (`Task.Delay` interleavings with less than ~100 ms margin), finalizer timing, `GetHashCode` values, culture-specific
  formatting, exact stack traces.

## Sources

Question collections:
- TechPrep, "102 C# Interview Questions and Answers (2026)", junior / mid / senior: https://www.techprep.app/blog/c-sharp-interview-questions
- Zoutons, "70 C# Interview Questions and Answers for 2026": https://zoutons.com/news/c-sharp-interview-questions-answers-2026
- Hyring, "Top 60 C# Interview Questions (2026)": https://hyring.com/jobseeker-toolkit/interview-questions/technical/c-sharp
- Interview Kickstart, C# interview questions: https://interviewkickstart.com/blogs/interview-questions/c-sharp-interview-questions-answers
- igmGuru, C# interview questions: https://www.igmguru.com/blog/c-sharp-interview-questions

Assessment vendors:
- Adaface C# online test: https://www.adaface.com/assessment-test/c-sharp-online-test
- iMocha C# 6 online test: https://imocha.io/tests/c-sharp-6-online-test
- iMocha C# programming skills: https://www.imocha.io/pre-employment-testing/c-sharp-programming
- TestGorilla C# coding tests: https://www.testgorilla.com/coding-tests/c-hash
- TestGorilla C# entry-level algorithms: https://testgorilla.com/test-library/programming-skills-tests/c-sharp-coding-test-entry-level-algorithms
- SkillPanel C# coding tests: https://skillpanel.com/coding-tests-skill/csharp/

Job postings and role-specific reports:
- Senior .NET developer posting (C# generics, async/await, LINQ, delegates/events, ASP.NET Core DI, EF Core): https://www.bayt.com/en/uae/jobs/sr-dotnet-developer-74526633/
- .NET backend developer (ASP.NET Core) posting: https://itpro.lk/job/13399/net-backend-developer-aspnet-core-at-iykons
- Backend developer .NET Core posting: https://www.iwork4sindh.com/job/backend-developer-net-core
- Glassdoor Unity programmer interview questions (coroutines, `const` / `readonly`, GC): https://static.glassdoor.fr/Interview/unity-programmer-interview-questions-SRCH_KO0,16_IP41.htm
- Braintrust Unity developer interview questions: https://www.usebraintrust.com/hire/interview-questions/unity-developers
- WeCreateProblems Unity interview questions: https://www.wecreateproblems.com/interview-questions/unity-interview-questions
- Dataford, GC in Unity question: https://dataford.io/questions/what-are-the-performance-implications-of-frequent-garbage-collection-in-c-and-how-do-you-prevent-it-in-a-unity-environment

Official documentation (Microsoft Learn and .NET blog):
- Value types: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/value-types
- Reference types: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/reference-types
- Boxing and unboxing: https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/types/boxing-and-unboxing
- Nullable reference types: https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references
- Equality comparisons: https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/statements-expressions-operators/equality-comparisons
- Records: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record
- Method parameters (`ref`, `out`, `in`, `params`): https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/method-parameters
- Inheritance / `virtual` / `override` / `new`: https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/knowing-when-to-use-override-and-new-keywords
- Default interface methods: https://learn.microsoft.com/en-us/dotnet/csharp/advanced-topics/interface-implementation/default-interface-methods-versions
- Pattern matching: https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/functional/pattern-matching
- Generic constraints: https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/constraints-on-type-parameters
- LINQ deferred execution: https://learn.microsoft.com/en-us/dotnet/standard/linq/deferred-execution-lazy-evaluation
- Lambda expressions and captured variables: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-expressions
- Events: https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/events/
- Exception handling statements: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/exception-handling-statements
- CA2200 (rethrow to preserve stack details): https://learn.microsoft.com/dotnet/fundamentals/code-analysis/quality-rules/ca2200
- `using` statement and IDisposable: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/using
- Implement a Dispose method: https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/implementing-dispose
- Asynchronous programming with async and await: https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/
- Async/await best practices (async void, deadlocks): https://learn.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming
- ConfigureAwait FAQ: https://devblogs.microsoft.com/dotnet/configureawait-faq/
- Fundamentals of garbage collection: https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/fundamentals
- Memory and spans: https://learn.microsoft.com/en-us/dotnet/standard/memory-and-spans/
- Dependency injection in .NET: https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection
- Extension methods: https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/extension-methods
