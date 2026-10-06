import type { ExamDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import {
  collatzTask, initialsTask, largestTask, longestWordTask, parallelSumTask, parseAgeTask, parseKvTask,
  rleTask, sumEvensTask, sumLinesTask, tokensTask, wordFreqTask,
} from "./tasks.ts";

// Entry exams that simulate company technical screenings for Rust roles.
// Topic and format choices are grounded in docs/research/rust-hiring-assessments.md.
// Every answer that depends on the compiler or runtime carries a `check` verified on the
// Rust Playground (`npm run content:verify -- --lang=rust`).

const YN = [L("Yes", "Sí", "はい"), L("No", "No", "いいえ")];
const NC = L("Doesn't compile", "No compila", "コンパイルエラー");
const PANIC = L("Panic", "Panic", "パニック");
const PANIC_RT = L("Runtime panic", "Panic en runtime", "実行時にパニック");

const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルは通る？");
const PRINTS = L("What does it print?", "¿Qué imprime?", "何が出力される？");

/** Drop-tracing struct reused by several senior snippets. */
const D = `struct D(&'static str);
impl Drop for D { fn drop(&mut self) { println!("{}", self.0); } }`;

export const exams: ExamDef[] = [
  // ─── JUNIOR ───────────────────────────────────────────────────────────────
  {
    slug: "junior",
    level: "junior",
    title: L("Junior Rust Developer", "Rust Developer Junior", "ジュニア Rust 開発者"),
    description: L(
      "Initial screen (online multiple choice): syntax, mutability, ownership, borrowing, match, Option/Result, collections.",
      "Filtro inicial (opción múltiple): sintaxis, mutabilidad, ownership, préstamos, match, Option/Result, colecciones.",
      "初期の技術スクリーニング（選択式）：構文、可変性、所有権、借用、match、Option/Result、コレクション。",
    ),
    count: 12,
    codeCount: 1,
    passPct: 70,
    secondsPerQuestion: 30,
    questions: [
      longestWordTask,
      sumEvensTask,
      parseAgeTask,
      initialsTask,
      // variables
      {
        topic: "variables", difficulty: 1, kind: "predict", prompt: COMPILES, code: "let a = 1;\na = 2;", options: YN, answer: 1,
        explain: L(
          "Variables are immutable by default; to reassign one you must declare it with `let mut`.",
          "Las variables son inmutables por defecto: para reasignar hay que declararla con `let mut`.",
          "変数はデフォルトで不変です。再代入するには `let mut` で宣言する必要があります。",
        ),
        check: { compiles: false },
      },
      {
        topic: "variables", difficulty: 1, kind: "pick", prompt: L("Make x mutable", "Haz que x pueda cambiar", "x を変更可能にする"),
        code: 'let ___ x = 5;\nx += 1;\nprintln!("{}", x);', options: ["mut", "var", "&mut"], answer: 0,
        explain: L(
          "`let mut` declares a mutable binding. `var` doesn't exist in Rust, and `&mut` is a borrow type, not a variable modifier.",
          "`let mut` declara un binding mutable. `var` no existe en Rust y `&mut` es un tipo de préstamo, no un modificador de variable.",
          "`let mut` は可変な束縛を宣言します。Rust に `var` はなく、`&mut` は借用の型であって変数の修飾子ではありません。",
        ),
        check: { compiles: true, stdout: "6", wrongFail: true },
      },
      {
        topic: "variables", difficulty: 1, kind: "type", prompt: L("Declare a constant", "Declara una constante", "定数を宣言する"),
        code: "___ MAX: u32 = 100;\nlet double = MAX * 2;", answer: "const",
        explain: L(
          "`const` defines a value fixed at compile time; it always needs an explicit type and is named in UPPER_CASE.",
          "`const` define un valor fijo en compilación; siempre lleva tipo explícito y se escribe en MAYÚSCULAS.",
          "`const` はコンパイル時に決まる値を定義します。型注釈が必須で、名前は大文字で書きます。",
        ),
        check: { compiles: true },
      },
      // types
      {
        topic: "types", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'let x = 5;\nlet x = x + 1;\n{\n    let x = x * 2;\n    println!("{}", x);\n}\nprintln!("{}", x);',
        options: [L("12 and 6", "12 y 6", "12 と 6"), L("12 and 12", "12 y 12", "12 と 12"), L("6 and 6", "6 y 6", "6 と 6"), NC], answer: 0,
        explain: L(
          "Shadowing: each `let x` creates a new binding. The inner one (12) ends at the closing brace, and the 6 is visible again.",
          "Shadowing: cada `let x` crea un binding nuevo. El del bloque interno (12) desaparece al cerrar la llave y vuelve a verse el 6.",
          "シャドーイング：`let x` のたびに新しい束縛ができます。内側の 12 はブロック終了で消え、外側の 6 が再び見えます。",
        ),
        check: { compiles: true, stdout: "12\n6" },
      },
      {
        topic: "types", difficulty: 1, kind: "pick", prompt: L("Make it print 3.5", "Haz que imprima 3.5", "3.5 と出力させる"),
        code: 'let x = 7.0 / ___;\nprintln!("{}", x);', options: ["2.0", "2", "2i32"], answer: 0,
        explain: L(
          "Rust doesn't convert numeric types implicitly: f64 / integer doesn't compile. With two integers, `7 / 2` would give 3 (integer division).",
          "Rust no convierte tipos solo: f64 / entero no compila. Y con dos enteros, `7 / 2` daría 3 (división entera).",
          "Rust は数値型を暗黙変換しません。f64 / 整数はコンパイルエラーで、整数同士の `7 / 2` は 3（整数除算）です。",
        ),
        check: { compiles: true, stdout: "3.5", wrongFail: true },
      },
      {
        topic: "types", difficulty: 1, kind: "pick", prompt: L("Type of a string literal", "Tipo de un literal de texto", "文字列リテラルの型"),
        code: 'let s: ___ = "hello";', options: ["&str", "String", "char"], answer: 0,
        explain: L(
          "A string literal is `&'static str`, a borrow of text stored in the binary. `String` is owned text on the heap.",
          "Un literal de texto es `&'static str`, un préstamo a texto guardado en el binario. `String` es el texto con dueño en el heap.",
          "文字列リテラルは `&'static str`、つまりバイナリ内のテキストへの借用です。`String` はヒープ上の所有された文字列です。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "types", difficulty: 2, kind: "predict", prompt: COMPILES, code: "let x: u8 = 255;\nlet y = x + 1;", options: YN, answer: 1,
        explain: L(
          "The compiler catches the constant overflow (`arithmetic_overflow` lint). With runtime values it panics in debug and wraps to 0 in release.",
          "El compilador detecta el overflow constante (lint `arithmetic_overflow`). Con valores en runtime, en debug sería un panic y en release daría la vuelta a 0.",
          "定数のオーバーフローはコンパイラが検出します（`arithmetic_overflow`）。実行時の値なら debug でパニック、release では 0 に戻ります。",
        ),
        check: { compiles: false },
      },
      // ownership
      {
        topic: "ownership", difficulty: 1, kind: "type", prompt: L("Keep a valid after the copy", "Que a siga siendo válida", "a を有効なままにする"),
        code: 'let a = String::from("x");\nlet b = a.___();\nprintln!("{} {}", a, b);', answer: "clone",
        explain: L(
          "`let b = a` would move the String and invalidate `a`. `a.clone()` duplicates the heap data; borrowing with `&a` also works.",
          "`let b = a` movería el String y `a` dejaría de ser válido. `a.clone()` duplica los datos del heap; otra opción es prestar con `&a`.",
          "`let b = a` では String がムーブされ `a` は無効になります。`a.clone()` はヒープのデータを複製します。`&a` で借用する手もあります。",
        ),
        check: { compiles: true, stdout: "x x" },
      },
      {
        topic: "ownership", difficulty: 1, kind: "predict", prompt: COMPILES, code: 'let a = 5;\nlet b = a;\nprintln!("{} {}", a, b);', options: YN, answer: 0,
        explain: L(
          "Integers implement `Copy`: assignment copies the value, so `a` stays valid.",
          "Los enteros implementan `Copy`: asignar copia el valor y `a` sigue siendo válido.",
          "整数は `Copy` を実装しているので、代入で値がコピーされ `a` は有効なままです。",
        ),
        check: { compiles: true, stdout: "5 5" },
      },
      {
        topic: "ownership", difficulty: 2, kind: "order", prompt: L("Order it: use s before moving it", "Ordena: usa s antes de moverla", "並べ替え：ムーブ前に s を使う"),
        lines: ['let s = String::from("hi");', 'println!("{}", s.len());', "take(s);"],
        explain: L(
          "Passing a String by value to `fn take(s: String)` moves it, so `s` can't be used afterwards. Taking `&str` would avoid the move.",
          "Pasar un String por valor a `fn take(s: String)` lo mueve: después ya no se puede usar `s`. Si recibiera `&str`, no habría move.",
          "`fn take(s: String)` に値渡しするとムーブされ、以後 `s` は使えません。`&str` を受け取ればムーブは起きません。",
        ),
        check: { program: 'fn take(_s: String) {}\nfn main() {\n    let s = String::from("hi");\n    println!("{}", s.len());\n    take(s);\n}\n', compiles: true, stdout: "2" },
      },
      {
        topic: "ownership", difficulty: 2, kind: "pick", prompt: L("Accept the text without moving it", "Recibe el texto sin moverlo", "ムーブせずに文字列を受け取る"),
        code: 'fn length(s: ___) -> usize { s.len() }\nlet s = String::from("hello");\nprintln!("{} {}", length(&s), s);', options: ["&str", "String", "Box<str>"], answer: 0,
        explain: L(
          "`&str` borrows without taking ownership and accepts both `&String` (via deref coercion) and literals. It's the idiomatic signature.",
          "`&str` presta sin tomar ownership y acepta tanto `&String` (por deref coercion) como literales. Es la firma idiomática.",
          "`&str` は所有権を取らずに借用し、`&String`（deref 型強制）もリテラルも受け取れます。慣用的なシグネチャです。",
        ),
        check: { compiles: true, stdout: "5 hello", wrongFail: true },
      },
      // borrowing
      {
        topic: "borrowing", difficulty: 1, kind: "predict", prompt: COMPILES, code: "let mut s = String::new();\nlet a = &mut s;\nlet b = &mut s;\na.push('x');", options: YN, answer: 1,
        explain: L(
          "Only one `&mut` can be active at a time; `a` is used after `b` is created, so they conflict.",
          "Solo puede existir un `&mut` activo a la vez; `a` se usa después de crear `b`, así que chocan.",
          "有効な `&mut` は同時に 1 つだけです。`b` の作成後に `a` を使っているため衝突します。",
        ),
        check: { compiles: false },
      },
      {
        topic: "borrowing", difficulty: 2, kind: "predict", prompt: COMPILES, code: 'let mut v = vec![1, 2];\nlet first = &v[0];\nv.push(3);\nprintln!("{}", first);', options: YN, answer: 1,
        explain: L(
          "`push` may reallocate the Vec and leave `first` dangling. You can't mutate while a shared borrow is still alive.",
          "`push` puede realocar el Vec y dejar `first` colgando. No se puede mutar mientras un préstamo compartido sigue vivo.",
          "`push` は Vec を再確保して `first` をダングリングにしうるため、共有借用が生きている間は変更できません。",
        ),
        check: { compiles: false },
      },
      {
        topic: "borrowing", difficulty: 2, kind: "predict", prompt: COMPILES, code: 'let mut v = vec![1];\nlet r = &v[0];\nprintln!("{}", r);\nv.push(2);\nprintln!("{}", v.len());', options: YN, answer: 0,
        explain: L(
          "Non-lexical lifetimes: the borrow `r` ends at its last use, so the later `push` is fine.",
          "Non-lexical lifetimes: el préstamo `r` termina en su último uso, así que el `push` posterior es válido.",
          "NLL（非レキシカルライフタイム）：借用 `r` は最後の使用で終わるため、その後の `push` は問題ありません。",
        ),
        check: { compiles: true, stdout: "1\n2" },
      },
      {
        topic: "borrowing", difficulty: 1, kind: "type", prompt: L("Take a mutable borrow", "Pide un préstamo mutable", "可変借用を取る"),
        code: "let mut s = String::new();\nlet r = &___ s;\nr.push('a');", answer: "mut",
        explain: L(
          "`&mut s` creates an exclusive borrow that lets you modify the value without taking ownership.",
          "`&mut s` crea un préstamo exclusivo que permite modificar el valor sin tomar ownership.",
          "`&mut s` は排他的な借用を作り、所有権を取らずに値を変更できるようにします。",
        ),
        check: { compiles: true },
      },
      // patterns
      {
        topic: "patterns", difficulty: 1, kind: "pick", prompt: L("Cover every case", "Cubre todos los casos", "すべてのケースを網羅する"),
        code: 'let n = 3;\nlet t = match n {\n    0 => "zero",\n    1..=9 => "digit",\n    ___ => "other",\n};\nprintln!("{}", t);', options: ["_", "else", "default"], answer: 0,
        explain: L(
          "`_` is the match wildcard. `else` isn't valid there; `default` compiles, but only as a catch-all variable. Matches on integers need a fallback arm.",
          "`_` es el comodín de match. `else` no vale ahí; `default` compila, pero solo como variable que atrapa todo. Con enteros hace falta un brazo por defecto.",
          "`_` は match のワイルドカードです。`else` は使えず、`default` は全てを受ける変数になります。整数の match には既定の腕が必要です。",
        ),
        check: { compiles: true, stdout: "digit" },
      },
      {
        topic: "patterns", difficulty: 2, kind: "pick", prompt: L("Complete the exhaustive match", "Completa el match exhaustivo", "網羅的な match を完成させる"),
        code: 'let o: Option<i32> = None;\nmatch o {\n    Some(x) => println!("{}", x),\n    ___ => println!("nothing"),\n}', options: ["None", "Some()", "Option::Null"], answer: 0,
        explain: L(
          "match must be exhaustive, so the `None` arm is required. This is how Rust forces you to handle a missing value (there's no null).",
          "match debe ser exhaustivo: hace falta el brazo `None`. Así Rust te obliga a manejar la ausencia de valor (no existe null).",
          "match は網羅的でなければならず `None` の腕が必要です。Rust には null がなく、値の不在を必ず扱わせます。",
        ),
        check: { compiles: true, stdout: "nothing", wrongFail: true },
      },
      {
        topic: "patterns", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: 'if let Some(x) = "41".parse::<i32>().ok() {\n    println!("{}", x + 1);\n} else {\n    println!("nothing");\n}', options: ["42", "41", "nothing", NC], answer: 0,
        explain: L(
          "`parse` returns Ok(41), `.ok()` turns it into Some(41), and `if let` extracts the value.",
          "`parse` devuelve Ok(41), `.ok()` lo convierte en Some(41) e `if let` extrae el valor.",
          "`parse` は Ok(41) を返し、`.ok()` で Some(41) になり、`if let` が値を取り出します。",
        ),
        check: { compiles: true, stdout: "42" },
      },
      // errors
      {
        topic: "errors", difficulty: 1, kind: "pick", prompt: L("Propagate the error to the caller", "Propaga el error al llamador", "エラーを呼び出し元へ伝播する"),
        code: "fn double(s: &str) -> Result<i32, std::num::ParseIntError> {\n    let n = s.parse::<i32>()___;\n    Ok(n * 2)\n}", options: ["?", "!", ".err()"], answer: 0,
        explain: L(
          "`?` yields the value on Ok and returns the Err early from the function. It's the idiomatic way to propagate errors.",
          "`?` devuelve el valor si es Ok y retorna el Err temprano desde la función. Es la forma idiomática de propagar errores.",
          "`?` は Ok なら値を取り出し、Err なら関数から早期リターンします。エラー伝播の慣用的な書き方です。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "errors", difficulty: 1, kind: "predict", prompt: PRINTS, code: 'let r: Result<i32, String> = Err("x".into());\nprintln!("{}", r.unwrap_or(0));', options: ["0", "x", PANIC], answer: 0,
        explain: L(
          "`unwrap_or` returns a default on Err without panicking. Prefer it over `unwrap()` when there's a sensible fallback.",
          "`unwrap_or` da un valor por defecto en caso de Err, sin panic. Es preferible a `unwrap()` cuando hay un fallback razonable.",
          "`unwrap_or` は Err のときパニックせず既定値を返します。妥当な代替値があれば `unwrap()` より望ましいです。",
        ),
        check: { compiles: true, stdout: "0" },
      },
      {
        topic: "errors", difficulty: 1, kind: "predict", prompt: L("What happens with None.unwrap()?", "¿Qué pasa con None.unwrap()?", "None.unwrap() はどうなる？"),
        code: "let o: Option<i32> = None;\nlet v = o.unwrap();",
        options: [PANIC_RT, L("Compile error", "Error de compilación", "コンパイルエラー"), L("v is 0", "v vale 0", "v は 0 になる")], answer: 0,
        explain: L(
          "It compiles, but `unwrap()` on None panics at runtime. That's why production code prefers match, `?` or `unwrap_or`.",
          "Compila, pero `unwrap()` sobre None hace panic al ejecutar. Por eso en código de producción se prefiere match, `?` o `unwrap_or`.",
          "コンパイルは通りますが、None への `unwrap()` は実行時にパニックします。本番コードでは match、`?`、`unwrap_or` が好まれます。",
        ),
        check: { program: "fn main() {\n    let o: Option<i32> = None;\n    let r = std::panic::catch_unwind(|| o.unwrap());\n    println!(\"{}\", r.is_err());\n}", compiles: true, stdout: "true" },
      },
      {
        topic: "errors", difficulty: 2, kind: "order", prompt: L("Put the function in order", "Ordena la función", "関数を正しい順に並べる"),
        lines: ["fn double(s: &str) -> Result<i32, std::num::ParseIntError> {", "    let n: i32 = s.parse()?;", "    Ok(n * 2)", "}"],
        explain: L(
          "First parse (propagating the error with `?`), then return the success value wrapped in `Ok`.",
          "Primero se parsea (propagando el error con `?`) y al final se devuelve el éxito envuelto en `Ok`.",
          "まず `?` でエラーを伝播しつつパースし、最後に成功値を `Ok` で包んで返します。",
        ),
        check: { compiles: true },
      },
      // collections
      {
        topic: "collections", difficulty: 1, kind: "predict", prompt: PRINTS, code: 'let v = vec![1, 2, 3];\nprintln!("{:?}", v.get(10));', options: ["None", PANIC, "0"], answer: 0,
        explain: L(
          "`get` returns an Option and doesn't panic when out of range. `v[10]`, on the other hand, would panic.",
          "`get` devuelve Option y no hace panic fuera de rango. En cambio `v[10]` sí haría panic.",
          "`get` は Option を返し、範囲外でもパニックしません。一方 `v[10]` はパニックします。",
        ),
        check: { compiles: true, stdout: "None" },
      },
      {
        topic: "collections", difficulty: 2, kind: "pick", prompt: L("First character of a String", "Primer carácter de un String", "String の先頭の文字"),
        code: 'let s = String::from("hello");\nlet c = s.___().next();\nprintln!("{:?}", c);', options: ["chars", "index", "get"], answer: 0,
        explain: L(
          "String is UTF-8 and can't be indexed with `s[0]`. `chars()` walks Unicode characters; `get` needs a byte range.",
          "String es UTF-8 y no se indexa con `s[0]`. `chars()` recorre caracteres Unicode; `get` necesita un rango de bytes.",
          "String は UTF-8 なので `s[0]` で添字アクセスできません。`chars()` は Unicode 文字を走査し、`get` はバイト範囲が必要です。",
        ),
        check: { compiles: true, stdout: "Some('h')", wrongFail: true },
      },
      {
        topic: "collections", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'use std::collections::HashMap;\nlet mut m = HashMap::new();\n*m.entry("a").or_insert(0) += 1;\n*m.entry("a").or_insert(0) += 1;\nprintln!("{}", m["a"]);', options: ["2", "1", "0"], answer: 0,
        explain: L(
          "`entry().or_insert(0)` inserts 0 only the first time and returns `&mut` to the value; each line adds 1.",
          "`entry().or_insert(0)` inserta 0 solo la primera vez y devuelve `&mut` al valor; cada línea suma 1.",
          "`entry().or_insert(0)` は初回だけ 0 を挿入し、値への `&mut` を返します。各行で 1 ずつ加算されます。",
        ),
        check: { compiles: true, stdout: "2" },
      },
    ],
  },

  // ─── MID / SEMI-SENIOR ────────────────────────────────────────────────────
  {
    slug: "mid",
    level: "mid",
    title: L("Mid-level Rust Developer", "Rust Developer Semi-Senior", "ミドル Rust 開発者"),
    description: L(
      "Backend/infra tech test: lifetimes, traits and generics, errors with ?, iterators, closures, smart pointers, threads.",
      "Prueba backend/infra: lifetimes, traits y genéricos, errores con ?, iteradores, closures, smart pointers e hilos.",
      "バックエンド/インフラ向け技術試験：ライフタイム、トレイト、ジェネリクス、? によるエラー処理、イテレータ、クロージャ、スレッド。",
    ),
    count: 14,
    codeCount: 2,
    passPct: 70,
    secondsPerQuestion: 40,
    questions: [
      wordFreqTask,
      parseKvTask,
      rleTask,
      largestTask,
      // lifetimes
      {
        topic: "lifetimes", difficulty: 1, kind: "predict", prompt: COMPILES, code: "fn longest(a: &str, b: &str) -> &str {\n    if a.len() > b.len() { a } else { b }\n}", options: YN, answer: 1,
        explain: L(
          "With two reference inputs, elision can't tell which one the output borrows from. You need `<'a>` on all three.",
          "Con dos referencias de entrada, la elisión no sabe a cuál ligar la salida. Hace falta `<'a>` en las tres.",
          "参照の入力が 2 つあると、省略規則では戻り値をどちらに結び付けるか決められません。3 つすべてに `<'a>` が必要です。",
        ),
        check: { compiles: false },
      },
      {
        topic: "lifetimes", difficulty: 1, kind: "pick", prompt: L("Correct return type", "Tipo de retorno correcto", "正しい戻り値の型"),
        code: "fn longest<'a>(a: &'a str, b: &'a str) -> ___ {\n    if a.len() > b.len() { a } else { b }\n}", options: ["&'a str", "&str", "&'static str"], answer: 0,
        explain: L(
          "The result lives as long as the shorter of the two inputs: `&'a str`. `'static` would require data that lives for the whole program.",
          "El resultado vive tanto como la más corta de las dos entradas: `&'a str`. `'static` exigiría datos que viven todo el programa.",
          "戻り値は 2 つの入力のうち短い方と同じだけ生きます：`&'a str`。`'static` はプログラム全体で生きるデータを要求します。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "lifetimes", difficulty: 1, kind: "predict", prompt: COMPILES, code: 'let r;\n{\n    let x = 5;\n    r = &x;\n}\nprintln!("{}", r);', options: YN, answer: 1,
        explain: L(
          "`x` dies at the end of the block, which would leave `r` dangling. The borrow checker rejects references that outlive their data.",
          "`x` muere al cerrar el bloque y `r` quedaría colgando. El borrow checker rechaza referencias que sobreviven a su dato.",
          "`x` はブロック終了で破棄され、`r` はダングリングになります。借用チェッカーはデータより長生きする参照を拒否します。",
        ),
        check: { compiles: false },
      },
      {
        topic: "lifetimes", difficulty: 2, kind: "pick", prompt: L("Struct that holds a borrow", "Struct que guarda un préstamo", "借用を保持する構造体"),
        code: "struct Parser<'a> {\n    input: ___,\n}", options: ["&'a str", "&str", "str"], answer: 0,
        explain: L(
          "A reference field in a struct always needs an explicit lifetime; `str` without & has no known size.",
          "Un campo referencia en un struct siempre necesita lifetime explícito; `str` sin & no tiene tamaño conocido.",
          "構造体の参照フィールドには常に明示的なライフタイムが必要です。& なしの `str` はサイズが不明です。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "lifetimes", difficulty: 2, kind: "predict", prompt: COMPILES, code: "struct S { name: String }\nimpl S {\n    fn get(&self, _other: &str) -> &str {\n        &self.name\n    }\n}", options: YN, answer: 0,
        explain: L(
          "Third elision rule: if there's `&self`, the output gets self's lifetime. Here we return a borrow of self, so it fits.",
          "Tercera regla de elisión: si hay `&self`, la salida toma el lifetime de self. Aquí devolvemos un préstamo de self, así que encaja.",
          "省略規則の 3 つ目：`&self` があれば戻り値は self のライフタイムになります。ここでは self の借用を返すので成立します。",
        ),
        check: { compiles: true },
      },
      // traits
      {
        topic: "traits", difficulty: 1, kind: "pick", prompt: L("Bound needed to compare with >", "Bound para poder comparar con >", "> で比較するためのトレイト境界"),
        code: "fn max<T: ___>(a: T, b: T) -> T {\n    if a > b { a } else { b }\n}", options: ["PartialOrd", "Eq", "Display"], answer: 0,
        explain: L(
          "The `<` and `>` operators come from `PartialOrd`. `Eq` only provides equality, and `Display` is for formatting.",
          "Los operadores `<` y `>` vienen de `PartialOrd`. `Eq` solo da igualdad y `Display` es para formatear.",
          "`<` と `>` 演算子は `PartialOrd` に由来します。`Eq` は等価性のみ、`Display` は書式化用です。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "traits", difficulty: 1, kind: "pick", prompt: L("Accept anything printable with {}", "Acepta cualquier cosa imprimible con {}", "{} で表示できる値を何でも受け取る"),
        code: 'fn show(x: impl ___) {\n    println!("{}", x);\n}\nshow(5);', options: ["std::fmt::Display", "std::fmt::Debug", "Clone"], answer: 0,
        explain: L(
          "`{}` requires `Display`; `{:?}` requires `Debug`. `impl Trait` in argument position is sugar for a generic with a bound.",
          "`{}` requiere `Display`; `{:?}` requiere `Debug`. `impl Trait` en argumento es azúcar para un genérico con bound.",
          "`{}` には `Display`、`{:?}` には `Debug` が必要です。引数位置の `impl Trait` は境界付きジェネリクスの糖衣構文です。",
        ),
        check: { compiles: true, stdout: "5", wrongFail: true },
      },
      {
        topic: "traits", difficulty: 1, kind: "pick", prompt: L("Make P cloneable", "Haz que P se pueda clonar", "P を clone 可能にする"),
        code: '#[derive(Debug, ___)]\nstruct P { x: i32 }\nlet a = P { x: 1 };\nlet b = a.clone();\nprintln!("{:?}", b);', options: ["Clone", "Copy", "PartialEq"], answer: 0,
        explain: L(
          "`clone()` only exists if the type implements `Clone`. `Copy` without `Clone` doesn't compile, and `PartialEq` only gives `==`.",
          "`clone()` solo existe si el tipo implementa `Clone`. `Copy` sin `Clone` no compila y `PartialEq` solo da `==`.",
          "`clone()` は型が `Clone` を実装している場合のみ使えます。`Clone` なしの `Copy` はコンパイルできず、`PartialEq` は `==` だけです。",
        ),
        check: { compiles: true, stdout: "P { x: 1 }", wrongFail: true },
      },
      {
        topic: "traits", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'trait Greet {\n    fn name(&self) -> String;\n    fn greeting(&self) -> String { format!("Hello, {}", self.name()) }\n}\nstruct Ana;\nimpl Greet for Ana { fn name(&self) -> String { "Ana".into() } }\nprintln!("{}", Ana.greeting());',
        options: ["Hello, Ana", "Hello, ", NC], answer: 0,
        explain: L(
          "Traits can have default methods that call the required ones. `Ana` only implements `name`.",
          "Los traits pueden tener métodos por defecto que usan los métodos requeridos. `Ana` solo implementa `name`.",
          "トレイトは必須メソッドを呼び出すデフォルトメソッドを持てます。`Ana` が実装しているのは `name` だけです。",
        ),
        check: { compiles: true, stdout: "Hello, Ana" },
      },
      {
        topic: "traits", difficulty: 3, kind: "predict", prompt: COMPILES, code: 'fn make(f: bool) -> impl std::fmt::Display {\n    if f { 1 } else { "one" }\n}', options: YN, answer: 1,
        explain: L(
          "Return-position `impl Trait` is ONE hidden concrete type, not several. To return different types, use `Box<dyn Display>`.",
          "`impl Trait` en el retorno es UN tipo concreto oculto, no varios. Para devolver tipos distintos se usa `Box<dyn Display>`.",
          "戻り値位置の `impl Trait` は隠された 1 つの具体型です。異なる型を返すには `Box<dyn Display>` を使います。",
        ),
        check: { compiles: false },
      },
      {
        topic: "traits", difficulty: 3, kind: "pick", prompt: L("Return different types", "Devuelve tipos distintos", "異なる型を返す"),
        code: 'fn make(f: bool) -> ___ {\n    if f { Box::new(1) } else { Box::new("one") }\n}', options: ["Box<dyn std::fmt::Display>", "impl std::fmt::Display", "Box<impl std::fmt::Display>"], answer: 0,
        explain: L(
          "A `Box<dyn Trait>` trait object lets the type be chosen at runtime (dynamic dispatch through a vtable).",
          "Un trait object `Box<dyn Trait>` permite elegir el tipo en runtime (dispatch dinámico vía vtable).",
          "トレイトオブジェクト `Box<dyn Trait>` なら型を実行時に選べます（vtable による動的ディスパッチ）。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      // errors
      {
        topic: "errors", difficulty: 2, kind: "type", prompt: L("Which trait does ? use to convert?", "¿Qué trait usa ? para convertir?", "? が変換に使うトレイトは？"),
        code: "enum AppErr { Parse(std::num::ParseIntError) }\nimpl ___<std::num::ParseIntError> for AppErr {\n    fn from(e: std::num::ParseIntError) -> Self { AppErr::Parse(e) }\n}\nfn f(s: &str) -> Result<i32, AppErr> {\n    Ok(s.parse::<i32>()?)\n}", answer: "From",
        explain: L(
          "`?` calls `From::from` on the error, so implementing `From` lets you convert library errors into your own error type.",
          "`?` llama a `From::from` sobre el error, así que implementar `From` permite convertir errores de librerías a tu tipo de error.",
          "`?` はエラーに `From::from` を呼ぶため、`From` を実装すればライブラリのエラーを独自のエラー型に変換できます。",
        ),
        check: { compiles: true },
      },
      {
        topic: "errors", difficulty: 2, kind: "predict", prompt: PRINTS, code: 'fn f() -> Option<i32> {\n    let v: Vec<i32> = vec![];\n    let x = v.first()?;\n    Some(x * 2)\n}\nprintln!("{:?}", f());', options: ["None", "Some(0)", PANIC], answer: 0,
        explain: L(
          "`?` also works with Option: on None, the function returns None right away.",
          "`?` también funciona con Option: si es None, la función retorna None de inmediato.",
          "`?` は Option にも使えます。None なら関数は即座に None を返します。",
        ),
        check: { compiles: true, stdout: "None" },
      },
      {
        topic: "errors", difficulty: 1, kind: "type", prompt: L("A main that can use ?", "main que puede usar ?", "? を使える main"),
        code: 'fn main() -> Result<(), std::num::ParseIntError> {\n    let n: i32 = "5".parse()?;\n    println!("{}", n);\n    ___(())\n}', answer: "Ok",
        explain: L(
          "`?` only works in functions that return Result or Option. If `main` returns Result, it ends with `Ok(())`.",
          "`?` solo se usa en funciones que devuelven Result u Option. Si `main` devuelve Result, termina con `Ok(())`.",
          "`?` は Result か Option を返す関数でのみ使えます。`main` が Result を返すなら最後は `Ok(())` です。",
        ),
        check: { compiles: true, stdout: "5" },
      },
      // iterators
      {
        topic: "iterators", difficulty: 2, kind: "predict", prompt: PRINTS, code: 'let v = vec![1, 2, 3];\nv.iter().map(|x| println!("{}", x));\nprintln!("done");', options: ["done", "1 2 3 done", NC], answer: 0,
        explain: L(
          "Iterators are lazy: `map` does nothing until something consumes it (`for`, `collect`, `for_each`). It compiles with a warning.",
          "Los iteradores son perezosos: `map` no hace nada hasta que algo lo consume (`for`, `collect`, `for_each`). Compila con un warning.",
          "イテレータは遅延評価です。`for`、`collect`、`for_each` などで消費されるまで `map` は何もしません。警告付きでコンパイルされます。",
        ),
        check: { compiles: true, stdout: "done" },
      },
      {
        topic: "iterators", difficulty: 1, kind: "type", prompt: L("Consume the iterator by summing (gives 60)", "Consume el iterador sumando (da 60)", "合計して消費する（結果は 60）"),
        code: 'let s: i32 = (1..=4)\n    .filter(|n| n % 2 == 0)\n    .map(|n| n * 10)\n    .___();\nprintln!("{}", s);', answer: "sum",
        explain: L(
          "It keeps 2 and 4, multiplies them (20, 40), and `sum()` consumes the iterator: 60.",
          "Filtra 2 y 4, los multiplica (20, 40) y `sum()` consume el iterador: 60.",
          "2 と 4 を残して 10 倍し（20、40）、`sum()` がイテレータを消費して 60 になります。",
        ),
        check: { compiles: true, stdout: "60" },
      },
      {
        topic: "iterators", difficulty: 1, kind: "pick", prompt: L("Collect the iterator into a Vec", "Consume el iterador en un Vec", "イテレータを Vec に集める"),
        code: "let v = vec![1, 2, 3];\nlet d: Vec<i32> = v.iter().map(|x| x * 2).___;", options: ["collect()", "to_vec()", "into()"], answer: 0,
        explain: L(
          "`collect()` consumes the iterator and builds the collection named by the type annotation.",
          "`collect()` consume el iterador y construye la colección indicada por el tipo anotado.",
          "`collect()` はイテレータを消費し、型注釈で指定されたコレクションを構築します。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "iterators", difficulty: 2, kind: "pick", prompt: L("Iterate without moving the Vec", "Itera sin mover el Vec", "Vec をムーブせずに反復する"),
        code: 'let v = vec![String::from("a")];\nfor s in ___ {\n    println!("{}", s);\n}\nprintln!("{}", v.len());', options: ["&v", "v", "*v"], answer: 0,
        explain: L(
          "`for s in v` calls `into_iter()` and moves the Vec. With `&v` (or `v.iter()`) you iterate by borrowing and `v` stays usable.",
          "`for s in v` llama a `into_iter()` y mueve el Vec. Con `&v` (o `v.iter()`) se itera por préstamo y `v` sigue disponible.",
          "`for s in v` は `into_iter()` を呼んで Vec をムーブします。`&v`（または `v.iter()`）なら借用で反復でき、`v` を使い続けられます。",
        ),
        check: { compiles: true, stdout: "a\n1", wrongFail: true },
      },
      // closures
      {
        topic: "closures", difficulty: 1, kind: "predict", prompt: PRINTS, code: 'let mut c = 0;\nlet mut inc = || c += 1;\ninc();\ninc();\nprintln!("{}", c);', options: ["2", "0", NC], answer: 0,
        explain: L(
          "The closure captures `c` by mutable borrow (it's FnMut). After its last use, `c` can be read.",
          "La closure captura `c` por préstamo mutable (es FnMut). Tras su último uso, `c` se puede leer.",
          "クロージャは `c` を可変借用でキャプチャします（FnMut）。最後の使用の後なら `c` を読めます。",
        ),
        check: { compiles: true, stdout: "2" },
      },
      {
        topic: "closures", difficulty: 2, kind: "order", prompt: L("Order it so it prints 1", "Ordena para que imprima 1", "1 と出力されるよう並べる"),
        lines: ["let mut c = 0;", "let mut inc = || c += 1;", "inc();", 'println!("{}", c);'],
        explain: L(
          "The closure holds a `&mut c` until its last use (`inc()`); reading `c` only after that avoids clashing with the borrow.",
          "La closure mantiene un `&mut c` hasta su último uso (`inc()`); leer `c` recién después evita chocar con ese préstamo.",
          "クロージャは最後の使用（`inc()`）まで `&mut c` を保持します。その後で `c` を読めば借用と衝突しません。",
        ),
        check: { compiles: true, stdout: "1" },
      },
      // smart pointers
      {
        topic: "smart_pointers", difficulty: 2, kind: "pick", prompt: L("Recursive enum", "Enum recursivo", "再帰的な列挙型"),
        code: "enum List {\n    Cons(i32, ___),\n    Nil,\n}", options: ["Box<List>", "List", "&List"], answer: 0,
        explain: L(
          "A recursive type would have infinite size; `Box` breaks the recursion with a fixed-size pointer to the heap.",
          "Un tipo recursivo tendría tamaño infinito; `Box` lo rompe con un puntero de tamaño fijo al heap.",
          "再帰的な型はサイズが無限になります。`Box` はヒープへの固定サイズのポインタでそれを断ち切ります。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "smart_pointers", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'use std::rc::Rc;\nlet a = Rc::new(5);\nlet b = Rc::clone(&a);\n{\n    let _c = Rc::clone(&a);\n    println!("{}", Rc::strong_count(&a));\n}\nprintln!("{}", Rc::strong_count(&b));',
        options: [L("3 and 2", "3 y 2", "3 と 2"), L("3 and 3", "3 y 3", "3 と 3"), L("1 and 1", "1 y 1", "1 と 1"), L("2 and 1", "2 y 1", "2 と 1")], answer: 0,
        explain: L(
          "Each `Rc::clone` adds a reference (it doesn't copy the data). Leaving the block drops `_c` and the count goes down to 2.",
          "Cada `Rc::clone` suma una referencia (no copia el dato). Al salir del bloque `_c` se libera y el contador baja a 2.",
          "`Rc::clone` は参照カウントを増やすだけでデータは複製しません。ブロックを抜けると `_c` が解放され 2 に戻ります。",
        ),
        check: { compiles: true, stdout: "3\n2" },
      },
      // concurrency
      {
        topic: "concurrency", difficulty: 1, kind: "pick", prompt: L("The thread needs to own name", "El hilo necesita poseer name", "スレッドが name を所有する必要がある"),
        code: 'let name = String::from("Ana");\nlet h = std::thread::spawn(___ || println!("{}", name));\nh.join().unwrap();', options: ["move", "ref", "&"], answer: 0,
        explain: L(
          "A thread may outlive the function, so the closure must take ownership of what it captures with `move`.",
          "Un hilo puede vivir más que la función, así que la closure debe tomar ownership de lo que captura con `move`.",
          "スレッドは関数より長生きしうるため、クロージャは `move` でキャプチャした値の所有権を取る必要があります。",
        ),
        check: { compiles: true, stdout: "Ana", wrongFail: true },
      },
      {
        topic: "concurrency", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: "use std::sync::{Arc, Mutex};\nlet n = Arc::new(Mutex::new(0));\nlet hs: Vec<_> = (0..4).map(|_| {\n    let n = Arc::clone(&n);\n    std::thread::spawn(move || *n.lock().unwrap() += 1)\n}).collect();\nfor h in hs { h.join().unwrap(); }\nprintln!(\"{}\", n.lock().unwrap());",
        options: ["4", L("It varies", "Varía", "実行ごとに変わる"), "0", NC], answer: 0,
        explain: L(
          "`Arc` shares the data across threads and `Mutex` serializes each increment; after `join` the result is always 4.",
          "`Arc` comparte el dato entre hilos y `Mutex` serializa cada suma; tras `join` el resultado es siempre 4.",
          "`Arc` でスレッド間でデータを共有し、`Mutex` が加算を直列化します。`join` 後の結果は常に 4 です。",
        ),
        check: { compiles: true, stdout: "4" },
      },
      {
        topic: "concurrency", difficulty: 2, kind: "order", prompt: L("Order it: share and mutate in a thread", "Ordena: comparte y modifica en un hilo", "並べ替え：スレッドで共有して変更する"),
        lines: ["let data = Arc::new(Mutex::new(vec![]));", "let d = Arc::clone(&data);", "let h = thread::spawn(move || d.lock().unwrap().push(1));", "h.join().unwrap();", "println!(\"{:?}\", data.lock().unwrap());"],
        explain: L(
          "Create the shared data, clone the Arc for the thread, spawn it, wait with `join`, and only then read the result.",
          "Se crea el dato compartido, se clona el Arc para el hilo, se lanza, se espera con `join` y recién entonces se lee el resultado.",
          "共有データを作り、スレッド用に Arc をクローンして起動し、`join` で待ってから結果を読みます。",
        ),
        check: { program: "use std::sync::{Arc, Mutex};\nuse std::thread;\nfn main() {\n    let data = Arc::new(Mutex::new(vec![]));\n    let d = Arc::clone(&data);\n    let h = thread::spawn(move || d.lock().unwrap().push(1));\n    h.join().unwrap();\n    println!(\"{:?}\", data.lock().unwrap());\n}\n", compiles: true, stdout: "[1]" },
      },
      // patterns
      {
        topic: "patterns", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'let p = (3, -3);\nmatch p {\n    (x, y) if x == -y => println!("opposites"),\n    (x, _) if x > 0 => println!("positive"),\n    _ => println!("other"),\n}', options: ["opposites", "positive", "other"], answer: 0,
        explain: L(
          "match checks the arms in order and takes the first one whose pattern and `if` guard both hold.",
          "match evalúa los brazos en orden y se queda con el primero cuyo patrón y guarda `if` se cumplen.",
          "match は腕を上から順に評価し、パターンと `if` ガードの両方を満たす最初の腕を選びます。",
        ),
        check: { compiles: true, stdout: "opposites" },
      },
    ],
  },

  // ─── SENIOR ───────────────────────────────────────────────────────────────
  {
    slug: "senior",
    level: "senior",
    title: L("Senior Rust Developer", "Rust Developer Senior", "シニア Rust 開発者"),
    description: L(
      "Senior systems interview: Send/Sync, Rc vs Arc, interior mutability, dyn traits, variance, 'static, Drop, async, unsafe.",
      "Entrevista senior: Send/Sync, Rc vs Arc, interior mutability, trait objects, varianza, 'static, Drop, async, unsafe.",
      "シニア向けシステム面接：Send/Sync、Rc と Arc、内部可変性、トレイトオブジェクト、変性、'static、Drop、非同期、unsafe。",
    ),
    count: 15,
    codeCount: 2,
    passPct: 75,
    secondsPerQuestion: 50,
    questions: [
      sumLinesTask,
      tokensTask,
      parallelSumTask,
      collatzTask,
      // concurrency: Send / Sync
      {
        topic: "concurrency", difficulty: 1, kind: "pick", prompt: L("Share the value with another thread", "Comparte el valor con otro hilo", "値を別スレッドと共有する"),
        code: 'use std::{rc::Rc, sync::Arc};\nlet r = ___::new(5);\nstd::thread::spawn(move || println!("{}", r))\n    .join().unwrap();', options: ["Arc", "Rc"], answer: 0,
        explain: L(
          "`Rc` isn't `Send`: its reference count isn't atomic. Across threads you use `Arc`.",
          "`Rc` no es `Send`: su contador no es atómico. Entre hilos se usa `Arc`.",
          "`Rc` はカウンタがアトミックでないため `Send` ではありません。スレッド間では `Arc` を使います。",
        ),
        check: { compiles: true, stdout: "5", wrongFail: true },
      },
      {
        topic: "concurrency", difficulty: 2, kind: "pick", prompt: L("Minimal bound to move it to another thread", "Bound mínimo para mover a otro hilo", "別スレッドへムーブするための最小の境界"),
        code: "fn send_off<T: ___ + 'static>(v: T) {\n    std::thread::spawn(move || drop(v));\n}", options: ["Send", "Sync", "Copy", "Clone"], answer: 0,
        explain: L(
          "`thread::spawn` requires everything captured to be `Send + 'static`. `Sync` is about sharing `&T` across threads.",
          "`thread::spawn` exige que lo capturado sea `Send + 'static`. `Sync` es para compartir `&T` entre hilos.",
          "`thread::spawn` はキャプチャする値に `Send + 'static` を要求します。`Sync` は `&T` をスレッド間で共有するための性質です。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "concurrency", difficulty: 2, kind: "pick", prompt: L("Runtime-checked borrows that are Sync", "Préstamos en runtime que sí son Sync", "Sync な実行時借用チェック"),
        code: "fn need_sync<T: Sync>() {}\nneed_sync::<___<i32>>();", options: ["std::sync::RwLock", "std::cell::RefCell", "std::cell::Cell"], answer: 0,
        explain: L(
          "`RefCell` and `Cell` are `Send` but not `Sync`: their internal state can't handle concurrent access. The thread-safe version is `RwLock`/`Mutex`.",
          "`RefCell` y `Cell` son `Send` pero no `Sync`: su estado interno no soporta accesos concurrentes. La versión thread-safe es `RwLock`/`Mutex`.",
          "`RefCell` と `Cell` は `Send` ですが `Sync` ではなく、並行アクセスに対応しません。スレッドセーフ版は `RwLock`/`Mutex` です。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "concurrency", difficulty: 3, kind: "predict", prompt: COMPILES, code: "fn need_sync<T: Sync>() {}\nneed_sync::<std::sync::Mutex<std::cell::Cell<i32>>>();", options: YN, answer: 0,
        explain: L(
          "`Mutex<T>` is `Sync` whenever `T: Send`; the lock guarantees exclusive access, so the inner `Cell` doesn't need to be `Sync`.",
          "`Mutex<T>` es `Sync` siempre que `T: Send`; el lock garantiza acceso exclusivo, así que el `Cell` interno no necesita ser `Sync`.",
          "`Mutex<T>` は `T: Send` なら `Sync` です。ロックが排他アクセスを保証するので、内部の `Cell` は `Sync` でなくて構いません。",
        ),
        check: { compiles: true },
      },
      {
        topic: "concurrency", difficulty: 2, kind: "predict", prompt: COMPILES, code: 'let v = vec![1, 2, 3];\nstd::thread::scope(|s| {\n    s.spawn(|| println!("{}", v.len()));\n});\nprintln!("{:?}", v);', options: YN, answer: 0,
        explain: L(
          "`thread::scope` guarantees the threads finish before the scope ends, so they can borrow local data without `Arc` or `move`.",
          "`thread::scope` garantiza que los hilos terminan antes de salir del scope, así que pueden prestar datos locales sin `Arc` ni `move`.",
          "`thread::scope` はスコープ終了前にスレッドの完了を保証するため、`Arc` や `move` なしでローカルデータを借用できます。",
        ),
        check: { compiles: true, stdout: "3\n[1, 2, 3]" },
      },
      // smart pointers / interior mutability
      {
        topic: "smart_pointers", difficulty: 2, kind: "predict", prompt: L("What happens at runtime?", "¿Qué pasa al ejecutar?", "実行するとどうなる？"),
        code: "use std::cell::RefCell;\nlet c = RefCell::new(1);\nlet _a = c.borrow_mut();\nlet _b = c.borrow_mut();",
        options: [PANIC_RT, NC, L("It works", "Funciona", "正常に動く")], answer: 0,
        explain: L(
          "`RefCell` moves the borrow rules to runtime: it compiles, but a second active `borrow_mut` panics (BorrowMutError).",
          "`RefCell` mueve las reglas de préstamo a runtime: compila, pero el segundo `borrow_mut` activo provoca panic (BorrowMutError).",
          "`RefCell` は借用規則を実行時に移します。コンパイルは通りますが、2 つ目の `borrow_mut` でパニックします（BorrowMutError）。",
        ),
        check: { program: "use std::cell::RefCell;\nfn main() {\n    let c = RefCell::new(1);\n    let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {\n        let _a = c.borrow_mut();\n        let _b = c.borrow_mut();\n    }));\n    println!(\"{}\", r.is_err());\n}\n", compiles: true, stdout: "true" },
      },
      {
        topic: "smart_pointers", difficulty: 2, kind: "predict", prompt: PRINTS, code: 'let c = std::cell::RefCell::new(1);\nlet _a = c.borrow();\nprintln!("{}", c.try_borrow_mut().is_err());', options: ["true", "false", PANIC], answer: 0,
        explain: L(
          "A shared borrow is alive, so the mutable one fails. `try_borrow_mut` returns Err instead of panicking.",
          "Hay un préstamo compartido vivo, así que el mutable falla. `try_borrow_mut` devuelve Err en lugar de hacer panic.",
          "共有借用が生きているため可変借用は失敗します。`try_borrow_mut` はパニックせず Err を返します。",
        ),
        check: { compiles: true, stdout: "true" },
      },
      {
        topic: "smart_pointers", difficulty: 1, kind: "type", prompt: L("Mutate through & (Copy type)", "Muta a través de & (tipo Copy)", "& 越しに変更する（Copy 型）"),
        code: 'let c = std::cell::___::new(5);\nlet r = &c;\nr.set(10);\nprintln!("{}", c.get());', answer: "Cell",
        explain: L(
          "`Cell` gives interior mutability for Copy types: you modify through `&` by copying values in and out, with no active borrows.",
          "`Cell` da interior mutability para tipos Copy: permite modificar a través de `&` copiando valores dentro y fuera, sin préstamos activos.",
          "`Cell` は Copy 型向けの内部可変性です。値をコピーで出し入れするため、借用なしで `&` 越しに変更できます。",
        ),
        check: { compiles: true, stdout: "10" },
      },
      {
        topic: "smart_pointers", difficulty: 2, kind: "pick", prompt: L("Avoid the child → parent cycle", "Evita el ciclo hijo → padre", "子 → 親の循環参照を避ける"),
        code: "use std::{cell::RefCell, rc};\nstruct Node {\n    parent: rc::___<RefCell<Node>>,\n    children: Vec<rc::Rc<RefCell<Node>>>,\n}", options: ["Weak", "Rc", "Box"], answer: 0,
        explain: L(
          "With `Rc` in both directions the count never reaches 0 and memory leaks. `Weak` doesn't count as an owner and is promoted with `upgrade()`.",
          "Con `Rc` en ambos sentidos el contador nunca llega a 0 y hay fuga. `Weak` no cuenta como dueño y se promueve con `upgrade()`.",
          "双方向に `Rc` を使うとカウントが 0 にならずリークします。`Weak` は所有者として数えられず、`upgrade()` で昇格します。",
        ),
        check: { compiles: true },
      },
      // traits: dyn vs generics
      {
        topic: "traits", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: "trait Duplicate { fn duplicate(&self) -> Self; }\nstruct A;\nimpl Duplicate for A { fn duplicate(&self) -> Self { A } }\nlet v: Vec<Box<dyn Duplicate>> = vec![Box::new(A)];", options: YN, answer: 1,
        explain: L(
          "A method that returns `Self` makes the trait not dyn-compatible: behind `dyn`, the size of Self is unknown.",
          "Un método que devuelve `Self` hace al trait no dyn-compatible: detrás de `dyn` el tamaño de Self es desconocido.",
          "`Self` を返すメソッドがあるとトレイトは dyn 互換になりません。`dyn` の背後では Self のサイズが不明だからです。",
        ),
        check: { compiles: false },
      },
      {
        topic: "traits", difficulty: 3, kind: "type", prompt: L("Exclude the method from the vtable", "Excluye el método del vtable", "メソッドを vtable から除外する"),
        code: "trait Duplicate {\n    fn duplicate(&self) -> Self where Self: ___;\n}\nstruct A;\nimpl Duplicate for A { fn duplicate(&self) -> Self { A } }\nlet v: Vec<Box<dyn Duplicate>> = vec![Box::new(A)];", answer: "Sized",
        explain: L(
          "`where Self: Sized` removes that method from the trait object; the rest of the trait can still be used through `dyn`.",
          "`where Self: Sized` saca ese método del trait object; el resto del trait se puede seguir usando con `dyn`.",
          "`where Self: Sized` でそのメソッドはトレイトオブジェクトから外れ、残りは引き続き `dyn` で使えます。",
        ),
        check: { compiles: true },
      },
      {
        topic: "traits", difficulty: 2, kind: "pick", prompt: L("Display without breaking the orphan rule", "Display sin romper la orphan rule", "孤児ルールに反せず Display を実装"),
        code: 'use std::fmt;\nstruct MyVec(Vec<i32>);\nimpl fmt::Display for ___ {\n    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {\n        write!(f, "v")\n    }\n}\nprintln!("{}", MyVec(vec![]));', options: ["MyVec", "Vec<i32>"], answer: 0,
        explain: L(
          "Orphan rule: you can't implement a foreign trait for a foreign type. The `MyVec` newtype is local, so it's allowed.",
          "Orphan rule: no puedes implementar un trait ajeno para un tipo ajeno. El newtype `MyVec` es local, así que sí se puede.",
          "孤児ルール：外部のトレイトを外部の型に実装することはできません。newtype の `MyVec` はローカルなので可能です。",
        ),
        check: { compiles: true, stdout: "v", wrongFail: true },
      },
      {
        topic: "closures", difficulty: 2, kind: "pick", prompt: L("Bound to call it twice while mutating", "Bound para llamarla dos veces mutando", "変更しつつ 2 回呼ぶための境界"),
        code: 'fn twice<F: ___>(mut f: F) { f(); f(); }\nlet mut n = 0;\ntwice(|| n += 1);\nprintln!("{}", n);', options: ["FnMut()", "Fn()", "FnOnce()"], answer: 0,
        explain: L(
          "The closure mutates what it captures, so it isn't `Fn`; it's called twice, so `FnOnce` isn't enough. `FnMut` is the right bound.",
          "La closure muta lo capturado, así que no es `Fn`; y se llama dos veces, así que `FnOnce` no alcanza. `FnMut` es el bound justo.",
          "キャプチャを変更するので `Fn` ではなく、2 回呼ぶので `FnOnce` では足りません。`FnMut` がちょうどよい境界です。",
        ),
        check: { compiles: true, stdout: "2", wrongFail: true },
      },
      // lifetimes
      {
        topic: "lifetimes", difficulty: 3, kind: "predict", prompt: COMPILES, code: 'fn keep<T: \'static>(t: T) -> T { t }\nlet s = String::from("hello");\nprintln!("{}", keep(s));', options: YN, answer: 0,
        explain: L(
          "`T: 'static` doesn't mean \"lives forever\" but \"holds no non-'static borrows\". An owned String satisfies it.",
          "`T: 'static` no significa \"vive para siempre\" sino \"no contiene préstamos no-'static\". Un String con dueño lo cumple.",
          "`T: 'static` は「永遠に生きる」ではなく「'static でない借用を含まない」という意味です。所有された String は満たします。",
        ),
        check: { compiles: true, stdout: "hello" },
      },
      {
        topic: "lifetimes", difficulty: 2, kind: "predict", prompt: COMPILES, code: 'fn keep<T: \'static>(t: T) -> T { t }\nlet s = String::from("hello");\nlet r = keep(&s);', options: YN, answer: 1,
        explain: L(
          "`&s` borrows a local, so it isn't `'static`. That's why `thread::spawn` rejects capturing references to the stack.",
          "`&s` es un préstamo de un local, no `'static`. Por eso `thread::spawn` rechaza capturar referencias a la pila.",
          "`&s` はローカル変数の借用なので `'static` ではありません。`thread::spawn` がスタックへの参照を拒否するのはこのためです。",
        ),
        check: { compiles: false },
      },
      {
        topic: "lifetimes", difficulty: 3, kind: "type", prompt: L("Tie the output to other, not self", "Liga la salida a other, no a self", "戻り値を self ではなく other に結び付ける"),
        code: "struct Ctx { s: String }\nimpl Ctx {\n    fn pick<'a>(&self, other: &'a str) -> ___ str {\n        other\n    }\n}", answer: "&'a",
        explain: L(
          "Without an annotation, elision ties the output to `&self`, not `other`, and it fails. With `'a` on `other` and the output, the contract is right.",
          "Sin anotar, la elisión liga la salida a `&self`, no a `other`, y no compila. Con `'a` en `other` y en la salida, el contrato es correcto.",
          "注釈がないと戻り値は `other` ではなく `&self` に結び付きエラーになります。`other` と戻り値に `'a` を付ければ正しい契約です。",
        ),
        check: { compiles: true },
      },
      {
        topic: "lifetimes", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: "fn push<'a>(v: &mut Vec<&'a str>, s: &'a str) { v.push(s); }\nlet mut v: Vec<&'static str> = vec![\"hello\"];\nlet s = String::from(\"x\");\npush(&mut v, &s);", options: YN, answer: 1,
        explain: L(
          "`&mut T` is invariant in T: `'a` gets fixed to `'static`, and `&s` doesn't live that long. With `&T` (covariant) it could be shortened.",
          "`&mut T` es invariante en T: `'a` queda fijado a `'static` y `&s` no vive tanto. Con `&T` (covariante) sí se podría acortar.",
          "`&mut T` は T について不変なので `'a` は `'static` に固定され、`&s` はそこまで生きません。共変な `&T` なら短縮できます。",
        ),
        check: { compiles: false },
      },
      // iterators
      {
        topic: "iterators", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'let v: Vec<i32> = vec![1, 2]\n    .into_iter()\n    .map(|x| { print!("m{} ", x); x })\n    .filter(|x| { print!("f{} ", x); true })\n    .collect();',
        options: ["m1 f1 m2 f2", "m1 m2 f1 f2", L("Nothing", "Nada", "何も出力されない")], answer: 0,
        explain: L(
          "Adapters are chained per element: each value goes through the whole chain before the next one is requested.",
          "Los adaptadores se encadenan por elemento: cada valor pasa por toda la cadena antes de pedir el siguiente.",
          "アダプタは要素ごとに連鎖します。各値がチェーン全体を通ってから次の値が要求されます。",
        ),
        check: { compiles: true, stdout: "m1 f1 m2 f2" },
      },
      {
        topic: "iterators", difficulty: 2, kind: "predict", prompt: PRINTS, code: 'let n = (1..).map(|x| x * x).find(|x| *x > 50);\nprintln!("{:?}", n);',
        options: ["Some(64)", L("It hangs", "Se cuelga", "無限ループになる"), "Some(49)"], answer: 0,
        explain: L(
          "The infinite range is lazy and `find` stops at the first match, so it only computes up to 8².",
          "El rango infinito es perezoso y `find` corta en el primer match, así que solo calcula hasta 8².",
          "無限の範囲は遅延評価で、`find` は最初の一致で止まるため 8² までしか計算しません。",
        ),
        check: { compiles: true, stdout: "Some(64)" },
      },
      // memory
      {
        topic: "memory", difficulty: 2, kind: "order", prompt: L("D prints when dropped. Order: a, then b", "D imprime al destruirse. Ordena: a y luego b", "D は破棄時に出力する。a → b の順に"),
        lines: ['let _b = D("b");', 'let _a = D("a");'],
        explain: L(
          "Locals are dropped in reverse order of declaration (like a stack): the last one created is the first one dropped.",
          "Las variables locales se destruyen en orden inverso a su declaración (como una pila): la última en nacer es la primera en morir.",
          "ローカル変数は宣言と逆の順に破棄されます（スタックと同じ）。最後に作られたものが最初に破棄されます。",
        ),
        check: { program: `${D}\nfn main() {\n    let _b = D("b");\n    let _a = D("a");\n}\n`, compiles: true, stdout: "a\nb" },
      },
      {
        topic: "memory", difficulty: 3, kind: "predict", prompt: PRINTS, code: `${D}\nlet _ = D("x");\nprintln!("y");`,
        options: [L("x, then y", "x y luego y", "x の後に y"), L("y, then x", "y y luego x", "y の後に x"), L("only y", "solo y", "y のみ")], answer: 0,
        explain: L(
          "`let _` creates no binding: the value is dropped immediately. `let _x` keeps it alive until the end of scope (useful with Mutex guards).",
          "`let _` no crea binding: el valor se destruye en el acto. `let _x` sí lo mantiene vivo hasta el final del scope (útil con guards de Mutex).",
          "`let _` は束縛を作らないので値は即座に破棄されます。`let _x` ならスコープ終了まで生存します（Mutex ガードで重要）。",
        ),
        check: { compiles: true, stdout: "x\ny" },
      },
      {
        topic: "memory", difficulty: 2, kind: "predict", prompt: PRINTS, code: 'use std::mem::size_of;\nprintln!("{}", size_of::<Option<Box<i32>>>() == size_of::<Box<i32>>());', options: ["true", "false"], answer: 0,
        explain: L(
          "Niche optimization: Box is never null, so None is represented by the null pointer and Option takes no extra space.",
          "Niche optimization: Box nunca es nulo, así que None se representa con el puntero nulo y Option no ocupa más.",
          "ニッチ最適化：Box は決して null にならないため、None は null ポインタで表され、Option にしてもサイズは増えません。",
        ),
        check: { compiles: true, stdout: "true" },
      },
      {
        topic: "memory", difficulty: 2, kind: "predict", prompt: PRINTS, code: 'use std::mem::size_of;\nlet fat = size_of::<&dyn std::fmt::Debug>();\nprintln!("{}", fat == 2 * size_of::<usize>());', options: ["true", "false"], answer: 0,
        explain: L(
          "`&dyn Trait` is a fat pointer: a pointer to the data plus a pointer to the vtable. That's the cost of dynamic dispatch versus generics.",
          "`&dyn Trait` es un fat pointer: puntero al dato más puntero a la vtable. Ese es el costo del dispatch dinámico frente a genéricos.",
          "`&dyn Trait` はデータと vtable への 2 つのポインタからなるファットポインタです。これがジェネリクスに対する動的ディスパッチのコストです。",
        ),
        check: { compiles: true, stdout: "true" },
      },
      // async
      {
        topic: "async", difficulty: 2, kind: "predict", prompt: PRINTS, code: 'let fut = async { println!("inside"); };\nprintln!("outside");\ndrop(fut);',
        options: ["outside", L("inside, then outside", "inside y luego outside", "inside の後に outside"), L("outside, then inside", "outside y luego inside", "outside の後に inside")], answer: 0,
        explain: L(
          "Rust futures are lazy: they don't run until an executor polls them (for example via `.await`).",
          "Los futures en Rust son perezosos: no se ejecutan hasta que un executor los hace `poll` (por ejemplo con `.await`).",
          "Rust の Future は遅延評価です。エグゼキュータが `poll` するまで（例：`.await`）実行されません。",
        ),
        check: { compiles: true, stdout: "outside" },
      },
      {
        topic: "async", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: 'use std::rc::Rc;\nfn assert_send<T: Send>(_: T) {}\nasync fn task() {\n    let r = Rc::new(1);\n    async {}.await;\n    println!("{}", r);\n}\nassert_send(task());', options: YN, answer: 1,
        explain: L(
          "`r` is still alive across the `.await`, so it's stored in the future and makes it non-Send. That's why `tokio::spawn` would reject it.",
          "`r` sigue vivo a través del `.await`, queda dentro del future y lo hace no-Send. Por eso `tokio::spawn` lo rechazaría.",
          "`r` が `.await` をまたいで生存するため Future 内に保持され、Future は Send でなくなります。`tokio::spawn` も拒否します。",
        ),
        check: { compiles: false },
      },
      {
        topic: "async", difficulty: 3, kind: "type", prompt: L("Type of self in poll", "Tipo de self en poll", "poll における self の型"),
        code: "use std::{future::Future, pin::Pin, task::{Context, Poll}};\nstruct Done;\nimpl Future for Done {\n    type Output = u8;\n    fn poll(self: ___<&mut Self>, _cx: &mut Context<'_>) -> Poll<u8> {\n        Poll::Ready(1)\n    }\n}", answer: "Pin",
        explain: L(
          "`poll` takes `Pin<&mut Self>`: it guarantees the future won't move in memory, which self-referential futures require.",
          "`poll` recibe `Pin<&mut Self>`: garantiza que el future no se moverá en memoria, necesario para futures autorreferenciales.",
          "`poll` は `Pin<&mut Self>` を受け取ります。Future がメモリ上で移動しないことを保証し、自己参照的な Future に必要です。",
        ),
        check: { compiles: true },
      },
      // unsafe
      {
        topic: "unsafe_ffi", difficulty: 1, kind: "predict", prompt: COMPILES, code: 'let x = 5;\nlet p = &x as *const i32;\nprintln!("{}", *p);', options: YN, answer: 1,
        explain: L(
          "Creating a raw pointer is safe; dereferencing it requires an `unsafe` block.",
          "Crear un puntero crudo es seguro; desreferenciarlo requiere un bloque `unsafe`.",
          "生ポインタの作成は安全ですが、参照外しには `unsafe` ブロックが必要です。",
        ),
        check: { compiles: false },
      },
      {
        topic: "unsafe_ffi", difficulty: 1, kind: "type", prompt: L("Dereference the raw pointer", "Desreferencia el puntero crudo", "生ポインタを参照外しする"),
        code: 'let x = 5;\nlet p = &x as *const i32;\nlet y = ___ { *p };\nprintln!("{}", y);', answer: "unsafe",
        explain: L(
          "Inside `unsafe` you guarantee the pointer is valid and aligned; the compiler can no longer check it.",
          "Dentro de `unsafe` tú garantizas que el puntero es válido y está alineado; el compilador ya no puede comprobarlo.",
          "`unsafe` 内では、ポインタが有効でアラインされていることを自分で保証します。コンパイラはもう検査できません。",
        ),
        check: { compiles: true, stdout: "5" },
      },
      {
        topic: "unsafe_ffi", difficulty: 2, kind: "predict", prompt: COMPILES, code: "let mut s = String::new();\nunsafe {\n    let a = &mut s;\n    let b = &mut s;\n    a.push('x');\n}", options: YN, answer: 1,
        explain: L(
          "`unsafe` doesn't turn off the borrow checker: it only enables extra operations (raw pointers, unsafe functions, static mut, FFI).",
          "`unsafe` no apaga el borrow checker: solo habilita operaciones extra (punteros crudos, funciones unsafe, static mut, FFI).",
          "`unsafe` は借用チェッカーを無効にしません。生ポインタ、unsafe 関数、static mut、FFI などの追加操作を許すだけです。",
        ),
        check: { compiles: false },
      },
      // errors
      {
        topic: "errors", difficulty: 2, kind: "pick", prompt: L("Generic error type to propagate with ?", "Error genérico para propagar con ?", "? で伝播できる汎用エラー型"),
        code: 'fn run() -> Result<(), Box<dyn ___>> {\n    let n: i32 = "x".parse()?;\n    Ok(())\n}\nprintln!("{}", run().is_err());', options: ["std::error::Error", "std::fmt::Display", "std::fmt::Debug"], answer: 0,
        explain: L(
          "`?` converts any error into `Box<dyn Error>` via `From`, but not into `Box<dyn Display>` or `Debug`. Handy in binaries; libraries prefer their own enum.",
          "`?` convierte cualquier error en `Box<dyn Error>` vía `From`, pero no en `Box<dyn Display>` ni `Debug`. Cómodo en binarios; en librerías, un enum propio.",
          "`?` は `From` でエラーを `Box<dyn Error>` に変換できますが、`Display`/`Debug` には不可。ライブラリでは独自の enum が好まれます。",
        ),
        check: { compiles: true, stdout: "true", wrongFail: true },
      },
    ],
  },
];
