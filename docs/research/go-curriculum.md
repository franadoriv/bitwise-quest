# Go planet (Concurra): proposed curriculum and entry exams

Curriculum for the **Go planet** (pack `go`, planet "Concurra", guide Gopi, bugs `go/nil-blob`,
`go/deadlock-snail`, `go/race-twins`; see `content/go/planet.ts`): 4 regions plus the entry exams.
It is written for a learner who may know nothing about programming, and it follows what companies
actually assess (see [go-hiring-assessments.md](go-hiring-assessments.md)). Content authors turn
this into a language pack following [../content-model.md](../content-model.md),
[../authoring-lessons.md](../authoring-lessons.md) and [../exams.md](../exams.md).

## Conventions used in this file

### How the snippets were verified

Every snippet below was compiled and run on the official Go Playground
(`curl -s -X POST https://go.dev/_/compile -d version=2 --data-urlencode body@prog.go`), which
reported `go1.27.1`, on 2026-10-06. The answers are copied from the real output.

- Snippets are shown **as the body of `func main()`** in a single-file `package main`, with the
  imports listed after `imports:` (only those, because unused imports are compile errors).
  Lines under `top:` are package-level declarations (types, funcs, vars, consts) placed above
  `func main`. When a snippet shows its own `func main`, it is the whole file.
- Short snippets are written on one line with `;`; that is valid Go as written (Go inserts the
  same semicolons itself). Authors should split them into lines for display.
- `Print`/`Println` spacing matters: `fmt.Println` puts a space between every operand;
  `fmt.Print` only adds a space between two operands when neither is a string.

### Answer tags

| Tag | Meaning | How a Go runner checks it |
|---|---|---|
| `[OUT]` | Compiles; exact stdout given (`/` separates lines) | `check: { compiles: true, stdout }` |
| `[CE]` | Does not compile; the real compiler message is quoted | `check: { compiles: false }` |
| `[PANIC]` | Compiles, then panics; stderr starts with the quoted message. Stdout printed before the panic is given too | compiles + stderr contains the message (the Go equivalent of `throws`), or wrap with `recover` and print |
| `[DEADLOCK]` | Compiles, then the runtime aborts with `fatal error: all goroutines are asleep - deadlock!` (stderr). Cannot be recovered | compiles + stderr contains `all goroutines are asleep` |
| `[FATAL]` | Other unrecoverable runtime errors (`fatal error: sync: unlock of unlocked mutex`) | compiles + stderr contains the message |
| `[TEST]` | A file with `func TestX(t *testing.T)` and **no** `main`: the Playground runs it as a test and prints `PASS` / `FAIL` lines to stdout | stdout contains `PASS` or the `t.Errorf` text |
| `[DOC]` | Concept or design rule, not machine-checkable (for example output that depends on scheduling) | cite the official page |

Determinism rules followed everywhere: no printing of map iteration order (keys are sorted
first, or the map is printed with `fmt.Println`, which sorts keys since Go 1.12); no output that
depends on which goroutine runs first; `time.After` / timeouts are deterministic on the
Playground because it uses a fake clock (still keep them generous).

### Question kinds

`pick` (one `___`, 2-4 options), `predict` (output, "Does it compile?", "What happens?"),
`type` (exact token for `___`), `order` (lines in the correct order, unique), `run` (broken
starter → expected stdout substring that the starter cannot print). Prompts are short, code at
most 12 lines.

### Visual vocabulary (existing stage effects)

The stage understands: `enter`/`exit`, `tag` (label above an actor = variable name, optional
value), `untag`, `value` (value chip), `dead` (binding invalid), `item` (sword, potion, gem,
shield, scroll, key), `give` (move item), `clone` (duplicate item), `lend` (ghost copy goes and
comes back; `mut` for a writable loan), `drop`, `attack`/`hp`, `say`, `print` (stdout), `shake`
(error), `banner`, `wait`. Actors: `hero`, `ally`, `enemy` (enemy sprites: `go/nil-blob`,
`go/deadlock-snail`, `go/race-twins`). Suggested mapping for Go:

| Go idea | On stage |
|---|---|
| Variable | `tag` above an actor; its value is a `value` chip |
| Zero value | The tag appears with a grey chip `0`, `""`, `false` or `nil` before anything is assigned |
| Copy of a value (ints, strings, arrays, structs) | `clone` the item to the other actor: changing one does not change the other |
| Slice / map / pointer / channel (header pointing at shared data) | The item stays with one actor (the backing array); the other gets a `lend` that does **not** come back: both reach the same item |
| `append` that reallocates | `clone` to a new, bigger scroll; banner "NEW ARRAY" |
| `nil` map/pointer/channel | The `go/nil-blob` enemy: touching it (`attack`) makes the stage `shake` with the panic text |
| Function call returning several values | The ally hands back two items at once (`give` twice) |
| `defer` | Items stacked on a shelf (scrolls); when the function ends they are `print`ed top-first (LIFO) |
| `panic` / `recover` | `shake` + `banner "panic: ..."`; a deferred `shield` catches it (`say "recovered"`) |
| Interface | A `shield` with a crest: any actor that knows the crest's moves can carry it (implicit satisfaction) |
| Typed nil inside an interface | The shield is carried, but the hand under it is empty: `err != nil` is true even though the pointer is nil |
| Error value | A `scroll` returned next to the result; wrapping puts the scroll inside a bigger scroll (`%w`) |
| Goroutine | A new ally `enter`s and works in parallel |
| Channel | A tunnel between actors; `give` through it. Unbuffered = hand to hand (both must meet); buffered = a box with N slots |
| Deadlock | Everyone freezes: `go/deadlock-snail` appears, `shake`, banner `all goroutines are asleep - deadlock!` |
| Data race | `go/race-twins` both grab the same item at once |
| Mutex | A `key`: only the actor holding it may touch the shared gem |
| `context` cancel | A `banner "CANCELED"`; every ally holding the context scroll `exit`s |

---

## Region plan (learning order)

Learning order: values → collections → types and errors → concurrency. Concurrency comes last
because it needs functions, closures, structs, errors and `defer`; it is also Concurra's main
story (the tower at the end).

| # | Region slug | Theme | Big idea | Lessons |
|---|---|---|---|---|
| 1 | `gopher-village` | village | Variables, zero values, functions, strings, `defer`/`panic` | 4 + boss |
| 2 | `slice-forest` | forest | Arrays, slices, maps, structs, pointers, methods | 4 + boss |
| 3 | `interface-castle` | castle | Interfaces, nil traps, embedding, errors, generics | 4 + boss |
| 4 | `channel-tower` | tower | Goroutines, channels, `select`, `context`, `sync`, races | 4 + boss |

Exam-only topics with no region yet (candidates for a future region 5, mountain theme, e.g.
`runtime-peaks`): testing, modules/tooling, runtime (scheduler, GC, escape analysis, pprof,
alignment), iterators (`iter.Seq`). Question ideas for them are in the exam section.

---

## Region 1: `gopher-village`, Variables, functions and the village rules

Sources: Tour of Go "Basics" (https://go.dev/tour/basics/1), Effective Go
(https://go.dev/doc/effective_go), spec sections "Variable declarations", "Short variable
declarations", "The zero value", "Defer statements" (https://go.dev/ref/spec), Go blog
"Strings, bytes, runes" (https://go.dev/blog/strings), "Defer, Panic, and Recover"
(https://go.dev/blog/defer-panic-and-recover).

### 1.1 `labels-and-zero-values`, "Labels and zero values"

- **Concept**: `var x int` vs `x := 5`; every type has a zero value (`0`, `""`, `false`, `nil`);
  static types and no implicit conversion; `:=` needs at least one new variable; the compiler
  rejects unused variables and imports; constants and `iota`.
- **Visual**: hero `enter`s with `tag "n"` and a grey `value "0"` (zero value). `x := 5` puts a
  fresh chip. Declaring `x :=` again makes the stage `shake` with "no new variables". An unused
  variable: the ally gets a tag but never moves, Gopi `say`s "declared and not used" and the
  ally is sent away (`exit`).
- **Questions**:
  1. predict: `var n int; var s string; var b bool; fmt.Println(n, s == "", b)` (imports: fmt) → `0 true false` [OUT]
  2. predict: `x := 5; x = x + 2; fmt.Println(x)` → `7` [OUT]
  3. predict "Does it compile?": `x := 1; x := 2; fmt.Println(x)` → No: `no new variables on left side of :=` [CE]
  4. predict "Does it compile?": `x := 1; y := 2; fmt.Println(x)` → No: `declared and not used: y` [CE]
  5. predict: `a, b := 1, 2; b, c := 3, 4; fmt.Println(a, b, c)` → `1 3 4` (compiles: `c` is new, `b` is only reassigned) [OUT]
  6. predict "Does it compile?": `var a int = 3; var b float64 = 1.5; fmt.Println(a + b)` → No: `invalid operation: a + b (mismatched types int and float64)`; the fix `float64(a) + b` prints `4.5` [CE]
  7. predict: `fmt.Println(7/2, 7.0/2, 7%3)` → `3 3.5 1` [OUT]
  8. predict: `a, b := 1, 2; a, b = b, a; fmt.Println(a, b)` → `2 1` [OUT]
  9. predict: `fmt.Printf("%T %T %T %T\n", 42, 3.14, 'a', "a")` → `int float64 int32 string` (a rune is an `int32`) [OUT]
  10. predict: top: `const ( Red = iota; Green; Blue )`, body `fmt.Println(Red, Green, Blue)` → `0 1 2` [OUT]
  11. predict "Does it compile?": imports `fmt`, `os`; body `fmt.Println("hi")` → No: `"os" imported and not used` [CE]
  12. predict "Does it compile?": `x := 10; x = "ten"` → No: `cannot use "ten" (untyped string constant) as int value in assignment` [CE]
  13. type: `var p *int; fmt.Println(p == ___)` printing `true` → `nil` [OUT]
- **Run**: starter
  ```go
  level := 1
  level := level + 1
  fmt.Println("level:", level)
  ```
  → compile error `no new variables on left side of :=`. Solution: `level = level + 1`.
  `expect`: `level: 2`. [CE → OUT]

### 1.2 `functions-and-loops`, "Functions that return two things"

- **Concept**: `func` with typed parameters; multiple return values; the blank identifier `_`;
  named results and bare `return`; `for` is the only loop (three forms plus `range` over an int
  since Go 1.22); `if` with an init statement and its scope; `switch` breaks by default
  (`fallthrough` is explicit); tagless `switch`; closures keep their variables.
- **Visual**: the ally is a function: hero `give`s two chips (17, 5), the ally `give`s back two
  chips (3 and 2). `_` is a trash can that eats a returned chip (`drop`). The closure counter is
  an ally carrying a backpack `scroll` with `c` written on it; each call adds a tally.
- **Questions**:
  1. predict: top: `func divmod(a, b int) (int, int) { return a / b, a % b }`, body `q, r := divmod(17, 5); fmt.Println(q, r)` → `3 2` [OUT]
  2. predict "Does it compile?": same `divmod`, body `q := divmod(17, 5); fmt.Println(q)` → No: `assignment mismatch: 1 variable but divmod returns 2 values` [CE]
  3. pick: `___, r := divmod(17, 5); fmt.Println(r)` options `_` / `nil` / `void` → `_` (prints `2`) [OUT]
  4. predict: top: `func five() (x int) { x = 5; return }`, body `fmt.Println(five())` → `5` [OUT]
  5. predict: `sum := 0; for i := 1; i <= 4; i++ { sum += i }; fmt.Println(sum)` → `10` [OUT]
  6. predict: `n := 1; for n < 100 { n *= 3 }; fmt.Println(n)` → `243` ("while" is spelled `for`) [OUT]
  7. predict: `switch x := 2; x { case 1: fmt.Println("one"); case 2: fmt.Println("two"); case 3: fmt.Println("three") }` → `two` (no fall-through) [OUT]
  8. predict: `switch 1 { case 1: fmt.Println("a"); fallthrough; case 2: fmt.Println("b"); case 3: fmt.Println("c") }` → `a` / `b` [OUT]
  9. predict "Does it compile?": `if v := 10; v > 5 { fmt.Println("big") }; fmt.Println(v)` → No: `undefined: v` (v lives only inside the `if`) [CE]
  10. predict: top: `func counter() func() int { c := 0; return func() int { c++; return c } }`, body `next := counter(); next(); next(); fmt.Println(next())` → `3` [OUT]
  11. predict "Does it compile?": top: `func sign(x int) int { if x > 0 { return 1 } }` → No: `missing return` [CE]
  12. predict: `x := 1; if true { x := 2; x++ }; fmt.Println(x)` → `1` (inner `x` shadows) [OUT]
  13. predict: `for i := range 3 { fmt.Print(i, " ") }` → `0 1 2` (trailing space; range over int, Go 1.22+) [OUT]
- **Run**: starter
  ```go
  // top:
  func minMax(xs []int) (int, int) {
      lo, hi := xs[0], xs[0]
      for _, x := range xs {
          if x < lo { lo = x }
          if x > hi { hi = x }
      }
      return lo
  }
  // main:
  lo, hi := minMax([]int{4, 9, 1, 7})
  fmt.Println("min:", lo, "max:", hi)
  ```
  → compile error `not enough return values` (have (int), want (int, int)). Solution:
  `return lo, hi`. `expect`: `min: 1 max: 9`. [CE → OUT]

### 1.3 `runes-and-bytes`, "Strings are bytes, letters are runes"

- **Concept**: a `string` is an immutable sequence of bytes (usually UTF-8); `len` counts
  bytes; indexing gives a `byte` (`uint8`); `range` over a string decodes runes (`int32`) and
  gives byte offsets; `[]rune(s)` / `utf8.RuneCountInString`; `[]byte(s)` is a mutable copy;
  no implicit number-to-string (`strconv.Itoa`); the `strings` package.
- **Visual**: a string is a `scroll` cut into byte squares; "é" takes two squares. `range`
  walks letter by letter, the hero `say`s the offset (0, 1, 3). Trying to write into the scroll
  makes it `shake` (immutable); `[]byte(s)` `clone`s it into a writable copy.
- **Questions**:
  1. predict: `s := "héllo"; fmt.Println(len(s), len([]rune(s)))` → `6 5` [OUT]
  2. predict: imports fmt, unicode/utf8; `fmt.Println(utf8.RuneCountInString("héllo"))` → `5` [OUT]
  3. predict: `s := "go"; fmt.Println(s[0], string(s[0]))` → `103 g` (indexing gives a byte) [OUT]
  4. predict "Does it compile?": `s := "hi"; s[0] = 'H'; fmt.Println(s)` → No: `cannot assign to s[0] (neither addressable nor a map index expression)` [CE]
  5. predict: `for i, r := range "aé!" { fmt.Printf("%d:%c ", i, r) }` → `0:a 1:é 3:!` (offsets are bytes) [OUT]
  6. predict: `b := []byte("abc"); b[0] = 'X'; fmt.Println(string(b))` → `Xbc` [OUT]
  7. predict: `var r rune = 'A'; fmt.Println(r, string(r))` → `65 A` [OUT]
  8. predict "Does it compile?": `n := 42; s := "n=" + n; fmt.Println(s)` → No: `invalid operation: "n=" + n (mismatched types untyped string and int)` [CE]
  9. pick: imports fmt, strconv; `fmt.Println(strconv.___(42) + "!")` options `Itoa` / `Atoi` / `String` → `Itoa`, prints `42!` [OUT]
  10. predict: imports fmt, strings; `fmt.Println(strings.Repeat("ab", 3), strings.Contains("gopher", "ph"), strings.Split("a,b,c", ","))` → `ababab true [a b c]` [OUT]
  11. predict: `s := "héllo"; fmt.Println(s[1:3] == "é")` → `true` (é is bytes 1 and 2) [OUT]
- **Run**: starter (reverses bytes, breaks the "ñ")
  ```go
  s := "añb"
  b := []byte(s)
  for i, j := 0, len(b)-1; i < j; i, j = i+1, j-1 {
      b[i], b[j] = b[j], b[i]
  }
  fmt.Println("reversed:", string(b))
  ```
  prints `reversed: b` followed by two invalid bytes and `a`. Solution: use `r := []rune(s)` and
  swap runes. `expect`: `reversed: bña`. [OUT → OUT]

### 1.4 `defer-and-panic`, "Defer, panic and recover"

- **Concept**: `defer` runs a call when the surrounding function returns, in LIFO order; the
  deferred call's **arguments are evaluated at the `defer` line**, a deferred closure reads
  variables at the end; deferred funcs can change named results; `panic` unwinds and still runs
  defers; `recover` only works inside a deferred function; runtime panics (index out of range,
  nil map write, integer divide by zero); constant mistakes are compile errors instead.
- **Visual**: each `defer` puts a scroll on a shelf; when the function ends the shelf is
  emptied top-first, each scroll `print`s. `defer fmt.Println(x)` takes a photo of `x` (a cloned
  chip) when shelved. A panic is the `go/nil-blob` `attack`ing: `shake`, banner with the panic
  text; a deferred `shield` with `recover` blocks it and the hero `say`s "recovered".
- **Questions**:
  1. predict: `defer fmt.Println("world"); fmt.Println("hello")` → `hello` / `world` [OUT]
  2. predict: `for i := 0; i < 3; i++ { defer fmt.Print(i, " ") }` → `2 1 0` (trailing space) [OUT]
  3. predict: `x := 1; defer fmt.Println("deferred:", x); x = 2; fmt.Println("now:", x)` → `now: 2` / `deferred: 1` (argument evaluated at the defer line) [OUT]
  4. predict: `x := 1; defer func() { fmt.Println("deferred:", x) }(); x = 2; fmt.Println("now:", x)` → `now: 2` / `deferred: 2` (closure reads x at the end) [OUT]
  5. predict: top: `func f() (n int) { defer func() { n *= 2 }(); return 3 }`, body `fmt.Println(f())` → `6` [OUT]
  6. predict: top: `func safe() (msg string) { defer func() { if r := recover(); r != nil { msg = fmt.Sprint("recovered: ", r) } }(); panic("boom") }`, body `fmt.Println(safe())` → `recovered: boom` [OUT]
  7. predict "What happens?": `defer fmt.Println("cleanup"); fmt.Println("start"); panic("boom")` → stdout `start` / `cleanup`, then `panic: boom` [PANIC]
  8. predict "What happens?": `xs := []int{1, 2, 3}; fmt.Println(xs[5])` → compiles, `panic: runtime error: index out of range [5] with length 3` [PANIC]
  9. predict "Does it compile?": `a := [3]int{1, 2, 3}; fmt.Println(a[5])` → No: `invalid argument: index 5 out of bounds [0:3]` (array length is known at compile time; pair with Q8) [CE]
  10. predict: `fmt.Println(recover())` → `<nil>` (not in a deferred call, not panicking) [OUT]
  11. predict "What happens?": `a, b := 1, 0; fmt.Println(a / b)` → `panic: runtime error: integer divide by zero`; while `fmt.Println(1 / 0)` is `invalid operation: division by zero` [CE] [PANIC]
- **Run**: starter
  ```go
  // top:
  func safeDiv(a, b int) (q int, ok bool) {
      q = a / b
      return q, true
  }
  // main:
  q, ok := safeDiv(7, 2)
  fmt.Println("ok:", ok, "q:", q)
  q, ok = safeDiv(7, 0)
  fmt.Println("ok:", ok, "q:", q)
  ```
  prints `ok: true q: 3` then `panic: runtime error: integer divide by zero`. Solution: add as
  the first line of `safeDiv`: `defer func() { if r := recover(); r != nil { ok = false } }()`.
  Output `ok: true q: 3` / `ok: false q: 0`. `expect`: `ok: false`. [PANIC → OUT]

### Boss: `village-boss`, "The Nil Blob's riddles" (enemy `go/nil-blob`)

Timed mix of region 1, 6-8 questions. New ones:

1. predict: `for i := 0; i < 3; i++ { defer func() { fmt.Print(i) }() }` → `210` (Go 1.22+: each iteration has its own `i`; before Go 1.22 it printed `333`) [OUT]
2. predict: `var s []int; var m map[string]int; fmt.Println(s == nil, m == nil, len(s), len(m))` → `true true 0 0` [OUT]
3. predict: top: `func split(sum int) (x, y int) { x = sum * 4 / 9; y = sum - x; return }`, body `fmt.Println(split(17))` → `7 10` (Tour of Go example) [OUT]
4. predict: top: `func trace(s string) string { fmt.Println("enter", s); return s }` and `func un(s string) { fmt.Println("leave", s) }`, body `defer un(trace("a")); fmt.Println("in a")` → `enter a` / `in a` / `leave a` (Effective Go example: arguments run immediately) [OUT]
5. Reuse from lessons: 1.1 Q4, 1.2 Q9, 1.3 Q1, 1.4 Q3.

---

## Region 2: `slice-forest`, Collections and structs

Sources: Go blog "Go Slices: usage and internals" (https://go.dev/blog/slices-intro), "Arrays,
slices (and strings): The mechanics of append" (https://go.dev/blog/slices), "Go maps in action"
(https://go.dev/blog/maps), Tour "More types" (https://go.dev/tour/moretypes/1), Effective Go
"Methods: pointers vs. values".

### 2.1 `arrays-and-slices`, "Fixed chests and magic scrolls"

- **Concept**: arrays have a fixed length that is part of the type and are **values** (copied
  on assignment and when passed); a slice is a small header (pointer, len, cap) over a backing
  array, so copying a slice shares the elements; `make([]T, len, cap)`; slicing `a[lo:hi]`
  shares memory; nil slice has len 0; slices are only comparable to `nil`.
- **Visual**: an array is a chest that gets `clone`d when given away. A slice is a `scroll`
  that stays with the ally (backing array) while the hero holds a window onto it: `lend`
  without return. Writing through either view changes the same scroll.
- **Questions**:
  1. predict: `a := [3]int{1, 2, 3}; b := a; b[0] = 9; fmt.Println(a[0], b[0])` → `1 9` [OUT]
  2. predict: `a := []int{1, 2, 3}; b := a; b[0] = 9; fmt.Println(a[0], b[0])` → `9 9` [OUT]
  3. predict: `s := make([]int, 3, 5); fmt.Println(len(s), cap(s), s)` → `3 5 [0 0 0]` [OUT]
  4. predict: `a := []int{0, 1, 2, 3, 4}; s := a[1:3]; fmt.Println(s, len(s), cap(s))` → `[1 2] 2 4` [OUT]
  5. predict: `var s []int; fmt.Println(s == nil, len(s), s)` → `true 0 []` [OUT]
  6. predict "Does it compile?": `var a [3]int; var b [4]int; a = b; fmt.Println(a)` → No: `cannot use b (variable of type [4]int) as [3]int value in assignment` [CE]
  7. predict: top: `func zeroS(s []int) { s[0] = 0 }` and `func zeroA(a [2]int) { a[0] = 0 }`, body `x := []int{5, 6}; y := [2]int{5, 6}; zeroS(x); zeroA(y); fmt.Println(x, y)` → `[0 6] [5 6]` [OUT]
  8. predict: `s := []int{1, 2, 3}; fmt.Println(s[1:], s[:1], s[:])` → `[2 3] [1] [1 2 3]` [OUT]
  9. predict "Does it compile?": `a := []int{1}; b := []int{1}; fmt.Println(a == b)` → No: `invalid operation: a == b (slice can only be compared to nil)`; with arrays `[2]int{1, 2} == [2]int{1, 2}` compiles and is `true` [CE]
  10. type: `a := [___]string{"x", "y", "z"}; fmt.Println(len(a))` printing `3` → `...` [OUT]
- **Run**: starter
  ```go
  // top:
  func fill(a [3]int) {
      for i := range a { a[i] = 7 }
  }
  // main:
  var a [3]int
  fill(a)
  fmt.Println("filled:", a)
  ```
  prints `filled: [0 0 0]` (the array was copied). Solution: `func fill(a []int)` and call
  `fill(a[:])`. `expect`: `filled: [7 7 7]`. [OUT → OUT]

### 2.2 `append-and-copy`, "Append, aliasing and copy"

- **Concept**: `append` returns a new slice header and must be reassigned; if there is spare
  capacity it writes into the **same** backing array (aliasing), otherwise it allocates a new
  one; re-slicing then appending can overwrite the original; `copy(dst, src)` copies
  `min(len(dst), len(src))` elements; full slice expression `a[lo:hi:max]` limits capacity;
  `range` gives copies of elements; `append(s, t...)`; the `slices` package.
- **Visual**: appending with room left writes on the same scroll (both actors see the new line);
  with no room, the scroll is `clone`d into a bigger one, banner "NEW ARRAY", and the old
  holder keeps the old scroll.
- **Questions**:
  1. predict: `s := []int{1, 2}; s = append(s, 3); fmt.Println(s, len(s))` → `[1 2 3] 3` [OUT]
  2. predict "Does it compile?": `s := []int{1, 2}; append(s, 3); fmt.Println(s)` → No: `append(s, 3) (value of type []int) is not used` [CE]
  3. predict: `a := make([]int, 3, 10); b := append(a, 1); c := append(a, 2); fmt.Println(b[3], c[3])` → `2 2` (same backing array) [OUT]
  4. predict: `a := []int{1, 2, 3}; b := append(a, 4); b[0] = 9; fmt.Println(a[0], b[0])` → `1 9` (cap was 3, append reallocated) [OUT]
  5. predict: `a := []int{1, 2, 3, 4}; s := a[:2]; s = append(s, 99); fmt.Println(a)` → `[1 2 99 4]` [OUT]
  6. predict: `a := []int{1, 2, 3, 4}; s := a[:2:2]; s = append(s, 99); fmt.Println(a, s)` → `[1 2 3 4] [1 2 99]` [OUT]
  7. predict: `dst := make([]int, 2); n := copy(dst, []int{7, 8, 9}); fmt.Println(n, dst)` → `2 [7 8]` [OUT]
  8. predict: `var dst []int; n := copy(dst, []int{1, 2}); fmt.Println(n, dst)` → `0 []` [OUT]
  9. predict: `xs := []int{1, 2, 3}; for _, x := range xs { x *= 10 }; fmt.Println(xs)` → `[1 2 3]` (compiles; `x` is a copy) [OUT]; the fix `for i := range xs { xs[i] *= 10 }` prints `[10 20 30]`
  10. predict: `s := []int{1, 2, 3, 4, 5}; s = append(s[:1], s[2:]...); fmt.Println(s)` → `[1 3 4 5]` (delete index 1) [OUT]
  11. predict: imports fmt, slices; `s := []int{3, 1, 2}; slices.Sort(s); fmt.Println(s, slices.Contains(s, 2), slices.Index(s, 3))` → `[1 2 3] true 2` [OUT]
- **Run**: starter
  ```go
  // top:
  func add(s []int, v int) {
      s = append(s, v)
  }
  // main:
  s := []int{1}
  add(s, 2)
  fmt.Println("len:", len(s), s)
  ```
  prints `len: 1 [1]`. Solution: `func add(s []int, v int) []int { return append(s, v) }` and
  `s = add(s, 2)`. `expect`: `len: 2`. [OUT → OUT]

### 2.3 `maps`, "The map of the forest"

- **Concept**: `map[K]V` literals and `make`; a missing key returns the zero value; comma-ok
  `v, ok := m[k]`; `delete` (no-op on missing keys); a nil map can be read but **writing panics**;
  iteration order is unspecified (randomized), so sort keys for stable output (`fmt.Println`
  prints maps sorted); maps are reference-like (a function can add keys); keys must be
  comparable (no slices); map elements are not addressable (`m[k].X = 1` fails); maps are not
  safe for concurrent writes (covered in region 4).
- **Visual**: a map is a `scroll` with labelled pockets; asking for a missing pocket returns a
  grey zero chip; comma-ok makes the ally `say` "found?" yes/no. A `var m map...` is the
  `go/nil-blob`: reading gives zero, writing makes it `attack` with
  `panic: assignment to entry in nil map`.
- **Questions**:
  1. predict: `m := map[string]int{"a": 1}; m["b"] = 2; fmt.Println(len(m), m["b"], m["zzz"])` → `2 2 0` [OUT]
  2. predict: `m := map[string]int{"a": 0}; v, ok := m["a"]; w, ok2 := m["zzz"]; fmt.Println(v, ok, w, ok2)` → `0 true 0 false` [OUT]
  3. predict: `var m map[string]int; fmt.Println(m["x"], len(m), m == nil)` → `0 0 true` [OUT]
  4. predict "What happens?": `var m map[string]int; m["x"] = 1; fmt.Println(m)` → `panic: assignment to entry in nil map` [PANIC]
  5. predict: `m := map[string]int{"a": 1, "b": 2}; delete(m, "a"); delete(m, "nope"); fmt.Println(len(m))` → `1` [OUT]
  6. pick: imports fmt, sort. `keys := make([]string, 0, len(m)); for k := range m { keys = append(keys, k) }; sort.___(keys); fmt.Println(keys)` with `m := map[string]int{"b": 2, "a": 1, "c": 3}` options `Strings` / `Ints` / `Keys` → `Strings`, prints `[a b c]` [OUT]
  7. predict: `m := map[string]int{"b": 2, "a": 1, "c": 3}; fmt.Println(m)` → `map[a:1 b:2 c:3]` (fmt sorts keys; a `for range` loop would not) [OUT]
  8. predict: top: `func add(m map[string]int) { m["x"] = 1 }`, body `m := map[string]int{}; add(m); fmt.Println(len(m))` → `1` [OUT]
  9. predict "Does it compile?": top: `type Point struct{ X, Y int }`, body `m := map[string]Point{"p": {1, 2}}; m["p"].X = 5` → No: `cannot assign to struct field m["p"].X in map`; fix: copy out, change, store back → `map[p:{5 2}]` [CE]
  10. predict "Does it compile?": `m := map[[]int]string{}` → No: `invalid map key type []int` (array keys like `[2]int` are fine) [CE]
  11. predict: imports fmt, strings; `counts := map[string]int{}; for _, w := range strings.Fields("a b a c a") { counts[w]++ }; fmt.Println(counts["a"], counts["b"], counts["z"])` → `3 1 0` [OUT]
  12. predict: imports fmt, maps, slices; `m := map[string]int{"b": 2, "a": 1}; fmt.Println(slices.Sorted(maps.Keys(m)))` → `[a b]` [OUT]
- **Run**: starter
  ```go
  var seen map[string]bool
  for _, w := range []string{"go", "hi", "go"} {
      seen[w] = true
  }
  fmt.Println("unique:", len(seen))
  ```
  → `panic: assignment to entry in nil map`. Solution: `seen := make(map[string]bool)` (or
  `map[string]bool{}`). `expect`: `unique: 2`. [PANIC → OUT]

### 2.4 `structs-and-methods`, "Structs, pointers and receivers"

- **Concept**: `type P struct{ X, Y int }`, literals, zero struct, `%+v`; structs are values
  (copied); `&` and `*`, pointer auto-dereference for fields (`r.X`); `new`; returning a pointer
  to a local is safe (escape analysis); nil pointer dereference panics; struct equality; methods
  with **value receivers** work on a copy, **pointer receivers** mutate (Go takes `&c`
  automatically for addressable variables, but not for temporary values); a struct containing a
  slice still shares the slice's elements; `range` over a slice of structs copies each struct.
- **Visual**: a struct is a `gem` with engraved fields. Value receiver: the method ally gets a
  `clone` and polishes the copy, the hero's gem is unchanged. Pointer receiver: `lend` with
  `mut: true`, the change sticks. Nil pointer: the hero reaches for an empty hand, `go/nil-blob`
  `attack`s.
- **Questions**:
  1. predict: top: `type P struct{ X, Y int }`, body `p := P{1, 2}; q := p; q.X = 9; r := &p; r.Y = 7; fmt.Println(p, q)` → `{1 7} {9 2}` [OUT]
  2. predict: `var p P; fmt.Println(p); fmt.Printf("%+v\n", P{1, 2})` → `{0 0}` / `{X:1 Y:2}` [OUT]
  3. predict: top: `type Counter struct{ n int }`, `func (c Counter) IncV() { c.n++ }`, `func (c *Counter) IncP() { c.n++ }`; body `var c Counter; c.IncV(); fmt.Println(c.n); c.IncP(); fmt.Println(c.n)` → `0` / `1` [OUT]
  4. predict: `p := new(int); *p = 3; fmt.Println(*p)` → `3` [OUT]
  5. predict "What happens?": `var p *P; fmt.Println(p.X)` → `panic: runtime error: invalid memory address or nil pointer dereference` [PANIC]
  6. predict: `fmt.Println(P{1, 2} == P{1, 2})` → `true` [OUT]
  7. predict: top: `func newP() *P { p := P{1, 2}; return &p }`, body `fmt.Println(newP(), *newP())` → `&{1 2} {1 2}` (safe: the compiler moves `p` to the heap) [OUT]
  8. predict: top: `func double(n *int) { *n *= 2 }`, body `x := 4; double(&x); fmt.Println(x)` → `8` [OUT]
  9. predict "Does it compile?": (no imports) top: `type Counter struct{ n int }`, `func (c *Counter) Inc() { c.n++ }`; body `Counter{}.Inc()` → No: `cannot call pointer method Inc on Counter` (a literal is not addressable) [CE]
  10. predict: top: `type Box struct{ items []string }`, body `a := Box{items: []string{"gem"}}; b := a; b.items[0] = "key"; fmt.Println(a.items[0])` → `key` (the struct copy shares the slice) [OUT]
  11. predict: top: `type User struct{ Name string }`, body `users := []User{{"ann"}, {"bob"}}; for _, u := range users { u.Name = "x" }; fmt.Println(users)` → `[{ann} {bob}]` [OUT]
- **Run**: starter
  ```go
  // top:
  type Account struct{ balance int }
  func (a Account) Deposit(n int) { a.balance += n }
  // main:
  acc := Account{balance: 100}
  acc.Deposit(50)
  fmt.Println("balance:", acc.balance)
  ```
  prints `balance: 100`. Solution: pointer receiver `func (a *Account) Deposit(n int)`.
  `expect`: `balance: 150`. [OUT → OUT]

### Boss: `forest-boss`, "The Alias Hydra"

1. predict: `s := []int{1, 2, 3}; t := s[:0]; for _, v := range s { if v != 2 { t = append(t, v) } }; fmt.Println(s, t)` → `[1 3 3] [1 3]` (in-place filter reuses the backing array) [OUT]
2. predict: `s := make([]int, 0, 1); fmt.Println(len(s), cap(s)); s = append(s, 1, 2); fmt.Println(len(s), cap(s) >= 2)` → `0 1` / `2 true` (exact growth is an implementation detail: never quiz exact `cap` after growth) [OUT]
3. predict: `grid := make([][]int, 2); fmt.Println(grid[0] == nil, len(grid))` → `true 2` [OUT]
4. predict: `s := []int{1, 2, 3}; s = append(s, s...); fmt.Println(s)` → `[1 2 3 1 2 3]` [OUT]
5. predict: `m := map[[2]int]string{{0, 0}: "origin"}; fmt.Println(m[[2]int{0, 0}])` → `origin` [OUT]
6. predict: `s := make([]int, 2, 3); t := append(s, 5); u := append(s, 6); fmt.Println(t, u, len(s))` → `[0 0 6] [0 0 6] 2` [OUT]
7. Reuse: 2.2 Q5, 2.3 Q4, 2.4 Q3.

---

## Region 3: `interface-castle`, Interfaces, errors and generics

Sources: Tour "Methods and interfaces" (https://go.dev/tour/methods/1), Effective Go
"Interfaces and other types" and "Embedding", Go FAQ "Why is my nil error value not equal to
nil?" (https://go.dev/doc/faq#nil_error), Go blog "Working with Errors in Go 1.13"
(https://go.dev/blog/go1.13-errors), "Error handling and Go"
(https://go.dev/blog/error-handling-and-go), "An Introduction To Generics"
(https://go.dev/blog/intro-generics), Tutorial "Getting started with generics"
(https://go.dev/doc/tutorial/generics).

### 3.1 `implicit-interfaces`, "Shields with a crest"

- **Concept**: an interface is a set of methods; a type satisfies it implicitly by having the
  methods (no `implements`); method sets: a pointer-receiver method belongs to `*T`, not `T`;
  `any` (= `interface{}`) holds any value; type assertion `x.(T)` panics on mismatch, comma-ok
  form doesn't; type switch; `fmt.Stringer`; interface values compare by dynamic type and value
  (comparing uncomparable dynamic types panics); compile-time check `var _ Shape = Sq{}`.
- **Visual**: the interface is a `shield` with a crest (method names). Any actor that knows the
  moves can pick it up, no paperwork. If the method lives on the pointer (`*Duck`), only the
  actor holding a `key` (an address) can lift the shield, a bare `Duck{}` makes it `shake`.
  Type assertion: Gopi peeks under the shield, a wrong guess `shake`s with "interface conversion".
- **Questions**:
  1. predict: top: `type Shape interface{ Area() int }`, `type Sq struct{ s int }`, `func (q Sq) Area() int { return q.s * q.s }`; body `var sh Shape = Sq{3}; fmt.Println(sh.Area())` → `9` [OUT]
  2. predict "Does it compile?": top: `type Speaker interface{ Speak() string }`, `type Rock struct{}`; body `var s Speaker = Rock{}; fmt.Println(s)` → No: `Rock does not implement Speaker (missing method Speak)` [CE]
  3. predict "Does it compile?": top: `type Duck struct{}`, `func (d *Duck) Speak() string { return "quack" }`; body `var s Speaker = Duck{}` → No: `Duck does not implement Speaker (method Speak has pointer receiver)` [CE]
  4. predict: `var x any = "hi"; s, ok := x.(string); n, ok2 := x.(int); fmt.Println(s, ok, n, ok2)` → `hi true 0 false` [OUT]
  5. predict "What happens?": `var x any = "hi"; n := x.(int); fmt.Println(n)` → `panic: interface conversion: interface {} is string, not int` [PANIC]
  6. predict: top: `func describe(v any) string { switch t := v.(type) { case int: return fmt.Sprint("int ", t*2); case string: return "string " + t; default: return "other" } }`; body `fmt.Println(describe(21), describe("go"), describe(1.5))` → `int 42 string go other` [OUT]
  7. predict: top: `type Temp int`, `func (t Temp) String() string { return fmt.Sprintf("%d°C", int(t)) }`; body `fmt.Println(Temp(21))` → `21°C` (fmt uses `String()`) [OUT]
  8. predict: `vals := []any{1, "a", true, nil}; fmt.Println(len(vals), vals)` → `4 [1 a true <nil>]` [OUT]
  9. predict: `var a any = 1; var b any = 1; var c any = int64(1); fmt.Println(a == b, a == c)` → `true false` (different dynamic types) [OUT]
  10. predict "Does it compile?": `var x any = 3; fmt.Println(x + 1)` → No: `invalid operation: x + 1 (mismatched types any and untyped int)` [CE]
  11. predict "What happens?" (senior): `var a any = []int{1}; fmt.Println(a == a)` → `panic: runtime error: comparing uncomparable type []int` [PANIC]
- **Run**: starter
  ```go
  // top:
  type Speaker interface{ Speak() string }
  type Duck struct{}
  func (d *Duck) Speak() string { return "quack" }
  // main:
  var s Speaker = Duck{}
  fmt.Println("says:", s.Speak())
  ```
  → compile error `Duck does not implement Speaker (method Speak has pointer receiver)`.
  Solution: `var s Speaker = &Duck{}` (or a value receiver). `expect`: `says: quack`. [CE → OUT]

### 3.2 `nil-traps-and-embedding`, "Empty hands and borrowed skills"

- **Concept**: an interface value is a pair (dynamic type, value); it is `nil` only if both are
  nil; storing a nil `*T` in an `error` gives a non-nil interface (the classic typed-nil bug);
  return a literal `nil` instead; methods can be called on nil pointers; struct embedding
  promotes fields and methods (composition, not inheritance), an outer method shadows the
  promoted one, and a `Dog` is not an `Animal` for type checking, but it does satisfy the
  interfaces that the promoted methods implement; interface embedding (`io.ReadWriter`).
- **Visual**: typed nil is a `shield` carried by an actor whose hand is empty: the guard asks
  "is anyone there?" and gets "yes" (`err != nil`). Embedding: the `Dog` actor carries the
  `Animal` gem inside its pack; it can use the gem's moves (`say "hi Rex"`), but a gate that
  only admits Animals still turns the Dog away (`shake`).
- **Questions**:
  1. predict: top: `type MyErr struct{}`, `func (e *MyErr) Error() string { return "my error" }`, `func check() error { var p *MyErr; return p }`; body `err := check(); fmt.Println(err == nil); fmt.Printf("%T\n", err)` → `false` / `*main.MyErr` [OUT]
  2. predict: `var err error; fmt.Println(err == nil); fmt.Printf("%v %T\n", err, err)` → `true` / `<nil> <nil>` [OUT]
  3. predict: `var p *int; var x any = p; fmt.Println(p == nil, x == nil)` → `true false` [OUT]
  4. predict: top: `type T struct{}`, `func (t *T) Hi() string { return "hi" }`; body `var t *T; fmt.Println(t.Hi(), t == nil)` → `hi true` (the method never dereferences `t`) [OUT]
  5. predict: top: `type Animal struct{ Name string }`, `func (a Animal) Hello() string { return "hi " + a.Name }`, `type Dog struct { Animal; Breed string }`; body `d := Dog{Animal{"Rex"}, "lab"}; fmt.Println(d.Hello(), d.Name)` → `hi Rex Rex` [OUT]
  6. predict: as Q5 plus `func (d Dog) Hello() string { return "woof " + d.Name }` (Dog has only the embedded Animal); body `fmt.Println(d.Hello()); fmt.Println(d.Animal.Hello())` → `woof Rex` / `hi Rex` [OUT]
  7. predict "Does it compile?": top: `type Animal struct{ Name string }`, `type Dog struct{ Animal }`, `func greet(a Animal) { fmt.Println("hi", a.Name) }`; body `d := Dog{Animal{"Rex"}}; greet(d)` → No: `cannot use d (variable of struct type Dog) as Animal value in argument to greet`; `greet(d.Animal)` prints `hi Rex` [CE]
  8. predict: top: `type Namer interface{ Name() string }`, `type Animal struct{ name string }`, `func (a Animal) Name() string { return a.name }`, `type Dog struct{ Animal }`; body `var n Namer = Dog{Animal{"Rex"}}; fmt.Println(n.Name())` → `Rex` (promoted methods satisfy interfaces) [OUT]
  9. pick: `type ReadWriter interface { ___; Writer }` options `Reader` / `extends Reader` / `implements Reader` → `Reader` (interface embedding) [DOC: spec "Interface types"]
- **Run**: starter
  ```go
  // top:
  type ValidationError struct{ Field string }
  func (e *ValidationError) Error() string { return "bad " + e.Field }
  func validate(name string) error {
      var verr *ValidationError
      if name == "" { verr = &ValidationError{"name"} }
      return verr
  }
  // main:
  if err := validate("gopi"); err != nil {
      fmt.Println("failed")
  } else {
      fmt.Println("valid: gopi")
  }
  ```
  prints `failed` (typed nil). Solution: `if name == "" { return &ValidationError{"name"} }; return nil`.
  `expect`: `valid: gopi`. [OUT → OUT]

### 3.3 `errors-as-values`, "Error scrolls"

- **Concept**: errors are ordinary values implementing `Error() string`, returned last;
  `if err != nil`; `errors.New`; sentinel errors compared by identity (two `errors.New("x")`
  are different); wrapping with `fmt.Errorf("...: %w", err)` (with `%v` the chain is lost);
  `errors.Is` walks the chain, `errors.As` finds a type; `errors.Unwrap`; `errors.Join`
  (Go 1.20); standard errors like `fs.ErrNotExist`; ignoring an error with `_` gives a zero
  result.
- **Visual**: every ally returns two things, a result chip and an error `scroll` (empty
  scroll = nil). Wrapping slides the scroll into a bigger labelled scroll; `errors.Is` unrolls
  the layers until it finds the sentinel; `==` only looks at the outer layer and `shake`s.
- **Questions**:
  1. predict: imports fmt, strconv; `n, err := strconv.Atoi("12a"); fmt.Println(n, err)` → `0 strconv.Atoi: parsing "12a": invalid syntax` [OUT]
  2. predict: imports errors, fmt; top: `var ErrNotFound = errors.New("not found")`, `func find(k string) error { return ErrNotFound }`; body `err := find("x"); fmt.Println(err == ErrNotFound, err)` → `true not found` [OUT]
  3. predict: top: `var ErrNotFound = errors.New("not found")`; body `err := fmt.Errorf("load user: %w", ErrNotFound); fmt.Println(err); fmt.Println(err == ErrNotFound, errors.Is(err, ErrNotFound))` → `load user: not found` / `false true` [OUT]
  4. pick: `err := fmt.Errorf("load user: ___", ErrNotFound)` so that `errors.Is(err, ErrNotFound)` is `true`; options `%w` / `%v` / `%s` → `%w` (with `%v` it prints `false`) [OUT]
  5. predict: top: `type NotFound struct{ Key string }`, `func (e *NotFound) Error() string { return e.Key + " not found" }`; body `err := fmt.Errorf("handler: %w", &NotFound{Key: "id"}); var nf *NotFound; if errors.As(err, &nf) { fmt.Println("missing", nf.Key) }; fmt.Println(err)` → `missing id` / `handler: id not found` [OUT]
  6. predict: `fmt.Println(errors.New("x") == errors.New("x"))` → `false` [OUT]
  7. predict: `err := fmt.Errorf("db: %w", ErrNotFound); fmt.Println(errors.Unwrap(err) == ErrNotFound, errors.Unwrap(ErrNotFound) == nil)` → `true true` [OUT]
  8. predict: top: `var ErrA = errors.New("a")`, `var ErrB = errors.New("b")`; body `err := errors.Join(ErrA, ErrB); fmt.Println(errors.Is(err, ErrB)); fmt.Println(err)` → `true` / `a` / `b` [OUT]
  9. predict: `err := fmt.Errorf("svc: %w", fmt.Errorf("repo: %w", ErrNotFound)); fmt.Println(err, errors.Is(err, ErrNotFound))` → `svc: repo: not found true` [OUT]
  10. predict: imports errors, fmt, io/fs, os; `_, err := os.Open("missing.txt"); fmt.Println(errors.Is(err, fs.ErrNotExist))` → `true` (the error text is `open missing.txt: no such file or directory`) [OUT]
  11. predict: `n, _ := strconv.Atoi("x"); fmt.Println(n)` → `0` [OUT]
- **Run**: starter
  ```go
  // top:
  var ErrBusy = errors.New("busy")
  func call() error { return fmt.Errorf("call api: %w", ErrBusy) }
  // main:
  err := call()
  if err == ErrBusy {
      fmt.Println("retry later")
  } else {
      fmt.Println("unknown error:", err)
  }
  ```
  prints `unknown error: call api: busy`. Solution: `if errors.Is(err, ErrBusy)`.
  `expect`: `retry later`. [OUT → OUT]

### 3.4 `generics`, "One spell, many types"

- **Concept**: type parameters `func F[T C](...)`; constraints are interfaces: `any`,
  `comparable`, unions `int | float64`, `~T` (underlying type), `cmp.Ordered`; type inference
  and explicit instantiation `Max[float64](3, 2.5)`; generic types `Stack[T]`; `var z T` is the
  zero value of `T`; operators are only allowed if every type in the constraint supports them.
- **Visual**: a spell `scroll` with a blank slot `T`; casting it on gems or swords fills the slot.
  The constraint is the gate rune: a sword at a "numbers only" gate makes it `shake`
  (`string does not satisfy int | float64`).
- **Questions**:
  1. predict: top: `func Max[T int | float64](a, b T) T { if a > b { return a }; return b }`; body `fmt.Println(Max(3, 7), Max(2.5, 1.5), Max[float64](3, 2.5))` → `7 2.5 3` [OUT]
  2. predict: imports cmp, fmt; `func Max[T cmp.Ordered](a, b T) T {...}` same body; `fmt.Println(Max("go", "c"))` → `go` [OUT]
  3. predict "Does it compile?": top: `func Sum[T int | float64](xs []T) T { var s T; for _, x := range xs { s += x }; return s }`; body `fmt.Println(Sum([]string{"a"}))` → No: `string does not satisfy int | float64 (string missing in int | float64)` [CE]
  4. predict "Does it compile?": top: `func Add[T any](a, b T) T { return a + b }`; body `fmt.Println(Add(1, 2))` → No: `invalid operation: operator + not defined on a (variable of type T constrained by any)` [CE]
  5. predict: imports fmt, strconv; top: `func Map[T, U any](xs []T, f func(T) U) []U { out := make([]U, 0, len(xs)); for _, x := range xs { out = append(out, f(x)) }; return out }`; body `fmt.Println(Map([]int{1, 2, 3}, func(n int) string { return strconv.Itoa(n * n) }))` → `[1 4 9]` [OUT]
  6. predict: top: `type Stack[T any] struct{ items []T }`, `func (s *Stack[T]) Push(v T) { s.items = append(s.items, v) }`, `func (s *Stack[T]) Pop() T { v := s.items[len(s.items)-1]; s.items = s.items[:len(s.items)-1]; return v }`; body `var s Stack[string]; s.Push("a"); s.Push("b"); fmt.Println(s.Pop(), len(s.items))` → `b 1` [OUT]
  7. predict: top: `type Celsius float64`, `func Double[T ~float64](x T) T { return x * 2 }`; body `fmt.Println(Double(Celsius(1.5)))` → `3`; with `[T float64]` instead it fails: `Celsius does not satisfy float64 (possibly missing ~ for float64 in float64)` [OUT] [CE]
  8. pick: `func Index[T ___](xs []T, v T) int { for i, x := range xs { if x == v { return i } }; return -1 }` options `comparable` / `any` → `comparable`; `Index([]string{"a", "b"}, "b")` → `1`. With `any`: `invalid operation: x == v (incomparable types in type set)` [OUT] [CE]
  9. predict: top: `type Pair[K comparable, V any] struct { Key K; Val V }`; body `p := Pair[string, int]{"hp", 10}; fmt.Printf("%v %T\n", p, p)` → `{hp 10} main.Pair[string,int]` [OUT]
  10. predict: top: `func Zero[T any]() T { var z T; return z }`; body `fmt.Println(Zero[int](), Zero[string]() == "", Zero[*int]() == nil)` → `0 true true` [OUT]
- **Run**: starter
  ```go
  // top:
  func Sum[T any](xs []T) T {
      var s T
      for _, x := range xs { s += x }
      return s
  }
  // main:
  fmt.Println("sum:", Sum([]int{1, 2, 3}))
  ```
  → `invalid operation: operator + not defined on s (variable of type T constrained by any)`.
  Solution: `type Number interface { ~int | ~float64 }` and `func Sum[T Number](xs []T) T`.
  `expect`: `sum: 6`. [CE → OUT]

### Boss: `castle-boss`, "The Typed-Nil Knight"

1. predict: top: `type Stringer interface{ String() string }`, `type ID int`, `func (i ID) String() string { return fmt.Sprintf("#%d", int(i)) }`; body `var s Stringer = ID(7); if id, ok := s.(ID); ok { fmt.Println(id+1, int(id)) }` → `#8 7` (`id+1` is still an `ID`, so Println uses `String()`) [OUT]
2. predict: top: `type Op struct{ Code int }`, `func (o Op) Error() string { return fmt.Sprint("code ", o.Code) }`; body `var err error = fmt.Errorf("wrap: %w", Op{404}); var op Op; fmt.Println(errors.As(err, &op), op.Code)` → `true 404` [OUT]
3. predict: top: `type S struct{ n int }`; body `s := S{1}; var i any = s; s.n = 2; fmt.Println(i.(S).n)` → `1` (an interface stores a copy) [OUT]
4. predict: top: `type Number interface { ~int | ~float64 }` and generic `Sum`; body `fmt.Println(Sum([]int{1, 2, 3}), Sum([]float64{0.5, 0.25}))` → `6 0.75` [OUT]
5. Reuse: 3.1 Q3, 3.2 Q1, 3.3 Q3, 3.4 Q4.

---

## Region 4: `channel-tower`, Goroutines, channels and the tower of Concurra

Sources: Tour "Concurrency" (https://go.dev/tour/concurrency/1), Effective Go "Concurrency"
("Do not communicate by sharing memory; instead, share memory by communicating"), Go blog
"Pipelines and cancellation" (https://go.dev/blog/pipelines), "Go Concurrency Patterns:
Context" (https://go.dev/blog/context), "Fixing For Loops in Go 1.22"
(https://go.dev/blog/loopvar-preview), The Go Memory Model (https://go.dev/ref/mem), Data Race
Detector (https://go.dev/doc/articles/race_detector), package docs `sync`, `context`.

### 4.1 `goroutines-and-waitgroups`, "Allies that work in parallel"

- **Concept**: `go f()` starts a goroutine (cheap, scheduled by the runtime onto OS threads);
  `main` returning ends the program even if goroutines are still running; `sync.WaitGroup`
  (`Add` before `go`, `Done` via `defer`, `Wait`); `wg.Go(func)` (Go 1.25); never copy a
  WaitGroup (pass `*sync.WaitGroup`); since Go 1.22 each loop iteration has its own variable, so
  closures and goroutines see the right `i` (before 1.22 they all shared one variable); a
  goroutine writing its own slice index is not a race.
- **Visual**: `go` makes an ally `enter` and work beside the hero; `wg.Add(1)` hangs a bell
  counter on a post; each ally rings `Done` as it leaves (`exit`); `Wait` makes the hero `wait`
  until the counter is 0. A copied WaitGroup is a second, fake post: allies ring the wrong
  one and the hero waits forever (`go/deadlock-snail`).
- **Questions**:
  1. predict: imports fmt, sync; `var wg sync.WaitGroup; results := make([]int, 3); for i := 0; i < 3; i++ { wg.Add(1); go func() { defer wg.Done(); results[i] = i * i }() }; wg.Wait(); fmt.Println(results)` → `[0 1 4]` [OUT]
  2. predict: `var wg sync.WaitGroup; results := make([]int, 4); for i := range results { wg.Go(func() { results[i] = i * 10 }) }; wg.Wait(); fmt.Println(results)` → `[0 10 20 30]` (Go 1.25+) [OUT]
  3. predict "What happens?": top: `func work(wg sync.WaitGroup) { defer wg.Done() }`; body `var wg sync.WaitGroup; wg.Add(1); go work(wg); wg.Wait(); fmt.Println("done")` → deadlock (`go vet` also warns `work passes lock by value`) [DEADLOCK]
  4. predict "What happens?": `var wg sync.WaitGroup; wg.Done(); fmt.Println("after")` → `panic: sync: negative WaitGroup counter` [PANIC]
  5. predict: imports fmt, runtime; `fmt.Println(runtime.NumGoroutine())` at the start of `main` → `1` [OUT]
  6. pick "Is `hi` guaranteed to print?": `go fmt.Println("hi"); fmt.Println("done")` options `No` / `Yes` → `No`: when `main` returns the program exits without waiting [DOC: spec "Program execution"]
  7. pick "Before Go 1.22, what did this print?": `for i := 0; i < 3; i++ { defer func() { fmt.Print(i) }() }` options `333` / `210` / `012` → `333`; Go 1.22+ prints `210` (verified) [DOC: go.dev/blog/loopvar-preview]
  8. order: `var wg sync.WaitGroup` → `wg.Add(1)` → `go func() { defer wg.Done(); work() }()` → `wg.Wait()` [DOC]
  9. predict: `var ptrs []*int; for _, v := range []int{1, 2, 3} { ptrs = append(ptrs, &v) }; fmt.Println(*ptrs[0], *ptrs[1], *ptrs[2])` → `1 2 3` (Go 1.22+; before: `3 3 3`) [OUT]
- **Run**: starter
  ```go
  // top:
  func square(n int, out []int, wg sync.WaitGroup) {
      defer wg.Done()
      out[n] = n * n
  }
  // main:
  var wg sync.WaitGroup
  out := make([]int, 4)
  for i := range out {
      wg.Add(1)
      go square(i, out, wg)
  }
  wg.Wait()
  sum := 0
  for _, v := range out { sum += v }
  fmt.Println("sum of squares:", sum)
  ```
  → `fatal error: all goroutines are asleep - deadlock!`. Solution: parameter
  `wg *sync.WaitGroup` and call `go square(i, out, &wg)`. `expect`: `sum of squares: 14`.
  [DEADLOCK → OUT]

### 4.2 `channels`, "Tunnels between allies"

- **Concept**: `make(chan T)` (unbuffered: send waits for a receiver) vs `make(chan T, n)`
  (buffered: send waits only when full); `len`/`cap` of a channel; `close` by the sender;
  `for v := range ch` stops at close; receive from a closed channel returns the zero value and
  `ok == false`; send on closed channel panics, closing twice panics, closing a nil channel
  panics; send/receive on a nil channel blocks forever; direction types `chan<- T` / `<-chan T`;
  a `chan struct{}` closed as a "done" signal; when every goroutine is blocked the runtime aborts
  with "all goroutines are asleep - deadlock!".
- **Visual**: an unbuffered channel is a hand-to-hand tunnel: the hero holding a gem `wait`s at
  the mouth until the ally arrives (`give`). A buffered channel is a box with N slots. `close`
  hangs a "CLOSED" `banner`; `range` stops there. A lone send with no receiver freezes everyone:
  `go/deadlock-snail` crawls in, `shake`, banner `all goroutines are asleep - deadlock!`.
- **Questions**:
  1. predict "What happens?": `ch := make(chan int); ch <- 1; fmt.Println(<-ch)` → deadlock (nobody is receiving when main sends) [DEADLOCK]
  2. predict: `ch := make(chan int, 1); ch <- 1; fmt.Println(<-ch)` → `1` [OUT]
  3. predict: `ch := make(chan string, 3); ch <- "a"; ch <- "b"; fmt.Println(len(ch), cap(ch))` → `2 3` [OUT]
  4. predict: `ch := make(chan int, 3); ch <- 1; ch <- 2; ch <- 3; close(ch); sum := 0; for v := range ch { sum += v }; fmt.Println(sum)` → `6` [OUT]
  5. predict: `ch := make(chan int, 1); ch <- 7; close(ch); a, ok1 := <-ch; b, ok2 := <-ch; fmt.Println(a, ok1, b, ok2)` → `7 true 0 false` [OUT]
  6. predict "What happens?": `ch := make(chan int, 1); close(ch); ch <- 1; fmt.Println("sent")` → `panic: send on closed channel` [PANIC]
  7. predict "What happens?": `ch := make(chan int); close(ch); close(ch)` → `panic: close of closed channel`; `var ch chan int; close(ch)` → `panic: close of nil channel` [PANIC]
  8. predict "What happens?": `ch := make(chan int); go func() { ch <- 1; ch <- 2 }(); for v := range ch { fmt.Println(v) }` → prints `1` / `2`, then deadlock (nobody closes `ch`) [DEADLOCK]
  9. predict "What happens?": `var ch chan int; ch <- 1; fmt.Println("sent")` → deadlock (a nil channel blocks forever) [DEADLOCK]
  10. predict: `ch := make(chan int); go func() { for i := 1; i <= 3; i++ { ch <- i * 10 }; close(ch) }(); for v := range ch { fmt.Print(v, " ") }` → `10 20 30` (trailing space; a single sender keeps the order) [OUT]
  11. predict "Does it compile?": top: `func producer(out chan<- int) { v := <-out; fmt.Println(v) }` → No: `invalid operation: cannot receive from send-only channel chan<- int out (variable of type chan<- int)` [CE]
  12. predict: `done := make(chan struct{}); go func() { fmt.Println("working"); close(done) }(); <-done; fmt.Println("finished")` → `working` / `finished` [OUT]
  13. predict "What happens?": `ch := make(chan int, 2); ch <- 1; ch <- 2; ch <- 3; fmt.Println("full")` → deadlock (third send on a full buffer) [DEADLOCK]
- **Run**: starter
  ```go
  ch := make(chan string)
  ch <- "hello"
  fmt.Println("got:", <-ch)
  ```
  → deadlock. Solution: send from a goroutine, `go func() { ch <- "hello" }()` (or
  `make(chan string, 1)`). `expect`: `got: hello`. [DEADLOCK → OUT]

### 4.3 `select-and-context`, "Choosing a tunnel, calling everyone home"

- **Concept**: `select` waits on several channel operations and runs one ready case (random
  among several ready ones); `default` makes it non-blocking; `time.After` for timeouts; a nil
  channel case is never ready (useful to disable a case); `select {}` blocks forever;
  `context.Context`: `WithCancel`, `WithTimeout`, `Done()`, `Err()` (`context canceled`,
  `context deadline exceeded`), canceling a parent cancels children, always call `cancel`
  (`go vet` reports a lost cancel), ctx is the first parameter and is not stored in structs,
  `WithValue` with an unexported key type for request-scoped data only; workers `select` on
  `ctx.Done()` to stop (no goroutine leaks).
- **Visual**: `select` is a crossroads with several tunnels; the hero takes whichever has an
  ally waiting; with `default` the hero walks on instead of waiting. Cancelling a context raises
  a `banner "CANCELED"` and every ally holding the context scroll `exit`s.
- **Questions**:
  1. predict: `ch := make(chan int); select { case v := <-ch: fmt.Println(v); default: fmt.Println("no value") }` → `no value` [OUT]
  2. predict: `a := make(chan string, 1); b := make(chan string, 1); b <- "B"; select { case v := <-a: fmt.Println(v); case v := <-b: fmt.Println(v) }` → `B` (only one case is ready) [OUT]
  3. predict "What happens?": (no imports) `select {}` → deadlock [DEADLOCK]
  4. predict: imports fmt, time; `ch := make(chan int); select { case v := <-ch: fmt.Println(v); case <-time.After(10 * time.Millisecond): fmt.Println("timeout") }` → `timeout` [OUT]
  5. predict: `var a chan int; b := make(chan int, 1); b <- 2; select { case v := <-a: fmt.Println("a", v); case v := <-b: fmt.Println("b", v) }` → `b 2` [OUT]
  6. predict: imports context, errors, fmt; `ctx, cancel := context.WithCancel(context.Background()); fmt.Println(ctx.Err()); cancel(); <-ctx.Done(); fmt.Println(ctx.Err(), errors.Is(ctx.Err(), context.Canceled))` → `<nil>` / `context canceled true` [OUT]
  7. predict: imports context, fmt, time; `ctx, cancel := context.WithTimeout(context.Background(), 5*time.Millisecond); defer cancel(); <-ctx.Done(); fmt.Println(ctx.Err())` → `context deadline exceeded` [OUT]
  8. predict: `parent, cancel := context.WithCancel(context.Background()); child, cancelChild := context.WithCancel(parent); defer cancelChild(); cancel(); <-child.Done(); fmt.Println(child.Err())` → `context canceled` [OUT]
  9. predict: top: `type key string`; body `ctx := context.WithValue(context.Background(), key("user"), "gopi"); fmt.Println(ctx.Value(key("user")), ctx.Value(key("role")))` → `gopi <nil>` [OUT]
  10. predict: top: `func worker(ctx context.Context, out chan<- int) { defer close(out); for i := 0; ; i++ { select { case <-ctx.Done(): return; case out <- i: } } }`; body `ctx, cancel := context.WithCancel(context.Background()); out := make(chan int); go worker(ctx, out); for i := 0; i < 3; i++ { fmt.Print(<-out, " ") }; cancel(); for range out {}; fmt.Println("stopped")` → `0 1 2 stopped` [OUT]
  11. pick: "Where does `ctx` go in a function signature?" options `first parameter` / `last parameter` / `struct field` → `first parameter` [DOC: package context docs]
- **Run**: starter
  ```go
  results := make(chan string)
  go func() {
      // the slow service never answers
  }()
  fmt.Println(<-results)
  ```
  → deadlock. Solution (imports fmt, time):
  `select { case r := <-results: fmt.Println(r); case <-time.After(50 * time.Millisecond): fmt.Println("timeout: gave up") }`.
  `expect`: `timeout: gave up`. [DEADLOCK → OUT]

### 4.4 `mutexes-and-races`, "One key for the treasure"

- **Concept**: a data race is two goroutines touching the same memory, at least one writing,
  without synchronization; detect with `go run -race` / `go test -race` ("WARNING: DATA RACE");
  `sync.Mutex` (`Lock` / `defer Unlock`), `RWMutex` (many readers or one writer), `sync.Once`,
  `sync.OnceValue`, `sync/atomic` typed values; locking a mutex twice in the same goroutine
  deadlocks (not reentrant); unlocking an unlocked mutex is a fatal error; concurrent map writes
  crash (`fatal error: concurrent map writes`); memory model: a send on a channel happens before
  the matching receive completes, an `Unlock` happens before the next `Lock`.
- **Visual**: the shared counter is a `gem`; the mutex is a `key`. Only the actor holding the
  key may touch the gem; others `wait`. Without the key, `go/race-twins` grab the gem at the
  same time and a tally is lost. Forgetting to give the key back freezes the next ally
  (`go/deadlock-snail`).
- **Questions**:
  1. predict: imports fmt, sync; `var mu sync.Mutex; var wg sync.WaitGroup; count := 0; for i := 0; i < 100; i++ { wg.Add(1); go func() { defer wg.Done(); mu.Lock(); count++; mu.Unlock() }() }; wg.Wait(); fmt.Println(count)` → `100` [OUT]
  2. predict: `var once sync.Once; for i := 0; i < 3; i++ { once.Do(func() { fmt.Println("init", i) }) }` → `init 0` [OUT]
  3. predict: imports fmt, sync, sync/atomic; 50 goroutines each doing `n.Add(1)` on `var n atomic.Int64`, then `fmt.Println(n.Load())` → `50` [OUT]
  4. predict "What happens?": `var mu sync.Mutex; mu.Lock(); mu.Lock(); fmt.Println("locked twice")` → deadlock [DEADLOCK]
  5. predict "What happens?": `var mu sync.Mutex; mu.Unlock()` → `fatal error: sync: unlock of unlocked mutex` [FATAL]
  6. predict: `var rw sync.RWMutex; rw.RLock(); rw.RLock(); fmt.Println("two readers"); rw.RUnlock(); rw.RUnlock()` → `two readers` [OUT]
  7. predict: `getConfig := sync.OnceValue(func() string { fmt.Println("loading"); return "cfg" }); fmt.Println(getConfig(), getConfig())` → `loading` / `cfg cfg` [OUT]
  8. pick: "Which command finds data races?" options `go run -race` / `go vet -race` / `go build -deadlock` → `go run -race` (also `go test -race`) [DOC: go.dev/doc/articles/race_detector]
  9. pick "Is this a data race?": `count := 0; for i := 0; i < 2; i++ { go func() { count++ }() }` options `Yes` / `No` → `Yes` (unsynchronized writes; output not deterministic, so never a predict) [DOC]
  10. pick (memory model): "A send on a channel is ___ the completion of the corresponding receive." options `synchronized before` / `synchronized after` / `unordered with` → `synchronized before` (the memory model's wording; for unbuffered channels the receive is also synchronized before the send completes) [DOC: go.dev/ref/mem]
- **Run**: starter
  ```go
  // top:
  type Counter struct {
      mu sync.Mutex
      n  int
  }
  func (c *Counter) Inc() {
      c.mu.Lock()
      c.n++
  }
  // main:
  var c Counter
  for i := 0; i < 3; i++ { c.Inc() }
  fmt.Println("count:", c.n)
  ```
  → deadlock on the second `Inc` (the lock is never released). Solution: `defer c.mu.Unlock()`
  after `Lock`. `expect`: `count: 3`. [DEADLOCK → OUT]

  Do **not** build a run beat around a racy counter: its output is not deterministic and can
  even print the right total by luck.

### Boss: `tower-boss`, "The Deadlock Snail"

1. predict: `ch := make(chan int, 3); for i := range 3 { ch <- i }; close(ch); for v := range ch { fmt.Print(v) }; fmt.Println(len(ch))` → `0120` (`012` from the loop, then `len` is 0) [OUT]
2. predict: pipeline. top: `func gen(n int) <-chan int { out := make(chan int); go func() { defer close(out); for i := 1; i <= n; i++ { out <- i } }(); return out }` and `func sq(in <-chan int) <-chan int { out := make(chan int); go func() { defer close(out); for v := range in { out <- v * v } }(); return out }`; body `sum := 0; for v := range sq(gen(3)) { sum += v }; fmt.Println(sum)` → `14` [OUT]
3. Reuse: 4.2 Q8, 4.2 Q5, 4.3 Q5, 4.4 Q4, 4.1 Q3.

---

## Entry exams

Format follows `content/rust/exams.ts`: exam questions are `pick`/`predict`/`type`/`order` beats
tagged with a topic; the engine draws round-robin across topics.

### Topic ids

| Topic id | Name (en) | Region link |
|---|---|---|
| `basics` | Variables, types and zero values | `gopher-village` |
| `functions` | Functions, control flow and closures | `gopher-village` |
| `strings` | Strings, bytes and runes | `gopher-village` |
| `defer_panic` | Defer, panic and recover | `gopher-village` |
| `slices` | Arrays and slices | `slice-forest` |
| `maps` | Maps | `slice-forest` |
| `structs` | Structs, pointers and methods | `slice-forest` |
| `interfaces` | Interfaces and embedding | `interface-castle` |
| `errors` | Errors as values | `interface-castle` |
| `generics` | Generics | `interface-castle` |
| `goroutines` | Goroutines and WaitGroup | `channel-tower` |
| `channels` | Channels and select | `channel-tower` |
| `context` | Context and cancellation | `channel-tower` |
| `sync` | Mutexes, atomics and data races | `channel-tower` |
| `testing` | Testing | (none yet) |
| `tooling` | Modules and tooling | (none yet) |
| `runtime` | Runtime, memory and performance | (none yet) |

A region is skipped when all its topics are passed: junior can skip `gopher-village` and
`slice-forest` (except `structs`, which is in mid); mid covers `slice-forest` and
`interface-castle`; senior covers `channel-tower`.

### Bank sizes

| Exam | Draws / bank | Pass | s/question | Topics in the bank (count) | Suggested kinds |
|---|---|---|---|---|---|
| `junior`, Junior Go Developer | 12 / 22 | 70% | 30 | basics 4, functions 3, strings 3, slices 4, maps 4, defer_panic 2, errors 2 | predict 13, pick 6, type 2, order 1 |
| `mid`, Mid-level Go Developer | 14 / 24 | 70% | 40 | slices 2, structs 3, interfaces 4, errors 4, defer_panic 2, generics 2, goroutines 2, channels 3, testing 2 | predict 15, pick 6, type 2, order 1 |
| `senior`, Senior Go Developer | 15 / 26 | 75% | 50 | interfaces 2, errors 2, generics 2, goroutines 3, channels 4, sync 4, context 3, runtime 3, tooling 1, slices 2 | predict 17, pick 7, type 1, order 1 |

The lesson questions above are a large pool for the banks (exam questions should be new
wording or new snippets, not copies of lesson beats, so the exam is not a memory test).

### Junior example questions (all verified)

1. [`basics`] predict "Does it compile?": `x := 1; y := 2; fmt.Println(x)` → No (`declared and not used: y`)
2. [`basics`] predict: `var n int; var s string; var b bool; fmt.Println(n, s == "", b)` → `0 true false`
3. [`functions`] predict: `switch 1 { case 1: fmt.Println("a"); fallthrough; case 2: fmt.Println("b"); case 3: fmt.Println("c") }` → `a` / `b`
4. [`functions`] predict: `x := 7; switch { case x > 5: fmt.Println("big"); case x > 2: fmt.Println("medium"); default: fmt.Println("small") }` → `big`
5. [`strings`] predict: `fmt.Println(len("héllo"))` → `6`
6. [`slices`] predict: `a := []int{1, 2, 3}; b := a; b[0] = 9; fmt.Println(a[0], b[0])` → `9 9`
7. [`slices`] predict "Does it compile?": `s := []int{1, 2}; append(s, 3)` → No (`append(s, 3) (value of type []int) is not used`)
8. [`maps`] predict "What happens?": `var m map[string]int; m["x"] = 1` → `panic: assignment to entry in nil map`
9. [`maps`] predict: `m := map[string]int{"a": 0}; v, ok := m["a"]; w, ok2 := m["zzz"]; fmt.Println(v, ok, w, ok2)` → `0 true 0 false`
10. [`defer_panic`] predict: `for i := 0; i < 3; i++ { defer fmt.Print(i, " ") }` → `2 1 0`
11. [`errors`] predict: `n, err := strconv.Atoi("12a"); fmt.Println(n, err != nil)` → `0 true`
12. [`basics`] predict: `x := 1; if true { x := 2; x++ }; fmt.Println(x)` → `1`

### Mid example questions (all verified)

1. [`slices`] predict: `a := []int{1, 2, 3, 4}; s := a[:2]; s = append(s, 99); fmt.Println(a)` → `[1 2 99 4]`
2. [`structs`] predict: value receiver `IncV` then pointer receiver `IncP` on `var c Counter` → `0` / `1`
3. [`structs`] predict "Does it compile?": `m := map[string]Point{"p": {1, 2}}; m["p"].X = 5` → No (`cannot assign to struct field m["p"].X in map`)
4. [`interfaces`] predict: `func check() error { var p *MyErr; return p }`; `fmt.Println(check() == nil)` → `false`
5. [`interfaces`] predict "Does it compile?": `var s Speaker = Duck{}` where `Speak` has a pointer receiver → No (`method Speak has pointer receiver`)
6. [`interfaces`] predict "What happens?": `var x any = "hi"; n := x.(int)` → `panic: interface conversion: interface {} is string, not int`
7. [`errors`] predict: `err := fmt.Errorf("load user: %w", ErrNotFound); fmt.Println(err == ErrNotFound, errors.Is(err, ErrNotFound))` → `false true`
8. [`errors`] pick: `fmt.Errorf("svc: ___", err)` keeps the chain → `%w`
9. [`defer_panic`] predict: `x := 1; defer fmt.Println("deferred:", x); x = 2; fmt.Println("now:", x)` → `now: 2` / `deferred: 1`
10. [`generics`] predict "Does it compile?": `func Add[T any](a, b T) T { return a + b }` → No (`operator + not defined on a (variable of type T constrained by any)`)
11. [`channels`] predict "What happens?": `ch := make(chan int); ch <- 1; fmt.Println(<-ch)` → deadlock
12. [`channels`] predict: `ch := make(chan int, 1); ch <- 7; close(ch); a, ok1 := <-ch; b, ok2 := <-ch; fmt.Println(a, ok1, b, ok2)` → `7 true 0 false`
13. [`goroutines`] predict: the WaitGroup loop that writes `results[i] = i * i` → `[0 1 4]`
14. [`testing`] predict [TEST]: file (imports testing, no `main`):
    ```go
    func Abs(x int) int { if x < 0 { return x }; return x }
    func TestAbs(t *testing.T) {
        for _, tc := range []struct{ in, want int }{{2, 2}, {-3, 3}} {
            if got := Abs(tc.in); got != tc.want {
                t.Errorf("Abs(%d) = %d, want %d", tc.in, got, tc.want)
            }
        }
    }
    ```
    "Which line does the test print?" → `Abs(-3) = -3, want 3` (then `--- FAIL: TestAbs` and `FAIL`)
15. [`testing`] pick: in a table test, `t.___(tc.name, func(t *testing.T) { ... })` runs a named subtest → `Run` (verified: a passing table test with `t.Run` prints `--- PASS: TestUpper/lower` and `PASS`)

### Senior example questions (all verified unless marked [DOC])

1. [`channels`] predict "What happens?": `ch := make(chan int); go func() { ch <- 1; ch <- 2 }(); for v := range ch { fmt.Println(v) }` → prints `1` / `2`, then deadlock
2. [`channels`] predict: `var a chan int; b := make(chan int, 1); b <- 2; select { case v := <-a: fmt.Println("a", v); case v := <-b: fmt.Println("b", v) }` → `b 2`
3. [`sync`] predict "What happens?": `var mu sync.Mutex; mu.Lock(); mu.Lock()` → deadlock (Go mutexes are not reentrant)
4. [`sync`] predict "What happens?": `var mu sync.Mutex; mu.Unlock()` → `fatal error: sync: unlock of unlocked mutex`
5. [`goroutines`] predict "What happens?": WaitGroup passed by value to `work(wg sync.WaitGroup)` → deadlock
6. [`context`] predict: parent canceled, `<-child.Done(); fmt.Println(child.Err())` → `context canceled`
7. [`context`] predict: `WithTimeout(..., 5*time.Millisecond)`, `<-ctx.Done(); fmt.Println(ctx.Err())` → `context deadline exceeded`
8. [`interfaces`] predict "What happens?": `var a any = []int{1}; fmt.Println(a == a)` → `panic: runtime error: comparing uncomparable type []int`
9. [`slices`] predict: `s := make([]int, 2, 3); t := append(s, 5); u := append(s, 6); fmt.Println(t, u, len(s))` → `[0 0 6] [0 0 6] 2`
10. [`runtime`] predict: imports fmt, unsafe; top: `type A struct { a bool; b int64; c bool }`, `type B struct { b int64; a bool; c bool }`; body `fmt.Println(unsafe.Sizeof(A{}), unsafe.Sizeof(B{}))` → `24 16` (field alignment on 64-bit platforms; the Playground is 64-bit)
11. [`runtime`] predict: top: `type C struct{ n int }`, `func (c C) Get() int { return c.n }`; body `c := C{1}; f := c.Get; c.n = 2; fmt.Println(f(), c.Get())` → `1 2` (a method value with a value receiver copies the receiver when it is evaluated)
12. [`runtime`] predict: `var x uint8 = 255; x++; var y int8 = 127; y++; fmt.Println(x, y)` → `0 -128` (integer overflow wraps, no panic)
13. [`generics`] predict "Does it compile?": `func Double[T float64](x T) T` called with `Celsius(1.5)` → No (`Celsius does not satisfy float64 (possibly missing ~ for float64 in float64)`)
14. [`errors`] predict: `errors.Join(ErrA, ErrB)`; `errors.Is(err, ErrB)` and `fmt.Println(err)` → `true` / `a` / `b`
15. [`runtime`] predict: imports fmt, iter; top: `func Count(n int) iter.Seq[int] { return func(yield func(int) bool) { for i := 0; i < n; i++ { if !yield(i) { return } } } }`; body `for v := range Count(10) { if v == 3 { break }; fmt.Print(v) }` → `012` (range-over-func, Go 1.23)
16. [`tooling`] pick [DOC]: "Which file records the expected cryptographic hashes of module dependencies?" options `go.sum` / `go.mod` / `go.lock` → `go.sum` (https://go.dev/ref/mod)
17. [`goroutines`] pick [DOC]: "What is the typical initial stack size of a goroutine?" options `a few KB, grows as needed` / `1 MB fixed` / `same as an OS thread` → `a few KB, grows as needed`
18. [`sync`] pick [DOC]: "Two goroutines run `m[k]++` on the same map without a lock. The most likely outcome?" options `fatal error: concurrent map writes (or a race report with -race)` / `a compile error` / `always correct` → the first (non-deterministic: never a predict)

Extra verified gotchas usable at any level:

- `for i := 0; i < 3; i++ { switch i { case 1: break }; fmt.Print(i) }` → `012` (`break` inside `switch` only leaves the switch)
- labels: `outer: for i := 0; i < 3; i++ { for j := 0; j < 3; j++ { if j == 1 { continue outer }; if i == 2 { break outer }; fmt.Print(i, j, " ") } }` → `0 0 1 0` (trailing space; `Print` puts a space between the two ints)
- shadowed `err`: `var err error; if true { n, err := get(); _ = n; _ = err }; fmt.Println(err == nil)` with `get` returning `errors.New("nope")` → `true` (the inner `:=` declared a new `err`)
- `var i int = 1 << 40; fmt.Println(int32(i))` → `0` (conversion truncates)
- `var b strings.Builder; for i := range 3 { fmt.Fprintf(&b, "%d,", i) }; fmt.Println(b.String(), b.Len())` → `0,1,2, 6`
- recover turns a runtime panic into an error: `func f() (err error) { defer func() { if r := recover(); r != nil { err = fmt.Errorf("recovered: %v", r) } }(); var s []int; _ = s[1]; return nil }` → `recovered: runtime error: index out of range [1] with length 0`

### Things to avoid in Go questions

- Printing map iteration order, `cap` after growth (implementation detail), output that depends
  on goroutine scheduling (anything without `WaitGroup`, channels or locks ordering it), or
  pointer addresses.
- Claims about pre-Go 1.22 loop semantics as a `check` (the Playground runs current Go): put
  them in `pick` with a [DOC] citation, and verify the current behaviour separately.
- Unused imports or variables in a snippet unless the compile error is the point.
- Constant expressions that the compiler catches when the question means a runtime panic
  (`1 / 0`, `[3]int{}[5]`): use variables or slices.
