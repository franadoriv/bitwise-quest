import type { Beat, LessonDef, RegionDef, Text } from "../../../lib/content/types.ts";
import { L } from "../../../lib/i18n/text.ts";

// REGION 2 · OPTIONAL FOREST  (optionals, error unions, defer/errdefer, undefined and safety checks)

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
const PANIC_NULL = L("It panics: null value", "Hace panic: valor null", "panic：null の値");

// Shared declarations for the error-union questions.
const OPEN = z`
  const FileError = error{ NotFound, Denied };

  fn open(name: []const u8) FileError!u32 {
      if (std.mem.eql(u8, name, "ok")) return 3;
      if (std.mem.eql(u8, name, "secret")) return error.Denied;
      return error.NotFound;
  }
`;
const HALF = z`
  fn half(n: u32) !u32 {
      if (n % 2 == 1) return error.Odd;
      return n / 2;
  }
`;
const main = (body: string): string => `pub fn main() !void {\n${body.split("\n").map((l) => "    " + l).join("\n")}\n}`;

// ─── 2.1 Bottles that may be empty ─────────────────────────────────────────
const optionals: LessonDef = {
  slug: "optionals",
  title: L("Bottles that may be empty", "Botellas quizá vacías", "からっぽかもしれないビン"),
  concept: "optionals",
  mode: "lesson",
  xp: 70,
  enemy: "ghost",
  enemyName: L("NULL GHOST", "FANTASMA NULL", "ヌルおばけ"),
  beats: [
    say(L(
      "Welcome to the Optional Forest! Some values may be missing. ?i32 is a bottle: it holds an i32 or null (empty).",
      "¡Bienvenido al Bosque Opcional! Algunos valores pueden faltar. ?i32 es una botella: guarda un i32 o null (vacía).",
      "オプショナルの森へようこそ！値がないこともある。?i32 はビン。i32 か null（から）が入る。",
    )),
    {
      kind: "act",
      prompt: L("Fill the bottle, then open it", "Llena la botella y luego ábrela", "ビンを満たして、開けよう"),
      steps: [
        { label: L("EMPTY BOTTLE", "BOTELLA VACÍA", "からのビン"), line: "var maybe: ?i32 = null;", effects: [{ t: "item", kind: "potion", holder: "hero" }, { t: "tag", actor: "hero", text: "maybe", value: "null" }] },
        { label: L("FILL IT", "LLENARLA", "満たす"), line: "maybe = 5;", effects: [{ t: "value", actor: "hero", text: "5" }] },
        { label: L("OPEN .?", "ABRIR .?", ".? で開ける"), line: z`std.debug.print("{d}\n", .{maybe.?});`, effects: [{ t: "print", text: "5" }], output: "5" },
        { label: L("EMPTY IT", "VACIARLA", "からにする"), line: "maybe = null;", effects: [{ t: "value", actor: "hero", text: "null" }] },
        {
          label: L("OPEN AGAIN", "ABRIR OTRA VEZ", "また開ける"),
          line: z`std.debug.print("{d}\n", .{maybe.?});`,
          effects: [{ t: "enter", actor: "enemy" }, { t: "shake" }, { t: "say", actor: "enemy", text: L("Boo! Empty!", "¡Bu! ¡Vacía!", "ばあ！から！") }],
          error: {
            compiler: "panic: attempt to use null value",
            plain: L(".? means 'I'm sure it's full'. On an empty bottle the program stops.", ".? significa 'seguro que está llena'. Con una botella vacía el programa se detiene.", ".? は「絶対入ってる」の意味。からのビンだとプログラムが止まる。"),
          },
        },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        var maybe: ?i32 = null;
        std.debug.print("{any} {}\n", .{ maybe, maybe == null });
        maybe = 5;
        std.debug.print("{any} {d}\n", .{ maybe, maybe.? });
      `,
      options: [L("null true, then 5 5", "null true, luego 5 5", "null true の次に 5 5"), L("0 true, then 5 5", "0 true, luego 5 5", "0 true の次に 5 5"), L("null false, then 5 null", "null false, luego 5 null", "null false の次に 5 null")],
      answer: 0,
      output: "null true\n5 5",
      check: { compiles: true, stdout: "null true\n5 5" },
      explain: L("An empty optional prints null and equals null. After maybe = 5, .? unwraps the 5.", "Un opcional vacío imprime null y es igual a null. Tras maybe = 5, .? saca el 5.", "からのオプショナルは null と表示され == null。maybe = 5 のあと .? で 5 を取り出す。"),
      setup: [{ t: "item", kind: "potion", holder: "hero" }, { t: "tag", actor: "hero", text: "maybe", value: "null" }],
      win: [{ t: "print", text: "null true" }, { t: "value", actor: "hero", text: "5" }, { t: "print", text: "5 5" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: "const x: i32 = null;\n_ = x;",
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("A plain i32 can never be null: expected type 'i32', found '@TypeOf(null)'. Only ?i32 can.", "Un i32 normal nunca puede ser null: expected type 'i32', found '@TypeOf(null)'. Solo ?i32 puede.", "ふつうの i32 は null になれない：expected type 'i32'。null になれるのは ?i32 だけ。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: "const p: *i32 = null;\n_ = p;",
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("Pointers aren't nullable either: *i32 always points somewhere. A maybe-pointer is ?*i32.", "Los punteros tampoco aceptan null: *i32 siempre apunta a algo. Un quizá-puntero es ?*i32.", "ポインタも null 不可。*i32 は必ずどこかを指す。null ありは ?*i32。"),
    },
    say(L(
      "orelse gives a spare: maybe orelse 0 is the value inside, or 0 if the bottle is empty.",
      "orelse da un repuesto: maybe orelse 0 es el valor de adentro, o 0 si la botella está vacía.",
      "orelse は予備をくれる。maybe orelse 0 は中身、からなら 0。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const none: ?i32 = null;
        std.debug.print("{d}\n", .{none orelse 0});
      `,
      options: ["0", "null", NO_CE],
      answer: 0,
      output: "0",
      check: { compiles: true, stdout: "0" },
      explain: L("none is empty, so orelse hands over the spare 0.", "none está vacía, así que orelse entrega el repuesto 0.", "none はからなので orelse が予備の 0 をわたす。"),
      setup: [{ t: "item", kind: "potion", holder: "hero" }, { t: "tag", actor: "hero", text: "none", value: "null" }],
      win: [{ t: "enter", actor: "ally" }, { t: "item", kind: "potion", holder: "ally" }, { t: "give", to: "hero" }, { t: "print", text: "0" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const opt: ?[]const u8 = null;
        const name = opt orelse "nobody";
        std.debug.print("{s}\n", .{name});
      `,
      options: ["nobody", "null", ""],
      answer: 0,
      output: "nobody",
      check: { compiles: true, stdout: "nobody" },
      explain: L("Any type can be optional, text too. orelse gives \"nobody\".", "Cualquier tipo puede ser opcional, el texto también. orelse da \"nobody\".", "どんな型もオプショナルにできる。orelse で \"nobody\"。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`
        const x: ?i32 = 5;
        const y: i32 = x + 1;
        _ = y;
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("You can't do math on a closed bottle. Unwrap first: (x orelse 0) + 1 or x.? + 1.", "No puedes calcular con una botella cerrada. Ábrela antes: (x orelse 0) + 1 o x.? + 1.", "閉じたビンで計算はできない。先に開けよう：(x orelse 0) + 1 か x.? + 1。"),
    },
    {
      kind: "type",
      prompt: L("Give a spare name", "Da un nombre de repuesto", "予備の名前をわたそう"),
      code: z`
        const opt: ?[]const u8 = null;
        const name = opt ___ "guest";
        std.debug.print("{s}\n", .{name});
      `,
      answer: "orelse",
      check: { compiles: true, stdout: "guest" },
      explain: L("orelse unwraps the optional or uses the value on its right.", "orelse abre el opcional o usa el valor de la derecha.", "orelse は中身を出すか、右の値を使う。"),
      win: [{ t: "print", text: "guest" }],
    },
    say(L(
      ".? says 'I'm sure it's full'. If you're wrong, Iggi's alarm rings: panic. Use it only when null is truly impossible.",
      ".? dice 'seguro que está llena'. Si te equivocas, suena la alarma de Iggi: panic. Úsalo solo si null es imposible.",
      ".? は「絶対入ってる」宣言。外れたらアラームで panic。null がありえない時だけ使おう。",
    )),
    {
      kind: "predict",
      prompt: HAPPENS,
      code: z`
        var x: ?i32 = null;
        _ = &x;
        std.debug.print("before\n", .{});
        std.debug.print("{d}\n", .{x.?});
      `,
      options: [L("Prints before, then panics", "Imprime before y luego panic", "before と表示して panic"), L("Prints before, then 0", "Imprime before y luego 0", "before のあと 0"), NO_CE],
      answer: 0,
      check: { compiles: true, throws: "attempt to use null value" },
      explain: L("The first print runs, then .? on null panics: attempt to use null value.", "El primer print corre, luego .? sobre null hace panic: attempt to use null value.", "最初の print は動き、null に .? で panic：attempt to use null value。"),
      win: [{ t: "print", text: "before" }, { t: "enter", actor: "enemy" }, { t: "shake" }],
    },
    say(L(
      "The safe way: if (maybe) |v| { ... } opens the bottle only when it's full, and tags the contents v.",
      "La forma segura: if (maybe) |v| { ... } abre la botella solo si está llena, y llama v al contenido.",
      "安全な方法：if (maybe) |v| { ... } は入っている時だけ開けて、中身を v と呼ぶ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const maybe: ?i32 = 5;
        if (maybe) |v| {
            std.debug.print("got {d}\n", .{v});
        } else {
            std.debug.print("none\n", .{});
        }
      `,
      options: ["got 5", "none", "got null"],
      answer: 0,
      output: "got 5",
      check: { compiles: true, stdout: "got 5" },
      explain: L("maybe holds 5, so the if branch runs with v = 5.", "maybe guarda 5, así que corre la rama if con v = 5.", "maybe に 5 が入っているので v = 5 で if 側が動く。"),
      setup: [{ t: "item", kind: "potion", holder: "hero" }, { t: "tag", actor: "hero", text: "maybe", value: "5" }],
      win: [{ t: "tag", actor: "hero", text: "v", value: "5" }, { t: "print", text: "got 5" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`
        const n: i32 = 5;
        if (n) |v| {
            _ = v;
        }
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("|v| capture needs an optional: expected optional type, found 'i32'.", "La captura |v| necesita un opcional: expected optional type, found 'i32'.", "|v| で取り出すにはオプショナルが要る：expected optional type。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        fn find(xs: []const i32, target: i32) ?usize {
            for (xs, 0..) |x, i| {
                if (x == target) return i;
            }
            return null;
        }

        pub fn main() void {
            const xs = [_]i32{ 4, 8, 15 };
            std.debug.print("{any} {any}\n", .{ find(&xs, 8), find(&xs, 99) });
        }
      `,
      options: ["1 null", "8 null", "1 0"],
      answer: 0,
      output: "1 null",
      check: { compiles: true, stdout: "1 null" },
      explain: L("?usize says 'maybe an index'. 8 is at index 1; 99 isn't there, so null.", "?usize dice 'quizá un índice'. 8 está en el índice 1; 99 no está, así que null.", "?usize は「番号かも」。8 は番号 1、99 はないので null。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        var it = std.mem.splitScalar(u8, "a,b,c", ',');
        while (it.next()) |part| std.debug.print("[{s}]", .{part});
        std.debug.print("\n", .{});
      `,
      options: ["[a][b][c]", "[a,b,c]", "[a][b]"],
      answer: 0,
      output: "[a][b][c]",
      check: { compiles: true, stdout: "[a][b][c]" },
      explain: L("next() returns ?[]const u8. while |part| runs until it returns null.", "next() devuelve ?[]const u8. while |part| corre hasta que devuelve null.", "next() は ?[]const u8 を返す。while |part| は null が来るまで回る。"),
    },
    {
      kind: "run",
      prompt: L("Handle the missing name: print not found", "Maneja el nombre faltante: imprime not found", "見つからない時に not found と表示"),
      starter: z`
        const std = @import("std");

        fn find(names: []const []const u8, target: []const u8) ?usize {
            for (names, 0..) |name, i| {
                if (std.mem.eql(u8, name, target)) return i;
            }
            return null;
        }

        pub fn main() void {
            const team = [_][]const u8{ "iggi", "rex" };
            const slot = find(&team, "zed").?;
            std.debug.print("slot: {d}\n", .{slot});
        }
      ` + "\n",
      solution: z`
        const std = @import("std");

        fn find(names: []const []const u8, target: []const u8) ?usize {
            for (names, 0..) |name, i| {
                if (std.mem.eql(u8, name, target)) return i;
            }
            return null;
        }

        pub fn main() void {
            const team = [_][]const u8{ "iggi", "rex" };
            if (find(&team, "zed")) |slot| {
                std.debug.print("slot: {d}\n", .{slot});
            } else {
                std.debug.print("not found\n", .{});
            }
        }
      ` + "\n",
      expect: "not found",
      fallback: [String.raw`if\s*\(\s*find\s*\(`, String.raw`\borelse\b`],
      explain: L("\"zed\" isn't on the team, so .? panics. if (...) |slot| handles both cases.", "\"zed\" no está en el equipo, así que .? hace panic. if (...) |slot| maneja ambos casos.", "\"zed\" はいないので .? は panic。if (...) |slot| なら両方あつかえる。"),
    },
  ],
};

// ─── 2.2 Red scrolls ───────────────────────────────────────────────────────
const errorUnions: LessonDef = {
  slug: "error-unions",
  title: L("Red scrolls", "Pergaminos rojos", "赤い巻物"),
  concept: "errors",
  mode: "lesson",
  xp: 75,
  enemy: "golem",
  enemyName: L("ERROR GOLEM", "GÓLEM DE ERROR", "エラーゴーレム"),
  beats: [
    say(L(
      "Zig has no exceptions. A function that can fail returns E!T: either an error from set E, or a T. Errors are plain values.",
      "Zig no tiene excepciones. Una función que puede fallar devuelve E!T: un error del conjunto E, o un T. Los errores son valores.",
      "Zig に例外はない。失敗しうる関数は E!T を返す：エラー集合 E のどれか、または T。",
    )),
    {
      kind: "act",
      prompt: L("Ask the forge for files and watch the scrolls", "Pide archivos a la forja y mira los pergaminos", "ファイルを頼んで、巻物を見よう"),
      steps: [
        { label: L("ASK ok", "PEDIR ok", "ok を頼む"), line: 'const a = open("ok") catch 0;', effects: [{ t: "enter", actor: "ally" }, { t: "item", kind: "key", holder: "ally" }, { t: "give", to: "hero" }, { t: "tag", actor: "hero", text: "a", value: "3" }] },
        { label: L("ASK nope", "PEDIR nope", "nope を頼む"), line: 'const b = open("nope") catch 0;', effects: [{ t: "item", kind: "scroll", holder: "ally" }, { t: "say", actor: "ally", text: L("error.NotFound", "error.NotFound", "error.NotFound") }, { t: "drop" }, { t: "say", actor: "hero", text: L("catch: use 0", "catch: usa 0", "catch：0 を使う") }] },
        { label: L("PRINT", "IMPRIMIR", "表示"), line: z`std.debug.print("{d} {d}\n", .{ a, b });`, effects: [{ t: "print", text: "3 0" }], output: "3 0" },
        {
          label: L("IGNORE IT", "IGNORARLO", "無視する"),
          line: 'open("nope");',
          effects: [{ t: "shake" }],
          error: {
            compiler: "error: error union is ignored",
            plain: L("You may not drop a red scroll on the floor. Handle it with catch or try.", "No puedes tirar un pergamino rojo al suelo. Manéjalo con catch o try.", "赤い巻物は床にすてられない。catch か try であつかおう。"),
          },
        },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: OPEN + "\n\n" + main(z`
        const a = open("ok") catch 0;
        const b = open("nope") catch 0;
        std.debug.print("{d} {d}\n", .{ a, b });
      `),
      options: ["3 0", "3 NotFound", "0 0"],
      answer: 0,
      output: "3 0",
      check: { compiles: true, stdout: "3 0" },
      explain: L("open(\"ok\") succeeds with 3. open(\"nope\") fails, and catch 0 replaces the error with 0.", "open(\"ok\") tiene éxito con 3. open(\"nope\") falla, y catch 0 cambia el error por 0.", "open(\"ok\") は 3 で成功。open(\"nope\") は失敗し、catch 0 が 0 に置きかえる。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: OPEN + "\n\n" + main(z`
        if (open("secret")) |fd| {
            std.debug.print("fd {d}\n", .{fd});
        } else |err| {
            std.debug.print("{s}\n", .{@errorName(err)});
        }
      `),
      options: ["Denied", "fd 3", "NotFound"],
      answer: 0,
      output: "Denied",
      check: { compiles: true, stdout: "Denied" },
      explain: L("\"secret\" returns error.Denied. else |err| captures it and @errorName gives its name.", "\"secret\" devuelve error.Denied. else |err| lo captura y @errorName da su nombre.", "\"secret\" は error.Denied。else |err| で受けとり @errorName で名前を出す。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: HALF + "\n\n" + main(z`
        const v: u32 = half(4);
        _ = v;
      `),
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("half returns !u32, not u32: cannot convert error union to payload type. Unwrap it first.", "half devuelve !u32, no u32: cannot convert error union to payload type. Ábrelo primero.", "half は u32 でなく !u32：cannot convert error union to payload type。先に取り出そう。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: HALF + "\n\n" + main("half(4);"),
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("A possible error can't be silently dropped: error union is ignored.", "Un posible error no se puede tirar en silencio: error union is ignored.", "起きうるエラーをだまって捨てられない：error union is ignored。"),
    },
    say(L(
      "try x means 'unwrap x, or return its error to MY caller'. The red scroll travels up. It only works in a function that returns !T.",
      "try x significa 'abre x, o devuelve su error a QUIEN me llamó'. El pergamino rojo sube. Solo funciona en funciones que devuelven !T.",
      "try x は「x を取り出す、だめなら呼び出し元にエラーを返す」。!T を返す関数でだけ使える。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: OPEN + "\n\n" + z`
        fn twice(name: []const u8) !u32 {
            const fd = try open(name);
            return fd * 2;
        }
      ` + "\n\n" + main(z`std.debug.print("{any} {any}\n", .{ twice("ok"), twice("x") });`),
      options: ["6 error.NotFound", "6 0", "3 error.NotFound"],
      answer: 0,
      output: "6 error.NotFound",
      check: { compiles: true, stdout: "6 error.NotFound" },
      explain: L("twice(\"ok\") gets 3 and returns 6. For \"x\", try passes error.NotFound straight up.", "twice(\"ok\") obtiene 3 y devuelve 6. Con \"x\", try pasa error.NotFound hacia arriba.", "twice(\"ok\") は 3 を得て 6。\"x\" では try が error.NotFound をそのまま上へ返す。"),
      win: [{ t: "enter", actor: "ally" }, { t: "item", kind: "scroll", holder: "ally" }, { t: "give", to: "hero" }, { t: "print", text: "6 error.NotFound" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: HALF + "\n\n" + z`
        fn show() void {
            const v = try half(4);
            std.debug.print("{d}\n", .{v});
        }
      ` + "\n\n" + main("show();"),
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("show returns void, so try has nowhere to send the error: function cannot return an error.", "show devuelve void, así que try no tiene adónde mandar el error: function cannot return an error.", "show は void なので try がエラーを返す先がない：function cannot return an error。"),
    },
    {
      kind: "type",
      prompt: L("Pass the error up", "Pasa el error hacia arriba", "エラーを上へわたそう"),
      code: HALF + "\n\n" + z`
        fn quarter(n: u32) !u32 {
            const h = ___ half(n);
            return h / 2;
        }
      ` + "\n\n" + main(z`std.debug.print("{any}\n", .{quarter(8)});`),
      answer: "try",
      check: { compiles: true, stdout: "2" },
      explain: L("try unwraps half(n) or returns its error from quarter. quarter(8) is 2.", "try abre half(n) o devuelve su error desde quarter. quarter(8) es 2.", "try は half(n) を取り出すか、quarter からエラーを返す。quarter(8) は 2。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        const num = try std.fmt.parseInt(i32, "-42", 10);
        std.debug.print("{d}\n", .{num + 2});
      `,
      options: ["-40", "-42", "error.InvalidCharacter"],
      answer: 0,
      output: "-40",
      check: { compiles: true, stdout: "-40" },
      explain: L("parseInt returns an error union. \"-42\" is valid, so try unwraps -42 and -42 + 2 = -40.", "parseInt devuelve una unión de error. \"-42\" es válido, así que try saca -42 y -42 + 2 = -40.", "parseInt はエラー共用体を返す。\"-42\" は正しいので try で -42、+2 で -40。"),
    },
    say(L(
      "catch |err| captures the error so you can react. A switch on it must cover every error in the set.",
      "catch |err| captura el error para que reacciones. Un switch sobre él debe cubrir cada error del conjunto.",
      "catch |err| でエラーを受けとって対応できる。switch するなら集合の全エラーをカバー。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: OPEN + "\n\n" + main(z`
        const code = open("x") catch |err| switch (err) {
            error.NotFound => @as(u32, 404),
            error.Denied => 403,
        };
        std.debug.print("{d}\n", .{code});
      `),
      options: ["404", "403", "3"],
      answer: 0,
      output: "404",
      check: { compiles: true, stdout: "404" },
      explain: L("open(\"x\") fails with NotFound, and the switch maps it to 404.", "open(\"x\") falla con NotFound, y el switch lo convierte en 404.", "open(\"x\") は NotFound で失敗し、switch が 404 に変える。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: HALF + "\n\n" + main(z`
        const v = half(3) catch |e| switch (e) {
            error.Odd => 0,
            error.Even => 1,
        };
        _ = v;
      `),
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("half can only fail with Odd. Even isn't in its set: 'error.Even' not a member of destination error set.", "half solo falla con Odd. Even no está en su conjunto: 'error.Even' not a member of destination error set.", "half のエラーは Odd だけ。Even は集合にない：not a member of destination error set。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`std.debug.print("{any} {any}\n", .{ std.fmt.parseInt(u8, "300", 10), std.fmt.parseInt(u8, "x1", 10) });`,
      options: ["error.Overflow error.InvalidCharacter", "44 0", "300 error.InvalidCharacter"],
      answer: 0,
      output: "error.Overflow error.InvalidCharacter",
      check: { compiles: true, stdout: "error.Overflow error.InvalidCharacter" },
      explain: L("300 doesn't fit a u8: Overflow. \"x1\" isn't a number: InvalidCharacter.", "300 no cabe en u8: Overflow. \"x1\" no es un número: InvalidCharacter.", "300 は u8 に入らず Overflow。\"x1\" は数でなく InvalidCharacter。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: HALF + "\n\n" + main(z`
        const v = half(3) catch unreachable;
        std.debug.print("{d}\n", .{v});
      `),
      options: [L("It panics: unwrap error", "Hace panic: unwrap error", "panic：unwrap error"), "1", "0"],
      answer: 0,
      check: { compiles: true, throws: "attempt to unwrap error" },
      explain: L("catch unreachable promises no error. 3 is odd, so it panics: attempt to unwrap error: Odd.", "catch unreachable promete que no hay error. 3 es impar, así que panic: attempt to unwrap error: Odd.", "catch unreachable は「エラーなし」の約束。3 は奇数で panic：attempt to unwrap error: Odd。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "run",
      prompt: L("Handle bad input: print bad input: Overflow", "Maneja la entrada mala: imprime bad input: Overflow", "悪い入力をあつかい bad input: Overflow と表示"),
      starter: z`
        const std = @import("std");

        pub fn main() void {
            const level = std.fmt.parseInt(u8, "300", 10) catch unreachable;
            std.debug.print("level: {d}\n", .{level});
        }
      ` + "\n",
      solution: z`
        const std = @import("std");

        pub fn main() void {
            const level = std.fmt.parseInt(u8, "300", 10) catch |err| {
                std.debug.print("bad input: {s}\n", .{@errorName(err)});
                return;
            };
            std.debug.print("level: {d}\n", .{level});
        }
      ` + "\n",
      expect: "bad input: Overflow",
      fallback: [String.raw`catch\s*\|\s*\w+\s*\|`, String.raw`else\s*\|\s*\w+\s*\|`],
      explain: L("300 can fail to parse, so catch unreachable panics. catch |err| prints the error name instead.", "300 puede fallar al leerse, así que catch unreachable hace panic. catch |err| imprime el nombre del error.", "300 は変換に失敗しうるので catch unreachable は panic。catch |err| でエラー名を表示。"),
    },
  ],
};

// ─── 2.3 Scrolls on the board ──────────────────────────────────────────────
const deferAndErrdefer: LessonDef = {
  slug: "defer-and-errdefer",
  title: L("Scrolls on the board", "Pergaminos en el tablero", "掲示板の巻物"),
  concept: "defer",
  mode: "lesson",
  xp: 75,
  enemy: "zig/leak-jelly",
  enemyName: L("LEAK JELLY", "MEDUSA FUGA", "リーククラゲ"),
  beats: [
    say(L(
      "Forgot to clean up? The Leak Jelly feeds on that. defer pins a line on a board: it runs when the current scope ends.",
      "¿Olvidaste limpiar? La Medusa Fuga se alimenta de eso. defer clava una línea en un tablero: corre al terminar el bloque.",
      "片づけ忘れはリーククラゲのえさ。defer は行を掲示板に貼る。今のスコープの終わりに動くよ。",
    )),
    {
      kind: "act",
      prompt: L("Pin two scrolls, then end the scope", "Clava dos pergaminos y termina el bloque", "巻物を2枚貼って、スコープを終えよう"),
      steps: [
        { label: L("PIN first", "CLAVAR first", "first を貼る"), line: z`defer std.debug.print("first\n", .{});`, effects: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "first" }] },
        { label: L("PIN second", "CLAVAR second", "second を貼る"), line: z`defer std.debug.print("second\n", .{});`, effects: [{ t: "enter", actor: "ally" }, { t: "item", kind: "scroll", holder: "ally" }, { t: "tag", actor: "ally", text: "second" }] },
        { label: L("BODY", "CUERPO", "本体"), line: z`std.debug.print("body\n", .{});`, effects: [{ t: "print", text: "body" }], output: "body" },
        { label: L("END SCOPE", "FIN DEL BLOQUE", "スコープ終了"), line: "}", effects: [{ t: "print", text: "second" }, { t: "untag", actor: "ally" }, { t: "print", text: "first" }, { t: "untag", actor: "hero" }, { t: "banner", text: L("last in, first out", "último entra, 1.º sale", "後入れ先出し") }], output: "second\nfirst" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        defer std.debug.print("first\n", .{});
        defer std.debug.print("second\n", .{});
        std.debug.print("body\n", .{});
      `,
      options: [L("body, second, first", "body, second, first", "body → second → first"), L("first, second, body", "first, second, body", "first → second → body"), L("body, first, second", "body, first, second", "body → first → second")],
      answer: 0,
      output: "body\nsecond\nfirst",
      check: { compiles: true, stdout: "body\nsecond\nfirst" },
      explain: L("Defers wait for the end of the scope and run in reverse: the last pinned runs first.", "Los defer esperan al final del bloque y corren al revés: el último clavado corre primero.", "defer はスコープの終わりまで待ち、逆順に動く。最後に貼ったものが最初。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        {
            defer std.debug.print("block end\n", .{});
            std.debug.print("inside\n", .{});
        }
        std.debug.print("after\n", .{});
      `,
      options: [L("inside, block end, after", "inside, block end, after", "inside → block end → after"), L("inside, after, block end", "inside, after, block end", "inside → after → block end")],
      answer: 0,
      output: "inside\nblock end\nafter",
      check: { compiles: true, stdout: "inside\nblock end\nafter" },
      explain: L("defer belongs to its block { }, not the whole function. It runs at that }.", "defer pertenece a su bloque { }, no a toda la función. Corre en esa }.", "defer は関数全体でなく、その { } ブロックのもの。その } で動く。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        for (0..3) |k| {
            defer std.debug.print("{d}", .{k});
        }
        std.debug.print("\n", .{});
      `,
      options: ["012", "210", "333"],
      answer: 0,
      output: "012",
      check: { compiles: true, stdout: "012" },
      explain: L("Each loop lap is its own scope, so each defer runs at the end of its lap: 0, 1, 2.", "Cada vuelta del bucle es su propio bloque, así que cada defer corre al final de su vuelta: 0, 1, 2.", "ループの1周ごとに別スコープ。defer はその周の終わりに動く：0, 1, 2。"),
    },
    say(L(
      "A deferred line runs whole at the end, so it sees the newest values. Nothing is saved early.",
      "Una línea diferida corre entera al final, así que ve los valores más nuevos. Nada se guarda antes.",
      "defer の行は最後にまるごと動く。だから最新の値を見る。先に何かを保存したりしない。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        var x: u32 = 1;
        defer std.debug.print("deferred: {d}\n", .{x});
        x = 2;
        std.debug.print("now: {d}\n", .{x});
      `,
      options: [L("now: 2, then deferred: 2", "now: 2, luego deferred: 2", "now: 2 のあと deferred: 2"), L("now: 2, then deferred: 1", "now: 2, luego deferred: 1", "now: 2 のあと deferred: 1")],
      answer: 0,
      output: "now: 2\ndeferred: 2",
      check: { compiles: true, stdout: "now: 2\ndeferred: 2" },
      explain: L("The whole print runs at the end, when x is already 2.", "Todo el print corre al final, cuando x ya vale 2.", "print 全体が最後に動く。その時 x はもう 2。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        var x: u32 = 1;
        {
            defer x += 10;
            x = 2;
        }
        std.debug.print("{d}\n", .{x});
      `,
      options: ["12", "11", "2"],
      answer: 0,
      output: "12",
      check: { compiles: true, stdout: "12" },
      explain: L("x becomes 2, then at the } the deferred x += 10 makes it 12.", "x pasa a 2, y en la } el x += 10 diferido lo deja en 12.", "x が 2 になり、} で defer の x += 10 が動いて 12。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        fn f() u32 {
            var n: u32 = 1;
            defer n += 1;
            return n;
        }

        pub fn main() void {
            std.debug.print("{d}\n", .{f()});
        }
      `,
      options: ["1", "2", NO_CE],
      answer: 0,
      output: "1",
      check: { compiles: true, stdout: "1" },
      explain: L("return n computes the value 1 first; the defer changes n afterward, too late.", "return n calcula primero el valor 1; el defer cambia n después, muy tarde.", "return n が先に 1 を決める。defer で n を変えても手おくれ。"),
    },
    {
      kind: "order",
      prompt: L("Order it to print body, second, first", "Ordénalo para imprimir body, second, first", "body, second, first の順に表示"),
      lines: [z`defer std.debug.print("first\n", .{});`, z`defer std.debug.print("second\n", .{});`, z`std.debug.print("body\n", .{});`],
      check: { compiles: true, stdout: "body\nsecond\nfirst" },
      explain: L("Pin first, then second; the body prints; defers run in reverse.", "Clava first, luego second; el cuerpo imprime; los defer corren al revés.", "first、second の順に貼り、本体を表示。defer は逆順に動く。"),
    },
    say(L(
      "errdefer is a red scroll: it runs only if the function exits with an error. Perfect for undoing half-done work.",
      "errdefer es un pergamino rojo: corre solo si la función sale con error. Ideal para deshacer trabajo a medias.",
      "errdefer は赤い巻物。関数がエラーで抜ける時だけ動く。やりかけの作業を元にもどすのにぴったり。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        fn check(n: i32) !i32 {
            errdefer std.debug.print("cleanup\n", .{});
            if (n < 0) return error.Negative;
            return n;
        }

        pub fn main() void {
            std.debug.print("{d}\n", .{check(5) catch 0});
            std.debug.print("{d}\n", .{check(-1) catch 0});
        }
      `,
      options: [L("5, cleanup, 0", "5, cleanup, 0", "5 → cleanup → 0"), L("cleanup, 5, cleanup, 0", "cleanup, 5, cleanup, 0", "cleanup → 5 → cleanup → 0"), L("5, 0", "5, 0", "5 → 0")],
      answer: 0,
      output: "5\ncleanup\n0",
      check: { compiles: true, stdout: "5\ncleanup\n0" },
      explain: L("check(5) succeeds, so errdefer stays silent. check(-1) returns an error: cleanup runs, then catch gives 0.", "check(5) tiene éxito, así que errdefer calla. check(-1) devuelve error: corre cleanup y catch da 0.", "check(5) は成功で errdefer は動かない。check(-1) はエラーで cleanup、catch で 0。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        fn check(n: i32) !i32 {
            errdefer |err| std.debug.print("cleanup after {s}\n", .{@errorName(err)});
            if (n < 0) return error.Negative;
            return n;
        }

        pub fn main() void {
            _ = check(-1) catch 0;
        }
      `,
      options: ["cleanup after Negative", "cleanup after error", L("Nothing", "Nada", "何も表示しない")],
      answer: 0,
      output: "cleanup after Negative",
      check: { compiles: true, stdout: "cleanup after Negative" },
      explain: L("errdefer |err| can read the error that is leaving the function.", "errdefer |err| puede leer el error que sale de la función.", "errdefer |err| で関数から出ていくエラーを読める。"),
    },
    {
      kind: "pick",
      prompt: L("Undo only when it fails", "Deshaz solo cuando falla", "失敗した時だけ元にもどす"),
      code: z`
        fn work(fail: bool) !void {
            ___ std.debug.print("undo\n", .{});
            if (fail) return error.Bad;
            std.debug.print("done\n", .{});
        }

        pub fn main() void {
            work(false) catch {};
            work(true) catch {};
        }
      `,
      options: ["errdefer", "defer"],
      answer: 0,
      check: { compiles: true, stdout: "done\nundo" },
      explain: L("errdefer fires only on the failing call. defer would print undo after done too.", "errdefer solo se activa en la llamada que falla. defer imprimiría undo también tras done.", "errdefer は失敗した呼び出しだけで動く。defer だと done のあとにも undo が出る。"),
    },
    {
      kind: "run",
      prompt: L("Clean up only on failure: cleanups: 1", "Limpia solo al fallar: cleanups: 1", "失敗時だけ片づけて cleanups: 1"),
      starter: z`
        const std = @import("std");

        var cleanups: u32 = 0;

        fn build(fail: bool) !void {
            defer cleanups += 1;
            if (fail) return error.Collapsed;
            std.debug.print("tower built\n", .{});
        }

        pub fn main() void {
            build(false) catch {};
            build(true) catch |err| std.debug.print("failed: {s}\n", .{@errorName(err)});
            std.debug.print("cleanups: {d}\n", .{cleanups});
        }
      ` + "\n",
      solution: z`
        const std = @import("std");

        var cleanups: u32 = 0;

        fn build(fail: bool) !void {
            errdefer cleanups += 1;
            if (fail) return error.Collapsed;
            std.debug.print("tower built\n", .{});
        }

        pub fn main() void {
            build(false) catch {};
            build(true) catch |err| std.debug.print("failed: {s}\n", .{@errorName(err)});
            std.debug.print("cleanups: {d}\n", .{cleanups});
        }
      ` + "\n",
      expect: "cleanups: 1",
      fallback: [String.raw`errdefer\s+cleanups\s*\+=\s*1`, String.raw`errdefer\s+cleanups\s*=\s*cleanups\s*\+\s*1`],
      explain: L("defer runs on every exit, so both calls count. errdefer runs only when build fails.", "defer corre en toda salida, así que ambas llamadas cuentan. errdefer solo corre cuando build falla.", "defer はどの抜け方でも動くので2回。errdefer は build が失敗した時だけ。"),
    },
  ],
};

// ─── 2.4 The Undefined Imp ─────────────────────────────────────────────────
const undefinedAndSafety: LessonDef = {
  slug: "undefined-and-safety",
  title: L("The Undefined Imp", "El Diablillo Indefinido", "未定義の小鬼"),
  concept: "safety",
  mode: "lesson",
  xp: 75,
  enemy: "zig/undefined-imp",
  enemyName: L("UNDEFINED IMP", "DIABLILLO INDEF.", "未定義の小鬼"),
  beats: [
    say(L(
      "undefined means 'no value yet'. It's a promise: you will write before you read. Reading first lets the Undefined Imp in.",
      "undefined significa 'aún sin valor'. Es una promesa: escribirás antes de leer. Leer primero deja entrar al Diablillo Indefinido.",
      "undefined は「まだ値がない」。読む前に必ず書くという約束。先に読むと未定義の小鬼が入りこむ。",
    )),
    {
      kind: "act",
      prompt: L("Write the chip before you read it", "Escribe la ficha antes de leerla", "読む前にチップに書きこもう"),
      steps: [
        { label: L("RESERVE x", "RESERVAR x", "x を用意"), line: "var x: i32 = undefined;", effects: [{ t: "tag", actor: "hero", text: "x", value: "???" }, { t: "enter", actor: "enemy" }, { t: "say", actor: "enemy", text: L("Hee hee! Garbage!", "¡Ji ji! ¡Basura!", "ヒヒ！ゴミだ！") }] },
        { label: L("WRITE 3", "ESCRIBIR 3", "3 を書く"), line: "x = 3;", effects: [{ t: "value", actor: "hero", text: "3" }, { t: "exit", actor: "enemy" }] },
        { label: L("READ x", "LEER x", "x を読む"), line: z`std.debug.print("{d}\n", .{x});`, effects: [{ t: "print", text: "3" }], output: "3" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`
        var x: i32 = undefined;
        x = 3;
        std.debug.print("{d}\n", .{x});
      `,
      options: ["3", "0", "undefined"],
      answer: 0,
      output: "3",
      check: { compiles: true, stdout: "3" },
      explain: L("x is written before it is read, so the promise is kept: it prints 3.", "x se escribe antes de leerse, así que la promesa se cumple: imprime 3.", "読む前に x に書いているので約束は守られる。3 と表示。"),
    },
    {
      kind: "type",
      prompt: L("No value yet: fill it later", "Aún sin valor: se llena luego", "まだ値なし：あとで入れる"),
      code: z`
        var x: i32 = ___;
        x = 7;
        std.debug.print("{d}\n", .{x});
      `,
      answer: "undefined",
      check: { compiles: true, stdout: "7" },
      explain: L("undefined reserves the slot without a value; x = 7 fills it before the read.", "undefined reserva el hueco sin valor; x = 7 lo llena antes de leer.", "undefined は値なしで場所だけ取る。読む前に x = 7 で入れる。"),
    },
    {
      kind: "predict",
      prompt: L("Gems add up into total. What's wrong?", "Las gemas se suman en total. ¿Qué falla?", "total に宝石をたす。何がおかしい？"),
      code: z`
        var total: u32 = undefined;
        for ([_]u32{ 1, 2, 3 }) |g| total += g;
        std.debug.print("{d}\n", .{total});
      `,
      options: [L("total is read before any write", "total se lee antes de escribirse", "書く前に total を読んでいる"), L("Nothing: it prints 6", "Nada: imprime 6", "問題なし：6 と表示"), L("u32 is too small", "u32 es muy chico", "u32 が小さすぎる")],
      answer: 0,
      explain: L("total += g reads total first, and it holds garbage. Start with var total: u32 = 0;", "total += g lee total primero, y tiene basura. Empieza con var total: u32 = 0;", "total += g は先に total を読むがゴミが入っている。var total: u32 = 0; で始めよう。"),
      win: [{ t: "enter", actor: "enemy" }, { t: "attack", from: "enemy", to: "hero" }],
    },
    say(L(
      "unreachable says 'this can never happen'. In Debug, if it does happen, the alarm rings: panic.",
      "unreachable dice 'esto nunca puede pasar'. En Debug, si pasa, suena la alarma: panic.",
      "unreachable は「ここには絶対来ない」。Debug で来てしまったらアラーム：panic。",
    )),
    {
      kind: "predict",
      prompt: HAPPENS,
      code: z`
        var x: u8 = 3;
        _ = &x;
        switch (x) {
            1 => {},
            else => unreachable,
        }
      `,
      options: [L("It panics: unreachable code", "Hace panic: unreachable code", "panic：unreachable code"), L("Nothing happens", "No pasa nada", "何も起きない"), NO_CE],
      answer: 0,
      check: { compiles: true, throws: "reached unreachable code" },
      explain: L("x is 3, so the else branch runs and its promise breaks: reached unreachable code.", "x es 3, así que corre la rama else y su promesa se rompe: reached unreachable code.", "x は 3 なので else に来て約束がやぶれる：reached unreachable code。"),
      win: [{ t: "shake" }],
    },
    say(L(
      "Debug mode has many alarm bells: overflow, bounds, null, unreachable, division by zero. Each one stops a silent bug.",
      "El modo Debug tiene muchas alarmas: desborde, límites, null, unreachable, división por cero. Cada una frena un bug silencioso.",
      "Debug にはアラームがたくさん：オーバーフロー、範囲外、null、unreachable、ゼロ除算。",
    )),
    {
      kind: "predict",
      prompt: HAPPENS,
      code: z`
        var a: u32 = 7;
        var b: u32 = 0;
        _ = &a;
        _ = &b;
        std.debug.print("{d}\n", .{a / b});
      `,
      options: [L("It panics: division by zero", "Hace panic: división por cero", "panic：ゼロ除算"), "0", "7"],
      answer: 0,
      check: { compiles: true, throws: "division by zero" },
      explain: L("b is 0 at runtime, so the division alarm rings: division by zero.", "b vale 0 al ejecutar, así que suena la alarma: division by zero.", "実行時に b が 0 なので division by zero のアラーム。"),
      win: [{ t: "shake" }, { t: "banner", text: L("division by zero", "división por cero", "ゼロ除算！") }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: z`
        const x: u8 = 255;
        const y = x + 1;
        std.debug.print("{d}\n", .{y});
      `,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("Both values are known at compile time, so the overflow is caught early: overflow of integer type 'u8'.", "Ambos valores se conocen al compilar, así que el desborde se detecta antes: overflow of integer type 'u8'.", "値がコンパイル時にわかるので早めに見つかる：overflow of integer type 'u8'。"),
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: z`
        var n: u8 = 200;
        _ = &n;
        const doubled = n * 2;
        std.debug.print("{d}\n", .{doubled});
      `,
      options: [L("It panics: integer overflow", "Hace panic: integer overflow", "panic：integer overflow"), "400", "144"],
      answer: 0,
      check: { compiles: true, throws: "integer overflow" },
      explain: L("n is a runtime u8: 400 doesn't fit, so the overflow alarm rings.", "n es un u8 en ejecución: 400 no cabe, así que suena la alarma de desborde.", "n は実行時の u8。400 は入らずオーバーフローのアラーム。"),
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: z`std.debug.print("{d}\n", .{@as(u8, 255) *% 2});`,
      options: ["254", "510", "255"],
      answer: 0,
      output: "254",
      check: { compiles: true, stdout: "254" },
      explain: L("*% wraps on purpose: 510 - 256 = 254. No alarm, because you asked for it.", "*% da la vuelta a propósito: 510 - 256 = 254. Sin alarma, porque lo pediste.", "*% はわざと一周：510 - 256 = 254。自分で頼んだのでアラームなし。"),
    },
    say(L(
      "Build modes: Debug and ReleaseSafe keep the alarms. ReleaseFast and ReleaseSmall remove them: the same bug becomes silent.",
      "Modos de compilación: Debug y ReleaseSafe mantienen las alarmas. ReleaseFast y ReleaseSmall las quitan: el mismo bug pasa en silencio.",
      "ビルドモード：Debug と ReleaseSafe はアラームあり。ReleaseFast と ReleaseSmall はなしで、バグが静かになる。",
    )),
    {
      kind: "predict",
      prompt: L("Where do the safety alarms stay on?", "¿Dónde siguen activas las alarmas?", "安全アラームが残るのはどこ？"),
      code: "zig build-exe main.zig -O ReleaseSafe",
      options: [L("Debug and ReleaseSafe", "Debug y ReleaseSafe", "Debug と ReleaseSafe"), L("Only Debug", "Solo Debug", "Debug だけ"), L("All four modes", "Los cuatro modos", "4つ全部")],
      answer: 0,
      explain: L("ReleaseSafe is optimized but keeps the checks. ReleaseFast/Small drop them for speed or size.", "ReleaseSafe está optimizado pero conserva los chequeos. ReleaseFast/Small los quitan por velocidad o tamaño.", "ReleaseSafe は最適化しつつ検査を残す。ReleaseFast/Small は速さやサイズのため外す。"),
    },
    {
      kind: "run",
      prompt: L("Chase the imp away: it must print total: 6", "Ahuyenta al diablillo: debe imprimir total: 6", "小鬼を追いはらって total: 6 と表示"),
      starter: z`
        const std = @import("std");

        pub fn main() void {
            const gems = [_]u32{ 1, 2, 3 };
            var total: u32 = undefined;
            for (gems) |g| total += g;
            std.debug.print("total: {d}\n", .{total});
        }
      ` + "\n",
      solution: z`
        const std = @import("std");

        pub fn main() void {
            const gems = [_]u32{ 1, 2, 3 };
            var total: u32 = 0;
            for (gems) |g| total += g;
            std.debug.print("total: {d}\n", .{total});
        }
      ` + "\n",
      expect: "total: 6",
      fallback: [String.raw`var\s+total\s*:\s*u32\s*=\s*0\s*;`],
      explain: L("total starts as garbage, so the sum is garbage too. Start it at 0.", "total empieza con basura, así que la suma también. Empiézalo en 0.", "total がゴミから始まるので合計もゴミ。0 から始めよう。"),
    },
  ],
};

// ─── BOSS · The Undefined Imp ──────────────────────────────────────────────
const boss: LessonDef = {
  slug: "forest-boss",
  title: L("The Imp of the Forest", "El Diablillo del Bosque", "森の小鬼"),
  concept: "errors",
  mode: "boss",
  xp: 170,
  enemy: "zig/undefined-imp",
  enemyName: L("UNDEFINED IMP", "DIABLILLO INDEF.", "未定義の小鬼"),
  beats: [
    enemySays(L(
      "Hee hee! I hide in empty bottles and unread scrolls. Miss one null, drop one error, and the forest is mine!",
      "¡Ji ji! Me escondo en botellas vacías y pergaminos sin leer. ¡Olvida un null o tira un error, y el bosque es mío!",
      "ヒヒ！からのビンと読まれない巻物にかくれてる。null をひとつ見のがせば森はいただきだ！",
    )),
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: z`
        const a: ?u8 = null;
        const b: ?u8 = 4;
        std.debug.print("{d}\n", .{(a orelse 1) + (b orelse 1)});
      `,
      options: ["5", "4", "2"],
      answer: 0, output: "5",
      check: { compiles: true, stdout: "5" },
      explain: L("a is empty, so it becomes 1; b holds 4. 1 + 4 = 5.", "a está vacía, así que vale 1; b guarda 4. 1 + 4 = 5.", "a はからなので 1、b は 4。1 + 4 = 5。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: z`
        fn parse(s: []const u8) !i32 {
            return std.fmt.parseInt(i32, s, 10);
        }

        pub fn main() void {
            const r = parse("7") catch |err| switch (err) {
                error.InvalidCharacter => -1,
                else => -2,
            };
            std.debug.print("{d}\n", .{r});
        }
      `,
      options: ["7", "-1", "-2"],
      answer: 0, output: "7",
      check: { compiles: true, stdout: "7" },
      explain: L("\"7\" parses fine, so catch never runs: r is 7.", "\"7\" se lee bien, así que catch nunca corre: r es 7.", "\"7\" は正しく変換され catch は動かない。r は 7。"),
    },
    {
      kind: "predict", time: 12, prompt: HAPPENS,
      code: z`
        var bottle: ?u8 = null;
        _ = &bottle;
        std.debug.print("open\n", .{});
        std.debug.print("{d}\n", .{bottle.?});
      `,
      options: [PANIC_NULL, L("Prints open, then 0", "Imprime open y luego 0", "open のあと 0"), NO_CE],
      answer: 0,
      check: { compiles: true, throws: "attempt to use null value" },
      explain: L(".? on an empty bottle: attempt to use null value.", ".? sobre una botella vacía: attempt to use null value.", "からのビンに .?：attempt to use null value。"),
      win: [{ t: "attack", from: "enemy", to: "hero" }, { t: "shake" }],
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: HALF + "\n\n" + z`
        fn quarter(n: u32) !u32 {
            const h = try half(n);
            return try half(h);
        }
      ` + "\n\n" + main(z`std.debug.print("{any} {any}\n", .{ quarter(8), quarter(6) });`),
      options: ["2 error.Odd", "2 1", "error.Odd error.Odd"],
      answer: 0, output: "2 error.Odd",
      check: { compiles: true, stdout: "2 error.Odd" },
      explain: L("8 → 4 → 2. 6 → 3, and half(3) fails: try passes error.Odd up.", "8 → 4 → 2. 6 → 3, y half(3) falla: try pasa error.Odd hacia arriba.", "8 → 4 → 2。6 → 3 で half(3) が失敗し、try が error.Odd を上へ返す。"),
    },
    {
      kind: "predict", time: 12, prompt: COMPILES,
      code: HALF + "\n\n" + main(z`
        half(6);
        std.debug.print("done\n", .{});
      `),
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("The returned error union is dropped: error union is ignored.", "La unión de error devuelta se tira: error union is ignored.", "返されたエラー共用体をすてている：error union is ignored。"),
    },
    {
      kind: "pick", time: 12,
      prompt: L("Default for an empty bottle", "Valor por defecto si está vacía", "からのビンの代わりの値"),
      code: z`
        const maybe: ?u32 = null;
        const n: u32 = maybe ___ 0;
        std.debug.print("{d}\n", .{n});
      `,
      options: ["orelse", "catch"],
      answer: 0,
      check: { compiles: true, stdout: "0", wrongFail: true },
      explain: L("Optionals use orelse. catch is only for error unions.", "Los opcionales usan orelse. catch es solo para uniones de error.", "オプショナルには orelse。catch はエラー共用体用。"),
    },
    {
      kind: "pick", time: 12,
      prompt: L("Default for a failed parse", "Valor por defecto si falla la lectura", "変換失敗の代わりの値"),
      code: z`
        const n = std.fmt.parseInt(u8, "x", 10) ___ 0;
        std.debug.print("{d}\n", .{n});
      `,
      options: ["catch", "orelse"],
      answer: 0,
      check: { compiles: true, stdout: "0", wrongFail: true },
      explain: L("parseInt returns an error union, so catch replaces the error. orelse is for optionals.", "parseInt devuelve una unión de error, así que catch reemplaza el error. orelse es para opcionales.", "parseInt はエラー共用体なので catch。orelse はオプショナル用。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: z`
        fn step(fail: bool) !void {
            defer std.debug.print("defer\n", .{});
            errdefer std.debug.print("errdefer\n", .{});
            if (fail) return error.Boom;
        }

        pub fn main() void {
            step(true) catch {};
        }
      `,
      options: [L("errdefer, then defer", "errdefer, luego defer", "errdefer → defer"), L("defer, then errdefer", "defer, luego errdefer", "defer → errdefer"), L("Only defer", "Solo defer", "defer だけ")],
      answer: 0, output: "errdefer\ndefer",
      check: { compiles: true, stdout: "errdefer\ndefer" },
      explain: L("It fails, so both run, in reverse order: errdefer was pinned last, so it runs first.", "Falla, así que ambos corren al revés: errdefer se clavó último, así que corre primero.", "失敗なので両方動く。逆順だから最後に貼った errdefer が先。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: z`
        var gold: u32 = 5;
        defer std.debug.print("end: {d}\n", .{gold});
        gold *= 2;
        std.debug.print("mid: {d}\n", .{gold});
      `,
      options: [L("mid: 10, then end: 10", "mid: 10, luego end: 10", "mid: 10 のあと end: 10"), L("mid: 10, then end: 5", "mid: 10, luego end: 5", "mid: 10 のあと end: 5")],
      answer: 0, output: "mid: 10\nend: 10",
      check: { compiles: true, stdout: "mid: 10\nend: 10" },
      explain: L("The deferred print runs whole at the end, when gold is already 10.", "El print diferido corre entero al final, cuando gold ya vale 10.", "defer の print は最後にまるごと動く。その時 gold は 10。"),
    },
    {
      kind: "predict", time: 15, prompt: HAPPENS,
      code: z`
        var hits: u32 = 9;
        var misses: u32 = 0;
        _ = &hits;
        _ = &misses;
        std.debug.print("ratio\n", .{});
        std.debug.print("{d}\n", .{hits / misses});
      `,
      options: [L("Prints ratio, then panics", "Imprime ratio y luego panic", "ratio と表示して panic"), L("Prints ratio, then 0", "Imprime ratio y luego 0", "ratio のあと 0"), NO_CE],
      answer: 0,
      check: { compiles: true, throws: "division by zero" },
      explain: L("misses is 0 at runtime: the division alarm rings after ratio is printed.", "misses vale 0 al ejecutar: suena la alarma de división tras imprimir ratio.", "実行時に misses が 0。ratio のあとゼロ除算のアラーム。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "type", time: 15,
      prompt: L("Undo only on error", "Deshaz solo si hay error", "エラーの時だけ元にもどせ"),
      code: z`
        fn craft(ok: bool) !void {
            ___ std.debug.print("refund\n", .{});
            if (!ok) return error.Broken;
        }

        pub fn main() void {
            craft(true) catch {};
            craft(false) catch {};
        }
      `,
      answer: "errdefer",
      check: { compiles: true, stdout: "refund" },
      explain: L("errdefer runs only for the failing call, so refund prints once.", "errdefer solo corre en la llamada que falla, así que refund se imprime una vez.", "errdefer は失敗した呼び出しだけ。refund は1回だけ表示。"),
    },
    enemySays(L(
      "Eek! Every bottle checked, every scroll read... Fine! Up on Struct Mountain, my cousins guard the memory itself!",
      "¡Iiih! Cada botella revisada, cada pergamino leído... ¡Bien! ¡En la Montaña Struct mis primos vigilan la memoria misma!",
      "ひぃ！ビンも巻物も全部見ぬかれた…ストラクト山ではいとこたちがメモリそのものを守ってるぞ！",
    )),
  ],
};

export const optionalForest: RegionDef = {
  slug: "optional-forest",
  name: L("Optional Forest", "Bosque Opcional", "オプショナルの森"),
  subtitle: L("optionals · errors · defer · safety", "opcionales · errores · defer · seguridad", "オプショナル・エラー・defer・安全"),
  theme: "forest",
  lessons: [optionals, errorUnions, deferAndErrdefer, undefinedAndSafety, boss],
};
