# Python hiring assessments: what companies test, by level

Research behind the entry exams of Bitwise Quest for the **Python** planet (pack `python`,
`content/python/exams.ts`). Goal: simulate the technical screening a company runs when hiring Python
developers (backend, data, automation) at junior, mid-level and senior level, in an arcade format
(short, timed, multiple choice or predict-the-output).

Researched October 2026. Sources are public question collections, assessment vendors' test
descriptions, job postings, the official Python documentation and PEPs. Interview processes vary a
lot between companies: treat this as a synthesis, not a standard. The companion curriculum is
[python-curriculum.md](python-curriculum.md).

## 1. How Python screening usually works

| Stage | Typical format | Source evidence |
|---|---|---|
| Online skills test (vendor) | 8-11 multiple-choice / code-tracing questions plus 0-1 coding task, 10-40 min | Adaface (40 min, 8 MCQ + 1 coding, "code-tracing and scenario-based MCQ"), iMocha (11 questions, 25 min; roles: Python developer, backend, data analyst, automation), TestGorilla (10-min entry-level algorithm task checked by test cases) |
| Async take-home (about 30 min) | Small real task: REST endpoint, data transformation, find the bug | Kore1 |
| Technical deep dive (about 60 min) | Extend the take-home; reason about scale, errors, testing | Kore1, jobrise (mid-level 2026) |
| Code-reading / gotcha questions | "What does this print?" on mutable defaults, late binding, list multiplication, slicing, class attributes | Toptal question list, CodeSignal, GoLinuxCloud |
| Senior design discussion | GIL and choosing threads vs processes vs asyncio, event loop, profiling (cProfile, py-spy, tracemalloc), ORM N+1, system design | Kore1, EPAM, Interview Kickstart, SecondTalent |

Loop length reported by Kore1: 3-4 rounds for mid-level, 4-6 for senior.

## 2. Topics per level

| Area | Junior (0-2 y) | Mid-level (3-5 y) | Senior (6+ y) |
|---|---|---|---|
| Syntax, dynamic typing, built-in types, `type()` | Core | Assumed | Assumed |
| Numbers: `/` vs `//`, `%`, float precision, `round` (banker's) | Core | Assumed | `decimal`, `math.isclose` choices |
| Strings: f-strings, slicing, methods, immutability | Core | Assumed | Assumed |
| Truthiness, `and`/`or` return operands, chained comparisons | Core | Assumed | Assumed |
| `is` vs `==`, `None` checks | Core (`is None`) | Identity vs equality reasoning | Interning / small-int cache as an implementation detail only |
| list / tuple / dict / set, hashability | Core | Choosing the right structure, complexity | Big-O of operations, memory |
| Mutability, names and references, aliasing | Core | Shallow vs deep copy, `[[0]*n]*m` | Argument passing model ("call by object reference") |
| Comprehensions, generator expressions | List comprehension | Dict/set comprehensions, generator laziness, exhaustion | Memory trade-offs, pipelines |
| Sorting with `key`, `sorted` vs `.sort()` | Basic | `key=`, `lambda`, stability, tuples as keys | `functools.cmp_to_key`, custom ordering |
| Functions: defaults, `*args`/`**kwargs` | Core | Mutable default gotcha, keyword-only / positional-only | Signature design |
| Scope: LEGB, `global`, `nonlocal`, `UnboundLocalError` | Know LEGB | Core | Assumed |
| Closures and late binding in loops | Rarely | Core gotcha | Assumed |
| Decorators | Know they exist | Write one, `functools.wraps`, decorators with arguments | Retry/backoff, caching (`lru_cache`), class decorators |
| Iterators, generators, `yield` | Know `for` uses them | Write generators, `yield from`, `StopIteration` | `send`, `close`, coroutines history, lazy pipelines |
| Context managers | Use `with open(...)` | Write `__enter__`/`__exit__`, `@contextmanager` | Suppressing exceptions, `ExitStack`, resource design |
| Exceptions | try/except | `else`/`finally`, custom exceptions, hierarchy, `raise ... from` | Exception design, `ExceptionGroup`/`except*` |
| OOP: classes, `__init__`, `self` | Basic | Dunder methods, `@property`, class vs instance attributes, `classmethod`/`staticmethod` | Descriptors, `__slots__`, `__new__`, metaclasses, `__init_subclass__` |
| Inheritance, `super()`, MRO | Single inheritance | `super()`, multiple inheritance basics | C3 linearization, cooperative `super()` |
| dataclasses | Rarely | `@dataclass`, `field(default_factory=...)`, `frozen` | `order`, `slots`, vs Pydantic / attrs |
| Type hints | Know syntax | Hints are not enforced at runtime; mypy | `Protocol`, generics, `TypedDict`, static analysis in CI |
| `collections`, `itertools`, `functools` | `Counter` maybe | `Counter`, `defaultdict`, `deque`, `itertools` basics | Choosing structures for performance |
| Modules, packages, `if __name__ == "__main__"` | Core | Imports, packages, virtual environments | Packaging, dependency management |
| Concurrency: GIL, threading, multiprocessing, asyncio | Not required | GIL basics; I/O-bound vs CPU-bound | Event loop internals, `gather`/`TaskGroup`, blocking calls in async code, free-threaded builds (PEP 703) |
| Testing, logging, profiling | Not required | pytest | cProfile, py-spy, tracemalloc |
| Frameworks (Django, FastAPI, Flask, pandas) | Optional | Usually required in backend/data postings | ORM N+1, async endpoints, Pydantic |

Sources for the level split: Kore1 (junior: data types, control flow, comprehensions, basic OOP,
file I/O; mid: generators, decorators, context managers, error handling, pytest, REST; senior:
metaclasses, async internals, memory profiling, system design), CodeSubmit (junior: lists vs tuples,
`*args`/`**kwargs`; mid: decorators, generators, shallow vs deep copy, context managers; senior: GIL,
memory management, metaclasses), jobrise mid-level 2026 (data structures, functions, classes,
iterators, exceptions, type hints, production judgment).

### What makes a candidate senior

- **Concurrency choice under the GIL**: threads for I/O, processes (or native extensions) for CPU,
  asyncio for many concurrent I/O tasks; never block the event loop (Kore1, Interview Kickstart,
  SecondTalent). Awareness that free-threaded CPython builds exist since 3.13 (PEP 703) but are
  optional.
- **Object model depth**: descriptors behind `property`/methods, MRO and cooperative `super()`,
  metaclasses vs `__init_subclass__` vs class decorators (EPAM, Interview Kickstart).
- **Generators and laziness**: pipelines, exhaustion, `send`/`close`.
- **Typing as tooling**: hints are documentation checked by external tools, not at runtime (PEP 484);
  `Protocol` for structural typing (PEP 544).
- **Production judgment**: profiling tools, error design, logging, ORM performance (Kore1, jobrise).

## 3. Job postings: what is asked for (2026 sample)

| Role | Recurring requirements | Source |
|---|---|---|
| Backend developer | Python 3.9+ with type hints and async/await; Django / FastAPI / Flask; PostgreSQL + ORM (Django ORM, SQLAlchemy); pytest; mypy / Ruff nice-to-have | hirist.tech backend postings, djinni Python developer posting, jobrise FastAPI 2026 |
| Senior backend | asyncio, ASGI, async endpoints, system design, CI/CD | hirist.tech senior backend posting, Kore1 |
| Data / ML pipeline | Validation, chunked processing, error handling, logging; pandas | Kore1 ("data ingestion pipeline feeding an ML model"), iMocha role list |
| Automation / scripting | Scripting, files, built-ins, web scraping, debugging | Adaface skills list, iMocha |

## 4. Question formats that fit the arcade

| Format in the sources | Bitwise Quest beat | Example |
|---|---|---|
| Code tracing "what is printed?" (Adaface, Toptal) | `predict` with exact stdout | `def f(x, items=[]): ...` called twice |
| "Which exception is raised?" | `predict` with the exception class name | `{}["x"]` → `KeyError` |
| Fill the gap | `type` / `pick` | `nonlocal` in a counter closure |
| Find the bug (Kore1 take-home) | `run` (broken starter → fixed) | Mutable default argument, missing `await` |
| Concept choice (senior) | `pick` | CPU-bound work under the GIL → `multiprocessing` |

## 5. Most-asked topics, ranked

Ranking by how often the point appears across the sources above (question collections, vendor
skill lists, postings) and how often it is the subject of a "what does this print?" gotcha.

1. **Mutable vs immutable types** (list/dict/set vs int/str/tuple), hashability (Toptal 1, Kore1, CodeSubmit)
2. **Mutable default arguments** (`def f(x, items=[])`) (Kore1, Toptal 12, Python FAQ)
3. **list vs tuple vs dict vs set** (CodeSubmit, Adaface, iMocha)
4. **`*args` / `**kwargs`** (Toptal 2, CodeSubmit)
5. **Decorators** (incl. `functools.wraps`, arguments, real use cases) (Kore1, Toptal 26/28, CodeSubmit)
6. **Generators / iterators / `yield`**, generator vs list comprehension (Toptal 23/24, CodeSubmit, Kore1)
7. **GIL and threading vs multiprocessing vs asyncio** (Kore1, CodeSubmit, Interview Kickstart, SecondTalent)
8. **Shallow vs deep copy**, `[[0]*n]*m` (Toptal 13/16, CodeSubmit)
9. **Comprehensions** (list, dict, set) (Toptal 17/21, Kore1)
10. **Scope / LEGB, `global`, `nonlocal`** (Toptal 5/6)
11. **Late binding closures in loops** (Toptal 11, Python FAQ)
12. **Context managers / `with`** (Toptal 27, CodeSubmit, Kore1)
13. **Exceptions: try/except/else/finally, custom exceptions** (Adaface, Kore1)
14. **Classes: `__init__`, class vs instance attributes, dunder methods, `@property`** (Toptal 9, Adaface)
15. **Inheritance, MRO, `super()`** (Toptal 29, EPAM)
16. **`is` vs `==`** (CodeSignal, GoLinuxCloud)
17. **Slicing** incl. out-of-range clamping and `[::-1]` (Toptal 10/18/19)
18. **Division `/` vs `//`, float precision** (Toptal 14)
19. **Async / await, event loop** (Kore1, postings)
20. **Type hints** (not enforced at runtime) (postings, jobrise)
21. **Sorting with `key` / lambda** (Toptal 3)
22. **dataclasses** (postings using modern Python, Pydantic adjacent)
23. **Modules vs packages, `__name__ == "__main__"`, PYTHONPATH** (Toptal 7/25)
24. **`collections` (Counter, defaultdict, deque), `itertools`** (Toptal 15 `__missing__`, practical tasks)
25. **Metaclasses, descriptors, `__slots__`, memory/GC** (senior only: CodeSubmit, EPAM, Interview Kickstart)

## 6. Accuracy notes for content authors

- **Small int caching**: `a = 256; b = 256; a is b` is `True` in CPython only because of an
  implementation detail (the C API docs describe a cache of small ints). Do **not** teach it as a
  language rule or put `is` on numbers/strings in a bank as a fact. Teach: use `==` for values, `is`
  only for `None` (and other singletons). PEP 8: "Comparisons to singletons like None should always
  be done with `is` or `is not`".
- **`round()`** uses round-half-to-even: `round(2.5)` is `2`; `round(2.675, 2)` is `2.67` because of
  binary floats (documented in the `round` built-in docs).
- **Type hints** are not checked at runtime (PEP 484: "no type checking happens at runtime").
- **Runner**: Pyodide 314.0.7 = **CPython 3.14**, code runs as file `main.py`, stdout captured; an
  uncaught exception prints a standard traceback whose last line is e.g. `KeyError: 'k'`.
  `asyncio.run(...)` and `time.sleep` work; top-level `await` does not.
- **`return` inside `finally`** emits a `SyntaxWarning` in Python 3.14 (PEP 765, printed to stderr).
  Avoid the pattern in questions.
- **Annotations evaluation** changed in 3.14 (PEP 649 / PEP 749, deferred evaluation). Avoid questions
  that inspect `__annotations__`.
- **Threads in the browser runner**: `threading.Thread(...).start()` fails in Pyodide with
  `RuntimeError: can't start new thread`, so `threading`, `run_in_executor` / `ThreadPoolExecutor` and
  `multiprocessing` are concept-only (`pick` questions without executed output), never `run` or
  `predict` beats.
- **Set order** is not guaranteed: always `sorted(...)` before printing a set. Dict order is insertion
  order (guaranteed since 3.7).
- **Error messages** change between versions (e.g. 3.14 says `cannot use 'list' as a dict key
  (unhashable type: 'list')` where 3.13 said `unhashable type: 'list'`). Questions about errors should ask for the **exception class name**, not the message.

## Sources

Question collections and interview guides
- Kore1, Python developer interview questions: https://www.kore1.com/python-developer-interview-questions/
- CodeSubmit, Python interview questions (2026): https://www.codesubmit.io/blog/python-interview-questions
- CodeSignal, Key Python interview questions from basic to senior: https://codesignal.com/blog/interview-prep/key-python-interview-questions-and-answers-from-basic-to-senior-level/
- Toptal, Python interview questions: https://www.toptal.com/python/interview-questions
- jobrise, Mid-level Python interview questions 2026: https://jobrise.io/en/blog/python-interview-questions-mid-level-2026/
- GoLinuxCloud, Python developer interview questions: https://www.golinuxcloud.com/python-developer-interview-questions/
- EPAM, Senior Python developer interview questions: https://anywhere-referral.epam.com/en/blog/senior-python-developer-interview-questions
- Interview Kickstart, Advanced Python interview questions: https://www.interviewkickstart.com/blogs/interview-questions/advanced-python-interview-questions
- SecondTalent, Advanced Python backend interview questions: https://secondtalent.com/?p=31031

Assessment vendors
- Adaface Python online test: https://www.adaface.com/assessment-test/python-online-test
- iMocha Python test: https://www.imocha.io/tests/python-test-assessment
- TestGorilla Python (entry-level algorithms): https://testgorilla.com/test-library/programming-skills-tests/python-coding-test-entry-level-algorithms

Job postings and market notes
- hirist.tech Python backend developer: https://www.hirist.tech/j/python-backend-developer-1646917
- hirist.tech Senior backend developer: https://www.hirist.tech/j/senior-backend-developer-1643196
- djinni Python developer: https://djinni.co/jobs/775428-python-developer
- jobrise, FastAPI developer jobs 2026: https://jobrise.io/en/blog/fastapi-developer-jobs-python-2026/

Official documentation and PEPs
- Programming FAQ (mutable defaults, lambdas in loops, `UnboundLocalError`): https://docs.python.org/3/faq/programming.html
- Tutorial: https://docs.python.org/3/tutorial/
- Data model: https://docs.python.org/3/reference/datamodel.html
- Execution model (names, binding, scopes): https://docs.python.org/3/reference/executionmodel.html
- Built-in functions (`round`, `sorted`, `iter`): https://docs.python.org/3/library/functions.html
- Floating point arithmetic: https://docs.python.org/3/tutorial/floatingpoint.html
- `copy`: https://docs.python.org/3/library/copy.html
- `collections`: https://docs.python.org/3/library/collections.html
- `itertools`: https://docs.python.org/3/library/itertools.html
- `functools`: https://docs.python.org/3/library/functools.html
- `dataclasses`: https://docs.python.org/3/library/dataclasses.html
- `asyncio`: https://docs.python.org/3/library/asyncio.html
- `contextlib`: https://docs.python.org/3/library/contextlib.html
- Integer objects (small-int cache is an implementation detail): https://docs.python.org/3/c-api/long.html
- Glossary, GIL: https://docs.python.org/3/glossary.html#term-global-interpreter-lock
- PEP 8 style guide: https://peps.python.org/pep-0008/
- PEP 255 generators: https://peps.python.org/pep-0255/
- PEP 318 decorators: https://peps.python.org/pep-0318/
- PEP 343 `with`: https://peps.python.org/pep-0343/
- PEP 3104 `nonlocal`: https://peps.python.org/pep-3104/
- PEP 484 type hints: https://peps.python.org/pep-0484/
- PEP 492 async/await: https://peps.python.org/pep-0492/
- PEP 498 f-strings: https://peps.python.org/pep-0498/
- PEP 544 Protocols: https://peps.python.org/pep-0544/
- PEP 557 dataclasses: https://peps.python.org/pep-0557/
- PEP 572 assignment expressions: https://peps.python.org/pep-0572/
- PEP 634 structural pattern matching: https://peps.python.org/pep-0634/
- PEP 654 exception groups: https://peps.python.org/pep-0654/
- PEP 703 optional GIL (free-threaded build): https://peps.python.org/pep-0703/
- PEP 765 disallow return/break/continue that exit a finally block: https://peps.python.org/pep-0765/
- Pyodide (CPython for WebAssembly) docs: https://pyodide.org/en/stable/
