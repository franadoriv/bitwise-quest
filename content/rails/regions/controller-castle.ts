import type { LessonDef, RegionDef } from "../../../lib/content/types.ts";
import { L, say } from "../../rust/helpers.ts";
import { MINI_CONTROLLER, withHelper } from "../mini.ts";

// REGION 3 · CONTROLLER CASTLE  (routing, strong parameters, filters and views, jobs, cache and security)
// Rails can't run in the sandbox: lessons follow one request through plain-Ruby mini versions of each
// mechanism (verified on Ruby 3.4.7). Rails API facts are conceptual questions, explained from the Rails
// Guides (Routing, Action Controller Overview, Layouts and Rendering, Active Job, Caching, Security).
// Spec: docs/research/rails-curriculum.md, region 3.

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");

// ─── shared snippets (shown in dialogs, prepended to checks) ──────────────────
const RECOGNIZE = String.raw`def recognize(verb, path)
  ROUTES.each do |v, pattern, to|
    next unless v == verb
    regex = Regexp.new("\\A" + pattern.gsub(/:(\w+)/, '(?<\1>[^/]+)') + "\\z")
    m = regex.match(path)
    return [to, m.named_captures.transform_keys(&:to_sym)] if m
  end
  nil
end`;
const ROUTER = `ROUTES = [["GET", "/posts", "posts#index"], ["GET", "/posts/:id", "posts#show"]]\n${RECOGNIZE}`;
const WRONG_ORDER_ROUTER = `ROUTES = [["GET", "/posts/:id", "posts#show"], ["GET", "/posts/new", "posts#new"]]\n${RECOGNIZE}`;
const RIGHT_ORDER_ROUTER = `ROUTES = [["GET", "/posts/new", "posts#new"], ["GET", "/posts/:id", "posts#show"]]\n${RECOGNIZE}`;

const RESOURCES = String.raw`def resources(name)
  [["GET", "/#{name}", "index"], ["GET", "/#{name}/new", "new"],
   ["POST", "/#{name}", "create"], ["GET", "/#{name}/:id", "show"],
   ["GET", "/#{name}/:id/edit", "edit"], ["PATCH", "/#{name}/:id", "update"],
   ["DELETE", "/#{name}/:id", "destroy"]]
end`;

const PARAMS = String.raw`class ParameterMissing < KeyError; end
class Params
  def initialize(h) = @h = h
  def require(key)
    value = @h[key]
    raise ParameterMissing, "param is missing or the value is empty or invalid: #{key}" if value.nil? || value.empty?
    Params.new(value)
  end
  def permit(*keys) = @h.slice(*keys)
end`;

const POSTS_CONTROLLER = String.raw`class PostsController < Controller
  before_action :require_login, only: [:edit]
  def require_login = (redirect_to "/login" unless @user)
  def show = render("post")
  def edit = render("form")
end`;

const PROCESS = String.raw`def process(action)
  self.class.filters.each do |m, only|
    next if only && !only.include?(action)
    send(m)
    return @response if @response
  end
  send(action)
  @response
end`;

const JOBS = String.raw`QUEUE = []
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
klass.perform_now(*args)`;

const CACHE = String.raw`class Cache
  def initialize = @store = {}
  def fetch(key)
    return @store[key] if @store.key?(key)
    @store[key] = yield
  end
end
cache = Cache.new
2.times { puts cache.fetch("stats") { puts "computing"; 42 } }`;

const NIL_CACHE = String.raw`store = {}
fetch = ->(key, &blk) { store[key] ||= blk.call }
2.times { p fetch.("user") { puts "query"; nil } }`;

const QUOTE = String.raw`def quote(v) = "'" + v.to_s.gsub("'", "''") + "'"
def where(sql, *binds) = binds.reduce(sql) { |s, b| s.sub("?", quote(b)) }`;

const SQL_DEMO = String.raw`${QUOTE}
input = "x' OR '1'='1"
puts "SELECT * FROM users WHERE name = '#{input}'"
puts where("SELECT * FROM users WHERE name = ?", input)`;

const ERB_ESCAPE = String.raw`require "erb"
include ERB::Util
title = "<b>Hi</b>"
puts ERB.new("<h1><%= h(title) %></h1>").result(binding)
puts ERB.new("<h1><%= title %></h1>").result(binding)`;

// ─── 3.1 The gate map: routing ─────────────────────────────────────────────
const routing: LessonDef = {
  slug: "routing",
  title: L("The gate map", "El mapa de la puerta", "門の地図"),
  concept: "routing",
  mode: "lesson",
  xp: 70,
  enemy: "ghost",
  enemyName: L("LOST ROUTE", "RUTA PERDIDA", "まいごルート"),
  beats: [
    say(L(
      "Welcome to Controller Castle! A REQUEST knocks at the gate. First stop: the ROUTER, which reads the verb and the path.",
      "¡Bienvenido al Castillo Controller! Una PETICIÓN toca a la puerta. Primera parada: el ROUTER, que lee el verbo y la ruta.",
      "コントローラー城へようこそ！リクエストが門をたたく。最初は「ルーター」。HTTP メソッドとパスを読むよ。",
    )),
    say(L(
      "GET /posts/42 goes to posts#show: PostsController, method show. Here is our mini router: a list of routes and a matcher.",
      "GET /posts/42 va a posts#show: PostsController, método show. Este es nuestro mini router: una lista de rutas y un buscador.",
      "GET /posts/42 は posts#show へ。PostsController の show メソッドだよ。これがミニ版ルーター。",
    ), { code: ROUTER }),
    {
      kind: "act",
      prompt: L("Let the messenger in and follow the map", "Deja entrar al mensajero y sigue el mapa", "使者を入れて、地図をたどろう"),
      steps: [
        { label: L("KNOCK", "TOCAR", "ノック"), line: 'request = ["GET", "/posts/42"]',
          effects: [{ t: "enter", actor: "ally" }, { t: "item", kind: "scroll", holder: "ally" }, { t: "say", actor: "ally", text: L("GET /posts/42!", "¡GET /posts/42!", "GET /posts/42！") }] },
        { label: L("READ MAP", "LEER MAPA", "地図を読む"), line: "to, params = recognize(*request)",
          effects: [{ t: "give", to: "hero" }, { t: "say", actor: "hero", text: L("posts#show!", "¡posts#show!", "posts#show！") }] },
        { label: L("SHOW ACTION", "VER ACCIÓN", "行き先を見る"), line: "puts to", effects: [{ t: "print", text: "posts#show" }], output: "posts#show" },
        { label: L("SHOW PARAMS", "VER PARAMS", "params を見る"), line: "p params",
          effects: [{ t: "tag", actor: "ally", text: "id", value: '"42"' }, { t: "print", text: '{id: "42"}' }], output: '{id: "42"}' },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'p recognize("GET", "/posts/42")',
      options: ['["posts#show", {id: "42"}]', '["posts#show", {id: 42}]', "nil"],
      answer: 0,
      output: '["posts#show", {id: "42"}]',
      check: { compiles: true, stdout: '["posts#show", {id: "42"}]', program: `${ROUTER}\np recognize("GET", "/posts/42")` },
      explain: L(
        "The :id segment captures text from the path, so it is the STRING \"42\". In Rails, params values from the URL are strings too.",
        "El segmento :id captura texto de la ruta, así que es el STRING \"42\". En Rails, los params de la URL también son strings.",
        ":id はパスの文字をそのまま取るので文字列 \"42\" になる。Rails でも URL の params は文字列だよ。",
      ),
      win: [{ t: "print", text: '["posts#show", {id: "42"}]' }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'p recognize("GET", "/posts")',
      options: ['["posts#index", {}]', '["posts#show", {id: ""}]', "nil"],
      answer: 0,
      output: '["posts#index", {}]',
      check: { compiles: true, stdout: '["posts#index", {}]', program: `${ROUTER}\np recognize("GET", "/posts")` },
      explain: L(
        "/posts matches the first route exactly. It has no :segments, so the params hash is empty.",
        "/posts coincide justo con la primera ruta. No tiene :segmentos, así que el hash de params está vacío.",
        "/posts は最初のルートにぴったり一致。:id のような部分がないので params は空だよ。",
      ),
    },
    say(L(
      "No route for that verb and path? The router gives up. Rails answers 404 Not Found; our mini version returns nil.",
      "¿No hay ruta para ese verbo y ruta? El router se rinde. Rails responde 404 Not Found; nuestra mini versión devuelve nil.",
      "メソッドとパスに合うルートがない？ルーターはあきらめる。Rails は 404、ミニ版は nil を返すよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: 'p recognize("DELETE", "/posts/42")\np recognize("GET", "/posts/42/edit")',
      options: ["nil / nil", '["posts#show", {id: "42"}] / nil', 'nil / ["posts#show", {id: "42/edit"}]'],
      answer: 0,
      output: "nil\nnil",
      check: { compiles: true, stdout: "nil\nnil", program: `${ROUTER}\np recognize("DELETE", "/posts/42")\np recognize("GET", "/posts/42/edit")` },
      explain: L(
        "No route has DELETE, and the patterns are anchored (\\A...\\z), so /posts/42/edit doesn't fit /posts/:id. A segment never holds a /.",
        "Ninguna ruta tiene DELETE, y los patrones están anclados (\\A...\\z): /posts/42/edit no encaja en /posts/:id. Un segmento no lleva /.",
        "DELETE のルートはなく、パターンは \\A...\\z で固定。/posts/42/edit は /posts/:id に合わない。",
      ),
      setup: [{ t: "enter", actor: "ally" }, { t: "item", kind: "scroll", holder: "ally" }],
      win: [{ t: "shake" }, { t: "banner", text: L("404", "404", "404") }],
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: 'params = {id: "42"}\np params[:id].to_i + 1\np params[:id] + 1',
      options: [
        L("43, then a TypeError", "43 y luego un TypeError", "43 のあと TypeError"),
        "43 / 43",
        '43 / "421"',
      ],
      answer: 0,
      check: { compiles: true, throws: "no implicit conversion of Integer into String" },
      explain: L(
        "Params are strings. to_i turns \"42\" into 42; adding 1 to a String raises TypeError: no implicit conversion of Integer into String.",
        "Los params son strings. to_i convierte \"42\" en 42; sumar 1 a un String lanza TypeError: no implicit conversion of Integer into String.",
        "params は文字列。to_i で 42 になる。文字列に 1 を足すと TypeError になるよ。",
      ),
      win: [{ t: "print", text: "43" }, { t: "shake" }],
    },
    say(L(
      "Writing 7 routes per model is boring. resources :posts writes the REST set for you: index, new, create, show, edit, update, destroy.",
      "Escribir 7 rutas por modelo aburre. resources :posts escribe el set REST: index, new, create, show, edit, update, destroy.",
      "モデルごとに7本書くのは大変。resources :posts が REST の7本をまとめて作るよ。",
    ), { code: RESOURCES }),
    {
      kind: "predict",
      prompt: PRINT,
      code: "puts resources(:posts).size\nputs resources(:posts).count { |verb, _, _| verb == \"GET\" }",
      options: ["7 / 4", "7 / 7", "4 / 3"],
      answer: 0,
      output: "7\n4",
      check: { compiles: true, stdout: "7\n4", program: `${RESOURCES}\nputs resources(:posts).size\nputs resources(:posts).count { |verb, _, _| verb == "GET" }` },
      explain: L(
        "Seven routes; four only read (index, new, show, edit use GET). create, update and destroy change data with POST, PATCH and DELETE.",
        "Siete rutas; cuatro solo leen (index, new, show, edit usan GET). create, update y destroy cambian datos con POST, PATCH y DELETE.",
        "7本のうち GET は4本（index・new・show・edit）。create・update・destroy は POST・PATCH・DELETE。",
      ),
      win: [{ t: "print", text: "7" }, { t: "print", text: "4" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'p resources(:posts).select { |_, path, _| path == "/posts/:id" }.map(&:last)',
      options: ['["show", "update", "destroy"]', '["show"]', '["show", "edit"]'],
      answer: 0,
      output: '["show", "update", "destroy"]',
      check: { compiles: true, stdout: '["show", "update", "destroy"]', program: `${RESOURCES}\np resources(:posts).select { |_, path, _| path == "/posts/:id" }.map(&:last)` },
      explain: L(
        "Same path, three verbs: GET shows, PATCH updates, DELETE destroys. The verb picks the action, which is why REST needs both.",
        "Misma ruta, tres verbos: GET muestra, PATCH actualiza, DELETE destruye. El verbo elige la acción; por eso REST usa ambos.",
        "同じパスに3つのメソッド。GET は表示、PATCH は更新、DELETE は削除。メソッドがアクションを決めるよ。",
      ),
    },
    {
      kind: "pick",
      prompt: L("In Rails, which action gets it?", "En Rails, ¿qué acción la recibe?", "Rails ではどのアクション？"),
      code: "# config/routes.rb\nresources :photos\n# PATCH /photos/17  ->  photos#___",
      options: ["update", "edit", "show"],
      answer: 0,
      explain: L(
        "Routing guide: PATCH/PUT /photos/:id goes to update. edit (GET /photos/:id/edit) only shows the form.",
        "Guía de Routing: PATCH/PUT /photos/:id va a update. edit (GET /photos/:id/edit) solo muestra el formulario.",
        "Routing ガイド：PATCH/PUT /photos/:id は update へ。edit（GET .../edit）はフォーム表示だけ。",
      ),
    },
    say(L(
      "Only need some of the seven? Rails takes only: [...]. Our mini version can learn it too, with an array intersection.",
      "¿Solo necesitas algunas de las siete? Rails acepta only: [...]. Nuestra mini versión también, con una intersección de arrays.",
      "7本のうち一部だけ？Rails は only: [...] を使う。ミニ版は配列の共通部分でまねできるよ。",
    )),
    {
      kind: "type",
      prompt: L("Keep only index and show", "Deja solo index y show", "index と show だけ残そう"),
      code: "ACTIONS = %i[index new create show edit update destroy]\ndef resources(name, only: ACTIONS) = ACTIONS & only\np resources(:posts, ___: [:index, :show])",
      answer: "only",
      check: { compiles: true, stdout: "[:index, :show]" },
      explain: L(
        "Same keyword as Rails: resources :posts, only: [:index, :show] draws just those two routes. except: does the opposite.",
        "La misma palabra que en Rails: resources :posts, only: [:index, :show] dibuja solo esas dos rutas. except: hace lo contrario.",
        "Rails と同じキーワード。only: [:index, :show] でその2本だけ。except: は逆だよ。",
      ),
      win: [{ t: "print", text: "[:index, :show]" }],
    },
    say(L(
      "Careful: the FIRST matching route wins. Put /posts/:id before /posts/new and the word new looks like an id!",
      "Cuidado: gana la PRIMERA ruta que coincide. Si /posts/:id va antes que /posts/new, ¡la palabra new parece un id!",
      "注意：最初に合ったルートが勝つ。/posts/:id を /posts/new より前に置くと new が id に見えちゃう！",
    )),
    {
      kind: "run",
      prompt: L("Fix the map so /posts/new reaches posts#new", "Arregla el mapa para que /posts/new llegue a posts#new", "/posts/new が posts#new に届くよう直そう"),
      starter: `${WRONG_ORDER_ROUTER}\np recognize("GET", "/posts/new")\n`,
      solution: `${RIGHT_ORDER_ROUTER}\np recognize("GET", "/posts/new")\n`,
      expect: '["posts#new", {}]',
      fallback: [String.raw`\[\s*\[\s*"GET",\s*"/posts/new"`],
      explain: L(
        "Move the /posts/new route above /posts/:id. Rails' resources already orders them this way for you.",
        "Sube la ruta /posts/new por encima de /posts/:id. resources de Rails ya las ordena así por ti.",
        "/posts/new のルートを /posts/:id より上へ。Rails の resources は最初からこの順だよ。",
      ),
    },
  ],
};

// ─── 3.2 The shield of permitted gifts: strong parameters ──────────────────
const strongParams: LessonDef = {
  slug: "strong-params",
  title: L("The permitted shield", "El escudo permitido", "許可の盾"),
  concept: "strong-params",
  mode: "lesson",
  xp: 75,
  enemy: "rails/mass-burglar",
  enemyName: L("MASS BURGLAR", "LADRÓN MASIVO", "一括ドロボウ"),
  beats: [
    say(L(
      "The messenger carries PARAMS: a hash of what the form sent. But a burglar can slip in extra keys, like admin: true.",
      "El mensajero trae PARAMS: un hash con lo que envió el formulario. Pero un ladrón puede colar claves extra, como admin: true.",
      "使者は params を運ぶ。フォームの中身のハッシュだよ。でもドロボウが admin: true のような余計なキーを混ぜてくる。",
    )),
    {
      kind: "act",
      prompt: L("Build a user straight from the form, then filter", "Crea un usuario directo del formulario y luego filtra", "フォームからそのまま作り、次にしぼろう"),
      steps: [
        { label: L("MODEL", "MODELO", "モデル"), line: "User = Struct.new(:name, :admin, keyword_init: true)",
          effects: [{ t: "tag", actor: "hero", text: "User" }] },
        { label: L("FORM ARRIVES", "LLEGA FORM", "フォーム到着"), line: 'incoming = {name: "Eve", admin: true}',
          effects: [{ t: "enter", actor: "enemy" }, { t: "item", kind: "gem", holder: "enemy" }, { t: "say", actor: "enemy", text: L("admin: true, hehe", "admin: true, je", "admin: true だよ") }] },
        { label: L("TRUST ALL", "CONFIAR", "全部信じる"), line: "p User.new(**incoming).admin",
          effects: [{ t: "give", to: "hero" }, { t: "shake" }, { t: "banner", text: L("EVE IS ADMIN?!", "¿EVE ES ADMIN?", "Eve が管理者！？") }, { t: "print", text: "true" }], output: "true" },
        { label: L("ONLY name", "SOLO name", "name だけ"), line: "p User.new(**incoming.slice(:name)).admin",
          effects: [{ t: "item", kind: "shield", holder: "hero" }, { t: "drop" }, { t: "print", text: "nil" }], output: "nil" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'User = Struct.new(:name, :admin, keyword_init: true)\nincoming = {name: "Eve", admin: true}\np User.new(**incoming).admin\np User.new(**incoming.slice(:name)).admin',
      options: ["true / nil", "nil / nil", "true / true"],
      answer: 0,
      output: "true\nnil",
      check: { compiles: true, stdout: "true\nnil" },
      explain: L(
        "Passing everything sets every key: that's MASS ASSIGNMENT. slice(:name) keeps only name, so admin stays nil.",
        "Pasar todo asigna cada clave: eso es MASS ASSIGNMENT. slice(:name) deja solo name, así que admin queda en nil.",
        "全部渡すと全キーが入る。これが「一括代入」。slice(:name) なら name だけで admin は nil。",
      ),
      win: [{ t: "print", text: "true" }, { t: "print", text: "nil" }],
    },
    say(L(
      "Rails' guard is STRONG PARAMETERS: require the bag, then permit only the listed keys. Our mini version:",
      "La defensa de Rails son los STRONG PARAMETERS: exigir la bolsa y permitir solo las claves de la lista. Nuestra mini versión:",
      "Rails の守りは「ストロングパラメータ」。袋を require して、許可したキーだけ permit。ミニ版はこれ：",
    ), { code: PARAMS }),
    {
      kind: "predict",
      prompt: PRINT,
      code: 'params = Params.new({"post" => {"title" => "Hi", "admin" => true}})\np params.require("post").permit("title", "body")',
      options: ['{"title" => "Hi"}', '{"title" => "Hi", "admin" => true}', '{"title" => "Hi", "body" => nil}'],
      answer: 0,
      output: '{"title" => "Hi"}',
      check: { compiles: true, stdout: '{"title" => "Hi"}', program: `${PARAMS}\nparams = Params.new({"post" => {"title" => "Hi", "admin" => true}})\np params.require("post").permit("title", "body")` },
      explain: L(
        "permit keeps only listed keys that are present: admin was never permitted and body wasn't sent, so only title passes.",
        "permit deja solo las claves listadas que llegaron: admin no está permitido y body no vino, así que solo pasa title.",
        "permit はリストにあって届いたキーだけ残す。admin は不許可、body は来ていないので title だけ。",
      ),
      setup: [{ t: "enter", actor: "enemy" }, { t: "item", kind: "shield", holder: "hero" }],
      win: [{ t: "attack", from: "hero", to: "enemy" }, { t: "print", text: '{"title" => "Hi"}' }],
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: 'Params.new({}).require("post")',
      options: [
        L("ParameterMissing is raised", "Se lanza ParameterMissing", "ParameterMissing が発生"),
        L("It returns nil", "Devuelve nil", "nil を返す"),
        L("It returns an empty Params", "Devuelve un Params vacío", "空の Params を返す"),
      ],
      answer: 0,
      check: { compiles: true, throws: "param is missing or the value is empty or invalid: post", program: `${PARAMS}\nParams.new({}).require("post")` },
      explain: L(
        "No post key, so require raises. In Rails it's ActionController::ParameterMissing and the app answers 400 Bad Request.",
        "No hay clave post, así que require lanza. En Rails es ActionController::ParameterMissing y la app responde 400 Bad Request.",
        "post がないので require が例外を出す。Rails では ParameterMissing で 400 Bad Request になるよ。",
      ),
      win: [{ t: "shake" }, { t: "banner", text: L("400", "400", "400") }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'begin\n  Params.new({"post" => {}}).require("post")\nrescue KeyError => e\n  puts "#{e.class}: #{e.message}"\nend',
      options: [
        "ParameterMissing: param is missing or the value is empty or invalid: post",
        "KeyError: key not found: \"post\"",
        L("Nothing: {} counts as present", "Nada: {} cuenta como presente", "何も出ない：{} はあるとみなす"),
      ],
      answer: 0,
      output: "ParameterMissing: param is missing or the value is empty or invalid: post",
      check: { compiles: true, stdout: "ParameterMissing: param is missing or the value is empty or invalid: post", program: `${PARAMS}\nbegin\n  Params.new({"post" => {}}).require("post")\nrescue KeyError => e\n  puts "#{e.class}: #{e.message}"\nend` },
      explain: L(
        "An empty bag counts as missing. ParameterMissing is a subclass of KeyError, so rescue KeyError catches it, as in Rails.",
        "Una bolsa vacía cuenta como faltante. ParameterMissing es subclase de KeyError, así que rescue KeyError la atrapa, como en Rails.",
        "空の袋は「ない」と同じ。ParameterMissing は KeyError のサブクラスなので rescue KeyError で捕まるよ。",
      ),
    },
    say(L(
      "In real Rails, a key you didn't permit is dropped quietly and logged. Nothing crashes: it just never reaches the model.",
      "En Rails real, una clave que no permitiste se descarta en silencio y se registra en el log. Nada falla: no llega al modelo.",
      "本物の Rails では、許可していないキーは静かに捨てられログに残る。落ちないけど、モデルには届かない。",
    )),
    {
      kind: "predict",
      prompt: L("In Rails, what happens to admin?", "En Rails, ¿qué pasa con admin?", "Rails では admin はどうなる？"),
      code: '# params: {user: {name: "Eve", admin: "1"}}\nparams.require(:user).permit(:name)',
      options: [
        L("Dropped (and logged)", "Se descarta (y se registra)", "捨てられる（ログに残る）"),
        L("It raises an error", "Lanza un error", "エラーになる"),
        L("Kept along with name", "Se queda junto a name", "name と一緒に残る"),
      ],
      answer: 0,
      explain: L(
        "Action Controller guide: unpermitted keys are filtered out and logged by default. Set action_on_unpermitted_parameters = :raise to make them fail.",
        "Guía de Action Controller: las claves no permitidas se filtran y se registran. Con action_on_unpermitted_parameters = :raise fallan.",
        "Action Controller ガイド：不許可キーは既定で除外されログに出る。:raise 設定で例外にできる。",
      ),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'params = {"id" => "5"}\np params[:id]\np params["id"]',
      options: ['nil / "5"', '"5" / "5"', '"5" / nil'],
      answer: 0,
      output: 'nil\n"5"',
      check: { compiles: true, stdout: 'nil\n"5"' },
      explain: L(
        "In a plain Hash, :id and \"id\" are different keys. Rails params are ActionController::Parameters and accept both.",
        "En un Hash normal, :id y \"id\" son claves distintas. Los params de Rails son ActionController::Parameters y aceptan ambas.",
        "普通の Hash では :id と \"id\" は別のキー。Rails の params はどちらでも読めるよ。",
      ),
    },
    {
      kind: "type",
      prompt: L("Rails 8: require and permit in one call", "Rails 8: require y permit en una llamada", "Rails 8：require と permit を一度に"),
      code: "def post_params\n  params.___(post: [:title, :body])\nend",
      answer: "expect",
      explain: L(
        "Rails 8 adds params.expect(post: [:title, :body]): it requires post, permits those keys and rejects wrong shapes with a 400.",
        "Rails 8 suma params.expect(post: [:title, :body]): exige post, permite esas claves y rechaza formas raras con un 400.",
        "Rails 8 の params.expect は post を必須にし、キーを許可し、形が違えば 400 にするよ。",
      ),
    },
    {
      kind: "run",
      prompt: L("The shield lets the burglar through. Fix permit", "El escudo deja pasar al ladrón. Arregla permit", "盾がドロボウを通してる。permit を直そう"),
      starter: 'class Params\n  def initialize(h) = @h = h\n  def require(key) = Params.new(@h.fetch(key))\n  def permit(*keys) = @h.reject { |k, _| keys.include?(k) }\nend\nparams = Params.new({"post" => {"title" => "Hi", "admin" => true}})\np params.require("post").permit("title", "body")\n',
      solution: 'class Params\n  def initialize(h) = @h = h\n  def require(key) = Params.new(@h.fetch(key))\n  def permit(*keys) = @h.slice(*keys)\nend\nparams = Params.new({"post" => {"title" => "Hi", "admin" => true}})\np params.require("post").permit("title", "body")\n',
      expect: '{"title" => "Hi"}',
      fallback: [String.raw`\.slice\(\s*\*keys\s*\)`, String.raw`(select|filter)\s*\{\s*\|\s*k\s*,\s*_?\w*\s*\|\s*keys\.include\?\(\s*k\s*\)`],
      explain: L(
        "reject throws away the permitted keys and keeps the rest. slice(*keys) (or select) keeps ONLY the permitted ones.",
        "reject tira las claves permitidas y deja el resto. slice(*keys) (o select) deja SOLO las permitidas.",
        "reject は許可キーを捨てて残りを通す。slice(*keys)（か select）で許可キーだけ残そう。",
      ),
    },
  ],
};

// ─── 3.3 Guards and scribes: filters and views ─────────────────────────────
const filtersAndViews: LessonDef = {
  slug: "filters-and-views",
  title: L("Guards and scribes", "Guardias y escribas", "門番と書記"),
  concept: "filters-and-views",
  mode: "lesson",
  xp: 75,
  enemy: "slime",
  enemyName: L("SCRIPT SLIME", "SLIME SCRIPT", "スクリプトスライム"),
  beats: [
    say(L(
      "Past the gate, GUARDS stand before the actions: before_action filters. If a guard redirects, the action never runs.",
      "Tras la puerta, hay GUARDIAS antes de las acciones: los filtros before_action. Si un guardia redirige, la acción no corre.",
      "門の先、アクションの前に門番がいる。before_action フィルターだ。門番がリダイレクトしたらアクションは動かない。",
    )),
    say(L(
      "Our mini Controller (hidden from now on) runs the filters in order and stops at the first response:",
      "Nuestro mini Controller (oculto desde ahora) corre los filtros en orden y se detiene en la primera respuesta:",
      "ミニ版 Controller（ここからは隠すよ）はフィルターを順に動かし、最初のレスポンスで止まる：",
    ), { code: PROCESS }),
    {
      kind: "act",
      prompt: L("Post a guard, then send a visitor with no badge", "Pon un guardia y manda un visitante sin credencial", "門番を置き、バッジなしの客を送ろう"),
      steps: [
        { label: L("CONTROLLER", "CONTROLLER", "コントローラー"), line: "class PostsController < Controller", effects: [{ t: "tag", actor: "hero", text: "PostsController" }] },
        { label: L("POST GUARD", "PONER GUARDIA", "門番を置く"), line: "  before_action :require_login, only: [:edit]", effects: [{ t: "item", kind: "shield", holder: "hero" }] },
        { label: L("GUARD RULE", "REGLA", "門番のルール"), line: '  def require_login = (redirect_to "/login" unless @user)' },
        { label: L("ACTION", "ACCIÓN", "アクション"), line: '  def edit = render("form")\nend' },
        { label: L("NO BADGE", "SIN CREDENCIAL", "バッジなし"), line: "puts PostsController.new.process(:edit)",
          effects: [{ t: "enter", actor: "ally" }, { t: "shake" }, { t: "banner", text: L("302 /login", "302 /login", "302 /login") }, { t: "exit", actor: "ally" }, { t: "print", text: "302 /login" }], output: "302 /login" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: `${POSTS_CONTROLLER}\nputs PostsController.new.process(:show)\nputs PostsController.new.process(:edit)`,
      options: ["200 post / 302 /login", "302 /login / 302 /login", "200 post / 200 form"],
      answer: 0,
      output: "200 post\n302 /login",
      check: { compiles: true, stdout: "200 post\n302 /login", program: withHelper(MINI_CONTROLLER, `${POSTS_CONTROLLER}\nputs PostsController.new.process(:show)\nputs PostsController.new.process(:edit)`) },
      explain: L(
        "only: [:edit] means the guard skips show. On edit, with no user, it redirects and the chain stops before the action.",
        "only: [:edit] hace que el guardia ignore show. En edit, sin usuario, redirige y la cadena se detiene antes de la acción.",
        "only: [:edit] なので show では門番は休み。edit ではユーザーがいないのでリダイレクトして止まる。",
      ),
      win: [{ t: "print", text: "200 post" }, { t: "print", text: "302 /login" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'puts PostsController.new("ada").process(:edit)',
      options: ["200 form", "302 /login", "200 post"],
      answer: 0,
      output: "200 form",
      check: { compiles: true, stdout: "200 form", program: withHelper(MINI_CONTROLLER, `${POSTS_CONTROLLER}\nputs PostsController.new("ada").process(:edit)`) },
      explain: L(
        "Now @user is \"ada\", so require_login doesn't redirect. No response yet, so the chain goes on and edit renders the form.",
        "Ahora @user es \"ada\", así que require_login no redirige. Sin respuesta aún, la cadena sigue y edit muestra el formulario.",
        "@user が \"ada\" なのでリダイレクトしない。レスポンスがまだないので edit がフォームを返すよ。",
      ),
      setup: [{ t: "enter", actor: "ally" }, { t: "item", kind: "key", holder: "ally" }],
      win: [{ t: "say", actor: "hero", text: L("Welcome, Ada!", "¡Pasa, Ada!", "どうぞ、Ada！") }, { t: "print", text: "200 form" }],
    },
    {
      kind: "predict",
      prompt: L("In Rails, does the action still run?", "En Rails, ¿la acción corre igual?", "Rails でアクションは動く？"),
      code: "class AdminController < ApplicationController\n  before_action { redirect_to login_path }\n  def index = render(:index)\nend",
      options: [
        L("No: the action is skipped", "No: la acción se salta", "いいえ：アクションは飛ばされる"),
        L("Yes: it runs after the redirect", "Sí: corre tras el redirect", "はい：リダイレクト後に動く"),
      ],
      answer: 0,
      explain: L(
        "Action Controller guide: if a before action renders or redirects, the action will not run, and later filters are cancelled too.",
        "Guía de Action Controller: si un before action renderiza o redirige, la acción no corre y los filtros siguientes se cancelan.",
        "Action Controller ガイド：before action が render か redirect すると、アクションも後のフィルターも動かない。",
      ),
    },
    say(L(
      "render answers now with a page. redirect_to sends a 302: the browser makes a NEW request. After a failed save, render the form again.",
      "render responde ya con una página. redirect_to manda un 302: el navegador hace una petición NUEVA. Si save falla, render del formulario.",
      "render はその場でページを返す。redirect_to は 302 で、ブラウザが新しいリクエストを送る。保存失敗ならフォームを render。",
    )),
    {
      kind: "pick",
      prompt: L("Show the form again, with its errors", "Muestra el formulario de nuevo, con errores", "エラー付きでフォームを再表示"),
      code: "def create\n  @post = Post.new(post_params)\n  if @post.save\n    redirect_to @post\n  else\n    ___ :new, status: :unprocessable_entity\n  end\nend",
      options: ["render", "redirect_to"],
      answer: 0,
      explain: L(
        "render keeps this request, so @post and its errors reach the view. A redirect starts a new request and loses them.",
        "render se queda en esta petición, así @post y sus errores llegan a la vista. Un redirect empieza otra petición y los pierde.",
        "render は同じリクエストなので @post とエラーがビューに届く。redirect は新しいリクエストで消えちゃう。",
      ),
    },
    say(L(
      "Now the SCRIBE: views are ERB. <% %> runs Ruby silently, <%= %> writes the value into the page. Ruby's stdlib has ERB too.",
      "Ahora el ESCRIBA: las vistas son ERB. <% %> corre Ruby en silencio, <%= %> escribe el valor en la página. Ruby trae ERB.",
      "次は書記。ビューは ERB だよ。<% %> は静かに Ruby を実行、<%= %> は値をページに書く。ERB は標準ライブラリにもある。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: 'require "erb"\nputs ERB.new("<% x = 5 %>[<%= x * 2 %>]").result',
      options: ["[10]", "5[10]", "[x * 2]"],
      answer: 0,
      output: "[10]",
      check: { compiles: true, stdout: "[10]" },
      explain: L(
        "<% x = 5 %> runs but writes nothing. <%= x * 2 %> writes 10 between the brackets.",
        "<% x = 5 %> corre pero no escribe nada. <%= x * 2 %> escribe 10 entre los corchetes.",
        "<% x = 5 %> は実行だけで何も書かない。<%= x * 2 %> がかっこの中に 10 を書くよ。",
      ),
      win: [{ t: "print", text: "[10]" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'require "erb"\nitems = ["a", "b"]\nputs ERB.new("<% items.each do |i| %><li><%= i %></li><% end %>").result(binding)',
      options: ["<li>a</li><li>b</li>", "<li>i</li><li>i</li>", '<li>["a", "b"]</li>'],
      answer: 0,
      output: "<li>a</li><li>b</li>",
      check: { compiles: true, stdout: "<li>a</li><li>b</li>" },
      explain: L(
        "The loop lives in <% %> tags, and the <li> text between them repeats once per item. binding lets ERB see items.",
        "El bucle vive en etiquetas <% %> y el <li> entre ellas se repite por cada elemento. binding deja que ERB vea items.",
        "ループは <% %> の中。そのあいだの <li> が要素ごとにくり返される。binding で ERB が items を見られる。",
      ),
    },
    say(L(
      "Danger! A user's comment holds <script>. Rails' ERB escapes <%= %> automatically. Plain ERB does NOT: call h() yourself.",
      "¡Peligro! El comentario de un usuario trae <script>. El ERB de Rails escapa <%= %> solo. El ERB normal NO: llama a h().",
      "危険！ユーザーのコメントに <script> が。Rails の ERB は <%= %> を自動でエスケープ。素の ERB はしないので h() を呼ぼう。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: ERB_ESCAPE,
      options: ["<h1>&lt;b&gt;Hi&lt;/b&gt;</h1> / <h1><b>Hi</b></h1>", "<h1><b>Hi</b></h1> / <h1><b>Hi</b></h1>", "<h1>Hi</h1> / <h1><b>Hi</b></h1>"],
      answer: 0,
      output: "<h1>&lt;b&gt;Hi&lt;/b&gt;</h1>\n<h1><b>Hi</b></h1>",
      check: { compiles: true, stdout: "<h1>&lt;b&gt;Hi&lt;/b&gt;</h1>\n<h1><b>Hi</b></h1>" },
      explain: L(
        "h turns < and > into &lt; and &gt;: the browser shows the text instead of running it. Without h, the raw HTML goes through.",
        "h convierte < y > en &lt; y &gt;: el navegador muestra el texto en vez de ejecutarlo. Sin h, pasa el HTML crudo.",
        "h は < と > を &lt; と &gt; に変える。ブラウザは実行せず文字として表示。h なしだと HTML がそのまま。",
      ),
      setup: [{ t: "enter", actor: "enemy" }, { t: "item", kind: "shield", holder: "hero" }],
      win: [{ t: "attack", from: "hero", to: "enemy" }, { t: "print", text: "<h1>&lt;b&gt;Hi&lt;/b&gt;</h1>" }],
    },
    {
      kind: "type",
      prompt: L("Escape the comment", "Escapa el comentario", "コメントをエスケープ"),
      code: 'require "erb"\ninclude ERB::Util\ncomment = "<script>"\nputs ERB.new("<p><%= ___(comment) %></p>").result(binding)',
      answer: "h",
      check: { compiles: true, stdout: "<p>&lt;script&gt;</p>" },
      explain: L(
        "h (html_escape) makes the script harmless text. In Rails you get this for free; raw and html_safe turn it off, so avoid them on user input.",
        "h (html_escape) vuelve el script texto inofensivo. Rails lo hace solo; raw y html_safe lo apagan: evítalos con datos del usuario.",
        "h（html_escape）で script は無害な文字に。Rails は自動。raw や html_safe はそれを切るので注意。",
      ),
      win: [{ t: "print", text: "<p>&lt;script&gt;</p>" }],
    },
    {
      kind: "run",
      prompt: L("The guard redirects, but the action still runs. Fix it", "El guardia redirige pero la acción corre igual. Arréglalo", "門番がリダイレクトしてもアクションが動く。直そう"),
      starter: 'def redirect_to(path) = @response = "302 #{path}"\ndef render(text) = @response = "200 #{text}"\ndef require_admin = redirect_to("/login")\ndef index = render("secret")\ndef process(filters, action)\n  filters.each { |m| send(m) }\n  send(action)\n  @response\nend\nputs process([:require_admin], :index)\n',
      solution: 'def redirect_to(path) = @response = "302 #{path}"\ndef render(text) = @response = "200 #{text}"\ndef require_admin = redirect_to("/login")\ndef index = render("secret")\ndef process(filters, action)\n  filters.each do |m|\n    send(m)\n    return @response if @response\n  end\n  send(action)\n  @response\nend\nputs process([:require_admin], :index)\n',
      expect: "302 /login",
      fallback: [String.raw`return\s+@response\s+if\s+@response`, String.raw`send\(\s*action\s*\)\s+unless\s+@response`],
      explain: L(
        "After each filter, stop if it answered: return @response if @response. Otherwise index overwrites the redirect with 200 secret.",
        "Tras cada filtro, para si respondió: return @response if @response. Si no, index pisa el redirect con 200 secret.",
        "フィルターごとに、応答があれば return @response if @response。でないと index が上書きしちゃう。",
      ),
    },
  ],
};

// ─── 3.4 Ravens, chests and locks: jobs, cache and security ────────────────
const jobsCacheSecurity: LessonDef = {
  slug: "jobs-cache-security",
  title: L("Ravens, chests, locks", "Cuervos, cofres, candados", "カラスと宝箱と錠前"),
  concept: "jobs-cache-security",
  mode: "lesson",
  xp: 80,
  enemy: "golem",
  enemyName: L("LOCKPICK GOLEM", "GÓLEM GANZÚA", "カギあけゴーレム"),
  beats: [
    say(L(
      "Sending mail is slow; the visitor shouldn't wait. Rails puts slow work in a JOB queue: perform_later returns at once.",
      "Enviar correo es lento; el visitante no debe esperar. Rails pone el trabajo lento en una cola de JOBS: perform_later vuelve ya.",
      "メール送信は遅い。客を待たせたくない。Rails は遅い仕事をジョブキューへ。perform_later はすぐ戻るよ。",
    )),
    {
      kind: "act",
      prompt: L("Hand the letter to the raven, then let it fly", "Dale la carta al cuervo y déjalo volar", "手紙をカラスにわたして、飛ばそう"),
      steps: [
        { label: L("ENQUEUE", "ENCOLAR", "キューに入れる"), line: "WelcomeJob.perform_later(7)",
          effects: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "enter", actor: "ally" }, { t: "give", to: "ally" }, { t: "say", actor: "ally", text: L("Later!", "¡Luego!", "あとでね！") }] },
        { label: L("COUNT", "CONTAR", "数える"), line: 'puts "queued: #{QUEUE.size}"', effects: [{ t: "print", text: "queued: 1" }], output: "queued: 1" },
        { label: L("WORKER", "WORKER", "ワーカー"), line: "klass, args = QUEUE.shift", effects: [{ t: "wait", ms: 400 }] },
        { label: L("PERFORM", "EJECUTAR", "実行"), line: "klass.perform_now(*args)", effects: [{ t: "exit", actor: "ally" }, { t: "print", text: "mail to user 7" }], output: "mail to user 7" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: JOBS,
      options: ["queued: 1 / mail to user 7", "mail to user 7 / queued: 1", "queued: 0 / mail to user 7"],
      answer: 0,
      output: "queued: 1\nmail to user 7",
      check: { compiles: true, stdout: "queued: 1\nmail to user 7" },
      explain: L(
        "perform_later only stores the class and its arguments. The work happens later, when a worker shifts it off the queue.",
        "perform_later solo guarda la clase y sus argumentos. El trabajo ocurre luego, cuando un worker lo saca de la cola.",
        "perform_later はクラスと引数をしまうだけ。仕事はあとでワーカーがキューから取り出したときだよ。",
      ),
      win: [{ t: "print", text: "queued: 1" }, { t: "print", text: "mail to user 7" }],
    },
    say(L(
      "A job may run TWICE: after a crash, it is retried. Make it IDEMPOTENT, so running it again changes nothing.",
      "Un job puede correr DOS veces: tras un fallo, se reintenta. Hazlo IDEMPOTENTE: correrlo otra vez no cambia nada.",
      "ジョブは2回動くこともある。失敗するとリトライされるからね。何度動いても同じ結果、つまり「冪等」にしよう。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: 'SENT = []\ndef deliver(order_id)\n  return puts("skip #{order_id}") if SENT.include?(order_id)\n  SENT << order_id\n  puts "charged #{order_id}"\nend\ndeliver(5); deliver(5)',
      options: ["charged 5 / skip 5", "charged 5 / charged 5", "skip 5 / skip 5"],
      answer: 0,
      output: "charged 5\nskip 5",
      check: { compiles: true, stdout: "charged 5\nskip 5" },
      explain: L(
        "The second run sees order 5 is done and skips it. Without the check, a retry would charge the card twice.",
        "La segunda vez ve que la orden 5 ya está y la salta. Sin esa revisión, un reintento cobraría dos veces.",
        "2回目は注文 5 が済みだと気づいてスキップ。この確認がないとリトライで二重請求に。",
      ),
    },
    say(L(
      "Next, the treasure CHEST: a cache. fetch(key) { ... } runs the block once and keeps the result. Rails.cache.fetch works like this.",
      "Ahora el COFRE: una caché. fetch(key) { ... } corre el bloque una vez y guarda el resultado. Rails.cache.fetch funciona así.",
      "次は宝箱、キャッシュだ。fetch(key) { ... } はブロックを一度だけ動かし結果をしまう。Rails.cache.fetch も同じ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: CACHE,
      options: ["computing / 42 / 42", "computing / 42 / computing / 42", "42 / 42"],
      answer: 0,
      output: "computing\n42\n42",
      check: { compiles: true, stdout: "computing\n42\n42" },
      explain: L(
        "The first fetch misses, runs the block (computing) and stores 42. The second finds the key and skips the block.",
        "El primer fetch falla, corre el bloque (computing) y guarda 42. El segundo encuentra la clave y salta el bloque.",
        "1回目は見つからずブロックを実行（computing）して 42 を保存。2回目はキーがあるのでブロックを飛ばす。",
      ),
      setup: [{ t: "item", kind: "gem", holder: "hero" }],
      win: [{ t: "say", actor: "hero", text: L("Computed once!", "¡Una sola vez!", "計算は1回！") }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: NIL_CACHE,
      options: ["query / nil / query / nil", "query / nil / nil", "nil / nil"],
      answer: 0,
      output: "query\nnil\nquery\nnil",
      check: { compiles: true, stdout: "query\nnil\nquery\nnil" },
      explain: L(
        "||= assigns only when the value is nil or false, so a nil result is never kept: the query runs every time. Check key? instead.",
        "||= asigna solo si el valor es nil o false, así que un nil nunca se guarda: la consulta corre siempre. Usa key?.",
        "||= は nil か false のときだけ代入。だから nil は保存されず毎回クエリが走る。key? で確かめよう。",
      ),
      win: [{ t: "shake" }],
    },
    {
      kind: "type",
      prompt: L("Read-or-compute in the Rails cache", "Leer o calcular en la caché de Rails", "Rails キャッシュで読むか計算"),
      code: 'Rails.cache.___("stats", expires_in: 1.hour) do\n  Post.count\nend',
      answer: "fetch",
      explain: L(
        "Caching guide: Rails.cache.fetch returns the stored value, or runs the block, stores and returns it. expires_in sets its lifetime.",
        "Guía de Caching: Rails.cache.fetch devuelve el valor guardado, o corre el bloque, lo guarda y lo devuelve. expires_in da su vida.",
        "Caching ガイド：fetch は保存済みの値を返すか、ブロックを実行して保存する。expires_in で期限を決める。",
      ),
    },
    say(L(
      "Last, the LOCKS. SQL built with #{input} lets an attacker rewrite your query. A ? placeholder quotes the value safely.",
      "Por último, los CANDADOS. SQL armado con #{input} deja que un atacante reescriba la consulta. Un ? lo cita con seguridad.",
      "最後は錠前。#{input} で組んだ SQL は攻撃者に書きかえられる。? のプレースホルダーなら安全に囲める。",
    ), { code: QUOTE }),
    {
      kind: "predict",
      prompt: PRINT,
      code: SQL_DEMO,
      options: [
        "...name = 'x' OR '1'='1' / ...name = 'x'' OR ''1''=''1'",
        "...name = 'x'' OR ''1''=''1' / ...name = 'x' OR '1'='1'",
        "...name = 'x' OR '1'='1' / ...name = 'x' OR '1'='1'",
      ],
      answer: 0,
      output: "SELECT * FROM users WHERE name = 'x' OR '1'='1'\nSELECT * FROM users WHERE name = 'x'' OR ''1''=''1'",
      check: { compiles: true, stdout: "SELECT * FROM users WHERE name = 'x' OR '1'='1'\nSELECT * FROM users WHERE name = 'x'' OR ''1''=''1'" },
      explain: L(
        "Interpolated, the quote closes the string and OR '1'='1' matches EVERY row. Quoted, '' is just a quote inside one name.",
        "Interpolado, la comilla cierra el string y OR '1'='1' coincide con TODAS las filas. Citado, '' es solo una comilla en un nombre.",
        "埋め込むと ' で文字列が閉じ、OR '1'='1' で全行に一致。囲めば '' はただの文字になるよ。",
      ),
      setup: [{ t: "enter", actor: "enemy" }, { t: "item", kind: "key", holder: "enemy" }],
      win: [{ t: "shake" }, { t: "banner", text: L("ALL ROWS!", "¡TODAS!", "全行！") }],
    },
    {
      kind: "pick",
      prompt: L("Which one is safe in Rails?", "¿Cuál es segura en Rails?", "Rails で安全なのは？"),
      code: "User.where(___)",
      options: ['"name = ?", params[:name]', String.raw`"name = '#{params[:name]}'"`],
      answer: 0,
      explain: L(
        "Security guide: pass values as placeholders (or a hash: where(name: ...)) and Rails quotes them. Never interpolate params into SQL.",
        "Guía de Security: pasa valores como placeholders (o un hash: where(name: ...)) y Rails los cita. Nunca metas params en el SQL.",
        "Security ガイド：値は ? か where(name: ...) で渡せば Rails が囲む。params を SQL に埋め込まないで。",
      ),
    },
    say(L(
      "One more lock, CSRF: for every request except GET, Rails checks a secret token from your own form. So GET must never change data.",
      "Un candado más, CSRF: en toda petición que no sea GET, Rails revisa un token secreto de tu formulario. GET nunca debe cambiar datos.",
      "もう一つ、CSRF。GET 以外のリクエストで Rails は自分のフォームの秘密トークンを確かめる。GET でデータを変えないこと。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: 'require "securerandom"\nsession = {csrf: SecureRandom.hex(16)}\nvalid = ->(verb, token) { verb == "GET" || token == session[:csrf] }\np valid.("GET", nil)\np valid.("POST", "forged")\np valid.("POST", session[:csrf])',
      options: ["true / false / true", "false / false / true", "true / true / true"],
      answer: 0,
      output: "true\nfalse\ntrue",
      check: { compiles: true, stdout: "true\nfalse\ntrue" },
      explain: L(
        "GET passes without a token. A POST needs the session's token: a forged one fails, the real one (from our own form) passes.",
        "GET pasa sin token. Un POST necesita el token de la sesión: uno falso falla, el real (de nuestro formulario) pasa.",
        "GET はトークンなしで通る。POST はセッションのトークンが必要。偽物は失敗、本物は通るよ。",
      ),
    },
    {
      kind: "run",
      prompt: L("Lock the query: use the ? placeholder", "Cierra la consulta: usa el placeholder ?", "? を使ってクエリに錠をかけよう"),
      starter: `${QUOTE}\ndef find_user_sql(name) = where("SELECT * FROM users WHERE name = '#{name}'")\nputs find_user_sql("x' OR '1'='1")\n`,
      solution: `${QUOTE}\ndef find_user_sql(name) = where("SELECT * FROM users WHERE name = ?", name)\nputs find_user_sql("x' OR '1'='1")\n`,
      expect: "name = 'x'' OR ''1''=''1'",
      fallback: [String.raw`name = \?"\s*,\s*name\s*\)`],
      explain: L(
        "Write ? in the SQL and pass name as a bind: where quotes it, so the attacker's quote can't close the string.",
        "Escribe ? en el SQL y pasa name como valor: where lo cita, así la comilla del atacante no cierra el string.",
        "SQL に ? を書き、name を別に渡そう。where が囲むので攻撃者の ' で文字列は閉じない。",
      ),
    },
  ],
};

// ─── BOSS: the Request Dragon ──────────────────────────────────────────────
const requestDragon: LessonDef = {
  slug: "request-dragon",
  title: L("The Request Dragon", "El Dragón Petición", "リクエストドラゴン"),
  concept: "request-cycle",
  mode: "boss",
  xp: 200,
  enemy: "dragon",
  enemyName: L("REQUEST DRAGON", "DRAGÓN PETICIÓN", "リクエスト竜"),
  beats: [
    say(L(
      "The Request Dragon guards the throne! Follow one request from gate to scribe, and every answer is a strike.",
      "¡El Dragón Petición custodia el trono! Sigue una petición de la puerta al escriba: cada respuesta es un golpe.",
      "玉座を守るリクエスト竜だ！門から書記までリクエストを追いかけよう。正解ひとつが一撃だよ。",
    )),
    {
      kind: "predict", time: 20, prompt: PRINT,
      code: 'ROUTES = [["GET", "/posts/:id", "posts#show"], ["GET", "/posts/new", "posts#new"]]\n# recognize: the matcher from the gate map\np recognize("GET", "/posts/new")',
      options: ['["posts#show", {id: "new"}]', '["posts#new", {}]', "nil"], answer: 0,
      output: '["posts#show", {id: "new"}]',
      check: { compiles: true, stdout: '["posts#show", {id: "new"}]', program: `${WRONG_ORDER_ROUTER}\np recognize("GET", "/posts/new")` },
      explain: L("The first match wins: /posts/:id swallows new as an id.", "Gana la primera coincidencia: /posts/:id se traga new como id.", "最初の一致が勝つ。/posts/:id が new を id として飲みこむ。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: 'params = Params.new({"title" => "Hi", "admin" => true})\np params.permit("title", "body")',
      options: ['{"title" => "Hi"}', '{"title" => "Hi", "admin" => true}', '{"admin" => true}'], answer: 0,
      output: '{"title" => "Hi"}',
      check: { compiles: true, stdout: '{"title" => "Hi"}', program: `${PARAMS}\nparams = Params.new({"title" => "Hi", "admin" => true})\np params.permit("title", "body")` },
      explain: L("permit keeps only listed keys: admin is dropped.", "permit deja solo las claves listadas: admin se descarta.", "permit はリストのキーだけ。admin は捨てられる。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: `${POSTS_CONTROLLER}\nputs PostsController.new.process(:edit)`,
      options: ["302 /login", "200 form", "nil"], answer: 0,
      output: "302 /login",
      check: { compiles: true, stdout: "302 /login", program: withHelper(MINI_CONTROLLER, `${POSTS_CONTROLLER}\nputs PostsController.new.process(:edit)`) },
      explain: L("No user: the guard redirects and edit never runs.", "Sin usuario: el guardia redirige y edit no corre.", "ユーザーなし。門番がリダイレクトして edit は動かない。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: 'require "erb"\ninclude ERB::Util\ntitle = "<b>Hi</b>"\nputs ERB.new("<h1><%= h(title) %></h1>").result(binding)',
      options: ["<h1>&lt;b&gt;Hi&lt;/b&gt;</h1>", "<h1><b>Hi</b></h1>", "<h1>Hi</h1>"], answer: 0,
      output: "<h1>&lt;b&gt;Hi&lt;/b&gt;</h1>",
      check: { compiles: true, stdout: "<h1>&lt;b&gt;Hi&lt;/b&gt;</h1>" },
      explain: L("h escapes < and >, so the tags show as text.", "h escapa < y >, así las etiquetas se ven como texto.", "h が < と > をエスケープし、タグは文字として出る。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: 'def layout = "<main>#{yield}</main>"\nputs layout { "<p>post</p>" }',
      options: ["<main><p>post</p></main>", "<p>post</p><main></main>", "<main></main>"], answer: 0,
      output: "<main><p>post</p></main>",
      check: { compiles: true, stdout: "<main><p>post</p></main>" },
      explain: L("yield drops the view inside the layout, like a Rails layout's yield.", "yield mete la vista dentro del layout, como el yield de un layout de Rails.", "yield がビューをレイアウトの中に入れる。Rails のレイアウトと同じ。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "predict", time: 18, prompt: PRINT,
      code: NIL_CACHE,
      options: ["query / nil / query / nil", "query / nil / nil", "nil / nil"], answer: 0,
      output: "query\nnil\nquery\nnil",
      check: { compiles: true, stdout: "query\nnil\nquery\nnil" },
      explain: L("||= never keeps nil, so the block runs both times.", "||= nunca guarda nil, así que el bloque corre las dos veces.", "||= は nil を保存しないので2回ともブロックが動く。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "order", time: 25,
      prompt: L("Order one request's trip", "Ordena el viaje de una petición", "リクエストの旅を並べよう"),
      lines: ['recognize("GET", "/posts/1")  # router', "require_login  # before_action", "show  # action", 'render("post")  # view', '"200 post"  # response'],
      explain: L(
        "Router picks posts#show, filters run, then the action, which renders the view; the response goes back.",
        "El router elige posts#show, corren los filtros, luego la acción, que renderiza la vista; vuelve la respuesta.",
        "ルーターが posts#show を選び、フィルター、アクション、ビュー描画、そしてレスポンスが返る。",
      ),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "predict", time: 15,
      prompt: L("Which Rails feature stops this?", "¿Qué función de Rails lo frena?", "これを防ぐ Rails の機能は？"),
      code: '# params: {user: {name: "Eve", admin: "1"}}\nUser.create(params[:user])',
      options: [
        L("Strong parameters", "Strong parameters", "ストロングパラメータ"),
        "protect_from_forgery",
        L("Validations", "Validaciones", "バリデーション"),
      ],
      answer: 0,
      explain: L("Mass assignment is blocked by require/permit. CSRF protection guards forms, not keys.", "La asignación masiva se frena con require/permit. La protección CSRF cuida formularios, no claves.", "一括代入は require/permit で防ぐ。CSRF 対策はキーではなくフォームを守る。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "predict", time: 20, prompt: PRINT,
      code: `${QUOTE}\ninput = "x' OR '1'='1"\nputs where("SELECT * FROM users WHERE name = '#{input}'")`,
      options: ["SELECT * FROM users WHERE name = 'x' OR '1'='1'", "SELECT * FROM users WHERE name = 'x'' OR ''1''=''1'", "SELECT * FROM users WHERE name = ?"], answer: 0,
      output: "SELECT * FROM users WHERE name = 'x' OR '1'='1'",
      check: { compiles: true, stdout: "SELECT * FROM users WHERE name = 'x' OR '1'='1'" },
      explain: L("No ? and no binds: where can't quote anything. The query now returns all rows.", "Sin ? ni valores: where no puede citar nada. La consulta devuelve todas las filas.", "? も値もないので where は何も囲めない。全行が返るクエリに。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }, { t: "banner", text: L("CASTLE CLEAR!", "¡CASTILLO LIBRE!", "城クリア！") }],
    },
  ],
};

export const controllerCastle: RegionDef = {
  slug: "controller-castle",
  name: L("Controller Castle", "Castillo Controller", "コントローラー城"),
  subtitle: L("Routes, params, filters, views", "Rutas, params, filtros, vistas", "ルート・params・フィルター・ビュー"),
  theme: "castle",
  lessons: [routing, strongParams, filtersAndViews, jobsCacheSecurity, requestDragon],
};
