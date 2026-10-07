import type { CodeTaskBeat, ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Coding tasks for planet Rubion (Ruby). The tests run on Ruby 3.4.7 (Compiler Explorer) through
// /api/run, which appends them on the server: hidden tests never reach the player's browser.
// Tests print with `p`/`puts` using Ruby 3.4 inspect formats ({"a" => 1}, {a: 1}); never default #inspect.

const rb = String.raw;

// ─── REGION BOSSES ────────────────────────────────────────────────────────────

/** Boss mini project (Object Village): nil, blank strings and keyword arguments. */
export const badgeTask: CodeTaskBeat = {
  slug: "badge",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the village gate badge", "Mini proyecto: la insignia de la aldea", "ミニ課題：村の門のバッジ"),
  brief: L(
    'Write badge(name, title: nil). Strip the spaces around name; if name is nil or blank, use "guest". Capitalize it (first letter upper case, the rest lower case). When title is given and not blank, add " the <title>". Return the string: badge("  rubi ", title: "Brave") is "Rubi the Brave".',
    'Escribe badge(name, title: nil). Quita los espacios alrededor de name; si name es nil o está en blanco, usa "guest". Ponlo con mayúscula inicial (la primera letra en mayúscula, el resto en minúscula). Si title viene y no está en blanco, agrega " the <title>". Devuelve el string: badge("  rubi ", title: "Brave") es "Rubi the Brave".',
    'badge(name, title: nil) を書こう。name の前後の空白を取り、nil か空白だけなら "guest" を使う。先頭だけ大文字、残りは小文字にする。title があって空白でなければ " the <title>" を足す。badge("  rubi ", title: "Brave") は "Rubi the Brave"。',
  ),
  starter: rb`def badge(name, title: nil)
  # your code here
end
`,
  solution: rb`def badge(name, title: nil)
  name = name.to_s.strip
  name = "guest" if name.empty?
  label = name.capitalize
  label += " the #{title}" unless title.nil? || title.strip.empty?
  label
end
`,
  nearMiss: [
    // ||= only replaces nil: a blank name stays blank.
    rb`def badge(name, title: nil)
  name ||= "guest"
  label = name.strip.capitalize
  label += " the #{title}" if title
  label
end
`,
    // An empty title is truthy in Ruby: "Bo the ".
    rb`def badge(name, title: nil)
  name = name.to_s.strip
  name = "guest" if name.empty?
  label = name.capitalize
  label += " the #{title}" if title
  label
end
`,
  ],
  tests: [
    { run: 'p badge("kira")', expect: '"Kira"' },
    { run: "p badge(nil)", expect: '"Guest"' },
    { run: 'p badge("  rubi ", title: "Brave")', expect: '"Rubi the Brave"', hidden: true },
    { run: 'p badge("   ")', expect: '"Guest"', hidden: true },
    { run: 'p badge("bo", title: "")', expect: '"Bo"', hidden: true },
    { run: 'p badge("ADA", title: "Wise")', expect: '"Ada the Wise"', hidden: true },
  ],
  hint: L(
    "nil.to_s is \"\", so one empty? check covers nil and blank. Remember that \"\" is truthy in Ruby.",
    "nil.to_s es \"\", así que un solo empty? cubre nil y blanco. Recuerda que \"\" es verdadero en Ruby.",
    "nil.to_s は \"\" なので、empty? 1回で nil も空白も扱える。Ruby では \"\" も真。",
  ),
  note: "recap-nil",
  explain: L(
    "to_s.strip turns nil and blanks into \"\", then empty? picks \"guest\". Only nil and false are falsy, so check the title with strip.empty?.",
    "to_s.strip convierte nil y blancos en \"\", y empty? elige \"guest\". Solo nil y false son falsos: revisa title con strip.empty?.",
    "to_s.strip で nil も空白も \"\" になり、empty? で \"guest\" を選ぶ。偽は nil と false だけなので、title は strip.empty? で調べる。",
  ),
};

/** Boss mini project (Enumerable Forest): the shared Hash.new([]) default trap. */
export const lootTask: CodeTaskBeat = {
  slug: "loot",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: sort the mimic's loot", "Mini proyecto: reparte el botín del mímico", "ミニ課題：ミミックの戦利品を分ける"),
  brief: L(
    'Write loot_by_player(drops). drops is an array of [player, item] pairs. Return a NEW plain hash of player => array of items, players in the order they first appear, items in drop order. A player with no loot is simply not a key (bags["nobody"] is nil). Don\'t modify drops. Careful: the Mimic hid a trap in the starter.',
    'Escribe loot_by_player(drops). drops es un array de pares [jugador, objeto]. Devuelve un hash NUEVO y normal de jugador => array de objetos, con los jugadores en el orden en que aparecen por primera vez y los objetos en el orden de caída. Un jugador sin botín no es clave (bags["nobody"] es nil). No modifiques drops. Cuidado: el Mímico escondió una trampa en el código inicial.',
    'loot_by_player(drops) を書こう。drops は [プレイヤー, アイテム] の配列。プレイヤー => アイテム配列の「新しい」普通のハッシュを返す。プレイヤーは初登場順、アイテムは落ちた順。戦利品のないプレイヤーはキーにしない（bags["nobody"] は nil）。drops は変えないこと。初期コードにはミミックの罠がある！',
  ),
  starter: rb`def loot_by_player(drops)
  bags = Hash.new([])
  # your code here
  bags
end
`,
  solution: rb`def loot_by_player(drops)
  drops.each_with_object({}) do |(player, item), bags|
    (bags[player] ||= []) << item
  end
end
`,
  nearMiss: [
    // << on the shared default array never stores a key: the hash stays empty.
    rb`def loot_by_player(drops)
  bags = Hash.new([])
  drops.each { |player, item| bags[player] << item }
  bags
end
`,
    // group_by keeps the whole pairs, not just the items.
    rb`def loot_by_player(drops)
  drops.group_by(&:first)
end
`,
    // += stores a new array, but the default still answers [] for a missing player.
    rb`def loot_by_player(drops)
  bags = Hash.new([])
  drops.each { |player, item| bags[player] += [item] }
  bags
end
`,
  ],
  tests: [
    { run: 'p loot_by_player([["kira", "gem"], ["bo", "axe"], ["kira", "key"]])', expect: '{"kira" => ["gem", "key"], "bo" => ["axe"]}' },
    { run: "p loot_by_player([])", expect: "{}" },
    { run: 'p loot_by_player([["ann", "gem"], ["ann", "gem"]])', expect: '{"ann" => ["gem", "gem"]}', hidden: true },
    { run: 'bags = loot_by_player([["bo", "axe"]])\np bags["nobody"]', expect: "nil", hidden: true },
    { run: 'drops = [["x", "a"]]\nloot_by_player(drops)\np drops', expect: '[["x", "a"]]', hidden: true },
  ],
  hint: L(
    "Hash.new([]) hands out ONE shared array and never stores it. Create each player's array yourself.",
    "Hash.new([]) entrega UN solo array compartido y nunca lo guarda. Crea tú el array de cada jugador.",
    "Hash.new([]) は共有の配列を1つ返すだけで保存しない。各プレイヤーの配列は自分で作ろう。",
  ),
  note: "recap-shared-defaults",
  explain: L(
    "(bags[player] ||= []) << item stores a fresh array the first time. Hash.new([])'s << changes the shared default and adds no key.",
    "(bags[player] ||= []) << item guarda un array nuevo la primera vez. Con Hash.new([]), << cambia el default compartido y no agrega clave.",
    "(bags[player] ||= []) << item なら初回に新しい配列を保存する。Hash.new([]) の << は共有デフォルトを変えるだけでキーは増えない。",
  ),
};

/** Boss mini project (Module Castle): a frozen, comparable value object. */
export const runeTask: CodeTaskBeat = {
  slug: "rune",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the frozen rune", "Mini proyecto: la runa congelada", "ミニ課題：凍ったルーン"),
  brief: L(
    'Finish class Rune: Rune.new(name, power) is a value object. It is frozen after creation. Runes are ordered by power (use Comparable). Two runes are == and eql? only when name AND power match, so uniq and hash keys treat them as one. to_s returns "name:power", e.g. "fire:3".',
    'Termina la clase Rune: Rune.new(name, power) es un objeto valor. Queda congelado al crearse. Las runas se ordenan por power (usa Comparable). Dos runas son == y eql? solo si coinciden name Y power, así uniq y las claves de hash las tratan como una. to_s devuelve "name:power", p. ej. "fire:3".',
    'Rune クラスを完成させよう。Rune.new(name, power) は値オブジェクトで、作ったら freeze される。順序は power で決める（Comparable を使う）。name と power が両方同じときだけ == と eql? が真になり、uniq やハッシュのキーで1つとみなされる。to_s は "name:power"（例 "fire:3"）。',
  ),
  starter: rb`class Rune
  include Comparable
  attr_reader :name, :power

  def initialize(name, power)
    # your code here
  end
end
`,
  solution: rb`class Rune
  include Comparable
  attr_reader :name, :power

  def initialize(name, power)
    @name = name
    @power = power
    freeze
  end

  def <=>(other) = power <=> other.power

  def ==(other) = other.is_a?(Rune) && name == other.name && power == other.power
  alias eql? ==

  def hash = [name, power].hash

  def to_s = "#{name}:#{power}"
end
`,
  nearMiss: [
    // Comparable's == only asks <=>: two runes with the same power look equal.
    rb`class Rune
  include Comparable
  attr_reader :name, :power

  def initialize(name, power)
    @name = name
    @power = power
    freeze
  end

  def <=>(other) = power <=> other.power
  def to_s = "#{name}:#{power}"
end
`,
    // == without eql?/hash: uniq still sees two different objects.
    rb`class Rune
  include Comparable
  attr_reader :name, :power

  def initialize(name, power)
    @name = name
    @power = power
    freeze
  end

  def <=>(other) = power <=> other.power
  def ==(other) = other.is_a?(Rune) && name == other.name && power == other.power
  def to_s = "#{name}:#{power}"
end
`,
    // Forgets to freeze.
    rb`class Rune
  include Comparable
  attr_reader :name, :power

  def initialize(name, power)
    @name = name
    @power = power
  end

  def <=>(other) = power <=> other.power
  def ==(other) = other.is_a?(Rune) && name == other.name && power == other.power
  alias eql? ==
  def hash = [name, power].hash
  def to_s = "#{name}:#{power}"
end
`,
  ],
  tests: [
    { run: 'p [Rune.new("fire", 3), Rune.new("ice", 1)].sort.map(&:to_s)', expect: '["ice:1", "fire:3"]' },
    { run: 'p Rune.new("ice", 1) == Rune.new("ice", 1)', expect: "true" },
    { run: 'p Rune.new("a", 2) == Rune.new("b", 2)', expect: "false", hidden: true },
    { run: 'p [Rune.new("a", 2), Rune.new("a", 2), Rune.new("b", 2)].uniq.size', expect: "2", hidden: true },
    { run: 'p Rune.new("a", 2).frozen?', expect: "true", hidden: true },
    { run: 'p Rune.new("a", 1) < Rune.new("b", 5)', expect: "true", hidden: true },
  ],
  hint: L(
    "Comparable builds == from <=>. uniq and hash keys ask eql? and hash, not ==.",
    "Comparable arma == a partir de <=>. uniq y las claves de hash usan eql? y hash, no ==.",
    "Comparable は <=> から == を作る。uniq とハッシュのキーは == ではなく eql? と hash を見る。",
  ),
  note: "recap-equality",
  explain: L(
    "<=> by power gives sorting and <; override == so the name counts too; alias eql? and define hash for uniq; freeze in initialize.",
    "<=> por power da el orden y <; redefine == para que cuente el name; alias de eql? y hash para uniq; freeze en initialize.",
    "power の <=> で並べ替えと < が使える。== は name も比べるよう上書き、uniq には eql? と hash、initialize で freeze。",
  ),
};

/** Boss mini project (Meta Tower): pattern matching plus a custom error. */
export const runeDamageTask: CodeTaskBeat = {
  slug: "rune-damage",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: read the imp's runes", "Mini proyecto: lee las runas del diablillo", "ミニ課題：インプのルーンを読む"),
  brief: L(
    'Write rune_damage(rune) with case/in. {type: :fire, power: Integer} deals power * 2; {type: :ice, power: Integer} deals power; {type: :heal} deals 0 (extra keys are fine). Anything else (other types, a missing or non-Integer power, not a hash) raises UnknownRune with the message "unknown rune". Then write safe_damage(rune): the damage, or -1 when the rune is unknown.',
    'Escribe rune_damage(rune) con case/in. {type: :fire, power: Integer} hace power * 2; {type: :ice, power: Integer} hace power; {type: :heal} hace 0 (las claves extra no importan). Cualquier otra cosa (otro type, power ausente o no Integer, algo que no es hash) lanza UnknownRune con el mensaje "unknown rune". Luego escribe safe_damage(rune): el daño, o -1 si la runa es desconocida.',
    'case/in で rune_damage(rune) を書こう。{type: :fire, power: Integer} は power * 2、{type: :ice, power: Integer} は power、{type: :heal} は 0（余分なキーは可）。それ以外（他の type、power がない・Integer でない、ハッシュでない）は "unknown rune" の UnknownRune を投げる。safe_damage(rune) はダメージを返し、不明なら -1。',
  ),
  starter: rb`class UnknownRune < StandardError; end

def rune_damage(rune)
  # your code here
end

def safe_damage(rune)
  # your code here
end
`,
  solution: rb`class UnknownRune < StandardError; end

def rune_damage(rune)
  case rune
  in {type: :fire, power: Integer => power} then power * 2
  in {type: :ice, power: Integer => power} then power
  in {type: :heal} then 0
  else raise UnknownRune, "unknown rune"
  end
end

def safe_damage(rune)
  rune_damage(rune)
rescue UnknownRune
  -1
end
`,
  nearMiss: [
    // No else: an unknown rune raises NoMatchingPatternError, which safe_damage doesn't rescue.
    rb`class UnknownRune < StandardError; end

def rune_damage(rune)
  case rune
  in {type: :fire, power: Integer => power} then power * 2
  in {type: :ice, power: Integer => power} then power
  in {type: :heal} then 0
  end
end

def safe_damage(rune)
  rune_damage(rune)
rescue UnknownRune
  -1
end
`,
    // case/when on rune[:type]: a String rune crashes and a String power slips through.
    rb`class UnknownRune < StandardError; end

def rune_damage(rune)
  case rune[:type]
  when :fire then rune[:power] * 2
  when :ice then rune[:power]
  when :heal then 0
  else raise UnknownRune, "unknown rune"
  end
end

def safe_damage(rune)
  rune_damage(rune)
rescue UnknownRune
  -1
end
`,
  ],
  tests: [
    { run: "p rune_damage({type: :fire, power: 3})", expect: "6" },
    { run: "p safe_damage({type: :spell})", expect: "-1" },
    { run: "p rune_damage({type: :ice, power: 4, extra: 1})", expect: "4", hidden: true },
    { run: "p rune_damage({type: :heal})", expect: "0", hidden: true },
    { run: 'p safe_damage("fire")', expect: "-1", hidden: true },
    { run: 'begin\n  rune_damage({type: :fire, power: "3"})\nrescue UnknownRune => e\n  puts e.message\nend', expect: "unknown rune", hidden: true },
  ],
  hint: L(
    "A case/in with no matching branch raises NoMatchingPatternError. What should the last branch do instead?",
    "Un case/in sin rama que encaje lanza NoMatchingPatternError. ¿Qué debería hacer la última rama?",
    "どの in にも合わない case/in は NoMatchingPatternError になる。最後の枝で何をすべき？",
  ),
  note: "recap-patterns",
  explain: L(
    "Hash patterns check shape and types (Integer => power) and ignore extra keys; else raises UnknownRune, which safe_damage rescues.",
    "Los patrones de hash revisan forma y tipos (Integer => power) e ignoran claves extra; else lanza UnknownRune, que safe_damage rescata.",
    "ハッシュパターンは形と型（Integer => power）を調べ、余分なキーは無視する。else で UnknownRune を投げ、safe_damage が rescue する。",
  ),
};

// ─── EXAMS: JUNIOR (ide) ──────────────────────────────────────────────────────

export const titleCaseTask: ExamQuestion = {
  slug: "title-case",
  kind: "code",
  mode: "ide",
  topic: "strings",
  difficulty: 1,
  prompt: L("Coding: title case", "Código: mayúscula en cada palabra", "コーディング：単語の先頭を大文字に"),
  brief: L(
    'Write title_case(text): every word starts with an upper-case letter and the rest of the word is lower case. Words are separated by single spaces. title_case("hELLO ruby") is "Hello Ruby"; an empty string stays empty.',
    'Escribe title_case(text): cada palabra empieza con mayúscula y el resto de la palabra va en minúscula. Las palabras se separan con un espacio. title_case("hELLO ruby") es "Hello Ruby"; un string vacío queda vacío.',
    'title_case(text) を書こう。各単語の先頭を大文字、残りを小文字にする。単語は空白1つで区切られる。title_case("hELLO ruby") は "Hello Ruby"、空文字列は空のまま。',
  ),
  starter: rb`def title_case(text)
  # your code here
  text
end
`,
  solution: rb`def title_case(text)
  text.split(" ").map(&:capitalize).join(" ")
end
`,
  nearMiss: [
    // String#capitalize only touches the first word.
    rb`def title_case(text)
  text.capitalize
end
`,
    // Upper-cases the first letter but leaves the rest as it was.
    rb`def title_case(text)
  text.split(" ").map { |w| w[0].upcase + w[1..] }.join(" ")
end
`,
  ],
  tests: [
    { run: 'p title_case("hello ruby world")', expect: '"Hello Ruby World"' },
    { run: 'p title_case("hELLO")', expect: '"Hello"' },
    { run: 'p title_case("")', expect: '""', hidden: true },
    { run: 'p title_case("a b")', expect: '"A B"', hidden: true },
    { run: 'p title_case("ruby 3 ROCKS")', expect: '"Ruby 3 Rocks"', hidden: true },
  ],
  explain: L(
    "Split into words, capitalize each one (it also lower-cases the rest), and join with spaces. String#capitalize alone only fixes the first word.",
    "Separa en palabras, capitalize a cada una (también pasa el resto a minúscula) y une con espacios. capitalize solo arregla la primera palabra.",
    "単語に分けて各単語を capitalize（残りも小文字になる）し、空白でつなぐ。文字列全体の capitalize は最初の単語しか直さない。",
  ),
};

export const letterCountsTask: ExamQuestion = {
  slug: "letter-counts",
  kind: "code",
  mode: "ide",
  topic: "hashes",
  difficulty: 1,
  prompt: L("Coding: count the letters", "Código: cuenta las letras", "コーディング：文字を数える"),
  brief: L(
    'Write letter_counts(text): a hash of letter => how many times it appears. Count a-z only, ignoring case (\'A\' counts as "a"); skip spaces, digits and punctuation. Keys in alphabetical order. letter_counts("Abba") is {"a" => 2, "b" => 2}.',
    'Escribe letter_counts(text): un hash de letra => cuántas veces aparece. Cuenta solo a-z sin distinguir mayúsculas (\'A\' cuenta como "a"); ignora espacios, dígitos y puntuación. Claves en orden alfabético. letter_counts("Abba") es {"a" => 2, "b" => 2}.',
    'letter_counts(text) を書こう。「文字 => 出現回数」のハッシュを返す。a-z だけを大文字小文字を区別せずに数え（\'A\' は "a"）、空白・数字・記号は無視。キーはアルファベット順。letter_counts("Abba") は {"a" => 2, "b" => 2}。',
  ),
  starter: rb`def letter_counts(text)
  # your code here
  {}
end
`,
  solution: rb`def letter_counts(text)
  text.downcase.scan(/[a-z]/).tally.sort.to_h
end
`,
  nearMiss: [
    // Keys come out in first-seen order, not alphabetical.
    rb`def letter_counts(text)
  text.downcase.scan(/[a-z]/).tally
end
`,
    // Counts every character, case-sensitive.
    rb`def letter_counts(text)
  text.chars.tally.sort.to_h
end
`,
  ],
  tests: [
    { run: 'p letter_counts("banana")', expect: '{"a" => 3, "b" => 1, "n" => 2}' },
    { run: 'p letter_counts("")', expect: "{}" },
    { run: 'p letter_counts("Ruby Rocks!")', expect: '{"b" => 1, "c" => 1, "k" => 1, "o" => 1, "r" => 2, "s" => 1, "u" => 1, "y" => 1}', hidden: true },
    { run: 'p letter_counts("AaA")', expect: '{"a" => 3}', hidden: true },
    { run: 'p letter_counts("123 ...")', expect: "{}", hidden: true },
  ],
  explain: L(
    "downcase, keep the letters with scan(/[a-z]/), count them with tally, then sort.to_h to put the keys in alphabetical order.",
    "downcase, toma las letras con scan(/[a-z]/), cuéntalas con tally y usa sort.to_h para ordenar las claves alfabéticamente.",
    "downcase して scan(/[a-z]/) で文字だけ取り、tally で数え、sort.to_h でキーをアルファベット順にする。",
  ),
};

export const secondLargestTask: ExamQuestion = {
  slug: "second-largest",
  kind: "code",
  mode: "ide",
  topic: "arrays",
  difficulty: 1,
  prompt: L("Coding: the second largest number", "Código: el segundo número más grande", "コーディング：2番目に大きい数"),
  brief: L(
    "Write second_largest(nums): the second largest DISTINCT number in the array of integers, or nil when there isn't one. second_largest([5, 5, 2]) is 2; second_largest([7]) and second_largest([]) are nil. Don't modify nums.",
    "Escribe second_largest(nums): el segundo número DISTINTO más grande del array de enteros, o nil si no existe. second_largest([5, 5, 2]) es 2; second_largest([7]) y second_largest([]) son nil. No modifiques nums.",
    "second_largest(nums) を書こう。整数の配列で「異なる値として」2番目に大きい数を返し、なければ nil。second_largest([5, 5, 2]) は 2、second_largest([7]) と second_largest([]) は nil。nums は変えないこと。",
  ),
  starter: rb`def second_largest(nums)
  # your code here
  nil
end
`,
  solution: rb`def second_largest(nums)
  nums.uniq.sort[-2]
end
`,
  nearMiss: [
    // Duplicates: [5, 5, 2] gives 5.
    rb`def second_largest(nums)
  nums.sort[-2]
end
`,
    // max(2) keeps duplicates and returns the only number for a one-item array.
    rb`def second_largest(nums)
  nums.max(2).last
end
`,
  ],
  tests: [
    { run: "p second_largest([3, 9, 4])", expect: "4" },
    { run: "p second_largest([7])", expect: "nil" },
    { run: "p second_largest([5, 5, 2])", expect: "2", hidden: true },
    { run: "p second_largest([])", expect: "nil", hidden: true },
    { run: "p second_largest([-1, -3, -2])", expect: "-2", hidden: true },
    { run: "p second_largest([8, 8])", expect: "nil", hidden: true },
  ],
  explain: L(
    "Remove duplicates first with uniq, sort, and take [-2]. Indexing past the start of an array returns nil, which covers short arrays.",
    "Quita duplicados con uniq, ordena y toma [-2]. Un índice fuera del array devuelve nil, lo que cubre los arrays cortos.",
    "先に uniq で重複を消し、sort して [-2] を取る。範囲外の添字は nil を返すので、短い配列もそれで済む。",
  ),
};

export const fizzbuzzTask: ExamQuestion = {
  slug: "fizzbuzz",
  kind: "code",
  mode: "ide",
  topic: "control",
  difficulty: 1,
  prompt: L("Coding: FizzBuzz", "Código: FizzBuzz", "コーディング：FizzBuzz"),
  brief: L(
    'Write fizzbuzz(n): an array of strings for 1..n. Multiples of 3 become "Fizz", multiples of 5 "Buzz", multiples of both "FizzBuzz", and every other number its digits as a string ("1"). fizzbuzz(0) is [].',
    'Escribe fizzbuzz(n): un array de strings para 1..n. Los múltiplos de 3 son "Fizz", los de 5 "Buzz", los de ambos "FizzBuzz" y los demás números, sus dígitos como string ("1"). fizzbuzz(0) es [].',
    'fizzbuzz(n) を書こう。1..n の文字列の配列を返す。3の倍数は "Fizz"、5の倍数は "Buzz"、両方の倍数は "FizzBuzz"、それ以外は数字の文字列（"1"）。fizzbuzz(0) は []。',
  ),
  starter: rb`def fizzbuzz(n)
  # your code here
  []
end
`,
  solution: rb`def fizzbuzz(n)
  (1..n).map do |i|
    if i % 15 == 0 then "FizzBuzz"
    elsif i % 3 == 0 then "Fizz"
    elsif i % 5 == 0 then "Buzz"
    else i.to_s
    end
  end
end
`,
  nearMiss: [
    // Checks 3 before 15: 15 becomes "Fizz".
    rb`def fizzbuzz(n)
  (1..n).map do |i|
    if i % 3 == 0 then "Fizz"
    elsif i % 5 == 0 then "Buzz"
    elsif i % 15 == 0 then "FizzBuzz"
    else i.to_s
    end
  end
end
`,
    // Leaves plain numbers as integers.
    rb`def fizzbuzz(n)
  (1..n).map do |i|
    if i % 15 == 0 then "FizzBuzz"
    elsif i % 3 == 0 then "Fizz"
    elsif i % 5 == 0 then "Buzz"
    else i
    end
  end
end
`,
  ],
  tests: [
    { run: "p fizzbuzz(5)", expect: '["1", "2", "Fizz", "4", "Buzz"]' },
    { run: "p fizzbuzz(0)", expect: "[]" },
    { run: "p fizzbuzz(15).last", expect: '"FizzBuzz"', hidden: true },
    { run: 'p fizzbuzz(15).count("Fizz")', expect: "4", hidden: true },
    { run: "p fizzbuzz(10)[9]", expect: '"Buzz"', hidden: true },
  ],
  explain: L(
    "Test the most specific case (15) first, or 15 stops at the 3 branch. map over 1..n and turn plain numbers into strings with to_s.",
    "Prueba primero el caso más específico (15), o 15 se queda en la rama del 3. Usa map sobre 1..n y pasa los números a string con to_s.",
    "一番細かい条件（15）を先に調べないと、15 は 3 の枝で止まる。1..n を map し、普通の数は to_s で文字列にする。",
  ),
};

// ─── EXAMS: MID (2 ide + 2 paper) ─────────────────────────────────────────────

export const wordsByLengthTask: ExamQuestion = {
  slug: "words-by-length",
  kind: "code",
  mode: "ide",
  topic: "enumerable",
  difficulty: 2,
  prompt: L("Coding: group words by length", "Código: agrupa palabras por largo", "コーディング：長さで単語を分ける"),
  brief: L(
    "Write words_by_length(words): a hash of length => the words of that length. Each word appears once, words in alphabetical order, keys in ascending order. words_by_length(%w[pear fig kiwi]) is {3 => [\"fig\"], 4 => [\"kiwi\", \"pear\"]}.",
    "Escribe words_by_length(words): un hash de largo => las palabras de ese largo. Cada palabra aparece una vez, las palabras en orden alfabético y las claves en orden ascendente. words_by_length(%w[pear fig kiwi]) es {3 => [\"fig\"], 4 => [\"kiwi\", \"pear\"]}.",
    "words_by_length(words) を書こう。「長さ => その長さの単語」のハッシュを返す。各単語は1回だけ、単語はアルファベット順、キーは昇順。words_by_length(%w[pear fig kiwi]) は {3 => [\"fig\"], 4 => [\"kiwi\", \"pear\"]}。",
  ),
  starter: rb`def words_by_length(words)
  # your code here
  {}
end
`,
  solution: rb`def words_by_length(words)
  words.uniq.sort.group_by(&:length).sort.to_h
end
`,
  nearMiss: [
    // group_by keeps first-seen order and duplicates.
    rb`def words_by_length(words)
  words.group_by(&:length)
end
`,
    // Words sorted, but keys follow the sorted words, not the lengths.
    rb`def words_by_length(words)
  words.uniq.sort.group_by(&:length)
end
`,
  ],
  tests: [
    { run: "p words_by_length(%w[pear fig apple kiwi])", expect: '{3 => ["fig"], 4 => ["kiwi", "pear"], 5 => ["apple"]}' },
    { run: "p words_by_length([])", expect: "{}" },
    { run: "p words_by_length(%w[b a b])", expect: '{1 => ["a", "b"]}', hidden: true },
    { run: "p words_by_length(%w[ccc a bb aa])", expect: '{1 => ["a"], 2 => ["aa", "bb"], 3 => ["ccc"]}', hidden: true },
  ],
  explain: L(
    "uniq.sort puts the words in order, group_by(&:length) keeps that order inside each group, and sort.to_h orders the keys.",
    "uniq.sort ordena las palabras, group_by(&:length) mantiene ese orden en cada grupo y sort.to_h ordena las claves.",
    "uniq.sort で単語を並べ、group_by(&:length) は各グループ内でその順を保ち、sort.to_h でキーを並べる。",
  ),
};

export const composeTask: ExamQuestion = {
  slug: "compose",
  kind: "code",
  mode: "ide",
  topic: "blocks",
  difficulty: 2,
  prompt: L("Coding: compose functions", "Código: compón funciones", "コーディング：関数の合成"),
  brief: L(
    "Write compose(*fns): return a lambda that takes one value and passes it through every function from LEFT to RIGHT. fns can be lambdas, procs or Method objects (anything with call). With no functions, the lambda returns its input unchanged. compose(add1, double).call(3) is 8.",
    "Escribe compose(*fns): devuelve una lambda que recibe un valor y lo pasa por cada función de IZQUIERDA a DERECHA. fns pueden ser lambdas, procs u objetos Method (todo lo que tenga call). Sin funciones, la lambda devuelve su entrada sin cambios. compose(add1, double).call(3) es 8.",
    "compose(*fns) を書こう。値を1つ受け取り、各関数に「左から右へ」通すラムダを返す。fns はラムダ・Proc・Method（call できるもの）。関数がなければ入力をそのまま返す。compose(add1, double).call(3) は 8。",
  ),
  starter: rb`def compose(*fns)
  # your code here
  ->(x) { x }
end
`,
  solution: rb`def compose(*fns)
  ->(x) { fns.reduce(x) { |acc, f| f.call(acc) } }
end
`,
  nearMiss: [
    // Right to left, like math notation.
    rb`def compose(*fns)
  ->(x) { fns.reverse.reduce(x) { |acc, f| f.call(acc) } }
end
`,
    // reduce(:>>) returns nil when there are no functions.
    rb`def compose(*fns)
  fns.reduce(:>>)
end
`,
  ],
  tests: [
    { run: "add1 = ->(x) { x + 1 }\ndouble = ->(x) { x * 2 }\np compose(add1, double).call(3)", expect: "8" },
    { run: "p compose.call(5)", expect: "5" },
    { run: "p compose(->(x) { x * 2 }, ->(x) { x + 1 }).call(3)", expect: "7", hidden: true },
    { run: 'p compose(:upcase.to_proc, :reverse.to_proc).call("ab")', expect: '"BA"', hidden: true },
    { run: 'p compose(method(:Integer), ->(n) { n * 10 }).call("4")', expect: "40", hidden: true },
  ],
  explain: L(
    "Start from the input and reduce over the functions in order, calling each one on the running value. An empty list leaves the input as it is.",
    "Parte de la entrada y recorre las funciones en orden con reduce, llamando a cada una con el valor acumulado. Una lista vacía deja la entrada igual.",
    "入力から始めて関数を順に reduce し、途中の値でそれぞれ call する。空のリストなら入力はそのまま。",
  ),
};

export const playlistTask: ExamQuestion = {
  slug: "playlist",
  kind: "code",
  mode: "paper",
  topic: "modules",
  difficulty: 2,
  prompt: L("Written test: an Enumerable playlist", "Prueba escrita: una playlist Enumerable", "筆記：Enumerable なプレイリスト"),
  brief: L(
    "Finish class Playlist, which includes Enumerable. each yields every song in order and returns self; called without a block it returns an Enumerator (Playlist.new(\"a\").each.next is \"a\"). << adds a song and returns the playlist itself, so calls chain: Playlist.new << \"a\" << \"b\". Then sort, map, first and include? work for free.",
    "Termina la clase Playlist, que incluye Enumerable. each entrega cada canción en orden y devuelve self; sin bloque devuelve un Enumerator (Playlist.new(\"a\").each.next es \"a\"). << agrega una canción y devuelve la propia playlist, para encadenar: Playlist.new << \"a\" << \"b\". Así sort, map, first e include? funcionan gratis.",
    "Enumerable を include した Playlist を完成させよう。each は曲を順に yield して self を返し、ブロックなしなら Enumerator を返す（Playlist.new(\"a\").each.next は \"a\"）。<< は曲を足してプレイリスト自身を返すので Playlist.new << \"a\" << \"b\" とつなげられる。sort・map・first・include? はおまけで動く。",
  ),
  starter: rb`class Playlist
  include Enumerable

  def initialize(*songs)
    @songs = songs
  end

  def each
    # your code here
  end

  def <<(song)
    # your code here
  end
end
`,
  solution: rb`class Playlist
  include Enumerable

  def initialize(*songs)
    @songs = songs
  end

  def each
    return to_enum(:each) unless block_given?
    @songs.each { |song| yield song }
    self
  end

  def <<(song)
    @songs << song
    self
  end
end
`,
  nearMiss: [
    // No Enumerator without a block: yield raises LocalJumpError.
    rb`class Playlist
  include Enumerable

  def initialize(*songs)
    @songs = songs
  end

  def each
    @songs.each { |song| yield song }
    self
  end

  def <<(song)
    @songs << song
    self
  end
end
`,
    // << returns the inner array, so the chain leaks it.
    rb`class Playlist
  include Enumerable

  def initialize(*songs)
    @songs = songs
  end

  def each(&block)
    return to_enum(:each) unless block
    @songs.each(&block)
    self
  end

  def <<(song)
    @songs << song
  end
end
`,
  ],
  tests: [
    { run: 'p Playlist.new("b", "a", "c").sort', expect: '["a", "b", "c"]' },
    { run: 'p Playlist.new("x", "yy").map(&:size)', expect: "[1, 2]" },
    { run: 'list = Playlist.new << "a" << "b"\np [list.class.name, list.to_a]', expect: '["Playlist", ["a", "b"]]', hidden: true },
    { run: "p Playlist.new.first", expect: "nil", hidden: true },
    { run: 'p Playlist.new("a", "b").each.next', expect: '"a"', hidden: true },
    { run: 'p Playlist.new("q").include?("q")', expect: "true", hidden: true },
  ],
  explain: L(
    "Enumerable only needs each. Return to_enum(:each) when no block is given, and make << return self so the calls chain on the playlist.",
    "Enumerable solo necesita each. Devuelve to_enum(:each) si no hay bloque, y haz que << devuelva self para encadenar sobre la playlist.",
    "Enumerable に必要なのは each だけ。ブロックがなければ to_enum(:each) を返し、<< は self を返せばプレイリストでつなげられる。",
  ),
};

export const parseQueryTask: ExamQuestion = {
  slug: "parse-query",
  kind: "code",
  mode: "paper",
  topic: "hashes",
  difficulty: 2,
  prompt: L("Written test: parse a query string", "Prueba escrita: lee un query string", "筆記：クエリ文字列を読む"),
  brief: L(
    'Write parse_query(str): pairs are separated by "&" and each pair is key=value. Return a hash with Symbol keys and String values. Only the FIRST "=" splits ("x=a=b" gives "a=b"); "q=" gives ""; a key without "=" ("flag") gives true. Skip empty pieces; a later key wins. parse_query("a=1&flag") is {a: "1", flag: true}; "" gives {}.',
    'Escribe parse_query(str): los pares se separan con "&" y cada par es key=value. Devuelve un hash con claves Symbol y valores String. Solo el PRIMER "=" separa ("x=a=b" da "a=b"); "q=" da ""; una clave sin "=" ("flag") da true. Ignora los trozos vacíos; una clave repetida gana la última. parse_query("a=1&flag") es {a: "1", flag: true}; "" da {}.',
    'parse_query(str) を書こう。ペアは "&" で区切られ、各ペアは key=value。キーは Symbol、値は String のハッシュを返す。分けるのは「最初の」"=" だけ（"x=a=b" は "a=b"）、"q=" は ""、"=" のないキー（"flag"）は true。空の部分は飛ばし、同じキーは後が勝つ。parse_query("a=1&flag") は {a: "1", flag: true}、"" は {}。',
  ),
  starter: rb`def parse_query(str)
  # your code here
  {}
end
`,
  solution: rb`def parse_query(str)
  str.split("&").each_with_object({}) do |pair, out|
    next if pair.empty?
    key, value = pair.split("=", 2)
    out[key.to_sym] = value.nil? ? true : value
  end
end
`,
  nearMiss: [
    // split("=") cuts every "=" and drops a trailing empty value.
    rb`def parse_query(str)
  str.split("&").each_with_object({}) do |pair, out|
    next if pair.empty?
    key, value = pair.split("=")
    out[key.to_sym] = value.nil? ? true : value
  end
end
`,
    // String keys instead of Symbols.
    rb`def parse_query(str)
  str.split("&").each_with_object({}) do |pair, out|
    next if pair.empty?
    key, value = pair.split("=", 2)
    out[key] = value.nil? ? true : value
  end
end
`,
  ],
  tests: [
    { run: 'p parse_query("a=1&b=two&flag")', expect: '{a: "1", b: "two", flag: true}' },
    { run: 'p parse_query("")', expect: "{}" },
    { run: 'p parse_query("x=a=b")', expect: '{x: "a=b"}', hidden: true },
    { run: 'p parse_query("a=1&&a=2")', expect: '{a: "2"}', hidden: true },
    { run: 'p parse_query("q=")', expect: '{q: ""}', hidden: true },
  ],
  explain: L(
    "split(\"=\", 2) cuts only at the first \"=\" and keeps an empty value; a nil value means there was no \"=\" at all.",
    "split(\"=\", 2) corta solo en el primer \"=\" y conserva un valor vacío; un valor nil significa que no había \"=\".",
    "split(\"=\", 2) は最初の \"=\" だけで切り、空の値も残す。値が nil なら \"=\" がなかったということ。",
  ),
};

// ─── EXAMS: SENIOR (1 ide + 3 paper) ──────────────────────────────────────────

export const settingsTask: ExamQuestion = {
  slug: "settings",
  kind: "code",
  mode: "ide",
  topic: "metaprogramming",
  difficulty: 3,
  prompt: L("Coding: dynamic settings with method_missing", "Código: ajustes dinámicos con method_missing", "コーディング：method_missing で動的設定"),
  brief: L(
    "Finish class Settings with method_missing. s.color = \"red\" stores a value; s.color reads it; s.color? is true when color was set (even to nil). Reading a name that was never set raises NoMethodError, as usual. respond_to? must be true for names that were set and for any name ending in = or ?, and false otherwise.",
    "Termina la clase Settings con method_missing. s.color = \"red\" guarda un valor; s.color lo lee; s.color? es true si color se asignó (aunque sea a nil). Leer un nombre nunca asignado lanza NoMethodError, como siempre. respond_to? debe ser true para nombres asignados y para cualquier nombre que termine en = o ?, y false en otro caso.",
    "method_missing で Settings を完成させよう。s.color = \"red\" で保存、s.color で読み出し、s.color? は設定済みなら（nil でも）true。設定していない名前を読むと通常どおり NoMethodError。respond_to? は設定済みの名前と = や ? で終わる名前で true、それ以外は false。",
  ),
  starter: rb`class Settings
  def initialize
    @values = {}
  end

  def method_missing(name, *args)
    # your code here
    super
  end
end
`,
  solution: rb`class Settings
  def initialize
    @values = {}
  end

  def method_missing(name, *args)
    key = name.to_s
    if key.end_with?("=") && args.size == 1
      @values[key.chomp("=").to_sym] = args.first
    elsif key.end_with?("?") && args.empty?
      @values.key?(key.chomp("?").to_sym)
    elsif args.empty? && @values.key?(name)
      @values[name]
    else
      super
    end
  end

  def respond_to_missing?(name, include_private = false)
    name.to_s.end_with?("=", "?") || @values.key?(name) || super
  end
end
`,
  nearMiss: [
    // Unknown names return nil instead of raising.
    rb`class Settings
  def initialize
    @values = {}
  end

  def method_missing(name, *args)
    key = name.to_s
    if key.end_with?("=")
      @values[key.chomp("=").to_sym] = args.first
    elsif key.end_with?("?")
      @values.key?(key.chomp("?").to_sym)
    else
      @values[name]
    end
  end

  def respond_to_missing?(name, include_private = false)
    name.to_s.end_with?("=", "?") || @values.key?(name) || super
  end
end
`,
    // Forgets respond_to_missing?, and ? checks truthiness instead of presence.
    rb`class Settings
  def initialize
    @values = {}
  end

  def method_missing(name, *args)
    key = name.to_s
    if key.end_with?("=")
      @values[key.chomp("=").to_sym] = args.first
    elsif key.end_with?("?")
      !!@values[key.chomp("?").to_sym]
    elsif @values.key?(name)
      @values[name]
    else
      super
    end
  end
end
`,
  ],
  tests: [
    { run: 's = Settings.new\ns.color = "red"\np s.color', expect: '"red"' },
    { run: "s = Settings.new\np s.color?", expect: "false" },
    { run: "s = Settings.new\ns.size = 3\np [s.size?, s.respond_to?(:size), s.respond_to?(:shape)]", expect: "[true, true, false]", hidden: true },
    { run: 's = Settings.new\nbegin\n  s.shape\nrescue NoMethodError\n  puts "no shape"\nend', expect: "no shape", hidden: true },
    { run: "s = Settings.new\ns.debug = nil\np [s.debug?, s.debug]", expect: "[true, nil]", hidden: true },
  ],
  explain: L(
    "Handle name=, name? and known names in method_missing and call super for the rest. Pair it with respond_to_missing? so respond_to? tells the truth.",
    "Maneja name=, name? y los nombres conocidos en method_missing y llama a super para el resto. Suma respond_to_missing? para que respond_to? diga la verdad.",
    "method_missing で name=・name?・既知の名前を処理し、それ以外は super。respond_to_missing? も定義すれば respond_to? が正しく答える。",
  ),
};

export const historyTask: ExamQuestion = {
  slug: "history",
  kind: "code",
  mode: "paper",
  topic: "metaprogramming",
  difficulty: 3,
  prompt: L("Written test: attributes with history", "Prueba escrita: atributos con historial", "筆記：履歴つき属性"),
  brief: L(
    "Write module History with a class macro attr_with_history(*names); classes use it with extend History. For each name it defines a reader (nil until set), a writer, and name_history: every value assigned to THAT object, oldest first ([] before any assignment). Each object keeps its own history. Example: h.hp = 3; h.hp = 5 gives h.hp == 5 and h.hp_history == [3, 5].",
    "Escribe el módulo History con una macro de clase attr_with_history(*names); las clases la usan con extend History. Para cada nombre define un lector (nil hasta asignar), un escritor y name_history: cada valor asignado a ESE objeto, del más viejo al más nuevo ([] antes de asignar). Cada objeto tiene su propio historial. Ejemplo: h.hp = 3; h.hp = 5 da h.hp == 5 y h.hp_history == [3, 5].",
    "クラスマクロ attr_with_history(*names) を持つ History モジュールを書こう。クラスは extend History で使う。名前ごとに読み出し（代入まで nil）、書き込み、name_history（「その」オブジェクトに代入した値を古い順、代入前は []）を定義する。履歴はオブジェクトごと。例：h.hp = 3; h.hp = 5 で h.hp == 5、h.hp_history == [3, 5]。",
  ),
  starter: rb`module History
  def attr_with_history(*names)
    # your code here
  end
end
`,
  solution: rb`module History
  def attr_with_history(*names)
    names.each do |name|
      define_method(name) { instance_variable_get("@#{name}") }
      define_method("#{name}_history") { instance_variable_get("@#{name}_history") || [] }
      define_method("#{name}=") do |value|
        history = instance_variable_get("@#{name}_history") || []
        instance_variable_set("@#{name}_history", history + [value])
        instance_variable_set("@#{name}", value)
      end
    end
  end
end
`,
  nearMiss: [
    // The block captures ONE array per name: every object shares the history.
    rb`module History
  def attr_with_history(*names)
    names.each do |name|
      history = []
      define_method(name) { instance_variable_get("@#{name}") }
      define_method("#{name}_history") { history }
      define_method("#{name}=") do |value|
        history << value
        instance_variable_set("@#{name}", value)
      end
    end
  end
end
`,
    // The history reader returns nil before the first assignment.
    rb`module History
  def attr_with_history(*names)
    names.each do |name|
      define_method(name) { instance_variable_get("@#{name}") }
      define_method("#{name}_history") { instance_variable_get("@#{name}_history") }
      define_method("#{name}=") do |value|
        history = instance_variable_get("@#{name}_history") || []
        instance_variable_set("@#{name}_history", history + [value])
        instance_variable_set("@#{name}", value)
      end
    end
  end
end
`,
  ],
  tests: [
    { run: "class Hero\n  extend History\n  attr_with_history :hp\nend\nh = Hero.new\nh.hp = 3\nh.hp = 5\np [h.hp, h.hp_history]", expect: "[5, [3, 5]]" },
    { run: "class Mage\n  extend History\n  attr_with_history :mp\nend\np Mage.new.mp_history", expect: "[]" },
    { run: "class Elf\n  extend History\n  attr_with_history :xp\nend\na = Elf.new\nb = Elf.new\na.xp = 1\nb.xp = 2\np [a.xp_history, b.xp_history]", expect: "[[1], [2]]", hidden: true },
    { run: "class Orc\n  extend History\n  attr_with_history :hp, :mp\nend\no = Orc.new\no.hp = 1\no.mp = 9\np [o.hp_history, o.mp_history, o.mp]", expect: "[[1], [9], 9]", hidden: true },
    { run: "p Class.new { extend History; attr_with_history :gold }.new.gold", expect: "nil", hidden: true },
  ],
  explain: L(
    "define_method blocks are closures: a local array is shared by every object. Keep the history in an instance variable of each object instead.",
    "Los bloques de define_method son closures: un array local lo comparten todos los objetos. Guarda el historial en una variable de instancia de cada objeto.",
    "define_method のブロックはクロージャなので、ローカルの配列は全オブジェクトで共有される。履歴は各オブジェクトのインスタンス変数に持たせる。",
  ),
};

export const validateTask: ExamQuestion = {
  slug: "validate",
  kind: "code",
  mode: "paper",
  topic: "exceptions",
  difficulty: 3,
  prompt: L("Written test: a validation error", "Prueba escrita: un error de validación", "筆記：検証エラー"),
  brief: L(
    "Write ValidationError (a StandardError with an errors array; its message is the errors joined with \", \") and validate!(user) for a hash with :name and :age. Collect EVERY problem, in this order: \"name can't be blank\" (nil or only spaces) and \"age must be a non-negative integer\" (not an Integer, or below 0). Raise ValidationError if there are any; otherwise return user.",
    "Escribe ValidationError (un StandardError con un array errors; su mensaje son los errores unidos con \", \") y validate!(user) para un hash con :name y :age. Junta TODOS los problemas, en este orden: \"name can't be blank\" (nil o solo espacios) y \"age must be a non-negative integer\" (no es Integer, o es menor que 0). Lanza ValidationError si hay alguno; si no, devuelve user.",
    "ValidationError（errors 配列を持つ StandardError。メッセージは errors を \", \" でつないだもの）と、:name と :age を持つハッシュ用の validate!(user) を書こう。問題は「全部」集め、順に \"name can't be blank\"（nil か空白だけ）、\"age must be a non-negative integer\"（Integer でないか 0 未満）。あれば ValidationError、なければ user を返す。",
  ),
  starter: rb`class ValidationError < StandardError
  attr_reader :errors
  # your code here
end

def validate!(user)
  # your code here
end
`,
  solution: rb`class ValidationError < StandardError
  attr_reader :errors

  def initialize(errors)
    @errors = errors
    super(errors.join(", "))
  end
end

def validate!(user)
  errors = []
  name = user[:name]
  errors << "name can't be blank" if name.nil? || name.strip.empty?
  age = user[:age]
  errors << "age must be a non-negative integer" unless age.is_a?(Integer) && age >= 0
  raise ValidationError, errors unless errors.empty?
  user
end
`,
  nearMiss: [
    // Stops at the first problem.
    rb`class ValidationError < StandardError
  attr_reader :errors

  def initialize(errors)
    @errors = errors
    super(errors.join(", "))
  end
end

def validate!(user)
  name = user[:name]
  raise ValidationError, ["name can't be blank"] if name.nil? || name.strip.empty?
  age = user[:age]
  raise ValidationError, ["age must be a non-negative integer"] unless age.is_a?(Integer) && age >= 0
  user
end
`,
    // Inherits from Exception: a bare rescue no longer catches it.
    rb`class ValidationError < Exception
  attr_reader :errors

  def initialize(errors)
    @errors = errors
    super(errors.join(", "))
  end
end

def validate!(user)
  errors = []
  name = user[:name]
  errors << "name can't be blank" if name.nil? || name.strip.empty?
  age = user[:age]
  errors << "age must be a non-negative integer" unless age.is_a?(Integer) && age >= 0
  raise ValidationError, errors unless errors.empty?
  user
end
`,
  ],
  tests: [
    { run: 'p validate!({name: "Kira", age: 3})', expect: '{name: "Kira", age: 3}' },
    { run: 'begin\n  validate!({name: " ", age: -1})\nrescue ValidationError => e\n  p e.errors\nend', expect: "[\"name can't be blank\", \"age must be a non-negative integer\"]" },
    { run: 'begin\n  validate!({name: "Bo"})\nrescue ValidationError => e\n  puts e.message\nend', expect: "age must be a non-negative integer", hidden: true },
    { run: "begin\n  validate!({})\nrescue => e\n  puts e.class\nend", expect: "ValidationError", hidden: true },
    { run: 'begin\n  validate!({name: "", age: 2})\nrescue ValidationError => e\n  puts e.message\nend', expect: "name can't be blank", hidden: true },
    { run: 'p validate!({name: "Ada", age: 0})[:age]', expect: "0", hidden: true },
  ],
  explain: L(
    "Collect messages in an array and raise once at the end. Inherit from StandardError: a bare rescue only catches StandardError and its subclasses.",
    "Junta los mensajes en un array y lanza una sola vez al final. Hereda de StandardError: un rescue sin clase solo atrapa StandardError y sus hijas.",
    "メッセージを配列に集めて最後に1回だけ raise。StandardError を継承すること。クラス指定なしの rescue は StandardError 系しか捕まえない。",
  ),
};

export const describeEventTask: ExamQuestion = {
  slug: "describe-event",
  kind: "code",
  mode: "paper",
  topic: "pattern_matching",
  difficulty: 3,
  prompt: L("Written test: describe events with case/in", "Prueba escrita: describe eventos con case/in", "筆記：case/in でイベントを説明"),
  brief: L(
    'Write describe(event) with case/in. {type: "login", user: {name: String}} gives "login: <name>"; {type: "purchase", items: []} gives "empty purchase"; {type: "purchase", items: <non-empty array>} gives "purchase: <count> items". Anything else, including a login without a String name or something that is not a hash, gives "unknown". Extra keys are fine.',
    'Escribe describe(event) con case/in. {type: "login", user: {name: String}} da "login: <name>"; {type: "purchase", items: []} da "empty purchase"; {type: "purchase", items: <array no vacío>} da "purchase: <cantidad> items". Cualquier otra cosa, incluido un login sin name String o algo que no es hash, da "unknown". Las claves extra no importan.',
    'case/in で describe(event) を書こう。{type: "login", user: {name: String}} は "login: <name>"、{type: "purchase", items: []} は "empty purchase"、{type: "purchase", items: <空でない配列>} は "purchase: <個数> items"。それ以外（String の name がない login、ハッシュでないもの）は "unknown"。余分なキーは可。',
  ),
  starter: rb`def describe(event)
  # your code here
end
`,
  solution: rb`def describe(event)
  case event
  in {type: "login", user: {name: String => name}}
    "login: #{name}"
  in {type: "purchase", items: []}
    "empty purchase"
  in {type: "purchase", items: [_, *] => items}
    "purchase: #{items.size} items"
  else
    "unknown"
  end
end
`,
  nearMiss: [
    // Any Array matches, so an empty purchase says "0 items".
    rb`def describe(event)
  case event
  in {type: "login", user: {name: String => name}}
    "login: #{name}"
  in {type: "purchase", items: Array => items}
    "purchase: #{items.size} items"
  else
    "unknown"
  end
end
`,
    // No else: unmatched events raise NoMatchingPatternError.
    rb`def describe(event)
  case event
  in {type: "login", user: {name: String => name}}
    "login: #{name}"
  in {type: "purchase", items: []}
    "empty purchase"
  in {type: "purchase", items: [_, *] => items}
    "purchase: #{items.size} items"
  end
end
`,
  ],
  tests: [
    { run: 'p describe({type: "login", user: {name: "Kira", id: 1}})', expect: '"login: Kira"' },
    { run: 'p describe({type: "purchase", items: ["gem", "key"]})', expect: '"purchase: 2 items"' },
    { run: 'p describe({type: "purchase", items: []})', expect: '"empty purchase"', hidden: true },
    { run: 'p describe({type: "login", user: {id: 1}})', expect: '"unknown"', hidden: true },
    { run: 'p describe("login")', expect: '"unknown"', hidden: true },
    { run: 'p describe({type: "purchase", items: "gem"})', expect: '"unknown"', hidden: true },
  ],
  explain: L(
    "Nested hash patterns check the shape; put the empty-array pattern before [_, *] (one or more), and end with else so no event raises.",
    "Los patrones de hash anidados revisan la forma; pon el patrón del array vacío antes de [_, *] (uno o más) y termina con else para que nada lance error.",
    "入れ子のハッシュパターンで形を調べる。空配列のパターンを [_, *]（1つ以上）より前に置き、最後に else を置けばどのイベントでも例外にならない。",
  ),
};
