import type { ExamDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import {
  dedupeTask,
  mergeIntervalsTask,
  parallelMapTask,
  parseAgeTask,
  parseKVTask,
  pipelineTask,
  reverseWordsTask,
  secondLargestTask,
  stackTask,
  topKTask,
  topLetterTask,
  withdrawTask,
} from "./tasks.ts";

// Entry exams that simulate company screenings for Go backend roles.
// Topics, levels and bank sizes follow docs/research/go-curriculum.md ("Entry exams") and
// docs/research/go-hiring-assessments.md. Every compile, output, panic or deadlock claim carries a
// `check` run on the Go Playground: `npm run content:verify -- --lang=go --only=exam:`.
// Snippets without `package main` are placed inside `func main()` with std imports added.

const code = (...lines: string[]) => lines.join("\n");

const YN = [L("Yes", "Sí", "はい"), L("No", "No", "いいえ")];
const PRINTS = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const HAPPENS = L("What happens when it runs?", "¿Qué pasa al ejecutarlo?", "実行するとどうなる？");
const DEADLOCK = L("Deadlock (fatal error)", "Deadlock (fatal error)", "デッドロック（fatal error）");

/** A full program file. Without `main` (test files) the Playground runs it as `go test`. */
const goFile = (imports: string[], ...lines: string[]) =>
  `package main\n\nimport (\n${imports.map((i) => `\t"${i}"`).join("\n")}\n)\n\n${lines.join("\n")}\n`;

const ABS_TEST = [
  "func Abs(x int) int { return x } // forgot x < 0",
  "",
  "func TestAbs(t *testing.T) {",
  "\tcases := []struct{ in, want int }{{2, 2}, {-3, 3}}",
  "\tfor _, tc := range cases {",
  "\t\tif got := Abs(tc.in); got != tc.want {",
  '\t\t\tt.Errorf("Abs(%d) = %d, want %d", tc.in, got, tc.want)',
  "\t\t}",
  "\t}",
  "}",
];

const UPPER_TEST = (fill: string) => [
  "func TestUpper(t *testing.T) {",
  "\tcases := []struct{ name, in, want string }{{\"lower\", \"go\", \"GO\"}}",
  "\tfor _, tc := range cases {",
  `\t\tt.${fill}(tc.name, func(t *testing.T) {`,
  "\t\t\tif got := strings.ToUpper(tc.in); got != tc.want {",
  '\t\t\t\tt.Errorf("got %q", got)',
  "\t\t\t}",
  "\t\t})",
  "\t}",
  "}",
];

const MAX_GENERIC = (fill: string) => [
  `func Max[T ${fill}](a, b T) T {`,
  "\tif a > b {",
  "\t\treturn a",
  "\t}",
  "\treturn b",
  "}",
  "",
  "func main() {",
  '\tfmt.Println(Max(3, 7), Max("a", "b"))',
  "}",
];

export const exams: ExamDef[] = [
  // ─── JUNIOR ───────────────────────────────────────────────────────────────
  {
    slug: "junior",
    level: "junior",
    title: L("Junior Go Developer", "Go Developer Junior", "ジュニア Go 開発者"),
    description: L(
      "Online skills test for a junior Go role: types, zero values, functions, strings, slices, maps, defer, errors.",
      "Test en línea para un puesto junior de Go: tipos, valores cero, funciones, strings, slices, mapas, defer y errores.",
      "ジュニア Go 職のオンライン試験：型、ゼロ値、関数、文字列、スライス、マップ、defer、エラー。",
    ),
    count: 12,
    passPct: 70,
    secondsPerQuestion: 30,
    codeCount: 1,
    questions: [
      reverseWordsTask,
      secondLargestTask,
      topLetterTask,
      parseAgeTask,
      // basics
      {
        topic: "basics", difficulty: 1, kind: "predict", prompt: COMPILES,
        code: code("x := 1", "y := 2", "fmt.Println(x)"),
        options: [YN[0], L("No: y is declared and not used", "No: y se declara y no se usa", "いいえ：y が未使用")], answer: 1,
        explain: L(
          "Go rejects unused local variables (and unused imports) at compile time. Delete y or use _ to discard a value.",
          "Go rechaza variables locales sin usar (e imports sin usar) al compilar. Borra y o usa _ para descartar un valor.",
          "Go は使われないローカル変数や import をコンパイルエラーにする。y を消すか、_ で捨てよう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "basics", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("var n int", "var s string", "var b bool", 'fmt.Println(n, s == "", b)'),
        options: ["0 true false", "0 false false", "nil true nil"], answer: 0,
        explain: L(
          "Every variable starts at its type's zero value: 0 for numbers, \"\" for strings, false for bools. Never garbage.",
          "Toda variable empieza con el valor cero de su tipo: 0 en números, \"\" en strings, false en bools. Nunca basura.",
          "変数は型のゼロ値で始まる。数値は 0、文字列は \"\"、bool は false。ゴミ値にはならない。",
        ),
        check: { compiles: true, stdout: "0 true false" },
      },
      {
        topic: "basics", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("x := 1", "if true {", "\tx := 2", "\tx++", "\t_ = x", "}", "fmt.Println(x)"),
        options: ["1", "2", "3"], answer: 0,
        explain: L(
          "Inside the block, x := 2 declares a new x that shadows the outer one. The outer x is never changed, so it prints 1.",
          "Dentro del bloque, x := 2 declara una x nueva que oculta la de afuera. La x externa no cambia: imprime 1.",
          "ブロック内の x := 2 は外側を隠す新しい x を作る。外側の x は変わらないので 1。",
        ),
        check: { compiles: true, stdout: "1" },
      },
      {
        topic: "basics", difficulty: 2, kind: "pick", prompt: L("Make it compile and print 4.5", "Haz que compile e imprima 4.5", "コンパイルして 4.5 を表示"),
        code: code("a := 3", "b := 1.5", "fmt.Println(___ + b)"),
        options: ["float64(a)", "a", "int(b)"], answer: 0,
        explain: L(
          "Go never converts types implicitly: int + float64 is an error. Convert explicitly with float64(a).",
          "Go nunca convierte tipos implícitamente: int + float64 es un error. Convierte a mano con float64(a).",
          "Go は暗黙の型変換をしない。int + float64 はエラー。float64(a) で明示的に変換しよう。",
        ),
        check: { compiles: true, stdout: "4.5", wrongFail: true },
      },
      // functions
      {
        topic: "functions", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("switch 1 {", "case 1:", '\tfmt.Print("a")', "\tfallthrough", "case 2:", '\tfmt.Print("b")', "case 3:", '\tfmt.Print("c")', "}"),
        options: ["a", "ab", "abc"], answer: 1,
        explain: L(
          "Go cases do not fall through by default. fallthrough moves into the next case only, so it prints ab.",
          "En Go los case no caen al siguiente por defecto. fallthrough entra solo en el case siguiente: imprime ab.",
          "Go の case は自動で次に進まない。fallthrough は次の case 1つだけに進むので ab。",
        ),
        check: { compiles: true, stdout: "ab" },
      },
      {
        topic: "functions", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(
          "func divmod(a, b int) (int, int) {",
          "\treturn a / b, a % b",
          "}",
          "",
          "func main() {",
          "\tq, r := divmod(17, 5)",
          "\tfmt.Println(q, r)",
          "}",
        ),
        options: ["3 2", "3.4 0", "2 3"], answer: 0,
        explain: L(
          "Functions can return several values. Integer division truncates: 17 / 5 is 3 and 17 % 5 is 2.",
          "Las funciones pueden devolver varios valores. La división entera trunca: 17 / 5 es 3 y 17 % 5 es 2.",
          "関数は複数の値を返せる。整数の割り算は切り捨て：17 / 5 は 3、17 % 5 は 2。",
        ),
        check: { compiles: true, stdout: "3 2" },
      },
      {
        topic: "functions", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "next := func() func() int {",
          "\tn := 0",
          "\treturn func() int { n++; return n }",
          "}()",
          "next()",
          "next()",
          "fmt.Println(next())",
        ),
        options: ["1", "3", "0"], answer: 1,
        explain: L(
          "The returned closure captures n and keeps it alive between calls. Each call increments the same n: 1, 2, 3.",
          "El closure devuelto captura n y la mantiene viva entre llamadas. Cada llamada suma a la misma n: 1, 2, 3.",
          "返されたクロージャは n をつかんで保持する。呼ぶたびに同じ n が増える：1, 2, 3。",
        ),
        check: { compiles: true, stdout: "3" },
      },
      // strings
      {
        topic: "strings", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: 'fmt.Println(len("héllo"))',
        options: ["5", "6", "7"], answer: 1,
        explain: L(
          "len counts bytes, not characters. Strings are UTF-8 and é takes 2 bytes. Count runes with utf8.RuneCountInString.",
          "len cuenta bytes, no caracteres. Los strings son UTF-8 y é ocupa 2 bytes. Cuenta runas con utf8.RuneCountInString.",
          "len は文字数でなくバイト数。文字列は UTF-8 で é は2バイト。文字数は utf8.RuneCountInString で。",
        ),
        check: { compiles: true, stdout: "6" },
      },
      {
        topic: "strings", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code('for i, r := range "aé!" {', '\tfmt.Print(i, ":", string(r), " ")', "}"),
        options: ["0:a 1:é 2:!", "0:a 1:é 3:!", "0:a 1:é 4:!"], answer: 1,
        explain: L(
          "range over a string decodes runes, and i is the byte offset of each rune. é uses bytes 1 and 2, so ! starts at 3.",
          "range sobre un string decodifica runas, e i es el byte donde empieza cada una. é usa los bytes 1 y 2: ! empieza en 3.",
          "文字列の range はルーンを取り出し、i はバイト位置。é は1と2を使うので ! は 3 から。",
        ),
        check: { compiles: true, stdout: "0:a 1:é 3:!" },
      },
      {
        topic: "strings", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code('s := "go"', "s[0] = 'G'", "fmt.Println(s)"),
        options: [L("Yes, prints Go", "Sí, imprime Go", "はい、Go と表示"), L("No: strings are immutable", "No: los strings son inmutables", "いいえ：文字列は変更不可")], answer: 1,
        explain: L(
          "Strings are immutable: s[0] is a read-only byte. Build a new string, or convert to []byte, edit it and convert back.",
          "Los strings son inmutables: s[0] es un byte de solo lectura. Crea otro string o pasa a []byte, edita y vuelve.",
          "文字列は変更できない。s[0] は読み取り専用。新しい文字列を作るか []byte に変えて編集しよう。",
        ),
        check: { compiles: false },
      },
      // slices
      {
        topic: "slices", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("a := []int{1, 2, 3}", "b := a", "b[0] = 9", "fmt.Println(a[0], b[0])"),
        options: ["1 9", "9 9", "1 1"], answer: 1,
        explain: L(
          "A slice is a small header pointing at a backing array. b := a copies the header, so both share the same array.",
          "Un slice es una cabecera que apunta a un array. b := a copia la cabecera: ambos comparten el mismo array.",
          "スライスは配列を指す小さなヘッダー。b := a はヘッダーのコピーなので同じ配列を共有する。",
        ),
        check: { compiles: true, stdout: "9 9" },
      },
      {
        topic: "slices", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("a := [3]int{1, 2, 3}", "b := a", "b[0] = 9", "fmt.Println(a[0], b[0])"),
        options: ["1 9", "9 9", "1 1"], answer: 0,
        explain: L(
          "Arrays are values: b := a copies all three elements. Changing b leaves a alone. Slices, unlike arrays, share data.",
          "Los arrays son valores: b := a copia los tres elementos. Cambiar b no toca a. Los slices, en cambio, comparten datos.",
          "配列は値なので b := a で3要素すべてコピーされる。b を変えても a はそのまま。",
        ),
        check: { compiles: true, stdout: "1 9" },
      },
      {
        topic: "slices", difficulty: 2, kind: "pick", prompt: L("Add 3 to the slice", "Agrega 3 al slice", "スライスに 3 を追加"),
        code: code("s := []int{1, 2}", "___", "fmt.Println(s)"),
        options: ["s = append(s, 3)", "append(s, 3)", "s.append(3)"], answer: 0,
        explain: L(
          "append returns the new slice, which may use a new array. Its result must be used: always write s = append(s, x).",
          "append devuelve el slice nuevo, que puede usar otro array. Hay que usar su resultado: escribe s = append(s, x).",
          "append は新しいスライスを返す（配列が変わることも）。結果は必ず使う：s = append(s, x)。",
        ),
        check: { compiles: true, stdout: "[1 2 3]", wrongFail: true },
      },
      {
        topic: "slices", difficulty: 1, kind: "type", prompt: L("Create a slice: len 0, cap 4", "Crea un slice: len 0, cap 4", "len 0・cap 4 のスライス"),
        code: code("s := ___([]int, 0, 4)", "fmt.Println(len(s), cap(s))"),
        answer: "make",
        explain: L(
          "make([]T, len, cap) allocates a slice with room to grow. Preallocating the capacity avoids reallocations.",
          "make([]T, len, cap) crea un slice con espacio para crecer. Reservar la capacidad evita realocaciones.",
          "make([]T, len, cap) は伸びる余地のあるスライスを作る。容量の事前確保で再確保を防げる。",
        ),
        check: { compiles: true, stdout: "0 4" },
      },
      // maps
      {
        topic: "maps", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("var m map[string]int", 'm["x"] = 1', "fmt.Println(m)"),
        options: ["map[x:1]", L("panic: assignment to entry in nil map", "panic: assignment to entry in nil map", "panic: assignment to entry in nil map"), L("Compile error", "Error de compilación", "コンパイルエラー")], answer: 1,
        explain: L(
          "The zero value of a map is nil. Reading a nil map is fine, but writing panics. Create it with make or a literal.",
          "El valor cero de un mapa es nil. Leer un mapa nil está bien, pero escribir hace panic. Créalo con make o un literal.",
          "マップのゼロ値は nil。読むのは平気だが書くと panic。make かリテラルで作ろう。",
        ),
        check: { compiles: true, throws: "assignment to entry in nil map" },
      },
      {
        topic: "maps", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code('m := map[string]int{"a": 0}', 'v, ok := m["a"]', 'w, ok2 := m["zzz"]', "fmt.Println(v, ok, w, ok2)"),
        options: ["0 true 0 false", "0 true 0 true", "0 false 0 false"], answer: 0,
        explain: L(
          "A missing key returns the zero value, so v and w are both 0. The comma-ok form tells you whether the key exists.",
          "Una clave ausente devuelve el valor cero: v y w valen 0. La forma coma-ok te dice si la clave existe.",
          "ないキーはゼロ値を返すので v も w も 0。カンマ ok 形式でキーの有無がわかる。",
        ),
        check: { compiles: true, stdout: "0 true 0 false" },
      },
      {
        topic: "maps", difficulty: 1, kind: "type", prompt: L("Remove the key \"a\"", "Quita la clave \"a\"", "キー \"a\" を削除"),
        code: code('m := map[string]int{"a": 1, "b": 2}', '___(m, "a")', "fmt.Println(len(m), m)"),
        answer: "delete",
        explain: L(
          "The built-in delete(m, key) removes an entry. It is a no-op if the key is missing (or the map is nil).",
          "La función nativa delete(m, clave) borra una entrada. No hace nada si la clave no existe (o el mapa es nil).",
          "組み込みの delete(m, key) で要素を消す。キーがなくても（nil マップでも）何も起きない。",
        ),
        check: { compiles: true, stdout: "1 map[b:2]" },
      },
      {
        topic: "maps", difficulty: 1, kind: "pick", prompt: L("Create a usable map", "Crea un mapa usable", "使えるマップを作る"),
        code: code("m := ___", 'm["hp"] = 10', 'fmt.Println(m["hp"])'),
        options: ["make(map[string]int)", "map[string]int", "new(map[string]int)"], answer: 0,
        explain: L(
          "make(map[K]V) builds a ready map. map[string]int alone is a type, not a value; new gives a pointer to a nil map.",
          "make(map[K]V) crea un mapa listo. map[string]int solo es un tipo, no un valor; new da un puntero a un mapa nil.",
          "make(map[K]V) ですぐ使えるマップができる。map[string]int は型、new は nil マップへのポインタ。",
        ),
        check: { compiles: true, stdout: "10", wrongFail: true },
      },
      // defer_panic
      {
        topic: "defer_panic", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("for i := 0; i < 3; i++ {", '\tdefer fmt.Print(i, " ")', "}"),
        options: ["0 1 2", "2 1 0", "3 3 3"], answer: 1,
        explain: L(
          "Deferred calls run when the function returns, last in first out. Arguments are evaluated at the defer line.",
          "Las llamadas diferidas corren al volver la función, la última primero. Los argumentos se evalúan en la línea del defer.",
          "defer の呼び出しは関数の終了時に後入れ先出しで動く。引数は defer の行で評価される。",
        ),
        check: { compiles: true, stdout: "2 1 0" },
      },
      {
        topic: "defer_panic", difficulty: 1, kind: "pick", prompt: L("Run the line when main returns", "Ejecuta la línea al volver main", "main の終了時に実行する"),
        code: code('___ fmt.Println("closing")', 'fmt.Println("working")'),
        options: ["defer", "go", "return"], answer: 0,
        explain: L(
          "defer schedules a call for when the function returns: ideal for Close and Unlock. go starts a goroutine instead.",
          "defer programa una llamada para cuando la función vuelve: ideal para Close y Unlock. go lanza una goroutine.",
          "defer は関数の終了時に呼び出しを予約する。Close や Unlock に最適。go は goroutine を起動する。",
        ),
        check: { compiles: true, stdout: "working\nclosing" },
      },
      // errors
      {
        topic: "errors", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code('n, err := strconv.Atoi("12a")', "fmt.Println(n, err != nil)"),
        options: ["12 false", "0 true", "12 true"], answer: 1,
        explain: L(
          "Go returns errors as values instead of throwing. On failure Atoi returns 0 and a non-nil error you must check.",
          "Go devuelve los errores como valores en vez de lanzarlos. Si falla, Atoi da 0 y un error no nil que debes revisar.",
          "Go は例外でなく値としてエラーを返す。失敗すると Atoi は 0 と nil でない err を返す。",
        ),
        check: { compiles: true, stdout: "0 true" },
      },
      {
        topic: "errors", difficulty: 1, kind: "order", prompt: L("Parse, handle the error, then use n", "Convierte, maneja el error y usa n", "変換→エラー処理→n を使う"),
        lines: ['n, err := strconv.Atoi("42")', "if err != nil {", '\tfmt.Println("bad input")', "\treturn", "}", "fmt.Println(n * 2)"],
        explain: L(
          "The idiom: call, check if err != nil right away and return early, then continue on the happy path.",
          "El idioma: llama, revisa if err != nil enseguida y vuelve antes; luego sigue por el camino feliz.",
          "定番：呼んだらすぐ if err != nil を確認して早期 return、その後に正常処理。",
        ),
        check: { compiles: true, stdout: "84" },
      },
    ],
  },

  // ─── MID ──────────────────────────────────────────────────────────────────
  {
    slug: "mid",
    level: "mid",
    title: L("Mid-level Go Developer", "Go Developer Semi Senior", "中級 Go 開発者"),
    description: L(
      "Technical screen for a mid-level Go backend role: slices, methods, interfaces, errors, generics, concurrency, tests.",
      "Filtro técnico para backend Go semi senior: slices, métodos, interfaces, errores, genéricos, concurrencia y tests.",
      "中級 Go バックエンド職の技術面接：スライス、メソッド、interface、エラー、ジェネリクス、並行処理、テスト。",
    ),
    count: 14,
    passPct: 70,
    secondsPerQuestion: 40,
    codeCount: 2,
    questions: [
      dedupeTask,
      stackTask,
      topKTask,
      withdrawTask,
      // slices
      {
        topic: "slices", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("a := []int{1, 2, 3, 4}", "s := a[:2]", "s = append(s, 99)", "fmt.Println(a)"),
        options: ["[1 2 3 4]", "[1 2 99 4]", "[1 2 99 3 4]"], answer: 1,
        explain: L(
          "s has len 2 but cap 4, so append writes into the shared backing array and overwrites a[2].",
          "s tiene len 2 pero cap 4, así que append escribe en el array compartido y pisa a[2].",
          "s は len 2・cap 4 なので、append は共有の配列に書きこみ a[2] を上書きする。",
        ),
        check: { compiles: true, stdout: "[1 2 99 4]" },
      },
      {
        topic: "slices", difficulty: 3, kind: "pick", prompt: L("Keep a unchanged by the append", "Que append no cambie a", "append で a を変えない"),
        code: code("a := []int{1, 2, 3, 4}", "s := ___", "s = append(s, 99)", "fmt.Println(a, s)"),
        options: ["a[:2:2]", "a[:2]", "a[0:2]"], answer: 0,
        explain: L(
          "The full slice expression a[lo:hi:max] caps the capacity at 2, so append must copy to a new array. a[:2] keeps cap 4.",
          "La expresión completa a[lo:hi:max] limita la capacidad a 2 y append debe copiar a otro array. a[:2] conserva cap 4.",
          "a[lo:hi:max] で容量を 2 に制限すると append は新しい配列にコピーする。a[:2] は cap 4 のまま。",
        ),
        check: { compiles: true, stdout: "[1 2 3 4] [1 2 99]" },
      },
      // structs
      {
        topic: "structs", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "type Counter struct{ n int }",
          "",
          "func (c Counter) IncV()  { c.n++ }",
          "func (c *Counter) IncP() { c.n++ }",
          "",
          "func main() {",
          "\tvar c Counter",
          "\tc.IncV()",
          "\ta := c.n",
          "\tc.IncP()",
          "\tfmt.Println(a, c.n)",
          "}",
        ),
        options: ["0 1", "1 2", "0 0"], answer: 0,
        explain: L(
          "A value receiver gets a copy, so IncV changes nothing. A pointer receiver modifies the caller's struct.",
          "Un receptor por valor recibe una copia: IncV no cambia nada. Un receptor puntero modifica el struct original.",
          "値レシーバはコピーを受け取るので IncV は何も変えない。ポインタレシーバは元の構造体を変える。",
        ),
        check: { compiles: true, stdout: "0 1" },
      },
      {
        topic: "structs", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("type Point struct{ X, Y int }", 'm := map[string]Point{"p": {1, 2}}', 'm["p"].X = 5', "fmt.Println(m)"),
        options: [YN[0], L("No: map values are not addressable", "No: los valores del mapa no son direccionables", "いいえ：マップの値はアドレス不可")], answer: 1,
        explain: L(
          "m[\"p\"] returns a copy, so you cannot assign to its field. Copy it out, change it and store it, or use map[string]*Point.",
          "m[\"p\"] devuelve una copia y no puedes asignar a su campo. Sácalo, cámbialo y guárdalo, o usa map[string]*Point.",
          "m[\"p\"] はコピーなのでフィールドに代入できない。取り出して変えて戻すか *Point を使おう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "structs", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "type Animal struct{ Name string }",
          "",
          'func (a Animal) Hello() string { return "I am " + a.Name }',
          "",
          "type Dog struct {",
          "\tAnimal",
          "\tBreed string",
          "}",
          "",
          "func main() {",
          '\td := Dog{Animal{"Rex"}, "pug"}',
          "\tfmt.Println(d.Hello(), d.Name)",
          "}",
        ),
        options: ["I am Rex Rex", "I am pug Rex", L("Compile error: Dog has no Hello", "Error: Dog no tiene Hello", "エラー：Dog に Hello がない")], answer: 0,
        explain: L(
          "Embedding promotes the fields and methods of Animal to Dog. It is composition, not inheritance: Hello still sees an Animal.",
          "El embedding promueve los campos y métodos de Animal a Dog. Es composición, no herencia: Hello sigue viendo un Animal.",
          "埋め込みで Animal のフィールドとメソッドが Dog に昇格する。継承ではなく合成。",
        ),
        check: { compiles: true, stdout: "I am Rex Rex" },
      },
      // interfaces
      {
        topic: "interfaces", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "type MyErr struct{}",
          "",
          'func (*MyErr) Error() string { return "boom" }',
          "",
          "func check() error {",
          "\tvar p *MyErr",
          "\treturn p",
          "}",
          "",
          "func main() {",
          "\tfmt.Println(check() == nil)",
          "}",
        ),
        options: ["true", "false", L("panic: nil pointer", "panic: puntero nil", "panic: nil ポインタ")], answer: 1,
        explain: L(
          "An interface is nil only if both its type and value are nil. Here it holds type *MyErr with a nil value. Return nil directly.",
          "Una interface es nil solo si su tipo y su valor son nil. Aquí tiene tipo *MyErr con valor nil. Devuelve nil directamente.",
          "interface が nil なのは型も値も nil のときだけ。ここは型 *MyErr を持つ。nil を直接返そう。",
        ),
        check: { compiles: true, stdout: "false" },
      },
      {
        topic: "interfaces", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code(
          "type Speaker interface{ Speak() string }",
          "type Duck struct{}",
          "",
          'func (d *Duck) Speak() string { return "quack" }',
          "",
          "func main() {",
          "\tvar s Speaker = Duck{}",
          "\tfmt.Println(s.Speak())",
          "}",
        ),
        options: [YN[0], L("No: Speak has a pointer receiver", "No: Speak tiene receptor puntero", "いいえ：Speak はポインタレシーバ")], answer: 1,
        explain: L(
          "The method set of Duck excludes pointer-receiver methods, so only *Duck implements Speaker. Use &Duck{}.",
          "El conjunto de métodos de Duck no incluye los de receptor puntero: solo *Duck implementa Speaker. Usa &Duck{}.",
          "Duck のメソッド集合にポインタレシーバのメソッドは入らない。*Duck だけが実装する。&Duck{} を使おう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "interfaces", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code('var x any = "hi"', "n := x.(int)", "fmt.Println(n)"),
        options: [L("Prints 0", "Imprime 0", "0 と表示"), L("panic: interface conversion", "panic: interface conversion", "panic: interface conversion"), L("Compile error", "Error de compilación", "コンパイルエラー")], answer: 1,
        explain: L(
          "A single-value type assertion panics if the type is wrong. Use n, ok := x.(int) to test safely.",
          "Una aserción de tipo de un solo valor hace panic si el tipo no coincide. Usa n, ok := x.(int) para probar seguro.",
          "1値の型アサーションは型が違うと panic。安全に試すなら n, ok := x.(int)。",
        ),
        check: { compiles: true, throws: "interface conversion: interface {} is string, not int" },
      },
      {
        topic: "interfaces", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "describe := func(v any) string {",
          "\tswitch t := v.(type) {",
          "\tcase int:",
          '\t\treturn fmt.Sprint("int ", t)',
          "\tcase string:",
          '\t\treturn "string " + t',
          "\tdefault:",
          '\t\treturn "other"',
          "\t}",
          "}",
          "fmt.Println(describe(7), describe(2.5))",
        ),
        options: ["int 7 other", "int 7 int 2", "int 7 string 2.5"], answer: 0,
        explain: L(
          "A type switch picks the case matching the dynamic type. 2.5 is a float64, which no case lists, so default runs.",
          "Un type switch elige el case del tipo dinámico. 2.5 es float64, que ningún case nombra, así que corre default.",
          "型 switch は動的な型の case を選ぶ。2.5 は float64 でどの case にもないので default。",
        ),
        check: { compiles: true, stdout: "int 7 other" },
      },
      // errors
      {
        topic: "errors", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code('ErrNotFound := errors.New("not found")', 'err := fmt.Errorf("load user: %w", ErrNotFound)', "fmt.Println(err == ErrNotFound, errors.Is(err, ErrNotFound))"),
        options: ["true true", "false true", "false false"], answer: 1,
        explain: L(
          "%w wraps the error in a new one, so == fails. errors.Is walks the wrap chain and finds the sentinel.",
          "%w envuelve el error en uno nuevo, así que == falla. errors.Is recorre la cadena y encuentra el centinela.",
          "%w は新しいエラーで包むので == は false。errors.Is は包みをたどって見つける。",
        ),
        check: { compiles: true, stdout: "false true" },
      },
      {
        topic: "errors", difficulty: 2, kind: "type", prompt: L("Wrap so errors.Is still matches", "Envuelve para que errors.Is coincida", "errors.Is が通るように包む"),
        code: code('base := errors.New("timeout")', 'err := fmt.Errorf("svc: ___", base)', "fmt.Println(errors.Is(err, base))"),
        answer: "%w",
        explain: L(
          "%w keeps the original error inside (Unwrap). %v only copies its text, so errors.Is would return false.",
          "%w guarda el error original adentro (Unwrap). %v solo copia el texto y errors.Is daría false.",
          "%w は元のエラーを中に保つ（Unwrap）。%v は文字だけなので errors.Is は false になる。",
        ),
        check: { compiles: true, stdout: "true" },
      },
      {
        topic: "errors", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "type CodeErr struct{ Code int }",
          "",
          'func (e *CodeErr) Error() string { return fmt.Sprint("code ", e.Code) }',
          "",
          "func main() {",
          '\terr := fmt.Errorf("handler: %w", &CodeErr{404})',
          "\tvar ce *CodeErr",
          "\tif errors.As(err, &ce) {",
          "\t\tfmt.Println(ce.Code, err)",
          "\t}",
          "}",
        ),
        options: ["404 handler: code 404", "404 code 404", L("Nothing: As fails", "Nada: As falla", "何も出ない：As が失敗")], answer: 0,
        explain: L(
          "errors.As finds the first error in the chain of the target's type and assigns it. err itself still prints with its prefix.",
          "errors.As busca en la cadena el primer error del tipo del destino y lo asigna. err sigue imprimiéndose con su prefijo.",
          "errors.As は包みの中から目的の型を探して代入する。err 自体は接頭辞つきで表示される。",
        ),
        check: { compiles: true, stdout: "404 handler: code 404" },
      },
      {
        topic: "errors", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          'func get() (int, error) { return 0, errors.New("nope") }',
          "",
          "func main() {",
          "\tvar err error",
          "\tif true {",
          "\t\tn, err := get()",
          "\t\t_, _ = n, err",
          "\t}",
          "\tfmt.Println(err == nil)",
          "}",
        ),
        options: ["true", "false", "nope"], answer: 0,
        explain: L(
          "Inside the block, := declares a new err that shadows the outer one, so the outer err stays nil. Use = to assign.",
          "Dentro del bloque, := declara un err nuevo que oculta al de afuera, que sigue nil. Usa = para asignar.",
          "ブロック内の := は外側を隠す新しい err を作るので、外側は nil のまま。代入は = で。",
        ),
        check: { compiles: true, stdout: "true" },
      },
      // defer_panic
      {
        topic: "defer_panic", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("x := 1", "defer fmt.Println(x)", "x = 2", 'fmt.Print(x, " ")'),
        options: ["2 1", "2 2", "1 2"], answer: 0,
        explain: L(
          "The deferred call's arguments are evaluated at the defer line, when x is still 1. The call itself runs at return.",
          "Los argumentos del defer se evalúan en su línea, cuando x aún vale 1. La llamada corre al volver.",
          "defer の引数はその行で評価される（x はまだ 1）。呼び出し自体は関数の終了時。",
        ),
        check: { compiles: true, stdout: "2 1" },
      },
      {
        topic: "defer_panic", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "func safeDiv(a, b int) (res int, err error) {",
          "\tdefer func() {",
          "\t\tif r := recover(); r != nil {",
          '\t\t\terr = fmt.Errorf("recovered: %v", r)',
          "\t\t}",
          "\t}()",
          "\treturn a / b, nil",
          "}",
          "",
          "func main() { fmt.Println(safeDiv(1, 0)) }",
        ),
        options: ["0 recovered: runtime error: integer divide by zero", "0 <nil>", L("The program crashes", "El programa se cae", "プログラムが落ちる")], answer: 0,
        explain: L(
          "recover works inside a deferred function. Because the result err is named, the defer can set it after the panic.",
          "recover funciona dentro de una función diferida. Como err es un resultado con nombre, el defer lo asigna tras el panic.",
          "recover は defer 内で効く。戻り値 err に名前があるので、panic 後に defer が設定できる。",
        ),
        check: { compiles: true, stdout: "0 recovered: runtime error: integer divide by zero" },
      },
      // generics
      {
        topic: "generics", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("func Add[T any](a, b T) T { return a + b }", "", "func main() {", "\tfmt.Println(Add(1, 2))", "}"),
        options: [L("Yes, prints 3", "Sí, imprime 3", "はい、3 と表示"), L("No: + is not defined for any", "No: + no existe para any", "いいえ：any に + はない")], answer: 1,
        explain: L(
          "A constraint lists what T can do. any allows no operators, so + fails. Use a union like ~int | ~float64 or cmp.Ordered.",
          "La restricción dice qué puede hacer T. any no permite operadores y + falla. Usa una unión como ~int | ~float64.",
          "制約は T にできることを決める。any では + が使えない。~int | ~float64 などを使おう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "generics", difficulty: 2, kind: "pick", prompt: L("Which constraint allows a > b?", "¿Qué restricción permite a > b?", "a > b を許す制約は？"),
        code: code(...MAX_GENERIC("___")),
        options: ["cmp.Ordered", "comparable", "any"], answer: 0,
        explain: L(
          "cmp.Ordered allows < and >. comparable only allows == and !=, and any allows no operators at all.",
          "cmp.Ordered permite < y >. comparable solo permite == y !=, y any no permite ningún operador.",
          "cmp.Ordered は < と > を許す。comparable は == と != だけ、any は演算子なし。",
        ),
        check: { compiles: true, stdout: "7 b", program: goFile(["cmp", "fmt"], ...MAX_GENERIC("cmp.Ordered")) },
      },
      // goroutines
      {
        topic: "goroutines", difficulty: 2, kind: "order", prompt: L("Wait for the goroutine to finish", "Espera a que la goroutine termine", "goroutine の終了を待つ"),
        lines: ["var wg sync.WaitGroup", "wg.Add(1)", "go func() {", '\tfmt.Println("work")', "\twg.Done()", "}()", "wg.Wait()", 'fmt.Println("done")'],
        explain: L(
          "Call Add before starting the goroutine, Done when its work ends, and Wait to block until the counter is zero.",
          "Llama a Add antes de lanzar la goroutine, a Done al terminar su trabajo y a Wait para esperar a que el contador sea cero.",
          "goroutine を起動する前に Add、仕事の後に Done、Wait でカウンタが 0 になるまで待つ。",
        ),
        check: { compiles: true, stdout: "work\ndone" },
      },
      {
        topic: "goroutines", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "var wg sync.WaitGroup",
          "results := make([]int, 3)",
          "for i := range 3 {",
          "\twg.Add(1)",
          "\tgo func() {",
          "\t\tdefer wg.Done()",
          "\t\tresults[i] = i * i",
          "\t}()",
          "}",
          "wg.Wait()",
          "fmt.Println(results)",
        ),
        options: ["[0 1 4]", "[0 0 0]", "[4 4 4]"], answer: 0,
        explain: L(
          "Since Go 1.22 each iteration has its own i. Each goroutine writes a different index, so there is no race, and Wait orders it.",
          "Desde Go 1.22 cada iteración tiene su propia i. Cada goroutine escribe otro índice: no hay race, y Wait ordena.",
          "Go 1.22 以降、i は反復ごとに別。各 goroutine は別の添字に書くので競合はなく、Wait で揃う。",
        ),
        check: { compiles: true, stdout: "[0 1 4]" },
      },
      // channels
      {
        topic: "channels", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("ch := make(chan int)", "ch <- 1", "fmt.Println(<-ch)"),
        options: [L("Prints 1", "Imprime 1", "1 と表示"), DEADLOCK, L("Prints 0", "Imprime 0", "0 と表示")], answer: 1,
        explain: L(
          "An unbuffered send blocks until someone receives. Nobody else runs, so the runtime aborts: all goroutines are asleep.",
          "Un envío sin buffer bloquea hasta que alguien recibe. No hay nadie más y el runtime aborta: all goroutines are asleep.",
          "バッファなしの送信は受信者が来るまで止まる。誰もいないのでランタイムが停止する。",
        ),
        check: { compiles: true, throws: "all goroutines are asleep" },
      },
      {
        topic: "channels", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("ch := make(chan int, 1)", "ch <- 7", "close(ch)", "a, ok1 := <-ch", "b, ok2 := <-ch", "fmt.Println(a, ok1, b, ok2)"),
        options: ["7 true 0 false", "7 true 7 false", "7 false 0 false"], answer: 0,
        explain: L(
          "A closed channel still delivers buffered values. Once empty, receives return the zero value with ok == false.",
          "Un canal cerrado aún entrega lo que tiene en buffer. Ya vacío, recibir da el valor cero con ok == false.",
          "閉じたチャネルもバッファの値は渡す。空になると受信はゼロ値と ok == false を返す。",
        ),
        check: { compiles: true, stdout: "7 true 0 false" },
      },
      {
        topic: "channels", difficulty: 1, kind: "type", prompt: L("Buffer size so both sends fit", "Tamaño de buffer para ambos envíos", "2回の送信が入るバッファ"),
        code: code("ch := make(chan int, ___)", "ch <- 1", "ch <- 2", "fmt.Println(<-ch, <-ch)"),
        answer: "2",
        explain: L(
          "A buffered channel holds up to its capacity without a receiver. With 2 slots both sends succeed; values come out FIFO.",
          "Un canal con buffer guarda hasta su capacidad sin receptor. Con 2 lugares ambos envíos pasan; salen en orden FIFO.",
          "バッファ付きチャネルは容量まで受信者なしで入る。2 なら両方入り、先入れ先出しで出る。",
        ),
        check: { compiles: true, stdout: "1 2" },
      },
      // testing
      {
        topic: "testing", difficulty: 2, kind: "predict", prompt: L("Which failure does go test report?", "¿Qué fallo reporta go test?", "go test が報告する失敗は？"),
        code: code(...ABS_TEST),
        options: ["Abs(-3) = -3, want 3", "Abs(2) = 2, want 2", L("None: PASS", "Ninguno: PASS", "なし：PASS")], answer: 0,
        explain: L(
          "A table-driven test loops over cases. Only {-3, 3} fails, and t.Errorf reports it and keeps going (t.Fatalf would stop).",
          "Un test de tabla recorre casos. Solo {-3, 3} falla; t.Errorf lo reporta y sigue (t.Fatalf se detendría).",
          "テーブル駆動テストはケースを回す。失敗は {-3, 3} だけ。t.Errorf は報告して続行する。",
        ),
        check: { compiles: true, stdout: "=== RUN   TestAbs\n    prog_test.go:13: Abs(-3) = -3, want 3\n--- FAIL: TestAbs (0.00s)\nFAIL", program: goFile(["testing"], ...ABS_TEST) },
      },
      {
        topic: "testing", difficulty: 2, kind: "pick", prompt: L("Run each case as a named subtest", "Corre cada caso como subtest", "各ケースを名前付きサブテストに"),
        code: code(...UPPER_TEST("___")),
        options: ["Run", "Go", "Parallel"], answer: 0,
        explain: L(
          "t.Run(name, func) starts a subtest reported as TestUpper/lower, which you can rerun alone with go test -run.",
          "t.Run(nombre, func) crea un subtest reportado como TestUpper/lower, que puedes repetir solo con go test -run.",
          "t.Run(name, func) はサブテストを作り TestUpper/lower と表示される。go test -run で単独実行できる。",
        ),
        check: { compiles: true, stdout: "=== RUN   TestUpper\n=== RUN   TestUpper/lower\n--- PASS: TestUpper (0.00s)\n    --- PASS: TestUpper/lower (0.00s)\nPASS", program: goFile(["strings", "testing"], ...UPPER_TEST("Run")) },
      },
    ],
  },

  // ─── SENIOR ───────────────────────────────────────────────────────────────
  {
    slug: "senior",
    level: "senior",
    title: L("Senior Go Developer", "Go Developer Senior", "シニア Go 開発者"),
    description: L(
      "Senior Go backend interview: channels, sync, context, runtime and memory, error design, generics, tooling.",
      "Entrevista senior de backend Go: canales, sync, context, runtime y memoria, diseño de errores, genéricos y tooling.",
      "シニア Go バックエンド面接：チャネル、sync、context、ランタイムとメモリ、エラー設計、ジェネリクス。",
    ),
    count: 15,
    passPct: 75,
    secondsPerQuestion: 50,
    codeCount: 2,
    questions: [
      parallelMapTask,
      mergeIntervalsTask,
      pipelineTask,
      parseKVTask,
      // interfaces
      {
        topic: "interfaces", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code("var a any = []int{1}", "fmt.Println(a == a)"),
        options: ["true", L("Compile error", "Error de compilación", "コンパイルエラー"), L("panic: comparing uncomparable type", "panic: comparing uncomparable type", "panic: comparing uncomparable type")], answer: 2,
        explain: L(
          "Interfaces compile with ==, but comparing them compares dynamic values. Slices are not comparable, so it panics at runtime.",
          "Las interfaces compilan con ==, pero comparan valores dinámicos. Los slices no son comparables: panic en ejecución.",
          "interface の == はコンパイルできるが、動的な値を比べる。スライスは比較不可なので実行時 panic。",
        ),
        check: { compiles: true, throws: "comparing uncomparable type []int" },
      },
      {
        topic: "interfaces", difficulty: 3, kind: "pick", prompt: L("Assert at compile time: *Square is a Shape", "Asegura al compilar: *Square es Shape", "*Square が Shape か静的に確認"),
        code: code(
          "type Shape interface{ Area() int }",
          "type Square struct{ s int }",
          "",
          "func (q *Square) Area() int { return q.s * q.s }",
          "",
          "var _ Shape = ___",
          "",
          "func main() { fmt.Println((&Square{3}).Area()) }",
        ),
        options: ["(*Square)(nil)", "Square{}", "Shape(nil).(Square)"], answer: 0,
        explain: L(
          "var _ Shape = (*Square)(nil) costs nothing at runtime and breaks the build if *Square stops implementing Shape.",
          "var _ Shape = (*Square)(nil) no cuesta nada en ejecución y rompe el build si *Square deja de implementar Shape.",
          "var _ Shape = (*Square)(nil) は実行コストなしで、実装が崩れるとビルドが失敗する。",
        ),
        check: { compiles: true, stdout: "9", wrongFail: true },
      },
      // errors
      {
        topic: "errors", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code('ErrA := errors.New("a")', 'ErrB := errors.New("b")', "err := errors.Join(ErrA, ErrB)", 'fmt.Printf("%v %q\\n", errors.Is(err, ErrB), err.Error())'),
        options: ['true "a\\nb"', 'false "a\\nb"', 'true "a; b"'], answer: 0,
        explain: L(
          "errors.Join keeps every error, so errors.Is matches any of them. Its message joins the parts with newlines.",
          "errors.Join conserva todos los errores, y errors.Is coincide con cualquiera. Su mensaje une las partes con saltos de línea.",
          "errors.Join は全エラーを保つので errors.Is はどれにも一致。メッセージは改行でつながる。",
        ),
        check: { compiles: true, stdout: 'true "a\\nb"' },
      },
      {
        topic: "errors", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code('e1 := errors.New("disk")', 'e2 := errors.New("net")', 'err := fmt.Errorf("sync: %w, %w", e1, e2)', "fmt.Println(errors.Is(err, e1), errors.Is(err, e2), err)"),
        options: ["true true sync: disk, net", "true false sync: disk, net", L("Compile error: one %w only", "Error: un solo %w", "エラー：%w は1つだけ")], answer: 0,
        explain: L(
          "Since Go 1.20 Errorf accepts several %w verbs; the result unwraps to all of them, so errors.Is finds both.",
          "Desde Go 1.20 Errorf acepta varios %w; el resultado desenvuelve a todos, así que errors.Is encuentra ambos.",
          "Go 1.20 から Errorf は複数の %w を受け付ける。両方に Unwrap できるので両方 true。",
        ),
        check: { compiles: true, stdout: "true true sync: disk, net" },
      },
      // generics
      {
        topic: "generics", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code(
          "type Celsius float64",
          "",
          "func Double[T float64](x T) T { return x * 2 }",
          "",
          "func main() {",
          "\tfmt.Println(Double(Celsius(1.5)))",
          "}",
        ),
        options: [L("Yes, prints 3", "Sí, imprime 3", "はい、3 と表示"), L("No: Celsius does not satisfy float64", "No: Celsius no cumple float64", "いいえ：Celsius は float64 を満たさない")], answer: 1,
        explain: L(
          "The constraint float64 means exactly float64. Celsius is a new named type; write ~float64 to accept any type built on it.",
          "La restricción float64 significa exactamente float64. Celsius es otro tipo; escribe ~float64 para aceptar tipos basados en él.",
          "制約 float64 は float64 そのものだけ。Celsius は別の型。~float64 なら基底型で受け付ける。",
        ),
        check: { compiles: false },
      },
      {
        topic: "generics", difficulty: 2, kind: "type", prompt: L("Accept every type based on float64", "Acepta todo tipo basado en float64", "float64 が基底の型を全部許す"),
        code: code(
          "type Celsius float64",
          "",
          "func Double[T ___](x T) T { return x * 2 }",
          "",
          "func main() {",
          "\tfmt.Println(Double(Celsius(1.5)))",
          "}",
        ),
        answer: "~float64",
        explain: L(
          "~float64 is the set of all types whose underlying type is float64, so named types like Celsius satisfy it.",
          "~float64 es el conjunto de tipos cuyo tipo subyacente es float64, así que tipos con nombre como Celsius lo cumplen.",
          "~float64 は基底型が float64 の型すべて。Celsius のような名前付き型も満たす。",
        ),
        check: { compiles: true, stdout: "3" },
      },
      // goroutines
      {
        topic: "goroutines", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code(
          "func work(wg sync.WaitGroup) {",
          "\tdefer wg.Done()",
          "}",
          "",
          "func main() {",
          "\tvar wg sync.WaitGroup",
          "\twg.Add(1)",
          "\tgo work(wg)",
          "\twg.Wait()",
          '\tfmt.Println("done")',
          "}",
        ),
        options: [L("Prints done", "Imprime done", "done と表示"), DEADLOCK, L("Compile error", "Error de compilación", "コンパイルエラー")], answer: 1,
        explain: L(
          "wg is passed by value, so Done decrements a copy and Wait blocks forever. Pass *sync.WaitGroup (go vet flags the copy).",
          "wg se pasa por valor: Done resta en una copia y Wait espera para siempre. Pasa *sync.WaitGroup (go vet avisa).",
          "wg を値渡しすると Done はコピーを減らし Wait は永遠に待つ。*sync.WaitGroup を渡そう。",
        ),
        check: { compiles: true, throws: "all goroutines are asleep" },
      },
      {
        topic: "goroutines", difficulty: 2, kind: "pick", prompt: L("Typical initial goroutine stack?", "¿Pila inicial típica de una goroutine?", "goroutine の初期スタックは？"),
        code: "go handle(conn) // one per connection: ___",
        options: [L("A few KB, grows as needed", "Unos pocos KB, crece si hace falta", "数KBで、必要に応じて伸びる"), L("1 MB, fixed", "1 MB, fija", "1MB 固定"), L("Same as an OS thread", "Igual que un hilo del SO", "OS スレッドと同じ")], answer: 0,
        explain: L(
          "Goroutines start with a small stack (a few KB) that the runtime grows and shrinks, and are multiplexed onto OS threads.",
          "Las goroutines empiezan con una pila chica (unos KB) que el runtime agranda o achica, y se reparten sobre hilos del SO.",
          "goroutine は数KBの小さなスタックで始まり、ランタイムが伸縮させる。OS スレッドに多重化される。",
        ),
      },
      {
        topic: "goroutines", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "var wg sync.WaitGroup",
          "var mu sync.Mutex",
          "total := 0",
          "for i := range 4 {",
          "\twg.Go(func() {",
          "\t\tmu.Lock()",
          "\t\tdefer mu.Unlock()",
          "\t\ttotal += i",
          "\t})",
          "}",
          "wg.Wait()",
          "fmt.Println(total)",
        ),
        options: ["6", "0", L("It varies: data race", "Varía: data race", "毎回変わる：データ競合")], answer: 0,
        explain: L(
          "wg.Go (Go 1.25) does Add, go and Done for you. The mutex serializes the writes and Wait orders them: 0+1+2+3 = 6.",
          "wg.Go (Go 1.25) hace Add, go y Done por ti. El mutex serializa las escrituras y Wait las ordena: 0+1+2+3 = 6.",
          "wg.Go（Go 1.25）は Add・go・Done をまとめて行う。mutex と Wait で 0+1+2+3 = 6。",
        ),
        check: { compiles: true, stdout: "6" },
      },
      // channels
      {
        topic: "channels", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code("ch := make(chan int)", "go func() {", "\tch <- 1", "\tch <- 2", "}()", "for v := range ch {", "\tfmt.Println(v)", "}"),
        options: [L("Prints 1 and 2, then exits", "Imprime 1 y 2 y termina", "1 と 2 を表示して終了"), L("Prints 1 and 2, then deadlock", "Imprime 1 y 2 y luego deadlock", "1 と 2 の後にデッドロック"), L("Deadlock before any output", "Deadlock antes de imprimir", "何も出ずにデッドロック")], answer: 1,
        explain: L(
          "range over a channel stops only when it is closed. The sender never calls close(ch), so the loop waits forever.",
          "range sobre un canal solo termina cuando se cierra. El emisor nunca llama a close(ch) y el bucle espera para siempre.",
          "チャネルの range は close されるまで終わらない。送信側が close(ch) しないので永遠に待つ。",
        ),
        check: { compiles: true, throws: "all goroutines are asleep" },
      },
      {
        topic: "channels", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("var a chan int", "b := make(chan int, 1)", "b <- 2", "select {", "case v := <-a:", '\tfmt.Println("a", v)', "case v := <-b:", '\tfmt.Println("b", v)', "}"),
        options: ["a 0", "b 2", DEADLOCK], answer: 1,
        explain: L(
          "Receiving from a nil channel blocks forever, so that select case is never ready. Setting a channel to nil disables a case.",
          "Recibir de un canal nil bloquea para siempre: ese case nunca está listo. Poner un canal en nil desactiva su case.",
          "nil チャネルの受信は永遠に止まるので、その case は選ばれない。nil にすると case を無効化できる。",
        ),
        check: { compiles: true, stdout: "b 2" },
      },
      {
        topic: "channels", difficulty: 2, kind: "order", prompt: L("Produce 0..2, close, then consume", "Produce 0..2, cierra y consume", "0..2 を送信→close→受信"),
        lines: ["ch := make(chan int)", "go func() {", "\tfor i := range 3 { ch <- i }", "\tclose(ch)", "}()", "for v := range ch { fmt.Print(v) }"],
        explain: L(
          "The producer sends, then closes so the consumer's range ends. Only the sender closes; closing first would panic on send.",
          "El productor envía y luego cierra para que el range termine. Solo cierra el emisor; cerrar antes haría panic al enviar.",
          "送信側が送ってから close し、受信側の range を終わらせる。先に close すると送信で panic。",
        ),
        check: { compiles: true, stdout: "012" },
      },
      {
        topic: "channels", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "ch := make(chan string)",
          "go func() {",
          "\ttime.Sleep(50 * time.Millisecond)",
          '\tch <- "result"',
          "}()",
          "select {",
          "case r := <-ch:",
          "\tfmt.Println(r)",
          "case <-time.After(10 * time.Millisecond):",
          '\tfmt.Println("timeout")',
          "}",
        ),
        options: ["result", "timeout", DEADLOCK], answer: 1,
        explain: L(
          "select waits for the first ready case. The timer fires after 10ms, before the 50ms worker sends. Unbuffered ch leaks it.",
          "select espera el primer case listo. El timer salta a los 10ms, antes del envío a los 50ms. El ch sin buffer filtra la goroutine.",
          "select は先に準備できた case を選ぶ。10ms のタイマーが 50ms の送信より先。",
        ),
        check: { compiles: true, stdout: "timeout" },
      },
      // sync
      {
        topic: "sync", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("var mu sync.Mutex", "mu.Lock()", "mu.Lock()", 'fmt.Println("locked twice")'),
        options: [L("Prints locked twice", "Imprime locked twice", "locked twice と表示"), DEADLOCK, L("panic: already locked", "panic: already locked", "panic: already locked")], answer: 1,
        explain: L(
          "sync.Mutex is not reentrant: the second Lock waits for an Unlock that never comes. With no other goroutine, it deadlocks.",
          "sync.Mutex no es reentrante: el segundo Lock espera un Unlock que nunca llega. Sin otra goroutine, hay deadlock.",
          "sync.Mutex は再入不可。2回目の Lock は来ない Unlock を待ち、デッドロックになる。",
        ),
        check: { compiles: true, throws: "all goroutines are asleep" },
      },
      {
        topic: "sync", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("var mu sync.Mutex", "mu.Unlock()"),
        options: [L("Nothing", "Nada", "何も起きない"), L("fatal error: unlock of unlocked mutex", "fatal error: unlock of unlocked mutex", "fatal error: unlock of unlocked mutex"), L("Compile error", "Error de compilación", "コンパイルエラー")], answer: 1,
        explain: L(
          "Unlocking an unlocked mutex is a fatal runtime error, not a panic: recover cannot catch it. Pair Lock with defer Unlock.",
          "Desbloquear un mutex libre es un error fatal del runtime, no un panic: recover no lo atrapa. Usa Lock con defer Unlock.",
          "ロックしていない mutex の Unlock は fatal error で recover できない。Lock と defer Unlock を組に。",
        ),
        check: { compiles: true, throws: "sync: unlock of unlocked mutex" },
      },
      {
        topic: "sync", difficulty: 2, kind: "pick", prompt: L("Two goroutines do m[k]++, no lock. Likely?", "Dos goroutines hacen m[k]++ sin lock. ¿Qué pasa?", "ロックなしで2つが m[k]++。結果は？"),
        code: "go func() { m[k]++ }()\ngo func() { m[k]++ }() // ___",
        options: [L("fatal error: concurrent map writes, or a -race report", "fatal error: concurrent map writes, o aviso de -race", "fatal error: concurrent map writes か -race の報告"), L("A compile error", "Un error de compilación", "コンパイルエラー"), L("Always correct: maps are thread-safe", "Siempre bien: los mapas son seguros", "常に正しい：マップは安全")], answer: 0,
        explain: L(
          "Maps are not safe for concurrent writes. The runtime may abort and go test -race reports it. Guard with a Mutex.",
          "Los mapas no son seguros para escrituras concurrentes. El runtime puede abortar y -race lo reporta. Protégelo con un Mutex.",
          "マップは並行書き込みに安全でない。ランタイムが落ちることも。-race で検出し Mutex で守ろう。",
        ),
      },
      {
        topic: "sync", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("var once sync.Once", "for i := range 3 {", '\tonce.Do(func() { fmt.Print("init", i, " ") })', "}", 'fmt.Println("ready")'),
        options: ["init0 ready", "init0 init1 init2 ready", "init2 ready"], answer: 0,
        explain: L(
          "sync.Once runs the function only on the first Do call, even across goroutines. Later calls return without running it.",
          "sync.Once ejecuta la función solo en la primera llamada a Do, incluso entre goroutines. Las siguientes no la corren.",
          "sync.Once は最初の Do だけ関数を実行する（goroutine をまたいでも）。以降は何もしない。",
        ),
        check: { compiles: true, stdout: "init0 ready" },
      },
      // context
      {
        topic: "context", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "parent, cancel := context.WithCancel(context.Background())",
          "child, stop := context.WithTimeout(parent, time.Hour)",
          "defer stop()",
          "cancel()",
          "<-child.Done()",
          "fmt.Println(child.Err())",
        ),
        options: ["context canceled", "context deadline exceeded", "<nil>"], answer: 0,
        explain: L(
          "Canceling a parent cancels every context derived from it. The child ends right away with context.Canceled.",
          "Cancelar el padre cancela todos los contextos derivados. El hijo termina enseguida con context.Canceled.",
          "親をキャンセルすると派生した context もすべて終わる。子はすぐ context.Canceled になる。",
        ),
        check: { compiles: true, stdout: "context canceled" },
      },
      {
        topic: "context", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("ctx, cancel := context.WithTimeout(context.Background(), 5*time.Millisecond)", "defer cancel()", "<-ctx.Done()", "fmt.Println(ctx.Err())"),
        options: ["context canceled", "context deadline exceeded", "<nil>"], answer: 1,
        explain: L(
          "When the timeout passes, Done closes and Err returns DeadlineExceeded. Still defer cancel() to free the timer early.",
          "Al vencer el plazo, Done se cierra y Err devuelve DeadlineExceeded. Igual usa defer cancel() para liberar el timer.",
          "期限が来ると Done が閉じ Err は DeadlineExceeded。それでも defer cancel() でタイマーを解放しよう。",
        ),
        check: { compiles: true, stdout: "context deadline exceeded" },
      },
      {
        topic: "context", difficulty: 2, kind: "pick", prompt: L("Stop the worker when ctx is canceled", "Detén al worker al cancelar ctx", "ctx のキャンセルで worker を止める"),
        code: code(
          "ctx, cancel := context.WithCancel(context.Background())",
          "done := make(chan struct{})",
          "go func() {",
          "\tdefer close(done)",
          "\t<-___",
          '\tfmt.Println("worker stopped:", ctx.Err())',
          "}()",
          "cancel()",
          "<-done",
        ),
        options: ["ctx.Done()", "ctx.Err()", "ctx"], answer: 0,
        explain: L(
          "ctx.Done() returns a channel that closes on cancel, so receiving from it wakes the worker. Err() is an error, not a channel.",
          "ctx.Done() da un canal que se cierra al cancelar; recibir de él despierta al worker. Err() es un error, no un canal.",
          "ctx.Done() はキャンセルで閉じるチャネル。受信で worker が起きる。Err() はエラーでチャネルではない。",
        ),
        check: { compiles: true, stdout: "worker stopped: context canceled", wrongFail: true },
      },
      // runtime
      {
        topic: "runtime", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "import (",
          '\t"fmt"',
          '\t"unsafe"',
          ")",
          "",
          "type A struct{ a bool; b int64; c bool }",
          "type B struct{ b int64; a bool; c bool }",
          "",
          "func main() {",
          "\tfmt.Println(unsafe.Sizeof(A{}), unsafe.Sizeof(B{}))",
          "}",
        ),
        options: ["10 10", "24 16", "16 16"], answer: 1,
        explain: L(
          "On 64-bit, int64 must sit at a multiple of 8, so A pads after each bool (24 bytes). Grouping small fields gives 16.",
          "En 64 bits, int64 va en múltiplos de 8: A rellena tras cada bool (24 bytes). Agrupar los campos chicos da 16.",
          "64ビットでは int64 は8の倍数に置かれ、A は bool の後に詰め物（24）。小さい型をまとめると 16。",
        ),
        check: { compiles: true, stdout: "24 16" },
      },
      {
        topic: "runtime", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "type C struct{ n int }",
          "",
          "func (c C) Get() int { return c.n }",
          "",
          "func main() {",
          "\tc := C{1}",
          "\tf := c.Get",
          "\tc.n = 2",
          "\tfmt.Println(f(), c.Get())",
          "}",
        ),
        options: ["1 2", "2 2", "1 1"], answer: 0,
        explain: L(
          "A method value with a value receiver copies the receiver when c.Get is evaluated, so f keeps n == 1.",
          "Un method value con receptor por valor copia el receptor al evaluar c.Get, así que f conserva n == 1.",
          "値レシーバのメソッド値は c.Get の評価時にレシーバをコピーする。f は n == 1 のまま。",
        ),
        check: { compiles: true, stdout: "1 2" },
      },
      {
        topic: "runtime", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("var x uint8 = 255", "x++", "var y int8 = 127", "y++", "fmt.Println(x, y)"),
        options: ["0 -128", "256 128", L("panic: integer overflow", "panic: integer overflow", "panic: integer overflow")], answer: 0,
        explain: L(
          "Integer overflow wraps around silently at runtime; Go has no overflow panic. Only constant overflow is a compile error.",
          "El desborde de enteros da la vuelta en silencio al ejecutar; Go no hace panic. Solo el de constantes no compila.",
          "整数のオーバーフローは実行時に黙って一周する。panic はない。定数のオーバーフローだけがエラー。",
        ),
        check: { compiles: true, stdout: "0 -128" },
      },
      // tooling
      {
        topic: "tooling", difficulty: 1, kind: "pick", prompt: L("Which file stores dependency hashes?", "¿Qué archivo guarda los hashes?", "依存のハッシュを記録するのは？"),
        code: "go get example.com/lib@v1.4.0 // updates go.mod and ___",
        options: ["go.sum", "go.lock", "vendor.json"], answer: 0,
        explain: L(
          "go.mod lists module requirements; go.sum records the expected hashes of each module version so builds are verifiable.",
          "go.mod lista los módulos requeridos; go.sum guarda los hashes esperados de cada versión para verificar los builds.",
          "go.mod は依存モジュールを、go.sum は各バージョンの期待ハッシュを記録して検証可能にする。",
        ),
      },
      // slices
      {
        topic: "slices", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code("s := make([]int, 2, 3)", "t := append(s, 5)", "u := append(s, 6)", "fmt.Println(t, u, len(s))"),
        options: ["[0 0 5] [0 0 6] 2", "[0 0 6] [0 0 6] 2", "[0 0 5] [0 0 6] 3"], answer: 1,
        explain: L(
          "s has spare capacity, so both appends write index 2 of the same array: the second overwrites the first. s keeps len 2.",
          "s tiene capacidad libre: ambos append escriben el índice 2 del mismo array y el segundo pisa al primero. s sigue con len 2.",
          "s に余裕があるので両方の append が同じ配列の 2 番に書き、後が上書き。s は len 2 のまま。",
        ),
        check: { compiles: true, stdout: "[0 0 6] [0 0 6] 2" },
      },
      {
        topic: "slices", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("src := []int{1, 2, 3}", "dst := make([]int, 2)", "n := copy(dst, src)", "fmt.Println(n, dst)"),
        options: ["2 [1 2]", "3 [1 2 3]", L("panic: index out of range", "panic: index out of range", "panic: index out of range")], answer: 0,
        explain: L(
          "copy moves min(len(dst), len(src)) elements and returns that count. It never grows dst; use append or slices.Clone for that.",
          "copy mueve min(len(dst), len(src)) elementos y devuelve esa cantidad. No agranda dst; para eso usa append o slices.Clone.",
          "copy は min(len(dst), len(src)) 個だけ写して数を返す。dst は伸びない。",
        ),
        check: { compiles: true, stdout: "2 [1 2]" },
      },
    ],
  },
];
