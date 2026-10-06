import type { Beat, LessonDef, NoteBlock, NoteDef, RegionDef, Text } from "../../../lib/content/types.ts";
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

// Guidebook notes: long explanations players can reopen from any question (📖).
// Examples use names and values different from the questions so they never give an answer away.
const note = (id: string, title: Text, ...blocks: NoteBlock[]): NoteDef => ({ id, title, blocks });
const p = (en: string, es: string, ja: string): NoteBlock => ({ t: "p", text: L(en, es, ja) });
/** A runnable example; the validator checks `output` against the real compiler. */
const ex = (code: string, output: string, caption?: Text): NoteBlock => ({ t: "code", code, output, caption });
/** An example that must NOT compile (verified too). */
const bad = (code: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { compiles: false } });
/** An example that compiles and then crashes at runtime with this text (verified too). */
const crash = (code: string, throws: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { compiles: true, throws } });

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const NO_CE = L("No: compile error", "No: error de compilación", "いいえ：コンパイルエラー");
const PANICS = L("It panics", "Hace panic", "panic する");

// ─── 3.1 Shields with a crest: implicit interfaces ─────────────────────────
const implicitNotes: NoteDef[] = [
  note("implicit-interfaces", L("Interfaces fit on their own", "Las interfaces encajan solas", "インターフェースは自然に当てはまる"),
    p(
      "An interface is a list of method signatures: type Greeter interface{ Greet() string } says \"anything that can Greet and return a string\". A variable of an interface type can hold any concrete value whose type has those methods, and calling a method through it runs the method of the value stored inside.",
      "Una interface es una lista de firmas de métodos: type Greeter interface{ Greet() string } dice \"cualquier cosa que sepa Greet y devuelva un string\". Una variable de tipo interface puede guardar cualquier valor concreto cuyo tipo tenga esos métodos, y llamar un método a través de ella ejecuta el método del valor guardado.",
      "インターフェースはメソッドの形の一覧。type Greeter interface{ Greet() string } は「Greet ができて string を返すもの」という意味。インターフェース型の変数には、そのメソッドを持つ型の値なら何でも入り、呼び出すと中の値のメソッドが動く。",
    ),
    ex(go`
      type Greeter interface{ Greet() string }
      type Robot struct{ id int }

      func (r Robot) Greet() string { return fmt.Sprint("beep ", r.id) }

      func main() {
        var g Greeter = Robot{5}
        fmt.Println(g.Greet())
      }`, "beep 5",
      L("Robot never mentions Greeter, yet it fits", "Robot nunca menciona a Greeter, y aun así encaja", "Robot は Greeter と書いていないのに当てはまる")),
    p(
      "The rule: there is no implements keyword. If a type has every method of the interface, with the same name, parameters and results, it satisfies it automatically. The compiler checks this when you assign the value to the interface, so a missing method is a compile error, never a surprise at runtime.",
      "La regla: no existe la palabra implements. Si un tipo tiene todos los métodos de la interface, con el mismo nombre, parámetros y resultados, la cumple automáticamente. El compilador lo revisa al asignar el valor a la interface, así que un método que falta es un error de compilación, nunca una sorpresa al ejecutar.",
      "ルール：implements というキーワードはない。名前・引数・戻り値が同じメソッドを全部持っていれば、自動で当てはまる。値をインターフェースに入れるときにコンパイラが確かめるので、足りなければコンパイルエラーになる。",
    ),
    bad(go`
      type Greeter interface{ Greet() string }
      type Lamp struct{}

      func main() {
        var g Greeter = Lamp{}
        fmt.Println(g)
      }`,
      L("Does not compile: Lamp has no Greet method", "No compila: Lamp no tiene método Greet", "コンパイル不可：Lamp に Greet がない")),
    p(
      "Why implicit? A package can define a small interface right where it needs it, and types written years earlier, even in other packages, already fit. That is why Go is full of tiny interfaces like fmt.Stringer or io.Reader with just one method.",
      "¿Por qué implícito? Un paquete puede definir una interface pequeña justo donde la necesita, y tipos escritos años antes, incluso en otros paquetes, ya encajan. Por eso Go está lleno de interfaces diminutas como fmt.Stringer o io.Reader, con un solo método.",
      "なぜ自動なのか？必要な場所で小さなインターフェースを作れば、昔書いた型や別パッケージの型もそのまま当てはまるから。だから Go には fmt.Stringer や io.Reader のような1メソッドの小さなインターフェースが多い。",
    ),
    p(
      "Common mistake: a method that is almost right. Greet(name string) or Greet() int is a different signature, so it does not count. The error says the type does not implement the interface (missing method, or wrong type for method).",
      "Error común: un método casi correcto. Greet(name string) o Greet() int es otra firma, así que no cuenta. El error dice que el tipo does not implement la interface (missing method, o wrong type for method).",
      "よくあるミス：ほぼ正しいメソッド。Greet(name string) や Greet() int は形が違うので数えられない。エラーは does not implement（missing method や wrong type for method）と言う。",
    ),
  ),
  note("pointer-receivers", L("Pointer receivers and interfaces", "Receptores puntero e interfaces", "ポインタレシーバとインターフェース"),
    p(
      "A method's receiver decides who owns the method. With a value receiver, func (c Car) Honk(), both Car and *Car have Honk. With a pointer receiver, func (c *Car) Move(), only *Car has Move. This set of methods is called the type's method set, and interfaces look only at it.",
      "El receptor de un método decide a quién pertenece. Con receptor valor, func (c Car) Honk(), tanto Car como *Car tienen Honk. Con receptor puntero, func (c *Car) Move(), solo *Car tiene Move. Ese conjunto se llama el method set del tipo, y las interfaces solo miran eso.",
      "レシーバがメソッドの持ち主を決める。値レシーバ func (c Car) Honk() なら Car も *Car も Honk を持つ。ポインタレシーバ func (c *Car) Move() なら Move を持つのは *Car だけ。これをメソッドセットと呼び、インターフェースはそれだけを見る。",
    ),
    ex(go`
      type Mover interface{ Move() }
      type Car struct{ km int }

      func (c *Car) Move() { c.km += 10 }

      func main() {
        c := &Car{}
        var m Mover = c
        m.Move()
        fmt.Println(c.km)
      }`, "10",
      L("An address (*Car) fits Mover and changes the real car", "Una dirección (*Car) encaja en Mover y cambia el auto real", "アドレス (*Car) なら Mover に入り、本物の車が変わる")),
    p(
      "The rule: if any method of the interface has a pointer receiver, store an address in the interface: &Car{} or new(Car). The other fix is to give the method a value receiver, which only makes sense when it does not need to change the value.",
      "La regla: si algún método de la interface tiene receptor puntero, guarda una dirección en la interface: &Car{} o new(Car). La otra solución es darle al método un receptor valor, lo que solo tiene sentido si no necesita cambiar el valor.",
      "ルール：インターフェースのメソッドに1つでもポインタレシーバがあれば、アドレス（&Car{} や new(Car)）を入れる。もう1つの直し方は値レシーバにすること。ただし値を変える必要がないときだけ。",
    ),
    bad(go`
      type Mover interface{ Move() }
      type Car struct{ km int }

      func (c *Car) Move() { c.km += 10 }

      func main() {
        var m Mover = Car{}
        m.Move()
      }`,
      L("Does not compile: Move has a pointer receiver", "No compila: Move tiene receptor puntero", "コンパイル不可：Move はポインタレシーバ")),
    p(
      "Why? An interface stores its own copy of a plain value. A pointer method called on that hidden copy would change the copy, not your variable, and the change would silently vanish. Go refuses instead of letting that happen.",
      "¿Por qué? Una interface guarda su propia copia de un valor simple. Un método puntero llamado sobre esa copia escondida cambiaría la copia, no tu variable, y el cambio desaparecería en silencio. Go prefiere negarse antes que permitirlo.",
      "なぜ？インターフェースはふつうの値を自分のコピーとして持つ。そのコピーにポインタメソッドを呼ぶと、変わるのはコピーで元の変数ではなく、変更がこっそり消える。だから Go は最初から許さない。",
    ),
    p(
      "Common mistake: c.Move() on a plain Car variable works, because Go quietly takes &c for a direct call. That shortcut exists only for direct calls on variables; assigning a plain Car to an interface gets no such help.",
      "Error común: c.Move() sobre una variable Car simple funciona, porque Go toma &c en silencio en una llamada directa. Ese atajo solo existe para llamadas directas sobre variables; asignar un Car simple a una interface no recibe esa ayuda.",
      "よくあるミス：ふつうの Car 変数で c.Move() は動く。直接呼ぶときは Go がこっそり &c にするから。でもこの近道は直接呼び出しだけ。Car をインターフェースに入れるときは助けてくれない。",
    ),
  ),
  note("type-assertions", L("Type assertions and type switches", "Aserciones de tipo y type switch", "型アサーションと型スイッチ"),
    p(
      "any (another name for interface{}) can hold a value of any type, but then the compiler only knows \"something\". To get the concrete value back you assert its type: x.(T) means \"I claim the value inside x is a T\". The guess must be the exact type: int and int64 are different.",
      "any (otro nombre de interface{}) puede guardar un valor de cualquier tipo, pero entonces el compilador solo sabe \"algo\". Para recuperar el valor concreto afirmas su tipo: x.(T) significa \"afirmo que lo de adentro de x es un T\". Hay que acertar el tipo exacto: int e int64 son distintos.",
      "any（interface{} の別名）は何でも入るが、コンパイラには「何か」としかわからない。中の値を取り出すには型を主張する。x.(T) は「x の中身は T だ」という意味。型はぴったり同じでないとだめ。int と int64 は別物。",
    ),
    p(
      "There are two forms. v := x.(T) returns the value, and panics if the guess is wrong. v, ok := x.(T) never panics: on a wrong guess v is the zero value of T and ok is false. Use the ok form whenever you are not sure.",
      "Hay dos formas. v := x.(T) devuelve el valor y hace panic si el intento es incorrecto. v, ok := x.(T) nunca hace panic: si fallas, v es el valor cero de T y ok es false. Usa la forma con ok siempre que no estés seguro.",
      "形は2つ。v := x.(T) は値を返し、はずれると panic。v, ok := x.(T) は panic しない。はずれなら v は T のゼロ値で ok は false。自信がないときは ok つきを使おう。",
    ),
    ex(go`
      var box any = 3.5
      f, ok := box.(float64)
      s, ok2 := box.(string)
      fmt.Println(f, ok, s == "", ok2)`, "3.5 true true false",
      L("A right guess and a soft wrong guess", "Un intento acertado y uno fallido sin crash", "当たりと、落ちないはずれ")),
    crash(go`
      var box any = 2
      name := box.(string)
      fmt.Println(name)`, "interface conversion",
      L("Without ok, a wrong guess panics", "Sin ok, un intento fallido hace panic", "ok なしではずれると panic")),
    p(
      "A type switch tries several types at once: switch v := x.(type) { case int: ... case string: ... default: ... }. Inside each case, v already has that case's type, so you can do math in the int case. The .(type) form is only legal inside a switch.",
      "Un type switch prueba varios tipos a la vez: switch v := x.(type) { case int: ... case string: ... default: ... }. Dentro de cada case, v ya tiene el tipo de ese case, así que puedes hacer cuentas en el case int. La forma .(type) solo es válida dentro de un switch.",
      "型スイッチは一度に何通りも試す：switch v := x.(type) { case int: ... default: ... }。各 case の中では v がその型になっているので、int の case なら計算できる。.(type) は switch の中でしか書けない。",
    ),
    ex(go`
      func kind(x any) string {
        switch v := x.(type) {
        case bool:
          return fmt.Sprint("bool ", !v)
        default:
          return "other"
        }
      }

      func main() { fmt.Println(kind(false), kind(7)) }`, "bool true other",
      L("In the bool case, v is a real bool", "En el case bool, v es un bool de verdad", "bool の case では v は本物の bool")),
  ),
  note("stringer-and-compare", L("Stringer and comparing interfaces", "Stringer y comparar interfaces", "Stringer とインターフェースの比較"),
    p(
      "fmt.Stringer is a one-method interface: String() string. Before printing a value with Println or %v, fmt checks whether it satisfies Stringer; if it does, fmt prints whatever String returns instead of the raw value.",
      "fmt.Stringer es una interface de un método: String() string. Antes de imprimir un valor con Println o %v, fmt revisa si cumple Stringer; si lo cumple, imprime lo que devuelve String en lugar del valor crudo.",
      "fmt.Stringer は String() string だけのインターフェース。Println や %v で表示する前に、fmt は値が Stringer かを確かめ、そうなら生の値ではなく String の結果を表示する。",
    ),
    ex(go`
      type Coins int

      func (c Coins) String() string { return fmt.Sprintf("%d gold", int(c)) }

      func main() {
        fmt.Println(Coins(50))
        fmt.Println(int(Coins(50)))
      }`, "50 gold\n50",
      L("Converted to plain int, String is no longer used", "Convertido a int simple, ya no se usa String", "ただの int にすると String は使われない")),
    p(
      "Inside String, convert to the underlying type (int(c)) before formatting. Printing c itself with %v would call String again, forever. And remember: only the named type has the method, so int(c) prints as a normal number.",
      "Dentro de String, convierte al tipo base (int(c)) antes de formatear. Imprimir c con %v llamaría otra vez a String, para siempre. Y recuerda: solo el tipo con nombre tiene el método, así que int(c) se imprime como un número normal.",
      "String の中では、もとの型（int(c)）に変えてから書式にする。c をそのまま %v で表示すると String がまた呼ばれて終わらない。メソッドを持つのは名前つきの型だけなので、int(c) はふつうの数として表示される。",
    ),
    p(
      "Comparing two interface values with == checks BOTH halves: the dynamic type and the value. They are equal only if they hold the same type and equal values. An untyped constant gets its default type when stored: 7 becomes int, 2.0 becomes float64.",
      "Comparar dos valores interface con == revisa AMBAS mitades: el tipo dinámico y el valor. Son iguales solo si guardan el mismo tipo y valores iguales. Una constante sin tipo recibe su tipo por defecto al guardarse: 7 se vuelve int, 2.0 se vuelve float64.",
      "2つのインターフェースを == で比べると、中の型と値の両方を見る。同じ型で同じ値のときだけ等しい。型のない定数は入れるときに標準の型になる。7 は int、2.0 は float64。",
    ),
    ex(go`
      var x any = "7"
      var y any = 7
      var z any = 7
      fmt.Println(x == y, y == z)`, "false true",
      L("Same digits, different types: not equal", "Mismos dígitos, tipos distintos: no son iguales", "同じ数字でも型が違えば等しくない")),
    p(
      "Common mistake: expecting 7 stored as int to equal int8(7) or a \"7\" string. Different types are never equal through an interface, even when they print the same.",
      "Error común: esperar que un 7 guardado como int sea igual a int8(7) o a un string \"7\". A través de una interface, tipos distintos nunca son iguales, aunque se impriman igual.",
      "よくあるミス：int の 7 が int8(7) や文字列の \"7\" と等しいと思うこと。インターフェースごしでは、表示が同じでも型が違えば決して等しくない。",
    ),
  ),
];

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
      hint: L("sh holds a Sq. A method called through an interface runs the method of the value stored inside.", "sh guarda un Sq. Un método llamado a través de una interface ejecuta el método del valor que guarda.", "sh の中身は Sq。インターフェース経由の呼び出しは、中の値のメソッドを実行する。"),
      note: "implicit-interfaces",
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
      hint: L("List the methods Speaker asks for, then check which methods Rock actually has.", "Mira qué métodos pide Speaker y luego revisa qué métodos tiene Rock de verdad.", "Speaker が求めるメソッドと、Rock が実際に持つメソッドを比べてみよう。"),
      note: "implicit-interfaces",
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
      hint: L("Look at the receiver of Speak, then at what is stored in s: a value or an address?", "Mira el receptor de Speak y luego qué se guarda en s: ¿un valor o una dirección?", "Speak のレシーバと、s に入れているもの（値かアドレスか）を見比べよう。"),
      note: "pointer-receivers",
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
      hint: L("x holds one exact type. Is each guess that type? What does the ok form return when it isn't?", "x guarda un tipo exacto. ¿Cada intento es ese tipo? ¿Qué devuelve la forma con ok si no lo es?", "x の中の型は1つだけ。それぞれの推測は当たり？はずれたとき ok つきの形は何を返す？"),
      note: "type-assertions",
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
      hint: L("This guess is wrong, and there is no ok variable to catch the failure. What does Go do then?", "Este intento es incorrecto y no hay variable ok para atrapar el fallo. ¿Qué hace Go entonces?", "この推測ははずれ。しかも失敗を受け止める ok がない。そのとき Go はどうする？"),
      note: "type-assertions",
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
      hint: L("The parentheses need a Go keyword that asks for the dynamic type itself, not one specific type.", "Los paréntesis piden una palabra clave de Go que pregunta por el tipo dinámico en sí, no un tipo concreto.", "かっこの中には、特定の型ではなく「中の型そのもの」を聞く Go のキーワードが入る。"),
      note: "type-assertions",
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
      hint: L("Temp has a String() string method. What do fmt's print functions do with a value that has one?", "Temp tiene un método String() string. ¿Qué hacen las funciones de fmt con un valor que lo tiene?", "Temp は String() string を持っている。fmt の表示関数はそういう値をどう扱う？"),
      note: "stringer-and-compare",
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
      hint: L("Comparing interfaces checks two things. What type does a plain 1 get, and what type does c hold?", "Comparar interfaces revisa dos cosas. ¿Qué tipo recibe un 1 simple, y qué tipo guarda c?", "インターフェースの比較は2つを見る。ただの 1 は何型？c の中は何型？"),
      note: "stringer-and-compare",
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
      hint: L("Who owns Speak: Duck or *Duck? Make the value stored in s match the owner.", "¿De quién es Speak: de Duck o de *Duck? Haz que el valor guardado en s coincida con el dueño.", "Speak の持ち主は Duck？*Duck？s に入れる値を持ち主に合わせよう。"),
      note: "pointer-receivers",
    },
  ],
  notes: implicitNotes,
};

// ─── 3.2 Empty hands and borrowed skills: typed nil and embedding ──────────
const nilNotes: NoteDef[] = [
  note("typed-nil", L("An interface is a (type, value) pair", "Una interface es un par (tipo, valor)", "インターフェースは (型, 値) のペア"),
    p(
      "Inside, every interface value has two halves: the dynamic type (what kind of thing it holds) and the dynamic value (the thing itself). A fresh interface variable has neither: both halves are nil. Only then does == nil say true, and %T prints <nil>.",
      "Por dentro, todo valor interface tiene dos mitades: el tipo dinámico (qué clase de cosa guarda) y el valor dinámico (la cosa en sí). Una variable interface nueva no tiene ninguno: ambas mitades son nil. Solo entonces == nil da true, y %T imprime <nil>.",
      "インターフェースの値は中に2つの半分を持つ。動的な型（何の種類か）と動的な値（もの自体）。新しいインターフェース変数はどちらもなく、両方 nil。そのときだけ == nil が true になり、%T は <nil> を表示する。",
    ),
    ex(go`
      var s fmt.Stringer
      fmt.Println(s == nil)
      fmt.Printf("%T\n", s)`, "true\n<nil>",
      L("Never assigned: no type, no value", "Nunca asignada: sin tipo ni valor", "一度も入れていない：型も値もない")),
    p(
      "Now assign a nil pointer, a nil map or a nil slice to it. The value half is nil, but the type half is filled in: the interface remembers \"I hold a nil *Thing\". With one half set, the interface is NOT nil, even though what it holds is.",
      "Ahora asígnale un puntero nil, un map nil o un slice nil. La mitad del valor es nil, pero la del tipo queda llena: la interface recuerda \"guardo un *Cosa nil\". Con una mitad puesta, la interface NO es nil, aunque lo que guarda sí lo sea.",
      "そこに nil のポインタや map を入れてみよう。値の半分は nil でも、型の半分は埋まる。インターフェースは「nil の *Thing を持っている」と覚える。半分が埋まっていれば、中身が nil でもインターフェースは nil ではない。",
    ),
    ex(go`
      var m map[string]int
      var box any = m
      fmt.Println(m == nil, box == nil)
      fmt.Printf("%T\n", box)`, "true false\nmap[string]int",
      L("The map is nil; the interface holding it is not", "El map es nil; la interface que lo guarda no", "map は nil、それを持つインターフェースは nil じゃない")),
    p(
      "This causes Go's famous typed-nil bug: a function returns error, but inside it returns a variable of a pointer error type that happens to be nil. The caller's err != nil check is true, so a success looks like a failure. Rule: for success, return a literal nil, never a typed pointer variable.",
      "Esto causa el famoso bug del nil con tipo: una función devuelve error, pero por dentro devuelve una variable de un tipo de error puntero que resulta ser nil. El err != nil de quien llama da true, y un éxito parece un fallo. Regla: para el éxito devuelve un nil literal, nunca una variable puntero con tipo.",
      "これが有名な「型つき nil」のバグ。error を返す関数が、たまたま nil のポインタ型エラー変数を返す。呼び出し側の err != nil が true になり、成功が失敗に見える。ルール：成功なら nil そのものを返す。型つきのポインタ変数は返さない。",
    ),
    ex(go`
      type Oops struct{}

      func (o *Oops) Error() string { return "oops" }

      func run(fail bool) error {
        if fail {
          return &Oops{}
        }
        return nil
      }
      func main() { fmt.Println(run(false) == nil, run(true) == nil) }`, "true false",
      L("Return the error directly, and a literal nil for success", "Devuelve el error directo, y un nil literal para el éxito", "失敗はそのまま返し、成功は nil そのもの")),
    p(
      "Why does Go keep the type? An interface must know which method to call, and methods can run even on nil pointers, so \"a nil *Oops\" is real information. Common mistakes: var e *Oops; return e, or a conversion like (*Oops)(nil). Both carry a type.",
      "¿Por qué Go guarda el tipo? Una interface debe saber qué método llamar, y los métodos pueden correr incluso sobre punteros nil, así que \"un *Oops nil\" es información real. Errores comunes: var e *Oops; return e, o una conversión como (*Oops)(nil). Ambos llevan un tipo.",
      "なぜ型を残すのか？インターフェースはどのメソッドを呼ぶか知る必要があり、メソッドは nil ポインタでも動けるので、「nil の *Oops」も大事な情報だから。よくあるミス：var e *Oops; return e や (*Oops)(nil)。どちらも型を持つ。",
    ),
  ),
  note("nil-receiver", L("Methods on nil pointers", "Métodos sobre punteros nil", "nil ポインタのメソッド"),
    p(
      "A method with a pointer receiver is really a function whose first argument is that pointer. So you can call it on a nil pointer: the method simply starts with a receiver that is nil. Nothing breaks unless the method tries to look inside.",
      "Un método con receptor puntero es en realidad una función cuyo primer argumento es ese puntero. Por eso puedes llamarlo sobre un puntero nil: el método simplemente empieza con un receptor nil. Nada se rompe a menos que el método intente mirar adentro.",
      "ポインタレシーバのメソッドは、実はそのポインタを最初の引数に取る関数。だから nil ポインタでも呼べて、レシーバが nil の状態で始まるだけ。中を見ようとしなければ何も壊れない。",
    ),
    ex(go`
      type Node struct{ next *Node }

      func (n *Node) Count() int {
        if n == nil {
          return 0
        }
        return 1 + n.next.Count()
      }

      func main() { var none *Node; fmt.Println((&Node{&Node{}}).Count(), none.Count()) }`, "2 0",
      L("Count checks for nil first, so a nil list counts 0", "Count revisa nil primero, así que una lista nil cuenta 0", "Count は先に nil を確かめるので、nil のリストは 0")),
    p(
      "The rule: calling the method is fine; reading a field through the nil pointer is not. b.size on a nil *Box panics with \"invalid memory address or nil pointer dereference\". Many Go types use this on purpose, returning a safe default when the receiver is nil.",
      "La regla: llamar al método está bien; leer un campo a través del puntero nil no. b.size sobre un *Box nil hace panic con \"invalid memory address or nil pointer dereference\". Muchos tipos de Go lo aprovechan a propósito y devuelven un valor seguro cuando el receptor es nil.",
      "ルール：メソッドを呼ぶのは OK、nil ポインタ越しにフィールドを読むのはだめ。nil の *Box で b.size を読むと \"nil pointer dereference\" で panic。わざとこれを使い、nil なら安全な値を返す型も多い。",
    ),
    crash(go`
      type Box struct{ size int }

      func (b *Box) Size() int { return b.size }

      func main() {
        var b *Box
        fmt.Println(b.Size())
      }`, "nil pointer dereference",
      L("Size reads a field through nil: panic", "Size lee un campo a través de nil: panic", "Size が nil 越しにフィールドを読む：panic")),
    p(
      "Common mistake: assuming any method call on a nil pointer crashes immediately. It only crashes when something is read through it. A value receiver is different: calling it on a nil pointer panics at once, because Go must copy the value first.",
      "Error común: creer que cualquier llamada sobre un puntero nil falla al instante. Solo falla cuando se lee algo a través de él. Un receptor valor es distinto: llamarlo sobre un puntero nil hace panic enseguida, porque Go debe copiar el valor primero.",
      "よくあるミス：nil ポインタでメソッドを呼ぶと即落ちると思うこと。落ちるのは中を読んだときだけ。値レシーバは別で、nil ポインタで呼ぶとすぐ panic する。先に値をコピーする必要があるから。",
    ),
  ),
  note("embedding", L("Embedding: borrowed fields and methods", "Embedding: campos y métodos prestados", "埋め込み：借りたフィールドとメソッド"),
    p(
      "To embed a type, write its name inside a struct with no field name. Its fields and methods are promoted: you can use them directly on the outer struct. The embedded part is still a real field, named after its type, so the long form also works.",
      "Para embeber un tipo, escribe su nombre dentro de un struct sin nombre de campo. Sus campos y métodos se promueven: puedes usarlos directamente en el struct de afuera. La parte embebida sigue siendo un campo real, llamado como su tipo, así que la forma larga también funciona.",
      "型を埋め込むには、struct の中にフィールド名なしで型名を書く。そのフィールドとメソッドは昇格し、外側の struct から直接使える。埋め込んだ部分は型名と同じ名前の本物のフィールドなので、長い書き方もできる。",
    ),
    ex(go`
      type Engine struct{ HP int }

      func (e Engine) Start() string { return fmt.Sprint("vroom ", e.HP) }

      type Truck struct {
        Engine
        Wheels int
      }

      func main() { t := Truck{Engine{300}, 6}; fmt.Println(t.Start(), t.HP, t.Engine.HP) }`, "vroom 300 300 300",
      L("t.Start() is short for t.Engine.Start()", "t.Start() es la forma corta de t.Engine.Start()", "t.Start() は t.Engine.Start() の省略")),
    p(
      "If the outer type declares a method with the same name, its own method wins and hides the promoted one. The hidden method is still there: call it through the field, like t.Engine.Start(). Go looks at the shallowest level first.",
      "Si el tipo de afuera declara un método con el mismo nombre, gana el suyo y tapa al promovido. El método tapado sigue ahí: llámalo a través del campo, como t.Engine.Start(). Go mira primero el nivel menos profundo.",
      "外側の型が同じ名前のメソッドを持つと、そちらが勝って昇格したものを隠す。隠れたメソッドは残っているので、t.Engine.Start() のようにフィールド経由で呼べる。Go は浅い階層から先に探す。",
    ),
    p(
      "Embedding is not inheritance. A Truck is not an Engine: a function that takes an Engine will not accept a Truck; pass t.Engine instead. But promoted methods do count for interfaces: if an interface needs Start(), Truck satisfies it through its Engine.",
      "Embeber no es herencia. Un Truck no es un Engine: una función que recibe un Engine no acepta un Truck; pasa t.Engine en su lugar. Pero los métodos promovidos sí cuentan para interfaces: si una interface pide Start(), Truck la cumple gracias a su Engine.",
      "埋め込みは継承ではない。Truck は Engine ではないので、Engine を受け取る関数に Truck は渡せない。t.Engine を渡そう。ただし昇格したメソッドはインターフェースに数える。Start() が必要なら、Truck は Engine のおかげで当てはまる。",
    ),
    bad(go`
      type Engine struct{ HP int }
      type Truck struct{ Engine }

      func repair(e Engine) {}

      func main() { repair(Truck{}) }`,
      L("Does not compile: a Truck is not an Engine", "No compila: un Truck no es un Engine", "コンパイル不可：Truck は Engine ではない")),
    p(
      "Interfaces can embed interfaces too: list another interface's name inside, and you get all of its methods. Go has no extends or implements keywords anywhere; you just write the name.",
      "Las interfaces también pueden embeber interfaces: escribe dentro el nombre de otra interface y obtienes todos sus métodos. Go no tiene las palabras extends ni implements en ningún lado; solo escribes el nombre.",
      "インターフェースもインターフェースを埋め込める。中に別のインターフェース名を書けば、そのメソッドが全部入る。Go には extends も implements もない。名前を書くだけ。",
    ),
    ex(go`
      type Opener interface{ Open() string }
      type Closer interface{ Close() string }
      type Door interface{ Opener; Closer }
      type Gate struct{}

      func (Gate) Open() string  { return "open" }
      func (Gate) Close() string { return "shut" }

      func main() { var d Door = Gate{}; fmt.Println(d.Open(), d.Close()) }`, "open shut",
      L("Door has both methods by listing two interfaces", "Door tiene ambos métodos al nombrar dos interfaces", "2つのインターフェース名で Door は両方のメソッドを持つ")),
  ),
];

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
      hint: L("Nothing was ever assigned to err. What are both halves of an interface that was never filled?", "Nunca se asignó nada a err. ¿Cómo están las dos mitades de una interface que nunca se llenó?", "err には何も入れていない。一度も入れていないインターフェースの2つの半分はどうなっている？"),
      note: "typed-nil",
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
      hint: L("p itself is nil. After x = p, which half of x's (type, value) pair is filled in?", "p en sí es nil. Tras x = p, ¿qué mitad del par (tipo, valor) de x queda llena?", "p 自体は nil。x = p のあと、x の (型, 値) のどちらが埋まっている？"),
      note: "typed-nil",
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
      hint: L("check returns a variable of type *MyErr as an error. Does the error remember that type?", "check devuelve una variable de tipo *MyErr como error. ¿El error recuerda ese tipo?", "check は *MyErr 型の変数を error として返す。error はその型を覚えている？"),
      note: "typed-nil",
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
      hint: L("== nil is true only when both halves are empty. Does each option bring a type along?", "== nil solo es true si ambas mitades están vacías. ¿Cada opción trae un tipo consigo?", "== nil が true になるのは両方が空のときだけ。それぞれの選択肢は型を持ちこむ？"),
      note: "typed-nil",
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
      hint: L("t is a nil *T. Does Hi ever read anything through t?", "t es un *T nil. ¿Hi lee algo a través de t en algún momento?", "t は nil の *T。Hi は t を通して何かを読んでいる？"),
      note: "nil-receiver",
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
      hint: L("Animal is embedded in Dog with no field name. Which of its fields and methods can Dog use directly?", "Animal va embebido en Dog sin nombre de campo. ¿Qué campos y métodos suyos puede usar Dog directo?", "Animal はフィールド名なしで Dog に埋め込まれている。Dog が直接使えるのは？"),
      note: "embedding",
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
      hint: L("Dog has its own Hello now. Which one does d.Hello() find first, and how do you reach the other?", "Ahora Dog tiene su propio Hello. ¿Cuál encuentra primero d.Hello(), y cómo llegas al otro?", "Dog にも自分の Hello がある。d.Hello() が先に見つけるのは？もう片方の呼び方は？"),
      note: "embedding",
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
      hint: L("greet wants exactly an Animal. Does embedding make a Dog count as an Animal?", "greet quiere exactamente un Animal. ¿Embeber hace que un Dog cuente como Animal?", "greet が欲しいのはまさに Animal。埋め込めば Dog は Animal として通る？"),
      note: "embedding",
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
      hint: L("Namer needs Name(). Dog doesn't declare it, but does it get one from what it embeds?", "Namer necesita Name(). Dog no lo declara, pero ¿lo recibe de lo que embebe?", "Namer には Name() が必要。Dog は自分で書いていないけど、埋め込んだものからもらえる？"),
      note: "embedding",
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
      hint: L("Look at how Writer is included in ReadWriter. Does Go use keywords from other languages for this?", "Mira cómo se incluye Writer en ReadWriter. ¿Usa Go palabras clave de otros lenguajes para esto?", "ReadWriter に Writer がどう入っているか見よう。Go は他の言語のキーワードを使う？"),
      note: "embedding",
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
      hint: L("verr is a *ValidationError that stays nil for a good name. What does it become when returned as error?", "verr es un *ValidationError que queda nil con un nombre válido. ¿Qué es al devolverse como error?", "正しい名前なら verr は nil の *ValidationError。error として返すと何になる？"),
      note: "typed-nil",
    },
  ],
  notes: nilNotes,
};

// ─── 3.3 Error scrolls: errors as values ───────────────────────────────────
const errorNotes: NoteDef[] = [
  note("error-values", L("Errors are ordinary values", "Los errores son valores normales", "エラーはふつうの値"),
    p(
      "In Go, a function that can fail returns one more result, of type error, always in the last position. A nil error means success; a non-nil error describes what went wrong. The caller checks right away: if err != nil { ... }.",
      "En Go, una función que puede fallar devuelve un resultado más, de tipo error, siempre en la última posición. Un error nil significa éxito; un error no nil describe qué salió mal. Quien llama lo revisa enseguida: if err != nil { ... }.",
      "Go では、失敗しうる関数は error 型の戻り値をもう1つ、いつも最後に返す。nil なら成功、nil でなければ何が起きたかの説明。呼び出し側はすぐに if err != nil { ... } で確かめる。",
    ),
    ex(go`
      f, err := strconv.ParseFloat("2.5", 64)
      fmt.Println(f, err)
      _, err = strconv.ParseBool("maybe")
      fmt.Println(err)`, "2.5 <nil>\nstrconv.ParseBool: parsing \"maybe\": invalid syntax",
      L("Success gives <nil>; failure gives a message", "El éxito da <nil>; el fallo da un mensaje", "成功なら <nil>、失敗ならメッセージ")),
    p(
      "When a function fails, its other results are usually zero values: 0, \"\", nil. Don't use them before checking err. Writing _ in place of err throws the error away: the code compiles and nothing crashes, you just silently keep working with a zero value.",
      "Cuando una función falla, sus otros resultados suelen ser valores cero: 0, \"\", nil. No los uses antes de revisar err. Escribir _ en lugar de err tira el error: el código compila y nada se rompe, solo sigues trabajando en silencio con un valor cero.",
      "失敗したとき、ほかの戻り値はたいていゼロ値（0、\"\"、nil）。err を確かめる前に使わないこと。err の代わりに _ と書くと error を捨てる。コンパイルでき、落ちもしないが、こっそりゼロ値のまま進んでしまう。",
    ),
    p(
      "A sentinel error is a shared package-level variable made with errors.New, like ErrEmpty. Callers compare with ==. Errors compare by identity, not by text: each errors.New call creates a brand new value, so two errors with the same message are still different.",
      "Un error sentinela es una variable compartida de paquete hecha con errors.New, como ErrEmpty. Quien llama compara con ==. Los errores se comparan por identidad, no por texto: cada llamada a errors.New crea un valor nuevo, así que dos errores con el mismo mensaje siguen siendo distintos.",
      "番兵エラーは errors.New で作るパッケージ共有の変数（例：ErrEmpty）。呼び出し側は == で比べる。error は文字ではなく正体で比べる。errors.New は呼ぶたびに新しい値を作るので、同じ文字でも別物。",
    ),
    ex(go`
      var ErrEmpty = errors.New("empty")

      func first(xs []string) (string, error) {
        if len(xs) == 0 {
          return "", ErrEmpty
        }
        return xs[0], nil
      }

      func main() { _, err := first(nil); fmt.Println(err == ErrEmpty, err) }`, "true empty",
      L("Compare with the shared variable, not a new errors.New", "Compara con la variable compartida, no con un errors.New nuevo", "新しい errors.New ではなく共有の変数と比べる")),
    p(
      "Why values instead of exceptions? Every place that can fail is visible in the code, and the error path is ordinary code you can read. Common mistakes: comparing err.Error() strings, or writing errors.New(\"empty\") again at the call site and expecting == to match.",
      "¿Por qué valores y no excepciones? Cada lugar que puede fallar se ve en el código, y el camino del error es código normal que puedes leer. Errores comunes: comparar textos de err.Error(), o volver a escribir errors.New(\"empty\") al llamar y esperar que == coincida.",
      "なぜ例外ではなく値なのか？失敗しうる場所がコードに全部見え、エラー処理もふつうのコードとして読めるから。よくあるミス：err.Error() の文字を比べる、呼び出し側で errors.New(\"empty\") をもう一度書いて == が合うと思う。",
    ),
  ),
  note("wrapping", L("Wrapping errors with %w", "Envolver errores con %w", "%w でエラーを包む"),
    p(
      "Wrapping adds context while keeping the original error: fmt.Errorf(\"open door: %w\", err). The new error's text is the prefix plus the old text, and it remembers the old error inside, like a scroll rolled inside a bigger scroll. errors.Unwrap returns the inner one.",
      "Envolver añade contexto y conserva el error original: fmt.Errorf(\"open door: %w\", err). El texto del error nuevo es el prefijo más el texto viejo, y recuerda el error viejo adentro, como un pergamino enrollado dentro de otro más grande. errors.Unwrap devuelve el de adentro.",
      "包むと、元の error を残したまま情報を足せる：fmt.Errorf(\"open door: %w\", err)。新しい error の文字は前置き＋元の文字で、中に元の error を覚えている。巻物の中の巻物のように。errors.Unwrap で中のものが取れる。",
    ),
    ex(go`
      var ErrLocked = errors.New("locked")

      func main() {
        err := fmt.Errorf("open door: %w", ErrLocked)
        fmt.Println(err)
        fmt.Println(errors.Unwrap(err) == ErrLocked)
      }`, "open door: locked\ntrue",
      L("The text grows; the original stays inside", "El texto crece; el original queda adentro", "文字は長くなり、元の error は中に残る")),
    p(
      "A wrapper is a new value, so == against the original is false. errors.Is(err, target) unwraps layer after layer, through any number of %w levels, and reports whether target is anywhere in the chain. Rule: once errors may be wrapped, check them with errors.Is, not ==.",
      "Un envoltorio es un valor nuevo, así que == contra el original da false. errors.Is(err, target) desenvuelve capa tras capa, por cualquier cantidad de niveles %w, y dice si target está en algún lugar de la cadena. Regla: si los errores pueden estar envueltos, revísalos con errors.Is, no con ==.",
      "包んだ error は新しい値なので、元と == で比べると false。errors.Is(err, target) は %w の層を何枚でもほどき、target がどこかにあるかを答える。ルール：包まれているかもしれない error は == ではなく errors.Is で調べる。",
    ),
    p(
      "Only the %w verb wraps. %v and %s put the same text in the message, but the link to the inner error is lost, so errors.Is can no longer find it. errors.Join(e1, e2) is another way to combine errors: its text puts each one on its own line, and errors.Is checks all of them.",
      "Solo el verbo %w envuelve. %v y %s ponen el mismo texto en el mensaje, pero se pierde el enlace al error de adentro, y errors.Is ya no lo encuentra. errors.Join(e1, e2) es otra forma de combinar errores: su texto pone cada uno en su propia línea, y errors.Is los revisa todos.",
      "包むのは %w だけ。%v や %s でも文字は同じだが、中の error とのつながりが消え、errors.Is は見つけられない。errors.Join(e1, e2) も error をまとめる方法で、文字は1つずつ別の行になり、errors.Is は全部を調べる。",
    ),
    ex(go`
      var ErrLocked = errors.New("locked")

      func main() {
        kept := fmt.Errorf("a: %w", ErrLocked)
        lost := fmt.Errorf("b: %v", ErrLocked)
        fmt.Println(errors.Is(kept, ErrLocked), errors.Is(lost, ErrLocked))
      }`, "true false",
      L("Same kind of text, but only one keeps the chain", "Texto parecido, pero solo uno conserva la cadena", "文字は似ていても、つながりが残るのは片方だけ")),
    p(
      "Common mistake: wrapping in a lower layer and still comparing with == in an upper one. The check silently stops matching the day someone adds context. If you see err == ErrSomething, ask whether that error could ever arrive wrapped.",
      "Error común: envolver en una capa baja y seguir comparando con == en una capa alta. La comprobación deja de coincidir en silencio el día que alguien añade contexto. Si ves err == ErrAlgo, pregúntate si ese error podría llegar envuelto.",
      "よくあるミス：下の層で包んだのに、上の層で == のまま比べること。だれかが情報を足した日から、こっそり一致しなくなる。err == ErrSomething を見たら、包まれて届く可能性がないか考えよう。",
    ),
  ),
  note("errors-as", L("errors.As: get an error by type", "errors.As: obtener un error por tipo", "errors.As：型でエラーを取り出す"),
    p(
      "Sometimes you need data from an error, not just its message: which field failed, which limit was hit. For that you write a custom error type: any type with an Error() string method is an error, and it can carry fields.",
      "A veces necesitas datos de un error, no solo su mensaje: qué campo falló, qué límite se superó. Para eso escribes un tipo de error propio: cualquier tipo con un método Error() string es un error, y puede llevar campos.",
      "メッセージだけでなく、エラーのデータが欲しいときがある。どのフィールドが失敗したか、どの上限を超えたか。そのために自作の error 型を書く。Error() string を持つ型なら何でも error で、フィールドも持てる。",
    ),
    p(
      "errors.As(err, &target) walks the same chain as errors.Is, but looks for the first error whose TYPE matches target's type. If it finds one, it stores it in target and returns true. Pass a pointer to your variable: if the methods use a pointer receiver, target is a *MyErr and you pass &target.",
      "errors.As(err, &target) recorre la misma cadena que errors.Is, pero busca el primer error cuyo TIPO coincide con el de target. Si lo encuentra, lo guarda en target y devuelve true. Pasa un puntero a tu variable: si los métodos usan receptor puntero, target es un *MiErr y pasas &target.",
      "errors.As(err, &target) は errors.Is と同じつながりをたどり、target と同じ型の最初の error を探す。見つかれば target に入れて true を返す。変数へのポインタを渡すこと。ポインタレシーバなら target は *MyErr で、&target を渡す。",
    ),
    ex(go`
      type LimitErr struct{ Max int }

      func (e *LimitErr) Error() string { return fmt.Sprint("over ", e.Max) }

      func main() {
        err := fmt.Errorf("upload: %w", &LimitErr{Max: 10})
        var le *LimitErr
        fmt.Println(errors.As(err, &le), le.Max, err)
      }`, "true 10 upload: over 10",
      L("errors.As digs out the *LimitErr and fills le", "errors.As saca el *LimitErr y llena le", "errors.As が *LimitErr を取り出して le に入れる")),
    p(
      "Is versus As: errors.Is asks \"is this exact value somewhere in the chain?\" (good for sentinels). errors.As asks \"is there an error of this type? Give it to me\" (good for custom types with fields). Both see through %w wrapping.",
      "Is contra As: errors.Is pregunta \"¿está este valor exacto en algún lugar de la cadena?\" (bueno para sentinelas). errors.As pregunta \"¿hay un error de este tipo? Dámelo\" (bueno para tipos propios con campos). Ambos ven a través de los envoltorios %w.",
      "Is と As の違い：errors.Is は「この値そのものがつながりにある？」（番兵向け）。errors.As は「この型の error はある？あればちょうだい」（フィールドを持つ自作型向け）。どちらも %w の包みを通して見る。",
    ),
    p(
      "Common mistakes: passing le instead of &le (errors.As needs a pointer so it can fill your variable), or using the value type when the Error method has a pointer receiver; then the types never match and As returns false.",
      "Errores comunes: pasar le en vez de &le (errors.As necesita un puntero para poder llenar tu variable), o usar el tipo valor cuando el método Error tiene receptor puntero; entonces los tipos nunca coinciden y As devuelve false.",
      "よくあるミス：&le ではなく le を渡す（変数に入れるには errors.As にポインタが必要）。Error がポインタレシーバなのに値の型を使う。そうすると型が合わず、As は false を返す。",
    ),
  ),
];

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
      hint: L("12a is not a valid number. On failure, what does a Go function put in its other results?", "12a no es un número válido. Si falla, ¿qué pone una función de Go en sus otros resultados?", "12a は正しい数ではない。失敗したとき、Go の関数はほかの戻り値に何を入れる？"),
      note: "error-values",
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
      hint: L("The _ only throws the error away. Does that change what n receives?", "El _ solo tira el error. ¿Cambia eso lo que recibe n?", "_ は error を捨てるだけ。それで n に入るものは変わる？"),
      note: "error-values",
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
      hint: L("Two separate errors.New calls with the same text. Are errors compared by text or by identity?", "Dos llamadas separadas a errors.New con el mismo texto. ¿Los errores se comparan por texto o por identidad?", "同じ文字で errors.New を2回。error は文字で比べる？それとも正体で？"),
      note: "error-values",
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
      hint: L("err is a new wrapper error. Which of the two checks looks only at the outside, and which looks inside?", "err es un error envoltorio nuevo. ¿Cuál de las dos comprobaciones mira solo afuera y cuál mira adentro?", "err は新しく包んだ error。外側だけを見るのはどっち？中まで見るのはどっち？"),
      note: "wrapping",
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
      hint: L("All three print the same text. Only one makes the new error remember the old one inside.", "Las tres imprimen el mismo texto. Solo una hace que el error nuevo recuerde al viejo adentro.", "3つとも表示される文字は同じ。新しい error が中に元の error を覚えるのは1つだけ。"),
      note: "wrapping",
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
      hint: L("Each Errorf adds its own prefix in front. How deep can errors.Is dig through %w layers?", "Cada Errorf añade su prefijo delante. ¿Qué tan hondo cava errors.Is en las capas %w?", "Errorf ごとに前置きが足される。errors.Is は %w の層をどこまでたどれる？"),
      note: "wrapping",
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
      hint: L("errors.As searches the chain for a *NotFound. If it finds one, what happens to nf?", "errors.As busca un *NotFound en la cadena. Si lo encuentra, ¿qué pasa con nf?", "errors.As は *NotFound を探す。見つかったら nf はどうなる？"),
      note: "errors-as",
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
      hint: L("errors.Join keeps every error it gets. How does it write their texts, and does errors.Is check them all?", "errors.Join guarda cada error que recibe. ¿Cómo escribe sus textos, y errors.Is los revisa todos?", "errors.Join は受け取った error を全部持つ。文字はどう並ぶ？errors.Is は全部調べる？"),
      note: "wrapping",
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
      hint: L("You want to know whether a specific sentinel value hides in the chain. Which errors function asks that?", "Quieres saber si un sentinela concreto se esconde en la cadena. ¿Qué función de errors pregunta eso?", "特定の番兵エラーがつながりの中にあるか知りたい。それを調べる errors の関数は？"),
      note: "wrapping",
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
      hint: L("call wraps ErrBusy, so err is not the same value. Use a check that looks through the wrapping.", "call envuelve ErrBusy, así que err no es el mismo valor. Usa una comprobación que mire dentro del envoltorio.", "call は ErrBusy を包むので err は別の値。包みの中まで見る確認を使おう。"),
      note: "wrapping",
    },
  ],
  notes: errorNotes,
};

// ─── 3.4 One spell, many types: generics ───────────────────────────────────
const genericNotes: NoteDef[] = [
  note("type-params", L("Generic functions: a slot for a type", "Funciones genéricas: hueco de tipo", "ジェネリック関数：型の空き"),
    p(
      "A generic function has type parameters in square brackets before its normal parameters: func Last[T any](xs []T) T. T is a placeholder for a type. At each call, Go replaces T with a real type, so one function works for ints, strings or anything the constraint allows.",
      "Una función genérica tiene parámetros de tipo entre corchetes antes de sus parámetros normales: func Last[T any](xs []T) T. T es un hueco para un tipo. En cada llamada, Go reemplaza T por un tipo real, así que una sola función sirve para ints, strings o lo que la restricción permita.",
      "ジェネリック関数は、ふつうの引数の前の角かっこに型パラメータを持つ：func Last[T any](xs []T) T。T は型の空き。呼ぶたびに Go が T を本物の型に置きかえるので、1つの関数で int にも string にも使える。",
    ),
    ex(go`
      func Last[T any](xs []T) T {
        return xs[len(xs)-1]
      }

      func main() {
        fmt.Println(Last([]int{4, 8}), Last([]string{"x", "y"}))
        fmt.Println(Last[bool]([]bool{true, false}))
      }`, "8 y\nfalse",
      L("T is inferred, or written by hand in brackets", "T se deduce, o se escribe a mano entre corchetes", "T は推論されるか、角かっこで手書きする")),
    p(
      "Usually Go infers T from the arguments, so you just call Last(xs). You can also choose T by hand: Min[float64](2, 0.5). Then untyped numbers like 2 become that type, and a float64 that happens to be whole prints without a decimal point, like 2.",
      "Normalmente Go deduce T de los argumentos, así que solo llamas Last(xs). También puedes elegir T a mano: Min[float64](2, 0.5). Entonces los números sin tipo como 2 se vuelven de ese tipo, y un float64 que resulta entero se imprime sin punto decimal, como 2.",
      "ふつうは Go が引数から T を推論するので、Last(xs) と呼ぶだけ。Min[float64](2, 0.5) のように手で選ぶこともできる。すると 2 のような型のない数はその型になり、整数の float64 は 2 のように小数点なしで表示される。",
    ),
    p(
      "The part after T is the constraint: it says which types are allowed. int | float64 is a union meaning \"int or float64\". Calling the function with any other type is a compile error: the type does not satisfy the constraint. The constraint is the gate.",
      "Lo que va después de T es la restricción: dice qué tipos se permiten. int | float64 es una unión que significa \"int o float64\". Llamar la función con cualquier otro tipo es un error de compilación: el tipo does not satisfy la restricción. La restricción es la puerta.",
      "T のあとに書くのが制約で、使える型を決める。int | float64 は「int か float64」という和集合。それ以外の型で呼ぶとコンパイルエラー（does not satisfy）。制約は門番なのじゃ。",
    ),
    ex(go`
      func Min[T int | float64](a, b T) T {
        if a < b {
          return a
        }
        return b
      }

      func main() { fmt.Println(Min(9, 4), Min[float64](2, 0.5)) }`, "4 0.5",
      L("Both calls go through the int | float64 gate", "Ambas llamadas pasan por la puerta int | float64", "どちらの呼び出しも int | float64 の門を通る")),
    bad(go`
      func Min[T int | float64](a, b T) T {
        if a < b {
          return a
        }
        return b
      }

      func main() { fmt.Println(Min("a", "b")) }`,
      L("Does not compile: string is not in the union", "No compila: string no está en la unión", "コンパイル不可：string は和集合に入っていない")),
    p(
      "Why generics? Without them you write MinInt, MinFloat and so on, or use any and lose type safety. Common mistake: expecting one call to mix types. In Min(a, b) both arguments are the same T, so an int and a float64 variable can't go together.",
      "¿Por qué genéricos? Sin ellos escribes MinInt, MinFloat, etc., o usas any y pierdes la seguridad de tipos. Error común: esperar que una llamada mezcle tipos. En Min(a, b) ambos argumentos son el mismo T, así que una variable int y una float64 no pueden ir juntas.",
      "なぜジェネリクス？なければ MinInt や MinFloat を何個も書くか、any を使って型の安全を失う。よくあるミス：1回の呼び出しで型を混ぜられると思うこと。Min(a, b) の2つは同じ T なので、int 変数と float64 変数はいっしょに渡せない。",
    ),
  ),
  note("constraints", L("Constraints decide what T can do", "La restricción decide qué hace T", "制約が T にできることを決める"),
    p(
      "Inside a generic function, Go only lets you use operations that EVERY type in the constraint supports. The body is checked once, for all allowed types, not separately for the types you happen to call it with. With any, that means you can store, pass and return T, but not use +, < or ==.",
      "Dentro de una función genérica, Go solo deja usar operaciones que TODO tipo de la restricción admite. El cuerpo se revisa una vez, para todos los tipos permitidos, no por separado para los tipos con que la llames. Con any, puedes guardar, pasar y devolver T, pero no usar +, < ni ==.",
      "ジェネリック関数の中では、制約のすべての型ができる操作だけが使える。本体は呼び出した型ごとではなく、許された型全部について一度だけ検査される。any なら T を保存・受け渡し・返すことはできるが、+ や < や == は使えない。",
    ),
    bad(go`
      func Bigger[T any](a, b T) bool {
        return a > b
      }

      func main() { fmt.Println(Bigger(1, 2)) }`,
      L("Does not compile: not every type supports >", "No compila: no todo tipo admite >", "コンパイル不可：すべての型が > を使えるわけではない")),
    p(
      "comparable is the built-in constraint for types that support == and !=: numbers, strings, booleans, pointers, channels, and structs made of those. It does not include slices, maps or functions. For < and >, use a union of ordered types or cmp.Ordered.",
      "comparable es la restricción incorporada para tipos que admiten == y !=: números, strings, booleanos, punteros, canales y structs hechos de esos. No incluye slices, maps ni funciones. Para < y >, usa una unión de tipos ordenables o cmp.Ordered.",
      "comparable は == と != が使える型のための組み込み制約。数・string・bool・ポインタ・チャネル、それらでできた struct。slice や map、関数は入らない。< や > には順序のある型の和集合か cmp.Ordered を使う。",
    ),
    ex(go`
      func Count[T comparable](xs []T, v T) int {
        n := 0
        for _, x := range xs {
          if x == v { n++ }
        }
        return n
      }

      func main() { fmt.Println(Count([]string{"a", "b", "a"}, "a")) }`, "2",
      L("comparable makes x == v legal", "comparable hace válido x == v", "comparable なら x == v が書ける")),
    p(
      "A tilde widens a union: ~int means \"any type whose underlying type is int\". type Meters int is its own type, so plain int rejects it, but ~int accepts it. Named constraints like type Integer interface{ ~int | ~int64 } keep signatures short.",
      "Una virgulilla amplía la unión: ~int significa \"cualquier tipo cuyo tipo base es int\". type Meters int es un tipo propio, así que int solo lo rechaza, pero ~int lo acepta. Restricciones con nombre como type Integer interface{ ~int | ~int64 } acortan las firmas.",
      "~ は和集合を広げる。~int は「元の型が int の型なら何でも」。type Meters int は別の型なので int だけの制約は拒むが、~int なら受け入れる。type Integer interface{ ~int | ~int64 } のように名前をつけると短く書ける。",
    ),
    ex(go`
      type Meters int

      type Integer interface{ ~int | ~int64 }

      func Twice[T Integer](x T) T { return x * 2 }

      func main() { fmt.Println(Twice(Meters(21)), Twice(int64(5))) }`, "42 10",
      L("~int lets Meters in, and * works for every member", "~int deja entrar a Meters, y * sirve para todos", "~int で Meters も入り、* はどの型でも使える")),
    p(
      "Common mistake: starting with any and then writing + or ==. The fix is never a cast; it is a tighter constraint whose types all support the operation. Also note that an interface with a type union can only be used as a constraint, not as a normal variable type.",
      "Error común: empezar con any y luego escribir + o ==. La solución nunca es una conversión; es una restricción más estricta cuyos tipos admitan todos la operación. Nota también que una interface con unión de tipos solo puede usarse como restricción, no como tipo de variable normal.",
      "よくあるミス：any で始めてから + や == を書くこと。直し方は型変換ではなく、すべての型がその操作をできる、より狭い制約にすること。型の和集合を持つインターフェースは制約にしか使えず、ふつうの変数の型にはできない。",
    ),
  ),
  note("generic-types", L("Generic types and zero values", "Tipos genéricos y valores cero", "ジェネリック型とゼロ値"),
    p(
      "Types can have type parameters too: type Queue[T any] struct{ items []T }. To use one, you fill in the type: Queue[int], Queue[string]. Its methods use the receiver (q *Queue[T]) and can use T freely, but a method can't add new type parameters of its own.",
      "Los tipos también pueden tener parámetros de tipo: type Queue[T any] struct{ items []T }. Para usarlo, completas el tipo: Queue[int], Queue[string]. Sus métodos usan el receptor (q *Queue[T]) y pueden usar T libremente, pero un método no puede añadir parámetros de tipo propios.",
      "型も型パラメータを持てる：type Queue[T any] struct{ items []T }。使うときは Queue[int] や Queue[string] のように型を埋める。メソッドはレシーバ (q *Queue[T]) で T を自由に使えるが、メソッドが自分の型パラメータを足すことはできない。",
    ),
    ex(go`
      type Queue[T any] struct{ items []T }

      func (q *Queue[T]) Put(v T) { q.items = append(q.items, v) }
      func (q *Queue[T]) Take() T {
        v := q.items[0]
        q.items = q.items[1:]
        return v
      }

      func main() { var q Queue[int]; q.Put(5); q.Put(6); fmt.Println(q.Take(), len(q.items)) }`, "5 1",
      L("A queue takes from the front; a stack would take the last", "Una cola saca del frente; una pila sacaría el último", "キューは先頭から取る。スタックなら最後から")),
    p(
      "Inside generic code you often need \"an empty T\". var zero T gives the zero value of whatever T is: 0 for numbers, \"\" for strings, false for bool, nil for pointers, slices and maps. It is the standard way to return \"nothing\" together with ok false.",
      "En código genérico a menudo necesitas \"un T vacío\". var zero T da el valor cero de lo que sea T: 0 para números, \"\" para strings, false para bool, nil para punteros, slices y maps. Es la forma estándar de devolver \"nada\" junto con ok false.",
      "ジェネリックなコードでは「空の T」がよく必要になる。var zero T は T のゼロ値。数は 0、string は \"\"、bool は false、ポインタ・slice・map は nil。ok false といっしょに「何もない」を返す定番の方法。",
    ),
    ex(go`
      func Get[T any](xs []T, i int) (T, bool) {
        var zero T
        if i >= len(xs) {
          return zero, false
        }
        return xs[i], true
      }

      func main() { v, ok := Get([]float64{1.5}, 3); fmt.Println(v, ok) }`, "0 false",
      L("Out of range: the zero float64 and false", "Fuera de rango: el float64 cero y false", "範囲外：float64 のゼロ値と false")),
    p(
      "any is the loosest constraint: every type fits, which is perfect for containers that only store and return values. Common mistake: forgetting the type argument. var q Queue does not compile; a generic type must be instantiated, as in var q Queue[int].",
      "any es la restricción más suelta: cabe todo tipo, ideal para contenedores que solo guardan y devuelven valores. Error común: olvidar el argumento de tipo. var q Queue no compila; un tipo genérico debe instanciarse, como en var q Queue[int].",
      "any はいちばんゆるい制約で、どんな型も入る。値を入れて返すだけの入れ物にぴったり。よくあるミス：型引数を忘れること。var q Queue はコンパイルできない。var q Queue[int] のように型を埋める必要がある。",
    ),
    bad(go`
      type Queue[T any] struct{ items []T }

      func main() {
        var q Queue
        fmt.Println(q)
      }`,
      L("Does not compile: Queue needs a type argument", "No compila: Queue necesita un argumento de tipo", "コンパイル不可：Queue に型引数が必要")),
  ),
];

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
      hint: L("Go infers T from each call's arguments. In the last call T is chosen by hand; how does that float print?", "Go deduce T de los argumentos. En la última llamada T se elige a mano; ¿cómo se imprime ese float?", "Go は引数から T を推論する。最後は T を手で指定。その float はどう表示される？"),
      note: "type-params",
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
      hint: L("Check the constraint in brackets. Is string one of the types it lists?", "Revisa la restricción entre corchetes. ¿Es string uno de los tipos que enumera?", "かっこの中の制約を見よう。string はそこに並んでいる？"),
      note: "type-params",
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
      hint: L("Inside, Go only allows what EVERY type in the constraint supports. Does every type support +?", "Adentro, Go solo permite lo que TODO tipo de la restricción admite. ¿Todos los tipos admiten +?", "中では、制約のすべての型ができることだけ使える。すべての型が + を使える？"),
      note: "constraints",
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
      hint: L("The loop compares with ==. Does every possible type allow ==? Pick the constraint that guarantees it.", "El bucle compara con ==. ¿Todo tipo posible admite ==? Elige la restricción que lo garantiza.", "ループで == を使う。どんな型でも == が使える？それを保証する制約を選ぼう。"),
      note: "constraints",
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
      hint: L("Celsius is its own type, built on float64. What does the ~ in the constraint allow?", "Celsius es un tipo propio, basado en float64. ¿Qué permite el ~ de la restricción?", "Celsius は float64 をもとにした独自の型。制約の ~ は何を許す？"),
      note: "constraints",
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
      hint: L("Follow the pushes in order. A stack's Pop takes from which end?", "Sigue los Push en orden. ¿Por qué extremo saca Pop en una pila?", "Push の順番を追おう。スタックの Pop はどちらの端から取る？"),
      note: "generic-types",
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
      hint: L("var z T gives the zero value of T. Think of each type's zero value: int, string, a pointer.", "var z T da el valor cero de T. Piensa en el valor cero de cada tipo: int, string, un puntero.", "var z T は T のゼロ値。int、string、ポインタそれぞれのゼロ値を考えよう。"),
      note: "generic-types",
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
      hint: L("The box must accept every type, even bool. Which built-in constraint puts no limits on T?", "La caja debe aceptar cualquier tipo, incluso bool. ¿Qué restricción incorporada no limita a T?", "箱は bool も含めどんな型も受け入れる。T に制限をかけない組み込みの制約は？"),
      note: "generic-types",
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
      hint: L("Under any, + isn't allowed. Replace any with a constraint whose types all support +.", "Con any no se permite +. Cambia any por una restricción cuyos tipos admitan todos el +.", "any では + が使えない。すべての型が + を使える制約に変えよう。"),
      note: "constraints",
    },
  ],
  notes: genericNotes,
};

// ─── Boss: The Typed-Nil Knight ────────────────────────────────────────────
const bossNotes: NoteDef[] = [
  note("recap-interfaces", L("Recap: interfaces", "Repaso: interfaces", "復習：インターフェース"),
    p(
      "A type fits an interface when it has all the methods; no keyword needed. A method with a pointer receiver belongs only to *T, so store &T{} in the interface. To get the concrete value back, use v, ok := x.(T), which never panics.",
      "Un tipo encaja en una interface cuando tiene todos los métodos; no hace falta palabra clave. Un método con receptor puntero pertenece solo a *T, así que guarda &T{} en la interface. Para recuperar el valor concreto, usa v, ok := x.(T), que nunca hace panic.",
      "メソッドを全部持てば、キーワードなしでインターフェースに当てはまる。ポインタレシーバのメソッドは *T だけのものなので、&T{} を入れる。中の値は v, ok := x.(T) で取り出せば panic しない。",
    ),
    p(
      "A named type keeps its methods through arithmetic: if Level has String(), then lv*3 is still a Level and prints through String. Converting with int(lv) gives a plain int with no methods, so it prints as a bare number.",
      "Un tipo con nombre conserva sus métodos al hacer cuentas: si Level tiene String(), entonces lv*3 sigue siendo Level y se imprime con String. Convertir con int(lv) da un int simple sin métodos, así que se imprime como un número a secas.",
      "名前つきの型は計算しても型とメソッドが残る。Level に String() があれば、lv*3 も Level のままで String で表示される。int(lv) で変えるとメソッドのないただの int になり、数だけが表示される。",
    ),
    ex(go`
      type Level int

      func (l Level) String() string { return fmt.Sprintf("L%d", int(l)) }

      func main() {
        var x any = Level(2)
        if lv, ok := x.(Level); ok {
          fmt.Println(lv*3, int(lv)*3)
        }
      }`, "L6 6",
      L("lv*3 is still a Level; int(lv)*3 is not", "lv*3 sigue siendo Level; int(lv)*3 no", "lv*3 は Level のまま、int(lv)*3 は違う")),
    p(
      "Storing a plain value (not a pointer) in an interface copies it. Later changes to the original variable don't reach the copy held by the interface.",
      "Guardar un valor simple (no un puntero) en una interface lo copia. Los cambios posteriores a la variable original no llegan a la copia que guarda la interface.",
      "ふつうの値（ポインタではない）をインターフェースに入れるとコピーされる。あとで元の変数を変えても、インターフェースの中のコピーには届かない。",
    ),
    ex(go`
      type Point struct{ x int }

      func main() {
        pt := Point{5}
        var held any = pt
        pt.x = 9
        fmt.Println(pt.x, held.(Point).x)
      }`, "9 5",
      L("The interface kept its own copy", "La interface guardó su propia copia", "インターフェースは自分のコピーを持つ")),
  ),
  note("recap-typed-nil", L("Recap: typed nil", "Repaso: nil con tipo", "復習：型つき nil"),
    p(
      "An interface is a (type, value) pair, and it is nil only when both halves are empty. Putting a nil pointer, map, slice or channel inside fills the type half, so the interface is no longer nil.",
      "Una interface es un par (tipo, valor), y solo es nil cuando ambas mitades están vacías. Meter dentro un puntero, map, slice o canal nil llena la mitad del tipo, así que la interface ya no es nil.",
      "インターフェースは (型, 値) のペアで、両方が空のときだけ nil。nil のポインタ・map・slice・チャネルを入れると型の半分が埋まり、もう nil ではない。",
    ),
    ex(go`
      var ch chan int
      var v any = ch
      fmt.Println(ch == nil, v == nil)`, "true false",
      L("A nil channel inside a non-nil interface", "Un canal nil dentro de una interface no nil", "nil でないインターフェースの中の nil チャネル")),
    p(
      "The rule for functions that return error: on success, write return nil. Returning a pointer variable that is nil, or a conversion like (*T)(nil), gives the caller a non-nil error that looks like a failure.",
      "La regla para funciones que devuelven error: en el éxito, escribe return nil. Devolver una variable puntero que vale nil, o una conversión como (*T)(nil), le da a quien llama un error no nil que parece un fallo.",
      "error を返す関数のルール：成功なら return nil と書く。nil のポインタ変数や (*T)(nil) を返すと、呼び出し側には失敗に見える nil でない error が届く。",
    ),
    p(
      "Quick test: ask what %T would print. If it prints a type name, the interface has a type half, and == nil is false.",
      "Prueba rápida: pregúntate qué imprimiría %T. Si imprime un nombre de tipo, la interface tiene la mitad del tipo, y == nil es false.",
      "見分け方：%T が何を表示するか考えよう。型名が出るなら型の半分があり、== nil は false。",
    ),
  ),
  note("recap-errors", L("Recap: errors", "Repaso: errores", "復習：エラー"),
    p(
      "fmt.Errorf with %w wraps an error in a new one. == compares only the outer value, so it no longer matches the original. errors.Is(err, target) unwraps the whole chain looking for an exact value, like a sentinel.",
      "fmt.Errorf con %w envuelve un error en otro nuevo. == compara solo el valor de afuera, así que ya no coincide con el original. errors.Is(err, target) desenvuelve toda la cadena buscando un valor exacto, como un sentinela.",
      "fmt.Errorf と %w は error を新しい error で包む。== は外側の値しか比べないので、元とは一致しなくなる。errors.Is(err, target) はつながり全体をほどいて、番兵のような特定の値を探す。",
    ),
    p(
      "errors.As(err, &target) searches the same chain for an error of target's TYPE, copies it into target and returns true. Use it when you need the error's fields. The target must match exactly: a value type if Error has a value receiver, a pointer type if it has a pointer receiver.",
      "errors.As(err, &target) busca en la misma cadena un error del TIPO de target, lo copia en target y devuelve true. Úsalo cuando necesites los campos del error. target debe coincidir exacto: tipo valor si Error tiene receptor valor, tipo puntero si tiene receptor puntero.",
      "errors.As(err, &target) は同じつながりから target と同じ型の error を探し、target にコピーして true を返す。フィールドが必要なときに使う。値レシーバなら値の型、ポインタレシーバならポインタ型で合わせる。",
    ),
    ex(go`
      type Code struct{ N int }

      func (c Code) Error() string { return fmt.Sprint("code ", c.N) }

      func main() {
        err := fmt.Errorf("api: %w", Code{500})
        var c Code
        fmt.Println(errors.As(err, &c), c.N, err)
      }`, "true 500 api: code 500",
      L("As fills c with the Code found inside", "As llena c con el Code que encuentra adentro", "As が中の Code を c に入れる")),
    p(
      "Memory aid: Is compares with a value you already have; As extracts a value of a type you name.",
      "Truco para recordar: Is compara con un valor que ya tienes; As extrae un valor del tipo que nombras.",
      "覚え方：Is は手元の値と比べる。As は指定した型の値を取り出す。",
    ),
  ),
  note("recap-generics", L("Recap: generics", "Repaso: genéricos", "復習：ジェネリクス"),
    p(
      "Type parameters go in brackets: func F[T C](x T). The constraint C decides what the body may do with T, checked once for every allowed type. Under any, operators like + and > are forbidden, whatever types you later pass.",
      "Los parámetros de tipo van entre corchetes: func F[T C](x T). La restricción C decide qué puede hacer el cuerpo con T, revisado una vez para todo tipo permitido. Con any, operadores como + y > están prohibidos, sin importar qué tipos pases luego.",
      "型パラメータは角かっこに書く：func F[T C](x T)。制約 C が本体で T にできることを決め、許された型全部について一度だけ検査される。any の下では、あとで何の型を渡しても + や > は使えない。",
    ),
    p(
      "To allow operators, use a union of types that all support them, with ~ to also accept named types built on them: interface{ ~int | ~string }. One generic function then works for each type in the union, instantiated per call.",
      "Para permitir operadores, usa una unión de tipos que los admitan todos, con ~ para aceptar también tipos con nombre basados en ellos: interface{ ~int | ~string }. Así una función genérica sirve para cada tipo de la unión, instanciada en cada llamada.",
      "演算子を使うには、全部がそれを使える型の和集合にする。~ をつければそれをもとにした名前つきの型も入る：interface{ ~int | ~string }。1つのジェネリック関数が、呼び出しごとに和集合の各型で使える。",
    ),
    ex(go`
      type Ordered interface{ ~int | ~string }

      func Biggest[T Ordered](xs []T) T {
        best := xs[0]
        for _, x := range xs[1:] {
          if x > best { best = x }
        }
        return best
      }

      func main() { fmt.Println(Biggest([]int{3, 9, 2}), Biggest([]string{"b", "a"})) }`, "9 b",
      L("> is allowed because every member supports it", "> se permite porque todos los miembros lo admiten", "全部の型が > を使えるので許される")),
  ),
];

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
      hint: L("Compare the receiver of Speak with the value stored in s.", "Compara el receptor de Speak con el valor guardado en s.", "Speak のレシーバと s に入れた値を比べよう。"),
      note: "recap-interfaces",
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
      hint: L("Which value is still an ID when printed, and which one became a plain int?", "¿Qué valor sigue siendo ID al imprimirse y cuál se volvió un int simple?", "表示するとき ID のままの値はどれ？ただの int になったのは？"),
      note: "recap-interfaces",
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
      hint: L("find returns a *E variable as an error. What does the interface remember?", "find devuelve una variable *E como error. ¿Qué recuerda la interface?", "find は *E の変数を error で返す。インターフェースは何を覚えている？"),
      note: "recap-typed-nil",
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
      hint: L("When s goes into i, does i share s or keep its own copy?", "Cuando s entra en i, ¿i comparte s o guarda su propia copia?", "s を i に入れたとき、i は s を共有する？自分のコピーを持つ？"),
      note: "recap-interfaces",
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
      hint: L("One check sees only the wrapper; the other unwraps. Which is which?", "Una comprobación ve solo el envoltorio; la otra desenvuelve. ¿Cuál es cuál?", "包みだけを見る確認と、ほどく確認がある。どっちがどっち？"),
      note: "recap-errors",
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
      hint: L("errors.As looks for an Op in the chain. If found, what is copied into op?", "errors.As busca un Op en la cadena. Si lo encuentra, ¿qué se copia en op?", "errors.As はつながりから Op を探す。見つかったら op に何が入る？"),
      note: "recap-errors",
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
      hint: L("The body is checked once for every type any allows, not for the strings you pass.", "El cuerpo se revisa una vez para todo tipo que any admite, no para los strings que pasas.", "本体は渡した string ではなく、any が許すすべての型について検査される。"),
      note: "recap-generics",
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
      hint: L("Number allows ints and floats. Work out Sum once for each slice.", "Number admite ints y floats. Calcula Sum una vez por cada slice.", "Number は int も float も OK。slice ごとに Sum を計算しよう。"),
      note: "recap-generics",
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
      hint: L("Think of the (type, value) pair each option produces when returned as error.", "Piensa en el par (tipo, valor) que produce cada opción al devolverse como error.", "それぞれを error で返したときの (型, 値) のペアを考えよう。"),
      note: "recap-typed-nil",
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
      hint: L("You don't compare with a value here: you pull an error of a given type into op. Which function does that?", "Aquí no comparas con un valor: sacas un error de cierto tipo hacia op. ¿Qué función hace eso?", "ここでは値と比べない。ある型の error を op に取り出す。それをする関数は？"),
      note: "recap-errors",
    },
    enemySays(L(
      "My shield... you saw the type hiding under the nil. Go on, then: the Channel Tower awaits.",
      "Mi escudo... viste el tipo escondido bajo el nil. Sigue, entonces: te espera la Torre de Canales.",
      "我が盾…nil の下の型を見抜いたか。行け、チャネルの塔が待っている。",
    )),
  ],
  notes: bossNotes,
};

export const interfaceCastle: RegionDef = {
  slug: "interface-castle",
  name: L("Interface Castle", "Castillo Interface", "インターフェース城"),
  subtitle: L("Interfaces · nil · errors · generics", "Interfaces · nil · errores · genéricos", "インターフェース・nil・エラー・ジェネリクス"),
  theme: "castle",
  lessons: [implicitInterfaces, nilTraps, errorsAsValues, generics, boss],
};
