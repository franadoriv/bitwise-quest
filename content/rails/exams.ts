import type { ExamDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { MINI_CONTROLLER, MINI_RECORD, withHelper } from "./mini.ts";

// Entry exams that simulate company technical screenings for Ruby on Rails roles.
// Topic mix, bank sizes and question ideas follow docs/research/rails-curriculum.md (entry exams) and
// docs/research/rails-hiring-assessments.md. Rails can't run in the sandbox, so:
// - verifiable questions run plain Ruby 3.4.7 versions of Rails mechanisms ("our mini version"), some on
//   the hidden helpers in mini.ts, and carry a `check`;
// - Rails API facts are conceptual questions without a `check`, explained from the Rails Guides.

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");

/** Full program on the mini Active Record helper. */
const R = (code: string) => withHelper(MINI_RECORD, code);
/** Full program on the mini controller helper. */
const C = (code: string) => withHelper(MINI_CONTROLLER, code);

// Hidden setup: posts with authors, for the N+1 questions.
const BLOG = `class Author < Model
  attribute :name
end
class Post < Model
  attribute :title, :author_id
  belongs_to :author
end
ada = Author.create(name: "Ada")
bo = Author.create(name: "Bo")
Post.create(title: "Hi", author_id: ada.id)
Post.create(title: "Yo", author_id: bo.id)
Post.create(title: "Ok", author_id: ada.id)
`;

const ROUTER = String.raw`ROUTES = [["GET", "/posts", "posts#index"], ["GET", "/posts/:id", "posts#show"]]
def recognize(verb, path)
  ROUTES.each do |v, pattern, to|
    next unless v == verb
    regex = Regexp.new("\\A" + pattern.gsub(/:(\w+)/, '(?<\1>[^/]+)') + "\\z")
    m = regex.match(path)
    return [to, m.named_captures.transform_keys(&:to_sym)] if m
  end
  nil
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

export const exams: ExamDef[] = [
  // ─── JUNIOR ───────────────────────────────────────────────────────────────
  {
    slug: "junior",
    level: "junior",
    title: L("Junior Rails Developer", "Rails Developer Junior", "ジュニア Rails 開発者"),
    description: L(
      "Initial screen (online quiz): naming conventions, finders, migrations, associations, validations, routing, params, ERB.",
      "Filtro inicial (quiz online): convenciones, finders, migraciones, asociaciones, validaciones, rutas, params, ERB.",
      "初期スクリーニング（オンライン選択式）：命名規約、検索、マイグレーション、関連、バリデーション、ルート、ERB。",
    ),
    count: 12,
    passPct: 70,
    secondsPerQuestion: 30,
    questions: [
      // active_record_basics
      {
        topic: "active_record_basics", difficulty: 1, kind: "pick",
        prompt: L("Rails table name for this model?", "¿Nombre de tabla en Rails para este modelo?", "このモデルの Rails のテーブル名は？"),
        code: "class Person < ApplicationRecord\nend\n# table: ___",
        options: ["people", "persons", "person"], answer: 0,
        explain: L(
          "Active Record Basics: the table is the plural of the class, and the inflector knows irregular plurals: Person -> people.",
          "Active Record Basics: la tabla es el plural de la clase, y el inflector conoce plurales irregulares: Person -> people.",
          "Active Record Basics：テーブル名はクラス名の複数形。不規則な複数形も知っていて Person は people。",
        ),
      },
      {
        topic: "active_record_basics", difficulty: 2, kind: "predict", prompt: PRINT,
        code: String.raw`def tableize(name) = name.gsub(/([a-z])([A-Z])/, '\1_\2').downcase + "s"
puts tableize("BookClub")`,
        options: ["book_clubs", "bookclubs", "book_club"], answer: 0,
        output: "book_clubs",
        check: { compiles: true, stdout: "book_clubs" },
        explain: L(
          "Our mini tableize snake_cases the CamelCase name and adds s. Rails names BookClub's table book_clubs the same way.",
          "Nuestro mini tableize pasa el CamelCase a snake_case y agrega s. Rails llama book_clubs a la tabla de BookClub igual.",
          "ミニ版 tableize は CamelCase を snake_case にして s を足す。Rails でも BookClub は book_clubs。",
        ),
      },
      {
        topic: "active_record_basics", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'class Post < Model\n  attribute :title\nend\npost = Post.new(title: "Hi")\np post.persisted?\npost.save\np post.persisted?, post.id',
        options: ["false / true / 1", "true / true / 1", "false / false / nil"], answer: 0,
        output: "false\ntrue\n1",
        check: { compiles: true, stdout: "false\ntrue\n1", program: R('class Post < Model\n  attribute :title\nend\npost = Post.new(title: "Hi")\np post.persisted?\npost.save\np post.persisted?, post.id') },
        explain: L(
          "new only builds the object in memory. save writes the row and the database hands back the id, as in Active Record.",
          "new solo arma el objeto en memoria. save escribe la fila y la base de datos devuelve el id, como en Active Record.",
          "new はメモリ上に作るだけ。save で行が書かれ、データベースが id をくれる。Active Record と同じ。",
        ),
      },
      // finders
      {
        topic: "finders", difficulty: 1, kind: "predict",
        prompt: L("In Rails, when no row has id 999?", "En Rails, si ninguna fila tiene id 999?", "Rails で id 999 の行がないと？"),
        code: "Post.find_by(id: 999)",
        options: [L("Returns nil", "Devuelve nil", "nil を返す"), L("Raises RecordNotFound", "Lanza RecordNotFound", "RecordNotFound が発生"), L("Returns []", "Devuelve []", "[] を返す")], answer: 0,
        explain: L(
          "Query Interface guide: find_by returns the first match or nil. It's find(id) that raises ActiveRecord::RecordNotFound.",
          "Guía Query Interface: find_by devuelve la primera coincidencia o nil. Es find(id) el que lanza ActiveRecord::RecordNotFound.",
          "Query Interface ガイド：find_by は最初の一致か nil。例外 RecordNotFound を出すのは find(id)。",
        ),
      },
      {
        topic: "finders", difficulty: 1, kind: "predict", prompt: HAPPENS,
        code: 'class Post < Model\n  attribute :title\nend\nPost.create(title: "Hi")\nPost.find(9)',
        options: [L("RecordNotFound: Couldn't find Post with 'id'=9", "RecordNotFound: Couldn't find Post with 'id'=9", "RecordNotFound：Couldn't find Post with 'id'=9"), "nil", L("An empty Post", "Un Post vacío", "空の Post")], answer: 0,
        check: { compiles: true, throws: "Couldn't find Post with 'id'=9", program: R('class Post < Model\n  attribute :title\nend\nPost.create(title: "Hi")\nPost.find(9)') },
        explain: L(
          "Our mini find raises when the id is missing, like Rails' ActiveRecord::RecordNotFound (a 404 page in production).",
          "Nuestro mini find lanza si falta el id, como ActiveRecord::RecordNotFound de Rails (una página 404 en producción).",
          "ミニ版 find は id がないと例外。Rails の RecordNotFound と同じで、本番では 404 になる。",
        ),
      },
      {
        topic: "finders", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'ROWS = [{id: 1, title: "Hi"}]\np ROWS.select { |r| r[:title] == "Nope" }\np ROWS.find { |r| r[:title] == "Nope" }',
        options: ["[] / nil", "nil / nil", "[] / []"], answer: 0,
        output: "[]\nnil",
        check: { compiles: true, stdout: "[]\nnil" },
        explain: L(
          "where works like select: always a collection, maybe empty. find_by works like find: one record or nil.",
          "where funciona como select: siempre una colección, quizá vacía. find_by funciona como find: un registro o nil.",
          "where は select と同じで必ずコレクション（空もある）。find_by は find と同じで1件か nil。",
        ),
      },
      // migrations
      {
        topic: "migrations", difficulty: 1, kind: "pick",
        prompt: L("Undo the last migration", "Deshaz la última migración", "直前のマイグレーションを戻す"),
        code: "$ bin/rails db:___",
        options: ["rollback", "drop", "reset"], answer: 0,
        explain: L(
          "Migrations guide: db:rollback reverts the latest migration. db:drop deletes the whole database and db:reset rebuilds it.",
          "Guía de Migrations: db:rollback revierte la última migración. db:drop borra toda la base y db:reset la reconstruye.",
          "Migrations ガイド：db:rollback で最後のマイグレーションを戻す。db:drop は DB ごと削除、db:reset は作り直し。",
        ),
      },
      {
        topic: "migrations", difficulty: 2, kind: "predict", prompt: PRINT,
        code: "MIGRATIONS = {\n  20250102 => ->(s) { s[:posts] << :body },\n  20250101 => ->(s) { s[:posts] = [:id, :title] },\n}\nschema = {}\nMIGRATIONS.sort.each { |_version, change| change.(schema) }\np schema",
        options: ["{posts: [:id, :title, :body]}", "{posts: [:id, :title]}", "{posts: [:body]}"], answer: 0,
        output: "{posts: [:id, :title, :body]}",
        check: { compiles: true, stdout: "{posts: [:id, :title, :body]}" },
        explain: L(
          "sort runs the changes by version (timestamp), not by the order they were written. Rails runs migrations in version order too.",
          "sort corre los cambios por versión (timestamp), no por el orden en que se escribieron. Rails también migra por versión.",
          "sort でバージョン（タイムスタンプ）順に実行。書いた順ではない。Rails もバージョン順だよ。",
        ),
      },
      // associations
      {
        topic: "associations", difficulty: 1, kind: "pick",
        prompt: L("Which column holds the link?", "¿Qué columna guarda el vínculo?", "関連を持つカラムは？"),
        code: "class Post < ApplicationRecord\n  belongs_to :author\nend\n# column on posts: ___",
        options: ["author_id", "post_id", "author"], answer: 0,
        explain: L(
          "Associations guide: belongs_to :author reads the foreign key author_id on the model's own table (posts).",
          "Guía de Associations: belongs_to :author lee la clave foránea author_id en la tabla del propio modelo (posts).",
          "Associations ガイド：belongs_to :author は自分のテーブル（posts）の外部キー author_id を読む。",
        ),
      },
      {
        topic: "associations", difficulty: 1, kind: "predict", prompt: PRINT,
        code: 'class Model\n  def self.belongs_to(name)\n    define_method(name) { "load #{name} ##{@attrs[:"#{name}_id"]}" }\n  end\n  def initialize(attrs) = @attrs = attrs\nend\nclass Post < Model\n  belongs_to :author\nend\nputs Post.new(author_id: 7).author',
        options: ["load author #7", "load post #7", "load author #"], answer: 0,
        output: "load author #7",
        check: { compiles: true, stdout: "load author #7" },
        explain: L(
          "belongs_to is a class method that defines an author method with define_method; it reads author_id from the row.",
          "belongs_to es un método de clase que define un método author con define_method; lee author_id de la fila.",
          "belongs_to はクラスメソッドで、define_method で author メソッドを作り、行の author_id を読む。",
        ),
      },
      {
        topic: "associations", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'class Author < Model\n  attribute :name\n  has_many :posts\nend\nclass Post < Model\n  attribute :title, :author_id\nend\nada = Author.create(name: "Ada")\nPost.create(title: "Hi", author_id: ada.id)\nPost.create(title: "Yo", author_id: 2)\np ada.posts.map(&:title)',
        options: ['["Hi"]', '["Hi", "Yo"]', "[]"], answer: 0,
        output: '["Hi"]',
        check: { compiles: true, stdout: '["Hi"]', program: R('class Author < Model\n  attribute :name\n  has_many :posts\nend\nclass Post < Model\n  attribute :title, :author_id\nend\nada = Author.create(name: "Ada")\nPost.create(title: "Hi", author_id: ada.id)\nPost.create(title: "Yo", author_id: 2)\np ada.posts.map(&:title)') },
        explain: L(
          "has_many :posts queries posts WHERE author_id = ada.id (1). Only Hi points at Ada; Yo belongs to author 2.",
          "has_many :posts consulta posts WHERE author_id = ada.id (1). Solo Hi apunta a Ada; Yo es del autor 2.",
          "has_many :posts は posts を author_id = 1 で探す。Ada の記事は Hi だけ。Yo は著者 2 のもの。",
        ),
      },
      // validations
      {
        topic: "validations", difficulty: 1, kind: "predict", prompt: PRINT,
        code: 'class Post < Model\n  attribute :title\n  validates_presence_of :title\nend\npost = Post.new(title: "  ")\np post.save\np post.errors',
        options: ['false / {title: ["can\'t be blank"]}', "true / {}", 'nil / {title: ["can\'t be blank"]}'], answer: 0,
        output: "false\n{title: [\"can't be blank\"]}",
        check: { compiles: true, stdout: "false\n{title: [\"can't be blank\"]}", program: R('class Post < Model\n  attribute :title\n  validates_presence_of :title\nend\npost = Post.new(title: "  ")\np post.save\np post.errors') },
        explain: L(
          "Blank (only spaces) fails presence. save returns false instead of writing and fills errors, as Active Record does.",
          "Vacío (solo espacios) no pasa presence. save devuelve false en vez de escribir y llena errors, como Active Record.",
          "空白だけは presence に失敗。save は書かずに false を返し errors を埋める。Active Record と同じ。",
        ),
      },
      {
        topic: "validations", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: "class Post < Model\n  attribute :title\n  validates_presence_of :title\nend\nPost.new.save!",
        options: [
          L("RecordInvalid: Validation failed: Title can't be blank", "RecordInvalid: Validation failed: Title can't be blank", "RecordInvalid：Validation failed: Title can't be blank"),
          L("It returns false", "Devuelve false", "false を返す"),
          L("It saves with a nil title", "Guarda con title nil", "title が nil のまま保存"),
        ], answer: 0,
        check: { compiles: true, throws: "Validation failed: Title can't be blank", program: R("class Post < Model\n  attribute :title\n  validates_presence_of :title\nend\nPost.new.save!") },
        explain: L(
          "The bang version raises instead of returning false. In Rails, save! and create! raise ActiveRecord::RecordInvalid.",
          "La versión con ! lanza en vez de devolver false. En Rails, save! y create! lanzan ActiveRecord::RecordInvalid.",
          "! 付きは false ではなく例外。Rails の save! と create! は RecordInvalid を出す。",
        ),
      },
      {
        topic: "validations", difficulty: 1, kind: "type",
        prompt: L("Require a title (Rails)", "Exige un título (Rails)", "title を必須に（Rails）"),
        code: "class Post < ApplicationRecord\n  validates :title, ___: true\nend",
        answer: "presence",
        explain: L(
          "Validations guide: presence: true fails when the value is nil, empty or only whitespace, with the message \"can't be blank\".",
          "Guía de Validations: presence: true falla si el valor es nil, vacío o solo espacios, con el mensaje \"can't be blank\".",
          "Validations ガイド：presence: true は nil・空・空白だけなら失敗。メッセージは \"can't be blank\"。",
        ),
      },
      // routing
      {
        topic: "routing", difficulty: 1, kind: "predict", prompt: PRINT,
        code: 'def resources(name)\n  [["GET", "/#{name}", "index"], ["GET", "/#{name}/new", "new"],\n   ["POST", "/#{name}", "create"], ["GET", "/#{name}/:id", "show"],\n   ["GET", "/#{name}/:id/edit", "edit"], ["PATCH", "/#{name}/:id", "update"],\n   ["DELETE", "/#{name}/:id", "destroy"]]\nend\nputs resources(:posts).size',
        options: ["7", "4", "5"], answer: 0,
        output: "7",
        check: { compiles: true, stdout: "7" },
        explain: L(
          "Like Rails' resources :posts, our mini version draws the 7 REST routes: index, new, create, show, edit, update, destroy.",
          "Como resources :posts de Rails, nuestra mini versión dibuja las 7 rutas REST: index, new, create, show, edit, update, destroy.",
          "Rails の resources :posts と同じく、ミニ版も REST の7本を作る：index・new・create・show・edit・update・destroy。",
        ),
      },
      {
        topic: "routing", difficulty: 2, kind: "predict", prompt: PRINT,
        code: `${ROUTER}\np recognize("GET", "/posts/42")`,
        options: ['["posts#show", {id: "42"}]', '["posts#show", {id: 42}]', '["posts#index", {}]'], answer: 0,
        output: '["posts#show", {id: "42"}]',
        check: { compiles: true, stdout: '["posts#show", {id: "42"}]' },
        explain: L(
          "The :id segment captures text, so params[:id] is the string \"42\". Rails path params are strings too: convert before math.",
          "El segmento :id captura texto, así que params[:id] es el string \"42\". En Rails también son strings: convierte antes de operar.",
          ":id は文字を取るので params[:id] は文字列 \"42\"。Rails でも同じなので計算前に変換しよう。",
        ),
      },
      {
        topic: "routing", difficulty: 1, kind: "pick",
        prompt: L("In Rails, which action gets it?", "En Rails, ¿qué acción la recibe?", "Rails ではどのアクション？"),
        code: "resources :photos\n# PATCH /photos/17  ->  photos#___",
        options: ["update", "edit", "create"], answer: 0,
        explain: L(
          "Routing guide: PATCH/PUT /photos/:id maps to update. edit is GET /photos/:id/edit and only shows the form.",
          "Guía de Routing: PATCH/PUT /photos/:id va a update. edit es GET /photos/:id/edit y solo muestra el formulario.",
          "Routing ガイド：PATCH/PUT /photos/:id は update。edit は GET .../edit でフォームを出すだけ。",
        ),
      },
      // strong_params
      {
        topic: "strong_params", difficulty: 2, kind: "predict", prompt: PRINT,
        code: `${PARAMS}\nparams = Params.new({"post" => {"title" => "Hi", "admin" => true}})\np params.require("post").permit("title", "body")`,
        options: ['{"title" => "Hi"}', '{"title" => "Hi", "admin" => true}', '{"title" => "Hi", "body" => nil}'], answer: 0,
        output: '{"title" => "Hi"}',
        check: { compiles: true, stdout: '{"title" => "Hi"}' },
        explain: L(
          "permit keeps only the listed keys that arrived. admin isn't permitted and body wasn't sent, so only title survives.",
          "permit deja solo las claves listadas que llegaron. admin no está permitido y body no vino, así que solo queda title.",
          "permit はリストにあり届いたキーだけ。admin は不許可、body は来ていないので title だけ残る。",
        ),
      },
      {
        topic: "strong_params", difficulty: 1, kind: "predict",
        prompt: L("What is this line for?", "¿Para qué sirve esta línea?", "この行の目的は？"),
        code: "params.require(:post).permit(:title, :body)",
        options: [
          L("Block mass assignment of other keys", "Bloquear la asignación masiva de otras claves", "他のキーの一括代入を防ぐ"),
          L("Validate that title is present", "Validar que title exista", "title の存在を検証する"),
          L("Escape HTML in the params", "Escapar el HTML de los params", "params の HTML をエスケープ"),
        ], answer: 0,
        explain: L(
          "Action Controller guide: strong parameters stop users from setting attributes you didn't allow, like admin. Validations live in the model.",
          "Guía de Action Controller: los strong parameters impiden asignar atributos no permitidos, como admin. Las validaciones van en el modelo.",
          "Action Controller ガイド：許可していない属性（admin など）を設定させない。検証はモデルの仕事。",
        ),
      },
      // views
      {
        topic: "views", difficulty: 1, kind: "pick",
        prompt: L("Set x without outputting it", "Asigna x sin mostrarlo", "x を出力せずに代入"),
        code: 'require "erb"\nputs ERB.new("<___ x = 5 %>[<%= x %>]").result',
        options: ["%", "%="], answer: 0,
        check: { compiles: true, stdout: "[5]" },
        explain: L(
          "<% %> runs Ruby and writes nothing; <%= %> writes the value. With %= the 5 would also appear before the brackets.",
          "<% %> corre Ruby y no escribe nada; <%= %> escribe el valor. Con %= el 5 también saldría antes de los corchetes.",
          "<% %> は実行だけ、<%= %> は値を書く。%= だとかっこの前にも 5 が出ちゃう。",
        ),
      },
      {
        topic: "views", difficulty: 2, kind: "predict",
        prompt: L("In a Rails view, the body holds <script>…", "En una vista Rails, body trae <script>…", "Rails のビューで body に <script> が…"),
        code: "<p><%= @comment.body %></p>",
        options: [
          L("It is escaped and shown as text", "Se escapa y se ve como texto", "エスケープされ文字で表示"),
          L("The script runs in the browser", "El script corre en el navegador", "ブラウザでスクリプトが動く"),
        ], answer: 0,
        explain: L(
          "Security guide: Rails escapes <%= %> output by default. Only raw, html_safe or <%== %> skip it, so never use them on user input.",
          "Guía de Security: Rails escapa la salida de <%= %> por defecto. Solo raw, html_safe o <%== %> lo saltan: no los uses con datos del usuario.",
          "Security ガイド：Rails は <%= %> を既定でエスケープ。raw・html_safe・<%== %> だけが外すので入力には使わない。",
        ),
      },
      // testing
      {
        topic: "testing", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'require "minitest"\nclass SumTest < Minitest::Test\n  def test_sum = assert_equal(2, 1 + 2)\nend\nresult = SumTest.new(:test_sum).run\nputs result.passed?\nputs result.failures.first.message',
        options: ["false / Expected: 2 / Actual: 3", "false / Expected: 3 / Actual: 2", "true"], answer: 0,
        output: "false\nExpected: 2\n  Actual: 3",
        check: { compiles: true, stdout: "false\nExpected: 2\n  Actual: 3" },
        explain: L(
          "assert_equal takes (expected, actual): 2 was expected, 1 + 2 gave 3. Minitest is Rails' default test framework.",
          "assert_equal recibe (esperado, real): se esperaba 2 y 1 + 2 dio 3. Minitest es el framework de test por defecto de Rails.",
          "assert_equal は（期待値, 実際の値）。2 を期待して 3 だった。Minitest は Rails 標準のテストだよ。",
        ),
      },
    ],
  },

  // ─── MID ──────────────────────────────────────────────────────────────────
  {
    slug: "mid",
    level: "mid",
    title: L("Mid-level Rails Developer", "Rails Developer Semi-senior", "ミドル Rails 開発者"),
    description: L(
      "Technical interview: lazy relations, N+1, callbacks, filters, strong params, caching, jobs and security basics.",
      "Entrevista técnica: relaciones perezosas, N+1, callbacks, filtros, strong params, caché, jobs y seguridad básica.",
      "技術面接：遅延リレーション、N+1、コールバック、フィルター、ストロングパラメータ、キャッシュ、ジョブ、セキュリティ。",
    ),
    count: 14,
    passPct: 70,
    secondsPerQuestion: 40,
    questions: [
      // relations
      {
        topic: "relations", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'class Post < Model\n  attribute :title, :pub\nend\nPost.create(title: "Hi", pub: true)\nDB.queries = 0\nposts = Post.where(pub: true)\nputs DB.queries\nposts.to_a\nposts.to_a\nputs DB.queries',
        options: ["0 / 1", "1 / 3", "1 / 1"], answer: 0,
        output: "0\n1",
        check: { compiles: true, stdout: "0\n1", program: R('class Post < Model\n  attribute :title, :pub\nend\nPost.create(title: "Hi", pub: true)\nDB.queries = 0\nposts = Post.where(pub: true)\nputs DB.queries\nposts.to_a\nposts.to_a\nputs DB.queries') },
        explain: L(
          "where only builds a relation: no query yet. The first to_a runs it and memoizes the records, so the second costs nothing.",
          "where solo arma una relación: aún no hay consulta. El primer to_a la corre y memoiza los registros; el segundo no cuesta nada.",
          "where はリレーションを作るだけでクエリはまだ。最初の to_a で実行し結果を覚えるので2回目はタダ。",
        ),
      },
      {
        topic: "relations", difficulty: 2, kind: "pick",
        prompt: L("On an unloaded relation, always SELECT COUNT(*)", "En una relación sin cargar, siempre SELECT COUNT(*)", "未ロードで必ず SELECT COUNT(*)"),
        code: "Post.where(pub: true).___",
        options: ["count", "length", "to_a.size"], answer: 0,
        explain: L(
          "Relation API: count always runs COUNT(*). length loads every record first; size counts with SQL unless already loaded.",
          "API de Relation: count siempre corre COUNT(*). length carga todos los registros; size cuenta con SQL salvo que ya estén cargados.",
          "Relation API：count は常に COUNT(*)。length は全件ロード、size はロード済みでなければ SQL で数える。",
        ),
      },
      {
        topic: "relations", difficulty: 1, kind: "predict", prompt: PRINT,
        code: "class Post < Model\n  attribute :title, :pub\nend\nputs Post.where(pub: true).order(:id).limit(2).to_sql",
        options: ["SELECT * FROM posts WHERE pub = true ORDER BY id LIMIT 2", "SELECT * FROM posts", "SELECT * FROM posts LIMIT 2 ORDER BY id WHERE pub = true"], answer: 0,
        output: "SELECT * FROM posts WHERE pub = true ORDER BY id LIMIT 2",
        check: { compiles: true, stdout: "SELECT * FROM posts WHERE pub = true ORDER BY id LIMIT 2", program: R("class Post < Model\n  attribute :title, :pub\nend\nputs Post.where(pub: true).order(:id).limit(2).to_sql") },
        explain: L(
          "Each call returns a new relation that remembers one more piece; to_sql assembles them in SQL order. Rails' to_sql works the same way.",
          "Cada llamada devuelve una relación nueva con una pieza más; to_sql las arma en orden SQL. El to_sql de Rails funciona igual.",
          "呼ぶたびに条件を1つ足した新しいリレーション。to_sql が SQL の順に組み立てる。Rails の to_sql も同じ。",
        ),
      },
      // finders
      {
        topic: "finders", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'class Post\n  ROWS = [{id: 1, title: "Hi"}]\n  def self.method_missing(name, *args)\n    return super unless name.start_with?("find_by_")\n    col = name.to_s.delete_prefix("find_by_").to_sym\n    ROWS.find { |r| r[col] == args[0] }\n  end\nend\np Post.find_by_title("Hi")\np Post.respond_to?(:find_by_title)',
        options: ['{id: 1, title: "Hi"} / false', '{id: 1, title: "Hi"} / true', "nil / false"], answer: 0,
        output: '{id: 1, title: "Hi"}\nfalse',
        check: { compiles: true, stdout: '{id: 1, title: "Hi"}\nfalse' },
        explain: L(
          "method_missing answers the dynamic finder, but respond_to? doesn't know about it. Define respond_to_missing? to make it honest.",
          "method_missing responde el finder dinámico, pero respond_to? no lo sabe. Define respond_to_missing? para que sea honesto.",
          "method_missing で動的ファインダーは動くが respond_to? は知らない。respond_to_missing? を定義しよう。",
        ),
      },
      // associations
      {
        topic: "associations", difficulty: 2, kind: "pick",
        prompt: L("Doctors and patients via dated appointments", "Médicos y pacientes vía citas con fecha", "日付付き予約で医師と患者をつなぐ"),
        code: "class Doctor < ApplicationRecord\n  has_many :appointments\n  ___ :patients, through: :appointments\nend",
        options: ["has_many", "has_and_belongs_to_many", "belongs_to"], answer: 0,
        explain: L(
          "Associations guide: use has_many :through when the join model has its own data (the date). HABTM has no join model.",
          "Guía de Associations: usa has_many :through cuando el modelo intermedio tiene datos propios (la fecha). HABTM no tiene modelo.",
          "Associations ガイド：中間モデルに独自データ（日付）があるなら has_many :through。HABTM は中間モデルなし。",
        ),
      },
      {
        topic: "associations", difficulty: 2, kind: "predict",
        prompt: L("dependent: :delete_all vs :destroy?", "¿dependent: :delete_all vs :destroy?", "dependent: :delete_all と :destroy の違い"),
        code: "has_many :comments, dependent: :delete_all\n# vs\nhas_many :comments, dependent: :destroy",
        options: [
          L(":delete_all skips the comments' callbacks", ":delete_all salta los callbacks de los comments", ":delete_all はコメントのコールバックを飛ばす"),
          L("They are identical", "Son idénticos", "まったく同じ"),
          L(":destroy leaves orphans", ":destroy deja huérfanos", ":destroy は孤児を残す"),
        ], answer: 0,
        explain: L(
          "Associations guide: :destroy loads each child and runs its callbacks; :delete_all removes them in one SQL DELETE, no callbacks.",
          "Guía de Associations: :destroy carga cada hijo y corre sus callbacks; :delete_all los borra con un DELETE, sin callbacks.",
          "Associations ガイド：:destroy は子を読みコールバックを実行。:delete_all は1回の DELETE でコールバックなし。",
        ),
      },
      // n_plus_one
      {
        topic: "n_plus_one", difficulty: 2, kind: "predict", prompt: PRINT,
        code: "# Post belongs_to :author; 3 posts by 2 authors\nDB.queries = 0\nPost.all.each { |post| post.author.name }\nputs DB.queries",
        options: ["4", "2", "3"], answer: 0,
        output: "4",
        check: { compiles: true, stdout: "4", program: R(`${BLOG}DB.queries = 0\nPost.all.each { |post| post.author.name }\nputs DB.queries`) },
        explain: L(
          "1 query for the posts, then 1 per post to load its author: 1 + 3 = 4. That's the N+1 problem.",
          "1 consulta para los posts y 1 por post para cargar su autor: 1 + 3 = 4. Ese es el problema N+1.",
          "記事で1回、記事ごとに著者で1回ずつ：1 + 3 = 4。これが N+1 問題。",
        ),
      },
      {
        topic: "n_plus_one", difficulty: 2, kind: "predict", prompt: PRINT,
        code: "# Post belongs_to :author; 3 posts by 2 authors\nDB.queries = 0\nPost.includes(:author).each { |post| post.author.name }\nputs DB.queries",
        options: ["2", "4", "1"], answer: 0,
        output: "2",
        check: { compiles: true, stdout: "2", program: R(`${BLOG}DB.queries = 0\nPost.includes(:author).each { |post| post.author.name }\nputs DB.queries`) },
        explain: L(
          "includes collects the author ids and loads them all in one query: 1 for posts + 1 for authors, however many posts there are.",
          "includes junta los ids de autor y los carga en una consulta: 1 para posts + 1 para autores, sin importar cuántos posts haya.",
          "includes は著者 id を集めて1回で読む。記事で1回＋著者で1回。記事が何件でも2回。",
        ),
      },
      {
        topic: "n_plus_one", difficulty: 3, kind: "predict",
        prompt: L("How many queries in Rails?", "¿Cuántas consultas en Rails?", "Rails でクエリは何回？"),
        code: "Post.joins(:author).each do |post|\n  post.author.name\nend",
        options: [
          L("Still N+1: joins doesn't load authors", "Sigue N+1: joins no carga autores", "N+1 のまま：joins は著者を読まない"),
          L("One query for everything", "Una consulta para todo", "全部で1回"),
        ], answer: 0,
        explain: L(
          "Query Interface guide: joins only filters with an INNER JOIN; it doesn't load the association. Use includes or eager_load.",
          "Guía Query Interface: joins solo filtra con un INNER JOIN; no carga la asociación. Usa includes o eager_load.",
          "Query Interface ガイド：joins は INNER JOIN で絞るだけで関連は読まない。includes か eager_load を使おう。",
        ),
      },
      // validations
      {
        topic: "validations", difficulty: 2, kind: "predict",
        prompt: L("uniqueness: two requests at the same instant?", "uniqueness: ¿dos peticiones al mismo instante?", "uniqueness：同時に2リクエストが来たら？"),
        code: "class User < ApplicationRecord\n  validates :email, uniqueness: true\nend",
        options: [
          L("Both may pass: add a unique index", "Ambas pueden pasar: agrega un índice único", "両方通りうる：ユニーク索引を足す"),
          L("Rails locks the table, so it's safe", "Rails bloquea la tabla, es seguro", "Rails がテーブルをロックするので安全"),
        ], answer: 0,
        explain: L(
          "Validations guide: uniqueness checks with a SELECT before inserting, so two requests can both pass. A unique index enforces it.",
          "Guía de Validations: uniqueness revisa con un SELECT antes de insertar, así que dos peticiones pueden pasar. Un índice único lo asegura.",
          "Validations ガイド：uniqueness は挿入前の SELECT なので同時だと両方通る。ユニーク索引で守ろう。",
        ),
      },
      // callbacks
      {
        topic: "callbacks", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'class Post < Model\n  attribute :title\n  before_save :normalize\n  before_save :no_spam\n  def normalize = self.title = title.strip\n  def no_spam = (throw :abort if title.include?("$$$"))\nend\np Post.new(title: " Hi ").tap(&:save).title\np Post.new(title: "$$$").save\np DB.tables["posts"].size',
        options: ['"Hi" / false / 1', '" Hi " / false / 1', '"Hi" / true / 2'], answer: 0,
        output: '"Hi"\nfalse\n1',
        check: { compiles: true, stdout: '"Hi"\nfalse\n1', program: R('class Post < Model\n  attribute :title\n  before_save :normalize\n  before_save :no_spam\n  def normalize = self.title = title.strip\n  def no_spam = (throw :abort if title.include?("$$$"))\nend\np Post.new(title: " Hi ").tap(&:save).title\np Post.new(title: "$$$").save\np DB.tables["posts"].size') },
        explain: L(
          "Callbacks run in order: normalize strips the title. throw :abort halts the chain, save returns false and nothing is written.",
          "Los callbacks corren en orden: normalize limpia el título. throw :abort detiene la cadena, save devuelve false y no se escribe nada.",
          "コールバックは順番に動く。normalize が空白を除く。throw :abort で止まり save は false、何も書かれない。",
        ),
      },
      {
        topic: "callbacks", difficulty: 2, kind: "pick",
        prompt: L("Send the welcome email once it's committed", "Envía el email de bienvenida tras el commit", "コミット後にウェルカムメール"),
        code: "class User < ApplicationRecord\n  ___ :send_welcome_email, on: :create\nend",
        options: ["after_commit", "before_save", "after_validation"], answer: 0,
        explain: L(
          "Callbacks guide: after_commit runs once the transaction is committed, so a rollback can't leave an email about a user that doesn't exist.",
          "Guía de Callbacks: after_commit corre cuando la transacción ya hizo commit; un rollback no deja un email de un usuario inexistente.",
          "Callbacks ガイド：after_commit はコミット後に動く。ロールバックで存在しないユーザーにメールが行くことはない。",
        ),
      },
      {
        topic: "callbacks", difficulty: 3, kind: "predict", prompt: PRINT,
        code: "class Model\n  def self.before_save(m) = (@cbs ||= []) << m\n  def self.cbs = @cbs || []\nend\nclass Post < Model; before_save :a; end\nclass Draft < Post; before_save :b; end\np Post.cbs\np Draft.cbs",
        options: ["[:a] / [:b]", "[:a] / [:a, :b]", "[:a, :b] / [:a, :b]"], answer: 0,
        output: "[:a]\n[:b]",
        check: { compiles: true, stdout: "[:a]\n[:b]" },
        explain: L(
          "Class instance variables are not inherited: Draft gets its own empty @cbs. Rails keeps callbacks in inheritable class attributes.",
          "Las variables de instancia de clase no se heredan: Draft tiene su propio @cbs vacío. Rails guarda callbacks en atributos heredables.",
          "クラスのインスタンス変数は継承されない。Draft は空の @cbs から。Rails は継承できる属性を使う。",
        ),
      },
      // controllers_filters
      {
        topic: "controllers_filters", difficulty: 1, kind: "predict", prompt: PRINT,
        code: 'class PostsController < Controller\n  before_action :require_login, only: [:edit]\n  def require_login = (redirect_to "/login" unless @user)\n  def show = render("post")\n  def edit = render("form")\nend\nputs PostsController.new.process(:show)\nputs PostsController.new.process(:edit)',
        options: ["200 post / 302 /login", "302 /login / 302 /login", "200 post / 200 form"], answer: 0,
        output: "200 post\n302 /login",
        check: { compiles: true, stdout: "200 post\n302 /login", program: C('class PostsController < Controller\n  before_action :require_login, only: [:edit]\n  def require_login = (redirect_to "/login" unless @user)\n  def show = render("post")\n  def edit = render("form")\nend\nputs PostsController.new.process(:show)\nputs PostsController.new.process(:edit)') },
        explain: L(
          "Our mini controller skips the filter on show (only: [:edit]). On edit it redirects, and the chain stops before the action, as in Rails.",
          "Nuestro mini controller salta el filtro en show (only: [:edit]). En edit redirige y la cadena se detiene antes de la acción, como en Rails.",
          "ミニ版は show でフィルターを飛ばす（only: [:edit]）。edit ではリダイレクトしてアクション前に止まる。",
        ),
      },
      {
        topic: "controllers_filters", difficulty: 2, kind: "predict",
        prompt: L("In Rails, render then redirect_to in one action?", "En Rails, ¿render y luego redirect_to en una acción?", "Rails で render の後に redirect_to？"),
        code: "def update\n  render :edit\n  redirect_to root_path\nend",
        options: [
          L("AbstractController::DoubleRenderError", "AbstractController::DoubleRenderError", "AbstractController::DoubleRenderError"),
          L("The redirect wins", "Gana el redirect", "redirect が勝つ"),
          L("The render wins", "Gana el render", "render が勝つ"),
        ], answer: 0,
        explain: L(
          "Layouts and Rendering guide: an action may respond once. A second render or redirect raises DoubleRenderError; use and return.",
          "Guía Layouts and Rendering: una acción responde una sola vez. Un segundo render o redirect lanza DoubleRenderError; usa and return.",
          "Layouts and Rendering ガイド：応答は1回だけ。2回目の render/redirect は DoubleRenderError。and return を使おう。",
        ),
      },
      // strong_params
      {
        topic: "strong_params", difficulty: 2, kind: "type",
        prompt: L("Rails 8: require and permit in one call", "Rails 8: require y permit en una llamada", "Rails 8：require と permit を一度に"),
        code: "def post_params\n  params.___(post: [:title, :body])\nend",
        answer: "expect",
        explain: L(
          "Rails 8's params.expect requires post, permits the listed keys and answers 400 if the shape is wrong (e.g. post is a string).",
          "params.expect de Rails 8 exige post, permite las claves listadas y responde 400 si la forma es incorrecta (p. ej. post es un string).",
          "Rails 8 の params.expect は post を必須にし、キーを許可し、形が違えば 400（post が文字列など）。",
        ),
      },
      {
        topic: "strong_params", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'begin\n  Params.new({"post" => {}}).require("post")\nrescue KeyError => e\n  puts e.class\nend',
        options: ["ParameterMissing", "KeyError", L("Nothing", "Nada", "何も出ない")], answer: 0,
        output: "ParameterMissing",
        check: { compiles: true, stdout: "ParameterMissing", program: `${PARAMS}\nbegin\n  Params.new({"post" => {}}).require("post")\nrescue KeyError => e\n  puts e.class\nend` },
        explain: L(
          "In our mini Params (like Rails), an empty value counts as missing, and ParameterMissing is a KeyError subclass, so rescue catches it.",
          "En nuestro mini Params (como en Rails), un valor vacío cuenta como faltante, y ParameterMissing hereda de KeyError: rescue lo atrapa.",
          "ミニ版 Params（Rails も）では空は「ない」扱い。ParameterMissing は KeyError の子なので rescue で捕まる。",
        ),
      },
      // migrations
      {
        topic: "migrations", difficulty: 2, kind: "predict", prompt: PRINT,
        code: "INVERSE = {add_column: :remove_column, create_table: :drop_table}\nops = [[:create_table, :tags], [:add_column, :posts, :body]]\np ops.reverse.map { |op, *args| [INVERSE.fetch(op), *args] }",
        options: ["[[:remove_column, :posts, :body], [:drop_table, :tags]]", "[[:drop_table, :tags], [:remove_column, :posts, :body]]", "[[:create_table, :tags], [:add_column, :posts, :body]]"], answer: 0,
        output: "[[:remove_column, :posts, :body], [:drop_table, :tags]]",
        check: { compiles: true, stdout: "[[:remove_column, :posts, :body], [:drop_table, :tags]]" },
        explain: L(
          "Rolling back undoes each step with its inverse, last step first. That's how Rails reverses a change method.",
          "Revertir deshace cada paso con su inverso, empezando por el último. Así revierte Rails un método change.",
          "ロールバックは最後の手順から逆操作で戻す。Rails が change を逆再生するのと同じ。",
        ),
      },
      // caching
      {
        topic: "caching", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'store = {}\nfetch = ->(key, &blk) { store[key] ||= blk.call }\n2.times { p fetch.("user") { puts "query"; nil } }',
        options: ["query / nil / query / nil", "query / nil / nil", "nil / nil"], answer: 0,
        output: "query\nnil\nquery\nnil",
        check: { compiles: true, stdout: "query\nnil\nquery\nnil" },
        explain: L(
          "||= treats nil as missing, so a nil result is never cached and the query runs every time. Check key? to cache nil.",
          "||= trata nil como faltante, así que un nil nunca se guarda y la consulta corre siempre. Usa key? para guardar nil.",
          "||= は nil を「ない」とみなすので nil は保存されず毎回クエリ。nil も保存するなら key? で確認。",
        ),
      },
      {
        topic: "caching", difficulty: 3, kind: "predict", prompt: PRINT,
        code: 'store = {}\nfetch = ->(key, &blk) { store.key?(key) ? store[key] : (store[key] = blk.call) }\npost = {id: 1, title: "Hi", updated_at: 100}\nkey = -> { "posts/#{post[:id]}-#{post[:updated_at]}" }\nputs fetch.(key.()) { post[:title] }\npost[:title] = "Bye"\nputs fetch.(key.()) { post[:title] }\npost[:updated_at] = 101\nputs fetch.(key.()) { post[:title] }',
        options: ["Hi / Hi / Bye", "Hi / Bye / Bye", "Hi / Hi / Hi"], answer: 0,
        output: "Hi\nHi\nBye",
        check: { compiles: true, stdout: "Hi\nHi\nBye" },
        explain: L(
          "Key-based expiration: the key holds updated_at. Changing the title alone keeps the stale entry; a new updated_at makes a new key.",
          "Expiración por clave: la clave incluye updated_at. Cambiar solo el título deja la entrada vieja; un updated_at nuevo crea otra clave.",
          "キーに updated_at を入れる方式。title だけ変えても古いまま。updated_at が変わると新しいキーになる。",
        ),
      },
      // jobs
      {
        topic: "jobs", difficulty: 1, kind: "predict",
        prompt: L("Retried jobs may run twice, so they should be…", "Los jobs reintentados pueden correr dos veces: deben ser…", "リトライで2回動くジョブは…であるべき"),
        code: "class ChargeJob < ApplicationJob\n  retry_on Timeout::Error, attempts: 3\n  def perform(order) = order.charge!\nend",
        options: [L("Idempotent", "Idempotentes", "冪等"), L("Synchronous", "Síncronos", "同期的"), L("Private", "Privados", "private")], answer: 0,
        explain: L(
          "Active Job guide: retry_on re-runs perform after an error, so running it twice must not charge twice. Check if the work is done first.",
          "Guía de Active Job: retry_on vuelve a correr perform tras un error; correrlo dos veces no debe cobrar dos veces. Revisa si ya se hizo.",
          "Active Job ガイド：retry_on はエラー後 perform を再実行。2回でも二重請求しないよう済みかを確認しよう。",
        ),
      },
      {
        topic: "jobs", difficulty: 1, kind: "predict", prompt: PRINT,
        code: 'QUEUE = []\nclass Job\n  def self.perform_later(*args) = QUEUE << [self, args]\n  def self.perform_now(*args) = new.perform(*args)\nend\nclass WelcomeJob < Job\n  def perform(user_id) = puts("mail to user #{user_id}")\nend\nWelcomeJob.perform_later(7)\nputs "queued: #{QUEUE.size}"\nklass, args = QUEUE.shift\nklass.perform_now(*args)',
        options: ["queued: 1 / mail to user 7", "mail to user 7 / queued: 1", "queued: 0 / mail to user 7"], answer: 0,
        output: "queued: 1\nmail to user 7",
        check: { compiles: true, stdout: "queued: 1\nmail to user 7" },
        explain: L(
          "perform_later only stores the class and arguments and returns. A worker performs it later. Active Job's perform_later works this way.",
          "perform_later solo guarda la clase y los argumentos y vuelve. Un worker lo ejecuta luego. perform_later de Active Job funciona así.",
          "perform_later はクラスと引数をしまって戻るだけ。あとでワーカーが実行。Active Job も同じ。",
        ),
      },
      // security
      {
        topic: "security", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'def quote(v) = "\'" + v.to_s.gsub("\'", "\'\'") + "\'"\ndef where(sql, *binds) = binds.reduce(sql) { |s, b| s.sub("?", quote(b)) }\ninput = "x\' OR \'1\'=\'1"\nputs where("name = ?", input)\nputs "name = \'#{input}\'"',
        options: ["name = 'x'' OR ''1''=''1' / name = 'x' OR '1'='1'", "name = 'x' OR '1'='1' / name = 'x' OR '1'='1'", "name = ? / name = 'x' OR '1'='1'"], answer: 0,
        output: "name = 'x'' OR ''1''=''1'\nname = 'x' OR '1'='1'",
        check: { compiles: true, stdout: "name = 'x'' OR ''1''=''1'\nname = 'x' OR '1'='1'" },
        explain: L(
          "The placeholder quotes the input, doubling its quotes. Interpolation lets the quote close the string: OR '1'='1' matches every row.",
          "El placeholder cita la entrada y duplica sus comillas. Interpolar deja que la comilla cierre el string: OR '1'='1' trae todas las filas.",
          "? は入力を囲み ' を二重にする。埋め込むと ' で文字列が閉じ、OR '1'='1' で全行に一致。",
        ),
      },
      {
        topic: "security", difficulty: 2, kind: "predict",
        prompt: L("Rails checks the CSRF token on…", "Rails revisa el token CSRF en…", "Rails が CSRF トークンを確かめるのは…"),
        code: "class ApplicationController < ActionController::Base\n  protect_from_forgery with: :exception\nend",
        options: [
          L("Non-GET requests (POST, PATCH, DELETE)", "Peticiones no GET (POST, PATCH, DELETE)", "GET 以外（POST・PATCH・DELETE）"),
          L("Every request, GET included", "Todas, GET incluido", "GET も含む全リクエスト"),
        ], answer: 0,
        explain: L(
          "Security guide: the token is verified on non-GET requests, so GET actions must never change data, or a link could do it.",
          "Guía de Security: el token se verifica en peticiones no GET; las acciones GET nunca deben cambiar datos, o un enlace podría hacerlo.",
          "Security ガイド：トークン確認は GET 以外。だから GET でデータを変えてはダメ。リンク一つで変えられてしまう。",
        ),
      },
    ],
  },

  // ─── SENIOR ───────────────────────────────────────────────────────────────
  {
    slug: "senior",
    level: "senior",
    title: L("Senior Rails Developer", "Rails Developer Senior", "シニア Rails 開発者"),
    description: L(
      "Senior interview: query performance, transactions, locking, safe migrations, caching, jobs, security, architecture.",
      "Entrevista senior: consultas, transacciones, bloqueos, migraciones seguras, caché, jobs, seguridad y arquitectura.",
      "シニア面接：クエリ性能、トランザクションとロック、安全なマイグレーション、キャッシュ、ジョブ、設計。",
    ),
    count: 15,
    passPct: 75,
    secondsPerQuestion: 50,
    questions: [
      // n_plus_one
      {
        topic: "n_plus_one", difficulty: 2, kind: "pick",
        prompt: L("Filter by author name AND load authors in one query", "Filtra por nombre de autor Y carga autores en una consulta", "著者名で絞り、著者も1回で読む"),
        code: 'Post.___(:author).where(authors: { name: "Ada" })',
        options: ["eager_load", "preload", "joins"], answer: 0,
        explain: L(
          "Query Interface guide: eager_load uses one LEFT OUTER JOIN, so you can filter on authors and get them loaded. preload can't filter on them.",
          "Guía Query Interface: eager_load usa un LEFT OUTER JOIN: puedes filtrar por authors y quedan cargados. preload no puede filtrar por ellos.",
          "Query Interface ガイド：eager_load は LEFT OUTER JOIN 1回で絞り込みと読み込みを両立。preload は絞れない。",
        ),
      },
      {
        topic: "n_plus_one", difficulty: 2, kind: "predict", prompt: PRINT,
        code: '$queries = 1 # loading the posts\nAUTHORS = (1..10).to_h { [it, "A#{it}"] }\ndef find_author(id) = ($queries += 1; AUTHORS[id])\nposts = Array.new(100) { |i| {a: i % 10 + 1} }\nposts.each { |post| find_author(post[:a]) }\nputs $queries',
        options: ["101", "11", "2"], answer: 0,
        output: "101",
        check: { compiles: true, stdout: "101" },
        explain: L(
          "One lookup per post, even for repeated authors: 1 + 100. Preloading the 10 distinct ids would make it 2 queries.",
          "Una búsqueda por post, aunque el autor se repita: 1 + 100. Precargar los 10 ids distintos lo deja en 2 consultas.",
          "著者が重複しても記事ごとに1回：1 + 100。10個の id を先読みすれば2回で済む。",
        ),
      },
      {
        topic: "n_plus_one", difficulty: 2, kind: "pick",
        prompt: L("post.comments.size without a COUNT per post", "post.comments.size sin un COUNT por post", "記事ごとの COUNT なしで comments.size"),
        code: "class Comment < ApplicationRecord\n  belongs_to :post, ___: true\nend",
        options: ["counter_cache", "touch", "optional"], answer: 0,
        explain: L(
          "Associations guide: counter_cache keeps a comments_count column on posts up to date, and size reads it without querying comments.",
          "Guía de Associations: counter_cache mantiene al día una columna comments_count en posts, y size la lee sin consultar comments.",
          "Associations ガイド：counter_cache は posts の comments_count を更新し続け、size はそれを読む。",
        ),
      },
      // database
      {
        topic: "database", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'def transaction(db)\n  snapshot = db.dup\n  yield\nrescue => e\n  db.replace(snapshot)\n  puts "ROLLBACK (#{e.message})"\nend\naccounts = {a: 100, b: 0}\ntransaction(accounts) do\n  accounts[:a] -= 50\n  raise "card declined"\nend\np accounts',
        options: ["ROLLBACK (card declined) / {a: 100, b: 0}", "ROLLBACK (card declined) / {a: 50, b: 0}", "{a: 50, b: 0}"], answer: 0,
        output: "ROLLBACK (card declined)\n{a: 100, b: 0}",
        check: { compiles: true, stdout: "ROLLBACK (card declined)\n{a: 100, b: 0}" },
        explain: L(
          "An exception inside the block restores the snapshot: all or nothing. ActiveRecord::Base.transaction rolls back on an exception too.",
          "Una excepción dentro del bloque restaura la copia: todo o nada. ActiveRecord::Base.transaction también hace rollback con una excepción.",
          "ブロック内の例外でスナップショットに戻す。全部か無か。transaction も例外でロールバックする。",
        ),
      },
      {
        topic: "database", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: 'class StaleObjectError < StandardError; end\nROW = {title: "A", lock_version: 0}\ndef update(copy, title)\n  raise StaleObjectError, "Attempted to update a stale object" if copy[:lock_version] != ROW[:lock_version]\n  ROW.update(title: title, lock_version: ROW[:lock_version] + 1)\nend\nada = ROW.dup\nbo = ROW.dup\nupdate(ada, "Ada\'s")\nupdate(bo, "Bo\'s")',
        options: [
          L("Ada's save wins; Bo's raises StaleObjectError", "Gana Ada; lo de Bo lanza StaleObjectError", "Ada が成功、Bo は StaleObjectError"),
          L("Bo's save silently overwrites Ada's", "Bo pisa a Ada en silencio", "Bo が Ada を黙って上書き"),
          L("Both raise StaleObjectError", "Ambos lanzan StaleObjectError", "両方 StaleObjectError"),
        ], answer: 0,
        check: { compiles: true, throws: "Attempted to update a stale object" },
        explain: L(
          "Optimistic locking: Ada's update bumps lock_version to 1; Bo still holds 0, so it fails. Rails does this with a lock_version column.",
          "Bloqueo optimista: Ada sube lock_version a 1; Bo aún tiene 0, así que falla. Rails lo hace con una columna lock_version.",
          "楽観的ロック：Ada の更新で lock_version が 1 に。Bo は 0 のままなので失敗。Rails も lock_version 列で行う。",
        ),
      },
      {
        topic: "database", difficulty: 3, kind: "predict",
        prompt: L("Index on (user_id, status) helps which queries?", "¿A qué consultas ayuda el índice (user_id, status)?", "(user_id, status) の索引が効くのは？"),
        code: "add_index :orders, [:user_id, :status]",
        options: [
          L("user_id alone, and both; not status alone", "user_id solo y ambos; no status solo", "user_id 単独と両方。status 単独は×"),
          L("Any combination, in any order", "Cualquier combinación", "どの組み合わせでも"),
          L("Only both columns together", "Solo ambas columnas juntas", "両方そろったときだけ"),
        ], answer: 0,
        explain: L(
          "A composite B-tree index is sorted by user_id first, so it serves queries on its leftmost prefix. status alone needs its own index.",
          "Un índice compuesto B-tree se ordena primero por user_id, así que sirve a consultas por su prefijo izquierdo. status solo necesita otro.",
          "複合 B-tree 索引は user_id 順に並ぶので左端の列から使える。status だけなら別の索引が必要。",
        ),
      },
      {
        topic: "database", difficulty: 2, kind: "pick",
        prompt: L("Lock the row: SELECT ... FOR UPDATE", "Bloquea la fila: SELECT ... FOR UPDATE", "行をロック：SELECT ... FOR UPDATE"),
        code: "Account.transaction do\n  account = Account.___.find(1)\n  account.update!(balance: account.balance - 50)\nend",
        options: ["lock", "readonly", "strict_loading"], answer: 0,
        explain: L(
          "Query Interface guide (pessimistic locking): lock adds FOR UPDATE, so other transactions wait until this one commits.",
          "Guía Query Interface (bloqueo pesimista): lock agrega FOR UPDATE; las otras transacciones esperan a que esta haga commit.",
          "Query Interface ガイド（悲観的ロック）：lock で FOR UPDATE が付き、他のトランザクションはコミットまで待つ。",
        ),
      },
      // migrations
      {
        topic: "migrations", difficulty: 3, kind: "predict",
        prompt: L("Add an index to a 50M-row PostgreSQL table", "Índice en una tabla PostgreSQL de 50M filas", "5千万行の PostgreSQL に索引を追加"),
        code: "add_index :events, :user_id",
        options: [
          L("May lock writes: use algorithm: :concurrently", "Puede bloquear escrituras: usa algorithm: :concurrently", "書き込みがロックされうる：:concurrently を使う"),
          L("Always safe in production", "Siempre seguro en producción", "本番でも常に安全"),
        ], answer: 0,
        explain: L(
          "A plain CREATE INDEX blocks writes while it builds. Migrations guide: algorithm: :concurrently (with disable_ddl_transaction!) avoids it.",
          "Un CREATE INDEX normal bloquea escrituras mientras se construye. Guía de Migrations: algorithm: :concurrently (con disable_ddl_transaction!) lo evita.",
          "普通の CREATE INDEX は作成中に書き込みを止める。:concurrently（disable_ddl_transaction! と併用）で回避。",
        ),
      },
      {
        topic: "migrations", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: "INVERSE = {add_column: :remove_column, create_table: :drop_table}\nops = [[:add_column, :posts, :body], [:execute, \"UPDATE posts SET body = ''\"]]\nops.reverse.map { |op, *args| [INVERSE.fetch(op), *args] }",
        options: [
          L("KeyError: execute has no known inverse", "KeyError: execute no tiene inverso conocido", "KeyError：execute の逆操作がない"),
          L("It rolls back both steps", "Revierte ambos pasos", "両方ロールバックする"),
        ], answer: 0,
        check: { compiles: true, throws: "key not found: :execute" },
        explain: L(
          "Raw SQL has no automatic inverse. Rails raises ActiveRecord::IrreversibleMigration; write up/down or a reversible block.",
          "El SQL crudo no tiene inverso automático. Rails lanza ActiveRecord::IrreversibleMigration; escribe up/down o un bloque reversible.",
          "生の SQL に自動の逆操作はない。Rails は IrreversibleMigration を出す。up/down か reversible を書こう。",
        ),
      },
      // callbacks
      {
        topic: "callbacks", difficulty: 2, kind: "predict",
        prompt: L("after_save sends mail, charges cards, reindexes…", "after_save envía mail, cobra, reindexa…", "after_save でメール・課金・再索引…"),
        code: "class Order < ApplicationRecord\n  after_save :email_customer, :charge_card\n  after_save :update_search, :notify_slack\nend",
        options: [
          L("Move it to a service object called explicitly", "Pásalo a un service object llamado a mano", "明示的に呼ぶサービスオブジェクトへ"),
          L("Add more callbacks for each case", "Agrega más callbacks por caso", "ケースごとにコールバックを追加"),
        ], answer: 0,
        explain: L(
          "Common practice (an opinion, not a rule): callbacks fire on every save, even in tests and scripts. The Callbacks guide warns to keep them light.",
          "Práctica común (una opinión, no una regla): los callbacks corren en cada save, incluso en tests y scripts. La guía de Callbacks pide mantenerlos ligeros.",
          "よくある方針（規則ではない）：コールバックはテストやスクリプトでも毎回動く。Callbacks ガイドも軽く保つよう勧める。",
        ),
      },
      {
        topic: "callbacks", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'module Sluggable\n  def self.included(base) = base.extend(ClassMethods)\n  module ClassMethods\n    def slug_from(field) = define_method(:slug) { send(field).downcase.tr(" ", "-") }\n  end\nend\nclass Post\n  include Sluggable\n  attr_reader :title\n  slug_from :title\n  def initialize(t) = @title = t\nend\nputs Post.new("Hello World").slug',
        options: ["hello-world", "Hello World", "hello world"], answer: 0,
        output: "hello-world",
        check: { compiles: true, stdout: "hello-world" },
        explain: L(
          "The included hook extends the class with a macro, slug_from, which defines slug. ActiveSupport::Concern wraps this pattern.",
          "El hook included extiende la clase con una macro, slug_from, que define slug. ActiveSupport::Concern envuelve este patrón.",
          "included フックでクラスにマクロ slug_from を追加し、それが slug を定義。Concern はこの形を包んだもの。",
        ),
      },
      // associations
      {
        topic: "associations", difficulty: 2, kind: "type",
        prompt: L("Comments on both posts and videos", "Comentarios en posts y videos", "記事にも動画にもコメント"),
        code: "class Comment < ApplicationRecord\n  belongs_to :commentable, ___: true\nend",
        answer: "polymorphic",
        explain: L(
          "Associations guide: a polymorphic belongs_to stores commentable_type and commentable_id, so one comment table serves many models.",
          "Guía de Associations: un belongs_to polymorphic guarda commentable_type y commentable_id: una tabla de comentarios sirve a muchos modelos.",
          "Associations ガイド：polymorphic は commentable_type と commentable_id を持ち、1つの表で複数モデルに対応。",
        ),
      },
      {
        topic: "associations", difficulty: 1, kind: "predict",
        prompt: L("Saving a Post with no author (Rails 5+ defaults)?", "¿Guardar un Post sin autor (Rails 5+)?", "著者なしで Post を保存（Rails 5 以降）"),
        code: "class Post < ApplicationRecord\n  belongs_to :author\nend\nPost.new(title: \"Hi\").save",
        options: [
          L("false: \"Author must exist\"", "false: \"Author must exist\"", "false：\"Author must exist\""),
          L("true, with author_id NULL", "true, con author_id NULL", "true（author_id は NULL）"),
        ], answer: 0,
        explain: L(
          "Associations guide: since Rails 5, belongs_to is required by default and adds a validation. Use optional: true to allow nil.",
          "Guía de Associations: desde Rails 5, belongs_to es obligatorio por defecto y suma una validación. Usa optional: true para permitir nil.",
          "Associations ガイド：Rails 5 以降 belongs_to は既定で必須。nil を許すなら optional: true。",
        ),
      },
      // caching
      {
        topic: "caching", difficulty: 3, kind: "pick",
        prompt: L("Russian doll: a comment change must expire the post", "Russian doll: cambiar un comentario expira el post", "ロシア人形：コメント変更で記事も失効"),
        code: "class Comment < ApplicationRecord\n  belongs_to :post, ___: true\nend",
        options: ["touch", "dependent", "counter_cache"], answer: 0,
        explain: L(
          "Caching guide: touch: true updates the post's updated_at when a comment changes, so the outer fragment's cache key changes too.",
          "Guía de Caching: touch: true actualiza updated_at del post cuando cambia un comentario, así cambia también la clave del fragmento exterior.",
          "Caching ガイド：touch: true でコメント変更時に記事の updated_at が更新され、外側のキーも変わる。",
        ),
      },
      {
        topic: "caching", difficulty: 1, kind: "predict", prompt: PRINT,
        code: 'class Cache\n  def initialize = @store = {}\n  def fetch(key)\n    return @store[key] if @store.key?(key)\n    @store[key] = yield\n  end\nend\ncache = Cache.new\n2.times { puts cache.fetch("stats") { puts "computing"; 42 } }',
        options: ["computing / 42 / 42", "computing / 42 / computing / 42", "42 / 42"], answer: 0,
        output: "computing\n42\n42",
        check: { compiles: true, stdout: "computing\n42\n42" },
        explain: L(
          "Read-through cache: the first fetch computes and stores, the next returns the stored value. Rails.cache.fetch has the same contract.",
          "Caché de lectura: el primer fetch calcula y guarda, el siguiente devuelve lo guardado. Rails.cache.fetch tiene el mismo contrato.",
          "1回目の fetch で計算して保存、次は保存値を返す。Rails.cache.fetch も同じ約束。",
        ),
      },
      {
        topic: "caching", difficulty: 3, kind: "predict", prompt: PRINT,
        code: 'class Ctrl\n  def current_user\n    return @current_user if defined?(@current_user)\n    puts "query"\n    @current_user = nil\n  end\nend\nc = Ctrl.new\n2.times { p c.current_user }',
        options: ["query / nil / nil", "query / nil / query / nil", "nil / nil"], answer: 0,
        output: "query\nnil\nnil",
        check: { compiles: true, stdout: "query\nnil\nnil" },
        explain: L(
          "defined? asks whether the variable was set, not whether it's truthy, so a nil (guest) result is memoized. ||= would query again.",
          "defined? pregunta si la variable se asignó, no si es verdadera; así un nil (invitado) queda memoizado. ||= consultaría otra vez.",
          "defined? は「代入済みか」を見るので nil（ゲスト）も覚える。||= だと毎回クエリ。",
        ),
      },
      // jobs
      {
        topic: "jobs", difficulty: 3, kind: "predict",
        prompt: L("Where to enqueue a job for a new record?", "¿Dónde encolar un job para un registro nuevo?", "新レコード用ジョブはどこで登録？"),
        code: "class User < ApplicationRecord\n  after_save { WelcomeJob.perform_later(self) }\n  # or: after_create_commit { ... }\nend",
        options: [
          L("after_commit: after_save may run before COMMIT", "after_commit: after_save puede correr antes del COMMIT", "after_commit：after_save は COMMIT 前かも"),
          L("after_save is fine; it's the same", "after_save sirve; es lo mismo", "after_save で同じ"),
        ], answer: 0,
        explain: L(
          "Callbacks guide: after_save runs inside the transaction. A fast worker may look for the user before it's committed, or after a rollback.",
          "Guía de Callbacks: after_save corre dentro de la transacción. Un worker rápido puede buscar al usuario antes del commit, o tras un rollback.",
          "Callbacks ガイド：after_save はトランザクション内。速いワーカーはコミット前やロールバック後に探してしまう。",
        ),
      },
      {
        topic: "jobs", difficulty: 2, kind: "predict",
        prompt: L("How does Active Job pass the user record?", "¿Cómo pasa Active Job el registro user?", "Active Job は user をどう渡す？"),
        code: "WelcomeJob.perform_later(user)",
        options: [
          L("As a GlobalID, reloaded when the job runs", "Como GlobalID, recargado al correr el job", "GlobalID で渡し、実行時に再読込"),
          L("The whole object is copied into the queue", "Copia el objeto entero en la cola", "オブジェクト丸ごとキューにコピー"),
        ], answer: 0,
        explain: L(
          "Active Job guide: records are serialized as GlobalIDs (gid://app/User/1) and found again when performed, so the job sees fresh data.",
          "Guía de Active Job: los registros se serializan como GlobalID (gid://app/User/1) y se buscan al ejecutar, así el job ve datos frescos.",
          "Active Job ガイド：レコードは GlobalID（gid://app/User/1）で保存し実行時に探し直す。だから最新データ。",
        ),
      },
      {
        topic: "jobs", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'attempts = 0\nbegin\n  attempts += 1\n  raise "timeout" if attempts < 3\n  puts "sent after #{attempts} tries"\nrescue\n  retry\nend',
        options: ["sent after 3 tries", "sent after 1 tries", "sent after 2 tries"], answer: 0,
        output: "sent after 3 tries",
        check: { compiles: true, stdout: "sent after 3 tries" },
        explain: L(
          "retry reruns the whole begin block, side effects included. Active Job's retry_on reruns perform the same way: make it idempotent.",
          "retry vuelve a correr todo el bloque begin, efectos incluidos. retry_on de Active Job reejecuta perform igual: hazlo idempotente.",
          "retry は begin ブロック全体を副作用ごと再実行。retry_on も perform を丸ごと再実行するので冪等に。",
        ),
      },
      // security
      {
        topic: "security", difficulty: 2, kind: "pick",
        prompt: L("Right after a successful login, call…", "Justo tras un login exitoso, llama a…", "ログイン成功の直後に呼ぶのは…"),
        code: "def create\n  user = User.authenticate_by(params.permit(:email, :password))\n  ___\n  session[:user_id] = user.id\nend",
        options: ["reset_session", "flash.clear", "cookies.clear"], answer: 0,
        explain: L(
          "Security guide (session fixation): reset_session issues a new session id at login, so an id an attacker planted becomes useless.",
          "Guía de Security (session fixation): reset_session emite un id de sesión nuevo al iniciar sesión; un id plantado por un atacante deja de servir.",
          "Security ガイド（セッション固定）：reset_session でログイン時に新しい id に。攻撃者の仕込んだ id は無効に。",
        ),
      },
      {
        topic: "security", difficulty: 3, kind: "predict",
        prompt: L("What's the concern with this line?", "¿Cuál es el problema de esta línea?", "この行の懸念は？"),
        code: "redirect_to params[:return_to]",
        options: [
          L("Open redirect: check it against an allow list", "Redirect abierto: valida contra una lista", "オープンリダイレクト：許可リストで確認"),
          L("None: redirects are always safe", "Ninguno: los redirects son seguros", "なし：リダイレクトは常に安全"),
        ], answer: 0,
        explain: L(
          "Security guide (redirection): a link can send users to a phishing site through your domain. Allow only known paths or hosts.",
          "Guía de Security (redirección): un enlace puede mandar usuarios a un sitio de phishing a través de tu dominio. Permite solo rutas conocidas.",
          "Security ガイド（リダイレクト）：自サイト経由でフィッシングへ送られる。既知のパスやホストだけ許可しよう。",
        ),
      },
      {
        topic: "security", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'require "securerandom"\nsession = {csrf: SecureRandom.hex(16)}\nvalid = ->(verb, token) { verb == "GET" || token == session[:csrf] }\np valid.("GET", nil)\np valid.("POST", "forged")\np valid.("POST", session[:csrf])',
        options: ["true / false / true", "false / false / true", "true / true / true"], answer: 0,
        output: "true\nfalse\ntrue",
        check: { compiles: true, stdout: "true\nfalse\ntrue" },
        explain: L(
          "Our mini CSRF check skips GET and demands the session's secret on POST: a forged token fails. Rails' authenticity token works this way.",
          "Nuestro mini control CSRF ignora GET y exige el secreto de la sesión en POST: un token falso falla. El authenticity token de Rails funciona así.",
          "ミニ版 CSRF は GET を通し、POST ではセッションの秘密を要求。偽物は失敗。Rails のトークンも同じ。",
        ),
      },
      // architecture
      {
        topic: "architecture", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'app = ->(env) { [200, {}, ["Hello #{env["PATH_INFO"]}"]] }\nclass Timing\n  def initialize(app) = @app = app\n  def call(env)\n    status, headers, body = @app.call(env)\n    [status, headers.merge("x-runtime" => "1ms"), body]\n  end\nend\np Timing.new(app).call({"PATH_INFO" => "/posts"})',
        options: ['[200, {"x-runtime" => "1ms"}, ["Hello /posts"]]', '[200, {}, ["Hello /posts"]]', '["Hello /posts"]'], answer: 0,
        output: '[200, {"x-runtime" => "1ms"}, ["Hello /posts"]]',
        check: { compiles: true, stdout: '[200, {"x-runtime" => "1ms"}, ["Hello /posts"]]' },
        explain: L(
          "A Rack app is anything with call(env) returning [status, headers, body]. Middleware wraps the app and can change the response, as in Rails.",
          "Una app Rack es algo con call(env) que devuelve [status, headers, body]. Un middleware envuelve la app y puede cambiar la respuesta, como en Rails.",
          "Rack アプリは call(env) で [status, headers, body] を返すもの。ミドルウェアは包んで応答を変えられる。",
        ),
      },
      {
        topic: "architecture", difficulty: 2, kind: "predict", prompt: PRINT,
        code: 'class Post\n  def kind = "post"\nend\nclass Video < Post\n  def kind = "video"\nend\nrows = [{type: "Post"}, {type: "Video"}]\np rows.map { Object.const_get(it[:type]).new.kind }',
        options: ['["post", "video"]', '["post", "post"]', '["Post", "Video"]'], answer: 0,
        output: '["post", "video"]',
        check: { compiles: true, stdout: '["post", "video"]' },
        explain: L(
          "Single Table Inheritance in miniature: the type column names the class to build. Rails STI uses a type column the same way.",
          "Herencia de tabla única en miniatura: la columna type dice qué clase construir. El STI de Rails usa una columna type igual.",
          "単一テーブル継承のミニ版：type 列がどのクラスを作るかを決める。Rails の STI も type 列を使う。",
        ),
      },
      {
        topic: "architecture", difficulty: 2, kind: "pick",
        prompt: L("app/models/admin/user.rb must define…", "app/models/admin/user.rb debe definir…", "app/models/admin/user.rb が定義するのは…"),
        code: "# app/models/admin/user.rb\nclass ___ < ApplicationRecord\nend",
        options: ["Admin::User", "AdminUser", "User"], answer: 0,
        explain: L(
          "Autoloading guide: Zeitwerk maps folders to namespaces and file names to constants, so admin/user.rb must define Admin::User.",
          "Guía de Autoloading: Zeitwerk mapea carpetas a namespaces y archivos a constantes, así admin/user.rb debe definir Admin::User.",
          "Autoloading ガイド：Zeitwerk はフォルダを名前空間、ファイル名を定数に対応させる。admin/user.rb は Admin::User。",
        ),
      },
      // testing
      {
        topic: "testing", difficulty: 2, kind: "predict",
        prompt: L("Does the test pass?", "¿Pasa el test?", "テストは通る？"),
        code: 'require "minitest"\nclass FindTest < Minitest::Test\n  def test_missing = assert_raises(KeyError) { {}.fetch(:id) }\nend\nputs FindTest.new(:test_missing).run.passed?',
        options: [L("Yes: true", "Sí: true", "はい：true"), L("No: false", "No: false", "いいえ：false")], answer: 0,
        output: "true",
        check: { compiles: true, stdout: "true" },
        explain: L(
          "assert_raises passes when the block raises that error: fetch on a missing key raises KeyError. Rails tests use Minitest by default.",
          "assert_raises pasa si el bloque lanza ese error: fetch con una clave ausente lanza KeyError. Los tests de Rails usan Minitest por defecto.",
          "assert_raises はブロックがその例外を出せば成功。fetch は KeyError を出す。Rails の標準テストは Minitest。",
        ),
      },
    ],
  },
];
