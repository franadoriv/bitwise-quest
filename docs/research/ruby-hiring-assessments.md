# Ruby hiring assessments: what companies test, by level

Research behind the entry exams of the Ruby planet (Rubion, pack `ruby`) in Bitwise Quest
(`content/ruby/exams.ts`, still to be written). Goal: simulate the technical screening a company
runs when hiring Ruby developers at junior, mid-level and senior level, in an arcade format
(short, timed, multiple choice). The teaching side is in [ruby-curriculum.md](ruby-curriculum.md).
Rails itself (ActiveRecord, routing, migrations, N+1 queries) belongs to the Rails moon and is
researched separately; this file covers **core Ruby** only, but it notes where Rails shops ask
core-Ruby questions, because almost every Ruby job is a Rails job.

Researched October 2026. Sources are public question collections, assessment vendors' test
descriptions, real job postings (worldwide and in Japan), the Ruby Association certification
scope and the official Ruby documentation (docs.ruby-lang.org, 3.4). Interview processes vary a
lot between companies: treat this as a synthesis, not a standard.

Every code claim in this file and in the curriculum was run on **Ruby 3.4.7** through the
Compiler Explorer API (`POST https://godbolt.org/api/compiler/ruby347/compile`), on 2026-10-06.
That matters for version-sensitive facts: the `it` block parameter (3.4), the new
`Hash#inspect` format (`{a: 1}`, `{"a" => 1}`, 3.4), the new error message quoting
(`'Hash#fetch'`, 3.4), chilled string literals (3.4: `"abc".frozen?` is `false` and mutation does
not warn by default), `Data` (3.2), endless methods (3.0), Ruby 3 keyword argument separation
(3.0) and pattern matching (stable since 3.0, find pattern since 3.0/3.1).

## 1. Who hires Ruby developers and how they screen

Ruby hiring is dominated by Rails product companies: Shopify, GitHub, GitLab, Basecamp/37signals,
Airbnb (legacy), Stripe (parts), Zendesk, Instacart, and in Japan Cookpad, SmartHR, freee,
Money Forward, pixiv, Wantedly, note, and many startups. Japan is unusual: Ruby is a domestic
language with a large community, a national certification (Ruby Association Certified Ruby
Programmer Silver/Gold) and many Rails job postings asking for "Rails 3+ years".

| Stage | Typical format | Source evidence |
|---|---|---|
| Online skills test (vendor) | 8-10 multiple-choice or code-reading questions plus 0-1 coding task, 20-40 min | Adaface Ruby test (40 min: 8 MCQs + 1 coding question; samples on arrays/strings, class and `self`, exceptions, `Sample.new.class` style puzzles), iMocha Ruby test (20 min, 10 questions: control flow, loops, arrays and hashes, blocks and sorting, hashes and symbols, procs and lambdas) |
| Generic algorithm test taken in Ruby | 1-3 coding tasks, 15-90 min | TestGorilla (entry-level algorithms 15 min, intermediate 35 min, debugging 35 min, data-structure tests on arrays, strings, hash tables), HackerRank / Codility / CodeSignal with Ruby selected |
| Company Ruby quiz | Short multiple-choice and write-in quiz on Ruby concepts and testing | GitLab's initial technical assessment ("a short, multiple-choice and write in quiz to assess your understanding of general Ruby concepts and testing", candidate reports) |
| Certification (Japan) | Ruby Silver (syntax, built-in classes, OOP basics) and Gold (metaprogramming, Proc/lambda, refinements, pattern matching), 50 MCQ in 90 min, 75% pass | Ruby Association exam scope; often listed as "歓迎" (nice to have) in Japanese postings and used by bootcamp graduates to show baseline skill |
| Technical interview | Explain symbols vs strings, blocks/procs/lambdas, `include` vs `extend`, method lookup, `nil`/truthiness, duck typing, `method_missing`, class variables | Toptal hiring guide, Adaface blog (61 questions), educative, dev.to collections, Glassdoor reports ("blocks/procs/lambdas, the Ruby object model and ActiveRecord are the highest-frequency topics") |
| Pair programming / code review (60-90 min) | Extend an existing small Ruby/Rails project, review a merge request, write tests (RSpec or Minitest), refactor | GitLab technical interview (90 min, pair programming on a project, leave a review), Shopify and Cookpad postings stressing tests and code review |
| Senior design discussion | Performance and memory (GC, object allocations, frozen strings), concurrency (GVL, threads, Ractor, background jobs), metaprogramming trade-offs, gem/API design, profiling | Adaface advanced questions (memory management, profiling, GC efficiency, JIT/YJIT, memoization), GitLab senior/staff expectations (define standards and best practices) |

## 2. Topics per level

| Area | Junior | Mid-level | Senior |
|---|---|---|---|
| Everything is an object, `.class`, dynamic typing, `puts` vs `p` vs `print` | Core | Assumed | Assumed |
| `nil` and truthiness (only `nil` and `false` are falsy; `0`, `""`, `[]` are truthy) | Core | Assumed | Assumed |
| Numbers (Integer division and `%` with negatives, Float imprecision, `to_i`/`Integer()`, bignums, Rational) | Core | Assumed | Float/BigDecimal for money |
| Strings (mutable, `<<` vs `+=`, interpolation needs double quotes, bang methods, frozen literals magic comment) | Core | Core | Frozen strings and allocations |
| Symbols vs strings (identity, immutability, hash keys) | Core | Assumed | Symbol GC, `"b": 2` gotcha |
| Control flow (`if`/`unless`/`case`/`when` with `===`, modifiers, `&&` vs `and`, `\|\|=`, `&.`) | Core | Core | Assumed |
| Methods (implicit return, default/keyword args, splat `*`/`**`, bang and predicate names) | Core | Core | Keyword separation (Ruby 3) |
| Arrays (indexing, negative indexes, `<<`, `dup`, `Array.new(3, [])` trap) | Core | Core | Assumed |
| Hashes (symbol keys, `fetch` vs `[]`, default values, `Hash.new([])` shared-default trap, insertion order) | Core | Core | Assumed |
| Ranges (`..` vs `...`, endless ranges, `===` in `case`) | Basic | Core | Assumed |
| Blocks, `yield`, `block_given?` | Basic | Core | Assumed |
| Procs vs lambdas (arity, `return` semantics), closures, `&:sym` | Rare | Very common | Assumed |
| Enumerable (`map`/`select`/`reject`/`reduce`/`each_with_object`/`group_by`/`tally`/`lazy`) | `each` vs `map` | Core | Lazy enumerators, performance |
| Classes, `initialize`, `attr_accessor`, `self`, visibility (`private`/`protected`) | Basic | Core | Assumed |
| Inheritance, `super` vs `super()`, modules and mixins (`include`/`extend`/`prepend`), `ancestors` | Rare | Very common | Method lookup in depth |
| Class variables `@@` vs class instance variables | Rare | Common | Common gotcha |
| `Comparable`, `Enumerable` via `<=>` and `each`, duck typing, `respond_to?` | Rare | Core | Assumed |
| Object equality (`==`, `eql?`, `equal?`, `hash`), `dup` vs `clone` vs `freeze` | Rare | Core | Core (hash keys, value objects) |
| Exceptions (`begin`/`rescue`/`else`/`ensure`, `retry`, custom errors under `StandardError`, `raise` vs `fail`, hierarchy) | Basic | Core | Error design, `cause`, `throw`/`catch` |
| `Struct` / `Data` | Rare | Common | Value objects |
| Metaprogramming (`send` vs `public_send`, `method_missing` + `respond_to_missing?`, `define_method`, open classes, refinements) | Rare | Basic | Core |
| Pattern matching (`case`/`in`, find pattern, pin, `deconstruct_keys`) | Rare | Basic | Common (Gold exam topic) |
| Testing (Minitest, RSpec, TDD) | Basic | Core | Test design, slow tests |
| Concurrency (threads, GVL, Mutex, Queue, Ractor, Fiber) | Rare | Basic | Core |
| Runtime (GC, memory footprint, YJIT, profiling and benchmarking) | Rare | Rare | Core |
| Tooling (Bundler, gems, `require` vs `load`, RuboCop) | `bundle install`, gems | Core | Gem authoring, versioning |

Main signals from job postings: Rails experience (3+ years is the common bar in Japan, 3-7 years
at Shopify partner and senior roles), testing culture (RSpec or Minitest, "loves writing
tests" at Cookpad), SQL and RDB design, background jobs, REST APIs, front-end basics
(JavaScript/React/TypeScript), cloud (AWS), Kubernetes at larger companies. Senior postings add
performance at scale (Shopify: millions of stores, hundreds of millions of requests a day),
mentoring and defining code standards (GitLab senior/staff).

## 3. Question formats and how they map to the game

| Format seen in assessments | Game beat | Ruby example |
|---|---|---|
| Output prediction | `predict` with output options + `check.stdout` | `puts -7 / 2` prints `-4`; `p({"a" => 1})` prints `{"a" => 1}` |
| "Is this valid Ruby?" | `predict` Yes/No + `check.syntax` (Prism reports `syntax error(s) found (SyntaxError)`, nothing runs) | `class hero; end`, `else if` instead of `elsif`, `[1].map { \|x\| it }` |
| "What happens?" (which exception) | `predict` with exception options; the run is expected to end with that class in stderr | `{}.fetch(:k)` → `KeyError`; `nil + 1` → `NoMethodError`; `"5" + 5` → `TypeError` |
| Spot the bug | `predict` or `pick` "which fix is right?" | `Hash.new([])` shared default; `hp = hp + 5` in a setter context; `each` used instead of `map` |
| Fill in the blank | `type` (exact token) | `yield`, `block_given?`, `attr_accessor`, `super`, `ensure`, `include`, `freeze`, `in` |
| Reorder statements | `order` | `begin` → `rescue` → `else` → `ensure` → `end` |
| Long coding task | Not a 30-50 s question; approximated with `run` beats in lessons and "which fix" picks in exams | |

Runtime note for the verifier (Compiler Explorer, `ruby347`):

- A clean run returns `code: 0`, `stdout[]` lines and empty `stderr`.
- An uncaught exception returns `code: 1`; anything printed before it is still in `stdout`; the
  stderr starts with `<file>:<line>:in '<Class#method>': <message> (<ExceptionClass>)`, for
  example `/app/output.s:4:in 'Hash#fetch': key not found: :k (KeyError)`. **The file name on
  Compiler Explorer is `/app/output.s`, not `main.rb`**, so never assert on the file name: assert
  on `(KeyError)` and on the message. Ruby's `error_highlight` adds the source line and `^^^`
  markers to stderr for some errors (`NoMethodError`, `TypeError`).
- A syntax error also returns `code: 1` (the build step reports success, `buildResult.code` 0),
  with **empty stdout** (nothing runs, not even the lines before the error) and stderr containing
  `syntax error found (SyntaxError)` or `syntax errors found (SyntaxError)` (Prism, singular or
  plural depending on the count) plus a "Unmatched keyword, missing `end' ?" hint. A checker
  should match `(SyntaxError)`.
- Warnings go to stderr but do not change `code` (for example `warning: string literal in
  condition`, `warning: Ractor is experimental...`). Avoid them in content, or ignore stderr when
  `code` is 0.
- `Encoding.default_external` is `US-ASCII` there: `puts "café"` prints `café`, but
  `p "café"` prints `"café"`. Keep non-ASCII text out of `p`/`inspect` questions.

## 4. Ranked list: most-asked Ruby screening points

Ranked by how often the point appears across the sources (question lists, vendor samples,
certification scope, postings). Proposed exam topic id in brackets.

1. Blocks, procs and lambdas: `yield`, `block_given?`, arity strictness, `return` inside a proc vs a lambda [`blocks`]
2. Symbols vs strings (identity, immutability, memory, hash keys) [`strings`]
3. Modules vs classes; mixins with `include` vs `extend` (and `prepend`); no multiple inheritance [`modules`]
4. Method lookup: object's class, prepended/included modules, superclasses, `method_missing`; `ancestors` [`modules`]
5. `nil` and truthiness: only `nil` and `false` are falsy; `nil?`, `&.`, `\|\|=` [`control`]
6. Instance variables vs class variables (`@@` shared down the hierarchy) vs class instance variables [`classes`]
7. `self` in instance methods, class methods and the class body; `def self.x` [`classes`]
8. Visibility: `public`, `protected`, `private` (and `send` bypassing it) [`classes`]
9. `each` vs `map`, `select`/`reject`/`reduce`/`each_with_object`, `inject` [`enumerable`]
10. Exceptions: `begin`/`rescue`/`else`/`ensure`, `retry`, custom error classes from `StandardError`, why not `rescue Exception`; `raise` vs `throw` [`exceptions`]
11. Hashes: symbol keys, `fetch` vs `[]`, default values and the `Hash.new([])` trap, iteration order [`hashes`]
12. Duck typing and `respond_to?` [`modules`]
13. Metaprogramming: `send`/`public_send`, `define_method`, `method_missing` with `respond_to_missing?`, monkey patching, refinements [`metaprogramming`]
14. `freeze`, `dup` vs `clone`, frozen string literals (`# frozen_string_literal: true`) [`equality`, `strings`]
15. Equality: `==`, `eql?`, `equal?`, and `hash` for Hash keys and `uniq` [`equality`]
16. Methods: implicit return, default and keyword arguments, `*args`/`**kwargs`, bang and predicate methods [`methods`]
17. `&&`/`\|\|` vs `and`/`or` precedence [`control`]
18. `Comparable` via `<=>`, `Enumerable` via `each` [`modules`]
19. Strings: mutability, `<<` vs `+=`, interpolation only in double quotes [`strings`]
20. Testing with RSpec or Minitest, TDD [`testing`]
21. `require` vs `load`, Bundler and gems [`tooling`]
22. Concurrency: threads and the GVL, thread safety, `Mutex`, `Queue`, Ractor, Fibers [`concurrency`]
23. Garbage collection, memory footprint, profiling and benchmarking, YJIT, memoization [`runtime`]
24. Pattern matching with `case`/`in` (Ruby Gold, newer codebases) [`pattern_matching`]
25. `Struct` and `Data` value objects [`classes`]

## 5. Proposed bank design (summary; details in the curriculum)

| Exam | Draws / bank | Pass | s/question | Topic mix |
|---|---|---|---|---|
| `junior`, Junior Ruby Developer | 12 / 22 | 70% | 30 | basics 3, strings 4, control 3, methods 4, arrays 3, hashes 3, blocks 2 |
| `mid`, Mid-level Ruby Developer | 14 / 24 | 70% | 40 | hashes 2, blocks 3, enumerable 4, classes 4, modules 4, equality 2, exceptions 3, testing 2 |
| `senior`, Senior Ruby Developer | 15 / 26 | 75% | 50 | blocks 2, modules 3, equality 2, exceptions 2, metaprogramming 5, pattern_matching 3, concurrency 4, runtime 3, tooling 2 |

## 6. Sources

Question collections and interview guides:
- Toptal, Ruby hiring guide and interview questions (classes vs modules, method lookup, mixins, `throw`/`catch` vs `raise`/`rescue`, `&&` vs `and`, visibility): https://www.toptal.com/developers/ruby
- Adaface, 61 Ruby interview questions (junior/intermediate/advanced/error handling): https://adaface.com/blog/ruby-interview-questions
- educative, 20 essential Ruby interview questions: https://www.educative.io/blog/ruby-interview-questions
- dev.to, Ruby interview questions part 1: https://dev.to/sonianand11/ruby-interview-questions-part-1-44dp
- dataford, Blocks, procs and lambdas in Ruby: https://dataford.io/questions/what-are-the-differences-between-blocks-procs-and-lambdas-in-ruby
- papersadda, Ruby interview questions 2026: https://papersadda.com/article/ruby-interview-questions-2026/
- Glassdoor, Ruby developer interview questions: https://static.glassdoor.com.mx/Interview/ruby-interview-questions-SRCH_KO0,4_IP28.htm
- Revelo, Ruby developer interview questions: https://www.revelo.com/interview-questions/ruby-developer
- GitHub, ruby-interview-questions collection: https://github.com/AstmDesign/ruby-interview-questions

Assessment vendors and certification:
- Adaface Ruby online test (40 min, 8 MCQ + 1 coding): https://adaface.com/assessment-test/ruby-online-test
- Adaface Ruby & Rails test: https://adaface.com/assessment-test/ruby-rails-test
- iMocha Ruby test (20 min, 10 questions): https://imocha.io/tests/ruby-test-assessment
- TestGorilla Ruby coding tests (entry, intermediate, debugging, data structures): https://www.testgorilla.com/coding-tests/ruby/
- TestGorilla Ruby entry-level algorithms: https://testgorilla.com/test-library/programming-skills-tests/ruby-coding-test-entry-level-algorithms
- Ruby Association Certified Ruby Programmer examination (Silver/Gold version 3 scope, Ruby 3.1): https://www.ruby.or.jp/en/certification/examination/

Company processes and job postings:
- GitLab Backend Engineer job family and hiring process (screening 30 min, technical interview 90 min, manager, director): https://handbook.gitlab.com/job-families/engineering/backend-engineer
- GitLab Associate Backend Engineer: https://handbook.gitlab.com/job-families/engineering/development/backend/associate/
- GitLab backend interview guide (Ruby quiz, pair programming, review): https://dataford.io/interview-guides/gitlab/backend-engineer
- Glassdoor, GitLab interview report: https://www.glassdoor.co.uk/Interview/GitLab-Interview-E1296544-RVW17179060.htm
- Shopify senior Ruby on Rails developer (requirements summary): https://jobs.weekday.works/shopify-senior-ruby-on-rails-developer
- Cookpad, Service Development Engineer (Ruby / Ruby on Rails): https://japan-dev.com/jobs/cookpad/cookpad-service-development-engineer-ruby--ruby-on-rails---recipe-business-a45rgw
- SmartHR product engineer selection report: https://gaishishukatsu.com/selection_reports/42330
- freee engineer selection report: https://gaishishukatsu.com/selection_reports/22395
- Recruit Direct Scout, Rails backend postings (Japan, "Rails 3+ years"): https://directscout.recruit.co.jp/job_descriptions/9814984 and https://directscout.recruit.co.jp/job_descriptions/8926581
- Indeed Japan, Ruby on Rails jobs: https://jp.indeed.com/q-ruby-on-rails-%e6%b1%82%e4%ba%ba.html?start=40

Official references:
- Ruby 3.4.0 release notes (`it`, chilled strings, `Hash#inspect`, error message format, Prism): https://www.ruby-lang.org/en/news/2024/12/25/ruby-3-4-0-released/
- Ruby 3.4 documentation: https://docs.ruby-lang.org/en/3.4/ and https://ruby-doc.org/3.4/
- Feature #20205, chilled string literals: https://bugs.ruby-lang.org/issues/20205
- Methods syntax: https://docs.ruby-lang.org/en/3.4/syntax/methods_rdoc.html
- Calling methods (keyword arguments, splats, blocks): https://docs.ruby-lang.org/en/3.4/syntax/calling_methods_rdoc.html
- Exceptions syntax: https://docs.ruby-lang.org/en/3.4/syntax/exceptions_rdoc.html
- Pattern matching: https://docs.ruby-lang.org/en/3.4/syntax/pattern_matching_rdoc.html
- Refinements: https://docs.ruby-lang.org/en/3.4/syntax/refinements_rdoc.html
- Ractor: https://docs.ruby-lang.org/en/3.4/ractor_md.html
- Core classes: Hash https://docs.ruby-lang.org/en/3.4/Hash.html, Proc https://docs.ruby-lang.org/en/3.4/Proc.html, Exception https://docs.ruby-lang.org/en/3.4/Exception.html, Data https://docs.ruby-lang.org/en/3.4/Data.html, Struct https://docs.ruby-lang.org/en/3.4/Struct.html, Comparable https://docs.ruby-lang.org/en/3.4/Comparable.html, Enumerable https://docs.ruby-lang.org/en/3.4/Enumerable.html, Object https://docs.ruby-lang.org/en/3.4/Object.html, Module https://docs.ruby-lang.org/en/3.4/Module.html, String https://docs.ruby-lang.org/en/3.4/String.html, Thread https://docs.ruby-lang.org/en/3.4/Thread.html, Mutex https://docs.ruby-lang.org/en/3.4/Thread/Mutex.html, GC https://docs.ruby-lang.org/en/3.4/GC.html
- Ruby Style Guide (community, RuboCop): https://rubystyle.guide/
