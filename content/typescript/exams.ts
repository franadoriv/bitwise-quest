import type { ExamDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Entry exams that simulate company screenings for JavaScript/TypeScript roles.
// Topics, levels and bank sizes follow docs/research/typescript-react-curriculum.md ("Entry exams")
// and docs/research/typescript-hiring-assessments.md. Every runtime or type-checker claim carries a
// `check` (tsc --strict, then the game runner): `npm run content:verify -- --lang=typescript --only=exam:`.

const code = (...lines: string[]) => lines.join("\n");

const YN = [L("Yes", "Sí", "はい"), L("No", "No", "いいえ")];
const PRINTS = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const ORDER = L("In what order does it print?", "¿En qué orden imprime?", "どの順番で表示される？");
const COMPILES = L("Does it compile (tsc --strict)?", "¿Compila (tsc --strict)?", "コンパイルは通る？(strict)");
const WAIT_DEF = "const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));";

export const exams: ExamDef[] = [
  // ─── JUNIOR ───────────────────────────────────────────────────────────────
  {
    slug: "junior",
    level: "junior",
    title: L("Junior TypeScript Developer", "TypeScript Developer Junior", "ジュニア TypeScript 開発者"),
    description: L(
      "Online skills test for a junior JS/TS role: values, equality, scope, closures, objects, arrays, basic types, async.",
      "Test en línea para un puesto junior JS/TS: valores, igualdad, scope, closures, objetos, arrays, tipos y async.",
      "ジュニア JS/TS 職のオンライン試験：値、等価性、スコープ、クロージャ、配列、型、非同期。",
    ),
    count: 12,
    passPct: 70,
    secondsPerQuestion: 30,
    questions: [
      // values
      {
        topic: "values", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: "console.log(0.1 + 0.2 === 0.3);",
        options: ["true", "false"], answer: 1,
        explain: L(
          "Numbers are binary floats: 0.1 + 0.2 is 0.30000000000000004. Compare with a tolerance like Number.EPSILON.",
          "Los números son flotantes binarios: 0.1 + 0.2 da 0.30000000000000004. Compara con una tolerancia como Number.EPSILON.",
          "数値は2進の浮動小数点。0.1 + 0.2 は 0.30000000000000004 になる。Number.EPSILON などの誤差で比べよう。",
        ),
        check: { compiles: true, stdout: "false" },
      },
      {
        topic: "values", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'console.log(typeof NaN, Number("abc"));',
        options: ["number NaN", "NaN NaN", "undefined 0"], answer: 0,
        explain: L(
          "NaN (\"not a number\") is still of type number. A failed numeric conversion gives NaN, not an error.",
          "NaN (\"no es un número\") sigue siendo de tipo number. Una conversión numérica fallida da NaN, no un error.",
          "NaN（非数）も型は number。数値への変換に失敗するとエラーではなく NaN になるよ。",
        ),
        check: { compiles: true, stdout: "number NaN" },
      },
      {
        topic: "values", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: 'console.log("5" + 3);',
        options: ["8", "53", "NaN"], answer: 1,
        explain: L(
          "With a string on either side, + concatenates: 3 becomes \"3\". Convert first with Number(\"5\") to add.",
          "Con un string en algún lado, + concatena: 3 se vuelve \"3\". Convierte antes con Number(\"5\") para sumar.",
          "片方が文字列なら + は連結になり、3 は \"3\" になる。足したいなら先に Number(\"5\") で変換しよう。",
        ),
        check: { compiles: true, stdout: "53" },
      },
      // equality
      {
        topic: "equality", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code('const input: unknown = "1";', "console.log(input == 1, input === 1);"),
        options: ["true true", "true false", "false false"], answer: 1,
        explain: L(
          "== converts types before comparing (\"1\" becomes 1); === also compares the type, so string vs number is false.",
          "== convierte tipos antes de comparar (\"1\" pasa a 1); === también compara el tipo, así que string vs number es false.",
          "== は比較前に型を変換する（\"1\" が 1 に）。=== は型も比べるので string と number は false。",
        ),
        check: { compiles: true, stdout: "true false" },
      },
      {
        topic: "equality", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("const lives: number = 0;", "console.log(lives || 3, lives ?? 3);"),
        options: ["3 3", "0 0", "3 0"], answer: 2,
        explain: L(
          "|| falls back on ANY falsy value, including 0. ?? only falls back on null or undefined, so it keeps 0.",
          "|| usa el respaldo con CUALQUIER valor falsy, incluido 0. ?? solo con null o undefined, así que conserva el 0.",
          "|| は 0 を含むあらゆる falsy 値で右側を使う。?? は null と undefined のときだけなので 0 を保つよ。",
        ),
        check: { compiles: true, stdout: "3 0" },
      },
      {
        topic: "equality", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'console.log(Boolean(""), Boolean("0"), Boolean([]));',
        options: ["false false false", "false true true", "true true false"], answer: 1,
        explain: L(
          "Only the empty string is falsy among strings; \"0\" is a non-empty string. Every object, even [], is truthy.",
          "Entre los strings solo el vacío es falsy; \"0\" no está vacío. Todo objeto, incluso [], es truthy.",
          "文字列で falsy なのは空文字だけ。\"0\" は空ではない。オブジェクトは [] でも truthy だよ。",
        ),
        check: { compiles: true, stdout: "false true true" },
      },
      // scope
      {
        topic: "scope", difficulty: 1, kind: "pick", prompt: L("This value changes later", "Este valor cambia después", "この値はあとで変わる"),
        code: code("___ count = 0;", "count = count + 1;", "console.log(count);"),
        options: ["let", "const"], answer: 0,
        explain: L(
          "const forbids reassignment; use let for a binding you will change. Prefer const for everything else.",
          "const prohíbe reasignar; usa let para una variable que vas a cambiar. Prefiere const para todo lo demás.",
          "const は再代入できない。変える変数には let を使い、それ以外は const にしよう。",
        ),
        check: { compiles: true, stdout: "1", wrongFail: true },
      },
      {
        topic: "scope", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("console.log(add(2, 3));", "function add(a: number, b: number) {", "  return a + b;", "}"),
        options: ["5", "undefined", "ReferenceError"], answer: 0,
        explain: L(
          "Function declarations are hoisted WHOLE, so you can call them above their line. A var would only be undefined there.",
          "Las declaraciones de función se elevan COMPLETAS, así que puedes llamarlas antes de su línea. Un var solo valdría undefined.",
          "関数宣言は丸ごと巻き上げられるので、宣言より上で呼べる。var なら undefined になるだけだよ。",
        ),
        check: { compiles: true, stdout: "5" },
      },
      {
        topic: "scope", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("console.log(y);", "let y = 5;"),
        options: YN, answer: 1,
        explain: L(
          "let is in the temporal dead zone until its line runs. tsc flags it; plain JS throws a ReferenceError.",
          "let está en la zona muerta temporal (TDZ) hasta que corre su línea. tsc lo marca; en JS lanza ReferenceError.",
          "let は宣言の行まで TDZ（一時的デッドゾーン）にある。tsc はエラーにし、JS では ReferenceError だよ。",
        ),
        check: { compiles: false },
      },
      // closures
      {
        topic: "closures", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("function makeCounter() {", "  let n = 0;", "  return () => ++n;", "}", "const next = makeCounter();", "next();", "next();", "console.log(next());"),
        options: ["1", "3", "0"], answer: 1,
        explain: L(
          "The arrow keeps n alive in its closure, so each call increments the same n: 1, 2, 3.",
          "La flecha mantiene viva a n en su closure, así que cada llamada incrementa la misma n: 1, 2, 3.",
          "アロー関数はクロージャで n を保持する。毎回同じ n が増えて 1、2、3 になるよ。",
        ),
        check: { compiles: true, stdout: "3" },
      },
      {
        topic: "closures", difficulty: 2, kind: "predict", prompt: ORDER,
        code: code("for (var i = 0; i < 3; i++) {", "  setTimeout(() => console.log(i), 0);", "}"),
        options: ["0 1 2", "3 3 3", "2 2 2"], answer: 1,
        explain: L(
          "var gives ONE shared i. The callbacks run after the loop, when i is 3. With let, each turn gets its own i.",
          "var da UNA sola i compartida. Los callbacks corren tras el bucle, cuando i vale 3. Con let cada vuelta tiene su i.",
          "var だと i は1つだけ共有。コールバックはループ後に動くので i は 3。let なら毎回別の i になるよ。",
        ),
        check: { compiles: true, stdout: "3\n3\n3" },
      },
      // objects
      {
        topic: "objects", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("const a = { hp: 5 };", "const b = a;", "b.hp = 9;", "console.log(a.hp);"),
        options: ["5", "9", "undefined"], answer: 1,
        explain: L(
          "b = a copies the reference, not the object. Both names point to the same object.",
          "b = a copia la referencia, no el objeto. Ambos nombres apuntan al mismo objeto.",
          "b = a はオブジェクトではなく参照をコピーする。2つの名前が同じオブジェクトを指すよ。",
        ),
        check: { compiles: true, stdout: "9" },
      },
      {
        topic: "objects", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code('const a = { hp: 5, bag: ["gem"] };', "const b = { ...a };", "b.hp = 1;", 'b.bag.push("key");', "console.log(a.hp, a.bag.length);"),
        options: ["5 1", "1 2", "5 2"], answer: 2,
        explain: L(
          "Spread makes a SHALLOW copy: hp is copied, but bag is the same array in both. Use structuredClone for deep.",
          "El spread hace una copia SUPERFICIAL: hp se copia, pero bag es el mismo array en ambos. Para copia profunda, structuredClone.",
          "スプレッドは浅いコピー。hp は複製されるが bag は同じ配列のまま。深いコピーは structuredClone だよ。",
        ),
        check: { compiles: true, stdout: "5 2" },
      },
      {
        topic: "objects", difficulty: 2, kind: "type", prompt: L("Read name only if pet exists", "Lee name solo si pet existe", "pet があるときだけ name を読む"),
        code: code("const hero: { pet?: { name: string } } = {};", "console.log(hero.pet___name);"),
        answer: "?.",
        explain: L(
          "Optional chaining ?. stops and returns undefined when pet is missing, instead of throwing a TypeError.",
          "El encadenamiento opcional ?. se detiene y da undefined si falta pet, en vez de lanzar un TypeError.",
          "オプショナルチェーン ?. は pet がないと TypeError を出さず undefined を返すよ。",
        ),
        check: { compiles: true, stdout: "undefined" },
      },
      // arrays
      {
        topic: "arrays", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: 'console.log([1, 2, 3].map((n) => n * 2).join(","));',
        options: ["1,2,3", "2,4,6", "6"], answer: 1,
        explain: L(
          "map builds a NEW array by applying the function to each item; join glues the items with commas.",
          "map crea un array NUEVO aplicando la función a cada elemento; join los une con comas.",
          "map は各要素に関数を適用して新しい配列を作る。join はカンマでつなぐよ。",
        ),
        check: { compiles: true, stdout: "2,4,6" },
      },
      {
        topic: "arrays", difficulty: 1, kind: "pick", prompt: L("Keep only the numbers above 10", "Quédate solo con los mayores de 10", "10 より大きい数だけ残そう"),
        code: code("const big = [5, 12, 8, 20].___((n) => n > 10);", "console.log(big);"),
        options: ["filter", "map", "find"], answer: 0,
        explain: L(
          "filter keeps the items where the test is true. map would give booleans; find returns only the first match.",
          "filter conserva los elementos donde la prueba es true. map daría booleanos; find devuelve solo la primera coincidencia.",
          "filter は条件が true の要素を残す。map は真偽値の配列、find は最初の1つだけを返すよ。",
        ),
        check: { compiles: true, stdout: "[ 12, 20 ]" },
      },
      {
        topic: "arrays", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'console.log([10, 9, 1].sort().join(","));',
        options: ["1,9,10", "1,10,9", "10,9,1"], answer: 1,
        explain: L(
          "Without a compare function, sort compares as strings: \"10\" < \"9\". Use sort((a, b) => a - b) for numbers.",
          "Sin función de comparación, sort compara como strings: \"10\" < \"9\". Para números usa sort((a, b) => a - b).",
          "比較関数なしの sort は文字列として比べる（\"10\" < \"9\"）。数値なら sort((a, b) => a - b) だよ。",
        ),
        check: { compiles: true, stdout: "1,10,9" },
      },
      // ts_basics
      {
        topic: "ts_basics", difficulty: 1, kind: "predict", prompt: COMPILES,
        code: code("let level: number = 3;", 'level = "three";'),
        options: YN, answer: 1,
        explain: L(
          "level is annotated as number, so assigning a string is a type error (TS2322) caught before the code runs.",
          "level está anotado como number, así que asignarle un string es un error de tipos (TS2322) antes de ejecutar.",
          "level は number と注釈されているので、文字列の代入は実行前に型エラー（TS2322）になるよ。",
        ),
        check: { compiles: false },
      },
      {
        topic: "ts_basics", difficulty: 1, kind: "pick", prompt: L("Type the parameter", "Tipa el parámetro", "引数に型をつけよう"),
        code: code("function greet(name: ___) {", '  return "Hi " + name.toUpperCase();', "}", 'console.log(greet("ada"));'),
        options: ["string", "number", "boolean"], answer: 0,
        explain: L(
          "toUpperCase exists only on strings. With number or boolean, tsc reports the missing method.",
          "toUpperCase solo existe en strings. Con number o boolean, tsc avisa que el método no existe.",
          "toUpperCase は文字列だけのメソッド。number や boolean だと tsc がエラーにするよ。",
        ),
        check: { compiles: true, stdout: "Hi ADA", wrongFail: true },
      },
      {
        topic: "ts_basics", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("interface Hero {", "  name: string;", "  level: number;", "}", 'const h: Hero = { name: "Ada" };'),
        options: YN, answer: 1,
        explain: L(
          "level is required by Hero and missing. Mark it optional with level?: number if it may be absent.",
          "Hero exige level y falta. Márcalo opcional con level?: number si puede no estar.",
          "Hero には level が必須なのに足りない。省略可能なら level?: number にしよう。",
        ),
        check: { compiles: false },
      },
      // async
      {
        topic: "async", difficulty: 1, kind: "predict", prompt: ORDER,
        code: code('console.log("A");', 'setTimeout(() => console.log("B"), 0);', 'console.log("C");'),
        options: ["A B C", "A C B", "B A C"], answer: 1,
        explain: L(
          "setTimeout schedules B for later, even with 0 ms. The synchronous A and C run first.",
          "setTimeout programa B para después, aunque sea con 0 ms. A y C, síncronos, corren primero.",
          "setTimeout は 0 ms でも B をあとに回す。同期の A と C が先に動くよ。",
        ),
        check: { compiles: true, stdout: "A\nC\nB" },
      },
      {
        topic: "async", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("async function getHp() {", "  return 7;", "}", "getHp().then((hp) => console.log(hp + 1));"),
        options: ["8", "71", "[object Promise]1"], answer: 0,
        explain: L(
          "An async function returns a Promise; then receives the unwrapped value 7, so hp + 1 is 8.",
          "Una función async devuelve una Promise; then recibe el valor ya abierto, 7, así que hp + 1 es 8.",
          "async 関数は Promise を返す。then には中身の 7 が渡るので hp + 1 は 8 だよ。",
        ),
        check: { compiles: true, stdout: "8" },
      },
    ],
  },

  // ─── MID ──────────────────────────────────────────────────────────────────
  {
    slug: "mid",
    level: "mid",
    title: L("Mid-level TypeScript Developer", "TypeScript Developer Semi-Senior", "中級 TypeScript 開発者"),
    description: L(
      "Code-reading screen for a mid-level role: this, classes, async, the event loop, narrowing and generics.",
      "Filtro de lectura de código para un puesto intermedio: this, clases, async, event loop, narrowing y genéricos.",
      "中級職のコード読解試験：this、クラス、非同期、イベントループ、型の絞り込み、ジェネリクス。",
    ),
    count: 14,
    passPct: 70,
    secondsPerQuestion: 40,
    questions: [
      // closures
      {
        topic: "closures", difficulty: 1, kind: "predict", prompt: ORDER,
        code: code("for (let i = 0; i < 3; i++) {", "  setTimeout(() => console.log(i), 0);", "}"),
        options: ["0 1 2", "3 3 3", "0 0 0"], answer: 0,
        explain: L(
          "let creates a fresh i for each iteration, and each callback closes over its own copy.",
          "let crea una i nueva en cada vuelta, y cada callback captura la suya en su closure.",
          "let は繰り返しごとに新しい i を作り、各コールバックが自分の i をクロージャで持つよ。",
        ),
        check: { compiles: true, stdout: "0\n1\n2" },
      },
      {
        topic: "closures", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "function once(fn: () => string) {",
          "  let done = false;",
          "  return () => {",
          '    if (done) return "skip";',
          "    done = true;",
          "    return fn();",
          "  };",
          "}",
          'const init = once(() => "init");',
          "console.log(init(), init());",
        ),
        options: ["init init", "init skip", "skip skip"], answer: 1,
        explain: L(
          "done lives in the closure and survives between calls: the first call runs fn, later ones are skipped.",
          "done vive en el closure y sobrevive entre llamadas: la primera ejecuta fn, las siguientes se saltan.",
          "done はクロージャの中で呼び出し間も残る。1回目だけ fn が動き、2回目以降は skip だよ。",
        ),
        check: { compiles: true, stdout: "init skip" },
      },
      // this
      {
        topic: "this", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code("function f(this: { v: number }) {", "  return this.v;", "}", "const g = f.bind({ v: 1 });", "console.log(g.call({ v: 2 }));"),
        options: ["1", "2", "undefined"], answer: 0,
        explain: L(
          "bind fixes this for good. call on a bound function can't override it, so this.v is still 1.",
          "bind fija this para siempre. call sobre una función ligada no puede cambiarlo, así que this.v sigue siendo 1.",
          "bind は this を固定する。bind 済みの関数に call しても変えられないので this.v は 1 のままだよ。",
        ),
        check: { compiles: true, stdout: "1" },
      },
      {
        topic: "this", difficulty: 2, kind: "predict", prompt: L("What happens?", "¿Qué pasa?", "どうなる？"),
        code: code("class Hero {", '  name = "Ada";', "  hi() {", "    return this.name;", "  }", "}", "const hi = new Hero().hi;", "console.log(hi());"),
        options: ["Ada", "undefined", "TypeError"], answer: 2,
        explain: L(
          "Pulling the method off the object loses its this. Class code is strict, so this is undefined and reading name throws.",
          "Sacar el método del objeto pierde su this. El código de clases es estricto: this es undefined y leer name lanza error.",
          "メソッドを取り出すと this が失われる。クラスは strict モードなので this は undefined で、name を読むと例外だよ。",
        ),
        check: { compiles: true, throws: "TypeError" },
      },
      {
        topic: "this", difficulty: 2, kind: "pick", prompt: L("Keep this when passing the method", "Conserva this al pasar el método", "メソッドを渡しても this を保とう"),
        code: code("class Hero {", '  name = "Ada";', "  hi() {", "    return this.name;", "  }", "}", "const h = new Hero();", "const hi = h.hi.___(h);", "console.log(hi());"),
        options: ["bind", "call", "apply"], answer: 0,
        explain: L(
          "bind returns a NEW function with this fixed. call and apply invoke right away and return the string.",
          "bind devuelve una función NUEVA con this fijo. call y apply la invocan al instante y devuelven el string.",
          "bind は this を固定した新しい関数を返す。call と apply はその場で呼んで文字列を返すよ。",
        ),
        check: { compiles: true, stdout: "Ada", wrongFail: true },
      },
      // classes
      {
        topic: "classes", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("class A {}", "class B extends A {", "  x: number;", "  constructor() {", "    this.x = 1;", "  }", "}"),
        options: YN, answer: 1,
        explain: L(
          "A derived constructor must call super() before using this. tsc rejects it; plain JS throws a ReferenceError.",
          "Un constructor derivado debe llamar a super() antes de usar this. tsc lo rechaza; en JS lanza ReferenceError.",
          "派生クラスのコンストラクタは this の前に super() が必要。tsc はエラー、JS では ReferenceError だよ。",
        ),
        check: { compiles: false },
      },
      {
        topic: "classes", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("class Bank {", "  #gold = 10;", "  get gold() {", "    return this.#gold;", "  }", "}", "const b = new Bank();", "console.log(b.gold, Object.keys(b).length);"),
        options: ["10 1", "10 0", "undefined 0"], answer: 1,
        explain: L(
          "#gold is truly private: invisible to Object.keys and outside code. The getter can still read it.",
          "#gold es privado de verdad: invisible para Object.keys y el código externo. El getter sí puede leerlo.",
          "#gold は本当に private。Object.keys にも外のコードにも見えないが、getter からは読めるよ。",
        ),
        check: { compiles: true, stdout: "10 0" },
      },
      // objects
      {
        topic: "objects", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code('const a = { bag: ["gem"] };', "const b = structuredClone(a);", 'b.bag.push("key");', "console.log(a.bag.length);"),
        options: ["1", "2"], answer: 0,
        explain: L(
          "structuredClone makes a DEEP copy, so b.bag is a new array. Spread would have shared it.",
          "structuredClone hace una copia PROFUNDA, así que b.bag es un array nuevo. El spread lo habría compartido.",
          "structuredClone は深いコピーなので b.bag は別の配列。スプレッドなら共有されていたよ。",
        ),
        check: { compiles: true, stdout: "1" },
      },
      {
        topic: "objects", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code('const cfg = Object.freeze({ hp: 5, tags: ["a"] });', 'cfg.tags.push("b");', "console.log(cfg.tags.length);"),
        options: ["1", "2", "TypeError"], answer: 1,
        explain: L(
          "Object.freeze is shallow: cfg.tags can't be replaced, but the array inside can still change.",
          "Object.freeze es superficial: no puedes reemplazar cfg.tags, pero el array de adentro sí puede cambiar.",
          "Object.freeze は浅い。cfg.tags の差し替えはできないが、中の配列は変更できるよ。",
        ),
        check: { compiles: true, stdout: "2" },
      },
      // async
      {
        topic: "async", difficulty: 2, kind: "predict", prompt: ORDER,
        code: code(WAIT_DEF, "[1, 2].forEach(async (n) => {", "  await wait(10);", "  console.log(n);", "});", 'console.log("done");'),
        options: ["1 2 done", "done 1 2", "done"], answer: 1,
        explain: L(
          "forEach ignores the promises its callbacks return, so it doesn't wait. Use for...of or Promise.all.",
          "forEach ignora las promesas que devuelven sus callbacks, así que no espera. Usa for...of o Promise.all.",
          "forEach はコールバックが返す Promise を無視して待たない。for...of か Promise.all を使おう。",
        ),
        check: { compiles: true, stdout: "done\n1\n2" },
      },
      {
        topic: "async", difficulty: 2, kind: "pick", prompt: L("Run both waits at the same time", "Haz ambas esperas a la vez", "2つの待ちを同時に走らせよう"),
        code: code(WAIT_DEF, "const t0 = Date.now();", "___;", "console.log(Date.now() - t0 < 350);"),
        options: ["await Promise.all([wait(200), wait(200)])", "await wait(200); await wait(200)"], answer: 0,
        explain: L(
          "Promise.all starts both timers together (about 200 ms). Two awaits in a row take about 400 ms.",
          "Promise.all arranca ambos timers juntos (unos 200 ms). Dos await seguidos tardan unos 400 ms.",
          "Promise.all は2つを同時に始める（約 200 ms）。await を2回続けると約 400 ms かかるよ。",
        ),
        check: { compiles: true, stdout: "true" },
      },
      {
        topic: "async", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("try {", '  JSON.parse("x");', "} catch (e) {", "  console.log(e.message);", "}"),
        options: YN, answer: 1,
        explain: L(
          "Under strict, a caught e is unknown: anything can be thrown. Narrow first with e instanceof Error.",
          "En modo strict, la e atrapada es unknown: se puede lanzar cualquier cosa. Estrecha antes con e instanceof Error.",
          "strict では catch の e は unknown（何でも throw できるから）。先に e instanceof Error で絞ろう。",
        ),
        check: { compiles: false },
      },
      // event_loop
      {
        topic: "event_loop", difficulty: 1, kind: "predict", prompt: ORDER,
        code: code('console.log("A");', 'setTimeout(() => console.log("B"), 0);', 'Promise.resolve().then(() => console.log("C"));', 'console.log("D");'),
        options: ["A B C D", "A D B C", "A D C B"], answer: 2,
        explain: L(
          "Synchronous code first (A, D), then all microtasks (the promise C), then a macrotask (the timer B).",
          "Primero lo síncrono (A, D), luego todas las microtareas (la promesa C), y después una macrotarea (el timer B).",
          "まず同期の A と D、次にマイクロタスク（Promise の C）、最後にマクロタスク（タイマーの B）だよ。",
        ),
        check: { compiles: true, stdout: "A\nD\nC\nB" },
      },
      {
        topic: "event_loop", difficulty: 2, kind: "predict", prompt: ORDER,
        code: code('setTimeout(() => console.log("T"), 0);', 'queueMicrotask(() => console.log("M"));', 'console.log("S");'),
        options: ["S M T", "S T M", "M S T"], answer: 0,
        explain: L(
          "queueMicrotask joins the microtask queue, which drains right after the synchronous code and before any timer.",
          "queueMicrotask entra en la cola de microtareas, que se vacía justo tras el código síncrono y antes de cualquier timer.",
          "queueMicrotask はマイクロタスクの列に入る。同期処理の直後、どのタイマーより先に片づくよ。",
        ),
        check: { compiles: true, stdout: "S\nM\nT" },
      },
      {
        topic: "event_loop", difficulty: 3, kind: "predict", prompt: ORDER,
        code: code(
          "Promise.resolve()",
          "  .then(() => console.log(1))",
          "  .then(() => console.log(2));",
          "Promise.resolve()",
          "  .then(() => console.log(3))",
          "  .then(() => console.log(4));",
        ),
        options: ["1 2 3 4", "1 3 2 4", "3 1 4 2"], answer: 1,
        explain: L(
          "Each then is queued only when the previous step settles, so the two chains interleave one step at a time.",
          "Cada then se encola solo cuando el paso anterior se resuelve, así que las dos cadenas se intercalan paso a paso.",
          "then は前の段階が終わって初めて並ぶ。だから2つのチェーンが1段ずつ交互に進むよ。",
        ),
        check: { compiles: true, stdout: "1\n3\n2\n4" },
      },
      // narrowing
      {
        topic: "narrowing", difficulty: 1, kind: "pick", prompt: L("Narrow x to a string", "Estrecha x a string", "x を string に絞ろう"),
        code: code("function len(x: string | number) {", "  if (typeof x === ___) return x.length;", "  return x;", "}", 'console.log(len("abc"), len(5));'),
        options: ['"string"', '"number"', '"text"'], answer: 0,
        explain: L(
          "typeof x === \"string\" narrows x to string inside the if; after it, only number is left.",
          "typeof x === \"string\" estrecha x a string dentro del if; después solo queda number.",
          "typeof x === \"string\" で if の中の x は string に絞られ、その後は number だけが残るよ。",
        ),
        check: { compiles: true, stdout: "3 5", wrongFail: true },
      },
      {
        topic: "narrowing", difficulty: 2, kind: "type", prompt: L("Write a type predicate", "Escribe un predicado de tipo", "型述語を書こう"),
        code: code(
          "type Fish = { swim: () => string };",
          "type Bird = { fly: () => string };",
          "function isFish(p: Fish | Bird): p ___ Fish {",
          '  return "swim" in p;',
          "}",
          'const pet: Fish | Bird = { swim: () => "splash" };',
          "if (isFish(pet)) console.log(pet.swim());",
        ),
        answer: "is",
        explain: L(
          "p is Fish is a type predicate: when isFish returns true, TypeScript narrows the argument to Fish.",
          "p is Fish es un predicado de tipo: cuando isFish devuelve true, TypeScript estrecha el argumento a Fish.",
          "p is Fish は型述語。isFish が true を返すと、TypeScript は引数を Fish に絞るよ。",
        ),
        check: { compiles: true, stdout: "splash" },
      },
      {
        topic: "narrowing", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code(
          'type Shape = "circle" | "square" | "tri";',
          "function area(s: Shape) {",
          "  switch (s) {",
          '    case "circle": return 1;',
          '    case "square": return 2;',
          "    default:",
          "      const unreachable: never = s;",
          "      return unreachable;",
          "  }",
          "}",
        ),
        options: YN, answer: 1,
        explain: L(
          "\"tri\" isn't handled, so s is still \"tri\" in default and can't be assigned to never. That's the exhaustiveness check.",
          "\"tri\" no se maneja, así que en default s sigue siendo \"tri\" y no cabe en never. Es el chequeo de exhaustividad.",
          "\"tri\" が未処理なので default の s は \"tri\" のまま never に代入できない。これが網羅性チェックだよ。",
        ),
        check: { compiles: false },
      },
      // generics
      {
        topic: "generics", difficulty: 2, kind: "pick", prompt: L("Only allow real keys of obj", "Permite solo claves reales de obj", "obj の本当のキーだけ許そう"),
        code: code("function getProp<T, K extends ___>(obj: T, key: K): T[K] {", "  return obj[key];", "}", 'console.log(getProp({ hp: 5 }, "hp"));'),
        options: ["keyof T", "string", "T"], answer: 0,
        explain: L(
          "keyof T is the union of T's keys, so T[K] is a valid indexed access and the return type is exact.",
          "keyof T es la unión de las claves de T, así que T[K] es un acceso indexado válido y el tipo de retorno es exacto.",
          "keyof T は T のキーのユニオン。だから T[K] が正しいインデックス型になり、戻り値の型も正確だよ。",
        ),
        check: { compiles: true, stdout: "5", wrongFail: true },
      },
      {
        topic: "generics", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("function first<T>(arr: T[]): T | undefined {", "  return arr[0];", "}", 'const x = first(["a", "b"]);', "const s: string = x;"),
        options: YN, answer: 1,
        explain: L(
          "T is inferred as string, so x is string | undefined. Handle the empty case (x ?? \"\") before using it as string.",
          "T se infiere como string, así que x es string | undefined. Maneja el caso vacío (x ?? \"\") antes de usarlo como string.",
          "T は string と推論され、x は string | undefined。string として使う前に x ?? \"\" などで空の場合を処理しよう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "generics", difficulty: 2, kind: "type", prompt: L("Constrain T to things with a length", "Restringe T a cosas con length", "T を length を持つ型に制限しよう"),
        code: code("function longest<T extends { ___: number }>(a: T, b: T) {", "  return a.length >= b.length ? a : b;", "}", 'console.log(longest("hi", "hey"));'),
        answer: "length",
        explain: L(
          "extends { length: number } lets T be any type with a numeric length: strings, arrays and more.",
          "extends { length: number } deja que T sea cualquier tipo con un length numérico: strings, arrays y más.",
          "extends { length: number } で、T は数値の length を持つ型（文字列や配列など）なら何でも OK になるよ。",
        ),
        check: { compiles: true, stdout: "hey" },
      },
      // collections
      {
        topic: "collections", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("const m = new Map<object, string>();", "const k = { id: 1 };", 'm.set(k, "hero");', "console.log(m.get({ id: 1 }), m.get(k), m.size);"),
        options: ["hero hero 1", "undefined hero 1", "undefined hero 2"], answer: 1,
        explain: L(
          "Map compares object keys by reference: a new { id: 1 } is a different key, so only k finds hero.",
          "Map compara las claves objeto por referencia: un { id: 1 } nuevo es otra clave, así que solo k encuentra hero.",
          "Map はオブジェクトのキーを参照で比べる。新しい { id: 1 } は別のキーなので、hero が取れるのは k だけ。",
        ),
        check: { compiles: true, stdout: "undefined hero 1" },
      },
      // modules
      {
        topic: "modules", difficulty: 1, kind: "predict", prompt: COMPILES,
        code: code("export default 1;", "export default 2;"),
        options: YN, answer: 1,
        explain: L(
          "An ES module has at most ONE default export, but it can have any number of named exports.",
          "Un módulo ES tiene como máximo UN export default, pero puede tener todos los exports con nombre que quieras.",
          "ES モジュールの default エクスポートは1つまで。名前付きエクスポートはいくつでも OK だよ。",
        ),
        check: { compiles: false },
      },
      // performance
      {
        topic: "performance", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "function debounce(fn: (x: string) => void, ms: number) {",
          "  let t: number | undefined;",
          "  return (x: string) => {",
          "    clearTimeout(t);",
          "    t = setTimeout(() => fn(x), ms);",
          "  };",
          "}",
          "const log = debounce((x) => console.log(x), 10);",
          'log("a");',
          'log("b");',
          'log("c");',
        ),
        options: ["a", "c", "a b c"], answer: 1,
        explain: L(
          "Debounce restarts the timer on every call, so only the last call fires once things go quiet. Ideal for search boxes.",
          "Debounce reinicia el timer en cada llamada, así que solo la última se ejecuta al haber calma. Ideal para buscadores.",
          "デバウンスは呼ぶたびにタイマーをリセットし、静かになった後の最後の呼び出しだけ動く。検索欄に最適だよ。",
        ),
        check: { compiles: true, stdout: "c" },
      },
    ],
  },

  // ─── SENIOR ───────────────────────────────────────────────────────────────
  {
    slug: "senior",
    level: "senior",
    title: L("Senior TypeScript Developer", "TypeScript Developer Senior", "シニア TypeScript 開発者"),
    description: L(
      "Senior technical interview: event loop puzzles, async pitfalls, type-level TypeScript, modules and memory.",
      "Entrevista técnica senior: acertijos del event loop, trampas async, TypeScript a nivel de tipos, módulos y memoria.",
      "シニアの技術面接：イベントループの難問、非同期の罠、型レベル TS、モジュール、メモリ。",
    ),
    count: 15,
    passPct: 75,
    secondsPerQuestion: 50,
    questions: [
      // event_loop
      {
        topic: "event_loop", difficulty: 2, kind: "predict", prompt: ORDER,
        code: code(
          "console.log(1);",
          "setTimeout(() => console.log(2));",
          "Promise.resolve().then(() => console.log(3));",
          "(async () => {",
          "  console.log(4);",
          "  await null;",
          "  console.log(5);",
          "})();",
          "console.log(6);",
        ),
        options: ["1 4 6 3 5 2", "1 6 4 3 5 2", "1 4 6 5 3 2"], answer: 0,
        explain: L(
          "The async body runs synchronously until await (1 4 6). Microtasks drain in queue order (3, 5), then the timer (2).",
          "El cuerpo async corre síncrono hasta el await (1 4 6). Las microtareas salen en orden de cola (3, 5) y luego el timer (2).",
          "async の本体は await まで同期（1 4 6）。マイクロタスクは並んだ順（3、5）、最後にタイマー（2）。",
        ),
        check: { compiles: true, stdout: "1\n4\n6\n3\n5\n2" },
      },
      {
        topic: "event_loop", difficulty: 3, kind: "predict", prompt: ORDER,
        code: code(
          "async function f() {",
          '  return Promise.resolve("x");',
          "}",
          "f().then((v) => console.log(v));",
          "Promise.resolve()",
          '  .then(() => console.log("a"))',
          '  .then(() => console.log("b"))',
          '  .then(() => console.log("c"));',
        ),
        options: ["x a b c", "a x b c", "a b x c"], answer: 2,
        explain: L(
          "Returning a promise from an async function adopts it, which costs two extra microtask ticks. So x lands after b.",
          "Devolver una promesa desde una función async la adopta, y eso cuesta dos ticks extra de microtareas. Por eso x cae tras b.",
          "async 関数から Promise を返すと取り込みにマイクロタスク2回分余計にかかる。だから x は b の後だよ。",
        ),
        check: { compiles: true, stdout: "a\nb\nx\nc" },
      },
      {
        topic: "event_loop", difficulty: 2, kind: "predict", prompt: ORDER,
        code: code(
          'setTimeout(() => console.log("A"), 0);',
          "Promise.resolve().then(() => {",
          '  console.log("B");',
          '  setTimeout(() => console.log("C"), 0);',
          '  Promise.resolve().then(() => console.log("D"));',
          "});",
        ),
        options: ["B D A C", "B A D C", "A B D C"], answer: 0,
        explain: L(
          "B runs as a microtask and queues D (same drain) and C (a new timer behind A). So: B, D, then timers A, C.",
          "B corre como microtarea y encola D (mismo vaciado) y C (un timer nuevo tras A). Queda: B, D y luego los timers A, C.",
          "B はマイクロタスクで、D（同じ回で処理）と C（A の後ろのタイマー）を予約。B、D、A、C の順だよ。",
        ),
        check: { compiles: true, stdout: "B\nD\nA\nC" },
      },
      {
        topic: "event_loop", difficulty: 3, kind: "predict", prompt: ORDER,
        code: code(
          "async function a() {",
          '  console.log("a1");',
          "  await b();",
          '  console.log("a2");',
          "}",
          'async function b() { console.log("b"); }',
          'console.log("s");',
          "a();",
          'Promise.resolve().then(() => console.log("p"));',
          'console.log("e");',
        ),
        options: ["s a1 b e a2 p", "s a1 b e p a2", "s a1 e b a2 p"], answer: 0,
        explain: L(
          "a and b run synchronously up to the await. b's promise is already settled, so a2's continuation is queued before p.",
          "a y b corren síncronos hasta el await. La promesa de b ya está resuelta, así que la continuación de a2 se encola antes que p.",
          "a と b は await まで同期で動く。b の Promise は解決済みなので、a2 の続きは p より先に並ぶよ。",
        ),
        check: { compiles: true, stdout: "s\na1\nb\ne\na2\np" },
      },
      // async
      {
        topic: "async", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "async function fail(): Promise<string> {",
          '  throw new Error("x");',
          "}",
          "async function a() {",
          "  try {",
          "    return fail();",
          "  } catch {",
          '    return "caught";',
          "  }",
          "}",
          'a().catch(() => "escaped").then(console.log);',
        ),
        options: ["caught", "escaped", "x"], answer: 1,
        explain: L(
          "return fail() hands back the promise without awaiting it inside try, so the rejection escapes the catch block.",
          "return fail() devuelve la promesa sin esperarla dentro del try, así que el rechazo escapa del bloque catch.",
          "return fail() は try の中で await せずに Promise を返す。だから失敗は catch をすり抜けるよ。",
        ),
        check: { compiles: true, stdout: "escaped" },
      },
      {
        topic: "async", difficulty: 3, kind: "type", prompt: L("Make the try/catch catch it", "Haz que el try/catch lo atrape", "try/catch で捕まえられるようにしよう"),
        code: code(
          "async function fail(): Promise<string> {",
          '  throw new Error("x");',
          "}",
          "async function a() {",
          "  try {",
          "    return ___ fail();",
          "  } catch {",
          '    return "caught";',
          "  }",
          "}",
          "a().then(console.log);",
        ),
        answer: "await",
        explain: L(
          "return await settles the promise inside the try, so its rejection is thrown there and caught.",
          "return await resuelve la promesa dentro del try, así que su rechazo se lanza ahí y se atrapa.",
          "return await なら try の中で Promise が決まるので、失敗はそこで throw されて catch されるよ。",
        ),
        check: { compiles: true, stdout: "caught" },
      },
      {
        topic: "async", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("const v = await Promise.any([", '  Promise.reject(new Error("a")),', "  Promise.resolve(2),", "]);", "console.log(v);"),
        options: ["2", "Error: a", "AggregateError"], answer: 0,
        explain: L(
          "Promise.any ignores rejections and fulfills with the first success. It rejects with AggregateError only if ALL fail.",
          "Promise.any ignora los rechazos y se cumple con el primer éxito. Solo se rechaza con AggregateError si TODAS fallan.",
          "Promise.any は失敗を無視して最初の成功で決まる。全部失敗したときだけ AggregateError になるよ。",
        ),
        check: { compiles: true, stdout: "2" },
      },
      // type_transforms
      {
        topic: "type_transforms", difficulty: 3, kind: "predict", prompt: L("What is R?", "¿Qué es R?", "R は何型？"),
        code: code('type IsStr<T> = T extends string ? "yes" : "no";', "type R = IsStr<string | number>;"),
        options: ['"yes"', '"no"', '"yes" | "no"'], answer: 2,
        explain: L(
          "A conditional type on a naked T distributes over unions: string gives \"yes\", number gives \"no\". Wrap as [T] to stop it.",
          "Un tipo condicional sobre una T desnuda se distribuye en las uniones: string da \"yes\", number da \"no\". Usa [T] para evitarlo.",
          "裸の T への条件型はユニオンに分配される。string は \"yes\"、number は \"no\"。[T] で包むと分配しないよ。",
        ),
        check: {
          compiles: true,
          program: code('type IsStr<T> = T extends string ? "yes" : "no";', "type R = IsStr<string | number>;", 'const a: R = "yes";', 'const b: R = "no";'),
        },
      },
      {
        topic: "type_transforms", difficulty: 2, kind: "type", prompt: L("Extract the element type", "Extrae el tipo del elemento", "要素の型を取り出そう"),
        code: code("type ElementOf<T> = T extends (___ U)[] ? U : never;", 'const x: ElementOf<string[]> = "ok";', "console.log(x);"),
        answer: "infer",
        explain: L(
          "infer U declares a type variable that TypeScript fills in while matching the pattern: string[] gives U = string.",
          "infer U declara una variable de tipo que TypeScript rellena al encajar el patrón: string[] da U = string.",
          "infer U はパターン照合で TypeScript が埋める型変数。string[] なら U = string になるよ。",
        ),
        check: { compiles: true, stdout: "ok" },
      },
      {
        topic: "type_transforms", difficulty: 1, kind: "pick", prompt: L("Keep only id and name", "Quédate solo con id y name", "id と name だけ残そう"),
        code: code(
          "interface User {",
          "  id: number;",
          "  name: string;",
          "  email: string;",
          "}",
          'type Preview = ___<User, "id" | "name">;',
          'const p: Preview = { id: 1, name: "Ada" };',
          "console.log(Object.keys(p).length);",
        ),
        options: ["Pick", "Omit", "Partial"], answer: 0,
        explain: L(
          "Pick<T, K> keeps the listed keys; Omit<T, K> removes them; Partial takes only one argument.",
          "Pick<T, K> conserva las claves indicadas; Omit<T, K> las quita; Partial recibe un solo argumento.",
          "Pick<T, K> は指定したキーを残し、Omit<T, K> は取り除く。Partial は引数を1つしか取らないよ。",
        ),
        check: { compiles: true, stdout: "2", wrongFail: true },
      },
      {
        topic: "type_transforms", difficulty: 2, kind: "pick", prompt: L("Type of the resolved value", "Tipo del valor resuelto", "解決後の値の型"),
        code: code(
          "async function load() {",
          "  return { id: 1 };",
          "}",
          "type Data = ___<ReturnType<typeof load>>;",
          "const d: Data = { id: 2 };",
          "console.log(d.id);",
        ),
        options: ["Awaited", "Promise", "Partial"], answer: 0,
        explain: L(
          "ReturnType gives Promise<{ id: number }>; Awaited unwraps it (recursively) to { id: number }.",
          "ReturnType da Promise<{ id: number }>; Awaited la desenvuelve (recursivamente) a { id: number }.",
          "ReturnType は Promise<{ id: number }>。Awaited がそれを（再帰的に）{ id: number } に開くよ。",
        ),
        check: { compiles: true, stdout: "2", wrongFail: true },
      },
      // ts_advanced
      {
        topic: "ts_advanced", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code(
          "class Animal { name = \"a\"; }",
          "class Dog extends Animal { bark() { return \"woof\"; } }",
          "let handleDog = (d: Dog) => console.log(d.bark());",
          "let handleAnimal: (a: Animal) => void = handleDog;",
        ),
        options: YN, answer: 1,
        explain: L(
          "Parameters are contravariant under strictFunctionTypes: a Dog handler can't take any Animal. The reverse is fine.",
          "Los parámetros son contravariantes con strictFunctionTypes: un handler de Dog no acepta cualquier Animal. Al revés sí.",
          "strictFunctionTypes では引数は反変。Dog 用の関数に任意の Animal は渡せない。逆向きなら OK だよ。",
        ),
        check: { compiles: false },
      },
      {
        topic: "ts_advanced", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code(
          "function len(s: string): number;",
          "function len(a: unknown[]): number;",
          "function len(x: string | unknown[]) {",
          "  return x.length;",
          "}",
          "function f(v: string | unknown[]) {",
          "  return len(v);",
          "}",
        ),
        options: YN, answer: 1,
        explain: L(
          "Overloads are tried one by one and none accepts the union (TS2769). Add a union overload or use a single union signature.",
          "Las sobrecargas se prueban una a una y ninguna acepta la unión (TS2769). Agrega una sobrecarga con la unión o usa una sola firma.",
          "オーバーロードは1つずつ試され、どれもユニオンを受け取れない（TS2769）。ユニオン用の宣言を足そう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "ts_advanced", difficulty: 3, kind: "type", prompt: L("Remap each key to getXxx", "Renombra cada clave a getXxx", "各キーを getXxx に変えよう"),
        code: code(
          "type Getters<T> = {",
          "  [K in keyof T ___ `get${Capitalize<string & K>}`]: () => T[K];",
          "};",
          'const g: Getters<{ name: string }> = { getName: () => "Ada" };',
          "console.log(g.getName());",
        ),
        answer: "as",
        explain: L(
          "In a mapped type, as renames each key; with a template literal type name becomes getName.",
          "En un tipo mapeado, as renombra cada clave; con un template literal type, name pasa a getName.",
          "マップ型の as はキー名を変える。テンプレートリテラル型と組み合わせて name が getName になるよ。",
        ),
        check: { compiles: true, stdout: "Ada" },
      },
      {
        topic: "ts_advanced", difficulty: 2, kind: "type", prompt: L("Narrow s after the call", "Estrecha s tras la llamada", "呼んだ後で s を絞ろう"),
        code: code(
          "function assertDefined<T>(v: T): ___ v is NonNullable<T> {",
          '  if (v == null) throw new Error("missing");',
          "}",
          "function shout(s?: string) {",
          "  assertDefined(s);",
          "  return s.toUpperCase();",
          "}",
          'console.log(shout("hi"));',
        ),
        answer: "asserts",
        explain: L(
          "An assertion function either throws or proves the condition, so after the call TypeScript treats s as string.",
          "Una función de aserción lanza o prueba la condición, así que tras la llamada TypeScript trata s como string.",
          "アサーション関数は throw するか条件を保証する。だから呼んだ後の s は string として扱われるよ。",
        ),
        check: { compiles: true, stdout: "HI" },
      },
      // narrowing
      {
        topic: "narrowing", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(
          "type Res = { ok: true; value: number } | { ok: false; error: string };",
          "function show(r: Res) {",
          "  return r.ok ? r.value * 2 : r.error;",
          "}",
          'console.log(show({ ok: true, value: 21 }), show({ ok: false, error: "x" }));',
        ),
        options: ["42 x", "21 x", "42 undefined"], answer: 0,
        explain: L(
          "ok is a discriminant: checking it narrows r to one member, so value and error are safe to read.",
          "ok es un discriminante: comprobarlo estrecha r a un solo miembro, así que value y error se leen con seguridad.",
          "ok は判別子。調べると r が片方に絞られるので value も error も安全に読めるよ。",
        ),
        check: { compiles: true, stdout: "42 x" },
      },
      {
        topic: "narrowing", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("function keys(x: unknown) {", '  if (typeof x === "object") return Object.keys(x);', "  return [];", "}"),
        options: YN, answer: 1,
        explain: L(
          "typeof null is \"object\", so x narrows to object | null and Object.keys(null) is rejected. Add x !== null.",
          "typeof null es \"object\", así que x se estrecha a object | null y Object.keys(null) se rechaza. Agrega x !== null.",
          "typeof null は \"object\" なので x は object | null になり、Object.keys(null) は拒否される。x !== null を足そう。",
        ),
        check: { compiles: false },
      },
      // generics
      {
        topic: "generics", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(
          "function merge<T extends object, U extends object>(a: T, b: U) {",
          "  return { ...a, ...b };",
          "}",
          'const m = merge({ hp: 5 }, { name: "Ada" });',
          "console.log(m.name, m.hp);",
        ),
        options: ["Ada 5", "undefined 5", "Ada undefined"], answer: 0,
        explain: L(
          "The result is typed T & U, so both name and hp are known and present at runtime.",
          "El resultado se tipa como T & U, así que name y hp se conocen y existen en runtime.",
          "戻り値は T & U 型なので、name も hp も型が分かり、実行時にも存在するよ。",
        ),
        check: { compiles: true, stdout: "Ada 5" },
      },
      // iterators
      {
        topic: "iterators", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("function* gen() {", "  yield 1;", "  yield 2;", "  return 3;", "}", 'console.log([...gen()].join(","));'),
        options: ["1,2", "1,2,3", "3"], answer: 0,
        explain: L(
          "Spread and for...of stop when done is true and ignore the return value, so 3 is never collected.",
          "El spread y for...of se detienen cuando done es true e ignoran el valor de return, así que 3 nunca se recoge.",
          "スプレッドや for...of は done が true で止まり、return の値は無視する。だから 3 は入らないよ。",
        ),
        check: { compiles: true, stdout: "1,2" },
      },
      {
        topic: "iterators", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'for (const k in ["x", "y"]) console.log(typeof k, k);',
        options: ["string 0 string 1", "string x string y", "number 0 number 1"], answer: 0,
        explain: L(
          "for...in walks property KEYS, and array keys are strings. Use for...of to get the values.",
          "for...in recorre las CLAVES de propiedades, y las claves de un array son strings. Usa for...of para los valores.",
          "for...in はプロパティのキーをたどり、配列のキーは文字列。値が欲しいなら for...of だよ。",
        ),
        check: { compiles: true, stdout: "string 0\nstring 1" },
      },
      // modules
      {
        topic: "modules", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("const hp = await Promise.resolve(5);", "console.log(hp * 2);"),
        options: ["10", "NaN", "SyntaxError"], answer: 0,
        explain: L(
          "ES modules allow top-level await: the module pauses, and modules that import it wait until it finishes.",
          "Los módulos ES permiten await de nivel superior: el módulo se pausa y quienes lo importan esperan a que termine.",
          "ES モジュールではトップレベル await が使える。モジュールは一時停止し、読み込む側は完了を待つよ。",
        ),
        check: { compiles: true, stdout: "10" },
      },
      {
        topic: "modules", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("if (Math.random() > 0.5) {", "  export const lucky = true;", "}"),
        options: YN, answer: 1,
        explain: L(
          "import and export are static: top level only. That lets bundlers tree-shake. For conditional loading use await import().",
          "import y export son estáticos: solo en el nivel superior. Eso permite el tree shaking. Para cargar condicional, await import().",
          "import と export は静的でトップレベルのみ。だからツリーシェイキングできる。条件付きなら await import() だよ。",
        ),
        check: { compiles: false },
      },
      // memory
      {
        topic: "memory", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'console.log("size" in new WeakMap(), "size" in new Map());',
        options: ["true true", "false true", "false false"], answer: 1,
        explain: L(
          "WeakMap holds keys weakly, so the GC may drop them at any time: it has no size and can't be iterated.",
          "WeakMap guarda las claves de forma débil y el GC puede liberarlas cuando quiera: no tiene size ni se puede iterar.",
          "WeakMap はキーを弱く持ち、GC がいつでも回収できる。だから size もなく、反復もできないよ。",
        ),
        check: { compiles: true, stdout: "false true" },
      },
      {
        topic: "memory", difficulty: 2, kind: "pick", prompt: L("Cache that lets keys be collected", "Caché que deja liberar las claves", "キーを GC で回収できるキャッシュ"),
        code: code("const meta = new ___<object, string>();", "let node: object | null = {};", 'meta.set(node, "cached");', "node = null;"),
        options: ["WeakMap", "Map"], answer: 0,
        explain: L(
          "A Map keeps a strong reference, so the object stays alive (a leak). A WeakMap lets the GC free it once node is null.",
          "Un Map guarda una referencia fuerte y el objeto sigue vivo (fuga). Un WeakMap deja que el GC lo libere al ser null node.",
          "Map は強参照なのでオブジェクトが残り続ける（リーク）。WeakMap なら node が null になれば GC が回収できるよ。",
        ),
        check: { compiles: true },
      },
      // security
      {
        topic: "security", difficulty: 1, kind: "pick", prompt: L("Show user text safely", "Muestra texto del usuario seguro", "ユーザーの文字を安全に表示"),
        code: code("function show(el: HTMLElement, userText: string) {", "  el.___ = userText;", "}"),
        options: ["textContent", "innerHTML"], answer: 0,
        explain: L(
          "textContent inserts plain text. innerHTML parses HTML, so a <img onerror=...> in user input becomes XSS.",
          "textContent inserta texto plano. innerHTML interpreta HTML, así que un <img onerror=...> del usuario se vuelve XSS.",
          "textContent はただの文字として入れる。innerHTML は HTML として解釈するので、<img onerror=...> で XSS になるよ。",
        ),
        check: { compiles: true },
      },
      // classes
      {
        topic: "classes", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "class A {",
          "  hi() {",
          '    return "proto";',
          "  }",
          "}",
          "const a = new A();",
          "const b = new A();",
          'a.hi = () => "own";',
          'console.log(a.hi(), b.hi(), Object.hasOwn(a, "hi"));',
        ),
        options: ["own own true", "own proto true", "own proto false"], answer: 1,
        explain: L(
          "Methods live on the prototype. Assigning a.hi creates an OWN property that shadows it only for a; b still uses the prototype.",
          "Los métodos viven en el prototipo. Asignar a.hi crea una propiedad PROPIA que lo tapa solo para a; b sigue usando el prototipo.",
          "メソッドはプロトタイプにある。a.hi への代入は a だけの自身のプロパティで上書きし、b はプロトタイプのままだよ。",
        ),
        check: { compiles: true, stdout: "own proto true" },
      },
    ],
  },
];
