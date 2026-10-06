import type { ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Written-test formats for planet Serpentia (Python): trace tables (dry-run the code, fill the
// values) and debugging tasks (tap the buggy line, then fix it). The validator runs every `verify`
// and proves each fix passes the tests while the buggy code and the near misses fail.

const code = (...lines: string[]) => lines.join("\n");

/** Junior trace: a running total through a loop. */
export const doubleAddTrace: ExamQuestion = {
  kind: "trace",
  topic: "numbers_strings",
  difficulty: 1,
  prompt: L("Trace table: a running total", "Tabla de traza: un total acumulado", "トレース：累計"),
  code: code(
    "total = 0",
    "for n in [3, 1, 4]:",
    "    total = total * 2 + n",
  ),
  columns: ["n", "total"],
  rows: [
    { label: L("pass 1", "vuelta 1", "1周目"), cells: ["3", "3"], given: [0] },
    { label: L("pass 2", "vuelta 2", "2周目"), cells: ["1", "7"] },
    { label: L("pass 3", "vuelta 3", "3周目"), cells: ["4", "18"] },
  ],
  verify: code(
    "total = 0",
    "for n in [3, 1, 4]:",
    "    total = total * 2 + n",
    '    print(f"{n} | {total}")',
  ),
  explain: L(
    "Each pass doubles the old total, then adds n: 0*2+3 = 3, 3*2+1 = 7, 7*2+4 = 18.",
    "Cada vuelta duplica el total anterior y suma n: 0*2+3 = 3, 3*2+1 = 7, 7*2+4 = 18.",
    "毎周、前の total を2倍して n を足す：0*2+3=3、3*2+1=7、7*2+4=18。",
  ),
};

/** Mid debug: a counter one indentation level too far out. */
export const averagePositiveDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "functions",
  difficulty: 2,
  prompt: L("Debug: the average of the positives", "Depura: el promedio de los positivos", "デバッグ：正の数の平均"),
  brief: L(
    "average_positive(nums) should average only the positive numbers, and return 0 when there are none. But average_positive([2, -1, 4]) returns 2.0 instead of 3.0.",
    "average_positive(nums) debería promediar solo los números positivos y devolver 0 si no hay ninguno. Pero average_positive([2, -1, 4]) devuelve 2.0 en vez de 3.0.",
    "average_positive(nums) は正の数だけの平均を返し、無ければ 0 を返すはず。でも average_positive([2, -1, 4]) が 3.0 ではなく 2.0 になる。",
  ),
  code: code(
    "def average_positive(nums):",
    "    total = 0",
    "    count = 0",
    "    for n in nums:",
    "        if n > 0:",
    "            total += n",
    "        count += 1",
    "    return total / count if count else 0",
  ),
  bugLine: 7,
  solution: code(
    "def average_positive(nums):",
    "    total = 0",
    "    count = 0",
    "    for n in nums:",
    "        if n > 0:",
    "            total += n",
    "            count += 1",
    "    return total / count if count else 0",
  ),
  nearMiss: [
    // Divides by every number, positive or not.
    code("def average_positive(nums):", "    total = sum(n for n in nums if n > 0)", "    return total / len(nums) if nums else 0"),
    // Counts zeros as positive.
    code("def average_positive(nums):", "    pos = [n for n in nums if n >= 0]", "    return sum(pos) / len(pos) if pos else 0"),
  ],
  tests: [
    { run: "print(average_positive([2, -1, 4]))", expect: "3.0" },
    { run: "print(average_positive([1, 2, 3]))", expect: "2.0" },
    { run: "print(average_positive([-1, -2]))", expect: "0", hidden: true },
    { run: "print(average_positive([0, 5]))", expect: "5.0", hidden: true },
    { run: "print(average_positive([]))", expect: "0", hidden: true },
  ],
  explain: L(
    "count += 1 sat outside the if, so it counted every number. Indented under the if, it counts only the positives.",
    "count += 1 estaba fuera del if, así que contaba todos los números. Dentro del if cuenta solo los positivos.",
    "count += 1 が if の外にあり全部数えていた。if の中に入れれば正の数だけ数える。",
  ),
};

/** Junior trace: integer division and remainder build a base-3 string. */
export const baseThreeTrace: ExamQuestion = {
  kind: "trace",
  topic: "numbers_strings",
  difficulty: 1,
  prompt: L("Trace table: digits with // and %", "Tabla de traza: dígitos con // y %", "トレース：// と % で桁を作る"),
  brief: L(
    "One row per pass of the while loop, with the values at the end of the pass. Write digits without quotes.",
    "Una fila por vuelta del while, con los valores al final de la vuelta. Escribe digits sin comillas.",
    "while の1周ごとに1行、周の終わりの値を書く。digits は引用符なしで。",
  ),
  code: code(
    "n = 47",
    'digits = ""',
    "while n > 0:",
    "    digits = str(n % 3) + digits",
    "    n = n // 3",
  ),
  columns: ["n", "digits"],
  rows: [
    { label: L("pass 1", "vuelta 1", "1周目"), cells: ["15", "2"], given: [0] },
    { label: L("pass 2", "vuelta 2", "2周目"), cells: ["5", "02"] },
    { label: L("pass 3", "vuelta 3", "3周目"), cells: ["1", "202"] },
    { label: L("pass 4", "vuelta 4", "4周目"), cells: ["0", "1202"] },
  ],
  verify: code(
    "n = 47",
    'digits = ""',
    "while n > 0:",
    "    digits = str(n % 3) + digits",
    "    n = n // 3",
    '    print(f"{n} | {digits}")',
  ),
  explain: L(
    "n % 3 is the next digit, added on the left; n // 3 drops it: 47 → 15 → 5 → 1 → 0, so 47 is 1202 in base 3.",
    "n % 3 es el siguiente dígito, que se agrega a la izquierda; n // 3 lo quita: 47 → 15 → 5 → 1 → 0, así 47 es 1202 en base 3.",
    "n % 3 が次の桁で左に足す。n // 3 でその桁を落とす：47→15→5→1→0、47 は3進数で 1202。",
  ),
};

/** Mid trace: two names for one list, a slice copy, and `+` building a new list. */
export const aliasTrace: ExamQuestion = {
  kind: "trace",
  topic: "mutability",
  difficulty: 2,
  prompt: L("Trace table: aliases and copies", "Tabla de traza: alias y copias", "トレース：別名とコピー"),
  brief: L(
    "Write each list as print shows it, e.g. [1, 2].",
    "Escribe cada lista como la muestra print, p. ej. [1, 2].",
    "各リストは print の表示どおりに書く（例：[1, 2]）。",
  ),
  code: code(
    "a = [1, 2]",
    "b = a",
    "c = a[:]",
    "b.append(3)",
    "c.append(4)",
    "a = a + [5]",
  ),
  columns: ["a", "b", "c"],
  rows: [
    { label: L("after line 4", "tras la línea 4", "4行目の後"), cells: ["[1, 2, 3]", "[1, 2, 3]", "[1, 2]"] },
    { label: L("after line 5", "tras la línea 5", "5行目の後"), cells: ["[1, 2, 3]", "[1, 2, 3]", "[1, 2, 4]"] },
    { label: L("after line 6", "tras la línea 6", "6行目の後"), cells: ["[1, 2, 3, 5]", "[1, 2, 3]", "[1, 2, 4]"] },
  ],
  verify: code(
    "a = [1, 2]",
    "b = a",
    "c = a[:]",
    "b.append(3)",
    'print(f"{a} | {b} | {c}")',
    "c.append(4)",
    'print(f"{a} | {b} | {c}")',
    "a = a + [5]",
    'print(f"{a} | {b} | {c}")',
  ),
  explain: L(
    "b is the same list as a, so append shows in both; c is a copy. a + [5] builds a new list and rebinds a, leaving b behind.",
    "b es la misma lista que a, así que append se ve en ambas; c es una copia. a + [5] crea una lista nueva y reasigna a; b queda atrás.",
    "b は a と同じリストなので append が両方に出る。c はコピー。a + [5] は新しいリストを作り a だけ付け替える。",
  ),
};

/** Mid trace: two closures, each with its own `count`. */
export const counterClosureTrace: ExamQuestion = {
  kind: "trace",
  topic: "scope_closures",
  difficulty: 2,
  prompt: L("Trace table: two counters", "Tabla de traza: dos contadores", "トレース：2つのカウンタ"),
  brief: L(
    "After this code, the calls in the rows run in order. Write what each call returns.",
    "Tras este código, las llamadas de las filas se ejecutan en orden. Escribe lo que devuelve cada una.",
    "このコードの後、各行の呼び出しを順に実行する。それぞれの戻り値を書く。",
  ),
  code: code(
    "def make_counter():",
    "    count = 0",
    "    def step(by):",
    "        nonlocal count",
    "        count += by",
    "        return count",
    "    return step",
    "",
    "a = make_counter()",
    "b = make_counter()",
  ),
  columns: ["result"],
  rows: [
    { label: "a(2)", cells: ["2"] },
    { label: "a(3)", cells: ["5"] },
    { label: "b(1)", cells: ["1"] },
    { label: "a(1)", cells: ["6"] },
  ],
  verify: code(
    "def make_counter():",
    "    count = 0",
    "    def step(by):",
    "        nonlocal count",
    "        count += by",
    "        return count",
    "    return step",
    "",
    "a = make_counter()",
    "b = make_counter()",
    "print(a(2))",
    "print(a(3))",
    "print(b(1))",
    "print(a(1))",
  ),
  explain: L(
    "Each make_counter() call makes a fresh count that its step keeps. a adds 2, 3, 1 to its own count; b starts again at 0.",
    "Cada llamada a make_counter() crea un count nuevo que su step conserva. a suma 2, 3 y 1 a su propio count; b empieza de 0.",
    "make_counter() を呼ぶたびに新しい count ができ、その step が保持する。a は自分の count に 2,3,1 を足し、b は 0 から。",
  ),
};

/** Mid debug: a "copy" that is only a second name for the caller's list. */
export const withBonusDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "mutability",
  difficulty: 2,
  prompt: L("Debug: the bonus changes the input", "Depura: el bono cambia la entrada", "デバッグ：ボーナスが入力を変える"),
  brief: L(
    "with_bonus(scores, bonus) should return a new list with bonus added to every score and leave scores unchanged. But after base = [1, 2] and with_bonus(base, 5), base is [6, 7].",
    "with_bonus(scores, bonus) debería devolver una lista nueva con bonus sumado a cada puntaje y dejar scores intacta. Pero tras base = [1, 2] y with_bonus(base, 5), base vale [6, 7].",
    "with_bonus(scores, bonus) は各点に bonus を足した新しいリストを返し、scores は変えないはず。でも base = [1, 2] で with_bonus(base, 5) の後、base が [6, 7] になる。",
  ),
  code: code(
    "def with_bonus(scores, bonus):",
    "    result = scores",
    "    for i in range(len(result)):",
    "        result[i] += bonus",
    "    return result",
  ),
  bugLine: 2,
  solution: code(
    "def with_bonus(scores, bonus):",
    "    result = scores[:]",
    "    for i in range(len(result)):",
    "        result[i] += bonus",
    "    return result",
  ),
  nearMiss: [
    // Rebinding the loop variable changes nothing.
    code("def with_bonus(scores, bonus):", "    result = scores", "    for s in result:", "        s += bonus", "    return result"),
    // Copies, but still adds to the caller's list.
    code("def with_bonus(scores, bonus):", "    result = scores[:]", "    for i in range(len(scores)):", "        scores[i] += bonus", "    return result"),
  ],
  tests: [
    { run: "base = [1, 2]\nwith_bonus(base, 5)\nprint(base)", expect: "[1, 2]" },
    { run: "print(with_bonus([1, 2], 5))", expect: "[6, 7]" },
    { run: "print(with_bonus([], 3))", expect: "[]", hidden: true },
    { run: "b = [3]\nr = with_bonus(b, -1)\nprint(b, r)", expect: "[3] [2]", hidden: true },
    { run: "b = [1]\nprint(with_bonus(b, 1) is b)", expect: "False", hidden: true },
  ],
  explain: L(
    "result = scores is a second name for the same list, so += changed the caller's list. scores[:] makes a copy to change instead.",
    "result = scores es otro nombre para la misma lista, así que += cambiaba la del llamador. scores[:] crea una copia para cambiar.",
    "result = scores は同じリストの別名なので、+= が呼び出し元のリストを変えていた。scores[:] でコピーを作って変える。",
  ),
};

/** Senior trace: a lazy generator pipeline only runs as far as it is pulled. */
export const lazyPipelineTrace: ExamQuestion = {
  kind: "trace",
  topic: "generators",
  difficulty: 3,
  prompt: L("Trace table: a lazy pipeline", "Tabla de traza: un pipeline perezoso", "トレース：遅延パイプライン"),
  brief: L(
    "One row per line 8, 9 and 10: log and the value just assigned (a, b, then c), as print shows them.",
    "Una fila por las líneas 8, 9 y 10: log y el valor recién asignado (a, b y luego c), como los muestra print.",
    "8・9・10行目ごとに1行：log と代入された値（a, b, c）を print の表示で。",
  ),
  code: code(
    "log = []",
    "def nums():",
    "    for n in [1, 2, 3, 4, 5]:",
    "        log.append(n)",
    "        yield n",
    "",
    "evens = (n * 10 for n in nums() if n % 2 == 0)",
    "a = next(evens)",
    "b = next(evens)",
    "c = list(evens)",
  ),
  columns: ["log", "a / b / c"],
  rows: [
    { label: L("after line 8", "tras la línea 8", "8行目の後"), cells: ["[1, 2]", "20"] },
    { label: L("after line 9", "tras la línea 9", "9行目の後"), cells: ["[1, 2, 3, 4]", "40"] },
    { label: L("after line 10", "tras la línea 10", "10行目の後"), cells: ["[1, 2, 3, 4, 5]", "[]"] },
  ],
  verify: code(
    "log = []",
    "def nums():",
    "    for n in [1, 2, 3, 4, 5]:",
    "        log.append(n)",
    "        yield n",
    "",
    "evens = (n * 10 for n in nums() if n % 2 == 0)",
    "a = next(evens)",
    'print(f"{log} | {a}")',
    "b = next(evens)",
    'print(f"{log} | {b}")',
    "c = list(evens)",
    'print(f"{log} | {c}")',
  ),
  explain: L(
    "Line 7 runs nothing. Each next pulls numbers until an even one passes the filter. list() drains the rest: 5 is odd, so c is [].",
    "La línea 7 no ejecuta nada. Cada next pide números hasta que uno par pasa el filtro. list() vacía el resto: 5 es impar, así que c es [].",
    "7行目では何も実行されない。next は偶数が通るまで数を引き出す。list() が残りを消費し、5 は奇数なので c は []。",
  ),
};

/** Senior debug (ide): handlers registered in a loop all see the loop's last values. */
export const lateBindingDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "scope_closures",
  difficulty: 3,
  prompt: L("Debug: every handler prints the last rate", "Depura: cada handler usa la última tasa", "デバッグ：全ハンドラが最後のレート"),
  brief: L(
    'build_bus(rates) registers one "price" handler per currency; emit("price", v) should return "name:v*rate" for each, in order. But build_bus({"eur": 2, "jpy": 3}).emit("price", 10) returns [\'jpy:30\', \'jpy:30\'] instead of [\'eur:20\', \'jpy:30\'].',
    'build_bus(rates) registra un handler "price" por moneda; emit("price", v) debería devolver "nombre:v*tasa" para cada una, en orden. Pero build_bus({"eur": 2, "jpy": 3}).emit("price", 10) devuelve [\'jpy:30\', \'jpy:30\'] en vez de [\'eur:20\', \'jpy:30\'].',
    'build_bus(rates) は通貨ごとに "price" ハンドラを登録し、emit("price", v) は各通貨の "name:v*rate" を順に返すはず。でも build_bus({"eur": 2, "jpy": 3}).emit("price", 10) が [\'eur:20\', \'jpy:30\'] でなく [\'jpy:30\', \'jpy:30\'] になる。',
  ),
  code: code(
    "class Bus:",
    "    def __init__(self):",
    "        self.handlers = {}",
    "",
    "    def on(self, event, fn):",
    "        self.handlers.setdefault(event, []).append(fn)",
    "",
    "    def emit(self, event, value):",
    "        return [fn(value) for fn in self.handlers.get(event, [])]",
    "",
    "",
    "def build_bus(rates):",
    "    bus = Bus()",
    "    for name, rate in rates.items():",
    '        bus.on("price", lambda v: f"{name}:{v * rate}")',
    "    return bus",
  ),
  bugLine: 15,
  solution: code(
    "class Bus:",
    "    def __init__(self):",
    "        self.handlers = {}",
    "",
    "    def on(self, event, fn):",
    "        self.handlers.setdefault(event, []).append(fn)",
    "",
    "    def emit(self, event, value):",
    "        return [fn(value) for fn in self.handlers.get(event, [])]",
    "",
    "",
    "def build_bus(rates):",
    "    bus = Bus()",
    "    for name, rate in rates.items():",
    '        bus.on("price", lambda v, name=name, rate=rate: f"{name}:{v * rate}")',
    "    return bus",
  ),
  nearMiss: [
    // Binds the rate now but still reads name late.
    code(
      "class Bus:",
      "    def __init__(self):",
      "        self.handlers = {}",
      "    def on(self, event, fn):",
      "        self.handlers.setdefault(event, []).append(fn)",
      "    def emit(self, event, value):",
      "        return [fn(value) for fn in self.handlers.get(event, [])]",
      "def build_bus(rates):",
      "    bus = Bus()",
      "    for name, rate in rates.items():",
      '        bus.on("price", lambda v, rate=rate: f"{name}:{v * rate}")',
      "    return bus",
    ),
    // Binds the name now but still reads rate late.
    code(
      "class Bus:",
      "    def __init__(self):",
      "        self.handlers = {}",
      "    def on(self, event, fn):",
      "        self.handlers.setdefault(event, []).append(fn)",
      "    def emit(self, event, value):",
      "        return [fn(value) for fn in self.handlers.get(event, [])]",
      "def build_bus(rates):",
      "    bus = Bus()",
      "    for name, rate in rates.items():",
      '        bus.on("price", lambda v, name=name: f"{name}:{v * rate}")',
      "    return bus",
    ),
  ],
  tests: [
    { run: 'print(build_bus({"eur": 2, "jpy": 3}).emit("price", 10))', expect: "['eur:20', 'jpy:30']" },
    { run: 'print(build_bus({}).emit("price", 5))', expect: "[]" },
    { run: 'print(build_bus({"a": 1, "b": 2, "c": 3}).emit("price", 1))', expect: "['a:1', 'b:2', 'c:3']", hidden: true },
    { run: 'print(build_bus({"x": 5}).emit("tax", 1))', expect: "[]", hidden: true },
    { run: 'bus = build_bus({"p": 2, "q": 4})\nprint(bus.emit("price", 3), bus.emit("price", 0))', expect: "['p:6', 'q:12'] ['p:0', 'q:0']", hidden: true },
  ],
  explain: L(
    "A lambda looks up name and rate when it runs, after the loop ended. Default arguments copy each pass's values when the lambda is made.",
    "Una lambda busca name y rate al ejecutarse, cuando el bucle ya terminó. Los argumentos por defecto copian los valores de cada vuelta al crearla.",
    "lambda は実行時に name と rate を探すので、ループ後の値になる。デフォルト引数なら作成時の各周の値を保持する。",
  ),
};

/** Senior debug (paper): a generator expression consumed twice. */
export const exhaustedGeneratorDebug: ExamQuestion = {
  kind: "debug",
  mode: "paper",
  topic: "comprehensions",
  difficulty: 3,
  prompt: L("Debug: the average is always 0.0", "Depura: el promedio siempre es 0.0", "デバッグ：平均がいつも 0.0"),
  brief: L(
    'report(rows, min_score) summarizes the (name, score) pairs with score >= min_score: the top score, who has it (sorted) and the average. But report([("ana", 4), ("bo", 6)]) returns "top=6 by bo avg=0.0" instead of "top=6 by bo avg=5.0".',
    'report(rows, min_score) resume los pares (nombre, puntaje) con puntaje >= min_score: el máximo, quién lo tiene (ordenado) y el promedio. Pero report([("ana", 4), ("bo", 6)]) devuelve "top=6 by bo avg=0.0" en vez de "top=6 by bo avg=5.0".',
    'report(rows, min_score) は score >= min_score の (name, score) を要約する：最高点、その人（ソート順）、平均。でも report([("ana", 4), ("bo", 6)]) が "top=6 by bo avg=5.0" でなく "top=6 by bo avg=0.0" を返す。',
  ),
  code: code(
    "def report(rows, min_score=0):",
    '    """rows: a list of (name, score) pairs.',
    '    Returns a one-line summary of the scores >= min_score."""',
    "    kept = [(name, score) for name, score in rows if score >= min_score]",
    "    if not kept:",
    '        return "no data"',
    "",
    "    scores = (score for _, score in kept)",
    "    top = max(scores)",
    "    total = sum(scores)",
    "    leaders = sorted(name for name, score in kept if score == top)",
    "",
    "    avg = total / len(kept)",
    "    return f\"top={top} by {','.join(leaders)} avg={avg:.1f}\"",
  ),
  bugLine: 8,
  alsoLines: [9, 10],
  solution: code(
    "def report(rows, min_score=0):",
    '    """rows: a list of (name, score) pairs.',
    '    Returns a one-line summary of the scores >= min_score."""',
    "    kept = [(name, score) for name, score in rows if score >= min_score]",
    "    if not kept:",
    '        return "no data"',
    "",
    "    scores = [score for _, score in kept]",
    "    top = max(scores)",
    "    total = sum(scores)",
    "    leaders = sorted(name for name, score in kept if score == top)",
    "",
    "    avg = total / len(kept)",
    "    return f\"top={top} by {','.join(leaders)} avg={avg:.1f}\"",
  ),
  nearMiss: [
    // A set can be read twice, but it drops repeated scores from the total.
    code(
      "def report(rows, min_score=0):",
      "    kept = [(name, score) for name, score in rows if score >= min_score]",
      "    if not kept:",
      '        return "no data"',
      "    scores = {score for _, score in kept}",
      "    top = max(scores)",
      "    total = sum(scores)",
      "    leaders = sorted(name for name, score in kept if score == top)",
      "    avg = total / len(kept)",
      "    return f\"top={top} by {','.join(leaders)} avg={avg:.1f}\"",
    ),
    // iter() over a list is still a one-shot iterator.
    code(
      "def report(rows, min_score=0):",
      "    kept = [(name, score) for name, score in rows if score >= min_score]",
      "    if not kept:",
      '        return "no data"',
      "    scores = iter([score for _, score in kept])",
      "    top = max(scores)",
      "    total = sum(scores)",
      "    leaders = sorted(name for name, score in kept if score == top)",
      "    avg = total / len(kept)",
      "    return f\"top={top} by {','.join(leaders)} avg={avg:.1f}\"",
    ),
  ],
  tests: [
    { run: 'print(report([("ana", 4), ("bo", 6)]))', expect: "top=6 by bo avg=5.0" },
    { run: "print(report([], 1))", expect: "no data" },
    { run: 'print(report([("a", 3), ("b", 3)]))', expect: "top=3 by a,b avg=3.0", hidden: true },
    { run: 'print(report([("x", 9), ("y", 1), ("z", 9)], 5))', expect: "top=9 by x,z avg=9.0", hidden: true },
    { run: 'print(report([("solo", 7)]))', expect: "top=7 by solo avg=7.0", hidden: true },
  ],
  explain: L(
    "A generator can be read once: max() used it up, so sum() got nothing. A list comprehension can be read as often as needed.",
    "Un generador se lee una sola vez: max() lo agotó y sum() no recibió nada. Una list comprehension se puede leer las veces que haga falta.",
    "ジェネレータは1回しか読めない。max() が使い切り、sum() には何も残らない。リスト内包表記なら何度でも読める。",
  ),
};

/** Senior debug (paper): a mutable class attribute shared by every instance. */
export const sharedClassListDebug: ExamQuestion = {
  kind: "debug",
  mode: "paper",
  topic: "classes",
  difficulty: 3,
  prompt: L("Debug: heroes join every party", "Depura: los héroes entran a todos los grupos", "デバッグ：全パーティに加入してしまう"),
  brief: L(
    'Party(name) holds up to 3 heroes: join(hero) adds one and returns True, or False when full; roster() lists them ("-" if none). But after a = Party("red"), b = Party("blue") and a.join("ana"), b.roster() returns "blue: ana" instead of "blue: -".',
    'Party(name) admite hasta 3 héroes: join(hero) agrega uno y devuelve True, o False si está lleno; roster() los lista ("-" si no hay). Pero tras a = Party("red"), b = Party("blue") y a.join("ana"), b.roster() devuelve "blue: ana" en vez de "blue: -".',
    'Party(name) は最大3人。join(hero) は追加して True、満員なら False。roster() は一覧（いなければ "-"）。でも a = Party("red")、b = Party("blue")、a.join("ana") の後、b.roster() が "blue: -" でなく "blue: ana" になる。',
  ),
  code: code(
    "class Party:",
    "    members = []",
    "    max_size = 3",
    "",
    "    def __init__(self, name):",
    "        self.name = name",
    "",
    "    def join(self, hero):",
    "        if len(self.members) >= self.max_size:",
    "            return False",
    "        self.members.append(hero)",
    "        return True",
    "",
    "    def roster(self):",
    "        return f\"{self.name}: {', '.join(self.members) or '-'}\"",
  ),
  bugLine: 2,
  alsoLines: [6],
  solution: code(
    "class Party:",
    "    max_size = 3",
    "",
    "    def __init__(self, name):",
    "        self.name = name",
    "        self.members = []",
    "",
    "    def join(self, hero):",
    "        if len(self.members) >= self.max_size:",
    "            return False",
    "        self.members.append(hero)",
    "        return True",
    "",
    "    def roster(self):",
    "        return f\"{self.name}: {', '.join(self.members) or '-'}\"",
  ),
  nearMiss: [
    // Each instance gets an attribute, but it points at the same class list.
    code(
      "class Party:",
      "    members = []",
      "    max_size = 3",
      "    def __init__(self, name):",
      "        self.name = name",
      "        self.members = Party.members",
      "    def join(self, hero):",
      "        if len(self.members) >= self.max_size:",
      "            return False",
      "        self.members.append(hero)",
      "        return True",
      "    def roster(self):",
      "        return f\"{self.name}: {', '.join(self.members) or '-'}\"",
    ),
    // A mutable default argument is shared just the same.
    code(
      "class Party:",
      "    max_size = 3",
      "    def __init__(self, name, members=[]):",
      "        self.name = name",
      "        self.members = members",
      "    def join(self, hero):",
      "        if len(self.members) >= self.max_size:",
      "            return False",
      "        self.members.append(hero)",
      "        return True",
      "    def roster(self):",
      "        return f\"{self.name}: {', '.join(self.members) or '-'}\"",
    ),
  ],
  tests: [
    { run: 'a = Party("red")\nb = Party("blue")\na.join("ana")\nprint(b.roster())', expect: "blue: -" },
    { run: 'p = Party("gold")\nprint(p.join("kai"), p.roster())', expect: "True gold: kai" },
    { run: 'p = Party("x")\nprint([p.join(h) for h in "abcd"])', expect: "[True, True, True, False]", hidden: true },
    { run: 'p = Party("y")\nq = Party("z")\nfor h in "abc":\n    p.join(h)\nprint(q.join("d"), q.roster())', expect: "True z: d", hidden: true },
    { run: 'print(Party("e").roster())', expect: "e: -", hidden: true },
  ],
  explain: L(
    "members = [] in the class body is one list shared by every Party. Creating self.members in __init__ gives each party its own.",
    "members = [] en el cuerpo de la clase es una sola lista compartida por todos los Party. Crear self.members en __init__ da una a cada grupo.",
    "クラス本体の members = [] は全 Party で共有される1つのリスト。__init__ で self.members を作れば各パーティ専用になる。",
  ),
};

export const juniorTraceDebug: ExamQuestion[] = [doubleAddTrace, baseThreeTrace];
export const midTraceDebug: ExamQuestion[] = [averagePositiveDebug, aliasTrace, counterClosureTrace, withBonusDebug];
export const seniorTraceDebug: ExamQuestion[] = [lazyPipelineTrace, lateBindingDebug, exhaustedGeneratorDebug, sharedClassListDebug];
