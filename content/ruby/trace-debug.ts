import type { ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Written-test formats for planet Rubion (Ruby 3.4.7 on Compiler Explorer): trace tables (dry-run the
// code, fill the values) and debugging tasks (tap the buggy line, then fix it). Cells are written the
// way `p` prints them (Ruby 3.4 inspect). The validator runs every `verify` and proves each fix passes
// the tests while the buggy code and the near misses fail.

const rb = String.raw;
const code = (...lines: string[]) => lines.join("\n");

const after = (n: number) => L(`after line ${n}`, `tras la línea ${n}`, `${n}行目の後`);
const pass = (n: number) => L(`pass ${n}`, `vuelta ${n}`, `${n}周目`);

// ─── JUNIOR ───────────────────────────────────────────────────────────────────

/** Junior trace: string repetition with each_with_index. */
export const repeatTrace: ExamQuestion = {
  kind: "trace",
  topic: "strings",
  difficulty: 1,
  prompt: L("Trace table: building a string", "Tabla de traza: armando un string", "トレース：文字列を組み立てる"),
  brief: L(
    "One row per pass of the block, after acc is updated. Write strings as p prints them, with quotes.",
    "Una fila por vuelta del bloque, después de actualizar acc. Escribe los strings como los imprime p, con comillas.",
    "ブロック1周ごとに1行（acc 更新後）。文字列は p の表示どおり引用符付きで。",
  ),
  code: code(
    'acc = ""',
    "%w[ab c def].each_with_index do |w, i|",
    "  acc += w * i",
    "end",
  ),
  columns: ["i", "w", "acc"],
  rows: [
    { label: pass(1), cells: ["0", '"ab"', '""'], given: [0] },
    { label: pass(2), cells: ["1", '"c"', '"c"'], given: [0] },
    { label: pass(3), cells: ["2", '"def"', '"cdefdef"'], given: [0] },
  ],
  verify: code(
    'acc = ""',
    "%w[ab c def].each_with_index do |w, i|",
    "  acc += w * i",
    '  puts [i, w.inspect, acc.inspect].join(" | ")',
    "end",
  ),
  explain: L(
    'String * n repeats it n times: "ab" * 0 is "", "c" * 1 is "c", "def" * 2 is "defdef". Indexes start at 0.',
    'String * n lo repite n veces: "ab" * 0 es "", "c" * 1 es "c", "def" * 2 es "defdef". Los índices empiezan en 0.',
    'String * n は n 回繰り返す。"ab" * 0 は ""、"def" * 2 は "defdef"。添字は 0 から。',
  ),
};

/** Junior trace: counting with a Hash.new(0) default. */
export const countCharsTrace: ExamQuestion = {
  kind: "trace",
  topic: "hashes",
  difficulty: 1,
  prompt: L("Trace table: counting letters", "Tabla de traza: contando letras", "トレース：文字を数える"),
  brief: L(
    "One row per character, after counts[c] += 1 runs.",
    "Una fila por carácter, después de counts[c] += 1.",
    "1文字ごとに1行（counts[c] += 1 の後）。",
  ),
  code: code(
    "counts = Hash.new(0)",
    '"banana".each_char do |c|',
    "  counts[c] += 1",
    "end",
  ),
  columns: ["c", "counts[c]", "counts.size"],
  rows: [
    { label: pass(1), cells: ['"b"', "1", "1"], given: [0] },
    { label: pass(2), cells: ['"a"', "1", "2"], given: [0] },
    { label: pass(3), cells: ['"n"', "1", "3"], given: [0] },
    { label: pass(4), cells: ['"a"', "2", "3"], given: [0] },
    { label: pass(5), cells: ['"n"', "2", "3"], given: [0] },
    { label: pass(6), cells: ['"a"', "3", "3"], given: [0] },
  ],
  verify: code(
    "counts = Hash.new(0)",
    '"banana".each_char do |c|',
    "  counts[c] += 1",
    '  puts [c.inspect, counts[c], counts.size].join(" | ")',
    "end",
  ),
  explain: L(
    "A missing key reads the default 0, and += stores 0 + 1. The size grows only when a new letter shows up: b, a, n.",
    "Una clave que falta lee el default 0, y += guarda 0 + 1. El tamaño crece solo con letras nuevas: b, a, n.",
    "無いキーはデフォルト 0 を読み、+= で 0 + 1 を保存。size は新しい文字（b, a, n）でだけ増える。",
  ),
};

// ─── MID ──────────────────────────────────────────────────────────────────────

/** Mid trace: a lambda and a proc sharing a captured local, and proc argument splatting. */
export const closureTrace: ExamQuestion = {
  kind: "trace",
  topic: "blocks",
  difficulty: 2,
  prompt: L("Trace table: a lambda and a proc", "Tabla de traza: una lambda y un proc", "トレース：ラムダと Proc"),
  brief: L(
    "Write the value of count after each call runs.",
    "Escribe el valor de count después de cada llamada.",
    "各呼び出しの後の count を書こう。",
  ),
  code: code(
    "count = 0",
    "inc = -> { count += 1 }",
    "add = proc { |x, y| count += x.to_i + y.to_i }",
    "inc.call",
    "add.call(5)",
    "add.call([2, 3])",
    "inc.()",
  ),
  columns: ["count"],
  rows: [
    { label: "inc.call", cells: ["1"] },
    { label: "add.call(5)", cells: ["6"] },
    { label: "add.call([2, 3])", cells: ["11"] },
    { label: "inc.()", cells: ["12"] },
  ],
  verify: code(
    "count = 0",
    "inc = -> { count += 1 }",
    "add = proc { |x, y| count += x.to_i + y.to_i }",
    "inc.call",
    "puts count",
    "add.call(5)",
    "puts count",
    "add.call([2, 3])",
    "puts count",
    "inc.()",
    "puts count",
  ),
  explain: L(
    "Both closures share the same count. A proc fills a missing y with nil (0 with to_i) and splats a lone array: x = 2, y = 3.",
    "Ambos cierres comparten count. Un proc rellena la y que falta con nil (0 con to_i) y separa un array solo: x = 2, y = 3.",
    "2つのクロージャは同じ count を共有。Proc は足りない y を nil（to_i で 0）にし、配列1つは展開：x=2, y=3。",
  ),
};

/** Mid trace: aliasing, dup, << versus +=. */
export const identityTrace: ExamQuestion = {
  kind: "trace",
  topic: "equality",
  difficulty: 2,
  prompt: L("Trace table: who shares the string?", "Tabla de traza: ¿quién comparte el string?", "トレース：同じ文字列を指すのは？"),
  code: code(
    'a = String.new("hi")',
    "b = a",
    "c = a.dup",
    'b << "!"',
    'a += "?"',
    "c.upcase!",
  ),
  columns: ["a", "b", "c", "a.equal?(b)"],
  rows: [
    { label: after(3), cells: ['"hi"', '"hi"', '"hi"', "true"], given: [0, 1, 2] },
    { label: after(4), cells: ['"hi!"', '"hi!"', '"hi"', "true"] },
    { label: after(5), cells: ['"hi!?"', '"hi!"', '"hi"', "false"] },
    { label: after(6), cells: ['"hi!?"', '"hi!"', '"HI"', "false"] },
  ],
  verify: code(
    'a = String.new("hi")',
    "b = a",
    "c = a.dup",
    'puts [a.inspect, b.inspect, c.inspect, a.equal?(b)].join(" | ")',
    'b << "!"',
    'puts [a.inspect, b.inspect, c.inspect, a.equal?(b)].join(" | ")',
    'a += "?"',
    'puts [a.inspect, b.inspect, c.inspect, a.equal?(b)].join(" | ")',
    "c.upcase!",
    'puts [a.inspect, b.inspect, c.inspect, a.equal?(b)].join(" | ")',
  ),
  explain: L(
    "b = a shares one object, so << changes both. += builds a new string for a alone. dup made c a separate copy.",
    "b = a comparte un objeto, así que << cambia a ambos. += crea un string nuevo solo para a. dup hizo de c una copia aparte.",
    "b = a は同じオブジェクトなので << で両方変わる。+= は a だけに新しい文字列を作る。c は dup した別物。",
  ),
};

/** Mid debug: || true turns an explicit false into true. */
export const notifyDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "control",
  difficulty: 2,
  prompt: L("Debug: email notifications", "Depura: avisos por email", "デバッグ：メール通知"),
  brief: L(
    "notify?(user) should be true unless the user turned email off (prefs: {email: false}) or is banned. A missing setting means on. But notify?({prefs: {email: false}}) returns true.",
    "notify?(user) debería ser true salvo que el usuario apagó el email (prefs: {email: false}) o está baneado. Si falta el ajuste, está activado. Pero notify?({prefs: {email: false}}) devuelve true.",
    "notify?(user) はメールをオフ（prefs: {email: false}）にしたか BAN でない限り true。設定が無ければオン。でも notify?({prefs: {email: false}}) が true になる。",
  ),
  code: code(
    "def notify?(user)",
    "  prefs = user[:prefs] || {}",
    "  enabled = prefs[:email] || true",
    "  enabled && !user[:banned]",
    "end",
  ),
  bugLine: 3,
  solution: code(
    "def notify?(user)",
    "  prefs = user[:prefs] || {}",
    "  enabled = prefs.fetch(:email, true)",
    "  enabled && !user[:banned]",
    "end",
  ),
  nearMiss: [
    // ||= has the same problem: false is falsy, so it is replaced.
    code("def notify?(user)", "  prefs = user[:prefs] || {}", "  enabled = prefs[:email] ||= true", "  enabled && !user[:banned]", "end"),
    // A missing setting now means off.
    code("def notify?(user)", "  prefs = user[:prefs] || {}", "  enabled = prefs[:email] == true", "  enabled && !user[:banned]", "end"),
    // Only checks that the key holds something: false counts as on.
    code("def notify?(user)", "  prefs = user[:prefs] || {}", "  enabled = !prefs[:email].nil? || !prefs.key?(:email)", "  enabled && !user[:banned]", "end"),
  ],
  tests: [
    { run: "p notify?({prefs: {email: false}})", expect: "false" },
    { run: "p notify?({})", expect: "true" },
    { run: "p notify?({prefs: {email: true}, banned: true})", expect: "false", hidden: true },
    { run: "p notify?({prefs: {}})", expect: "true", hidden: true },
    { run: "p notify?({prefs: {email: true}})", expect: "true", hidden: true },
  ],
  explain: L(
    "false || true is true: || can't tell false from missing. fetch(:email, true) uses the default only when the key is absent.",
    "false || true es true: || no distingue false de ausente. fetch(:email, true) usa el default solo si falta la clave.",
    "false || true は true。|| は false と未設定を区別できない。fetch(:email, true) はキーが無いときだけ既定値。",
  ),
};

/** Mid debug: an inclusive range one step too long. */
export const windowSumsDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "arrays",
  difficulty: 2,
  prompt: L("Debug: sliding window sums", "Depura: sumas de ventana deslizante", "デバッグ：スライド窓の合計"),
  brief: L(
    "window_sums(nums, k) should return the sum of every run of k neighbors, left to right, and [] when k is larger than the array. But window_sums([1, 2, 3, 4], 2) returns [3, 5, 7, 4] instead of [3, 5, 7].",
    "window_sums(nums, k) debería devolver la suma de cada tramo de k vecinos, de izquierda a derecha, y [] si k es mayor que el array. Pero window_sums([1, 2, 3, 4], 2) devuelve [3, 5, 7, 4] en vez de [3, 5, 7].",
    "window_sums(nums, k) は隣り合う k 個ずつの合計を左から返し、k が配列より大きければ []。でも window_sums([1, 2, 3, 4], 2) が [3, 5, 7] でなく [3, 5, 7, 4] になる。",
  ),
  code: rb`def window_sums(nums, k)
  sums = []
  (0..nums.size - k + 1).each do |i|
    sums << nums[i, k].sum
  end
  sums
end`,
  bugLine: 3,
  solution: rb`def window_sums(nums, k)
  sums = []
  (0..nums.size - k).each do |i|
    sums << nums[i, k].sum
  end
  sums
end`,
  nearMiss: [
    // The exclusive range drops the last window.
    rb`def window_sums(nums, k)
  sums = []
  (0...nums.size - k).each do |i|
    sums << nums[i, k].sum
  end
  sums
end`,
    // each_slice cuts the array into separate chunks, not overlapping windows.
    rb`def window_sums(nums, k)
  nums.each_slice(k).map(&:sum)
end`,
  ],
  tests: [
    { run: "p window_sums([1, 2, 3, 4], 2)", expect: "[3, 5, 7]" },
    { run: "p window_sums([5, 1, 2], 3)", expect: "[8]" },
    { run: "p window_sums([1, 2], 3)", expect: "[]", hidden: true },
    { run: "p window_sums([4, 4, 4], 1)", expect: "[4, 4, 4]", hidden: true },
    { run: "p window_sums([2, 0, 7, 1, 3], 3)", expect: "[9, 8, 11]", hidden: true },
  ],
  explain: L(
    "The last window starts at size - k. The + 1 added a start where nums[i, k] is cut short ([4]). (0..size - k) is empty when k > size.",
    "La última ventana empieza en size - k. El + 1 sumaba un inicio donde nums[i, k] queda corto ([4]). (0..size - k) es vacío si k > size.",
    "最後の窓の開始は size - k。+ 1 で nums[i, k] が欠ける開始位置（[4]）が増えた。k > size なら範囲は空。",
  ),
};

// ─── SENIOR ───────────────────────────────────────────────────────────────────

/** Senior trace: a memoizing Hash default block that recurses. */
export const fibHashTrace: ExamQuestion = {
  kind: "trace",
  topic: "hashes",
  difficulty: 3,
  prompt: L("Trace table: a self-filling hash", "Tabla de traza: un hash que se llena solo", "トレース：自分で埋まるハッシュ"),
  brief: L(
    "One row each time the block stores a key (h[n] = ...), in the order it happens during fib[4].",
    "Una fila cada vez que el bloque guarda una clave (h[n] = ...), en el orden en que pasa durante fib[4].",
    "fib[4] の間にブロックがキーを保存する（h[n] = ...）たびに、起きた順に1行。",
  ),
  code: code(
    "fib = Hash.new do |h, n|",
    "  h[n] = n < 2 ? n : h[n - 1] + h[n - 2]",
    "end",
    "fib[4]",
  ),
  columns: ["n", "h[n]", "h.size"],
  rows: [
    { label: L("store 1", "guardado 1", "保存1"), cells: ["1", "1", "1"], given: [0] },
    { label: L("store 2", "guardado 2", "保存2"), cells: ["0", "0", "2"] },
    { label: L("store 3", "guardado 3", "保存3"), cells: ["2", "1", "3"] },
    { label: L("store 4", "guardado 4", "保存4"), cells: ["3", "2", "4"] },
    { label: L("store 5", "guardado 5", "保存5"), cells: ["4", "3", "5"] },
  ],
  verify: code(
    "fib = Hash.new do |h, n|",
    "  h[n] = n < 2 ? n : h[n - 1] + h[n - 2]",
    '  puts [n, h[n], h.size].join(" | ")',
    "  h[n]",
    "end",
    "fib[4]",
  ),
  explain: L(
    "h[4] needs h[3], h[2], h[1] first: 1 is stored, then 0, then 2. h[3] and h[4] find h[1] and h[2] already stored, so nothing repeats.",
    "h[4] necesita antes h[3], h[2], h[1]: se guarda 1, luego 0, luego 2. h[3] y h[4] ya encuentran h[1] y h[2], así que nada se repite.",
    "h[4] は先に h[3]、h[2]、h[1] を要する。1、0、2 の順に保存。h[3] と h[4] は保存済みの値を使うので再計算なし。",
  ),
};

/** Senior debug: return inside a proc leaves the whole method. */
export const scoreReportDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "blocks",
  difficulty: 3,
  prompt: L("Debug: the score report", "Depura: el reporte de puntajes", "デバッグ：スコアのレポート"),
  brief: L(
    'score_report(lines) parses "name: score" lines, skips blank lines and returns "best <name> (<score>), avg <average>", or "no scores" when nothing is left. But score_report(["ana: 7", "", "bo: 9"]) returns nil instead of "best bo (9), avg 8.0".',
    'score_report(lines) lee líneas "nombre: puntaje", salta las líneas en blanco y devuelve "best <nombre> (<puntaje>), avg <promedio>", o "no scores" si no queda nada. Pero score_report(["ana: 7", "", "bo: 9"]) devuelve nil en vez de "best bo (9), avg 8.0".',
    'score_report(lines) は "名前: 点" の行を読み、空行を飛ばし "best <名前> (<点>), avg <平均>" を返す（何も無ければ "no scores"）。でも score_report(["ana: 7", "", "bo: 9"]) が "best bo (9), avg 8.0" でなく nil になる。',
  ),
  code: rb`def score_report(lines)
  parse = proc do |line|
    return nil if line.strip.empty?
    name, raw = line.split(":").map(&:strip)
    [name, Integer(raw)]
  end

  scores = lines.map { |line| parse.call(line) }.compact
  return "no scores" if scores.empty?

  best_name, best = scores.max_by { |_, score| score }
  total = scores.sum { |_, score| score }
  avg = total.fdiv(scores.size).round(1)
  "best #{best_name} (#{best}), avg #{avg}"
end`,
  bugLine: 3,
  solution: rb`def score_report(lines)
  parse = proc do |line|
    next nil if line.strip.empty?
    name, raw = line.split(":").map(&:strip)
    [name, Integer(raw)]
  end

  scores = lines.map { |line| parse.call(line) }.compact
  return "no scores" if scores.empty?

  best_name, best = scores.max_by { |_, score| score }
  total = scores.sum { |_, score| score }
  avg = total.fdiv(scores.size).round(1)
  "best #{best_name} (#{best}), avg #{avg}"
end`,
  nearMiss: [
    // A bare return is still a return from score_report.
    rb`def score_report(lines)
  parse = proc do |line|
    return if line.strip.empty?
    name, raw = line.split(":").map(&:strip)
    [name, Integer(raw)]
  end

  scores = lines.map { |line| parse.call(line) }.compact
  return "no scores" if scores.empty?

  best_name, best = scores.max_by { |_, score| score }
  total = scores.sum { |_, score| score }
  avg = total.fdiv(scores.size).round(1)
  "best #{best_name} (#{best}), avg #{avg}"
end`,
    // next without strip: a line of spaces reaches Integer(nil).
    rb`def score_report(lines)
  parse = proc do |line|
    next nil if line.empty?
    name, raw = line.split(":").map(&:strip)
    [name, Integer(raw)]
  end

  scores = lines.map { |line| parse.call(line) }.compact
  return "no scores" if scores.empty?

  best_name, best = scores.max_by { |_, score| score }
  total = scores.sum { |_, score| score }
  avg = total.fdiv(scores.size).round(1)
  "best #{best_name} (#{best}), avg #{avg}"
end`,
  ],
  tests: [
    { run: 'p score_report(["ana: 7", "", "bo: 9"])', expect: '"best bo (9), avg 8.0"' },
    { run: 'p score_report(["ana: 7", "bo: 4"])', expect: '"best ana (7), avg 5.5"' },
    { run: "p score_report([])", expect: '"no scores"', hidden: true },
    { run: 'p score_report(["", "   "])', expect: '"no scores"', hidden: true },
    { run: 'p score_report(["cy: 10", "  ", "dee: 10", "eli: 1"])', expect: '"best cy (10), avg 7.0"', hidden: true },
  ],
  explain: L(
    "return inside a proc returns from the method that made it, so one blank line ended score_report with nil. next only ends this call of the block.",
    "return dentro de un proc sale del método que lo creó: una línea en blanco terminaba score_report con nil. next solo termina esta llamada del bloque.",
    "Proc 内の return は作ったメソッドごと抜けるので、空行1つで nil が返った。next はこのブロック呼び出しだけを終える。",
  ),
};

const TILE_HEAD = rb`class Tile
  attr_reader :x, :y

  def initialize(x, y)
    @x = x
    @y = y
  end

  def ==(other)
    other.is_a?(Tile) && x == other.x && y == other.y
  end`;

const TILE_HASH = rb`
  def hash
    [x, y].hash
  end`;

const TILE_TAIL = rb`
end

def visited_count(path)
  path.map { |x, y| Tile.new(x, y) }.uniq.size
end`;

/** Senior paper debug: == without eql?, so uniq and Hash keys ignore it. */
export const tileDebug: ExamQuestion = {
  kind: "debug",
  mode: "paper",
  topic: "equality",
  difficulty: 3,
  prompt: L("Debug: counting visited tiles", "Depura: contar casillas visitadas", "デバッグ：訪れたマスを数える"),
  brief: L(
    "Two Tiles with the same x and y are the same tile, also as Hash keys and for uniq. visited_count(path) counts the distinct tiles of a path of [x, y] pairs. But visited_count([[0, 0], [1, 0], [0, 0]]) returns 3 instead of 2.",
    "Dos Tile con el mismo x e y son la misma casilla, también como claves de Hash y para uniq. visited_count(path) cuenta las casillas distintas de un camino de pares [x, y]. Pero visited_count([[0, 0], [1, 0], [0, 0]]) devuelve 3 en vez de 2.",
    "x と y が同じ Tile は同じマス（Hash のキーや uniq でも）。visited_count(path) は [x, y] の道の異なるマスを数える。でも visited_count([[0, 0], [1, 0], [0, 0]]) が 2 でなく 3 になる。",
  ),
  code: `${TILE_HEAD}
  alias eql? equal?
${TILE_HASH}${TILE_TAIL}`,
  bugLine: 12,
  solution: `${TILE_HEAD}
  alias eql? ==
${TILE_HASH}${TILE_TAIL}`,
  nearMiss: [
    // Redefining equal? doesn't touch eql?, which uniq and Hash call.
    `${TILE_HEAD}
  alias equal? ==
${TILE_HASH}${TILE_TAIL}`,
    // eql? alone isn't enough: without a matching hash, equal tiles land in different buckets.
    `${TILE_HEAD}
  alias eql? ==
${TILE_TAIL}`,
  ],
  tests: [
    { run: "p visited_count([[0, 0], [1, 0], [0, 0]])", expect: "2" },
    { run: "p visited_count([[2, 3]])", expect: "1" },
    { run: "p visited_count([[0, 1], [1, 0], [0, 1], [1, 0]])", expect: "2", hidden: true },
    { run: "bag = {Tile.new(1, 2) => :gem}\np bag[Tile.new(1, 2)]", expect: ":gem", hidden: true },
    { run: "p Tile.new(1, 2) == Tile.new(1, 2)", expect: "true", hidden: true },
    { run: "p visited_count([])", expect: "0", hidden: true },
  ],
  explain: L(
    "uniq and Hash compare with hash plus eql?, not ==. eql? aliased to equal? meant identity; alias eql? == makes equal tiles match.",
    "uniq y Hash comparan con hash más eql?, no con ==. eql? como alias de equal? era identidad; alias eql? == hace coincidir casillas iguales.",
    "uniq と Hash は == でなく hash と eql? で比べる。equal? の別名だと同一性比較。alias eql? == で同じマスが一致する。",
  ),
};

const STORE_HEAD = rb`module Audited
  def save(record)
    log << "saving #{record}"
    ok = super
    log << "saved #{record}" if ok
    ok
  end

  def log
    @log ||= []
  end
end

class Store`;

const STORE_BODY = rb`
  def initialize
    @items = []
  end

  def save(record)
    return false if record.to_s.empty?
    @items << record
    true
  end

  def size = @items.size`;

/** Senior paper debug: include puts the module below the class, so the class's save wins. */
export const auditedDebug: ExamQuestion = {
  kind: "debug",
  mode: "paper",
  topic: "modules",
  difficulty: 3,
  prompt: L("Debug: the audit log stays empty", "Depura: el registro de auditoría vacío", "デバッグ：監査ログが空のまま"),
  brief: L(
    'Audited wraps save: it logs "saving <record>", calls the original save and logs "saved <record>" when it worked. But after s = Store.new and s.save("a"), s.log is [] instead of ["saving a", "saved a"].',
    'Audited envuelve save: registra "saving <record>", llama al save original y registra "saved <record>" si funcionó. Pero tras s = Store.new y s.save("a"), s.log es [] en vez de ["saving a", "saved a"].',
    'Audited は save を包み、"saving <record>" を記録して元の save を呼び、成功したら "saved <record>" を記録する。でも s = Store.new; s.save("a") の後 s.log が ["saving a", "saved a"] でなく []。',
  ),
  code: `${STORE_HEAD}
  include Audited
${STORE_BODY}
end`,
  bugLine: 15,
  solution: `${STORE_HEAD}
  prepend Audited
${STORE_BODY}
end`,
  nearMiss: [
    // extend adds the methods to the class object, not to its instances.
    `${STORE_HEAD}
  extend Audited
${STORE_BODY}
end`,
    // Moving include below save changes nothing: the class still comes first in the lookup.
    `${STORE_HEAD}${STORE_BODY}

  include Audited
end`,
  ],
  tests: [
    { run: 's = Store.new\ns.save("a")\np s.log', expect: '["saving a", "saved a"]' },
    { run: 's = Store.new\np [s.save("b"), s.size]', expect: "[true, 1]" },
    { run: 's = Store.new\np [s.save(""), s.log]', expect: '[false, ["saving "]]', hidden: true },
    { run: 's = Store.new\ns.save("x")\ns.save("y")\np [s.size, s.log.size]', expect: "[2, 4]", hidden: true },
    { run: "p Store.new.log", expect: "[]", hidden: true },
  ],
  explain: L(
    "include places Audited after Store in the lookup, so Store#save wins and never calls it. prepend puts it first, and its super reaches Store#save.",
    "include pone Audited después de Store en la búsqueda: Store#save gana y nunca lo llama. prepend lo pone primero y su super llega a Store#save.",
    "include だと探索順で Audited は Store の後ろになり Store#save が勝つ。prepend なら前に入り、super で Store#save に届く。",
  ),
};

export const juniorTraceDebug: ExamQuestion[] = [repeatTrace, countCharsTrace];
export const midTraceDebug: ExamQuestion[] = [closureTrace, identityTrace, notifyDebug, windowSumsDebug];
export const seniorTraceDebug: ExamQuestion[] = [fibHashTrace, scoreReportDebug, tileDebug, auditedDebug];
