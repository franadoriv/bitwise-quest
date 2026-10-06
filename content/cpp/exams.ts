import type { ExamDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import {
  accountTask, clampAllTask, countWordsTask, joinAllTask, linkedListTask, lruCacheTask, palindromeTask,
  parallelSumTask, reverseWordsTask, scopedCounterTask, sortByLengthTask, sumCsvTask,
} from "./tasks.ts";

// Entry exams that simulate company screenings for C++ roles (game studios, systems, trading firms).
// Topics, levels and bank sizes follow docs/research/cpp-curriculum.md ("Entry exam") and
// docs/research/cpp-hiring-assessments.md. Every compile, output or crash claim carries a `check`
// (g++ 14, -std=c++20 -O1 on Compiler Explorer): `npm run content:verify -- --lang=cpp --only=exam:`.
// UB questions only prove the snippet compiles; their answer never depends on what the binary prints.

const code = (...lines: string[]) => lines.join("\n");

const YN_NO = [L("Yes", "Sí", "はい"), L("No", "No", "いいえ")];
const PRINTS = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");
const UB = L("Undefined behavior", "Comportamiento indefinido", "未定義動作");

const TORCH = [
  "struct Torch {",
  "  std::string n;",
  '  Torch(std::string n) : n(n) { std::cout << "+" << n; }',
  '  ~Torch() { std::cout << "-" << n; }',
  "};",
];

const ITEM = [
  "struct Item {",
  "  Item() {}",
  '  Item(const Item&) { std::cout << "copy "; }',
  '  Item(Item&&) noexcept { std::cout << "move "; }',
  "};",
];

const ANIMAL = [
  "struct Animal {",
  '  virtual std::string sound() const { return "..."; }',
  "  virtual ~Animal() = default;",
  "};",
  'struct Dog : Animal { std::string sound() const override { return "woof"; } };',
];

export const exams: ExamDef[] = [
  // ─── JUNIOR ───────────────────────────────────────────────────────────────
  {
    slug: "junior",
    level: "junior",
    title: L("Junior C++ Developer", "Desarrollador C++ Junior", "ジュニア C++ 開発者"),
    description: L(
      "Simulates a first C++ screening: values, references, pointers, vectors, classes and destructors.",
      "Simula una primera entrevista C++: valores, referencias, punteros, vectores, clases y destructores.",
      "C++ の一次選考を再現：値、参照、ポインタ、vector、クラス、デストラクタ。",
    ),
    count: 12,
    passPct: 70,
    secondsPerQuestion: 30,
    codeCount: 1,
    questions: [
      // coding tasks (docs/research/coding-tasks-and-written-tests.md)
      reverseWordsTask, clampAllTask, palindromeTask, accountTask,
      // basics
      {
        topic: "basics", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: 'std::cout << 7 / 2 << " " << 7.0 / 2;',
        options: ["3 3.5", "3.5 3.5", "4 3.5"], answer: 0,
        explain: L(
          "int / int is integer division: the fraction is cut off (7 / 2 is 3). If one side is a double, you get 3.5.",
          "int / int es división entera: se corta la parte decimal (7 / 2 da 3). Si un lado es double, da 3.5.",
          "int 同士の割り算は整数除算で小数部は切り捨て（7 / 2 は 3）。片方が double なら 3.5 になるよ。",
        ),
        check: { compiles: true, stdout: "3 3.5" },
      },
      {
        topic: "basics", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("int x{3.7};", "std::cout << x;"),
        options: [L("Yes, prints 3", "Sí, imprime 3", "はい、3 と表示"), L("No: narrowing in braces", "No: estrechamiento en llaves", "いいえ：波括弧での縮小変換")], answer: 1,
        explain: L(
          "Brace initialization forbids narrowing: a double can't silently lose its fraction. int x = 3.7; would compile and give 3.",
          "La inicialización con llaves prohíbe el estrechamiento: un double no pierde decimales en silencio. int x = 3.7; sí compila (da 3).",
          "波括弧初期化は縮小変換を禁止する。double の小数が黙って消えないように。int x = 3.7; なら通って 3 になる。",
        ),
        check: { compiles: false },
      },
      {
        topic: "basics", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "int next() {",
          "  static int n = 0;",
          "  return ++n;",
          "}",
          "int main() {",
          "  next();",
          "  next();",
          "  std::cout << next();",
          "}",
        ),
        options: ["1", "3", "0"], answer: 1,
        explain: L(
          "A static local is initialized once and keeps its value between calls, so the third call returns 3.",
          "Una variable local static se inicializa una sola vez y conserva su valor entre llamadas: la tercera devuelve 3.",
          "static なローカル変数は一度だけ初期化され、呼び出しの間も値を保つ。3回目は 3 を返すよ。",
        ),
        check: { compiles: true, stdout: "3" },
      },
      // references
      {
        topic: "references", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(
          "void heal(int hp) { hp += 10; }",
          "int main() {",
          "  int hp = 5;",
          "  heal(hp);",
          "  std::cout << hp;",
          "}",
        ),
        options: ["15", "5", "10"], answer: 1,
        explain: L(
          "Parameters are copies by default: heal changes its own hp. Take int& hp to change the caller's variable.",
          "Los parámetros son copias por defecto: heal cambia su propio hp. Usa int& hp para cambiar la variable de quien llama.",
          "引数はデフォルトでコピー。heal は自分の hp を変えるだけ。呼び出し側を変えるなら int& hp にしよう。",
        ),
        check: { compiles: true, stdout: "5" },
      },
      {
        topic: "references", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("int a = 1, b = 2;", "int& r = a;", "r = b;", "b = 7;", "std::cout << a << r;"),
        options: ["22", "77", "27"], answer: 0,
        explain: L(
          "A reference can't be reseated: r = b copies b's value (2) into a. Changing b later doesn't touch a or r.",
          "Una referencia no se puede reasignar: r = b copia el valor de b (2) en a. Cambiar b después no afecta a a ni a r.",
          "参照は付け替えられない。r = b は b の値 2 を a にコピーするだけ。後で b を変えても a と r は変わらない。",
        ),
        check: { compiles: true, stdout: "22" },
      },
      {
        topic: "references", difficulty: 1, kind: "type", prompt: L("Make heal change the caller's hp", "Haz que heal cambie el hp original", "呼び出し側の hp を変えよう"),
        code: code(
          "void heal(int___ hp) { hp += 10; }",
          "int main() {",
          "  int hp = 5;",
          "  heal(hp);",
          "  std::cout << hp;",
          "}",
        ),
        answer: "&",
        explain: L(
          "int& is a reference: hp becomes another name for the caller's variable, so += 10 changes it and 15 is printed.",
          "int& es una referencia: hp pasa a ser otro nombre de la variable original, así que += 10 la cambia e imprime 15.",
          "int& は参照。hp が呼び出し側の変数の別名になるので、+= 10 で元が変わり 15 と表示される。",
        ),
        check: { compiles: true, stdout: "15" },
      },
      // pointers
      {
        topic: "pointers", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("int a = 1, b = 2;", "int* p = &a;", "p = &b;", "*p = 9;", "std::cout << a << b;"),
        options: ["91", "19", "99"], answer: 1,
        explain: L(
          "Unlike a reference, a pointer can be reseated: p = &b makes it point to b, so *p = 9 writes into b.",
          "A diferencia de una referencia, un puntero se puede reasignar: p = &b lo apunta a b, así que *p = 9 escribe en b.",
          "参照と違い、ポインタは付け替えられる。p = &b で b を指すので、*p = 9 は b に書き込む。",
        ),
        check: { compiles: true, stdout: "19" },
      },
      {
        topic: "pointers", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("int x = 1;", "const int* p = &x;", "*p = 2;"),
        options: YN_NO, answer: 1,
        explain: L(
          "const int* is a pointer to const int: you can't write through it. int* const is the other one: a fixed pointer.",
          "const int* es un puntero a int constante: no puedes escribir a través de él. int* const es otra cosa: un puntero fijo.",
          "const int* は「const int へのポインタ」で、経由して書き込めない。int* const は指す先を変えられないポインタ。",
        ),
        check: { compiles: false },
      },
      {
        topic: "pointers", difficulty: 1, kind: "pick", prompt: L("Point p at hp", "Haz que p apunte a hp", "p が hp を指すように"),
        code: code("int hp = 5;", "int* p = ___hp;", "*p += 1;", "std::cout << hp;"),
        options: ["&", "*"], answer: 0,
        explain: L(
          "&hp takes the address of hp. * is the opposite: it follows a pointer, and an int is not a pointer.",
          "&hp toma la dirección de hp. * hace lo contrario: sigue un puntero, y un int no es un puntero.",
          "&hp で hp のアドレスを取る。* は逆にポインタをたどる操作で、int はポインタではない。",
        ),
        check: { compiles: true, stdout: "6", wrongFail: true },
      },
      // containers
      {
        topic: "containers", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("std::vector<int> a(3);", "std::vector<int> b{3};", "std::cout << a.size() << b.size();"),
        options: ["33", "31", "13"], answer: 1,
        explain: L(
          "Parentheses call the size constructor: three zeros. Braces prefer the initializer_list: one element, 3.",
          "Los paréntesis llaman al constructor de tamaño: tres ceros. Las llaves prefieren initializer_list: un elemento, 3.",
          "丸括弧はサイズ指定のコンストラクタで 0 が3つ。波括弧は initializer_list 優先で要素 3 が1つ。",
        ),
        check: { compiles: true, stdout: "31" },
      },
      {
        topic: "containers", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code('std::string s = "a" + "b";', "std::cout << s;"),
        options: YN_NO, answer: 1,
        explain: L(
          "\"a\" and \"b\" are C arrays (const char*), not std::string, and two pointers can't be added. std::string(\"a\") + \"b\" works.",
          "\"a\" y \"b\" son arrays de C (const char*), no std::string, y dos punteros no se suman. std::string(\"a\") + \"b\" sí funciona.",
          "\"a\" と \"b\" は std::string ではなく C の配列（const char*）で、足せない。std::string(\"a\") + \"b\" なら OK。",
        ),
        check: { compiles: false },
      },
      {
        topic: "containers", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code('std::string s = "hero";', "std::cout << s.substr(1) << s.find(\"ro\");"),
        options: ["ero2", "her2", "ero3"], answer: 0,
        explain: L(
          "Indexes start at 0: substr(1) drops the first char and \"ro\" starts at index 2. A miss returns std::string::npos.",
          "Los índices empiezan en 0: substr(1) quita el primer carácter y \"ro\" empieza en el índice 2. Si no está, da npos.",
          "添字は 0 から。substr(1) は先頭1文字を除き、\"ro\" は 2 番目から始まる。見つからなければ npos。",
        ),
        check: { compiles: true, stdout: "ero2" },
      },
      // classes
      {
        topic: "classes", difficulty: 1, kind: "predict", prompt: COMPILES,
        code: code("class Hero {", "  int hp = 100;", "};", "int main() {", "  Hero h;", "  std::cout << h.hp;", "}"),
        options: YN_NO, answer: 1,
        explain: L(
          "Members of a class are private by default, so main can't read hp. A struct is public by default; or add public:.",
          "Los miembros de una class son privados por defecto, así que main no puede leer hp. Un struct es público por defecto.",
          "class のメンバーはデフォルトで private なので main から hp は読めない。struct はデフォルトで public。",
        ),
        check: { compiles: false },
      },
      {
        topic: "classes", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "struct Hero {",
          "  int hp = 100;",
          "  void hit() { hp -= 30; }",
          "};",
          "int main() {",
          "  Hero a;",
          "  Hero b = a;",
          "  b.hit();",
          '  std::cout << a.hp << " " << b.hp;',
          "}",
        ),
        options: ["70 70", "100 70", "100 100"], answer: 1,
        explain: L(
          "C++ objects are values: Hero b = a makes an independent copy. Hitting b leaves a untouched.",
          "Los objetos en C++ son valores: Hero b = a hace una copia independiente. Golpear a b no toca a a.",
          "C++ のオブジェクトは値。Hero b = a で独立したコピーができ、b を攻撃しても a は変わらない。",
        ),
        check: { compiles: true, stdout: "100 70" },
      },
      {
        topic: "classes", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code(
          "struct Hero {",
          "  int hp = 1;",
          "  int get() { return hp; }",
          "};",
          "int main() {",
          "  const Hero h;",
          "  std::cout << h.get();",
          "}",
        ),
        options: [L("Yes, prints 1", "Sí, imprime 1", "はい、1 と表示"), L("No: get() is not const", "No: get() no es const", "いいえ：get() が const でない")], answer: 1,
        explain: L(
          "On a const object you may only call const member functions. Declare int get() const { ... } to promise no changes.",
          "En un objeto const solo puedes llamar funciones miembro const. Declara int get() const { ... } para prometer que no cambia.",
          "const オブジェクトからは const メンバー関数しか呼べない。int get() const { ... } と宣言しよう。",
        ),
        check: { compiles: false },
      },
      // raii
      {
        topic: "raii", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(...TORCH, "int main() {", '  Torch a("a");', '  Torch b("b");', "}"),
        options: ["+a+b-a-b", "+a+b-b-a", "+a-a+b-b"], answer: 1,
        explain: L(
          "Locals are destroyed at the end of their scope in reverse order of construction: b first, then a.",
          "Las variables locales se destruyen al final de su ámbito en orden inverso a su construcción: primero b, luego a.",
          "ローカル変数はスコープの終わりで、作られた順の逆に破棄される。先に b、次に a。",
        ),
        check: { compiles: true, stdout: "+a+b-b-a" },
      },
      {
        topic: "raii", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(...TORCH, "int main() {", '  Torch a("a");', '  { Torch b("b"); }', '  Torch c("c");', "}"),
        options: ["+a+b+c-c-b-a", "+a+b-b+c-c-a", "+a+b-b+c-a-c"], answer: 1,
        explain: L(
          "The inner braces are a scope: b dies at its closing brace, before c is born. That's how RAII ties lifetime to scope.",
          "Las llaves internas son un ámbito: b muere en su llave de cierre, antes de que nazca c. Así RAII ata la vida al ámbito.",
          "内側の波括弧はスコープ。b はその閉じ括弧で破棄され、c より先に消える。RAII は寿命をスコープに結びつける。",
        ),
        check: { compiles: true, stdout: "+a+b-b+c-c-a" },
      },
      {
        topic: "raii", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          ...TORCH,
          "int main() {",
          '  try { Torch a("a"); throw 1; }',
          '  catch (int) { std::cout << "!"; }',
          "}",
        ),
        options: ["+a!", "+a-a!", "+a!-a"], answer: 1,
        explain: L(
          "When an exception leaves a scope, its locals are destroyed (stack unwinding) before the catch runs. No leak.",
          "Cuando una excepción sale de un ámbito, sus locales se destruyen (stack unwinding) antes del catch. Sin fugas.",
          "例外がスコープを抜けると、catch の前にローカル変数が破棄される（スタック巻き戻し）。リークしない。",
        ),
        check: { compiles: true, stdout: "+a-a!" },
      },
      // polymorphism
      {
        topic: "polymorphism", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(...ANIMAL, "int main() {", "  Dog d;", "  Animal& a = d;", "  std::cout << a.sound();", "}"),
        options: ["...", "woof"], answer: 1,
        explain: L(
          "sound is virtual, so a call through an Animal& runs the real object's version: Dog's.",
          "sound es virtual, así que una llamada a través de Animal& ejecuta la versión del objeto real: la de Dog.",
          "sound は virtual なので、Animal& 経由の呼び出しでも実体の Dog 版が動くよ。",
        ),
        check: { compiles: true, stdout: "woof" },
      },
      {
        topic: "polymorphism", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          'struct Animal { std::string sound() const { return "..."; } };',
          'struct Dog : Animal { std::string sound() const { return "woof"; } };',
          "int main() {",
          "  Dog d;",
          "  Animal& a = d;",
          "  std::cout << a.sound();",
          "}",
        ),
        options: ["...", "woof"], answer: 0,
        explain: L(
          "Without virtual, the call is chosen by the static type (Animal&), not the object. Mark it virtual and use override.",
          "Sin virtual, la llamada se elige por el tipo estático (Animal&), no por el objeto. Márcala virtual y usa override.",
          "virtual がないと、呼ぶ関数は実体ではなく静的な型（Animal&）で決まる。virtual と override を付けよう。",
        ),
        check: { compiles: true, stdout: "..." },
      },
      // ub
      {
        topic: "ub", difficulty: 1, kind: "predict", prompt: HAPPENS,
        code: code("std::vector<int> v{1, 2, 3};", "std::cout << v[5];"),
        options: [L("Prints 0", "Imprime 0", "0 と表示"), L("Throws std::out_of_range", "Lanza std::out_of_range", "std::out_of_range を投げる"), UB], answer: 2,
        explain: L(
          "operator[] does no bounds check: reading past the end is undefined behavior. v.at(5) checks and throws out_of_range.",
          "operator[] no comprueba límites: leer fuera es comportamiento indefinido. v.at(5) sí comprueba y lanza out_of_range.",
          "operator[] は範囲チェックをしない。範囲外の読み取りは未定義動作。v.at(5) ならチェックして例外を投げる。",
        ),
        check: { compiles: true },
      },
      {
        topic: "ub", difficulty: 2, kind: "predict", prompt: L("Is this safe to use?", "¿Es seguro usarlo?", "安全に使える？"),
        code: code("int* make() {", "  int x = 5;", "  return &x;", "}", "int main() {", "  int* p = make();", "  // ... later: std::cout << *p;", "}"),
        options: [L("Yes, prints 5", "Sí, imprime 5", "はい、5 と表示"), L("No: dangling pointer, UB", "No: puntero colgante, UB", "いいえ：ダングリングで未定義動作")], answer: 1,
        explain: L(
          "x lives on make's stack and dies when make returns. Reading through the pointer is UB. Return the int by value.",
          "x vive en la pila de make y muere al retornar. Leer por ese puntero es UB. Devuelve el int por valor.",
          "x は make のスタック上にあり、戻ると消える。そのポインタを読むのは未定義動作。int を値で返そう。",
        ),
        check: { compiles: true },
      },
    ],
  },

  // ─── MID ──────────────────────────────────────────────────────────────────
  {
    slug: "mid",
    level: "mid",
    title: L("Mid-level C++ Developer", "Desarrollador C++ Semi-Senior", "中級 C++ 開発者"),
    description: L(
      "Simulates a mid-level screening: move semantics, smart pointers, virtual dispatch, STL and lambdas.",
      "Simula una entrevista de nivel medio: move, punteros inteligentes, despacho virtual, STL y lambdas.",
      "中級の選考を再現：ムーブ、スマートポインタ、仮想関数、STL、ラムダ。",
    ),
    count: 14,
    passPct: 70,
    secondsPerQuestion: 40,
    codeCount: 2,
    questions: [
      // coding tasks (docs/research/coding-tasks-and-written-tests.md)
      countWordsTask, scopedCounterTask, sortByLengthTask, linkedListTask,
      // move
      {
        topic: "move", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(...ITEM, "int main() {", "  const Item a;", "  Item b = std::move(a);", "}"),
        options: ["move", "copy", L("Nothing", "Nada", "何も出ない")], answer: 1,
        explain: L(
          "std::move only casts. A const Item&& can't bind to Item&&, so overload resolution falls back to the copy constructor.",
          "std::move solo convierte. Un const Item&& no encaja con Item&&, así que se elige el constructor de copia.",
          "std::move はキャストするだけ。const Item&& は Item&& に束縛できず、コピーコンストラクタが選ばれる。",
        ),
        check: { compiles: true, stdout: "copy" },
      },
      {
        topic: "move", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(...ITEM, "void take(Item i) {}", "int main() {", "  Item a;", "  take(a);", "  take(std::move(a));", "}"),
        options: ["copy copy", "copy move", "move move"], answer: 1,
        explain: L(
          "A by-value parameter is built from the argument: an lvalue is copied, an rvalue (std::move(a)) is moved.",
          "Un parámetro por valor se construye con el argumento: un lvalue se copia, un rvalue (std::move(a)) se mueve.",
          "値渡しの引数は実引数から作られる。左辺値ならコピー、右辺値（std::move(a)）ならムーブ。",
        ),
        check: { compiles: true, stdout: "copy move" },
      },
      {
        topic: "move", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code(...ITEM, "int main() {", "  Item a, b;", "  b = a;", "}"),
        options: YN_NO, answer: 1,
        explain: L(
          "Declaring a move constructor deletes the implicit copy assignment. Rule of 5: if you write one special member, write them all.",
          "Declarar un constructor de move borra la asignación por copia implícita. Regla de 5: si escribes uno, escríbelos todos.",
          "ムーブコンストラクタを宣言すると暗黙のコピー代入は削除される。5の規則：1つ書いたら全部書こう。",
        ),
        check: { compiles: false },
      },
      // smart_pointers
      {
        topic: "smart_pointers", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(
          "auto a = std::make_shared<int>(1);",
          "{",
          "  auto b = a;",
          "  std::cout << a.use_count();",
          "}",
          "std::cout << a.use_count();",
        ),
        options: ["11", "21", "22"], answer: 1,
        explain: L(
          "Copying a shared_ptr adds an owner (count 2). When b leaves its scope it releases its share (count 1).",
          "Copiar un shared_ptr suma un dueño (cuenta 2). Cuando b sale de su ámbito libera su parte (cuenta 1).",
          "shared_ptr をコピーすると所有者が増える（2）。b がスコープを抜けると手放して 1 に戻る。",
        ),
        check: { compiles: true, stdout: "21" },
      },
      {
        topic: "smart_pointers", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("auto a = std::make_unique<int>(1);", "auto b = a;", "std::cout << *b;"),
        options: YN_NO, answer: 1,
        explain: L(
          "unique_ptr is the single owner: its copy constructor is deleted. Transfer ownership with auto b = std::move(a);.",
          "unique_ptr es el único dueño: su constructor de copia está borrado. Transfiere con auto b = std::move(a);.",
          "unique_ptr は唯一の所有者でコピーは削除されている。所有権は auto b = std::move(a); で移そう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "smart_pointers", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "struct Node {",
          "  std::shared_ptr<Node> next;",
          '  ~Node() { std::cout << "~"; }',
          "};",
          "int main() {",
          "  { auto a = std::make_shared<Node>();",
          "    auto b = std::make_shared<Node>();",
          "    a->next = b; b->next = a; }",
          '  std::cout << "end";',
          "}",
        ),
        options: ["~~end", "end", "~end"], answer: 1,
        explain: L(
          "a and b own each other, so each count stays at 1 and neither is destroyed: a leak. Make one link a weak_ptr.",
          "a y b se poseen mutuamente: cada cuenta queda en 1 y nadie se destruye, hay fuga. Haz que un enlace sea weak_ptr.",
          "a と b が互いを所有するのでカウントが 1 のまま残り、どちらも破棄されずリークする。片方を weak_ptr に。",
        ),
        check: { compiles: true, stdout: "end" },
      },
      // raii
      {
        topic: "raii", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(...TORCH, "struct Camp {", '  Torch x{"x"};', '  Torch y{"y"};', "};", "int main() { Camp c; }"),
        options: ["+x+y-x-y", "+x+y-y-x", "+y+x-x-y"], answer: 1,
        explain: L(
          "Members are built in declaration order and destroyed in reverse, after the class's own destructor body.",
          "Los miembros se construyen en orden de declaración y se destruyen al revés, tras el cuerpo del destructor de la clase.",
          "メンバーは宣言順に作られ、クラスのデストラクタ本体のあと逆順に破棄される。",
        ),
        check: { compiles: true, stdout: "+x+y-y-x" },
      },
      {
        topic: "raii", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "struct S {",
          '  S() { std::cout << "S"; }',
          '  ~S() { std::cout << "~S"; }',
          "};",
          "S& get() { static S s; return s; }",
          "int main() {",
          '  std::cout << "a";',
          "  get();",
          "  get();",
          '  std::cout << "b";',
          "}",
        ),
        options: ["aSSb~S", "aSb~S", "Sab~S"], answer: 1,
        explain: L(
          "A function-local static is built on the first call only (thread-safe since C++11) and destroyed after main returns.",
          "Un static local se construye solo en la primera llamada (seguro entre hilos desde C++11) y se destruye tras main.",
          "関数内 static は最初の呼び出しで一度だけ作られ（C++11 以降スレッド安全）、main の後に破棄される。",
        ),
        check: { compiles: true, stdout: "aSb~S" },
      },
      // classes
      {
        topic: "classes", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "struct Log { Log(const char* s) { std::cout << s; } };",
          "struct Hero {",
          "  Log b;",
          "  Log a;",
          '  Hero() : a("A"), b("B") {}',
          "};",
          "int main() { Hero h; }",
        ),
        options: ["AB", "BA"], answer: 1,
        explain: L(
          "Members are initialized in declaration order (b, then a), whatever order the init list uses. GCC warns with -Wreorder.",
          "Los miembros se inicializan en orden de declaración (b, luego a), sin importar el orden de la lista. GCC avisa con -Wreorder.",
          "メンバーは初期化子リストの順ではなく宣言順（b→a）に初期化される。GCC は -Wreorder で警告する。",
        ),
        check: { compiles: true, stdout: "BA" },
      },
      {
        topic: "classes", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          'struct Hero { Hero() { std::cout << "born "; } };',
          "int main() {",
          "  Hero h();",
          '  std::cout << "end";',
          "}",
        ),
        options: ["born end", "end", L("Compile error", "Error de compilación", "コンパイルエラー")], answer: 1,
        explain: L(
          "Most vexing parse: Hero h(); declares a function returning Hero, it creates no object. Write Hero h; or Hero h{};.",
          "Most vexing parse: Hero h(); declara una función que devuelve Hero, no crea objeto. Escribe Hero h; o Hero h{};.",
          "最も厄介な構文解析：Hero h(); は Hero を返す関数の宣言で、オブジェクトは作られない。Hero h{}; と書こう。",
        ),
        check: { compiles: true, stdout: "end" },
      },
      // inheritance
      {
        topic: "inheritance", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code(
          "struct Base { void f(int) {} };",
          "struct Derived : Base { void f() {} };",
          "int main() {",
          "  Derived d;",
          "  d.f(5);",
          "}",
        ),
        options: YN_NO, answer: 1,
        explain: L(
          "Name hiding: Derived::f hides every Base::f, so f(int) is not found. Add using Base::f; inside Derived.",
          "Ocultación de nombres: Derived::f oculta todos los Base::f, así que f(int) no se encuentra. Añade using Base::f;.",
          "名前の隠蔽：Derived::f が Base::f をすべて隠すので f(int) が見つからない。using Base::f; を追加しよう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "inheritance", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          'struct B { B() { std::cout << "B"; } ~B() { std::cout << "~B"; } };',
          'struct D : B { D() { std::cout << "D"; } ~D() { std::cout << "~D"; } };',
          "int main() { D d; }",
        ),
        options: ["BD~B~D", "BD~D~B", "DB~D~B"], answer: 1,
        explain: L(
          "The base is built first, then the derived part; destruction runs in reverse: derived first, base last.",
          "La base se construye primero y luego la parte derivada; la destrucción va al revés: derivada primero, base al final.",
          "基底クラスが先に作られ、次に派生部分。破棄はその逆で、派生が先、基底が最後。",
        ),
        check: { compiles: true, stdout: "BD~D~B" },
      },
      // polymorphism
      {
        topic: "polymorphism", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(...ANIMAL, "int main() {", "  std::vector<Animal> v;", "  v.push_back(Dog{});", "  std::cout << v[0].sound();", "}"),
        options: ["woof", "...", L("Compile error", "Error de compilación", "コンパイルエラー")], answer: 1,
        explain: L(
          "Object slicing: a vector<Animal> stores Animals, so only the Animal part of the Dog is copied. Store unique_ptr<Animal>.",
          "Slicing: un vector<Animal> guarda Animals, así que solo se copia la parte Animal del Dog. Guarda unique_ptr<Animal>.",
          "スライシング：vector<Animal> は Animal を保持するので Dog の Animal 部分だけがコピーされる。unique_ptr を使おう。",
        ),
        check: { compiles: true, stdout: "..." },
      },
      {
        topic: "polymorphism", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "struct Base {",
          "  Base() { hi(); }",
          '  virtual void hi() { std::cout << "base "; }',
          "  virtual ~Base() = default;",
          "};",
          'struct Derived : Base { void hi() override { std::cout << "derived "; } };',
          "int main() {",
          "  Derived d;",
          "  d.hi();",
          "}",
        ),
        options: ["derived derived", "base derived", "base base"], answer: 1,
        explain: L(
          "Inside Base's constructor the object is still only a Base, so the virtual call doesn't reach Derived yet.",
          "Dentro del constructor de Base el objeto todavía es solo un Base, así que la llamada virtual aún no llega a Derived.",
          "Base のコンストラクタ実行中、オブジェクトはまだ Base なので、仮想呼び出しは Derived に届かない。",
        ),
        check: { compiles: true, stdout: "base derived" },
      },
      {
        topic: "polymorphism", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code(
          "struct Base { virtual void hit(int) {} };",
          "struct Boss : Base { void hit(long) override {} };",
          "int main() { Boss b; }",
        ),
        options: YN_NO, answer: 1,
        explain: L(
          "hit(long) doesn't match hit(int), so it overrides nothing and override makes that a compile error. That's its job.",
          "hit(long) no coincide con hit(int), así que no sobrescribe nada y override lo vuelve un error de compilación.",
          "hit(long) は hit(int) と一致せず何もオーバーライドしない。override がそれをコンパイルエラーにしてくれる。",
        ),
        check: { compiles: false },
      },
      // operators
      {
        topic: "operators", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "struct Counter {",
          "  int n = 0;",
          "  Counter& operator++() { ++n; return *this; }",
          "  Counter operator++(int) { Counter old = *this; ++n; return old; }",
          "};",
          "int main() {",
          "  Counter c;",
          "  Counter a = c++;",
          "  Counter b = ++c;",
          "  std::cout << a.n << b.n << c.n;",
          "}",
        ),
        options: ["122", "022", "012"], answer: 1,
        explain: L(
          "Postfix (int dummy) returns the old value; prefix returns the updated object. Prefer ++c: no temporary copy.",
          "El postfijo (int ficticio) devuelve el valor viejo; el prefijo, el objeto actualizado. Prefiere ++c: sin copia temporal.",
          "後置（ダミーの int）は古い値を、前置は更新後のオブジェクトを返す。一時コピーのない ++c を優先しよう。",
        ),
        check: { compiles: true, stdout: "022" },
      },
      // lambdas_stl
      {
        topic: "lambdas_stl", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "int hp = 1;",
          "auto byValue = [hp] { return hp; };",
          "auto byRef = [&hp] { return hp; };",
          "hp = 5;",
          "std::cout << byValue() << byRef();",
        ),
        options: ["55", "15", "11"], answer: 1,
        explain: L(
          "[hp] copies hp when the lambda is created (1); [&hp] refers to the variable and sees the later 5.",
          "[hp] copia hp cuando se crea la lambda (1); [&hp] se refiere a la variable y ve el 5 posterior.",
          "[hp] はラムダ作成時に hp をコピー（1）。[&hp] は変数そのものを参照するので後の 5 が見える。",
        ),
        check: { compiles: true, stdout: "15" },
      },
      {
        topic: "lambdas_stl", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "std::map<std::string, int> m;",
          'if (m["ghost"] == 0) {',
          "  std::cout << m.size();",
          "}",
        ),
        options: ["0", "1", L("Throws", "Lanza", "例外")], answer: 1,
        explain: L(
          "map::operator[] inserts a default value when the key is missing. To only look, use find, contains or count.",
          "map::operator[] inserta un valor por defecto si falta la clave. Para solo mirar, usa find, contains o count.",
          "map::operator[] はキーがないとデフォルト値を挿入する。見るだけなら find、contains、count を使おう。",
        ),
        check: { compiles: true, stdout: "1" },
      },
      {
        topic: "lambdas_stl", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "std::vector<int> v{1, 0, 2, 0};",
          "auto end = std::remove(v.begin(), v.end(), 0);",
          'std::cout << v.size() << " " << v[1];',
          "v.erase(end, v.end());",
          'std::cout << " " << v.size();',
        ),
        options: ["2 2 2", "4 2 2", "4 0 2"], answer: 1,
        explain: L(
          "std::remove only shifts kept elements forward and returns the new end; size is unchanged until erase.",
          "std::remove solo mueve hacia adelante lo que se queda y devuelve el nuevo final; el tamaño no cambia hasta erase.",
          "std::remove は残す要素を前に詰めて新しい終端を返すだけ。erase するまでサイズは変わらない。",
        ),
        check: { compiles: true, stdout: "4 2 2" },
      },
      // templates
      {
        topic: "templates", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code(
          "template <typename T>",
          "T biggest(T a, T b) { return a > b ? a : b; }",
          "int main() {",
          "  std::cout << biggest(3, 7.5);",
          "}",
        ),
        options: YN_NO, answer: 1,
        explain: L(
          "Deduction gets T = int from 3 and T = double from 7.5: a conflict, and no conversion is tried while deducing.",
          "La deducción obtiene T = int de 3 y T = double de 7.5: hay conflicto, y no se prueban conversiones al deducir.",
          "推論で 3 から T = int、7.5 から T = double となり矛盾する。推論中は型変換を試さない。",
        ),
        check: { compiles: false },
      },
      {
        topic: "templates", difficulty: 2, kind: "type", prompt: L("Pick T explicitly so it compiles", "Elige T explícitamente para compilar", "T を明示してコンパイルを通そう"),
        code: code(
          "template <typename T>",
          "T biggest(T a, T b) { return a > b ? a : b; }",
          "int main() {",
          "  std::cout << biggest<___>(3, 7.5);",
          "}",
        ),
        answer: "double",
        explain: L(
          "With an explicit template argument nothing is deduced, so 3 converts to double and 7.5 is printed.",
          "Con un argumento de template explícito no se deduce nada, así que 3 se convierte a double y se imprime 7.5.",
          "テンプレート引数を明示すると推論は行われず、3 が double に変換されて 7.5 と表示される。",
        ),
        check: { compiles: true, stdout: "7.5" },
      },
      // ub
      {
        topic: "ub", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("std::vector<int> v{1, 2, 3};", "int& first = v[0];", "v.push_back(4);", "std::cout << first;"),
        options: [L("Always prints 1", "Siempre imprime 1", "必ず 1 と表示"), L("UB: first may dangle", "UB: first puede colgar", "未定義動作：first が無効かも"), L("Compile error", "Error de compilación", "コンパイルエラー")], answer: 1,
        explain: L(
          "push_back may reallocate and move the elements, which invalidates every reference and iterator into the vector.",
          "push_back puede realocar y mover los elementos, lo que invalida toda referencia e iterador al vector.",
          "push_back は再確保で要素を移動することがあり、vector を指す参照やイテレータはすべて無効になる。",
        ),
        check: { compiles: true },
      },
      {
        topic: "ub", difficulty: 3, kind: "predict", prompt: L("Is this delete correct?", "¿Es correcto este delete?", "この delete は正しい？"),
        code: code(
          "struct Base { ~Base() {} };",
          'struct Loot : Base { std::string name = "gem"; };',
          "int main() {",
          "  Base* p = new Loot;",
          "  delete p;",
          "}",
        ),
        options: [L("Yes", "Sí", "はい"), L("No: UB, ~Base isn't virtual", "No: UB, ~Base no es virtual", "いいえ：~Base が非仮想で未定義動作")], answer: 1,
        explain: L(
          "Deleting a derived object through a base pointer without a virtual destructor is UB (Loot's string may leak).",
          "Borrar un objeto derivado por un puntero base sin destructor virtual es UB (el string de Loot puede fugarse).",
          "仮想デストラクタのない基底ポインタで派生オブジェクトを delete するのは未定義動作（string がリークし得る）。",
        ),
        check: { compiles: true },
      },
      // exceptions
      {
        topic: "exceptions", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          ...TORCH,
          "struct Boss {",
          '  Torch t{"t"};',
          "  Boss() { throw 1; }",
          '  ~Boss() { std::cout << "~Boss"; }',
          "};",
          'int main() { try { Boss b; } catch (int) { std::cout << "!"; } }',
        ),
        options: ["+t-t~Boss!", "+t-t!", "+t!"], answer: 1,
        explain: L(
          "If a constructor throws, the object never existed: ~Boss doesn't run, but already-built members are destroyed.",
          "Si un constructor lanza, el objeto nunca existió: ~Boss no se ejecuta, pero los miembros ya construidos se destruyen.",
          "コンストラクタが例外を投げるとオブジェクトは存在しない扱い。~Boss は呼ばれないが、作成済みのメンバーは破棄される。",
        ),
        check: { compiles: true, stdout: "+t-t!" },
      },
    ],
  },

  // ─── SENIOR ───────────────────────────────────────────────────────────────
  {
    slug: "senior",
    level: "senior",
    title: L("Senior C++ Developer", "Desarrollador C++ Senior", "シニア C++ 開発者"),
    description: L(
      "Simulates a senior screening: templates, concurrency, the memory model, performance and UB.",
      "Simula una entrevista senior: templates, concurrencia, modelo de memoria, rendimiento y UB.",
      "シニア選考を再現：テンプレート、並行処理、メモリモデル、性能、未定義動作。",
    ),
    count: 15,
    passPct: 75,
    secondsPerQuestion: 50,
    codeCount: 2,
    questions: [
      // coding tasks (docs/research/coding-tasks-and-written-tests.md)
      lruCacheTask, joinAllTask, sumCsvTask, parallelSumTask,
      // move
      {
        topic: "move", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "struct Item {",
          "  Item(int) {}",
          '  Item(const Item&) { std::cout << "copy "; }',
          '  Item(Item&&) { std::cout << "move "; }',
          "};",
          "int main() {",
          "  std::vector<Item> v;",
          "  v.reserve(1);",
          "  v.emplace_back(1);",
          "  v.emplace_back(2);",
          "}",
        ),
        options: ["move", "copy", L("Nothing", "Nada", "何も出ない")], answer: 1,
        explain: L(
          "On growth, vector moves elements only if the move constructor is noexcept (strong guarantee). Otherwise it copies.",
          "Al crecer, vector mueve elementos solo si el constructor de move es noexcept (garantía fuerte). Si no, copia.",
          "vector は拡張時、ムーブが noexcept の場合だけムーブする（強い保証のため）。そうでなければコピーする。",
        ),
        check: { compiles: true, stdout: "copy" },
      },
      {
        topic: "move", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "std::vector<int> a{1, 2, 3};",
          "std::vector<int> b = std::move(a);",
          "std::cout << a.size() << b.size();",
        ),
        options: ["33", "03", L("Unspecified", "No especificado", "未規定")], answer: 1,
        explain: L(
          "Most moved-from objects are only \"valid but unspecified\", but vector's move constructor guarantees the source is empty.",
          "La mayoría de objetos movidos quedan \"válidos pero no especificados\", pero el move de vector garantiza que el origen queda vacío.",
          "ムーブ元は普通「有効だが未規定」だが、vector のムーブコンストラクタは元が空になることを保証する。",
        ),
        check: { compiles: true, stdout: "03" },
      },
      {
        topic: "move", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code('std::string s = "hi";', "std::string&& r = std::move(s);", "std::cout << s << r;"),
        options: ["hihi", "hi", L("Unspecified", "No especificado", "未規定")], answer: 0,
        explain: L(
          "std::move is just a cast to an rvalue reference. Binding it to r moves nothing; only a move constructor or assignment would.",
          "std::move es solo una conversión a referencia rvalue. Ligarla a r no mueve nada; solo un constructor o asignación de move lo haría.",
          "std::move は右辺値参照へのキャストにすぎない。r に束縛しても何も動かない。動かすのはムーブ構築や代入だけ。",
        ),
        check: { compiles: true, stdout: "hihi" },
      },
      // polymorphism
      {
        topic: "polymorphism", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "struct A {",
          '  virtual void f(int x = 1) { std::cout << "A" << x; }',
          "  virtual ~A() = default;",
          "};",
          'struct B : A { void f(int x = 2) override { std::cout << "B" << x; } };',
          "int main() {",
          "  B b;",
          "  A& a = b;",
          "  a.f();",
          "  b.f();",
          "}",
        ),
        options: ["B2B2", "B1B2", "A1B2"], answer: 1,
        explain: L(
          "The body is picked at runtime (B::f), but default arguments come from the static type: A& gives x = 1.",
          "El cuerpo se elige en tiempo de ejecución (B::f), pero los argumentos por defecto vienen del tipo estático: A& da x = 1.",
          "本体は実行時に B::f が選ばれるが、デフォルト引数は静的な型で決まる。A& 経由なら x = 1。",
        ),
        check: { compiles: true, stdout: "B1B2" },
      },
      {
        topic: "polymorphism", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          'struct B { ~B() { std::cout << "~B"; } };',
          'struct D : B { ~D() { std::cout << "~D"; } };',
          "int main() {",
          "  { std::shared_ptr<B> p = std::make_shared<D>(); }",
          '  std::cout << "|";',
          "}",
        ),
        options: ["~B|", "~D~B|", "|~D~B"], answer: 1,
        explain: L(
          "shared_ptr stores a deleter for the real type (D) when created, so ~D runs even without a virtual destructor.",
          "shared_ptr guarda al crearse un deleter del tipo real (D), así que ~D se ejecuta aun sin destructor virtual.",
          "shared_ptr は作成時に実際の型 D のデリータを保存するので、仮想デストラクタがなくても ~D が呼ばれる。",
        ),
        check: { compiles: true, stdout: "~D~B|" },
      },
      // templates
      {
        topic: "templates", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          'template <typename T> void show(T) { std::cout << "T "; }',
          'void show(int) { std::cout << "int "; }',
          "int main() {",
          "  show(1);",
          "  show(1L);",
          "  show<int>(1);",
          "}",
        ),
        options: ["int int int", "int T T", "int T int"], answer: 1,
        explain: L(
          "An exact non-template match wins ties. 1L is long: the template is exact. show<int> asks for the template explicitly.",
          "Una coincidencia exacta no template gana empates. 1L es long: el template es exacto. show<int> pide el template explícitamente.",
          "完全一致ならテンプレートでない関数が優先。1L は long でテンプレートが完全一致。show<int> はテンプレートを明示。",
        ),
        check: { compiles: true, stdout: "int T T" },
      },
      {
        topic: "templates", difficulty: 2, kind: "pick", prompt: L("Discard the branch per type", "Descarta la rama según el tipo", "型ごとに分岐を捨てる"),
        code: code(
          "template <typename T>",
          "std::string describe(T v) {",
          "  if ___ (std::is_integral_v<T>) return \"int:\" + std::to_string(v);",
          '  else return "other";',
          "}",
          "int main() {",
          '  std::cout << describe(4) << " " << describe("x");',
          "}",
        ),
        options: ["constexpr", "consteval", "inline"], answer: 0,
        explain: L(
          "if constexpr drops the false branch at compile time, so to_string(const char*) is never instantiated.",
          "if constexpr descarta la rama falsa en compilación, así que to_string(const char*) nunca se instancia.",
          "if constexpr は偽の分岐をコンパイル時に捨てるので、to_string(const char*) はインスタンス化されない。",
        ),
        check: { compiles: true, stdout: "int:4 other", wrongFail: true },
      },
      {
        topic: "templates", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code(
          "#include <concepts>",
          "#include <iostream>",
          "template <std::integral T>",
          "T twice(T x) { return x * 2; }",
          "int main() {",
          "  std::cout << twice(2.5);",
          "}",
        ),
        options: [L("Yes, prints 5", "Sí, imprime 5", "はい、5 と表示"), L("No: double isn't integral", "No: double no es integral", "いいえ：double は整数型でない")], answer: 1,
        explain: L(
          "std::integral constrains T, so the call is rejected at the call site with a readable error, instead of deep inside.",
          "std::integral restringe T, así que la llamada se rechaza en el punto de uso con un error legible, no en las entrañas.",
          "std::integral が T を制約するので、呼び出し箇所で分かりやすいエラーになる。内部の奥深くではなく。",
        ),
        check: { compiles: false },
      },
      // modern
      {
        topic: "modern", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code("int x = 1;", "decltype(x) y = 2;", "decltype((x)) z = x;", "z = 9;", "std::cout << x << y;"),
        options: ["12", "92", "99"], answer: 1,
        explain: L(
          "decltype(x) is the declared type, int. decltype((x)) treats (x) as an lvalue expression: int&, so z aliases x.",
          "decltype(x) es el tipo declarado, int. decltype((x)) trata (x) como expresión lvalue: int&, así que z es alias de x.",
          "decltype(x) は宣言された型 int。decltype((x)) は (x) を左辺値式として扱い int& になり、z は x の別名。",
        ),
        check: { compiles: true, stdout: "92" },
      },
      {
        topic: "modern", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          'std::map<std::string, int> m{{"a", 1}, {"b", 2}};',
          "for (auto [key, hp] : m) hp *= 10;",
          'std::cout << m["a"] + m["b"];',
        ),
        options: ["30", "3", L("Compile error", "Error de compilación", "コンパイルエラー")], answer: 1,
        explain: L(
          "auto [key, hp] binds to a copy of each pair, so the map is unchanged. Use auto& [key, hp] to modify it.",
          "auto [key, hp] se liga a una copia de cada par, así que el map no cambia. Usa auto& [key, hp] para modificarlo.",
          "auto [key, hp] は各ペアのコピーに束縛されるので map は変わらない。変更するなら auto& [key, hp]。",
        ),
        check: { compiles: true, stdout: "3" },
      },
      {
        topic: "modern", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("std::variant<int, std::string> v = 5;", "std::cout << std::get<std::string>(v);"),
        options: [L("Prints 5", "Imprime 5", "5 と表示"), L("Prints an empty line", "Imprime una línea vacía", "空行を表示"), L("Throws bad_variant_access", "Lanza bad_variant_access", "bad_variant_access を投げる")], answer: 2,
        explain: L(
          "std::get checks the active alternative and throws std::bad_variant_access. Use std::get_if or std::visit to branch safely.",
          "std::get comprueba la alternativa activa y lanza std::bad_variant_access. Usa std::get_if o std::visit para ramificar.",
          "std::get は保持中の型を確かめ、違えば std::bad_variant_access を投げる。安全に分岐するなら get_if か visit。",
        ),
        check: { compiles: true, throws: "bad_variant_access" },
      },
      // lambdas_stl
      {
        topic: "lambdas_stl", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("std::vector<double> v{0.5, 0.5, 0.5};", "std::cout << std::accumulate(v.begin(), v.end(), 0);"),
        options: ["1.5", "0", "1"], answer: 1,
        explain: L(
          "accumulate's result type is the type of the initial value: 0 is int, so every partial sum is truncated to 0. Pass 0.0.",
          "El tipo del resultado de accumulate es el del valor inicial: 0 es int, así que cada suma parcial se trunca a 0. Pasa 0.0.",
          "accumulate の結果型は初期値の型。0 は int なので途中の和が毎回 0 に切り捨てられる。0.0 を渡そう。",
        ),
        check: { compiles: true, stdout: "0" },
      },
      {
        topic: "lambdas_stl", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "auto inc = [n = 0]() mutable { return ++n; };",
          "inc();",
          "auto copy = inc;",
          "inc();",
          "std::cout << inc() << copy();",
        ),
        options: ["33", "32", "31"], answer: 1,
        explain: L(
          "A lambda is an object and its captures are members: copy took n = 1 and then counts on its own.",
          "Una lambda es un objeto y sus capturas son miembros: copy tomó n = 1 y luego cuenta por su cuenta.",
          "ラムダはオブジェクトで、キャプチャはメンバー。copy は n = 1 の時点で複製され、以後は独立して数える。",
        ),
        check: { compiles: true, stdout: "32" },
      },
      // concurrency
      {
        topic: "concurrency", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code(
          "#include <iostream>",
          "#include <thread>",
          "void addLoot(int& total) { total += 10; }",
          "int main() {",
          "  int loot = 0;",
          "  std::thread t(addLoot, loot);",
          "  t.join();",
          "  std::cout << loot;",
          "}",
        ),
        options: [L("Yes, prints 10", "Sí, imprime 10", "はい、10 と表示"), L("Yes, prints 0", "Sí, imprime 0", "はい、0 と表示"), L("No", "No", "いいえ")], answer: 2,
        explain: L(
          "std::thread copies its arguments, and a copy can't bind to int&. Pass std::ref(loot) to share the variable.",
          "std::thread copia sus argumentos, y una copia no se liga a int&. Pasa std::ref(loot) para compartir la variable.",
          "std::thread は引数をコピーし、コピーは int& に束縛できない。変数を共有するなら std::ref(loot)。",
        ),
        check: { compiles: false },
      },
      {
        topic: "concurrency", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code(
          "#include <iostream>",
          "#include <thread>",
          "int main() {",
          "  int hits = 0;",
          "  auto work = [&] { for (int i = 0; i < 100000; ++i) ++hits; };",
          "  std::thread a(work), b(work);",
          "  a.join(); b.join();",
          "  std::cout << hits;",
          "}",
        ),
        options: [L("Always 200000", "Siempre 200000", "必ず 200000"), L("Data race: UB", "Data race: UB", "データ競合で未定義動作"), L("Compile error", "Error de compilación", "コンパイルエラー")], answer: 1,
        explain: L(
          "Two threads write hits without synchronization: a data race, which is UB. Use std::atomic<int> or a mutex.",
          "Dos hilos escriben hits sin sincronización: una data race, que es UB. Usa std::atomic<int> o un mutex.",
          "2つのスレッドが同期なしで hits に書き込むのはデータ競合で未定義動作。std::atomic<int> か mutex を使おう。",
        ),
        check: { compiles: true },
      },
      {
        topic: "concurrency", difficulty: 2, kind: "pick", prompt: L("Lock the mutex for this scope", "Bloquea el mutex en este ámbito", "このスコープで mutex をロック"),
        code: code(
          "#include <iostream>",
          "#include <mutex>",
          "#include <thread>",
          "#include <memory>",
          "int main() {",
          "  std::mutex m; int total = 0;",
          "  auto work = [&] { for (int i = 0; i < 1000; ++i) {",
          "    std::___<std::mutex> lock(m); ++total; } };",
          "  std::thread a(work), b(work);",
          "  a.join(); b.join();",
          "  std::cout << total;",
          "}",
        ),
        options: ["lock_guard", "unique_ptr", "shared_ptr"], answer: 0,
        explain: L(
          "lock_guard locks in its constructor and unlocks in its destructor (RAII), even if an exception is thrown.",
          "lock_guard bloquea en su constructor y desbloquea en su destructor (RAII), incluso si se lanza una excepción.",
          "lock_guard はコンストラクタでロックし、デストラクタで解放する（RAII）。例外が出ても確実に解放される。",
        ),
        check: { compiles: true, stdout: "2000", wrongFail: true },
      },
      // memory_model
      {
        topic: "memory_model", difficulty: 3, kind: "predict", prompt: L("Is the read of data race-free?", "¿La lectura de data está libre de race?", "data の読み取りは競合しない？"),
        code: code(
          "#include <atomic>",
          "#include <iostream>",
          "#include <thread>",
          "int main() {",
          "  int data = 0;",
          "  std::atomic<bool> ready{false};",
          "  std::thread t([&] { data = 42; ready.store(true, std::memory_order_release); });",
          "  while (!ready.load(std::memory_order_acquire)) {}",
          "  std::cout << data;",
          "  t.join();",
          "}",
        ),
        options: [L("Yes: release/acquire orders it", "Sí: release/acquire lo ordena", "はい：release/acquire で順序付く"), L("No: data needs a mutex", "No: data necesita un mutex", "いいえ：data に mutex が必要"), L("Only with relaxed", "Solo con relaxed", "relaxed のときだけ")], answer: 0,
        explain: L(
          "An acquire load that sees a release store creates happens-before: everything written before the store is visible.",
          "Un load acquire que ve un store release crea happens-before: todo lo escrito antes del store es visible.",
          "release ストアを acquire ロードが観測すると happens-before が成立し、ストア前の書き込みがすべて見える。",
        ),
        check: { compiles: true, stdout: "42" },
      },
      {
        topic: "memory_model", difficulty: 2, kind: "predict", prompt: L("Threads bump a and b. Main cost?", "Hilos incrementan a y b. ¿Coste?", "a と b を別スレッドで加算。問題は？"),
        code: code(
          "struct Counters {",
          "  std::atomic<long> a{0}; // thread 1 only",
          "  std::atomic<long> b{0}; // thread 2 only",
          "};",
          "// a and b share one 64-byte cache line",
        ),
        options: [L("False sharing: pad with alignas(64)", "False sharing: separa con alignas(64)", "偽共有：alignas(64) で分ける"), L("A data race", "Una data race", "データ競合"), L("No cost: different atomics", "Ninguno: atómicos distintos", "問題なし：別のアトミック")], answer: 0,
        explain: L(
          "No race, but each write steals the shared cache line from the other core. Put the counters on separate lines.",
          "No hay race, pero cada escritura le roba la línea de caché compartida al otro núcleo. Separa los contadores.",
          "競合はないが、書き込むたびに共有キャッシュラインを奪い合う。カウンタを別のラインに置こう。",
        ),
      },
      // performance
      {
        topic: "performance", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          ...ITEM,
          "Item make() {",
          "  Item local;",
          "  return std::move(local);",
          "}",
          "int main() { Item a = make(); }",
        ),
        options: [L("Nothing", "Nada", "何も出ない"), "move", "copy"], answer: 1,
        explain: L(
          "return std::move(local) returns a reference, which blocks copy elision and forces a move. Write return local;.",
          "return std::move(local) devuelve una referencia, lo que impide la elisión de copia y fuerza un move. Escribe return local;.",
          "return std::move(local) は参照を返すのでコピー省略が効かずムーブが起きる。return local; と書こう。",
        ),
        check: { compiles: true, stdout: "move" },
      },
      {
        topic: "performance", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "struct Item {",
          "  Item(int) {}",
          '  Item(const Item&) { std::cout << "copy "; }',
          '  Item(Item&&) noexcept { std::cout << "move "; }',
          "};",
          "int main() {",
          "  std::vector<Item> v;",
          "  v.reserve(2);",
          "  v.emplace_back(1);",
          "  v.push_back(Item(2));",
          "}",
        ),
        options: ["move move", "move", "copy move"], answer: 1,
        explain: L(
          "emplace_back builds the Item in place from 1. push_back(Item(2)) builds a temporary and moves it in.",
          "emplace_back construye el Item en su lugar con 1. push_back(Item(2)) crea un temporal y lo mueve dentro.",
          "emplace_back は 1 からその場で Item を作る。push_back(Item(2)) は一時オブジェクトを作ってムーブする。",
        ),
        check: { compiles: true, stdout: "move" },
      },
      {
        topic: "performance", difficulty: 2, kind: "predict", prompt: L("A virtual call vs a CRTP call costs…", "Una llamada virtual vs CRTP cuesta…", "仮想呼び出しと CRTP の違いは？"),
        code: code(
          "struct Shape { virtual double area() const = 0; };",
          "template <typename D>",
          "struct ShapeT {",
          "  double area() const {",
          "    return static_cast<const D*>(this)->areaImpl();",
          "  }",
          "};",
          "int main() {}",
        ),
        options: [
          L("Virtual: indirect, rarely inlined", "Virtual: indirecta, rara vez inline", "仮想：間接呼び出しで inline されにくい"),
          L("The same: both are inlined", "Igual: ambas se hacen inline", "同じ：どちらも inline される"),
          L("CRTP is slower: templates", "CRTP es más lenta: templates", "CRTP の方が遅い"),
        ], answer: 0,
        explain: L(
          "A virtual call goes through the vtable and usually can't be inlined. CRTP resolves the call at compile time.",
          "Una llamada virtual pasa por la vtable y normalmente no se hace inline. CRTP resuelve la llamada en compilación.",
          "仮想呼び出しは vtable 経由で通常 inline 化できない。CRTP はコンパイル時に呼び先が決まる。",
        ),
        check: { compiles: true },
      },
      // ub
      {
        topic: "ub", difficulty: 3, kind: "predict", prompt: L("What is p.b?", "¿Cuánto vale p.b?", "p.b の値は？"),
        code: code(
          "struct P {",
          "  int b;",
          "  int a;",
          "  P() : a(1), b(a + 1) {}",
          "};",
          "int main() {",
          "  P p;",
          "  std::cout << p.b;",
          "}",
        ),
        options: ["2", "1", L("UB: reads a before init", "UB: lee a sin inicializar", "未定義動作：未初期化の a を読む")], answer: 2,
        explain: L(
          "b is declared first, so it is initialized first, from a, which is not initialized yet: an indeterminate read, UB.",
          "b se declara primero, así que se inicializa primero, con a, que aún no está inicializada: lectura indeterminada, UB.",
          "b が先に宣言されているので先に初期化され、未初期化の a を読む。不定値の読み取りで未定義動作。",
        ),
        check: { compiles: true },
      },
      {
        topic: "ub", difficulty: 2, kind: "predict", prompt: L("Is sv safe to print?", "¿Es seguro imprimir sv?", "sv を表示しても安全？"),
        code: code('std::string_view sv = std::string("temp") + "!";', "std::cout << sv;"),
        options: [L("Yes, prints temp!", "Sí, imprime temp!", "はい、temp! と表示"), L("No: the string is gone, UB", "No: el string ya murió, UB", "いいえ：文字列は消えていて未定義動作")], answer: 1,
        explain: L(
          "A string_view doesn't own its chars. The temporary string dies at the end of the line, so sv dangles.",
          "Un string_view no es dueño de sus caracteres. El string temporal muere al final de la línea, así que sv cuelga.",
          "string_view は文字を所有しない。一時的な string は行末で消えるので、sv はダングリングになる。",
        ),
        check: { compiles: true },
      },
      {
        topic: "ub", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code(
          "#include <climits>",
          "#include <iostream>",
          "int main() {",
          "  int big = INT_MAX;",
          "  std::cout << big + 1;",
          "}",
        ),
        options: [L("Wraps to INT_MIN", "Da la vuelta a INT_MIN", "INT_MIN に回り込む"), UB, L("Throws overflow_error", "Lanza overflow_error", "overflow_error を投げる")], answer: 1,
        explain: L(
          "Signed overflow is UB, and optimizers rely on it never happening. Unsigned arithmetic is defined: it wraps.",
          "El desbordamiento con signo es UB y los optimizadores asumen que no ocurre. La aritmética unsigned sí está definida: da la vuelta.",
          "符号付き整数のオーバーフローは未定義動作で、最適化はそれが起きない前提で動く。unsigned は回り込みが定義済み。",
        ),
        check: { compiles: true },
      },
      // exceptions
      {
        topic: "exceptions", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "void a() noexcept {}",
          "void b() {}",
          "int main() {",
          "  std::cout << noexcept(a()) << noexcept(b());",
          "}",
        ),
        options: ["11", "10", "00"], answer: 1,
        explain: L(
          "The noexcept operator asks the compiler, at compile time, whether an expression is declared not to throw.",
          "El operador noexcept pregunta al compilador, en compilación, si una expresión está declarada como que no lanza.",
          "noexcept 演算子は、式が例外を投げないと宣言されているかをコンパイル時に調べる。",
        ),
        check: { compiles: true, stdout: "10" },
      },
      {
        topic: "exceptions", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code(
          "void f() noexcept { throw 1; }",
          "int main() {",
          "  try { f(); }",
          '  catch (int) { std::cout << "caught"; }',
          "}",
        ),
        options: [L("Prints caught", "Imprime caught", "caught と表示"), L("std::terminate is called", "Se llama a std::terminate", "std::terminate が呼ばれる"), L("Compile error", "Error de compilación", "コンパイルエラー")], answer: 1,
        explain: L(
          "An exception escaping a noexcept function calls std::terminate; the catch never runs. GCC warns with -Wterminate.",
          "Una excepción que escapa de una función noexcept llama a std::terminate; el catch nunca corre. GCC avisa con -Wterminate.",
          "noexcept 関数から例外が漏れると std::terminate が呼ばれ、catch は実行されない。GCC は -Wterminate で警告。",
        ),
        check: { compiles: true, throws: "terminate" },
      },
    ],
  },
];
