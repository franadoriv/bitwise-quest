import type { ExamDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import {
  compressTask, countVowelsTask, digitSumTask, evalExprTask, finalBalanceTask, fizzBuzzTask, groupByLengthTask,
  parseAgeTask, parseAllTask, rpnTask, statsMonoidTask, wordFreqTask,
} from "./tasks.ts";
import { juniorTraceDebug, midTraceDebug, seniorTraceDebug } from "./trace-debug.ts";

// Entry exams that simulate company screenings for Haskell roles.
// Topics, levels and bank sizes follow docs/research/haskell-curriculum.md ("Entry exams") and
// docs/research/haskell-hiring-assessments.md. Every compile, output or runtime-error claim carries a
// `check` run on GHC 9.8.4: `npm run content:verify -- --lang=haskell --only=exam:`.
// Snippets without a top-level `main` are placed in `main = do`; snippets with declarations or
// imports define `main` themselves. Printed text stays ASCII.

const code = (...lines: string[]) => lines.join("\n");

const PRINTS = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const COMPILES = L("Does it compile (GHC 9.8)?", "¿Compila (GHC 9.8)?", "コンパイルは通る？(GHC 9.8)");
const HAPPENS = L("What happens when it runs?", "¿Qué pasa al ejecutarlo?", "実行するとどうなる？");

export const exams: ExamDef[] = [
  // ─── JUNIOR ───────────────────────────────────────────────────────────────
  {
    slug: "junior",
    level: "junior",
    title: L("Junior Haskell Developer", "Haskell Developer Junior", "ジュニア Haskell 開発者"),
    description: L(
      "Online skills test for a junior Haskell role: expressions, types, lists, pattern matching, recursion, map and filter.",
      "Test en línea para un puesto junior de Haskell: expresiones, tipos, listas, patrones, recursión, map y filter.",
      "ジュニア Haskell 職のオンライン試験：式、型、リスト、パターン、再帰、map と filter。",
    ),
    count: 12,
    passPct: 70,
    secondsPerQuestion: 30,
    codeCount: 1,
    questions: [
      ...juniorTraceDebug,
      countVowelsTask, digitSumTask, fizzBuzzTask, compressTask,
      // basics
      {
        topic: "basics", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: "print (10 - (-2), succ 'a', pred 10)",
        options: ["(12,'b',9)", "(8,'b',9)", "(12,\"b\",9)"], answer: 0,
        explain: L(
          "Negative literals need parentheses: 10 - (-2) is 12. succ and pred give the next and previous value; a Char shows with single quotes.",
          "Los literales negativos van entre paréntesis: 10 - (-2) es 12. succ y pred dan el valor siguiente y el anterior; un Char se muestra con comillas simples.",
          "負の数はかっこで囲む：10 - (-2) は 12。succ と pred は次と前の値。Char は一重引用符で表示。",
        ),
        check: { compiles: true, stdout: "(12,'b',9)" },
      },
      {
        topic: "basics", difficulty: 1, kind: "predict", prompt: COMPILES,
        code: 'putStrLn ("Level " ++ show 3 ++ 1)',
        options: [L("Yes, it prints Level 31", "Sí, imprime Level 31", "はい、Level 31 と表示"), L("No: 1 is a number, not a String", "No: 1 es un número, no un String", "いいえ：1 は数値で String ではない")], answer: 1,
        explain: L(
          "++ joins two lists of the same type. There is no automatic conversion: write show 1 or \"1\" to append it to a String.",
          "++ une dos listas del mismo tipo. No hay conversión automática: escribe show 1 o \"1\" para pegarlo a un String.",
          "++ は同じ型のリスト同士をつなぐ。自動変換はないので show 1 か \"1\" と書こう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "basics", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: "print (7 `div` 2, 7 / 2)",
        options: ["(3,3.5)", "(3.5,3.5)", "(3,3)"], answer: 0,
        explain: L(
          "div is integer division and rounds down; / is fractional division, so 7 / 2 is a Double: 3.5.",
          "div es la división entera y redondea hacia abajo; / es la división fraccionaria, así que 7 / 2 es un Double: 3.5.",
          "div は整数の割り算で切り捨て。/ は小数の割り算なので 7 / 2 は Double の 3.5。",
        ),
        check: { compiles: true, stdout: "(3,3.5)" },
      },
      {
        topic: "basics", difficulty: 1, kind: "type", prompt: L("Complete the if expression", "Completa la expresión if", "if 式を完成させよう"),
        code: 'putStrLn (if 3 > 2 then "big" ___ "small")',
        answer: "else",
        explain: L(
          "In Haskell if is an expression that always returns a value, so else is mandatory and both branches have the same type.",
          "En Haskell if es una expresión que siempre devuelve un valor, así que else es obligatorio y ambas ramas tienen el mismo tipo.",
          "Haskell の if は必ず値を返す式。だから else は必須で、両方の枝は同じ型になる。",
        ),
        check: { compiles: true, stdout: "big" },
      },
      // types
      {
        topic: "types", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: "print (2 ^ 64 :: Integer, 2 ^ 64 :: Int)",
        options: ["(18446744073709551616,0)", "(18446744073709551616,18446744073709551616)", L("Compile error: Int overflow", "Error de compilación: overflow de Int", "コンパイルエラー：Int のオーバーフロー")], answer: 0,
        explain: L(
          "Integer has arbitrary precision. Int is a fixed 64-bit machine integer: it wraps around silently, and 2^64 becomes 0.",
          "Integer tiene precisión arbitraria. Int es un entero de máquina de 64 bits: se desborda en silencio y 2^64 da 0.",
          "Integer は任意精度。Int は 64 ビット固定なので黙って桁あふれし、2^64 は 0 になる。",
        ),
        check: { compiles: true, stdout: "(18446744073709551616,0)" },
      },
      {
        topic: "types", difficulty: 1, kind: "predict", prompt: COMPILES,
        code: code(
          "double :: Int -> Int",
          "double n = n * 2",
          "",
          "main :: IO ()",
          "main = print (double 2.5)",
        ),
        options: [L("Yes, it prints 5.0", "Sí, imprime 5.0", "はい、5.0 と表示"), L("No: 2.5 is not an Int", "No: 2.5 no es un Int", "いいえ：2.5 は Int ではない")], answer: 1,
        explain: L(
          "The signature promises an Int. A literal like 2.5 needs a Fractional type and Int is not one: No instance for 'Fractional Int'.",
          "La firma promete un Int. Un literal como 2.5 necesita un tipo Fractional y Int no lo es: No instance for 'Fractional Int'.",
          "シグネチャは Int を約束している。2.5 は Fractional 型が必要で Int は違うのでエラー。",
        ),
        check: { compiles: false },
      },
      {
        topic: "types", difficulty: 2, kind: "pick", prompt: L("Average a list of Int", "Promedia una lista de Int", "Int のリストの平均を出す"),
        code: code(
          "let xs = [1, 2, 3, 4] :: [Int]",
          "print (fromIntegral (sum xs) / ___ (length xs))",
        ),
        options: ["fromIntegral", "show", "read"], answer: 0,
        explain: L(
          "length returns an Int and / needs a Fractional type. fromIntegral converts any integral number to the numeric type needed.",
          "length devuelve un Int y / necesita un tipo Fractional. fromIntegral convierte cualquier entero al tipo numérico necesario.",
          "length は Int を返し、/ は Fractional 型が必要。fromIntegral が整数を必要な数値型に変換する。",
        ),
        check: { compiles: true, stdout: "2.5", wrongFail: true },
      },
      // lists
      {
        topic: "lists", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: "print (last [1, 2, 3], init [1, 2, 3], splitAt 2 [1, 2, 3, 4])",
        options: ["(3,[1,2],([1,2],[3,4]))", "(3,[2,3],([1,2],[3,4]))", "(1,[1,2],([1],[2,3,4]))"], answer: 0,
        explain: L(
          "last takes the final element, init drops it, and splitAt n returns the first n elements and the rest as a pair.",
          "last toma el último elemento, init lo quita y splitAt n devuelve los primeros n elementos y el resto como un par.",
          "last は最後の要素、init はそれ以外。splitAt n は先頭 n 個と残りのペアを返す。",
        ),
        check: { compiles: true, stdout: "(3,[1,2],([1,2],[3,4]))" },
      },
      {
        topic: "lists", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: "print ([1, 3 .. 9], ['a' .. 'e'])",
        options: ["([1,3,5,7,9],\"abcde\")", "([1,3,9],['a','e'])", "([1,2,3,4,5,6,7,8,9],\"abcde\")"], answer: 0,
        explain: L(
          "A range with two starting values uses their step: 1, 3 .. 9 counts by 2. A String is a [Char], so a Char range prints as text.",
          "Un rango con dos valores iniciales usa su paso: 1, 3 .. 9 cuenta de 2 en 2. Un String es un [Char], así que un rango de Char se imprime como texto.",
          "最初の2つの値で歩幅が決まる：1, 3 .. 9 は2ずつ。String は [Char] なので Char の範囲は文字列で表示。",
        ),
        check: { compiles: true, stdout: "([1,3,5,7,9],\"abcde\")" },
      },
      {
        topic: "lists", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: "print [x * x | x <- [1 .. 5], odd x]",
        options: ["[1,9,25]", "[1,4,9,16,25]", "[4,16]"], answer: 0,
        explain: L(
          "A list comprehension draws x from the list, keeps it only if odd x holds, and collects x * x for each kept value.",
          "Una lista por comprensión toma x de la lista, lo conserva solo si odd x se cumple y recoge x * x por cada valor conservado.",
          "内包表記は x を順に取り、odd x を満たすものだけ残して x * x を集める。",
        ),
        check: { compiles: true, stdout: "[1,9,25]" },
      },
      {
        topic: "lists", difficulty: 1, kind: "pick", prompt: L("Put 1 at the front of the list", "Pon 1 al frente de la lista", "1 をリストの先頭に付ける"),
        code: "print (1 ___ [2, 3])",
        options: [":", "++", "."], answer: 0,
        explain: L(
          ": (cons) puts one element in front of a list. ++ joins two lists, so it would need [1] ++ [2, 3].",
          ": (cons) pone un elemento delante de una lista. ++ une dos listas, así que haría falta [1] ++ [2, 3].",
          ": (cons) は要素をリストの先頭に付ける。++ はリスト同士なので [1] ++ [2, 3] が必要。",
        ),
        check: { compiles: true, stdout: "[1,2,3]", wrongFail: true },
      },
      // patterns
      {
        topic: "patterns", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code(
          "f :: Int -> String",
          'f 1 = "one"',
          "",
          "main :: IO ()",
          "main = putStrLn (f 2)",
        ),
        options: [
          L("It prints an empty line", "Imprime una línea vacía", "空行が表示される"),
          L("Compile error: missing case", "Error de compilación: falta un caso", "コンパイルエラー：ケース不足"),
          L("Runtime crash: Non-exhaustive patterns", "Falla en ejecución: Non-exhaustive patterns", "実行時エラー：Non-exhaustive patterns"),
        ], answer: 2,
        explain: L(
          "Missing cases compile (only -Wall warns). Calling f with a value no equation matches crashes: Non-exhaustive patterns in function f.",
          "Los casos faltantes compilan (solo -Wall avisa). Llamar a f con un valor que ninguna ecuación cubre falla: Non-exhaustive patterns in function f.",
          "ケース不足でもコンパイルは通る（-Wall で警告のみ）。合わない値で呼ぶと実行時に落ちる。",
        ),
        check: { compiles: true, throws: "Non-exhaustive patterns in function f" },
      },
      {
        topic: "patterns", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "let xs = [1, 2, 3] :: [Int]",
          "putStrLn (case xs of",
          '  [] -> "empty"',
          '  [x] -> "one: " ++ show x',
          '  (x:y:_) -> "starts " ++ show (x + y))',
        ),
        options: ["empty", "one: 1", "starts 3"], answer: 2,
        explain: L(
          "Alternatives are tried top to bottom. [x] matches only one-element lists; (x:y:_) matches two or more and binds the first two.",
          "Las alternativas se prueban de arriba abajo. [x] solo cubre listas de un elemento; (x:y:_) cubre dos o más y liga los dos primeros.",
          "上から順に試す。[x] は要素1つだけ。(x:y:_) は2つ以上にマッチし先頭2つを束縛する。",
        ),
        check: { compiles: true, stdout: "starts 3" },
      },
      {
        topic: "patterns", difficulty: 1, kind: "predict", prompt: HAPPENS,
        code: "print (head ([] :: [Int]))",
        options: [
          L("It prints 0", "Imprime 0", "0 が表示される"),
          L("It prints []", "Imprime []", "[] が表示される"),
          L("Runtime crash: empty list", "Falla en ejecución: lista vacía", "実行時エラー：空リスト"),
        ], answer: 2,
        explain: L(
          "head is partial: on [] it crashes with Prelude.head: empty list. Match the list with a pattern or use a function returning Maybe.",
          "head es parcial: con [] falla con Prelude.head: empty list. Usa un patrón sobre la lista o una función que devuelva Maybe.",
          "head は部分関数で [] だと落ちる。パターンマッチか Maybe を返す関数を使おう。",
        ),
        check: { compiles: true, throws: "Prelude.head: empty list" },
      },
      {
        topic: "patterns", difficulty: 1, kind: "type", prompt: L("Add the catch-all guard", "Agrega la guarda por defecto", "最後のガードを書こう"),
        code: code(
          "grade :: Int -> String",
          "grade n",
          '  | n >= 90 = "A"',
          '  | n >= 50 = "B"',
          '  | ___ = "C"',
          "",
          "main :: IO ()",
          "main = putStrLn (grade 30)",
        ),
        answer: "otherwise",
        explain: L(
          "Guards are checked top to bottom. otherwise is just True, so the last guard always matches when the others fail.",
          "Las guardas se revisan de arriba abajo. otherwise es simplemente True, así que la última guarda cubre todo lo demás.",
          "ガードは上から順に調べる。otherwise はただの True なので残り全部にマッチする。",
        ),
        check: { compiles: true, stdout: "C" },
      },
      // recursion
      {
        topic: "recursion", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code(
          "countdown :: Int -> [Int]",
          "countdown 0 = [0]",
          "countdown n = n : countdown (n - 1)",
          "",
          "main :: IO ()",
          "main = print (countdown 3)",
        ),
        options: ["[3,2,1,0]", "[3,2,1]", "[0,1,2,3]"], answer: 0,
        explain: L(
          "Each call puts n in front and recurses on n - 1 until the base case countdown 0 = [0] ends the list.",
          "Cada llamada pone n al frente y se llama con n - 1 hasta que el caso base countdown 0 = [0] cierra la lista.",
          "毎回 n を先頭に付けて n - 1 で再帰し、基底ケース countdown 0 = [0] で終わる。",
        ),
        check: { compiles: true, stdout: "[3,2,1,0]" },
      },
      {
        topic: "recursion", difficulty: 2, kind: "order", prompt: L("Order the equations so it terminates", "Ordena las ecuaciones para que termine", "止まるように式を並べよう"),
        lines: ["collatz 1 = 0", "collatz n", "  | even n = 1 + collatz (n `div` 2)", "  | otherwise = 1 + collatz (3 * n + 1)"],
        explain: L(
          "Equations are tried in order: the base case collatz 1 must come before the general n, and otherwise must be the last guard.",
          "Las ecuaciones se prueban en orden: el caso base collatz 1 va antes del caso general n, y otherwise debe ser la última guarda.",
          "式は上から試される。基底ケース collatz 1 は一般の n より前、otherwise は最後のガード。",
        ),
        check: {
          compiles: true, stdout: "[0,8]",
          program: code(
            "collatz :: Int -> Int",
            "collatz 1 = 0",
            "collatz n",
            "  | even n = 1 + collatz (n `div` 2)",
            "  | otherwise = 1 + collatz (3 * n + 1)",
            "",
            "main :: IO ()",
            "main = print (map collatz [1, 6])",
          ),
        },
      },
      {
        topic: "recursion", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "rev :: [a] -> [a]",
          "rev = go []",
          "  where",
          "    go acc [] = acc",
          "    go acc (x:xs) = go (x : acc) xs",
          "",
          "main :: IO ()",
          "main = print (rev [1, 2, 3])",
        ),
        options: ["[3,2,1]", "[1,2,3]", "[]"], answer: 0,
        explain: L(
          "The helper go carries an accumulator: each step moves the head onto acc, so the list comes out reversed when the input is empty.",
          "El ayudante go lleva un acumulador: cada paso mueve la cabeza a acc, así que la lista sale invertida cuando la entrada se vacía.",
          "補助関数 go は累積引数を持つ。先頭を acc に積むので、入力が空になると逆順で出てくる。",
        ),
        check: { compiles: true, stdout: "[3,2,1]" },
      },
      // hof
      {
        topic: "hof", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: 'print (map length ["a", "bb", "ccc"], filter even [1 .. 6])',
        options: ["([1,2,3],[2,4,6])", "(6,[2,4,6])", "([1,2,3],[1,3,5])"], answer: 0,
        explain: L(
          "map applies a function to every element; filter keeps the elements for which the predicate returns True.",
          "map aplica una función a cada elemento; filter conserva los elementos para los que el predicado da True.",
          "map は全要素に関数を適用し、filter は述語が True になる要素だけ残す。",
        ),
        check: { compiles: true, stdout: "([1,2,3],[2,4,6])" },
      },
      {
        topic: "hof", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'print (map fst (filter (even . snd) (zip "abcd" [1 ..])))',
        options: ["\"bd\"", "\"ac\"", "[2,4]"], answer: 0,
        explain: L(
          "zip pairs each letter with 1, 2, 3, 4 (it stops at the shorter list). Pairs with an even number are kept, then fst takes the letters.",
          "zip empareja cada letra con 1, 2, 3, 4 (se detiene en la lista más corta). Se conservan los pares con número par y fst toma las letras.",
          "zip で文字と 1,2,3,4 を組にし（短い方で止まる）、偶数の組だけ残して fst で文字を取る。",
        ),
        check: { compiles: true, stdout: "\"bd\"" },
      },
      {
        topic: "hof", difficulty: 1, kind: "pick", prompt: L("Keep only values above 2", "Conserva solo valores mayores que 2", "2 より大きい値だけ残す"),
        code: "print (___ (\\x -> x > 2) [1, 2, 3, 4])",
        options: ["filter", "map", "zip"], answer: 0,
        explain: L(
          "filter keeps elements where the lambda returns True: [3,4]. map would also compile but returns [False,False,True,True].",
          "filter conserva los elementos donde la lambda da True: [3,4]. map también compila, pero devuelve [False,False,True,True].",
          "filter はラムダが True の要素を残す：[3,4]。map もコンパイルできるが Bool のリストになる。",
        ),
        check: { compiles: true, stdout: "[3,4]" },
      },
      {
        topic: "hof", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: "print (zipWith (*) [1, 2, 3] [10, 20])",
        options: ["[10,40]", "[10,40,3]", "[10,40,0]"], answer: 0,
        explain: L(
          "zipWith combines elements pairwise with the function and stops at the end of the shorter list, so the 3 is dropped.",
          "zipWith combina los elementos por pares con la función y se detiene al final de la lista más corta, así que el 3 se descarta.",
          "zipWith は要素を組ごとに関数で合わせ、短い方のリストで止まるので 3 は捨てられる。",
        ),
        check: { compiles: true, stdout: "[10,40]" },
      },
    ],
  },

  // ─── MID ──────────────────────────────────────────────────────────────────
  {
    slug: "mid",
    level: "mid",
    title: L("Mid-level Haskell Developer", "Haskell Developer Semi Senior", "中級 Haskell 開発者"),
    description: L(
      "Mid-level Haskell screen: currying, folds, laziness, Maybe/Either, ADTs, type classes, Functor, Data.Map.",
      "Entrevista Haskell semi senior: currying, folds, pereza, Maybe/Either, ADTs, type classes, Functor y Data.Map.",
      "中級 Haskell 職の技術面接：カリー化、fold、遅延評価、Maybe/Either、ADT、型クラス、Functor、Map。",
    ),
    count: 14,
    passPct: 70,
    secondsPerQuestion: 40,
    codeCount: 2,
    questions: [
      ...midTraceDebug,
      wordFreqTask, parseAgeTask, finalBalanceTask, evalExprTask,
      // currying
      {
        topic: "currying", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: "print (map (2 ^) [1, 2, 3], map (^ 2) [1, 2, 3])",
        options: ["([2,4,8],[1,4,9])", "([1,4,9],[2,4,8])", "([2,4,8],[2,4,8])"], answer: 0,
        explain: L(
          "A section fixes one side of an operator: (2 ^) is \\x -> 2 ^ x, while (^ 2) is \\x -> x ^ 2.",
          "Una sección fija un lado del operador: (2 ^) es \\x -> 2 ^ x, mientras que (^ 2) es \\x -> x ^ 2.",
          "セクションは演算子の片側を固定する：(2 ^) は \\x -> 2 ^ x、(^ 2) は \\x -> x ^ 2。",
        ),
        check: { compiles: true, stdout: "([2,4,8],[1,4,9])" },
      },
      {
        topic: "currying", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: "print (map (-1) [5, 6])",
        options: [L("Yes, it prints [4,5]", "Sí, imprime [4,5]", "はい、[4,5] と表示"), L("No: (-1) is a number, not a function", "No: (-1) es un número, no una función", "いいえ：(-1) は数で関数ではない")], answer: 1,
        explain: L(
          "(-1) is the negative literal, not a section. To subtract 1 from each element write subtract 1 or (+ (-1)).",
          "(-1) es el literal negativo, no una sección. Para restar 1 a cada elemento escribe subtract 1 o (+ (-1)).",
          "(-1) はセクションではなく負の数。各要素から1引くなら subtract 1 か (+ (-1)) と書く。",
        ),
        check: { compiles: false },
      },
      {
        topic: "currying", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "let f = negate . (* 2) . (+ 1)",
          "print (f 3)",
        ),
        options: ["-8", "-7", "8"], answer: 0,
        explain: L(
          "(.) composes right to left: first (+ 1) gives 4, then (* 2) gives 8, then negate gives -8.",
          "(.) compone de derecha a izquierda: primero (+ 1) da 4, luego (* 2) da 8 y negate da -8.",
          "(.) は右から左へ合成：(+ 1) で 4、(* 2) で 8、negate で -8。",
        ),
        check: { compiles: true, stdout: "-8" },
      },
      // folds
      {
        topic: "folds", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: "print (foldr (-) 0 [1, 2, 3], foldl (-) 0 [1, 2, 3])",
        options: ["(2,-6)", "(-6,2)", "(-6,-6)"], answer: 0,
        explain: L(
          "foldr groups to the right: 1 - (2 - (3 - 0)) = 2. foldl groups to the left: ((0 - 1) - 2) - 3 = -6.",
          "foldr agrupa a la derecha: 1 - (2 - (3 - 0)) = 2. foldl agrupa a la izquierda: ((0 - 1) - 2) - 3 = -6.",
          "foldr は右結合：1 - (2 - (3 - 0)) = 2。foldl は左結合：((0 - 1) - 2) - 3 = -6。",
        ),
        check: { compiles: true, stdout: "(2,-6)" },
      },
      {
        topic: "folds", difficulty: 1, kind: "predict", prompt: COMPILES,
        code: "print (foldl' (+) 0 [1 .. 10])",
        options: [L("Yes, it prints 55", "Sí, imprime 55", "はい、55 と表示"), L("No: foldl' is not in scope", "No: foldl' no está en el ámbito", "いいえ：foldl' がスコープにない")], answer: 1,
        explain: L(
          "In GHC 9.8 foldl' is not in the Prelude (it arrived in GHC 9.10). Add import Data.List (foldl').",
          "En GHC 9.8 foldl' no está en el Prelude (llegó en GHC 9.10). Agrega import Data.List (foldl').",
          "GHC 9.8 の Prelude に foldl' はない（9.10 から）。import Data.List (foldl') を追加しよう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "folds", difficulty: 2, kind: "pick", prompt: L("Sum ten million numbers without blowing memory", "Suma diez millones de números sin agotar la memoria", "1000万個をメモリを食わずに合計"),
        code: code(
          "import Data.List (foldl')",
          "",
          "main :: IO ()",
          "main = print (___ (+) 0 [1 .. 10000000 :: Int])",
        ),
        options: ["foldl'", "foldl", "foldr"], answer: 0,
        explain: L(
          "Lazy foldl builds a chain of unevaluated (+) thunks before adding anything. foldl' forces the accumulator at every step.",
          "El foldl perezoso arma una cadena de thunks (+) sin evaluar antes de sumar nada. foldl' fuerza el acumulador en cada paso.",
          "遅延の foldl は足す前に (+) のサンクを積み上げる。foldl' は毎回累積値を評価する。",
        ),
        check: { compiles: true, stdout: "50000005000000" },
      },
      // laziness
      {
        topic: "laziness", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: "print (take 3 (map (* 10) [1 ..]), takeWhile (<= 10) [0, 2 ..])",
        options: ["([10,20,30],[0,2,4,6,8,10])", "([10,20,30],[0,2,4,6,8])", L("It never ends: the lists are infinite", "Nunca termina: las listas son infinitas", "終わらない：リストが無限")], answer: 0,
        explain: L(
          "Laziness computes only what is demanded: take 3 needs three elements and takeWhile stops at the first value above 10.",
          "La pereza calcula solo lo que se pide: take 3 necesita tres elementos y takeWhile se detiene en el primer valor mayor que 10.",
          "遅延評価は必要な分だけ計算する。take 3 は3個、takeWhile は10を超えた所で止まる。",
        ),
        check: { compiles: true, stdout: "([10,20,30],[0,2,4,6,8,10])" },
      },
      {
        topic: "laziness", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: "print (length [1, undefined, 3])",
        options: [L("It prints 3", "Imprime 3", "3 が表示される"), L("Crash: Prelude.undefined", "Falla: Prelude.undefined", "エラー：Prelude.undefined"), L("Compile error", "Error de compilación", "コンパイルエラー")], answer: 0,
        explain: L(
          "length only walks the list's spine; it never looks at the elements, so the undefined inside is never evaluated.",
          "length solo recorre la estructura de la lista; nunca mira los elementos, así que el undefined de adentro nunca se evalúa.",
          "length はリストの骨組みをたどるだけで要素を見ないので、中の undefined は評価されない。",
        ),
        check: { compiles: true, stdout: "3" },
      },
      {
        topic: "laziness", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code(
          'let pair = (error "boom", 2) :: (Int, Int)',
          "print (snd pair)",
          "print (fst pair)",
        ),
        options: [
          L("It prints 2, then crashes with boom", "Imprime 2 y luego falla con boom", "2 を表示してから boom で落ちる"),
          L("It crashes with boom before printing", "Falla con boom antes de imprimir", "何も表示せず boom で落ちる"),
          L("Compile error", "Error de compilación", "コンパイルエラー"),
        ], answer: 0,
        explain: L(
          "Building the pair evaluates nothing. snd never touches the error; only printing fst forces it, and that is when boom fires.",
          "Crear el par no evalúa nada. snd nunca toca el error; solo imprimir fst lo fuerza, y ahí salta boom.",
          "ペアを作っても何も評価されない。snd は error に触れず、fst を表示した時に boom になる。",
        ),
        check: { compiles: true, throws: "boom" },
      },
      // maybe_either
      {
        topic: "maybe_either", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: 'print (lookup 2 [(1, "one"), (2, "two")], lookup 3 [(1, "one")])',
        options: ["(Just \"two\",Nothing)", "(\"two\",\"\")", "(Just \"two\",Just \"\")"], answer: 0,
        explain: L(
          "lookup returns Maybe: Just the value when the key is found, Nothing otherwise. There is no null and no crash.",
          "lookup devuelve Maybe: Just el valor si encuentra la clave y Nothing si no. No hay null ni falla.",
          "lookup は Maybe を返す。見つかれば Just 値、なければ Nothing。null もクラッシュもない。",
        ),
        check: { compiles: true, stdout: "(Just \"two\",Nothing)" },
      },
      {
        topic: "maybe_either", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'print (either show (map succ) (Right "abc" :: Either Int String))',
        options: ["\"bcd\"", "\"abc\"", "\"Right abc\""], answer: 0,
        explain: L(
          "either takes one function per side: show for Left, map succ for Right. The value is a Right, so every letter moves one forward.",
          "either recibe una función por lado: show para Left y map succ para Right. El valor es Right, así que cada letra avanza una.",
          "either は左右それぞれの関数を取る。値は Right なので map succ で各文字が1つ進む。",
        ),
        check: { compiles: true, stdout: "\"bcd\"" },
      },
      {
        topic: "maybe_either", difficulty: 1, kind: "type", prompt: L("Return no value for an empty list", "Devuelve ningún valor para la lista vacía", "空リストなら値なしを返す"),
        code: code(
          "safeHead :: [a] -> Maybe a",
          "safeHead [] = ___",
          "safeHead (x:_) = Just x",
          "",
          "main :: IO ()",
          'main = print (safeHead "owl", safeHead "")',
        ),
        answer: "Nothing",
        explain: L(
          "A total version of head returns Maybe a: Nothing for [] and Just x otherwise, so the caller must handle both cases.",
          "Una versión total de head devuelve Maybe a: Nothing para [] y Just x en otro caso, así que quien llama debe cubrir ambos.",
          "head の全域版は Maybe a を返す：[] なら Nothing、それ以外は Just x。呼び手は両方を扱う。",
        ),
        check: { compiles: true, stdout: "(Just 'o',Nothing)" },
      },
      // adts
      {
        topic: "adts", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "data Hero = Hero { name :: String, hp :: Int } deriving Show",
          "",
          "main :: IO ()",
          "main = do",
          '  let h = Hero "Bo" 3',
          "  print (h { hp = 9 }, hp h)",
        ),
        options: ["(Hero {name = \"Bo\", hp = 9},3)", "(Hero {name = \"Bo\", hp = 9},9)", "(Hero \"Bo\" 9,3)"], answer: 0,
        explain: L(
          "Record update builds a new value with hp changed; h itself is immutable and still has hp 3. Derived Show prints the field names.",
          "La actualización de record crea un valor nuevo con hp cambiado; h es inmutable y sigue con hp 3. El Show derivado imprime los campos.",
          "レコード更新は hp を変えた新しい値を作る。h は不変で hp は 3 のまま。導出 Show はフィールド名も表示。",
        ),
        check: { compiles: true, stdout: "(Hero {name = \"Bo\", hp = 9},3)" },
      },
      {
        topic: "adts", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "data Color = Red | Green | Blue deriving (Show, Eq, Ord, Enum, Bounded)",
          "",
          "main :: IO ()",
          "main = print (maximum [Green, Red, Blue], [minBound .. maxBound :: Color])",
        ),
        options: ["(Blue,[Red,Green,Blue])", "(Green,[Red,Green,Blue])", "(Blue,[Green,Red,Blue])"], answer: 0,
        explain: L(
          "Derived Ord and Enum follow declaration order: Red < Green < Blue. Bounded gives minBound Red and maxBound Blue.",
          "Ord y Enum derivados siguen el orden de declaración: Red < Green < Blue. Bounded da minBound Red y maxBound Blue.",
          "導出した Ord と Enum は宣言順：Red < Green < Blue。Bounded で最小 Red、最大 Blue。",
        ),
        check: { compiles: true, stdout: "(Blue,[Red,Green,Blue])" },
      },
      {
        topic: "adts", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code(
          "data Shape = Circle { radius :: Double } | Square { side :: Double }",
          "",
          "main :: IO ()",
          "main = print (radius (Square 2))",
        ),
        options: [
          L("It prints 2.0", "Imprime 2.0", "2.0 が表示される"),
          L("Compile error: Square has no radius", "Error de compilación: Square no tiene radius", "コンパイルエラー：Square に radius はない"),
          L("Runtime crash: No match in record selector", "Falla en ejecución: No match in record selector", "実行時エラー：No match in record selector"),
        ], answer: 2,
        explain: L(
          "A field shared by only some constructors makes a partial selector: it type-checks, then crashes on a Square. Pattern match instead.",
          "Un campo que solo tienen algunos constructores crea un selector parcial: compila y luego falla con un Square. Mejor usa un patrón.",
          "一部の構築子だけのフィールドは部分的なセレクタ。型は通るが Square で落ちる。パターンで分けよう。",
        ),
        check: { compiles: true, throws: "No match in record selector radius" },
      },
      // typeclasses
      {
        topic: "typeclasses", difficulty: 1, kind: "predict", prompt: COMPILES,
        code: code(
          "data Owl = Owl String",
          "",
          "main :: IO ()",
          'main = print (Owl "Lambo")',
        ),
        options: [L("Yes, it prints Owl \"Lambo\"", "Sí, imprime Owl \"Lambo\"", "はい、Owl \"Lambo\" と表示"), L("No: Owl has no Show instance", "No: Owl no tiene instancia de Show", "いいえ：Owl に Show インスタンスがない")], answer: 1,
        explain: L(
          "print needs Show. A new type gets no instances for free: add deriving Show or write instance Show Owl.",
          "print necesita Show. Un tipo nuevo no trae instancias gratis: agrega deriving Show o escribe instance Show Owl.",
          "print には Show が必要。新しい型は自動ではインスタンスを持たない。deriving Show を付けよう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "typeclasses", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "class Greeter a where",
          "  hello :: a -> String",
          '  hello _ = "hello"',
          "  shout :: a -> String",
          '  shout x = hello x ++ "!"',
          "",
          "data Cat = Cat",
          "instance Greeter Cat where",
          '  hello _ = "meow"',
          "",
          "main = putStrLn (shout Cat)",
        ),
        options: ["meow!", "hello!", "meow"], answer: 0,
        explain: L(
          "Cat keeps the default shout but overrides hello. The default shout calls hello on Cat, which is now meow.",
          "Cat conserva el shout por defecto pero redefine hello. El shout por defecto llama al hello de Cat, que ahora es meow.",
          "Cat は shout の既定実装を使い hello だけ上書き。既定の shout は Cat の hello（meow）を呼ぶ。",
        ),
        check: { compiles: true, stdout: "meow!" },
      },
      {
        topic: "typeclasses", difficulty: 2, kind: "pick", prompt: L("A zero-cost wrapper with its own type", "Un envoltorio sin costo con tipo propio", "コストなしで別の型を作る"),
        code: code(
          "___ UserId = UserId Int deriving (Show, Eq)",
          "",
          "main :: IO ()",
          "main = print (UserId 7)",
        ),
        options: ["newtype", "type", "class"], answer: 0,
        explain: L(
          "newtype wraps one field in a distinct type with no runtime cost. type only makes an alias, so it cannot have a constructor.",
          "newtype envuelve un campo en un tipo distinto sin costo en ejecución. type solo crea un alias, así que no puede tener constructor.",
          "newtype は1つのフィールドを実行時コストなしで別の型に包む。type は別名だけで構築子を持てない。",
        ),
        check: { compiles: true, stdout: "UserId 7", wrongFail: true },
      },
      {
        topic: "typeclasses", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "data Coin = Heads | Tails",
          "",
          "instance Show Coin where",
          '  show Heads = "H"',
          '  show Tails = "T"',
          "",
          "main :: IO ()",
          "main = print [Heads, Tails]",
        ),
        options: ["[H,T]", "[Heads,Tails]", "[\"H\",\"T\"]"], answer: 0,
        explain: L(
          "A hand-written Show instance controls how values print. The list instance reuses it for each element, with no extra quotes.",
          "Una instancia Show escrita a mano controla cómo se imprimen los valores. La instancia de listas la usa en cada elemento, sin comillas extra.",
          "手書きの Show インスタンスで表示を決められる。リストは各要素にそれを使い、引用符は付かない。",
        ),
        check: { compiles: true, stdout: "[H,T]" },
      },
      // functors
      {
        topic: "functors", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: 'print (fmap (* 2) (Left "e" :: Either String Int), fmap (* 2) (Just 4))',
        options: ["(Left \"e\",Just 8)", "(Left \"ee\",Just 8)", "(Right 0,Just 8)"], answer: 0,
        explain: L(
          "fmap transforms the value inside without opening the box. A Left is an error side, so fmap leaves it untouched.",
          "fmap transforma el valor de adentro sin abrir la caja. Un Left es el lado del error, así que fmap lo deja igual.",
          "fmap は箱を開けずに中の値を変える。Left はエラー側なので fmap はそのまま残す。",
        ),
        check: { compiles: true, stdout: "(Left \"e\",Just 8)" },
      },
      {
        topic: "functors", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: "print ((+) <$> Just 3 <*> Just 4, (+) <$> Just 3 <*> Nothing)",
        options: ["(Just 7,Nothing)", "(Just 7,Just 3)", "(7,0)"], answer: 0,
        explain: L(
          "<$> puts (+) inside the Maybe and <*> applies it to the next Maybe. If any argument is Nothing, the result is Nothing.",
          "<$> mete (+) dentro del Maybe y <*> lo aplica al siguiente Maybe. Si algún argumento es Nothing, el resultado es Nothing.",
          "<$> で (+) を Maybe に入れ、<*> で次の Maybe に適用。どれかが Nothing なら結果も Nothing。",
        ),
        check: { compiles: true, stdout: "(Just 7,Nothing)" },
      },
      {
        topic: "functors", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: "print (sequenceA [[1, 2], [3]], pure 5 :: [Int])",
        options: ["([[1,3],[2,3]],[5])", "([[1,2,3]],[5])", "([[1,2],[3]],5)"], answer: 0,
        explain: L(
          "For lists, sequenceA picks one element from each list in every combination. pure puts one value in the minimal context: [5].",
          "En listas, sequenceA toma un elemento de cada lista en todas las combinaciones. pure pone un valor en el contexto mínimo: [5].",
          "リストの sequenceA は各リストから1つずつ選ぶ全組み合わせ。pure は最小の文脈 [5] に入れる。",
        ),
        check: { compiles: true, stdout: "([[1,3],[2,3]],[5])" },
      },
      // containers
      {
        topic: "containers", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "import qualified Data.Map as M",
          "",
          "main :: IO ()",
          "main = do",
          '  let m = M.fromList [("b", 2), ("a", 1)]',
          '  print (M.keys m, M.elems m, M.member "b" m)',
        ),
        options: ["([\"a\",\"b\"],[1,2],True)", "([\"b\",\"a\"],[2,1],True)", "([\"a\",\"b\"],[1,2],Just 2)"], answer: 0,
        explain: L(
          "Data.Map is a balanced tree ordered by key, so keys and elems always come out sorted by key, not in insertion order.",
          "Data.Map es un árbol balanceado ordenado por clave, así que keys y elems salen siempre ordenados por clave, no por inserción.",
          "Data.Map はキー順の平衡木。keys と elems は挿入順ではなく常にキー順で出てくる。",
        ),
        check: { compiles: true, stdout: "([\"a\",\"b\"],[1,2],True)" },
      },
      {
        topic: "containers", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: code(
          "import qualified Data.Map as M",
          "",
          "main :: IO ()",
          "main = do",
          '  let hp = M.fromList [("owl", 3), ("cat", 9)] :: M.Map String Int',
          '  print (M.lookup "dog" hp)',
          '  print (hp M.! "dog")',
        ),
        options: [
          L("Nothing, then a crash: key not in map", "Nothing y luego falla: clave ausente", "Nothing の後、キーなしで落ちる"),
          L("Nothing twice", "Nothing dos veces", "Nothing が2回"),
          L("0, then Nothing", "0 y luego Nothing", "0 の後に Nothing"),
        ], answer: 0,
        explain: L(
          "M.lookup is total and returns Maybe. M.! is partial: a missing key crashes with Map.!: given key is not an element in the map.",
          "M.lookup es total y devuelve Maybe. M.! es parcial: una clave ausente falla con Map.!: given key is not an element in the map.",
          "M.lookup は全域で Maybe を返す。M.! は部分関数で、キーがないと実行時に落ちる。",
        ),
        check: { compiles: true, throws: "Map.!: given key is not an element in the map" },
      },
    ],
  },

  // ─── SENIOR ───────────────────────────────────────────────────────────────
  {
    slug: "senior",
    level: "senior",
    title: L("Senior Haskell Developer", "Haskell Developer Senior", "シニア Haskell 開発者"),
    description: L(
      "Senior Haskell screen: strictness, type class design, monads, IO and exceptions, mtl, GADTs, STM and testing.",
      "Entrevista Haskell senior: estrictez, diseño de type classes, mónadas, IO y excepciones, mtl, GADTs, STM y tests.",
      "シニア Haskell 面接：正格性、型クラス設計、モナド、IO と例外、mtl、GADT、STM、テスト。",
    ),
    count: 15,
    passPct: 75,
    secondsPerQuestion: 50,
    codeCount: 2,
    questions: [
      ...seniorTraceDebug,
      statsMonoidTask, parseAllTask, groupByLengthTask, rpnTask,
      // laziness
      {
        topic: "laziness", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'putStrLn ([1, undefined :: Int] `seq` "whnf")',
        options: ["whnf", L("Crash: Prelude.undefined", "Falla: Prelude.undefined", "エラー：Prelude.undefined")], answer: 0,
        explain: L(
          "seq only evaluates to weak head normal form: for a list that is the first cons cell. The elements are never touched.",
          "seq solo evalúa hasta forma normal débil de cabeza: en una lista es la primera celda cons. Los elementos no se tocan.",
          "seq は WHNF までしか評価しない。リストなら最初の cons セルだけで、要素には触れない。",
        ),
        check: { compiles: true, stdout: "whnf" },
      },
      {
        topic: "laziness", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "import Control.DeepSeq (deepseq)",
          "import Control.Exception",
          "",
          "main :: IO ()",
          "main = do",
          '  r <- try (evaluate ([1, undefined :: Int] `deepseq` "forced")) :: IO (Either SomeException String)',
          '  putStrLn (either (const "hit undefined") id r)',
        ),
        options: ["forced", "hit undefined"], answer: 1,
        explain: L(
          "deepseq evaluates to normal form, walking into every element, so it reaches undefined. try catches that exception as a Left.",
          "deepseq evalúa hasta forma normal y entra en cada elemento, así que llega al undefined. try atrapa esa excepción como Left.",
          "deepseq は正規形まで全要素を評価するので undefined に当たる。try がその例外を Left で受ける。",
        ),
        check: { compiles: true, stdout: "hit undefined" },
      },
      {
        topic: "laziness", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code(
          "data P = P !Int Int",
          "",
          "main :: IO ()",
          "main = do",
          "  print (case P 1 undefined of P a _ -> a)",
          "  print (case P undefined 1 of P _ b -> b)",
        ),
        options: [
          L("1, then a crash: Prelude.undefined", "1 y luego falla: Prelude.undefined", "1 の後 Prelude.undefined で落ちる"),
          L("1, then 1", "1 y luego 1", "1 と 1"),
          L("A crash before printing anything", "Falla antes de imprimir nada", "何も表示せずに落ちる"),
        ], answer: 0,
        explain: L(
          "The bang makes the first field strict: it is forced when P is built. The lazy second field may hold undefined unharmed.",
          "El bang hace estricto el primer campo: se fuerza al construir P. El segundo campo, perezoso, puede guardar undefined sin problema.",
          "! で最初のフィールドは正格になり、P を作る時に評価される。遅延の2番目は undefined でも平気。",
        ),
        check: { compiles: true, throws: "Prelude.undefined" },
      },
      {
        topic: "laziness", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code(
          "newtype NAge = NAge Int",
          "data DAge = DAge Int",
          "",
          "main :: IO ()",
          "main = do",
          '  putStrLn (case undefined of NAge _ -> "newtype ok")',
          '  putStrLn (case undefined of DAge _ -> "data ok")',
        ),
        options: [
          L("newtype ok, then a crash", "newtype ok y luego falla", "newtype ok の後に落ちる"),
          L("Both lines print", "Se imprimen ambas líneas", "両方の行が表示される"),
          L("A crash before printing anything", "Falla antes de imprimir nada", "何も表示せずに落ちる"),
        ], answer: 0,
        explain: L(
          "A newtype has no runtime box, so matching on it forces nothing. Matching a data constructor must evaluate the value first.",
          "Un newtype no tiene caja en ejecución, así que hacer match no fuerza nada. Hacer match con un constructor data debe evaluar el valor.",
          "newtype は実行時に箱がないのでマッチしても評価しない。data の構築子へのマッチは値を評価する。",
        ),
        check: { compiles: true, throws: "Prelude.undefined" },
      },
      // folds
      {
        topic: "folds", difficulty: 2, kind: "predict", prompt: HAPPENS,
        code: "print (foldr (\\x acc -> x > 10 || acc) False [1 ..])",
        options: ["True", L("It never ends: the list is infinite", "Nunca termina: la lista es infinita", "終わらない：リストが無限"), "False"], answer: 0,
        explain: L(
          "foldr hands the rest of the fold to the function lazily. || stops at the first True (x = 11), so the infinite tail is never built.",
          "foldr pasa el resto del fold a la función de forma perezosa. || se detiene en el primer True (x = 11), así que la cola infinita nunca se construye.",
          "foldr は残りの畳み込みを遅延で渡す。|| は最初の True（x = 11）で止まり、無限の残りは作られない。",
        ),
        check: { compiles: true, stdout: "True" },
      },
      {
        topic: "folds", difficulty: 3, kind: "predict", prompt: L("Why can this still leak on a huge list?", "¿Por qué aún puede fugar con una lista enorme?", "巨大なリストでなぜまだリークする？"),
        code: code(
          "import Data.List (foldl')",
          "",
          "main :: IO ()",
          "main = do",
          "  let step (a, b) x = (a + x, b + 1)",
          "  print (foldl' step (0, 0 :: Int) [1 .. 100 :: Int])",
        ),
        options: [
          L("foldl' forces only the pair, not a and b", "foldl' fuerza solo el par, no a y b", "foldl' はペアだけ評価し a と b は遅延"),
          L("foldl' is just as lazy as foldl", "foldl' es tan perezoso como foldl", "foldl' も foldl と同じく遅延"),
          L("Tuples are copied on every step", "Las tuplas se copian en cada paso", "タプルが毎回コピーされる"),
        ], answer: 0,
        explain: L(
          "foldl' evaluates the accumulator to WHNF: the tuple constructor. Its fields stay thunks. Use bang patterns: step (!a, !b) x.",
          "foldl' evalúa el acumulador a WHNF: el constructor de la tupla. Sus campos siguen como thunks. Usa bang patterns: step (!a, !b) x.",
          "foldl' は累積値を WHNF（タプルの構築子）まで評価するだけで中身はサンクのまま。step (!a, !b) x にしよう。",
        ),
        check: { compiles: true, stdout: "(5050,100)" },
      },
      // typeclasses
      {
        topic: "typeclasses", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "newtype MaxI = MaxI Int deriving Show",
          "",
          "instance Semigroup MaxI where",
          "  MaxI a <> MaxI b = MaxI (max a b)",
          "",
          "instance Monoid MaxI where",
          "  mempty = MaxI minBound",
          "",
          "main :: IO ()",
          "main = print (mconcat (map MaxI [3, 9, 2]), mempty :: MaxI)",
        ),
        options: ["(MaxI 9,MaxI (-9223372036854775808))", "(MaxI 9,MaxI -9223372036854775808)", "(MaxI 14,MaxI 0)"], answer: 0,
        explain: L(
          "mconcat folds with <> starting from mempty, so it keeps the max. Show wraps negative arguments in parentheses.",
          "mconcat pliega con <> empezando en mempty, así que se queda con el máximo. Show pone entre paréntesis los argumentos negativos.",
          "mconcat は mempty から <> で畳むので最大値が残る。Show は負の引数をかっこで囲む。",
        ),
        check: { compiles: true, stdout: "(MaxI 9,MaxI (-9223372036854775808))" },
      },
      {
        topic: "typeclasses", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "data Tree a = Leaf | Node (Tree a) a (Tree a)",
          "",
          "instance Foldable Tree where",
          "  foldr _ z Leaf = z",
          "  foldr f z (Node l x r) = foldr f (f x (foldr f z r)) l",
          "",
          "main :: IO ()",
          "main = do",
          "  let t = Node (Node Leaf 1 Leaf) 2 (Node Leaf 3 Leaf)",
          "  print (sum t, elem 3 t, length t, foldr (:) [] t)",
        ),
        options: ["(6,True,3,[1,2,3])", "(6,True,3,[2,1,3])", L("Compile error: sum is not defined for Tree", "Error de compilación: sum no está definido para Tree", "コンパイルエラー：Tree に sum はない")], answer: 0,
        explain: L(
          "Defining foldr alone gives a full Foldable: sum, elem, length and toList come for free. This foldr visits nodes in order.",
          "Definir solo foldr da un Foldable completo: sum, elem, length y toList vienen gratis. Este foldr recorre los nodos en orden.",
          "foldr だけ定義すれば Foldable が揃い、sum・elem・length も使える。この foldr は中間順で巡る。",
        ),
        check: { compiles: true, stdout: "(6,True,3,[1,2,3])" },
      },
      {
        topic: "typeclasses", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code(
          "largest :: [a] -> a",
          "largest = maximum",
          "",
          "main :: IO ()",
          "main = print (largest [3, 1, 2])",
        ),
        options: [L("Yes, it prints 3", "Sí, imprime 3", "はい、3 と表示"), L("No: the signature lacks Ord a", "No: a la firma le falta Ord a", "いいえ：シグネチャに Ord a がない")], answer: 1,
        explain: L(
          "maximum needs Ord a, and a signature must state every constraint it uses: largest :: Ord a => [a] -> a.",
          "maximum necesita Ord a, y la firma debe declarar cada restricción que usa: largest :: Ord a => [a] -> a.",
          "maximum には Ord a が必要。シグネチャで制約を書く：largest :: Ord a => [a] -> a。",
        ),
        check: { compiles: false },
      },
      // functors
      {
        topic: "functors", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: "print (fmap (+ 1) (3, 4), length (3, 4))",
        options: ["((3,5),1)", "((4,5),2)", "((4,4),2)"], answer: 0,
        explain: L(
          "The Functor and Foldable instances of (a, b) only see the second component: fmap touches 4 and length counts one element.",
          "Las instancias Functor y Foldable de (a, b) solo ven el segundo componente: fmap toca el 4 y length cuenta un elemento.",
          "(a, b) の Functor と Foldable は2番目の要素だけを見る。fmap は 4 だけ変え、length は1。",
        ),
        check: { compiles: true, stdout: "((3,5),1)" },
      },
      {
        topic: "functors", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          'let pos x = if x > 0 then Right x else Left ("bad " ++ show x)',
          "print (traverse pos [1, 2], traverse pos [1, -2, -3])",
        ),
        options: ["(Right [1,2],Left \"bad -2\")", "(Right [1,2],Left \"bad -3\")", "([Right 1,Right 2],[Right 1,Left \"bad -2\",Left \"bad -3\"])"], answer: 0,
        explain: L(
          "traverse runs the effectful function over the list and collects the results; with Either it stops at the first Left.",
          "traverse aplica la función con efectos sobre la lista y junta los resultados; con Either se detiene en el primer Left.",
          "traverse は効果付き関数をリストに適用して結果を集める。Either なら最初の Left で止まる。",
        ),
        check: { compiles: true, stdout: "(Right [1,2],Left \"bad -2\")" },
      },
      // monads
      {
        topic: "monads", difficulty: 1, kind: "type", prompt: L("Chain into the next Maybe step", "Encadena con el siguiente paso Maybe", "次の Maybe の処理につなぐ"),
        code: "print (Just 4 ___ \\x -> Just (x + 1))",
        answer: ">>=",
        explain: L(
          ">>= (bind) takes the value out of the Maybe and passes it to the next step, which returns a new Maybe: Just 5.",
          ">>= (bind) saca el valor del Maybe y lo pasa al siguiente paso, que devuelve un nuevo Maybe: Just 5.",
          ">>=（バインド）は Maybe から値を取り出して次の処理に渡し、新しい Maybe（Just 5）を得る。",
        ),
        check: { compiles: true, stdout: "Just 5" },
      },
      {
        topic: "monads", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "let step x = if x > 100 then Nothing else Just (x * 10)",
          "print (step 1 >>= step >>= step, step 5 >>= step >>= step)",
        ),
        options: ["(Just 1000,Nothing)", "(Just 1000,Just 5000)", "(Just 1000,Just 500)"], answer: 0,
        explain: L(
          "1 -> 10 -> 100 -> 1000 succeeds. 5 -> 50 -> 500, then step 500 is Nothing, and Nothing short-circuits the chain.",
          "1 -> 10 -> 100 -> 1000 funciona. 5 -> 50 -> 500, luego step 500 es Nothing, y Nothing corta la cadena.",
          "1 -> 10 -> 100 -> 1000 は成功。5 -> 50 -> 500 の次の step 500 が Nothing で連鎖が止まる。",
        ),
        check: { compiles: true, stdout: "(Just 1000,Nothing)" },
      },
      {
        topic: "monads", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "import Control.Monad (replicateM)",
          "",
          "main :: IO ()",
          'main = print (replicateM 2 "ab")',
        ),
        options: ["[\"aa\",\"ab\",\"ba\",\"bb\"]", "[\"ab\",\"ab\"]", "\"abab\""], answer: 0,
        explain: L(
          "In the list monad each step is a choice, so replicateM 2 picks a letter twice in every combination.",
          "En la mónada de listas cada paso es una elección, así que replicateM 2 elige una letra dos veces en todas las combinaciones.",
          "リストモナドでは各ステップが選択肢。replicateM 2 は文字を2回選ぶ全組み合わせ。",
        ),
        check: { compiles: true, stdout: "[\"aa\",\"ab\",\"ba\",\"bb\"]" },
      },
      {
        topic: "monads", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "check :: Int -> IO String",
          "check n = do",
          '  if n < 0 then return "negative" else return "ok"',
          '  return "done"',
          "",
          "main :: IO ()",
          "main = check (-1) >>= putStrLn",
        ),
        options: ["done", "negative", "negative done"], answer: 0,
        explain: L(
          "return is not a jump: it just wraps a value in IO. The if result is discarded and the do block ends with return \"done\".",
          "return no es un salto: solo envuelve un valor en IO. El resultado del if se descarta y el bloque do termina con return \"done\".",
          "return はジャンプではなく値を IO に包むだけ。if の結果は捨てられ、最後の return \"done\" が返る。",
        ),
        check: { compiles: true, stdout: "done" },
      },
      // io
      {
        topic: "io", difficulty: 1, kind: "predict", prompt: COMPILES,
        code: code(
          "map print [1, 2]",
          'putStrLn "end"',
        ),
        options: [L("Yes, it prints 1, 2, end", "Sí, imprime 1, 2, end", "はい、1, 2, end と表示"), L("Yes, but it prints only end", "Sí, pero solo imprime end", "はい、end だけ表示"), L("No: a list of actions is not an action", "No: una lista de acciones no es una acción", "いいえ：アクションのリストはアクションではない")], answer: 2,
        explain: L(
          "map print builds a list of IO actions ([IO ()]), but each do statement must be an IO action. Use mapM_ print to run them.",
          "map print crea una lista de acciones IO ([IO ()]), pero cada sentencia del do debe ser una acción IO. Usa mapM_ print para ejecutarlas.",
          "map print は [IO ()] を作るだけ。do の各文は IO アクションでなければならない。mapM_ print を使おう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "io", difficulty: 2, kind: "predict", prompt: L("What does it print, line by line?", "¿Qué imprime, línea por línea?", "1行ずつ何が表示される？"),
        code: code(
          "xs <- mapM (\\x -> do { print x; return (x * 2) }) [1, 2]",
          "print xs",
        ),
        options: ["1 / 2 / [2,4]", "[2,4]", "1 / 2 / [1,2]"], answer: 0,
        explain: L(
          "mapM runs the action for each element in order, so 1 and 2 print first, and it collects the returned values into [2,4].",
          "mapM ejecuta la acción para cada elemento en orden, así que 1 y 2 se imprimen primero, y junta los valores devueltos en [2,4].",
          "mapM は各要素のアクションを順に実行するので 1 と 2 が先に出て、戻り値は [2,4] に集まる。",
        ),
        check: { compiles: true, stdout: "1\n2\n[2,4]" },
      },
      {
        topic: "io", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "import Control.Exception",
          "",
          "main :: IO ()",
          'main = catch (evaluate (error "boom" :: Int) >>= print) handler',
          "  where",
          '    handler (ErrorCall msg) = putStrLn ("caught: " ++ msg)',
        ),
        options: ["caught: boom", "boom", L("The program crashes with boom", "El programa falla con boom", "boom でプログラムが落ちる")], answer: 0,
        explain: L(
          "Pure errors become exceptions only when evaluated. evaluate forces the value inside IO, so catch can handle the ErrorCall.",
          "Los errores puros solo se vuelven excepciones al evaluarse. evaluate fuerza el valor dentro de IO, así que catch puede manejar el ErrorCall.",
          "純粋な error は評価された時に例外になる。evaluate が IO 内で評価するので catch で受けられる。",
        ),
        check: { compiles: true, stdout: "caught: boom" },
      },
      // containers
      {
        topic: "containers", difficulty: 3, kind: "predict", prompt: HAPPENS,
        code: code(
          "import qualified Data.Map.Lazy as ML",
          "import qualified Data.Map.Strict as MS",
          "",
          "main :: IO ()",
          "main = do",
          '  print (ML.size (ML.insert "k" (undefined :: Int) ML.empty))',
          '  print (MS.size (MS.insert "k" (undefined :: Int) MS.empty))',
        ),
        options: [
          L("1, then a crash: Prelude.undefined", "1 y luego falla: Prelude.undefined", "1 の後 Prelude.undefined で落ちる"),
          L("1 and 1", "1 y 1", "1 と 1"),
          L("A crash on the first line", "Falla en la primera línea", "最初の行で落ちる"),
        ], answer: 0,
        explain: L(
          "Same type, different API: Data.Map.Strict evaluates values to WHNF on insert, the lazy one stores thunks. Strict avoids leaks.",
          "Mismo tipo, distinta API: Data.Map.Strict evalúa los valores a WHNF al insertar; la perezosa guarda thunks. Strict evita fugas.",
          "型は同じで API が違う。Data.Map.Strict は挿入時に値を WHNF まで評価し、遅延版はサンクを保存する。",
        ),
        check: { compiles: true, throws: "Prelude.undefined" },
      },
      {
        topic: "containers", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "import qualified Data.Map.Strict as M",
          "",
          "main :: IO ()",
          'main = print (M.toList (M.fromListWith (+) [(c, 1 :: Int) | c <- "banana"]))',
        ),
        options: ["[('a',3),('b',1),('n',2)]", "[('b',1),('a',3),('n',2)]", "[('a',1),('b',1),('n',1)]"], answer: 0,
        explain: L(
          "fromListWith combines values of repeated keys with (+), a classic frequency count. toList returns pairs in key order.",
          "fromListWith combina con (+) los valores de claves repetidas, el clásico conteo de frecuencias. toList da los pares en orden de clave.",
          "fromListWith は重複キーの値を (+) でまとめる定番の頻度集計。toList はキー順で返す。",
        ),
        check: { compiles: true, stdout: "[('a',3),('b',1),('n',2)]" },
      },
      // effects
      {
        topic: "effects", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "import Control.Monad.State",
          "import Control.Monad (replicateM_)",
          "",
          "counter :: State Int Int",
          "counter = do",
          "  modify (+ 1)",
          "  modify (* 10)",
          "  get",
          "",
          "main :: IO ()",
          "main = print (runState counter 1, execState (replicateM_ 3 (modify (+ 1))) 0)",
        ),
        options: ["((20,20),3)", "((11,11),3)", "((20,1),3)"], answer: 0,
        explain: L(
          "State threads a value through pure code. runState returns (result, final state); execState returns only the state.",
          "State pasa un valor a través de código puro. runState devuelve (resultado, estado final); execState solo el estado.",
          "State は純粋なコードに状態を通す。runState は（結果, 最終状態）、execState は状態だけ返す。",
        ),
        check: { compiles: true, stdout: "((20,20),3)" },
      },
      {
        topic: "effects", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code(
          "import Control.Monad.State",
          "",
          "main :: IO ()",
          "main = print (execState (replicateM_ 3 (modify (+ 1))) 0)",
        ),
        options: [L("Yes, it prints 3", "Sí, imprime 3", "はい、3 と表示"), L("No: replicateM_ is not in scope", "No: replicateM_ no está en el ámbito", "いいえ：replicateM_ がスコープにない")], answer: 1,
        explain: L(
          "Since mtl 2.3, Control.Monad.State no longer re-exports Control.Monad. Import replicateM_ from Control.Monad yourself.",
          "Desde mtl 2.3, Control.Monad.State ya no reexporta Control.Monad. Importa replicateM_ desde Control.Monad tú mismo.",
          "mtl 2.3 から Control.Monad.State は Control.Monad を再エクスポートしない。自分で import しよう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "effects", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code(
          "{-# LANGUAGE GADTs #-}",
          "data Expr a where",
          "  IntE  :: Int -> Expr Int",
          "  BoolE :: Bool -> Expr Bool",
          "  Add   :: Expr Int -> Expr Int -> Expr Int",
          "",
          "eval :: Expr a -> a",
          "eval (IntE n) = n",
          "eval (BoolE b) = b",
          "eval (Add x y) = eval x + eval y",
          "",
          "main = print (eval (Add (IntE 2) (BoolE True)))",
        ),
        options: [L("Yes, it prints 3", "Sí, imprime 3", "はい、3 と表示"), L("No: Add needs two Expr Int", "No: Add necesita dos Expr Int", "いいえ：Add は Expr Int を2つ要求")], answer: 1,
        explain: L(
          "Each GADT constructor fixes its result type, so BoolE True is an Expr Bool and cannot be passed to Add. Ill-typed trees are rejected.",
          "Cada constructor GADT fija su tipo resultado, así que BoolE True es un Expr Bool y no puede pasarse a Add. Se rechazan árboles mal tipados.",
          "GADT の構築子は結果の型を決める。BoolE True は Expr Bool なので Add に渡せない。",
        ),
        check: { compiles: false },
      },
      // concurrency
      {
        topic: "concurrency", difficulty: 2, kind: "order", prompt: L("Wait for the forked thread's result", "Espera el resultado del hilo lanzado", "fork したスレッドの結果を待つ"),
        lines: ["import Control.Concurrent", "main = do", "  mv <- newEmptyMVar", '  _ <- forkIO (putMVar mv "done")', "  msg <- takeMVar mv", "  putStrLn msg"],
        explain: L(
          "Create the empty MVar, fork a thread that fills it, then takeMVar blocks until the value arrives, so the output is deterministic.",
          "Crea el MVar vacío, lanza un hilo que lo llena y luego takeMVar bloquea hasta que llega el valor, así la salida es determinista.",
          "空の MVar を作り、埋めるスレッドを fork。takeMVar は値が届くまで待つので出力は確定する。",
        ),
        check: { compiles: true, stdout: "done" },
      },
      {
        topic: "concurrency", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "import Control.Concurrent",
          "import Control.Concurrent.STM",
          "import Control.Monad",
          "",
          "main :: IO ()",
          "main = do",
          "  tv <- newTVarIO (0 :: Int)",
          "  done <- newEmptyMVar",
          "  forM_ [1 .. 10] $ \\i -> forkIO (atomically (modifyTVar' tv (+ i)) >> putMVar done ())",
          "  replicateM_ 10 (takeMVar done)",
          "  readTVarIO tv >>= print",
        ),
        options: ["55", "10", L("It varies from run to run", "Varía en cada ejecución", "実行ごとに変わる")], answer: 0,
        explain: L(
          "Each atomically block runs as one transaction, so no update is lost, and waiting on 10 MVar signals makes the read happen last.",
          "Cada bloque atomically corre como una transacción, así que no se pierde ninguna suma, y esperar 10 señales MVar hace que la lectura sea al final.",
          "atomically は1つのトランザクションなので更新は失われない。MVar を10回待つので読むのは最後。",
        ),
        check: { compiles: true, stdout: "55" },
      },
      // tooling
      {
        topic: "tooling", difficulty: 1, kind: "predict", prompt: L("How does QuickCheck test this property?", "¿Cómo prueba QuickCheck esta propiedad?", "QuickCheck はこの性質をどう試す？"),
        code: code(
          "prop_rev :: [Int] -> Bool",
          "prop_rev xs = reverse (reverse xs) == xs",
        ),
        options: [
          L("It runs it on many random lists", "La corre con muchas listas aleatorias", "多数のランダムなリストで試す"),
          L("It proves it symbolically", "La demuestra de forma simbólica", "記号的に証明する"),
          L("It runs it once on []", "La corre una vez con []", "[] で1回だけ試す"),
        ], answer: 0,
        explain: L(
          "Property-based testing generates many random inputs (100 by default) and shrinks any failing case to a minimal counterexample.",
          "Las pruebas basadas en propiedades generan muchas entradas aleatorias (100 por defecto) y reducen un caso fallido a un contraejemplo mínimo.",
          "性質ベーステストはランダム入力を多数（既定100件）生成し、失敗例を最小の反例に縮める。",
        ),
      },
    ],
  },
];
