# Ruby planet (Rubion): proposed curriculum and entry exams

Curriculum for the **Ruby planet** (pack `ruby`, planet "Rubion", guide Kira, bugs
`ruby/nil-ghost`, `ruby/hash-mimic`, `ruby/monkey-imp`, `ruby/frozen-cube`; see
`content/ruby/planet.ts`): 4 regions plus the entry exams. It is written for a learner who may
know nothing about programming, and it follows what companies actually assess (see
[ruby-hiring-assessments.md](ruby-hiring-assessments.md)). Rails is a separate moon; this file
stays on core Ruby. Content authors turn this into a language pack following
[../content-model.md](../content-model.md), [../authoring-lessons.md](../authoring-lessons.md)
and [../exams.md](../exams.md).

## Conventions used in this file

### How the snippets were verified

Every snippet below was run on **Ruby 3.4.7** through the Compiler Explorer API
(`POST https://godbolt.org/api/compiler/ruby347/compile`, `filters.execute: true`,
`compilerOptions.executorRequest: true`), on 2026-10-06. The answers are copied from the real
output.

- Snippets are a **whole single-file script** (stdlib only, no gems). Short snippets are written
  on one line with `;`, which is valid Ruby as written. Authors should split them into lines for
  display. Lines under `top:` are definitions (classes, modules, methods) that go above the rest.
- **Exception: `case`/`in` must not be written on one line.** `case config in {...} then ... end`
  is a syntax error, because Prism reads `config in {...}` as a boolean pattern test and then
  finds no `in` clause. Always put a newline (or `;`) after the `case` subject. Pattern matching
  snippets are shown multi-line.
- `puts` prints `to_s` (one line per array element, an empty line for `nil`); `p` prints
  `inspect` and returns its argument; `print` adds no newline. Ruby 3.4 inspect formats:
  `{a: 1}` for symbol keys, `{"a" => 1}` for other keys, `#<struct Point x=9, y=4>`,
  `#<data Coord lat=1, lng=2>`, Rationals as `(1/2)` with `p` and `1/2` with `puts`.
- Do not `p` non-ASCII strings: the runner's external encoding is US-ASCII, so `p "café"` prints
  `"café"` (while `puts "café"` prints `café`).

### Answer tags

| Tag | Meaning | How a Ruby runner checks it |
|---|---|---|
| `[OUT]` | Runs cleanly; exact stdout given (`/` separates lines) | `check: { stdout }` (exit code 0) |
| `[SYNTAX]` | Does not parse; nothing runs (stdout is empty even for lines before the error); stderr contains `(SyntaxError)` and the quoted Prism hint | `check: { syntax: false }` = stderr contains `(SyntaxError)` |
| `[RAISE]` | Runs, then an uncaught exception ends it: stderr contains `message (ExceptionClass)`. Stdout printed before is given too | stderr contains `(ExceptionClass)` (the Ruby equivalent of JS `throws`); never assert on the file name (`/app/output.s` on Compiler Explorer) |
| `[TEST]` | Script that does `require "minitest/autorun"` (Minitest is available, RSpec is not); stdout has `Run options: --seed N` (random) and a summary line | stdout contains `1 failures` / `0 failures` or the `Expected:`/`Actual:` text |
| `[DOC]` | Concept or design rule, not machine-checkable (scheduling, GVL, GC) | cite the official page |

Many snippets were verified wrapped in `begin ... rescue Exception => e; puts e.class, e.message`
and the uncaught form was spot-checked; the stderr shape of an uncaught exception is
`<file>:<line>:in 'Hash#fetch': key not found: :k (KeyError)` (Ruby 3.4 quotes with `'` and
prefixes the owner class: `'Integer#+'`, `'Object#heal'`, `'Hero#heal'`,
`'Thread::Mutex#synchronize'`, `'<main>'`). `Integer("x")` raises from `<internal:kernel>`.

Determinism rules followed everywhere: never print a default `#inspect`/`to_s` of an object
(`#<Hero:0x000...>` has an address), nor `object_id` values, nor anything that depends on thread
scheduling (a racy counter, an unjoined thread), nor `Thread` reports (they include addresses),
nor Minitest seeds/timings. Hash order is insertion order and is safe to print. Avoid float
rounding at `.5` boundaries (`2.675.round(2)` is `2.68` here, a binary-float artifact).

### Question kinds

`pick` (one `___`, 2-4 options), `predict` (output, "Is this valid Ruby?", "What happens?"),
`type` (exact token for `___`), `order` (lines in the correct order, unique), `run` (broken
starter that runs → fix → expected stdout substring that the starter cannot print). Prompts are
short, code at most 12 lines.

### Visual vocabulary (existing stage effects)

The stage understands: `enter`/`exit`, `tag` (label above an actor = variable name, optional
value), `untag`, `value` (value chip), `dead` (binding invalid), `item` (sword, potion, gem,
shield, scroll, key), `give` (move item), `clone` (duplicate item), `lend` (ghost copy goes and
comes back; `mut` for a writable loan), `drop`, `attack`/`hp`, `say`, `print` (stdout), `shake`
(error), `banner`, `wait`. Actors: `hero`, `ally`, `enemy` (enemy sprites: `ruby/nil-ghost`,
`ruby/hash-mimic`, `ruby/monkey-imp`, `ruby/frozen-cube`). Suggested mapping for Ruby:

| Ruby idea | On stage |
|---|---|
| Object (every value) | An `item` on the stage; it answers messages (`say` the reply when a method is called) |
| Variable | A `tag` (a name label) stuck on an item. Two tags can point at the same item |
| `b = a` (assignment) | A second `tag` lands on the **same** item: no copy |
| `dup` / `clone` | `clone` the item; `clone` keeps the frost (frozen) and singleton tricks, `dup` does not |
| Mutation (`<<`, `upcase!`, `push`) | The item itself changes color/size; every tag on it sees the change |
| Rebinding (`+=`, `=`) | The tag `untag`s and moves to a brand-new item; the old item is unchanged |
| `nil` | `ruby/nil-ghost`: calling a method on it (`attack`) makes the stage `shake` with `NoMethodError` |
| Truthiness | Only `nil` (the ghost) and `false` (a grey stone) fail a gate; `0`, `""`, `[]` pass |
| Symbol | An engraved gem: every `:name` is the very same gem (one object) |
| Frozen object | `ruby/frozen-cube` wraps the item in ice; mutating it `shake`s with `FrozenError` |
| Method call | Hero `say`s the message to the item; the reply chip appears (`value`) |
| Block | A `scroll` handed to the ally together with the call; `yield` = the ally reads the scroll aloud |
| Proc / lambda | The scroll stored in a backpack (an object). A lambda checks the number of items given; a proc does not |
| Closure | The scroll remembers the tags around it (a pocket with a `lend` that never returns) |
| Hash | `ruby/hash-mimic`: a chest with labeled drawers; `Hash.new([])` = one shared drawer behind every label |
| Class | A blueprint banner; `new` makes an actor `enter` |
| Module mixin | A `shield` with skills: `include` puts it on every actor of the class, `extend` on just one, `prepend` in front |
| Method lookup | The message travels along a line of actors (`ancestors`) until one answers |
| `method_missing` / monkey patching | `ruby/monkey-imp` catches unknown messages or rewrites a class's moves |
| Exception | `shake` + `banner "KeyError"`; `rescue` is a `shield` that catches it; `ensure` always `print`s |
| Thread | A new ally `enter`s; the GVL is a single `key`: only the ally holding it runs Ruby code |

---

## Region plan (learning order)

Learning order: objects and values → collections and blocks → classes and modules → errors,
metaprogramming, pattern matching and concurrency. Blocks come early (region 2) because
idiomatic Ruby uses them from day one (`each`, `map`, `times`).

| # | Region slug | Theme | Big idea | Lessons |
|---|---|---|---|---|
| 1 | `object-village` | village | Everything is an object; numbers, strings, symbols, truthiness, methods | 4 + boss |
| 2 | `enumerable-forest` | forest | Arrays, hashes, ranges, blocks, procs/lambdas, Enumerable | 4 + boss |
| 3 | `module-castle` | castle | Classes, mixins and method lookup, class-level state, equality and copies | 4 + boss |
| 4 | `meta-tower` | tower | Exceptions, metaprogramming, pattern matching, threads/GVL/Ractor | 4 + boss |

Exam-only topics with no region yet (candidates for a future region 5, mountain theme, e.g.
`runtime-peaks`): testing (Minitest/RSpec), tooling (Bundler, gems, `require`), runtime (GC,
memory, YJIT, profiling). Question ideas for them are in the exam section.

---

## Region 1: `object-village`, Everything is an object

Sources: Ruby in Twenty Minutes (https://www.ruby-lang.org/en/documentation/quickstart/),
Integer/Float/String docs (https://docs.ruby-lang.org/en/3.4/String.html), methods syntax
(https://docs.ruby-lang.org/en/3.4/syntax/methods_rdoc.html), Ruby 3.4 release notes
(https://www.ruby-lang.org/en/news/2024/12/25/ruby-3-4-0-released/), Ruby Style Guide
(https://rubystyle.guide/).

### 1.1 `hello-objects`, "Everything answers messages"

- **Concept**: `puts`, `p` and `print`; a variable is a name (label) for an object; every value
  is an object with a class (`42.class`), even `nil`, `true` and symbols; calling methods on
  literals (`5.even?`); dynamic typing: a variable can point to any type over time, but Ruby
  never converts types implicitly (`5 + nil`, `"HP: " + 10` raise); comments with `#`.
- **Visual**: hero `enter`s with an `item` gem; Kira `say`s "42, what are you?" and the gem
  answers `Integer` (`value`). `x = 10; x = "ten"` moves the `tag "x"` from the gem to a scroll.
  Adding `nil` summons `ruby/nil-ghost` and the stage `shake`s with `TypeError`.
- **Questions**:
  1. predict: `puts 42.class, 3.14.class, "hi".class` → `Integer` / `Float` / `String` [OUT]
  2. predict: `puts nil.class, true.class, :a.class` → `NilClass` / `TrueClass` / `Symbol` [OUT]
  3. predict: `puts 5.even?, -7.abs, 3.zero?` → `false` / `7` / `false` [OUT]
  4. predict: `x = 10; x = "ten"; puts x` → `ten` (dynamic typing: the label moved) [OUT]
  5. predict: `p "hi"; puts "hi"` → `"hi"` / `hi` [OUT]
  6. predict: `print "a", "b\n"` → `ab` [OUT]
  7. predict: `p nil; puts nil` → `nil` / (an empty line) [OUT]
  8. predict: `r = puts("x"); p r` → `x` / `nil` (`puts` returns `nil`) [OUT]
  9. predict "What happens?": `puts 5 + nil` → raises `TypeError` (`nil can't be coerced into Integer`) [RAISE]
  10. predict: `puts "level " + 3.to_s; puts "a" "b"` → `level 3` / `ab` (adjacent string literals are joined) [OUT]
  11. predict: `puts 1.class.ancestors.inspect` → `[Integer, Numeric, Comparable, Object, Kernel, BasicObject]` [OUT]
  12. predict: `x = 3; y = x; y += 1; p x, y` → `3` / `4` (`+=` rebinds `y`, numbers are immutable) [OUT]
- **Run**: starter
  ```ruby
  hp = 10
  puts "HP: " + hp
  ```
  → raises `TypeError` (`no implicit conversion of Integer into String`). Solution:
  `puts "HP: #{hp}"` (or `hp.to_s`). `expect`: `HP: 10`. [RAISE → OUT]

### 1.2 `strings-and-numbers`, "Gems, scrolls and engraved symbols"

- **Concept**: Integer division truncates toward negative infinity (`-7 / 2` is `-4`, `-7 % 3`
  is `2`); `fdiv`, `divmod`; Floats are binary (`0.1 + 0.2 != 0.3`), Rational (`1/3r`) is exact;
  Integers never overflow (bignums); `to_i` is lenient (`"12abc".to_i` is `12`), `Integer()` is
  strict; strings are **mutable**: `<<` changes the object, `+=` makes a new one; interpolation
  only in double quotes; bang methods mutate (`upcase!`); symbols are immutable, unique names
  (`:a.equal?(:a)`); `# frozen_string_literal: true` freezes every literal in the file (since 3.4
  literals without the comment are "chilled": `frozen?` is `false` and mutation still works),
  `+"text"` gives a mutable copy.
- **Visual**: a string is a `scroll`; `s << "!"` writes on the same scroll, so every `tag` on it
  sees the change; `s += "!"` `clone`s into a new scroll and moves only one tag. A symbol is an
  engraved gem: every `:a` points to the same gem. The magic comment brings `ruby/frozen-cube`,
  which freezes each scroll as it appears.
- **Questions**:
  1. predict: `puts 7 / 2, -7 / 2, 7.0 / 2, 7 % 3, -7 % 3` → `3` / `-4` / `3.5` / `1` / `2` [OUT]
  2. predict: `puts 7.fdiv(2); p 7.divmod(2)` → `3.5` / `[3, 1]` [OUT]
  3. predict "What happens?": `puts "5" + 5` → raises `TypeError` (`no implicit conversion of Integer into String`) [RAISE]
  4. predict: `puts "5" * 3, "5".to_i + 5, 5.to_s + "5", "12abc".to_i, "abc".to_i` → `555` / `10` / `55` / `12` / `0` [OUT]
  5. predict "What happens?": `puts Integer("12abc")` → raises `ArgumentError` (`invalid value for Integer(): "12abc"`) [RAISE]
  6. predict: `puts 0.1 + 0.2 == 0.3; puts 1/3r + 1/6r` → `false` / `1/2` [OUT]
  7. predict: `name = "Rubi"; puts "Hi, #{name}!"; puts 'Hi, #{name}!'` → `Hi, Rubi!` / `Hi, #{name}!` [OUT]
  8. predict: `s = "hi"; t = s; t << "!"; puts s` → `hi!` (same object) [OUT]
  9. predict: `s = "hi"; t = s; t += "!"; puts s, t` → `hi` / `hi!` (new object) [OUT]
  10. predict "What happens?": file
      ```ruby
      # frozen_string_literal: true
      s = "hi"
      puts s.frozen?
      s << "!"
      ```
      → prints `true`, then raises `FrozenError` (`can't modify frozen String: "hi"`) [RAISE]
  11. pick: with the magic comment on, `t = ___"ok"; t << "!"; puts t` prints `ok!` → options `+` / `-` / `&` → `+` (unary plus returns an unfrozen string) [OUT]
  12. predict: `s = "hello"; s.upcase; puts s; s.upcase!; puts s` → `hello` / `HELLO` [OUT]
  13. predict: `puts :a.equal?(:a), "a".equal?("a"), :name.to_s; p "name".to_sym` → `true` / `false` / `name` / `:name` [OUT]
  14. predict: `puts "ruby"[0], "ruby"[-1], "ruby"[1..2]; p "ruby"[10]` → `r` / `y` / `ub` / `nil` [OUT]
  15. predict: `puts "héllo".length, "héllo".bytesize` → `5` / `6` [OUT]
  16. predict: `puts 2**64, (2**64).class` → `18446744073709551616` / `Integer` (no overflow) [OUT]
  17. predict "What happens?": `puts 1 / 0` → raises `ZeroDivisionError` (`divided by 0`); `puts 1.0 / 0` prints `Infinity` [RAISE]
  18. predict: `puts "abc".frozen?, :abc.frozen?, 1.frozen?` → `false` / `true` / `true` (Ruby 3.4 chilled literal reports `false`) [OUT]
- **Run**: starter
  ```ruby
  average = (7 + 8) / 2
  puts "average: #{average}"
  ```
  prints `average: 7` (Integer division). Solution: `/ 2.0` (or `.fdiv(2)`). `expect`:
  `average: 7.5`. [OUT → OUT]

### 1.3 `truth-and-branches`, "Only the ghost and the stone are false"

- **Concept**: only `nil` and `false` are falsy, everything else (including `0`, `""`, `[]`) is
  truthy; `nil?`, `!!`; `if`/`elsif`/`else`/`unless`, modifiers (`puts x if ok`), ternary;
  `if` is an expression (returns `nil` when no branch runs); `case`/`when` uses `===` (ranges,
  classes, regexes); `&&`/`||` vs `and`/`or` (much lower precedence than `=`); `||=`; safe
  navigation `&.`; loops: `while`, `until`, `loop`, `n.times`, `upto`, `step`, `each`; `next` and
  `break` (with a value) in blocks.
- **Visual**: a gate that only `ruby/nil-ghost` and a grey `false` stone cannot pass; a `0` chip
  and an empty scroll walk right through (surprise `say` from Kira). `&.` is a ghost-proof glove:
  touching the ghost through it gives back `nil` instead of a `shake`.
- **Questions**:
  1. predict: `zero = 0; empty = ""; none = nil; puts(zero ? "yes" : "no"); puts(empty ? "yes" : "no"); puts(none ? "yes" : "no")` → `yes` / `yes` / `no` (use variables: a string literal in a condition prints a parser warning) [OUT]
  2. predict: `x = nil; puts x.nil?, !!x, !!0, !nil` → `true` / `false` / `true` / `true` [OUT]
  3. predict: `hp = 0; puts "alive" unless hp.zero?; puts "done"` → `done` [OUT]
  4. predict: `n = 15; r = case n when 1..9 then "small" when 10..99 then "medium" else "big" end; puts r` → `medium` [OUT]
  5. predict: `v = "hi"; puts(case v when Integer then "int" when String then "str" end)` → `str` [OUT]
  6. predict: `puts (1..5) === 3, Integer === 3, /ab/ === "cab", 3 === Integer` → `true` / `true` / `true` / `false` (`===` is not symmetric) [OUT]
  7. predict: `x = nil; x ||= 5; x ||= 7; puts x; y = false; y ||= 1; puts y` → `5` / `1` [OUT]
  8. predict: `a = false || true; b = false or true; p a, b` → `true` / `false` (`or` binds looser than `=`) [OUT]
  9. predict: `a = nil; puts a&.length.inspect; b = "abc"; puts b&.length` → `nil` / `3` [OUT]
  10. predict: `[1, 2, 3, 4].each { |n| next if n.even?; print n }; puts` → `13` [OUT]
  11. predict: `r = [1, 2, 3].each { |n| break n * 10 if n == 2 }; p r` → `20` [OUT]
  12. predict: `r = if false then 1 end; p r` → `nil` [OUT]
  13. predict "Is this valid Ruby?":
      ```ruby
      x = 1
      if x > 2
        puts "a"
      else if x > 0
        puts "b"
      end
      ```
      → No: `syntax error found (SyntaxError)`, "Unmatched keyword, missing `end' ?" (`else if` opens a second `if`; write `elsif`) [SYNTAX]
  14. predict: `i = 0; i += 1 while i < 5; puts i` → `5` [OUT]
  15. predict: `3.times { |i| print i }; puts; 10.step(1, -4) { |i| print i, " " }; puts` → `012` / `10 6 2 ` (trailing space) [OUT]
- **Run**: starter
  ```ruby
  stock = 0
  if stock
    puts "in stock: #{stock}"
  else
    puts "sold out"
  end
  ```
  prints `in stock: 0` (0 is truthy). Solution: `if stock > 0` (or `stock.positive?`).
  `expect`: `sold out`. [OUT → OUT]

### 1.4 `methods-and-arguments`, "Kira's spellbook of methods"

- **Concept**: `def ... end` and endless `def name(args) = expr` (3.0); the last expression is the
  return value (implicit return), `return` exits early; default arguments, keyword arguments
  (`amount: 10`, required `name:`), splat `*args` and double splat `**opts`; passing an array
  with `*` and a hash with `**`; Ruby checks arity (`ArgumentError`); naming: `?` predicates
  return booleans, `!` marks the dangerous/mutating version (`sort` vs `sort!`, and `upcase!`
  returns `nil` when nothing changed); returning several values is returning an array plus
  destructuring; `def` opens a new scope (outer local variables are invisible).
- **Visual**: the ally is a method: hero `give`s chips (arguments), the ally `give`s back the
  last chip it touched (implicit return). A keyword argument is a chip with a label. Too many
  chips make the ally `shake` (`ArgumentError`). `sort!` changes the hero's own scroll; `sort`
  hands back a `clone`.
- **Questions**:
  1. predict: top: `def greet(name = "hero")` / `"Hi, #{name}"` / `end`; body `puts greet, greet("Rubi")` → `Hi, hero` / `Hi, Rubi` [OUT]
  2. predict: top: `def heal(hp, amount: 10) = hp + amount`; body `puts heal(50), heal(50, amount: 25)` → `60` / `75` [OUT]
  3. predict: top: `def total(*nums) = nums.sum`; body `puts total(1, 2, 3), total` → `6` / `0` [OUT]
  4. predict: top: `def opts(**kw) = kw`; body `p opts(a: 1, b: 2)` → `{a: 1, b: 2}` [OUT]
  5. predict: top: `def last_expr; 1; 2; 3; end` and `def early(x); return "neg" if x < 0; "pos"; end`; body `p last_expr, early(-1), early(1)` → `3` / `"neg"` / `"pos"` [OUT]
  6. predict "What happens?": top: `def add(a, b) = a + b`; body `add(1)` → raises `ArgumentError` (`wrong number of arguments (given 1, expected 2)`) [RAISE]
  7. predict "What happens?": with `heal` above, `heal(1, power: 3)` → raises `ArgumentError` (`unknown keyword: :power`) [RAISE]
  8. predict "What happens?": top: `def req(name:) = name`; body `req` → raises `ArgumentError` (`missing keyword: :name`) [RAISE]
  9. predict: `a = [3, 1, 2]; b = a.sort; p a, b; a.sort!; p a` → `[3, 1, 2]` / `[1, 2, 3]` / `[1, 2, 3]` [OUT]
  10. predict: `s = "abc"; p s.upcase!; t = "ABC"; p t.upcase!` → `"ABC"` / `nil` (bang returns `nil` when nothing changed) [OUT]
  11. predict: top: `def pair = [1, 2]`; body `a, b = pair; puts a + b; x, *y = [1, 2, 3]; p x, y` → `3` / `1` / `[2, 3]` [OUT]
  12. predict: top: `def mix(a, b = 2, *rest, c:, d: 4, **others) = [a, b, rest, c, d, others]`; body `p mix(1, c: 3), mix(1, 9, 8, 7, c: 3, z: 0)` → `[1, 2, [], 3, 4, {}]` / `[1, 9, [8, 7], 3, 4, {z: 0}]` [OUT]
  13. predict: with `add`, `heal` above: `arr = [1, 2]; puts add(*arr); h = {amount: 5}; puts heal(1, **h)` → `3` / `6` [OUT]
  14. predict "Is this valid Ruby?": `def hp=(v) = @hp = v` → No: `syntax error found (SyntaxError)` (setter methods cannot be endless) [SYNTAX]
  15. predict: `y = 5; def no_see = defined?(y).inspect; puts no_see` → `nil` (`def` does not see outer locals) [OUT]
  16. predict: with `add` and `total` above: `p method(:add).arity, method(:total).arity` → `2` / `-1` [OUT]
- **Run**: starter
  ```ruby
  def heal(hp, amount = 10)
    hp + amount
  end
  puts "hp: #{heal(50, amount: 25)}"
  ```
  → raises `TypeError` (`Hash can't be coerced into Integer`: `amount: 25` became a Hash in the
  optional positional slot). Solution: `def heal(hp, amount: 10)`. `expect`: `hp: 75`.
  [RAISE → OUT]

### Boss: `village-boss`, "The Nil Ghost's riddles" (enemy `ruby/nil-ghost`)

Timed mix of region 1, 6-8 questions. New ones:

1. predict "What happens?": `nil + 1` → raises `NoMethodError` (`undefined method '+' for nil`) [RAISE]
2. predict: `a = b = "same"; b << "!"; p a` → `"same!"` (two tags, one scroll) [OUT]
3. predict: `p defined?(foo), defined?(puts), defined?(String)` → `nil` / `"method"` / `"constant"` [OUT]
4. predict: `puts 10 / 4 * 4, 10 * 4 / 4.0` → `8` / `10.0` [OUT]
5. predict "What happens?": `"5" * "5"` → raises `TypeError` (`no implicit conversion of String into Integer`) [RAISE]
6. predict: `puts 3.0, 1e20, 2e-5` → `3.0` / `1.0e+20` / `2.0e-05` [OUT]
7. Reuse from lessons: 1.1 Q9, 1.2 Q1, 1.3 Q8, 1.4 Q10.

---

## Region 2: `enumerable-forest`, Collections and blocks

Sources: Array, Hash, Range, Proc and Enumerable docs (https://docs.ruby-lang.org/en/3.4/Hash.html,
https://docs.ruby-lang.org/en/3.4/Proc.html, https://docs.ruby-lang.org/en/3.4/Enumerable.html),
calling methods with blocks (https://docs.ruby-lang.org/en/3.4/syntax/calling_methods_rdoc.html),
Ruby 3.4 `it` (release notes).

### 2.1 `arrays`, "The adventurer's satchel"

- **Concept**: ordered, mixed-type arrays; indexes from 0, negative from the end, out of range
  gives `nil` (but `fetch` raises); `first`, `last`, slices `a[1..]`, `a[0, 2]`; `<<`/`push`,
  `pop`, `shift`; assignment shares the array, `dup` copies (shallowly); writing past the end
  fills with `nil`; set-like `+`, `-`, `&`; `compact`, `uniq`, `flatten`; `%w[]`, `%i[]`; the
  `Array.new(3, [])` trap (one shared inner array); never mutate an array while iterating it;
  `freeze`.
- **Visual**: the array is a satchel `item` with numbered pockets. `b = a` sticks a second tag
  on the same satchel; `a.dup` `clone`s it. `Array.new(3, [])` shows three pockets connected by
  a rope to one single inner pouch: putting a sword in pocket 0 makes it appear in all three.
- **Questions**:
  1. predict: `a = [10, 20, 30]; p a[0], a[-1], a[5]` → `10` / `30` / `nil` [OUT]
  2. predict: `a = [10, 20, 30]; p a.first, a.last(2), a[1..], a[0, 2]` → `10` / `[20, 30]` / `[20, 30]` / `[10, 20]` [OUT]
  3. predict: `a = [1, 2]; a << 3; a.push(4, 5); p a, a.size; p a.pop, a.shift, a` → `[1, 2, 3, 4, 5]` / `5` / `5` / `1` / `[2, 3, 4]` [OUT]
  4. predict: `a = [1, 2]; b = a; b << 3; p a; c = a.dup; c << 4; p a, c` → `[1, 2, 3]` / `[1, 2, 3]` / `[1, 2, 3, 4]` [OUT]
  5. predict: `g = Array.new(3, []); g[0] << "x"; p g` → `[["x"], ["x"], ["x"]]` [OUT]
  6. predict: `g = Array.new(3) { [] }; g[0] << "x"; p g` → `[["x"], [], []]` [OUT]
  7. predict: `a = [1, 2, 3]; a[5] = 6; p a` → `[1, 2, 3, nil, nil, 6]` [OUT]
  8. predict: `p [1, 2] + [3], [1, 2, 2, 3] - [2], [1, 2] & [2, 3]` → `[1, 2, 3]` / `[1, 3]` / `[2]` [OUT]
  9. predict: `p [1, nil, 2, nil].compact, [1, 1, 2].uniq, [1, [2, [3]]].flatten` → `[1, 2]` / `[1, 2]` / `[1, 2, 3]` [OUT]
  10. predict "What happens?": `[1, 2, 3].fetch(10)` → raises `IndexError` (`index 10 outside of array bounds: -3...3`) [RAISE]
  11. predict "What happens?": `a = [1, 2, 3]; a.freeze; a << 4` → raises `FrozenError` (`can't modify frozen Array: [1, 2, 3]`) [RAISE]
  12. predict: `p %w[a b c], %i[a b]` → `["a", "b", "c"]` / `[:a, :b]` [OUT]
  13. predict: `a = [1, 2, 3]; a.each { |x| a.delete(x) }; p a` → `[2]` (mutating during iteration skips elements) [OUT]
  14. predict "Is this valid Ruby?": `a = [1, 2, 3,]; p a` → Yes, prints `[1, 2, 3]` (trailing comma allowed) [OUT]
- **Run**: starter
  ```ruby
  slots = Array.new(3, [])
  slots[0] << "sword"
  puts "slot 1: #{slots[1].inspect}"
  ```
  prints `slot 1: ["sword"]`. Solution: `Array.new(3) { [] }`. `expect`: `slot 1: []`. [OUT → OUT]

### 2.2 `hashes-and-ranges`, "The mimic chest"

- **Concept**: hashes map keys to values and keep **insertion order**; symbol keys (`{hp: 30}`)
  vs string keys (`{"hp" => 30}`) are different keys; `"b": 2` makes a **symbol** key; `[]`
  returns `nil` (or the default) for a missing key, `fetch` raises `KeyError` or takes a
  fallback; `Hash.new(0)` for counters; **`Hash.new([])` shares one default array and never
  stores the key** (the hash stays empty); `Hash.new { |h, k| h[k] = [] }` is the fix;
  `transform_values`, `select`, `invert`, `merge`, `dig`; `||=` to initialize; no new keys during
  iteration; `1 == 1.0` but `1` and `1.0` are different keys (`eql?`); ranges `1..5` (inclusive),
  `1...5` (exclusive), endless `(1..)`, `step`, ranges in `case`.
- **Visual**: `ruby/hash-mimic` is a chest with labeled drawers. Asking for a missing drawer
  with `[]` gives a `nil` puff; `fetch` makes the mimic bite (`shake`, `KeyError`).
  `Hash.new([])` shows every unknown label opening the same hidden drawer behind the chest, while
  the visible drawers stay empty.
- **Questions**:
  1. predict: `h = {name: "Rubi", hp: 30}; p h[:name], h[:mp], h.fetch(:hp), h.fetch(:mp, 0)` → `"Rubi"` / `nil` / `30` / `0` [OUT]
  2. predict "What happens?": `h = {name: "Rubi"}; h.fetch(:mp)` → raises `KeyError` (`key not found: :mp`) [RAISE]
  3. predict: `h = {"name" => "Rubi"}; p h[:name], h["name"]; p h` → `nil` / `"Rubi"` / `{"name" => "Rubi"}` [OUT]
  4. predict: `h = {a: 1, "b": 2}; p h; p h[:b], h["b"]` → `{a: 1, b: 2}` / `2` / `nil` [OUT]
  5. predict: `h = Hash.new(0); "banana".each_char { |c| h[c] += 1 }; p h` → `{"b" => 1, "a" => 3, "n" => 2}` [OUT]
  6. predict: `h = Hash.new([]); h[:a] << 1; h[:b] << 2; p h, h[:a], h[:zzz], h.size` → `{}` / `[1, 2]` / `[1, 2]` / `0` [OUT]
  7. predict: `h = Hash.new { |hash, k| hash[k] = [] }; h[:a] << 1; h[:b] << 2; p h` → `{a: [1], b: [2]}` [OUT]
  8. predict: `h = {b: 2, a: 1}; h[:c] = 3; h.each { |k, v| print k, "=", v, " " }; puts` → `b=2 a=1 c=3 ` (insertion order, trailing space) [OUT]
  9. predict: `h = {a: 1, b: 2}; p h.transform_values { _1 * 2 }, h.select { |k, v| v > 1 }, h.invert` → `{a: 2, b: 4}` / `{b: 2}` / `{1 => :a, 2 => :b}` [OUT]
  10. predict: `p({1 => "a", 1.0 => "b"}.size)` → `2` [OUT]
  11. predict: `p (1..5).to_a, (1...5).to_a, (1...5).include?(5)` → `[1, 2, 3, 4, 5]` / `[1, 2, 3, 4]` / `false` [OUT]
  12. predict: `p (1..).first(3), (1..10).step(3).to_a, ('a'..'e').to_a.join` → `[1, 2, 3]` / `[1, 4, 7, 10]` / `"abcde"` [OUT]
  13. predict: `h = {a: {b: {c: 42}}}; p h.dig(:a, :b, :c), h.dig(:x, :b)` → `42` / `nil` [OUT]
  14. predict "What happens?": `h = {a: 1}; h.each_pair { |k, v| h[:b] = 2 }` → raises `RuntimeError` (`can't add a new key into hash during iteration`) [RAISE]
  15. predict: `h = {}; h[:list] ||= []; h[:list] << 1; h[:list] ||= [:nope]; p h` → `{list: [1]}` [OUT]
- **Run**: starter
  ```ruby
  bags = Hash.new([])
  bags[:rubi] << "gem"
  puts "bags: #{bags}"
  ```
  prints `bags: {}`. Solution: `Hash.new { |hash, key| hash[key] = [] }`. `expect`:
  `bags: {rubi: ["gem"]}`. [OUT → OUT]

### 2.3 `blocks-procs-lambdas`, "Scrolls, backpacks and strict spells"

- **Concept**: a block (`{ }` or `do ... end`) is code passed to a method call; `yield` runs it
  (with arguments), `block_given?` checks for one, `yield` without a block raises
  `LocalJumpError`; `&blk` captures the block as a `Proc`; `proc { }` vs `->(x) { }`/`lambda`:
  **lambdas check arity, procs do not** (missing args become `nil`, extras are dropped, a single
  array is auto-splatted); **`return` in a proc returns from the enclosing method, in a lambda
  only from the lambda**; calling: `.call`, `.()`, `[]`; closures capture variables (not
  values); `&:sym` and `&proc` convert to blocks; numbered parameters `_1` and `it` (3.4; not
  allowed together with named parameters); `>>`/`<<` composition; block-local variables
  `|i; x|`.
- **Visual**: a block is a `scroll` handed over with the call; `yield` = the ally reads it aloud
  (`say`). A proc is the scroll kept in a backpack; a lambda is a sealed scroll that checks how
  many items it gets (`shake` on the wrong count). A closure scroll has a pocket with a `lend`
  of the variable that never returns: later changes show through.
- **Questions**:
  1. predict: top: `def twice; yield; yield; end`; body `twice { print "hi " }; puts` → `hi hi ` [OUT]
  2. predict: top: `def with_hp; yield 10, 20; end`; body `with_hp { |a, b| puts a + b }` → `30` [OUT]
  3. predict: top: `def maybe; block_given? ? yield : "no block"; end`; body `puts maybe, maybe { "got it" }` → `no block` / `got it` [OUT]
  4. predict "What happens?": top: `def no_block; yield; end`; body `no_block` → raises `LocalJumpError` (`no block given (yield)`) [RAISE]
  5. predict: top: `def run_proc; pr = Proc.new { return 10 }; pr.call; 20; end` and `def run_lambda; l = -> { return 10 }; l.call; 20; end`; body `p run_proc, run_lambda` → `10` / `20` [OUT]
  6. predict: `sq = ->(x) { x * x }; p sq.call(4), sq.(5), sq[6]` → `16` / `25` / `36` [OUT]
  7. predict "What happens?": `l = ->(a, b) { a + b }; l.call(1)` → raises `ArgumentError` (`wrong number of arguments (given 1, expected 2)`) [RAISE]
  8. predict: `pr = proc { |a, b| [a, b] }; p pr.call(1), pr.call(1, 2, 3), pr.call([4, 5])` → `[1, nil]` / `[1, 2]` / `[4, 5]` [OUT]
  9. predict: top: `def counter; c = 0; -> { c += 1 }; end`; body `c = counter; c.call; c.call; p c.call; d = counter; p d.call` → `3` / `1` [OUT]
  10. predict: `x = 1; add_x = ->(n) { n + x }; x = 100; p add_x.(1)` → `101` (closures capture the variable) [OUT]
  11. predict: `p [1, 2, 3].map(&:to_s), [1, 2, 3].map { it * 2 }, [1, 2, 3].map { _1 + 1 }` → `["1", "2", "3"]` / `[2, 4, 6]` / `[2, 3, 4]` [OUT]
  12. predict "Is this valid Ruby?": `p [1, 2].map { |x| it }` → No: `'it' is not allowed when an ordinary parameter is defined` (SyntaxError) [SYNTAX]
  13. predict: `double = proc { |x| x * 2 }; p [1, 2].map(&double)` → `[2, 4]` [OUT]
  14. predict: `compose = ->(x) { x + 1 } >> ->(x) { x * 10 }; p compose.(1)` → `20` [OUT]
  15. predict: `p proc { |a| }.lambda?, lambda { }.lambda?` → `false` / `true` [OUT]
  16. predict: `x = 10; [1, 2].each { |i; x| x = i }; p x; y = 10; [1].each { y += 1 }; p y` → `10` / `11` [OUT]
- **Run**: starter
  ```ruby
  def each_twice(items)
    items.each { |i| yield i; yield i }
  end
  out = []
  each_twice([1, 2])
  puts "out: #{out}"
  ```
  → raises `LocalJumpError` (`no block given (yield)`). Solution:
  `each_twice([1, 2]) { |i| out << i }`. `expect`: `out: [1, 1, 2, 2]`. [RAISE → OUT]

### 2.4 `enumerable-magic`, "The forest's spell circle"

- **Concept**: `each` returns the receiver, `map` returns the new array; `select`/`filter`,
  `reject`, `find`, `reduce`/`inject` (with or without initial value; the block's value becomes
  the accumulator, so a `nil` from an `if` breaks the next step), `sum`, `count`, `tally`,
  `group_by`, `partition`, `each_with_object`, `each_with_index`, `map.with_index(1)`,
  `each_slice`, `each_cons`, `zip`, `flat_map`, `filter_map`, `min_by`/`max_by`/`sort_by`; any
  method without a block returns an `Enumerator` (`next`, `StopIteration`); `lazy` for infinite
  or expensive chains.
- **Visual**: a circle of allies passing items around: `map` makes each ally hand back a new
  item, `select` keeps only some, `reduce` rolls a snowball (`value` chip grows). `lazy` shows
  only one item walking the whole chain at a time (`print "map 1"` once).
- **Questions**:
  1. predict: `p [1, 2, 3, 4].select(&:even?), [1, 2, 3, 4].reject(&:even?), [1, 2, 3, 4].reduce(:+)` → `[2, 4]` / `[1, 3]` / `10` [OUT]
  2. predict: `p [1, 2, 3].reduce(10) { |acc, x| acc + x }, [1, 2, 3].inject { |a, b| a * b }` → `16` / `6` [OUT]
  3. predict: `p %w[a b a c a].tally` → `{"a" => 3, "b" => 1, "c" => 1}` [OUT]
  4. predict: `p [1, 2, 3, 4, 5].each_slice(2).to_a, [1, 2, 3, 4].each_cons(2).to_a` → `[[1, 2], [3, 4], [5]]` / `[[1, 2], [2, 3], [3, 4]]` [OUT]
  5. predict: `r = %w[ant bee ant].each_with_object(Hash.new(0)) { |w, h| h[w] += 1 }; p r` → `{"ant" => 2, "bee" => 1}` [OUT]
  6. predict: `arr = %w[apple banana cherry]; p arr.group_by(&:size), arr.max_by(&:size), arr.map(&:length)` → `{5 => ["apple"], 6 => ["banana", "cherry"]}` / `"banana"` / `[5, 6, 6]` [OUT]
  7. predict: `p [1, 2, 3].zip([4, 5, 6])` → `[[1, 4], [2, 5], [3, 6]]` [OUT]
  8. predict: `p (1..Float::INFINITY).lazy.map { _1 * 2 }.select { _1 % 3 == 0 }.first(3)` → `[6, 12, 18]` [OUT]
  9. predict: `p [1, 2, 3].lazy.map { puts "map #{_1}"; _1 * 2 }.first(1)` → `map 1` / `[2]`; without `lazy` it prints `map 1` / `map 2` / `map 3` / `[2]` [OUT]
  10. predict: `p [1, 2, 3].find { _1 > 5 }, [].all?, [nil, false].none?` → `nil` / `true` / `true` [OUT]
  11. predict: `p [1, 2, 3].map.with_index(1) { |x, i| "#{i}.#{x}" }` → `["1.1", "2.2", "3.3"]` [OUT]
  12. predict "What happens?": `p [1, 2, 3].reduce(0) { |s, x| s + x if x > 1 }` → raises `NoMethodError` (`undefined method '+' for nil`: the first step returned `nil`) [RAISE]
  13. predict: `p (1..6).partition(&:even?)` → `[[2, 4, 6], [1, 3, 5]]` [OUT]
  14. predict: `p [1, 2, 3, 4].filter_map { _1 * 2 if _1.odd? }, [1, 2, 3].flat_map { [_1, _1] }` → `[2, 6]` / `[1, 1, 2, 2, 3, 3]` [OUT]
  15. predict "What happens?": `e = [1, 2, 3].each; p e.next, e.next, e.next; e.next` → prints `1` / `2` / `3`, then raises `StopIteration` (`iteration reached an end`) [RAISE]
  16. predict: `p [1, 2, 3].map.class, (1..3).lazy.class` → `Enumerator` / `Enumerator::Lazy` [OUT]
- **Run**: starter
  ```ruby
  doubled = [1, 2, 3].each { |n| n * 2 }
  puts "doubled: #{doubled}"
  ```
  prints `doubled: [1, 2, 3]` (`each` returns the receiver). Solution: `map`. `expect`:
  `doubled: [2, 4, 6]`. [OUT → OUT]

### Boss: `forest-boss`, "The Hash Mimic" (enemy `ruby/hash-mimic`)

1. predict: `p [[1, 2], [3, 4]].each_with_object([]) { |(a, b), acc| acc << a + b }` → `[3, 7]` [OUT]
2. predict: top: `def three; yield 1, 2, 3; end`; body `three { |a, b| p [a, b] }; three { |a, *r| p r }; three { |*all| p all }` → `[1, 2]` / `[2, 3]` / `[1, 2, 3]` [OUT]
3. predict: `mem = Hash.new { |h, n| h[n] = n < 2 ? n : h[n - 1] + h[n - 2] }; p mem[40]` → `102334155` [OUT]
4. predict: `p [1, 2, 3].each_slice(2).map(&:sum)` → `[3, 3]` [OUT]
5. predict: `h = {b: 1, a: 2}; p h.sort_by { |k, v| v }.first, h.sum { |k, v| v }` → `[:b, 1]` / `3` [OUT]
6. Reuse: 2.1 Q5, 2.2 Q6, 2.3 Q5, 2.3 Q8, 2.4 Q12.

---

## Region 3: `module-castle`, Classes, mixins and identity

Sources: Object/Module/Comparable docs (https://docs.ruby-lang.org/en/3.4/Module.html,
https://docs.ruby-lang.org/en/3.4/Comparable.html), Struct and Data
(https://docs.ruby-lang.org/en/3.4/Struct.html, https://docs.ruby-lang.org/en/3.4/Data.html),
Object#eql? and #hash (https://docs.ruby-lang.org/en/3.4/Object.html), Ruby Style Guide
(classes, `@@` avoidance: https://rubystyle.guide/).

### 3.1 `classes-and-objects`, "Blueprints of the castle"

- **Concept**: `class Name` (constant name), `initialize`, instance variables `@x` (private to the
  object, `nil` when unset), `attr_reader`/`attr_writer`/`attr_accessor`; `to_s` used by `puts`
  and interpolation, `inspect` used by `p`; `self` (inside a setter call you must write
  `self.hp = ...`, otherwise `hp = ...` creates a local variable); method chaining by returning
  `self`; `private` (callable without receiver, or with `self.` since 2.7) and `protected`
  (callable on another instance of the same class); top-level `self` is `main`; singleton
  methods (`def obj.x`); reopening a class adds methods.
- **Visual**: the class is a blueprint banner; `Hero.new("Rubi")` makes the hero `enter` with a
  `tag "@name"`. `attr_accessor :hp` gives two doors (read and write). `hp = hp + 5` inside a
  method: a new local `tag "hp"` appears with an empty `nil` chip and the stage `shake`s.
- **Questions** (top for Q1-Q5):
  ```ruby
  class Hero
    attr_reader :name
    attr_accessor :hp
    def initialize(name, hp = 30) = (@name = name; @hp = hp)
    def to_s = "#{@name} (#{@hp})"
    def hit(n) = (self.hp -= n; self)
    def mana = @mana
    def heal_bad(n) = (hp = hp + n)
  end
  ```
  1. predict: `h = Hero.new("Rubi"); puts h.name, h.hp, h; puts "Hero: #{h}"` → `Rubi` / `30` / `Rubi (30)` / `Hero: Rubi (30)` [OUT]
  2. predict: `h = Hero.new("Rubi"); h.hp = 5; h.hit(2).hit(1); puts h.hp` → `2` [OUT]
  3. predict "What happens?": `Hero.new("Rubi").name = "X"` → raises `NoMethodError` (`undefined method 'name=' for an instance of Hero`) [RAISE]
  4. predict: `h = Hero.new("Rubi"); p h.mana, h.instance_variables` → `nil` / `[:@name, :@hp]` [OUT]
  5. predict "What happens?": `Hero.new("Rubi").heal_bad(5)` → raises `NoMethodError` (`undefined method '+' for nil`: `hp` on the right is the new local) [RAISE]
  6. predict: `p Hero.new("a").class, Hero.class, Hero.superclass` → `Hero` / `Class` / `Object` [OUT]
  7. predict: top: `class Vault; def open = "opened #{secret}"; def try_self = self.secret; private; def secret = "gold"; end`; body `puts Vault.new.open, Vault.new.try_self; Vault.new.secret` → `opened gold` / `gold`, then raises `NoMethodError` (`private method 'secret' called for an instance of Vault`) [RAISE]
  8. predict: top: `class Money; def initialize(c) = @cents = c; def >(o) = cents > o.cents; protected; attr_reader :cents; end`; body `p Money.new(5) > Money.new(3); Money.new(1).cents` → `true`, then raises `NoMethodError` (`protected method 'cents' called for an instance of Money`) [RAISE]
  9. predict: `p self.to_s, self.class` (top level) → `"main"` / `Object` [OUT]
  10. predict: `obj = Object.new; def obj.hi = "singleton hi"; p obj.hi, obj.singleton_methods` → `"singleton hi"` / `[:hi]` [OUT]
  11. predict: top: `class Sq; def initialize(n) = @n = n; def inspect = "#<Sq #{@n}>"; end`; body `p Sq.new(2); p [Sq.new(1)]` → `#<Sq 2>` / `[#<Sq 1>]` [OUT]
  12. predict: with `Hero` above: `class Hero; def shout = name.upcase; end; p Hero.new("rubi").shout` → `"RUBI"` (open classes) [OUT]
  13. predict "Is this valid Ruby?": `class hero` / `end` → No: "class/module name must be CONSTANT" (SyntaxError) [SYNTAX]
- **Run**: starter
  ```ruby
  class Hero
    attr_accessor :hp
    def initialize
      @hp = 10
    end
    def heal
      hp = hp + 5
    end
  end
  rubi = Hero.new
  rubi.heal
  puts "hp: #{rubi.hp}"
  ```
  → raises `NoMethodError` (`undefined method '+' for nil`). Solution: `self.hp += 5` (or
  `@hp += 5`). `expect`: `hp: 15`. [RAISE → OUT]

### 3.2 `mixins-and-lookup`, "Shields, crests and the line of answerers"

- **Concept**: single inheritance with `<`; `super` (bare: passes the same arguments) vs
  `super()` (no arguments); modules as mixins: `include` (after the class in `ancestors`),
  `prepend` (before the class: can wrap its methods with `super`), `extend` (adds to one object,
  e.g. the class itself); including the same module twice is a no-op; the last included module
  wins; method lookup follows `ancestors`; `module_function` / `extend self`; `Comparable` from
  `<=>`; `Enumerable` from `each`; duck typing and `respond_to?`; template method pattern
  (a parent calls a method the child overrides, even a private one).
- **Visual**: a message travels along the `ancestors` line of actors (`Loud`, `LoudBot`,
  `Greet`, `Object`) until one answers (`say`). `include` adds a shield-bearer after the class,
  `prepend` puts one in front, `extend` gives a shield to a single actor.
- **Questions**:
  1. predict: top: `class Animal; def initialize(name) = @name = name; def speak = "..."; def intro = "#{@name} says #{speak}"; end`, `class Dog < Animal; def speak = "Woof"; end`, `class Puppy < Dog; def speak = super + "!"; def initialize(name, age) = (super(name); @age = age); end`; body `puts Dog.new("Rex").intro, Puppy.new("Bit", 1).intro; p Puppy.ancestors.take(4)` → `Rex says Woof` / `Bit says Woof!` / `[Puppy, Dog, Animal, Object]` [OUT]
  2. predict "What happens?": top: `class A1; def hi(x) = "A #{x}"; end`, `class B1 < A1; def hi(x) = super + "!"; end`, `class C1 < A1; def hi(x) = super(); end`; body `p B1.new.hi(1); C1.new.hi(1)` → prints `"A 1!"`, then raises `ArgumentError` (`wrong number of arguments (given 0, expected 1)`) [RAISE]
  3. predict: top: `module Greet; def hello = "hello from #{self.class}"; end`, `module Loud; def hello = super.upcase; end`, `class Bot; include Greet; end`, `class LoudBot; include Greet; prepend Loud; def hello = "bot hello"; end`, `class IncBot; include Greet; include Loud; end`; body `puts Bot.new.hello, LoudBot.new.hello, IncBot.new.hello` → `hello from Bot` / `BOT HELLO` / `HELLO FROM INCBOT` [OUT]
  4. predict: same top, `p LoudBot.ancestors.take(4), IncBot.ancestors.take(4)` → `[Loud, LoudBot, Greet, Object]` / `[IncBot, Loud, Greet, Object]` [OUT]
  5. predict: top: `module Util; def self.twice(x) = x * 2; def helper = "h"; end`, `class Ext; extend Util; end`; body `p Util.twice(4), Ext.helper; Ext.new.helper` → `8` / `"h"`, then raises `NoMethodError` (`undefined method 'helper' for an instance of Ext`) [RAISE]
  6. predict: top: `module M1; def who = "M1"; end`, `module M2; def who = "M2"; end`, `class Multi; include M1; include M2; include M1; end`; body `p Multi.new.who, Multi.ancestors.first(3)` → `"M2"` / `[Multi, M2, M1]` (re-including is a no-op) [OUT]
  7. predict: top:
     ```ruby
     class Version
       include Comparable
       attr_reader :major, :minor
       def initialize(ma, mi) = (@major = ma; @minor = mi)
       def <=>(o) = [major, minor] <=> [o.major, o.minor]
       def to_s = "#{major}.#{minor}"
     end
     ```
     body `a = Version.new(1, 2); b = Version.new(1, 10); p a < b, a == Version.new(1, 2), [b, a].max.to_s` → `true` / `true` / `"1.10"` [OUT]
  8. predict: top: `class Bag; include Enumerable; def initialize(*items) = @items = items; def each(&) = @items.each(&); end`; body `b = Bag.new(3, 1, 2); p b.sort, b.map { _1 * 2 }, b.include?(2), b.min, b.sum, b.first` → `[1, 2, 3]` / `[6, 2, 4]` / `true` / `1` / `6` / `3` [OUT]
  9. predict: top: `class Duck; def quack = "Quack"; end`, `class Robot; def quack = "beep quack"; end`; body `[Duck.new, Robot.new].each { |d| puts d.quack }; p Robot.new.respond_to?(:quack), 5.respond_to?(:quack)` → `Quack` / `beep quack` / `true` / `false` [OUT]
  10. predict: top: `class Base2; def template = "#{prefix}-body"; private def prefix = "base"; end`, `class Sub2 < Base2; private def prefix = "sub"; end`; body `p Sub2.new.template` → `"sub-body"` [OUT]
  11. predict: top: `module Logged; def save = "log+" + super; end`, `class Record; def save = "saved"; end`, `class Record; prepend Logged; end`; body `p Record.new.save, Record.ancestors.first(2)` → `"log+saved"` / `[Logged, Record]` [OUT]
  12. predict: `p Integer.instance_of?(Class), Integer.is_a?(Module), Class.superclass, Module.superclass, BasicObject.superclass` → `true` / `true` / `Module` / `Object` / `nil` [OUT]
  13. type: `class Bot; ___ Greet; end` so that `Bot.new.hello` works → `include` [OUT]
- **Run**: starter
  ```ruby
  class Version
    attr_reader :major, :minor
    def initialize(major, minor)
      @major, @minor = major, minor
    end
    def <=>(other)
      [major, minor] <=> [other.major, other.minor]
    end
  end
  puts "newer: #{Version.new(1, 10) > Version.new(1, 9)}"
  ```
  → raises `NoMethodError` (`undefined method '>' for an instance of Version`). Solution:
  `include Comparable` inside the class. `expect`: `newer: true`. [RAISE → OUT]

### 3.3 `class-level-state`, "The castle's shared ledger"

- **Concept**: class methods (`def self.x`, `class << self`); class variables `@@x` are shared by
  the class **and all subclasses** (a subclass assignment overwrites the parent's value), so the
  style guide recommends class instance variables (`@x` in the class body, read via a class
  method) instead; an instance method's `@level` is a different variable from the class body's
  `@level`; constants (`Temp::MAX`) are not frozen (`CONST << "y"` works); `Struct.new` (mutable,
  positional or `keyword_init:`), `Data.define` (3.2, immutable value object, `with`); anonymous
  classes (`Class.new`) get a name when assigned to a constant.
- **Visual**: `@@count` is one ledger nailed to the castle wall that every tower (subclass)
  writes in; a class instance variable is a separate ledger in each tower. `Data` objects come
  out of the forge already encased by `ruby/frozen-cube`.
- **Questions**:
  1. predict: top:
     ```ruby
     class Counter
       @@count = 0
       @instances = 0
       class << self; attr_accessor :instances; end
       def self.count = @@count
       def initialize = (@@count += 1; self.class.instances += 1)
     end
     class SubCounter < Counter
       @instances = 0
     end
     ```
     body `Counter.new; Counter.new; SubCounter.new; p Counter.count, SubCounter.count, Counter.instances, SubCounter.instances` → `3` / `3` / `2` / `1` [OUT]
  2. predict: top: `class Base; @@setting = "base"; def self.setting = @@setting; end`, `class Child < Base; @@setting = "child"; end`; body `p Base.setting` → `"child"` [OUT]
  3. predict: top: `class Cfg; @level = 1; def self.level = @level; def level = @level; end`; body `p Cfg.level, Cfg.new.level` → `1` / `nil` [OUT]
  4. predict "What happens?": top: `class Temp; MAX = 100; def self.max = MAX; end`; body `p Temp::MAX, Temp.max; Temp::MAX2` → `100` / `100`, then raises `NameError` (`uninitialized constant Temp::MAX2`) [RAISE]
  5. predict: `CONST = "x"; CONST << "y"; p CONST` → `"xy"` (constants are not frozen) [OUT]
  6. predict: top: `Point = Struct.new(:x, :y) do; def dist2 = x * x + y * y; end`; body `pt = Point.new(3, 4); p pt.x, pt.dist2, pt == Point.new(3, 4), pt.to_a; pt.x = 9; p pt` → `3` / `25` / `true` / `[3, 4]` / `#<struct Point x=9, y=4>` [OUT]
  7. predict: top: `Coord = Data.define(:lat, :lng)`; body `c = Coord.new(lat: 1, lng: 2); p c, c.lat, c == Coord.new(1, 2), c.with(lat: 5)` → `#<data Coord lat=1, lng=2>` / `1` / `true` / `#<data Coord lat=5, lng=2>` [OUT]
  8. predict "What happens?": `Coord.new(1)` → raises `ArgumentError` (`missing keyword: :lng`) [RAISE]
  9. predict "What happens?": `c = Coord.new(1, 2); c.lat = 3` → raises `NoMethodError` (`undefined method 'lat=' for an instance of Coord`) [RAISE]
  10. predict: `p Struct.new(:a, :b).new(1).b` → `nil` [OUT]
  11. predict: top: `class Who; def me = self; def self.me = self; end`; body `w = Who.new; p w.me.equal?(w), Who.me` → `true` / `Who` [OUT]
  12. predict: `k = Class.new { def hi = "anon" }; p k.new.hi, k.name; Named = k; p k.name` → `"anon"` / `nil` / `"Named"` [OUT]
- **Run**: starter
  ```ruby
  class Monster
    @@sound = "..."
    def self.sound = @@sound
  end
  class Slime < Monster
    @@sound = "blub"
  end
  class Bat < Monster
    @@sound = "screech"
  end
  puts "Slime: #{Slime.sound}"
  ```
  prints `Slime: screech` (one shared `@@sound`). Solution: class instance variables:
  `@sound = "..."` plus `class << self; attr_reader :sound; end` in `Monster`, and
  `@sound = "blub"` / `@sound = "screech"` in the subclasses. `expect`: `Slime: blub`.
  [OUT → OUT]

### 3.4 `equality-and-copies`, "Twins, clones and ice"

- **Concept**: `==` (same value, overridable), `eql?` (same value and type, used by Hash keys
  with `hash`), `equal?` (same object identity); `1 == 1.0` but `!1.eql?(1.0)`; a class used as
  a Hash key or in `uniq` must define `eql?` **and** `hash`; `dup` vs `clone` (`clone` keeps the
  frozen state and singleton methods, `clone(freeze: false)`); both are **shallow**;
  `Marshal.load(Marshal.dump(x))` deep-copies plain data; `freeze` is shallow too; methods
  receive a reference to the same object (mutating it is visible to the caller, rebinding the
  parameter is not); `Float::NAN != Float::NAN`.
- **Visual**: two scrolls with the same text are `==` twins; `equal?` asks "is it the same
  scroll?". `dup` `clone`s the outer satchel but the pouches inside stay shared (`lend` without
  return). `freeze` brings `ruby/frozen-cube` over the outer satchel only.
- **Questions**:
  1. predict: `a = "gem"; b = "gem"; c = a; p a == b, a.equal?(b), a.equal?(c), a.eql?(b)` → `true` / `false` / `true` / `true` [OUT]
  2. predict: `p 1 == 1.0, 1.eql?(1.0), {1 => :int}[1.0]` → `true` / `false` / `nil` [OUT]
  3. predict: top: `class Card; attr_reader :rank; def initialize(r) = @rank = r; def ==(o) = o.is_a?(Card) && rank == o.rank; end`; body `p Card.new(1) == Card.new(1), [Card.new(1), Card.new(1)].uniq.size, {Card.new(1) => :a}.key?(Card.new(1))` → `true` / `2` / `false` [OUT]
  4. predict: same class plus `alias eql? ==` and `def hash = rank.hash` → `true` / `1` / `true` [OUT]
  5. predict: `a = "x".freeze; b = a.dup; c = a.clone; p b.frozen?, c.frozen?, a.clone(freeze: false).frozen?` → `false` / `true` / `false` [OUT]
  6. predict: `inv = [["sword"], ["potion"]]; copy = inv.dup; copy[0] << "!"; copy << ["gem"]; p inv` → `[["sword", "!"], ["potion"]]` [OUT]
  7. predict: `inv = [["sword"]]; deep = Marshal.load(Marshal.dump(inv)); deep[0] << "!"; p inv` → `[["sword"]]` [OUT]
  8. predict "What happens?": `o = Object.new; def o.hi = "hi"; p o.clone.hi; o.dup.hi` → prints `"hi"`, then raises `NoMethodError` (`undefined method 'hi' for an instance of Object`) [RAISE]
  9. predict "What happens?": `a = [1, [2]].freeze; a[1] << 3; p a; a << 4` → prints `[1, [2, 3]]`, then raises `FrozenError` (`can't modify frozen Array: [1, [2, 3]]`) [RAISE]
  10. predict "What happens?": `s = "abc".freeze; t = s + "d"; p t, t.frozen?; s.upcase!` → prints `"abcd"` / `false`, then raises `FrozenError` (`can't modify frozen String: "abc"`) [RAISE]
  11. predict: `p [1] == [1.0], [1].eql?([1.0]), Float::NAN == Float::NAN` → `true` / `false` / `false` [OUT]
  12. predict: top: `def change(s) = s << "b"` and `def rebind(s) = (s = "zzz")`; body `x = "a"; change(x); rebind(x); p x` → `"ab"` [OUT]
  13. predict: `p :a.equal?(:a), 1.equal?(1), nil.equal?(nil)` → `true` / `true` / `true` [OUT]
- **Run**: starter
  ```ruby
  class Card
    attr_reader :rank
    def initialize(rank)
      @rank = rank
    end
    def ==(other)
      other.is_a?(Card) && rank == other.rank
    end
  end
  cards = [Card.new("A"), Card.new("A")]
  puts "unique: #{cards.uniq.size}"
  ```
  prints `unique: 2`. Solution: add `alias eql? ==` and `def hash = rank.hash` (multi-line
  form is fine). `expect`: `unique: 1`. [OUT → OUT]

### Boss: `castle-boss`, "The Frozen Cube" (enemy `ruby/frozen-cube`)

1. predict: top: `module Tools; module_function; def hammer = "bang"; end`, `module Helpers; extend self; def assist = "assist"; end`; body `p Tools.hammer, Helpers.assist` → `"bang"` / `"assist"` [OUT]
2. predict: `p "lit".equal?("lit"), :"lit".equal?(:lit)` → `false` / `true` [OUT]
3. predict: `s = "abc"; f = s.freeze; p f.equal?(s), s.frozen?` → `true` / `true` (`freeze` freezes the receiver and returns it) [OUT]
4. predict: `a = [1, 2, 3]; b = a.map!(&:succ); p a.equal?(b), a` → `true` / `[2, 3, 4]` [OUT]
5. Reuse: 3.1 Q5, 3.2 Q3, 3.3 Q2, 3.4 Q4, 3.4 Q9.

---

## Region 4: `meta-tower`, Errors, magic and many hands

Sources: exceptions syntax (https://docs.ruby-lang.org/en/3.4/syntax/exceptions_rdoc.html),
Exception hierarchy (https://docs.ruby-lang.org/en/3.4/Exception.html), BasicObject#method_missing
and Module#define_method (https://docs.ruby-lang.org/en/3.4/BasicObject.html,
https://docs.ruby-lang.org/en/3.4/Module.html), refinements
(https://docs.ruby-lang.org/en/3.4/syntax/refinements_rdoc.html), pattern matching
(https://docs.ruby-lang.org/en/3.4/syntax/pattern_matching_rdoc.html), Thread and Mutex
(https://docs.ruby-lang.org/en/3.4/Thread.html), Ractor
(https://docs.ruby-lang.org/en/3.4/ractor_md.html), GC (https://docs.ruby-lang.org/en/3.4/GC.html).

### 4.1 `rescue-and-ensure`, "Shields against the storm"

- **Concept**: `begin`/`rescue`/`else`/`ensure`/`end` (also directly in a `def` body); `else`
  runs only when nothing was raised; `ensure` always runs and its value is ignored unless it
  uses an explicit `return` (which then wins); `retry`; `rescue => e` catches `StandardError`
  only (not `Exception`), so custom errors inherit from `StandardError`; rescue clauses are
  tried in order (put specific classes first); `raise` (and its alias `fail`), default class
  `RuntimeError`, default message = class name; `e.cause` for wrapped errors; the rescue modifier
  `expr rescue fallback`; `throw`/`catch` is control flow, not errors; the hierarchy
  (`KeyError < IndexError`, `NoMethodError < NameError`, `FrozenError < RuntimeError`,
  `ZeroDivisionError < StandardError`).
- **Visual**: the risky line `shake`s with a banner; a `rescue` shield catches it and the hero
  `say`s the message; `ensure` is a bell that `print`s every time. `retry` loops the hero back to
  the start of the `begin`.
- **Questions**:
  1. predict: `begin; puts "a"; 1 / 0; puts "b"; rescue ZeroDivisionError => e; puts "rescued: #{e.message}"; else; puts "else"; ensure; puts "ensure"; end` → `a` / `rescued: divided by 0` / `ensure` [OUT]
  2. predict: `begin; puts "a"; rescue; puts "r"; else; puts "else"; ensure; puts "ensure"; end` → `a` / `else` / `ensure` [OUT]
  3. predict: top: `def m1; return "body"; ensure; puts "cleanup"; end`, `def m2; "body"; ensure; "ignored"; end`, `def m3; return 1; ensure; return 2; end`; body `p m1, m2, m3` → `cleanup` / `"body"` / `"body"` / `2` [OUT]
  4. predict: `tries = 0; begin; tries += 1; raise "flaky" if tries < 3; puts "ok after #{tries}"; rescue; retry; end` → `ok after 3` [OUT]
  5. predict: top: `class OutOfManaError < StandardError; def initialize(msg = "not enough mana") = super; end`; body `begin; raise OutOfManaError; rescue OutOfManaError => e; p e.message, e.class.superclass; end` → `"not enough mana"` / `StandardError` [OUT]
  6. predict: `begin; raise "plain"; rescue => e; p e.class; end` → `RuntimeError` [OUT]
  7. predict: `begin; Integer("x"); rescue TypeError; puts "type"; rescue ArgumentError; puts "arg"; end` → `arg` [OUT]
  8. predict: `begin; [].fetch(3); rescue StandardError; puts "std"; rescue IndexError; puts "index"; end` → `std` (first matching clause wins) [OUT]
  9. predict: top: `def risky = (raise ArgumentError, "bad")` and `def safe_call; risky; rescue ArgumentError => e; "saved: #{e.message}"; end`; body `p safe_call` → `"saved: bad"` [OUT]
  10. predict: `p ZeroDivisionError.superclass, NoMethodError.superclass, KeyError.superclass, FrozenError.superclass` → `StandardError` / `NameError` / `IndexError` / `RuntimeError` [OUT]
  11. predict: `x = Integer("42") rescue 0; y = Integer("zz") rescue 0; p x, y` → `42` / `0` [OUT]
  12. predict: `begin; begin; raise "inner"; rescue => e; raise ArgumentError, "outer"; end; rescue => e2; p e2.message, e2.cause.message; end` → `"outer"` / `"inner"` [OUT]
  13. predict: `r = catch(:found) { [1, 2, 3].each { |a| [4, 5].each { |b| throw :found, [a, b] if a * b == 10 } }; nil }; p r` → `[2, 5]` [OUT]
  14. predict "What happens?": `begin; raise Exception, "low"; rescue => e; puts "caught"; end` → not caught: raises `Exception` (`low`) (bare `rescue` only catches `StandardError`) [RAISE]
  15. predict: `begin; raise ArgumentError; rescue => e; p e.message; end` → `"ArgumentError"` [OUT]
  16. predict "What happens?": top: `class OutOfMana < StandardError; end` and `class Mage; def cast = raise(OutOfMana, "need 5 mana"); end`; body `puts "casting"; Mage.new.cast` → prints `casting`, then stderr `...in 'Mage#cast': need 5 mana (OutOfMana)` [RAISE]
  17. order: `begin` → `risky_call` → `rescue ArgumentError => e` → `else` → `ensure` → `end` [DOC: exceptions syntax]
- **Run**: starter
  ```ruby
  def parse_level(text)
    Integer(text)
  end
  levels = ["3", "x", "5"].map { |t| parse_level(t) }
  puts "levels: #{levels}"
  ```
  → raises `ArgumentError` (`invalid value for Integer(): "x"`). Solution: add
  `rescue ArgumentError` / `0` to the method body (or `Integer(text) rescue 0`). `expect`:
  `levels: [3, 0, 5]`. [RAISE → OUT]

### 4.2 `dynamic-dispatch`, "The Monkey Imp's tricks"

- **Concept**: calling by name: `send` (ignores visibility) vs `public_send` (respects it);
  `method_missing` to answer unknown messages (always call `super` for the rest, and define
  `respond_to_missing?` so `respond_to?` stays honest); `define_method` (its block is a closure,
  unlike `def`, which is a scope gate); `instance_variable_get`/`set`; `instance_eval`,
  `class_eval`; open classes and monkey patching (global, risky); refinements
  (`refine` + `using`, lexically scoped); class macros (a class method that defines methods,
  like `attr_accessor`); `then` vs `tap`; Ruby 3 keyword separation (a Hash is not keywords).
- **Visual**: `ruby/monkey-imp` catches messages nobody answers (`method_missing`) and scribbles
  new moves on a class's banner (monkey patching). A refinement is a pair of glasses: the new
  move is visible only to whoever wears them (`using`).
- **Questions**:
  1. predict "What happens?": top: `class Safe; def open = "open"; private def code = 1234; end`; body `s = Safe.new; p s.send(:open), s.send(:code), s.public_send(:open); s.public_send(:code)` → `"open"` / `1234` / `"open"`, then raises `NoMethodError` (`private method 'code' called for an instance of Safe`) [RAISE]
  2. predict: `p 5.send(:+, 3), [1, 2].send(:map) { _1 * 3 }` → `8` / `[3, 6]` [OUT]
  3. predict "What happens?": top:
     ```ruby
     class Ghost
       def method_missing(name, *args)
         if name.to_s.start_with?("say_") then "Ghost says #{name.to_s.delete_prefix('say_')}" else super end
       end
       def respond_to_missing?(name, include_private = false) = name.to_s.start_with?("say_") || super
     end
     ```
     body `g = Ghost.new; p g.say_boo, g.respond_to?(:say_hi), g.respond_to?(:fly); g.fly` → `"Ghost says boo"` / `true` / `false`, then raises `NoMethodError` (`undefined method 'fly' for an instance of Ghost`) [RAISE]
  4. predict: top: `class Potion; %w[red blue green].each { |color| define_method("#{color}?") { @color == color } }; def initialize(c) = @color = c; end`; body `pt = Potion.new("blue"); p pt.red?, pt.blue?, Potion.instance_methods(false).sort` → `false` / `true` / `[:blue?, :green?, :red?]` [OUT]
  5. predict: top: `class Spy; def initialize = @secret = 42; end`; body `s = Spy.new; p s.instance_variable_get(:@secret); s.instance_variable_set(:@secret, 7); p s.instance_variable_get(:@secret)` → `42` / `7` [OUT]
  6. predict: `class String; def shout = upcase + "!"; end; class Integer; def minutes = self * 60; end; p "hey".shout, 5.minutes` → `"HEY!"` / `300` [OUT]
  7. predict: top: `module Exclaim; refine String do; def whisper = downcase + "..."; end; end`; body `p "ABC".respond_to?(:whisper); using Exclaim; p "HEY".whisper` → `false` / `"hey..."` (`using` at the top level of the file) [OUT]
  8. predict: top: `class Meta; def self.attr_with_default(name, default); define_method(name) { instance_variable_get("@#{name}") || default }; define_method("#{name}=") { |v| instance_variable_set("@#{name}", v) }; end; attr_with_default :level, 1; end`; body `m = Meta.new; p m.level; m.level = 5; p m.level` → `1` / `5` [OUT]
  9. predict: `x = 10; adder = Class.new { define_method(:add) { |n| n + x } }; p adder.new.add(1)` → `11` (closure); with `def add(n) = n + x` instead it raises `NameError` (`undefined local variable or method 'x'`; the message also contains an anonymous class address, so check only the class) [OUT] [RAISE]
  10. predict: `o = Object.new; o.instance_eval { @x = 9 }; p o.instance_variable_get(:@x); String.class_eval { def yell = upcase }; p "a".yell` → `9` / `"A"` [OUT]
  11. predict: `p 5.then { _1 + 1 }, 5.tap { |x| x + 100 }` → `6` / `5` [OUT]
  12. predict "What happens?": top: `def kws(**kw) = kw`; body `kws({a: 1})` → raises `ArgumentError` (`wrong number of arguments (given 1, expected 0)`: Ruby 3 does not turn a Hash into keywords); `kws(**{a: 1})` returns `{a: 1}` [RAISE]
  13. predict: top: `def both(a, k: 1) = [a, k]`; body `p both({k: 2})` → `[{k: 2}, 1]` [OUT]
- **Run**: starter
  ```ruby
  class Spellbook
    def method_missing(name, *args)
      if name.to_s.start_with?("cast_")
        "casting #{name.to_s.delete_prefix("cast_")}"
      else
        super
      end
    end
  end
  book = Spellbook.new
  puts book.respond_to?(:cast_fire) ? book.cast_fire : "unknown spell"
  ```
  prints `unknown spell`. Solution: add
  `def respond_to_missing?(name, include_private = false) = name.to_s.start_with?("cast_") || super`.
  `expect`: `casting fire`. [OUT → OUT]

### 4.3 `pattern-matching`, "Reading the runes"

- **Concept**: `case value` / `in pattern` (newline after the subject!), value patterns
  (`Integer`, ranges, literals use `===`), array patterns (`[x]`, `[first, *rest]`), find pattern
  (`[*, Integer => n, *]`), hash patterns (`{type: :potion, hp:}`; extra keys allowed, `**nil`
  forbids them, `**rest` collects them), alternatives `|`, guards `if`, binding `=> name`, pin
  `^var`, a bare name always matches and **rebinds** it; no match raises `NoMatchingPatternError`
  (unless there is an `else`); `expr in pattern` returns a boolean, `expr => pattern` raises on
  failure; `deconstruct`/`deconstruct_keys` make your own classes matchable; `Data` and `Struct`
  support it.
- **Visual**: runes carved on a gate; the hero holds up an item, and the first rune whose shape
  fits lights up (`banner`). Unmatched items make the gate `shake` with
  `NoMatchingPatternError`. Bindings appear as new `tag`s on the item's parts.
- **Questions**:
  1. predict: top:
     ```ruby
     def kind(v)
       case v
       in Integer => n if n > 100 then "big #{n}"
       in Integer | Float then "number"
       in String then "text"
       in [] then "empty list"
       in [x] then "one: #{x}"
       in [first, *rest] then "first #{first}, #{rest.size} more"
       in {type: :potion, hp:} then "potion +#{hp}"
       in nil then "nothing"
       end
     end
     ```
     body `p kind(500), kind(2.5), kind([]), kind([7]), kind([1, 2, 3]), kind({type: :potion, hp: 20, rare: true}), kind(nil)` → `"big 500"` / `"number"` / `"empty list"` / `"one: 7"` / `"first 1, 2 more"` / `"potion +20"` / `"nothing"` [OUT]
  2. predict "What happens?": same `kind`, `kind(:sym)` → raises `NoMatchingPatternError` (message `sym`) [RAISE]
  3. predict:
     ```ruby
     config = {db: {user: "admin", port: 5432}}
     case config
     in {db: {user: String => user, port: Integer => port}} then p [user, port]
     end
     ```
     → `["admin", 5432]` [OUT]
  4. predict:
     ```ruby
     expected = 5
     case 6
     in ^expected then puts "pinned"
     else puts "else branch"
     end
     ```
     → `else branch` [OUT]
  5. predict: `r1 = (1 in Integer); r2 = ({a: 1} in {a: String}); p r1, r2` → `true` / `false` [OUT]
  6. predict: `h = {name: "Rubi", lv: 3}; h => {name:}; p name` → `"Rubi"` [OUT]
  7. predict "What happens?": `[1, 2] => [a, b, c]` → raises `NoMatchingPatternError` (`[1, 2]: [1, 2] length mismatch (given 2, expected 3)`) [RAISE]
  8. predict:
     ```ruby
     case ["x", 42, "y"]
     in [*, Integer => n, *] then p n
     end
     ```
     → `42` (find pattern) [OUT]
  9. predict: top: `class Pt; attr_reader :x, :y; def initialize(x, y) = (@x, @y = x, y); def deconstruct = [x, y]; def deconstruct_keys(keys) = {x:, y:}; end`; body
     ```ruby
     case Pt.new(3, 4)
     in [a, b] then p a * b
     end
     case Pt.new(0, 9)
     in Pt(x: 0) then puts "on axis"
     end
     ```
     → `12` / `on axis` [OUT]
  10. predict:
      ```ruby
      x = 99
      case 5
      in x then p x
      end
      p x
      ```
      → `5` / `5` (a bare name binds; use `^x` to compare) [OUT]
  11. predict:
      ```ruby
      case {status: "ok", extra: 1}
      in {status: "ok", **nil} then p 1
      else p 2
      end
      ```
      → `2` (`**nil` forbids extra keys) [OUT]
  12. predict: `val = [1, "a"]` and `r = case val` / `in [Integer, String] | [String, Integer] then "mixed"` / `end`; `p r` → `"mixed"` [OUT]
  13. predict "Is this valid Ruby?": `case config in {db: String} then p 1 end` (all on one line) → No: ``expected a `when` or `in` clause after `case` `` (SyntaxError) [SYNTAX]
- **Run**: starter
  ```ruby
  def use(item)
    case item
    in {type: :sword, power:}
      "sword hits #{power}"
    in {type: :shield}
      "shield up"
    end
  end
  puts use({type: :sword, power: 7})
  puts use({type: :potion, hp: 20})
  ```
  prints `sword hits 7`, then raises `NoMatchingPatternError` (`{type: :potion, hp: 20}`).
  Solution: add `in {type: :potion, hp:}` / `"potion heals #{hp}"`. `expect`:
  `potion heals 20`. [RAISE → OUT]

### 4.4 `threads-and-ractors`, "Many hands, one key"

- **Concept**: `Thread.new { }`, `join`, `value` (the block's result); an exception inside a
  thread is re-raised by `join`/`value` (set `Thread.report_on_exception = false` to avoid the
  stderr report); CRuby's **GVL** (global VM lock) lets only one thread run Ruby code at a time,
  so threads help with I/O, not CPU-bound work; data races are still possible (`+=` is not
  atomic in principle), so protect shared state with `Mutex#synchronize`; `Mutex` is not
  reentrant (`ThreadError: deadlock; recursive locking`); `Queue` for producer/consumer; popping
  an empty queue with no other live thread is a fatal deadlock; `Fiber` (cooperative);
  `Ractor` (experimental, parallel, isolated objects; prints a warning); GC is automatic
  (generational, incremental mark-and-sweep; `GC.start`, `GC.count`, `GC.stat`).
- **Visual**: each thread is an ally that `enter`s; the GVL is a single `key` passed around:
  only the ally holding it moves. A `Mutex` is a second, local key on a treasure chest. A Ractor
  is an ally in its own glass room who can only receive items through a slot (copied or moved).
- **Questions**:
  1. predict: `th = Thread.new { 2 + 3 }; p th.value` → `5` [OUT]
  2. predict: `results = []; m = Mutex.new; ths = 5.times.map { |i| Thread.new { m.synchronize { results << i } } }; ths.each(&:join); p results.sort` → `[0, 1, 2, 3, 4]` (sorted: thread order is not deterministic) [OUT]
  3. predict: `q = Queue.new; producer = Thread.new { 3.times { q << _1 }; q << :done }; out = []; while (v = q.pop) != :done; out << v; end; producer.join; p out` → `[0, 1, 2]` [OUT]
  4. predict: `Thread.report_on_exception = false; th = Thread.new { raise ArgumentError, "in thread" }; begin; th.join; rescue => e; p e.class, e.message; end` → `ArgumentError` / `"in thread"` [OUT]
  5. predict "What happens?": `m = Mutex.new; m.synchronize { m.synchronize { } }` → raises `ThreadError` (`deadlock; recursive locking`) [RAISE]
  6. predict "What happens?": `q = Queue.new; puts "waiting"; q.pop` → prints `waiting`, then stderr `No live threads left. Deadlock? (fatal)` (the rest of stderr contains thread addresses: check only that substring) [RAISE]
  7. predict: `f = Fiber.new { Fiber.yield 1; Fiber.yield 2; 3 }; p f.resume, f.resume, f.resume` → `1` / `2` / `3` [OUT]
  8. predict: `r = Ractor.new { 1 + 2 }; p r.take` → stdout `3` (stderr also has `warning: Ractor is experimental...`; `take` is the 3.4 API) [OUT]
  9. pick [DOC]: "In CRuby, two threads doing pure Ruby computation run..." options `one at a time (GVL)` / `truly in parallel on two cores` / `only if you use Fiber` → `one at a time (GVL)` (I/O and `sleep` release the lock)
  10. pick [DOC]: "Ten threads each run `1000.times { c += 1 }` on a shared `c` without a lock. Safe to assume `c == 10000`?" options `No, protect it with a Mutex` / `Yes, the GVL makes += atomic` → `No, protect it with a Mutex` (it printed `10000` on the runner, but that is luck and timing, never a `predict`)
  11. predict: `p Thread.current.class, Thread.main == Thread.current, GC.count.class` → `Thread` / `true` / `Integer` [OUT]
  12. pick [DOC]: "Which runs Ruby code in parallel with isolated objects?" options `Ractor` / `Fiber` / `Thread` → `Ractor`
- **Run**: starter
  ```ruby
  lock = Mutex.new
  total = 0
  add = ->(n) { lock.synchronize { total += n } }
  lock.synchronize { add.(5) }
  puts "total: #{total}"
  ```
  → raises `ThreadError` (`deadlock; recursive locking`). Solution: call `add.(5)` without the
  outer `synchronize`. `expect`: `total: 5`. [RAISE → OUT]

  Do **not** build a run beat around a racy counter or an unjoined thread: the output is not
  deterministic and can even be right by luck.

### Boss: `tower-boss`, "The Monkey Imp" (enemy `ruby/monkey-imp`)

1. predict: `h = {"a" => 1}; p h.transform_keys(&:to_sym), {a: nil}.compact` → `{a: 1}` / `{}` [OUT]
2. predict: `case {status: "ok"}` / `in {status: "ok", **rest} then p rest` / `end` → `{}` [OUT]
3. predict: `D = Data.define(:w, :h); case D.new(w: 2, h: 3)` / `in {w:, h:} then p w * h` / `end` → `6` [OUT]
4. predict: `str = "x"; 3.times { str += "y" }; p str` → `"xyyy"` [OUT]
5. predict: top: `def fib(n) = (@memo ||= {})[n] ||= n < 2 ? n : fib(n - 1) + fib(n - 2)`; body `p fib(50)` → `12586269025` [OUT]
6. Reuse: 4.1 Q3, 4.1 Q14, 4.2 Q3, 4.3 Q10, 4.4 Q5.

---

## Entry exams

Format follows `content/rust/exams.ts`: exam questions are `pick`/`predict`/`type`/`order` beats
tagged with a topic; the engine draws round-robin across topics.

### Topic ids

| Topic id | Name (en) | Region link |
|---|---|---|
| `basics` | Objects, variables and output | `object-village` |
| `strings` | Strings, symbols and numbers | `object-village` |
| `control` | Truthiness and control flow | `object-village` |
| `methods` | Methods and arguments | `object-village` |
| `arrays` | Arrays | `enumerable-forest` |
| `hashes` | Hashes and ranges | `enumerable-forest` |
| `blocks` | Blocks, procs and lambdas | `enumerable-forest` |
| `enumerable` | Enumerable | `enumerable-forest` |
| `classes` | Classes, visibility and class-level state | `module-castle` |
| `modules` | Modules, mixins and method lookup | `module-castle` |
| `equality` | Equality, copies and freezing | `module-castle` |
| `exceptions` | Exceptions | `meta-tower` |
| `metaprogramming` | Metaprogramming | `meta-tower` |
| `pattern_matching` | Pattern matching | `meta-tower` |
| `concurrency` | Threads, GVL and Ractors | `meta-tower` |
| `testing` | Testing (Minitest, RSpec) | (none yet) |
| `tooling` | Gems, Bundler and loading code | (none yet) |
| `runtime` | GC, memory and performance | (none yet) |

A region is skipped when all its topics are passed: junior can skip `object-village` and most of
`enumerable-forest` (`enumerable` is in mid); mid covers `enumerable-forest` and `module-castle`;
senior covers `meta-tower`.

### Bank sizes

| Exam | Draws / bank | Pass | s/question | Topics in the bank (count) | Suggested kinds |
|---|---|---|---|---|---|
| `junior`, Junior Ruby Developer | 12 / 22 | 70% | 30 | basics 3, strings 4, control 3, methods 4, arrays 3, hashes 3, blocks 2 | predict 14, pick 5, type 2, order 1 |
| `mid`, Mid-level Ruby Developer | 14 / 24 | 70% | 40 | hashes 2, blocks 3, enumerable 4, classes 4, modules 4, equality 2, exceptions 3, testing 2 | predict 15, pick 6, type 2, order 1 |
| `senior`, Senior Ruby Developer | 15 / 26 | 75% | 50 | blocks 2, modules 3, equality 2, exceptions 2, metaprogramming 5, pattern_matching 3, concurrency 4, runtime 3, tooling 2 | predict 16, pick 8, type 1, order 1 |

The lesson questions above are a large pool for the banks (exam questions should be new
wording or new snippets, not copies of lesson beats, so the exam is not a memory test).

### Junior example questions (all verified)

1. [`basics`] predict: `p 1.class, nil.to_a, nil.to_s.empty?` → `Integer` / `[]` / `true`
2. [`basics`] predict: `x = 3; y = x; y += 1; p x, y` → `3` / `4`
3. [`strings`] predict: `puts -7 / 2, 7 % 3` → `-4` / `1`
4. [`strings`] predict: `s = "a"; s.concat("b", "c"); puts s` → `abc`
5. [`strings`] predict: `puts "%05.2f" % 3.14159; puts format("%-3s|", "x")` → `03.14` / `x  |`
6. [`strings`] pick: "Which is the same object every time it appears?" options `:name` / `"name"` / `'name'` → `:name` (verified: `:a.equal?(:a)` is `true`, `"a".equal?("a")` is `false`)
7. [`control`] predict: `zero = 0; puts(zero ? "truthy" : "falsy")` → `truthy`
8. [`control`] predict: `a = nil; p a&.length, a.to_s.length` → `nil` / `0`
9. [`methods`] predict "What happens?": `def greet(name = "hero") = "Hi, #{name}"; greet("a", "b")` → `ArgumentError` (`wrong number of arguments (given 2, expected 0..1)`)
10. [`methods`] predict: `def kw(a:, b: a * 2) = [a, b]; p kw(a: 1)` → `[1, 2]`
11. [`arrays`] predict: `p [3, 1, 2].sort.reverse, [1, 2, 3].include?(2), [1, 2, 3].first(10)` → `[3, 2, 1]` / `true` / `[1, 2, 3]`
12. [`hashes`] predict: `h = {x: 1}; h.default = 7; p h[:y]; h2 = Hash.new(5); p h2.fetch(:q, :none)` → `7` / `:none`
13. [`hashes`] predict: `h = {a: 1}; h.delete(:a); p h, h.empty?, h.delete(:zz)` → `{}` / `true` / `nil`
14. [`blocks`] predict: `[1, 2, 3].each_with_index { |x, i| print "#{i}:#{x} " }; puts` → `0:1 1:2 2:3 ` (trailing space)
15. [`blocks`] type: `def wrap; "<" + ___ + ">"; end; puts wrap { "gem" }` printing `<gem>` → `yield`

### Mid example questions (all verified)

1. [`hashes`] predict: `h = Hash.new([]); h[:a] << 1; p h.size, h[:b]` → `0` / `[1]`
2. [`blocks`] predict: `p proc { |a, b| }.arity, ->(a, b) {}.arity, proc { |a, b| [a, b] }.call(1)` → `2` / `2` / `[1, nil]`
3. [`blocks`] predict: `add = ->(a, b, c) { a + b + c }; p add.curry[1][2][3]` → `6`
4. [`enumerable`] predict: `p [1, 2, 3].each_with_index.map { |x, i| x * i }, %w[a b c].each_with_index.to_h` → `[0, 2, 6]` / `{"a" => 0, "b" => 1, "c" => 2}`
5. [`enumerable`] predict: `p [1, 2, 3, 4].chunk_while { |a, b| b == a + 1 }.to_a, [5, 3, 8].minmax` → `[[1, 2, 3, 4]]` / `[3, 8]`
6. [`classes`] predict: `class Counter; @@count = 0; def self.count = @@count; def initialize = @@count += 1; end; class Sub < Counter; end; Counter.new; Sub.new; p Sub.count` → `2` (`@@count` is shared with the subclass)
7. [`classes`] predict "What happens?": calling a `private` method with an explicit receiver `Vault.new.secret` → `NoMethodError` (`private method 'secret' called for an instance of Vault`)
8. [`modules`] predict: `LoudBot` (`include Greet; prepend Loud`) `.ancestors.take(4)` → `[Loud, LoudBot, Greet, Object]`
9. [`modules`] pick: "`extend Util` in a class makes Util's instance methods available as..." options `class methods` / `instance methods` / `constants` → `class methods` (verified: `Ext.helper` works, `Ext.new.helper` raises `NoMethodError`)
10. [`equality`] predict: `p [1, 2].eql?([1, 2]), [1, 2].equal?([1, 2]), 1.hash == 1.0.hash` → `true` / `false` / `false`
11. [`exceptions`] predict: `def m3; return 1; ensure; return 2; end; p m3` → `2`
12. [`exceptions`] predict: `begin; nil.upcase; rescue NoMethodError => e; p e.message, e.name; end` → `"undefined method 'upcase' for nil"` / `:upcase`
13. [`exceptions`] order: `begin` / `raise "boom"` / `rescue => e` / `puts e.message` / `ensure` / `puts "done"` / `end` → that order, prints `boom` / `done`
14. [`testing`] predict [TEST]:
    ```ruby
    require "minitest/autorun"
    def abs_bad(x) = x < 0 ? x : x
    class AbsTest < Minitest::Test
      def test_negative
        assert_equal 3, abs_bad(-3)
      end
    end
    ```
    "Which lines appear in the report?" → `Expected: 3` / `  Actual: -3` (and `1 runs, 1 assertions, 1 failures, 0 errors, 0 skips`)
15. [`testing`] pick: `err = ___(KeyError) { {}.fetch(:k) }` checks that the block raises → `assert_raises` (verified passing test: `1 runs, 3 assertions, 0 failures`)

### Senior example questions (all verified unless marked [DOC])

1. [`blocks`] predict: top: `def run_proc; pr = Proc.new { return 10 }; pr.call; 20; end`; `p run_proc` → `10`
2. [`modules`] predict: `class Multi2; include M1; include M2; include M1; end; p Multi2.new.who` → `"M2"`
3. [`modules`] predict: `p "str".singleton_class.ancestors[1], Comparable.instance_of?(Module)` → `String` / `true` (the singleton class itself prints with an address: do not print it)
4. [`equality`] predict: `{Card.new(1) => :a}.key?(Card.new(1))` with only `==` defined → `false`; with `eql?` + `hash` → `true`
5. [`exceptions`] predict: nested raise with `cause` → `"outer"` / `"inner"`
6. [`metaprogramming`] predict: `respond_to?` with and without `respond_to_missing?` (run 4.2) → `unknown spell` vs `casting fire`
7. [`metaprogramming`] predict "What happens?": `def kws(**kw) = kw; kws({a: 1})` → `ArgumentError` (`wrong number of arguments (given 1, expected 0)`)
8. [`metaprogramming`] pick: "Which call respects `private`?" options `public_send` / `send` / `__send__` → `public_send`
9. [`metaprogramming`] predict: refinement visible only after `using` → `false` / `"hey..."`
10. [`pattern_matching`] predict: `x = 99; case 5; in x then p x; end` → `5` (and `x` is now `5`)
11. [`pattern_matching`] predict "What happens?": `[1, 2] => [a, b, c]` → `NoMatchingPatternError`
12. [`pattern_matching`] predict: `case {status: "ok", extra: 1}` / `in {status: "ok", **nil}` → falls to `else` (`2`)
13. [`concurrency`] predict "What happens?": recursive `Mutex#synchronize` → `ThreadError` (`deadlock; recursive locking`)
14. [`concurrency`] predict: exception raised in a thread, rescued around `th.join` → `ArgumentError` / `"in thread"`
15. [`concurrency`] pick [DOC]: GVL: CPU-bound Ruby threads in CRuby run one at a time; I/O releases the lock
16. [`runtime`] predict: `p [1, 2, 3].lazy.map { puts "map #{_1}"; _1 * 2 }.first(1)` → `map 1` / `[2]` (laziness avoids work)
17. [`runtime`] predict: `p nil.to_s.frozen?, 1.to_s.frozen?, :a.to_s.frozen?` → `true` / `false` / `false`
18. [`runtime`] pick [DOC]: "`# frozen_string_literal: true` mainly helps by..." options `reusing literal strings instead of allocating new ones` / `making every object immutable` / `speeding up Integer math` → the first (https://bugs.ruby-lang.org/issues/20205)
19. [`runtime`] pick [DOC]: "CRuby's garbage collector is..." options `generational, incremental mark-and-sweep` / `reference counting only` / `manual (free)` → the first (https://docs.ruby-lang.org/en/3.4/GC.html)
20. [`tooling`] pick [DOC]: "`require` vs `load`?" options `require loads a file once; load runs it every time` / `they are identical` / `load only works for gems` → the first
21. [`tooling`] pick [DOC]: "Which file pins the exact gem versions of a Bundler project?" options `Gemfile.lock` / `Gemfile` / `.gemspec` → `Gemfile.lock` (https://bundler.io/guides/rationale.html)
22. [`tooling`] predict: `require "json"; puts JSON.generate({a: [1, nil]})` → `{"a":[1,null]}` (stdlib, no gem needed)

Extra verified gotchas usable at any level:

- `p 10.divmod(-3), -7.remainder(2)` → `[-4, -2]` / `-1` (`divmod` floors, `remainder` truncates)
- `p "snake_case_word".split("_").map.with_index { |w, i| i.zero? ? w : w.capitalize }.join` → `"snakeCaseWord"`
- `p 10.clamp(1, 5), 7.digits, 255.to_s(16), "3.7abc".to_f, Float("1.")` → `5` / `[7]` / `"ff"` / `3.7` / `1.0` (`Float("1.")` is new in 3.4)
- `p Array(nil), Array([1]), [*1..3, *[4]]` → `[]` / `[1]` / `[1, 2, 3, 4]`
- `p "a1b22".scan(/\d+/), "hello" =~ /ll/` → `["1", "22"]` / `2`
- `p [1, 2, 3].sum / 2, [1, 2, 3].sum.fdiv(2)` style averages: Integer `/` truncates (see 1.2 run)
- `it = 5; p it` → `5` (outside a block `it` is a normal local variable)
- `p :upcase.to_proc.call("a"), [3, 1].method(:sort).owner` → `"A"` / `Array`

### Things to avoid in Ruby questions

- Printing default `inspect`/`to_s` of objects or classes created with `Class.new`
  (`#<Hero:0x...>`, `#<Class:0x...>`), `object_id` values, thread reports, Minitest seeds and
  timings.
- Thread-scheduling-dependent output (racy counters, unjoined threads, unsorted results).
- `p` on non-ASCII strings (US-ASCII external encoding on the runner).
- One-line `case x in pattern then ... end` (syntax error; see conventions).
- String literals directly in conditions (`if "x"`): Prism prints `warning: string literal in
  condition` on stderr.
- Claims about chilled-string warnings: Ruby 3.4 only warns with `-W:deprecated`, and the runner
  passes no flags, so mutating a literal without the magic comment silently works.
- Float rounding at binary boundaries (`2.675.round(2)`), and `Ractor` beyond trivial examples
  (experimental; the API changes after 3.4: `take` becomes `value`).
- RSpec or any gem (`require "rspec"` raises `LoadError`); Minitest, `json`, `set` and `prime`
  are available.
