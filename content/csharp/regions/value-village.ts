import type { Beat, LessonDef, RegionDef, Text } from "../../../lib/content/types.ts";
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
      code: `var x = 5;\nx = "five";`,
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
      explain: L("var x = 5 makes x an int. Error CS0029: a string can't go there.", "var x = 5 hace que x sea int. Error CS0029: un string no cabe ahí.", "var x = 5 で x は int。エラー CS0029：string は入らない。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
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
  ],
};

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
      expect: "len: 0",
      fallback: [
        String.raw`nick\?\.Length\s*\?\?\s*0`,
        String.raw`nick\s*==\s*null\s*\?\s*0`,
        String.raw`nick\s+is\s+null\s*\?\s*0`,
        String.raw`\(\s*nick\s*\?\?\s*""\s*\)\.Length`,
      ],
      explain: L("nick is null, so .Length crashes. nick?.Length ?? 0 gives 0 instead.", "nick es null, así que .Length falla. nick?.Length ?? 0 da 0 en su lugar.", "nick は null なので .Length でクラッシュ。nick?.Length ?? 0 なら 0 になる。"),
    },
  ],
};

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
  ],
};

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
  ],
};

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
    { kind: "predict", time: 15, prompt: PRINT, code: `Console.WriteLine("1" + 2 + 3);`, options: ["123", "6", "15"], answer: 0, output: "123", check: { compiles: true, stdout: "123" }, explain: L("Text comes first, so each + glues: \"1\" + 2 is \"12\", then \"123\".", "El texto va primero, así que cada + pega: \"1\" + 2 es \"12\", luego \"123\".", "先頭が文字列なので + はつなげる。\"12\" → \"123\"。") },
    { kind: "predict", time: 12, prompt: PRINT, code: "int total = 10;\nint count = 4;\nConsole.WriteLine(total / count);", options: ["2", "2.5", "3"], answer: 0, output: "2", check: { compiles: true, stdout: "2" }, explain: L("int / int drops the decimals: 10 / 4 is 2.", "int / int descarta decimales: 10 / 4 es 2.", "int ÷ int は小数を捨てる。10 / 4 は 2。") },
    { kind: "predict", time: 15, prompt: PRINT, code: `string a = "sun";\nstring b = a;\na = a.ToUpper();\nConsole.WriteLine(a + " " + b);`, options: ["SUN sun", "SUN SUN", "sun sun"], answer: 0, output: "SUN sun", check: { compiles: true, stdout: "SUN sun" }, explain: L("ToUpper made a new string for a. b still holds the old one.", "ToUpper creó un string nuevo para a. b sigue con el viejo.", "ToUpper は a 用に新しい文字列を作った。b は元のまま。") },
    { kind: "predict", time: 15, prompt: PRINT, code: `string? s = null;\nConsole.WriteLine(s?.ToUpper() ?? "empty");`, options: ["empty", "EMPTY", L("Crash", "Falla", "クラッシュ")], answer: 0, output: "empty", check: { compiles: true, stdout: "empty" }, explain: L("?. returns null without calling ToUpper, and ?? swaps in \"empty\".", "?. devuelve null sin llamar a ToUpper, y ?? pone \"empty\".", "?. は ToUpper を呼ばず null。?? が \"empty\" にする。") },
    { kind: "predict", time: 15, prompt: PRINT, code: "var p = new PointC { X = 1 };\nMove(p);\nConsole.WriteLine(p.X);\n\nstatic void Move(PointC p) { p.X = 50; }\nclass PointC { public int X; }", options: ["50", "1"], answer: 0, output: "50", check: { compiles: true, stdout: "50" }, explain: L("Both arrows point at one object, so changing p.X inside is seen outside.", "Ambas flechas apuntan a un objeto, así que cambiar p.X adentro se ve afuera.", "どちらの矢印も同じ物を指す。中で p.X を変えれば外にも見える。") },
    { kind: "predict", time: 15, prompt: PRINT, code: "int i = 7;\nobject o = i;\nint j = (int)o + 1;\nConsole.WriteLine(i + \" \" + j);", options: ["7 8", "8 8", "7 7"], answer: 0, output: "7 8", check: { compiles: true, stdout: "7 8" }, explain: L("Unboxing as int gives back a copy of 7; adding 1 doesn't touch i.", "Desempaquetar como int devuelve una copia de 7; sumar 1 no toca i.", "int で取り出すと 7 のコピー。1 足しても i は変わらない。") },
    { kind: "predict", time: 15, prompt: PRINT, code: "object a = 5;\nobject b = 5;\nConsole.WriteLine((a == b) + \" \" + a.Equals(b));", options: ["False True", "True True", "False False"], answer: 0, output: "False True", check: { compiles: true, stdout: "False True" }, explain: L("Two boxes: == compares the boxes, Equals the values inside.", "Dos cajas: == compara las cajas, Equals los valores de adentro.", "箱がふたつ。== は箱を、Equals は中の値を比べる。") },
    {
      kind: "pick",
      time: 18,
      prompt: L("Make the swap stick", "Haz que el intercambio dure", "入れかえを反映させよう"),
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
  ],
};

export const valueVillage: RegionDef = {
  slug: "value-village",
  name: L("Value Village", "Aldea de los Valores", "バリュー村"),
  subtitle: L("Types, null, copies and equality", "Tipos, null, copias e igualdad", "型・null・コピー・等価性"),
  theme: "village",
  lessons: [typesAndVariables, stringsAndNull, valueAndReference, equality, copyGolem],
};
