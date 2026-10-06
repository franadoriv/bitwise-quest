import type { ExamDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Entry exams that simulate company screenings for Python roles (backend, data, automation).
// Topics, levels and bank sizes follow docs/research/python-curriculum.md ("Entry exam") and
// docs/research/python-hiring-assessments.md. Every output or exception claim carries a `check`
// run in CPython 3.14 (Pyodide): `npm run content:verify -- --lang=python --only=exam:`.
// Exceptions are asked by class name only. Threads cannot run in the browser runner, so GIL and
// threading questions are concept picks without a check.

const code = (...lines: string[]) => lines.join("\n");

const PRINTS = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const LINES = L("What does it print, line by line?", "¿Qué imprime, línea por línea?", "行ごとに何が表示される？");
const HAPPENS = L("What happens when it runs?", "¿Qué pasa al ejecutarlo?", "実行するとどうなる？");

export const exams: ExamDef[] = [
  // ─── JUNIOR ───────────────────────────────────────────────────────────────
  {
    slug: "junior",
    level: "junior",
    title: L("Junior Python Developer", "Python Developer Junior", "ジュニア Python 開発者"),
    description: L(
      "Online skills test for a junior Python role: values, numbers, strings, truthiness, collections, copies, functions.",
      "Test en línea para un puesto junior de Python: valores, números, strings, veracidad, colecciones, funciones.",
      "ジュニア Python 職のオンライン試験：値、数値、文字列、真偽値、コレクション、関数。",
    ),
    count: 12,
    passPct: 70,
    secondsPerQuestion: 30,
    questions: [
      // values
      {
        topic: "values", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("a = 1", "b = a", "a = 2", "print(a, b)"),
        options: ["2 1", "2 2", "1 1"], answer: 0,
        explain: L(
          "Names are labels. b = a sticks b on the object 1; a = 2 moves only the a label to a new object.",
          "Los nombres son etiquetas. b = a pega b al objeto 1; a = 2 mueve solo la etiqueta a a otro objeto.",
          "名前はラベル。b = a で b も 1 に貼られ、a = 2 は a のラベルだけを別の値に貼り替えるよ。",
        ),
        check: { compiles: true, stdout: "2 1" },
      },
      {
        topic: "values", difficulty: 1, kind: "predict", prompt: HAPPENS,
        code: 'print("3" + 3)',
        options: ["33", "6", "TypeError"], answer: 2,
        explain: L(
          "Python is strongly typed: it never mixes str and int silently. Convert first: int(\"3\") + 3 or \"3\" + str(3).",
          "Python es fuertemente tipado: no mezcla str e int en silencio. Convierte antes: int(\"3\") + 3 o \"3\" + str(3).",
          "Python は強い型付け。str と int を勝手に混ぜない。int(\"3\") + 3 か \"3\" + str(3) に変換しよう。",
        ),
        check: { compiles: true, throws: "TypeError" },
      },
      {
        topic: "values", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("x = 5", 'x = "five"', "print(type(x).__name__)"),
        options: ["int", "str", "TypeError"], answer: 1,
        explain: L(
          "Typing is dynamic: the type belongs to the object, not the name. x can label an int, then a str.",
          "El tipado es dinámico: el tipo es del objeto, no del nombre. x puede etiquetar un int y luego un str.",
          "動的型付けでは型は名前ではなく値が持つ。x は int のあと str に貼り替えられるよ。",
        ),
        check: { compiles: true, stdout: "str" },
      },
      // numbers_strings
      {
        topic: "numbers_strings", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: "print(7 / 2, 7 // 2, 7 % 2)",
        options: ["3.5 3 1", "3 3 1", "3.5 3.5 1"], answer: 0,
        explain: L(
          "/ always gives a float (3.5); // is floor division (3); % is the remainder (1).",
          "/ siempre da un float (3.5); // es división entera hacia abajo (3); % es el resto (1).",
          "/ は常に float（3.5）、// は切り捨て除算（3）、% は余り（1）だよ。",
        ),
        check: { compiles: true, stdout: "3.5 3 1" },
      },
      {
        topic: "numbers_strings", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code('s = "python"', "print(s[0], s[-1], s[1:4], s[::-1])"),
        options: ["p n yth nohtyp", "p n ytho nohtyp", "y n yth nohtyp"], answer: 0,
        explain: L(
          "Index 0 is the first char, -1 the last. s[1:4] stops BEFORE index 4. A step of -1 walks backwards.",
          "El índice 0 es el primero, -1 el último. s[1:4] para ANTES del índice 4. Un paso de -1 va al revés.",
          "0 は先頭、-1 は末尾。s[1:4] は 4 の手前で止まる。ステップ -1 で逆順になるよ。",
        ),
        check: { compiles: true, stdout: "p n yth nohtyp" },
      },
      {
        topic: "numbers_strings", difficulty: 1, kind: "type", prompt: L("Make it an f-string", "Conviértelo en f-string", "f 文字列にしよう"),
        code: code('name = "Ada"', 'print(___"Hi {name}")'),
        answer: "f",
        explain: L(
          "The f prefix makes an f-string: {name} is replaced by the value of name, so it prints Hi Ada.",
          "El prefijo f crea un f-string: {name} se reemplaza por el valor de name, así que imprime Hi Ada.",
          "先頭の f で f 文字列になり、{name} が name の値に置き換わる。Hi Ada と表示されるよ。",
        ),
        check: { compiles: true, stdout: "Hi Ada" },
      },
      // truthiness
      {
        topic: "truthiness", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: 'print(bool(0), bool(""), bool([]), bool("0"), bool([0]))',
        options: ["False False False True True", "False False False False False", "False True False True True"], answer: 0,
        explain: L(
          "Zero and empty containers are falsy. \"0\" is a non-empty string and [0] a non-empty list: both truthy.",
          "El cero y los contenedores vacíos son falsy. \"0\" es un string no vacío y [0] una lista no vacía: truthy.",
          "0 と空のコンテナは偽。\"0\" は空でない文字列、[0] は空でないリストなのでどちらも真だよ。",
        ),
        check: { compiles: true, stdout: "False False False True True" },
      },
      {
        topic: "truthiness", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("a = [1, 2]", "b = [1, 2]", "print(a == b, a is b)"),
        options: ["True True", "True False", "False False"], answer: 1,
        explain: L(
          "== compares values; is checks if both names are the SAME object. Two list literals make two objects.",
          "== compara valores; is mira si ambos nombres son el MISMO objeto. Dos listas literales son dos objetos.",
          "== は値を比べ、is は同じオブジェクトかを調べる。リストを2回書けば別々のオブジェクトだよ。",
        ),
        check: { compiles: true, stdout: "True False" },
      },
      {
        topic: "truthiness", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'print(0 or "guest", 3 and 5)',
        options: ["guest 5", "True True", "0 3"], answer: 0,
        explain: L(
          "and/or return one of the operands, not a bool. or gives the first truthy one; and gives the last if all are truthy.",
          "and/or devuelven un operando, no un bool. or da el primero truthy; and da el último si todos son truthy.",
          "and/or は bool ではなくオペランドを返す。or は最初の真の値、and は全部真なら最後の値だよ。",
        ),
        check: { compiles: true, stdout: "guest 5" },
      },
      // collections_basics
      {
        topic: "collections_basics", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("t = (5)", "u = (5,)", "print(type(t).__name__, type(u).__name__)"),
        options: ["tuple tuple", "int tuple", "int int"], answer: 1,
        explain: L(
          "Parentheses alone just group: (5) is the int 5. The comma makes a tuple, so a one-item tuple is (5,).",
          "Los paréntesis solos agrupan: (5) es el int 5. La coma crea la tupla, así que una de un elemento es (5,).",
          "かっこだけではただのグループで (5) は int。タプルを作るのはカンマなので、要素1つなら (5,) だよ。",
        ),
        check: { compiles: true, stdout: "int tuple" },
      },
      {
        topic: "collections_basics", difficulty: 1, kind: "predict", prompt: HAPPENS,
        code: code('hero = {"name": "Ada"}', 'print(hero["mp"])'),
        options: ["None", "KeyError", "mp"], answer: 1,
        explain: L(
          "Reading a missing key with [] raises KeyError. Use hero.get(\"mp\") to get None (or a default) instead.",
          "Leer una clave que no existe con [] lanza KeyError. Usa hero.get(\"mp\") para obtener None (o un default).",
          "存在しないキーを [] で読むと KeyError。hero.get(\"mp\") なら None（または既定値）が返るよ。",
        ),
        check: { compiles: true, throws: "KeyError" },
      },
      {
        topic: "collections_basics", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("s = {3, 1, 2, 3, 1}", "print(len(s), sorted(s))"),
        options: ["5 [1, 1, 2, 3, 3]", "3 [1, 2, 3]", "3 [3, 1, 2]"], answer: 1,
        explain: L(
          "A set keeps each value once, so it has 3 items. Sets have no order; sorted() returns a sorted list.",
          "Un set guarda cada valor una vez, así que tiene 3. Los sets no tienen orden; sorted() da una lista ordenada.",
          "set は同じ値を1つしか持たないので要素は3つ。set に順序はなく、sorted() が並べたリストを返すよ。",
        ),
        check: { compiles: true, stdout: "3 [1, 2, 3]" },
      },
      {
        topic: "collections_basics", difficulty: 2, kind: "type", prompt: L("Read mp, or 0 if it's missing", "Lee mp, o 0 si no existe", "mp を読む。なければ 0"),
        code: code('hero = {"name": "Ada"}', 'print(hero.___("mp", 0))'),
        answer: "get",
        explain: L(
          "dict.get(key, default) returns the default when the key is missing, instead of raising KeyError.",
          "dict.get(clave, default) devuelve el default si la clave no existe, en vez de lanzar KeyError.",
          "dict.get(キー, 既定値) はキーがないと KeyError ではなく既定値を返すよ。",
        ),
        check: { compiles: true, stdout: "0" },
      },
      // mutability
      {
        topic: "mutability", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("a = [1, 2]", "b = a", "b.append(3)", "print(a)"),
        options: ["[1, 2]", "[1, 2, 3]", "[3]"], answer: 1,
        explain: L(
          "b = a doesn't copy: both names label the same list. Changing it through b is visible through a.",
          "b = a no copia: ambos nombres etiquetan la misma lista. Cambiarla por b se ve también por a.",
          "b = a はコピーしない。2つの名前が同じリストを指すので、b で変えると a からも見えるよ。",
        ),
        check: { compiles: true, stdout: "[1, 2, 3]" },
      },
      {
        topic: "mutability", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("a = [1, 2]", "b = a[:]", "b.append(3)", "print(a, b)"),
        options: ["[1, 2, 3] [1, 2, 3]", "[1, 2] [1, 2, 3]", "[1, 2] [1, 2]"], answer: 1,
        explain: L(
          "a[:] slices the whole list into a NEW list, so appending to b leaves a alone. list(a) and a.copy() work too.",
          "a[:] copia toda la lista en una lista NUEVA, así que agregar a b no toca a. list(a) y a.copy() también sirven.",
          "a[:] はリスト全体を新しいリストにコピーするので b に追加しても a は変わらない。list(a) や a.copy() も同じ。",
        ),
        check: { compiles: true, stdout: "[1, 2] [1, 2, 3]" },
      },
      {
        topic: "mutability", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("t = (1, 2)", "t[0] = 9", "print(t)"),
        options: ["(9, 2)", "TypeError", "IndexError"], answer: 1,
        explain: L(
          "Tuples are immutable: item assignment raises TypeError. Build a new tuple instead, like (9,) + t[1:].",
          "Las tuplas son inmutables: asignar un elemento lanza TypeError. Crea una nueva, como (9,) + t[1:].",
          "タプルは変更不可なので要素の代入は TypeError。(9,) + t[1:] のように新しく作ろう。",
        ),
        check: { compiles: true, throws: "TypeError" },
      },
      // comprehensions
      {
        topic: "comprehensions", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: "print([n for n in range(10) if n % 3 == 0])",
        options: ["[0, 3, 6, 9]", "[3, 6, 9]", "[0, 3, 6, 9, 12]"], answer: 0,
        explain: L(
          "range(10) is 0 to 9; the if keeps numbers divisible by 3. 0 % 3 is 0, so 0 is included.",
          "range(10) va de 0 a 9; el if conserva los divisibles entre 3. 0 % 3 es 0, así que 0 entra.",
          "range(10) は 0〜9。if で 3 で割り切れる数だけ残す。0 % 3 は 0 なので 0 も入るよ。",
        ),
        check: { compiles: true, stdout: "[0, 3, 6, 9]" },
      },
      {
        topic: "comprehensions", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code('words = ["kiwi", "fig", "banana"]', "print(sorted(words, key=len))"),
        options: ["['banana', 'fig', 'kiwi']", "['fig', 'kiwi', 'banana']", "[3, 4, 6]"], answer: 1,
        explain: L(
          "key=len sorts by each word's length (3, 4, 6) but returns the words themselves, in a new list.",
          "key=len ordena por la longitud de cada palabra (3, 4, 6) pero devuelve las palabras, en una lista nueva.",
          "key=len は長さ（3, 4, 6）で並べるが、返すのは単語そのもの。新しいリストになるよ。",
        ),
        check: { compiles: true, stdout: "['fig', 'kiwi', 'banana']" },
      },
      // functions
      {
        topic: "functions", difficulty: 1, kind: "predict", prompt: LINES,
        code: code("def f():", '    print("hi")', "r = f()", "print(r)"),
        options: ["hi None", "hi hi", "None"], answer: 0,
        explain: L(
          "Calling f prints hi. A function without return gives back None, so r is None.",
          "Llamar a f imprime hi. Una función sin return devuelve None, así que r es None.",
          "f を呼ぶと hi が表示される。return のない関数は None を返すので r は None だよ。",
        ),
        check: { compiles: true, stdout: "hi\nNone" },
      },
      {
        topic: "functions", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code('def greet(name, greeting="Hi"):', '    return f"{greeting}, {name}"', 'print(greet("Bo", greeting="Yo"))'),
        options: ["Yo, Bo", "Hi, Bo", "Bo, Yo"], answer: 0,
        explain: L(
          "greeting has a default, but passing greeting=\"Yo\" by keyword overrides it. name gets \"Bo\" by position.",
          "greeting tiene un default, pero pasar greeting=\"Yo\" por nombre lo reemplaza. name recibe \"Bo\" por posición.",
          "greeting には既定値があるが、キーワードで greeting=\"Yo\" を渡すと上書きされる。name は位置で \"Bo\"。",
        ),
        check: { compiles: true, stdout: "Yo, Bo" },
      },
      // exceptions
      {
        topic: "exceptions", difficulty: 1, kind: "predict", prompt: LINES,
        code: code("try:", '    x = int("7")', "except ValueError:", '    print("bad")', "else:", '    print("ok", x)', "finally:", '    print("done")'),
        options: ["ok 7 done", "bad done", "ok 7"], answer: 0,
        explain: L(
          "No exception, so except is skipped and else runs. finally ALWAYS runs at the end.",
          "No hay excepción, así que except se salta y corre else. finally SIEMPRE corre al final.",
          "例外が起きないので except は飛ばされ else が動く。finally は最後に必ず動くよ。",
        ),
        check: { compiles: true, stdout: "ok 7\ndone" },
      },
      {
        topic: "exceptions", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("try:", "    print(10 / 0)", "except ValueError:", '    print("value")'),
        options: ["value", "ZeroDivisionError", L("Nothing", "Nada", "何も起きない")], answer: 1,
        explain: L(
          "10 / 0 raises ZeroDivisionError, which is not a ValueError, so the except doesn't catch it and it escapes.",
          "10 / 0 lanza ZeroDivisionError, que no es ValueError, así que el except no lo atrapa y se escapa.",
          "10 / 0 は ZeroDivisionError。ValueError ではないので except で捕まらず外に出るよ。",
        ),
        check: { compiles: true, throws: "ZeroDivisionError" },
      },
    ],
  },

  // ─── MID ──────────────────────────────────────────────────────────────────
  {
    slug: "mid",
    level: "mid",
    title: L("Mid-level Python Developer", "Python Developer Semi-Senior", "中級 Python 開発者"),
    description: L(
      "Code-reading screen for a mid-level Python role: defaults, closures, decorators, classes, generators, stdlib.",
      "Prueba de lectura de código semi-senior: defaults, closures, decoradores, clases, generadores, stdlib.",
      "中級 Python 職のコード読解試験：デフォルト引数、クロージャ、デコレータ、クラス、ジェネレータ。",
    ),
    count: 14,
    passPct: 70,
    secondsPerQuestion: 40,
    questions: [
      // mutability
      {
        topic: "mutability", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("grid = [[0] * 2] * 2", "grid[0][0] = 9", "print(grid)"),
        options: ["[[9, 0], [0, 0]]", "[[9, 0], [9, 0]]", "[[9, 9], [9, 9]]"], answer: 1,
        explain: L(
          "* 2 on the outer list repeats the SAME inner list twice. Build rows with [[0] * 2 for _ in range(2)].",
          "* 2 sobre la lista externa repite la MISMA lista interna dos veces. Usa [[0] * 2 for _ in range(2)].",
          "外側の * 2 は同じ内側リストを2回並べるだけ。行は [[0] * 2 for _ in range(2)] で作ろう。",
        ),
        check: { compiles: true, stdout: "[[9, 0], [9, 0]]" },
      },
      {
        topic: "mutability", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code("import copy", "a = [[1], [2]]", "b = copy.copy(a)", "b[0].append(9)", "b.append([3])", "print(a)"),
        options: ["[[1], [2]]", "[[1, 9], [2]]", "[[1, 9], [2], [3]]"], answer: 1,
        explain: L(
          "copy.copy is shallow: b is a new outer list, but the inner lists are shared. Use copy.deepcopy to copy them too.",
          "copy.copy es superficial: b es una lista externa nueva, pero las internas se comparten. copy.deepcopy las copia.",
          "copy.copy は浅いコピー。外側は新しいが内側のリストは共有される。中まで複製するなら copy.deepcopy。",
        ),
        check: { compiles: true, stdout: "[[1, 9], [2]]" },
      },
      // functions
      {
        topic: "functions", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("def add_item(item, bag=[]):", "    bag.append(item)", "    return bag", 'add_item("gem")', 'print(add_item("key"))'),
        options: ["['key']", "['gem', 'key']", "['gem']"], answer: 1,
        explain: L(
          "Defaults are evaluated ONCE, when def runs, so every call shares one list. Use bag=None and create it inside.",
          "Los defaults se evalúan UNA vez, al ejecutar def, así que todas las llamadas comparten la lista. Usa bag=None.",
          "デフォルト値は def の実行時に1回だけ評価され、全呼び出しで同じリストを共有する。bag=None にしよう。",
        ),
        check: { compiles: true, stdout: "['gem', 'key']" },
      },
      {
        topic: "functions", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("def total(*args, **kwargs):", "    return args, kwargs", "print(total(1, 2, x=3))"),
        options: ["((1, 2), {'x': 3})", "([1, 2], {'x': 3})", "(1, 2, 3)"], answer: 0,
        explain: L(
          "*args collects extra positional arguments into a tuple; **kwargs collects keyword arguments into a dict.",
          "*args junta los argumentos posicionales extra en una tupla; **kwargs junta los nombrados en un dict.",
          "*args は余った位置引数をタプルに、**kwargs はキーワード引数を辞書に集めるよ。",
        ),
        check: { compiles: true, stdout: "((1, 2), {'x': 3})" },
      },
      {
        topic: "functions", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("def move(x, *, speed=1):", "    return x * speed", "print(move(2, 3))"),
        options: ["6", "2", "TypeError"], answer: 2,
        explain: L(
          "Parameters after a bare * are keyword-only. move(2, 3) passes too many positionals: call move(2, speed=3).",
          "Los parámetros tras un * solo son keyword-only. move(2, 3) pasa demasiados posicionales: usa move(2, speed=3).",
          "単独の * の後ろはキーワード専用引数。move(2, 3) は位置引数が多すぎる。move(2, speed=3) と呼ぼう。",
        ),
        check: { compiles: true, throws: "TypeError" },
      },
      // scope_closures
      {
        topic: "scope_closures", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("fns = [lambda: i for i in range(3)]", "print([f() for f in fns])"),
        options: ["[0, 1, 2]", "[2, 2, 2]", "[3, 3, 3]"], answer: 1,
        explain: L(
          "Closures look up i when CALLED (late binding). By then the loop ended with i = 2. Fix: lambda i=i: i.",
          "Los closures buscan i al LLAMARSE (late binding). Para entonces el bucle terminó con i = 2. Arreglo: lambda i=i: i.",
          "クロージャは呼ばれた時に i を探す（遅延束縛）。その時ループは i = 2 で終わっている。lambda i=i: i で直る。",
        ),
        check: { compiles: true, stdout: "[2, 2, 2]" },
      },
      {
        topic: "scope_closures", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("count = 0", "def inc():", "    count += 1", "inc()"),
        options: [L("count becomes 1", "count pasa a 1", "count が 1 になる"), "UnboundLocalError", "SyntaxError"], answer: 1,
        explain: L(
          "Assigning count inside inc makes it local for the whole function, so += reads it before it exists. Use global.",
          "Asignar count dentro de inc lo vuelve local en toda la función, y += lo lee antes de existir. Usa global.",
          "関数内で count に代入すると関数全体でローカル扱いになり、+= が未定義の値を読む。global を使おう。",
        ),
        check: { compiles: true, throws: "UnboundLocalError" },
      },
      {
        topic: "scope_closures", difficulty: 3, kind: "type", prompt: L("Let step change the outer n", "Que step cambie la n externa", "step から外側の n を変えよう"),
        code: code("def counter():", "    n = 0", "    def step():", "        ___ n", "        n += 1", "        return n", "    return step", "c = counter()", "c()", "print(c())"),
        answer: "nonlocal",
        explain: L(
          "nonlocal binds n to the enclosing function's variable, so the closure keeps and updates its own counter.",
          "nonlocal liga n a la variable de la función que la contiene, así el closure guarda y actualiza su contador.",
          "nonlocal で n を外側の関数の変数に結びつける。クロージャが自分のカウンターを保持して更新できるよ。",
        ),
        check: { compiles: true, stdout: "2" },
      },
      // decorators
      {
        topic: "decorators", difficulty: 1, kind: "predict", prompt: LINES,
        code: code("def shout(fn):", "    def wrapper():", '        print("before")', "        fn()", '        print("after")', "    return wrapper", "@shout", "def hi():", '    print("hi")', "hi()"),
        options: ["before hi after", "hi before after", "hi"], answer: 0,
        explain: L(
          "@shout replaces hi with wrapper. Calling hi() runs wrapper: before, then the original hi, then after.",
          "@shout reemplaza hi por wrapper. Llamar a hi() ejecuta wrapper: before, luego el hi original y luego after.",
          "@shout は hi を wrapper に置き換える。hi() で wrapper が動き、before、元の hi、after の順だよ。",
        ),
        check: { compiles: true, stdout: "before\nhi\nafter" },
      },
      {
        topic: "decorators", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("def log(fn):", "    def wrapper(*args):", "        return fn(*args)", "    return wrapper", "@log", "def hello():", "    pass", "print(hello.__name__)"),
        options: ["hello", "wrapper", "log"], answer: 1,
        explain: L(
          "hello now IS wrapper, so its metadata is wrapper's. Decorate wrapper with @functools.wraps(fn) to keep it.",
          "hello ahora ES wrapper, así que sus metadatos son los de wrapper. Usa @functools.wraps(fn) para conservarlos.",
          "hello の正体は wrapper なので名前も wrapper。元の情報を残すには @functools.wraps(fn) を付けよう。",
        ),
        check: { compiles: true, stdout: "wrapper" },
      },
      {
        topic: "decorators", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code("def a(fn):", '    return lambda: "a(" + fn() + ")"', "def b(fn):", '    return lambda: "b(" + fn() + ")"', "@a", "@b", "def f():", '    return "f"', "print(f())"),
        options: ["a(b(f))", "b(a(f))", "f"], answer: 0,
        explain: L(
          "Stacked decorators apply bottom-up: f = a(b(f)). The outermost, a, runs first and wraps everything.",
          "Los decoradores apilados se aplican de abajo hacia arriba: f = a(b(f)). El más externo, a, envuelve todo.",
          "重ねたデコレータは下から適用され f = a(b(f)) になる。一番外側の a が全体を包むよ。",
        ),
        check: { compiles: true, stdout: "a(b(f))" },
      },
      // exceptions
      {
        topic: "exceptions", difficulty: 2, kind: "predict", prompt: LINES,
        code: code("def f():", "    try:", '        return "try"', "    finally:", '        print("finally")', "print(f())"),
        options: ["finally try", "try finally", "try"], answer: 0,
        explain: L(
          "finally runs even when try returns: it prints first, then the returned value reaches print.",
          "finally corre aunque try haga return: imprime primero y luego el valor devuelto llega a print.",
          "try で return しても finally は動く。先に finally が表示され、その後に戻り値が print されるよ。",
        ),
        check: { compiles: true, stdout: "finally\ntry" },
      },
      {
        topic: "exceptions", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("class GameError(Exception):", "    pass", "class NoMana(GameError):", "    pass", "try:", "    raise NoMana()", "except GameError:", '    print("caught")'),
        options: ["caught", "NoMana", L("Nothing", "Nada", "何も表示されない")], answer: 0,
        explain: L(
          "except catches the named class AND its subclasses. A base class per app lets callers catch all its errors.",
          "except atrapa la clase nombrada Y sus subclases. Una clase base por app permite atrapar todos sus errores.",
          "except は指定したクラスとそのサブクラスを捕まえる。アプリ共通の基底例外を作ると一括で扱えるよ。",
        ),
        check: { compiles: true, stdout: "caught" },
      },
      // classes
      {
        topic: "classes", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("class Hero:", "    team = []", "    def __init__(self, name):", "        self.team.append(name)", 'a = Hero("Ada")', 'b = Hero("Bo")', "print(a.team, a.team is b.team)"),
        options: ["['Ada'] False", "['Ada', 'Bo'] True", "['Ada', 'Bo'] False"], answer: 1,
        explain: L(
          "team is a CLASS attribute: one list shared by every instance. Create per-instance data in __init__.",
          "team es un atributo de CLASE: una lista compartida por todas las instancias. Crea datos propios en __init__.",
          "team はクラス属性で、全インスタンスが1つのリストを共有する。個別のデータは __init__ で作ろう。",
        ),
        check: { compiles: true, stdout: "['Ada', 'Bo'] True" },
      },
      {
        topic: "classes", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("class Hero:", "    def __init__(self):", "        self._hp = 10", "    @property", "    def hp(self):", "        return self._hp", "    @hp.setter", "    def hp(self, value):", "        self._hp = max(0, value)", "h = Hero()", "h.hp = -3", "print(h.hp)"),
        options: ["-3", "0", "10"], answer: 1,
        explain: L(
          "h.hp = -3 calls the property setter, which clamps with max(0, value). Properties validate on assignment.",
          "h.hp = -3 llama al setter de la propiedad, que limita con max(0, value). Las propiedades validan al asignar.",
          "h.hp = -3 でプロパティのセッターが呼ばれ max(0, value) で 0 に。代入時に検証できるよ。",
        ),
        check: { compiles: true, stdout: "0" },
      },
      {
        topic: "classes", difficulty: 1, kind: "type", prompt: L("Make len() work on Bag", "Haz que len() funcione con Bag", "Bag で len() を使えるように"),
        code: code("class Bag:", "    def __init__(self, items):", "        self.items = items", "    def ___(self):", "        return len(self.items)", "print(len(Bag([1, 2, 3])))"),
        answer: "__len__",
        explain: L(
          "len(obj) calls obj.__len__(). Dunder methods plug your classes into built-ins and operators.",
          "len(obj) llama a obj.__len__(). Los métodos dunder conectan tus clases con funciones y operadores nativos.",
          "len(obj) は obj.__len__() を呼ぶ。特殊メソッドで組み込み関数や演算子に対応できるよ。",
        ),
        check: { compiles: true, stdout: "3" },
      },
      // inheritance
      {
        topic: "inheritance", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("class Unit:", "    def __init__(self):", "        self.hp = 10", "class Mage(Unit):", "    def __init__(self):", "        self.mp = 5", "print(Mage().hp)"),
        options: ["10", "AttributeError", "None"], answer: 1,
        explain: L(
          "Mage.__init__ overrides Unit.__init__, which never runs, so hp is never set. Call super().__init__() first.",
          "Mage.__init__ reemplaza a Unit.__init__, que nunca corre, así que hp no existe. Llama super().__init__() primero.",
          "Mage.__init__ が Unit.__init__ を上書きし、hp が作られない。最初に super().__init__() を呼ぼう。",
        ),
        check: { compiles: true, throws: "AttributeError" },
      },
      {
        topic: "inheritance", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("from dataclasses import dataclass", "@dataclass", "class Point:", "    x: int", "    y: int = 0", "print(Point(1), Point(1) == Point(1, 0))"),
        options: ["Point(x=1, y=0) True", "Point(x=1, y=0) False", "Point(1) True"], answer: 0,
        explain: L(
          "@dataclass writes __init__, a readable __repr__ and a field-by-field __eq__ for you.",
          "@dataclass escribe por ti __init__, un __repr__ legible y un __eq__ que compara campo por campo.",
          "@dataclass は __init__、読みやすい __repr__、フィールドごとに比べる __eq__ を自動で作るよ。",
        ),
        check: { compiles: true, stdout: "Point(x=1, y=0) True" },
      },
      // generators
      {
        topic: "generators", difficulty: 1, kind: "type", prompt: L("Make countdown a generator", "Haz de countdown un generador", "countdown をジェネレータに"),
        code: code("def countdown(n):", "    while n > 0:", "        ___ n", "        n -= 1", "print(list(countdown(3)))"),
        answer: "yield",
        explain: L(
          "yield hands out one value and pauses the function until the next one is asked for. list() pulls them all.",
          "yield entrega un valor y pausa la función hasta que se pida el siguiente. list() los saca todos.",
          "yield は値を1つ渡して次を求められるまで一時停止する。list() で全部取り出せるよ。",
        ),
        check: { compiles: true, stdout: "[3, 2, 1]" },
      },
      {
        topic: "generators", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("g = (n * 2 for n in range(3))", "print(sum(g), sum(g))"),
        options: ["6 6", "6 0", "0 6"], answer: 1,
        explain: L(
          "A generator can be consumed only once. The first sum exhausts it; the second sees nothing and gives 0.",
          "Un generador se consume una sola vez. El primer sum lo agota; el segundo no ve nada y da 0.",
          "ジェネレータは1回しか使えない。最初の sum で使い切り、2回目は空なので 0 になるよ。",
        ),
        check: { compiles: true, stdout: "6 0" },
      },
      {
        topic: "generators", difficulty: 3, kind: "predict", prompt: LINES,
        code: code("class Lamp:", "    def __enter__(self):", "        return self", "    def __exit__(self, exc_type, exc, tb):", '        print("off", exc_type.__name__)', "        return True", "with Lamp():", "    1 / 0", 'print("after")'),
        options: ["off ZeroDivisionError after", "off ZeroDivisionError", "ZeroDivisionError"], answer: 0,
        explain: L(
          "__exit__ always runs and receives the exception. Returning True suppresses it, so the program goes on.",
          "__exit__ siempre corre y recibe la excepción. Devolver True la suprime, así que el programa sigue.",
          "__exit__ は必ず動き、例外を受け取る。True を返すと例外は握りつぶされ、処理が続くよ。",
        ),
        check: { compiles: true, stdout: "off ZeroDivisionError\nafter" },
      },
      // stdlib
      {
        topic: "stdlib", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("from collections import Counter", 'c = Counter("banana")', 'print(c.most_common(2), c["z"])'),
        options: ["[('a', 3), ('n', 2)] 0", "[('b', 1), ('a', 3)] 0", "[('a', 3), ('n', 2)] KeyError"], answer: 0,
        explain: L(
          "Counter counts items; most_common(n) gives the top n. A missing key counts as 0 instead of raising.",
          "Counter cuenta elementos; most_common(n) da los n más comunes. Una clave ausente vale 0 en vez de fallar.",
          "Counter は数を数え、most_common(n) で上位 n 個を返す。ないキーはエラーでなく 0 になるよ。",
        ),
        check: { compiles: true, stdout: "[('a', 3), ('n', 2)] 0" },
      },
      {
        topic: "stdlib", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("from collections import defaultdict", "groups = defaultdict(list)", 'for w in ["ant", "bee", "ape"]:', "    groups[w[0]].append(w)", "print(dict(groups))"),
        options: ["{'a': ['ant', 'ape'], 'b': ['bee']}", "{'a': ['ape'], 'b': ['bee']}", "KeyError"], answer: 0,
        explain: L(
          "defaultdict(list) creates an empty list the first time a key is used, so grouping needs no key checks.",
          "defaultdict(list) crea una lista vacía la primera vez que se usa una clave, así no hay que revisar claves.",
          "defaultdict(list) は初めて使うキーに空リストを作るので、キーの有無を確かめずにグループ化できるよ。",
        ),
        check: { compiles: true, stdout: "{'a': ['ant', 'ape'], 'b': ['bee']}" },
      },
      // typing
      {
        topic: "typing", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("def heal(hp: int) -> int:", "    return hp * 2", 'print(heal("ab"))'),
        options: ["abab", "TypeError", "4"], answer: 0,
        explain: L(
          "Type hints are not enforced at runtime: \"ab\" * 2 is \"abab\". A checker like mypy would flag it.",
          "Los type hints no se aplican al ejecutar: \"ab\" * 2 es \"abab\". Un verificador como mypy lo marcaría.",
          "型ヒントは実行時に強制されない。\"ab\" * 2 は \"abab\"。mypy などの型チェッカーなら警告するよ。",
        ),
        check: { compiles: true, stdout: "abab" },
      },
    ],
  },

  // ─── SENIOR ───────────────────────────────────────────────────────────────
  {
    slug: "senior",
    level: "senior",
    title: L("Senior Python Developer", "Python Developer Senior", "シニア Python 開発者"),
    description: L(
      "Senior screen: MRO, descriptors, metaclasses, generators, asyncio, the GIL, typing and modern syntax.",
      "Entrevista senior: MRO, descriptores, metaclases, generadores, asyncio, el GIL, typing y sintaxis moderna.",
      "シニア向け面接：MRO、ディスクリプタ、メタクラス、asyncio、GIL、型、モダン構文。",
    ),
    count: 15,
    passPct: 75,
    secondsPerQuestion: 50,
    questions: [
      // inheritance
      {
        topic: "inheritance", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code("class A:", '    def who(self): return "A"', "class B(A):", '    def who(self): return "B" + super().who()', "class C(A):", '    def who(self): return "C" + super().who()', "class D(B, C):", '    def who(self): return "D" + super().who()', "print(D().who())"),
        options: ["DBA", "DBCA", "DBACA"], answer: 1,
        explain: L(
          "super() follows the MRO (D, B, C, A, object), not the parent. B's super() is C, so each class runs once.",
          "super() sigue el MRO (D, B, C, A, object), no al padre. El super() de B es C, así cada clase corre una vez.",
          "super() は親ではなく MRO（D, B, C, A, object）の次へ進む。B の次は C なので各クラスが1回ずつ動くよ。",
        ),
        check: { compiles: true, stdout: "DBCA" },
      },
      {
        topic: "inheritance", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("class X: pass", "class Y(X): pass", "class Z(X, Y): pass"),
        options: [L("Z is defined", "Se define Z", "Z が定義される"), "TypeError", "AttributeError"], answer: 1,
        explain: L(
          "C3 linearization can't order X before Y while Y must come before its base X: no consistent MRO, TypeError.",
          "La linealización C3 no puede poner X antes de Y si Y debe ir antes de su base X: sin MRO coherente, TypeError.",
          "C3 線形化では X を Y より前に置けない（Y は基底 X より前のはず）。MRO が作れず TypeError。",
        ),
        check: { compiles: true, throws: "TypeError" },
      },
      // object_model
      {
        topic: "object_model", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code("class Positive:", "    def __set_name__(self, owner, name):", '        self.name = "_" + name', "    def __get__(self, obj, objtype=None):", "        return getattr(obj, self.name)", "    def __set__(self, obj, value):", "        if value < 0:", '            raise ValueError("negative")', "        setattr(obj, self.name, value)", "class Hero:", "    hp = Positive()", "Hero().hp = -1"),
        options: [L("Nothing: hp is -1", "Nada: hp vale -1", "何も起きない（hp は -1）"), "ValueError", "AttributeError"], answer: 1,
        explain: L(
          "A class attribute with __set__ is a data descriptor: assigning h.hp calls Positive.__set__, which validates.",
          "Un atributo de clase con __set__ es un descriptor de datos: asignar h.hp llama a Positive.__set__, que valida.",
          "__set__ を持つクラス属性はデータディスクリプタ。hp への代入で Positive.__set__ が呼ばれ検証されるよ。",
        ),
        check: { compiles: true, throws: "ValueError" },
      },
      {
        topic: "object_model", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("registry = []", "class Plugin:", "    def __init_subclass__(cls):", "        registry.append(cls.__name__)", "class A(Plugin): pass", "class B(Plugin): pass", "print(registry)"),
        options: ["[]", "['A', 'B']", "['Plugin', 'A', 'B']"], answer: 1,
        explain: L(
          "__init_subclass__ runs on the parent each time a subclass is defined, not for the parent itself: a cheap registry.",
          "__init_subclass__ corre en el padre cada vez que se define una subclase, no para el padre: un registro barato.",
          "__init_subclass__ はサブクラスが定義されるたびに呼ばれ、親自身では呼ばれない。手軽な登録の仕組みだよ。",
        ),
        check: { compiles: true, stdout: "['A', 'B']" },
      },
      {
        topic: "object_model", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code("class Meta(type):", "    def __new__(mcs, name, bases, ns):", "        ns[\"tag\"] = name.lower()", "        return super().__new__(mcs, name, bases, ns)", "class Hero(metaclass=Meta):", "    pass", "print(Hero.tag, type(Hero).__name__, type(type).__name__)"),
        options: ["hero Meta type", "Hero type type", "hero type Meta"], answer: 0,
        explain: L(
          "A metaclass builds the class: Meta.__new__ adds tag. Hero's type is Meta, and type is its own metaclass.",
          "Una metaclase construye la clase: Meta.__new__ agrega tag. El tipo de Hero es Meta, y type es su propia metaclase.",
          "メタクラスがクラスを作る。Meta.__new__ が tag を追加。Hero の型は Meta、type の型は type 自身だよ。",
        ),
        check: { compiles: true, stdout: "hero Meta type" },
      },
      {
        topic: "object_model", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code("class Gem:", "    def __init__(self, v):", "        self.v = v", "    def __eq__(self, other):", "        return self.v == other.v", "s = {Gem(1)}"),
        options: [L("A set with one Gem", "Un set con un Gem", "Gem が1つの set"), "TypeError", "AttributeError"], answer: 1,
        explain: L(
          "Defining __eq__ without __hash__ sets __hash__ to None, so instances are unhashable. Define both together.",
          "Definir __eq__ sin __hash__ pone __hash__ en None, así que las instancias no son hashables. Define ambos.",
          "__hash__ なしで __eq__ を定義すると __hash__ が None になり、ハッシュ不可に。両方を定義しよう。",
        ),
        check: { compiles: true, throws: "TypeError" },
      },
      // generators
      {
        topic: "generators", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("def inner():", "    yield 1", "    yield 2", "def outer():", "    yield 0", "    yield from inner()", "    yield 3", "print(list(outer()))"),
        options: ["[0, 1, 2, 3]", "[0, <generator>, 3]", "[0, 3]"], answer: 0,
        explain: L(
          "yield from delegates to another iterable, yielding each of its values in place. Great for composing pipelines.",
          "yield from delega en otro iterable y entrega cada uno de sus valores en su lugar. Ideal para componer pipelines.",
          "yield from は別のイテラブルに委譲し、その値をその場で1つずつ渡す。パイプラインの組み立てに便利だよ。",
        ),
        check: { compiles: true, stdout: "[0, 1, 2, 3]" },
      },
      {
        topic: "generators", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code("def acc():", "    total = 0", "    while True:", "        x = yield total", "        total += x", "g = acc()", "next(g)", "g.send(5)", "print(g.send(10))"),
        options: ["10", "15", "5"], answer: 1,
        explain: L(
          "next(g) runs to the first yield. Each send(v) resumes with x = v and returns the next yielded total: 5, then 15.",
          "next(g) avanza hasta el primer yield. Cada send(v) sigue con x = v y devuelve el siguiente total: 5 y luego 15.",
          "next(g) で最初の yield まで進む。send(v) で x = v として再開し、次の total を返す。5、そして 15。",
        ),
        check: { compiles: true, stdout: "15" },
      },
      {
        topic: "generators", difficulty: 2, kind: "predict", prompt: LINES,
        code: code("def gen():", "    try:", "        yield 1", "    finally:", '        print("cleanup")', "g = gen()", "next(g)", "g.close()", 'print("closed")'),
        options: ["cleanup closed", "closed", "closed cleanup"], answer: 0,
        explain: L(
          "close() raises GeneratorExit at the paused yield, so the finally block runs before close() returns.",
          "close() lanza GeneratorExit en el yield pausado, así que el finally corre antes de que close() regrese.",
          "close() は停止中の yield で GeneratorExit を起こすので、close() が戻る前に finally が動くよ。",
        ),
        check: { compiles: true, stdout: "cleanup\nclosed" },
      },
      // async
      {
        topic: "async", difficulty: 2, kind: "predict", prompt: LINES,
        code: code("import asyncio", "async def say(word):", "    print(word)", "async def main():", '    t = asyncio.create_task(say("task"))', '    print("main")', "    await t", "asyncio.run(main())"),
        options: ["main task", "task main", "main"], answer: 0,
        explain: L(
          "create_task schedules the coroutine; it only runs when main yields control at await. So main prints first.",
          "create_task programa la corrutina; solo corre cuando main cede el control en await. Por eso main imprime primero.",
          "create_task は予約するだけ。main が await で制御を渡したときに動くので、main が先に表示されるよ。",
        ),
        check: { compiles: true, stdout: "main\ntask" },
      },
      {
        topic: "async", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("import asyncio", "async def fetch(name):", "    return name.upper()", "async def main():", '    result = fetch("ada")', "    print(type(result).__name__)", "    await result", "asyncio.run(main())"),
        options: ["str", "coroutine", "NoneType"], answer: 1,
        explain: L(
          "Calling an async def doesn't run it: it returns a coroutine object. Only await (or a task) runs it.",
          "Llamar a un async def no lo ejecuta: devuelve un objeto corrutina. Solo await (o una tarea) lo ejecuta.",
          "async def を呼んでも実行されず、コルーチンオブジェクトが返る。await（かタスク）で初めて動くよ。",
        ),
        check: { compiles: true, stdout: "coroutine" },
      },
      {
        topic: "async", difficulty: 3, kind: "predict", prompt: LINES,
        code: code("import asyncio", "async def job(name, delay):", "    await asyncio.sleep(delay)", "    print(name)", "    return name", "async def main():", '    print(await asyncio.gather(job("slow", 0.05), job("fast", 0.01)))', "asyncio.run(main())"),
        options: ["fast slow ['slow', 'fast']", "slow fast ['slow', 'fast']", "fast slow ['fast', 'slow']"], answer: 0,
        explain: L(
          "gather runs both concurrently, so fast finishes first. But its result list follows the argument order.",
          "gather corre ambas a la vez, así que fast termina primero. Pero la lista de resultados sigue el orden de argumentos.",
          "gather は同時に動かすので fast が先に終わる。ただし結果のリストは引数の順になるよ。",
        ),
        check: { compiles: true, stdout: "fast\nslow\n['slow', 'fast']" },
      },
      {
        topic: "async", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code("import asyncio", "async def ok():", "    return 1", "async def boom():", '    raise ValueError("x")', "async def main():", "    res = await asyncio.gather(ok(), boom(), return_exceptions=True)", "    print([type(r).__name__ for r in res])", "asyncio.run(main())"),
        options: ["['int', 'ValueError']", "['int']", "ValueError"], answer: 0,
        explain: L(
          "With return_exceptions=True, gather puts exceptions in the result list instead of raising the first one.",
          "Con return_exceptions=True, gather pone las excepciones en la lista de resultados en vez de lanzar la primera.",
          "return_exceptions=True なら gather は最初の例外を投げず、例外を結果のリストに入れるよ。",
        ),
        check: { compiles: true, stdout: "['int', 'ValueError']" },
      },
      // concurrency (concept: the browser runner has no threads)
      {
        topic: "concurrency", difficulty: 2, kind: "pick", prompt: L("CPU-bound work on 8 cores: pick the pool", "Trabajo de CPU en 8 núcleos: elige el pool", "8コアで CPU 処理：どのプール？"),
        code: code("# Resize 10,000 images (pure Python, CPU-bound)", "from concurrent.futures import ___"),
        options: ["ProcessPoolExecutor", "ThreadPoolExecutor"], answer: 0,
        explain: L(
          "In standard CPython the GIL lets one thread run Python bytecode at a time. Processes each have their own GIL.",
          "En CPython estándar el GIL deja correr bytecode Python a un hilo a la vez. Cada proceso tiene su propio GIL.",
          "標準の CPython では GIL により Python コードを動かせるのは同時に1スレッド。プロセスなら各自 GIL を持つよ。",
        ),
      },
      {
        topic: "concurrency", difficulty: 2, kind: "pick", prompt: L("Wait 1 s without freezing the event loop", "Espera 1 s sin congelar el event loop", "イベントループを止めずに1秒待つ"),
        code: code("import asyncio, time", "async def poll():", "    ___", '    return "tick"'),
        options: ["await asyncio.sleep(1)", "time.sleep(1)"], answer: 0,
        explain: L(
          "time.sleep blocks the whole thread, so every task stalls. Await asyncio.sleep, or offload with asyncio.to_thread.",
          "time.sleep bloquea todo el hilo y frena todas las tareas. Usa await asyncio.sleep, o delega con asyncio.to_thread.",
          "time.sleep はスレッドごと止め、全タスクが停止する。await asyncio.sleep か asyncio.to_thread を使おう。",
        ),
      },
      {
        topic: "concurrency", difficulty: 3, kind: "predict", prompt: L("Speedup vs one thread on standard CPython?", "¿Aceleración vs un hilo en CPython estándar?", "標準 CPython で1スレッドと比べた速さは？"),
        code: code("import threading", "def crunch():", "    sum(i * i for i in range(10**7))", "ts = [threading.Thread(target=crunch) for _ in range(2)]", "for t in ts: t.start()", "for t in ts: t.join()"),
        options: [L("About 2x faster", "Unas 2x más rápido", "約2倍速い"), L("About the same", "Más o menos igual", "ほぼ同じ"), L("It deadlocks", "Se bloquea (deadlock)", "デッドロックする")], answer: 1,
        explain: L(
          "Pure-Python CPU work holds the GIL, so threads take turns. Threads help I/O; free-threaded builds (PEP 703) differ.",
          "El trabajo de CPU en Python puro retiene el GIL y los hilos se turnan. Sirven para I/O; las builds sin GIL (PEP 703) cambian eso.",
          "純 Python の CPU 処理は GIL を握るので交代で動く。スレッドは I/O 向き。GIL なし版（PEP 703）は別。",
        ),
      },
      // decorators
      {
        topic: "decorators", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code("def repeat(n):", "    def deco(fn):", "        def wrapper():", "            for _ in range(n):", "                fn()", "        return wrapper", "    return deco", "@repeat(3)", "def ping():", '    print("ping", end=" ")', "ping()", "print()"),
        options: ["ping ping ping", "ping", "TypeError"], answer: 0,
        explain: L(
          "repeat(3) runs first and returns the real decorator, deco. That's why decorators with arguments nest 3 levels.",
          "repeat(3) corre primero y devuelve el decorador real, deco. Por eso los decoradores con argumentos tienen 3 niveles.",
          "まず repeat(3) が実行され本当のデコレータ deco を返す。引数付きデコレータが3段になる理由だよ。",
        ),
        check: { compiles: true, stdout: "ping ping ping" },
      },
      {
        topic: "decorators", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("from functools import lru_cache", "calls = 0", "@lru_cache", "def square(n):", "    global calls", "    calls += 1", "    return n * n", "square(4); square(4); square(5)", "print(calls, square.cache_info().hits)"),
        options: ["3 0", "2 1", "1 2"], answer: 1,
        explain: L(
          "lru_cache memoizes by arguments: the second square(4) is a cache hit, so the body runs only twice.",
          "lru_cache memoriza por argumentos: el segundo square(4) sale de la caché, así que el cuerpo corre solo dos veces.",
          "lru_cache は引数ごとに結果を覚える。2回目の square(4) はキャッシュから返り、本体は2回だけ動くよ。",
        ),
        check: { compiles: true, stdout: "2 1" },
      },
      // scope_closures
      {
        topic: "scope_closures", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code('x = "global"', "def outer():", '    x = "enclosing"', "    def inner():", "        return x", "    return inner", 'x = "changed"', "print(outer()())"),
        options: ["enclosing", "global", "changed"], answer: 0,
        explain: L(
          "LEGB: inner finds x in the Enclosing scope before the Global one, so the global rebinding doesn't matter.",
          "LEGB: inner encuentra x en el scope Enclosing antes que en el Global, así que reasignar la global no importa.",
          "LEGB の順に探すので、inner はグローバルより先に外側関数の x を見つける。グローバルの変更は関係ないよ。",
        ),
        check: { compiles: true, stdout: "enclosing" },
      },
      {
        topic: "scope_closures", difficulty: 3, kind: "pick", prompt: L("Capture each i, to print [0, 1, 2]", "Captura cada i para imprimir [0, 1, 2]", "各 i を捕まえて [0, 1, 2] に"),
        code: code("fns = [lambda ___: i for i in range(3)]", "print([f() for f in fns])"),
        options: ["i=i", "i", "x"], answer: 0,
        explain: L(
          "A default is evaluated when the lambda is created, so i=i freezes each value. Plain i or x make f() need an argument.",
          "Un default se evalúa al crear la lambda, así que i=i congela cada valor. Con i o x, f() exigiría un argumento.",
          "デフォルト値は lambda 作成時に評価されるので i=i で値が固定される。i や x だと f() に引数が必要になる。",
        ),
        check: { compiles: true, stdout: "[0, 1, 2]" },
      },
      // typing
      {
        topic: "typing", difficulty: 2, kind: "predict", prompt: L("Dog doesn't inherit Greeter. Result?", "Dog no hereda de Greeter. ¿Resultado?", "Dog は Greeter を継承しない。結果は？"),
        code: code("from typing import Protocol", "class Greeter(Protocol):", "    def greet(self) -> str: ...", "class Dog:", "    def greet(self) -> str:", '        return "woof"', "def hello(g: Greeter) -> None:", "    print(g.greet())", "hello(Dog())"),
        options: [L("Prints woof; checkers accept it", "Imprime woof; los checkers lo aceptan", "woof と表示、型チェックも OK"), L("TypeError at runtime", "TypeError al ejecutar", "実行時に TypeError"), L("Prints woof; checkers reject it", "Imprime woof; los checkers lo rechazan", "woof と表示、型チェックは NG")], answer: 0,
        explain: L(
          "Protocol is structural typing: any class with a matching greet() fits, no inheritance needed. Runtime ignores hints.",
          "Protocol es tipado estructural: cualquier clase con un greet() compatible sirve, sin herencia. Al ejecutar se ignoran.",
          "Protocol は構造的部分型。合う greet() があれば継承なしで適合する。実行時は型ヒントを無視するよ。",
        ),
        check: { compiles: true, stdout: "woof" },
      },
      {
        topic: "typing", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("from typing import TypedDict", "class User(TypedDict):", "    name: str", "    age: int", 'u: User = {"name": "Ada", "age": "old"}', 'print(u["age"], type(u).__name__)'),
        options: ["old dict", "TypeError", "old User"], answer: 0,
        explain: L(
          "A TypedDict is a plain dict at runtime; its types exist only for static checkers, which would flag \"old\".",
          "Un TypedDict es un dict normal al ejecutar; sus tipos solo existen para los checkers, que marcarían \"old\".",
          "TypedDict は実行時はただの dict。型は静的チェッカー用で、\"old\" はチェッカーが指摘するよ。",
        ),
        check: { compiles: true, stdout: "old dict" },
      },
      // stdlib
      {
        topic: "stdlib", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("import itertools", "print(list(itertools.accumulate([1, 2, 3])),", '      list(itertools.zip_longest("ab", "x", fillvalue="-")))'),
        options: ["[1, 3, 6] [('a', 'x'), ('b', '-')]", "[6] [('a', 'x')]", "[1, 3, 6] [('a', 'x')]"], answer: 0,
        explain: L(
          "accumulate yields running totals. zip_longest pads the shorter input with fillvalue; zip would stop early.",
          "accumulate entrega totales acumulados. zip_longest rellena la entrada corta con fillvalue; zip pararía antes.",
          "accumulate は累積和を返す。zip_longest は短い方を fillvalue で埋める。zip なら途中で止まるよ。",
        ),
        check: { compiles: true, stdout: "[1, 3, 6] [('a', 'x'), ('b', '-')]" },
      },
      {
        topic: "stdlib", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code("from itertools import groupby", 'data = ["a1", "b1", "a2"]', "print([k for k, _ in groupby(data, key=lambda s: s[0])])"),
        options: ["['a', 'b']", "['a', 'b', 'a']", "['a', 'a', 'b']"], answer: 1,
        explain: L(
          "groupby only groups CONSECUTIVE items with the same key. Sort by the same key first to get one group per key.",
          "groupby solo agrupa elementos CONSECUTIVOS con la misma clave. Ordena antes por esa clave para un grupo por clave.",
          "groupby は連続して同じキーの要素だけをまとめる。キーごとに1グループにするには先に同じキーでソートしよう。",
        ),
        check: { compiles: true, stdout: "['a', 'b', 'a']" },
      },
      // modules
      {
        topic: "modules", difficulty: 1, kind: "predict", prompt: L("Run as the main script. Output?", "Se ejecuta como script principal. ¿Salida?", "メインスクリプトとして実行。出力は？"),
        code: code('if __name__ == "__main__":', '    print("run directly")', "print(__name__)"),
        options: ["run directly __main__", "__main__", "main"], answer: 0,
        explain: L(
          "The script you run gets __name__ == \"__main__\"; an imported module gets its own name, so the guard skips.",
          "El script que ejecutas tiene __name__ == \"__main__\"; un módulo importado recibe su nombre y el guard no corre.",
          "直接実行したスクリプトの __name__ は \"__main__\"。import されたモジュールは自分の名前になり、ガードは動かない。",
        ),
        check: { compiles: true, stdout: "run directly\n__main__" },
      },
      // patterns
      {
        topic: "patterns", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code("def kind(cmd):", "    match cmd:", '        case {"action": "move", "dir": d}:', '            return f"move {d}"', "        case [x, y]:", '            return f"pair {x},{y}"', "        case _:", '            return "unknown"', 'print(kind({"action": "move", "dir": "n"}), kind((1, 2)), kind("hi"))'),
        options: ["move n pair 1,2 unknown", "move n pair 1,2 pair h,i", "move n unknown unknown"], answer: 0,
        explain: L(
          "Mapping patterns bind d; [x, y] matches any 2-item sequence, even a tuple. A str never matches a sequence pattern.",
          "El patrón de mapeo liga d; [x, y] calza con cualquier secuencia de 2, incluso una tupla. Un str nunca calza ahí.",
          "マッピングパターンが d を束縛。[x, y] はタプルを含む2要素のシーケンスに合う。str はシーケンスパターンに合わない。",
        ),
        check: { compiles: true, stdout: "move n pair 1,2 unknown" },
      },
    ],
  },
];
