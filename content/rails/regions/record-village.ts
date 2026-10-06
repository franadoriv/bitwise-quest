import type { LessonDef, RegionDef } from "../../../lib/content/types.ts";
import { L, say, enemySays } from "../../rust/helpers.ts";
import { MINI_RECORD, withHelper } from "../mini.ts";

// REGION 1 · RECORD VILLAGE  (Active Record under the hood: models, finders, lazy relations, migrations)
// Rails can't run in the sandbox: snippets are small plain-Ruby versions of its mechanisms ("our mini version"),
// verified on Ruby 3.4.7. Questions about the real Rails API have no `check` and follow the Rails Guides.

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");
const rec = (code: string) => withHelper(MINI_RECORD, code);

// ─── 1.1 Rows become objects ───────────────────────────────────────────────
const TABLE_CODE = `class Model
  def self.table = name.downcase + "s"
end
class Post < Model; end
puts Post.table`;

const DEFINE_CODE = `class Post
  [:title, :body].each do |col|
    define_method(col) { @attrs[col] }
  end
  def initialize(attrs) = @attrs = attrs
end
post = Post.new(title: "Hi")`;

const PERSIST_CODE = `class Post
  attr_reader :id
  def save = @id = 1
  def persisted? = !@id.nil?
end
post = Post.new
puts post.persisted?
post.save
puts post.persisted?`;

const models: LessonDef = {
  slug: "models-and-tables",
  title: L("Rows become objects", "Filas que son objetos", "行がオブジェクトに"),
  concept: "models",
  mode: "lesson",
  xp: 60,
  enemy: "rails/mass-burglar",
  enemyName: L("ROW BURGLAR", "LADRÓN DE FILAS", "ぎょうドロボウ"),
  beats: [
    say(L(
      "Welcome to Record Village! A Rails model is just a Ruby class that learned a few tricks. We'll build our mini version of each.",
      "¡Bienvenido a Record Village! Un modelo de Rails es una clase Ruby con unos trucos. Haremos nuestra mini versión de cada uno.",
      "レコード村へようこそ！Rails のモデルは技を覚えた Ruby クラス。ミニ版で一つずつ作ろう。",
    )),
    say(L(
      "Rails splits an app in three: the Model talks to the database, the View draws HTML, the Controller handles requests.",
      "Rails divide una app en tres: el Modelo habla con la base de datos, la Vista dibuja HTML, el Controlador atiende peticiones.",
      "Rails はアプリを3つに分ける。モデルは DB と話し、ビューは HTML を描き、コントローラは要求をさばく。",
    )),
    {
      kind: "pick",
      prompt: L("In MVC, which part talks to the database?", "En MVC, ¿qué parte habla con la base de datos?", "MVC で DB と話すのはどれ？"),
      code: "# M ___ V C",
      options: [L("Model", "Modelo", "モデル"), L("View", "Vista", "ビュー"), L("Controller", "Controlador", "コントローラ")],
      answer: 0,
      explain: L("The model owns the data: it reads and writes rows. Views only display, controllers coordinate.", "El modelo es dueño de los datos: lee y escribe filas. Las vistas muestran, los controladores coordinan.", "データ担当はモデル。行を読み書きする。ビューは表示、コントローラは調整役。"),
      setup: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "Post" }],
      win: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "say", actor: "hero", text: L("I keep the rows!", "¡Guardo las filas!", "行はぼくの係！") }],
    },
    say(L(
      "Convention over configuration: class Post maps to table posts. No config file, just names. Here's the trick in mini.",
      "Convención sobre configuración: la clase Post va con la tabla posts. Sin archivos de config, solo nombres. Mira el truco en mini.",
      "設定より規約：クラス Post はテーブル posts に対応。設定ファイル不要、名前だけ。ミニ版で見よう。",
    )),
    {
      kind: "act",
      prompt: L("Press in order: a class finds its table", "Pulsa en orden: una clase encuentra su tabla", "順番に押そう：クラスがテーブルを見つける"),
      steps: [
        { label: L("BASE CLASS", "CLASE BASE", "親クラス"), line: 'class Model; def self.table = name.downcase + "s"; end', effects: [{ t: "item", kind: "scroll", holder: "ally" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "posts" }] },
        { label: L("MODEL Post", "MODELO Post", "モデル Post"), line: "class Post < Model; end", effects: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "Post" }] },
        { label: L("ASK TABLE", "PEDIR TABLA", "テーブルは？"), line: "puts Post.table", output: "posts", effects: [{ t: "print", text: "posts" }, { t: "banner", text: L("Post ↔ posts", "Post ↔ posts", "Post ↔ posts") }] },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: TABLE_CODE,
      options: ["posts", "Post", "post"],
      answer: 0,
      output: "posts",
      check: { compiles: true, stdout: "posts" },
      explain: L("name is the class name \"Post\". downcase gives \"post\", plus \"s\" gives \"posts\".", "name es el nombre de la clase, \"Post\". downcase da \"post\" y con \"s\" queda \"posts\".", "name はクラス名 \"Post\"。downcase で \"post\"、\"s\" を足して \"posts\"。"),
      win: [{ t: "print", text: "posts" }],
    },
    say(L(
      "Our mini version just adds an s. Real Rails uses an inflector that knows English plurals and snake_case.",
      "Nuestra mini versión solo agrega una s. Rails real usa un inflector que conoce plurales en inglés y snake_case.",
      "ミニ版は s を足すだけ。本物の Rails は英語の複数形と snake_case を知る「活用器」を使う。",
    )),
    {
      kind: "pick",
      prompt: L("Rails: table name for model Person?", "Rails: ¿tabla para el modelo Person?", "Rails：モデル Person のテーブル名は？"),
      code: "class Person < ApplicationRecord; end\n# table: ___",
      options: ["people", "persons", "person"],
      answer: 0,
      explain: L("The Rails inflector knows irregular plurals: Person → people. Our mini + \"s\" would say persons.", "El inflector de Rails conoce plurales irregulares: Person → people. Nuestro mini + \"s\" diría persons.", "Rails の活用器は不規則な複数形を知っている：Person → people。ミニ版なら persons。"),
    },
    {
      kind: "pick",
      prompt: L("Rails: table name for model BookClub?", "Rails: ¿tabla para el modelo BookClub?", "Rails：モデル BookClub のテーブル名は？"),
      code: "class BookClub < ApplicationRecord; end\n# table: ___",
      options: ["book_clubs", "bookclubs", "BookClubs"],
      answer: 0,
      explain: L("CamelCase class names become snake_case plural tables: BookClub → book_clubs.", "Las clases en CamelCase pasan a tablas en snake_case y plural: BookClub → book_clubs.", "CamelCase のクラス名は snake_case の複数形に：BookClub → book_clubs。"),
    },
    say(L(
      "Each column becomes a method. Rails doesn't hand-write them: our mini version loops and calls define_method.",
      "Cada columna se vuelve un método. Rails no los escribe a mano: nuestra mini versión recorre y llama define_method.",
      "列はそれぞれメソッドになる。手書きじゃない。ミニ版はループで define_method を呼ぶよ。",
    )),
    {
      kind: "act",
      prompt: L("Press in order: a row becomes an object", "Pulsa en orden: una fila se vuelve objeto", "順番に押そう：行がオブジェクトになる"),
      steps: [
        { label: L("ROW", "FILA", "行"), line: 'post = Post.new(title: "Hi")', effects: [{ t: "enter", actor: "ally" }, { t: "item", kind: "gem", holder: "ally" }, { t: "tag", actor: "ally", text: "row" }] },
        { label: L("DEFINE title", "DEFINIR title", "title を定義"), line: "define_method(:title) { @attrs[:title] }", effects: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "post" }, { t: "say", actor: "hero", text: L("New method!", "¡Método nuevo!", "新メソッド！") }] },
        { label: L("READ", "LEER", "読む"), line: "p post.title", output: '"Hi"', effects: [{ t: "give", to: "hero" }, { t: "value", actor: "hero", text: '"Hi"' }, { t: "print", text: '"Hi"' }] },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: `${DEFINE_CODE}\np post.title\np post.body`,
      options: ['"Hi" / nil', '"Hi" / NoMethodError', '"Hi" / ""'],
      answer: 0,
      output: '"Hi"\nnil',
      check: { compiles: true, stdout: '"Hi"\nnil' },
      explain: L("Both methods exist. body reads @attrs[:body], and a missing hash key gives nil.", "Ambos métodos existen. body lee @attrs[:body], y una clave ausente da nil.", "メソッドは両方ある。body は @attrs[:body] を読み、無いキーは nil。"),
      win: [{ t: "print", text: '"Hi"' }, { t: "print", text: "nil" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: `${DEFINE_CODE}\np post.respond_to?(:title)`,
      options: ["true", "false"],
      answer: 0,
      output: "true",
      check: { compiles: true, stdout: "true" },
      explain: L("define_method creates real methods, so respond_to? sees them.", "define_method crea métodos reales, así que respond_to? los ve.", "define_method は本物のメソッドを作るから respond_to? にも見える。"),
    },
    say(L(
      "new builds an object in memory only. save writes it to the database, which hands back an id. Then it's persisted.",
      "new crea un objeto solo en memoria. save lo escribe en la base de datos, que le da un id. Entonces está persistido.",
      "new はメモリ上だけ。save で DB に書くと id がもらえる。これで「永続化」済み。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: PERSIST_CODE,
      options: ["false / true", "true / true", "false / false"],
      answer: 0,
      output: "false\ntrue",
      check: { compiles: true, stdout: "false\ntrue" },
      explain: L("Before save there is no id, so persisted? is false. save sets the id: true.", "Antes de save no hay id, así que persisted? es false. save asigna el id: true.", "save 前は id が無いので false。save で id が入って true。"),
      setup: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "post" }],
      win: [{ t: "value", actor: "hero", text: "id: 1" }, { t: "print", text: "false" }, { t: "print", text: "true" }],
    },
    {
      kind: "pick",
      prompt: L("Rails: which one writes to the database?", "Rails: ¿cuál escribe en la base de datos?", "Rails：DB に書くのはどっち？"),
      code: '___\n# INSERT INTO posts ...',
      options: ['Post.create(title: "x")', 'Post.new(title: "x")'],
      answer: 0,
      explain: L("create is new + save in one step. new alone only builds the object in memory.", "create es new + save en un paso. new solo construye el objeto en memoria.", "create は new + save を一度に。new だけではメモリ上に作るだけ。"),
    },
    {
      kind: "type",
      prompt: L("Rails: default primary key column", "Rails: columna de clave primaria por defecto", "Rails：標準の主キー列"),
      code: "Post.find(1)\n# SELECT * FROM posts WHERE ___ = 1",
      answer: "id",
      explain: L("Every table gets an id primary key by default, filled in by the database.", "Cada tabla tiene por defecto una clave primaria id, que llena la base de datos.", "どのテーブルにも標準で主キー id があり、DB が値を入れる。"),
    },
    say(L(
      "From now on a hidden mini Model class is loaded for you. attribute :title defines a reader title AND a writer title=.",
      "Desde ahora se carga una mini clase Model oculta. attribute :title define un lector title Y un escritor title=.",
      "ここから隠しミニ Model クラスが読み込まれる。attribute :title は読む title と書く title= を作る。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "class Post < Model\n  attribute :title\nend\np Post.instance_methods(false)",
      options: ["[:title, :title=]", "[:title]", "[:attribute]"],
      answer: 0,
      output: "[:title, :title=]",
      check: { compiles: true, program: rec("class Post < Model\n  attribute :title\nend\np Post.instance_methods(false)"), stdout: "[:title, :title=]" },
      explain: L("attribute ran define_method twice inside Post: one reader, one writer ending in =.", "attribute llamó dos veces a define_method en Post: un lector y un escritor que termina en =.", "attribute は Post の中で define_method を2回呼んだ。読む用と = で終わる書く用。"),
    },
    {
      kind: "run",
      prompt: L("Fix the writer: it must print Hello", "Arregla el escritor: debe imprimir Hello", "書き込みを直そう：Hello と表示させて"),
      starter: `class Model
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
`,
      solution: `class Model
  def self.attribute(*names)
    names.each do |n|
      define_method(n) { @attrs[n] }
      define_method("#{n}=") { |v| @attrs[n] = v }
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
`,
      expect: "Hello",
      fallback: [String.raw`define_method\(\s*:?"#\{n\}="`, String.raw`define_method\(\s*\(?\s*n\.to_s\s*\+\s*"="`, String.raw`define_method\(\s*:"#\{n\}="`],
      explain: L("The writer must be named title=, so define it as \"#{n}=\". Defining n twice just replaced the reader.", "El escritor debe llamarse title=, así que defínelo como \"#{n}=\". Definir n dos veces reemplazó al lector.", "書く用は title= という名前。\"#{n}=\" で定義しよう。n を2回定義すると読む用が上書きされる。"),
    },
  ],
};

// ─── 1.2 Find or fall ──────────────────────────────────────────────────────
const FIND_CLASS = `class RecordNotFound < StandardError; end
class Post
  ROWS = [{id: 1, title: "Hi"}, {id: 2, title: "Yo"}]
  def self.find_by(cond) = ROWS.find { |r| cond.all? { |k, v| r[k] == v } }
  def self.find(id) = find_by(id: id) || raise(RecordNotFound, "Couldn't find Post with 'id'=#{id}")
end`;

const MM_CLASS = `class Post
  ROWS = [{id: 1, title: "Hi"}]
  def self.method_missing(name, *args)
    if name.start_with?("find_by_")
      col = name.to_s.delete_prefix("find_by_").to_sym
      ROWS.find { |r| r[col] == args[0] }
    else
      super
    end
  end
end`;

const RTM_CODE = `class Post
  def self.method_missing(name, *args)
    name.start_with?("find_by_") ? "found" : super
  end
  def self.___(name, priv = false) = name.start_with?("find_by_") || super
end
p Post.respond_to?(:find_by_title)
p Post.find_by_title("Hi")`;

const finders: LessonDef = {
  slug: "finders",
  title: L("Find or fall", "Encontrar o caer", "見つけるか、落ちるか"),
  concept: "finders",
  mode: "lesson",
  xp: 60,
  enemy: "ghost",
  enemyName: L("NIL GHOST", "FANTASMA NIL", "ニルゴースト"),
  beats: [
    say(L(
      "Three ways to search the archive: find(id) MUST find it, find_by may come back empty, where always brings a list.",
      "Tres formas de buscar en el archivo: find(id) DEBE encontrarlo, find_by puede volver vacío, where siempre trae una lista.",
      "書庫の探し方は3つ。find(id) は必ず見つける、find_by は空もある、where はいつもリスト。",
    )),
    {
      kind: "act",
      prompt: L("Press in order: search the archive", "Pulsa en orden: busca en el archivo", "順番に押そう：書庫を探す"),
      steps: [
        { label: L("find_by 9", "find_by 9", "find_by 9"), line: "p Post.find_by(id: 9)", output: "nil", effects: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "Post" }, { t: "item", kind: "scroll", holder: "hero" }, { t: "say", actor: "hero", text: L("Nothing... nil.", "Nada... nil.", "なし…nil。") }, { t: "print", text: "nil" }] },
        { label: L("find 2", "find 2", "find 2"), line: "p Post.find(2)", output: '{id: 2, title: "Yo"}', effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "print", text: '{id: 2, title: "Yo"}' }] },
        {
          label: L("find 9", "find 9", "find 9"),
          line: "Post.find(9)",
          effects: [{ t: "shake" }, { t: "say", actor: "hero", text: L("I promised!", "¡Lo prometí!", "約束したのに！") }],
          error: {
            compiler: "Couldn't find Post with 'id'=9 (RecordNotFound)",
            plain: L("find promises a record. With no row it raises an error instead of returning nil.", "find promete un registro. Sin fila, lanza un error en vez de devolver nil.", "find は必ず返す約束。行が無いと nil ではなくエラーを投げる。"),
          },
        },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: `${FIND_CLASS}\np Post.find_by(id: 9)\np Post.find(2)`,
      options: ['nil / {id: 2, title: "Yo"}', '{} / {id: 2, title: "Yo"}', 'nil / nil'],
      answer: 0,
      output: 'nil\n{id: 2, title: "Yo"}',
      check: { compiles: true, stdout: 'nil\n{id: 2, title: "Yo"}' },
      explain: L("find_by returns nil when nothing matches. find(2) finds the row with id 2.", "find_by devuelve nil si nada coincide. find(2) encuentra la fila con id 2.", "find_by は一致なしで nil。find(2) は id 2 の行を見つける。"),
      win: [{ t: "print", text: "nil" }, { t: "print", text: '{id: 2, title: "Yo"}' }],
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: `${FIND_CLASS}\nPost.find(9)`,
      options: [L("RecordNotFound error", "Error RecordNotFound", "RecordNotFound エラー"), L("Returns nil quietly", "Devuelve nil en silencio", "だまって nil を返す")],
      answer: 0,
      check: { compiles: true, throws: "Couldn't find Post with 'id'=9" },
      explain: L("find_by gives nil, and || raise turns that nil into an error. find never hands back nil.", "find_by da nil, y || raise convierte ese nil en error. find nunca devuelve nil.", "find_by の nil を || raise がエラーに変える。find は nil を返さない。"),
      setup: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "Post" }],
      win: [{ t: "shake" }, { t: "banner", text: L("RECORD NOT FOUND", "NO ENCONTRADO", "見つからない") }],
    },
    {
      kind: "pick",
      prompt: L("Rails: Post.find(9) with no such row…", "Rails: Post.find(9) sin esa fila…", "Rails：その行が無い Post.find(9) は…"),
      code: "Post.find(9)\n# ___",
      options: [L("raises RecordNotFound", "lanza RecordNotFound", "RecordNotFound を投げる"), L("returns nil", "devuelve nil", "nil を返す")],
      answer: 0,
      explain: L("Rails raises ActiveRecord::RecordNotFound. In production, a controller turns it into a 404 page.", "Rails lanza ActiveRecord::RecordNotFound. En producción, el controlador lo convierte en una página 404.", "Rails は ActiveRecord::RecordNotFound を投げる。本番ではコントローラが 404 ページにする。"),
    },
    say(L(
      "where is like Ruby's select: always a collection, maybe empty. find_by is like Ruby's find: one thing or nil.",
      "where es como select de Ruby: siempre una colección, quizá vacía. find_by es como find de Ruby: una cosa o nil.",
      "where は Ruby の select 風：いつもコレクション（空もある）。find_by は find 風：1件か nil。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: 'ROWS = [{id: 1, title: "Hi"}]\np ROWS.select { |r| r[:title] == "Nope" }\np ROWS.find { |r| r[:title] == "Nope" }',
      options: ["[] / nil", "nil / nil", "[] / []"],
      answer: 0,
      output: "[]\nnil",
      check: { compiles: true, stdout: "[]\nnil" },
      explain: L("select always returns an array (here empty). find returns one element or nil.", "select siempre devuelve un array (aquí vacío). find devuelve un elemento o nil.", "select はいつも配列（ここは空）。find は1つか nil。"),
    },
    {
      kind: "pick",
      prompt: L("Rails: Post.where(id: 1) returns…", "Rails: Post.where(id: 1) devuelve…", "Rails：Post.where(id: 1) が返すのは…"),
      code: "posts = Post.where(id: 1)\n# posts is ___",
      options: [L("a relation (collection)", "una relación (colección)", "リレーション（集まり）"), L("one Post object", "un objeto Post", "Post 1件")],
      answer: 0,
      explain: L("where always returns a relation, even for one match. Use find_by or .first for a single record.", "where siempre devuelve una relación, aunque haya una coincidencia. Usa find_by o .first para un registro.", "where は1件でもリレーション。1件が欲しいなら find_by か .first。"),
    },
    {
      kind: "pick",
      prompt: L("Safer when the record may not exist", "Más seguro si el registro puede no existir", "無いかもしれない時に安全なのは"),
      code: "post = Post.___(slug: params[:slug])\nreturn if post.nil?",
      options: ["find_by", "find"],
      answer: 0,
      explain: L("find_by returns nil, which you can handle. find would raise when the row is missing.", "find_by devuelve nil, que puedes manejar. find lanzaría un error si falta la fila.", "find_by は nil を返すので対処できる。find は行が無いとエラー。"),
    },
    say(L(
      "Rails also answers find_by_title(\"Hi\"), but no such method is written anywhere! Ruby's method_missing catches unknown calls.",
      "Rails también responde find_by_title(\"Hi\"), ¡pero ese método no está escrito en ningún lado! method_missing atrapa llamadas desconocidas.",
      "Rails は find_by_title(\"Hi\") にも答えるけど、そんなメソッドは無い！method_missing が未知の呼び出しを拾う。",
    )),
    {
      kind: "act",
      prompt: L("Press in order: an unknown spell", "Pulsa en orden: un hechizo desconocido", "順番に押そう：知らない呪文"),
      steps: [
        { label: L("CALL", "LLAMAR", "呼ぶ"), line: 'Post.find_by_title("Hi")', effects: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "Post" }, { t: "say", actor: "hero", text: L("find_by_title?", "¿find_by_title?", "find_by_title？") }] },
        { label: L("CATCH", "ATRAPAR", "拾う"), line: "def self.method_missing(name, *args)", effects: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "say", actor: "hero", text: L("I'll improvise!", "¡Improviso!", "アドリブだ！") }] },
        { label: L("SPLIT NAME", "CORTAR NOMBRE", "名前を切る"), line: 'col = name.to_s.delete_prefix("find_by_").to_sym', effects: [{ t: "tag", actor: "hero", text: ":title" }] },
        { label: L("SEARCH", "BUSCAR", "探す"), line: "ROWS.find { |r| r[col] == args[0] }", output: '{id: 1, title: "Hi"}', effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "print", text: '{id: 1, title: "Hi"}' }] },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: `${MM_CLASS}\np Post.find_by_title("Hi")\np Post.respond_to?(:find_by_title)`,
      options: ['{id: 1, title: "Hi"} / false', '{id: 1, title: "Hi"} / true', "nil / false"],
      answer: 0,
      output: '{id: 1, title: "Hi"}\nfalse',
      check: { compiles: true, stdout: '{id: 1, title: "Hi"}\nfalse' },
      explain: L("method_missing answers the call, but respond_to? doesn't know: no real method exists.", "method_missing responde la llamada, pero respond_to? no lo sabe: no existe un método real.", "呼び出しには method_missing が答えるが、本物のメソッドは無いので respond_to? は false。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: `${MM_CLASS}\nPost.fly`,
      options: [L("NoMethodError", "NoMethodError", "NoMethodError"), L("Returns nil", "Devuelve nil", "nil を返す")],
      answer: 0,
      check: { compiles: true, throws: "undefined method 'fly' for class Post" },
      explain: L("fly doesn't start with find_by_, so super runs the normal method_missing: NoMethodError.", "fly no empieza con find_by_, así que super ejecuta el method_missing normal: NoMethodError.", "fly は find_by_ で始まらないので super が通常処理へ：NoMethodError。"),
      win: [{ t: "shake" }],
    },
    say(L(
      "A polite method_missing also defines respond_to_missing?, so respond_to? tells the truth about the magic names.",
      "Un method_missing educado también define respond_to_missing?, así respond_to? dice la verdad sobre los nombres mágicos.",
      "礼儀正しい method_missing は respond_to_missing? も定義する。これで respond_to? が正直になる。",
    )),
    {
      kind: "type",
      prompt: L("Make respond_to? honest", "Haz honesto a respond_to?", "respond_to? を正直に"),
      code: RTM_CODE,
      answer: "respond_to_missing?",
      check: { compiles: true, stdout: 'true\n"found"' },
      explain: L("respond_to? asks respond_to_missing? for names it can't find. Now it says true for find_by_*.", "respond_to? pregunta a respond_to_missing? por nombres que no encuentra. Ahora dice true para find_by_*.", "respond_to? は見つからない名前を respond_to_missing? に聞く。find_by_* で true になる。"),
    },
    {
      kind: "pick",
      prompt: L("Rails: first vs take", "Rails: first vs take", "Rails：first と take"),
      code: "Post.first  # vs Post.take\n# ___",
      options: [L("first orders by id, take doesn't", "first ordena por id, take no", "first は id 順、take は順不同"), L("they're identical", "son idénticos", "まったく同じ")],
      answer: 0,
      explain: L("first adds ORDER BY id when there's no order. take just grabs any row, with no ordering.", "first agrega ORDER BY id si no hay orden. take toma cualquier fila, sin ordenar.", "first は順序が無いと ORDER BY id を足す。take は並べずに1行取る。"),
    },
    {
      kind: "run",
      prompt: L("find must raise: print the 404 line", "find debe lanzar: muestra la línea 404", "find はエラーに：404 の行を出そう"),
      starter: `class RecordNotFound < StandardError; end
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
`,
      solution: `class RecordNotFound < StandardError; end
class Post
  ROWS = [{id: 1, title: "Hi"}]
  def self.find_by(cond) = ROWS.find { |r| cond.all? { |k, v| r[k] == v } }
  def self.find(id) = find_by(id: id) || raise(RecordNotFound, "Couldn't find Post with 'id'=#{id}")
end
begin
  Post.find(7)
  puts "found?"
rescue RecordNotFound => e
  puts "404: #{e.message}"
end
`,
      expect: "404: Couldn't find Post with 'id'=7",
      fallback: [String.raw`raise\s*\(?\s*RecordNotFound\s*,\s*"Couldn't find Post with 'id'=#\{id\}"`],
      explain: L("Our find returned nil. Add || raise(RecordNotFound, \"Couldn't find Post with 'id'=#{id}\").", "Nuestro find devolvía nil. Agrega || raise(RecordNotFound, \"Couldn't find Post with 'id'=#{id}\").", "find が nil を返していた。|| raise(RecordNotFound, \"...\") を足そう。"),
    },
  ],
};

// ─── 1.3 The sealed scroll ─────────────────────────────────────────────────
const LAZY_CLASS = `class Relation
  def initialize(rows, conds = {}) = (@rows, @conds = rows, conds)
  def where(c) = Relation.new(@rows, @conds.merge(c))
  def to_a
    puts "QUERY #{@conds}"
    @rows.select { |r| @conds.all? { |k, v| r[k] == v } }
  end
end
rows = [{id: 1, pub: true}, {id: 2, pub: false}]`;

const MEMO_CODE = `class Relation
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
p rel.to_a.size`;

const ENUM_CODE = `class Relation
  include Enumerable
  def initialize(rows) = @rows = rows
  def each(&) = @rows.each(&)
end
rel = Relation.new([{id: 1}, {id: 2}])
p rel.map { it[:id] }
p rel.count`;

const SQL_CODE = `class Post < Model
  attribute :title, :pub
end
puts Post.where(pub: true).order(:id).limit(2).to_sql`;

const COUNT_CODE = `class Post < Model
  attribute :title, :pub
end
DB.queries = 0
r = Post.where(pub: true)
puts DB.queries
r.to_a
r.to_a
puts DB.queries`;

const lazy: LessonDef = {
  slug: "lazy-relations",
  title: L("The sealed scroll", "El pergamino sellado", "封印された巻物"),
  concept: "relations",
  mode: "lesson",
  xp: 70,
  enemy: "rails/n-plus-one",
  enemyName: L("QUERY SWARM", "ENJAMBRE SQL", "クエリの群れ"),
  beats: [
    say(L(
      "Post.where(pub: true) doesn't search yet! It hands you a sealed scroll: a Relation that only remembers the conditions.",
      "¡Post.where(pub: true) aún no busca! Te da un pergamino sellado: una Relation que solo recuerda las condiciones.",
      "Post.where(pub: true) はまだ探さない！条件を覚えただけの封印された巻物、Relation を渡すんだ。",
    )),
    {
      kind: "act",
      prompt: L("Press in order: when does the query run?", "Pulsa en orden: ¿cuándo corre la consulta?", "順番に押そう：クエリはいつ走る？"),
      steps: [
        { label: L("where", "where", "where"), line: "rel = Relation.new(rows).where(pub: true)", effects: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "rel" }, { t: "item", kind: "scroll", holder: "hero" }, { t: "say", actor: "hero", text: L("Not yet!", "¡Todavía no!", "まだだよ！") }] },
        { label: L("puts built", "puts built", "puts built"), line: 'puts "built"', output: "built", effects: [{ t: "print", text: "built" }, { t: "banner", text: L("QUERIES: 0", "CONSULTAS: 0", "クエリ：0") }] },
        { label: L("OPEN to_a", "ABRIR to_a", "to_a で開く"), line: "p rel.to_a.size", output: "QUERY {pub: true}\n1", effects: [{ t: "enter", actor: "enemy" }, { t: "print", text: "QUERY {pub: true}" }, { t: "print", text: "1" }, { t: "banner", text: L("QUERIES: 1", "CONSULTAS: 1", "クエリ：1") }] },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: `${LAZY_CLASS}\nrel = Relation.new(rows).where(pub: true)\nputs "built"\np rel.to_a.size`,
      options: ["built / QUERY {pub: true} / 1", "QUERY {pub: true} / built / 1", "built / 1"],
      answer: 0,
      output: "built\nQUERY {pub: true}\n1",
      check: { compiles: true, stdout: "built\nQUERY {pub: true}\n1" },
      explain: L("where only builds a new Relation. The query runs when to_a needs the rows, after built.", "where solo construye una nueva Relation. La consulta corre cuando to_a necesita las filas, después de built.", "where は Relation を作るだけ。クエリは to_a が行を必要とした時、built の後に走る。"),
      win: [{ t: "print", text: "built" }, { t: "print", text: "QUERY {pub: true}" }, { t: "print", text: "1" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: `${LAZY_CLASS}\nbase = Relation.new(rows)\np base.equal?(base.where(pub: true))`,
      options: ["false", "true"],
      answer: 0,
      output: "false",
      check: { compiles: true, stdout: "false" },
      explain: L("where returns a NEW relation and leaves the original untouched, so chains never pollute each other.", "where devuelve una relación NUEVA y deja la original intacta, así las cadenas no se ensucian entre sí.", "where は新しいリレーションを返し、元は変えない。だからチェーン同士が汚れない。"),
    },
    say(L(
      "Once opened, the scroll remembers its rows. @records ||= runs the query only the first time.",
      "Una vez abierto, el pergamino recuerda sus filas. @records ||= corre la consulta solo la primera vez.",
      "一度開いた巻物は行を覚えている。@records ||= なら最初の1回だけクエリが走る。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: MEMO_CODE,
      options: ["QUERY / 2", "QUERY / QUERY / QUERY / 2", "2"],
      answer: 0,
      output: "QUERY\n2",
      check: { compiles: true, stdout: "QUERY\n2" },
      explain: L("The first to_a fills @records. Later calls find it set, so the begin block never runs again.", "El primer to_a llena @records. Las siguientes lo encuentran lleno y el bloque begin no vuelve a correr.", "最初の to_a で @records が埋まる。以降は中身があるので begin は二度と走らない。"),
      win: [{ t: "banner", text: L("QUERIES: 1", "CONSULTAS: 1", "クエリ：1") }],
    },
    say(L(
      "Include Enumerable and define each: the relation gets map, select and count for free, like an array.",
      "Incluye Enumerable y define each: la relación recibe map, select y count gratis, como un array.",
      "Enumerable を include して each を定義すれば、配列みたいに map・select・count が使える。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: ENUM_CODE,
      options: ["[1, 2] / 2", "[{id: 1}, {id: 2}] / 2", "NoMethodError"],
      answer: 0,
      output: "[1, 2]\n2",
      check: { compiles: true, stdout: "[1, 2]\n2" },
      explain: L("Enumerable builds map and count on top of each. it is the block's single argument.", "Enumerable construye map y count sobre each. it es el único argumento del bloque.", "Enumerable は each の上に map や count を作る。it はブロックの引数。"),
    },
    say(L(
      "Our hidden mini Model has where, order, limit and to_sql, plus a DB that counts every query in DB.queries.",
      "Nuestro mini Model oculto tiene where, order, limit y to_sql, y una DB que cuenta cada consulta en DB.queries.",
      "隠しミニ Model には where・order・limit・to_sql と、クエリ数を DB.queries で数える DB がある。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: SQL_CODE,
      options: ["SELECT * FROM posts WHERE pub = true ORDER BY id LIMIT 2", "SELECT * FROM posts LIMIT 2", "SELECT * FROM post WHERE pub = true"],
      answer: 0,
      output: "SELECT * FROM posts WHERE pub = true ORDER BY id LIMIT 2",
      check: { compiles: true, program: rec(SQL_CODE), stdout: "SELECT * FROM posts WHERE pub = true ORDER BY id LIMIT 2" },
      explain: L("Each call adds one piece to a new relation. to_sql only describes the query; it doesn't run it.", "Cada llamada agrega una pieza a una relación nueva. to_sql solo describe la consulta; no la ejecuta.", "呼ぶたびに新しいリレーションに1つずつ足される。to_sql は説明するだけで実行しない。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: COUNT_CODE,
      options: ["0 / 1", "1 / 2", "0 / 2"],
      answer: 0,
      output: "0\n1",
      check: { compiles: true, program: rec(COUNT_CODE), stdout: "0\n1" },
      explain: L("where alone costs nothing. The first to_a runs one query; the second reuses the loaded rows.", "where solo no cuesta nada. El primer to_a hace una consulta; el segundo reutiliza las filas cargadas.", "where だけならタダ。最初の to_a で1回、2回目は読み込み済みの行を使う。"),
      win: [{ t: "banner", text: L("QUERIES: 1", "CONSULTAS: 1", "クエリ：1") }],
    },
    {
      kind: "pick",
      prompt: L("Rails: when does this line hit the database?", "Rails: ¿cuándo va esta línea a la base de datos?", "Rails：この行はいつ DB に行く？"),
      code: "posts = Post.where(published: true)\n# SQL runs ___",
      options: [L("when records are needed", "cuando se necesitan los registros", "レコードが必要な時"), L("right on that line", "justo en esa línea", "その行ですぐ")],
      answer: 0,
      explain: L("Relations are lazy: SQL runs on each, to_a, first or map. The console seems eager only because it inspects the result.", "Las relaciones son perezosas: el SQL corre con each, to_a, first o map. La consola parece inmediata porque inspecciona.", "リレーションは遅延。each・to_a・first・map で SQL が走る。コンソールは表示のために読むだけ。"),
    },
    say(L(
      "A scope is a named query. Rails writes it with a lambda: scope :recent, -> { order(created_at: :desc) }.",
      "Un scope es una consulta con nombre. Rails lo escribe con una lambda: scope :recent, -> { order(created_at: :desc) }.",
      "scope は名前つきクエリ。ラムダで書く：scope :recent, -> { order(created_at: :desc) }。",
    )),
    {
      kind: "type",
      prompt: L("Rails: complete the scope", "Rails: completa el scope", "Rails：scope を完成させよう"),
      code: "class Post < ApplicationRecord\n  scope :recent, ___ { order(created_at: :desc) }\nend",
      answer: "->",
      explain: L("scope takes a lambda (->), so the query is built fresh each time you call Post.recent.", "scope recibe una lambda (->), así la consulta se arma de nuevo cada vez que llamas Post.recent.", "scope はラムダ（->）を受け取る。Post.recent を呼ぶたびに新しく組み立てる。"),
    },
    {
      kind: "pick",
      prompt: L("Rails, unloaded relation: which runs COUNT(*)?", "Rails, relación sin cargar: ¿cuál hace COUNT(*)?", "Rails：未読込でCOUNT(*)するのは？"),
      code: "Post.where(pub: true).___",
      options: ["count", "length"],
      answer: 0,
      explain: L("count asks the database with SELECT COUNT(*). length loads every record first, then counts them in Ruby.", "count pregunta a la base con SELECT COUNT(*). length carga todos los registros y los cuenta en Ruby.", "count は SELECT COUNT(*) を DB に聞く。length は全件読み込んで Ruby で数える。"),
    },
    {
      kind: "run",
      prompt: L("Stop the leak: print published=2 top=1", "Frena la fuga: imprime published=2 top=1", "もれを止めよう：published=2 top=1 と表示"),
      starter: `class Relation
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
`,
      solution: `class Relation
  def initialize(rows, conds = {}) = (@rows, @conds = rows, conds)
  def where(c)
    Relation.new(@rows, @conds.merge(c))
  end
  def to_a = @rows.select { |r| @conds.all? { |k, v| r[k] == v } }
end
rows = [{id: 1, pub: true, top: true}, {id: 2, pub: true, top: false}]
published = Relation.new(rows).where(pub: true)
top = published.where(top: true)
puts "published=#{published.to_a.size} top=#{top.to_a.size}"
`,
      expect: "published=2 top=1",
      fallback: [String.raw`(?:Relation|self\.class)\.new\(\s*@rows\s*,\s*@conds\.merge\(\s*c\s*\)\s*\)`],
      explain: L("merge! changed the shared relation, so published got top: true too. Return Relation.new(@rows, @conds.merge(c)).", "merge! cambió la relación compartida y published recibió top: true. Devuelve Relation.new(@rows, @conds.merge(c)).", "merge! が共有の条件を変え published にも top が入った。Relation.new(@rows, @conds.merge(c)) を返そう。"),
    },
  ],
};

// ─── 1.4 Blueprints of the archive ─────────────────────────────────────────
const MIG_HASH = `MIGRATIONS = {
  20250102 => ->(s) { s[:posts] << :body },
  20250101 => ->(s) { s[:posts] = [:id, :title] },
}`;

const MIG_RUN = `${MIG_HASH}
schema = {}
ran = []
MIGRATIONS.sort.each do |version, change|
  change.(schema)
  ran << version
end
p schema
p ran`;

const INVERSE_CODE = `INVERSE = {add_column: :remove_column, create_table: :drop_table}
ops = [[:create_table, :tags], [:add_column, :posts, :body]]
p ops.reverse.map { |op, *args| [INVERSE.fetch(op), *args] }`;

const migrations: LessonDef = {
  slug: "migrations",
  title: L("Blueprints of the archive", "Planos del archivo", "書庫の設計図"),
  concept: "migrations",
  mode: "lesson",
  xp: 70,
  enemy: "rails/callback-knot",
  enemyName: L("SCHEMA KNOT", "NUDO DE ESQUEMA", "スキーマの結び目"),
  beats: [
    say(L(
      "A migration is a blueprint: a dated change to the database's shape. Rails runs them oldest first, by version number.",
      "Una migración es un plano: un cambio fechado a la forma de la base de datos. Rails las corre de la más vieja a la nueva.",
      "マイグレーションは設計図。DB の形を変える日付つきの変更で、古い順にバージョン番号で実行する。",
    )),
    {
      kind: "act",
      prompt: L("Press in order: our mini migration runner", "Pulsa en orden: nuestro mini ejecutor", "順番に押そう：ミニ実行器"),
      steps: [
        { label: L("SORT", "ORDENAR", "並べる"), line: "MIGRATIONS.sort.each do |version, change|", effects: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "builder" }, { t: "item", kind: "scroll", holder: "hero" }, { t: "say", actor: "hero", text: L("Oldest first!", "¡La más vieja!", "古い順！") }] },
        { label: L("APPLY", "APLICAR", "適用"), line: "  change.(schema)", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "schema" }, { t: "value", actor: "ally", text: "posts" }] },
        { label: L("REMEMBER", "RECORDAR", "記録"), line: "  ran << version", effects: [{ t: "item", kind: "key", holder: "ally" }, { t: "print", text: "20250101 done" }, { t: "print", text: "20250102 done" }] },
        { label: L("END", "FIN", "おわり"), line: "end", effects: [{ t: "banner", text: L("SCHEMA READY", "ESQUEMA LISTO", "スキーマ完成") }] },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: MIG_RUN,
      options: ["{posts: [:id, :title, :body]} / [20250101, 20250102]", "{posts: [:id, :title]} / [20250102, 20250101]", "NoMethodError"],
      answer: 0,
      output: "{posts: [:id, :title, :body]}\n[20250101, 20250102]",
      check: { compiles: true, stdout: "{posts: [:id, :title, :body]}\n[20250101, 20250102]" },
      explain: L("sort orders the pairs by version, so the table is created before the column is added.", "sort ordena los pares por versión, así la tabla se crea antes de agregar la columna.", "sort でバージョン順に並ぶので、テーブルを作ってから列を足す。"),
      win: [{ t: "banner", text: L("SCHEMA READY", "ESQUEMA LISTO", "スキーマ完成") }],
    },
    say(L(
      "The database remembers which versions already ran, in a table. Pending migrations are the ones not in that list yet.",
      "La base de datos recuerda en una tabla qué versiones ya corrieron. Las pendientes son las que aún no están en esa lista.",
      "DB は実行済みのバージョンを表に記録する。まだ載っていないものが「未実行」だよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: `${MIG_HASH}\nalready_ran = [20250101]\np MIGRATIONS.keys.reject { |v| already_ran.include?(v) }`,
      options: ["[20250102]", "[20250101]", "[]"],
      answer: 0,
      output: "[20250102]",
      check: { compiles: true, stdout: "[20250102]" },
      explain: L("reject drops the versions that already ran. Only 20250102 is still pending.", "reject descarta las versiones que ya corrieron. Solo 20250102 sigue pendiente.", "reject で実行済みを外す。残る 20250102 だけが未実行。"),
    },
    {
      kind: "pick",
      prompt: L("Rails: table that records which migrations ran", "Rails: tabla que registra qué migraciones corrieron", "Rails：実行済みを記録する表"),
      code: "SELECT version FROM ___",
      options: ["schema_migrations", "migrations", "ar_internal_metadata"],
      answer: 0,
      explain: L("Rails stores each applied version in schema_migrations. db:migrate runs only the missing ones.", "Rails guarda cada versión aplicada en schema_migrations. db:migrate corre solo las que faltan.", "適用済みのバージョンは schema_migrations に入る。db:migrate は足りない分だけ実行。"),
    },
    {
      kind: "pick",
      prompt: L("Rails: undo the last migration", "Rails: deshacer la última migración", "Rails：最後のマイグレーションを戻す"),
      code: "$ ___",
      options: ["bin/rails db:rollback", "bin/rails db:drop"],
      answer: 0,
      explain: L("db:rollback reverts the latest migration. db:drop deletes the whole database!", "db:rollback revierte la última migración. ¡db:drop borra toda la base de datos!", "db:rollback は最新の1つを戻す。db:drop は DB を丸ごと消す！"),
    },
    say(L(
      "Rolling back undoes changes in REVERSE order, each with its inverse: add_column ↔ remove_column, create_table ↔ drop_table.",
      "Revertir deshace los cambios en orden INVERSO, cada uno con su opuesto: add_column ↔ remove_column, create_table ↔ drop_table.",
      "ロールバックは逆順に、それぞれの逆操作で戻す：add_column ↔ remove_column、create_table ↔ drop_table。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: INVERSE_CODE,
      options: ["[[:remove_column, :posts, :body], [:drop_table, :tags]]", "[[:drop_table, :tags], [:remove_column, :posts, :body]]", "[[:add_column, :posts, :body], [:create_table, :tags]]"],
      answer: 0,
      output: "[[:remove_column, :posts, :body], [:drop_table, :tags]]",
      check: { compiles: true, stdout: "[[:remove_column, :posts, :body], [:drop_table, :tags]]" },
      explain: L("reverse undoes the last change first; fetch swaps each command for its inverse.", "reverse deshace primero el último cambio; fetch cambia cada comando por su opuesto.", "reverse で最後の変更から戻し、fetch で各コマンドを逆操作に変える。"),
      win: [{ t: "banner", text: L("UNDO", "DESHACER", "元に戻す") }],
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: `${INVERSE_CODE.split("\n")[0]}\np INVERSE.fetch(:execute)`,
      options: [L("KeyError: no inverse known", "KeyError: no hay opuesto", "KeyError：逆操作がない"), "nil", ":execute"],
      answer: 0,
      check: { compiles: true, throws: "key not found: :execute" },
      explain: L("fetch raises KeyError for a missing key. Raw SQL has no known inverse, so it can't be undone automatically.", "fetch lanza KeyError si falta la clave. El SQL crudo no tiene opuesto conocido: no se deshace solo.", "fetch は無いキーで KeyError。生 SQL には逆操作が無く、自動では戻せない。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "pick",
      prompt: L("Rails: rolling back execute inside change…", "Rails: revertir execute dentro de change…", "Rails：change 内の execute を戻すと…"),
      code: 'def change\n  execute "UPDATE posts SET pub = true"\nend\n# rollback: ___',
      options: [L("raises IrreversibleMigration", "lanza IrreversibleMigration", "IrreversibleMigration になる"), L("runs it backwards", "lo corre al revés", "逆向きに実行する")],
      answer: 0,
      explain: L("Rails can't invert raw SQL, so it raises ActiveRecord::IrreversibleMigration. Write up and down instead.", "Rails no puede invertir SQL crudo y lanza ActiveRecord::IrreversibleMigration. Escribe up y down.", "生 SQL は反転できず ActiveRecord::IrreversibleMigration になる。up と down を書こう。"),
    },
    {
      kind: "pick",
      prompt: L("Rails: a migration that ran in production has a bug", "Rails: una migración ya corrida en producción tiene un bug", "Rails：本番で実行済みの移行にバグ"),
      code: "# fix: ___",
      options: [L("write a new migration", "escribir una migración nueva", "新しい移行を書く"), L("edit the old file", "editar el archivo viejo", "古いファイルを直す")],
      answer: 0,
      explain: L("Production already recorded that version, so an edited file never runs again there. Add a new migration.", "Producción ya registró esa versión, así que un archivo editado no vuelve a correr allí. Agrega una migración nueva.", "本番はそのバージョンを記録済み。直しても再実行されないので、新しい移行を足そう。"),
    },
    say(L(
      "Foreign keys like author_id deserve an index, so Post.where(author_id: 7) doesn't scan the whole table.",
      "Las claves foráneas como author_id merecen un índice, así Post.where(author_id: 7) no recorre toda la tabla.",
      "author_id のような外部キーにはインデックスを。Post.where(author_id: 7) が全件を見なくて済む。",
    )),
    {
      kind: "type",
      prompt: L("Rails: speed up where(author_id: 7)", "Rails: acelera where(author_id: 7)", "Rails：where(author_id: 7) を速く"),
      code: "add_index :posts, ___",
      answer: ":author_id",
      explain: L("add_index :posts, :author_id lets the database jump straight to matching rows.", "add_index :posts, :author_id deja que la base salte directo a las filas que coinciden.", "add_index :posts, :author_id で DB は一致する行へ直行できる。"),
    },
    {
      kind: "pick",
      prompt: L("Rails: the file db/schema.rb is…", "Rails: el archivo db/schema.rb es…", "Rails：db/schema.rb は…"),
      code: "# db/schema.rb is ___",
      options: [L("generated after migrating", "generado al migrar", "移行後に自動生成"), L("edited by hand", "editado a mano", "手で編集する")],
      answer: 0,
      explain: L("Rails dumps schema.rb from the database after each migration. Hand edits get overwritten.", "Rails genera schema.rb desde la base tras cada migración. Las ediciones a mano se pierden.", "schema.rb は毎回 DB から書き出される。手で直しても上書きされる。"),
    },
    {
      kind: "run",
      prompt: L("Run them in order: print the full schema", "Córrelas en orden: imprime el esquema completo", "順番に実行してスキーマを全部表示"),
      starter: `MIGRATIONS = {
  20250102 => ->(s) { s[:posts] << :body },
  20250101 => ->(s) { s[:posts] = [:id, :title] },
}
schema = {}
MIGRATIONS.each { |version, change| change.(schema) }
p schema
`,
      solution: `MIGRATIONS = {
  20250102 => ->(s) { s[:posts] << :body },
  20250101 => ->(s) { s[:posts] = [:id, :title] },
}
schema = {}
MIGRATIONS.sort.each { |version, change| change.(schema) }
p schema
`,
      expect: "{posts: [:id, :title, :body]}",
      fallback: [String.raw`MIGRATIONS\.sort(?:_by)?\b`, String.raw`MIGRATIONS\.keys\.sort`],
      explain: L("The hash runs in insertion order, so :body hit a missing table. MIGRATIONS.sort runs oldest first.", "El hash corre en orden de inserción y :body chocó con una tabla inexistente. MIGRATIONS.sort corre la más vieja primero.", "ハッシュは挿入順なので :body が無いテーブルにぶつかった。MIGRATIONS.sort で古い順に。"),
    },
  ],
};

// ─── Boss: Query Golem ─────────────────────────────────────────────────────
const SEED = `class Post < Model
  attribute :title, :views, :author_id
end
Post.create(title: "Hi", views: 5, author_id: 1)
Post.create(title: "Yo", views: 1, author_id: 2)
Post.create(title: "Ok", views: 9, author_id: 1)`;
const seeded = (code: string) => rec(`${SEED}\n${code}`);

const boss: LessonDef = {
  slug: "query-golem",
  title: L("Boss: Query Golem", "Jefe: Gólem de Consultas", "ボス：クエリゴーレム"),
  concept: "relations",
  mode: "boss",
  xp: 180,
  enemy: "golem",
  enemyName: L("QUERY GOLEM", "GÓLEM SQL", "クエリゴーレム"),
  beats: [
    enemySays(L(
      "I AM THE QUERY GOLEM. My archive holds three posts. Read my queries right, or be buried under rows!",
      "SOY EL GÓLEM DE CONSULTAS. Mi archivo guarda tres posts. ¡Lee bien mis consultas o quedarás bajo las filas!",
      "我はクエリゴーレム。書庫には投稿が3つ。クエリを読み違えれば行の下敷きだ！",
    )),
    {
      kind: "dialog",
      speaker: "master",
      text: L(
        "Our mini Model is loaded, and these three posts are already saved with ids 1, 2 and 3. Every question uses them.",
        "Nuestro mini Model está cargado y estos tres posts ya están guardados con ids 1, 2 y 3. Todas las preguntas los usan.",
        "ミニ Model が読み込み済み。この3投稿は id 1・2・3 で保存済みで、全問で使うよ。",
      ),
      code: SEED,
    },
    { kind: "predict", time: 15, prompt: PRINT, code: 'p Post.find_by_title("Yo").views', options: ["1", "5", "nil"], answer: 0, output: "1", check: { compiles: true, program: seeded('p Post.find_by_title("Yo").views'), stdout: "1" }, explain: L("method_missing turns find_by_title into find_by(title: \"Yo\"), and Yo has 1 view.", "method_missing convierte find_by_title en find_by(title: \"Yo\"), y Yo tiene 1 vista.", "method_missing が find_by(title: \"Yo\") に変える。Yo の views は 1。") },
    { kind: "predict", time: 12, prompt: PRINT, code: "p Post.respond_to?(:find_by_title)", options: ["true", "false"], answer: 0, output: "true", check: { compiles: true, program: seeded("p Post.respond_to?(:find_by_title)"), stdout: "true" }, explain: L("Our mini Model defines respond_to_missing? for find_by_ names, so respond_to? is honest.", "Nuestro mini Model define respond_to_missing? para nombres find_by_, así respond_to? es honesto.", "ミニ Model は find_by_ 用に respond_to_missing? を定義済みなので正直に true。") },
    { kind: "predict", time: 12, prompt: PRINT, code: 'p Post.find_by(title: "Nope")', options: ["nil", "[]", L("RecordNotFound error", "Error RecordNotFound", "RecordNotFound エラー")], answer: 0, output: "nil", check: { compiles: true, program: seeded('p Post.find_by(title: "Nope")'), stdout: "nil" }, explain: L("find_by returns nil when nothing matches. Only find raises.", "find_by devuelve nil si nada coincide. Solo find lanza error.", "find_by は一致なしで nil。エラーになるのは find だけ。") },
    { kind: "predict", time: 15, prompt: PRINT, code: "r = Post.where(author_id: 1).order(:views)\nputs r.class\np r.map(&:title)", options: ['Relation / ["Hi", "Ok"]', 'Array / ["Hi", "Ok"]', 'Relation / ["Ok", "Hi"]'], answer: 0, output: 'Relation\n["Hi", "Ok"]', check: { compiles: true, program: seeded("r = Post.where(author_id: 1).order(:views)\nputs r.class\np r.map(&:title)"), stdout: 'Relation\n["Hi", "Ok"]' }, explain: L("where and order return a Relation. map loads it: author 1 has Hi (5) and Ok (9), by views.", "where y order devuelven una Relation. map la carga: el autor 1 tiene Hi (5) y Ok (9), por vistas.", "where と order は Relation を返す。map で読み込み、著者1の Hi(5)・Ok(9) が views 順。") },
    { kind: "predict", time: 12, prompt: HAPPENS, code: "Post.find(99)", options: [L("RecordNotFound error", "Error RecordNotFound", "RecordNotFound エラー"), "nil"], answer: 0, check: { compiles: true, program: seeded("Post.find(99)"), throws: "Couldn't find Post with 'id'=99" }, explain: L("There is no id 99, and find never returns nil: it raises RecordNotFound.", "No hay id 99, y find nunca devuelve nil: lanza RecordNotFound.", "id 99 は無い。find は nil を返さず RecordNotFound を投げる。") },
    { kind: "predict", time: 15, prompt: PRINT, code: "DB.queries = 0\nr = Post.where(views: 9)\nr.to_a\nr.first\nputs DB.queries", options: ["1", "2", "0"], answer: 0, output: "1", check: { compiles: true, program: seeded("DB.queries = 0\nr = Post.where(views: 9)\nr.to_a\nr.first\nputs DB.queries"), stdout: "1" }, explain: L("to_a runs the one query and remembers the rows. first reads the loaded rows: still 1.", "to_a hace la única consulta y recuerda las filas. first lee las filas cargadas: sigue en 1.", "to_a で1回だけ実行して行を覚える。first は読み込み済みを使うので 1 のまま。") },
    { kind: "pick", time: 12, prompt: L("Rails: table name for model Person?", "Rails: ¿tabla para el modelo Person?", "Rails：モデル Person のテーブル名は？"), code: "# table: ___", options: ["people", "persons", "person"], answer: 0, explain: L("The inflector knows irregular plurals: Person → people.", "El inflector conoce plurales irregulares: Person → people.", "活用器は不規則な複数形を知っている：Person → people。") },
    { kind: "pick", time: 12, prompt: L("Rails: run the SQL right now", "Rails: ejecuta el SQL ahora mismo", "Rails：今すぐ SQL を走らせる"), code: "posts = ___", options: ["Post.where(pub: true).to_a", "Post.where(pub: true)"], answer: 0, explain: L("to_a loads the records immediately. A bare relation waits until it is used.", "to_a carga los registros de inmediato. Una relación sola espera hasta que se use.", "to_a はすぐ読み込む。リレーションだけなら使われるまで待つ。") },
    { kind: "order", time: 20, prompt: L("Rails: create, apply, then undo a migration", "Rails: crea, aplica y deshace una migración", "Rails：移行を作る→適用→戻す"), lines: ["bin/rails generate migration AddBodyToPosts body:text", "bin/rails db:migrate", "bin/rails db:rollback"], explain: L("generate writes the dated file, db:migrate applies it and records the version, db:rollback undoes it.", "generate escribe el archivo fechado, db:migrate lo aplica y registra la versión, db:rollback lo deshace.", "generate が日付つきファイルを作り、db:migrate が適用して記録、db:rollback が戻す。") },
    enemySays(L(
      "Crumble... my rows scatter. The Association Forest waits ahead, where queries swarm in packs.",
      "Me desmorono... mis filas se dispersan. El Bosque de Asociaciones espera, donde las consultas atacan en enjambre.",
      "くずれる…行が散っていく。この先はアソシエーションの森。クエリが群れで襲うぞ。",
    )),
  ],
};

export const recordVillage: RegionDef = {
  slug: "record-village",
  name: L("Record Village", "Aldea de Registros", "レコード村"),
  subtitle: L("models · queries · migrations", "modelos · consultas · migraciones", "モデル・クエリ・移行"),
  theme: "village",
  lessons: [models, finders, lazy, migrations, boss],
};
