import type { Beat, LessonDef, RegionDef, Text } from "../../../lib/content/types.ts";
import { L } from "../../../lib/i18n/text.ts";

// REGION 3 · INTERFACE CASTLE  (interfaces, typed nil and embedding, errors as values, generics)

const say = (text: Text): Beat => ({ kind: "dialog", speaker: "master", text });
const enemySays = (text: Text): Beat => ({ kind: "dialog", speaker: "enemy", text });

/** Go code written indented in this file: keeps `\n` inside Go strings and strips the common indent. */
function go(s: TemplateStringsArray, ...v: unknown[]): string {
  const lines = String.raw(s, ...v).replace(/^\n/, "").replace(/\n[ \t]*$/, "").split("\n");
  const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  return lines.map((l) => l.slice(ind)).join("\n");
}

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const NO_CE = L("No: compile error", "No: error de compilación", "いいえ：コンパイルエラー");
const PANICS = L("It panics", "Hace panic", "panic する");

// ─── 3.1 Shields with a crest: implicit interfaces ─────────────────────────
const implicitInterfaces: LessonDef = {
  slug: "implicit-interfaces",
  title: L("Shields with a crest", "Escudos con emblema", "紋章のたて"),
  concept: "interfaces",
  mode: "lesson",
  xp: 80,
  enemy: "go/nil-blob",
  enemyName: L("CREST THIEF", "LADRÓN DE EMBLEMAS", "紋章どろぼう"),
  beats: [
    say(L(
      "Welcome to Interface Castle! An INTERFACE is a list of methods. Any type that has those methods fits it. No paperwork.",
      "¡Bienvenido al Castillo Interface! Una INTERFACE es una lista de métodos. Todo tipo que los tenga encaja. Sin trámites.",
      "インターフェース城へようこそ！インターフェースはメソッドの一覧。そのメソッドを持つ型なら、何でも当てはまるよ。",
    )),
    {
      kind: "act",
      prompt: L("Forge the shield, then let a square carry it", "Forja el escudo y deja que un cuadrado lo lleve", "たてを作って、四角に持たせよう"),
      steps: [
        { label: L("CREST", "EMBLEMA", "紋章"), line: "type Shape interface{ Area() int }", effects: [{ t: "item", kind: "shield", holder: "hero" }, { t: "tag", actor: "hero", text: "Shape" }] },
        { label: L("A SQUARE", "UN CUADRADO", "四角"), line: "type Sq struct{ s int }", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Sq" }] },
        { label: L("LEARN Area", "APRENDER Area", "Area を習う"), line: "func (q Sq) Area() int { return q.s * q.s }", effects: [{ t: "say", actor: "ally", text: L("I know Area!", "¡Sé hacer Area!", "Area できる！") }] },
        { label: L("PICK IT UP", "LEVANTARLO", "持ち上げる"), line: "var sh Shape = Sq{3}", effects: [{ t: "give", to: "ally" }, { t: "value", actor: "ally", text: "Sq{3}" }] },
        { label: L("USE IT", "USARLO", "使う"), line: "fmt.Println(sh.Area())", effects: [{ t: "attack", from: "ally", to: "enemy" }, { t: "print", text: "9" }], output: "9" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        type Shape interface{ Area() int }
        type Sq struct{ s int }

        func (q Sq) Area() int { return q.s * q.s }

        func main() {
          var sh Shape = Sq{4}
          fmt.Println(sh.Area())
        }`,
      options: ["16", "4", "8"],
      answer: 0,
      output: "16",
      check: { compiles: true, stdout: "16" },
      explain: L("Sq has an Area method, so it fits Shape on its own. sh.Area() runs Sq's Area: 4 * 4.", "Sq tiene un método Area, así que encaja en Shape solo. sh.Area() ejecuta el Area de Sq: 4 * 4.", "Sq は Area を持つから、自然に Shape になる。sh.Area() は Sq の Area で 4 * 4。"),
      win: [{ t: "print", text: "16" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: go`
        type Speaker interface{ Speak() string }
        type Rock struct{}

        func main() {
          var s Speaker = Rock{}
          fmt.Println(s)
        }`,
      options: [L("Yes", "Sí", "はい"), NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("Rock has no Speak method: Rock does not implement Speaker (missing method Speak).", "Rock no tiene método Speak: Rock does not implement Speaker (missing method Speak).", "Rock には Speak がない。Rock does not implement Speaker (missing method Speak) だよ。"),
      setup: [{ t: "item", kind: "shield", holder: "hero" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Rock" }],
      win: [{ t: "shake" }, { t: "say", actor: "ally", text: L("Too heavy!", "¡Muy pesado!", "重すぎる！") }],
    },
    say(L(
      "Careful: a method with a POINTER receiver (*Duck) belongs to *Duck, not to Duck. Only an address can lift that shield.",
      "Cuidado: un método con receptor PUNTERO (*Duck) pertenece a *Duck, no a Duck. Solo una dirección levanta ese escudo.",
      "注意：ポインタレシーバ (*Duck) のメソッドは Duck ではなく *Duck のもの。アドレスだけがそのたてを持てる。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: go`
        type Speaker interface{ Speak() string }
        type Duck struct{}

        func (d *Duck) Speak() string { return "quack" }

        func main() {
          var s Speaker = Duck{}
          fmt.Println(s.Speak())
        }`,
      options: [L("Yes: quack", "Sí: quack", "はい：quack"), NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("Speak is on *Duck. A plain Duck{} lacks it: method Speak has pointer receiver. Use &Duck{}.", "Speak está en *Duck. Un Duck{} simple no lo tiene: method Speak has pointer receiver. Usa &Duck{}.", "Speak は *Duck のもの。Duck{} では足りない (pointer receiver)。&Duck{} を使おう。"),
      win: [{ t: "shake" }],
    },
    say(L(
      "any (same as interface{}) holds ANY value. To get it back, peek under the shield with x.(T). The ok form never crashes.",
      "any (igual que interface{}) guarda CUALQUIER valor. Para sacarlo, mira bajo el escudo con x.(T). La forma con ok nunca falla.",
      "any (= interface{}) は何でも入る。取り出すには x.(T) でたての下をのぞく。ok つきなら落ちないよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var x any = "hi"
        s, ok := x.(string)
        n, ok2 := x.(int)
        fmt.Println(s, ok, n, ok2)`,
      options: ["hi true 0 false", "hi true hi true", "hi false 0 true"],
      answer: 0,
      output: "hi true 0 false",
      check: { compiles: true, stdout: "hi true 0 false" },
      explain: L("x holds a string, so the string guess works. The int guess fails softly: zero value 0 and ok2 false.", "x guarda un string, así que acertar string funciona. Adivinar int falla suave: valor cero 0 y ok2 false.", "x の中は string。string は当たり。int ははずれて、ゼロ値 0 と ok2 false になる。"),
      win: [{ t: "print", text: "hi true 0 false" }],
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: go`
        var x any = "hi"
        n := x.(int)
        fmt.Println(n)`,
      options: ["0", PANICS, NO_CE],
      answer: 1,
      check: { compiles: true, throws: "interface conversion" },
      explain: L("Without ok, a wrong guess panics: interface conversion: interface {} is string, not int.", "Sin ok, adivinar mal hace panic: interface conversion: interface {} is string, not int.", "ok なしではずれると panic：interface conversion: interface {} is string, not int。"),
      win: [{ t: "shake" }, { t: "banner", text: L("PANIC!", "¡PANIC!", "パニック！") }],
    },
    say(L(
      "A TYPE SWITCH tries several guesses at once: switch t := v.(type). Inside each case, t already has that type.",
      "Un TYPE SWITCH prueba varias opciones a la vez: switch t := v.(type). En cada case, t ya tiene ese tipo.",
      "型スイッチは一度に何通りも試せる：switch t := v.(type)。各 case の中で t はその型になっているよ。",
    )),
    {
      kind: "type",
      prompt: L("Write the type switch keyword", "Escribe la palabra del type switch", "型スイッチのキーワードを書こう"),
      code: go`
        func describe(v any) string {
          switch t := v.(___) {
          case int:
            return fmt.Sprint("int ", t*2)
          case string:
            return "string " + t
          default:
            return "other"
          }
        }

        func main() {
          fmt.Println(describe(21), describe("go"), describe(1.5))
        }`,
      answer: "type",
      check: { compiles: true, stdout: "int 42 string go other" },
      explain: L("v.(type) is only allowed in a switch. 21 hits int (42), \"go\" hits string, 1.5 falls to default.", "v.(type) solo vale dentro de un switch. 21 cae en int (42), \"go\" en string, 1.5 en default.", "v.(type) は switch の中だけ。21 は int (42)、\"go\" は string、1.5 は default。"),
      win: [{ t: "print", text: "int 42 string go other" }],
    },
    say(L(
      "Famous interface: fmt.Stringer. Give your type a String() string method and fmt prints it your way.",
      "Interface famosa: fmt.Stringer. Dale a tu tipo un método String() string y fmt lo imprime a tu manera.",
      "有名なインターフェース fmt.Stringer。String() string を持たせると、fmt がその形で表示するよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        type Temp int

        func (t Temp) String() string {
          return fmt.Sprintf("%d°C", int(t))
        }

        func main() {
          fmt.Println(Temp(21))
        }`,
      options: ["21°C", "21", "Temp(21)"],
      answer: 0,
      output: "21°C",
      check: { compiles: true, stdout: "21°C" },
      explain: L("Temp satisfies fmt.Stringer, so Println calls its String method.", "Temp cumple fmt.Stringer, así que Println llama a su método String.", "Temp は fmt.Stringer を満たすので、Println が String を呼ぶよ。"),
      win: [{ t: "print", text: "21°C" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var a any = 1
        var b any = 1
        var c any = int64(1)
        fmt.Println(a == b, a == c)`,
      options: ["true false", "true true", "false false"],
      answer: 0,
      output: "true false",
      check: { compiles: true, stdout: "true false" },
      explain: L("Interfaces compare type AND value. a is int 1, c is int64 1: different types, so not equal.", "Las interfaces comparan tipo Y valor. a es int 1, c es int64 1: tipos distintos, no son iguales.", "インターフェースは型と値の両方を比べる。a は int、c は int64 だから等しくない。"),
      win: [{ t: "print", text: "true false" }],
    },
    {
      kind: "run",
      prompt: L("The duck can't lift the shield. Fix it to print says: quack", "El pato no levanta el escudo. Arréglalo para imprimir says: quack", "アヒルがたてを持てない。says: quack と表示させよう"),
      starter: go`
        package main

        import "fmt"

        type Speaker interface{ Speak() string }
        type Duck struct{}

        func (d *Duck) Speak() string { return "quack" }

        func main() {
          var s Speaker = Duck{}
          fmt.Println("says:", s.Speak())
        }
      `,
      solution: go`
        package main

        import "fmt"

        type Speaker interface{ Speak() string }
        type Duck struct{}

        func (d *Duck) Speak() string { return "quack" }

        func main() {
          var s Speaker = &Duck{}
          fmt.Println("says:", s.Speak())
        }
      `,
      expect: "says: quack",
      fallback: [String.raw`=\s*&Duck\{\}`, String.raw`func\s*\(\s*\w+\s+Duck\s*\)\s*Speak`, String.raw`=\s*new\(Duck\)`],
      explain: L("Speak has a pointer receiver, so only *Duck is a Speaker. Store &Duck{}, or make the receiver (d Duck).", "Speak tiene receptor puntero, así que solo *Duck es Speaker. Guarda &Duck{}, o usa el receptor (d Duck).", "Speak はポインタレシーバなので Speaker は *Duck だけ。&Duck{} を入れるか、(d Duck) にしよう。"),
    },
  ],
};

// ─── 3.2 Empty hands and borrowed skills: typed nil and embedding ──────────
const nilTraps: LessonDef = {
  slug: "nil-traps-and-embedding",
  title: L("Empty hands, borrowed skills", "Manos vacías, poder prestado", "空っぽの手と借りた技"),
  concept: "typed-nil",
  mode: "lesson",
  xp: 85,
  enemy: "go/nil-blob",
  enemyName: L("NIL BLOB", "BLOB NIL", "nil ブロブ"),
  beats: [
    say(L(
      "Secret of the castle: an interface value is a PAIR (type, value). It is nil only when BOTH halves are nil.",
      "Secreto del castillo: un valor interface es un PAR (tipo, valor). Solo es nil cuando AMBAS mitades son nil.",
      "城のひみつ：インターフェースの値は (型, 値) のペア。両方が nil のときだけ nil になるよ。",
    )),
    {
      kind: "act",
      prompt: L("Hand a nil pointer to an error shield", "Pon un puntero nil en un escudo error", "nil ポインタを error のたてに入れよう"),
      steps: [
        { label: L("NIL POINTER", "PUNTERO NIL", "nil ポインタ"), line: "var p *MyErr", effects: [{ t: "tag", actor: "hero", text: "p", value: "nil" }] },
        { label: L("INTO error", "EN error", "error に入れる"), line: "var err error = p", effects: [{ t: "enter", actor: "ally" }, { t: "item", kind: "shield", holder: "ally" }, { t: "tag", actor: "ally", text: "err", value: "(*MyErr, nil)" }] },
        { label: L("IS IT nil?", "¿ES nil?", "nil かな？"), line: "fmt.Println(err == nil)", effects: [{ t: "say", actor: "ally", text: L("I hold a type!", "¡Tengo un tipo!", "型を持ってる！") }, { t: "print", text: "false" }], output: "false" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var err error
        fmt.Println(err == nil)
        fmt.Printf("%v %T\n", err, err)`,
      options: ["true\n<nil> <nil>", "false\n<nil> error", "true\n0 error"],
      answer: 0,
      output: "true\n<nil> <nil>",
      check: { compiles: true, stdout: "true\n<nil> <nil>" },
      explain: L("A fresh interface has no type and no value: both halves are nil, so err == nil.", "Una interface nueva no tiene tipo ni valor: ambas mitades son nil, así que err == nil.", "新しいインターフェースは型も値もない。両方 nil だから err == nil。"),
      win: [{ t: "print", text: "true" }, { t: "print", text: "<nil> <nil>" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var p *int
        var x any = p
        fmt.Println(p == nil, x == nil)`,
      options: ["true false", "true true", "false false"],
      answer: 0,
      output: "true false",
      check: { compiles: true, stdout: "true false" },
      explain: L("p is a nil pointer. x holds (type *int, value nil): the type half is set, so x is not nil.", "p es un puntero nil. x guarda (tipo *int, valor nil): la mitad del tipo está puesta, así que x no es nil.", "p は nil ポインタ。x は (*int, nil) を持つ。型が入っているので x は nil じゃない。"),
      win: [{ t: "print", text: "true false" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        type MyErr struct{}

        func (e *MyErr) Error() string { return "my error" }

        func check() error {
          var p *MyErr
          return p
        }

        func main() {
          err := check()
          fmt.Println(err == nil)
          fmt.Printf("%T\n", err)
        }`,
      options: ["false\n*main.MyErr", "true\n<nil>", "true\n*main.MyErr"],
      answer: 0,
      output: "false\n*main.MyErr",
      check: { compiles: true, stdout: "false\n*main.MyErr" },
      explain: L("The classic TYPED NIL bug: returning a nil *MyErr as error fills the type half, so err != nil.", "El bug clásico del NIL CON TIPO: devolver un *MyErr nil como error llena la mitad del tipo, así que err != nil.", "有名な「型つき nil」のバグ。nil の *MyErr を error で返すと型が入り、err != nil になる。"),
      win: [{ t: "shake" }, { t: "say", actor: "enemy", text: L("Fooled you!", "¡Te engañé!", "だまされた！") }],
    },
    {
      kind: "pick",
      prompt: L("Return a TRUE nil error", "Devuelve un error nil DE VERDAD", "本当の nil を返そう"),
      code: go`
        type MyErr struct{}

        func (e *MyErr) Error() string { return "my error" }

        func check(bad bool) error {
          if bad {
            return &MyErr{}
          }
          return ___
        }

        func main() {
          fmt.Println(check(false) == nil)
        }`,
      options: ["nil", "(*MyErr)(nil)"],
      answer: 0,
      check: { compiles: true, stdout: "true" },
      explain: L("A literal nil gives an empty interface: true. (*MyErr)(nil) compiles too, but carries a type: false.", "Un nil literal da una interface vacía: true. (*MyErr)(nil) también compila, pero lleva un tipo: false.", "nil そのものなら空のインターフェースで true。(*MyErr)(nil) は型を持つので false。"),
      win: [{ t: "print", text: "true" }],
    },
    say(L(
      "Bonus: a method with a pointer receiver can run on a nil pointer, as long as it never looks inside.",
      "Extra: un método con receptor puntero puede correr sobre un puntero nil, mientras no mire adentro.",
      "おまけ：ポインタレシーバのメソッドは、中身を見なければ nil ポインタでも呼べるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        type T struct{}

        func (t *T) Hi() string { return "hi" }

        func main() {
          var t *T
          fmt.Println(t.Hi(), t == nil)
        }`,
      options: ["hi true", PANICS, "hi false"],
      answer: 0,
      output: "hi true",
      check: { compiles: true, stdout: "hi true" },
      explain: L("Hi never reads a field of t, so calling it on a nil *T is fine.", "Hi nunca lee un campo de t, así que llamarlo sobre un *T nil está bien.", "Hi は t のフィールドを読まないので、nil の *T でも呼べる。"),
      win: [{ t: "print", text: "hi true" }],
    },
    say(L(
      "EMBEDDING: put a type inside a struct with no field name. Its fields and methods are PROMOTED: the outer struct can use them.",
      "EMBEDDING: mete un tipo en un struct sin nombre de campo. Sus campos y métodos se PROMUEVEN: el struct de afuera los usa.",
      "埋め込み：フィールド名なしで型を struct に入れる。フィールドとメソッドが昇格して、外側から使えるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        type Animal struct{ Name string }

        func (a Animal) Hello() string { return "hi " + a.Name }

        type Dog struct {
          Animal
          Breed string
        }

        func main() {
          d := Dog{Animal{"Rex"}, "lab"}
          fmt.Println(d.Hello(), d.Name)
        }`,
      options: ["hi Rex Rex", "hi lab lab", NO_CE],
      answer: 0,
      output: "hi Rex Rex",
      check: { compiles: true, stdout: "hi Rex Rex" },
      explain: L("Dog borrows Hello and Name from its embedded Animal: d.Hello() means d.Animal.Hello().", "Dog toma prestados Hello y Name de su Animal embebido: d.Hello() significa d.Animal.Hello().", "Dog は埋め込んだ Animal の Hello と Name を使える。d.Hello() は d.Animal.Hello() のこと。"),
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "d" }, { t: "item", kind: "gem", holder: "ally" }],
      win: [{ t: "say", actor: "ally", text: L("hi Rex!", "¡hi Rex!", "hi Rex！") }, { t: "print", text: "hi Rex Rex" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        type Animal struct{ Name string }

        func (a Animal) Hello() string { return "hi " + a.Name }

        type Dog struct{ Animal }

        func (d Dog) Hello() string { return "woof " + d.Name }

        func main() {
          d := Dog{Animal{"Rex"}}
          fmt.Println(d.Hello())
          fmt.Println(d.Animal.Hello())
        }`,
      options: ["woof Rex\nhi Rex", "hi Rex\nhi Rex", "woof Rex\nwoof Rex"],
      answer: 0,
      output: "woof Rex\nhi Rex",
      check: { compiles: true, stdout: "woof Rex\nhi Rex" },
      explain: L("Dog's own Hello shadows the promoted one. The inner one is still reachable as d.Animal.Hello().", "El Hello propio de Dog tapa al promovido. El de adentro sigue disponible como d.Animal.Hello().", "Dog 自身の Hello が昇格したものを隠す。中のものは d.Animal.Hello() で呼べる。"),
      win: [{ t: "print", text: "woof Rex" }, { t: "print", text: "hi Rex" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: go`
        type Animal struct{ Name string }
        type Dog struct{ Animal }

        func greet(a Animal) { fmt.Println("hi", a.Name) }

        func main() {
          d := Dog{Animal{"Rex"}}
          greet(d)
        }`,
      options: [L("Yes: hi Rex", "Sí: hi Rex", "はい：hi Rex"), NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("Embedding is not inheritance: a Dog is not an Animal. Pass d.Animal instead.", "Embeber no es herencia: un Dog no es un Animal. Pasa d.Animal en su lugar.", "埋め込みは継承じゃない。Dog は Animal ではないよ。d.Animal を渡そう。"),
      win: [{ t: "shake" }, { t: "say", actor: "ally", text: L("Not an Animal!", "¡No es Animal!", "Animal じゃない！") }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        type Namer interface{ Name() string }
        type Animal struct{ name string }

        func (a Animal) Name() string { return a.name }

        type Dog struct{ Animal }

        func main() {
          var n Namer = Dog{Animal{"Rex"}}
          fmt.Println(n.Name())
        }`,
      options: ["Rex", NO_CE, '""'],
      answer: 0,
      output: "Rex",
      check: { compiles: true, stdout: "Rex" },
      explain: L("Promoted methods count for interfaces: Dog gets Name from Animal, so Dog is a Namer.", "Los métodos promovidos cuentan para interfaces: Dog recibe Name de Animal, así que Dog es un Namer.", "昇格したメソッドもインターフェースに数える。Dog は Animal の Name で Namer になる。"),
      win: [{ t: "print", text: "Rex" }],
    },
    {
      kind: "pick",
      prompt: L("Embed one interface in another", "Embebe una interface en otra", "インターフェースを埋め込もう"),
      code: go`
        type Reader interface{ Read() string }
        type Writer interface{ Write(s string) }
        type ReadWriter interface {
          ___
          Writer
        }

        type File struct{ data string }

        func (f *File) Read() string    { return f.data }
        func (f *File) Write(s string) { f.data += s }

        func main() {
          var rw ReadWriter = &File{}
          rw.Write("go")
          fmt.Println(rw.Read())
        }`,
      options: ["Reader", "extends Reader", "implements Reader"],
      answer: 0,
      check: { compiles: true, stdout: "go", wrongFail: true },
      explain: L("Just name it: ReadWriter gets every method of Reader and Writer. Go has no extends or implements.", "Solo nómbrala: ReadWriter recibe todos los métodos de Reader y Writer. Go no tiene extends ni implements.", "名前を書くだけで Reader と Writer の全メソッドが入る。Go に extends や implements はない。"),
      win: [{ t: "print", text: "go" }],
    },
    {
      kind: "run",
      prompt: L("validate says failed for a good name. Make it print valid: gopi", "validate dice failed con un nombre válido. Haz que imprima valid: gopi", "正しい名前で failed になる。valid: gopi と表示させよう"),
      starter: go`
        package main

        import "fmt"

        type ValidationError struct{ Field string }

        func (e *ValidationError) Error() string { return "bad " + e.Field }

        func validate(name string) error {
          var verr *ValidationError
          if name == "" {
            verr = &ValidationError{"name"}
          }
          return verr
        }

        func main() {
          if err := validate("gopi"); err != nil {
            fmt.Println("failed")
          } else {
            fmt.Println("valid: gopi")
          }
        }
      `,
      solution: go`
        package main

        import "fmt"

        type ValidationError struct{ Field string }

        func (e *ValidationError) Error() string { return "bad " + e.Field }

        func validate(name string) error {
          if name == "" {
            return &ValidationError{"name"}
          }
          return nil
        }

        func main() {
          if err := validate("gopi"); err != nil {
            fmt.Println("failed")
          } else {
            fmt.Println("valid: gopi")
          }
        }
      `,
      expect: "valid: gopi",
      fallback: [String.raw`return\s+nil\b`],
      explain: L("Returning verr wraps a nil pointer in a non-nil error. Return &ValidationError{...} or a literal nil.", "Devolver verr envuelve un puntero nil en un error no nil. Devuelve &ValidationError{...} o un nil literal.", "verr を返すと nil ポインタが nil でない error になる。&ValidationError{...} か nil を返そう。"),
    },
  ],
};

// ─── 3.3 Error scrolls: errors as values ───────────────────────────────────
const errorsAsValues: LessonDef = {
  slug: "errors-as-values",
  title: L("Error scrolls", "Pergaminos de error", "エラーの巻物"),
  concept: "errors",
  mode: "lesson",
  xp: 85,
  enemy: "go/nil-blob",
  enemyName: L("SCROLL EATER", "COMEPERGAMINOS", "巻物ぐらい"),
  beats: [
    say(L(
      "Go has no exceptions for normal failures. A function returns its result AND an error, last. nil error means success.",
      "Go no usa excepciones para fallos normales. Una función devuelve su resultado Y un error, al final. Error nil es éxito.",
      "Go はふつうの失敗に例外を使わない。結果と error を返し、error は最後。nil なら成功だよ。",
    )),
    {
      kind: "act",
      prompt: L("Ask an ally to read a number and check the scroll", "Pide a un aliado leer un número y revisa el pergamino", "仲間に数を読ませて、巻物を確かめよう"),
      steps: [
        { label: L("ASK", "PEDIR", "たのむ"), line: 'n, err := strconv.Atoi("12a")', effects: [{ t: "enter", actor: "ally" }, { t: "item", kind: "scroll", holder: "ally" }, { t: "give", to: "hero" }, { t: "tag", actor: "hero", text: "n", value: "0" }] },
        { label: L("CHECK", "REVISAR", "確かめる"), line: "if err != nil {", effects: [{ t: "say", actor: "hero", text: L("Scroll not empty!", "¡No está vacío!", "巻物に何か！") }] },
        { label: L("REPORT", "AVISAR", "知らせる"), line: '  fmt.Println("error:", err)', effects: [{ t: "shake" }, { t: "print", text: 'error: strconv.Atoi: parsing "12a": invalid syntax' }], output: 'error: strconv.Atoi: parsing "12a": invalid syntax' },
        { label: L("CLOSE", "CERRAR", "とじる"), line: "}" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        n, err := strconv.Atoi("12a")
        fmt.Println(n, err)`,
      options: ['0 strconv.Atoi: parsing "12a": invalid syntax', "12 <nil>", "12a <nil>"],
      answer: 0,
      output: '0 strconv.Atoi: parsing "12a": invalid syntax',
      check: { compiles: true, stdout: '0 strconv.Atoi: parsing "12a": invalid syntax' },
      explain: L("On failure, n is the zero value 0 and err explains why. Always check err before using n.", "Si falla, n es el valor cero 0 y err explica por qué. Revisa siempre err antes de usar n.", "失敗すると n はゼロ値の 0、err が理由を持つ。n を使う前に err を確かめよう。"),
      win: [{ t: "print", text: '0 strconv.Atoi: parsing "12a": invalid syntax' }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        n, _ := strconv.Atoi("x")
        fmt.Println(n)`,
      options: ["0", PANICS, "x"],
      answer: 0,
      output: "0",
      check: { compiles: true, stdout: "0" },
      explain: L("_ throws the error away. Nothing crashes: you silently get the zero value 0.", "_ tira el error. Nada falla: recibes en silencio el valor cero 0.", "_ は error を捨てる。落ちないけど、こっそりゼロ値の 0 になるよ。"),
    },
    say(L(
      "A SENTINEL error is a shared variable made with errors.New. Callers compare against it. Each errors.New is unique.",
      "Un error SENTINELA es una variable compartida hecha con errors.New. Quien llama compara con ella. Cada errors.New es único.",
      "番兵エラーは errors.New で作る共有の変数。呼び出し側はそれと比べる。errors.New は毎回別物だよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        fmt.Println(errors.New("x") == errors.New("x"))`,
      options: ["false", "true", NO_CE],
      answer: 0,
      output: "false",
      check: { compiles: true, stdout: "false" },
      explain: L("Errors compare by identity, not by text. Two errors.New calls make two different errors.", "Los errores se comparan por identidad, no por texto. Dos llamadas a errors.New crean dos errores distintos.", "error は文字ではなく正体で比べる。errors.New を2回呼べば別々の error。"),
    },
    say(L(
      "WRAP an error to add context: fmt.Errorf(\"load: %w\", err). The old scroll goes inside a bigger one. errors.Is unrolls them.",
      "ENVUELVE un error para dar contexto: fmt.Errorf(\"load: %w\", err). El pergamino entra en otro más grande. errors.Is los desenrolla.",
      "fmt.Errorf(\"load: %w\", err) で error を包んで情報を足す。巻物の中に巻物。errors.Is がほどくよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var ErrNotFound = errors.New("not found")

        func main() {
          err := fmt.Errorf("load user: %w", ErrNotFound)
          fmt.Println(err)
          fmt.Println(err == ErrNotFound, errors.Is(err, ErrNotFound))
        }`,
      options: ["load user: not found\nfalse true", "load user: not found\ntrue true", "not found\nfalse false"],
      answer: 0,
      output: "load user: not found\nfalse true",
      check: { compiles: true, stdout: "load user: not found\nfalse true" },
      explain: L("== only sees the outer scroll. errors.Is unwraps layer by layer and finds ErrNotFound inside.", "== solo ve el pergamino de afuera. errors.Is desenvuelve capa por capa y encuentra ErrNotFound adentro.", "== は外側しか見ない。errors.Is は1枚ずつほどいて中の ErrNotFound を見つける。"),
      setup: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "err" }],
      win: [{ t: "print", text: "load user: not found" }, { t: "print", text: "false true" }],
    },
    {
      kind: "pick",
      prompt: L("Which verb keeps the chain?", "¿Qué verbo conserva la cadena?", "つながりを残す書式は？"),
      code: go`
        var ErrNotFound = errors.New("not found")

        func main() {
          err := fmt.Errorf("load user: ___", ErrNotFound)
          fmt.Println(errors.Is(err, ErrNotFound))
        }`,
      options: ["%w", "%v", "%s"],
      answer: 0,
      check: { compiles: true, stdout: "true" },
      explain: L("Only %w wraps. %v and %s compile and print the same text, but the chain is lost: errors.Is says false.", "Solo %w envuelve. %v y %s compilan e imprimen igual, pero se pierde la cadena: errors.Is da false.", "包むのは %w だけ。%v や %s も同じ文字になるけど、つながりが消えて false。"),
      win: [{ t: "print", text: "true" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var ErrNotFound = errors.New("not found")

        func main() {
          inner := fmt.Errorf("repo: %w", ErrNotFound)
          err := fmt.Errorf("svc: %w", inner)
          fmt.Println(err, errors.Is(err, ErrNotFound))
        }`,
      options: ["svc: repo: not found true", "svc: repo: not found false", "svc: true"],
      answer: 0,
      output: "svc: repo: not found true",
      check: { compiles: true, stdout: "svc: repo: not found true" },
      explain: L("Each layer adds its prefix, and errors.Is digs through all of them.", "Cada capa suma su prefijo, y errors.Is cava por todas.", "層ごとに前置きが足され、errors.Is は全部をたどるよ。"),
    },
    say(L(
      "Need fields from a custom error type? errors.As finds the first error of that type in the chain and fills your variable.",
      "¿Necesitas campos de un tipo de error propio? errors.As busca el primer error de ese tipo en la cadena y llena tu variable.",
      "自作 error のフィールドが必要？errors.As はその型の error を探して変数に入れてくれる。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        type NotFound struct{ Key string }

        func (e *NotFound) Error() string { return e.Key + " not found" }

        func main() {
          err := fmt.Errorf("handler: %w", &NotFound{Key: "id"})
          var nf *NotFound
          if errors.As(err, &nf) {
            fmt.Println("missing", nf.Key)
          }
          fmt.Println(err)
        }`,
      options: ["missing id\nhandler: id not found", "handler: id not found", "missing id\nid not found"],
      answer: 0,
      output: "missing id\nhandler: id not found",
      check: { compiles: true, stdout: "missing id\nhandler: id not found" },
      explain: L("errors.As unwraps until it finds a *NotFound, stores it in nf and returns true.", "errors.As desenvuelve hasta hallar un *NotFound, lo guarda en nf y devuelve true.", "errors.As は *NotFound が見つかるまでほどき、nf に入れて true を返す。"),
      win: [{ t: "print", text: "missing id" }, { t: "print", text: "handler: id not found" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var ErrA = errors.New("a")
        var ErrB = errors.New("b")

        func main() {
          err := errors.Join(ErrA, ErrB)
          fmt.Println(errors.Is(err, ErrB))
          fmt.Println(err)
        }`,
      options: ["true\na\nb", "false\na b", "true\na: b"],
      answer: 0,
      output: "true\na\nb",
      check: { compiles: true, stdout: "true\na\nb" },
      explain: L("errors.Join bundles several errors. errors.Is checks each one; the text puts one per line.", "errors.Join junta varios errores. errors.Is revisa cada uno; el texto pone uno por línea.", "errors.Join は複数の error をまとめる。errors.Is は全部を調べ、文字は1行ずつ。"),
    },
    {
      kind: "type",
      prompt: L("Look through the wrapping", "Mira a través del envoltorio", "包みの中まで調べよう"),
      code: go`
        var ErrClosed = errors.New("closed")

        func main() {
          err := fmt.Errorf("open gate: %w", ErrClosed)
          fmt.Println(errors.___(err, ErrClosed))
        }`,
      answer: "Is",
      check: { compiles: true, stdout: "true" },
      explain: L("errors.Is(err, target) walks the chain of %w wrappers looking for target.", "errors.Is(err, target) recorre la cadena de envoltorios %w buscando target.", "errors.Is(err, target) は %w の包みをたどって target を探す。"),
      win: [{ t: "print", text: "true" }],
    },
    {
      kind: "run",
      prompt: L("The busy error is wrapped. Make it print retry later", "El error busy está envuelto. Haz que imprima retry later", "busy は包まれている。retry later と表示させよう"),
      starter: go`
        package main

        import (
          "errors"
          "fmt"
        )

        var ErrBusy = errors.New("busy")

        func call() error { return fmt.Errorf("call api: %w", ErrBusy) }

        func main() {
          err := call()
          if err == ErrBusy {
            fmt.Println("retry later")
          } else {
            fmt.Println("unknown error:", err)
          }
        }
      `,
      solution: go`
        package main

        import (
          "errors"
          "fmt"
        )

        var ErrBusy = errors.New("busy")

        func call() error { return fmt.Errorf("call api: %w", ErrBusy) }

        func main() {
          err := call()
          if errors.Is(err, ErrBusy) {
            fmt.Println("retry later")
          } else {
            fmt.Println("unknown error:", err)
          }
        }
      `,
      expect: "retry later",
      fallback: [String.raw`errors\.Is\(\s*err\s*,\s*ErrBusy\s*\)`],
      explain: L("err is \"call api: busy\", a wrapper, so == fails. errors.Is(err, ErrBusy) looks inside.", "err es \"call api: busy\", un envoltorio, así que == falla. errors.Is(err, ErrBusy) mira adentro.", "err は包まれた \"call api: busy\" なので == は失敗。errors.Is(err, ErrBusy) が中を見る。"),
    },
  ],
};

// ─── 3.4 One spell, many types: generics ───────────────────────────────────
const generics: LessonDef = {
  slug: "generics",
  title: L("One spell, many types", "Un hechizo, muchos tipos", "ひとつの呪文、たくさんの型"),
  concept: "generics",
  mode: "lesson",
  xp: 90,
  enemy: "go/race-twins",
  enemyName: L("COPY TWINS", "GEMELOS COPIA", "コピー双子"),
  beats: [
    say(L(
      "Tired of writing MaxInt and MaxFloat? GENERICS: a function with a type slot [T ...]. The constraint says which types fit.",
      "¿Cansado de escribir MaxInt y MaxFloat? GENÉRICOS: una función con un hueco de tipo [T ...]. La restricción dice qué tipos caben.",
      "MaxInt と MaxFloat を両方書くのは大変？ジェネリクスは型の空き [T ...] を持つ関数。制約で入る型を決める。",
    )),
    {
      kind: "act",
      prompt: L("Write one Max spell and cast it on two types", "Escribe un hechizo Max y lánzalo sobre dos tipos", "Max の呪文を書いて、2つの型に使おう"),
      steps: [
        { label: L("TYPE SLOT", "HUECO DE TIPO", "型の空き"), line: "func Max[T int | float64](a, b T) T {", effects: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "Max[T]" }] },
        { label: L("COMPARE", "COMPARAR", "比べる"), line: "  if a > b { return a }; return b" },
        { label: L("CLOSE", "CERRAR", "とじる"), line: "}" },
        { label: L("ON ints", "CON ints", "int で"), line: "fmt.Println(Max(3, 7))", effects: [{ t: "item", kind: "gem", holder: "ally" }, { t: "enter", actor: "ally" }, { t: "print", text: "7" }], output: "7" },
        { label: L("ON floats", "CON floats", "float で"), line: "fmt.Println(Max(2.5, 1.5))", effects: [{ t: "say", actor: "ally", text: L("Same spell!", "¡Mismo hechizo!", "同じ呪文！") }, { t: "print", text: "2.5" }], output: "2.5" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        func Max[T int | float64](a, b T) T {
          if a > b {
            return a
          }
          return b
        }

        func main() {
          fmt.Println(Max(3, 7), Max(2.5, 1.5), Max[float64](3, 2.5))
        }`,
      options: ["7 2.5 3", "7 2.5 2.5", "7 2 3"],
      answer: 0,
      output: "7 2.5 3",
      check: { compiles: true, stdout: "7 2.5 3" },
      explain: L("Go infers T from the arguments. Max[float64] picks T by hand; 3 is the bigger one and prints as 3.", "Go deduce T de los argumentos. Max[float64] elige T a mano; 3 es el mayor y se imprime como 3.", "Go は引数から T を推論する。Max[float64] は手で指定。大きいのは 3 で、3 と表示。"),
      win: [{ t: "print", text: "7 2.5 3" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: go`
        func Sum[T int | float64](xs []T) T {
          var s T
          for _, x := range xs {
            s += x
          }
          return s
        }

        func main() {
          fmt.Println(Sum([]string{"a"}))
        }`,
      options: [L("Yes: a", "Sí: a", "はい：a"), NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("The constraint is the gate: string does not satisfy int | float64.", "La restricción es la puerta: string does not satisfy int | float64.", "制約は門番。string does not satisfy int | float64 になるよ。"),
      win: [{ t: "shake" }, { t: "say", actor: "hero", text: L("Numbers only!", "¡Solo números!", "数だけ！") }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: go`
        func Add[T any](a, b T) T {
          return a + b
        }

        func main() {
          fmt.Println(Add(1, 2))
        }`,
      options: [L("Yes: 3", "Sí: 3", "はい：3"), NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("any allows types without +, so + is forbidden inside: operator + not defined on a.", "any admite tipos sin +, así que + está prohibido adentro: operator + not defined on a.", "any には + のない型もあるので、中で + は使えない (operator + not defined)。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "pick",
      prompt: L("Which constraint allows ==?", "¿Qué restricción permite ==?", "== を使える制約は？"),
      code: go`
        func Index[T ___](xs []T, v T) int {
          for i, x := range xs {
            if x == v {
              return i
            }
          }
          return -1
        }

        func main() {
          fmt.Println(Index([]string{"a", "b"}, "b"))
        }`,
      options: ["comparable", "any"],
      answer: 0,
      check: { compiles: true, stdout: "1", wrongFail: true },
      explain: L("comparable means \"supports == and !=\". With any, x == v is an error: incomparable types in type set.", "comparable significa \"admite == y !=\". Con any, x == v es error: incomparable types in type set.", "comparable は「== と != が使える」。any だと x == v はエラーになる。"),
      win: [{ t: "print", text: "1" }],
    },
    say(L(
      "~float64 means \"any type whose underlying type is float64\", so your own type Celsius float64 fits too.",
      "~float64 significa \"cualquier tipo cuyo tipo base es float64\", así que tu propio type Celsius float64 también cabe.",
      "~float64 は「元の型が float64 の型なら何でも」。自作の type Celsius float64 も入るよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        type Celsius float64

        func Double[T ~float64](x T) T { return x * 2 }

        func main() {
          fmt.Println(Double(Celsius(1.5)))
        }`,
      options: ["3", NO_CE, "1.5"],
      answer: 0,
      output: "3",
      check: { compiles: true, stdout: "3" },
      explain: L("Celsius's underlying type is float64, so ~float64 accepts it. Without the ~ it would not compile.", "El tipo base de Celsius es float64, así que ~float64 lo acepta. Sin el ~ no compilaría.", "Celsius の元は float64 だから ~float64 に入る。~ がないとコンパイルできない。"),
      win: [{ t: "print", text: "3" }],
    },
    say(L(
      "Types can be generic too: Stack[T] holds items of one type. Inside, var z T is the zero value of whatever T is.",
      "Los tipos también pueden ser genéricos: Stack[T] guarda elementos de un tipo. Adentro, var z T es el valor cero de T.",
      "型もジェネリクスにできる。Stack[T] は1つの型の要素を持つ。var z T はその T のゼロ値。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        type Stack[T any] struct{ items []T }

        func (s *Stack[T]) Push(v T) { s.items = append(s.items, v) }

        func (s *Stack[T]) Pop() T {
          v := s.items[len(s.items)-1]
          s.items = s.items[:len(s.items)-1]
          return v
        }

        func main() {
          var s Stack[string]
          s.Push("a")
          s.Push("b")
          fmt.Println(s.Pop(), len(s.items))
        }`,
      options: ["b 1", "a 1", "b 2"],
      answer: 0,
      output: "b 1",
      check: { compiles: true, stdout: "b 1" },
      explain: L("A stack pops the LAST item pushed: b. One item, a, is left.", "Una pila saca el ÚLTIMO elemento metido: b. Queda uno, a.", "スタックは最後に入れたものから出す。b が出て、a が1つ残る。"),
      win: [{ t: "print", text: "b 1" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        func Zero[T any]() T {
          var z T
          return z
        }

        func main() {
          fmt.Println(Zero[int](), Zero[string]() == "", Zero[*int]() == nil)
        }`,
      options: ["0 true true", "<nil> true true", "0 false true"],
      answer: 0,
      output: "0 true true",
      check: { compiles: true, stdout: "0 true true" },
      explain: L("var z T gives each type its zero value: 0 for int, \"\" for string, nil for a pointer.", "var z T da a cada tipo su valor cero: 0 para int, \"\" para string, nil para un puntero.", "var z T は型ごとのゼロ値。int は 0、string は \"\"、ポインタは nil。"),
    },
    {
      kind: "type",
      prompt: L("Let the box hold any type", "Deja que la caja guarde cualquier tipo", "どんな型でも入る箱に"),
      code: go`
        type Box[T ___] struct{ v T }

        func main() {
          b := Box[bool]{true}
          fmt.Println(b.v)
        }`,
      answer: "any",
      check: { compiles: true, stdout: "true" },
      explain: L("any is the loosest constraint: every type fits, but you can only store and pass the value.", "any es la restricción más suelta: cabe todo tipo, pero solo puedes guardar y pasar el valor.", "any はいちばんゆるい制約。何でも入るけど、できるのは保存と受け渡しだけ。"),
      win: [{ t: "print", text: "true" }],
    },
    {
      kind: "run",
      prompt: L("Sum can't add with any. Make it print sum: 6", "Sum no puede sumar con any. Haz que imprima sum: 6", "any では足せない。sum: 6 と表示させよう"),
      starter: go`
        package main

        import "fmt"

        func Sum[T any](xs []T) T {
          var s T
          for _, x := range xs {
            s += x
          }
          return s
        }

        func main() {
          fmt.Println("sum:", Sum([]int{1, 2, 3}))
        }
      `,
      solution: go`
        package main

        import "fmt"

        type Number interface {
          ~int | ~float64
        }

        func Sum[T Number](xs []T) T {
          var s T
          for _, x := range xs {
            s += x
          }
          return s
        }

        func main() {
          fmt.Println("sum:", Sum([]int{1, 2, 3}))
        }
      `,
      expect: "sum: 6",
      fallback: [String.raw`Sum\[T\s+(?!any\b)[^\]]+\]`],
      explain: L("Use a constraint whose types all support +, like int | float64, or a Number interface with ~int | ~float64.", "Usa una restricción cuyos tipos admitan +, como int | float64, o una interface Number con ~int | ~float64.", "全部の型が + を使える制約にしよう。int | float64 や ~int | ~float64 の Number など。"),
    },
  ],
};

// ─── Boss: The Typed-Nil Knight ────────────────────────────────────────────
const boss: LessonDef = {
  slug: "castle-boss",
  title: L("The Typed-Nil Knight", "El Caballero Nil", "型つき nil の騎士"),
  concept: "boss",
  mode: "boss",
  xp: 190,
  enemy: "go/nil-blob",
  enemyName: L("TYPED-NIL KNIGHT", "CABALLERO NIL", "nil の騎士"),
  beats: [
    enemySays(L(
      "I AM THE TYPED-NIL KNIGHT. My shield looks empty, but it never is. Can you see what hides under each crest?",
      "SOY EL CABALLERO NIL. Mi escudo parece vacío, pero nunca lo está. ¿Ves lo que se esconde bajo cada emblema?",
      "我は型つき nil の騎士。この盾は空に見えて、決して空ではない。紋章の下が見えるか？",
    )),
    {
      kind: "predict", time: 15, prompt: COMPILES,
      code: go`
        type Speaker interface{ Speak() string }
        type Cat struct{}

        func (c *Cat) Speak() string { return "meow" }

        func main() {
          var s Speaker = Cat{}
          fmt.Println(s.Speak())
        }`,
      options: [L("Yes: meow", "Sí: meow", "はい：meow"), NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("Speak has a pointer receiver: only *Cat is a Speaker.", "Speak tiene receptor puntero: solo *Cat es Speaker.", "Speak はポインタレシーバ。Speaker は *Cat だけ。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: go`
        type Stringer interface{ String() string }
        type ID int

        func (i ID) String() string { return fmt.Sprintf("#%d", int(i)) }

        func main() {
          var s Stringer = ID(7)
          if id, ok := s.(ID); ok {
            fmt.Println(id+1, int(id))
          }
        }`,
      options: ["#8 7", "8 7", "#8 #7"],
      answer: 0,
      output: "#8 7",
      check: { compiles: true, stdout: "#8 7" },
      explain: L("id+1 is still an ID, so Println uses String: #8. int(id) is a plain int: 7.", "id+1 sigue siendo ID, así que Println usa String: #8. int(id) es un int simple: 7.", "id+1 は ID のままで String が使われ #8。int(id) はただの int で 7。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: go`
        type E struct{}

        func (e *E) Error() string { return "boom" }

        func find() error {
          var e *E
          return e
        }

        func main() {
          fmt.Println(find() == nil)
        }`,
      options: ["false", "true", PANICS],
      answer: 0,
      output: "false",
      check: { compiles: true, stdout: "false" },
      explain: L("Typed nil: the error holds type *E, so it is not nil.", "Nil con tipo: el error guarda el tipo *E, así que no es nil.", "型つき nil。error が *E の型を持つので nil じゃない。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: go`
        type S struct{ n int }

        func main() {
          s := S{1}
          var i any = s
          s.n = 2
          fmt.Println(i.(S).n)
        }`,
      options: ["1", "2", PANICS],
      answer: 0,
      output: "1",
      check: { compiles: true, stdout: "1" },
      explain: L("Storing a struct in an interface copies it. Changing s later doesn't touch the copy.", "Guardar un struct en una interface lo copia. Cambiar s después no toca la copia.", "struct をインターフェースに入れるとコピーされる。あとで s を変えても影響なし。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: go`
        var ErrNotFound = errors.New("not found")

        func main() {
          err := fmt.Errorf("db: %w", ErrNotFound)
          fmt.Println(err == ErrNotFound, errors.Is(err, ErrNotFound))
        }`,
      options: ["false true", "true true", "false false"],
      answer: 0,
      output: "false true",
      check: { compiles: true, stdout: "false true" },
      explain: L("== sees only the wrapper; errors.Is looks inside.", "== solo ve el envoltorio; errors.Is mira adentro.", "== は外側だけ、errors.Is は中まで見る。"),
    },
    {
      kind: "predict", time: 18, prompt: PRINT,
      code: go`
        type Op struct{ Code int }

        func (o Op) Error() string { return fmt.Sprint("code ", o.Code) }

        func main() {
          var err error = fmt.Errorf("wrap: %w", Op{404})
          var op Op
          fmt.Println(errors.As(err, &op), op.Code)
        }`,
      options: ["true 404", "false 0", "true 0"],
      answer: 0,
      output: "true 404",
      check: { compiles: true, stdout: "true 404" },
      explain: L("errors.As finds the Op inside the wrapper and copies it into op.", "errors.As encuentra el Op dentro del envoltorio y lo copia en op.", "errors.As が包みの中の Op を見つけ、op にコピーする。"),
    },
    {
      kind: "predict", time: 15, prompt: COMPILES,
      code: go`
        func Add[T any](a, b T) T {
          return a + b
        }

        func main() {
          fmt.Println(Add("a", "b"))
        }`,
      options: [L("Yes: ab", "Sí: ab", "はい：ab"), NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("Under any, + is not allowed, even if you call it with strings.", "Con any, + no está permitido, aunque lo llames con strings.", "any の下では、string で呼んでも + は使えない。"),
    },
    {
      kind: "predict", time: 18, prompt: PRINT,
      code: go`
        type Number interface{ ~int | ~float64 }

        func Sum[T Number](xs []T) T {
          var s T
          for _, x := range xs {
            s += x
          }
          return s
        }

        func main() {
          fmt.Println(Sum([]int{1, 2, 3}), Sum([]float64{0.5, 0.25}))
        }`,
      options: ["6 0.75", "6 0", "6 1"],
      answer: 0,
      output: "6 0.75",
      check: { compiles: true, stdout: "6 0.75" },
      explain: L("One generic Sum, two instantiations: int and float64.", "Un Sum genérico, dos instancias: int y float64.", "ひとつの Sum を int と float64 で使い分け。"),
    },
    {
      kind: "pick", time: 15, prompt: L("Make it a true nil", "Haz que sea un nil de verdad", "本当の nil にしよう"),
      code: go`
        type E struct{}

        func (e *E) Error() string { return "boom" }

        func find(ok bool) error {
          if !ok {
            return &E{}
          }
          return ___
        }

        func main() {
          fmt.Println(find(true) == nil)
        }`,
      options: ["nil", "(*E)(nil)"],
      answer: 0,
      check: { compiles: true, stdout: "true" },
      explain: L("Only a literal nil leaves both halves empty. (*E)(nil) still carries a type.", "Solo un nil literal deja ambas mitades vacías. (*E)(nil) aún lleva un tipo.", "両方空になるのは nil そのものだけ。(*E)(nil) は型を持つ。"),
    },
    {
      kind: "type", time: 12, prompt: L("Find the error type in the chain", "Busca el tipo de error en la cadena", "つながりから型を探そう"),
      code: go`
        type Op struct{ Code int }

        func (o Op) Error() string { return "op" }

        func main() {
          err := fmt.Errorf("x: %w", Op{7})
          var op Op
          fmt.Println(errors.___(err, &op), op.Code)
        }`,
      answer: "As",
      check: { compiles: true, stdout: "true 7" },
      explain: L("errors.As(err, &target) fills target with the first matching error.", "errors.As(err, &target) llena target con el primer error que coincida.", "errors.As(err, &target) は合う error を target に入れる。"),
    },
    enemySays(L(
      "My shield... you saw the type hiding under the nil. Go on, then: the Channel Tower awaits.",
      "Mi escudo... viste el tipo escondido bajo el nil. Sigue, entonces: te espera la Torre de Canales.",
      "我が盾…nil の下の型を見抜いたか。行け、チャネルの塔が待っている。",
    )),
  ],
};

export const interfaceCastle: RegionDef = {
  slug: "interface-castle",
  name: L("Interface Castle", "Castillo Interface", "インターフェース城"),
  subtitle: L("Interfaces · nil · errors · generics", "Interfaces · nil · errores · genéricos", "インターフェース・nil・エラー・ジェネリクス"),
  theme: "castle",
  lessons: [implicitInterfaces, nilTraps, errorsAsValues, generics, boss],
};
