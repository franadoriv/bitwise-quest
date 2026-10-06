# Go hiring assessments: what companies test, by level

Research behind the entry exams of the Go planet (Concurra, pack `go`) in Bitwise Quest
(`content/go/exams.ts`, still to be written). Goal: simulate the technical screening a company
runs when hiring Go developers at junior, mid-level and senior level, in an arcade format
(short, timed, multiple choice). The teaching side is in [go-curriculum.md](go-curriculum.md).

Researched October 2026. The sources are public question collections, assessment vendors' test
descriptions, real job postings and the official Go documentation (Effective Go, the spec, the
Go blog, the Tour, the memory model). Interview processes vary a lot between companies: treat
this as a synthesis, not a standard.

Every code claim in this file and in the curriculum was run on the official Go Playground
(`POST https://go.dev/_/compile`, `version=2`), which reported `go1.27.1` on 2026-10-06. That
matters for two version-sensitive facts: per-iteration loop variables (Go 1.22+) and
`sync.WaitGroup.Go` (Go 1.25+).

## 1. How Go screening usually works

| Stage | Typical format | Source evidence |
|---|---|---|
| Online skills test (vendor) | 6-15 multiple-choice or code-reading questions plus 0-1 coding task, 15-60 min | Adaface (35 min: 6 Go MCQs + 1 coding question; samples on defer/panic/recover, map iteration order, defer with files, WaitGroup, mutex), TestDome (15 min tasks: implement an interface, maps, slices, goroutines), Testlify / WeCP Go tests |
| Generic algorithm test taken in Go | 1-3 coding tasks, 15-90 min | TestGorilla (entry 15 min, intermediate 35 min, debugging 35 min, data-structure tests), HackerRank tests (often 3 tasks in 90 min, candidates pick Go), CodeSignal / Codility general coding assessments |
| Code-reading quiz | Read a snippet, predict output, "does it compile?", "does it panic?", "is there a deadlock?" | Adaface sample questions, Go quiz collections, "50 Shades of Go", "100 Go Mistakes" |
| Technical interview | Explain goroutines vs threads, channels vs mutexes, nil interface trap, error wrapping, context propagation | techinterview.org, boot.dev, Adaface and TestGorilla interview question lists |
| Short live coding / debugging (30-60 min) | Fix a data race, a goroutine leak, a deadlock, a typed-nil error, a slice aliasing bug | TestGorilla debugging test, mid/senior interview guides (dev.to, secondtalent) |
| Senior design discussion | Worker pools, fan-out/fan-in, pipelines with cancellation, graceful shutdown, profiling (pprof), GC pressure, API design for libraries | techinterview.org (senior section), job postings (gRPC, Kafka, Kubernetes, high concurrency) |

## 2. Topics per level

| Area | Junior | Mid-level | Senior |
|---|---|---|---|
| Types, zero values, `var` vs `:=`, constants and `iota` | Core | Assumed | Assumed |
| Compile-time strictness (unused variables/imports, no implicit conversion, `missing return`) | Core | Assumed | Assumed |
| Functions, multiple returns, named results, closures | Core | Core | Assumed |
| Control flow (`for` is the only loop, `switch` without fallthrough, labels) | Core | Assumed | Assumed |
| Strings, bytes and runes (`len` counts bytes, `range` yields runes, immutability) | Core | Core | Assumed |
| `defer` (LIFO order, arguments evaluated at the `defer` line, modifying named results) | Basic order | Argument evaluation, named results | Cost and patterns (unlock, close, recover in servers) |
| `panic` / `recover` | What a panic is | `recover` only works in a deferred call | Panic boundaries (per-request recovery), never across goroutines |
| Arrays vs slices (value vs header), `len`/`cap`, `make` | Core | Core | Assumed |
| `append` aliasing, `copy`, full slice expression `a[lo:hi:max]` | Basic `append` must be reassigned | Aliasing after re-slicing, shared backing array | Memory retention of large backing arrays, preallocation |
| Maps (nil map write panics, comma-ok, random iteration order, not safe for concurrent writes) | Core | Core | Concurrent map writes, `sync.Map` trade-offs |
| Structs, pointers, value vs pointer receivers, method sets | Core | Core | Assumed |
| Embedding (promotion, not inheritance) | Basic | Core | Interface embedding in API design |
| Interfaces (implicit satisfaction, `any`, type assertion, type switch, `Stringer`) | Basic | Core | Small interfaces, "accept interfaces, return structs" |
| Nil interface vs typed nil | Rare | Very common | Assumed |
| Errors as values (`errors.New`, sentinels, `%w`, `errors.Is` / `errors.As`, `errors.Join`) | `if err != nil` | Wrapping and inspection | Error design across package boundaries |
| Generics (type parameters, `any`, `comparable`, union constraints, `~T`) | Rare | Core | When not to use them |
| Goroutines and `sync.WaitGroup` | What a goroutine is | Core | Leaks, bounded concurrency |
| Channels (unbuffered vs buffered, `close`, `range`, nil channel, direction types) | Basic | Core | Patterns: pipelines, fan-out/fan-in, semaphores |
| `select` (default, timeouts, nil channel cases) | Rare | Core | Core |
| Deadlocks ("all goroutines are asleep") | Recognize the simplest | Core | Diagnose from goroutine dumps |
| `sync.Mutex`, `RWMutex`, `Once`, `atomic` | Basic mutex | Core | Lock granularity, contention |
| `context` (cancellation, timeouts, values, first parameter) | Rare | Core | Propagation through a whole service |
| Data races, `-race`, memory model (happens-before) | Rare | Core | Core |
| Testing (table-driven tests, `t.Run`, benchmarks) | Table test basics | Core | Benchmarks, fuzzing, test design |
| Modules and tooling (`go mod`, `go vet`, `gofmt`, `pprof`) | `go mod init`, `go run` | `go vet`, versioning | `pprof`, escape analysis, GC tuning |
| Go 1.22 loop variable change, shadowing with `:=` | Rare | Common gotcha | Assumed (and knowing pre-1.22 code) |

Main signals from job postings (senior backend Go): concurrency patterns (goroutines,
channels, context) appear in almost every posting, followed by building gRPC/REST APIs,
performance and memory, distributed systems, SQL plus Redis, Kafka, Docker/Kubernetes and CI/CD.
Typical seniority bar: 5+ years backend, 3+ years Go.

## 3. Question formats and how they map to the game

| Format seen in assessments | Game beat | Go example |
|---|---|---|
| Output prediction | `predict` with output options + `check.stdout` | `defer` in a loop prints `2 1 0`; `fmt.Println(len("héllo"))` prints `6` |
| "Does it compile?" | `predict` Yes/No + `check.compiles` | Unused variable, unused import, `x := 2` with no new variable, `int + float64` |
| "Does it panic?" (and which message) | `predict` with message options; the run is expected to fail with that stderr text (see the panic note below) | Nil map write: `panic: assignment to entry in nil map` |
| Deadlock detection | `predict` "What happens?" with options "prints 1" / "deadlock" / "panic" | Send on an unbuffered channel with no receiver: `fatal error: all goroutines are asleep - deadlock!` |
| Spot the bug | `predict` or `pick` "which fix is right?" | Typed nil returned as `error`; value receiver that doesn't mutate; `wg` passed by value |
| Fill in the blank | `type` (exact token) | `defer`, `make`, `chan`, `%w`, `comparable`, `recover` |
| Reorder statements | `order` | `wg.Add(1)` → `go func(){ defer wg.Done() ... }()` → `wg.Wait()` |
| Long coding task | Not a 30-50 s question; approximated with `run` beats in lessons and "which fix" picks in exams | |

Panic and deadlock note for the verifier: on the Playground a panic or a deadlock produces
no `Errors` (it compiled) and the message comes as a `stderr` event, for example
`panic: runtime error: index out of range [5] with length 3` or
`fatal error: all goroutines are asleep - deadlock!`. Anything printed before the crash is still
in `stdout`. A Go runner can therefore check "panics with X" as "compiles, and stderr contains
X" (the equivalent of the JS `throws`). Alternatively, wrap the code in a function with
`defer func(){ fmt.Println("caught:", recover()) }()`, which prints for example
`caught: assignment to entry in nil map` (this does not work for `fatal error` deadlocks, which
cannot be recovered).

`go vet` findings (copying a `sync.WaitGroup`, a lost `cancel`) come back as `VetErrors` but
the program still runs, so they are not compile errors.

## 4. Ranked list: most-asked Go screening points

Ranked by how often the point appears across the sources (question lists, vendor samples,
gotcha catalogs and postings). Proposed exam topic id in brackets.

1. Goroutines vs OS threads; starting one; the main goroutine exiting early; `WaitGroup` [`goroutines`]
2. Buffered vs unbuffered channels; blocking rules; deadlock on a lone send [`channels`]
3. Closing channels: `range` over a channel, receive from closed (zero value, `ok == false`), send on closed panics, close twice panics, only the sender closes [`channels`]
4. Errors as values, `if err != nil`, wrapping with `%w`, `errors.Is` / `errors.As`, sentinel errors [`errors`]
5. Interfaces: implicit satisfaction, method sets (pointer receiver gotcha), type assertions (comma-ok vs panic), type switches, `any` [`interfaces`]
6. `defer` order (LIFO) and argument evaluation time; `defer` + `recover` [`defer_panic`]
7. Slices: `len`/`cap`, `append` must be reassigned, shared backing arrays, `copy` [`slices`]
8. Maps: nil map write panics, missing key returns zero, comma-ok, random iteration order, not safe for concurrent writes [`maps`]
9. Mutex vs channels ("share memory by communicating"); data races and `go run -race` [`sync`]
10. Nil interface vs typed nil (`error` that is not `== nil`) [`interfaces`]
11. `select`: multiplexing, `default`, timeouts with `time.After`, nil channels disable a case [`channels`]
12. `context`: cancellation, timeouts, `ctx.Err()`, first parameter, don't store in structs [`context`]
13. Pointer vs value receivers; when a method mutates [`structs`]
14. Zero values and `var` vs `:=`; shadowing [`basics`]
15. Strings, runes and bytes: `len` counts bytes, `range` decodes runes, strings are immutable [`strings`]
16. Struct embedding (composition, promotion), no inheritance [`structs`]
17. Generics: type parameters, `any` vs `comparable` vs unions, `~T` [`generics`]
18. Concurrency patterns: worker pool, fan-out/fan-in, pipeline, semaphore, goroutine leaks [`channels`, `goroutines`]
19. Loop variable capture (fixed in Go 1.22: each iteration has its own variable) [`goroutines`]
20. Table-driven tests, `t.Run`, benchmarks [`testing`]
21. Modules (`go.mod`, `go.sum`, semantic import versioning), `go vet`, `gofmt` [`tooling`]
22. Memory model and happens-before; `sync/atomic`; `sync.Once` [`sync`]
23. Runtime: scheduler (G/M/P), GC, escape analysis, `pprof`, struct field alignment [`runtime`]

## 5. Proposed bank design (summary; details in the curriculum)

| Exam | Draws / bank | Pass | s/question | Topic mix |
|---|---|---|---|---|
| `junior`, Junior Go Developer | 12 / 22 | 70% | 30 | basics 4, functions 3, strings 3, slices 4, maps 4, defer_panic 2, errors 2 |
| `mid`, Mid-level Go Developer | 14 / 24 | 70% | 40 | slices 2, structs 3, interfaces 4, errors 4, defer_panic 2, generics 2, goroutines 2, channels 3, testing 2 |
| `senior`, Senior Go Developer | 15 / 26 | 75% | 50 | interfaces 2, errors 2, generics 2, goroutines 3, channels 4, sync 4, context 3, runtime 3, tooling 1, slices 2 |

## 6. Sources

Question collections and interview guides:
- techinterview.org, Go interview questions 2025 (goroutines, channels, interfaces, errors, context, generics, patterns): https://www.techinterview.org/post/3233474456/go-golang-interview-questions-2025-goroutines-channels-interfaces-error-handling-context-generics-concurrency-patterns/
- boot.dev, Top Golang interview questions: https://blog.boot.dev/golang/top-golang-interview-questions
- Adaface, Golang interview questions: https://adaface.com/blog/golang-interview-questions
- TestGorilla, Golang interview questions: https://testgorilla.com/blog/golang-interview-questions
- techprep, 72 Golang interview questions and answers: https://www.techprep.app/blog/golang-interview-questions
- secondtalent, Advanced Golang backend interview questions for senior roles: https://secondtalent.com/?p=30892
- dev.to, How to prepare for a Golang interview (mid/senior): https://dev.to/nazar-boyko/how-to-prepare-for-a-golang-interview-a-practical-guide-for-mid-senior-engineers-200p
- Glassdoor, Golang developer interview questions: https://static.glassdoor.fr/Interview/golang-developer-interview-questions-SRCH_KO0,16_IP12.htm

Gotcha catalogs:
- 50 Shades of Go (traps for new Go developers), mirror and derivatives: https://github.com/lkumarjain/shades-of-golang
- programming.guide, Go gotchas: https://programming.guide/go/go-gotcha.html
- Teiva Harsanyi, 100 Go Mistakes and How to Avoid Them: https://100go.co/ and https://www.oreilly.com/library/view/100-go-mistakes/9781617299599/

Assessment vendors:
- Adaface Golang online test (35 min, 6 MCQ + 1 coding; samples on defer/panic/recover, maps, WaitGroup, mutex): https://www.adaface.com/assessment-test/golang-online-test
- TestGorilla Go coding tests (entry, intermediate, debugging, data structures): https://www.testgorilla.com/coding-tests/GO/
- TestGorilla Go debugging test: https://www.testgorilla.com/test-library/programming-skills-tests/go-coding-test-debugging/
- TestGorilla Go entry-level algorithms: https://testgorilla.com/test-library/programming-skills-tests/go-coding-test-entry-level-algorithms
- TestDome Go online test: https://testdome.com/tests/golang-online-test/123
- Testlify Go (Golang) test: https://testlify.com/test-library/go-golang-test
- WeCP Golang assessment: https://www.wecreateproblems.com/tests/golang-assessment-test
- SkillPanel Go coding tests: https://skillpanel.com/coding-tests-category/go/

Job postings (senior requirements):
- Senior Backend Engineer (Golang), Lever: https://jobs.lever.co/nahc/c450f877-3c66-40a6-beb6-3ee0385ae651
- Senior Go Developer, WeAreDevelopers: https://www.wearedevelopers.com/jobs/ext/7185485/senior-go-developer
- Senior Go (Golang) Developer, Djinni: https://djinni.co/jobs/729517-senior-go-golang-developer
- Senior Golang Backend Engineer, ITviec: https://itviec.com/viec-lam-it/senior-golang-backend-engineer-cong-ty-tnhh-nexlab-it-solutions-2159
- Senior Back-end Developer (Golang), ProjectDiscovery: https://remoteafrica.io/jobs/f/projectdiscovery-io-senior-back-end-developer-golang

Official references:
- Effective Go: https://go.dev/doc/effective_go
- The Go Programming Language Specification: https://go.dev/ref/spec
- A Tour of Go: https://go.dev/tour/
- Go FAQ, "Why is my nil error value not equal to nil?": https://go.dev/doc/faq#nil_error
- The Go Memory Model: https://go.dev/ref/mem
- Data Race Detector: https://go.dev/doc/articles/race_detector
- Go blog, Go Slices: usage and internals: https://go.dev/blog/slices-intro
- Go blog, Go maps in action: https://go.dev/blog/maps
- Go blog, Strings, bytes, runes and characters: https://go.dev/blog/strings
- Go blog, Defer, Panic, and Recover: https://go.dev/blog/defer-panic-and-recover
- Go blog, Working with Errors in Go 1.13: https://go.dev/blog/go1.13-errors
- Go blog, Go Concurrency Patterns: Pipelines and cancellation: https://go.dev/blog/pipelines
- Go blog, Go Concurrency Patterns: Context: https://go.dev/blog/context
- Go blog, An Introduction To Generics: https://go.dev/blog/intro-generics
- Go blog, Fixing For Loops in Go 1.22: https://go.dev/blog/loopvar-preview
- Go wiki, Table-driven tests: https://go.dev/wiki/TableDrivenTests
- Tutorial: Create a Go module: https://go.dev/doc/tutorial/create-module
