# Python planet: proposed curriculum

Curriculum for the **Python planet** (pack `python`): 4 regions in learning order, each with 3-4 lessons plus a
boss, followed by the entry exams. It is written for a learner who may know nothing about programming, and it
follows what companies actually assess (see [python-hiring-assessments.md](python-hiring-assessments.md)). Content
authors turn this into a language pack following [../content-model.md](../content-model.md),
[../authoring-lessons.md](../authoring-lessons.md) and [../exams.md](../exams.md).

## Conventions used in this file

### Verification tags

| Tag | Meaning | How it was checked |
|---|---|---|
| `[R]` | Exact stdout | Snippet run as a script with CPython 3.14.7 and 3.13.12 (identical stdout); multi-line output is shown with ` / ` between lines |
| `[E]` | Raises an exception; the answer is the **exception class name** | Same runs; last traceback line checked. Ask for the class, not the message (messages differ between versions) |
| `[R+E]` | Prints something, then raises | The printed part and the exception class are both given |
| `[C]` | Concept, no executed output (GIL, threads, processes) | Anchored to the docs/PEP cited; never wire as a `run` or output `predict` |

All `[R]` / `[E]` answers in this file were checked on 2026-10-06. Authors should still wire each into `check` so
`content:verify` keeps them honest.

### Runner assumptions (verified by the coordinator)

- Engine: **Pyodide 314.0.7 = CPython 3.14** (WebAssembly), in the browser and in Node for verification. Code runs as
  a single file `main.py`; stdout is captured. An uncaught exception prints a standard traceback ending in the
  exception line, e.g. `KeyError: 'k'`.
- No network, no `input()`. `time.sleep` works. `asyncio.run(main())` works; top-level `await` does **not**.
- `threading.Thread(...).start()` fails with `RuntimeError: can't start new thread`: no runnable threading,
  `ThreadPoolExecutor`, `run_in_executor` or `multiprocessing` beats. GIL / threads / processes are `[C]` only.
- Determinism: dict order is insertion order (safe to print). **Set order is not guaranteed: always print
  `sorted(s)`.** Do not print `id()` values, object default reprs (`<... at 0x...>`) or timings.
- Avoid: `return` inside `finally` (3.14 `SyntaxWarning`, PEP 765), inspecting `__annotations__` (3.14 deferred
  annotations), `is` on numbers/strings (small-int cache and interning are implementation details).
- `run` beats: `expect` is a stdout **substring** that the broken starter cannot print (each was checked).
- Warnings go to stderr (e.g. `RuntimeWarning: coroutine ... was never awaited`) and are not part of stdout.

### Question kinds

`pick` (one `___`, 2-4 options), `predict` (exact output, or the exception name), `type` (exact token for `___`),
`order` (lines into correct order), `run` (broken starter → expected stdout). Code at most 12 lines.

### Visual vocabulary (existing stage effects)

The stage understands: `tag` (label above an actor = a name), `value` (chip next to the label), `item` (sword,
potion, gem, shield, scroll, key), `give`, `clone`, `lend`, `drop`, `dead`, `say`, `print`, `shake`, `banner`,
`enter`/`exit`, `attack`/`hp`, `wait`. Python mapping:

| Code idea | On stage |
|---|---|
| Name (variable) | `tag` above an actor. Python names are **labels stuck on objects**, not boxes |
| Immutable value (int, float, str, tuple, None) | `value` chip; "changing" it makes a **new** chip, the old one stays for other tags |
| Mutable object (list, dict, set, instance) | An `item`: scroll = list, gem = dict, shield = set, potion = instance, key = function |
| Two names on one object (`b = a`) | Both actors tagged, `lend` shows the ghost going and **not** coming back: they share it |
| `a[:]`, `list(a)`, `copy.copy` / `copy.deepcopy` | `clone` with `banner` "SHALLOW" (inner items still shared) or "DEEP" |
| Exception | `shake` + `banner` with the exception class (`KeyError`) |
| `print()` | `print` (console line) |
| Function call | Hero hands the key (function) the arguments with `give`; the return value comes back as a chip |
| Closure | The key carries a little scroll (captured variable) in a backpack |
| Decorator | Ally wraps the key in a shield: calls go through the ally first (`say` "before"/"after") |
| Generator | An enemy that `wait`s after each `yield`, handing one item per `next()` |
| Context manager | A door: `enter` runs `__enter__`, `exit` always runs `__exit__`, even after a `shake` |
| `await` / event loop | hero = event loop; tasks are allies that `wait` (sleep) while another ally acts |

---

## Region overview (learning order)

Values → collections → functions → objects/generators/async. The learner first sees what a name and a value are,
then how objects are shared (the root of most Python gotchas), then functions and scope (closures and decorators
need both), and finally the object model, lazy iteration and asynchronous code.

| # | Region slug | Theme | Big idea | Lessons |
|---|---|---|---|---|
| 1 | `name-village` | village | Names, values, types, numbers, strings, truth and identity | 3 + boss |
| 2 | `collection-forest` | forest | list/tuple/dict/set, shared references and copies, comprehensions, sorting, `collections` | 4 + boss |
| 3 | `function-peaks` | mountain | Functions and arguments, scope and closures, decorators, exceptions | 4 + boss |
| 4 | `object-tower` | tower | Classes, inheritance and dataclasses, generators and context managers, asyncio | 4 + boss |

The `castle` theme is left free for a future region (for example typing and the object model in depth:
descriptors, metaclasses, `Protocol`).

---

## Region 1: `name-village`, Names, values and types

### 1.1 `names-and-values`, "Labels and chips"

- **Concept**: `name = value` sticks a label on a value; reassigning moves the label. Dynamic typing: the **value**
  has a type, the name does not. `print()` with `sep`/`end`; `type()`; `None`; tuple unpacking and swap;
  `NameError`; `str + int` is a `TypeError` (Python does not convert silently); `int()` / `str()` conversions.
- **Visual**: hero gets `tag` `hp` and `value` chip `10`; `hp = hp + 5` makes a new chip `15` and the tag moves.
  `x = "five"` replaces a number chip with a string chip on the same tag (dynamic typing). `print(potion)` before any
  `potion = ...` → the hero looks for the tag, finds nothing, `shake` + banner `NameError`.
- **Questions**:
  1. predict: `hp = 10` / `hp = hp + 5` / `print(hp)` → `15` [R]
  2. predict: `x = 5` / `x = "five"` / `print(type(x).__name__)` → `str` [R]
  3. predict: `print(type(3).__name__, type(3.0).__name__, type("3").__name__, type(True).__name__)` → `int float str bool` [R]
  4. predict: `print("hp:", 10, sep=" ", end="!\n")` → `hp: 10!` [R]
  5. predict "What happens?": `print(potion)` (never assigned) → `NameError` [E]
  6. predict: `a = 1` / `b = a` / `a = 2` / `print(a, b)` → `2 1` (moving `a`'s label does not move `b`) [R]
  7. predict: `a, b = 1, 2` / `a, b = b, a` / `print(a, b)` → `2 1` [R]
  8. predict "What happens?": `print("3" + 3)` → `TypeError` [E]
  9. predict: `print(int("3") + 3, "3" * 3)` → `6 333` [R]
  10. predict: `x = None` / `print(x, type(x).__name__)` → `None NoneType` [R]
- **Run**: starter
  ```python
  gold = "10"
  total = gold + 5
  print("total:", total)
  ```
  raises `TypeError`. Solution: `total = int(gold) + 5`. `expect`: `total: 15`. [R]

### 1.2 `numbers-and-strings`, "Coins and scrolls"

- **Concept**: `int` (arbitrary size) and `float`; `/` always gives a float, `//` floor division, `%`, `**`;
  floor division rounds toward minus infinity; float precision (`0.1 + 0.2`), `math.isclose`; `round()` is
  round-half-to-even. Strings: immutable, indexing, negative indexes, slicing `[start:stop:step]`, `[::-1]`,
  methods (`split`, `join`, `strip`, `upper`), f-strings with format specs.
- **Visual**: hero splits 7 coins between 2 allies: `/` gives a chip `3.5` (half-coin), `//` gives `3` and `%`
  leaves `1` on the floor (`drop`). A string is a scroll you can read letter by letter but not rewrite: trying
  `s[0] = "H"` makes the scroll `shake`.
- **Questions**:
  1. predict: `print(7 / 2, 7 // 2, 7 % 2)` → `3.5 3 1` [R]
  2. predict: `print(-7 // 2, -7 % 2)` → `-4 1` (floor goes toward minus infinity) [R]
  3. predict: `print(2 ** 10, 10 / 5)` → `1024 2.0` [R]
  4. predict: `print(0.1 + 0.2 == 0.3)` → `False` [R]
  5. predict: `print(0.1 + 0.2)` → `0.30000000000000004` [R]
  6. pick: `import math` / `print(math.___(0.1 + 0.2, 0.3))` prints `True`; options `isclose` / `isequal` / `round` → `isclose` [R]
  7. predict: `name = "Ada"` / `lvl = 3` / `print(f"{name} is level {lvl + 1}")` → `Ada is level 4` [R]
  8. predict: `s = "python"` / `print(s[0], s[-1], s[1:4], s[::-1])` → `p n yth nohtyp` [R]
  9. predict "What happens?": `s = "hero"` / `s[0] = "H"` → `TypeError` (strings are immutable) [E]
  10. predict: `print("a,b,c".split(","), "-".join(["x", "y"]), " hi ".strip().upper())` → `['a', 'b', 'c'] x-y HI` [R]
  11. predict: `print(round(2.5), round(3.5))` → `2 4` (round half to even) [R]
  12. predict: `print(f"{3.14159:.2f}|{42:>5}|{7:03d}")` → `3.14|   42|007` (three spaces before 42) [R]
- **Run**: starter
  ```python
  coins = 7
  per_hero = coins / 2
  print(f"each gets {per_hero} coins")
  ```
  prints `each gets 3.5 coins`. Solution: `coins // 2`. `expect`: `gets 3 coins`. [R]

### 1.3 `truth-and-identity`, "Equal or the same?"

- **Concept**: `bool`; falsy values (`0`, `0.0`, `""`, `[]`, `{}`, `set()`, `None`, `False`), everything else is
  truthy (`"0"`, `[0]`, `" "`); `and`/`or` return one of their **operands**, not `True`/`False`; `not`;
  chained comparisons (`1 < x < 10`); `==` (same value) vs `is` (same object); `is None` (PEP 8); `bool` is a
  subclass of `int`; string comparison is lexicographic.
- **Visual**: two allies hold two different scrolls with the same text: `==` → the hero nods (same content), `is`
  → shakes its head (two items). Then the ally takes the hero's own scroll (`c = a`, `lend` without return): `is`
  → nod. Falsy values fade out when passed through `bool(...)`.
- **Questions**:
  1. predict: `print(bool(0), bool(""), bool([]), bool("0"), bool([0]))` → `False False False True True` [R]
  2. predict: `print(repr(0 or "default"), repr("" and "x"), 5 and 7)` → `'default' '' 7` [R]
  3. predict: `print(1 < 2 < 3, 3 > 2 > 1, 1 < 3 > 2)` → `True True True` [R]
  4. predict: `a = [1, 2]` / `b = [1, 2]` / `c = a` / `print(a == b, a is b, a is c)` → `True False True` [R]
  5. pick: `if x ___ None:` (PEP 8 style); options `is` / `==` → `is` [R: `x = None; print(x is None)` → `True`]
  6. predict: `print(True + True, True == 1, 1 == 1.0)` → `2 True True` [R]
  7. predict: `print(not [], not None, not 0.0)` → `True True True` [R]
  8. predict: `lives = 0` / `print(lives or 3)` → `3` (the `or` default trap) [R]
  9. predict: `print("10" < "9", 10 < 9)` → `True False` (strings compare letter by letter) [R]
  10. predict: `print(1 == "1")` → `False` (no implicit conversion) [R]
- **Run**: starter
  ```python
  lives = 0
  if lives is not None and lives:
      print("lives set:", lives)
  else:
      print("no value")
  ```
  prints `no value` (0 is falsy). Solution: `if lives is not None:`. `expect`: `lives set: 0`. [R]

### 1.4 Boss `type-golem` (mode `boss`)

Mixed, timed:
1. predict: `print(type(10 / 2).__name__, 10 / 2)` → `float 5.0` [R]
2. predict: `print("ab"[5])` → `IndexError` [E]
3. predict: `print("ab"[1:5])` → `b` (slices clamp, indexes do not) [R]
4. predict: `print(int("3.5"))` → `ValueError` [E]
5. predict: `print(int(3.9), int(-3.9), float("3.5"))` → `3 -3 3.5` (`int()` truncates toward zero) [R]
6. predict: `print([] or {} or 0 or "last")` → `last` [R]
7. predict: `print(3 * "ab" + "!")` → `ababab!` [R]
8. predict: `x = 5` / `print(1 < x < 10 == 10)` → `True` [R]
9. predict: `print(f"{'hi':*^6}")` → `**hi**` [R]
10. predict: `print(bool(None), bool(" "))` → `False True` [R]

---

## Region 2: `collection-forest`, Collections, references and copies

### 2.1 `lists-and-tuples`, "The scroll and the stone tablet"

- **Concept**: lists are ordered and mutable (`append`, `extend`, `pop`, `sort`); tuples are ordered and immutable;
  `(5)` is just `5`, `(5,)` is a tuple; indexing vs slicing (slices never raise); star unpacking; `list.sort()`
  sorts in place and returns `None`, `sorted()` returns a new list.
- **Visual**: a list is a scroll item (lines can be added: `append` writes a line). A tuple is a stone tablet:
  trying to change it makes it `shake`. `x.sort()` rearranges the hero's own scroll and hands back nothing (empty
  hand chip `None`); `sorted(x)` hands back a `clone`.
- **Questions**:
  1. predict: `bag = ["sword", "potion"]` / `bag.append("gem")` / `print(len(bag), bag[-1])` → `3 gem` [R]
  2. predict: `nums = [10, 20, 30, 40, 50]` / `print(nums[1:3], nums[:2], nums[::2])` → `[20, 30] [10, 20] [10, 30, 50]` [R]
  3. predict "What happens?": `t = (1, 2, 3)` / `t[0] = 9` → `TypeError` [E]
  4. predict: `t = (5)` / `u = (5,)` / `print(type(t).__name__, type(u).__name__)` → `int tuple` [R]
  5. predict: `a, *rest = [1, 2, 3, 4]` / `print(a, rest)` → `1 [2, 3, 4]` [R]
  6. predict: `bag = ["a", "b"]` / `bag.extend("cd")` / `print(bag)` → `['a', 'b', 'c', 'd']` [R]
  7. predict: `x = [3, 1, 2]` / `y = x.sort()` / `print(y, x)` → `None [1, 2, 3]` [R]
  8. predict: `x = [3, 1, 2]` / `print(sorted(x), x)` → `[1, 2, 3] [3, 1, 2]` [R]
  9. predict: `nums = [1, 2, 3]` / `print(nums.pop(), nums, nums[5:])` → `3 [1, 2] []` [R]
  10. predict "What happens?": `nums = [1, 2, 3]` / `print(nums[3])` → `IndexError` [E]
- **Run**: starter
  ```python
  bag = ["sword", "potion", "gem"]
  last = bag[3]
  print("last:", last)
  ```
  raises `IndexError`. Solution: `bag[-1]`. `expect`: `last: gem`. [R]

### 2.2 `dicts-and-sets`, "Gem pouches and shields"

- **Concept**: dicts map keys to values (insertion order kept); `d[k]` raises `KeyError`, `d.get(k, default)` does
  not; `.items()`; keys must be hashable (no lists); `1`, `1.0` and `True` are the same key; `{}` is an empty dict,
  `set()` an empty set; sets remove duplicates and support `&`, `|`, `-`; **set order is not guaranteed**, sort
  before printing.
- **Visual**: a dict is a gem pouch with labelled compartments; asking for a missing compartment → `shake` +
  `KeyError`, `get` → the ally hands back a default chip. A set is a shield with one slot per distinct value:
  duplicates bounce off (`drop`).
- **Questions**:
  1. predict: `hero = {"name": "Ada", "hp": 10}` / `hero["hp"] += 5` / `print(hero["hp"], len(hero))` → `15 2` [R]
  2. predict "What happens?": `hero = {"name": "Ada"}` / `print(hero["mp"])` → `KeyError` [E]
  3. predict: `hero = {"name": "Ada"}` / `print(hero.get("mp"), hero.get("mp", 0))` → `None 0` [R]
  4. predict: `d = {"b": 1, "a": 2}` / `d["c"] = 3` / `print(list(d))` → `['b', 'a', 'c']` (insertion order) [R]
  5. predict: `s = {3, 1, 2, 3, 1}` / `print(len(s), sorted(s))` → `3 [1, 2, 3]` [R]
  6. predict: `a = {1, 2, 3}` / `b = {2, 3, 4}` / `print(sorted(a & b), sorted(a | b), sorted(a - b))` → `[2, 3] [1, 2, 3, 4] [1]` [R]
  7. predict "What happens?": `d = {[1, 2]: "x"}` → `TypeError` (unhashable) [E]
  8. predict: `d = {(1, 2): "x"}` / `print(d[(1, 2)])` → `x` (tuples of hashables are hashable) [R]
  9. predict: `for k, v in {"a": 1, "b": 2}.items(): print(k, v)` → `a 1` / `b 2` [R]
  10. predict: `d = {1: "a", 1.0: "b", True: "c"}` / `print(d)` → `{1: 'c'}` [R]
  11. predict: `e = {}` / `print(type(e).__name__, type(set()).__name__)` → `dict set` [R]
- **Run**: starter
  ```python
  counts = {}
  for w in ["gem", "key", "gem"]:
      counts[w] += 1
  print(counts)
  ```
  raises `KeyError`. Solution: `counts[w] = counts.get(w, 0) + 1`. `expect`: `{'gem': 2, 'key': 1}`. [R]

### 2.3 `shared-references`, "Shared treasure"

- **Concept**: assignment never copies; two names can share one mutable object; functions receive a reference
  to the same object ("call by object reference"): mutating it is visible outside, rebinding the parameter is
  not. `a += [3]` mutates a list in place, `a = a + [3]` makes a new list. `[[0] * 2] * 2` repeats the **same**
  inner list. Shallow copy (`a[:]`, `list(a)`, `copy.copy`) vs `copy.deepcopy`. A tuple can contain a mutable list.
- **Visual**: `b = a` → ally gets a `tag` on the hero's scroll (`lend`, the ghost never returns). `b.append(3)` and
  the hero's scroll grows too. `a[:]` → `clone` banner "SHALLOW": inner gems are still shared (both actors glow when
  one gem changes). `deepcopy` → `clone` banner "DEEP".
- **Questions**:
  1. predict: `a = [1, 2]` / `b = a` / `b.append(3)` / `print(a)` → `[1, 2, 3]` [R]
  2. predict: `a = [1, 2]` / `b = a[:]` / `b.append(3)` / `print(a, b)` → `[1, 2] [1, 2, 3]` [R]
  3. predict: `grid = [[0] * 2] * 2` / `grid[0][0] = 9` / `print(grid)` → `[[9, 0], [9, 0]]` [R]
  4. pick "Fix it so only one row changes": `grid = [[0] * 2 ___]` options `for _ in range(2)` / `* 2` → `for _ in range(2)` (prints `[[9, 0], [0, 0]]`) [R]
  5. predict:
     ```python
     import copy
     a = [[1], [2]]
     s = copy.copy(a)
     d = copy.deepcopy(a)
     a[0].append(9)
     print(s, d)
     ```
     → `[[1, 9], [2]] [[1], [2]]` [R]
  6. predict: `def add(item, bag): bag.append(item)` / `inv = []` / `add("gem", inv)` / `print(inv)` → `['gem']` [R]
  7. predict: `def reset(bag): bag = []` / `inv = ["gem"]` / `reset(inv)` / `print(inv)` → `['gem']` (rebinding a parameter does not touch the caller) [R]
  8. predict: `s = "hp"` / `t = s` / `s += "!"` / `print(s, t)` → `hp! hp` (strings are immutable: `+=` makes a new one) [R]
  9. predict: `a = [1, 2]` / `b = a` / `a += [3]` / `print(b)` → `[1, 2, 3]` [R]
  10. predict: `a = [1, 2]` / `b = a` / `a = a + [3]` / `print(b)` → `[1, 2]` [R]
  11. predict: `t = ([1], 2)` / `t[0].append(3)` / `print(t)` → `([1, 3], 2)` [R]
- **Run**: starter
  ```python
  import copy
  team = [["sword"], ["bow"]]
  backup = copy.copy(team)
  team[0].append("shield")
  print("backup:", backup)
  ```
  prints `backup: [['sword', 'shield'], ['bow']]`. Solution: `copy.deepcopy(team)`. `expect`: `backup: [['sword'], ['bow']]`. [R]

### 2.4 `comprehensions-and-sorting`, "The sorting caravan"

- **Concept**: list / dict / set comprehensions with `if`; nested `for`; generator expressions are lazy and can be
  consumed only once; `sorted(..., key=..., reverse=...)` with `str.lower`, `len`, `lambda`; sorting is stable;
  `zip`, `enumerate`; `collections.Counter`, `defaultdict`, `deque(maxlen=...)`; `max(..., key=...)`.
- **Visual**: a caravan of item chips passes a gate (the `if` filter drops some), each is transformed (`clone` +
  new chip). A generator is an ally carrying items one at a time: after the last one, the second trip finds the
  cart empty.
- **Questions**:
  1. predict: `print([n * n for n in range(5)])` → `[0, 1, 4, 9, 16]` [R]
  2. predict: `print([n for n in range(10) if n % 3 == 0])` → `[0, 3, 6, 9]` [R]
  3. predict: `print({w: len(w) for w in ["gem", "sword"]})` → `{'gem': 3, 'sword': 5}` [R]
  4. predict: `g = (n * 2 for n in range(3))` / `print(sum(g), sum(g))` → `6 0` (exhausted) [R]
  5. predict: `names = ["bob", "Cy", "al"]` / `print(sorted(names), sorted(names, key=str.lower))` → `['Cy', 'al', 'bob'] ['al', 'bob', 'Cy']` (uppercase sorts first) [R]
  6. predict: `heroes = [("ada", 3), ("bo", 5), ("cy", 3)]` / `print(sorted(heroes, key=lambda h: h[1], reverse=True))` → `[('bo', 5), ('ada', 3), ('cy', 3)]` (stable: ada before cy) [R]
  7. predict: `print(list(zip("ab", [1, 2, 3])), list(enumerate("xy", start=1)))` → `[('a', 1), ('b', 2)] [(1, 'x'), (2, 'y')]` [R]
  8. predict: `print([(x, y) for x in range(2) for y in "ab"])` → `[(0, 'a'), (0, 'b'), (1, 'a'), (1, 'b')]` [R]
  9. predict: `from collections import Counter` / `c = Counter("banana")` / `print(c.most_common(2), c["z"])` → `[('a', 3), ('n', 2)] 0` [R]
  10. predict: `from collections import defaultdict` / `d = defaultdict(list)` / `d["gems"].append(1)` / `print(dict(d), len(d))` → `{'gems': [1]} 1` [R]
  11. predict: `from collections import deque` / `q = deque([1, 2, 3], maxlen=3)` / `q.append(4)` / `q.appendleft(0)` / `print(list(q))` → `[0, 2, 3]` [R]
  12. predict: `print(max(["bb", "a", "ccc"], key=len), min(3, 1, 2))` → `ccc 1` [R]
- **Run**: starter
  ```python
  scores = {"ada": 3, "bo": 9, "cy": 5}
  top = sorted(scores)
  print("ranking:", top)
  ```
  prints `ranking: ['ada', 'bo', 'cy']`. Solution: `sorted(scores, key=scores.get, reverse=True)`. `expect`: `ranking: ['bo', 'cy', 'ada']`. [R]

### 2.5 Boss `alias-hydra` (mode `boss`)

1. predict: `x = [1, 2, 3]` / `for n in x:` / `    if n == 2: x.remove(n)` / `print(x)` → `[1, 3]` [R]
2. predict: same loop with `x = [1, 2, 2, 3]` → `[1, 2, 3]` (removing while iterating skips items) [R]
3. predict "What happens?": `d = {"a": 1}` / `for k in d: d["b"] = 2` → `RuntimeError` [E]
4. predict: `print([1, 2, 3][::-1], [1, 2, 3][-2:])` → `[3, 2, 1] [2, 3]` [R]
5. predict: `from itertools import chain, islice, count` / `print(list(chain([1], (2, 3))), list(islice(count(10), 3)))` → `[1, 2, 3] [10, 11, 12]` [R]
6. predict: `from itertools import groupby` / `print([(k, len(list(g))) for k, g in groupby("aabccc")])` → `[('a', 2), ('b', 1), ('c', 3)]` [R]
7. predict: `print({**{"a": 1, "b": 2}, "b": 9}, {"a": 1} | {"a": 2})` → `{'a': 1, 'b': 9} {'a': 2}` [R]
8. predict: `from itertools import product, permutations, combinations` / `print(len(list(product("ab", repeat=2))), len(list(permutations("abc", 2))), len(list(combinations("abc", 2))))` → `4 6 3` [R]
9. predict: `d = dict.fromkeys(["a", "b"], [])` / `d["a"].append(1)` / `print(d)` → `{'a': [1], 'b': [1]}` (one shared list) [R]
10. predict: `x = [1, 2, 3]` / `print(x * 2, x[1:] + x[:1])` → `[1, 2, 3, 1, 2, 3] [2, 3, 1]` [R]

---

## Region 3: `function-peaks`, Functions, scope, decorators and exceptions

### 3.1 `functions-and-arguments`, "Spell keys"

- **Concept**: `def`, `return` (a function without `return` gives `None`), default values, keyword arguments,
  `*args` (tuple) and `**kwargs` (dict), unpacking at the call site (`f(*xs)`, `f(**d)`), positional-only `/` and
  keyword-only `*`, returning a tuple, `lambda`. **Mutable default arguments are evaluated once, when `def` runs**
  (Python FAQ); the fix is `None` as default.
- **Visual**: a function is a key item; calling it means `give` chips to the key, which returns a chip. A mutable
  default is a scroll glued to the key: every call writes on the same scroll (it keeps growing).
- **Questions**:
  1. predict: `def heal(hp, amount=5): return hp + amount` / `print(heal(10), heal(10, 1), heal(amount=2, hp=1))` → `15 11 3` [R]
  2. predict: `def f(): print("hi")` / `r = f()` / `print(r)` → `hi` / `None` [R]
  3. predict: `def total(*args, **kwargs): return args, kwargs` / `print(total(1, 2, x=3))` → `((1, 2), {'x': 3})` [R]
  4. predict: `def add(a, b, c): return a + b + c` / `print(add(*[1, 2, 3]), add(**{"a": 1, "b": 2, "c": 3}))` → `6 6` [R]
  5. predict "What happens?": `def f(a, b): return a` / `f(1)` → `TypeError` [E]
  6. predict:
     ```python
     def add_item(item, bag=[]):
         bag.append(item)
         return bag
     add_item("gem")
     print(add_item("key"))
     ```
     → `['gem', 'key']` [R]
  7. pick "Safe default": `def add_item(item, bag=___):` options `None` / `[]` → `None` (with `if bag is None: bag = []`; prints `['key']`) [R]
  8. predict: `def f(a, /, b, *, c): return a + b + c` / `print(f(1, 2, c=3))` / `f(1, 2, 3)` → `6` then `TypeError` [R+E]
  9. predict: `def stats(): return 3, 5` / `hp, mp = stats()` / `print(hp, mp, type(stats()).__name__)` → `3 5 tuple` [R]
  10. predict: `sq = lambda x: x * x` / `print(sq(4), (lambda a, b=2: a * b)(3))` → `16 6` [R]
- **Run**: starter
  ```python
  def add_loot(item, bag=[]):
      bag.append(item)
      return bag
  print("ada:", add_loot("gem"))
  print("bo:", add_loot("key"))
  ```
  prints `bo: ['gem', 'key']`. Solution: `bag=None` + `if bag is None: bag = []`. `expect`: `bo: ['key']`. [R]

### 3.2 `scope-and-closures`, "The fog and the backpack"

- **Concept**: LEGB lookup (Local, Enclosing, Global, Built-in); assigning anywhere in a function makes the name
  local for the **whole** function → `UnboundLocalError`; `global` and `nonlocal` (PEP 3104); `for` loop variables
  leak after the loop, comprehension variables do not; closures capture **variables, not values** → late binding
  in loops; fix with a default argument (`lambda i=i: i`); function factories.
- **Visual**: fog layers around the hero (local), the ally (enclosing), the village (global), the world (built-in):
  looking up a name walks outward. A closure is the key with a backpack scroll; in a loop, all three keys share one
  backpack, so they all read the last value.
- **Questions**:
  1. predict: `x = "global"` / `def f(): x = "local"; return x` / `print(f(), x)` → `local global` [R]
  2. predict "What happens?": `count = 0` / `def inc(): count += 1` / `inc()` → `UnboundLocalError` [E]
  3. type: `def inc(): ___ count; count += 1` (count is module-level; two calls print `2`) → `global` [R]
  4. predict:
     ```python
     def make_counter():
         count = 0
         def step():
             nonlocal count
             count += 1
             return count
         return step
     c = make_counter()
     c(); c()
     print(c())
     ```
     → `3` [R]
  5. predict: `fns = [lambda: i for i in range(3)]` / `print([f() for f in fns])` → `[2, 2, 2]` [R]
  6. predict: `fns = [lambda i=i: i for i in range(3)]` / `print([f() for f in fns])` → `[0, 1, 2]` [R]
  7. predict "What happens?": `x = 1` / `def f(): print(x); x = 2` / `f()` → `UnboundLocalError` [E]
  8. predict: `for i in range(3): pass` / `print(i)` → `2` [R]
  9. predict "What happens?": `[j for j in range(3)]` / `print(j)` → `NameError` [E]
  10. predict: `def mult(n): return lambda x: x * n` / `double = mult(2)` / `print(double(5), mult(3)(5))` → `10 15` [R]
  11. predict: `x = 10` / `def f(): return x` / `x = 20` / `print(f())` → `20` (looked up at call time) [R]
- **Run**: starter
  ```python
  def make_counter():
      count = 0
      def step():
          count += 1
          return count
      return step
  c = make_counter()
  c()
  print("count:", c())
  ```
  raises `UnboundLocalError`. Solution: add `nonlocal count`. `expect`: `count: 2`. [R]

### 3.3 `decorators`, "Wrapping spells"

- **Concept**: functions are objects; a decorator takes a function and returns a new one (`@deco` is
  `f = deco(f)`, PEP 318); `wrapper(*args, **kwargs)`; forgetting `return` in the wrapper; `functools.wraps`
  keeps `__name__`; decorators with arguments (three levels); stacking order (bottom decorator applies first);
  decorators run at definition time; `functools.lru_cache` / `cache`.
- **Visual**: the ally wraps the hero's key in a shield: every call goes through the ally (`say` "before", the key
  acts, `say` "after"). Stacked decorators are nested shields.
- **Questions**:
  1. predict:
     ```python
     def shout(fn):
         def wrapper(*args, **kwargs):
             return fn(*args, **kwargs).upper()
         return wrapper
     @shout
     def greet(name):
         return f"hi {name}"
     print(greet("ada"))
     ```
     → `HI ADA` [R]
  2. predict: a `log` decorator printing `before`, calling `f(1)` (which prints `in 1` and returns `1`), printing `after`, then `print(f(1))` → `before` / `in 1` / `after` / `1` [R]
  3. predict: decorator without `wraps` on `def hello()` → `print(hello.__name__)` → `wrapper` [R]
  4. type: `@functools.___(fn)` above `def wrapper` so `hello.__name__` is `hello` → `wraps` [R]
  5. predict:
     ```python
     def repeat(n):
         def deco(fn):
             def wrapper():
                 return [fn() for _ in range(n)]
             return wrapper
         return deco
     @repeat(3)
     def roll():
         return 6
     print(roll())
     ```
     → `[6, 6, 6]` [R]
  6. predict: `def a(fn): return lambda: "a(" + fn() + ")"`, same for `b`, then `@a` / `@b` / `def f(): return "f"` / `print(f())` → `a(b(f))` [R]
  7. predict: `def register(fn): print("registering", fn.__name__); return fn` / `@register` / `def spell(): print("cast")` / `print("start")` / `spell()` → `registering spell` / `start` / `cast` (decorators run at definition) [R]
  8. predict: `@lru_cache(maxsize=None)` recursive `fib(30)` counting calls → `print(fib(30), calls)` → `832040 31` [R]
- **Run**: starter
  ```python
  def double_result(fn):
      def wrapper(*args):
          fn(*args) * 2
      return wrapper
  @double_result
  def power(x):
      return x + 1
  print("power:", power(4))
  ```
  prints `power: None`. Solution: `return fn(*args) * 2`. `expect`: `power: 10`. [R]

### 3.4 `exceptions`, "Traps and nets"

- **Concept**: `try` / `except` / `else` (only if no exception) / `finally` (always, even after `return`);
  catching several types with a tuple; `as e`; the hierarchy (`KeyError` and `IndexError` are `LookupError`;
  `KeyboardInterrupt` is not an `Exception`); `raise`; custom exceptions subclass `Exception`; implicit chaining
  (`__context__`) and `raise ... from`; `ExceptionGroup` and `except*` (PEP 654).
- **Visual**: an enemy trap triggers (`shake` + banner with the exception class); `except` is a net held by an
  ally that catches matching traps only; `finally` is the healer who always walks in at the end.
- **Questions**:
  1. predict: `try: 1 / 0` / `except ZeroDivisionError: print("caught")` → `caught` [R]
  2. predict:
     ```python
     try:
         x = int("7")
     except ValueError:
         print("bad")
     else:
         print("ok", x)
     finally:
         print("done")
     ```
     → `ok 7` / `done` [R]
  3. predict: `def f():` / `try: return "try"` / `finally: print("finally")` / `print(f())` → `finally` / `try` [R]
  4. predict: `try: [][0]` / `except (KeyError, IndexError) as e: print(type(e).__name__)` → `IndexError` [R]
  5. predict: `class OutOfMana(Exception): pass` / `try: raise OutOfMana("need 5")` / `except Exception as e: print(type(e).__name__, e)` → `OutOfMana need 5` [R]
  6. predict: `try: {}["x"]` / `except LookupError: print("lookup")` → `lookup` [R]
  7. predict "What happens?": `def cast(mp):` / `if mp < 5: raise ValueError("low mana")` / `print(cast(1))` → `ValueError` [E]
  8. predict: nested `try: 1 / 0` / `except ZeroDivisionError: raise ValueError("wrapped")`, outer `except ValueError as e: print(e, type(e.__context__).__name__)` → `wrapped ZeroDivisionError` [R]
  9. predict: `try: print("a")` / `except Exception: print("b")` / `else: print("c")` → `a` / `c` [R]
  10. predict: `print(issubclass(KeyError, LookupError), issubclass(ZeroDivisionError, ArithmeticError), issubclass(KeyboardInterrupt, Exception))` → `True True False` [R]
- **Run**: starter
  ```python
  def parse(text):
      return int(text)
  total = 0
  for t in ["3", "x", "4"]:
      total += parse(t)
  print("total:", total)
  ```
  raises `ValueError`. Solution: `try: return int(text)` / `except ValueError: return 0`. `expect`: `total: 7`. [R]

### 3.5 Boss `closure-wyvern` (mode `boss`)

1. predict: `def f(x, items=[]): items.append(x); return len(items)` / `print(f(1), f(2), f(3, []))` → `1 2 1` [R]
2. predict: `def f(*args): return type(args).__name__` / `print(f(1, 2))` → `tuple` [R]
3. predict: `print((lambda *a, **k: (len(a), sorted(k)))(1, 2, b=1, a=2))` → `(2, ['a', 'b'])` [R]
4. predict: `def outer():` with `n = 0`, inner with `nonlocal n; n += 1; return n`, `inner()` then `return inner()` / `print(outer())` → `2` [R]
5. predict: `ExceptionGroup("many", [ValueError("a"), TypeError("b")])` raised and handled by `except* ValueError` (prints `values: 1`) and `except* TypeError` (prints `types: 1`) → `values: 1` / `types: 1` [R]
6. predict: `try: int("x")` / `except ValueError as e: raise RuntimeError("bad input") from e` → `RuntimeError` [E]
7. predict: `@functools.cache` on `sq(x)` that prints `calc x`; `sq(3); sq(3)`; `print(sq.cache_info().hits)` → `calc 3` / `1` [R]
8. predict: `from functools import reduce, partial` / `print(reduce(lambda a, b: a * b, [1, 2, 3, 4]), partial(pow, 2)(5))` → `24 32` [R]
9. predict: `fns = []` / `for i in range(3): fns.append(lambda: i * 10)` / `print(fns[0]())` → `20` [R: same late binding as 3.2 q5]

---

## Region 4: `object-tower`, Classes, generators, context managers and asyncio

### 4.1 `classes-and-attributes`, "Blueprints"

- **Concept**: `class`, `__init__`, `self`; instance attributes vs class attributes (a mutable class attribute is
  shared by all instances; assigning on an instance shadows the class one); `__repr__` / `__str__`; operator dunders
  (`__add__`, `__eq__`, `__len__`, `__getitem__`; `__len__` also drives truthiness, `__getitem__` makes `in` and
  iteration work); default `==` is identity; `@property` with a setter; `@classmethod` / `@staticmethod`.
- **Visual**: the class is a blueprint banner; each instance is a potion item made from it. A class attribute is a
  scroll pinned to the blueprint that every potion can read (and append to). `self` is the potion's own tag.
- **Questions**:
  1. predict: class `Hero` with `self.name = name` and `self.hp = 10`; `h = Hero("Ada")`; `h.hp -= 3`; `print(h.name, h.hp)` → `Ada 7` [R]
  2. predict:
     ```python
     class Hero:
         team = []
         def __init__(self, name):
             self.name = name
             self.team.append(name)
     a = Hero("Ada"); b = Hero("Bo")
     print(a.team, Hero.team is b.team)
     ```
     → `['Ada', 'Bo'] True` [R]
  3. predict: `class Hero: level = 1` / `a = Hero(); b = Hero()` / `a.level = 5` / `print(a.level, b.level, Hero.level)` → `5 1 1` [R]
  4. predict: `Hero` with `__repr__` returning `f"Hero({self.name!r})"` and `__str__` returning `f"the hero {self.name}"`; `print(h, [h], repr(h))` → `the hero Ada [Hero('Ada')] Hero('Ada')` (containers use `repr`) [R]
  5. predict: `Vec` with `__add__` and `__eq__`; `v = Vec(1, 2) + Vec(3, 4)`; `print(v.x, v.y, Vec(1, 1) == Vec(1, 1), Vec(1, 1) is Vec(1, 1))` → `4 6 True False` [R]
  6. predict: `Bag` with `__len__` and `__getitem__` over `self.items`; `b = Bag(["gem", "key"])`; `print(len(b), b[1], bool(Bag([])), "gem" in b)` → `2 key False True` [R]
  7. predict: `@property hp` returning `self._hp`, setter `self._hp = max(0, value)`; `h = Hero(5)`; `h.hp = -3`; `print(h.hp)` → `0` [R]
  8. predict "What happens?": `class Hero:` with only `@property def hp(self): return 10`; `Hero().hp = 5` → `AttributeError` [E]
  9. predict: class with `count = 0`, `__init__` doing `Hero.count += 1`, `@classmethod made(cls)` returning `cls.count`, `@staticmethod motto()` returning `"go"`; `Hero(); Hero()`; `print(Hero.made(), Hero.motto())` → `2 go` [R]
  10. predict "What happens?": `class Hero: def greet(self): return "hi"` / `print(Hero.greet())` → `TypeError` (missing `self`) [E]
  11. predict: `class A: def __init__(self, n): self.n = n` / `print(A(1) == A(1))` → `False` (no `__eq__`: identity) [R]
- **Run**: starter
  ```python
  class Potion:
      def __init__(self, power):
          power = power
      def describe(self):
          return f"potion of {self.power}"
  print(Potion(5).describe())
  ```
  raises `AttributeError`. Solution: `self.power = power`. `expect`: `potion of 5`. [R]

### 4.2 `inheritance-and-dataclasses`, "Bloodlines"

- **Concept**: subclassing and overriding; `isinstance` / `issubclass`; `super().__init__(...)` (forgetting it
  means parent attributes are missing); multiple inheritance and the MRO (C3 linearization; `super()` follows the
  MRO, not just "the parent"); `@dataclass` generates `__init__`, `__repr__`, `__eq__` (PEP 557); mutable defaults
  need `field(default_factory=list)`; `frozen=True`; `order=True`; abstract base classes; `__slots__`. Type hints
  are **not enforced at runtime** (PEP 484).
- **Visual**: a family tree of blueprints; `super()` is the hero calling up the line, following the MRO banner
  `D → B → C → A → object`. A dataclass is a blueprint the ally fills in automatically (`banner` "auto __init__").
- **Questions**:
  1. predict: `Dog(Animal)` overriding `speak` → `print(Dog().speak(), isinstance(Dog(), Animal), issubclass(Animal, Dog))` → `woof True False` [R]
  2. predict: `Mage(Base)` with `super().__init__(name)` then `self.mp = mp`; `m = Mage("Ada", 9)`; `print(m.name, m.mp)` → `Ada 9` [R]
  3. predict:
     ```python
     class A:
         def who(self): return "A"
     class B(A):
         def who(self): return "B" + super().who()
     class C(A):
         def who(self): return "C" + super().who()
     class D(B, C):
         def who(self): return "D" + super().who()
     print(D().who(), [k.__name__ for k in D.__mro__])
     ```
     → `DBCA ['D', 'B', 'C', 'A', 'object']` [R]
  4. predict "What happens?": `Base.__init__` sets `self.hp = 10`, `Kid(Base).__init__` sets only `self.mp = 5`; `print(Kid().hp)` → `AttributeError` [E]
  5. predict: `@dataclass class Item: name: str; power: int = 1` / `a = Item("gem", 3)` / `print(a, a == Item("gem", 3))` → `Item(name='gem', power=3) True` [R]
  6. predict: `@dataclass class Bag: items: list = field(default_factory=list)` / `a = Bag(); b = Bag()` / `a.items.append("gem")` / `print(b.items)` → `[]` [R]
  7. predict "What happens?": `@dataclass class Bag: items: list = []` → `ValueError` (mutable default not allowed) [E]
  8. predict "What happens?": `@dataclass(frozen=True) class P: x: int` / `p = P(1)` / `p.x = 2` → `FrozenInstanceError` (`dataclasses.FrozenInstanceError`, a subclass of `AttributeError`) [E]
  9. predict: `def heal(hp: int) -> int: return hp * 2` / `print(heal("ab"))` → `abab` (hints are not checked at runtime) [R]
  10. predict "What happens?": `class X: pass` / `class Y(X): pass` / `class Z(X, Y): pass` → `TypeError` (no consistent MRO) [E]
  11. predict "What happens?": `class Shape(ABC):` with `@abstractmethod def area(self): ...`; `Shape()` → `TypeError` [E]
- **Run**: starter
  ```python
  class Base:
      def __init__(self, name):
          self.name = name
  class Knight(Base):
      def __init__(self, name, armor):
          self.armor = armor
  k = Knight("Ada", 3)
  print(f"{k.name} wears {k.armor}")
  ```
  raises `AttributeError`. Solution: add `super().__init__(name)`. `expect`: `Ada wears 3`. [R]

### 4.3 `generators-and-context-managers`, "Lazy enemies and magic doors"

- **Concept**: iterables vs iterators (`iter`, `next`, `StopIteration`); an iterator is consumed once; generators
  with `yield` pause and resume (PEP 255), nothing runs until the first `next()`; `yield from`; generator
  expressions evaluate the source lazily; the iterator protocol (`__iter__` / `__next__`); `in` on a generator
  consumes it. Context managers (PEP 343): `with` calls `__enter__` (its return value goes to `as`) and always calls
  `__exit__`; returning `True` from `__exit__` suppresses the exception; `contextlib.contextmanager`,
  `contextlib.suppress`.
- **Visual**: a generator is an enemy who hands one item, then `wait`s until the next `next()`. A context manager is
  a door: `enter` (lights on), the body, `exit` (lights off) even if a trap `shake`s inside.
- **Questions**:
  1. predict: `it = iter([1, 2])` / `print(next(it), next(it))` / `next(it)` → `1 2` then `StopIteration` [R+E]
  2. predict:
     ```python
     def gen():
         print("start")
         yield 1
         print("middle")
         yield 2
     g = gen()
     print("made")
     print(next(g))
     print(next(g))
     ```
     → `made` / `start` / `1` / `middle` / `2` [R]
  3. predict: `def countdown(n):` / `while n > 0: yield n; n -= 1` / `print(list(countdown(3)), sum(countdown(4)))` → `[3, 2, 1] 10` [R]
  4. predict: `def gen(): yield from [1, 2]; yield 3` / `print(list(gen()))` → `[1, 2, 3]` [R]
  5. predict: `nums = [1, 2, 3]` / `sq = (n * n for n in nums)` / `nums.append(4)` / `print(list(sq))` → `[1, 4, 9, 16]` [R]
  6. predict: `it = iter([1, 2, 3])` / `print(list(it), list(it))` → `[1, 2, 3] []` [R]
  7. predict: class `Lamp` whose `__enter__` prints `on` and returns `"light"`, `__exit__` prints `off`; `with Lamp() as l: print(l)` → `on` / `light` / `off` [R]
  8. predict: `Lamp.__exit__` prints `"off", exc_type.__name__` and returns `True`; `with Lamp(): 1 / 0`; `print("after")` → `off ZeroDivisionError` / `after` [R]
  9. predict:
     ```python
     from contextlib import contextmanager
     @contextmanager
     def tag(name):
         print(f"<{name}>")
         yield
         print(f"</{name}>")
     with tag("b"):
         print("hi")
     ```
     → `<b>` / `hi` / `</b>` [R]
  10. predict: `from contextlib import suppress` / `with suppress(KeyError): {}["x"]` / `print("fine")` → `fine` [R]
  11. predict: `g = (x for x in range(3))` / `print(2 in g, list(g))` → `True []` [R]
  12. predict: class `Count` with `__iter__` returning `self` and `__next__` that decrements `self.n` and raises `StopIteration` at 0; `print(list(Count(3)))` → `[2, 1, 0]` [R]
- **Run**: starter
  ```python
  def evens(limit):
      result = []
      for n in range(limit):
          if n % 2 == 0:
              return n
      return result
  print("evens:", list(evens(7)))
  ```
  raises `TypeError` (`int` is not iterable). Solution: replace the body with `for n in range(limit): if n % 2 == 0: yield n`. `expect`: `evens: [0, 2, 4, 6]`. [R]

### 4.4 `async-and-concurrency`, "The event loop tower"

- **Concept**: `async def` makes a coroutine function; calling it creates a coroutine object and runs nothing;
  `await` runs it; `asyncio.run(main())` starts the event loop (no top-level `await` in a script);
  `asyncio.sleep` yields control; `asyncio.gather` runs awaitables concurrently and returns results **in argument
  order**; `create_task`; `TaskGroup` (3.11+); `wait_for` timeout raises `TimeoutError`; forgetting `await`.
  Concept only `[C]`: the GIL lets one thread run Python bytecode at a time; threads help I/O-bound work, processes
  (`multiprocessing`) help CPU-bound work, asyncio handles many concurrent I/O waits in one thread; blocking calls
  (`time.sleep`, CPU loops) inside a coroutine freeze the loop; free-threaded builds exist (PEP 703) but are optional.
- **Visual**: hero = event loop. Each task is an ally; `await asyncio.sleep(...)` makes the ally `wait` and hand the
  turn back to the hero, who lets another ally act. `gather` lines allies up and collects their chips in the order
  they were listed, even if the faster one finished first.
- **Questions**:
  1. predict: `async def main(): print("hi"); return 7` / `print(asyncio.run(main()))` → `hi` / `7` [R]
  2. predict: `async def greet(): return "hi"` / `c = greet()` / `print(type(c).__name__)` / `c.close()` → `coroutine` [R]
  3. predict:
     ```python
     import asyncio
     async def job(name, delay):
         await asyncio.sleep(delay)
         print(name)
         return name
     async def main():
         r = await asyncio.gather(job("slow", 0.02), job("fast", 0.01))
         print(r)
     asyncio.run(main())
     ```
     → `fast` / `slow` / `['slow', 'fast']` [R] (timing-based print order; for strict determinism prefer delays like 0.05 vs 0.01, or ask only about `r`)
  4. predict: `async def job(n): await asyncio.sleep(0); print("job", n)`; in `main`, `t = asyncio.create_task(job(1))`, `print("main")`, `await t` → `main` / `job 1` [R]
  5. predict: `async def tick(name): for i in range(2): print(name, i); await asyncio.sleep(0)`; `await asyncio.gather(tick("a"), tick("b"))` → `a 0` / `b 0` / `a 1` / `b 1` [R]
  6. predict: `gather(ok(), boom(), return_exceptions=True)` where `ok` returns `1` and `boom` raises `ValueError`; `print([type(x).__name__ for x in r])` → `['int', 'ValueError']` [R]
  7. predict: `await asyncio.wait_for(slow(), timeout=0.01)` where `slow` sleeps 1 s, inside `try` / `except TimeoutError: print("timeout")` → `timeout` [R]
  8. predict: `async with asyncio.TaskGroup() as tg:` creating `work(1)` and `work(2)` (each returns `n * 2`), then `print(t1.result() + t2.result())` → `6` [R]
  9. pick [C] "CPU-heavy image resizing on 8 cores, standard CPython": `multiprocessing` / `threading` / `asyncio` → `multiprocessing` (the GIL lets one thread run Python bytecode at a time)
  10. pick [C] "10,000 concurrent HTTP calls that mostly wait": `asyncio` / `multiprocessing` → `asyncio`
  11. pick [C] "Inside an `async def`, which call blocks the whole event loop?": `time.sleep(1)` / `await asyncio.sleep(1)` → `time.sleep(1)`
- **Run**: starter
  ```python
  import asyncio
  async def fetch(name):
      await asyncio.sleep(0)
      return name.upper()
  async def main():
      result = fetch("ada")
      print("got", result)
  asyncio.run(main())
  ```
  prints `got <coroutine object fetch at 0x...>` (plus a `RuntimeWarning` on stderr). Solution: `result = await fetch("ada")`. `expect`: `got ADA`. [R]

### 4.5 Boss `event-loop-lich` (mode `boss`)

1. predict: `class Single:` with `_inst = None` and `__new__` returning the cached instance; `print(Single() is Single())` → `True` [R]
2. predict: `def acc():` / `total = 0` / `while True: x = yield total; total += x` / `g = acc(); next(g); g.send(5)` / `print(g.send(10))` → `15` [R]
3. predict: `def gen(): try: yield 1` / `finally: print("cleanup")` / `g = gen(); next(g); g.close(); print("closed")` → `cleanup` / `closed` [R]
4. predict: `class Point: __slots__ = ("x",)` / `p = Point()` / `p.y = 1` → `AttributeError` [E]
5. predict: `class Hero: def __init__(self): self.__secret = 1` / `h = Hero()` / `print(h._Hero__secret)` / `h.__secret` → `1` then `AttributeError` (name mangling) [R+E]
6. predict: `@dataclass(order=True) class Card: rank: int; suit: str` / `print(sorted([Card(3, "b"), Card(1, "z"), Card(3, "a")])[0], Card(3, "a") < Card(3, "b"))` → `Card(rank=1, suit='z') True` [R]
7. predict: `async def main(): asyncio.sleep(0.01); print("done")` / `asyncio.run(main())` → `done` (the sleep never ran: missing `await`; warning only on stderr) [R]
8. pick [C] "The GIL means": only one thread executes Python bytecode at a time in a process / Python cannot create threads → the first
9. predict: `x: int = "hello"` / `print(x)` → `hello` [R]

---

# Entry exam

Follows [../exams.md](../exams.md): bank ≥ 1.6 × `count`, round-robin draw across topics, sorted by difficulty.
Topic ids linked to a region let a strong result skip it. Ask for **exception class names**, never full messages.
Never use threads in executed snippets; concurrency questions are `[C]` picks.

## Topics

| Topic id | Name (en) | Region |
|---|---|---|
| `values` | Names, values and dynamic typing | `name-village` |
| `numbers_strings` | Numbers, strings, slicing and f-strings | `name-village` |
| `truthiness` | Truthiness, comparisons, `is` vs `==` | `name-village` |
| `collections_basics` | list, tuple, dict, set | `collection-forest` |
| `mutability` | Mutability, references and copies | `collection-forest` |
| `comprehensions` | Comprehensions, sorting with keys, `collections` | `collection-forest` |
| `functions` | Functions, defaults, `*args` / `**kwargs` | `function-peaks` |
| `scope_closures` | Scope (LEGB), `global` / `nonlocal`, closures | `function-peaks` |
| `decorators` | Decorators | `function-peaks` |
| `exceptions` | Exceptions | `function-peaks` |
| `classes` | Classes, dunder methods, properties | `object-tower` |
| `inheritance` | Inheritance, MRO, `super()`, dataclasses | `object-tower` |
| `generators` | Iterators, generators, context managers | `object-tower` |
| `async` | `async` / `await` and asyncio | `object-tower` |
| `stdlib` | `itertools`, `functools`, `collections` in depth | (none) |
| `typing` | Type hints and their runtime behaviour | (none) |
| `concurrency` | GIL, threading vs multiprocessing vs asyncio (concept) | (none) |
| `object_model` | `__new__`, descriptors, metaclasses, `__slots__`, `__init_subclass__` | (none) |
| `modules` | Modules, packages, `__name__ == "__main__"` | (none) |
| `patterns` | Modern syntax: walrus, `match`, exception groups | (none) |

## Levels

| Exam | Draws / bank | Pass | s/question | Topic ids (bank count) |
|---|---|---|---|---|
| `junior`, Junior Python Developer | 12 / 22 | 70% | 30 | values 3, numbers_strings 3, truthiness 3, collections_basics 4, mutability 3, comprehensions 2, functions 2, exceptions 2 |
| `mid`, Mid-level Python Developer | 14 / 24 | 70% | 40 | mutability 2, functions 3, scope_closures 3, decorators 3, exceptions 2, classes 3, inheritance 2, generators 3, stdlib 2, typing 1 |
| `senior`, Senior Python Developer | 15 / 26 | 75% | 50 | generators 3, async 4, concurrency 3, object_model 4, inheritance 2, decorators 2, scope_closures 2, typing 2, stdlib 2, modules 1, patterns 1 |

## Junior examples

1. `values` predict: `a = 1` / `b = a` / `a = 2` / `print(a, b)` → `2 1` [R]
2. `values` predict "What happens?": `print("3" + 3)` → `TypeError` [E]
3. `numbers_strings` predict: `print(7 / 2, 7 // 2, 7 % 2)` → `3.5 3 1` [R]
4. `numbers_strings` predict: `s = "python"` / `print(s[0], s[-1], s[1:4], s[::-1])` → `p n yth nohtyp` [R]
5. `numbers_strings` predict: `print(0.1 + 0.2 == 0.3)` → `False` [R]
6. `truthiness` predict: `print(bool(0), bool(""), bool([]), bool("0"), bool([0]))` → `False False False True True` [R]
7. `truthiness` predict: `a = [1, 2]` / `b = [1, 2]` / `print(a == b, a is b)` → `True False` [R]
8. `collections_basics` predict: `t = (5)` / `u = (5,)` / `print(type(t).__name__, type(u).__name__)` → `int tuple` [R]
9. `collections_basics` predict "What happens?": `hero = {"name": "Ada"}` / `print(hero["mp"])` → `KeyError` [E]
10. `collections_basics` predict: `s = {3, 1, 2, 3, 1}` / `print(len(s), sorted(s))` → `3 [1, 2, 3]` [R]
11. `mutability` predict: `a = [1, 2]` / `b = a` / `b.append(3)` / `print(a)` → `[1, 2, 3]` [R]
12. `comprehensions` predict: `print([n for n in range(10) if n % 3 == 0])` → `[0, 3, 6, 9]` [R]
13. `functions` predict: `def f(): print("hi")` / `r = f()` / `print(r)` → `hi` / `None` [R]
14. `exceptions` predict: `try: int("7")` ... `else: print("ok", x)` / `finally: print("done")` → `ok 7` / `done` [R]

## Mid examples

1. `functions` predict: `def add_item(item, bag=[])` called twice, printing the second result → `['gem', 'key']` [R]
2. `functions` predict: `def total(*args, **kwargs): return args, kwargs` / `print(total(1, 2, x=3))` → `((1, 2), {'x': 3})` [R]
3. `scope_closures` predict: `fns = [lambda: i for i in range(3)]` / `print([f() for f in fns])` → `[2, 2, 2]` [R]
4. `scope_closures` predict "What happens?": `count = 0` / `def inc(): count += 1` / `inc()` → `UnboundLocalError` [E]
5. `decorators` predict: decorator without `functools.wraps` → `print(hello.__name__)` → `wrapper` [R]
6. `decorators` predict: stacked `@a` / `@b` on `f` → `a(b(f))` [R]
7. `mutability` predict: `grid = [[0] * 2] * 2` / `grid[0][0] = 9` / `print(grid)` → `[[9, 0], [9, 0]]` [R]
8. `classes` predict: mutable class attribute `team = []` appended in `__init__` for two heroes → `['Ada', 'Bo'] True` [R]
9. `classes` predict: `@property` setter clamping with `max(0, value)`, `h.hp = -3`, `print(h.hp)` → `0` [R]
10. `generators` predict: `g = (n * 2 for n in range(3))` / `print(sum(g), sum(g))` → `6 0` [R]
11. `generators` predict: `Lamp` whose `__exit__` returns `True`; `with Lamp(): 1 / 0`; `print("after")` → `off ZeroDivisionError` / `after` [R]
12. `inheritance` predict "What happens?": subclass `__init__` without `super().__init__()`, then reading a parent attribute → `AttributeError` [E]
13. `stdlib` predict: `Counter("banana").most_common(2)` and `c["z"]` → `[('a', 3), ('n', 2)] 0` [R]
14. `typing` predict: `def heal(hp: int) -> int: return hp * 2` / `print(heal("ab"))` → `abab` [R]
15. `exceptions` predict: `def f(): try: return "try"` / `finally: print("finally")` / `print(f())` → `finally` / `try` [R]

## Senior examples

1. `inheritance` predict: diamond `D(B, C)` with cooperative `super().who()` → `DBCA ['D', 'B', 'C', 'A', 'object']` [R]
2. `inheritance` predict "What happens?": `class Z(X, Y)` where `Y(X)` → `TypeError` (no consistent MRO) [E]
3. `object_model` predict:
   ```python
   class Positive:
       def __set_name__(self, owner, name):
           self.name = "_" + name
       def __get__(self, obj, objtype=None):
           return getattr(obj, self.name)
       def __set__(self, obj, value):
           if value < 0:
               raise ValueError("negative")
           setattr(obj, self.name, value)
   class Hero:
       hp = Positive()
       def __init__(self, hp):
           self.hp = hp
   print(Hero(5).hp)
   Hero(-1)
   ```
   → `5` then `ValueError` [R+E]
4. `object_model` predict: `registry = []`; `class Plugin` whose `__init_subclass__` appends `cls.__name__`; `class A(Plugin)`, `class B(Plugin)`; `print(registry)` → `['A', 'B']` [R]
5. `object_model` predict: metaclass `Meta(type)` whose `__new__` sets `ns["tag"] = name.lower()`; `class Hero(metaclass=Meta)`; `print(Hero.tag, type(Hero).__name__, type(type).__name__)` → `hero Meta type` [R]
6. `object_model` predict "What happens?": a class with `__eq__` and no `__hash__`, then `s = {o}` → `TypeError` (defining `__eq__` sets `__hash__` to `None`) [E]
7. `generators` predict: accumulator coroutine with `x = yield total`; `next(g)`, `g.send(5)`, `print(g.send(10))` → `15` [R]
8. `generators` predict: generator with `try: yield 1 / finally: print("cleanup")`; `next(g)`, `g.close()`, `print("closed")` → `cleanup` / `closed` [R]
9. `async` predict: `gather(job("slow", 0.05), job("fast", 0.01))` → printed `fast` / `slow`, result `['slow', 'fast']` (results follow argument order) [R]
10. `async` predict: missing `await` on `fetch("ada")` → `got ADA` vs coroutine object: pick "What does `result` hold?" → a coroutine object [R]
11. `async` predict: `gather(ok(), boom(), return_exceptions=True)` → `['int', 'ValueError']` [R]
12. `concurrency` pick [C]: CPU-bound work on many cores in standard CPython → `multiprocessing` (GIL)
13. `concurrency` pick [C]: blocking call inside a coroutine → `time.sleep(1)` freezes the loop; use `await asyncio.sleep(1)` or offload with `asyncio.to_thread` (concept only in this runner)
14. `typing` pick: "`from typing import Protocol`: a class with a matching `greet` method but no inheritance is accepted by `def hello(g: Greeter)`" → structural typing; at runtime it simply runs and prints `woof` [R]
15. `typing` predict: `TypedDict User(name: str, age: int)`; `u: User = {"name": "Ada", "age": "old"}`; `print(u["age"], type(u).__name__)` → `old dict` [R]
16. `stdlib` predict: `print(list(itertools.accumulate([1, 2, 3])), list(itertools.zip_longest("ab", "x", fillvalue="-")))` → `[1, 3, 6] [('a', 'x'), ('b', '-')]` [R]
17. `modules` predict: `if __name__ == "__main__": print("run directly")` / `print(__name__)` run as the main script → `run directly` / `__main__` [R]
18. `patterns` predict:
    ```python
    def kind(cmd):
        match cmd:
            case {"action": "move", "dir": d}:
                return f"move {d}"
            case [x, y]:
                return f"pair {x},{y}"
            case _:
                return "unknown"
    print(kind({"action": "move", "dir": "n"}), kind((1, 2)), kind("hi"))
    ```
    → `move n pair 1,2 unknown` (a `str` never matches a sequence pattern) [R]
19. `patterns` predict: `data = [1, 5, 9]` / `if (n := len(data)) > 2: print(f"{n} items")` → `3 items` [R]

## Extra verified snippets for bank authors

- `print(isinstance(True, int), type(True) is int)` → `True False` [R]
- `print(any(n > 2 for n in [1, 2, 3]), all(n > 0 for n in [1, 2, 3]), all([]))` → `True True True` [R]
- `import json` / `print(json.dumps({"a": [1, None, True]}), json.loads('{"x": 1}')["x"])` → `{"a": [1, null, true]} 1` [R]
- `from decimal import Decimal` / `print(Decimal("0.1") + Decimal("0.2"))` → `0.3` [R]
- `print(3 * 0.1 == 0.3, round(0.1 * 3, 2) == 0.3)` → `False True` [R]
- `print(1_000_000, 0b101, 0x1F, 7 // 2.0)` → `1000000 5 31 3.0` [R]
- `print(divmod(17, 5), abs(-3), max([], default=0))` → `(3, 2) 3 0` [R]
- `print(sorted([3, -1, 2], key=abs), sorted("bAc"), sorted([(2, "b"), (1, "z"), (2, "a")]))` → `[-1, 2, 3] ['A', 'b', 'c'] [(1, 'z'), (2, 'a'), (2, 'b')]` [R]
- `class A: def __init__(self): self.x = 1` / `print(A().__dict__, hasattr(A, "x"))` → `{'x': 1} False` [R]
- `import weakref` ... `del n` / `print(r())` → `None` (CPython reference counting frees immediately; mention as CPython behaviour) [R]

## Sources

See the full list in [python-hiring-assessments.md](python-hiring-assessments.md#sources). Most relevant per region:

- Region 1: Tutorial, informal introduction https://docs.python.org/3/tutorial/introduction.html; Floating point
  https://docs.python.org/3/tutorial/floatingpoint.html; Truth value testing
  https://docs.python.org/3/library/stdtypes.html#truth-value-testing; Comparisons
  https://docs.python.org/3/reference/expressions.html#comparisons; PEP 8 https://peps.python.org/pep-0008/; PEP 498
  https://peps.python.org/pep-0498/; `round` https://docs.python.org/3/library/functions.html#round
- Region 2: Data structures https://docs.python.org/3/tutorial/datastructures.html; `copy`
  https://docs.python.org/3/library/copy.html; Programming FAQ (list of lists)
  https://docs.python.org/3/faq/programming.html#how-do-i-create-a-multidimensional-list; Sorting HOWTO
  https://docs.python.org/3/howto/sorting.html; `collections` https://docs.python.org/3/library/collections.html;
  `itertools` https://docs.python.org/3/library/itertools.html
- Region 3: Defining functions https://docs.python.org/3/tutorial/controlflow.html#defining-functions; Programming
  FAQ (mutable defaults, lambdas in a loop, `UnboundLocalError`) https://docs.python.org/3/faq/programming.html;
  Execution model https://docs.python.org/3/reference/executionmodel.html; PEP 3104 https://peps.python.org/pep-3104/;
  PEP 318 https://peps.python.org/pep-0318/; `functools` https://docs.python.org/3/library/functools.html; Errors and
  exceptions https://docs.python.org/3/tutorial/errors.html; Exception hierarchy
  https://docs.python.org/3/library/exceptions.html#exception-hierarchy; PEP 654 https://peps.python.org/pep-0654/
- Region 4: Classes tutorial https://docs.python.org/3/tutorial/classes.html; Data model
  https://docs.python.org/3/reference/datamodel.html; MRO https://docs.python.org/3/howto/mro.html; `dataclasses`
  https://docs.python.org/3/library/dataclasses.html (PEP 557); PEP 484 https://peps.python.org/pep-0484/; PEP 255
  https://peps.python.org/pep-0255/; PEP 343 https://peps.python.org/pep-0343/; `contextlib`
  https://docs.python.org/3/library/contextlib.html; `asyncio` https://docs.python.org/3/library/asyncio.html (PEP 492
  https://peps.python.org/pep-0492/); GIL glossary https://docs.python.org/3/glossary.html#term-global-interpreter-lock;
  PEP 703 https://peps.python.org/pep-0703/; Descriptor HOWTO https://docs.python.org/3/howto/descriptor.html
- Runner: Pyodide https://pyodide.org/en/stable/
