# Rails moon: proposed curriculum ("Rails under the hood")

Curriculum for the **Ruby on Rails moon** (pack `rails`, `parent: "ruby"`), 3 regions, plus the entry exams. It
follows what companies actually assess (see [rails-hiring-assessments.md](rails-hiring-assessments.md)). Content
authors turn this into a language pack following [../content-model.md](../content-model.md),
[../authoring-lessons.md](../authoring-lessons.md) and [../exams.md](../exams.md).

The moon assumes the Ruby planet: blocks, procs/lambdas, `Enumerable`, classes, modules/mixins, `method_missing`,
`define_method`, `send`, exceptions, `catch`/`throw` is introduced here.

## Conventions used in this file

### The design constraint

No runner available to the game has Rails, Active Record, Active Support or a database. Snippets run on plain
**Ruby 3.4.7** (Compiler Explorer `ruby347`, stdout captured). So the moon teaches Rails two ways:

1. **Under the hood (verified)**: the player reads or fixes tiny plain-Ruby versions of Rails mechanisms (a model over
   an in-memory table, a lazy relation, `find_by_*` via `method_missing`, associations via `define_method`, a FakeDB
   that counts queries, validations, a callback chain, `require`/`permit`, a router, a filter chain, ERB views, a job
   queue, a cache, a SQL quoter). The names and messages mirror Rails where useful, but prose must say "our mini
   version", never "Rails prints".
2. **The real API (conceptual)**: `pick` / `type` questions about Rails behaviour with no `check`, each anchored to a
   Rails Guides page.

### Verification tags

| Tag | Meaning | How it was checked |
|---|---|---|
| `[R]` | Plain-Ruby runtime output | Run on Compiler Explorer `ruby347` (Ruby 3.4.7) on 2026-10-06; stdout compared exactly. Lines shown separated by ` / `. Errors show only the message part (line numbers depend on the hidden helper) |
| `[R+H]` | Same, with the shared helper `MiniRecord` (or `MiniController`) prepended | Same |
| `[Doc]` | Rails API behaviour; no check | Anchored to the Rails Guides page cited |

All `[R]` answers below were verified; authors should still wire each into `check` so `content:verify` keeps them honest.

### Runner facts (Ruby 3.4.7)

- `require "erb"` works (and `json`, `set`, `securerandom`, `forwardable`; `minitest/autorun` too, as a bundled gem).
- Uncaught errors: `/app/output.s:5:in 'Post.find': Couldn't find Post with 'id'=9 (RecordNotFound)` (file name may be
  rewritten to `main.rb` by the game runner). Check the message part only.
- 3.4 inspect style: `{id: 2, title: "Yo"}`, `{"title" => "Hi"}`. 3.4 `NoMethodError`:
  `undefined method 'title=' for an instance of Post`.
- `it` and endless methods (`def x = ...`) keep snippets short; use them.
- Plain ERB does **not** escape `<%= %>`; Rails' ERB does. Lessons use `ERB::Util.h` explicitly and teach the Rails
  default as `[Doc]`.

### Question kinds

`pick` (2-4 options), `predict` (output or Yes/No), `type` (exact token), `order`, `run` (broken starter → fix →
expected stdout substring). Every `run` `expect` below does not appear in the starter's output (verified). Code at
most ~12 visible lines; longer setup goes into the shared helper.

### Visual vocabulary (existing stage effects)

| Rails idea | On stage |
|---|---|
| Model class | An archivist actor with a `tag` (`Post`) |
| Table | A `scroll` (rows); a row = a `gem`; a record object = a `value` chip on the actor |
| Query | The archivist walks to the archive (`enter`/`exit`) and `print`s the SQL line; a `banner` keeps the score `QUERIES: n` |
| Lazy relation | A sealed `scroll`: building it does nothing (`say` "not yet"); `each`/`to_a` opens it (`print` QUERY) |
| `RecordNotFound`, `ParameterMissing`, `NoMethodError` | `shake` + `error` with the real message |
| `method_missing` finder | The archivist hears an unknown spell, `say`s "find_by_title?" and improvises |
| Association | belongs_to = a `key` labelled `author_id`; has_many = a `scroll` of children |
| N+1 | Enemy swarm: each lazy load is an `attack` that lowers `hp` by one query; `includes` = one big `scroll` fetched once (`banner` "2 QUERIES") |
| Validation | A gate guard with a `shield`: invalid records bounce (`shake`), errors appear as `say` bubbles |
| Callback chain | Ritual steps before the vault; `throw :abort` = `drop` the record + `banner` "HALTED" |
| Request | A messenger enters the castle (`enter`) carrying a `scroll` "GET /posts/1" |
| Router | Gatekeeper pointing the messenger to a door (`say` "posts#show") |
| Strong params | `shield` that lets only permitted `item`s through; the rest `drop` |
| `before_action` | A guard who can turn the messenger back (`banner` "302 /login") |
| View | A scribe who `print`s HTML |
| Job queue | A raven: `give` the message to the raven, `wait`, it flies (`print`) |
| Cache | A treasure chest: first `fetch` computes (`say` "computing"), later ones open the chest |

### Shared helper code

Two hidden helpers are prepended to the verification programs of `[R+H]` questions (and may be shown in a "codex"
side panel). Both verified on Ruby 3.4.7.

**`MiniRecord`** (regions 1-2): an in-memory DB that counts queries, a lazy chainable `Relation`, and a `Model` base
with attributes, finders, `method_missing` dynamic finders, `has_many`/`belongs_to`, `includes` preloading,
presence validations and a `before_save` chain halted by `throw :abort`.

```ruby
class RecordNotFound < StandardError; end
class RecordInvalid < StandardError; end

module DB
  @tables = Hash.new { |h, k| h[k] = [] }
  @queries = 0
  class << self
    attr_reader :tables
    attr_accessor :queries
    def select(table)
      @queries += 1
      @tables[table].select { |row| yield row }.map(&:dup)
    end
    def insert(table, row)
      @queries += 1
      row[:id] = @tables[table].size + 1
      @tables[table] << row.dup
      row[:id]
    end
    def update(table, row)
      @queries += 1
      i = @tables[table].index { |r| r[:id] == row[:id] }
      @tables[table][i] = row.dup
    end
  end
end

class Relation
  include Enumerable
  def initialize(model, conds = {}, order = nil, limit = nil, incl = [])
    @model, @conds, @order, @limit, @incl = model, conds, order, limit, incl
  end
  def where(c) = Relation.new(@model, @conds.merge(c), @order, @limit, @incl)
  def order(k) = Relation.new(@model, @conds, k, @limit, @incl)
  def limit(n) = Relation.new(@model, @conds, @order, n, @incl)
  def includes(a) = Relation.new(@model, @conds, @order, @limit, @incl + [a])
  def loaded? = !@records.nil?
  def to_a
    @records ||= begin
      rows = DB.select(@model.table) { |r| @conds.all? { |k, v| v.is_a?(Array) ? v.include?(r[k]) : r[k] == v } }
      rows = rows.sort_by { |r| r[@order] } if @order
      rows = rows.first(@limit) if @limit
      recs = rows.map { |r| @model.new(r) }
      @incl.each { |a| @model.preload(recs, a) }
      recs
    end
  end
  def each(&) = to_a.each(&)
  def to_sql
    sql = "SELECT * FROM #{@model.table}"
    sql += " WHERE " + @conds.map { |k, v| "#{k} = #{v.inspect}" }.join(" AND ") unless @conds.empty?
    sql += " ORDER BY #{@order}" if @order
    sql += " LIMIT #{@limit}" if @limit
    sql
  end
end

class Model
  def self.table = name.downcase + "s"
  def self.attribute(*names)
    names.each do |n|
      define_method(n) { @attrs[n] }
      define_method("#{n}=") { |v| @attrs[n] = v }
    end
  end
  def self.all = Relation.new(self)
  def self.where(c) = all.where(c)
  def self.order(k) = all.order(k)
  def self.includes(a) = all.includes(a)
  def self.find_by(c) = where(c).first
  def self.find(id)
    find_by(id: id) or raise RecordNotFound, "Couldn't find #{name} with 'id'=#{id}"
  end
  def self.method_missing(m, *args)
    return super unless m.start_with?("find_by_")
    find_by(m.to_s.delete_prefix("find_by_").to_sym => args.first)
  end
  def self.respond_to_missing?(m, priv = false) = m.start_with?("find_by_") || super
  def self.create(attrs) = new(attrs).tap(&:save)

  def self.validations = (@validations ||= [])
  def self.validates_presence_of(*fields) = fields.each { |f| validations << f }
  def self.before_save_chain = (@before_save ||= [])
  def self.before_save(m) = before_save_chain << m

  def self.has_many(name)
    fk = :"#{self.name.downcase}_id"
    klass = name.to_s.chomp("s").capitalize
    define_method(name) { Object.const_get(klass).where(fk => id) }
  end
  def self.belongs_to(name)
    define_method(name) do
      @cache.fetch(name) { @cache[name] = Object.const_get(name.to_s.capitalize).find(@attrs[:"#{name}_id"]) }
    end
  end
  def self.preload(records, name)
    ids = records.map { |r| r.read(:"#{name}_id") }.uniq
    found = Object.const_get(name.to_s.capitalize).where(id: ids).to_a
    records.each { |r| r.cache[name] = found.find { |o| o.id == r.read(:"#{name}_id") } }
  end

  attr_reader :errors, :cache
  def initialize(attrs = {})
    @attrs = attrs.dup
    @errors = Hash.new { |h, k| h[k] = [] }
    @cache = {}
  end
  def id = @attrs[:id]
  def read(k) = @attrs[k]
  def persisted? = !id.nil?
  def valid?
    errors.clear
    self.class.validations.each do |f|
      v = @attrs[f]
      errors[f] << "can't be blank" if v.nil? || v.to_s.strip.empty?
    end
    errors.empty?
  end
  def save
    return false unless valid?
    halted = catch(:abort) do
      self.class.before_save_chain.each { |m| send(m) }
      false
    end != false
    return false if halted
    persisted? ? DB.update(self.class.table, @attrs) : @attrs[:id] = DB.insert(self.class.table, @attrs)
    true
  end
  def save!
    save or raise RecordInvalid, "Validation failed: " + errors.map { |f, ms| ms.map { |m| "#{f.capitalize} #{m}" } }.flatten.join(", ")
  end
  def inspect = "#<#{self.class.name} #{@attrs.map { |k, v| "#{k}: #{v.inspect}" }.join(", ")}>"
end
```

Notes for authors: `DB.queries` is a public counter (`DB.queries = 0` before the part you measure). Each `create`
costs 1 query (insert). The `@cache` in `belongs_to` makes a second read of the same association free, like Rails'
association cache. `errors` is a `Hash` with a default block, so reading an unknown key adds it (not like
`ActiveModel::Errors`); questions avoid that.

**`MiniController`** (region 3): a base controller with a halting `before_action` chain.

```ruby
class Controller
  def self.filters = (@filters ||= [])
  def self.before_action(m, only: nil) = filters << [m, only]
  def initialize(user = nil) = @user = user
  def process(action)
    self.class.filters.each do |m, only|
      next if only && !only.include?(action)
      send(m)
      return @response if @response
    end
    send(action)
    @response
  end
  def redirect_to(path) = @response = "302 #{path}"
  def render(text) = @response = "200 #{text}"
end
```

---

| # | Region slug | Theme | Big idea | Lessons |
|---|---|---|---|---|
| 1 | `record-village` | village | Active Record under the hood: models, finders, lazy relations, migrations | 4 + boss |
| 2 | `association-forest` | forest | Associations, N+1, validations, callbacks and concerns | 4 + boss |
| 3 | `controller-castle` | castle | The request: routing, strong params, filters and views, jobs, cache and security | 4 + boss |

Exam-only topics (no region yet): `testing`, `database` (indexes, transactions, locking), `architecture` (Rack,
service objects, Zeitwerk, STI/polymorphic, Hotwire, Rails 8 defaults).

---

## Region 1: `record-village`, Active Record under the hood

Guide line idea: "Every Rails model is just a Ruby class that learned a few tricks. Let's learn the tricks."

### 1.1 `models-and-tables`, "Rows become objects"

- **Concept**: MVC in one sentence each; convention over configuration: class `Post` ↔ table `posts`, column ↔
  attribute; attribute readers/writers are generated with `define_method`; `new` (in memory) vs `save`/`create`
  (database), `persisted?`, `id` assigned by the database.
- **Visual**: the archivist `Post` reads a row `gem` from the `scroll` and turns it into a `value` chip; `banner`
  "POST ↔ posts".
- **Questions**:
  1. predict: [R]
     ```ruby
     class Model
       def self.table = name.downcase + "s"
     end
     class Post < Model; end
     puts Post.table
     ```
     → `posts`
  2. pick "Rails table name for model `Person`": `people` / `persons` / `person` → `people` (the inflector knows
     irregular plurals; our mini `+ "s"` would say `persons`) [Doc: Active Record Basics, naming conventions]
  3. pick "Table for model `BookClub`": `book_clubs` / `bookclubs` / `BookClubs` → `book_clubs` [Doc: AR Basics]
  4. predict: [R]
     ```ruby
     class Post
       [:title, :body].each do |col|
         define_method(col) { @attrs[col] }
       end
       def initialize(attrs) = @attrs = attrs
     end
     post = Post.new(title: "Hi")
     p post.title
     p post.body
     ```
     → `"Hi"` / `nil`
  5. predict: same class, `p post.respond_to?(:title)` → `true` (`define_method` creates real methods) [R]
  6. predict: [R]
     ```ruby
     class Post
       attr_reader :id
       def save = @id = 1
       def persisted? = !@id.nil?
     end
     post = Post.new
     puts post.persisted?
     post.save
     puts post.persisted?
     ```
     → `false` / `true`
  7. pick "Which one writes to the database?": `Post.new(title: "x")` / `Post.create(title: "x")` → `create`
     (`new` + `save`) [Doc: AR Basics, CRUD]
  8. type "Default primary key column": `___` → `id` [Doc: AR Basics]
  9. predict: with `attribute` defining `n` and `"#{n}="`, `p Post.instance_methods(false)` after `attribute :title` →
     `[:title, :title=]` [R]
  10. pick "In MVC, which part talks to the database?": model / view / controller → model [Doc: Getting Started]
- **Run**: starter [R]
  ```ruby
  class Model
    def self.attribute(*names)
      names.each do |n|
        define_method(n) { @attrs[n] }
        define_method(n) { |v| @attrs[n] = v }
      end
    end
    def initialize = @attrs = {}
  end
  class Post < Model
    attribute :title
  end
  post = Post.new
  post.title = "Hello"
  puts post.title
  ```
  → `undefined method 'title=' for an instance of Post (NoMethodError)`. Solution: `define_method("#{n}=") { |v| ... }`.
  `expect`: `Hello`.

### 1.2 `finders`, "Find or fall"

- **Concept**: `find(id)` raises when missing (Rails: `ActiveRecord::RecordNotFound`, a 404 in production);
  `find_by(...)` returns `nil`; `where` always returns a collection (maybe empty). Dynamic finders `find_by_title` are
  `method_missing`; a well-behaved `method_missing` also defines `respond_to_missing?`.
- **Visual**: the archivist searches the scroll; `find` with no match → `shake` + error; `find_by` → shrugs (`say`
  "nil"). Unknown spell `find_by_title` → `say` "I'll improvise".
- **Questions**:
  1. predict: [R]
     ```ruby
     class RecordNotFound < StandardError; end
     class Post
       ROWS = [{id: 1, title: "Hi"}, {id: 2, title: "Yo"}]
       def self.find_by(cond) = ROWS.find { |r| cond.all? { |k, v| r[k] == v } }
       def self.find(id) = find_by(id: id) || raise(RecordNotFound, "Couldn't find Post with 'id'=#{id}")
     end
     p Post.find_by(id: 9)
     p Post.find(2)
     ```
     → `nil` / `{id: 2, title: "Yo"}`
  2. predict: same, `Post.find(9)` → error `Couldn't find Post with 'id'=9 (RecordNotFound)` [R]
  3. pick "In Rails, `Post.find(9)` with no such row…": raises `ActiveRecord::RecordNotFound` / returns `nil` →
     raises [Doc: Querying, `find`]
  4. predict: `ROWS = [{id: 1, title: "Hi"}]` `p ROWS.select { |r| r[:title] == "Nope" }` `p ROWS.find { |r| r[:title] == "Nope" }`
     → `[]` / `nil` (`where` is like `select`, `find_by` is like `find`) [R]
  5. predict: [R]
     ```ruby
     class Post
       ROWS = [{id: 1, title: "Hi"}]
       def self.method_missing(name, *args)
         if name.start_with?("find_by_")
           col = name.to_s.delete_prefix("find_by_").to_sym
           ROWS.find { |r| r[col] == args[0] }
         else
           super
         end
       end
     end
     p Post.find_by_title("Hi")
     p Post.respond_to?(:find_by_title)
     ```
     → `{id: 1, title: "Hi"}` / `false`
  6. predict: same class, `Post.fly` → `undefined method 'fly' for class Post (NoMethodError)` (`super` keeps the normal
     error) [R]
  7. type: `def self.___(name, include_private = false) = name.start_with?("find_by_") || super` (makes
     `respond_to?` honest) → `respond_to_missing?`; with it, `Post.respond_to?(:find_by_title)` → `true` and
     `Post.method(:find_by_title)` works [R]
  8. pick "`Post.where(id: 1)` returns…": a relation (collection) / one `Post` → a relation; use `find_by` or `.first`
     for one record [Doc: Querying, conditions]
  9. pick "`first` vs `take`": `first` orders by primary key, `take` doesn't order / they're identical → the first
     [Doc: Querying, retrieving a single object]
  10. pick "Safer when the record may not exist": `find_by` / `find` → `find_by` (then handle `nil`) [Doc]
- **Run**: starter [R]
  ```ruby
  class RecordNotFound < StandardError; end
  class Post
    ROWS = [{id: 1, title: "Hi"}]
    def self.find_by(cond) = ROWS.find { |r| cond.all? { |k, v| r[k] == v } }
    def self.find(id) = find_by(id: id)
  end
  begin
    Post.find(7)
    puts "found?"
  rescue RecordNotFound => e
    puts "404: #{e.message}"
  end
  ```
  prints `found?`. Solution: `find_by(id: id) || raise(RecordNotFound, "Couldn't find Post with 'id'=#{id}")`.
  `expect`: `404: Couldn't find Post with 'id'=7`.

### 1.3 `lazy-relations`, "The sealed scroll"

- **Concept**: `where`/`order`/`limit` return a **new** relation object (chainable, never mutating the original);
  nothing runs until the records are needed (`each`, `to_a`, `first`, `map`...); the result is memoized
  (`@records ||=`); a relation that `include`s `Enumerable` and defines `each` gets `map`/`select`/`count`. Scopes are
  class methods returning relations; a `scope` always returns a relation even when its body returns `nil`, a class
  method returns `nil`.
- **Visual**: each `where` adds a wax seal to the scroll (`say` "not yet"); `to_a` breaks the seals and `print`s
  `QUERY`; `banner` `QUERIES: 1` stays at 1 on the second read.
- **Questions**:
  1. predict: [R]
     ```ruby
     class Relation
       def initialize(rows, conds = {}) = (@rows, @conds = rows, conds)
       def where(c) = Relation.new(@rows, @conds.merge(c))
       def to_a
         puts "QUERY #{@conds}"
         @rows.select { |r| @conds.all? { |k, v| r[k] == v } }
       end
     end
     rows = [{id: 1, pub: true}, {id: 2, pub: false}]
     rel = Relation.new(rows).where(pub: true)
     puts "built"
     p rel.to_a.size
     ```
     → `built` / `QUERY {pub: true}` / `1`
  2. predict: same class, `base = Relation.new(rows)` `p base.equal?(base.where(pub: true))` → `false` [R]
  3. predict: memoized relation [R]
     ```ruby
     class Relation
       def initialize(rows) = @rows = rows
       def to_a
         @records ||= begin
           puts "QUERY"
           @rows.dup
         end
       end
     end
     rel = Relation.new([1, 2])
     rel.to_a
     rel.to_a
     p rel.to_a.size
     ```
     → `QUERY` / `2` (one query)
  4. predict: [R]
     ```ruby
     class Relation
       include Enumerable
       def initialize(rows) = @rows = rows
       def each(&) = @rows.each(&)
     end
     rel = Relation.new([{id: 1}, {id: 2}])
     p rel.map { it[:id] }
     p rel.count
     ```
     → `[1, 2]` / `2`
  5. predict (helper): `class Post < Model; attribute :title, :pub; end` `puts Post.where(pub: true).order(:id).limit(2).to_sql`
     → `SELECT * FROM posts WHERE pub = true ORDER BY id LIMIT 2` [R+H]
  6. predict (helper): `DB.queries = 0; r = Post.where(pub: true); puts DB.queries; r.to_a; r.to_a; puts DB.queries`
     → `0` / `1` [R+H]
  7. pick "When does `posts = Post.where(published: true)` run SQL?": when records are needed (iteration, `to_a`,
     `first`; the console `inspect`s it) / on that line → when needed [Doc: Querying, "lazy"]
  8. type: `scope :recent, ___ { order(created_at: :desc) }` → `->` [Doc: Querying, scopes]
  9. predict: class method that may return nil [R]
     ```ruby
     class Post
       def self.by_author(id) = (where(id) if id)
       def self.where(id) = "WHERE author_id = #{id}"
     end
     p Post.by_author(nil)
     p Post.by_author(3)
     ```
     → `nil` / `"WHERE author_id = 3"`; pick follow-up "A Rails `scope` whose body returns nil returns…": a relation
     (all records) / `nil` → a relation [Doc: Querying, scopes]
  10. pick "`pluck(:title)` vs `select(:title)`": pluck returns an array of values, select returns model objects with
      only that column / identical → the first [Doc: Querying, `pluck`]
  11. pick "On an unloaded relation, which one always runs `SELECT COUNT(*)`?": `count` / `length` → `count`
      (`length` loads every record; `size` counts with SQL unless already loaded) [Doc: API `ActiveRecord::Relation#size`]
- **Run**: starter [R]
  ```ruby
  class Relation
    def initialize(rows, conds = {}) = (@rows, @conds = rows, conds)
    def where(c)
      @conds.merge!(c)
      self
    end
    def to_a = @rows.select { |r| @conds.all? { |k, v| r[k] == v } }
  end
  rows = [{id: 1, pub: true, top: true}, {id: 2, pub: true, top: false}]
  published = Relation.new(rows).where(pub: true)
  top = published.where(top: true)
  puts "published=#{published.to_a.size} top=#{top.to_a.size}"
  ```
  prints `published=1 top=1` (chaining polluted the base relation). Solution:
  `def where(c) = Relation.new(@rows, @conds.merge(c))`. `expect`: `published=2 top=1`.

### 1.4 `migrations`, "Blueprints of the archive"

- **Concept**: a migration is a timestamped, versioned change to the schema; they run in version order and the
  database remembers which ran (`schema_migrations`); `db/schema.rb` is generated, not hand-edited; `change` is
  reversible when Rails knows the inverse of each command (`add_column` ↔ `remove_column`), otherwise `up`/`down` or
  `reversible`; never edit a migration that already ran in production, write a new one; index foreign keys.
- **Visual**: blueprints (`scroll`s) stamped with dates; the builder applies them in date order; rollback =
  `banner` "UNDO" and the inverse command `print`ed.
- **Questions**:
  1. predict: [R]
     ```ruby
     MIGRATIONS = {
       20250102 => ->(s) { s[:posts] << :body },
       20250101 => ->(s) { s[:posts] = [:id, :title] },
     }
     schema = {}
     ran = []
     MIGRATIONS.sort.each do |version, change|
       change.(schema)
       ran << version
     end
     p schema
     p ran
     ```
     → `{posts: [:id, :title, :body]}` / `[20250101, 20250102]`
  2. predict: same hash, `p MIGRATIONS.keys.reject { |v| [20250101].include?(v) }` (pending migrations) → `[20250102]` [R]
  3. predict: [R]
     ```ruby
     INVERSE = {add_column: :remove_column, create_table: :drop_table}
     ops = [[:create_table, :tags], [:add_column, :posts, :body]]
     p ops.reverse.map { |op, *args| [INVERSE.fetch(op), *args] }
     ```
     → `[[:remove_column, :posts, :body], [:drop_table, :tags]]` (undo in reverse order)
  4. predict: same, `INVERSE.fetch(:execute)` → `key not found: :execute (KeyError)` (raw SQL has no known inverse:
     Rails raises `ActiveRecord::IrreversibleMigration`) [R][Doc: Migrations, `reversible`]
  5. pick "Table where Rails records which migrations ran": `schema_migrations` / `migrations` / `ar_internal_metadata`
     → `schema_migrations` [Doc: Migrations, running migrations]
  6. pick "Undo the last migration": `bin/rails db:rollback` / `bin/rails db:drop` → `db:rollback` [Doc: Migrations]
  7. pick "A migration that already ran in production has a bug": write a new migration / edit the old file → new
     migration [Doc: Migrations, "Changing existing migrations"]
  8. type: `add_index :posts, ___` to speed up `Post.where(author_id: 7)` → `:author_id` [Doc: Migrations, `add_index`]
  9. pick "`db/schema.rb` is…": generated from the database after migrating / edited by hand → generated
     [Doc: Migrations, schema dumping]
  10. pick "`def change; execute \"UPDATE ...\"; end` on rollback…": raises IrreversibleMigration / runs backwards →
      raises; use `up`/`down` [Doc: Migrations]
- **Run**: starter [R]
  ```ruby
  MIGRATIONS = {
    20250102 => ->(s) { s[:posts] << :body },
    20250101 => ->(s) { s[:posts] = [:id, :title] },
  }
  schema = {}
  MIGRATIONS.each { |version, change| change.(schema) }
  p schema
  ```
  → `undefined method '<<' for nil (NoMethodError)` (ran in insertion order). Solution: `MIGRATIONS.sort.each`.
  `expect`: `{posts: [:id, :title, :body]}`.

### 1.5 Boss `query-golem`

1. predict (helper): `Post.find_by_title("Yo").views` with posts Hi(5)/Yo(1)/Ok(9) → `1` [R+H]
2. predict (helper): `p Post.respond_to?(:find_by_title)` → `true` [R+H]
3. predict (helper): `p Post.find_by(title: "Nope")` → `nil` [R+H]
4. predict (helper): `r = Post.where(author_id: 1).order(:views)`; `puts r.class`; `p r.map(&:title)` → `Relation` /
   `["Hi", "Ok"]` [R+H]
5. predict (helper): `Post.find(99)` → `Couldn't find Post with 'id'=99 (RecordNotFound)` [R+H]
6. pick "Rails table for `Person`": `people` [Doc]
7. pick "Run SQL now, not lazily": `Post.where(pub: true).to_a` / `Post.where(pub: true)` → `to_a` [Doc]
8. order "Migration lifecycle": write migration → `bin/rails db:migrate` → version saved in `schema_migrations` →
   `schema.rb` regenerated [Doc]

---

## Region 2: `association-forest`, Associations, N+1, validations, callbacks

Guide line idea: "In the forest every tree has roots. Count your steps: each query is a step."

### 2.1 `associations`, "Family trees"

- **Concept**: `belongs_to :author` reads `author_id` and loads the parent; `has_many :posts` builds a query on the
  child table with the foreign key named after the owner (`author_id`); both are methods made with `define_method`;
  the association returns a relation, so it chains; `belongs_to` is required by default (Rails 5+); `has_many
  :through` for many-to-many with a join model; `dependent: :destroy`; polymorphic `belongs_to`.
- **Visual**: the `Post` actor holds a `key` labelled `author_id: 7`; calling `.author` walks the key to the `Author`
  actor (`give`). `Author.posts` unrolls a `scroll` of child posts.
- **Questions**:
  1. predict: [R]
     ```ruby
     class Model
       def self.belongs_to(name)
         define_method(name) { "load #{name} ##{@attrs[:"#{name}_id"]}" }
       end
       def initialize(attrs) = @attrs = attrs
     end
     class Post < Model
       belongs_to :author
     end
     puts Post.new(author_id: 7).author
     ```
     → `load author #7`
  2. predict: same, `p Post.instance_methods(false)` → `[:author]` [R]
  3. predict: [R]
     ```ruby
     class Model
       def self.has_many(name)
         define_method(name) { "SELECT * FROM #{name} WHERE #{self.class.name.downcase}_id = #{@id}" }
       end
       def initialize(id) = @id = id
     end
     class Author < Model
       has_many :posts
     end
     puts Author.new(1).posts
     ```
     → `SELECT * FROM posts WHERE author_id = 1`
  4. predict (helper): Ada with posts Hi(5), Ok(9): `p a.posts.class` `p a.posts.where(views: 9).map(&:title)` →
     `Relation` / `["Ok"]` [R+H]
  5. pick "`Author has_many :posts`, `Post belongs_to :author`: where is the foreign key?": `posts.author_id` /
     `authors.post_id` → `posts.author_id` [Doc: Associations, `belongs_to`]
  6. pick "Saving a `Post` with no author (Rails ≥ 5 defaults)": fails validation "Author must exist" / saves with
     NULL → fails [Doc: Associations, `belongs_to` `optional`]
  7. pick "Doctors and patients through appointments that have a date": `has_many :through` /
     `has_and_belongs_to_many` → `:through` (the join has its own attributes) [Doc: Associations]
  8. pick "`has_many :comments, dependent: :destroy`, then `post.destroy`": comments destroyed with their callbacks /
     comments left orphaned → the first (`:delete_all` skips callbacks) [Doc: Associations, `:dependent`]
  9. type: `belongs_to :commentable, ___: true` (comments on posts and videos) → `polymorphic` [Doc: Associations]
  10. predict: polymorphic rows [R]
      ```ruby
      COMMENTS = [{body: "nice", commentable_type: "Post", commentable_id: 1},
                  {body: "wow", commentable_type: "Video", commentable_id: 1}]
      p COMMENTS.select { it[:commentable_type] == "Video" }.map { it[:body] }
      ```
      → `["wow"]`
- **Run**: starter [R]
  ```ruby
  POSTS = [{id: 1, title: "Hi", author_id: 1}, {id: 2, title: "Yo", author_id: 2}]
  class Author
    def self.has_many(name)
      define_method(name) do
        fk = :"#{name.to_s.chomp("s")}_id"
        POSTS.select { |row| row[fk] == @id }.map { |row| row[:title] }
      end
    end
    has_many :posts
    def initialize(id) = @id = id
  end
  p Author.new(1).posts
  ```
  prints `[]` (looked for `post_id`). Solution: `fk = :"#{self.class.name.downcase}_id"`. `expect`: `["Hi"]`.

### 2.2 `n-plus-one`, "The query swarm"

- **Concept**: loading N records and then one association per record = 1 + N queries. Preloading collects the ids and
  loads all parents in **one** query (`includes`). Rails: `includes` picks a strategy, `preload` always separate
  queries, `eager_load` always `LEFT OUTER JOIN`; `joins` filters but does not load associations; `counter_cache`
  stores a count column; `strict_loading` raises on lazy loads; Bullet detects N+1 in development; index foreign keys.
- **Visual**: each lazy `author` read is an enemy `attack`; the `banner` counter climbs `QUERIES: 11`. Casting
  `includes` summons one big `scroll`: the swarm vanishes, `banner` `QUERIES: 2`.
- **Shared snippet** (shown in the lesson, small enough to be visible):
  ```ruby
  $queries = 0
  AUTHORS = {1 => "Ada", 2 => "Bo"}
  def find_author(id) = ($queries += 1; AUTHORS[id])
  def find_authors(ids) = ($queries += 1; AUTHORS.slice(*ids))
  ```
- **Questions**:
  1. predict: shared snippet + [R]
     ```ruby
     posts = [{a: 1}, {a: 2}, {a: 1}]
     $queries = 1   # loading the posts
     posts.each { |post| find_author(post[:a]) }
     puts $queries
     ```
     → `4`
  2. predict: shared snippet + [R]
     ```ruby
     posts = [{a: 1}, {a: 2}, {a: 1}]
     $queries = 1
     authors = find_authors(posts.map { it[:a] }.uniq)
     posts.each { |post| authors[post[:a]] }
     puts $queries
     ```
     → `2`
  3. predict "100 posts by 10 authors, lazy loop: how many queries?" → `101`; preloaded → `2` [R: verified with
     `Array.new(100) { |i| {a: i % 10 + 1} }`]
  4. predict (helper): 3 posts, 2 authors: `DB.queries = 0; Post.all.each { _1.author.name }; puts DB.queries` → `4` [R+H]
  5. predict (helper): `DB.queries = 0; Post.includes(:author).each { _1.author.name }; puts DB.queries` → `2` [R+H]
  6. pick "Always a separate query per association": `preload` / `eager_load` / `includes` → `preload`; follow-up
     "Always one `LEFT OUTER JOIN`" → `eager_load` [Doc: Querying, eager loading]
  7. pick "`Post.joins(:author).each { |p| p.author.name }`": still N+1 (joins doesn't load authors) / 1 query →
     still N+1 [Doc: Querying, joins vs includes]
  8. pick "`post.comments.size` without a query on every post": `counter_cache: true` on `belongs_to :post` (column
     `comments_count`) / an index on `comments.post_id` → counter cache [Doc: Associations, `:counter_cache`]
  9. predict: counter cache mini [R]
     ```ruby
     post = {id: 1, comments_count: 0}
     comments = []
     add = ->(text) { comments << text; post[:comments_count] += 1 }
     add.("hi"); add.("yo")
     p post
     ```
     → `{id: 1, comments_count: 2}`
  10. pick "Make lazy loading raise an error": `strict_loading` / `readonly` → `strict_loading`
      (`ActiveRecord::StrictLoadingViolationError`) [Doc: Querying, strict loading]
  11. pick "Gem that warns about N+1 in development": Bullet / Devise → Bullet [Doc: Bullet README]
  12. pick "`Post.where(author_id: 7)` is slow on 10M rows": `add_index :posts, :author_id` / `includes(:author)` →
      the index [Doc: Migrations, indexes]
- **Run**: shared snippet + starter [R]
  ```ruby
  posts = Array.new(10) { |i| {title: "P#{i}", a: i % 2 + 1} }
  $queries = 1
  names = posts.map { |post| find_author(post[:a]) }
  puts "#{names.uniq.sort.join(",")} in #{$queries} queries"
  ```
  prints `Ada,Bo in 11 queries`. Solution: `authors = find_authors(posts.map { |post| post[:a] }.uniq)` then
  `names = posts.map { |post| authors[post[:a]] }`. `expect`: `in 2 queries`. Alternative helper version:
  replace `Post.all` with `Post.includes(:author)` and print `DB.queries`.

### 2.3 `validations`, "Gatekeepers"

- **Concept**: `valid?` runs the rules and fills `errors` (cleared each time); `save` returns `false` instead of
  writing; `save!`/`create!` raise (Rails: `ActiveRecord::RecordInvalid`); `create` returns the unsaved object;
  full messages "Title can't be blank"; some methods skip validations (`update_column`, `save(validate: false)`);
  `uniqueness` needs a unique index too (race condition).
- **Visual**: the gate guard raises the `shield`; a record with an empty title bounces (`shake`) and an error `say`
  bubble appears; the valid one passes and `print`s `INSERT`.
- **Questions**:
  1. predict: [R]
     ```ruby
     class Post
       attr_reader :errors
       def initialize(title) = (@title = title; @errors = Hash.new { |h, k| h[k] = [] })
       def valid?
         errors.clear
         errors[:title] << "can't be blank" if @title.to_s.strip.empty?
         errors.empty?
       end
       def save = valid? ? (puts "INSERT"; true) : false
     end
     post = Post.new("  ")
     p post.save
     p post.errors
     ```
     → `false` / `{title: ["can't be blank"]}`
  2. predict: same class, `p Post.new("Hi").save` → `INSERT` / `true` [R]
  3. predict: same, `p post.errors.flat_map { |f, ms| ms.map { "#{f.capitalize} #{it}" } }` → `["Title can't be blank"]` [R]
  4. predict: [R]
     ```ruby
     class RecordInvalid < StandardError; end
     class Post
       def initialize(title) = @title = title
       def save = !@title.to_s.empty?
       def save! = save || raise(RecordInvalid, "Validation failed: Title can't be blank")
     end
     p Post.new("").save
     Post.new("").save!
     ```
     → `false`, then `Validation failed: Title can't be blank (RecordInvalid)`
  5. predict (helper): `class Post < Model; attribute :title; validates_presence_of :title; end`
     `post = Post.new(title: ""); p post.save; p post.persisted?; post.title = "Hello"; p post.save; p post.id`
     → `false` / `false` / `true` / `1` [R+H]
  6. pick "Invalid record: `save` / `save!`": returns false / raises `ActiveRecord::RecordInvalid` → matching pairs
     [Doc: Validations, "valid? and invalid?", bang methods]
  7. pick "Skips validations": `update_column(:title, "")` / `update(title: "")` → `update_column` [Doc: Validations,
     skipping validations]
  8. pick "`validates :email, uniqueness: true` and two requests at the same instant": both may pass; add a unique
     index / Rails locks the table → add a unique index [Doc: Validations, uniqueness]
  9. type: `validates :title, ___: true` → `presence` [Doc: Validations]
  10. pick "When do validations run?": on `save`/`create`/`update` and `valid?` / on `new` → the first [Doc]
- **Run**: starter [R]
  ```ruby
  class Post
    attr_accessor :title
    attr_reader :errors
    def initialize(title) = (@title = title; @errors = [])
    def valid?
      errors << "Title can't be blank" if title.to_s.empty?
      errors.empty?
    end
  end
  post = Post.new("")
  post.valid?
  post.title = "Fixed"
  puts post.valid? ? "saved" : "rejected: #{post.errors.join}"
  ```
  prints `rejected: Title can't be blank` (stale errors). Solution: `errors.clear` first in `valid?`. `expect`: `saved`.

### 2.4 `callbacks-and-concerns`, "Rituals before the vault"

- **Concept**: callbacks are method names stored in a class-level list and run in order around `save`; order on
  create: `before_validation`, `after_validation`, `before_save`, `before_create`, `after_create`, `after_save`, then
  `after_commit`; `throw :abort` halts (since Rails 5, returning `false` does not), `save` → `false`, `save!` →
  `ActiveRecord::RecordNotSaved`; side effects (emails, jobs) belong in `after_commit`; `update_all`, `update_column`,
  `delete`, `insert_all` skip callbacks. Concerns are modules: an `included` hook adds class macros
  (`ActiveSupport::Concern` wraps this with `included do` and `class_methods do`). Gotcha: class instance variables
  are not inherited (Rails uses `class_attribute`).
- **Visual**: ritual stones light up one by one (`banner` per callback); `throw :abort` → `drop` the record + `banner`
  "HALTED"; a concern is a `scroll` of spells the class learns with `include`.
- **Questions**:
  1. predict: [R]
     ```ruby
     class Post
       CALLBACKS = [:normalize, :check_spam]
       def initialize(title) = @title = title
       def normalize = @title = @title.strip
       def check_spam = (throw :abort if @title.include?("$$$"))
       def save
         catch(:abort) do
           CALLBACKS.each { |cb| send(cb) }
           puts "INSERT #{@title}"
           return true
         end
         false
       end
     end
     p Post.new(" Hi ").save
     p Post.new("$$$ win").save
     ```
     → `INSERT Hi` / `true` / `false`
  2. predict: `def check_spam = throw(:abort)` then `check_spam` with no `catch` → `uncaught throw :abort
     (UncaughtThrowError)` [R]
  3. order "Callbacks when creating a record": `before_validation`, `after_validation`, `before_save`,
     `before_create`, `after_create`, `after_save` [Doc: Callbacks, available callbacks]
  4. pick "`throw :abort` in `before_save`, then `save!`": raises `ActiveRecord::RecordNotSaved` / returns false →
     raises [Doc: Callbacks, halting execution]
  5. pick "Send the welcome email only after the row is really committed": `after_commit` (`after_create_commit`) /
     `before_save` → `after_commit` [Doc: Callbacks, transaction callbacks]
  6. pick "Skips callbacks": `Post.update_all(views: 0)` / `post.update(views: 0)` → `update_all` [Doc: Callbacks,
     skipping callbacks]
  7. predict (helper): [R+H]
     ```ruby
     class Post < Model
       attribute :title
       before_save :normalize
       before_save :no_spam
       def normalize = self.title = title.strip
       def no_spam = (throw :abort if title.include?("$$$"))
     end
     p Post.new(title: " Hi ").tap(&:save).title
     p Post.new(title: "$$$").save
     p DB.tables["posts"].size
     ```
     → `"Hi"` / `false` / `1`
  8. predict: concern [R]
     ```ruby
     module Sluggable
       def self.included(base) = base.extend(ClassMethods)
       module ClassMethods
         def slug_from(field) = define_method(:slug) { send(field).downcase.tr(" ", "-") }
       end
     end
     class Post
       include Sluggable
       attr_reader :title
       slug_from :title
       def initialize(t) = @title = t
     end
     puts Post.new("Hello World").slug
     ```
     → `hello-world`
  9. predict: [R]
     ```ruby
     class Model
       def self.before_save(m) = (@cbs ||= []) << m
       def self.cbs = @cbs || []
     end
     class Post < Model; before_save :a; end
     class Draft < Post; before_save :b; end
     p Post.cbs
     p Draft.cbs
     ```
     → `[:a]` / `[:b]` (Draft did not inherit `:a`; Rails stores callbacks with inheritable class attributes)
  10. pick "In `ActiveSupport::Concern`, add a `before_save` to the including class inside…": `included do … end` /
      `class_methods do … end` → `included do` [Doc: API `ActiveSupport::Concern`]
- **Run**: starter [R]
  ```ruby
  class Post
    def initialize(title) = @title = title
    def check_spam
      return false if @title.include?("$$$")
    end
    def save
      catch(:abort) do
        check_spam
        puts "INSERT #{@title}"
        return true
      end
      puts "HALTED"
      false
    end
  end
  Post.new("$$$ win").save
  ```
  prints `INSERT $$$ win`. Solution: `throw :abort if @title.include?("$$$")` (mirrors the Rails 5 change: returning
  `false` no longer halts). `expect`: `HALTED`.

### 2.5 Boss `n-plus-one-hydra`

1. predict "100 posts, 10 authors, `post.author.name` in a loop, no preloading": `101` queries [R]
2. predict (helper): `Post.includes(:author).map { _1.author.name }` → `["Ada", "Bo", "Ada"]` with `2` queries [R+H]
3. pick "Filter posts by author name AND load the authors in the same query": `eager_load(:author).where(authors: { name: "Ada" })` /
   `preload(:author).where(...)` → `eager_load` (preload cannot filter on the other table) [Doc: Querying]
4. predict: the `Draft`/`Post` callback inheritance puzzle → `[:a]` / `[:b]` [R]
5. pick "`belongs_to :post, counter_cache: true` needs a column named…": `comments_count` on posts /
   `count` on comments → `comments_count` [Doc: Associations]
6. predict (helper): `x = Post.new; x.save!` with presence of title → `Validation failed: Title can't be blank
   (RecordInvalid)` [R+H]
7. pick "`dependent: :delete_all` vs `:destroy`": `:delete_all` skips the children's callbacks / identical → the first [Doc]
8. type: halt a callback chain with `throw ___` → `:abort` [Doc + R]

---

## Region 3: `controller-castle`, The request: routes, params, filters, views, jobs, cache, security

Guide line idea: "A request knocks at the gate. Follow it from the gate to the scribe and back."

### 3.1 `routing`, "The gate map"

- **Concept**: the router matches **verb + path** to `controller#action`; `:id` segments become params (always
  **strings**); first matching route wins (that's why `/posts/new` must come before `/posts/:id`; `resources` orders
  them for you); `resources :posts` = 7 RESTful routes (index, new, create, show, edit, update, destroy); `only:`;
  nested resources; path helpers; `root`. No match → 404 (`ActionController::RoutingError`).
- **Visual**: the gatekeeper reads the messenger's `scroll` "GET /posts/42", traces the map, `say`s "posts#show" and
  `give`s an `item` `id: "42"` (string chip).
- **Router snippet** (visible, verified):
  ```ruby
  ROUTES = [["GET", "/posts", "posts#index"], ["GET", "/posts/:id", "posts#show"]]
  def recognize(verb, path)
    ROUTES.each do |v, pattern, to|
      next unless v == verb
      regex = Regexp.new("\\A" + pattern.gsub(/:(\w+)/, '(?<\1>[^/]+)') + "\\z")
      m = regex.match(path)
      return [to, m.named_captures.transform_keys(&:to_sym)] if m
    end
    nil
  end
  ```
- **Questions**:
  1. predict: router + `p recognize("GET", "/posts/42")` → `["posts#show", {id: "42"}]` [R]
  2. predict: `p recognize("GET", "/posts")` → `["posts#index", {}]` [R]
  3. predict: `p recognize("DELETE", "/posts/42")` → `nil` (Rails: no route matches → 404) [R]
  4. predict: `p recognize("GET", "/posts/42/edit")` → `nil` (the pattern is anchored) [R]
  5. predict: `params = {id: "42"}` `p params[:id].to_i + 1` then `params[:id] + 1` → `43`, then
     `no implicit conversion of Integer into String (TypeError)` [R]
  6. predict: [R]
     ```ruby
     def resources(name)
       [["GET", "/#{name}", "index"], ["GET", "/#{name}/new", "new"],
        ["POST", "/#{name}", "create"], ["GET", "/#{name}/:id", "show"],
        ["GET", "/#{name}/:id/edit", "edit"], ["PATCH", "/#{name}/:id", "update"],
        ["DELETE", "/#{name}/:id", "destroy"]]
     end
     puts resources(:posts).size
     puts resources(:posts).count { |verb, _, _| verb == "GET" }
     ```
     → `7` / `4`
  7. predict: same, `p resources(:posts).select { |_, path, _| path == "/posts/:id" }.map(&:last)` →
     `["show", "update", "destroy"]` (same path, different verbs) [R]
  8. pick "`resources :photos`: `PATCH /photos/17` goes to…": `photos#update` / `photos#edit` → `update` [Doc: Routing, CRUD]
  9. type: `resources :posts, ___: [:index, :show]` → `only` [Doc: Routing]
  10. pick "Nested `resources :posts do resources :comments end`: list a post's comments": `/posts/:post_id/comments` /
      `/comments?post=:id` → the first [Doc: Routing, nested resources]
  11. pick "`root \"posts#index\"` handles…": `GET /` / `GET /posts` → `GET /` [Doc: Routing]
- **Run**: starter = router with `ROUTES = [["GET", "/posts/:id", "posts#show"], ["GET", "/posts/new", "posts#new"]]`
  and `p recognize("GET", "/posts/new")` → prints `["posts#show", {id: "new"}]`. Solution: put `/posts/new` first.
  `expect`: `["posts#new", {}]`. [R]

### 3.2 `strong-params`, "The shield of permitted gifts"

- **Concept**: params arrive as nested hashes of strings; mass assignment (`User.new(params)`) lets an attacker set
  `admin: true`; `require(:post)` insists the key exists (Rails: `ActionController::ParameterMissing`, a `KeyError`
  subclass, answered with 400); `permit(:title, :body)` keeps only listed keys (unpermitted ones are dropped and
  logged; `action_on_unpermitted_parameters = :raise` raises); Rails 8 `params.expect(post: [:title, :body])` does
  both with type checks; `permit!` permits everything (dangerous). Rails params accept `:id` or `"id"`; a plain Ruby
  hash does not.
- **Visual**: the messenger's bag spills `item`s (`title`, `admin`); the `shield` lets `title` through, `admin`
  `drop`s with a `shake`. Missing bag → `banner` "400".
- **Params snippet** (visible, verified):
  ```ruby
  class ParameterMissing < KeyError; end
  class Params
    def initialize(h) = @h = h
    def require(key)
      value = @h[key]
      raise ParameterMissing, "param is missing or the value is empty or invalid: #{key}" if value.nil? || value.empty?
      Params.new(value)
    end
    def permit(*keys) = @h.slice(*keys)
  end
  ```
- **Questions**:
  1. predict: snippet + `params = Params.new({"post" => {"title" => "Hi", "admin" => true}})`
     `p params.require("post").permit("title", "body")` → `{"title" => "Hi"}` [R]
  2. predict: snippet + `Params.new({}).require("post")` → `param is missing or the value is empty or invalid: post
     (ParameterMissing)` [R]
  3. predict: snippet + `begin; Params.new({"post" => {}}).require("post"); rescue KeyError => e; puts "#{e.class}: #{e.message}"; end`
     → `ParameterMissing: param is missing or the value is empty or invalid: post` (empty counts as missing; a
     subclass is caught by `rescue KeyError`) [R]
  4. predict: mass assignment [R]
     ```ruby
     User = Struct.new(:name, :admin, keyword_init: true)
     incoming = {name: "Eve", admin: true}
     p User.new(**incoming).admin
     p User.new(**incoming.slice(:name)).admin
     ```
     → `true` / `nil`
  5. predict: `params = {"id" => "5"}` `p params[:id]` `p params["id"]` → `nil` / `"5"` (Rails params answer both
     ways: they are `ActionController::Parameters`, with indifferent access) [R][Doc: Action Controller, parameters]
  6. pick "Missing `post` key in `params.require(:post)` in Rails": `ParameterMissing` → 400 Bad Request / `nil` →
     the first [Doc: Action Controller, strong parameters]
  7. pick "A key you didn't `permit` (default config)": silently dropped (logged) / raises → dropped [Doc: Action
     Controller, strong parameters]
  8. type (Rails 8): `params.___(post: [:title, :body])` → `expect` [Doc: Action Controller; Rails 8 release notes]
  9. pick "`params.require(:user).permit!`": permits every key, including `admin` / permits nothing → every key
     (avoid) [Doc: Action Controller]
  10. predict: `def require(key) = Params.new(@h.fetch(key))` with `Params.new({}).require("post")` →
      `key not found: "post" (KeyError)` [R]
- **Run**: starter [R]
  ```ruby
  class Params
    def initialize(h) = @h = h
    def require(key) = Params.new(@h.fetch(key))
    def permit(*keys) = @h.reject { |k, _| keys.include?(k) }
  end
  params = Params.new({"post" => {"title" => "Hi", "admin" => true}})
  p params.require("post").permit("title", "body")
  ```
  prints `{"admin" => true}` (inverted filter: the attacker's key got through). Solution: `@h.slice(*keys)`.
  `expect`: `{"title" => "Hi"}`.

### 3.3 `filters-and-views`, "Guards and scribes"

- **Concept**: `before_action` methods run before the action, in order; if one renders or redirects, the chain stops
  and the action never runs; `only:`/`except:`, `skip_before_action`; `render` (same request) vs `redirect_to` (new
  request, 302); rendering twice raises `AbstractController::DoubleRenderError`. Views are ERB: `<% %>` runs code,
  `<%= %>` prints; layouts wrap views with `yield`; Rails' ERB escapes `<%= %>` automatically, `raw`/`html_safe`
  turn escaping off (XSS risk). Plain stdlib ERB does not escape: use `ERB::Util.h`.
- **Visual**: the guard at the inner door checks the messenger; no badge → `banner` "302 /login" and `exit`. The
  scribe `print`s HTML; `<script>` from a user turns into harmless `&lt;script&gt;` text (`shield`).
- **Questions**:
  1. predict (MiniController): [R+H]
     ```ruby
     class PostsController < Controller
       before_action :require_login, only: [:edit]
       def require_login = (redirect_to "/login" unless @user)
       def show = render("post")
       def edit = render("form")
     end
     puts PostsController.new.process(:show)
     puts PostsController.new.process(:edit)
     ```
     → `200 post` / `302 /login`
  2. predict: same, `puts PostsController.new("ada").process(:edit)` → `200 form` [R+H]
  3. predict: [R]
     ```ruby
     require "erb"
     include ERB::Util
     title = "<b>Hi</b>"
     puts ERB.new("<h1><%= h(title) %></h1>").result(binding)
     puts ERB.new("<h1><%= title %></h1>").result(binding)
     ```
     → `<h1>&lt;b&gt;Hi&lt;/b&gt;</h1>` / `<h1><b>Hi</b></h1>`
  4. predict: `items = ["a", "b"]` `puts ERB.new("<% items.each do |i| %><li><%= i %></li><% end %>").result(binding)`
     → `<li>a</li><li>b</li>` [R]
  5. predict: `puts ERB.new("<% x = 5 %>[<%= x * 2 %>]").result` → `[10]` (`<% %>` prints nothing) [R]
  6. predict: `def layout = "<main>#{yield}</main>"` `puts layout { "<p>post</p>" }` → `<main><p>post</p></main>` [R]
  7. pick "In a Rails view, `<%= @comment.body %>` with `<script>` inside": escaped automatically / runs the script →
     escaped (unless `raw` / `html_safe`) [Doc: Security, XSS; Action View]
  8. pick "A `before_action` calls `redirect_to`": the action is skipped / the action still runs → skipped
     [Doc: Action Controller, filters]
  9. type: `skip_before_action :require_login, ___: [:index]` → `only` [Doc: Action Controller]
  10. pick "Show the form again with errors after a failed `save`": `render :new, status: :unprocessable_entity` /
      `redirect_to new_post_path` → `render` (keeps the object and its errors) [Doc: Getting Started; Layouts and
      Rendering]
  11. pick "Calling `render` and then `redirect_to` in one action": `DoubleRenderError` / the last one wins → the error
      [Doc: Layouts and Rendering, "Avoiding double render errors"]
- **Run**: starter [R]
  ```ruby
  class Controller
    def self.filters = (@filters ||= [])
    def self.before_action(m) = filters << m
    def process(action)
      self.class.filters.each { |m| send(m) }
      send(action)
      @response
    end
    def redirect_to(path) = @response = "302 #{path}"
    def render(text) = @response = "200 #{text}"
  end
  class AdminController < Controller
    before_action :require_admin
    def require_admin = redirect_to("/login")
    def index = render("secret")
  end
  puts AdminController.new.process(:index)
  ```
  prints `200 secret` (the guard redirected but the action still ran and overwrote it). Solution: inside the loop,
  `send(m)` then `return @response if @response`. `expect`: `302 /login`. (The visible code is 17 lines; authors can
  move `redirect_to`/`render` into the hidden helper.)

### 3.4 `jobs-cache-security`, "Ravens, chests and locks"

- **Concept**: **jobs**: `perform_later` enqueues (class + arguments) and returns at once, a worker runs `perform`
  later; jobs can run more than once (retries), so make them idempotent; Active Job serializes records as GlobalIDs
  and reloads them when the job runs; Rails 8 default backend is Solid Queue. **Cache**: `Rails.cache.fetch(key) {}`
  computes once and returns the stored value afterwards; a `||=` cache recomputes `nil`/`false`; key-based expiration
  puts `updated_at` in the key so a change makes a new key (Rails 8 default store: Solid Cache). **Security**: SQL
  built by interpolation is injectable; placeholders (`where("name = ?", name)`) quote values; CSRF: Rails checks an
  authenticity token on non-GET requests, so GET must never change data.
- **Visual**: a raven takes the message (`give`), `wait`, then flies and `print`s; the treasure chest `say`s
  "computing" only the first time; the SQL lock: interpolated input picks the lock (`shake`, `banner` "ALL ROWS"),
  placeholder input bounces off.
- **Questions**:
  1. predict: [R]
     ```ruby
     QUEUE = []
     class Job
       def self.perform_later(*args) = QUEUE << [self, args]
       def self.perform_now(*args) = new.perform(*args)
     end
     class WelcomeJob < Job
       def perform(user_id) = puts("mail to user #{user_id}")
     end
     WelcomeJob.perform_later(7)
     puts "queued: #{QUEUE.size}"
     klass, args = QUEUE.shift
     klass.perform_now(*args)
     ```
     → `queued: 1` / `mail to user 7`
  2. predict: [R]
     ```ruby
     class Cache
       def initialize = @store = {}
       def fetch(key)
         return @store[key] if @store.key?(key)
         @store[key] = yield
       end
     end
     cache = Cache.new
     2.times { puts cache.fetch("stats") { puts "computing"; 42 } }
     ```
     → `computing` / `42` / `42`
  3. predict: `store = {}` `fetch = ->(key, &blk) { store[key] ||= blk.call }` `2.times { p fetch.("user") { puts "query"; nil } }`
     → `query` / `nil` / `query` / `nil` (`||=` never caches `nil`) [R]
  4. predict: key-based expiration [R]
     ```ruby
     store = {}
     fetch = ->(key, &blk) { store.key?(key) ? store[key] : (store[key] = blk.call) }
     post = {id: 1, title: "Hi", updated_at: 100}
     key = -> { "posts/#{post[:id]}-#{post[:updated_at]}" }
     puts fetch.(key.()) { "<h1>#{post[:title]}</h1>" }
     post[:title] = "Bye"
     puts fetch.(key.()) { "<h1>#{post[:title]}</h1>" }
     post[:updated_at] = 101
     puts fetch.(key.()) { "<h1>#{post[:title]}</h1>" }
     ```
     → `<h1>Hi</h1>` / `<h1>Hi</h1>` / `<h1>Bye</h1>` (stale until `updated_at` changes the key)
  5. predict: [R]
     ```ruby
     def quote(v) = "'" + v.to_s.gsub("'", "''") + "'"
     def where(sql, *binds) = binds.reduce(sql) { |s, b| s.sub("?", quote(b)) }
     input = "x' OR '1'='1"
     puts "SELECT * FROM users WHERE name = '#{input}'"
     puts where("SELECT * FROM users WHERE name = ?", input)
     ```
     → `SELECT * FROM users WHERE name = 'x' OR '1'='1'` / `SELECT * FROM users WHERE name = 'x'' OR ''1''=''1'`
  6. pick "Safe in Rails": `User.where("name = ?", params[:name])` / `User.where("name = '#{params[:name]}'")` → the
     placeholder (hash conditions `where(name: ...)` are safe too) [Doc: Security, SQL injection]
  7. predict: idempotent job [R]
     ```ruby
     SENT = []
     def deliver(order_id)
       return puts("skip #{order_id}") if SENT.include?(order_id)
       SENT << order_id
       puts "charged #{order_id}"
     end
     deliver(5); deliver(5)
     ```
     → `charged 5` / `skip 5`
  8. pick "`WelcomeJob.perform_later(user)` with an Active Record object": serialized as a GlobalID and reloaded when
     the job runs / the whole object is copied into the queue → GlobalID [Doc: Active Job, GlobalID]
  9. pick "Rails 8 default job backend": Solid Queue / Sidekiq → Solid Queue [Doc: Rails 8 release; Active Job]
  10. pick "Rails CSRF protection checks the token on…": non-GET requests (POST, PATCH, DELETE) / every request →
      non-GET; so GET actions must not change data [Doc: Security, CSRF]
  11. type: `Rails.cache.___("stats", expires_in: 1.hour) { compute }` → `fetch` [Doc: Caching, low-level caching]
  12. predict: CSRF mini [R]
      ```ruby
      require "securerandom"
      session = {csrf: SecureRandom.hex(16)}
      valid = ->(verb, token) { verb == "GET" || token == session[:csrf] }
      p valid.("GET", nil)
      p valid.("POST", "forged")
      p valid.("POST", session[:csrf])
      ```
      → `true` / `false` / `true`
- **Run**: starter [R]
  ```ruby
  def quote(v) = "'" + v.to_s.gsub("'", "''") + "'"
  def where(sql, *binds) = binds.reduce(sql) { |s, b| s.sub("?", quote(b)) }
  def find_user_sql(name) = where("SELECT * FROM users WHERE name = '#{name}'")
  puts find_user_sql("x' OR '1'='1")
  ```
  prints `SELECT * FROM users WHERE name = 'x' OR '1'='1'`. Solution:
  `where("SELECT * FROM users WHERE name = ?", name)`. `expect`: `name = 'x'' OR ''1''=''1'`.

### 3.5 Boss `request-dragon`

1. predict: router `p recognize("GET", "/posts/new")` with `:id` declared first → `["posts#show", {id: "new"}]` [R]
2. predict: strong params `permit("title", "body")` on `{"title" => "Hi", "admin" => true}` → `{"title" => "Hi"}` [R]
3. predict (MiniController): `PostsController.new.process(:edit)` → `302 /login` [R+H]
4. predict: ERB with `h` on `"<b>Hi</b>"` → `<h1>&lt;b&gt;Hi&lt;/b&gt;</h1>` [R]
5. predict: `||=` cache with `nil` → `query` printed twice [R]
6. pick "Order of a request": router → `before_action` filters → action → view render → response [Doc: Action
   Controller; Routing]
7. pick "Prevents mass assignment": strong parameters / `protect_from_forgery` → strong parameters [Doc]
8. predict: the interpolated SQL with `x' OR '1'='1` → `... name = 'x' OR '1'='1'` (returns all rows) [R]

---

# Entry exams

Draws, pass marks and seconds follow the other moons. `[Doc]` questions have no check; `[R]` questions are wired to
the Ruby 3.4.7 runner. Junior leans on naming, finders, validations and routing; mid on N+1, callbacks, filters, cache
and jobs; senior on database judgment, security and architecture.

## Topics

| Topic id | Name (en) | Region |
|---|---|---|
| `active_record_basics` | Models, tables and conventions | `record-village` |
| `finders` | find, find_by, where and dynamic finders | `record-village` |
| `relations` | Lazy relations, scopes, pluck and count | `record-village` |
| `migrations` | Migrations and schema | `record-village` |
| `associations` | Associations | `association-forest` |
| `n_plus_one` | N+1, eager loading, counter caches | `association-forest` |
| `validations` | Validations and errors | `association-forest` |
| `callbacks` | Callbacks and concerns | `association-forest` |
| `routing` | Routing and REST | `controller-castle` |
| `strong_params` | Strong parameters and mass assignment | `controller-castle` |
| `controllers_filters` | Controllers, filters, render vs redirect | `controller-castle` |
| `views` | ERB views, layouts, escaping | `controller-castle` |
| `jobs` | Background jobs | `controller-castle` |
| `caching` | Caching | `controller-castle` |
| `security` | CSRF, SQL injection, XSS, sessions | `controller-castle` |
| `testing` | Testing Rails (Minitest, fixtures, request tests) | (none) |
| `database` | Indexes, transactions, locking | (none) |
| `architecture` | Rack, service objects, STI/polymorphic, Zeitwerk, Hotwire, Rails 8 defaults | (none) |

## Levels

| Exam | Draws / bank | Pass | s/question | Topic ids (bank count) | Conceptual share |
|---|---|---|---|---|---|
| `junior`, Junior Rails Developer | 12 / 22 | 70% | 30 | active_record_basics 3, finders 3, migrations 2, associations 3, validations 3, routing 3, strong_params 2, views 2, testing 1 | ~45% |
| `mid`, Mid-level Rails Developer | 14 / 24 | 70% | 40 | relations 3, finders 1, associations 2, n_plus_one 3, validations 1, callbacks 3, controllers_filters 2, strong_params 2, migrations 1, caching 2, jobs 2, security 2 | ~50% |
| `senior`, Senior Rails Developer | 15 / 26 | 75% | 50 | n_plus_one 3, database 4, migrations 2, callbacks 2, associations 2, caching 3, jobs 3, security 3, architecture 3, testing 1 | ~60% |

## Junior examples

1. `active_record_basics` pick "Table for model `Person`": `people` / `persons` [Doc]
2. `active_record_basics` predict: `def tableize(name) = name.gsub(/([a-z])([A-Z])/, '\1_\2').downcase + "s"`
   `puts tableize("BookClub")` → `book_clubs` [R]
3. `finders` pick "`Post.find_by(id: 999)` when missing": `nil` / raises → `nil` [Doc]
4. `finders` predict: the mini `find(9)` → `Couldn't find Post with 'id'=9 (RecordNotFound)` [R]
5. `migrations` pick "Undo the last migration": `bin/rails db:rollback` [Doc]
6. `associations` pick "Foreign key for `Post belongs_to :author`": `author_id` on posts [Doc]
7. `validations` predict: mini `save` with blank title → `false` / `{title: ["can't be blank"]}` [R]
8. `routing` pick "`resources :posts` creates how many routes?": 7 / 4 / 5 → 7 [Doc + R mini]
9. `strong_params` predict: mini `permit("title", "body")` → `{"title" => "Hi"}` [R]
10. `views` pick "Runs Ruby without printing": `<% %>` / `<%= %>` → `<% %>` [Doc]
11. `testing` predict "What summary does this Minitest run end with?": a test with `assert_equal 2, 1 + 2` and one
    passing test → `2 runs, 2 assertions, 1 failures, 0 errors, 0 skips` [R; check the substring only, seed and
    timing vary]

## Mid examples

1. `relations` predict: memoized relation `to_a` twice → `QUERY` printed once [R]
2. `relations` pick "Always runs `SELECT COUNT(*)`": `count` / `length` [Doc]
3. `n_plus_one` predict: 3 posts, lazy authors → `4` queries; with preload → `2` [R]
4. `n_plus_one` pick "`joins(:author)` then reading `post.author`": still N+1 [Doc]
5. `callbacks` predict: `catch(:abort)` chain with `"$$$ win"` → `false` [R]
6. `callbacks` pick "Send email after commit": `after_commit` [Doc]
7. `controllers_filters` predict: filter chain without the early return → `200 secret`; fixed → `302 /login` [R]
8. `strong_params` type (Rails 8): `params.___(post: [:title])` → `expect` [Doc]
9. `caching` predict: `||=` cache with `nil` → recomputes [R]
10. `jobs` pick "Jobs may run twice after a retry, so they should be…": idempotent / synchronous → idempotent [Doc:
    Active Job, exceptions and retries]
11. `security` predict: interpolated vs placeholder SQL [R]
12. `associations` pick "Many-to-many with extra columns on the join": `has_many :through` [Doc]

## Senior examples

1. `n_plus_one` pick "Filter on the association's columns and load it in one query": `eager_load` / `preload` [Doc]
2. `database` predict: transaction mini [R]
   ```ruby
   def transaction(db)
     snapshot = db.dup
     yield
   rescue => e
     db.replace(snapshot)
     puts "ROLLBACK (#{e.message})"
   end
   accounts = {a: 100, b: 0}
   transaction(accounts) do
     accounts[:a] -= 50
     raise "card declined"
   end
   p accounts
   ```
   → `ROLLBACK (card declined)` / `{a: 100, b: 0}`
3. `database` predict: optimistic locking mini [R]
   ```ruby
   class StaleObjectError < StandardError; end
   ROW = {title: "A", lock_version: 0}
   def update(copy, title)
     raise StaleObjectError, "Attempted to update a stale object" if copy[:lock_version] != ROW[:lock_version]
     ROW.update(title: title, lock_version: ROW[:lock_version] + 1)
   end
   ada = ROW.dup
   bo = ROW.dup
   update(ada, "Ada's")
   p ROW
   update(bo, "Bo's")
   ```
   → `{title: "Ada's", lock_version: 1}` then `Attempted to update a stale object (StaleObjectError)` (Rails:
   `ActiveRecord::StaleObjectError` with a `lock_version` column) [R][Doc: Querying, locking]
4. `database` pick "Composite index on `(user_id, status)` helps…": `user_id` alone and both, not `status` alone /
   any combination → the first (leftmost prefix) [Doc: database docs; techinterview.org]
5. `migrations` pick "Adding a column with a default / an index on a huge table in production": may lock the table;
   use concurrent index creation (`algorithm: :concurrently` on PostgreSQL) and deploy in steps / always safe → the
   first [Doc: Migrations; strong_migrations README]
6. `caching` pick "Russian doll caching: a comment changes, the outer post fragment must expire too": `belongs_to
   :post, touch: true` / `dependent: :destroy` → `touch: true` [Doc: Caching, Russian doll]
7. `jobs` pick "Where to enqueue a job after creating a record": `after_commit` / `after_save` → `after_commit` (the
   worker may run before the transaction commits otherwise) [Doc: Callbacks; Active Job]
8. `security` pick "After login, call…": `reset_session` (session fixation) / nothing → `reset_session` [Doc:
   Security, session fixation]
9. `security` pick "`redirect_to params[:return_to]`": open redirect; check against an allow list / safe → the first
   [Doc: Security, redirection]
10. `architecture` predict: Rack middleware [R]
    ```ruby
    app = ->(env) { [200, {}, ["Hello #{env["PATH_INFO"]}"]] }
    class Timing
      def initialize(app) = @app = app
      def call(env)
        status, headers, body = @app.call(env)
        [status, headers.merge("x-runtime" => "1ms"), body]
      end
    end
    p Timing.new(app).call({"PATH_INFO" => "/posts"})
    ```
    → `[200, {"x-runtime" => "1ms"}, ["Hello /posts"]]`
11. `architecture` predict: STI mini `rows = [{type: "Post"}, {type: "Video"}]`
    `p rows.map { Object.const_get(it[:type]).new.kind }` with `Video < Post` overriding `kind` → `["post", "video"]`
    [R]
12. `architecture` pick "Rails 8 file `app/models/admin/user.rb` must define…": `Admin::User` (Zeitwerk naming) /
    `AdminUser` → `Admin::User` [Doc: Autoloading and Reloading]
13. `callbacks` pick "A 6-step `after_save` chain sends emails, charges cards and updates search": move into a service
    object called explicitly / add more callbacks → service object [Doc: Callbacks caution; community practice, mark as
    opinion in the explanation]
14. `testing` pick "Rails' default test framework": Minitest / RSpec → Minitest [Doc: Testing guide]

---

# Sources for this curriculum

Research file: [rails-hiring-assessments.md](rails-hiring-assessments.md) (full source list). Pages cited by `[Doc]`:

- Active Record Basics (naming conventions, CRUD): https://guides.rubyonrails.org/active_record_basics.html
- Active Record Migrations: https://guides.rubyonrails.org/active_record_migrations.html
- Active Record Validations: https://guides.rubyonrails.org/active_record_validations.html
- Active Record Callbacks: https://guides.rubyonrails.org/active_record_callbacks.html
- Active Record Associations: https://guides.rubyonrails.org/association_basics.html
- Active Record Query Interface (find, lazy relations, scopes, eager loading, strict loading, locking, SQL injection-safe conditions): https://guides.rubyonrails.org/active_record_querying.html
- `ActiveRecord::Relation` API (`size`, `count`, `length`): https://api.rubyonrails.org/classes/ActiveRecord/Relation.html
- `ActiveSupport::Concern` API: https://api.rubyonrails.org/classes/ActiveSupport/Concern.html
- Action Controller Overview (parameters, strong parameters, `expect`, filters, flash, session): https://guides.rubyonrails.org/action_controller_overview.html
- Layouts and Rendering (render vs redirect, double render): https://guides.rubyonrails.org/layouts_and_rendering.html
- Routing from the Outside In: https://guides.rubyonrails.org/routing.html
- Action View Overview: https://guides.rubyonrails.org/action_view_overview.html
- Active Job Basics (GlobalID, retries, Solid Queue): https://guides.rubyonrails.org/active_job_basics.html
- Caching with Rails (low-level, fragment, Russian doll): https://guides.rubyonrails.org/caching_with_rails.html
- Securing Rails Applications (CSRF, SQL injection, XSS, session fixation, redirection): https://guides.rubyonrails.org/security.html
- Testing Rails Applications: https://guides.rubyonrails.org/testing.html
- Rails on Rack: https://guides.rubyonrails.org/rails_on_rack.html
- Autoloading and Reloading Constants (Zeitwerk): https://guides.rubyonrails.org/autoloading_and_reloading_constants.html
- Getting Started with Rails: https://guides.rubyonrails.org/getting_started.html
- Rails 8 release: https://rubyonrails.org/2024/11/7/rails-8-no-paas-required
- `ActionController::ExpectedParameterMissing`: https://edgeapi.rubyonrails.org/classes/ActionController/ExpectedParameterMissing.html
- Bullet: https://github.com/flyerhzm/bullet
- strong_migrations: https://github.com/ankane/strong_migrations
- techinterview.org Rails questions (composite index leftmost prefix, Russian doll): https://www.techinterview.org/post/3233460911/ruby-on-rails-interview-questions/
