# React hiring assessments: what companies test, by level

Research for the **React moon** of the TypeScript/JavaScript planet in Bitwise Quest (entry exams and curriculum, see
[typescript-react-curriculum.md](typescript-react-curriculum.md)). Goal: simulate the technical screening a company
runs when hiring React developers (frontend or full-stack) at junior, mid-level and senior level, in an arcade format.

Researched October 2026, against React 19.2 (the version in this repo). Sources: public question collections,
assessment vendors' test descriptions, job postings and the official documentation (react.dev). Interview processes
vary: treat this as a synthesis, not a standard. Static-render claims were checked locally with
`renderToStaticMarkup` (React 19.2.8), see section 6.

## 1. How React screening usually works

| Stage | Typical format | Source evidence |
|---|---|---|
| Online skills test (vendor) | Scenario-based MCQ: read a component, decide what it renders or what to do, 10-35 min | TestGorilla React (10 min, intermediate: hooks, state management, design patterns, advanced concepts); Adaface ReactJS (JSX, props, state, lifecycle, forms/events, API requests, lists, refs, hooks, context, custom hooks, reducers, lazy initialization) |
| Certification-style test | 2-4 timed tasks | HackerRank React (Basic), Frontend Developer (React) certifications |
| Real-world task | Build or fix a component in a browser IDE, graded by tests | Codility JS + React real-life tasks, CodeSignal Front-End framework (90 min, 4 levels) |
| Technical interview | Explain re-renders, keys, `useEffect` dependencies, controlled inputs, memoization trade-offs, context pitfalls | GreatFrontEnd 50 essential questions, sudheerj/reactjs-interview-questions, techinterview.org |
| Machine-coding round (45-60 min) | Autocomplete with debounce and keyboard navigation, infinite scroll, modal, tabs, todo list with filters, data table | techinterview.org frontend guide |
| Hooks bug hunt | Diagnose stale closures, infinite effect loops, missing cleanup, derived state in effects; write `useDebouncedValue`, `useLocalStorage`, `useFetch` | techinterview.org hooks pitfalls |
| Senior design discussion | State management choice (state vs context vs external store), rendering strategy (CSR/SSR/SSG/RSC), performance budget, accessibility, testing strategy | GreatFrontEnd, frontend system-design guides, job postings (Next.js App Router, Core Web Vitals, WCAG 2.1/2.2 AA, Jest + React Testing Library + Cypress) |

## 2. Topics per level

| Area | Junior | Mid-level | Senior |
|---|---|---|---|
| JSX (expressions, `className`, fragments, what renders: `0 &&`, `null`, booleans) | Core | Assumed | JSX compiles to `jsx()` calls; elements vs components vs nodes |
| Components and props, `children`, default values, one-way data flow | Core | Assumed | Composition over configuration, render props, HOCs (legacy) |
| Lists and keys | Use `key` | Why index keys break stateful lists | Keys to reset state on purpose |
| Conditional rendering | Core | Assumed | Assumed |
| `useState`: snapshot semantics, updater function, batching | Basic setter | Core (three `setCount(count + 1)` → +1) | Automatic batching (React 18+), `Object.is` bail-out, lazy initializer |
| Events and forms, controlled vs uncontrolled | Core | Core | Form libraries, React 19 form actions (`useActionState`) |
| Immutable updates of objects and arrays | Spread an object | Nested updates, arrays with `map`/`filter` | Structural sharing, immer |
| Lifting state up, derived state | Know "lift state" | Single source of truth, don't mirror props in state | State colocation, state preserved by position in the tree |
| `useEffect`: dependencies, cleanup | Know "after render" | Core (deps, cleanup, infinite loops, object deps) | "You might not need an effect", `useLayoutEffect`, `useEffectEvent` |
| Stale closures | Not required | Core (interval with `[]` deps) | Fixes: updater, ref, effect events |
| `useRef` | DOM ref (focus) | Mutable value without re-render | Don't read/write refs during render; ref as a prop in React 19 (no `forwardRef`) |
| Context | Use a context | Default value, nearest provider wins | Pitfalls: every consumer re-renders on a new value object; splitting contexts |
| `useReducer` | Not required | Core (pure reducer, actions) | Typed discriminated-union actions, reducer + context pattern |
| Memoization (`memo`, `useMemo`, `useCallback`) | Not required | When and why; referential equality | When NOT to; React Compiler auto-memoization; profiling first |
| Custom hooks and the rules of hooks | Know the two rules | Write custom hooks; hooks share logic, not state | Why the rules exist (call order), lint enforcement |
| Data fetching | Fetch in an effect | Loading/error states, race conditions (`ignore` flag, `AbortController`) | Caching libraries, framework loaders, Suspense data fetching, `use()` |
| Error boundaries | Not required | What they catch | What they don't catch (event handlers, async code); class-only API |
| Suspense, `lazy`, code splitting | Not required | `lazy` + `Suspense` fallback | Streaming SSR, Suspense for data |
| Concurrent features (`useTransition`, `useDeferredValue`) | Not required | Know they exist | When to use; urgent vs non-urgent updates |
| Server vs client components | Not required | Conceptual | `"use client"` boundary, async server components, hydration, serialization rules |
| Rendering and reconciliation | "Virtual DOM" | Re-render causes | Fiber, reconciliation by type + position + key, StrictMode double invocation |
| Performance profiling | Not required | React DevTools Profiler | Virtualization, code splitting, Core Web Vitals |
| Testing | Not required | React Testing Library basics (query by role) | Test strategy (unit vs integration vs E2E), mocking network |
| Accessibility | Semantic HTML, `alt` | Labels (`htmlFor`), keyboard focus, `useId` | WCAG 2.1/2.2 AA, ARIA roles, focus management in modals |
| TypeScript with React | Typing props | Typing events, children, `useState<T>` | Generic components, discriminated-union props, typed reducers |
| Security | Not required | React escapes text by default | `dangerouslySetInnerHTML` risks, `javascript:` URLs (blocked in React 19) |

### What makes a candidate senior

- **The rendering model**: why a component re-renders (own state, parent render, context change), referential
  equality, batching, reconciliation by position and key, StrictMode double-invoking renders and effects in development.
- **Effects discipline**: knowing which effects are unnecessary (derived state, event logic), dependency correctness,
  race conditions and cleanup.
- **Performance judgment**: measure with the Profiler before memoizing; `memo` + stable props; context splitting;
  virtualization; code splitting; transitions.
- **Architecture**: state colocation vs global stores, server components and data fetching, error and loading
  boundaries.
- **Quality**: accessibility, testing by user behavior, TypeScript for props and reducers.

## 3. Question formats that fit the arcade

| Format in the sources | Bitwise Quest beat | Example |
|---|---|---|
| "What does this render?" | `predict` + static markup check | `<p>{0 && "items"}</p>` renders `<p>0</p>` |
| "After one click, what shows?" | `predict` (anchored to react.dev, not machine-checked) | Three `setCount(count + 1)` → 1 |
| "Why does this re-render / loop forever?" | `predict` with prose options | Object literal in an effect dependency array |
| "Which hook fits?" | `pick` | Timer id → `useRef`; expensive value → `useMemo` |
| Fill in the token | `type` | `key`, `htmlFor`, `useCallback`, `"use client"` |
| Reorder lines | `order` | Effect with interval and cleanup |
| Fix the component (Codility/CodeSignal) | `run` with `renderToStaticMarkup` + expected HTML string, or pure logic (reducer, state queue, dependency comparison) | Effect-derived list renders `<ul></ul>` on the server |

## 4. Ranked list: most frequently asked items

Synthesis of frequency across the sources in section 7.

| Rank | Item | Typical level | Typical format |
|---|---|---|---|
| 1 | What triggers a re-render; virtual DOM and reconciliation | junior-senior | Explain, predict |
| 2 | `useEffect` dependency array and cleanup | junior-mid | Predict, spot the bug |
| 3 | `key` prop and index-as-key problems | junior-mid | Explain, predict |
| 4 | State vs props; `useState` updates (snapshot, updater function, batching) | junior-mid | Predict after click |
| 5 | `useMemo` / `useCallback` / `memo` and when not to use them | mid-senior | Explain, pick |
| 6 | Controlled vs uncontrolled inputs | junior-mid | Explain, pick |
| 7 | Rules of hooks and custom hooks | junior-mid | Spot the bug, write a hook |
| 8 | Stale closures in effects and callbacks | mid-senior | Spot the bug |
| 9 | Context: usage and performance pitfalls; state vs context vs external store | mid-senior | Explain |
| 10 | `useRef` (DOM access, mutable values without re-render) | junior-mid | Pick |
| 11 | Data fetching patterns, race conditions, loading/error states | mid-senior | Spot the bug, design |
| 12 | Lifting state up, composition, prop drilling | junior-mid | Explain |
| 13 | Immutable state updates (why not to mutate) | junior-mid | Spot the bug |
| 14 | Error boundaries | mid | Explain |
| 15 | Suspense, `lazy`, code splitting | mid-senior | Explain |
| 16 | SSR, hydration, static generation, server components | senior | Explain |
| 17 | StrictMode double invocation | mid-senior | Explain |
| 18 | `useReducer` | mid | Write a reducer |
| 19 | Concurrent features: `useTransition`, `useDeferredValue` | senior | Explain |
| 20 | Testing with React Testing Library | mid-senior | Explain |
| 21 | Accessibility in React (labels, focus, semantic HTML) | mid-senior | Spot the issue |
| 22 | Performance profiling, virtualization | senior | Explain |
| 23 | Portals, refs to child components (`forwardRef` → ref as prop in React 19), `useId` | mid | Explain |
| 24 | Fiber architecture | senior | Explain |

## 5. Proposed bank layout (entry exams)

Details and example questions per level are in
[typescript-react-curriculum.md § Entry exams](typescript-react-curriculum.md#entry-exams). Summary:

| Exam | Draws / bank | Pass | s/question | Topics in the bank |
|---|---|---|---|---|
| `junior`, Junior React Developer | 12 / 22 | 70% | 30 | jsx 4, components 3, lists_keys 3, state 4, events_forms 3, immutability 2, effects 2, accessibility 1 |
| `mid`, Mid-level React Developer | 14 / 24 | 70% | 40 | state 2, immutability 2, lifting_state 2, effects 3, refs 2, data_fetching 2, context_reducer 3, hooks_rules 3, memoization 2, testing 1, rendering 2 |
| `senior`, Senior React Developer | 15 / 26 | 75% | 50 | rendering 4, memoization 3, effects 3, data_fetching 2, suspense_boundaries 3, server_components 3, context_reducer 2, hooks_rules 2, performance 2, accessibility 1, security 1 |

## 6. Verification notes (important for content authors)

- 53 static-render claims compiled with sucrase (`jsxRuntime: "automatic"`) and rendered with
  `renderToStaticMarkup` from `react-dom/server` 19.2.8 under Node 25. All curriculum answers match.
- Behaviour after interaction (clicks, effects, re-renders) cannot be observed with a static render. Those questions
  are anchored to react.dev pages (cited per question as `[Doc]`). If the game wants machine verification for them,
  extract the logic into pure functions (state queue, reducer, dependency comparison) as the curriculum does.

Facts discovered while verifying that the content must respect:

| Fact | Detail | Consequence |
|---|---|---|
| No comment markers | `renderToStaticMarkup` does not insert `<!-- -->` between adjacent text nodes: `<p>Hi {name}</p>` → `<p>Hi Ada</p>` | Expected HTML strings are clean |
| Effects never run on the server | `useEffect` callbacks are skipped by static rendering | Great for teaching "derived state in an effect" (renders an empty list) |
| `<img>` adds a preload link | React 19 emits `<link rel="preload" as="image" href="..."/>` before an `<img>` in static markup | Avoid `<img>` in `run` beats that compare HTML |
| Attribute order | `<input type="checkbox" checked readOnly />` renders `readOnly=""` before `checked=""` (the order React writes, not the JSX order) | Avoid comparing multi-boolean-attribute markup |
| `class` / `for` still render | `<div class="card">` renders `class="card"` and `<label for>` renders `for` (with a development warning) | Ask about them as conventions/warnings, not as "it breaks" |
| `javascript:` URLs blocked | `<a href="javascript:alert(1)">` renders a URL that throws "React has blocked a javascript: URL as a security precaution." | Good senior security fact |
| Text is escaped | `<p>{"<script>"}</p>` → `<p>&lt;script&gt;</p>`; `dangerouslySetInnerHTML` is not escaped | XSS questions |
| Suspending without a boundary | A component that suspends (`use(pendingPromise)` or an unresolved `lazy`) renders the nearest `Suspense` fallback; with no boundary, `renderToStaticMarkup` throws | `run` beat for Suspense |
| React 19 context provider | `<Theme value="dark">` works as a provider; `<Theme.Provider>` still works | Teach the React 19 form, mention the old one |

## 7. Sources

Question collections and interview guides:
- GreatFrontEnd, 50 essential React interview questions: https://greatfrontend.com/blog/50-essential-reactjs-interviews-questions
- techinterview.org, React interview questions (hooks, performance, architecture): https://www.techinterview.org/post/3233460399/react-interview-questions/
- techinterview.org, React hooks rules and common pitfalls (interview edition): https://www.techinterview.org/post/3233474939/react-hooks-rules-pitfalls-interview/
- techinterview.org, Frontend engineering interview guide 2026: https://www.techinterview.org/post/3233474937/frontend-engineering-interview-guide-2026/
- techprep, 25 senior React interview questions: https://www.techprep.app/blog/senior-react-interview-questions
- Interview Kickstart, Advanced ReactJS interview questions for senior engineers: https://www.interviewkickstart.com/interview-questions/advanced-reactjs-interview-questions
- snappify, Advanced React interview questions: https://snappify.com/blog/advanced-reactjs-interview-questions
- sudheerj/reactjs-interview-questions (500 questions): https://github.com/sudheerj/reactjs-interview-questions
- Educative, Front-end developer interview prep: https://www.educative.io/blog/how-to-prepare-a-front-end-developer-interview
- System Design Handbook, frontend system design: https://www.systemdesignhandbook.com/guides/frontend-system-design/

Assessment vendors:
- TestGorilla React test: https://www.testgorilla.com/test-library/programming-skills-tests/react-test/
- Adaface ReactJS online test: https://adaface.com/assessment-test/reactjs-test-online-assessment
- Adaface JavaScript + Node + React test: https://www.adaface.com/fr/pre-built-test/javascript-node-react-test
- HackerRank skills certification: https://hackerrank-community-knowledge-base.help.usepylon.com/articles/2563639100-introduction-to-certification
- CodeSignal JavaScript UI tasks: https://codesignal.com/blog/javascript-ui-tasks/
- CodeSignal front-end assessment, four levels: https://prachub.com/resources/codesignal-front-end-development-assessment-four-levels-of-ui-and-api-practice
- Codility task releases (React real-life tasks): https://support.codility.com/hc/en-us/articles/13336450618519-Task-Release-new-languages-variants-March-2023

Job postings:
- Dice, Senior Frontend Engineer (React/TypeScript): https://www.dice.com/job-detail/380dff5e-7562-457d-aa53-862feb3c764f
- WeAreDevelopers, Senior React Developer: https://www.wearedevelopers.com/en/jobs/ext/6322469/senior-react-developer
- WeAreDevelopers, Sr. Front-End Engineer: https://www.wearedevelopers.com/jobs/ext/6952561/sr-front-end-engineer
- Built In, Senior Front End Engineer: https://builtin.com/job/senior-front-end-engineer/7762051

Official references (react.dev):
- Describing the UI / JSX: https://react.dev/learn/writing-markup-with-jsx
- Conditional rendering: https://react.dev/learn/conditional-rendering
- Rendering lists (keys): https://react.dev/learn/rendering-lists
- State as a snapshot: https://react.dev/learn/state-as-a-snapshot
- Queueing a series of state updates: https://react.dev/learn/queueing-a-series-of-state-updates
- Updating objects in state: https://react.dev/learn/updating-objects-in-state
- Updating arrays in state: https://react.dev/learn/updating-arrays-in-state
- Sharing state between components: https://react.dev/learn/sharing-state-between-components
- Preserving and resetting state: https://react.dev/learn/preserving-and-resetting-state
- Responding to events: https://react.dev/learn/responding-to-events
- Referencing values with refs: https://react.dev/learn/referencing-values-with-refs
- Synchronizing with effects: https://react.dev/learn/synchronizing-with-effects
- You might not need an effect: https://react.dev/learn/you-might-not-need-an-effect
- Lifecycle of reactive effects: https://react.dev/learn/lifecycle-of-reactive-effects
- Reusing logic with custom hooks: https://react.dev/learn/reusing-logic-with-custom-hooks
- Rules of hooks: https://react.dev/reference/rules/rules-of-hooks
- Components and hooks must be pure: https://react.dev/reference/rules/components-and-hooks-must-be-pure
- `useState`: https://react.dev/reference/react/useState
- `useEffect`: https://react.dev/reference/react/useEffect
- `useRef`: https://react.dev/reference/react/useRef
- `useContext` / `createContext`: https://react.dev/reference/react/useContext , https://react.dev/reference/react/createContext
- `useReducer`: https://react.dev/reference/react/useReducer
- `memo`: https://react.dev/reference/react/memo
- `useMemo`: https://react.dev/reference/react/useMemo
- `useCallback`: https://react.dev/reference/react/useCallback
- `useTransition`: https://react.dev/reference/react/useTransition
- `Suspense`: https://react.dev/reference/react/Suspense
- `lazy`: https://react.dev/reference/react/lazy
- `use`: https://react.dev/reference/react/use
- Error boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- `StrictMode`: https://react.dev/reference/react/StrictMode
- Server Components: https://react.dev/reference/rsc/server-components
- `"use client"`: https://react.dev/reference/rsc/use-client
- `renderToStaticMarkup`: https://react.dev/reference/react-dom/server/renderToStaticMarkup
- React 19 release post (context as provider, ref as prop, actions): https://react.dev/blog/2024/12/05/react-19
- React Compiler: https://react.dev/learn/react-compiler
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
