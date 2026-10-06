import type { LessonDef, RegionDef } from "../../../lib/content/types.ts";
import { L, enemySays, say } from "../helpers.ts";

// REGION 1 · LET VILLAGE  (variables, mut, types, shadowing)

const YES = L("Yes", "Sí", "はい");
const NO = L("No", "No", "いいえ");

const letBasics: LessonDef = {
  slug: "hello-let",
  title: L("Hello, let!", "¡Hola, let!", "こんにちは、let！"),
  concept: "let",
  mode: "lesson",
  xp: 40,
  enemy: "rust/mite",
  enemyName: L("SYNTAX BUG", "BUG SINTAXIS", "構文バグ"),
  beats: [
    say(L(
      "Hey, apprentice! I'm Ferro, code sensei. In this kingdom, code IS magic.",
      "¡Eh, aprendiz! Soy Ferro, sensei del código. En este reino el código ES magia.",
      "やあ、弟子よ！わしはコードの先生、フェロじゃ。この王国ではコードこそが魔法なのじゃ。",
    )),
    say(L(
      "Every right answer hits the BUG. Defeat it by learning!",
      "Cada respuesta correcta golpea al BUG. ¡Derrótalo aprendiendo!",
      "正解するたびにバグにダメージ！学んでやっつけよう！",
    )),
    {
      kind: "act",
      prompt: L(
        "Press the buttons. Watch each line control the world.",
        "Pulsa los botones. Mira cómo cada línea controla el mundo.",
        "ボタンを押そう。一行ごとに世界が動くよ。",
      ),
      steps: [
        { label: L("SPEAK", "HABLAR", "話す"), line: 'println!("Hello!");', effects: [{ t: "say", actor: "hero", text: L("Hello!", "¡Hola!", "こんにちは！") }], output: "Hello!" },
        { label: L("CREATE HP", "CREAR VIDA", "HPを作る"), line: "let hp = 3;", effects: [{ t: "tag", actor: "hero", text: "hp", value: "3" }, { t: "hp", actor: "hero", value: 3 }] },
        { label: L("SHOW HP", "MOSTRAR VIDA", "HPを表示"), line: 'println!("{}", hp);', effects: [{ t: "say", actor: "hero", text: L("I have 3!", "¡Tengo 3!", "3あるよ！") }], output: "3" },
      ],
    },
    say(L(
      "let creates a VARIABLE: a named label stuck to a value. hp → 3.",
      "let crea una VARIABLE: una etiqueta con nombre pegada a un valor. hp → 3.",
      "let は変数を作る。値に貼る名前つきのラベルじゃ。hp → 3。",
    )),
    {
      kind: "pick",
      prompt: L("Give the hero 5 HP", "Dale 5 de vida al héroe", "ヒーローにHP5をあげよう"),
      code: "___ hp = 5;",
      options: ["let", "var", "set", "int"],
      answer: 0,
      check: { compiles: true, wrongFail: true },
      explain: L(
        "In Rust, variables are born with let. var and int come from other languages.",
        "En Rust las variables nacen con let. var e int son de otros lenguajes.",
        "Rustの変数は let で作る。var や int は他の言語のものじゃ。",
      ),
      setup: [{ t: "untag", actor: "hero" }],
      win: [{ t: "tag", actor: "hero", text: "hp", value: "5" }, { t: "hp", actor: "hero", value: 5 }],
    },
    {
      kind: "pick",
      prompt: L("Show the hero's gold", "Muestra el oro del héroe", "ヒーローのゴールドを表示"),
      code: 'let gold = 10;\nprintln!("{}", ___);',
      options: ["gold", '"gold"', "$gold", "10gold"],
      answer: 0,
      check: { compiles: true, stdout: "10" },
      explain: L(
        '"gold" in quotes compiles, but prints the text gold, not 10. Without quotes you use the variable.',
        '"gold" con comillas compila, pero imprime el texto gold, no el 10. Sin comillas usas la variable.',
        '"gold" はコンパイルできるが、10ではなく文字 gold を表示する。引用符なしなら変数を使えるぞ。',
      ),
      setup: [{ t: "tag", actor: "hero", text: "gold", value: "10" }],
      win: [{ t: "print", text: "10" }, { t: "say", actor: "hero", text: L("10 gold!", "¡10 de oro!", "10ゴールド！") }],
    },
    {
      kind: "predict",
      prompt: L("What does it print?", "¿Qué imprime?", "何が表示される？"),
      code: 'let x = 7;\nprintln!("x is {}", x);',
      options: ["x is 7", "x is {}", "x is x", L("Error", "Error", "エラー")],
      answer: 0,
      output: "x is 7",
      check: { compiles: true, stdout: "x is 7" },
      explain: L(
        "{} is a slot that gets filled with the value of x.",
        "{} es un hueco que se rellena con el valor de x.",
        "{} は x の値で埋まる穴じゃ。",
      ),
    },
    say(L(
      "Every statement ends with a semicolon ;  It seals the spell!",
      "Cada instrucción termina en punto y coma ;  ¡Es el cierre del hechizo!",
      "命令の最後にはセミコロン ; をつける。呪文の締めくくりじゃ！",
    )),
    {
      kind: "type",
      prompt: L("Type the word that creates variables", "Escribe la palabra que crea variables", "変数を作る言葉を書こう"),
      code: "___ shield = 2;",
      answer: "let",
      check: { compiles: true },
      explain: L("let + name + = + value + ;", "let + nombre + = + valor + ;", "let + 名前 + = + 値 + ;"),
      win: [{ t: "item", kind: "shield", holder: "hero" }, { t: "tag", actor: "hero", text: "shield", value: "2" }],
    },
    {
      kind: "order",
      prompt: L(
        "Build the program: everything starts in fn main()",
        "Arma el programa: todo empieza en fn main()",
        "プログラムを組もう：始まりは fn main()",
      ),
      lines: ["fn main() {", "    let level = 1;", '    println!("{}", level);', "}"],
      explain: L(
        "First open main, then create the variable, use it and close the brace.",
        "Primero abres main, luego creas la variable, la usas y cierras la llave.",
        "まず main を開き、変数を作って使い、最後に波かっこを閉じる。",
      ),
      win: [{ t: "print", text: "1" }],
    },
    {
      kind: "run",
      prompt: L(
        "Your first REAL program! Make it print: Hello, Rust",
        "¡Tu primer programa REAL! Haz que imprima: Hello, Rust",
        "初めての本物のプログラム！Hello, Rust と表示させよう",
      ),
      starter: 'fn main() {\n    println!("write here");\n}\n',
      expect: "Hello, Rust",
      solution: 'fn main() {\n    println!("Hello, Rust");\n}\n',
      fallback: [
        String.raw`print(ln)?!\s*\(\s*"Hello, Rust(\\n)?"\s*\)`,
        String.raw`print(ln)?!\s*\(\s*"Hello, \{\}"\s*,\s*"Rust"\s*\)`,
        String.raw`print(ln)?!\s*\(\s*"\{\}"\s*,\s*"Hello, Rust"\s*\)`,
      ],
      explain: L(
        "Replace the text inside the quotes with Hello, Rust",
        "Cambia el texto entre comillas por Hello, Rust",
        "引用符の中の文字を Hello, Rust に変えよう",
      ),
      win: [{ t: "say", actor: "hero", text: L("Hello, Rust!", "¡Hola, Rust!", "やあ、Rust！") }],
    },
  ],
};

const mutLesson: LessonDef = {
  slug: "mut-change",
  title: L("mut: change", "mut: cambiar", "mut：変える"),
  concept: "mut",
  mode: "lesson",
  xp: 50,
  enemy: "rust/mite",
  enemyName: L("FROZEN BUG", "BUG CONGELADO", "凍ったバグ"),
  beats: [
    say(L(
      "In Rust, variables are IMMUTABLE by default. Once created... they don't change!",
      "En Rust las variables son INMUTABLES por defecto. Una vez creadas... ¡no cambian!",
      "Rustの変数は最初から不変じゃ。一度作ったら…変わらない！",
    )),
    {
      kind: "act",
      prompt: L("Try to heal the hero", "Intenta curar al héroe", "ヒーローを回復してみよう"),
      steps: [
        { label: L("CREATE HP", "CREAR VIDA", "HPを作る"), line: "let hp = 3;", effects: [{ t: "tag", actor: "hero", text: "hp", value: "3" }, { t: "hp", actor: "hero", value: 3 }] },
        {
          label: L("HEAL", "CURAR", "回復"),
          line: "hp = 5;",
          effects: [{ t: "shake" }, { t: "say", actor: "hero", text: L("Huh!?", "¿¡Eh!?", "えっ！？") }],
          error: {
            compiler: "error[E0384]: cannot assign twice to immutable variable `hp`",
            plain: L("hp is not mutable: it can't change.", "hp no es mutable: no puede cambiar.", "hp は可変じゃないので変えられない。"),
          },
        },
      ],
    },
    say(L(
      "To let it change, add mut when you create it. mut = mutable.",
      "Para que pueda cambiar, añade mut al crearla. mut = mutable.",
      "変えたいなら、作るときに mut をつける。mut = 可変じゃ。",
    )),
    {
      kind: "act",
      prompt: L("Now with mut", "Ahora con mut", "今度は mut つき"),
      setup: [{ t: "untag", actor: "hero" }],
      steps: [
        { label: L("CREATE HP", "CREAR VIDA", "HPを作る"), line: "let mut hp = 3;", effects: [{ t: "tag", actor: "hero", text: "mut hp", value: "3" }, { t: "hp", actor: "hero", value: 3 }] },
        { label: L("HEAL", "CURAR", "回復"), line: "hp = 5;", effects: [{ t: "hp", actor: "hero", value: 5 }, { t: "value", actor: "hero", text: "5" }, { t: "banner", text: L("HEALED!", "¡CURADO!", "回復した！") }] },
      ],
    },
    {
      kind: "pick",
      prompt: L("The bug attacks. Let the HP go down", "El bug ataca. Haz que la vida pueda bajar", "バグの攻撃！HPが減れるようにしよう"),
      code: "let ___ hp = 5;\nhp = hp - 1;",
      options: ["mut", "var", "const", "&"],
      answer: 0,
      check: { compiles: true, wrongFail: true },
      explain: L("Without mut, the second line doesn't compile.", "Sin mut, la segunda línea no compila.", "mut がないと2行目はコンパイルできない。"),
      setup: [{ t: "tag", actor: "hero", text: "hp", value: "5" }, { t: "hp", actor: "hero", value: 5 }],
      win: [{ t: "attack", from: "enemy", to: "hero" }, { t: "hp", actor: "hero", value: 4 }, { t: "value", actor: "hero", text: "4" }],
    },
    {
      kind: "predict",
      prompt: L("Does it compile?", "¿Compila?", "コンパイルできる？"),
      code: "let gold = 10;\ngold = 20;",
      options: [
        L("Yes: gold is 20", "Sí: gold vale 20", "はい：gold は20"),
        L("No: gold isn't mut", "No: gold no es mut", "いいえ：gold は mut でない"),
        L("Yes: gold is 10", "Sí: gold vale 10", "はい：gold は10"),
        L("No: missing type", "No: falta tipo", "いいえ：型がない"),
      ],
      answer: 1,
      check: { compiles: false },
      explain: L(
        "error[E0384]: gold is immutable. It needs let mut gold.",
        "error[E0384]: gold es inmutable. Necesita let mut gold.",
        "error[E0384]: gold は不変じゃ。let mut gold にしよう。",
      ),
    },
    {
      kind: "predict",
      prompt: L("What does it print?", "¿Qué imprime?", "何が表示される？"),
      code: 'let mut c = 1;\nc = c + 1;\nc = c * 10;\nprintln!("{}", c);',
      options: ["1", "2", "20", "11"],
      answer: 2,
      output: "20",
      check: { compiles: true, stdout: "20" },
      explain: L("1 → 2 → 20. Each line updates c.", "1 → 2 → 20. Cada línea actualiza c.", "1 → 2 → 20。各行が c を更新する。"),
    },
    {
      kind: "type",
      prompt: L("Make the combo counter mutable", "Haz mutable el contador de combo", "コンボカウンターを可変にしよう"),
      code: "let ___ combo = 0;",
      answer: "mut",
      check: { compiles: true },
      explain: L("let mut name = value;", "let mut nombre = valor;", "let mut 名前 = 値;"),
    },
    {
      kind: "pick",
      prompt: L("Add 3 to a hit's damage", "Suma 3 al daño de un golpe", "攻撃のダメージに3を足そう"),
      code: "let mut dmg = 0;\ndmg ___ 3;",
      options: ["+=", "=+", "++", "=="],
      answer: 0,
      check: { compiles: true },
      explain: L(
        "+= adds and assigns. Rust has no ++, and == only compares: it compiles, but dmg stays 0.",
        "+= suma y asigna. Rust no tiene ++, y == solo compara: compila, pero dmg sigue en 0.",
        "+= は足して代入する。Rustに ++ はない。== は比較だけでコンパイルはできるが、dmg は0のままじゃ。",
      ),
      win: [{ t: "banner", text: L("DMG +3", "DAÑO +3", "ダメージ+3") }],
    },
    say(L(
      "Immutable by default protects you from accidental changes. Use mut only when you NEED it.",
      "Inmutable por defecto te protege de cambios accidentales. Usa mut solo cuando LO NECESITES.",
      "最初から不変なのは、うっかり変更を防ぐため。mut は本当に必要なときだけ使おう。",
    )),
    {
      kind: "run",
      prompt: L(
        "This code doesn't compile. Fix it so it prints 3",
        "Este código no compila. Arréglalo para que imprima 3",
        "このコードはコンパイルできない。3と表示されるよう直そう",
      ),
      starter: 'fn main() {\n    let counter = 0;\n    counter += 1;\n    counter += 1;\n    counter += 1;\n    println!("{}", counter);\n}\n',
      expect: "3",
      solution: 'fn main() {\n    let mut counter = 0;\n    counter += 1;\n    counter += 1;\n    counter += 1;\n    println!("{}", counter);\n}\n',
      fallback: [
        String.raw`let\s+mut\s+counter\b`,
        String.raw`let\s+counter\s*=\s*counter\s*\+\s*1\s*;`,
      ],
      explain: L(
        "counter must be mut so you can add to it.",
        "counter necesita ser mut para poder sumarle.",
        "counter に足すには mut が必要じゃ。",
      ),
    },
  ],
};

const typesLesson: LessonDef = {
  slug: "types-and-shadows",
  title: L("Types and shadows", "Tipos y sombras", "型とシャドーイング"),
  concept: "types",
  mode: "lesson",
  xp: 50,
  enemy: "rust/dangler",
  enemyName: L("GHOST BUG", "BUG FANTASMA", "おばけバグ"),
  beats: [
    say(L(
      "Every value has a TYPE. i32 = integer · f64 = decimal · bool = yes/no · &str = text.",
      "Cada valor tiene un TIPO. i32 = entero · f64 = decimal · bool = sí/no · &str = texto.",
      "値にはすべて型がある。i32 = 整数・f64 = 小数・bool = はい/いいえ・&str = 文字列。",
    )),
    {
      kind: "act",
      prompt: L("Create the hero with explicit types", "Crea al héroe con tipos explícitos", "型を明示してヒーローを作ろう"),
      steps: [
        { label: L("HP", "VIDA", "HP"), line: "let hp: i32 = 3;", effects: [{ t: "tag", actor: "hero", text: "hp: i32", value: "3" }] },
        { label: L("SPEED", "VELOCIDAD", "スピード"), line: "let speed: f64 = 1.5;", effects: [{ t: "tag", actor: "hero", text: "speed: f64", value: "1.5" }, { t: "say", actor: "hero", text: L("Zoom!", "¡Zum!", "ビュン！") }] },
        { label: L("ALIVE", "VIVO", "生きてる"), line: "let alive: bool = true;", effects: [{ t: "tag", actor: "hero", text: "alive: bool", value: "true" }] },
        { label: L("NAME", "NOMBRE", "名前"), line: 'let name: &str = "Ferris";', effects: [{ t: "tag", actor: "hero", text: "name: &str", value: '"Ferris"' }, { t: "say", actor: "hero", text: L("I'm Ferris!", "¡Soy Ferris!", "フェリスだよ！") }] },
      ],
    },
    {
      kind: "pick",
      prompt: L("Pick the type for 42 coins", "Elige el tipo para 42 monedas", "コイン42枚の型を選ぼう"),
      code: "let coins: ___ = 42;",
      options: ["i32", "f64", "bool", "&str"],
      answer: 0,
      check: { compiles: true, wrongFail: true },
      explain: L("42 is an integer: i32.", "42 es un entero: i32.", "42 は整数なので i32。"),
      win: [{ t: "tag", actor: "hero", text: "coins", value: "42" }],
    },
    {
      kind: "pick",
      prompt: L("Pick the type for 3.14", "Elige el tipo para 3.14", "3.14 の型を選ぼう"),
      code: "let pi: ___ = 3.14;",
      options: ["i32", "f64", "bool", "char"],
      answer: 1,
      check: { compiles: true, wrongFail: true },
      explain: L("With a decimal point it's f64.", "Con punto decimal es f64.", "小数点があれば f64。"),
    },
    {
      kind: "predict",
      prompt: L("Does it compile?", "¿Compila?", "コンパイルできる？"),
      code: 'let x: i32 = "hello";',
      options: [YES, L('No: "hello" isn\'t i32', 'No: "hello" no es i32', 'いいえ："hello" は i32 でない')],
      answer: 1,
      check: { compiles: false },
      explain: L(
        "error[E0308]: mismatched types. The type and the value must match.",
        "error[E0308]: mismatched types. El tipo y el valor deben coincidir.",
        "error[E0308]: mismatched types。型と値は一致しないといけない。",
      ),
    },
    say(L(
      "Ninja trick: SHADOWING. Repeat let with the same name and you create a NEW variable that hides the old one.",
      "Truco ninja: SHADOWING. Repite let con el mismo nombre y creas una variable NUEVA que tapa a la anterior.",
      "忍者の技、シャドーイング！同じ名前で let を繰り返すと、前のを隠す新しい変数ができる。",
    )),
    {
      kind: "act",
      prompt: L("Double the power with shadowing", "Duplica el poder con shadowing", "シャドーイングでパワーを2倍に"),
      setup: [{ t: "untag", actor: "hero" }],
      steps: [
        { label: L("POWER", "PODER", "パワー"), line: "let power = 5;", effects: [{ t: "tag", actor: "hero", text: "power", value: "5" }] },
        { label: L("SHADOW x2", "SOMBRA x2", "影 x2"), line: "let power = power * 2;", effects: [{ t: "value", actor: "hero", text: "10" }, { t: "banner", text: L("SHADOW!", "¡SOMBRA!", "シャドー！") }] },
        { label: L("SHOW", "MOSTRAR", "表示"), line: 'println!("{}", power);', output: "10" },
      ],
    },
    {
      kind: "predict",
      prompt: L("What does it print?", "¿Qué imprime?", "何が表示される？"),
      code: 'let x = 5;\nlet x = x + 1;\nlet x = x * 2;\nprintln!("{}", x);',
      options: ["5", "6", "12", "11"],
      answer: 2,
      output: "12",
      check: { compiles: true, stdout: "12" },
      explain: L("5 → 6 → 12. Each let creates a new x.", "5 → 6 → 12. Cada let crea una x nueva.", "5 → 6 → 12。let のたびに新しい x ができる。"),
    },
    {
      kind: "predict",
      prompt: L("Shadowing can change the type. Does it compile?", "Shadowing puede cambiar el tipo. ¿Compila?", "シャドーイングは型も変えられる。コンパイルできる？"),
      code: 'let spaces = "   ";\nlet spaces = spaces.len();',
      options: [
        L("Yes: it's a new variable", "Sí: es una variable nueva", "はい：新しい変数だから"),
        L("No: the type changes", "No: cambia de tipo", "いいえ：型が変わるから"),
      ],
      answer: 0,
      check: { compiles: true },
      explain: L(
        "let creates another variable, so it can have another type. With mut you couldn't.",
        "Con let creas otra variable, así que puede tener otro tipo. Con mut no podrías.",
        "let で別の変数を作るので、型が違ってもいい。mut ではできないぞ。",
      ),
    },
    {
      kind: "type",
      prompt: L("Type the boolean type", "Escribe el tipo booleano", "真偽値の型を書こう"),
      code: "let ready: ___ = false;",
      answer: "bool",
      check: { compiles: true },
      explain: L("true and false are of type bool.", "true y false son de tipo bool.", "true と false は bool 型じゃ。"),
    },
    {
      kind: "run",
      prompt: L(
        "Use shadowing so it prints: Level 2",
        "Usa shadowing para que imprima: Level 2",
        "シャドーイングで Level 2 と表示させよう",
      ),
      starter: 'fn main() {\n    let level = 1;\n    // use shadowing here\n    println!("Level {}", level);\n}\n',
      expect: "Level 2",
      solution: 'fn main() {\n    let level = 1;\n    let level = level + 1;\n    println!("Level {}", level);\n}\n',
      fallback: [
        String.raw`let\s+level\s*(:\s*\w+\s*)?=\s*(level\s*\+\s*1|1\s*\+\s*level|level\s*\*\s*2|2\s*\*\s*level|level\s*\+\s*level)\s*;`,
        String.raw`let\s+level\s*(:\s*\w+\s*)?=\s*2\s*;`,
      ],
      explain: L("Add: let level = level + 1;", "Añade: let level = level + 1;", "追加しよう：let level = level + 1;"),
    },
  ],
};

const boss1: LessonDef = {
  slug: "boss-golem",
  title: L("BOSS: Immutable Golem", "JEFE: Golem Inmutable", "ボス：不変ゴーレム"),
  concept: "let",
  mode: "boss",
  xp: 120,
  enemy: "rust/cog-golem",
  enemyName: L("IMMUTABLE GOLEM", "GOLEM INMUTABLE", "不変ゴーレム"),
  beats: [
    enemySays(L(
      "GRRR! In my village NOTHING changes. Show me what you know!",
      "¡GRRR! En mi aldea NADA cambia. ¡Demuestra lo que sabes!",
      "グルル！わしの村では何も変わらん。実力を見せてみろ！",
    )),
    { kind: "pick", time: 12, prompt: L("Quick! Create the variable", "¡Rápido! Crea la variable", "急げ！変数を作れ"), code: "___ x = 1;", options: ["let", "var", "new"], answer: 0, check: { compiles: true, wrongFail: true }, explain: L("let creates variables.", "let crea variables.", "let が変数を作る。") },
    { kind: "predict", time: 12, prompt: L("Does it compile?", "¿Compila?", "コンパイルできる？"), code: "let a = 1;\na = 2;", options: [YES, NO], answer: 1, check: { compiles: false }, explain: L("a isn't mut.", "a no es mut.", "a は mut じゃない。") },
    { kind: "type", time: 12, prompt: L("Make it mutable", "Hazla mutable", "可変にしよう"), code: "let ___ hp = 9;", answer: "mut", check: { compiles: true }, explain: L("let mut", "let mut", "let mut") },
    { kind: "predict", time: 12, prompt: L("What does it print?", "¿Qué imprime?", "何が表示される？"), code: 'let n = 2;\nlet n = n * n;\nprintln!("{}", n);', options: ["2", "4", L("Error", "Error", "エラー")], answer: 1, output: "4", check: { compiles: true, stdout: "4" }, explain: L("Shadowing: new n = 4.", "Shadowing: n nueva = 4.", "シャドーイング：新しい n = 4。") },
    { kind: "pick", time: 12, prompt: L("Type for 0.5", "Tipo para 0.5", "0.5 の型"), code: "let p: ___ = 0.5;", options: ["i32", "f64", "bool"], answer: 1, check: { compiles: true, wrongFail: true }, explain: L("Decimal → f64.", "Decimal → f64.", "小数 → f64。") },
    { kind: "pick", time: 12, prompt: L("Add 10", "Suma 10", "10を足せ"), code: "let mut gold = 0;\ngold ___ 10;", options: ["+=", "++", "=+"], answer: 0, check: { compiles: true, wrongFail: true }, explain: L("+=", "+=", "+=") },
    { kind: "predict", time: 12, prompt: L("Does it compile?", "¿Compila?", "コンパイルできる？"), code: "let v: bool = 1;", options: [YES, NO], answer: 1, check: { compiles: false }, explain: L("1 is i32, not bool.", "1 es i32, no bool.", "1 は i32 で、bool ではない。") },
    { kind: "type", time: 15, prompt: L("Type of borrowed text", "Tipo de texto prestado", "借用した文字列の型"), code: 'let s: ___ = "hello";', answer: "&str", check: { compiles: true }, explain: L("Text literals are &str.", "Los literales de texto son &str.", "文字列リテラルは &str じゃ。") },
    enemySays(L(
      "Impossible...! My rock... is... crumbling...",
      "¡Imposible...! Mi roca... se... desmorona...",
      "ばかな…！わしの岩が…崩れて…いく…",
    )),
  ],
};

export const letVillage: RegionDef = {
  slug: "let-village",
  name: L("Let Village", "Aldea Let", "レットの村"),
  subtitle: L("Variables · mut · types", "Variables · mut · tipos", "変数・mut・型"),
  theme: "village",
  lessons: [letBasics, mutLesson, typesLesson, boss1],
};
