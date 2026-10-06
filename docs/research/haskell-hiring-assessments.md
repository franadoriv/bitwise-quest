# Haskell hiring assessments: what companies test, by level

Research behind the entry exams of the Haskell planet (Lambdara, pack `haskell`) in Bitwise Quest
(`content/haskell/exams.ts`, still to be written). Goal: simulate the technical screening a
company runs when hiring Haskell developers at junior, mid-level and senior level, in an arcade
format (short, timed, multiple choice). The teaching side is in
[haskell-curriculum.md](haskell-curriculum.md).

Researched October 2026. The sources are public question collections, assessment vendors' test
descriptions, real job postings, hiring write-ups from Haskell employers, and the official
documentation (Haskell 2010 Report, GHC User's Guide, base/containers Haddocks, Haskell Wiki,
Learn You a Haskell, Real World Haskell). The Haskell market is small and most screening is done
by the teams themselves rather than by vendor tests: treat this as a synthesis, not a standard.

Every code claim in this file and in the curriculum was compiled and run with **GHC 9.8.4** on
Compiler Explorer (`POST https://godbolt.org/api/compiler/ghc984/compile`, single `Main`
module, no extra libraries selected) on 2026-10-06. That matters for a few version-sensitive
facts listed in section 3 (`foldl'` is **not** in the 9.8 Prelude, `-Wx-partial` warnings on
`head`/`tail`, `GHC2021` is the default language so `BangPatterns` work without a pragma, `mtl`
2.3 no longer re-exports `Control.Monad`).

## 1. Who hires Haskell, and how they screen

| Sector | Typical employers (public postings) | What the postings ask for |
|---|---|---|
| Fintech and banking | Standard Chartered (front-office Modelling and Analytics, Haskell and its in-house dialect Mu), Mercury (banking for startups, Haskell backend + Elm/TS front end), Digital Asset (DAML, Haskell-derived), Juspay (payments), Bellroy, Scrive | Strong Haskell, data modelling with types, SQL/Postgres, CS fundamentals (algorithms, complexity, concurrency), code quality |
| Blockchain | Input Output (IOG: Cardano, Plutus), MLabs, Coinweb, Obsidian | Haskell 2+ years, type-level programming, property-based testing (QuickCheck/Hedgehog), EUTXO model a plus, compilers/PL background a plus |
| Compilers, PL, verification | Well-Typed and Tweag/Modus Create (consultancies, GHC contributors), Galois, Serokell, GitHub Semantic (historic), Meta (Sigma/Haxl spam filtering) | GHC internals, laziness and performance (profiling, space leaks), type system extensions (GADTs, type families), parsers |
| Backend / SaaS | Mercury, Hasura (historic), Channable, NoRedInk (Haskell + Elm), Flipstone, Freckle | Web services (Servant, Yesod, Warp), effect systems or mtl, testing, Postgres, Nix |

Screening formats seen across sources:

| Stage | Typical format | Source evidence |
|---|---|---|
| Recruiter screen | 30 min, motivation; key filter is willingness to work in Haskell (and Elm at Mercury) | Mercury interview-process write-ups (techprep, dataford) |
| Values / behaviour assessment | Online questionnaire before any technical step | Standard Chartered Haskell postings on Haskell Discourse ("Valued Behaviours Assessment" must be passed before the team sees the application) |
| Vendor skills test | 10-12 questions, 40-60 min, mixed MCQ + coding: list basics, recursion, higher-order functions, type classes, monads | iMocha Haskell test (40 min, 12 questions, entry/mid/expert; recursive functions, higher-order functions, runtime system, compiler), WeCP Haskell assessment (60 min, 11 questions, 70% pass; basics, FP concepts, type classes, extensions, monads, concurrency) |
| Technical screen (live) | 60 min: practical coding task or PR-style review (Mercury reviews a SQL schema / data-model PR) | Mercury process write-ups |
| Take-home (mid/senior) | Realistic problem (a ledger primitive, a parser, a small service), judged on types, tests and write-up | Mercury (senior/staff), Well-Typed's historic hiring post (a technical problem used during interviews) |
| Onsite loop | Applied coding, system design, "craft" round, behavioural | Mercury; Input Output ("overall experience and performance during the interview process") |
| Concept interview | Explain laziness and space leaks, Maybe vs null, type classes vs interfaces, Functor/Applicative/Monad, purity and IO, `foldl` vs `foldr` vs `foldl'` | secondtalent, hyring, dev.to, vskills, theknowledgeacademy question lists |

## 2. Topics per level

| Area | Junior | Mid-level | Senior |
|---|---|---|---|
| Expressions, immutability, `let`/`where`, `if` must have `else` | Core | Assumed | Assumed |
| Basic types (`Int` vs `Integer`, `Double`, `Char`, `String = [Char]`, `Bool`), type signatures, inference | Core | Assumed | Assumed |
| Numeric gotchas (`div` vs `/`, `fromIntegral`, `length` returns `Int`, negative literals need parentheses, `div`/`mod` vs `quot`/`rem`) | Core | Core | Assumed |
| Lists: `:`, `++`, ranges, comprehensions, `take`/`drop`/`zip`, strings as lists | Core | Assumed | Assumed |
| Pattern matching, guards, `case`, `otherwise`, exhaustiveness | Core | Core | Assumed |
| Recursion (base case, accumulator with `go`) | Core | Core | Tail calls vs guarded recursion |
| Higher-order functions (`map`, `filter`, `zipWith`, lambdas) | Core | Assumed | Assumed |
| Currying, partial application, operator sections, `(.)`, `($)` | Basic | Core | Point-free style judgment |
| Folds (`foldr`, `foldl`, `foldl'`, associativity, `scanl`) | `foldr`/`sum` | `foldl` vs `foldl'`, folding to build structures | Laziness of `foldr` on infinite lists, strictness |
| Laziness (infinite lists, thunks, `seq`, WHNF, space leaks, bottom) | Infinite lists with `take` | Thunks, `seq`, `foldl'` | WHNF vs NF (`deepseq`), strict fields, bang patterns, profiling |
| `Maybe` / `Either` instead of null and exceptions | Core | Core | Error design, `ExceptT` |
| Algebraic data types, records, record update | Core | Core | GADTs, phantom types, smart constructors |
| Type classes (`Eq`, `Ord`, `Show`, `Read`, deriving, custom instances, default methods) | `deriving` | Custom instances, constraints | Laws, `Semigroup`/`Monoid`, `Foldable`/`Traversable`, typeclass design |
| `newtype` vs `data` vs `type` | Rare | Core | Laziness difference, zero cost, `deriving newtype` |
| Functor / Applicative / Monad, `do` notation, `>>=` | Rare | Core | Laws, list/Maybe/Either/State/Reader monads, transformers (mtl) |
| `IO`, purity, `mapM_`/`traverse`/`sequence`, `return` is not a jump | Basic `do` in `main` | Core | Effects design, exceptions in IO |
| `Data.Map` / `Data.Set` (containers) | Rare | Core | `Map.Strict` vs lazy, complexity |
| Partial functions (`head []`, `fromJust`, `!!`, `Map.!`), `undefined`, `error` | Recognize | Core | Avoidance as policy (`NonEmpty`, total functions) |
| Concurrency (`forkIO`, `MVar`, STM) | No | Rare | Core at blockchain/fintech |
| Testing (HUnit/Hspec, QuickCheck properties) | No | Basic | Core (property-based testing is in almost every senior posting) |
| Tooling (GHC, cabal/stack, `-Wall`, HLS, Nix) | `ghci`, `runghc` | cabal | Profiling (`+RTS -s`, heap profiles), build tooling, Nix |
| Type system extensions (GADTs, type families, RankN, DataKinds) | No | No | Common at compilers/blockchain |

Main signals from postings (senior): strong production Haskell, types used for domain
modelling, property-based testing, performance and laziness awareness, Postgres/SQL, and
either fintech domain interest or PL/compiler background. Salary bands quoted publicly:
USD 140-190k (Input Output), GBP 60-100k (Well-Typed).

## 3. Question formats and how they map to the game

| Format seen in assessments | Game beat | Haskell example |
|---|---|---|
| Output prediction | `predict` with output options + `check.stdout` | `print (foldr (-) 0 [1,2,3], foldl (-) 0 [1,2,3])` prints `(2,-6)` |
| "Does it compile?" (type errors) | `predict` Yes/No + `check.compiles` | `double 2.5` with `double :: Int -> Int`: `No instance for 'Fractional Int'` |
| "What happens at runtime?" | `predict` with message options; the run fails with that stderr text | `head []`: `Prelude.head: empty list` |
| Laziness puzzles | `predict` "prints / crashes" | `print (length [1, undefined, 3])` prints `3` |
| Type questions | `pick` "what is the type of ..." | `map :: (a -> b) -> [a] -> [b]` (DOC, cite base docs) |
| Fill in the blank | `type` (exact token) | `otherwise`, `where`, `deriving`, `<$>`, `>>=`, `Just`, `foldl'` |
| Reorder | `order` | a recursive function: signature, base case, recursive case |
| Spot the bug | `pick` "which fix?" | `foldl` space leak → `foldl'`; `map print xs` in a `do` block → `mapM_ print xs` |
| Long coding task | Not a 30-50 s question; approximated with `run` beats and "which fix" picks | |

Runtime facts for the verifier (all observed on godbolt `ghc984`):

- A runtime error exits with code 1 and stderr `<program>: <message>`; on godbolt the program is
  called `output.s`, so stderr reads `output.s: Prelude.head: empty list` followed by a
  `CallStack (from HasCallStack):` block with file/line details. Check for the **message
  substring only** (`Prelude.head: empty list`, `Prelude.undefined`, `divide by zero`,
  `Maybe.fromJust: Nothing`, `Map.!: given key is not an element in the map`,
  `Non-exhaustive patterns in function describe`, `No match in record selector radius`,
  `Prelude.read: no parse`, `Prelude.!!: index too large`, `<<loop>>`), never the path, line
  numbers or program name.
- Anything printed before the crash is still in stdout (it is flushed on exit). A program
  killed for memory/time (`SIGKILL`, code 137) loses its buffered stdout entirely: never write
  a check that relies on a leak or an infinite loop. `foldl (+) 0 [1..10000000]` was killed;
  `foldl (+) 0 [1..1000000]` and `foldl' (+) 0 [1..10000000]` finished.
- Non-exhaustive guards report `Non-exhaustive patterns in function f` (same message as
  patterns).
- Compile errors come in `buildResult.stderr` with a `[GHC-xxxxx]` code. The godbolt locale is
  not UTF-8, so quotes are ASCII (`` `Int' ``) and bullets are `*`; on a normal UTF-8 terminal
  the same message uses `‘Int’` and `•`. Content's `error.compiler` should use the UTF-8
  form a learner sees locally, and checks should only use `compiles: false`.
- Warnings (for example `[-Wx-partial]` on every `head`/`tail` use) also appear in
  `buildResult.stderr` but the build succeeds (`code 0`). Do not treat stderr as failure.
- `putStrLn` of a non-ASCII character **crashes** on godbolt:
  `<stdout>: commitBuffer: invalid argument (cannot encode character '\233')`. Keep all
  printed text ASCII. `print "héllo"` is safe (it shows `"h\233llo"`).
- stdin is empty: `getLine` fails with `<stdin>: hGetLine: end of file`. Do not read input.
- Available without selecting libraries: `base`, `containers` (`Data.Map`, `Data.Map.Strict`,
  `Data.Set`), `mtl` (`Control.Monad.State`, `Control.Monad.Reader`), `stm`, `deepseq`, `text`,
  `bytestring`. QuickCheck/Hspec are **not** available: testing questions are [DOC].

## 4. Ranked list: most-asked Haskell screening points

Ranked by how often the point appears across the sources (question lists, vendor topic lists,
postings, beginner gotcha pages). Proposed exam topic id in brackets.

1. Laziness: what it is, infinite lists, benefits and drawbacks, space leaks [`laziness`]
2. Monads: what they are, `Maybe`/`IO`/list examples, `>>=` and `do` notation [`monads`]
3. Type classes vs OO interfaces; `Eq`/`Ord`/`Show`; deriving; custom instances [`typeclasses`]
4. Pure functions, immutability, referential transparency; how IO stays pure [`io`, `basics`]
5. `Maybe` / `Either` instead of null and exceptions [`maybe_either`]
6. Pattern matching, guards, exhaustiveness [`patterns`]
7. Higher-order functions (`map`, `filter`, folds) and recursion [`hof`, `recursion`]
8. `foldl` vs `foldr` vs `foldl'` (associativity, laziness, stack/heap) [`folds`]
9. Type inference and signatures; `Int` vs `Integer`; numeric classes [`types`]
10. Currying, partial application, sections, `(.)` and `($)` [`currying`]
11. Functor and Applicative (`fmap`, `<$>`, `<*>`), Functor/Monad laws [`functors`]
12. Algebraic data types and records [`adts`]
13. `newtype` vs `data` vs `type` [`typeclasses`]
14. `seq`, WHNF vs normal form, bang patterns, strict fields, `deepseq` [`laziness`]
15. Partial functions and bottom (`head []`, `undefined`, `error`) [`patterns`, `laziness`]
16. Lists and strings (`String = [Char]`, comprehensions, ranges) [`lists`]
17. `Data.Map` and other containers [`containers`]
18. `mapM_` / `traverse` / `sequence` / `forM_` [`io`]
19. Monad transformers / mtl (`State`, `Reader`, `ExceptT`) [`effects`]
20. Concurrency: `forkIO`, `MVar`, STM [`concurrency`]
21. Property-based testing (QuickCheck) [`tooling`]
22. Type system extensions (GADTs, type families, RankNTypes) [`effects` or a future `types_advanced`]
23. Profiling and performance (`+RTS -s`, strictness analysis, `-O2`) [`laziness`, `tooling`]

## 5. Proposed bank design (summary; details in the curriculum)

| Exam | Draws / bank | Pass | s/question | Topic mix |
|---|---|---|---|---|
| `junior`, Junior Haskell Developer | 12 / 22 | 70% | 30 | basics 4, types 3, lists 4, patterns 4, recursion 3, hof 4 |
| `mid`, Mid-level Haskell Developer | 14 / 24 | 70% | 40 | currying 3, folds 3, laziness 3, maybe_either 3, adts 3, typeclasses 4, functors 3, containers 2 |
| `senior`, Senior Haskell Developer | 15 / 26 | 75% | 50 | laziness 4, folds 2, typeclasses 3, functors 2, monads 4, io 3, containers 2, effects 3, concurrency 2, tooling 1 |

## 6. Sources

Question collections and interview guides:
- secondtalent, Top 20 Haskell developer interview questions: https://www.secondtalent.com/?p=36329
- hyring, Haskell interview questions 2026 (fresher / intermediate / scenario levels): https://hyring.com/jobseeker-toolkit/interview-questions/technical/haskell
- dev.to, Top 5 interview questions for Haskell developers: https://dev.to/ersocon/top-5-interview-questions-for-haskell-developers-8po
- The Knowledge Academy, Haskell interview questions: https://www.theknowledgeacademy.com/interview-questions/haskell-interview-questions/
- Vskills, Haskell language interview questions: https://www.vskills.in/interview-questions/programming-languages-interview-questions/haskell-language-interview-questions
- RoleCatcher, Haskell skill interview guide: https://rolecatcher.com/interviews/skills/knowledge/icts/software-and-applications-development-and-analysis/haskell

Assessment vendors:
- iMocha Haskell online test (40 min, 12 questions, entry/mid/expert): https://www.imocha.io/tests/haskell-online-test
- iMocha, How to hire a Haskell developer: https://www.imocha.io/blog/how-to-hire-haskell-developer
- WeCP Haskell assessment (60 min, 11 questions, 70% pass): https://wecreateproblems.com/tests/haskell-assessment-test

Employers, postings and hiring write-ups:
- Standard Chartered Haskell jobs (Haskell Discourse): https://discourse.haskell.org/t/haskell-jobs-at-standard-chartered-various-locations-and-seniority/6157 and https://discourse.haskell.org/t/haskell-jobs-with-standard-chartered-various-locations/10204
- Input Output Haskell engineering jobs: https://discourse.haskell.org/t/haskell-engineering-jobs-input-output/7048
- DAML/Haskell developer (Insight Global): https://jobs.insightglobal.com/find_a_job/new-york/job-444964
- MLabs remote Haskell engineer: https://www.itjobswatch.co.uk/jv/Mlabs/Remote-Haskell-Engineer-Job-Peterborough-Cambridgeshire-UK-51hl63
- Coinweb senior Haskell developer: https://cryptojobslist.com/jobs/senior-haskell-developer-at-coinweb-kiev-barcelona-bangkok
- Built In, Haskell software engineer: https://builtin.com/job/haskell-software-engineer/6539428
- eFinancialCareers, Haskell jobs in finance: https://www.efinancialcareers.co.uk/news/2023/07/programming-language-haskell-jobs-in-finance
- Mercury interview process (techprep): https://www.techprep.app/blog/mercury-interview-process
- Mercury interview guide (dataford): https://dataford.io/interview-guides/mercury
- Well-Typed, On hiring Haskell people: https://well-typed.com/blog/43
- Well-Typed job posting (2024): https://www.well-typed.com/blog/2024/04/haskell-development-job-with-well-typed

Official references and books:
- Haskell 2010 Language Report: https://www.haskell.org/onlinereport/haskell2010/
- GHC 9.8.4 User's Guide: https://downloads.haskell.org/ghc/9.8.4/docs/users_guide/
- GHC User's Guide, GHC2021 language edition: https://downloads.haskell.org/ghc/9.8.4/docs/users_guide/exts/control.html
- base Prelude Haddock: https://hackage.haskell.org/package/base/docs/Prelude.html
- containers, Data.Map: https://hackage.haskell.org/package/containers/docs/Data-Map.html
- Haskell Wiki, Foldr Foldl Foldl': https://wiki.haskell.org/Foldr_Foldl_Foldl%27
- Haskell Wiki, Typeclassopedia: https://wiki.haskell.org/Typeclassopedia
- Haskell Wiki, Common misunderstandings: https://wiki.haskell.org/Common_Misunderstandings
- Haskell Wiki, Space leak: https://wiki.haskell.org/Space_leak
- Learn You a Haskell for Great Good: https://learnyouahaskell.github.io/chapters.html
- Real World Haskell, ch. 1 (negative numbers need parentheses) and ch. 4 (left folds, laziness and space leaks, `seq`): https://book.realworldhaskell.org/read/ (O'Reilly mirror: https://www.oreilly.com/library/view/real-world-haskell/9780596155339/ch01.html)
- Columbia COMS 4995 notes on laziness: https://www.cs.columbia.edu/~sedwards/classes/2025/4995-fall/laziness.pdf
- Compiler Explorer API: https://github.com/compiler-explorer/compiler-explorer/blob/main/docs/API.md
