import type { LessonDef, RegionDef } from "../../../lib/content/types.ts";
import { L, say, enemySays } from "../../rust/helpers.ts";

// REGION 2 · ENUMERABLE FOREST  (arrays, hashes, ranges, blocks, procs and lambdas, Enumerable)
// Snippets are whole Ruby 3.4.7 scripts, run as is on Compiler Explorer.

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");
const VALID = L("Is this valid Ruby?", "¿Es Ruby válido?", "正しい Ruby？");
const YES_RUNS = L("Yes, it runs", "Sí, se ejecuta", "はい、動く");
const NO_SYNTAX = L("No: SyntaxError", "No: SyntaxError", "いいえ：SyntaxError");
const crash = (name: string) => L(`${name}: it crashes`, `${name}: se cae`, `${name} で落ちる`);

// ─── 2.1 The adventurer's satchel ──────────────────────────────────────────
const arrays: LessonDef = {
  slug: "arrays",
  title: L("The satchel", "La mochila", "冒険者のかばん"),
  concept: "arrays",
  mode: "lesson",
  xp: 60,
  enemy: "golem",
  enemyName: L("SATCHEL GOLEM", "GÓLEM MOCHILA", "かばんゴーレム"),
  beats: [
    say(L(
      "Welcome to the Enumerable Forest! An ARRAY is a satchel with numbered pockets, starting at 0. a[-1] is the last pocket.",
      "¡Bienvenido al Bosque Enumerable! Un ARRAY es una mochila con bolsillos numerados desde 0. a[-1] es el último bolsillo.",
      "Enumerable の森へようこそ！配列は 0 番から番号がついたポケットのかばん。a[-1] は最後のポケットだよ。",
    )),
    {
      kind: "act",
      prompt: L("Press in order and pack the satchel", "Pulsa en orden y llena la mochila", "順番に押してかばんにつめよう"),
      steps: [
        { label: L("PACK", "EMPACAR", "つめる"), line: 'bag = ["sword", "potion"]', effects: [{ t: "item", kind: "sword", holder: "hero" }, { t: "tag", actor: "hero", text: "bag", value: "2" }] },
        { label: L("ADD key", "AÑADIR key", "key を追加"), line: 'bag << "key"', effects: [{ t: "item", kind: "key", holder: "hero" }, { t: "value", actor: "hero", text: "3" }] },
        { label: L("FIRST", "PRIMERO", "最初"), line: "puts bag[0]", effects: [{ t: "print", text: "sword" }], output: "sword" },
        { label: L("LAST", "ÚLTIMO", "最後"), line: "puts bag[-1]", effects: [{ t: "print", text: "key" }], output: "key" },
        { label: L("POCKET 9", "BOLSILLO 9", "9 番"), line: "p bag[9]", effects: [{ t: "say", actor: "hero", text: L("Empty: nil", "Vacío: nil", "からっぽ：nil") }, { t: "print", text: "nil" }], output: "nil" },
        {
          label: L("FETCH 9", "FETCH 9", "fetch 9"),
          line: "bag.fetch(9)",
          effects: [{ t: "shake" }],
          error: {
            compiler: "main.rb:6:in 'Array#fetch': index 9 outside of array bounds: -3...3 (IndexError)",
            plain: L("[] quietly gives nil for a missing pocket. fetch is strict and raises IndexError.", "[] da nil en silencio si falta el bolsillo. fetch es estricto y lanza IndexError.", "[] はないポケットだと黙って nil。fetch はきびしく IndexError を出すよ。"),
          },
        },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "a = [10, 20, 30]\np [a[0], a[-1], a[5]]",
      options: ["[10, 30, nil]", "[10, 30, 30]", "[20, 10, nil]"],
      answer: 0,
      output: "[10, 30, nil]",
      check: { compiles: true, stdout: "[10, 30, nil]" },
      explain: L("Index 0 is the first item, -1 the last. A pocket past the end gives nil, not an error.", "El índice 0 es el primero, -1 el último. Un bolsillo fuera del final da nil, no un error.", "0 番が最初、-1 が最後。範囲外は nil でエラーにはならないよ。"),
    },
    {
      kind: "predict",
      prompt: L("Slices. What does it print?", "Porciones. ¿Qué imprime?", "切り出し。表示は？"),
      code: "a = [10, 20, 30]\np [a.first, a.last(2), a[1..], a[0, 2]]",
      options: ["[10, [20, 30], [20, 30], [10, 20]]", "[10, 30, [20, 30], [10, 20]]", "[10, [20, 30], [10, 20], [10, 20]]"],
      answer: 0,
      output: "[10, [20, 30], [20, 30], [10, 20]]",
      check: { compiles: true, stdout: "[10, [20, 30], [20, 30], [10, 20]]" },
      explain: L("last(2) takes two items. a[1..] goes from 1 to the end. a[0, 2] means start at 0, take 2.", "last(2) toma dos elementos. a[1..] va del 1 al final. a[0, 2] significa empezar en 0 y tomar 2.", "last(2) は2個。a[1..] は 1 番から最後まで。a[0, 2] は 0 番から2個だよ。"),
    },
    say(L(
      "<< and push add at the end. pop takes from the end, shift takes from the front. Both return what they took.",
      "<< y push añaden al final. pop saca del final y shift saca del principio. Ambos devuelven lo que sacaron.",
      "<< と push は最後に追加。pop は最後から、shift は先頭から取り出し、取った物を返すよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "a = [1, 2]\na << 3\na.push(4)\np [a.pop, a.shift, a]",
      options: ["[4, 1, [2, 3]]", "[1, 4, [2, 3]]", "[4, 1, [1, 2, 3, 4]]"],
      answer: 0,
      output: "[4, 1, [2, 3]]",
      check: { compiles: true, stdout: "[4, 1, [2, 3]]" },
      explain: L("a becomes [1, 2, 3, 4]. pop removes 4, shift removes 1, leaving [2, 3].", "a pasa a [1, 2, 3, 4]. pop quita el 4, shift quita el 1 y queda [2, 3].", "a は [1, 2, 3, 4] に。pop で 4、shift で 1 が抜けて [2, 3] が残るよ。"),
    },
    {
      kind: "type",
      prompt: L("Add 7 at the end", "Añade 7 al final", "最後に 7 を追加"),
      code: "a = [5, 6]\na.___(7)\np a",
      answer: "push",
      check: { compiles: true, stdout: "[5, 6, 7]" },
      explain: L("push adds items at the end (like <<, but it takes several at once).", "push añade elementos al final (como <<, pero acepta varios a la vez).", "push は最後に追加する（<< と同じだけど一度に何個でもOK）。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: "[1, 2, 3].fetch(10)",
      options: [crash("IndexError"), "nil", "3"],
      answer: 0,
      check: { compiles: true, throws: "(IndexError)" },
      explain: L("fetch refuses a missing index: index 10 outside of array bounds. Use it when absence is a bug.", "fetch rechaza un índice que no existe: index 10 outside of array bounds. Úsalo cuando la ausencia es un bug.", "fetch はない番号を拒否する（index 10 outside of array bounds）。ないのがバグな時に使おう。"),
    },
    say(L(
      "b = a puts a second label on the SAME satchel. a.dup makes a new satchel with the same items.",
      "b = a pone una segunda etiqueta en la MISMA mochila. a.dup crea una mochila nueva con los mismos objetos.",
      "b = a は同じかばんに2枚目のラベルを貼るだけ。a.dup は同じ中身の新しいかばんを作るよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "a = [1, 2]\nb = a\nb << 3\nc = a.dup\nc << 4\np [a, c]",
      options: ["[[1, 2, 3], [1, 2, 3, 4]]", "[[1, 2], [1, 2, 4]]", "[[1, 2, 3, 4], [1, 2, 3, 4]]"],
      answer: 0,
      output: "[[1, 2, 3], [1, 2, 3, 4]]",
      check: { compiles: true, stdout: "[[1, 2, 3], [1, 2, 3, 4]]" },
      explain: L("b is a, so b << 3 changes a. c is a copy, so c << 4 only changes c.", "b es a, así que b << 3 cambia a. c es una copia, así que c << 4 solo cambia c.", "b は a そのものなので b << 3 で a が変わる。c はコピーなので c << 4 は c だけ。"),
      setup: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "a, b" }],
      win: [{ t: "clone", to: "ally" }, { t: "tag", actor: "ally", text: "c" }],
    },
    say(L(
      "A classic trap: Array.new(3, []) puts the SAME inner array in all 3 pockets. Array.new(3) { [] } builds a new one each time.",
      "Una trampa clásica: Array.new(3, []) mete el MISMO array interno en los 3 bolsillos. Array.new(3) { [] } crea uno nuevo cada vez.",
      "定番のワナ：Array.new(3, []) は3つのポケットに同じ配列を入れる。Array.new(3) { [] } なら毎回新しく作るよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: 'g = Array.new(3, [])\ng[0] << "x"\np g',
      options: ['[["x"], ["x"], ["x"]]', '[["x"], [], []]', '["x", [], []]'],
      answer: 0,
      output: '[["x"], ["x"], ["x"]]',
      check: { compiles: true, stdout: '[["x"], ["x"], ["x"]]' },
      explain: L("All three pockets hold one shared array, so changing it through g[0] shows up everywhere.", "Los tres bolsillos guardan un único array compartido; cambiarlo con g[0] se ve en todos.", "3つのポケットは1つの配列を共有。g[0] から変えると全部に見えるよ。"),
      setup: [{ t: "item", kind: "scroll", holder: "hero" }],
      win: [{ t: "shake" }],
    },
    {
      kind: "pick",
      prompt: L("Three separate pouches", "Tres bolsas separadas", "別々の袋を3つ"),
      code: 'g = ___\ng[0] << "x"\np g',
      options: ["Array.new(3) { [] }", "Array.new(3, [])", "[[]] * 3"],
      answer: 0,
      check: { compiles: true, stdout: '[["x"], [], []]' },
      explain: L("The block runs once per pocket, building a new []. The other two repeat one shared array.", "El bloque se ejecuta una vez por bolsillo y crea un [] nuevo. Las otras dos repiten un array compartido.", "ブロックはポケットごとに動いて新しい [] を作る。他の2つは同じ配列のくり返しだよ。"),
    },
    {
      kind: "predict",
      prompt: L("Array math. Prints?", "Matemática de arrays. ¿Imprime?", "配列の計算。表示は？"),
      code: "p [[1, 2] + [3], [1, 2, 2, 3] - [2], [1, 2] & [2, 3]]",
      options: ["[[1, 2, 3], [1, 3], [2]]", "[[1, 2, 3], [1, 2, 3], [2]]", "[[4, 2], [1, 3], [1, 2, 3]]"],
      answer: 0,
      output: "[[1, 2, 3], [1, 3], [2]]",
      check: { compiles: true, stdout: "[[1, 2, 3], [1, 3], [2]]" },
      explain: L("+ joins arrays, - removes EVERY matching item, & keeps the items both have.", "+ une arrays, - quita TODOS los elementos iguales y & deja los que ambos tienen.", "+ はつなぐ、- は一致する物を全部消す、& は両方にある物だけ残すよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "p [[1, nil, 2, nil].compact, [1, 1, 2].uniq, [1, [2, [3]]].flatten]",
      options: ["[[1, 2], [1, 2], [1, 2, 3]]", "[[1, nil, 2], [1, 2], [1, 2, [3]]]", "[[1, 2], [1, 1, 2], [1, 2, 3]]"],
      answer: 0,
      output: "[[1, 2], [1, 2], [1, 2, 3]]",
      check: { compiles: true, stdout: "[[1, 2], [1, 2], [1, 2, 3]]" },
      explain: L("compact drops nils, uniq drops duplicates, flatten opens every nested array.", "compact quita los nil, uniq quita repetidos y flatten abre cada array anidado.", "compact は nil を、uniq は重複を消し、flatten は入れ子を全部ひらくよ。"),
    },
    {
      kind: "predict",
      prompt: L("Word list shortcut. Prints?", "Atajo de lista de palabras. ¿Imprime?", "単語リストの近道。表示は？"),
      code: "p %w[sword shield]",
      options: ['["sword", "shield"]', "[sword, shield]", '"sword shield"'],
      answer: 0,
      output: '["sword", "shield"]',
      check: { compiles: true, stdout: '["sword", "shield"]' },
      explain: L("%w[...] builds an array of strings split on spaces, with no quotes or commas to type.", "%w[...] crea un array de strings separados por espacios, sin escribir comillas ni comas.", "%w[...] は空白で区切った文字列の配列。引用符もカンマもいらないよ。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: "a = [1, 2, 3]\na.freeze\na << 4",
      options: [crash("FrozenError"), "[1, 2, 3, 4]", "[1, 2, 3]"],
      answer: 0,
      check: { compiles: true, throws: "(FrozenError)" },
      explain: L("freeze locks the array: can't modify frozen Array. Freeze lists that must never change.", "freeze bloquea el array: can't modify frozen Array. Congela las listas que nunca deben cambiar.", "freeze で配列が固まる（can't modify frozen Array）。変えてはいけないリストは凍らせよう。"),
      setup: [{ t: "item", kind: "scroll", holder: "hero" }],
      win: [{ t: "shake" }],
    },
    {
      kind: "run",
      prompt: L("Fix it: it must print slot 1: []", "Arréglalo: debe imprimir slot 1: []", "直そう：slot 1: [] と表示させて"),
      starter: 'slots = Array.new(3, [])\nslots[0] << "sword"\nputs "slot 1: #{slots[1].inspect}"\n',
      solution: 'slots = Array.new(3) { [] }\nslots[0] << "sword"\nputs "slot 1: #{slots[1].inspect}"\n',
      expect: "slot 1: []",
      fallback: [String.raw`Array\.new\(\s*3\s*\)\s*\{\s*\[\]\s*\}`, String.raw`Array\.new\(\s*3\s*\)\s*do\s*\[\]\s*end`, String.raw`\[\s*\[\]\s*,\s*\[\]\s*,\s*\[\]\s*\]`],
      explain: L("Array.new(3, []) shares one array. Array.new(3) { [] } gives each slot its own.", "Array.new(3, []) comparte un solo array. Array.new(3) { [] } le da a cada espacio el suyo.", "Array.new(3, []) は1つを共有。Array.new(3) { [] } なら各スロットに別々の配列だよ。"),
    },
  ],
};

// ─── 2.2 The mimic chest ───────────────────────────────────────────────────
const hashesAndRanges: LessonDef = {
  slug: "hashes-and-ranges",
  title: L("The mimic chest", "El cofre mímico", "ミミックの宝箱"),
  concept: "hashes",
  mode: "lesson",
  xp: 60,
  enemy: "ruby/hash-mimic",
  enemyName: L("HASH MIMIC", "MÍMICO HASH", "ハッシュミミック"),
  beats: [
    say(L(
      "A HASH is a chest of labeled drawers: each KEY points to a value. {hp: 30} uses the symbol :hp as its key.",
      "Un HASH es un cofre de cajones etiquetados: cada CLAVE apunta a un valor. {hp: 30} usa el símbolo :hp como clave.",
      "ハッシュは名札つき引き出しの宝箱。キーが値を指す。{hp: 30} はシンボル :hp がキーだよ。",
    )),
    {
      kind: "act",
      prompt: L("Press in order and open the drawers", "Pulsa en orden y abre los cajones", "順番に押して引き出しを開けよう"),
      steps: [
        { label: L("CHEST", "COFRE", "宝箱"), line: "chest = {hp: 30}", effects: [{ t: "enter", actor: "enemy" }, { t: "tag", actor: "enemy", text: "chest" }] },
        { label: L("ADD :mp", "AÑADIR :mp", ":mp を追加"), line: "chest[:mp] = 5", effects: [{ t: "item", kind: "potion", holder: "enemy" }] },
        { label: L("SHOW", "MOSTRAR", "見せる"), line: "p chest", effects: [{ t: "print", text: "{hp: 30, mp: 5}" }], output: "{hp: 30, mp: 5}" },
        { label: L("ASK :gold", "PEDIR :gold", ":gold を聞く"), line: "p chest[:gold]", effects: [{ t: "say", actor: "enemy", text: L("Nothing! nil", "¡Nada! nil", "ないよ！nil") }, { t: "print", text: "nil" }], output: "nil" },
        {
          label: L("FETCH :gold", "FETCH :gold", "fetch"),
          line: "chest.fetch(:gold)",
          effects: [{ t: "attack", from: "enemy", to: "hero" }, { t: "shake" }],
          error: {
            compiler: "main.rb:5:in 'Hash#fetch': key not found: :gold (KeyError)",
            plain: L("[] gives nil for a missing key. fetch bites: it raises KeyError.", "[] da nil si falta la clave. fetch muerde: lanza KeyError.", "[] はないキーで nil。fetch はかみつく：KeyError を出すよ。"),
          },
        },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'h = {name: "Rubi", hp: 30}\np [h[:name], h[:mp], h.fetch(:hp), h.fetch(:mp, 0)]',
      options: ['["Rubi", nil, 30, 0]', '["Rubi", 0, 30, 0]', '["Rubi", nil, 30, nil]'],
      answer: 0,
      output: '["Rubi", nil, 30, 0]',
      check: { compiles: true, stdout: '["Rubi", nil, 30, 0]' },
      explain: L("h[:mp] is nil because :mp is missing. fetch(:mp, 0) returns the fallback 0 instead of raising.", "h[:mp] es nil porque falta :mp. fetch(:mp, 0) devuelve el respaldo 0 en vez de fallar.", ":mp がないので h[:mp] は nil。fetch(:mp, 0) はエラーの代わりに 0 を返すよ。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: 'h = {name: "Rubi"}\nh.fetch(:mp)',
      options: [crash("KeyError"), "nil", "0"],
      answer: 0,
      check: { compiles: true, throws: "(KeyError)" },
      explain: L("fetch with no fallback raises key not found: :mp. Great for keys that MUST exist.", "fetch sin respaldo lanza key not found: :mp. Ideal para claves que DEBEN existir.", "代わりなしの fetch は key not found: :mp。必ずあるべきキーに使おう。"),
      setup: [{ t: "enter", actor: "enemy" }],
      win: [{ t: "attack", from: "enemy", to: "hero" }, { t: "shake" }],
    },
    say(L(
      "Symbol keys and string keys are DIFFERENT drawers: :name is not \"name\". Ruby 3.4 shows them as {a: 1} and {\"a\" => 1}.",
      "Las claves símbolo y las claves string son cajones DISTINTOS: :name no es \"name\". Ruby 3.4 las muestra como {a: 1} y {\"a\" => 1}.",
      "シンボルキーと文字列キーは別の引き出し。:name と \"name\" はちがう。Ruby 3.4 では {a: 1} と {\"a\" => 1} と表示。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: 'h = {"name" => "Rubi"}\np [h[:name], h["name"]]',
      options: ['[nil, "Rubi"]', '["Rubi", "Rubi"]', '["Rubi", nil]'],
      answer: 0,
      output: '[nil, "Rubi"]',
      check: { compiles: true, stdout: '[nil, "Rubi"]' },
      explain: L("The key is the string \"name\". Asking for the symbol :name opens a different, empty drawer.", "La clave es el string \"name\". Pedir el símbolo :name abre otro cajón, vacío.", "キーは文字列 \"name\"。シンボル :name で聞くと別の空の引き出しになるよ。"),
    },
    {
      kind: "predict",
      prompt: L("A quoted key with a colon. Prints?", "Clave entre comillas con dos puntos. ¿Imprime?", "引用符つきキーにコロン。表示は？"),
      code: 'h = {a: 1, "b": 2}\np h',
      options: ["{a: 1, b: 2}", '{a: 1, "b" => 2}', '{"a" => 1, "b" => 2}'],
      answer: 0,
      output: "{a: 1, b: 2}",
      check: { compiles: true, stdout: "{a: 1, b: 2}" },
      explain: L("\"b\": 2 still makes a SYMBOL key :b. Only \"b\" => 2 makes a string key.", "\"b\": 2 igual crea una clave SÍMBOLO :b. Solo \"b\" => 2 crea una clave string.", "\"b\": 2 でもシンボルキー :b になる。文字列キーは \"b\" => 2 だけだよ。"),
    },
    say(L(
      "Hash.new(0) gives 0 for missing keys: perfect for counting. Each pair is visited in insertion order.",
      "Hash.new(0) da 0 para claves que faltan: perfecto para contar. Los pares se recorren en orden de inserción.",
      "Hash.new(0) はないキーに 0 を返すので数えるのにぴったり。順番は入れた順だよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: 'h = Hash.new(0)\n"banana".each_char { |c| h[c] += 1 }\np h',
      options: ['{"b" => 1, "a" => 3, "n" => 2}', '{"a" => 3, "b" => 1, "n" => 2}', '{b: 1, a: 3, n: 2}'],
      answer: 0,
      output: '{"b" => 1, "a" => 3, "n" => 2}',
      check: { compiles: true, stdout: '{"b" => 1, "a" => 3, "n" => 2}' },
      explain: L("Each missing letter starts at 0, then += 1. Keys stay in the order they first appeared: b, a, n.", "Cada letra nueva empieza en 0 y luego += 1. Las claves quedan en el orden en que aparecieron: b, a, n.", "ない文字は 0 から += 1。キーは最初に出た順（b, a, n）のままだよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "h = {b: 2, a: 1}\nh[:c] = 3\nh.each { |k, v| print k, \"=\", v, \" \" }\nputs",
      options: ["b=2 a=1 c=3", "a=1 b=2 c=3", "c=3 b=2 a=1"],
      answer: 0,
      output: "b=2 a=1 c=3",
      check: { compiles: true, stdout: "b=2 a=1 c=3" },
      explain: L("Hashes remember insertion order. They are never sorted for you.", "Los hashes recuerdan el orden de inserción. Nunca se ordenan solos.", "ハッシュは入れた順を覚えている。勝手に並べかえないよ。"),
    },
    say(L(
      "The mimic's trick: Hash.new([]) shares ONE hidden array for every missing key and never stores the key.",
      "El truco del mímico: Hash.new([]) comparte UN array oculto para cada clave que falta y nunca guarda la clave.",
      "ミミックのワナ：Hash.new([]) はないキー全部で1つの隠し配列を共有し、キーを保存しないよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "h = Hash.new([])\nh[:a] << 1\nh[:b] << 2\np [h, h.size, h[:zzz]]",
      options: ["[{}, 0, [1, 2]]", "[{a: [1], b: [2]}, 2, []]", "[{a: [1, 2], b: [1, 2]}, 2, [1, 2]]"],
      answer: 0,
      output: "[{}, 0, [1, 2]]",
      check: { compiles: true, stdout: "[{}, 0, [1, 2]]" },
      explain: L("<< changes the shared default array but never assigns h[:a]. The hash stays empty.", "<< cambia el array compartido por defecto pero nunca asigna h[:a]. El hash queda vacío.", "<< は共有のデフォルト配列を変えるだけで h[:a] に代入しない。ハッシュは空のまま。"),
      setup: [{ t: "enter", actor: "enemy" }],
      win: [{ t: "say", actor: "enemy", text: L("Hee hee, empty!", "¡Je je, vacío!", "ひひっ、空っぽ！") }],
    },
    {
      kind: "type",
      prompt: L("Give each key its own array", "Dale a cada clave su propio array", "キーごとに別の配列を"),
      code: "h = Hash.new { |hash, k| hash[k] = ___ }\nh[:a] << 1\nh[:b] << 2\np h",
      answer: "[]",
      check: { compiles: true, stdout: "{a: [1], b: [2]}" },
      explain: L("The block runs for each missing key, builds a NEW array and stores it in the hash.", "El bloque se ejecuta por cada clave que falta, crea un array NUEVO y lo guarda en el hash.", "ブロックはないキーごとに動き、新しい配列を作ってハッシュに保存するよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "h = {a: 1, b: 2}\np [h.transform_values { |v| v * 2 }, h.select { |k, v| v > 1 }]",
      options: ["[{a: 2, b: 4}, {b: 2}]", "[[2, 4], [[:b, 2]]]", "[{a: 2, b: 4}, [2]]"],
      answer: 0,
      output: "[{a: 2, b: 4}, {b: 2}]",
      check: { compiles: true, stdout: "[{a: 2, b: 4}, {b: 2}]" },
      explain: L("transform_values keeps the keys and changes each value. select on a hash returns a hash.", "transform_values conserva las claves y cambia cada valor. select sobre un hash devuelve un hash.", "transform_values はキーはそのまま値を変える。ハッシュの select はハッシュを返すよ。"),
    },
    {
      kind: "predict",
      prompt: L("Dig into nested chests. Prints?", "Excava en cofres anidados. ¿Imprime?", "入れ子の宝箱をほる。表示は？"),
      code: "h = {a: {b: {c: 42}}}\np [h.dig(:a, :b, :c), h.dig(:x, :b)]",
      options: ["[42, nil]", "[42, NoMethodError]", "[{c: 42}, nil]"],
      answer: 0,
      output: "[42, nil]",
      check: { compiles: true, stdout: "[42, nil]" },
      explain: L("dig follows the keys one by one and stops with nil at the first missing drawer.", "dig sigue las claves una por una y se detiene con nil en el primer cajón que falta.", "dig はキーを順にたどり、最初にない所で nil を返して止まるよ。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: "h = {a: 1}\nh.each { |k, v| h[:b] = 2 }",
      options: [crash("RuntimeError"), "{a: 1, b: 2}", L("It loops forever", "Se repite para siempre", "永遠にループ")],
      answer: 0,
      check: { compiles: true, throws: "(RuntimeError)" },
      explain: L("can't add a new key into hash during iteration. Collect changes first, then apply them.", "can't add a new key into hash during iteration. Junta los cambios primero y aplícalos después.", "can't add a new key into hash during iteration。変更は集めてから後で反映しよう。"),
    },
    say(L(
      "A RANGE is a row of values: 1..5 includes 5, 1...5 stops before it. (1..) never ends.",
      "Un RANGO es una fila de valores: 1..5 incluye el 5, 1...5 se detiene antes. (1..) nunca termina.",
      "範囲は値の並び。1..5 は 5 をふくみ、1...5 は 5 の手前まで。(1..) は終わりなし。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "p [(1..5).to_a, (1...5).to_a]",
      options: ["[[1, 2, 3, 4, 5], [1, 2, 3, 4]]", "[[1, 2, 3, 4, 5], [1, 2, 3, 4, 5]]", "[[1, 2, 3, 4], [1, 2, 3, 4, 5]]"],
      answer: 0,
      output: "[[1, 2, 3, 4, 5], [1, 2, 3, 4]]",
      check: { compiles: true, stdout: "[[1, 2, 3, 4, 5], [1, 2, 3, 4]]" },
      explain: L("Two dots include the end, three dots exclude it. to_a lists every value.", "Dos puntos incluyen el final, tres lo excluyen. to_a lista cada valor.", "点2つは終わりをふくみ、3つはふくまない。to_a で全部ならべるよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "p [(1..).first(3), (1..10).step(3).to_a]",
      options: ["[[1, 2, 3], [1, 4, 7, 10]]", "[[1, 2, 3], [3, 6, 9]]", "[[0, 1, 2], [1, 4, 7]]"],
      answer: 0,
      output: "[[1, 2, 3], [1, 4, 7, 10]]",
      check: { compiles: true, stdout: "[[1, 2, 3], [1, 4, 7, 10]]" },
      explain: L("An endless range is fine if you only take a few. step(3) jumps by 3 and 10 is included.", "Un rango sin fin funciona si solo tomas algunos. step(3) salta de 3 en 3 y el 10 se incluye.", "終わりなしの範囲も少し取るだけなら OK。step(3) は3つ飛ばしで 10 もふくむよ。"),
    },
    {
      kind: "run",
      prompt: L("Beat the mimic: print bags: {rubi: [\"gem\"]}", "Vence al mímico: imprime bags: {rubi: [\"gem\"]}", "ミミック退治：bags: {rubi: [\"gem\"]}"),
      starter: 'bags = Hash.new([])\nbags[:rubi] << "gem"\nputs "bags: #{bags}"\n',
      solution: 'bags = Hash.new { |hash, key| hash[key] = [] }\nbags[:rubi] << "gem"\nputs "bags: #{bags}"\n',
      expect: 'bags: {rubi: ["gem"]}',
      fallback: [String.raw`Hash\.new\s*\{\s*\|\s*\w+\s*,\s*\w+\s*\|\s*\w+\[\s*\w+\s*\]\s*=\s*\[\]\s*\}`, String.raw`\(\s*bags\[:rubi\]\s*\|\|=\s*\[\]\s*\)\s*<<`, String.raw`bags\[:rubi\]\s*=\s*\[\s*"gem"\s*\]`],
      explain: L("Hash.new([]) never stores the key. A block default, hash[key] = [], stores a fresh array.", "Hash.new([]) nunca guarda la clave. Un bloque por defecto, hash[key] = [], guarda un array nuevo.", "Hash.new([]) はキーを保存しない。ブロックで hash[key] = [] とすれば新しい配列が入るよ。"),
    },
  ],
};

// ─── 2.3 Scrolls, backpacks and strict spells ──────────────────────────────
const WITH_HP_CODE = `def with_hp
  yield 10, 20
end
with_hp { |a, b| puts a + b }`;

const MAYBE_CODE = `def maybe
  block_given? ? yield : "no block"
end
p [maybe, maybe { "got it" }]`;

const RETURN_CODE = `def run_proc
  pr = Proc.new { return 10 }
  pr.call
  20
end
def run_lambda
  l = -> { return 10 }
  l.call
  20
end
p [run_proc, run_lambda]`;

const COUNTER_CODE = `def counter
  c = 0
  -> { c += 1 }
end
c = counter
c.call
c.call
d = counter
p [c.call, d.call]`;

const blocksProcsLambdas: LessonDef = {
  slug: "blocks-procs-lambdas",
  title: L("Scrolls and spells", "Pergaminos y hechizos", "巻物と呪文"),
  concept: "blocks",
  mode: "lesson",
  xp: 70,
  enemy: "ruby/monkey-imp",
  enemyName: L("SCROLL IMP", "DIABLILLO", "まきもの小鬼"),
  beats: [
    say(L(
      "A BLOCK is code handed to a method call, in { } or do ... end. Inside the method, yield runs that block.",
      "Un BLOQUE es código que entregas en una llamada, entre { } o do ... end. Dentro del método, yield ejecuta ese bloque.",
      "ブロックはメソッド呼び出しにわたすコード（{ } か do ... end）。メソッドの中で yield が実行するよ。",
    )),
    {
      kind: "act",
      prompt: L("Press in order and hand over the scroll", "Pulsa en orden y entrega el pergamino", "順番に押して巻物をわたそう"),
      steps: [
        { label: L("DEFINE", "DEFINIR", "定義する"), line: "def twice", effects: [{ t: "enter", actor: "ally" }] },
        { label: L("YIELD", "YIELD", "yield"), line: "  yield" },
        { label: L("YIELD", "YIELD", "yield"), line: "  yield" },
        { label: L("END", "END", "end"), line: "end" },
        {
          label: L("GIVE BLOCK", "DAR BLOQUE", "ブロックを渡す"),
          line: 'twice { print "hi " }',
          effects: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "give", to: "ally" }, { t: "say", actor: "ally", text: L("hi hi", "hi hi", "hi hi") }, { t: "print", text: "hi hi " }],
          output: "hi hi ",
        },
        {
          label: L("NO BLOCK", "SIN BLOQUE", "ブロックなし"),
          line: "twice",
          effects: [{ t: "shake" }, { t: "say", actor: "ally", text: L("No scroll!", "¡Sin pergamino!", "巻物がない！") }],
          error: {
            compiler: "main.rb:2:in 'Object#twice': no block given (yield) (LocalJumpError)",
            plain: L("yield needs a block to run. Calling twice without one raises LocalJumpError.", "yield necesita un bloque. Llamar a twice sin uno lanza LocalJumpError.", "yield には実行するブロックが必要。なしで呼ぶと LocalJumpError だよ。"),
          },
        },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: WITH_HP_CODE,
      options: ["30", "1020", "10"],
      answer: 0,
      output: "30",
      check: { compiles: true, stdout: "30" },
      explain: L("yield 10, 20 passes two values to the block. They land in |a, b|, so it prints 30.", "yield 10, 20 pasa dos valores al bloque. Llegan a |a, b|, así que imprime 30.", "yield 10, 20 はブロックに2つの値をわたす。|a, b| に入るので 30 だよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: MAYBE_CODE,
      options: ['["no block", "got it"]', '["got it", "got it"]', "LocalJumpError"],
      answer: 0,
      output: '["no block", "got it"]',
      check: { compiles: true, stdout: '["no block", "got it"]' },
      explain: L("block_given? checks for a block before yielding, so calling without one is safe.", "block_given? revisa si hay bloque antes del yield, así que llamar sin uno es seguro.", "block_given? で yield の前にブロックの有無を確かめるので、なしでも安全だよ。"),
    },
    {
      kind: "type",
      prompt: L("Run the block", "Ejecuta el bloque", "ブロックを実行しよう"),
      code: 'def run_it\n  ___\nend\nrun_it { puts "go" }',
      answer: "yield",
      check: { compiles: true, stdout: "go" },
      explain: L("yield runs the block given to the method.", "yield ejecuta el bloque que recibió el método.", "yield はメソッドにわたされたブロックを実行するよ。"),
    },
    say(L(
      "Keep code in a backpack: a LAMBDA, ->(x) { x * x }, is an object you can store and call later with .call, .() or [].",
      "Guarda código en la mochila: una LAMBDA, ->(x) { x * x }, es un objeto que guardas y llamas luego con .call, .() o [].",
      "コードをしまっておこう：ラムダ ->(x) { x * x } は保存して後で .call、.()、[] で呼べるオブジェクトだよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "sq = ->(x) { x * x }\np [sq.call(4), sq.(5), sq[6]]",
      options: ["[16, 25, 36]", "[4, 5, 6]", "[8, 10, 12]"],
      answer: 0,
      output: "[16, 25, 36]",
      check: { compiles: true, stdout: "[16, 25, 36]" },
      explain: L("The three forms all call the lambda: 4*4, 5*5, 6*6.", "Las tres formas llaman a la lambda: 4*4, 5*5, 6*6.", "3つの書き方はどれもラムダの呼び出し：4*4、5*5、6*6。"),
    },
    say(L(
      "A PROC (proc { }) is a relaxed scroll. A LAMBDA is strict: it checks how many arguments it gets. A proc fills gaps with nil.",
      "Un PROC (proc { }) es un pergamino relajado. Una LAMBDA es estricta: revisa cuántos argumentos recibe. Un proc rellena con nil.",
      "proc { } はゆるい巻物。ラムダはきびしく引数の数を調べる。proc は足りない分を nil でうめるよ。",
    )),
    {
      kind: "predict",
      prompt: HAPPENS,
      code: "l = ->(a, b) { a + b }\nl.call(1)",
      options: [crash("ArgumentError"), "1", "nil"],
      answer: 0,
      check: { compiles: true, throws: "(ArgumentError)" },
      explain: L("Lambdas check arity like methods: wrong number of arguments (given 1, expected 2).", "Las lambdas revisan la aridad como los métodos: wrong number of arguments (given 1, expected 2).", "ラムダはメソッドと同じく数を調べる（given 1, expected 2）。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "predict",
      prompt: L("The relaxed proc. Prints?", "El proc relajado. ¿Imprime?", "ゆるい proc。表示は？"),
      code: "pr = proc { |a, b| [a, b] }\np [pr.call(1), pr.call(1, 2, 3)]",
      options: ["[[1, nil], [1, 2]]", "ArgumentError", "[[1], [1, 2, 3]]"],
      answer: 0,
      output: "[[1, nil], [1, 2]]",
      check: { compiles: true, stdout: "[[1, nil], [1, 2]]" },
      explain: L("A proc never complains: a missing b becomes nil and the extra 3 is dropped.", "Un proc nunca se queja: la b que falta pasa a nil y el 3 extra se descarta.", "proc は文句を言わない。足りない b は nil、余った 3 は捨てられるよ。"),
    },
    say(L(
      "Another difference: return inside a proc leaves the whole METHOD around it. In a lambda it only leaves the lambda.",
      "Otra diferencia: return dentro de un proc sale de todo el MÉTODO que lo rodea. En una lambda solo sale de la lambda.",
      "もう1つのちがい：proc の中の return は外側のメソッドごと抜ける。ラムダならラムダだけ抜けるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: RETURN_CODE,
      options: ["[10, 20]", "[20, 20]", "[10, 10]"],
      answer: 0,
      output: "[10, 20]",
      check: { compiles: true, stdout: "[10, 20]" },
      explain: L("The proc's return ends run_proc with 10. The lambda's return ends only the lambda, so 20 follows.", "El return del proc termina run_proc con 10. El de la lambda solo termina la lambda, y luego viene 20.", "proc の return で run_proc が 10 で終わる。ラムダの return はラムダだけなので 20 になるよ。"),
    },
    say(L(
      "Blocks and lambdas are CLOSURES: they remember the variables around them, not just their values at the time.",
      "Los bloques y las lambdas son CLOSURES: recuerdan las variables que los rodean, no solo sus valores en ese momento.",
      "ブロックやラムダはクロージャ。まわりの変数そのものを覚えていて、その時の値だけじゃないよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: COUNTER_CODE,
      options: ["[3, 1]", "[1, 1]", "[3, 4]"],
      answer: 0,
      output: "[3, 1]",
      check: { compiles: true, stdout: "[3, 1]" },
      explain: L("Each counter call makes a new c. The lambda keeps its own c alive and adds 1 each call.", "Cada llamada a counter crea un c nuevo. La lambda mantiene vivo su propio c y suma 1 en cada llamada.", "counter を呼ぶたびに新しい c ができる。ラムダは自分の c を持ち続けて毎回 +1 するよ。"),
    },
    {
      kind: "predict",
      prompt: L("Value or variable? Prints?", "¿Valor o variable? ¿Imprime?", "値？変数？表示は？"),
      code: "x = 1\nadd_x = ->(n) { n + x }\nx = 100\np add_x.(1)",
      options: ["101", "2", "NameError"],
      answer: 0,
      output: "101",
      check: { compiles: true, stdout: "101" },
      explain: L("The lambda captured the variable x, not the value 1. When called, x is already 100.", "La lambda capturó la variable x, no el valor 1. Cuando se llama, x ya vale 100.", "ラムダがつかんだのは値 1 ではなく変数 x。呼んだ時 x はもう 100 だよ。"),
    },
    say(L(
      "map builds a new array from each block answer. Shortcuts: map(&:to_s) calls to_s on each item; it names the item.",
      "map crea un array nuevo con la respuesta del bloque para cada elemento. Atajos: map(&:to_s) llama a to_s en cada uno; it nombra al elemento.",
      "map は各ブロックの答えで新しい配列を作る。近道：map(&:to_s) は各要素に to_s、it は要素そのものだよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "p [[1, 2, 3].map(&:to_s), [1, 2, 3].map { it * 2 }]",
      options: ['[["1", "2", "3"], [2, 4, 6]]', "[[1, 2, 3], [2, 4, 6]]", '[["1", "2", "3"], [1, 2, 3]]'],
      answer: 0,
      output: '[["1", "2", "3"], [2, 4, 6]]',
      check: { compiles: true, stdout: '[["1", "2", "3"], [2, 4, 6]]' },
      explain: L("&:to_s turns the symbol into a block that calls to_s. it (Ruby 3.4) is the block's single item.", "&:to_s convierte el símbolo en un bloque que llama a to_s. it (Ruby 3.4) es el único elemento del bloque.", "&:to_s はシンボルを to_s を呼ぶブロックに変える。it（Ruby 3.4）はブロックの要素だよ。"),
    },
    {
      kind: "predict",
      prompt: VALID,
      code: "p [1, 2].map { |x| it }",
      options: [YES_RUNS, NO_SYNTAX],
      answer: 1,
      check: { compiles: false },
      explain: L("'it' is not allowed when an ordinary parameter is defined. Use x, or drop |x| and use it.", "'it' is not allowed when an ordinary parameter is defined. Usa x, o quita |x| y usa it.", "普通の引数があると it は使えない。x を使うか、|x| を消して it を使おう。"),
    },
    {
      kind: "run",
      prompt: L("Pass a block: it must print out: [1, 1, 2, 2]", "Pasa un bloque: debe imprimir out: [1, 1, 2, 2]", "ブロックを渡して out: [1, 1, 2, 2]"),
      starter: 'def each_twice(items)\n  items.each { |i| yield i; yield i }\nend\nout = []\neach_twice([1, 2])\nputs "out: #{out}"\n',
      solution: 'def each_twice(items)\n  items.each { |i| yield i; yield i }\nend\nout = []\neach_twice([1, 2]) { |i| out << i }\nputs "out: #{out}"\n',
      expect: "out: [1, 1, 2, 2]",
      fallback: [String.raw`each_twice\(\s*\[1,\s*2\]\s*\)\s*\{\s*\|\s*\w+\s*\|\s*out\s*<<\s*\w+\s*\}`, String.raw`each_twice\(\s*\[1,\s*2\]\s*\)\s*do\s*\|\s*\w+\s*\|\s*out\s*<<\s*\w+\s*end`, String.raw`each_twice\(\s*\[1,\s*2\]\s*\)\s*\{\s*out\s*<<\s*(it|_1)\s*\}`],
      explain: L("each_twice yields, so it needs a block: each_twice([1, 2]) { |i| out << i }.", "each_twice hace yield, así que necesita un bloque: each_twice([1, 2]) { |i| out << i }.", "each_twice は yield するのでブロックが必要：each_twice([1, 2]) { |i| out << i }。"),
    },
  ],
};

// ─── 2.4 The forest's spell circle ─────────────────────────────────────────
const LAZY_CODE = `r = [1, 2, 3].lazy.map do |n|
  puts "map #{n}"
  n * 2
end
p r.first(1)`;

const enumerableMagic: LessonDef = {
  slug: "enumerable-magic",
  title: L("The spell circle", "El círculo mágico", "魔法の輪"),
  concept: "enumerable",
  mode: "lesson",
  xp: 70,
  enemy: "ghost",
  enemyName: L("CHAIN WRAITH", "ESPECTRO CADENA", "くさりの亡霊"),
  beats: [
    say(L(
      "Enumerable is a spellbook every collection shares. each only VISITS and returns the original; map returns a NEW array.",
      "Enumerable es un libro de hechizos de todas las colecciones. each solo VISITA y devuelve el original; map devuelve un array NUEVO.",
      "Enumerable は全コレクション共通の呪文書。each は見てまわって元の物を返し、map は新しい配列を返すよ。",
    )),
    {
      kind: "act",
      prompt: L("Press in order and cast on the circle", "Pulsa en orden y hechiza el círculo", "順番に押して輪に呪文をかけよう"),
      steps: [
        { label: L("CIRCLE", "CÍRCULO", "輪"), line: "nums = [1, 2, 3]", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "hero", text: "nums", value: "[1, 2, 3]" }] },
        { label: L("MAP x10", "MAP x10", "map ×10"), line: "p nums.map { |n| n * 10 }", effects: [{ t: "clone", to: "ally" }, { t: "print", text: "[10, 20, 30]" }], output: "[10, 20, 30]" },
        { label: L("SELECT odd", "SELECT impar", "奇数を選ぶ"), line: "p nums.select(&:odd?)", effects: [{ t: "print", text: "[1, 3]" }], output: "[1, 3]" },
        { label: L("REDUCE +", "REDUCE +", "reduce +"), line: "p nums.reduce(:+)", effects: [{ t: "value", actor: "hero", text: "6" }, { t: "print", text: "6" }], output: "6" },
        {
          label: L("EACH x10", "EACH x10", "each ×10"),
          line: "p nums.each { |n| n * 10 }",
          effects: [{ t: "say", actor: "hero", text: L("Same old array!", "¡El mismo array!", "元の配列のまま！") }, { t: "print", text: "[1, 2, 3]" }],
          output: "[1, 2, 3]",
        },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "a = [1, 2, 3, 4]\np [a.select(&:even?), a.reject(&:even?), a.reduce(:+)]",
      options: ["[[2, 4], [1, 3], 10]", "[[1, 3], [2, 4], 10]", "[[2, 4], [1, 3], 24]"],
      answer: 0,
      output: "[[2, 4], [1, 3], 10]",
      check: { compiles: true, stdout: "[[2, 4], [1, 3], 10]" },
      explain: L("select keeps items where the block is true, reject drops them, reduce(:+) adds everything up.", "select deja los elementos donde el bloque es verdadero, reject los quita y reduce(:+) suma todo.", "select は真の物を残し、reject は捨て、reduce(:+) は全部足すよ。"),
    },
    {
      kind: "predict",
      prompt: L("Roll a snowball. Prints?", "Haz rodar una bola de nieve. ¿Imprime?", "雪玉を転がそう。表示は？"),
      code: "p [[1, 2, 3].reduce(10) { |acc, x| acc + x }, [1, 2, 3].reduce { |a, b| a * b }]",
      options: ["[16, 6]", "[6, 6]", "[16, 0]"],
      answer: 0,
      output: "[16, 6]",
      check: { compiles: true, stdout: "[16, 6]" },
      explain: L("reduce(10) starts the snowball at 10: 10+1+2+3. Without a start, the first item is the start: 1*2*3.", "reduce(10) empieza la bola en 10: 10+1+2+3. Sin inicio, el primer elemento es el inicio: 1*2*3.", "reduce(10) は 10 からスタート：10+1+2+3。初期値なしなら最初の要素から：1*2*3。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: "p [1, 2, 3].reduce(0) { |s, x| s + x if x > 1 }",
      options: [crash("NoMethodError"), "5", "6"],
      answer: 0,
      check: { compiles: true, throws: "(NoMethodError)" },
      explain: L("For x = 1 the if gives nil, and nil becomes the next acc: nil + 2 has no + method.", "Con x = 1 el if da nil, y nil pasa a ser el siguiente acc: nil + 2 no tiene método +.", "x = 1 で if が nil を返し、次の acc が nil に。nil + 2 は + がなくて落ちるよ。"),
      setup: [{ t: "enter", actor: "enemy" }],
      win: [{ t: "shake" }],
    },
    say(L(
      "Counting and grouping spells: tally counts equal items, group_by sorts items into bins by the block's answer.",
      "Hechizos para contar y agrupar: tally cuenta elementos iguales y group_by los reparte en grupos según la respuesta del bloque.",
      "数えてまとめる呪文：tally は同じ物を数え、group_by はブロックの答えごとに分けるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "p %w[a b a c a].tally",
      options: ['{"a" => 3, "b" => 1, "c" => 1}', '{a: 3, b: 1, c: 1}', '["a", "b", "c"]'],
      answer: 0,
      output: '{"a" => 3, "b" => 1, "c" => 1}',
      check: { compiles: true, stdout: '{"a" => 3, "b" => 1, "c" => 1}' },
      explain: L("tally returns a hash from each item to how many times it appears. The keys are strings here.", "tally devuelve un hash de cada elemento a cuántas veces aparece. Aquí las claves son strings.", "tally は「要素 → 出た回数」のハッシュを返す。ここではキーは文字列だよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "arr = %w[apple banana cherry]\np arr.group_by(&:size)",
      options: ['{5 => ["apple"], 6 => ["banana", "cherry"]}', '{"apple" => 5, "banana" => 6, "cherry" => 6}', "[[5], [6, 6]]"],
      answer: 0,
      output: '{5 => ["apple"], 6 => ["banana", "cherry"]}',
      check: { compiles: true, stdout: '{5 => ["apple"], 6 => ["banana", "cherry"]}' },
      explain: L("group_by uses the block's answer (the size) as the key and collects the matching items.", "group_by usa la respuesta del bloque (el tamaño) como clave y junta los elementos que coinciden.", "group_by はブロックの答え（長さ）をキーにして、同じ物を集めるよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "r = %w[ant bee ant].each_with_object(Hash.new(0)) { |w, h| h[w] += 1 }\np r",
      options: ['{"ant" => 2, "bee" => 1}', "{}", '["ant", "bee", "ant"]'],
      answer: 0,
      output: '{"ant" => 2, "bee" => 1}',
      check: { compiles: true, stdout: '{"ant" => 2, "bee" => 1}' },
      explain: L("each_with_object passes the same object (the counting hash) to every step and returns it at the end.", "each_with_object pasa el mismo objeto (el hash contador) a cada paso y lo devuelve al final.", "each_with_object は同じ物（数えるハッシュ）を毎回わたし、最後にそれを返すよ。"),
    },
    {
      kind: "type",
      prompt: L("How many are even?", "¿Cuántos son pares?", "偶数はいくつ？"),
      code: "p [1, 2, 3, 4].___(&:even?)",
      answer: "count",
      check: { compiles: true, stdout: "2" },
      explain: L("count with a block counts the items where the block is true: 2 and 4.", "count con un bloque cuenta los elementos donde el bloque es verdadero: 2 y 4.", "ブロックつきの count は真になる物を数える：2 と 4 だよ。"),
    },
    say(L(
      "Shape spells: each_slice(2) cuts into groups, each_cons(2) slides a window, zip pairs two arrays up.",
      "Hechizos de forma: each_slice(2) corta en grupos, each_cons(2) desliza una ventana y zip empareja dos arrays.",
      "形の呪文：each_slice(2) はグループに切り、each_cons(2) は窓をずらし、zip は2つの配列をペアにするよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "p [1, 2, 3, 4, 5].each_slice(2).to_a",
      options: ["[[1, 2], [3, 4], [5]]", "[[1, 2], [2, 3], [3, 4], [4, 5]]", "[[1, 2], [3, 4]]"],
      answer: 0,
      output: "[[1, 2], [3, 4], [5]]",
      check: { compiles: true, stdout: "[[1, 2], [3, 4], [5]]" },
      explain: L("each_slice cuts into chunks of 2; the last chunk keeps whatever is left.", "each_slice corta en trozos de 2; el último trozo se queda con lo que sobra.", "each_slice は2個ずつに切り、最後は残りだけになるよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "p [1, 2, 3].zip([4, 5, 6])",
      options: ["[[1, 4], [2, 5], [3, 6]]", "[1, 2, 3, 4, 5, 6]", "[[1, 2, 3], [4, 5, 6]]"],
      answer: 0,
      output: "[[1, 4], [2, 5], [3, 6]]",
      check: { compiles: true, stdout: "[[1, 4], [2, 5], [3, 6]]" },
      explain: L("zip walks both arrays together and pairs the items at the same position.", "zip recorre ambos arrays juntos y empareja los elementos de la misma posición.", "zip は2つの配列を同時に進め、同じ位置の物をペアにするよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'p [1, 2, 3].map.with_index(1) { |x, i| "#{i}.#{x * 10}" }',
      options: ['["1.10", "2.20", "3.30"]', '["0.10", "1.20", "2.30"]', '["1.1", "2.2", "3.3"]'],
      answer: 0,
      output: '["1.10", "2.20", "3.30"]',
      check: { compiles: true, stdout: '["1.10", "2.20", "3.30"]' },
      explain: L("map without a block returns an Enumerator; with_index(1) adds a counter that starts at 1.", "map sin bloque devuelve un Enumerator; with_index(1) agrega un contador que empieza en 1.", "ブロックなしの map は Enumerator。with_index(1) で 1 から数えるカウンタがつくよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "p (1..6).partition(&:even?)",
      options: ["[[2, 4, 6], [1, 3, 5]]", "[2, 4, 6]", "[[1, 3, 5], [2, 4, 6]]"],
      answer: 0,
      output: "[[2, 4, 6], [1, 3, 5]]",
      check: { compiles: true, stdout: "[[2, 4, 6], [1, 3, 5]]" },
      explain: L("partition splits into two arrays: first the items where the block is true, then the rest.", "partition divide en dos arrays: primero los elementos donde el bloque es verdadero y luego el resto.", "partition は2つに分ける。先に真の物、次に残りだよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "p [1, 2, 3, 4].filter_map { |n| n * 2 if n.odd? }",
      options: ["[2, 6]", "[2, nil, 6, nil]", "[1, 3]"],
      answer: 0,
      output: "[2, 6]",
      check: { compiles: true, stdout: "[2, 6]" },
      explain: L("filter_map maps and drops nil (and false) answers in one pass.", "filter_map transforma y descarta las respuestas nil (y false) en una sola pasada.", "filter_map は変換しつつ nil（と false）の答えを捨てるよ。"),
    },
    say(L(
      "lazy makes a chain pull items one at a time, only as many as needed. It even works on endless ranges.",
      "lazy hace que la cadena tome elementos de uno en uno, solo los necesarios. Hasta funciona con rangos infinitos.",
      "lazy をつけると必要な分だけ1つずつ流れる。終わりのない範囲でも使えるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: LAZY_CODE,
      options: ["map 1\n[2]", "map 1\nmap 2\nmap 3\n[2]", "[2]"],
      answer: 0,
      output: "map 1\n[2]",
      check: { compiles: true, stdout: "map 1\n[2]" },
      explain: L("first(1) needs one result, so lazy maps only 1. Without lazy, map would visit all 3 first.", "first(1) necesita un resultado, así que lazy solo transforma el 1. Sin lazy, map visitaría los 3 primero.", "first(1) は1個だけ必要なので lazy は 1 だけ map する。lazy なしなら3つ全部まわるよ。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: "e = [1, 2].each\ne.next\ne.next\ne.next",
      options: [crash("StopIteration"), "nil", "1"],
      answer: 0,
      check: { compiles: true, throws: "(StopIteration)" },
      explain: L("each without a block is an Enumerator. next walks it by hand; past the end: iteration reached an end.", "each sin bloque es un Enumerator. next lo recorre a mano; pasado el final: iteration reached an end.", "ブロックなしの each は Enumerator。next で手動で進み、終わりを越えると StopIteration。"),
    },
    {
      kind: "order",
      prompt: L("Chain spells to print 60", "Encadena hechizos para imprimir 60", "呪文をつなげて 60 と表示"),
      lines: ["total = [1, 2, 3, 4]", "  .select(&:even?)", "  .map { |n| n * 10 }", "  .sum", "puts total"],
      check: { compiles: true, stdout: "60" },
      explain: L("Keep 2 and 4, multiply to 20 and 40, add up to 60. A line starting with . continues the chain.", "Quedan 2 y 4, se multiplican a 20 y 40 y suman 60. Una línea que empieza con . continúa la cadena.", "2 と 4 を残し、20 と 40 にして合計 60。. で始まる行はチェーンの続きだよ。"),
    },
    {
      kind: "run",
      prompt: L("Fix it: it must print doubled: [2, 4, 6]", "Arréglalo: debe imprimir doubled: [2, 4, 6]", "直そう：doubled: [2, 4, 6] と表示"),
      starter: 'doubled = [1, 2, 3].each { |n| n * 2 }\nputs "doubled: #{doubled}"\n',
      solution: 'doubled = [1, 2, 3].map { |n| n * 2 }\nputs "doubled: #{doubled}"\n',
      expect: "doubled: [2, 4, 6]",
      fallback: [String.raw`\]\.(map|collect)\s*(\{|do|\()`, String.raw`\]\.map\(&`],
      explain: L("each returns the original array and ignores the block's answers. map collects them.", "each devuelve el array original e ignora las respuestas del bloque. map las recoge.", "each は元の配列を返しブロックの答えを無視する。map なら答えを集めるよ。"),
    },
  ],
};

// ─── Boss: the Hash Mimic ──────────────────────────────────────────────────
const THREE_CODE = `def three
  yield 1, 2, 3
end
three { |a, *rest| p rest }`;

const forestBoss: LessonDef = {
  slug: "forest-boss",
  title: L("Boss: Hash Mimic", "Jefe: Mímico Hash", "ボス：ハッシュミミック"),
  concept: "enumerable",
  mode: "boss",
  xp: 200,
  enemy: "ruby/hash-mimic",
  enemyName: L("MIMIC QUEEN", "REINA MÍMICA", "ミミック女王"),
  beats: [
    enemySays(L(
      "Hee hee! Every drawer in the forest is mine. Open the wrong one and I'll swallow your items whole!",
      "¡Je je! Cada cajón del bosque es mío. ¡Abre el equivocado y me trago tus objetos enteros!",
      "ひひっ！森の引き出しは全部わらわのもの。まちがえて開けたら持ち物ごと飲みこむぞ！",
    )),
    {
      kind: "predict", time: 15, prompt: PRINT, code: "h = Hash.new([])\nh[:x] << 1\np h[:y]",
      options: ["[1]", "[]", "nil"],
      answer: 0, output: "[1]",
      check: { compiles: true, stdout: "[1]" },
      explain: L("Every missing key shares the same default array, so :y sees the 1 pushed through :x.", "Todas las claves que faltan comparten el mismo array por defecto, así que :y ve el 1 que entró por :x.", "ないキーは全部同じデフォルト配列を共有。:x で入れた 1 が :y にも見えるよ。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT, code: "g = Array.new(2, [])\ng[1] << :gem\np g",
      options: ["[[:gem], [:gem]]", "[[], [:gem]]", "[:gem, :gem]"],
      answer: 0, output: "[[:gem], [:gem]]",
      check: { compiles: true, stdout: "[[:gem], [:gem]]" },
      explain: L("Array.new(2, []) repeats one array. Use Array.new(2) { [] } for separate pouches.", "Array.new(2, []) repite un solo array. Usa Array.new(2) { [] } para bolsas separadas.", "Array.new(2, []) は1つの配列のくり返し。別々なら Array.new(2) { [] } だよ。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT, code: "p [[1, 2], [3, 4]].each_with_object([]) { |(a, b), acc| acc << a + b }",
      options: ["[3, 7]", "[[1, 2], [3, 4]]", "[4, 6]"],
      answer: 0, output: "[3, 7]",
      check: { compiles: true, stdout: "[3, 7]" },
      explain: L("(a, b) unpacks each pair, so acc gets 1+2 and 3+4.", "(a, b) desempaca cada par, así que acc recibe 1+2 y 3+4.", "(a, b) で各ペアを分けるので acc には 1+2 と 3+4 が入るよ。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT, code: THREE_CODE,
      options: ["[2, 3]", "[1, 2, 3]", "2"],
      answer: 0, output: "[2, 3]",
      check: { compiles: true, stdout: "[2, 3]" },
      explain: L("a takes the first value and *rest collects everything else into an array.", "a toma el primer valor y *rest junta todo lo demás en un array.", "a が最初の値を取り、*rest が残りを配列に集めるよ。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT, code: "pr = proc { |a, b| [a, b] }\np pr.call([4, 5])",
      options: ["[4, 5]", "[[4, 5], nil]", "ArgumentError"],
      answer: 0, output: "[4, 5]",
      check: { compiles: true, stdout: "[4, 5]" },
      explain: L("A proc with several parameters auto-splats a single array argument into them.", "Un proc con varios parámetros abre automáticamente un único array en ellos.", "引数が複数の proc は、配列1つを自動で分けて受け取るよ。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT, code: "p [1, 2, 3].each_slice(2).map(&:sum)",
      options: ["[3, 3]", "[3, 5]", "[1, 2, 3]"],
      answer: 0, output: "[3, 3]",
      check: { compiles: true, stdout: "[3, 3]" },
      explain: L("each_slice(2) gives [1, 2] and [3]; summing each gives 3 and 3.", "each_slice(2) da [1, 2] y [3]; sumar cada uno da 3 y 3.", "each_slice(2) で [1, 2] と [3]。それぞれの合計は 3 と 3 だよ。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT, code: "h = {b: 1, a: 2}\np [h.sort_by { |k, v| v }.first, h.sum { |k, v| v }]",
      options: ["[[:b, 1], 3]", "[[:a, 2], 3]", "[{b: 1}, 3]"],
      answer: 0, output: "[[:b, 1], 3]",
      check: { compiles: true, stdout: "[[:b, 1], 3]" },
      explain: L("Enumerable on a hash sees [key, value] pairs. sort_by returns an array of pairs, smallest value first.", "Enumerable sobre un hash ve pares [clave, valor]. sort_by devuelve un array de pares, del menor valor al mayor.", "ハッシュの Enumerable は [キー, 値] のペアを見る。sort_by は値の小さい順のペア配列を返すよ。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT, code: "p [3, 4].reduce(0) { |s, x| s + x if x.odd? }",
      options: ["nil", "3", "7"],
      answer: 0, output: "nil",
      check: { compiles: true, stdout: "nil" },
      explain: L("3 gives 0 + 3. For 4 the if is false, so the block returns nil, and the last answer is the result.", "3 da 0 + 3. Con 4 el if es falso, así que el bloque devuelve nil, y la última respuesta es el resultado.", "3 で 0 + 3。4 では if が偽でブロックは nil を返し、最後の答えが結果になるよ。"),
    },
    {
      kind: "pick", time: 15, prompt: L("Count how often each word appears", "Cuenta cuántas veces aparece cada palabra", "単語の出た回数を数える"),
      code: "p %w[gem key gem].___",
      options: ["tally", "count", "group_by"],
      answer: 0,
      check: { compiles: true, stdout: '{"gem" => 2, "key" => 1}' },
      explain: L("tally builds the word-to-count hash. count gives one number; group_by needs a block.", "tally crea el hash palabra-a-cantidad. count da un solo número; group_by necesita un bloque.", "tally は「単語 → 回数」のハッシュ。count は数1つ、group_by はブロックが必要だよ。"),
    },
    {
      kind: "type", time: 15, prompt: L("Keep only the first 3 of forever", "Toma solo 3 del infinito", "無限から3つだけ取る"),
      code: "p (1..).lazy.map { it * 3 }.___(3)",
      answer: "first",
      check: { compiles: true, stdout: "[3, 6, 9]" },
      explain: L("first(3) pulls just three items through the lazy chain, so the endless range is safe.", "first(3) saca solo tres elementos por la cadena lazy, así que el rango infinito es seguro.", "first(3) は lazy チェーンから3個だけ取るので、無限の範囲でも安全だよ。"),
    },
    {
      kind: "run",
      prompt: L("Count the loot: print counts: {\"gem\" => 2, \"key\" => 1}", "Cuenta el botín: imprime counts: {\"gem\" => 2, \"key\" => 1}", "戦利品を数えて counts を表示"),
      starter: 'counts = {}\n%w[gem key gem].each { |w| counts[w] += 1 }\nputs "counts: #{counts}"\n',
      solution: 'counts = Hash.new(0)\n%w[gem key gem].each { |w| counts[w] += 1 }\nputs "counts: #{counts}"\n',
      expect: 'counts: {"gem" => 2, "key" => 1}',
      fallback: [String.raw`counts\s*=\s*Hash\.new\(\s*0\s*\)`, String.raw`\.tally`],
      explain: L("counts[w] is nil the first time, and nil + 1 crashes. Hash.new(0) starts every count at 0.", "counts[w] es nil la primera vez, y nil + 1 falla. Hash.new(0) empieza cada cuenta en 0.", "最初 counts[w] は nil で nil + 1 は落ちる。Hash.new(0) なら 0 から数えられるよ。"),
    },
    enemySays(L(
      "My drawers... all emptied! You know every trick of the forest. The Module Castle stands ahead.",
      "Mis cajones... ¡todos vacíos! Conoces cada truco del bosque. El Castillo de Módulos se alza adelante.",
      "わらわの引き出しが…空っぽに！森のワザは全部お見通しか。この先はモジュール城だ。",
    )),
  ],
};

export const enumerableForest: RegionDef = {
  slug: "enumerable-forest",
  name: L("Enumerable Forest", "Bosque Enumerable", "Enumerable の森"),
  subtitle: L("Collections and blocks", "Colecciones y bloques", "コレクションとブロック"),
  theme: "forest",
  lessons: [arrays, hashesAndRanges, blocksProcsLambdas, enumerableMagic, forestBoss],
};
