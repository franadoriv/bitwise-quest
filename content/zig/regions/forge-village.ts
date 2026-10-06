import type { Beat, LessonDef, NoteBlock, NoteDef, RegionDef, Text } from "../../../lib/content/types.ts";
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

const constAndVarNotes: NoteDef[] = [
  note("const-var", L("const or var: stone or chalk", "const o var: piedra o tiza", "const と var：石とチョーク"),
    p(
      "A variable is a name stuck to a value. Zig gives you two ways to make one. const makes a name whose value can never change after it is set. var makes a name whose value you may change later, with = or with shortcuts like += and -=.",
      "Una variable es un nombre pegado a un valor. Zig te da dos formas de crearla. const crea un nombre cuyo valor nunca cambia después de darlo. var crea un nombre cuyo valor puedes cambiar después, con = o con atajos como += y -=.",
      "変数とは値に貼った名前のこと。Zigには作り方が2つある。const は一度決めたら二度と変わらない名前。var はあとで = や += 、-= で値を変えてよい名前じゃ。",
    ),
    ex(z`
      const speed: i32 = 4;
      var laps: i32 = 0;
      laps += 2;
      laps += 1;
      std.debug.print("{d} {d}\n", .{ speed, laps });
    `, "4 3", L("speed is fixed; laps changes twice", "speed es fijo; laps cambia dos veces", "speed は固定、laps は2回変わる")),
    p(
      "The line reads like a sentence: const (fixed) speed (named speed) : i32 (a 32-bit signed integer) = 4 (holding 4) ; (done). Assigning to a const is the compile error cannot assign to constant.",
      "La línea se lee como una frase: const (fijo) speed (llamado speed) : i32 (un entero con signo de 32 bits) = 4 (que guarda 4) ; (listo). Asignar a un const es el error de compilación cannot assign to constant.",
      "1行は文のように読める：const（固定）speed（speed という名前）: i32（32ビット符号つき整数）= 4（4を入れる）;（おしまい）。const に代入すると cannot assign to constant というエラーになる。",
    ),
    bad(z`
      const level: u8 = 1;
      level += 1;
      std.debug.print("{d}\n", .{level});
    `, L("Does not compile: level is const", "No compila: level es const", "コンパイル不可：level は const")),
    p(
      "Zig is strict the other way too: a var that is never changed is also an error, local variable is never mutated. The compiler wants the label to tell the truth: if the value never changes, it must be const.",
      "Zig también es estricto al revés: una var que nunca cambia también es error, local variable is never mutated. El compilador quiere que la etiqueta diga la verdad: si el valor nunca cambia, debe ser const.",
      "Zigは逆向きにもきびしい。一度も変えない var もエラー（local variable is never mutated）。ラベルは本当のことを言うべきで、変わらない値なら const にしなければならない。",
    ),
    bad(z`
      var mana: u8 = 9;
      std.debug.print("{d}\n", .{mana});
    `, L("Does not compile: mana is var but never changes", "No compila: mana es var pero nunca cambia", "コンパイル不可：mana は var なのに変わらない")),
    p(
      "Rule to remember: start with const. Switch to var only when some line really changes the value. And watch = versus +=: x = y replaces the old value, x += y adds y to it.",
      "Regla para recordar: empieza con const. Cambia a var solo cuando alguna línea de verdad cambia el valor. Y cuidado con = frente a +=: x = y reemplaza el valor viejo, x += y le suma y.",
      "覚えるルール：まず const で書く。本当に値を変える行があるときだけ var にする。= と += のちがいにも注意。x = y は古い値を置きかえ、x += y は y をたす。",
    ),
  ),
  note("unused-discard", L("Unused names and _ =", "Nombres sin usar y _ =", "使わない名前と _ ="),
    p(
      "In Zig, every local name you create must be used. A const or var that no line ever reads is a compile error: unused local constant or unused local variable. This keeps code free of leftovers that confuse the next reader.",
      "En Zig, todo nombre local que creas debe usarse. Un const o var que ninguna línea lee es error de compilación: unused local constant o unused local variable. Así el código no tiene restos que confunden a quien lo lee después.",
      "Zigでは、作ったローカルの名前は必ず使わないといけない。どの行にも読まれない const や var はエラー（unused local constant / unused local variable）。読む人を迷わせる残りかすを防ぐためじゃ。",
    ),
    bad("const bonus: u32 = 50;", L("Does not compile: bonus is never used", "No compila: bonus nunca se usa", "コンパイル不可：bonus を使っていない")),
    p(
      "Sometimes you want to keep a value and ignore it on purpose, for example while you are still writing the code. Then assign it to the underscore: _ = name; The _ is a bin that accepts any value and throws it away, and the compiler sees that you meant it.",
      "A veces quieres guardar un valor e ignorarlo a propósito, por ejemplo mientras aún escribes el código. Entonces asígnalo al guion bajo: _ = nombre; El _ es un cesto que acepta cualquier valor y lo tira, y el compilador ve que fue a propósito.",
      "わざと値を無視したいときもある（書いている途中など）。そのときはアンダースコアに代入する：_ = 名前; _ はどんな値も受けとって捨てるゴミ箱で、コンパイラもわざとだとわかる。",
    ),
    ex(z`
      const level: u8 = 4;
      _ = level;
      std.debug.print("ready\n", .{});
    `, "ready", L("level is discarded on purpose, so it compiles", "level se descarta a propósito, así que compila", "level をわざと捨てるのでコンパイルできる")),
    p(
      "Common mistake: thinking an unused name is just a warning. In many languages it is; in Zig the program does not build at all. If the compiler says unused, either use the name or discard it with _ =.",
      "Error común: creer que un nombre sin usar es solo una advertencia. En muchos lenguajes lo es; en Zig el programa no se construye. Si el compilador dice unused, usa el nombre o descártalo con _ =.",
      "よくあるミス：使わない名前はただの警告だと思うこと。多くの言語ではそうだが、Zigではプログラムがビルドできない。unused と言われたら、名前を使うか _ = で捨てよう。",
    ),
  ),
  note("comptime-int", L("Number literals and comptime_int", "Literales y comptime_int", "数のリテラルと comptime_int"),
    p(
      "When you write a number like 5 or 1000000 in code, Zig gives it the special type comptime_int. It is exact and has no size limit, but it exists only while compiling. The running program needs a real type with a size, like u8 or i32.",
      "Cuando escribes un número como 5 o 1000000 en el código, Zig le da el tipo especial comptime_int. Es exacto y no tiene límite de tamaño, pero solo existe al compilar. El programa en ejecución necesita un tipo real con tamaño, como u8 o i32.",
      "コードに 5 や 1000000 と書くと、Zigはそれを comptime_int という特別な型にする。正確でサイズの上限もないが、コンパイル中にしか存在しない。動いているプログラムには u8 や i32 のようなサイズつきの型が要る。",
    ),
    p(
      "A const without a type is fine: its value never changes, so the compiler can keep it as comptime_int and plug it in wherever it is used. A var is different: it is a real box in memory at runtime, so it needs a type. var steps = 0; does not compile.",
      "Un const sin tipo está bien: su valor nunca cambia, así que el compilador lo guarda como comptime_int y lo coloca donde se use. Una var es distinta: es una caja real en memoria al ejecutar, así que necesita tipo. var steps = 0; no compila.",
      "型なしの const は大丈夫。値が変わらないので、コンパイラは comptime_int のまま使う場所にはめこめる。var はちがう。実行時のメモリ上の本物の箱なので型が必要。var steps = 0; はコンパイルできない。",
    ),
    bad(z`
      var steps = 0;
      steps += 2;
      std.debug.print("{d}\n", .{steps});
    `, L("Does not compile: steps would be a comptime_int", "No compila: steps sería comptime_int", "コンパイル不可：steps が comptime_int になる")),
    ex(z`
      const big = 1000000;
      var steps: u32 = 0;
      steps += 2;
      std.debug.print("{d} {d}\n", .{ big, steps });
    `, "1000000 2", L("const may skip the type; var must give one", "const puede omitir el tipo; var debe darlo", "const は型を省略できるが var は必須")),
    p(
      "Rule to remember: every var gets a type after a colon, var name: type = value; For whole numbers, u32 (no negatives) and i32 (with negatives) are good everyday choices.",
      "Regla para recordar: toda var lleva un tipo tras dos puntos, var nombre: tipo = valor; Para números enteros, u32 (sin negativos) e i32 (con negativos) son buenas opciones de todos los días.",
      "覚えるルール：var には必ずコロンのあとに型をつける。var 名前: 型 = 値; 整数なら u32（負の数なし）や i32（負の数あり）がふだん使いに向いている。",
    ),
  ),
  note("debug-print", L("Printing with std.debug.print", "Imprimir con std.debug.print", "std.debug.print で表示"),
    p(
      "std.debug.print takes two things: a format text in double quotes and a tuple of values written .{ ... }. The text prints as written, except each {...} slot, which is replaced by the next value of the tuple, in order. End the text with \\n to finish the line.",
      "std.debug.print recibe dos cosas: un texto de formato entre comillas dobles y una tupla de valores escrita .{ ... }. El texto se imprime tal cual, salvo cada hueco {...}, que se cambia por el siguiente valor de la tupla, en orden. Termina el texto con \\n para cerrar la línea.",
      "std.debug.print は2つを受けとる。二重引用符の書式テキストと、.{ ... } で書く値のタプル。テキストはそのまま表示されるが、{...} の穴はタプルの値で順に置きかわる。最後に \\n をつけて行を終える。",
    ),
    ex(z`std.debug.print("{s} found {d} gems\n", .{ "Mara", 4 });`, "Mara found 4 gems",
      L("{s} takes the text, {d} takes the number", "{s} toma el texto, {d} toma el número", "{s} に文字列、{d} に数が入る")),
    p(
      "The letter inside the braces says how to show the value: {d} for a number in decimal, {s} for text, {c} for one byte as a letter, {any} for anything (like a whole array). With nothing to fill, pass an empty tuple: .{}.",
      "La letra dentro de las llaves dice cómo mostrar el valor: {d} para un número en decimal, {s} para texto, {c} para un byte como letra, {any} para cualquier cosa (como un array entero). Si no hay nada que rellenar, pasa una tupla vacía: .{}.",
      "かっこの中の文字が表示のしかたを決める。{d} は10進の数、{s} は文字列、{c} は1バイトを文字で、{any} は何でも（配列まるごとなど）。入れる値がなければ空のタプル .{} を渡す。",
    ),
    ex(z`
      std.debug.print("start\n", .{});
      std.debug.print("{c}{c}\n", .{ 'o', 'k' });
    `, "start\nok", L("An empty tuple, then two bytes as letters", "Una tupla vacía, luego dos bytes como letras", "空のタプル、次に2バイトを文字で")),
    p(
      "Zig checks the format while compiling. If the number of slots and values doesn't match, the program does not build: too few arguments when a slot has no value, unused argument when a value has no slot. Count the slots, then count the values.",
      "Zig revisa el formato al compilar. Si la cantidad de huecos y de valores no coincide, el programa no se construye: too few arguments cuando un hueco no tiene valor, unused argument cuando un valor no tiene hueco. Cuenta los huecos y luego los valores.",
      "Zigは書式をコンパイル時に検査する。穴と値の数が合わないとビルドできない。値のない穴は too few arguments、穴のない値は unused argument。穴を数えて、値を数えよう。",
    ),
    bad(z`std.debug.print("{d}\n", .{ 3, 4 });`, L("Does not compile: two values, one slot", "No compila: dos valores y un hueco", "コンパイル不可：値が2つで穴が1つ")),
  ),
];

const integerWidthsNotes: NoteDef[] = [
  note("int-widths", L("Integer types have a width", "Los enteros tienen un ancho", "整数の型には幅がある"),
    p(
      "Every integer in Zig has a type that says how many bits it uses and whether it can be negative. u means unsigned (0 and up), i means signed (negatives too), and the number is the bit count: u8, i8, u16, i32, u64... Any width works, even u3 or u7.",
      "Cada entero en Zig tiene un tipo que dice cuántos bits usa y si puede ser negativo. u significa sin signo (0 en adelante), i significa con signo (también negativos), y el número es la cantidad de bits: u8, i8, u16, i32, u64... Sirve cualquier ancho, incluso u3 o u7.",
      "Zigの整数には、何ビット使うか・負の数になれるかを表す型がある。u は符号なし（0以上）、i は符号つき（負の数も）、数字はビット数：u8, i8, u16, i32, u64… u3 や u7 のような幅も使える。",
    ),
    p(
      "n bits give 2^n different values. Unsigned uses them all for 0..2^n - 1; signed splits them in half, from -2^(n-1) to 2^(n-1) - 1. So u4 holds 0..15 and i4 holds -8..7. std.math.maxInt(T) and std.math.minInt(T) tell you the edges.",
      "n bits dan 2^n valores distintos. Sin signo los usa todos para 0..2^n - 1; con signo los parte a la mitad, de -2^(n-1) a 2^(n-1) - 1. Así u4 guarda 0..15 e i4 guarda -8..7. std.math.maxInt(T) y std.math.minInt(T) te dan los bordes.",
      "nビットで 2^n 通りの値。符号なしは全部を 0..2^n-1 に使い、符号つきは半分に分けて -2^(n-1) から 2^(n-1)-1 まで。だから u4 は 0..15、i4 は -8..7。端は std.math.maxInt(T) と std.math.minInt(T) でわかる。",
    ),
    ex(z`std.debug.print("{d} {d} {d}\n", .{ std.math.maxInt(u16), std.math.minInt(i16), std.math.maxInt(u4) });`, "65535 -32768 15",
      L("The edges of three integer types", "Los bordes de tres tipos enteros", "3つの整数型の端")),
    p(
      "Moving a value to a WIDER type of the same kind is always safe, so Zig does it on its own: every u8 fits in a u16 or a u32. Common mistake: picking a type too small for the job. If a total can grow past 255, a u8 is the wrong box; choose a wider type.",
      "Pasar un valor a un tipo MÁS ANCHO del mismo tipo siempre es seguro, así que Zig lo hace solo: todo u8 cabe en un u16 o un u32. Error común: elegir un tipo demasiado chico. Si un total puede pasar de 255, un u8 es la caja equivocada; elige un tipo más ancho.",
      "同じ種類のより広い型に移すのは必ず安全なので、Zigは自動でやる。u8 は必ず u16 や u32 に入る。よくあるミス：小さすぎる型を選ぶこと。合計が 255 を超えうるなら u8 はまちがった箱。広い型にしよう。",
    ),
    ex(z`
      const small: u8 = 42;
      const wide: u32 = small;
      std.debug.print("{d}\n", .{wide});
    `, "42", L("Widening happens automatically", "Ensanchar ocurre automáticamente", "広げる変換は自動")),
  ),
  note("overflow-ops", L("Overflow: panic, wrap or saturate", "Desborde: panic, vuelta o saturar", "オーバーフロー：panic・一周・飽和"),
    p(
      "Overflow means a result doesn't fit in its type, like 255 + 1 in a u8 or 0 - 1 in a u8. Many languages silently give a wrong number. Zig, in Debug builds, checks every plain +, -, * and stops the program with panic: integer overflow.",
      "Desborde significa que un resultado no cabe en su tipo, como 255 + 1 en un u8 o 0 - 1 en un u8. Muchos lenguajes dan en silencio un número erróneo. Zig, en modo Debug, revisa cada +, - y * normal y detiene el programa con panic: integer overflow.",
      "オーバーフローとは結果が型に入らないこと。u8 の 255 + 1 や 0 - 1 など。多くの言語はだまってまちがった数を出すが、ZigのDebugビルドはふつうの + - * を毎回検査し、panic: integer overflow で止める。",
    ),
    boom(z`
      var lap: u8 = 255;
      lap += 1;
    `, "integer overflow", L("Panics: 256 doesn't fit in a u8", "Hace panic: 256 no cabe en un u8", "panic：256 は u8 に入らない")),
    p(
      "When going past the edge is what you want, say so with a special operator. Wrapping operators +%, -%, *% (and +%=...) roll over like an odometer: past the top they continue from 0, below 0 they continue from the top. In a u8 that means subtracting or adding 256.",
      "Cuando pasar el borde es lo que quieres, dilo con un operador especial. Los operadores de vuelta +%, -%, *% (y +%=...) giran como un cuentakilómetros: tras el tope siguen desde 0, bajo 0 siguen desde el tope. En un u8 eso es restar o sumar 256.",
      "端を越えたいなら特別な演算子で書く。一周する演算子 +% -% *%（と +%= など）はメーターのように回る。上限を越えたら 0 から、0 より下なら上限から続く。u8 なら 256 を引くかたすことになる。",
    ),
    ex(z`
      var dial: u8 = 253;
      dial +%= 5;
      var back: u8 = 1;
      back -%= 3;
      std.debug.print("{d} {d}\n", .{ dial, back });
    `, "2 254", L("258 - 256 = 2, and -2 + 256 = 254", "258 - 256 = 2, y -2 + 256 = 254", "258 - 256 = 2、-2 + 256 = 254")),
    p(
      "Saturating operators +|, -|, *| (and +|=...) stop at the edge instead: a u8 never goes above 255 or below 0, an i8 stays between -128 and 127. Think of a health bar that can't overflow.",
      "Los operadores saturados +|, -|, *| (y +|=...) se quedan en el borde: un u8 nunca pasa de 255 ni baja de 0, un i8 se queda entre -128 y 127. Piensa en una barra de vida que no puede desbordarse.",
      "飽和演算子 +| -| *|（と +|= など）は端で止まる。u8 は 255 より上にも 0 より下にも行かず、i8 は -128〜127 にとどまる。あふれないHPバーのイメージじゃ。",
    ),
    ex(z`
      var fuel: u8 = 240;
      fuel +|= 30;
      std.debug.print("{d}\n", .{fuel});
    `, "255", L("Stuck at the top of u8", "Se queda en el tope de u8", "u8 の上限で止まる")),
    p(
      "Rule to remember: plain operator = checked (panics), % = wraps around, | = sticks at the edge. Common mistake: expecting a plain += to wrap silently as in C; in Zig Debug it panics.",
      "Regla para recordar: operador normal = revisado (panic), % = da la vuelta, | = se queda en el borde. Error común: esperar que un += normal dé la vuelta en silencio como en C; en Zig Debug hace panic.",
      "覚えるルール：ふつうの演算子＝検査（panic）、%＝一周、|＝端で止まる。よくあるミス：C のように += がだまって一周すると思うこと。ZigのDebugでは panic する。",
    ),
  ),
  note("casts", L("Shrinking: @intCast and @truncate", "Achicar: @intCast y @truncate", "縮める：@intCast と @truncate"),
    p(
      "Moving a value to a NARROWER type is never automatic, because it might not fit: a u32 can hold 70000, a u8 cannot. If the value is known while compiling and doesn't fit, Zig refuses it outright: type 'u8' cannot represent integer value. If it is only known at runtime, you must say how to shrink it.",
      "Pasar un valor a un tipo MÁS ANGOSTO nunca es automático, porque puede no caber: un u32 guarda 70000, un u8 no. Si el valor se conoce al compilar y no cabe, Zig lo rechaza: type 'u8' cannot represent integer value. Si solo se conoce al ejecutar, debes decir cómo achicarlo.",
      "より狭い型への変換は自動ではない。入らないかもしれないからじゃ。u32 は 70000 を持てるが u8 は無理。コンパイル時にわかる値が入らなければ即エラー（cannot represent integer value）。実行時にしかわからない値なら、縮め方を書く必要がある。",
    ),
    bad(z`
      var wide: u32 = 70;
      _ = &wide;
      const n: u8 = wide;
      _ = n;
    `, L("Does not compile: a runtime u32 may not fit in u8", "No compila: un u32 en ejecución puede no caber en u8", "コンパイル不可：実行時の u32 は u8 に入らないかも")),
    p(
      "Two builtins do it. @intCast(x) promises the value fits; Debug checks it at runtime and panics with integer does not fit in destination type if it doesn't. @truncate(x) never fails: it keeps only the low bits, which for a u8 is the remainder after dividing by 256.",
      "Dos builtins lo hacen. @intCast(x) promete que el valor cabe; Debug lo revisa al ejecutar y hace panic con integer does not fit in destination type si no. @truncate(x) nunca falla: guarda solo los bits bajos, que para un u8 es el resto de dividir entre 256.",
      "やり方は2つの組みこみ関数。@intCast(x) は「入る」と約束し、Debugが実行時に検査して、入らなければ integer does not fit in destination type で panic。@truncate(x) は失敗しない。下位ビットだけ残す。u8 なら 256 で割った余りじゃ。",
    ),
    ex(z`
      var raw: u32 = 120;
      _ = &raw;
      const fits: u8 = @intCast(raw);
      const code: u16 = 513;
      const low: u8 = @truncate(code);
      std.debug.print("{d} {d}\n", .{ fits, low });
    `, "120 1", L("120 fits; 513 keeps its low byte: 513 - 512 = 1", "120 cabe; 513 guarda su byte bajo: 513 - 512 = 1", "120 は入る。513 は下位バイトで 513 - 512 = 1")),
    p(
      "Signed and unsigned types of the same size don't mix in arithmetic either: an i32 plus a u32 is incompatible types, because neither one can hold every value of the other. Convert one side first, for example with @as(i32, x) when the value surely fits, or with @intCast.",
      "Tampoco se mezclan en aritmética tipos con y sin signo del mismo tamaño: un i32 más un u32 es incompatible types, porque ninguno puede guardar todo valor del otro. Convierte un lado antes, por ejemplo con @as(i32, x) cuando el valor seguro cabe, o con @intCast.",
      "同じサイズの符号つきと符号なしも計算で混ぜられない。i32 + u32 は incompatible types。どちらも相手の全部の値を持てないからじゃ。先に片方を変換しよう。確実に入るなら @as(i32, x)、そうでなければ @intCast。",
    ),
    ex(z`
      var loss: i32 = -4;
      var gain: u8 = 10;
      _ = &loss;
      _ = &gain;
      std.debug.print("{d}\n", .{loss + @as(i32, gain)});
    `, "6", L("A u8 always fits in an i32, so @as is enough", "Un u8 siempre cabe en un i32, así que basta @as", "u8 は必ず i32 に入るので @as で十分")),
    p(
      "About _ = &name; in these examples: it pretends to take the variable's address so Zig treats it as a real runtime value instead of folding it into a compile-time constant. You'll see it in questions that test runtime behavior.",
      "Sobre _ = &nombre; en estos ejemplos: finge tomar la dirección de la variable para que Zig la trate como un valor real de ejecución en vez de convertirla en constante de compilación. Lo verás en preguntas que prueban el comportamiento al ejecutar.",
      "例の _ = &名前; について：変数のアドレスを取るふりをして、Zigがコンパイル時の定数にせず実行時の値としてあつかうようにしている。実行時の動きを試す問題で出てくるぞ。",
    ),
  ),
  note("signed-division", L("Signed division: @divTrunc, @divFloor", "División con signo: @divTrunc, @divFloor", "符号つきの割り算"),
    p(
      "Dividing negative numbers has two reasonable answers. -11 / 4 is -2.75: cutting toward zero gives -2, rounding down (toward minus infinity) gives -3. Languages disagree on which one / means, which causes bugs. Zig makes you choose.",
      "Dividir números negativos tiene dos respuestas razonables. -11 / 4 es -2.75: cortar hacia cero da -2, redondear hacia abajo (hacia menos infinito) da -3. Los lenguajes no se ponen de acuerdo en cuál significa /, y eso causa bugs. Zig te hace elegir.",
      "負の数の割り算には答えが2つありうる。-11 / 4 は -2.75。0方向に切れば -2、下（マイナス無限大の方向）に丸めれば -3。/ がどちらを意味するかは言語ごとにちがい、バグのもとになる。だからZigは選ばせる。",
    ),
    ex(z`std.debug.print("{d} {d}\n", .{ @divTrunc(-11, 4), @divFloor(-11, 4) });`, "-2 -3",
      L("-2.75: toward zero, then down", "-2.75: hacia cero, luego hacia abajo", "-2.75：0方向、そして下方向")),
    p(
      "@divTrunc(a, b) drops the fraction (toward zero). @divFloor(a, b) rounds down. For positive results they agree: both give 2 for 11 / 4. They only differ when the exact answer is negative and not whole.",
      "@divTrunc(a, b) quita la fracción (hacia cero). @divFloor(a, b) redondea hacia abajo. Con resultados positivos coinciden: ambos dan 2 para 11 / 4. Solo difieren cuando la respuesta exacta es negativa y no entera.",
      "@divTrunc(a, b) は小数部を捨てる（0方向）。@divFloor(a, b) は下に丸める。結果が正なら同じで、11 / 4 はどちらも 2。答えが負で割り切れないときだけちがう。",
    ),
    ex(z`std.debug.print("{d} {d}\n", .{ @divTrunc(11, 4), @divFloor(11, 4) });`, "2 2",
      L("Positive results: both agree", "Resultados positivos: coinciden", "正の結果ならどちらも同じ")),
    p(
      "Plain / still works for unsigned integers, and for values known at compile time when the answer is exact. Common mistake: writing a / b with a runtime signed integer; that is the compile error signed integers must use @divTrunc, @divFloor, or @divExact.",
      "El / normal sigue sirviendo con enteros sin signo, y con valores conocidos al compilar cuando la respuesta es exacta. Error común: escribir a / b con un entero con signo en ejecución; es el error signed integers must use @divTrunc, @divFloor, or @divExact.",
      "ふつうの / は符号なし整数や、コンパイル時にわかって割り切れる値には使える。よくあるミス：実行時の符号つき整数に a / b と書くこと。signed integers must use @divTrunc... というエラーになる。",
    ),
    bad(z`
      var debt: i32 = -11;
      _ = &debt;
      std.debug.print("{d}\n", .{debt / 4});
    `, L("Does not compile: / on a runtime signed integer", "No compila: / con un entero con signo en ejecución", "コンパイル不可：実行時の符号つき整数に /")),
  ),
];

const loopsAndSwitchNotes: NoteDef[] = [
  note("if-expr", L("if, and conditions that are bool", "if, y condiciones que son bool", "if と bool の条件"),
    p(
      "if runs a block only when its condition is true, and else runs otherwise. The condition goes in parentheses and must be a bool: the result of a comparison like ==, !=, <, >=, or a bool variable.",
      "if ejecuta un bloque solo cuando su condición es verdadera, y else se ejecuta en otro caso. La condición va entre paréntesis y debe ser un bool: el resultado de una comparación como ==, !=, <, >=, o una variable bool.",
      "if は条件が真のときだけブロックを実行し、そうでなければ else を実行する。条件はかっこの中に書き、必ず bool：==, !=, <, >= などの比較の結果か、bool の変数じゃ。",
    ),
    p(
      "Unlike C or JavaScript, Zig has no \"truthy\" numbers: if (count) with an integer is the error expected type 'bool', found 'u32'. Write the question you actually mean: if (count != 0) or if (count > 0).",
      "A diferencia de C o JavaScript, Zig no tiene números \"verdaderos\": if (count) con un entero es el error expected type 'bool', found 'u32'. Escribe la pregunta que de verdad quieres: if (count != 0) o if (count > 0).",
      "CやJavaScriptとちがい、Zigには「真っぽい」数はない。整数で if (count) と書くと expected type 'bool', found 'u32' エラー。本当に聞きたいことを書こう：if (count != 0) や if (count > 0)。",
    ),
    bad(z`
      const keys: u32 = 3;
      if (keys) std.debug.print("open\n", .{});
    `, L("Does not compile: keys is a number, not a bool", "No compila: keys es un número, no un bool", "コンパイル不可：keys は数で bool ではない")),
    p(
      "In Zig, if is also an expression: it produces a value. const msg = if (cond) a else b; picks a when cond is true and b otherwise, like the ? : of other languages. As an expression it needs its else.",
      "En Zig, if también es una expresión: produce un valor. const msg = if (cond) a else b; elige a cuando cond es verdadera y b en otro caso, como el ? : de otros lenguajes. Como expresión necesita su else.",
      "Zigの if は式でもあり、値を生む。const msg = if (cond) a else b; は cond が真なら a、そうでなければ b を選ぶ。他の言語の ? : と同じ。式として使うなら else が必要じゃ。",
    ),
    ex(z`
      const fuel: u32 = 2;
      const status = if (fuel == 0) "empty" else "ok";
      const keys: u32 = 3;
      if (keys != 0) std.debug.print("{s} open\n", .{status});
    `, "ok open", L("An if expression, then an if with a real bool", "Una expresión if, y luego un if con un bool real", "if 式と、本物の bool を使う if")),
  ),
  note("while-loops", L("while loops and the step", "Bucles while y el paso", "while ループとステップ"),
    p(
      "while (condition) { ... } repeats its block as long as the condition is true. It checks the condition before every lap, so if it starts false the block never runs. Something inside must eventually make it false, or the loop never ends.",
      "while (condición) { ... } repite su bloque mientras la condición sea verdadera. Revisa la condición antes de cada vuelta, así que si empieza falsa el bloque nunca corre. Algo dentro debe volverla falsa en algún momento, o el bucle nunca termina.",
      "while (条件) { ... } は条件が真の間ブロックをくり返す。毎周の前に条件を調べるので、最初から偽なら一度も動かない。中の何かがいつか条件を偽にしないと、ループは終わらない。",
    ),
    p(
      "Zig adds an optional step after a colon: while (i < n) : (i += 1) { ... }. The step runs at the end of every lap, and also when continue skips the rest of a lap. That keeps the counter moving even when you skip.",
      "Zig añade un paso opcional tras dos puntos: while (i < n) : (i += 1) { ... }. El paso corre al final de cada vuelta, y también cuando continue salta el resto de una vuelta. Así el contador sigue avanzando aunque saltes.",
      "Zigではコロンのあとにステップを書ける：while (i < n) : (i += 1) { ... }。ステップは毎周の最後に動き、continue で残りを飛ばしたときも動く。だから飛ばしてもカウンタは進む。",
    ),
    ex(z`
      var j: u32 = 0;
      while (j < 6) : (j += 1) {
          if (j % 2 == 0) continue;
          std.debug.print("{d}", .{j});
      }
      std.debug.print(" end {d}\n", .{j});
    `, "135 end 6", L("continue skips the even ones; the step still runs", "continue salta los pares; el paso igual corre", "continue で偶数を飛ばしてもステップは動く")),
    p(
      "To predict a loop, trace it on paper: write the variables, check the condition, run the body, run the step, repeat. The loop stops at the first value that makes the condition false, and the variable keeps that value afterwards.",
      "Para predecir un bucle, síguelo en papel: anota las variables, revisa la condición, corre el cuerpo, corre el paso, repite. El bucle se detiene en el primer valor que vuelve falsa la condición, y la variable conserva ese valor después.",
      "ループを予想するには紙に書いて追う。変数を書き、条件を調べ、中身を実行し、ステップを実行し、くり返す。条件を偽にする最初の値で止まり、変数はそのあともその値のままじゃ。",
    ),
    ex(z`
      var m: u32 = 1;
      var product: u32 = 1;
      while (m <= 4) : (m += 1) product *= m;
      std.debug.print("{d} {d}\n", .{ product, m });
    `, "24 5", L("1*2*3*4 = 24; it stops when m becomes 5", "1*2*3*4 = 24; para cuando m llega a 5", "1*2*3*4 = 24。m が 5 で止まる")),
    p(
      "Common mistake: off-by-one. < stops BEFORE the limit and <= includes it. Ask yourself: should the last value be used? Check the first lap and the last lap, where these bugs hide.",
      "Error común: equivocarse por uno. < se detiene ANTES del límite y <= lo incluye. Pregúntate: ¿debe usarse el último valor? Revisa la primera y la última vuelta, donde se esconden estos bugs.",
      "よくあるミス：1つずれ。< は上限の手前で止まり、<= は上限もふくむ。最後の値を使うべきか考えよう。バグがひそむ最初の周と最後の周を確かめるのじゃ。",
    ),
  ),
  note("for-loops", L("for loops, captures and break", "Bucles for, capturas y break", "for ループ・キャプチャ・break"),
    p(
      "for walks over every item of an array, a string or a range. The name between bars |v| is a capture: on each lap it holds the current item. A range a..b counts from a up to b, but stops BEFORE b.",
      "for recorre cada elemento de un array, un string o un rango. El nombre entre barras |v| es una captura: en cada vuelta guarda el elemento actual. Un rango a..b cuenta desde a hasta b, pero se detiene ANTES de b.",
      "for は配列・文字列・範囲の要素を1つずつ回る。縦線の間の名前 |v| はキャプチャで、毎周いまの要素を持つ。範囲 a..b は a から数えて、b の手前で止まる。",
    ),
    ex(z`
      for (2..5) |n| std.debug.print("{d} ", .{n});
      std.debug.print("\n", .{});
    `, "2 3 4", L("2..5 gives 2, 3, 4: never 5", "2..5 da 2, 3, 4: nunca 5", "2..5 は 2, 3, 4。5 はふくまない")),
    p(
      "To get the position too, walk two things at once: for (items, 0..) |item, index|. The captures pair up in the same order as the things in parentheses. Every capture must be used; if you don't need one, write |_| instead, or it is the error unused capture.",
      "Para obtener también la posición, recorre dos cosas a la vez: for (items, 0..) |item, index|. Las capturas se emparejan en el mismo orden que lo que hay entre paréntesis. Toda captura debe usarse; si no necesitas una, escribe |_|, o es el error unused capture.",
      "位置もほしいなら2つを同時に回す：for (items, 0..) |item, index|。キャプチャはかっこの中と同じ順で対応する。キャプチャは必ず使うこと。不要なら |_| と書かないと unused capture エラーじゃ。",
    ),
    ex(z`
      const names = [_][]const u8{ "ax", "bo" };
      for (names, 0..) |name, idx| std.debug.print("{d}={s} ", .{ idx, name });
      var laps: u32 = 0;
      for (0..3) |_| laps += 1;
      std.debug.print("{d}\n", .{laps});
    `, "0=ax 1=bo 3", L("Item and index together; |_| ignores the item", "Elemento e índice juntos; |_| ignora el elemento", "要素と番号を同時に。|_| は要素を無視")),
    p(
      "Like if, a for loop can produce a value. break value; leaves the loop at once and gives that value. The else after the loop gives the value used when the loop finishes without any break, for example when nothing was found.",
      "Como if, un bucle for puede producir un valor. break valor; sale del bucle de inmediato y entrega ese valor. El else tras el bucle da el valor usado cuando el bucle termina sin ningún break, por ejemplo cuando no se encontró nada.",
      "if と同じく、for も値を生める。break 値; はすぐにループを抜けてその値を返す。ループのあとの else は、一度も break せずに終わったとき（何も見つからなかったときなど）の値じゃ。",
    ),
    ex(z`
      const depths = [_]u8{ 3, 8, 12 };
      const deep = for (depths) |d| {
          if (d > 50) break d;
      } else 99;
      std.debug.print("{d}\n", .{deep});
    `, "99", L("No item is above 50, so the else value is used", "Ningún elemento pasa de 50, así que se usa el else", "50 を超える要素がないので else の値")),
  ),
  note("switch", L("switch must cover every value", "switch debe cubrir todo valor", "switch は全部の値をカバー"),
    p(
      "switch (x) compares a value against a list of cases, each written pattern => result. It picks the first matching arm. Like if, it is an expression, so you can store what it produces in a const.",
      "switch (x) compara un valor con una lista de casos, cada uno escrito patrón => resultado. Elige el primer brazo que coincide. Como if, es una expresión, así que puedes guardar lo que produce en un const.",
      "switch (x) は値を case の並びと比べる。case は パターン => 結果 と書く。最初に合う腕を選ぶ。if と同じく式なので、結果を const にしまえる。",
    ),
    p(
      "A pattern can be one value, several values separated by commas (6, 7), or a range with three dots: 10...24. Careful: the switch range ... INCLUDES both ends, while the for range .. stops before the end.",
      "Un patrón puede ser un valor, varios valores separados por comas (6, 7) o un rango con tres puntos: 10...24. Cuidado: el rango de switch ... INCLUYE ambos extremos, mientras que el rango de for .. se detiene antes del final.",
      "パターンは1つの値、カンマで区切った複数の値（6, 7）、または点3つの範囲 10...24。注意：switch の ... は両端をふくむが、for の .. は終わりの手前で止まる。",
    ),
    ex(z`
      const temp: u8 = 24;
      const feel: []const u8 = switch (temp) {
          0...9 => "cold",
          10...24 => "mild",
          else => "hot",
      };
      std.debug.print("{s}\n", .{feel});
    `, "mild", L("24 is inside 10...24: both ends count", "24 está dentro de 10...24: cuentan ambos extremos", "24 は 10...24 に入る。両端をふくむ")),
    p(
      "A Zig switch must be exhaustive: every possible value of the type needs an arm, or it is the error switch must handle all possibilities. A u8 can be anything from 0 to 255, so listing a few ranges is not enough. else => ... catches every value you didn't list.",
      "Un switch de Zig debe ser exhaustivo: cada valor posible del tipo necesita un brazo, o es el error switch must handle all possibilities. Un u8 puede ser cualquier cosa de 0 a 255, así que listar algunos rangos no basta. else => ... atrapa todo valor que no listaste.",
      "Zigの switch はもれなく書く必要がある。型のどの値にも腕がないと switch must handle all possibilities エラー。u8 は 0〜255 のどれでもありうるので、範囲をいくつか書くだけでは足りない。else => ... が残り全部を受けとめる。",
    ),
    bad(z`
      var level: u8 = 3;
      _ = &level;
      const tag: u8 = switch (level) {
          0...200 => 'n',
      };
      _ = tag;
    `, L("Does not compile: 201..255 have no arm", "No compila: 201..255 no tienen brazo", "コンパイル不可：201..255 の腕がない")),
  ),
];

const arraysAndStringsNotes: NoteDef[] = [
  note("arrays", L("Arrays are values", "Los arrays son valores", "配列は値"),
    p(
      "An array is a fixed number of items of one type, side by side. [4]u16 is four u16 values. Writing [_]u16{ ... } lets Zig count the items for you. .len gives the count, and items are numbered from 0, so the last one is at len - 1.",
      "Un array es una cantidad fija de elementos de un tipo, uno al lado del otro. [4]u16 son cuatro valores u16. Escribir [_]u16{ ... } deja que Zig cuente los elementos. .len da la cantidad, y se numeran desde 0, así que el último está en len - 1.",
      "配列は同じ型の要素が決まった数だけ並んだもの。[4]u16 は u16 が4つ。[_]u16{ ... } と書けばZigが数えてくれる。.len が個数で、番号は 0 から。最後の要素は len - 1 じゃ。",
    ),
    ex(z`
      const slots = [_]u16{ 5, 10, 15, 20 };
      std.debug.print("{d} {d} {d}\n", .{ slots.len, slots[0], slots[3] });
    `, "4 5 20", L("Four items: first at 0, last at 3", "Cuatro elementos: el primero en 0, el último en 3", "4つの要素：最初は 0、最後は 3")),
    p(
      "In Zig an array is a value, like a number. var copy = original; copies every item into a new array. Changing the copy never touches the original. (A slice, which you'll meet with strings, is different: it is a view into memory that already exists.)",
      "En Zig un array es un valor, como un número. var copy = original; copia cada elemento a un array nuevo. Cambiar la copia nunca toca el original. (Un slice, que verás con los strings, es distinto: es una vista de memoria que ya existe.)",
      "Zigでは配列は数と同じく値。var copy = original; は全要素を新しい配列にコピーする。コピーを変えても元は変わらない。（文字列で出てくるスライスはちがい、すでにあるメモリをのぞく窓じゃ）",
    ),
    ex(z`
      const base = [_]u8{ 7, 7, 7 };
      var copy = base;
      copy[2] = 1;
      std.debug.print("{any} {any}\n", .{ base, copy });
    `, "{ 7, 7, 7 } { 7, 7, 1 }", L("The copy changes, the original does not", "La copia cambia, el original no", "コピーは変わり、元はそのまま")),
    p(
      "To print a whole array use {any}; Zig shows it as { a, b, c }. {d} means \"one number\", so passing an array to {d} is a compile error: invalid format string 'd' for type. Use {d} for single items like slots[0].",
      "Para imprimir un array entero usa {any}; Zig lo muestra como { a, b, c }. {d} significa \"un número\", así que pasar un array a {d} es error de compilación: invalid format string 'd' for type. Usa {d} para elementos sueltos como slots[0].",
      "配列まるごとを表示するなら {any}。Zigは { a, b, c } の形で見せる。{d} は「数1つ」なので、配列を {d} に渡すと invalid format string 'd' for type エラー。slots[0] のような1つの要素に {d} を使おう。",
    ),
    bad(z`
      const pair = [_]u16{ 8, 9 };
      std.debug.print("{d}\n", .{pair});
    `, L("Does not compile: {d} can't show a whole array", "No compila: {d} no muestra un array entero", "コンパイル不可：{d} で配列まるごとは無理")),
  ),
  note("strings-bytes", L("Strings are bytes: []const u8", "Los strings son bytes: []const u8", "文字列はバイト：[]const u8"),
    p(
      "Zig has no special string type. Text is a sequence of bytes, and its usual type is []const u8: a slice (a view) of u8 bytes that you can read but not change. A literal like \"moon\" is stored in the program, and the slice points at it.",
      "Zig no tiene un tipo string especial. El texto es una secuencia de bytes, y su tipo usual es []const u8: un slice (una vista) de bytes u8 que puedes leer pero no cambiar. Un literal como \"moon\" se guarda en el programa, y el slice apunta a él.",
      "Zigには特別な文字列型がない。文字列はバイトの並びで、ふつうの型は []const u8：読めるが変えられない u8 バイトのスライス（窓）じゃ。\"moon\" のようなリテラルはプログラムの中にしまわれ、スライスがそこを指す。",
    ),
    ex(z`
      const word: []const u8 = "moon";
      std.debug.print("{c}{c} {d}\n", .{ word[0], word[3], word.len });
    `, "mn 4", L("Index gives one byte; .len counts bytes", "El índice da un byte; .len cuenta bytes", "番号で1バイト、.len はバイト数")),
    p(
      ".len counts BYTES, not letters. Text is stored as UTF-8, where English letters take 1 byte but letters like ñ, é or Japanese characters take 2 to 4. So the length of a word with accents is bigger than its number of letters.",
      ".len cuenta BYTES, no letras. El texto se guarda en UTF-8, donde las letras inglesas ocupan 1 byte pero letras como ñ, é o los caracteres japoneses ocupan de 2 a 4. Así que el largo de una palabra con acentos es mayor que su número de letras.",
      ".len は文字数ではなくバイト数。文字列はUTF-8で保存され、英字は1バイトだが ñ や é、日本語の文字は2〜4バイト。だからアクセントのある単語の長さは文字数より大きくなる。",
    ),
    ex(z`
      const s = "año";
      std.debug.print("{d}\n", .{s.len});
    `, "4", L("3 letters, but ñ takes 2 bytes", "3 letras, pero ñ ocupa 2 bytes", "3文字だが ñ は2バイト")),
    p(
      "A character in single quotes, like 'A', is just a number: the byte code of that letter (65 for 'A'). That is why you can compare a byte from a string with == 'x', and why for over a string gives one byte per lap.",
      "Un carácter entre comillas simples, como 'A', es solo un número: el código de byte de esa letra (65 para 'A'). Por eso puedes comparar un byte de un string con == 'x', y por eso for sobre un string da un byte por vuelta.",
      "'A' のように一重引用符の文字はただの数で、その文字のバイトコード（'A' は 65）。だから文字列のバイトを == 'x' で比べられるし、文字列を for で回ると1周に1バイトずつ出てくる。",
    ),
    ex(z`
      var ls: u8 = 0;
      for ("balloon") |ch| {
          if (ch == 'l') ls += 1;
      }
      std.debug.print("{d} {d}\n", .{ 'A', ls });
    `, "65 2", L("'A' is the number 65; for walks byte by byte", "'A' es el número 65; for va byte a byte", "'A' は数 65。for は1バイトずつ")),
  ),
  note("string-compare", L("Comparing and joining strings", "Comparar y unir strings", "文字列の比較と連結"),
    p(
      "Because a string is a slice, a view into memory, == can't compare two strings: operator == not allowed for type '[]const u8'. Two views could point to different places holding the same letters, so \"equal\" is ambiguous, and Zig refuses to guess.",
      "Como un string es un slice, una vista de memoria, == no puede comparar dos strings: operator == not allowed for type '[]const u8'. Dos vistas pueden apuntar a lugares distintos con las mismas letras, así que \"igual\" es ambiguo, y Zig se niega a adivinar.",
      "文字列はスライス（メモリの窓）なので、== で2つの文字列は比べられない：operator == not allowed for type '[]const u8'。同じ文字を持つ別の場所を指すこともあり「等しい」があいまいだから、Zigは推測しない。",
    ),
    bad(z`
      const a: []const u8 = "key";
      const b: []const u8 = "key";
      if (a == b) std.debug.print("same\n", .{});
    `, L("Does not compile: no == for slices", "No compila: no hay == para slices", "コンパイル不可：スライスに == はない")),
    p(
      "To compare contents, use std.mem.eql(u8, a, b). The u8 says what kind of items to compare; then it checks that both have the same length and the same byte at every position. It returns a bool you can print with {} or use in an if.",
      "Para comparar el contenido, usa std.mem.eql(u8, a, b). El u8 dice qué tipo de elementos comparar; luego revisa que ambos tengan el mismo largo y el mismo byte en cada posición. Devuelve un bool que puedes imprimir con {} o usar en un if.",
      "中身を比べるには std.mem.eql(u8, a, b)。u8 は比べる要素の型。両方の長さが同じで、どの位置のバイトも同じかを調べ、bool を返す。{} で表示したり if で使ったりできる。",
    ),
    ex(z`
      const door: []const u8 = "north";
      std.debug.print("{} {}\n", .{ std.mem.eql(u8, door, "north"), std.mem.eql(u8, door, "nort") });
    `, "true false", L("Same bytes, then a different length", "Mismos bytes, luego un largo distinto", "同じバイト列、次に長さちがい")),
    p(
      "Literals known at compile time can be joined with ++ and repeated with **. \"tic\" ++ \"-tac\" is \"tic-tac\" and \"=\" ** 5 is \"=====\". These work only while compiling; joining text at runtime needs memory, which you'll meet later.",
      "Los literales conocidos al compilar se unen con ++ y se repiten con **. \"tic\" ++ \"-tac\" es \"tic-tac\" y \"=\" ** 5 es \"=====\". Funcionan solo al compilar; unir texto al ejecutar necesita memoria, que verás más adelante.",
      "コンパイル時にわかるリテラルは ++ で連結、** でくり返しできる。\"tic\" ++ \"-tac\" は \"tic-tac\"、\"=\" ** 5 は \"=====\"。コンパイル時だけの機能で、実行時の連結にはメモリが要る（あとで学ぶ）。",
    ),
    ex(z`std.debug.print("{s} {s}\n", .{ "tic" ++ "-tac", "=" ** 5 });`, "tic-tac =====",
      L("++ joins, ** repeats", "++ une, ** repite", "++ は連結、** はくり返し")),
  ),
  note("bounds", L("Staying inside the bounds", "Quedarse dentro de los límites", "範囲の内側にとどまる"),
    p(
      "Items are numbered from 0 to len - 1. Index len or more is past the end. Zig never lets you silently read memory that isn't part of the array: if the index is a constant, the program doesn't compile (index 2 outside array of length 2).",
      "Los elementos van de 0 a len - 1. El índice len o mayor está fuera. Zig nunca te deja leer en silencio memoria que no es del array: si el índice es constante, el programa no compila (index 2 outside array of length 2).",
      "要素の番号は 0 から len - 1。len 以上ははみ出し。Zigは配列の外のメモリをだまって読ませない。番号が定数ならコンパイルできない（index 2 outside array of length 2）。",
    ),
    bad(z`
      const row = [_]u8{ 4, 4 };
      std.debug.print("{d}\n", .{row[2]});
    `, L("Does not compile: index 2 of a 2-item array", "No compila: índice 2 de un array de 2", "コンパイル不可：2要素の配列の番号 2")),
    p(
      "If the index is only known at runtime, Debug builds check it when that line runs and stop with panic: index out of bounds: index 2, len 2. A crash with a clear message is far better than a wrong value that spreads through the program.",
      "Si el índice solo se conoce al ejecutar, Debug lo revisa cuando corre esa línea y se detiene con panic: index out of bounds: index 2, len 2. Un fallo con mensaje claro es mucho mejor que un valor erróneo que se esparce por el programa.",
      "番号が実行時にしかわからないなら、Debugビルドはその行で検査し panic: index out of bounds: index 2, len 2 で止まる。まちがった値がプログラム中に広がるより、はっきりしたメッセージで止まるほうがずっといい。",
    ),
    boom(z`
      const row = [_]u8{ 4, 4 };
      var at: usize = 2;
      _ = &at;
      std.debug.print("{d}\n", .{row[at]});
    `, "index out of bounds", L("Panics: at is known only at runtime", "Hace panic: at se conoce solo al ejecutar", "panic：at は実行時にしかわからない")),
    p(
      "Rule to remember: a loop over indexes uses i < len, never i <= len. Even safer, walk the items directly with for (items) |v|, which can't go past the end.",
      "Regla para recordar: un bucle sobre índices usa i < len, nunca i <= len. Más seguro aún, recorre los elementos directamente con for (items) |v|, que no puede pasarse del final.",
      "覚えるルール：番号で回すループは i < len。i <= len は使わない。もっと安全なのは for (items) |v| で要素を直接回すこと。終わりを越えようがない。",
    ),
    ex(z`
      const row = [_]u8{ 4, 5, 6 };
      for (row) |v| std.debug.print("{d}", .{v});
      std.debug.print("\n", .{});
    `, "456", L("for never leaves the array", "for nunca sale del array", "for は配列の外に出ない")),
  ),
];

const bossNotes: NoteDef[] = [
  note("recap-integers", L("Recap: integers at the edge", "Repaso: enteros en el borde", "復習：整数の端"),
    p(
      "Each integer type has a range: u8 is 0..255, i8 is -128..127. A plain +, -, * that leaves the range panics with integer overflow in Debug. +% and friends wrap around (add or subtract 256 for a u8), +| and friends stick at the edge.",
      "Cada tipo entero tiene un rango: u8 es 0..255, i8 es -128..127. Un +, -, * normal que sale del rango hace panic con integer overflow en Debug. +% y compañía dan la vuelta (suman o restan 256 en un u8), +| y compañía se quedan en el borde.",
      "整数型には範囲がある。u8 は 0..255、i8 は -128..127。範囲を出るふつうの + - * はDebugで integer overflow の panic。+% などは一周し（u8 なら 256 をたすか引く）、+| などは端で止まる。",
    ),
    ex(z`
      var t: u8 = 3;
      t -%= 5;
      std.debug.print("{d} {d} {d}\n", .{ t, @as(u8, 10) -| 20, @as(i8, 120) +| 20 });
    `, "254 0 127", L("Wrap below zero; saturate at 0 and at 127", "Vuelta bajo cero; saturar en 0 y en 127", "0 の下で一周、0 と 127 で飽和")),
    p(
      "Shrinking a value: @truncate keeps the low bits (for a u8, the remainder after dividing by 256) and never fails; @intCast checks that the value fits, and a value known not to fit is rejected by the compiler.",
      "Achicar un valor: @truncate guarda los bits bajos (para un u8, el resto de dividir entre 256) y nunca falla; @intCast revisa que el valor quepa, y un valor que se sabe que no cabe es rechazado por el compilador.",
      "値を縮める：@truncate は下位ビットを残し（u8 なら 256 で割った余り）失敗しない。@intCast は入るかを検査し、入らないとわかっている値はコンパイラが拒否する。",
    ),
    p(
      "Signed division: @divTrunc cuts the fraction toward zero, @divFloor rounds down. They differ only for negative answers that aren't whole.",
      "División con signo: @divTrunc corta la fracción hacia cero, @divFloor redondea hacia abajo. Solo difieren con respuestas negativas no enteras.",
      "符号つきの割り算：@divTrunc は0方向に切り、@divFloor は下に丸める。ちがうのは答えが負で割り切れないときだけ。",
    ),
    ex(z`std.debug.print("{d} {d}\n", .{ @divTrunc(-5, 2), @divFloor(-5, 2) });`, "-2 -3",
      L("-2.5 toward zero, then down", "-2.5 hacia cero, luego abajo", "-2.5 を0方向、そして下へ")),
  ),
  note("recap-mutability", L("Recap: const, var and unused", "Repaso: const, var y sin usar", "復習：const・var・未使用"),
    p(
      "Zig wants every name to tell the truth. A value that never changes must be const; a var that no line ever changes is the error local variable is never mutated. A name that is never used at all is also an error.",
      "Zig quiere que cada nombre diga la verdad. Un valor que nunca cambia debe ser const; una var que ninguna línea cambia es el error local variable is never mutated. Un nombre que nunca se usa también es error.",
      "Zigはどの名前にも本当のことを言わせたい。変わらない値は const。どの行も変えない var は local variable is never mutated エラー。まったく使わない名前もエラーじゃ。",
    ),
    bad(z`
      var shield: u8 = 2;
      std.debug.print("{d}\n", .{shield});
    `, L("Does not compile: shield never changes", "No compila: shield nunca cambia", "コンパイル不可：shield は変わらない")),
    p(
      "Check each var: is there a line like name = ..., name += ... or name -= ...? If not, it should be const.",
      "Revisa cada var: ¿hay una línea como nombre = ..., nombre += ... o nombre -= ...? Si no, debería ser const.",
      "var を1つずつ確かめよう。名前 = … や 名前 += …、名前 -= … の行はある？なければ const にすべきじゃ。",
    ),
    ex(z`
      const shield: u8 = 2;
      var armor: u8 = 1;
      armor += shield;
      std.debug.print("{d}\n", .{armor});
    `, "3", L("armor really changes, so it is var", "armor de verdad cambia, así que es var", "armor は本当に変わるので var")),
  ),
  note("recap-control", L("Recap: switch and for", "Repaso: switch y for", "復習：switch と for"),
    p(
      "A switch arm with a range a...b matches both ends, and else catches everything not listed; the switch must cover every value of its type. The first arm that matches is the one used.",
      "Un brazo de switch con rango a...b coincide con ambos extremos, y else atrapa todo lo no listado; el switch debe cubrir todo valor de su tipo. Se usa el primer brazo que coincide.",
      "switch の範囲 a...b は両端をふくみ、else は書いていない残り全部を受けとめる。switch は型の全部の値をカバーしなければならない。最初に合った腕が使われる。",
    ),
    ex(z`
      const n: u8 = 50;
      const half: []const u8 = switch (n) {
          0...50 => "low",
          else => "high",
      };
      std.debug.print("{s}\n", .{half});
    `, "low", L("50 is the last value of 0...50", "50 es el último valor de 0...50", "50 は 0...50 の最後の値")),
    p(
      "for (items, 0..) |v, i| walks the items and their positions together, starting at index 0. To predict the result, write a small table: each lap's v, i and the running total.",
      "for (items, 0..) |v, i| recorre los elementos y sus posiciones juntos, empezando en el índice 0. Para predecir el resultado, haz una tablita: v, i y el total acumulado de cada vuelta.",
      "for (items, 0..) |v, i| は要素と位置を同時に回し、番号は 0 から始まる。結果を予想するには、毎周の v・i・合計の小さな表を書こう。",
    ),
    ex(z`
      var total: usize = 0;
      for ([_]usize{ 2, 3 }, 0..) |v, i| total += v + i;
      std.debug.print("{d}\n", .{total});
    `, "6", L("(2 + 0) + (3 + 1) = 6", "(2 + 0) + (3 + 1) = 6", "(2 + 0) + (3 + 1) = 6")),
  ),
  note("recap-bytes", L("Recap: arrays, strings, bounds", "Repaso: arrays, strings, límites", "復習：配列・文字列・範囲"),
    p(
      "Arrays are values: assigning one copies every item, so changing the copy leaves the original alone. Strings are []const u8 slices: compare them with std.mem.eql(u8, a, b), never with ==.",
      "Los arrays son valores: asignar uno copia cada elemento, así que cambiar la copia no toca el original. Los strings son slices []const u8: compáralos con std.mem.eql(u8, a, b), nunca con ==.",
      "配列は値。代入すると全要素がコピーされ、コピーを変えても元はそのまま。文字列は []const u8 のスライスで、比べるのは std.mem.eql(u8, a, b)。== は使えない。",
    ),
    ex(z`
      const tag: []const u8 = "iron";
      std.debug.print("{}\n", .{std.mem.eql(u8, tag, "iron")});
    `, "true", L("Comparing contents, byte by byte", "Comparar contenidos, byte a byte", "中身を1バイトずつ比べる")),
    p(
      "Valid indexes go from 0 to len - 1. A constant index past the end doesn't compile; a runtime one panics with index out of bounds.",
      "Los índices válidos van de 0 a len - 1. Un índice constante fuera del final no compila; uno en ejecución hace panic con index out of bounds.",
      "有効な番号は 0 から len - 1。終わりを越える定数の番号はコンパイルできず、実行時の番号なら index out of bounds で panic する。",
    ),
    boom(z`
      const ore: []const u8 = "tin";
      var at: usize = 4;
      _ = &at;
      std.debug.print("{c}\n", .{ore[at]});
    `, "index out of bounds", L("Panics: \"tin\" has indexes 0 to 2", "Hace panic: \"tin\" tiene índices 0 a 2", "panic：\"tin\" の番号は 0〜2")),
  ),
];

// ─── 1.1 Stone tags and chalk tags ─────────────────────────────────────────
const constAndVar: LessonDef = {
  slug: "const-and-var",
  title: L("Stone and chalk tags", "Etiquetas de piedra y tiza", "石のラベルとチョーク"),
  concept: "basics",
  mode: "lesson",
  xp: 60,
  enemy: "zig/leak-jelly",
  enemyName: L("UNUSED JELLY", "MEDUSA SIN USO", "ムダづかいクラゲ"),
  notes: constAndVarNotes,
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
      hint: L("Only one of the two names is var. Apply the += to it, then fill the {d} slots in order.", "Solo uno de los dos nombres es var. Aplícale el +=, luego llena los huecos {d} en orden.", "var は片方だけ。そちらに += を当てはめ、{d} に順に値を入れよう。"),
      note: "const-var",
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
      hint: L("Look at how x was declared. Can a name carved in stone be written again?", "Mira cómo se declaró x. ¿Se puede reescribir un nombre tallado en piedra?", "x の宣言を見よう。石に刻んだ名前は書きなおせる？"),
      note: "const-var",
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
      hint: L("Zig is strict both ways. Is there any line that changes x after it is created?", "Zig es estricto en ambos sentidos. ¿Hay alguna línea que cambie x después de crearla?", "Zigは両方向にきびしい。作ったあと x を変える行はある？"),
      note: "const-var",
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
      hint: L("After x is created, does any line ever read it?", "Después de crear x, ¿alguna línea la lee?", "x を作ったあと、それを読む行はある？"),
      note: "unused-discard",
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
      hint: L("What does the line with the underscore tell the compiler about x?", "¿Qué le dice al compilador la línea con el guion bajo sobre x?", "アンダースコアの行は x についてコンパイラに何を伝えている？"),
      note: "unused-discard",
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
      hint: L("Iggi just showed the symbol that throws a value away on purpose.", "Iggi acaba de mostrar el símbolo que tira un valor a propósito.", "値をわざと捨てる記号は、イギがさっき見せたよ。"),
      note: "unused-discard",
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
      hint: L("What type does a bare literal like 5 get, and can that type live in a var at runtime?", "¿Qué tipo recibe un literal suelto como 5, y puede ese tipo vivir en una var al ejecutar?", "5 のような数だけの値の型は？その型は実行時の var に置ける？"),
      note: "comptime-int",
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
      hint: L("Each slot takes the next value of the tuple, in order: {s} shows text, {d} a number.", "Cada hueco toma el siguiente valor de la tupla, en orden: {s} muestra texto, {d} un número.", "穴にはタプルの値が順に入る。{s} は文字列、{d} は数。"),
      note: "debug-print",
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
      hint: L("Count the slots in the text, then count the values in the tuple.", "Cuenta los huecos del texto y luego los valores de la tupla.", "テキストの穴の数と、タプルの値の数を数えよう。"),
      note: "debug-print",
      prompt: COMPILES,
      code: z`std.debug.print("{d} {d}\n", .{1});`,
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("Two {d} slots but only one value: too few arguments. Zig checks the format at compile time.", "Dos huecos {d} pero un solo valor: too few arguments. Zig revisa el formato al compilar.", "{d} が2つなのに値は1つ：too few arguments。書式はコンパイル時に検査される。"),
    },
    {
      kind: "pick",
      hint: L("Look for a line that changes hp after it is created.", "Busca una línea que cambie hp después de crearla.", "hp を作ったあとに変える行を探そう。"),
      note: "const-var",
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
      hint: L("Look at the line that uses the potion: does it replace hp or add to it?", "Mira la línea que usa la poción: ¿reemplaza hp o le suma?", "potion を使う行を見よう。hp を置きかえる？たす？"),
      note: "const-var",
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
  notes: integerWidthsNotes,
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
      hint: L("8 bits give 256 values. Unsigned starts at 0; signed splits them around 0.", "8 bits dan 256 valores. Sin signo empieza en 0; con signo los reparte alrededor del 0.", "8ビットで256通り。符号なしは0から、符号つきは0をはさんで半分ずつ。"),
      note: "int-widths",
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
      hint: L("Does every u8 value fit in a u16? Then ask what type y was declared with.", "¿Cabe todo valor u8 en un u16? Luego pregúntate con qué tipo se declaró y.", "u8 の値は全部 u16 に入る？そして y はどの型で宣言された？"),
      note: "int-widths",
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
      hint: L("This goes to a NARROWER type with a runtime value. Is that ever automatic?", "Esto pasa a un tipo MÁS ANGOSTO con un valor de ejecución. ¿Eso es automático alguna vez?", "実行時の値をより狭い型へ。それは自動でできる？"),
      note: "casts",
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
      hint: L("The value is known while compiling. Compare it with the largest u8.", "El valor se conoce al compilar. Compáralo con el u8 más grande.", "値はコンパイル時にわかる。u8 の最大値と比べよう。"),
      note: "casts",
      prompt: COMPILES,
      code: "const s: u8 = 300;\n_ = s;",
      options: [YES, NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("300 is known at compile time and doesn't fit: type 'u8' cannot represent integer value '300'.", "300 se conoce al compilar y no cabe: type 'u8' cannot represent integer value '300'.", "300 はコンパイル時にわかり、入らない：type 'u8' cannot represent integer value '300'。"),
    },
    {
      kind: "predict",
      hint: L("What is the smallest value a u8 can hold? Plain - is checked in Debug builds.", "¿Cuál es el valor más chico que guarda un u8? El - normal se revisa en Debug.", "u8 の最小値は？ふつうの - はDebugで検査される。"),
      note: "overflow-ops",
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
      hint: L("% wraps around like an odometer; | sticks at the edge. Apply each to 250 + 10.", "% da la vuelta como un cuentakilómetros; | se queda en el borde. Aplica cada uno a 250 + 10.", "% はメーターのように一周、| は端で止まる。250 + 10 にそれぞれ当てはめよう。"),
      note: "overflow-ops",
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
      hint: L("How many values fit in 3 bits? Wrapping past the top starts again at the bottom.", "¿Cuántos valores caben en 3 bits? Dar la vuelta tras el tope empieza otra vez abajo.", "3ビットに入る値はいくつ？上限を越えて一周すると一番下から。"),
      note: "overflow-ops",
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
      hint: L("An odometer rolls past the top back to small numbers. Which operator family does that?", "Un cuentakilómetros pasa el tope y vuelve a números chicos. ¿Qué familia de operadores hace eso?", "メーターは上限を越えると小さい数に戻る。それをする演算子は？"),
      note: "overflow-ops",
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
      hint: L("Does 300 fit in a u8? Remember what @intCast checks while the program runs.", "¿Cabe 300 en un u8? Recuerda qué revisa @intCast mientras corre el programa.", "300 は u8 に入る？@intCast が実行時に何を検査するか思い出そう。"),
      note: "casts",
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
      hint: L("@truncate keeps only the low 8 bits: the remainder after dividing by 256.", "@truncate guarda solo los 8 bits bajos: el resto de dividir entre 256.", "@truncate は下位8ビットだけ残す。256 で割った余りじゃ。"),
      note: "casts",
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
      hint: L("One side is signed, the other unsigned. Can either type hold every value of the other?", "Un lado tiene signo y el otro no. ¿Puede alguno guardar todo valor del otro?", "片方は符号つき、もう片方は符号なし。どちらかが相手の値を全部持てる？"),
      note: "casts",
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
      hint: L("a is a signed value known only at runtime. Which rounding should / pick for negatives?", "a es un valor con signo que solo se conoce al ejecutar. ¿Qué redondeo usaría / con negativos?", "a は実行時の符号つきの値。負の数のとき / はどちらに丸める？"),
      note: "signed-division",
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
      hint: L("-7 / 2 is -3.5. Trunc cuts toward zero; floor rounds toward minus infinity.", "-7 / 2 es -3.5. Trunc corta hacia cero; floor redondea hacia menos infinito.", "-7 / 2 は -3.5。Trunc は0方向、Floor はマイナス方向に丸める。"),
      note: "signed-division",
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
      hint: L("200 + 100 is more than the largest u8. Is coins' box big enough for the total?", "200 + 100 supera al u8 más grande. ¿Es la caja de coins lo bastante grande para el total?", "200 + 100 は u8 の最大値を超える。coins の箱は合計に足りる？"),
      note: "int-widths",
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
  notes: loopsAndSwitchNotes,
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
      hint: L("Evaluate the condition first, then take the matching branch of the if.", "Evalúa primero la condición y luego toma la rama del if que corresponde.", "まず条件を計算し、合うほうの if の枝を選ぼう。"),
      note: "if-expr",
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
      hint: L("What type must an if condition be in Zig? What type is x?", "¿De qué tipo debe ser una condición de if en Zig? ¿De qué tipo es x?", "Zigの if の条件はどの型？x の型は？"),
      note: "if-expr",
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
      hint: L("Trace each lap on paper. continue skips the rest, but the step after the colon still runs.", "Sigue cada vuelta en papel. continue salta el resto, pero el paso tras los dos puntos igual corre.", "毎周を紙で追おう。continue で残りを飛ばしてもコロンのあとのステップは動く。"),
      note: "while-loops",
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
      hint: L("List the values of n, multiplying by 3, until the condition fails. That last value stays.", "Anota los valores de n, multiplicando por 3, hasta que falle la condición. Ese último valor queda.", "n を3倍しながら書き出し、条件が偽になるまで。その最後の値が残る。"),
      note: "while-loops",
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
      hint: L("Does a range a..b include its end value b?", "¿Un rango a..b incluye su valor final b?", "範囲 a..b は終わりの b をふくむ？"),
      note: "for-loops",
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
      hint: L("v and i advance together, i starting at 0. Check which one the format prints first.", "v e i avanzan juntos, i empieza en 0. Revisa cuál imprime primero el formato.", "v と i は一緒に進み、i は0から。書式でどちらが先か確かめよう。"),
      note: "for-loops",
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
      hint: L("Every name you create must be used, including the ones between bars.", "Todo nombre que creas debe usarse, incluidos los que van entre barras.", "作った名前は必ず使うこと。縦線の間の名前もふくめて。"),
      note: "for-loops",
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
      hint: L("Walk the items in order: break leaves at the first match. else runs only if no break.", "Recorre los elementos en orden: break sale en la primera coincidencia. else solo si no hay break.", "要素を順に見よう。break は最初に合ったところで抜ける。else は break なしの時だけ。"),
      note: "for-loops",
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
      hint: L("Find the arm whose range contains the value. Ranges with ... include both ends.", "Busca el brazo cuyo rango contiene el valor. Los rangos con ... incluyen ambos extremos.", "値をふくむ範囲の腕を探そう。... の範囲は両端をふくむ。"),
      note: "switch",
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
      hint: L("A u8 can be anything from 0 to 255. Does some arm handle every one of those values?", "Un u8 puede ser cualquier cosa de 0 a 255. ¿Algún brazo maneja cada uno de esos valores?", "u8 は 0〜255 のどれでもありうる。全部の値をどれかの腕が受けとめている？"),
      note: "switch",
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
      hint: L("You need the arm that catches every value not listed above it.", "Necesitas el brazo que atrapa todo valor no listado arriba.", "上に書いていない値を全部受けとめる腕が必要じゃ。"),
      note: "switch",
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
      hint: L("Trace the last lap: is 5 added before the loop stops? Check the comparison.", "Sigue la última vuelta: ¿se suma el 5 antes de que pare el bucle? Revisa la comparación.", "最後の周を追おう。止まる前に 5 はたされる？比較を確かめよう。"),
      note: "while-loops",
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
  notes: arraysAndStringsNotes,
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
      hint: L("In Zig, does var b = a share the same chest or make a full copy?", "En Zig, ¿var b = a comparte el mismo cofre o hace una copia completa?", "Zigでは var b = a は同じ箱を共有する？まるごとコピーする？"),
      note: "arrays",
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
      hint: L("{any} prints arrays in Zig's own style, not like JavaScript or Python lists.", "{any} imprime arrays al estilo propio de Zig, no como las listas de JavaScript o Python.", "{any} はZig独自の形で配列を表示する。JSやPythonのリストとはちがう。"),
      note: "arrays",
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
      hint: L("{d} means one number. Is xs one number?", "{d} significa un número. ¿xs es un número?", "{d} は数1つという意味。xs は数1つ？"),
      note: "arrays",
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
      hint: L("Does .len count letters or bytes? How many bytes does é take in UTF-8?", "¿.len cuenta letras o bytes? ¿Cuántos bytes ocupa é en UTF-8?", ".len は文字数？バイト数？UTF-8 で é は何バイト？"),
      note: "strings-bytes",
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
      hint: L("Read the type written after word's colon. Zig has no separate string type.", "Lee el tipo escrito tras los dos puntos de word. Zig no tiene un tipo string aparte.", "word のコロンのあとの型を読もう。Zigには別の文字列型はない。"),
      note: "strings-bytes",
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
      hint: L("for gives one byte per lap. Count how many bytes equal 'a'.", "for da un byte por vuelta. Cuenta cuántos bytes son iguales a 'a'.", "for は1周に1バイト。'a' に等しいバイトを数えよう。"),
      note: "strings-bytes",
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
      hint: L("A []const u8 is a view into memory. Which operators does Zig allow on views?", "Un []const u8 es una vista de memoria. ¿Qué operadores permite Zig con vistas?", "[]const u8 はメモリの窓。Zigは窓にどの演算子を許す？"),
      note: "string-compare",
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
      hint: L("eql checks the length and every byte. Compare each pair separately.", "eql revisa el largo y cada byte. Compara cada par por separado.", "eql は長さと全バイトを調べる。1組ずつ比べよう。"),
      note: "string-compare",
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
      hint: L("Iggi named this std.mem function in the dialog just before these questions.", "Iggi nombró esta función de std.mem en el diálogo justo antes de estas preguntas.", "この std.mem の関数は、直前の会話でイギが言っていたよ。"),
      note: "string-compare",
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
      hint: L("Both work on literals while compiling: one joins, the other repeats.", "Ambos funcionan con literales al compilar: uno une, el otro repite.", "どちらもコンパイル時のリテラル用。片方は連結、もう片方はくり返し。"),
      note: "string-compare",
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
      hint: L("The index is a constant. How many slots does xs have, and what is the last index?", "El índice es constante. ¿Cuántos huecos tiene xs y cuál es el último índice?", "番号は定数。xs のマスはいくつで、最後の番号は？"),
      note: "bounds",
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
      hint: L("This time the index is only known when the program runs. What does Debug do then?", "Esta vez el índice solo se conoce al ejecutar. ¿Qué hace Debug entonces?", "今回は番号が実行時にしかわからない。そのときDebugはどうする？"),
      note: "bounds",
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
      hint: L("Valid indexes go from 0 to len - 1. Check the loop condition on the last lap.", "Los índices válidos van de 0 a len - 1. Revisa la condición del bucle en la última vuelta.", "有効な番号は 0〜len-1。最後の周のループ条件を確かめよう。"),
      note: "bounds",
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
  notes: bossNotes,
  beats: [
    enemySays(L(
      "CRACKLE! I am the Overflow Spark. I live past the top of every chip. Count wrong once and I burst free!",
      "¡CRAC! Soy la Chispa del Desborde. Vivo más allá del tope de cada ficha. ¡Cuenta mal una vez y me libero!",
      "パチパチ！我はオーバーフロー火花。チップの上限の先に住む。数えまちがえたら飛び出すぞ！",
    )),
    {
      kind: "predict", time: 15, prompt: PRINT,
      hint: L("| means saturate: each result sticks at the edge of its type.", "| significa saturar: cada resultado se queda en el borde de su tipo.", "| は飽和。結果はそれぞれ型の端で止まる。"),
      note: "recap-integers",
      code: z`std.debug.print("{d} {d}\n", .{ @as(u8, 200) +| 100, @as(i8, -100) -| 100 });`,
      options: ["255 -128", "300 -200", "44 56"],
      answer: 0, output: "255 -128",
      check: { compiles: true, stdout: "255 -128" },
      explain: L("Saturating ops stick at the edges: u8 tops at 255, i8 bottoms at -128.", "Las operaciones saturadas se quedan en los bordes: u8 tope 255, i8 piso -128.", "飽和演算は端で止まる。u8 は上限 255、i8 は下限 -128。"),
    },
    {
      kind: "predict", time: 12, prompt: HAPPENS,
      hint: L("Can a u8 hold the result of 5 - 6? A plain -= is checked in Debug.", "¿Puede un u8 guardar el resultado de 5 - 6? El -= normal se revisa en Debug.", "5 - 6 の結果は u8 に入る？ふつうの -= はDebugで検査される。"),
      note: "recap-integers",
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
      hint: L("% wraps: after the top of a u8 comes 0 again. Count the steps.", "% da la vuelta: tras el tope de un u8 viene otra vez 0. Cuenta los pasos.", "% は一周。u8 の上限の次は 0。1つずつ数えよう。"),
      note: "recap-integers",
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
      hint: L("Does any line change lives after it is created?", "¿Alguna línea cambia lives después de crearla?", "lives を作ったあとに変える行はある？"),
      note: "recap-mutability",
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
      hint: L("One builtin checks that the value fits, the other never fails. 300 can't fit in a u8.", "Un builtin revisa que el valor quepa, el otro nunca falla. 300 no cabe en un u8.", "片方は入るか検査し、もう片方は失敗しない。300 は u8 に入らない。"),
      note: "recap-integers",
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
      hint: L("-9 / 2 is -4.5. One cuts toward zero, the other rounds down.", "-9 / 2 es -4.5. Uno corta hacia cero, el otro redondea hacia abajo.", "-9 / 2 は -4.5。片方は0方向、もう片方は下に丸める。"),
      note: "recap-integers",
      code: z`std.debug.print("{d} {d}\n", .{ @divTrunc(-9, 2), @divFloor(-9, 2) });`,
      options: ["-4 -5", "-5 -4", "-4 -4"],
      answer: 0, output: "-4 -5",
      check: { compiles: true, stdout: "-4 -5" },
      explain: L("-4.5 cut toward zero is -4; rounded down it is -5.", "-4.5 cortado hacia cero es -4; redondeado abajo es -5.", "-4.5 を0方向に切ると -4、下に丸めると -5。"),
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      hint: L("Find the range that contains the value. Ranges with ... include both ends.", "Busca el rango que contiene el valor. Los rangos con ... incluyen ambos extremos.", "値をふくむ範囲を探そう。... は両端をふくむ。"),
      note: "recap-control",
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
      hint: L("The index starts at 0. Multiply each item by its index, then add them up.", "El índice empieza en 0. Multiplica cada elemento por su índice y luego súmalos.", "番号は0から。各要素に番号をかけて、合計しよう。"),
      note: "recap-control",
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
      hint: L("How do you compare the contents of two strings in Zig?", "¿Cómo se compara el contenido de dos strings en Zig?", "Zigで2つの文字列の中身を比べる方法は？"),
      note: "recap-bytes",
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
      hint: L("How many bytes does the word have, which indexes are valid, and when is i known?", "¿Cuántos bytes tiene la palabra, qué índices son válidos y cuándo se conoce i?", "単語は何バイト？有効な番号は？i がわかるのはいつ？"),
      note: "recap-bytes",
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
      hint: L("Arrays are values: does b share a's items or own a copy of them?", "Los arrays son valores: ¿b comparte los elementos de a o tiene su propia copia?", "配列は値。b は a の要素を共有する？自分のコピーを持つ？"),
      note: "recap-bytes",
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
      hint: L("Sticking at the max is saturating. Which symbol marks the saturating operators?", "Quedarse en el máximo es saturar. ¿Qué símbolo marca los operadores saturados?", "上限で止まるのは飽和。飽和演算子のしるしの記号は？"),
      note: "recap-integers",
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
