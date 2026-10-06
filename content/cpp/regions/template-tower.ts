import type { Beat, LessonDef, NoteBlock, NoteDef, RegionDef, Text } from "../../../lib/content/types.ts";
import { L } from "../../../lib/i18n/text.ts";

// REGION 4 · TEMPLATE TOWER  (templates, constexpr and concepts; lambdas and the STL; C++17/20; threads; UB spotting)

const say = (text: Text): Beat => ({ kind: "dialog", speaker: "master", text });
const enemySays = (text: Text): Beat => ({ kind: "dialog", speaker: "enemy", text });

/** Dedent a code block written inline (drops the first newline and the common indentation). */
const cc = (s: string) => {
  const lines = s.replace(/^\n+/, "").replace(/\s+$/, "").split("\n");
  const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => (l.match(/^ */) ?? [""])[0].length));
  return lines.map((l) => l.slice(ind)).join("\n");
};

/** Full program for thread snippets (the auto-wrapper doesn't add <thread>, <mutex>, <atomic> or <future>). */
const THREAD_HEADERS = ["iostream", "string", "vector", "thread", "mutex", "atomic", "future", "functional"].map((h) => `#include <${h}>`).join("\n");
const withThreads = (body: string, top = "") => `${THREAD_HEADERS}\n\n${top ? top + "\n\n" : ""}int main() {\n${body.split("\n").map((l) => "    " + l).join("\n")}\n}\n`;
/** Compile-only proof for UB snippets: the code is placed in a function that is never called. */
const neverRun = (body: string, top = "", headers = "") =>
  `${headers ? headers + "\n" : ""}#include <iostream>\n#include <string>\n#include <vector>\n#include <string_view>\n#include <climits>\n\n${top ? top + "\n\n" : ""}void neverCalled() {\n${body.split("\n").map((l) => "    " + l).join("\n")}\n}\n\nint main() {}\n`;

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const SAFE = L("Is it safe?", "¿Es seguro?", "安全？");
const DEFINED = L("Defined or undefined?", "¿Definido o indefinido?", "定義済み？未定義？");
const YES = L("Yes", "Sí", "はい");
const NO_GCC = L("No: g++ stops it", "No: g++ lo detiene", "いいえ：g++ が止める");
const UB = L("UB: anything can happen", "UB: puede pasar cualquier cosa", "UB：何が起きてもおかしくない");

// Guidebook notes: long explanations players can reopen from any question (📖).
// Examples use names and values different from the questions so they never give an answer away.
const note = (id: string, title: Text, ...blocks: NoteBlock[]): NoteDef => ({ id, title, blocks });
const p = (en: string, es: string, ja: string): NoteBlock => ({ t: "p", text: L(en, es, ja) });
/** A runnable example; the validator checks `output` against the real compiler. */
const ex = (code: string, output: string, caption?: Text): NoteBlock => ({ t: "code", code, output, caption });
/** An example that must NOT compile (verified too). */
const bad = (code: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { compiles: false } });
/** An example run as a full program (threads need headers the auto-wrapper doesn't add). */
const exProg = (code: string, program: string, output: string, caption?: Text): NoteBlock => ({ t: "code", code, output, caption, check: { compiles: true, stdout: output, program } });
/** UB on purpose: only proven to compile (inside a function that never runs); no output is ever claimed. */
const ubEx = (code: string, program: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { compiles: true, program } });

const forgeNotes: NoteDef[] = [
  note("template-deduction", L("Function templates and deducing T", "Plantillas de función y deducir T", "関数テンプレートと T の推論"),
    p(
      "A function template is a recipe with a blank: template <typename T> says \"T is some type, to be decided later\". You write the body once, using T wherever a type goes. Each time you call it with a new type, the compiler stamps out a real function for that type. typename and class mean the same thing here.",
      "Una plantilla de función es una receta con un hueco: template <typename T> dice \"T es algún tipo, se decide después\". Escribes el cuerpo una vez, usando T donde va un tipo. Cada vez que la llamas con un tipo nuevo, el compilador fabrica una función real para ese tipo. Aquí typename y class significan lo mismo.",
      "関数テンプレートは空欄つきのレシピ。template <typename T> は「T は何かの型、あとで決める」という意味。本体は一度だけ書き、型の場所に T を使う。新しい型で呼ぶたびに、コンパイラがその型用の本物の関数を作る。ここでは typename と class は同じ意味。",
    ),
    p(
      "Usually you don't say what T is: the compiler DEDUCES it from the arguments. smaller(8, 5) has two ints, so T = int. If the arguments disagree, say an int and a double for the same T, deduction fails and you get \"no matching function\". There is no automatic conversion while deducing.",
      "Normalmente no dices qué es T: el compilador lo DEDUCE de los argumentos. smaller(8, 5) recibe dos int, así que T = int. Si los argumentos no coinciden, por ejemplo un int y un double para el mismo T, la deducción falla y aparece \"no matching function\". Al deducir no hay conversiones automáticas.",
      "ふつうは T を書かない。コンパイラが引数から推論する。smaller(8, 5) は int が2つなので T = int。同じ T に int と double のように食い違う引数を渡すと推論に失敗し、no matching function になる。推論中は自動の型変換はない。",
    ),
    ex(cc(`
      template <typename T>
      T smaller(T a, T b) { return a < b ? a : b; }
      int main() {
        std::cout << smaller(8, 5) << " " << smaller<double>(2, 0.5);
      }`), "5 0.5",
      L("Deduced T = int, then T chosen by hand as double", "T deducido como int, luego elegido a mano como double", "T = int を推論、次は手で double を指定")),
    p(
      "You can also pick T yourself with angle brackets: smaller<double>(2, 0.5). Now nothing is deduced, the function takes doubles, and the int 2 is converted to 2.0 on the way in. This is how you settle a disagreement between arguments.",
      "También puedes elegir T tú mismo con ángulos: smaller<double>(2, 0.5). Ahora no se deduce nada, la función recibe double y el int 2 se convierte en 2.0 al entrar. Así se resuelve un desacuerdo entre argumentos.",
      "山かっこで T を自分で決めることもできる：smaller<double>(2, 0.5)。推論はされず、関数は double を受け取り、int の 2 は 2.0 に変換される。引数の食い違いはこうして解決する。",
    ),
    ex(cc(`
      template <typename T>
      T half(T x) { return x / 2; }
      int main() {
        std::cout << half(5) << " " << half(5.0);
      }`), "2 2.5",
      L("The same body: integer division for int, real division for double", "El mismo cuerpo: división entera para int, real para double", "同じ本体でも int は整数の割り算、double は小数の割り算")),
    p(
      "Common mistake: forgetting that T decides the math inside. With T = int, x / 2 is integer division and the fraction is thrown away; the return type T = int also cuts it. If you need decimals, make sure T becomes double, either by passing doubles or by writing the type in < >.",
      "Error común: olvidar que T decide las cuentas de adentro. Con T = int, x / 2 es división entera y la parte decimal se pierde; el tipo de retorno T = int también la corta. Si necesitas decimales, asegúrate de que T sea double, pasando double o escribiendo el tipo entre < >.",
      "よくあるミス：中の計算も T で決まることを忘れること。T = int なら x / 2 は整数の割り算で小数は消え、戻り値の型 T = int でも切られる。小数が必要なら、double を渡すか < > に型を書いて T を double にしよう。",
    ),
  ),
  note("class-templates", L("Class templates and value parameters", "Plantillas de clase y parámetros valor", "クラステンプレートと値パラメータ"),
    p(
      "A struct or class can be a template too. template <typename T> struct Box { T item; }; is a mold for boxes: Box<int> holds an int, Box<std::string> holds a string. For class templates you normally write the type in the angle brackets yourself, like std::vector<int>.",
      "Un struct o una clase también puede ser plantilla. template <typename T> struct Box { T item; }; es un molde de cajas: Box<int> guarda un int y Box<std::string> un string. En las plantillas de clase normalmente escribes tú el tipo entre ángulos, como en std::vector<int>.",
      "struct や class もテンプレートにできる。template <typename T> struct Box { T item; }; は箱の型枠で、Box<int> は int を、Box<std::string> は文字列を入れる。クラステンプレートでは std::vector<int> のように、ふつう型を山かっこに自分で書く。",
    ),
    p(
      "A template parameter doesn't have to be a type: it can be a VALUE known at compile time, like int N. Inside the template, N is a constant, so it can size an array. Shelf<int, 5> and Shelf<int, 6> are two different types, each with its number baked in.",
      "Un parámetro de plantilla no tiene que ser un tipo: puede ser un VALOR conocido al compilar, como int N. Dentro de la plantilla, N es una constante, así que puede dar tamaño a un arreglo. Shelf<int, 5> y Shelf<int, 6> son dos tipos distintos, cada uno con su número horneado.",
      "テンプレートのパラメータは型でなくてもよい。int N のようにコンパイル時に分かる「値」も使える。テンプレートの中で N は定数なので、配列の大きさにできる。Shelf<int, 5> と Shelf<int, 6> は別の型で、それぞれ数が焼きこまれている。",
    ),
    ex(cc(`
      template <typename T, int N>
      struct Shelf {
        T slots[N];
        int capacity() const { return N; }
      };
      int main() {
        Shelf<int, 5> a;
        Shelf<char, 2> b;
        std::cout << a.capacity() << b.capacity();
      }`), "52",
      L("N is part of the type, so each shelf knows its own size", "N es parte del tipo, cada estante sabe su tamaño", "N は型の一部なので、棚は自分の大きさを知っている")),
    p(
      "The standard library uses exactly this: std::array<int, 4> is a fixed array of 4 ints, and size() just returns the 4 from the template. Remember: a value parameter must be a constant the compiler can see, never a variable read at run time.",
      "La biblioteca estándar usa justo esto: std::array<int, 4> es un arreglo fijo de 4 int, y size() solo devuelve el 4 de la plantilla. Recuerda: un parámetro valor debe ser una constante que el compilador vea, nunca una variable leída al ejecutar.",
      "標準ライブラリもまさにこれを使う。std::array<int, 4> は int 4個の固定配列で、size() はテンプレートの 4 を返すだけ。値パラメータは、実行時に読む変数ではなく、コンパイラに見える定数でなければならない。",
    ),
    ex("std::array<double, 4> marks{};\nstd::cout << marks.size() << marks[0];", "40",
      L("{} fills every slot with zero", "{} llena cada casilla con cero", "{} で全部のマスが 0 になる")),
  ),
  note("constexpr", L("constexpr and static_assert", "constexpr y static_assert", "constexpr と static_assert"),
    p(
      "constexpr on a function means \"this CAN run while compiling\". If every input is a constant, the compiler computes the result itself and the program just contains the answer. With normal run-time inputs, the same function simply runs at run time like any other.",
      "constexpr en una función significa \"esto PUEDE correr al compilar\". Si todas las entradas son constantes, el compilador calcula el resultado él mismo y el programa solo contiene la respuesta. Con entradas normales de tiempo de ejecución, la misma función corre al ejecutar como cualquier otra.",
      "関数の constexpr は「コンパイル中にも動ける」という意味。入力がすべて定数なら、コンパイラが自分で結果を計算し、プログラムには答えだけが入る。実行時の入力なら、同じ関数がふつうに実行時に動く。",
    ),
    ex(cc(`
      constexpr int cube(int x) { return x * x * x; }
      static_assert(cube(2) == 8);
      int main() {
        constexpr int side = cube(3);
        int grid[cube(2)];
        std::cout << side << " " << sizeof(grid) / sizeof(grid[0]);
      }`), "27 8",
      L("Computed while compiling: usable for array sizes and static_assert", "Calculado al compilar: sirve para tamaños de arreglo y static_assert", "コンパイル中に計算され、配列の大きさや static_assert に使える")),
    p(
      "A constexpr VARIABLE is stricter: its value must be known at compile time, so everything that feeds it must be constant too. A variable you read or create at run time can't feed it, and g++ answers \"is not usable in a constant expression\". Mark the input constexpr, or drop constexpr from the variable.",
      "Una VARIABLE constexpr es más estricta: su valor debe conocerse al compilar, así que todo lo que la alimenta también debe ser constante. Una variable leída o creada al ejecutar no sirve, y g++ responde \"is not usable in a constant expression\". Marca la entrada como constexpr o quita constexpr de la variable.",
      "constexpr「変数」はもっと厳しい。値がコンパイル時に分かる必要があり、材料もすべて定数でなければならない。実行時の変数は使えず、g++ は not usable in a constant expression と言う。入力を constexpr にするか、変数の constexpr を外そう。",
    ),
    bad(cc(`
      constexpr int cube(int x) { return x * x * x; }
      int main() {
        int n;
        std::cin >> n;
        constexpr int v = cube(n);
      }`), L("Does not compile: n is only known at run time", "No compila: n solo se conoce al ejecutar", "コンパイル不可：n は実行時にしか分からない")),
    p(
      "static_assert(condition) checks a fact during compilation. If it's false, there is no program at all, just an error. It's a free test: it costs nothing at run time. Common mistake: thinking constexpr on a function forces compile time; it only allows it. The variable or the context decides.",
      "static_assert(condición) revisa un hecho durante la compilación. Si es falso, no hay programa, solo un error. Es una prueba gratis: no cuesta nada al ejecutar. Error común: creer que constexpr en una función obliga a calcular al compilar; solo lo permite. Lo decide la variable o el contexto.",
      "static_assert(条件) はコンパイル中に事実を確かめる。偽ならプログラムはできず、エラーになる。実行時のコストゼロのテストじゃ。よくある誤解：関数の constexpr はコンパイル時の計算を「強制」しない。「許す」だけで、決めるのは変数や使う場所。",
    ),
  ),
  note("if-constexpr-concepts", L("if constexpr and concepts", "if constexpr y concepts", "if constexpr と concept"),
    p(
      "Inside a template, if constexpr (condition) is decided while compiling, for each T. The branch that doesn't apply is thrown away and never compiled for that T. That's why one branch may use code that only works for some types, like std::to_string for numbers.",
      "Dentro de una plantilla, if constexpr (condición) se decide al compilar, para cada T. La rama que no aplica se descarta y nunca se compila para ese T. Por eso una rama puede usar código que solo sirve para algunos tipos, como std::to_string para números.",
      "テンプレートの中の if constexpr (条件) は、T ごとにコンパイル中に決まる。当てはまらない枝は捨てられ、その T ではコンパイルされない。だから片方の枝で、数値用の std::to_string のような一部の型でしか使えないコードを書ける。",
    ),
    ex(cc(`
      template <typename T>
      std::string kind(T) {
        if constexpr (std::is_floating_point_v<T>) return "float";
        else return "not float";
      }
      int main() { std::cout << kind(2.5) << ", " << kind('x'); }`), "float, not float"),
    p(
      "A concept is a named yes/no test on a type: template <typename T> concept Small = sizeof(T) <= 2;. Writing template <Small T> puts a guard at the door: only types that pass may use the template. A type that fails is rejected right at the call, with \"constraints not satisfied\", instead of a long error from deep inside the body.",
      "Un concept es una prueba sí/no con nombre sobre un tipo: template <typename T> concept Small = sizeof(T) <= 2;. Escribir template <Small T> pone un guardia en la puerta: solo los tipos que pasan pueden usar la plantilla. Uno que falla se rechaza en la llamada, con \"constraints not satisfied\", en vez de un error largo desde dentro del cuerpo.",
      "concept は型に対する名前つきの yes/no テスト：template <typename T> concept Small = sizeof(T) <= 2;。template <Small T> と書くと門番が立ち、合格した型だけがテンプレートを使える。不合格の型は呼び出しの場所で constraints not satisfied と止められ、本体の奥からの長いエラーにならない。",
    ),
    ex(cc(`
      template <typename T>
      concept Small = sizeof(T) <= 2;

      template <Small T>
      int bytes(T) { return sizeof(T); }

      int main() { std::cout << bytes('a') << bytes(short{1}); }`), "12",
      L("char (1 byte) and short (2 bytes) pass the guard", "char (1 byte) y short (2 bytes) pasan el guardia", "char（1バイト）と short（2バイト）は合格")),
    p(
      "The standard library has ready-made concepts in <concepts>: std::integral<T> (int, char, long...), std::floating_point<T> (float, double) and many more; combine them with || and &&. One printing detail: std::cout prints a double with no fraction without the .0, so 2.0 shows as 2.",
      "La biblioteca estándar trae concepts listos en <concepts>: std::integral<T> (int, char, long...), std::floating_point<T> (float, double) y muchos más; combínalos con || y &&. Un detalle al imprimir: std::cout muestra un double sin decimales sin el .0, así que 2.0 sale como 2.",
      "標準ライブラリの <concepts> には std::integral<T>（int, char, long…）や std::floating_point<T>（float, double）など既製の concept がある。|| や && で組み合わせよう。表示の注意：std::cout は小数部のない double を .0 なしで出すので、2.0 は 2 と表示される。",
    ),
    ex("std::cout << 2.0 << \" \" << 2.25;", "2 2.25"),
  ),
  note("variadic", L("Variadic templates and folds", "Plantillas variádicas y folds", "可変長テンプレートと fold"),
    p(
      "typename... Ts declares a PACK: zero or more types at once. A function taking Ts... xs accepts any number of arguments, each with its own type. You can't loop over a pack like a vector; instead you expand it with ... in special places.",
      "typename... Ts declara un PAQUETE: cero o más tipos a la vez. Una función que recibe Ts... xs acepta cualquier cantidad de argumentos, cada uno con su tipo. No puedes recorrer un paquete como un vector; en cambio lo expandes con ... en lugares especiales.",
      "typename... Ts は「パック」を宣言する。0個以上の型をまとめたもの。Ts... xs を受ける関数は、いくつでも、それぞれ違う型の引数を受け取れる。パックは vector のようにループできず、決まった場所で ... を使って展開する。",
    ),
    p(
      "A fold expression applies an operator across the whole pack: (xs + ...) means x1 + x2 + x3 and so on; (xs * ...) multiplies them. sizeof...(Ts) is the number of items in the pack, counted at compile time; it never looks at the values.",
      "Una expresión fold aplica un operador a todo el paquete: (xs + ...) significa x1 + x2 + x3 y así; (xs * ...) los multiplica. sizeof...(Ts) es la cantidad de elementos del paquete, contada al compilar; nunca mira los valores.",
      "fold 式はパック全体に演算子を使う。(xs + ...) は x1 + x2 + x3 …という意味、(xs * ...) は掛け算。sizeof...(Ts) はパックの個数で、コンパイル時に数える。値は見ない。",
    ),
    ex(cc(`
      template <typename... Ts>
      auto product(Ts... xs) { return (xs * ...); }

      template <typename... Ts>
      int howMany(Ts...) { return sizeof...(Ts); }

      int main() { std::cout << product(2, 3, 5) << " " << howMany('a', 1, 2, 3); }`), "30 4",
      L("The fold multiplies; sizeof... counts, whatever the types", "El fold multiplica; sizeof... cuenta, sin importar los tipos", "fold で掛け算、sizeof... は型に関係なく個数")),
    p(
      "Common mistakes: forgetting the parentheses around a fold (they are required), and confusing sizeof...(Ts), the count of arguments, with sizeof(T), the size in bytes of one type.",
      "Errores comunes: olvidar los paréntesis alrededor de un fold (son obligatorios) y confundir sizeof...(Ts), la cantidad de argumentos, con sizeof(T), el tamaño en bytes de un tipo.",
      "よくあるミス：fold のまわりのかっこを忘れること（必須）。sizeof...(Ts)（引数の個数）と sizeof(T)（ひとつの型のバイト数）を混同すること。",
    ),
  ),
];

// ─── 4.1 The template forge ────────────────────────────────────────────────
const forge: LessonDef = {
  slug: "template-forge",
  title: L("The template forge", "La forja de plantillas", "テンプレートの鍛冶場"),
  concept: "templates",
  mode: "lesson",
  xp: 80,
  enemy: "cpp/segfault-skull",
  enemyName: L("MOLD SKULL", "CRÁNEO MOLDE", "カタワクスカル"),
  notes: forgeNotes,
  beats: [
    say(L(
      "Welcome to Template Tower! A TEMPLATE is a mold: write one function for any type T, and the compiler pours a copy per type.",
      "¡Bienvenido a la Torre de Plantillas! Una PLANTILLA es un molde: una función para cualquier tipo T, y el compilador saca una copia por tipo.",
      "テンプレートの塔へようこそ！テンプレートは型枠。型 T 用に一度書けば、型ごとにコンパイラが作ってくれる。",
    )),
    {
      kind: "act",
      prompt: L("Build the mold, then pour two swords", "Arma el molde y vierte dos espadas", "型枠を作って、剣を2本流しこもう"),
      steps: [
        { label: L("MOLD", "MOLDE", "型枠"), line: "template <typename T>", effects: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "biggest<T>" }] },
        { label: L("BODY", "CUERPO", "中身"), line: "T biggest(T a, T b) { return a > b ? a : b; }" },
        { label: L("POUR int", "VERTER int", "int を流す"), line: "std::cout << biggest(3, 7);", effects: [{ t: "enter", actor: "ally" }, { t: "item", kind: "sword", holder: "ally" }, { t: "tag", actor: "ally", text: "int", value: "7" }, { t: "print", text: "7" }], output: "7" },
        { label: L("POUR double", "VERTER double", "double を流す"), line: "std::cout << biggest(2.5, 1.5);", effects: [{ t: "clone", to: "ally" }, { t: "value", actor: "ally", text: "2.5" }, { t: "print", text: "2.5" }], output: "2.5" },
      ],
    },
    {
      kind: "predict",
      hint: L("T is deduced separately for each call. Look at the types of the two arguments in each one.", "T se deduce por separado en cada llamada. Mira los tipos de los dos argumentos en cada una.", "T は呼び出しごとに推論される。それぞれの2つの引数の型を見よう。"),
      note: "template-deduction",
      prompt: PRINT,
      code: cc(`
        template <typename T>
        T biggest(T a, T b) { return a > b ? a : b; }
        int main() {
          std::cout << biggest(3, 7) << " " << biggest(2.5, 1.5);
        }`),
      options: ["7 2.5", "7 2", "3 1.5"],
      answer: 0,
      output: "7 2.5",
      check: { compiles: true, stdout: "7 2.5" },
      explain: L("T is deduced from the arguments: int for (3, 7), double for (2.5, 1.5).", "T se deduce de los argumentos: int para (3, 7), double para (2.5, 1.5).", "T は引数から推論される：(3, 7) は int、(2.5, 1.5) は double。"),
      win: [{ t: "print", text: "7 2.5" }],
    },
    {
      kind: "predict",
      hint: L("Both arguments must agree on a single T. What type does each argument suggest?", "Ambos argumentos deben coincidir en un solo T. ¿Qué tipo sugiere cada argumento?", "2つの引数は1つの T に合う必要がある。それぞれの引数はどの型？"),
      note: "template-deduction",
      prompt: COMPILES,
      code: cc(`
        template <typename T>
        T biggest(T a, T b) { return a > b ? a : b; }
        int main() {
          std::cout << biggest(3, 7.5);
        }`),
      options: [YES, NO_GCC],
      answer: 1,
      check: { compiles: false },
      explain: L("3 says T = int, 7.5 says T = double. The mold can't be both: no matching function for call.", "3 dice T = int, 7.5 dice T = double. El molde no puede ser ambos: no matching function for call.", "3 は T = int、7.5 は T = double。両方にはなれない：no matching function のエラー。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "pick",
      hint: L("Writing the type in < > converts both arguments to it. Which type keeps the .5?", "Escribir el tipo en < > convierte ambos argumentos a él. ¿Qué tipo conserva el .5?", "< > に書いた型に両方の引数が変換される。.5 が残る型は？"),
      note: "template-deduction",
      prompt: L("Pick T yourself to print 7.5", "Elige T tú para imprimir 7.5", "T を自分で決めて 7.5 を表示"),
      code: cc(`
        template <typename T>
        T biggest(T a, T b) { return a > b ? a : b; }
        int main() {
          std::cout << biggest<___>(3, 7.5);
        }`),
      options: ["double", "int"],
      answer: 0,
      check: { compiles: true, stdout: "7.5" },
      explain: L("biggest<double> turns 3 into 3.0. With <int>, 7.5 would be cut down to 7.", "biggest<double> convierte 3 en 3.0. Con <int>, 7.5 se recortaría a 7.", "biggest<double> なら 3 は 3.0 になる。<int> だと 7.5 は 7 に切られる。"),
      win: [{ t: "print", text: "7.5" }],
    },
    say(L(
      "Classes can be molds too, and a template parameter can be a number: Bag<std::string, 3> holds 3 strings.",
      "Las clases también pueden ser moldes, y un parámetro puede ser un número: Bag<std::string, 3> guarda 3 strings.",
      "クラスも型枠にできる。パラメータに数も使える：Bag<std::string, 3> は文字列を3つ持つ。",
    )),
    {
      kind: "predict",
      hint: L("N is a value fixed by the angle brackets when the type is written. What does size() return?", "N es un valor fijado entre los ángulos al escribir el tipo. ¿Qué devuelve size()?", "N は型を書いたときに山かっこで決まる値。size() は何を返す？"),
      note: "class-templates",
      prompt: PRINT,
      code: cc(`
        template <typename T, int N>
        struct Bag {
          T items[N];
          int size() const { return N; }
        };
        int main() {
          Bag<std::string, 3> b;
          std::cout << b.size();
        }`),
      options: ["3", "0", "1"],
      answer: 0,
      output: "3",
      check: { compiles: true, stdout: "3" },
      explain: L("N is fixed at compile time to 3, so size() returns 3.", "N queda fijo en 3 al compilar, así que size() devuelve 3.", "N はコンパイル時に 3 に決まるので、size() は 3。"),
      win: [{ t: "print", text: "3" }],
    },
    say(L(
      "constexpr functions can run at COMPILE time, and static_assert checks a fact before the program even exists.",
      "Las funciones constexpr pueden correr al COMPILAR, y static_assert revisa un hecho antes de que exista el programa.",
      "constexpr 関数はコンパイル時に動ける。static_assert はプログラムができる前に事実を確かめる。",
    )),
    {
      kind: "predict",
      hint: L("sq runs while compiling. How many slots does the array get, and what does the division count?", "sq corre al compilar. ¿Cuántas casillas recibe el arreglo y qué cuenta la división?", "sq はコンパイル中に動く。配列のマスはいくつ？割り算は何を数える？"),
      note: "constexpr",
      prompt: PRINT,
      code: cc(`
        constexpr int sq(int x) { return x * x; }
        static_assert(sq(4) == 16);
        int main() {
          int arr[sq(3)];
          std::cout << sizeof(arr) / sizeof(arr[0]);
        }`),
      options: ["9", "3", "16"],
      answer: 0,
      output: "9",
      check: { compiles: true, stdout: "9" },
      explain: L("sq(3) is computed while compiling, so arr gets 9 slots.", "sq(3) se calcula al compilar, así que arr tiene 9 casillas.", "sq(3) はコンパイル中に計算され、arr は9マスになる。"),
      win: [{ t: "print", text: "9" }],
    },
    {
      kind: "predict",
      hint: L("A constexpr variable needs every input to be known at compile time. Is n such a constant?", "Una variable constexpr necesita que toda entrada se conozca al compilar. ¿Es n una constante así?", "constexpr 変数の材料はすべてコンパイル時に分かる必要がある。n は定数？"),
      note: "constexpr",
      prompt: COMPILES,
      code: cc(`
        constexpr int fn(int x) { return x; }
        int main() {
          int n = 3;
          constexpr int k = fn(n);
        }`),
      options: [YES, NO_GCC],
      answer: 1,
      check: { compiles: false },
      explain: L("A constexpr variable needs constant inputs: the value of 'n' is not usable in a constant expression.", "Una variable constexpr necesita entradas constantes: the value of 'n' is not usable in a constant expression.", "constexpr 変数には定数が必要。n は定数ではないのでエラー。"),
      win: [{ t: "shake" }],
    },
    say(L(
      "if constexpr picks a branch while compiling and throws the other away. Concepts guard the mold's door.",
      "if constexpr elige una rama al compilar y descarta la otra. Los concepts vigilan la puerta del molde.",
      "if constexpr はコンパイル時に枝を選び、もう片方を捨てる。concept は型枠の門番だ。",
    )),
    {
      kind: "predict",
      hint: L("if constexpr keeps only the branch that fits each T. Which branch does each call get?", "if constexpr solo deja la rama que corresponde a cada T. ¿Qué rama recibe cada llamada?", "if constexpr は T に合う枝だけを残す。各呼び出しはどの枝？"),
      note: "if-constexpr-concepts",
      prompt: PRINT,
      code: cc(`
        template <typename T>
        std::string describe(T x) {
          if constexpr (std::is_integral_v<T>) return "int:" + std::to_string(x);
          else return "other";
        }
        int main() {
          std::cout << describe(4) << " " << describe(std::string("a"));
        }`),
      options: ["int:4 other", "int:4 int:a", L("It doesn't compile", "No compila", "コンパイルできない")],
      answer: 0,
      output: "int:4 other",
      check: { compiles: true, stdout: "int:4 other" },
      explain: L("For std::string the to_string branch is discarded, so it never has to compile for a string.", "Para std::string la rama de to_string se descarta, así que nunca se compila para un string.", "std::string では to_string の枝が捨てられるので、文字列用にコンパイルされない。"),
      win: [{ t: "print", text: "int:4 other" }],
    },
    {
      kind: "predict",
      hint: L("Check that each type passes the guard, then recall how cout prints a double with no fraction.", "Revisa que cada tipo pase el guardia y recuerda cómo imprime cout un double sin decimales.", "各型が門番を通るか確かめ、小数部のない double の cout 表示を思い出そう。"),
      note: "if-constexpr-concepts",
      prompt: PRINT,
      code: cc(`
        template <typename T>
        concept Numeric = std::integral<T> || std::floating_point<T>;

        template <Numeric T>
        T twice(T x) { return x * 2; }

        int main() { std::cout << twice(21) << " " << twice(1.5); }`),
      options: ["42 3", "42 3.0", "21 1.5"],
      answer: 0,
      output: "42 3",
      check: { compiles: true, stdout: "42 3" },
      explain: L("int and double both pass the Numeric guard. cout prints 3.0 as 3.", "int y double pasan el guardia Numeric. cout imprime 3.0 como 3.", "int も double も Numeric を通過。cout は 3.0 を 3 と表示する。"),
      win: [{ t: "print", text: "42 3" }],
    },
    {
      kind: "predict",
      hint: L("Is std::string integral or floating point? The concept is checked right at the call.", "¿std::string es entero o de punto flotante? El concept se revisa en la misma llamada.", "std::string は整数型？浮動小数点型？concept は呼び出しの場所で確かめられる。"),
      note: "if-constexpr-concepts",
      prompt: COMPILES,
      code: cc(`
        template <typename T>
        concept Numeric = std::integral<T> || std::floating_point<T>;

        template <Numeric T>
        T twice(T x) { return x * 2; }

        int main() { twice(std::string("a")); }`),
      options: [YES, NO_GCC],
      answer: 1,
      check: { compiles: false },
      explain: L("std::string is not Numeric, so the guard stops it with a clear 'constraints not satisfied' error.", "std::string no es Numeric, así que el guardia lo frena con un error claro de 'constraints not satisfied'.", "std::string は Numeric ではない。門番が constraints not satisfied で止める。"),
      win: [{ t: "shake" }, { t: "say", actor: "hero", text: L("Halt, string!", "¡Alto, string!", "止まれ string！") }],
    },
    {
      kind: "predict",
      hint: L("The fold applies + across all arguments; sizeof... counts arguments, not their values.", "El fold aplica + a todos los argumentos; sizeof... cuenta argumentos, no sus valores.", "fold は全引数に + を使う。sizeof... は値ではなく個数を数える。"),
      note: "variadic",
      prompt: PRINT,
      code: cc(`
        template <typename... Ts>
        auto sum(Ts... xs) { return (xs + ...); }

        template <typename... Ts>
        int count(Ts...) { return sizeof...(Ts); }

        int main() { std::cout << sum(1, 2, 3, 4) << " " << count(1, "a", 2.0); }`),
      options: ["10 3", "4 3", "10 1"],
      answer: 0,
      output: "10 3",
      check: { compiles: true, stdout: "10 3" },
      explain: L("Ts... takes any number of arguments. The fold (xs + ...) adds them; sizeof... counts them.", "Ts... acepta cualquier cantidad de argumentos. El fold (xs + ...) los suma; sizeof... los cuenta.", "Ts... はいくつでも引数を受ける。(xs + ...) で合計、sizeof... で個数。"),
      win: [{ t: "print", text: "10 3" }],
    },
    {
      kind: "type",
      hint: L("It's the keyword that declares a type parameter in a template header.", "Es la palabra clave que declara un parámetro de tipo en la cabecera de una plantilla.", "テンプレートの頭で型パラメータを宣言するキーワード。"),
      note: "template-deduction",
      prompt: L("Open the mold", "Abre el molde", "型枠を開こう"),
      code: cc(`
        template <___ T>
        T twice(T x) { return x + x; }
        int main() { std::cout << twice(4) << twice(std::string("ab")); }`),
      answer: "typename",
      check: { compiles: true, stdout: "8abab" },
      explain: L("template <typename T> declares the type parameter. (class also works here.)", "template <typename T> declara el parámetro de tipo. (class también sirve aquí.)", "template <typename T> で型パラメータを宣言する（ここでは class も可）。"),
      win: [{ t: "print", text: "8abab" }],
    },
    {
      kind: "run",
      hint: L("With two ints, T is int and the division is integer division. Make T a type with decimals.", "Con dos int, T es int y la división es entera. Haz que T sea un tipo con decimales.", "int 2つだと T は int で整数の割り算。T を小数のある型にしよう。"),
      note: "template-deduction",
      prompt: L("The average of 3 and 4 is 3.5, not 3", "El promedio de 3 y 4 es 3.5, no 3", "3 と 4 の平均は 3 ではなく 3.5"),
      starter: cc(`
        #include <iostream>

        template <typename T>
        T average(T a, T b) { return (a + b) / 2; }

        int main() {
          std::cout << "avg: " << average(3, 4);
        }`) + "\n",
      solution: cc(`
        #include <iostream>

        template <typename T>
        T average(T a, T b) { return (a + b) / 2; }

        int main() {
          std::cout << "avg: " << average<double>(3, 4);
        }`) + "\n",
      expect: "avg: 3.5",
      fallback: [String.raw`average\s*<\s*(double|float)\s*>`, String.raw`average\s*\(\s*3\.\d*f?\s*,\s*4\.?`, String.raw`average\s*\(\s*3\.?\d*f?\s*,\s*4\.\d*`, String.raw`/\s*2\.0`],
      explain: L("T was deduced as int, so the division drops .5. Use average<double>(3, 4) or average(3.0, 4.0).", "T se dedujo como int, y la división pierde el .5. Usa average<double>(3, 4) o average(3.0, 4.0).", "T が int になり、割り算で .5 が消える。average<double>(3, 4) か average(3.0, 4.0) に。"),
    },
  ],
};

const lambdaNotes: NoteDef[] = [
  note("lambda-basics", L("Lambdas: functions on the spot", "Lambdas: funciones al momento", "ラムダ：その場で書く関数"),
    p(
      "A lambda is a small function written right where you need it, with no name of its own. Its shape is [captures](parameters) { body }. You usually store it in an auto variable and then call it with parentheses, exactly like a normal function.",
      "Una lambda es una función pequeña escrita justo donde la necesitas, sin nombre propio. Su forma es [capturas](parámetros) { cuerpo }. Normalmente la guardas en una variable auto y luego la llamas con paréntesis, igual que una función normal.",
      "ラムダは、使う場所にその場で書く名前のない小さな関数。形は [キャプチャ](引数) { 本体 }。ふつうは auto の変数に入れて、ふつうの関数と同じようにかっこで呼ぶ。",
    ),
    ex('auto greet = [](std::string who) { return "hi " + who; };\nstd::cout << greet("Mo") << "|" << greet("Ana");', "hi Mo|hi Ana",
      L("Each call runs the body with fresh parameters", "Cada llamada corre el cuerpo con parámetros nuevos", "呼ぶたびに新しい引数で本体が動く")),
    p(
      "The return type is deduced from the return statement, so you rarely write it. Defining a lambda runs nothing: the body only runs when you call it. Calling it twice runs it twice, each time with the new arguments.",
      "El tipo de retorno se deduce del return, así que casi nunca lo escribes. Definir una lambda no ejecuta nada: el cuerpo solo corre cuando la llamas. Llamarla dos veces la ejecuta dos veces, cada vez con los argumentos nuevos.",
      "戻り値の型は return から推論されるので、ほとんど書かない。ラムダを定義しただけでは何も動かない。本体は呼んだときだけ動き、2回呼べば2回、毎回新しい引数で動く。",
    ),
    p(
      "Common mistake when predicting output: std::cout prints exactly what you send it, nothing more. Two numbers chained with << and no \" \" between them come out glued together.",
      "Error común al predecir la salida: std::cout imprime exactamente lo que le mandas, nada más. Dos números encadenados con << y sin \" \" en medio salen pegados.",
      "出力を予想するときのよくあるミス：std::cout は送ったものだけを表示する。<< でつないだ2つの数の間に \" \" がなければ、くっついて表示される。",
    ),
    ex("auto sq = [](int n) { return n * n; };\nstd::cout << sq(4) << sq(1);", "161",
      L("16 and 1, with no space between them", "16 y 1, sin espacio entre ellos", "16 と 1 が空白なしで並ぶ")),
  ),
  note("captures", L("Captures: copy, reference, mutable", "Capturas: copia, referencia, mutable", "キャプチャ：コピー・参照・mutable"),
    p(
      "A lambda can use local variables only if it CAPTURES them in the [ ]. [x] copies x into the lambda at the moment the lambda is created: a snapshot. [&x] stores a reference to the real x, so the lambda always sees its current value. [=] copies everything used, [&] references everything used.",
      "Una lambda solo puede usar variables locales si las CAPTURA en los [ ]. [x] copia x dentro de la lambda en el momento en que se crea: una foto. [&x] guarda una referencia al x real, así que la lambda siempre ve su valor actual. [=] copia todo lo usado y [&] referencia todo lo usado.",
      "ラムダがローカル変数を使えるのは [ ] でキャプチャしたときだけ。[x] はラムダを作った瞬間に x をコピーする（写真のようなもの）。[&x] は本物の x への参照を持ち、いつも今の値を見る。[=] は使うもの全部をコピー、[&] は全部を参照。",
    ),
    ex('int bonus = 10;\nauto snap = [bonus] { return bonus; };\nauto live = [&bonus] { return bonus; };\nbonus = 20;\nstd::cout << snap() << " " << live();', "10 20",
      L("The copy was taken before the change; the reference sees it", "La copia se tomó antes del cambio; la referencia lo ve", "コピーは変更前に取られ、参照は変更を見る")),
    p(
      "A by-value capture is read-only inside the lambda: trying to change it is a compile error (\"read-only variable\"). Adding mutable after the parameters lets the lambda change ITS OWN copy. That copy lives inside the lambda and keeps its value between calls, but the outside variable never changes.",
      "Una captura por valor es de solo lectura dentro de la lambda: intentar cambiarla es error de compilación (\"read-only variable\"). Agregar mutable después de los parámetros deja que la lambda cambie SU PROPIA copia. Esa copia vive dentro de la lambda y conserva su valor entre llamadas, pero la variable de afuera nunca cambia.",
      "値キャプチャはラムダの中では読み取り専用で、変えようとするとコンパイルエラー（read-only variable）。引数のあとに mutable をつけると、ラムダは自分のコピーを変えられる。そのコピーはラムダの中に住み、呼び出しの間も値を保つが、外の変数は変わらない。",
    ),
    ex('int steps = 100;\nauto walk = [steps]() mutable { return ++steps; };\nwalk();\nstd::cout << walk() << " " << steps;', "102 100",
      L("The lambda's copy counts on; the original stays put", "La copia de la lambda sigue contando; el original no cambia", "ラムダのコピーは数え続け、元はそのまま")),
    p(
      "To change the real variable, capture it by reference. But a reference is only safe while the variable is alive. A lambda returned from a function that captured a local by reference holds a reference to a dead variable: calling it is undefined behavior. Lambdas that outlive their scope should capture by value.",
      "Para cambiar la variable real, captúrala por referencia. Pero una referencia solo es segura mientras la variable vive. Una lambda devuelta por una función que capturó un local por referencia guarda una referencia a una variable muerta: llamarla es comportamiento indefinido. Las lambdas que sobreviven a su ámbito deben capturar por valor.",
      "本物の変数を変えたいなら参照でキャプチャする。ただし参照は変数が生きている間だけ安全。ローカル変数を参照でキャプチャしたラムダを関数から返すと、消えた変数への参照が残り、呼ぶと未定義動作。スコープより長生きするラムダは値でキャプチャしよう。",
    ),
    ubEx(cc(`
      auto makeTimer() {
        int ticks = 3;
        return [&ticks] { return ticks; };  // ticks dies at the }
      }`), neverRun("std::cout << makeTimer()();", "auto makeTimer() {\n    int ticks = 3;\n    return [&ticks] { return ticks; };\n}"),
      L("Compiles, but calling the result is UB: capture [ticks] instead", "Compila, pero llamar al resultado es UB: captura [ticks]", "コンパイルは通るが呼ぶと UB。[ticks] にしよう")),
  ),
  note("stl-algorithms", L("STL algorithms with lambdas", "Algoritmos STL con lambdas", "ラムダと STL アルゴリズム"),
    p(
      "The <algorithm> and <numeric> headers have ready-made loops that take a range (begin, end) and often a rule as a lambda. std::sort takes a comparator: it returns true when a must come BEFORE b. a < b sorts small to big; a > b, big to small. std::count_if counts the elements for which the lambda returns true.",
      "Los encabezados <algorithm> y <numeric> traen bucles listos que reciben un rango (begin, end) y a menudo una regla como lambda. std::sort recibe un comparador: devuelve true cuando a debe ir ANTES que b. a < b ordena de menor a mayor; a > b, de mayor a menor. std::count_if cuenta los elementos donde la lambda devuelve true.",
      "<algorithm> と <numeric> には、範囲（begin, end）と、たいていルールのラムダを受け取る既製のループがある。std::sort の比較関数は「a が b より前に来るとき true」を返す。a < b なら小さい順、a > b なら大きい順。std::count_if はラムダが true を返す要素を数える。",
    ),
    ex(cc(`
      std::vector<std::string> names{"kim", "al", "beatrice"};
      std::sort(names.begin(), names.end(),
                [](const std::string& a, const std::string& b) { return a.size() < b.size(); });
      for (const auto& n : names) std::cout << n << " ";`), "al kim beatrice",
      L("The comparator decides the order: shortest names first", "El comparador decide el orden: nombres cortos primero", "比較関数が順番を決める：短い名前が先")),
    p(
      "std::accumulate(begin, end, start) adds everything to start. The TYPE of start is the type of the running total: with an int start, every partial sum is converted back to int and fractions are lost. For doubles, start with 0.0.",
      "std::accumulate(begin, end, inicio) suma todo a inicio. El TIPO de inicio es el tipo del total acumulado: con un inicio int, cada suma parcial se vuelve a convertir a int y se pierden los decimales. Para double, empieza con 0.0.",
      "std::accumulate(begin, end, 初期値) は全部を初期値に足していく。初期値の「型」が合計の型になる。int で始めると途中の合計が毎回 int に戻され、小数は消える。double なら 0.0 から始めよう。",
    ),
    ex("std::vector<double> prices{1.25, 2.5};\nstd::cout << std::accumulate(prices.begin(), prices.end(), 0.0);", "3.75"),
    p(
      "std::remove does NOT shrink a vector: it moves the kept elements to the front and returns an iterator to the new logical end. The size stays the same until you call erase from that iterator to end(). In C++20, std::erase(v, value) does both steps in one call.",
      "std::remove NO achica un vector: mueve los elementos que quedan al frente y devuelve un iterador al nuevo final lógico. El tamaño sigue igual hasta que llamas a erase desde ese iterador hasta end(). En C++20, std::erase(v, valor) hace ambos pasos en una llamada.",
      "std::remove は vector を縮めない。残す要素を前に寄せ、新しい論理的な終わりを指すイテレータを返すだけ。そこから end() まで erase するまでサイズは変わらない。C++20 の std::erase(v, 値) なら一度で両方できる。",
    ),
    ex(cc(`
      std::vector<int> v{7, 0, 7, 1};
      auto it = std::remove(v.begin(), v.end(), 7);
      v.erase(it, v.end());
      std::cout << v.size() << " " << v[0] << v[1];`), "2 01",
      L("The remove-erase idiom: move the keepers, then cut the tail", "El idioma remove-erase: mover lo que queda y cortar la cola", "remove-erase イディオム：寄せてから後ろを切る")),
  ),
  note("std-map", L("std::map: sorted keys and []", "std::map: claves ordenadas y []", "std::map：並んだキーと []"),
    p(
      "std::map stores key/value pairs in a sorted tree. Looping over it always visits the keys in ascending order, no matter the order you inserted them. std::unordered_map is a hash table: faster lookups, but its loop order is not specified, so never rely on it.",
      "std::map guarda pares clave/valor en un árbol ordenado. Recorrerlo siempre visita las claves en orden ascendente, sin importar el orden en que las insertaste. std::unordered_map es una tabla hash: búsquedas más rápidas, pero su orden de recorrido no está especificado, así que nunca dependas de él.",
      "std::map はキーと値の組をソートされた木に入れる。ループすると、入れた順番に関係なく、いつもキーの小さい順に回る。std::unordered_map はハッシュ表で検索は速いが、ループの順番は決まっていないので頼ってはいけない。",
    ),
    ex('std::map<int, std::string> podium{{3, "bronze"}, {1, "gold"}, {2, "silver"}};\nfor (const auto& [place, medal] : podium) std::cout << place << medal << " ";', "1gold 2silver 3bronze",
      L("Inserted out of order, visited in key order", "Insertados en desorden, recorridos por clave", "バラバラに入れてもキー順に回る")),
    p(
      "m[key] is not just a lookup: if the key is missing, it INSERTS it with a default value (0 for int, empty for string) and returns that. So merely reading m[\"x\"] can grow the map. To only ask, use m.contains(key) (C++20), m.count(key) or m.find(key), which never insert.",
      "m[clave] no es solo una búsqueda: si la clave falta, la INSERTA con un valor por defecto (0 para int, vacío para string) y lo devuelve. Así que solo leer m[\"x\"] puede agrandar el mapa. Para solo preguntar, usa m.contains(clave) (C++20), m.count(clave) o m.find(clave), que nunca insertan.",
      "m[key] はただの検索ではない。キーがなければ標準値（int なら 0、string なら空）で「追加」してから返す。だから m[\"x\"] を読むだけで map が増えることがある。確認だけなら、追加しない m.contains(key)（C++20）、m.count(key)、m.find(key) を使おう。",
    ),
    ex('std::map<std::string, int> stock;\nstd::cout << stock.contains("axe") << stock.size() << " ";\nint n = stock["axe"];\nstd::cout << n << stock.size();', "00 01",
      L("contains only looks; [] created the key", "contains solo mira; [] creó la clave", "contains は見るだけ、[] はキーを作った")),
  ),
];

// ─── 4.2 Lambda scrolls and the STL ────────────────────────────────────────
const lambdas: LessonDef = {
  slug: "lambda-scrolls",
  title: L("Lambda scrolls", "Pergaminos lambda", "ラムダの巻物"),
  concept: "lambdas",
  mode: "lesson",
  xp: 80,
  enemy: "cpp/dangling-wraith",
  enemyName: L("CAPTURE WRAITH", "ESPECTRO CAPTURA", "キャプチャレイス"),
  notes: lambdaNotes,
  beats: [
    say(L(
      "A LAMBDA is a function you write right where you need it: [captures](params) { body }.",
      "Una LAMBDA es una función escrita justo donde la necesitas: [capturas](parámetros) { cuerpo }.",
      "ラムダは使う場所でその場に書く関数：[キャプチャ](引数) { 本体 }。",
    )),
    {
      kind: "act",
      prompt: L("Write a lambda scroll and read it", "Escribe un pergamino lambda y léelo", "ラムダの巻物を書いて読もう"),
      steps: [
        { label: L("WRITE", "ESCRIBIR", "書く"), line: "auto add = [](int a, int b) { return a + b; };", effects: [{ t: "item", kind: "key", holder: "hero" }, { t: "tag", actor: "hero", text: "add" }] },
        { label: L("CALL", "LLAMAR", "呼ぶ"), line: "std::cout << add(2, 3);", effects: [{ t: "value", actor: "hero", text: "5" }, { t: "attack", from: "hero", to: "enemy" }, { t: "print", text: "5" }], output: "5" },
      ],
    },
    {
      kind: "predict",
      hint: L("Run the body once per call with that call's a and b. Is anything printed between the results?", "Corre el cuerpo una vez por llamada con sus a y b. ¿Se imprime algo entre los resultados?", "呼び出しごとにその a と b で本体を動かす。結果の間に何か表示される？"),
      note: "lambda-basics",
      prompt: PRINT,
      code: "auto add = [](int a, int b) { return a + b; };\nstd::cout << add(2, 3) << add(10, -4);",
      options: ["56", "5 6", "23"],
      answer: 0,
      output: "56",
      check: { compiles: true, stdout: "56" },
      explain: L("Each call runs the body with new a and b: 5, then 6, printed with no space.", "Cada llamada corre el cuerpo con a y b nuevos: 5 y luego 6, sin espacio.", "呼ぶたびに新しい a と b で動く。5 と 6 が空白なしで表示される。"),
      win: [{ t: "print", text: "56" }],
    },
    say(L(
      "[x] copies x into the lambda's backpack when it is made. [&x] carries a reference to the real x.",
      "[x] copia x en la mochila de la lambda al crearla. [&x] lleva una referencia al x real.",
      "[x] は作った瞬間に x をリュックにコピー。[&x] は本物の x への参照を持つ。",
    )),
    {
      kind: "predict",
      hint: L("One lambda took a snapshot when it was made; the other looks at the real variable when called.", "Una lambda tomó una foto al crearse; la otra mira la variable real al llamarse.", "片方は作ったときの写し、もう片方は呼んだときの本物を見る。"),
      note: "captures",
      prompt: PRINT,
      code: "int x = 1;\nauto byVal = [x] { return x; };\nauto byRef = [&x] { return x; };\nx = 5;\nstd::cout << byVal() << byRef();",
      options: ["15", "55", "11"],
      answer: 0,
      output: "15",
      check: { compiles: true, stdout: "15" },
      explain: L("byVal kept a snapshot of 1. byRef looks at the real x, which is now 5.", "byVal guardó una foto del 1. byRef mira el x real, que ahora vale 5.", "byVal は 1 の写しを持つ。byRef は本物の x（今は 5）を見る。"),
      setup: [{ t: "tag", actor: "hero", text: "x", value: "1" }],
      win: [{ t: "value", actor: "hero", text: "5" }, { t: "print", text: "15" }],
    },
    {
      kind: "predict",
      hint: L("Can a lambda change a variable it captured by value, without an extra keyword?", "¿Puede una lambda cambiar una variable capturada por valor sin una palabra extra?", "値でキャプチャした変数を、追加のキーワードなしで変えられる？"),
      note: "captures",
      prompt: COMPILES,
      code: "int n = 0;\nauto inc = [n] { ++n; };",
      options: [YES, NO_GCC],
      answer: 1,
      check: { compiles: false },
      explain: L("A by-value capture is read-only by default: increment of read-only variable 'n'.", "Una captura por valor es de solo lectura por defecto: increment of read-only variable 'n'.", "値キャプチャは標準で読み取り専用：increment of read-only variable 'n'。"),
      win: [{ t: "shake" }],
    },
    say(L(
      "mutable lets the lambda change ITS OWN copy. The outside variable never sees it.",
      "mutable deja que la lambda cambie SU PROPIA copia. La variable de afuera nunca se entera.",
      "mutable をつけると、ラムダは自分のコピーを変えられる。外の変数は変わらない。",
    )),
    {
      kind: "predict",
      hint: L("mutable changes the lambda's own copy, which keeps its value between calls. Count the calls.", "mutable cambia la copia propia de la lambda, que conserva su valor entre llamadas. Cuenta las llamadas.", "mutable はラムダ自身のコピーを変え、値は呼び出し間で残る。回数を数えよう。"),
      note: "captures",
      prompt: PRINT,
      code: "int n = 0;\nauto inc = [n]() mutable { return ++n; };\ninc();\ninc();\nstd::cout << inc() << n;",
      options: ["30", "33", "10"],
      answer: 0,
      output: "30",
      check: { compiles: true, stdout: "30" },
      explain: L("The backpack copy counts 1, 2, 3. The outer n stays 0.", "La copia de la mochila cuenta 1, 2, 3. El n de afuera sigue en 0.", "リュックのコピーが 1, 2, 3 と数える。外の n は 0 のまま。"),
      win: [{ t: "print", text: "30" }],
    },
    say(L(
      "Lambdas shine with STL algorithms: std::sort, count_if, find_if, transform... you pass the rule as a lambda.",
      "Las lambdas brillan con los algoritmos STL: std::sort, count_if, find_if, transform... pasas la regla como lambda.",
      "ラムダは STL アルゴリズムで大活躍。std::sort や count_if にルールをラムダで渡す。",
    )),
    {
      kind: "pick",
      hint: L("The comparator returns true when a should come before b. Which sign puts bigger numbers first?", "El comparador devuelve true cuando a debe ir antes que b. ¿Qué signo pone primero los grandes?", "比較関数は a が b より前のとき true。大きい数を先にする記号は？"),
      note: "stl-algorithms",
      prompt: L("Sort from big to small", "Ordena de mayor a menor", "大きい順に並べよう"),
      code: "std::vector<int> v{3, 1, 2};\nstd::sort(v.begin(), v.end(), [](int a, int b) { return a ___ b; });\nfor (int x : v) std::cout << x;",
      options: [">", "<"],
      answer: 0,
      check: { compiles: true, stdout: "321" },
      explain: L("The comparator says when a goes before b. a > b puts big numbers first; < would give 123.", "El comparador dice cuándo a va antes que b. a > b pone primero los grandes; < daría 123.", "比較関数は a が b の前に来る条件。a > b で大きい順、< なら 123 になる。"),
      win: [{ t: "print", text: "321" }],
    },
    {
      kind: "predict",
      hint: L("count_if counts the elements for which the lambda returns true. Which numbers pass the test?", "count_if cuenta los elementos donde la lambda devuelve true. ¿Qué números pasan la prueba?", "count_if はラムダが true を返す要素を数える。合格する数は？"),
      note: "stl-algorithms",
      prompt: PRINT,
      code: "std::vector<int> v{1, 2, 3, 4, 5, 6};\nstd::cout << std::count_if(v.begin(), v.end(),\n                           [](int x) { return x % 2 == 0; });",
      options: ["3", "6", "21"],
      answer: 0,
      output: "3",
      check: { compiles: true, stdout: "3" },
      explain: L("count_if counts the elements where the lambda says true: 2, 4 and 6.", "count_if cuenta los elementos donde la lambda dice true: 2, 4 y 6.", "count_if はラムダが true を返す要素を数える：2、4、6。"),
      win: [{ t: "print", text: "3" }],
    },
    {
      kind: "predict",
      hint: L("The type of the starting value is the type of the running total. What happens to 0.5 in an int?", "El tipo del valor inicial es el tipo del total. ¿Qué le pasa a 0.5 en un int?", "初期値の型が合計の型になる。0.5 を int に入れるとどうなる？"),
      note: "stl-algorithms",
      prompt: PRINT,
      code: "std::vector<double> v{0.5, 0.5, 0.5};\nstd::cout << std::accumulate(v.begin(), v.end(), 0) << \" \"\n          << std::accumulate(v.begin(), v.end(), 0.0);",
      options: ["0 1.5", "1.5 1.5", "1 1.5"],
      answer: 0,
      output: "0 1.5",
      check: { compiles: true, stdout: "0 1.5" },
      explain: L("The start value picks the sum type. 0 is an int, so each step is cut back to 0. Use 0.0.", "El valor inicial elige el tipo de la suma. 0 es int, así que cada paso se recorta a 0. Usa 0.0.", "初期値が合計の型を決める。0 は int なので毎回 0 に切られる。0.0 を使おう。"),
      win: [{ t: "print", text: "0 1.5" }],
    },
    say(L(
      "std::map keeps keys sorted. Careful: m[key] on a missing key INSERTS a default value.",
      "std::map mantiene las claves ordenadas. Ojo: m[clave] con una clave que falta INSERTA un valor por defecto.",
      "std::map はキーを順番に保つ。注意：ないキーで m[key] を使うと、標準値が追加される。",
    )),
    {
      kind: "predict",
      hint: L("std::map is a sorted tree. Does insertion order matter when you loop over it?", "std::map es un árbol ordenado. ¿Importa el orden de inserción al recorrerlo?", "std::map はソートされた木。ループするとき入れた順番は関係ある？"),
      note: "std-map",
      prompt: PRINT,
      code: 'std::map<std::string, int> m{{"b", 2}, {"a", 1}, {"c", 3}};\nfor (const auto& [k, v] : m) std::cout << k << v;',
      options: ["a1b2c3", "b2a1c3", "c3b2a1"],
      answer: 0,
      output: "a1b2c3",
      check: { compiles: true, stdout: "a1b2c3" },
      explain: L("std::map is a sorted tree: it walks keys in order. unordered_map has no fixed order.", "std::map es un árbol ordenado: recorre las claves en orden. unordered_map no tiene orden fijo.", "std::map はソートされた木で、キー順にたどる。unordered_map は順番が決まらない。"),
      win: [{ t: "print", text: "a1b2c3" }],
    },
    {
      kind: "predict",
      hint: L("What does [] do when the key is missing? It does more than just look.", "¿Qué hace [] cuando falta la clave? Hace algo más que mirar.", "キーがないとき [] は何をする？見るだけではない。"),
      note: "std-map",
      prompt: PRINT,
      code: 'std::map<std::string, int> m;\nif (m["ghost"] == 0) std::cout << m.size();',
      options: ["1", "0", L("Nothing", "Nada", "何も出ない")],
      answer: 0,
      output: "1",
      check: { compiles: true, stdout: "1" },
      explain: L("Just looking with [] created \"ghost\" with value 0. Use find or contains to only check.", "Solo mirar con [] creó \"ghost\" con valor 0. Usa find o contains para solo revisar.", "[] で見ただけで \"ghost\" が値 0 で作られた。確認だけなら find か contains を。"),
      win: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "ghost", value: "0" }, { t: "print", text: "1" }],
    },
    {
      kind: "predict",
      hint: L("std::remove moves elements but never changes the size. Only one of the two calls shrinks it.", "std::remove mueve elementos pero nunca cambia el tamaño. Solo una de las dos llamadas lo achica.", "std::remove は要素を動かすがサイズは変えない。縮めるのは片方だけ。"),
      note: "stl-algorithms",
      prompt: PRINT,
      code: "std::vector<int> v{1, 2, 3, 2};\nauto it = std::remove(v.begin(), v.end(), 2);\nstd::cout << v.size() << \" \";\nv.erase(it, v.end());\nstd::cout << v.size();",
      options: ["4 2", "2 2", "3 2"],
      answer: 0,
      output: "4 2",
      check: { compiles: true, stdout: "4 2" },
      explain: L("std::remove only moves the keepers forward; erase really shrinks it. C++20: std::erase(v, 2).", "std::remove solo mueve adelante lo que se queda; erase lo achica de verdad. C++20: std::erase(v, 2).", "std::remove は残す要素を前に寄せるだけ。erase で本当に縮む。C++20 なら std::erase(v, 2)。"),
      win: [{ t: "print", text: "4 2" }],
    },
    {
      kind: "predict",
      hint: L("When does hp stop existing, and what does a reference capture hold after that?", "¿Cuándo deja de existir hp y qué guarda una captura por referencia después?", "hp はいつ消える？その後、参照キャプチャは何を持っている？"),
      note: "captures",
      prompt: SAFE,
      code: "auto make() {\n  int hp = 5;\n  return [&hp] { return hp; };\n}\nint main() { std::cout << make()(); }",
      options: [
        L("No: hp is dead, it dangles", "No: hp murió, queda colgando", "いいえ：hp は消えて宙ぶらりん"),
        L("Yes: prints 5", "Sí: imprime 5", "はい：5 と表示"),
      ],
      answer: 0,
      check: { compiles: true, program: neverRun("std::cout << make()();", "auto make() {\n    int hp = 5;\n    return [&hp] { return hp; };\n}") },
      explain: L("hp dies when make returns, but the lambda still holds a reference to it: UB. Capture by value: [hp].", "hp muere al volver make, pero la lambda aún guarda una referencia a él: UB. Captura por valor: [hp].", "make が終わると hp は消えるのに、ラムダは参照を持ったまま：UB。[hp] で値キャプチャしよう。"),
      win: [{ t: "dead", actor: "hero" }, { t: "banner", text: L("UB!", "¡UB!", "UB！") }],
    },
    {
      kind: "run",
      hint: L("A by-value capture changes only the lambda's copy. How would the lambda reach the real hits?", "Una captura por valor cambia solo la copia de la lambda. ¿Cómo llegaría la lambda al hits real?", "値キャプチャはラムダのコピーだけを変える。本物の hits に届くには？"),
      note: "captures",
      prompt: L("Count both hits: it must print hits: 2", "Cuenta ambos golpes: debe imprimir hits: 2", "2回分数えて hits: 2 と表示しよう"),
      starter: cc(`
        #include <iostream>

        int main() {
          int hits = 0;
          auto hit = [hits]() mutable { hits++; };
          hit();
          hit();
          std::cout << "hits: " << hits;
        }`) + "\n",
      solution: cc(`
        #include <iostream>

        int main() {
          int hits = 0;
          auto hit = [&hits]() { hits++; };
          hit();
          hit();
          std::cout << "hits: " << hits;
        }`) + "\n",
      expect: "hits: 2",
      fallback: [String.raw`\[\s*&\s*hits\s*\]`, String.raw`\[\s*&\s*\]`],
      explain: L("[hits] mutable only bumps the lambda's own copy. Capture by reference: [&hits].", "[hits] mutable solo sube la copia de la lambda. Captura por referencia: [&hits].", "[hits] mutable はラムダのコピーを増やすだけ。参照でキャプチャしよう：[&hits]。"),
    },
  ],
};

const relicNotes: NoteDef[] = [
  note("structured-bindings", L("Structured bindings and if-init", "Structured bindings e if con inicio", "構造化束縛と初期化つき if"),
    p(
      "auto [a, b] = thing; unpacks a pair, a tuple or a simple struct into named pieces in one line. It is great in loops over maps: for (const auto& [key, value] : m). The names are new; they don't have to match the member names.",
      "auto [a, b] = cosa; desarma un pair, una tupla o un struct simple en piezas con nombre en una línea. Es genial en bucles sobre mapas: for (const auto& [clave, valor] : m). Los nombres son nuevos; no tienen que coincidir con los de los miembros.",
      "auto [a, b] = thing; は pair、tuple、単純な構造体を一行で名前つきの部品にほどく。map のループで大活躍：for (const auto& [key, value] : m)。名前は新しく付けるもので、メンバー名と同じでなくてよい。",
    ),
    p(
      "The keyword in front decides what you unpack. Plain auto [..] first makes a hidden COPY of the whole object and binds the names to the copy, so changing them leaves the original alone. auto& [..] binds to the original object itself, so changes go through.",
      "La palabra de adelante decide qué desarmas. auto [..] solo hace primero una COPIA oculta del objeto entero y ata los nombres a esa copia, así que cambiarlos no toca el original. auto& [..] se ata al objeto original, así que los cambios llegan.",
      "前に書くキーワードで何をほどくかが決まる。ただの auto [..] は、まず全体の隠れた「コピー」を作り、名前をコピーに結びつける。だから変えても元は変わらない。auto& [..] は元のオブジェクトそのものに結びつくので、変更が届く。",
    ),
    ex(cc(`
      std::pair<std::string, int> hero{"Lin", 7};
      auto [n1, lvl1] = hero;
      lvl1 = 100;
      auto& [n2, lvl2] = hero;
      lvl2 = 8;
      std::cout << hero.second;`), "8",
      L("Only the auto& binding reaches the real pair", "Solo el auto& llega al pair real", "auto& の束縛だけが本物の pair に届く")),
    p(
      "C++17 lets if declare a variable before the condition: if (init; condition). The variable exists only inside the if and its else. It pairs well with map insert, which returns a pair {iterator, bool}: the bool says whether it inserted. insert never overwrites an existing key; the iterator then points at the old element.",
      "C++17 deja que if declare una variable antes de la condición: if (inicio; condición). La variable existe solo dentro del if y su else. Combina bien con insert de map, que devuelve un par {iterador, bool}: el bool dice si insertó. insert nunca sobrescribe una clave existente; entonces el iterador apunta al elemento viejo.",
      "C++17 では if の条件の前で変数を宣言できる：if (初期化; 条件)。その変数は if と else の中だけで使える。map の insert と相性がよい。insert は {イテレータ, bool} を返し、bool は追加したかどうか。既存のキーは上書きせず、イテレータは元の要素を指す。",
    ),
    ex(cc(`
      std::map<int, std::string> seats{{4, "Ana"}};
      if (auto [it, added] = seats.insert({4, "Bo"}); added) std::cout << "new";
      else std::cout << "kept " << it->second;`), "kept Ana"),
  ),
  note("optional", L("std::optional: maybe a value", "std::optional: quizá un valor", "std::optional：値があるかも"),
    p(
      "std::optional<T> is a box that either holds one T or is empty (std::nullopt). It's the honest return type for \"this might not find anything\", instead of a magic value like -1. A function returns a T to fill it, or std::nullopt to leave it empty.",
      "std::optional<T> es una caja que guarda un T o está vacía (std::nullopt). Es el tipo de retorno honesto para \"puede que no encuentre nada\", en vez de un valor mágico como -1. Una función devuelve un T para llenarla o std::nullopt para dejarla vacía.",
      "std::optional<T> は T をひとつ入れるか、空（std::nullopt）の箱。「見つからないかも」を -1 のような魔法の値ではなく正直に表す戻り値の型。関数は T を返せば中身あり、std::nullopt を返せば空になる。",
    ),
    ex(cc(`
      std::optional<int> digit(char c) {
        if (c >= '0' && c <= '9') return c - '0';
        return std::nullopt;
      }
      int main() {
        std::cout << digit('4').value_or(-1) << " " << digit('z').value_or(-1)
                  << " " << digit('z').has_value();
      }`), "4 -1 0",
      L("value_or gives the fallback only when the box is empty", "value_or da el reemplazo solo si la caja está vacía", "value_or は空のときだけ代わりの値を返す")),
    p(
      "To look inside: has_value() (or just if (opt)) says whether it's full; value_or(x) gives the value or x if empty; *opt and opt-> reach the value directly, like a pointer. Printing a bool with cout shows 1 or 0.",
      "Para mirar adentro: has_value() (o solo if (opt)) dice si está llena; value_or(x) da el valor o x si está vacía; *opt y opt-> llegan directo al valor, como un puntero. Imprimir un bool con cout muestra 1 o 0.",
      "中を見る方法：has_value()（または if (opt)）で中身があるか分かる。value_or(x) は値か、空なら x。*opt と opt-> はポインタのように直接値に届く。bool を cout で表示すると 1 か 0。",
    ),
    ex('std::optional<std::string> title;\nif (!title) std::cout << "none ";\ntitle = "Lady";\nstd::cout << *title << title->length();', "none Lady4"),
    p(
      "Common mistake: using *opt on an empty optional. That is undefined behavior, not an error message. Check first, or use value(), which throws std::bad_optional_access when empty, or value_or for a safe default.",
      "Error común: usar *opt en un optional vacío. Eso es comportamiento indefinido, no un mensaje de error. Revisa primero, o usa value(), que lanza std::bad_optional_access si está vacío, o value_or para un valor seguro.",
      "よくあるミス：空の optional に *opt を使うこと。エラーメッセージではなく未定義動作になる。先に確かめるか、空なら std::bad_optional_access を投げる value()、または安全な value_or を使おう。",
    ),
  ),
  note("variant", L("std::variant: one of several types", "std::variant: uno de varios tipos", "std::variant：複数の型のどれか"),
    p(
      "std::variant<A, B, C> holds exactly ONE value at a time, of one of the listed types, like a slot that can take different shapes. Assigning a value of another type replaces the old one. index() tells which type is inside, counting from 0 in the order of the list.",
      "std::variant<A, B, C> guarda exactamente UN valor a la vez, de uno de los tipos de la lista, como una ranura que acepta distintas formas. Asignar un valor de otro tipo reemplaza al anterior. index() dice qué tipo hay adentro, contando desde 0 en el orden de la lista.",
      "std::variant<A, B, C> は、並べた型のどれか「ひとつ」の値だけを持つ。形を変えられるスロットのようなもの。別の型の値を代入すると前の値と入れかわる。index() は中の型が何番目か（リストの順で 0 から）を返す。",
    ),
    ex('std::variant<double, char, std::string> slot = \'k\';\nstd::cout << slot.index() << " ";\nslot = 2.5;\nstd::cout << slot.index() << " " << std::get<double>(slot);', "1 0 2.5",
      L("char is the second type (index 1), double the first (0)", "char es el segundo tipo (índice 1), double el primero (0)", "char は2番目（index 1）、double は1番目（0）")),
    p(
      "std::get<T>(v) gives the value if v currently holds a T. If it holds another type, it throws std::bad_variant_access, which you can catch. To check without exceptions, use std::holds_alternative<T>(v), or std::get_if<T>(&v), which returns nullptr when the type doesn't match.",
      "std::get<T>(v) da el valor si v guarda un T en ese momento. Si guarda otro tipo, lanza std::bad_variant_access, que puedes atrapar. Para revisar sin excepciones, usa std::holds_alternative<T>(v) o std::get_if<T>(&v), que devuelve nullptr si el tipo no coincide.",
      "std::get<T>(v) は、v が今 T を持っていれば値を返す。別の型なら std::bad_variant_access を投げ、catch できる。例外なしで確かめるなら std::holds_alternative<T>(v) か、型が違うと nullptr を返す std::get_if<T>(&v) を使う。",
    ),
    ex('std::variant<double, char> cell = 1.5;\ntry {\n  std::get<char>(cell);\n} catch (const std::bad_variant_access&) {\n  std::cout << "not a char";\n}', "not a char"),
  ),
  note("string-view", L("std::string_view: a window", "std::string_view: una ventana", "std::string_view：のぞき窓"),
    p(
      "std::string_view is a pointer plus a length looking at characters owned by someone else. It doesn't copy or own the text, so passing it around is cheap. substr on a view makes a smaller view, still without copying, and the original view keeps its full size.",
      "std::string_view es un puntero más una longitud que mira caracteres de otro dueño. No copia ni posee el texto, así que pasarla es barato. substr sobre una vista crea una vista más chica, también sin copiar, y la vista original conserva su tamaño completo.",
      "std::string_view は「ポインタ＋長さ」で、他人が持つ文字をのぞく。文字列をコピーも所有もしないので、渡すのが軽い。ビューの substr はコピーせずに小さいビューを作り、元のビューは全体の長さのまま。",
    ),
    ex('std::string_view word = "castle";\nstd::cout << word.substr(2, 3) << " " << word.size();', "stl 6",
      L("substr(start, count): 3 chars from index 2", "substr(inicio, cantidad): 3 caracteres desde el índice 2", "substr(開始, 個数)：位置 2 から3文字")),
    p(
      "The danger: a view is only valid while the text it looks at is alive. A temporary std::string, like the result of a function or of +, dies at the end of the full statement. A view made from it points at freed memory, and reading it is undefined behavior. Keep the string in a named variable first.",
      "El peligro: una vista solo es válida mientras vive el texto que mira. Un std::string temporal, como el resultado de una función o de +, muere al final de la instrucción completa. Una vista creada con él apunta a memoria liberada, y leerla es comportamiento indefinido. Guarda primero el string en una variable con nombre.",
      "危険な点：ビューは見ている文字列が生きている間だけ有効。関数の結果や + の結果のような一時的な std::string は、文の終わりで消える。それから作ったビューは解放済みメモリを指し、読むと未定義動作。まず名前つきの変数に string を入れよう。",
    ),
    ubEx(cc(`
      std::string makeName() { return "Rook"; }
      // ...
      std::string_view v = makeName();  // the temporary dies here
      std::cout << v;`),
      neverRun("std::string_view v = makeName();\nstd::cout << v;", "std::string makeName() { return \"Rook\"; }"),
      L("Compiles, but reading v is UB", "Compila, pero leer v es UB", "コンパイルは通るが v を読むと UB")),
    ex(cc(`
      std::string makeName() { return "Rook"; }
      int main() {
        std::string name = makeName();
        std::string_view v = name;
        std::cout << v;
      }`), "Rook",
      L("Safe: the string outlives the view", "Seguro: el string vive más que la vista", "安全：文字列がビューより長生き")),
  ),
  note("auto-and-braces", L("auto, auto& and braces", "auto, auto& y llaves", "auto・auto&・波かっこ"),
    p(
      "auto x = expr; makes a fresh COPY and drops a top-level const: copying a const int gives a plain int you may change. auto& x = expr; makes a reference and keeps the const, because a reference to something const must stay const. So auto& to a const value can't be assigned to.",
      "auto x = expr; crea una COPIA nueva y quita el const de arriba: copiar un const int da un int común que puedes cambiar. auto& x = expr; crea una referencia y conserva el const, porque una referencia a algo const debe seguir siendo const. Así que no puedes asignar a un auto& de un valor const.",
      "auto x = 式; は新しい「コピー」を作り、一番上の const を外す。const int をコピーすると変更できるふつうの int になる。auto& x = 式; は参照を作り const を残す。const なものへの参照は const のままだから。const な値への auto& には代入できない。",
    ),
    ex('const int limit = 9;\nauto copy = limit;\ncopy = 10;\nstd::cout << copy << limit;', "109",
      L("A copy is free to change; the const original is untouched", "La copia puede cambiar; el original const no se toca", "コピーは変更できる。const の元はそのまま")),
    bad('const std::string tag = "a";\nauto& ref = tag;\nref = "b";',
      L("Does not compile: ref is a const std::string&", "No compila: ref es un const std::string&", "コンパイル不可：ref は const std::string&")),
    p(
      "Braces and parentheses build containers differently. std::vector<int> v{3, 7}; is a LIST of the items 3 and 7. std::vector<int> v(3, 7); calls the constructor (count, value): three copies of 7. When a type accepts a list, braces always prefer the list.",
      "Las llaves y los paréntesis arman contenedores distinto. std::vector<int> v{3, 7}; es una LISTA con los elementos 3 y 7. std::vector<int> v(3, 7); llama al constructor (cantidad, valor): tres copias de 7. Cuando un tipo acepta una lista, las llaves siempre prefieren la lista.",
      "波かっこと丸かっこでコンテナの作り方が変わる。std::vector<int> v{3, 7}; は 3 と 7 の「リスト」。std::vector<int> v(3, 7); は（個数, 値）のコンストラクタで、7 が3個。リストを受け取れる型では、波かっこはいつもリストを優先する。",
    ),
    ex('std::vector<int> a{3, 7};\nstd::vector<int> b(3, 7);\nstd::cout << a.size() << " " << b.size() << b[2];', "2 37",
      L("a holds 3 and 7; b holds 7, 7, 7", "a guarda 3 y 7; b guarda 7, 7, 7", "a は 3 と 7、b は 7, 7, 7")),
  ),
  note("ranges", L("C++20 ranges and views", "Ranges y vistas de C++20", "C++20 の ranges とビュー"),
    p(
      "A view is a lazy recipe over a range: it doesn't store anything or do any work until you loop over it. std::views::filter(pred) keeps the elements where pred is true; std::views::transform(f) gives f(element) instead of the element. The | operator chains them, read left to right.",
      "Una vista es una receta perezosa sobre un rango: no guarda nada ni trabaja hasta que la recorres. std::views::filter(pred) deja los elementos donde pred es true; std::views::transform(f) da f(elemento) en vez del elemento. El operador | las encadena, y se lee de izquierda a derecha.",
      "ビューは範囲にかける遅延レシピ。ループするまで何も保存せず、何もしない。std::views::filter(pred) は pred が true の要素を残し、std::views::transform(f) は要素の代わりに f(要素) を渡す。| でつなぎ、左から右へ読む。",
    ),
    ex(cc(`
      std::vector<int> v{5, 10, 15, 20};
      auto picked = v | std::views::filter([](int n) { return n > 8; })
                      | std::views::transform([](int n) { return n / 5; });
      for (int x : picked) std::cout << x << " ";`), "2 3 4",
      L("Filter first (10, 15, 20), then transform each one", "Primero filter (10, 15, 20), luego transform a cada uno", "まず filter（10, 15, 20）、次に transform")),
    p(
      "Order matters: filter then transform tests the original values and changes only the survivors; transform then filter would test the changed values. The original vector is never modified. Each element flows through the whole chain only when the loop asks for it.",
      "El orden importa: filter y luego transform prueba los valores originales y cambia solo a los que pasan; transform y luego filter probaría los valores ya cambiados. El vector original nunca se modifica. Cada elemento pasa por toda la cadena solo cuando el bucle lo pide.",
      "順番が大事。filter → transform は元の値で判定し、残ったものだけ変える。transform → filter なら変えた後の値で判定する。元の vector は変わらない。各要素は、ループが求めたときにだけチェーン全体を流れる。",
    ),
  ),
];

// ─── 4.3 Modern relics: C++17/20 ───────────────────────────────────────────
const relics: LessonDef = {
  slug: "modern-relics",
  title: L("Modern relics", "Reliquias modernas", "モダンな秘宝"),
  concept: "modern-cpp",
  mode: "lesson",
  xp: 80,
  enemy: "cpp/leak-slime",
  enemyName: L("RELIC SLIME", "BABOSA RELIQUIA", "ヒホウスライム"),
  notes: relicNotes,
  beats: [
    say(L(
      "Modern C++ brings relics. Structured bindings unpack a pair or struct in one line: auto [name, qty] = p;",
      "El C++ moderno trae reliquias. Los structured bindings desarman un pair o struct en una línea: auto [name, qty] = p;",
      "モダン C++ の秘宝。構造化束縛は pair や構造体を一行でほどく：auto [name, qty] = p;",
    )),
    {
      kind: "act",
      prompt: L("Unpack the chest into two names", "Desarma el cofre en dos nombres", "宝箱を2つの名前にほどこう"),
      steps: [
        { label: L("CHEST", "COFRE", "宝箱"), line: 'std::pair<std::string, int> p{"gem", 3};', effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "p" }] },
        { label: L("UNPACK", "DESARMAR", "ほどく"), line: "auto [name, qty] = p;", effects: [{ t: "enter", actor: "ally" }, { t: "clone", to: "ally" }, { t: "tag", actor: "ally", text: "name, qty" }] },
        { label: L("PRINT", "IMPRIMIR", "表示"), line: "std::cout << name << qty;", effects: [{ t: "print", text: "gem3" }], output: "gem3" },
      ],
    },
    {
      kind: "predict",
      hint: L("Plain auto [..] binds to a copy of the pair. Does changing gold touch chest?", "auto [..] solo se ata a una copia del pair. ¿Cambiar gold toca a chest?", "ただの auto [..] は pair のコピーに結びつく。gold を変えると chest は？"),
      note: "structured-bindings",
      prompt: PRINT,
      code: 'std::pair<std::string, int> chest{"cave", 30};\nauto [name, gold] = chest;\ngold += 10;\nstd::cout << gold << " " << chest.second;',
      options: ["40 30", "40 40", "30 30"],
      answer: 0,
      output: "40 30",
      check: { compiles: true, stdout: "40 30" },
      explain: L("auto [..] binds to a COPY of chest. To change the original, use auto& [name, gold].", "auto [..] se ata a una COPIA de chest. Para cambiar el original, usa auto& [name, gold].", "auto [..] は chest のコピーに束縛する。元を変えるなら auto& [name, gold]。"),
      win: [{ t: "print", text: "40 30" }],
    },
    say(L(
      "std::optional<T> is a chest that may be empty. value_or(x) gives x when it's empty.",
      "std::optional<T> es un cofre que puede estar vacío. value_or(x) da x cuando está vacío.",
      "std::optional<T> は空かもしれない宝箱。空なら value_or(x) が x を返す。",
    )),
    {
      kind: "predict",
      hint: L("value_or only uses its fallback when the optional is empty. And how does cout print false?", "value_or solo usa su reemplazo si el optional está vacío. ¿Y cómo imprime cout un false?", "value_or は空のときだけ代わりを使う。false は cout でどう表示される？"),
      note: "optional",
      prompt: PRINT,
      code: cc(`
        std::optional<int> find(bool ok) {
          if (ok) return 7;
          return std::nullopt;
        }
        int main() {
          std::cout << find(true).value_or(0) << find(false).value_or(0)
                    << find(false).has_value();
        }`),
      options: ["700", "707", "001"],
      answer: 0,
      output: "700",
      check: { compiles: true, stdout: "700" },
      explain: L("A full chest gives 7; an empty one falls back to 0; has_value() on it is false (0).", "Un cofre lleno da 7; uno vacío usa el 0; has_value() en él es false (0).", "中身ありは 7、空は 0 にフォールバック、その has_value() は false（0）。"),
      win: [{ t: "print", text: "700" }],
    },
    {
      kind: "predict",
      hint: L("It starts empty, then gets a value. * reaches the string; -> calls a member on it.", "Empieza vacío y luego recibe un valor. * llega al string; -> llama a un miembro suyo.", "最初は空で、後で値が入る。* で文字列に届き、-> でそのメンバーを呼ぶ。"),
      note: "optional",
      prompt: PRINT,
      code: 'std::optional<std::string> name;\nstd::cout << name.value_or("anon") << " ";\nname = "Ada";\nstd::cout << *name << name->size();',
      options: ["anon Ada3", " Ada3", "anon Ada"],
      answer: 0,
      output: "anon Ada3",
      check: { compiles: true, stdout: "anon Ada3" },
      explain: L("Empty at first, so value_or gives anon. After the assignment, * and -> reach the string inside.", "Al inicio está vacío, así que value_or da anon. Tras asignar, * y -> llegan al string de adentro.", "最初は空なので anon。代入の後は * と -> で中の文字列に届く。"),
      win: [{ t: "print", text: "anon Ada3" }],
    },
    say(L(
      "std::variant<int, std::string> holds ONE of its types at a time. std::get with the wrong type throws.",
      "std::variant<int, std::string> guarda UNO de sus tipos a la vez. std::get con el tipo equivocado lanza.",
      "std::variant<int, std::string> は一度にどれか一つの型を持つ。違う型で std::get すると例外。",
    )),
    {
      kind: "predict",
      hint: L("index() counts from 0 in the order of the types listed. Which type does v hold at the end?", "index() cuenta desde 0 en el orden de los tipos. ¿Qué tipo guarda v al final?", "index() は型の並び順で 0 から数える。最後に v が持つ型は？"),
      note: "variant",
      prompt: PRINT,
      code: 'std::variant<int, std::string> v = 5;\nv = std::string("hi");\nstd::cout << v.index() << std::get<std::string>(v);',
      options: ["1hi", "0hi", "5hi"],
      answer: 0,
      output: "1hi",
      check: { compiles: true, stdout: "1hi" },
      explain: L("It now holds the second type, std::string, so index() is 1.", "Ahora guarda el segundo tipo, std::string, así que index() es 1.", "今は2番目の型 std::string を持つので index() は 1。"),
      win: [{ t: "print", text: "1hi" }],
    },
    {
      kind: "predict",
      hint: L("v holds one type right now. What does std::get do if you ask for a different one?", "v guarda un tipo ahora. ¿Qué hace std::get si pides otro distinto?", "v は今ひとつの型を持つ。違う型を求めると std::get は？"),
      note: "variant",
      prompt: PRINT,
      code: 'std::variant<int, std::string> v = 5;\ntry {\n  std::get<std::string>(v);\n} catch (const std::bad_variant_access&) {\n  std::cout << "wrong";\n}',
      options: ["wrong", "5", L("Nothing", "Nada", "何も出ない")],
      answer: 0,
      output: "wrong",
      check: { compiles: true, stdout: "wrong" },
      explain: L("v holds an int, so asking for a string throws std::bad_variant_access.", "v guarda un int, así que pedir un string lanza std::bad_variant_access.", "v は int を持つので、string を求めると std::bad_variant_access が投げられる。"),
      win: [{ t: "print", text: "wrong" }],
    },
    say(L(
      "std::string_view is a window onto someone else's text. Cheap to pass, but if the text dies, the window dangles.",
      "std::string_view es una ventana al texto de otro. Barata de pasar, pero si el texto muere, la ventana queda colgando.",
      "std::string_view は他人の文字列をのぞく窓。軽いけど、元の文字列が消えると宙ぶらりん。",
    )),
    {
      kind: "predict",
      hint: L("substr(start, count) gives count chars from start. Does it change the original view's size?", "substr(inicio, cantidad) da cantidad caracteres desde inicio. ¿Cambia el tamaño de la vista original?", "substr(開始, 個数) は開始から個数文字。元のビューのサイズは変わる？"),
      note: "string-view",
      prompt: PRINT,
      code: 'std::string_view sv = "dragon";\nstd::cout << sv.substr(0, 4) << sv.size();',
      options: ["drag6", "drago6", "drag4"],
      answer: 0,
      output: "drag6",
      check: { compiles: true, stdout: "drag6" },
      explain: L("substr(0, 4) takes 4 chars without copying; the view still sees all 6.", "substr(0, 4) toma 4 caracteres sin copiar; la vista sigue viendo los 6.", "substr(0, 4) はコピーせずに4文字を取る。窓は6文字全部を見ている。"),
      win: [{ t: "print", text: "drag6" }],
    },
    {
      kind: "predict",
      hint: L("A view doesn't own text. How long does the temporary string on the right live?", "Una vista no posee texto. ¿Cuánto vive el string temporal de la derecha?", "ビューは文字列を持たない。右側の一時的な文字列はいつまで生きる？"),
      note: "string-view",
      prompt: SAFE,
      code: 'std::string_view sv = std::string("temp") + "!";\nstd::cout << sv;',
      options: [
        L("No: the string died, sv dangles", "No: el string murió, sv cuelga", "いいえ：文字列が消え sv は宙ぶらりん"),
        L("Yes: prints temp!", "Sí: imprime temp!", "はい：temp! と表示"),
      ],
      answer: 0,
      check: { compiles: true, program: neverRun('std::string_view sv = std::string("temp") + "!";\nstd::cout << sv;') },
      explain: L("The temporary string dies at the ; so sv looks at freed memory: UB.", "El string temporal muere en el ; y sv mira memoria liberada: UB.", "一時的な文字列は ; で消える。sv は解放済みメモリを見る：UB。"),
      win: [{ t: "banner", text: L("UB!", "¡UB!", "UB！") }, { t: "shake" }],
    },
    say(L(
      "auto copies and drops the top const. auto& keeps it. Braces build lists: vector{2, 5} is two items.",
      "auto copia y quita el const de arriba. auto& lo conserva. Las llaves arman listas: vector{2, 5} son dos elementos.",
      "auto はコピーして一番上の const を外す。auto& は残す。波かっこはリスト：vector{2, 5} は2要素。",
    )),
    {
      kind: "predict",
      hint: L("auto& keeps the const of what it refers to. Can you assign through a reference to const?", "auto& conserva el const de lo que referencia. ¿Puedes asignar a través de una referencia a const?", "auto& は参照先の const を残す。const への参照を通して代入できる？"),
      note: "auto-and-braces",
      prompt: COMPILES,
      code: "const int x = 5;\nauto& b = x;\nb = 6;",
      options: [YES, NO_GCC],
      answer: 1,
      check: { compiles: false },
      explain: L("auto& becomes const int&, so b can't change: assignment of read-only reference 'b'. Plain auto would copy.", "auto& queda como const int&, así que b no cambia: assignment of read-only reference 'b'. auto solo copiaría.", "auto& は const int& になり変更できない。ただの auto ならコピーになる。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "predict",
      hint: L("Braces make a list of items; parentheses call the (count, value) constructor.", "Las llaves crean una lista de elementos; los paréntesis llaman al constructor (cantidad, valor).", "波かっこは要素のリスト、丸かっこは（個数, 値）のコンストラクタ。"),
      note: "auto-and-braces",
      prompt: PRINT,
      code: "std::vector<int> a{2, 5};\nstd::vector<int> b(2, 5);\nstd::cout << a.size() << a[0] << \" \" << b.size() << b[0];",
      options: ["22 25", "25 25", "22 22"],
      answer: 0,
      output: "22 25",
      check: { compiles: true, stdout: "22 25" },
      explain: L("{2, 5} is the list of items 2 and 5. (2, 5) means two copies of 5.", "{2, 5} es la lista con 2 y 5. (2, 5) significa dos copias de 5.", "{2, 5} は 2 と 5 のリスト。(2, 5) は 5 が2個。"),
      win: [{ t: "print", text: "22 25" }],
    },
    say(L(
      "C++20 ranges chain views with |: filter keeps some items, transform changes them, lazily, one by one.",
      "Los ranges de C++20 encadenan vistas con |: filter deja pasar algunos y transform los cambia, de a uno.",
      "C++20 の ranges は | でビューをつなぐ。filter で選び、transform で変える。一つずつ遅延で動く。",
    )),
    {
      kind: "predict",
      hint: L("Apply filter first to the original numbers, then transform only the survivors.", "Aplica primero filter a los números originales y luego transform solo a los que pasan.", "まず元の数に filter、残ったものだけに transform。"),
      note: "ranges",
      prompt: PRINT,
      code: "std::vector<int> v{1, 2, 3, 4, 5, 6};\nauto evens = v | std::views::filter([](int n) { return n % 2 == 0; })\n              | std::views::transform([](int n) { return n * n; });\nfor (int x : evens) std::cout << x << \" \";",
      options: ["4 16 36", "2 4 6", "1 4 9 16 25 36"],
      answer: 0,
      output: "4 16 36 ",
      check: { compiles: true, stdout: "4 16 36" },
      explain: L("filter keeps 2, 4, 6; transform squares each one as the loop pulls it.", "filter deja 2, 4, 6; transform eleva al cuadrado cada uno cuando el bucle lo pide.", "filter で 2, 4, 6 を残し、transform がループの度に2乗する。"),
      win: [{ t: "print", text: "4 16 36" }],
    },
    {
      kind: "predict",
      hint: L("Does insert overwrite a key that already exists? Check what ok and it mean then.", "¿insert sobrescribe una clave que ya existe? Revisa qué significan ok e it entonces.", "insert は既存のキーを上書きする？そのとき ok と it は何？"),
      note: "structured-bindings",
      prompt: PRINT,
      code: 'std::map<std::string, int> m{{"cave", 30}};\nif (auto [it, ok] = m.insert({"cave", 99}); !ok)\n  std::cout << it->second;',
      options: ["30", "99", L("Nothing", "Nada", "何も出ない")],
      answer: 0,
      output: "30",
      check: { compiles: true, stdout: "30" },
      explain: L("if can declare a variable first. insert never overwrites: ok is false and it points at the old 30.", "if puede declarar una variable primero. insert nunca sobrescribe: ok es false e it apunta al viejo 30.", "if は先に変数を宣言できる。insert は上書きしないので ok は false、it は元の 30 を指す。"),
      win: [{ t: "print", text: "30" }],
    },
    {
      kind: "run",
      hint: L("The binding unpacked a copy. Which form of auto binds to the chest itself?", "El binding desarmó una copia. ¿Qué forma de auto se ata al cofre mismo?", "束縛はコピーをほどいた。宝箱そのものに結びつく auto の形は？"),
      note: "structured-bindings",
      prompt: L("Add 10 gold to the chest itself", "Suma 10 de oro al cofre mismo", "宝箱そのものに金貨10枚を足そう"),
      starter: cc(`
        #include <iostream>
        #include <string>
        #include <utility>

        int main() {
          std::pair<std::string, int> chest{"cave", 30};
          auto [name, gold] = chest;
          gold += 10;
          std::cout << name << " gold: " << chest.second;
        }`) + "\n",
      solution: cc(`
        #include <iostream>
        #include <string>
        #include <utility>

        int main() {
          std::pair<std::string, int> chest{"cave", 30};
          auto& [name, gold] = chest;
          gold += 10;
          std::cout << name << " gold: " << chest.second;
        }`) + "\n",
      expect: "gold: 40",
      fallback: [String.raw`auto\s*&\s*\[`, String.raw`chest\.second\s*\+=\s*10`],
      explain: L("auto [..] unpacked a copy. auto& [name, gold] binds to the chest itself.", "auto [..] desarmó una copia. auto& [name, gold] se ata al cofre mismo.", "auto [..] はコピーをほどいた。auto& [name, gold] なら宝箱そのものに束縛する。"),
    },
  ],
};

const threadNotes: NoteDef[] = [
  note("thread-join", L("std::thread, join and jthread", "std::thread, join y jthread", "std::thread・join・jthread"),
    p(
      "std::thread t(f); starts running f on a new thread right away, at the same time as the code that follows. The function can be a lambda or a normal function. Nothing waits for it unless you ask: t.join() blocks until the thread has finished.",
      "std::thread t(f); empieza a correr f en un hilo nuevo de inmediato, al mismo tiempo que el código que sigue. La función puede ser una lambda o una función normal. Nada la espera a menos que lo pidas: t.join() se bloquea hasta que el hilo termina.",
      "std::thread t(f); は新しいスレッドですぐに f を動かし始め、後に続くコードと同時に進む。関数はラムダでもふつうの関数でもよい。頼まない限りだれも待たない。t.join() はスレッドが終わるまで待つ。",
    ),
    p(
      "join is also a promise about memory: everything the thread wrote is visible after join returns. Reading a shared variable after join is safe; reading it while the thread may still be writing is not.",
      "join también es una promesa sobre la memoria: todo lo que el hilo escribió se ve después de que join vuelve. Leer una variable compartida después de join es seguro; leerla mientras el hilo aún puede estar escribiendo no lo es.",
      "join はメモリについての約束でもある。join が戻った後なら、スレッドが書いたものはすべて見える。join の後に共有変数を読むのは安全だが、スレッドがまだ書いているかもしれない間に読むのは安全ではない。",
    ),
    exProg('std::string msg;\nstd::thread worker([&msg] { msg = "done"; });\nworker.join();\nstd::cout << msg;',
      withThreads('std::string msg;\nstd::thread worker([&msg] { msg = "done"; });\nworker.join();\nstd::cout << msg;'), "done",
      L("After join, the thread's write is visible", "Después de join, la escritura del hilo se ve", "join の後ならスレッドの書きこみが見える")),
    p(
      "Rule: a std::thread that was started must be joined (or detached) before it is destroyed. If a joinable std::thread reaches its destructor, the program calls std::terminate and crashes. That's easy to forget on early returns or exceptions.",
      "Regla: un std::thread que se inició debe recibir join (o detach) antes de destruirse. Si un std::thread unible llega a su destructor, el programa llama a std::terminate y se cae. Es fácil olvidarlo con returns tempranos o excepciones.",
      "ルール：開始した std::thread は、こわれる前に join（または detach）しなければならない。join 可能な std::thread がデストラクタに来ると、プログラムは std::terminate を呼んで落ちる。途中の return や例外で忘れやすい。",
    ),
    p(
      "C++20 std::jthread fixes this with RAII: its destructor joins automatically. When a jthread goes out of scope at a }, the code waits there for the thread to finish, so its results are ready after the block.",
      "std::jthread de C++20 lo arregla con RAII: su destructor hace join automáticamente. Cuando un jthread sale de su ámbito en una }, el código espera ahí a que el hilo termine, así que sus resultados están listos después del bloque.",
      "C++20 の std::jthread は RAII でこれを解決する。デストラクタが自動で join する。jthread が } でスコープを出ると、そこでスレッドの終わりを待つので、ブロックの後には結果ができている。",
    ),
    exProg('int sum = 0;\n{\n  std::jthread helper([&sum] { sum = 5 + 6; });\n}  // helper joins here\nstd::cout << sum;',
      withThreads("int sum = 0;\n{\n    std::jthread helper([&sum] { sum = 5 + 6; });\n}\nstd::cout << sum;"), "11"),
  ),
  note("mutex-lock", L("Data races and mutexes", "Carreras de datos y mutex", "データ競合と mutex"),
    p(
      "A DATA RACE happens when two threads touch the same plain variable at the same time and at least one of them writes, with nothing to order them. ++count is really read, add, write; two threads can interleave those steps and lose updates. But the rule is stricter than \"wrong count\": a data race is undefined behavior, so the language promises nothing at all.",
      "Una CARRERA DE DATOS ocurre cuando dos hilos tocan la misma variable común al mismo tiempo y al menos uno escribe, sin nada que los ordene. ++count es en realidad leer, sumar, escribir; dos hilos pueden mezclar esos pasos y perder cambios. Pero la regla es más dura que \"cuenta mal\": una carrera de datos es comportamiento indefinido, el lenguaje no promete nada.",
      "データ競合とは、2つのスレッドが同じふつうの変数を同時にさわり、少なくとも1つが書き、順番を決めるものがない状態。++count は実は「読む・足す・書く」で、手順が混ざると更新が消える。だがルールは「数がずれる」より厳しく、データ競合は未定義動作で、言語は何も保証しない。",
    ),
    p(
      "A std::mutex is a single key: only one thread can hold it at a time. std::lock_guard<std::mutex> lock(m); takes the key when it's created and gives it back automatically at the closing }, even if an exception is thrown. Put every access to the shared data inside such a locked block.",
      "Un std::mutex es una sola llave: solo un hilo puede tenerla a la vez. std::lock_guard<std::mutex> lock(m); toma la llave al crearse y la devuelve sola en la } de cierre, incluso si se lanza una excepción. Pon cada acceso al dato compartido dentro de un bloque así.",
      "std::mutex はただ一本の鍵で、同時に持てるのは1つのスレッドだけ。std::lock_guard<std::mutex> lock(m); は作られたときに鍵を取り、閉じる } で（例外が起きても）自動で返す。共有データへのアクセスはすべて、こうしてロックしたブロックの中に入れよう。",
    ),
    exProg(cc(`
      int score = 0;
      std::mutex guard;
      auto add = [&] {
        for (int i = 0; i < 500; ++i) { std::lock_guard<std::mutex> lock(guard); ++score; }
      };
      std::thread t1(add), t2(add), t3(add);
      t1.join(); t2.join(); t3.join();
      std::cout << score;`),
      withThreads("int score = 0;\nstd::mutex guard;\nauto add = [&] {\n    for (int i = 0; i < 500; ++i) { std::lock_guard<std::mutex> lock(guard); ++score; }\n};\nstd::thread t1(add), t2(add), t3(add);\nt1.join(); t2.join(); t3.join();\nstd::cout << score;"), "1500",
      L("Three threads, one key: no increment is lost", "Tres hilos, una llave: no se pierde ningún incremento", "3つのスレッドに鍵は1本：増加は消えない")),
    p(
      "With two mutexes, two threads that lock them in opposite orders can each hold one and wait forever for the other: a DEADLOCK. std::scoped_lock lock(a, b); locks several mutexes at once using a deadlock-avoiding algorithm, and unlocks them all at the }.",
      "Con dos mutex, dos hilos que los bloquean en orden opuesto pueden quedarse cada uno con uno y esperar para siempre el otro: un DEADLOCK. std::scoped_lock lock(a, b); bloquea varios mutex a la vez con un algoritmo que evita deadlocks, y los libera todos en la }.",
      "mutex が2つあると、逆の順番でロックする2つのスレッドが1つずつ持ったまま、もう片方を永遠に待つことがある。これがデッドロック。std::scoped_lock lock(a, b); はデッドロックを避ける方法で複数をまとめてロックし、} で全部解放する。",
    ),
    exProg(cc(`
      std::mutex left, right;
      int moves = 0;
      auto step = [&] { std::scoped_lock both(left, right); ++moves; };
      std::thread p(step), q(step);
      p.join(); q.join();
      std::cout << moves;`),
      withThreads("std::mutex left, right;\nint moves = 0;\nauto step = [&] { std::scoped_lock both(left, right); ++moves; };\nstd::thread p(step), q(step);\np.join(); q.join();\nstd::cout << moves;"), "2"),
  ),
  note("atomic", L("std::atomic counters", "Contadores std::atomic", "std::atomic のカウンタ"),
    p(
      "std::atomic<int> is an int whose operations are indivisible: c++, c += 5 or c.fetch_add(1) happen as one step that no other thread can interrupt. So several threads can update an atomic counter at the same time without a mutex, and no update is lost. There is no data race on an atomic.",
      "std::atomic<int> es un int cuyas operaciones son indivisibles: c++, c += 5 o c.fetch_add(1) ocurren como un solo paso que ningún otro hilo puede interrumpir. Así varios hilos pueden actualizar un contador atómico a la vez sin mutex, y no se pierde ningún cambio. En un atomic no hay carrera de datos.",
      "std::atomic<int> は操作が分割できない int。c++、c += 5、c.fetch_add(1) は他のスレッドに割りこまれない1つの手順として起きる。だから複数のスレッドが mutex なしで同時にカウンタを更新しても、更新は消えない。atomic ではデータ競合は起きない。",
    ),
    exProg(cc(`
      std::atomic<int> hits{0};
      auto shoot = [&] { for (int i = 0; i < 250; ++i) hits++; };
      std::thread a(shoot), b(shoot), c(shoot), d(shoot);
      a.join(); b.join(); c.join(); d.join();
      std::cout << hits;`),
      withThreads("std::atomic<int> hits{0};\nauto shoot = [&] { for (int i = 0; i < 250; ++i) hits++; };\nstd::thread a(shoot), b(shoot), c(shoot), d(shoot);\na.join(); b.join(); c.join(); d.join();\nstd::cout << hits;"), "1000",
      L("4 threads × 250 increments, none lost", "4 hilos × 250 incrementos, ninguno perdido", "4スレッド×250回、ひとつも消えない")),
    p(
      "Atomics are perfect for a single counter or flag. When several values must change together (say, move gold from one chest to another), use a mutex: two separate atomic operations are each safe, but another thread can still see the moment between them.",
      "Los atomic son perfectos para un solo contador o bandera. Cuando varios valores deben cambiar juntos (por ejemplo, pasar oro de un cofre a otro), usa un mutex: dos operaciones atómicas separadas son seguras cada una, pero otro hilo aún puede ver el momento entre ellas.",
      "atomic はカウンタやフラグ1つにぴったり。複数の値をいっしょに変える必要があるとき（宝箱から宝箱へ金貨を移すなど）は mutex を使おう。別々の atomic 操作はそれぞれ安全でも、その間の瞬間を他のスレッドに見られてしまう。",
    ),
  ),
  note("async-and-args", L("std::async and thread arguments", "std::async y argumentos de hilos", "std::async とスレッドの引数"),
    p(
      "std::async(std::launch::async, f) runs f on another thread and immediately gives you a std::future, a ticket for the result. future.get() waits until the result is ready and returns it (or rethrows the task's exception). It's the easy way to compute something in the background and collect the answer later.",
      "std::async(std::launch::async, f) corre f en otro hilo y te da de inmediato un std::future, un boleto para el resultado. future.get() espera hasta que el resultado esté listo y lo devuelve (o relanza la excepción de la tarea). Es la forma fácil de calcular algo en segundo plano y recoger la respuesta después.",
      "std::async(std::launch::async, f) は別のスレッドで f を動かし、すぐに std::future（結果の引換券）を返す。future.get() は結果ができるまで待って返す（タスクの例外なら投げ直す）。裏で計算して、後で答えを受け取るかんたんな方法。",
    ),
    exProg('auto job = std::async(std::launch::async, [] { return 10 + 5; });\nstd::cout << "result " << job.get();',
      withThreads('auto job = std::async(std::launch::async, [] { return 10 + 5; });\nstd::cout << "result " << job.get();'), "result 15"),
    p(
      "std::thread t(f, arg) COPIES each argument into the new thread before calling f. So a function taking int& would only ever see the thread's private copy, and the compiler refuses to bind that copy to a non-const reference. Wrap the argument in std::ref(x) (from <functional>) to really pass a reference.",
      "std::thread t(f, arg) COPIA cada argumento al hilo nuevo antes de llamar a f. Así una función que recibe int& solo vería la copia privada del hilo, y el compilador se niega a atar esa copia a una referencia no const. Envuelve el argumento en std::ref(x) (de <functional>) para pasar de verdad una referencia.",
      "std::thread t(f, arg) は f を呼ぶ前に引数を新しいスレッドへ「コピー」する。int& を受ける関数はスレッド専用のコピーしか見られず、コンパイラはそのコピーを非 const 参照に結びつけるのを拒む。本当に参照を渡すなら std::ref(x)（<functional>）で包もう。",
    ),
    exProg(cc(`
      void heal(int& hp) { hp += 25; }
      int main() {
        int hp = 50;
        std::thread t(heal, std::ref(hp));
        t.join();
        std::cout << hp;
      }`),
      withThreads("int hp = 50;\nstd::thread t(heal, std::ref(hp));\nt.join();\nstd::cout << hp;", "void heal(int& hp) { hp += 25; }"), "75",
      L("std::ref lets the thread change the caller's variable", "std::ref deja que el hilo cambie la variable de quien llama", "std::ref で呼び出し側の変数をスレッドが変えられる")),
    p(
      "Common mistake: changing the parameter to int& but still passing plain hp. That doesn't compile. The opposite mistake, a by-value parameter, compiles fine but silently changes only a copy.",
      "Error común: cambiar el parámetro a int& pero seguir pasando hp sin más. Eso no compila. El error opuesto, un parámetro por valor, compila bien pero cambia en silencio solo una copia.",
      "よくあるミス：引数を int& にしたのに、hp をそのまま渡すこと。これはコンパイルできない。逆に値渡しの引数はコンパイルできるが、こっそりコピーだけを変える。",
    ),
  ),
];

// ─── 4.4 Thread storm ──────────────────────────────────────────────────────
const threads: LessonDef = {
  slug: "thread-storm",
  title: L("Thread storm", "Tormenta de hilos", "スレッドの嵐"),
  concept: "threads",
  mode: "lesson",
  xp: 85,
  enemy: "ghost",
  enemyName: L("RACE GHOST", "FANTASMA CARRERA", "レースゴースト"),
  notes: threadNotes,
  beats: [
    say(L(
      "A std::thread runs a function in parallel, like an ally working beside you. join() waits until the ally is back.",
      "Un std::thread corre una función en paralelo, como un aliado que trabaja a tu lado. join() espera a que vuelva.",
      "std::thread は関数を並行で動かす。となりで働く仲間のようなもの。join() は仲間が戻るのを待つ。",
    )),
    {
      kind: "act",
      prompt: L("Send an ally to work, then wait for them", "Manda un aliado a trabajar y espéralo", "仲間を働かせて、戻りを待とう"),
      steps: [
        { label: L("SHARED", "COMPARTIDO", "共有"), line: "int total = 0;", effects: [{ t: "tag", actor: "hero", text: "total", value: "0" }] },
        { label: L("SPAWN", "LANZAR", "起動"), line: "std::thread t([&total] { total = 42; });", effects: [{ t: "enter", actor: "ally" }, { t: "say", actor: "ally", text: L("On it!", "¡Voy!", "まかせて！") }] },
        { label: L("JOIN", "JOIN", "join"), line: "t.join();", effects: [{ t: "value", actor: "hero", text: "42" }, { t: "exit", actor: "ally" }] },
        { label: L("PRINT", "IMPRIMIR", "表示"), line: "std::cout << total;", effects: [{ t: "print", text: "42" }], output: "42" },
      ],
    },
    {
      kind: "predict",
      hint: L("What does join() wait for, and is the thread's write visible after it?", "¿Qué espera join() y se ve la escritura del hilo después?", "join() は何を待つ？その後スレッドの書きこみは見える？"),
      note: "thread-join",
      prompt: PRINT,
      code: "int total = 0;\nstd::thread t([&total] { total = 40 + 2; });\nt.join();\nstd::cout << total;",
      options: ["42", "0", L("It varies", "Varía", "毎回変わる")],
      answer: 0,
      output: "42",
      check: { compiles: true, stdout: "42", program: withThreads("int total = 0;\nstd::thread t([&total] { total = 40 + 2; });\nt.join();\nstd::cout << total;") },
      explain: L("join() waits for the thread to finish, and its write is visible afterwards.", "join() espera a que el hilo termine, y su escritura se ve después.", "join() はスレッドの終わりを待つ。その後なら書いた値が見える。"),
      win: [{ t: "print", text: "42" }],
    },
    {
      kind: "predict",
      hint: L("The thread is still joinable when it's destroyed. What does the standard say happens then?", "El hilo sigue siendo unible al destruirse. ¿Qué dice el estándar que pasa entonces?", "join 可能なままこわされる。標準ではそのとき何が起きる？"),
      note: "thread-join",
      prompt: L("What happens at the } ?", "¿Qué pasa en la } ?", "} で何が起きる？"),
      code: "{\n  std::thread t([] {});\n}  // no join!",
      options: [
        L("std::terminate: crash", "std::terminate: se cae", "std::terminate で落ちる"),
        L("It joins by itself", "Hace join solo", "自動で join する"),
        L("It detaches", "Se separa (detach)", "detach される"),
      ],
      answer: 0,
      check: { compiles: true, throws: "terminate", program: withThreads("{\n    std::thread t([] {});\n}") },
      explain: L("Destroying a joinable std::thread calls std::terminate. Always join, or use std::jthread.", "Destruir un std::thread sin join llama a std::terminate. Haz join siempre, o usa std::jthread.", "join していない std::thread をこわすと std::terminate。必ず join するか jthread を使おう。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "predict",
      hint: L("What does std::jthread's destructor do at the closing brace?", "¿Qué hace el destructor de std::jthread en la llave de cierre?", "閉じかっこで std::jthread のデストラクタは何をする？"),
      note: "thread-join",
      prompt: PRINT,
      code: "int x = 0;\n{\n  std::jthread t([&] { x = 7; });\n}\nstd::cout << x;",
      options: ["7", "0", L("Crash", "Se cae", "クラッシュ")],
      answer: 0,
      output: "7",
      check: { compiles: true, stdout: "7", program: withThreads("int x = 0;\n{\n    std::jthread t([&] { x = 7; });\n}\nstd::cout << x;") },
      explain: L("C++20 std::jthread joins in its destructor, so x is 7 after the block.", "std::jthread de C++20 hace join en su destructor, así que x vale 7 tras el bloque.", "C++20 の std::jthread はデストラクタで join する。ブロックの後 x は 7。"),
      win: [{ t: "print", text: "7" }],
    },
    say(L(
      "Two threads writing the same plain variable without a lock is a DATA RACE: undefined behavior. A mutex is the one key.",
      "Dos hilos escribiendo la misma variable sin candado es una CARRERA DE DATOS: comportamiento indefinido. Un mutex es la única llave.",
      "2つのスレッドがロックなしで同じ変数に書くのはデータ競合で、未定義動作。mutex はただ一本の鍵。",
    )),
    {
      kind: "predict",
      hint: L("Only the thread holding the lock may touch count. Can any increment get lost?", "Solo el hilo que tiene el candado puede tocar count. ¿Se puede perder algún incremento?", "ロックを持つスレッドだけが count をさわれる。増加は消える？"),
      note: "mutex-lock",
      prompt: PRINT,
      code: "int count = 0;\nstd::mutex m;\nauto work = [&] {\n  for (int i = 0; i < 1000; ++i) {\n    std::lock_guard<std::mutex> lock(m);\n    ++count;\n  }\n};\nstd::thread a(work), b(work);\na.join(); b.join();\nstd::cout << count;",
      options: ["2000", "1000", L("It varies", "Varía", "毎回変わる")],
      answer: 0,
      output: "2000",
      check: { compiles: true, stdout: "2000", program: withThreads("int count = 0;\nstd::mutex m;\nauto work = [&] {\n    for (int i = 0; i < 1000; ++i) {\n        std::lock_guard<std::mutex> lock(m);\n        ++count;\n    }\n};\nstd::thread a(work), b(work);\na.join(); b.join();\nstd::cout << count;") },
      explain: L("Only the thread holding the lock touches count, so no increment is lost.", "Solo el hilo que tiene el candado toca count, así que no se pierde ningún incremento.", "ロックを持つスレッドだけが count をさわるので、増加が失われない。"),
      setup: [{ t: "enter", actor: "ally" }, { t: "item", kind: "key", holder: "hero" }],
      win: [{ t: "give", to: "ally" }, { t: "print", text: "2000" }],
    },
    {
      kind: "predict",
      hint: L("Two threads write a plain int with no synchronization. What does the language promise then?", "Dos hilos escriben un int común sin sincronizar. ¿Qué promete el lenguaje entonces?", "2つのスレッドが同期なしでふつうの int に書く。言語は何を約束する？"),
      note: "mutex-lock",
      prompt: L("Same loop, no mutex. What is it?", "El mismo bucle, sin mutex. ¿Qué es?", "同じループで mutex なし。これは？"),
      code: "int count = 0;\nauto work = [&] {\n  for (int i = 0; i < 1000; ++i) ++count;\n};\nstd::thread a(work), b(work);\na.join(); b.join();",
      options: [
        L("A data race: UB", "Carrera de datos: UB", "データ競合：UB"),
        L("Always 2000", "Siempre 2000", "いつも 2000"),
        L("Always 1000", "Siempre 1000", "いつも 1000"),
      ],
      answer: 0,
      check: { compiles: true, program: withThreads("int count = 0;\nauto work = [&] {\n    for (int i = 0; i < 1000; ++i) ++count;\n};\nstd::thread a(work), b(work);\na.join(); b.join();") },
      explain: L("Two unsynchronized writers to a plain int is a data race. The language promises nothing about the result.", "Dos escritores sin sincronizar sobre un int común es una carrera de datos. El lenguaje no promete nada del resultado.", "同期なしで2人が int に書くのはデータ競合。結果について言語は何も保証しない。"),
      win: [{ t: "banner", text: L("DATA RACE!", "¡CARRERA!", "データ競合！") }, { t: "shake" }],
    },
    {
      kind: "predict",
      hint: L("std::atomic makes each ++ one indivisible step. Can two threads still lose updates?", "std::atomic hace cada ++ un paso indivisible. ¿Pueden dos hilos perder cambios aún?", "std::atomic で ++ は分割できない1手順。それでも更新は消える？"),
      note: "atomic",
      prompt: PRINT,
      code: "std::atomic<int> c{0};\nauto work = [&] {\n  for (int i = 0; i < 1000; ++i) c++;\n};\nstd::thread a(work), b(work);\na.join(); b.join();\nstd::cout << c;",
      options: ["2000", L("It varies", "Varía", "毎回変わる"), "1000"],
      answer: 0,
      output: "2000",
      check: { compiles: true, stdout: "2000", program: withThreads("std::atomic<int> c{0};\nauto work = [&] {\n    for (int i = 0; i < 1000; ++i) c++;\n};\nstd::thread a(work), b(work);\na.join(); b.join();\nstd::cout << c;") },
      explain: L("std::atomic makes each ++ indivisible, so no lock is needed for a simple counter.", "std::atomic hace cada ++ indivisible, así que un contador simple no necesita candado.", "std::atomic は ++ を分割できない操作にする。単純なカウンタならロック不要。"),
      win: [{ t: "print", text: "2000" }],
    },
    {
      kind: "type",
      hint: L("lock_guard needs to know which mutex to lock. Look at what was declared above.", "lock_guard necesita saber qué mutex bloquear. Mira lo que se declaró arriba.", "lock_guard はどの mutex をロックするか知る必要がある。上の宣言を見よう。"),
      note: "mutex-lock",
      prompt: L("Lock the mutex with RAII", "Bloquea el mutex con RAII", "RAII で mutex をロック"),
      code: "int gold = 0;\nstd::mutex m;\nauto work = [&] {\n  std::lock_guard<std::mutex> lock(___);\n  gold += 10;\n};\nstd::thread a(work), b(work);\na.join(); b.join();\nstd::cout << gold;",
      answer: "m",
      check: { compiles: true, stdout: "20", program: withThreads("int gold = 0;\nstd::mutex m;\nauto work = [&] {\n    std::lock_guard<std::mutex> lock(m);\n    gold += 10;\n};\nstd::thread a(work), b(work);\na.join(); b.join();\nstd::cout << gold;") },
      explain: L("lock_guard locks m now and unlocks it at the } on every path, even on exceptions.", "lock_guard bloquea m ahora y lo libera en la } por cualquier camino, incluso con excepciones.", "lock_guard は今 m をロックし、} でどんな経路でも（例外でも）解除する。"),
      win: [{ t: "print", text: "20" }],
    },
    say(L(
      "Two mutexes locked in opposite orders by two threads can DEADLOCK. std::scoped_lock(a, b) takes both safely.",
      "Dos mutex bloqueados en orden opuesto por dos hilos pueden trabarse (DEADLOCK). std::scoped_lock(a, b) toma ambos seguro.",
      "2つの mutex を逆順でロックするとデッドロックの危険。std::scoped_lock(a, b) なら安全に両方取れる。",
    )),
    {
      kind: "predict",
      hint: L("scoped_lock takes both mutexes with a deadlock-avoiding algorithm. Count the increments.", "scoped_lock toma ambos mutex con un algoritmo que evita deadlocks. Cuenta los incrementos.", "scoped_lock はデッドロックを避けて両方取る。増加の回数を数えよう。"),
      note: "mutex-lock",
      prompt: PRINT,
      code: "std::mutex a, b;\nint gold = 0;\nauto work = [&] {\n  for (int i = 0; i < 100; ++i) {\n    std::scoped_lock lock(a, b);\n    ++gold;\n  }\n};\nstd::thread t1(work), t2(work);\nt1.join(); t2.join();\nstd::cout << gold;",
      options: ["200", "100", L("It deadlocks", "Se traba", "デッドロック")],
      answer: 0,
      output: "200",
      check: { compiles: true, stdout: "200", program: withThreads("std::mutex a, b;\nint gold = 0;\nauto work = [&] {\n    for (int i = 0; i < 100; ++i) {\n        std::scoped_lock lock(a, b);\n        ++gold;\n    }\n};\nstd::thread t1(work), t2(work);\nt1.join(); t2.join();\nstd::cout << gold;") },
      explain: L("scoped_lock locks both mutexes with a deadlock-avoiding algorithm, and frees them at the }.", "scoped_lock bloquea ambos mutex con un algoritmo que evita deadlocks, y los libera en la }.", "scoped_lock はデッドロックを避ける方法で両方ロックし、} で解放する。"),
      win: [{ t: "print", text: "200" }],
    },
    {
      kind: "predict",
      hint: L("get() waits for the task to finish and returns its result. What does the lambda compute?", "get() espera a que la tarea termine y devuelve su resultado. ¿Qué calcula la lambda?", "get() は仕事の終わりを待って結果を返す。ラムダは何を計算する？"),
      note: "async-and-args",
      prompt: PRINT,
      code: "auto f = std::async(std::launch::async, [] { return 6 * 7; });\nstd::cout << f.get();",
      options: ["42", "0", L("It varies", "Varía", "毎回変わる")],
      answer: 0,
      output: "42",
      check: { compiles: true, stdout: "42", program: withThreads("auto f = std::async(std::launch::async, [] { return 6 * 7; });\nstd::cout << f.get();") },
      explain: L("std::async runs the task and returns a future; get() waits for the result.", "std::async corre la tarea y devuelve un future; get() espera el resultado.", "std::async は仕事を動かして future を返す。get() は結果を待つ。"),
      win: [{ t: "print", text: "42" }],
    },
    {
      kind: "predict",
      hint: L("std::thread copies its arguments. Can a copy bind to an int& parameter?", "std::thread copia sus argumentos. ¿Puede una copia atarse a un parámetro int&?", "std::thread は引数をコピーする。コピーは int& 引数に結びつく？"),
      note: "async-and-args",
      prompt: COMPILES,
      code: "void addLoot(int& loot) { loot += 100; }\nint main() {\n  int loot = 0;\n  std::thread t(addLoot, loot);\n  t.join();\n}",
      options: [YES, NO_GCC],
      answer: 1,
      check: { compiles: false, program: withThreads("int loot = 0;\nstd::thread t(addLoot, loot);\nt.join();", "void addLoot(int& loot) { loot += 100; }") },
      explain: L("std::thread copies its arguments, and a copy can't bind to int&. Pass std::ref(loot).", "std::thread copia sus argumentos, y una copia no se ata a int&. Pasa std::ref(loot).", "std::thread は引数をコピーするので int& に渡せない。std::ref(loot) を使おう。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "run",
      hint: L("The function changes its own copy. Change the parameter type and how loot is passed.", "La función cambia su propia copia. Cambia el tipo del parámetro y cómo se pasa loot.", "関数は自分のコピーを変えている。引数の型と loot の渡し方を変えよう。"),
      note: "async-and-args",
      prompt: L("The loot must reach 100", "El botín debe llegar a 100", "戦利品を 100 にしよう"),
      starter: cc(`
        #include <iostream>
        #include <thread>

        void addLoot(int loot) { loot += 100; }

        int main() {
          int loot = 0;
          std::thread t(addLoot, loot);
          t.join();
          std::cout << "loot: " << loot;
        }`) + "\n",
      solution: cc(`
        #include <functional>
        #include <iostream>
        #include <thread>

        void addLoot(int& loot) { loot += 100; }

        int main() {
          int loot = 0;
          std::thread t(addLoot, std::ref(loot));
          t.join();
          std::cout << "loot: " << loot;
        }`) + "\n",
      expect: "loot: 100",
      fallback: [String.raw`std::ref\s*\(\s*loot\s*\)`, String.raw`\[\s*&`],
      explain: L("Take int& loot and pass std::ref(loot), or the thread changes its own copy.", "Recibe int& loot y pasa std::ref(loot), o el hilo cambia su propia copia.", "int& loot で受けて std::ref(loot) を渡そう。でないとスレッドはコピーを変える。"),
    },
  ],
};

const overlordNotes: NoteDef[] = [
  note("defined-or-not", L("Defined, unspecified, undefined", "Definido, no especificado, indefinido", "定義済み・未規定・未定義"),
    p(
      "C++ sorts behavior into three bins. DEFINED: the standard says exactly what happens. UNSPECIFIED: a few outcomes are allowed and the compiler picks one, but the program is still valid. UNDEFINED (UB): the standard places no limits at all; the program may crash, print garbage or seem to work today and break tomorrow.",
      "C++ separa el comportamiento en tres cajas. DEFINIDO: el estándar dice exactamente qué pasa. NO ESPECIFICADO: se permiten algunos resultados y el compilador elige uno, pero el programa sigue siendo válido. INDEFINIDO (UB): el estándar no pone ningún límite; el programa puede caerse, imprimir basura o parecer funcionar hoy y romperse mañana.",
      "C++ の動作は3つに分かれる。定義済み：標準が何が起きるか正確に決めている。未規定：いくつかの結果が許され、コンパイラがどれかを選ぶが、プログラムは正しいまま。未定義（UB）：標準は何の制限もしない。落ちる、ゴミを出す、今日は動いて明日こわれる、何でもありうる。",
    ),
    p(
      "Unsigned integers WRAP: going past the maximum starts again at 0, and that is defined. Signed integers like int do NOT wrap: overflowing them is UB, and optimizers really do assume it never happens. Reading past the end of an array is UB too: valid indexes go from 0 to size - 1.",
      "Los enteros unsigned DAN LA VUELTA: pasar el máximo vuelve a empezar en 0, y eso está definido. Los enteros con signo como int NO dan la vuelta: desbordarlos es UB, y los optimizadores realmente suponen que nunca pasa. Leer más allá del final de un arreglo también es UB: los índices válidos van de 0 a size - 1.",
      "unsigned 整数は一周する。最大を超えると 0 に戻り、これは定義済み。int のような符号付き整数は一周しない。オーバーフローは UB で、最適化は本当に「起きない」と仮定する。配列の終わりを超えて読むのも UB。有効な添字は 0 から size - 1。",
    ),
    ex("unsigned char c = 255;\nc = c + 1;\nstd::cout << int(c);", "0",
      L("Unsigned values wrap around: defined", "Los unsigned dan la vuelta: definido", "unsigned は一周する：定義済み")),
    ubEx("int top = INT_MAX;\nint next = top + 1;  // signed overflow",
      neverRun("int top = INT_MAX;\nint next = top + 1;\nstd::cout << next;"),
      L("Compiles, but signed overflow is UB", "Compila, pero el desborde con signo es UB", "コンパイルは通るが符号付きオーバーフローは UB")),
    p(
      "Unspecified examples: the order in which a function's arguments are evaluated in f(a(), b()), and the value of a std::string after it was moved from. The moved-from string is still valid (you can call size() or assign to it), you just can't count on what it contains.",
      "Ejemplos de no especificado: el orden en que se evalúan los argumentos de una función en f(a(), b()), y el valor de un std::string después de moverlo. El string movido sigue siendo válido (puedes llamar a size() o asignarle), solo que no puedes contar con lo que contiene.",
      "未規定の例：f(a(), b()) の引数を評価する順番、ムーブした後の std::string の値。ムーブ後の文字列は有効なまま（size() を呼んだり代入したりできる）で、中身に頼れないだけ。",
    ),
    p(
      "noexcept is a promise that a function never throws. If an exception tries to leave a noexcept function anyway, the program doesn't unwind to a catch: it calls std::terminate on the spot. That's defined, just fatal.",
      "noexcept es una promesa de que una función nunca lanza. Si aun así una excepción intenta salir de una función noexcept, el programa no busca un catch: llama a std::terminate en el acto. Eso está definido, solo que es fatal.",
      "noexcept は「この関数は決して投げない」という約束。それでも例外が noexcept 関数から出ようとすると、catch を探さずにその場で std::terminate を呼ぶ。これは定義済みで、ただ致命的なだけ。",
    ),
    { t: "code", code: 'void risky() noexcept { throw std::runtime_error("oops"); }\nint main() { risky(); }', caption: L("Ends in std::terminate, not in a catch", "Termina en std::terminate, no en un catch", "catch ではなく std::terminate で終わる"),
      check: { compiles: true, throws: "terminate", program: "#include <iostream>\n#include <stdexcept>\n\nvoid risky() noexcept { throw std::runtime_error(\"oops\"); }\n\nint main() { risky(); }\n" } },
  ),
  note("iterator-invalidation", L("Iterator invalidation", "Invalidación de iteradores", "イテレータの無効化"),
    p(
      "A vector keeps its elements in one block of memory. When push_back needs more room, it allocates a bigger block, moves everything there and frees the old one. Every iterator, pointer and reference into the old block is now INVALID: using it is undefined behavior, even if it seems to work.",
      "Un vector guarda sus elementos en un solo bloque de memoria. Cuando push_back necesita más espacio, reserva un bloque más grande, mueve todo allí y libera el viejo. Todo iterador, puntero y referencia al bloque viejo queda INVÁLIDO: usarlo es comportamiento indefinido, aunque parezca funcionar.",
      "vector は要素を1つのメモリブロックに入れる。push_back で足りなくなると、大きいブロックを確保し、全部を移して古いブロックを解放する。古いブロックを指すイテレータ・ポインタ・参照はすべて「無効」になり、使うと未定義動作。動いているように見えても。",
    ),
    ubEx("std::vector<int> v{9};\nint& first = v[0];\nv.push_back(8);  // may reallocate\nstd::cout << first;",
      neverRun("std::vector<int> v{9};\nint& first = v[0];\nv.push_back(8);\nstd::cout << first;"),
      L("Compiles, but first may refer to freed memory: UB", "Compila, pero first puede apuntar a memoria liberada: UB", "コンパイルは通るが first は解放済みかも：UB")),
    p(
      "clear(), erase and anything that reallocates invalidate iterators too. Rule of thumb: don't keep iterators across a call that changes the vector's size. If you must grow a vector while walking it, use indexes and fix the count before the loop.",
      "clear(), erase y cualquier cosa que realoje también invalidan iteradores. Regla práctica: no guardes iteradores a través de una llamada que cambie el tamaño del vector. Si debes agrandar un vector mientras lo recorres, usa índices y fija la cantidad antes del bucle.",
      "clear()、erase、再確保するものもイテレータを無効にする。目安：vector のサイズを変える呼び出しをまたいでイテレータを持ち続けない。たどりながら増やす必要があるなら、添字を使い、ループの前に個数を決めておこう。",
    ),
    ex("std::vector<int> v{4, 5};\nfor (std::size_t i = 0, n = v.size(); i < n; ++i) v.push_back(v[i] * 10);\nfor (int x : v) std::cout << x << \" \";", "4 5 40 50",
      L("Indexes stay valid when the vector grows", "Los índices siguen válidos cuando el vector crece", "vector が増えても添字は有効")),
  ),
  note("stl-recap", L("STL recap: minmax and lookups", "Repaso STL: minmax y búsquedas", "STL のおさらい：minmax と検索"),
    p(
      "std::minmax_element(begin, end) walks the range once and returns a pair of ITERATORS: first to the smallest element, second to the largest. Unpack them with structured bindings and dereference with * to get the values; subtracting begin() gives the position.",
      "std::minmax_element(begin, end) recorre el rango una vez y devuelve un par de ITERADORES: first al elemento más chico y second al más grande. Desármalos con structured bindings y desreferéncialos con * para obtener los valores; restar begin() da la posición.",
      "std::minmax_element(begin, end) は範囲を一度だけたどり、イテレータの組を返す。first が最小、second が最大を指す。構造化束縛でほどき、* で値を取り出す。begin() を引くと位置が分かる。",
    ),
    ex("std::vector<int> v{4, 9, 1};\nauto [lo, hi] = std::minmax_element(v.begin(), v.end());\nstd::cout << *lo << *hi << \" \" << (hi - v.begin());", "19 1"),
    p(
      "Lookups in map and unordered_map: operator[] inserts a default value when the key is missing, so it changes size(). count(key) and contains(key) only look and never insert. Order of evaluation in a cout chain is left to right since C++17, so a size() printed before an insertion shows the old size.",
      "Búsquedas en map y unordered_map: operator[] inserta un valor por defecto si falta la clave, así que cambia size(). count(clave) y contains(clave) solo miran y nunca insertan. Desde C++17, una cadena de cout se evalúa de izquierda a derecha, así que un size() impreso antes de una inserción muestra el tamaño viejo.",
      "map と unordered_map の検索：operator[] はキーがないと標準値を追加するので size() が変わる。count(key) と contains(key) は見るだけで追加しない。C++17 から cout のチェーンは左から右に評価されるので、追加より前に表示した size() は古いサイズ。",
    ),
    ex('std::unordered_map<std::string, int> m;\nstd::cout << m.count("x") << m.size();\nm["x"];\nstd::cout << m.size();', "001",
      L("count looks; [] inserts", "count mira; [] inserta", "count は見る、[] は追加")),
  ),
  note("overloads-and-state", L("Overload picks and lambda state", "Elegir sobrecargas y estado de lambdas", "オーバーロードの選択とラムダの状態"),
    p(
      "When a normal function and a function template could both take a call, the compiler ranks the conversions needed. If both are an exact match, the non-template wins. If the template can match exactly but the normal function needs a conversion, the template wins. Writing f<T>(...) explicitly always calls the template.",
      "Cuando una función normal y una plantilla de función pueden tomar una llamada, el compilador ordena las conversiones necesarias. Si ambas coinciden exactamente, gana la que no es plantilla. Si la plantilla coincide exacto pero la normal necesita una conversión, gana la plantilla. Escribir f<T>(...) explícitamente siempre llama a la plantilla.",
      "ふつうの関数と関数テンプレートの両方が呼び出しを受けられるとき、コンパイラは必要な変換を比べる。両方とも完全一致なら非テンプレートが勝つ。テンプレートは完全一致で、ふつうの関数は変換が必要なら、テンプレートが勝つ。f<T>(...) と明示すれば必ずテンプレート。",
    ),
    ex(cc(`
      template <typename T> void tag(T) { std::cout << "tmpl "; }
      void tag(double) { std::cout << "double "; }
      int main() { tag(2.0); tag(2.0f); tag<double>(2.0); }`), "double tmpl tmpl",
      L("float needs a conversion to double, so the template matches better", "float necesita conversión a double, así que la plantilla encaja mejor", "float は double への変換が必要なのでテンプレートが勝つ")),
    p(
      "A lambda with captures is an object, and its captured variables are its data members. [n = 0] is an init capture: it creates a member n starting at 0. With mutable, each call can update it. Copying the lambda copies that state at that moment; after that, the two copies count independently.",
      "Una lambda con capturas es un objeto, y sus variables capturadas son sus miembros. [n = 0] es una captura con inicio: crea un miembro n que empieza en 0. Con mutable, cada llamada puede actualizarlo. Copiar la lambda copia ese estado en ese momento; desde ahí, las dos copias cuentan por separado.",
      "キャプチャのあるラムダはオブジェクトで、キャプチャした変数はそのメンバー。[n = 0] は初期化キャプチャで、0 から始まるメンバー n を作る。mutable なら呼ぶたびに更新できる。ラムダをコピーするとその瞬間の状態がコピーされ、その後2つは別々に数える。",
    ),
    ex('auto next = [id = 10]() mutable { return id++; };\nnext();\nauto twin = next;\nstd::cout << next() << " " << twin() << " " << next();', "11 11 12",
      L("twin copied the state after the first call", "twin copió el estado después de la primera llamada", "twin は1回目の後の状態をコピーした")),
  ),
];

// ─── 4.5 Boss: Undefined Overlord ──────────────────────────────────────────
const boss: LessonDef = {
  slug: "undefined-overlord",
  title: L("Boss: Undefined Overlord", "Jefe: Señor Indefinido", "ボス：未定義の覇王"),
  concept: "undefined-behavior",
  mode: "boss",
  xp: 200,
  enemy: "cpp/ub-imp",
  enemyName: L("UNDEFINED OVERLORD", "SEÑOR INDEFINIDO", "未定義の覇王"),
  notes: overlordNotes,
  beats: [
    enemySays(L(
      "I AM THE UNDEFINED OVERLORD. In my realm, code can do ANYTHING. Tell me: defined, or undefined?",
      "SOY EL SEÑOR INDEFINIDO. En mi reino, el código puede hacer CUALQUIER COSA. Dime: ¿definido o indefinido?",
      "我は未定義の覇王。わが領土ではコードは何でもしうる。答えよ、定義済みか、未定義か？",
    )),
    {
      kind: "predict", time: 20, prompt: PRINT,
      hint: L("Is u signed or unsigned? Only one of those kinds has defined wraparound.", "¿u tiene signo o es unsigned? Solo uno de esos tipos tiene vuelta definida.", "u は符号付き？unsigned？一周が定義されているのは片方だけ。"),
      note: "defined-or-not",
      code: "unsigned int u = UINT_MAX;\nu = u + 1;\nstd::cout << u;",
      options: ["0", UB, "4294967296"], answer: 0, output: "0",
      check: { compiles: true, stdout: "0", program: "#include <climits>\n#include <iostream>\n\nint main() {\n    unsigned int u = UINT_MAX;\n    u = u + 1;\n    std::cout << u;\n}\n" },
      explain: L("Unsigned math wraps around: it's defined, so it prints 0.", "La aritmética unsigned da la vuelta: está definida e imprime 0.", "unsigned は一周する。定義済みなので 0。"),
    },
    {
      kind: "predict", time: 15, prompt: DEFINED,
      hint: L("big is a signed int at its maximum. Does the standard define what +1 gives?", "big es un int con signo en su máximo. ¿El estándar define qué da +1?", "big は最大値の符号付き int。+1 の結果を標準は決めている？"),
      note: "defined-or-not",
      code: "int big = INT_MAX;\nstd::cout << big + 1;",
      options: [UB, L("Prints INT_MIN", "Imprime INT_MIN", "INT_MIN を表示"), L("Prints 0", "Imprime 0", "0 を表示")], answer: 0,
      check: { compiles: true, program: neverRun("int big = INT_MAX;\nstd::cout << big + 1;") },
      explain: L("Signed overflow is UB, unlike unsigned wraparound.", "El desborde con signo es UB, a diferencia del unsigned.", "符号付きのオーバーフローは UB。unsigned とは違う。"),
    },
    {
      kind: "predict", time: 20, prompt: DEFINED,
      hint: L("Can push_back move the vector's memory while it still points into it?", "¿Puede push_back mover la memoria del vector mientras it aún apunta a ella?", "it が指している間に push_back が vector のメモリを移すことは？"),
      note: "iterator-invalidation",
      code: "std::vector<int> v{1, 2, 3};\nfor (auto it = v.begin(); it != v.end(); ++it)\n  if (*it == 2) v.push_back(4);",
      options: [UB, L("Defined: adds a 4", "Definido: agrega un 4", "定義済み：4 が増える")], answer: 0,
      check: { compiles: true, program: neverRun("std::vector<int> v{1, 2, 3};\nfor (auto it = v.begin(); it != v.end(); ++it)\n    if (*it == 2) v.push_back(4);") },
      explain: L("push_back may reallocate and invalidate it.", "push_back puede realojar e invalidar it.", "push_back で再確保され it が無効になりうる。"),
    },
    {
      kind: "predict", time: 15, prompt: DEFINED,
      hint: L("What happens to existing iterators when the vector is cleared?", "¿Qué les pasa a los iteradores existentes cuando se vacía el vector?", "vector を clear すると既存のイテレータはどうなる？"),
      note: "iterator-invalidation",
      code: "std::vector<int> v{1, 2, 3};\nauto it = v.begin();\nv.clear();\nstd::cout << *it;",
      options: [UB, L("Prints 1", "Imprime 1", "1 を表示")], answer: 0,
      check: { compiles: true, program: neverRun("std::vector<int> v{1, 2, 3};\nauto it = v.begin();\nv.clear();\nstd::cout << *it;") },
      explain: L("clear() invalidates every iterator; *it is UB.", "clear() invalida todos los iteradores; *it es UB.", "clear() で全イテレータが無効。*it は UB。"),
    },
    {
      kind: "predict", time: 15, prompt: DEFINED,
      hint: L("An array of 3 has valid indexes 0 to 2. Is index 3 inside?", "Un arreglo de 3 tiene índices válidos de 0 a 2. ¿El índice 3 está adentro?", "要素3個の配列の有効な添字は 0〜2。3 は範囲内？"),
      note: "defined-or-not",
      code: "int arr[3] = {1, 2, 3};\nstd::cout << arr[3];",
      options: [UB, L("Prints 0", "Imprime 0", "0 を表示")], answer: 0,
      check: { compiles: true, program: neverRun("int arr[3] = {1, 2, 3};\nstd::cout << arr[3];") },
      explain: L("Valid indexes are 0 to 2. arr[3] is out of bounds: UB.", "Los índices válidos son 0 a 2. arr[3] se sale: UB.", "有効なのは 0〜2。arr[3] は範囲外で UB。"),
    },
    {
      kind: "predict", time: 20, prompt: DEFINED,
      hint: L("A moved-from string is still a valid object. Is its content guaranteed, though?", "Un string movido sigue siendo un objeto válido. ¿Pero su contenido está garantizado?", "ムーブ後の string は有効なオブジェクト。でも中身は保証される？"),
      note: "defined-or-not",
      code: 'std::string s = "x";\nstd::string t = std::move(s);\nstd::cout << s.size();',
      options: [L("Defined, value unspecified", "Definido, valor no especificado", "定義済み、値は未規定"), UB], answer: 0,
      check: { compiles: true, program: neverRun('std::string s = "x";\nstd::string t = std::move(s);\nstd::cout << s.size();') },
      explain: L("A moved-from string is valid but unspecified: safe to use, just don't rely on its value.", "Un string movido es válido pero no especificado: se puede usar, sin confiar en su valor.", "ムーブ後の string は有効だが値は未規定。使えるが値に頼らない。"),
    },
    {
      kind: "predict", time: 20, prompt: L("In g(a(), b()), the order is…", "En g(a(), b()), el orden es…", "g(a(), b()) の順番は…"),
      hint: L("Does the standard fix the order of function arguments? Unspecified is not the same as UB.", "¿El estándar fija el orden de los argumentos? No especificado no es lo mismo que UB.", "引数の評価順を標準は決めている？未規定は UB とは違う。"),
      note: "defined-or-not",
      code: 'int a() { std::cout << "a"; return 1; }\nint b() { std::cout << "b"; return 2; }\nvoid g(int, int) {}\nint main() { g(a(), b()); }',
      options: [L("Unspecified", "No especificado", "未規定"), L("Always left to right", "Siempre de izquierda a derecha", "いつも左から右"), UB], answer: 0,
      check: { compiles: true, program: neverRun("g(a(), b());", 'int a() { std::cout << "a"; return 1; }\nint b() { std::cout << "b"; return 2; }\nvoid g(int, int) {}') },
      explain: L("Argument order is unspecified: either is allowed, but it isn't UB.", "El orden de los argumentos no está especificado: vale cualquiera, pero no es UB.", "引数の評価順は未規定。どちらもありだが UB ではない。"),
    },
    {
      kind: "predict", time: 20, prompt: L("boom() is called. What happens?", "Se llama a boom(). ¿Qué pasa?", "boom() を呼ぶとどうなる？"),
      hint: L("noexcept promises no exception escapes. What runs if one tries anyway?", "noexcept promete que no escapa ninguna excepción. ¿Qué se ejecuta si una lo intenta?", "noexcept は例外を外に出さない約束。それでも出ようとしたら？"),
      note: "defined-or-not",
      code: "void boom() noexcept { throw 1; }\nint main() { boom(); }",
      options: [L("std::terminate", "std::terminate", "std::terminate"), L("The exception escapes", "La excepción escapa", "例外が外に出る"), UB], answer: 0,
      check: { compiles: true, throws: "terminate", program: "#include <iostream>\n\nvoid boom() noexcept { throw 1; }\n\nint main() { boom(); }\n" },
      explain: L("A throw out of a noexcept function calls std::terminate.", "Lanzar desde una función noexcept llama a std::terminate.", "noexcept 関数から投げると std::terminate。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      hint: L("The pair holds iterators to the smallest and largest elements. Dereference both.", "El par guarda iteradores al menor y al mayor. Desreferencia ambos.", "組は最小と最大を指すイテレータ。両方を * で取り出そう。"),
      note: "stl-recap",
      code: "std::vector<int> v{5, 3, 8};\nauto [mn, mx] = std::minmax_element(v.begin(), v.end());\nstd::cout << *mn << *mx;",
      options: ["38", "58", "83"], answer: 0, output: "38",
      check: { compiles: true, stdout: "38" },
      explain: L("minmax_element returns a pair of iterators: min 3, max 8.", "minmax_element devuelve un par de iteradores: mínimo 3, máximo 8.", "minmax_element はイテレータの組を返す：最小 3、最大 8。"),
    },
    {
      kind: "predict", time: 20, prompt: PRINT,
      hint: L("[] inserts a missing key; count only looks. Track size() step by step.", "[] inserta una clave que falta; count solo mira. Sigue size() paso a paso.", "[] はないキーを追加、count は見るだけ。size() を順に追おう。"),
      note: "stl-recap",
      code: 'std::unordered_map<std::string, int> m{{"a", 1}};\nm["b"];\nstd::cout << m.size() << m.count("c") << m.size();',
      options: ["202", "101", "212"], answer: 0, output: "202",
      check: { compiles: true, stdout: "202" },
      explain: L("[] inserted \"b\"; count only looks, it never inserts.", "[] insertó \"b\"; count solo mira, nunca inserta.", "[] は \"b\" を追加。count は見るだけ。"),
    },
    {
      kind: "predict", time: 20, prompt: PRINT,
      hint: L("An exact non-template match beats a template. Is 1L an exact int? And <int> forces what?", "Una coincidencia exacta sin plantilla le gana a una plantilla. ¿1L es un int exacto? ¿Y <int> obliga a qué?", "完全一致の非テンプレートが勝つ。1L は int？<int> は何を強制する？"),
      note: "overloads-and-state",
      code: 'template <typename T> void show(T) { std::cout << "T "; }\nvoid show(int) { std::cout << "int "; }\nint main() { show(1); show(1L); show<int>(1); }',
      options: ["int T T", "int int int", "T T T"], answer: 0, output: "int T T ",
      check: { compiles: true, stdout: "int T T" },
      explain: L("An exact non-template match wins; 1L and <int> pick the template.", "Gana la coincidencia exacta sin plantilla; 1L y <int> eligen la plantilla.", "完全一致の非テンプレートが勝つ。1L と <int> はテンプレート。"),
    },
    {
      kind: "predict", time: 20, prompt: PRINT,
      hint: L("Copying a lambda copies its captured state at that moment. Track n in both copies.", "Copiar una lambda copia su estado capturado en ese momento. Sigue n en ambas copias.", "ラムダをコピーするとその時の状態もコピーされる。両方の n を追おう。"),
      note: "overloads-and-state",
      code: "auto counter = [n = 0]() mutable { return ++n; };\ncounter();\nauto copy = counter;\ncounter();\nstd::cout << counter() << copy();",
      options: ["32", "33", "31"], answer: 0, output: "32",
      check: { compiles: true, stdout: "32" },
      explain: L("Copying a lambda copies its state: copy starts at 1.", "Copiar una lambda copia su estado: copy empieza en 1.", "ラムダのコピーは状態もコピー。copy は 1 から。"),
    },
    enemySays(L(
      "You... told the defined from the undefined. Velocis bends to your control, knight. For now.",
      "Tú... separaste lo definido de lo indefinido. Velocis se rinde a tu control, caballero. Por ahora.",
      "定義と未定義を見分けたか…。ヴェロシスはそなたの制御に従おう、騎士よ。今はな。",
    )),
  ],
};

export const templateTower: RegionDef = {
  slug: "template-tower",
  name: L("Template Tower", "Torre de Plantillas", "テンプレートの塔"),
  subtitle: L("Templates, lambdas, C++20, threads", "Plantillas, lambdas, C++20, hilos", "テンプレート・ラムダ・C++20・スレッド"),
  theme: "tower",
  lessons: [forge, lambdas, relics, threads, boss],
};
