# JavaScript and TypeScript hiring assessments: what companies test, by level

Research for the **TypeScript/JavaScript planet** of Bitwise Quest (entry exams and curriculum, see
[typescript-react-curriculum.md](typescript-react-curriculum.md)). Goal: simulate the technical screening a company
runs when hiring JavaScript/TypeScript developers (frontend, full-stack, Node.js) at junior, mid-level and
senior level, in an arcade format (short, timed, multiple choice).

Researched October 2026. Sources: public question collections, assessment vendors' test descriptions, job
postings and the official documentation (MDN, the TypeScript Handbook, Node.js docs). Interview processes vary a lot
between companies: treat this as a synthesis, not a standard. Every code claim quoted in this file and in the
curriculum was checked locally (Node 25, `tsc 5.9 --strict`), see section 6.

## 1. How JavaScript/TypeScript screening usually works

| Stage | Typical format | Source evidence |
|---|---|---|
| Online skills test (vendor) | 8-15 MCQ / code-reading questions plus 0-1 coding task, 10-60 min | Adaface JS (40 min, 8 MCQ + 1 coding), iMocha TypeScript (10 questions, 20 min), TestGorilla (JS algorithms, data structures, debugging; TS entry and intermediate algorithms) |
| Certification-style test | 2-4 timed coding questions | HackerRank skills certifications (JavaScript, React, Frontend Developer) |
| Real-world task | Build or fix a small UI or module in a browser IDE, 60-90 min, graded on levels | CodeSignal Front-End framework (4 levels: layout, interaction, API, extension; 90 min), Codility real-life tasks (JS/TS "CurrencyConverter", JS + React tasks), TestGorilla JS Debugging (fix a partially working script in 30 min) |
| Code-reading quiz | Predict the output of a snippet | lydiahallie/javascript-questions (snippet + 4 options + explanation), sudheerj/javascript-interview-questions coding exercises |
| Technical interview | Explain closures, `this`, the event loop, promises, `type` vs `interface`, `unknown` vs `any` | GreatFrontEnd, techinterview.org, sudheerj, Adaface/TestGorilla blog question lists |
| Machine-coding round (45-60 min) | Implement `debounce`, `throttle`, `Promise.all`, deep clone, an event emitter, an autocomplete with debouncing | techinterview.org frontend guide, GreatFrontEnd |
| Senior: type-level / design discussion | Conditional + mapped types, `infer`, library typings, declaration merging, variance, migration JS → TS; browser internals and performance | techprep senior TypeScript list, techinterview.org TS, type-challenges, frontend system-design guides |

## 2. Topics per level

### JavaScript

| Area | Junior | Mid-level | Senior |
|---|---|---|---|
| Primitive types, `typeof`, numbers (float `0.1 + 0.2`), strings, template literals | Core | Assumed | `MAX_SAFE_INTEGER`, `BigInt`, `Number.EPSILON` |
| Equality and coercion (`==` vs `===`, truthy/falsy, `??` vs `\|\|`) | Core | Core (`[] == false`, `+"a"`) | `Object.is`, `SameValueZero` (`includes(NaN)`), explaining the abstract algorithm |
| `var` / `let` / `const`, block scope | Core | Assumed | Assumed |
| Hoisting and TDZ | Know the difference | Core (function vs `var` vs `let` hoisting) | Edge cases (TDZ in inner scope shadowing an outer binding) |
| Functions, arrows, default/rest params | Core | Assumed | Assumed |
| Closures | Counter example | Loop with `var` vs `let`, `once`, memoize, private state | Memory pitfalls of closures, module pattern |
| `this` and binding | Method call | `call` / `apply` / `bind`, arrow functions, lost `this` | `new` > explicit > implicit > default precedence; `bind` cannot be re-bound |
| Objects, arrays, destructuring, spread, optional chaining | Core | Core | Assumed |
| References, shallow vs deep copy, immutability | Know that objects are shared | Spread is shallow, `structuredClone`, `Object.freeze` is shallow | Pass-by-sharing (reassigning a parameter vs mutating it), JSON clone pitfalls |
| Higher-order functions and array methods | `map` / `filter` / `forEach` | `reduce`, `find`, `some` / `every`, `sort` mutates and is lexicographic | `["1","2","3"].map(parseInt)`, `toSorted`, implementing `map`/`reduce` |
| Prototypes and classes | `class`, `extends` | Prototype chain, `super`, `instanceof`, `static`, `#private` | `Object.create`, shadowing on the instance, derived constructor must call `super` |
| Callbacks and timers | `setTimeout` is async | `setTimeout(fn, 0)` runs later; closures in loops | Timer clamping, long tasks blocking the loop |
| Promises | Know `.then` / `.catch` | Chaining, return values, `Promise.all` / `allSettled` / `race` / `any` | Executor runs synchronously; promise resolution takes extra ticks; implementing `Promise.all` |
| `async` / `await` | Basic usage | `try/catch`, forgetting `await`, sequential vs parallel, `forEach` + async | `return` vs `return await` inside `try`, unhandled rejections |
| Event loop | Not required (sometimes "what prints first") | Microtasks vs macrotasks ordering | Multi-level ordering puzzles, starvation, Node phases and `process.nextTick` |
| Iterators and generators | Not required | `for...of` vs `for...in` | Generators, `Symbol.iterator`, lazy sequences |
| Map / Set / WeakMap / WeakSet | Not required | `Set` dedupe, `Map` with object keys | Weak references for caches/metadata, no `size`, not iterable |
| Modules | `import` / `export` | ESM vs CommonJS | Live bindings vs copies, hoisted imports, tree shaking, top-level `await` |
| Memory and GC | Not required | Not required | Reachability, leaks (globals, listeners, timers, closures, detached DOM) |
| DOM events | `addEventListener` | Bubbling, capturing, delegation, `preventDefault` / `stopPropagation` | Performance of delegation, passive listeners |
| Debounce / throttle | Not required | Explain the difference | Implement both (live coding) |
| Security | Not required | XSS basics, never `innerHTML` with user data | CSP, sanitization, prototype pollution, `eval` |
| Performance | Not required | Avoid layout thrashing | Web Workers, Core Web Vitals, code splitting, profiling |

### TypeScript

| Area | Junior | Mid-level | Senior |
|---|---|---|---|
| Annotations, inference, literal vs widened types (`const` vs `let`) | Core | Assumed | Assumed |
| Arrays, tuples, object types, optional and `readonly` properties | Core | Assumed | Assumed |
| Structural typing, excess property checks | Know "shapes" | Core | Assignability rules, branded types to break structural equality |
| `interface` vs `type` | Know both | Declaration merging, unions only with `type` | Module augmentation, `declare global` |
| Unions, intersections, literal types | Basic unions | Core | Assumed |
| Narrowing and type guards (`typeof`, `in`, `instanceof`, equality, truthiness) | `typeof` | Core, custom `x is T` predicates | Assertion functions (`asserts x is T`), control-flow analysis limits |
| Discriminated unions, exhaustiveness with `never` | Not required | Core | State machines, reducers, exhaustive `switch` |
| `any` vs `unknown` vs `never` | Know `any` is unsafe | Core | `never` in conditional types, `catch (err)` is `unknown` |
| Generics and constraints | Use `Array<T>` | Write generic functions, `extends` constraints, defaults | Generic inference, `const` type parameters, higher-order generic utilities |
| `keyof`, `typeof`, indexed access `T[K]` | Not required | Core | Combining with mapped types |
| Utility types (`Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`, `NonNullable`, `Exclude`, `Extract`, `Awaited`) | `Partial` | Core | Implementing them from scratch |
| Mapped types, conditional types, `infer`, template literal types | Not required | Read them | Write them; distributive conditionals; key remapping with `as` |
| Enums vs union of literals, `as const`, `satisfies` | Not required | Core | Trade-offs (runtime cost, `isolatedModules` / type stripping) |
| Strict mode (`strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`) | Know it exists | Core | Migration strategy JS → TS |
| Function overloads | Not required | Read them | Write them; overload resolution does not accept a union argument |
| Declaration files (`.d.ts`), `declare` | Not required | Use `@types` | Write typings for untyped libraries, module augmentation |
| Variance | Not required | Not required | Parameters contravariant under `strictFunctionTypes`, method shorthand stays bivariant, return types covariant |
| Classes in TS (`private`, `protected`, `abstract`, parameter properties) | Basic | Core | `#private` vs `private`, decorators |

### What makes a candidate senior

The sources agree a senior is not someone who knows more syntax; a senior predicts runtime behavior and designs types:

- **Runtime model**: event loop ordering with nested microtasks and timers, promise resolution ticks, `return await`,
  memory leaks from closures and listeners (GreatFrontEnd advanced list, techinterview.org).
- **Type-level design**: conditional/mapped types, `infer`, template literal types, branded types, variance,
  declaration merging and module augmentation, typing a library (techprep senior TS, techinterview.org TS,
  type-challenges).
- **Safety trade-offs**: `unknown` at boundaries, exhaustive discriminated unions, `satisfies` vs `as`, avoiding `any`.
- **Production concerns**: ESM vs CommonJS, tree shaking, bundlers, CSP/XSS, performance profiling, testing strategy
  (job postings, GreatFrontEnd).
- **Live coding fluency**: `debounce`, `throttle`, `Promise.all`, deep clone, `memoize`, event emitter.

## 3. Question formats that fit the arcade

| Format in the sources | Bitwise Quest beat | Example |
|---|---|---|
| Output prediction (lydiahallie style) | `predict` with output options + `check.stdout` | `console.log("A"); setTimeout(..B..); Promise.resolve().then(..C..); console.log("D")` → `A D C B` |
| Event-loop ordering | `predict` (4 orderings) or `order` | `async`/`await` + `then` + timers |
| "Does it type-check?" | `predict` Yes/No + `check.compiles` (via `tsc --strict`) | `len({ x: 3, y: 4, z: 9 })` fails the excess property check |
| Pick the right type / signature | `pick` with one `___` | `K extends ___` → `keyof T`; `___<Hero, "hp">` → `Omit` |
| Fill in the keyword | `type` | `infer`, `never`, `satisfies`, `keyof`, `let` |
| Spot the bug | `predict` "what prints?" on buggy code; `explain` names the fix | `const sq = n => { n * n }` returns `undefined` |
| Reorder lines | `order` | A promise chain, a debounce implementation, a reducer |
| Fix a partially working script (TestGorilla Debugging, CodeSignal) | `run` (broken starter → expected stdout) | `forEach(async ...)` returns before the work is done |
| Machine coding (debounce, Promise.all) | `run` in a boss | Debounce without `clearTimeout` fires three times |

Long-form system design and 60-minute UI builds don't fit a 30-50 s arcade question; the banks approximate them with
"which implementation is right" picks and boss `run` beats.

## 4. Ranked list: most frequently asked items

Ranking is a synthesis of how often the topic appears across the sources in section 7 (question collections,
vendor topic lists, interview guides and job postings), weighted toward items that appear at several levels.

| Rank | Item | Typical level | Typical format |
|---|---|---|---|
| 1 | Event loop: call stack, microtasks vs macrotasks, `setTimeout(0)` vs `Promise.then` ordering | mid-senior | Output prediction |
| 2 | Closures (counter, private state, `var` in a loop with `setTimeout`) | junior-mid | Output prediction, explain |
| 3 | `var` / `let` / `const`, hoisting, TDZ | junior-mid | Output prediction (`undefined` vs `ReferenceError`) |
| 4 | Promises and `async`/`await`: chaining, error handling, `Promise.all` / `allSettled` / `race` / `any` | junior-senior | Output prediction, implement `Promise.all` |
| 5 | `this` binding, `call` / `apply` / `bind`, arrow functions | mid | Output prediction, spot the bug |
| 6 | `==` vs `===`, type coercion, truthy/falsy, `??` vs `\|\|` | junior | Output prediction |
| 7 | TypeScript `type` vs `interface` | junior-mid | Explain, "does it compile?" (merging) |
| 8 | TypeScript `any` vs `unknown` vs `never` | junior-mid | Explain, "does it compile?" |
| 9 | Prototypal inheritance and classes | mid | Explain, output prediction |
| 10 | Shallow vs deep copy, references, immutability (spread, `structuredClone`) | junior-mid | Output prediction |
| 11 | TypeScript generics and constraints | mid | Pick the signature, "does it compile?" |
| 12 | TypeScript utility types (`Partial`, `Pick`, `Omit`, `Record`, `ReturnType`) | mid | Pick the type |
| 13 | Array methods and higher-order functions (`map` / `filter` / `reduce`, `sort` gotchas) | junior-mid | Output prediction, implement |
| 14 | Unions, narrowing, discriminated unions, exhaustive `never` | mid | "does it compile?", spot the bug |
| 15 | Debounce and throttle | mid-senior | Live coding |
| 16 | ESM vs CommonJS, tree shaking | mid-senior | Explain |
| 17 | Conditional types, mapped types, `infer`, template literal types | senior | Pick the resulting type |
| 18 | DOM events: bubbling, capturing, delegation | junior-mid | Explain |
| 19 | Memory leaks and garbage collection | senior | Explain |
| 20 | Security: XSS, CSP, sanitizing user input | mid-senior | Explain |
| 21 | Map / Set / WeakMap / WeakSet | mid | Output prediction |
| 22 | `as const`, `satisfies`, enums vs union literals | mid-senior | "does it compile?" |
| 23 | Iterators and generators | mid-senior | Output prediction |
| 24 | Floating point (`0.1 + 0.2`), `NaN`, safe integers | junior | Output prediction |
| 25 | Variance, overloads, declaration merging / module augmentation, `.d.ts`, branded types, assertion functions | senior | "does it compile?", explain |
| 26 | Performance: Web Workers, layout thrashing, code splitting | senior | Explain |

## 5. Proposed bank layout (entry exams)

Details and example questions per level are in
[typescript-react-curriculum.md § Entry exams](typescript-react-curriculum.md#entry-exams). Summary:

| Exam | Draws / bank | Pass | s/question | Topics in the bank |
|---|---|---|---|---|
| `junior`, Junior TypeScript Developer | 12 / 22 | 70% | 30 | values 3, equality 3, scope 3, closures 2, objects 3, arrays 3, ts_basics 3, async 2 |
| `mid`, Mid-level TypeScript Developer | 14 / 24 | 70% | 40 | closures 2, this 3, classes 2, objects 2, async 3, event_loop 3, narrowing 3, generics 3, collections 1, modules 1, performance 1 |
| `senior`, Senior TypeScript Developer | 15 / 26 | 75% | 50 | event_loop 4, async 3, type_transforms 4, ts_advanced 4, narrowing 2, generics 1, iterators 2, modules 2, memory 2, security 1, classes 1 |

## 6. Verification notes (important for content authors)

All code claims in the curriculum were checked on 2026-10-06:

- **Runtime claims**: Node 25.2, each snippet saved as a `.cjs` file (CommonJS, sloppy mode) and run; stdout compared.
  199 snippets, 0 mismatches.
- **Type-checker claims**: `tsc 5.9.3 --strict --noEmit --target es2023 --lib es2023,dom --module esnext
  --moduleResolution bundler`, one file per claim (wrapped as a module with `export {}`); type-equality claims use the
  `Equal`/`Expect` helper from type-challenges. 98 claims, 0 mismatches.

Pitfalls found while verifying, which the content must respect:

| Pitfall | Detail | Consequence for content |
|---|---|---|
| Strict vs sloppy mode | Assigning to a frozen object's property or to `"hi"[0]` is silent in sloppy CommonJS but throws `TypeError` in ES modules / classes / `"use strict"` | Avoid these as `predict` questions, or pin the mode in the snippet (use a `class` body, which is always strict) |
| Top-level `this` | `this` at module top level is `{}` in CommonJS and `undefined` in ESM | Never ask about top-level `this` |
| `process.nextTick` vs `Promise.then` | In a CommonJS entry file `nextTick` prints first; in an ESM entry file the promise prints first | Senior-only and flagged as Node-specific; prefer `queueMicrotask` |
| Node type stripping | `node file.ts` (Node ≥ 22.18 / 23.6) strips erasable types only: `enum`, `namespace` and constructor parameter properties (`constructor(public v: number)`) throw `SyntaxError` | Runnable TS snippets must avoid them, or the runner must transpile (e.g. `tsc` or sucrase) |
| `expect` is a substring | A `run` beat passes if stdout *contains* `expect` | Choose `expect` so the buggy starter's output never contains it (`calls: c` vs `calls: a,b,c`) |
| Method shorthand bivariance | `{ take(d: Dog): void }` assigned where `{ take(d: Animal): void }` is expected compiles even with `--strict`; the function-property form does not | Variance questions must use function-type properties (`handle: (a: Animal) => void`) |

## 7. Sources

Question collections and interview guides:
- GreatFrontEnd, Advanced JavaScript interview questions for 10+ years of experience: https://www.greatfrontend.com/blog/advanced-javascript-interviews-questions-for-10-years-experience
- techinterview.org, JavaScript/TypeScript interview questions 2025 (closures, event loop, promises, generics): https://www.techinterview.org/post/3233474452/javascript-typescript-interview-questions-2025-closures-event-loop-promises-async-await-typescript-generics-react-node/
- techinterview.org, TypeScript interview questions (types, generics, advanced patterns): https://www.techinterview.org/post/3233460485/typescript-interview-questions/
- techinterview.org, Frontend engineering interview guide 2026 (rounds, machine coding): https://www.techinterview.org/post/3233474937/frontend-engineering-interview-guide-2026/
- techprep, 17 senior TypeScript interview questions: https://www.techprep.app/blog/senior-typescript-interview-questions
- Adaface, TypeScript interview questions: https://adaface.com/blog/typescript-interview-questions
- Adaface, skills required for a TypeScript developer: https://adaface.com/blog/skills-required-for-typescript-developer
- sudheerj/javascript-interview-questions (1000 questions + coding exercises): https://github.com/sudheerj/javascript-interview-questions
- lydiahallie/javascript-questions (output-prediction format): https://github.com/lydiahallie/javascript-questions
- type-challenges (type-level puzzles, `Equal`/`Expect` helpers): https://github.com/type-challenges/type-challenges
- GoLinuxCloud, TypeScript interview questions: https://www.golinuxcloud.com/typescript-interview-questions/
- Medium, JavaScript event loop guide for frontend interviews: https://medium.com/@thefrontendfeed/javascript-event-loop-a-complete-guide-for-frontend-interviews-eab0c50d048b
- System Design Handbook, frontend system design: https://www.systemdesignhandbook.com/guides/frontend-system-design/

Assessment vendors:
- TestGorilla TypeScript coding tests: https://www.testgorilla.com/coding-tests/typescript/
- TestGorilla TypeScript intermediate algorithms: https://testgorilla.com/test-library/programming-skills-tests/typescript-coding-test-intermediate-level-algorithms
- TestGorilla full-stack developer tests: https://testgorilla.com/test-library/job-role/full-stack-developer-tests
- TestGorilla web developer tests: https://testgorilla.com/test-library/job-role/web-developer-tests
- Adaface JavaScript online test (40 min, 8 MCQ + 1 coding): https://adaface.com/assessment-test/javascript-online-test
- iMocha TypeScript test (10 questions, 20 min): https://www.imocha.io/tests/typescript-test-online-assessment
- HR Avatar TypeScript programming test: https://www.hravatar.com/ta/tests/9626/typescript-programming-short.html
- WeLoveDevs TypeScript test: https://welovedevs.com/app/tests/typescript-overview
- WeCreateProblems TypeScript assessment: https://wecreateproblems.com/tests/typescript-assessment-test
- HackerRank skills certification: https://hackerrank-community-knowledge-base.help.usepylon.com/articles/2563639100-introduction-to-certification
- CodeSignal JavaScript UI tasks: https://codesignal.com/blog/javascript-ui-tasks/
- CodeSignal front-end assessment, four levels: https://prachub.com/resources/codesignal-front-end-development-assessment-four-levels-of-ui-and-api-practice
- Codility task releases (JS/TS and React real-life tasks): https://support.codility.com/hc/en-us/articles/13336450618519-Task-Release-new-languages-variants-March-2023

Job postings:
- Dice, Senior Frontend Engineer (React/TypeScript): https://www.dice.com/job-detail/380dff5e-7562-457d-aa53-862feb3c764f
- Built In, Senior Front End Engineer: https://builtin.com/job/senior-front-end-engineer/7762051
- WeAreDevelopers, Senior React Developer: https://www.wearedevelopers.com/en/jobs/ext/6322469/senior-react-developer
- Djinni, Senior Frontend Engineer: https://djinni.co/jobs/834152-senior-frontend-engineer-id72472/

Official references:
- MDN, JavaScript execution model (event loop, jobs): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model
- MDN, Microtask guide: https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide
- MDN, Using promises: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
- MDN, Equality comparisons and sameness: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness
- MDN, Closures: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
- MDN, `this`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
- MDN, `let` and the temporal dead zone: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let
- MDN, Inheritance and the prototype chain: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain
- MDN, JavaScript modules: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- MDN, Memory management: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management
- MDN, Shallow copy / Deep copy: https://developer.mozilla.org/en-US/docs/Glossary/Shallow_copy , https://developer.mozilla.org/en-US/docs/Glossary/Deep_copy
- MDN, Iterators and generators: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators
- MDN, Keyed collections (Map, Set, WeakMap): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Keyed_collections
- MDN, Event bubbling: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling
- MDN, Cross-site scripting (XSS): https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- TypeScript Handbook, Narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- TypeScript Handbook, Generics: https://www.typescriptlang.org/docs/handbook/2/generics.html
- TypeScript Handbook, Conditional types: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
- TypeScript Handbook, Mapped types: https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
- TypeScript Handbook, Template literal types: https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html
- TypeScript Handbook, Utility types: https://www.typescriptlang.org/docs/handbook/utility-types.html
- TypeScript Handbook, Type compatibility (structural typing, variance): https://www.typescriptlang.org/docs/handbook/type-compatibility.html
- TypeScript 4.9 release notes (`satisfies`): https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html
- TypeScript, Declaration files: https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html
- TypeScript, `strict` compiler option: https://www.typescriptlang.org/tsconfig/#strict
- Node.js, Running TypeScript natively (type stripping limits): https://nodejs.org/api/typescript.html
- Node.js, Event loop, timers and `process.nextTick()`: https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
