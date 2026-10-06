import type { ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { MINI_RECORD, withHelper } from "./mini.ts";

// Written-test formats for moon Railhaven (Rails under the hood, plain Ruby 3.4.7 on Compiler
// Explorer): trace tables (dry-run the code, fill the values) and debugging tasks (tap the buggy line,
// then fix it). Rails can't run in the sandbox, so every item traces or fixes our mini version of a
// Rails mechanism; real Rails API facts are never claimed as output. Cells are written the way `p`
// prints them (Ruby 3.4 inspect). The validator runs every `verify` and proves each fix passes the
// tests while the buggy code and the near misses fail.

const rb = String.raw;
const code = (...lines: string[]) => lines.join("\n");

/** Full program on the mini Active Record helper (hidden from players). */
const R = (src: string) => withHelper(MINI_RECORD, src);

const after = (n: number) => L(`after line ${n}`, `tras la línea ${n}`, `${n}行目の後`);
const pass = (n: number) => L(`pass ${n}`, `vuelta ${n}`, `${n}周目`);

// ─── JUNIOR ───────────────────────────────────────────────────────────────────

/** Junior trace: our mini permit keeps only the allowed keys. */
export const permitTrace: ExamQuestion = {
  kind: "trace",
  topic: "strong_params",
  difficulty: 1,
  prompt: L("Trace table: our mini permit", "Tabla de traza: nuestro mini permit", "トレース：ミニ版 permit"),
  brief: L(
    "Our mini version of strong params. One row per pass, after the if line. Write values as p prints them.",
    "Nuestra mini versión de strong params. Una fila por vuelta, después de la línea del if. Escribe los valores como los imprime p.",
    "ストロングパラメータのミニ版。1周ごとに1行（if の行の後）。値は p の表示どおりに。",
  ),
  code: code(
    'params = {title: "Hi", admin: true, body: "x"}',
    "allowed = [:title, :body]",
    "safe = {}",
    "params.each do |key, value|",
    "  safe[key] = value if allowed.include?(key)",
    "end",
  ),
  columns: ["key", "allowed.include?(key)", "safe"],
  rows: [
    { label: pass(1), cells: [":title", "true", '{title: "Hi"}'], given: [0] },
    { label: pass(2), cells: [":admin", "false", '{title: "Hi"}'], given: [0] },
    { label: pass(3), cells: [":body", "true", '{title: "Hi", body: "x"}'], given: [0] },
  ],
  verify: code(
    'params = {title: "Hi", admin: true, body: "x"}',
    "allowed = [:title, :body]",
    "safe = {}",
    "params.each do |key, value|",
    "  safe[key] = value if allowed.include?(key)",
    '  puts [key.inspect, allowed.include?(key), safe.inspect].join(" | ")',
    "end",
  ),
  explain: L(
    "Only keys in the allow list are copied, so :admin never reaches safe: that's what stops mass assignment. A hash keeps insertion order.",
    "Solo se copian las claves de la lista permitida, así :admin nunca llega a safe: eso frena la asignación masiva. Un hash conserva el orden.",
    "許可リストのキーだけコピーされ、:admin は safe に入らない。これが一括代入を防ぐ。ハッシュは挿入順を保つ。",
  ),
};

/** Junior trace: our mini router pairs pattern segments with path segments. */
export const routeTrace: ExamQuestion = {
  kind: "trace",
  topic: "routing",
  difficulty: 1,
  prompt: L("Trace table: our mini router", "Tabla de traza: nuestro mini router", "トレース：ミニ版ルーター"),
  brief: L(
    "Our mini version of route matching. One row per pair of segments, after the params line.",
    "Nuestra mini versión del matching de rutas. Una fila por par de segmentos, después de la línea de params.",
    "ルート照合のミニ版。セグメントの組ごとに1行（params の行の後）。",
  ),
  code: code(
    'pattern = "/posts/:post_id/comments/:id"',
    'path = "/posts/3/comments/9"',
    "params = {}",
    'pattern.split("/").zip(path.split("/")).each do |pat, seg|',
    '  params[pat.delete_prefix(":").to_sym] = seg if pat.start_with?(":")',
    "end",
  ),
  columns: ["pat", "seg", "params"],
  rows: [
    { label: pass(1), cells: ['""', '""', "{}"], given: [0] },
    { label: pass(2), cells: ['"posts"', '"posts"', "{}"], given: [0] },
    { label: pass(3), cells: ['":post_id"', '"3"', '{post_id: "3"}'], given: [0] },
    { label: pass(4), cells: ['"comments"', '"comments"', '{post_id: "3"}'], given: [0] },
    { label: pass(5), cells: ['":id"', '"9"', '{post_id: "3", id: "9"}'], given: [0] },
  ],
  verify: code(
    'pattern = "/posts/:post_id/comments/:id"',
    'path = "/posts/3/comments/9"',
    "params = {}",
    'pattern.split("/").zip(path.split("/")).each do |pat, seg|',
    '  params[pat.delete_prefix(":").to_sym] = seg if pat.start_with?(":")',
    '  puts [pat.inspect, seg.inspect, params.inspect].join(" | ")',
    "end",
  ),
  explain: L(
    'A leading "/" makes split start with "". Only :name segments become params, and their values stay strings ("3"), like in Rails.',
    'El "/" inicial hace que split empiece con "". Solo los segmentos :nombre van a params, y sus valores siguen siendo strings ("3"), como en Rails.',
    '先頭の "/" で split は "" から始まる。:名前 のセグメントだけが params になり、値は文字列（"3"）のまま。Rails と同じ。',
  ),
};

// ─── MID ──────────────────────────────────────────────────────────────────────

/** Mid trace: a before_save chain halted with throw :abort; catch returns nil. */
export const callbackChainTrace: ExamQuestion = {
  kind: "trace",
  topic: "callbacks",
  difficulty: 2,
  prompt: L("Trace table: our mini callback chain", "Tabla de traza: nuestra mini cadena de callbacks", "トレース：ミニ版コールバック連鎖"),
  brief: L(
    "Our mini version of a before_save chain. One row per title, after ok = save.(r).",
    "Nuestra mini versión de una cadena before_save. Una fila por título, después de ok = save.(r).",
    "before_save 連鎖のミニ版。タイトルごとに1行（ok = save.(r) の後）。",
  ),
  code: code(
    "log = []",
    "chain = [",
    "  ->(r) { r[:title] = r[:title].strip },",
    "  ->(r) { throw :abort if r[:title].empty? },",
    "  ->(r) { log << r[:title] },",
    "]",
    "save = ->(r) { catch(:abort) { chain.each { |cb| cb.(r) }; true } }",
    '[" a ", "  ", "b "].each do |t|',
    "  r = {title: t}",
    "  ok = save.(r)",
    "end",
  ),
  columns: ["r[:title]", "ok", "log"],
  rows: [
    { label: 't = " a "', cells: ['"a"', "true", '["a"]'], given: [0] },
    { label: 't = "  "', cells: ['""', "nil", '["a"]'] },
    { label: 't = "b "', cells: ['"b"', "true", '["a", "b"]'] },
  ],
  verify: code(
    "log = []",
    "chain = [",
    "  ->(r) { r[:title] = r[:title].strip },",
    "  ->(r) { throw :abort if r[:title].empty? },",
    "  ->(r) { log << r[:title] },",
    "]",
    "save = ->(r) { catch(:abort) { chain.each { |cb| cb.(r) }; true } }",
    '[" a ", "  ", "b "].each do |t|',
    "  r = {title: t}",
    "  ok = save.(r)",
    '  puts [r[:title].inspect, ok.inspect, log.inspect].join(" | ")',
    "end",
  ),
  explain: L(
    "throw :abort skips the rest of the chain, and catch returns the thrown value: none here, so nil, not false. The blank title never reaches log.",
    "throw :abort salta el resto de la cadena y catch devuelve el valor lanzado: aquí ninguno, así que nil, no false. El título vacío nunca llega a log.",
    "throw :abort で残りの連鎖を飛ばし、catch は投げた値を返す。値が無いので false でなく nil。空タイトルは log に入らない。",
  ),
};

/** Mid trace: a memoizing author loader that keeps re-querying a nil result. */
export const authorLoaderTrace: ExamQuestion = {
  kind: "trace",
  topic: "n_plus_one",
  difficulty: 2,
  prompt: L("Trace table: counting queries", "Tabla de traza: contando consultas", "トレース：クエリを数える"),
  brief: L(
    "Our mini version of an author loader: each find_author call is one query. One row per id, after the ||= line.",
    "Nuestra mini versión de un cargador de autores: cada find_author es una consulta. Una fila por id, después de la línea ||=.",
    "著者ローダーのミニ版。find_author 1回が1クエリ。id ごとに1行（||= の行の後）。",
  ),
  code: code(
    "queries = 0",
    'authors = {1 => "Ann", 2 => "Bo"}',
    "find_author = ->(id) { queries += 1; authors[id] }",
    "cache = {}",
    "[1, 2, 1, 3, 3].each do |id|",
    "  cache[id] ||= find_author.(id)",
    "end",
  ),
  columns: ["id", "queries", "cache"],
  rows: [
    { label: pass(1), cells: ["1", "1", '{1 => "Ann"}'], given: [0] },
    { label: pass(2), cells: ["2", "2", '{1 => "Ann", 2 => "Bo"}'], given: [0] },
    { label: pass(3), cells: ["1", "2", '{1 => "Ann", 2 => "Bo"}'], given: [0] },
    { label: pass(4), cells: ["3", "3", '{1 => "Ann", 2 => "Bo", 3 => nil}'], given: [0] },
    { label: pass(5), cells: ["3", "4", '{1 => "Ann", 2 => "Bo", 3 => nil}'], given: [0] },
  ],
  verify: code(
    "queries = 0",
    'authors = {1 => "Ann", 2 => "Bo"}',
    "find_author = ->(id) { queries += 1; authors[id] }",
    "cache = {}",
    "[1, 2, 1, 3, 3].each do |id|",
    "  cache[id] ||= find_author.(id)",
    '  puts [id, queries, cache.inspect].join(" | ")',
    "end",
  ),
  explain: L(
    "||= skips the query for a cached author, but a missing author caches nil, which is falsy: id 3 is queried again every time.",
    "||= evita la consulta si el autor está en caché, pero un autor que no existe guarda nil, que es falso: el id 3 se consulta cada vez.",
    "||= はキャッシュ済みならクエリしないが、存在しない著者は nil（偽）が入るので id 3 は毎回クエリされる。",
  ),
};

/** Mid debug: select! mutates the params and returns nil when nothing is removed. */
export const safeParamsDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "strong_params",
  difficulty: 2,
  prompt: L("Debug: our mini require/permit", "Depura: nuestro mini require/permit", "デバッグ：ミニ版 require/permit"),
  brief: L(
    "Our mini version of params.require(root).permit(*allowed): raise ParameterMissing when params[root] is missing or empty, else return a NEW hash with only the allowed keys, leaving params untouched. But safe_params({post: {title: \"Hi\"}}, :post, :title) returns nil instead of {title: \"Hi\"}.",
    "Nuestra mini versión de params.require(root).permit(*allowed): lanza ParameterMissing si params[root] falta o está vacío; si no, devuelve un hash NUEVO solo con las claves permitidas, sin tocar params. Pero safe_params({post: {title: \"Hi\"}}, :post, :title) devuelve nil en vez de {title: \"Hi\"}.",
    "params.require(root).permit(*allowed) のミニ版。params[root] が無いか空なら ParameterMissing、それ以外は許可キーだけの「新しい」ハッシュを返し params は変えない。でも safe_params({post: {title: \"Hi\"}}, :post, :title) が {title: \"Hi\"} でなく nil。",
  ),
  code: rb`class ParameterMissing < StandardError; end

def safe_params(params, root, *allowed)
  inner = params[root]
  if inner.nil? || inner.empty?
    raise ParameterMissing, "param is missing or the value is empty: #{root}"
  end
  inner.select! { |key, _| allowed.include?(key) }
end`,
  bugLine: 8,
  solution: rb`class ParameterMissing < StandardError; end

def safe_params(params, root, *allowed)
  inner = params[root]
  if inner.nil? || inner.empty?
    raise ParameterMissing, "param is missing or the value is empty: #{root}"
  end
  inner.select { |key, _| allowed.include?(key) }
end`,
  nearMiss: [
    // Returns the hash now, but still strips keys out of the caller's params.
    rb`class ParameterMissing < StandardError; end

def safe_params(params, root, *allowed)
  inner = params[root]
  if inner.nil? || inner.empty?
    raise ParameterMissing, "param is missing or the value is empty: #{root}"
  end
  inner.select! { |key, _| allowed.include?(key) }
  inner
end`,
    // Builds the hash in the allow list's order and adds nil for keys that weren't sent.
    rb`class ParameterMissing < StandardError; end

def safe_params(params, root, *allowed)
  inner = params[root]
  if inner.nil? || inner.empty?
    raise ParameterMissing, "param is missing or the value is empty: #{root}"
  end
  allowed.to_h { |key| [key, inner[key]] }
end`,
  ],
  tests: [
    { run: 'p safe_params({post: {title: "Hi"}}, :post, :title)', expect: '{title: "Hi"}' },
    { run: 'p safe_params({post: {title: "Hi", admin: true}}, :post, :title)', expect: '{title: "Hi"}' },
    { run: 'params = {post: {title: "T", admin: true}}\nsafe_params(params, :post, :title)\np params', expect: '{post: {title: "T", admin: true}}', hidden: true },
    { run: "begin\n  safe_params({post: {}}, :post, :title)\nrescue ParameterMissing => e\n  puts e.message\nend", expect: "param is missing or the value is empty: post", hidden: true },
    { run: 'p safe_params({post: {body: "b", title: "t", id: 9}}, :post, :title, :body)', expect: '{body: "b", title: "t"}', hidden: true },
    { run: 'p safe_params({post: {title: "T"}}, :post, :title, :body)', expect: '{title: "T"}', hidden: true },
  ],
  explain: L(
    "select! filters the caller's hash in place and returns nil when nothing was removed. select returns a new hash every time.",
    "select! filtra el hash del llamador en el lugar y devuelve nil si no quitó nada. select devuelve siempre un hash nuevo.",
    "select! は呼び出し元のハッシュを直接変え、何も消さないと nil を返す。select は常に新しいハッシュを返す。",
  ),
};

/** Mid debug: errors memoized with ||= are never reset between valid? calls. */
export const signupDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "validations",
  difficulty: 2,
  prompt: L("Debug: our mini validations", "Depura: nuestras mini validaciones", "デバッグ：ミニ版バリデーション"),
  brief: L(
    "Our mini version of validations: valid? checks the record again on every call, fills errors (field => messages) and returns true when there are none. But after s = Signup.new(age: 20); s.valid?; s.email = \"a@b.co\", s.valid? is still false.",
    "Nuestra mini versión de las validaciones: valid? revisa el registro de nuevo en cada llamada, llena errors (campo => mensajes) y devuelve true si no hay. Pero tras s = Signup.new(age: 20); s.valid?; s.email = \"a@b.co\", s.valid? sigue siendo false.",
    "バリデーションのミニ版。valid? は毎回検査し直し、errors（項目 => メッセージ）を埋め、無ければ true。でも s = Signup.new(age: 20); s.valid?; s.email = \"a@b.co\" の後も s.valid? が false。",
  ),
  code: rb`class Signup
  attr_accessor :email, :age
  attr_reader :errors

  def initialize(email: nil, age: nil)
    @email = email
    @age = age
  end

  def valid?
    @errors ||= Hash.new { |h, k| h[k] = [] }
    errors[:email] << "can't be blank" if email.to_s.strip.empty?
    errors[:age] << "must be 18 or more" if age.to_i < 18
    errors.empty?
  end
end`,
  bugLine: 11,
  solution: rb`class Signup
  attr_accessor :email, :age
  attr_reader :errors

  def initialize(email: nil, age: nil)
    @email = email
    @age = age
  end

  def valid?
    @errors = Hash.new { |h, k| h[k] = [] }
    errors[:email] << "can't be blank" if email.to_s.strip.empty?
    errors[:age] << "must be 18 or more" if age.to_i < 18
    errors.empty?
  end
end`,
  nearMiss: [
    // Hash.new([]) shares one default array and never stores a key: errors always looks empty.
    rb`class Signup
  attr_accessor :email, :age
  attr_reader :errors

  def initialize(email: nil, age: nil)
    @email = email
    @age = age
  end

  def valid?
    @errors = Hash.new([])
    errors[:email] << "can't be blank" if email.to_s.strip.empty?
    errors[:age] << "must be 18 or more" if age.to_i < 18
    errors.empty?
  end
end`,
    // A plain hash has no default: errors[:email] is nil and << raises.
    rb`class Signup
  attr_accessor :email, :age
  attr_reader :errors

  def initialize(email: nil, age: nil)
    @email = email
    @age = age
  end

  def valid?
    @errors = {}
    errors[:email] << "can't be blank" if email.to_s.strip.empty?
    errors[:age] << "must be 18 or more" if age.to_i < 18
    errors.empty?
  end
end`,
  ],
  tests: [
    { run: 's = Signup.new(age: 20)\ns.valid?\ns.email = "a@b.co"\np [s.valid?, s.errors]', expect: "[true, {}]" },
    { run: 'p Signup.new(email: "a@b.co", age: 30).valid?', expect: "true" },
    { run: 's = Signup.new(email: " ", age: 17)\np [s.valid?, s.errors]', expect: '[false, {email: ["can\'t be blank"], age: ["must be 18 or more"]}]', hidden: true },
    { run: 's = Signup.new(email: "x@y.z", age: 10)\ns.valid?\ns.valid?\np s.errors', expect: '{age: ["must be 18 or more"]}', hidden: true },
    { run: "s = Signup.new\ns.valid?\ns.age = 18\ns.valid?\np s.errors", expect: '{email: ["can\'t be blank"]}', hidden: true },
  ],
  explain: L(
    "||= built errors only once, so old messages piled up across calls. Assigning a fresh hash each time resets it, like errors.clear in Rails' valid?.",
    "||= creaba errors una sola vez, así los mensajes viejos se acumulaban. Asignar un hash nuevo cada vez lo reinicia, como errors.clear en valid? de Rails.",
    "||= では errors が1度しか作られず古いメッセージが溜まった。毎回新しいハッシュを入れればリセットされる（Rails の valid? の errors.clear と同じ）。",
  ),
};

// ─── SENIOR ───────────────────────────────────────────────────────────────────

/** Senior trace: lazy relations on our mini Active Record, with the query counter. */
export const lazyRelationTrace: ExamQuestion = {
  kind: "trace",
  topic: "relations",
  difficulty: 3,
  prompt: L("Trace table: lazy relations", "Tabla de traza: relaciones perezosas", "トレース：遅延リレーション"),
  brief: L(
    "Post runs on our mini version of Active Record: DB.queries counts every query, loaded? tells whether rel has fetched its rows.",
    "Post usa nuestra mini versión de Active Record: DB.queries cuenta cada consulta y loaded? dice si rel ya trajo sus filas.",
    "Post はミニ版 Active Record で動く。DB.queries はクエリ数、loaded? は rel が行を取得済みか。",
  ),
  code: code(
    "class Post < Model",
    "  attribute :title, :user_id",
    "end",
    '3.times { |i| Post.create(title: "p#{i}", user_id: i % 2) }',
    "DB.queries = 0",
    "rel = Post.where(user_id: 0)",
    "a = rel.to_a.size",
    "b = rel.to_a.size",
    'c = rel.where(title: "p2").to_a.size',
  ),
  columns: ["rel.loaded?", "DB.queries"],
  rows: [
    { label: after(6), cells: ["false", "0"], given: [0] },
    { label: after(7), cells: ["true", "1"] },
    { label: after(8), cells: ["true", "1"] },
    { label: after(9), cells: ["true", "2"] },
  ],
  verify: R(code(
    "class Post < Model",
    "  attribute :title, :user_id",
    "end",
    '3.times { |i| Post.create(title: "p#{i}", user_id: i % 2) }',
    "DB.queries = 0",
    "rel = Post.where(user_id: 0)",
    'puts [rel.loaded?, DB.queries].join(" | ")',
    "a = rel.to_a.size",
    'puts [rel.loaded?, DB.queries].join(" | ")',
    "b = rel.to_a.size",
    'puts [rel.loaded?, DB.queries].join(" | ")',
    'c = rel.where(title: "p2").to_a.size',
    'puts [rel.loaded?, DB.queries].join(" | ")',
  )),
  explain: L(
    "where only builds a relation; the query runs on to_a and the rows are kept, so b is free. rel.where(...) is a new, unloaded relation: one more query.",
    "where solo arma una relación; la consulta corre en to_a y guarda las filas: b es gratis. rel.where(...) es una relación nueva sin cargar: una consulta más.",
    "where はリレーションを作るだけ。to_a でクエリが走り行は保持されるので b は無料。rel.where(...) は未ロードの新リレーションなので1クエリ増える。",
  ),
};

const POST_HEAD = rb`class Post
  attr_accessor :title, :slug
  attr_reader :log
  CALLBACKS = [:normalize_title, :require_title, :build_slug]
  def initialize(title)
    @title = title
    @log = []
  end

  def save
    catch(:abort) do
      CALLBACKS.each { |cb| send(cb) }
      log << "INSERT #{slug}"
      return true
    end
    false
  end

  private
  def normalize_title`;

const POST_TAIL = rb`
  end

  def require_title
    throw :abort if title.empty?
  end

  def build_slug
    self.slug = title.downcase.tr(" ", "-")
  end
end`;

/** Senior debug: assigning title without self creates a local variable. */
export const slugCallbackDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "callbacks",
  difficulty: 3,
  prompt: L("Debug: our mini before_save chain", "Depura: nuestra mini cadena before_save", "デバッグ：ミニ版 before_save 連鎖"),
  brief: L(
    'Our mini version of before_save callbacks: save strips the title, aborts (returns false, logs nothing) when it is blank, builds the slug ("Hello World" → "hello-world") and logs "INSERT <slug>". But after Post.new("  Hello World ").save, slug is "--hello-world-" instead of "hello-world".',
    'Nuestra mini versión de callbacks before_save: save quita espacios al título, aborta (devuelve false, no registra nada) si queda vacío, arma el slug ("Hello World" → "hello-world") y registra "INSERT <slug>". Pero tras Post.new("  Hello World ").save, slug es "--hello-world-" en vez de "hello-world".',
    'before_save のミニ版。save はタイトルの空白を取り、空なら中断（false、記録なし）、slug を作り（"Hello World" → "hello-world"）"INSERT <slug>" を記録。でも Post.new("  Hello World ").save の後 slug が "hello-world" でなく "--hello-world-"。',
  ),
  code: `${POST_HEAD}
    title = title.to_s.strip${POST_TAIL}`,
  bugLine: 21,
  solution: `${POST_HEAD}
    self.title = title.to_s.strip${POST_TAIL}`,
  nearMiss: [
    // strip returns a new string but nothing stores it.
    `${POST_HEAD}
    @title.to_s.strip${POST_TAIL}`,
    // strip! changes the title in place, but nil has no strip!.
    `${POST_HEAD}
    title.strip!${POST_TAIL}`,
  ],
  tests: [
    { run: 'post = Post.new("  Hello World ")\npost.save\np post.slug', expect: '"hello-world"' },
    { run: 'post = Post.new("Ruby")\np [post.save, post.log]', expect: '[true, ["INSERT ruby"]]' },
    { run: 'post = Post.new("   ")\np [post.save, post.log]', expect: "[false, []]", hidden: true },
    { run: "p Post.new(nil).save", expect: "false", hidden: true },
    { run: 'post = Post.new(" A b ")\npost.save\np [post.title, post.log]', expect: '["A b", ["INSERT a-b"]]', hidden: true },
  ],
  explain: L(
    "Inside a method, title = ... makes a new local variable (nil on the right side), so the attribute never changed. self.title = calls the setter.",
    "Dentro de un método, title = ... crea una variable local (nil a la derecha), así el atributo nunca cambió. self.title = llama al setter.",
    "メソッド内の title = ... は新しいローカル変数（右辺では nil）を作るので属性は変わらない。self.title = ならセッターを呼ぶ。",
  ),
};

const FEED_POSTS = 'posts = [{title: "a", author_id: 1}, {title: "b", author_id: 2}, {title: "c", author_id: 3}, {title: "d", author_id: 1}]';

const FEED_HEAD = rb`$queries = 0
AUTHORS = {1 => "Ann", 2 => "Bo", 3 => "Cy"}

def find_authors(ids)
  $queries += 1
  AUTHORS.slice(*ids)
end

class Feed
  def initialize(posts)
    @posts = posts
  end

  def page(n, per: 2)
    rows = @posts.each_slice(per).to_a.fetch(n - 1, [])
    authors = load_authors(rows)
    rows.map { |post| "#{post[:title]} by #{authors[post[:author_id]]}" }
  end

  private

  def load_authors(rows)`;

const FEED_TAIL = rb`
  end
end`;

/** Senior paper debug: a memoized batch loader serves page 1's authors to every page. */
export const feedLoaderDebug: ExamQuestion = {
  kind: "debug",
  mode: "paper",
  topic: "n_plus_one",
  difficulty: 3,
  prompt: L("Debug: the feed's author loader", "Depura: el cargador de autores del feed", "デバッグ：フィードの著者ローダー"),
  brief: L(
    'Our mini version of preloading: Feed#page(n) shows "<title> by <author>" for page n, loading that page\'s authors in exactly one find_authors query ($queries counts them). But after feed.page(1), feed.page(2) returns ["c by ", "d by Ann"] instead of ["c by Cy", "d by Ann"].',
    'Nuestra mini versión de la precarga: Feed#page(n) muestra "<title> by <autor>" de la página n y carga sus autores en una sola consulta find_authors ($queries las cuenta). Pero tras feed.page(1), feed.page(2) devuelve ["c by ", "d by Ann"] en vez de ["c by Cy", "d by Ann"].',
    'プリロードのミニ版。Feed#page(n) は n ページ目を "<title> by <著者>" で返し、そのページの著者を find_authors 1回で読む（$queries が数える）。でも feed.page(1) の後 feed.page(2) が ["c by Cy", "d by Ann"] でなく ["c by ", "d by Ann"]。',
  ),
  code: `${FEED_HEAD}
    @authors ||= find_authors(rows.map { |post| post[:author_id] }.uniq)${FEED_TAIL}`,
  bugLine: 23,
  solution: `${FEED_HEAD}
    find_authors(rows.map { |post| post[:author_id] }.uniq)${FEED_TAIL}`,
  nearMiss: [
    // Correct names, but one query per post: the N+1 is back.
    `${FEED_HEAD}
    rows.to_h { |post| [post[:author_id], find_authors([post[:author_id]])[post[:author_id]]] }${FEED_TAIL}`,
    // Loads every author of the feed once, not the page's own.
    `${FEED_HEAD}
    @authors ||= find_authors(@posts.map { |post| post[:author_id] }.uniq)${FEED_TAIL}`,
  ],
  tests: [
    { run: `${FEED_POSTS}\nfeed = Feed.new(posts)\nfeed.page(1)\np feed.page(2)`, expect: '["c by Cy", "d by Ann"]' },
    { run: `${FEED_POSTS}\n$queries = 0\nfeed = Feed.new(posts)\np [feed.page(1), $queries]`, expect: '[["a by Ann", "b by Bo"], 1]' },
    { run: `${FEED_POSTS}\n$queries = 0\nfeed = Feed.new(posts)\nfeed.page(1)\nfeed.page(2)\np $queries`, expect: "2", hidden: true },
    { run: `${FEED_POSTS}\nfeed = Feed.new(posts)\nfeed.page(2)\np feed.page(1)`, expect: '["a by Ann", "b by Bo"]', hidden: true },
    { run: `${FEED_POSTS}\n$queries = 0\nfeed = Feed.new(posts)\np [feed.page(1, per: 4).size, $queries]`, expect: "[4, 1]", hidden: true },
    { run: `${FEED_POSTS}\np Feed.new(posts).page(3)`, expect: "[]", hidden: true },
  ],
  explain: L(
    "@authors ||= kept page 1's batch forever, so page 2 looked up Cy in it and got nil. Loading the page's ids each call is still one query per page.",
    "@authors ||= guardaba siempre el lote de la página 1: la página 2 buscaba a Cy ahí y obtenía nil. Cargar los ids de cada página sigue costando una consulta.",
    "@authors ||= で1ページ目の結果が残り続け、2ページ目で Cy が nil に。毎回そのページの id を読んでも1ページ1クエリ。",
  ),
};

const CACHE_HEAD = rb`class MiniCache
  def initialize(clock)
    @clock = clock
    @values = {}
    @expires = {}
  end

  def fetch(key, expires_in: nil)
    expired = @expires[key] && @expires[key] <= @clock.call
    value = @values[key] unless expired`;

const CACHE_TAIL = rb`
    value = yield
    @values[key] = value
    @expires[key] = expires_in && @clock.call + expires_in
    value
  end
end`;

const CLOCK = "now = 0\ncache = MiniCache.new(-> { now })";

/** Senior paper debug: a cache hit tested by truthiness misses cached nil and false. */
export const cacheDebug: ExamQuestion = {
  kind: "debug",
  mode: "paper",
  topic: "caching",
  difficulty: 3,
  prompt: L("Debug: our mini cache fetch", "Depura: nuestro mini cache fetch", "デバッグ：ミニ版 cache fetch"),
  brief: L(
    "Our mini version of Rails.cache.fetch with expires_in: the block runs only on a miss or once the entry expired (expires_at <= now); nil and false are cached values like any other. But fetching \"flag\" twice with a block that returns false runs the block twice.",
    "Nuestra mini versión de Rails.cache.fetch con expires_in: el bloque corre solo si falta la entrada o ya venció (expires_at <= now); nil y false se guardan como cualquier valor. Pero al pedir \"flag\" dos veces con un bloque que devuelve false, el bloque corre dos veces.",
    "expires_in 付き Rails.cache.fetch のミニ版。ブロックは未保存か期限切れ（expires_at <= now）のときだけ実行。nil と false も普通の値として保存。でも false を返すブロックで \"flag\" を2回取ると2回実行される。",
  ),
  code: `${CACHE_HEAD}
    return value if value${CACHE_TAIL}`,
  bugLine: 11,
  solution: `${CACHE_HEAD}
    return value if !expired && @values.key?(key)${CACHE_TAIL}`,
  nearMiss: [
    // Handles nil and false, but never expires anything.
    `${CACHE_HEAD}
    return @values[key] if @values.key?(key)${CACHE_TAIL}`,
    // false is kept now, but a cached nil still looks like a miss.
    `${CACHE_HEAD}
    return value unless value.nil?${CACHE_TAIL}`,
  ],
  tests: [
    { run: `${CLOCK}\ncalls = 0\n2.times { cache.fetch("flag") { calls += 1; false } }\np calls`, expect: "1" },
    { run: `${CLOCK}\np [cache.fetch("a") { 1 }, cache.fetch("a") { 2 }]`, expect: "[1, 1]" },
    { run: `${CLOCK}\ncache.fetch("t", expires_in: 10) { "old" }\nnow = 10\np cache.fetch("t") { "new" }`, expect: '"new"', hidden: true },
    { run: `${CLOCK}\ncache.fetch("t", expires_in: 10) { "old" }\nnow = 9\np cache.fetch("t") { "new" }`, expect: '"old"', hidden: true },
    { run: `${CLOCK}\ncalls = 0\n3.times { cache.fetch("none") { calls += 1; nil } }\np calls`, expect: "1", hidden: true },
    { run: `${CLOCK}\ncache.fetch("n", expires_in: 5) { nil }\nnow = 5\np cache.fetch("n") { :fresh }`, expect: ":fresh", hidden: true },
  ],
  explain: L(
    "if value treats a cached false or nil as a miss. A hit is \"the key is stored and not expired\": check key?, never the value's truthiness.",
    "if value toma un false o nil guardado como fallo. Un acierto es \"la clave está y no venció\": revisa key?, nunca si el valor es verdadero.",
    "if value だと保存済みの false や nil がミス扱い。ヒットは「キーがあり期限内」。値の真偽でなく key? で調べる。",
  ),
};

export const juniorTraceDebug: ExamQuestion[] = [permitTrace, routeTrace];
export const midTraceDebug: ExamQuestion[] = [callbackChainTrace, authorLoaderTrace, safeParamsDebug, signupDebug];
export const seniorTraceDebug: ExamQuestion[] = [lazyRelationTrace, slugCallbackDebug, feedLoaderDebug, cacheDebug];
