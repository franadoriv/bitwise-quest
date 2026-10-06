import type { Beat, LessonDef, NoteBlock, NoteDef, RegionDef, Text } from "../../../lib/content/types.ts";
import { L } from "../../../lib/i18n/text.ts";

// REGION 1 · VALUE VILLAGE  (types and variables, strings and null, value vs reference, equality)
// Snippets get `using System; System.Collections.Generic; System.Linq; System.Text; System.Threading.Tasks;`
// added by the validator. Types go at the end of a snippet, after the top-level statements.

const say = (text: Text): Beat => ({ kind: "dialog", speaker: "master", text });
const enemySays = (text: Text): Beat => ({ kind: "dialog", speaker: "enemy", text });

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");
const YES = L("Yes", "Sí", "はい");
const NO_CSC = L("No: the compiler stops it", "No: el compilador lo frena", "いいえ：コンパイラが止める");

// Guidebook notes: long explanations players can reopen from any question (📖).
// Examples use names and values different from the questions so they never give an answer away.
const note = (id: string, title: Text, ...blocks: NoteBlock[]): NoteDef => ({ id, title, blocks });
const p = (en: string, es: string, ja: string): NoteBlock => ({ t: "p", text: L(en, es, ja) });
/** A runnable example; the validator checks `output` against the real compiler. */
const ex = (code: string, output: string, caption?: Text): NoteBlock => ({ t: "code", code, output, caption });
/** An example that must NOT compile (verified too). */
const bad = (code: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { compiles: false } });

const typesNotes: NoteDef[] = [
  note("typed-variables", L("Every variable has a type", "Toda variable tiene un tipo", "変数にはかならず型がある"),
    p(
      "A C# variable is a label with a type written on it: the type, then the name, then = and the value. int holds whole numbers, double numbers with a decimal point, bool only true or false, and string text in double quotes. From then on, the name stands for the value it holds.",
      "Una variable de C# es una etiqueta con un tipo escrito: el tipo, luego el nombre, luego = y el valor. int guarda números enteros, double números con punto decimal, bool solo true o false, y string texto entre comillas dobles. Desde ahí, el nombre representa el valor que guarda.",
      "C# の変数は型が書かれたラベル。型、名前、=、値の順に書くよ。int は整数、double は小数点つきの数、bool は true か false だけ、string は二重引用符の文字。それ以降、名前はその値を表すんだ。",
    ),
    ex('int coins = 4;\ndouble speed = 1.5;\nbool open = true;\nstring city = "Rome";\nConsole.WriteLine(coins + " " + speed + " " + open + " " + city);', "4 1.5 True Rome",
      L("Four labels, four types. bool prints as True or False", "Cuatro etiquetas, cuatro tipos. bool se imprime True o False", "4つのラベルと4つの型。bool は True / False と表示")),
    p(
      "The compiler checks every type BEFORE the program runs. If a value doesn't fit its label, it refuses to build the program: putting text into an int, or a number into a string, is an error. Putting a double into an int is refused too, because the decimals would be lost silently (error CS0266).",
      "El compilador revisa cada tipo ANTES de ejecutar el programa. Si un valor no cabe en su etiqueta, se niega a construirlo: meter texto en un int, o un número en un string, es un error. Meter un double en un int también se rechaza, porque los decimales se perderían en silencio (error CS0266).",
      "コンパイラは実行の前にすべての型をチェックする。値がラベルに合わなければ、プログラムを作ってくれない。int に文字、string に数を入れるのはエラー。double を int に入れるのも拒否される。小数がこっそり消えてしまうからね（エラー CS0266）。",
    ),
    bad('string label = 12;',
      L("Does not compile: a number is not a string", "No compila: un número no es un string", "コンパイル不可：数は string ではない")),
    p(
      "var lets the compiler work out the type from the first value: var ratio = 0.5 makes ratio a double. It is only a shortcut for writing the type. The type is still fixed forever, so later you can only store values of that same type (or ones that convert safely, like an int into a double).",
      "var deja que el compilador deduzca el tipo a partir del primer valor: var ratio = 0.5 hace que ratio sea double. Es solo un atajo para no escribir el tipo. El tipo sigue fijo para siempre, así que después solo puedes guardar valores de ese tipo (o que se conviertan sin riesgo, como un int en un double).",
      "var を使うと、最初の値から型をコンパイラが決めてくれる。var ratio = 0.5 なら ratio は double。型を書く手間をはぶくだけで、型はずっと固定。あとから入れられるのは同じ型の値（か、int → double のように安全に変換できる値）だけだよ。",
    ),
    ex('var ratio = 0.5;\nratio = 2;\nConsole.WriteLine(ratio);', "2",
      L("ratio is a double; the int 2 converts safely into it", "ratio es double; el int 2 se convierte sin riesgo", "ratio は double。int の 2 は安全に変換される")),
    p(
      "Common mistakes: thinking var works like JavaScript's let, where a variable can switch from number to text (in C# it can't), and writing a decimal into an int label. If you need decimals, choose double from the start.",
      "Errores comunes: pensar que var funciona como let en JavaScript, donde una variable puede pasar de número a texto (en C# no puede), y escribir un decimal en una etiqueta int. Si necesitas decimales, elige double desde el principio.",
      "よくあるミス：var を JavaScript の let のように、数から文字へ変えられると思うこと（C# では無理）。int のラベルに小数を書くこと。小数が必要なら最初から double を選ぼう。",
    ),
  ),
  note("number-math", L("Division, remainder and casts", "División, resto y casts", "割り算・余り・キャスト"),
    p(
      "When both sides of / are int, C# does integer division: the result is an int and the decimal part is simply dropped, not rounded. 9 / 4 is 2, not 2.25. As soon as one side is a double, the division is done with decimals.",
      "Cuando los dos lados de / son int, C# hace división entera: el resultado es un int y la parte decimal simplemente se descarta, no se redondea. 9 / 4 es 2, no 2.25. En cuanto un lado es double, la división se hace con decimales.",
      "/ の両側が int なら、C# は整数の割り算をする。結果は int で、小数部分は四捨五入されずにただ捨てられる。9 / 4 は 2.25 ではなく 2。片方でも double なら、小数つきで割り算するよ。",
    ),
    ex('Console.WriteLine(9 / 4);\nConsole.WriteLine(9 / 4.0);\nConsole.WriteLine(9.0 / 4);', "2\n2.25\n2.25",
      L("One double on either side is enough", "Basta un double en cualquier lado", "どちらか片方が double なら十分")),
    p(
      "Order matters: in double each = pies / kids; with two ints, the division happens FIRST as ints, and only then is the result turned into a double. The decimals are already gone. To keep them, make one side a double before dividing, with a cast: (double)pies / kids.",
      "El orden importa: en double each = pies / kids; con dos int, la división ocurre PRIMERO como enteros, y solo después el resultado se convierte en double. Los decimales ya se perdieron. Para conservarlos, haz que un lado sea double antes de dividir, con un cast: (double)pies / kids.",
      "順番が大事。int 同士の double each = pies / kids; では、まず整数で割り算して、そのあとで double に変わる。小数はもう消えているんだ。残したいなら割る前に片方を double にしよう。キャストで (double)pies / kids と書くよ。",
    ),
    ex('int pies = 9;\nint kids = 4;\ndouble each = pies / kids;\ndouble fair = (double)pies / kids;\nConsole.WriteLine(each + " " + fair);', "2 2.25",
      L("each was computed as ints first; fair casts before dividing", "each se calculó primero como enteros; fair hace cast antes", "each は先に整数で計算、fair は割る前にキャスト")),
    p(
      "% gives the remainder of a division: 10 % 4 is 2, because 10 = 4 × 2 + 2. A remainder of 0 means it divides exactly, so n % 2 == 0 checks if n is even. A cast like (int)5.8 cuts off the decimals and gives 5; it never rounds. Use Math.Round when you want rounding.",
      "% da el resto de una división: 10 % 4 es 2, porque 10 = 4 × 2 + 2. Un resto 0 significa que divide exacto, así que n % 2 == 0 revisa si n es par. Un cast como (int)5.8 corta los decimales y da 5; nunca redondea. Usa Math.Round cuando quieras redondear.",
      "% は割り算の余り。10 % 4 は 2（10 = 4 × 2 + 2）。余り 0 は割り切れたということで、n % 2 == 0 で偶数かどうか分かる。(int)5.8 のようなキャストは小数を切り捨てて 5。四捨五入はしない。丸めたいときは Math.Round を使おう。",
    ),
    ex('Console.WriteLine(10 % 4);\nConsole.WriteLine((int)5.8 + " " + (int)-5.8);\nConsole.WriteLine(Math.Round(5.8));', "2\n5 -5\n6",
      L("A cast just drops the decimals, even for negatives", "Un cast solo quita los decimales, incluso en negativos", "キャストは小数を落とすだけ。負の数でも同じ")),
  ),
  note("text-and-numbers", L("Text, numbers and parsing", "Texto, números y conversión", "文字・数・パース"),
    p(
      "With numbers, + adds. With a string on either side, + glues text. C# reads + from left to right, one step at a time: while both sides are numbers it adds, and once a string has appeared, every later + glues. Parentheses change the order.",
      "Con números, + suma. Con un string en cualquier lado, + pega texto. C# lee los + de izquierda a derecha, paso a paso: mientras ambos lados son números suma, y en cuanto aparece un string, cada + siguiente pega. Los paréntesis cambian el orden.",
      "数同士なら + は足し算。どちらかが string なら + は文字をつなげる。C# は + を左から1つずつ計算する。両側が数のあいだは足し算、一度 string が出てきたら、そのあとの + は全部つなげる。かっこで順番を変えられるよ。",
    ),
    ex('Console.WriteLine(4 + 5 + "x");\nConsole.WriteLine("x" + 4 + 5);\nConsole.WriteLine("x" + (4 + 5));', "9x\nx45\nx9",
      L("Same pieces, different order, different result", "Mismas piezas, otro orden, otro resultado", "同じ部品でも順番で結果が変わる")),
    p(
      "Text that looks like a number is still text. int.Parse(\"12\") turns it into the int 12. But if the text isn't a valid number, Parse throws a FormatException while the program runs. The compiler can't warn you, because it doesn't know what the text will contain.",
      "Un texto que parece número sigue siendo texto. int.Parse(\"12\") lo convierte en el int 12. Pero si el texto no es un número válido, Parse lanza una FormatException mientras el programa corre. El compilador no puede avisarte, porque no sabe qué contendrá el texto.",
      "数に見える文字も、文字のまま。int.Parse(\"12\") で int の 12 に変わる。でも正しい数でない文字だと、実行中に Parse が FormatException を投げる。文字の中身は実行するまで分からないので、コンパイラは警告できないんだ。",
    ),
    ex('int lvl = int.Parse("12");\nConsole.WriteLine(lvl + 1);', "13"),
    p(
      "int.TryParse is the safe version: it never throws. It returns a bool (did it work?) and hands the number back through a parameter marked out, which you can declare right in the call. If the text isn't a number, it returns false and the out variable is 0.",
      "int.TryParse es la versión segura: nunca lanza. Devuelve un bool (¿funcionó?) y entrega el número por un parámetro marcado out, que puedes declarar en la misma llamada. Si el texto no es un número, devuelve false y la variable out queda en 0.",
      "int.TryParse は安全版で、例外を投げない。うまくいったかを bool で返し、数は out をつけた引数で受け取る。この変数は呼び出しの中で宣言できるよ。数でない文字なら false を返し、out の変数は 0 になる。",
    ),
    ex('bool good = int.TryParse("7x", out int value);\nConsole.WriteLine(good + " " + value);', "False 0",
      L("\"7x\" is not a number: false, and value is 0", "\"7x\" no es un número: false, y value es 0", "\"7x\" は数ではない：false で value は 0")),
    p(
      "Common mistakes: expecting \"5\" + 5 to be 10 (it is \"55\"), using Parse on text typed by a user (use TryParse and check the bool), and forgetting the out keyword in the TryParse call, which doesn't compile.",
      "Errores comunes: esperar que \"5\" + 5 sea 10 (es \"55\"), usar Parse con texto escrito por un usuario (usa TryParse y revisa el bool) y olvidar la palabra out en la llamada a TryParse, lo cual no compila.",
      "よくあるミス：\"5\" + 5 を 10 だと思うこと（答えは \"55\"）。ユーザーが入力した文字に Parse を使うこと（TryParse で bool を確かめよう）。TryParse の呼び出しで out を書き忘れること（コンパイルできない）。",
    ),
  ),
];

// ─── 1.1 Labels and chips ──────────────────────────────────────────────────
const typesAndVariables: LessonDef = {
  slug: "types-and-variables",
  title: L("Labels and chips", "Etiquetas y fichas", "ラベルとチップ"),
  concept: "types",
  mode: "lesson",
  xp: 60,
  enemy: "slime",
  enemyName: L("CAST SLIME", "SLIME DE CAST", "キャストスライム"),
  beats: [
    say(L(
      "Welcome to Value Village! In C#, a variable is a label with its TYPE written on it: int hp = 10.",
      "¡Bienvenido a la Aldea de los Valores! En C#, una variable es una etiqueta con su TIPO escrito: int hp = 10.",
      "バリュー村へようこそ！C# の変数は「型」が書かれたラベル。int hp = 10 のようにね。",
    )),
    {
      kind: "act",
      prompt: L("Press in order and watch the label", "Pulsa en orden y mira la etiqueta", "順番に押して、ラベルを見てね"),
      steps: [
        { label: L("LABEL hp", "ETIQUETA hp", "hp を貼る"), line: "int hp = 10;", effects: [{ t: "tag", actor: "hero", text: "int hp", value: "10" }] },
        { label: L("HEAL", "CURAR", "回復"), line: "hp = hp + 5;", effects: [{ t: "value", actor: "hero", text: "15" }, { t: "say", actor: "hero", text: L("Feeling better!", "¡Mucho mejor!", "元気出た！") }] },
        { label: L("PRINT", "IMPRIMIR", "表示"), line: "Console.WriteLine(hp);", effects: [{ t: "print", text: "15" }], output: "15" },
        {
          label: L("PUT 3.5", "PONER 3.5", "3.5 を入れる"),
          line: "hp = 3.5;",
          effects: [{ t: "shake" }, { t: "banner", text: L("CS0266", "CS0266", "CS0266") }],
          error: {
            compiler: "error CS0266: Cannot implicitly convert type 'double' to 'int'. An explicit conversion exists (are you missing a cast?)",
            plain: L("An int label only holds whole numbers. The compiler stops it before the program starts.", "Una etiqueta int solo guarda enteros. El compilador lo frena antes de empezar.", "int のラベルには整数だけ。実行前にコンパイラが止めるよ。"),
          },
        },
      ],
    },
    say(L(
      "Types: int for whole numbers, double for decimals, bool for true/false, string for text. The compiler checks them first.",
      "Tipos: int para enteros, double para decimales, bool para true/false, string para texto. El compilador los revisa antes.",
      "型：整数は int、小数は double、真偽は bool、文字列は string。コンパイラが先にチェックするよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("Compute the right side first with the current value, then store the result back into the label.", "Calcula primero el lado derecho con el valor actual y luego guarda el resultado en la etiqueta.", "まず右側をいまの値で計算して、その結果をラベルに入れ直そう。"),
      note: "typed-variables",
      code: "int hp = 10;\nhp = hp + 5;\nConsole.WriteLine(hp);",
      options: ["15", "10", "105"],
      answer: 0,
      output: "15",
      check: { compiles: true, stdout: "15" },
      explain: L("hp + 5 is 15, and the label hp now holds 15.", "hp + 5 es 15, y la etiqueta hp ahora guarda 15.", "hp + 5 は 15。ラベル hp はいま 15 だよ。"),
      setup: [{ t: "tag", actor: "hero", text: "int hp", value: "10" }],
      win: [{ t: "value", actor: "hero", text: "15" }, { t: "print", text: "15" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      hint: L("Compare the label's type with the value's type. Would anything be lost putting one into the other?", "Compara el tipo de la etiqueta con el del valor. ¿Se perdería algo al meter uno en el otro?", "ラベルの型と値の型を比べよう。入れたら何かが失われない？"),
      note: "typed-variables",
      code: "int x = 3.5;\nConsole.WriteLine(x);",
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
      explain: L("Error CS0266: a double doesn't fit an int label without a cast.", "Error CS0266: un double no cabe en una etiqueta int sin cast.", "エラー CS0266：double はキャストなしで int に入らない。"),
      win: [{ t: "shake" }, { t: "say", actor: "hero", text: L("Blocked!", "¡Bloqueado!", "ブロック！") }],
    },
    say(L(
      "Careful: int / int gives an int. The decimal part is DROPPED. Make one side a double to keep it.",
      "Ojo: int / int da un int. La parte decimal se DESCARTA. Haz que un lado sea double para conservarla.",
      "注意：int ÷ int は int。小数部分は捨てられる。片方を double にすれば残るよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("Check each division on its own: are both sides whole numbers, or is one of them a decimal?", "Revisa cada división por separado: ¿ambos lados son enteros, o uno es decimal?", "割り算を1つずつ見よう。両側とも整数？それとも片方が小数？"),
      note: "number-math",
      code: `Console.WriteLine(7 / 2 + " " + 7 / 2.0);`,
      options: ["3 3.5", "3.5 3.5", "3 3"],
      answer: 0,
      output: "3 3.5",
      check: { compiles: true, stdout: "3 3.5" },
      explain: L("7 / 2 is integer division: 3. With 2.0 one side is a double, so you get 3.5.", "7 / 2 es división entera: 3. Con 2.0 un lado es double, así que da 3.5.", "7 / 2 は整数の割り算で 3。2.0 なら double なので 3.5。"),
      win: [{ t: "print", text: "3 3.5" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("% is not percent here. After dividing as many whole times as you can, what is left over?", "Aquí % no es porcentaje. Tras dividir todas las veces enteras posibles, ¿qué sobra?", "% はパーセントではない。割れるだけ割ったあと、何が残る？"),
      note: "number-math",
      code: "Console.WriteLine(7 % 3);",
      options: ["1", "2", "2.33"],
      answer: 0,
      output: "1",
      check: { compiles: true, stdout: "1" },
      explain: L("% is the remainder: 7 = 3 * 2 + 1.", "% es el resto: 7 = 3 * 2 + 1.", "% は割り算の余り。7 = 3 × 2 + 1。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("A cast to int doesn't round. What does it do with the part after the dot?", "Un cast a int no redondea. ¿Qué hace con la parte después del punto?", "int へのキャストは四捨五入しない。点のあとの部分はどうなる？"),
      note: "number-math",
      code: "Console.WriteLine((int)3.9);",
      options: ["3", "4", "3.9"],
      answer: 0,
      output: "3",
      check: { compiles: true, stdout: "3" },
      explain: L("A cast to int cuts off the decimals. It does not round.", "Un cast a int corta los decimales. No redondea.", "int へのキャストは小数を切り捨てる。四捨五入じゃないよ。"),
    },
    say(L(
      "var lets the compiler guess the type from the value. But the type is still fixed forever.",
      "var deja que el compilador deduzca el tipo por el valor. Pero el tipo sigue fijo para siempre.",
      "var なら値から型を推論してくれる。でも型はずっと固定のままだよ。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      hint: L("var picks the type once, from the first value. Which type did x get on line 1?", "var elige el tipo una sola vez, por el primer valor. ¿Qué tipo recibió x en la línea 1?", "var は最初の値で型を一度だけ決める。1行目で x は何型になった？"),
      note: "typed-variables",
      code: `var x = 5;\nx = "five";`,
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
      explain: L("var x = 5 makes x an int. Error CS0029: a string can't go there.", "var x = 5 hace que x sea int. Error CS0029: un string no cabe ahí.", "var x = 5 で x は int。エラー CS0029：string は入らない。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("Go left to right, one + at a time. Is the first + between two numbers or between number and text?", "Ve de izquierda a derecha, un + a la vez. ¿El primer + está entre dos números o entre número y texto?", "左から + を1つずつ。最初の + は数同士？それとも数と文字？"),
      note: "text-and-numbers",
      code: `Console.WriteLine(1 + 2 + "3");`,
      options: ["33", "123", "6"],
      answer: 0,
      output: "33",
      check: { compiles: true, stdout: "33" },
      explain: L("Left to right: 1 + 2 is 3, then 3 + \"3\" glues text: 33.", "De izquierda a derecha: 1 + 2 es 3, luego 3 + \"3\" pega texto: 33.", "左から順に：1 + 2 = 3、次に 3 + \"3\" で文字をつなげて 33。"),
    },
    say(L(
      "int.Parse crashes on bad text. int.TryParse returns false instead, and hands the number back through out.",
      "int.Parse falla con texto inválido. int.TryParse devuelve false y entrega el número por out.",
      "int.Parse は変な文字列でクラッシュ。int.TryParse は false を返し、数値は out で受け取るよ。",
    )),
    {
      kind: "predict",
      prompt: HAPPENS,
      hint: L("Can those letters be read as a number? And Parse has no safe way to say no.", "¿Se pueden leer esas letras como número? Y Parse no tiene una forma segura de decir que no.", "その文字は数として読める？Parse には安全に「無理」と言う方法がない。"),
      note: "text-and-numbers",
      code: `int n = int.Parse("abc");\nConsole.WriteLine(n);`,
      options: [L("Crash: FormatException", "Falla: FormatException", "クラッシュ：FormatException"), "0", "abc"],
      answer: 0,
      check: { compiles: true, throws: "System.FormatException" },
      explain: L("\"abc\" is not a number, so int.Parse throws FormatException at runtime.", "\"abc\" no es un número, así que int.Parse lanza FormatException al ejecutar.", "\"abc\" は数字じゃないので、int.Parse は実行時に FormatException を投げる。"),
      win: [{ t: "shake" }, { t: "say", actor: "enemy", text: L("Not a number!", "¡No es un número!", "数字じゃない！") }],
    },
    {
      kind: "type",
      prompt: L("Receive the number safely", "Recibe el número de forma segura", "数値を安全に受け取ろう"),
      hint: L("TryParse returns a bool and hands the number back through a parameter. Which keyword marks one the method fills?", "TryParse devuelve un bool y entrega el número por un parámetro. ¿Qué palabra marca uno que llena el método?", "TryParse は bool を返し、数は引数で返す。メソッドが値を入れる引数の印は？"),
      note: "text-and-numbers",
      code: `bool ok = int.TryParse("42", ___ int n);\nConsole.WriteLine(ok + " " + n);`,
      answer: "out",
      check: { compiles: true, stdout: "True 42" },
      explain: L("TryParse writes the number into an out variable and returns true if it worked.", "TryParse escribe el número en una variable out y devuelve true si funcionó.", "TryParse は out 変数に数値を書き、成功なら true を返す。"),
      win: [{ t: "tag", actor: "hero", text: "int n", value: "42" }, { t: "print", text: "True 42" }],
    },
    {
      kind: "run",
      prompt: L("Fix it: it must print share: 3.5", "Arréglalo: debe imprimir share: 3.5", "直そう：share: 3.5 と表示させて"),
      starter: `using System;

int gold = 7;
int players = 2;
double share = gold / players;
Console.WriteLine($"share: {share}");
`,
      solution: `using System;

int gold = 7;
int players = 2;
double share = gold / (double)players;
Console.WriteLine($"share: {share}");
`,
      hint: L("Both values are int, so the division happens before the double gets involved. Make one side a double first.", "Ambos valores son int, así que la división ocurre antes de que entre el double. Haz double un lado primero.", "どちらも int なので、double になる前に割り算される。先に片方を double に。"),
      note: "number-math",
      expect: "share: 3.5",
      fallback: [
        String.raw`\(double\)\s*(gold|players)`,
        String.raw`double\s+(gold|players)\s*=`,
        String.raw`(gold|players)\s*\*\s*1\.0`,
        String.raw`1\.0\s*\*\s*(gold|players)`,
        String.raw`gold\s*/\s*2\.0`,
      ],
      explain: L("gold / players is int division (3) before it reaches the double. Cast one side: gold / (double)players.", "gold / players es división entera (3) antes de llegar al double. Haz cast a un lado: gold / (double)players.", "gold / players は先に整数の割り算で 3 になる。片方をキャストしよう：gold / (double)players。"),
    },
  ],  notes: typesNotes,
};

const stringsNotes: NoteDef[] = [
  note("immutable-strings", L("Strings never change", "Los strings nunca cambian", "文字列は変わらない"),
    p(
      "A string in C# is immutable: once created, its letters can never change. Methods like ToUpper(), Trim() or Replace() don't edit the string you call them on. They build a NEW string and return it. If you don't store that result somewhere, it is thrown away.",
      "Un string en C# es inmutable: una vez creado, sus letras nunca cambian. Métodos como ToUpper(), Trim() o Replace() no editan el string sobre el que los llamas. Construyen un string NUEVO y lo devuelven. Si no guardas ese resultado en algún lado, se pierde.",
      "C# の string は不変（イミュータブル）。一度作ったら文字は二度と変わらない。ToUpper()、Trim()、Replace() などは元の文字列を書きかえず、新しい文字列を作って返す。その結果をどこかに入れなければ、捨てられてしまうよ。",
    ),
    ex('string word = "  moon ";\nword.Trim();\nConsole.WriteLine("[" + word + "]");\nword = word.Trim();\nConsole.WriteLine("[" + word + "]");', "[  moon ]\n[moon]",
      L("The first Trim() result is lost; the second is stored back", "El primer Trim() se pierde; el segundo se guarda", "1回目の Trim() は捨てられ、2回目は入れ直している")),
    p(
      "Because strings never change, two labels can safely share one. string second = first; makes both point at the same text. Then second += \"al\" doesn't touch that text: it builds a new string and moves only second to it. first still shows the old text.",
      "Como los strings nunca cambian, dos etiquetas pueden compartir uno sin riesgo. string second = first; hace que ambas apunten al mismo texto. Luego second += \"al\" no toca ese texto: construye un string nuevo y mueve solo a second hacia él. first sigue mostrando el texto viejo.",
      "文字列は変わらないので、2つのラベルで1つを共有しても安全。string second = first; で両方が同じ文字を指す。そのあと second += \"al\" をしても元の文字は変わらない。新しい文字列ができて、second だけがそちらを指すんだ。first は古いまま。",
    ),
    ex('string first = "go";\nstring second = first;\nsecond = second + "al";\nConsole.WriteLine(first + " " + second);', "go goal"),
    p(
      "You can READ a single letter with an index: word[0] is the first char. But you can't WRITE one: the indexer is read-only, so assigning to word[0] is a compile error (CS0200). To change letters, build a new string, for example with Replace, and store it.",
      "Puedes LEER una letra con un índice: word[0] es el primer char. Pero no puedes ESCRIBIRLA: el indexador es de solo lectura, así que asignar a word[0] es un error de compilación (CS0200). Para cambiar letras, construye un string nuevo, por ejemplo con Replace, y guárdalo.",
      "インデックスで1文字を読むことはできる。word[0] は最初の char。でも書きこむことはできない。インデクサは読み取り専用なので、word[0] への代入はコンパイルエラー（CS0200）。文字を変えたいなら、Replace などで新しい文字列を作って入れよう。",
    ),
    ex('string tag = "cat";\nConsole.WriteLine(tag[0]);\nstring other = tag.Replace(\'a\', \'u\');\nConsole.WriteLine(tag + " " + other);', "c\ncat cut",
      L("Reading tag[0] is fine; Replace returns a new string", "Leer tag[0] está bien; Replace devuelve un string nuevo", "tag[0] を読むのは OK。Replace は新しい文字列を返す")),
    p(
      "Common mistake: writing name.ToUpper(); on its own line and expecting name to change. The compiler accepts it, so nothing warns you. Remember the pattern: name = name.ToUpper(); the method gives you a new string, and you decide where to keep it.",
      "Error común: escribir name.ToUpper(); solo en una línea y esperar que name cambie. El compilador lo acepta, así que nada te avisa. Recuerda el patrón: name = name.ToUpper(); el método te da un string nuevo y tú decides dónde guardarlo.",
      "よくあるミス：name.ToUpper(); を1行だけ書いて name が変わると思うこと。コンパイラは受け入れるので、何も警告されない。name = name.ToUpper(); の形を覚えよう。メソッドが新しい文字列をくれて、どこにしまうかは自分で決めるんだ。",
    ),
  ),
  note("interpolation-builder", L("Interpolation and StringBuilder", "Interpolación y StringBuilder", "文字列補間と StringBuilder"),
    p(
      "Putting $ right before the opening quote turns on interpolation: inside $\"...\", anything between {braces} is a piece of C# code. It is evaluated, and its value is written into the text. It can be a variable or a whole expression, like {wins * 2}. Without the $, braces are printed as plain characters.",
      "Poner $ justo antes de la comilla de apertura activa la interpolación: dentro de $\"...\", lo que va entre {llaves} es código C#. Se evalúa y su valor se escribe en el texto. Puede ser una variable o una expresión completa, como {wins * 2}. Sin el $, las llaves se imprimen como caracteres normales.",
      "開きの引用符の直前に $ を置くと文字列補間になる。$\"...\" の中の {波かっこ} は C# のコード。計算されて、その値が文字の中に入る。変数でも {wins * 2} のような式でもいい。$ がなければ、波かっこはただの文字として表示されるよ。",
    ),
    ex('int wins = 6;\nstring team = "Owls";\nConsole.WriteLine($"{team} won {wins * 2} times");\nConsole.WriteLine("{team}");', "Owls won 12 times\n{team}",
      L("With $ the braces are code; without it they are just text", "Con $ las llaves son código; sin él, solo texto", "$ があれば波かっこはコード、なければただの文字")),
    p(
      "Since strings never change, building text with + in many steps creates a new string every time, and the old ones become garbage. StringBuilder solves that: it is ONE editable buffer. Append adds text to its end, Length counts its characters, and ToString() gives you the finished string.",
      "Como los strings nunca cambian, armar texto con + en muchos pasos crea un string nuevo cada vez, y los viejos se vuelven basura. StringBuilder lo resuelve: es UN solo búfer editable. Append agrega texto al final, Length cuenta sus caracteres y ToString() te da el string terminado.",
      "文字列は変わらないので、+ で何回もつなげると毎回新しい文字列ができて、古いものはゴミになる。StringBuilder はそれを解決する、編集できる1つのバッファ。Append で末尾に足し、Length で文字数を数え、ToString() で完成した文字列を受け取るよ。",
    ),
    ex('var sb = new StringBuilder();\nfor (int i = 1; i <= 3; i++)\n    sb.Append(i).Append(\'-\');\nConsole.WriteLine(sb.ToString());\nConsole.WriteLine(sb.Length);', "1-2-3-\n6",
      L("Six characters were appended, so Length is 6", "Se agregaron seis caracteres, así que Length es 6", "6文字を足したので Length は 6")),
    p(
      "Common mistakes: forgetting the $ (the braces then show up literally in the output), and thinking Length counts how many times you called Append. Length is always the number of characters currently in the buffer.",
      "Errores comunes: olvidar el $ (las llaves aparecen tal cual en la salida) y pensar que Length cuenta cuántas veces llamaste a Append. Length siempre es la cantidad de caracteres que hay en el búfer.",
      "よくあるミス：$ を忘れること（波かっこがそのまま表示される）。Length が Append を呼んだ回数だと思うこと。Length はいつも、いまバッファに入っている文字の数だよ。",
    ),
  ),
  note("null-operators", L("null, ?. and ??", "null, ?. y ??", "null と ?. と ??"),
    p(
      "A label of a class type, like string, can hold null, which means \"no object here\". Writing string? says on purpose that the label may be null. Asking a null label for anything, like .Length, crashes the program at runtime with a NullReferenceException: there is no object to answer.",
      "Una etiqueta de tipo clase, como string, puede guardar null, que significa \"aquí no hay objeto\". Escribir string? dice a propósito que la etiqueta puede ser null. Pedirle algo a una etiqueta null, como .Length, hace caer el programa al ejecutar con NullReferenceException: no hay objeto que responda.",
      "string のような class 型のラベルには null を入れられる。null は「ここに物はない」という意味。string? と書くと、null かもしれないと明示できる。null のラベルに .Length などを聞くと、答える物がないので実行時に NullReferenceException でクラッシュするよ。",
    ),
    p(
      "With nullable checking on, the compiler WARNS (CS8602) when you touch a maybe-null label. A warning is not an error: the program still builds and runs, and then crashes. Take the warning seriously and handle null before using the label.",
      "Con la revisión de null activada, el compilador AVISA (CS8602) cuando tocas una etiqueta que puede ser null. Un aviso no es un error: el programa se construye y se ejecuta igual, y luego falla. Toma el aviso en serio y maneja el null antes de usar la etiqueta.",
      "null チェックが有効だと、null かもしれないラベルにさわったときコンパイラは警告（CS8602）を出す。警告はエラーではないので、プログラムは作られて実行され、そこでクラッシュする。警告を本気で受けとめ、使う前に null を処理しよう。",
    ),
    p(
      "Three operators help. a?.B means: if a is null, give null and don't touch B; otherwise use a.B. x ?? y means: x, unless x is null, then y. x ??= y assigns y to x only when x is currently null. They combine nicely: ?. gives a null, and ?? replaces it.",
      "Tres operadores ayudan. a?.B significa: si a es null, da null y no toques B; si no, usa a.B. x ?? y significa: x, salvo que x sea null, entonces y. x ??= y asigna y a x solo cuando x es null en ese momento. Se combinan bien: ?. da un null y ?? lo reemplaza.",
      "助けになる演算子が3つ。a?.B は「a が null なら B にさわらず null、そうでなければ a.B」。x ?? y は「x、ただし x が null なら y」。x ??= y は x がいま null のときだけ y を代入する。?. で出た null を ?? で置きかえる、という組み合わせが便利だよ。",
    ),
    ex('string? title = null;\nint? size = title?.Length;\nConsole.WriteLine(size == null);\nstring shown = title ?? "untitled";\nConsole.WriteLine(shown);', "True\nuntitled",
      L("?. skipped .Length and gave null; ?? picked the backup", "?. saltó .Length y dio null; ?? eligió el respaldo", "?. は .Length を飛ばして null、?? は予備を選んだ")),
    ex('string? mode = "fast";\nmode ??= "slow";\nConsole.WriteLine(mode);', "fast",
      L("mode wasn't null, so ??= left it alone", "mode no era null, así que ??= no lo tocó", "mode は null でないので ??= は何もしない")),
    p(
      "Common mistakes: believing a null string has Length 0 (it has no Length at all), thinking a warning stops the build, and expecting ??= to overwrite a label that already has a value.",
      "Errores comunes: creer que un string null tiene Length 0 (no tiene Length en absoluto), pensar que un aviso detiene la compilación y esperar que ??= sobrescriba una etiqueta que ya tiene valor.",
      "よくあるミス：null の文字列の Length は 0 だと思うこと（Length そのものがない）。警告でビルドが止まると思うこと。値がすでにあるラベルを ??= が上書きすると思うこと。",
    ),
  ),
  note("nullable-values", L("int?: numbers that may be empty", "int?: números que pueden estar vacíos", "int?：空かもしれない数"),
    p(
      "Value types like int, double and bool always hold a value, so they can't be null. Adding ? creates a nullable version: an int? is an int that may also be empty. HasValue tells you if it holds a number, Value reads it, and GetValueOrDefault() returns the number or the type's default (0 for int).",
      "Los tipos de valor como int, double y bool siempre guardan un valor, así que no pueden ser null. Agregar ? crea una versión anulable: un int? es un int que también puede estar vacío. HasValue dice si guarda un número, Value lo lee y GetValueOrDefault() devuelve el número o el valor por defecto del tipo (0 para int).",
      "int、double、bool などの値型はいつも値を持つので null になれない。? を付けると null 許容版になる。int? は空にもなれる int だよ。HasValue で数があるか分かり、Value で読み、GetValueOrDefault() は数か、型の既定値（int なら 0）を返す。",
    ),
    ex('int? bonus = 8;\nConsole.WriteLine(bonus.HasValue + " " + bonus.Value);\nint? none = null;\nConsole.WriteLine(none ?? 100);', "True 8\n100"),
    p(
      "An int fits into an int? with no fuss, but the opposite is refused (CS0266): an int? might be empty, and a plain int has no way to hold \"empty\". You must say what happens in that case: use ?? with a fallback, or read .Value if you are sure it has one.",
      "Un int cabe en un int? sin problema, pero al revés se rechaza (CS0266): un int? podría estar vacío, y un int normal no tiene forma de guardar \"vacío\". Debes decir qué pasa en ese caso: usa ?? con un respaldo, o lee .Value si estás seguro de que tiene valor.",
      "int は int? にそのまま入るけど、逆は拒否される（CS0266）。int? は空かもしれず、ふつうの int には「空」を入れる方法がないからね。その場合どうするかを書こう。?? で予備を決めるか、値があると確かなら .Value を読む。",
    ),
    ex('int? maybe = 4;\nint sure = maybe ?? 0;\nint? back = sure;\nConsole.WriteLine(sure + " " + back);', "4 4",
      L("int? to int needs a fallback; int to int? is automatic", "int? a int necesita respaldo; int a int? es automático", "int? → int には予備が必要、int → int? は自動")),
    p(
      "Common mistake: reading .Value on an empty int?. It throws an InvalidOperationException at runtime. Check HasValue first, or prefer ?? and GetValueOrDefault(), which never crash.",
      "Error común: leer .Value de un int? vacío. Lanza InvalidOperationException al ejecutar. Revisa HasValue primero, o prefiere ?? y GetValueOrDefault(), que nunca fallan.",
      "よくあるミス：空の int? の .Value を読むこと。実行時に InvalidOperationException が投げられる。先に HasValue を確かめるか、クラッシュしない ?? や GetValueOrDefault() を使おう。",
    ),
  ),
];

// ─── 1.2 Strings and null ──────────────────────────────────────────────────
const stringsAndNull: LessonDef = {
  slug: "strings-and-null",
  title: L("Words and empty hands", "Palabras y manos vacías", "文字列とからっぽの手"),
  concept: "null",
  mode: "lesson",
  xp: 65,
  enemy: "csharp/nullref-ghost",
  enemyName: L("NULLREF GHOST", "FANTASMA NULLREF", "ヌルリファゴースト"),
  beats: [
    say(L(
      "Strings never change. ToUpper() doesn't edit the old string: it returns a NEW one.",
      "Los strings nunca cambian. ToUpper() no edita el string viejo: devuelve uno NUEVO.",
      "文字列は変わらない。ToUpper() は元を書きかえず、新しい文字列を返すよ。",
    )),
    {
      kind: "act",
      prompt: L("Press in order and watch the scroll", "Pulsa en orden y mira el pergamino", "順番に押して、巻物を見てね"),
      steps: [
        { label: L("LABEL s", "ETIQUETA s", "s を貼る"), line: `string s = "hero";`, effects: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "string s", value: "hero" }] },
        { label: L("SHOUT", "GRITAR", "大文字に"), line: "s.ToUpper();", effects: [{ t: "banner", text: L("NEW STRING", "STRING NUEVO", "新しい文字列") }, { t: "say", actor: "hero", text: L("Where did it go?", "¿Adónde se fue?", "どこ行った？") }] },
        { label: L("PRINT", "IMPRIMIR", "表示"), line: "Console.WriteLine(s);", effects: [{ t: "print", text: "hero" }], output: "hero" },
        { label: L("KEEP IT", "GUARDARLO", "受け取る"), line: "s = s.ToUpper();", effects: [{ t: "value", actor: "hero", text: "HERO" }] },
        { label: L("PRINT", "IMPRIMIR", "表示"), line: "Console.WriteLine(s);", effects: [{ t: "print", text: "HERO" }], output: "HERO" },
      ],
    },
    {
      kind: "pick",
      prompt: L("Make it print HERO", "Haz que imprima HERO", "HERO と表示させよう"),
      hint: L("ToUpper() never edits a string. Where does its new string go, and does s ever receive it?", "ToUpper() nunca edita un string. ¿Adónde va su string nuevo, y lo recibe s alguna vez?", "ToUpper() は文字列を書きかえない。新しい文字列はどこへ？s は受け取る？"),
      note: "immutable-strings",
      code: `string s = "hero";\n___;\nConsole.WriteLine(s);`,
      options: ["s = s.ToUpper()", "s.ToUpper()", "ToUpper(s)"],
      answer: 0,
      check: { compiles: true, stdout: "HERO" },
      explain: L("The new string must be stored back in s. Calling s.ToUpper() alone throws the result away.", "El string nuevo debe guardarse en s. Llamar s.ToUpper() solo tira el resultado.", "新しい文字列を s に入れ直そう。s.ToUpper() だけだと結果は捨てられる。"),
      setup: [{ t: "tag", actor: "hero", text: "string s", value: "hero" }],
      win: [{ t: "value", actor: "hero", text: "HERO" }, { t: "print", text: "HERO" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("b += builds a brand-new string. Which label is moved to it, and which keeps the old one?", "b += construye un string totalmente nuevo. ¿Qué etiqueta pasa a él y cuál conserva el viejo?", "b += はまったく新しい文字列を作る。そちらを指すのはどっち？古いままなのは？"),
      note: "immutable-strings",
      code: `string a = "hi";\nstring b = a;\nb += "!";\nConsole.WriteLine(a + " " + b);`,
      options: ["hi hi!", "hi! hi!", "hi hi"],
      answer: 0,
      output: "hi hi!",
      check: { compiles: true, stdout: "hi hi!" },
      explain: L("b += \"!\" builds a new string for b. a still holds the old \"hi\".", "b += \"!\" crea un string nuevo para b. a sigue con el viejo \"hi\".", "b += \"!\" は b 用に新しい文字列を作る。a は元の \"hi\" のまま。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      hint: L("You can read a letter with s[0]. Can strings ever change once they exist?", "Puedes leer una letra con s[0]. ¿Pueden los strings cambiar alguna vez una vez creados?", "s[0] で文字は読める。でも文字列は一度できたら変えられる？"),
      note: "immutable-strings",
      code: `string s = "a";\ns[0] = 'b';`,
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
      explain: L("Error CS0200: a string's letters are read-only. You can read s[0] but not write it.", "Error CS0200: las letras de un string son de solo lectura. Puedes leer s[0], no escribirlo.", "エラー CS0200：文字列の文字は読み取り専用。s[0] は読めるけど書けない。"),
    },
    say(L(
      "$\"...\" is interpolation: code inside {braces} is put into the text.",
      "$\"...\" es interpolación: el código entre {llaves} se mete en el texto.",
      "$\"...\" は文字列補間。{波かっこ} の中のコードが文字に入るよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("With $ in front, each {…} is code that gets evaluated. Work out what's inside each pair of braces.", "Con $ delante, cada {…} es código que se evalúa. Calcula lo que hay dentro de cada par de llaves.", "$ が前にあれば {…} は計算されるコード。波かっこの中身をそれぞれ計算しよう。"),
      note: "interpolation-builder",
      code: `string name = "Ada";\nint lvl = 3;\nConsole.WriteLine($"{name} is level {lvl + 1}");`,
      options: ["Ada is level 4", "Ada is level 3", "{name} is level {lvl + 1}"],
      answer: 0,
      output: "Ada is level 4",
      check: { compiles: true, stdout: "Ada is level 4" },
      explain: L("Each {expression} is evaluated: lvl + 1 is 4.", "Cada {expresión} se evalúa: lvl + 1 es 4.", "{式} はそれぞれ計算される。lvl + 1 は 4。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("Append adds to one buffer. Length counts characters, not calls: how many letters are in it at the end?", "Append agrega a un solo búfer. Length cuenta caracteres, no llamadas: ¿cuántas letras hay al final?", "Append は1つのバッファに足す。Length は呼んだ回数でなく文字数。最後に何文字？"),
      note: "interpolation-builder",
      code: `var sb = new StringBuilder();\nsb.Append("ha");\nsb.Append("ha");\nConsole.WriteLine(sb.ToString() + " " + sb.Length);`,
      options: ["haha 4", "ha 2", "haha 2"],
      answer: 0,
      output: "haha 4",
      check: { compiles: true, stdout: "haha 4" },
      explain: L("StringBuilder edits ONE buffer, so building text in many steps doesn't make a new string each time.", "StringBuilder edita UN solo búfer, así que armar texto en pasos no crea un string nuevo cada vez.", "StringBuilder はひとつのバッファを編集する。毎回新しい文字列を作らずにすむよ。"),
    },
    say(L(
      "null means \"no object here\". string? says a label MAY be empty. ?. and ?? keep you from touching nothing.",
      "null significa \"aquí no hay objeto\". string? dice que la etiqueta PUEDE estar vacía. ?. y ?? te protegen.",
      "null は「何もない」の意味。string? は空かもしれないラベル。?. と ?? で安全に扱おう。",
    )),
    {
      kind: "act",
      prompt: L("Reach into empty hands", "Busca en las manos vacías", "からっぽの手をさぐろう"),
      steps: [
        { label: L("EMPTY s", "s VACÍO", "空の s"), line: "string? s = null;", effects: [{ t: "tag", actor: "hero", text: "string? s", value: "null" }] },
        { label: L("BACKUP ??", "RESPALDO ??", "予備 ??"), line: `Console.WriteLine(s ?? "none");`, effects: [{ t: "item", kind: "potion", holder: "hero" }, { t: "print", text: "none" }], output: "none" },
        {
          label: L("TOUCH s", "TOCAR s", "s にさわる"),
          line: "Console.WriteLine(s.Length);",
          effects: [{ t: "shake" }, { t: "say", actor: "enemy", text: L("Boo! Nothing!", "¡Bu! ¡Nada!", "ばあ！何もない！") }],
          error: {
            compiler: "Unhandled exception. System.NullReferenceException: Object reference not set to an instance of an object.",
            plain: L("s is null, so there's no string to ask for its Length. The program crashes.", "s es null, no hay string al que pedirle Length. El programa se cae.", "s は null。Length を聞く文字列がないのでクラッシュするよ。"),
          },
        },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("Follow it step by step: what does ?. give when s is null, and what does ?? do with that?", "Síguelo paso a paso: ¿qué da ?. cuando s es null, y qué hace ?? con eso?", "1つずつ追おう。s が null のとき ?. は何を返す？?? はそれをどうする？"),
      note: "null-operators",
      code: "string? s = null;\nConsole.WriteLine(s?.Length ?? -1);",
      options: ["-1", "0", L("Crash", "Falla", "クラッシュ")],
      answer: 0,
      output: "-1",
      check: { compiles: true, stdout: "-1" },
      explain: L("s?.Length gives null instead of crashing, and ?? swaps null for -1.", "s?.Length da null en vez de fallar, y ?? cambia null por -1.", "s?.Length はクラッシュせず null。?? が null を -1 に置きかえる。"),
      setup: [{ t: "tag", actor: "hero", text: "string? s", value: "null" }],
      win: [{ t: "print", text: "-1" }, { t: "say", actor: "hero", text: L("Safe!", "¡A salvo!", "セーフ！") }],
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      hint: L("There's no ?. here. Is there any object behind s to answer .Length? Warnings don't stop the build.", "Aquí no hay ?. ¿Hay algún objeto detrás de s que responda .Length? Los avisos no detienen la compilación.", "ここに ?. はない。s の先に .Length に答える物はある？警告ではビルドは止まらない。"),
      note: "null-operators",
      code: "string? s = null;\nConsole.WriteLine(s.Length);",
      options: [L("Crash: NullReferenceException", "Falla: NullReferenceException", "クラッシュ：NullReferenceException"), "0", L("Prints nothing", "No imprime nada", "何も表示しない")],
      answer: 0,
      check: { compiles: true, throws: "System.NullReferenceException" },
      explain: L("It compiles with warning CS8602, then crashes: there is no object behind s.", "Compila con el aviso CS8602 y luego falla: no hay objeto detrás de s.", "警告 CS8602 付きでコンパイルされ、実行でクラッシュ。s の先に物がない。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("??= only assigns when the label is null right now. Check s before each line.", "??= solo asigna cuando la etiqueta es null en ese momento. Revisa s antes de cada línea.", "??= はラベルがいま null のときだけ代入する。各行の前の s を確かめよう。"),
      note: "null-operators",
      code: `string? s = null;\ns ??= "default";\ns ??= "other";\nConsole.WriteLine(s);`,
      options: ["default", "other", "null"],
      answer: 0,
      output: "default",
      check: { compiles: true, stdout: "default" },
      explain: L("??= assigns only when the label is null. The second time s already has a value.", "??= asigna solo si la etiqueta es null. La segunda vez s ya tiene valor.", "??= はラベルが null のときだけ代入。2回目の s にはもう値がある。"),
    },
    say(L(
      "Numbers can't be null... unless you add ?: int? n = null. Check it with HasValue.",
      "Los números no pueden ser null... salvo que agregues ?: int? n = null. Revísalo con HasValue.",
      "数値は普通 null になれない。でも ? を付ければ OK：int? n = null。HasValue で確かめよう。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("n is empty. What does HasValue report, and what is the default value of an int?", "n está vacío. ¿Qué indica HasValue, y cuál es el valor por defecto de un int?", "n は空。HasValue は何を返す？int の既定値はいくつ？"),
      note: "nullable-values",
      code: `int? n = null;\nConsole.WriteLine(n.HasValue + " " + n.GetValueOrDefault());`,
      options: ["False 0", "True 0", "False null"],
      answer: 0,
      output: "False 0",
      check: { compiles: true, stdout: "False 0" },
      explain: L("n has no value, and GetValueOrDefault() falls back to the int default, 0.", "n no tiene valor, y GetValueOrDefault() usa el valor por defecto de int, 0.", "n に値はない。GetValueOrDefault() は int の既定値 0 を返す。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      hint: L("Never mind that n holds 3 now. Could an int? be empty, and can a plain int hold \"empty\"?", "No importa que n tenga 3 ahora. ¿Podría un int? estar vacío, y puede un int normal guardar \"vacío\"?", "いま n が 3 なのは関係ない。int? は空になれる？ふつうの int に「空」は入る？"),
      note: "nullable-values",
      code: "int? n = 3;\nint m = n;",
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
      explain: L("Error CS0266: int? might be null, and int can't hold null. Use n ?? 0 or n.Value.", "Error CS0266: int? podría ser null y un int no puede guardarlo. Usa n ?? 0 o n.Value.", "エラー CS0266：int? は null かも。int には入らない。n ?? 0 を使おう。"),
    },
    {
      kind: "run",
      prompt: L("Fix it: it must print len: 0", "Arréglalo: debe imprimir len: 0", "直そう：len: 0 と表示させて"),
      starter: `using System;

string? nick = null;
int len = nick.Length;
Console.WriteLine($"len: {len}");
`,
      solution: `using System;

string? nick = null;
int len = nick?.Length ?? 0;
Console.WriteLine($"len: {len}");
`,
      hint: L("nick is null, so asking it for .Length crashes. Use the operators that turn null into a fallback number.", "nick es null, así que pedirle .Length falla. Usa los operadores que convierten null en un número de respaldo.", "nick は null なので .Length でクラッシュ。null を予備の数に変える演算子を使おう。"),
      note: "null-operators",
      expect: "len: 0",
      fallback: [
        String.raw`nick\?\.Length\s*\?\?\s*0`,
        String.raw`nick\s*==\s*null\s*\?\s*0`,
        String.raw`nick\s+is\s+null\s*\?\s*0`,
        String.raw`\(\s*nick\s*\?\?\s*""\s*\)\.Length`,
      ],
      explain: L("nick is null, so .Length crashes. nick?.Length ?? 0 gives 0 instead.", "nick es null, así que .Length falla. nick?.Length ?? 0 da 0 en su lugar.", "nick は null なので .Length でクラッシュ。nick?.Length ?? 0 なら 0 になる。"),
    },
  ],  notes: stringsNotes,
};

const copiesNotes: NoteDef[] = [
  note("value-types", L("Value types are copied", "Los tipos de valor se copian", "値型はコピーされる"),
    p(
      "int, double, bool, char and every struct are VALUE types: the label holds the value itself, like a chip in your hand. Writing b = a makes a full copy of the chip. From then on a and b are independent: changing one never changes the other.",
      "int, double, bool, char y todo struct son tipos de VALOR: la etiqueta guarda el valor mismo, como una ficha en tu mano. Escribir b = a hace una copia completa de la ficha. Desde ahí a y b son independientes: cambiar uno nunca cambia al otro.",
      "int、double、bool、char、そしてすべての struct は値型。ラベルは値そのものを持つ。手の中のチップのようにね。b = a と書くとチップが丸ごとコピーされる。それ以降 a と b は別物で、片方を変えてももう片方は変わらない。",
    ),
    ex('int left = 3;\nint right = left;\nright = right * 10;\nConsole.WriteLine(left + " " + right);', "3 30"),
    p(
      "A struct is a value type you design yourself, with fields inside. Copying it copies every field. So after var c2 = c1; changing c2.Worth leaves c1 untouched. In these snippets, the struct is declared at the end, after the statements that use it.",
      "Un struct es un tipo de valor que diseñas tú, con campos adentro. Copiarlo copia cada campo. Así que tras var c2 = c1; cambiar c2.Worth deja intacto a c1. En estos fragmentos, el struct se declara al final, después de las instrucciones que lo usan.",
      "struct は自分で作る値型で、中にフィールドを持つ。コピーするとフィールドが全部コピーされる。だから var c2 = c1; のあとに c2.Worth を変えても c1 はそのまま。これらのコードでは、struct は使う文のあと、最後に宣言するよ。",
    ),
    ex('var c1 = new Coin { Worth = 5 };\nvar c2 = c1;\nc2.Worth = 1;\nConsole.WriteLine(c1.Worth + " " + c2.Worth);\n\nstruct Coin { public int Worth; }', "5 1",
      L("c2 got its own copy of every field", "c2 recibió su propia copia de cada campo", "c2 はすべてのフィールドの自分用コピーを持つ")),
    p(
      "The same rule hides a trap: var x = cells[0]; on an array of structs gives you a COPY of the element. Editing x edits only the copy, and the array keeps its old value. To change the element, write through the array itself, or store the copy back.",
      "La misma regla esconde una trampa: var x = cells[0]; en un array de structs te da una COPIA del elemento. Editar x edita solo la copia, y el array conserva su valor viejo. Para cambiar el elemento, escribe a través del array mismo, o guarda la copia de vuelta.",
      "同じルールにはわながある。struct の配列で var x = cells[0]; とすると、要素のコピーが手に入る。x を編集してもコピーが変わるだけで、配列は古い値のまま。要素を変えたいなら、配列そのものを通して書くか、コピーを戻そう。",
    ),
    ex('var cells = new Cell[] { new Cell { Hp = 2 } };\nvar copy = cells[0];\ncopy.Hp = 0;\nConsole.WriteLine(cells[0].Hp + " " + copy.Hp);\n\nstruct Cell { public int Hp; }', "2 0",
      L("Only the copy changed; the element in the array didn't", "Solo cambió la copia; el elemento del array no", "変わったのはコピーだけ。配列の要素はそのまま")),
  ),
  note("reference-types", L("Reference types share one object", "Los tipos de referencia comparten", "参照型はひとつの物を共有する"),
    p(
      "Classes, arrays and lists are REFERENCE types. The object lives in one place in memory (the heap), and the label only holds an arrow pointing to it. b = a copies the arrow, not the object, so now two labels point at ONE object. A change made through either label is seen through both.",
      "Las clases, arrays y listas son tipos de REFERENCIA. El objeto vive en un lugar de la memoria (el heap) y la etiqueta solo guarda una flecha hacia él. b = a copia la flecha, no el objeto, así que ahora dos etiquetas apuntan a UN objeto. Un cambio hecho por cualquiera se ve desde ambas.",
      "class、配列、リストは参照型。物はメモリの1か所（ヒープ）にあって、ラベルはそれを指す矢印を持つだけ。b = a でコピーされるのは矢印で、物ではない。だから2つのラベルが1つの物を指す。どちらから変えても、両方から見えるよ。",
    ),
    ex('var t1 = new Torch { Lit = false };\nvar t2 = t1;\nt2.Lit = true;\nConsole.WriteLine(t1.Lit);\n\nclass Torch { public bool Lit; }', "True",
      L("t1 and t2 are two arrows to the same torch", "t1 y t2 son dos flechas a la misma antorcha", "t1 と t2 は同じたいまつを指す2本の矢印")),
    p(
      "Only new creates a new object. Every new is a separate object, even when the values inside are the same. That's the key question when reading code: how many times was new (or a literal like { 1, 2 }) used? That's how many objects exist.",
      "Solo new crea un objeto nuevo. Cada new es un objeto separado, aunque los valores de adentro sean iguales. Esa es la pregunta clave al leer código: ¿cuántas veces se usó new (o un literal como { 1, 2 })? Esa es la cantidad de objetos que existen.",
      "新しい物を作るのは new だけ。中の値が同じでも、new ごとに別の物になる。コードを読むときのポイントは「new（や { 1, 2 } のようなリテラル）が何回使われたか」。それが物の数だよ。",
    ),
    ex('var bag = new List<string> { "rope" };\nvar same = bag;\nsame.Add("lamp");\nConsole.WriteLine(bag.Count);', "2"),
    p(
      "If you want an independent copy, build a new object with the same contents, for example with ToArray() for an array or new List<T>(old) for a list. Common mistake: thinking = duplicates an array or object. It never does for reference types; it only adds another arrow.",
      "Si quieres una copia independiente, construye un objeto nuevo con el mismo contenido, por ejemplo con ToArray() para un array o new List<T>(viejo) para una lista. Error común: pensar que = duplica un array u objeto. Con tipos de referencia nunca lo hace; solo agrega otra flecha.",
      "別々のコピーがほしいなら、同じ中身の新しい物を作ろう。配列なら ToArray()、リストなら new List<T>(古いリスト)。よくあるミス：= で配列や物が複製されると思うこと。参照型ではそうならず、矢印が1本増えるだけだよ。",
    ),
    ex('int[] orig = { 4, 5 };\nint[] clone = orig.ToArray();\nclone[0] = 0;\nConsole.WriteLine(orig[0] + " " + clone[0]);', "4 0",
      L("ToArray() built a second array", "ToArray() construyó un segundo array", "ToArray() で2つめの配列ができた")),
  ),
  note("passing-args", L("Passing arguments: copies, ref, out", "Pasar argumentos: copias, ref, out", "引数の渡し方：コピー・ref・out"),
    p(
      "A method parameter is a brand-new variable that receives a COPY of the argument. For an int, the number is copied: changes to the parameter stay inside the method. For a class, the ARROW is copied: the method can change the object's fields (the caller sees that), but pointing the parameter at a new object only moves the method's own arrow.",
      "Un parámetro de método es una variable nueva que recibe una COPIA del argumento. Con un int, se copia el número: los cambios al parámetro se quedan dentro del método. Con una clase, se copia la FLECHA: el método puede cambiar los campos del objeto (quien llama lo ve), pero apuntar el parámetro a otro objeto solo mueve la flecha propia del método.",
      "メソッドの引数は、渡された値のコピーを受け取る新しい変数。int なら数がコピーされ、引数を変えてもメソッドの中だけ。class なら矢印がコピーされる。物のフィールドを変えれば呼び出し側にも見えるけど、引数を新しい物に向けても動くのはメソッド自身の矢印だけだよ。",
    ),
    ex('var box = new Crate { Size = 1 };\nGrow(box);\nConsole.WriteLine(box.Size);\n\nstatic void Grow(Crate c) { c.Size = 4; c = new Crate { Size = 8 }; }\nclass Crate { public int Size; }', "4",
      L("Size = 4 reached the shared crate; the new crate stayed inside", "Size = 4 llegó a la caja compartida; la nueva se quedó adentro", "Size = 4 は共有の箱に届き、新しい箱は中に残った")),
    p(
      "ref passes the variable ITSELF instead of a copy, so assignments inside the method change the caller's variable. You write ref twice: on the parameter and at the call (Double(ref score)), and the variable must already have a value.",
      "ref pasa la variable MISMA en vez de una copia, así que las asignaciones dentro del método cambian la variable de quien llama. Se escribe ref dos veces: en el parámetro y en la llamada (Double(ref score)), y la variable ya debe tener un valor.",
      "ref はコピーではなく変数そのものを渡す。だからメソッドの中の代入で呼び出し側の変数が変わる。ref は引数と呼び出し（Double(ref score)）の2か所に書く。変数にはあらかじめ値が入っている必要があるよ。",
    ),
    ex('int score = 10;\nDouble(ref score);\nConsole.WriteLine(score);\n\nstatic void Double(ref int s) { s *= 2; }', "20"),
    p(
      "out is ref's sibling for results: the caller doesn't need to fill it, but the method MUST assign it before returning (or it won't compile). It's how a method hands back extra values, like TryParse. in is the read-only one: passed by reference, but the method can't change it.",
      "out es el hermano de ref para resultados: quien llama no necesita llenarlo, pero el método DEBE asignarlo antes de volver (si no, no compila). Así un método entrega valores extra, como TryParse. in es el de solo lectura: se pasa por referencia, pero el método no puede cambiarlo.",
      "out は結果用の ref の兄弟。呼び出し側は値を入れなくていいけど、メソッドは戻る前にかならず代入する（しないとコンパイルできない）。TryParse のように追加の値を返すしくみだよ。in は読み取り専用で、参照で渡されるけどメソッドは変えられない。",
    ),
    ex('Split(17, out int tens, out int ones);\nConsole.WriteLine(tens + " " + ones);\n\nstatic void Split(int n, out int t, out int o) { t = n / 10; o = n % 10; }', "1 7"),
    p(
      "Common mistakes: forgetting ref at the call site (it doesn't compile), expecting a method to change a plain int argument, and confusing \"change the object\" (visible outside) with \"replace the object\" (invisible outside).",
      "Errores comunes: olvidar ref en la llamada (no compila), esperar que un método cambie un argumento int normal y confundir \"cambiar el objeto\" (se ve afuera) con \"reemplazar el objeto\" (no se ve afuera).",
      "よくあるミス：呼び出し側で ref を書き忘れること（コンパイルできない）。ふつうの int の引数をメソッドが変えると思うこと。「物を変える」（外から見える）と「物を取りかえる」（外から見えない）を混同すること。",
    ),
  ),
  note("boxing", L("Boxing: a value in an object box", "Boxing: un valor en una caja object", "ボクシング：値を object の箱へ"),
    p(
      "object is the type every other type comes from, so an object label can hold anything. But object is a reference type, and an int is a value. When you put a value into an object label, C# BOXES it: it makes a box on the heap and puts a COPY of the value inside. The box and the original are independent.",
      "object es el tipo del que vienen todos los demás, así que una etiqueta object puede guardar cualquier cosa. Pero object es un tipo de referencia, y un int es un valor. Al meter un valor en una etiqueta object, C# lo empaqueta (boxing): crea una caja en el heap y pone una COPIA del valor adentro. La caja y el original son independientes.",
      "object はすべての型の元になる型なので、object のラベルには何でも入る。でも object は参照型で、int は値。値を object のラベルに入れると、C# はボクシングする。ヒープに箱を作り、値のコピーを入れるんだ。箱と元の値は別物だよ。",
    ),
    ex('double temp = 20.5;\nobject boxed = temp;\ntemp = 30;\nConsole.WriteLine(boxed + " " + temp);', "20.5 30",
      L("The box kept its copy of 20.5", "La caja guardó su copia de 20.5", "箱は 20.5 のコピーを持ったまま")),
    p(
      "Unboxing takes the value out with a cast, and the cast must name the EXACT type inside. A box with an int opens only as int. Casting it to long or double compiles (the compiler can't see inside the box) but throws InvalidCastException at runtime. To convert, unbox first, then cast: (double)(int)o.",
      "El unboxing saca el valor con un cast, y el cast debe nombrar el tipo EXACTO de adentro. Una caja con un int solo se abre como int. Hacer cast a long o double compila (el compilador no ve dentro de la caja) pero lanza InvalidCastException al ejecutar. Para convertir, desempaqueta primero y luego haz cast: (double)(int)o.",
      "アンボクシングはキャストで値を取り出す。キャストには中身とまったく同じ型を書くこと。int の箱は int でしか開かない。long や double へのキャストはコンパイルは通る（コンパイラは箱の中を見られない）けど、実行時に InvalidCastException。変換したいなら、先に取り出してからキャスト：(double)(int)o。",
    ),
    ex('object stored = 12;\nint back = (int)stored;\ndouble wide = (double)(int)stored;\nConsole.WriteLine(back + " " + wide);\nConsole.WriteLine(stored.GetType().Name);', "12 12\nInt32",
      L("Open as the exact type first; GetType() shows what's inside", "Abre primero con el tipo exacto; GetType() muestra el contenido", "まず正確な型で開く。GetType() で中身が分かる")),
    p(
      "Remember: each boxing makes a NEW box, even for the same value. Common mistakes: expecting a box to follow later changes to the original variable, and unboxing straight into a different numeric type.",
      "Recuerda: cada boxing crea una caja NUEVA, incluso para el mismo valor. Errores comunes: esperar que una caja siga los cambios posteriores de la variable original y desempaquetar directo a otro tipo numérico.",
      "覚えておこう：同じ値でも、ボクシングのたびに新しい箱ができる。よくあるミス：あとで元の変数を変えると箱も変わると思うこと。別の数値型へいきなりアンボクシングすること。",
    ),
  ),
];

// ─── 1.3 Copies and shared treasure ────────────────────────────────────────
const valueAndReference: LessonDef = {
  slug: "value-and-reference",
  title: L("Copies and shared treasure", "Copias y tesoro compartido", "コピーと共有の宝"),
  concept: "value-reference",
  mode: "lesson",
  xp: 70,
  enemy: "csharp/boxing-mimic",
  enemyName: L("BOXING MIMIC", "MIMIC BOXING", "ボクシングミミック"),
  beats: [
    say(L(
      "VALUE types (int, double, bool, struct) are COPIED on =. Each label gets its own chip.",
      "Los tipos de VALOR (int, double, bool, struct) se COPIAN con =. Cada etiqueta tiene su propia ficha.",
      "値型（int、double、bool、struct）は = でコピーされる。ラベルごとに自分のチップを持つよ。",
    )),
    {
      kind: "act",
      prompt: L("Copy the chip and change the copy", "Copia la ficha y cambia la copia", "チップをコピーして、コピーを変えよう"),
      steps: [
        { label: L("LABEL a", "ETIQUETA a", "a を貼る"), line: "int a = 5;", effects: [{ t: "tag", actor: "hero", text: "int a", value: "5" }] },
        { label: L("COPY TO b", "COPIAR A b", "b にコピー"), line: "int b = a;", effects: [{ t: "enter", actor: "ally" }, { t: "clone", to: "ally" }, { t: "tag", actor: "ally", text: "int b", value: "5" }] },
        { label: L("b++", "b++", "b++"), line: "b++;", effects: [{ t: "value", actor: "ally", text: "6" }] },
        { label: L("PRINT", "IMPRIMIR", "表示"), line: `Console.WriteLine(a + " " + b);`, effects: [{ t: "print", text: "5 6" }, { t: "say", actor: "hero", text: L("Still 5!", "¡Sigo en 5!", "まだ 5！") }], output: "5 6" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("PointS is a struct, a value type. Does q = p share one point or copy it?", "PointS es un struct, un tipo de valor. ¿q = p comparte un punto o lo copia?", "PointS は struct、つまり値型。q = p は共有？それともコピー？"),
      note: "value-types",
      code: "var p = new PointS { X = 1 };\nvar q = p;\nq.X = 99;\nConsole.WriteLine(p.X);\n\nstruct PointS { public int X; }",
      options: ["1", "99"],
      answer: 0,
      output: "1",
      check: { compiles: true, stdout: "1" },
      explain: L("A struct is a value type: q = p copies every field. Changing q leaves p alone.", "Un struct es un tipo de valor: q = p copia cada campo. Cambiar q no toca a p.", "struct は値型。q = p で中身ごとコピーされる。q を変えても p はそのまま。"),
      setup: [{ t: "tag", actor: "hero", text: "p", value: "X=1" }],
      win: [{ t: "enter", actor: "ally" }, { t: "clone", to: "ally" }, { t: "tag", actor: "ally", text: "q", value: "X=99" }, { t: "print", text: "1" }],
    },
    say(L(
      "REFERENCE types (class, arrays) live in ONE place. = copies the arrow to it, not the object.",
      "Los tipos de REFERENCIA (class, arrays) viven en UN lugar. = copia la flecha hacia él, no el objeto.",
      "参照型（class、配列）の実体はひとつ。= でコピーされるのは矢印だけで、物はコピーされない。",
    )),
    {
      kind: "act",
      prompt: L("Share the gem and change it", "Comparte la gema y cámbiala", "宝石を共有して変えてみよう"),
      steps: [
        { label: L("BUILD p", "CREAR p", "p を作る"), line: "var p = new PointC { X = 1 };", effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "p", value: "X=1" }] },
        { label: L("SHARE TO q", "COMPARTIR A q", "q と共有"), line: "var q = p;", effects: [{ t: "enter", actor: "ally" }, { t: "lend", to: "ally" }, { t: "tag", actor: "ally", text: "q", value: "X=1" }] },
        { label: L("q.X = 99", "q.X = 99", "q.X = 99"), line: "q.X = 99;", effects: [{ t: "value", actor: "ally", text: "X=99" }, { t: "value", actor: "hero", text: "X=99" }] },
        { label: L("PRINT", "IMPRIMIR", "表示"), line: "Console.WriteLine(p.X);", effects: [{ t: "print", text: "99" }, { t: "say", actor: "hero", text: L("Mine changed!", "¡La mía cambió!", "ぼくのも変わった！") }], output: "99" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("Arrays are reference types. How many arrays exist here: how many were created?", "Los arrays son tipos de referencia. ¿Cuántos arrays existen aquí: cuántos se crearon?", "配列は参照型。ここに配列はいくつある？いくつ作られた？"),
      note: "reference-types",
      code: "int[] a = { 1, 2 };\nint[] b = a;\nb[0] = 9;\nConsole.WriteLine(a[0]);",
      options: ["9", "1"],
      answer: 0,
      output: "9",
      check: { compiles: true, stdout: "9" },
      explain: L("Arrays are reference types: a and b point at the SAME array.", "Los arrays son tipos de referencia: a y b apuntan al MISMO array.", "配列は参照型。a と b は同じ配列を指している。"),
      win: [{ t: "print", text: "9" }],
    },
    say(L(
      "A method is a named block: static void AddOne(int n) { n++; }. Passing x to it COPIES x, too.",
      "Un método es un bloque con nombre: static void AddOne(int n) { n++; }. Pasarle x también COPIA x.",
      "メソッドは名前つきのブロック：static void AddOne(int n) { n++; }。x を渡すときもコピーされるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("A plain parameter receives a copy of the argument. Which variable does n++ really change?", "Un parámetro normal recibe una copia del argumento. ¿Qué variable cambia realmente n++?", "ふつうの引数は値のコピーを受け取る。n++ が本当に変えるのはどの変数？"),
      note: "passing-args",
      code: "int x = 1;\nAddOne(x);\nConsole.WriteLine(x);\n\nstatic void AddOne(int n) { n++; }",
      options: ["1", "2"],
      answer: 0,
      output: "1",
      check: { compiles: true, stdout: "1" },
      explain: L("n is a copy of x. The method bumps the copy and x stays 1.", "n es una copia de x. El método sube la copia y x sigue en 1.", "n は x のコピー。メソッドはコピーを増やすだけで、x は 1 のまま。"),
    },
    {
      kind: "pick",
      prompt: L("Hand over the label itself", "Entrega la etiqueta misma", "ラベルそのものを渡そう"),
      hint: L("Look at the call: it already says how x is passed. The parameter must match it, and x already has a value.", "Mira la llamada: ya dice cómo se pasa x. El parámetro debe coincidir, y x ya tiene un valor.", "呼び出しを見よう。x の渡し方がもう書いてある。引数も合わせよう。x には値がある。"),
      note: "passing-args",
      code: "int x = 1;\nAddOne(ref x);\nConsole.WriteLine(x);\n\nstatic void AddOne(___ int n) { n++; }",
      options: ["ref", "out", "in"],
      answer: 0,
      check: { compiles: true, stdout: "2", wrongFail: true },
      explain: L("ref passes the variable itself, so n++ changes x. out must be assigned first; in is read-only.", "ref pasa la variable misma, así que n++ cambia x. out debe asignarse antes; in es de solo lectura.", "ref は変数そのものを渡すので n++ で x が変わる。out は先に代入が必要、in は読み取り専用。"),
      win: [{ t: "tag", actor: "hero", text: "int x", value: "2" }, { t: "print", text: "2" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("The method gets a copy of the arrow. Does pointing that copy at a new object move the caller's arrow?", "El método recibe una copia de la flecha. ¿Apuntar esa copia a otro objeto mueve la flecha de quien llama?", "メソッドが受け取るのは矢印のコピー。それを新しい物に向けたら、呼び出し側の矢印も動く？"),
      note: "passing-args",
      code: "var p = new PointC { X = 1 };\nReplace(p);\nConsole.WriteLine(p.X);\n\nstatic void Replace(PointC p) { p = new PointC { X = 77 }; }\nclass PointC { public int X; }",
      options: ["1", "77"],
      answer: 0,
      output: "1",
      check: { compiles: true, stdout: "1" },
      explain: L("The method gets a copy of the arrow. Pointing the copy at a new object doesn't move the caller's arrow.", "El método recibe una copia de la flecha. Apuntarla a otro objeto no mueve la flecha de quien llama.", "メソッドが受け取るのは矢印のコピー。コピーを別の物に向けても、呼び出し側は変わらない。"),
    },
    {
      kind: "type",
      prompt: L("This parameter must be filled", "Este parámetro debe llenarse", "必ず代入される引数"),
      hint: L("The call passes q the same way as r. Which keyword means \"the method must fill this in\"?", "La llamada pasa q igual que r. ¿Qué palabra significa \"el método debe llenar esto\"?", "呼び出しでは q も r と同じ渡し方。「メソッドがかならず入れる」を表す言葉は？"),
      note: "passing-args",
      code: "Divide(7, 2, out int q, out int r);\nConsole.WriteLine(q + \" \" + r);\n\nstatic void Divide(int a, int b, ___ int q, out int r) { q = a / b; r = a % b; }",
      answer: "out",
      check: { compiles: true, stdout: "3 1" },
      explain: L("out is ref's sibling for results: the method MUST assign it before it returns.", "out es el hermano de ref para resultados: el método DEBE asignarlo antes de volver.", "out は結果用の ref の兄弟。メソッドは戻る前に必ず代入するよ。"),
    },
    say(L(
      "BOXING: putting a value into an object label wraps a COPY of it in a box on the heap.",
      "BOXING: meter un valor en una etiqueta object envuelve una COPIA en una caja en el heap.",
      "ボクシング：値を object のラベルに入れると、コピーが箱に入れられてヒープに置かれる。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("Boxing puts a copy of the value in a box. Does changing i afterwards reach inside that box?", "El boxing pone una copia del valor en una caja. ¿Cambiar i después llega dentro de esa caja?", "ボクシングは値のコピーを箱に入れる。あとで i を変えたら箱の中まで届く？"),
      note: "boxing",
      code: "int i = 42;\nobject o = i;\ni = 7;\nConsole.WriteLine(o);",
      options: ["42", "7"],
      answer: 0,
      output: "42",
      check: { compiles: true, stdout: "42" },
      explain: L("The box holds its own copy of 42. Changing i later doesn't touch the box.", "La caja guarda su propia copia de 42. Cambiar i después no toca la caja.", "箱の中は 42 のコピー。あとで i を変えても箱は変わらない。"),
      setup: [{ t: "tag", actor: "hero", text: "int i", value: "42" }],
      win: [{ t: "enter", actor: "ally" }, { t: "item", kind: "shield", holder: "ally" }, { t: "tag", actor: "ally", text: "object o", value: "42" }, { t: "print", text: "42" }],
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      hint: L("What exact type is inside the box? A box only opens as that exact type, and the compiler can't look inside.", "¿Qué tipo exacto hay en la caja? Una caja solo se abre con ese tipo exacto, y el compilador no ve adentro.", "箱の中身の正確な型は？箱はその型でしか開かず、コンパイラは中を見られない。"),
      note: "boxing",
      code: "object o = 42;\nlong l = (long)o;\nConsole.WriteLine(l);",
      options: [L("Crash: InvalidCastException", "Falla: InvalidCastException", "クラッシュ：InvalidCastException"), "42", L("Compile error", "Error de compilación", "コンパイルエラー")],
      answer: 0,
      check: { compiles: true, throws: "System.InvalidCastException" },
      explain: L("A box must be opened as its EXACT type. It holds an int, so (long)o crashes; (long)(int)o works.", "Una caja se abre con su tipo EXACTO. Guarda un int, así que (long)o falla; (long)(int)o funciona.", "箱は中身と同じ型でしか開けない。中は int なので (long)o はクラッシュ。"),
      win: [{ t: "shake" }, { t: "say", actor: "enemy", text: L("Wrong key!", "¡Llave errónea!", "鍵がちがう！") }],
    },
    {
      kind: "run",
      prompt: L("Fix it: it must print hp: 15", "Arréglalo: debe imprimir hp: 15", "直そう：hp: 15 と表示させて"),
      starter: `using System;

var hs = new HeroS[] { new HeroS { Hp = 10 } };
var h = hs[0];
h.Hp += 5;
Console.WriteLine($"hp: {hs[0].Hp}");

struct HeroS { public int Hp; }
`,
      solution: `using System;

var hs = new HeroS[] { new HeroS { Hp = 10 } };
hs[0].Hp += 5;
Console.WriteLine($"hp: {hs[0].Hp}");

struct HeroS { public int Hp; }
`,
      hint: L("HeroS is a struct, so h is a copy of the element. Change the element in the array itself.", "HeroS es un struct, así que h es una copia del elemento. Cambia el elemento del array mismo.", "HeroS は struct なので h は要素のコピー。配列の要素そのものを変えよう。"),
      note: "value-types",
      expect: "hp: 15",
      fallback: [
        String.raw`hs\[0\]\.Hp\s*\+=\s*5`,
        String.raw`hs\[0\]\.Hp\s*=\s*hs\[0\]\.Hp\s*\+\s*5`,
        String.raw`hs\[0\]\.Hp\s*=\s*15`,
        String.raw`hs\[0\]\s*=\s*h\s*;`,
        String.raw`ref\s+(var|HeroS)\s+h\s*=\s*ref\s+hs\[0\]`,
        String.raw`class\s+HeroS`,
      ],
      explain: L("h is a COPY of the struct in the array. Change the element itself: hs[0].Hp += 5.", "h es una COPIA del struct del array. Cambia el elemento mismo: hs[0].Hp += 5.", "h は配列の struct のコピー。要素そのものを変えよう：hs[0].Hp += 5。"),
    },
  ],  notes: copiesNotes,
};

const equalityNotes: NoteDef[] = [
  note("reference-equality", L("== on classes: the same object?", "== en clases: ¿el mismo objeto?", "class の ==：同じ物？"),
    p(
      "For a class that doesn't define its own ==, a == b asks one thing: do both labels point at the SAME object? It never looks inside. Two objects built with two separate new are two objects, so == is False even if every field matches. Copying the arrow (c = a) gives True.",
      "En una clase que no define su propio ==, a == b pregunta una cosa: ¿las dos etiquetas apuntan al MISMO objeto? Nunca mira adentro. Dos objetos creados con dos new separados son dos objetos, así que == es False aunque todos los campos coincidan. Copiar la flecha (c = a) da True.",
      "自分の == を持たない class では、a == b は「2つのラベルが同じ物を指しているか」だけを調べる。中身は見ない。別々の new で作った2つは別の物なので、フィールドが全部同じでも == は False。矢印をコピーした c = a なら True だよ。",
    ),
    ex('var k1 = new Key { Id = 7 };\nvar k2 = new Key { Id = 7 };\nvar k3 = k1;\nConsole.WriteLine((k1 == k2) + " " + (k1 == k3));\n\nclass Key { public int Id; }', "False True",
      L("Same Id, but only k3 is the same object as k1", "Mismo Id, pero solo k3 es el mismo objeto que k1", "Id は同じでも、k1 と同じ物は k3 だけ")),
    p(
      "ReferenceEquals(a, b) always asks \"same object?\", whatever the type and whatever its == does. Use it when that is exactly what you mean. In these snippets it can be called directly, because every class inherits it from object.",
      "ReferenceEquals(a, b) siempre pregunta \"¿mismo objeto?\", sea cual sea el tipo y haga lo que haga su ==. Úsalo cuando eso es exactamente lo que quieres decir. En estos fragmentos se puede llamar directamente, porque toda clase lo hereda de object.",
      "ReferenceEquals(a, b) は型や == の中身に関係なく、いつも「同じ物？」を調べる。まさにそれを知りたいときに使おう。どの class も object から受けつぐので、これらのコードではそのまま呼べるよ。",
    ),
    ex('var l1 = new List<int>();\nvar l2 = l1;\nConsole.WriteLine(ReferenceEquals(l1, l2));\nl2 = new List<int>();\nConsole.WriteLine(ReferenceEquals(l1, l2));', "True\nFalse"),
    p(
      "To compare contents, compare the fields yourself, override Equals, or use a record, which compares values (you'll meet records in the Class Forest). Common mistake: expecting two look-alike objects to be == just because they print the same.",
      "Para comparar contenidos, compara los campos tú mismo, sobrescribe Equals o usa un record, que compara valores (los verás en el Bosque de Clases). Error común: esperar que dos objetos parecidos sean == solo porque se imprimen igual.",
      "中身を比べたいなら、フィールドを自分で比べるか、Equals を override するか、値で比べる record を使おう（record はクラスの森で出てくる）。よくあるミス：見た目が同じだから == になると思うこと。",
    ),
  ),
  note("value-equality", L("Equals on structs and boxes", "Equals en structs y cajas", "struct と箱の Equals"),
    p(
      "A struct is a value, so its Equals compares the values inside, field by field: two separate structs with the same fields are Equal. A struct doesn't get == for free, though: unless you define the operator, a == b on two structs doesn't compile (CS0019).",
      "Un struct es un valor, así que su Equals compara los valores de adentro, campo por campo: dos structs separados con los mismos campos son Equal. Pero un struct no recibe == gratis: si no defines el operador, a == b entre dos structs no compila (CS0019).",
      "struct は値なので、Equals は中の値をフィールドごとに比べる。別々の struct でもフィールドが同じなら Equal。ただし struct には == が自動ではつかない。演算子を定義しないと、struct 同士の a == b はコンパイルできない（CS0019）。",
    ),
    ex('var s1 = new Size2 { W = 2, H = 3 };\nvar s2 = new Size2 { W = 2, H = 3 };\nvar s3 = new Size2 { W = 3, H = 2 };\nConsole.WriteLine(s1.Equals(s2) + " " + s1.Equals(s3));\n\nstruct Size2 { public int W; public int H; }', "True False"),
    bad('var m = new Mark { V = 1 };\nvar n = new Mark { V = 1 };\nConsole.WriteLine(m == n);\n\nstruct Mark { public int V; }',
      L("Does not compile: this struct has no == operator", "No compila: este struct no tiene operador ==", "コンパイル不可：この struct に == 演算子はない")),
    p(
      "Boxes mix both worlds. Each boxing creates a new box, so two labels typed object holding the same number usually point at two different boxes: == on object labels compares the boxes (references). Equals is virtual, so the number's own Equals runs and compares the values inside.",
      "Las cajas mezclan ambos mundos. Cada boxing crea una caja nueva, así que dos etiquetas object con el mismo número suelen apuntar a dos cajas distintas: == entre etiquetas object compara las cajas (referencias). Equals es virtual, así que corre el Equals propio del número y compara los valores de adentro.",
      "箱は2つの世界がまざったもの。ボクシングのたびに新しい箱ができるので、同じ数を持つ object のラベル2つは、たいてい別々の箱を指す。object のラベル同士の == は箱（参照）を比べる。Equals は virtual なので、数自身の Equals が動いて中の値を比べるよ。",
    ),
    ex('object b1 = 2.5;\nobject b2 = b1;\nobject b3 = 2.5;\nConsole.WriteLine((b1 == b2) + " " + (b1 == b3) + " " + b1.Equals(b3));', "True False True",
      L("b2 shares b1's box; b3 is a new box with an equal value", "b2 comparte la caja de b1; b3 es otra caja con valor igual", "b2 は b1 と同じ箱、b3 は同じ値の新しい箱")),
  ),
  note("string-equality", L("Comparing strings", "Comparar strings", "文字列の比べ方"),
    p(
      "string is a class, but it defines its own == that compares the TEXT, letter by letter. Two different string objects with the same letters are ==, even though ReferenceEquals says they are different objects. A string built at runtime (by ToLower, Replace, new string...) is usually a new object.",
      "string es una clase, pero define su propio == que compara el TEXTO, letra por letra. Dos objetos string distintos con las mismas letras son ==, aunque ReferenceEquals diga que son objetos distintos. Un string construido al ejecutar (con ToLower, Replace, new string...) suele ser un objeto nuevo.",
      "string は class だけど、文字を1つずつ比べる自分専用の == を持っている。同じ文字の別々の string は、ReferenceEquals では別の物でも == は True。実行中に作った文字列（ToLower、Replace、new string など）は、ふつう新しい物だよ。",
    ),
    ex('string w1 = "star";\nstring w2 = new string(new[] { \'s\', \'t\', \'a\', \'r\' });\nConsole.WriteLine((w1 == w2) + " " + ReferenceEquals(w1, w2));', "True False"),
    p(
      "Which == runs is chosen by the compiler from the labels' types, not from the objects. If both labels are typed object, the compiler only knows object's ==, which compares references, even when strings are inside. Equals is different: it is virtual, so the real object (a string) decides and the text is compared. Casting to string also fixes it.",
      "Qué == se ejecuta lo elige el compilador según el tipo de las etiquetas, no según los objetos. Si ambas etiquetas son object, el compilador solo conoce el == de object, que compara referencias, aunque adentro haya strings. Equals es distinto: es virtual, así que decide el objeto real (un string) y se compara el texto. Hacer cast a string también lo arregla.",
      "どの == を使うかは、物ではなくラベルの型からコンパイラが決める。両方のラベルが object 型なら、コンパイラが知っているのは参照を比べる object の ==。中身が文字列でもね。Equals はちがう。virtual なので本当の物（string）が決めて、文字を比べる。string へのキャストでも直せるよ。",
    ),
    ex('object o1 = "star";\nobject o2 = new string(new[] { \'s\', \'t\', \'a\', \'r\' });\nConsole.WriteLine((string)o1 == (string)o2);', "True",
      L("Cast to string, and string's text == is used", "Con cast a string se usa el == de texto", "string にキャストすれば文字比較の == になる")),
    p(
      "== on strings is case-sensitive: \"Owl\" and \"owl\" are different. To ignore case, call string.Equals(a, b, StringComparison.OrdinalIgnoreCase). Common mistake: comparing a.ToLower() == b.ToLower(), which works but builds two extra strings just to compare.",
      "== en strings distingue mayúsculas: \"Owl\" y \"owl\" son distintos. Para ignorarlas, llama a string.Equals(a, b, StringComparison.OrdinalIgnoreCase). Error común: comparar a.ToLower() == b.ToLower(), que funciona pero crea dos strings extra solo para comparar.",
      "文字列の == は大文字と小文字を区別する。\"Owl\" と \"owl\" は別物。区別しないなら string.Equals(a, b, StringComparison.OrdinalIgnoreCase) を使おう。よくあるミス：a.ToLower() == b.ToLower() で比べること。動くけど、比べるためだけに文字列を2つ余分に作ってしまう。",
    ),
    ex('Console.WriteLine("Owl" == "owl");\nConsole.WriteLine(string.Equals("Owl", "owl", StringComparison.OrdinalIgnoreCase));', "False\nTrue"),
  ),
];

// ─── 1.4 Equal or the same? ────────────────────────────────────────────────
const equality: LessonDef = {
  slug: "equality",
  title: L("Equal or the same?", "¿Igual o el mismo?", "同じ値？同じ物？"),
  concept: "equality",
  mode: "lesson",
  xp: 70,
  enemy: "ghost",
  enemyName: L("TWIN GHOST", "FANTASMA GEMELO", "ふたごゴースト"),
  beats: [
    say(L(
      "Two gems that look alike: are they EQUAL, or the SAME gem? For classes, == asks \"the same object?\"",
      "Dos gemas parecidas: ¿son IGUALES o son la MISMA gema? En clases, == pregunta \"¿el mismo objeto?\"",
      "そっくりな宝石がふたつ。同じ値？それとも同じ物？class の == は「同じ物？」を調べるよ。",
    )),
    {
      kind: "act",
      prompt: L("Compare the look-alike gems", "Compara las gemas parecidas", "そっくりな宝石を比べよう"),
      steps: [
        { label: L("BUILD a", "CREAR a", "a を作る"), line: "var a = new PointC { X = 1 };", effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "a", value: "X=1" }] },
        { label: L("BUILD b", "CREAR b", "b を作る"), line: "var b = new PointC { X = 1 };", effects: [{ t: "enter", actor: "ally" }, { t: "item", kind: "gem", holder: "ally" }, { t: "tag", actor: "ally", text: "b", value: "X=1" }] },
        { label: L("a == b ?", "a == b ?", "a == b ？"), line: "Console.WriteLine(a == b);", effects: [{ t: "print", text: "False" }, { t: "banner", text: L("NOT THE SAME", "NO ES EL MISMO", "別の物") }], output: "False" },
        { label: L("SHARE TO c", "COMPARTIR A c", "c と共有"), line: "var c = a;", effects: [{ t: "lend", to: "ally" }] },
        { label: L("a == c ?", "a == c ?", "a == c ？"), line: "Console.WriteLine(a == c);", effects: [{ t: "print", text: "True" }, { t: "banner", text: L("SAME OBJECT", "MISMO OBJETO", "同じ物") }], output: "True" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("PointC is a class. How many times was new used, and what does == on a class compare?", "PointC es una clase. ¿Cuántas veces se usó new, y qué compara == en una clase?", "PointC は class。new は何回使われた？class の == は何を比べる？"),
      note: "reference-equality",
      code: "var a = new PointC { X = 1 };\nvar b = new PointC { X = 1 };\nConsole.WriteLine(a == b);\n\nclass PointC { public int X; }",
      options: ["False", "True"],
      answer: 0,
      output: "False",
      check: { compiles: true, stdout: "False" },
      explain: L("Two new objects, two places in memory. For a class, == compares references.", "Dos objetos nuevos, dos lugares en memoria. En una clase, == compara referencias.", "new がふたつで物もふたつ。class の == は参照を比べる。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("b = a copies the arrow. How many objects are there, and what question does ReferenceEquals ask?", "b = a copia la flecha. ¿Cuántos objetos hay, y qué pregunta hace ReferenceEquals?", "b = a は矢印のコピー。物はいくつ？ReferenceEquals は何を調べる？"),
      note: "reference-equality",
      code: "var a = new PointC { X = 1 };\nvar b = a;\nConsole.WriteLine(ReferenceEquals(a, b));\n\nclass PointC { public int X; }",
      options: ["True", "False"],
      answer: 0,
      output: "True",
      check: { compiles: true, stdout: "True" },
      explain: L("b = a copies the arrow: both point at one object. ReferenceEquals always asks \"same object?\"", "b = a copia la flecha: ambos apuntan a un objeto. ReferenceEquals siempre pregunta \"¿mismo objeto?\"", "b = a は矢印のコピー。同じ物を指す。ReferenceEquals はいつも「同じ物？」を調べる。"),
    },
    say(L(
      "Structs are values, so Equals compares their fields one by one.",
      "Los structs son valores, así que Equals compara sus campos uno por uno.",
      "struct は値なので、Equals はフィールドをひとつずつ比べるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("PointS is a struct. For a value type, does Equals look at identity or at the fields inside?", "PointS es un struct. En un tipo de valor, ¿Equals mira la identidad o los campos de adentro?", "PointS は struct。値型の Equals は「同じ物か」と「中のフィールド」のどちらを見る？"),
      note: "value-equality",
      code: "var a = new PointS { X = 1 };\nvar b = new PointS { X = 1 };\nConsole.WriteLine(a.Equals(b));\n\nstruct PointS { public int X; }",
      options: ["True", "False"],
      answer: 0,
      output: "True",
      check: { compiles: true, stdout: "True" },
      explain: L("For a struct, Equals checks the values inside: both have X = 1.", "En un struct, Equals revisa los valores de adentro: ambos tienen X = 1.", "struct の Equals は中の値を比べる。どちらも X = 1。"),
    },
    say(L(
      "string is a class, but its == compares TEXT. Two different string objects with the same letters are ==.",
      "string es una clase, pero su == compara TEXTO. Dos objetos string distintos con las mismas letras son ==.",
      "string は class だけど、== は文字の中身を比べる。別の物でも同じ文字なら == だよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("Two questions: does string's == compare text or objects? And does ToLower() build a new object?", "Dos preguntas: ¿el == de string compara texto u objetos? ¿Y ToLower() construye un objeto nuevo?", "2つ考えよう。string の == は文字と物のどちらを比べる？ToLower() は新しい物を作る？"),
      note: "string-equality",
      code: `string a = "hi";\nstring b = "HI".ToLower();\nConsole.WriteLine((a == b) + " " + ReferenceEquals(a, b));`,
      options: ["True False", "True True", "False False"],
      answer: 0,
      output: "True False",
      check: { compiles: true, stdout: "True False" },
      explain: L("ToLower() builds a new string object. Same text, so == is True; different objects, so ReferenceEquals is False.", "ToLower() crea un objeto string nuevo. Mismo texto: == es True; objetos distintos: ReferenceEquals es False.", "ToLower() は新しい文字列を作る。文字は同じで == は True、物は別で False。"),
    },
    say(L(
      "But if the labels are typed object, == forgets about text and asks \"same object?\" Equals still compares text.",
      "Pero si las etiquetas son de tipo object, == olvida el texto y pregunta \"¿mismo objeto?\". Equals sigue comparando texto.",
      "でもラベルが object 型だと、== は「同じ物？」を調べる。Equals は文字を比べたままだよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("The labels are typed object. Which == does the compiler pick for that type? Equals is virtual.", "Las etiquetas son de tipo object. ¿Qué == elige el compilador para ese tipo? Equals es virtual.", "ラベルは object 型。その型でコンパイラが選ぶ == は？Equals は virtual だよ。"),
      note: "string-equality",
      code: `object a = "hi";\nobject b = "HI".ToLower();\nConsole.WriteLine((a == b) + " " + a.Equals(b));`,
      options: ["False True", "True True", "False False"],
      answer: 0,
      output: "False True",
      check: { compiles: true, stdout: "False True" },
      explain: L("== on two object labels compares references. Equals is virtual, so string's own text check runs.", "== entre dos etiquetas object compara referencias. Equals es virtual, así que corre la comparación de texto de string.", "object 同士の == は参照を比べる。Equals は virtual なので string の文字比較が動く。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("Each boxing makes its own box. == on object labels compares boxes; what does Equals compare?", "Cada boxing crea su propia caja. == entre etiquetas object compara cajas; ¿qué compara Equals?", "ボクシングごとに箱ができる。object の == は箱を比べる。Equals は何を比べる？"),
      note: "value-equality",
      code: `int x = 5;\nobject o1 = x;\nobject o2 = x;\nConsole.WriteLine((o1 == o2) + " " + o1.Equals(o2));`,
      options: ["False True", "True True", "True False"],
      answer: 0,
      output: "False True",
      check: { compiles: true, stdout: "False True" },
      explain: L("Each boxing makes a new box. == compares the two boxes; Equals compares the 5s inside.", "Cada boxing crea una caja nueva. == compara las dos cajas; Equals compara los 5 de adentro.", "ボクシングのたびに新しい箱。== は箱同士を、Equals は中の 5 を比べる。"),
      win: [{ t: "item", kind: "shield", holder: "hero" }, { t: "enter", actor: "ally" }, { t: "item", kind: "shield", holder: "ally" }, { t: "print", text: "False True" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      hint: L("Does == care about upper and lower case? Read the name of the comparison option carefully.", "¿A == le importan las mayúsculas y minúsculas? Lee con cuidado el nombre de la opción de comparación.", "== は大文字と小文字を区別する？比較オプションの名前をよく読もう。"),
      note: "string-equality",
      code: `bool same = string.Equals("ADA", "ada", StringComparison.OrdinalIgnoreCase);\nConsole.WriteLine(same + " " + ("ADA" == "ada"));`,
      options: ["True False", "True True", "False False"],
      answer: 0,
      output: "True False",
      check: { compiles: true, stdout: "True False" },
      explain: L("== is case-sensitive. OrdinalIgnoreCase tells Equals to ignore upper and lower case.", "== distingue mayúsculas. OrdinalIgnoreCase le dice a Equals que las ignore.", "== は大文字小文字を区別する。OrdinalIgnoreCase なら区別しない。"),
    },
    {
      kind: "run",
      prompt: L("Fix it: it must print match: True", "Arréglalo: debe imprimir match: True", "直そう：match: True と表示させて"),
      starter: `using System;

object a = "gem";
object b = "GEM".ToLower();
Console.WriteLine($"match: {a == b}");
`,
      solution: `using System;

object a = "gem";
object b = "GEM".ToLower();
Console.WriteLine($"match: {a.Equals(b)}");
`,
      hint: L("a and b are typed object, so == compares references. Use the comparison that lets the string itself decide.", "a y b son de tipo object, así que == compara referencias. Usa la comparación que deja decidir al string.", "a と b は object 型なので == は参照比較。string 自身が決める比べ方を使おう。"),
      note: "string-equality",
      expect: "match: True",
      fallback: [
        String.raw`a\.Equals\(\s*b\s*\)`,
        String.raw`b\.Equals\(\s*a\s*\)`,
        String.raw`(object\.|string\.)?Equals\(\s*a\s*,\s*b\s*\)`,
        String.raw`string\s+a\s*=[\s\S]*string\s+b\s*=`,
        String.raw`\(string\)\s*a\s*==\s*\(string\)\s*b`,
      ],
      explain: L("a and b are typed object, so == compares references. a.Equals(b) compares the text.", "a y b son de tipo object, así que == compara referencias. a.Equals(b) compara el texto.", "a と b は object 型なので == は参照比較。a.Equals(b) なら文字を比べる。"),
    },
  ],  notes: equalityNotes,
};

// The boss recaps the whole region: one short note per idea it tests.
const bossNotes: NoteDef[] = [
  note("recap-numbers-text", L("Recap: + and integer division", "Repaso: + y división entera", "復習：+ と整数の割り算"),
    p(
      "+ is read left to right, one step at a time. Between two numbers it adds; as soon as a string is on one side, it glues text, and every + after that glues too. Parentheses change the order.",
      "+ se lee de izquierda a derecha, paso a paso. Entre dos números suma; en cuanto hay un string en un lado, pega texto, y cada + siguiente también pega. Los paréntesis cambian el orden.",
      "+ は左から1つずつ計算する。数同士なら足し算。片方に string が来たら文字をつなげ、そのあとの + も全部つなげる。かっこで順番を変えられるよ。",
    ),
    p(
      "int / int is integer division: the decimals are dropped, never rounded. Make one side a double (2.0, or a cast like (double)n) before dividing to keep them. % gives the remainder.",
      "int / int es división entera: los decimales se descartan, nunca se redondean. Haz que un lado sea double (2.0, o un cast como (double)n) antes de dividir para conservarlos. % da el resto.",
      "int ÷ int は整数の割り算。小数は四捨五入されずに捨てられる。残したいなら割る前に片方を double に（2.0 や (double)n のキャスト）。% は余りだよ。",
    ),
    ex('Console.WriteLine(2 + 3 + "!" + 2 + 3);\nConsole.WriteLine(11 / 4 + " " + 11 % 4 + " " + 11 / 4.0);', "5!23\n2 3 2.75"),
  ),
  note("recap-strings-null", L("Recap: strings and null", "Repaso: strings y null", "復習：文字列と null"),
    p(
      "Strings never change. ToUpper() and friends return a NEW string; the label keeps the old one unless you store the result back. Another label that shared the old text still shows it.",
      "Los strings nunca cambian. ToUpper() y similares devuelven un string NUEVO; la etiqueta conserva el viejo salvo que guardes el resultado. Otra etiqueta que compartía el texto viejo lo sigue mostrando.",
      "文字列は変わらない。ToUpper() などは新しい文字列を返す。結果を入れ直さないかぎり、ラベルは古いまま。古い文字を共有していた別のラベルも古いままだよ。",
    ),
    p(
      "a?.B gives null instead of crashing when a is null, and skips B entirely. x ?? y replaces a null x with y. Together they turn \"maybe nothing\" into a safe value.",
      "a?.B da null en vez de fallar cuando a es null, y se salta B por completo. x ?? y cambia un x null por y. Juntos convierten \"quizás nada\" en un valor seguro.",
      "a?.B は a が null のときクラッシュせず null を返し、B は呼ばない。x ?? y は null の x を y に置きかえる。組み合わせれば「何もないかも」を安全な値にできる。",
    ),
    ex('string? hat = null;\nstring shown = hat ?? "none";\nstring loud = shown.ToUpper();\nConsole.WriteLine(shown + " " + loud);', "none NONE"),
  ),
  note("recap-copy-share", L("Recap: copied or shared?", "Repaso: ¿copiado o compartido?", "復習：コピー？共有？"),
    p(
      "Value types (int, double, bool, struct) are copied on = and when passed to a method. Reference types (class, arrays) share one object: = and method calls copy only the arrow, so changes to the object's fields are seen everywhere.",
      "Los tipos de valor (int, double, bool, struct) se copian con = y al pasarlos a un método. Los tipos de referencia (class, arrays) comparten un objeto: = y las llamadas copian solo la flecha, así que los cambios en los campos del objeto se ven en todos lados.",
      "値型（int、double、bool、struct）は = でもメソッドに渡すときもコピーされる。参照型（class、配列）は1つの物を共有する。= や呼び出しでコピーされるのは矢印だけなので、物のフィールドの変更はどこからでも見えるよ。",
    ),
    ex('var r = new Raft { Logs = 2 };\nint n = 2;\nLoad(r, n);\nConsole.WriteLine(r.Logs + " " + n);\n\nstatic void Load(Raft raft, int k) { raft.Logs += 1; k += 1; }\nclass Raft { public int Logs; }', "3 2",
      L("The shared raft changed; the copied int didn't", "La balsa compartida cambió; el int copiado no", "共有のいかだは変わり、コピーの int は変わらない")),
    p(
      "To let a method change the caller's own variable, pass it with ref, written both on the parameter and at the call. Every parameter you want to change needs its own ref.",
      "Para que un método cambie la variable misma de quien llama, pásala con ref, escrito tanto en el parámetro como en la llamada. Cada parámetro que quieras cambiar necesita su propio ref.",
      "呼び出し側の変数そのものをメソッドで変えたいなら ref で渡す。引数と呼び出しの両方に書くこと。変えたい引数それぞれに ref が必要だよ。",
    ),
    ex('int coins = 1;\nAdd(ref coins);\nConsole.WriteLine(coins);\n\nstatic void Add(ref int c) { c += 4; }', "5"),
  ),
  note("recap-boxing-equality", L("Recap: boxes and equality", "Repaso: cajas e igualdad", "復習：箱と等価性"),
    p(
      "Putting a value into an object label boxes a COPY of it. Unboxing with (int)o gives back another copy; changing that copy, or the original variable, never touches the box. Each boxing makes a new box.",
      "Meter un valor en una etiqueta object empaqueta una COPIA. Desempaquetar con (int)o devuelve otra copia; cambiar esa copia, o la variable original, nunca toca la caja. Cada boxing crea una caja nueva.",
      "値を object のラベルに入れると、コピーが箱に入る。(int)o で取り出すとまた別のコピー。そのコピーや元の変数を変えても箱は変わらない。ボクシングのたびに新しい箱ができる。",
    ),
    p(
      "== on two object labels compares references: are they the same box? Equals is virtual, so the value inside decides, and two boxes with equal values are Equal.",
      "== entre dos etiquetas object compara referencias: ¿son la misma caja? Equals es virtual, así que decide el valor de adentro, y dos cajas con valores iguales son Equal.",
      "object のラベル同士の == は参照を比べる。同じ箱かどうかだね。Equals は virtual なので中の値が決め、同じ値の箱2つは Equal になる。",
    ),
    ex('object box = 9;\nint v = (int)box + 1;\nobject same = box;\nConsole.WriteLine(v + " " + box + " " + (same == box));', "10 9 True",
      L("v is a new int; same points at the very same box", "v es un int nuevo; same apunta a la misma caja", "v は新しい int、same はまったく同じ箱を指す")),
  ),
];

// ─── 1.5 Boss: the Copy Golem ──────────────────────────────────────────────
const copyGolem: LessonDef = {
  slug: "copy-golem",
  title: L("The Copy Golem", "El Gólem Copión", "コピーゴーレム"),
  concept: "value-reference",
  mode: "boss",
  xp: 160,
  enemy: "golem",
  enemyName: L("COPY GOLEM", "GÓLEM COPIÓN", "コピーゴーレム"),
  beats: [
    enemySays(L(
      "I AM THE COPY GOLEM. I copy some things and share others. Can you tell which is which?",
      "SOY EL GÓLEM COPIÓN. Copio unas cosas y comparto otras. ¿Sabes distinguir cuál es cuál?",
      "我はコピーゴーレム。コピーするもの、共有するもの。見分けられるか？",
    )),
    { kind: "predict", time: 15, prompt: PRINT, hint: L("The very first piece is text. Once text appears, what does every following + do?", "La primera pieza es texto. Una vez que aparece texto, ¿qué hace cada + siguiente?", "最初の部品は文字。文字が出てきたら、そのあとの + は何をする？"), note: "recap-numbers-text", code: `Console.WriteLine("1" + 2 + 3);`, options: ["123", "6", "15"], answer: 0, output: "123", check: { compiles: true, stdout: "123" }, explain: L("Text comes first, so each + glues: \"1\" + 2 is \"12\", then \"123\".", "El texto va primero, así que cada + pega: \"1\" + 2 es \"12\", luego \"123\".", "先頭が文字列なので + はつなげる。\"12\" → \"123\"。") },
    { kind: "predict", time: 12, prompt: PRINT, hint: L("Both are int. What happens to the decimal part of an int / int division?", "Ambos son int. ¿Qué pasa con la parte decimal de una división int / int?", "どちらも int。int ÷ int の小数部分はどうなる？"), note: "recap-numbers-text", code: "int total = 10;\nint count = 4;\nConsole.WriteLine(total / count);", options: ["2", "2.5", "3"], answer: 0, output: "2", check: { compiles: true, stdout: "2" }, explain: L("int / int drops the decimals: 10 / 4 is 2.", "int / int descarta decimales: 10 / 4 es 2.", "int ÷ int は小数を捨てる。10 / 4 は 2。") },
    { kind: "predict", time: 15, prompt: PRINT, hint: L("ToUpper() returns a new string, and only a is pointed at it. What does b still hold?", "ToUpper() devuelve un string nuevo, y solo a pasa a apuntarlo. ¿Qué guarda todavía b?", "ToUpper() は新しい文字列を返し、それを指すのは a だけ。b はまだ何を持っている？"), note: "recap-strings-null", code: `string a = "sun";\nstring b = a;\na = a.ToUpper();\nConsole.WriteLine(a + " " + b);`, options: ["SUN sun", "SUN SUN", "sun sun"], answer: 0, output: "SUN sun", check: { compiles: true, stdout: "SUN sun" }, explain: L("ToUpper made a new string for a. b still holds the old one.", "ToUpper creó un string nuevo para a. b sigue con el viejo.", "ToUpper は a 用に新しい文字列を作った。b は元のまま。") },
    { kind: "predict", time: 15, prompt: PRINT, hint: L("s is null. Does ?. call ToUpper at all? Then see what ?? does with the result.", "s es null. ¿?. llega a llamar a ToUpper? Luego mira qué hace ?? con el resultado.", "s は null。?. は ToUpper を呼ぶ？そのあと ?? が結果をどうするか見よう。"), note: "recap-strings-null", code: `string? s = null;\nConsole.WriteLine(s?.ToUpper() ?? "empty");`, options: ["empty", "EMPTY", L("Crash", "Falla", "クラッシュ")], answer: 0, output: "empty", check: { compiles: true, stdout: "empty" }, explain: L("?. returns null without calling ToUpper, and ?? swaps in \"empty\".", "?. devuelve null sin llamar a ToUpper, y ?? pone \"empty\".", "?. は ToUpper を呼ばず null。?? が \"empty\" にする。") },
    { kind: "predict", time: 15, prompt: PRINT, hint: L("PointC is a class. Inside Move, is the parameter pointed at a new object, or is the shared one changed?", "PointC es una clase. Dentro de Move, ¿el parámetro apunta a otro objeto, o se cambia el compartido?", "PointC は class。Move の中で引数は新しい物を指す？それとも共有の物を変える？"), note: "recap-copy-share", code: "var p = new PointC { X = 1 };\nMove(p);\nConsole.WriteLine(p.X);\n\nstatic void Move(PointC p) { p.X = 50; }\nclass PointC { public int X; }", options: ["50", "1"], answer: 0, output: "50", check: { compiles: true, stdout: "50" }, explain: L("Both arrows point at one object, so changing p.X inside is seen outside.", "Ambas flechas apuntan a un objeto, así que cambiar p.X adentro se ve afuera.", "どちらの矢印も同じ物を指す。中で p.X を変えれば外にも見える。") },
    { kind: "predict", time: 15, prompt: PRINT, hint: L("The box holds a copy of i, and unboxing gives yet another copy. Does adding to that copy touch i?", "La caja guarda una copia de i, y desempaquetar da otra copia más. ¿Sumarle a esa copia toca i?", "箱には i のコピー、取り出すとさらに別のコピー。それに足したら i は変わる？"), note: "recap-boxing-equality", code: "int i = 7;\nobject o = i;\nint j = (int)o + 1;\nConsole.WriteLine(i + \" \" + j);", options: ["7 8", "8 8", "7 7"], answer: 0, output: "7 8", check: { compiles: true, stdout: "7 8" }, explain: L("Unboxing as int gives back a copy of 7; adding 1 doesn't touch i.", "Desempaquetar como int devuelve una copia de 7; sumar 1 no toca i.", "int で取り出すと 7 のコピー。1 足しても i は変わらない。") },
    { kind: "predict", time: 15, prompt: PRINT, hint: L("Each line boxes separately. == on object labels compares boxes; Equals asks the value inside.", "Cada línea empaqueta por separado. == entre etiquetas object compara cajas; Equals pregunta al valor de adentro.", "各行で別々にボクシング。object の == は箱を、Equals は中の値に聞く。"), note: "recap-boxing-equality", code: "object a = 5;\nobject b = 5;\nConsole.WriteLine((a == b) + \" \" + a.Equals(b));", options: ["False True", "True True", "False False"], answer: 0, output: "False True", check: { compiles: true, stdout: "False True" }, explain: L("Two boxes: == compares the boxes, Equals the values inside.", "Dos cajas: == compara las cajas, Equals los valores de adentro.", "箱がふたつ。== は箱を、Equals は中の値を比べる。") },
    {
      kind: "pick",
      time: 18,
      prompt: L("Make the swap stick", "Haz que el intercambio dure", "入れかえを反映させよう"),
      hint: L("Look at how the call passes x, and how the second parameter is declared. The first must match.", "Mira cómo la llamada pasa x y cómo se declara el segundo parámetro. El primero debe coincidir.", "呼び出しでの x の渡し方と、2つめの引数の宣言を見よう。1つめも合わせる。"),
      note: "recap-copy-share",
      code: "int x = 1, y = 2;\nSwap(ref x, ref y);\nConsole.WriteLine(x + \" \" + y);\n\nstatic void Swap(___ int a, ref int b) { int t = a; a = b; b = t; }",
      options: ["ref", "out", "in"],
      answer: 0,
      check: { compiles: true, stdout: "2 1", wrongFail: true },
      explain: L("Both parameters must be ref to change the caller's labels.", "Ambos parámetros deben ser ref para cambiar las etiquetas de quien llama.", "呼び出し側のラベルを変えるには両方 ref。"),
    },
    {
      kind: "run",
      time: 60,
      prompt: L("Fix it: it must print hp: 70", "Arréglalo: debe imprimir hp: 70", "直そう：hp: 70 と表示させて"),
      starter: `using System;

int hp = 50;
Heal(hp);
Console.WriteLine($"hp: {hp}");

static void Heal(int hp) { hp += 20; }
`,
      solution: `using System;

int hp = 50;
Heal(ref hp);
Console.WriteLine($"hp: {hp}");

static void Heal(ref int hp) { hp += 20; }
`,
      hint: L("Heal receives a copy of the int. Pass the variable itself, or have Heal return the new value.", "Heal recibe una copia del int. Pasa la variable misma, o haz que Heal devuelva el valor nuevo.", "Heal は int のコピーを受け取る。変数そのものを渡すか、新しい値を返させよう。"),
      note: "recap-copy-share",
      expect: "hp: 70",
      fallback: [
        String.raw`Heal\(\s*ref\s+hp\s*\)`,
        String.raw`hp\s*=\s*Heal\(\s*hp\s*\)`,
      ],
      explain: L("int is copied into Heal. Pass it with ref (or return the new value) so the caller's hp changes.", "int se copia al entrar en Heal. Pásalo con ref (o devuelve el valor nuevo) para cambiar el hp de quien llama.", "int は Heal にコピーで渡る。ref で渡す（か新しい値を返す）と hp が変わる。"),
    },
    enemySays(L(
      "Copied or shared, you saw through me... The Class Forest waits beyond the village.",
      "Copiado o compartido, viste a través de mí... El Bosque de Clases te espera tras la aldea.",
      "コピーも共有も見破られた…村の先でクラスの森が待っている。",
    )),
  ],  notes: bossNotes,
};

export const valueVillage: RegionDef = {
  slug: "value-village",
  name: L("Value Village", "Aldea de los Valores", "バリュー村"),
  subtitle: L("Types, null, copies and equality", "Tipos, null, copias e igualdad", "型・null・コピー・等価性"),
  theme: "village",
  lessons: [typesAndVariables, stringsAndNull, valueAndReference, equality, copyGolem],
};
