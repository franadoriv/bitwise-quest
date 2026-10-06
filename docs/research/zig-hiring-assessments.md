# Zig hiring assessments: what companies test, by level

Research behind the entry exams of the Zig planet (Comptia, pack `zig`) in Bitwise Quest
(`content/zig/exams.ts`, still to be written). Goal: simulate the technical screening a company
runs when hiring Zig developers at junior, mid-level and senior level, in an arcade format
(short, timed, multiple choice). The teaching side is in [zig-curriculum.md](zig-curriculum.md).

Researched October 2026. Zig is pre-1.0 and its job market is small, so the evidence is thinner
than for Go or Rust: there are almost no vendor tests and few published interview loops. The
sources are real job postings (Bun/Oven, TigerBeetle, the Ziggit jobs board), the published
engineering styles of Zig shops (TigerBeetle's Tiger Style), interview-question collections,
and the official documentation (the 0.15.2 language reference, the 0.15 release notes,
zig.guide, Ziglings). Treat this as a synthesis, not a standard.

Every code claim in this file and in the curriculum was compiled and run with **Zig 0.15.2,
Debug mode** on Compiler Explorer (`POST https://godbolt.org/api/compiler/z0152/compile`) on
2026-10-06. That matters because Zig changes between minor versions: 0.15 replaced the I/O API
("Writergate"), made `std.ArrayList` unmanaged by default (the allocator is passed to every
call), removed `usingnamespace` and `async`/`await`, and renamed `GeneralPurposeAllocator` to
`DebugAllocator` (the old name still compiles as an alias in 0.15.2). Questions written from
0.11-0.13 tutorials are frequently wrong for 0.15.

## 1. Who hires Zig, and how they screen

| Employer type | Examples (public) | What they look for | Source evidence |
|---|---|---|---|
| JavaScript runtime / tooling | Bun (Oven) | "Experience in a systems programming language such as C, C++, Zig, Go, or Rust"; "manual memory management in large codebases"; Zig experience is a bonus ("most of Bun is written in Zig"); JS engine internals (JavaScriptCore), UNIX, networking, memory-leak debugging tooling | Bun Systems Engineer postings (YC Work at a Startup, av.vc) |
| Financial database | TigerBeetle | Tiger Style: static allocation at startup, assertions on every argument/return/invariant, explicitly sized integers (`u32`, not `usize`), bounded loops and queues, deterministic simulation testing, functions under 70 lines. Hiring is largely from the open-source contributor community | TigerBeetle blog "A Database Without Dynamic Memory Allocation"; `docs/TIGER_STYLE.md` |
| Terminals, browsers, editors | Ghostty, Lightpanda (headless browser), DOM library OSS (DockYard) | High-performance, spec-compliant code; C interop; interfacing with Swift/Kotlin/.NET; fuzzing | Ziggit jobs board posts, "Why we built Lightpanda in Zig" |
| Blockchain / infra | Syndica (Solana validator "Sig"), StarkNet Cairo VM | Networking, performance, memory layout | Ziggit "List of companies using Zig in production" |
| ML inference / startups | ZML, "Senior ML Engineer (Zig)" ($175-210k, remote US), Melbourne startup | Zig + systems + SIMD; often hiring "C/C++ engineers willing to write Zig" | Ziggit jobs board |
| Toolchain users | Uber, and reportedly Google and Cloudflare (`zig cc` for cross-compiling) | Build systems and cross-compilation, rarely Zig code itself | Ziggit production-users thread, Zig community talks |
| Game engines / embedded | Mach engine community, Defold (Zig extensions), hobby embedded (MicroZig) | Comptime, packed structs, `volatile` MMIO, freestanding targets | Ziggit, project sites |

How the screening usually works, by stage:

| Stage | Typical format | Source evidence |
|---|---|---|
| CV / portfolio filter | Open-source contributions in Zig (or C/C++/Rust) weigh more than a test; many postings are on community boards and ask candidates to "reach out" directly | Ziggit job posts (DockYard DOM library: "Please reach out to me", no agencies) |
| Systems knowledge screen | Questions about memory (stack vs heap, who frees what, leaks, use-after-free), integer overflow, pointers and slices, error handling. Usually language-agnostic systems questions plus Zig specifics | Bun requirements (manual memory management), secondtalent and codeforgeek Zig interview guides |
| Code-reading quiz (the part the game simulates) | "Does it compile?" (Zig is strict: unused locals, never-mutated `var`, unhandled error unions, non-exhaustive `switch`), "What does it print?", "Does it panic, and with what message?" | Ziglings (the whole course is "fix the broken program"), interview guides |
| Live coding (30-90 min) | Junior: FizzBuzz, reverse a string with an allocator, sum a slice, a struct with methods, a function returning an error. Mid: word count with `std.StringHashMap`, a generic function, a linked list, file I/O with `defer` cleanup, an "interface" with function pointers / `anytype`. Senior: a custom allocator, a thread-safe queue (`std.Thread.Mutex`), a comptime function, a key-value store, a state machine, `build.zig` | secondtalent Zig interview guide (junior/mid/senior challenge lists) |
| Senior design discussion | Allocation strategy (arena per request, static allocation, fixed buffers), assertion strategy, deterministic testing/fuzzing, C library integration, data-oriented layout (`MultiArrayList`, struct-of-arrays), build modes and which safety checks remain in release | Tiger Style, TigerBeetle blog, Bun/Lightpanda engineering posts |

Assessment vendors: no major vendor (HackerRank, Codility, CodeSignal) lists Zig among its
supported languages, so the "online test" stage is rare; companies that screen in code usually
use their own take-home or a live session. The game's arcade exam is therefore closest to the
code-reading part of a live interview.

## 2. Topics per level

| Area | Junior | Mid-level | Senior |
|---|---|---|---|
| `const` vs `var`, "never mutated" and "unused" compile errors, `_ = x;` | Core | Assumed | Assumed |
| Integer types with explicit widths (`u8`, `i32`, `usize`, `u3`), `comptime_int`, no implicit narrowing, `@intCast` / `@truncate` / `@as` | Core | Core | Assumed (Tiger Style: sized types everywhere) |
| Overflow is a safety-checked panic in Debug/ReleaseSafe; wrapping `+%`, saturating `+|`, `@addWithOverflow`, `std.math.add` | Know it panics | Core | Build modes (UB in ReleaseFast) |
| Signed division (`@divTrunc`, `@divFloor`, `@mod`) | Basic | Assumed | Assumed |
| Control flow: `if`/`switch`/`while`/`for` as expressions, captures, `for (0..n)`, multi-object `for`, labeled blocks and loops, `while` continue expression | Core | Assumed | Assumed |
| `switch` exhaustiveness, ranges, `else`, `unreachable` | Core | Core | Labeled switch / state machines |
| Arrays vs slices vs pointers (`[N]T`, `[]T`, `*T`, `*[N]T`, `[*]T`), `.len`, bounds-checked indexing | Arrays and slices | Core (all pointer kinds) | Alignment, `@ptrCast`, `volatile` |
| Strings are `[]const u8`; literals are `*const [N:0]u8`; `std.mem.eql`, no `==` on slices, no string `switch` | Core | Core | Sentinel-terminated C strings (`[:0]const u8`, `[*:0]u8`) |
| Optionals (`?T`, `null`, `orelse`, `.?`, `if (x) |v|`) | Core | Core | Optional pointer size (same as a pointer) |
| Error unions (`!T`, error sets, `try`, `catch`, `if/else |err|`, `switch` on errors, `@errorName`) | Basic `try`/`catch` | Core, inferred error sets, merging `||` | API error-set design |
| `defer` (LIFO, scope-based), `errdefer` | Basic order | Core (`errdefer` for cleanup on failure) | Resource-ownership patterns |
| `undefined`, safety checks, illegal behavior, build modes | What `undefined` means | Core | Core (ReleaseSafe vs ReleaseFast, `@setRuntimeSafety`) |
| Structs, default fields, methods, `self` vs `*self`, value semantics (copies) | Core | Core | Memory layout, `extern`/`packed` |
| Enums, tagged unions, `switch` with payload capture | Basic enums | Core | Data-oriented design |
| Allocators: no hidden allocation, `std.mem.Allocator` parameter, `alloc`/`free`, `create`/`destroy` | What an allocator is | Core | Custom allocators, static allocation |
| `DebugAllocator` leak detection, `ArenaAllocator`, `FixedBufferAllocator`, `page_allocator` | Basic | Core | Choosing a strategy per subsystem |
| `std.ArrayList` (0.15: unmanaged, `.empty`, allocator per call), hash maps | Rare | Core | `MultiArrayList`, capacity planning (`ensureTotalCapacity`, `appendAssumeCapacity`) |
| `comptime` values, `comptime` parameters, generics (`fn (comptime T: type)`, functions returning `type`), `@This()` | Rare | Core | Core (reflection with `@typeInfo`, `inline for`) |
| `anytype`, duck typing, `@TypeOf` | Rare | Core | Interface patterns (vtable like `std.mem.Allocator`) |
| Testing (`test` blocks, `std.testing.expect*`, `std.testing.allocator` leak checking) | `zig test` basics | Core | Fuzzing, deterministic simulation (TigerBeetle VOPR) |
| C interop (`@cImport`, `extern fn`, `callconv(.c)`, `[*c]T`, `zig cc`) | Rare | Basic | Core |
| Build system (`build.zig`, modules, cross-compilation) | `zig build run` | Basic | Core |
| Concurrency (`std.Thread`, `Mutex`, atomics) | Rare | Basic | Core |
| 0.15 I/O ("Writergate": `std.Io.Writer` with buffer, `flush`) | Rare | Know it changed | Core for library authors |
| Philosophy: no hidden control flow, no hidden allocation, no operator overloading, no exceptions, no macros | Core (talking point) | Assumed | Assumed |

Main signals from postings: manual memory management and "who owns this memory" is the
single most repeated requirement; then performance work (profiling, cache-friendly layout),
C/C++ interop, UNIX/networking, and testing discipline (assertions, fuzzing). Typical seniority
bar for paid roles: 3+ years of systems programming in any of C, C++, Rust, Zig; Zig itself is
often "a plus" that can be learned on the job.

## 3. Question formats and how they map to the game

| Format seen in assessments | Game beat | Zig example |
|---|---|---|
| Output prediction | `predict` with output options + `check.stdout` | `defer` order prints `C11 second` before `C11 first`; `@divFloor(-7, 2)` prints `-4` |
| "Does it compile?" | `predict` Yes/No + `check.compiles` | `var x: i32 = 5;` never mutated (`local variable is never mutated`); unused constant; `switch` missing an enum tag; ignoring an error union |
| "Does it panic?" (and which message) | `predict` with message options + `check.throws` | `u8` overflow: `panic: integer overflow`; `x.?` on null: `attempt to use null value`; `xs[i]` past the end: `index out of bounds: index 5, len 3` |
| Spot the bug (memory) | `pick` "which fix is right?" | Missing `defer alloc.free(buf)` → `DebugAllocator.deinit()` returns `.leak`; `defer` should be `errdefer` |
| Fill in the blank | `type` (exact token) | `try`, `orelse`, `errdefer`, `comptime`, `.?`, `+%`, `@intCast` |
| Reorder statements | `order` | `var gpa ... = .init;` → `defer _ = gpa.deinit();` → `const alloc = gpa.allocator();` → `const buf = try alloc.alloc(u8, n);` → `defer alloc.free(buf);` |
| Long coding task | Not a 30-50 s question; approximated with `run` beats in lessons and "which fix" picks in exams | |

Panic note for the verifier (verified on 0.15.2 via godbolt): a safety-check panic exits with
signal 6 (exit code 134) and its stderr line is `thread <N> panic: <message>` (the thread number
is not stable, so match only the message), followed by a stack trace with source lines. The
game's runner (`lib/runners/godbolt.ts`, `splitZig`) treats everything printed before the
panic as program output and the panic plus trace as the error, so `check.throws` should be the
message text, for example `"integer overflow"`, `"attempt to use null value"`,
`"index out of bounds"`, `"reached unreachable code"`, `"attempt to unwrap error"`,
`"integer does not fit in destination type"`, `"division by zero"`, `"invalid enum value"`,
`"access of union field"`, `"start index 3 is larger than end index 1"`.

Two traps:

1. The runner finds the panic only at the **start of a line**. If the program printed text
   without a trailing `\n` right before panicking, stderr reads `forgethread 2 panic: ...` and the
   split fails. Every print before a possible panic must end with `\n`.
2. An error that **escapes `main`** (`pub fn main() !void` + `try` on a failing call) is not a
   panic: stderr gets `error: Odd` plus a trace, exit code 1. The runner then treats the whole
   stderr as output and `throws` cannot match it. For "what happens?" questions about errors,
   catch the error and print `@errorName(err)`, or use `catch unreachable`, which panics with
   `attempt to unwrap error: Odd`.

## 4. Ranked list: most-asked Zig screening points

Ranked by how often the point appears across the sources (postings, interview guides, the
language's own documentation of its selling points, Ziglings coverage). Proposed exam topic id
in brackets.

1. Allocators and explicit memory: why functions take an `Allocator`, `alloc`/`free`, `create`/`destroy`, who frees, leaks [`allocators`]
2. Error handling: error unions, `try`, `catch`, error sets, no exceptions [`errors`]
3. `defer` vs `errdefer` and LIFO order, cleanup on the error path [`defer`]
4. `comptime` and generics: types as values, `fn (comptime T: type)`, functions returning a struct type [`comptime`]
5. Optionals vs null pointers: `?T`, `orelse`, `.?`, `if` capture [`optionals`]
6. Integer types, explicit widths, casts, overflow detection and wrapping/saturating operators [`integers`]
7. Slices vs arrays vs pointers; strings as `[]const u8`; bounds checks [`slices`]
8. Allocator kinds: `DebugAllocator` (leak detection), `ArenaAllocator`, `FixedBufferAllocator`, `page_allocator`, and when to choose each [`allocators`]
9. Safety and `undefined`: build modes, illegal behavior, `unreachable`, what is checked in Debug [`safety`]
10. Structs and methods, `self` by value vs pointer, value copies [`structs`]
11. Tagged unions and exhaustive `switch` [`unions`]
12. "No hidden control flow / no hidden allocations" philosophy compared with C, C++, Rust, Go [`basics`]
13. `const`/`var` rules and the strict compiler (unused locals, never-mutated `var`) [`basics`]
14. Control flow as expressions, labeled blocks, `for` with index and ranges [`control`]
15. C interop: `@cImport`, `extern`, sentinel-terminated strings, `zig cc` [`interop`]
16. Containers: `std.ArrayList` (0.15 unmanaged API), `std.StringHashMap`, `std.AutoHashMap` [`containers`]
17. Testing: `test` blocks, `std.testing.expect`, `std.testing.allocator` [`testing`]
18. `anytype`, `@TypeOf`, `@typeInfo`, `inline for` reflection [`comptime`]
19. Build system and cross-compilation (`build.zig`, `-target`, `-O ReleaseSafe`) [`tooling`]
20. Concurrency primitives (`std.Thread`, `Mutex`, atomics) [`tooling`]
21. 0.15 I/O changes (`std.Io.Writer` with an explicit buffer, `flush`) [`tooling`]

## 5. Proposed bank design (summary; details in the curriculum)

| Exam | Draws / bank | Pass | s/question | Topic mix |
|---|---|---|---|---|
| `junior`, Junior Zig Developer | 12 / 22 | 70% | 30 | basics 4, integers 4, control 3, slices 4, optionals 3, errors 3, defer 1 |
| `mid`, Mid-level Zig Developer | 14 / 24 | 70% | 40 | integers 2, errors 3, defer 2, safety 2, structs 3, unions 3, slices 2, allocators 3, containers 2, comptime 2 |
| `senior`, Senior Zig Developer | 15 / 26 | 75% | 50 | safety 3, unions 2, slices 2, allocators 4, containers 2, comptime 5, testing 2, interop 2, tooling 2, errors 2 |

## 6. Sources

Job postings and employers:
- Bun (Oven), Senior Systems Engineer (YC Work at a Startup): https://www.workatastartup.com/jobs/76011
- Bun, Systems Engineer (av.vc job board): https://jobs.av.vc/companies/bun-2/jobs/38172075-systems-engineer
- Bun, Systems Engineer - Developer Productivity: https://www.workatastartup.com/jobs/76764
- Ziggit jobs category (community job board): https://ziggit.dev/c/jobs/12
- Ziggit, Full-time Zig developer for a DOM library OSS project: https://ziggit.dev/t/fulltime-zig-developer-for-cutting-edge-dom-library-oss-project/12383
- Ziggit, Why we built Lightpanda in Zig: https://ziggit.dev/t/article-why-we-built-lightpanda-in-zig/13444
- Ziggit, List of companies using Zig in production: https://ziggit.dev/t/list-of-companies-using-zig-in-production/4084
- Arc.dev remote Zig jobs: https://arc.dev/remote-jobs/zig
- TigerBeetle, A Database Without Dynamic Memory Allocation: https://tigerbeetle.com/blog/2022-10-12-a-database-without-dynamic-memory/
- TigerBeetle, Tiger Style: https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md
- TigerBeetle and Synadia pledge to the Zig Software Foundation (production users): https://tigerbeetle.com/blog/2025-10-25-synadia-and-tigerbeetle-pledge-512k-to-the-zig-software-foundation/

Interview guides:
- secondtalent, Zig interview guide (junior/mid/senior challenges): https://www.secondtalent.com/interview-guide/zig/
- codeforgeek, What is Zig? Use cases and interview questions: https://codeforgeek.com/?p=37209
- Ziggit, Who frees memory when errdefer is used with an allocator: https://ziggit.dev/t/who-frees-up-memory-when-errdefer-is-used-with-allocator/1497

Assessment vendors (language support, no Zig listed):
- Codility supported technologies: https://support.codility.com/hc/en-us/articles/360043823713-What-technologies-does-Codility-support
- CodeSignal supported languages: https://support.codesignal.com/hc/en-us/articles/360039872514-What-languages-can-I-use

Official and learning references:
- Zig language reference 0.15.2: https://ziglang.org/documentation/0.15.2/
- Zig 0.15 release notes (Writergate, ArrayList unmanaged, usingnamespace and async removed): https://ziglang.org/download/0.15.1/release-notes.html
- Zig overview ("no hidden control flow", "no hidden memory allocations", build modes): https://ziglang.org/learn/overview/
- Zig standard library docs: https://ziglang.org/documentation/0.15.2/std/
- zig.guide: https://zig.guide/
- Ziglings exercises: https://codeberg.org/ziglings/exercises
