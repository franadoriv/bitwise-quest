import type { Beat, LessonDef, NoteBlock, NoteDef, RegionDef, Text } from "../../../lib/content/types.ts";
import { L } from "../../../lib/i18n/text.ts";

// REGION 2 · CLASS FOREST  (classes and properties, inheritance, interfaces and abstract classes, records and patterns)
// Snippets get the standard `using` lines added by the validator. Types go after the top-level statements.

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

// ─── 2.1 Blueprints and actors ─────────────────────────────────────────────
const classesNotes: NoteDef[] = [
  note("private-and-properties", L("Private fields and guarded properties", "Campos privados y propiedades", "private フィールドとプロパティ"),
    p(
      "A class is a blueprint, and new builds an object from it. Each object has its own fields: the variables declared inside the class. Writing private before a field means only code written inside that same class can read or change it. Code outside, like your top-level statements, gets error CS0122 if it tries.",
      "Una clase es un plano, y new construye un objeto con él. Cada objeto tiene sus propios campos: las variables declaradas dentro de la clase. Escribir private antes de un campo significa que solo el código escrito dentro de esa misma clase puede leerlo o cambiarlo. El código de fuera, como tus instrucciones de nivel superior, recibe el error CS0122 si lo intenta.",
      "クラスは設計図で、new でオブジェクトを作る。オブジェクトはそれぞれ自分のフィールド（クラスの中で宣言した変数）を持つ。フィールドの前に private と書くと、同じクラスの中のコードしか読み書きできない。外のコード（トップレベルの文など）がさわると CS0122 エラーになる。",
    ),
    bad("var box = new Chest();\nbox._coins = 9;\n\nclass Chest { private int _coins = 0; }",
      L("Does not compile: _coins is private to Chest", "No compila: _coins es privado de Chest", "コンパイル不可：_coins は Chest の private")),
    p(
      "Why hide fields? So the class can protect its own rules. Outside code talks to the object through a PROPERTY instead: it looks like a field when you use it (obj.Name = x), but it is really two small methods. get runs when you read it, and set runs when you write it. Inside set, the new value is called value.",
      "¿Por qué ocultar campos? Para que la clase proteja sus propias reglas. El código de fuera habla con el objeto mediante una PROPIEDAD: al usarla parece un campo (obj.Name = x), pero en realidad son dos métodos pequeños. get corre cuando la lees y set corre cuando la escribes. Dentro de set, el valor nuevo se llama value.",
      "なぜフィールドを隠すのか？クラスが自分のルールを守れるようにするためじゃ。外のコードは代わりにプロパティを使う。使うときはフィールドのよう（obj.Name = x）だが、中身は小さなメソッド2つ。読むと get が、書くと set が動く。set の中では新しい値を value と呼ぶ。",
    ),
    ex("var lamp = new Lamp();\nlamp.Brightness = 250;\nConsole.WriteLine(lamp.Brightness);\n\nclass Lamp\n{\n    private int _level = 10;\n    public int Brightness { get => _level; set => _level = value > 100 ? 100 : value; }\n}", "100",
      L("set checks value before storing it in the private field", "set revisa value antes de guardarlo en el campo privado", "set が value を確かめてから private フィールドにしまう")),
    p(
      "An auto-property like public int Hp { get; set; } has a hidden field and accepts any value. To add a rule, write the field yourself (often named with an underscore, like _hp), then make get return it and set store a checked version of value. Math.Max(0, value) and Math.Clamp are handy for limits.",
      "Una autopropiedad como public int Hp { get; set; } tiene un campo oculto y acepta cualquier valor. Para añadir una regla, escribe tú el campo (a menudo con guion bajo, como _hp), luego haz que get lo devuelva y que set guarde una versión revisada de value. Math.Max(0, value) y Math.Clamp sirven para límites.",
      "public int Hp { get; set; } のような自動プロパティは隠れたフィールドを持ち、どんな値も受け入れる。ルールを足すには、フィールドを自分で書き（_hp のように _ をつけることが多い）、get でそれを返し、set で確かめた value をしまう。上限・下限には Math.Max(0, value) や Math.Clamp が便利。",
    ),
    p(
      "Common mistake: thinking the value you assigned is the value stored. With a guarded setter, reading the property gives back what set decided to keep, not what you wrote. Always read the set body to know what ends up in the field.",
      "Error común: pensar que el valor asignado es el que se guarda. Con un setter vigilado, leer la propiedad devuelve lo que set decidió conservar, no lo que escribiste. Lee siempre el cuerpo de set para saber qué termina en el campo.",
      "よくあるミス：代入した値がそのまましまわれると思うこと。門番つきの set だと、読んだときに返るのは set が残すと決めた値で、書いた値ではない。フィールドに何が入るかは set の中身を読んで確かめよう。",
    ),
  ),
  note("read-only-properties", L("get-only and init properties", "Propiedades solo get e init", "get だけと init のプロパティ"),
    p(
      "Some properties should never change after the object is built. C# has two tools for this. { get; } with no set is read-only: only a constructor of that class can assign it. Anywhere else, assigning it is error CS0200 (the property is read only).",
      "Algunas propiedades no deberían cambiar nunca tras construir el objeto. C# tiene dos herramientas para eso. { get; } sin set es de solo lectura: solo un constructor de esa clase puede asignarla. En cualquier otro lugar, asignarla es el error CS0200 (la propiedad es de solo lectura).",
      "オブジェクトを作ったあと、変えてはいけないプロパティもある。C# には道具が2つ。set のない { get; } は読み取り専用で、代入できるのはそのクラスのコンストラクタだけ。ほかの場所で代入すると CS0200（読み取り専用）エラー。",
    ),
    ex("var map = new Map(\"north\");\nConsole.WriteLine(map.Region);\n\nclass Map\n{\n    public string Region { get; }\n    public Map(string r) { Region = r; }\n}", "north",
      L("The constructor is the only place that sets a get-only property", "El constructor es el único lugar que asigna una propiedad solo get", "get だけのプロパティを設定できるのはコンストラクタだけ")),
    p(
      "{ get; init; } is a little more flexible: it can also be set in an object initializer, the { Name = value } block right after new. Once that block ends, the property is frozen, and assigning it later is error CS8852.",
      "{ get; init; } es un poco más flexible: también puede asignarse en un inicializador de objeto, el bloque { Nombre = valor } justo después de new. Al terminar ese bloque, la propiedad queda congelada, y asignarla después es el error CS8852.",
      "{ get; init; } はもう少し柔軟で、オブジェクト初期化子（new の直後の { 名前 = 値 } のブロック）でも設定できる。そのブロックが終わるとプロパティは固定され、あとで代入すると CS8852 エラーになる。",
    ),
    bad("var t = new Ticket { Seat = 4 };\nt.Seat = 7;\n\nclass Ticket { public int Seat { get; init; } }",
      L("Does not compile: init only works inside the { } initializer", "No compila: init solo funciona dentro del inicializador { }", "コンパイル不可：init は { } 初期化子の中だけ")),
    p(
      "Rule to remember: get + set can change any time; get + init only while building with { }; get alone only in the constructor. Both errors are caught by the compiler, before the program runs, so these lines never print anything.",
      "Regla para recordar: get + set puede cambiar en cualquier momento; get + init solo al construir con { }; get solo, únicamente en el constructor. El compilador detecta ambos errores antes de ejecutar, así que esas líneas nunca imprimen nada.",
      "覚えるルール：get + set はいつでも変えられる。get + init は { } で作るときだけ。get だけならコンストラクタの中だけ。どちらのエラーも実行前にコンパイラが見つけるので、その行は何も表示しない。",
    ),
  ),
  note("static-members", L("static: one value for the whole class", "static: un valor para toda la clase", "static：クラス全体でひとつ"),
    p(
      "A normal field belongs to each object: build three objects and you get three separate copies of it. A static field belongs to the class itself, so there is exactly ONE copy, shared by every object. You read it through the class name, like Counter.Total, not through an object.",
      "Un campo normal pertenece a cada objeto: construye tres objetos y tendrás tres copias separadas. Un campo static pertenece a la clase misma, así que hay exactamente UNA copia, compartida por todos los objetos. Se lee con el nombre de la clase, como Counter.Total, no con un objeto.",
      "ふつうのフィールドはオブジェクトごとのもの。3つ作れば3つ別々にある。static フィールドはクラスそのものに属するので、全オブジェクトで共有するたった1つだけ。読むときは Counter.Total のようにクラス名を使う。",
    ),
    ex("var x = new Bee(); x.Fly();\nvar y = new Bee(); y.Fly(); y.Fly(); y.Fly();\nConsole.WriteLine(x.Trips + \" \" + y.Trips + \" \" + Bee.AllTrips);\n\nclass Bee\n{\n    public int Trips;\n    public static int AllTrips;\n    public void Fly() { Trips++; AllTrips++; }\n}", "1 3 4",
      L("Trips is per bee; AllTrips counts every Fly call", "Trips es por abeja; AllTrips cuenta cada llamada a Fly", "Trips はハチごと、AllTrips は全部の Fly を数える")),
    p(
      "To predict the output, keep two kinds of tally: one per object for the normal fields, and one global tally for each static field. Every call adds to its own object's tally AND to the shared one.",
      "Para predecir la salida, lleva dos tipos de cuenta: una por objeto para los campos normales y una cuenta global para cada campo static. Cada llamada suma a la cuenta de su objeto Y a la compartida.",
      "出力を予想するには2種類の数を記録しよう。ふつうのフィールドはオブジェクトごと、static フィールドは全体でひとつ。呼び出すたびに自分のオブジェクトの数と共有の数の両方が増える。",
    ),
    p(
      "Common mistake: expecting a new object to start the static value from zero again. new resets normal fields only; the static field keeps everything counted so far, for as long as the program runs.",
      "Error común: esperar que un objeto nuevo vuelva a poner el valor static en cero. new reinicia solo los campos normales; el campo static conserva todo lo contado hasta ahora, mientras el programa siga corriendo.",
      "よくあるミス：新しいオブジェクトを作ると static の値も 0 に戻ると思うこと。new で初期化されるのはふつうのフィールドだけ。static はプログラムが動く間、それまでの数をずっと持っている。",
    ),
  ),
  note("tostring", L("ToString and override", "ToString y override", "ToString と override"),
    p(
      "Console.WriteLine(obj) needs text, so it calls obj.ToString(). Every class inherits ToString from object, the root of all types. The inherited version doesn't know about your fields, so it just returns the type's name.",
      "Console.WriteLine(obj) necesita texto, así que llama a obj.ToString(). Toda clase hereda ToString de object, la raíz de todos los tipos. La versión heredada no conoce tus campos, así que solo devuelve el nombre del tipo.",
      "Console.WriteLine(obj) は文字が必要なので obj.ToString() を呼ぶ。どのクラスも、全部の型の根っこである object から ToString を受けついでいる。受けついだ版はフィールドのことを知らないので、型の名前を返すだけ。",
    ),
    ex("Console.WriteLine(new Lantern());\n\nclass Lantern { public int Oil = 3; }", "Lantern",
      L("No override: only the type name is printed", "Sin override: solo se imprime el nombre del tipo", "override なし：型名だけが表示される")),
    p(
      "ToString is declared virtual in object, which means child classes may replace it. To replace it, write a method with the same signature and the keyword override: public override string ToString() => ... From then on, printing the object uses your text.",
      "ToString está declarado virtual en object, lo que significa que las clases hijas pueden reemplazarlo. Para reemplazarlo, escribe un método con la misma firma y la palabra override: public override string ToString() => ... Desde entonces, imprimir el objeto usa tu texto.",
      "ToString は object で virtual と宣言されているので、子クラスが置きかえられる。置きかえるには、同じ形のメソッドを override をつけて書く：public override string ToString() => ... それからは、オブジェクトを表示すると自分の文字が使われる。",
    ),
    ex("Console.WriteLine(new Lantern());\n\nclass Lantern\n{\n    public int Oil = 3;\n    public override string ToString() => $\"Lantern with {Oil} oil\";\n}", "Lantern with 3 oil"),
    p(
      "Common mistake: writing public string ToString() without override. That compiles with a warning but only hides the original, so code that sees the object as object, like Console.WriteLine, still calls the old version.",
      "Error común: escribir public string ToString() sin override. Compila con un aviso pero solo oculta el original, así que el código que ve el objeto como object, como Console.WriteLine, sigue llamando a la versión vieja.",
      "よくあるミス：override をつけずに public string ToString() と書くこと。警告つきでコンパイルできるが元を隠すだけなので、Console.WriteLine のようにオブジェクトを object として見るコードは古い版を呼んだままになる。",
    ),
  ),
];

const classesAndProperties: LessonDef = {
  slug: "classes-and-properties",
  title: L("Blueprints and actors", "Planos y actores", "設計図と役者"),
  concept: "classes",
  mode: "lesson",
  xp: 70,
  enemy: "csharp/dispose-leak",
  enemyName: L("LEAKY BARREL", "BARRIL GOTEANTE", "もれもれタル"),
  beats: [
    say(L(
      "Welcome to the Class Forest! A CLASS is a blueprint. new builds an OBJECT from it, with its own fields.",
      "¡Bienvenido al Bosque de Clases! Una CLASE es un plano. new construye un OBJETO con sus propios campos.",
      "クラスの森へようこそ！クラスは設計図。new でオブジェクトを作ると、自分のフィールドを持つよ。",
    )),
    {
      kind: "act",
      prompt: L("Build two heroes from one blueprint", "Construye dos héroes con un plano", "ひとつの設計図からふたり作ろう"),
      steps: [
        { label: L("BLUEPRINT", "PLANO", "設計図"), line: `class Hero { public string Name = ""; }`, effects: [{ t: "banner", text: L("BLUEPRINT", "PLANO", "設計図") }] },
        { label: L("BUILD a", "CREAR a", "a を作る"), line: `var a = new Hero { Name = "Ada" };`, effects: [{ t: "tag", actor: "hero", text: "a", value: "Ada" }] },
        { label: L("BUILD b", "CREAR b", "b を作る"), line: `var b = new Hero { Name = "Zed" };`, effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "b", value: "Zed" }] },
        { label: L("PRINT", "IMPRIMIR", "表示"), line: `Console.WriteLine(a.Name + " " + b.Name);`, effects: [{ t: "print", text: "Ada Zed" }], output: "Ada Zed" },
      ],
    },
    say(L(
      "Keep fields private. A PROPERTY is a guarded door: get reads, set writes and can check the value.",
      "Deja los campos privados. Una PROPIEDAD es una puerta con guardia: get lee, set escribe y puede revisar el valor.",
      "フィールドは private に。プロパティは門番つきの扉。get で読み、set で書いて値もチェックできる。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "var h = new Hero();\nh.Hp = -10;\nConsole.WriteLine(h.Hp);\n\nclass Hero\n{\n    private int _hp = 100;\n    public int Hp { get => _hp; set => _hp = value < 0 ? 0 : value; }\n}",
      options: ["0", "-10", "100"],
      answer: 0,
      output: "0",
      check: { compiles: true, stdout: "0" },
      hint: L("Assigning goes through set. Read the set body: what does it store when value is below 0?", "Asignar pasa por set. Lee el cuerpo de set: ¿qué guarda cuando value es menor que 0?", "代入は set を通る。set の中身を読もう。value が 0 未満のとき何をしまう？"),
      note: "private-and-properties",
      explain: L("The setter guards the door: a value below 0 is stored as 0.", "El setter vigila la puerta: un valor menor que 0 se guarda como 0.", "set が門番。0 未満の値は 0 として保存される。"),
      setup: [{ t: "tag", actor: "hero", text: "Hp", value: "100" }],
      win: [{ t: "value", actor: "hero", text: "0" }, { t: "print", text: "0" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: "var h = new Hero();\nh._hp = 5;\n\nclass Hero { private int _hp = 100; }",
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
      hint: L("Look at the keyword in front of _hp. Who is allowed to touch it?", "Mira la palabra delante de _hp. ¿Quién tiene permiso para tocarlo?", "_hp の前のキーワードを見よう。さわってよいのはだれ？"),
      note: "private-and-properties",
      explain: L("Error CS0122: _hp is private, so only code inside Hero can touch it.", "Error CS0122: _hp es private, solo el código dentro de Hero puede tocarlo.", "エラー CS0122：_hp は private。Hero の中のコードしかさわれない。"),
      win: [{ t: "shake" }],
    },
    say(L(
      "{ get; } is read-only after the constructor. { get; init; } can be set only while building with { }.",
      "{ get; } es de solo lectura tras el constructor. { get; init; } solo se asigna al construir con { }.",
      "{ get; } はコンストラクタの後は読み取り専用。{ get; init; } は { } で作るときだけ設定できる。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: "var h = new Hero { Lvl = 1 };\nh.Lvl = 2;\n\nclass Hero { public int Lvl { get; init; } }",
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
      hint: L("The property has init, not set. When can an init property receive a value?", "La propiedad tiene init, no set. ¿Cuándo puede recibir un valor una propiedad init?", "プロパティにあるのは set ではなく init。init はいつ値を受け取れる？"),
      note: "read-only-properties",
      explain: L("Error CS8852: an init property can only be set in the object initializer.", "Error CS8852: una propiedad init solo se asigna en el inicializador del objeto.", "エラー CS8852：init プロパティはオブジェクト初期化子でしか設定できない。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: `var h = new Hero("Ada");\nh.Name = "Zed";\n\nclass Hero\n{\n    public string Name { get; }\n    public Hero(string n) { Name = n; }\n}`,
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
      hint: L("Name has get but no set. Which piece of code is the only one allowed to assign it?", "Name tiene get pero no set. ¿Qué parte del código es la única que puede asignarla?", "Name には get があって set がない。代入できるのはどのコードだけ？"),
      note: "read-only-properties",
      explain: L("Error CS0200: Name has only get. The constructor may set it, nobody else.", "Error CS0200: Name solo tiene get. El constructor puede asignarlo, nadie más.", "エラー CS0200：Name は get だけ。設定できるのはコンストラクタだけ。"),
    },
    say(L(
      "static members belong to the CLASS itself: one copy shared by every object.",
      "Los miembros static pertenecen a la CLASE misma: una sola copia compartida por todos los objetos.",
      "static メンバーはクラスそのものに属する。全オブジェクトで共有される1つだけの値だよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "var c = new Counter(); c.Add(); c.Add();\nvar d = new Counter(); d.Add();\nConsole.WriteLine(c.N + \" \" + d.N + \" \" + Counter.Total);\n\nclass Counter\n{\n    public int N;\n    public static int Total;\n    public void Add() { N++; Total++; }\n}",
      options: ["2 1 3", "2 1 1", "3 3 3"],
      answer: 0,
      output: "2 1 3",
      check: { compiles: true, stdout: "2 1 3" },
      hint: L("Keep a separate count for each object's N, and one shared count for the static field.", "Lleva una cuenta aparte para el N de cada objeto y una cuenta compartida para el campo static.", "N はオブジェクトごとに、static フィールドは全体でひとつ数えよう。"),
      note: "static-members",
      explain: L("Each object counts its own N. Total is static: one counter for all three Add calls.", "Cada objeto cuenta su propio N. Total es static: un solo contador para las tres llamadas.", "N はオブジェクトごと。Total は static なので3回の Add 全部を数える。"),
      win: [{ t: "banner", text: L("Total = 3", "Total = 3", "Total = 3") }, { t: "print", text: "2 1 3" }],
    },
    say(L(
      "Printing an object calls ToString(). By default it prints the type name; override it to choose.",
      "Imprimir un objeto llama a ToString(). Por defecto imprime el nombre del tipo; sobrescríbelo para elegir.",
      "オブジェクトを表示すると ToString() が呼ばれる。標準では型名。override で変えられるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: `Console.WriteLine(new Hero());\n\nclass Hero { public string Name = "Zed"; }`,
      options: ["Hero", "Zed", "Hero { Name = Zed }"],
      answer: 0,
      output: "Hero",
      check: { compiles: true, stdout: "Hero" },
      hint: L("Hero does not override ToString. What does the version inherited from object return?", "Hero no sobrescribe ToString. ¿Qué devuelve la versión heredada de object?", "Hero は ToString を override していない。object から受けついだ版は何を返す？"),
      note: "tostring",
      explain: L("A plain class doesn't know how to show itself, so ToString() returns its type name.", "Una clase simple no sabe mostrarse, así que ToString() devuelve el nombre de su tipo.", "ふつうの class は自分の見せ方を知らないので、ToString() は型名を返す。"),
    },
    {
      kind: "type",
      prompt: L("Replace the default ToString", "Reemplaza el ToString por defecto", "標準の ToString を置きかえよう"),
      code: `Console.WriteLine(new Hero());\n\nclass Hero\n{\n    public string Name = "Ada";\n    public ___ string ToString() => "Hero " + Name;\n}`,
      answer: "override",
      check: { compiles: true, stdout: "Hero Ada" },
      hint: L("ToString is virtual in object. Which keyword replaces a virtual method in a class?", "ToString es virtual en object. ¿Qué palabra reemplaza un método virtual en una clase?", "ToString は object の virtual メソッド。virtual を置きかえるキーワードは？"),
      note: "tostring",
      explain: L("ToString is virtual in object, so you replace it with override.", "ToString es virtual en object, así que lo reemplazas con override.", "ToString は object の virtual メソッド。override で置きかえる。"),
      win: [{ t: "print", text: "Hero Ada" }],
    },
    {
      kind: "run",
      prompt: L("Guard the setter: it must print hp: 0", "Protege el setter: debe imprimir hp: 0", "set を守ろう：hp: 0 と表示させて"),
      starter: `using System;

var h = new Hero();
h.Hp = -20;
Console.WriteLine($"hp: {h.Hp}");

class Hero
{
    public int Hp { get; set; }
}
`,
      solution: `using System;

var h = new Hero();
h.Hp = -20;
Console.WriteLine($"hp: {h.Hp}");

class Hero
{
    private int _hp = 100;
    public int Hp { get => _hp; set => _hp = Math.Max(0, value); }
}
`,
      expect: "hp: 0",
      fallback: [
        String.raw`Math\.Max\(\s*(0\s*,\s*value|value\s*,\s*0)\s*\)`,
        String.raw`value\s*<\s*0\s*\?\s*0`,
        String.raw`if\s*\(\s*value\s*<\s*0\s*\)`,
        String.raw`Math\.Clamp\(\s*value`,
      ],
      hint: L("An auto-property accepts any value. Add a private field and make set store a checked value.", "Una autopropiedad acepta cualquier valor. Agrega un campo privado y haz que set guarde un valor revisado.", "自動プロパティは何でも受け入れる。private フィールドを足して、set で確かめた値をしまおう。"),
      note: "private-and-properties",
      explain: L("An auto-property accepts anything. Add a backing field and clamp in set: Math.Max(0, value).", "Una autopropiedad acepta todo. Agrega un campo y limita en set: Math.Max(0, value).", "自動プロパティは何でも受け入れる。フィールドを用意して set で Math.Max(0, value)。"),
    },
  ],
  notes: classesNotes,
};

// ─── 2.2 Bloodlines ────────────────────────────────────────────────────────
const inheritanceNotes: NoteDef[] = [
  note("virtual-override", L("virtual, override and base", "virtual, override y base", "virtual・override・base"),
    p(
      "class Child : Parent means Child INHERITS from Parent: it gets all of Parent's members and can add its own. A variable typed as the parent can hold a child object, like Bird b = new Owl(); The label says Bird, but the real object is an Owl.",
      "class Child : Parent significa que Child HEREDA de Parent: recibe todos los miembros de Parent y puede añadir los suyos. Una variable del tipo padre puede guardar un objeto hijo, como Bird b = new Owl(); La etiqueta dice Bird, pero el objeto real es un Owl.",
      "class Child : Parent は Child が Parent を継承するという意味。Parent のメンバーを全部もらい、自分のものも足せる。親の型の変数には子のオブジェクトを入れられる：Bird b = new Owl(); ラベルは Bird でも、本当の中身は Owl じゃ。",
    ),
    p(
      "If the parent marks a method virtual and the child writes the same method with override, the REAL object decides which version runs, even through a parent label. Inside an override, base.Method() calls the parent's version, so the child can extend it instead of replacing it completely.",
      "Si el padre marca un método virtual y el hijo escribe el mismo método con override, el objeto REAL decide qué versión corre, incluso con una etiqueta del padre. Dentro de un override, base.Método() llama a la versión del padre, así que el hijo puede ampliarla en vez de reemplazarla por completo.",
      "親がメソッドに virtual をつけ、子が同じメソッドを override で書くと、親のラベル経由でも本当のオブジェクトがどの版を動かすか決める。override の中で base.メソッド() と書くと親の版を呼べるので、全部置きかえずに付け足すこともできる。",
    ),
    ex("Bird b = new Owl();\nConsole.WriteLine(b.Call());\n\nclass Bird { public virtual string Call() => \"tweet\"; }\nclass Owl : Bird { public override string Call() => base.Call() + \"-hoot\"; }", "tweet-hoot",
      L("The object is an Owl; base.Call() adds the parent's text first", "El objeto es un Owl; base.Call() añade primero el texto del padre", "中身は Owl。base.Call() で先に親の文字をつける")),
    p(
      "The compiler enforces the rules. You can only override a method marked virtual, abstract or override in the parent; overriding a plain method is error CS0506. And a class marked sealed can't be inherited at all: class X : SomeSealed is error CS0509.",
      "El compilador hace cumplir las reglas. Solo puedes sobrescribir un método marcado virtual, abstract u override en el padre; sobrescribir un método normal es el error CS0506. Y una clase marcada sealed no se puede heredar: class X : AlgoSealed es el error CS0509.",
      "ルールはコンパイラが守らせる。override できるのは親で virtual・abstract・override がついたメソッドだけ。ふつうのメソッドを override すると CS0506 エラー。sealed がついたクラスはそもそも継承できず、class X : 封印クラス は CS0509 エラーになる。",
    ),
    bad("class Tool { public string Use() => \"tap\"; }\nclass Drill : Tool { public override string Use() => \"whirr\"; }",
      L("CS0506: Use is not virtual, so it can't be overridden", "CS0506: Use no es virtual, así que no se puede sobrescribir", "CS0506：Use は virtual でないので override できない")),
    p(
      "Rule to remember: virtual in the parent opens the door, override in the child walks through it. Without both, the label's type decides. To predict output, ask: what is the real object, and is the method virtual?",
      "Regla para recordar: virtual en el padre abre la puerta y override en el hijo la cruza. Sin ambos, decide el tipo de la etiqueta. Para predecir la salida, pregúntate: ¿cuál es el objeto real y el método es virtual?",
      "覚えるルール：親の virtual が扉を開け、子の override がそこを通る。両方そろわないとラベルの型が決める。出力を予想するときは「本当の中身は何？メソッドは virtual？」と考えよう。",
    ),
  ),
  note("method-hiding", L("new hides; override replaces", "new oculta; override reemplaza", "new は隠す、override は置きかえる"),
    p(
      "A child can also declare a method with the same name using the keyword new instead of override. That does NOT replace the parent's method: it creates a second, unrelated method that only HIDES the first one. Both exist side by side.",
      "Un hijo también puede declarar un método con el mismo nombre usando la palabra new en vez de override. Eso NO reemplaza el método del padre: crea un segundo método, sin relación, que solo OCULTA al primero. Ambos existen lado a lado.",
      "子は override の代わりに new を使って同じ名前のメソッドを宣言することもできる。これは親のメソッドを置きかえない。別の2つめのメソッドを作り、1つめを隠すだけ。両方が並んで存在する。",
    ),
    p(
      "With hiding, the compiler picks the method from the type of the LABEL, at compile time. Through a parent-typed variable you get the parent's method; through a child-typed variable you get the child's. The real object no longer matters.",
      "Al ocultar, el compilador elige el método según el tipo de la ETIQUETA, al compilar. Con una variable del tipo padre obtienes el método del padre; con una del tipo hijo, el del hijo. El objeto real ya no importa.",
      "隠す場合、コンパイラはラベルの型でメソッドをコンパイル時に選ぶ。親の型の変数なら親のメソッド、子の型の変数なら子のメソッド。本当の中身はもう関係ない。",
    ),
    ex("Tree t = new Pine();\nPine p = new Pine();\nConsole.WriteLine(t.Leaf() + \" / \" + p.Leaf());\n\nclass Tree { public string Leaf() => \"flat\"; }\nclass Pine : Tree { public new string Leaf() => \"needle\"; }", "flat / needle",
      L("Same object type, different labels, different methods", "Mismo tipo de objeto, etiquetas distintas, métodos distintos", "中身は同じ型、ラベルがちがうとメソッドもちがう")),
    p(
      "Compare with override: the same code with virtual in Tree and override in Pine would print needle twice, because the object decides. If you want a child to really change the behavior everywhere, use virtual + override, never new.",
      "Compara con override: el mismo código con virtual en Tree y override en Pine imprimiría needle dos veces, porque decide el objeto. Si quieres que un hijo cambie de verdad el comportamiento en todas partes, usa virtual + override, nunca new.",
      "override と比べよう。Tree に virtual、Pine に override をつけた同じコードなら、中身が決めるので needle が2回表示される。子に本当にふるまいを変えさせたいなら、new ではなく virtual + override を使うのじゃ。",
    ),
    ex("Tree t = new Pine();\nConsole.WriteLine(t.Leaf());\n\nclass Tree { public virtual string Leaf() => \"flat\"; }\nclass Pine : Tree { public override string Leaf() => \"needle\"; }", "needle"),
  ),
  note("constructor-order", L("Constructors run parent first", "Los constructores: primero el padre", "コンストラクタは親から"),
    p(
      "A constructor is the special method that runs when new builds an object. It has the class's name and no return type. When you build a child object, the object also contains a parent part, and that part must be ready before the child adds its own pieces.",
      "Un constructor es el método especial que corre cuando new construye un objeto. Tiene el nombre de la clase y no tiene tipo de retorno. Al construir un objeto hijo, el objeto también contiene una parte del padre, y esa parte debe estar lista antes de que el hijo añada sus piezas.",
      "コンストラクタは new でオブジェクトを作るときに動く特別なメソッド。クラスと同じ名前で、戻り値の型はない。子のオブジェクトを作ると、中には親の部分も入っていて、子が自分の部分を足す前に親の部分を用意しておく必要がある。",
    ),
    p(
      "So C# always calls the parent's constructor first, then the child's. With a longer chain, it starts at the oldest ancestor and walks down to the class you actually wrote after new. Think of building a house: foundation, then walls, then roof.",
      "Por eso C# siempre llama primero al constructor del padre y luego al del hijo. Con una cadena más larga, empieza por el ancestro más antiguo y baja hasta la clase que escribiste tras new. Piensa en construir una casa: cimientos, luego paredes, luego techo.",
      "だから C# はいつも親のコンストラクタを先に呼び、次に子を呼ぶ。もっと長い系図なら、一番上の祖先から始めて new のあとに書いたクラスまで順に下りていく。家を建てるのと同じ。土台、壁、屋根の順じゃ。",
    ),
    ex("new Car();\n\nclass Machine { public Machine() { Console.Write(\"gears \"); } }\nclass Vehicle : Machine { public Vehicle() { Console.Write(\"wheels \"); } }\nclass Car : Vehicle { public Car() { Console.Write(\"doors\"); } }", "gears wheels doors",
      L("From the oldest ancestor down to Car", "Del ancestro más antiguo hasta Car", "一番上の祖先から Car まで")),
    p(
      "Common mistake: thinking the child's constructor runs first because it is the one named after new. The child's constructor starts by calling the parent's (implicitly, or with : base(...)), and only then runs its own body.",
      "Error común: pensar que el constructor del hijo corre primero porque es el que aparece tras new. El constructor del hijo empieza llamando al del padre (de forma implícita, o con : base(...)), y solo después ejecuta su propio cuerpo.",
      "よくあるミス：new のあとに書いたのが子だから、子のコンストラクタが先に動くと思うこと。子のコンストラクタはまず親のものを呼び（暗黙に、または : base(...) で）、そのあとで自分の中身を実行する。",
    ),
  ),
  note("type-checks", L("is, as and casts", "is, as y casts", "is・as・キャスト"),
    p(
      "A parent-typed label can hold any child, so sometimes you need to ask what the object really is. x is Type answers with True or False, and checks the real object, not the label. It is also True for the object's own class and every ancestor of it.",
      "Una etiqueta del tipo padre puede guardar cualquier hijo, así que a veces necesitas preguntar qué es realmente el objeto. x is Tipo responde True o False, y revisa el objeto real, no la etiqueta. También es True para la propia clase del objeto y todos sus ancestros.",
      "親の型のラベルにはどの子でも入るので、中身が本当は何か調べたいときがある。x is 型 は True か False で答え、ラベルではなく本当のオブジェクトを調べる。オブジェクト自身のクラスとその祖先すべてに対して True になる。",
    ),
    ex("Tool t = new Hammer();\nConsole.WriteLine((t is Tool) + \" \" + (t is Hammer) + \" \" + (t is Saw));\n\nclass Tool { }\nclass Hammer : Tool { }\nclass Saw : Tool { }", "True True False"),
    p(
      "To convert, you have two choices. x as Type gives the object with that type if it fits, or null if it doesn't; it never crashes. A cast (Type)x also converts, but if the object doesn't fit, it throws InvalidCastException at runtime.",
      "Para convertir tienes dos opciones. x as Tipo da el objeto con ese tipo si encaja, o null si no; nunca falla. Un cast (Tipo)x también convierte, pero si el objeto no encaja, lanza InvalidCastException al ejecutar.",
      "変換には2つの方法がある。x as 型 は合えばその型で返し、合わなければ null を返す。クラッシュはしない。キャスト (型)x も変換するが、合わなければ実行時に InvalidCastException を投げる。",
    ),
    ex("Tool t = new Saw();\nHammer? h = t as Hammer;\nConsole.WriteLine(h == null ? \"not a hammer\" : \"hammer\");\n\nclass Tool { }\nclass Hammer : Tool { }\nclass Saw : Tool { }", "not a hammer",
      L("as gives null instead of crashing", "as da null en vez de fallar", "as はクラッシュせず null を返す")),
    p(
      "Why does a bad cast compile? Casting from a parent to a child is allowed because the label COULD hold that child; the compiler can't know which object will be there. The check happens when the line runs. Rule: use is or as when unsure; cast only when you know.",
      "¿Por qué compila un cast incorrecto? Convertir de padre a hijo está permitido porque la etiqueta PODRÍA guardar ese hijo; el compilador no sabe qué objeto habrá. La revisión ocurre al ejecutar la línea. Regla: usa is o as si dudas; haz cast solo cuando lo sepas.",
      "まちがったキャストがなぜコンパイルできる？親から子へのキャストは、ラベルにその子が入っている可能性があるので許される。どのオブジェクトが入るかコンパイラにはわからない。確かめるのは実行時。ルール：自信がなければ is か as、確実なときだけキャスト。",
    ),
  ),
];

const inheritance: LessonDef = {
  slug: "inheritance-and-polymorphism",
  title: L("Bloodlines", "Linajes", "血すじ"),
  concept: "inheritance",
  mode: "lesson",
  xp: 75,
  enemy: "ghost",
  enemyName: L("MASK GHOST", "FANTASMA MÁSCARA", "かめんゴースト"),
  beats: [
    say(L(
      "A class can INHERIT from one parent: class Dog : Animal. The child gets everything the parent has.",
      "Una clase puede HEREDAR de un padre: class Dog : Animal. El hijo recibe todo lo que tiene el padre.",
      "クラスはひとつの親を継承できる：class Dog : Animal。子は親の持ち物を全部もらえるよ。",
    )),
    {
      kind: "act",
      prompt: L("Give the dog its own voice", "Dale al perro su propia voz", "犬に自分の声をあげよう"),
      steps: [
        { label: L("PARENT", "PADRE", "親"), line: `class Animal { public virtual string Speak() => "..."; }`, effects: [{ t: "banner", text: L("virtual", "virtual", "virtual") }] },
        { label: L("CHILD", "HIJO", "子"), line: `class Dog : Animal { public override string Speak() => "Woof"; }`, effects: [{ t: "enter", actor: "ally" }] },
        { label: L("ANIMAL LABEL", "ETIQUETA Animal", "Animal ラベル"), line: "Animal a = new Dog();", effects: [{ t: "tag", actor: "ally", text: "Animal a" }] },
        { label: L("SPEAK", "HABLAR", "しゃべる"), line: "Console.WriteLine(a.Speak());", effects: [{ t: "say", actor: "ally", text: L("Woof!", "¡Guau!", "ワン！") }, { t: "print", text: "Woof" }], output: "Woof" },
      ],
    },
    say(L(
      "virtual + override: the REAL object decides which method runs, whatever type its label says.",
      "virtual + override: el objeto REAL decide qué método corre, diga lo que diga el tipo de su etiqueta.",
      "virtual と override なら、ラベルの型に関係なく本当のオブジェクトがメソッドを決める。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: `Animal a = new Dog();\nConsole.WriteLine(a.Speak());\n\nclass Animal { public virtual string Speak() => "..."; }\nclass Dog : Animal { public override string Speak() => "Woof"; }`,
      options: ["Woof", "..."],
      answer: 0,
      output: "Woof",
      check: { compiles: true, stdout: "Woof" },
      hint: L("The label says Animal, but what is the real object? Speak is virtual and overridden.", "La etiqueta dice Animal, pero ¿cuál es el objeto real? Speak es virtual y está sobrescrito.", "ラベルは Animal。でも本当の中身は？Speak は virtual で override 済み。"),
      note: "virtual-override",
      explain: L("The object is a Dog, and Speak is overridden, so Dog's version runs.", "El objeto es un Dog y Speak está sobrescrito, así que corre la versión de Dog.", "中身は Dog で Speak は override 済み。だから Dog の版が動く。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: `Animal a = new Puppy();\nConsole.WriteLine(a.Speak());\n\nclass Animal { public virtual string Speak() => "..."; }\nclass Dog : Animal { public override string Speak() => "Woof"; }\nclass Puppy : Dog { public override string Speak() => base.Speak() + "!"; }`,
      options: ["Woof!", "...!", "!"],
      answer: 0,
      output: "Woof!",
      check: { compiles: true, stdout: "Woof!" },
      hint: L("The real object picks Speak. Then follow base.Speak(): which class is Puppy's parent?", "El objeto real elige Speak. Luego sigue base.Speak(): ¿cuál es la clase padre de Puppy?", "Speak は本当の中身が選ぶ。次に base.Speak() をたどろう。Puppy の親はどのクラス？"),
      note: "virtual-override",
      explain: L("base.Speak() calls the parent's version (Dog's Woof), then Puppy adds \"!\".", "base.Speak() llama a la versión del padre (el Woof de Dog) y Puppy agrega \"!\".", "base.Speak() は親（Dog）の Woof を呼び、Puppy が \"!\" を足す。"),
    },
    say(L(
      "new instead of override only HIDES the method. Then the label's type decides, not the object.",
      "new en vez de override solo OCULTA el método. Entonces decide el tipo de la etiqueta, no el objeto.",
      "override の代わりに new だと、メソッドを隠すだけ。決めるのはオブジェクトじゃなくラベルの型。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: `Animal a = new Cat();\nCat c = new Cat();\nConsole.WriteLine(a.Speak() + " " + c.Speak());\n\nclass Animal { public virtual string Speak() => "..."; }\nclass Cat : Animal { public new string Speak() => "Meow"; }`,
      options: ["... Meow", "Meow Meow", "... ..."],
      answer: 0,
      output: "... Meow",
      check: { compiles: true, stdout: "... Meow" },
      hint: L("Cat uses new, not override. When a method is only hidden, does the object or the label decide?", "Cat usa new, no override. Cuando un método solo se oculta, ¿decide el objeto o la etiqueta?", "Cat は override ではなく new。隠しただけのとき、決めるのは中身？ラベル？"),
      note: "method-hiding",
      explain: L("new hides instead of overriding. Through an Animal label you get Animal's Speak.", "new oculta en vez de sobrescribir. Con una etiqueta Animal obtienes el Speak de Animal.", "new は隠すだけ。Animal ラベル経由だと Animal の Speak が動く。"),
      win: [{ t: "tag", actor: "hero", text: "Animal a" }, { t: "say", actor: "hero", text: L("...", "...", "…") }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Cat c" }, { t: "say", actor: "ally", text: L("Meow!", "¡Miau!", "ニャー！") }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: `new Child();\n\nclass Parent { public Parent() { Console.Write("P "); } }\nclass Child : Parent { public Child() { Console.Write("C "); } }`,
      options: ["P C", "C P", "C"],
      answer: 0,
      output: "P C",
      check: { compiles: true, stdout: "P C" },
      hint: L("Building a child needs its parent part ready first. Which constructor body runs first?", "Construir un hijo necesita primero lista la parte del padre. ¿Qué cuerpo de constructor corre primero?", "子を作るには先に親の部分が必要。どちらのコンストラクタの中身が先に動く？"),
      note: "constructor-order",
      explain: L("Building a child builds the parent part first, so Parent's constructor runs first.", "Construir un hijo arma primero la parte del padre, así que el constructor de Parent corre antes.", "子を作るときは先に親の部分を作る。だから Parent のコンストラクタが先。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: `Console.WriteLine(new B().F());\n\nclass A { public string F() => "a"; }\nclass B : A { public override string F() => "b"; }`,
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
      hint: L("Look at F in class A. What must a parent method be marked with before a child can override it?", "Mira F en la clase A. ¿Con qué debe marcarse un método del padre para que un hijo lo sobrescriba?", "クラス A の F を見よう。子が override するには、親のメソッドに何が必要？"),
      note: "virtual-override",
      explain: L("Error CS0506: you can only override a method marked virtual, abstract or override.", "Error CS0506: solo puedes sobrescribir un método marcado virtual, abstract u override.", "エラー CS0506：override できるのは virtual・abstract・override のメソッドだけ。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: "var m = new Minion();\n\nsealed class Boss { }\nclass Minion : Boss { }",
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
      hint: L("Look at the word in front of class Boss. What does it say about having children?", "Mira la palabra delante de class Boss. ¿Qué dice sobre tener hijos?", "class Boss の前の言葉を見よう。子を持つことについて何と言っている？"),
      note: "virtual-override",
      explain: L("Error CS0509: a sealed class can't have children.", "Error CS0509: una clase sealed no puede tener hijos.", "エラー CS0509：sealed クラスは継承できない。"),
    },
    say(L(
      "is checks a type. as converts or gives null. A (cast) to the wrong type crashes.",
      "is revisa un tipo. as convierte o da null. Un (cast) al tipo equivocado falla.",
      "is は型を調べる。as は変換か null。まちがった型への (キャスト) はクラッシュ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "Animal a = new Dog();\nConsole.WriteLine((a is Dog) + \" \" + (a is Cat) + \" \" + (a as Cat == null));\n\nclass Animal { }\nclass Dog : Animal { }\nclass Cat : Animal { }",
      options: ["True False True", "True False False", "False False True"],
      answer: 0,
      output: "True False True",
      check: { compiles: true, stdout: "True False True" },
      hint: L("is checks the real object. as gives null when the object doesn't fit the type.", "is revisa el objeto real. as da null cuando el objeto no encaja en el tipo.", "is は本当の中身を調べる。as は型に合わないとき null を返す。"),
      note: "type-checks",
      explain: L("a is a Dog, not a Cat, so as Cat gives null instead of crashing.", "a es un Dog, no un Cat, así que as Cat da null en vez de fallar.", "a は Dog で Cat じゃない。as Cat はクラッシュせず null。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: "Animal a = new Dog();\nCat c = (Cat)a;\nConsole.WriteLine(\"ok\");\n\nclass Animal { }\nclass Dog : Animal { }\nclass Cat : Animal { }",
      options: [L("Crash: InvalidCastException", "Falla: InvalidCastException", "クラッシュ：InvalidCastException"), "ok", L("Compile error", "Error de compilación", "コンパイルエラー")],
      answer: 0,
      check: { compiles: true, throws: "System.InvalidCastException" },
      hint: L("The compiler allows parent-to-child casts. At runtime, does the real object fit Cat?", "El compilador permite casts de padre a hijo. Al ejecutar, ¿el objeto real encaja en Cat?", "親から子へのキャストはコンパイルは通る。実行時、本当の中身は Cat に合う？"),
      note: "type-checks",
      explain: L("The compiler allows Animal to Cat, but at runtime the object is a Dog: the cast throws.", "El compilador permite Animal a Cat, pero al ejecutar el objeto es un Dog: el cast lanza.", "Animal から Cat はコンパイルは通るが、実行時の中身は Dog なのでキャストが失敗。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "run",
      prompt: L("Fix it: the dragon must print ROAR", "Arréglalo: el dragón debe imprimir ROAR", "直そう：ドラゴンに ROAR と言わせて"),
      starter: `using System;

Monster m = new Dragon();
Console.WriteLine(m.Roar());

class Monster { public string Roar() => "..."; }
class Dragon : Monster { public new string Roar() => "ROAR"; }
`,
      solution: `using System;

Monster m = new Dragon();
Console.WriteLine(m.Roar());

class Monster { public virtual string Roar() => "..."; }
class Dragon : Monster { public override string Roar() => "ROAR"; }
`,
      expect: "ROAR",
      fallback: [
        String.raw`(virtual|abstract)\s+string\s+Roar[\s\S]*override\s+string\s+Roar`,
        String.raw`Dragon\s+m\s*=`,
      ],
      hint: L("new only hides Roar, so the Monster label decides. Which pair of keywords lets the object decide?", "new solo oculta Roar, así que decide la etiqueta Monster. ¿Qué par de palabras deja decidir al objeto?", "new は Roar を隠すだけで、Monster ラベルが決める。中身に決めさせるキーワードの組は？"),
      note: "method-hiding",
      explain: L("new only hides Roar. Mark the parent virtual and the child override so the real object decides.", "new solo oculta Roar. Marca el padre virtual y el hijo override para que decida el objeto real.", "new は隠すだけ。親を virtual、子を override にすれば本当のオブジェクトが決める。"),
    },
  ],
  notes: inheritanceNotes,
};

// ─── 2.3 Contracts and half-built blueprints ───────────────────────────────
const interfacesNotes: NoteDef[] = [
  note("interface-contracts", L("Interfaces are contracts", "Las interfaces son contratos", "インターフェースは契約"),
    p(
      "An interface lists methods without writing what they do: interface ISwimmer { string Swim(); } It's a contract. A class signs it with a colon, class Duck : ISwimmer, and then it MUST write a public method for every member the interface lists. Forgetting one is error CS0535.",
      "Una interfaz enumera métodos sin escribir qué hacen: interface ISwimmer { string Swim(); } Es un contrato. Una clase lo firma con dos puntos, class Duck : ISwimmer, y entonces DEBE escribir un método público por cada miembro que la interfaz enumera. Olvidar uno es el error CS0535.",
      "インターフェースはメソッドの名前を並べるだけで中身は書かない：interface ISwimmer { string Swim(); } これが契約。クラスはコロンで署名し（class Duck : ISwimmer）、並んだメンバーを全部 public メソッドとして書かないといけない。1つでも忘れると CS0535 エラー。",
    ),
    bad("interface ISwimmer { string Swim(); }\nclass Rock : ISwimmer { public int Weight; }",
      L("CS0535: Rock signed ISwimmer but has no Swim()", "CS0535: Rock firmó ISwimmer pero no tiene Swim()", "CS0535：Rock は ISwimmer に署名したのに Swim() がない")),
    p(
      "Why bother? Because code can depend on the contract instead of a specific class. A variable, array or parameter typed ISwimmer accepts ANY object whose class signed it. When you call a method through it, each object runs its own version.",
      "¿Para qué sirve? Porque el código puede depender del contrato en vez de una clase concreta. Una variable, array o parámetro de tipo ISwimmer acepta CUALQUIER objeto cuya clase lo firmó. Al llamar un método a través de él, cada objeto ejecuta su propia versión.",
      "何がうれしいのか？コードが特定のクラスではなく契約に頼れるからじゃ。ISwimmer 型の変数・配列・引数には、署名したクラスのオブジェクトなら何でも入る。それを通してメソッドを呼ぶと、オブジェクトごとに自分の版が動く。",
    ),
    ex("ISwimmer[] pool = { new Duck(), new Fish() };\nforeach (var s in pool) Console.Write(s.Swim() + \" \");\n\ninterface ISwimmer { string Swim(); }\nclass Duck : ISwimmer { public string Swim() => \"paddle\"; }\nclass Fish : ISwimmer { public string Swim() => \"glide\"; }", "paddle glide",
      L("One contract type, each object with its own Swim", "Un tipo de contrato, cada objeto con su propio Swim", "契約の型はひとつ、Swim は各自のもの")),
    p(
      "A common pattern is to pass the contract into a constructor and keep it in a private field. The class then works with whatever implementation it was given, without knowing which one. Swapping behavior means passing a different object, not editing the class.",
      "Un patrón común es pasar el contrato al constructor y guardarlo en un campo privado. Así la clase trabaja con la implementación que le dieron, sin saber cuál es. Cambiar el comportamiento es pasar otro objeto, no editar la clase.",
      "よくある形は、契約をコンストラクタで受け取って private フィールドにしまうこと。するとクラスは、どれかを知らずに渡された実装で仕事をする。ふるまいを変えたいときは、クラスを書きかえずに別のオブジェクトを渡せばいい。",
    ),
    ex("var printer = new Printer(new Stars());\nConsole.WriteLine(printer.Show(\"go\"));\n\ninterface IDecor { string Wrap(string s); }\nclass Stars : IDecor { public string Wrap(string s) => \"*\" + s + \"*\"; }\nclass Printer\n{\n    private readonly IDecor _d;\n    public Printer(IDecor d) { _d = d; }\n    public string Show(string s) => _d.Wrap(s);\n}", "*go*"),
  ),
  note("default-interface-methods", L("Default methods in interfaces", "Métodos por defecto en interfaces", "インターフェースのデフォルト実装"),
    p(
      "An interface member can come with a body: interface ILight { string Glow() => \"dim\"; } That's a default implementation. A class that signs the contract may skip writing Glow, and the default is used. If the class does write its own Glow, its version wins.",
      "Un miembro de interfaz puede traer cuerpo: interface ILight { string Glow() => \"dim\"; } Eso es una implementación por defecto. Una clase que firma el contrato puede no escribir Glow, y se usa la de por defecto. Si la clase escribe su propio Glow, gana su versión.",
      "インターフェースのメンバーは中身を持てる：interface ILight { string Glow() => \"dim\"; } これがデフォルト実装。署名したクラスは Glow を書かなくてもよく、そのときはデフォルトが使われる。クラスが自分の Glow を書けば、そちらが優先される。",
    ),
    ex("ILight a = new Candle();\nILight b = new Torch();\nConsole.WriteLine(a.Glow() + \" \" + b.Glow());\n\ninterface ILight { string Glow() => \"dim\"; }\nclass Candle : ILight { }\nclass Torch : ILight { public string Glow() => \"bright\"; }", "dim bright",
      L("Candle uses the default; Torch writes its own", "Candle usa el de por defecto; Torch escribe el suyo", "Candle はデフォルト、Torch は自分の版")),
    p(
      "One catch: a default method belongs to the interface, not to the class. If the class didn't write it, you can only reach it through a variable typed as the interface. Calling it through a class-typed variable is a compile error, because the class itself has no such method.",
      "Un detalle: un método por defecto pertenece a la interfaz, no a la clase. Si la clase no lo escribió, solo puedes alcanzarlo con una variable del tipo de la interfaz. Llamarlo con una variable del tipo de la clase es un error de compilación, porque la clase no tiene ese método.",
      "注意点：デフォルトメソッドはクラスではなくインターフェースのもの。クラスが書いていなければ、インターフェース型の変数からしか呼べない。クラス型の変数から呼ぶとコンパイルエラー。クラス自身はそのメソッドを持っていないからじゃ。",
    ),
    bad("var c = new Candle();\nConsole.WriteLine(c.Glow());\n\ninterface ILight { string Glow() => \"dim\"; }\nclass Candle : ILight { }",
      L("Does not compile: Candle itself has no Glow", "No compila: Candle en sí no tiene Glow", "コンパイル不可：Candle 自身には Glow がない")),
    p(
      "To predict output, check each class: did it write the method? Yes: its own body runs. No: the interface's default runs. Default methods let a contract grow new members without breaking every class that already signed it.",
      "Para predecir la salida, revisa cada clase: ¿escribió el método? Sí: corre su propio cuerpo. No: corre el de la interfaz. Los métodos por defecto permiten que un contrato gane miembros nuevos sin romper las clases que ya lo firmaron.",
      "出力を予想するには、クラスごとに「そのメソッドを書いた？」を確かめよう。書いた：自分の中身が動く。書いていない：インターフェースのデフォルトが動く。デフォルトメソッドのおかげで、署名済みのクラスを壊さずに契約へ新しいメンバーを足せる。",
    ),
  ),
  note("abstract-classes", L("Abstract classes and the parent list", "Clases abstractas y lista de padres", "abstract クラスと親リスト"),
    p(
      "An abstract class is a half-built blueprint. It can have normal fields and methods with real code, plus abstract methods that have no body at all. Every non-abstract child must fill each blank with override, or it doesn't compile.",
      "Una clase abstracta es un plano a medias. Puede tener campos y métodos normales con código real, más métodos abstract sin ningún cuerpo. Cada hijo no abstracto debe llenar cada espacio en blanco con override, o no compila.",
      "abstract クラスは作りかけの設計図。ふつうのフィールドや中身のあるメソッドに加え、中身がまったくない abstract メソッドを持てる。abstract でない子は、空欄を全部 override で埋めないとコンパイルできない。",
    ),
    ex("Pet p = new Frog();\nConsole.WriteLine(p.Intro());\n\nabstract class Pet\n{\n    public abstract string Sound();\n    public string Intro() => \"it says \" + Sound();\n}\nclass Frog : Pet { public override string Sound() => \"ribbit\"; }", "it says ribbit",
      L("Intro lives in Pet, but calls the Frog's Sound", "Intro vive en Pet, pero llama al Sound de Frog", "Intro は Pet にあるが、Frog の Sound を呼ぶ")),
    p(
      "Because some parts are blank, you can't build an abstract class directly: new Pet() is error CS0144. You build a child that filled the blanks, and you can still keep it in a variable typed as the abstract parent. Shared methods in the parent call the child's versions of the abstract parts.",
      "Como algunas partes están en blanco, no puedes construir una clase abstracta directamente: new Pet() es el error CS0144. Construyes un hijo que llenó los espacios, y puedes guardarlo en una variable del tipo del padre abstracto. Los métodos compartidos del padre llaman a las versiones del hijo.",
      "空欄があるので、abstract クラスを直接作ることはできない。new Pet() は CS0144 エラー。空欄を埋めた子を作り、abstract の親の型の変数に入れることはできる。親の共通メソッドは、abstract 部分について子の版を呼ぶ。",
    ),
    bad("var p = new Pet();\n\nabstract class Pet { public abstract string Sound(); }",
      L("CS0144: an abstract class can't be built with new", "CS0144: una clase abstracta no se construye con new", "CS0144：abstract クラスは new できない")),
    p(
      "In the parent list after the colon, C# allows at most ONE base class, and it must come first. After it you may list as many interfaces as you like. Two classes in the list is error CS1721; a class written after an interface is also an error.",
      "En la lista de padres tras los dos puntos, C# permite como mucho UNA clase base, y debe ir primero. Después puedes poner tantas interfaces como quieras. Dos clases en la lista es el error CS1721; una clase escrita después de una interfaz también es error.",
      "コロンのあとの親リストでは、基底クラスは1つまでで、しかも先頭に書く。そのあとにインターフェースはいくつでも並べられる。クラスを2つ書くと CS1721 エラー。インターフェースのあとにクラスを書いてもエラーになる。",
    ),
    bad("var g = new Gryphon();\n\nclass Lion { }\nclass Eagle { }\nclass Gryphon : Lion, Eagle { }",
      L("CS1721: only one base class is allowed", "CS1721: solo se permite una clase base", "CS1721：基底クラスは1つだけ")),
  ),
];

const interfacesAndAbstract: LessonDef = {
  slug: "interfaces-and-abstract",
  title: L("Contracts and blueprints", "Contratos y planos", "契約と未完の設計図"),
  concept: "interfaces",
  mode: "lesson",
  xp: 75,
  enemy: "csharp/deadlock-hourglass",
  enemyName: L("BROKEN PROMISE", "PROMESA ROTA", "やぶれた約束"),
  beats: [
    say(L(
      "An INTERFACE is a contract: \"I can Greet\". A class that signs it MUST write every method it lists.",
      "Una INTERFAZ es un contrato: \"Sé saludar\". La clase que lo firma DEBE escribir cada método que lista.",
      "インターフェースは契約。「あいさつできます」。署名したクラスは並んだメソッドを全部書くこと。",
    )),
    {
      kind: "act",
      prompt: L("Sign the contract, then keep it", "Firma el contrato y cúmplelo", "契約に署名して、守ろう"),
      steps: [
        { label: L("CONTRACT", "CONTRATO", "契約"), line: "interface IGreeter { string Greet(); }", effects: [{ t: "banner", text: L("CAN GREET", "SABE SALUDAR", "あいさつできる") }] },
        {
          label: L("SIGN ONLY", "SOLO FIRMAR", "署名だけ"),
          line: "class Robot : IGreeter { }",
          effects: [{ t: "enter", actor: "ally" }, { t: "shake" }],
          error: {
            compiler: "error CS0535: 'Robot' does not implement interface member 'IGreeter.Greet()'",
            plain: L("Robot signed the contract but never wrote Greet. The compiler refuses.", "Robot firmó el contrato pero nunca escribió Greet. El compilador se niega.", "Robot は署名したのに Greet を書いていない。コンパイラが拒否するよ。"),
          },
        },
        { label: L("KEEP IT", "CUMPLIRLO", "約束を守る"), line: `class Robot : IGreeter { public string Greet() => "beep"; }`, effects: [{ t: "say", actor: "ally", text: L("Contract kept!", "¡Contrato cumplido!", "契約どおり！") }] },
        { label: L("GREET", "SALUDAR", "あいさつ"), line: "IGreeter g = new Robot();\nConsole.WriteLine(g.Greet());", effects: [{ t: "tag", actor: "ally", text: "IGreeter g" }, { t: "print", text: "beep" }], output: "beep" },
      ],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: "IEnemy e = new Slime();\n\ninterface IEnemy { int Damage(); }\nclass Slime : IEnemy { public int Hp; }",
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
      hint: L("Slime signs IEnemy. Compare what the contract lists with what Slime actually writes.", "Slime firma IEnemy. Compara lo que enumera el contrato con lo que Slime escribe de verdad.", "Slime は IEnemy に署名した。契約に並ぶものと Slime が実際に書いたものを比べよう。"),
      note: "interface-contracts",
      explain: L("Error CS0535: Slime promised Damage() but never wrote it.", "Error CS0535: Slime prometió Damage() pero nunca lo escribió.", "エラー CS0535：Slime は Damage() を約束したのに書いていない。"),
    },
    say(L(
      "Code can talk to the contract, not the class: an IGreeter label works with ANY class that signed it.",
      "El código puede hablar con el contrato, no con la clase: una etiqueta IGreeter sirve para CUALQUIER clase firmante.",
      "コードはクラスじゃなく契約と話せる。IGreeter のラベルは署名したどのクラスでも使えるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: `IGreeter[] all = { new Robot(), new Elf() };\nConsole.WriteLine(all[0].Greet() + " " + all[1].Greet());\n\ninterface IGreeter { string Greet(); }\nclass Robot : IGreeter { public string Greet() => "beep"; }\nclass Elf : IGreeter { public string Greet() => "hail"; }`,
      options: ["beep hail", "beep beep", "hail hail"],
      answer: 0,
      output: "beep hail",
      check: { compiles: true, stdout: "beep hail" },
      hint: L("Through the IGreeter type, each call still runs the Greet written by that object's class.", "A través del tipo IGreeter, cada llamada ejecuta el Greet escrito por la clase de ese objeto.", "IGreeter 型を通しても、呼ぶたびにそのオブジェクトのクラスが書いた Greet が動く。"),
      note: "interface-contracts",
      explain: L("Each object answers with its own Greet, even through the shared IGreeter type.", "Cada objeto responde con su propio Greet, aun a través del tipo común IGreeter.", "共通の IGreeter 型を通しても、それぞれ自分の Greet で答える。"),
    },
    say(L(
      "An interface can give a DEFAULT body. A class may skip it, but then it's reachable only through the interface.",
      "Una interfaz puede dar un cuerpo POR DEFECTO. La clase puede omitirlo, pero solo se alcanza vía la interfaz.",
      "インターフェースはデフォルトの中身を持てる。クラスが書かなくても、インターフェース経由で使えるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: `IGreeter g = new Robot();\nConsole.WriteLine(g.Greet() + " " + g.Bye());\n\ninterface IGreeter { string Greet(); string Bye() => "bye"; }\nclass Robot : IGreeter { public string Greet() => "beep"; }`,
      options: ["beep bye", L("Compile error", "Error de compilación", "コンパイルエラー"), "beep"],
      answer: 0,
      output: "beep bye",
      check: { compiles: true, stdout: "beep bye" },
      hint: L("Bye has a body in the interface. Did Robot write its own Bye?", "Bye tiene cuerpo en la interfaz. ¿Escribió Robot su propio Bye?", "Bye はインターフェースに中身がある。Robot は自分の Bye を書いた？"),
      note: "default-interface-methods",
      explain: L("Robot didn't write Bye, so the interface's default \"bye\" is used.", "Robot no escribió Bye, así que se usa el \"bye\" por defecto de la interfaz.", "Robot は Bye を書いていないので、インターフェースのデフォルト \"bye\" が使われる。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: `IGreeter g = new Elf();\nConsole.WriteLine(g.Bye());\n\ninterface IGreeter { string Greet(); string Bye() => "bye"; }\nclass Elf : IGreeter\n{\n    public string Greet() => "hail";\n    public string Bye() => "farewell";\n}`,
      options: ["farewell", "bye"],
      answer: 0,
      output: "farewell",
      check: { compiles: true, stdout: "farewell" },
      hint: L("Check Elf: did it write its own Bye? Which wins, the class's version or the default?", "Revisa Elf: ¿escribió su propio Bye? ¿Qué gana, la versión de la clase o la de por defecto?", "Elf を確かめよう。自分の Bye を書いた？クラスの版とデフォルト、どちらが勝つ？"),
      note: "default-interface-methods",
      explain: L("Elf wrote its own Bye, so it replaces the default.", "Elf escribió su propio Bye, así que reemplaza al de por defecto.", "Elf は自分の Bye を書いたので、デフォルトより優先される。"),
    },
    say(L(
      "An ABSTRACT class is a half-built blueprint: shared code plus blank abstract parts. You can't new it.",
      "Una clase ABSTRACTA es un plano a medias: código compartido más partes abstract en blanco. No puedes hacerle new.",
      "abstract クラスは作りかけの設計図。共通コードと空欄の abstract 部分。new はできないよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: `Shape s = new Square(3);\nConsole.WriteLine(s.Area() + " " + s.Describe());\n\nabstract class Shape\n{\n    public abstract int Area();\n    public string Describe() => $"area={Area()}";\n}\nclass Square : Shape\n{\n    private int _s;\n    public Square(int s) { _s = s; }\n    public override int Area() => _s * _s;\n}`,
      options: ["9 area=9", "9 area=0", "6 area=6"],
      answer: 0,
      output: "9 area=9",
      check: { compiles: true, stdout: "9 area=9" },
      hint: L("Square fills the blank Area(). When Describe calls Area(), which version runs for a Square?", "Square llena el Area() en blanco. Cuando Describe llama a Area(), ¿qué versión corre para un Square?", "Square が空欄の Area() を埋める。Describe が Area() を呼ぶと、Square ではどの版が動く？"),
      note: "abstract-classes",
      explain: L("Square fills in the blank Area(). Describe, written in Shape, calls Square's version.", "Square llena el Area() en blanco. Describe, escrito en Shape, llama a la versión de Square.", "Square が空欄の Area() を埋める。Shape の Describe も Square の版を呼ぶ。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: "var s = new Shape();\n\nabstract class Shape { public abstract int Area(); }",
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
      hint: L("Shape is abstract and has a blank method. Can new build an object with a blank part?", "Shape es abstracta y tiene un método en blanco. ¿Puede new construir un objeto con una parte en blanco?", "Shape は abstract で空欄のメソッドがある。空欄のある物を new で作れる？"),
      note: "abstract-classes",
      explain: L("Error CS0144: an abstract class has blank parts, so you can't build one directly.", "Error CS0144: una clase abstracta tiene partes en blanco, no puedes construirla directamente.", "エラー CS0144：abstract クラスは空欄があるので直接作れない。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "pick",
      prompt: L("Which parent list compiles?", "¿Qué lista de padres compila?", "コンパイルできる親リストは？"),
      code: "var b = new Bat();\n\nclass Bat : ___ { }\nclass Animal { }\nclass Bird { }\ninterface IFlyer { }\ninterface IBiter { }",
      options: ["Animal, IFlyer, IBiter", "Animal, Bird", "Bird, Animal, IFlyer"],
      answer: 0,
      check: { compiles: true, wrongFail: true },
      hint: L("Count the classes in each list. How many base classes may a class have, and where do they go?", "Cuenta las clases de cada lista. ¿Cuántas clases base puede tener una clase y dónde van?", "各リストのクラスを数えよう。基底クラスはいくつまで？どこに書く？"),
      note: "abstract-classes",
      explain: L("One base class at most, then as many interfaces as you like. Two classes is error CS1721.", "Como mucho una clase base, luego tantas interfaces como quieras. Dos clases es error CS1721.", "基底クラスは1つまで。インターフェースはいくつでも。クラス2つはエラー CS1721。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: `var g = new Greeter(new Loud());\nConsole.WriteLine(g.Greet("ada"));\n\ninterface IFormatter { string Format(string s); }\nclass Loud : IFormatter { public string Format(string s) => s.ToUpper() + "!"; }\nclass Greeter\n{\n    private readonly IFormatter _f;\n    public Greeter(IFormatter f) { _f = f; }\n    public string Greet(string n) => _f.Format("hi " + n);\n}`,
      options: ["HI ADA!", "hi ada", "hi ada!"],
      answer: 0,
      output: "HI ADA!",
      check: { compiles: true, stdout: "HI ADA!" },
      hint: L("Greeter only calls the contract. Follow which IFormatter object was passed to its constructor.", "Greeter solo llama al contrato. Sigue qué objeto IFormatter se pasó a su constructor.", "Greeter は契約を呼ぶだけ。コンストラクタにどの IFormatter が渡されたかたどろう。"),
      note: "interface-contracts",
      explain: L("Greeter only knows the contract. The Loud formatter handed to its constructor does the work.", "Greeter solo conoce el contrato. El formateador Loud que recibe en el constructor hace el trabajo.", "Greeter が知っているのは契約だけ。コンストラクタで受け取った Loud が仕事をする。"),
    },
    {
      kind: "run",
      prompt: L("Keep the contract: print damage: 3", "Cumple el contrato: imprime damage: 3", "契約を守ろう：damage: 3 と表示"),
      starter: `using System;

IEnemy e = new Slime();
Console.WriteLine($"damage: {e.Damage()}");

interface IEnemy { int Damage(); }
class Slime : IEnemy { }
`,
      solution: `using System;

IEnemy e = new Slime();
Console.WriteLine($"damage: {e.Damage()}");

interface IEnemy { int Damage(); }
class Slime : IEnemy { public int Damage() => 3; }
`,
      expect: "damage: 3",
      fallback: [
        String.raw`public\s+int\s+Damage\s*\(\s*\)\s*(=>\s*3|\{\s*return\s+3\s*;)`,
        String.raw`int\s+IEnemy\.Damage\s*\(\s*\)\s*(=>\s*3|\{\s*return\s+3\s*;)`,
      ],
      hint: L("Slime signed IEnemy but wrote nothing. Every member the contract lists needs a public method.", "Slime firmó IEnemy pero no escribió nada. Cada miembro del contrato necesita un método público.", "Slime は IEnemy に署名したのに何も書いていない。契約のメンバーには public メソッドが必要。"),
      note: "interface-contracts",
      explain: L("Slime signed IEnemy, so it must write Damage(): public int Damage() => 3;", "Slime firmó IEnemy, así que debe escribir Damage(): public int Damage() => 3;", "Slime は IEnemy に署名したので Damage() を書こう：public int Damage() => 3;"),
    },
  ],
  notes: interfacesNotes,
};

// ─── 2.4 Twins, tuples and the sorting hat ─────────────────────────────────
const recordsNotes: NoteDef[] = [
  note("record-equality", L("Records compare by value", "Los records comparan por valor", "record は値で比べる"),
    p(
      "A record is a class built for holding data. The short form record Coin(string Metal, int Weight); creates a type with two properties, a constructor that takes them in order, and some useful behavior for free.",
      "Un record es una clase hecha para guardar datos. La forma corta record Coin(string Metal, int Weight); crea un tipo con dos propiedades, un constructor que las recibe en orden y algunos comportamientos útiles gratis.",
      "record はデータを持つために作られたクラス。短い書き方 record Coin(string Metal, int Weight); で、プロパティ2つと、それを順番に受け取るコンストラクタ、そして便利な機能がついた型ができる。",
    ),
    p(
      "The big difference is equality. For a plain class, == asks \"same object?\", so two separate new objects are never equal. For a record, == compares every property: same values means equal, even though they are still two different objects. ReferenceEquals still tells them apart.",
      "La gran diferencia es la igualdad. En una clase normal, == pregunta \"¿mismo objeto?\", así que dos objetos new separados nunca son iguales. En un record, == compara cada propiedad: mismos valores significa iguales, aunque sigan siendo dos objetos distintos. ReferenceEquals los sigue distinguiendo.",
      "大きなちがいは等価性。ふつうの class の == は「同じ物？」を調べるので、別々に new した2つは等しくならない。record の == はプロパティを全部比べる。値が同じなら、物としては別々でも等しい。ReferenceEquals なら別物だとわかる。",
    ),
    ex("var x = new Coin(\"gold\", 2);\nvar y = new Coin(\"gold\", 2);\nConsole.WriteLine((x == y) + \" \" + ReferenceEquals(x, y));\n\nrecord Coin(string Metal, int Weight);", "True False",
      L("Equal values, two separate objects", "Valores iguales, dos objetos separados", "値は同じ、物はふたつ")),
    p(
      "Records also print themselves: ToString shows the type name and every property, like Coin { Metal = gold, Weight = 2 }. A plain class would only print its type name.",
      "Los records también se imprimen solos: ToString muestra el nombre del tipo y cada propiedad, como Coin { Metal = gold, Weight = 2 }. Una clase normal solo imprimiría el nombre de su tipo.",
      "record は表示も自分でしてくれる。ToString は型名と全部のプロパティを見せる：Coin { Metal = gold, Weight = 2 }。ふつうの class なら型名だけじゃ。",
    ),
    ex("Console.WriteLine(new Coin(\"silver\", 5));\n\nrecord Coin(string Metal, int Weight);", "Coin { Metal = silver, Weight = 5 }"),
    p(
      "Rule to remember: when two things with the same data should count as the same, make the type a record. If you need identity (this exact object), use a class and compare with ==.",
      "Regla para recordar: cuando dos cosas con los mismos datos deben contar como iguales, haz que el tipo sea un record. Si necesitas identidad (este objeto exacto), usa una clase y compara con ==.",
      "覚えるルール：同じデータなら同じとみなしたいときは record にする。「まさにこの物」という同一性が必要なら class を使い、== で比べる。",
    ),
  ),
  note("with-copies", L("Init-only records, with, deconstruction", "Records init, with y desarmado", "init の record・with・分解"),
    p(
      "The properties of a positional record are init-only: they get their values when the record is built and then never change. Assigning one later is error CS8852. This keeps data records safe to share.",
      "Las propiedades de un record posicional son init: reciben su valor al construir el record y después nunca cambian. Asignar una más tarde es el error CS8852. Eso hace que los records de datos sean seguros de compartir.",
      "位置 record のプロパティは init 専用。record を作るときに値が入り、そのあとは変わらない。あとで代入すると CS8852 エラー。だからデータの record は安心して共有できる。",
    ),
    bad("var c = new Coin(\"gold\", 2);\nc.Weight = 3;\n\nrecord Coin(string Metal, int Weight);",
      L("CS8852: record properties are init-only", "CS8852: las propiedades del record son init", "CS8852：record のプロパティは init 専用")),
    p(
      "To get a version with different values, use with: var b = a with { Weight = 9 }; It builds a NEW record, copying every property of a and then setting the ones listed in the braces. The original a is untouched.",
      "Para obtener una versión con otros valores, usa with: var b = a with { Weight = 9 }; Construye un record NUEVO, copiando cada propiedad de a y luego asignando las que aparecen entre llaves. El a original queda intacto.",
      "値をちがえた版がほしいときは with を使う：var b = a with { Weight = 9 }; a のプロパティを全部コピーした新しい record を作り、{ } の中に書いたものだけ設定する。元の a はそのまま。",
    ),
    ex("var first = new Coin(\"copper\", 1);\nvar second = first with { Metal = \"bronze\" };\nConsole.WriteLine(first.Metal + \" \" + second.Metal);\n\nrecord Coin(string Metal, int Weight);", "copper bronze"),
    p(
      "with is a SHALLOW copy. A property that holds a reference type, such as an array, copies only the arrow, so both records point to the same array. Changing an element through one record shows up in the other, and == still says True because the arrows match.",
      "with es una copia SUPERFICIAL. Una propiedad que guarda un tipo de referencia, como un array, copia solo la flecha, así que ambos records apuntan al mismo array. Cambiar un elemento por un record se ve en el otro, y == sigue diciendo True porque las flechas coinciden.",
      "with は浅いコピー。配列のような参照型のプロパティは矢印だけがコピーされ、両方の record が同じ配列を指す。片方から要素を変えるともう片方にも見え、矢印が同じなので == も True のまま。",
    ),
    ex("var s1 = new Shelf(new[] { \"atlas\" });\nvar s2 = s1 with { };\ns2.Books[0] = \"poems\";\nConsole.WriteLine(s1.Books[0]);\n\nrecord Shelf(string[] Books);", "poems",
      L("Both shelves share one array", "Ambos estantes comparten un array", "2つの棚が1つの配列を共有")),
    p(
      "A positional record can also be unpacked: var (metal, weight) = coin; creates one variable per property, in the same order as the record's parameter list. The names you choose don't matter, only the position.",
      "Un record posicional también se puede desarmar: var (metal, weight) = coin; crea una variable por propiedad, en el mismo orden que la lista de parámetros del record. Los nombres que elijas no importan, solo la posición.",
      "位置 record は分解もできる：var (metal, weight) = coin; で、record の引数リストと同じ順番でプロパティごとに変数ができる。名前は自由で、大事なのは位置だけ。",
    ),
  ),
  note("tuples", L("Tuples: values grouped in ( )", "Tuplas: valores agrupados en ( )", "タプル：( ) でまとめた値"),
    p(
      "A tuple groups a few values without declaring a type: var pair = (4, \"ok\"); You can read the parts by position, and print the whole thing, which shows (4, ok). Methods can return tuples to give back more than one value.",
      "Una tupla agrupa unos valores sin declarar un tipo: var pair = (4, \"ok\"); Puedes leer las partes por posición e imprimir el conjunto, que muestra (4, ok). Los métodos pueden devolver tuplas para entregar más de un valor.",
      "タプルは型を宣言せずにいくつかの値をまとめる：var pair = (4, \"ok\"); 中身は位置で読め、全体を表示すると (4, ok) になる。メソッドはタプルを返して、複数の値を返すこともできる。",
    ),
    ex("var (low, high) = Bounds(new[] { 8, 3, 6 });\nConsole.WriteLine(low + \"..\" + high);\n\nstatic (int, int) Bounds(int[] xs) => (xs.Min(), xs.Max());", "3..8"),
    p(
      "Tuples on both sides of = assign several variables at once. The whole right side is evaluated FIRST, using the old values, and only then are the results stored. That's why one line can swap or rotate variables without a temporary.",
      "Las tuplas a ambos lados del = asignan varias variables a la vez. Todo el lado derecho se evalúa PRIMERO, con los valores viejos, y solo después se guardan los resultados. Por eso una línea puede intercambiar o rotar variables sin una temporal.",
      "= の両側にタプルを書くと、複数の変数に一度に代入できる。右側全体が先に古い値で計算され、そのあとで結果がしまわれる。だから一時変数なしで、1行で入れかえや回転ができる。",
    ),
    ex("int p = 1, q = 2, r = 3;\n(p, q, r) = (q, r, p);\nConsole.WriteLine($\"{p} {q} {r}\");", "2 3 1",
      L("The right side is read before anything is stored", "El lado derecho se lee antes de guardar nada", "しまう前に右側が全部読まれる")),
    p(
      "Common mistake: reading a tuple assignment as several lines, one after another. If it were done in steps, the first variable would change before the second one read it. With tuples, every value on the right is taken as it was before the line.",
      "Error común: leer una asignación de tupla como varias líneas, una tras otra. Si se hiciera por pasos, la primera variable cambiaría antes de que la segunda la leyera. Con tuplas, cada valor de la derecha se toma como era antes de la línea.",
      "よくあるミス：タプルの代入を、何行かを順に実行するように読むこと。順番にやると、2つめが読む前に1つめが変わってしまう。タプルなら、右側の値はどれもその行の前の値が使われる。",
    ),
  ),
  note("switch-patterns", L("switch expressions and patterns", "Expresiones switch y patrones", "switch 式とパターン"),
    p(
      "A switch expression picks a result by testing patterns: value switch { pattern => result, ... }. Patterns can be constants (0), comparisons (< 0, >= 50) or types (int, string). The arms are tried from top to bottom, and the FIRST one that matches wins; the rest are skipped.",
      "Una expresión switch elige un resultado probando patrones: valor switch { patrón => resultado, ... }. Los patrones pueden ser constantes (0), comparaciones (< 0, >= 50) o tipos (int, string). Los brazos se prueban de arriba abajo y gana el PRIMERO que coincide; el resto se salta.",
      "switch 式はパターンを試して結果を選ぶ：値 switch { パターン => 結果, ... }。パターンには定数（0）、比較（< 0、>= 50）、型（int、string）が使える。上から順に試し、最初に合ったものが勝ち。残りは飛ばされる。",
    ),
    ex("Console.WriteLine(Size(3) + \" \" + Size(30) + \" \" + Size(300));\n\nstatic string Size(int g) => g switch\n{\n    >= 100 => \"large\",\n    >= 10 => \"medium\",\n    _ => \"small\",\n};", "small medium large",
      L("Each value stops at the first arm that fits", "Cada valor se detiene en el primer brazo que encaja", "値は最初に合う枝で止まる")),
    p(
      "_ is the discard pattern: it matches anything, so it belongs last as the catch-all. Without it, a value that matches no arm makes the switch throw SwitchExpressionException at runtime (the compiler only warns that it isn't exhaustive).",
      "_ es el patrón descarte: coincide con todo, así que va al final como comodín. Sin él, un valor que no coincide con ningún brazo hace que el switch lance SwitchExpressionException al ejecutar (el compilador solo avisa que no es exhaustivo).",
      "_ は破棄パターンで、何にでも合うので最後に「その他」として置く。これがないと、どの枝にも合わない値で switch が実行時に SwitchExpressionException を投げる（コンパイラは網羅していないと警告するだけ）。",
    ),
    { t: "code", code: "Console.WriteLine(Mood(5));\n\nstatic string Mood(int n) => n switch\n{\n    0 => \"calm\",\n    1 => \"busy\",\n};", check: { compiles: true, throws: "SwitchExpressionException" },
      caption: L("No arm matches 5 and there is no _: it crashes", "Ningún brazo coincide con 5 y no hay _: falla", "5 に合う枝も _ もない：クラッシュ") },
    p(
      "Type patterns also work with is: obj is int n checks that obj holds an int AND, if so, creates an int variable n with that value, ready to use in the same condition (after &&) or in the if body. In a switch, int => matches by type alone.",
      "Los patrones de tipo también funcionan con is: obj is int n comprueba que obj guarda un int Y, si es así, crea una variable int n con ese valor, lista para usar en la misma condición (tras &&) o en el cuerpo del if. En un switch, int => coincide solo por tipo.",
      "型パターンは is でも使える。obj is int n は obj が int を持っているか調べ、そうなら値の入った int 変数 n を作る。同じ条件の && のあとや if の中ですぐ使える。switch の中なら int => で型だけで合わせられる。",
    ),
    ex("object box = \"pearl\";\nif (box is string s && s.Length > 3) Console.WriteLine(s.ToUpper());\nelse Console.WriteLine(\"skip\");", "PEARL"),
  ),
];

const recordsAndPatterns: LessonDef = {
  slug: "records-and-patterns",
  title: L("Twins and the sorting hat", "Gemelos y el sombrero", "ふたごと組分け帽子"),
  concept: "records",
  mode: "lesson",
  xp: 80,
  enemy: "csharp/boxing-mimic",
  enemyName: L("TWIN MIMIC", "MIMIC GEMELO", "ふたごミミック"),
  beats: [
    say(L(
      "A RECORD is a class made for data: same values mean equal records, and it prints itself nicely.",
      "Un RECORD es una clase hecha para datos: mismos valores significan records iguales, y se imprime solo.",
      "record はデータ用のクラス。値が同じなら等しい。表示もきれいにしてくれるよ。",
    )),
    {
      kind: "act",
      prompt: L("Build two twin records", "Construye dos records gemelos", "ふたごの record を作ろう"),
      steps: [
        { label: L("RECORD", "RECORD", "record"), line: "record Item(string Name, int Qty);", effects: [{ t: "banner", text: L("RECORD", "RECORD", "record") }] },
        { label: L("BUILD a", "CREAR a", "a を作る"), line: `var a = new Item("gem", 3);`, effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "a", value: "gem 3" }] },
        { label: L("BUILD b", "CREAR b", "b を作る"), line: `var b = new Item("gem", 3);`, effects: [{ t: "enter", actor: "ally" }, { t: "item", kind: "gem", holder: "ally" }, { t: "tag", actor: "ally", text: "b", value: "gem 3" }] },
        { label: L("a == b ?", "a == b ?", "a == b ？"), line: "Console.WriteLine(a == b);", effects: [{ t: "print", text: "True" }, { t: "banner", text: L("TWINS", "GEMELOS", "ふたご") }], output: "True" },
        { label: L("PRINT a", "IMPRIMIR a", "a を表示"), line: "Console.WriteLine(a);", effects: [{ t: "print", text: "Item { Name = gem, Qty = 3 }" }], output: "Item { Name = gem, Qty = 3 }" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: `var a = new Item("gem", 3);\nvar b = new Item("gem", 3);\nConsole.WriteLine((a == b) + " " + ReferenceEquals(a, b));\n\nrecord Item(string Name, int Qty);`,
      options: ["True False", "False False", "True True"],
      answer: 0,
      output: "True False",
      check: { compiles: true, stdout: "True False" },
      hint: L("For a record, == compares the values inside. ReferenceEquals asks if it's the same object.", "En un record, == compara los valores de adentro. ReferenceEquals pregunta si es el mismo objeto.", "record の == は中の値を比べる。ReferenceEquals は同じ物かどうかを聞く。"),
      note: "record-equality",
      explain: L("Two objects (ReferenceEquals is False), but a record's == compares values: True.", "Dos objetos (ReferenceEquals es False), pero el == de un record compara valores: True.", "物はふたつ（ReferenceEquals は False）。でも record の == は値を比べるので True。"),
    },
    say(L(
      "Record properties are init-only. To \"change\" one, with makes a COPY with some values swapped.",
      "Las propiedades de un record son init. Para \"cambiar\" una, with crea una COPIA con algunos valores cambiados.",
      "record のプロパティは init 専用。「変える」ときは with で一部だけちがうコピーを作るよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: `var a = new Item("gem", 3);\nvar b = a with { Qty = 5 };\nConsole.WriteLine(a.Qty + " " + b.Qty);\n\nrecord Item(string Name, int Qty);`,
      options: ["3 5", "5 5", "3 3"],
      answer: 0,
      output: "3 5",
      check: { compiles: true, stdout: "3 5" },
      hint: L("with builds a new record. Does building it change the record it copied from?", "with construye un record nuevo. ¿Construirlo cambia el record del que copió?", "with は新しい record を作る。作ることで、コピー元の record は変わる？"),
      note: "with-copies",
      explain: L("with builds a new record. The original a keeps Qty = 3.", "with crea un record nuevo. El original a conserva Qty = 3.", "with は新しい record を作る。元の a は Qty = 3 のまま。"),
      setup: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "a", value: "Qty=3" }],
      win: [{ t: "enter", actor: "ally" }, { t: "clone", to: "ally" }, { t: "tag", actor: "ally", text: "b", value: "Qty=5" }, { t: "print", text: "3 5" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: `var it = new Item("a", 1);\nit.Qty = 2;\n\nrecord Item(string Name, int Qty);`,
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
      hint: L("Positional record properties are init-only. When can an init property be assigned?", "Las propiedades posicionales de un record son init. ¿Cuándo puede asignarse una propiedad init?", "位置 record のプロパティは init 専用。init はいつ代入できる？"),
      note: "with-copies",
      explain: L("Error CS8852: positional record properties are init-only. Use with instead.", "Error CS8852: las propiedades posicionales del record son init. Usa with.", "エラー CS8852：record の位置プロパティは init 専用。with を使おう。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: `var (name, qty) = new Item("key", 1);\nConsole.WriteLine(name + qty);\n\nrecord Item(string Name, int Qty);`,
      options: ["key1", "Item { Name = key, Qty = 1 }", "key 1"],
      answer: 0,
      output: "key1",
      check: { compiles: true, stdout: "key1" },
      hint: L("Unpacking a record fills the variables in parameter order. Then look at how they're joined.", "Desarmar un record llena las variables en el orden de los parámetros. Luego mira cómo se unen.", "record を分解すると、引数の順に変数に入る。そのあとどうつなげているか見よう。"),
      note: "with-copies",
      explain: L("A positional record can be unpacked into separate labels, in order.", "Un record posicional se puede desarmar en etiquetas separadas, en orden.", "位置 record は順番どおりに別々のラベルへ分解できる。"),
    },
    say(L(
      "Careful: with copies the arrows inside, not the objects. A shared array stays shared.",
      "Ojo: with copia las flechas de adentro, no los objetos. Un array compartido sigue compartido.",
      "注意：with がコピーするのは中の矢印だけ。共有の配列は共有のままだよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: `var c = new Bag("x", new[] { "a" });\nvar d = c with { };\nd.Items[0] = "b";\nConsole.WriteLine(c.Items[0] + " " + (c == d));\n\nrecord Bag(string Name, string[] Items);`,
      options: ["b True", "a False", "a True"],
      answer: 0,
      output: "b True",
      check: { compiles: true, stdout: "b True" },
      hint: L("with copies the array's arrow, not the array. How many arrays exist after the copy?", "with copia la flecha del array, no el array. ¿Cuántos arrays existen tras la copia?", "with がコピーするのは配列の矢印で、配列そのものではない。コピー後、配列はいくつ？"),
      note: "with-copies",
      explain: L("c and d share ONE array, so d's change shows in c, and == sees the same array: True.", "c y d comparten UN array, así que el cambio de d se ve en c, y == ve el mismo array: True.", "c と d は同じ配列を共有。d の変更は c にも見え、== も True。"),
    },
    say(L(
      "Tuples group values without writing a type: (a, b) = (b, a) swaps two labels in one line.",
      "Las tuplas agrupan valores sin escribir un tipo: (a, b) = (b, a) intercambia dos etiquetas en una línea.",
      "タプルは型を書かずに値をまとめる。(a, b) = (b, a) で1行で入れかえられるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "int a = 1, b = 2;\n(a, b) = (b, a);\nConsole.WriteLine($\"{a} {b}\");",
      options: ["2 1", "1 2", "2 2"],
      answer: 0,
      output: "2 1",
      check: { compiles: true, stdout: "2 1" },
      hint: L("The whole right side is read first, with the old values, and only then stored.", "Todo el lado derecho se lee primero, con los valores viejos, y solo después se guarda.", "右側全体が先に古い値で読まれ、そのあとでしまわれる。"),
      note: "tuples",
      explain: L("The right side is read first as (2, 1), then assigned to a and b.", "Primero se lee el lado derecho como (2, 1) y luego se asigna a a y b.", "右側が先に (2, 1) として読まれ、それから a と b に入る。"),
    },
    say(L(
      "A switch expression is a sorting hat: the FIRST matching pattern wins, and _ catches everything else.",
      "Una expresión switch es un sombrero seleccionador: gana el PRIMER patrón que coincide, y _ atrapa el resto.",
      "switch 式は組分け帽子。最初に合ったパターンが勝ち、_ は残り全部を受けとめる。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: "Console.WriteLine(Grade(-5) + \" \" + Grade(0) + \" \" + Grade(7) + \" \" + Grade(150));\n\nstatic string Grade(int n) => n switch\n{\n    < 0 => \"neg\",\n    0 => \"zero\",\n    > 100 => \"huge\",\n    _ => \"pos\",\n};",
      options: ["neg zero pos huge", "neg zero pos pos", "neg pos pos huge"],
      answer: 0,
      output: "neg zero pos huge",
      check: { compiles: true, stdout: "neg zero pos huge" },
      hint: L("Test each value against the arms from top to bottom. The first arm that fits wins.", "Prueba cada valor contra los brazos de arriba abajo. Gana el primer brazo que encaja.", "値ごとに枝を上から順に試そう。最初に合った枝が勝ち。"),
      note: "switch-patterns",
      explain: L("Each value goes to the first door that fits: 7 fits none of the first three, so _ takes it.", "Cada valor va a la primera puerta que encaja: 7 no encaja en las tres primeras, así que lo toma _.", "値は最初に合う扉へ。7 は上の3つに合わないので _ が受けとる。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: "object o = 42;\nif (o is int n && n > 40) Console.WriteLine(\"big \" + n);\nelse Console.WriteLine(\"no\");",
      options: ["big 42", "no", L("Compile error", "Error de compilación", "コンパイルエラー")],
      answer: 0,
      output: "big 42",
      check: { compiles: true, stdout: "big 42" },
      hint: L("is int n checks the type and also creates n. Does the box hold an int, and is it big enough?", "is int n revisa el tipo y además crea n. ¿La caja guarda un int y es lo bastante grande?", "is int n は型を調べて n も作る。箱の中は int？それは十分大きい？"),
      note: "switch-patterns",
      explain: L("o is int n checks the type AND gives you an int label n to use right away.", "o is int n revisa el tipo Y te da una etiqueta int n para usar enseguida.", "o is int n は型を調べ、そのまま使える int のラベル n もくれる。"),
    },
    {
      kind: "type",
      prompt: L("Catch every other type", "Atrapa cualquier otro tipo", "残りの型を全部受けとめよう"),
      code: "Console.WriteLine(Kind(3.5));\n\nstatic string Kind(object o) => o switch\n{\n    int => \"int\",\n    string => \"text\",\n    ___ => \"other\",\n};",
      answer: "_",
      check: { compiles: true, stdout: "other" },
      hint: L("You need the catch-all pattern that matches anything the arms above missed.", "Necesitas el patrón comodín que coincide con todo lo que los brazos de arriba no atraparon.", "上の枝が取りこぼしたものに何でも合う「その他」のパターンが必要。"),
      note: "switch-patterns",
      explain: L("The discard _ matches anything left over, like the 3.5 double here.", "El descarte _ coincide con todo lo que sobra, como el double 3.5 aquí.", "破棄パターン _ は残り全部に合う。ここでは double の 3.5。"),
    },
    {
      kind: "run",
      prompt: L("Make the twins equal: equal: True", "Haz iguales a los gemelos: equal: True", "ふたごを等しく：equal: True"),
      starter: `using System;

var a = new Loot("gem", 5);
var b = new Loot("gem", 5);
Console.WriteLine($"equal: {a == b}");

class Loot
{
    public string Name;
    public int Gold;
    public Loot(string n, int g) { Name = n; Gold = g; }
}
`,
      solution: `using System;

var a = new Loot("gem", 5);
var b = new Loot("gem", 5);
Console.WriteLine($"equal: {a == b}");

record Loot(string Name, int Gold);
`,
      expect: "equal: True",
      fallback: [
        String.raw`record\s+(class\s+|struct\s+)?Loot`,
        String.raw`a\.Name\s*==\s*b\.Name\s*&&\s*a\.Gold\s*==\s*b\.Gold`,
      ],
      hint: L("A class compares references with ==. Which kind of type compares its values instead?", "Una clase compara referencias con ==. ¿Qué clase de tipo compara sus valores en cambio?", "class の == は参照を比べる。代わりに値で比べる型は？"),
      note: "record-equality",
      explain: L("A class compares references, so two new Loots are never ==. A record compares values.", "Una clase compara referencias, así que dos Loot nuevos nunca son ==. Un record compara valores.", "class は参照比較なので new した2つは == にならない。record は値で比べる。"),
    },
  ],
  notes: recordsNotes,
};

// ─── 2.5 Boss: the Class Treant ────────────────────────────────────────────
// The boss recaps the whole region: one short note per idea it tests.
const bossNotes: NoteDef[] = [
  note("recap-classes", L("Recap: static and init", "Repaso: static e init", "復習：static と init"),
    p(
      "Normal fields belong to each object; a static field belongs to the class, so there is one shared copy that every object updates. Keep one tally per object and one shared tally per static field.",
      "Los campos normales pertenecen a cada objeto; un campo static pertenece a la clase, así que hay una sola copia compartida que todos los objetos actualizan. Lleva una cuenta por objeto y una cuenta compartida por cada campo static.",
      "ふつうのフィールドはオブジェクトごと。static フィールドはクラスのものなので、全オブジェクトが更新する共有の1つだけ。オブジェクトごとの数と、static ごとの共有の数を記録しよう。",
    ),
    ex("var m = new Mill(); m.Grind();\nvar n = new Mill(); n.Grind();\nConsole.WriteLine(m.Bags + \" \" + Mill.Flour);\n\nclass Mill\n{\n    public int Bags;\n    public static int Flour;\n    public void Grind() { Bags++; Flour += 10; }\n}", "1 20"),
    p(
      "{ get; init; } can be set only inside the { } initializer right after new; later assignments are error CS8852. { get; } alone can be set only in the constructor (CS0200 elsewhere).",
      "{ get; init; } solo se asigna dentro del inicializador { } justo después de new; asignarla después es el error CS8852. { get; } solo, únicamente en el constructor (CS0200 en otro lugar).",
      "{ get; init; } は new の直後の { } 初期化子の中でだけ設定でき、あとで代入すると CS8852。{ get; } だけならコンストラクタの中だけ（ほかでは CS0200）。",
    ),
  ),
  note("recap-inheritance", L("Recap: hiding, constructors, casts", "Repaso: ocultar, constructores, casts", "復習：隠す・コンストラクタ・キャスト"),
    p(
      "virtual + override: the real object picks the method. new instead of override only hides it, so the label's type picks. Constructors always run from the oldest ancestor down to the class after new.",
      "virtual + override: el objeto real elige el método. new en vez de override solo lo oculta, así que elige el tipo de la etiqueta. Los constructores siempre corren desde el ancestro más antiguo hasta la clase escrita tras new.",
      "virtual + override なら本当の中身がメソッドを選ぶ。override の代わりに new だと隠すだけで、ラベルの型が選ぶ。コンストラクタはいつも一番上の祖先から new のあとのクラスへ順に動く。",
    ),
    ex("Lamp l = new Neon();\nNeon n = new Neon();\nConsole.WriteLine(l.Color() + \" \" + n.Color());\n\nclass Lamp { public string Color() => \"white\"; }\nclass Neon : Lamp { public new string Color() => \"pink\"; }", "white pink"),
    p(
      "A cast from a parent label to a child type compiles, but if the real object is a different child, it throws InvalidCastException at runtime. as gives null instead, and is just answers True or False.",
      "Un cast de una etiqueta padre a un tipo hijo compila, pero si el objeto real es otro hijo, lanza InvalidCastException al ejecutar. as da null en su lugar, e is solo responde True o False.",
      "親のラベルから子の型へのキャストはコンパイルできるが、本当の中身が別の子なら実行時に InvalidCastException を投げる。as なら null を返し、is は True か False で答えるだけ。",
    ),
  ),
  note("recap-interfaces", L("Recap: interface defaults", "Repaso: métodos por defecto", "復習：デフォルト実装"),
    p(
      "A class that signs an interface must write every member without a body. A member with a default body may be skipped: then the default runs. If the class writes its own version, that version wins.",
      "Una clase que firma una interfaz debe escribir cada miembro sin cuerpo. Un miembro con cuerpo por defecto puede omitirse: entonces corre el de por defecto. Si la clase escribe su propia versión, gana esa versión.",
      "インターフェースに署名したクラスは、中身のないメンバーを全部書くこと。デフォルトの中身があるメンバーは省略でき、そのときはデフォルトが動く。クラスが自分の版を書けば、そちらが勝つ。",
    ),
    ex("IBell[] bells = { new Gong(), new Chime() };\nConsole.WriteLine(bells[0].Ring() + \" \" + bells[1].Ring());\n\ninterface IBell { string Ring() => \"ding\"; }\nclass Gong : IBell { }\nclass Chime : IBell { public string Ring() => \"tinkle\"; }", "ding tinkle"),
  ),
  note("recap-records", L("Recap: records and switch", "Repaso: records y switch", "復習：record と switch"),
    p(
      "Records compare by value: == is True when every property matches, even for two separate objects (ReferenceEquals tells them apart). with builds a new record with some properties changed, and copies references shallowly: a shared array stays shared.",
      "Los records comparan por valor: == es True cuando todas las propiedades coinciden, incluso con dos objetos separados (ReferenceEquals los distingue). with crea un record nuevo con algunas propiedades cambiadas, y copia las referencias de forma superficial: un array compartido sigue compartido.",
      "record は値で比べる。プロパティが全部同じなら、別々の物でも == は True（ReferenceEquals なら区別できる）。with は一部を変えた新しい record を作り、参照は浅くコピーする。共有の配列は共有のまま。",
    ),
    ex("var a = new Gem(\"ruby\", 4);\nvar b = a with { Carats = 4 };\nConsole.WriteLine(a == b);\n\nrecord Gem(string Kind, int Carats);", "True"),
    p(
      "A switch expression tries its arms from top to bottom and the first match wins. Put _ last to catch everything else; if no arm matches, the switch throws SwitchExpressionException at runtime.",
      "Una expresión switch prueba sus brazos de arriba abajo y gana la primera coincidencia. Pon _ al final para atrapar todo lo demás; si ningún brazo coincide, el switch lanza SwitchExpressionException al ejecutar.",
      "switch 式は上から順に枝を試し、最初に合ったものが勝つ。残り全部を受けとめる _ を最後に置こう。どれにも合わないと、実行時に SwitchExpressionException を投げる。",
    ),
    ex("Console.WriteLine(Temp(-3) + Temp(12) + Temp(40));\n\nstatic string Temp(int c) => c switch\n{\n    < 0 => \"ice \",\n    < 30 => \"mild \",\n    _ => \"hot\",\n};", "ice mild hot"),
  ),
];

const classTreant: LessonDef = {
  slug: "class-treant",
  title: L("The Class Treant", "El Ent de Clases", "クラスのトレント"),
  concept: "inheritance",
  mode: "boss",
  xp: 170,
  enemy: "dragon",
  enemyName: L("CLASS TREANT", "ENT DE CLASES", "クラストレント"),
  beats: [
    enemySays(L(
      "I AM THE CLASS TREANT. My roots are blueprints, my branches bloodlines. Which voice speaks?",
      "SOY EL ENT DE CLASES. Mis raíces son planos, mis ramas linajes. ¿Qué voz habla?",
      "我はクラストレント。根は設計図、枝は血すじ。どの声が語るか分かるか？",
    )),
    { kind: "predict", time: 18, prompt: PRINT, code: "var a = new Tally(); a.Add();\nvar b = new Tally(); b.Add(); b.Add();\nConsole.WriteLine(a.N + \" \" + Tally.Total);\n\nclass Tally\n{\n    public int N;\n    public static int Total;\n    public void Add() { N++; Total++; }\n}", options: ["1 3", "1 1", "3 3"], answer: 0, output: "1 3", check: { compiles: true, stdout: "1 3" }, hint: L("N is per object; Total is static and shared by every object.", "N es por objeto; Total es static y compartido por todos los objetos.", "N はオブジェクトごと。Total は static で全員の共有。"), note: "recap-classes", explain: L("N is per object; the static Total counts all three Add calls.", "N es por objeto; el Total static cuenta las tres llamadas.", "N はオブジェクトごと。static の Total は3回全部。") },
    { kind: "predict", time: 15, prompt: COMPILES, code: "var c = new Config { Port = 80 };\nc.Port = 8080;\n\nclass Config { public int Port { get; init; } }", options: [YES, NO_CSC], answer: 1, check: { compiles: false }, hint: L("Port has init. Where is the second assignment written?", "Port tiene init. ¿Dónde está escrita la segunda asignación?", "Port には init がある。2回目の代入はどこに書いてある？"), note: "recap-classes", explain: L("CS8852: init can only be set in the initializer.", "CS8852: init solo se asigna en el inicializador.", "CS8852：init は初期化子でだけ設定できる。") },
    { kind: "predict", time: 18, prompt: PRINT, code: "Base x = new Derived();\nDerived y = new Derived();\nConsole.WriteLine(x.Hi() + y.Hi());\n\nclass Base { public string Hi() => \"B\"; }\nclass Derived : Base { public new string Hi() => \"D\"; }", options: ["BD", "DD", "BB"], answer: 0, output: "BD", check: { compiles: true, stdout: "BD" }, hint: L("new hides instead of overriding. Then each call follows its label's type.", "new oculta en vez de sobrescribir. Entonces cada llamada sigue el tipo de su etiqueta.", "new は override せず隠すだけ。それなら各呼び出しはラベルの型に従う。"), note: "recap-inheritance", explain: L("new hides: the label's type picks Hi, so x says B and y says D.", "new oculta: el tipo de la etiqueta elige Hi, así que x dice B e y dice D.", "new は隠すだけ。ラベルの型で決まり x は B、y は D。") },
    { kind: "predict", time: 18, prompt: PRINT, code: "new C();\n\nclass A { public A() { Console.Write(\"A \"); } }\nclass B : A { public B() { Console.Write(\"B \"); } }\nclass C : B { public C() { Console.Write(\"C \"); } }", options: ["A B C", "C B A", "C"], answer: 0, output: "A B C", check: { compiles: true, stdout: "A B C" }, hint: L("Which part of the object has to be ready first: the ancestors or the child?", "¿Qué parte del objeto debe estar lista primero: los ancestros o el hijo?", "オブジェクトのどの部分を先に用意する？祖先？子？"), note: "recap-inheritance", explain: L("Constructors run from the oldest ancestor down to the child.", "Los constructores corren desde el ancestro más viejo hasta el hijo.", "コンストラクタは一番上の祖先から子へ順に動く。") },
    { kind: "predict", time: 18, prompt: PRINT, code: "IShout[] all = { new Loud(), new Quiet() };\nConsole.WriteLine(all[0].Shout() + \" \" + all[1].Shout());\n\ninterface IShout { string Shout() => \"hey\"; }\nclass Loud : IShout { public string Shout() => \"HEY\"; }\nclass Quiet : IShout { }", options: ["HEY hey", "hey hey", "HEY HEY"], answer: 0, output: "HEY hey", check: { compiles: true, stdout: "HEY hey" }, hint: L("Check each class: did it write its own Shout, or does it rely on the default?", "Revisa cada clase: ¿escribió su propio Shout o usa el de por defecto?", "クラスごとに確かめよう。自分の Shout を書いた？それともデフォルト頼み？"), note: "recap-interfaces", explain: L("Loud writes its own Shout; Quiet falls back to the default.", "Loud escribe su propio Shout; Quiet usa el de por defecto.", "Loud は自分の Shout、Quiet はデフォルトを使う。") },
    { kind: "predict", time: 15, prompt: PRINT, code: "var a = new Pos(1, 2);\nvar b = a with { Y = 2 };\nConsole.WriteLine((a == b) + \" \" + ReferenceEquals(a, b));\n\nrecord Pos(int X, int Y);", options: ["True False", "False False", "True True"], answer: 0, output: "True False", check: { compiles: true, stdout: "True False" }, hint: L("with builds a new object. Records compare values with ==; ReferenceEquals compares objects.", "with construye un objeto nuevo. Los records comparan valores con ==; ReferenceEquals compara objetos.", "with は新しい物を作る。record の == は値を、ReferenceEquals は物を比べる。"), note: "recap-records", explain: L("with made a new object with the same values: equal, not the same.", "with creó un objeto nuevo con los mismos valores: igual, no el mismo.", "with で同じ値の新しい物。等しいけど同じ物じゃない。") },
    { kind: "predict", time: 18, prompt: PRINT, code: "Console.WriteLine(Rank(95) + Rank(50) + Rank(10));\n\nstatic string Rank(int s) => s switch\n{\n    >= 90 => \"S\",\n    >= 50 => \"A\",\n    _ => \"C\",\n};", options: ["SAC", "SCC", "AAC"], answer: 0, output: "SAC", check: { compiles: true, stdout: "SAC" }, hint: L("Try each score against the arms from top to bottom; the first fit wins.", "Prueba cada puntaje contra los brazos de arriba abajo; gana el primero que encaja.", "点数ごとに枝を上から試そう。最初に合ったものが勝ち。"), note: "recap-records", explain: L("50 fails >= 90 but fits >= 50; 10 falls to _.", "50 no cumple >= 90 pero sí >= 50; 10 cae en _.", "50 は >= 90 に合わず >= 50 に合う。10 は _ へ。") },
    { kind: "predict", time: 18, prompt: PRINT, code: "var c = new Bag(new[] { 1 });\nvar d = c with { };\nd.Nums[0] = 9;\nConsole.WriteLine(c.Nums[0]);\n\nrecord Bag(int[] Nums);", options: ["9", "1"], answer: 0, output: "9", check: { compiles: true, stdout: "9" }, hint: L("with is a shallow copy. Is the array copied, or only the arrow to it?", "with es una copia superficial. ¿Se copia el array o solo la flecha hacia él?", "with は浅いコピー。配列ごとコピーされる？それとも矢印だけ？"), note: "recap-records", explain: L("with is shallow: c and d share the same array.", "with es superficial: c y d comparten el mismo array.", "with は浅いコピー。c と d は同じ配列を共有。") },
    { kind: "predict", time: 15, prompt: HAPPENS, code: "Animal a = new Cat();\nDog d = (Dog)a;\n\nclass Animal { }\nclass Dog : Animal { }\nclass Cat : Animal { }", options: [L("Crash: InvalidCastException", "Falla: InvalidCastException", "クラッシュ：InvalidCastException"), L("Compile error", "Error de compilación", "コンパイルエラー"), L("d is null", "d es null", "d は null")], answer: 0, check: { compiles: true, throws: "System.InvalidCastException" }, hint: L("A cast compiles here. At runtime, is the real object really a Dog?", "Aquí el cast compila. Al ejecutar, ¿el objeto real es de verdad un Dog?", "ここのキャストはコンパイルできる。実行時、本当の中身は Dog？"), note: "recap-inheritance", explain: L("The object is a Cat: casting it to Dog throws. as would give null.", "El objeto es un Cat: convertirlo a Dog lanza. as daría null.", "中身は Cat。Dog へのキャストは失敗。as なら null。") },
    {
      kind: "run",
      time: 60,
      prompt: L("Fix it: it must print rank: unknown", "Arréglalo: debe imprimir rank: unknown", "直そう：rank: unknown と表示させて"),
      starter: `using System;

Console.WriteLine("start");
Console.WriteLine($"rank: {Rank(42)}");

static string Rank(int score) => score switch
{
    >= 90 => "S",
    >= 50 => "A",
};
`,
      solution: `using System;

Console.WriteLine("start");
Console.WriteLine($"rank: {Rank(42)}");

static string Rank(int score) => score switch
{
    >= 90 => "S",
    >= 50 => "A",
    _ => "unknown",
};
`,
      expect: "rank: unknown",
      fallback: [
        String.raw`_\s*=>\s*"unknown"`,
        String.raw`<\s*50\s*=>\s*"unknown"`,
      ],
      hint: L("Which value do no arms match? Add a last arm that catches everything else.", "¿Con qué valor no coincide ningún brazo? Agrega un último brazo que atrape todo lo demás.", "どの値がどの枝にも合わない？残り全部を受けとめる最後の枝を足そう。"),
      note: "recap-records",
      explain: L("No pattern matches 42, so the switch throws SwitchExpressionException. Add _ => \"unknown\".", "Ningún patrón coincide con 42, así que el switch lanza SwitchExpressionException. Agrega _ => \"unknown\".", "42 に合うパターンがなく SwitchExpressionException。_ => \"unknown\" を足そう。"),
    },
    enemySays(L(
      "My roots... untangled. You read every blueprint. Climb on: the LINQ Peaks await.",
      "Mis raíces... desenredadas. Leíste cada plano. Sigue subiendo: te esperan los Picos LINQ.",
      "根がほどけた…すべての設計図を読み解いたな。進め、LINQ の峰が待っている。",
    )),
  ],
  notes: bossNotes,
};

export const classForest: RegionDef = {
  slug: "class-forest",
  name: L("Class Forest", "Bosque de Clases", "クラスの森"),
  subtitle: L("Classes, inheritance, records", "Clases, herencia y records", "クラス・継承・record"),
  theme: "forest",
  lessons: [classesAndProperties, inheritance, interfacesAndAbstract, recordsAndPatterns, classTreant],
};
