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

export const juniorTraceDebug: ExamQuestion[] = [doubleAddTrace];
export const midTraceDebug: ExamQuestion[] = [averagePositiveDebug];
export const seniorTraceDebug: ExamQuestion[] = [];
