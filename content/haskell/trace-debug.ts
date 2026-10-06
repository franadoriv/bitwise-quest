import type { ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Written-test formats for planet Lambdara (Haskell, GHC 9.8.4): trace tables (dry-run the code, fill
// the values) and debugging tasks (tap the buggy line, then fix it). The validator runs every `verify`
// and proves each fix passes the tests while the buggy code and the near misses fail. Debug code is
// the player file (imports and top-level declarations, never `main`), exactly like the coding tasks.

const code = (...lines: string[]) => lines.join("\n");

const step = (n: number) => L(`step ${n}`, `paso ${n}`, `ステップ${n}`);
const call = (n: number) => L(`call ${n}`, `llamada ${n}`, `呼び出し${n}`);

// ─── Junior traces ──────────────────────────────────────────────────────────

/** Junior trace: an accumulating recursion, one row per call. */
export const revDigitsTrace: ExamQuestion = {
  kind: "trace",
  topic: "recursion",
  difficulty: 1,
  prompt: L("Trace table: reversing digits", "Tabla de traza: invertir dígitos", "トレース：桁を逆にする"),
  brief: L(
    "Evaluate rev 1203 0. One row per call of rev: the arguments it receives.",
    "Evalúa rev 1203 0. Una fila por llamada a rev: los argumentos que recibe.",
    "rev 1203 0 を評価する。rev の呼び出しごとに1行、受け取る引数を書く。",
  ),
  code: code(
    "rev :: Int -> Int -> Int",
    "rev 0 acc = acc",
    "rev n acc = rev (n `div` 10) (acc * 10 + n `mod` 10)",
  ),
  columns: ["n", "acc"],
  rows: [
    { label: call(1), cells: ["1203", "0"], given: [0, 1] },
    { label: call(2), cells: ["120", "3"] },
    { label: call(3), cells: ["12", "30"] },
    { label: call(4), cells: ["1", "302"] },
    { label: call(5), cells: ["0", "3021"] },
  ],
  verify: code(
    "calls :: Int -> Int -> [(Int, Int)]",
    "calls 0 acc = [(0, acc)]",
    "calls n acc = (n, acc) : calls (n `div` 10) (acc * 10 + n `mod` 10)",
    "",
    "main :: IO ()",
    "main = mapM_ (\\(n, acc) -> putStrLn (show n ++ \" | \" ++ show acc)) (calls 1203 0)",
  ),
  explain: L(
    "Each call moves the last digit of n onto acc: div drops it from n, mod reads it. The 0 inside 1203 still counts, so acc ends at 3021.",
    "Cada llamada pasa el último dígito de n a acc: div lo quita de n y mod lo lee. El 0 de 1203 también cuenta, así acc termina en 3021.",
    "各呼び出しで n の最後の桁を acc へ移す。div で n から落とし、mod で読む。1203 の 0 も数えるので acc は 3021。",
  ),
};

/** Junior trace: the accumulator of a left fold, step by step. */
export const foldlDigitsTrace: ExamQuestion = {
  kind: "trace",
  topic: "folds",
  difficulty: 1,
  prompt: L("Trace table: a left fold", "Tabla de traza: un fold izquierdo", "トレース：左畳み込み"),
  brief: L(
    "One row per element: x is the element, acc is the value step returns for it.",
    "Una fila por elemento: x es el elemento y acc el valor que step devuelve con él.",
    "要素ごとに1行。x は要素、acc はその時 step が返す値。",
  ),
  code: code(
    "step :: Int -> Int -> Int",
    "step acc x = 10 * acc + x",
    "",
    "result :: Int",
    "result = foldl step 0 [4, 0, 7, 2]",
  ),
  columns: ["x", "acc"],
  rows: [
    { label: step(1), cells: ["4", "4"], given: [0] },
    { label: step(2), cells: ["0", "40"], given: [0] },
    { label: step(3), cells: ["7", "407"], given: [0] },
    { label: step(4), cells: ["2", "4072"], given: [0] },
  ],
  verify: code(
    "step :: Int -> Int -> Int",
    "step acc x = 10 * acc + x",
    "",
    "main :: IO ()",
    "main = mapM_ (\\(x, acc) -> putStrLn (show x ++ \" | \" ++ show acc)) (zip xs (tail (scanl step 0 xs)))",
    "  where",
    "    xs = [4, 0, 7, 2]",
  ),
  explain: L(
    "foldl starts from 0 and feeds each element from the left: 10*0+4 = 4, 40, 407, 4072. The digits come out in order.",
    "foldl parte de 0 y toma cada elemento desde la izquierda: 10*0+4 = 4, 40, 407, 4072. Los dígitos salen en orden.",
    "foldl は 0 から左の要素を順に取り込む：10*0+4 = 4、40、407、4072。桁はそのままの順に並ぶ。",
  ),
};

// ─── Mid traces ─────────────────────────────────────────────────────────────

/** Mid trace: a lazy list defined in terms of itself. */
export const lazyFibsTrace: ExamQuestion = {
  kind: "trace",
  topic: "laziness",
  difficulty: 2,
  prompt: L("Trace table: a list that reads itself", "Tabla de traza: una lista que se lee a sí misma", "トレース：自分を読むリスト"),
  brief: L(
    "One row per k: the two elements zipWith adds, and the element it produces, fibs !! (k + 2).",
    "Una fila por k: los dos elementos que suma zipWith y el que produce, fibs !! (k + 2).",
    "k ごとに1行。zipWith が足す2つの要素と、できる要素 fibs !! (k + 2)。",
  ),
  code: code(
    "fibs :: [Integer]",
    "fibs = 0 : 1 : zipWith (+) fibs (tail fibs)",
    "",
    "-- take 6 fibs",
  ),
  columns: ["fibs !! k", "tail fibs !! k", "fibs !! (k + 2)"],
  rows: [
    { label: "k = 0", cells: ["0", "1", "1"], given: [0, 1] },
    { label: "k = 1", cells: ["1", "1", "2"] },
    { label: "k = 2", cells: ["1", "2", "3"] },
    { label: "k = 3", cells: ["2", "3", "5"] },
  ],
  verify: code(
    "fibs :: [Integer]",
    "fibs = 0 : 1 : zipWith (+) fibs (tail fibs)",
    "",
    "main :: IO ()",
    "main = mapM_ row [0 .. 3]",
    "  where",
    "    row k = putStrLn (show (fibs !! k) ++ \" | \" ++ show (tail fibs !! k) ++ \" | \" ++ show (fibs !! (k + 2)))",
  ),
  explain: L(
    "zipWith pairs fibs with its own tail, one step behind. Laziness lets each new element read the two already computed before it.",
    "zipWith empareja fibs con su propia cola, un paso atrás. La pereza deja que cada elemento nuevo lea los dos ya calculados antes.",
    "zipWith は fibs と1つずれた自分の tail を組にする。遅延評価なので新しい要素は直前に計算済みの2つを読める。",
  ),
};

/** Mid trace: foldr combines from the right end first. */
export const foldrSubTrace: ExamQuestion = {
  kind: "trace",
  topic: "folds",
  difficulty: 2,
  prompt: L("Trace table: foldr with subtraction", "Tabla de traza: foldr con resta", "トレース：引き算の foldr"),
  brief: L(
    "One row each time the lambda returns, in the order the results are computed: its x and the result.",
    "Una fila cada vez que la lambda devuelve, en el orden en que se calculan: su x y el resultado.",
    "ラムダが値を返すたびに1行（計算される順）。その x と結果。",
  ),
  code: code(
    "result :: Int",
    "result = foldr (\\x acc -> x - acc) 0 [5, 3, 2]",
  ),
  columns: ["x", "result"],
  rows: [
    { label: step(1), cells: ["2", "2"] },
    { label: step(2), cells: ["3", "1"] },
    { label: step(3), cells: ["5", "4"] },
  ],
  verify: code(
    "main :: IO ()",
    "main = mapM_ (\\(x, r) -> putStrLn (show x ++ \" | \" ++ show r)) (zip (reverse xs) (tail (reverse (scanr (\\x acc -> x - acc) 0 xs))))",
    "  where",
    "    xs = [5, 3, 2] :: [Int]",
  ),
  explain: L(
    "foldr nests to the right: 5 - (3 - (2 - 0)). The innermost 2 - 0 finishes first, then 3 - 2 = 1, then 5 - 1 = 4.",
    "foldr anida hacia la derecha: 5 - (3 - (2 - 0)). El 2 - 0 interno termina primero, luego 3 - 2 = 1 y 5 - 1 = 4.",
    "foldr は右へ入れ子になる：5 - (3 - (2 - 0))。内側の 2 - 0 が先に終わり、3 - 2 = 1、5 - 1 = 4。",
  ),
};

// ─── Senior trace ───────────────────────────────────────────────────────────

/** Senior trace: mapAccumL threads a state and emits an output per element. */
export const mapAccumTrace: ExamQuestion = {
  kind: "trace",
  topic: "hof",
  difficulty: 3,
  prompt: L("Trace table: mapAccumL state", "Tabla de traza: el estado de mapAccumL", "トレース：mapAccumL の状態"),
  brief: L(
    "One row per element x: the new acc after step, and the out value step emits for x.",
    "Una fila por elemento x: el nuevo acc tras step y el valor out que step emite para x.",
    "要素 x ごとに1行。step 後の新しい acc と、x に対して step が出す out。",
  ),
  code: code(
    "import Data.List (mapAccumL)",
    "",
    "step :: Int -> Int -> (Int, Int)",
    "step acc x = (acc + x, acc * x)",
    "",
    "result :: (Int, [Int])",
    "result = mapAccumL step 0 [3, 1, 4, 2]",
  ),
  columns: ["x", "acc", "out"],
  rows: [
    { label: step(1), cells: ["3", "3", "0"], given: [0] },
    { label: step(2), cells: ["1", "4", "3"], given: [0] },
    { label: step(3), cells: ["4", "8", "16"], given: [0] },
    { label: step(4), cells: ["2", "10", "16"], given: [0] },
  ],
  verify: code(
    "import Data.List (mapAccumL)",
    "",
    "step :: Int -> Int -> (Int, Int)",
    "step acc x = (acc + x, acc * x)",
    "",
    "traced :: Int -> Int -> (Int, (Int, Int, Int))",
    "traced acc x = let (acc', out) = step acc x in (acc', (x, acc', out))",
    "",
    "main :: IO ()",
    "main = mapM_ (\\(x, a, o) -> putStrLn (show x ++ \" | \" ++ show a ++ \" | \" ++ show o)) (snd (mapAccumL traced 0 [3, 1, 4, 2]))",
  ),
  explain: L(
    "out uses the OLD acc, the new acc is passed on: 0*3 = 0 then acc 3; 3*1 = 3, acc 4; 4*4 = 16, acc 8; 8*2 = 16, acc 10.",
    "out usa el acc VIEJO y el nuevo pasa al siguiente: 0*3 = 0 y acc 3; 3*1 = 3, acc 4; 4*4 = 16, acc 8; 8*2 = 16, acc 10.",
    "out は古い acc を使い、新しい acc は次へ渡る：0*3=0 で acc 3、3*1=3 で 4、4*4=16 で 8、8*2=16 で 10。",
  ),
};

// ─── Mid debugging tasks ────────────────────────────────────────────────────

/** Mid debug: a base case that adds an extra empty chunk. */
export const chunksDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "recursion",
  difficulty: 2,
  prompt: L("Debug: the extra empty chunk", "Depura: el trozo vacío de más", "デバッグ：余分な空チャンク"),
  brief: L(
    "chunks n xs should split xs into pieces of n elements (the last one may be shorter), and chunks n [] should be []. But chunks 2 [1, 2, 3] gives [[1,2],[3],[]] instead of [[1,2],[3]].",
    "chunks n xs debería partir xs en trozos de n elementos (el último puede ser más corto), y chunks n [] debería ser []. Pero chunks 2 [1, 2, 3] da [[1,2],[3],[]] en vez de [[1,2],[3]].",
    "chunks n xs は xs を n 個ずつに分け（最後は短くてよい）、chunks n [] は [] のはず。でも chunks 2 [1, 2, 3] が [[1,2],[3]] ではなく [[1,2],[3],[]] になる。",
  ),
  code: code(
    "chunks :: Int -> [a] -> [[a]]",
    "chunks _ [] = [[]]",
    "chunks n xs = take n xs : chunks n (drop n xs)",
    "",
  ),
  bugLine: 2,
  solution: code(
    "chunks :: Int -> [a] -> [[a]]",
    "chunks _ [] = []",
    "chunks n xs = take n xs : chunks n (drop n xs)",
    "",
  ),
  nearMiss: [
    // A one-element base case: [] is no longer covered, so the recursion crashes.
    code(
      "chunks :: Int -> [a] -> [[a]]",
      "chunks _ [x] = [[x]]",
      "chunks n xs = take n xs : chunks n (drop n xs)",
      "",
    ),
    // Stops at the last short chunk, but [] still gives [[]].
    code(
      "chunks :: Int -> [a] -> [[a]]",
      "chunks n xs | length xs <= n = [xs]",
      "chunks n xs = take n xs : chunks n (drop n xs)",
      "",
    ),
  ],
  tests: [
    { run: "print (chunks 2 [1, 2, 3 :: Int])", expect: "[[1,2],[3]]" },
    { run: "print (chunks 3 \"abcdef\")", expect: "[\"abc\",\"def\"]" },
    { run: "print (chunks 2 ([] :: [Int]))", expect: "[]", hidden: true },
    { run: "print (chunks 5 [1, 2 :: Int])", expect: "[[1,2]]", hidden: true },
    { run: "print (length (chunks 1 \"abcd\"))", expect: "4", hidden: true },
  ],
  explain: L(
    "The base case is what the recursion ends on, so [[]] adds one empty chunk at the end of every result. An empty list has no chunks: [].",
    "El caso base es donde termina la recursión, así que [[]] agrega un trozo vacío al final de todo resultado. Una lista vacía no tiene trozos: [].",
    "基底ケースは再帰の終点なので、[[]] だと必ず最後に空チャンクが付く。空リストのチャンクは無い：[]。",
  ),
};

/** Mid debug: foldr where the accumulation needs foldl. */
export const fromDigitsDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "folds",
  difficulty: 2,
  prompt: L("Debug: digits read backwards", "Depura: dígitos al revés", "デバッグ：逆に読まれる桁"),
  brief: L(
    "fromDigits ds should turn a list of decimal digits into the number they spell, most significant digit first, and 0 for []. But fromDigits [1, 2, 3] returns 321 instead of 123.",
    "fromDigits ds debería convertir una lista de dígitos decimales en el número que forman, el más significativo primero, y 0 para []. Pero fromDigits [1, 2, 3] devuelve 321 en vez de 123.",
    "fromDigits ds は10進の桁のリスト（上の桁が先）をその数に変え、[] なら 0 を返すはず。でも fromDigits [1, 2, 3] が 123 ではなく 321 になる。",
  ),
  code: code(
    "fromDigits :: [Int] -> Int",
    "fromDigits = foldr (\\d acc -> acc * 10 + d) 0",
    "",
  ),
  bugLine: 2,
  solution: code(
    "fromDigits :: [Int] -> Int",
    "fromDigits = foldl (\\acc d -> acc * 10 + d) 0",
    "",
  ),
  nearMiss: [
    // foldl, but the lambda keeps foldr's argument order: acc and d are swapped.
    code(
      "fromDigits :: [Int] -> Int",
      "fromDigits = foldl (\\d acc -> acc * 10 + d) 0",
      "",
    ),
    // foldr with the digit scaled instead: every digit gets the same weight.
    code(
      "fromDigits :: [Int] -> Int",
      "fromDigits = foldr (\\d acc -> d * 10 + acc) 0",
      "",
    ),
  ],
  tests: [
    { run: "print (fromDigits [1, 2, 3])", expect: "123" },
    { run: "print (fromDigits [7])", expect: "7" },
    { run: "print (fromDigits [])", expect: "0", hidden: true },
    { run: "print (fromDigits [4, 0, 5])", expect: "405", hidden: true },
    { run: "print (fromDigits [9, 0])", expect: "90", hidden: true },
  ],
  explain: L(
    "foldr starts from the last digit, so the first digit ends up with the smallest weight. foldl walks from the left, multiplying what was read by 10 each step.",
    "foldr empieza por el último dígito y el primero termina con el menor peso. foldl va desde la izquierda y multiplica lo leído por 10 en cada paso.",
    "foldr は最後の桁から始めるので、先頭の桁が一番小さい位になる。foldl は左から進み、毎回それまでの値を 10 倍する。",
  ),
};

// ─── Senior debugging tasks ─────────────────────────────────────────────────

/** Senior debug (ide): M.insert overwrites where the count should accumulate. */
export const ledgerDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "containers",
  difficulty: 3,
  prompt: L("Debug: the stock ledger", "Depura: el libro de inventario", "デバッグ：在庫台帳"),
  brief: L(
    "runAll ops applies the ops in order to an empty stock: Add k n adds n to item k; Take k n removes n, deletes the item when it reaches 0, and fails with Left \"not enough k\" if there is less. But runAll [Add \"gem\" 2, Add \"gem\" 3] has gem = 3 instead of 5.",
    "runAll ops aplica las ops en orden a un inventario vacío: Add k n suma n al item k; Take k n quita n, borra el item al llegar a 0 y falla con Left \"not enough k\" si hay menos. Pero runAll [Add \"gem\" 2, Add \"gem\" 3] deja gem = 3 en vez de 5.",
    "runAll ops は空の在庫に ops を順に適用する。Add k n は品 k に n を足し、Take k n は n を減らして 0 なら削除、足りなければ Left \"not enough k\"。でも runAll [Add \"gem\" 2, Add \"gem\" 3] で gem が 5 でなく 3。",
  ),
  code: code(
    "import qualified Data.Map.Strict as M",
    "",
    "data Op = Add String Int | Take String Int",
    "",
    "apply :: M.Map String Int -> Op -> Either String (M.Map String Int)",
    "apply m (Add k n) = Right (M.insert k n m)",
    "apply m (Take k n)",
    "  | have < n = Left (\"not enough \" ++ k)",
    "  | have == n = Right (M.delete k m)",
    "  | otherwise = Right (M.insert k (have - n) m)",
    "  where",
    "    have = M.findWithDefault 0 k m",
    "",
    "runAll :: [Op] -> Either String (M.Map String Int)",
    "runAll = foldl step (Right M.empty)",
    "  where",
    "    step acc op = acc >>= \\m -> apply m op",
    "",
  ),
  bugLine: 6,
  solution: code(
    "import qualified Data.Map.Strict as M",
    "",
    "data Op = Add String Int | Take String Int",
    "",
    "apply :: M.Map String Int -> Op -> Either String (M.Map String Int)",
    "apply m (Add k n) = Right (M.insertWith (+) k n m)",
    "apply m (Take k n)",
    "  | have < n = Left (\"not enough \" ++ k)",
    "  | have == n = Right (M.delete k m)",
    "  | otherwise = Right (M.insert k (have - n) m)",
    "  where",
    "    have = M.findWithDefault 0 k m",
    "",
    "runAll :: [Op] -> Either String (M.Map String Int)",
    "runAll = foldl step (Right M.empty)",
    "  where",
    "    step acc op = acc >>= \\m -> apply m op",
    "",
  ),
  nearMiss: [
    // insertWith calls f new old: (-) computes new - old.
    code(
      "import qualified Data.Map.Strict as M",
      "",
      "data Op = Add String Int | Take String Int",
      "",
      "apply :: M.Map String Int -> Op -> Either String (M.Map String Int)",
      "apply m (Add k n) = Right (M.insertWith (-) k n m)",
      "apply m (Take k n)",
      "  | have < n = Left (\"not enough \" ++ k)",
      "  | have == n = Right (M.delete k m)",
      "  | otherwise = Right (M.insert k (have - n) m)",
      "  where",
      "    have = M.findWithDefault 0 k m",
      "",
      "runAll :: [Op] -> Either String (M.Map String Int)",
      "runAll = foldl step (Right M.empty)",
      "  where",
      "    step acc op = acc >>= \\m -> apply m op",
      "",
    ),
    // adjust only touches keys that already exist, so new items are never added.
    code(
      "import qualified Data.Map.Strict as M",
      "",
      "data Op = Add String Int | Take String Int",
      "",
      "apply :: M.Map String Int -> Op -> Either String (M.Map String Int)",
      "apply m (Add k n) = Right (M.adjust (+ n) k m)",
      "apply m (Take k n)",
      "  | have < n = Left (\"not enough \" ++ k)",
      "  | have == n = Right (M.delete k m)",
      "  | otherwise = Right (M.insert k (have - n) m)",
      "  where",
      "    have = M.findWithDefault 0 k m",
      "",
      "runAll :: [Op] -> Either String (M.Map String Int)",
      "runAll = foldl step (Right M.empty)",
      "  where",
      "    step acc op = acc >>= \\m -> apply m op",
      "",
    ),
  ],
  tests: [
    { run: "print (fmap M.toList (runAll [Add \"gem\" 2, Add \"gem\" 3]))", expect: "Right [(\"gem\",5)]" },
    { run: "print (fmap M.toList (runAll [Add \"ore\" 4, Take \"ore\" 1]))", expect: "Right [(\"ore\",3)]" },
    { run: "print (fmap M.toList (runAll [Add \"gem\" 1, Take \"gem\" 2]))", expect: "Left \"not enough gem\"", hidden: true },
    { run: "print (fmap M.toList (runAll [Add \"a\" 2, Add \"b\" 1, Add \"a\" 1, Take \"a\" 3]))", expect: "Right [(\"b\",1)]", hidden: true },
    { run: "print (fmap M.toList (runAll [Take \"x\" 1, Add \"x\" 5]))", expect: "Left \"not enough x\"", hidden: true },
  ],
  explain: L(
    "M.insert replaces the old count with n. M.insertWith (+) k n adds n to the count already there, or inserts n for a new item.",
    "M.insert reemplaza la cuenta vieja por n. M.insertWith (+) k n suma n a la cuenta que ya había, o inserta n si el item es nuevo.",
    "M.insert は古い数を n で置き換える。M.insertWith (+) k n は既存の数に n を足し、新しい品なら n を入れる。",
  ),
};

/** Senior debug (paper): >= makes a tie move the answer to the later index. */
export const argMaxDebug: ExamQuestion = {
  kind: "debug",
  mode: "paper",
  topic: "recursion",
  difficulty: 3,
  prompt: L("Debug: the first largest index", "Depura: el primer índice del máximo", "デバッグ：最初の最大値の位置"),
  brief: L(
    "argMax xs should return the index of the largest number in xs, the first one if there is a tie, and -1 for []. But argMax [3, 7, 7] returns 2 instead of 1.",
    "argMax xs debería devolver el índice del mayor número de xs, el primero si hay empate, y -1 para []. Pero argMax [3, 7, 7] devuelve 2 en vez de 1.",
    "argMax xs は xs の最大値の添字（同点なら最初）を、[] なら -1 を返すはず。でも argMax [3, 7, 7] が 1 ではなく 2 になる。",
  ),
  code: code(
    "argMax :: [Int] -> Int",
    "argMax [] = -1",
    "argMax (x:xs) = go 1 0 x xs",
    "  where",
    "    go _ best _ [] = best",
    "    go i best bv (y:ys)",
    "      | y >= bv = go (i + 1) i y ys",
    "      | otherwise = go (i + 1) best bv ys",
    "",
  ),
  bugLine: 7,
  solution: code(
    "argMax :: [Int] -> Int",
    "argMax [] = -1",
    "argMax (x:xs) = go 1 0 x xs",
    "  where",
    "    go _ best _ [] = best",
    "    go i best bv (y:ys)",
    "      | y > bv = go (i + 1) i y ys",
    "      | otherwise = go (i + 1) best bv ys",
    "",
  ),
  nearMiss: [
    // Compares with the best INDEX instead of the best value.
    code(
      "argMax :: [Int] -> Int",
      "argMax [] = -1",
      "argMax (x:xs) = go 1 0 x xs",
      "  where",
      "    go _ best _ [] = best",
      "    go i best bv (y:ys)",
      "      | y > best = go (i + 1) i y ys",
      "      | otherwise = go (i + 1) best bv ys",
      "",
    ),
    // Fixes the tie but starts counting the tail at 0: every index is one too small.
    code(
      "argMax :: [Int] -> Int",
      "argMax [] = -1",
      "argMax (x:xs) = go 0 0 x xs",
      "  where",
      "    go _ best _ [] = best",
      "    go i best bv (y:ys)",
      "      | y > bv = go (i + 1) i y ys",
      "      | otherwise = go (i + 1) best bv ys",
      "",
    ),
  ],
  tests: [
    { run: "print (argMax [3, 7, 7])", expect: "1" },
    { run: "print (argMax [5, 1, 9, 2])", expect: "2" },
    { run: "print (argMax [])", expect: "-1", hidden: true },
    { run: "print (argMax [4, 4, 4])", expect: "0", hidden: true },
    { run: "print (argMax [-5, -2, -9])", expect: "1", hidden: true },
    { run: "print (argMax [1, 8, 3, 8, 2])", expect: "1", hidden: true },
  ],
  explain: L(
    "With >= an equal value replaces the best, so the LAST maximum wins. Strict > keeps the first one.",
    "Con >= un valor igual reemplaza al mejor, así que gana el ÚLTIMO máximo. El > estricto conserva el primero.",
    ">= だと同じ値でも入れ替わり、最後の最大値が勝つ。厳密な > なら最初のものが残る。",
  ),
};

/** Senior debug (paper): a typo in a Semigroup instance that only shows when ranges are combined. */
export const rangeSemigroupDebug: ExamQuestion = {
  kind: "debug",
  mode: "paper",
  topic: "typeclasses",
  difficulty: 3,
  prompt: L("Debug: the range that shrinks", "Depura: el rango que se encoge", "デバッグ：縮む範囲"),
  brief: L(
    "Range a b <> Range c d should give the smallest Range covering both, with Empty as the identity, so spanOf xs is the range of xs (Empty for []). But spanOf [3, 9, 1] gives Range 1 3 instead of Range 1 9.",
    "Range a b <> Range c d debería dar el menor Range que cubre ambos, con Empty como identidad, así spanOf xs es el rango de xs (Empty para []). Pero spanOf [3, 9, 1] da Range 1 3 en vez de Range 1 9.",
    "Range a b <> Range c d は両方を覆う最小の Range を返し、Empty が単位元なので spanOf xs は xs の範囲（[] なら Empty）のはず。でも spanOf [3, 9, 1] が Range 1 9 ではなく Range 1 3。",
  ),
  code: code(
    "data Range = Empty | Range Int Int",
    "  deriving (Show, Eq)",
    "",
    "instance Semigroup Range where",
    "  Empty <> r = r",
    "  r <> Empty = r",
    "  Range a b <> Range c d = Range (min a c) (max b b)",
    "",
    "instance Monoid Range where",
    "  mempty = Empty",
    "",
    "spanOf :: [Int] -> Range",
    "spanOf = foldMap (\\x -> Range x x)",
    "",
  ),
  bugLine: 7,
  solution: code(
    "data Range = Empty | Range Int Int",
    "  deriving (Show, Eq)",
    "",
    "instance Semigroup Range where",
    "  Empty <> r = r",
    "  r <> Empty = r",
    "  Range a b <> Range c d = Range (min a c) (max b d)",
    "",
    "instance Monoid Range where",
    "  mempty = Empty",
    "",
    "spanOf :: [Int] -> Range",
    "spanOf = foldMap (\\x -> Range x x)",
    "",
  ),
  nearMiss: [
    // Compares the left low end with the right high end.
    code(
      "data Range = Empty | Range Int Int",
      "  deriving (Show, Eq)",
      "",
      "instance Semigroup Range where",
      "  Empty <> r = r",
      "  r <> Empty = r",
      "  Range a b <> Range c d = Range (min a c) (max a d)",
      "",
      "instance Monoid Range where",
      "  mempty = Empty",
      "",
      "spanOf :: [Int] -> Range",
      "spanOf = foldMap (\\x -> Range x x)",
      "",
    ),
    // Takes the right range's high end, which is only right for singletons.
    code(
      "data Range = Empty | Range Int Int",
      "  deriving (Show, Eq)",
      "",
      "instance Semigroup Range where",
      "  Empty <> r = r",
      "  r <> Empty = r",
      "  Range a b <> Range c d = Range (min a c) d",
      "",
      "instance Monoid Range where",
      "  mempty = Empty",
      "",
      "spanOf :: [Int] -> Range",
      "spanOf = foldMap (\\x -> Range x x)",
      "",
    ),
  ],
  tests: [
    { run: "print (spanOf [3, 9, 1])", expect: "Range 1 9" },
    { run: "print (Range 1 5 <> Range 2 3)", expect: "Range 1 5" },
    { run: "print (spanOf [])", expect: "Empty", hidden: true },
    { run: "print (spanOf [4])", expect: "Range 4 4", hidden: true },
    { run: "print (Range 2 3 <> Range 0 8)", expect: "Range 0 8", hidden: true },
    { run: "print (mconcat [Range 1 2, Empty, Range (-4) 0])", expect: "Range (-4) 2", hidden: true },
  ],
  explain: L(
    "max b b ignores d, the right range's high end, so a joined range keeps the left one's top. max b d covers both ends.",
    "max b b ignora d, el extremo alto del rango derecho, y el rango unido conserva el tope del izquierdo. max b d cubre ambos.",
    "max b b は右の上端 d を無視し、結合した範囲が左の上端のままになる。max b d なら両方を覆う。",
  ),
};

export const juniorTraceDebug: ExamQuestion[] = [revDigitsTrace, foldlDigitsTrace];
export const midTraceDebug: ExamQuestion[] = [lazyFibsTrace, foldrSubTrace, chunksDebug, fromDigitsDebug];
export const seniorTraceDebug: ExamQuestion[] = [mapAccumTrace, ledgerDebug, argMaxDebug, rangeSemigroupDebug];
