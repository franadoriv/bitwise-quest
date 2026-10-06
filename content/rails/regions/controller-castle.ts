import type { LessonDef, NoteBlock, NoteDef, RegionDef, Text } from "../../../lib/content/types.ts";
import { L, say } from "../../rust/helpers.ts";
import { MINI_CONTROLLER, withHelper } from "../mini.ts";
import { routerTask } from "../tasks.ts";

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

// ─── guidebook notes ─────────────────────────────────────────────────────────────
// Long explanations players can reopen from any question (📖). Examples use names and values
// different from the questions so they never give an answer away. Runnable examples are plain Ruby
// (the validator runs them on Ruby 3.4.7); Rails code is shown for reading only, with no output.
const note = (id: string, title: Text, ...blocks: NoteBlock[]): NoteDef => ({ id, title, blocks });
const p = (en: string, es: string, ja: string): NoteBlock => ({ t: "p", text: L(en, es, ja) });
/** A runnable example; the validator checks `output` against the real runner. */
const ex = (code: string, output: string, caption?: Text): NoteBlock => ({ t: "code", code, output, caption });
/** A runnable example with a hidden prelude (a mini version from the dialogs) prepended. */
const exWith = (prelude: string, code: string, output: string, caption?: Text): NoteBlock =>
  ({ t: "code", code, output, caption, check: { compiles: true, stdout: output, program: `${prelude}\n${code}` } });
/** An example that must fail at runtime with this error (verified too). */
const raises = (code: string, error: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { compiles: true, throws: error } });
/** Real Rails code, for reading only: Rails can't run in the sandbox, so it has no output and no check. */
const rails = (code: string, caption: Text): NoteBlock => ({ t: "code", code, caption });

const routingNotes: NoteDef[] = [
  note("route-matching", L("How the router finds a route", "Cómo el router halla una ruta", "ルーターがルートを探すしくみ"),
    p(
      "Every request carries two things the router reads: an HTTP verb (GET, POST, PATCH, DELETE...) and a path like /books/7. The router walks its routes from top to bottom and stops at the first one whose verb AND path both fit. That route names a controller and an action, written controller#action, such as books#show.",
      "Cada petición trae dos cosas que el router lee: un verbo HTTP (GET, POST, PATCH, DELETE...) y una ruta como /books/7. El router recorre sus rutas de arriba abajo y se detiene en la primera cuyo verbo Y ruta encajan. Esa ruta nombra un controlador y una acción, escritos controlador#acción, como books#show.",
      "リクエストには、ルーターが読む2つの情報がある。HTTP メソッド（GET・POST・PATCH・DELETE など）と、/books/7 のようなパスだ。ルーターはルートを上から順に見て、メソッドとパスの両方が合う最初のルートで止まる。そのルートが「コントローラー#アクション」（例：books#show）を指すよ。",
    ),
    p(
      "A segment that starts with a colon, like :id or :slug, is a placeholder: it matches any text up to the next slash and stores that text under its name. Our mini version does it with a regular expression. The WHOLE path must fit, from start to end, so an extra piece at the end means no match, and a placeholder never swallows a slash.",
      "Un segmento que empieza con dos puntos, como :id o :slug, es un comodín: encaja con cualquier texto hasta la siguiente barra y lo guarda con ese nombre. Nuestra mini versión lo hace con una expresión regular. La ruta COMPLETA debe encajar, de inicio a fin: un trozo extra al final significa que no coincide, y un comodín nunca se traga una barra.",
      ":id や :slug のようにコロンで始まる部分はプレースホルダー。次の / までの文字に合い、その名前で保存される。ミニ版は正規表現でこれをやっている。パスは最初から最後まで「全部」合わないといけない。後ろに余分な部分があれば不一致で、プレースホルダーが / を飲みこむこともない。",
    ),
    exWith(RECOGNIZE, 'ROUTES = [["GET", "/books/:slug", "books#show"]]\np recognize("GET", "/books/dune")\np recognize("GET", "/books/dune/pages")\np recognize("POST", "/books/dune")',
      '["books#show", {slug: "dune"}]\nnil\nnil',
      L("Same matcher as the lesson: verb and whole path must fit", "El mismo buscador: verbo y ruta completa deben encajar", "同じマッチャー：メソッドとパス全体が合うこと")),
    p(
      "When nothing fits, the router gives up. Real Rails then answers 404 Not Found; our mini version simply returns nil. Remember: a route needs both the right verb and the full path. The same path with a verb no route lists is still \"no route\".",
      "Cuando nada encaja, el router se rinde. Rails real responde 404 Not Found; nuestra mini versión solo devuelve nil. Recuerda: una ruta necesita el verbo correcto y la ruta completa. La misma ruta con un verbo que ninguna ruta lista sigue siendo \"sin ruta\".",
      "何も合わなければルーターはあきらめる。本物の Rails は 404 Not Found を返し、ミニ版は nil を返すだけ。ルートには正しいメソッドとパス全体の両方が必要だよ。同じパスでも、どのルートにもないメソッドなら「ルートなし」だ。",
    ),
    p(
      "Order matters, because the first match wins. A general pattern like /books/:slug placed above a fixed path like /books/top catches top as if it were a slug. Put the fixed, specific paths first and the placeholders after them. Rails' resources already draws new before :id for you.",
      "El orden importa, porque gana la primera coincidencia. Un patrón general como /books/:slug puesto antes de una ruta fija como /books/top atrapa top como si fuera un slug. Pon primero las rutas fijas y específicas, y los comodines después. resources de Rails ya dibuja new antes de :id por ti.",
      "最初に合ったものが勝つので、順番が大事。/books/:slug のような一般的なパターンを /books/top のような固定パスより上に置くと、top が slug として捕まってしまう。固定の具体的なパスを先に、プレースホルダーをあとに置こう。Rails の resources は最初から new を :id より前に作るよ。",
    ),
    exWith(RECOGNIZE, 'ROUTES = [["GET", "/books/:slug", "books#show"], ["GET", "/books/top", "books#top"]]\np recognize("GET", "/books/top")',
      '["books#show", {slug: "top"}]',
      L("The general route comes first, so it catches top", "La ruta general va primero, así que atrapa top", "一般的なルートが先なので top を捕まえる")),
  ),
  note("params-strings", L("URL params are strings", "Los params de la URL son strings", "URL の params は文字列"),
    p(
      "Everything in a URL is text. When the router captures :id from /books/7, it stores the string \"7\", not the number 7. Rails does the same: values from the path, the query string and forms arrive in params as strings, even when they look like numbers.",
      "Todo en una URL es texto. Cuando el router captura :id de /books/7, guarda el string \"7\", no el número 7. Rails hace lo mismo: los valores de la ruta, del query string y de los formularios llegan a params como strings, aunque parezcan números.",
      "URL の中身はすべて文字。ルーターが /books/7 から :id を取ると、数値の 7 ではなく文字列 \"7\" が入る。Rails も同じで、パス・クエリ文字列・フォームの値は、数字に見えても params には文字列で届くよ。",
    ),
    p(
      "Ruby never converts between strings and numbers on its own. To do math, convert first: to_i turns \"7\" into 7 (and text with no digits into 0), and to_f gives a float. After that, + adds the way you expect.",
      "Ruby nunca convierte solo entre strings y números. Para hacer cuentas, convierte primero: to_i convierte \"7\" en 7 (y un texto sin dígitos en 0), y to_f da un decimal. Después, + suma como esperas.",
      "Ruby は文字列と数値を勝手に変換しない。計算するなら先に変換しよう。to_i は \"7\" を 7 に（数字のない文字は 0 に）、to_f は小数にする。そのあとなら + は普通に足し算になる。",
    ),
    ex('page = "3"\np page.to_i + 10\np page * 2', '13\n"33"',
      L("String * Integer repeats the text; it doesn't multiply", "String * Integer repite el texto; no multiplica", "文字列 * 整数は文字のくり返しで、かけ算ではない")),
    p(
      "Mixing them up fails in different ways. String + Integer raises TypeError (no implicit conversion of Integer into String), because + on a string only joins other strings. String * Integer works, but repeats the text. Neither one does arithmetic.",
      "Mezclarlos falla de formas distintas. String + Integer lanza TypeError (no implicit conversion of Integer into String), porque + en un string solo une otros strings. String * Integer funciona, pero repite el texto. Ninguno hace aritmética.",
      "混ぜると失敗のしかたがちがう。文字列 + 整数は TypeError（no implicit conversion of Integer into String）。文字列の + は文字列どうしをつなぐだけだから。文字列 * 整数は動くが、文字をくり返すだけ。どちらも計算はしない。",
    ),
    raises('qty = "2"\nputs qty + 5', "TypeError",
      L("Raises TypeError: a String can't add an Integer", "Lanza TypeError: un String no suma un Integer", "TypeError：文字列に整数は足せない")),
    p(
      "Common mistake: comparing a param with a number, like params[:id] == 7. It is simply false, with no error, because \"7\" and 7 are different values. Convert with to_i, or compare with a string. In Rails, Post.find(params[:id]) accepts the string and converts it for you.",
      "Error común: comparar un param con un número, como params[:id] == 7. Da false sin ningún error, porque \"7\" y 7 son valores distintos. Convierte con to_i o compara con un string. En Rails, Post.find(params[:id]) acepta el string y lo convierte por ti.",
      "よくあるミス：params[:id] == 7 のように param を数値と比べること。\"7\" と 7 は別の値なので、エラーもなくただ false になる。to_i で変換するか、文字列と比べよう。Rails の Post.find(params[:id]) は文字列を受け取って変換してくれる。",
    ),
  ),
  note("rest-resources", L("resources and the 7 REST routes", "resources y las 7 rutas REST", "resources と REST の7ルート"),
    p(
      "REST is a convention: the same few actions for every kind of resource. For books, Rails expects seven: index (list them), show (one), new (blank form), create (save that form), edit (edit form), update (save the changes) and destroy (delete). One line, resources :books in config/routes.rb, draws all seven routes.",
      "REST es una convención: las mismas pocas acciones para cada tipo de recurso. Para libros, Rails espera siete: index (listar), show (uno), new (formulario vacío), create (guardarlo), edit (formulario de edición), update (guardar cambios) y destroy (borrar). Una línea, resources :books en config/routes.rb, dibuja las siete rutas.",
      "REST は「どのリソースにも同じアクションを使う」という約束。本なら Rails は7つを期待する。index（一覧）、show（1件）、new（空のフォーム）、create（それを保存）、edit（編集フォーム）、update（変更を保存）、destroy（削除）。config/routes.rb に resources :books と1行書けば7本そろうよ。",
    ),
    p(
      "The verb is what tells actions apart. Actions that only read data or show a form use GET; actions that change data use POST, PATCH (or PUT) or DELETE. That is why one path, such as /books/:id, can lead to several actions: the path says WHICH book, the verb says WHAT to do with it.",
      "El verbo es lo que distingue las acciones. Las que solo leen datos o muestran un formulario usan GET; las que cambian datos usan POST, PATCH (o PUT) o DELETE. Por eso una misma ruta, como /books/:id, puede llevar a varias acciones: la ruta dice CUÁL libro y el verbo dice QUÉ hacer con él.",
      "アクションを区別するのはメソッド。データを読むだけ、またはフォームを見せるだけのアクションは GET。データを変えるアクションは POST・PATCH（か PUT）・DELETE。だから /books/:id のような1つのパスが複数のアクションにつながる。パスは「どの本か」、メソッドは「何をするか」を決めるんだ。",
    ),
    p(
      "Common mistake: thinking edit saves the changes. edit only shows the form; when you submit it, a different request with a different verb reaches another action. Remember the pairs: new shows the form that create saves, and edit shows the form that update saves.",
      "Error común: creer que edit guarda los cambios. edit solo muestra el formulario; al enviarlo, otra petición con otro verbo llega a otra acción. Recuerda las parejas: new muestra el formulario que create guarda, y edit muestra el formulario que update guarda.",
      "よくあるミス：edit が変更を保存すると思うこと。edit はフォームを見せるだけで、送信すると別のメソッドの別のリクエストが別のアクションに届く。ペアで覚えよう。new のフォームを create が保存し、edit のフォームを update が保存する。",
    ),
    p(
      "Don't need all seven? only: keeps just the listed actions and except: drops the listed ones. Fewer routes means fewer doors into your app, so draw only the actions your controller really has. Our mini version can copy except: by removing actions from the full list.",
      "¿No necesitas las siete? only: deja solo las acciones listadas y except: quita las listadas. Menos rutas significa menos puertas a tu app, así que dibuja solo las acciones que tu controlador tiene de verdad. Nuestra mini versión puede imitar except: quitando acciones de la lista completa.",
      "7本ぜんぶ要らない？only: は書いたアクションだけ残し、except: は書いたものを外す。ルートが少ないほどアプリへの入口も少ない。コントローラーに本当にあるアクションだけ作ろう。ミニ版なら全体のリストから引き算して except: をまねできる。",
    ),
    ex("ACTIONS = %i[index new create show edit update destroy]\np ACTIONS - [:new, :edit, :destroy]", "[:index, :create, :show, :update]",
      L("except: works like removing actions from the full list", "except: es como quitar acciones de la lista completa", "except: は全体のリストから外すのと同じ")),
    rails("# config/routes.rb\nresources :books, except: [:destroy]\nresources :reviews, only: [:create]",
      L("Real Rails routes (for reading: Rails can't run here)", "Rutas de Rails reales (para leer: aquí no corre Rails)", "本物の Rails のルート（読むだけ）")),
  ),
];

// ─── 3.1 The gate map: routing ─────────────────────────────────────────────
const routing: LessonDef = {
  slug: "routing",
  title: L("The gate map", "El mapa de la puerta", "門の地図"),
  concept: "routing",
  mode: "lesson",
  xp: 70,
  enemy: "ghost",
  enemyName: L("LOST ROUTE", "RUTA PERDIDA", "まいごルート"),
  notes: routingNotes,
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
      hint: L("Text captured from a path segment: is it kept as written, or turned into something else?", "Texto capturado de un segmento de la ruta: ¿se queda tal cual o se convierte en otra cosa?", "パスの一部から取った文字は、そのまま？それとも別の型に変わる？"),
      note: "params-strings",
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
      hint: L("Check the routes top to bottom. Does this path contain any :segment to capture?", "Revisa las rutas de arriba abajo. ¿Esta ruta tiene algún :segmento que capturar?", "ルートを上から見よう。このパスに取り出す :部分はある？"),
      note: "route-matching",
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
      hint: L("Both the verb and the WHOLE path must fit a route. Can a segment hold a slash?", "El verbo y la ruta COMPLETA deben encajar. ¿Un segmento puede llevar una barra?", "メソッドとパス「全体」が合う必要がある。1つの部分に / は入る？"),
      note: "route-matching",
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
      hint: L("What type do params arrive as? Then: what does + do between that type and a number?", "¿Con qué tipo llegan los params? Luego: ¿qué hace + entre ese tipo y un número?", "params は何の型で届く？その型と数値の + はどうなる？"),
      note: "params-strings",
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
      hint: L("Count all the routes first, then only those that just read data or show a form.", "Cuenta primero todas las rutas y luego solo las que leen datos o muestran un formulario.", "まず全ルートを数え、次に読むだけ・フォームを見せるだけのものを数えよう。"),
      note: "rest-resources",
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
      hint: L("One path can lead to several actions. What tells them apart in this list?", "Una ruta puede llevar a varias acciones. ¿Qué las distingue en esta lista?", "1つのパスが複数のアクションにつながる。このリストで区別しているのは何？"),
      note: "rest-resources",
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
      hint: L("Does this verb ask for a form, or send changes to save on an existing photo?", "¿Este verbo pide un formulario o envía cambios para guardar en una foto existente?", "このメソッドはフォームを求めている？それとも既存の写真の変更を送っている？"),
      note: "rest-resources",
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
      hint: L("The keyword's name says what it keeps. Its opposite, which drops actions, is except:.", "El nombre de la palabra dice qué conserva. Su opuesta, que quita acciones, es except:.", "キーワードの名前が「何を残すか」を表す。逆に外すほうは except: だよ。"),
      note: "rest-resources",
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
      hint: L("The first matching route wins. Which route catches /posts/new right now?", "Gana la primera ruta que coincide. ¿Qué ruta atrapa /posts/new ahora mismo?", "最初に合ったルートが勝つ。今 /posts/new を捕まえているのはどれ？"),
      note: "route-matching",
      explain: L(
        "Move the /posts/new route above /posts/:id. Rails' resources already orders them this way for you.",
        "Sube la ruta /posts/new por encima de /posts/:id. resources de Rails ya las ordena así por ti.",
        "/posts/new のルートを /posts/:id より上へ。Rails の resources は最初からこの順だよ。",
      ),
    },
  ],
};

const strongParamsNotes: NoteDef[] = [
  note("mass-assignment", L("Mass assignment", "Asignación masiva", "一括代入"),
    p(
      "Mass assignment means building or updating an object from a whole hash in one go: every key in the hash becomes an attribute. It's handy with forms, because a form's fields arrive as a hash. The danger: that hash comes from the browser, and anyone can add fields your form never had.",
      "La asignación masiva es crear o actualizar un objeto con un hash entero de una vez: cada clave del hash se vuelve un atributo. Es cómoda con formularios, porque sus campos llegan como un hash. El peligro: ese hash viene del navegador, y cualquiera puede añadir campos que tu formulario nunca tuvo.",
      "一括代入とは、ハッシュ丸ごとで一度にオブジェクトを作ったり更新したりすること。ハッシュのキーがすべて属性になる。フォームの項目はハッシュで届くので便利だ。でも危険もある。そのハッシュはブラウザから来るので、誰でもフォームにない項目を足せるんだ。",
    ),
    ex('Pet = Struct.new(:name, :vip, keyword_init: true)\nform = {name: "Rex", vip: true}\np Pet.new(**form).vip', "true",
      L("Every key in the hash lands on the object", "Cada clave del hash llega al objeto", "ハッシュのキーが全部オブジェクトに入る")),
    p(
      "So never pass raw input straight to a model. Pick the keys you expect and drop everything else. Hash#slice does exactly that: it returns a new hash with only the keys you name, and quietly skips names that aren't there.",
      "Así que nunca pases la entrada cruda directo a un modelo. Elige las claves que esperas y descarta el resto. Hash#slice hace justo eso: devuelve un hash nuevo solo con las claves que nombras, y omite en silencio las que no están.",
      "だから生の入力をそのままモデルに渡さないこと。期待するキーだけを選び、ほかは捨てよう。Hash#slice がまさにそれをする。指定したキーだけの新しいハッシュを返し、存在しない名前は静かに無視するよ。",
    ),
    ex('form = {name: "Rex", vip: true}\np form.slice(:name)\np form.slice(:name, :age)', '{name: "Rex"}\n{name: "Rex"}',
      L("slice keeps only the named keys that exist", "slice deja solo las claves nombradas que existen", "slice は指定した既存のキーだけ残す")),
    p(
      "An attribute you didn't pass keeps its default, which for a Struct is nil. That's the whole point: an attacker can send role: \"admin\" all day, but if role never passes the filter, it never reaches the object.",
      "Un atributo que no pasaste conserva su valor por defecto, que en un Struct es nil. Esa es la idea: un atacante puede mandar role: \"admin\" todo el día, pero si role nunca pasa el filtro, nunca llega al objeto.",
      "渡さなかった属性は既定値のまま。Struct なら nil だ。これが大事なところ。攻撃者が role: \"admin\" を何度送っても、role がフィルターを通らなければオブジェクトには届かない。",
    ),
    p(
      "Common mistake: filtering with reject (or except) on the keys you allow. Those REMOVE the listed keys and keep everything else, attacker's extras included. An allow list (slice, select, permit) is safer than a block list, because any new, unknown key is dropped by default.",
      "Error común: filtrar con reject (o except) sobre las claves que permites. Esos QUITAN las claves listadas y dejan todo lo demás, incluidos los extras del atacante. Una lista de permitidos (slice, select, permit) es más segura que una de bloqueados, porque toda clave nueva y desconocida se descarta por defecto.",
      "よくあるミス：許可したいキーで reject（や except）を使うこと。それはリストのキーを「消して」残りを全部通す。攻撃者の余計なキーもだ。許可リスト（slice・select・permit）のほうが禁止リストより安全。知らない新しいキーは最初から捨てられるからね。",
    ),
  ),
  note("require-permit", L("require and permit", "require y permit", "require と permit"),
    p(
      "Rails' answer to mass assignment is strong parameters. params.require(:post) says \"this request must contain a post hash\" and returns it; .permit(:title, :body) then keeps only those keys. Our mini version, from Chuff's dialog, does the same with a plain Hash.",
      "La respuesta de Rails a la asignación masiva son los strong parameters. params.require(:post) dice \"esta petición debe traer un hash post\" y lo devuelve; luego .permit(:title, :body) deja solo esas claves. Nuestra mini versión, del diálogo de Chuff, hace lo mismo con un Hash normal.",
      "一括代入への Rails の答えがストロングパラメータ。params.require(:post) は「このリクエストには post ハッシュが必要」と言ってそれを返し、.permit(:title, :body) がそのキーだけを残す。チャフの会話に出たミニ版は、普通の Hash で同じことをするよ。",
    ),
    exWith(PARAMS, 'form = Params.new({"song" => {"name" => "Echo", "plays" => 9000}})\np form.require("song").permit("name", "artist")', '{"name" => "Echo"}',
      L("Only listed keys that actually arrived survive", "Solo pasan las claves listadas que sí llegaron", "リストにあって届いたキーだけが残る")),
    p(
      "permit is an allow list. A key passes only if it is listed AND present: unlisted keys are dropped, and listed keys that weren't sent simply don't appear (they don't turn into nil).",
      "permit es una lista de permitidos. Una clave pasa solo si está listada Y presente: las no listadas se descartan, y las listadas que no se enviaron simplemente no aparecen (no se vuelven nil).",
      "permit は許可リスト。キーが通るのは「リストにある」かつ「届いている」ときだけ。リストにないキーは捨てられ、リストにあっても送られていないキーは現れない（nil にもならない）。",
    ),
    p(
      "require is strict. If the key is missing, or its value is empty, it raises ParameterMissing. In Rails that's ActionController::ParameterMissing, and the app answers 400 Bad Request instead of going on with half the data. An empty hash or an empty string counts as missing.",
      "require es estricto. Si la clave falta, o su valor está vacío, lanza ParameterMissing. En Rails es ActionController::ParameterMissing, y la app responde 400 Bad Request en vez de seguir con la mitad de los datos. Un hash vacío o un string vacío cuentan como faltantes.",
      "require はきびしい。キーがない、または値が空なら ParameterMissing を出す。Rails では ActionController::ParameterMissing で、データが半分のまま進まずに 400 Bad Request を返す。空のハッシュや空の文字列も「ない」とみなされるよ。",
    ),
    p(
      "ParameterMissing is a subclass of KeyError, both in our mini version and in Rails. So rescue KeyError catches it too: a rescue clause matches the class you name and every subclass of it.",
      "ParameterMissing es subclase de KeyError, tanto en nuestra mini versión como en Rails. Así que rescue KeyError también la atrapa: un rescue coincide con la clase que nombras y con todas sus subclases.",
      "ParameterMissing は、ミニ版でも Rails でも KeyError のサブクラス。だから rescue KeyError でも捕まえられる。rescue は書いたクラスとそのすべてのサブクラスに合うんだ。",
    ),
    exWith(PARAMS, 'begin\n  Params.new({"song" => ""}).require("song")\nrescue KeyError => e\n  puts e.class\nend', "ParameterMissing",
      L("An empty value counts as missing; rescue KeyError catches it", "Un valor vacío cuenta como faltante; rescue KeyError lo atrapa", "空の値は「ない」扱い。rescue KeyError で捕まる")),
  ),
  note("rails-params", L("Strong parameters in real Rails", "Strong parameters en Rails real", "本物の Rails の params"),
    p(
      "In a real Rails app, params isn't a plain Hash but an ActionController::Parameters object. One difference: it accepts string and symbol keys alike, so params[:id] and params[\"id\"] read the same value. A plain Ruby Hash does not: :id and \"id\" are two different keys.",
      "En una app Rails real, params no es un Hash normal sino un objeto ActionController::Parameters. Una diferencia: acepta igual claves string y símbolo, así que params[:id] y params[\"id\"] leen el mismo valor. Un Hash de Ruby normal no: :id y \"id\" son dos claves distintas.",
      "本物の Rails の params は普通の Hash ではなく ActionController::Parameters。ちがいの一つは、文字列キーとシンボルキーを同じに扱うこと。params[:id] と params[\"id\"] は同じ値を読む。普通の Ruby の Hash はちがう。:id と \"id\" は別のキーだ。",
    ),
    ex('opts = {"color" => "red"}\np opts["color"]\np opts[:color]\np opts.transform_keys(&:to_sym)[:color]', '"red"\nnil\n"red"',
      L("A plain Hash: the key's type must match exactly", "Un Hash normal: el tipo de la clave debe coincidir", "普通の Hash はキーの型までぴったり合わせる")),
    p(
      "What happens to a key you didn't permit? By default Rails drops it quietly and writes a line in the log; nothing raises. You can change that with config.action_controller.action_on_unpermitted_parameters = :raise, handy in development to spot forms that send fields you forgot.",
      "¿Qué pasa con una clave que no permitiste? Por defecto Rails la descarta en silencio y escribe una línea en el log; no lanza nada. Puedes cambiarlo con config.action_controller.action_on_unpermitted_parameters = :raise, útil en desarrollo para notar formularios que mandan campos olvidados.",
      "許可していないキーはどうなる？既定では Rails は静かに捨て、ログに1行書くだけ。例外は出ない。config.action_controller.action_on_unpermitted_parameters = :raise で変えられる。開発中に、忘れた項目を送るフォームを見つけるのに便利だよ。",
    ),
    p(
      "Rails 8 adds a method that requires and permits in a single call, and also checks the shape: if the main key is missing or isn't a hash of the listed keys, the app answers 400 instead of failing deep in your code. New Rails 8 apps use it in their generated controllers; older code uses require(...).permit(...).",
      "Rails 8 suma un método que exige y permite en una sola llamada, y además revisa la forma: si falta la clave principal o no es un hash de las claves listadas, la app responde 400 en vez de fallar en lo profundo de tu código. Las apps nuevas de Rails 8 lo usan en sus controladores generados; el código viejo usa require(...).permit(...).",
      "Rails 8 には、require と permit を1回の呼び出しでまとめ、形もチェックするメソッドがある。メインのキーがない、またはリストのキーのハッシュでなければ、コードの奥で失敗せず 400 を返す。Rails 8 で生成したコントローラーはこれを使い、古いコードは require(...).permit(...) を使う。",
    ),
    rails("# Rails controller (for reading only)\ndef song_params\n  params.require(:song).permit(:name, :artist)\nend",
      L("The classic two-step form: require, then permit", "La forma clásica en dos pasos: require y luego permit", "昔ながらの2段階：require して permit")),
    p(
      "Common mistake: thinking permit complains loudly by default. It doesn't: the extra key just vanishes (plus a log line). So when a field you sent is missing from the saved record, the usual cause is that you forgot to permit it.",
      "Error común: creer que permit se queja en voz alta por defecto. No lo hace: la clave extra solo desaparece (más una línea en el log). Así que si un campo que enviaste falta en el registro guardado, la causa usual es que olvidaste permitirlo.",
      "よくあるミス：permit が既定で大きく文句を言うと思うこと。言わない。余分なキーは消えるだけ（ログに1行）。だから送った項目が保存されたレコードにないときは、たいてい permit し忘れが原因だ。",
    ),
  ),
];

// ─── 3.2 The shield of permitted gifts: strong parameters ──────────────────
const strongParams: LessonDef = {
  slug: "strong-params",
  title: L("The permitted shield", "El escudo permitido", "許可の盾"),
  concept: "strong-params",
  mode: "lesson",
  xp: 75,
  enemy: "rails/mass-burglar",
  enemyName: L("MASS BURGLAR", "LADRÓN MASIVO", "一括ドロボウ"),
  notes: strongParamsNotes,
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
      hint: L("What does ** hand to the constructor? Then compare with what slice leaves in the hash.", "¿Qué le pasa ** al constructor? Luego compáralo con lo que slice deja en el hash.", "** はコンストラクターに何を渡す？slice のあとのハッシュと比べよう。"),
      note: "mass-assignment",
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
      hint: L("A key must pass two tests: is it on the permitted list, and did the form actually send it?", "Una clave debe pasar dos pruebas: ¿está en la lista permitida y el formulario la envió de verdad?", "キーは2つの条件を満たす必要がある。許可リストにある？本当に送られた？"),
      note: "require-permit",
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
      hint: L("Look at the first line of require: what does it do when the value is nil?", "Mira la primera condición de require: ¿qué hace cuando el valor es nil?", "require の中を見よう。値が nil のときは何をする？"),
      note: "require-permit",
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
      hint: L("Is an empty hash 'present' for require? And what is ParameterMissing's parent class?", "¿Un hash vacío cuenta como 'presente' para require? ¿Y cuál es la clase padre de ParameterMissing?", "空のハッシュは require にとって「ある」？ParameterMissing の親クラスは？"),
      note: "require-permit",
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
      hint: L("Think about Rails' default for a key you didn't permit: loud or quiet?", "Piensa en lo que Rails hace por defecto con una clave no permitida: ¿ruidoso o silencioso?", "許可していないキーへの Rails の既定の反応は？大さわぎ？静か？"),
      note: "rails-params",
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
      hint: L("This is a plain Ruby Hash. Is a symbol key the same key as a string key?", "Es un Hash de Ruby normal. ¿Una clave símbolo es la misma clave que una string?", "これは普通の Ruby の Hash。シンボルのキーと文字列のキーは同じキー？"),
      note: "rails-params",
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
      hint: L("Rails 8 added one method that requires, permits and checks the shape. Its name is a verb.", "Rails 8 añadió un método que exige, permite y revisa la forma. Su nombre es un verbo.", "Rails 8 で、require・permit・形のチェックを1つにした動詞のメソッドが入った。"),
      note: "rails-params",
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
      hint: L("Does reject keep or throw away the keys it matches? You want an allow list.", "¿reject conserva o tira las claves que coinciden? Quieres una lista de permitidos.", "reject は合ったキーを残す？捨てる？ほしいのは許可リストだ。"),
      note: "mass-assignment",
      explain: L(
        "reject throws away the permitted keys and keeps the rest. slice(*keys) (or select) keeps ONLY the permitted ones.",
        "reject tira las claves permitidas y deja el resto. slice(*keys) (o select) deja SOLO las permitidas.",
        "reject は許可キーを捨てて残りを通す。slice(*keys)（か select）で許可キーだけ残そう。",
      ),
    },
  ],
};

const SHOP_CONTROLLER = String.raw`class ShopController < Controller
  before_action :require_member, only: [:buy]
  def require_member = (redirect_to "/join" unless @user)
  def browse = render("shelf")
  def buy = render("receipt")
end`;

const filtersNotes: NoteDef[] = [
  note("before-action", L("before_action: guards at the door", "before_action: guardias en la puerta", "before_action：扉の門番"),
    p(
      "A before_action is a method Rails runs before an action, like a guard at a door. Controllers use them for checks many actions need: is someone logged in, does the record exist, is this user allowed? You declare them at the top of the controller, and they run in the order you wrote them.",
      "Un before_action es un método que Rails corre antes de una acción, como un guardia en una puerta. Los controladores los usan para revisiones que muchas acciones necesitan: ¿hay alguien conectado?, ¿existe el registro?, ¿este usuario tiene permiso? Se declaran arriba del controlador y corren en el orden en que los escribiste.",
      "before_action は、アクションの前に Rails が動かすメソッド。扉の門番のようなものだ。ログインしているか、レコードはあるか、このユーザーに権限はあるか、といった多くのアクションに必要なチェックに使う。コントローラーの上に書き、書いた順に動くよ。",
    ),
    p(
      "only: and except: limit a filter to some actions. before_action :require_login, only: [:edit] guards edit and lets every other action through without even calling the filter.",
      "only: y except: limitan un filtro a algunas acciones. before_action :require_login, only: [:edit] cuida edit y deja pasar todas las demás acciones sin siquiera llamar al filtro.",
      "only: と except: でフィルターを一部のアクションに限定できる。before_action :require_login, only: [:edit] は edit だけを守り、ほかのアクションではフィルターを呼びもしない。",
    ),
    exWith(MINI_CONTROLLER, `${SHOP_CONTROLLER}\nputs ShopController.new.process(:browse)\nputs ShopController.new.process(:buy)\nputs ShopController.new("kim").process(:buy)`,
      "200 shelf\n302 /join\n200 receipt",
      L("Runs on our mini Controller from the dialog", "Corre sobre nuestro mini Controller del diálogo", "会話に出たミニ版 Controller で動く")),
    p(
      "The key rule: if a filter renders or redirects, the chain halts. Rails skips the remaining filters AND the action itself. Our mini version does the same: after each filter it checks whether a response exists and, if so, returns it right away.",
      "La regla clave: si un filtro renderiza o redirige, la cadena se detiene. Rails salta los filtros restantes Y la acción misma. Nuestra mini versión hace lo mismo: tras cada filtro revisa si ya hay respuesta y, si la hay, la devuelve de inmediato.",
      "大事なルール：フィルターが render か redirect をすると、チェーンは止まる。Rails は残りのフィルターもアクション自体も飛ばす。ミニ版も同じで、フィルターのたびにレスポンスがあるか確かめ、あればすぐに返すよ。",
    ),
    p(
      "Common mistake: thinking redirect_to stops the method on the spot. It only sets the response; code after it in the same method still runs. What stops the action is the chain noticing the response. That's why a hand-made filter loop must check for a response after every filter.",
      "Error común: creer que redirect_to detiene el método en el acto. Solo fija la respuesta; el código que sigue en el mismo método igual corre. Lo que frena la acción es que la cadena note la respuesta. Por eso un bucle de filtros hecho a mano debe revisar la respuesta tras cada filtro.",
      "よくあるミス：redirect_to でメソッドがその場で止まると思うこと。レスポンスを決めるだけで、同じメソッドのあとのコードは動く。アクションを止めるのは、チェーンがレスポンスに気づくこと。だから自作のフィルターループは、毎回レスポンスを確かめる必要がある。",
    ),
  ),
  note("render-redirect", L("render or redirect_to?", "¿render o redirect_to?", "render か redirect_to か"),
    p(
      "Both finish an action, but differently. render builds the page right now, inside the same request, with the same instance variables. redirect_to answers with status 302 and a new address; the browser then makes a brand-new request, and everything from the old one, your @variables included, is gone.",
      "Ambos terminan una acción, pero distinto. render arma la página ahora mismo, dentro de la misma petición, con las mismas variables de instancia. redirect_to responde con estado 302 y una dirección nueva; el navegador hace entonces una petición nueva, y todo lo de la anterior, tus @variables incluidas, se pierde.",
      "どちらもアクションを終えるが、やり方がちがう。render は同じリクエストの中で、同じインスタンス変数を使ってその場でページを作る。redirect_to はステータス 302 と新しいアドレスを返し、ブラウザがまったく新しいリクエストを送る。前のリクエストのもの（@変数も）は全部消える。",
    ),
    p(
      "Use redirect_to after something succeeded: a saved record sends you to its page, so refreshing the browser doesn't submit the form twice. This is called the Post/Redirect/Get pattern.",
      "Usa redirect_to cuando algo salió bien: un registro guardado te manda a su página, así recargar el navegador no envía el formulario dos veces. Esto se llama el patrón Post/Redirect/Get.",
      "成功したあとは redirect_to。保存したレコードのページへ送れば、ブラウザを再読みこみしてもフォームが二重送信されない。これを Post/Redirect/Get パターンと呼ぶ。",
    ),
    rails("def destroy\n  @book.destroy\n  redirect_to books_path, status: :see_other\nend",
      L("Real Rails: after a change succeeds, redirect", "Rails real: si el cambio sale bien, redirige", "本物の Rails：変更が成功したらリダイレクト")),
    p(
      "When a save fails, you want the same form back, filled in, with error messages. Those live in the object that failed (its errors), so you must stay in this request and show the form template again. The Rails guides add status: :unprocessable_entity (422) so the browser knows the submit failed.",
      "Cuando un guardado falla, quieres el mismo formulario de vuelta, lleno y con mensajes de error. Esos viven en el objeto que falló (sus errors), así que debes quedarte en esta petición y mostrar otra vez la plantilla del formulario. Las guías de Rails añaden status: :unprocessable_entity (422) para que el navegador sepa que falló.",
      "保存に失敗したら、入力済みでエラーメッセージ付きの同じフォームを返したい。それらは失敗したオブジェクト（の errors）の中にあるので、このリクエストにとどまってフォームのテンプレートをもう一度表示する。Rails ガイドでは status: :unprocessable_entity（422）を付けて失敗を伝えるよ。",
    ),
    p(
      "Common mistake: redirecting after a failed save. The new request starts from zero: the typed values and the error messages vanish, and the user sees an empty form with no idea what went wrong.",
      "Error común: redirigir tras un guardado fallido. La nueva petición empieza de cero: los valores escritos y los mensajes de error desaparecen, y el usuario ve un formulario vacío sin saber qué salió mal.",
      "よくあるミス：保存失敗のあとにリダイレクトすること。新しいリクエストはゼロから始まるので、入力した値もエラーメッセージも消え、ユーザーは何が悪かったのかわからない空のフォームを見ることになる。",
    ),
  ),
  note("erb-tags", L("ERB: <% %> and <%= %>", "ERB: <% %> y <%= %>", "ERB の <% %> と <%= %>"),
    p(
      "Rails views are ERB templates: HTML with Ruby tucked inside tags. ERB reads the template top to bottom, copying plain text as is and handling two kinds of tags differently. Ruby's standard library ships an ERB class, so these examples run with plain Ruby.",
      "Las vistas de Rails son plantillas ERB: HTML con Ruby metido en etiquetas. ERB lee la plantilla de arriba abajo, copia el texto normal tal cual y trata dos tipos de etiquetas de forma distinta. La biblioteca estándar de Ruby trae una clase ERB, así que estos ejemplos corren con Ruby puro.",
      "Rails のビューは ERB テンプレート。タグの中に Ruby を入れた HTML だ。ERB はテンプレートを上から読み、普通の文字はそのまま写し、2種類のタグを別々に扱う。Ruby の標準ライブラリにも ERB クラスがあるので、この例は素の Ruby で動くよ。",
    ),
    p(
      "<% code %> runs Ruby and writes nothing: use it for assignments, if and loops. <%= code %> runs Ruby and writes the result into the output. The only difference is the =, and it's the most common slip: forget it and your value silently disappears.",
      "<% código %> corre Ruby y no escribe nada: úsalo para asignaciones, if y bucles. <%= código %> corre Ruby y escribe el resultado en la salida. La única diferencia es el =, y es el despiste más común: si lo olvidas, tu valor desaparece en silencio.",
      "<% コード %> は Ruby を実行するが何も書かない。代入・if・ループに使う。<%= コード %> は実行して結果を出力に書く。ちがいは = だけ。これが一番多いうっかりミスで、= を忘れると値が静かに消える。",
    ),
    ex('require "erb"\nputs ERB.new("<% n = 3 %><%= n %>-<% n + 1 %>-<%= n + 1 %>").result', "3--4",
      L("The <% %> in the middle computes 4 but writes nothing", "El <% %> del medio calcula 4 pero no escribe nada", "まん中の <% %> は 4 を計算するが何も書かない")),
    p(
      "A loop opens in one <% %> tag and closes in another (<% end %>). Everything between them, plain text included, is repeated once per turn. That's how a view prints one <li> per record. result(binding) hands the template your local variables; in Rails, the instance variables you set in the action (@posts) reach the view for you.",
      "Un bucle se abre en una etiqueta <% %> y se cierra en otra (<% end %>). Todo lo que hay entre ellas, texto incluido, se repite en cada vuelta. Así una vista imprime un <li> por registro. result(binding) le pasa tus variables locales a la plantilla; en Rails, las variables de instancia de la acción (@posts) llegan solas a la vista.",
      "ループは1つの <% %> で始まり、別の <% end %> で閉じる。そのあいだのものは文字も含めて1周ごとにくり返される。こうしてビューはレコードごとに <li> を出す。result(binding) はローカル変数をテンプレートに渡す。Rails ではアクションで作った @posts などが自動でビューに届くよ。",
    ),
    ex('require "erb"\ncolors = %w[red blue]\nputs ERB.new("<% colors.each do |c| %>(<%= c %>)<% end %>").result(binding)', "(red)(blue)",
      L("The text between the loop tags repeats once per item", "El texto entre las etiquetas del bucle se repite por elemento", "ループのタグのあいだが要素ごとにくり返す")),
  ),
  note("escape-html", L("Escaping HTML with h", "Escapar HTML con h", "h で HTML をエスケープ"),
    p(
      "Anything a user types can end up in your page: a name, a comment, a title. If that text contains a <script> tag and you write it into the HTML as is, the browser runs it. That attack is called XSS (cross-site scripting): the attacker's code runs with your visitor's session.",
      "Todo lo que escribe un usuario puede acabar en tu página: un nombre, un comentario, un título. Si ese texto trae una etiqueta <script> y lo escribes en el HTML tal cual, el navegador lo ejecuta. Ese ataque se llama XSS (cross-site scripting): el código del atacante corre con la sesión de tu visitante.",
      "ユーザーが入力したものは何でもページに出る可能性がある。名前、コメント、タイトル。その文字に <script> タグがあり、そのまま HTML に書くと、ブラウザが実行してしまう。これが XSS（クロスサイトスクリプティング）。攻撃者のコードが訪問者のセッションで動くんだ。",
    ),
    p(
      "Escaping is the cure. h (short for html_escape, in ERB::Util) replaces the characters HTML treats as special: < becomes &lt;, > becomes &gt;, & becomes &amp;, and quotes become &quot; or &#39;. The browser then shows those characters instead of reading them as tags.",
      "Escapar es la cura. h (abreviatura de html_escape, en ERB::Util) reemplaza los caracteres que HTML trata como especiales: < pasa a &lt;, > a &gt;, & a &amp; y las comillas a &quot; o &#39;. Así el navegador muestra esos caracteres en vez de leerlos como etiquetas.",
      "治し方はエスケープ。h（ERB::Util の html_escape の短縮形）は HTML で特別な文字を置きかえる。< は &lt;、> は &gt;、& は &amp;、引用符は &quot; か &#39; に。するとブラウザはタグとして読まず、文字として表示する。",
    ),
    ex('require "erb"\nputs ERB::Util.h("<i>Tom & Jerry</i>")', "&lt;i&gt;Tom &amp; Jerry&lt;/i&gt;",
      L("Special characters become harmless entities", "Los caracteres especiales se vuelven entidades inofensivas", "特別な文字が無害な表記になる")),
    p(
      "Rails escapes every <%= %> for you automatically. Plain Ruby ERB, the one in our mini version, does not: you must call h yourself. In Rails, raw(...) and .html_safe switch the escaping off, so never use them on text a user can control.",
      "Rails escapa cada <%= %> automáticamente. El ERB de Ruby puro, el de nuestra mini versión, no: debes llamar a h tú mismo. En Rails, raw(...) y .html_safe apagan el escape, así que nunca los uses con texto que un usuario pueda controlar.",
      "Rails はすべての <%= %> を自動でエスケープする。ミニ版で使う素の Ruby の ERB はしないので、自分で h を呼ぶ。Rails の raw(...) や .html_safe はエスケープを切るので、ユーザーが変えられる文字には使わないこと。",
    ),
    ex('require "erb"\ninclude ERB::Util\nname = "<u>Zed</u>"\nputs ERB.new("<%= name %>|<%= h(name) %>").result(binding)', "<u>Zed</u>|&lt;u&gt;Zed&lt;/u&gt;",
      L("Plain ERB: only the h(...) side is escaped", "ERB puro: solo el lado con h(...) se escapa", "素の ERB：h(...) の側だけエスケープ")),
    p(
      "Common mistake: escaping too early or twice. Escape at the moment you write text into HTML, not when you save it; escaping twice puts garbage like &amp;lt; on the screen.",
      "Error común: escapar demasiado pronto o dos veces. Escapa en el momento de escribir el texto en el HTML, no al guardarlo; escapar dos veces muestra basura como &amp;lt; en pantalla.",
      "よくあるミス：早すぎるエスケープや二重エスケープ。保存するときではなく、HTML に書く瞬間にエスケープしよう。二重にすると画面に &amp;lt; のようなゴミが出る。",
    ),
  ),
];

// ─── 3.3 Guards and scribes: filters and views ─────────────────────────────
const filtersAndViews: LessonDef = {
  slug: "filters-and-views",
  title: L("Guards and scribes", "Guardias y escribas", "門番と書記"),
  concept: "filters-and-views",
  mode: "lesson",
  xp: 75,
  enemy: "slime",
  enemyName: L("SCRIPT SLIME", "SLIME SCRIPT", "スクリプトスライム"),
  notes: filtersNotes,
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
      hint: L("Check the only: list for each action. When the filter does run, is there a user?", "Revisa la lista only: para cada acción. Cuando el filtro sí corre, ¿hay usuario?", "アクションごとに only: を確かめよう。フィルターが動くとき、ユーザーはいる？"),
      note: "before-action",
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
      hint: L("This time a user is passed in. Does the guard set a response?", "Esta vez se pasa un usuario. ¿El guardia fija una respuesta?", "今回はユーザーが渡されている。門番はレスポンスを決める？"),
      note: "before-action",
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
      hint: L("Recall the rule: what happens to the rest of the chain once a filter redirects?", "Recuerda la regla: ¿qué pasa con el resto de la cadena cuando un filtro redirige?", "ルールを思い出そう。フィルターがリダイレクトしたら、残りのチェーンは？"),
      note: "before-action",
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
      hint: L("Which one stays in this request, so @post and its errors are still there for the view?", "¿Cuál se queda en esta petición, para que @post y sus errores sigan ahí para la vista?", "同じリクエストにとどまり、@post とエラーをビューに残せるのはどっち？"),
      note: "render-redirect",
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
      hint: L("Which tag writes its result into the page, and which one only runs code?", "¿Qué etiqueta escribe su resultado en la página y cuál solo corre código?", "結果をページに書くタグはどれ？コードを動かすだけのタグは？"),
      note: "erb-tags",
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
      hint: L("Text between the loop's tags repeats once per item. What does <%= i %> write each time?", "El texto entre las etiquetas del bucle se repite por elemento. ¿Qué escribe <%= i %> cada vez?", "ループのタグのあいだは要素ごとにくり返す。<%= i %> は毎回何を書く？"),
      note: "erb-tags",
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
      hint: L("Only one line passes the title through h. Does plain ERB escape anything by itself?", "Solo una línea pasa el título por h. ¿El ERB puro escapa algo por sí solo?", "h を通しているのは1行だけ。素の ERB は自分で何かエスケープする？"),
      note: "escape-html",
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
      hint: L("Plain ERB won't escape for you. Use the short helper that include ERB::Util brought in.", "El ERB puro no escapa por ti. Usa el helper corto que trajo include ERB::Util.", "素の ERB はエスケープしない。include ERB::Util で使える短いヘルパーを使おう。"),
      note: "escape-html",
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
      hint: L("Each filter may set @response. What should the loop do right after a filter answers?", "Cada filtro puede fijar @response. ¿Qué debe hacer el bucle justo después de que un filtro responde?", "フィルターは @response を決めることがある。応答したらループはすぐ何をする？"),
      note: "before-action",
      explain: L(
        "After each filter, stop if it answered: return @response if @response. Otherwise index overwrites the redirect with 200 secret.",
        "Tras cada filtro, para si respondió: return @response if @response. Si no, index pisa el redirect con 200 secret.",
        "フィルターごとに、応答があれば return @response if @response。でないと index が上書きしちゃう。",
      ),
    },
  ],
};

const jobsNotes: NoteDef[] = [
  note("background-jobs", L("Background jobs: later, not now", "Jobs en segundo plano: luego", "バックグラウンドジョブ"),
    p(
      "Some work is too slow to do while a visitor waits: sending email, resizing images, calling another service. Active Job lets you hand that work to a queue. perform_later stores the job class and its arguments and returns at once, so the page can answer fast.",
      "Algunos trabajos son demasiado lentos para hacerlos mientras el visitante espera: enviar correo, redimensionar imágenes, llamar a otro servicio. Active Job te deja pasar ese trabajo a una cola. perform_later guarda la clase del job y sus argumentos y vuelve enseguida, así la página responde rápido.",
      "訪問者を待たせてやるには遅すぎる仕事がある。メール送信、画像の縮小、ほかのサービスの呼び出し。Active Job はその仕事をキューに渡せる。perform_later はジョブのクラスと引数をしまってすぐ戻るので、ページは速く返せるよ。",
    ),
    p(
      "A separate process, the worker, takes jobs off the queue one by one and runs them. Our mini version uses an array as the queue: perform_later pushes onto it, and the worker shifts a job off and calls perform_now, which runs the job immediately, right where it's called.",
      "Un proceso aparte, el worker, saca los jobs de la cola uno por uno y los ejecuta. Nuestra mini versión usa un array como cola: perform_later empuja ahí, y el worker saca un job con shift y llama a perform_now, que lo ejecuta de inmediato, justo donde se llama.",
      "別のプロセスであるワーカーが、キューからジョブを1つずつ取り出して実行する。ミニ版は配列をキューにしている。perform_later が積み、ワーカーが shift で取り出して perform_now を呼ぶ。perform_now はその場ですぐにジョブを実行するんだ。",
    ),
    ex('QUEUE = []\nlater = ->(task) { QUEUE << task; "queued" }\nputs later.("resize photo 3")\nputs "page sent"\nputs "worker: #{QUEUE.shift}"', "queued\npage sent\nworker: resize photo 3",
      L("The page answers first; the work happens when a worker picks it up", "La página responde primero; el trabajo ocurre cuando lo toma un worker", "ページが先に返り、仕事はワーカーが取ったときに")),
    p(
      "Arguments must be serializable, because Rails stores them with the job. Records are stored as a reference (a GlobalID) and loaded again from the database when the job runs, so the worker sees fresh data.",
      "Los argumentos deben poder serializarse, porque Rails los guarda con el job. Los registros se guardan como una referencia (un GlobalID) y se vuelven a cargar de la base de datos cuando el job corre, así el worker ve datos frescos.",
      "Rails は引数をジョブと一緒に保存するので、引数はシリアライズできるものにする。レコードは参照（GlobalID）として保存され、ジョブ実行時にデータベースから読み直されるので、ワーカーは最新のデータを見るよ。",
    ),
    p(
      "Jobs can run more than once: if a worker crashes halfway, or a retry kicks in after an error, the same job runs again. So make jobs idempotent: running one twice must leave things exactly as running it once. A common trick is to record what's done and skip it next time.",
      "Los jobs pueden correr más de una vez: si un worker se cae a medias, o entra un reintento tras un error, el mismo job corre otra vez. Así que hazlos idempotentes: correrlo dos veces debe dejar todo igual que correrlo una. Un truco común es anotar lo hecho y saltarlo la próxima vez.",
      "ジョブは2回以上動くことがある。ワーカーが途中で落ちたり、エラー後にリトライされたりすると、同じジョブがまた動く。だからジョブは冪等にしよう。2回動いても1回と同じ状態になること。よくある方法は、済んだことを記録して次はスキップすることだ。",
    ),
    ex('DONE = []\ndef send_receipt(id)\n  return "already sent #{id}" if DONE.include?(id)\n  DONE << id\n  "sent #{id}"\nend\nputs send_receipt(8)\nputs send_receipt(8)', "sent 8\nalready sent 8",
      L("A retry finds the record of the first run and does nothing", "Un reintento halla la marca de la primera vez y no hace nada", "リトライは1回目の記録を見て何もしない")),
  ),
  note("cache-fetch", L("Caching with fetch", "Caché con fetch", "fetch でキャッシュ"),
    p(
      "A cache is a chest where you keep results that are expensive to compute, so later requests can reuse them. The usual method is fetch(key) { block }: if the key is in the cache, return the stored value and skip the block; if not, run the block, store its result under the key and return it.",
      "Una caché es un cofre donde guardas resultados caros de calcular, para que las peticiones siguientes los reutilicen. El método usual es fetch(key) { bloque }: si la clave está en la caché, devuelve el valor guardado y salta el bloque; si no, corre el bloque, guarda su resultado con esa clave y lo devuelve.",
      "キャッシュは、計算に時間がかかる結果をしまっておく宝箱。あとのリクエストで使い回せる。ふつうは fetch(key) { ブロック } を使う。キーがあれば保存済みの値を返してブロックは飛ばす。なければブロックを実行し、結果をそのキーで保存して返す。",
    ),
    ex('STORE = {}\ndef fetch(key)\n  return STORE[key] if STORE.key?(key)\n  STORE[key] = yield\nend\n3.times { fetch(:menu) { puts "cooking"; "soup" } }\nputs fetch(:menu) { "never" }', "cooking\nsoup",
      L("Three calls, one miss: the block runs only the first time", "Tres llamadas, un fallo: el bloque corre solo la primera vez", "3回呼んで見つからないのは1回だけ")),
    p(
      "Rails.cache works the same way and takes options such as expires_in: 12.hours, which sets how long a value lives; after that, the block runs again. Pick keys that change when the data changes (for example, include a record's updated_at) so you never serve stale data.",
      "Rails.cache funciona igual y acepta opciones como expires_in: 12.hours, que fija cuánto vive un valor; después, el bloque corre de nuevo. Elige claves que cambien cuando cambian los datos (por ejemplo, incluye el updated_at del registro) para nunca servir datos viejos.",
      "Rails.cache も同じしくみで、expires_in: 12.hours のようなオプションで値の寿命を決められる。期限が過ぎるとブロックがまた動く。データが変わるとキーも変わるようにしよう（例：レコードの updated_at を入れる）。古いデータを出さずにすむ。",
    ),
    p(
      "Watch out for nil. A shortcut like cache[key] ||= compute looks like a cache, but ||= assigns only when the current value is nil or false. If compute returns nil or false, nothing sticks and the slow work runs on every call. Checking key? stores those values like any other.",
      "Cuidado con nil. Un atajo como cache[key] ||= calcular parece una caché, pero ||= asigna solo si el valor actual es nil o false. Si calcular devuelve nil o false, nada se queda y el trabajo lento corre en cada llamada. Revisar key? guarda esos valores como cualquier otro.",
      "nil に注意。cache[key] ||= compute はキャッシュに見えるが、||= は今の値が nil か false のときだけ代入する。compute が nil や false を返すと何も残らず、遅い処理が毎回動く。key? で確かめれば、そういう値もほかと同じように保存できる。",
    ),
    ex('memo = {}\n2.times { memo[:on] ||= (puts "slow"; false) }\np memo', "slow\nslow\n{on: false}",
      L("false is stored, yet ||= runs the slow part again", "false se guarda, pero ||= corre otra vez la parte lenta", "false は入るのに ||= は遅い処理をまた動かす")),
    p(
      "Common mistake: thinking a cached value is computed again each time. With fetch, the block runs only on a miss; another fetch with the same key never runs it until the entry expires or is deleted.",
      "Error común: creer que un valor en caché se calcula de nuevo cada vez. Con fetch, el bloque corre solo cuando falta la clave; otro fetch con la misma clave no lo corre hasta que la entrada expire o se borre.",
      "よくあるミス：キャッシュした値が毎回計算し直されると思うこと。fetch のブロックはキーがないときだけ動く。同じキーの fetch は、期限切れか削除まではブロックを動かさない。",
    ),
  ),
  note("sql-injection", L("SQL injection and placeholders", "Inyección SQL y placeholders", "SQL インジェクションと ?"),
    p(
      "SQL injection happens when user input becomes part of the SQL code itself. If you build a query with string interpolation, a quote inside the input closes your string early, and whatever follows is read as SQL. An input ending in OR 1=1 turns \"find this one\" into \"every row\".",
      "La inyección SQL ocurre cuando la entrada del usuario se vuelve parte del propio código SQL. Si armas una consulta con interpolación, una comilla en la entrada cierra tu string antes de tiempo, y lo que sigue se lee como SQL. Una entrada que termina en OR 1=1 convierte \"busca este\" en \"todas las filas\".",
      "SQL インジェクションは、ユーザーの入力が SQL のコードそのものになってしまうこと。文字列の埋めこみでクエリを作ると、入力の中の ' で文字列が早く閉じ、続きが SQL として読まれる。OR 1=1 で終わる入力なら「これを探す」が「全行」に変わる。",
    ),
    ex(String.raw`code = "z' OR 1=1 --"
puts "SELECT * FROM items WHERE code = '#{code}'"`, "SELECT * FROM items WHERE code = 'z' OR 1=1 --'",
      L("The input's quote ends the string; the rest becomes SQL", "La comilla de la entrada cierra el string; el resto es SQL", "入力の ' で文字列が閉じ、残りが SQL になる")),
    p(
      "The fix is a placeholder: write ? where the value goes and pass the value separately. The database layer then quotes it. In SQL, a quote inside a string is written as two quotes (''), so the attacker's quote stays a harmless character inside the value.",
      "La solución es un placeholder: escribe ? donde va el valor y pasa el valor aparte. La capa de base de datos lo cita. En SQL, una comilla dentro de un string se escribe con dos comillas (''), así la comilla del atacante queda como un carácter inofensivo dentro del valor.",
      "直し方はプレースホルダー。値の場所に ? を書き、値は別に渡す。するとデータベースの層が値を囲む。SQL では文字列の中の ' は '' と2つ書くので、攻撃者の ' は値の中のただの文字になる。",
    ),
    exWith(QUOTE, String.raw`puts where("SELECT * FROM items WHERE code = ?", "z' OR 1=1 --")`, "SELECT * FROM items WHERE code = 'z'' OR 1=1 --'",
      L("Our mini where: the value is quoted, so it stays one value", "Nuestro mini where: el valor se cita y sigue siendo un valor", "ミニ版 where：値が囲まれて1つの値のまま")),
    p(
      "In Rails, the safe forms are a placeholder with the value passed after it, or the hash form where(name: value); both quote for you. Interpolating params into a SQL string is never safe, even when it looks fine with normal input.",
      "En Rails, las formas seguras son un placeholder con el valor pasado después, o la forma de hash where(name: value); ambas citan por ti. Interpolar params en un string SQL nunca es seguro, aunque parezca bien con entradas normales.",
      "Rails で安全なのは、? を書いて値をあとに渡す形か、where(name: value) のハッシュの形。どちらも値を囲んでくれる。params を SQL の文字列に埋めこむのは、普通の入力でうまく動いて見えても決して安全ではない。",
    ),
    p(
      "Common mistake: writing the ? but forgetting to pass the value, or interpolating anyway. With no values passed after the SQL, there is nothing to quote: the string goes to the database exactly as you built it.",
      "Error común: escribir el ? pero olvidar pasar el valor, o interpolar igual. Sin valores pasados tras el SQL, no hay nada que citar: el string llega a la base de datos tal como lo armaste.",
      "よくあるミス：? を書いたのに値を渡し忘れる、または結局埋めこんでしまうこと。SQL のあとに値がなければ囲むものがなく、文字列は作ったままデータベースに届く。",
    ),
  ),
  note("csrf", L("CSRF tokens", "Tokens CSRF", "CSRF トークン"),
    p(
      "CSRF (cross-site request forgery) is a trick where another site makes your browser send a request to an app you're logged into. The browser attaches your cookies automatically, so without protection the app can't tell a real click from a forged one.",
      "CSRF (cross-site request forgery) es un truco en el que otro sitio hace que tu navegador envíe una petición a una app donde tienes sesión. El navegador adjunta tus cookies solo, así que sin protección la app no distingue un clic real de uno falsificado.",
      "CSRF（クロスサイトリクエストフォージェリ）は、別のサイトがあなたのブラウザに、ログイン中のアプリへのリクエストを送らせる手口。ブラウザはクッキーを自動で付けるので、守りがないとアプリは本物のクリックと偽物を見分けられない。",
    ),
    p(
      "Rails' defense: every form it renders carries a secret token tied to your session. On every request that isn't GET or HEAD, Rails compares the submitted token with the session's. A forged request from another site can't know the token, so it is rejected.",
      "La defensa de Rails: cada formulario que renderiza lleva un token secreto atado a tu sesión. En cada petición que no sea GET ni HEAD, Rails compara el token enviado con el de la sesión. Una petición falsa desde otro sitio no puede conocer el token, así que se rechaza.",
      "Rails の守り：Rails が作るフォームには、セッションに結びついた秘密のトークンが入っている。GET と HEAD 以外のリクエストでは、送られたトークンをセッションのものと比べる。別サイトからの偽リクエストはトークンを知らないので拒否される。",
    ),
    ex('secret = "s3cr3t"\nok = ->(verb, token) { %w[GET HEAD].include?(verb) || token == secret }\np ok.("HEAD", nil)\np ok.("DELETE", nil)\np ok.("DELETE", "s3cr3t")', "true\nfalse\ntrue",
      L("Reading verbs pass; changing verbs need the session's token", "Los verbos de lectura pasan; los que cambian necesitan el token", "読むメソッドは通り、変えるメソッドはトークンが必要")),
    p(
      "Because GET skips the check, a GET must never change data. A link like GET /posts/5/delete could be fired by an image tag on any site. Changes go through POST, PATCH or DELETE, which carry the token.",
      "Como GET se salta la revisión, un GET nunca debe cambiar datos. Un enlace como GET /posts/5/delete podría dispararse con una etiqueta de imagen en cualquier sitio. Los cambios van por POST, PATCH o DELETE, que llevan el token.",
      "GET はチェックを通らずに済むので、GET でデータを変えてはいけない。GET /posts/5/delete のようなリンクは、どのサイトの画像タグからでも呼ばれてしまう。変更は、トークンを運ぶ POST・PATCH・DELETE で行おう。",
    ),
    p(
      "Don't confuse CSRF protection with strong parameters: CSRF checks WHERE a request came from (your own form or not); strong parameters check WHICH fields it may set. An app needs both.",
      "No confundas la protección CSRF con los strong parameters: CSRF revisa DE DÓNDE vino una petición (tu formulario o no); los strong parameters revisan QUÉ campos puede cambiar. Una app necesita ambos.",
      "CSRF 対策とストロングパラメータを混同しないで。CSRF はリクエストが「どこから」来たか（自分のフォームか）を確かめ、ストロングパラメータは「どの項目」を変えてよいかを確かめる。アプリには両方必要だ。",
    ),
  ),
];

// ─── 3.4 Ravens, chests and locks: jobs, cache and security ────────────────
const jobsCacheSecurity: LessonDef = {
  slug: "jobs-cache-security",
  title: L("Ravens, chests, locks", "Cuervos, cofres, candados", "カラスと宝箱と錠前"),
  concept: "jobs-cache-security",
  mode: "lesson",
  xp: 80,
  enemy: "golem",
  enemyName: L("LOCKPICK GOLEM", "GÓLEM GANZÚA", "カギあけゴーレム"),
  notes: jobsNotes,
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
      hint: L("Does perform_later do the work, or only store it? When does the worker run it?", "¿perform_later hace el trabajo o solo lo guarda? ¿Cuándo lo ejecuta el worker?", "perform_later は仕事をする？しまうだけ？ワーカーが動かすのはいつ？"),
      note: "background-jobs",
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
      hint: L("Follow SENT across both calls. What does the second call find in it?", "Sigue SENT en las dos llamadas. ¿Qué encuentra la segunda llamada ahí?", "2回の呼び出しで SENT を追いかけよう。2回目はそこに何を見つける？"),
      note: "background-jobs",
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
      hint: L("On the first fetch the key is missing. On the second, is it there?", "En el primer fetch la clave no está. En el segundo, ¿está?", "1回目の fetch ではキーがない。2回目はある？"),
      note: "cache-fetch",
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
      hint: L("When does ||= assign? Look at what the block returns.", "¿Cuándo asigna ||=? Mira lo que devuelve el bloque.", "||= が代入するのはいつ？ブロックが返す値を見よう。"),
      note: "cache-fetch",
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
      hint: L("Look back at the mini cache in this lesson: Rails.cache uses the same method name.", "Mira la mini caché de esta lección: Rails.cache usa el mismo nombre de método.", "このレッスンのミニ版キャッシュを思い出そう。Rails.cache も同じメソッド名だ。"),
      note: "cache-fetch",
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
      hint: L("Line one pastes the input into the SQL. In line two, what does quote do to each ' inside it?", "La primera línea pega la entrada en el SQL. En la segunda, ¿qué hace quote con cada ' que lleva?", "1行目は入力を SQL に貼るだけ。2行目の quote は中の ' をどうする？"),
      note: "sql-injection",
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
      hint: L("Which one lets Rails quote the value, and which pastes raw input into the SQL text?", "¿Cuál deja que Rails cite el valor y cuál pega la entrada cruda en el texto SQL?", "Rails が値を囲めるのはどっち？生の入力を SQL に貼るのはどっち？"),
      note: "sql-injection",
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
      hint: L("Which verb skips the token check? For the others, compare each token with the session's.", "¿Qué verbo se salta la revisión del token? En los demás, compara cada token con el de la sesión.", "トークンの確認を飛ばすメソッドは？ほかはセッションのトークンと比べよう。"),
      note: "csrf",
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
      hint: L("Our where only quotes values passed as extra arguments. Right now name is pasted into the string.", "Nuestro where solo cita valores pasados como argumentos extra. Ahora name está pegado en el string.", "ミニ版 where は追加の引数で渡した値だけ囲む。今 name は文字列に貼られている。"),
      note: "sql-injection",
      explain: L(
        "Write ? in the SQL and pass name as a bind: where quotes it, so the attacker's quote can't close the string.",
        "Escribe ? en el SQL y pasa name como valor: where lo cita, así la comilla del atacante no cierra el string.",
        "SQL に ? を書き、name を別に渡そう。where が囲むので攻撃者の ' で文字列は閉じない。",
      ),
    },
  ],
};

const dragonNotes: NoteDef[] = [
  note("recap-routes", L("Recap: routes", "Repaso: rutas", "復習：ルート"),
    p(
      "The router tries its routes from top to bottom and the first one whose verb and whole path fit wins. A :placeholder matches any text up to the next slash, including words like new or me, and stores it as a string.",
      "El router prueba sus rutas de arriba abajo y gana la primera cuyo verbo y ruta completa encajan. Un :comodín encaja con cualquier texto hasta la siguiente barra, incluidas palabras como new o me, y lo guarda como string.",
      "ルーターはルートを上から試し、メソッドとパス全体が合った最初のものが勝つ。:プレースホルダーは次の / までの文字なら何でも合い（new や me のような単語も）、文字列として保存する。",
    ),
    p(
      "So fixed paths must come before placeholders. If a placeholder route sits above a fixed one, the fixed route can never be reached.",
      "Por eso las rutas fijas deben ir antes que los comodines. Si una ruta con comodín está por encima de una fija, nunca se llega a la fija.",
      "だから固定パスはプレースホルダーより前に置く。プレースホルダーのルートが固定のルートより上にあると、固定のほうには決して届かない。",
    ),
    exWith(RECOGNIZE, 'ROUTES = [["GET", "/users/me", "users#me"], ["GET", "/users/:name", "users#show"]]\np recognize("GET", "/users/me")\np recognize("GET", "/users/ann")',
      '["users#me", {}]\n["users#show", {name: "ann"}]',
      L("Fixed path first: both routes are reachable", "Ruta fija primero: se llega a las dos", "固定パスが先なら両方に届く")),
  ),
  note("recap-params", L("Recap: strong parameters", "Repaso: strong parameters", "復習：ストロングパラメータ"),
    p(
      "Never hand a whole params hash to a model: that's mass assignment, and an attacker can add keys like admin. permit is an allow list: a key survives only if it is listed and was actually sent; everything else is dropped.",
      "Nunca le pases un hash params entero a un modelo: eso es asignación masiva, y un atacante puede añadir claves como admin. permit es una lista de permitidos: una clave sobrevive solo si está listada y de verdad se envió; todo lo demás se descarta.",
      "params ハッシュを丸ごとモデルに渡さないこと。それは一括代入で、攻撃者が admin のようなキーを足せる。permit は許可リスト。リストにあって実際に送られたキーだけが残り、ほかは捨てられる。",
    ),
    exWith(PARAMS, 'form = Params.new({"name" => "Ivy", "role" => "boss"})\np form.permit("name", "email")', '{"name" => "Ivy"}',
      L("role isn't listed and email wasn't sent", "role no está listada y email no se envió", "role はリストになく、email は送られていない")),
    p(
      "Strong parameters decide WHICH fields a request may set. CSRF protection is a different lock: it checks that a non-GET request came from your own form. Validations check the values themselves, after assignment.",
      "Los strong parameters deciden QUÉ campos puede fijar una petición. La protección CSRF es otro candado: revisa que una petición no GET venga de tu propio formulario. Las validaciones revisan los valores mismos, después de asignarlos.",
      "ストロングパラメータは、リクエストが「どの項目」を設定できるかを決める。CSRF 対策は別の錠前で、GET 以外のリクエストが自分のフォームから来たかを確かめる。バリデーションは代入後に値そのものを確かめる。",
    ),
  ),
  note("recap-trip", L("Recap: one request's trip", "Repaso: el viaje de una petición", "復習：リクエストの旅"),
    p(
      "A request's trip through Rails: the router matches verb and path to controller#action; the before_action filters run in order; if none of them rendered or redirected, the action runs; the action renders a view; the response goes back to the browser.",
      "El viaje de una petición por Rails: el router empareja verbo y ruta con controlador#acción; los filtros before_action corren en orden; si ninguno renderizó ni redirigió, corre la acción; la acción renderiza una vista; la respuesta vuelve al navegador.",
      "Rails でのリクエストの旅：ルーターがメソッドとパスをコントローラー#アクションに結びつける。before_action フィルターが順に動く。どれも render も redirect もしなければアクションが動く。アクションがビューを描き、レスポンスがブラウザへ返る。",
    ),
    exWith(MINI_CONTROLLER, `${SHOP_CONTROLLER}\nputs ShopController.new.process(:buy)`, "302 /join",
      L("A guard that redirects: the action never runs", "Un guardia que redirige: la acción nunca corre", "リダイレクトする門番：アクションは動かない")),
    p(
      "The view itself is wrapped in a layout: the shared page frame (header, menu, footer). Where the layout says yield, Rails inserts the view's HTML. A Ruby method with yield works the same way: the block's result appears exactly where yield sits.",
      "La vista misma va envuelta en un layout: el marco común de la página (cabecera, menú, pie). Donde el layout dice yield, Rails mete el HTML de la vista. Un método Ruby con yield funciona igual: el resultado del bloque aparece justo donde está yield.",
      "ビューはレイアウトに包まれる。レイアウトはヘッダー・メニュー・フッターなどの共通のページ枠だ。レイアウトの yield の場所に Rails がビューの HTML を入れる。yield を使う Ruby のメソッドも同じで、ブロックの結果がちょうど yield の位置に出る。",
    ),
    ex('def frame = "[top]#{yield}[end]"\nputs frame { "body" }', "[top]body[end]",
      L("yield is the slot where the block's result goes", "yield es el hueco donde va el resultado del bloque", "yield はブロックの結果が入る穴")),
  ),
  note("recap-escape", L("Recap: escaping output", "Repaso: escapar la salida", "復習：出力のエスケープ"),
    p(
      "Text from users must be escaped before it goes into HTML, or a <script> in it would run (XSS). h turns < > & and quotes into entities like &lt;, so the browser shows them as text.",
      "El texto de los usuarios debe escaparse antes de ir al HTML, o un <script> dentro se ejecutaría (XSS). h convierte < > & y las comillas en entidades como &lt;, así el navegador las muestra como texto.",
      "ユーザーの文字は HTML に入れる前にエスケープする。でないと中の <script> が動いてしまう（XSS）。h は < > & や引用符を &lt; などに変え、ブラウザは文字として表示する。",
    ),
    ex('require "erb"\nputs ERB::Util.h("a < b & c")', "a &lt; b &amp; c"),
    p(
      "Rails escapes every <%= %> automatically; plain Ruby ERB doesn't, so with it you call h yourself.",
      "Rails escapa cada <%= %> automáticamente; el ERB de Ruby puro no, así que con él llamas a h tú mismo.",
      "Rails はすべての <%= %> を自動でエスケープする。素の Ruby の ERB はしないので、自分で h を呼ぶ。",
    ),
  ),
  note("recap-cache-sql", L("Recap: cache traps and SQL", "Repaso: trampas de caché y SQL", "復習：キャッシュの罠と SQL"),
    p(
      "||= assigns only when the current value is nil or false. Used as a cache, it never keeps a nil or false result, so the slow block runs every time. A real fetch checks whether the key exists instead.",
      "||= asigna solo si el valor actual es nil o false. Usado como caché, nunca guarda un resultado nil o false, así que el bloque lento corre cada vez. Un fetch de verdad revisa si la clave existe.",
      "||= は今の値が nil か false のときだけ代入する。キャッシュに使うと nil や false の結果は残らず、遅いブロックが毎回動く。本物の fetch はキーがあるかどうかを確かめる。",
    ),
    ex('hits = {}\n2.times { hits[:k] ||= (puts "work"; nil) }\np hits.key?(:k)', "work\nwork\ntrue",
      L("The key exists, but ||= still sees nil and runs again", "La clave existe, pero ||= ve nil y corre otra vez", "キーはあるが ||= は nil を見てまた動く")),
    p(
      "In SQL, values must travel as binds after a ? placeholder, so they get quoted. Pasting input into the SQL text with interpolation leaves nothing to quote, and a quote in the input rewrites the query.",
      "En SQL, los valores deben viajar como binds tras un placeholder ?, para que se citen. Pegar la entrada en el texto SQL con interpolación no deja nada que citar, y una comilla en la entrada reescribe la consulta.",
      "SQL では、値は ? のあとの別の引数として渡し、囲んでもらう。入力を埋めこみで SQL の文字に貼りつけると囲むものがなく、入力の ' がクエリを書きかえてしまう。",
    ),
  ),
];

// ─── BOSS: the Request Dragon ──────────────────────────────────────────────
const requestDragon: LessonDef = {
  slug: "request-dragon",
  title: L("The Request Dragon", "El Dragón Petición", "リクエストドラゴン"),
  concept: "request-cycle",
  mode: "boss",
  xp: 200,
  enemy: "dragon",
  enemyName: L("REQUEST DRAGON", "DRAGÓN PETICIÓN", "リクエスト竜"),
  notes: dragonNotes,
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
      hint: L("Routes are tried top to bottom. Can the first pattern match the word in this path?", "Las rutas se prueban de arriba abajo. ¿El primer patrón puede encajar con la palabra de esta ruta?", "ルートは上から試される。最初のパターンはこのパスの単語に合う？"),
      note: "recap-routes",
      explain: L("The first match wins: /posts/:id swallows new as an id.", "Gana la primera coincidencia: /posts/:id se traga new como id.", "最初の一致が勝つ。/posts/:id が new を id として飲みこむ。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: 'params = Params.new({"title" => "Hi", "admin" => true})\np params.permit("title", "body")',
      options: ['{"title" => "Hi"}', '{"title" => "Hi", "admin" => true}', '{"admin" => true}'], answer: 0,
      output: '{"title" => "Hi"}',
      check: { compiles: true, stdout: '{"title" => "Hi"}', program: `${PARAMS}\nparams = Params.new({"title" => "Hi", "admin" => true})\np params.permit("title", "body")` },
      hint: L("Only keys that are on the permitted list and were also sent survive.", "Solo sobreviven las claves que están en la lista permitida y además se enviaron.", "残るのは、許可リストにあって、しかも送られたキーだけ。"),
      note: "recap-params",
      explain: L("permit keeps only listed keys: admin is dropped.", "permit deja solo las claves listadas: admin se descarta.", "permit はリストのキーだけ。admin は捨てられる。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: `${POSTS_CONTROLLER}\nputs PostsController.new.process(:edit)`,
      options: ["302 /login", "200 form", "nil"], answer: 0,
      output: "302 /login",
      check: { compiles: true, stdout: "302 /login", program: withHelper(MINI_CONTROLLER, `${POSTS_CONTROLLER}\nputs PostsController.new.process(:edit)`) },
      hint: L("No user is passed in. What does the guard do, and does the chain go on?", "No se pasa ningún usuario. ¿Qué hace el guardia y la cadena sigue?", "ユーザーは渡されていない。門番は何をする？チェーンは続く？"),
      note: "recap-trip",
      explain: L("No user: the guard redirects and edit never runs.", "Sin usuario: el guardia redirige y edit no corre.", "ユーザーなし。門番がリダイレクトして edit は動かない。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: 'require "erb"\ninclude ERB::Util\ntitle = "<b>Hi</b>"\nputs ERB.new("<h1><%= h(title) %></h1>").result(binding)',
      options: ["<h1>&lt;b&gt;Hi&lt;/b&gt;</h1>", "<h1><b>Hi</b></h1>", "<h1>Hi</h1>"], answer: 0,
      output: "<h1>&lt;b&gt;Hi&lt;/b&gt;</h1>",
      check: { compiles: true, stdout: "<h1>&lt;b&gt;Hi&lt;/b&gt;</h1>" },
      hint: L("What does h do to < and >?", "¿Qué hace h con < y >?", "h は < と > をどうする？"),
      note: "recap-escape",
      explain: L("h escapes < and >, so the tags show as text.", "h escapa < y >, así las etiquetas se ven como texto.", "h が < と > をエスケープし、タグは文字として出る。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: 'def layout = "<main>#{yield}</main>"\nputs layout { "<p>post</p>" }',
      options: ["<main><p>post</p></main>", "<p>post</p><main></main>", "<main></main>"], answer: 0,
      output: "<main><p>post</p></main>",
      check: { compiles: true, stdout: "<main><p>post</p></main>" },
      hint: L("Where in the string does yield sit, and what does the block return?", "¿Dónde está yield dentro del string y qué devuelve el bloque?", "yield は文字列のどこにある？ブロックは何を返す？"),
      note: "recap-trip",
      explain: L("yield drops the view inside the layout, like a Rails layout's yield.", "yield mete la vista dentro del layout, como el yield de un layout de Rails.", "yield がビューをレイアウトの中に入れる。Rails のレイアウトと同じ。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "predict", time: 18, prompt: PRINT,
      code: NIL_CACHE,
      options: ["query / nil / query / nil", "query / nil / nil", "nil / nil"], answer: 0,
      output: "query\nnil\nquery\nnil",
      check: { compiles: true, stdout: "query\nnil\nquery\nnil" },
      hint: L("When does ||= assign? Look at what the block returns.", "¿Cuándo asigna ||=? Mira lo que devuelve el bloque.", "||= が代入するのはいつ？ブロックが返す値を見よう。"),
      note: "recap-cache-sql",
      explain: L("||= never keeps nil, so the block runs both times.", "||= nunca guarda nil, así que el bloque corre las dos veces.", "||= は nil を保存しないので2回ともブロックが動く。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "order", time: 25,
      prompt: L("Order one request's trip", "Ordena el viaje de una petición", "リクエストの旅を並べよう"),
      lines: ['recognize("GET", "/posts/1")  # router', "require_login  # before_action", "show  # action", 'render("post")  # view', '"200 post"  # response'],
      hint: L("Follow the request from the gate to the answer: who must act first, and who needs the action's result?", "Sigue la petición de la puerta a la respuesta: ¿quién actúa primero y quién necesita el resultado de la acción?", "門から返事までリクエストを追おう。最初に動くのは？アクションの結果が必要なのは？"),
      note: "recap-trip",
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
      hint: L("The danger here is an extra key in the form, not which site sent the request.", "El peligro aquí es una clave extra en el formulario, no qué sitio envió la petición.", "ここでの危険はフォームの余計なキー。どのサイトから来たかではない。"),
      note: "recap-params",
      explain: L("Mass assignment is blocked by require/permit. CSRF protection guards forms, not keys.", "La asignación masiva se frena con require/permit. La protección CSRF cuida formularios, no claves.", "一括代入は require/permit で防ぐ。CSRF 対策はキーではなくフォームを守る。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "predict", time: 20, prompt: PRINT,
      code: `${QUOTE}\ninput = "x' OR '1'='1"\nputs where("SELECT * FROM users WHERE name = '#{input}'")`,
      options: ["SELECT * FROM users WHERE name = 'x' OR '1'='1'", "SELECT * FROM users WHERE name = 'x'' OR ''1''=''1'", "SELECT * FROM users WHERE name = ?"], answer: 0,
      output: "SELECT * FROM users WHERE name = 'x' OR '1'='1'",
      check: { compiles: true, stdout: "SELECT * FROM users WHERE name = 'x' OR '1'='1'" },
      hint: L("Are there any ? placeholders or extra values for where to quote?", "¿Hay algún placeholder ? o valores extra que where pueda citar?", "where が囲める ? や追加の値はある？"),
      note: "recap-cache-sql",
      explain: L("No ? and no binds: where can't quote anything. The query now returns all rows.", "Sin ? ni valores: where no puede citar nada. La consulta devuelve todas las filas.", "? も値もないので where は何も囲めない。全行が返るクエリに。"),
      win: [{ t: "attack", from: "hero", to: "enemy" }, { t: "banner", text: L("LAST GATE!", "¡ÚLTIMA PUERTA!", "最後の門！") }],
    },
    { ...routerTask, win: [{ t: "attack", from: "hero", to: "enemy" }, { t: "banner", text: L("CASTLE CLEAR!", "¡CASTILLO LIBRE!", "城クリア！") }] },
    { kind: "dialog", speaker: "enemy", text: L(
      "My routes... all lead to 404. The castle is yours, but every request will remember you.",
      "Mis rutas... todas llevan a 404. El castillo es tuyo, pero cada petición te recordará.",
      "わがルートが…すべて404へ。城はお前のものだが、全リクエストがお前を覚えているぞ。",
    ) },
  ],
};

export const controllerCastle: RegionDef = {
  slug: "controller-castle",
  name: L("Controller Castle", "Castillo Controller", "コントローラー城"),
  subtitle: L("Routes, params, filters, views", "Rutas, params, filtros, vistas", "ルート・params・フィルター・ビュー"),
  theme: "castle",
  lessons: [routing, strongParams, filtersAndViews, jobsCacheSecurity, requestDragon],
};
