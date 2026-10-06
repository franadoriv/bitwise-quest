import type { Beat, LessonDef, NoteBlock, NoteDef, RegionDef, Text } from "../../../lib/content/types.ts";
import { L } from "../../../lib/i18n/text.ts";
import { MINI_RECORD, withHelper } from "../mini.ts";

// REGION 2 · ASSOCIATION FOREST  (associations, N+1 queries, validations, callbacks and concerns)
// Verified claims run on plain Ruby 3.4.7 with our mini Active Record (mini.ts) prepended; Rails API
// facts are conceptual questions without a check, explained from the Rails Guides.

const say = (text: Text, code?: string): Beat => ({ kind: "dialog", speaker: "master", text, ...(code ? { code } : {}) });
const enemySays = (text: Text): Beat => ({ kind: "dialog", speaker: "enemy", text });

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");
const QUERIES = L("How many queries?", "¿Cuántas consultas?", "クエリは何回？");

/** The forest's family: two authors and three posts in our mini Active Record. */
const SEED = `class Author < Model
  attribute :name
  has_many :posts
end
class Post < Model
  attribute :title, :author_id
  belongs_to :author
end
Author.create(name: "Ada")
Author.create(name: "Bo")
Post.create(title: "Hi", author_id: 1)
Post.create(title: "Yo", author_id: 2)
Post.create(title: "Ok", author_id: 1)`;

/** A full program: hidden helper + the seed family + the visible snippet. */
const seeded = (code: string) => withHelper(MINI_RECORD, `${SEED}\n${code}`);

/** The query-counting finders used across the N+1 lesson (visible in the editor). */
const FINDERS = `$queries = 0
AUTHORS = {1 => "Ada", 2 => "Bo"}
def find_author(id) = ($queries += 1; AUTHORS[id])
def find_authors(ids) = ($queries += 1; AUTHORS.slice(*ids))`;

const q = (n: number): Text => L(`QUERIES: ${n}`, `CONSULTAS: ${n}`, `クエリ: ${n}`);

// Guidebook notes: long explanations players can reopen from any question (📖).
// Examples use names and values different from the questions so they never give an answer away.
const note = (id: string, title: Text, ...blocks: NoteBlock[]): NoteDef => ({ id, title, blocks });
const p = (en: string, es: string, ja: string): NoteBlock => ({ t: "p", text: L(en, es, ja) });
const rec = (code: string) => withHelper(MINI_RECORD, code);
/** A plain-Ruby example; the validator runs it on Ruby 3.4.7 and checks `output`. */
const ex = (code: string, output: string, caption?: Text): NoteBlock => ({ t: "code", code, output, caption });
/** An example that runs on top of our hidden mini Model (MINI_RECORD). */
const exRec = (code: string, output: string, caption?: Text): NoteBlock => ({ t: "code", code, output, caption, check: { compiles: true, program: rec(code), stdout: output } });
/** An example that must stop with this runtime error (verified too). */
const crash = (code: string, throws: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { compiles: true, throws } });
/** Real Rails code to read, not run: Rails isn't available in the sandbox. */
const railsCode = (code: string, caption: Text): NoteBlock => ({ t: "code", code, caption });
const READ_ONLY = L("Rails code to read, not run here", "Código Rails para leer, aquí no se ejecuta", "読むための Rails コード（ここでは実行しない）");

// ─── 2.1 Family trees: associations ────────────────────────────────────────
const associationsNotes: NoteDef[] = [
  note("belongs-to", L("belongs_to and the foreign key", "belongs_to y la llave foránea", "belongs_to と外部キー"),
    p(
      "Tables are linked by keys. A comment belongs to a post when its row stores the post's id in a column named post_id: a foreign key, a pointer to a row in another table. In the model, belongs_to :post declares that link and gives every comment a method post that loads the parent row.",
      "Las tablas se enlazan con llaves. Un comentario pertenece a un post cuando su fila guarda el id del post en una columna llamada post_id: una llave foránea, un puntero a una fila de otra tabla. En el modelo, belongs_to :post declara ese enlace y da a cada comentario un método post que carga la fila padre.",
      "テーブルは鍵でつながる。コメントの行が post_id という列に投稿の id を持っていれば、コメントはその投稿に属する。これが外部キー、別テーブルの行を指す目印だ。モデルで belongs_to :post と書くとこのつながりを宣言し、親の行を読む post メソッドが各コメントにできる。",
    ),
    p(
      "Like attribute, belongs_to is just a class method that calls define_method. It builds the key column's name from the association name plus _id, and defines a method named after the association. The macro itself lives on the base class; the method it writes lands on your model.",
      "Igual que attribute, belongs_to es solo un método de clase que llama a define_method. Arma el nombre de la columna llave con el nombre de la asociación más _id, y define un método con el nombre de la asociación. La macro vive en la clase base; el método que escribe queda en tu modelo.",
      "attribute と同じく、belongs_to も define_method を呼ぶただのクラスメソッド。関連名に _id をつけて鍵の列名を作り、関連名のメソッドを定義する。マクロ自体は親クラスにあり、書かれたメソッドは自分のモデルに入る。",
    ),
    ex(`class Base
  def self.points_to(name)
    define_method(name) { "fetch #{name} #{@row[:"#{name}_id"]}" }
  end
  def initialize(row) = @row = row
end
class Comment < Base
  points_to :video
end
puts Comment.new(video_id: 12).video`, "fetch video 12",
      L("A mini macro: the key name is the association name + _id", "Una macro mini: la llave es el nombre de la asociación + _id", "ミニマクロ：鍵の名前は関連名 + _id")),
    p(
      "Which side holds the key? Always the belongs_to side, the \"many\" side. Many comments can each store one video_id, but a video can't store a list of comment ids in a single column. So if Video has_many :comments, the column is comments.video_id.",
      "¿Qué lado guarda la llave? Siempre el lado belongs_to, el lado \"muchos\". Muchos comentarios pueden guardar cada uno un video_id, pero un video no puede guardar una lista de ids de comentarios en una sola columna. Así que si Video has_many :comments, la columna es comments.video_id.",
      "鍵を持つのはどっち？いつも belongs_to 側、つまり「多い」側。たくさんのコメントがそれぞれ video_id を1つ持てるが、動画は1つの列にコメントの id のリストを持てない。だから Video has_many :comments なら列は comments.video_id。",
    ),
    p(
      "Since Rails 5, belongs_to is required by default: saving a comment whose video is missing fails validation with \"Video must exist\". If the parent is truly optional, write belongs_to :video, optional: true. Common mistake: expecting a NULL key to save quietly.",
      "Desde Rails 5, belongs_to es obligatorio por defecto: guardar un comentario sin su video falla la validación con \"Video must exist\". Si el padre es de verdad opcional, escribe belongs_to :video, optional: true. Error común: esperar que una llave NULL se guarde en silencio.",
      "Rails 5 から belongs_to は標準で必須。動画の無いコメントを保存すると \"Video must exist\" で検証に落ちる。親が本当に無くてもいいなら belongs_to :video, optional: true と書く。よくあるミス：鍵が NULL でも黙って保存されると思うこと。",
    ),
  ),
  note("has-many", L("has_many looks in the child table", "has_many busca en la tabla hija", "has_many は子テーブルを探す"),
    p(
      "has_many is the other side of the link: a shop has many products. It stores nothing in the shops table. Instead, shop.products searches the CHILD table for rows whose foreign key matches this shop's id: products where shop_id equals this id.",
      "has_many es el otro lado del enlace: una tienda tiene muchos productos. No guarda nada en la tabla shops. En cambio, shop.products busca en la tabla HIJA las filas cuya llave foránea coincide con el id de esta tienda: products donde shop_id es igual a este id.",
      "has_many はつながりの反対側。店はたくさんの商品を持つ。shops テーブルには何も保存しない。shop.products は子テーブルから、外部キーがこの店の id と同じ行（shop_id がこの id の products）を探す。",
    ),
    p(
      "The two names come from different places. The table comes from the association name (:products → products). The key comes from the OWNER's class name (Shop → shop_id). A common bug is building the key from the children's name instead, like product_id, a column the products table doesn't have.",
      "Los dos nombres salen de lugares distintos. La tabla sale del nombre de la asociación (:products → products). La llave sale del nombre de la clase DUEÑA (Shop → shop_id). Un bug común es armar la llave con el nombre de los hijos, como product_id, una columna que la tabla products no tiene.",
      "2つの名前は出どころが違う。テーブル名は関連名から（:products → products）。鍵は持ち主のクラス名から（Shop → shop_id）。よくあるバグは子の名前で鍵を作ること。product_id という列は products テーブルには無い。",
    ),
    ex(`class Base
  def self.owns(name)
    define_method(name) { "#{name} WHERE #{self.class.name.downcase}_id = #{@id}" }
  end
  def initialize(id) = @id = id
end
class Shop < Base
  owns :products
end
puts Shop.new(4).products`, "products WHERE shop_id = 4",
      L("Table from the association, key from the owner's class", "Tabla de la asociación, llave de la clase dueña", "テーブルは関連名から、鍵は持ち主のクラスから")),
    p(
      "In real Rails, and in our mini version, shop.products returns a lazy relation, not an array. You can keep chaining where, order or limit on it, and the query only runs when you use the records.",
      "En Rails real, y en nuestra mini versión, shop.products devuelve una relación perezosa, no un array. Puedes seguir encadenando where, order o limit, y la consulta solo corre cuando usas los registros.",
      "本物の Rails でもミニ版でも、shop.products は配列ではなく遅延リレーションを返す。where・order・limit をつなげ続けられ、クエリはレコードを使うときに初めて走る。",
    ),
    exRec(`class Shop < Model
  has_many :products
end
class Product < Model
  attribute :label, :shop_id
end
Shop.create({})
Product.create(label: "pen", shop_id: 1)
Product.create(label: "cup", shop_id: 1)
p Shop.find(1).products.order(:label).map(&:label)`, '["cup", "pen"]',
      L("The children relation keeps chaining before it loads", "La relación de hijos se sigue encadenando antes de cargar", "子のリレーションは読み込む前につなげられる")),
  ),
  note("advanced-assoc", L("through and polymorphic", "through y polymorphic", "through と polymorphic"),
    p(
      "Sometimes two models meet through a third. A student and a course meet in an enrollment that records a grade. Rails models that with has_many :enrollments plus has_many :courses, through: :enrollments. The join model is a full model, so it can hold its own data and validations.",
      "A veces dos modelos se encuentran a través de un tercero. Un estudiante y un curso se encuentran en una inscripción que registra una nota. Rails lo modela con has_many :enrollments más has_many :courses, through: :enrollments. El modelo de unión es un modelo completo, así que puede tener sus propios datos y validaciones.",
      "2つのモデルが3つ目を通じて出会うことがある。学生と講座は、成績を記録する「履修」で出会う。Rails では has_many :enrollments と has_many :courses, through: :enrollments で表す。中間モデルは普通のモデルなので、自分のデータや検証を持てる。",
    ),
    railsCode(`class Student < ApplicationRecord
  has_many :enrollments
  has_many :courses, through: :enrollments
end`, READ_ONLY),
    p(
      "has_and_belongs_to_many also links two models, but through a bare join table holding only the two ids: no model and no extra columns. Choose it only when the link itself carries no data. Once you need a date, a role or a grade on the link, use has_many :through.",
      "has_and_belongs_to_many también enlaza dos modelos, pero con una tabla de unión desnuda que solo tiene los dos ids: sin modelo y sin columnas extra. Elígelo solo cuando el enlace no lleva datos. Cuando necesites una fecha, un rol o una nota en el enlace, usa has_many :through.",
      "has_and_belongs_to_many も2つのモデルをつなぐが、2つの id だけを持つ素の中間テーブルを使う。モデルも追加の列も無い。つながり自体にデータが無いときだけ選ぼう。日付・役割・成績などが必要になったら has_many :through。",
    ),
    p(
      "A polymorphic association lets one model belong to several kinds of parent. A Like might belong to a photo or to a comment. belongs_to :likeable, polymorphic: true stores two columns: likeable_id and likeable_type, the parent's class name, so Rails knows which table to look in.",
      "Una asociación polimórfica deja que un modelo pertenezca a varios tipos de padre. Un Like puede pertenecer a una foto o a un comentario. belongs_to :likeable, polymorphic: true guarda dos columnas: likeable_id y likeable_type, el nombre de la clase padre, para que Rails sepa en qué tabla buscar.",
      "ポリモーフィック関連なら、1つのモデルが何種類もの親に属せる。Like は写真にもコメントにも属せる。belongs_to :likeable, polymorphic: true は likeable_id と、親のクラス名を入れる likeable_type の2列を持ち、どのテーブルを探すかがわかる。",
    ),
    ex(`row = {likeable_type: "Photo", likeable_id: 8}
table = row[:likeable_type].downcase + "s"
puts "SELECT * FROM #{table} WHERE id = #{row[:likeable_id]}"`, "SELECT * FROM photos WHERE id = 8",
      L("The _type column says which table the _id points into", "La columna _type dice a qué tabla apunta el _id", "_type 列が _id の指すテーブルを教える")),
  ),
];

const associations: LessonDef = {
  slug: "associations",
  title: L("Family trees", "Árboles genealógicos", "家系図"),
  concept: "associations",
  mode: "lesson",
  xp: 75,
  enemy: "slime",
  enemyName: L("ORPHAN ROW", "FILA HUÉRFANA", "みなしごの行"),
  notes: associationsNotes,
  beats: [
    say(L(
      "Welcome to Association Forest! Every tree has roots: a post BELONGS TO its author by keeping author_id, a key to the parent row.",
      "¡Bienvenido al Bosque de Asociaciones! Cada árbol tiene raíces: un post PERTENECE a su autor guardando author_id, la llave a la fila padre.",
      "アソシエーションの森へようこそ！木には根がある。投稿は author_id という鍵を持ち、親の著者に属するんだ。",
    )),
    {
      kind: "act",
      prompt: L("Build our mini belongs_to and follow the key", "Arma nuestro belongs_to mini y sigue la llave", "ミニ belongs_to を作り、鍵をたどろう"),
      steps: [
        { label: L("MACRO", "MACRO", "マクロ"), line: "def self.belongs_to(name)", effects: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "Post" }] },
        { label: L("WRITE METHOD", "CREAR MÉTODO", "メソッド作成"), line: '  define_method(name) { "load #{name} ##{@attrs[:"#{name}_id"]}" }', effects: [{ t: "say", actor: "hero", text: L("New method!", "¡Método nuevo!", "新メソッド！") }] },
        { label: L("CALL IT", "USARLO", "呼ぶ"), line: "belongs_to :author", effects: [{ t: "item", kind: "key", holder: "hero" }, { t: "value", actor: "hero", text: "author_id: 7" }] },
        { label: L("FOLLOW KEY", "SEGUIR LLAVE", "鍵をたどる"), line: "puts Post.new(author_id: 7).author", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Author #7" }, { t: "give", to: "ally" }, { t: "print", text: "load author #7" }], output: "load author #7" },
      ],
    },
    {
      kind: "predict",
      hint: L("The method builds a key name from the association name. What value is stored under that key here?", "El método arma el nombre de la llave con el de la asociación. ¿Qué valor hay bajo esa llave aquí?", "メソッドは関連名から鍵の名前を作る。ここでその鍵に入っている値は？"),
      note: "belongs-to",
      prompt: PRINT,
      code: 'class Model\n  def self.belongs_to(name)\n    define_method(name) { "load #{name} ##{@attrs[:"#{name}_id"]}" }\n  end\n  def initialize(attrs) = @attrs = attrs\nend\nclass Post < Model\n  belongs_to :author\nend\nputs Post.new(author_id: 3).author',
      options: ["load author #3", "load author_id #3", "load author #"],
      answer: 0,
      output: "load author #3",
      check: { compiles: true, stdout: "load author #3" },
      explain: L("belongs_to :author builds the key name author_id from the association name and reads it.", "belongs_to :author arma el nombre de la llave author_id a partir del nombre y la lee.", "belongs_to :author は名前から author_id という鍵名を作って読むよ。"),
      setup: [{ t: "item", kind: "key", holder: "hero" }, { t: "tag", actor: "hero", text: "Post", value: "author_id: 3" }],
      win: [{ t: "give", to: "ally" }, { t: "print", text: "load author #3" }],
    },
    say(L(
      "No magic: belongs_to is a class method that calls define_method. Rails writes the method for you, and so does our mini version.",
      "Sin magia: belongs_to es un método de clase que llama a define_method. Rails te escribe el método, y nuestra versión mini también.",
      "魔法じゃない。belongs_to は define_method を呼ぶクラスメソッド。Rails もミニ版もメソッドを書いてくれる。",
    )),
    {
      kind: "predict",
      hint: L("instance_methods(false) lists only what Post itself defines. What did the macro create there?", "instance_methods(false) lista solo lo que define Post. ¿Qué creó la macro ahí?", "instance_methods(false) は Post 自身の定義だけ。マクロはそこに何を作った？"),
      note: "belongs-to",
      prompt: PRINT,
      code: 'class Model\n  def self.belongs_to(name)\n    define_method(name) { "load #{name}" }\n  end\nend\nclass Post < Model\n  belongs_to :author\nend\np Post.instance_methods(false)',
      options: ["[:author]", "[:belongs_to]", "[]"],
      answer: 0,
      output: "[:author]",
      check: { compiles: true, stdout: "[:author]" },
      explain: L("define_method added a real instance method named author to Post. belongs_to itself lives on Model.", "define_method agregó a Post un método de instancia real llamado author. belongs_to vive en Model.", "define_method で Post に author というメソッドが本当に増えた。belongs_to 自体は Model にある。"),
    },
    say(L(
      "The other side: an author HAS MANY posts. has_many queries the CHILD table, with a foreign key named after the owner: author_id.",
      "El otro lado: un autor TIENE MUCHOS posts. has_many consulta la tabla HIJA, con una llave foránea nombrada por el dueño: author_id.",
      "反対側：著者はたくさんの投稿を持つ。has_many は子テーブルを、持ち主の名前の外部キー author_id で探す。",
    )),
    {
      kind: "predict",
      hint: L("The table comes from the association name; the key comes from the owner's class name.", "La tabla sale del nombre de la asociación; la llave, del nombre de la clase dueña.", "テーブル名は関連名から、鍵は持ち主のクラス名から。"),
      note: "has-many",
      prompt: PRINT,
      code: 'class Model\n  def self.has_many(name)\n    define_method(name) { "SELECT * FROM #{name} WHERE #{self.class.name.downcase}_id = #{@id}" }\n  end\n  def initialize(id) = @id = id\nend\nclass Author < Model\n  has_many :posts\nend\nputs Author.new(1).posts',
      options: ["SELECT * FROM posts WHERE author_id = 1", "SELECT * FROM authors WHERE post_id = 1", "SELECT * FROM posts WHERE posts_id = 1"],
      answer: 0,
      output: "SELECT * FROM posts WHERE author_id = 1",
      check: { compiles: true, stdout: "SELECT * FROM posts WHERE author_id = 1" },
      explain: L("The table comes from the association (posts); the key from the owner's class (Author → author_id).", "La tabla sale de la asociación (posts); la llave, de la clase dueña (Author → author_id).", "テーブル名は関連名（posts）から、キーは持ち主のクラス（Author → author_id）から。"),
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Author #1" }],
      win: [{ t: "item", kind: "scroll", holder: "ally" }, { t: "print", text: "SELECT * FROM posts WHERE author_id = 1" }],
    },
    {
      kind: "pick",
      hint: L("One author, many posts. Which side can store a single id per row?", "Un autor, muchos posts. ¿Qué lado puede guardar un solo id por fila?", "著者1人に投稿たくさん。1行に id を1つ持てるのはどっち側？"),
      note: "belongs-to",
      prompt: L("Author has_many :posts. Where is the foreign key?", "Author has_many :posts. ¿Dónde está la llave foránea?", "Author has_many :posts。外部キーはどこ？"),
      code: "# Author has_many :posts / Post belongs_to :author\n# column: ___",
      options: ["posts.author_id", "authors.post_id"],
      answer: 0,
      explain: L("Rails Guides: the belongs_to side holds the foreign key. Many posts each point to one author.", "Guías de Rails: el lado belongs_to guarda la llave foránea. Muchos posts apuntan cada uno a un autor.", "Rails ガイド：外部キーは belongs_to 側にある。たくさんの投稿が1人の著者を指すよ。"),
    },
    say(L(
      "Our mini Model from Record Village has both macros. Here is the forest's family: 2 authors, 3 posts.",
      "Nuestro Model mini de Record Village tiene ambas macros. Esta es la familia del bosque: 2 autores, 3 posts.",
      "レコード村のミニ Model には両方のマクロがある。これが森の家族：著者2人、投稿3つ。",
    ), SEED),
    {
      kind: "predict",
      hint: L("has_many gives something lazy and chainable. Then: which of Ada's posts match the where?", "has_many da algo perezoso y encadenable. Luego: ¿qué posts de Ada cumplen el where?", "has_many は遅延でつなげられるものを返す。Ada の投稿で where に合うのは？"),
      note: "has-many",
      prompt: PRINT,
      code: "ada = Author.find(1)\np ada.posts.class\np ada.posts.where(title: \"Ok\").map(&:title)",
      options: ["Relation\n[\"Ok\"]", "Array\n[\"Ok\"]", "Relation\n[\"Hi\", \"Ok\"]"],
      answer: 0,
      output: "Relation\n[\"Ok\"]",
      check: { compiles: true, program: seeded("ada = Author.find(1)\np ada.posts.class\np ada.posts.where(title: \"Ok\").map(&:title)"), stdout: "Relation\n[\"Ok\"]" },
      explain: L("ada.posts is a lazy Relation, so you can keep chaining where on it before it loads.", "ada.posts es una Relation perezosa, así que puedes seguir encadenando where antes de cargarla.", "ada.posts は遅延 Relation。読み込む前に where をつなげられるよ。"),
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "ada" }],
      win: [{ t: "item", kind: "scroll", holder: "ally" }, { t: "print", text: "[\"Ok\"]" }],
    },
    say(L(
      "Since Rails 5, belongs_to is REQUIRED by default: a post with no author fails validation with \"Author must exist\".",
      "Desde Rails 5, belongs_to es OBLIGATORIO por defecto: un post sin autor falla la validación con \"Author must exist\".",
      "Rails 5 から belongs_to はデフォルトで必須。著者のない投稿は \"Author must exist\" で検証に落ちる。",
    )),
    {
      kind: "pick",
      hint: L("Since Rails 5, is belongs_to optional or required by default?", "Desde Rails 5, ¿belongs_to es opcional u obligatorio por defecto?", "Rails 5 から、belongs_to は標準で任意？必須？"),
      note: "belongs-to",
      prompt: L("Rails: save a Post with no author. Result?", "Rails: guardar un Post sin autor. ¿Resultado?", "Rails：著者なしの Post を保存すると？"),
      code: "post = Post.new(title: \"Lost\")\npost.save # => ___",
      options: [L("false: Author must exist", "false: Author must exist", "false：Author must exist"), L("true, author_id NULL", "true, author_id NULL", "true、author_id は NULL")],
      answer: 0,
      explain: L("Rails Guides: belongs_to adds a presence check unless you write optional: true.", "Guías de Rails: belongs_to agrega un chequeo de presencia salvo que escribas optional: true.", "Rails ガイド：optional: true を書かない限り、belongs_to は存在チェックを足すよ。"),
    },
    {
      kind: "pick",
      hint: L("The appointment carries its own data, a date. Which association goes through a full join model?", "La cita lleva datos propios, una fecha. ¿Qué asociación pasa por un modelo de unión completo?", "予約は日付という自分のデータを持つ。中間モデルを通る関連はどっち？"),
      note: "advanced-assoc",
      prompt: L("Doctors meet patients in dated appointments", "Doctores ven pacientes en citas con fecha", "医者と患者が日付つきの予約でつながる"),
      code: "class Doctor < ApplicationRecord\n  has_many :appointments\n  ___\nend",
      options: ["has_many :patients, through: :appointments", "has_and_belongs_to_many :patients"],
      answer: 0,
      explain: L("Rails Guides: use has_many :through when the join row has its own data, like a date.", "Guías de Rails: usa has_many :through cuando la fila de unión tiene datos propios, como una fecha.", "Rails ガイド：中間の行が日付などのデータを持つなら has_many :through を使う。"),
    },
    {
      kind: "type",
      hint: L("One belongs_to that can point to parents of different classes. Which option allows many kinds?", "Un belongs_to que puede apuntar a padres de clases distintas. ¿Qué opción permite muchos tipos?", "違うクラスの親を指せる belongs_to。いろんな種類を許すオプションは？"),
      note: "advanced-assoc",
      prompt: L("Comments on posts AND videos", "Comentarios en posts Y videos", "投稿にも動画にもコメント"),
      code: "class Comment < ApplicationRecord\n  belongs_to :commentable, ___: true\nend",
      answer: "polymorphic",
      explain: L("Rails Guides: a polymorphic belongs_to stores commentable_type and commentable_id.", "Guías de Rails: un belongs_to polymorphic guarda commentable_type y commentable_id.", "Rails ガイド：polymorphic な belongs_to は commentable_type と commentable_id を持つ。"),
    },
    {
      kind: "run",
      hint: L("The key is named after the owner, not the children. Which class owns the posts here?", "La llave se nombra por el dueño, no por los hijos. ¿Qué clase es dueña de los posts aquí?", "鍵は子ではなく持ち主の名前。ここで投稿の持ち主のクラスは？"),
      note: "has-many",
      prompt: L("Fix the foreign key: Author 1 must find [\"Hi\"]", "Arregla la llave foránea: Author 1 debe hallar [\"Hi\"]", "外部キーを直して [\"Hi\"] を見つけよう"),
      starter: 'POSTS = [{id: 1, title: "Hi", author_id: 1}, {id: 2, title: "Yo", author_id: 2}]\nclass Author\n  def self.has_many(name)\n    define_method(name) do\n      fk = :"#{name.to_s.chomp("s")}_id"\n      POSTS.select { |row| row[fk] == @id }.map { |row| row[:title] }\n    end\n  end\n  has_many :posts\n  def initialize(id) = @id = id\nend\np Author.new(1).posts\n',
      solution: 'POSTS = [{id: 1, title: "Hi", author_id: 1}, {id: 2, title: "Yo", author_id: 2}]\nclass Author\n  def self.has_many(name)\n    define_method(name) do\n      fk = :"#{self.class.name.downcase}_id"\n      POSTS.select { |row| row[fk] == @id }.map { |row| row[:title] }\n    end\n  end\n  has_many :posts\n  def initialize(id) = @id = id\nend\np Author.new(1).posts\n',
      expect: '["Hi"]',
      fallback: [String.raw`self\.class\.name\.downcase\s*\}_id`, String.raw`fk\s*=\s*:"?author_id`],
      explain: L("The key is named after the OWNER (Author → author_id), not the children (post_id).", "La llave se nombra por el DUEÑO (Author → author_id), no por los hijos (post_id).", "キーは持ち主の名前（Author → author_id）。子の名前（post_id）じゃないよ。"),
    },
  ],
};

// ─── 2.2 The query swarm: N+1 ──────────────────────────────────────────────
const nPlusOneNotes: NoteDef[] = [
  note("n-plus-one", L("What an N+1 query is", "Qué es una consulta N+1", "N+1 クエリとは"),
    p(
      "Every query is a round trip to the database, and round trips are slow compared to Ruby code. The N+1 problem appears when you load N records with one query, then loop over them and trigger one more query per record, usually by touching an association like pet.owner. That's 1 + N trips.",
      "Cada consulta es un viaje de ida y vuelta a la base de datos, y esos viajes son lentos comparados con el código Ruby. El problema N+1 aparece cuando cargas N registros con una consulta y luego, al recorrerlos, disparas una consulta más por registro, casi siempre al tocar una asociación como pet.owner. Son 1 + N viajes.",
      "クエリ1回は DB への1往復で、Ruby のコードに比べて往復は遅い。N+1 問題は、N 件を1回のクエリで読み、そのあとループで1件ごとにもう1回クエリを起こすときに出る。たいてい pet.owner のような関連に触ったときだ。合計 1 + N 往復。",
    ),
    ex(`def load_owner(id) = ($trips += 1; "owner #{id}")
pets = [{o: 1}, {o: 1}, {o: 2}, {o: 3}, {o: 3}]
$trips = 1
pets.each { |pet| load_owner(pet[:o]) }
puts $trips`, "6",
      L("1 trip for the pets + 1 per pet, repeats included", "1 viaje por las mascotas + 1 por mascota, con repetidos", "ペットで1回＋1匹ごとに1回（重複も数える）")),
    p(
      "The count grows with the number of records in the loop, not with the number of different parents. Lazy loading doesn't share: if five pets have the same owner, that owner is fetched five times. With 3 rows in development nobody notices; with 1000 rows in production the page makes 1001 queries.",
      "La cuenta crece con la cantidad de registros del bucle, no con la cantidad de padres distintos. La carga perezosa no comparte: si cinco mascotas tienen el mismo dueño, ese dueño se busca cinco veces. Con 3 filas en desarrollo nadie lo nota; con 1000 filas en producción la página hace 1001 consultas.",
      "回数はループのレコード数で増え、親の種類の数では増えない。遅延読み込みは共有しないので、5匹が同じ飼い主なら飼い主を5回取りに行く。開発の3行ではだれも気づかないが、本番の1000行ならページは1001回クエリを投げる。",
    ),
    p(
      "Spot it by asking: is there an association call inside a loop over records? order.customer or comment.user inside each or map are the classic suspects. In our mini version DB.queries counts every trip, so you can see it happen.",
      "Detéctalo preguntando: ¿hay una llamada a una asociación dentro de un bucle sobre registros? order.customer o comment.user dentro de each o map son los sospechosos clásicos. En nuestra mini versión DB.queries cuenta cada viaje, así puedes verlo pasar.",
      "見つけ方：レコードのループの中で関連を呼んでいないか？each や map の中の order.customer や comment.user が定番の容疑者。ミニ版では DB.queries が往復を数えるので、目で確かめられる。",
    ),
    exRec(`class Owner < Model; end
class Pet < Model
  attribute :owner_id
  belongs_to :owner
end
Owner.create({})
2.times { Pet.create(owner_id: 1) }
DB.queries = 0
Pet.all.each { it.owner }
puts DB.queries`, "3",
      L("Two pets with the same owner still cost 1 + 2", "Dos mascotas con el mismo dueño cuestan 1 + 2", "同じ飼い主の2匹でも 1 + 2 回")),
  ),
  note("preloading", L("Preloading: 2 trips, not N+1", "Precargar: 2 viajes, no N+1", "プリロード：N+1 ではなく2往復"),
    p(
      "The cure is to preload. Before the loop, collect every foreign key the records need, remove duplicates, and load all those parents in ONE query (WHERE id IN (...)). Then the loop reads the parents from memory. That's 2 trips in total, whether you have 3 records or 3000.",
      "La cura es precargar. Antes del bucle, junta todas las llaves foráneas que necesitan los registros, quita duplicados y carga todos esos padres en UNA consulta (WHERE id IN (...)). Luego el bucle lee los padres desde la memoria. Son 2 viajes en total, tengas 3 registros o 3000.",
      "治し方はプリロード。ループの前に必要な外部キーを全部集め、重複を除き、親を1回のクエリ（WHERE id IN (...)）でまとめて読む。ループはメモリから親を読むだけ。レコードが3件でも3000件でも合計2往復。",
    ),
    ex(`OWNERS = {1 => "Kim", 2 => "Lu"}
def load_owners(ids) = ($trips += 1; OWNERS.slice(*ids))
pets = [{o: 1}, {o: 2}, {o: 1}]
$trips = 1
owners = load_owners(pets.map { it[:o] }.uniq)
p pets.map { owners[it[:o]] }
puts $trips`, '["Kim", "Lu", "Kim"]\n2',
      L("One batch call before the loop; the loop reads a hash", "Una llamada en lote antes del bucle; el bucle lee un hash", "ループ前にまとめて1回、ループはハッシュを読む")),
    p(
      "In Rails you ask for this with includes. Our mini version does the same in two steps: it loads the posts, then calls where(id: ids) once and stores each author in the post's cache. Later, post.author finds the author in the cache and doesn't query.",
      "En Rails lo pides con includes. Nuestra mini versión hace lo mismo en dos pasos: carga los posts, luego llama una vez a where(id: ids) y guarda cada autor en la caché del post. Después, post.author encuentra el autor en la caché y no consulta.",
      "Rails では includes で頼む。ミニ版も2段階で同じことをする。投稿を読み、where(id: ids) を1回呼んで、著者を各投稿のキャッシュに入れる。あとで post.author はキャッシュで著者を見つけ、クエリを投げない。",
    ),
    p(
      "Common mistake: calling the batch loader inside the loop. That's just N+1 again with a different name; the whole point is one call before the loop. Also, uniq keeps the id list short, although the number of trips is the same.",
      "Error común: llamar al cargador en lote dentro del bucle. Eso es N+1 otra vez con otro nombre; la idea es una sola llamada antes del bucle. Además, uniq mantiene corta la lista de ids, aunque el número de viajes sea el mismo.",
      "よくあるミス：まとめ読みをループの中で呼ぶこと。名前が違うだけでまた N+1 だ。大事なのはループの前に1回呼ぶこと。また uniq は id のリストを短くする（往復の回数は同じ）。",
    ),
  ),
  note("rails-loading", L("preload, eager_load, includes, joins", "preload, eager_load, includes, joins", "3つのプリロードと joins"),
    p(
      "Rails has three ways to preload. preload always runs a separate query per association. eager_load always runs ONE query with a LEFT OUTER JOIN, loading both tables together. includes picks for you: separate queries normally, or a join when your conditions reference the associated table.",
      "Rails tiene tres formas de precargar. preload siempre hace una consulta separada por asociación. eager_load siempre hace UNA consulta con LEFT OUTER JOIN y carga ambas tablas juntas. includes elige por ti: consultas separadas normalmente, o un join cuando tus condiciones usan la tabla asociada.",
      "Rails のプリロードは3種類。preload は関連ごとにいつも別のクエリ。eager_load はいつも LEFT OUTER JOIN の1回で両方のテーブルを読む。includes は選んでくれる。ふつうは別クエリ、条件で関連テーブルを使うなら JOIN。",
    ),
    railsCode(`Order.preload(:customer)     # 2 queries
Order.eager_load(:customer)  # 1 query, LEFT OUTER JOIN
Order.joins(:customer)       # filters with JOIN, loads no customers`, READ_ONLY),
    p(
      "joins is different: it adds an SQL INNER JOIN so you can filter or sort by the other table, but it does NOT load the associated objects. Reading order.customer in a loop after joins still makes one query per order. Use joins to filter, and includes or eager_load to load.",
      "joins es distinto: agrega un INNER JOIN de SQL para filtrar u ordenar por la otra tabla, pero NO carga los objetos asociados. Leer order.customer en un bucle después de joins sigue haciendo una consulta por pedido. Usa joins para filtrar, e includes o eager_load para cargar.",
      "joins は別物。SQL の INNER JOIN を足して相手のテーブルで絞ったり並べたりできるが、関連オブジェクトは読まない。joins の後ループで order.customer を読むと、注文ごとにまたクエリが走る。絞るなら joins、読むなら includes か eager_load。",
    ),
    p(
      "You can only filter on another table's columns when that table is in the same query. So a where on the associated table needs a join that also loads: eager_load (or includes, which switches to a join). preload runs separate queries, so its main query can't see those columns.",
      "Solo puedes filtrar por columnas de otra tabla si esa tabla está en la misma consulta. Así que un where sobre la tabla asociada necesita un join que además cargue: eager_load (o includes, que cambia a join). preload hace consultas separadas, así que su consulta principal no ve esas columnas.",
      "別テーブルの列で絞れるのは、そのテーブルが同じクエリにあるときだけ。だから関連テーブルへの where には、読み込みもする JOIN が要る：eager_load（または JOIN に切り替わる includes）。preload は別クエリなので、メインのクエリからその列は見えない。",
    ),
  ),
  note("n1-tools", L("Counter caches and strict loading", "Counter caches y strict loading", "カウンタキャッシュと strict loading"),
    p(
      "Counting children is another N+1 trap: album.tracks.count inside a loop runs one COUNT per album. A counter cache stores the number in the parent row instead. Write belongs_to :album, counter_cache: true on Track and add an integer column tracks_count to albums; Rails updates it whenever a track is created or destroyed.",
      "Contar hijos es otra trampa N+1: album.tracks.count dentro de un bucle hace un COUNT por álbum. Un counter cache guarda el número en la fila del padre. Escribe belongs_to :album, counter_cache: true en Track y agrega una columna entera tracks_count a albums; Rails la actualiza cada vez que se crea o destruye un track.",
      "子を数えるのも N+1 の罠。ループの中の album.tracks.count はアルバムごとに COUNT を1回走らせる。カウンタキャッシュは数を親の行にしまっておく。Track に belongs_to :album, counter_cache: true と書き、albums に整数列 tracks_count を足すと、曲の作成・削除のたびに Rails が更新する。",
    ),
    ex(`album = {title: "Wave", tracks_count: 0}
3.times { album[:tracks_count] += 1 }
puts album[:tracks_count]`, "3",
      L("The parent keeps the number: reading it needs no COUNT", "El padre guarda el número: leerlo no necesita COUNT", "数は親が持つ。読むのに COUNT はいらない")),
    p(
      "Common mistake: putting the counter column on the child table. The count describes the parent, so it lives on the parent: albums.tracks_count, one number per album.",
      "Error común: poner la columna contador en la tabla hija. El conteo describe al padre, así que vive en el padre: albums.tracks_count, un número por álbum.",
      "よくあるミス：数の列を子のテーブルに置くこと。数は親のことなので親に置く：albums.tracks_count、アルバムごとに1つの数。",
    ),
    p(
      "To catch N+1 queries early, Rails offers strict loading. Records loaded with strict_loading raise ActiveRecord::StrictLoadingViolationError when code tries to lazy-load an association, so a missing includes fails loudly in tests instead of slowing down production. The Bullet gem is a popular alternative that warns during development.",
      "Para atrapar consultas N+1 temprano, Rails ofrece strict loading. Los registros cargados con strict_loading lanzan ActiveRecord::StrictLoadingViolationError cuando el código intenta cargar una asociación de forma perezosa, así un includes olvidado falla ruidosamente en los tests en vez de frenar producción. La gema Bullet es una alternativa popular que avisa en desarrollo.",
      "N+1 を早く見つけるために Rails には strict loading がある。strict_loading で読んだレコードは、関連を遅延読み込みしようとすると ActiveRecord::StrictLoadingViolationError を投げる。includes の付け忘れが本番を遅くする前にテストで派手に失敗する。開発中に警告する Bullet gem も人気。",
    ),
  ),
];

const nPlusOne: LessonDef = {
  slug: "n-plus-one",
  title: L("The query swarm", "El enjambre de consultas", "クエリの群れ"),
  concept: "n-plus-one",
  mode: "lesson",
  xp: 85,
  enemy: "rails/n-plus-one",
  enemyName: L("N+1 SWARM", "ENJAMBRE N+1", "N+1 の群れ"),
  notes: nPlusOneNotes,
  beats: [
    say(L(
      "Count your steps: each query is a trip to the database. This is the #1 Rails interview topic: the N+1 query.",
      "Cuenta tus pasos: cada consulta es un viaje a la base de datos. Es el tema #1 de entrevistas de Rails: la consulta N+1.",
      "歩数を数えよう。クエリ1回はDBへの1往復。Rails 面接の定番中の定番、N+1 クエリだ。",
    )),
    {
      kind: "act",
      prompt: L("Load 3 posts, then ask each for its author", "Carga 3 posts y pide el autor de cada uno", "投稿3つを読み、それぞれの著者を聞こう"),
      steps: [
        { label: L("LOAD POSTS", "CARGAR POSTS", "投稿を読む"), line: "posts = Post.all.to_a", effects: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "print", text: "SELECT * FROM posts" }, { t: "banner", text: q(1) }] },
        { label: L("AUTHOR 1", "AUTOR 1", "著者 1"), line: "posts[0].author.name", effects: [{ t: "attack", from: "enemy", to: "hero" }, { t: "print", text: "SELECT * FROM authors WHERE id = 1" }, { t: "banner", text: q(2) }] },
        { label: L("AUTHOR 2", "AUTOR 2", "著者 2"), line: "posts[1].author.name", effects: [{ t: "attack", from: "enemy", to: "hero" }, { t: "print", text: "SELECT * FROM authors WHERE id = 2" }, { t: "banner", text: q(3) }] },
        { label: L("AUTHOR 3", "AUTOR 3", "著者 3"), line: "posts[2].author.name", effects: [{ t: "attack", from: "enemy", to: "hero" }, { t: "print", text: "SELECT * FROM authors WHERE id = 1" }, { t: "banner", text: q(4) }, { t: "shake" }, { t: "say", actor: "hero", text: L("1 + 3 = 4 trips!", "¡1 + 3 = 4 viajes!", "1 + 3 = 4 往復！") }] },
      ],
    },
    say(L(
      "1 query for the N posts, plus 1 per post for its author: N+1. Let's count with tiny finders that tally every trip.",
      "1 consulta para los N posts, más 1 por post para su autor: N+1. Contemos con buscadores mini que anotan cada viaje.",
      "N 件の投稿に1回、さらに投稿ごとに著者を1回：N+1。往復を数えるミニ検索で確かめよう。",
    ), FINDERS),
    {
      kind: "predict",
      hint: L("1 query for the posts, then count one find_author call per post. Repeats count too.", "1 consulta por los posts, luego cuenta una llamada a find_author por post. Los repetidos cuentan.", "投稿で1回、それから投稿ごとの find_author を数えよう。重複も数える。"),
      note: "n-plus-one",
      prompt: QUERIES,
      code: "# (finders above)\nposts = [{a: 1}, {a: 2}, {a: 1}]\n$queries = 1 # loading the posts\nposts.each { |post| find_author(post[:a]) }\nputs $queries",
      options: ["4", "3", "2"],
      answer: 0,
      output: "4",
      check: { compiles: true, program: `${FINDERS}\nposts = [{a: 1}, {a: 2}, {a: 1}]\n$queries = 1\nposts.each { |post| find_author(post[:a]) }\nputs $queries`, stdout: "4" },
      explain: L("1 trip for the posts + 1 per post. Author 1 is fetched twice: lazy loads don't share.", "1 viaje por los posts + 1 por post. El autor 1 se busca dos veces: las cargas perezosas no se comparten.", "投稿で1回＋投稿ごとに1回。著者1は2回取りに行く。遅延読み込みは共有しない。"),
      setup: [{ t: "hp", actor: "enemy", value: 3 }],
      win: [{ t: "banner", text: q(4) }],
    },
    {
      kind: "predict",
      hint: L("Does the total depend on how many different authors there are, or on how many posts loop?", "¿El total depende de cuántos autores distintos hay, o de cuántos posts recorre el bucle?", "合計は著者の種類の数で決まる？ループする投稿の数で決まる？"),
      note: "n-plus-one",
      prompt: L("100 posts by 10 authors, lazy loop. Queries?", "100 posts de 10 autores, bucle perezoso. ¿Consultas?", "10人が書いた投稿100件、遅延ループ。クエリは？"),
      code: "# (finders above)\nposts = Array.new(100) { |i| {a: i % 10 + 1} }\n$queries = 1\nposts.each { |post| find_author(post[:a]) }\nputs $queries",
      options: ["101", "11", "100"],
      answer: 0,
      output: "101",
      check: { compiles: true, program: `${FINDERS}\nposts = Array.new(100) { |i| {a: i % 10 + 1} }\n$queries = 1\nposts.each { |post| find_author(post[:a]) }\nputs $queries`, stdout: "101" },
      explain: L("It grows with the posts, not the authors: 1 + 100. Fine in dev with 3 rows, a disaster in production.", "Crece con los posts, no con los autores: 1 + 100. Bien en dev con 3 filas, un desastre en producción.", "著者数でなく投稿数で増える：1 + 100。開発の3行では平気でも本番では大惨事。"),
      win: [{ t: "shake" }, { t: "banner", text: q(101) }],
    },
    say(L(
      "The cure is PRELOADING: collect every author id first, then fetch them all in ONE query. Two trips, no matter how many posts.",
      "La cura es PRECARGAR: junta primero todos los ids de autor y tráelos en UNA consulta. Dos viajes, sin importar cuántos posts.",
      "治し方はプリロード。先に著者 id を全部集めて1回で取る。投稿がいくつでも2往復。",
    )),
    {
      kind: "predict",
      hint: L("find_authors runs once for all ids. Does reading a hash inside the loop cost a trip?", "find_authors corre una vez para todos los ids. ¿Leer un hash dentro del bucle cuesta un viaje?", "find_authors は全 id で1回。ループの中でハッシュを読むと往復する？"),
      note: "preloading",
      prompt: QUERIES,
      code: "# (finders above)\nposts = [{a: 1}, {a: 2}, {a: 1}]\n$queries = 1\nauthors = find_authors(posts.map { it[:a] }.uniq)\nposts.each { |post| authors[post[:a]] }\nputs $queries",
      options: ["2", "4", "3"],
      answer: 0,
      output: "2",
      check: { compiles: true, program: `${FINDERS}\nposts = [{a: 1}, {a: 2}, {a: 1}]\n$queries = 1\nauthors = find_authors(posts.map { it[:a] }.uniq)\nposts.each { |post| authors[post[:a]] }\nputs $queries`, stdout: "2" },
      explain: L("One trip for the posts, one for all their authors. The loop reads a hash in memory: no trips.", "Un viaje por los posts, uno por todos sus autores. El bucle lee un hash en memoria: sin viajes.", "投稿で1回、著者全員で1回。ループはメモリのハッシュを読むだけで往復なし。"),
      win: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "banner", text: q(2) }],
    },
    {
      kind: "act",
      prompt: L("Cast includes on our mini model", "Lanza includes en nuestro modelo mini", "ミニモデルで includes を唱えよう"),
      steps: [
        { label: L("RESET", "REINICIAR", "リセット"), line: "DB.queries = 0", effects: [{ t: "hp", actor: "enemy", value: 3 }, { t: "banner", text: q(0) }] },
        { label: L("INCLUDES", "INCLUDES", "includes"), line: "posts = Post.includes(:author).to_a", effects: [{ t: "print", text: "SELECT * FROM posts" }, { t: "item", kind: "scroll", holder: "hero" }, { t: "print", text: "SELECT * FROM authors WHERE id IN (1, 2)" }, { t: "banner", text: q(2) }] },
        { label: L("READ AUTHORS", "LEER AUTORES", "著者を読む"), line: "posts.each { it.author.name }", effects: [{ t: "attack", from: "hero", to: "enemy", dmg: 3 }, { t: "say", actor: "hero", text: L("Already loaded!", "¡Ya cargados!", "もう読んである！") }] },
        { label: L("COUNT", "CONTAR", "数える"), line: "puts DB.queries", effects: [{ t: "print", text: "2" }, { t: "banner", text: q(2) }], output: "2" },
      ],
    },
    say(L(
      "Now for real, on our mini Active Record. Same family as before: 2 authors, 3 posts. DB.queries counts every trip.",
      "Ahora de verdad, en nuestro Active Record mini. La misma familia: 2 autores, 3 posts. DB.queries cuenta cada viaje.",
      "今度はミニ Active Record で本番。さっきの家族：著者2人、投稿3つ。DB.queries が往復を数える。",
    ), SEED),
    {
      kind: "predict",
      hint: L("Post.all is one query. Without includes, does each post.author reuse anything?", "Post.all es una consulta. Sin includes, ¿cada post.author reutiliza algo?", "Post.all で1回。includes なしで post.author は何かを使い回す？"),
      note: "n-plus-one",
      prompt: QUERIES,
      code: "DB.queries = 0\nPost.all.each { it.author.name }\nputs DB.queries",
      options: ["4", "2", "3"],
      answer: 0,
      output: "4",
      check: { compiles: true, program: seeded("DB.queries = 0\nPost.all.each { it.author.name }\nputs DB.queries"), stdout: "4" },
      explain: L("Post.all is 1 query, and each post.author is a lazy find: 1 + 3 = 4.", "Post.all es 1 consulta, y cada post.author es un find perezoso: 1 + 3 = 4.", "Post.all で1回、post.author は毎回遅延 find：1 + 3 = 4。"),
      setup: [{ t: "hp", actor: "enemy", value: 3 }],
      win: [{ t: "attack", from: "enemy", to: "hero" }, { t: "banner", text: q(4) }],
    },
    {
      kind: "predict",
      hint: L("includes loads the posts, then the needed authors in one batch. Does the loop query again?", "includes carga los posts y luego los autores necesarios en un lote. ¿El bucle vuelve a consultar?", "includes は投稿を読み、必要な著者をまとめて1回。ループでまたクエリする？"),
      note: "preloading",
      prompt: QUERIES,
      code: "DB.queries = 0\nPost.includes(:author).each { it.author.name }\nputs DB.queries",
      options: ["2", "4", "1"],
      answer: 0,
      output: "2",
      check: { compiles: true, program: seeded("DB.queries = 0\nPost.includes(:author).each { it.author.name }\nputs DB.queries"), stdout: "2" },
      explain: L("includes loads the posts, then every author they need in one where(id: [1, 2]). The loop hits the cache.", "includes carga los posts y luego todos sus autores en un where(id: [1, 2]). El bucle usa la caché.", "includes は投稿を読み、必要な著者を where(id: [1, 2]) の1回で取る。ループはキャッシュを読む。"),
      win: [{ t: "attack", from: "hero", to: "enemy", dmg: 3 }, { t: "banner", text: q(2) }],
    },
    say(L(
      "Real Rails has three spells: preload (separate queries), eager_load (one LEFT OUTER JOIN), and includes, which picks one for you.",
      "Rails real tiene tres hechizos: preload (consultas separadas), eager_load (un LEFT OUTER JOIN) e includes, que elige por ti.",
      "本物の Rails には3つ：preload（別々のクエリ）、eager_load（LEFT OUTER JOIN 1回）、選んでくれる includes。",
    )),
    {
      kind: "pick",
      hint: L("Recall the three spells: separate queries, a single JOIN, or choose-for-me. joins only filters.", "Recuerda los tres hechizos: consultas separadas, un solo JOIN o elegir por ti. joins solo filtra.", "3つの呪文を思い出そう：別クエリ、JOIN 1回、おまかせ。joins は絞るだけ。"),
      note: "rails-loading",
      prompt: L("Rails: always ONE LEFT OUTER JOIN query", "Rails: siempre UNA consulta LEFT OUTER JOIN", "Rails：必ず LEFT OUTER JOIN 1回"),
      code: "Post.___(:author).to_a",
      options: ["eager_load", "preload", "joins"],
      answer: 0,
      explain: L("Rails Guides: eager_load always joins; preload always runs a separate query per association.", "Guías de Rails: eager_load siempre hace JOIN; preload siempre una consulta separada por asociación.", "Rails ガイド：eager_load は常に JOIN、preload は関連ごとに別クエリ。"),
    },
    {
      kind: "pick",
      hint: L("Does joins load the author objects, or only use their table inside the SQL?", "¿joins carga los objetos autor, o solo usa su tabla dentro del SQL?", "joins は著者オブジェクトを読む？それとも SQL の中でテーブルを使うだけ？"),
      note: "rails-loading",
      prompt: L("Rails: is this loop still N+1?", "Rails: ¿este bucle sigue siendo N+1?", "Rails：このループはまだ N+1？"),
      code: "Post.joins(:author).each do |post|\n  post.author.name\nend\n# ___",
      options: [L("Yes: joins doesn't load authors", "Sí: joins no carga autores", "はい：joins は著者を読まない"), L("No: one query", "No: una consulta", "いいえ：1回だけ")],
      answer: 0,
      explain: L("Rails Guides: joins only filters with SQL JOIN; post.author still loads lazily, one query per post.", "Guías de Rails: joins solo filtra con un JOIN; post.author sigue cargando perezoso, una consulta por post.", "Rails ガイド：joins は JOIN で絞るだけ。post.author は投稿ごとに遅延読み込みのまま。"),
    },
    {
      kind: "pick",
      hint: L("You want the number stored on the parent row and updated automatically. Which option caches a count?", "Quieres el número guardado en la fila del padre y actualizado solo. ¿Qué opción guarda un conteo?", "数を親の行に置き、自動で更新したい。数をキャッシュするオプションは？"),
      note: "n1-tools",
      prompt: L("Rails: post.comments.size with no query", "Rails: post.comments.size sin consulta", "Rails：クエリなしで comments.size"),
      code: "class Comment < ApplicationRecord\n  belongs_to :post, ___\nend",
      options: ["counter_cache: true", "index: true"],
      answer: 0,
      explain: L("Rails Guides: counter_cache keeps a comments_count column on posts, updated on create and destroy.", "Guías de Rails: counter_cache mantiene una columna comments_count en posts, al crear y destruir.", "Rails ガイド：counter_cache は posts の comments_count 列を作成・削除で更新する。"),
    },
    {
      kind: "pick",
      hint: L("Which mode makes a lazy load fail loudly instead of quietly running a query?", "¿Qué modo hace que una carga perezosa falle con ruido en vez de consultar en silencio?", "遅延読み込みで黙ってクエリせず、派手に失敗させるモードは？"),
      note: "n1-tools",
      prompt: L("Rails: make lazy loading raise an error", "Rails: hacer que la carga perezosa lance error", "Rails：遅延読み込みでエラーにしたい"),
      code: "posts = Post.___.to_a\nposts.first.author # raises",
      options: ["strict_loading", "readonly"],
      answer: 0,
      explain: L("Rails Guides: strict_loading raises StrictLoadingViolationError on a lazy load. The Bullet gem warns in dev.", "Guías de Rails: strict_loading lanza StrictLoadingViolationError al cargar perezoso. La gema Bullet avisa en dev.", "Rails ガイド：strict_loading は遅延読み込みで例外。Bullet gem は開発中に警告する。"),
    },
    {
      kind: "run",
      hint: L("Collect all author ids first and fetch them in one batch call before mapping the posts.", "Junta primero todos los ids de autor y tráelos en una sola llamada en lote antes de recorrer.", "先に著者 id を全部集め、投稿を map する前にまとめて1回で取ろう。"),
      note: "preloading",
      prompt: L("Preload the authors: it must say \"in 2 queries\"", "Precarga los autores: debe decir \"in 2 queries\"", "著者をプリロードして \"in 2 queries\" に"),
      starter: `${FINDERS}\nposts = Array.new(10) { |i| {title: "P#{i}", a: i % 2 + 1} }\n$queries = 1\nnames = posts.map { |post| find_author(post[:a]) }\nputs "#{names.uniq.sort.join(",")} in #{$queries} queries"\n`,
      solution: `${FINDERS}\nposts = Array.new(10) { |i| {title: "P#{i}", a: i % 2 + 1} }\n$queries = 1\nauthors = find_authors(posts.map { |post| post[:a] }.uniq)\nnames = posts.map { |post| authors[post[:a]] }\nputs "#{names.uniq.sort.join(",")} in #{$queries} queries"\n`,
      expect: "Ada,Bo in 2 queries",
      fallback: [String.raw`=\s*find_authors\(`],
      explain: L("Call find_authors once with the unique ids, then read each name from the hash it returns.", "Llama a find_authors una vez con los ids únicos y luego lee cada nombre del hash que devuelve.", "一意の id で find_authors を1回呼び、返ったハッシュから名前を読もう。"),
    },
  ],
};

// ─── 2.3 Gatekeepers: validations ──────────────────────────────────────────
const VALID_POST = `class Post
  attr_reader :errors
  def initialize(title) = (@title = title; @errors = Hash.new { |h, k| h[k] = [] })
  def valid?
    errors.clear
    errors[:title] << "can't be blank" if @title.to_s.strip.empty?
    errors.empty?
  end
  def save = valid? ? (puts "INSERT"; true) : false
end`;

const validationsNotes: NoteDef[] = [
  note("valid-errors", L("valid?, errors and save", "valid?, errors y save", "valid?・errors・save"),
    p(
      "Validations are rules a record must pass before it's saved. valid? runs every rule and returns true or false. Each failing rule adds a message to errors, a hash from field name to a list of messages. save calls valid? first and, if it's false, returns false without writing anything.",
      "Las validaciones son reglas que un registro debe pasar antes de guardarse. valid? corre todas las reglas y devuelve true o false. Cada regla que falla agrega un mensaje a errors, un hash de nombre de campo a lista de mensajes. save llama primero a valid? y, si da false, devuelve false sin escribir nada.",
      "検証は、保存の前にレコードが通るべきルール。valid? は全ルールを調べて true か false を返す。落ちたルールは errors（項目名 => メッセージのリスト のハッシュ）にメッセージを足す。save はまず valid? を呼び、false なら何も書かずに false を返す。",
    ),
    ex(`class Signup
  attr_reader :errors
  def initialize(email) = (@email = email; @errors = Hash.new { |h, k| h[k] = [] })
  def valid?
    errors.clear
    errors[:email] << "is invalid" unless @email.include?("@")
    errors.empty?
  end
end
s = Signup.new("bob")
p s.valid?, s.errors`, 'false\n{email: ["is invalid"]}',
      L("A failing rule leaves a message under its field", "Una regla que falla deja un mensaje bajo su campo", "落ちたルールは項目の下にメッセージを残す")),
    p(
      "Two details matter. First, errors.clear at the start of valid?: without it, messages from an earlier check stay around, and a fixed record still looks invalid. Second, \"blank\" means nil, empty or only spaces, which is why presence checks strip the text before testing it.",
      "Dos detalles importan. Primero, errors.clear al inicio de valid?: sin él, los mensajes de un chequeo anterior se quedan y un registro ya arreglado sigue pareciendo inválido. Segundo, \"blank\" significa nil, vacío o solo espacios; por eso los chequeos de presencia hacen strip del texto antes de probarlo.",
      "大事な点が2つ。1つ目は valid? の最初の errors.clear。これが無いと前のチェックのメッセージが残り、直したレコードもまだ無効に見える。2つ目は「blank（空）」は nil・空文字・空白だけ を指すこと。だから存在チェックは調べる前に strip する。",
    ),
    p(
      "Rails builds full messages by joining the field's name, capitalized, and the message: the field email with \"is invalid\" becomes \"Email is invalid\". That's what errors.full_messages returns, ready to show in a form.",
      "Rails arma los mensajes completos uniendo el nombre del campo, con mayúscula, y el mensaje: el campo email con \"is invalid\" pasa a \"Email is invalid\". Eso devuelve errors.full_messages, listo para mostrar en un formulario.",
      "Rails は項目名を大文字で始めてメッセージとつなぎ、完全なメッセージを作る。email と \"is invalid\" なら \"Email is invalid\"。errors.full_messages が返すのがこれで、フォームにそのまま出せる。",
    ),
    ex(`errs = {email: ["is invalid"], age: ["must be positive"]}
p errs.flat_map { |field, msgs| msgs.map { "#{field.capitalize} #{it}" } }`, '["Email is invalid", "Age must be positive"]',
      L("Field name, capitalized, plus each message", "Nombre del campo con mayúscula, más cada mensaje", "大文字にした項目名＋各メッセージ")),
    p(
      "A failed save leaves the object unsaved: it has no id and persisted? stays false. Fix the data and call save again; this time valid? passes and the row is inserted. Common mistake: forgetting that p prints the return value AFTER anything the method itself printed.",
      "Un save fallido deja el objeto sin guardar: no tiene id y persisted? sigue en false. Arregla los datos y llama save otra vez; ahora valid? pasa y se inserta la fila. Error común: olvidar que p imprime el valor devuelto DESPUÉS de lo que el propio método haya impreso.",
      "失敗した save の後、オブジェクトは保存されていない。id は無く persisted? は false のまま。データを直してもう一度 save すれば、今度は valid? が通り行が挿入される。よくあるミス：p が戻り値を表示するのは、メソッド自身が表示した「後」だと忘れること。",
    ),
  ),
  note("save-bang", L("save versus save!", "save frente a save!", "save と save!"),
    p(
      "save and save! run the same validations; they differ in how they report failure. save returns true or false, so you check the result, which suits forms: on false, show the errors and let the user try again. save! returns true or RAISES an exception, which stops the code unless something rescues it.",
      "save y save! corren las mismas validaciones; cambian en cómo avisan el fallo. save devuelve true o false, así que revisas el resultado, ideal para formularios: si es false, muestras los errores y el usuario reintenta. save! devuelve true o LANZA una excepción, que detiene el código salvo que algo la rescate.",
      "save と save! の検証は同じで、失敗の伝え方が違う。save は true か false を返すので結果を確かめる。フォーム向きで、false ならエラーを見せて再入力してもらう。save! は true を返すか例外を投げ、だれかが rescue しない限りコードが止まる。",
    ),
    crash(`class Invalid < StandardError; end
def store!(name) = name.empty? ? raise(Invalid, "Name can't be blank") : true
p store!("Kai")
store!("")`, "Name can't be blank",
      L("The bang version turns failure into an exception", "La versión con ! convierte el fallo en excepción", "! 版は失敗を例外に変える")),
    p(
      "The ! is a Ruby naming habit meaning \"careful, this version is more dangerous\". Use save!, create! and update! when failure means a bug, like in seeds, scripts or background jobs: you want a loud error, not a false that nobody checks. In Rails the exception is ActiveRecord::RecordInvalid, and its message lists the full errors.",
      "El ! es una costumbre de Ruby que significa \"cuidado, esta versión es más peligrosa\". Usa save!, create! y update! cuando fallar es un bug, como en seeds, scripts o jobs: quieres un error ruidoso, no un false que nadie revisa. En Rails la excepción es ActiveRecord::RecordInvalid, y su mensaje lista los errores completos.",
      "! は Ruby の名前の習慣で「注意、こちらは危ない版」という意味。失敗がバグを意味するとき（シード、スクリプト、バックグラウンドジョブ）は save!・create!・update! を使う。だれも見ない false より派手なエラーがいい。Rails の例外は ActiveRecord::RecordInvalid で、メッセージに完全なエラーが並ぶ。",
    ),
    p(
      "Common mistake: calling save and ignoring its result. If nobody looks at the false, invalid data simply isn't saved and nobody finds out why.",
      "Error común: llamar save e ignorar su resultado. Si nadie mira el false, los datos inválidos simplemente no se guardan y nadie sabe por qué.",
      "よくあるミス：save を呼んで結果を無視すること。false をだれも見なければ、無効なデータは黙って保存されず、理由もわからない。",
    ),
  ),
  note("rails-validations", L("Validations in real Rails", "Validaciones en Rails real", "本物の Rails の検証"),
    p(
      "In Rails, validations are declared in the model with validates: the field, then options naming the rules. presence: true adds \"can't be blank\" when the value is nil or blank. Others include length: { maximum: 50 }, numericality: true, format: { with: ... } and uniqueness: true.",
      "En Rails, las validaciones se declaran en el modelo con validates: el campo y luego opciones que nombran las reglas. presence: true agrega \"can't be blank\" cuando el valor es nil o vacío. Otras son length: { maximum: 50 }, numericality: true, format: { with: ... } y uniqueness: true.",
      "Rails ではモデルで validates を使って検証を宣言する。項目のあとにルール名のオプションを書く。presence: true は値が nil や空のとき \"can't be blank\" を足す。ほかに length: { maximum: 50 }、numericality: true、format: { with: ... }、uniqueness: true など。",
    ),
    railsCode(`class Product < ApplicationRecord
  validates :sku, uniqueness: true
  validates :price, numericality: { greater_than: 0 }
end`, READ_ONLY),
    p(
      "Not every write runs validations. save, create and update do. But some methods write straight to the database and skip them, along with callbacks: update_column, update_columns, update_all and insert_all. They're fast and handy for internal fixes, but they can store data your rules would reject.",
      "No toda escritura corre las validaciones. save, create y update sí. Pero algunos métodos escriben directo en la base y se las saltan, junto con los callbacks: update_column, update_columns, update_all e insert_all. Son rápidos y útiles para arreglos internos, pero pueden guardar datos que tus reglas rechazarían.",
      "すべての書き込みが検証を通るわけではない。save・create・update は通る。でも update_column・update_columns・update_all・insert_all は DB に直接書き、検証もコールバックも飛ばす。速くて内部の修正に便利だが、ルールが拒むデータも保存できてしまう。",
    ),
    p(
      "uniqueness: true checks with a SELECT before inserting, and that leaves a gap: two requests at the same instant can both see \"no duplicate\" and both insert. Only the database can close that race, with a unique index. Keep the validation for friendly messages and the index as the real guard.",
      "uniqueness: true revisa con un SELECT antes de insertar, y eso deja un hueco: dos peticiones en el mismo instante pueden ver ambas \"sin duplicado\" e insertar las dos. Solo la base de datos puede cerrar esa carrera, con un índice único. Deja la validación para mensajes amables y el índice como guardia real.",
      "uniqueness: true は挿入の前に SELECT で確かめるので、すき間がある。同時に来た2つの要求が両方「重複なし」と見て、両方とも挿入できてしまう。この競争を止められるのは DB のユニークインデックスだけ。検証はやさしいメッセージ用、インデックスが本当の門番。",
    ),
    ex(`taken = []
a_ok = !taken.include?("x@y.z")
b_ok = !taken.include?("x@y.z")
taken << "x@y.z" if a_ok
taken << "x@y.z" if b_ok
p taken`, '["x@y.z", "x@y.z"]',
      L("Both checks ran before either insert: a duplicate slips in", "Ambos chequeos antes de insertar: se cuela un duplicado", "両方のチェックが挿入前に通り、重複が入る")),
  ),
];

const validations: LessonDef = {
  slug: "validations",
  title: L("Gatekeepers", "Guardianes", "門番"),
  concept: "validations",
  mode: "lesson",
  xp: 75,
  enemy: "rails/mass-burglar",
  enemyName: L("BLANK BANDIT", "BANDIDO VACÍO", "からっぽ盗賊"),
  notes: validationsNotes,
  beats: [
    say(L(
      "Bad data sneaks in through the gate. VALIDATIONS are guards: valid? runs the rules, fills errors, and save refuses to write.",
      "Los datos malos se cuelan por la puerta. Las VALIDACIONES son guardias: valid? corre las reglas, llena errors y save no escribe.",
      "悪いデータが門から忍びこむ。検証は門番。valid? がルールを調べて errors を埋め、save は書かない。",
    )),
    {
      kind: "act",
      prompt: L("Send two posts to the gate", "Manda dos posts a la puerta", "投稿を2つ門へ送ろう"),
      steps: [
        { label: L("GUARD", "GUARDIA", "門番"), line: "def save = valid? ? (puts \"INSERT\"; true) : false", effects: [{ t: "enter", actor: "ally" }, { t: "item", kind: "shield", holder: "ally" }, { t: "tag", actor: "ally", text: "valid?" }] },
        { label: L("BLANK POST", "POST VACÍO", "空の投稿"), line: "Post.new(\"  \").save", effects: [{ t: "tag", actor: "hero", text: "Post", value: "\"  \"" }, { t: "shake" }, { t: "say", actor: "ally", text: L("can't be blank", "can't be blank", "can't be blank") }] },
        { label: L("GOOD POST", "POST BUENO", "良い投稿"), line: "Post.new(\"Hi\").save", effects: [{ t: "value", actor: "hero", text: "\"Hi\"" }, { t: "say", actor: "ally", text: L("Pass!", "¡Pasa!", "通ってよし！") }, { t: "print", text: "INSERT" }], output: "INSERT" },
      ],
    },
    say(L(
      "Here is our mini guard. errors is a hash of field => messages, cleared every time valid? runs.",
      "Este es nuestro guardia mini. errors es un hash de campo => mensajes, que se limpia cada vez que corre valid?.",
      "これがミニ門番。errors は 項目 => メッセージ のハッシュで、valid? のたびに空にする。",
    ), VALID_POST),
    {
      kind: "predict",
      hint: L("What does strip do to a title of only spaces? Then follow save: does it ever reach INSERT?", "¿Qué le hace strip a un título de solo espacios? Sigue save: ¿llega alguna vez al INSERT?", "空白だけのタイトルに strip すると？save を追おう。INSERT まで行く？"),
      note: "valid-errors",
      prompt: PRINT,
      code: "# (Post above)\npost = Post.new(\"  \")\np post.save\np post.errors",
      options: ["false\n{title: [\"can't be blank\"]}", "INSERT\ntrue\n{}", "false\n{}"],
      answer: 0,
      output: "false\n{title: [\"can't be blank\"]}",
      check: { compiles: true, program: `${VALID_POST}\npost = Post.new("  ")\np post.save\np post.errors`, stdout: "false\n{title: [\"can't be blank\"]}" },
      explain: L("strip turns \"  \" into \"\", so the rule adds a message and save returns false without INSERT.", "strip convierte \"  \" en \"\", así que la regla agrega un mensaje y save devuelve false sin INSERT.", "strip で \"  \" は \"\" に。ルールがメッセージを足し、save は INSERT せず false。"),
      setup: [{ t: "enter", actor: "ally" }, { t: "item", kind: "shield", holder: "ally" }],
      win: [{ t: "shake" }, { t: "print", text: "false" }],
    },
    {
      kind: "predict",
      hint: L("This title is fine. Remember save prints with puts, and then p prints what save returns.", "Este título está bien. Recuerda: save imprime con puts y luego p imprime lo que devuelve save.", "このタイトルは大丈夫。save が puts で表示し、次に p が戻り値を表示する。"),
      note: "valid-errors",
      prompt: PRINT,
      code: "# (Post above)\np Post.new(\"Hi\").save",
      options: ["INSERT\ntrue", "true", "INSERT"],
      answer: 0,
      output: "INSERT\ntrue",
      check: { compiles: true, program: `${VALID_POST}\np Post.new("Hi").save`, stdout: "INSERT\ntrue" },
      explain: L("Valid: save prints INSERT first, then p prints the returned true.", "Válido: save imprime INSERT primero, luego p imprime el true devuelto.", "有効なので save がまず INSERT を表示し、次に p が戻り値 true を表示。"),
      win: [{ t: "print", text: "INSERT" }, { t: "print", text: "true" }],
    },
    {
      kind: "predict",
      hint: L("Each message is prefixed by its field name, after capitalize.", "Cada mensaje lleva delante el nombre de su campo, tras capitalize.", "各メッセージの前に、capitalize した項目名がつく。"),
      note: "valid-errors",
      prompt: L("Build the full messages. What prints?", "Arma los mensajes completos. ¿Qué imprime?", "完全なメッセージを作ると？"),
      code: "# (Post above)\npost = Post.new(\"\")\npost.valid?\np post.errors.flat_map { |f, ms| ms.map { \"#{f.capitalize} #{it}\" } }",
      options: ["[\"Title can't be blank\"]", "[\"title can't be blank\"]", "[\"can't be blank\"]"],
      answer: 0,
      output: "[\"Title can't be blank\"]",
      check: { compiles: true, program: `${VALID_POST}\npost = Post.new("")\npost.valid?\np post.errors.flat_map { |f, ms| ms.map { "#{f.capitalize} #{it}" } }`, stdout: "[\"Title can't be blank\"]" },
      explain: L("Field name capitalized + message: the same shape as Rails' full_messages.", "Nombre del campo con mayúscula + mensaje: la misma forma que full_messages de Rails.", "項目名を大文字にしてメッセージをつなぐ。Rails の full_messages と同じ形。"),
    },
    say(L(
      "Two flavors: save returns false, save! RAISES. Use the bang when failure is a bug, not a form to show again.",
      "Dos sabores: save devuelve false, save! LANZA un error. Usa el bang cuando fallar es un bug, no un formulario a repetir.",
      "2種類ある。save は false を返し、save! は例外を投げる。失敗がバグなら ! を使おう。",
    )),
    {
      kind: "predict",
      hint: L("save answers; save! raises. What happens on the line with the bang?", "save responde; save! lanza. ¿Qué pasa en la línea con el !?", "save は答える、save! は投げる。! のついた行で何が起きる？"),
      note: "save-bang",
      prompt: HAPPENS,
      code: "class RecordInvalid < StandardError; end\nclass Post\n  def initialize(title) = @title = title\n  def save = !@title.to_s.empty?\n  def save! = save || raise(RecordInvalid, \"Validation failed: Title can't be blank\")\nend\np Post.new(\"\").save\nPost.new(\"\").save!",
      options: [L("false, then RecordInvalid is raised", "false, luego se lanza RecordInvalid", "false の後 RecordInvalid が発生"), L("false\nfalse", "false\nfalse", "false\nfalse")],
      answer: 0,
      check: { compiles: true, throws: "Validation failed: Title can't be blank (RecordInvalid)" },
      explain: L("save just answers false; save! turns that false into an exception that stops the program.", "save solo responde false; save! convierte ese false en una excepción que detiene el programa.", "save は false を返すだけ。save! はその false を例外に変えてプログラムを止める。"),
      win: [{ t: "print", text: "false" }, { t: "shake" }],
    },
    say(L(
      "Our mini Model has validates_presence_of. Watch persisted?: it stays false until a save really writes the row.",
      "Nuestro Model mini tiene validates_presence_of. Mira persisted?: sigue en false hasta que un save escribe la fila de verdad.",
      "ミニ Model には validates_presence_of がある。persisted? は本当に保存されるまで false のまま。",
    )),
    {
      kind: "predict",
      hint: L("A blank title fails, so no row and no id. What changes once the title is fixed?", "Un título vacío falla: sin fila y sin id. ¿Qué cambia cuando se arregla el título?", "空のタイトルは失敗し、行も id も無い。タイトルを直したら何が変わる？"),
      note: "valid-errors",
      prompt: PRINT,
      code: "class Post < Model\n  attribute :title\n  validates_presence_of :title\nend\npost = Post.new(title: \"\")\np post.save, post.persisted?\npost.title = \"Hello\"\np post.save, post.id",
      options: ["false\nfalse\ntrue\n1", "false\ntrue\ntrue\n1", "false\nfalse\ntrue\nnil"],
      answer: 0,
      output: "false\nfalse\ntrue\n1",
      check: { compiles: true, program: withHelper(MINI_RECORD, "class Post < Model\n  attribute :title\n  validates_presence_of :title\nend\npost = Post.new(title: \"\")\np post.save, post.persisted?\npost.title = \"Hello\"\np post.save, post.id"), stdout: "false\nfalse\ntrue\n1" },
      explain: L("The blank save writes nothing (no id). After fixing the title, save inserts row 1.", "El save vacío no escribe nada (sin id). Al arreglar el título, save inserta la fila 1.", "空の save は何も書かない（id なし）。タイトルを直すと save が行 1 を挿入。"),
      win: [{ t: "say", actor: "ally", text: L("Row 1 saved!", "¡Fila 1 guardada!", "行1を保存！") }],
    },
    {
      kind: "type",
      hint: L("Which validation option means \"must not be blank\"?", "¿Qué opción de validación significa \"no debe estar vacío\"?", "「空ではいけない」を意味する検証オプションは？"),
      note: "rails-validations",
      prompt: L("Rails: require a title", "Rails: exigir un título", "Rails：タイトルを必須に"),
      code: "class Post < ApplicationRecord\n  validates :title, ___: true\nend",
      answer: "presence",
      explain: L("Rails Guides: validates :title, presence: true adds the \"can't be blank\" error.", "Guías de Rails: validates :title, presence: true agrega el error \"can't be blank\".", "Rails ガイド：validates :title, presence: true で \"can't be blank\" エラーが付く。"),
    },
    {
      kind: "pick",
      hint: L("Which method writes one column straight to the database, without a normal save?", "¿Qué método escribe una columna directo en la base, sin un save normal?", "ふつうの save をせず、1列を DB に直接書くメソッドは？"),
      note: "rails-validations",
      prompt: L("Rails: which call SKIPS validations?", "Rails: ¿qué llamada SALTA las validaciones?", "Rails：検証をスキップするのは？"),
      code: "# post has validates :title, presence: true\n___",
      options: ["post.update_column(:title, \"\")", "post.update(title: \"\")"],
      answer: 0,
      explain: L("Rails Guides: update_column writes straight to the database, skipping validations and callbacks.", "Guías de Rails: update_column escribe directo en la base, saltando validaciones y callbacks.", "Rails ガイド：update_column は DB に直接書き、検証もコールバックも飛ばす。"),
    },
    {
      kind: "pick",
      hint: L("Two checks can both pass before either insert. What can the database itself enforce?", "Dos chequeos pueden pasar antes de insertar. ¿Qué puede imponer la propia base de datos?", "挿入前に2つのチェックが両方通りうる。DB 自身が守らせられるものは？"),
      note: "rails-validations",
      prompt: L("Rails: uniqueness and two requests at once", "Rails: uniqueness y dos peticiones a la vez", "Rails：uniqueness に同時に2リクエスト"),
      code: "validates :email, uniqueness: true\n# two signups, same email, same instant\n# fix: ___",
      options: [L("also add a unique index", "agregar también un índice único", "ユニークインデックスも足す"), L("nothing: Rails locks it", "nada: Rails lo bloquea", "何もしない：Rails がロック")],
      answer: 0,
      explain: L("Rails Guides: both checks can pass before either insert. Only a unique index in the database stops the duplicate.", "Guías de Rails: ambos chequeos pueden pasar antes de insertar. Solo un índice único en la base frena el duplicado.", "Rails ガイド：両方のチェックが挿入前に通りうる。重複を止めるのは DB のユニーク索引だけ。"),
    },
    {
      kind: "run",
      hint: L("Old messages from the first valid? are still in errors. Empty it at the start of each check.", "Los mensajes viejos del primer valid? siguen en errors. Vacíalo al inicio de cada chequeo.", "最初の valid? のメッセージが errors に残っている。毎回のチェックの最初で空にしよう。"),
      note: "valid-errors",
      prompt: L("Fixed title, still rejected? Make it print \"saved\"", "¿Título arreglado y aún rechazado? Que imprima \"saved\"", "直したのに却下？\"saved\" と表示させて"),
      starter: 'class Post\n  attr_accessor :title\n  attr_reader :errors\n  def initialize(title) = (@title = title; @errors = [])\n  def valid?\n    errors << "Title can\'t be blank" if title.to_s.empty?\n    errors.empty?\n  end\nend\npost = Post.new("")\npost.valid?\npost.title = "Fixed"\nputs post.valid? ? "saved" : "rejected: #{post.errors.join}"\n',
      solution: 'class Post\n  attr_accessor :title\n  attr_reader :errors\n  def initialize(title) = (@title = title; @errors = [])\n  def valid?\n    errors.clear\n    errors << "Title can\'t be blank" if title.to_s.empty?\n    errors.empty?\n  end\nend\npost = Post.new("")\npost.valid?\npost.title = "Fixed"\nputs post.valid? ? "saved" : "rejected: #{post.errors.join}"\n',
      expect: "saved",
      fallback: [String.raw`errors\.clear`, String.raw`errors\.replace\(\s*\[\s*\]\s*\)`],
      explain: L("Old errors stuck around. Clear errors at the start of valid?, just like our mini Model does.", "Los errores viejos seguían ahí. Limpia errors al inicio de valid?, como hace nuestro Model mini.", "古いエラーが残っていた。ミニ Model と同じく valid? の最初で errors を空にしよう。"),
    },
  ],
};

// ─── 2.4 Rituals before the vault: callbacks and concerns ──────────────────
const RITUAL = `class Post
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
end`;

const callbacksNotes: NoteDef[] = [
  note("callback-chain", L("Callbacks and throw :abort", "Callbacks y throw :abort", "コールバックと throw :abort"),
    p(
      "Callbacks are methods Rails calls automatically at certain moments in a record's life: before validation, before save, after create and so on. Under the hood it's a list of method names kept by the class; when save runs, it calls each one in order with send, then writes the row.",
      "Los callbacks son métodos que Rails llama solo en ciertos momentos de la vida de un registro: antes de validar, antes de guardar, después de crear, etc. Por dentro es una lista de nombres de métodos que guarda la clase; cuando corre save, llama a cada uno en orden con send y luego escribe la fila.",
      "コールバックは、レコードの一生の決まった瞬間（検証の前、保存の前、作成の後など）に Rails が自動で呼ぶメソッド。中身はクラスが持つメソッド名のリストで、save が走るとき send で順番に呼び、それから行を書く。",
    ),
    ex(`class Order
  STEPS = [:trim, :shout]
  def initialize(note) = @note = note
  def trim = @note = @note.strip
  def shout = @note = @note.upcase
  def save = (STEPS.each { |s| send(s) }; puts "SAVE #{@note}")
end
Order.new("  rush ").save`, "SAVE RUSH",
      L("Each callback runs in list order before the write", "Cada callback corre en orden antes de escribir", "書く前にリストの順でコールバックが動く")),
    p(
      "To stop a save from inside a callback, Rails (since version 5) uses throw :abort. throw jumps out of the code immediately, up to the matching catch(:abort), skipping everything in between, including the INSERT. Returning false from a callback does nothing: nobody checks its return value.",
      "Para frenar un save desde un callback, Rails (desde la versión 5) usa throw :abort. throw salta fuera del código de inmediato, hasta el catch(:abort) que coincide, y se salta todo lo intermedio, incluido el INSERT. Devolver false desde un callback no hace nada: nadie revisa su valor de retorno.",
      "コールバックの中から save を止めるには、Rails 5 以降は throw :abort を使う。throw はすぐにコードを飛び出し、対応する catch(:abort) まで間のすべて（INSERT も）を飛ばす。コールバックで false を返しても何も起きない。戻り値はだれも見ていないから。",
    ),
    ex(`result = catch(:stop) do
  puts "step 1"
  throw :stop
  puts "step 2"
end
p result`, "step 1\nnil",
      L("throw skips the rest of the block; catch returns nil", "throw se salta el resto del bloque; catch devuelve nil", "throw は残りを飛ばし、catch は nil を返す")),
    p(
      "throw needs a catch with the same tag somewhere up the call stack. If there is none, Ruby raises UncaughtThrowError. In our mini Model, save wraps the before_save chain in catch(:abort), so a halted save returns false and nothing is written.",
      "throw necesita un catch con la misma etiqueta en algún lugar arriba en la pila de llamadas. Si no hay, Ruby lanza UncaughtThrowError. En nuestro Model mini, save envuelve la cadena before_save en catch(:abort), así un save detenido devuelve false y no se escribe nada.",
      "throw には、呼び出し元のどこかに同じタグの catch が必要。無ければ Ruby は UncaughtThrowError を投げる。ミニ Model の save は before_save チェーンを catch(:abort) で包んでいるので、止まった save は false を返し、何も書かれない。",
    ),
    crash("throw :oops", "uncaught throw :oops",
      L("No matching catch: Ruby raises UncaughtThrowError", "Sin catch que coincida: Ruby lanza UncaughtThrowError", "対応する catch が無いと UncaughtThrowError")),
    p(
      "In Rails a halted chain makes save return false and save! raise ActiveRecord::RecordNotSaved. Note the difference: RecordInvalid means a validation failed; RecordNotSaved means a callback stopped the save.",
      "En Rails, una cadena detenida hace que save devuelva false y que save! lance ActiveRecord::RecordNotSaved. Fíjate en la diferencia: RecordInvalid significa que falló una validación; RecordNotSaved, que un callback frenó el save.",
      "Rails ではチェーンが止まると save は false、save! は ActiveRecord::RecordNotSaved を投げる。違いに注意：RecordInvalid は検証の失敗、RecordNotSaved はコールバックが保存を止めたこと。",
    ),
  ),
  note("callback-order", L("When each callback runs", "Cuándo corre cada callback", "各コールバックが動くとき"),
    p(
      "Rails runs callbacks in a fixed order, and the order follows a logic. Validation comes first, since there's no point saving invalid data: its before and after hooks surround the rules. Then save wraps create (or update): save is the outer layer and create the inner one. Before hooks enter from the outside in, after hooks leave from the inside out.",
      "Rails corre los callbacks en un orden fijo, y ese orden tiene lógica. Primero va la validación, porque no tiene sentido guardar datos inválidos: sus hooks before y after rodean las reglas. Luego save envuelve a create (o update): save es la capa externa y create la interna. Los before entran de afuera hacia adentro; los after salen de adentro hacia afuera.",
      "Rails のコールバックの順番は決まっていて、理屈がある。無効なデータを保存しても意味がないので、まず検証。その before と after がルールをはさむ。次に save が create（または update）を包む。save が外側、create が内側。before は外から内へ入り、after は内から外へ出る。",
    ),
    ex(`def around(name)
  puts "before_#{name}"
  yield
  puts "after_#{name}"
end
around("outer") { around("inner") { puts "WORK" } }`, "before_outer\nbefore_inner\nWORK\nafter_inner\nafter_outer",
      L("Nested hooks: the inner one finishes first", "Hooks anidados: el interno termina primero", "入れ子のフック：内側が先に終わる")),
    p(
      "after_commit runs later than all of these: only after the database transaction is committed. Until the commit, the row could still be rolled back. So anything that leaves your app, like sending an email or calling another service, belongs in after_commit; otherwise a rollback could leave an email sent for a record that never existed.",
      "after_commit corre después de todos estos: solo cuando la transacción de la base se confirma. Hasta el commit, la fila todavía podría revertirse. Así que todo lo que sale de tu app, como enviar un email o llamar a otro servicio, va en after_commit; si no, un rollback podría dejar un email enviado por un registro que nunca existió.",
      "after_commit はこれらすべてより後、DB のトランザクションがコミットされてから動く。コミットまでは行がロールバックされるかもしれない。メール送信や外部サービスの呼び出しのようにアプリの外へ出るものは after_commit へ。そうしないと、存在しなかったレコードのメールが送られてしまう。",
    ),
    p(
      "Some methods skip callbacks entirely because they never build model objects: update_all and delete_all send one SQL statement for many rows, and update_column writes one column directly. They're fast, but any rule your callbacks enforce simply doesn't run.",
      "Algunos métodos se saltan los callbacks por completo porque nunca crean objetos de modelo: update_all y delete_all envían una sola sentencia SQL para muchas filas, y update_column escribe una columna directamente. Son rápidos, pero ninguna regla de tus callbacks se ejecuta.",
      "モデルのオブジェクトを作らないので、コールバックを丸ごと飛ばすメソッドがある。update_all と delete_all は多くの行に SQL を1回送り、update_column は1列を直接書く。速いが、コールバックで守っているルールはまったく動かない。",
    ),
  ),
  note("concerns", L("Concerns and the included hook", "Concerns y el hook included", "concern と included フック"),
    p(
      "A concern is a module that packs behavior several models share, like making a slug or archiving records. Including it in a class adds its instance methods. Ruby also calls the module's self.included(base) hook at that moment, passing the class, so the module can add class-level methods too.",
      "Un concern es un módulo que agrupa comportamiento que comparten varios modelos, como crear un slug o archivar registros. Incluirlo en una clase agrega sus métodos de instancia. Ruby además llama en ese momento al hook self.included(base) del módulo, pasándole la clase, así el módulo puede agregar también métodos de clase.",
      "concern は、スラッグ作りやアーカイブのように複数のモデルで共有する振る舞いをまとめたモジュール。クラスに include するとインスタンスメソッドが加わる。その瞬間 Ruby はモジュールの self.included(base) フックをクラスを渡して呼ぶので、クラスメソッドも足せる。",
    ),
    ex(`module Stamped
  def self.included(base) = base.extend(ClassMethods)
  module ClassMethods
    def label = "#{name} v1"
  end
end
class Invoice
  include Stamped
end
puts Invoice.label`, "Invoice v1",
      L("included runs on include and adds class methods", "included corre al incluir y agrega métodos de clase", "include 時に included が動きクラスメソッドを足す")),
    p(
      "base.extend(ClassMethods) adds ClassMethods' methods to the class itself, so they become macros you can call in the class body, just like belongs_to or validates. Such a macro can then define instance methods with define_method.",
      "base.extend(ClassMethods) agrega los métodos de ClassMethods a la clase misma, así se vuelven macros que puedes llamar en el cuerpo de la clase, igual que belongs_to o validates. Esa macro luego puede definir métodos de instancia con define_method.",
      "base.extend(ClassMethods) は ClassMethods のメソッドをクラス自身に足す。だから belongs_to や validates のように、クラスの本体で呼べるマクロになる。そのマクロが define_method でインスタンスメソッドを定義することもできる。",
    ),
    p(
      "Rails wraps this pattern in ActiveSupport::Concern. Code inside an included do ... end block runs in the context of the including class, so that's where macros like scope, validates or callbacks go. Methods inside class_methods do ... end become class methods. Common mistake: calling a macro directly in the module body, where it runs on the module, not on the model.",
      "Rails envuelve este patrón en ActiveSupport::Concern. El código dentro de un bloque included do ... end corre en el contexto de la clase que lo incluye, así que ahí van macros como scope, validates o callbacks. Los métodos dentro de class_methods do ... end se vuelven métodos de clase. Error común: llamar una macro directo en el cuerpo del módulo, donde corre sobre el módulo y no sobre el modelo.",
      "Rails はこの形を ActiveSupport::Concern にまとめている。included do ... end の中のコードは include したクラスの中で動くので、scope・validates・コールバックなどのマクロはここに書く。class_methods do ... end の中はクラスメソッドになる。よくあるミス：モジュールの本体で直接マクロを呼ぶこと。それはモデルではなくモジュールの上で動いてしまう。",
    ),
    railsCode(`module Archivable
  extend ActiveSupport::Concern
  included do
    scope :archived, -> { where(archived: true) }
  end
end`, READ_ONLY),
  ),
];

const callbacks: LessonDef = {
  slug: "callbacks-and-concerns",
  title: L("Rituals before the vault", "Rituales ante la bóveda", "金庫の前の儀式"),
  concept: "callbacks",
  mode: "lesson",
  xp: 80,
  enemy: "rails/callback-knot",
  enemyName: L("CALLBACK KNOT", "NUDO DE CALLBACKS", "コールバック結び"),
  notes: callbacksNotes,
  beats: [
    say(L(
      "Before a record enters the vault, rituals run: CALLBACKS. They are just method names in a class list, called in order around save.",
      "Antes de que un registro entre a la bóveda, corren rituales: los CALLBACKS. Son nombres de métodos en una lista, llamados en orden.",
      "レコードが金庫に入る前に儀式がある。それがコールバック。クラスのリストにあるメソッド名を順に呼ぶだけ。",
    )),
    {
      kind: "act",
      prompt: L("Walk two posts through the ritual", "Pasa dos posts por el ritual", "投稿2つに儀式を通そう"),
      steps: [
        { label: L("NORMALIZE", "NORMALIZAR", "整える"), line: "send(:normalize)  # \" Hi \" -> \"Hi\"", effects: [{ t: "tag", actor: "hero", text: "Post", value: "\"Hi\"" }, { t: "banner", text: L("normalize", "normalize", "normalize") }] },
        { label: L("CHECK SPAM", "VER SPAM", "スパム確認"), line: "send(:check_spam)", effects: [{ t: "banner", text: L("check_spam", "check_spam", "check_spam") }] },
        { label: L("INSERT", "INSERT", "INSERT"), line: "puts \"INSERT Hi\"", effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "print", text: "INSERT Hi" }], output: "INSERT Hi" },
        { label: L("SPAM POST", "POST SPAM", "スパム投稿"), line: "throw :abort  # \"$$$ win\"", effects: [{ t: "value", actor: "hero", text: "\"$$$ win\"" }, { t: "drop" }, { t: "shake" }, { t: "banner", text: L("HALTED", "DETENIDO", "中断") }] },
      ],
    },
    say(L(
      "Our mini ritual: catch(:abort) wraps the chain. Any callback can throw :abort to stop the save before INSERT.",
      "Nuestro ritual mini: catch(:abort) envuelve la cadena. Cualquier callback puede hacer throw :abort para frenar el save antes del INSERT.",
      "ミニ儀式：catch(:abort) がチェーンを包む。どのコールバックも throw :abort で INSERT 前に止められる。",
    ), RITUAL),
    {
      kind: "predict",
      hint: L("Run both callbacks in order for each post. Which one throws :abort, and what does save return then?", "Corre ambos callbacks en orden por post. ¿Cuál hace throw :abort y qué devuelve save entonces?", "投稿ごとに2つのコールバックを順に。どれが throw :abort し、そのとき save は何を返す？"),
      note: "callback-chain",
      prompt: PRINT,
      code: "# (Post above)\np Post.new(\" Hi \").save\np Post.new(\"$$$ win\").save",
      options: ["INSERT Hi\ntrue\nfalse", "INSERT  Hi \ntrue\nfalse", "INSERT Hi\ntrue\nINSERT $$$ win\ntrue"],
      answer: 0,
      output: "INSERT Hi\ntrue\nfalse",
      check: { compiles: true, program: `${RITUAL}\np Post.new(" Hi ").save\np Post.new("$$$ win").save`, stdout: "INSERT Hi\ntrue\nfalse" },
      explain: L("normalize strips the spaces first. The spam post throws :abort, catch ends, and save returns false.", "normalize quita los espacios primero. El post spam hace throw :abort, catch termina y save devuelve false.", "normalize が先に空白を削る。スパム投稿は throw :abort で catch を抜け、save は false。"),
      win: [{ t: "print", text: "INSERT Hi" }, { t: "drop" }, { t: "banner", text: L("HALTED", "DETENIDO", "中断") }],
    },
    {
      kind: "predict",
      hint: L("throw jumps to a matching catch up the call stack. Is there one here?", "throw salta a un catch que coincida más arriba en la pila. ¿Hay uno aquí?", "throw は呼び出し元の対応する catch へ飛ぶ。ここに catch はある？"),
      note: "callback-chain",
      prompt: HAPPENS,
      code: "def check_spam = throw(:abort)\ncheck_spam\nputs \"saved\"",
      options: [L("Crash: uncaught throw :abort", "Error: uncaught throw :abort", "エラー：uncaught throw :abort"), "saved", L("Nothing prints", "No imprime nada", "何も表示されない")],
      answer: 0,
      check: { compiles: true, throws: "uncaught throw :abort (UncaughtThrowError)" },
      explain: L("throw needs a matching catch up the call stack. Without one, Ruby raises UncaughtThrowError.", "throw necesita un catch que coincida más arriba en la pila. Sin él, Ruby lanza UncaughtThrowError.", "throw には呼び出し元に対応する catch が必要。ないと UncaughtThrowError になる。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "order",
      hint: L("Validation comes before saving, and save wraps create: inner hooks finish first.", "La validación va antes de guardar, y save envuelve a create: los hooks internos terminan primero.", "検証は保存の前。save が create を包み、内側のフックが先に終わる。"),
      note: "callback-order",
      prompt: L("Rails: callbacks when creating a record", "Rails: callbacks al crear un registro", "Rails：作成時のコールバック順"),
      lines: ["before_validation", "after_validation", "before_save", "before_create", "after_create", "after_save"],
      explain: L("Rails Guides: validation first, then save wraps create. after_commit comes last, once the row is committed.", "Guías de Rails: primero la validación, luego save envuelve a create. after_commit va al final, tras el commit.", "Rails ガイド：まず検証、save が create を包む。after_commit はコミット後の最後。"),
    },
    {
      kind: "pick",
      hint: L("A halted chain makes save return false. What does the bang version do instead?", "Una cadena detenida hace que save devuelva false. ¿Qué hace en cambio la versión con !?", "チェーンが止まると save は false。では ! 版はどうする？"),
      note: "callback-chain",
      prompt: L("Rails: throw :abort in before_save, then save!", "Rails: throw :abort en before_save y luego save!", "Rails：before_save で abort、save! は？"),
      code: "post.save! # => ___",
      options: [L("raises RecordNotSaved", "lanza RecordNotSaved", "RecordNotSaved を発生"), L("returns false", "devuelve false", "false を返す")],
      answer: 0,
      explain: L("Rails Guides: a halted chain makes save return false and save! raise ActiveRecord::RecordNotSaved.", "Guías de Rails: una cadena detenida hace que save devuelva false y save! lance ActiveRecord::RecordNotSaved.", "Rails ガイド：チェーンが止まると save は false、save! は ActiveRecord::RecordNotSaved。"),
    },
    {
      kind: "pick",
      hint: L("The email must not go out if the transaction rolls back. Which hook waits for the commit?", "El email no debe salir si la transacción se revierte. ¿Qué hook espera al commit?", "ロールバックならメールを送ってはだめ。コミットを待つフックは？"),
      note: "callback-order",
      prompt: L("Rails: email only once the row is committed", "Rails: email solo tras el commit de la fila", "Rails：コミット後にだけメール送信"),
      code: "class User < ApplicationRecord\n  ___ :send_welcome_email, on: :create\nend",
      options: ["after_commit", "before_save"],
      answer: 0,
      explain: L("Rails Guides: after_commit runs after the transaction commits, so a rollback never sends a stray email.", "Guías de Rails: after_commit corre tras el commit, así un rollback nunca manda un email perdido.", "Rails ガイド：after_commit はコミット後に動く。ロールバックで誤送信しない。"),
    },
    {
      kind: "pick",
      hint: L("Which call sends one SQL statement without building any model objects?", "¿Qué llamada envía una sola sentencia SQL sin crear objetos de modelo?", "モデルのオブジェクトを作らず SQL を1回送るのはどっち？"),
      note: "callback-order",
      prompt: L("Rails: which call SKIPS callbacks?", "Rails: ¿qué llamada SALTA los callbacks?", "Rails：コールバックを飛ばすのは？"),
      code: "___",
      options: ["Post.update_all(views: 0)", "post.update(views: 0)"],
      answer: 0,
      explain: L("Rails Guides: update_all runs one SQL UPDATE with no model objects, so no callbacks or validations.", "Guías de Rails: update_all corre un UPDATE SQL sin objetos de modelo: sin callbacks ni validaciones.", "Rails ガイド：update_all はモデルを作らず UPDATE 1回。コールバックも検証もなし。"),
    },
    say(L(
      "Our mini Model has a before_save chain with the same rule: throw :abort and the row is never written.",
      "Nuestro Model mini tiene una cadena before_save con la misma regla: throw :abort y la fila nunca se escribe.",
      "ミニ Model にも before_save チェーンがある。同じく throw :abort なら行は書かれない。",
    )),
    {
      kind: "predict",
      hint: L("Trace each post through both callbacks. Which one never reaches the insert?", "Sigue cada post por ambos callbacks. ¿Cuál nunca llega a insertarse?", "各投稿を2つのコールバックに通そう。挿入まで行かないのはどれ？"),
      note: "callback-chain",
      prompt: PRINT,
      code: "class Post < Model\n  attribute :title\n  before_save :normalize\n  before_save :no_spam\n  def normalize = self.title = title.strip\n  def no_spam = (throw :abort if title.include?(\"$$$\"))\nend\np Post.new(title: \" Hi \").tap(&:save).title\np Post.new(title: \"$$$\").save\np DB.tables[\"posts\"].size",
      options: ["\"Hi\"\nfalse\n1", "\" Hi \"\nfalse\n1", "\"Hi\"\nfalse\n2"],
      answer: 0,
      output: "\"Hi\"\nfalse\n1",
      check: { compiles: true, program: withHelper(MINI_RECORD, "class Post < Model\n  attribute :title\n  before_save :normalize\n  before_save :no_spam\n  def normalize = self.title = title.strip\n  def no_spam = (throw :abort if title.include?(\"$$$\"))\nend\np Post.new(title: \" Hi \").tap(&:save).title\np Post.new(title: \"$$$\").save\np DB.tables[\"posts\"].size"), stdout: "\"Hi\"\nfalse\n1" },
      explain: L("The first post is stripped and saved. The second aborts, so the posts table holds just 1 row.", "El primer post se limpia y se guarda. El segundo aborta, así que la tabla posts tiene solo 1 fila.", "1つ目は整えて保存。2つ目は中断したので posts テーブルは1行だけ。"),
    },
    say(L(
      "A CONCERN is a module of shared spells. Its included hook runs when a class includes it, and can add class macros.",
      "Un CONCERN es un módulo de hechizos compartidos. Su hook included corre cuando una clase lo incluye y puede agregar macros.",
      "コンサーンは共有の呪文を集めたモジュール。include されると included フックが動き、マクロを足せる。",
    )),
    {
      kind: "predict",
      hint: L("include fires included, which extends Post. Then follow slug: downcase, then tr.", "include dispara included, que extiende Post. Luego sigue slug: downcase y después tr.", "include で included が動き Post を拡張。次に slug を追う：downcase、それから tr。"),
      note: "concerns",
      prompt: PRINT,
      code: "module Sluggable\n  def self.included(base) = base.extend(ClassMethods)\n  module ClassMethods\n    def slug_from(field) = define_method(:slug) { send(field).downcase.tr(\" \", \"-\") }\n  end\nend\nclass Post\n  include Sluggable\n  attr_reader :title\n  slug_from :title\n  def initialize(t) = @title = t\nend\nputs Post.new(\"Hello World\").slug",
      options: ["hello-world", "Hello-World", "hello world"],
      answer: 0,
      output: "hello-world",
      check: { compiles: true, program: "module Sluggable\n  def self.included(base) = base.extend(ClassMethods)\n  module ClassMethods\n    def slug_from(field) = define_method(:slug) { send(field).downcase.tr(\" \", \"-\") }\n  end\nend\nclass Post\n  include Sluggable\n  attr_reader :title\n  slug_from :title\n  def initialize(t) = @title = t\nend\nputs Post.new(\"Hello World\").slug", stdout: "hello-world" },
      explain: L("include fires included, which extends Post with slug_from. That macro defines slug: downcase, spaces to dashes.", "include dispara included, que extiende Post con slug_from. Esa macro define slug: minúsculas, espacios a guiones.", "include で included が動き、Post に slug_from が増える。それが slug を定義：小文字化、空白をハイフンに。"),
      win: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "print", text: "hello-world" }],
    },
    {
      kind: "pick",
      hint: L("Macros like before_save must run inside the including class. Which block does that?", "Las macros como before_save deben correr dentro de la clase que incluye. ¿Qué bloque hace eso?", "before_save などのマクロは include したクラスの中で動かす必要がある。その役のブロックは？"),
      note: "concerns",
      prompt: L("Rails: add before_save from a concern", "Rails: agregar before_save desde un concern", "Rails：concern から before_save を足す"),
      code: "module Sluggable\n  extend ActiveSupport::Concern\n  ___\n    before_save :set_slug\n  end\nend",
      options: ["included do", "class_methods do"],
      answer: 0,
      explain: L("Rails API: included do runs in the including class, so macros like before_save go there.", "API de Rails: included do corre dentro de la clase que lo incluye, así que macros como before_save van ahí.", "Rails API：included do は include したクラスの中で動く。before_save などはそこへ。"),
    },
    {
      kind: "run",
      hint: L("Nobody reads check_spam's return value. How can a callback jump out to catch(:abort)?", "Nadie lee lo que devuelve check_spam. ¿Cómo puede un callback saltar hasta catch(:abort)?", "check_spam の戻り値はだれも読まない。catch(:abort) まで飛び出すには？"),
      note: "callback-chain",
      prompt: L("Returning false doesn't halt. Make it print HALTED", "Devolver false no detiene. Que imprima HALTED", "false では止まらない。HALTED と表示させて"),
      starter: 'class Post\n  def initialize(title) = @title = title\n  def check_spam\n    return false if @title.include?("$$$")\n  end\n  def save\n    catch(:abort) do\n      check_spam\n      puts "INSERT #{@title}"\n      return true\n    end\n    puts "HALTED"\n    false\n  end\nend\nPost.new("$$$ win").save\n',
      solution: 'class Post\n  def initialize(title) = @title = title\n  def check_spam\n    throw :abort if @title.include?("$$$")\n  end\n  def save\n    catch(:abort) do\n      check_spam\n      puts "INSERT #{@title}"\n      return true\n    end\n    puts "HALTED"\n    false\n  end\nend\nPost.new("$$$ win").save\n',
      expect: "HALTED",
      fallback: [String.raw`throw\s*\(?\s*:abort`],
      explain: L("Nobody checks check_spam's return value. throw :abort jumps out to catch, like Rails since version 5.", "Nadie mira lo que devuelve check_spam. throw :abort salta hasta catch, como Rails desde la versión 5.", "check_spam の戻り値はだれも見ない。throw :abort で catch まで飛ぶ。Rails 5 以降と同じ。"),
    },
  ],
};

// ─── 2.5 Boss: the N+1 hydra ───────────────────────────────────────────────
const bossNotes: NoteDef[] = [
  note("recap-n-plus-one", L("Recap: taming N+1", "Repaso: domar el N+1", "復習：N+1 を倒す"),
    p(
      "N+1 means one query for the list plus one per record in the loop, so it grows with the records, not with the distinct parents. The cure is one batch query before the loop: collect the unique ids, load all parents at once, then read them from memory. In Rails that's includes, preload or eager_load.",
      "N+1 significa una consulta para la lista más una por registro del bucle, así que crece con los registros, no con los padres distintos. La cura es una consulta en lote antes del bucle: junta los ids únicos, carga todos los padres de una vez y luego léelos desde memoria. En Rails eso es includes, preload o eager_load.",
      "N+1 とは、リストに1回＋ループのレコードごとに1回。増えるのはレコード数で、親の種類の数ではない。治し方はループ前のまとめ読み1回：一意の id を集め、親を一度に読み、あとはメモリから読む。Rails なら includes・preload・eager_load。",
    ),
    ex(`def one(id) = ($q += 1; id)
def many(ids) = ($q += 1; ids)
items = Array.new(20) { |i| i % 4 }
$q = 1
items.each { one(it) }
puts $q
$q = 1
many(items.uniq)
puts $q`, "21\n2",
      L("20 items, 4 parents: lazy costs 21, a batch costs 2", "20 ítems, 4 padres: perezoso cuesta 21, en lote 2", "20件・親4つ：遅延は21回、まとめ読みは2回")),
    p(
      "To filter on the parent's columns, the parent table must be in the same query, so use eager_load (a single LEFT OUTER JOIN). And counts belong to the parent: a counter cache column such as albums.tracks_count lives on the parent table, kept up to date by Rails.",
      "Para filtrar por columnas del padre, la tabla padre debe estar en la misma consulta, así que usa eager_load (un solo LEFT OUTER JOIN). Y los conteos son del padre: una columna counter cache como albums.tracks_count vive en la tabla padre y Rails la mantiene al día.",
      "親の列で絞るには親のテーブルが同じクエリに必要なので、eager_load（LEFT OUTER JOIN 1回）を使う。そして数は親のもの。albums.tracks_count のようなカウンタキャッシュ列は親のテーブルにあり、Rails が最新に保つ。",
    ),
  ),
  note("recap-class-state", L("Class instance variables", "Variables de instancia de clase", "クラスインスタンス変数"),
    p(
      "Inside a class body or a class method, @name belongs to the class object itself: a class instance variable. Each class has its own, and a subclass does NOT share its parent's. Inside the subclass, the same @name starts out nil.",
      "Dentro del cuerpo de una clase o de un método de clase, @name pertenece al objeto clase en sí: una variable de instancia de clase. Cada clase tiene la suya, y una subclase NO comparte la de su padre. Dentro de la subclase, el mismo @name empieza en nil.",
      "クラスの本体やクラスメソッドの中の @name は、クラスというオブジェクト自身のもの（クラスインスタンス変数）。クラスごとに別々で、サブクラスは親のものを共有しない。サブクラスの中では同じ @name も nil から始まる。",
    ),
    ex(`class Shape
  def self.tags = (@tags ||= [])
end
class Square < Shape; end
Shape.tags << :flat
p Shape.tags
p Square.tags`, "[:flat]\n[]",
      L("Each class gets its own @tags", "Cada clase tiene su propio @tags", "クラスごとに自分の @tags を持つ")),
    p(
      "That's often what you want for per-class settings, but it surprises people with inheritance: a callback registered on a parent class wouldn't apply to its subclasses. Rails solves this with class_attribute, which subclasses inherit and can override without changing the parent.",
      "Eso suele ser lo que quieres para ajustes por clase, pero sorprende con la herencia: un callback registrado en una clase padre no se aplicaría a sus subclases. Rails lo resuelve con class_attribute, que las subclases heredan y pueden redefinir sin cambiar al padre.",
      "クラスごとの設定ならたいていそれでいいが、継承では驚く。親クラスに登録したコールバックがサブクラスに効かなくなる。Rails は class_attribute で解決する。サブクラスに受け継がれ、親を変えずに上書きもできる。",
    ),
    p(
      "Common mistake: switching to @@class_variables to share. They are shared by the whole hierarchy, so a subclass that changes one changes it for the parent and every sibling too.",
      "Error común: pasarse a @@variables_de_clase para compartir. Las comparte toda la jerarquía, así que una subclase que cambia una la cambia también para el padre y todos sus hermanos.",
      "よくあるミス：共有したくて @@クラス変数 に替えること。階層全体で共有されるので、サブクラスが変えると親や兄弟のクラスまで変わってしまう。",
    ),
  ),
  note("recap-validation-callbacks", L("Recap: validations and callbacks", "Repaso: validaciones y callbacks", "復習：検証とコールバック"),
    p(
      "save returns false when validations fail; save! raises instead. In our mini Model the exception is RecordInvalid with the full messages, like Rails' ActiveRecord::RecordInvalid. A callback stops a save with throw :abort, which jumps to the catch with the same tag.",
      "save devuelve false cuando fallan las validaciones; save! en cambio lanza un error. En nuestro Model mini la excepción es RecordInvalid con los mensajes completos, como ActiveRecord::RecordInvalid de Rails. Un callback frena un save con throw :abort, que salta al catch con la misma etiqueta.",
      "検証に落ちると save は false を返し、save! は例外を投げる。ミニ Model の例外は完全なメッセージつきの RecordInvalid で、Rails の ActiveRecord::RecordInvalid と同じ形。コールバックは throw :abort で保存を止め、同じタグの catch へ飛ぶ。",
    ),
    exRec(`class Pet < Model
  attribute :name
  validates_presence_of :name
end
pet = Pet.new
p pet.save
p pet.errors[:name]`, `false\n["can't be blank"]`,
      L("save answers false and leaves the reason in errors", "save responde false y deja el motivo en errors", "save は false を返し、理由を errors に残す")),
    ex(`catch(:halt) do
  puts "checking"
  throw :halt
  puts "never"
end
puts "after"`, "checking\nafter",
      L("throw and catch must use the same tag", "throw y catch deben usar la misma etiqueta", "throw と catch は同じタグを使う")),
    p(
      "dependent: on has_many decides what happens to the children when the parent is destroyed. :destroy loads each child as an object and destroys it, so its own callbacks run. :delete_all removes them all with one SQL DELETE: faster, but no child callbacks run.",
      "dependent: en has_many decide qué pasa con los hijos cuando se destruye el padre. :destroy carga cada hijo como objeto y lo destruye, así corren sus propios callbacks. :delete_all los borra todos con un DELETE SQL: más rápido, pero no corre ningún callback de los hijos.",
      "has_many の dependent: は、親を消したときに子をどうするかを決める。:destroy は子を1つずつオブジェクトとして読んで消すので、子のコールバックが動く。:delete_all は SQL の DELETE 1回で全部消す。速いが、子のコールバックは動かない。",
    ),
  ),
];

const boss: LessonDef = {
  slug: "n-plus-one-hydra",
  title: L("The N+1 hydra", "La hidra N+1", "N+1 ヒドラ"),
  concept: "n-plus-one",
  mode: "boss",
  xp: 180,
  enemy: "rails/n-plus-one",
  enemyName: L("N+1 HYDRA", "HIDRA N+1", "N+1 ヒドラ"),
  notes: bossNotes,
  beats: [
    enemySays(L(
      "I AM THE N+1 HYDRA. Ask me for one author and I grow a head per post. Count your trips, little engine!",
      "SOY LA HIDRA N+1. Pídeme un autor y me crece una cabeza por post. ¡Cuenta tus viajes, locomotora!",
      "我は N+1 ヒドラ。著者を1人聞くたび、投稿ごとに首が生える。往復を数えよ、小さな機関車！",
    )),
    {
      kind: "predict",
      hint: L("N+1 grows with the posts in the loop, not with the authors.", "N+1 crece con los posts del bucle, no con los autores.", "N+1 はループの投稿数で増える。著者数ではない。"),
      note: "recap-n-plus-one",
      time: 15,
      prompt: L("50 posts by 2 authors, lazy loop. Queries?", "50 posts de 2 autores, bucle perezoso. ¿Consultas?", "2人の投稿50件、遅延ループ。クエリは？"),
      code: "# (finders: find_author counts 1)\nposts = Array.new(50) { |i| {a: i % 2 + 1} }\n$queries = 1\nposts.each { |post| find_author(post[:a]) }\nputs $queries",
      options: ["51", "3", "50"],
      answer: 0,
      output: "51",
      check: { compiles: true, program: `${FINDERS}\nposts = Array.new(50) { |i| {a: i % 2 + 1} }\n$queries = 1\nposts.each { |post| find_author(post[:a]) }\nputs $queries`, stdout: "51" },
      explain: L("N+1 counts posts, not authors: 1 + 50.", "N+1 cuenta posts, no autores: 1 + 50.", "N+1 は著者でなく投稿の数：1 + 50。"),
      win: [{ t: "shake" }, { t: "banner", text: q(51) }],
    },
    {
      kind: "predict",
      hint: L("map gives one name per post. How many trips does includes need?", "map da un nombre por post. ¿Cuántos viajes necesita includes?", "map は投稿ごとに名前を1つ。includes の往復は何回？"),
      note: "recap-n-plus-one",
      time: 15,
      prompt: PRINT,
      code: "# (2 authors, 3 posts)\nDB.queries = 0\np Post.includes(:author).map { it.author.name }\nputs DB.queries",
      options: ["[\"Ada\", \"Bo\", \"Ada\"]\n2", "[\"Ada\", \"Bo\", \"Ada\"]\n4", "[\"Ada\", \"Bo\"]\n2"],
      answer: 0,
      output: "[\"Ada\", \"Bo\", \"Ada\"]\n2",
      check: { compiles: true, program: seeded("DB.queries = 0\np Post.includes(:author).map { it.author.name }\nputs DB.queries"), stdout: "[\"Ada\", \"Bo\", \"Ada\"]\n2" },
      explain: L("One name per post (Ada twice), but only 2 trips: posts, then both authors at once.", "Un nombre por post (Ada dos veces), pero solo 2 viajes: posts y luego ambos autores juntos.", "名前は投稿ごと（Ada は2回）、でも往復は2回：投稿、著者まとめて。"),
      win: [{ t: "attack", from: "hero", to: "enemy", dmg: 2 }, { t: "banner", text: q(2) }],
    },
    {
      kind: "pick",
      hint: L("To filter on the authors table, it has to be joined into the same query.", "Para filtrar por la tabla authors, tiene que unirse en la misma consulta.", "authors テーブルで絞るには、同じクエリに JOIN する必要がある。"),
      note: "recap-n-plus-one",
      time: 15,
      prompt: L("Rails: filter by author name AND load authors", "Rails: filtrar por nombre de autor Y cargarlos", "Rails：著者名で絞りつつ著者も読む"),
      code: "Post.___(:author).where(authors: {name: \"Ada\"})",
      options: ["eager_load", "preload"],
      answer: 0,
      explain: L("Rails Guides: eager_load joins authors into the same query, so where can use their columns. preload can't.", "Guías de Rails: eager_load une authors en la misma consulta, así where usa sus columnas. preload no puede.", "Rails ガイド：eager_load は同じクエリで JOIN するので where で著者列を使える。preload は無理。"),
    },
    {
      kind: "predict",
      hint: L("@cbs in a class method belongs to that class object. Does Draft share Post's?", "@cbs en un método de clase pertenece a ese objeto clase. ¿Draft comparte el de Post?", "クラスメソッドの @cbs はそのクラスのもの。Draft は Post のものを共有する？"),
      note: "recap-class-state",
      time: 15,
      prompt: PRINT,
      code: "class Model\n  def self.before_save(m) = (@cbs ||= []) << m\n  def self.cbs = @cbs || []\nend\nclass Post < Model; before_save :a; end\nclass Draft < Post; end\np Post.cbs, Draft.cbs",
      options: ["[:a]\n[]", "[:a]\n[:a]", "[]\n[]"],
      answer: 0,
      output: "[:a]\n[]",
      check: { compiles: true, stdout: "[:a]\n[]" },
      explain: L("@cbs is a class instance variable: each class has its own, so Draft doesn't inherit Post's list. Rails uses class_attribute.", "@cbs es variable de instancia de clase: cada clase tiene la suya, así que Draft no hereda la lista. Rails usa class_attribute.", "@cbs はクラスごとの変数。Draft は Post のリストを継がない。Rails は class_attribute を使う。"),
    },
    {
      kind: "pick",
      hint: L("The count describes the parent post. Which table would hold it?", "El conteo describe al post padre. ¿Qué tabla lo guardaría?", "数は親の投稿のこと。どのテーブルに置く？"),
      note: "recap-n-plus-one",
      time: 12,
      prompt: L("Rails: counter_cache on Comment needs…", "Rails: counter_cache en Comment necesita…", "Rails：Comment の counter_cache に必要なのは"),
      code: "belongs_to :post, counter_cache: true\n# needs the column ___",
      options: ["posts.comments_count", "comments.count"],
      answer: 0,
      explain: L("Rails Guides: the count lives on the parent: a comments_count column on posts.", "Guías de Rails: el conteo vive en el padre: una columna comments_count en posts.", "Rails ガイド：数は親に置く。posts の comments_count 列。"),
    },
    {
      kind: "predict",
      hint: L("save would return false here. What does the bang version do with a blank title?", "Aquí save devolvería false. ¿Qué hace la versión con ! con un título vacío?", "ここで save なら false。空のタイトルで ! 版はどうする？"),
      note: "recap-validation-callbacks",
      time: 15,
      prompt: HAPPENS,
      code: "class Post < Model\n  attribute :title\n  validates_presence_of :title\nend\nPost.new.save!",
      options: [L("Raises: Validation failed: Title can't be blank", "Lanza: Validation failed: Title can't be blank", "例外：Validation failed: Title can't be blank"), L("Returns false", "Devuelve false", "false を返す")],
      answer: 0,
      check: { compiles: true, program: withHelper(MINI_RECORD, "class Post < Model\n  attribute :title\n  validates_presence_of :title\nend\nPost.new.save!"), throws: "Validation failed: Title can't be blank (RecordInvalid)" },
      explain: L("Our mini save! raises RecordInvalid with the full messages, like Rails' ActiveRecord::RecordInvalid.", "Nuestro save! mini lanza RecordInvalid con los mensajes completos, como ActiveRecord::RecordInvalid de Rails.", "ミニ save! は完全なメッセージ付きで RecordInvalid を投げる。Rails と同じ形。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "pick",
      hint: L("Think about whether each child is loaded as an object, and what that means for its callbacks.", "Piensa si cada hijo se carga como objeto, y qué significa eso para sus callbacks.", "子が1つずつオブジェクトとして読まれるか、それがコールバックにどう効くか考えよう。"),
      note: "recap-validation-callbacks",
      time: 15,
      prompt: L("Rails: dependent: :delete_all vs :destroy", "Rails: dependent: :delete_all vs :destroy", "Rails：:delete_all と :destroy の違い"),
      code: "has_many :comments, dependent: :delete_all\n# compared to :destroy: ___",
      options: [L("skips the comments' callbacks", "salta los callbacks de los comments", "コメントのコールバックを飛ばす"), L("exactly the same", "exactamente igual", "まったく同じ")],
      answer: 0,
      explain: L("Rails Guides: :delete_all removes children with one SQL DELETE; :destroy loads each one and runs its callbacks.", "Guías de Rails: :delete_all borra los hijos con un DELETE SQL; :destroy carga cada uno y corre sus callbacks.", "Rails ガイド：:delete_all は SQL の DELETE 1回、:destroy は1件ずつ読みコールバックを実行。"),
    },
    {
      kind: "type",
      hint: L("throw must use the same tag as the catch around it.", "throw debe usar la misma etiqueta que el catch que lo rodea.", "throw は周りの catch と同じタグを使う。"),
      note: "recap-validation-callbacks",
      time: 12,
      prompt: L("Halt the ritual", "Detén el ritual", "儀式を止めよう"),
      code: "catch(:abort) do\n  throw ___\n  puts \"saved\"\nend\nputs \"halted\"",
      answer: ":abort",
      check: { compiles: true, stdout: "halted" },
      explain: L("throw :abort jumps to the matching catch(:abort), skipping \"saved\".", "throw :abort salta al catch(:abort) que coincide y se salta \"saved\".", "throw :abort は対応する catch(:abort) へ飛び、\"saved\" を飛ばす。"),
      win: [{ t: "drop" }, { t: "banner", text: L("HALTED", "DETENIDO", "中断") }],
    },
    {
      kind: "run",
      hint: L("Fetch all the authors in one batch before building the report, then read names from the hash.", "Trae todos los autores en un lote antes de armar el reporte y luego lee los nombres del hash.", "レポートを作る前に著者をまとめて取り、名前はハッシュから読もう。"),
      note: "recap-n-plus-one",
      prompt: L("Slay the hydra: it must print \"queries: 2\"", "Vence a la hidra: debe imprimir \"queries: 2\"", "ヒドラを倒せ：\"queries: 2\" と表示"),
      starter: '$queries = 0\nAUTHORS = {1 => "Ada", 2 => "Bo", 3 => "Cy"}\ndef find_author(id) = ($queries += 1; AUTHORS[id])\ndef find_authors(ids) = ($queries += 1; AUTHORS.slice(*ids))\nposts = Array.new(30) { |i| {title: "P#{i}", a: i % 3 + 1} }\n$queries = 1\nreport = posts.map { |post| "#{post[:title]} by #{find_author(post[:a])}" }\nputs report.last\nputs "queries: #{$queries}"\n',
      solution: '$queries = 0\nAUTHORS = {1 => "Ada", 2 => "Bo", 3 => "Cy"}\ndef find_author(id) = ($queries += 1; AUTHORS[id])\ndef find_authors(ids) = ($queries += 1; AUTHORS.slice(*ids))\nposts = Array.new(30) { |i| {title: "P#{i}", a: i % 3 + 1} }\n$queries = 1\nauthors = find_authors(posts.map { |post| post[:a] }.uniq)\nreport = posts.map { |post| "#{post[:title]} by #{authors[post[:a]]}" }\nputs report.last\nputs "queries: #{$queries}"\n',
      expect: "P29 by Cy\nqueries: 2",
      fallback: [String.raw`=\s*find_authors\(`],
      explain: L("Preload once with find_authors on the unique ids, then read names from the hash: 31 trips become 2.", "Precarga una vez con find_authors y los ids únicos, luego lee del hash: 31 viajes pasan a 2.", "一意の id で find_authors を1回、名前はハッシュから。31往復が2往復に。"),
    },
  ],
};

export const associationForest: RegionDef = {
  slug: "association-forest",
  name: L("Association Forest", "Bosque de Asociaciones", "アソシエーションの森"),
  subtitle: L("Associations, N+1, validation, callbacks", "Asociaciones, N+1, validación, callbacks", "関連、N+1、検証、コールバック"),
  theme: "forest",
  lessons: [associations, nPlusOne, validations, callbacks, boss],
};
