import type { CodeTaskBeat, ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Coding tasks for planet Comptia (Zig 0.15.2, Debug, on Compiler Explorer). The player's file holds
// `const std = @import("std");` and declarations only; the harness appends `pub fn main() !void` with
// the tests, so tests may use `try`. Tests print with std.debug.print, one line each, and wrap
// multi-line bodies in `{ }` so their locals never clash. Any implementation that passes is accepted.

/** Zig source as written: backslashes stay literal (`\n` inside Zig strings), leading newline dropped. */
const zig = (s: TemplateStringsArray): string => s.raw[0].replace(/^\n/, "");

// ─── Region bosses ──────────────────────────────────────────────────────────

/** Forge Village boss: bytes, loops and integers that must not overflow. */
export const rotateLettersTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the letter wheel", "Mini proyecto: la rueda de letras", "ミニ課題：文字の歯車"),
  brief: L(
    "Write rotateLetters(buf: []u8, shift: u8) void. It changes buf in place: every lowercase letter a-z moves shift places forward, wrapping from z back to a (\"xyz\" by 3 is \"abc\"). Every other byte stays as it is. shift can be any u8, even 255: the Overflow Spark is waiting for a u8 that goes past 255!",
    "Escribe rotateLetters(buf: []u8, shift: u8) void. Cambia buf en su lugar: cada minúscula a-z avanza shift lugares y vuelve de la z a la a (\"xyz\" con 3 da \"abc\"). Los demás bytes no cambian. shift puede ser cualquier u8, incluso 255: ¡la Chispa Desborde espera un u8 que pase de 255!",
    "rotateLetters(buf: []u8, shift: u8) void を書こう。buf をその場で変える。小文字 a-z は shift 文字ぶん進み、z の次は a にもどる（\"xyz\" を 3 なら \"abc\"）。ほかのバイトはそのまま。shift は 255 もありうる。オーバーフロー火花は u8 があふれるのを待っている！",
  ),
  starter: zig`
const std = @import("std");

fn rotateLetters(buf: []u8, shift: u8) void {
    // your code here
    _ = buf;
    _ = shift;
}
`,
  solution: zig`
const std = @import("std");

fn rotateLetters(buf: []u8, shift: u8) void {
    for (buf) |*c| {
        if (c.* >= 'a' and c.* <= 'z') {
            c.* = 'a' + (c.* - 'a' + shift % 26) % 26;
        }
    }
}
`,
  nearMiss: [
    // Adds first and wraps after: 'z' + 255 overflows a u8 and panics.
    zig`
const std = @import("std");

fn rotateLetters(buf: []u8, shift: u8) void {
    for (buf) |*c| {
        if (c.* >= 'a' and c.* <= 'z') {
            c.* += shift;
            if (c.* > 'z') c.* -= 26;
        }
    }
}
`,
    // Rotates every byte, not just the lowercase letters.
    zig`
const std = @import("std");

fn rotateLetters(buf: []u8, shift: u8) void {
    for (buf) |*c| {
        c.* = 'a' + (c.* -% 'a' +% shift % 26) % 26;
    }
}
`,
  ],
  tests: [
    { run: zig`
{
    var b = "abc".*;
    rotateLetters(&b, 1);
    std.debug.print("[{s}]\n", .{&b});
}`, expect: "[bcd]" },
    { run: zig`
{
    var b = "xyz".*;
    rotateLetters(&b, 3);
    std.debug.print("[{s}]\n", .{&b});
}`, expect: "[abc]" },
    { run: zig`
{
    var b = "Hi, zig!".*;
    rotateLetters(&b, 1);
    std.debug.print("[{s}]\n", .{&b});
}`, expect: "[Hj, ajh!]", hidden: true },
    { run: zig`
{
    var b = "fire".*;
    rotateLetters(&b, 26);
    std.debug.print("[{s}]\n", .{&b});
}`, expect: "[fire]", hidden: true },
    { run: zig`
{
    var b = "zz".*;
    rotateLetters(&b, 255);
    std.debug.print("[{s}]\n", .{&b});
}`, expect: "[uu]", hidden: true },
  ],
  hint: L(
    "Work with the letter's position 0-25, shrink the shift with % 26 first, and wrap again with % 26.",
    "Trabaja con la posición de la letra (0-25), reduce antes el shift con % 26 y vuelve a envolver con % 26.",
    "文字の位置 0〜25 で考え、先に shift を % 26 で小さくし、最後にもう一度 % 26 で回そう。",
  ),
  note: "recap-bytes",
  explain: L(
    "Only touch a-z. c - 'a' is 0-25; add shift % 26 (at most 50, fits a u8), wrap with % 26 and add 'a' back. Adding 255 straight to 'z' overflows.",
    "Solo toca a-z. c - 'a' va de 0 a 25; suma shift % 26 (máximo 50, cabe en u8), envuelve con % 26 y suma 'a'. Sumar 255 directo a 'z' desborda.",
    "a-z だけ変える。c - 'a' は 0〜25。shift % 26 を足しても最大 50 で u8 に収まる。% 26 で回して 'a' を足す。",
  ),
};

/** Optional Forest boss: an error union around an optional. */
export const lookupTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the forest roll call", "Mini proyecto: lista del bosque", "ミニ課題：森の点呼"),
  brief: L(
    "Write lookup(names: []const []const u8, hps: []const u32, name: []const u8) error{Mismatch}!?u32. names[i] has hps[i] hit points. If the two slices have different lengths, return error.Mismatch (before searching). Otherwise return the hp of the first name equal to name, or null if nobody has that name. Not 0: a hero can really have 0 hp!",
    "Escribe lookup(names: []const []const u8, hps: []const u32, name: []const u8) error{Mismatch}!?u32. names[i] tiene hps[i] puntos de vida. Si los slices tienen largos distintos, devuelve error.Mismatch (antes de buscar). Si no, devuelve el hp del primer nombre igual a name, o null si nadie se llama así. No 0: ¡un héroe puede tener 0 de vida!",
    "lookup(names: []const []const u8, hps: []const u32, name: []const u8) error{Mismatch}!?u32 を書こう。names[i] の HP は hps[i]。長さがちがえば（探す前に）error.Mismatch。そうでなければ name と同じ最初の名前の HP を、だれもいなければ null を返す。0 ではない。HP 0 の勇者もいる！",
  ),
  starter: zig`
const std = @import("std");

fn lookup(names: []const []const u8, hps: []const u32, name: []const u8) error{Mismatch}!?u32 {
    // your code here
    _ = names;
    _ = hps;
    _ = name;
    return null;
}
`,
  solution: zig`
const std = @import("std");

fn lookup(names: []const []const u8, hps: []const u32, name: []const u8) error{Mismatch}!?u32 {
    if (names.len != hps.len) return error.Mismatch;
    for (names, hps) |n, hp| {
        if (std.mem.eql(u8, n, name)) return hp;
    }
    return null;
}
`,
  nearMiss: [
    // Searches by index and never checks the lengths.
    zig`
const std = @import("std");

fn lookup(names: []const []const u8, hps: []const u32, name: []const u8) error{Mismatch}!?u32 {
    for (names, 0..) |n, i| {
        if (std.mem.eql(u8, n, name)) return hps[i];
    }
    if (names.len != hps.len) return error.Mismatch;
    return null;
}
`,
    // Uses 0 as "not found" instead of null.
    zig`
const std = @import("std");

fn lookup(names: []const []const u8, hps: []const u32, name: []const u8) error{Mismatch}!?u32 {
    if (names.len != hps.len) return error.Mismatch;
    for (names, hps) |n, hp| {
        if (std.mem.eql(u8, n, name)) return hp;
    }
    return 0;
}
`,
  ],
  tests: [
    { run: zig`
{
    const r = lookup(&.{ "ada", "bo" }, &.{ 30, 12 }, "bo");
    if (r) |hp| std.debug.print("{?d}\n", .{hp}) else |e| std.debug.print("{s}\n", .{@errorName(e)});
}`, expect: "12" },
    { run: zig`
{
    const r = lookup(&.{ "ada", "bo" }, &.{ 30, 12 }, "cy");
    if (r) |hp| std.debug.print("{?d}\n", .{hp}) else |e| std.debug.print("{s}\n", .{@errorName(e)});
}`, expect: "null" },
    { run: zig`
{
    const r = lookup(&.{ "ada", "bo" }, &.{30}, "ada");
    if (r) |hp| std.debug.print("{?d}\n", .{hp}) else |e| std.debug.print("{s}\n", .{@errorName(e)});
}`, expect: "Mismatch", hidden: true },
    { run: zig`
{
    const r = lookup(&.{ "bo", "bo" }, &.{ 0, 9 }, "bo");
    if (r) |hp| std.debug.print("{?d}\n", .{hp}) else |e| std.debug.print("{s}\n", .{@errorName(e)});
}`, expect: "0", hidden: true },
    { run: zig`
{
    const r = lookup(&[_][]const u8{}, &[_]u32{}, "x");
    if (r) |hp| std.debug.print("{?d}\n", .{hp}) else |e| std.debug.print("{s}\n", .{@errorName(e)});
}`, expect: "null", hidden: true },
  ],
  hint: L(
    "Compare the lengths before the loop. Compare names with std.mem.eql, and say \"nobody\" with the optional.",
    "Compara los largos antes del bucle. Compara nombres con std.mem.eql y di \"nadie\" con el opcional.",
    "ループの前に長さを比べよう。名前は std.mem.eql で比べ、「いない」はオプショナルで表す。",
  ),
  note: "recap-optionals",
  explain: L(
    "Return error.Mismatch first, then loop with for (names, hps). A match returns hp; no match returns null, never 0, because 0 is a real hp.",
    "Devuelve error.Mismatch primero y luego recorre con for (names, hps). Si coincide, devuelve hp; si no, null, nunca 0, porque 0 es un hp real.",
    "まず error.Mismatch を返し、for (names, hps) で探す。見つかれば hp、なければ null。0 は本物の HP なので使わない。",
  ),
};

/** Struct Mountain boss: structs in a slice, changed through pointers. */
export const healAllTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: heal the party", "Mini proyecto: cura al grupo", "ミニ課題：パーティを回復"),
  brief: L(
    "Hero is struct { hp: u32, max_hp: u32 }. Write healAll(heroes: []Hero, amount: u32) usize. Add amount to the hp of every hero in the slice, never above max_hp, and return how many heroes were hurt (hp < max_hp) before healing. The heroes in the caller's slice must change. amount can be huge (up to maxInt(u32)) without overflowing.",
    "Hero es struct { hp: u32, max_hp: u32 }. Escribe healAll(heroes: []Hero, amount: u32) usize. Suma amount al hp de cada héroe del slice, nunca por encima de max_hp, y devuelve cuántos estaban heridos (hp < max_hp) antes de curar. Los héroes del slice del que llama deben cambiar. amount puede ser enorme (hasta maxInt(u32)) sin desbordar.",
    "Hero は struct { hp: u32, max_hp: u32 }。healAll(heroes: []Hero, amount: u32) usize を書こう。スライスの全員の hp に amount を足すが max_hp は超えない。回復前にケガしていた（hp < max_hp）人数を返す。呼び出し側のスライスの勇者が変わること。amount は maxInt(u32) まであり、あふれてはだめ。",
  ),
  starter: zig`
const std = @import("std");

const Hero = struct { hp: u32, max_hp: u32 };

fn healAll(heroes: []Hero, amount: u32) usize {
    // your code here
    _ = heroes;
    _ = amount;
    return 0;
}
`,
  solution: zig`
const std = @import("std");

const Hero = struct { hp: u32, max_hp: u32 };

fn healAll(heroes: []Hero, amount: u32) usize {
    var hurt: usize = 0;
    for (heroes) |*h| {
        if (h.hp < h.max_hp) {
            hurt += 1;
            h.hp = @min(h.hp +| amount, h.max_hp);
        }
    }
    return hurt;
}
`,
  nearMiss: [
    // Heals a copy of each hero: the count is right, the party is not healed.
    zig`
const std = @import("std");

const Hero = struct { hp: u32, max_hp: u32 };

fn healAll(heroes: []Hero, amount: u32) usize {
    var hurt: usize = 0;
    for (heroes) |h| {
        var copy = h;
        if (copy.hp < copy.max_hp) {
            hurt += 1;
            copy.hp = @min(copy.hp +| amount, copy.max_hp);
        }
    }
    return hurt;
}
`,
    // Caps at max_hp, but h.hp + amount overflows a u32 for a huge amount.
    zig`
const std = @import("std");

const Hero = struct { hp: u32, max_hp: u32 };

fn healAll(heroes: []Hero, amount: u32) usize {
    var hurt: usize = 0;
    for (heroes) |*h| {
        if (h.hp < h.max_hp) {
            hurt += 1;
            h.hp = @min(h.hp + amount, h.max_hp);
        }
    }
    return hurt;
}
`,
    // Forgets the cap.
    zig`
const std = @import("std");

const Hero = struct { hp: u32, max_hp: u32 };

fn healAll(heroes: []Hero, amount: u32) usize {
    var hurt: usize = 0;
    for (heroes) |*h| {
        if (h.hp < h.max_hp) hurt += 1;
        h.hp +|= amount;
    }
    return hurt;
}
`,
  ],
  tests: [
    { run: zig`
{
    var party = [_]Hero{ .{ .hp = 5, .max_hp = 10 }, .{ .hp = 10, .max_hp = 10 } };
    const n = healAll(&party, 3);
    std.debug.print("{d} {d} {d}\n", .{ n, party[0].hp, party[1].hp });
}`, expect: "1 8 10" },
    { run: zig`
{
    var party = [_]Hero{ .{ .hp = 9, .max_hp = 10 }, .{ .hp = 0, .max_hp = 4 } };
    const n = healAll(&party, 5);
    std.debug.print("{d} {d} {d}\n", .{ n, party[0].hp, party[1].hp });
}`, expect: "2 10 4" },
    { run: zig`
{
    var party = [_]Hero{ .{ .hp = 7, .max_hp = 20 } };
    _ = healAll(&party, 2);
    const n = healAll(&party, 2);
    std.debug.print("{d} {d}\n", .{ n, party[0].hp });
}`, expect: "1 11", hidden: true },
    { run: zig`
{
    var party = [_]Hero{ .{ .hp = 100, .max_hp = 4000000000 } };
    const n = healAll(&party, std.math.maxInt(u32));
    std.debug.print("{d} {d}\n", .{ n, party[0].hp });
}`, expect: "1 4000000000", hidden: true },
    { run: zig`
{
    var party = [_]Hero{ .{ .hp = 3, .max_hp = 3 }, .{ .hp = 1, .max_hp = 2 }, .{ .hp = 2, .max_hp = 2 } };
    const n = healAll(&party, 1);
    std.debug.print("{d} {d} {d} {d}\n", .{ n, party[0].hp, party[1].hp, party[2].hp });
}`, expect: "1 3 2 2", hidden: true },
  ],
  hint: L(
    "A plain |h| capture is a copy. Capture each hero by pointer, and cap the sum without letting it overflow.",
    "Una captura |h| simple es una copia. Captura cada héroe por puntero y limita la suma sin que desborde.",
    "ただの |h| はコピー。勇者はポインタで受け取り、足し算はあふれないように上限をかけよう。",
  ),
  note: "recap-copies",
  explain: L(
    "for (heroes) |*h| gives a pointer, so h.hp changes the caller's hero. h.hp +| amount saturates instead of overflowing; @min caps it at max_hp.",
    "for (heroes) |*h| da un puntero, así h.hp cambia el héroe del que llama. h.hp +| amount satura en vez de desbordar; @min lo limita a max_hp.",
    "|*h| はポインタなので h.hp が呼び出し側を変える。+| は飽和してあふれない。@min で max_hp に抑える。",
  ),
};

/** Comptime Tower boss: an ArrayList handed to the caller as an owned slice. */
export const keepOddsTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the leak-free sieve", "Mini proyecto: el filtro sin fugas", "ミニ課題：もれないふるい"),
  brief: L(
    "Write keepOdds(alloc: std.mem.Allocator, xs: []const i32) ![]i32. Return a new slice, allocated with alloc, holding the odd numbers of xs in their order (negative ones too: -3 is odd). The caller owns the result and frees it with alloc.free. The tests check with a DebugAllocator that nothing leaks: the Leak Jelly feeds on every byte you forget!",
    "Escribe keepOdds(alloc: std.mem.Allocator, xs: []const i32) ![]i32. Devuelve un slice nuevo, reservado con alloc, con los impares de xs en su orden (también negativos: -3 es impar). El que llama es dueño del resultado y lo libera con alloc.free. Las pruebas revisan con un DebugAllocator que nada se fugue: ¡la Gelatina Fuga come cada byte que olvidas!",
    "keepOdds(alloc: std.mem.Allocator, xs: []const i32) ![]i32 を書こう。xs の奇数を順番どおりに、alloc で確保した新しいスライスで返す（負の数も。-3 は奇数）。結果は呼び出し側のもので alloc.free で解放する。テストは DebugAllocator でもれを調べる。リークゼリーは忘れたバイトを食べる！",
  ),
  starter: zig`
const std = @import("std");

fn keepOdds(alloc: std.mem.Allocator, xs: []const i32) ![]i32 {
    // your code here
    _ = xs;
    return alloc.alloc(i32, 0);
}
`,
  solution: zig`
const std = @import("std");

fn keepOdds(alloc: std.mem.Allocator, xs: []const i32) ![]i32 {
    var list: std.ArrayList(i32) = .empty;
    errdefer list.deinit(alloc);
    for (xs) |x| {
        if (@mod(x, 2) == 1) try list.append(alloc, x);
    }
    return list.toOwnedSlice(alloc);
}
`,
  nearMiss: [
    // @rem keeps the sign: @rem(-3, 2) is -1, so negative odd numbers are dropped.
    zig`
const std = @import("std");

fn keepOdds(alloc: std.mem.Allocator, xs: []const i32) ![]i32 {
    var list: std.ArrayList(i32) = .empty;
    errdefer list.deinit(alloc);
    for (xs) |x| {
        if (@rem(x, 2) == 1) try list.append(alloc, x);
    }
    return list.toOwnedSlice(alloc);
}
`,
    // Hands out list.items: the caller frees a slice shorter than the real allocation.
    zig`
const std = @import("std");

fn keepOdds(alloc: std.mem.Allocator, xs: []const i32) ![]i32 {
    var list: std.ArrayList(i32) = .empty;
    for (xs) |x| {
        if (@mod(x, 2) == 1) try list.append(alloc, x);
    }
    return list.items;
}
`,
  ],
  tests: [
    { run: zig`
{
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const a = gpa.allocator();
    const out = try keepOdds(a, &.{ 1, 2, 3, 4, 5 });
    std.debug.print("{any}", .{out});
    a.free(out);
    std.debug.print(" {s}\n", .{@tagName(gpa.deinit())});
}`, expect: "{ 1, 3, 5 } ok" },
    { run: zig`
{
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const a = gpa.allocator();
    const out = try keepOdds(a, &.{ 2, 4, 6 });
    std.debug.print("{d}", .{out.len});
    a.free(out);
    std.debug.print(" {s}\n", .{@tagName(gpa.deinit())});
}`, expect: "0 ok" },
    { run: zig`
{
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const a = gpa.allocator();
    const out = try keepOdds(a, &.{ -3, -2, 7, -1 });
    std.debug.print("{any}", .{out});
    a.free(out);
    std.debug.print(" {s}\n", .{@tagName(gpa.deinit())});
}`, expect: "{ -3, 7, -1 } ok", hidden: true },
    { run: zig`
{
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const a = gpa.allocator();
    const out = try keepOdds(a, &.{ 9, 11, 13, 15, 17, 19, 21 });
    std.debug.print("{any}", .{out});
    a.free(out);
    std.debug.print(" {s}\n", .{@tagName(gpa.deinit())});
}`, expect: "{ 9, 11, 13, 15, 17, 19, 21 } ok", hidden: true },
    { run: zig`
{
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const a = gpa.allocator();
    const out = try keepOdds(a, &[_]i32{});
    std.debug.print("{d}", .{out.len});
    a.free(out);
    std.debug.print(" {s}\n", .{@tagName(gpa.deinit())});
}`, expect: "0 ok", hidden: true },
  ],
  hint: L(
    "Collect into an ArrayList that starts at .empty and give the caller exactly its own slice. Mind odd negatives.",
    "Junta en un ArrayList que empieza en .empty y entrega un slice propio exacto. Ojo con los impares negativos.",
    ".empty から始めた ArrayList に集め、呼び出し側には自分専用のスライスを渡そう。負の奇数に注意。",
  ),
  note: "recap-lists",
  explain: L(
    "toOwnedSlice(alloc) shrinks the list to an exact slice the caller frees. @mod(x, 2) is 1 for every odd x; @rem(-3, 2) is -1.",
    "toOwnedSlice(alloc) deja un slice exacto que libera el que llama. @mod(x, 2) es 1 para todo impar; @rem(-3, 2) es -1.",
    "toOwnedSlice(alloc) は呼び出し側が解放するぴったりのスライスを返す。奇数なら @mod(x, 2) は 1、@rem(-3, 2) は -1。",
  ),
};

// ─── Junior screening (normal editor) ──────────────────────────────────────

/** Junior: optionals over a slice. */
export const maxValueTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "optionals",
  difficulty: 1,
  prompt: L("Coding: the largest number", "Código: el número más grande", "コーディング：最大の数"),
  brief: L(
    "Write maxValue(xs: []const i32) ?i32: return the largest number in xs, or null when xs is empty. The numbers can all be negative.",
    "Escribe maxValue(xs: []const i32) ?i32: devuelve el número más grande de xs, o null si xs está vacío. Los números pueden ser todos negativos.",
    "maxValue(xs: []const i32) ?i32 を書こう。xs の最大の数を返す。xs が空なら null。全部が負の数のこともある。",
  ),
  starter: zig`
const std = @import("std");

fn maxValue(xs: []const i32) ?i32 {
    // your code here
    _ = xs;
    return null;
}
`,
  solution: zig`
const std = @import("std");

fn maxValue(xs: []const i32) ?i32 {
    if (xs.len == 0) return null;
    var best = xs[0];
    for (xs[1..]) |x| {
        if (x > best) best = x;
    }
    return best;
}
`,
  nearMiss: [
    // Starts the running maximum at 0: wrong when every number is negative.
    zig`
const std = @import("std");

fn maxValue(xs: []const i32) ?i32 {
    if (xs.len == 0) return null;
    var best: i32 = 0;
    for (xs) |x| {
        if (x > best) best = x;
    }
    return best;
}
`,
    // Off by one: never looks at the last number.
    zig`
const std = @import("std");

fn maxValue(xs: []const i32) ?i32 {
    if (xs.len == 0) return null;
    var best = xs[0];
    for (0..xs.len - 1) |i| {
        if (xs[i] > best) best = xs[i];
    }
    return best;
}
`,
  ],
  tests: [
    { run: 'std.debug.print("{?d}\\n", .{maxValue(&.{ 3, 9, 2 })});', expect: "9" },
    { run: 'std.debug.print("{?d}\\n", .{maxValue(&[_]i32{})});', expect: "null" },
    { run: 'std.debug.print("{?d}\\n", .{maxValue(&.{ -5, -2, -9 })});', expect: "-2", hidden: true },
    { run: 'std.debug.print("{?d}\\n", .{maxValue(&.{ 1, 4, 8 })});', expect: "8", hidden: true },
    { run: 'std.debug.print("{?d}\\n", .{maxValue(&.{7})});', expect: "7", hidden: true },
  ],
  explain: L(
    "Return null for an empty slice, then start from xs[0], not 0, so all-negative input works, and look at every element.",
    "Devuelve null si el slice está vacío; luego empieza desde xs[0], no desde 0, para que funcione con negativos, y mira cada elemento.",
    "空なら null。最初の値は 0 ではなく xs[0] にすれば負の数だけでも正しい。全要素を見ること。",
  ),
};

/** Junior: strings are byte slices. */
export const palindromeTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "slices",
  difficulty: 1,
  prompt: L("Coding: palindrome check", "Código: ¿es palíndromo?", "コーディング：回文チェック"),
  brief: L(
    "Write isPalindrome(s: []const u8) bool: true when s reads the same forwards and backwards, ignoring ASCII case (\"Level\" is true). The empty string is a palindrome. Don't skip any character, spaces included.",
    "Escribe isPalindrome(s: []const u8) bool: true si s se lee igual al derecho y al revés, sin importar mayúsculas ASCII (\"Level\" da true). El string vacío es palíndromo. No saltes ningún carácter, tampoco los espacios.",
    "isPalindrome(s: []const u8) bool を書こう。前から読んでも後ろから読んでも同じなら true。ASCII の大文字小文字は区別しない（\"Level\" は true）。空文字列も回文。空白も含め、どの文字も飛ばさない。",
  ),
  starter: zig`
const std = @import("std");

fn isPalindrome(s: []const u8) bool {
    // your code here
    _ = s;
    return false;
}
`,
  solution: zig`
const std = @import("std");

fn isPalindrome(s: []const u8) bool {
    if (s.len == 0) return true;
    var i: usize = 0;
    var j: usize = s.len - 1;
    while (i < j) : ({
        i += 1;
        j -= 1;
    }) {
        if (std.ascii.toLower(s[i]) != std.ascii.toLower(s[j])) return false;
    }
    return true;
}
`,
  nearMiss: [
    // Case-sensitive: "Level" fails.
    zig`
const std = @import("std");

fn isPalindrome(s: []const u8) bool {
    for (0..s.len / 2) |i| {
        if (s[i] != s[s.len - 1 - i]) return false;
    }
    return true;
}
`,
    // s.len - 1 underflows on the empty string.
    zig`
const std = @import("std");

fn isPalindrome(s: []const u8) bool {
    var i: usize = 0;
    var j: usize = s.len - 1;
    while (i < j) : ({
        i += 1;
        j -= 1;
    }) {
        if (std.ascii.toLower(s[i]) != std.ascii.toLower(s[j])) return false;
    }
    return true;
}
`,
  ],
  tests: [
    { run: 'std.debug.print("{}\\n", .{isPalindrome("Level")});', expect: "true" },
    { run: 'std.debug.print("{}\\n", .{isPalindrome("zig")});', expect: "false" },
    { run: 'std.debug.print("{}\\n", .{isPalindrome("")});', expect: "true", hidden: true },
    { run: 'std.debug.print("{}\\n", .{isPalindrome("AbbA")});', expect: "true", hidden: true },
    { run: 'std.debug.print("{}\\n", .{isPalindrome("ab a")});', expect: "false", hidden: true },
    { run: 'std.debug.print("{}\\n", .{isPalindrome("x")});', expect: "true", hidden: true },
  ],
  explain: L(
    "Compare s[i] with s[len-1-i] after std.ascii.toLower. Handle the empty string before computing s.len - 1: a usize can't go below 0.",
    "Compara s[i] con s[len-1-i] tras std.ascii.toLower. Atiende el string vacío antes de calcular s.len - 1: un usize no baja de 0.",
    "std.ascii.toLower してから s[i] と s[len-1-i] を比べる。s.len - 1 の前に空文字列を処理。usize は 0 未満にならない。",
  ),
};

/** Junior: an error union from a small parser. */
export const sumDigitsTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "errors",
  difficulty: 1,
  prompt: L("Coding: add up the digits", "Código: suma los dígitos", "コーディング：数字の合計"),
  brief: L(
    "Write sumDigits(s: []const u8) error{NotADigit}!u32: the sum of the digit characters in s (\"123\" gives 6). If any character is not 0-9, return error.NotADigit instead. The empty string gives 0.",
    "Escribe sumDigits(s: []const u8) error{NotADigit}!u32: la suma de los dígitos de s (\"123\" da 6). Si algún carácter no es 0-9, devuelve error.NotADigit. El string vacío da 0.",
    "sumDigits(s: []const u8) error{NotADigit}!u32 を書こう。s の数字の合計を返す（\"123\" なら 6）。0-9 以外の文字があれば error.NotADigit。空文字列は 0。",
  ),
  starter: zig`
const std = @import("std");

fn sumDigits(s: []const u8) error{NotADigit}!u32 {
    // your code here
    _ = s;
    return 0;
}
`,
  solution: zig`
const std = @import("std");

fn sumDigits(s: []const u8) error{NotADigit}!u32 {
    var total: u32 = 0;
    for (s) |c| {
        if (c < '0' or c > '9') return error.NotADigit;
        total += c - '0';
    }
    return total;
}
`,
  nearMiss: [
    // Skips bad characters instead of reporting them.
    zig`
const std = @import("std");

fn sumDigits(s: []const u8) error{NotADigit}!u32 {
    var total: u32 = 0;
    for (s) |c| {
        if (c < '0' or c > '9') continue;
        total += c - '0';
    }
    return total;
}
`,
    // Adds the character codes, not the digit values.
    zig`
const std = @import("std");

fn sumDigits(s: []const u8) error{NotADigit}!u32 {
    var total: u32 = 0;
    for (s) |c| {
        if (c < '0' or c > '9') return error.NotADigit;
        total += c;
    }
    return total;
}
`,
  ],
  tests: [
    { run: 'std.debug.print("{d}\\n", .{try sumDigits("123")});', expect: "6" },
    { run: 'std.debug.print("{s}\\n", .{if (sumDigits("4a2")) |_| "ok" else |e| @errorName(e)});', expect: "NotADigit" },
    { run: 'std.debug.print("{d}\\n", .{try sumDigits("")});', expect: "0", hidden: true },
    { run: 'std.debug.print("{d}\\n", .{try sumDigits("9909")});', expect: "27", hidden: true },
    { run: 'std.debug.print("{s}\\n", .{if (sumDigits("12 3")) |_| "ok" else |e| @errorName(e)});', expect: "NotADigit", hidden: true },
  ],
  explain: L(
    "c - '0' turns the character '7' into the number 7. Any byte outside '0'...'9' must return error.NotADigit, not be skipped.",
    "c - '0' convierte el carácter '7' en el número 7. Cualquier byte fuera de '0'...'9' debe devolver error.NotADigit, no saltarse.",
    "c - '0' で文字 '7' が数 7 になる。'0'〜'9' 以外のバイトは飛ばさず error.NotADigit を返す。",
  ),
};

/** Junior: switch on integer ranges. */
export const gradeTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "control",
  difficulty: 1,
  prompt: L("Coding: score to grade", "Código: de puntaje a nota", "コーディング：点数を評価に"),
  brief: L(
    "Write grade(score: u8) u8 that returns a letter: 'A' for 90-100, 'B' for 80-89, 'C' for 70-79, 'F' for 0-69, and '?' for anything above 100 (an invalid score). Both ends of each range count.",
    "Escribe grade(score: u8) u8 que devuelva una letra: 'A' para 90-100, 'B' para 80-89, 'C' para 70-79, 'F' para 0-69 y '?' para más de 100 (puntaje inválido). Los dos extremos de cada rango cuentan.",
    "grade(score: u8) u8 を書こう。90〜100 は 'A'、80〜89 は 'B'、70〜79 は 'C'、0〜69 は 'F'、100 より上は無効なので '?' を返す。範囲の両端も含む。",
  ),
  starter: zig`
const std = @import("std");

fn grade(score: u8) u8 {
    // your code here
    _ = score;
    return 'F';
}
`,
  solution: zig`
const std = @import("std");

fn grade(score: u8) u8 {
    return switch (score) {
        90...100 => 'A',
        80...89 => 'B',
        70...79 => 'C',
        0...69 => 'F',
        else => '?',
    };
}
`,
  nearMiss: [
    // > instead of >=: 90 becomes a B.
    zig`
const std = @import("std");

fn grade(score: u8) u8 {
    if (score > 100) return '?';
    if (score > 90) return 'A';
    if (score > 80) return 'B';
    if (score > 70) return 'C';
    return 'F';
}
`,
    // Forgets invalid scores.
    zig`
const std = @import("std");

fn grade(score: u8) u8 {
    return switch (score) {
        90...255 => 'A',
        80...89 => 'B',
        70...79 => 'C',
        else => 'F',
    };
}
`,
  ],
  tests: [
    { run: 'std.debug.print("{c}\\n", .{grade(95)});', expect: "A" },
    { run: 'std.debug.print("{c}\\n", .{grade(72)});', expect: "C" },
    { run: 'std.debug.print("{c}{c}\\n", .{ grade(90), grade(89) });', expect: "AB", hidden: true },
    { run: 'std.debug.print("{c}{c}\\n", .{ grade(0), grade(69) });', expect: "FF", hidden: true },
    { run: 'std.debug.print("{c}{c}\\n", .{ grade(100), grade(101) });', expect: "A?", hidden: true },
  ],
  explain: L(
    "A switch with inclusive ranges (90...100) matches both ends. Ranges must cover every u8, so else catches the invalid scores above 100.",
    "Un switch con rangos inclusivos (90...100) incluye ambos extremos. Debe cubrir todo u8, así que else atrapa los puntajes inválidos sobre 100.",
    "switch の範囲 90...100 は両端を含む。u8 全体を網羅するので、100 超えの無効な点は else で受ける。",
  ),
};

// ─── Mid screening ─────────────────────────────────────────────────────────

/** Mid (editor): an owned slice built with an unmanaged ArrayList. */
export const joinWithTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "allocators",
  difficulty: 2,
  prompt: L("Coding: join with a separator", "Código: une con un separador", "コーディング：区切りでつなぐ"),
  brief: L(
    "Write joinWith(alloc: std.mem.Allocator, parts: []const []const u8, sep: u8) ![]u8: one new string with the parts in order and sep between each pair (never at the start or end). Empty parts still count (\"a\", \"\", \"b\" with '-' is \"a--b\"); no parts gives \"\". The caller frees the result with alloc.free, and nothing else may leak.",
    "Escribe joinWith(alloc: std.mem.Allocator, parts: []const []const u8, sep: u8) ![]u8: un string nuevo con las partes en orden y sep entre cada par (nunca al inicio ni al final). Las partes vacías cuentan (\"a\", \"\", \"b\" con '-' da \"a--b\"); sin partes da \"\". El que llama libera con alloc.free y nada más puede fugarse.",
    "joinWith(alloc: std.mem.Allocator, parts: []const []const u8, sep: u8) ![]u8 を書こう。parts を順につなぎ、あいだに sep を入れた新しい文字列を返す（先頭と末尾には入れない）。空の要素も数える（\"a\", \"\", \"b\" を '-' なら \"a--b\"）。要素なしは \"\"。呼び出し側が alloc.free で解放し、ほかにもれはないこと。",
  ),
  starter: zig`
const std = @import("std");

fn joinWith(alloc: std.mem.Allocator, parts: []const []const u8, sep: u8) ![]u8 {
    // your code here
    _ = parts;
    _ = sep;
    return alloc.alloc(u8, 0);
}
`,
  solution: zig`
const std = @import("std");

fn joinWith(alloc: std.mem.Allocator, parts: []const []const u8, sep: u8) ![]u8 {
    var list: std.ArrayList(u8) = .empty;
    errdefer list.deinit(alloc);
    for (parts, 0..) |p, i| {
        if (i > 0) try list.append(alloc, sep);
        try list.appendSlice(alloc, p);
    }
    return list.toOwnedSlice(alloc);
}
`,
  nearMiss: [
    // A separator after every part, the last one too.
    zig`
const std = @import("std");

fn joinWith(alloc: std.mem.Allocator, parts: []const []const u8, sep: u8) ![]u8 {
    var list: std.ArrayList(u8) = .empty;
    errdefer list.deinit(alloc);
    for (parts) |p| {
        try list.appendSlice(alloc, p);
        try list.append(alloc, sep);
    }
    return list.toOwnedSlice(alloc);
}
`,
    // Skips empty parts.
    zig`
const std = @import("std");

fn joinWith(alloc: std.mem.Allocator, parts: []const []const u8, sep: u8) ![]u8 {
    var list: std.ArrayList(u8) = .empty;
    errdefer list.deinit(alloc);
    for (parts) |p| {
        if (p.len == 0) continue;
        if (list.items.len > 0) try list.append(alloc, sep);
        try list.appendSlice(alloc, p);
    }
    return list.toOwnedSlice(alloc);
}
`,
  ],
  tests: [
    { run: zig`
{
    const a = std.heap.page_allocator;
    const s = try joinWith(a, &.{ "fire", "ice" }, ',');
    defer a.free(s);
    std.debug.print("[{s}]\n", .{s});
}`, expect: "[fire,ice]" },
    { run: zig`
{
    const a = std.heap.page_allocator;
    const s = try joinWith(a, &.{"solo"}, ',');
    defer a.free(s);
    std.debug.print("[{s}]\n", .{s});
}`, expect: "[solo]" },
    { run: zig`
{
    const a = std.heap.page_allocator;
    const s = try joinWith(a, &[_][]const u8{}, ',');
    defer a.free(s);
    std.debug.print("[{s}]\n", .{s});
}`, expect: "[]", hidden: true },
    { run: zig`
{
    const a = std.heap.page_allocator;
    const s = try joinWith(a, &.{ "a", "", "b" }, '-');
    defer a.free(s);
    std.debug.print("[{s}]\n", .{s});
}`, expect: "[a--b]", hidden: true },
    { run: zig`
{
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const a = gpa.allocator();
    const s = try joinWith(a, &.{ "x", "y", "z" }, ' ');
    std.debug.print("[{s}]", .{s});
    a.free(s);
    std.debug.print(" {s}\n", .{@tagName(gpa.deinit())});
}`, expect: "[x y z] ok", hidden: true },
  ],
  explain: L(
    "Append sep only before every part except the first, then return list.toOwnedSlice(alloc) so the caller gets exactly the bytes it must free.",
    "Agrega sep solo antes de cada parte menos la primera y devuelve list.toOwnedSlice(alloc) para que el que llama reciba justo lo que debe liberar.",
    "sep は2つ目以降の要素の前だけに足す。list.toOwnedSlice(alloc) を返せば、呼び出し側は解放すべきバイトをちょうど受け取る。",
  ),
};

/** Mid (editor): counting with a StringHashMap and a deterministic tie rule. */
export const mostFrequentTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "containers",
  difficulty: 2,
  prompt: L("Coding: the most frequent word", "Código: la palabra más frecuente", "コーディング：いちばん多い単語"),
  brief: L(
    "Write mostFrequent(alloc: std.mem.Allocator, text: []const u8) !?[]const u8: the word that appears most often in text, or null if there are no words. Words are separated by one or more spaces and are case-sensitive. On a tie, return the tied word that appears first in text. Use alloc for any map you need and free it before returning.",
    "Escribe mostFrequent(alloc: std.mem.Allocator, text: []const u8) !?[]const u8: la palabra que más aparece en text, o null si no hay palabras. Se separan con uno o más espacios y distinguen mayúsculas. Si empatan, devuelve la que aparece primero en text. Usa alloc para el map que necesites y libéralo antes de volver.",
    "mostFrequent(alloc: std.mem.Allocator, text: []const u8) !?[]const u8 を書こう。text で最も多く出る単語を、単語がなければ null を返す。単語は1つ以上の空白で区切られ、大文字小文字を区別する。同数なら text で先に出てくる単語。map は alloc で作り、返す前に解放する。",
  ),
  starter: zig`
const std = @import("std");

fn mostFrequent(alloc: std.mem.Allocator, text: []const u8) !?[]const u8 {
    // your code here
    _ = alloc;
    _ = text;
    return null;
}
`,
  solution: zig`
const std = @import("std");

fn mostFrequent(alloc: std.mem.Allocator, text: []const u8) !?[]const u8 {
    var counts = std.StringHashMap(u32).init(alloc);
    defer counts.deinit();
    var it = std.mem.tokenizeScalar(u8, text, ' ');
    while (it.next()) |w| {
        const e = try counts.getOrPut(w);
        if (!e.found_existing) e.value_ptr.* = 0;
        e.value_ptr.* += 1;
    }
    var best: ?[]const u8 = null;
    var best_n: u32 = 0;
    it.reset();
    while (it.next()) |w| {
        const n = counts.get(w).?;
        if (n > best_n) {
            best = w;
            best_n = n;
        }
    }
    return best;
}
`,
  nearMiss: [
    // One pass: on a tie it returns the word that reached the count first, not the one that appears first.
    zig`
const std = @import("std");

fn mostFrequent(alloc: std.mem.Allocator, text: []const u8) !?[]const u8 {
    var counts = std.StringHashMap(u32).init(alloc);
    defer counts.deinit();
    var best: ?[]const u8 = null;
    var best_n: u32 = 0;
    var it = std.mem.tokenizeScalar(u8, text, ' ');
    while (it.next()) |w| {
        const e = try counts.getOrPut(w);
        if (!e.found_existing) e.value_ptr.* = 0;
        e.value_ptr.* += 1;
        if (e.value_ptr.* > best_n) {
            best = w;
            best_n = e.value_ptr.*;
        }
    }
    return best;
}
`,
    // >= keeps the LAST tied word.
    zig`
const std = @import("std");

fn mostFrequent(alloc: std.mem.Allocator, text: []const u8) !?[]const u8 {
    var counts = std.StringHashMap(u32).init(alloc);
    defer counts.deinit();
    var it = std.mem.tokenizeScalar(u8, text, ' ');
    while (it.next()) |w| {
        const e = try counts.getOrPut(w);
        if (!e.found_existing) e.value_ptr.* = 0;
        e.value_ptr.* += 1;
    }
    var best: ?[]const u8 = null;
    var best_n: u32 = 0;
    it.reset();
    while (it.next()) |w| {
        const n = counts.get(w).?;
        if (n >= best_n) {
            best = w;
            best_n = n;
        }
    }
    return best;
}
`,
  ],
  tests: [
    { run: 'std.debug.print("{s}\\n", .{(try mostFrequent(std.heap.page_allocator, "red blue red")) orelse "none"});', expect: "red" },
    { run: 'std.debug.print("{s}\\n", .{(try mostFrequent(std.heap.page_allocator, "")) orelse "none"});', expect: "none" },
    { run: 'std.debug.print("{s}\\n", .{(try mostFrequent(std.heap.page_allocator, "b a a b")) orelse "none"});', expect: "b", hidden: true },
    { run: 'std.debug.print("{s}\\n", .{(try mostFrequent(std.heap.page_allocator, "  x  y y  ")) orelse "none"});', expect: "y", hidden: true },
    { run: 'std.debug.print("{s}\\n", .{(try mostFrequent(std.heap.page_allocator, "Zig zig ZIG zig")) orelse "none"});', expect: "zig", hidden: true },
    { run: 'std.debug.print("{s}\\n", .{(try mostFrequent(std.heap.page_allocator, "c b a")) orelse "none"});', expect: "c", hidden: true },
  ],
  explain: L(
    "Count every word in a StringHashMap, then walk the words again in text order and keep one only when its count is strictly bigger: ties stay with the first.",
    "Cuenta cada palabra en un StringHashMap y recórrelas otra vez en orden; cambia solo si la cuenta es estrictamente mayor: el empate queda con la primera.",
    "StringHashMap で全単語を数え、もう一度 text の順に見て、より大きいときだけ更新する。同数なら最初の単語が残る。",
  ),
};

/** Mid (written test): a struct whose methods change it through *Self. */
export const walletTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "structs",
  difficulty: 2,
  prompt: L("Written test: a coin wallet", "Prueba escrita: una billetera", "筆記：コインの財布"),
  brief: L(
    "Complete Wallet = struct { coins: u32 } with two methods. deposit(self: *Wallet, amount: u32) void adds amount. spend(self: *Wallet, amount: u32) error{NotEnough}!void takes amount away; spending exactly all the coins is allowed. If there aren't enough coins, return error.NotEnough and leave coins unchanged.",
    "Completa Wallet = struct { coins: u32 } con dos métodos. deposit(self: *Wallet, amount: u32) void suma amount. spend(self: *Wallet, amount: u32) error{NotEnough}!void resta amount; gastar exactamente todas las monedas está permitido. Si no alcanzan, devuelve error.NotEnough y deja coins sin cambios.",
    "Wallet = struct { coins: u32 } に2つのメソッドを書こう。deposit(self: *Wallet, amount: u32) void は amount を足す。spend(self: *Wallet, amount: u32) error{NotEnough}!void は amount を引く。ちょうど全部使うのは OK。足りなければ error.NotEnough を返し、coins は変えない。",
  ),
  starter: zig`
const std = @import("std");

const Wallet = struct {
    coins: u32,

    pub fn deposit(self: *Wallet, amount: u32) void {
        // your code here
        _ = self;
        _ = amount;
    }

    pub fn spend(self: *Wallet, amount: u32) error{NotEnough}!void {
        // your code here
        _ = self;
        _ = amount;
    }
};
`,
  solution: zig`
const std = @import("std");

const Wallet = struct {
    coins: u32,

    pub fn deposit(self: *Wallet, amount: u32) void {
        self.coins += amount;
    }

    pub fn spend(self: *Wallet, amount: u32) error{NotEnough}!void {
        if (amount > self.coins) return error.NotEnough;
        self.coins -= amount;
    }
};
`,
  nearMiss: [
    // >= refuses to spend the last coins.
    zig`
const std = @import("std");

const Wallet = struct {
    coins: u32,

    pub fn deposit(self: *Wallet, amount: u32) void {
        self.coins += amount;
    }

    pub fn spend(self: *Wallet, amount: u32) error{NotEnough}!void {
        if (amount >= self.coins) return error.NotEnough;
        self.coins -= amount;
    }
};
`,
    // Empties the wallet before failing.
    zig`
const std = @import("std");

const Wallet = struct {
    coins: u32,

    pub fn deposit(self: *Wallet, amount: u32) void {
        self.coins += amount;
    }

    pub fn spend(self: *Wallet, amount: u32) error{NotEnough}!void {
        if (amount > self.coins) {
            self.coins = 0;
            return error.NotEnough;
        }
        self.coins -= amount;
    }
};
`,
  ],
  tests: [
    { run: zig`
{
    var w: Wallet = .{ .coins = 10 };
    w.deposit(5);
    try w.spend(3);
    std.debug.print("{d}\n", .{w.coins});
}`, expect: "12" },
    { run: zig`
{
    var w: Wallet = .{ .coins = 4 };
    const r = if (w.spend(9)) |_| "ok" else |e| @errorName(e);
    std.debug.print("{s} {d}\n", .{ r, w.coins });
}`, expect: "NotEnough 4" },
    { run: zig`
{
    var w: Wallet = .{ .coins = 7 };
    const r = if (w.spend(7)) |_| "ok" else |e| @errorName(e);
    std.debug.print("{s} {d}\n", .{ r, w.coins });
}`, expect: "ok 0", hidden: true },
    { run: zig`
{
    var w: Wallet = .{ .coins = 2 };
    w.spend(3) catch {};
    w.deposit(1);
    std.debug.print("{d}\n", .{w.coins});
}`, expect: "3", hidden: true },
    { run: zig`
{
    var w: Wallet = .{ .coins = 0 };
    w.deposit(0);
    try w.spend(0);
    std.debug.print("{d}\n", .{w.coins});
}`, expect: "0", hidden: true },
  ],
  explain: L(
    "Methods that change the struct take self: *Wallet. Check amount > self.coins before subtracting: an equal amount is fine, and a failed spend changes nothing.",
    "Los métodos que cambian el struct reciben self: *Wallet. Revisa amount > self.coins antes de restar: un monto igual está bien y un gasto fallido no cambia nada.",
    "構造体を変えるメソッドは self: *Wallet。引く前に amount > self.coins を調べる。同じ額は OK、失敗したら何も変えない。",
  ),
};

/** Mid (written test): a tagged union and an exhaustive switch. */
export const shapeAreaTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "unions",
  difficulty: 2,
  prompt: L("Written test: areas of shapes", "Prueba escrita: áreas de figuras", "筆記：図形の面積"),
  brief: L(
    "Shape is a tagged union: square (side), rect (w, h) or triangle (base, height), all u32. Write area(s: Shape) u32 (a triangle is base * height / 2, rounded down) and totalArea(shapes: []const Shape) u32, the sum of all areas (0 for no shapes).",
    "Shape es una unión etiquetada: square (lado), rect (w, h) o triangle (base, height), todos u32. Escribe area(s: Shape) u32 (un triángulo es base * height / 2, redondeado hacia abajo) y totalArea(shapes: []const Shape) u32, la suma de todas las áreas (0 sin figuras).",
    "Shape はタグ付き共用体：square（辺）、rect（w, h）、triangle（base, height）、すべて u32。area(s: Shape) u32（三角形は base * height / 2、切り捨て）と、全面積の合計 totalArea(shapes: []const Shape) u32（図形なしは 0）を書こう。",
  ),
  starter: zig`
const std = @import("std");

const Shape = union(enum) {
    square: u32,
    rect: struct { w: u32, h: u32 },
    triangle: struct { base: u32, height: u32 },
};

fn area(s: Shape) u32 {
    // your code here
    _ = s;
    return 0;
}

fn totalArea(shapes: []const Shape) u32 {
    // your code here
    _ = shapes;
    return 0;
}
`,
  solution: zig`
const std = @import("std");

const Shape = union(enum) {
    square: u32,
    rect: struct { w: u32, h: u32 },
    triangle: struct { base: u32, height: u32 },
};

fn area(s: Shape) u32 {
    return switch (s) {
        .square => |side| side * side,
        .rect => |r| r.w * r.h,
        .triangle => |t| t.base * t.height / 2,
    };
}

fn totalArea(shapes: []const Shape) u32 {
    var sum: u32 = 0;
    for (shapes) |s| sum += area(s);
    return sum;
}
`,
  nearMiss: [
    // Halves the base first: integer division loses the remainder too early.
    zig`
const std = @import("std");

const Shape = union(enum) {
    square: u32,
    rect: struct { w: u32, h: u32 },
    triangle: struct { base: u32, height: u32 },
};

fn area(s: Shape) u32 {
    return switch (s) {
        .square => |side| side * side,
        .rect => |r| r.w * r.h,
        .triangle => |t| t.base / 2 * t.height,
    };
}

fn totalArea(shapes: []const Shape) u32 {
    var sum: u32 = 0;
    for (shapes) |s| sum += area(s);
    return sum;
}
`,
    // Treats a square's side as its area.
    zig`
const std = @import("std");

const Shape = union(enum) {
    square: u32,
    rect: struct { w: u32, h: u32 },
    triangle: struct { base: u32, height: u32 },
};

fn area(s: Shape) u32 {
    return switch (s) {
        .square => |side| side * 4,
        .rect => |r| r.w * r.h,
        .triangle => |t| t.base * t.height / 2,
    };
}

fn totalArea(shapes: []const Shape) u32 {
    var sum: u32 = 0;
    for (shapes) |s| sum += area(s);
    return sum;
}
`,
  ],
  tests: [
    { run: 'std.debug.print("{d}\\n", .{area(.{ .square = 3 })});', expect: "9" },
    { run: 'std.debug.print("{d}\\n", .{totalArea(&.{ .{ .square = 2 }, .{ .rect = .{ .w = 2, .h = 5 } } })});', expect: "14" },
    { run: 'std.debug.print("{d}\\n", .{area(.{ .triangle = .{ .base = 3, .height = 5 } })});', expect: "7", hidden: true },
    { run: 'std.debug.print("{d}\\n", .{totalArea(&[_]Shape{})});', expect: "0", hidden: true },
    { run: 'std.debug.print("{d}\\n", .{totalArea(&.{ .{ .triangle = .{ .base = 4, .height = 4 } }, .{ .square = 4 }, .{ .rect = .{ .w = 1, .h = 3 } } })});', expect: "27", hidden: true },
  ],
  explain: L(
    "switch on the union and capture each payload (|r|, |t|). Multiply before dividing: 3 * 5 / 2 is 7, but 3 / 2 * 5 is 5.",
    "Haz switch sobre la unión y captura cada payload (|r|, |t|). Multiplica antes de dividir: 3 * 5 / 2 es 7, pero 3 / 2 * 5 es 5.",
    "共用体を switch し、中身を |r| や |t| で受ける。割る前にかける。3 * 5 / 2 は 7、3 / 2 * 5 は 5。",
  ),
};

// ─── Senior screening ──────────────────────────────────────────────────────

/** Senior (editor): a comptime generic type with fixed storage. */
export const ringTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "comptime",
  difficulty: 3,
  prompt: L("Coding: a generic ring buffer", "Código: un buffer circular genérico", "コーディング：ジェネリックなリングバッファ"),
  brief: L(
    "Complete Ring(comptime T: type, comptime N: usize) type: a FIFO queue in a fixed [N]T with no allocator. push(x) adds at the back; when the ring already holds N items it overwrites the OLDEST one. pop() ?T removes and returns the oldest, or null when empty. len() is the current count. Give every field a default so `var r: Ring(u8, 3) = .{};` works.",
    "Completa Ring(comptime T: type, comptime N: usize) type: una cola FIFO en un [N]T fijo, sin allocator. push(x) agrega al final; si ya tiene N elementos, sobrescribe el MÁS VIEJO. pop() ?T quita y devuelve el más viejo, o null si está vacía. len() es la cantidad actual. Da valor por defecto a cada campo para que `var r: Ring(u8, 3) = .{};` funcione.",
    "Ring(comptime T: type, comptime N: usize) type を完成させよう。アロケータなしで固定の [N]T に入る FIFO キュー。push(x) は後ろに追加し、すでに N 個なら「いちばん古い」ものを上書き。pop() ?T は最古を取り出し、空なら null。len() は今の個数。`var r: Ring(u8, 3) = .{};` が動くよう全フィールドに既定値をつける。",
  ),
  starter: zig`
const std = @import("std");

fn Ring(comptime T: type, comptime N: usize) type {
    return struct {
        const Self = @This();
        // your fields here (each with a default value)

        pub fn push(self: *Self, x: T) void {
            // your code here
            _ = self;
            _ = x;
        }

        pub fn pop(self: *Self) ?T {
            // your code here
            _ = self;
            return null;
        }

        pub fn len(self: Self) usize {
            // your code here
            _ = self;
            return 0;
        }
    };
}
`,
  solution: zig`
const std = @import("std");

fn Ring(comptime T: type, comptime N: usize) type {
    return struct {
        const Self = @This();
        items: [N]T = undefined,
        start: usize = 0,
        count: usize = 0,

        pub fn push(self: *Self, x: T) void {
            self.items[(self.start + self.count) % N] = x;
            if (self.count < N) {
                self.count += 1;
            } else {
                self.start = (self.start + 1) % N;
            }
        }

        pub fn pop(self: *Self) ?T {
            if (self.count == 0) return null;
            const x = self.items[self.start];
            self.start = (self.start + 1) % N;
            self.count -= 1;
            return x;
        }

        pub fn len(self: Self) usize {
            return self.count;
        }
    };
}
`,
  nearMiss: [
    // When full it drops the NEW item instead of the oldest.
    zig`
const std = @import("std");

fn Ring(comptime T: type, comptime N: usize) type {
    return struct {
        const Self = @This();
        items: [N]T = undefined,
        start: usize = 0,
        count: usize = 0,

        pub fn push(self: *Self, x: T) void {
            if (self.count == N) return;
            self.items[(self.start + self.count) % N] = x;
            self.count += 1;
        }

        pub fn pop(self: *Self) ?T {
            if (self.count == 0) return null;
            const x = self.items[self.start];
            self.start = (self.start + 1) % N;
            self.count -= 1;
            return x;
        }

        pub fn len(self: Self) usize {
            return self.count;
        }
    };
}
`,
    // A stack: pop returns the newest item.
    zig`
const std = @import("std");

fn Ring(comptime T: type, comptime N: usize) type {
    return struct {
        const Self = @This();
        items: [N]T = undefined,
        count: usize = 0,

        pub fn push(self: *Self, x: T) void {
            if (self.count == N) {
                for (0..N - 1) |i| self.items[i] = self.items[i + 1];
                self.count -= 1;
            }
            self.items[self.count] = x;
            self.count += 1;
        }

        pub fn pop(self: *Self) ?T {
            if (self.count == 0) return null;
            self.count -= 1;
            return self.items[self.count];
        }

        pub fn len(self: Self) usize {
            return self.count;
        }
    };
}
`,
  ],
  tests: [
    { run: zig`
{
    var r: Ring(u8, 3) = .{};
    r.push(1);
    r.push(2);
    std.debug.print("{?d} {?d} {?d}\n", .{ r.pop(), r.pop(), r.pop() });
}`, expect: "1 2 null" },
    { run: zig`
{
    var r: Ring(u8, 3) = .{};
    for (1..5) |i| r.push(@intCast(i));
    std.debug.print("{d} {?d} {?d} {?d} {d}\n", .{ r.len(), r.pop(), r.pop(), r.pop(), r.len() });
}`, expect: "3 2 3 4 0" },
    { run: zig`
{
    var r: Ring(i32, 2) = .{};
    r.push(-1);
    r.push(-2);
    r.push(-3);
    std.debug.print("{d} {?d}\n", .{ r.len(), r.pop() });
}`, expect: "2 -2", hidden: true },
    { run: zig`
{
    var r: Ring(u8, 3) = .{};
    r.push(1);
    r.push(2);
    _ = r.pop();
    r.push(3);
    r.push(4);
    r.push(5);
    std.debug.print("{?d} {?d} {?d} {?d}\n", .{ r.pop(), r.pop(), r.pop(), r.pop() });
}`, expect: "3 4 5 null", hidden: true },
    { run: zig`
{
    var r: Ring(u16, 1) = .{};
    r.push(10);
    r.push(20);
    std.debug.print("{d} {?d} {?d}\n", .{ r.len(), r.pop(), r.pop() });
}`, expect: "1 20 null", hidden: true },
  ],
  explain: L(
    "Keep start and count; the back is (start + count) % N. When full, write over items[start] and move start forward: the oldest item is the one lost.",
    "Guarda start y count; el final es (start + count) % N. Si está llena, escribe sobre items[start] y avanza start: se pierde el más viejo.",
    "start と count を持ち、末尾は (start + count) % N。満杯なら items[start] に書いて start を進める。消えるのは最古の要素。",
  ),
};

/** Senior (written test): errdefer cleanup when an allocation fails halfway. */
export const dupAllTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "allocators",
  difficulty: 3,
  prompt: L("Written test: copy all, leak nothing", "Prueba escrita: copia todo sin fugas", "筆記：全部コピー、もれなし"),
  brief: L(
    "Write dupAll(alloc: std.mem.Allocator, names: []const []const u8) ![][]u8: a new slice holding a fresh copy of every name. The caller frees each copy and then the slice. If any allocation fails, return error.OutOfMemory and free everything this call already allocated. The tests use std.testing.FailingAllocator to make the Nth allocation fail and a DebugAllocator to catch leaks.",
    "Escribe dupAll(alloc: std.mem.Allocator, names: []const []const u8) ![][]u8: un slice nuevo con una copia de cada nombre. El que llama libera cada copia y luego el slice. Si alguna reserva falla, devuelve error.OutOfMemory y libera todo lo que esta llamada ya reservó. Las pruebas usan std.testing.FailingAllocator para hacer fallar la reserva N y un DebugAllocator para atrapar fugas.",
    "dupAll(alloc: std.mem.Allocator, names: []const []const u8) ![][]u8 を書こう。各名前の新しいコピーを入れた新しいスライスを返す。呼び出し側は各コピー、次にスライスを解放する。確保が1つでも失敗したら error.OutOfMemory を返し、この呼び出しで確保した分を全部解放する。テストは std.testing.FailingAllocator で N 回目の確保を失敗させ、DebugAllocator でもれを調べる。",
  ),
  starter: zig`
const std = @import("std");

fn dupAll(alloc: std.mem.Allocator, names: []const []const u8) ![][]u8 {
    // your code here
    _ = names;
    return alloc.alloc([]u8, 0);
}
`,
  solution: zig`
const std = @import("std");

fn dupAll(alloc: std.mem.Allocator, names: []const []const u8) ![][]u8 {
    const out = try alloc.alloc([]u8, names.len);
    errdefer alloc.free(out);
    var done: usize = 0;
    errdefer for (out[0..done]) |s| alloc.free(s);
    for (names, 0..) |n, i| {
        out[i] = try alloc.dupe(u8, n);
        done += 1;
    }
    return out;
}
`,
  nearMiss: [
    // No cleanup at all: a failure leaks the slice and the copies made so far.
    zig`
const std = @import("std");

fn dupAll(alloc: std.mem.Allocator, names: []const []const u8) ![][]u8 {
    const out = try alloc.alloc([]u8, names.len);
    for (names, 0..) |n, i| {
        out[i] = try alloc.dupe(u8, n);
    }
    return out;
}
`,
    // Frees the outer slice but forgets the copies already made.
    zig`
const std = @import("std");

fn dupAll(alloc: std.mem.Allocator, names: []const []const u8) ![][]u8 {
    const out = try alloc.alloc([]u8, names.len);
    errdefer alloc.free(out);
    for (names, 0..) |n, i| {
        out[i] = try alloc.dupe(u8, n);
    }
    return out;
}
`,
  ],
  tests: [
    { run: zig`
{
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const a = gpa.allocator();
    const out = try dupAll(a, &.{ "ada", "zig" });
    std.debug.print("{s} {s} {d}", .{ out[0], out[1], out.len });
    for (out) |s| a.free(s);
    a.free(out);
    std.debug.print(" {s}\n", .{@tagName(gpa.deinit())});
}`, expect: "ada zig 2 ok" },
    { run: zig`
{
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    var failing = std.testing.FailingAllocator.init(gpa.allocator(), .{ .fail_index = 0 });
    const r = dupAll(failing.allocator(), &.{ "a", "b" });
    const what = if (r) |_| "ok" else |e| @errorName(e);
    std.debug.print("{s} {s}\n", .{ what, @tagName(gpa.deinit()) });
}`, expect: "OutOfMemory ok" },
    { run: zig`
{
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    var failing = std.testing.FailingAllocator.init(gpa.allocator(), .{ .fail_index = 2 });
    const r = dupAll(failing.allocator(), &.{ "a", "b", "c" });
    const what = if (r) |_| "ok" else |e| @errorName(e);
    std.debug.print("{s} {s}\n", .{ what, @tagName(gpa.deinit()) });
}`, expect: "OutOfMemory ok", hidden: true },
    { run: zig`
{
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    var failing = std.testing.FailingAllocator.init(gpa.allocator(), .{ .fail_index = 3 });
    const r = dupAll(failing.allocator(), &.{ "x", "y", "z" });
    const what = if (r) |_| "ok" else |e| @errorName(e);
    std.debug.print("{s} {s}\n", .{ what, @tagName(gpa.deinit()) });
}`, expect: "OutOfMemory ok", hidden: true },
    { run: zig`
{
    var gpa: std.heap.DebugAllocator(.{}) = .init;
    const a = gpa.allocator();
    const out = try dupAll(a, &[_][]const u8{});
    std.debug.print("{d}", .{out.len});
    a.free(out);
    std.debug.print(" {s}\n", .{@tagName(gpa.deinit())});
}`, expect: "0 ok", hidden: true },
  ],
  explain: L(
    "errdefer runs only when the function returns an error. Register one for the slice and one for the copies made so far (count them), so a late failure frees both.",
    "errdefer corre solo si la función devuelve un error. Registra uno para el slice y otro para las copias hechas (cuéntalas), así un fallo tardío libera ambos.",
    "errdefer はエラーで戻るときだけ動く。スライス用と、作ったコピー用（数えておく）の2つを登録すれば、途中で失敗しても両方解放される。",
  ),
};

/** Senior (written test): a parser with a precise error set and no overflow. */
export const parsePortTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "errors",
  difficulty: 3,
  prompt: L("Written test: parse a port number", "Prueba escrita: lee un número de puerto", "筆記：ポート番号を読む"),
  brief: L(
    "Write parsePort(s: []const u8) error{ Empty, InvalidChar, OutOfRange }!u16. s must be decimal digits only: return error.Empty for \"\", error.InvalidChar for any other character (signs too), and error.OutOfRange unless the value is 1-65535. Leading zeros are fine (\"080\" is 80). Very long inputs must not overflow or panic.",
    "Escribe parsePort(s: []const u8) error{ Empty, InvalidChar, OutOfRange }!u16. s debe tener solo dígitos decimales: devuelve error.Empty para \"\", error.InvalidChar para cualquier otro carácter (signos también) y error.OutOfRange si el valor no está entre 1 y 65535. Los ceros a la izquierda valen (\"080\" es 80). Entradas muy largas no deben desbordar ni hacer panic.",
    "parsePort(s: []const u8) error{ Empty, InvalidChar, OutOfRange }!u16 を書こう。s は10進の数字だけ。\"\" なら error.Empty、ほかの文字（符号も）は error.InvalidChar、値が 1〜65535 でなければ error.OutOfRange。先頭の 0 は OK（\"080\" は 80）。とても長い入力でもあふれたり panic したりしないこと。",
  ),
  starter: zig`
const std = @import("std");

fn parsePort(s: []const u8) error{ Empty, InvalidChar, OutOfRange }!u16 {
    // your code here
    _ = s;
    return error.Empty;
}
`,
  solution: zig`
const std = @import("std");

fn parsePort(s: []const u8) error{ Empty, InvalidChar, OutOfRange }!u16 {
    if (s.len == 0) return error.Empty;
    var n: u32 = 0;
    for (s) |c| {
        if (c < '0' or c > '9') return error.InvalidChar;
        if (n <= 65535) n = n * 10 + (c - '0');
    }
    if (n == 0 or n > 65535) return error.OutOfRange;
    return @intCast(n);
}
`,
  nearMiss: [
    // Accumulates in a u16: 65536 overflows and panics.
    zig`
const std = @import("std");

fn parsePort(s: []const u8) error{ Empty, InvalidChar, OutOfRange }!u16 {
    if (s.len == 0) return error.Empty;
    var n: u16 = 0;
    for (s) |c| {
        if (c < '0' or c > '9') return error.InvalidChar;
        n = n * 10 + (c - '0');
    }
    if (n == 0) return error.OutOfRange;
    return n;
}
`,
    // Forgets that port 0 is out of range.
    zig`
const std = @import("std");

fn parsePort(s: []const u8) error{ Empty, InvalidChar, OutOfRange }!u16 {
    if (s.len == 0) return error.Empty;
    var n: u32 = 0;
    for (s) |c| {
        if (c < '0' or c > '9') return error.InvalidChar;
        if (n <= 65535) n = n * 10 + (c - '0');
    }
    if (n > 65535) return error.OutOfRange;
    return @intCast(n);
}
`,
  ],
  tests: [
    { run: zig`
{
    const r = parsePort("8080");
    if (r) |p| std.debug.print("{d}\n", .{p}) else |e| std.debug.print("{s}\n", .{@errorName(e)});
}`, expect: "8080" },
    { run: zig`
{
    const r = parsePort("80a");
    if (r) |p| std.debug.print("{d}\n", .{p}) else |e| std.debug.print("{s}\n", .{@errorName(e)});
}`, expect: "InvalidChar" },
    { run: zig`
{
    const r = parsePort("");
    if (r) |p| std.debug.print("{d}\n", .{p}) else |e| std.debug.print("{s}\n", .{@errorName(e)});
}`, expect: "Empty", hidden: true },
    { run: zig`
{
    const a = parsePort("65535");
    const b = parsePort("65536");
    if (a) |p| std.debug.print("{d} ", .{p}) else |e| std.debug.print("{s} ", .{@errorName(e)});
    if (b) |p| std.debug.print("{d}\n", .{p}) else |e| std.debug.print("{s}\n", .{@errorName(e)});
}`, expect: "65535 OutOfRange", hidden: true },
    { run: zig`
{
    const a = parsePort("0");
    const b = parsePort("080");
    if (a) |p| std.debug.print("{d} ", .{p}) else |e| std.debug.print("{s} ", .{@errorName(e)});
    if (b) |p| std.debug.print("{d}\n", .{p}) else |e| std.debug.print("{s}\n", .{@errorName(e)});
}`, expect: "OutOfRange 80", hidden: true },
    { run: zig`
{
    const r = parsePort("99999999999999999999");
    if (r) |p| std.debug.print("{d}\n", .{p}) else |e| std.debug.print("{s}\n", .{@errorName(e)});
}`, expect: "OutOfRange", hidden: true },
  ],
  explain: L(
    "Accumulate in a wider type (u32) and stop growing once past 65535, so no input overflows. Then reject 0 and anything above 65535 before @intCast to u16.",
    "Acumula en un tipo más ancho (u32) y deja de crecer al pasar 65535, así nada desborda. Luego rechaza 0 y lo mayor a 65535 antes del @intCast a u16.",
    "広い型（u32）にためて 65535 を超えたら増やさない。これであふれない。u16 に @intCast する前に 0 と 65535 超えを弾く。",
  ),
};

/** Senior (written test): comptime reflection over a struct's fields. */
export const sumIntFieldsTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "comptime",
  difficulty: 3,
  prompt: L("Written test: sum the integer fields", "Prueba escrita: suma los campos enteros", "筆記：整数フィールドの合計"),
  brief: L(
    "Write sumIntFields(value: anytype) i64. value is any struct; return the sum of all its integer fields (signed or unsigned, up to 32 bits) and ignore every other field (bool, floats, slices...). A struct with no integer fields gives 0. Use @typeInfo to read the fields at compile time.",
    "Escribe sumIntFields(value: anytype) i64. value es cualquier struct; devuelve la suma de todos sus campos enteros (con o sin signo, hasta 32 bits) e ignora los demás (bool, floats, slices...). Un struct sin campos enteros da 0. Usa @typeInfo para leer los campos en tiempo de compilación.",
    "sumIntFields(value: anytype) i64 を書こう。value は任意の構造体。整数フィールド（符号あり・なし、32 ビットまで）をすべて足し、ほか（bool、浮動小数、スライスなど）は無視する。整数フィールドがなければ 0。フィールドは @typeInfo でコンパイル時に読む。",
  ),
  starter: zig`
const std = @import("std");

fn sumIntFields(value: anytype) i64 {
    // your code here
    _ = value;
    return 0;
}
`,
  solution: zig`
const std = @import("std");

fn sumIntFields(value: anytype) i64 {
    var total: i64 = 0;
    inline for (@typeInfo(@TypeOf(value)).@"struct".fields) |f| {
        if (@typeInfo(f.type) == .int) total += @field(value, f.name);
    }
    return total;
}
`,
  nearMiss: [
    // A runtime for cannot loop over comptime field info.
    zig`
const std = @import("std");

fn sumIntFields(value: anytype) i64 {
    var total: i64 = 0;
    for (@typeInfo(@TypeOf(value)).@"struct".fields) |f| {
        if (@typeInfo(f.type) == .int) total += @field(value, f.name);
    }
    return total;
}
`,
    // Adds every field without checking its type.
    zig`
const std = @import("std");

fn sumIntFields(value: anytype) i64 {
    var total: i64 = 0;
    inline for (@typeInfo(@TypeOf(value)).@"struct".fields) |f| {
        total += @field(value, f.name);
    }
    return total;
}
`,
  ],
  tests: [
    { run: zig`
{
    const Hero = struct { hp: u8, mp: i32, alive: bool };
    const h: Hero = .{ .hp = 10, .mp = -3, .alive = true };
    std.debug.print("{d}\n", .{sumIntFields(h)});
}`, expect: "7" },
    { run: zig`
{
    const Empty = struct {};
    std.debug.print("{d}\n", .{sumIntFields(Empty{})});
}`, expect: "0" },
    { run: zig`
{
    const Item = struct { name: []const u8, speed: f32, gold: u16 };
    const it: Item = .{ .name = "axe", .speed = 1.5, .gold = 300 };
    std.debug.print("{d}\n", .{sumIntFields(it)});
}`, expect: "300", hidden: true },
    { run: zig`
{
    const Big = struct { a: u32, b: u32, c: i8 };
    const v: Big = .{ .a = 4000000000, .b = 4000000000, .c = -128 };
    std.debug.print("{d}\n", .{sumIntFields(v)});
}`, expect: "7999999872", hidden: true },
    { run: zig`
{
    const Flags = struct { on: bool, ratio: f64 };
    std.debug.print("{d}\n", .{sumIntFields(Flags{ .on = false, .ratio = 2.0 })});
}`, expect: "0", hidden: true },
  ],
  explain: L(
    "Field info only exists at compile time, so loop with inline for. Check @typeInfo(f.type) == .int and read the value with @field(value, f.name).",
    "La info de los campos solo existe al compilar, así que recorre con inline for. Revisa @typeInfo(f.type) == .int y lee el valor con @field(value, f.name).",
    "フィールド情報はコンパイル時だけにあるので inline for で回す。@typeInfo(f.type) == .int を調べ、@field(value, f.name) で値を読む。",
  ),
};
