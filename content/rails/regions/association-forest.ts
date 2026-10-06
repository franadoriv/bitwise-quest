import type { Beat, LessonDef, RegionDef, Text } from "../../../lib/content/types.ts";
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

// ─── 2.1 Family trees: associations ────────────────────────────────────────
const associations: LessonDef = {
  slug: "associations",
  title: L("Family trees", "Árboles genealógicos", "家系図"),
  concept: "associations",
  mode: "lesson",
  xp: 75,
  enemy: "slime",
  enemyName: L("ORPHAN ROW", "FILA HUÉRFANA", "みなしごの行"),
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
      prompt: L("Rails: save a Post with no author. Result?", "Rails: guardar un Post sin autor. ¿Resultado?", "Rails：著者なしの Post を保存すると？"),
      code: "post = Post.new(title: \"Lost\")\npost.save # => ___",
      options: [L("false: Author must exist", "false: Author must exist", "false：Author must exist"), L("true, author_id NULL", "true, author_id NULL", "true、author_id は NULL")],
      answer: 0,
      explain: L("Rails Guides: belongs_to adds a presence check unless you write optional: true.", "Guías de Rails: belongs_to agrega un chequeo de presencia salvo que escribas optional: true.", "Rails ガイド：optional: true を書かない限り、belongs_to は存在チェックを足すよ。"),
    },
    {
      kind: "pick",
      prompt: L("Doctors meet patients in dated appointments", "Doctores ven pacientes en citas con fecha", "医者と患者が日付つきの予約でつながる"),
      code: "class Doctor < ApplicationRecord\n  has_many :appointments\n  ___\nend",
      options: ["has_many :patients, through: :appointments", "has_and_belongs_to_many :patients"],
      answer: 0,
      explain: L("Rails Guides: use has_many :through when the join row has its own data, like a date.", "Guías de Rails: usa has_many :through cuando la fila de unión tiene datos propios, como una fecha.", "Rails ガイド：中間の行が日付などのデータを持つなら has_many :through を使う。"),
    },
    {
      kind: "type",
      prompt: L("Comments on posts AND videos", "Comentarios en posts Y videos", "投稿にも動画にもコメント"),
      code: "class Comment < ApplicationRecord\n  belongs_to :commentable, ___: true\nend",
      answer: "polymorphic",
      explain: L("Rails Guides: a polymorphic belongs_to stores commentable_type and commentable_id.", "Guías de Rails: un belongs_to polymorphic guarda commentable_type y commentable_id.", "Rails ガイド：polymorphic な belongs_to は commentable_type と commentable_id を持つ。"),
    },
    {
      kind: "run",
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
const nPlusOne: LessonDef = {
  slug: "n-plus-one",
  title: L("The query swarm", "El enjambre de consultas", "クエリの群れ"),
  concept: "n-plus-one",
  mode: "lesson",
  xp: 85,
  enemy: "rails/n-plus-one",
  enemyName: L("N+1 SWARM", "ENJAMBRE N+1", "N+1 の群れ"),
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
      prompt: L("Rails: always ONE LEFT OUTER JOIN query", "Rails: siempre UNA consulta LEFT OUTER JOIN", "Rails：必ず LEFT OUTER JOIN 1回"),
      code: "Post.___(:author).to_a",
      options: ["eager_load", "preload", "joins"],
      answer: 0,
      explain: L("Rails Guides: eager_load always joins; preload always runs a separate query per association.", "Guías de Rails: eager_load siempre hace JOIN; preload siempre una consulta separada por asociación.", "Rails ガイド：eager_load は常に JOIN、preload は関連ごとに別クエリ。"),
    },
    {
      kind: "pick",
      prompt: L("Rails: is this loop still N+1?", "Rails: ¿este bucle sigue siendo N+1?", "Rails：このループはまだ N+1？"),
      code: "Post.joins(:author).each do |post|\n  post.author.name\nend\n# ___",
      options: [L("Yes: joins doesn't load authors", "Sí: joins no carga autores", "はい：joins は著者を読まない"), L("No: one query", "No: una consulta", "いいえ：1回だけ")],
      answer: 0,
      explain: L("Rails Guides: joins only filters with SQL JOIN; post.author still loads lazily, one query per post.", "Guías de Rails: joins solo filtra con un JOIN; post.author sigue cargando perezoso, una consulta por post.", "Rails ガイド：joins は JOIN で絞るだけ。post.author は投稿ごとに遅延読み込みのまま。"),
    },
    {
      kind: "pick",
      prompt: L("Rails: post.comments.size with no query", "Rails: post.comments.size sin consulta", "Rails：クエリなしで comments.size"),
      code: "class Comment < ApplicationRecord\n  belongs_to :post, ___\nend",
      options: ["counter_cache: true", "index: true"],
      answer: 0,
      explain: L("Rails Guides: counter_cache keeps a comments_count column on posts, updated on create and destroy.", "Guías de Rails: counter_cache mantiene una columna comments_count en posts, al crear y destruir.", "Rails ガイド：counter_cache は posts の comments_count 列を作成・削除で更新する。"),
    },
    {
      kind: "pick",
      prompt: L("Rails: make lazy loading raise an error", "Rails: hacer que la carga perezosa lance error", "Rails：遅延読み込みでエラーにしたい"),
      code: "posts = Post.___.to_a\nposts.first.author # raises",
      options: ["strict_loading", "readonly"],
      answer: 0,
      explain: L("Rails Guides: strict_loading raises StrictLoadingViolationError on a lazy load. The Bullet gem warns in dev.", "Guías de Rails: strict_loading lanza StrictLoadingViolationError al cargar perezoso. La gema Bullet avisa en dev.", "Rails ガイド：strict_loading は遅延読み込みで例外。Bullet gem は開発中に警告する。"),
    },
    {
      kind: "run",
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

const validations: LessonDef = {
  slug: "validations",
  title: L("Gatekeepers", "Guardianes", "門番"),
  concept: "validations",
  mode: "lesson",
  xp: 75,
  enemy: "rails/mass-burglar",
  enemyName: L("BLANK BANDIT", "BANDIDO VACÍO", "からっぽ盗賊"),
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
      prompt: L("Rails: require a title", "Rails: exigir un título", "Rails：タイトルを必須に"),
      code: "class Post < ApplicationRecord\n  validates :title, ___: true\nend",
      answer: "presence",
      explain: L("Rails Guides: validates :title, presence: true adds the \"can't be blank\" error.", "Guías de Rails: validates :title, presence: true agrega el error \"can't be blank\".", "Rails ガイド：validates :title, presence: true で \"can't be blank\" エラーが付く。"),
    },
    {
      kind: "pick",
      prompt: L("Rails: which call SKIPS validations?", "Rails: ¿qué llamada SALTA las validaciones?", "Rails：検証をスキップするのは？"),
      code: "# post has validates :title, presence: true\n___",
      options: ["post.update_column(:title, \"\")", "post.update(title: \"\")"],
      answer: 0,
      explain: L("Rails Guides: update_column writes straight to the database, skipping validations and callbacks.", "Guías de Rails: update_column escribe directo en la base, saltando validaciones y callbacks.", "Rails ガイド：update_column は DB に直接書き、検証もコールバックも飛ばす。"),
    },
    {
      kind: "pick",
      prompt: L("Rails: uniqueness and two requests at once", "Rails: uniqueness y dos peticiones a la vez", "Rails：uniqueness に同時に2リクエスト"),
      code: "validates :email, uniqueness: true\n# two signups, same email, same instant\n# fix: ___",
      options: [L("also add a unique index", "agregar también un índice único", "ユニークインデックスも足す"), L("nothing: Rails locks it", "nada: Rails lo bloquea", "何もしない：Rails がロック")],
      answer: 0,
      explain: L("Rails Guides: both checks can pass before either insert. Only a unique index in the database stops the duplicate.", "Guías de Rails: ambos chequeos pueden pasar antes de insertar. Solo un índice único en la base frena el duplicado.", "Rails ガイド：両方のチェックが挿入前に通りうる。重複を止めるのは DB のユニーク索引だけ。"),
    },
    {
      kind: "run",
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

const callbacks: LessonDef = {
  slug: "callbacks-and-concerns",
  title: L("Rituals before the vault", "Rituales ante la bóveda", "金庫の前の儀式"),
  concept: "callbacks",
  mode: "lesson",
  xp: 80,
  enemy: "rails/callback-knot",
  enemyName: L("CALLBACK KNOT", "NUDO DE CALLBACKS", "コールバック結び"),
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
      prompt: L("Rails: callbacks when creating a record", "Rails: callbacks al crear un registro", "Rails：作成時のコールバック順"),
      lines: ["before_validation", "after_validation", "before_save", "before_create", "after_create", "after_save"],
      explain: L("Rails Guides: validation first, then save wraps create. after_commit comes last, once the row is committed.", "Guías de Rails: primero la validación, luego save envuelve a create. after_commit va al final, tras el commit.", "Rails ガイド：まず検証、save が create を包む。after_commit はコミット後の最後。"),
    },
    {
      kind: "pick",
      prompt: L("Rails: throw :abort in before_save, then save!", "Rails: throw :abort en before_save y luego save!", "Rails：before_save で abort、save! は？"),
      code: "post.save! # => ___",
      options: [L("raises RecordNotSaved", "lanza RecordNotSaved", "RecordNotSaved を発生"), L("returns false", "devuelve false", "false を返す")],
      answer: 0,
      explain: L("Rails Guides: a halted chain makes save return false and save! raise ActiveRecord::RecordNotSaved.", "Guías de Rails: una cadena detenida hace que save devuelva false y save! lance ActiveRecord::RecordNotSaved.", "Rails ガイド：チェーンが止まると save は false、save! は ActiveRecord::RecordNotSaved。"),
    },
    {
      kind: "pick",
      prompt: L("Rails: email only once the row is committed", "Rails: email solo tras el commit de la fila", "Rails：コミット後にだけメール送信"),
      code: "class User < ApplicationRecord\n  ___ :send_welcome_email, on: :create\nend",
      options: ["after_commit", "before_save"],
      answer: 0,
      explain: L("Rails Guides: after_commit runs after the transaction commits, so a rollback never sends a stray email.", "Guías de Rails: after_commit corre tras el commit, así un rollback nunca manda un email perdido.", "Rails ガイド：after_commit はコミット後に動く。ロールバックで誤送信しない。"),
    },
    {
      kind: "pick",
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
      prompt: L("Rails: add before_save from a concern", "Rails: agregar before_save desde un concern", "Rails：concern から before_save を足す"),
      code: "module Sluggable\n  extend ActiveSupport::Concern\n  ___\n    before_save :set_slug\n  end\nend",
      options: ["included do", "class_methods do"],
      answer: 0,
      explain: L("Rails API: included do runs in the including class, so macros like before_save go there.", "API de Rails: included do corre dentro de la clase que lo incluye, así que macros como before_save van ahí.", "Rails API：included do は include したクラスの中で動く。before_save などはそこへ。"),
    },
    {
      kind: "run",
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
const boss: LessonDef = {
  slug: "n-plus-one-hydra",
  title: L("The N+1 hydra", "La hidra N+1", "N+1 ヒドラ"),
  concept: "n-plus-one",
  mode: "boss",
  xp: 180,
  enemy: "rails/n-plus-one",
  enemyName: L("N+1 HYDRA", "HIDRA N+1", "N+1 ヒドラ"),
  beats: [
    enemySays(L(
      "I AM THE N+1 HYDRA. Ask me for one author and I grow a head per post. Count your trips, little engine!",
      "SOY LA HIDRA N+1. Pídeme un autor y me crece una cabeza por post. ¡Cuenta tus viajes, locomotora!",
      "我は N+1 ヒドラ。著者を1人聞くたび、投稿ごとに首が生える。往復を数えよ、小さな機関車！",
    )),
    {
      kind: "predict",
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
      time: 15,
      prompt: L("Rails: filter by author name AND load authors", "Rails: filtrar por nombre de autor Y cargarlos", "Rails：著者名で絞りつつ著者も読む"),
      code: "Post.___(:author).where(authors: {name: \"Ada\"})",
      options: ["eager_load", "preload"],
      answer: 0,
      explain: L("Rails Guides: eager_load joins authors into the same query, so where can use their columns. preload can't.", "Guías de Rails: eager_load une authors en la misma consulta, así where usa sus columnas. preload no puede.", "Rails ガイド：eager_load は同じクエリで JOIN するので where で著者列を使える。preload は無理。"),
    },
    {
      kind: "predict",
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
      time: 12,
      prompt: L("Rails: counter_cache on Comment needs…", "Rails: counter_cache en Comment necesita…", "Rails：Comment の counter_cache に必要なのは"),
      code: "belongs_to :post, counter_cache: true\n# needs the column ___",
      options: ["posts.comments_count", "comments.count"],
      answer: 0,
      explain: L("Rails Guides: the count lives on the parent: a comments_count column on posts.", "Guías de Rails: el conteo vive en el padre: una columna comments_count en posts.", "Rails ガイド：数は親に置く。posts の comments_count 列。"),
    },
    {
      kind: "predict",
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
      time: 15,
      prompt: L("Rails: dependent: :delete_all vs :destroy", "Rails: dependent: :delete_all vs :destroy", "Rails：:delete_all と :destroy の違い"),
      code: "has_many :comments, dependent: :delete_all\n# compared to :destroy: ___",
      options: [L("skips the comments' callbacks", "salta los callbacks de los comments", "コメントのコールバックを飛ばす"), L("exactly the same", "exactamente igual", "まったく同じ")],
      answer: 0,
      explain: L("Rails Guides: :delete_all removes children with one SQL DELETE; :destroy loads each one and runs its callbacks.", "Guías de Rails: :delete_all borra los hijos con un DELETE SQL; :destroy carga cada uno y corre sus callbacks.", "Rails ガイド：:delete_all は SQL の DELETE 1回、:destroy は1件ずつ読みコールバックを実行。"),
    },
    {
      kind: "type",
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
