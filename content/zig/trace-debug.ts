import type { ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Written-test formats for planet Comptia (Zig 0.15.2, Debug, on Compiler Explorer): trace tables
// (dry-run the code, fill the values) and debugging tasks (tap the buggy line, then fix it). The
// validator runs every `verify` and proves each fix passes the tests while the buggy code and the
// near misses fail. Debug code is the player file (no `main`), exactly like the coding tasks.

/** Zig source as written: backslashes stay literal (`\n` inside Zig strings), leading newline dropped. */
const zig = (s: TemplateStringsArray): string => s.raw[0].replace(/^\n/, "");

const pass = (n: number) => L(`pass ${n}`, `vuelta ${n}`, `${n}周目`);

// ─── Junior traces ──────────────────────────────────────────────────────────

/** Junior trace: wrapping addition on a u8. */
export const wrapAddTrace: ExamQuestion = {
  slug: "wrap-add",
  kind: "trace",
  topic: "integers",
  difficulty: 1,
  prompt: L("Trace table: a u8 that wraps", "Tabla de traza: un u8 que da la vuelta", "トレース：一周する u8"),
  brief: L(
    "One row per pass, taken after x +%= 3.",
    "Una fila por vuelta, tomada después de x +%= 3.",
    "1周ごとに1行。x +%= 3 の後の値。",
  ),
  code: zig`
var x: u8 = 250;
var i: u8 = 0;
while (i < 3) : (i += 1) {
    x +%= 3;
}`,
  columns: ["i", "x"],
  rows: [
    { label: pass(1), cells: ["0", "253"], given: [0] },
    { label: pass(2), cells: ["1", "0"] },
    { label: pass(3), cells: ["2", "3"] },
  ],
  verify: zig`
const std = @import("std");

pub fn main() !void {
    var x: u8 = 250;
    var i: u8 = 0;
    while (i < 3) : (i += 1) {
        x +%= 3;
        std.debug.print("{d} | {d}\n", .{ i, x });
    }
}`,
  explain: L(
    "+%= wraps modulo 256 instead of panicking: 253 + 3 = 256 wraps to 0, then 0 + 3 = 3.",
    "+%= da la vuelta módulo 256 en vez de entrar en pánico: 253 + 3 = 256 pasa a 0, luego 0 + 3 = 3.",
    "+%= はパニックせず 256 で一周する。253 + 3 = 256 は 0 になり、次は 0 + 3 = 3。",
  ),
};

/** Junior trace: digits peeled off with % and / on integers. */
export const digitSumTrace: ExamQuestion = {
  slug: "digit-sum",
  kind: "trace",
  topic: "control",
  difficulty: 1,
  prompt: L("Trace table: peeling digits", "Tabla de traza: separando dígitos", "トレース：桁を取り出す"),
  brief: L(
    "One row per pass of the while loop, taken at the end of the pass.",
    "Una fila por vuelta del while, tomada al final de la vuelta.",
    "while の1周ごとに1行。周の終わりの値。",
  ),
  code: zig`
var n: u32 = 907;
var sum: u32 = 0;
while (n > 0) {
    sum += n % 10;
    n /= 10;
}`,
  columns: ["sum", "n"],
  rows: [
    { label: pass(1), cells: ["7", "90"] },
    { label: pass(2), cells: ["7", "9"] },
    { label: pass(3), cells: ["16", "0"] },
  ],
  verify: zig`
const std = @import("std");

pub fn main() !void {
    var n: u32 = 907;
    var sum: u32 = 0;
    while (n > 0) {
        sum += n % 10;
        n /= 10;
        std.debug.print("{d} | {d}\n", .{ sum, n });
    }
}`,
  explain: L(
    "n % 10 is the last digit and n /= 10 drops it (integer division truncates): 7, then 0, then 9, so sum is 16.",
    "n % 10 es el último dígito y n /= 10 lo quita (la división entera trunca): 7, luego 0, luego 9; sum queda en 16.",
    "n % 10 は最後の桁、n /= 10 でその桁を落とす（整数除算は切り捨て）。7、0、9 で sum は 16。",
  ),
};

// ─── Mid traces ─────────────────────────────────────────────────────────────

/** Mid trace: `continue` still runs the while's continue expression. */
export const continueExprTrace: ExamQuestion = {
  slug: "continue-expr",
  kind: "trace",
  topic: "control",
  difficulty: 2,
  prompt: L("Trace table: continue and the step", "Tabla de traza: continue y el paso", "トレース：continue とステップ"),
  brief: L(
    "One row per pass, taken just before the continue expression i *= 2 runs.",
    "Una fila por vuelta, tomada justo antes de que corra la expresión de continuación i *= 2.",
    "1周ごとに1行。継続式 i *= 2 が動く直前の値。",
  ),
  code: zig`
var total: u32 = 0;
var i: u32 = 1;
while (i <= 10) : (i *= 2) {
    if (i == 4) continue;
    total += i;
}`,
  columns: ["i", "total"],
  rows: [
    { label: pass(1), cells: ["1", "1"], given: [0] },
    { label: pass(2), cells: ["2", "3"] },
    { label: pass(3), cells: ["4", "3"] },
    { label: pass(4), cells: ["8", "11"] },
  ],
  verify: zig`
const std = @import("std");

pub fn main() !void {
    var total: u32 = 0;
    var i: u32 = 1;
    while (i <= 10) : ({
        std.debug.print("{d} | {d}\n", .{ i, total });
        i *= 2;
    }) {
        if (i == 4) continue;
        total += i;
    }
}`,
  explain: L(
    "continue skips total += 4 but still runs i *= 2, so the loop goes on to 8. i = 16 fails the condition.",
    "continue salta total += 4 pero igual corre i *= 2, así que el bucle sigue con 8. i = 16 no cumple la condición.",
    "continue は total += 4 を飛ばすが i *= 2 は実行するので 8 へ進む。i = 16 で条件が偽になる。",
  ),
};

/** Mid trace: a slice that shares memory with the array it reads from. */
export const sliceAliasTrace: ExamQuestion = {
  slug: "slice-alias",
  kind: "trace",
  topic: "slices",
  difficulty: 2,
  prompt: L("Trace table: a slice into the same array", "Tabla de traza: un slice del mismo array", "トレース：同じ配列のスライス"),
  brief: L(
    "One row per pass, taken after v.* += a[i]. s[i] is the same memory as a[i + 1].",
    "Una fila por vuelta, tomada después de v.* += a[i]. s[i] es la misma memoria que a[i + 1].",
    "1周ごとに1行。v.* += a[i] の後の値。s[i] は a[i + 1] と同じメモリ。",
  ),
  code: zig`
var a = [_]i32{ 1, 2, 3, 4, 5 };
const s = a[1..4];
for (s, 0..) |*v, i| {
    v.* += a[i];
}`,
  columns: ["i", "a[i]", "v.*"],
  rows: [
    { label: pass(1), cells: ["0", "1", "3"], given: [0] },
    { label: pass(2), cells: ["1", "3", "6"], given: [0] },
    { label: pass(3), cells: ["2", "6", "10"], given: [0] },
  ],
  verify: zig`
const std = @import("std");

pub fn main() !void {
    var a = [_]i32{ 1, 2, 3, 4, 5 };
    const s = a[1..4];
    for (s, 0..) |*v, i| {
        v.* += a[i];
        std.debug.print("{d} | {d} | {d}\n", .{ i, a[i], v.* });
    }
}`,
  explain: L(
    "A slice is a view, not a copy: pass 1 writes 3 into a[1], so pass 2 reads that 3 and gets 6, and pass 3 gets 4 + 6 = 10.",
    "Un slice es una vista, no una copia: la vuelta 1 escribe 3 en a[1], la vuelta 2 lee ese 3 y da 6, y la 3 da 4 + 6 = 10.",
    "スライスはコピーでなくビュー。1周目が a[1] に 3 を書き、2周目はその 3 を読んで 6、3周目は 4 + 6 = 10。",
  ),
};

// ─── Senior trace ───────────────────────────────────────────────────────────

/** Senior trace: defer inside recursion runs on the way back out, innermost call first. */
export const deferRecursionTrace: ExamQuestion = {
  slug: "defer-recursion",
  kind: "trace",
  topic: "defer",
  difficulty: 3,
  prompt: L("Trace table: defer on the way back", "Tabla de traza: defer a la vuelta", "トレース：戻り道の defer"),
  brief: L(
    "One row each time log changes: after the assignment in each call, then each time a defer runs.",
    "Una fila cada vez que cambia log: tras la asignación de cada llamada y luego cada vez que corre un defer.",
    "log が変わるたびに1行。各呼び出しの代入の後と、defer が動くたび。",
  ),
  code: zig`
fn walk(n: u32, log: *u32) void {
    if (n == 0) return;
    log.* = log.* * 10 + n;
    defer log.* = log.* * 10 + n;
    walk(n - 1, log);
}

pub fn main() void {
    var log: u32 = 0;
    walk(3, &log);
}`,
  columns: ["log"],
  rows: [
    { label: L("call n = 3", "llamada n = 3", "呼び出し n=3"), cells: ["3"] },
    { label: L("call n = 2", "llamada n = 2", "呼び出し n=2"), cells: ["32"] },
    { label: L("call n = 1", "llamada n = 1", "呼び出し n=1"), cells: ["321"] },
    { label: L("defer of n = 1", "defer de n = 1", "n=1 の defer"), cells: ["3211"] },
    { label: L("defer of n = 2", "defer de n = 2", "n=2 の defer"), cells: ["32112"] },
    { label: L("defer of n = 3", "defer de n = 3", "n=3 の defer"), cells: ["321123"] },
  ],
  verify: zig`
const std = @import("std");

fn walk(n: u32, log: *u32) void {
    if (n == 0) return;
    log.* = log.* * 10 + n;
    std.debug.print("{d}\n", .{log.*});
    defer {
        log.* = log.* * 10 + n;
        std.debug.print("{d}\n", .{log.*});
    }
    walk(n - 1, log);
}

pub fn main() !void {
    var log: u32 = 0;
    walk(3, &log);
}`,
  explain: L(
    "Each call appends n going in; its defer appends n again when that call returns, so the innermost (n = 1) runs first: 321 then 1, 2, 3.",
    "Cada llamada agrega n al entrar; su defer agrega n otra vez al volver, así que el más interno (n = 1) corre primero: 321 y luego 1, 2, 3.",
    "各呼び出しは入る時に n を足し、戻る時に defer がまた n を足す。一番内側の n=1 が先なので 321 の後に 1、2、3。",
  ),
};

// ─── Mid debugging tasks ────────────────────────────────────────────────────

/** Mid debug: a backwards loop that stops one index too early. */
export const lastIndexDebug: ExamQuestion = {
  slug: "last-index",
  kind: "debug",
  mode: "ide",
  topic: "slices",
  difficulty: 2,
  prompt: L("Debug: the last match", "Depura: la última coincidencia", "デバッグ：最後に一致する位置"),
  brief: L(
    "lastIndexOf(s, c) should return the index of the last byte of s equal to c, or null if there is none. But lastIndexOf(\"abc\", 'a') returns null instead of 0.",
    "lastIndexOf(s, c) debería devolver el índice del último byte de s igual a c, o null si no hay. Pero lastIndexOf(\"abc\", 'a') devuelve null en vez de 0.",
    "lastIndexOf(s, c) は s の中で c と等しい最後のバイトの添字を、無ければ null を返すはず。でも lastIndexOf(\"abc\", 'a') が 0 ではなく null になる。",
  ),
  code: zig`
const std = @import("std");

fn lastIndexOf(s: []const u8, c: u8) ?usize {
    var i: usize = s.len;
    while (i > 1) {
        i -= 1;
        if (s[i] == c) return i;
    }
    return null;
}
`,
  bugLine: 5,
  solution: zig`
const std = @import("std");

fn lastIndexOf(s: []const u8, c: u8) ?usize {
    var i: usize = s.len;
    while (i > 0) {
        i -= 1;
        if (s[i] == c) return i;
    }
    return null;
}
`,
  nearMiss: [
    // Searches forward: finds the FIRST match, not the last.
    zig`
const std = @import("std");

fn lastIndexOf(s: []const u8, c: u8) ?usize {
    for (s, 0..) |ch, i| {
        if (ch == c) return i;
    }
    return null;
}
`,
    // Starts at s.len - 1: underflows (panics) on an empty slice.
    zig`
const std = @import("std");

fn lastIndexOf(s: []const u8, c: u8) ?usize {
    var i: usize = s.len - 1;
    while (true) : (i -= 1) {
        if (s[i] == c) return i;
        if (i == 0) return null;
    }
}
`,
  ],
  tests: [
    { run: `std.debug.print("{?d}\\n", .{lastIndexOf("abc", 'a')});`, expect: "0" },
    { run: `std.debug.print("{?d}\\n", .{lastIndexOf("banana", 'a')});`, expect: "5" },
    { run: `std.debug.print("{?d}\\n", .{lastIndexOf("", 'x')});`, expect: "null", hidden: true },
    { run: `std.debug.print("{?d}\\n", .{lastIndexOf("abca", 'a')});`, expect: "3", hidden: true },
    { run: `std.debug.print("{?d}\\n", .{lastIndexOf("zzz", 'q')});`, expect: "null", hidden: true },
  ],
  explain: L(
    "while (i > 1) stops before i -= 1 can reach 0, so index 0 is never checked. With i > 0 the last pass looks at s[0].",
    "while (i > 1) se detiene antes de que i -= 1 llegue a 0, así que nunca revisa el índice 0. Con i > 0 la última vuelta mira s[0].",
    "while (i > 1) だと i -= 1 が 0 に届く前に止まり、添字 0 を見ない。i > 0 なら最後の周で s[0] を調べる。",
  ),
};

/** Mid debug: a sum kept in a u8 overflows (a safety-checked panic in Debug). */
export const averageOverflowDebug: ExamQuestion = {
  slug: "average-overflow",
  kind: "debug",
  mode: "ide",
  topic: "integers",
  difficulty: 2,
  prompt: L("Debug: the average that overflows", "Depura: el promedio que desborda", "デバッグ：あふれる平均"),
  brief: L(
    "average(xs) should return the average of the bytes in xs, rounded down, and 0 for an empty slice. But average(&.{ 200, 100 }) panics with \"integer overflow\" instead of returning 150.",
    "average(xs) debería devolver el promedio de los bytes de xs, redondeado hacia abajo, y 0 para un slice vacío. Pero average(&.{ 200, 100 }) entra en pánico con \"integer overflow\" en vez de devolver 150.",
    "average(xs) は xs のバイトの平均（切り捨て）を、空なら 0 を返すはず。でも average(&.{ 200, 100 }) が 150 を返さず \"integer overflow\" でパニックする。",
  ),
  code: zig`
const std = @import("std");

fn average(xs: []const u8) u8 {
    if (xs.len == 0) return 0;
    var sum: u8 = 0;
    for (xs) |x| sum += x;
    return @intCast(sum / xs.len);
}
`,
  bugLine: 5,
  solution: zig`
const std = @import("std");

fn average(xs: []const u8) u8 {
    if (xs.len == 0) return 0;
    var sum: usize = 0;
    for (xs) |x| sum += x;
    return @intCast(sum / xs.len);
}
`,
  nearMiss: [
    // Wrapping addition hides the panic but the sum is wrong.
    zig`
const std = @import("std");

fn average(xs: []const u8) u8 {
    if (xs.len == 0) return 0;
    var sum: u8 = 0;
    for (xs) |x| sum +%= x;
    return @intCast(sum / xs.len);
}
`,
    // Saturating addition stops at 255.
    zig`
const std = @import("std");

fn average(xs: []const u8) u8 {
    if (xs.len == 0) return 0;
    var sum: u8 = 0;
    for (xs) |x| sum +|= x;
    return @intCast(sum / xs.len);
}
`,
  ],
  tests: [
    { run: `std.debug.print("{d}\\n", .{average(&.{ 200, 100 })});`, expect: "150" },
    { run: `std.debug.print("{d}\\n", .{average(&.{ 1, 2, 3 })});`, expect: "2" },
    { run: `std.debug.print("{d}\\n", .{average(&[_]u8{})});`, expect: "0", hidden: true },
    { run: `std.debug.print("{d}\\n", .{average(&.{ 255, 255, 255, 255 })});`, expect: "255", hidden: true },
    { run: `std.debug.print("{d}\\n", .{average(&.{ 10, 11 })});`, expect: "10", hidden: true },
  ],
  explain: L(
    "A u8 sum overflows past 255, and Debug builds check it. Summing into a usize leaves room; the average itself always fits back in a u8.",
    "Una suma en u8 desborda al pasar de 255 y el build Debug lo detecta. Sumar en un usize deja espacio; el promedio siempre cabe de nuevo en u8.",
    "u8 の合計は 255 を超えるとあふれ、Debug ビルドが検出する。usize で合計すれば余裕があり、平均は必ず u8 に収まる。",
  ),
};

// ─── Senior debugging tasks ─────────────────────────────────────────────────

/** Senior debug (ide): the update lands on a copy of the struct, not on the slice element. */
export const restockDebug: ExamQuestion = {
  slug: "restock",
  kind: "debug",
  mode: "ide",
  topic: "structs",
  difficulty: 3,
  prompt: L("Debug: the restock that vanishes", "Depura: el reabastecimiento que desaparece", "デバッグ：消える入荷"),
  brief: L(
    "restock(items, name, amount) should add amount to the qty of the first item called name and return true, or return false if there is none. It returns true, but after restock(&items, \"nut\", 4) the nut still has qty 5 instead of 9.",
    "restock(items, name, amount) debería sumar amount al qty del primer item llamado name y devolver true, o false si no hay. Devuelve true, pero tras restock(&items, \"nut\", 4) el nut sigue con qty 5 en vez de 9.",
    "restock(items, name, amount) は name という最初の品の qty に amount を足して true を、無ければ false を返すはず。true は返るが、restock(&items, \"nut\", 4) の後も nut の qty が 9 でなく 5 のまま。",
  ),
  code: zig`
const std = @import("std");

const Stock = struct {
    name: []const u8,
    qty: u32,
};

fn restock(items: []Stock, name: []const u8, amount: u32) bool {
    for (0..items.len) |i| {
        var item = items[i];
        if (std.mem.eql(u8, item.name, name)) {
            item.qty += amount;
            return true;
        }
    }
    return false;
}

fn totalQty(items: []const Stock) u32 {
    var sum: u32 = 0;
    for (items) |it| sum += it.qty;
    return sum;
}
`,
  bugLine: 10,
  solution: zig`
const std = @import("std");

const Stock = struct {
    name: []const u8,
    qty: u32,
};

fn restock(items: []Stock, name: []const u8, amount: u32) bool {
    for (0..items.len) |i| {
        const item = &items[i];
        if (std.mem.eql(u8, item.name, name)) {
            item.qty += amount;
            return true;
        }
    }
    return false;
}

fn totalQty(items: []const Stock) u32 {
    var sum: u32 = 0;
    for (items) |it| sum += it.qty;
    return sum;
}
`,
  nearMiss: [
    // Updates every item with that name instead of only the first one.
    zig`
const std = @import("std");

const Stock = struct {
    name: []const u8,
    qty: u32,
};

fn restock(items: []Stock, name: []const u8, amount: u32) bool {
    var found = false;
    for (items) |*item| {
        if (std.mem.eql(u8, item.name, name)) {
            item.qty += amount;
            found = true;
        }
    }
    return found;
}

fn totalQty(items: []const Stock) u32 {
    var sum: u32 = 0;
    for (items) |it| sum += it.qty;
    return sum;
}
`,
    // Writes through a pointer, but compares lengths instead of contents.
    zig`
const std = @import("std");

const Stock = struct {
    name: []const u8,
    qty: u32,
};

fn restock(items: []Stock, name: []const u8, amount: u32) bool {
    for (0..items.len) |i| {
        const item = &items[i];
        if (item.name.len == name.len) {
            item.qty += amount;
            return true;
        }
    }
    return false;
}

fn totalQty(items: []const Stock) u32 {
    var sum: u32 = 0;
    for (items) |it| sum += it.qty;
    return sum;
}
`,
  ],
  tests: [
    { run: zig`
{
    var items = [_]Stock{ .{ .name = "bolt", .qty = 3 }, .{ .name = "nut", .qty = 5 } };
    const ok = restock(&items, "nut", 4);
    std.debug.print("{} {d}\n", .{ ok, items[1].qty });
}`, expect: "true 9" },
    { run: zig`
{
    var items = [_]Stock{ .{ .name = "gear", .qty = 1 } };
    const ok = restock(&items, "cog", 2);
    std.debug.print("{} {d}\n", .{ ok, totalQty(&items) });
}`, expect: "false 1" },
    { run: zig`
{
    var items = [_]Stock{ .{ .name = "pin", .qty = 1 }, .{ .name = "pin", .qty = 2 } };
    _ = restock(&items, "pin", 5);
    std.debug.print("{d} {d}\n", .{ items[0].qty, items[1].qty });
}`, expect: "6 2", hidden: true },
    { run: zig`
{
    var items = [_]Stock{ .{ .name = "axe", .qty = 0 }, .{ .name = "saw", .qty = 7 } };
    _ = restock(&items, "saw", 3);
    _ = restock(&items, "axe", 2);
    std.debug.print("{d} {d} {d}\n", .{ items[0].qty, items[1].qty, totalQty(&items) });
}`, expect: "2 10 12", hidden: true },
    { run: zig`
{
    var items = [_]Stock{};
    std.debug.print("{}\n", .{restock(&items, "any", 1)});
}`, expect: "false", hidden: true },
  ],
  explain: L(
    "var item = items[i] copies the struct, so += changes the copy. A pointer, &items[i], writes into the slice itself.",
    "var item = items[i] copia el struct, así que += cambia la copia. Un puntero, &items[i], escribe en el slice mismo.",
    "var item = items[i] は構造体のコピーなので += はコピーを変える。ポインタ &items[i] ならスライス本体に書く。",
  ),
};

/** Senior debug (paper): splitScalar yields empty fields that parseInt rejects. */
export const sumCsvDebug: ExamQuestion = {
  slug: "sum-csv",
  kind: "debug",
  mode: "paper",
  topic: "errors",
  difficulty: 3,
  prompt: L("Debug: the CSV sum with gaps", "Depura: la suma CSV con huecos", "デバッグ：空欄のある CSV の合計"),
  brief: L(
    "sumCsv(line) should add the numbers in a comma-separated line, ignoring spaces around them and skipping empty fields, and return the sum and how many numbers it read. A bad number must return its parse error. But sumCsv(\"4,,5\") returns error.InvalidCharacter instead of sum 9, count 2.",
    "sumCsv(line) debería sumar los números de una línea separada por comas, ignorando espacios alrededor y saltando campos vacíos, y devolver la suma y cuántos leyó. Un número inválido debe devolver su error. Pero sumCsv(\"4,,5\") devuelve error.InvalidCharacter en vez de suma 9 y 2 números.",
    "sumCsv(line) はカンマ区切りの数を足し（前後の空白は無視、空欄は飛ばす）、合計と読んだ個数を返すはず。不正な数ならその解析エラーを返す。でも sumCsv(\"4,,5\") が合計 9・個数 2 ではなく error.InvalidCharacter を返す。",
  ),
  code: zig`
const std = @import("std");

const Totals = struct { sum: u32, count: u32 };

fn sumCsv(line: []const u8) !Totals {
    var t = Totals{ .sum = 0, .count = 0 };
    var it = std.mem.splitScalar(u8, line, ',');
    while (it.next()) |field| {
        const s = std.mem.trim(u8, field, " ");
        t.sum += try std.fmt.parseInt(u32, s, 10);
        t.count += 1;
    }
    return t;
}
`,
  bugLine: 7,
  solution: zig`
const std = @import("std");

const Totals = struct { sum: u32, count: u32 };

fn sumCsv(line: []const u8) !Totals {
    var t = Totals{ .sum = 0, .count = 0 };
    var it = std.mem.tokenizeScalar(u8, line, ',');
    while (it.next()) |field| {
        const s = std.mem.trim(u8, field, " ");
        t.sum += try std.fmt.parseInt(u32, s, 10);
        t.count += 1;
    }
    return t;
}
`,
  nearMiss: [
    // Swallows every parse error, so "4,x" sums to 4 instead of failing.
    zig`
const std = @import("std");

const Totals = struct { sum: u32, count: u32 };

fn sumCsv(line: []const u8) !Totals {
    var t = Totals{ .sum = 0, .count = 0 };
    var it = std.mem.splitScalar(u8, line, ',');
    while (it.next()) |field| {
        const s = std.mem.trim(u8, field, " ");
        t.sum += std.fmt.parseInt(u32, s, 10) catch continue;
        t.count += 1;
    }
    return t;
}
`,
    // splitSequence still yields the empty field between two commas.
    zig`
const std = @import("std");

const Totals = struct { sum: u32, count: u32 };

fn sumCsv(line: []const u8) !Totals {
    var t = Totals{ .sum = 0, .count = 0 };
    var it = std.mem.splitSequence(u8, line, ",");
    while (it.next()) |field| {
        const s = std.mem.trim(u8, field, " ");
        t.sum += try std.fmt.parseInt(u32, s, 10);
        t.count += 1;
    }
    return t;
}
`,
  ],
  tests: [
    { run: zig`
if (sumCsv("4,,5")) |t| {
    std.debug.print("{d} {d}\n", .{ t.sum, t.count });
} else |e| std.debug.print("{s}\n", .{@errorName(e)});`, expect: "9 2" },
    { run: zig`
if (sumCsv("1, 2 ,3")) |t| {
    std.debug.print("{d} {d}\n", .{ t.sum, t.count });
} else |e| std.debug.print("{s}\n", .{@errorName(e)});`, expect: "6 3" },
    { run: zig`
if (sumCsv("")) |t| {
    std.debug.print("{d} {d}\n", .{ t.sum, t.count });
} else |e| std.debug.print("{s}\n", .{@errorName(e)});`, expect: "0 0", hidden: true },
    { run: zig`
if (sumCsv("4,x")) |t| {
    std.debug.print("{d} {d}\n", .{ t.sum, t.count });
} else |e| std.debug.print("{s}\n", .{@errorName(e)});`, expect: "InvalidCharacter", hidden: true },
    { run: zig`
if (sumCsv(",7,")) |t| {
    std.debug.print("{d} {d}\n", .{ t.sum, t.count });
} else |e| std.debug.print("{s}\n", .{@errorName(e)});`, expect: "7 1", hidden: true },
  ],
  explain: L(
    "splitScalar returns the empty field between two commas, and parseInt(\"\") fails. tokenizeScalar skips empty fields.",
    "splitScalar devuelve el campo vacío entre dos comas y parseInt(\"\") falla. tokenizeScalar salta los campos vacíos.",
    "splitScalar は2つのカンマの間の空欄も返し、parseInt(\"\") が失敗する。tokenizeScalar は空欄を飛ばす。",
  ),
};

/** Senior debug (paper): removing while walking forward skips the next element. */
export const removeEvensDebug: ExamQuestion = {
  slug: "remove-evens",
  kind: "debug",
  mode: "paper",
  topic: "containers",
  difficulty: 3,
  prompt: L("Debug: the evens that survive", "Depura: los pares que sobreviven", "デバッグ：生き残る偶数"),
  brief: L(
    "removeEvens(list) should remove every even number from an ArrayList(i32), keeping the others in order. But for [2, 4, 5] the list ends as { 4, 5 } instead of { 5 }.",
    "removeEvens(list) debería quitar todos los pares de un ArrayList(i32) y dejar los demás en orden. Pero con [2, 4, 5] la lista queda { 4, 5 } en vez de { 5 }.",
    "removeEvens(list) は ArrayList(i32) から偶数をすべて取り除き、残りの順序は保つはず。でも [2, 4, 5] が { 5 } ではなく { 4, 5 } になる。",
  ),
  code: zig`
const std = @import("std");

fn removeEvens(list: *std.ArrayList(i32)) void {
    var i: usize = 0;
    while (i < list.items.len) : (i += 1) {
        if (@rem(list.items[i], 2) == 0) {
            _ = list.orderedRemove(i);
        }
    }
}
`,
  bugLine: 5,
  solution: zig`
const std = @import("std");

fn removeEvens(list: *std.ArrayList(i32)) void {
    var i: usize = 0;
    while (i < list.items.len) {
        if (@rem(list.items[i], 2) == 0) {
            _ = list.orderedRemove(i);
        } else i += 1;
    }
}
`,
  nearMiss: [
    // swapRemove does not skip, but it scrambles the order of what is left.
    zig`
const std = @import("std");

fn removeEvens(list: *std.ArrayList(i32)) void {
    var i: usize = 0;
    while (i < list.items.len) {
        if (@rem(list.items[i], 2) == 0) {
            _ = list.swapRemove(i);
        } else i += 1;
    }
}
`,
    // Only the first even number is removed.
    zig`
const std = @import("std");

fn removeEvens(list: *std.ArrayList(i32)) void {
    for (list.items, 0..) |x, i| {
        if (@rem(x, 2) == 0) {
            _ = list.orderedRemove(i);
            return;
        }
    }
}
`,
  ],
  tests: [
    { run: zig`
{
    const gpa = std.heap.page_allocator;
    var list: std.ArrayList(i32) = .empty;
    defer list.deinit(gpa);
    try list.appendSlice(gpa, &.{ 2, 4, 5 });
    removeEvens(&list);
    std.debug.print("{any}\n", .{list.items});
}`, expect: "{ 5 }" },
    { run: zig`
{
    const gpa = std.heap.page_allocator;
    var list: std.ArrayList(i32) = .empty;
    defer list.deinit(gpa);
    try list.appendSlice(gpa, &.{ 1, 2, 3 });
    removeEvens(&list);
    std.debug.print("{any}\n", .{list.items});
}`, expect: "{ 1, 3 }" },
    { run: zig`
{
    const gpa = std.heap.page_allocator;
    var list: std.ArrayList(i32) = .empty;
    defer list.deinit(gpa);
    try list.appendSlice(gpa, &.{ 8, 6, 4, 2 });
    removeEvens(&list);
    std.debug.print("{d}\n", .{list.items.len});
}`, expect: "0", hidden: true },
    { run: zig`
{
    const gpa = std.heap.page_allocator;
    var list: std.ArrayList(i32) = .empty;
    defer list.deinit(gpa);
    try list.appendSlice(gpa, &.{ 2, 3, 4, 5, -6, -7 });
    removeEvens(&list);
    std.debug.print("{any}\n", .{list.items});
}`, expect: "{ 3, 5, -7 }", hidden: true },
  ],
  explain: L(
    "orderedRemove(i) shifts the next item into slot i, then i += 1 jumps past it. Advance i only when nothing was removed.",
    "orderedRemove(i) mueve el siguiente elemento a la posición i y luego i += 1 lo salta. Avanza i solo si no se quitó nada.",
    "orderedRemove(i) で次の要素が i に詰まるのに、i += 1 でそれを飛ばす。削除しなかった時だけ i を進める。",
  ),
};

export const juniorTraceDebug: ExamQuestion[] = [wrapAddTrace, digitSumTrace];
export const midTraceDebug: ExamQuestion[] = [continueExprTrace, sliceAliasTrace, lastIndexDebug, averageOverflowDebug];
export const seniorTraceDebug: ExamQuestion[] = [deferRecursionTrace, restockDebug, sumCsvDebug, removeEvensDebug];
