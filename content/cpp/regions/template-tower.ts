import type { Beat, LessonDef, RegionDef, Text } from "../../../lib/content/types.ts";
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

// ─── 4.1 The template forge ────────────────────────────────────────────────
const forge: LessonDef = {
  slug: "template-forge",
  title: L("The template forge", "La forja de plantillas", "テンプレートの鍛冶場"),
  concept: "templates",
  mode: "lesson",
  xp: 80,
  enemy: "cpp/segfault-skull",
  enemyName: L("MOLD SKULL", "CRÁNEO MOLDE", "カタワクスカル"),
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

// ─── 4.2 Lambda scrolls and the STL ────────────────────────────────────────
const lambdas: LessonDef = {
  slug: "lambda-scrolls",
  title: L("Lambda scrolls", "Pergaminos lambda", "ラムダの巻物"),
  concept: "lambdas",
  mode: "lesson",
  xp: 80,
  enemy: "cpp/dangling-wraith",
  enemyName: L("CAPTURE WRAITH", "ESPECTRO CAPTURA", "キャプチャレイス"),
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

// ─── 4.3 Modern relics: C++17/20 ───────────────────────────────────────────
const relics: LessonDef = {
  slug: "modern-relics",
  title: L("Modern relics", "Reliquias modernas", "モダンな秘宝"),
  concept: "modern-cpp",
  mode: "lesson",
  xp: 80,
  enemy: "cpp/leak-slime",
  enemyName: L("RELIC SLIME", "BABOSA RELIQUIA", "ヒホウスライム"),
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

// ─── 4.4 Thread storm ──────────────────────────────────────────────────────
const threads: LessonDef = {
  slug: "thread-storm",
  title: L("Thread storm", "Tormenta de hilos", "スレッドの嵐"),
  concept: "threads",
  mode: "lesson",
  xp: 85,
  enemy: "ghost",
  enemyName: L("RACE GHOST", "FANTASMA CARRERA", "レースゴースト"),
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

// ─── 4.5 Boss: Undefined Overlord ──────────────────────────────────────────
const boss: LessonDef = {
  slug: "undefined-overlord",
  title: L("Boss: Undefined Overlord", "Jefe: Señor Indefinido", "ボス：未定義の覇王"),
  concept: "undefined-behavior",
  mode: "boss",
  xp: 200,
  enemy: "cpp/ub-imp",
  enemyName: L("UNDEFINED OVERLORD", "SEÑOR INDEFINIDO", "未定義の覇王"),
  beats: [
    enemySays(L(
      "I AM THE UNDEFINED OVERLORD. In my realm, code can do ANYTHING. Tell me: defined, or undefined?",
      "SOY EL SEÑOR INDEFINIDO. En mi reino, el código puede hacer CUALQUIER COSA. Dime: ¿definido o indefinido?",
      "我は未定義の覇王。わが領土ではコードは何でもしうる。答えよ、定義済みか、未定義か？",
    )),
    {
      kind: "predict", time: 20, prompt: PRINT,
      code: "unsigned int u = UINT_MAX;\nu = u + 1;\nstd::cout << u;",
      options: ["0", UB, "4294967296"], answer: 0, output: "0",
      check: { compiles: true, stdout: "0", program: "#include <climits>\n#include <iostream>\n\nint main() {\n    unsigned int u = UINT_MAX;\n    u = u + 1;\n    std::cout << u;\n}\n" },
      explain: L("Unsigned math wraps around: it's defined, so it prints 0.", "La aritmética unsigned da la vuelta: está definida e imprime 0.", "unsigned は一周する。定義済みなので 0。"),
    },
    {
      kind: "predict", time: 15, prompt: DEFINED,
      code: "int big = INT_MAX;\nstd::cout << big + 1;",
      options: [UB, L("Prints INT_MIN", "Imprime INT_MIN", "INT_MIN を表示"), L("Prints 0", "Imprime 0", "0 を表示")], answer: 0,
      check: { compiles: true, program: neverRun("int big = INT_MAX;\nstd::cout << big + 1;") },
      explain: L("Signed overflow is UB, unlike unsigned wraparound.", "El desborde con signo es UB, a diferencia del unsigned.", "符号付きのオーバーフローは UB。unsigned とは違う。"),
    },
    {
      kind: "predict", time: 20, prompt: DEFINED,
      code: "std::vector<int> v{1, 2, 3};\nfor (auto it = v.begin(); it != v.end(); ++it)\n  if (*it == 2) v.push_back(4);",
      options: [UB, L("Defined: adds a 4", "Definido: agrega un 4", "定義済み：4 が増える")], answer: 0,
      check: { compiles: true, program: neverRun("std::vector<int> v{1, 2, 3};\nfor (auto it = v.begin(); it != v.end(); ++it)\n    if (*it == 2) v.push_back(4);") },
      explain: L("push_back may reallocate and invalidate it.", "push_back puede realojar e invalidar it.", "push_back で再確保され it が無効になりうる。"),
    },
    {
      kind: "predict", time: 15, prompt: DEFINED,
      code: "std::vector<int> v{1, 2, 3};\nauto it = v.begin();\nv.clear();\nstd::cout << *it;",
      options: [UB, L("Prints 1", "Imprime 1", "1 を表示")], answer: 0,
      check: { compiles: true, program: neverRun("std::vector<int> v{1, 2, 3};\nauto it = v.begin();\nv.clear();\nstd::cout << *it;") },
      explain: L("clear() invalidates every iterator; *it is UB.", "clear() invalida todos los iteradores; *it es UB.", "clear() で全イテレータが無効。*it は UB。"),
    },
    {
      kind: "predict", time: 15, prompt: DEFINED,
      code: "int arr[3] = {1, 2, 3};\nstd::cout << arr[3];",
      options: [UB, L("Prints 0", "Imprime 0", "0 を表示")], answer: 0,
      check: { compiles: true, program: neverRun("int arr[3] = {1, 2, 3};\nstd::cout << arr[3];") },
      explain: L("Valid indexes are 0 to 2. arr[3] is out of bounds: UB.", "Los índices válidos son 0 a 2. arr[3] se sale: UB.", "有効なのは 0〜2。arr[3] は範囲外で UB。"),
    },
    {
      kind: "predict", time: 20, prompt: DEFINED,
      code: 'std::string s = "x";\nstd::string t = std::move(s);\nstd::cout << s.size();',
      options: [L("Defined, value unspecified", "Definido, valor no especificado", "定義済み、値は未規定"), UB], answer: 0,
      check: { compiles: true, program: neverRun('std::string s = "x";\nstd::string t = std::move(s);\nstd::cout << s.size();') },
      explain: L("A moved-from string is valid but unspecified: safe to use, just don't rely on its value.", "Un string movido es válido pero no especificado: se puede usar, sin confiar en su valor.", "ムーブ後の string は有効だが値は未規定。使えるが値に頼らない。"),
    },
    {
      kind: "predict", time: 20, prompt: L("In g(a(), b()), the order is…", "En g(a(), b()), el orden es…", "g(a(), b()) の順番は…"),
      code: 'int a() { std::cout << "a"; return 1; }\nint b() { std::cout << "b"; return 2; }\nvoid g(int, int) {}\nint main() { g(a(), b()); }',
      options: [L("Unspecified", "No especificado", "未規定"), L("Always left to right", "Siempre de izquierda a derecha", "いつも左から右"), UB], answer: 0,
      check: { compiles: true, program: neverRun("g(a(), b());", 'int a() { std::cout << "a"; return 1; }\nint b() { std::cout << "b"; return 2; }\nvoid g(int, int) {}') },
      explain: L("Argument order is unspecified: either is allowed, but it isn't UB.", "El orden de los argumentos no está especificado: vale cualquiera, pero no es UB.", "引数の評価順は未規定。どちらもありだが UB ではない。"),
    },
    {
      kind: "predict", time: 20, prompt: L("boom() is called. What happens?", "Se llama a boom(). ¿Qué pasa?", "boom() を呼ぶとどうなる？"),
      code: "void boom() noexcept { throw 1; }\nint main() { boom(); }",
      options: [L("std::terminate", "std::terminate", "std::terminate"), L("The exception escapes", "La excepción escapa", "例外が外に出る"), UB], answer: 0,
      check: { compiles: true, throws: "terminate", program: "#include <iostream>\n\nvoid boom() noexcept { throw 1; }\n\nint main() { boom(); }\n" },
      explain: L("A throw out of a noexcept function calls std::terminate.", "Lanzar desde una función noexcept llama a std::terminate.", "noexcept 関数から投げると std::terminate。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: "std::vector<int> v{5, 3, 8};\nauto [mn, mx] = std::minmax_element(v.begin(), v.end());\nstd::cout << *mn << *mx;",
      options: ["38", "58", "83"], answer: 0, output: "38",
      check: { compiles: true, stdout: "38" },
      explain: L("minmax_element returns a pair of iterators: min 3, max 8.", "minmax_element devuelve un par de iteradores: mínimo 3, máximo 8.", "minmax_element はイテレータの組を返す：最小 3、最大 8。"),
    },
    {
      kind: "predict", time: 20, prompt: PRINT,
      code: 'std::unordered_map<std::string, int> m{{"a", 1}};\nm["b"];\nstd::cout << m.size() << m.count("c") << m.size();',
      options: ["202", "101", "212"], answer: 0, output: "202",
      check: { compiles: true, stdout: "202" },
      explain: L("[] inserted \"b\"; count only looks, it never inserts.", "[] insertó \"b\"; count solo mira, nunca inserta.", "[] は \"b\" を追加。count は見るだけ。"),
    },
    {
      kind: "predict", time: 20, prompt: PRINT,
      code: 'template <typename T> void show(T) { std::cout << "T "; }\nvoid show(int) { std::cout << "int "; }\nint main() { show(1); show(1L); show<int>(1); }',
      options: ["int T T", "int int int", "T T T"], answer: 0, output: "int T T ",
      check: { compiles: true, stdout: "int T T" },
      explain: L("An exact non-template match wins; 1L and <int> pick the template.", "Gana la coincidencia exacta sin plantilla; 1L y <int> eligen la plantilla.", "完全一致の非テンプレートが勝つ。1L と <int> はテンプレート。"),
    },
    {
      kind: "predict", time: 20, prompt: PRINT,
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
