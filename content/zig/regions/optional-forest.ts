import type { Beat, LessonDef, NoteBlock, NoteDef, RegionDef, Text } from "../../../lib/content/types.ts";
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

// Guidebook notes: long explanations players can reopen from any question (📖).
// Examples use names and values different from the questions so they never give an answer away.
const note = (id: string, title: Text, ...blocks: NoteBlock[]): NoteDef => ({ id, title, blocks });
const p = (en: string, es: string, ja: string): NoteBlock => ({ t: "p", text: L(en, es, ja) });
/** A runnable example; the validator checks `output` against the real compiler. */
const ex = (code: string, output: string, caption?: Text): NoteBlock => ({ t: "code", code, output, caption });
/** An example that must NOT compile (verified too). */
const bad = (code: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { compiles: false } });
/** An example that compiles and then panics with `message` (verified too). */
const boom = (code: string, message: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { compiles: true, throws: message } });
/** Code shown as-is, not run (its output is unpredictable or it is not Zig source). */
const show = (code: string, caption: Text): NoteBlock => ({ t: "code", code, caption });

const optionalsNotes: NoteDef[] = [
  note("optional-type", L("Optionals: ?T and null", "Opcionales: ?T y null", "オプショナル：?T と null"),
    p(
      "Sometimes a value may be missing: a search that finds nothing, a slot not filled yet. Zig marks that with a ? in front of the type. ?u8 means \"a u8, or nothing\". The \"nothing\" is written null. Think of a bottle that is either full (holds a u8) or empty.",
      "A veces un valor puede faltar: una búsqueda que no encuentra nada, un hueco aún sin llenar. Zig lo marca con un ? delante del tipo. ?u8 significa \"un u8, o nada\". La \"nada\" se escribe null. Piensa en una botella que está llena (guarda un u8) o vacía.",
      "値がないこともある。何も見つからない検索や、まだ埋まっていない場所など。Zigは型の前に ? をつけて表す。?u8 は「u8 か、何もない」。「何もない」は null と書く。中身があるか、からのビンだと思おう。",
    ),
    ex(z`
      var seat: ?u8 = null;
      std.debug.print("{any}\n", .{seat});
      seat = 12;
      std.debug.print("{any} {}\n", .{ seat, seat == null });
    `, "null\n12 false", L("Empty prints null; filled prints its value", "Vacía imprime null; llena imprime su valor", "からは null、満たすと値を表示")),
    p(
      "Only optional types can be null. A plain u8, i32 or []const u8 always holds a real value, so assigning null to one is a compile error: expected type 'u8', found '@TypeOf(null)'. Pointers follow the same rule: *u8 always points somewhere; a pointer that may be missing is ?*u8.",
      "Solo los tipos opcionales pueden ser null. Un u8, i32 o []const u8 normal siempre guarda un valor real, así que asignarle null es error de compilación: expected type 'u8', found '@TypeOf(null)'. Los punteros siguen la misma regla: *u8 siempre apunta a algo; un puntero que puede faltar es ?*u8.",
      "null になれるのはオプショナル型だけ。ふつうの u8、i32、[]const u8 は必ず本物の値を持つので、null を入れるとコンパイルエラー（expected type 'u8', found '@TypeOf(null)'）。ポインタも同じで、*u8 は必ずどこかを指す。ないかもしれないポインタは ?*u8。",
    ),
    bad(z`
      const lives: u8 = null;
      _ = lives;
    `, L("Does not compile: u8 is not optional", "No compila: u8 no es opcional", "コンパイル不可：u8 はオプショナルではない")),
    p(
      "Why bother? In many languages any value might secretly be null, and forgetting to check crashes the program later. In Zig the ? is part of the type, so the compiler knows exactly which values may be missing and makes you handle them before use.",
      "¿Para qué? En muchos lenguajes cualquier valor puede ser null en secreto, y olvidar revisarlo hace fallar el programa más tarde. En Zig el ? es parte del tipo, así que el compilador sabe justo qué valores pueden faltar y te obliga a manejarlos antes de usarlos.",
      "なぜこうするのか？多くの言語ではどの値もこっそり null かもしれず、確認を忘れるとあとで落ちる。Zigでは ? が型の一部なので、ないかもしれない値をコンパイラが正確に知り、使う前にあつかわせるのじゃ。",
    ),
  ),
  note("orelse-unwrap", L("Opening a bottle: orelse and .?", "Abrir una botella: orelse y .?", "ビンを開ける：orelse と .?"),
    p(
      "An optional is a closed bottle: you can't do math or print it with {d} until you take the value out. Adding to a ?u32 directly is a compile error. There are a few ways to open it, and each one says what happens when it is empty.",
      "Un opcional es una botella cerrada: no puedes calcular con él ni imprimirlo con {d} hasta sacar el valor. Sumar a un ?u32 directamente es error de compilación. Hay varias formas de abrirla, y cada una dice qué pasa si está vacía.",
      "オプショナルは閉じたビン。中身を取り出すまで計算も {d} での表示もできない。?u32 に直接たすとコンパイルエラー。開け方はいくつかあり、それぞれ「からのときどうするか」を決めている。",
    ),
    bad(z`
      const bonus: ?u32 = 3;
      const total: u32 = bonus + 10;
      _ = total;
    `, L("Does not compile: bonus is still closed", "No compila: bonus sigue cerrada", "コンパイル不可：bonus はまだ閉じている")),
    p(
      "opt orelse spare gives the value inside when the bottle is full, or the spare value on the right when it is empty. The result is a plain value (not optional), ready to use. It works for any type: numbers, text, anything.",
      "opt orelse repuesto da el valor de adentro si la botella está llena, o el repuesto de la derecha si está vacía. El resultado es un valor normal (no opcional), listo para usar. Sirve para cualquier tipo: números, texto, lo que sea.",
      "opt orelse 予備 は、ビンに中身があればそれを、からなら右の予備の値を返す。結果はふつうの値（オプショナルではない）で、すぐ使える。数でも文字列でも、どんな型でも使える。",
    ),
    ex(z`
      const saved: ?u32 = null;
      const found: ?u32 = 8;
      const nick: ?[]const u8 = "Rho";
      std.debug.print("{d} {d} {s}\n", .{ saved orelse 1, found orelse 1, nick orelse "anon" });
    `, "1 8 Rho", L("Empty uses the spare; full uses its contents", "Vacía usa el repuesto; llena usa su contenido", "からは予備、中身ありはその中身")),
    p(
      "opt.? means \"I am sure it's full, give me the value\". When you are right, it's the shortest way. When you are wrong, Debug builds stop the program with panic: attempt to use null value. Lines before it have already run.",
      "opt.? significa \"seguro que está llena, dame el valor\". Si aciertas, es la forma más corta. Si te equivocas, Debug detiene el programa con panic: attempt to use null value. Las líneas anteriores ya se ejecutaron.",
      "opt.? は「絶対入っているから値をくれ」という意味。当たっていれば一番短い。外れると、Debugビルドは panic: attempt to use null value で止まる。それより前の行はもう実行されている。",
    ),
    ex(z`
      const ready: ?u32 = 9;
      std.debug.print("{d}\n", .{ready.? + 1});
    `, "10", L(".? on a full bottle gives the value", ".? en una botella llena da el valor", "中身ありの .? は値を返す")),
    boom(z`
      var cup: ?u32 = null;
      _ = &cup;
      std.debug.print("{d}\n", .{cup.?});
    `, "attempt to use null value", L("Panics: the bottle is empty", "Hace panic: la botella está vacía", "panic：ビンがから")),
    p(
      "Rule to remember: use orelse when there is a sensible default, and .? only when null is truly impossible. If null is possible and you need to react, use if with a capture (next note).",
      "Regla para recordar: usa orelse cuando hay un valor por defecto sensato, y .? solo cuando null es de verdad imposible. Si null es posible y necesitas reaccionar, usa if con captura (siguiente nota).",
      "覚えるルール：まともな代わりの値があるなら orelse、null が本当にありえない時だけ .?。null がありえて対応が必要なら、キャプチャつきの if を使う（次のノート）。",
    ),
  ),
  note("if-capture", L("if and while with |captures|", "if y while con |capturas|", "if・while と |キャプチャ|"),
    p(
      "if (opt) |v| { ... } else { ... } is the safe way to open a bottle. When it is full, the first block runs and v holds the value inside, as a plain (non-optional) value. When it is empty, the else block runs. No panic is possible.",
      "if (opt) |v| { ... } else { ... } es la forma segura de abrir una botella. Si está llena, corre el primer bloque y v guarda el valor de adentro, como valor normal (no opcional). Si está vacía, corre el bloque else. No puede haber panic.",
      "if (opt) |v| { ... } else { ... } はビンを安全に開ける方法。中身があれば最初のブロックが動き、v に中身（ふつうの値）が入る。からなら else が動く。panic は起こりえない。",
    ),
    ex(z`
      const coin: ?u32 = null;
      if (coin) |c| {
          std.debug.print("coin {d}\n", .{c});
      } else {
          std.debug.print("no coin\n", .{});
      }
    `, "no coin", L("Empty, so the else block runs", "Vacía, así que corre el bloque else", "からなので else が動く")),
    p(
      "The capture form only works on optionals (and error unions). A plain value has nothing to open: if (number) |v| is the error expected optional type, found 'u32'. A plain bool goes in an if without bars.",
      "La forma con captura solo sirve para opcionales (y uniones de error). Un valor normal no tiene nada que abrir: if (number) |v| es el error expected optional type, found 'u32'. Un bool normal va en un if sin barras.",
      "キャプチャの形はオプショナル（とエラー共用体）専用。ふつうの値には開けるものがないので、if (number) |v| は expected optional type, found 'u32' エラー。ふつうの bool は縦線なしの if に書く。",
    ),
    p(
      "Functions return ?T when a result may not exist, like a search: return the value when found, return null at the end otherwise. The caller then must decide what to do with an empty result.",
      "Las funciones devuelven ?T cuando un resultado puede no existir, como una búsqueda: devuelven el valor si lo encuentran, y null al final si no. Quien llama debe decidir qué hacer con un resultado vacío.",
      "結果がないかもしれない関数（検索など）は ?T を返す。見つかれば値を、最後まで見つからなければ null を返す。呼んだ側は、からの結果をどうするか決めなければならない。",
    ),
    ex(z`
      fn firstEven(xs: []const u32) ?u32 {
          for (xs) |x| {
              if (x % 2 == 0) return x;
          }
          return null;
      }

      pub fn main() void {
          const odds = [_]u32{ 1, 3 };
          const mixed = [_]u32{ 5, 6, 8 };
          std.debug.print("{any} {any}\n", .{ firstEven(&odds), firstEven(&mixed) });
      }
    `, "null 6", L("A search that may find nothing returns ?u32", "Una búsqueda que puede no hallar nada devuelve ?u32", "見つからないかもしれない検索は ?u32")),
    p(
      "while (opt) |v| repeats as long as the expression gives a value, and stops at the first null. Iterators work this way: each call to next() returns the next item, then null when nothing is left.",
      "while (opt) |v| repite mientras la expresión dé un valor, y se detiene en el primer null. Los iteradores funcionan así: cada llamada a next() devuelve el siguiente elemento, y null cuando no queda nada.",
      "while (opt) |v| は式が値を返す間くり返し、最初の null で止まる。イテレータはこの仕組み。next() を呼ぶたびに次の要素を返し、何も残っていなければ null を返す。",
    ),
    ex(z`
      var it = std.mem.splitScalar(u8, "x-y", '-');
      var count: u32 = 0;
      while (it.next()) |part| {
          count += 1;
          std.debug.print("{s} ", .{part});
      }
      std.debug.print("{d}\n", .{count});
    `, "x y 2", L("The loop ends when next() returns null", "El bucle termina cuando next() devuelve null", "next() が null を返すとループ終了")),
  ),
];

const errorUnionsNotes: NoteDef[] = [
  note("error-unions", L("Error unions: E!T", "Uniones de error: E!T", "エラー共用体：E!T"),
    p(
      "Zig has no exceptions. A function that can fail says so in its return type: E!T means \"either an error from the set E, or a value of type T\". An error set lists named errors, like error{ Full, Torn }, and a function returns one with return error.Full;",
      "Zig no tiene excepciones. Una función que puede fallar lo dice en su tipo de retorno: E!T significa \"o un error del conjunto E, o un valor de tipo T\". Un conjunto de errores lista errores con nombre, como error{ Full, Torn }, y una función devuelve uno con return error.Full;",
      "Zigに例外はない。失敗しうる関数は戻り値の型でそう言う。E!T は「エラー集合 E のどれか、または T 型の値」。エラー集合は error{ Full, Torn } のように名前つきのエラーを並べ、関数は return error.Full; で返す。",
    ),
    ex(z`
      const BagError = error{ Full, Torn };

      fn pack(items: u32) BagError!u32 {
          if (items > 5) return error.Full;
          return 5 - items;
      }

      pub fn main() void {
          std.debug.print("{any} {any}\n", .{ pack(2), pack(9) });
      }
    `, "3 error.Full", L("One success, one error; {any} shows both", "Un éxito y un error; {any} muestra ambos", "成功とエラー。{any} で両方表示")),
    p(
      "Writing !T without a set lets Zig work out the set from the function body. Library functions do this too: std.fmt.parseInt returns an error union that can be error.Overflow (the number doesn't fit the type) or error.InvalidCharacter (the text isn't a number).",
      "Escribir !T sin conjunto deja que Zig deduzca el conjunto del cuerpo de la función. Las funciones de la biblioteca también: std.fmt.parseInt devuelve una unión de error que puede ser error.Overflow (el número no cabe en el tipo) o error.InvalidCharacter (el texto no es un número).",
      "集合なしで !T と書くと、Zigが関数の中身から集合を決める。ライブラリも同じ。std.fmt.parseInt のエラーは error.Overflow（数が型に入らない）か error.InvalidCharacter（数でない文字列）。",
    ),
    ex(z`std.debug.print("{any} {any}\n", .{ std.fmt.parseInt(u8, "77", 10), std.fmt.parseInt(u8, "7a", 10) });`, "77 error.InvalidCharacter",
      L("\"7a\" contains a letter", "\"7a\" contiene una letra", "\"7a\" には文字がまじっている")),
    p(
      "An error union is not its value: you can't put it where a plain T is expected (cannot convert error union to payload type). And you can't ignore it: calling a fallible function and dropping the result is the error error union is ignored. You must handle it with catch, try or if.",
      "Una unión de error no es su valor: no puedes ponerla donde se espera un T normal (cannot convert error union to payload type). Y no puedes ignorarla: llamar a una función que puede fallar y tirar el resultado es el error error union is ignored. Debes manejarla con catch, try o if.",
      "エラー共用体は中身の値そのものではない。ふつうの T が必要な場所には置けない（cannot convert error union to payload type）。無視もできない。失敗しうる関数を呼んで結果を捨てると error union is ignored。catch・try・if であつかう必要がある。",
    ),
    bad(z`
      const n: u8 = std.fmt.parseInt(u8, "12", 10);
      _ = n;
    `, L("Does not compile: the result may be an error", "No compila: el resultado puede ser un error", "コンパイル不可：結果がエラーかもしれない")),
  ),
  note("catch", L("Handling errors with catch", "Manejar errores con catch", "catch でエラーをあつかう"),
    p(
      "x catch fallback unwraps x when it succeeded, or uses the fallback value when it failed. It's like orelse, but for error unions. The result is a plain value. catch never runs on success.",
      "x catch repuesto abre x cuando tuvo éxito, o usa el valor de repuesto cuando falló. Es como orelse, pero para uniones de error. El resultado es un valor normal. catch nunca corre si hubo éxito.",
      "x catch 代わり は、成功なら x の中身を、失敗なら代わりの値を使う。orelse のエラー共用体版じゃ。結果はふつうの値。成功したときは catch は動かない。",
    ),
    ex(z`
      const a = std.fmt.parseInt(u8, "12", 10) catch 0;
      const b = std.fmt.parseInt(u8, "zz", 10) catch 0;
      std.debug.print("{d} {d}\n", .{ a, b });
    `, "12 0", L("Only the failed parse uses the fallback", "Solo la lectura fallida usa el repuesto", "失敗した変換だけが代わりの値")),
    p(
      "To react to the error itself, capture it: catch |err| ... or if (x) |v| { ... } else |err| { ... }. @errorName(err) gives the error's name as text, ready for {s}. A switch (err) must cover every error the set can contain, and only those: naming an error that isn't in the set is a compile error.",
      "Para reaccionar al error mismo, captúralo: catch |err| ... o if (x) |v| { ... } else |err| { ... }. @errorName(err) da el nombre del error como texto, listo para {s}. Un switch (err) debe cubrir cada error que el conjunto puede contener, y solo esos: nombrar un error que no está en el conjunto es error de compilación.",
      "エラー自体に対応するならキャプチャする：catch |err| … か if (x) |v| { … } else |err| { … }。@errorName(err) はエラー名を文字列で返すので {s} で表示できる。switch (err) は集合の全エラーをカバーし、集合にないエラーを書くとコンパイルエラーになる。",
    ),
    ex(z`
      if (std.fmt.parseInt(u8, "999", 10)) |v| {
          std.debug.print("value {d}\n", .{v});
      } else |err| {
          std.debug.print("failed: {s}\n", .{@errorName(err)});
      }
    `, "failed: Overflow", L("999 doesn't fit a u8, so the else branch gets the error", "999 no cabe en u8, así que la rama else recibe el error", "999 は u8 に入らず else がエラーを受けとる")),
    ex(z`
      const DoorError = error{ Locked, Jammed };

      fn openDoor(n: u8) DoorError!u8 {
          if (n == 1) return error.Locked;
          if (n == 2) return error.Jammed;
          return n;
      }

      pub fn main() void {
          const code: u8 = openDoor(1) catch |err| switch (err) {
              error.Locked => 100,
              error.Jammed => 200,
          };
          std.debug.print("{d}\n", .{code});
      }
    `, "100", L("One arm per error in the set", "Un brazo por cada error del conjunto", "集合のエラーごとに腕を1つ")),
    p(
      "catch unreachable promises the call can never fail. If it does fail, Debug stops with panic: attempt to unwrap error. Common mistake: using it on input that might be bad, like text typed by a user. Handle that case instead.",
      "catch unreachable promete que la llamada nunca puede fallar. Si falla, Debug se detiene con panic: attempt to unwrap error. Error común: usarlo con entradas que pueden ser malas, como texto que escribe un usuario. Maneja ese caso en su lugar.",
      "catch unreachable は「絶対に失敗しない」という約束。失敗するとDebugは panic: attempt to unwrap error で止まる。よくあるミス：ユーザーが打った文字列のような、悪いかもしれない入力に使うこと。ちゃんとあつかおう。",
    ),
    boom(z`
      const n = std.fmt.parseInt(u8, "abc", 10) catch unreachable;
      std.debug.print("{d}\n", .{n});
    `, "attempt to unwrap error", L("Panics: the promise was broken", "Hace panic: se rompió la promesa", "panic：約束がやぶれた")),
  ),
  note("try", L("try: pass the error up", "try: pasar el error hacia arriba", "try：エラーを上へわたす"),
    p(
      "try x is short for x catch |err| return err; If x succeeded, try gives its value. If x failed, the current function stops right there and returns that same error to whoever called it. The error travels up until someone handles it.",
      "try x es la forma corta de x catch |err| return err; Si x tuvo éxito, try da su valor. Si x falló, la función actual se detiene ahí mismo y devuelve ese mismo error a quien la llamó. El error sube hasta que alguien lo maneja.",
      "try x は x catch |err| return err; の短い書き方。x が成功なら値を返す。失敗なら、今の関数はその場で止まり、同じエラーを呼び出し元に返す。エラーはだれかがあつかうまで上へ上がっていく。",
    ),
    ex(z`
      fn toLevel(s: []const u8) !u8 {
          const raw = try std.fmt.parseInt(u8, s, 10);
          return raw + 1;
      }

      pub fn main() void {
          std.debug.print("{any} {any}\n", .{ toLevel("4"), toLevel("x") });
      }
    `, "5 error.InvalidCharacter", L("Success continues; failure returns at the try", "El éxito sigue; el fallo regresa en el try", "成功なら続き、失敗なら try で戻る")),
    p(
      "Because try may return an error, it only works inside a function whose return type can hold one: !T or E!T. In a function that returns void or a plain u32, try is the compile error function cannot return an error. Either change the return type or handle the error with catch.",
      "Como try puede devolver un error, solo funciona dentro de una función cuyo tipo de retorno puede contenerlo: !T o E!T. En una función que devuelve void o un u32 normal, try es el error de compilación function cannot return an error. Cambia el tipo de retorno o maneja el error con catch.",
      "try はエラーを返すかもしれないので、戻り値の型がエラーを持てる関数（!T か E!T）の中でしか使えない。void やふつうの u32 を返す関数で try を使うと function cannot return an error。戻り値の型を変えるか、catch であつかおう。",
    ),
    bad(z`
      fn show(s: []const u8) void {
          const n = try std.fmt.parseInt(u8, s, 10);
          std.debug.print("{d}\n", .{n});
      }

      pub fn main() void {
          show("3");
      }
    `, L("Does not compile: show returns void", "No compila: show devuelve void", "コンパイル不可：show は void を返す")),
    p(
      "main may also return !void. Then try works directly in main, and an error that reaches the top ends the program and prints its name. The short snippets in these questions run inside such a main, so try works there.",
      "main también puede devolver !void. Entonces try funciona directamente en main, y un error que llega arriba termina el programa e imprime su nombre. Los fragmentos cortos de estas preguntas corren dentro de ese main, así que try funciona ahí.",
      "main も !void を返せる。そうすれば main で直接 try が使え、いちばん上まで来たエラーはプログラムを終わらせて名前を表示する。問題の短いコードはそういう main の中で動くので try が使える。",
    ),
    ex(z`
      const n = try std.fmt.parseInt(i32, "-8", 10);
      std.debug.print("{d}\n", .{n * 3});
    `, "-24", L("A valid number: try just unwraps it", "Un número válido: try solo lo abre", "正しい数なので try は取り出すだけ")),
  ),
];

const deferNotes: NoteDef[] = [
  note("defer-basics", L("defer: run it when the scope ends", "defer: correr al terminar el bloque", "defer：スコープの終わりに実行"),
    p(
      "defer statement; doesn't run the statement now. It pins it to the current scope, and it runs when that scope ends, however it ends: reaching the }, a return, or an error. It's for cleanup you must never forget, like closing a file right after opening it.",
      "defer instrucción; no ejecuta la instrucción ahora. La clava al bloque actual, y corre cuando ese bloque termina, como sea que termine: al llegar a la }, con un return o con un error. Es para limpiezas que nunca debes olvidar, como cerrar un archivo justo después de abrirlo.",
      "defer 文; はその文を今は実行しない。今のスコープに貼りつけ、スコープが終わるときに実行する。} に着いても、return でも、エラーでも。ファイルを開いた直後に閉じる処理を書くような、忘れてはいけない片づけ用じゃ。",
    ),
    p(
      "Several defers in one scope run in REVERSE order: the last one pinned runs first, like a stack of plates. That way things are undone in the opposite order they were set up.",
      "Varios defer en un bloque corren en orden INVERSO: el último clavado corre primero, como una pila de platos. Así las cosas se deshacen en el orden contrario al que se armaron.",
      "1つのスコープの複数の defer は逆順に動く。最後に貼ったものが最初、皿の山と同じ。こうして、用意した順番の反対の順で元にもどせる。",
    ),
    ex(z`
      defer std.debug.print("C\n", .{});
      defer std.debug.print("B\n", .{});
      std.debug.print("A\n", .{});
    `, "A\nB\nC", L("The body first, then defers from last to first", "Primero el cuerpo, luego los defer del último al primero", "まず本体、次に defer を最後から順に")),
    p(
      "\"Scope\" means the nearest pair of { }. A defer inside an inner block runs at that block's }, not at the end of the function. Each lap of a loop is its own scope too, so a defer inside a loop runs at the end of every lap.",
      "\"Bloque\" significa el par de { } más cercano. Un defer dentro de un bloque interno corre en la } de ese bloque, no al final de la función. Cada vuelta de un bucle también es su propio bloque, así que un defer dentro de un bucle corre al final de cada vuelta.",
      "「スコープ」は一番近い { } の組のこと。内側のブロックの defer は、関数の終わりではなくそのブロックの } で動く。ループの1周も1つのスコープなので、ループ内の defer は毎周の終わりに動く。",
    ),
    ex(z`
      std.debug.print("start\n", .{});
      {
          defer std.debug.print("door closed\n", .{});
          std.debug.print("in room\n", .{});
      }
      std.debug.print("hall\n", .{});
    `, "start\nin room\ndoor closed\nhall", L("The defer runs at its own block's }", "El defer corre en la } de su bloque", "defer は自分のブロックの } で動く")),
    ex(z`
      for (1..4) |r| {
          defer std.debug.print("-", .{});
          std.debug.print("{d}", .{r});
      }
      std.debug.print("\n", .{});
    `, "1-2-3-", L("One defer per lap, at the end of each lap", "Un defer por vuelta, al final de cada una", "毎周の終わりに defer が1回")),
  ),
  note("defer-timing", L("When a deferred line reads values", "Cuándo lee valores una línea diferida", "defer の行が値を読むとき"),
    p(
      "A deferred statement runs completely at the end of the scope. Nothing about it is computed early: it reads variables when it finally runs, so it sees their newest values. If a defer prints a variable that changed afterwards, it prints the new value.",
      "Una instrucción diferida corre completa al final del bloque. Nada de ella se calcula antes: lee las variables cuando por fin corre, así que ve sus valores más nuevos. Si un defer imprime una variable que cambió después, imprime el valor nuevo.",
      "defer の文はスコープの最後にまるごと実行される。先に計算される部分はない。実行されるときに変数を読むので、最新の値が見える。あとで変わった変数を defer で表示すると、新しい値が出る。",
    ),
    ex(z`
      var score: u32 = 10;
      defer std.debug.print("final {d}\n", .{score});
      score += 5;
      std.debug.print("now {d}\n", .{score});
    `, "now 15\nfinal 15", L("The deferred print sees the updated score", "El print diferido ve el score actualizado", "defer の print は更新後の score を見る")),
    p(
      "A defer can also change a variable. Inside a block, the change happens at that block's }, after every other line of the block, so code after the block sees the result.",
      "Un defer también puede cambiar una variable. Dentro de un bloque, el cambio ocurre en la } de ese bloque, después de todas sus otras líneas, así que el código tras el bloque ve el resultado.",
      "defer は変数を変えることもできる。ブロックの中なら、その変化はブロックのほかの全部の行のあと、} で起きる。だからブロックの後ろのコードは結果を見られる。",
    ),
    ex(z`
      var hp: u32 = 3;
      {
          defer hp *= 2;
          hp += 1;
      }
      std.debug.print("{d}\n", .{hp});
    `, "8", L("3 + 1 = 4 first, then the defer doubles it", "Primero 3 + 1 = 4, luego el defer lo duplica", "先に 3 + 1 = 4、次に defer で2倍")),
    p(
      "With return it's subtle: return value; computes the value FIRST, then the defers run, then the function leaves. A defer that changes a local variable after that can't change what was already returned.",
      "Con return es sutil: return valor; calcula el valor PRIMERO, luego corren los defer y luego la función sale. Un defer que cambia una variable local después no puede cambiar lo que ya se devolvió.",
      "return では注意が必要。return 値; はまず値を決め、それから defer が動き、関数を抜ける。そのあとで defer がローカル変数を変えても、もう返した値は変わらない。",
    ),
    ex(z`
      fn take() u32 {
          var stock: u32 = 7;
          defer stock -= 1;
          return stock;
      }

      pub fn main() void {
          std.debug.print("{d}\n", .{take()});
      }
    `, "7", L("The returned value was decided before the defer", "El valor devuelto se decidió antes del defer", "返す値は defer の前に決まっている")),
  ),
  note("errdefer", L("errdefer: clean up only on failure", "errdefer: limpiar solo al fallar", "errdefer：失敗時だけ片づけ"),
    p(
      "errdefer works like defer, but runs ONLY if the function exits by returning an error. On a successful return it does nothing. Use it to undo half-finished work: if step 3 fails, take back what steps 1 and 2 did, but keep them when everything works.",
      "errdefer funciona como defer, pero corre SOLO si la función sale devolviendo un error. En un retorno exitoso no hace nada. Úsalo para deshacer trabajo a medias: si el paso 3 falla, revierte lo que hicieron los pasos 1 y 2, pero consérvalo cuando todo funciona.",
      "errdefer は defer と同じだが、関数がエラーを返して抜けるときだけ動く。成功したときは何もしない。やりかけの作業を元にもどすのに使う。手順3が失敗したら手順1と2を取り消し、全部うまくいったら残す。",
    ),
    ex(z`
      fn load(ok: bool) !u32 {
          errdefer std.debug.print("rollback\n", .{});
          if (!ok) return error.Failed;
          return 1;
      }

      pub fn main() void {
          _ = load(true) catch 0;
          _ = load(false) catch 0;
          std.debug.print("end\n", .{});
      }
    `, "rollback\nend", L("Only the failing call prints rollback", "Solo la llamada que falla imprime rollback", "失敗した呼び出しだけ rollback")),
    p(
      "errdefer |err| statement; also captures the error that is leaving the function, so the cleanup can mention or log it. @errorName(err) turns it into text.",
      "errdefer |err| instrucción; además captura el error que sale de la función, para que la limpieza pueda mencionarlo o registrarlo. @errorName(err) lo convierte en texto.",
      "errdefer |err| 文; は関数から出ていくエラーも受けとるので、片づけの中でそのエラーを書き出せる。@errorName(err) で文字列になる。",
    ),
    ex(z`
      fn send(size: u32) !void {
          errdefer |e| std.debug.print("abort: {s}\n", .{@errorName(e)});
          if (size > 10) return error.TooBig;
      }

      pub fn main() void {
          send(50) catch {};
      }
    `, "abort: TooBig", L("The cleanup knows which error happened", "La limpieza sabe qué error ocurrió", "片づけはどのエラーか知っている")),
    p(
      "Rule to remember: defer = on every exit, errdefer = only on error exits. Common mistake: using defer for an undo step; then the undo also runs after a success and throws away good work.",
      "Regla para recordar: defer = en toda salida, errdefer = solo en salidas con error. Error común: usar defer para un paso de deshacer; entonces deshacer también corre tras un éxito y tira el buen trabajo.",
      "覚えるルール：defer はどの抜け方でも、errdefer はエラーで抜けるときだけ。よくあるミス：取り消し処理に defer を使うこと。成功のあとにも取り消しが動き、うまくいった作業を捨ててしまう。",
    ),
  ),
];

const undefinedAndSafetyNotes: NoteDef[] = [
  note("undefined", L("undefined: no value yet", "undefined: aún sin valor", "undefined：まだ値がない"),
    p(
      "Every variable needs a starting value. When you don't have one yet, write undefined: var slot: u32 = undefined; It reserves the space but leaves whatever bits were there. It is a promise to the compiler: I will write this variable before I read it.",
      "Toda variable necesita un valor inicial. Si aún no tienes uno, escribe undefined: var slot: u32 = undefined; Reserva el espacio pero deja los bits que hubiera ahí. Es una promesa al compilador: escribiré esta variable antes de leerla.",
      "変数には最初の値が必要。まだないなら undefined と書く：var slot: u32 = undefined; 場所だけ取り、中のビットはそのまま残る。「読む前に必ず書く」というコンパイラへの約束じゃ。",
    ),
    ex(z`
      var slot: u32 = undefined;
      slot = 40;
      std.debug.print("{d}\n", .{slot + 2});
    `, "42", L("Written before it is read: the promise holds", "Se escribe antes de leerse: la promesa se cumple", "読む前に書くので約束は守られる")),
    p(
      "Reading an undefined value before writing it is a bug: you get garbage, a different number on each run or machine. Watch out for operators that read first: x += 1 means x = x + 1, so it READS x. Starting a sum or a counter at undefined is a classic mistake.",
      "Leer un valor undefined antes de escribirlo es un bug: obtienes basura, un número distinto en cada ejecución o máquina. Cuidado con los operadores que leen primero: x += 1 significa x = x + 1, así que LEE x. Empezar una suma o un contador en undefined es un error clásico.",
      "書く前に undefined の値を読むのはバグ。ゴミが出て、実行やマシンごとにちがう数になる。先に読む演算子に注意：x += 1 は x = x + 1 なので x を読む。合計やカウンタを undefined で始めるのは定番のミスじゃ。",
    ),
    show(z`
      var count: u32 = undefined;
      count += 1;
    `, L("Bug: += reads count while it is still garbage", "Bug: += lee count mientras aún es basura", "バグ：+= がまだゴミの count を読む")),
    p(
      "Rule to remember: use undefined only when a real value is assigned before any read, for example an array filled right after. For sums, counters and anything built with +=, start from a known value such as 0.",
      "Regla para recordar: usa undefined solo cuando un valor real se asigna antes de cualquier lectura, por ejemplo un array que se llena justo después. Para sumas, contadores y todo lo que se arma con +=, empieza con un valor conocido como 0.",
      "覚えるルール：undefined は、読む前に本物の値を必ず入れるとき（すぐあとで埋める配列など）だけ使う。合計やカウンタなど += で作るものは、0 のようなわかっている値から始めよう。",
    ),
    ex(z`
      var sum: u32 = 0;
      for ([_]u32{ 4, 5 }) |v| sum += v;
      std.debug.print("{d}\n", .{sum});
    `, "9", L("A sum that starts from a known value", "Una suma que empieza con un valor conocido", "わかっている値から始める合計")),
  ),
  note("unreachable", L("unreachable: this can't happen", "unreachable: esto no puede pasar", "unreachable：ここには来ない"),
    p(
      "unreachable marks a spot the program should never reach, for example a switch arm for values that \"can't happen\". It is a promise, like .? and catch unreachable. In Debug builds, breaking the promise stops the program with panic: reached unreachable code.",
      "unreachable marca un lugar al que el programa nunca debería llegar, por ejemplo un brazo de switch para valores que \"no pueden pasar\". Es una promesa, como .? y catch unreachable. En Debug, romper la promesa detiene el programa con panic: reached unreachable code.",
      "unreachable は、プログラムが決して来ないはずの場所のしるし。「ありえない」値のための switch の腕などに使う。.? や catch unreachable と同じく約束で、Debugでやぶると panic: reached unreachable code で止まる。",
    ),
    ex(z`
      var mode: u8 = 1;
      _ = &mode;
      const name: []const u8 = switch (mode) {
          0 => "off",
          1 => "on",
          else => unreachable,
      };
      std.debug.print("{s}\n", .{name});
    `, "on", L("mode is 1, so the unreachable arm is never used", "mode es 1, así que nunca se usa el brazo unreachable", "mode は 1 なので unreachable の腕は使われない")),
    boom(z`
      var mode: u8 = 9;
      _ = &mode;
      const name: []const u8 = switch (mode) {
          0 => "off",
          1 => "on",
          else => unreachable,
      };
      std.debug.print("{s}\n", .{name});
    `, "reached unreachable code", L("mode is 9: the promise breaks", "mode es 9: la promesa se rompe", "mode が 9：約束がやぶれる")),
    p(
      "To predict what happens, find which branch actually runs for the given value. If it is the unreachable one, the result is a panic, not a default value. Use unreachable only when you can prove the case is impossible; otherwise handle it.",
      "Para predecir qué pasa, busca qué rama corre de verdad con el valor dado. Si es la de unreachable, el resultado es un panic, no un valor por defecto. Usa unreachable solo cuando puedas probar que el caso es imposible; si no, manéjalo.",
      "どうなるか予想するには、その値で本当に動く枝を探す。それが unreachable なら結果は panic で、代わりの値ではない。ありえないと証明できるときだけ unreachable を使い、そうでなければちゃんとあつかおう。",
    ),
  ),
  note("safety-checks", L("Debug safety checks", "Chequeos de seguridad en Debug", "Debug の安全チェック"),
    p(
      "Debug builds add alarm bells to dangerous operations: integer overflow, index out of bounds, null unwrap, unreachable and division by zero. Each one turns a silent wrong result into a clear panic message at the exact line.",
      "Las compilaciones Debug añaden alarmas a las operaciones peligrosas: desborde de enteros, índice fuera de límites, abrir null, unreachable y división por cero. Cada una convierte un resultado erróneo silencioso en un mensaje de panic claro en la línea exacta.",
      "Debugビルドは危ない操作にアラームをつける：整数オーバーフロー、範囲外の番号、null の取り出し、unreachable、ゼロ除算。どれも、だまってまちがう結果を、その行での明確な panic メッセージに変える。",
    ),
    boom(z`
      var total: u32 = 12;
      var groups: u32 = 0;
      _ = &total;
      _ = &groups;
      std.debug.print("{d}\n", .{total / groups});
    `, "division by zero", L("Panics: dividing by 0 at runtime", "Hace panic: dividir entre 0 al ejecutar", "panic：実行時に 0 で割る")),
    p(
      "When every value involved is known while compiling, Zig doesn't wait for runtime: the mistake is a compile error. For example, adding to a const u8 that would go past 255 fails with overflow of integer type 'u8'. With a runtime value, the same mistake is a panic instead.",
      "Cuando todos los valores se conocen al compilar, Zig no espera a la ejecución: el error es de compilación. Por ejemplo, sumar a un const u8 algo que pasaría de 255 falla con overflow of integer type 'u8'. Con un valor de ejecución, el mismo error es un panic.",
      "関わる値が全部コンパイル時にわかるなら、Zigは実行時を待たずコンパイルエラーにする。たとえば const の u8 に 255 を超える数をたすと overflow of integer type 'u8'。実行時の値なら、同じミスが panic になる。",
    ),
    bad(z`
      const top: u8 = 250;
      const more = top + 10;
      std.debug.print("{d}\n", .{more});
    `, L("Does not compile: known values, known overflow", "No compila: valores conocidos, desborde conocido", "コンパイル不可：値も overflow もわかっている")),
    boom(z`
      var w: u8 = 100;
      _ = &w;
      const tripled = w * 3;
      std.debug.print("{d}\n", .{tripled});
    `, "integer overflow", L("Panics: 300 doesn't fit, found at runtime", "Hace panic: 300 no cabe, se detecta al ejecutar", "panic：300 は入らず、実行時に見つかる")),
    p(
      "The wrapping operators +%, -%, *% are how you say \"overflow is fine here\". They never panic: the result wraps around (for a u8, 256 is subtracted until it fits).",
      "Los operadores de vuelta +%, -%, *% son la forma de decir \"aquí el desborde está bien\". Nunca hacen panic: el resultado da la vuelta (en un u8, se resta 256 hasta que cabe).",
      "一周する演算子 +% -% *% は「ここはあふれてもいい」という意思表示。panic せず、結果は一周する（u8 なら入るまで 256 を引く）。",
    ),
    ex(z`std.debug.print("{d}\n", .{@as(u8, 130) *% 2});`, "4", L("260 - 256 = 4, no alarm", "260 - 256 = 4, sin alarma", "260 - 256 = 4、アラームなし")),
  ),
  note("build-modes", L("Build modes and safety", "Modos de compilación y seguridad", "ビルドモードと安全"),
    p(
      "Zig can build the same code in four modes, chosen with -O. Debug: no optimization, all safety checks on (what this game uses). ReleaseSafe: optimized, safety checks still on. ReleaseFast: optimized for speed, checks removed. ReleaseSmall: optimized for size, checks removed.",
      "Zig puede compilar el mismo código en cuatro modos, elegidos con -O. Debug: sin optimizar, todos los chequeos activos (el que usa este juego). ReleaseSafe: optimizado, chequeos aún activos. ReleaseFast: optimizado para velocidad, sin chequeos. ReleaseSmall: optimizado para tamaño, sin chequeos.",
      "Zigは同じコードを -O で選ぶ4つのモードでビルドできる。Debug：最適化なし、安全チェック全部あり（このゲームで使用）。ReleaseSafe：最適化ありでチェックも残る。ReleaseFast：速さ重視でチェックなし。ReleaseSmall：サイズ重視でチェックなし。",
    ),
    show(z`
      zig build-exe main.zig -O Debug
      zig build-exe main.zig -O ReleaseSafe
      zig build-exe main.zig -O ReleaseFast
      zig build-exe main.zig -O ReleaseSmall
    `, L("The same program, four build modes", "El mismo programa, cuatro modos", "同じプログラム、4つのモード")),
    p(
      "Without the checks, a bug like overflow or reading past an array doesn't stop the program: it quietly produces wrong results or worse. That's why the names say Safe, Fast or Small: you trade safety for speed or size, and only when you trust the code.",
      "Sin los chequeos, un bug como un desborde o leer fuera de un array no detiene el programa: produce en silencio resultados erróneos o algo peor. Por eso los nombres dicen Safe, Fast o Small: cambias seguridad por velocidad o tamaño, y solo cuando confías en el código.",
      "チェックがないと、オーバーフローや配列の外を読むバグでもプログラムは止まらず、だまってまちがった結果（もっと悪いことも）を出す。だから名前が Safe・Fast・Small なのじゃ。信頼できるコードでだけ、安全と引きかえに速さやサイズを取る。",
    ),
    p(
      "Rule to remember: the two modes whose names don't promise Fast or Small keep the alarms. Develop and test in Debug; ship in ReleaseSafe unless you really need the last bit of speed or size.",
      "Regla para recordar: los dos modos cuyos nombres no prometen Fast ni Small conservan las alarmas. Desarrolla y prueba en Debug; publica en ReleaseSafe salvo que de verdad necesites hasta la última gota de velocidad o tamaño.",
      "覚えるルール：名前に Fast や Small がつかない2つのモードはアラームが残る。開発とテストは Debug、配布は ReleaseSafe。速さやサイズが本当にぎりぎり必要なときだけ別のモードにしよう。",
    ),
  ),
];

const bossNotes: NoteDef[] = [
  note("recap-optionals", L("Recap: optionals", "Repaso: opcionales", "復習：オプショナル"),
    p(
      "?T is a value that may be null. orelse gives a spare when it is empty; .? takes the value and panics with attempt to use null value when it is empty; if (opt) |v| handles both cases safely. orelse is for optionals only.",
      "?T es un valor que puede ser null. orelse da un repuesto si está vacío; .? saca el valor y hace panic con attempt to use null value si está vacío; if (opt) |v| maneja ambos casos con seguridad. orelse es solo para opcionales.",
      "?T は null かもしれない値。orelse はからのとき予備を出し、.? は値を取り出すが、からなら attempt to use null value で panic。if (opt) |v| は両方を安全にあつかう。orelse はオプショナル専用。",
    ),
    ex(z`
      const left: ?u32 = 6;
      const right: ?u32 = null;
      std.debug.print("{d}\n", .{(left orelse 0) * (right orelse 2)});
    `, "12", L("6 from the full bottle, 2 from the spare", "6 de la botella llena, 2 del repuesto", "中身の 6 と予備の 2")),
    p(
      "Lines run in order: anything printed before a failing .? still appears, then the panic stops the program.",
      "Las líneas corren en orden: lo que se imprimió antes de un .? que falla sigue apareciendo, y luego el panic detiene el programa.",
      "行は順に実行される。失敗する .? より前に表示したものはちゃんと出て、そのあと panic でプログラムが止まる。",
    ),
  ),
  note("recap-errors", L("Recap: error unions", "Repaso: uniones de error", "復習：エラー共用体"),
    p(
      "E!T is either an error or a value. catch gives a fallback (or captures the error with |err|) and only runs on failure; try unwraps or returns the error to the caller; an error union can never be silently ignored. catch is for error unions, orelse for optionals.",
      "E!T es un error o un valor. catch da un repuesto (o captura el error con |err|) y solo corre al fallar; try abre o devuelve el error a quien llamó; una unión de error nunca se puede ignorar en silencio. catch es para uniones de error, orelse para opcionales.",
      "E!T はエラーか値。catch は代わりの値を出す（|err| でエラーも受けとれる）が失敗時だけ動く。try は取り出すか呼び出し元にエラーを返す。エラー共用体はだまって無視できない。catch はエラー共用体、orelse はオプショナル用。",
    ),
    ex(z`
      const good = std.fmt.parseInt(u8, "9", 10) catch 0;
      const nothing: ?u8 = null;
      std.debug.print("{d} {d}\n", .{ good, nothing orelse 1 });
    `, "9 1", L("catch for a parse, orelse for an optional", "catch para leer, orelse para un opcional", "変換には catch、オプショナルには orelse")),
    p(
      "To trace a chain of try calls, follow each value step by step. The first step that fails returns its error at once; the rest of the function is skipped.",
      "Para seguir una cadena de try, sigue cada valor paso a paso. El primer paso que falla devuelve su error de inmediato; el resto de la función se salta.",
      "try が続くときは値を1歩ずつ追う。最初に失敗した所ですぐエラーが返り、関数の残りは飛ばされる。",
    ),
    ex(z`
      fn third(n: u32) !u32 {
          if (n % 3 != 0) return error.NotThree;
          return n / 3;
      }

      fn ninth(n: u32) !u32 {
          return try third(try third(n));
      }

      pub fn main() void {
          std.debug.print("{any} {any}\n", .{ ninth(27), ninth(12) });
      }
    `, "3 error.NotThree", L("27 → 9 → 3; 12 → 4, and third(4) fails", "27 → 9 → 3; 12 → 4, y third(4) falla", "27 → 9 → 3。12 → 4 で third(4) が失敗")),
  ),
  note("recap-defer", L("Recap: defer and errdefer", "Repaso: defer y errdefer", "復習：defer と errdefer"),
    p(
      "defer runs at the end of its scope on every exit; errdefer only when the function returns an error. Both kinds share one stack: they run in reverse of the order they were written. A deferred line reads variables when it runs, so it sees the newest values.",
      "defer corre al final de su bloque en toda salida; errdefer solo cuando la función devuelve un error. Ambos comparten una pila: corren en orden inverso al que se escribieron. Una línea diferida lee las variables cuando corre, así que ve los valores más nuevos.",
      "defer はどの抜け方でもスコープの終わりに動き、errdefer は関数がエラーを返すときだけ。両方は同じ山に積まれ、書いた順の逆に動く。defer の行は動くときに変数を読むので、最新の値を見る。",
    ),
    ex(z`
      fn job(fail: bool) !void {
          errdefer std.debug.print("on error\n", .{});
          defer std.debug.print("always\n", .{});
          if (fail) return error.Oops;
      }

      pub fn main() void {
          job(false) catch {};
          job(true) catch {};
      }
    `, "always\nalways\non error", L("Success: only defer. Failure: both, last written first", "Éxito: solo defer. Fallo: ambos, el último escrito primero", "成功は defer だけ。失敗は両方、後に書いたほうが先")),
  ),
  note("recap-safety", L("Recap: runtime alarms", "Repaso: alarmas al ejecutar", "復習：実行時のアラーム"),
    p(
      "In Debug, a runtime division by zero, overflow, bad index or null unwrap stops the program with a panic at that line. Earlier prints have already happened. To avoid the panic, check the dangerous value first.",
      "En Debug, una división por cero, desborde, índice malo o null abierto al ejecutar detiene el programa con un panic en esa línea. Los prints anteriores ya ocurrieron. Para evitar el panic, revisa antes el valor peligroso.",
      "Debugでは、実行時のゼロ除算・オーバーフロー・まちがった番号・null の取り出しがその行で panic を起こす。それより前の表示はもう出ている。panic を避けるには、先に危ない値を確かめよう。",
    ),
    ex(z`
      var shots: u32 = 9;
      var rounds: u32 = 0;
      _ = &shots;
      _ = &rounds;
      const avg = if (rounds == 0) 0 else shots / rounds;
      std.debug.print("{d}\n", .{avg});
    `, "0", L("Checking for 0 first avoids the alarm", "Revisar el 0 primero evita la alarma", "先に 0 を確かめればアラームなし")),
  ),
];

// ─── 2.1 Bottles that may be empty ─────────────────────────────────────────
const optionals: LessonDef = {
  slug: "optionals",
  title: L("Bottles that may be empty", "Botellas quizá vacías", "からっぽかもしれないビン"),
  concept: "optionals",
  mode: "lesson",
  xp: 70,
  enemy: "ghost",
  enemyName: L("NULL GHOST", "FANTASMA NULL", "ヌルおばけ"),
  notes: optionalsNotes,
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
      hint: L("How does an empty optional print? After it is filled, what does .? take out?", "¿Cómo se imprime un opcional vacío? Tras llenarlo, ¿qué saca .??", "からのオプショナルはどう表示される？満たしたあと .? は何を出す？"),
      note: "optional-type",
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
      hint: L("Which types are allowed to hold null in Zig: every type, or only some?", "¿Qué tipos pueden guardar null en Zig: todos o solo algunos?", "Zigで null を持てるのはどの型？全部？一部だけ？"),
      note: "optional-type",
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
      hint: L("Which types can hold null? Check whether this pointer type is one of them.", "¿Qué tipos pueden guardar null? Revisa si este tipo de puntero es uno de ellos.", "null を持てる型はどれ？このポインタ型がその1つか確かめよう。"),
      note: "optional-type",
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
      hint: L("Is the bottle empty or full? orelse hands over its right side in only one of those cases.", "¿La botella está vacía o llena? orelse entrega su lado derecho solo en uno de esos casos.", "ビンはから？中身あり？orelse が右側をわたすのは片方の時だけ。"),
      note: "orelse-unwrap",
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
      hint: L("Any type can be optional, even text. Is opt empty or full?", "Cualquier tipo puede ser opcional, incluso texto. ¿opt está vacía o llena?", "文字列もオプショナルにできる。opt はから？中身あり？"),
      note: "orelse-unwrap",
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
      hint: L("What is the type of x? Does + accept that type as it is?", "¿De qué tipo es x? ¿Acepta + ese tipo tal cual?", "x の型は？+ はその型をそのまま受けつける？"),
      note: "orelse-unwrap",
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
      hint: L("You need the keyword that gives a spare value when the bottle is empty.", "Necesitas la palabra clave que da un valor de repuesto si la botella está vacía.", "ビンがからのとき予備の値をくれるキーワードが必要じゃ。"),
      note: "orelse-unwrap",
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
      hint: L("Lines run in order. What does .? do when the bottle turns out to be empty?", "Las líneas corren en orden. ¿Qué hace .? cuando la botella resulta estar vacía?", "行は順に動く。ビンがからだったとき .? はどうなる？"),
      note: "orelse-unwrap",
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
      hint: L("Is maybe full or empty? The capture |v| receives the contents in one branch.", "¿maybe está llena o vacía? La captura |v| recibe el contenido en una de las ramas.", "maybe は中身あり？から？|v| は片方の枝で中身を受けとる。"),
      note: "if-capture",
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
      hint: L("A |v| capture opens a bottle. Is n a bottle?", "Una captura |v| abre una botella. ¿n es una botella?", "|v| はビンを開ける。n はビン？"),
      note: "if-capture",
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
      hint: L("find returns the index when it finds the target, or null when it doesn't. Indexes start at 0.", "find devuelve el índice si encuentra el objetivo, o null si no. Los índices empiezan en 0.", "find は見つかれば番号、なければ null を返す。番号は0から。"),
      note: "if-capture",
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
      hint: L("next() gives one piece per call, then null when nothing is left. The loop stops at null.", "next() da un trozo por llamada, y null cuando no queda nada. El bucle para en null.", "next() は1回に1つずつ、なくなると null。ループは null で止まる。"),
      note: "if-capture",
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
      hint: L("\"zed\" is not on the team, so find gives null. Handle both cases instead of forcing it open.", "\"zed\" no está en el equipo, así que find da null. Maneja ambos casos en vez de forzarla.", "\"zed\" はいないので find は null。無理に開けず両方の場合をあつかおう。"),
      note: "if-capture",
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
  notes: errorUnionsNotes,
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
      hint: L("One call succeeds, the other fails. catch replaces only an error with its fallback.", "Una llamada tiene éxito y la otra falla. catch solo reemplaza un error por su repuesto.", "片方は成功、片方は失敗。catch が置きかえるのはエラーだけ。"),
      note: "catch",
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
      hint: L("Which name makes open return which result? else |err| receives the error.", "¿Con qué nombre devuelve open cada resultado? else |err| recibe el error.", "どの名前で open は何を返す？else |err| がエラーを受けとる。"),
      note: "catch",
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
      hint: L("half returns !u32. Is that the same type as u32?", "half devuelve !u32. ¿Es el mismo tipo que u32?", "half は !u32 を返す。それは u32 と同じ型？"),
      note: "error-unions",
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
      hint: L("The call's result is not used at all. Can a possible error be silently dropped?", "El resultado de la llamada no se usa. ¿Se puede tirar en silencio un posible error?", "呼び出しの結果を使っていない。起きうるエラーをだまって捨てられる？"),
      note: "error-unions",
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
      hint: L("try unwraps a success, or returns the error from twice at once. Trace both calls.", "try abre un éxito, o devuelve el error desde twice de inmediato. Sigue ambas llamadas.", "try は成功なら取り出し、失敗なら twice からすぐ返す。両方追おう。"),
      note: "try",
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
      hint: L("try sends the error to show's caller. What return type does show have?", "try manda el error a quien llamó a show. ¿Qué tipo de retorno tiene show?", "try はエラーを show の呼び出し元へ送る。show の戻り値の型は？"),
      note: "try",
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
      hint: L("You need the keyword that unwraps, or passes the error up to the caller.", "Necesitas la palabra clave que abre, o pasa el error a quien llamó.", "取り出すか、呼び出し元にエラーをわたすキーワードが必要じゃ。"),
      note: "try",
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
      hint: L("Is \"-42\" a valid number in base 10? If it is, try just unwraps it.", "¿\"-42\" es un número válido en base 10? Si lo es, try solo lo abre.", "\"-42\" は10進の正しい数？そうなら try は取り出すだけ。"),
      note: "try",
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
      hint: L("Which error does open give for \"x\"? Then find its arm in the switch.", "¿Qué error da open con \"x\"? Luego busca su brazo en el switch.", "\"x\" で open が返すエラーは？次に switch でその腕を探そう。"),
      note: "catch",
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
      hint: L("Which errors can half return? Every arm of the switch must name one of them.", "¿Qué errores puede devolver half? Cada brazo del switch debe nombrar uno de ellos.", "half が返せるエラーは？switch の腕はどれもその中の1つでないと。"),
      note: "catch",
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
      hint: L("Does 300 fit in a u8? Is \"x1\" made only of digits?", "¿Cabe 300 en un u8? ¿\"x1\" tiene solo dígitos?", "300 は u8 に入る？\"x1\" は数字だけ？"),
      note: "error-unions",
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
      hint: L("catch unreachable promises the call never fails. Does half(3) fail?", "catch unreachable promete que la llamada nunca falla. ¿half(3) falla?", "catch unreachable は「失敗しない」約束。half(3) は失敗する？"),
      note: "catch",
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
      hint: L("This parse can fail, so promising it never does is wrong. Capture the error and print its name.", "Esta lectura puede fallar, así que prometer que no falla está mal. Captura el error e imprime su nombre.", "この変換は失敗しうるので「失敗しない」約束はだめ。エラーを受けとり名前を表示。"),
      note: "catch",
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
  notes: deferNotes,
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
      hint: L("Defers wait until the scope ends. Think of a stack of scrolls: which comes off first?", "Los defer esperan a que termine el bloque. Piensa en una pila de pergaminos: ¿cuál sale primero?", "defer はスコープの終わりまで待つ。巻物の山なら、どれが先に取れる？"),
      note: "defer-basics",
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
      hint: L("A defer belongs to the nearest { } block. Where does that block end?", "Un defer pertenece al bloque { } más cercano. ¿Dónde termina ese bloque?", "defer は一番近い { } ブロックのもの。そのブロックはどこで終わる？"),
      note: "defer-basics",
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
      hint: L("Each lap of a loop is its own scope. When does each lap's defer run?", "Cada vuelta de un bucle es su propio bloque. ¿Cuándo corre el defer de cada vuelta?", "ループの1周は1つのスコープ。各周の defer はいつ動く？"),
      note: "defer-basics",
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
      hint: L("The deferred line runs as a whole at the end. What is x by then?", "La línea diferida corre entera al final. ¿Cuánto vale x para entonces?", "defer の行は最後にまるごと動く。その時 x はいくつ？"),
      note: "defer-timing",
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
      hint: L("The block sets x, then its } triggers the deferred line.", "El bloque fija x, y luego su } dispara la línea diferida.", "ブロックが x を決め、そのあと } で defer の行が動く。"),
      note: "defer-timing",
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
      hint: L("return decides its value first; the defer runs after that. Does the change reach the caller?", "return decide su valor primero; el defer corre después. ¿El cambio llega a quien llamó?", "return が先に値を決め、defer はそのあと。変化は呼び出し元に届く？"),
      note: "defer-timing",
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
      hint: L("The body prints first. Defers run in reverse of the order they were pinned.", "El cuerpo imprime primero. Los defer corren al revés del orden en que se clavaron.", "本体が先に表示。defer は貼った順の逆に動く。"),
      note: "defer-basics",
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
      hint: L("errdefer runs only when the function leaves with an error. Which call fails?", "errdefer solo corre cuando la función sale con error. ¿Qué llamada falla?", "errdefer はエラーで抜ける時だけ。失敗するのはどの呼び出し？"),
      note: "errdefer",
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
      hint: L("errdefer |err| receives the error leaving the function. Which error is returned?", "errdefer |err| recibe el error que sale de la función. ¿Qué error se devuelve?", "errdefer |err| は出ていくエラーを受けとる。返るエラーは？"),
      note: "errdefer",
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
      hint: L("One keyword runs on every exit, the other only on failure. Which matches the prompt?", "Una palabra clave corre en toda salida, la otra solo al fallar. ¿Cuál encaja con la consigna?", "片方はどの抜け方でも、もう片方は失敗時だけ。問題に合うのは？"),
      note: "errdefer",
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
      hint: L("Only the failing call should count. Which keyword runs only when the function fails?", "Solo la llamada que falla debe contar. ¿Qué palabra clave corre solo cuando la función falla?", "数えるのは失敗した呼び出しだけ。失敗時だけ動くキーワードは？"),
      note: "errdefer",
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
  notes: undefinedAndSafetyNotes,
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
      hint: L("Follow the order: is x written before the line that reads it?", "Sigue el orden: ¿se escribe x antes de la línea que la lee?", "順番を追おう。x を読む行より前に書いている？"),
      note: "undefined",
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
      hint: L("You need the word that reserves a variable without giving it a value yet.", "Necesitas la palabra que reserva una variable sin darle valor todavía.", "まだ値を入れずに変数の場所だけ取る言葉が必要じゃ。"),
      note: "undefined",
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
      hint: L("What value does total hold before the first lap? Remember what += does first.", "¿Qué valor tiene total antes de la primera vuelta? Recuerda qué hace += primero.", "1周目の前、total には何が入っている？+= が最初にすることは？"),
      note: "undefined",
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
      hint: L("x is 3. Which arm runs, and what does that arm promise?", "x es 3. ¿Qué brazo corre, y qué promete ese brazo?", "x は 3。どの腕が動き、その腕は何を約束している？"),
      note: "unreachable",
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
      hint: L("What is a / b when b is 0? Debug builds don't let it slip by.", "¿Cuánto es a / b si b es 0? Debug no lo deja pasar.", "b が 0 のとき a / b は？Debugは見のがさない。"),
      note: "safety-checks",
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
      hint: L("Every value here is known while compiling. When is the overflow detected?", "Aquí todo valor se conoce al compilar. ¿Cuándo se detecta el desborde?", "ここの値は全部コンパイル時にわかる。overflow はいつ見つかる？"),
      note: "safety-checks",
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
      hint: L("n is a u8 known only at runtime. Does 200 * 2 fit in a u8?", "n es un u8 que solo se conoce al ejecutar. ¿Cabe 200 * 2 en un u8?", "n は実行時の u8。200 * 2 は u8 に入る？"),
      note: "safety-checks",
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
      hint: L("*% is the wrapping multiply: subtract 256 until the result fits a u8.", "*% es la multiplicación con vuelta: resta 256 hasta que el resultado quepa en un u8.", "*% は一周するかけ算。u8 に入るまで 256 を引こう。"),
      note: "safety-checks",
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
      hint: L("Which modes are built for speed or size instead of safety?", "¿Qué modos están hechos para velocidad o tamaño en vez de seguridad?", "安全より速さやサイズを取るモードはどれ？"),
      note: "build-modes",
      prompt: L("Where do the safety alarms stay on?", "¿Dónde siguen activas las alarmas?", "安全アラームが残るのはどこ？"),
      code: "zig build-exe main.zig -O ReleaseSafe",
      options: [L("Debug and ReleaseSafe", "Debug y ReleaseSafe", "Debug と ReleaseSafe"), L("Only Debug", "Solo Debug", "Debug だけ"), L("All four modes", "Los cuatro modos", "4つ全部")],
      answer: 0,
      explain: L("ReleaseSafe is optimized but keeps the checks. ReleaseFast/Small drop them for speed or size.", "ReleaseSafe está optimizado pero conserva los chequeos. ReleaseFast/Small los quitan por velocidad o tamaño.", "ReleaseSafe は最適化しつつ検査を残す。ReleaseFast/Small は速さやサイズのため外す。"),
    },
    {
      kind: "run",
      hint: L("What value does total start with? A sum must start from a known number.", "¿Con qué valor empieza total? Una suma debe empezar con un número conocido.", "total は何から始まる？合計はわかっている数から始めるもの。"),
      note: "undefined",
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
  notes: bossNotes,
  beats: [
    enemySays(L(
      "Hee hee! I hide in empty bottles and unread scrolls. Miss one null, drop one error, and the forest is mine!",
      "¡Ji ji! Me escondo en botellas vacías y pergaminos sin leer. ¡Olvida un null o tira un error, y el bosque es mío!",
      "ヒヒ！からのビンと読まれない巻物にかくれてる。null をひとつ見のがせば森はいただきだ！",
    )),
    {
      kind: "predict", time: 15, prompt: PRINT,
      hint: L("Unwrap each bottle with its spare first, then add the two results.", "Abre primero cada botella con su repuesto y luego suma los dos resultados.", "まず各ビンを予備つきで開け、2つの結果をたそう。"),
      note: "recap-optionals",
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
      hint: L("Does \"7\" parse correctly? catch only runs when there is an error.", "¿\"7\" se lee bien? catch solo corre cuando hay un error.", "\"7\" は正しく変換できる？catch はエラーの時だけ動く。"),
      note: "recap-errors",
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
      hint: L("Lines run in order. What does .? do on an empty bottle?", "Las líneas corren en orden. ¿Qué hace .? con una botella vacía?", "行は順に動く。からのビンに .? を使うと？"),
      note: "recap-optionals",
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
      hint: L("Trace each call step by step: try passes an error up the moment half fails.", "Sigue cada llamada paso a paso: try pasa un error hacia arriba en cuanto half falla.", "各呼び出しを1歩ずつ。half が失敗した瞬間 try がエラーを上へ。"),
      note: "recap-errors",
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
      hint: L("The result of half(6) is not used. Can an error union be dropped?", "El resultado de half(6) no se usa. ¿Se puede tirar una unión de error?", "half(6) の結果を使っていない。エラー共用体は捨てられる？"),
      note: "recap-errors",
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
      hint: L("maybe is an optional, not an error union. Which keyword fits optionals?", "maybe es un opcional, no una unión de error. ¿Qué palabra clave va con opcionales?", "maybe はオプショナルでエラー共用体ではない。合うキーワードは？"),
      note: "recap-optionals",
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
      hint: L("parseInt returns an error union, not an optional. Which keyword handles errors?", "parseInt devuelve una unión de error, no un opcional. ¿Qué palabra clave maneja errores?", "parseInt はエラー共用体を返す。エラーをあつかうキーワードは？"),
      note: "recap-errors",
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
      hint: L("The call fails, so both run. Defers come off the stack in reverse order.", "La llamada falla, así que ambos corren. Los defer salen de la pila en orden inverso.", "失敗するので両方動く。defer は山から逆順に取られる。"),
      note: "recap-defer",
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
      hint: L("The deferred print runs whole at the end. What is gold by then?", "El print diferido corre entero al final. ¿Cuánto vale gold para entonces?", "defer の print は最後にまるごと動く。その時 gold はいくつ？"),
      note: "recap-defer",
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
      hint: L("misses is 0 at runtime. What happens when you divide by it in Debug?", "misses vale 0 al ejecutar. ¿Qué pasa al dividir entre él en Debug?", "実行時に misses は 0。Debugでそれで割ると？"),
      note: "recap-safety",
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
      hint: L("Only the failing call should print refund. Which keyword runs only on error?", "Solo la llamada que falla debe imprimir refund. ¿Qué palabra clave corre solo con error?", "refund を出すのは失敗した呼び出しだけ。エラー時だけ動くのは？"),
      note: "recap-defer",
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
