import type { ExamDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import {
  anagramsTask, composeTask, greetTask, letterCountsTask, loadAllTask, lruCacheTask, moneyTask, parseConfigTask,
  retryTask, reverseWordsTask, topSpendersTask, withdrawTask,
} from "./tasks.ts";
import { juniorTraceDebug, midTraceDebug, seniorTraceDebug } from "./trace-debug.ts";

// Entry exams that simulate company screenings for C# / .NET roles.
// Topics, levels and bank sizes follow docs/research/csharp-curriculum.md ("Entry exams") and
// docs/research/csharp-hiring-assessments.md. Every compiler or runtime claim carries a `check` run on
// .NET 10 (Compiler Explorer): `npm run content:verify -- --lang=csharp --only=exam:`.
// Snippets omit the common `using` lines (System, Collections.Generic, Linq, Text, Threading.Tasks):
// the validator adds them. Never machine-check Dictionary/HashSet order, hash codes, GC timing or races.

const code = (...lines: string[]) => lines.join("\n");

const YN = [L("Yes", "Sí", "はい"), L("No", "No", "いいえ")];
const PRINTS = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");

export const exams: ExamDef[] = [
  // ─── JUNIOR ───────────────────────────────────────────────────────────────
  {
    slug: "junior",
    level: "junior",
    title: L("Junior C# Developer", "C# Developer Junior", "ジュニア C# 開発者"),
    description: L(
      "Online skills test for a junior .NET role: types, strings, null, copies, classes, collections, LINQ, exceptions.",
      "Test en línea para un puesto junior .NET: tipos, strings, null, copias, clases, colecciones, LINQ y excepciones.",
      "ジュニア .NET 職のオンライン試験：型、文字列、null、コピー、クラス、コレクション、LINQ、例外。",
    ),
    count: 12,
    passPct: 70,
    secondsPerQuestion: 30,
    codeCount: 1,
    questions: [
      ...juniorTraceDebug,
      reverseWordsTask, letterCountsTask, withdrawTask, greetTask,
      // types-strings
      {
        topic: "types-strings", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: "Console.WriteLine(7 / 2);",
        options: ["3", "3.5", "4"], answer: 0,
        explain: L(
          "Both operands are int, so this is integer division: the fraction is cut off. Write 7 / 2.0 to get 3.5.",
          "Ambos operandos son int, así que es división entera: se corta la parte decimal. Escribe 7 / 2.0 para obtener 3.5.",
          "両方 int なので整数の割り算になり、小数部分は切り捨て。3.5 がほしいなら 7 / 2.0 と書こう。",
        ),
        check: { compiles: true, stdout: "3" },
      },
      {
        topic: "types-strings", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code('string s = "hero";', "s.ToUpper();", "Console.WriteLine(s);"),
        options: ["hero", "HERO", "Hero"], answer: 0,
        explain: L(
          "Strings are immutable: ToUpper returns a NEW string, and here it is thrown away. Write s = s.ToUpper();",
          "Los strings son inmutables: ToUpper devuelve un string NUEVO, y aquí se descarta. Escribe s = s.ToUpper();",
          "string は不変。ToUpper は新しい文字列を返すだけで、ここでは捨てられている。s = s.ToUpper(); と書こう。",
        ),
        check: { compiles: true, stdout: "hero" },
      },
      {
        topic: "types-strings", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: 'Console.WriteLine(1 + 2 + "3" + 4);',
        options: ["334", "10", "1234"], answer: 0,
        explain: L(
          "+ runs left to right: 1 + 2 is the int 3, then 3 + \"3\" becomes the string \"33\", and \"33\" + 4 is \"334\".",
          "+ se evalúa de izquierda a derecha: 1 + 2 es el int 3, luego 3 + \"3\" es el string \"33\", y \"33\" + 4 da \"334\".",
          "+ は左から順に計算。1 + 2 は int の 3、3 + \"3\" で文字列 \"33\"、\"33\" + 4 で \"334\" になる。",
        ),
        check: { compiles: true, stdout: "334" },
      },
      // nulls
      {
        topic: "nulls", difficulty: 1, kind: "type",
        prompt: L("Use 0 when hp is null", "Usa 0 cuando hp es null", "hp が null なら 0 を使う"),
        code: code("int? hp = null;", "int shown = hp ___ 0;", "Console.WriteLine(shown);"),
        answer: "??",
        explain: L(
          "?? returns the left side unless it is null, then the right side. It turns an int? into a plain int safely.",
          "?? devuelve el lado izquierdo salvo que sea null; entonces, el derecho. Convierte un int? en int de forma segura.",
          "?? は左辺が null でなければ左辺、null なら右辺を返す。int? を安全に int にできるよ。",
        ),
        check: { compiles: true, stdout: "0" },
      },
      {
        topic: "nulls", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("string? s = null;", "Console.WriteLine(s?.Length ?? -1);"),
        options: ["-1", "0", "NullReferenceException"], answer: 0,
        explain: L(
          "?. stops at null and gives null instead of crashing; ?? then replaces that null with -1.",
          "?. se detiene en null y da null en lugar de fallar; luego ?? reemplaza ese null por -1.",
          "?. は null なら落ちずに null を返し、?? がその null を -1 に置き換える。",
        ),
        check: { compiles: true, stdout: "-1" },
      },
      {
        topic: "nulls", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("string? name = null;", "Console.WriteLine(name.Length);"),
        options: [
          L("Prints 0", "Imprime 0", "0 と表示"),
          L("NullReferenceException", "NullReferenceException", "NullReferenceException"),
          L("Compile error", "Error de compilación", "コンパイルエラー"),
        ],
        answer: 1,
        explain: L(
          "Nullable reference types only WARN (CS8602): the build succeeds, and reading .Length on null crashes at runtime.",
          "Los tipos de referencia anulables solo ADVIERTEN (CS8602): compila, y leer .Length sobre null falla en ejecución.",
          "null 許容参照型は警告（CS8602）だけでビルドは通る。null の .Length を読むと実行時に落ちるよ。",
        ),
        check: { compiles: true, throws: "System.NullReferenceException" },
      },
      // value-reference
      {
        topic: "value-reference", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("var p = new PointS { X = 1 };", "var q = p;", "q.X = 99;", "Console.WriteLine(p.X);", "", "struct PointS { public int X; }"),
        options: ["1", "99", "0"], answer: 0,
        explain: L(
          "A struct is a value type: q = p copies the whole value, so changing q leaves p alone.",
          "Un struct es un tipo valor: q = p copia todo el valor, así que cambiar q no toca p.",
          "struct は値型。q = p で値ごとコピーされるので、q を変えても p はそのまま。",
        ),
        check: { compiles: true, stdout: "1" },
      },
      {
        topic: "value-reference", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("int[] a = { 1, 2, 3 };", "int[] b = a;", "b[0] = 9;", "Console.WriteLine(a[0]);"),
        options: ["1", "9", "0"], answer: 1,
        explain: L(
          "Arrays are reference types: b = a copies the reference, so both names point at the same array.",
          "Los arrays son tipos referencia: b = a copia la referencia, así que ambos nombres apuntan al mismo array.",
          "配列は参照型。b = a は参照のコピーなので、a と b は同じ配列を指している。",
        ),
        check: { compiles: true, stdout: "9" },
      },
      {
        topic: "value-reference", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code("int x = 1;", "AddOne(x);", "Console.WriteLine(x);", "", "static void AddOne(int n) { n++; }"),
        options: ["1", "2", "0"], answer: 0,
        explain: L(
          "Arguments are passed by value by default: n is a copy of x. Use ref int n to change the caller's variable.",
          "Los argumentos se pasan por valor por defecto: n es una copia de x. Usa ref int n para cambiar la variable original.",
          "引数は既定で値渡し。n は x のコピーだよ。呼び出し元の変数を変えたいなら ref int n を使う。",
        ),
        check: { compiles: true, stdout: "1" },
      },
      // equality
      {
        topic: "equality", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code('string a = "hi";', "string b = new string(new[] { 'h', 'i' });", "Console.WriteLine(a == b);"),
        options: ["True", "False"], answer: 0,
        explain: L(
          "string overloads == to compare the characters, so two different string objects with the same text are equal.",
          "string sobrecarga == para comparar los caracteres: dos objetos string distintos con el mismo texto son iguales.",
          "string は == を文字の比較として定義している。別のオブジェクトでも中身が同じなら等しい。",
        ),
        check: { compiles: true, stdout: "True" },
      },
      {
        topic: "equality", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("var a = new PointC { X = 1 };", "var b = new PointC { X = 1 };", "Console.WriteLine(a == b);", "", "class PointC { public int X; }"),
        options: ["True", "False"], answer: 1,
        explain: L(
          "For a class, == compares references by default: two separate objects are different even with equal fields.",
          "En una clase, == compara referencias por defecto: dos objetos separados son distintos aunque sus campos coincidan.",
          "クラスの == は既定で参照の比較。フィールドが同じでも別々のオブジェクトなら False。",
        ),
        check: { compiles: true, stdout: "False" },
      },
      // classes
      {
        topic: "classes", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code(
          'var h = new Hero("Ana");',
          'h.Name = "Bea";',
          "",
          "class Hero {",
          "  public string Name { get; }",
          "  public Hero(string name) => Name = name;",
          "}",
        ),
        options: YN, answer: 1,
        explain: L(
          "A get-only property can be set only in the constructor. Outside it, assignment fails with CS0200.",
          "Una propiedad solo get se asigna únicamente en el constructor. Fuera de él, asignarla falla con CS0200.",
          "get だけのプロパティはコンストラクタ内でしか代入できない。外で代入すると CS0200 エラー。",
        ),
        check: { compiles: false },
      },
      {
        topic: "classes", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(
          "new Slime();",
          "new Slime();",
          "new Slime();",
          "Console.WriteLine(Slime.Count);",
          "",
          "class Slime {",
          "  public static int Count;",
          "  public Slime() => Count++;",
          "}",
        ),
        options: ["3", "1", "0"], answer: 0,
        explain: L(
          "A static field belongs to the class, not to each object: all three constructors increment the same Count.",
          "Un campo static pertenece a la clase, no a cada objeto: los tres constructores incrementan el mismo Count.",
          "static フィールドはオブジェクトごとではなくクラスに1つ。3回のコンストラクタが同じ Count を増やす。",
        ),
        check: { compiles: true, stdout: "3" },
      },
      // inheritance
      {
        topic: "inheritance", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "Animal a = new Dog();",
          "Console.WriteLine(a.Speak());",
          "",
          'class Animal { public virtual string Speak() => "..."; }',
          'class Dog : Animal { public override string Speak() => "Woof"; }',
        ),
        options: ["Woof", "...", "Animal"], answer: 0,
        explain: L(
          "virtual + override picks the method of the real object at runtime, even through an Animal variable.",
          "virtual + override elige en ejecución el método del objeto real, aunque se use una variable Animal.",
          "virtual と override なら、Animal 型の変数でも実行時に実際のオブジェクトのメソッドが呼ばれる。",
        ),
        check: { compiles: true, stdout: "Woof" },
      },
      {
        topic: "inheritance", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "Animal a = new Cat();",
          "Dog? d = a as Dog;",
          "Console.WriteLine(d == null);",
          "",
          "class Animal { }",
          "class Dog : Animal { }",
          "class Cat : Animal { }",
        ),
        options: ["True", "False", "InvalidCastException"], answer: 0,
        explain: L(
          "as returns null when the cast fails instead of throwing. A direct (Dog)a cast would throw InvalidCastException.",
          "as devuelve null si la conversión falla, sin lanzar nada. Un cast directo (Dog)a lanzaría InvalidCastException.",
          "as はキャストに失敗すると例外ではなく null を返す。(Dog)a と直接キャストすると InvalidCastException。",
        ),
        check: { compiles: true, stdout: "True" },
      },
      // collections-generics
      {
        topic: "collections-generics", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(
          'var bag = new List<string> { "sword" };',
          'bag.Add("potion");',
          'bag.Remove("sword");',
          'Console.WriteLine(bag.Count + " " + bag[0]);',
        ),
        options: ["1 potion", "2 sword", "1 sword"], answer: 0,
        explain: L(
          "Add appends, Remove deletes the first match and shifts the rest down, so \"potion\" moves to index 0.",
          "Add agrega al final, Remove borra la primera coincidencia y corre el resto, así que \"potion\" pasa al índice 0.",
          "Add は末尾に追加、Remove は最初の一致を消して後ろを詰める。だから \"potion\" が 0 番目になる。",
        ),
        check: { compiles: true, stdout: "1 potion" },
      },
      {
        topic: "collections-generics", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("var d = new Dictionary<string, int>();", 'Console.WriteLine(d["missing"]);'),
        options: [
          L("Prints 0", "Imprime 0", "0 と表示"),
          L("Prints nothing", "No imprime nada", "何も表示しない"),
          "KeyNotFoundException",
        ],
        answer: 2,
        explain: L(
          "The indexer throws for a missing key. Use TryGetValue (or ContainsKey) when the key may not exist.",
          "El indexador lanza una excepción si falta la clave. Usa TryGetValue (o ContainsKey) si la clave puede no existir.",
          "インデクサは存在しないキーで例外を投げる。キーがないかもしれないなら TryGetValue を使おう。",
        ),
        check: { compiles: true, throws: "System.Collections.Generic.KeyNotFoundException" },
      },
      {
        topic: "collections-generics", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code("var xs = new List<int> { 1, 2, 3 };", "foreach (var x in xs)", "  if (x == 2) xs.Add(4);", 'Console.WriteLine("done");'),
        options: [
          L("Prints done", "Imprime done", "done と表示"),
          L("Loops forever", "Bucle infinito", "無限ループ"),
          "InvalidOperationException",
        ],
        answer: 2,
        explain: L(
          "Changing a List while a foreach walks it invalidates the enumerator: the next step throws. Loop over a copy instead.",
          "Cambiar una List mientras un foreach la recorre invalida el enumerador: el siguiente paso lanza. Recorre una copia.",
          "foreach で回している最中に List を変えると列挙子が無効になり、次の手順で例外。コピーを回そう。",
        ),
        check: { compiles: true, throws: "System.InvalidOperationException" },
      },
      // linq
      {
        topic: "linq", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("var xs = new[] { 5, 1, 4, 2 };", 'Console.WriteLine(string.Join(",", xs.Where(n => n > 1).OrderBy(n => n)));'),
        options: ["2,4,5", "5,4,2", "1,2,4,5"], answer: 0,
        explain: L(
          "Where keeps the items that pass the test (drops 1), then OrderBy sorts them ascending.",
          "Where conserva los elementos que pasan la prueba (quita el 1) y luego OrderBy los ordena de menor a mayor.",
          "Where で条件を満たす要素だけ残し（1 を除く）、OrderBy で昇順に並べる。",
        ),
        check: { compiles: true, stdout: "2,4,5" },
      },
      {
        topic: "linq", difficulty: 2, kind: "pick",
        prompt: L("Print 0 when nothing matches", "Imprime 0 si nada coincide", "一致なしなら 0 を表示"),
        code: code("var xs = new List<int> { 1, 3, 5 };", "int even = xs.___(n => n % 2 == 0);", "Console.WriteLine(even);"),
        options: ["First", "FirstOrDefault", "Single"], answer: 1,
        explain: L(
          "FirstOrDefault returns default (0 for int) when nothing matches. First and Single throw InvalidOperationException.",
          "FirstOrDefault devuelve default (0 para int) si nada coincide. First y Single lanzan InvalidOperationException.",
          "FirstOrDefault は一致がないと既定値（int なら 0）を返す。First と Single は InvalidOperationException。",
        ),
        check: { compiles: true, stdout: "0" },
      },
      // exceptions
      {
        topic: "exceptions", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(
          "try {",
          '  Console.Write("A ");',
          '  throw new Exception("boom");',
          "} catch (Exception e) {",
          '  Console.Write("C:" + e.Message + " ");',
          "} finally {",
          '  Console.Write("F");',
          "}",
        ),
        options: ["A C:boom F", "A F", "A C:boom"], answer: 0,
        explain: L(
          "throw jumps straight to the matching catch; finally always runs afterwards, error or not.",
          "throw salta directo al catch que coincide; finally siempre se ejecuta después, haya error o no.",
          "throw は一致する catch へ直行し、finally はエラーの有無にかかわらず最後に必ず実行される。",
        ),
        check: { compiles: true, stdout: "A C:boom F" },
      },
      {
        topic: "exceptions", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code(
          "try { int.Parse(\"x\"); }",
          'catch (Exception) { Console.WriteLine("any"); }',
          'catch (FormatException) { Console.WriteLine("format"); }',
        ),
        options: YN, answer: 1,
        explain: L(
          "catch clauses are tried in order, so the general Exception would hide FormatException: error CS0160. Put specific ones first.",
          "Los catch se prueban en orden: Exception ocultaría a FormatException, error CS0160. Pon primero los específicos.",
          "catch は上から順に試されるので、Exception が FormatException を隠してしまう（CS0160）。具体的な型を先に。",
        ),
        check: { compiles: false },
      },
    ],
  },

  // ─── MID ──────────────────────────────────────────────────────────────────
  {
    slug: "mid",
    level: "mid",
    title: L("Mid-level C# Developer", "C# Developer Semi-Senior", "中級 C# 開発者"),
    description: L(
      "Technical screen for a mid-level .NET role: boxing, equality, records, generics, closures, LINQ, using, async.",
      "Evaluación técnica para un puesto .NET semi-senior: boxing, igualdad, records, genéricos, closures, LINQ y async.",
      "中級 .NET 職の技術選考：ボックス化、等価性、レコード、ジェネリクス、クロージャ、LINQ、async。",
    ),
    count: 14,
    passPct: 70,
    secondsPerQuestion: 40,
    codeCount: 2,
    questions: [
      ...midTraceDebug,
      topSpendersTask, moneyTask, parseConfigTask, composeTask,
      // value-reference
      {
        topic: "value-reference", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("int i = 42;", "object o = i;", "i = 7;", "Console.WriteLine(o);"),
        options: ["42", "7", "0"], answer: 0,
        explain: L(
          "Boxing copies the int into a new object on the heap. Changing i later does not touch the boxed copy.",
          "El boxing copia el int en un objeto nuevo del heap. Cambiar i después no toca la copia encajada.",
          "ボックス化は int をヒープ上の新しいオブジェクトにコピーする。あとで i を変えても箱の中身は変わらない。",
        ),
        check: { compiles: true, stdout: "42" },
      },
      {
        topic: "value-reference", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code("object o = 42;", "long l = (long)o;", "Console.WriteLine(l);"),
        options: [
          L("Prints 42", "Imprime 42", "42 と表示"),
          "InvalidCastException",
          L("Compile error", "Error de compilación", "コンパイルエラー"),
        ],
        answer: 1,
        explain: L(
          "Unboxing must use the exact boxed type. o holds an int, so write (long)(int)o to unbox, then widen.",
          "El unboxing exige el tipo exacto encajado. o guarda un int, así que escribe (long)(int)o: unbox y luego amplía.",
          "アンボックスは箱の中と同じ型でないといけない。o の中身は int なので (long)(int)o と書こう。",
        ),
        check: { compiles: true, throws: "System.InvalidCastException" },
      },
      // equality
      {
        topic: "equality", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code("int x = 5;", "object o1 = x;", "object o2 = x;", 'Console.WriteLine((o1 == o2) + " " + o1.Equals(o2));'),
        options: ["False True", "True True", "True False", "False False"], answer: 0,
        explain: L(
          "Each assignment boxes a separate object, so == on object compares references (False); Equals compares values (True).",
          "Cada asignación encaja un objeto distinto: == sobre object compara referencias (False); Equals compara valores (True).",
          "代入ごとに別の箱が作られる。object の == は参照比較で False、Equals は値の比較で True。",
        ),
        check: { compiles: true, stdout: "False True" },
      },
      {
        topic: "equality", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code('object a = "hi";', 'object b = new string("hi".ToCharArray());', 'Console.WriteLine((a == b) + " " + a.Equals(b));'),
        options: ["False True", "True True", "True False"], answer: 0,
        explain: L(
          "Operators are chosen by the static type: object's == compares references. Equals is virtual, so string's runs.",
          "Los operadores se eligen por el tipo estático: el == de object compara referencias. Equals es virtual: corre el de string.",
          "演算子は変数の型で決まるので object の == は参照比較。Equals は仮想メソッドなので string 版が動く。",
        ),
        check: { compiles: true, stdout: "False True" },
      },
      // interfaces
      {
        topic: "interfaces", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "IGreeter g = new Robot();",
          "Console.WriteLine(g.Bye());",
          "",
          "interface IGreeter {",
          "  string Hi();",
          '  string Bye() => "bye";',
          "}",
          'class Robot : IGreeter { public string Hi() => "hi"; }',
        ),
        options: ["bye", "hi", L("Compile error", "Error de compilación", "コンパイルエラー")], answer: 0,
        explain: L(
          "Since C# 8 an interface can carry a default body. Robot does not implement Bye, so the default runs.",
          "Desde C# 8 una interfaz puede tener un cuerpo por defecto. Robot no implementa Bye, así que corre el predeterminado.",
          "C# 8 からインターフェースは既定の実装を持てる。Robot は Bye を実装していないので既定版が動く。",
        ),
        check: { compiles: true, stdout: "bye" },
      },
      {
        topic: "interfaces", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code(
          "var r = new Robot();",
          "Console.WriteLine(r.Bye());",
          "",
          "interface IGreeter {",
          "  string Hi();",
          '  string Bye() => "bye";',
          "}",
          'class Robot : IGreeter { public string Hi() => "hi"; }',
        ),
        options: YN, answer: 1,
        explain: L(
          "Default interface methods are reachable only through the interface type. On a Robot variable: CS1061.",
          "Los métodos por defecto de una interfaz solo se alcanzan desde el tipo interfaz. Sobre una variable Robot: CS1061.",
          "インターフェースの既定メソッドはインターフェース型経由でしか呼べない。Robot 型の変数からは CS1061。",
        ),
        check: { compiles: false },
      },
      // records-patterns
      {
        topic: "records-patterns", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code('var a = new Item("gem", 2);', 'var b = new Item("gem", 2);', "Console.WriteLine(a == b);", "", "record Item(string Name, int Qty);"),
        options: ["True", "False"], answer: 0,
        explain: L(
          "Records get value equality generated: == compares every property, not the references.",
          "Los records generan igualdad por valor: == compara cada propiedad, no las referencias.",
          "レコードは値の等価性が自動生成される。== は参照ではなく全プロパティを比べる。",
        ),
        check: { compiles: true, stdout: "True" },
      },
      {
        topic: "records-patterns", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          'var c = new Bag("ana", new List<string> { "x" });',
          "var d = c with { };",
          'd.Items.Add("y");',
          'Console.WriteLine(c.Items.Count + " " + (c == d));',
          "",
          "record Bag(string Owner, List<string> Items);",
        ),
        options: ["2 True", "1 False", "1 True", "2 False"], answer: 0,
        explain: L(
          "with makes a SHALLOW copy: both records share the same List, so c sees \"y\" too, and they stay equal.",
          "with hace una copia SUPERFICIAL: ambos records comparten la misma List, así que c también ve \"y\" y siguen iguales.",
          "with は浅いコピー。2つのレコードは同じ List を共有するので c にも \"y\" が入り、等しいまま。",
        ),
        check: { compiles: true, stdout: "2 True" },
      },
      {
        topic: "records-patterns", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          'Console.WriteLine(Rank(0) + " " + Rank(49) + " " + Rank(50));',
          "",
          "static string Rank(int hp) => hp switch {",
          '  <= 0 => "dead",',
          '  < 50 => "hurt",',
          '  _ => "fine"',
          "};",
        ),
        options: ["dead hurt fine", "dead hurt hurt", "hurt hurt fine"], answer: 0,
        explain: L(
          "A switch expression tries arms top to bottom and takes the first match; _ catches the rest. 50 is not < 50.",
          "Una expresión switch prueba los brazos de arriba abajo y toma el primero que coincide; _ atrapa el resto. 50 no es < 50.",
          "switch 式は上から順に試して最初に一致した腕を使い、_ が残りを受ける。50 は < 50 ではない。",
        ),
        check: { compiles: true, stdout: "dead hurt fine" },
      },
      // collections-generics
      {
        topic: "collections-generics", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code("Console.WriteLine(Add(2, 3));", "", "static T Add<T>(T a, T b) => a + b;"),
        options: YN, answer: 1,
        explain: L(
          "The compiler knows nothing about T, so + is not defined for it: CS0019. Constrain T (e.g. INumber<T>) to add.",
          "El compilador no sabe nada de T, así que + no está definido: CS0019. Restringe T (p. ej. INumber<T>) para sumar.",
          "コンパイラは T について何も知らないので + が使えず CS0019。足すには INumber<T> などで制約しよう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "collections-generics", difficulty: 2, kind: "type",
        prompt: L("Read the key without throwing", "Lee la clave sin lanzar", "例外なしでキーを読む"),
        code: code(
          'var stock = new Dictionary<string, int> { ["gem"] = 3 };',
          'if (stock.___("gem", out int n)) Console.WriteLine(n);',
          'else Console.WriteLine("none");',
        ),
        answer: "TryGetValue",
        explain: L(
          "TryGetValue returns false for a missing key instead of throwing, and hands the value through out in one lookup.",
          "TryGetValue devuelve false si falta la clave en vez de lanzar, y entrega el valor por out en una sola búsqueda.",
          "TryGetValue はキーがなければ例外ではなく false を返し、値は out で受け取れる。検索も1回で済む。",
        ),
        check: { compiles: true, stdout: "3" },
      },
      // delegates-closures
      {
        topic: "delegates-closures", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "var acts = new List<Action>();",
          "for (int i = 0; i < 3; i++)",
          "  acts.Add(() => Console.Write(i));",
          "foreach (var a in acts) a();",
        ),
        options: ["333", "012", "222"], answer: 0,
        explain: L(
          "A for loop has ONE i shared by all lambdas; they read it after the loop, when it is 3. Copy it: int j = i;",
          "Un for tiene UNA sola i que comparten todas las lambdas; la leen al final, cuando vale 3. Cópiala: int j = i;",
          "for の i は1つだけで全ラムダが共有し、ループ後の 3 を読む。int j = i; とコピーしよう。",
        ),
        check: { compiles: true, stdout: "333" },
      },
      {
        topic: "delegates-closures", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code('Action log = () => Console.Write("A");', 'log += () => Console.Write("B");', "log();"),
        options: ["AB", "B", "A"], answer: 0,
        explain: L(
          "Delegates are multicast: += adds a handler to the list, and invoking runs all of them in order.",
          "Los delegados son multicast: += agrega un manejador a la lista, e invocarlo los ejecuta todos en orden.",
          "デリゲートはマルチキャスト。+= でリストに追加され、呼ぶと登録順に全部実行される。",
        ),
        check: { compiles: true, stdout: "AB" },
      },
      {
        topic: "delegates-closures", difficulty: 2, kind: "type",
        prompt: L("Make Shout an extension method", "Haz de Shout un método de extensión", "Shout を拡張メソッドにする"),
        code: code(
          'Console.WriteLine("hero".Shout());',
          "",
          "static class Ext {",
          '  public static string Shout(___ string s) => s.ToUpper() + "!";',
          "}",
        ),
        answer: "this",
        explain: L(
          "this on the first parameter of a static method in a static class makes it callable like an instance method.",
          "this en el primer parámetro de un método static en una clase static permite llamarlo como método de instancia.",
          "static クラスの static メソッドの第1引数に this を付けると、インスタンスメソッドのように呼べる。",
        ),
        check: { compiles: true, stdout: "HERO!" },
      },
      // linq
      {
        topic: "linq", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("var src = new List<int> { 1, 2, 3 };", "var q = src.Where(n => n > 1);", "src.Add(4);", "Console.WriteLine(q.Count());"),
        options: ["3", "2", "4"], answer: 0,
        explain: L(
          "Where is deferred: q is only a recipe, run when Count() pulls items, so it sees 4 too (2, 3, 4).",
          "Where es diferido: q solo es una receta que corre cuando Count() pide elementos, así que también ve el 4 (2, 3, 4).",
          "Where は遅延実行。q はレシピにすぎず、Count() の時点で実行されるので 4 も数える（2, 3, 4）。",
        ),
        check: { compiles: true, stdout: "3" },
      },
      {
        topic: "linq", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "var xs = new[] { 1, 2, 3, 4 };",
          "var q = xs",
          '  .Where(n => { Console.Write($"w{n} "); return n % 2 == 0; })',
          '  .Select(n => { Console.Write($"s{n} "); return n; });',
          "var list = q.ToList();",
        ),
        options: ["w1 w2 s2 w3 w4 s4", "w1 w2 w3 w4 s2 s4", "s2 s4 w1 w2 w3 w4"], answer: 0,
        explain: L(
          "LINQ streams: each item flows through the whole pipeline before the next one, so Where and Select interleave.",
          "LINQ fluye por elemento: cada uno recorre toda la cadena antes del siguiente, así que Where y Select se intercalan.",
          "LINQ は1要素ずつ流れる。各要素がパイプライン全体を通ってから次へ進むので Where と Select が交互に出る。",
        ),
        check: { compiles: true, stdout: "w1 w2 s2 w3 w4 s4" },
      },
      {
        topic: "linq", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          'var words = new[] { "ant", "bee", "cat", "bear" };',
          "var g = words.GroupBy(w => w.Length)",
          "  .OrderBy(x => x.Key)",
          '  .Select(x => $"{x.Key}:{x.Count()}");',
          'Console.WriteLine(string.Join(" ", g));',
        ),
        options: ["3:3 4:1", "3:1 4:3", "ant:3 bear:4"], answer: 0,
        explain: L(
          "GroupBy buckets items by the key (the length). Each group has a Key and is itself a sequence you can Count.",
          "GroupBy agrupa los elementos por la clave (la longitud). Cada grupo tiene un Key y es una secuencia que puedes contar.",
          "GroupBy はキー（長さ）ごとにまとめる。各グループは Key を持ち、それ自体が数えられるシーケンスだよ。",
        ),
        check: { compiles: true, stdout: "3:3 4:1" },
      },
      // exceptions
      {
        topic: "exceptions", difficulty: 2, kind: "pick",
        prompt: L("Rethrow, keeping the original stack trace", "Relanza conservando la traza original", "元のスタックトレースを保って再スロー"),
        code: code("try { Save(); }", "catch (Exception ex) {", "  Log(ex);", "  ___", "}"),
        options: ["throw;", "throw ex;", "return;"], answer: 0,
        explain: L(
          "throw; rethrows the same exception untouched. throw ex; resets the stack trace to this line (analyzer CA2200).",
          "throw; relanza la misma excepción intacta. throw ex; reinicia la traza en esta línea (analizador CA2200).",
          "throw; は同じ例外をそのまま再スロー。throw ex; はスタックトレースをこの行から始め直してしまう（CA2200）。",
        ),
      },
      {
        topic: "exceptions", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          'try { throw new ArgumentException("bad hp"); }',
          'catch (ArgumentException e) when (e.Message.Contains("mp"))',
          '{ Console.WriteLine("mp"); }',
          'catch (Exception) { Console.WriteLine("other"); }',
        ),
        options: ["other", "mp", L("Nothing: it crashes", "Nada: falla", "何も出ずに落ちる")], answer: 0,
        explain: L(
          "An exception filter (when) must also be true for that catch to run. It is false, so the next catch takes it.",
          "Un filtro de excepción (when) también debe ser true para entrar a ese catch. Es false, así que lo toma el siguiente.",
          "例外フィルター（when）が true のときだけその catch に入る。false なので次の catch が受け取る。",
        ),
        check: { compiles: true, stdout: "other" },
      },
      // disposal
      {
        topic: "disposal", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          'using var a = new Torch("A");',
          'using var b = new Torch("B");',
          'Console.Write("body ");',
          "",
          "class Torch : IDisposable {",
          "  string n;",
          '  public Torch(string n) { this.n = n; Console.Write($"light{n} "); }',
          '  public void Dispose() => Console.Write($"out{n} ");',
          "}",
        ),
        options: ["lightA lightB body outB outA", "lightA lightB body outA outB", "lightA outA lightB outB body"], answer: 0,
        explain: L(
          "using declarations dispose at the end of the scope in REVERSE order, like a stack: last lit, first out.",
          "Las declaraciones using se liberan al final del ámbito en orden INVERSO, como una pila: la última encendida sale primero.",
          "using 宣言はスコープの終わりに逆順で破棄される。スタックのように最後に点けたものが最初に消える。",
        ),
        check: { compiles: true, stdout: "lightA lightB body outB outA" },
      },
      {
        topic: "disposal", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "try {",
          "  using var t = new Torch();",
          '  throw new Exception("x");',
          '} catch { Console.Write("caught "); }',
          "",
          "class Torch : IDisposable {",
          '  public void Dispose() => Console.Write("out ");',
          "}",
        ),
        options: ["out caught", "caught out", "caught"], answer: 0,
        explain: L(
          "using compiles to try/finally, so Dispose runs as the exception leaves the block, before the outer catch.",
          "using se compila como try/finally: Dispose corre cuando la excepción sale del bloque, antes del catch externo.",
          "using は try/finally に展開されるので、例外がブロックを出るときに Dispose が走り、そのあと外側の catch。",
        ),
        check: { compiles: true, stdout: "out caught" },
      },
      // async
      {
        topic: "async", difficulty: 1, kind: "type",
        prompt: L("Get the int out of the Task", "Saca el int del Task", "Task から int を取り出す"),
        code: code("int hp = ___ LoadHp();", "Console.WriteLine(hp + 1);", "", "static async Task<int> LoadHp() {", "  await Task.Delay(10);", "  return 41;", "}"),
        answer: "await",
        explain: L(
          "await waits for the Task<int> without blocking the thread and unwraps its result, here 41.",
          "await espera el Task<int> sin bloquear el hilo y desenvuelve su resultado, aquí 41.",
          "await はスレッドをブロックせずに Task<int> を待ち、結果（ここでは 41）を取り出す。",
        ),
        check: { compiles: true, stdout: "42" },
      },
      {
        topic: "async", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "try { Fail().Wait(); }",
          "catch (Exception e) {",
          '  Console.WriteLine(e.GetType().Name + " -> " + e.InnerException!.GetType().Name);',
          "}",
          "",
          "static async Task Fail() {",
          "  await Task.Yield();",
          "  throw new InvalidOperationException();",
          "}",
        ),
        options: [
          "AggregateException -> InvalidOperationException",
          "InvalidOperationException -> AggregateException",
          "TaskCanceledException -> InvalidOperationException",
        ],
        answer: 0,
        explain: L(
          ".Wait() and .Result wrap failures in AggregateException. await unwraps it and rethrows the original exception.",
          ".Wait() y .Result envuelven los errores en AggregateException. await lo desenvuelve y relanza la excepción original.",
          ".Wait() や .Result は例外を AggregateException で包む。await なら包みを外して元の例外を投げ直す。",
        ),
        check: { compiles: true, stdout: "AggregateException -> InvalidOperationException" },
      },
      {
        topic: "async", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "var r = await Task.WhenAll(Slow(3, 300), Slow(1, 10), Slow(2, 100));",
          'Console.WriteLine(string.Join(",", r));',
          "",
          "static async Task<int> Slow(int v, int ms) {",
          "  await Task.Delay(ms);",
          "  return v;",
          "}",
        ),
        options: ["3,1,2", "1,2,3", L("It varies", "Varía", "毎回変わる")], answer: 0,
        explain: L(
          "WhenAll runs the tasks concurrently but returns results in ARGUMENT order, not in finishing order.",
          "WhenAll ejecuta las tareas a la vez, pero devuelve los resultados en el orden de los ARGUMENTOS, no de llegada.",
          "WhenAll はタスクを同時に進めるが、結果は終わった順ではなく引数の順で返る。",
        ),
        check: { compiles: true, stdout: "3,1,2" },
      },
    ],
  },

  // ─── SENIOR ───────────────────────────────────────────────────────────────
  {
    slug: "senior",
    level: "senior",
    title: L("Senior C# Developer", "C# Developer Senior", "シニア C# 開発者"),
    description: L(
      "Senior .NET interview: async pitfalls, Span and GC, thread safety, DI lifetimes, variance, LINQ cost, equality.",
      "Entrevista .NET senior: trampas de async, Span y GC, hilos, ciclos de vida de DI, varianza, costo de LINQ, igualdad.",
      "シニア .NET 面接：async の落とし穴、Span と GC、スレッド安全、DI の寿命、変性、LINQ のコスト、等価性。",
    ),
    count: 15,
    passPct: 75,
    secondsPerQuestion: 50,
    codeCount: 2,
    questions: [
      ...seniorTraceDebug,
      loadAllTask, anagramsTask, lruCacheTask, retryTask,
      // async
      {
        topic: "async", difficulty: 2, kind: "predict",
        prompt: L("Does this catch see Boom's exception?", "¿Este catch ve la excepción de Boom?", "この catch は Boom の例外を捕まえる？"),
        code: code(
          "try { Boom(); }",
          'catch (Exception) { Console.WriteLine("caught"); }',
          "",
          "static async void Boom() {",
          "  await Task.Delay(10);",
          "  throw new InvalidOperationException();",
          "}",
        ),
        options: [
          L("Yes", "Sí", "はい"),
          L("No: async void gives the caller no Task", "No: async void no da un Task al llamador", "いいえ：async void は Task を返さない"),
          L("No: it does not compile", "No: no compila", "いいえ：コンパイルできない"),
        ],
        answer: 1,
        explain: L(
          "With no Task to observe, the error skips the caller's catch and is raised on the thread pool, which can crash the app. Return Task.",
          "Sin un Task que observar, el error salta el catch del llamador y se lanza en el thread pool, y puede tumbar la app. Devuelve Task.",
          "観測する Task がないので例外は呼び出し側の catch を素通りし、スレッドプールで投げられアプリを落としうる。Task を返そう。",
        ),
      },
      {
        topic: "async", difficulty: 3, kind: "predict",
        prompt: L("Why does this freeze a UI app?", "¿Por qué congela una app de UI?", "なぜ UI アプリが固まる？"),
        code: code(
          "// WinForms click handler, on the UI thread",
          "void OnClick(object s, EventArgs e) {",
          "  label.Text = LoadAsync().Result;",
          "}",
          "async Task<string> LoadAsync() {",
          "  await Task.Delay(100);",
          '  return "ok";',
          "}",
        ),
        options: [
          L("The continuation needs the blocked UI thread", "La continuación necesita el hilo de UI bloqueado", "継続がブロック中の UI スレッドを待つ"),
          L("Task.Delay never completes", "Task.Delay nunca termina", "Task.Delay が終わらない"),
          L(".Result throws on the UI thread", ".Result lanza en el hilo de UI", ".Result が UI スレッドで例外を出す"),
        ],
        answer: 0,
        explain: L(
          "await resumes on the captured UI context, which .Result is blocking: deadlock. Await all the way, or ConfigureAwait(false) in libraries.",
          "await retoma en el contexto de UI capturado, que .Result bloquea: deadlock. Usa await hasta arriba o ConfigureAwait(false).",
          "await は捕捉した UI コンテキストで再開するが、.Result がそれを塞いでデッドロック。await を通すか ConfigureAwait(false)。",
        ),
      },
      {
        topic: "async", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "try { Fail(); }",
          'catch (Exception) { Console.WriteLine("caught"); }',
          'Console.WriteLine("end");',
          "",
          "static async Task Fail() {",
          "  await Task.Delay(10);",
          "  throw new InvalidOperationException();",
          "}",
        ),
        options: ["end", L("caught, then end", "caught y luego end", "caught のあと end"), L("It crashes", "Falla", "落ちる")], answer: 0,
        explain: L(
          "Without await, Fail() just returns a Task; the later exception is stored in it and nobody observes it (warning CS4014).",
          "Sin await, Fail() solo devuelve un Task; la excepción posterior queda guardada ahí y nadie la observa (aviso CS4014).",
          "await がないと Fail() は Task を返すだけ。あとで起きた例外は Task に入ったまま誰にも観測されない（CS4014 警告）。",
        ),
        check: { compiles: true, stdout: "end" },
      },
      {
        topic: "async", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "using System.Threading;",
          "var cts = new CancellationTokenSource();",
          "cts.Cancel();",
          "try {",
          "  await Task.Delay(1000, cts.Token);",
          '  Console.WriteLine("done");',
          "} catch (OperationCanceledException e) {",
          "  Console.WriteLine(e.GetType().Name);",
          "}",
        ),
        options: ["TaskCanceledException", "done", "OperationCanceledException"], answer: 0,
        explain: L(
          "A canceled token makes Task.Delay throw TaskCanceledException, a subclass of OperationCanceledException.",
          "Un token cancelado hace que Task.Delay lance TaskCanceledException, subclase de OperationCanceledException.",
          "キャンセル済みトークンで Task.Delay は TaskCanceledException を投げる。OperationCanceledException の子クラスだよ。",
        ),
        check: { compiles: true, stdout: "TaskCanceledException" },
      },
      // memory
      {
        topic: "memory", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("int[] arr = { 1, 2, 3, 4 };", "Span<int> s = arr.AsSpan(2);", "s[0] = 7;", 'Console.WriteLine(string.Join(",", arr));'),
        options: ["1,2,7,4", "7,2,3,4", "1,2,3,4"], answer: 0,
        explain: L(
          "A Span is a view over existing memory, not a copy: s[0] is arr[2]. Slicing without allocating is its point.",
          "Un Span es una vista sobre memoria existente, no una copia: s[0] es arr[2]. Recortar sin asignar memoria es su gracia.",
          "Span は既存メモリへのビューでコピーではない。s[0] は arr[2]。確保なしで切り出せるのが利点。",
        ),
        check: { compiles: true, stdout: "1,2,7,4" },
      },
      {
        topic: "memory", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "IMover m = new MoverS();",
          "m.Move(); m.Move();",
          "var s = new MoverS();",
          "s.Move();",
          "IMover boxed = s;",
          "boxed.Move();",
          'Console.WriteLine(((MoverS)m).X + " " + s.X);',
          "",
          "interface IMover { void Move(); }",
          "struct MoverS : IMover { public int X; public void Move() => X++; }",
        ),
        options: ["2 1", "2 2", "0 1", "1 1"], answer: 0,
        explain: L(
          "Assigning a struct to an interface boxes a copy. m mutates its own box (2); boxed.Move() changes a copy, not s (1).",
          "Asignar un struct a una interfaz encaja una copia. m muta su propia caja (2); boxed.Move() cambia una copia, no s (1).",
          "struct をインターフェースに代入するとコピーがボックス化される。m は自分の箱を変え（2）、boxed は s のコピー（1）。",
        ),
        check: { compiles: true, stdout: "2 1" },
      },
      {
        topic: "memory", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code("Span<int> s = new int[4];", "await Task.Delay(1);", "s[0] = 1;", "Console.WriteLine(s[0]);"),
        options: YN, answer: 1,
        explain: L(
          "Span<T> is a ref struct that lives only on the stack; an await may move the method to the heap, so CS4007.",
          "Span<T> es un ref struct que solo vive en la pila; un await puede llevar el método al heap, así que CS4007.",
          "Span<T> はスタック専用の ref struct。await をまたぐとメソッドの状態がヒープに移るので CS4007。",
        ),
        check: { compiles: false },
      },
      {
        topic: "memory", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code("Console.WriteLine(Bad(1));", "", "static int Bad(in int x) {", "  x = 5;", "  return x;", "}"),
        options: YN, answer: 1,
        explain: L(
          "in passes by reference but read-only (to avoid copying big structs), so assigning x is error CS8331.",
          "in pasa por referencia pero de solo lectura (para no copiar structs grandes), así que asignar x es el error CS8331.",
          "in は読み取り専用の参照渡し（大きな struct のコピー回避用）。x への代入は CS8331 エラー。",
        ),
        check: { compiles: false },
      },
      {
        topic: "memory", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("var small = new byte[100];", "var big = new byte[100_000];", 'Console.WriteLine(GC.GetGeneration(small) + " " + GC.GetGeneration(big));'),
        options: ["0 2", "0 0", "0 1"], answer: 0,
        explain: L(
          "New objects start in gen 0, but arrays of 85,000+ bytes go to the Large Object Heap, reported as gen 2.",
          "Los objetos nuevos nacen en gen 0, pero los arrays de 85.000+ bytes van al Large Object Heap, que se reporta como gen 2.",
          "新しいオブジェクトは第0世代だが、85,000 バイト以上の配列はラージオブジェクトヒープに置かれ第2世代と報告される。",
        ),
        check: { compiles: true, stdout: "0 2" },
      },
      // concurrency
      {
        topic: "concurrency", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("using System.Threading;", "int n = 0;", "Parallel.For(0, 1000, _ => Interlocked.Increment(ref n));", "Console.WriteLine(n);"),
        options: ["1000", L("Any value up to 1000", "Cualquier valor hasta 1000", "1000 以下の何か"), "0"], answer: 0,
        explain: L(
          "Interlocked.Increment is an atomic read-add-write, so no update is lost even across threads.",
          "Interlocked.Increment es un leer-sumar-escribir atómico, así que no se pierde ninguna suma entre hilos.",
          "Interlocked.Increment は読み・加算・書き込みをアトミックに行うので、スレッド間でも更新が失われない。",
        ),
        check: { compiles: true, stdout: "1000" },
      },
      {
        topic: "concurrency", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "var lk = new object();",
          "int total = 0;",
          "Parallel.For(0, 100, _ => {",
          "  lock (lk) { total++; }",
          "});",
          "Console.WriteLine(total);",
        ),
        options: ["100", L("Any value up to 100", "Cualquier valor hasta 100", "100 以下の何か"), "0"], answer: 0,
        explain: L(
          "lock lets one thread at a time into the block, so every ++ completes before the next starts.",
          "lock deja entrar a un hilo a la vez al bloque, así que cada ++ termina antes de que empiece el siguiente.",
          "lock はブロックに一度に1スレッドしか入れないので、各 ++ が終わってから次が始まる。",
        ),
        check: { compiles: true, stdout: "100" },
      },
      {
        topic: "concurrency", difficulty: 3, kind: "predict",
        prompt: L("Is n always 1000 at the end?", "¿n vale siempre 1000 al final?", "最後の n は必ず 1000？"),
        code: code("int n = 0;", "Parallel.For(0, 1000, _ => n++);", "Console.WriteLine(n);"),
        options: [
          L("Yes", "Sí", "はい"),
          L("No: n++ is read, add, write; updates get lost", "No: n++ es leer, sumar, escribir; se pierden sumas", "いいえ：n++ は読み・加算・書きで更新が消える"),
          L("No: it does not compile", "No: no compila", "いいえ：コンパイルできない"),
        ],
        answer: 1,
        explain: L(
          "Two threads can read the same n and both write n+1: a race. Use Interlocked.Increment or lock.",
          "Dos hilos pueden leer el mismo n y ambos escribir n+1: una condición de carrera. Usa Interlocked.Increment o lock.",
          "2つのスレッドが同じ n を読み、両方 n+1 を書くことがある（競合状態）。Interlocked.Increment か lock を使おう。",
        ),
      },
      // design-di
      {
        topic: "design-di", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("Func<object, string> f = o => o.ToString()!;", "Func<string, object> g = f;", 'Console.WriteLine(g("x"));'),
        options: YN, answer: 0,
        explain: L(
          "Func<in T, out R> is variant: a function taking any object and returning string also fits string -> object.",
          "Func<in T, out R> es variante: una función que recibe cualquier object y devuelve string también sirve como string -> object.",
          "Func<in T, out R> は変性を持つ。object を受けて string を返す関数は string → object としても使える。",
        ),
        check: { compiles: true, stdout: "x" },
      },
      {
        topic: "design-di", difficulty: 3, kind: "predict",
        prompt: L("What is wrong with this setup?", "¿Qué está mal en esta configuración?", "この登録の何が問題？"),
        code: code(
          "services.AddScoped<AppDbContext>();",
          "services.AddSingleton<ReportCache>();",
          "",
          "class ReportCache {",
          "  public ReportCache(AppDbContext db) { /* ... */ }",
          "}",
        ),
        options: [
          L("Captive dependency: the scoped DbContext lives forever", "Dependencia cautiva: el DbContext scoped vive para siempre", "捕獲された依存：スコープの DbContext が永久に生きる"),
          L("Nothing: lifetimes do not matter", "Nada: los ciclos de vida no importan", "問題なし：寿命は関係ない"),
          L("A new ReportCache is built per request", "Se crea un ReportCache por petición", "リクエストごとに ReportCache が作られる"),
        ],
        answer: 0,
        explain: L(
          "A singleton keeps what it gets forever, so the scoped DbContext outlives its request and is shared across threads.",
          "Un singleton conserva para siempre lo que recibe: el DbContext scoped sobrevive a su petición y se comparte entre hilos.",
          "シングルトンは受け取ったものを永久に保持するので、スコープの DbContext がリクエストより長生きしスレッド間で共有される。",
        ),
      },
      {
        topic: "design-di", difficulty: 3, kind: "predict",
        prompt: L("With EF Core, where does Where run?", "Con EF Core, ¿dónde corre Where?", "EF Core で Where はどこで動く？"),
        code: code("IEnumerable<Order> orders = db.Orders;", "var big = orders", "  .Where(o => o.Total > 100)", "  .ToList();"),
        options: [
          L("In SQL, on the database", "En SQL, en la base de datos", "データベース上の SQL で"),
          L("In memory, after loading every order", "En memoria, tras cargar todos los pedidos", "全注文を読み込んだあとメモリ上で"),
          L("It does not run until saved", "No corre hasta guardar", "保存するまで実行されない"),
        ],
        answer: 1,
        explain: L(
          "Typed as IEnumerable, Where is LINQ to Objects: all rows are loaded, then filtered. Keep IQueryable to translate it to SQL.",
          "Tipado como IEnumerable, Where es LINQ to Objects: se cargan todas las filas y luego se filtra. Con IQueryable va a SQL.",
          "IEnumerable 型だと Where は LINQ to Objects。全行を読み込んでから絞り込む。IQueryable なら SQL に変換される。",
        ),
      },
      // delegates-closures
      {
        topic: "delegates-closures", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "var acts = new List<Action>();",
          "foreach (var i in new[] { 0, 1, 2 })",
          "  acts.Add(() => Console.Write(i));",
          "foreach (var a in acts) a();",
        ),
        options: ["012", "222", "333"], answer: 0,
        explain: L(
          "Since C# 5, foreach declares a fresh variable per iteration, so each lambda captures its own i. for still shares one.",
          "Desde C# 5, foreach declara una variable nueva por vuelta, así que cada lambda captura su propia i. for aún comparte una.",
          "C# 5 以降、foreach は周回ごとに新しい変数を作るので各ラムダが別の i を捕捉する。for は今も1つを共有。",
        ),
        check: { compiles: true, stdout: "012" },
      },
      {
        topic: "delegates-closures", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("int hp = 10;", "Func<int> read = () => hp;", "hp = 99;", "Console.WriteLine(read());"),
        options: ["99", "10", "0"], answer: 0,
        explain: L(
          "A closure captures the variable itself, not a snapshot of its value, so it sees the later assignment.",
          "Un closure captura la variable misma, no una foto de su valor, así que ve la asignación posterior.",
          "クロージャは値のスナップショットではなく変数そのものを捕捉するので、あとの代入も見える。",
        ),
        check: { compiles: true, stdout: "99" },
      },
      {
        topic: "delegates-closures", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code(
          "var boss = new Boss();",
          'boss.Hit += () => Console.WriteLine("ouch");',
          "boss.Hit = null;",
          "",
          "class Boss {",
          "  public event Action? Hit;",
          "}",
        ),
        options: YN, answer: 1,
        explain: L(
          "Outside its class, an event only allows += and -= (CS0070). That stops callers wiping other subscribers.",
          "Fuera de su clase, un evento solo permite += y -= (CS0070). Así nadie borra a los demás suscriptores.",
          "クラスの外ではイベントに += と -= しか使えない（CS0070）。他の購読者を消されないための仕組み。",
        ),
        check: { compiles: false },
      },
      // linq
      {
        topic: "linq", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "int calls = 0;",
          "var q = new[] { 1, 2, 3 }.Select(n => { calls++; return n * 2; });",
          "var sum = q.Sum();",
          "var max = q.Max();",
          "Console.WriteLine(calls);",
        ),
        options: ["6", "3", "0"], answer: 0,
        explain: L(
          "Each enumeration reruns the deferred query: Sum and Max each call the lambda 3 times. Materialize once with ToList().",
          "Cada enumeración vuelve a ejecutar la consulta diferida: Sum y Max llaman 3 veces cada uno. Materializa con ToList().",
          "列挙のたびに遅延クエリが再実行され、Sum と Max でそれぞれ3回呼ばれる。ToList() で一度だけ実体化しよう。",
        ),
        check: { compiles: true, stdout: "6" },
      },
      {
        topic: "linq", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          'foreach (var n in Nums().Take(2)) Console.Write(n + " ");',
          "",
          "static IEnumerable<int> Nums() {",
          '  Console.Write("start ");',
          "  yield return 1;",
          "  yield return 2;",
          '  Console.Write("never ");',
          "  yield return 3;",
          "}",
        ),
        options: ["start 1 2", "start 1 2 never", "1 2 start"], answer: 0,
        explain: L(
          "An iterator runs lazily, only as items are pulled. Take(2) stops after the second, so the rest never runs.",
          "Un iterador corre de forma perezosa, solo al pedir elementos. Take(2) se detiene tras el segundo y el resto nunca corre.",
          "イテレータは要素を取り出すときだけ少しずつ動く。Take(2) は2つ目で止まるので残りは実行されない。",
        ),
        check: { compiles: true, stdout: "start 1 2" },
      },
      // equality
      {
        topic: "equality", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          'string a = "hello";',
          'string b = "hel" + "lo";',
          'string c = string.Concat("hel", "lo");',
          'Console.WriteLine(ReferenceEquals(a, b) + " " + ReferenceEquals(a, c)',
          '  + " " + ReferenceEquals(a, string.Intern(c)));',
        ),
        options: ["True False True", "True True True", "False False True", "True False False"], answer: 0,
        explain: L(
          "Constant \"hel\" + \"lo\" is folded at compile time into the interned literal. Concat builds a new string; Intern returns the pooled one.",
          "\"hel\" + \"lo\" constante se pliega al compilar en el literal internado. Concat crea uno nuevo; Intern devuelve el del pool.",
          "定数の \"hel\" + \"lo\" はコンパイル時に畳み込まれインターン済みリテラルになる。Concat は新規、Intern はプールの物を返す。",
        ),
        check: { compiles: true, stdout: "True False True" },
      },
      {
        topic: "equality", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "var a = new HashSet<Key> { new Key(1), new Key(1) };",
          "var b = new HashSet<KeyR> { new KeyR(1), new KeyR(1) };",
          'Console.WriteLine(a.Count + " " + b.Count);',
          "",
          "class Key { public int V; public Key(int v) => V = v; }",
          "record KeyR(int V);",
        ),
        options: ["2 1", "1 1", "2 2"], answer: 0,
        explain: L(
          "Without Equals/GetHashCode overrides, a class uses reference identity, so both Keys stay. Records generate both.",
          "Sin sobrescribir Equals/GetHashCode, una clase usa la identidad de referencia: quedan ambas Key. Los records generan ambos.",
          "Equals/GetHashCode を上書きしないクラスは参照で比べるので Key は2つ残る。レコードは両方を自動生成する。",
        ),
        check: { compiles: true, stdout: "2 1" },
      },
      // records-patterns
      {
        topic: "records-patterns", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          'var a = new Team("red", new[] { "ana" });',
          'var b = new Team("red", new[] { "ana" });',
          "Console.WriteLine(a == b);",
          "",
          "record Team(string Color, string[] Members);",
        ),
        options: ["False", "True"], answer: 0,
        explain: L(
          "Record equality compares each member with its own Equals; arrays compare by reference, so two arrays differ.",
          "La igualdad de records compara cada miembro con su propio Equals; los arrays comparan por referencia, así que difieren.",
          "レコードの等価性は各メンバーをその型の Equals で比べる。配列は参照比較なので別々の配列は等しくない。",
        ),
        check: { compiles: true, stdout: "False" },
      },
      {
        topic: "records-patterns", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          'Console.WriteLine($"{Kind(-1)} {Kind("")} {Kind(2.5)}");',
          "",
          "static string Kind(object o) => o switch {",
          '  int n when n < 0 => "neg",',
          '  int => "int",',
          '  string { Length: 0 } => "empty",',
          '  string => "text",',
          '  _ => "other"',
          "};",
        ),
        options: ["neg empty other", "int text other", "neg empty int"], answer: 0,
        explain: L(
          "Type patterns, when guards and property patterns combine; 2.5 is a double, so only _ matches it.",
          "Se combinan patrones de tipo, guardas when y patrones de propiedad; 2.5 es un double, así que solo coincide _.",
          "型パターン、when ガード、プロパティパターンの組み合わせ。2.5 は double なので _ だけが一致する。",
        ),
        check: { compiles: true, stdout: "neg empty other" },
      },
      // disposal
      {
        topic: "disposal", difficulty: 3, kind: "predict",
        prompt: L("Why the GC.SuppressFinalize call?", "¿Para qué GC.SuppressFinalize?", "GC.SuppressFinalize は何のため？"),
        code: code("public void Dispose() {", "  Dispose(true);", "  GC.SuppressFinalize(this);", "}"),
        options: [
          L("Cleanup is done; skip the finalizer", "Ya se limpió; salta el finalizador", "後始末済みなのでファイナライザを省く"),
          L("It frees the object right now", "Libera el objeto ahora mismo", "オブジェクトを今すぐ解放する"),
          L("It stops Dispose being called twice", "Evita llamar Dispose dos veces", "Dispose の二重呼び出しを防ぐ"),
        ],
        answer: 0,
        explain: L(
          "Resources are already released, so the finalizer is unneeded; suppressing it saves the object an extra GC cycle.",
          "Los recursos ya se liberaron, así que el finalizador sobra; suprimirlo le ahorra al objeto un ciclo extra de GC.",
          "リソースは解放済みなのでファイナライザは不要。抑制すればオブジェクトが余分な GC サイクルを待たずに済む。",
        ),
      },
      {
        topic: "disposal", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "using (Torch? t = null) {",
          '  Console.Write("body");',
          "}",
          "",
          "class Torch : IDisposable {",
          '  public void Dispose() => Console.Write(" out");',
          "}",
        ),
        options: ["body", "body out", "NullReferenceException"], answer: 0,
        explain: L(
          "using checks for null before calling Dispose, so a null resource is simply skipped: no crash, no Dispose.",
          "using comprueba null antes de llamar a Dispose, así que un recurso null simplemente se omite: sin fallo ni Dispose.",
          "using は Dispose を呼ぶ前に null を確認するので、null のリソースは単に飛ばされる。落ちないし Dispose もない。",
        ),
        check: { compiles: true, stdout: "body" },
      },
    ],
  },
];
