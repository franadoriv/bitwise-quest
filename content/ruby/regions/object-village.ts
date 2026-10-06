import type { LessonDef, RegionDef } from "../../../lib/content/types.ts";
import { L, say, enemySays } from "../../rust/helpers.ts";

// REGION 1 · OBJECT VILLAGE  (everything is an object: puts/p, numbers, strings, symbols, truthiness, methods)
// Snippets are whole Ruby 3.4.7 scripts, run as is on Compiler Explorer.

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");
const VALID = L("Is this valid Ruby?", "¿Es Ruby válido?", "正しい Ruby？");
const YES_RUNS = L("Yes, it runs", "Sí, se ejecuta", "はい、動く");
const NO_SYNTAX = L("No: SyntaxError", "No: SyntaxError", "いいえ：SyntaxError");

// ─── 1.1 Everything answers messages ───────────────────────────────────────
const helloObjects: LessonDef = {
  slug: "hello-objects",
  title: L("Everything answers", "Todo responde", "なんでも答える"),
  concept: "objects",
  mode: "lesson",
  xp: 60,
  enemy: "slime",
  enemyName: L("ECHO SLIME", "SLIME ECO", "こだまスライム"),
  beats: [
    say(L(
      "Welcome to Rubion! Here EVERYTHING is an object, even a number. Objects answer MESSAGES: 42.class asks 42 what it is.",
      "¡Bienvenido a Rubión! Aquí TODO es un objeto, hasta un número. Los objetos responden MENSAJES: 42.class le pregunta a 42 qué es.",
      "ルビオンへようこそ！ここでは数もふくめて全部がオブジェクト。42.class は 42 に「きみは何？」と聞くメッセージだよ。",
    )),
    {
      kind: "act",
      prompt: L("Press in order and talk to the objects", "Pulsa en orden y habla con los objetos", "順番に押してオブジェクトと話そう"),
      steps: [
        { label: L("HELLO", "HOLA", "あいさつ"), line: 'puts "Hello, Rubion!"', effects: [{ t: "print", text: "Hello, Rubion!" }], output: "Hello, Rubion!" },
        {
          label: L("ASK 42", "PREGUNTAR 42", "42 に聞く"),
          line: "puts 42.class",
          effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "say", actor: "hero", text: L("I'm an Integer!", "¡Soy un Integer!", "Integer だよ！") }, { t: "print", text: "Integer" }],
          output: "Integer",
        },
        { label: L("LABEL x", "ETIQUETA x", "x を貼る"), line: "x = 10", effects: [{ t: "tag", actor: "hero", text: "x", value: "10" }] },
        { label: L("MOVE x", "MOVER x", "x を移す"), line: 'x = "ten"', effects: [{ t: "value", actor: "hero", text: '"ten"' }, { t: "say", actor: "hero", text: L("Now a String!", "¡Ahora un String!", "今度は String！") }] },
        {
          label: L("ADD nil", "SUMAR nil", "nil を足す"),
          line: "puts 5 + nil",
          effects: [{ t: "enter", actor: "enemy" }, { t: "shake" }, { t: "say", actor: "enemy", text: L("Can't add me!", "¡No me sumas!", "足せないよ！") }],
          error: {
            compiler: "main.rb:5:in 'Integer#+': nil can't be coerced into Integer (TypeError)",
            plain: L("Ruby never converts types for you: a number plus nil is a TypeError.", "Ruby nunca convierte tipos por ti: un número más nil es un TypeError.", "Ruby は型を勝手に変えない。数 + nil は TypeError だよ。"),
          },
        },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'p [42.class, 3.14.class, "hi".class]',
      options: ["[Integer, Float, String]", "[Number, Number, Text]", '[42, 3.14, "hi"]'],
      answer: 0,
      output: "[Integer, Float, String]",
      check: { compiles: true, stdout: "[Integer, Float, String]" },
      explain: L("Whole numbers are Integer, numbers with a dot are Float, text in quotes is String.", "Los enteros son Integer, los números con punto son Float y el texto entre comillas es String.", "整数は Integer、小数点つきは Float、引用符の文字は String だよ。"),
      setup: [{ t: "item", kind: "gem", holder: "hero" }],
      win: [{ t: "print", text: "[Integer, Float, String]" }],
    },
    {
      kind: "predict",
      prompt: L("Even nothing is an object! Prints?", "¡Hasta la nada es un objeto! ¿Imprime?", "「無」もオブジェクト！表示は？"),
      code: "p [nil.class, true.class, :a.class]",
      options: ["[NilClass, TrueClass, Symbol]", "[nil, true, :a]", "[NilClass, Boolean, Symbol]"],
      answer: 0,
      output: "[NilClass, TrueClass, Symbol]",
      check: { compiles: true, stdout: "[NilClass, TrueClass, Symbol]" },
      explain: L("nil, true and symbols are objects too, each with its own class. Ruby has no Boolean class.", "nil, true y los símbolos también son objetos, cada uno con su clase. Ruby no tiene clase Boolean.", "nil も true もシンボルもオブジェクトで、それぞれクラスがある。Boolean クラスはないよ。"),
    },
    {
      kind: "predict",
      prompt: L("Ask the numbers. Prints?", "Pregunta a los números. ¿Imprime?", "数に聞こう。表示は？"),
      code: "p [5.even?, -7.abs, 3.zero?]",
      options: ["[false, 7, false]", "[true, -7, false]", "[false, 7, true]"],
      answer: 0,
      output: "[false, 7, false]",
      check: { compiles: true, stdout: "[false, 7, false]" },
      explain: L("5 is odd, the absolute value of -7 is 7, and 3 is not zero. A ? method answers yes or no.", "5 es impar, el valor absoluto de -7 es 7 y 3 no es cero. Un método con ? responde sí o no.", "5 は奇数、-7 の絶対値は 7、3 はゼロじゃない。? のメソッドは真偽で答えるよ。"),
    },
    say(L(
      "puts prints text for humans. p prints a value as code, so strings keep their quotes. print adds no new line.",
      "puts imprime texto para personas. p imprime el valor como código: los strings conservan sus comillas. print no agrega salto de línea.",
      "puts は人向けに表示。p はコードの形で表示するから文字列に引用符がつく。print は改行しないよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: 'p "hi"',
      options: ['"hi"', "hi", ":hi"],
      answer: 0,
      output: '"hi"',
      check: { compiles: true, stdout: '"hi"' },
      explain: L("p shows the value as you would write it in code: a String in quotes. puts \"hi\" would print hi.", "p muestra el valor como lo escribirías en código: un String entre comillas. puts \"hi\" imprimiría hi.", "p はコードで書く形で見せるので引用符つき。puts \"hi\" なら hi と出るよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'print "a", "b"\nputs "c"',
      options: ["abc", "a b c", "ab"],
      answer: 0,
      output: "abc",
      check: { compiles: true, stdout: "abc" },
      explain: L("print writes a and b with no new line, then puts writes c and ends the line.", "print escribe a y b sin salto de línea; luego puts escribe c y termina la línea.", "print は改行なしで a と b、そのあと puts が c を書いて改行するよ。"),
    },
    say(L(
      "A variable is a LABEL stuck on an object. The label can move to any object, of any type, at any time.",
      "Una variable es una ETIQUETA pegada a un objeto. Puede pasar a cualquier objeto, de cualquier tipo, cuando quieras.",
      "変数はオブジェクトに貼る「ラベル」。どんな型のオブジェクトにも、いつでも貼りかえられるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: 'x = 10\nx = "ten"\nputs x',
      options: ["ten", "10", "TypeError"],
      answer: 0,
      output: "ten",
      check: { compiles: true, stdout: "ten" },
      explain: L("The label x moved from 10 to \"ten\". Ruby is dynamically typed: labels have no fixed type.", "La etiqueta x pasó de 10 a \"ten\". Ruby es de tipado dinámico: las etiquetas no tienen tipo fijo.", "ラベル x は 10 から \"ten\" に移った。Ruby は動的型付けでラベルに型はないよ。"),
      setup: [{ t: "tag", actor: "hero", text: "x", value: "10" }],
      win: [{ t: "value", actor: "hero", text: '"ten"' }, { t: "print", text: "ten" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "x = 3\ny = x\ny += 1\np [x, y]",
      options: ["[3, 4]", "[4, 4]", "[3, 3]"],
      answer: 0,
      output: "[3, 4]",
      check: { compiles: true, stdout: "[3, 4]" },
      explain: L("y += 1 means y = y + 1: y moves to a NEW number 4. Numbers never change, so x still points to 3.", "y += 1 significa y = y + 1: y pasa a un NUEVO número 4. Los números no cambian, así que x sigue en 3.", "y += 1 は y = y + 1。y は新しい数 4 に移る。数は変わらないので x は 3 のままだよ。"),
      setup: [{ t: "tag", actor: "hero", text: "x", value: "3" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "y", value: "3" }],
      win: [{ t: "value", actor: "ally", text: "4" }],
    },
    say(L(
      "But Ruby never mixes types for you. To put a number in text, call .to_s or write it inside \"#{ }\" (interpolation).",
      "Pero Ruby nunca mezcla tipos por ti. Para meter un número en un texto, usa .to_s o escríbelo dentro de \"#{ }\" (interpolación).",
      "でも Ruby は型を勝手にまぜない。数を文字に入れるなら .to_s か \"#{ }\"（式展開）を使おう。",
    )),
    {
      kind: "predict",
      prompt: HAPPENS,
      code: "puts 5 + nil",
      options: [L("TypeError: it crashes", "TypeError: se cae", "TypeError で落ちる"), "5", "nil"],
      answer: 0,
      check: { compiles: true, throws: "(TypeError)" },
      explain: L("nil can't be coerced into Integer: Ruby refuses to guess what 5 + nothing means.", "nil can't be coerced into Integer: Ruby no adivina qué significa 5 + nada.", "nil can't be coerced into Integer。5 + 「なし」の意味を Ruby は推測しないよ。"),
      setup: [{ t: "enter", actor: "enemy" }],
      win: [{ t: "shake" }],
    },
    {
      kind: "type",
      prompt: L("Turn 3 into text", "Convierte 3 en texto", "3 を文字列にしよう"),
      code: 'puts "level " + 3.___',
      answer: "to_s",
      check: { compiles: true, stdout: "level 3" },
      explain: L("to_s means \"to string\": 3.to_s is \"3\", and two strings can be joined with +.", "to_s significa \"a string\": 3.to_s es \"3\", y dos strings se unen con +.", "to_s は「文字列へ」。3.to_s は \"3\" で、文字列どうしは + でつなげるよ。"),
      win: [{ t: "print", text: "level 3" }],
    },
    {
      kind: "order",
      prompt: L("Print HP: 10 with interpolation", "Imprime HP: 10 con interpolación", "式展開で HP: 10 と表示"),
      lines: ["hp = 10", 'msg = "HP: #{hp}"', "puts msg"],
      check: { compiles: true, stdout: "HP: 10" },
      explain: L("First label the number, then build the text with #{hp}, then print it.", "Primero etiqueta el número, luego arma el texto con #{hp} y después imprímelo.", "まず数にラベル、次に #{hp} で文字列を作って、最後に表示だよ。"),
    },
    {
      kind: "run",
      prompt: L("Fix it: it must print HP: 10", "Arréglalo: debe imprimir HP: 10", "直そう：HP: 10 と表示させて"),
      starter: 'hp = 10\nputs "HP: " + hp\n',
      solution: 'hp = 10\nputs "HP: #{hp}"\n',
      expect: "HP: 10",
      fallback: [String.raw`#\{\s*hp\s*\}`, String.raw`hp\.to_s`],
      explain: L("String + Integer is a TypeError. Use \"HP: #{hp}\" or \"HP: \" + hp.to_s.", "String + Integer es un TypeError. Usa \"HP: #{hp}\" o \"HP: \" + hp.to_s.", "String + Integer は TypeError。\"HP: #{hp}\" か \"HP: \" + hp.to_s にしよう。"),
    },
  ],
};

// ─── 1.2 Gems, scrolls and engraved symbols ────────────────────────────────
const FROZEN_CODE = `# frozen_string_literal: true
s = "hi"
s << "!"
puts s`;

const stringsAndNumbers: LessonDef = {
  slug: "strings-and-numbers",
  title: L("Scrolls and symbols", "Pergaminos y símbolos", "巻物とシンボル"),
  concept: "strings",
  mode: "lesson",
  xp: 60,
  enemy: "ruby/frozen-cube",
  enemyName: L("FROST CUBE", "CUBO DE ESCARCHA", "こおりキューブ"),
  beats: [
    say(L(
      "Integers are whole numbers, Floats have a dot. Careful: Integer / Integer stays an Integer, so the fraction is dropped.",
      "Los Integer son enteros y los Float tienen punto. Ojo: Integer / Integer sigue siendo Integer, así que se pierde la fracción.",
      "Integer は整数、Float は小数点つき。注意：Integer / Integer は Integer のままで、小数は消えるよ。",
    )),
    {
      kind: "act",
      prompt: L("Press in order and watch the numbers", "Pulsa en orden y mira los números", "順番に押して数を見てね"),
      steps: [
        { label: L("7 / 2", "7 / 2", "7 / 2"), line: "puts 7 / 2", effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "print", text: "3" }], output: "3" },
        { label: L("7.0 / 2", "7.0 / 2", "7.0 / 2"), line: "puts 7.0 / 2", effects: [{ t: "print", text: "3.5" }], output: "3.5" },
        { label: L("REMAINDER", "RESTO", "あまり"), line: "puts 7 % 3", effects: [{ t: "print", text: "1" }], output: "1" },
        {
          label: L("HUGE", "ENORME", "きょだい"),
          line: "puts 2**64",
          effects: [{ t: "banner", text: L("NO OVERFLOW", "SIN DESBORDE", "あふれない") }, { t: "print", text: "18446744073709551616" }],
          output: "18446744073709551616",
        },
        {
          label: L("DIVIDE BY 0", "DIVIDIR ENTRE 0", "0 でわる"),
          line: "puts 1 / 0",
          effects: [{ t: "shake" }],
          error: {
            compiler: "main.rb:5:in 'Integer#/': divided by 0 (ZeroDivisionError)",
            plain: L("Integers can't be divided by zero. (1.0 / 0 gives Infinity instead.)", "Los enteros no se dividen entre cero. (1.0 / 0 da Infinity.)", "整数は 0 でわれない（1.0 / 0 なら Infinity）。"),
          },
        },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "p [7 / 2, -7 / 2, 7.0 / 2]",
      options: ["[3, -4, 3.5]", "[3, -3, 3.5]", "[3.5, -3.5, 3.5]"],
      answer: 0,
      output: "[3, -4, 3.5]",
      check: { compiles: true, stdout: "[3, -4, 3.5]" },
      explain: L("Integer division rounds DOWN, toward minus infinity: -3.5 becomes -4. One Float makes it a Float.", "La división entera redondea HACIA ABAJO, hacia menos infinito: -3.5 pasa a -4. Con un Float da Float.", "整数の割り算は小さい方へ切り捨て。-3.5 は -4 になる。Float がひとつあれば Float だよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "p [7.fdiv(2), 7.divmod(2)]",
      options: ["[3.5, [3, 1]]", "[3, [3, 1]]", "[3.5, [1, 3]]"],
      answer: 0,
      output: "[3.5, [3, 1]]",
      check: { compiles: true, stdout: "[3.5, [3, 1]]" },
      explain: L("fdiv always gives a Float. divmod gives the quotient and the remainder together.", "fdiv siempre da un Float. divmod da el cociente y el resto juntos.", "fdiv はいつも Float。divmod は商とあまりを一緒に返すよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "puts 0.1 + 0.2 == 0.3",
      options: ["false", "true"],
      answer: 0,
      output: "false",
      check: { compiles: true, stdout: "false" },
      explain: L("Floats are binary and can't store 0.1 exactly. For exact math use Rational: 1/10r.", "Los Float son binarios y no guardan 0.1 exacto. Para cálculos exactos usa Rational: 1/10r.", "Float は二進数なので 0.1 を正確に持てない。正確な計算は Rational（1/10r）だよ。"),
    },
    say(L(
      "Text lives in quotes. Double quotes understand \"#{...}\" interpolation. Single quotes keep the text exactly as written.",
      "El texto va entre comillas. Las dobles entienden la interpolación \"#{...}\". Las simples dejan el texto tal cual.",
      "文字はクォートの中。ダブルクォートは \"#{...}\" を展開し、シングルはそのまま残すよ。",
    )),
    {
      kind: "predict",
      prompt: L("Single quotes. Prints?", "Comillas simples. ¿Imprime?", "シングルクォート。表示は？"),
      code: "name = \"Rubi\"\nputs 'Hi, #{name}!'",
      options: ["Hi, #{name}!", "Hi, Rubi!", "Hi, !"],
      answer: 0,
      output: "Hi, #{name}!",
      check: { compiles: true, stdout: "Hi, #{name}!" },
      explain: L("Single quotes never interpolate. With double quotes it would print Hi, Rubi!", "Las comillas simples nunca interpolan. Con dobles imprimiría Hi, Rubi!", "シングルクォートは展開しない。ダブルなら Hi, Rubi! になるよ。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: 'puts "5" + 5',
      options: [L("TypeError: it crashes", "TypeError: se cae", "TypeError で落ちる"), "10", "55"],
      answer: 0,
      check: { compiles: true, throws: "(TypeError)" },
      explain: L("no implicit conversion of Integer into String. Convert first: \"5\".to_i + 5 or \"5\" + 5.to_s.", "no implicit conversion of Integer into String. Convierte antes: \"5\".to_i + 5 o \"5\" + 5.to_s.", "no implicit conversion of Integer into String。先に \"5\".to_i か 5.to_s で変換しよう。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'p ["5" * 3, "5".to_i + 5, "12abc".to_i]',
      options: ['["555", 10, 12]', "[15, 10, 12]", '["555", 10, 0]'],
      answer: 0,
      output: '["555", 10, 12]',
      check: { compiles: true, stdout: '["555", 10, 12]' },
      explain: L("String * 3 repeats it. to_i is lenient: it reads digits until it can't, so \"12abc\" gives 12.", "String * 3 lo repite. to_i es tolerante: lee dígitos hasta que no puede, así que \"12abc\" da 12.", "文字列 * 3 はくり返し。to_i はゆるくて読める所まで読むので \"12abc\" は 12。"),
    },
    {
      kind: "predict",
      prompt: L("The strict converter. What happens?", "El conversor estricto. ¿Qué pasa?", "きびしい変換。どうなる？"),
      code: 'puts Integer("12abc")',
      options: [L("ArgumentError: it crashes", "ArgumentError: se cae", "ArgumentError で落ちる"), "12", "0"],
      answer: 0,
      check: { compiles: true, throws: "(ArgumentError)" },
      explain: L("Integer() is strict: invalid value for Integer(). Use it when bad input must not slip through.", "Integer() es estricto: invalid value for Integer(). Úsalo cuando una entrada mala no debe colarse.", "Integer() はきびしく invalid value for Integer() を出す。変な入力を通したくない時に使おう。"),
    },
    say(L(
      "Strings are MUTABLE. << writes on the same scroll, so every label on it sees the change. += makes a brand-new scroll.",
      "Los strings son MUTABLES. << escribe en el mismo pergamino: toda etiqueta pegada ve el cambio. += crea un pergamino nuevo.",
      "文字列は変更できる。<< は同じ巻物に書くので、貼られたラベル全部に見える。+= は新しい巻物を作るよ。",
    )),
    {
      kind: "predict",
      prompt: L("Two labels, one scroll. Prints?", "Dos etiquetas, un pergamino. ¿Imprime?", "ラベル2枚に巻物1つ。表示は？"),
      code: 's = "hi"\nt = s\nt << "!"\nputs s',
      options: ["hi!", "hi"],
      answer: 0,
      output: "hi!",
      check: { compiles: true, stdout: "hi!" },
      explain: L("t = s does not copy: both labels point to the same string, and << changed that string.", "t = s no copia: ambas etiquetas apuntan al mismo string, y << cambió ese string.", "t = s はコピーしない。2つのラベルは同じ文字列を指し、<< がそれを変えたよ。"),
      setup: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "s, t", value: '"hi"' }],
      win: [{ t: "value", actor: "hero", text: '"hi!"' }, { t: "print", text: "hi!" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 's = "hi"\nt = s\nt += "!"\np [s, t]',
      options: ['["hi", "hi!"]', '["hi!", "hi!"]', '["hi", "hi"]'],
      answer: 0,
      output: '["hi", "hi!"]',
      check: { compiles: true, stdout: '["hi", "hi!"]' },
      explain: L("t += \"!\" builds a NEW string and moves only the label t. s keeps the old one.", "t += \"!\" crea un string NUEVO y mueve solo la etiqueta t. s conserva el viejo.", "t += \"!\" は新しい文字列を作り、ラベル t だけ移す。s は元のままだよ。"),
      setup: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "s", value: '"hi"' }],
      win: [{ t: "clone", to: "ally" }, { t: "tag", actor: "ally", text: "t", value: '"hi!"' }],
    },
    {
      kind: "predict",
      prompt: L("A ! method. Prints?", "Un método con !. ¿Imprime?", "! のメソッド。表示は？"),
      code: 's = "hello"\ns.upcase\nprint s, " "\ns.upcase!\nputs s',
      options: ["hello HELLO", "HELLO HELLO", "hello hello"],
      answer: 0,
      output: "hello HELLO",
      check: { compiles: true, stdout: "hello HELLO" },
      explain: L("upcase returns a new string and leaves s alone. upcase! (with !) changes s itself.", "upcase devuelve un string nuevo y deja s igual. upcase! (con !) cambia s en sí.", "upcase は新しい文字列を返し s はそのまま。! つきの upcase! は s 自体を変えるよ。"),
    },
    say(L(
      ":name is a SYMBOL: an engraved name. Every :name is the very same object, so symbols make great labels and keys.",
      ":name es un SÍMBOLO: un nombre grabado. Cada :name es exactamente el mismo objeto; son ideales como etiquetas y claves.",
      ":name はシンボル、刻まれた名前だよ。:name はいつも同じオブジェクトで、名札やキーにぴったり。",
    )),
    {
      kind: "predict",
      prompt: L("Same object? Prints?", "¿El mismo objeto? ¿Imprime?", "同じオブジェクト？表示は？"),
      code: 'p [:a.equal?(:a), "a".equal?("a")]',
      options: ["[true, false]", "[true, true]", "[false, false]"],
      answer: 0,
      output: "[true, false]",
      check: { compiles: true, stdout: "[true, false]" },
      explain: L("equal? asks \"the very same object?\". Each \"a\" literal makes a new string; :a is always one gem.", "equal? pregunta \"¿exactamente el mismo objeto?\". Cada \"a\" crea un string nuevo; :a siempre es una sola gema.", "equal? は「まったく同じ物？」。\"a\" は毎回新しい文字列、:a はいつも同じ宝石だよ。"),
      setup: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: ":a" }],
    },
    say(L(
      "The magic comment # frozen_string_literal: true freezes every string literal in the file. Changing one raises FrozenError.",
      "El comentario mágico # frozen_string_literal: true congela cada string literal del archivo. Cambiar uno lanza FrozenError.",
      "魔法のコメント # frozen_string_literal: true でファイル中の文字列が凍る。変えると FrozenError だよ。",
    )),
    {
      kind: "predict",
      prompt: HAPPENS,
      code: FROZEN_CODE,
      options: [L("FrozenError: it crashes", "FrozenError: se cae", "FrozenError で落ちる"), "hi!", "hi"],
      answer: 0,
      check: { compiles: true, throws: "(FrozenError)" },
      explain: L("With the magic comment, \"hi\" is frozen: can't modify frozen String. Frozen strings are safe to share.", "Con el comentario mágico, \"hi\" está congelado: can't modify frozen String. Se pueden compartir sin riesgo.", "魔法のコメントで \"hi\" は凍っている（can't modify frozen String）。凍った文字列は安全に共有できるよ。"),
      setup: [{ t: "enter", actor: "enemy" }, { t: "item", kind: "scroll", holder: "hero" }],
      win: [{ t: "shake" }, { t: "say", actor: "enemy", text: L("Frozen solid!", "¡Congelado!", "カチコチだ！") }],
    },
    {
      kind: "pick",
      prompt: L("Get a thawed copy to append to", "Consigue una copia descongelada", "とかしたコピーで追記しよう"),
      code: '# frozen_string_literal: true\nt = ___"ok"\nt << "!"\nputs t',
      options: ["+", "-", "*"],
      answer: 0,
      check: { compiles: true, stdout: "ok!" },
      explain: L("Unary + returns an unfrozen string you may change. Unary - returns a frozen one.", "El + unario devuelve un string no congelado que puedes cambiar. El - unario devuelve uno congelado.", "単項 + は凍っていない文字列を返す。単項 - は凍った文字列を返すよ。"),
      win: [{ t: "print", text: "ok!" }],
    },
    {
      kind: "run",
      prompt: L("Fix it: it must print average: 7.5", "Arréglalo: debe imprimir average: 7.5", "直そう：average: 7.5 と表示させて"),
      starter: 'average = (7 + 8) / 2\nputs "average: #{average}"\n',
      solution: 'average = (7 + 8) / 2.0\nputs "average: #{average}"\n',
      expect: "average: 7.5",
      fallback: [String.raw`/\s*2\.0`, String.raw`\.fdiv\(\s*2\s*\)`, String.raw`\.to_f\s*/\s*2`],
      explain: L("15 / 2 is Integer division and gives 7. Divide by 2.0 (or use fdiv(2)) to keep the .5.", "15 / 2 es división entera y da 7. Divide entre 2.0 (o usa fdiv(2)) para conservar el .5.", "15 / 2 は整数の割り算で 7。2.0 でわる（か fdiv(2)）と .5 が残るよ。"),
    },
  ],
};

// ─── 1.3 Only the ghost and the stone are false ────────────────────────────
const ELSIF_CODE = `hp = 5
if hp > 10
  puts "strong"
___ hp > 0
  puts "hurt"
else
  puts "down"
end`;

const CASE_CODE = `n = 15
size = case n
       when 1..9 then "small"
       when 10..99 then "medium"
       else "big"
       end
puts size`;

const ELSE_IF_CODE = `x = 1
if x > 2
  puts "a"
else if x > 0
  puts "b"
end`;

const truthAndBranches: LessonDef = {
  slug: "truth-and-branches",
  title: L("Ghost and stone", "Fantasma y piedra", "幽霊と石"),
  concept: "truthiness",
  mode: "lesson",
  xp: 60,
  enemy: "ruby/nil-ghost",
  enemyName: L("NIL GHOST", "FANTASMA NIL", "nil ゴースト"),
  beats: [
    say(L(
      "In Ruby only TWO things are false: nil (the ghost) and false (the stone). Everything else is true, even 0 and \"\".",
      "En Ruby solo DOS cosas son falsas: nil (el fantasma) y false (la piedra). Todo lo demás es verdadero, hasta 0 y \"\".",
      "Ruby で偽なのは nil（幽霊）と false（石）の2つだけ。0 や \"\" もふくめて他は全部「真」だよ。",
    )),
    {
      kind: "act",
      prompt: L("Press in order and test the gate", "Pulsa en orden y prueba la puerta", "順番に押して門をためそう"),
      steps: [
        { label: L("ZERO", "CERO", "ゼロ"), line: "zero = 0", effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "zero", value: "0" }] },
        {
          label: L("GATE zero", "PUERTA zero", "zero の門"),
          line: 'puts "pass" if zero',
          effects: [{ t: "say", actor: "hero", text: L("0 passes!", "¡0 pasa!", "0 は通れる！") }, { t: "print", text: "pass" }],
          output: "pass",
        },
        { label: L("GHOST", "FANTASMA", "幽霊"), line: "none = nil", effects: [{ t: "enter", actor: "enemy" }, { t: "tag", actor: "enemy", text: "none", value: "nil" }] },
        {
          label: L("GATE none", "PUERTA none", "none の門"),
          line: 'puts "pass" if none',
          effects: [{ t: "shake" }, { t: "say", actor: "enemy", text: L("Blocked...", "Bloqueado...", "通れない…") }],
        },
        {
          label: L("UNLESS", "UNLESS", "unless"),
          line: 'puts "no ghost" unless none',
          effects: [{ t: "print", text: "no ghost" }],
          output: "no ghost",
        },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'zero = 0\nempty = ""\nnone = nil\np [zero ? "y" : "n", empty ? "y" : "n", none ? "y" : "n"]',
      options: ['["y", "y", "n"]', '["n", "n", "n"]', '["n", "y", "n"]'],
      answer: 0,
      output: '["y", "y", "n"]',
      check: { compiles: true, stdout: '["y", "y", "n"]' },
      explain: L("cond ? a : b picks a when cond is truthy. 0 and \"\" are truthy in Ruby; only nil and false are not.", "cond ? a : b elige a cuando cond es verdadera. 0 y \"\" son verdaderos en Ruby; solo nil y false no.", "cond ? a : b は真なら a。Ruby では 0 も \"\" も真で、偽は nil と false だけ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "x = nil\np [x.nil?, !!x, !!0]",
      options: ["[true, false, true]", "[true, false, false]", "[false, true, true]"],
      answer: 0,
      output: "[true, false, true]",
      check: { compiles: true, stdout: "[true, false, true]" },
      explain: L("nil? asks \"are you nil?\". !! turns any value into true or false: nil is false, 0 is true.", "nil? pregunta \"¿eres nil?\". !! convierte cualquier valor en true o false: nil es false, 0 es true.", "nil? は「nil？」と聞く。!! は値を true/false に変える。nil は false、0 は true。"),
    },
    say(L(
      "Branch with if / elsif / else ... end, or unless. Short form at the end of a line: puts \"hi\" if ready.",
      "Ramifica con if / elsif / else ... end, o con unless. Forma corta al final de la línea: puts \"hi\" if ready.",
      "分岐は if / elsif / else ... end か unless。行末に書く短い形もある：puts \"hi\" if ready。",
    )),
    {
      kind: "pick",
      prompt: L("Pick the Ruby keyword", "Elige la palabra de Ruby", "Ruby のキーワードを選ぼう"),
      code: ELSIF_CODE,
      options: ["elsif", "else if"],
      answer: 0,
      check: { compiles: true, stdout: "hurt", wrongFail: true },
      explain: L("Ruby spells it elsif. else if opens a second if that needs its own end: SyntaxError.", "Ruby lo escribe elsif. else if abre un segundo if que necesita su propio end: SyntaxError.", "Ruby では elsif。else if だと2つ目の if が始まり end が足りず SyntaxError。"),
      win: [{ t: "print", text: "hurt" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'hp = 0\nputs "alive" unless hp.zero?\nputs "done"',
      options: ["done", "alive\ndone", "alive"],
      answer: 0,
      output: "done",
      check: { compiles: true, stdout: "done" },
      explain: L("unless runs when the test is false. hp.zero? is true, so alive is skipped.", "unless se ejecuta cuando la prueba es falsa. hp.zero? es true, así que alive se salta.", "unless は条件が偽の時に動く。hp.zero? は true なので alive はスキップ。"),
    },
    {
      kind: "predict",
      prompt: VALID,
      code: ELSE_IF_CODE,
      options: [YES_RUNS, NO_SYNTAX],
      answer: 1,
      check: { compiles: false },
      explain: L("else if starts a NEW if, so one end is missing. Nothing runs at all: write elsif.", "else if inicia un if NUEVO, así que falta un end. No se ejecuta nada: escribe elsif.", "else if は新しい if を始めるので end が足りない。何も実行されない。elsif と書こう。"),
    },
    say(L(
      "case / when compares one value with many patterns using ===. A range matches numbers inside it, a class matches its objects.",
      "case / when compara un valor con varios patrones usando ===. Un rango acepta números dentro de él y una clase, sus objetos.",
      "case / when は === で値をいくつもの型と比べる。範囲は中の数に、クラスはそのオブジェクトに一致するよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: CASE_CODE,
      options: ["medium", "small", "big"],
      answer: 0,
      output: "medium",
      check: { compiles: true, stdout: "medium" },
      explain: L("15 is inside 10..99, so that when wins. case is an expression: its value goes into size.", "15 está dentro de 10..99, así que gana ese when. case es una expresión: su valor va a size.", "15 は 10..99 の中なのでその when が選ばれる。case は式で、値が size に入るよ。"),
    },
    {
      kind: "type",
      prompt: L("Match any String", "Acepta cualquier String", "どんな String でも一致"),
      code: 'v = "hi"\nputs(case v\n     when Integer then "int"\n     when ___ then "str"\n     end)',
      answer: "String",
      check: { compiles: true, stdout: "str" },
      explain: L("String === \"hi\" is true: a class in a when matches every object of that class.", "String === \"hi\" es true: una clase en un when acepta cada objeto de esa clase.", "String === \"hi\" は true。when のクラスはそのクラスの全オブジェクトに一致するよ。"),
    },
    say(L(
      "x ||= 5 sets x only if it is nil or false. a&.length calls length, but gives nil instead of crashing when a is nil.",
      "x ||= 5 asigna x solo si es nil o false. a&.length llama a length, pero da nil en vez de fallar si a es nil.",
      "x ||= 5 は x が nil か false の時だけ代入。a&.length は a が nil なら落ちずに nil を返すよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "x = nil\nx ||= 5\nx ||= 7\nputs x",
      options: ["5", "7", "nil"],
      answer: 0,
      output: "5",
      check: { compiles: true, stdout: "5" },
      explain: L("The first ||= fills the empty x with 5. The second sees 5 (truthy) and does nothing.", "El primer ||= llena x vacía con 5. El segundo ve 5 (verdadero) y no hace nada.", "1回目の ||= で空の x に 5。2回目は 5（真）なので何もしないよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: 'a = nil\nb = "abc"\np [a&.length, b&.length]',
      options: ["[nil, 3]", "[0, 3]", "NoMethodError"],
      answer: 0,
      output: "[nil, 3]",
      check: { compiles: true, stdout: "[nil, 3]" },
      explain: L("&. is a ghost-proof glove: on nil it returns nil instead of calling the method.", "&. es un guante a prueba de fantasmas: con nil devuelve nil en vez de llamar al método.", "&. は幽霊よけの手袋。nil ならメソッドを呼ばず nil を返すよ。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: "a = nil\nputs a.length",
      options: [L("NoMethodError: it crashes", "NoMethodError: se cae", "NoMethodError で落ちる"), "0", "nil"],
      answer: 0,
      check: { compiles: true, throws: "(NoMethodError)" },
      explain: L("undefined method 'length' for nil. Without &., touching the ghost crashes the program.", "undefined method 'length' for nil. Sin &., tocar al fantasma tumba el programa.", "undefined method 'length' for nil。&. なしで幽霊にさわると落ちるよ。"),
      setup: [{ t: "enter", actor: "enemy" }],
      win: [{ t: "attack", from: "hero", to: "enemy" }, { t: "shake" }],
    },
    say(L(
      "Watch out: and / or bind LOOSER than =. So b = false or true stores false in b, then ors it with true.",
      "Cuidado: and / or se unen MÁS DÉBIL que =. Así b = false or true guarda false en b y luego hace el or con true.",
      "注意：and / or は = より結びつきが弱い。b = false or true は b に false を入れてから or するよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "a = false || true\nb = false or true\np [a, b]",
      options: ["[true, false]", "[true, true]", "[false, false]"],
      answer: 0,
      output: "[true, false]",
      check: { compiles: true, stdout: "[true, false]" },
      explain: L("|| binds tighter than =, so a gets true. or binds looser: (b = false) or true. Use && and || in expressions.", "|| se une más fuerte que =, así que a recibe true. or es más débil: (b = false) or true. Usa && y || en expresiones.", "|| は = より強いので a は true。or は弱く (b = false) or true になる。式では && と || を使おう。"),
    },
    say(L(
      "Loops: 3.times { |i| ... } runs the code in braces 3 times with i = 0, 1, 2. next skips to the next turn, break stops.",
      "Bucles: 3.times { |i| ... } ejecuta el código entre llaves 3 veces con i = 0, 1, 2. next salta al siguiente turno y break para.",
      "ループ：3.times { |i| ... } は i = 0, 1, 2 で3回動く。next は次の回へ、break は終了だよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "3.times { |i| print i }\nputs",
      options: ["012", "123", "0123"],
      answer: 0,
      output: "012",
      check: { compiles: true, stdout: "012" },
      explain: L("times counts from 0 and stops before 3. The final puts just ends the line.", "times cuenta desde 0 y para antes de 3. El puts final solo termina la línea.", "times は 0 から数えて 3 の手前で止まる。最後の puts は改行だけだよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "[1, 2, 3, 4].each { |n| next if n.even?; print n }\nputs",
      options: ["13", "24", "1234"],
      answer: 0,
      output: "13",
      check: { compiles: true, stdout: "13" },
      explain: L("each visits every item. next skips the even ones, so only 1 and 3 are printed.", "each visita cada elemento. next salta los pares, así que solo se imprimen 1 y 3.", "each は全要素をまわる。next で偶数を飛ばすので 1 と 3 だけ表示。"),
    },
    {
      kind: "type",
      prompt: L("Repeat while i is below 5", "Repite mientras i sea menor que 5", "i が 5 未満の間くり返す"),
      code: "i = 0\ni += 1 ___ i < 5\nputs i",
      answer: "while",
      check: { compiles: true, stdout: "5" },
      explain: L("A while modifier repeats the line while the test is true: i grows until it reaches 5.", "Un while al final repite la línea mientras la prueba sea verdadera: i crece hasta llegar a 5.", "行末の while は条件が真の間くり返す。i は 5 になるまで増えるよ。"),
    },
    {
      kind: "run",
      prompt: L("0 means sold out! It must print sold out", "¡0 es agotado! Debe imprimir sold out", "0 は売り切れ！sold out と表示させて"),
      starter: 'stock = 0\nif stock\n  puts "in stock: #{stock}"\nelse\n  puts "sold out"\nend\n',
      solution: 'stock = 0\nif stock > 0\n  puts "in stock: #{stock}"\nelse\n  puts "sold out"\nend\n',
      expect: "sold out",
      fallback: [String.raw`if\s+stock\s*>\s*0`, String.raw`if\s+stock\.positive\?`, String.raw`unless\s+stock\.zero\?`, String.raw`if\s+!\s*stock\.zero\?`, String.raw`if\s+stock\s*!=\s*0`],
      explain: L("0 is truthy in Ruby, so if stock always passes. Test the number: if stock > 0.", "0 es verdadero en Ruby, así que if stock siempre pasa. Prueba el número: if stock > 0.", "Ruby では 0 も真なので if stock は必ず通る。if stock > 0 で数を調べよう。"),
    },
  ],
};

// ─── 1.4 Kira's spellbook of methods ───────────────────────────────────────
const LAST_CODE = `def last_expr
  1
  2
  3
end
p last_expr`;

const SIGN_CODE = `def sign(x)
  return "neg" if x < 0
  "pos"
end
p [sign(-1), sign(1)]`;

const methodsAndArguments: LessonDef = {
  slug: "methods-and-arguments",
  title: L("Kira's spellbook", "El libro de Kira", "キラの呪文書"),
  concept: "methods",
  mode: "lesson",
  xp: 70,
  enemy: "ruby/monkey-imp",
  enemyName: L("SPELL IMP", "DIABLILLO", "じゅもん小鬼"),
  beats: [
    say(L(
      "def builds a METHOD: a named spell. The LAST expression it runs is its answer, so you rarely need return.",
      "def crea un MÉTODO: un hechizo con nombre. La ÚLTIMA expresión que ejecuta es su respuesta; casi nunca necesitas return.",
      "def でメソッド（名前つきの呪文）を作る。最後に評価した式が答えなので return はほとんどいらないよ。",
    )),
    {
      kind: "act",
      prompt: L("Press in order and cast the spell", "Pulsa en orden y lanza el hechizo", "順番に押して呪文をとなえよう"),
      steps: [
        { label: L("DEFINE", "DEFINIR", "定義する"), line: 'def greet(name = "hero")', effects: [{ t: "enter", actor: "ally" }, { t: "item", kind: "scroll", holder: "ally" }] },
        { label: L("BODY", "CUERPO", "中身"), line: '  "Hi, #{name}"' },
        { label: L("END", "END", "end"), line: "end" },
        { label: L("CALL", "LLAMAR", "呼ぶ"), line: "puts greet", effects: [{ t: "say", actor: "ally", text: L("Hi, hero", "Hi, hero", "Hi, hero") }, { t: "print", text: "Hi, hero" }], output: "Hi, hero" },
        { label: L("CALL Rubi", "LLAMAR Rubi", "Rubi で呼ぶ"), line: 'puts greet("Rubi")', effects: [{ t: "say", actor: "ally", text: L("Hi, Rubi", "Hi, Rubi", "Hi, Rubi") }, { t: "print", text: "Hi, Rubi" }], output: "Hi, Rubi" },
        {
          label: L("TOO MANY", "DEMASIADOS", "多すぎ"),
          line: "greet(1, 2)",
          effects: [{ t: "shake" }, { t: "say", actor: "ally", text: L("Too many!", "¡Demasiados!", "多すぎ！") }],
          error: {
            compiler: "main.rb:1:in 'greet': wrong number of arguments (given 2, expected 0..1) (ArgumentError)",
            plain: L("Ruby checks how many arguments you pass. greet takes 0 or 1.", "Ruby revisa cuántos argumentos pasas. greet acepta 0 o 1.", "Ruby は引数の数を調べる。greet は 0 個か 1 個だよ。"),
          },
        },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: LAST_CODE,
      options: ["3", "1", "nil"],
      answer: 0,
      output: "3",
      check: { compiles: true, stdout: "3" },
      explain: L("A method returns the value of the last expression it ran: here 3.", "Un método devuelve el valor de la última expresión que ejecutó: aquí 3.", "メソッドは最後に評価した式の値を返す。ここでは 3 だよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: SIGN_CODE,
      options: ['["neg", "pos"]', '["pos", "pos"]', '["neg", "neg"]'],
      answer: 0,
      output: '["neg", "pos"]',
      check: { compiles: true, stdout: '["neg", "pos"]' },
      explain: L("return leaves the method early. For 1 the guard is skipped and \"pos\" is the last expression.", "return sale del método antes. Con 1 la guarda se salta y \"pos\" es la última expresión.", "return は途中でぬける。1 の時はスキップされ \"pos\" が最後の式になるよ。"),
    },
    say(L(
      "Short methods fit one line: def heal(hp, amount: 10) = hp + amount. amount: is a KEYWORD argument: callers name it.",
      "Los métodos cortos caben en una línea: def heal(hp, amount: 10) = hp + amount. amount: es un argumento con NOMBRE (keyword).",
      "短いメソッドは1行で書ける：def heal(hp, amount: 10) = hp + amount。amount: は名前で渡すキーワード引数だよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "def heal(hp, amount: 10) = hp + amount\np [heal(50), heal(50, amount: 25)]",
      options: ["[60, 75]", "[50, 75]", "[60, 60]"],
      answer: 0,
      output: "[60, 75]",
      check: { compiles: true, stdout: "[60, 75]" },
      explain: L("Without amount: the default 10 is used. amount: 25 replaces it.", "Sin amount: se usa el valor por defecto 10. amount: 25 lo reemplaza.", "amount: なしならデフォルトの 10、amount: 25 で上書きだよ。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: "def heal(hp, amount: 10) = hp + amount\nheal(1, power: 3)",
      options: [L("ArgumentError: unknown keyword", "ArgumentError: keyword desconocido", "ArgumentError：不明なキーワード"), "11", "4"],
      answer: 0,
      check: { compiles: true, throws: "(ArgumentError)" },
      explain: L("unknown keyword: :power. Keyword names are checked, so typos are caught right away.", "unknown keyword: :power. Los nombres se revisan, así que los errores de tipeo se detectan al instante.", "unknown keyword: :power。キーワード名は検査されるので打ちまちがいもすぐ見つかるよ。"),
      win: [{ t: "shake" }],
    },
    say(L(
      "*nums collects any number of arguments into an array. **opts collects extra keywords into a hash.",
      "*nums junta cualquier cantidad de argumentos en un array. **opts junta keywords extra en un hash.",
      "*nums はいくつでも引数を配列に集める。**opts は余ったキーワードをハッシュに集めるよ。",
    )),
    {
      kind: "type",
      prompt: L("Accept any number of arguments", "Acepta cualquier cantidad de argumentos", "引数をいくつでも受け取る"),
      code: "def total(___nums) = nums.sum\np [total(1, 2, 3), total]",
      answer: "*",
      check: { compiles: true, stdout: "[6, 0]" },
      explain: L("*nums packs the arguments into an array: [1, 2, 3].sum is 6, and an empty call gives [] whose sum is 0.", "*nums empaca los argumentos en un array: [1, 2, 3].sum es 6, y sin argumentos da [] cuya suma es 0.", "*nums は引数を配列にまとめる。[1, 2, 3].sum は 6、引数なしは [] で合計 0 だよ。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "def opts(**kw) = kw\np opts(a: 1, b: 2)",
      options: ["{a: 1, b: 2}", "[:a, :b]", "[1, 2]"],
      answer: 0,
      output: "{a: 1, b: 2}",
      check: { compiles: true, stdout: "{a: 1, b: 2}" },
      explain: L("**kw gathers the keywords into a hash with symbol keys. Ruby 3.4 shows it as {a: 1, b: 2}.", "**kw reúne los keywords en un hash con claves símbolo. Ruby 3.4 lo muestra como {a: 1, b: 2}.", "**kw はキーワードをシンボルキーのハッシュに集める。Ruby 3.4 では {a: 1, b: 2} と表示。"),
    },
    say(L(
      "Name clues: a ? method answers yes/no (empty?). A ! method is the risky one that changes the object itself (sort!).",
      "Pistas en el nombre: un método con ? responde sí/no (empty?). Uno con ! es el riesgoso que cambia el objeto mismo (sort!).",
      "名前のヒント：? は真偽を答える（empty?）。! は物自体を変える要注意版（sort!）だよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "a = [3, 1, 2]\nb = a.sort\np [a, b]",
      options: ["[[3, 1, 2], [1, 2, 3]]", "[[1, 2, 3], [1, 2, 3]]", "[[3, 1, 2], [3, 1, 2]]"],
      answer: 0,
      output: "[[3, 1, 2], [1, 2, 3]]",
      check: { compiles: true, stdout: "[[3, 1, 2], [1, 2, 3]]" },
      explain: L("sort hands back a sorted copy and leaves a alone. a.sort! would sort a itself.", "sort devuelve una copia ordenada y deja a igual. a.sort! ordenaría a misma.", "sort は並べたコピーを返し a はそのまま。a.sort! なら a 自体を並べるよ。"),
      setup: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "a" }],
      win: [{ t: "clone", to: "ally" }, { t: "tag", actor: "ally", text: "b" }],
    },
    {
      kind: "predict",
      prompt: L("Nothing to change. Prints?", "Nada que cambiar. ¿Imprime?", "変える所なし。表示は？"),
      code: 't = "ABC"\np t.upcase!',
      options: ["nil", '"ABC"', "true"],
      answer: 0,
      output: "nil",
      check: { compiles: true, stdout: "nil" },
      explain: L("Many ! methods return nil when nothing changed. Don't chain them: t.upcase!.length could crash.", "Muchos métodos con ! devuelven nil si no cambió nada. No los encadenes: t.upcase!.length podría fallar.", "! のメソッドの多くは変化なしなら nil を返す。t.upcase!.length のようにつなぐと落ちるかも。"),
    },
    {
      kind: "predict",
      prompt: L("Return two values. Prints?", "Devuelve dos valores. ¿Imprime?", "2つの値を返す。表示は？"),
      code: "def pair = [1, 2]\na, b = pair\nputs a + b",
      options: ["3", "[1, 2]", "12"],
      answer: 0,
      output: "3",
      check: { compiles: true, stdout: "3" },
      explain: L("Returning several values is returning an array. a, b = ... unpacks it into two labels.", "Devolver varios valores es devolver un array. a, b = ... lo desempaca en dos etiquetas.", "複数の値を返す＝配列を返すこと。a, b = ... で2つのラベルに分けるよ。"),
    },
    {
      kind: "predict",
      prompt: L("Can the method see y? Prints?", "¿El método ve y? ¿Imprime?", "メソッドから y は見える？"),
      code: "y = 5\ndef peek = defined?(y)\np peek",
      options: ["nil", '"local-variable"', "5"],
      answer: 0,
      output: "nil",
      check: { compiles: true, stdout: "nil" },
      explain: L("def opens a fresh scope: local variables outside are invisible. Pass y as an argument instead.", "def abre un ámbito nuevo: las variables locales de afuera son invisibles. Pasa y como argumento.", "def は新しいスコープを作り、外のローカル変数は見えない。y は引数で渡そう。"),
    },
    {
      kind: "order",
      prompt: L("Build a method that prints 6", "Arma un método que imprima 6", "6 と表示するメソッドを作ろう"),
      lines: ["def double(n)", "  n * 2", "end", "puts double(3)"],
      check: { compiles: true, stdout: "6" },
      explain: L("def name(args), the body, end. Then call it: the last expression n * 2 is the answer.", "def nombre(args), el cuerpo, end. Luego llámalo: la última expresión n * 2 es la respuesta.", "def 名前(引数)、中身、end。そして呼ぶ。最後の式 n * 2 が答えだよ。"),
    },
    {
      kind: "run",
      prompt: L("Fix the method: it must print hp: 75", "Arregla el método: debe imprimir hp: 75", "メソッドを直して hp: 75 と表示"),
      starter: 'def heal(hp, amount = 10)\n  hp + amount\nend\nputs "hp: #{heal(50, amount: 25)}"\n',
      solution: 'def heal(hp, amount: 10)\n  hp + amount\nend\nputs "hp: #{heal(50, amount: 25)}"\n',
      expect: "hp: 75",
      fallback: [String.raw`def\s+heal\(\s*hp\s*,\s*amount:\s*10\s*\)`, String.raw`heal\(\s*50\s*,\s*25\s*\)`],
      explain: L("amount = 10 is positional, so amount: 25 arrives as a Hash: TypeError. Declare it as amount: 10.", "amount = 10 es posicional, así que amount: 25 llega como Hash: TypeError. Decláralo como amount: 10.", "amount = 10 は位置引数なので amount: 25 がハッシュで届き TypeError。amount: 10 と宣言しよう。"),
    },
  ],
};

// ─── Boss: the Nil Ghost's riddles ─────────────────────────────────────────
const villageBoss: LessonDef = {
  slug: "village-boss",
  title: L("Boss: Nil Ghost", "Jefe: Fantasma Nil", "ボス：nil ゴースト"),
  concept: "objects",
  mode: "boss",
  xp: 180,
  enemy: "ruby/nil-ghost",
  enemyName: L("NIL GHOST KING", "REY FANTASMA NIL", "nil ゴースト王"),
  beats: [
    enemySays(L(
      "Wooo... I am NOTHING, yet I am an object. Answer my riddles or vanish into nil!",
      "Uuuh... Soy NADA, y aun así soy un objeto. ¡Responde mis acertijos o desaparece en nil!",
      "うぅぅ…我は「無」、それでもオブジェクトだ。なぞに答えねば nil に消えるぞ！",
    )),
    {
      kind: "predict", time: 12, prompt: HAPPENS, code: "nil + 1",
      options: [L("NoMethodError", "NoMethodError", "NoMethodError"), L("TypeError", "TypeError", "TypeError"), "1"],
      answer: 0,
      check: { compiles: true, throws: "(NoMethodError)" },
      explain: L("nil has no + method: undefined method '+' for nil. (5 + nil is a TypeError instead.)", "nil no tiene método +: undefined method '+' for nil. (5 + nil es un TypeError.)", "nil には + がない（undefined method '+' for nil）。5 + nil なら TypeError だよ。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT, code: 'a = b = "same"\nb << "!"\np a',
      options: ['"same!"', '"same"', "nil"],
      answer: 0, output: '"same!"',
      check: { compiles: true, stdout: '"same!"' },
      explain: L("a = b = \"same\" puts two labels on ONE string. << changes it, so a sees it too.", "a = b = \"same\" pone dos etiquetas en UN string. << lo cambia, así que a también lo ve.", "a = b = \"same\" は1つの文字列にラベル2枚。<< で変えると a にも見えるよ。"),
    },
    {
      kind: "predict", time: 12, prompt: PRINT, code: "p [10 / 4 * 4, -7 % 3]",
      options: ["[8, 2]", "[10, -1]", "[10.0, 2]"],
      answer: 0, output: "[8, 2]",
      check: { compiles: true, stdout: "[8, 2]" },
      explain: L("10 / 4 is 2 (Integer), times 4 is 8. -7 % 3 is 2: the remainder takes the sign of the divisor.", "10 / 4 es 2 (Integer), por 4 es 8. -7 % 3 es 2: el resto toma el signo del divisor.", "10 / 4 は 2（整数）で ×4 は 8。-7 % 3 は 2、あまりは割る数の符号になるよ。"),
    },
    {
      kind: "predict", time: 12, prompt: HAPPENS, code: 'puts "5" * "5"',
      options: [L("TypeError: it crashes", "TypeError: se cae", "TypeError で落ちる"), "25", "55555"],
      answer: 0,
      check: { compiles: true, throws: "(TypeError)" },
      explain: L("String * needs an Integer count: no implicit conversion of String into Integer.", "String * necesita un Integer: no implicit conversion of String into Integer.", "String * には整数の回数が必要（no implicit conversion of String into Integer）。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT, code: "p [defined?(foo), defined?(puts), defined?(String)]",
      options: ['[nil, "method", "constant"]', '[false, true, true]', '["nil", "method", "class"]'],
      answer: 0, output: '[nil, "method", "constant"]',
      check: { compiles: true, stdout: '[nil, "method", "constant"]' },
      explain: L("defined? never crashes: it returns nil for unknown names, or a word describing what the name is.", "defined? nunca falla: devuelve nil si el nombre no existe, o una palabra que describe qué es.", "defined? は落ちない。知らない名前なら nil、あれば種類を表す文字列を返すよ。"),
    },
    {
      kind: "predict", time: 12, prompt: PRINT, code: 'v = ""\nputs(v ? "truthy" : "falsy")',
      options: ["truthy", "falsy"],
      answer: 0, output: "truthy",
      check: { compiles: true, stdout: "truthy" },
      explain: L("Only nil and false are falsy. An empty string is a real object, so it's truthy.", "Solo nil y false son falsos. Un string vacío es un objeto real, así que es verdadero.", "偽は nil と false だけ。空文字列もちゃんとした物なので真だよ。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT, code: "ok = nil or true\np ok",
      options: ["nil", "true", "false"],
      answer: 0, output: "nil",
      check: { compiles: true, stdout: "nil" },
      explain: L("or binds looser than =: (ok = nil) or true. ok stays nil.", "or se une más débil que =: (ok = nil) or true. ok queda en nil.", "or は = より弱い：(ok = nil) or true。ok は nil のままだよ。"),
    },
    {
      kind: "predict", time: 12, prompt: PRINT, code: 's = "abc"\np s.upcase!\np s.upcase!',
      options: ['"ABC"\nnil', '"ABC"\n"ABC"', 'nil\nnil'],
      answer: 0, output: '"ABC"\nnil',
      check: { compiles: true, stdout: '"ABC"\nnil' },
      explain: L("The first upcase! changes s and returns it. The second finds nothing to change and returns nil.", "El primer upcase! cambia s y la devuelve. El segundo no encuentra nada que cambiar y devuelve nil.", "1回目の upcase! は s を変えて返す。2回目は変える所がなく nil を返すよ。"),
    },
    {
      kind: "pick", time: 15, prompt: L("Make level required by name", "Haz level obligatorio por nombre", "level を名前つき必須に"),
      code: 'def spawn(___) = "lv #{level}"\nputs spawn(level: 3)',
      options: ["level:", "level = 1", "*level"],
      answer: 0,
      check: { compiles: true, stdout: "lv 3" },
      explain: L("level: with no default is a required keyword. The others are positional and reject level: 3.", "level: sin valor por defecto es un keyword obligatorio. Los otros son posicionales y no aceptan level: 3.", "デフォルトなしの level: は必須キーワード。他は位置引数で level: 3 を受けられない。"),
    },
    {
      kind: "type", time: 15, prompt: L("Set x only if it is nil", "Asigna x solo si es nil", "nil の時だけ x に代入"),
      code: "x = nil\nx ___ 9\nputs x",
      answer: "||=",
      check: { compiles: true, stdout: "9" },
      explain: L("x ||= 9 assigns only when x is nil or false.", "x ||= 9 asigna solo cuando x es nil o false.", "x ||= 9 は x が nil か false の時だけ代入するよ。"),
    },
    {
      kind: "run",
      prompt: L("Banish the ghost: it must print name: guest", "Expulsa al fantasma: debe imprimir name: guest", "幽霊退治：name: guest と表示させて"),
      starter: 'name = nil\nputs "name: " + name.upcase\n',
      solution: 'name = nil\nname ||= "guest"\nputs "name: #{name}"\n',
      expect: "name: guest",
      fallback: [String.raw`name\s*\|\|=\s*"guest"`, String.raw`name\s*=\s*"guest"`, String.raw`\|\|\s*"guest"`],
      explain: L("Calling upcase on nil crashes. Give name a default with name ||= \"guest\" and print it.", "Llamar upcase sobre nil falla. Dale a name un valor por defecto con name ||= \"guest\" e imprímelo.", "nil に upcase を呼ぶと落ちる。name ||= \"guest\" でデフォルトを入れて表示しよう。"),
    },
    enemySays(L(
      "Nooo... you saw through nothing itself! The Enumerable Forest awaits beyond the village.",
      "Nooo... ¡viste a través de la nada misma! El Bosque Enumerable te espera más allá de la aldea.",
      "なんと…「無」すら見破ったか！村の先には Enumerable の森が待っているぞ。",
    )),
  ],
};

export const objectVillage: RegionDef = {
  slug: "object-village",
  name: L("Object Village", "Aldea de Objetos", "オブジェクト村"),
  subtitle: L("Everything is an object", "Todo es un objeto", "すべてはオブジェクト"),
  theme: "village",
  lessons: [helloObjects, stringsAndNumbers, truthAndBranches, methodsAndArguments, villageBoss],
};
