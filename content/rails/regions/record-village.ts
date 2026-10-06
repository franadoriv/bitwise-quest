import type { LessonDef, NoteBlock, NoteDef, RegionDef, Text } from "../../../lib/content/types.ts";
import { L, say, enemySays } from "../../rust/helpers.ts";
import { MINI_RECORD, withHelper } from "../mini.ts";

// REGION 1 · RECORD VILLAGE  (Active Record under the hood: models, finders, lazy relations, migrations)
// Rails can't run in the sandbox: snippets are small plain-Ruby versions of its mechanisms ("our mini version"),
// verified on Ruby 3.4.7. Questions about the real Rails API have no `check` and follow the Rails Guides.

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");
const rec = (code: string) => withHelper(MINI_RECORD, code);

// Guidebook notes: long explanations players can reopen from any question (📖).
// Examples use names and values different from the questions so they never give an answer away.
const note = (id: string, title: Text, ...blocks: NoteBlock[]): NoteDef => ({ id, title, blocks });
const p = (en: string, es: string, ja: string): NoteBlock => ({ t: "p", text: L(en, es, ja) });
/** A plain-Ruby example; the validator runs it on Ruby 3.4.7 and checks `output`. */
const ex = (code: string, output: string, caption?: Text): NoteBlock => ({ t: "code", code, output, caption });
/** An example that runs on top of our hidden mini Model (MINI_RECORD). */
const exRec = (code: string, output: string, caption?: Text): NoteBlock => ({ t: "code", code, output, caption, check: { compiles: true, program: rec(code), stdout: output } });
/** An example that must stop with this runtime error (verified too). */
const crash = (code: string, throws: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { compiles: true, throws } });
/** Like crash, on top of our hidden mini Model. */
const crashRec = (code: string, throws: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { compiles: true, program: rec(code), throws } });
/** Real Rails code to read, not run: Rails isn't available in the sandbox. */
const railsCode = (code: string, caption: Text): NoteBlock => ({ t: "code", code, caption });
const READ_ONLY = L("Rails code to read, not run here", "Código Rails para leer, aquí no se ejecuta", "読むための Rails コード（ここでは実行しない）");

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

const modelsNotes: NoteDef[] = [
  note("mvc", L("Model, View, Controller", "Modelo, Vista, Controlador", "モデル・ビュー・コントローラ"),
    p(
      "Rails splits every app into three roles, called MVC. The Model owns the data: it reads rows from the database and writes them back. The View turns data into HTML for the browser. The Controller receives each request, asks the models for data and picks a view. Each role has one job, so you always know where a piece of code belongs.",
      "Rails divide toda app en tres papeles, llamados MVC. El Modelo es dueño de los datos: lee filas de la base de datos y las vuelve a escribir. La Vista convierte los datos en HTML para el navegador. El Controlador recibe cada petición, pide datos a los modelos y elige una vista. Cada papel tiene un trabajo, así siempre sabes dónde va cada código.",
      "Rails はアプリを MVC という3つの役に分ける。モデルはデータの持ち主で、DB から行を読み、書き戻す。ビューはデータをブラウザ用の HTML にする。コントローラは要求を受け取り、モデルにデータを頼んでビューを選ぶ。役目は1つずつなので、コードの置き場所に迷わない。",
    ),
    p(
      "A model is a plain Ruby class, one per kind of thing your app stores: Post, User, Order. Each model is tied to one database table, and each object of that class stands for one row of it. Its columns become methods you can call on the object.",
      "Un modelo es una clase Ruby normal, una por cada tipo de cosa que guarda tu app: Post, User, Order. Cada modelo está ligado a una tabla de la base de datos, y cada objeto de esa clase representa una fila. Sus columnas se vuelven métodos que puedes llamar en el objeto.",
      "モデルはふつうの Ruby クラスで、アプリが保存するものの種類ごとに1つ作る（Post、User、Order など）。モデルは DB のテーブル1つと結びつき、そのクラスのオブジェクト1つが1行を表す。列はオブジェクトのメソッドになる。",
    ),
    ex(`class Song
  def initialize(row) = @row = row
  def title = @row[:title]
end
song = Song.new({title: "Blue", year: 1999})
puts song.title`, "Blue",
      L("One row (a hash) wrapped in one object", "Una fila (un hash) envuelta en un objeto", "1行（ハッシュ）を1つのオブジェクトで包む")),
    p(
      "Common mistake: writing database code in views or controllers. If a line reads or writes rows, it belongs in a model. Views only display what they are given, and controllers only coordinate: they ask the model, then hand the result to the view.",
      "Error común: escribir código de base de datos en vistas o controladores. Si una línea lee o escribe filas, va en un modelo. Las vistas solo muestran lo que reciben, y los controladores solo coordinan: piden al modelo y pasan el resultado a la vista.",
      "よくあるミス：DB のコードをビューやコントローラに書くこと。行を読み書きするならモデルの仕事。ビューは渡されたものを表示するだけ、コントローラは調整役で、モデルに聞いて結果をビューに渡す。",
    ),
  ),
  note("table-names", L("Class names become table names", "Nombres de clase, nombres de tabla", "クラス名がテーブル名に"),
    p(
      "Rails prefers convention over configuration: instead of a config file saying which table a class uses, it derives the table from the class name. The rule: write the class name as lowercase words joined by underscores (snake_case), then make the last word plural. Follow the convention and there is nothing to configure.",
      "Rails prefiere convención sobre configuración: en vez de un archivo que diga qué tabla usa una clase, saca la tabla del nombre de la clase. La regla: escribe el nombre en palabras minúsculas unidas por guiones bajos (snake_case) y pon la última palabra en plural. Si sigues la convención, no hay nada que configurar.",
      "Rails は「設定より規約」。どのテーブルを使うか設定ファイルに書かず、クラス名から決める。ルールは、クラス名を小文字の単語を _ でつないだ形（snake_case）にして、最後の単語を複数形にすること。規約どおりなら設定はいらない。",
    ),
    exRec(`class Order < Model; end
class Box < Model; end
puts Order.table
puts Box.table`, "orders\nboxs",
      L("Our mini rule just adds an s, so it gets box wrong", "Nuestra regla mini solo agrega una s y falla con box", "ミニ版は s を足すだけなので box を間違える")),
    p(
      "Our mini version only lowercases the name and adds an s. That works for regular words but not for others: box becomes boxs. Real Rails uses an inflector, a small dictionary of English rules. It knows plurals like box → boxes and irregular ones that change the whole word, like mouse → mice or child → children.",
      "Nuestra mini versión solo pasa el nombre a minúsculas y agrega una s. Sirve para palabras regulares, pero no para otras: box queda boxs. Rails real usa un inflector, un pequeño diccionario de reglas del inglés. Conoce plurales como box → boxes e irregulares que cambian toda la palabra, como mouse → mice o child → children.",
      "ミニ版は小文字にして s を足すだけ。規則的な単語なら動くが、box は boxs になってしまう。本物の Rails は活用器（inflector）という英語ルールの小さな辞書を使う。box → boxes や、mouse → mice、child → children のような不規則な複数形も知っている。",
    ),
    p(
      "Class names in CamelCase, with a capital letter starting each word, are split into words first. Each capital marks where an underscore goes, and only the last word becomes plural: LineItem → line_item → line_items. Common mistake: pluralizing every word, or forgetting the underscore.",
      "Los nombres en CamelCase, con mayúscula al inicio de cada palabra, se separan primero en palabras. Cada mayúscula marca dónde va un guion bajo, y solo la última palabra pasa a plural: LineItem → line_item → line_items. Error común: poner en plural todas las palabras u olvidar el guion bajo.",
      "単語ごとに大文字で始まる CamelCase の名前は、まず単語に分ける。大文字の位置に _ が入り、複数形になるのは最後の単語だけ：LineItem → line_item → line_items。よくあるミス：全部の単語を複数形にすること、_ を忘れること。",
    ),
    ex(String.raw`puts "LineItem".gsub(/([a-z])([A-Z])/, '\1_\2').downcase + "s"`, "line_items",
      L("Split at the capitals, lowercase, then pluralize", "Separar en las mayúsculas, minúsculas y plural", "大文字で分けて小文字にし、複数形に")),
  ),
  note("columns-methods", L("Columns become methods", "Las columnas se vuelven métodos", "列がメソッドになる"),
    p(
      "Rails doesn't write a method for each column by hand. It reads the table's columns and defines the methods while the program runs. Ruby makes this possible with define_method, which creates a method from a name and a block. Our mini version loops over the column names and calls define_method for each one.",
      "Rails no escribe a mano un método por columna. Lee las columnas de la tabla y define los métodos mientras el programa corre. Ruby lo permite con define_method, que crea un método a partir de un nombre y un bloque. Nuestra mini versión recorre los nombres de columna y llama a define_method para cada uno.",
      "Rails は列ごとのメソッドを手で書かない。テーブルの列を読み、プログラムの実行中にメソッドを定義する。それを可能にするのが Ruby の define_method で、名前とブロックからメソッドを作る。ミニ版は列名をループして、1つずつ define_method を呼ぶ。",
    ),
    ex(`class Song
  [:artist, :year].each do |col|
    define_method(col) { @data[col] }
  end
  def initialize(data) = @data = data
end
s = Song.new(artist: "Mo")
p s.artist
p s.year`, '"Mo"\nnil',
      L("A missing key in the hash reads as nil", "Una clave ausente en el hash se lee como nil", "ハッシュに無いキーは nil として読める")),
    p(
      "These are real methods, as real as one written with def: respond_to? sees them and they appear in instance_methods. A reader just looks up its key in the stored hash, so a column that was never set gives nil, Ruby's value for \"nothing\", not an error.",
      "Son métodos reales, tan reales como uno escrito con def: respond_to? los ve y aparecen en instance_methods. Un lector solo busca su clave en el hash guardado, así que una columna que nunca se asignó da nil, el valor de Ruby para \"nada\", no un error.",
      "これは def で書いたのと同じ本物のメソッド。respond_to? にも見え、instance_methods にも出てくる。読む用のメソッドは保存したハッシュからキーを探すだけなので、一度もセットしていない列はエラーではなく nil（Ruby の「何もない」）になる。",
    ),
    p(
      "Writers are methods too, and their name ends in =. When you write s.year = 2001, Ruby calls a method named year= with 2001 as its argument. So a writer must be defined with the name \"year=\", for example \"#{col}=\". If you define the plain name twice, the second one just replaces the first: you lose the reader instead of gaining a writer.",
      "Los escritores también son métodos, y su nombre termina en =. Al escribir s.year = 2001, Ruby llama a un método llamado year= con 2001 como argumento. Así que un escritor se define con el nombre \"year=\", por ejemplo \"#{col}=\". Si defines el mismo nombre dos veces, el segundo reemplaza al primero: pierdes el lector en vez de ganar un escritor.",
      "書く用のメソッドも名前が = で終わるメソッド。s.year = 2001 と書くと、Ruby は year= というメソッドを 2001 を引数にして呼ぶ。だから書く用は \"year=\"（たとえば \"#{col}=\"）という名前で定義する。同じ名前を2回定義すると後のほうが上書きし、書く用が増えるどころか読む用が消える。",
    ),
    ex(`class Song
  define_method(:year) { @year }
  define_method("year=") { |v| @year = v }
end
s = Song.new
s.year = 2001
p s.year`, "2001",
      L("The writer's name ends in =", "El nombre del escritor termina en =", "書く用の名前は = で終わる")),
  ),
  note("persistence", L("new, save and create", "new, save y create", "new・save・create"),
    p(
      "new builds an object in memory only: nothing is written to the database yet, and the object has no id. save sends it to the database, which stores the row and hands back a fresh id. From then on the object is persisted: it exists in the database, not just in your running program.",
      "new crea un objeto solo en memoria: aún no se escribe nada en la base de datos y el objeto no tiene id. save lo envía a la base de datos, que guarda la fila y devuelve un id nuevo. Desde entonces el objeto está persistido: existe en la base de datos, no solo en tu programa.",
      "new はメモリ上にオブジェクトを作るだけ。まだ DB には何も書かれず、id もない。save で DB に送ると、DB が行を保存して新しい id を返す。それ以降、そのオブジェクトは「永続化」済みで、プログラムの中だけでなく DB にも存在する。",
    ),
    ex(`class Note
  attr_reader :id
  def save = @id = 42
end
n = Note.new
p n.id
n.save
p n.id`, "nil\n42",
      L("No id before save; the database assigns one", "Sin id antes de save; la base de datos lo asigna", "save 前は id なし。DB が割り当てる")),
    p(
      "persisted? simply asks whether the object has an id. Every Rails table gets a primary key column named id by default: an integer the database fills in, 1, 2, 3 and so on. find(5) looks a row up by that column.",
      "persisted? solo pregunta si el objeto tiene un id. Toda tabla de Rails tiene por defecto una columna de clave primaria llamada id: un entero que llena la base de datos, 1, 2, 3, etc. find(5) busca una fila por esa columna.",
      "persisted? は id があるかを聞くだけ。Rails のテーブルには標準で id という主キー列があり、DB が 1、2、3…と整数を入れる。find(5) はこの列で行を探す。",
    ),
    p(
      "create is a shortcut for new followed by save, in one call. Use new when you want to fill in or check the object before saving, for example in a form. Use create when you already have all the data and want the row written right away. Common mistake: calling new and expecting the row to be in the database; until save succeeds, find can't see it.",
      "create es un atajo de new seguido de save, en una sola llamada. Usa new cuando quieras completar o revisar el objeto antes de guardar, por ejemplo en un formulario. Usa create cuando ya tienes todos los datos y quieres escribir la fila de inmediato. Error común: llamar new y esperar que la fila esté en la base; hasta que save funcione, find no la ve.",
      "create は new と save を1回でやる近道。保存前にフォームなどで中身を埋めたり確かめたりしたいなら new、データがそろっていてすぐ書きたいなら create。よくあるミス：new だけで DB に行があると思うこと。save が成功するまで find には見えない。",
    ),
    railsCode(`book = Book.new(title: "Draft")  # memory only
book.save                        # now it has an id
Book.create(title: "Live")       # new + save`, READ_ONLY),
  ),
];

const models: LessonDef = {
  slug: "models-and-tables",
  title: L("Rows become objects", "Filas que son objetos", "行がオブジェクトに"),
  concept: "models",
  mode: "lesson",
  xp: 60,
  enemy: "rails/mass-burglar",
  enemyName: L("ROW BURGLAR", "LADRÓN DE FILAS", "ぎょうドロボウ"),
  notes: modelsNotes,
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
      hint: L("Each MVC letter has one job. Which job is about storing and loading data?", "Cada letra de MVC tiene un trabajo. ¿Cuál trata de guardar y cargar datos?", "MVC の文字はそれぞれ役目が1つ。データの保存と読み込みはどの役目？"),
      note: "mvc",
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
      hint: L("Follow the method: what is name for class Post, and what do downcase and + \"s\" do to it?", "Sigue el método: ¿qué es name para la clase Post, y qué le hacen downcase y + \"s\"?", "メソッドを追おう。Post の name は何？downcase と + \"s\" で何が起きる？"),
      note: "table-names",
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
      hint: L("Rails doesn't just add an s: its inflector knows English, including irregular plurals.", "Rails no solo agrega una s: su inflector sabe inglés, incluidos los plurales irregulares.", "Rails は s を足すだけじゃない。活用器は不規則な複数形も知っている。"),
      note: "table-names",
      prompt: L("Rails: table name for model Person?", "Rails: ¿tabla para el modelo Person?", "Rails：モデル Person のテーブル名は？"),
      code: "class Person < ApplicationRecord; end\n# table: ___",
      options: ["people", "persons", "person"],
      answer: 0,
      explain: L("The Rails inflector knows irregular plurals: Person → people. Our mini + \"s\" would say persons.", "El inflector de Rails conoce plurales irregulares: Person → people. Nuestro mini + \"s\" diría persons.", "Rails の活用器は不規則な複数形を知っている：Person → people。ミニ版なら persons。"),
    },
    {
      kind: "pick",
      hint: L("CamelCase names are split into words joined by underscores; only the last word becomes plural.", "Los nombres CamelCase se separan en palabras unidas por guiones bajos; solo la última va en plural.", "CamelCase は単語に分けて _ でつなぐ。複数形になるのは最後の単語だけ。"),
      note: "table-names",
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
      hint: L("Both columns got a method. What does a hash give back for a key that was never set?", "Ambas columnas tienen método. ¿Qué devuelve un hash para una clave que nunca se asignó?", "列は両方メソッドになった。一度も入れていないキーをハッシュで読むと？"),
      note: "columns-methods",
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
      hint: L("Are methods made with define_method real methods, or something respond_to? can't see?", "¿Los métodos hechos con define_method son reales, o algo que respond_to? no ve?", "define_method で作ったのは本物のメソッド？respond_to? に見えない何か？"),
      note: "columns-methods",
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
      hint: L("persisted? only checks for an id. At which point does this object get one?", "persisted? solo revisa si hay un id. ¿En qué momento recibe uno este objeto?", "persisted? は id があるかを見るだけ。このオブジェクトはいつ id をもらう？"),
      note: "persistence",
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
      hint: L("One of these only builds an object in memory; the other one also saves it.", "Uno de estos solo crea un objeto en memoria; el otro además lo guarda.", "片方はメモリ上に作るだけ。もう片方は保存までする。"),
      note: "persistence",
      prompt: L("Rails: which one writes to the database?", "Rails: ¿cuál escribe en la base de datos?", "Rails：DB に書くのはどっち？"),
      code: '___\n# INSERT INTO posts ...',
      options: ['Post.create(title: "x")', 'Post.new(title: "x")'],
      answer: 0,
      explain: L("create is new + save in one step. new alone only builds the object in memory.", "create es new + save en un paso. new solo construye el objeto en memoria.", "create は new + save を一度に。new だけではメモリ上に作るだけ。"),
    },
    {
      kind: "type",
      hint: L("Every Rails table gets a default primary key filled in by the database. persisted? checks it too.", "Toda tabla de Rails tiene una clave primaria por defecto que llena la base. persisted? también la revisa.", "どのテーブルにも DB が埋める標準の主キーがある。persisted? も同じものを見る。"),
      note: "persistence",
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
      hint: L("Count how many define_method calls attribute makes per name, and what each new method is called.", "Cuenta cuántas veces llama attribute a define_method por nombre, y cómo se llama cada método.", "attribute は名前ごとに define_method を何回呼ぶ？それぞれの名前は？"),
      note: "columns-methods",
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
      hint: L("post.title = calls a method whose name ends in =. What name does the second define_method use now?", "post.title = llama a un método cuyo nombre termina en =. ¿Qué nombre usa ahora el segundo define_method?", "post.title = は = で終わる名前のメソッドを呼ぶ。2つ目の define_method の名前は今何？"),
      note: "columns-methods",
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

const findersNotes: NoteDef[] = [
  note("find-vs-find-by", L("find, find_by and where", "find, find_by y where", "find・find_by・where"),
    p(
      "Active Record has three main ways to look records up, and the big difference is what they return when nothing matches. find(id) promises a record: if no row has that id, it raises an error. find_by(conditions) returns the first matching record, or nil if none match. where(conditions) always returns a collection, which may be empty.",
      "Active Record tiene tres formas principales de buscar registros, y la gran diferencia es qué devuelven cuando nada coincide. find(id) promete un registro: si ninguna fila tiene ese id, lanza un error. find_by(condiciones) devuelve el primer registro que coincide, o nil si no hay. where(condiciones) siempre devuelve una colección, que puede estar vacía.",
      "Active Record の主な探し方は3つ。大きな違いは、一致しないときに何を返すか。find(id) は必ず返す約束で、その id の行が無いとエラーを投げる。find_by(条件) は最初に一致したもの、無ければ nil。where(条件) はいつもコレクションを返す（空のこともある）。",
    ),
    ex(`class NotFound < StandardError; end
class Track
  ROWS = [{id: 5, name: "Intro"}]
  def self.find_by(c) = ROWS.find { |r| r[:name] == c[:name] }
  def self.find(id) = ROWS.find { |r| r[:id] == id } || raise(NotFound, "no track #{id}")
end
p Track.find_by(name: "Outro")
p Track.find(5)[:name]`, 'nil\n"Intro"',
      L("find_by can come back empty; find keeps its promise or raises", "find_by puede volver vacío; find cumple o lanza", "find_by は空もある。find は約束を守るかエラー")),
    p(
      "They mirror plain Ruby arrays. where is like select: it always gives back a list. find_by is like Array#find: one element or nil. find adds a promise on top, \"or raise\". In our mini version that's just find_by(...) || raise(...): the right side of || only runs when the left side is nil or false.",
      "Se parecen a los arrays de Ruby. where es como select: siempre devuelve una lista. find_by es como Array#find: un elemento o nil. find agrega una promesa encima, \"o lanza\". En nuestra mini versión es solo find_by(...) || raise(...): el lado derecho de || solo corre cuando el izquierdo es nil o false.",
      "これは Ruby の配列と同じ形。where は select と同じで、いつもリストを返す。find_by は Array#find と同じで、1つか nil。find はそこに「なければエラー」の約束を足す。ミニ版では find_by(...) || raise(...) と書くだけ。|| の右側は左が nil か false のときだけ動く。",
    ),
    ex(`nums = [3, 8, 11]
p nums.select { |n| n > 9 }
p nums.find { |n| n > 20 }
p nums.find { |n| n > 5 }`, "[11]\nnil\n8",
      L("select returns a list; find returns one element or nil", "select da una lista; find, un elemento o nil", "select はリスト、find は1つか nil")),
    p(
      "Which one to use? find when the record must exist, like an id from your own link: if it's missing something is really wrong, and in Rails the error becomes a 404 Not Found page. find_by when missing is normal, like a coupon code a user typed: check for nil yourself. where when you want every match, even if there is only one.",
      "¿Cuál usar? find cuando el registro debe existir, como un id de tu propio enlace: si falta, algo anda muy mal, y en Rails el error se vuelve una página 404 Not Found. find_by cuando que falte es normal, como un cupón que escribió el usuario: revisa tú el nil. where cuando quieres todas las coincidencias, aunque sea una.",
      "使い分け：必ずあるはずのもの（自分のリンクの id など）は find。無ければ本当におかしく、Rails ではエラーが 404 ページになる。無くても普通のもの（ユーザーが入力したクーポンなど）は find_by にして nil を自分で確かめる。一致するもの全部が欲しいなら、1件でも where。",
    ),
    p(
      "first and take both return one record, but first sorts by the primary key when you gave no order, so its result is predictable; take grabs whatever row the database returns first, with no ORDER BY. Common mistake: expecting where(...) to give one object. It gives a relation, so call first on it or use find_by.",
      "first y take devuelven un registro, pero first ordena por la clave primaria si no diste un orden, así su resultado es predecible; take toma la fila que la base devuelva primero, sin ORDER BY. Error común: esperar que where(...) dé un objeto. Da una relación, así que llama first sobre ella o usa find_by.",
      "first も take も1件を返すが、first は順序の指定が無いと主キーで並べるので結果が決まる。take は ORDER BY なしで DB が最初に返した行を取る。よくあるミス：where(...) が1つのオブジェクトを返すと思うこと。返るのはリレーションなので、first を呼ぶか find_by を使おう。",
    ),
  ),
  note("method-missing", L("method_missing and magic finders", "method_missing y buscadores mágicos", "method_missing と魔法の検索"),
    p(
      "When you call a method that doesn't exist, Ruby doesn't fail right away. It first calls method_missing on the receiver, passing the method's name and its arguments. The default version raises NoMethodError, but a class can override it to handle a whole family of names, like every name that starts with find_by_.",
      "Cuando llamas a un método que no existe, Ruby no falla de inmediato. Primero llama a method_missing en el receptor, pasándole el nombre del método y sus argumentos. La versión por defecto lanza NoMethodError, pero una clase puede redefinirla para atender una familia entera de nombres, como todos los que empiezan con find_by_.",
      "存在しないメソッドを呼んでも、Ruby はすぐには失敗しない。まず受け手の method_missing を、メソッド名と引数を渡して呼ぶ。標準の method_missing は NoMethodError を投げるが、クラスで上書きすれば、find_by_ で始まる名前のような「名前の一族」をまとめて引き受けられる。",
    ),
    ex(`class Menu
  PRICES = {tea: 2, cake: 4}
  def self.method_missing(name, *args)
    return super unless name.start_with?("price_of_")
    PRICES[name.to_s.delete_prefix("price_of_").to_sym]
  end
end
p Menu.price_of_cake
p Menu.respond_to?(:price_of_tea)`, "4\nfalse",
      L("method_missing answers, but respond_to? doesn't know", "method_missing responde, pero respond_to? no lo sabe", "method_missing は答えるが respond_to? は知らない")),
    p(
      "Always call super for the names you don't handle. super passes the call up to the default method_missing, which raises the usual NoMethodError. Without super, a typo like Menu.pirce_of_tea would quietly return nil and hide the bug.",
      "Llama siempre a super para los nombres que no atiendes. super pasa la llamada al method_missing por defecto, que lanza el NoMethodError de siempre. Sin super, un error de tipeo como Menu.pirce_of_tea devolvería nil en silencio y escondería el bug.",
      "自分が引き受けない名前では必ず super を呼ぶこと。super は呼び出しを標準の method_missing に回し、いつもの NoMethodError を投げる。super が無いと、Menu.pirce_of_tea のような打ち間違いが黙って nil を返し、バグが隠れてしまう。",
    ),
    p(
      "method_missing answers calls, but respond_to? can't see it: no real method exists, so it says false. The fix is respond_to_missing?, a hook Ruby asks whenever respond_to? can't find a real method. Return true for the names your method_missing handles, and super for the rest. Then respond_to? tells the truth.",
      "method_missing responde llamadas, pero respond_to? no lo ve: no existe un método real, así que dice false. La solución es respond_to_missing?, un hook que Ruby consulta cuando respond_to? no encuentra un método real. Devuelve true para los nombres que atiende tu method_missing y super para el resto. Así respond_to? dice la verdad.",
      "method_missing は呼び出しに答えるが、本物のメソッドは無いので respond_to? には見えず false になる。直すには respond_to_missing? を定義する。respond_to? が本物のメソッドを見つけられないとき Ruby が聞くフックだ。引き受ける名前には true、それ以外は super を返せば respond_to? が正直になる。",
    ),
    ex(`class Menu
  def self.method_missing(name, *args) = name.start_with?("price_of_") ? 3 : super
  def self.respond_to_missing?(name, priv = false) = name.start_with?("price_of_") || super
end
p Menu.respond_to?(:price_of_pie)
p Menu.respond_to?(:fly)`, "true\nfalse",
      L("Now respond_to? is honest about the magic names", "Ahora respond_to? es honesto con los nombres mágicos", "これで respond_to? が魔法の名前に正直になる")),
    p(
      "Real Rails still answers dynamic finders like find_by_email(...), built from the column names, but modern code prefers find_by(email: ...), which is clearer and easier to search for. Rule to remember: a method made by method_missing is invisible to respond_to? unless you also define respond_to_missing?.",
      "Rails real aún responde buscadores dinámicos como find_by_email(...), armados con los nombres de columna, pero el código moderno prefiere find_by(email: ...), más claro y fácil de buscar. Regla para recordar: un método hecho por method_missing es invisible para respond_to? salvo que también definas respond_to_missing?.",
      "本物の Rails は今も列名から作る find_by_email(...) のような動的検索に答えるが、最近のコードはわかりやすく検索しやすい find_by(email: ...) を好む。覚えておくこと：method_missing で作ったメソッドは、respond_to_missing? も定義しないと respond_to? から見えない。",
    ),
  ),
];

const finders: LessonDef = {
  slug: "finders",
  title: L("Find or fall", "Encontrar o caer", "見つけるか、落ちるか"),
  concept: "finders",
  mode: "lesson",
  xp: 60,
  enemy: "ghost",
  enemyName: L("NIL GHOST", "FANTASMA NIL", "ニルゴースト"),
  notes: findersNotes,
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
      hint: L("Check which rows exist for each search, and what each finder answers when nothing matches.", "Mira qué filas existen para cada búsqueda y qué responde cada buscador si nada coincide.", "それぞれの検索に合う行はある？一致しないとき各メソッドは何を返す？"),
      note: "find-vs-find-by",
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
      hint: L("Is there a row with id 9? Then look at what || raise does when find_by gives nil.", "¿Hay una fila con id 9? Luego mira qué hace || raise cuando find_by da nil.", "id 9 の行はある？find_by が nil のとき || raise は何をする？"),
      note: "find-vs-find-by",
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
      hint: L("find promises a record. What does keeping that promise mean when the row is missing?", "find promete un registro. ¿Qué significa cumplir esa promesa cuando falta la fila?", "find は必ず返す約束。行が無いとき、その約束を守るとは？"),
      note: "find-vs-find-by",
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
      hint: L("Compare what select and find return in general: a collection versus one element. Then apply it to no matches.", "Compara qué devuelven select y find en general: una colección o un elemento. Aplícalo a cero coincidencias.", "select と find が返すもの（集まりか1つか）を比べ、一致なしに当てはめよう。"),
      note: "find-vs-find-by",
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
      hint: L("Does where ever change what kind of thing it returns depending on how many rows match?", "¿Cambia where alguna vez el tipo de cosa que devuelve según cuántas filas coincidan?", "where は一致する行の数によって返すものの種類を変える？"),
      note: "find-vs-find-by",
      prompt: L("Rails: Post.where(id: 1) returns…", "Rails: Post.where(id: 1) devuelve…", "Rails：Post.where(id: 1) が返すのは…"),
      code: "posts = Post.where(id: 1)\n# posts is ___",
      options: [L("a relation (collection)", "una relación (colección)", "リレーション（集まり）"), L("one Post object", "un objeto Post", "Post 1件")],
      answer: 0,
      explain: L("where always returns a relation, even for one match. Use find_by or .first for a single record.", "where siempre devuelve una relación, aunque haya una coincidencia. Usa find_by o .first para un registro.", "where は1件でもリレーション。1件が欲しいなら find_by か .first。"),
    },
    {
      kind: "pick",
      hint: L("Read the second line: what must the first line be able to return for that check to be useful?", "Lee la segunda línea: ¿qué debe poder devolver la primera para que ese chequeo sirva?", "2行目を読もう。そのチェックが役立つには1行目が何を返せる必要がある？"),
      note: "find-vs-find-by",
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
      hint: L("method_missing handles the call, but is there a real method for respond_to? to find?", "method_missing atiende la llamada, pero ¿hay un método real que respond_to? pueda encontrar?", "呼び出しは method_missing が受ける。でも respond_to? が見つける本物のメソッドはある？"),
      note: "method-missing",
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
      hint: L("Does fly start with find_by_? Follow the else branch: what does super do there?", "¿fly empieza con find_by_? Sigue la rama else: ¿qué hace super ahí?", "fly は find_by_ で始まる？else を追おう。そこで super は何をする？"),
      note: "method-missing",
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
      hint: L("The dialog just named it: the hook respond_to? consults for methods that don't really exist.", "El diálogo acaba de nombrarlo: el hook que respond_to? consulta para métodos que no existen de verdad.", "会話に出てきたあのフック。本当は無いメソッドについて respond_to? が聞く相手。"),
      note: "method-missing",
      prompt: L("Make respond_to? honest", "Haz honesto a respond_to?", "respond_to? を正直に"),
      code: RTM_CODE,
      answer: "respond_to_missing?",
      check: { compiles: true, stdout: 'true\n"found"' },
      explain: L("respond_to? asks respond_to_missing? for names it can't find. Now it says true for find_by_*.", "respond_to? pregunta a respond_to_missing? por nombres que no encuentra. Ahora dice true para find_by_*.", "respond_to? は見つからない名前を respond_to_missing? に聞く。find_by_* で true になる。"),
    },
    {
      kind: "pick",
      hint: L("Think about ordering: does either one add an ORDER BY when you didn't ask for one?", "Piensa en el orden: ¿alguno agrega un ORDER BY cuando no lo pediste?", "順序を考えよう。頼んでいないのに ORDER BY を足すのはどっち？"),
      note: "find-vs-find-by",
      prompt: L("Rails: first vs take", "Rails: first vs take", "Rails：first と take"),
      code: "Post.first  # vs Post.take\n# ___",
      options: [L("first orders by id, take doesn't", "first ordena por id, take no", "first は id 順、take は順不同"), L("they're identical", "son idénticos", "まったく同じ")],
      answer: 0,
      explain: L("first adds ORDER BY id when there's no order. take just grabs any row, with no ordering.", "first agrega ORDER BY id si no hay orden. take toma cualquier fila, sin ordenar.", "first は順序が無いと ORDER BY id を足す。take は並べずに1行取る。"),
    },
    {
      kind: "run",
      hint: L("find must never return nil. Add something after find_by(id: id) that raises when it is nil.", "find nunca debe devolver nil. Agrega algo tras find_by(id: id) que lance un error si es nil.", "find は nil を返さない。find_by(id: id) の後に、nil ならエラーを投げるものを足そう。"),
      note: "find-vs-find-by",
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

const lazyNotes: NoteDef[] = [
  note("lazy", L("Relations are lazy", "Las relaciones son perezosas", "リレーションは遅延する"),
    p(
      "Post.where(published: true) doesn't touch the database. It returns a Relation: an object that only remembers the conditions, like a sealed scroll with the query written inside. The query runs later, only when someone needs the actual records: when you call to_a, each, map or first, or print the result.",
      "Post.where(published: true) no toca la base de datos. Devuelve una Relation: un objeto que solo recuerda las condiciones, como un pergamino sellado con la consulta escrita dentro. La consulta corre después, solo cuando alguien necesita los registros: al llamar to_a, each, map o first, o al imprimir el resultado.",
      "Post.where(published: true) は DB に触れない。返すのは条件を覚えただけの Relation で、クエリを中に書いた封印の巻物のようなもの。クエリが走るのは後で、実際のレコードが必要になったとき（to_a・each・map・first を呼ぶ、結果を表示する）だけ。",
    ),
    ex(`class Query
  def initialize(cond) = @cond = cond
  def to_a
    puts "running #{@cond}"
    [1, 2]
  end
end
q = Query.new("age > 30")
puts "ready"
p q.to_a.size`, "ready\nrunning age > 30\n2",
      L("Building the object costs nothing; to_a does the work", "Crear el objeto no cuesta nada; to_a hace el trabajo", "作るだけならタダ。仕事をするのは to_a")),
    p(
      "Laziness lets you build a query step by step, in different places, and pay only once at the end. A controller can start with where, a filter can add order or limit, and the view runs the final query when it loops. to_sql shows the SQL a relation would send, without running it.",
      "La pereza te deja armar una consulta paso a paso, en distintos lugares, y pagar una sola vez al final. Un controlador puede empezar con where, un filtro agregar order o limit, y la vista corre la consulta final al recorrerla. to_sql muestra el SQL que enviaría una relación, sin ejecutarlo.",
      "遅延のおかげで、クエリを場所を分けて少しずつ組み立て、最後に1回だけ払えばいい。コントローラが where で始め、フィルタが order や limit を足し、ビューがループするときに最終クエリが走る。to_sql は実行せずに、送るはずの SQL を見せる。",
    ),
    exRec(`class Book < Model
  attribute :genre
end
puts Book.where(genre: "sci-fi").limit(3).to_sql`, 'SELECT * FROM books WHERE genre = "sci-fi" LIMIT 3',
      L("Our mini to_sql only describes the query", "Nuestro to_sql mini solo describe la consulta", "ミニ版の to_sql はクエリを説明するだけ")),
    p(
      "Common mistake: thinking the Rails console proves relations run immediately. The console prints every result, and printing needs the records, so the query runs right away there. In your code, the same line only builds a relation until something uses it.",
      "Error común: creer que la consola de Rails prueba que las relaciones corren de inmediato. La consola imprime cada resultado, e imprimir necesita los registros, así que ahí la consulta corre enseguida. En tu código, la misma línea solo arma una relación hasta que algo la usa.",
      "よくあるミス：Rails コンソールを見て、リレーションはすぐ実行されると思うこと。コンソールは毎回結果を表示し、表示にはレコードが必要だからそこで走るだけ。コードの中では、同じ行も使われるまではリレーションを作るだけ。",
    ),
  ),
  note("immutable-chains", L("Each call returns a new relation", "Cada llamada da una relación nueva", "呼ぶたびに新しいリレーション"),
    p(
      "Each where, order or limit returns a NEW relation and leaves the one you called it on unchanged. The new relation copies the old conditions and adds one more. That's why a base query is safe to reuse: building a narrower query from it never changes the base.",
      "Cada where, order o limit devuelve una relación NUEVA y deja intacta la original. La nueva copia las condiciones viejas y agrega una más. Por eso una consulta base se puede reutilizar sin peligro: armar una consulta más estrecha a partir de ella nunca cambia la base.",
      "where・order・limit はどれも新しいリレーションを返し、呼んだ元は変えない。新しいほうは元の条件をコピーして1つ足す。だから土台のクエリは安心して使い回せる。そこから絞ったクエリを作っても土台は変わらない。",
    ),
    ex(`class Filter
  attr_reader :conds
  def initialize(conds = {}) = @conds = conds
  def where(c) = Filter.new(@conds.merge(c))
end
base = Filter.new.where(color: "red")
big = base.where(size: "L")
p base.conds
p big.conds`, '{color: "red"}\n{color: "red", size: "L"}',
      L("merge builds a new hash, so base keeps its conditions", "merge crea un hash nuevo, así base conserva sus condiciones", "merge は新しいハッシュを作るので base はそのまま")),
    p(
      "The danger is mutation. Hash#merge returns a new hash, while merge! changes the hash in place. If where used merge! and returned self, every query built from the same base would share one set of conditions: adding a filter to one would silently add it to all of them.",
      "El peligro es la mutación. Hash#merge devuelve un hash nuevo, mientras que merge! cambia el hash en el lugar. Si where usara merge! y devolviera self, todas las consultas armadas desde la misma base compartirían un solo grupo de condiciones: agregar un filtro a una lo agregaría en silencio a todas.",
      "危ないのは「破壊的変更」。Hash#merge は新しいハッシュを返し、merge! はその場で書き換える。もし where が merge! して self を返したら、同じ土台から作ったクエリが全部1つの条件を共有し、1つに足した条件が黙って全部に入ってしまう。",
    ),
    ex(`a = {x: 1}
b = a.merge(y: 2)
p a
p b
a.merge!(z: 3)
p a`, "{x: 1}\n{x: 1, y: 2}\n{x: 1, z: 3}",
      L("merge copies; merge! edits the original", "merge copia; merge! edita el original", "merge はコピー、merge! は元を書き換える")),
    p(
      "equal? checks whether two names point to the very same object, not just equal contents. A relation returned by where is never equal? to the one you called it on. Rule to remember: query methods build new objects; they never edit the one you already have.",
      "equal? comprueba si dos nombres apuntan al mismo objeto exacto, no solo a contenidos iguales. Una relación devuelta por where nunca es equal? a la que usaste para llamarlo. Regla para recordar: los métodos de consulta crean objetos nuevos; nunca editan el que ya tienes.",
      "equal? は中身が同じかではなく、2つの名前がまったく同じオブジェクトを指すかを調べる。where が返すリレーションは、呼んだ元と equal? には決してならない。覚えておくこと：クエリのメソッドは新しいオブジェクトを作り、手元のものは書き換えない。",
    ),
  ),
  note("memo-enum", L("Loading once, and Enumerable", "Cargar una vez, y Enumerable", "1回だけ読む、そして Enumerable"),
    p(
      "Once a relation runs its query, it keeps the records. The trick is @records ||= ...: the first call computes the value and stores it in an instance variable; later calls find it already set and skip the work. So calling to_a, each or first again on a loaded relation costs no new query.",
      "Cuando una relación corre su consulta, guarda los registros. El truco es @records ||= ...: la primera llamada calcula el valor y lo guarda en una variable de instancia; las siguientes lo encuentran ya asignado y se saltan el trabajo. Así, volver a llamar to_a, each o first en una relación cargada no hace otra consulta.",
      "リレーションは一度クエリを走らせるとレコードを持っておく。仕掛けは @records ||= ...。最初の呼び出しで値を計算してインスタンス変数にしまい、次からはもう入っているので仕事を飛ばす。だから読み込み済みのリレーションで to_a・each・first をまた呼んでも、新しいクエリは走らない。",
    ),
    ex(`class Cache
  def value
    @value ||= begin
      puts "computing"
      99
    end
  end
end
c = Cache.new
c.value
p c.value`, "computing\n99",
      L("The begin block runs only on the first call", "El bloque begin corre solo en la primera llamada", "begin ブロックは最初の1回だけ動く")),
    p(
      "Include Enumerable and define each, and a class gets dozens of methods for free: map, select, count, first, sort and more, all built on top of each. Our Relation does exactly this, so it behaves like an array: each loads the records once, and every Enumerable method uses them.",
      "Incluye Enumerable y define each, y una clase recibe docenas de métodos gratis: map, select, count, first, sort y más, todos construidos sobre each. Nuestra Relation hace justo eso, así que se comporta como un array: each carga los registros una vez y todos los métodos de Enumerable los usan.",
      "Enumerable を include して each を定義すると、map・select・count・first・sort など何十ものメソッドがタダで手に入る。どれも each の上に作られている。ミニ版の Relation もこれをしているので配列のように使える。each が1回だけ読み込み、Enumerable のメソッドはそれを使う。",
    ),
    ex(`class Shelf
  include Enumerable
  def each(&) = ["b", "a", "c"].each(&)
end
p Shelf.new.sort
p Shelf.new.count`, '["a", "b", "c"]\n3',
      L("Only each is written; sort and count come free", "Solo se escribe each; sort y count vienen gratis", "書いたのは each だけ。sort と count はおまけ")),
    p(
      "In Rails, count and length differ on a relation that isn't loaded yet. count asks the database with SELECT COUNT(*) and loads no records. length loads every record into Ruby first, then counts the array. size uses the loaded records if they're already there, otherwise it runs COUNT. Common mistake: expecting a NEW relation to reuse rows another relation loaded; memoization lives in each relation object.",
      "En Rails, count y length difieren en una relación que aún no está cargada. count pregunta a la base con SELECT COUNT(*) y no carga registros. length carga primero todos los registros en Ruby y luego cuenta el array. size usa los registros cargados si ya están; si no, hace COUNT. Error común: esperar que una relación NUEVA reutilice filas que cargó otra; la memoria vive en cada objeto.",
      "Rails では、まだ読み込んでいないリレーションで count と length が違う。count は SELECT COUNT(*) で DB に聞き、レコードは読まない。length は全件を Ruby に読み込んでから配列を数える。size は読み込み済みならそれを使い、なければ COUNT。よくあるミス：新しいリレーションが別のリレーションの行を使い回すと思うこと。覚えておく仕組みはオブジェクトごと。",
    ),
  ),
  note("scopes", L("Scopes are named queries", "Los scopes son consultas con nombre", "scope は名前つきクエリ"),
    p(
      "A scope gives a query a name, so code reads like your domain: Event.upcoming instead of a pile of where and order calls. In Rails you declare one in the model with scope, followed by a symbol for its name and a lambda that holds the query.",
      "Un scope le da nombre a una consulta, para que el código se lea como tu dominio: Event.upcoming en vez de un montón de llamadas a where y order. En Rails se declara en el modelo con scope, seguido de un símbolo con su nombre y una lambda que contiene la consulta.",
      "scope はクエリに名前をつけ、where や order の山の代わりに Event.upcoming のように読めるコードにする。Rails ではモデルの中で scope と書き、名前のシンボルと、クエリを入れたラムダを続ける。",
    ),
    railsCode(`class Event < ApplicationRecord
  scope :upcoming, -> { where("starts_at > ?", Time.current) }
end
Event.upcoming.limit(5)`, READ_ONLY),
    p(
      "Why a lambda? A lambda is a block of code saved for later, and calling it runs the body again. Rails calls it every time you use the scope, so the query is rebuilt fresh each time: a value like Time.current is read when you call Event.upcoming, not once when the class loads.",
      "¿Por qué una lambda? Una lambda es un bloque de código guardado para después, y al llamarla se vuelve a ejecutar su cuerpo. Rails la llama cada vez que usas el scope, así la consulta se arma de nuevo cada vez: un valor como Time.current se lee al llamar Event.upcoming, no una sola vez al cargar la clase.",
      "なぜラムダ？ラムダは後で使うためにしまったコードのかたまりで、呼ぶたびに中身がもう一度動く。Rails は scope を使うたびにそれを呼ぶので、クエリは毎回新しく組み立てられる。Time.current のような値も、クラスの読み込み時に1回ではなく、Event.upcoming を呼んだときに読まれる。",
    ),
    ex(`calls = 0
build = -> { calls += 1; "query ##{calls}" }
puts build.call
puts build.()`, "query #1\nquery #2",
      L("A lambda runs its body again on every call", "Una lambda ejecuta su cuerpo en cada llamada", "ラムダは呼ぶたびに中身を実行する")),
    p(
      "Scopes return relations, so they chain with each other and with where, order and limit, and they stay lazy. Common mistake: passing the query itself instead of a lambda; Rails requires a callable body for a scope.",
      "Los scopes devuelven relaciones, así que se encadenan entre sí y con where, order y limit, y siguen siendo perezosos. Error común: pasar la consulta misma en vez de una lambda; Rails exige un cuerpo que se pueda llamar.",
      "scope はリレーションを返すので、scope 同士や where・order・limit とつなげられ、遅延のまま。よくあるミス：ラムダではなくクエリそのものを渡すこと。Rails は scope に呼び出せる中身を求める。",
    ),
  ),
];

const lazy: LessonDef = {
  slug: "lazy-relations",
  title: L("The sealed scroll", "El pergamino sellado", "封印された巻物"),
  concept: "relations",
  mode: "lesson",
  xp: 70,
  enemy: "rails/n-plus-one",
  enemyName: L("QUERY SWARM", "ENJAMBRE SQL", "クエリの群れ"),
  notes: lazyNotes,
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
      hint: L("where only builds an object. Which line actually needs the rows?", "where solo construye un objeto. ¿Qué línea necesita de verdad las filas?", "where はオブジェクトを作るだけ。本当に行が必要なのはどの行？"),
      note: "lazy",
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
      hint: L("Does where change the relation you call it on, or build another one?", "¿where cambia la relación sobre la que lo llamas, o construye otra?", "where は呼んだリレーションを変える？それとも別のものを作る？"),
      note: "immutable-chains",
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
      hint: L("Trace @records ||=: what is @records on the first call, and on the later ones?", "Sigue @records ||=: ¿qué vale @records en la primera llamada y en las siguientes?", "@records ||= を追おう。1回目と、その後の @records はそれぞれ何？"),
      note: "memo-enum",
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
      hint: L("map and count come from Enumerable, built on each. What does the block pick out of each hash?", "map y count vienen de Enumerable, construido sobre each. ¿Qué saca el bloque de cada hash?", "map と count は each の上の Enumerable から。ブロックは各ハッシュから何を取る？"),
      note: "memo-enum",
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
      hint: L("Each call adds one clause to a new relation. Also remember our mini table name rule.", "Cada llamada agrega una cláusula a una relación nueva. Recuerda también nuestra regla mini de tablas.", "呼ぶたびに新しいリレーションへ1つ足す。ミニ版のテーブル名ルールも思い出そう。"),
      note: "lazy",
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
      hint: L("Count the trips: does where alone query? Does the second to_a reuse anything?", "Cuenta los viajes: ¿where solo consulta? ¿El segundo to_a reutiliza algo?", "往復を数えよう。where だけでクエリは走る？2回目の to_a は何かを使い回す？"),
      note: "memo-enum",
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
      hint: L("Relations are lazy. When are the rows actually needed?", "Las relaciones son perezosas. ¿Cuándo se necesitan de verdad las filas?", "リレーションは遅延する。行が本当に必要になるのはいつ？"),
      note: "lazy",
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
      hint: L("scope wants a lambda, a code block saved for later. Ruby has a short literal for it, used in the dialog.", "scope quiere una lambda, un bloque guardado para después. Ruby tiene un literal corto, usado en el diálogo.", "scope はラムダ（後で使うコード）を求める。会話に出た短い書き方がある。"),
      note: "scopes",
      prompt: L("Rails: complete the scope", "Rails: completa el scope", "Rails：scope を完成させよう"),
      code: "class Post < ApplicationRecord\n  scope :recent, ___ { order(created_at: :desc) }\nend",
      answer: "->",
      explain: L("scope takes a lambda (->), so the query is built fresh each time you call Post.recent.", "scope recibe una lambda (->), así la consulta se arma de nuevo cada vez que llamas Post.recent.", "scope はラムダ（->）を受け取る。Post.recent を呼ぶたびに新しく組み立てる。"),
    },
    {
      kind: "pick",
      hint: L("Which one can the database answer by itself, without sending every row to Ruby?", "¿Cuál puede responder la base de datos sola, sin enviar cada fila a Ruby?", "全部の行を Ruby に送らず、DB だけで答えられるのはどっち？"),
      note: "memo-enum",
      prompt: L("Rails, unloaded relation: which runs COUNT(*)?", "Rails, relación sin cargar: ¿cuál hace COUNT(*)?", "Rails：未読込でCOUNT(*)するのは？"),
      code: "Post.where(pub: true).___",
      options: ["count", "length"],
      answer: 0,
      explain: L("count asks the database with SELECT COUNT(*). length loads every record first, then counts them in Ruby.", "count pregunta a la base con SELECT COUNT(*). length carga todos los registros y los cuenta en Ruby.", "count は SELECT COUNT(*) を DB に聞く。length は全件読み込んで Ruby で数える。"),
    },
    {
      kind: "run",
      hint: L("merge! edits the shared hash in place. Make where return a new relation built with merge.", "merge! edita el hash compartido en el lugar. Haz que where devuelva una relación nueva hecha con merge.", "merge! は共有ハッシュを書き換える。merge で作った新しいリレーションを返そう。"),
      note: "immutable-chains",
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

const migrationsNotes: NoteDef[] = [
  note("migrations-order", L("Migrations run oldest first", "Las migraciones corren por antigüedad", "マイグレーションは古い順"),
    p(
      "A migration is a small Ruby file that changes the shape of the database: create a table, add a column, add an index. Each file name starts with a version made from a timestamp, like 20250314093000, so sorting the versions puts the files in the order they were written.",
      "Una migración es un pequeño archivo Ruby que cambia la forma de la base de datos: crear una tabla, agregar una columna, agregar un índice. Cada nombre de archivo empieza con una versión hecha de fecha y hora, como 20250314093000, así que ordenar las versiones pone los archivos en el orden en que se escribieron.",
      "マイグレーションは DB の形を変える小さな Ruby ファイル。テーブルを作る、列を足す、インデックスを足す、など。ファイル名は 20250314093000 のような日時のバージョンで始まるので、バージョンを並べれば書いた順になる。",
    ),
    p(
      "Order matters because later changes build on earlier ones: you can't add a column to a table that doesn't exist yet. So Rails runs pending migrations from the oldest version to the newest. In our mini version the migrations sit in a hash, and sort orders its [version, change] pairs by version.",
      "El orden importa porque los cambios posteriores se apoyan en los anteriores: no puedes agregar una columna a una tabla que aún no existe. Por eso Rails corre las migraciones pendientes de la versión más vieja a la más nueva. En nuestra mini versión las migraciones están en un hash, y sort ordena sus pares [versión, cambio] por versión.",
      "順番が大事なのは、後の変更が前の変更の上に成り立つから。まだ無いテーブルに列は足せない。だから Rails は未実行のマイグレーションを古いバージョンから新しい順に実行する。ミニ版ではマイグレーションをハッシュに入れ、sort が [バージョン, 変更] の組をバージョン順に並べる。",
    ),
    ex(`steps = {30 => "add index", 10 => "create table", 20 => "add column"}
steps.sort.each { |version, what| puts "#{version}: #{what}" }`, "10: create table\n20: add column\n30: add index",
      L("sort orders the pairs by their first element", "sort ordena los pares por su primer elemento", "sort は組を最初の要素で並べる")),
    p(
      "Common mistake: trusting a hash's order. A Ruby hash keeps insertion order, the order the keys were written, not the order of the keys' values. Looping over it directly runs the changes in whatever order they were typed. Sort by version first.",
      "Error común: confiar en el orden de un hash. Un hash de Ruby conserva el orden de inserción, el orden en que se escribieron las claves, no el orden de sus valores. Recorrerlo directamente aplica los cambios en el orden en que se tipearon. Ordena por versión primero.",
      "よくあるミス：ハッシュの順番を信じること。Ruby のハッシュはキーの大小ではなく、入れた（書いた）順を覚えている。そのままループすると、書いた順に変更が走る。先にバージョンで並べよう。",
    ),
    ex(`steps = {30 => "c", 10 => "a"}
p steps.keys
p steps.sort.map(&:first)`, "[30, 10]\n[10, 30]",
      L("Insertion order versus sorted order", "Orden de inserción frente a orden ordenado", "入れた順と並べた順")),
  ),
  note("tracking-versions", L("Remembering what already ran", "Recordar lo que ya corrió", "実行済みを覚えておく"),
    p(
      "How does Rails know which migrations already ran? It keeps a special table, schema_migrations, with one row per applied version. bin/rails db:migrate compares the migration files with that table and runs only the versions that are missing: the pending ones.",
      "¿Cómo sabe Rails qué migraciones ya corrieron? Mantiene una tabla especial, schema_migrations, con una fila por versión aplicada. bin/rails db:migrate compara los archivos de migración con esa tabla y corre solo las versiones que faltan: las pendientes.",
      "どのマイグレーションが実行済みか、Rails はどう知るのか？schema_migrations という特別なテーブルに、適用したバージョンを1行ずつ記録している。bin/rails db:migrate はファイルとこの表を比べ、足りないバージョン（未実行のもの）だけを実行する。",
    ),
    ex(`files = [101, 102, 103]
applied = [101, 102]
p files - applied
p files.reject { |v| applied.include?(v) }`, "[103]\n[103]",
      L("Pending = files whose version isn't recorded yet", "Pendientes = archivos cuya versión aún no está registrada", "未実行＝バージョンがまだ記録されていないファイル")),
    p(
      "This has a big consequence. Once a migration has run on a database, its version is recorded there, and editing the file changes nothing: db:migrate sees the version and skips it. On a shared or production database, fix a mistake with a NEW migration that changes things forward.",
      "Esto tiene una gran consecuencia. Cuando una migración ya corrió en una base de datos, su versión queda registrada allí, y editar el archivo no cambia nada: db:migrate ve la versión y la salta. En una base compartida o de producción, corrige un error con una migración NUEVA que cambie las cosas hacia adelante.",
      "ここから大事なことがわかる。一度実行したマイグレーションはバージョンが記録されるので、ファイルを直しても何も起きない。db:migrate はそのバージョンを見て飛ばす。共有や本番の DB では、前に進める新しいマイグレーションでミスを直そう。",
    ),
    p(
      "After migrating, Rails dumps the current structure of the database into db/schema.rb. That file is generated: it's a snapshot to read and to load a fresh database quickly, not a file to edit. Hand edits are overwritten the next time someone migrates.",
      "Tras migrar, Rails vuelca la estructura actual de la base de datos en db/schema.rb. Ese archivo es generado: es una foto para leer y para cargar rápido una base nueva, no un archivo para editar. Lo que edites a mano se sobrescribe la próxima vez que alguien migre.",
      "マイグレーションの後、Rails は DB の今の構造を db/schema.rb に書き出す。これは自動生成のファイルで、読むためと新しい DB を素早く作るためのスナップショット。編集用ではない。手で直しても、次に誰かが移行すると上書きされる。",
    ),
    p(
      "Common mistake: editing an old migration because it's \"just a file\". It only takes effect on databases that haven't run it yet, so teammates and production end up with different schemas.",
      "Error común: editar una migración vieja porque es \"solo un archivo\". Solo tiene efecto en bases que aún no la corrieron, así que tus compañeros y producción terminan con esquemas distintos.",
      "よくあるミス：「ただのファイルだから」と古いマイグレーションを書き換えること。効くのはまだ実行していない DB だけなので、チームの仲間や本番とスキーマがずれてしまう。",
    ),
  ),
  note("rollback", L("Rolling back with inverses", "Revertir con operaciones inversas", "逆操作でロールバック"),
    p(
      "bin/rails db:rollback undoes the most recent migration. It is very different from db:drop, which deletes the entire database. To undo, Rails replays the migration's changes backwards: in reverse order, with each step replaced by its inverse.",
      "bin/rails db:rollback deshace la migración más reciente. Es muy distinto de db:drop, que borra toda la base de datos. Para deshacer, Rails repite los cambios de la migración al revés: en orden inverso y con cada paso reemplazado por su opuesto.",
      "bin/rails db:rollback は最新のマイグレーションを1つ戻す。DB を丸ごと消す db:drop とはまったく違う。戻すとき、Rails は変更を逆向きに再生する。順番を逆にし、各ステップをその逆操作に置き換える。",
    ),
    ex(`OPPOSITE = {open: :close, push: :pop}
done = [[:open, :door], [:push, :box]]
p done.reverse.map { |op, arg| [OPPOSITE.fetch(op), arg] }`, "[[:pop, :box], [:close, :door]]",
      L("Reverse the order, then swap each step for its opposite", "Invertir el orden y cambiar cada paso por su opuesto", "順番を逆にし、各ステップを逆操作に")),
    p(
      "Why reverse order? A later change may depend on an earlier one: a column was added to a table created first. Undo the newest change first, like taking off your shoes before your socks.",
      "¿Por qué en orden inverso? Un cambio posterior puede depender de uno anterior: se agregó una columna a una tabla creada antes. Deshaz primero el cambio más nuevo, como quitarte los zapatos antes que los calcetines.",
      "なぜ逆順？後の変更は前の変更に頼っていることがあるから。先に作ったテーブルに後から列を足した、など。靴下より先に靴を脱ぐように、新しい変更から戻す。",
    ),
    p(
      "A change method can run backwards only for commands with a known inverse: create_table and drop_table, add_column and remove_column, add_index and remove_index. Raw SQL run with execute has no known inverse, so rolling it back raises ActiveRecord::IrreversibleMigration. Then you write separate up and down methods yourself.",
      "Un método change solo puede correr al revés con comandos de opuesto conocido: create_table y drop_table, add_column y remove_column, add_index y remove_index. El SQL crudo con execute no tiene opuesto conocido, así que revertirlo lanza ActiveRecord::IrreversibleMigration. Entonces escribes tú los métodos up y down por separado.",
      "change メソッドを逆に実行できるのは、逆操作がわかっているコマンドだけ：create_table と drop_table、add_column と remove_column、add_index と remove_index。execute で走らせた生 SQL には逆が無いので、戻すと ActiveRecord::IrreversibleMigration になる。そのときは up と down を自分で書く。",
    ),
    p(
      "In our mini version the table of inverses is a hash, and fetch raises KeyError for a key that isn't there. That's the same idea in miniature: no known inverse, no automatic undo.",
      "En nuestra mini versión la tabla de opuestos es un hash, y fetch lanza KeyError con una clave que no está. Es la misma idea en miniatura: sin opuesto conocido, no hay deshacer automático.",
      "ミニ版では逆操作の表がハッシュで、無いキーには fetch が KeyError を投げる。同じ考えの小型版だ。逆がわからなければ自動では戻せない。",
    ),
    crash(`OPPOSITE = {open: :close}
OPPOSITE.fetch(:jump)`, "key not found: :jump",
      L("fetch stops with KeyError when the key is missing", "fetch se detiene con KeyError si falta la clave", "キーが無いと fetch は KeyError で止まる")),
  ),
  note("indexes", L("Indexes on foreign keys", "Índices en claves foráneas", "外部キーにインデックス"),
    p(
      "An index works like the index at the back of a book: instead of reading every page to find a word, you jump straight to the right pages. Without an index, a query like where(category_id: 4) makes the database scan every row of the table.",
      "Un índice funciona como el índice al final de un libro: en vez de leer cada página para hallar una palabra, saltas directo a las páginas correctas. Sin índice, una consulta como where(category_id: 4) obliga a la base de datos a revisar cada fila de la tabla.",
      "インデックスは本の巻末の索引のようなもの。言葉を探すのに全ページを読まず、正しいページへ直接飛べる。インデックスが無いと、where(category_id: 4) のようなクエリで DB はテーブルの全行を調べることになる。",
    ),
    ex(`rows = [{id: 1, cat: 4}, {id: 2, cat: 7}, {id: 3, cat: 4}]
index = rows.group_by { |r| r[:cat] }
p index[4].map { |r| r[:id] }`, "[1, 3]",
      L("An index maps a value straight to its rows", "Un índice lleva un valor directo a sus filas", "インデックスは値から行へ直行する")),
    p(
      "Foreign key columns, the ones ending in _id, are searched constantly: every time you load a record's children. So they should almost always have an index. In a migration you write add_index, then the table, then the column, both as symbols.",
      "Las columnas de clave foránea, las que terminan en _id, se buscan todo el tiempo: cada vez que cargas los hijos de un registro. Por eso casi siempre deberían tener un índice. En una migración escribes add_index, luego la tabla y luego la columna, ambas como símbolos.",
      "外部キーの列（_id で終わる列）は、子のレコードを読むたびに探されるので、ほぼいつもインデックスが必要。マイグレーションでは add_index のあとにテーブル、次に列を、どちらもシンボルで書く。",
    ),
    railsCode(`class AddIndexToComments < ActiveRecord::Migration[8.0]
  def change
    add_index :comments, :post_id
  end
end`, READ_ONLY),
    p(
      "Indexes have a small cost: they take space, and inserts get a bit slower because the index must be updated too. Add them to the columns you search, sort or join on, not to every column.",
      "Los índices tienen un pequeño costo: ocupan espacio y las inserciones se vuelven algo más lentas porque también hay que actualizar el índice. Agrégalos en las columnas por las que buscas, ordenas o unes, no en todas.",
      "インデックスには小さなコストがある。場所をとり、挿入のたびに索引も更新するので少し遅くなる。全部の列ではなく、検索・並べ替え・結合に使う列に足そう。",
    ),
  ),
];

const migrations: LessonDef = {
  slug: "migrations",
  title: L("Blueprints of the archive", "Planos del archivo", "書庫の設計図"),
  concept: "migrations",
  mode: "lesson",
  xp: 70,
  enemy: "rails/callback-knot",
  enemyName: L("SCHEMA KNOT", "NUDO DE ESQUEMA", "スキーマの結び目"),
  notes: migrationsNotes,
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
      hint: L("Before looping, sort orders the pairs by key. Which migration runs first?", "Antes de recorrer, sort ordena los pares por clave. ¿Qué migración corre primero?", "ループ前に sort がキー順に並べる。最初に走るのはどれ？"),
      note: "migrations-order",
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
      hint: L("reject keeps what does NOT match the block. Which versions are already in the list?", "reject conserva lo que NO cumple el bloque. ¿Qué versiones ya están en la lista?", "reject はブロックに合わないものを残す。リストにもう入っているのは？"),
      note: "tracking-versions",
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
      hint: L("It's a table Rails creates itself, holding one version number per applied migration.", "Es una tabla que Rails crea solo, con un número de versión por migración aplicada.", "Rails が自分で作る表で、適用したマイグレーションごとにバージョンを1行持つ。"),
      note: "tracking-versions",
      prompt: L("Rails: table that records which migrations ran", "Rails: tabla que registra qué migraciones corrieron", "Rails：実行済みを記録する表"),
      code: "SELECT version FROM ___",
      options: ["schema_migrations", "migrations", "ar_internal_metadata"],
      answer: 0,
      explain: L("Rails stores each applied version in schema_migrations. db:migrate runs only the missing ones.", "Rails guarda cada versión aplicada en schema_migrations. db:migrate corre solo las que faltan.", "適用済みのバージョンは schema_migrations に入る。db:migrate は足りない分だけ実行。"),
    },
    {
      kind: "pick",
      hint: L("One command undoes a single step; the other destroys everything. Read the verbs.", "Un comando deshace un solo paso; el otro destruye todo. Lee los verbos.", "片方は1歩だけ戻し、もう片方は全部消す。動詞をよく読もう。"),
      note: "rollback",
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
      hint: L("Two steps: reverse flips the order, then fetch swaps each command for its opposite.", "Dos pasos: reverse invierte el orden y luego fetch cambia cada comando por su opuesto.", "2段階：reverse で順番を逆に、fetch で各コマンドを逆操作に。"),
      note: "rollback",
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
      hint: L("Is :execute a key in INVERSE? What does fetch do when the key is missing?", "¿:execute es una clave de INVERSE? ¿Qué hace fetch si falta la clave?", ":execute は INVERSE のキー？キーが無いとき fetch はどうする？"),
      note: "rollback",
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
      hint: L("Could Rails know the opposite of any SQL statement you write by hand?", "¿Podría Rails conocer el opuesto de cualquier SQL que escribas a mano?", "手で書いた任意の SQL の逆を Rails は知りうる？"),
      note: "rollback",
      prompt: L("Rails: rolling back execute inside change…", "Rails: revertir execute dentro de change…", "Rails：change 内の execute を戻すと…"),
      code: 'def change\n  execute "UPDATE posts SET pub = true"\nend\n# rollback: ___',
      options: [L("raises IrreversibleMigration", "lanza IrreversibleMigration", "IrreversibleMigration になる"), L("runs it backwards", "lo corre al revés", "逆向きに実行する")],
      answer: 0,
      explain: L("Rails can't invert raw SQL, so it raises ActiveRecord::IrreversibleMigration. Write up and down instead.", "Rails no puede invertir SQL crudo y lanza ActiveRecord::IrreversibleMigration. Escribe up y down.", "生 SQL は反転できず ActiveRecord::IrreversibleMigration になる。up と down を書こう。"),
    },
    {
      kind: "pick",
      hint: L("Production already recorded this version. Will db:migrate ever run that file there again?", "Producción ya registró esta versión. ¿db:migrate volverá a correr ese archivo allí?", "本番はこのバージョンを記録済み。db:migrate はそのファイルをまた走らせる？"),
      note: "tracking-versions",
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
      hint: L("Index the column the where searches on. Columns are written as symbols.", "Indexa la columna que busca el where. Las columnas se escriben como símbolos.", "where が探す列にインデックスを。列はシンボルで書く。"),
      note: "indexes",
      prompt: L("Rails: speed up where(author_id: 7)", "Rails: acelera where(author_id: 7)", "Rails：where(author_id: 7) を速く"),
      code: "add_index :posts, ___",
      answer: ":author_id",
      explain: L("add_index :posts, :author_id lets the database jump straight to matching rows.", "add_index :posts, :author_id deja que la base salte directo a las filas que coinciden.", "add_index :posts, :author_id で DB は一致する行へ直行できる。"),
    },
    {
      kind: "pick",
      hint: L("Who writes db/schema.rb, and when? Think about what happens after each migration.", "¿Quién escribe db/schema.rb y cuándo? Piensa en qué pasa tras cada migración.", "db/schema.rb を書くのは誰で、いつ？マイグレーションの後に何が起きる？"),
      note: "tracking-versions",
      prompt: L("Rails: the file db/schema.rb is…", "Rails: el archivo db/schema.rb es…", "Rails：db/schema.rb は…"),
      code: "# db/schema.rb is ___",
      options: [L("generated after migrating", "generado al migrar", "移行後に自動生成"), L("edited by hand", "editado a mano", "手で編集する")],
      answer: 0,
      explain: L("Rails dumps schema.rb from the database after each migration. Hand edits get overwritten.", "Rails genera schema.rb desde la base tras cada migración. Las ediciones a mano se pierden.", "schema.rb は毎回 DB から書き出される。手で直しても上書きされる。"),
    },
    {
      kind: "run",
      hint: L("A hash loops in insertion order. Put the migrations in version order before running them.", "Un hash se recorre en orden de inserción. Ordena las migraciones por versión antes de correrlas.", "ハッシュは入れた順にまわる。実行前にバージョン順に並べよう。"),
      note: "migrations-order",
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

const bossNotes: NoteDef[] = [
  note("recap-finders", L("Recap: finders", "Repaso: buscadores", "復習：検索メソッド"),
    p(
      "Three finders, three answers when nothing matches. find(id) promises a record and raises RecordNotFound if the id doesn't exist. find_by(...) returns the first match or nil. where(...) always returns a relation, maybe empty. Ask yourself first: is a missing record a bug or normal?",
      "Tres buscadores, tres respuestas cuando nada coincide. find(id) promete un registro y lanza RecordNotFound si el id no existe. find_by(...) devuelve la primera coincidencia o nil. where(...) siempre devuelve una relación, quizá vacía. Pregúntate primero: ¿que falte el registro es un bug o algo normal?",
      "検索は3つ、一致なしのときの答えも3つ。find(id) は必ず返す約束で、id が無ければ RecordNotFound。find_by(...) は最初の一致か nil。where(...) はいつもリレーション（空もある）。まず考えよう：レコードが無いのはバグ？それとも普通？",
    ),
    exRec(`class Pet < Model
  attribute :name
end
Pet.create(name: "Rex")
p Pet.find_by(name: "Tom")
p Pet.find_by_name("Rex").id`, "nil\n1",
      L("find_by gives nil; the magic finder goes through method_missing", "find_by da nil; el buscador mágico pasa por method_missing", "find_by は nil。魔法の検索は method_missing 経由")),
    p(
      "Magic finders like find_by_name aren't written anywhere: method_missing catches the unknown name, cuts off the find_by_ prefix and calls find_by with that column. Our mini Model also defines respond_to_missing? for those names, so respond_to? answers honestly.",
      "Los buscadores mágicos como find_by_name no están escritos en ningún lado: method_missing atrapa el nombre desconocido, corta el prefijo find_by_ y llama a find_by con esa columna. Nuestro Model mini también define respond_to_missing? para esos nombres, así respond_to? responde con honestidad.",
      "find_by_name のような魔法の検索はどこにも書かれていない。method_missing が知らない名前を拾い、find_by_ を切り取って、その列で find_by を呼ぶ。ミニ Model はその名前用に respond_to_missing? も定義しているので、respond_to? は正直に答える。",
    ),
    crashRec(`class Pet < Model
  attribute :name
end
Pet.find(7)`, "Couldn't find Pet with 'id'=7",
      L("find never returns nil: a missing id raises", "find nunca devuelve nil: un id ausente lanza error", "find は nil を返さない。無い id はエラー")),
  ),
  note("recap-relations", L("Recap: lazy relations", "Repaso: relaciones perezosas", "復習：遅延リレーション"),
    p(
      "where, order and limit each return a new Relation that only remembers the conditions. Nothing hits the database until the records are needed: to_a, each, map, first, or printing. The class of the result is Relation, not Array, even though it acts like one thanks to Enumerable.",
      "where, order y limit devuelven cada uno una Relation nueva que solo recuerda las condiciones. Nada llega a la base de datos hasta que se necesitan los registros: to_a, each, map, first o imprimir. La clase del resultado es Relation, no Array, aunque se comporte como uno gracias a Enumerable.",
      "where・order・limit はそれぞれ、条件を覚えただけの新しい Relation を返す。レコードが必要になる（to_a・each・map・first・表示）まで DB には行かない。結果のクラスは Array ではなく Relation。Enumerable のおかげで配列のように使えるだけ。",
    ),
    p(
      "Once loaded, a relation keeps its records (@records ||= ...), so later calls on that same object are free. In our mini version DB.queries counts every trip, which makes this visible. To force loading right away, call to_a.",
      "Una vez cargada, la relación guarda sus registros (@records ||= ...), así que las llamadas siguientes sobre ese mismo objeto son gratis. En nuestra mini versión DB.queries cuenta cada viaje, lo que lo hace visible. Para forzar la carga de inmediato, llama to_a.",
      "一度読み込んだリレーションはレコードを持っておく（@records ||= ...）ので、同じオブジェクトへの次の呼び出しはタダ。ミニ版では DB.queries が往復を数えるので、それが目で見える。すぐに読み込ませたいなら to_a を呼ぶ。",
    ),
    exRec(`class Pet < Model
  attribute :name, :age
end
Pet.create(name: "Rex", age: 3)
Pet.create(name: "Tom", age: 1)
DB.queries = 0
r = Pet.order(:age)
puts DB.queries
p r.map(&:name), r.count
puts DB.queries`, '0\n["Tom", "Rex"]\n2\n1',
      L("order costs nothing; map loads once; count reuses the rows", "order no cuesta; map carga una vez; count reutiliza", "order はタダ、map で1回読み、count は使い回し")),
  ),
  note("recap-conventions", L("Recap: names and migrations", "Repaso: nombres y migraciones", "復習：名前とマイグレーション"),
    p(
      "Convention over configuration: a model's table is its class name in snake_case with the last word plural. Rails' inflector knows English, irregular plurals included, while our mini version just adds an s.",
      "Convención sobre configuración: la tabla de un modelo es el nombre de su clase en snake_case con la última palabra en plural. El inflector de Rails sabe inglés, plurales irregulares incluidos, mientras que nuestra mini versión solo agrega una s.",
      "設定より規約：モデルのテーブル名は、クラス名を snake_case にして最後の単語を複数形にしたもの。Rails の活用器は不規則な複数形も含めて英語を知っているが、ミニ版は s を足すだけ。",
    ),
    exRec(`class Mouse < Model; end
puts Mouse.table`, "mouses",
      L("Our mini rule; the Rails inflector would say mice", "Nuestra regla mini; el inflector de Rails diría mice", "ミニ版のルール。Rails の活用器なら mice")),
    p(
      "Migrations change the database's shape in small dated steps. A generator writes a new migration file with a timestamp version. db:migrate applies the pending files, oldest first, and records each version in schema_migrations. db:rollback undoes the latest one by running its inverse. You can only apply a file that exists, and only undo one that was applied.",
      "Las migraciones cambian la forma de la base de datos en pasos pequeños y fechados. Un generador escribe un archivo de migración nuevo con una versión de fecha y hora. db:migrate aplica los pendientes, el más viejo primero, y registra cada versión en schema_migrations. db:rollback deshace el último con su opuesto. Solo puedes aplicar un archivo que existe y deshacer uno ya aplicado.",
      "マイグレーションは日付つきの小さな一歩で DB の形を変える。ジェネレータが日時のバージョンつきの新しいファイルを書く。db:migrate は未実行のものを古い順に適用し、バージョンを schema_migrations に記録する。db:rollback は最新の1つを逆操作で戻す。存在するファイルしか適用できず、適用済みのものしか戻せない。",
    ),
  ),
];

const boss: LessonDef = {
  slug: "query-golem",
  title: L("Boss: Query Golem", "Jefe: Gólem de Consultas", "ボス：クエリゴーレム"),
  concept: "relations",
  mode: "boss",
  xp: 180,
  enemy: "golem",
  enemyName: L("QUERY GOLEM", "GÓLEM SQL", "クエリゴーレム"),
  notes: bossNotes,
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
    { kind: "predict", hint: L("find_by_title isn't a real method: method_missing rewrites it. Which post is titled Yo?", "find_by_title no es un método real: method_missing lo reescribe. ¿Qué post se titula Yo?", "find_by_title は本物じゃない。method_missing が書き換える。Yo はどの投稿？"), note: "recap-finders", time: 15, prompt: PRINT, code: 'p Post.find_by_title("Yo").views', options: ["1", "5", "nil"], answer: 0, output: "1", check: { compiles: true, program: seeded('p Post.find_by_title("Yo").views'), stdout: "1" }, explain: L("method_missing turns find_by_title into find_by(title: \"Yo\"), and Yo has 1 view.", "method_missing convierte find_by_title en find_by(title: \"Yo\"), y Yo tiene 1 vista.", "method_missing が find_by(title: \"Yo\") に変える。Yo の views は 1。") },
    { kind: "predict", hint: L("Does our mini Model define respond_to_missing? for find_by_ names?", "¿Nuestro Model mini define respond_to_missing? para nombres find_by_?", "ミニ Model は find_by_ の名前に respond_to_missing? を定義している？"), note: "recap-finders", time: 12, prompt: PRINT, code: "p Post.respond_to?(:find_by_title)", options: ["true", "false"], answer: 0, output: "true", check: { compiles: true, program: seeded("p Post.respond_to?(:find_by_title)"), stdout: "true" }, explain: L("Our mini Model defines respond_to_missing? for find_by_ names, so respond_to? is honest.", "Nuestro mini Model define respond_to_missing? para nombres find_by_, así respond_to? es honesto.", "ミニ Model は find_by_ 用に respond_to_missing? を定義済みなので正直に true。") },
    { kind: "predict", hint: L("find_by and find differ only when nothing matches. Which one is used here?", "find_by y find solo difieren cuando nada coincide. ¿Cuál se usa aquí?", "find_by と find の違いは一致なしのときだけ。ここで使っているのは？"), note: "recap-finders", time: 12, prompt: PRINT, code: 'p Post.find_by(title: "Nope")', options: ["nil", "[]", L("RecordNotFound error", "Error RecordNotFound", "RecordNotFound エラー")], answer: 0, output: "nil", check: { compiles: true, program: seeded('p Post.find_by(title: "Nope")'), stdout: "nil" }, explain: L("find_by returns nil when nothing matches. Only find raises.", "find_by devuelve nil si nada coincide. Solo find lanza error.", "find_by は一致なしで nil。エラーになるのは find だけ。") },
    { kind: "predict", hint: L("What class do where and order return? Then keep author 1 and sort by views.", "¿Qué clase devuelven where y order? Luego quédate con el autor 1 y ordena por vistas.", "where と order が返すクラスは？次に著者1だけ残して views 順に。"), note: "recap-relations", time: 15, prompt: PRINT, code: "r = Post.where(author_id: 1).order(:views)\nputs r.class\np r.map(&:title)", options: ['Relation / ["Hi", "Ok"]', 'Array / ["Hi", "Ok"]', 'Relation / ["Ok", "Hi"]'], answer: 0, output: 'Relation\n["Hi", "Ok"]', check: { compiles: true, program: seeded("r = Post.where(author_id: 1).order(:views)\nputs r.class\np r.map(&:title)"), stdout: 'Relation\n["Hi", "Ok"]' }, explain: L("where and order return a Relation. map loads it: author 1 has Hi (5) and Ok (9), by views.", "where y order devuelven una Relation. map la carga: el autor 1 tiene Hi (5) y Ok (9), por vistas.", "where と order は Relation を返す。map で読み込み、著者1の Hi(5)・Ok(9) が views 順。") },
    { kind: "predict", hint: L("Is there a post with id 99? Remember the promise find makes.", "¿Hay un post con id 99? Recuerda la promesa que hace find.", "id 99 の投稿はある？find の約束を思い出そう。"), note: "recap-finders", time: 12, prompt: HAPPENS, code: "Post.find(99)", options: [L("RecordNotFound error", "Error RecordNotFound", "RecordNotFound エラー"), "nil"], answer: 0, check: { compiles: true, program: seeded("Post.find(99)"), throws: "Couldn't find Post with 'id'=99" }, explain: L("There is no id 99, and find never returns nil: it raises RecordNotFound.", "No hay id 99, y find nunca devuelve nil: lanza RecordNotFound.", "id 99 は無い。find は nil を返さず RecordNotFound を投げる。") },
    { kind: "predict", hint: L("to_a loads and remembers. Does first on that loaded relation need another trip?", "to_a carga y recuerda. ¿first sobre esa relación cargada necesita otro viaje?", "to_a は読み込んで覚える。読み込み済みで first を呼ぶともう1往復？"), note: "recap-relations", time: 15, prompt: PRINT, code: "DB.queries = 0\nr = Post.where(views: 9)\nr.to_a\nr.first\nputs DB.queries", options: ["1", "2", "0"], answer: 0, output: "1", check: { compiles: true, program: seeded("DB.queries = 0\nr = Post.where(views: 9)\nr.to_a\nr.first\nputs DB.queries"), stdout: "1" }, explain: L("to_a runs the one query and remembers the rows. first reads the loaded rows: still 1.", "to_a hace la única consulta y recuerda las filas. first lee las filas cargadas: sigue en 1.", "to_a で1回だけ実行して行を覚える。first は読み込み済みを使うので 1 のまま。") },
    { kind: "pick", hint: L("The Rails inflector knows irregular English plurals.", "El inflector de Rails conoce los plurales irregulares del inglés.", "Rails の活用器は英語の不規則な複数形を知っている。"), note: "recap-conventions", time: 12, prompt: L("Rails: table name for model Person?", "Rails: ¿tabla para el modelo Person?", "Rails：モデル Person のテーブル名は？"), code: "# table: ___", options: ["people", "persons", "person"], answer: 0, explain: L("The inflector knows irregular plurals: Person → people.", "El inflector conoce plurales irregulares: Person → people.", "活用器は不規則な複数形を知っている：Person → people。") },
    { kind: "pick", hint: L("Which version forces the records to load right away instead of waiting?", "¿Qué versión obliga a cargar los registros ya mismo en vez de esperar?", "待たずにすぐレコードを読み込ませるのはどっち？"), note: "recap-relations", time: 12, prompt: L("Rails: run the SQL right now", "Rails: ejecuta el SQL ahora mismo", "Rails：今すぐ SQL を走らせる"), code: "posts = ___", options: ["Post.where(pub: true).to_a", "Post.where(pub: true)"], answer: 0, explain: L("to_a loads the records immediately. A bare relation waits until it is used.", "to_a carga los registros de inmediato. Una relación sola espera hasta que se use.", "to_a はすぐ読み込む。リレーションだけなら使われるまで待つ。") },
    { kind: "order", hint: L("You can't apply a file that doesn't exist yet, or undo one that wasn't applied.", "No puedes aplicar un archivo que aún no existe, ni deshacer uno que no se aplicó.", "まだ無いファイルは適用できず、適用していないものは戻せない。"), note: "recap-conventions", time: 20, prompt: L("Rails: create, apply, then undo a migration", "Rails: crea, aplica y deshace una migración", "Rails：移行を作る→適用→戻す"), lines: ["bin/rails generate migration AddBodyToPosts body:text", "bin/rails db:migrate", "bin/rails db:rollback"], explain: L("generate writes the dated file, db:migrate applies it and records the version, db:rollback undoes it.", "generate escribe el archivo fechado, db:migrate lo aplica y registra la versión, db:rollback lo deshace.", "generate が日付つきファイルを作り、db:migrate が適用して記録、db:rollback が戻す。") },
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
