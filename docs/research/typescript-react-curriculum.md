# TypeScript/JavaScript planet and React moon: proposed curriculum

Curriculum for the new **TypeScript/JavaScript planet** (5 regions) and its first moon **React** (4 regions), plus the
entry exams. It is written for a learner who may know nothing about programming, and it follows what companies
actually assess (see [typescript-hiring-assessments.md](typescript-hiring-assessments.md) and
[react-hiring-assessments.md](react-hiring-assessments.md)). Content authors turn this into language packs following
[../content-model.md](../content-model.md), [../authoring-lessons.md](../authoring-lessons.md) and
[../exams.md](../exams.md).

## Conventions used in this file

### Verification tags

Every question idea ends with a tag saying how its answer is proven. All `[R]`, `[TS]` and `[React]` answers in this file
were checked on 2026-10-06; content authors should still wire each into `check` so `content:verify` keeps them honest.

| Tag | Meaning | How it was checked |
|---|---|---|
| `[R]` | Runtime output | Snippet saved as `.cjs` and run with Node 25; stdout compared exactly (lines joined by spaces below unless shown as separate lines) |
| `[TS]` | Type-checker claim ("does it compile?", "what type is it?") | `tsc --strict --noEmit --target es2023 --lib es2023,dom`; type answers checked with `type Expect<Equal<A, B>>` |
| `[React]` | Static render | Compiled with sucrase (automatic JSX runtime) and rendered with `renderToStaticMarkup` (React 19.2.8) |
| `[Doc]` | Behaviour after interaction or a design rule; not machine-checkable with a static render | Anchored to the react.dev / MDN / Handbook page cited in the lesson |
| `[Mode]` | Depends on strict vs sloppy mode or CJS vs ESM | Avoid, or pin the mode explicitly |

### Runner assumptions

- Regions 1-3 and 5 of the planet use **plain JavaScript** snippets (they are also valid TypeScript under `node`'s type
  stripping, except where a `class` field would need a type in `tsc --strict`). Region 4 (Type Castle) uses
  **TypeScript**.
- A TS `run` beat can be executed with Node's built-in type stripping (`node file.ts`, Node ≥ 22.18). It does **not**
  type-check and rejects `enum`, `namespace` and constructor parameter properties. Every TS `run` below fails at
  runtime too, so it works with a strip-only runner; where `tsc --strict` would also reject the starter, the beat says
  so (a nice extra for the explanation).
- `expect` is a stdout **substring**; every `run` below has an `expect` that the buggy starter's output does not
  contain.
- React `run` beats render with `renderToStaticMarkup(<App />)` and print the HTML string, or test pure logic
  (reducers, a state-update queue, dependency comparison) with `console.log`. Effects never run in a static render.

### Question kinds

`pick` (one `___`, 2-4 options), `predict` (output or Yes/No), `type` (exact token for `___`), `order` (lines in the
correct order, unique), `run` (broken starter → expected stdout). Prompts are short; code is at most 12 lines.
Snippets below are written compactly; authors should split them into lines.

### Visual vocabulary (existing stage effects)

The stage already understands: `tag` (a label above an actor = a variable name), `value` (a value chip next to the
label), `item` (sword, potion, gem, shield, scroll, key), `give` (move an item), `clone` (duplicate an item), `lend`
(ghost copy goes and comes back), `drop`, `dead` (binding invalid), `say`, `print` (console output), `shake` (error),
`banner`, `enter`/`exit`, `attack`/`hp`, `wait`. The metaphors below only use these. Suggested mapping for this planet:

| Code idea | On stage |
|---|---|
| Variable / binding | `tag` label above an actor |
| Primitive value (number, string, boolean) | `value` chip; copying a primitive = a new chip on the other actor |
| Object or array | An `item` (gem = object, scroll = array, key = function) |
| Two variables pointing at the same object | Both actors tagged, one holds the item, `lend` shows the other can reach it (the ghost does NOT come back: they share it) |
| Spread / `structuredClone` | `clone` (banner "SHALLOW" or "DEEP") |
| `const` reassignment, `TypeError`, `ReferenceError`, type error | `shake` + `error` with the real message |
| TDZ | Actor enters greyed (`dead`) until the `let` line runs |
| Closure | The function (key item) carries a backpack: a `scroll` that keeps the captured variable |
| `this` | The caller's tag: whoever holds the key when it is used |
| Promise | A sealed `scroll`: `say` "pending", later opens (`print`) or burns (`shake`) |
| Event loop | hero = call stack, ally = microtask queue, enemy = timer (macrotask) queue; each `print` shows the order |
| Type checker (Type Castle) | A gate guard: the `shield` blocks values of the wrong shape with a `tsc` error |

---

# Part A: TypeScript/JavaScript planet

Learning order: values → functions → objects → types → async. The learner first sees what code does (JS), then how
TypeScript protects it, then the hardest runtime model (the event loop) once they can read promises and functions.

| # | Region slug | Theme | Big idea | Lessons |
|---|---|---|---|---|
| 1 | `value-village` | village | Values, labels and equality | 3 + boss |
| 2 | `closure-forest` | forest | Functions, scope, closures, `this` | 4 + boss |
| 3 | `prototype-peaks` | mountain | Objects, arrays, copies, classes | 4 + boss |
| 4 | `type-castle` | castle | TypeScript: shapes, unions, generics, type tools | 4 + boss |
| 5 | `event-loop-tower` | tower | Timers, promises, async/await, the event loop | 4 + boss |

Exam-only topics with no region yet (candidates for a future region 6, "Module Harbor"): Map/Set/WeakMap,
iterators/generators, modules (ESM vs CommonJS), memory and GC, DOM events, security, advanced TS (overloads,
declaration files, variance, branded types). Question ideas for them are in the entry exams section.

## Region 1: `value-village`, Values, labels and equality

### 1.1 `labels-and-items`, "Labels and items"

- **Concept**: `let` and `const` give a name (label) to a value; `const` means the label can't move, not that the
  item can't change; primitive types and `typeof`; `undefined` for an empty label; a first TypeScript annotation.
- **Visual**: hero gets a `tag` `hp` and a `value` chip `10`; reassigning swaps the chip. With `const`, trying to
  move the label makes the hero `shake`. A `const` array is a scroll item: pushing adds lines to the scroll, the tag
  stays.
- **Questions**:
  1. predict: `let hp = 10; hp = hp + 5; console.log(hp);` → `15` [R]
  2. predict "What happens?": `const gold = 5; gold = 6;` → `TypeError: Assignment to constant variable.` [R]
  3. predict: `const bag = ["gem"]; bag.push("key"); console.log(bag.length);` → `2` (const fixes the label, not the item) [R]
  4. pick: `___ name = "Ada"; name = "Grace";` options `let` / `const` → `let` [R]
  5. predict: `console.log(typeof 42, typeof "hi", typeof true);` → `number string boolean` [R]
  6. predict: `let x; console.log(x);` → `undefined` [R]
  7. predict: `console.log(typeof null);` → `object` (a historical bug kept for compatibility) [R]
  8. predict: `console.log(typeof undefined, typeof [], typeof function () {});` → `undefined object function` [R]
  9. type (TS): `let level: ___ = 3;` → `number` [TS]
  10. predict "Does it compile?" (TS): `let level: number = 3; level = "three";` → No: `TS2322 Type 'string' is not assignable to type 'number'` [TS]
- **Run**: starter `const score = 0;` / `score = score + 10;` / `console.log("score:", score);` → throws `TypeError`.
  Solution: `let score = 0;`. `expect`: `score: 10`. [R]

### 1.2 `numbers-and-strings`, "Numbers and strings"

- **Concept**: one `number` type (64-bit float), `NaN`, `Infinity`, floating-point error, integer division with
  `Math.floor`; strings, template literals, `.length`, basic methods and a first regex.
- **Visual**: a scale (`value` chips `0.1` and `0.2`) that shows `0.30000000000000004` with a `shake`; `NaN` is a ghost
  chip that is not even equal to itself.
- **Questions**:
  1. predict: `console.log(0.1 + 0.2 === 0.3);` → `false` [R]
  2. predict: `console.log(0.1 + 0.2);` → `0.30000000000000004` [R]
  3. predict: `console.log(typeof NaN, NaN === NaN, Number.isNaN(NaN));` → `number false true` [R]
  4. predict: `console.log(7 / 2, Math.floor(7 / 2));` → `3.5 3` [R]
  5. predict: ``console.log(`HP: ${3 + 4}`);`` → `HP: 7` [R]
  6. predict: `console.log("abc".toUpperCase(), "abc".length);` → `ABC 3` [R]
  7. predict: `console.log(10 / 0, -10 / 0, 0 / 0);` → `Infinity -Infinity NaN` [R]
  8. predict: `console.log(parseInt("42px"), Number("42px"));` → `42 NaN` [R]
  9. predict: `console.log(/^\d{3}$/.test("123"), /^\d{3}$/.test("1234"));` → `true false` [R]
  10. pick: `console.log("Hello".replace(/l/___, "L"));` → `HeLLo`; options `g` / `i` / `m` → `g` [R]
- **Run**: starter `const total = 0.1 + 0.2;` / `console.log(total === 0.3 ? "ok" : "bad");` prints `bad`.
  Solution: `Math.abs(total - 0.3) < Number.EPSILON`. `expect`: `ok`. [R]

### 1.3 `equality-and-truthiness`, "Equal or the same?"

- **Concept**: `===` (strict, no conversion) vs `==` (converts types); `+` with a string concatenates, `-` converts to
  numbers; the falsy values (`false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`); `||` vs `??`;
  `Object.is`.
- **Visual**: two actors hold chips `1` and `"1"`; `==` makes the ally "translate" (clone the chip into a number) before
  comparing; `===` compares directly and the hero shakes its head. Falsy values fade when put through `Boolean(...)`.
- **Questions**:
  1. predict: `console.log(1 == "1", 1 === "1");` → `true false` [R]
  2. predict: `console.log("5" + 3, "5" - 3);` → `53 2` [R]
  3. predict: `console.log(null == undefined, null === undefined);` → `true false` [R]
  4. predict: `console.log(Boolean(""), Boolean("0"), Boolean([]));` → `false true true` [R]
  5. pick "Which value is falsy?": `0` / `"false"` / `[]` / `{}` → `0` [R]
  6. predict: `console.log(0 || "default", 0 ?? "default");` → `default 0` [R]
  7. predict: `console.log(true + true);` → `2` [R]
  8. predict: `console.log([1, 2] + [3]);` → `1,23` [R]
  9. predict: `console.log(Object.is(NaN, NaN), Object.is(0, -0));` → `true false` [R]
  10. predict: `console.log(null == 0, null >= 0);` → `false true` (relational operators convert `null` to `0`, `==` does not) [R]
- **Run**: starter `const input = 0;` / `const lives = input || 3;` / `console.log("lives:", lives);` prints `lives: 3`.
  Solution: `input ?? 3`. `expect`: `lives: 0`. [R]

### 1.4 Boss `value-golem` (mode `boss`)

Mixed, timed:
1. predict: `console.log(typeof typeof 1);` → `string` [R]
2. predict: `console.log(null + 1, undefined + 1);` → `1 NaN` [R]
3. predict: `console.log("b" + "a" + +"a" + "a");` → `baNaNa` [R]
4. predict: `let a = "3"; let b = a * 2; console.log(typeof b, b);` → `number 6` [R]
5. predict: `console.log(3 > 2 > 1);` → `false` (`true > 1` → `1 > 1`) [R]
6. predict: `console.log([] == false);` → `true` [R]
7. predict "Does it compile?" (TS): `const n: number = "3" * 2;` → No: `TS2362 The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.` [TS]
8. predict: `console.log(!!"false", !!0, !!NaN);` → `true false false` [R]
9. type: `console.log(Number.___(NaN));` → `isNaN` (prints `true`) [R]

## Region 2: `closure-forest`, Functions, scope, closures and `this`

### 2.1 `functions-and-arrows`, "Spells: functions"

- **Concept**: declaring and calling functions, parameters, `return`, default and rest parameters, arrow functions,
  the arrow-with-braces trap, typed parameters and return types in TS.
- **Visual**: a function is a spell `scroll`; calling it makes the hero cast and a `value` chip pops out (the return
  value). No `return` → an empty chip `undefined`.
- **Questions**:
  1. predict: `function add(a, b) { return a + b; } console.log(add(2, 3));` → `5` [R]
  2. predict: `const sq = n => { n * n }; console.log(sq(3));` → `undefined` (braces need `return`) [R]
  3. predict: `function greet(name = "hero") { return "hi " + name; } console.log(greet(), greet(undefined), greet(null));` → `hi hero hi hero hi null` (defaults apply only to `undefined`) [R]
  4. predict: `function sum(...nums) { return nums.reduce((a, b) => a + b, 0); } console.log(sum(1, 2, 3));` → `6` [R]
  5. predict: `function f() {} console.log(f());` → `undefined` [R]
  6. pick (TS): `function len(s: string): ___ { return s.length; }` options `number` / `string` / `void` → `number` [TS]
  7. predict "Does it compile?" (TS): `function add(a: number, b: number): number { return a + b; } add(1, "2");` → No: `TS2345` [TS]
  8. type: `const double = (n) ___ n * 2;` → `=>` [R]
- **Run**: starter `const area = (w, h) => { w * h };` / `console.log(area(3, 4));` prints `undefined`.
  Solution: `(w, h) => w * h`. `expect`: `12`. [R]

### 2.2 `scope-and-hoisting`, "The fog of scope"

- **Concept**: block scope (`let`/`const`) vs function scope (`var`); hoisting: function declarations are fully hoisted,
  `var` is hoisted as `undefined`, `let`/`const` are hoisted but in the **temporal dead zone** (TDZ) until their line
  runs; shadowing.
- **Visual**: a `let` actor `enter`s greyed (`dead`) in the fog at the top of the block and becomes alive only when
  its line runs; touching it before that = `shake` + `ReferenceError`. A `var` actor is there from the start holding an
  empty `undefined` chip.
- **Questions**:
  1. predict: `console.log(x); var x = 5;` → `undefined` [R]
  2. predict: `console.log(y); let y = 5;` → `ReferenceError: Cannot access 'y' before initialization` [R]
  3. predict: `if (true) { var a = 1; let b = 2; } console.log(typeof a, typeof b);` → `number undefined` [R]
  4. predict: `sayHi(); function sayHi() { console.log("hi"); }` → `hi` [R]
  5. predict: `sayBye(); const sayBye = () => console.log("bye");` → `ReferenceError` [R]
  6. predict: `let n = 1; { let n = 2; } console.log(n);` → `1` [R]
  7. predict: `var a = 1; function f() { console.log(a); var a = 2; } f();` → `undefined` (the inner `var a` is hoisted) [R]
  8. predict: `const x = 1; function f() { console.log(x); const x = 2; } f();` → `ReferenceError` (the inner `x` is in its TDZ; it shadows the outer one) [R]
- **Run**: starter `console.log(total);` / `let total = 5 * 2;` → `ReferenceError`. Solution: swap the lines.
  `expect`: `10`. [R]

### 2.3 `closures`, "The backpack spell"

- **Concept**: a function remembers the variables of the scope where it was created, even after that scope returned
  (closure). Each call of the outer function makes a new backpack. Closures capture variables, not values. `let` in a
  `for` loop creates a new binding per iteration; `var` shares one.
- **Visual**: `makeCounter` hands the hero a key (the function) with a backpack `scroll` holding chip `c`. Each call
  bumps the chip. A second `makeCounter` gives the ally its own backpack.
- **Questions**:
  1. predict: `function makeCounter() { let c = 0; return () => ++c; } const next = makeCounter(); next(); next(); console.log(next());` → `3` [R]
  2. predict: same `makeCounter`; `const a = makeCounter(); const b = makeCounter(); a(); a(); console.log(a(), b());` → `3 1` [R]
  3. predict: `for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }` → `3` `3` `3` (three lines) [R]
  4. predict: same with `let i` → `0` `1` `2` [R]
  5. predict: `let x = 1; const show = () => console.log(x); x = 2; show();` → `2` [R]
  6. predict: `const fns = []; for (let i = 0; i < 3; i++) fns.push(() => i * 10); console.log(fns[2]());` → `20` [R]
  7. pick: complete `once`: `function once(fn) { let done = false; return (...a) => { if (done) return; ___; return fn(...a); }; }` options `done = true` / `done = false` / `fn = null` → `done = true`; then `const init = once(() => "ran"); console.log(init(), init());` → `ran undefined` [R]
  8. predict: `const counter = (() => { let n = 0; return { inc: () => ++n, get: () => n }; })(); counter.inc(); counter.inc(); console.log(counter.get(), counter.n);` → `2 undefined` (private state) [R]
- **Run**: starter `const fns = [];` / `for (var i = 0; i < 3; i++) { fns.push(() => i); }` /
  `console.log(fns.map(f => f()).join(","));` prints `3,3,3`. Solution: `let i`. `expect`: `0,1,2`. [R]

### 2.4 `this-and-binding`, "Who is `this`?"

- **Concept**: `this` is decided by **how** a function is called: method call (`obj.f()` → `obj`), plain call (in strict
  code → `undefined`), `new`, explicit `call`/`apply`/`bind`. Arrow functions don't have their own `this`; they use the
  surrounding one. `bind` can't be overridden by `call`.
- **Visual**: the method is a key item; `this` is the `tag` of whoever holds the key when it is turned. Detaching the
  method (`const f = h.hi`) drops the key on the ground: nobody holds it, `shake` + `TypeError`.
- **Questions**:
  1. predict: `const hero = { name: "Ada", hi() { return "I am " + this.name; } }; console.log(hero.hi());` → `I am Ada` [R]
  2. predict: `class Hero { constructor() { this.name = "Ada"; } hi() { return this.name; } } const h = new Hero(); const f = h.hi; f();` → `TypeError` (class bodies are strict: `this` is `undefined`) [R]
  3. predict: same class; `const bound = h.hi.bind(h); console.log(bound());` → `Ada` [R]
  4. predict: `function intro(greet) { return greet + ", " + this.name; } console.log(intro.call({ name: "Bo" }, "Hey"), intro.apply({ name: "Cy" }, ["Yo"]));` → `Hey, Bo Yo, Cy` [R]
  5. predict: `const team = { name: "Ada", later() { return [1].map(() => this.name)[0]; } }; console.log(team.later());` → `Ada` (arrow uses the method's `this`) [R]
  6. predict: `class Timer { constructor() { this.ticks = 0; } start() { [1, 2, 3].forEach(function () { this.ticks++; }); } } new Timer().start();` → `TypeError` [R]
  7. predict: `function Pet(n) { this.n = n; } const p = new Pet("cat"); console.log(p.n);` → `cat` [R]
  8. predict: `function f() { return this.v; } const g = f.bind({ v: 1 }); console.log(g.call({ v: 2 }));` → `1` [R]
  9. pick: `console.log(Math.max.___(null, [3, 9, 4]));` → `9`; options `apply` / `call` / `bind` → `apply` [R]
- **Run**: starter
  ```js
  class Counter {
    constructor() { this.count = 0; }
    addAll(list) { list.forEach(function (n) { this.count += n; }); }
  }
  const c = new Counter(); c.addAll([1, 2, 3]); console.log("count:", c.count);
  ```
  throws `TypeError`. Solution: `list.forEach((n) => { this.count += n; })`. `expect`: `count: 6`. [R] (As TypeScript,
  `tsc --strict` also rejects the starter: `TS2683 'this' implicitly has type 'any'`.) [TS]

### 2.5 Boss `closure-wraith`

1. predict: `console.log(typeof hoisted, typeof notHoisted); function hoisted() {} var notHoisted = () => {};` → `function undefined` [R]
2. predict: `var a = 1; function f() { console.log(a); var a = 2; } f();` → `undefined` [R]
3. predict: the `var` + `setTimeout` loop → `3 3 3` [R]
4. predict: `function f() { return this.v; } const g = f.bind({ v: 1 }); console.log(g.call({ v: 2 }));` → `1` [R]
5. order: build `once` (lines: `function once(fn) {` / `let done = false;` / `return (...args) => {` / `if (done) return;` / `done = true;` / `return fn(...args);` / `};` / `}`) [R]
6. predict: `const fns = []; for (var i = 0; i < 3; i++) { fns.push(() => i); } console.log(fns.map(f => f()).join(","));` → `3,3,3` [R]
7. pick "Which keeps `this`?": `setTimeout(function () { this.go(); })` / `setTimeout(() => this.go())` → the arrow [R-concept, MDN `this`]

## Region 3: `prototype-peaks`, Objects, arrays, copies and classes

### 3.1 `objects-and-destructuring`, "Packing the bag"

- **Concept**: object and array literals, property access, destructuring (with defaults and holes), spread to merge
  (later keys win), rest, computed keys, optional chaining `?.`.
- **Visual**: an object is a gem with labelled facets; destructuring hands each facet's chip to a new actor's `tag`.
  Spreading two bags into one: chips land in order, a later chip covers an earlier one.
- **Questions**:
  1. predict: `const hero = { name: "Ada", hp: 10 }; const { name, hp } = hero; console.log(name, hp);` → `Ada 10` [R]
  2. predict: `const [first, , third] = ["a", "b", "c"]; console.log(first + third);` → `ac` [R]
  3. predict: `const base = { hp: 10, mp: 5 }; const buffed = { ...base, hp: 20 }; console.log(buffed.hp, buffed.mp);` → `20 5` [R]
  4. predict: `const { hp = 1, mp = 2 } = { hp: undefined, mp: null }; console.log(hp, mp);` → `1 null` [R]
  5. predict: `const user = {}; console.log(user.profile?.name);` → `undefined` (and `user.profile.name` → `TypeError`) [R]
  6. predict: `const [a, ...rest] = [1, 2, 3]; console.log(rest.length);` → `2` [R]
  7. predict: `const key = "gold"; const bag = { [key]: 5 }; console.log(bag.gold);` → `5` [R]
  8. predict: `let a = 1, b = 2; [a, b] = [b, a]; console.log(a, b);` → `2 1` [R]
- **Run**: starter `const defaults = { volume: 5, music: true };` / `const saved = { volume: 9 };` /
  `const settings = { ...saved, ...defaults };` / `console.log(settings.volume, settings.music);` prints `5 true`.
  Solution: `{ ...defaults, ...saved }`. `expect`: `9 true`. [R]

### 3.2 `references-and-copies`, "Shared treasure"

- **Concept**: primitives are copied; objects are shared by reference. Spread copies one level (shallow);
  `structuredClone` copies deeply. `Object.freeze` is shallow. Functions receive a reference (mutating it is visible
  outside, reassigning the parameter is not). `===` on objects compares identity.
- **Visual**: `const b = a` on an object: the ally gets a `tag` but the gem stays with the hero (`lend` with no return:
  they share it). Changing it through `b` makes the hero's gem sparkle too. Spread = `clone` (banner "SHALLOW": the inner
  gem is still shared); `structuredClone` = `clone` (banner "DEEP").
- **Questions**:
  1. predict: `let a = 5; let b = a; b = 9; console.log(a);` → `5` [R]
  2. predict: `const a = { hp: 5 }; const b = a; b.hp = 9; console.log(a.hp);` → `9` [R]
  3. predict: `const a = { hp: 5 }; const b = { ...a }; b.hp = 9; console.log(a.hp);` → `5` [R]
  4. predict: `const a = { stats: { hp: 5 } }; const b = { ...a }; b.stats.hp = 9; console.log(a.stats.hp);` → `9` [R]
  5. predict: same with `const b = structuredClone(a);` → `5` [R]
  6. predict: `const f = Object.freeze({ inner: { hp: 5 } }); f.inner.hp = 9; console.log(f.inner.hp);` → `9` (freeze is shallow) [R]
  7. predict: `console.log([1, 2] === [1, 2]);` → `false` [R]
  8. predict: `function heal(h) { h.hp = 10; } const hero = { hp: 1 }; heal(hero); console.log(hero.hp);` → `10` [R]
  9. predict: `function reset(h) { h = { hp: 0 }; } const hero = { hp: 7 }; reset(hero); console.log(hero.hp);` → `7` [R]
  10. predict: `const d = { when: new Date(0) }; const j = JSON.parse(JSON.stringify(d)); console.log(typeof j.when);` → `string` (JSON cloning loses types) [R]
- **Run**: starter `const original = { name: "Ada", stats: { hp: 5 } };` / `const copy = { ...original };` /
  `copy.stats.hp = 99;` / `console.log(original.stats.hp);` prints `99`. Solution: `structuredClone(original)` or
  `{ ...original, stats: { ...original.stats } }`. `expect`: `5`. [R]
  Note: avoid "assign to a frozen property" questions; they print the old value in sloppy mode but throw in strict
  mode/ESM. [Mode]

### 3.3 `array-methods`, "The array caravan"

- **Concept**: higher-order functions; `map` (transform), `filter` (keep), `reduce` (fold), `find`, `some`/`every`,
  `includes`, `flat`; `forEach` returns `undefined`; `sort` mutates and compares as strings by default; `toSorted`
  returns a new array.
- **Visual**: a caravan of item chips walks through gates: `map` repaints each chip, `filter` turns some away, `reduce`
  piles them into one chest. `sort()` without a comparator sorts the chips by their *spelling*.
- **Questions**:
  1. predict: `console.log([1, 2, 3].map(n => n * 2).join(","));` → `2,4,6` [R]
  2. predict: `console.log([1, 2, 3, 4].filter(n => n % 2 === 0).join(","));` → `2,4` [R]
  3. predict: `console.log([1, 2, 3].reduce((acc, n) => acc + n, 0));` → `6` [R]
  4. predict: `console.log([5, 12, 8].find(n => n > 6));` → `12` [R]
  5. predict: `console.log([10, 1, 2].sort().join(","));` → `1,10,2` [R]
  6. pick: `[10, 1, 2].sort(___)` to get `1,2,10`: `(a, b) => a - b` / `(a, b) => a > b` / `Number` → `(a, b) => a - b` [R]
  7. predict: `console.log([1, 2, 3].forEach(n => n * 2));` → `undefined` [R]
  8. predict: `const a = [3, 1, 2]; const b = a.sort(); console.log(a === b, a.join(""));` → `true 123` [R]
  9. predict: `console.log([1, 2, 3].some(n => n > 2), [1, 2, 3].every(n => n > 2));` → `true false` [R]
  10. order: `const total = items` / `.filter(i => i.price > 0)` / `.map(i => i.price)` / `.reduce((a, b) => a + b, 0);` [R]
- **Run**: starter
  ```js
  const loot = [{ kind: "gem", value: 5 }, { kind: "key", value: 2 }, { kind: "gem", value: 7 }];
  const gems = loot.filter(i => i.kind = "gem");
  console.log(gems.reduce((sum, i) => sum + i.value, 0));
  ```
  prints `14` (`=` assigns, so every item passes and becomes a gem). Solution: `===`. `expect`: `12`. [R]

### 3.4 `prototypes-and-classes`, "Bloodlines"

- **Concept**: every object has a prototype; property lookup walks the prototype chain. `class` is syntax over
  prototypes (`typeof Cls === "function"`). `extends`, `super`, overriding, `instanceof`, `static`, `#private` fields,
  getters. A derived constructor must call `super()` before using `this`.
- **Visual**: an actor asks for `legs`; if its own bag doesn't have it, the question climbs to the parent actor
  standing behind it (the prototype), then to the grandparent.
- **Questions**:
  1. predict: `class Animal { speak() { return "..."; } } class Cat extends Animal { speak() { return "meow"; } } console.log(new Cat().speak(), new Cat() instanceof Animal);` → `meow true` [R]
  2. predict: `class Cat extends Animal { speak() { return super.speak() + "!"; } }` then `new Cat().speak()` → `...!` [R]
  3. predict: `const proto = { greet() { return "hi " + this.name; } }; const o = Object.create(proto); o.name = "Ada"; console.log(o.greet(), Object.hasOwn(o, "greet"));` → `hi Ada false` [R]
  4. predict: `class Cat {} console.log(Object.getPrototypeOf(new Cat()) === Cat.prototype, typeof Cat);` → `true function` [R]
  5. predict: `class Vault { #code = 42; reveal() { return this.#code; } } const v = new Vault(); console.log(v.reveal(), v.code);` → `42 undefined` [R]
  6. predict: `class M { static count = 0; } console.log(M.count, new M().count);` → `0 undefined` [R]
  7. predict: `class A {} class B extends A { constructor() { this.x = 1; } } new B();` → `ReferenceError` (must call `super()` first) [R]
  8. predict: `function Dog() {} Dog.prototype.legs = 4; const d = new Dog(); d.legs = 3; delete d.legs; console.log(d.legs);` → `4` [R]
  9. predict: `class P { get area() { return 6; } } console.log(new P().area);` → `6` [R]
- **Run**: starter
  ```js
  class Hero { constructor(name) { this.name = name; } }
  class Knight extends Hero {
    constructor(name) { this.armor = 5; }
  }
  const k = new Knight("Ada"); console.log(k.name, k.armor);
  ```
  throws `ReferenceError`. Solution: `super(name);` as the first line. `expect`: `Ada 5`. [R]

### 3.5 Boss `prototype-hydra`

1. predict: `console.log(["1", "2", "3"].map(parseInt).join(","));` → `1,NaN,NaN` (`map` passes the index as the radix) [R]
2. predict: `const a = { stats: { hp: 5 } }; const b = { ...a }; b.stats.hp = 9; console.log(a.stats.hp);` → `9` [R]
3. predict: `const a = [3, 1, 2]; const b = a.toSorted(); console.log(a === b, a.join(""));` → `false 312` [R]
4. predict: `[].reduce((a, b) => a + b);` → `TypeError` (empty array with no initial value) [R]
5. predict: `console.log([1, 2, 3].includes(2), [NaN].includes(NaN), [NaN].indexOf(NaN));` → `true true -1` [R]
6. predict: `function reset(h) { h = { hp: 0 }; } const hero = { hp: 7 }; reset(hero); console.log(hero.hp);` → `7` [R]
7. pick "Deep copy?": `{ ...obj }` / `Object.assign({}, obj)` / `structuredClone(obj)` → `structuredClone(obj)` [R]
8. predict: `console.log([[1, 2], [3]].flat().length);` → `3` [R]

## Region 4: `type-castle`, TypeScript: shapes, unions, generics and type tools

All `predict "Does it compile?"` beats here are `[TS]` claims (`check.compiles`). Type answers ("what type is `x`?")
are verified with the `Equal`/`Expect` helper.

### 4.1 `shapes-and-inference`, "The shape guard"

- **Concept**: annotations vs inference; literal types (`const x = 5` is type `5`, `let y = 5` is `number`); object
  types, `interface` vs `type`, optional `?` and `readonly`; arrays and tuples; **structural typing** (a value fits if
  it has the required shape) and the **excess property check** for fresh object literals; declaration merging (only
  interfaces); `as const` and `satisfies`.
- **Visual**: the type is a shield-shaped gate; values walk through. A gem with an extra facet passes when it was stored
  in a variable first (structural typing) but is stopped when thrown directly as a literal (excess property check).
- **Questions**:
  1. predict "Compiles?": `let hp = 10; hp = "ten";` → No (`hp` was inferred as `number`) [TS]
  2. predict "Compiles?": `interface Point { x: number; y: number } function len(p: Point) { return Math.hypot(p.x, p.y); } const v = { x: 3, y: 4, z: 9 }; console.log(len(v));` → Yes, prints `5` [TS][R]
  3. predict "Compiles?": same, but `len({ x: 3, y: 4, z: 9 });` → No: `TS2353 Object literal may only specify known properties, and 'z' does not exist in type 'Point'` [TS]
  4. type: `interface Hero { name: string; title___: string }` (optional) → `?` [TS]
  5. predict "Compiles?": `type User = { readonly id: number }; const u: User = { id: 1 }; u.id = 2;` → No (`TS2540`) [TS]
  6. predict "Compiles?": `const pair: [string, number] = ["hp", 10]; const n: number = pair[0];` → No [TS]
  7. predict "Compiles?": `let y = 5; const w: 5 = y;` → No (`y` widened to `number`); with `const x = 5; const z: 5 = x;` → Yes [TS]
  8. pick "Which can be declared twice and merged?": `interface` / `type` → `interface` (two `type Hero` → `TS2300 Duplicate identifier`) [TS]
  9. predict: `const dirs = ["up", "down"] as const; type Dir = typeof dirs[number];` → `Dir` is `"up" | "down"` [TS]
  10. predict "Compiles?": `const colors = { red: "#f00", blue: [0, 0, 255] } satisfies Record<string, string | number[]>; colors.red.toUpperCase();` → Yes; with a `: Record<...>` annotation instead → No (`TS2339`: `red` is `string | number[]`) [TS]
- **Run** (TS): starter
  ```ts
  interface Item { name: string; price: number; qty?: number }
  function total(items: Item[]): number {
    return items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }
  console.log(total([{ name: "gem", price: 5, qty: 2 }, { name: "key", price: 3 }]));
  ```
  prints `NaN`. Solution: `i.price * (i.qty ?? 1)`. `expect`: `13`. [R] (`tsc --strict` also rejects the starter:
  `TS18048 'i.qty' is possibly 'undefined'`.) [TS]

### 4.2 `unions-and-narrowing`, "Two-faced values"

- **Concept**: union types `A | B`, literal unions (`"up" | "down"`) as a lightweight enum; narrowing with `typeof`,
  `in`, `instanceof`, equality and truthiness; custom type guards `x is T`; discriminated unions with a `kind` tag;
  exhaustiveness with `never`; `unknown` (must narrow before use) vs `any` (turns checking off) vs `never` (no value);
  `strictNullChecks`.
- **Visual**: a value arrives wearing a mask (`string | number`); each `if (typeof ...)` check is a guard that removes
  the mask so the right methods unlock. `never` is an empty room: if anything reaches it, the guard raises the alarm.
- **Questions**:
  1. predict "Compiles?": `function len(x: string | number) { return x.length; }` → No (`TS2339`) [TS]
  2. pick: `function size(x: string | number) { if (typeof x === ___) return x.length; return x; }` → `"string"` [TS]
  3. predict "Compiles?": `type Dir = "up" | "down"; const d: Dir = "left";` → No [TS]
  4. predict "Compiles?": discriminated union `type Shape = { kind: "circle"; r: number } | { kind: "square"; side: number };` with a `switch (s.kind)` returning in both cases (function annotated `: number`) → Yes [TS]
  5. predict "Compiles?": add `| { kind: "tri"; base: number; h: number }` and `default: { const unreachable: never = s; return unreachable; }` → No: `Type '{ kind: "tri"; ... }' is not assignable to type 'never'` (the point: the compiler finds the missing case) [TS]
  6. predict "Compiles?": `function first(xs: string[]) { return xs.find(x => x.startsWith("a")).toUpperCase(); }` → No: `TS2532 Object is possibly 'undefined'` [TS]
  7. predict "Compiles?": `function f(x: unknown) { return x.length; }` → No (`TS18046 'x' is of type 'unknown'`); with `x: any` → Yes [TS]
  8. type: `function isString(x: unknown): x ___ string { return typeof x === "string"; }` → `is` [TS]
  9. pick: `function move(p: Fish | Bird) { if ("swim" ___ p) p.swim(); else p.fly(); }` → `in` [TS]
  10. predict: `function show(x: string | number) { return typeof x === "number" ? x.toFixed(1) : x.toUpperCase(); } console.log(show(2), show("a"));` → `2.0 A` [R]
- **Run** (TS): starter
  ```ts
  function label(count?: number): string {
    return count ? `x${count}` : "none";
  }
  console.log(label(3), label(0), label());
  ```
  prints `x3 none none` (truthiness narrowing drops `0`). Solution: `count !== undefined ? ... : "none"`.
  `expect`: `x3 x0 none`. [R]

### 4.3 `generics`, "The shape-shifting chest"

- **Concept**: generic functions and types `<T>`; inference of `T` from arguments; constraints `T extends ...`;
  `keyof`, `typeof` (type query), indexed access `T[K]`; `K extends keyof T`; default type parameters; generic classes.
- **Visual**: a chest that takes the shape of whatever goes in (`T`); a constrained chest has a keyhole (`extends
  { length: number }`) and rejects items without that notch.
- **Questions**:
  1. predict "What is the type of `n`?": `function first<T>(xs: T[]): T | undefined { return xs[0]; } const n = first([1, 2]);` → `number | undefined` [TS]
  2. predict "Compiles?": `function len<T>(x: T) { return x.length; }` → No (`TS2339 Property 'length' does not exist on type 'T'`) [TS]
  3. pick: `function len<T extends ___>(x: T) { return x.length; }` → `{ length: number }`; then `len(5)` → No, `len("abc")` → Yes [TS]
  4. pick: `function getProp<T, K extends ___>(obj: T, key: K): T[K] { return obj[key]; }` → `keyof T` [TS]
  5. predict "Compiles?": `getProp({ hp: 1 }, "mp");` → No (`'"mp"' is not assignable to parameter of type '"hp"'`) [TS]
  6. predict: `type Hero = { name: string; hp: number }; type HP = Hero["hp"];` → `number` [TS]
  7. predict: `const config = { port: 80 }; type Config = typeof config;` → `{ port: number }` [TS]
  8. predict: `type K = keyof { a: 1; b: 2 };` → `"a" | "b"` [TS]
  9. predict "Compiles?": `type Res<T = string> = { data: T }; const r: Res = { data: 1 };` → No (default `T` is `string`) [TS]
  10. predict: `class Box<T> { value: T; constructor(v: T) { this.value = v; } } const b = new Box("gem");` → `b.value` is `string` [TS] (avoid `constructor(public value: T)`: Node type stripping rejects parameter properties)
- **Run** (TS): starter
  ```ts
  function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
    return items.map(i => i.key);
  }
  console.log(pluck([{ name: "Ada" }, { name: "Bo" }], "name").join(","));
  ```
  prints `,` (two `undefined`). Solution: `i[key]`. `expect`: `Ada,Bo`. [R] (`tsc` also rejects the starter:
  `TS2339 Property 'key' does not exist on type 'T'`.) [TS]

### 4.4 `type-transformers`, "The type forge"

- **Concept**: utility types (`Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`,
  `NonNullable`, `Exclude`, `Extract`); `ReturnType<typeof fn>` needs `typeof`; mapped types `{ [K in keyof T]: ... }`;
  conditional types `T extends U ? X : Y` (distributive over unions); `infer`.
- **Visual**: a forge where a type (gem) goes in and a reshaped gem comes out: `Partial` sands every facet to
  "optional", `Pick` cuts facets out, `Omit` grinds one away.
- **Questions**:
  1. predict "Compiles?": `type Hero = { name: string; hp: number }; const patch: Partial<Hero> = { hp: 5 };` → Yes [TS]
  2. predict "Compiles?": `const h: Pick<Hero, "name"> = { name: "A", hp: 1 };` → No (`TS2353`) [TS]
  3. pick: `type NoHp = ___<Hero, "hp">;` (result `{ name: string }`) → `Omit` [TS]
  4. predict "Compiles?": `type Inv = Record<"gem" | "key", number>; const i: Inv = { gem: 1 };` → No (`TS2741 Property 'key' is missing`) [TS]
  5. predict "Compiles?": `function make() { return { id: 1 }; } type M = ReturnType<make>;` → No: `TS2749 'make' refers to a value... Did you mean 'typeof make'?` [TS]
  6. predict: `type Flags<T> = { [K in keyof T]: boolean }; type F = Flags<{ a: string; b: number }>;` → `{ a: boolean; b: boolean }` [TS]
  7. predict: `type IsStr<T> = T extends string ? "yes" : "no"; type A = IsStr<"hi">;` → `"yes"` [TS]
  8. predict: `type B = IsStr<string | number>;` → `"yes" | "no"` (distributes over the union) [TS]
  9. type: `type ElementOf<T> = T extends (___ U)[] ? U : never;` → `infer` (`ElementOf<string[]>` is `string`) [TS]
  10. predict "Compiles?": `type Hero = { name: string; hp?: number }; const h: Required<Hero> = { name: "a" };` → No [TS]
- **Run** (TS): starter
  ```ts
  function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const out = {} as Pick<T, K>;
    for (const k in keys) out[k] = obj[k];
    return out;
  }
  console.log(JSON.stringify(pick({ name: "Ada", hp: 10, mp: 3 }, ["name", "hp"])));
  ```
  prints `{}` (`for...in` walks the indexes `"0"`, `"1"`). Solution: `for (const k of keys)`.
  `expect`: `{"name":"Ada","hp":10}`. [R] (`tsc` also rejects the starter with `TS7053`.) [TS]

### 4.5 Boss `type-titan`

1. predict "Compiles?": `type Brand<T, B> = T & { __brand: B }; type UserId = Brand<string, "UserId">; function load(id: UserId) {} load("abc");` → No (branded types break structural equality) [TS]
2. predict "Compiles?": ``type Route = `/${"users" | "posts"}/${number}`; const bad: Route = "/teams/1";`` → No [TS]
3. predict: `type MyAwaited<T> = T extends Promise<infer U> ? U : T;` `MyAwaited<Promise<number>>` → `number` [TS]
4. predict "Compiles?": `let s = "a" as number;` → No (`TS2352`); `"a" as unknown as number` → Yes [TS]
5. predict "Compiles?": `const o = { kind: "circle" }; type S = { kind: "circle" | "square" }; const s: S = o;` → No (`kind` widened to `string`); with `as const` → Yes [TS]
6. predict "Compiles?": `const p = { x: 1 } satisfies { x: number; y: number };` → No (`TS1360 ... does not satisfy the expected type`) [TS]
7. predict "Compiles?": `const obj = { a: 1, b: 2 }; for (const k in obj) { console.log(obj[k]); }` → No (`k` is `string`, `TS7053`) [TS]
8. predict "Compiles?": `try { JSON.parse("x"); } catch (err) { return err.message; }` → No (`err` is `unknown` under `--strict`) [TS]
9. predict "Compiles?": `type IsStr<T> = [T] extends [string] ? "yes" : "no";` then `IsStr<string | number>` is `"no"` → Yes (wrapping in a tuple stops distribution) [TS]

## Region 5: `event-loop-tower`, Timers, promises, async/await and the event loop

### 5.1 `callbacks-and-timers`, "Later, not now"

- **Concept**: JavaScript runs one thing at a time (single thread, call stack). `setTimeout` schedules a callback for
  later, even with `0` ms; callbacks; `clearTimeout`; long synchronous work delays timers.
- **Visual**: the hero (call stack) finishes every line in hand; a timer callback is a scroll handed to the enemy
  (timer queue) that is read only when the hero's hands are empty. `print` shows the order.
- **Questions**:
  1. predict: `console.log("A"); setTimeout(() => console.log("B"), 0); console.log("C");` → `A` `C` `B` [R]
  2. predict: `setTimeout(() => console.log("1"), 100); setTimeout(() => console.log("2"), 0);` → `2` `1` [R]
  3. predict: `setTimeout(() => console.log("x"), 0); for (let i = 0; i < 1e7; i++) {} console.log("y");` → `y` `x` [R]
  4. predict: `function load(cb) { setTimeout(() => cb("data"), 0); } load(d => console.log(d)); console.log("waiting");` → `waiting` `data` [R]
  5. predict: `const t = setTimeout(() => console.log("boom"), 0); clearTimeout(t); console.log("safe");` → `safe` [R]
  6. pick "Runs first?": `setTimeout(f, 0)` / the next line of synchronous code → the next line [R]
- **Run**: starter `let ready = false;` / `setTimeout(() => { ready = true; }, 0);` /
  `console.log(ready ? "go" : "wait");` prints `wait`. Solution: log inside the callback
  (`setTimeout(() => { ready = true; console.log(ready ? "go" : "wait"); }, 0);`). `expect`: `go`. [R]

### 5.2 `promises`, "Sealed scrolls"

- **Concept**: a promise is pending, then fulfilled or rejected, exactly once. The executor runs synchronously.
  `.then` returns a new promise with the callback's return value; a thrown error skips to the next `.catch`;
  `.finally` passes the value through. Combinators: `Promise.all` (fails fast), `allSettled`, `race`, `any`.
- **Visual**: a sealed scroll; `then` chains scrolls in a line; a burned scroll (rejection) is passed down the line
  until a `catch` actor extinguishes it.
- **Questions**:
  1. predict: `new Promise(r => { console.log("A"); r(); }); console.log("B");` → `A` `B` [R]
  2. predict: `Promise.resolve(1).then(x => x + 1).then(x => console.log(x));` → `2` [R]
  3. predict: `Promise.resolve(1).then(() => { throw new Error("boom"); }).then(() => console.log("skipped")).catch(e => console.log(e.message));` → `boom` [R]
  4. predict: `Promise.all([Promise.resolve(1), Promise.reject(new Error("no")), Promise.resolve(3)]).then(console.log).catch(e => console.log("fail:", e.message));` → `fail: no` [R]
  5. predict: `Promise.allSettled([Promise.resolve(1), Promise.reject(new Error("no"))]).then(r => console.log(r.map(x => x.status).join(",")));` → `fulfilled,rejected` [R]
  6. predict: `Promise.race([new Promise(r => setTimeout(() => r("slow"), 50)), new Promise(r => setTimeout(() => r("fast"), 10))]).then(console.log);` → `fast` [R]
  7. predict: `new Promise(r => { r("first"); r("second"); }).then(console.log);` → `first` [R]
  8. predict: `Promise.resolve(5).then(x => { x * 2; }).then(v => console.log(v));` → `undefined` [R]
  9. predict: `Promise.resolve("ok").finally(() => "ignored").then(v => console.log(v));` → `ok` [R]
  10. pick "Returns the first success and ignores failures": `Promise.all` / `Promise.race` / `Promise.any` / `Promise.allSettled` → `Promise.any` [R: `Promise.any([Promise.reject(new Error("a")), Promise.resolve(2)])` → `2`]
- **Run**: starter `function fetchLevel() { return Promise.resolve(3); }` /
  `fetchLevel().then(lv => { lv * 10; }).then(xp => console.log("xp:", xp));` prints `xp: undefined`.
  Solution: `then(lv => lv * 10)`. `expect`: `xp: 30`. [R]

### 5.3 `async-await`, "Waiting spells"

- **Concept**: an `async` function always returns a promise; `await` pauses that function (not the program);
  `try/catch` around `await`; forgetting `await`; `forEach` doesn't wait for async callbacks (use `for...of` or
  `Promise.all`); sequential vs parallel awaits.
- **Visual**: the `async` function actor steps aside (`exit`) at each `await`, letting others act, and comes back
  (`enter`) when the scroll opens.
- **Questions**:
  1. predict: `async function f() { return 1; } console.log(f() instanceof Promise); f().then(v => console.log(v));` → `true` `1` [R]
  2. predict: `async function main() { try { await Promise.reject(new Error("bad")); } catch (e) { console.log("caught", e.message); } } main();` → `caught bad` [R]
  3. predict: `async function getHp() { return 7; } async function main() { const hp = getHp(); console.log(hp + 1); } main();` → `[object Promise]1` [R]
  4. predict: `async function f() { console.log("2"); await null; console.log("4"); } console.log("1"); f(); console.log("3");` → `1` `2` `3` `4` [R]
  5. predict: `const wait = ms => new Promise(r => setTimeout(r, ms)); async function main() { [1, 2].forEach(async n => { await wait(10); console.log(n); }); console.log("done"); } main();` → `done` `1` `2` [R]
  6. pick "Runs both waits at the same time (≈100 ms total)": `await wait(100); await wait(100);` / `await Promise.all([wait(100), wait(100)]);` → the `Promise.all` one [R: measured ≈200 ms vs ≈100 ms]
  7. type: `const [a, b] = await Promise.___([loadA(), loadB()]);` → `all` [R]
  8. order: `async function load() {` / `try {` / `const res = await fetchHero();` / `return res.name;` / `} catch (e) {` / `return "unknown";` / `}` / `}` [R]
- **Run**: starter
  ```js
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  async function loadAll() {
    const results = [];
    [1, 2, 3].forEach(async (n) => { await wait(5); results.push(n * 2); });
    return results;
  }
  loadAll().then(r => console.log("[" + r.join(",") + "]"));
  ```
  prints `[]`. Solution: `return Promise.all([1, 2, 3].map(async (n) => { await wait(5); return n * 2; }));` (or a
  `for...of` with `await`). `expect`: `[2,4,6]`. [R]

### 5.4 `the-event-loop`, "The three queues"

- **Concept**: the loop: run all synchronous code (call stack) → drain **all** microtasks (promise callbacks,
  `await` continuations, `queueMicrotask`) → run **one** macrotask (a timer, an I/O callback, an event) → drain
  microtasks again → (browser may render) → repeat. Microtasks queued by microtasks run in the same drain.
- **Visual**: hero = call stack, ally = microtask queue (VIP line), enemy = timer queue. After the hero's hands are
  empty, the whole VIP line goes before a single enemy scroll is read.
- **Questions**:
  1. predict: `console.log("A"); setTimeout(() => console.log("B"), 0); Promise.resolve().then(() => console.log("C")); console.log("D");` → `A D C B` [R]
  2. predict: `setTimeout(() => console.log("T"), 0); queueMicrotask(() => console.log("M")); console.log("S");` → `S M T` [R]
  3. predict: `setTimeout(() => { console.log("t1"); Promise.resolve().then(() => console.log("p1")); }, 0); setTimeout(() => console.log("t2"), 0);` → `t1 p1 t2` [R]
  4. predict: `Promise.resolve().then(() => console.log(1)).then(() => console.log(2)); Promise.resolve().then(() => console.log(3)).then(() => console.log(4));` → `1 3 2 4` [R]
  5. predict:
     ```js
     async function a() { console.log("a1"); await b(); console.log("a2"); }
     async function b() { console.log("b"); }
     console.log("s"); a(); Promise.resolve().then(() => console.log("p")); console.log("e");
     ```
     → `s a1 b e a2 p` [R]
  6. predict: `setTimeout(() => console.log("A"), 0); Promise.resolve().then(() => { console.log("B"); setTimeout(() => console.log("C"), 0); Promise.resolve().then(() => console.log("D")); });` → `B D A C` [R]
  7. predict: `const p = new Promise((resolve) => { console.log(1); setTimeout(() => { console.log(2); resolve(); }, 0); console.log(3); }); p.then(() => console.log(4)); console.log(5);` → `1 3 5 2 4` [R]
  8. pick "What happens?": `function loop() { Promise.resolve().then(loop); } loop(); setTimeout(() => console.log("never"), 0);` → the timer never runs (microtasks starve the loop) [Doc: MDN microtask guide; do not execute]
- **Run**: starter `setTimeout(() => console.log("B"), 0);` / `Promise.resolve().then(() => console.log("C"));` /
  `console.log("A");` prints `A C B`. Task: "make it print A, B, C without reordering lines": put `"B"` in the
  microtask and `"C"` in the timer. `expect`: `A\nB\nC`. [R]

### 5.5 Boss `event-loop-kraken`

1. predict: `console.log(1); setTimeout(() => console.log(2)); Promise.resolve().then(() => console.log(3)); (async () => { console.log(4); await null; console.log(5); })(); console.log(6);` → `1 4 6 3 5 2` [R]
2. predict: `async function f() { return Promise.resolve("x"); } f().then(v => console.log(v)); Promise.resolve().then(() => console.log("a")).then(() => console.log("b")).then(() => console.log("c"));` → `a b x c` (returning a promise from an `async` function costs extra ticks) [R]
3. predict: `async function fail() { throw new Error("x"); } async function a() { try { return fail(); } catch { return "caught"; } } a().catch(() => "escaped").then(console.log);` → `escaped`; with `return await fail()` → `caught` [R]
4. pick (debounce): `function debounce(fn, ms) { let t; return (...a) => { ___; t = setTimeout(() => fn(...a), ms); }; }` → `clearTimeout(t)` [R]
5. predict: with that debounce, `const log = debounce(x => console.log(x), 10); log("a"); log("b"); log("c");` → `c` [R]
6. predict: `function throttle(fn, ms) { let last = 0; return (...a) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...a); } }; } const t = throttle(x => console.log(x), 1000); t("a"); t("b"); t("c");` → `a` [R]
7. predict: `Promise.resolve(1).then(2).then(v => console.log(v));` → `1` (a non-function `then` argument is ignored) [R]
- **Boss run** (machine-coding style): starter debounce without `clearTimeout`:
  ```js
  function debounce(fn, ms) { let t; return (...a) => { t = setTimeout(() => fn(...a), ms); }; }
  const calls = []; const log = debounce(x => calls.push(x), 10);
  log("a"); log("b"); log("c");
  setTimeout(() => console.log("calls: " + calls.join(",")), 50);
  ```
  prints `calls: a,b,c`. Solution: `clearTimeout(t);` before scheduling. `expect`: `calls: c`. [R]

---

# Part B: React moon

The moon assumes Regions 1-3 of the planet (functions, closures, objects, spread, array methods). Snippets are JSX
(JavaScript); `(TS)` marks TypeScript ones checked with `tsc --strict --jsx react-jsx` and `@types/react` 19.

| # | Region slug | Theme | Big idea | Lessons |
|---|---|---|---|---|
| 1 | `jsx-village` | village | JSX, components, props, lists | 3 + boss |
| 2 | `state-forest` | forest | State, events, immutable updates, sharing state | 4 + boss |
| 3 | `effect-peaks` | mountain | Effects, cleanup, refs, data fetching | 4 + boss |
| 4 | `render-tower` | tower | Context, reducers, memoization, custom hooks, Suspense | 4 + boss |

Exam-only React topics (no region yet): `rendering` (reconciliation, batching, StrictMode as a whole topic),
`server_components`, `testing`, `accessibility`, `performance`, `security`.

Visual mapping for the moon:

| React idea | On stage |
|---|---|
| Component | An actor; rendering = the actor steps forward and `print`s its HTML |
| Props | Items the parent `give`s to the child (read-only: the child can't repaint them) |
| State | A `value` chip in the actor's own backpack that survives re-renders |
| Re-render | The actor flashes (`banner` "RENDER") and prints again |
| Key | The `tag` that lets React recognise the same actor after a shuffle |
| Effect | After the scene is printed, the actor does a chore (`say`); cleanup = `drop` |
| Ref | A pocket notebook (`scroll`) that changes silently, with no flash |
| Context | A `banner` broadcast from an ancestor that every listening actor hears |
| `memo` | A `shield` that blocks a re-render when the props items are the same objects |
| Suspense | A fog curtain with a "Loading…" sign until the item arrives |

## Region 1: `jsx-village`, JSX, components and props

### 1.1 `jsx-basics`, "Markup that thinks"

- **Concept**: JSX is JavaScript that describes UI; `{}` embeds an expression; `className` instead of `class`;
  one parent element or a fragment `<>...</>`; `style` takes an object; what renders: strings and numbers yes,
  `true` / `false` / `null` / `undefined` render nothing, `0` renders `0`; text is escaped.
- **Visual**: the hero writes a spell on a board; `{}` are glowing slots where a chip is dropped in.
- **Questions**:
  1. predict: `const name = "Ada"; <h1>Hi {name}</h1>` → `<h1>Hi Ada</h1>` [React]
  2. predict: `<p>{2 + 3}</p>` → `<p>5</p>` [React]
  3. pick: `<div ___="card">` options `className` / `class` / `css` → `className` (`class` still renders but warns in development) [React][Doc]
  4. predict: `<p>{true}{null}{undefined}{false}</p>` → `<p></p>` [React]
  5. predict: `<p>{0 && "items"}</p>` → `<p>0</p>` [React]
  6. predict "Does it compile?" (TS): `function Card() { return <h1>Title</h1><p>Body</p>; }` → No: `TS2657 JSX expressions must have one parent element.` [TS]
  7. predict: `<div style={{ color: "red", fontSize: 12 }}>x</div>` → `<div style="color:red;font-size:12px">x</div>` [React]
  8. predict: `<p>{["a", "b"]}</p>` → `<p>ab</p>` [React]
  9. predict: `const evil = "<script>alert(1)</script>"; <p>{evil}</p>` → `<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>` (escaped, safe) [React]
- **Run**: starter `function Card() { return <h1>Title</h1><p>Body</p>; }` /
  `console.log(renderToStaticMarkup(<Card />));` (syntax error). Solution: wrap in `<>...</>`.
  `expect`: `<h1>Title</h1><p>Body</p>`. [React]

### 1.2 `components-and-props`, "Actors and their gifts"

- **Concept**: a component is a function that returns JSX; its name must start with a capital letter; props are its
  arguments (destructured), read-only; `children`; default values; spreading props; numbers vs strings in props;
  one-way data flow.
- **Visual**: the parent actor `give`s items (props) to a child; the child can use them but trying to repaint one makes
  it `shake` ("props are read-only").
- **Questions**:
  1. predict: `function Hello({ name }) { return <p>Hi {name}</p>; }` `<Hello name="Bo" />` → `<p>Hi Bo</p>` [React]
  2. predict: `function hello() { return <p>Hi</p>; }` `<hello />` → `<hello></hello>` (lower case = an HTML tag, not your component) [React]
  3. predict: `function Box({ children }) { return <div>{children}</div>; }` `<Box><b>x</b></Box>` → `<div><b>x</b></div>` [React]
  4. predict: `function Btn({ label = "OK" }) { return <button>{label}</button>; }` `<Btn />` → `<button>OK</button>` [React]
  5. predict: `function Stat({ value }) { return <b>{value + 1}</b>; }` `<><Stat value="3" /><Stat value={3} /></>` → `<b>31</b><b>4</b>` [React]
  6. predict: `const props = { name: "Cy" };` `<Hello {...props} />` → `<p>Hi Cy</p>` [React]
  7. predict "Does it compile?" (TS): `type Props = { name: string }; function Hello({ name }: Props) {...}` `<Hello />` → No: `TS2741 Property 'name' is missing` [TS]
  8. pick (TS): `function Box({ children }: { children: ___ })` → `ReactNode` [TS]
  9. pick "A child wants to change a prop. It should…": mutate `props.x` / ask the parent through a callback prop → the callback [Doc: react.dev "Passing props"]
- **Run**: starter `function Badge({ label }) { return <span>{props.label}</span>; }` /
  `console.log(renderToStaticMarkup(<Badge label="MVP" />));` → `ReferenceError: props is not defined`.
  Solution: `{label}`. `expect`: `<span>MVP</span>`. [React]

### 1.3 `lists-and-keys`, "Roll call"

- **Concept**: render arrays with `map`; every item needs a stable, unique-among-siblings `key` (not rendered to HTML);
  why array index keys break when items are inserted/reordered (state sticks to the position); conditional rendering
  with `&&`, ternaries, and returning `null`.
- **Visual**: a line of actors with name `tag`s (keys). Shuffling the line: with real keys each actor keeps its
  backpack; with index keys the backpacks stay in place and end up on the wrong actor.
- **Questions**:
  1. predict: `<ul>{["a", "b"].map(x => <li key={x}>{x}</li>)}</ul>` → `<ul><li>a</li><li>b</li></ul>` (no `key` in the HTML) [React]
  2. predict: `function Item({ done }) { if (done) return null; return <li>todo</li>; }` `<ul><Item done /><Item done={false} /></ul>` → `<ul><li>todo</li></ul>` [React]
  3. predict: `const items = []; <div>{items.length && <ul />}</div>` → `<div>0</div>` (fix: `items.length > 0 &&`) [React]
  4. predict: `function Greeting({ isLoggedIn }) { return <p>{isLoggedIn ? "Welcome back" : "Please sign in"}</p>; }` `<Greeting isLoggedIn={false} />` → `<p>Please sign in</p>` [React]
  5. pick "Best key for todos loaded from a server": `todo.id` / array index / `Math.random()` → `todo.id` [Doc: react.dev "Rendering lists"]
  6. pick "Using the index as key while inserting at the top of a list of inputs…": the typed text stays at the old position and appears on the wrong item / React throws an error → the first [Doc]
  7. pick "Keys must be unique…": among siblings / in the whole app → among siblings [Doc]
  8. predict: `function List() { return [<li key="a">a</li>, <li key="b">b</li>]; }` `<ul><List /></ul>` → `<ul><li>a</li><li>b</li></ul>` (a component may return an array) [React]
- **Run**: starter `<ul>{items.map(i => { <li key={i.id}>{i.name}</li> })}</ul>` with
  `items = [{ id: 1, name: "Sword" }, { id: 2, name: "Shield" }]` renders `<ul></ul>`. Solution: remove the braces
  (or `return`). `expect`: `<ul><li>Sword</li><li>Shield</li></ul>`. [React]

### 1.4 Boss `jsx-gremlin`

1. predict: `<p>{[1, 2, 3].length > 0 && "has items"}</p>` → `<p>has items</p>` [React]
2. predict: `const [user] = useState({ name: "Ada" }); return <p>{user}</p>;` → throws: `Objects are not valid as a React child` [React]
3. predict: `function Card({ title, children }) { return <section><h2>{title}</h2>{children}</section>; }` `<Card title="Bag"><p>gem</p></Card>` → `<section><h2>Bag</h2><p>gem</p></section>` [React]
4. type: `<label ___="email">Email</label>` → `htmlFor` (renders `for="email"`) [React]
5. predict: `<p>{0 && "items"}</p>` → `<p>0</p>` [React]
6. predict: `<a href="javascript:alert(1)">x</a>` → React 19 replaces the URL with one that throws "React has blocked a javascript: URL as a security precaution." [React]
7. predict "Does it compile?" (TS): `type Props = { variant: "link"; href: string } | { variant: "button"; onClick: () => void };` `<Action variant="link" onClick={() => {}} />` → No [TS]

## Region 2: `state-forest`, State, events and sharing

### 2.1 `use-state`, "Memory crystals"

- **Concept**: a local variable resets every render and doesn't trigger one; `useState` keeps a value between renders
  and setting it schedules a re-render. State is a **snapshot**: inside one render `count` never changes. Multiple
  setters in one event are **batched**; `setCount(c => c + 1)` (updater) queues a function of the previous value.
  `useState(init)` vs `useState(() => init())` (lazy initializer). Setting the same value (`Object.is`) skips the
  render. Typing: `useState<string[]>([])`.
- **Visual**: the actor's backpack crystal (`value` chip). Clicking queues notes on a board; React reads the whole
  board at once after the handler finishes, then the actor flashes once.
- **Questions**:
  1. predict "After one click, what shows?": `onClick={() => { setCount(count + 1); setCount(count + 1); setCount(count + 1); }}` (starts at 0) → `1` [Doc: react.dev "Queueing a series of state updates"]
  2. predict: same with `setCount(c => c + 1)` three times → `3` [Doc]
  3. predict: `setCount(count + 5); alert(count);` (count is 0) → alerts `0` [Doc: "State as a snapshot"]
  4. predict: `setNumber(number + 5); setNumber(n => n + 1);` from 0 → `6` [Doc]
  5. predict: `function C() { const [n] = useState(10); return <p>{n}</p>; }` → `<p>10</p>` [React]
  6. pick "Runs `init` only on the first render": `useState(init())` / `useState(init)` → `useState(init)` [React: called once] [Doc]
  7. pick "Why doesn't the UI update?": `let count = 0; <button onClick={() => count++}>` → local variables don't survive renders and don't trigger them [Doc]
  8. predict "Does it compile?" (TS): `const [items, setItems] = useState([]); setItems(["a"]);` → No: `TS2322 Type 'string' is not assignable to type 'never'`; fix `useState<string[]>([])` [TS]
  9. type: `const [hp, ___] = useState(10);` → `setHp` (convention) [Doc]
- **Run** (pure logic, the react.dev challenge "implement the state queue"): starter
  ```js
  function getFinalState(base, queue) {
    let state = base;
    for (const update of queue) { state = update; }
    return state;
  }
  console.log(getFinalState(0, [1, n => n + 1, n => n * 10]));
  ```
  prints `[Function (anonymous)]`. Solution: `state = typeof update === "function" ? update(state) : update;`.
  `expect`: `20`. [R]

### 2.2 `events-and-forms`, "Buttons and runes"

- **Concept**: pass a function to `onClick` (don't call it); passing arguments with an arrow; event handlers are not in
  the HTML; `e.preventDefault()` on submit; `e.stopPropagation()`; controlled inputs (`value` + `onChange`, React
  owns the value) vs uncontrolled (`defaultValue`, the DOM owns it, read with a ref); checkboxes use `checked`;
  typing `React.ChangeEvent<HTMLInputElement>`.
- **Visual**: handing the button a spell scroll (function) vs casting the spell immediately while building the button.
- **Questions**:
  1. pick: `<button onClick={___}>` to run `handleClick` on click: `handleClick` / `handleClick()` → `handleClick` [Doc]
  2. pick: delete item `id` on click: `onClick={() => remove(id)}` / `onClick={remove(id)}` → the arrow [Doc]
  3. predict: `<button onClick={() => {}}>Go</button>` → `<button>Go</button>` [React]
  4. predict: `<input defaultValue="Ada" />` → `<input value="Ada"/>` [React]
  5. type: `onChange={e => setName(e.target.___)}` → `value` [Doc]
  6. pick "An input with `value={name}` and no `onChange`…": is read-only (React warns) / works normally → read-only [Doc: react.dev `<input>`]
  7. pick "Stop the form from reloading the page": `e.preventDefault()` / `e.stopPropagation()` → `preventDefault` [Doc]
  8. pick "Child button and parent div both have onClick. A click on the button runs…": button then div / div then button / only the button → button then div (bubbling) [Doc: react.dev "Responding to events"]
  9. predict "Does it compile?" (TS): `<input value={v} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setV(e.target.value)} />` → Yes [TS]
- **Run**: starter
  ```jsx
  function Button({ onPress, label }) { return <button onClick={onPress()}>{label}</button>; }
  const log = [];
  renderToStaticMarkup(<Button label="Save" onPress={() => log.push("saved")} />);
  console.log("calls during render:", log.length);
  ```
  prints `calls during render: 1`. Solution: `onClick={onPress}`. `expect`: `calls during render: 0`. [React]

### 2.3 `updating-objects-and-arrays`, "Never scratch the crystal"

- **Concept**: treat state as immutable: React compares by reference (`Object.is`), so mutating and setting the same
  object does nothing. Objects: `{ ...obj, field }`, nested spread. Arrays: add `[...a, x]`, remove `filter`, update
  `map`, sort a copy (`toSorted` / `[...a].sort()`); avoid `push`, `splice`, `sort`, `reverse` on state.
- **Visual**: to change the gem you `clone` it, change the clone, and hand the new gem over; scratching the old gem
  in place leaves React staring at the same gem: no flash.
- **Questions**:
  1. pick "Triggers a re-render": `hero.hp = 5; setHero(hero);` / `setHero({ ...hero, hp: 5 });` → the spread [Doc: "Updating objects in state"]
  2. pick: add an item: `setItems([...items, item])` / `items.push(item); setItems(items)` → the spread [Doc]
  3. pick: remove `id`: `items.filter(i => i.id !== id)` / `items.splice(i, 1)` → `filter` [Doc]
  4. predict: `const a = [{ id: 1, done: false }]; const b = a.map(t => t.id === 1 ? { ...t, done: true } : t); console.log(a[0].done, a === b);` → `false false` [R]
  5. pick: update a nested city: `{ ...p, address: { ...p.address, city } }` / `{ ...p, city }` → the nested spread [Doc]
  6. pick "Sort the list in state": `items.sort()` / `items.toSorted()` → `toSorted` [R: `sort` mutates and returns the same array]
  7. predict: `function updateField(form, event) { return { ...form, [event.target.name]: event.target.value }; }` with `{ target: { name: "user", value: "ada" } }` → returns a new object with `user: "ada"` [R]
- **Run**: starter
  ```js
  function toggle(todos, id) {
    const t = todos.find(t => t.id === id); t.done = !t.done; return todos;
  }
  const before = [{ id: 1, done: false }, { id: 2, done: false }];
  const after = toggle(before, 2);
  console.log(after === before, before[1].done, after[1].done);
  ```
  prints `true true true` (same array, old state mutated). Solution:
  `return todos.map(t => t.id === id ? { ...t, done: !t.done } : t);`. `expect`: `false false true`. [R]

### 2.4 `sharing-state`, "One source of truth"

- **Concept**: lifting state up to the closest common parent and passing value + callback down; don't copy props into
  state; compute derived values during render; state is tied to a component's **position** in the tree: same type at
  the same position keeps its state, a different `key` resets it; never define a component inside another component;
  composition with `children` to avoid prop drilling.
- **Visual**: two siblings each held their own crystal and disagreed; the parent takes one crystal and `give`s both a
  reflection of it.
- **Questions**:
  1. pick "Two sibling panels must show the same `active` value": duplicate state in both / move it to the parent → the parent [Doc: "Sharing state between components"]
  2. pick: `fullName` from `first` and `last`: a third state + effect / `const fullName = first + " " + last;` → compute it [Doc: "Choosing the state structure"]
  3. pick "`{isFancy ? <Counter isFancy /> : <Counter />}` toggles. Counter's state…": is kept / resets → kept (same type, same position) [Doc: "Preserving and resetting state"]
  4. pick "Reset a form when `userId` changes": `<Form key={userId} />` / an effect that clears every field → `key` [Doc]
  5. pick "Defining `function Input()` inside `function Form()`…": resets Input's state on every render / is fine → resets [Doc]
  6. predict: `function Display({ value }) { return <b>{value}</b>; }` in `Panel` with `useState(7)` and two `<Display value={level} />` → `<div><b>7</b><b>7</b></div>` [React]
  7. pick "Avoid passing `user` through 5 layers": context or composition with `children` / global variables → context or composition [Doc]
- **Run**: starter
  ```jsx
  function Display({ value }) { const [v] = useState(0); return <b>{v}</b>; }
  function Panel() { const [level] = useState(7); return <div><Display value={level} /><Display value={level} /></div>; }
  console.log(renderToStaticMarkup(<Panel />));
  ```
  renders `<div><b>0</b><b>0</b></div>`. Solution: use the prop (`return <b>{value}</b>;`).
  `expect`: `<div><b>7</b><b>7</b></div>`. [React]

### 2.5 Boss `state-shade`

1. predict "After one click": `setNumber(number + 5); setNumber(n => n + 1); setNumber(42);` from 0 → `42` [Doc]
2. predict: the mutating `toggle` → `true true true` [R]
3. pick "Why might `setList(list)` after `list.push(x)` not update?": same reference, `Object.is` says nothing changed / push is async → the first [Doc]
4. predict: `function useToggle(initial) { const [on] = useState(initial); ... }` `useToggle(true)` + `useToggle(false)` → `<p>ON-OFF</p>` (each call has its own state) [React]
5. pick "Read an uncontrolled input's value on submit": `useRef` on the input / `useState` without `onChange` → `useRef` [Doc]
6. pick "React 18+ batches updates…": only inside React event handlers / also in timeouts, promises and native handlers → everywhere (automatic batching) [Doc: react.dev "Queueing a series of state updates"; React 18 release notes]

## Region 3: `effect-peaks`, Effects, refs and data fetching

### 3.1 `effects-and-cleanup`, "Chores after the show"

- **Concept**: rendering must be pure; side effects that synchronise with something outside React go in
  `useEffect`, which runs **after** the commit (never during a server render). Dependencies: none → after every
  render; `[]` → after mount; `[a, b]` → when `a` or `b` changed (compared with `Object.is`). Cleanup runs before the
  next effect and on unmount. In development, StrictMode mounts, unmounts and mounts again to expose missing cleanup.
  Objects/functions created during render are new every time, so as dependencies they re-run the effect.
- **Visual**: the actor prints its HTML first, then does a chore (`say` "connect"). When the dependency chip changes,
  the actor first undoes the previous chore (`drop`, "disconnect") and then does the new one.
- **Questions**:
  1. predict: `function C() { useEffect(() => { console.log("effect"); }); return <p>x</p>; }` rendered with `renderToStaticMarkup` → prints only `<p>x</p>` (effects don't run on the server) [React]
  2. pick "Runs only after the first render": `useEffect(fn)` / `useEffect(fn, [])` / `useEffect(fn, [x])` → `[]` [Doc]
  3. pick "When does the cleanup run?": before the next effect and on unmount / only on unmount → the first [Doc: "Synchronizing with effects"]
  4. predict "Development + StrictMode, an effect logs connect and its cleanup logs disconnect. On mount you see…": `connect` / `connect, disconnect, connect` → the second [Doc: StrictMode]
  5. predict "What happens?": `useEffect(() => { setCount(count + 1); });` → infinite re-render loop [Doc]
  6. pick "Why does the effect run after every render?": `const options = { roomId }; useEffect(..., [options]);` → `options` is a new object each render [Doc: "Removing effect dependencies"]
  7. order: `useEffect(() => {` / `const id = setInterval(tick, 1000);` / `return () => clearInterval(id);` / `}, []);` [Doc]
  8. pick "Runs before the browser paints (measure layout)": `useLayoutEffect` / `useEffect` → `useLayoutEffect` [Doc]
- **Run** (pure logic, how React compares dependencies): starter
  ```js
  function depsChanged(prev, next) { return prev !== next; }
  console.log(depsChanged([1, "a"], [1, "a"]), depsChanged([1], [2]), depsChanged([NaN], [NaN]));
  ```
  prints `true true true`. Solution:
  `return prev.length !== next.length || prev.some((d, i) => !Object.is(d, next[i]));`.
  `expect`: `false true false`. [R]

### 3.2 `stale-closures-and-refs`, "Old photographs"

- **Concept**: every render has its own props, state and functions; a function created in an old render keeps the old
  values (stale closure). Classic bug: `setInterval` in an effect with `[]` that reads `count`. Fixes: updater
  function, correct dependencies, or a ref. `useRef` holds a mutable value that survives renders without triggering
  one (timer ids, previous values, DOM nodes); don't read or write `ref.current` during render; a DOM ref is `null`
  during the first render.
- **Visual**: each render takes a photograph of the crystal; a callback holding an old photograph keeps seeing the old
  number. The ref is a pocket notebook (`scroll`) that changes silently.
- **Questions**:
  1. predict "After 5 seconds the counter shows…": `useEffect(() => { const id = setInterval(() => setCount(count + 1), 1000); return () => clearInterval(id); }, []);` → `1` (stuck) [Doc: techinterview.org hooks pitfalls; react.dev]
  2. pick the fix: `setCount(c => c + 1)` / `setCount(count++)` → the updater [Doc]
  3. pick "Store a timer id without re-rendering": `useRef` / `useState` → `useRef` [Doc: "Referencing values with refs"]
  4. predict: `function C() { const r = useRef(3); return <p>{r.current}</p>; }` → `<p>3</p>` [React]
  5. pick "`ref.current++` in a click handler…": re-renders / does not re-render → does not [Doc]
  6. pick "Focus an input when a button is clicked": `inputRef.current.focus()` in the handler / `document.querySelector` in render → the ref [Doc]
  7. predict: `function makeHandler(count) { return () => console.log("count is", count); } const h = makeHandler(0); makeHandler(5); h();` → `count is 0` [R-concept: closures, verified pattern 6e]
  8. pick (React 19): pass a ref to your own component: `<MyInput ref={r} />` with `ref` as a prop / must use `forwardRef` → ref as a prop works in React 19 (`forwardRef` still works, not required) [Doc: React 19 release]
- **Run** (pure logic simulating a stale closure): starter
  ```js
  let state = 0;
  function render() {
    const count = state;
    return { tick: () => { state = count + 1; } };
  }
  const first = render();
  first.tick(); first.tick(); first.tick();
  console.log("state:", state);
  ```
  prints `state: 1`. Solution: read the latest value (`state = state + 1`), the analogue of `setCount(c => c + 1)`.
  `expect`: `state: 3`. [R]

### 3.3 `data-fetching`, "Messenger birds"

- **Concept**: fetching in an effect with loading/error state; the effect callback can't be `async` (define an async
  function inside and call it); race conditions when the input changes before the old response arrives (fix: an
  `ignore` flag in the cleanup or `AbortController`); missing dependencies don't refetch; in real apps prefer a
  framework loader or a caching library, or Suspense with `use()`.
- **Visual**: two messenger birds leave (request user 1, then user 2); bird 1 is slower and lands last, overwriting the
  screen with stale news, unless the cleanup puts a "ignore" ribbon on it.
- **Questions**:
  1. pick "Why not `useEffect(async () => {...}, [id])`?": an async function returns a promise, but an effect must return nothing or a cleanup function / async is not allowed in React → the first [Doc]
  2. predict "User clicks profile 1 then 2 quickly; response 2 arrives first, then 1. Without cleanup the screen shows…": profile 1 / profile 2 → profile 1 [Doc: "You might not need an effect" → fetching data]
  3. order the race fix: `useEffect(() => {` / `let ignore = false;` / `fetchUser(id).then(u => { if (!ignore) setUser(u); });` / `return () => { ignore = true; };` / `}, [id]);` [Doc]
  4. pick "Cancel the network request itself": `AbortController` + `controller.abort()` in cleanup / `clearTimeout` → `AbortController` [Doc: MDN AbortController]
  5. pick "`useEffect(() => { load(userId); }, []);` — when `userId` changes…": nothing refetches / it refetches → nothing (missing dependency) [Doc]
  6. pick "Show a spinner": keep `loading` state, set true before fetch and false in `finally` / check `data === undefined` only → the first (handles errors) [Doc]
- **Run** (pure async simulation): starter
  ```js
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  let shown = null;
  function load(id, delay) {
    let ignore = false;
    wait(delay).then(() => { shown = "user " + id; });
    return () => { ignore = true; };
  }
  const cleanup1 = load(1, 30);
  cleanup1();          // the id changed before user 1 arrived
  load(2, 10);
  setTimeout(() => console.log(shown), 50);
  ```
  prints `user 1`. Solution: `if (!ignore) shown = "user " + id;`. `expect`: `user 2`. [R]

### 3.4 `effects-you-dont-need`, "Fewer chores"

- **Concept**: don't use effects to transform data for rendering (compute it during render, `useMemo` if expensive),
  to handle user events (do it in the handler), to reset state on a prop change (use `key`), or to chain state updates.
  Effects are for synchronising with external systems.
- **Visual**: an actor that prints an empty list, then does a chore to fill it, then prints again (two renders); the
  fixed actor prints the right list the first time.
- **Questions**:
  1. pick: `visibleTodos` from `todos` and `filter`: state + effect / compute in render → compute [Doc: "You might not need an effect"]
  2. pick "Send an analytics POST when the user clicks Buy": in the click handler / in an effect watching `bought` → the handler [Doc]
  3. pick "Expensive filter on each render": `useMemo(() => filter(todos), [todos])` / `useEffect` + state → `useMemo` [Doc]
  4. pick "Reset all state when `userId` changes": `key={userId}` / an effect that sets every field → `key` [Doc]
  5. predict: the effect-derived list rendered with `renderToStaticMarkup` → `<ul></ul>` (see the run) [React]
  6. pick "Subscribe to an external store": `useSyncExternalStore` / `useEffect` + `useState` copy → `useSyncExternalStore` [Doc]
- **Run**: starter
  ```jsx
  function Visible({ todos }) {
    const [visible, setVisible] = useState([]);
    useEffect(() => { setVisible(todos.filter(t => !t.done)); }, [todos]);
    return <ul>{visible.map(t => <li key={t.id}>{t.text}</li>)}</ul>;
  }
  console.log(renderToStaticMarkup(<Visible todos={[{ id: 1, text: "Train", done: false }, { id: 2, text: "Rest", done: true }]} />));
  ```
  renders `<ul></ul>`. Solution: `const visible = todos.filter(t => !t.done);` (no state, no effect).
  `expect`: `<ul><li>Train</li></ul>`. [React]

### 3.5 Boss `effect-basilisk`

1. predict: the stale interval → stuck at `1` [Doc]
2. predict: `depsChanged([NaN], [NaN])` with `Object.is` → `false` [R]
3. pick "Object literal in deps causes…": the effect re-runs every render / nothing → re-runs [Doc]
4. pick "Missing cleanup for `window.addEventListener('resize', h)` causes…": listeners pile up (leak) / nothing → pile up [Doc]
5. order: `useEffect(() => {` / `const controller = new AbortController();` / `fetch(url, { signal: controller.signal }).then(r => r.json()).then(setData);` / `return () => controller.abort();` / `}, [url]);` [Doc]
6. pick "Development shows the effect twice": StrictMode re-runs effects to find missing cleanup / a bug in React → StrictMode [Doc]

## Region 4: `render-tower`, Context, reducers, memoization, custom hooks and Suspense

### 4.1 `context-and-reducer`, "The town crier and the rulebook"

- **Concept**: `createContext(default)`; providing a value (`<Theme value="dark">` in React 19, `<Theme.Provider>`
  before); `useContext` reads the nearest provider above, else the default; every consumer re-renders when the value
  changes (a new object each render = re-render every time). `useReducer(reducer, initial)`: a pure reducer
  `(state, action) => newState`, `default: return state`; typed actions as a discriminated union; reducer + context
  for app-wide state.
- **Visual**: the crier (`banner`) broadcasts from a tower; only actors inside its walls hear it, the closest crier
  wins. The reducer is a rulebook: an action card goes in, a new state crystal comes out.
- **Questions**:
  1. predict: `const Theme = createContext("light"); function T() { return <p>{useContext(Theme)}</p>; }` `<T />` → `<p>light</p>` [React]
  2. predict: `<Theme value="dark"><T /></Theme>` → `<p>dark</p>` [React]
  3. predict: `<Theme.Provider value="dark"><Theme value="neon"><T /></Theme></Theme.Provider>` → `<p>neon</p>` (nearest wins) [React]
  4. predict: `const reducer = (s, a) => { switch (a.type) { case "add": return s + a.n; default: return s; } }; console.log([{ type: "add", n: 2 }, { type: "x" }, { type: "add", n: 3 }].reduce(reducer, 0));` → `5` [R]
  5. predict: `function C() { const [s] = useReducer((s, a) => s + a, 5); return <p>{s}</p>; }` → `<p>5</p>` [React]
  6. pick "A reducer may…": return a new state computed from state + action / call `fetch` and mutate state → the first (reducers are pure; StrictMode calls them twice in development) [Doc]
  7. predict "Does it compile?" (TS): `type Action = { type: "add"; n: number } | { type: "reset" };` `dispatch({ type: "add" })` → No (`n` is missing) [TS]
  8. pick "`<Ctx value={{ user, setUser }}>` in a component that re-renders often…": all consumers re-render each time; memoize the value or split contexts / nothing happens → the first [Doc: GreatFrontEnd context pitfalls]
- **Run**: starter
  ```js
  function reducer(state, action) {
    switch (action.type) {
      case "add": return { ...state, items: [...state.items, action.item] };
      case "remove": return { ...state, items: state.items.filter(i => i !== action.item) };
    }
  }
  const actions = [{ type: "add", item: "gem" }, { type: "noop" }, { type: "add", item: "key" }];
  console.log(actions.reduce(reducer, { items: [] }).items.join(","));
  ```
  throws `TypeError` (the unknown action returns `undefined`). Solution: `default: return state;`.
  `expect`: `gem,key`. [R]

### 4.2 `memoization`, "The shield of sameness"

- **Concept**: a component re-renders when its state changes, its parent re-renders, or a context it reads changes.
  `memo(Component)` skips re-rendering when every prop is `Object.is`-equal to last time; inline objects and functions
  break it, so pair with `useCallback` (stable function) and `useMemo` (cached value). Don't memoize by default:
  measure with the Profiler; the React Compiler can memoize automatically. `memo` doesn't block re-renders from the
  component's own state or context.
- **Visual**: the `shield` in front of a child: it lets props through only if they are the very same items; a freshly
  forged (equal-looking) item breaks the shield.
- **Questions**:
  1. pick "`const Row = memo(RowImpl)`; parent passes `onClick={() => select(id)}`; when the parent re-renders, Row…": re-renders (new function each time) / skips → re-renders [Doc: react.dev `memo`]
  2. pick the fix: `useCallback(() => select(id), [id])` / `useRef` → `useCallback` [Doc]
  3. pick "Cache an expensive computed value": `useMemo` / `useCallback` → `useMemo` [Doc]
  4. predict: `console.log({} === {});` → `false` (why inline objects break `memo`) [R]
  5. pick "When should you NOT add `useMemo`?": cheap computations / filtering 10 000 items every keystroke → cheap computations [Doc]
  6. pick "A `memo` child still re-renders when…": its own state or a context it uses changes / never → the first [Doc]
  7. predict: `function C({ items }) { const total = useMemo(() => items.reduce((a, b) => a + b, 0), [items]); return <p>{total}</p>; }` `<C items={[1, 2, 3]} />` → `<p>6</p>` [React]
  8. predict: `const Fancy = memo(function Fancy({ n }) { return <i>{n}</i>; });` `<Fancy n={2} />` → `<i>2</i>` [React]
- **Run** (pure logic, how `memo` compares props): starter
  ```js
  function shallowEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  const f1 = () => {}; const f2 = () => {};
  console.log(shallowEqual({ id: 1, onClick: f1 }, { id: 1, onClick: f2 }), shallowEqual({ id: 1, onClick: f1 }, { id: 1, onClick: f1 }));
  ```
  prints `true true` (JSON drops functions). Solution:
  `const ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every(k => Object.is(a[k], b[k]));`.
  `expect`: `false true`. [R]

### 4.3 `custom-hooks`, "Spell recipes"

- **Concept**: rules of hooks: call hooks only at the top level of React functions (components or custom hooks), never
  in conditions, loops, after an early return, or in event handlers; React matches state to hooks by **call order**.
  A custom hook is a function whose name starts with `use` that calls other hooks; it shares *logic*, not *state* (each
  call has its own state). Typical asks: `useDebouncedValue`, `useLocalStorage`, `useFetch`, `useToggle`.
- **Visual**: hooks are numbered drawers; React opens drawer 1, 2, 3 in order every render. Skipping a drawer in one
  render (a hook inside `if`) shifts every crystal to the wrong drawer.
- **Questions**:
  1. pick "Valid?": `if (open) { const [x] = useState(0); }` → No (conditional hook) [Doc: Rules of hooks]
  2. pick "Valid?": `if (!user) return null; const [x] = useState(0);` → No (hook after an early return) [Doc]
  3. pick "Valid?": `function handleClick() { const t = useContext(Theme); }` → No (hook in an event handler) [Doc]
  4. pick "Why must hooks keep the same order?": React identifies each hook's state by its call order / for performance only → call order [Doc]
  5. predict "Two components call `useCounter()`. Clicking + in one…": changes only that one / changes both → only that one [Doc: "Reusing logic with custom hooks"]
  6. type: a custom hook's name must start with `___` → `use` [Doc]
  7. order `useDebouncedValue`: `function useDebouncedValue(value, ms) {` / `const [v, setV] = useState(value);` / `useEffect(() => {` / `const t = setTimeout(() => setV(value), ms);` / `return () => clearTimeout(t);` / `}, [value, ms]);` / `return v;` / `}` [Doc]
- **Run**: starter
  ```jsx
  function useToggle(initial) { const [on, setOn] = useState(false); return [on, () => setOn(o => !o)]; }
  function Lamps() { const [a] = useToggle(true); const [b] = useToggle(false); return <p>{a ? "ON" : "OFF"}-{b ? "ON" : "OFF"}</p>; }
  console.log(renderToStaticMarkup(<Lamps />));
  ```
  renders `<p>OFF-OFF</p>`. Solution: `useState(initial)`. `expect`: `<p>ON-OFF</p>`. [React]

### 4.4 `suspense-and-boundaries`, "Curtains and safety nets"

- **Concept**: `lazy(() => import("./X"))` (declared at module top level) + `<Suspense fallback>` for code splitting;
  Suspense shows the fallback while a child suspends (lazy code, `use(promise)`, framework data); error boundaries are
  class components with `getDerivedStateFromError` / `componentDidCatch` and don't catch errors in event handlers or
  async code; `useTransition` / `startTransition` mark non-urgent updates so typing stays responsive;
  `useDeferredValue`; server components (default in RSC frameworks) can be `async` and fetch data but can't use state
  or effects; `"use client"` marks the boundary where client components start.
- **Visual**: a curtain with a "Loading…" sign drops while the stagehands fetch the set; a safety net under the stage
  catches an actor that falls (render error) but not one who trips backstage (event handler).
- **Questions**:
  1. predict: `<Suspense fallback={<p>Loading</p>}><p>Ready</p></Suspense>` → `<p>Ready</p>` [React]
  2. predict: a child calling `use(neverResolvingPromise)` inside `<Suspense fallback={<p>Loading</p>}>` → `<p>Loading</p>` [React]
  3. pick "Error boundaries catch errors thrown…": during rendering of their children / inside an `onClick` handler → during rendering [Doc]
  4. pick "Can an error boundary be a function component with hooks?": No, it must be a class (or a library wrapper) / Yes → No [Doc]
  5. pick "Where do you call `lazy`?": at module top level / inside the component body → top level (otherwise state resets each render) [Doc: `lazy`]
  6. pick "Typing in a search box is slow because a big list re-renders": wrap the list update in `startTransition` / add more state → `startTransition` [Doc: `useTransition`]
  7. pick "A server component needs a click counter": add `"use client"` to a child component that holds the state / `useState` in the server component → `"use client"` [Doc: Server Components]
  8. type: the directive at the top of a client component file: `"use ___"` → `client` [Doc]
- **Run**: starter
  ```jsx
  const Lazy = lazy(() => new Promise(() => {}));   // a module that is still loading
  console.log(renderToStaticMarkup(<Lazy />));
  ```
  throws "A component suspended while responding to synchronous input…". Solution:
  `<Suspense fallback={<p>Loading…</p>}><Lazy /></Suspense>`. `expect`: `<p>Loading…</p>`. [React]

### 4.5 Boss `render-overlord`

1. pick "A component re-renders when…" (pick the wrong one): its parent re-renders / its state changes / a context it reads changes / a ref it holds changes → the ref [Doc]
2. predict: `shallowEqual` with `Object.is` on `{ onClick: f1 }` vs `{ onClick: f2 }` → `false` [R]
3. pick "React Compiler…": memoizes components and values automatically at build time / replaces the virtual DOM → the first [Doc: React Compiler]
4. predict: `<Theme.Provider value="dark"><Theme value="neon"><T /></Theme></Theme.Provider>` → `<p>neon</p>` [React]
5. pick "Hydration is…": attaching event handlers and state to server-rendered HTML in the browser / rendering on the server → the first [Doc]
6. pick "Reconciliation decides to keep a component's state when…": same type at the same position with the same key / same props → the first [Doc]
7. predict "Does it compile?" (TS): `dispatch({ type: "add" })` with a typed `Action` union missing `n` → No [TS]

---

# Entry exams

Both exams follow [../exams.md](../exams.md): bank ≥ 1.6 × `count`, round-robin draw across topics, sorted by
difficulty. Topic ids that link to a region let a strong result skip it.

## TypeScript/JavaScript planet

### Topics

| Topic id | Name (en) | Region |
|---|---|---|
| `values` | Values, types and numbers | `value-village` |
| `equality` | Equality and coercion | `value-village` |
| `scope` | Scope, hoisting and TDZ | `closure-forest` |
| `closures` | Closures | `closure-forest` |
| `this` | `this` and binding | `closure-forest` |
| `objects` | Objects, destructuring and copies | `prototype-peaks` |
| `arrays` | Arrays and higher-order functions | `prototype-peaks` |
| `classes` | Prototypes and classes | `prototype-peaks` |
| `ts_basics` | TypeScript shapes and inference | `type-castle` |
| `narrowing` | Unions and narrowing | `type-castle` |
| `generics` | Generics, keyof and indexed access | `type-castle` |
| `type_transforms` | Utility, mapped and conditional types | `type-castle` |
| `async` | Promises and async/await | `event-loop-tower` |
| `event_loop` | The event loop | `event-loop-tower` |
| `collections` | Map, Set and weak collections | (none) |
| `iterators` | Iterators and generators | (none) |
| `modules` | Modules: ESM and CommonJS | (none) |
| `memory` | Memory and garbage collection | (none) |
| `performance` | Debounce, throttle and performance | (none) |
| `security` | Security basics (XSS) | (none) |
| `ts_advanced` | Advanced TypeScript (variance, overloads, brands) | (none) |

### Levels

| Exam | Draws / bank | Pass | s/question | Topic ids (bank count) |
|---|---|---|---|---|
| `junior`, Junior TypeScript Developer | 12 / 22 | 70% | 30 | values 3, equality 3, scope 3, closures 2, objects 3, arrays 3, ts_basics 3, async 2 |
| `mid`, Mid-level TypeScript Developer | 14 / 24 | 70% | 40 | closures 2, this 3, classes 2, objects 2, async 3, event_loop 3, narrowing 3, generics 3, collections 1, modules 1, performance 1 |
| `senior`, Senior TypeScript Developer | 15 / 26 | 75% | 50 | event_loop 4, async 3, type_transforms 4, ts_advanced 4, narrowing 2, generics 1, iterators 2, modules 2, memory 2, security 1, classes 1 |

### Junior examples

1. `equality` predict: `console.log(1 == "1", 1 === "1");` → `true false` [R]
2. `values` predict: `console.log(0.1 + 0.2 === 0.3);` → `false` [R]
3. `scope` predict: `console.log(x); var x = 5;` → `undefined` [R]
4. `closures` predict: `makeCounter` called three times → `3` [R]
5. `objects` predict: `const a = { hp: 5 }; const b = a; b.hp = 9; console.log(a.hp);` → `9` [R]
6. `arrays` predict: `console.log([1, 2, 3].map(n => n * 2).join(","));` → `2,4,6` [R]
7. `ts_basics` predict "Compiles?": `let level: number = 3; level = "three";` → No [TS]
8. `async` predict: `console.log("A"); setTimeout(() => console.log("B"), 0); console.log("C");` → `A C B` [R]
9. `equality` predict: `console.log(0 || "default", 0 ?? "default");` → `default 0` [R]

### Mid examples

1. `event_loop` predict: `A`, timer `B`, promise `C`, `D` → `A D C B` [R]
2. `this` predict: `function f() { return this.v; } const g = f.bind({ v: 1 }); console.log(g.call({ v: 2 }));` → `1` [R]
3. `async` predict: `[1, 2].forEach(async n => { await wait(10); console.log(n); }); console.log("done");` → `done 1 2` [R]
4. `narrowing` predict "Compiles?": exhaustive `switch` with `const unreachable: never = s` and a new `tri` case unhandled → No [TS]
5. `generics` pick: `function getProp<T, K extends ___>(obj: T, key: K): T[K]` → `keyof T` [TS]
6. `collections` predict: `const m = new Map(); const k = { id: 1 }; m.set(k, "hero"); console.log(m.get({ id: 1 }), m.get(k), m.size);` → `undefined hero 1` [R]
7. `collections` predict: `const s = new Set([1, 2, 2, 3, 3]); console.log(s.size, [...s].join(""));` → `3 123` [R]
8. `modules` pick "An ES module imports `count` and calls `inc()` from the exporting module; `count` then reads…": the updated value (live binding) / the old copy → updated (with CommonJS destructuring `const { count } = require(...)` you get the old copy: `1` vs `0`) [R: verified both]
9. `performance` pick "Fire the search only after the user stops typing for 300 ms": debounce / throttle → debounce [R: debounce snippet prints `c`]
10. `classes` predict: `class A {} class B extends A { constructor() { this.x = 1; } } new B();` → `ReferenceError` [R]

### Senior examples

1. `event_loop` predict: `1`, timer `2`, promise `3`, async IIFE `4` / `await null` / `5`, `6` → `1 4 6 3 5 2` [R]
2. `async` predict: `try { return fail(); } catch { return "caught"; }` inside an `async` function, then `.catch(() => "escaped")` → `escaped` [R]
3. `event_loop` predict: `async function f() { return Promise.resolve("x"); }` raced against a three-step `then` chain → `a b x c` [R]
4. `type_transforms` predict: `type IsStr<T> = T extends string ? "yes" : "no"; IsStr<string | number>` → `"yes" | "no"` [TS]
5. `type_transforms` type: `type ElementOf<T> = T extends (___ U)[] ? U : never;` → `infer` [TS]
6. `ts_advanced` predict "Compiles?": `let handleDog: (d: Dog) => void = (d) => d.bark(); let handleAnimal: (a: Animal) => void = handleDog;` → No (parameters are contravariant under `strictFunctionTypes`); the reverse assignment compiles [TS]
7. `ts_advanced` predict "Compiles?": overloads `len(s: string)`, `len(a: unknown[])` called with `string | unknown[]` → No (`TS2769 No overload matches this call`) [TS]
8. `ts_advanced` predict: ``type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };`` then `Getters<{ name: string }>` → `{ getName: () => string }` (key remapping with `as`) [TS]
9. `iterators` predict: `function* gen() { yield 1; yield 2; return 3; } console.log([...gen()].join(","));` → `1,2` (spread ignores the `return` value) [R]
10. `iterators` predict: `for (const k in ["x", "y"]) console.log(typeof k, k);` → `string 0` `string 1` [R]
11. `memory` pick "Which keeps an object alive?": a key in a `Map` / a key in a `WeakMap` → the `Map` (a `WeakMap` has no `size` and is not iterable) [R: `typeof new WeakMap().size` → `undefined`]
12. `memory` pick "Common leak in a SPA": a `window` listener added on mount and never removed / a local variable in a function → the listener [Doc: MDN Memory management]
13. `security` pick "Render user-provided text safely": `el.textContent = text` / `el.innerHTML = text` → `textContent` [Doc: MDN XSS]
14. `modules` predict: an ES module with `console.log("main"); import "./side.mjs";` where `side.mjs` logs `side` → `side main` (imports are hoisted and evaluated first) [R]
15. `ts_advanced` type "Assertion function that narrows after the call": `function assertIsDefined<T>(v: T): ___ v is NonNullable<T>` → `asserts` [TS]

## React moon

### Topics

| Topic id | Name (en) | Region |
|---|---|---|
| `jsx` | JSX and rendering output | `jsx-village` |
| `components` | Components and props | `jsx-village` |
| `lists_keys` | Lists, keys and conditional rendering | `jsx-village` |
| `state` | State and batching | `state-forest` |
| `events_forms` | Events and forms | `state-forest` |
| `immutability` | Immutable updates | `state-forest` |
| `lifting_state` | Sharing and preserving state | `state-forest` |
| `effects` | Effects and cleanup | `effect-peaks` |
| `refs` | Refs and stale closures | `effect-peaks` |
| `data_fetching` | Data fetching and race conditions | `effect-peaks` |
| `context_reducer` | Context and reducers | `render-tower` |
| `memoization` | Memoization | `render-tower` |
| `hooks_rules` | Rules of hooks and custom hooks | `render-tower` |
| `suspense_boundaries` | Suspense, lazy, error boundaries, transitions | `render-tower` |
| `rendering` | Re-renders, reconciliation, StrictMode | (none) |
| `server_components` | Server and client components, hydration | (none) |
| `testing` | Testing React | (none) |
| `accessibility` | Accessibility | (none) |
| `performance` | Profiling and performance | (none) |
| `security` | Security (escaping, dangerouslySetInnerHTML) | (none) |

### Levels

| Exam | Draws / bank | Pass | s/question | Topic ids (bank count) |
|---|---|---|---|---|
| `junior`, Junior React Developer | 12 / 22 | 70% | 30 | jsx 4, components 3, lists_keys 3, state 4, events_forms 3, immutability 2, effects 2, accessibility 1 |
| `mid`, Mid-level React Developer | 14 / 24 | 70% | 40 | state 2, immutability 2, lifting_state 2, effects 3, refs 2, data_fetching 2, context_reducer 3, hooks_rules 3, memoization 2, testing 1, rendering 2 |
| `senior`, Senior React Developer | 15 / 26 | 75% | 50 | rendering 4, memoization 3, effects 3, data_fetching 2, suspense_boundaries 3, server_components 3, context_reducer 2, hooks_rules 2, performance 2, accessibility 1, security 1 |

### Junior examples

1. `jsx` predict: `<p>{0 && "items"}</p>` → `<p>0</p>` [React]
2. `components` predict: `<hello />` with a lower-case component → `<hello></hello>` [React]
3. `lists_keys` pick "Best key": `todo.id` / index / `Math.random()` → `todo.id` [Doc]
4. `state` predict "After one click": three `setCount(count + 1)` → `1` [Doc]
5. `events_forms` pick: `onClick={handleClick}` vs `onClick={handleClick()}` → the first [Doc]
6. `immutability` pick: `setItems([...items, item])` vs `items.push(item); setItems(items)` → the spread [Doc]
7. `effects` pick "Runs once after mount": `useEffect(fn, [])` [Doc]
8. `accessibility` type: `<label ___="email">` → `htmlFor` [React]

### Mid examples

1. `state` predict: `setNumber(number + 5); setNumber(n => n + 1);` from 0 → `6` [Doc]
2. `effects` pick "Effect re-runs every render": an object literal in the dependency array [Doc]
3. `refs` predict: interval in an effect with `[]` reading `count` → stuck at `1` [Doc]
4. `data_fetching` pick the race-condition fix: `ignore` flag set in the cleanup [Doc]
5. `context_reducer` predict: `useContext` with no provider → the default value (`<p>light</p>`) [React]
6. `hooks_rules` pick: `if (!user) return null; const [x] = useState(0);` → invalid [Doc]
7. `memoization` pick: `memo` child + inline arrow prop → still re-renders [Doc]
8. `lifting_state` pick: reset a form on user change → `key={userId}` [Doc]
9. `testing` pick "Query preferred by React Testing Library": `getByRole("button", { name: "Save" })` / `container.querySelector(".btn")` → `getByRole` [Doc: Testing Library guiding principles]
10. `rendering` pick "StrictMode in development…": double-invokes renders and effects to find impure code / slows production → the first [Doc]

### Senior examples

1. `rendering` pick the non-cause of a re-render: a changed ref [Doc]
2. `memoization` pick "When NOT to `useMemo`": cheap computations; measure with the Profiler first [Doc]
3. `effects` pick: derived data via effect + state → compute during render (the effect version renders `<ul></ul>` on the server) [React]
4. `suspense_boundaries` pick: error boundaries don't catch event-handler errors [Doc]
5. `suspense_boundaries` predict: a never-resolving `lazy` component without a Suspense boundary in `renderToStaticMarkup` → throws; with a boundary → `<p>Loading…</p>` [React]
6. `server_components` pick: a server component that needs `useState` → move the interactive part into a `"use client"` component [Doc]
7. `server_components` pick "Props passed from a server to a client component must be…": serializable (no functions except server actions) / anything → serializable [Doc: `"use client"`]
8. `security` predict: `<a href="javascript:alert(1)">` in React 19 → blocked (rendered URL throws a security error) [React]
9. `security` pick "Renders HTML without escaping": `dangerouslySetInnerHTML` / `{text}` → `dangerouslySetInnerHTML` [React: `<div dangerouslySetInnerHTML={{ __html: "<b>hi</b>" }} />` → `<div><b>hi</b></div>`]
10. `performance` pick "Rendering 10 000 rows is slow": virtualize the list / wrap every row in `useMemo` → virtualize [Doc]
11. `context_reducer` pick: context value `{{ user, setUser }}` re-created each render → memoize the value or split contexts [Doc]
12. `accessibility` pick "Custom `<div onClick>` button": use `<button>` (keyboard + role for free) / add `cursor: pointer` → `<button>` [Doc: WCAG, MDN]

---

# Sources for this curriculum

Research files: [typescript-hiring-assessments.md](typescript-hiring-assessments.md) and
[react-hiring-assessments.md](react-hiring-assessments.md) (full source lists). Pages cited by `[Doc]` tags:

- MDN, JavaScript execution model: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model
- MDN, Microtask guide: https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide
- MDN, `this`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
- MDN, Memory management: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management
- MDN, Cross-site scripting: https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS
- MDN, AbortController: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- Node.js, TypeScript type stripping: https://nodejs.org/api/typescript.html
- react.dev, Queueing a series of state updates: https://react.dev/learn/queueing-a-series-of-state-updates
- react.dev, State as a snapshot: https://react.dev/learn/state-as-a-snapshot
- react.dev, Updating objects / arrays in state: https://react.dev/learn/updating-objects-in-state , https://react.dev/learn/updating-arrays-in-state
- react.dev, Choosing the state structure: https://react.dev/learn/choosing-the-state-structure
- react.dev, Sharing state between components: https://react.dev/learn/sharing-state-between-components
- react.dev, Preserving and resetting state: https://react.dev/learn/preserving-and-resetting-state
- react.dev, Responding to events: https://react.dev/learn/responding-to-events
- react.dev, Rendering lists: https://react.dev/learn/rendering-lists
- react.dev, Synchronizing with effects: https://react.dev/learn/synchronizing-with-effects
- react.dev, You might not need an effect: https://react.dev/learn/you-might-not-need-an-effect
- react.dev, Removing effect dependencies: https://react.dev/learn/removing-effect-dependencies
- react.dev, Referencing values with refs: https://react.dev/learn/referencing-values-with-refs
- react.dev, Reusing logic with custom hooks: https://react.dev/learn/reusing-logic-with-custom-hooks
- react.dev, Rules of hooks: https://react.dev/reference/rules/rules-of-hooks
- react.dev, `memo` / `useMemo` / `useCallback`: https://react.dev/reference/react/memo , https://react.dev/reference/react/useMemo , https://react.dev/reference/react/useCallback
- react.dev, `useTransition`, `Suspense`, `lazy`, `use`: https://react.dev/reference/react/useTransition , https://react.dev/reference/react/Suspense , https://react.dev/reference/react/lazy , https://react.dev/reference/react/use
- react.dev, Error boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- react.dev, StrictMode: https://react.dev/reference/react/StrictMode
- react.dev, Server Components and `"use client"`: https://react.dev/reference/rsc/server-components , https://react.dev/reference/rsc/use-client
- react.dev, `renderToStaticMarkup`: https://react.dev/reference/react-dom/server/renderToStaticMarkup
- react.dev, React 19 release: https://react.dev/blog/2024/12/05/react-19
- react.dev, React Compiler: https://react.dev/learn/react-compiler
- Testing Library, guiding principles: https://testing-library.com/docs/guiding-principles
- techinterview.org, React hooks pitfalls: https://www.techinterview.org/post/3233474939/react-hooks-rules-pitfalls-interview/
- GreatFrontEnd, 50 essential React questions: https://greatfrontend.com/blog/50-essential-reactjs-interviews-questions
