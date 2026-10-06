import type { Beat, LessonDef, RegionDef, Text } from "../../../lib/content/types.ts";
import { L } from "../../../lib/i18n/text.ts";

// REGION 1 · FORGE VILLAGE  (const/var, integer widths and overflow, loops and switch, arrays and strings)

const say = (text: Text): Beat => ({ kind: "dialog", speaker: "master", text });
const enemySays = (text: Text): Beat => ({ kind: "dialog", speaker: "enemy", text });

// Zig code block: real newlines are lines, `\n` stays a literal backslash-n, common indent removed.
const z = (s: TemplateStringsArray, ...v: unknown[]): string => {
  const lines = String.raw(s, ...v).replace(/^\n/, "").replace(/\n\s*$/, "").split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  return lines.map((l) => l.slice(indent)).join("\n");
};

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");
const YES = L("Yes", "Sí", "はい");
const NO_CE = L("No: compile error", "No: error de compilación", "いいえ：コンパイルエラー");
const PANIC_OVERFLOW = L("It panics: integer overflow", "Hace panic: integer overflow", "panic：integer overflow");

// ─── 1.1 Stone tags and chalk tags ─────────────────────────────────────────
const constAndVar: LessonDef = {
  slug: "const-and-var",
  title: L("Stone and chalk tags", "Etiquetas de piedra y tiza", "石のラベルとチョーク"),
  concept: "basics",
  mode: "lesson",
  xp: 60,
  enemy: "zig/leak-jelly",
  enemyName: L("UNUSED JELLY", "MEDUSA SIN USO", "ムダづかいクラゲ"),
  beats: [
    say(L(
      "Welcome to Comptia! I'm Iggi. Here nothing is hidden. A const tag is carved in stone; a var tag is chalk you can rewrite.",
      "¡Bienvenido a Comptia! Soy Iggi. Aquí nada se oculta. Una etiqueta const es de piedra; una var es de tiza y se reescribe.",
      "コンプティアへようこそ！イギだよ。const のラベルは石に刻む、var はチョークで書きなおせる。",
    )),
    {
      kind: "act",
      prompt: L("Press in order and watch the tags", "Pulsa en orden y mira las etiquetas", "順番に押して、ラベルを見てね"),
      steps: [
        { label: L("CARVE hp", "TALLAR hp", "hp を刻む"), line: "const hp: i32 = 10;", effects: [{ t: "tag", actor: "hero", text: "hp", value: "10" }] },
        { label: L("CHALK gold", "TIZA gold", "gold を書く"), line: "var gold: i32 = 3;", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "gold", value: "3" }] },
        { label: L("ADD 4", "SUMAR 4", "4 たす"), line: "gold += 4;", effects: [{ t: "value", actor: "ally", text: "7" }] },
        { label: L("PRINT", "IMPRIMIR", "表示"), line: z`std.debug.print("{d}\n", .{gold});`, effects: [{ t: "print", text: "7" }], output: "7" },
        {
          label: L("CHANGE hp", "CAMBIAR hp", "hp を変える"),
          line: "hp = 5;",
          effects: [{ t: "shake" }, { t: "say", actor: "hero", text: L("Carved in stone!", "¡Tallado en piedra!", "石に刻んだ！") }],
          error: {
            compiler: "error: cannot assign to constant",
            plain: L("hp is const: its value can never change. Use var for values that change.", "hp es const: su valor nunca cambia. Usa var para valores que cambian.", "hp は const だから値は変えられない。変わる値には var を使おう。"),
          },
        },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const a: i32 = 7;
        var b: i32 = 2;
        b += 1;
        std.debug.print("{d} {d}\n", .{ a, b });
      `,
      options: ["7 3", "7 2", "9 3"],
      answer: 0,
      output: "7 3",
      check: { compiles: true, stdout: "7 3" },
      explain: L("a stays 7. b is var, so b += 1 turns 2 into 3. Each {d} takes the next value of .{ a, b }.", "a sigue en 7. b es var, así que b += 1 convierte 2 en 3. Cada {d} toma el siguiente valor de .{ a, b }.", "a は 7 のまま。b は var なので b += 1 で 3 に。{d} は .{ a, b } を順に使う。"),
      setup: [{ t: "tag", actor: "hero", text: "a", value: "7" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "b", value: "2" }],
      win: [{ t: "value", actor: "ally", text: "3" }, { t: "print", text: "7 3" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: "const x: i32 = 5;\nx = 6;",
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("x is const, so x = 6 is the error cannot assign to constant.", "x es const, así que x = 6 da el error cannot assign to constant.", "x は const なので x = 6 は cannot assign to constant エラー。"),
      win: [{ t: "shake" }],
    },
    say(L(
      "The forge compiler is strict: an unused tag is an error, and so is a var that never changes. No clutter allowed!",
      "El compilador de la forja es estricto: una etiqueta sin usar es error, y también una var que nunca cambia. ¡Nada de desorden!",
      "鍛冶場のコンパイラはきびしい。使わないラベルも、変わらない var もエラーになるよ。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`
        var x: i32 = 5;
        std.debug.print("{d}\n", .{x});
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("x is var but never changes: local variable is never mutated. Make it const.", "x es var pero nunca cambia: local variable is never mutated. Hazla const.", "x は var なのに一度も変わらない：local variable is never mutated。const にしよう。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: "const x: i32 = 5;",
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("x is never used: unused local constant. Zig refuses dead tags.", "x nunca se usa: unused local constant. Zig rechaza etiquetas muertas.", "x を一度も使っていない：unused local constant。使わないラベルは禁止。"),
      setup: [{ t: "tag", actor: "hero", text: "x", value: "5" }],
      win: [{ t: "untag", actor: "hero" }, { t: "say", actor: "enemy", text: L("Unused! Mine!", "¡Sin usar! ¡Mío!", "ムダだ！もらう！") }],
    },
    say(L(
      "If you really mean to ignore a value, say so: _ = x; discards it on purpose.",
      "Si de verdad quieres ignorar un valor, dilo: _ = x; lo descarta a propósito.",
      "わざと使わないなら、はっきり書こう。_ = x; で値をすてるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const x: i32 = 5;
        _ = x;
        std.debug.print("ok\n", .{});
      `,
      options: ["ok", NO_CE, "5"],
      answer: 0,
      output: "ok",
      check: { compiles: true, stdout: "ok" },
      explain: L("_ = x; tells the compiler 'I ignore x on purpose', so it compiles and prints ok.", "_ = x; le dice al compilador 'ignoro x a propósito', así que compila e imprime ok.", "_ = x; は「わざと無視する」という合図。コンパイルが通り ok と表示。"),
    },
    {
      kind: "type",
      prompt: L("Discard x on purpose", "Descarta x a propósito", "x をわざとすてよう"),
      code: z`
        const x: i32 = 5;
        ___ = x;
        std.debug.print("ok\n", .{});
      `,
      answer: "_",
      check: { compiles: true, stdout: "ok" },
      explain: L("The underscore _ swallows a value you don't need.", "El guion bajo _ se traga el valor que no necesitas.", "アンダースコア _ がいらない値をのみこむ。"),
      win: [{ t: "print", text: "ok" }],
    },
    say(L(
      "Number literals like 5 have type comptime_int: exact, but only at compile time. A var needs a real type, like i32.",
      "Los literales como 5 son comptime_int: exactos, pero solo al compilar. Una var necesita un tipo real, como i32.",
      "5 のような数は comptime_int 型。コンパイル時だけの数だから、var には i32 などの型が要る。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`
        var x = 5;
        x += 1;
        std.debug.print("{d}\n", .{x});
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("x would be a comptime_int, which can't live at runtime. Write var x: i32 = 5;", "x sería comptime_int, que no puede vivir al ejecutar. Escribe var x: i32 = 5;", "x が comptime_int になり実行時に置けない。var x: i32 = 5; と書こう。"),
      win: [{ t: "shake" }],
    },
    say(L(
      "std.debug.print fills each {} with the next item of the tuple .{ }: {d} for numbers, {s} for text.",
      "std.debug.print llena cada {} con el siguiente elemento de la tupla .{ }: {d} para números, {s} para texto.",
      "std.debug.print は {} にタプル .{ } の値を順に入れる。数は {d}、文字列は {s}。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: z`std.debug.print("{s} has {d} hp\n", .{ "Iggi", 12 });`,
      options: ["Iggi has 12 hp", "{s} has {d} hp", "Iggi 12"],
      answer: 0,
      output: "Iggi has 12 hp",
      check: { compiles: true, stdout: "Iggi has 12 hp" },
      explain: L("{s} takes the text \"Iggi\", {d} takes the number 12.", "{s} toma el texto \"Iggi\", {d} toma el número 12.", "{s} に文字列 \"Iggi\"、{d} に数 12 が入る。"),
      win: [{ t: "print", text: "Iggi has 12 hp" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`std.debug.print("{d} {d}\n", .{1});`,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("Two {d} slots but only one value: too few arguments. Zig checks the format at compile time.", "Dos huecos {d} pero un solo valor: too few arguments. Zig revisa el formato al compilar.", "{d} が2つなのに値は1つ：too few arguments。書式はコンパイル時に検査される。"),
    },
    {
      kind: "pick",
      prompt: L("hp must change", "hp debe cambiar", "hp は変わるよ"),
      code: z`
        ___ hp: u32 = 10;
        hp -= 3;
        std.debug.print("hp: {d}\n", .{hp});
      `,
      options: ["var", "const"],
      answer: 0,
      check: { compiles: true, stdout: "hp: 7", wrongFail: true },
      explain: L("hp -= 3 changes hp, so it must be var. const would be cannot assign to constant.", "hp -= 3 cambia hp, así que debe ser var. const daría cannot assign to constant.", "hp -= 3 で hp が変わるから var。const だと cannot assign to constant。"),
      setup: [{ t: "tag", actor: "hero", text: "hp", value: "10" }],
      win: [{ t: "value", actor: "hero", text: "7" }, { t: "print", text: "hp: 7" }],
    },
    {
      kind: "run",
      prompt: L("Drink the potion: it must print hp: 15", "Bebe la poción: debe imprimir hp: 15", "回復しよう：hp: 15 と表示させて"),
      starter: z`
        const std = @import("std");

        pub fn main() void {
            var hp: u32 = 10;
            const potion: u32 = 5;
            hp = potion;
            std.debug.print("hp: {d}\n", .{hp});
        }
      ` + "\n",
      solution: z`
        const std = @import("std");

        pub fn main() void {
            var hp: u32 = 10;
            const potion: u32 = 5;
            hp += potion;
            std.debug.print("hp: {d}\n", .{hp});
        }
      ` + "\n",
      expect: "hp: 15",
      fallback: [String.raw`hp\s*\+=\s*potion`, String.raw`hp\s*=\s*hp\s*\+\s*potion`, String.raw`hp\s*=\s*potion\s*\+\s*hp`],
      explain: L("hp = potion replaces the value. hp += potion adds 5 to the 10 you had.", "hp = potion reemplaza el valor. hp += potion suma 5 a los 10 que tenías.", "hp = potion は置きかえ。hp += potion なら 10 に 5 をたす。"),
    },
  ],
};

// ─── 1.2 Chips have a size ─────────────────────────────────────────────────
const integerWidths: LessonDef = {
  slug: "integer-widths",
  title: L("Chips have a size", "Las fichas tienen tamaño", "チップにはサイズがある"),
  concept: "integers",
  mode: "lesson",
  xp: 65,
  enemy: "zig/overflow-spark",
  enemyName: L("OVERFLOW SPARK", "CHISPA DESBORDE", "オーバーフロー火花"),
  beats: [
    say(L(
      "Every integer has a width. u8 is unsigned 8 bits: 0 to 255. i8 is signed: -128 to 127. Pick the size you need.",
      "Cada entero tiene un ancho. u8 es sin signo de 8 bits: 0 a 255. i8 tiene signo: -128 a 127. Elige el tamaño que necesitas.",
      "整数には幅がある。u8 は符号なし8ビットで 0〜255、i8 は符号つきで -128〜127。",
    )),
    {
      kind: "act",
      prompt: L("Fill the u8 chip and watch its limit", "Llena la ficha u8 y mira su límite", "u8 チップに足して、上限を見よう"),
      steps: [
        { label: L("MAKE coins", "CREAR coins", "coins を作る"), line: "var coins: u8 = 250;", effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "coins: u8", value: "250" }] },
        { label: L("ADD 3", "SUMAR 3", "3 たす"), line: "coins += 3;", effects: [{ t: "value", actor: "hero", text: "253" }] },
        {
          label: L("ADD 10", "SUMAR 10", "10 たす"),
          line: "coins += 10;",
          effects: [{ t: "enter", actor: "enemy" }, { t: "attack", from: "enemy", to: "hero" }, { t: "shake" }, { t: "banner", text: L("integer overflow", "integer overflow", "オーバーフロー！") }],
          error: {
            compiler: "panic: integer overflow",
            plain: L("263 doesn't fit in a u8. In Debug Zig stops the program instead of giving a wrong number.", "263 no cabe en un u8. En Debug, Zig detiene el programa en vez de dar un número erróneo.", "263 は u8 に入らない。Debug ではまちがった数を出さずに止まる。"),
          },
        },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`std.debug.print("{d} {d}\n", .{ std.math.maxInt(u8), std.math.minInt(i8) });`,
      options: ["255 -128", "256 -127", "127 -128"],
      answer: 0,
      output: "255 -128",
      check: { compiles: true, stdout: "255 -128" },
      explain: L("8 bits give 256 values: u8 is 0..255, i8 is -128..127.", "8 bits dan 256 valores: u8 es 0..255, i8 es -128..127.", "8ビットで256通り。u8 は 0..255、i8 は -128..127。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const x: u8 = 200;
        const y: u16 = x;
        std.debug.print("{d} {}\n", .{ y, @TypeOf(y) });
      `,
      options: ["200 u16", "200 u8", NO_CE],
      answer: 0,
      output: "200 u16",
      check: { compiles: true, stdout: "200 u16" },
      explain: L("Widening is safe: every u8 fits in a u16, so it converts on its own.", "Ensanchar es seguro: todo u8 cabe en un u16, así que se convierte solo.", "広げるのは安全。u8 は必ず u16 に入るので自動で変換される。"),
      win: [{ t: "print", text: "200 u16" }],
    },
    say(L(
      "Narrowing is not automatic: a u16 may not fit in a u8. The compiler makes you say how to shrink it.",
      "Estrechar no es automático: un u16 puede no caber en un u8. El compilador te obliga a decir cómo achicarlo.",
      "せばめるのは自動じゃない。u16 は u8 に入らないかも。どう縮めるか書く必要がある。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`
        var big: u16 = 300;
        _ = &big;
        const s: u8 = big;
        std.debug.print("{d}\n", .{s});
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("big is a runtime u16: expected type 'u8', found 'u16'. (_ = &big just keeps it a real var.)", "big es un u16 en ejecución: expected type 'u8', found 'u16'. (_ = &big solo la mantiene como var real.)", "big は実行時の u16：expected type 'u8', found 'u16'。（_ = &big は var のままにするため）"),
      win: [{ t: "shake" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: "const s: u8 = 300;\n_ = s;",
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("300 is known at compile time and doesn't fit: type 'u8' cannot represent integer value '300'.", "300 se conoce al compilar y no cabe: type 'u8' cannot represent integer value '300'.", "300 はコンパイル時にわかり、入らない：type 'u8' cannot represent integer value '300'。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: z`
        var n: u8 = 0;
        n -= 1;
      `,
      options: [PANIC_OVERFLOW, L("n becomes 255", "n pasa a 255", "n が 255 になる"), NO_CE],
      answer: 0,
      check: { compiles: true, throws: "integer overflow" },
      explain: L("A u8 can't go below 0. Debug mode checks every + and - and panics.", "Un u8 no puede bajar de 0. El modo Debug revisa cada + y - y hace panic.", "u8 は 0 より下に行けない。Debug は +/- を毎回検査して panic する。"),
      setup: [{ t: "tag", actor: "hero", text: "n: u8", value: "0" }],
      win: [{ t: "enter", actor: "enemy" }, { t: "attack", from: "enemy", to: "hero" }, { t: "shake" }],
    },
    say(L(
      "Want an odometer instead? +% wraps around past the top. +| saturates: it sticks at the max.",
      "¿Quieres un cuentakilómetros? +% da la vuelta al pasar el tope. +| satura: se queda en el máximo.",
      "メーターのように回したい？ +% は一周して戻る。+| は上限で止まる（飽和）。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        var w: u8 = 250;
        w +%= 10;
        var s: u8 = 250;
        s +|= 10;
        std.debug.print("{d} {d}\n", .{ w, s });
      `,
      options: ["4 255", "260 260", "255 4"],
      answer: 0,
      output: "4 255",
      check: { compiles: true, stdout: "4 255" },
      explain: L("260 wraps to 260 - 256 = 4 with +%. With +| it stops at 255.", "260 da la vuelta a 260 - 256 = 4 con +%. Con +| se queda en 255.", "+% だと 260 - 256 = 4 に一周。+| は 255 で止まる。"),
      setup: [{ t: "tag", actor: "hero", text: "w", value: "250" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "s", value: "250" }],
      win: [{ t: "value", actor: "hero", text: "4" }, { t: "value", actor: "ally", text: "255" }, { t: "print", text: "4 255" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        var u: u3 = 7;
        u +%= 1;
        std.debug.print("{d} {d}\n", .{ u, std.math.maxInt(u3) });
      `,
      options: ["0 7", "8 7", "1 8"],
      answer: 0,
      output: "0 7",
      check: { compiles: true, stdout: "0 7" },
      explain: L("Any width works: u3 has 3 bits, so 0..7. 7 +% 1 wraps to 0.", "Sirve cualquier ancho: u3 tiene 3 bits, o sea 0..7. 7 +% 1 da la vuelta a 0.", "幅は自由。u3 は3ビットで 0..7。7 +% 1 は 0 に戻る。"),
    },
    {
      kind: "pick",
      prompt: L("Roll over like an odometer", "Da la vuelta como un odómetro", "メーターのように一周させて"),
      code: z`
        var w: u8 = 250;
        w ___ 10;
        std.debug.print("{d}\n", .{w});
      `,
      options: ["+%=", "+|=", "+="],
      answer: 0,
      check: { compiles: true, stdout: "4" },
      explain: L("+%= wraps to 4. +|= would stick at 255, and += would panic with integer overflow.", "+%= da la vuelta a 4. +|= se quedaría en 255 y += haría panic con integer overflow.", "+%= は 4 に一周。+|= は 255 で止まり、+= は integer overflow で panic。"),
      win: [{ t: "print", text: "4" }],
    },
    say(L(
      "To shrink a runtime value: @intCast checks that it fits (or panics), @truncate keeps only the low bits.",
      "Para achicar un valor en ejecución: @intCast revisa que quepa (o hace panic), @truncate guarda solo los bits bajos.",
      "実行時の値を縮めるには：@intCast は入るか検査（だめなら panic）、@truncate は下位ビットだけ残す。",
    )),
    {
      kind: "predict",
      prompt: HAPPENS,
      code: z`
        var big: u32 = 300;
        _ = &big;
        const s: u8 = @intCast(big);
        std.debug.print("{d}\n", .{s});
      `,
      options: [L("It panics: does not fit", "Hace panic: no cabe", "panic：入らない"), "44", "300"],
      answer: 0,
      check: { compiles: true, throws: "integer does not fit in destination type" },
      explain: L("@intCast checks at runtime: 300 doesn't fit in a u8, so it panics.", "@intCast revisa al ejecutar: 300 no cabe en un u8, así que hace panic.", "@intCast は実行時に検査。300 は u8 に入らないので panic。"),
      win: [{ t: "shake" }, { t: "banner", text: L("does not fit!", "¡no cabe!", "入らない！") }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const big: u32 = 300;
        const small: u8 = @truncate(big);
        std.debug.print("{d}\n", .{small});
      `,
      options: ["44", "255", "300"],
      answer: 0,
      output: "44",
      check: { compiles: true, stdout: "44" },
      explain: L("@truncate keeps the low 8 bits: 300 - 256 = 44.", "@truncate guarda los 8 bits bajos: 300 - 256 = 44.", "@truncate は下位8ビットを残す：300 - 256 = 44。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`
        var a: i32 = 1;
        var b: u32 = 2;
        _ = &a;
        _ = &b;
        std.debug.print("{d}\n", .{a + b});
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("Signed and unsigned don't mix: incompatible types: 'i32' and 'u32'. Cast one first.", "Con signo y sin signo no se mezclan: incompatible types: 'i32' and 'u32'. Convierte uno antes.", "符号つきと符号なしは混ぜられない：incompatible types。先にどちらかを変換。"),
    },
    say(L(
      "Signed division rounds two ways, so Zig asks you to choose: @divTrunc cuts toward zero, @divFloor rounds down.",
      "La división con signo redondea de dos formas, así que Zig te pide elegir: @divTrunc corta hacia cero, @divFloor redondea abajo.",
      "符号つきの割り算は丸め方が2つ。@divTrunc は0方向、@divFloor は下方向。選んで書こう。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`
        var a: i32 = -7;
        _ = &a;
        std.debug.print("{d}\n", .{a / 2});
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("/ on a runtime signed integer is an error: signed integers must use @divTrunc, @divFloor, or @divExact.", "/ con un entero con signo en ejecución da error: signed integers must use @divTrunc, @divFloor, or @divExact.", "実行時の符号つき整数に / はエラー。@divTrunc か @divFloor を使えと言われる。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`std.debug.print("{d} {d}\n", .{ @divTrunc(-7, 2), @divFloor(-7, 2) });`,
      options: ["-3 -4", "-4 -3", "-3 -3"],
      answer: 0,
      output: "-3 -4",
      check: { compiles: true, stdout: "-3 -4" },
      explain: L("-3.5 cut toward zero is -3; rounded down it is -4.", "-3.5 cortado hacia cero es -3; redondeado hacia abajo es -4.", "-3.5 を0方向に切ると -3、下に丸めると -4。"),
    },
    {
      kind: "run",
      prompt: L("Stop the overflow: it must print coins: 300", "Evita el desborde: debe imprimir coins: 300", "あふれを防いで coins: 300 と表示"),
      starter: z`
        const std = @import("std");

        pub fn main() void {
            var coins: u8 = 200;
            const bonus: u8 = 100;
            coins += bonus;
            std.debug.print("coins: {d}\n", .{coins});
        }
      ` + "\n",
      solution: z`
        const std = @import("std");

        pub fn main() void {
            var coins: u16 = 200;
            const bonus: u8 = 100;
            coins += bonus;
            std.debug.print("coins: {d}\n", .{coins});
        }
      ` + "\n",
      expect: "coins: 300",
      fallback: [String.raw`var\s+coins\s*:\s*(u16|u32|u64|usize|i16|i32|i64)\b`],
      explain: L("200 + 100 doesn't fit in a u8. Make coins a u16: the u8 bonus widens on its own.", "200 + 100 no cabe en un u8. Haz coins u16: el bonus u8 se ensancha solo.", "200 + 100 は u8 に入らない。coins を u16 に。u8 の bonus は自動で広がる。"),
    },
  ],
};

// ─── 1.3 Paths through the village ─────────────────────────────────────────
const loopsAndSwitch: LessonDef = {
  slug: "loops-and-switch",
  title: L("Paths through the village", "Caminos de la aldea", "村の道"),
  concept: "control",
  mode: "lesson",
  xp: 65,
  enemy: "ghost",
  enemyName: L("LOOP GHOST", "FANTASMA BUCLE", "ループおばけ"),
  beats: [
    say(L(
      "if picks a path. In Zig it is also an expression: const k = if (c) a else b; The condition must be a real bool.",
      "if elige un camino. En Zig también es una expresión: const k = if (c) a else b; La condición debe ser un bool de verdad.",
      "if は道を選ぶ。Zig では値も返す：const k = if (c) a else b; 条件は必ず bool。",
    )),
    {
      kind: "act",
      prompt: L("Walk the path tile by tile", "Recorre el camino baldosa a baldosa", "道を1マスずつ歩こう"),
      steps: [
        { label: L("START i", "EMPEZAR i", "i を用意"), line: "var i: u32 = 0;", effects: [{ t: "tag", actor: "hero", text: "i", value: "0" }] },
        { label: L("LOOP", "REPETIR", "くり返す"), line: "while (i < 3) : (i += 1) {", effects: [{ t: "say", actor: "hero", text: L("While i < 3...", "Mientras i < 3...", "i < 3 の間…") }] },
        {
          label: L("PRINT i", "IMPRIMIR i", "i を表示"),
          line: z`    std.debug.print("{d}\n", .{i});`,
          effects: [{ t: "print", text: "0" }, { t: "value", actor: "hero", text: "1" }, { t: "print", text: "1" }, { t: "value", actor: "hero", text: "2" }, { t: "print", text: "2" }, { t: "value", actor: "hero", text: "3" }],
          output: "0\n1\n2",
        },
        { label: L("END", "FIN", "おわり"), line: "}", effects: [{ t: "banner", text: L("i = 3: stop", "i = 3: alto", "i = 3：停止") }] },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const t: i32 = 5;
        const kind = if (t > 3) "big" else "small";
        std.debug.print("{s}\n", .{kind});
      `,
      options: ["big", "small", "true"],
      answer: 0,
      output: "big",
      check: { compiles: true, stdout: "big" },
      explain: L("5 > 3 is true, so the if expression gives \"big\".", "5 > 3 es true, así que la expresión if da \"big\".", "5 > 3 は true なので if 式は \"big\" になる。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`
        var x: i32 = 1;
        if (x) {
            x = 2;
        }
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("No truthy numbers in Zig: expected type 'bool', found 'i32'. Write if (x != 0).", "En Zig los números no son verdaderos: expected type 'bool', found 'i32'. Escribe if (x != 0).", "Zig では数は真偽値にならない：expected type 'bool'。if (x != 0) と書こう。"),
      win: [{ t: "shake" }],
    },
    say(L(
      "while (cond) : (step) repeats while cond holds; the step runs after each lap, even after continue.",
      "while (cond) : (paso) repite mientras cond se cumpla; el paso corre tras cada vuelta, incluso tras continue.",
      "while (条件) : (ステップ) は条件の間くり返す。ステップは毎周のあと、continue のあとも動く。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        var i: u32 = 0;
        var sum: u32 = 0;
        while (i < 5) : (i += 1) {
            if (i == 2) continue;
            sum += i;
        }
        std.debug.print("{d} {d}\n", .{ sum, i });
      `,
      options: ["8 5", "10 5", "8 4"],
      answer: 0,
      output: "8 5",
      check: { compiles: true, stdout: "8 5" },
      explain: L("0+1+3+4 = 8 (2 is skipped). The step still runs, and the loop stops when i is 5.", "0+1+3+4 = 8 (se salta el 2). El paso igual corre, y el bucle para cuando i es 5.", "0+1+3+4 = 8（2 は飛ばす）。ステップは動き続け、i が 5 で止まる。"),
      win: [{ t: "print", text: "8 5" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        var n: u32 = 1;
        while (n < 100) n *= 3;
        std.debug.print("{d}\n", .{n});
      `,
      options: ["243", "81", "100"],
      answer: 0,
      output: "243",
      check: { compiles: true, stdout: "243" },
      explain: L("1, 3, 9, 27, 81, 243: at 243 the condition n < 100 fails.", "1, 3, 9, 27, 81, 243: en 243 la condición n < 100 falla.", "1, 3, 9, 27, 81, 243。243 で n < 100 が偽になる。"),
    },
    say(L(
      "for walks over items or ranges: for (0..4) |k| gives 0 to 3. |v| captures each item; add 0.. to also get the index.",
      "for recorre elementos o rangos: for (0..4) |k| da 0 a 3. |v| captura cada elemento; agrega 0.. para obtener el índice.",
      "for は要素や範囲を回る。for (0..4) |k| は 0〜3。|v| で要素、0.. を足すと番号も取れる。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        for (0..4) |k| std.debug.print("{d}", .{k});
        std.debug.print("\n", .{});
      `,
      options: ["0123", "01234", "1234"],
      answer: 0,
      output: "0123",
      check: { compiles: true, stdout: "0123" },
      explain: L("0..4 stops before 4: it gives 0, 1, 2, 3.", "0..4 se detiene antes de 4: da 0, 1, 2, 3.", "0..4 は 4 の手前で止まる：0, 1, 2, 3。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const items = [_]u8{ 10, 20, 30 };
        for (items, 0..) |v, i| std.debug.print("{d}:{d} ", .{ i, v });
        std.debug.print("\n", .{});
      `,
      options: ["0:10 1:20 2:30", "10:0 20:1 30:2", "1:10 2:20 3:30"],
      answer: 0,
      output: "0:10 1:20 2:30",
      check: { compiles: true, stdout: "0:10 1:20 2:30" },
      explain: L("v walks the items, i walks 0.. at the same pace. The print shows i first.", "v recorre los elementos, i recorre 0.. al mismo ritmo. El print muestra i primero.", "v は要素、i は 0.. を同時に進む。表示は i が先。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`
        const xs = [_]u8{ 1, 2 };
        for (xs) |x| {}
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("x is captured but never used: unused capture. Use |_| if you don't need it.", "x se captura pero no se usa: unused capture. Usa |_| si no la necesitas.", "x を取り出したのに使わない：unused capture。不要なら |_| にしよう。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const items = [_]u8{ 10, 20, 30 };
        const found = for (items) |v| {
            if (v > 15) break v;
        } else 0;
        std.debug.print("{d}\n", .{found});
      `,
      options: ["20", "30", "0"],
      answer: 0,
      output: "20",
      check: { compiles: true, stdout: "20" },
      explain: L("break v leaves the loop with a value: the first item above 15. else is used only if it never breaks.", "break v sale del bucle con un valor: el primero mayor que 15. else se usa solo si nunca hay break.", "break v は値を持って抜ける：15 より大きい最初の要素。else は break しない時だけ。"),
    },
    say(L(
      "switch is a signpost with one arrow per case. It must cover every possible value: use ranges like 90...100 and else.",
      "switch es un letrero con una flecha por caso. Debe cubrir todo valor posible: usa rangos como 90...100 y else.",
      "switch は分かれ道の看板。全部の値をカバーすること。90...100 のような範囲や else を使おう。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const g: u8 = 72;
        const grade = switch (g) {
            90...100 => 'A',
            70...89 => 'B',
            else => 'C',
        };
        std.debug.print("{c}\n", .{grade});
      `,
      options: ["B", "A", "C"],
      answer: 0,
      output: "B",
      check: { compiles: true, stdout: "B" },
      explain: L("72 falls in 70...89, so switch gives 'B'. {c} prints a byte as a letter.", "72 cae en 70...89, así que switch da 'B'. {c} imprime un byte como letra.", "72 は 70...89 に入るので 'B'。{c} はバイトを文字で表示。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`
        var g: u8 = 72;
        _ = &g;
        const c: u8 = switch (g) {
            0...100 => 'x',
        };
        std.debug.print("{c}\n", .{c});
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("A u8 can be up to 255, and 101..255 have no arrow: switch must handle all possibilities.", "Un u8 llega hasta 255, y 101..255 no tienen flecha: switch must handle all possibilities.", "u8 は 255 まである。101..255 の矢印がない：switch must handle all possibilities。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "type",
      prompt: L("Catch every other grade", "Atrapa cualquier otra nota", "それ以外の点数を受けとめよう"),
      code: z`
        const g: u8 = 40;
        const grade = switch (g) {
            90...100 => 'A',
            ___ => 'C',
        };
        std.debug.print("{c}\n", .{grade});
      `,
      answer: "else",
      check: { compiles: true, stdout: "C" },
      explain: L("else is the arrow for every value not listed, so the switch is complete.", "else es la flecha para todo valor no listado, así el switch queda completo.", "else は書いていない全部の値の矢印。これで switch が完全になる。"),
      win: [{ t: "print", text: "C" }],
    },
    {
      kind: "run",
      prompt: L("Fix the off-by-one: it must print total: 15", "Corrige el error por uno: debe imprimir total: 15", "1つずれを直して total: 15 と表示"),
      starter: z`
        const std = @import("std");

        pub fn main() void {
            var i: u32 = 1;
            var total: u32 = 0;
            while (i < 5) : (i += 1) {
                total += i;
            }
            std.debug.print("total: {d}\n", .{total});
        }
      ` + "\n",
      solution: z`
        const std = @import("std");

        pub fn main() void {
            var i: u32 = 1;
            var total: u32 = 0;
            while (i <= 5) : (i += 1) {
                total += i;
            }
            std.debug.print("total: {d}\n", .{total});
        }
      ` + "\n",
      expect: "total: 15",
      fallback: [String.raw`while\s*\(\s*i\s*<=\s*5\s*\)`, String.raw`while\s*\(\s*i\s*<\s*6\s*\)`],
      explain: L("i < 5 stops before adding 5. i <= 5 sums 1 to 5 = 15.", "i < 5 se detiene antes de sumar 5. i <= 5 suma de 1 a 5 = 15.", "i < 5 だと 5 をたす前に止まる。i <= 5 なら 1〜5 の合計 15。"),
    },
  ],
};

// ─── 1.4 Chests and scrolls of bytes ───────────────────────────────────────
const arraysAndStrings: LessonDef = {
  slug: "arrays-and-strings",
  title: L("Chests and byte scrolls", "Cofres y rollos de bytes", "宝箱とバイトの巻物"),
  concept: "slices",
  mode: "lesson",
  xp: 70,
  enemy: "zig/undefined-imp",
  enemyName: L("BOUNDS IMP", "DIABLILLO LÍMITE", "はみ出し小鬼"),
  beats: [
    say(L(
      "An array is a chest with a fixed number of slots: [3]u8. Write [_]u8{ ... } and Zig counts them. .len is the size.",
      "Un array es un cofre con un número fijo de huecos: [3]u8. Escribe [_]u8{ ... } y Zig los cuenta. .len es el tamaño.",
      "配列はマス数が決まった宝箱：[3]u8。[_]u8{ ... } ならZigが数える。.len が大きさ。",
    )),
    {
      kind: "act",
      prompt: L("Copy the chest and change the copy", "Copia el cofre y cambia la copia", "宝箱をコピーして、コピーを変えよう"),
      steps: [
        { label: L("FILL CHEST", "LLENAR COFRE", "宝箱を作る"), line: "const a = [_]i32{ 1, 2, 3 };", effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "a", value: "1,2,3" }] },
        { label: L("COPY", "COPIAR", "コピー"), line: "var b = a;", effects: [{ t: "enter", actor: "ally" }, { t: "clone", to: "ally" }, { t: "tag", actor: "ally", text: "b", value: "1,2,3" }] },
        { label: L("CHANGE b[0]", "CAMBIAR b[0]", "b[0] を変更"), line: "b[0] = 9;", effects: [{ t: "value", actor: "ally", text: "9,2,3" }, { t: "say", actor: "hero", text: L("Mine is intact!", "¡El mío sigue igual!", "ぼくのは無事！") }] },
        { label: L("PRINT", "IMPRIMIR", "表示"), line: z`std.debug.print("{d} {d}\n", .{ a[0], b[0] });`, effects: [{ t: "print", text: "1 9" }], output: "1 9" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const a = [_]i32{ 1, 2, 3 };
        var b = a;
        b[0] = 9;
        std.debug.print("{d} {d}\n", .{ a[0], b[0] });
      `,
      options: ["1 9", "9 9", "1 1"],
      answer: 0,
      output: "1 9",
      check: { compiles: true, stdout: "1 9" },
      explain: L("Arrays are values: var b = a copies the whole chest, so a keeps its 1.", "Los arrays son valores: var b = a copia todo el cofre, así que a conserva su 1.", "配列は値。var b = a で箱ごとコピーされるから、a は 1 のまま。"),
      setup: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "a" }],
      win: [{ t: "enter", actor: "ally" }, { t: "clone", to: "ally" }, { t: "tag", actor: "ally", text: "b", value: "9,2,3" }, { t: "print", text: "1 9" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`std.debug.print("{any}\n", .{[_]u8{ 1, 2, 3 }});`,
      options: ["{ 1, 2, 3 }", "[1, 2, 3]", "123"],
      answer: 0,
      output: "{ 1, 2, 3 }",
      check: { compiles: true, stdout: "{ 1, 2, 3 }" },
      explain: L("{any} prints anything; arrays come out as { 1, 2, 3 }.", "{any} imprime cualquier cosa; los arrays salen como { 1, 2, 3 }.", "{any} は何でも表示できる。配列は { 1, 2, 3 } の形。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`
        const xs = [_]u8{ 1, 2, 3 };
        std.debug.print("{d}\n", .{xs});
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("{d} is for one number, not a whole chest: invalid format string 'd' for type '[3]u8'. Use {any}.", "{d} es para un número, no un cofre entero: invalid format string 'd' for type '[3]u8'. Usa {any}.", "{d} は数1つ用。箱ごとは無理：invalid format string。{any} を使おう。"),
    },
    say(L(
      "A string is just bytes. Its usual type is []const u8: a view of bytes you can read. .len counts bytes, not letters.",
      "Un string son solo bytes. Su tipo usual es []const u8: una vista de bytes de solo lectura. .len cuenta bytes, no letras.",
      "文字列はただのバイト列。ふつうの型は []const u8（読むだけの窓）。.len は文字数でなくバイト数。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const s = "héllo";
        std.debug.print("{d} {c}\n", .{ s.len, s[0] });
      `,
      options: ["6 h", "5 h", "6 é"],
      answer: 0,
      output: "6 h",
      check: { compiles: true, stdout: "6 h" },
      explain: L("é takes 2 bytes in UTF-8, so 5 letters are 6 bytes. s[0] is the byte 'h'.", "é ocupa 2 bytes en UTF-8, así que 5 letras son 6 bytes. s[0] es el byte 'h'.", "UTF-8 で é は2バイト。5文字で6バイト。s[0] はバイト 'h'。"),
      setup: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "s" }],
      win: [{ t: "value", actor: "hero", text: "6 bytes" }, { t: "print", text: "6 h" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const word: []const u8 = "zig";
        std.debug.print("{} {d}\n", .{ @TypeOf(word), word.len });
      `,
      options: ["[]const u8 3", "string 3", "[]const u8 4"],
      answer: 0,
      output: "[]const u8 3",
      check: { compiles: true, stdout: "[]const u8 3" },
      explain: L("There is no string type: text is []const u8. \"zig\" has 3 bytes.", "No hay tipo string: el texto es []const u8. \"zig\" tiene 3 bytes.", "string 型はない。文字列は []const u8。\"zig\" は3バイト。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        var count: u8 = 0;
        for ("banana") |ch| {
            if (ch == 'a') count += 1;
        }
        std.debug.print("{d}\n", .{count});
      `,
      options: ["3", "2", "6"],
      answer: 0,
      output: "3",
      check: { compiles: true, stdout: "3" },
      explain: L("for walks the bytes of \"banana\"; 'a' is a byte, and it appears 3 times.", "for recorre los bytes de \"banana\"; 'a' es un byte y aparece 3 veces.", "for で \"banana\" のバイトを回る。'a' は3回出てくる。"),
    },
    say(L(
      "== can't compare strings: they are views of memory. Use std.mem.eql(u8, a, b). Glue at compile time with ++ and repeat with **.",
      "== no compara strings: son vistas de memoria. Usa std.mem.eql(u8, a, b). Une al compilar con ++ y repite con **.",
      "文字列は == で比べられない。std.mem.eql(u8, a, b) を使う。++ で連結、** でくり返し（コンパイル時）。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`
        const a: []const u8 = "hi";
        const b: []const u8 = "hi";
        std.debug.print("{}\n", .{a == b});
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("Slices can't use ==: operator == not allowed for type '[]const u8'. Use std.mem.eql.", "Los slices no usan ==: operator == not allowed for type '[]const u8'. Usa std.mem.eql.", "スライスに == は使えない：operator == not allowed。std.mem.eql を使おう。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`std.debug.print("{} {}\n", .{ std.mem.eql(u8, "ab", "ab"), std.mem.eql(u8, "ab", "abc") });`,
      options: ["true false", "true true", "false false"],
      answer: 0,
      output: "true false",
      check: { compiles: true, stdout: "true false" },
      explain: L("eql compares length and every byte: \"ab\" and \"abc\" differ in length.", "eql compara el largo y cada byte: \"ab\" y \"abc\" difieren en largo.", "eql は長さと全バイトを比べる。\"ab\" と \"abc\" は長さがちがう。"),
    },
    {
      kind: "type",
      prompt: L("Compare the two words", "Compara las dos palabras", "2つの単語を比べよう"),
      code: z`
        const a: []const u8 = "gem";
        const b: []const u8 = "gem";
        std.debug.print("{}\n", .{std.mem.___(u8, a, b)});
      `,
      answer: "eql",
      check: { compiles: true, stdout: "true" },
      explain: L("std.mem.eql(u8, a, b) checks that both have the same bytes.", "std.mem.eql(u8, a, b) revisa que ambos tengan los mismos bytes.", "std.mem.eql(u8, a, b) で同じバイト列か確かめる。"),
      win: [{ t: "print", text: "true" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`std.debug.print("{s} {s}\n", .{ "con" ++ "cat", "ab" ** 3 });`,
      options: ["concat ababab", "con cat ab3", NO_CE],
      answer: 0,
      output: "concat ababab",
      check: { compiles: true, stdout: "concat ababab" },
      explain: L("++ joins and ** repeats, both at compile time.", "++ une y ** repite, ambos al compilar.", "++ は連結、** はくり返し。どちらもコンパイル時。"),
    },
    say(L(
      "Reading past the end of a chest is caught. A constant index fails to compile; a runtime index rings the alarm: panic.",
      "Leer más allá del cofre se detecta. Un índice constante no compila; uno en ejecución hace sonar la alarma: panic.",
      "箱の外を読むと見つかる。定数の番号ならコンパイルエラー、実行時の番号なら panic。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`
        const xs = [_]u8{ 1, 2, 3 };
        std.debug.print("{d}\n", .{xs[5]});
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("The index 5 is a constant and the chest has 3 slots: index 5 outside array of length 3.", "El índice 5 es constante y el cofre tiene 3 huecos: index 5 outside array of length 3.", "5 は定数で、箱は3マス：index 5 outside array of length 3。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: z`
        const xs = [_]u8{ 1, 2, 3 };
        var i: usize = 5;
        _ = &i;
        std.debug.print("{d}\n", .{xs[i]});
      `,
      options: [L("It panics: index out of bounds", "Hace panic: index out of bounds", "panic：index out of bounds"), "0", NO_CE],
      answer: 0,
      check: { compiles: true, throws: "index out of bounds" },
      explain: L("i is only known at runtime, so Debug checks then: index out of bounds: index 5, len 3.", "i se conoce solo al ejecutar, así que Debug revisa entonces: index out of bounds: index 5, len 3.", "i は実行時にわかるので、そこで検査：index out of bounds: index 5, len 3。"),
      win: [{ t: "enter", actor: "enemy" }, { t: "attack", from: "enemy", to: "hero" }, { t: "shake" }],
    },
    {
      kind: "run",
      prompt: L("Stay inside the word: it must print vowels: 2", "Quédate dentro de la palabra: debe imprimir vowels: 2", "単語の中だけ読んで vowels: 2 と表示"),
      starter: z`
        const std = @import("std");

        pub fn main() void {
            const word: []const u8 = "forge";
            var vowels: u32 = 0;
            var i: usize = 0;
            while (i <= word.len) : (i += 1) {
                switch (word[i]) {
                    'a', 'e', 'i', 'o', 'u' => vowels += 1,
                    else => {},
                }
            }
            std.debug.print("vowels: {d}\n", .{vowels});
        }
      ` + "\n",
      solution: z`
        const std = @import("std");

        pub fn main() void {
            const word: []const u8 = "forge";
            var vowels: u32 = 0;
            var i: usize = 0;
            while (i < word.len) : (i += 1) {
                switch (word[i]) {
                    'a', 'e', 'i', 'o', 'u' => vowels += 1,
                    else => {},
                }
            }
            std.debug.print("vowels: {d}\n", .{vowels});
        }
      ` + "\n",
      expect: "vowels: 2",
      fallback: [String.raw`while\s*\(\s*i\s*<\s*word\.len\s*\)`, String.raw`while\s*\(\s*i\s*<=\s*word\.len\s*-\s*1\s*\)`],
      explain: L("Slots go from 0 to len - 1. i <= word.len reads one byte past the end and panics.", "Los huecos van de 0 a len - 1. i <= word.len lee un byte de más y hace panic.", "マスは 0〜len-1。i <= word.len だと1つはみ出して panic。"),
    },
  ],
};

// ─── BOSS · The Overflow Spark ─────────────────────────────────────────────
const boss: LessonDef = {
  slug: "village-boss",
  title: L("The Overflow Spark", "La Chispa del Desborde", "オーバーフロー火花"),
  concept: "integers",
  mode: "boss",
  xp: 160,
  enemy: "zig/overflow-spark",
  enemyName: L("OVERFLOW SPARK", "CHISPA DESBORDE", "オーバーフロー火花"),
  beats: [
    enemySays(L(
      "CRACKLE! I am the Overflow Spark. I live past the top of every chip. Count wrong once and I burst free!",
      "¡CRAC! Soy la Chispa del Desborde. Vivo más allá del tope de cada ficha. ¡Cuenta mal una vez y me libero!",
      "パチパチ！我はオーバーフロー火花。チップの上限の先に住む。数えまちがえたら飛び出すぞ！",
    )),
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: z`std.debug.print("{d} {d}\n", .{ @as(u8, 200) +| 100, @as(i8, -100) -| 100 });`,
      options: ["255 -128", "300 -200", "44 56"],
      answer: 0, output: "255 -128",
      check: { compiles: true, stdout: "255 -128" },
      explain: L("Saturating ops stick at the edges: u8 tops at 255, i8 bottoms at -128.", "Las operaciones saturadas se quedan en los bordes: u8 tope 255, i8 piso -128.", "飽和演算は端で止まる。u8 は上限 255、i8 は下限 -128。"),
    },
    {
      kind: "predict", time: 12, prompt: HAPPENS,
      code: z`
        var hp: u8 = 5;
        hp -= 6;
      `,
      options: [PANIC_OVERFLOW, L("hp becomes 255", "hp pasa a 255", "hp が 255 になる"), "-1"],
      answer: 0,
      check: { compiles: true, throws: "integer overflow" },
      explain: L("5 - 6 is below 0, which a u8 can't hold. Plain -= is checked and panics.", "5 - 6 queda bajo 0, que un u8 no admite. El -= normal se revisa y hace panic.", "5 - 6 は 0 未満で u8 に入らない。ふつうの -= は検査されて panic。"),
      win: [{ t: "attack", from: "enemy", to: "hero" }, { t: "shake" }],
    },
    {
      kind: "predict", time: 12, prompt: PRINT,
      code: z`
        var c: u8 = 255;
        c +%= 2;
        std.debug.print("{d}\n", .{c});
      `,
      options: ["1", "255", "257"],
      answer: 0, output: "1",
      check: { compiles: true, stdout: "1" },
      explain: L("+%= wraps: 255, 0, 1.", "+%= da la vuelta: 255, 0, 1.", "+%= は一周：255, 0, 1。"),
    },
    {
      kind: "predict", time: 12, prompt: COMPILES,
      code: z`
        var lives: u8 = 3;
        std.debug.print("{d}\n", .{lives});
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("lives never changes: local variable is never mutated. Use const.", "lives nunca cambia: local variable is never mutated. Usa const.", "lives は変わらない：local variable is never mutated。const にしよう。"),
    },
    {
      kind: "pick", time: 15,
      prompt: L("Keep the low bits of 300", "Guarda los bits bajos de 300", "300 の下位ビットを残せ"),
      code: z`
        const big: u32 = 300;
        const small: u8 = ___(big);
        std.debug.print("{d}\n", .{small});
      `,
      options: ["@truncate", "@intCast"],
      answer: 0,
      check: { compiles: true, stdout: "44", wrongFail: true },
      explain: L("@truncate drops the high bits: 44. @intCast on a known 300 fails: it can't fit a u8.", "@truncate quita los bits altos: 44. @intCast con un 300 conocido falla: no cabe en u8.", "@truncate は上位ビットを捨てて 44。300 が既知なら @intCast はエラー。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: z`std.debug.print("{d} {d}\n", .{ @divTrunc(-9, 2), @divFloor(-9, 2) });`,
      options: ["-4 -5", "-5 -4", "-4 -4"],
      answer: 0, output: "-4 -5",
      check: { compiles: true, stdout: "-4 -5" },
      explain: L("-4.5 cut toward zero is -4; rounded down it is -5.", "-4.5 cortado hacia cero es -4; redondeado abajo es -5.", "-4.5 を0方向に切ると -4、下に丸めると -5。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: z`
        const g: u8 = 95;
        const grade = switch (g) {
            90...100 => 'A',
            70...89 => 'B',
            else => 'C',
        };
        std.debug.print("{c}\n", .{grade});
      `,
      options: ["A", "B", "C"],
      answer: 0, output: "A",
      check: { compiles: true, stdout: "A" },
      explain: L("95 is in 90...100: 'A'. The ... range includes both ends.", "95 está en 90...100: 'A'. El rango ... incluye ambos extremos.", "95 は 90...100 に入る：'A'。... は両端をふくむ。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: z`
        var sum: usize = 0;
        for ([_]usize{ 5, 6, 7 }, 0..) |v, i| sum += v * i;
        std.debug.print("{d}\n", .{sum});
      `,
      options: ["20", "18", "38"],
      answer: 0, output: "20",
      check: { compiles: true, stdout: "20" },
      explain: L("5*0 + 6*1 + 7*2 = 0 + 6 + 14 = 20.", "5*0 + 6*1 + 7*2 = 0 + 6 + 14 = 20.", "5*0 + 6*1 + 7*2 = 0 + 6 + 14 = 20。"),
    },
    {
      kind: "predict", time: 12, prompt: COMPILES,
      code: z`
        const a: []const u8 = "ore";
        if (a == "ore") std.debug.print("same\n", .{});
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("No == on strings. Use std.mem.eql(u8, a, \"ore\").", "No hay == para strings. Usa std.mem.eql(u8, a, \"ore\").", "文字列に == は使えない。std.mem.eql(u8, a, \"ore\") を使う。"),
    },
    {
      kind: "predict", time: 15, prompt: HAPPENS,
      code: z`
        const word: []const u8 = "zig";
        var i: usize = 3;
        _ = &i;
        std.debug.print("{c}\n", .{word[i]});
      `,
      options: [L("It panics: index out of bounds", "Hace panic: index out of bounds", "panic：index out of bounds"), "g", NO_CE],
      answer: 0,
      check: { compiles: true, throws: "index out of bounds" },
      explain: L("\"zig\" has slots 0, 1, 2. Slot 3 is past the end: panic.", "\"zig\" tiene los huecos 0, 1, 2. El 3 está fuera: panic.", "\"zig\" のマスは 0, 1, 2。3 ははみ出して panic。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "predict", time: 12, prompt: PRINT,
      code: z`
        const a = [_]u8{ 4, 5 };
        var b = a;
        b[1] = 0;
        std.debug.print("{any} {any}\n", .{ a, b });
      `,
      options: ["{ 4, 5 } { 4, 0 }", "{ 4, 0 } { 4, 0 }", "{ 4, 5 } { 4, 5 }"],
      answer: 0, output: "{ 4, 5 } { 4, 0 }",
      check: { compiles: true, stdout: "{ 4, 5 } { 4, 0 }" },
      explain: L("b is a full copy of the chest; changing b leaves a alone.", "b es una copia completa del cofre; cambiar b no toca a.", "b は箱の完全なコピー。b を変えても a はそのまま。"),
    },
    {
      kind: "type", time: 15,
      prompt: L("Stick at the max", "Quédate en el máximo", "上限で止めろ"),
      code: z`
        var hp: u8 = 250;
        hp ___ 10;
        std.debug.print("{d}\n", .{hp});
      `,
      answer: "+|=",
      check: { compiles: true, stdout: "255" },
      explain: L("+|= saturates: 250 + 10 sticks at 255 instead of panicking.", "+|= satura: 250 + 10 se queda en 255 en vez de hacer panic.", "+|= は飽和：250 + 10 は panic せず 255 で止まる。"),
    },
    enemySays(L(
      "Fzzt... every chip held. Beyond the village lies the Optional Forest, where bottles may be empty...",
      "Fzzt... cada ficha aguantó. Pasando la aldea está el Bosque Opcional, donde las botellas pueden estar vacías...",
      "ジジッ…どのチップもあふれなかった。村の先はオプショナルの森。からっぽのビンがあるぞ…",
    )),
  ],
};

export const forgeVillage: RegionDef = {
  slug: "forge-village",
  name: L("Forge Village", "Aldea Forja", "鍛冶の村"),
  subtitle: L("const/var · integers · loops · strings", "const/var · enteros · bucles · strings", "const/var・整数・ループ・文字列"),
  theme: "village",
  lessons: [constAndVar, integerWidths, loopsAndSwitch, arraysAndStrings, boss],
};
