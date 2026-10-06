# Ruby on Rails hiring assessments: what companies test, by level

Research for the **Rails moon** (pack `rails`) of the Ruby planet in Bitwise Quest (entry exams and curriculum, see
[rails-curriculum.md](rails-curriculum.md)). Goal: simulate the technical screening a company runs when hiring Rails
developers (backend or full-stack) at junior, mid-level and senior level, in an arcade format.

Researched October 2026, against **Rails 8.x** (Rails Guides) and **Ruby 3.4.7** (the only runtime available to the game).
Sources: public question collections, assessment vendors' test descriptions, job postings and the official Rails Guides.
Interview processes vary: treat this as a synthesis, not a standard. Every plain-Ruby claim in this file and in the
curriculum was run on Compiler Explorer's Ruby 3.4.7 (`ruby347`) on 2026-10-06, see section 6.

## 1. How Rails screening usually works

| Stage | Typical format | Source evidence |
|---|---|---|
| Online skills test (vendor) | 10-30 min, scenario MCQ with code snapshots, often + 1 Ruby coding task | TestGorilla Ruby on Rails (10 min, intermediate: Active Record, Action Controller & Routing, Action View & helpers, advanced: mailers, workers); Adaface Ruby on Rails (30 min, 12 Rails MCQ + 1 Ruby coding question; sample question is N+1 eager loading); WeCreateProblems Rails assessment |
| Take-home or live "build a small app" | CRUD resource with validations, associations and tests (RSpec or Minitest), sometimes a JSON API | Job postings ask for TDD, RSpec/Minitest; GitLab and Shopify emphasise well-tested code |
| Technical interview, junior | MVC, convention over configuration, request lifecycle, routing/REST, migrations, validations, associations, strong parameters, ERB | hyring.com "Freshers" list (MVC, request flow, routing, generators, migrations, validations, associations, strong params, ERB, params, flash, REST) |
| Technical interview, mid | N+1 and `includes`, scopes, callbacks and their risks, `before_action`, transactions, caching, background jobs, CSRF, `find` vs `find_by` vs `where`, `pluck` vs `select`, counter caches, concerns | hyring.com "Intermediate"; techinterview.org Rails questions |
| Senior discussion | `preload` vs `eager_load` vs `includes`, indexing and query plans, locking, zero-downtime migrations, Rack middleware, Zeitwerk, STI vs polymorphic vs delegated types, connection pool, caching design (Russian doll), reliable/idempotent jobs, memory bloat, scaling, Hotwire | hyring.com "Experienced"; techinterview.org; GitLab senior backend expectations |
| Ruby fundamentals (often in the same loop) | Blocks/procs/lambdas, Enumerable, modules/mixins, metaprogramming (`method_missing`, `define_method`, `send`) | Adaface (metaprogramming, modules, mixins); covered by the Ruby planet |

Job-posting evidence:

- **GitLab** (largest public Rails monolith): every backend level requires "significant professional experience with Ruby
  on Rails"; seniors ship large features with minimal guidance. Handbook job families list associate/intermediate/senior/staff.
- **Shopify**: Rails + front-end basics, MVC, SOLID, DRY, REST, RSpec or Minitest, relational databases, background
  processing and scheduled jobs, CI.
- **37signals (Basecamp, HEY)**: junior and senior "Rails Programmer" roles; Rails, Turbo/Stimulus (Hotwire); Shape Up;
  no degree requirements, judged on what you can do.
- **Japanese Rails shops (SmartHR example)**: required: web framework experience (any), unit-test-driven development,
  RDB experience; welcome: Rails. Senior: 5+ years with frameworks, 1+ year with Rails 5+, RDB logical/physical design and
  **performance tuning**, design for changeability. (Cookpad, Money Forward and freee are also well-known Rails users in Japan; their
  postings were not checked in this research.)

## 2. Topics per level

| Area | Junior | Mid-level | Senior |
|---|---|---|---|
| MVC, convention over configuration, request lifecycle | Core | Assumed | Rack and middleware stack |
| Naming conventions (model ↔ table, foreign keys) | Core | Assumed | Inflections, custom table names |
| Active Record basics (`new` vs `create`, `save`, attributes) | Core | Assumed | Attribute API, dirty tracking |
| Finders: `find` / `find_by` / `where`, `first` / `take` | Core | Core | Dynamic finders are `method_missing` |
| Relations: lazy loading, chaining, scopes | Basic `where` | Core (scopes, lazy evaluation, `pluck` vs `select`, `count`/`size`/`length`) | Query objects, `to_sql`, `explain` |
| Migrations | Write and run | Reversible `change` vs `up`/`down`, never edit a run migration | Zero-downtime, dangerous migrations on big tables, strong_migrations |
| Associations | `has_many` / `belongs_to` | `has_many :through`, polymorphic, `dependent:` | STI vs polymorphic vs delegated types |
| N+1 and eager loading | Know the term | Core (`includes`, counting queries) | `preload` vs `eager_load` vs `includes`, `strict_loading`, Bullet |
| Indexes, counter caches | Not required | `counter_cache`, index foreign keys | Composite indexes (leftmost prefix), query plans, locking |
| Validations | Core | `save` vs `save!`, errors | Uniqueness needs a DB unique index (race) |
| Callbacks | Know `before_save` | Order, halting with `throw :abort`, risks | Prefer service objects; `after_commit` for side effects; skipping methods |
| Routing | `resources`, REST verbs | Nested resources, `only:`, path helpers | Route constraints, API versioning |
| Controllers, strong parameters | Core | `before_action`, `require`/`permit`, Rails 8 `params.expect` | Mass assignment attacks, `rescue_from` |
| Views | ERB `<%= %>` vs `<% %>`, partials | Layouts, helpers | Escaping, `html_safe`, fragment / Russian-doll caching |
| Background jobs | Know they exist | Active Job, `perform_later`, queues | Idempotency, retries, Solid Queue (Rails 8) vs Sidekiq |
| Caching | Not required | `Rails.cache.fetch`, fragment caching | Key-based expiration, `touch: true`, HTTP caching (ETag) |
| Security | Strong params | CSRF, SQL injection placeholders, XSS escaping | Session fixation, open redirects, CSP |
| Testing | Write a model test | Minitest/RSpec, fixtures/factories, request tests | Fast suites, what to test |
| Transactions and concurrency | Not required | `transaction` blocks | Optimistic vs pessimistic locking, connection pool |
| Architecture | Not required | Concerns | Service objects, Zeitwerk autoloading, Hotwire, Rails 8 defaults (Solid Queue/Cache/Cable, Propshaft, Kamal, auth generator) |

### What makes a candidate senior

- **Database judgment**: counts queries, recognises N+1, picks the right eager-loading strategy, designs indexes,
  knows which migrations lock big tables.
- **Callback and job discipline**: side effects in `after_commit`, idempotent jobs, no business logic hidden in long
  callback chains.
- **Security by default**: strong params / `expect`, placeholders in SQL, never `html_safe` on user input, CSRF.
- **Knowing the magic**: can explain that dynamic finders, associations and scopes are Ruby metaprogramming
  (`method_missing`, `define_method`, lazy relation objects). This is exactly what the moon teaches.

## 3. Question formats that fit the arcade

| Format in the sources | Bitwise Quest beat | Example |
|---|---|---|
| "What does this Rails call do?" | `pick` / `type`, `[Doc]` (no check) | `Post.find(99)` → raises `ActiveRecord::RecordNotFound` |
| "How many queries?" | `predict` on a plain-Ruby FakeDB that counts queries | 3 posts, lazy author per post → `4`; with `includes` → `2` |
| "How does Rails do X under the hood?" | `predict` on a mini-implementation | `find_by_title` via `method_missing` |
| Spot the bug (code review) | `run`: broken plain-Ruby starter → fix → stdout substring | Route `/posts/:id` declared before `/posts/new` |
| Security review | `predict` the generated SQL string | Interpolated vs `?` placeholder |
| Fill in the token | `type` | `throw :abort`, `includes`, `permit`, `expect` |
| Order the steps | `order` | Callback order on create |

## 4. Ranked list: most frequently asked items

Synthesis of frequency across the sources in section 7 (question collections weighted with vendor test outlines and
postings).

| Rank | Item | Level | Verifiable in plain Ruby? |
|---|---|---|---|
| 1 | N+1 queries and eager loading (`includes`) | mid-senior | **Yes**: FakeDB counts queries |
| 2 | MVC, convention over configuration, request lifecycle | junior | Partly (naming convention mini, router → controller pipeline) |
| 3 | Associations (`has_many`, `belongs_to`, `:through`, polymorphic) | junior-mid | Partly (`define_method` associations; options are `[Doc]`) |
| 4 | Strong parameters / mass assignment | junior-mid | **Yes**: `require`/`permit` as hash filtering |
| 5 | Validations (`valid?`, errors, `save` vs `save!`) | junior | **Yes** |
| 6 | Callbacks: order, halting, risks | mid | **Yes** (`catch`/`throw :abort` chain); order list is `[Doc]` |
| 7 | `find` vs `find_by` vs `where` | junior-mid | **Yes** (mini finders); exact AR exception class is `[Doc]` |
| 8 | Migrations, reversibility, `schema.rb` | junior-mid | Partly (migrations as data, inverse table) |
| 9 | Routing and REST, `resources` | junior | **Yes** (pattern matcher) for matching; helpers are `[Doc]` |
| 10 | `before_action` filters | mid | **Yes** (halting filter chain) |
| 11 | Scopes, lazy relations, chaining | mid | **Yes** (relation object with `@records ||=`) |
| 12 | `includes` vs `joins`; `preload` vs `eager_load` | mid-senior | Conceptual `[Doc]` (query strategy) + counting mini |
| 13 | Caching (`Rails.cache.fetch`, fragment, Russian doll) | mid-senior | **Yes** for `fetch` and key-based expiry |
| 14 | Background jobs (Active Job, Sidekiq/Solid Queue, idempotency) | mid-senior | Partly (queue mini, idempotency mini) |
| 15 | CSRF protection | mid | Partly (token check mini); Rails behaviour `[Doc]` |
| 16 | SQL injection | mid | **Yes**: interpolation vs placeholder with a fake quoter |
| 17 | XSS and ERB escaping | mid | **Yes** with stdlib `erb` + `ERB::Util.h`; Rails auto-escaping is `[Doc]` |
| 18 | Database indexes (composite, leftmost prefix) | mid-senior | Conceptual |
| 19 | Counter caches | mid | Partly (mini) |
| 20 | Concerns / modules | mid | **Yes** (`included` hook, `extend`) |
| 21 | Transactions; optimistic vs pessimistic locking | senior | Partly (snapshot rollback, `lock_version` mini) |
| 22 | Testing (Minitest/RSpec, fixtures, factories) | mid | **Yes** for Minitest assertions (bundled gem present on the runner); RSpec not available |
| 23 | `pluck` vs `select`, `count` / `size` / `length` | mid | Conceptual |
| 24 | Rack and middleware | senior | **Yes** (lambda app + middleware class) |
| 25 | STI vs polymorphic vs delegated types | senior | Partly (`type` column → `const_get`) |
| 26 | Zero-downtime / dangerous migrations | senior | Conceptual |
| 27 | Zeitwerk autoloading, Hotwire/Turbo, Rails 8 defaults | senior | Conceptual |

## 5. Verifiable vs conceptual: the design constraint

No sandbox available to the game has Rails, Active Record, Active Support or a database. Exercises run on plain
**Ruby 3.4.7** (Compiler Explorer, stdlib + bundled gems, stdout captured). So:

- **Verified (`[R]`)**: the player builds or reads small plain-Ruby versions of Rails mechanisms ("Rails under the hood"):
  an Active Record-lite model over an in-memory table, a lazy chainable relation, `find_by_*` via `method_missing`,
  associations via `define_method`, a FakeDB that **counts queries** (N+1 vs preload visible as numbers), validations
  with an errors hash, a `before_save` chain halted with `throw :abort`, `require`/`permit` hash filtering, a router,
  a `before_action` chain, ERB views (stdlib `erb` works), concerns as modules, migrations as data, a job queue, a cache
  with `fetch`, a SQL quoter showing injection, a Rack middleware, Minitest assertions.
- **Conceptual (`[Doc]`)**: exact Rails API behaviour (class names such as `ActiveRecord::RecordNotFound`, callback order,
  `includes` strategy, `params.expect`, Solid Queue defaults, CSRF in Rails). These are `pick`/`type` questions with
  **no check**, each anchored to a Rails Guides page.
- Mini-implementations deliberately mirror Rails names and messages where helpful (`Couldn't find Post with 'id'=9`,
  `param is missing or the value is empty or invalid: post`, `Validation failed: Title can't be blank`) but authors
  must say "our mini version" in prose; never claim the mini output is what Rails prints byte for byte.

Rough split for the moon: ~60% of lesson questions verified, ~40% `[Doc]`. Exams lean more conceptual (~55% `[Doc]`)
because real screenings ask API knowledge.

## 6. Runner facts that affect content (checked on `ruby347`, 2026-10-06)

- `RUBY_VERSION` is `3.4.7`. `require "erb"`, `"json"`, `"set"`, `"time"`, `"securerandom"`, `"forwardable"` work.
  `require "minitest/autorun"` and `require "test/unit"` work (bundled gems). RSpec is not available.
- Exceptions go to stderr in the 3.4 format with quoted, qualified frames:
  `/app/output.s:11:in 'Hash#fetch': key not found: :k (KeyError)` (the raw file name is `/app/output.s`; the game's
  runner may rewrite it to `main.rb`). Line numbers shift when a hidden helper is prepended, so checks should match the
  message part (`key not found: :k (KeyError)`), not the line.
- 3.4 `Hash#inspect` uses the new style: `{title: ["can't be blank"]}`, `{"title" => "Hi"}`, `{1 => "Ada"}`.
- 3.4 `NoMethodError` wording: `undefined method 'title=' for an instance of Post`, `undefined method 'fly' for class Post`,
  `undefined method '<<' for nil`.
- `it` (implicit block parameter) and endless methods (`def x = ...`) are available and keep snippets short.
- Minitest output contains a random seed and timings: check only the summary substring
  (`1 runs, 1 assertions, 0 failures, 0 errors, 0 skips`).
- Subprocesses work (`IO.popen` of `RbConfig.ruby`), which made batch verification possible; content should not rely on it.
- When stdout is a pipe, stdout is buffered and stderr is not: an uncaught error can appear before earlier `puts` output
  in a merged stream. The game captures stdout separately, so `expect` substrings are unaffected.

## 7. Sources

Question collections and vendors:

- techinterview.org, Ruby on Rails interview questions: https://www.techinterview.org/post/3233460911/ruby-on-rails-interview-questions/
- hyring.com, Top 60 Ruby on Rails interview questions (freshers / intermediate / experienced): https://hyring.com/jobseeker-toolkit/interview-questions/technical/ruby-on-rails
- Second Talent, Rails developer interview guide: https://www.secondtalent.com/interview-guide/ruby-on-rails-developer/
- TestGorilla, Ruby on Rails test: https://www.testgorilla.com/test-library/programming-skills-tests/ruby-on-rails-test/
- Adaface, Ruby on Rails online test: https://adaface.com/assessment-test/ruby-on-rails-online-test
- WeCreateProblems, Rails assessment test: https://www.wecreateproblems.com/tests/ruby-on-rails-assessment-test
- OneUptime, How to handle N+1 queries in Rails: https://oneuptime.com/blog/post/2025-07-02-rails-n-plus-one-queries/

Job postings:

- GitLab handbook, Backend Engineer job family: https://handbook.gitlab.com/job-families/engineering/backend-engineer
- GitLab handbook, Senior Backend Engineer: https://handbook.gitlab.com/job-families/engineering/development/backend/senior/
- 37signals, Senior / Junior Rails Programmer: https://jobs.rubyonrails.org/jobs/2119-senior-rails-programmer-37signals , https://jobs.rubyonrails.org/jobs/2120-junior-rails-programmer-37signals
- Shopify senior Rails developer (aggregated posting): https://jobs.weekday.works/shopify-senior-ruby-on-rails-developer
- SmartHR backend (Rails) postings (Japanese): https://en-ambi.com/job/j-11340113/ , https://sincereed-agent.com/offer/smarthr-16/

Official documentation (Rails 8):

- Rails 8 release announcement (Solid Queue/Cache/Cable, Propshaft, Kamal 2, Thruster, authentication generator, `params.expect`): https://rubyonrails.org/2024/11/7/rails-8-no-paas-required
- Active Record Basics: https://guides.rubyonrails.org/active_record_basics.html
- Active Record Migrations: https://guides.rubyonrails.org/active_record_migrations.html
- Active Record Validations: https://guides.rubyonrails.org/active_record_validations.html
- Active Record Callbacks: https://guides.rubyonrails.org/active_record_callbacks.html
- Active Record Associations: https://guides.rubyonrails.org/association_basics.html
- Active Record Query Interface: https://guides.rubyonrails.org/active_record_querying.html
- Action Controller Overview: https://guides.rubyonrails.org/action_controller_overview.html
- Routing from the Outside In: https://guides.rubyonrails.org/routing.html
- Action View Overview: https://guides.rubyonrails.org/action_view_overview.html
- Active Job Basics: https://guides.rubyonrails.org/active_job_basics.html
- Caching with Rails: https://guides.rubyonrails.org/caching_with_rails.html
- Securing Rails Applications: https://guides.rubyonrails.org/security.html
- Testing Rails Applications: https://guides.rubyonrails.org/testing.html
- Rails on Rack: https://guides.rubyonrails.org/rails_on_rack.html
- Autoloading and Reloading (Zeitwerk): https://guides.rubyonrails.org/autoloading_and_reloading_constants.html
- `ActionController::ParameterMissing` / `ExpectedParameterMissing` API: https://edgeapi.rubyonrails.org/classes/ActionController/ExpectedParameterMissing.html
- `ActiveRecord::Relation#size` API: https://api.rubyonrails.org/classes/ActiveRecord/Relation.html
- Bullet gem: https://github.com/flyerhzm/bullet
