# Zig planet (Comptia): proposed curriculum and entry exams

Curriculum for the **Zig planet** (pack `zig`, planet "Comptia", guide Iggi the iguana forge
engineer, bugs `zig/leak-jelly`, `zig/undefined-imp`, `zig/overflow-spark`; see
`content/zig/planet.ts`): 4 regions plus the entry exams. It is written for a learner who may
know nothing about programming, and it follows what companies actually assess (see
[zig-hiring-assessments.md](zig-hiring-assessments.md)). Content authors turn this into a
language pack following [../content-model.md](../content-model.md),
[../authoring-lessons.md](../authoring-lessons.md) and [../exams.md](../exams.md).

## Conventions used in this file

### How the snippets were verified

Every snippet below was compiled and run with **Zig 0.15.2 in Debug mode** on Compiler Explorer
(`POST https://godbolt.org/api/compiler/z0152/compile`, the same compiler id the game's runner
uses in `lib/runners/godbolt.ts`) on 2026-10-06. The answers are copied from the real output.
Output questions were run in batches (each snippet as the body of its own `fn item() !void`),
compile-error and panic questions one program each, exactly as the validator wraps them.

- A snippet is the **body of `pub fn main() !void`**. The validator (`scripts/snippet-wrap.ts`)
  adds `const std = @import("std");` and the `main` wrapper when they are missing, so `try`
  works in every snippet.
- Lines under `// top:` are file-level declarations (functions, error sets, `std_options`) that
  sit above `main`. A snippet with a top part must be written as a **full file** in the pack
  (with `const std = @import("std");` and `pub fn main() !void { ... }`), because the wrapper
  only wraps when there is no `pub fn main(`. Structs, enums and unions can also be declared
  inside `main` (as `const Point = struct { ... };`), but plain `fn` declarations cannot.
- All output uses `std.debug.print`, which writes to **stderr**; the game's runner counts it as
  program output. Never use stdout writers in content (the API changed in 0.15).

### Answer tags

| Tag | Meaning | How the runner checks it |
|---|---|---|
| `[OUT]` | Compiles and runs; exact output given (`/` separates lines in prose) | `check: { compiles: true, stdout }` |
| `[CE]` | Does not compile; the real compiler message is quoted (first `error:` line) | `check: { compiles: false }` |
| `[PANIC]` | Compiles, then a safety check panics; stderr has `thread N panic: <message>`. Output printed before the panic is given too | `check: { compiles: true, throws: "<message>" }` |
| `[DOC]` | Concept or design rule, not machine-checkable (build modes, ReleaseFast behavior, tooling) | cite the official page |

### Runtime facts that shape every question (verified)

1. **Strict compiler.** Unused local constants/variables (`unused local constant`), unused
   parameters (`unused function parameter`), unused captures (`unused capture`), a `var` that is
   never mutated (`local variable is never mutated`) and `_ = x;` followed by a use of `x`
   (`pointless discard of local constant`) are all compile errors. Shadowing an outer local is an
   error too (`local constant 'x' shadows local constant from outer scope`).
2. **Comptime-known values change the answer.** `const x: u8 = 3; const y: i32 = x; const z: u8 = y;`
   **compiles** (prints `3`) because the values are known at compile time and fit. To ask about
   type rules, force runtime values with `var big: u16 = 300; _ = &big;` (then
   `const s: u8 = big;` fails with `expected type 'u8', found 'u16'`). The same applies to
   `i32 + u32` (compiles for comptime-known constants, `incompatible types` for runtime values)
   and to signed `/` (`-7 / 2` on literals gives `-3`; on a runtime `i32` it is a compile error
   asking for `@divTrunc`/`@divFloor`). `_ = &x;` counts as a mutation, so the `var` is accepted.
3. **Constant indices are checked at compile time.** `xs[5]` on a 3-element array is
   `index 5 outside array of length 3` [CE]; with `var i: usize = 5; _ = &i;` it is the runtime
   panic `index out of bounds: index 5, len 3`.
4. **Panic format.** `thread 2 panic: integer overflow` then a stack trace with source lines;
   exit by SIGABRT (code 134). The thread number is not stable: `throws` must be only the
   message. Messages seen: `integer overflow`, `integer does not fit in destination type`,
   `attempt to use null value`, `attempt to unwrap error: <Name>`, `index out of bounds: index 5, len 3`,
   `start index 3 is larger than end index 1`, `reached unreachable code`, `division by zero`,
   `invalid enum value`, `access of union field 'rect' while field 'circle' is active`.
5. **End every print with `\n` before a possible panic.** The runner finds the panic only at
   the start of a line; `print("{c}", ...)` followed by a panic produces `forgethread 2 panic: ...`
   and the split fails.
6. **Errors that escape `main` are not panics.** `try` on a failing call in `main` prints
   `error: Odd` plus a trace and exits with code 1; the runner cannot match that with `throws`.
   In questions, handle the error (`catch |err| ... @errorName(err)`) or use `catch unreachable`
   (panic `attempt to unwrap error: Odd`).
7. **Leak reports contain addresses.** `DebugAllocator.deinit()` returns `.ok` or `.leak` and,
   on a leak, logs `error(gpa): memory address 0x7afe27800000 leaked:` plus a trace (exit code 0).
   The address changes per run, so a `check.stdout` on a leaking program is impossible unless the
   log is silenced with a no-op `std_options.logFn` (see 4.1 Q2). `run` beats are fine: they use
   an expected substring (`memory: ok`).
8. **`undefined` in Debug is filled with `0xAA` bytes** (an `i32` reads `-1431655766`, a `u32`
   `2863311530`). It is deterministic on the runner but is illegal behavior: never put it in a
   `check.stdout`; ask "is this a bug?" instead. The run beat 2.4 uses it only in the broken
   starter.
9. **Printing.** `{d}` numbers, `{s}` strings (`[]const u8`, arrays of `u8`), `{c}` a byte as a
   character, `{any}` anything (arrays print as `{ 1, 2, 3 }`, structs as `.{ .x = 6, .y = 2 }`,
   optionals as the value or `null`, error unions as the value or `error.Name`), `{}` for types,
   bools and enums. `{}` on a slice is a compile error (`cannot format slice without a specifier`)
   and `{d}` on an array is too (`invalid format string 'd' for type '[3]u8'`). Wrong argument
   count: `too few arguments`.
10. **0.15 API facts.** `std.ArrayList(T)` is unmanaged: `var list: std.ArrayList(T) = .empty;`,
    `try list.append(alloc, x)`, `list.deinit(alloc)`; the old `std.ArrayList(u8).init(alloc)` is
    `struct 'array_list.Aligned(u8,null)' has no member named 'init'`; the managed version is
    `std.array_list.Managed(T)`. `std.io.getStdOut` no longer exists
    (`root source file struct 'Io' has no member named 'getStdOut'`).
    `std.heap.DebugAllocator(.{})` with `= .init` is the leak-checking allocator;
    `std.heap.GeneralPurposeAllocator(.{}){}` still compiles as an alias. `list.pop()` returns an
    optional (`?T`).
11. **`test` blocks do not run in an executable** (a failing `test` in the file does not affect
    `main`), but `std.testing.expect*` can be called from `main` and returns errors
    (`TestUnexpectedResult`, `TestExpectedEqual`; `expectEqual` also prints `expected 5, found 4`).
12. **Avoid printing type names of your own declarations**: `@typeName` includes the file name,
    which is `example` on the runner (`example.Stack(u8)`), and the compiler messages say
    `example.Point`. Built-in type names (`u16`, `*const [3:0]u8`, `[]const u8`) are safe.

### Question kinds

`pick` (one `___`, 2-4 options), `predict` (output, "Does it compile?", "What happens?"),
`type` (exact token for `___`), `order` (lines in the correct order, unique), `run` (broken
starter that compiles → expected output substring that the starter cannot print). Prompts are
short, code at most 12 lines.

### Visual vocabulary (existing stage effects)

The stage understands: `enter`/`exit`, `tag` (label above an actor = variable name, optional
value), `untag`, `value` (value chip), `dead` (binding invalid), `item` (sword, potion, gem,
shield, scroll, key), `give` (move item), `clone` (duplicate item), `lend` (ghost copy goes and
comes back; `mut` for a writable loan), `drop`, `attack`/`hp`, `say`, `print` (stdout), `shake`
(error), `banner`, `wait`. Actors: `hero`, `ally`, `enemy` (enemy sprites: `zig/leak-jelly`,
`zig/undefined-imp`, `zig/overflow-spark`). Suggested mapping for Zig:

| Zig idea | On stage |
|---|---|
| `const` / `var` | `tag` above an actor; a `const` tag is carved in stone (any `value` change makes the stage `shake` with "cannot assign to constant"); a `var` tag is chalk |
| Integer type width | The `value` chip has a size: a `u8` chip has room for 0-255; pushing past it summons `zig/overflow-spark` (`attack`, `shake`, banner `integer overflow`) |
| Wrapping `+%` / saturating `+|` | Wrapping: the chip's counter rolls over like an odometer (`say "4"`); saturating: the chip glows at its cap (`say "255"`) |
| `comptime` | Work done in the forge before the level starts: the `banner "COMPTIME"` appears, items arrive already made |
| Optional `?T` | A `potion` bottle that may be empty; `orelse` hands a spare potion; `.?` on an empty bottle: `shake`, banner `attempt to use null value` |
| Error union `!T` | The ally returns either an item or a red `scroll` (the error); `try` passes the red scroll up to the caller; `catch` turns it into a default item |
| `defer` / `errdefer` | Scrolls pinned on a board; when the scope ends they `print` top-first (LIFO). `errdefer` scrolls are red and only fire if a red scroll (error) is leaving |
| `undefined` | `zig/undefined-imp` sits on an uninitialized chip; reading it before writing makes the imp laugh (`say "0xAA"`) |
| Safety-checked panic | Iggi's alarm bell: `shake` + `banner "panic: <message>"` |
| Array `[N]T` (value) | A chest; giving it away `clone`s it (arrays are copied) |
| Slice `[]T` / pointer `*T` | A `lend` that does not come back: the hero keeps a window onto the ally's chest; writes through it change the original |
| `*const T` | A `lend` without `mut`: look, don't touch |
| Allocator | A forge `ally` that hands out `item`s on request (`give`); every item must be returned (`drop` back) |
| Leak | Unreturned items drip into `zig/leak-jelly`, which grows (`hp` up) when `deinit` runs: banner `leak` |
| Arena | One big sack: items go in, the whole sack is emptied at once at the end |
| Generic `fn (comptime T: type)` | A mold: the forge casts a new tool for each `T` |

---

## Region plan (learning order)

Learning order: values and integers → optionals, errors and safety → data types and memory views
→ allocators and comptime. Allocators and comptime come last because they need slices,
pointers, structs and error handling; they are also Comptia's main story (the forge tower).

| # | Region slug | Theme | Big idea | Lessons |
|---|---|---|---|---|
| 1 | `forge-village` | village | `const`/`var`, integer widths and overflow, control flow, arrays and strings | 4 + boss |
| 2 | `optional-forest` | forest | Optionals, error unions, `defer`/`errdefer`, `undefined` and safety checks | 4 + boss |
| 3 | `struct-mountain` | mountain | Structs and methods, enums and tagged unions, pointers, slices and sentinels | 4 + boss |
| 4 | `comptime-tower` | tower | Allocators, arenas and `ArrayList`, `comptime`, generic types and testing | 4 + boss |

Exam-only topics with no region yet (candidates for a future region 5, castle theme, e.g.
`interop-castle`): C interop (`@cImport`, `extern`, `callconv(.c)`, `[*c]T`, `zig cc`), the build
system (`build.zig`, `-O ReleaseSafe`, cross-compilation), threads and atomics, the 0.15 I/O
interface (`std.Io.Writer`, buffers and `flush`), `packed`/`extern` structs and SIMD
(`@Vector`). Question ideas for them are in the exam section, mostly [DOC].

Boss enemies: `village-boss` → `zig/overflow-spark`; `forest-boss` → `zig/undefined-imp`;
`mountain-boss` → `zig/undefined-imp` (dangling views, wrong union fields); `tower-boss` →
`zig/leak-jelly`.

---

## Region 1: `forge-village`, Values, integers and the forge rules

Sources: Zig language reference 0.15.2, sections "Values", "Variables", "Integers",
"Operators", "Table of Operators", "if", "while", "for", "switch", "Arrays", "String Literals"
(https://ziglang.org/documentation/0.15.2/); zig.guide "Language Basics"
(https://zig.guide/language-basics/assignment); Ziglings exercises 001-020
(https://codeberg.org/ziglings/exercises).

### 1.1 `const-and-var`, "Stone tags and chalk tags"

- **Concept**: `const` (cannot change) vs `var` (can change); a type after `:` (`u32`, `i32`)
  or inferred; `std.debug.print("{d}\n", .{x})` with a tuple of arguments; the compiler rejects
  unused locals and parameters, `var`s that never change, and pointless discards; `_ = x;` to
  silence on purpose; integer literals are `comptime_int` and a `var` needs a concrete type;
  no shadowing.
- **Visual**: hero `enter`s with `tag "hp"` and `value "10"`. A `const` tag is stone: changing
  it makes the stage `shake` ("cannot assign to constant"). A `var` tag is chalk: `value "7"`
  replaces it. An unused `const` makes Iggi `say` "unused local constant" and the tag `untag`s.
- **Questions**:
  1. predict "What does it print?" → `7 3` [OUT]
     ```zig
     const a: i32 = 7;
     var b: i32 = 2;
     b += 1;
     std.debug.print("{d} {d}\n", .{ a, b });
     ```
  2. predict "Does it compile?" → No: `cannot assign to constant` [CE]
     ```zig
     const x: i32 = 5;
     x = 6;
     ```
  3. predict "Does it compile?" → No: `local variable is never mutated` [CE]
     ```zig
     var x: i32 = 5;
     std.debug.print("{d}\n", .{x});
     ```
  4. predict "Does it compile?" → No: `unused local constant` [CE]
     ```zig
     const x: i32 = 5;
     ```
  5. predict "What does it print?" → `ok` [OUT] (`_ = x;` silences "unused")
     ```zig
     const x: i32 = 5;
     _ = x;
     std.debug.print("ok\n", .{});
     ```
  6. predict "Does it compile?" → No: `pointless discard of local constant` [CE]
     ```zig
     const x: u8 = 1;
     _ = x;
     std.debug.print("{d}\n", .{x});
     ```
  7. predict "Does it compile?" → No: `variable of type 'comptime_int' must be const or comptime` [CE] (literals are `comptime_int`; write `var x: i32 = 5;`)
     ```zig
     var x = 5;
     x += 1;
     std.debug.print("{d}\n", .{x});
     ```
  8. predict "What does it print?" → `comptime_int comptime_float` [OUT]
     ```zig
     std.debug.print("{} {}\n", .{ @TypeOf(42), @TypeOf(1.5) });
     ```
  9. predict "Does it compile?" → No: `unused function parameter` [CE]
     ```zig
     // top:
     fn heal(hp: u32) u32 {
         return 10;
     }
     // main:
     std.debug.print("{d}\n", .{heal(3)});
     ```
  10. predict "Does it compile?" → No: `shadows local constant from outer scope` [CE]
     ```zig
     const x: i32 = 1;
     {
         const x: i32 = 2;
         _ = x;
     }
     _ = x;
     ```
  11. predict "What does it print?" → `hp: 7` [OUT]
     ```zig
     var hp: u32 = 10;
     hp -= 3;
     std.debug.print("hp: {d}\n", .{hp});
     ```
  12. predict "What does it print?" → `Iggi has 12 hp` [OUT]
     ```zig
     std.debug.print("{s} has {d} hp\n", .{ "Iggi", 12 });
     ```
  13. predict "Does it compile?" → No: `too few arguments` [CE]
     ```zig
     std.debug.print("{d} {d}\n", .{1});
     ```
  14. type: `___ hp: u32 = 10; hp -= 3;` printing `hp: 7` → `var` (same program as Q11) [OUT]
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  pub fn main() void {
      var hp: u32 = 10;
      const potion: u32 = 5;
      hp = potion;
      std.debug.print("hp: {d}\n", .{hp});
  }
  ```
  → prints `hp: 5`. `hp = potion` overwrites the value. Solution: `hp += potion;`. Output `hp: 15`. `expect`: `hp: 15`. [OUT → OUT]

### 1.2 `integer-widths`, "Chips have a size"

- **Concept**: unsigned `u8`/`u16`/`u32`/`u64`/`usize` and signed `i8`...`i64`; any width
  (`u3`, `u24`); widening coerces automatically, narrowing does not (`@intCast` checks at
  runtime, `@truncate` drops high bits, `@as` states a type); `std.math.maxInt`/`minInt`;
  overflow is a **checked panic** in Debug and ReleaseSafe (`integer overflow`) and is caught
  at compile time for comptime-known values; wrapping `+%` `-%` `*%`, saturating `+|` `-|`,
  `@addWithOverflow` returns a tuple `{ result, overflow_bit }`; mixing signed and unsigned is
  a compile error; signed division needs `@divTrunc`/`@divFloor`, remainder `@mod`/`@rem`.
- **Visual**: each chip shows its width (`u8`). Adding past 255 summons `zig/overflow-spark`,
  which `attack`s; `shake` and banner `integer overflow`. With `+%` the chip's odometer rolls to
  `4`; with `+|` it glows at `255`. `@intCast` is a narrow gate: a chip that is too big gets
  stuck (`banner "integer does not fit in destination type"`).
- **Questions**:
  1. predict "What does it print?" → `200 u16` [OUT]
     ```zig
     const x: u8 = 200;
     const y: u16 = x;
     std.debug.print("{d} {}\n", .{ y, @TypeOf(y) });
     ```
  2. predict "Does it compile?" → No: `expected type 'u8', found 'u16'` [CE]
     ```zig
     var big: u16 = 300;
     _ = &big;
     const s: u8 = big;
     std.debug.print("{d}\n", .{s});
     ```
  3. predict "Does it compile?" → No: `type 'u8' cannot represent integer value '300'` [CE]
     ```zig
     const s: u8 = 300;
     _ = s;
     ```
  4. predict "What happens?" → compiles, then `panic: integer overflow` [PANIC]
     ```zig
     var n: u8 = 0;
     _ = &n;
     n -= 1;
     ```
  5. predict "What does it print?" → `4 255` [OUT]
     ```zig
     var w: u8 = 250;
     w +%= 10;
     var s: u8 = 250;
     s +|= 10;
     std.debug.print("{d} {d}\n", .{ w, s });
     ```
  6. predict "What does it print?" → `4 1` [OUT]
     ```zig
     const r = @addWithOverflow(@as(u8, 250), 10);
     std.debug.print("{d} {d}\n", .{ r[0], r[1] });
     ```
  7. predict "What happens?" → compiles, then `panic: integer does not fit in destination type` [PANIC]
     ```zig
     var big: u32 = 300;
     _ = &big;
     const s: u8 = @intCast(big);
     std.debug.print("{d}\n", .{s});
     ```
  8. predict "What does it print?" → `44` [OUT]
     ```zig
     const big: u32 = 300;
     const small: u8 = @truncate(big);
     std.debug.print("{d}\n", .{small});
     ```
  9. predict "Does it compile?" → No: `signed integers must use @divTrunc, @divFloor, or @divExact` [CE]
     ```zig
     var a: i32 = -7;
     _ = &a;
     std.debug.print("{d}\n", .{a / 2});
     ```
  10. predict "What does it print?" → `-3 -4 2` [OUT]
     ```zig
     std.debug.print("{d} {d} {d}\n", .{ @divTrunc(-7, 2), @divFloor(-7, 2), @mod(-7, 3) });
     ```
  11. predict "Does it compile?" → No: `incompatible types: 'i32' and 'u32'` [CE]
     ```zig
     var a: i32 = 1;
     var b: u32 = 2;
     _ = &a;
     _ = &b;
     std.debug.print("{d}\n", .{a + b});
     ```
  12. predict "What does it print?" → `0 7` [OUT] (`u3` holds 0-7)
     ```zig
     var u: u3 = 7;
     u +%= 1;
     std.debug.print("{d} {d}\n", .{ u, std.math.maxInt(u3) });
     ```
  13. predict "What does it print?" → `255 -128` [OUT]
     ```zig
     std.debug.print("{d} {d}\n", .{ std.math.maxInt(u8), std.math.minInt(i8) });
     ```
  14. predict "What happens?" → compiles, then `panic: integer overflow` [PANIC]
     ```zig
     var x: i8 = -128;
     _ = &x;
     const y = -x;
     std.debug.print("{d}\n", .{y});
     ```
  15. predict "What does it print?" → `3` [OUT] (compiles: all values are comptime-known and fit; contrast with Q2)
     ```zig
     const x: u8 = 3;
     const y: i32 = x;
     const z: u8 = y;
     std.debug.print("{d}\n", .{z});
     ```
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  pub fn main() void {
      var coins: u8 = 200;
      const bonus: u8 = 100;
      coins += bonus;
      std.debug.print("coins: {d}\n", .{coins});
  }
  ```
  → panics: `integer overflow`. `200 + 100` does not fit in a `u8`. Solution: `var coins: u16 = 200;` (a `u8` bonus widens to `u16` automatically). Output `coins: 300`. `expect`: `coins: 300`. [PANIC → OUT]

### 1.3 `loops-and-switch`, "Paths through the village"

- **Concept**: `if` is an expression (`const k = if (c) a else b;`) and conditions must be
  `bool`; `while (cond) : (continue_expr)`; `for (0..n) |i|`, `for (items, 0..) |v, i|`,
  `for (a, b) |x, y|` (same length); loops can `break` with a value and have an `else`;
  labeled blocks `blk: { break :blk v; }`, labeled `continue :outer`/`break :outer`; `switch`
  must be exhaustive, supports ranges `90...100`, lists `0, 6 =>`, `else`, and is an
  expression; no `switch` on strings; unused captures are errors.
- **Visual**: the hero walks a path of tiles; `while` repeats a tile until the condition
  fails; `continue` skips a tile (`say "skip"`); `switch` is a signpost with one arrow per
  case, and a missing arrow makes the signpost `shake` ("switch must handle all possibilities").
- **Questions**:
  1. predict "What does it print?" → `big` [OUT]
     ```zig
     const t: i32 = 5;
     const kind = if (t > 3) "big" else "small";
     std.debug.print("{s}\n", .{kind});
     ```
  2. predict "What does it print?" → `8 5` [OUT]
     ```zig
     var i: u32 = 0;
     var sum: u32 = 0;
     while (i < 5) : (i += 1) {
         if (i == 2) continue;
         sum += i;
     }
     std.debug.print("{d} {d}\n", .{ sum, i });
     ```
  3. predict "What does it print?" → `0123` [OUT]
     ```zig
     for (0..4) |k| std.debug.print("{d}", .{k});
     std.debug.print("\n", .{});
     ```
  4. predict "What does it print?" → `0:10 1:20 2:30` [OUT] (each item is followed by a space)
     ```zig
     const items = [_]u8{ 10, 20, 30 };
     for (items, 0..) |v, i| std.debug.print("{d}:{d} ", .{ i, v });
     std.debug.print("\n", .{});
     ```
  5. predict "What does it print?" → `ann=30 bo=40` [OUT] (each item is followed by a space)
     ```zig
     const names = [_][]const u8{ "ann", "bo" };
     const ages = [_]u8{ 30, 40 };
     for (names, ages) |n, a| std.debug.print("{s}={d} ", .{ n, a });
     std.debug.print("\n", .{});
     ```
  6. predict "What does it print?" → `20` [OUT]
     ```zig
     const items = [_]u8{ 10, 20, 30 };
     const found = for (items) |v| {
         if (v > 15) break v;
     } else 0;
     std.debug.print("{d}\n", .{found});
     ```
  7. predict "What does it print?" → `6` [OUT]
     ```zig
     const x = blk: {
         const q = 3;
         break :blk q * 2;
     };
     std.debug.print("{d}\n", .{x});
     ```
  8. predict "What does it print?" → `B` [OUT]
     ```zig
     const g: u8 = 72;
     const grade = switch (g) {
         90...100 => 'A',
         70...89 => 'B',
         else => 'C',
     };
     std.debug.print("{c}\n", .{grade});
     ```
  9. predict "Does it compile?" → No: `expected type 'bool', found 'i32'` [CE]
     ```zig
     var x: i32 = 1;
     if (x) {
         x = 2;
     }
     ```
  10. predict "Does it compile?" → No: `cannot switch on strings` [CE]
     ```zig
     const s: []const u8 = "a";
     switch (s) {
         "a" => {},
         else => {},
     }
     ```
  11. predict "What does it print?" → `00 10` [OUT]
     ```zig
     outer: for (0..3) |x| {
         for (0..3) |y| {
             if (y == 1) continue :outer;
             if (x == 2) break :outer;
             std.debug.print("{d}{d} ", .{ x, y });
         }
     }
     std.debug.print("\n", .{});
     ```
  12. predict "What does it print?" → `243` [OUT]
     ```zig
     var n: u32 = 1;
     while (n < 100) n *= 3;
     std.debug.print("{d}\n", .{n});
     ```
  13. predict "Does it compile?" → No: `unused capture` [CE]
     ```zig
     const xs = [_]u8{ 1, 2 };
     for (xs) |x| {}
     ```
  14. predict "Does it compile?" → No: `switch must handle all possibilities` [CE]
     ```zig
     var g: u8 = 72;
     _ = &g;
     const c: u8 = switch (g) {
         0...100 => 'x',
     };
     std.debug.print("{c}\n", .{c});
     ```
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  pub fn main() void {
      var i: u32 = 1;
      var total: u32 = 0;
      while (i < 5) : (i += 1) {
          total += i;
      }
      std.debug.print("total: {d}\n", .{total});
  }
  ```
  → prints `total: 10`. Off by one: `i < 5` stops before 5. Solution: `while (i <= 5)`. Output `total: 15`. `expect`: `total: 15`. [OUT → OUT]

### 1.4 `arrays-and-strings`, "Chests and scrolls of bytes"

- **Concept**: arrays `[3]u8`, `[_]u8{...}` (length inferred), `.len`, arrays are values (a
  copy is independent); a string is bytes: literals are `*const [N:0]u8` (pointer to a
  null-terminated array) and coerce to `[]const u8`, the usual string type; `.len` counts bytes
  (UTF-8 "é" is 2); indexing gives a `u8`; compare with `std.mem.eql`, not `==`; `++` and `**`
  work at compile time; index checks (compile time for constants, panic at runtime);
  `{s}`/`{c}`/`{any}` formats.
- **Visual**: a string is a `scroll` cut into byte squares ("é" takes two). Giving an array
  away `clone`s the chest. Reading square 5 of a 3-square scroll: alarm bell, banner
  `index out of bounds: index 5, len 3`.
- **Questions**:
  1. predict "What does it print?" → `6 h` [OUT] (`é` is 2 bytes in UTF-8)
     ```zig
     const s = "héllo";
     std.debug.print("{d} {c}\n", .{ s.len, s[0] });
     ```
  2. predict "What does it print?" → `*const [3:0]u8` [OUT] (pointer to a null-terminated array of 3 bytes)
     ```zig
     std.debug.print("{}\n", .{@TypeOf("abc")});
     ```
  3. predict "What does it print?" → `[]const u8 3` [OUT]
     ```zig
     const word: []const u8 = "zig";
     std.debug.print("{} {d}\n", .{ @TypeOf(word), word.len });
     ```
  4. predict "Does it compile?" → No: `operator == not allowed for type '[]const u8'` [CE]
     ```zig
     const a: []const u8 = "hi";
     const b: []const u8 = "hi";
     std.debug.print("{}\n", .{a == b});
     ```
  5. predict "What does it print?" → `true false` [OUT]
     ```zig
     std.debug.print("{} {}\n", .{ std.mem.eql(u8, "ab", "ab"), std.mem.eql(u8, "ab", "abc") });
     ```
  6. predict "What does it print?" → `concat ababab` [OUT]
     ```zig
     std.debug.print("{s} {s}\n", .{ "con" ++ "cat", "ab" ** 3 });
     ```
  7. predict "What does it print?" → `1 9` [OUT] (arrays are values: `b` is a copy)
     ```zig
     const a = [_]i32{ 1, 2, 3 };
     var b = a;
     b[0] = 9;
     std.debug.print("{d} {d}\n", .{ a[0], b[0] });
     ```
  8. predict "Does it compile?" → No: `index 5 outside array of length 3` [CE] (constant index: caught at compile time; pair with Q9)
     ```zig
     const xs = [_]u8{ 1, 2, 3 };
     std.debug.print("{d}\n", .{xs[5]});
     ```
  9. predict "What happens?" → compiles, then `panic: index out of bounds: index 5, len 3` [PANIC]
     ```zig
     const xs = [_]u8{ 1, 2, 3 };
     var i: usize = 5;
     _ = &i;
     std.debug.print("{d}\n", .{xs[i]});
     ```
  10. predict "Does it compile?" → No: `cannot assign to constant` [CE]
     ```zig
     const s = "abc";
     s[0] = 'x';
     ```
  11. predict "What does it print?" → `{ 1, 2, 3 }` [OUT]
     ```zig
     std.debug.print("{any}\n", .{[_]u8{ 1, 2, 3 }});
     ```
  12. predict "Does it compile?" → No: `cannot format slice without a specifier` [CE]
     ```zig
     const s: []const u8 = "hi";
     std.debug.print("{}\n", .{s});
     ```
  13. predict "What does it print?" → `3` [OUT]
     ```zig
     var count: u8 = 0;
     for ("banana") |ch| {
         if (ch == 'a') count += 1;
     }
     std.debug.print("{d}\n", .{count});
     ```
  14. predict "What does it print?" → `h|llo` [OUT]
     ```zig
     const s = "héllo";
     std.debug.print("{s}|{s}\n", .{ s[0..1], s[3..] });
     ```
  15. predict "Does it compile?" → No: `invalid format string 'd' for type '[3]u8'` [CE]
     ```zig
     const xs = [_]u8{ 1, 2, 3 };
     std.debug.print("{d}\n", .{xs});
     ```
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  pub fn main() void {
      const word: []const u8 = "forge";
      var vowels: u32 = 0;
      var i: usize = 0;
      while (i <= word.len) : (i += 1) {
          switch (word[i]) {
              'a', 'e', 'i', 'o', 'u' => vowels += 1,
              else => {},
          }
      }
      std.debug.print("vowels: {d}\n", .{vowels});
  }
  ```
  → panics: `index out of bounds: index 5, len 5`. `i <= word.len` reads one byte past the end. Solution: `while (i < word.len)`. Output `vowels: 2`. `expect`: `vowels: 2`. [PANIC → OUT]

### Boss: `village-boss`, "The Overflow Spark" (enemy `zig/overflow-spark`)

Timed mix of region 1, 6-8 questions. New ones:

1. predict "What does it print?" → `ff 101 10` [OUT]
   ```zig
   std.debug.print("{x} {b} {o}\n", .{ 255, 5, 8 });
   ```
2. predict "What does it print?" → `0 1` [OUT]
   ```zig
   const r = @mulWithOverflow(@as(u8, 16), 16);
   std.debug.print("{d} {d}\n", .{ r[0], r[1] });
   ```
3. predict "What does it print?" → `255 -128` [OUT]
   ```zig
   std.debug.print("{d} {d}\n", .{ @as(u8, 200) +| 100, @as(i8, -100) -| 100 });
   ```
4. predict "What does it print?" → `0` [OUT]
   ```zig
   std.debug.print("{d}\n", .{std.math.add(u8, 250, 10) catch 0});
   ```
5. predict "What does it print?" → `1099511627776` [OUT]
   ```zig
   const big: u64 = 1 << 40;
   std.debug.print("{d}\n", .{big});
   ```
6. predict "What does it print?" → `3.14 007` [OUT]
   ```zig
   std.debug.print("{d:.2} {d:0>3}\n", .{ 3.14159, 7 });
   ```
7. Reuse from lessons: 1.1 Q3, 1.2 Q4, 1.2 Q5, 1.3 Q8, 1.4 Q4.

---

## Region 2: `optional-forest`, Optionals, errors and safety

Sources: language reference 0.15.2 sections "Optionals", "Errors" (error sets, `try`,
`catch`, `errdefer`, error return traces), "defer", "undefined", "unreachable", "Illegal
Behavior", "Build Mode" (https://ziglang.org/documentation/0.15.2/); zig.guide "Errors",
"Defer", "Optionals" (https://zig.guide/language-basics/errors); Ziglings 021-050.

### 2.1 `optionals`, "Bottles that may be empty"

- **Concept**: `?T` holds a `T` or `null`; a plain `T` can never be `null` (including pointers:
  `*T` is never null, `?*T` may be, and costs no extra space); `orelse` gives a default;
  `.?` unwraps and panics on `null`; `if (opt) |v|` and `while (it.next()) |v|` capture the
  value; `|*p|` captures a pointer to change it; you cannot do arithmetic on an optional.
- **Visual**: a `potion` bottle tagged `maybe`. `null` = empty bottle (grey). `orelse` makes
  the ally `give` a spare potion. `.?` on an empty bottle: `shake`, banner
  `attempt to use null value`. `if (maybe) |v|` opens the bottle and tags its contents `v`.
- **Questions**:
  1. predict "What does it print?" → `null true` / `5 5` [OUT]
     ```zig
     var maybe: ?i32 = null;
     std.debug.print("{any} {}\n", .{ maybe, maybe == null });
     maybe = 5;
     std.debug.print("{any} {d}\n", .{ maybe, maybe.? });
     ```
  2. predict "What does it print?" → `0` [OUT]
     ```zig
     const none: ?i32 = null;
     std.debug.print("{d}\n", .{none orelse 0});
     ```
  3. predict "What does it print?" → `got 5` [OUT]
     ```zig
     const maybe: ?i32 = 5;
     if (maybe) |v| {
         std.debug.print("got {d}\n", .{v});
     } else {
         std.debug.print("none\n", .{});
     }
     ```
  4. predict "Does it compile?" → No: `invalid operands to binary expression: 'optional' and 'comptime_int'` [CE]
     ```zig
     const x: ?i32 = 5;
     const y: i32 = x + 1;
     _ = y;
     ```
  5. predict "Does it compile?" → No: `expected type 'i32', found '@TypeOf(null)'` [CE]
     ```zig
     const x: i32 = null;
     _ = x;
     ```
  6. predict "What happens?" → prints `before`, then `panic: attempt to use null value` [PANIC]
     ```zig
     var x: ?i32 = null;
     _ = &x;
     std.debug.print("before\n", .{});
     std.debug.print("{d}\n", .{x.?});
     ```
  7. predict "What does it print?" → `1 null` [OUT]
     ```zig
     // top:
     fn find(xs: []const i32, target: i32) ?usize {
         for (xs, 0..) |x, i| {
             if (x == target) return i;
         }
         return null;
     }
     // main:
     const xs = [_]i32{ 4, 8, 15 };
     std.debug.print("{any} {any}\n", .{ find(&xs, 8), find(&xs, 99) });
     ```
  8. predict "What does it print?" → `8 8 8 4` [OUT] (an optional pointer uses address 0 for null; an optional `u32` needs an extra flag, padded to 8)
     ```zig
     std.debug.print("{d} {d} {d} {d}\n", .{ @sizeOf(?*const i32), @sizeOf(*const i32), @sizeOf(?u32), @sizeOf(u32) });
     ```
  9. predict "What does it print?" → `8` [OUT]
     ```zig
     var opt: ?u8 = 7;
     if (opt) |*p| p.* += 1;
     std.debug.print("{d}\n", .{opt.?});
     ```
  10. predict "What does it print?" → `[a][b][c]` [OUT]
     ```zig
     var it = std.mem.splitScalar(u8, "a,b,c", ',');
     while (it.next()) |part| std.debug.print("[{s}]", .{part});
     std.debug.print("\n", .{});
     ```
  11. predict "Does it compile?" → No: `expected optional type, found 'i32'` [CE]
     ```zig
     const n: i32 = 5;
     if (n) |v| {
         _ = v;
     }
     ```
  12. predict "Does it compile?" → No: `expected type '*i32', found '@TypeOf(null)'` [CE]
     ```zig
     const p: *i32 = null;
     _ = p;
     ```
  13. predict "What does it print?" → `nobody` [OUT]
     ```zig
     const opt: ?[]const u8 = null;
     const name = opt orelse "nobody";
     std.debug.print("{s}\n", .{name});
     ```
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  fn find(names: []const []const u8, target: []const u8) ?usize {
      for (names, 0..) |name, i| {
          if (std.mem.eql(u8, name, target)) return i;
      }
      return null;
  }

  pub fn main() void {
      const team = [_][]const u8{ "iggi", "rex" };
      const slot = find(&team, "zed").?;
      std.debug.print("slot: {d}\n", .{slot});
  }
  ```
  → panics: `attempt to use null value`. `.?` on a lookup that returns `null`. Solution: `if (find(&team, "zed")) |slot| { ...print slot... } else { std.debug.print("not found\n", .{}); }`. Output `not found`. `expect`: `not found`. [PANIC → OUT]

### 2.2 `error-unions`, "Red scrolls"

- **Concept**: errors are values in an error set (`error{ NotFound, Denied }`); `E!T` is
  "an error from E or a T"; `!T` infers the set; `try x` = "unwrap or return the error to my
  caller"; `catch v`, `catch |err| ...` (often with `switch (err)`); `if (r) |v| ... else |err| ...`;
  an error union cannot be used as its payload nor ignored; `try` only works in a function that
  can return an error; `@errorName`; merging sets with `||`; `anyerror`; `orelse error.X` turns
  a null into an error; no exceptions, no hidden control flow.
- **Visual**: the ally `give`s back either the item or a red `scroll` with the error name.
  `try` makes the hero pass the red scroll up to whoever called (`give` up the chain); `catch`
  burns the scroll and hands a default item. Ignoring the red scroll: `shake`
  ("error union is ignored").
- **Questions**:
  1. predict "What does it print?" → `3 0` [OUT]
     ```zig
     // top:
     const FileError = error{ NotFound, Denied };

     fn open(name: []const u8) FileError!u32 {
         if (std.mem.eql(u8, name, "ok")) return 3;
         if (std.mem.eql(u8, name, "secret")) return error.Denied;
         return error.NotFound;
     }
     // main:
     const a = open("ok") catch 0;
     const b = open("nope") catch 0;
     std.debug.print("{d} {d}\n", .{ a, b });
     ```
  2. predict "What does it print?" → `Denied` [OUT]
     ```zig
     // top:
     const FileError = error{ NotFound, Denied };

     fn open(name: []const u8) FileError!u32 {
         if (std.mem.eql(u8, name, "ok")) return 3;
         if (std.mem.eql(u8, name, "secret")) return error.Denied;
         return error.NotFound;
     }
     // main:
     if (open("secret")) |fd| {
         std.debug.print("fd {d}\n", .{fd});
     } else |err| {
         std.debug.print("{s}\n", .{@errorName(err)});
     }
     ```
  3. predict "What does it print?" → `6 error.NotFound` [OUT]
     ```zig
     // top:
     const FileError = error{ NotFound, Denied };

     fn open(name: []const u8) FileError!u32 {
         if (std.mem.eql(u8, name, "ok")) return 3;
         if (std.mem.eql(u8, name, "secret")) return error.Denied;
         return error.NotFound;
     }

     fn twice(name: []const u8) !u32 {
         const fd = try open(name);
         return fd * 2;
     }
     // main:
     std.debug.print("{any} {any}\n", .{ twice("ok"), twice("x") });
     ```
  4. predict "What does it print?" → `404` [OUT]
     ```zig
     // top:
     const FileError = error{ NotFound, Denied };

     fn open(name: []const u8) FileError!u32 {
         if (std.mem.eql(u8, name, "ok")) return 3;
         if (std.mem.eql(u8, name, "secret")) return error.Denied;
         return error.NotFound;
     }
     // main:
     const code = open("x") catch |err| switch (err) {
         error.NotFound => @as(u32, 404),
         error.Denied => 403,
     };
     std.debug.print("{d}\n", .{code});
     ```
  5. predict "Does it compile?" → No: `cannot convert error union to payload type` [CE]
     ```zig
     // top:
     fn half(n: u32) !u32 {
         if (n % 2 == 1) return error.Odd;
         return n / 2;
     }
     // main:
     const v: u32 = half(4);
     _ = v;
     ```
  6. predict "Does it compile?" → No: `error union is ignored` [CE]
     ```zig
     // top:
     fn half(n: u32) !u32 {
         if (n % 2 == 1) return error.Odd;
         return n / 2;
     }
     // main:
     half(4);
     ```
  7. predict "Does it compile?" → No: `function cannot return an error` [CE] (the note says `function cannot return an error`)
     ```zig
     // top:
     fn half(n: u32) !u32 {
         if (n % 2 == 1) return error.Odd;
         return n / 2;
     }

     fn show() void {
         const v = try half(4);
         std.debug.print("{d}\n", .{v});
     }
     // main:
     show();
     ```
  8. predict "Does it compile?" → No: `'error.Even' not a member of destination error set` [CE]
     ```zig
     // top:
     fn half(n: u32) !u32 {
         if (n % 2 == 1) return error.Odd;
         return n / 2;
     }
     // main:
     const v = half(3) catch |e| switch (e) {
         error.Odd => 0,
         error.Even => 1,
     };
     _ = v;
     ```
  9. predict "What does it print?" → `error.Overflow error.InvalidCharacter` [OUT]
     ```zig
     std.debug.print("{any} {any}\n", .{ std.fmt.parseInt(u8, "300", 10), std.fmt.parseInt(u8, "x1", 10) });
     ```
  10. predict "What does it print?" → `Timeout` [OUT]
     ```zig
     // top:
     const FileError = error{ NotFound, Denied };
     // main:
     const Merged = FileError || error{Timeout};
     const m: Merged = error.Timeout;
     std.debug.print("{s}\n", .{@errorName(m)});
     ```
  11. predict "What does it print?" → `error.Oops Oops error{Oops}` [OUT]
     ```zig
     const e: anyerror = error.Oops;
     std.debug.print("{any} {s} {}\n", .{ e, @errorName(e), @TypeOf(error.Oops) });
     ```
  12. predict "What happens?" → compiles, then `panic: attempt to unwrap error: Odd` [PANIC]
     ```zig
     // top:
     fn half(n: u32) !u32 {
         if (n % 2 == 1) return error.Odd;
         return n / 2;
     }
     // main:
     const v = half(3) catch unreachable;
     std.debug.print("{d}\n", .{v});
     ```
  13. predict "What does it print?" → `-40` [OUT]
     ```zig
     const num = try std.fmt.parseInt(i32, "-42", 10);
     std.debug.print("{d}\n", .{num + 2});
     ```
  14. predict "What does it print?" → `4 error.NoEven` [OUT]
     ```zig
     // top:
     fn firstEven(xs: []const u32) ?u32 {
         for (xs) |x| if (x % 2 == 0) return x;
         return null;
     }

     fn needEven(xs: []const u32) !u32 {
         return firstEven(xs) orelse error.NoEven;
     }
     // main:
     std.debug.print("{any} {any}\n", .{ needEven(&.{ 1, 4 }), needEven(&.{ 1, 3 }) });
     ```
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  pub fn main() void {
      const level = std.fmt.parseInt(u8, "300", 10) catch unreachable;
      std.debug.print("level: {d}\n", .{level});
  }
  ```
  → panics: `attempt to unwrap error: Overflow`. `catch unreachable` on input that can fail. Solution: `catch |err| { std.debug.print("bad input: {s}\n", .{@errorName(err)}); return; };`. Output `bad input: Overflow`. `expect`: `bad input: Overflow`. [PANIC → OUT]

### 2.3 `defer-and-errdefer`, "Scrolls on the board"

- **Concept**: `defer stmt` runs when the **enclosing scope** (block, loop body, function) ends,
  in reverse order (LIFO); it runs the whole statement at that moment, so it sees the latest
  values (unlike Go, nothing is evaluated early); a `return` value is computed before the
  defers run; `errdefer` runs only when the function returns an error, and can capture it
  (`errdefer |err| ...`); the idiom is "acquire, then immediately `defer`/`errdefer` release".
- **Visual**: each `defer` pins a scroll on a board; at the end of the scope the scrolls
  `print` from the top down. `errdefer` scrolls are red: they only fire if a red error scroll
  is leaving the function, otherwise they are `drop`ped unread.
- **Questions**:
  1. predict "What does it print?" → `body` / `second` / `first` [OUT]
     ```zig
     defer std.debug.print("first\n", .{});
     defer std.debug.print("second\n", .{});
     std.debug.print("body\n", .{});
     ```
  2. predict "What does it print?" → `inside` / `block end` / `after` [OUT]
     ```zig
     {
         defer std.debug.print("block end\n", .{});
         std.debug.print("inside\n", .{});
     }
     std.debug.print("after\n", .{});
     ```
  3. predict "What does it print?" → `012` [OUT]
     ```zig
     for (0..3) |k| {
         defer std.debug.print("{d}", .{k});
     }
     std.debug.print("\n", .{});
     ```
  4. predict "What does it print?" → `12` [OUT]
     ```zig
     var x: u32 = 1;
     {
         defer x += 10;
         x = 2;
     }
     std.debug.print("{d}\n", .{x});
     ```
  5. predict "What does it print?" → `start ok defer ` / `start errdefer defer caught Boom` [OUT] (the first line ends with a space)
     ```zig
     // top:
     fn step(fail: bool) !void {
         std.debug.print("start ", .{});
         defer std.debug.print("defer ", .{});
         errdefer std.debug.print("errdefer ", .{});
         if (fail) return error.Boom;
         std.debug.print("ok ", .{});
     }
     // main:
     step(false) catch {};
     std.debug.print("\n", .{});
     step(true) catch |err| std.debug.print("caught {s}", .{@errorName(err)});
     std.debug.print("\n", .{});
     ```
  6. predict "What does it print?" → `cleanup after Negative` [OUT]
     ```zig
     // top:
     fn check(n: i32) !i32 {
         errdefer |err| std.debug.print("cleanup after {s}\n", .{@errorName(err)});
         if (n < 0) return error.Negative;
         return n;
     }
     // main:
     _ = check(-1) catch 0;
     ```
  7. predict "What does it print?" → `now: 2` / `deferred: 2` [OUT] (unlike Go, Zig evaluates the whole deferred statement at scope exit)
     ```zig
     var x: u32 = 1;
     defer std.debug.print("deferred: {d}\n", .{x});
     x = 2;
     std.debug.print("now: {d}\n", .{x});
     ```
  8. predict "What does it print?" → `1` [OUT] (the return value is computed before the defer runs)
     ```zig
     // top:
     fn f() u32 {
         var n: u32 = 1;
         defer n += 1;
         return n;
     }
     // main:
     std.debug.print("{d}\n", .{f()});
     ```
  9. order: put the lines in the order that prints `body` / `second` / `first`: `defer std.debug.print("first\n", .{});` → `defer std.debug.print("second\n", .{});` → `std.debug.print("body\n", .{});` (Q1) [OUT]
  10. pick: "Which one runs only when the function returns an error?" options `errdefer` / `defer` / `catch` → `errdefer` [DOC: language reference "errdefer"]
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  var cleanups: u32 = 0;

  fn build(fail: bool) !void {
      defer cleanups += 1;
      if (fail) return error.Collapsed;
      std.debug.print("tower built\n", .{});
  }

  pub fn main() void {
      build(false) catch {};
      build(true) catch |err| std.debug.print("failed: {s}\n", .{@errorName(err)});
      std.debug.print("cleanups: {d}\n", .{cleanups});
  }
  ```
  → prints `tower built` / `failed: Collapsed` / `cleanups: 2`. Cleanup should only happen on failure. Solution: `errdefer cleanups += 1;`. Output `tower built` / `failed: Collapsed` / `cleanups: 1`. `expect`: `cleanups: 1`. [OUT → OUT]

### 2.4 `undefined-and-safety`, "The Undefined Imp"

- **Concept**: `undefined` means "no value yet" (a promise to write before reading); reading
  it is illegal behavior; `unreachable` asserts a branch never happens (panics in Debug);
  safety checks (overflow, bounds, null, union tag, `unreachable`, division by zero, invalid
  enum) are on in **Debug** and **ReleaseSafe** and off in **ReleaseFast**/**ReleaseSmall**,
  where the same bug is undefined behavior; comptime-known overflow is a compile error;
  `@setRuntimeSafety` per scope.
- **Visual**: `zig/undefined-imp` squats on a chip declared `undefined`. Writing a value first
  scares it away (`exit`); reading first lets it `attack` (garbage `say "2863311536"`). Each
  safety check is one of Iggi's alarm bells; banner shows the panic message.
- **Questions**:
  1. predict "What does it print?" → `3` [OUT]
     ```zig
     var x: i32 = undefined;
     x = 3;
     std.debug.print("{d}\n", .{x});
     ```
  2. predict "What happens?" → compiles, then `panic: reached unreachable code` [PANIC]
     ```zig
     var x: u8 = 3;
     _ = &x;
     switch (x) {
         1 => {},
         else => unreachable,
     }
     ```
  3. predict "What happens?" → compiles, then `panic: division by zero` [PANIC]
     ```zig
     var a: u32 = 7;
     var b: u32 = 0;
     _ = &a;
     _ = &b;
     std.debug.print("{d}\n", .{a / b});
     ```
  4. predict "What happens?" → compiles, then `panic: start index 3 is larger than end index 1` [PANIC]
     ```zig
     const xs = [_]u8{ 1, 2, 3, 4 };
     var lo: usize = 3;
     var hi: usize = 1;
     _ = &lo;
     _ = &hi;
     std.debug.print("{any}\n", .{xs[lo..hi]});
     ```
  5. predict "What does it print?" → `6` [OUT]
     ```zig
     var total: u32 = 0;
     for ([_]u32{ 1, 2, 3 }) |g| total += g;
     std.debug.print("{d}\n", .{total});
     ```
  6. predict "Does it compile?" → No: `overflow of integer type 'u8' with value '256'` [CE] (comptime-known overflow is a compile error; at runtime it would panic, Q7)
     ```zig
     const x: u8 = 255;
     const y = x + 1;
     std.debug.print("{d}\n", .{y});
     ```
  7. predict "What happens?" → compiles, then `panic: integer overflow` [PANIC]
     ```zig
     var n: u8 = 200;
     _ = &n;
     const doubled = n * 2;
     std.debug.print("{d}\n", .{doubled});
     ```
  8. predict "What does it print?" → `254` [OUT]
     ```zig
     std.debug.print("{d}\n", .{@as(u8, 255) *% 2});
     ```
  9. pick: "In which build modes do safety checks like `integer overflow` stay on?" options `Debug and ReleaseSafe` / `only Debug` / `all four` → `Debug and ReleaseSafe` [DOC: https://ziglang.org/learn/overview/ and language reference "Build Mode"]
  10. pick: "`var total: u32 = undefined;` then `total += g` in a loop. What is wrong?" options `reads total before writing it` / `nothing` / `u32 too small` → the first [DOC; in Debug the starter of the run below prints `total: 2863311536`, never claim that as a check]
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  pub fn main() void {
      const gems = [_]u32{ 1, 2, 3 };
      var total: u32 = undefined;
      for (gems) |g| total += g;
      std.debug.print("total: {d}\n", .{total});
  }
  ```
  → prints `total: 2863311536` in Debug (garbage from `undefined`). `total` starts `undefined` (Debug fills it with `0xAA` bytes). Solution: `var total: u32 = 0;`. Output `total: 6`. `expect`: `total: 6`. [OUT → OUT]

### Boss: `forest-boss`, "The Undefined Imp"

1. predict "What does it print?" → `7` [OUT]
   ```zig
   // top:
   fn parse(s: []const u8) !i32 {
       return std.fmt.parseInt(i32, s, 10);
   }
   // main:
   const r = parse("7") catch |err| switch (err) {
       error.InvalidCharacter => -1,
       else => -2,
   };
   std.debug.print("{d}\n", .{r});
   ```
2. predict "What does it print?" → `5` [OUT]
   ```zig
   const a: ?u8 = null;
   const b: ?u8 = 4;
   std.debug.print("{d}\n", .{(a orelse 1) + (b orelse 1)});
   ```
3. Reuse: 2.1 Q6, 2.2 Q3, 2.2 Q6, 2.3 Q5, 2.3 Q7, 2.4 Q4.

---

## Region 3: `struct-mountain`, Types and views of memory

Sources: language reference 0.15.2 sections "struct", "enum", "union" (tagged unions),
"Pointers", "Slices", "Sentinel-Terminated Arrays/Pointers/Slices", "Type Coercion"
(https://ziglang.org/documentation/0.15.2/); zig.guide "Structs", "Enums", "Unions",
"Pointers", "Slices", "Many-item pointers", "Sentinel termination"; Ziglings 037-080.

### 3.1 `structs-and-methods`, "Blueprints"

- **Concept**: `struct` fields with types and defaults; literals `Point{ .x = 1 }` (all
  fields without a default are required); methods are functions in the struct's namespace,
  called with dot syntax; `self: Point` gets a copy, `self: *Point` can change the original;
  calling a `*Point` method on a `const` value fails; assignment copies the struct; `@This()`;
  anonymous tuples `.{ 1, "two", true }`.
- **Visual**: a struct is a blueprint scroll; each instance is an ally with several tags
  (`x`, `y`). `self: Point` is a `clone` (changes are lost); `self: *Point` is a `lend` with
  `mut`. Calling `moveRight` on a `const` ally makes the stage `shake`.
- **Questions**:
  1. predict "What does it print?" → `3` [OUT]
     ```zig
     // top:
     const Point = struct {
         x: i32,
         y: i32 = 0,

         pub fn sum(self: Point) i32 {
             return self.x + self.y;
         }

         pub fn moveRight(self: *Point, d: i32) void {
             self.x += d;
         }
     };
     // main:
     const p = Point{ .x = 1, .y = 2 };
     std.debug.print("{d}\n", .{p.sum()});
     ```
  2. predict "What does it print?" → `6 8` [OUT]
     ```zig
     // top:
     const Point = struct {
         x: i32,
         y: i32 = 0,

         pub fn sum(self: Point) i32 {
             return self.x + self.y;
         }

         pub fn moveRight(self: *Point, d: i32) void {
             self.x += d;
         }
     };
     // main:
     var p = Point{ .x = 1, .y = 2 };
     p.moveRight(5);
     std.debug.print("{d} {d}\n", .{ p.x, Point.sum(p) });
     ```
  3. predict "What does it print?" → `4 0` [OUT]
     ```zig
     // top:
     const Point = struct {
         x: i32,
         y: i32 = 0,

         pub fn sum(self: Point) i32 {
             return self.x + self.y;
         }

         pub fn moveRight(self: *Point, d: i32) void {
             self.x += d;
         }
     };
     // main:
     const o = Point{ .x = 4 };
     std.debug.print("{d} {d}\n", .{ o.x, o.y });
     ```
  4. predict "What does it print?" → `1 100` [OUT]
     ```zig
     // top:
     const Point = struct {
         x: i32,
         y: i32 = 0,

         pub fn sum(self: Point) i32 {
             return self.x + self.y;
         }

         pub fn moveRight(self: *Point, d: i32) void {
             self.x += d;
         }
     };
     // main:
     const p = Point{ .x = 1, .y = 2 };
     var q = p;
     q.x = 100;
     std.debug.print("{d} {d}\n", .{ p.x, q.x });
     ```
  5. predict "What does it print?" → `.{ .x = 6, .y = 2 }` [OUT]
     ```zig
     // top:
     const Point = struct {
         x: i32,
         y: i32 = 0,

         pub fn sum(self: Point) i32 {
             return self.x + self.y;
         }

         pub fn moveRight(self: *Point, d: i32) void {
             self.x += d;
         }
     };
     // main:
     const p = Point{ .x = 6, .y = 2 };
     std.debug.print("{any}\n", .{p});
     ```
  6. predict "Does it compile?" → No: `missing struct field: x` [CE]
     ```zig
     // top:
     const Point = struct {
         x: i32,
         y: i32 = 0,

         pub fn sum(self: Point) i32 {
             return self.x + self.y;
         }

         pub fn moveRight(self: *Point, d: i32) void {
             self.x += d;
         }
     };
     // main:
     const p = Point{ .y = 2 };
     _ = p;
     ```
  7. predict "Does it compile?" → No: `cast discards const qualifier` [CE] (the first error line reads `expected type '*example.Point', found '*const example.Point'`; `example` is the runner's file name)
     ```zig
     // top:
     const Point = struct {
         x: i32,
         y: i32 = 0,

         pub fn sum(self: Point) i32 {
             return self.x + self.y;
         }

         pub fn moveRight(self: *Point, d: i32) void {
             self.x += d;
         }
     };
     // main:
     const p = Point{ .x = 1 };
     p.moveRight(1);
     ```
  8. predict "What does it print?" → `10 20` [OUT]
     ```zig
     // top:
     const Point = struct {
         x: i32,
         y: i32 = 0,

         pub fn sum(self: Point) i32 {
             return self.x + self.y;
         }

         pub fn moveRight(self: *Point, d: i32) void {
             self.x += d;
         }
     };
     // main:
     var pts = [_]Point{ .{ .x = 1 }, .{ .x = 2 } };
     for (&pts) |*pt| pt.x *= 10;
     std.debug.print("{d} {d}\n", .{ pts[0].x, pts[1].x });
     ```
  9. predict "Does it compile?" → No: `no field named 'z'` [CE] (full text: `no field named 'z' in struct 'example.Point'`)
     ```zig
     // top:
     const Point = struct {
         x: i32,
         y: i32 = 0,

         pub fn sum(self: Point) i32 {
             return self.x + self.y;
         }

         pub fn moveRight(self: *Point, d: i32) void {
             self.x += d;
         }
     };
     // main:
     const p = Point{ .x = 1 };
     std.debug.print("{d}\n", .{p.z});
     ```
  10. predict "What does it print?" → `1 two 3` [OUT]
     ```zig
     const tup = .{ 1, "two", true };
     std.debug.print("{d} {s} {}\n", .{ tup[0], tup[1], tup.len });
     ```
  11. predict "What does it print?" → `2` [OUT]
     ```zig
     const Counter = struct {
         n: u32 = 0,
         fn inc(self: *@This()) void {
             self.n += 1;
         }
     };
     var c = Counter{};
     c.inc();
     c.inc();
     std.debug.print("{d}\n", .{c.n});
     ```
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  const Hero = struct {
      hp: u32,
      pub fn heal(self: *Hero, n: u32) void {
          self.hp += n;
      }
  };

  pub fn main() void {
      var party = [_]Hero{ .{ .hp = 10 }, .{ .hp = 20 } };
      for (&party) |h| {
          var hero = h;
          hero.heal(5);
      }
      std.debug.print("hp: {d} {d}\n", .{ party[0].hp, party[1].hp });
  }
  ```
  → prints `hp: 10 20`. The loop heals a copy (`var hero = h;`). Solution: `for (&party) |*h| { h.heal(5); }`. Output `hp: 15 25`. `expect`: `hp: 15 25`. [OUT → OUT]

### 3.2 `enums-and-unions`, "Banners and shape-shifters"

- **Concept**: `enum` with named tags, `@tagName`, `@intFromEnum`, explicit values
  (`enum(u8) { a = 1, b = 5, c }`), methods on enums, `.west` shorthand when the type is
  known; `switch` on an enum must cover every tag (or use `else`); `union(enum)` (tagged union)
  holds exactly one field at a time; `switch` with payload capture `.circle => |r|`;
  reading an inactive field panics; `@enumFromInt` with an invalid value panics.
- **Visual**: an enum is a banner with fixed symbols; a tagged union is a shape-shifter ally
  that is one form at a time (circle or rect). Touching the wrong form: `shake`, banner
  `access of union field 'rect' while field 'circle' is active`.
- **Questions**:
  1. predict "What does it print?" → `west north 3` [OUT]
     ```zig
     // top:
     const Dir = enum {
         north,
         east,
         south,
         west,

         pub fn turn(self: Dir) Dir {
             return switch (self) {
                 .north => .east,
                 .east => .south,
                 .south => .west,
                 .west => .north,
             };
         }
     };
     // main:
     const d: Dir = .west;
     std.debug.print("{s} {s} {d}\n", .{ @tagName(d), @tagName(d.turn()), @intFromEnum(d) });
     ```
  2. predict "What does it print?" → `12 6` [OUT]
     ```zig
     // top:
     const Shape = union(enum) {
         circle: f32,
         rect: struct { w: f32, h: f32 },
     };

     fn area(s: Shape) f32 {
         return switch (s) {
             .circle => |r| 3 * r * r,
             .rect => |r| r.w * r.h,
         };
     }
     // main:
     std.debug.print("{d} {d}\n", .{ area(.{ .circle = 2 }), area(.{ .rect = .{ .w = 2, .h = 3 } }) });
     ```
  3. predict "What does it print?" → `circle true` [OUT]
     ```zig
     // top:
     const Shape = union(enum) {
         circle: f32,
         rect: struct { w: f32, h: f32 },
     };

     fn area(s: Shape) f32 {
         return switch (s) {
             .circle => |r| 3 * r * r,
             .rect => |r| r.w * r.h,
         };
     }
     // main:
     const sh: Shape = .{ .circle = 1 };
     std.debug.print("{s} {}\n", .{ @tagName(sh), sh == .circle });
     ```
  4. predict "Does it compile?" → No: `switch must handle all possibilities` [CE]
     ```zig
     // top:
     const Dir = enum {
         north,
         east,
         south,
         west,

         pub fn turn(self: Dir) Dir {
             return switch (self) {
                 .north => .east,
                 .east => .south,
                 .south => .west,
                 .west => .north,
             };
         }
     };
     // main:
     const d: Dir = .east;
     switch (d) {
         .north => {},
         .east => {},
     }
     ```
  5. predict "What happens?" → compiles, then `panic: access of union field 'rect' while field 'circle' is active` [PANIC]
     ```zig
     // top:
     const Shape = union(enum) {
         circle: f32,
         rect: struct { w: f32, h: f32 },
     };

     fn area(s: Shape) f32 {
         return switch (s) {
             .circle => |r| 3 * r * r,
             .rect => |r| r.w * r.h,
         };
     }
     // main:
     var s: Shape = .{ .circle = 1.5 };
     _ = &s;
     std.debug.print("{d}\n", .{s.rect.w});
     ```
  6. predict "What does it print?" → `6` [OUT]
     ```zig
     const E = enum(u8) { a = 1, b = 5, c };
     std.debug.print("{d}\n", .{@intFromEnum(E.c)});
     ```
  7. predict "What happens?" → compiles, then `panic: invalid enum value` [PANIC]
     ```zig
     const Color = enum(u8) { red, green };
     var n: u8 = 5;
     _ = &n;
     const c: Color = @enumFromInt(n);
     std.debug.print("{s}\n", .{@tagName(c)});
     ```
  8. predict "What does it print?" → `vertical` [OUT]
     ```zig
     // top:
     const Dir = enum {
         north,
         east,
         south,
         west,

         pub fn turn(self: Dir) Dir {
             return switch (self) {
                 .north => .east,
                 .east => .south,
                 .south => .west,
                 .west => .north,
             };
         }
     };
     // main:
     const d: Dir = .south;
     const msg = switch (d) {
         .north, .south => "vertical",
         else => "horizontal",
     };
     std.debug.print("{s}\n", .{msg});
     ```
  9. predict "What does it print?" → `2x5` [OUT]
     ```zig
     // top:
     const Shape = union(enum) {
         circle: f32,
         rect: struct { w: f32, h: f32 },
     };

     fn area(s: Shape) f32 {
         return switch (s) {
             .circle => |r| 3 * r * r,
             .rect => |r| r.w * r.h,
         };
     }
     // main:
     const sh: Shape = .{ .rect = .{ .w = 2, .h = 5 } };
     switch (sh) {
         .circle => std.debug.print("round\n", .{}),
         .rect => |r| std.debug.print("{d}x{d}\n", .{ r.w, r.h }),
     }
     ```
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  const Item = union(enum) {
      coins: u32,
      potion: u8,
  };

  fn value(it: Item) u32 {
      return it.coins;
  }

  pub fn main() void {
      const bag = [_]Item{ .{ .coins = 30 }, .{ .potion = 2 } };
      var total: u32 = 0;
      for (bag) |it| total += value(it);
      std.debug.print("value: {d}\n", .{total});
  }
  ```
  → panics: `access of union field 'coins' while field 'potion' is active`. Reads `.coins` from every item. Solution: `return switch (it) { .coins => |c| c, .potion => |p| @as(u32, p) * 10 };`. Output `value: 50`. `expect`: `value: 50`. [PANIC → OUT]

### 3.3 `pointers`, "Lending without giving"

- **Concept**: `&x` makes a `*T`; `p.*` reads/writes through it; `*const T` is read-only and
  `&` of a `const` gives `*const T`; pointer kinds: `*T` (one item), `*[N]T` (pointer to array,
  has `.len`), `[]T` (slice = pointer + length), `[*]T` (many-item, no length, no bounds check);
  slicing with comptime-known bounds gives `*[N]T`, with runtime bounds `[]T`; writes through a
  slice change the array; `for (&arr) |*x|` to modify elements; loop captures are constants;
  sizes (`[]const u8` is 16 bytes on 64-bit: pointer + length).
- **Visual**: `&x` is a `lend` (ghost copy pointing back); `p.* = 7` changes the original
  item. `*const` is a `lend` without `mut`: Iggi `say`s "look, don't touch". `[*]T` is a lend
  with no length tag: the hero can walk off the end and nobody rings the bell.
- **Questions**:
  1. predict "What does it print?" → `42` [OUT]
     ```zig
     // top:
     fn addOne(p: *i32) void {
         p.* += 1;
     }
     // main:
     var n: i32 = 41;
     addOne(&n);
     std.debug.print("{d}\n", .{n});
     ```
  2. predict "What does it print?" → `7 *i32` [OUT]
     ```zig
     var n: i32 = 1;
     const ptr = &n;
     ptr.* = 7;
     std.debug.print("{d} {}\n", .{ n, @TypeOf(ptr) });
     ```
  3. predict "Does it compile?" → No: `expected type '*u8', found '*const u8'` [CE]
     ```zig
     const x: u8 = 1;
     const p: *u8 = &x;
     _ = p;
     ```
  4. predict "What does it print?" → `*[3]i32 []i32` [OUT] (comptime-known bounds give a pointer to an array)
     ```zig
     var arr = [_]i32{ 1, 2, 3, 4, 5 };
     var lo: usize = 1;
     _ = &lo;
     const a = arr[1..4];
     const b = arr[lo..4];
     std.debug.print("{} {}\n", .{ @TypeOf(a), @TypeOf(b) });
     ```
  5. predict "What does it print?" → `99 3` [OUT]
     ```zig
     var arr = [_]i32{ 1, 2, 3, 4, 5 };
     const s = arr[1..4];
     s[0] = 99;
     std.debug.print("{d} {d}\n", .{ arr[1], s.len });
     ```
  6. predict "What does it print?" → `3` [OUT]
     ```zig
     var arr = [_]i32{ 1, 2, 3 };
     const many: [*]i32 = &arr;
     std.debug.print("{d}\n", .{many[2]});
     ```
  7. predict "What does it print?" → `*[3]i32 3` [OUT]
     ```zig
     var arr = [_]i32{ 1, 2, 3 };
     std.debug.print("{} {d}\n", .{ @TypeOf(&arr), (&arr).len });
     ```
  8. predict "What does it print?" → `16 3 8` [OUT] (a slice is pointer + length on a 64-bit target)
     ```zig
     std.debug.print("{d} {d} {d}\n", .{ @sizeOf([]const u8), @sizeOf([3]u8), @sizeOf(*u8) });
     ```
  9. predict "What does it print?" → `6` [OUT]
     ```zig
     // top:
     fn sumSlice(xs: []const i32) i32 {
         var t: i32 = 0;
         for (xs) |x| t += x;
         return t;
     }
     // main:
     const xs = [_]i32{ 1, 2, 3 };
     std.debug.print("{d}\n", .{sumSlice(&xs)});
     ```
  10. predict "What does it print?" → `{ 2, 3, 4 }` [OUT]
     ```zig
     var arr = [_]u8{ 1, 2, 3 };
     for (&arr) |*x| x.* += 1;
     std.debug.print("{any}\n", .{arr});
     ```
  11. predict "Does it compile?" → No: `cannot assign to constant` [CE]
     ```zig
     var arr = [_]u8{ 1, 2 };
     for (arr) |x| {
         x += 1;
     }
     _ = &arr;
     ```
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  fn addXp(xp: *u32, n: u32) void {
      var local = xp.*;
      local += n;
  }

  pub fn main() void {
      var xp: u32 = 0;
      addXp(&xp, 50);
      std.debug.print("xp: {d}\n", .{xp});
  }
  ```
  → prints `xp: 0`. Changes a local copy of the value. Solution: `xp.* += n;`. Output `xp: 50`. `expect`: `xp: 50`. [OUT → OUT]

### 3.4 `slices-and-sentinels`, "Windows onto chests"

- **Concept**: slicing `s[a..b]` (end exclusive), `s[a..]`; slices are bounds-checked at
  runtime; sentinel-terminated types `[:0]const u8` (C strings: the byte after the last is
  `0`, readable at index `len`); literals are `*const [N:0]u8`, which is why `lit[len]` is `0`;
  string literals are constant (`[]u8` from a literal fails); the `std.mem` toolbox (`eql`,
  `indexOf`, `indexOfScalar`, `trim`, `count`, `splitScalar`, `sort`), `std.fmt.bufPrint` into a
  stack buffer, `std.ascii`.
- **Visual**: a slice is a window frame placed over a chest; `[a..b]` shows squares `a` up to
  but not including `b`. The sentinel is a stone `0` block after the last square. A window
  wider than the chest: alarm bell.
- **Questions**:
  1. predict "What does it print?" → `3 0` [OUT]
     ```zig
     const z: [:0]const u8 = "hey";
     std.debug.print("{d} {d}\n", .{ z.len, z[3] });
     ```
  2. predict "What does it print?" → `0` [OUT] (string literals are null-terminated: index `len` is the sentinel `0`, no panic)
     ```zig
     const lit = "abc";
     var i: usize = 3;
     _ = &i;
     std.debug.print("{d}\n", .{lit[i]});
     ```
  3. predict "What does it print?" → `2 null` [OUT]
     ```zig
     std.debug.print("{any} {any}\n", .{ std.mem.indexOf(u8, "forge", "rg"), std.mem.indexOfScalar(u8, "forge", 'z') });
     ```
  4. predict "What does it print?" → `[hi]` [OUT]
     ```zig
     std.debug.print("[{s}]\n", .{std.mem.trim(u8, "  hi  ", " ")});
     ```
  5. predict "What does it print?" → `hp=42 5` [OUT]
     ```zig
     var buf: [32]u8 = undefined;
     const msg = try std.fmt.bufPrint(&buf, "hp={d}", .{42});
     std.debug.print("{s} {d}\n", .{ msg, msg.len });
     ```
  6. predict "What does it print?" → `2 4` [OUT]
     ```zig
     std.debug.print("{d} {d}\n", .{ std.mem.count(u8, "banana", "an"), std.mem.lastIndexOfScalar(u8, "banana", 'n').? });
     ```
  7. predict "What does it print?" → `{ 1, 2, 5, 9 }` [OUT]
     ```zig
     var xs = [_]i32{ 5, 2, 9, 1 };
     std.mem.sort(i32, &xs, {}, std.sort.asc(i32));
     std.debug.print("{any}\n", .{xs});
     ```
  8. predict "Does it compile?" → No: `expected type '[]u8', found '*const [2:0]u8'` [CE]
     ```zig
     const s: []u8 = "hi";
     _ = s;
     ```
  9. predict "What does it print?" → `fo rge org` [OUT]
     ```zig
     const s: []const u8 = "forge";
     std.debug.print("{s} {s} {s}\n", .{ s[0..2], s[2..], s[1..4] });
     ```
  10. predict "What happens?" → compiles, then `panic: index out of bounds` [PANIC]
     ```zig
     const s: []const u8 = "abc";
     var end: usize = 5;
     _ = &end;
     std.debug.print("{s}\n", .{s[0..end]});
     ```
  11. predict "What does it print?" → `Q true` [OUT]
     ```zig
     std.debug.print("{c} {}\n", .{ std.ascii.toUpper('q'), std.ascii.isDigit('7') });
     ```
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  pub fn main() void {
      const line = "iggi forge";
      const space = std.mem.indexOfScalar(u8, line, ' ') orelse line.len;
      const first = line[0 .. space - 1];
      std.debug.print("first: [{s}]\n", .{first});
  }
  ```
  → prints `first: [igg]`. `space - 1` cuts one letter too many (the end is exclusive). Solution: `line[0..space]`. Output `first: [iggi]`. `expect`: `first: [iggi]`. [OUT → OUT]

### Boss: `mountain-boss`, "The Imp in the Mountain"

1. Reuse: 3.1 Q4, 3.1 Q7, 3.2 Q4, 3.2 Q5, 3.3 Q4, 3.3 Q11, 3.4 Q2, 3.4 Q8.

---

## Region 4: `comptime-tower`, Allocators and compile-time power

Sources: language reference 0.15.2 sections "Memory", "Choosing an Allocator", "comptime",
"Generic Data Structures", "@TypeOf", "@typeInfo", "inline for", "Zig Test"
(https://ziglang.org/documentation/0.15.2/); 0.15 release notes, "ArrayList: make unmanaged the
default" and "Writergate" (https://ziglang.org/download/0.15.1/release-notes.html); zig.guide
"Allocators", "ArrayList", "Comptime" (https://zig.guide/standard-library/allocators);
TigerBeetle "A Database Without Dynamic Memory Allocation"; Ziglings 060-110.

### 4.1 `allocators`, "The forge hands out tools"

- **Concept**: no hidden allocation: anything that needs heap memory takes a
  `std.mem.Allocator` parameter; `alloc(T, n)` / `free(slice)` for many items,
  `create(T)` / `destroy(ptr)` for one; allocation can fail (`try`, `error.OutOfMemory`);
  `std.heap.page_allocator` (simple, whole pages), `std.heap.DebugAllocator(.{})` (`= .init`,
  `.allocator()`, `deinit()` returns `.ok` or `.leak` and reports leaks), `allocPrint`, `dupe`;
  pair every allocation with a `defer free` right away; the caller owns returned memory.
- **Visual**: the forge `ally` hands the hero tools (`give` item). Each must come back (`drop`
  back to the ally). On `deinit`, unreturned tools melt into `zig/leak-jelly`, which grows
  (`hp` up, banner `leak`).
- **Questions**:
  1. predict "What does it print?" → `zzz 3` / `ok` [OUT]
     ```zig
     var gpa: std.heap.DebugAllocator(.{}) = .init;
     const alloc = gpa.allocator();
     const buf = try alloc.alloc(u8, 3);
     @memset(buf, 'z');
     std.debug.print("{s} {d}\n", .{ buf, buf.len });
     alloc.free(buf);
     std.debug.print("{s}\n", .{@tagName(gpa.deinit())});
     ```
  2. predict "What does it print?" → `leak` [OUT] (the no-op `logFn` hides the leak log line, whose address changes every run)
     ```zig
     // top:
     pub const std_options: std.Options = .{ .logFn = quiet };

     fn quiet(comptime l: std.log.Level, comptime s: @Type(.enum_literal), comptime f: []const u8, a: anytype) void {
         _ = l;
         _ = s;
         _ = f;
         _ = a;
     }
     // main:
     var gpa: std.heap.DebugAllocator(.{}) = .init;
     const alloc = gpa.allocator();
     _ = try alloc.alloc(u8, 4);
     std.debug.print("{s}\n", .{@tagName(gpa.deinit())});
     ```
  3. predict "What does it print?" → `hi, Iggi!` [OUT]
     ```zig
     // top:
     fn greet(alloc: std.mem.Allocator, name: []const u8) ![]u8 {
         return std.fmt.allocPrint(alloc, "hi, {s}!", .{name});
     }
     // main:
     var gpa: std.heap.DebugAllocator(.{}) = .init;
     defer _ = gpa.deinit();
     const alloc = gpa.allocator();
     const g = try greet(alloc, "Iggi");
     defer alloc.free(g);
     std.debug.print("{s}\n", .{g});
     ```
  4. predict "What does it print?" → `9` [OUT]
     ```zig
     const alloc = std.heap.page_allocator;
     const one = try alloc.create(i32);
     defer alloc.destroy(one);
     one.* = 9;
     std.debug.print("{d}\n", .{one.*});
     ```
  5. predict "What does it print?" → `Copy` [OUT]
     ```zig
     const alloc = std.heap.page_allocator;
     const dup = try alloc.dupe(u8, "copy");
     defer alloc.free(dup);
     dup[0] = 'C';
     std.debug.print("{s}\n", .{dup});
     ```
  6. predict "What does it print?" → `ok` [OUT] (the old name still compiles in 0.15.2 as an alias of `DebugAllocator`)
     ```zig
     var gpa = std.heap.GeneralPurposeAllocator(.{}){};
     const alloc = gpa.allocator();
     const xs = try alloc.alloc(u32, 2);
     alloc.free(xs);
     std.debug.print("{s}\n", .{@tagName(gpa.deinit())});
     ```
  7. order: `var gpa: std.heap.DebugAllocator(.{}) = .init;` → `defer _ = gpa.deinit();` → `const alloc = gpa.allocator();` → `const buf = try alloc.alloc(u8, 4);` → `defer alloc.free(buf);` [OUT if completed with a print]
  8. pick: "Why do Zig functions that allocate take an `Allocator` parameter?" options `no hidden allocations: the caller decides` / `the language has a garbage collector` / `for speed only` → the first [DOC: https://ziglang.org/learn/overview/]
  9. type: `const buf = try alloc.alloc(u8, 4); ___ alloc.free(buf);` → `defer`
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  pub fn main() !void {
      var gpa: std.heap.DebugAllocator(.{}) = .init;
      defer std.debug.print("memory: {s}\n", .{@tagName(gpa.deinit())});
      const alloc = gpa.allocator();

      const scroll = try alloc.alloc(u8, 5);
      @memcpy(scroll, "spell");
      std.debug.print("{s}\n", .{scroll});
  }
  ```
  → prints `spell`, a leak report `error(gpa): memory address 0x... leaked:` with a trace, then `memory: leak`. The scroll is never freed (the starter's output also has a leak log line with an address, which is fine for a substring check). Solution: add `defer alloc.free(scroll);` after the `alloc` line. Output `spell` / `memory: ok`. `expect`: `memory: ok`. [OUT → OUT]

### 4.2 `arenas-and-lists`, "Sacks, shelves and growing lists"

- **Concept**: `ArenaAllocator` (wrap another allocator, free everything at once with
  `deinit`, ideal per request/frame); `FixedBufferAllocator` (memory from a stack buffer, no
  heap, fails with `error.OutOfMemory` when full); 0.15 `std.ArrayList(T)` is unmanaged:
  `.empty`, `append(alloc, x)`, `appendSlice`, `pop()` returns `?T`, `items`, `deinit(alloc)`,
  `initCapacity` + `appendAssumeCapacity` (TigerBeetle style); `std.array_list.Managed(T)` keeps
  the allocator; `std.StringHashMap(V)` / `std.AutoHashMap(K, V)`; old tutorials
  (`ArrayList(T).init(alloc)`, `std.io.getStdOut()`) no longer compile.
- **Visual**: the arena is a sack: items go in and the whole sack is emptied at the end
  (one `drop`). The fixed buffer is a small shelf: when full, the ally `say`s `OutOfMemory`.
  An `ArrayList` is a scroll that grows; in 0.15 the hero must hand the forge ally (allocator)
  to every `append`.
- **Questions**:
  1. predict "What does it print?" → `6 error.OutOfMemory` [OUT]
     ```zig
     var mem: [8]u8 = undefined;
     var fba = std.heap.FixedBufferAllocator.init(&mem);
     const fa = fba.allocator();
     const a = try fa.alloc(u8, 6);
     std.debug.print("{d} {any}\n", .{ a.len, fa.alloc(u8, 6) });
     ```
  2. predict "What does it print?" → `300` [OUT]
     ```zig
     var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
     defer arena.deinit();
     const a = arena.allocator();
     var total: usize = 0;
     for (0..3) |_| {
         const chunk = try a.alloc(u8, 100);
         total += chunk.len;
     }
     std.debug.print("{d}\n", .{total});
     ```
  3. predict "What does it print?" → `{ 1, 2, 3, 4 } 4` [OUT]
     ```zig
     const alloc = std.heap.page_allocator;
     var list: std.ArrayList(i32) = .empty;
     defer list.deinit(alloc);
     try list.append(alloc, 1);
     try list.append(alloc, 2);
     try list.appendSlice(alloc, &.{ 3, 4 });
     std.debug.print("{any} {d}\n", .{ list.items, list.items.len });
     ```
  4. predict "What does it print?" → `3 { 1, 2 }` [OUT]
     ```zig
     const alloc = std.heap.page_allocator;
     var list: std.ArrayList(i32) = .empty;
     defer list.deinit(alloc);
     try list.appendSlice(alloc, &.{ 1, 2, 3 });
     const last = list.pop();
     std.debug.print("{any} {any}\n", .{ last, list.items });
     ```
  5. predict "What does it print?" → `12 null 1` [OUT]
     ```zig
     var map = std.StringHashMap(u32).init(std.heap.page_allocator);
     defer map.deinit();
     try map.put("hp", 10);
     try map.put("hp", 12);
     std.debug.print("{any} {any} {d}\n", .{ map.get("hp"), map.get("mp"), map.count() });
     ```
  6. predict "Does it compile?" → No: `has no member named 'init'` [CE] (full text: `struct 'array_list.Aligned(u8,null)' has no member named 'init'`; 0.15 ArrayList is unmanaged)
     ```zig
     const list = std.ArrayList(u8).init(std.heap.page_allocator);
     _ = list;
     ```
  7. predict "Does it compile?" → No: `member function expected 2 argument(s), found 1` [CE]
     ```zig
     var list: std.ArrayList(u8) = .empty;
     try list.append(1);
     ```
  8. predict "Does it compile?" → No: `error union is ignored` [CE]
     ```zig
     var list: std.ArrayList(u8) = .empty;
     list.append(std.heap.page_allocator, 1);
     ```
  9. predict "What does it print?" → `1 true` [OUT]
     ```zig
     const alloc = std.heap.page_allocator;
     var list: std.ArrayList(u8) = try .initCapacity(alloc, 4);
     defer list.deinit(alloc);
     list.appendAssumeCapacity('a');
     std.debug.print("{d} {}\n", .{ list.items.len, list.capacity >= 4 });
     ```
  10. predict "Does it compile?" → No: `has no member named 'getStdOut'` [CE] (removed by the 0.15 I/O rewrite)
     ```zig
     const out = std.io.getStdOut();
     _ = out;
     ```
  11. predict "What does it print?" → `x` [OUT]
     ```zig
     var ml = std.array_list.Managed(u8).init(std.heap.page_allocator);
     defer ml.deinit();
     try ml.append('x');
     std.debug.print("{s}\n", .{ml.items});
     ```
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  pub fn main() !void {
      var buffer: [4]u8 = undefined;
      var fba = std.heap.FixedBufferAllocator.init(&buffer);
      const alloc = fba.allocator();

      var loot: std.ArrayList(u32) = .empty;
      defer loot.deinit(alloc);
      for (1..4) |i| try loot.append(alloc, @intCast(i * 10));
      std.debug.print("loot: {any}\n", .{loot.items});
  }
  ```
  → `error: OutOfMemory` escapes `main` (exit code 1, not a panic). A 4-byte buffer cannot hold the list (the starter's `try` lets `error.OutOfMemory` escape `main`: exit code 1, no panic). Solution: `var buffer: [256]u8 = undefined;`. Output `loot: { 10, 20, 30 }`. `expect`: `loot: { 10, 20, 30 }`. [ERROR → OUT]

### 4.3 `comptime-values`, "Forged before the battle"

- **Concept**: `comptime` runs code during compilation (`comptime fib(10)`, `comptime blk:
  {...}` tables); types are values at compile time (`comptime T: type`, `var t: type` is an
  error); array lengths must be comptime-known; `comptime var` + `inline for` unroll loops;
  `anytype` parameters and `@TypeOf`; reflection with `@typeInfo` (note: a literal `2.5` is
  `comptime_float`, not `.float`), `std.meta.fields`, `@hasField`; generic functions are
  type-checked per instantiation (`addAll(bool, ...)` fails only when used with `bool`).
- **Visual**: banner `COMPTIME`: Iggi forges items before the level starts; they `enter`
  already finished. A function with `comptime T` is a mold: each call with a new type casts a
  new tool. Using a runtime value where the forge needs it early: `shake`
  ("unable to resolve comptime value").
- **Questions**:
  1. predict "What does it print?" → `9 1.5` [OUT]
     ```zig
     // top:
     fn max(comptime T: type, a: T, b: T) T {
         return if (a > b) a else b;
     }
     // main:
     std.debug.print("{d} {d}\n", .{ max(u8, 3, 9), max(f32, 1.5, -2) });
     ```
  2. predict "What does it print?" → `55` [OUT]
     ```zig
     // top:
     fn fib(n: u32) u32 {
         return if (n < 2) n else fib(n - 1) + fib(n - 2);
     }
     // main:
     const f10 = comptime fib(10);
     std.debug.print("{d}\n", .{f10});
     ```
  3. predict "What does it print?" → `{ 0, 1, 4, 9, 16 }` [OUT]
     ```zig
     const table = comptime blk: {
         var t: [5]u32 = undefined;
         for (&t, 0..) |*e, i| e.* = @intCast(i * i);
         break :blk t;
     };
     std.debug.print("{any}\n", .{table});
     ```
  4. predict "What does it print?" → `6` [OUT]
     ```zig
     comptime var acc = 0;
     inline for (.{ 1, 2, 3 }) |v| acc += v;
     std.debug.print("{d}\n", .{acc});
     ```
  5. predict "What does it print?" → `int other pointer bool` [OUT] (`2.5` is a `comptime_float`, not `.float`)
     ```zig
     // top:
     fn describe(x: anytype) []const u8 {
         return switch (@typeInfo(@TypeOf(x))) {
             .int => "int",
             .float => "float",
             .pointer => "pointer",
             .bool => "bool",
             else => "other",
         };
     }
     // main:
     std.debug.print("{s} {s} {s} {s}\n", .{ describe(@as(u8, 1)), describe(2.5), describe("hi"), describe(true) });
     ```
  6. predict "Does it compile?" → No: `unable to resolve comptime value` [CE]
     ```zig
     // top:
     fn make(n: u32) u32 {
         var a: [n]u8 = undefined;
         _ = &a;
         return 0;
     }
     // main:
     _ = make(3);
     ```
  7. predict "Does it compile?" → No: `variable of type 'type' must be const or comptime` [CE]
     ```zig
     var t: type = u8;
     _ = &t;
     ```
  8. predict "Does it compile?" → No: `invalid operands to binary expression: 'bool' and 'bool'` [CE]
     ```zig
     // top:
     fn addAll(comptime T: type, a: T, b: T) T {
         return a + b;
     }
     // main:
     _ = addAll(bool, true, false);
     ```
  9. predict "What does it print?" → `u16` [OUT]
     ```zig
     // top:
     fn max(comptime T: type, a: T, b: T) T {
         return if (a > b) a else b;
     }
     // main:
     std.debug.print("{}\n", .{@TypeOf(max(u16, 1, 2))});
     ```
  10. predict "What does it print?" → `x y false` [OUT]
     ```zig
     const P = struct { x: i32, y: i32 };
     inline for (std.meta.fields(P)) |f| std.debug.print("{s} ", .{f.name});
     std.debug.print("{}\n", .{@hasField(P, "z")});
     ```
  11. predict "Does it compile?" → No: `type 'u8' cannot represent integer value '300'` [CE]
     ```zig
     // top:
     fn max(comptime T: type, a: T, b: T) T {
         return if (a > b) a else b;
     }
     // main:
     _ = max(u8, 1, 300);
     ```
  12. predict "What does it print?" → `6 9` [OUT]
     ```zig
     // top:
     fn sum(xs: anytype) i64 {
         var t: i64 = 0;
         for (xs) |x| t += x;
         return t;
     }
     // main:
     std.debug.print("{d} {d}\n", .{ sum([_]i32{ 1, 2, 3 }), sum(&[_]u8{ 4, 5 }) });
     ```
  13. predict "What does it print?" → `1 5 3` [OUT]
     ```zig
     std.debug.print("{d} {d} {d}\n", .{ @min(3, 7, 1), @abs(@as(i32, -5)), @popCount(@as(u8, 0b1011)) });
     ```
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  fn sum(comptime T: type, xs: []const T) T {
      var total: T = 0;
      for (xs) |x| total += x;
      return total;
  }

  pub fn main() void {
      const scores = [_]u8{ 200, 100 };
      std.debug.print("sum: {d}\n", .{sum(u8, &scores)});
  }
  ```
  → panics: `integer overflow`. The generic `sum` is instantiated with `u8`, so `200 + 100` overflows. Solution: `const scores = [_]u16{ 200, 100 };` and `sum(u16, &scores)`. Output `sum: 300`. `expect`: `sum: 300`. [PANIC → OUT]

### 4.4 `generic-types`, "Molds that make molds"

- **Concept**: a function that returns a `type` (`fn Stack(comptime T: type, comptime N:
  usize) type { return struct { ... }; }`), `@This()` / `const Self = @This();`; the same
  arguments give the same type; this is how `std.ArrayList` and `std.HashMap` are built;
  `test "name" { try std.testing.expect(...); }` blocks run with `zig test` (not in an
  executable), `std.testing.expectEqual`, `std.testing.allocator` (fails a test on leaks);
  labeled `switch` with `continue :sw` for state machines; `@Vector` SIMD (senior).
- **Visual**: the mold-of-molds: the forge ally receives `T` and `N` and produces a new
  blueprint scroll (`give`), from which allies are built. A full stack pushed again:
  alarm bell `index out of bounds`.
- **Questions**:
  1. predict "What does it print?" → `2 1 null` [OUT]
     ```zig
     // top:
     fn Stack(comptime T: type, comptime N: usize) type {
         return struct {
             items: [N]T = undefined,
             len: usize = 0,
             const Self = @This();

             pub fn push(self: *Self, v: T) void {
                 self.items[self.len] = v;
                 self.len += 1;
             }

             pub fn pop(self: *Self) ?T {
                 if (self.len == 0) return null;
                 self.len -= 1;
                 return self.items[self.len];
             }
         };
     }
     // main:
     var s: Stack(u8, 4) = .{};
     s.push(1);
     s.push(2);
     std.debug.print("{any} {any} {any}\n", .{ s.pop(), s.pop(), s.pop() });
     ```
  2. predict "What does it print?" → `true false` [OUT] (same comptime arguments, same type)
     ```zig
     // top:
     fn Stack(comptime T: type, comptime N: usize) type {
         return struct {
             items: [N]T = undefined,
             len: usize = 0,
             const Self = @This();

             pub fn push(self: *Self, v: T) void {
                 self.items[self.len] = v;
                 self.len += 1;
             }

             pub fn pop(self: *Self) ?T {
                 if (self.len == 0) return null;
                 self.len -= 1;
                 return self.items[self.len];
             }
         };
     }
     // main:
     std.debug.print("{} {}\n", .{ Stack(u8, 4) == Stack(u8, 4), Stack(u8, 4) == Stack(u16, 4) });
     ```
  3. predict "What does it print?" → `TestUnexpectedResult` [OUT]
     ```zig
     std.testing.expect(1 + 1 == 3) catch |e| std.debug.print("{s}\n", .{@errorName(e)});
     ```
  4. predict "What does it print?" → `expected 5, found 4` / `TestExpectedEqual` [OUT]
     ```zig
     std.testing.expectEqual(@as(i32, 5), 2 + 2) catch |e| std.debug.print("{s}\n", .{@errorName(e)});
     ```
  5. predict "What does it print?" → `main runs` [OUT] (`test` blocks are not compiled into an executable)
     ```zig
     // top:
     test "never runs in an exe" {
         try std.testing.expect(false);
     }
     // main:
     std.debug.print("main runs\n", .{});
     ```
  6. predict "What does it print?" → `{ 2, 4, 6 }` [OUT]
     ```zig
     const v: @Vector(3, i32) = .{ 1, 2, 3 };
     const two: @Vector(3, i32) = @splat(2);
     std.debug.print("{any}\n", .{v * two});
     ```
  7. predict "What does it print?" → `42` [OUT]
     ```zig
     var state: u8 = 0;
     const r = sw: switch (state) {
         0 => {
             state = 1;
             continue :sw 1;
         },
         1 => break :sw @as(u8, 42),
         else => 0,
     };
     std.debug.print("{d}\n", .{r});
     ```
  8. predict "What does it print?" → `u64` [OUT]
     ```zig
     const T = if (@sizeOf(usize) == 8) u64 else u32;
     std.debug.print("{}\n", .{T});
     ```
  9. predict "What does it print?" → `3` [OUT]
     ```zig
     const Pair = struct {
         fn of(comptime T: type) type {
             return struct { a: T, b: T };
         }
     };
     const p = Pair.of(u8){ .a = 1, .b = 2 };
     std.debug.print("{d}\n", .{p.a + p.b});
     ```
  10. predict "What does it print?" → `8 8` [OUT]
     ```zig
     std.debug.print("{d} {d}\n", .{ @sizeOf(struct { a: u8, b: u32 }), @sizeOf(packed struct { a: u8, b: u32 }) });
     ```
  11. pick: "How do you run the `test` blocks of a file?" options `zig test file.zig` / `zig run file.zig` / `zig build-exe file.zig` → `zig test file.zig` [DOC: language reference "Zig Test"]
  12. pick: "Which allocator fails a test when memory leaks?" options `std.testing.allocator` / `std.heap.page_allocator` / `std.heap.c_allocator` → `std.testing.allocator` [DOC]
- **Run**:
  starter (full program):
  ```zig
  const std = @import("std");

  fn Stack(comptime T: type, comptime N: usize) type {
      return struct {
          items: [N]T = undefined,
          len: usize = 0,
          const Self = @This();
          pub fn push(self: *Self, v: T) void {
              self.items[self.len] = v;
              self.len += 1;
          }
          pub fn pop(self: *Self) ?T {
              if (self.len == 0) return null;
              self.len -= 1;
              return self.items[self.len];
          }
      };
  }

  pub fn main() void {
      var s: Stack(u8, 2) = .{};
      s.push(1);
      s.push(2);
      s.push(3);
      std.debug.print("top: {d}\n", .{s.pop().?});
  }
  ```
  → panics: `index out of bounds: index 2, len 2`. `Stack(u8, 2)` is full after two pushes. Solution: `var s: Stack(u8, 3) = .{};`. Output `top: 3`. `expect`: `top: 3`. [PANIC → OUT]

### Boss: `tower-boss`, "The Leak Jelly"

1. Reuse: 4.1 Q1, 4.1 Q2, 4.2 Q1, 4.2 Q4, 4.2 Q6, 4.3 Q2, 4.3 Q6, 4.4 Q1, 4.4 Q2.

---

## Entry exams

Format follows `content/rust/exams.ts`: exam questions are `pick`/`predict`/`type`/`order` beats
tagged with a topic; the engine draws round-robin across topics.

### Topic ids

| Topic id | Name (en) | Region link |
|---|---|---|
| `basics` | `const`, `var` and the strict compiler | `forge-village` |
| `integers` | Integer types, casts and overflow | `forge-village` |
| `control` | Control flow and `switch` | `forge-village` |
| `slices` | Arrays, slices, strings and pointers | `forge-village` (arrays, strings), `struct-mountain` (pointers, sentinels) |
| `optionals` | Optionals | `optional-forest` |
| `errors` | Error unions and error sets | `optional-forest` |
| `defer` | `defer` and `errdefer` | `optional-forest` |
| `safety` | `undefined`, safety checks and build modes | `optional-forest` |
| `structs` | Structs and methods | `struct-mountain` |
| `unions` | Enums and tagged unions | `struct-mountain` |
| `allocators` | Allocators and memory ownership | `comptime-tower` |
| `containers` | `ArrayList`, hash maps (0.15 API) | `comptime-tower` |
| `comptime` | `comptime`, generics and reflection | `comptime-tower` |
| `testing` | Test blocks and `std.testing` | `comptime-tower` |
| `interop` | C interop | (none yet) |
| `tooling` | Build system, build modes, threads, 0.15 I/O | (none yet) |

A region is skipped when all its topics are passed: junior can skip `forge-village` and most of
`optional-forest` (`safety` is in mid); mid covers `optional-forest` and `struct-mountain`;
senior covers `comptime-tower`. Because `slices` spans two regions, give it the region where
most of its bank questions come from (pointers and sentinels → `struct-mountain`) or split it
into `strings` (village) and `pointers` (mountain) if the engine needs one region per topic.

### Bank sizes

| Exam | Draws / bank | Pass | s/question | Topics in the bank (count) | Suggested kinds |
|---|---|---|---|---|---|
| `junior`, Junior Zig Developer | 12 / 22 | 70% | 30 | basics 4, integers 4, control 3, slices 4, optionals 3, errors 3, defer 1 | predict 14, pick 5, type 2, order 1 |
| `mid`, Mid-level Zig Developer | 14 / 24 | 70% | 40 | integers 2, errors 3, defer 2, safety 2, structs 3, unions 3, slices 2, allocators 3, containers 2, comptime 2 | predict 16, pick 5, type 2, order 1 |
| `senior`, Senior Zig Developer | 15 / 26 | 75% | 50 | safety 3, unions 2, slices 2, allocators 4, containers 2, comptime 5, testing 2, interop 2, tooling 2, errors 2 | predict 17, pick 7, type 1, order 1 |

The lesson questions above are a large pool for the banks (exam questions should be new
wording or new snippets, not copies of lesson beats, so the exam is not a memory test). The
examples below show snippets on one line; that is valid Zig as written (newlines are just
whitespace) but authors should split them for display. All [OUT]/[CE]/[PANIC] answers below
were verified with 0.15.2. Each example names the lesson question it comes from (`pool:`);
when writing the bank, vary names and values (and re-verify) so the exam does not repeat a
lesson beat word for word.

### Junior example questions

1. [`basics`] predict "Does it compile?": `var x: i32 = 5; std.debug.print("{d}\n", .{x});` → No: `local variable is never mutated` [CE] (pool: 1.1.3)
2. [`basics`] predict "Does it compile?": `var x = 5; x += 1; std.debug.print("{d}\n", .{x});` → No: `variable of type 'comptime_int' must be const or comptime` [CE] (pool: 1.1.7)
3. [`basics`] predict "Does it compile?": `const x: i32 = 5;` → No: `unused local constant` [CE] (pool: 1.1.4)
4. [`integers`] predict "What happens?": `var n: u8 = 0; _ = &n; n -= 1;` → compiles, then `panic: integer overflow` [PANIC] (pool: 1.2.4)
5. [`integers`] predict: `var w: u8 = 250; w +%= 10; var s: u8 = 250; s +|= 10; std.debug.print("{d} {d}\n", .{ w, s });` → `4 255` [OUT] (pool: 1.2.5)
6. [`integers`] predict: `std.debug.print("{d} {d} {d}\n", .{ @divTrunc(-7, 2), @divFloor(-7, 2), @mod(-7, 3) });` → `-3 -4 2` [OUT] (pool: 1.2.10)
7. [`control`] predict: `const items = [_]u8{ 10, 20, 30 }; const found = for (items) |v| { if (v > 15) break v; } else 0; std.debug.print("{d}\n", .{found});` → `20` [OUT] (pool: 1.3.6)
8. [`control`] predict "Does it compile?": `const s: []const u8 = "a"; switch (s) { "a" => {}, else => {}, }` → No: `cannot switch on strings` [CE] (pool: 1.3.10)
9. [`slices`] predict "Does it compile?": `const a: []const u8 = "hi"; const b: []const u8 = "hi"; std.debug.print("{}\n", .{a == b});` → No: `operator == not allowed for type '[]const u8'` [CE] (pool: 1.4.4)
10. [`slices`] predict: `const s = "héllo"; std.debug.print("{d} {c}\n", .{ s.len, s[0] });` → `6 h` [OUT] (pool: 1.4.1)
11. [`optionals`] predict: `const none: ?i32 = null; std.debug.print("{d}\n", .{none orelse 0});` → `0` [OUT] (pool: 2.1.2)
12. [`optionals`] predict "What happens?": `var x: ?i32 = null; _ = &x; std.debug.print("before\n", .{}); std.debug.print("{d}\n", .{x.?});` → prints `before`, then `panic: attempt to use null value` [PANIC] (pool: 2.1.6)
13. [`errors`] predict: top: `const FileError = error{ NotFound, Denied }; fn open(name: []const u8) FileError!u32 { if (std.mem.eql(u8, name, "ok")) return 3; if (std.mem.eql(u8, name, "secret")) return error.Denied; return error.NotFound; }`; body `const a = open("ok") catch 0; const b = open("nope") catch 0; std.debug.print("{d} {d}\n", .{ a, b });` → `3 0` [OUT] (pool: 2.2.1)
14. [`errors`] predict: `std.debug.print("{any} {any}\n", .{ std.fmt.parseInt(u8, "300", 10), std.fmt.parseInt(u8, "x1", 10) });` → `error.Overflow error.InvalidCharacter` [OUT] (pool: 2.2.9)
15. [`defer`] predict: `defer std.debug.print("first\n", .{}); defer std.debug.print("second\n", .{}); std.debug.print("body\n", .{});` → `body` / `second` / `first` [OUT] (pool: 2.3.1)

### Mid example questions

1. [`integers`] predict "Does it compile?": `var a: i32 = 1; var b: u32 = 2; _ = &a; _ = &b; std.debug.print("{d}\n", .{a + b});` → No: `incompatible types: 'i32' and 'u32'` [CE] (pool: 1.2.11)
2. [`integers`] predict: `const x: u8 = 3; const y: i32 = x; const z: u8 = y; std.debug.print("{d}\n", .{z});` → `3` [OUT] (pool: 1.2.15)
3. [`errors`] predict: top: `const FileError = error{ NotFound, Denied }; fn open(name: []const u8) FileError!u32 { if (std.mem.eql(u8, name, "ok")) return 3; if (std.mem.eql(u8, name, "secret")) return error.Denied; return error.NotFound; } fn twice(name: []const u8) !u32 { const fd = try open(name); return fd * 2; }`; body `std.debug.print("{any} {any}\n", .{ twice("ok"), twice("x") });` → `6 error.NotFound` [OUT] (pool: 2.2.3)
4. [`errors`] predict "Does it compile?": top: `fn half(n: u32) !u32 { if (n % 2 == 1) return error.Odd; return n / 2; }`; body `const v = half(3) catch |e| switch (e) { error.Odd => 0, error.Even => 1, }; _ = v;` → No: `'error.Even' not a member of destination error set` [CE] (pool: 2.2.8)
5. [`defer`] predict: top: `fn step(fail: bool) !void { std.debug.print("start ", .{}); defer std.debug.print("defer ", .{}); errdefer std.debug.print("errdefer ", .{}); if (fail) return error.Boom; std.debug.print("ok ", .{}); }`; body `step(false) catch {}; std.debug.print("\n", .{}); step(true) catch |err| std.debug.print("caught {s}", .{@errorName(err)}); std.debug.print("\n", .{});` → `start ok defer ` / `start errdefer defer caught Boom` [OUT] (pool: 2.3.5)
6. [`defer`] predict: `var x: u32 = 1; defer std.debug.print("deferred: {d}\n", .{x}); x = 2; std.debug.print("now: {d}\n", .{x});` → `now: 2` / `deferred: 2` [OUT] (pool: 2.3.7)
7. [`safety`] predict "What happens?": `const xs = [_]u8{ 1, 2, 3, 4 }; var lo: usize = 3; var hi: usize = 1; _ = &lo; _ = &hi; std.debug.print("{any}\n", .{xs[lo..hi]});` → compiles, then `panic: start index 3 is larger than end index 1` [PANIC] (pool: 2.4.4)
8. [`safety`] predict "What happens?": `var n: u8 = 200; _ = &n; const doubled = n * 2; std.debug.print("{d}\n", .{doubled});` → compiles, then `panic: integer overflow` [PANIC] (pool: 2.4.7)
9. [`structs`] predict: top: `const Point = struct { x: i32, y: i32 = 0, pub fn sum(self: Point) i32 { return self.x + self.y; } pub fn moveRight(self: *Point, d: i32) void { self.x += d; } };`; body `const p = Point{ .x = 1, .y = 2 }; var q = p; q.x = 100; std.debug.print("{d} {d}\n", .{ p.x, q.x });` → `1 100` [OUT] (pool: 3.1.4)
10. [`structs`] predict "Does it compile?": top: `const Point = struct { x: i32, y: i32 = 0, pub fn sum(self: Point) i32 { return self.x + self.y; } pub fn moveRight(self: *Point, d: i32) void { self.x += d; } };`; body `const p = Point{ .x = 1 }; p.moveRight(1);` → No: `cast discards const qualifier` [CE] (pool: 3.1.7)
11. [`unions`] predict "Does it compile?": top: `const Dir = enum { north, east, south, west, pub fn turn(self: Dir) Dir { return switch (self) { .north => .east, .east => .south, .south => .west, .west => .north, }; } };`; body `const d: Dir = .east; switch (d) { .north => {}, .east => {}, }` → No: `switch must handle all possibilities` [CE] (pool: 3.2.4)
12. [`unions`] predict "What happens?": top: `const Shape = union(enum) { circle: f32, rect: struct { w: f32, h: f32 }, }; fn area(s: Shape) f32 { return switch (s) { .circle => |r| 3 * r * r, .rect => |r| r.w * r.h, }; }`; body `var s: Shape = .{ .circle = 1.5 }; _ = &s; std.debug.print("{d}\n", .{s.rect.w});` → compiles, then `panic: access of union field 'rect' while field 'circle' is active` [PANIC] (pool: 3.2.5)
13. [`slices`] predict: `var arr = [_]i32{ 1, 2, 3, 4, 5 }; var lo: usize = 1; _ = &lo; const a = arr[1..4]; const b = arr[lo..4]; std.debug.print("{} {}\n", .{ @TypeOf(a), @TypeOf(b) });` → `*[3]i32 []i32` [OUT] (pool: 3.3.4)
14. [`allocators`] predict: `var gpa: std.heap.DebugAllocator(.{}) = .init; const alloc = gpa.allocator(); const buf = try alloc.alloc(u8, 3); @memset(buf, 'z'); std.debug.print("{s} {d}\n", .{ buf, buf.len }); alloc.free(buf); std.debug.print("{s}\n", .{@tagName(gpa.deinit())});` → `zzz 3` / `ok` [OUT] (pool: 4.1.1)
15. [`allocators`] predict: `var mem: [8]u8 = undefined; var fba = std.heap.FixedBufferAllocator.init(&mem); const fa = fba.allocator(); const a = try fa.alloc(u8, 6); std.debug.print("{d} {any}\n", .{ a.len, fa.alloc(u8, 6) });` → `6 error.OutOfMemory` [OUT] (pool: 4.2.1)
16. [`containers`] predict: `const alloc = std.heap.page_allocator; var list: std.ArrayList(i32) = .empty; defer list.deinit(alloc); try list.appendSlice(alloc, &.{ 1, 2, 3 }); const last = list.pop(); std.debug.print("{any} {any}\n", .{ last, list.items });` → `3 { 1, 2 }` [OUT] (pool: 4.2.4)
17. [`containers`] predict "Does it compile?": `const list = std.ArrayList(u8).init(std.heap.page_allocator); _ = list;` → No: `has no member named 'init'` [CE] (pool: 4.2.6)
18. [`comptime`] predict: top: `fn max(comptime T: type, a: T, b: T) T { return if (a > b) a else b; }`; body `std.debug.print("{d} {d}\n", .{ max(u8, 3, 9), max(f32, 1.5, -2) });` → `9 1.5` [OUT] (pool: 4.3.1)

### Senior example questions

1. [`safety`] predict "Does it compile?": `const x: u8 = 255; const y = x + 1; std.debug.print("{d}\n", .{y});` → No: `overflow of integer type 'u8' with value '256'` [CE] (pool: 2.4.6)
2. [`safety`] predict "What happens?": `const Color = enum(u8) { red, green }; var n: u8 = 5; _ = &n; const c: Color = @enumFromInt(n); std.debug.print("{s}\n", .{@tagName(c)});` → compiles, then `panic: invalid enum value` [PANIC] (pool: 3.2.7)
3. [`unions`] predict: top: `const Shape = union(enum) { circle: f32, rect: struct { w: f32, h: f32 }, }; fn area(s: Shape) f32 { return switch (s) { .circle => |r| 3 * r * r, .rect => |r| r.w * r.h, }; }`; body `const sh: Shape = .{ .rect = .{ .w = 2, .h = 5 } }; switch (sh) { .circle => std.debug.print("round\n", .{}), .rect => |r| std.debug.print("{d}x{d}\n", .{ r.w, r.h }), }` → `2x5` [OUT] (pool: 3.2.9)
4. [`slices`] predict: `const lit = "abc"; var i: usize = 3; _ = &i; std.debug.print("{d}\n", .{lit[i]});` → `0` [OUT] (pool: 3.4.2)
5. [`slices`] predict: `std.debug.print("{d} {d} {d}\n", .{ @sizeOf([]const u8), @sizeOf([3]u8), @sizeOf(*u8) });` → `16 3 8` [OUT] (pool: 3.3.8)
6. [`allocators`] predict: top: `pub const std_options: std.Options = .{ .logFn = quiet }; fn quiet(comptime l: std.log.Level, comptime s: @Type(.enum_literal), comptime f: []const u8, a: anytype) void { _ = l; _ = s; _ = f; _ = a; }`; body `var gpa: std.heap.DebugAllocator(.{}) = .init; const alloc = gpa.allocator(); _ = try alloc.alloc(u8, 4); std.debug.print("{s}\n", .{@tagName(gpa.deinit())});` → `leak` [OUT] (pool: 4.1.2)
7. [`allocators`] predict: `var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator); defer arena.deinit(); const a = arena.allocator(); var total: usize = 0; for (0..3) |_| { const chunk = try a.alloc(u8, 100); total += chunk.len; } std.debug.print("{d}\n", .{total});` → `300` [OUT] (pool: 4.2.2)
8. [`containers`] predict: `const alloc = std.heap.page_allocator; var list: std.ArrayList(u8) = try .initCapacity(alloc, 4); defer list.deinit(alloc); list.appendAssumeCapacity('a'); std.debug.print("{d} {}\n", .{ list.items.len, list.capacity >= 4 });` → `1 true` [OUT] (pool: 4.2.9)
9. [`containers`] predict "Does it compile?": `var list: std.ArrayList(u8) = .empty; try list.append(1);` → No: `member function expected 2 argument(s), found 1` [CE] (pool: 4.2.7)
10. [`comptime`] predict: `const table = comptime blk: { var t: [5]u32 = undefined; for (&t, 0..) |*e, i| e.* = @intCast(i * i); break :blk t; }; std.debug.print("{any}\n", .{table});` → `{ 0, 1, 4, 9, 16 }` [OUT] (pool: 4.3.3)
11. [`comptime`] predict: top: `fn describe(x: anytype) []const u8 { return switch (@typeInfo(@TypeOf(x))) { .int => "int", .float => "float", .pointer => "pointer", .bool => "bool", else => "other", }; }`; body `std.debug.print("{s} {s} {s} {s}\n", .{ describe(@as(u8, 1)), describe(2.5), describe("hi"), describe(true) });` → `int other pointer bool` [OUT] (pool: 4.3.5)
12. [`comptime`] predict "Does it compile?": top: `fn make(n: u32) u32 { var a: [n]u8 = undefined; _ = &a; return 0; }`; body `_ = make(3);` → No: `unable to resolve comptime value` [CE] (pool: 4.3.6)
13. [`comptime`] predict: top: `fn Stack(comptime T: type, comptime N: usize) type { return struct { items: [N]T = undefined, len: usize = 0, const Self = @This(); pub fn push(self: *Self, v: T) void { self.items[self.len] = v; self.len += 1; } pub fn pop(self: *Self) ?T { if (self.len == 0) return null; self.len -= 1; return self.items[self.len]; } }; }`; body `std.debug.print("{} {}\n", .{ Stack(u8, 4) == Stack(u8, 4), Stack(u8, 4) == Stack(u16, 4) });` → `true false` [OUT] (pool: 4.4.2)
14. [`comptime`] predict: `var state: u8 = 0; const r = sw: switch (state) { 0 => { state = 1; continue :sw 1; }, 1 => break :sw @as(u8, 42), else => 0, }; std.debug.print("{d}\n", .{r});` → `42` [OUT] (pool: 4.4.7)
15. [`testing`] predict: `std.testing.expectEqual(@as(i32, 5), 2 + 2) catch |e| std.debug.print("{s}\n", .{@errorName(e)});` → `expected 5, found 4` / `TestExpectedEqual` [OUT] (pool: 4.4.4)
16. [`testing`] predict: top: `test "never runs in an exe" { try std.testing.expect(false); }`; body `std.debug.print("main runs\n", .{});` → `main runs` [OUT] (pool: 4.4.5)
17. [`errors`] predict: top: `fn f() u32 { var n: u32 = 1; defer n += 1; return n; }`; body `std.debug.print("{d}\n", .{f()});` → `1` [OUT] (pool: 2.3.8)
18. [`errors`] predict: top: `fn firstEven(xs: []const u32) ?u32 { for (xs) |x| if (x % 2 == 0) return x; return null; } fn needEven(xs: []const u32) !u32 { return firstEven(xs) orelse error.NoEven; }`; body `std.debug.print("{any} {any}\n", .{ needEven(&.{ 1, 4 }), needEven(&.{ 1, 3 }) });` → `4 error.NoEven` [OUT] (pool: 2.2.14)
- [`interop`] pick [DOC]: "Which builtin imports a C header so its functions can be called from Zig?" options `@cImport` / `@import` / `@embedFile` → `@cImport` (with `@cInclude("stdio.h")`; needs libc linked, so it cannot run on the game's runner)
- [`interop`] pick [DOC]: "What type does Zig use for a C `char *` string that ends in `0`?" options `[*:0]u8` / `[]u8` / `*u8` → `[*:0]u8` (a sentinel-terminated many-item pointer; `std.mem.span` turns it into a slice)
- [`tooling`] pick [DOC]: "Which build mode keeps safety checks but optimizes?" options `ReleaseSafe` / `ReleaseFast` / `ReleaseSmall` → `ReleaseSafe` (https://ziglang.org/learn/overview/)
- [`tooling`] pick [DOC]: "In Zig 0.15, what must you do after writing to a buffered `std.Io.Writer`?" options `flush it` / `close it` / `nothing` → `flush it` (0.15 release notes, "Writergate")
- [`allocators`] pick [DOC]: "TigerBeetle allocates all memory at startup and never after. What does this rule out at runtime?" options `out-of-memory surprises and use-after-free from reallocation` / `integer overflow` / `compile errors` → the first (TigerBeetle blog, Tiger Style)
- [`comptime`] pick [DOC]: "`fn max(comptime T: type, a: T, b: T) T` is called with `u8` and with `f32`. How many versions are compiled?" options `2, one per type` / `1, shared` / `0, it is interpreted` → `2, one per type`

### Things to avoid in Zig questions

- Output that depends on addresses (leak logs, `{*}` pointers), timing, threads or hash map
  iteration order (`StringHashMap` iteration is unordered: use `get`/`count` only).
- Reading `undefined` or any other illegal behavior in a `check.stdout` (it is deterministic in
  Debug on the runner, but the claim would be false in release modes).
- Type-rule questions with comptime-known values when the point is a runtime rule (see
  "Runtime facts" 2 and 3): force runtime values with `var x ... ; _ = &x;`.
- Prints without a trailing `\n` right before a panic (fact 5) and errors escaping `main`
  (fact 6).
- APIs from older tutorials: `std.io.getStdOut().writer()`, `ArrayList(T).init(alloc)`,
  `usingnamespace`, `async`/`await`, `std.BoundedArray` (removed in 0.15), `GeneralPurposeAllocator`
  as the main name (prefer `DebugAllocator`).
- `@typeName` of your own types (contains `example.` on the runner) and error messages quoted
  with `example.` in them: quote only the part after it, or keep `check: { compiles: false }`.
- `@cImport`, threads and files in run/predict beats: the runner has no libc headers or a
  filesystem to rely on; keep them as [DOC] picks.
