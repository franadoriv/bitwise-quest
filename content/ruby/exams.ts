import type { ExamDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Entry exams that simulate company screenings for Ruby roles (core Ruby; Rails is its own moon).
// Topics, levels and bank sizes follow docs/research/ruby-curriculum.md ("Entry exams") and
// docs/research/ruby-hiring-assessments.md. Every runtime claim carries a `check` run on Ruby 3.4
// (Compiler Explorer): `npm run content:verify -- --lang=ruby --only=exam:`.

const code = (...lines: string[]) => lines.join("\n");

const PRINTS = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");

export const exams: ExamDef[] = [
  // ─── JUNIOR ───────────────────────────────────────────────────────────────
  {
    slug: "junior",
    level: "junior",
    title: L("Junior Ruby Developer", "Ruby Developer Junior", "ジュニア Ruby 開発者"),
    description: L(
      "Online skills test for a junior Ruby role: objects, strings, truthiness, methods, arrays, hashes, blocks.",
      "Test en línea para un puesto junior de Ruby: objetos, strings, veracidad, métodos, arrays, hashes y bloques.",
      "ジュニア Ruby 職のオンライン試験：オブジェクト、文字列、真偽値、メソッド、配列、ハッシュ、ブロック。",
    ),
    count: 12,
    passPct: 70,
    secondsPerQuestion: 30,
    questions: [
      // basics
      {
        topic: "basics", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: `p [42.class, "hi".class, nil.class]`,
        options: ["[Integer, String, NilClass]", "[Number, String, nil]", "[Integer, String, nil]"], answer: 0,
        explain: L(
          "Everything is an object with a class, even nil: it is the only instance of NilClass.",
          "Todo es un objeto con una clase, incluso nil: es la única instancia de NilClass.",
          "すべてはクラスを持つオブジェクト。nil も NilClass のただ一つのインスタンスだよ。",
        ),
        check: { compiles: true, stdout: "[Integer, String, NilClass]" },
      },
      {
        topic: "basics", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(`x = 10`, `x = "ten"`, `p x.class`),
        options: ["String", "Integer", "TypeError"], answer: 0,
        explain: L(
          "Variables have no type; they are names for objects. x now points to a String.",
          "Las variables no tienen tipo; son nombres para objetos. Ahora x apunta a un String.",
          "変数に型はなく、オブジェクトに付けた名前。x は今 String を指しているよ。",
        ),
        check: { compiles: true, stdout: "String" },
      },
      {
        topic: "basics", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(`a = "gem"`, `b = a`, `b << "s"`, `p a`),
        options: [`"gem"`, `"gems"`, `"gemss"`], answer: 1,
        explain: L(
          "b = a copies no object: both names point to the same String, and << changes it in place.",
          "b = a no copia nada: ambos nombres apuntan al mismo String, y << lo modifica en su lugar.",
          "b = a はコピーしない。2つの名前が同じ String を指し、<< はその場で変更するよ。",
        ),
        check: { compiles: true, stdout: `"gems"` },
      },
      // strings
      {
        topic: "strings", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: `p [-9 / 2, 9 % 4]`,
        options: ["[-4, 1]", "[-5, 1]", "[-4.5, 1]"], answer: 1,
        explain: L(
          "Integer / Integer gives an Integer rounded toward minus infinity: -4.5 floors to -5.",
          "Integer / Integer da un Integer redondeado hacia menos infinito: -4.5 baja a -5.",
          "整数同士の / は負の無限大方向に丸めた整数。-4.5 は -5 になるよ。",
        ),
        check: { compiles: true, stdout: "[-5, 1]" },
      },
      {
        topic: "strings", difficulty: 1, kind: "pick", prompt: L("Print Hi Ana", "Imprime Hi Ana", "Hi Ana と表示しよう"),
        code: code(`name = "Ana"`, `puts ___`),
        options: [`"Hi #{name}"`, `'Hi #{name}'`], answer: 0,
        explain: L(
          "Interpolation #{} only works in double quotes. Single quotes keep the text exactly as written.",
          "La interpolación #{} solo funciona con comillas dobles. Las simples dejan el texto tal cual.",
          "#{} の埋め込みはダブルクォートだけ。シングルクォートは書いたまま表示するよ。",
        ),
        check: { compiles: true, stdout: "Hi Ana" },
      },
      {
        topic: "strings", difficulty: 2, kind: "pick", prompt: L("Pick the value that prints true", "Elige el valor que imprime true", "true と表示される値を選ぼう"),
        code: code(`id = ___`, `p id.equal?(:hero) && id.frozen?`),
        options: [":hero", `"hero"`], answer: 0,
        explain: L(
          "A symbol is one unique, frozen object per name. Each string literal is a new, mutable String.",
          "Un símbolo es un único objeto congelado por nombre. Cada literal de string es un String nuevo y mutable.",
          "シンボルは名前ごとに1つだけの凍結オブジェクト。文字列リテラルは毎回新しい変更可能な String だよ。",
        ),
        check: { compiles: true, stdout: "true" },
      },
      {
        topic: "strings", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code(`lives = 3`, `puts "Lives: " + lives`),
        options: ["Lives: 3", "TypeError", "Lives: "], answer: 1,
        explain: L(
          "String#+ never converts: adding an Integer raises TypeError. Use interpolation or lives.to_s.",
          "String#+ nunca convierte: sumar un Integer lanza TypeError. Usa interpolación o lives.to_s.",
          "String#+ は自動変換しないので TypeError。埋め込みか lives.to_s を使おう。",
        ),
        check: { compiles: true, throws: "TypeError" },
      },
      // control
      {
        topic: "control", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(`items = []`, `if items`, `  puts "truthy"`, `else`, `  puts "falsy"`, `end`),
        options: ["truthy", "falsy"], answer: 0,
        explain: L(
          "Only nil and false are falsy in Ruby. An empty array, 0 and \"\" are all truthy.",
          "En Ruby solo nil y false son falsy. Un array vacío, 0 y \"\" son truthy.",
          "Ruby で偽になるのは nil と false だけ。空配列も 0 も \"\" も真だよ。",
        ),
        check: { compiles: true, stdout: "truthy" },
      },
      {
        topic: "control", difficulty: 2, kind: "pick", prompt: L("Set hp only if it is nil", "Asigna hp solo si es nil", "nil のときだけ hp に代入"),
        code: code(`hp = nil`, `hp ___ 10`, `hp ||= 20`, `p hp`),
        options: ["||=", "&&=", "+="], answer: 0,
        explain: L(
          "a ||= b assigns only when a is nil or false, so the second ||= keeps 10.",
          "a ||= b asigna solo si a es nil o false, así que el segundo ||= conserva el 10.",
          "a ||= b は a が nil か false のときだけ代入。2回目の ||= では 10 のままだよ。",
        ),
        check: { compiles: true, stdout: "10" },
      },
      {
        topic: "control", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(`ready = true and false`, `p ready`),
        options: ["true", "false", "nil"], answer: 0,
        explain: L(
          "and binds looser than =, so this is (ready = true) and false. Use && inside expressions.",
          "and tiene menor precedencia que =, así que es (ready = true) and false. Usa && en expresiones.",
          "and は = より優先度が低く (ready = true) and false になる。式の中では && を使おう。",
        ),
        check: { compiles: true, stdout: "true" },
      },
      // methods
      {
        topic: "methods", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(`def double(n)`, `  n * 2`, `  n + 1`, `end`, `p double(5)`),
        options: ["10", "6", "nil"], answer: 1,
        explain: L(
          "A method returns the value of its last expression; n * 2 is computed and thrown away.",
          "Un método devuelve el valor de su última expresión; n * 2 se calcula y se descarta.",
          "メソッドは最後の式の値を返す。n * 2 は計算されても捨てられるよ。",
        ),
        check: { compiles: true, stdout: "6" },
      },
      {
        topic: "methods", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code(`def heal(hp, amount = 5) = hp + amount`, `p heal(1, 2, 3)`),
        options: ["6", "3", "ArgumentError"], answer: 2,
        explain: L(
          "heal takes 1 or 2 arguments. Three raise ArgumentError: wrong number of arguments (given 3, expected 1..2).",
          "heal acepta 1 o 2 argumentos. Con tres lanza ArgumentError: wrong number of arguments (given 3, expected 1..2).",
          "heal の引数は1〜2個。3個だと ArgumentError（given 3, expected 1..2）になるよ。",
        ),
        check: { compiles: true, throws: "ArgumentError" },
      },
      {
        topic: "methods", difficulty: 2, kind: "type", prompt: L("Accept any number of arguments", "Acepta cualquier número de argumentos", "いくつでも引数を受け取ろう"),
        code: code(`def total(___nums)`, `  nums.sum`, `end`, `puts total(1, 2, 3)`),
        answer: "*",
        explain: L(
          "A splat parameter *nums collects all positional arguments into an Array.",
          "Un parámetro splat *nums junta todos los argumentos posicionales en un Array.",
          "スプラット引数 *nums は位置引数をまとめて Array にするよ。",
        ),
        check: { compiles: true, stdout: "6" },
      },
      {
        topic: "methods", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(`def shout(s)`, `  s.upcase!`, `end`, `word = "hey"`, `shout(word)`, `puts word`),
        options: ["hey", "HEY", "nil"], answer: 1,
        explain: L(
          "The method gets a reference to the same String, and upcase! mutates it, so the caller sees HEY.",
          "El método recibe una referencia al mismo String, y upcase! lo modifica, así que afuera se ve HEY.",
          "メソッドには同じ String への参照が渡り、upcase! が変更するので呼び出し側も HEY になるよ。",
        ),
        check: { compiles: true, stdout: "HEY" },
      },
      // arrays
      {
        topic: "arrays", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(`a = [10, 20, 30, 40]`, `p [a[-1], a[1..2]]`),
        options: ["[40, [20, 30]]", "[10, [10, 20]]", "[40, [20, 30, 40]]"], answer: 0,
        explain: L(
          "Negative indexes count from the end, and a range index returns a sub-array (1..2 includes 2).",
          "Los índices negativos cuentan desde el final, y un rango devuelve un subarray (1..2 incluye el 2).",
          "負の添字は末尾から数える。範囲の添字は部分配列を返し、1..2 は 2 を含むよ。",
        ),
        check: { compiles: true, stdout: "[40, [20, 30]]" },
      },
      {
        topic: "arrays", difficulty: 1, kind: "pick", prompt: L("Print [1, 3, 4]", "Imprime [1, 3, 4]", "[1, 3, 4] と表示しよう"),
        code: `p [4, 1, 3].___`,
        options: ["sort", "reverse", "max"], answer: 0,
        explain: L(
          "sort returns a new sorted Array; reverse only flips the order and max returns one element.",
          "sort devuelve un Array nuevo ordenado; reverse solo invierte y max devuelve un elemento.",
          "sort は並べ替えた新しい配列を返す。reverse は逆順、max は要素1つだけだよ。",
        ),
        check: { compiles: true, stdout: "[1, 3, 4]" },
      },
      {
        topic: "arrays", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(`grid = Array.new(2, [])`, `grid[0] << :x`, `p grid`),
        options: ["[[:x], []]", "[[:x], [:x]]", "[:x, []]"], answer: 1,
        explain: L(
          "Array.new(2, []) puts the SAME array in both slots. Use Array.new(2) { [] } for separate ones.",
          "Array.new(2, []) pone el MISMO array en ambas posiciones. Usa Array.new(2) { [] } para tener dos.",
          "Array.new(2, []) は同じ配列を2か所に入れる。別々にするなら Array.new(2) { [] } だよ。",
        ),
        check: { compiles: true, stdout: "[[:x], [:x]]" },
      },
      // hashes
      {
        topic: "hashes", difficulty: 1, kind: "order", prompt: L("Order it to print 2", "Ordénalo para imprimir 2", "2 と表示される順に並べよう"),
        lines: ["stock = {}", "stock[:potion] = 3", "stock[:potion] -= 1", "puts stock[:potion]"],
        explain: L(
          "Create the hash, store 3 under :potion, subtract 1, then read it. -= on a missing key would fail on nil.",
          "Crea el hash, guarda 3 en :potion, resta 1 y luego lee. -= sobre una clave ausente fallaría con nil.",
          "ハッシュを作り、:potion に 3 を入れ、1 引いて読む。無いキーに -= すると nil で失敗するよ。",
        ),
        check: { compiles: true, stdout: "2" },
      },
      {
        topic: "hashes", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code(`prices = {apple: 3}`, `p prices.fetch(:pear)`),
        options: ["nil", "0", "KeyError"], answer: 2,
        explain: L(
          "hash[:pear] would return nil, but fetch raises KeyError for a missing key. Pass a default: fetch(:pear, 0).",
          "hash[:pear] daría nil, pero fetch lanza KeyError si falta la clave. Pasa un valor: fetch(:pear, 0).",
          "hash[:pear] なら nil だが、fetch は無いキーで KeyError。fetch(:pear, 0) で既定値を渡せるよ。",
        ),
        check: { compiles: true, throws: "KeyError" },
      },
      {
        topic: "hashes", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(`count = Hash.new(0)`, `"pepper".each_char { |c| count[c] += 1 }`, `p count`),
        options: [`{"p" => 3, "e" => 2, "r" => 1}`, `{"p" => 1, "e" => 1, "r" => 1}`, `{p: 3, e: 2, r: 1}`], answer: 0,
        explain: L(
          "Hash.new(0) returns 0 for missing keys, so += 1 counts. Keys are strings and keep insertion order.",
          "Hash.new(0) devuelve 0 para claves ausentes, así += 1 cuenta. Las claves son strings y mantienen el orden.",
          "Hash.new(0) は無いキーで 0 を返すので += 1 で数えられる。キーは文字列で挿入順を保つよ。",
        ),
        check: { compiles: true, stdout: `{"p" => 3, "e" => 2, "r" => 1}` },
      },
      // blocks
      {
        topic: "blocks", difficulty: 1, kind: "type", prompt: L("Run the block twice", "Ejecuta el bloque dos veces", "ブロックを2回実行しよう"),
        code: code(`def twice`, `  ___`, `  yield`, `end`, `twice { print "hi " }`, `puts`),
        answer: "yield",
        explain: L(
          "yield calls the block passed to the method. Each yield runs it once.",
          "yield llama al bloque que recibió el método. Cada yield lo ejecuta una vez.",
          "yield はメソッドに渡されたブロックを呼ぶ。yield 1回で1回実行されるよ。",
        ),
        check: { compiles: true, stdout: "hi hi" },
      },
      {
        topic: "blocks", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(`def maybe`, `  return "no block" unless block_given?`, `  yield`, `end`, `p [maybe, maybe { "ran" }]`),
        options: [`["no block", "ran"]`, `[nil, "ran"]`, "LocalJumpError"], answer: 0,
        explain: L(
          "block_given? tells whether a block came with the call, so the method can avoid yielding to nothing.",
          "block_given? indica si la llamada trae un bloque, así el método evita hacer yield sin bloque.",
          "block_given? で呼び出しにブロックがあるか分かる。無いのに yield するのを防げるよ。",
        ),
        check: { compiles: true, stdout: `["no block", "ran"]` },
      },
    ],
  },

  // ─── MID ──────────────────────────────────────────────────────────────────
  {
    slug: "mid",
    level: "mid",
    title: L("Mid-level Ruby Developer", "Ruby Developer Semi Senior", "ミドル Ruby 開発者"),
    description: L(
      "Technical screen for a mid-level Ruby role: blocks and lambdas, Enumerable, classes, mixins, equality, errors, tests.",
      "Evaluación técnica para un puesto semi senior de Ruby: lambdas, Enumerable, clases, mixins, igualdad, errores y tests.",
      "ミドル Ruby 職の技術選考：ラムダ、Enumerable、クラス、Mixin、等価性、例外、テスト。",
    ),
    count: 14,
    passPct: 70,
    secondsPerQuestion: 40,
    questions: [
      // hashes
      {
        topic: "hashes", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(`bags = Hash.new([])`, `bags[:ann] << "map"`, `p [bags.size, bags[:bob]]`),
        options: [`[1, []]`, `[0, ["map"]]`, `[1, ["map"]]`], answer: 1,
        explain: L(
          "Hash.new([]) shares ONE default array and << never stores a key. Use Hash.new { |h, k| h[k] = [] }.",
          "Hash.new([]) comparte UN solo array por defecto y << no guarda la clave. Usa Hash.new { |h, k| h[k] = [] }.",
          "Hash.new([]) は既定の配列1つを共有し、<< はキーを保存しない。Hash.new { |h, k| h[k] = [] } を使おう。",
        ),
        check: { compiles: true, stdout: `[0, ["map"]]` },
      },
      {
        topic: "hashes", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(`scores = {ana: 3, bo: 9, cy: 5}`, `p scores.sort_by { |_, v| -v }.first(2).to_h`),
        options: ["{bo: 9, cy: 5}", "{ana: 3, cy: 5}", "[[:bo, 9], [:cy, 5]]"], answer: 0,
        explain: L(
          "sort_by yields [key, value] pairs and returns an array of pairs; to_h turns them back into a hash.",
          "sort_by recibe pares [clave, valor] y devuelve un array de pares; to_h los vuelve a convertir en hash.",
          "sort_by は [キー, 値] の組を受け取り組の配列を返す。to_h でハッシュに戻るよ。",
        ),
        check: { compiles: true, stdout: "{bo: 9, cy: 5}" },
      },
      // blocks
      {
        topic: "blocks", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code(`greet = ->(name) { "hi #{name}" }`, `p greet.call("a", "b")`),
        options: [`"hi a"`, `"hi ab"`, "ArgumentError"], answer: 2,
        explain: L(
          "Lambdas check arity like methods, so extra arguments raise ArgumentError. A proc would ignore them.",
          "Las lambdas revisan la aridad como los métodos: los argumentos de más lanzan ArgumentError. Un proc los ignora.",
          "ラムダはメソッドと同じく引数の数を検査し、多すぎると ArgumentError。proc なら無視するよ。",
        ),
        check: { compiles: true, throws: "ArgumentError" },
      },
      {
        topic: "blocks", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(`def pick`, `  finder = -> { return :lambda }`, `  finder.call`, `  :method`, `end`, `p pick`),
        options: [":lambda", ":method", "LocalJumpError"], answer: 1,
        explain: L(
          "return inside a lambda only leaves the lambda. Inside a proc it would return from pick itself.",
          "return dentro de una lambda solo sale de la lambda. En un proc saldría del propio pick.",
          "ラムダ内の return はラムダから抜けるだけ。proc なら pick 自体から return するよ。",
        ),
        check: { compiles: true, stdout: ":method" },
      },
      {
        topic: "blocks", difficulty: 2, kind: "type", prompt: L("Turn the symbol into a block", "Convierte el símbolo en bloque", "シンボルをブロックに変えよう"),
        code: `p %w[ox cat].map(___upcase)`,
        answer: "&:",
        explain: L(
          "&:upcase calls Symbol#to_proc, the same as { |w| w.upcase }.",
          "&:upcase llama a Symbol#to_proc, igual que { |w| w.upcase }.",
          "&:upcase は Symbol#to_proc を呼び、{ |w| w.upcase } と同じになるよ。",
        ),
        check: { compiles: true, stdout: `["OX", "CAT"]` },
      },
      // enumerable
      {
        topic: "enumerable", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(`result = [1, 2, 3].each { |x| x * 10 }`, `p result`),
        options: ["[10, 20, 30]", "[1, 2, 3]", "nil"], answer: 1,
        explain: L(
          "each is for side effects and returns the receiver. Use map to collect the block's results.",
          "each sirve para efectos y devuelve el receptor. Usa map para juntar los resultados del bloque.",
          "each は副作用用でレシーバ自身を返す。ブロックの結果を集めるなら map だよ。",
        ),
        check: { compiles: true, stdout: "[1, 2, 3]" },
      },
      {
        topic: "enumerable", difficulty: 1, kind: "pick", prompt: L("Print 12", "Imprime 12", "12 と表示しよう"),
        code: `p [3, 4, 5].___(0) { |acc, x| acc + x }`,
        options: ["reduce", "map", "select"], answer: 0,
        explain: L(
          "reduce (alias inject) folds the list into one value, starting from the given 0.",
          "reduce (alias inject) pliega la lista en un solo valor, empezando desde el 0 dado.",
          "reduce（別名 inject）は初期値 0 から始めて、リストを1つの値にまとめるよ。",
        ),
        check: { compiles: true, stdout: "12" },
      },
      {
        topic: "enumerable", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(`words = %w[ant ape bee cat]`, `p words.group_by { |w| w[0] }.transform_values(&:size)`),
        options: [`{"a" => 2, "b" => 1, "c" => 1}`, `{"a" => ["ant", "ape"], "b" => ["bee"], "c" => ["cat"]}`, `[2, 1, 1]`], answer: 0,
        explain: L(
          "group_by builds a hash of arrays keyed by the block's result; transform_values maps each array to its size.",
          "group_by arma un hash de arrays con el resultado del bloque como clave; transform_values pasa cada array a su tamaño.",
          "group_by はブロックの結果をキーにした配列のハッシュを作り、transform_values で各配列を長さに変えるよ。",
        ),
        check: { compiles: true, stdout: `{"a" => 2, "b" => 1, "c" => 1}` },
      },
      {
        topic: "enumerable", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(`evens, odds = (1..7).partition(&:even?)`, `p [evens.sum, odds.size]`),
        options: ["[12, 4]", "[16, 3]", "[12, 3]"], answer: 0,
        explain: L(
          "partition returns two arrays: [2, 4, 6] where the block is truthy and [1, 3, 5, 7] where it is not.",
          "partition devuelve dos arrays: [2, 4, 6] donde el bloque es truthy y [1, 3, 5, 7] donde no.",
          "partition は2つの配列を返す。ブロックが真の [2, 4, 6] と偽の [1, 3, 5, 7] だよ。",
        ),
        check: { compiles: true, stdout: "[12, 4]" },
      },
      // classes
      {
        topic: "classes", difficulty: 1, kind: "type", prompt: L("Add a reader and a writer for hp", "Agrega lector y escritor de hp", "hp の読み書きメソッドを追加しよう"),
        code: code(`class Hero`, `  ___ :hp`, `  def initialize = @hp = 10`, `end`, `h = Hero.new`, `h.hp += 5`, `p h.hp`),
        answer: "attr_accessor",
        explain: L(
          "attr_accessor defines hp and hp=. attr_reader would give no writer, so h.hp += 5 would fail.",
          "attr_accessor define hp y hp=. attr_reader no daría escritor, así que h.hp += 5 fallaría.",
          "attr_accessor は hp と hp= を定義する。attr_reader だと書き込めず h.hp += 5 が失敗するよ。",
        ),
        check: { compiles: true, stdout: "15" },
      },
      {
        topic: "classes", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code(`class Vault`, `  def reveal = "code #{pin}"`, `  private`, `  def pin = 42`, `end`, `v = Vault.new`, `puts v.reveal`, `puts v.pin`),
        options: [
          L("Prints code 42, then 42", "Imprime code 42 y luego 42", "code 42、次に 42 と表示"),
          L("Prints code 42, then NoMethodError", "Imprime code 42 y luego NoMethodError", "code 42 の後 NoMethodError"),
          L("NoMethodError right away", "NoMethodError de inmediato", "すぐに NoMethodError"),
        ],
        answer: 1,
        explain: L(
          "A private method can be called inside the class without a receiver, but v.pin from outside raises NoMethodError.",
          "Un método privado se llama dentro de la clase sin receptor, pero v.pin desde afuera lanza NoMethodError.",
          "private メソッドはクラス内でレシーバなしなら呼べるが、外から v.pin は NoMethodError だよ。",
        ),
        check: { compiles: true, throws: "NoMethodError" },
      },
      {
        topic: "classes", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(`class Base`, `  @count = 0`, `  class << self`, `    attr_accessor :count`, `  end`, `end`, `class Kid < Base; end`, `p [Base.count, Kid.count]`),
        options: ["[0, 0]", "[0, nil]", "NoMethodError"], answer: 1,
        explain: L(
          "@count in the class body belongs to the Base object only. Kid inherits the accessor, not the value. @@ would be shared.",
          "@count en el cuerpo de la clase es solo del objeto Base. Kid hereda el accesor, no el valor. @@ sí se compartiría.",
          "クラス本体の @count は Base だけのもの。Kid はアクセサを継承するが値はない。@@ なら共有されるよ。",
        ),
        check: { compiles: true, stdout: "[0, nil]" },
      },
      {
        topic: "classes", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(`class Animal`, `  def speak(word = "...") = "#{word}!"`, `end`, `class Dog < Animal`, `  def speak(word) = "Dog: " + super`, `end`, `puts Dog.new.speak("woof")`),
        options: ["Dog: woof!", "Dog: ...!", "ArgumentError"], answer: 0,
        explain: L(
          "Bare super passes the same arguments to the parent method. super() would pass none and use the default.",
          "super sin paréntesis pasa los mismos argumentos al método padre. super() no pasaría ninguno y usaría el default.",
          "括弧なしの super は同じ引数を親へ渡す。super() なら引数なしで既定値が使われるよ。",
        ),
        check: { compiles: true, stdout: "Dog: woof!" },
      },
      // modules
      {
        topic: "modules", difficulty: 1, kind: "pick", prompt: L("Give every Duck the swim skill", "Da a cada Duck la habilidad swim", "すべての Duck に swim を持たせよう"),
        code: code(`module Swim`, `  def swim = "splash"`, `end`, `class Duck`, `  ___ Swim`, `end`, `puts Duck.new.swim`),
        options: ["include", "extend", "require"], answer: 0,
        explain: L(
          "include mixes the module's methods into instances. extend would add them to the Duck class object only.",
          "include mezcla los métodos del módulo en las instancias. extend los agregaría solo al objeto clase Duck.",
          "include はモジュールのメソッドをインスタンスに混ぜる。extend だとクラス Duck 自体にだけ付くよ。",
        ),
        check: { compiles: true, stdout: "splash" },
      },
      {
        topic: "modules", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(`module Armor; end`, `module Glow; end`, `class Knight`, `  include Armor`, `  prepend Glow`, `end`, `p Knight.ancestors.first(3)`),
        options: ["[Glow, Knight, Armor]", "[Knight, Armor, Glow]", "[Knight, Glow, Armor]"], answer: 0,
        explain: L(
          "prepend puts the module BEFORE the class in the lookup chain; include puts it right after.",
          "prepend pone el módulo ANTES de la clase en la cadena de búsqueda; include lo pone justo después.",
          "prepend はメソッド探索でクラスより前に、include はクラスのすぐ後ろに入るよ。",
        ),
        check: { compiles: true, stdout: "[Glow, Knight, Armor]" },
      },
      {
        topic: "modules", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(`module Tools`, `  def hammer = "bang"`, `end`, `class Shed`, `  extend Tools`, `end`, `p [Shed.respond_to?(:hammer), Shed.new.respond_to?(:hammer)]`),
        options: ["[true, false]", "[false, true]", "[true, true]"], answer: 0,
        explain: L(
          "extend adds the module's methods to one object, here the class Shed, so they act as class methods.",
          "extend agrega los métodos del módulo a un solo objeto, aquí la clase Shed, así que actúan como métodos de clase.",
          "extend は1つのオブジェクト（ここではクラス Shed）にメソッドを足すので、クラスメソッドになるよ。",
        ),
        check: { compiles: true, stdout: "[true, false]" },
      },
      {
        topic: "modules", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          `class Coin`,
          `  include Comparable`,
          `  attr_reader :v`,
          `  def initialize(v) = @v = v`,
          `  def <=>(other) = v <=> other.v`,
          `end`,
          `a, b = Coin.new(5), Coin.new(9)`,
          `p [a < b, [b, a].max.v, a.between?(a, b)]`,
        ),
        options: ["[true, 9, true]", "[true, 5, false]", "NoMethodError"], answer: 0,
        explain: L(
          "Defining <=> and including Comparable gives <, >, between? and clamp; max also uses <=>.",
          "Definir <=> e incluir Comparable da <, >, between? y clamp; max también usa <=>.",
          "<=> を定義して Comparable を include すると <、>、between?、clamp が使える。max も <=> を使うよ。",
        ),
        check: { compiles: true, stdout: "[true, 9, true]" },
      },
      // equality
      {
        topic: "equality", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(`a = "hi"`, `b = "hi"`, `p [a == b, a.equal?(b), a.eql?(b)]`),
        options: ["[true, false, true]", "[true, true, true]", "[true, false, false]"], answer: 0,
        explain: L(
          "== and eql? compare content; equal? checks identity, and these are two different String objects.",
          "== y eql? comparan contenido; equal? revisa identidad, y aquí hay dos objetos String distintos.",
          "== と eql? は中身を比べ、equal? は同一オブジェクトか調べる。ここは別々の String だよ。",
        ),
        check: { compiles: true, stdout: "[true, false, true]" },
      },
      {
        topic: "equality", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(`s = "ice".freeze`, `p [s.dup.frozen?, s.clone.frozen?]`),
        options: ["[false, true]", "[true, true]", "[false, false]"], answer: 0,
        explain: L(
          "dup copies the content only; clone also keeps the frozen state and singleton methods.",
          "dup copia solo el contenido; clone también conserva el estado congelado y los métodos singleton.",
          "dup は中身だけをコピー。clone は凍結状態や特異メソッドも引き継ぐよ。",
        ),
        check: { compiles: true, stdout: "[false, true]" },
      },
      // exceptions
      {
        topic: "exceptions", difficulty: 1, kind: "order", prompt: L("Order it: bad number, then cleanup", "Ordena: bad number y luego cleanup", "bad number、cleanup の順に表示"),
        lines: ["begin", `  Integer("x")`, "rescue ArgumentError", `  puts "bad number"`, "ensure", `  puts "cleanup"`, "end"],
        explain: L(
          "begin wraps risky code, rescue handles the error, and ensure always runs last, error or not.",
          "begin envuelve el código riesgoso, rescue maneja el error y ensure siempre corre al final, haya error o no.",
          "begin で危ないコードを囲み、rescue でエラーを処理。ensure はエラーの有無に関係なく最後に実行されるよ。",
        ),
        check: { compiles: true, stdout: "bad number\ncleanup" },
      },
      {
        topic: "exceptions", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          `class AppError < StandardError; end`,
          `class DbError < AppError; end`,
          `begin`,
          `  raise DbError, "down"`,
          `rescue AppError => e`,
          `  puts "app: #{e.message}"`,
          `rescue DbError`,
          `  puts "db"`,
          `end`,
        ),
        options: ["app: down", "db", "down"], answer: 0,
        explain: L(
          "rescue clauses are tried top to bottom and match subclasses, so AppError catches DbError first.",
          "Los rescue se prueban de arriba abajo y aceptan subclases, así que AppError atrapa primero a DbError.",
          "rescue は上から順に試され、サブクラスにも一致する。だから AppError が先に DbError を捕まえるよ。",
        ),
        check: { compiles: true, stdout: "app: down" },
      },
      {
        topic: "exceptions", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code(`begin`, `  raise Exception, "fatal"`, `rescue => e`, `  puts "caught"`, `end`, `puts "after"`),
        options: [
          L("Prints caught, then after", "Imprime caught y luego after", "caught、after と表示"),
          L("Crashes: Exception is not rescued", "Falla: Exception no se rescata", "Exception は捕まらず異常終了"),
          L("Prints only after", "Imprime solo after", "after だけ表示"),
        ],
        answer: 1,
        explain: L(
          "A bare rescue only catches StandardError. Exception is its parent, so it escapes. Custom errors inherit StandardError.",
          "Un rescue sin clase solo atrapa StandardError. Exception es su padre, así que escapa. Los errores propios heredan StandardError.",
          "クラス指定なしの rescue は StandardError だけを捕まえる。親の Exception は素通り。独自例外は StandardError を継承しよう。",
        ),
        check: { compiles: true, throws: "(Exception)" },
      },
      // testing
      {
        topic: "testing", difficulty: 2, kind: "predict", prompt: L("Which failure does Minitest report?", "¿Qué fallo reporta Minitest?", "Minitest はどんな失敗を報告する？"),
        code: code(
          `def last_item(list) = list[0]`,
          ``,
          `class LastTest < Minitest::Test`,
          `  def test_last`,
          `    assert_equal 3, last_item([1, 2, 3])`,
          `  end`,
          `end`,
        ),
        options: ["Expected: 3 / Actual: 1", "Expected: 1 / Actual: 3", "0 failures"], answer: 0,
        explain: L(
          "assert_equal takes the expected value first and the actual value second, and reports both on failure.",
          "assert_equal recibe primero el valor esperado y luego el real, y muestra ambos si falla.",
          "assert_equal は期待値が先、実際の値が後。失敗すると両方を表示するよ。",
        ),
        check: {
          compiles: true,
          stdout: "Expected: 3 / Actual: 1",
          program: code(
            `require "minitest"`,
            `def last_item(list) = list[0]`,
            `class LastTest < Minitest::Test`,
            `  def test_last`,
            `    assert_equal 3, last_item([1, 2, 3])`,
            `  end`,
            `end`,
            `t = LastTest.new(:test_last)`,
            `t.run`,
            `puts t.failures.first.message.lines.map(&:strip).join(" / ")`,
          ),
        },
      },
      {
        topic: "testing", difficulty: 1, kind: "pick", prompt: L("Assert that the block raises", "Afirma que el bloque lanza error", "ブロックが例外を出すことを確認"),
        code: code(`class BagTest < Minitest::Test`, `  def test_missing_key`, `    err = ___(KeyError) { {}.fetch(:gold) }`, `    assert_match(/gold/, err.message)`, `  end`, `end`),
        options: ["assert_raises", "assert_equal", "refute_nil"], answer: 0,
        explain: L(
          "assert_raises passes when the block raises that class and returns the exception, so you can check its message.",
          "assert_raises pasa si el bloque lanza esa clase y devuelve la excepción, para revisar su mensaje.",
          "assert_raises はブロックがその例外を出せば成功し、例外を返すのでメッセージも確認できるよ。",
        ),
        check: {
          compiles: true,
          stdout: "true",
          program: code(
            `require "minitest"`,
            `class BagTest < Minitest::Test`,
            `  def test_missing_key`,
            `    err = assert_raises(KeyError) { {}.fetch(:gold) }`,
            `    assert_match(/gold/, err.message)`,
            `  end`,
            `end`,
            `t = BagTest.new(:test_missing_key)`,
            `t.run`,
            `p t.passed?`,
          ),
        },
      },
    ],
  },

  // ─── SENIOR ───────────────────────────────────────────────────────────────
  {
    slug: "senior",
    level: "senior",
    title: L("Senior Ruby Developer", "Ruby Developer Senior", "シニア Ruby 開発者"),
    description: L(
      "Senior Ruby interview: method lookup, metaprogramming, pattern matching, threads and the GVL, performance, gems.",
      "Entrevista senior de Ruby: búsqueda de métodos, metaprogramación, pattern matching, hilos y GVL, rendimiento y gems.",
      "シニア Ruby 面接：メソッド探索、メタプログラミング、パターンマッチ、スレッドと GVL、性能、gem。",
    ),
    count: 15,
    passPct: 75,
    secondsPerQuestion: 50,
    questions: [
      // blocks
      {
        topic: "blocks", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(`def find_big(list)`, `  list.each { |x| return x if x > 2 }`, `  :none`, `end`, `p [find_big([1, 5, 3]), find_big([1])]`),
        options: ["[5, :none]", "[[1, 5, 3], :none]", "[:none, :none]"], answer: 0,
        explain: L(
          "return inside a block returns from the enclosing method, so find_big stops at the first match.",
          "return dentro de un bloque sale del método que lo contiene, así que find_big se detiene en la primera coincidencia.",
          "ブロック内の return は外側のメソッドから戻る。find_big は最初に一致した値で止まるよ。",
        ),
        check: { compiles: true, stdout: "[5, :none]" },
      },
      {
        topic: "blocks", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code(`def make_proc = proc { return 1 }`, `pr = make_proc`, `p pr.call`),
        options: ["1", "nil", "LocalJumpError"], answer: 2,
        explain: L(
          "A proc's return targets the method that created it. That method already returned, so it raises LocalJumpError.",
          "El return de un proc apunta al método que lo creó. Ese método ya terminó, así que lanza LocalJumpError.",
          "proc の return は作成元のメソッドから戻ろうとする。そのメソッドは終了済みなので LocalJumpError だよ。",
        ),
        check: { compiles: true, throws: "LocalJumpError" },
      },
      // modules
      {
        topic: "modules", difficulty: 2, kind: "pick", prompt: L("Make Loud wrap hi (print HELLO)", "Haz que Loud envuelva hi (HELLO)", "Loud で hi を包もう（HELLO）"),
        code: code(`module Loud`, `  def hi = super.upcase`, `end`, `class Bot`, `  ___ Loud`, `  def hi = "hello"`, `end`, `puts Bot.new.hi`),
        options: ["prepend", "include"], answer: 0,
        explain: L(
          "prepend puts Loud before Bot in lookup, so Loud#hi runs first and super reaches Bot#hi. With include, Bot#hi wins.",
          "prepend pone Loud antes de Bot, así Loud#hi corre primero y super llega a Bot#hi. Con include gana Bot#hi.",
          "prepend なら Loud が Bot より先に探され、super で Bot#hi に届く。include だと Bot#hi が勝つよ。",
        ),
        check: { compiles: true, stdout: "HELLO" },
      },
      {
        topic: "modules", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          `module Fire`,
          `  def element = "fire"`,
          `end`,
          `module Ice`,
          `  def element = "ice"`,
          `end`,
          `class Mage`,
          `  include Fire`,
          `  include Ice`,
          `  include Fire`,
          `end`,
          `puts Mage.new.element`,
        ),
        options: ["fire", "ice", "ArgumentError"], answer: 1,
        explain: L(
          "Including a module that is already in the ancestors does nothing, so Ice stays closest to Mage.",
          "Incluir un módulo que ya está en los ancestros no hace nada, así que Ice sigue más cerca de Mage.",
          "すでに ancestors にあるモジュールを再び include しても何も起きない。Ice が Mage に一番近いままだよ。",
        ),
        check: { compiles: true, stdout: "ice" },
      },
      {
        topic: "modules", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(`module Greet`, `  def hi = "hi"`, `end`, `class Pal`, `  include Greet`, `end`, `p [Pal.new.method(:hi).owner, Pal.include?(Greet), Pal < Greet]`),
        options: ["[Greet, true, true]", "[Pal, true, false]", "[Greet, true, false]"], answer: 0,
        explain: L(
          "method(:hi).owner shows where lookup found hi. An included module is an ancestor, so Pal < Greet is true.",
          "method(:hi).owner muestra dónde se encontró hi. Un módulo incluido es ancestro, así que Pal < Greet es true.",
          "method(:hi).owner で hi の定義元が分かる。include したモジュールは祖先なので Pal < Greet は true だよ。",
        ),
        check: { compiles: true, stdout: "[Greet, true, true]" },
      },
      // equality
      {
        topic: "equality", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          `class Pt`,
          `  attr_reader :x`,
          `  def initialize(x) = @x = x`,
          `  def ==(other) = x == other.x`,
          `end`,
          `h = {Pt.new(1) => :a}`,
          `p [Pt.new(1) == Pt.new(1), h.key?(Pt.new(1))]`,
        ),
        options: ["[true, false]", "[true, true]", "[false, false]"], answer: 0,
        explain: L(
          "Hash lookup uses hash and eql?, not ==. Value objects used as keys must define both.",
          "La búsqueda en Hash usa hash y eql?, no ==. Los objetos valor usados como clave deben definir ambos.",
          "Hash の検索は == ではなく hash と eql? を使う。キーにする値オブジェクトは両方定義しよう。",
        ),
        check: { compiles: true, stdout: "[true, false]" },
      },
      {
        topic: "equality", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(`names = ["ana"].freeze`, `names.first << "!"`, `p names`),
        options: [`["ana!"]`, `["ana"]`, "FrozenError"], answer: 0,
        explain: L(
          "freeze is shallow: the array is frozen, but the strings inside it are not. Freeze each element too.",
          "freeze es superficial: el array queda congelado, pero los strings dentro no. Congela también cada elemento.",
          "freeze は浅い。配列は凍結されても中の文字列はそのまま。要素も freeze しよう。",
        ),
        check: { compiles: true, stdout: `["ana!"]` },
      },
      // exceptions
      {
        topic: "exceptions", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          `begin`,
          `  begin`,
          `    raise "disk"`,
          `  rescue`,
          `    raise ArgumentError, "save failed"`,
          `  end`,
          `rescue => e`,
          `  p [e.message, e.cause.message]`,
          `end`,
        ),
        options: [`["save failed", "disk"]`, `["disk", "save failed"]`, `["save failed", nil]`], answer: 0,
        explain: L(
          "Raising inside a rescue sets cause to the original error automatically, so no context is lost.",
          "Lanzar dentro de un rescue guarda el error original en cause automáticamente, así no se pierde contexto.",
          "rescue 内で raise すると元の例外が自動で cause に入り、情報が失われないよ。",
        ),
        check: { compiles: true, stdout: `["save failed", "disk"]` },
      },
      {
        topic: "exceptions", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code(`def risky`, `  raise "boom"`, `ensure`, `  return :swallowed`, `end`, `p risky`),
        options: [":swallowed", "RuntimeError: boom", "nil"], answer: 0,
        explain: L(
          "An explicit return in ensure discards the pending exception. Never return from ensure.",
          "Un return explícito en ensure descarta la excepción pendiente. Nunca hagas return en ensure.",
          "ensure 内の明示的な return は進行中の例外を握りつぶす。ensure から return しないこと。",
        ),
        check: { compiles: true, stdout: ":swallowed" },
      },
      // metaprogramming
      {
        topic: "metaprogramming", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(`class Integer`, `  def minutes = self * 60`, `end`, `p 3.minutes`),
        options: ["180", "NoMethodError", "3"], answer: 0,
        explain: L(
          "Classes are open: reopening Integer adds a method to every integer. Powerful, but it is global monkey patching.",
          "Las clases están abiertas: reabrir Integer agrega un método a todo entero. Potente, pero es monkey patching global.",
          "クラスはオープン。Integer を開き直すと全整数にメソッドが増える。強力だがグローバルなモンキーパッチだよ。",
        ),
        check: { compiles: true, stdout: "180" },
      },
      {
        topic: "metaprogramming", difficulty: 2, kind: "pick", prompt: L("Reach the private method", "Llega al método privado", "private メソッドを呼ぼう"),
        code: code(`class Safe`, `  private`, `  def code = 7`, `end`, `p Safe.new.___(:code)`),
        options: ["send", "public_send"], answer: 0,
        explain: L(
          "send ignores visibility; public_send respects it and would raise NoMethodError. Prefer public_send for dynamic calls.",
          "send ignora la visibilidad; public_send la respeta y lanzaría NoMethodError. Prefiere public_send en llamadas dinámicas.",
          "send は可視性を無視し、public_send は守るので NoMethodError。動的呼び出しは public_send が安全だよ。",
        ),
        check: { compiles: true, stdout: "7" },
      },
      {
        topic: "metaprogramming", difficulty: 2, kind: "pick", prompt: L("Generate red? and blue?", "Genera red? y blue?", "red? と blue? を生成しよう"),
        code: code(
          `class Potion`,
          `  def initialize(color) = @color = color`,
          `  %w[red blue].each do |c|`,
          `    ___("#{c}?") { @color == c }`,
          `  end`,
          `end`,
          `pot = Potion.new("red")`,
          `p [pot.red?, pot.blue?]`,
        ),
        options: ["define_method", "method_missing", "alias_method"], answer: 0,
        explain: L(
          "define_method creates a real method from a block, which also closes over the loop variable c.",
          "define_method crea un método real a partir de un bloque, que además captura la variable c del ciclo.",
          "define_method はブロックから本物のメソッドを作り、ループ変数 c も閉じ込めるよ。",
        ),
        check: { compiles: true, stdout: "[true, false]" },
      },
      {
        topic: "metaprogramming", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          `class Echo`,
          `  def method_missing(name, *args)`,
          `    name.start_with?("say_") ? name.to_s.delete_prefix("say_") : super`,
          `  end`,
          `end`,
          `e = Echo.new`,
          `p [e.say_boo, e.respond_to?(:say_boo)]`,
        ),
        options: [`["boo", false]`, `["boo", true]`, "NoMethodError"], answer: 0,
        explain: L(
          "method_missing handles the call, but respond_to? stays false until you also define respond_to_missing?.",
          "method_missing atiende la llamada, pero respond_to? sigue en false hasta que defines respond_to_missing?.",
          "method_missing で呼び出せても、respond_to_missing? を定義しないと respond_to? は false のままだよ。",
        ),
        check: { compiles: true, stdout: `["boo", false]` },
      },
      {
        topic: "metaprogramming", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code(`def configure(**opts) = opts.size`, `settings = {debug: true}`, `p configure(settings)`),
        options: ["1", "0", "ArgumentError"], answer: 2,
        explain: L(
          "Since Ruby 3 a positional Hash is not turned into keywords: this raises ArgumentError. Call configure(**settings).",
          "Desde Ruby 3 un Hash posicional no se convierte en keywords: lanza ArgumentError. Llama configure(**settings).",
          "Ruby 3 から位置引数の Hash はキーワードにならず ArgumentError。configure(**settings) と呼ぼう。",
        ),
        check: { compiles: true, throws: "ArgumentError" },
      },
      // pattern_matching
      {
        topic: "pattern_matching", difficulty: 2, kind: "type", prompt: L("Compare with expected, don't rebind it", "Compara con expected sin reasignarlo", "expected を再束縛せずに比較しよう"),
        code: code(`expected = 5`, `case 7`, `in ___expected then puts "same"`, `in n then puts "got #{n}"`, `end`),
        answer: "^",
        explain: L(
          "The pin ^ matches against the variable's value. A bare name in a pattern binds anything to it.",
          "El pin ^ compara con el valor de la variable. Un nombre sin pin en un patrón captura cualquier valor.",
          "ピン ^ は変数の値と照合する。パターン内の素の名前は何でも束縛してしまうよ。",
        ),
        check: { compiles: true, stdout: "got 7" },
      },
      {
        topic: "pattern_matching", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code(`config = {name: "app"}`, `config => {port:}`, `p port`),
        options: ["nil", "NoMatchingPatternKeyError", "KeyError"], answer: 1,
        explain: L(
          "Rightward => raises when the pattern fails. A missing key gives NoMatchingPatternKeyError, a NoMatchingPatternError.",
          "=> lanza un error si el patrón falla. Una clave ausente da NoMatchingPatternKeyError, un NoMatchingPatternError.",
          "=> はパターン不一致で例外を出す。キーが無いと NoMatchingPatternError の一種 NoMatchingPatternKeyError だよ。",
        ),
        check: { compiles: true, throws: "NoMatchingPatternKeyError" },
      },
      {
        topic: "pattern_matching", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          `event = {type: "hit", dmg: 12, crit: true}`,
          `case event`,
          `in {type: "heal"} then puts "heal"`,
          `in {type: "hit", dmg: Integer => d} if d > 10 then puts "big #{d}"`,
          `in {type: "hit"} then puts "small"`,
          `end`,
        ),
        options: ["big 12", "small", "NoMatchingPatternError"], answer: 0,
        explain: L(
          "Hash patterns ignore extra keys like crit; Integer => d checks the class and binds d, then the guard runs.",
          "Los patrones de hash ignoran claves extra como crit; Integer => d revisa la clase y captura d, luego corre la guarda.",
          "ハッシュパターンは crit のような余分なキーを無視。Integer => d で型を確かめて束縛し、ガードを評価するよ。",
        ),
        check: { compiles: true, stdout: "big 12" },
      },
      // concurrency
      {
        topic: "concurrency", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code(`m = Mutex.new`, `m.synchronize do`, `  m.synchronize { puts "inner" }`, `end`),
        options: [
          L("Prints inner", "Imprime inner", "inner と表示"),
          L("ThreadError: recursive locking", "ThreadError: bloqueo recursivo", "ThreadError（再帰ロック）"),
          L("Hangs forever", "Se cuelga para siempre", "永遠に止まる"),
        ],
        answer: 1,
        explain: L(
          "Mutex is not reentrant: locking it again from the same thread raises ThreadError (deadlock; recursive locking).",
          "Mutex no es reentrante: bloquearlo otra vez desde el mismo hilo lanza ThreadError (deadlock; recursive locking).",
          "Mutex は再入不可。同じスレッドで再びロックすると ThreadError（deadlock; recursive locking）だよ。",
        ),
        check: { compiles: true, throws: "ThreadError" },
      },
      {
        topic: "concurrency", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          `Thread.report_on_exception = false`,
          `t = Thread.new { raise IOError, "net down" }`,
          `begin`,
          `  t.join`,
          `rescue IOError => e`,
          `  puts "joined: #{e.message}"`,
          `end`,
        ),
        options: ["joined: net down", "nothing", "IOError crashes the program"], answer: 0,
        explain: L(
          "An exception kills only its thread; join (or value) re-raises it in the caller, where you can rescue it.",
          "Una excepción mata solo su hilo; join (o value) la vuelve a lanzar en quien llama, donde se puede rescatar.",
          "例外はそのスレッドだけを止める。join（や value）で呼び出し側に再送出され、rescue できるよ。",
        ),
        check: { compiles: true, stdout: "joined: net down" },
      },
      {
        topic: "concurrency", difficulty: 3, kind: "order", prompt: L("Order it to safely print 400", "Ordénalo para imprimir 400 seguro", "安全に 400 と表示する順に"),
        lines: [
          "m, total = Mutex.new, 0",
          "ts = 4.times.map do",
          "  Thread.new { 100.times { m.synchronize { total += 1 } } }",
          "end",
          "ts.each(&:join)",
          "p total",
        ],
        explain: L(
          "Create the lock, start the threads, join them all, then read. The Mutex makes total += 1 atomic.",
          "Crea el candado, inicia los hilos, espera a todos con join y luego lee. El Mutex hace atómico total += 1.",
          "ロックを作り、スレッドを開始し、全部 join してから読む。Mutex で total += 1 が不可分になるよ。",
        ),
        check: { compiles: true, stdout: "400" },
      },
      {
        topic: "concurrency", difficulty: 2, kind: "pick", prompt: L("CRuby, CPU-bound: what speed-up?", "CRuby, uso de CPU: ¿cuánto acelera?", "CRuby で CPU 処理：速度は？"),
        code: code(`# 4 threads run a pure-Ruby math loop`, `threads = 4.times.map { Thread.new { crunch } }`, `threads.each(&:join)`, `# Speed-up vs 1 thread: ___`),
        options: [
          L("About 1x: the GVL", "Cerca de 1x: el GVL", "約1倍：GVL のため"),
          L("About 4x on 4 cores", "Cerca de 4x con 4 núcleos", "4コアで約4倍"),
          L("It raises ThreadError", "Lanza ThreadError", "ThreadError になる"),
        ],
        answer: 0,
        explain: L(
          "The GVL lets one thread run Ruby code at a time. Threads help with I/O waits; use processes or Ractors for CPU.",
          "El GVL deja correr código Ruby a un solo hilo a la vez. Los hilos ayudan con E/S; para CPU usa procesos o Ractors.",
          "GVL のため Ruby コードを実行できるのは同時に1スレッド。I/O 待ちには有効、CPU にはプロセスか Ractor を。",
        ),
      },
      // runtime
      {
        topic: "runtime", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(`r = (1..).lazy.map { |x| x * 3 }.select(&:even?).first(3)`, `p r`),
        options: ["[6, 12, 18]", "[3, 6, 9]", "It never ends"], answer: 0,
        explain: L(
          "lazy processes one element at a time and stops after 3 matches, so even an endless range is fine.",
          "lazy procesa un elemento a la vez y se detiene tras 3 coincidencias, así que sirve hasta con un rango infinito.",
          "lazy は1要素ずつ処理し、3件そろえば止まる。終わりのない範囲でも大丈夫だよ。",
        ),
        check: { compiles: true, stdout: "[6, 12, 18]" },
      },
      {
        topic: "runtime", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code(`# frozen_string_literal: true`, `label = "hp"`, `label << "!"`, `puts label`),
        options: ["hp!", "FrozenError", "hp"], answer: 1,
        explain: L(
          "The magic comment freezes every literal so Ruby can reuse it without new allocations; mutating raises FrozenError.",
          "El comentario mágico congela cada literal para reutilizarlo sin nuevas asignaciones; modificarlo lanza FrozenError.",
          "マジックコメントで全リテラルが凍結され、再利用して割り当てを減らせる。変更すると FrozenError だよ。",
        ),
        check: { compiles: true, throws: "FrozenError" },
      },
      {
        topic: "runtime", difficulty: 3, kind: "predict", prompt: L("How many times is query printed?", "¿Cuántas veces se imprime query?", "query は何回表示される？"),
        code: code(`def admin?`, `  @admin ||= begin`, `    puts "query"`, `    false`, `  end`, `end`, `admin?`, `admin?`),
        options: [L("Once", "Una vez", "1回"), L("Twice", "Dos veces", "2回"), L("Never", "Nunca", "0回")],
        answer: 1,
        explain: L(
          "||= memoization fails for false and nil: the work reruns every call. Use defined?(@admin) to cache falsy values.",
          "La memoización con ||= falla con false y nil: el trabajo se repite. Usa defined?(@admin) para guardar valores falsy.",
          "||= のメモ化は false と nil で効かず毎回実行される。偽の値は defined?(@admin) でキャッシュしよう。",
        ),
        check: { compiles: true, stdout: "query\nquery" },
      },
      // tooling
      {
        topic: "tooling", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: `p [require("json"), require("json")]`,
        options: ["[true, false]", "[true, true]", "[false, false]"], answer: 0,
        explain: L(
          "require loads a file once and returns false when it is already loaded; load would run it every time.",
          "require carga un archivo una vez y devuelve false si ya estaba cargado; load lo ejecutaría cada vez.",
          "require は1回だけ読み込み、2回目は false を返す。load なら毎回実行するよ。",
        ),
        check: { compiles: true, stdout: "[true, false]" },
      },
      {
        topic: "tooling", difficulty: 1, kind: "predict", prompt: L("Where is the exact version pinned?", "¿Dónde se fija la versión exacta?", "正確なバージョンはどこに固定される？"),
        code: code(`# Gemfile`, `source "https://rubygems.org"`, `gem "rack", "~> 3.0"`),
        options: ["Gemfile.lock", "Gemfile", "rack.gemspec"], answer: 0,
        explain: L(
          "The Gemfile states allowed ranges; bundle install records the exact resolved versions in Gemfile.lock. Commit it for apps.",
          "El Gemfile indica rangos permitidos; bundle install guarda las versiones exactas en Gemfile.lock. Súbelo en apps.",
          "Gemfile は許可範囲を書き、bundle install が確定したバージョンを Gemfile.lock に記録する。アプリではコミットしよう。",
        ),
      },
    ],
  },
];
