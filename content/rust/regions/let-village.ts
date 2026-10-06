import type { LessonDef, NoteBlock, NoteDef, RegionDef, Text } from "../../../lib/content/types.ts";
import { L, enemySays, say } from "../helpers.ts";

// REGION 1 · LET VILLAGE  (variables, mut, types, shadowing)

const YES = L("Yes", "Sí", "はい");
const NO = L("No", "No", "いいえ");

// Codex notes: long explanations players can reopen from any question (📖).
// Examples use names and values different from the questions so they never give an answer away.
const note = (id: string, title: Text, ...blocks: NoteBlock[]): NoteDef => ({ id, title, blocks });
const p = (en: string, es: string, ja: string): NoteBlock => ({ t: "p", text: L(en, es, ja) });
/** A runnable example; the validator checks `output` against the real compiler. */
const ex = (code: string, output: string, caption?: Text): NoteBlock => ({ t: "code", code, output, caption });
/** An example that must NOT compile (verified too). */
const bad = (code: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { compiles: false } });

const letBasicsNotes: NoteDef[] = [
  note("let-variables", L("Creating variables with let", "Crear variables con let", "let で変数を作る"),
    p(
      "A variable is a name stuck to a value, like a label on a box. In Rust you create one with the keyword let, followed by the name, an equals sign, the value and a semicolon: let name = value; From then on, writing the name means \"the value inside\".",
      "Una variable es un nombre pegado a un valor, como la etiqueta de una caja. En Rust se crea con la palabra clave let, seguida del nombre, un signo igual, el valor y un punto y coma: let nombre = valor; Desde ahí, escribir el nombre significa \"el valor que guarda\".",
      "変数とは、値に貼った名前のラベルのようなもの。Rustでは let というキーワードで作る。let のあとに名前、=、値、そしてセミコロンを書く：let 名前 = 値; それ以降、名前を書けば「中の値」という意味になる。",
    ),
    ex('let lives = 3;\nlet stars = 12;\nprintln!("{} {}", lives, stars);', "3 12",
      L("Two variables, each with its own name and value", "Dos variables, cada una con su nombre y valor", "名前と値をもつ2つの変数")),
    p(
      "Why let? Each language picks its own words: JavaScript uses var or let, C uses int, Python uses no keyword at all. Rust always uses let, so var or int in Rust code is rejected by the compiler. The = here doesn't mean \"equals\" as in math: it means \"store this value under this name\".",
      "¿Por qué let? Cada lenguaje elige sus palabras: JavaScript usa var o let, C usa int y Python no usa ninguna. Rust siempre usa let, así que el compilador rechaza var o int en código Rust. Aquí el = no significa \"es igual\" como en matemáticas: significa \"guarda este valor con este nombre\".",
      "なぜ let なのか？言語ごとに使う言葉が違う。JavaScriptは var や let、Cは int、Pythonは何も書かない。Rustでは必ず let。var や int を書くとコンパイラに拒否される。ここの = は数学の「等しい」ではなく「この名前でこの値をしまう」という意味じゃ。",
    ),
    p(
      "Names follow simple rules: letters, digits and underscores, but they can't start with a digit or contain spaces. Rust style is snake_case: all lowercase, with underscores between words, like max_speed. Pick names that say what the value means; hp is clearer than h.",
      "Los nombres siguen reglas simples: letras, dígitos y guiones bajos, pero no pueden empezar con un dígito ni tener espacios. El estilo de Rust es snake_case: todo en minúsculas y con guiones bajos entre palabras, como max_speed. Elige nombres que digan qué significa el valor; hp es más claro que h.",
      "名前のルールはかんたん。英字・数字・アンダースコアが使えるが、数字で始めたり空白を入れたりはできない。Rustの書き方は snake_case：全部小文字で、単語の間を _ でつなぐ（例：max_speed）。値の意味がわかる名前にしよう。h より hp のほうがわかりやすい。",
    ),
    bad("let 2nd_place = 5;",
      L("Does not compile: a name can't start with a digit", "No compila: un nombre no puede empezar con un dígito", "コンパイル不可：名前は数字で始められない")),
    p(
      "Common mistake: forgetting the semicolon. Every let statement ends with ; and without it the compiler stops with \"expected `;`\". Read a let line as a sentence: let (create) lives (named lives) = 3 (holding 3) ; (done).",
      "Error común: olvidar el punto y coma. Toda instrucción let termina en ; y sin él el compilador se detiene con \"expected `;`\". Lee una línea let como una frase: let (crea) lives (llamada lives) = 3 (que guarda 3) ; (listo).",
      "よくあるミス：セミコロンを忘れること。let の文は必ず ; で終わり、ないとコンパイラが \"expected `;`\" と言って止まる。let の行は文として読もう：let（作る）lives（lives という名前で）= 3（3を入れて）;（おしまい）。",
    ),
  ),
  note("println-slots", L("Printing with println! and {}", "Imprimir con println! y {}", "println! と {} で表示"),
    p(
      "println! prints a line of text on the screen. The text goes inside double quotes, and whatever is between the quotes is printed exactly as written. The ! means println! is a macro, a special kind of Rust command; just remember to always write it.",
      "println! imprime una línea de texto en la pantalla. El texto va entre comillas dobles, y lo que esté entre las comillas se imprime tal cual. El ! indica que println! es una macro, un tipo especial de comando de Rust; solo recuerda escribirlo siempre.",
      "println! は画面に1行の文字を表示する。文字は二重引用符 \" \" の中に書き、引用符の中身はそのまま表示される。! は println! がマクロ（Rustの特別な命令）であるしるし。いつも ! をつけると覚えよう。",
    ),
    ex('println!("Good morning");\nprintln!("See you soon");', "Good morning\nSee you soon",
      L("Each println! prints one line, exactly as written", "Cada println! imprime una línea, tal cual", "println! 1つで1行、書いたとおりに表示")),
    p(
      "To print a variable's value, put {} in the text where the value should go, and add the variable after a comma. Each {} is a slot that is filled, in order, with the values after the text. Two slots need two values.",
      "Para imprimir el valor de una variable, pon {} en el texto donde debe ir el valor y añade la variable después de una coma. Cada {} es un hueco que se rellena, en orden, con los valores que siguen al texto. Dos huecos necesitan dos valores.",
      "変数の値を表示するには、値を入れたい場所に {} を書き、カンマのあとに変数を書く。{} は穴で、文字のあとに並べた値が順番に入る。穴が2つなら値も2つ必要じゃ。",
    ),
    ex('let speed = 4;\nlet laps = 2;\nprintln!("speed {} after {} laps", speed, laps);', "speed 4 after 2 laps"),
    p(
      "Quotes change everything. Without quotes, lives is a variable and Rust uses its value. With quotes, \"lives\" is just text: the five letters l-i-v-e-s. Both compile, so the compiler can't warn you; you only notice when the output shows a word instead of a number.",
      "Las comillas lo cambian todo. Sin comillas, lives es una variable y Rust usa su valor. Con comillas, \"lives\" es solo texto: las cinco letras l-i-v-e-s. Ambas compilan, así que el compilador no te avisa; solo lo notas cuando la salida muestra una palabra en vez de un número.",
      "引用符ですべてが変わる。引用符なしの lives は変数で、Rustはその値を使う。引用符つきの \"lives\" はただの文字、l-i-v-e-s の5文字じゃ。どちらもコンパイルできるので警告は出ない。数字ではなく単語が表示されて初めて気づく。",
    ),
    ex('let lives = 3;\nprintln!("{}", "lives");\nprintln!("{}", lives);', "lives\n3",
      L("The same name, with and without quotes", "El mismo nombre, con y sin comillas", "同じ名前、引用符ありとなし")),
    p(
      "Common mistakes: leaving a {} with no value after the comma (it does not compile: each slot needs a value), or adding symbols from other languages, like $lives; Rust variable names never start with $. Remember: the text says where the value goes, and the values after the comma say what goes there.",
      "Errores comunes: dejar un {} sin valor después de la coma (no compila: cada hueco necesita un valor) o añadir símbolos de otros lenguajes, como $lives; en Rust los nombres de variables nunca empiezan con $. Recuerda: el texto dice dónde va el valor, y los valores tras la coma dicen qué va ahí.",
      "よくあるミス：カンマのあとに値がない {} を残すこと（穴には値が必要なのでコンパイルできない）。他の言語のくせで $lives のように記号をつけること。Rustの変数名は $ で始まらない。文字は「どこに」、カンマのあとの値は「何を」入れるかを決めるのじゃ。",
    ),
    bad('let lives = 3;\nprintln!("{} and {}", lives);',
      L("Does not compile: two slots, only one value", "No compila: dos huecos y un solo valor", "コンパイル不可：穴が2つで値が1つ")),
  ),
  note("fn-main", L("Every program starts in fn main", "Todo programa empieza en fn main", "プログラムは fn main から"),
    p(
      "A Rust program needs a starting point, and that point is a function called main. fn means \"function\", main is its name, and the () after it hold its inputs (none here). When you run the program, Rust jumps into main and runs its lines from top to bottom.",
      "Un programa en Rust necesita un punto de partida, y ese punto es una función llamada main. fn significa \"función\", main es su nombre y los () guardan sus entradas (aquí ninguna). Al ejecutar el programa, Rust entra en main y ejecuta sus líneas de arriba abajo.",
      "Rustのプログラムには出発点が必要で、それが main という関数じゃ。fn は「関数」、main は名前、後ろの () は入力（ここではなし）を入れる場所。プログラムを動かすと、Rustは main に入り、上から下へ順に行を実行する。",
    ),
    p(
      "The body of main lives between curly braces { and }. The opening brace goes right after fn main(), and the closing brace is the very last line. Everything inside is indented with four spaces, so you can see at a glance what belongs to main.",
      "El cuerpo de main va entre llaves { y }. La llave de apertura va justo después de fn main(), y la de cierre es la última línea. Todo lo de dentro se indenta con cuatro espacios, para ver de un vistazo qué pertenece a main.",
      "main の中身は波かっこ { と } の間に書く。開きかっこは fn main() のすぐあと、閉じかっこは一番最後の行。中の行は4つの空白で字下げして、main に属するものがひと目でわかるようにする。",
    ),
    ex('fn main() {\n    println!("first");\n    println!("second");\n}', "first\nsecond",
      L("Lines inside main run from top to bottom", "Las líneas de main se ejecutan de arriba abajo", "main の中は上から下へ実行される")),
    p(
      "Order matters inside main. A variable must be created with let before any line uses it; if you use a name before its let, the compiler says it cannot find that value. It's like a recipe: you can't stir the soup before you pour it into the pot.",
      "El orden importa dentro de main. Una variable debe crearse con let antes de que alguna línea la use; si usas un nombre antes de su let, el compilador dice que no encuentra ese valor. Es como una receta: no puedes remover la sopa antes de echarla en la olla.",
      "main の中では順番が大事。変数は、使う行より前に let で作らないといけない。let より前に名前を使うと、コンパイラは「その値が見つからない」と言う。料理のレシピと同じで、鍋に入れる前にスープはかき混ぜられない。",
    ),
    bad('println!("{}", score);\nlet score = 9;',
      L("Does not compile: score is used before its let", "No compila: score se usa antes de su let", "コンパイル不可：let より前に score を使っている")),
    p(
      "In many questions you will see only a few lines without fn main. That's a shortcut: imagine them inside main. In the run exercises you write whole programs, so keep the fn main() { ... } shell and change only what's inside.",
      "En muchas preguntas verás solo unas líneas sin fn main. Es un atajo: imagínalas dentro de main. En los ejercicios de ejecutar escribes programas completos, así que conserva la envoltura fn main() { ... } y cambia solo lo de dentro.",
      "多くの問題では fn main のない数行だけが出てくる。これは省略で、main の中にあると考えよう。実行の課題では完全なプログラムを書くので、fn main() { ... } の外枠は残して、中身だけを変えるのじゃ。",
    ),
  ),
];

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
