import type { Beat, LessonDef, RegionDef, Text } from "../../../lib/content/types.ts";
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

// ─── 2.1 Blueprints and actors ─────────────────────────────────────────────
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
      explain: L("Error CS8852: an init property can only be set in the object initializer.", "Error CS8852: una propiedad init solo se asigna en el inicializador del objeto.", "エラー CS8852：init プロパティはオブジェクト初期化子でしか設定できない。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: `var h = new Hero("Ada");\nh.Name = "Zed";\n\nclass Hero\n{\n    public string Name { get; }\n    public Hero(string n) { Name = n; }\n}`,
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
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
      explain: L("A plain class doesn't know how to show itself, so ToString() returns its type name.", "Una clase simple no sabe mostrarse, así que ToString() devuelve el nombre de su tipo.", "ふつうの class は自分の見せ方を知らないので、ToString() は型名を返す。"),
    },
    {
      kind: "type",
      prompt: L("Replace the default ToString", "Reemplaza el ToString por defecto", "標準の ToString を置きかえよう"),
      code: `Console.WriteLine(new Hero());\n\nclass Hero\n{\n    public string Name = "Ada";\n    public ___ string ToString() => "Hero " + Name;\n}`,
      answer: "override",
      check: { compiles: true, stdout: "Hero Ada" },
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
      explain: L("An auto-property accepts anything. Add a backing field and clamp in set: Math.Max(0, value).", "Una autopropiedad acepta todo. Agrega un campo y limita en set: Math.Max(0, value).", "自動プロパティは何でも受け入れる。フィールドを用意して set で Math.Max(0, value)。"),
    },
  ],
};

// ─── 2.2 Bloodlines ────────────────────────────────────────────────────────
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
      explain: L("Building a child builds the parent part first, so Parent's constructor runs first.", "Construir un hijo arma primero la parte del padre, así que el constructor de Parent corre antes.", "子を作るときは先に親の部分を作る。だから Parent のコンストラクタが先。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: `Console.WriteLine(new B().F());\n\nclass A { public string F() => "a"; }\nclass B : A { public override string F() => "b"; }`,
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
      explain: L("Error CS0506: you can only override a method marked virtual, abstract or override.", "Error CS0506: solo puedes sobrescribir un método marcado virtual, abstract u override.", "エラー CS0506：override できるのは virtual・abstract・override のメソッドだけ。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: "var m = new Minion();\n\nsealed class Boss { }\nclass Minion : Boss { }",
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
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
      explain: L("a is a Dog, not a Cat, so as Cat gives null instead of crashing.", "a es un Dog, no un Cat, así que as Cat da null en vez de fallar.", "a は Dog で Cat じゃない。as Cat はクラッシュせず null。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: "Animal a = new Dog();\nCat c = (Cat)a;\nConsole.WriteLine(\"ok\");\n\nclass Animal { }\nclass Dog : Animal { }\nclass Cat : Animal { }",
      options: [L("Crash: InvalidCastException", "Falla: InvalidCastException", "クラッシュ：InvalidCastException"), "ok", L("Compile error", "Error de compilación", "コンパイルエラー")],
      answer: 0,
      check: { compiles: true, throws: "System.InvalidCastException" },
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
      explain: L("new only hides Roar. Mark the parent virtual and the child override so the real object decides.", "new solo oculta Roar. Marca el padre virtual y el hijo override para que decida el objeto real.", "new は隠すだけ。親を virtual、子を override にすれば本当のオブジェクトが決める。"),
    },
  ],
};

// ─── 2.3 Contracts and half-built blueprints ───────────────────────────────
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
      explain: L("Square fills in the blank Area(). Describe, written in Shape, calls Square's version.", "Square llena el Area() en blanco. Describe, escrito en Shape, llama a la versión de Square.", "Square が空欄の Area() を埋める。Shape の Describe も Square の版を呼ぶ。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: "var s = new Shape();\n\nabstract class Shape { public abstract int Area(); }",
      options: [YES, NO_CSC],
      answer: 1,
      check: { compiles: false },
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
      explain: L("Slime signed IEnemy, so it must write Damage(): public int Damage() => 3;", "Slime firmó IEnemy, así que debe escribir Damage(): public int Damage() => 3;", "Slime は IEnemy に署名したので Damage() を書こう：public int Damage() => 3;"),
    },
  ],
};

// ─── 2.4 Twins, tuples and the sorting hat ─────────────────────────────────
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
      explain: L("o is int n checks the type AND gives you an int label n to use right away.", "o is int n revisa el tipo Y te da una etiqueta int n para usar enseguida.", "o is int n は型を調べ、そのまま使える int のラベル n もくれる。"),
    },
    {
      kind: "type",
      prompt: L("Catch every other type", "Atrapa cualquier otro tipo", "残りの型を全部受けとめよう"),
      code: "Console.WriteLine(Kind(3.5));\n\nstatic string Kind(object o) => o switch\n{\n    int => \"int\",\n    string => \"text\",\n    ___ => \"other\",\n};",
      answer: "_",
      check: { compiles: true, stdout: "other" },
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
      explain: L("A class compares references, so two new Loots are never ==. A record compares values.", "Una clase compara referencias, así que dos Loot nuevos nunca son ==. Un record compara valores.", "class は参照比較なので new した2つは == にならない。record は値で比べる。"),
    },
  ],
};

// ─── 2.5 Boss: the Class Treant ────────────────────────────────────────────
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
    { kind: "predict", time: 18, prompt: PRINT, code: "var a = new Tally(); a.Add();\nvar b = new Tally(); b.Add(); b.Add();\nConsole.WriteLine(a.N + \" \" + Tally.Total);\n\nclass Tally\n{\n    public int N;\n    public static int Total;\n    public void Add() { N++; Total++; }\n}", options: ["1 3", "1 1", "3 3"], answer: 0, output: "1 3", check: { compiles: true, stdout: "1 3" }, explain: L("N is per object; the static Total counts all three Add calls.", "N es por objeto; el Total static cuenta las tres llamadas.", "N はオブジェクトごと。static の Total は3回全部。") },
    { kind: "predict", time: 15, prompt: COMPILES, code: "var c = new Config { Port = 80 };\nc.Port = 8080;\n\nclass Config { public int Port { get; init; } }", options: [YES, NO_CSC], answer: 1, check: { compiles: false }, explain: L("CS8852: init can only be set in the initializer.", "CS8852: init solo se asigna en el inicializador.", "CS8852：init は初期化子でだけ設定できる。") },
    { kind: "predict", time: 18, prompt: PRINT, code: "Base x = new Derived();\nDerived y = new Derived();\nConsole.WriteLine(x.Hi() + y.Hi());\n\nclass Base { public string Hi() => \"B\"; }\nclass Derived : Base { public new string Hi() => \"D\"; }", options: ["BD", "DD", "BB"], answer: 0, output: "BD", check: { compiles: true, stdout: "BD" }, explain: L("new hides: the label's type picks Hi, so x says B and y says D.", "new oculta: el tipo de la etiqueta elige Hi, así que x dice B e y dice D.", "new は隠すだけ。ラベルの型で決まり x は B、y は D。") },
    { kind: "predict", time: 18, prompt: PRINT, code: "new C();\n\nclass A { public A() { Console.Write(\"A \"); } }\nclass B : A { public B() { Console.Write(\"B \"); } }\nclass C : B { public C() { Console.Write(\"C \"); } }", options: ["A B C", "C B A", "C"], answer: 0, output: "A B C", check: { compiles: true, stdout: "A B C" }, explain: L("Constructors run from the oldest ancestor down to the child.", "Los constructores corren desde el ancestro más viejo hasta el hijo.", "コンストラクタは一番上の祖先から子へ順に動く。") },
    { kind: "predict", time: 18, prompt: PRINT, code: "IShout[] all = { new Loud(), new Quiet() };\nConsole.WriteLine(all[0].Shout() + \" \" + all[1].Shout());\n\ninterface IShout { string Shout() => \"hey\"; }\nclass Loud : IShout { public string Shout() => \"HEY\"; }\nclass Quiet : IShout { }", options: ["HEY hey", "hey hey", "HEY HEY"], answer: 0, output: "HEY hey", check: { compiles: true, stdout: "HEY hey" }, explain: L("Loud writes its own Shout; Quiet falls back to the default.", "Loud escribe su propio Shout; Quiet usa el de por defecto.", "Loud は自分の Shout、Quiet はデフォルトを使う。") },
    { kind: "predict", time: 15, prompt: PRINT, code: "var a = new Pos(1, 2);\nvar b = a with { Y = 2 };\nConsole.WriteLine((a == b) + \" \" + ReferenceEquals(a, b));\n\nrecord Pos(int X, int Y);", options: ["True False", "False False", "True True"], answer: 0, output: "True False", check: { compiles: true, stdout: "True False" }, explain: L("with made a new object with the same values: equal, not the same.", "with creó un objeto nuevo con los mismos valores: igual, no el mismo.", "with で同じ値の新しい物。等しいけど同じ物じゃない。") },
    { kind: "predict", time: 18, prompt: PRINT, code: "Console.WriteLine(Rank(95) + Rank(50) + Rank(10));\n\nstatic string Rank(int s) => s switch\n{\n    >= 90 => \"S\",\n    >= 50 => \"A\",\n    _ => \"C\",\n};", options: ["SAC", "SCC", "AAC"], answer: 0, output: "SAC", check: { compiles: true, stdout: "SAC" }, explain: L("50 fails >= 90 but fits >= 50; 10 falls to _.", "50 no cumple >= 90 pero sí >= 50; 10 cae en _.", "50 は >= 90 に合わず >= 50 に合う。10 は _ へ。") },
    { kind: "predict", time: 18, prompt: PRINT, code: "var c = new Bag(new[] { 1 });\nvar d = c with { };\nd.Nums[0] = 9;\nConsole.WriteLine(c.Nums[0]);\n\nrecord Bag(int[] Nums);", options: ["9", "1"], answer: 0, output: "9", check: { compiles: true, stdout: "9" }, explain: L("with is shallow: c and d share the same array.", "with es superficial: c y d comparten el mismo array.", "with は浅いコピー。c と d は同じ配列を共有。") },
    { kind: "predict", time: 15, prompt: HAPPENS, code: "Animal a = new Cat();\nDog d = (Dog)a;\n\nclass Animal { }\nclass Dog : Animal { }\nclass Cat : Animal { }", options: [L("Crash: InvalidCastException", "Falla: InvalidCastException", "クラッシュ：InvalidCastException"), L("Compile error", "Error de compilación", "コンパイルエラー"), L("d is null", "d es null", "d は null")], answer: 0, check: { compiles: true, throws: "System.InvalidCastException" }, explain: L("The object is a Cat: casting it to Dog throws. as would give null.", "El objeto es un Cat: convertirlo a Dog lanza. as daría null.", "中身は Cat。Dog へのキャストは失敗。as なら null。") },
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
      explain: L("No pattern matches 42, so the switch throws SwitchExpressionException. Add _ => \"unknown\".", "Ningún patrón coincide con 42, así que el switch lanza SwitchExpressionException. Agrega _ => \"unknown\".", "42 に合うパターンがなく SwitchExpressionException。_ => \"unknown\" を足そう。"),
    },
    enemySays(L(
      "My roots... untangled. You read every blueprint. Climb on: the LINQ Peaks await.",
      "Mis raíces... desenredadas. Leíste cada plano. Sigue subiendo: te esperan los Picos LINQ.",
      "根がほどけた…すべての設計図を読み解いたな。進め、LINQ の峰が待っている。",
    )),
  ],
};

export const classForest: RegionDef = {
  slug: "class-forest",
  name: L("Class Forest", "Bosque de Clases", "クラスの森"),
  subtitle: L("Classes, inheritance, records", "Clases, herencia y records", "クラス・継承・record"),
  theme: "forest",
  lessons: [classesAndProperties, inheritance, interfacesAndAbstract, recordsAndPatterns, classTreant],
};
