import type { CodeTaskBeat, ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Coding tasks for planet Lambdara (Haskell). The player's file holds imports and top-level
// declarations, never `main`: the driver appends `main :: IO ()` / `main = do` with the tests, which
// run on GHC 9.8.4 through /api/run (hidden tests stay on the server). Output stays ASCII.

// ─── Region bosses (mode "ide", with hint and note) ─────────────────────────

/** Lambda Village boss (The Partial Moth): one equation per list shape, no holes left. */
export const describeListTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: cover every shape", "Mini proyecto: cubre cada forma", "ミニ課題：すべての形をカバー"),
  brief: L(
    "Write describe :: [Int] -> String with no holes for the Moth. An empty list gives \"empty\"; one item gives \"one 7\"; two items give \"pair 1 2\"; three or more give \"many N\", where N is the length. Numbers are written with show.",
    "Escribe describe :: [Int] -> String sin huecos para la Polilla. Una lista vacía da \"empty\"; un elemento da \"one 7\"; dos dan \"pair 1 2\"; tres o más dan \"many N\", donde N es el largo. Los números se escriben con show.",
    "蛾に穴を見せない describe :: [Int] -> String を書こう。空リストは \"empty\"、要素1つは \"one 7\"、2つは \"pair 1 2\"、3つ以上は \"many N\"（N は長さ）。数は show で書く。",
  ),
  starter: "describe :: [Int] -> String\ndescribe _ = \"empty\" -- your code here\n",
  solution:
    "describe :: [Int] -> String\ndescribe [] = \"empty\"\ndescribe [x] = \"one \" ++ show x\ndescribe [x, y] = \"pair \" ++ show x ++ \" \" ++ show y\ndescribe xs = \"many \" ++ show (length xs)\n",
  nearMiss: [
    // Forgets the empty shape: [] falls into the catch-all.
    "describe :: [Int] -> String\ndescribe [x] = \"one \" ++ show x\ndescribe [x, y] = \"pair \" ++ show x ++ \" \" ++ show y\ndescribe xs = \"many \" ++ show (length xs)\n",
    // (x:_) matches every non-empty list, so the pair equation is never reached.
    "describe :: [Int] -> String\ndescribe [] = \"empty\"\ndescribe (x:_) = \"one \" ++ show x\ndescribe [x, y] = \"pair \" ++ show x ++ \" \" ++ show y\ndescribe xs = \"many \" ++ show (length xs)\n",
  ],
  tests: [
    { run: "putStrLn (describe [])", expect: "empty" },
    { run: "putStrLn (describe [7])", expect: "one 7" },
    { run: "putStrLn (describe [1, 2])", expect: "pair 1 2", hidden: true },
    { run: "putStrLn (describe [4, 5, 6])", expect: "many 3", hidden: true },
    { run: "putStrLn (describe [-3])", expect: "one -3", hidden: true },
  ],
  hint: L(
    "Give each list shape its own equation, and put the specific shapes before the catch-all.",
    "Dale a cada forma de lista su propia ecuación, y pon las formas específicas antes del caso general.",
    "リストの形ごとに式を書き、具体的な形を何でも受ける式より前に置こう。",
  ),
  note: "recap-patterns",
  explain: L(
    "Equations are tried top to bottom: [], [x] and [x, y] match exact lengths, and a plain name catches everything else.",
    "Las ecuaciones se prueban de arriba abajo: [], [x] y [x, y] encajan con largos exactos, y un nombre suelto atrapa el resto.",
    "式は上から順に試す。[]・[x]・[x, y] は長さがぴったりの時だけ合い、ただの名前が残りを全部受ける。",
  ),
};

/** Fold Forest boss (The Thunk Pile): a pipeline of functions applied in order with a fold. */
export const applyAllTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the spell pipeline", "Mini proyecto: la cadena de hechizos", "ミニ課題：呪文のパイプライン"),
  brief: L(
    "Write applyAll :: [Int -> Int] -> Int -> Int. It applies every function of the list to the number, first function first: applyAll [(+1), (*2)] 3 is (3 + 1) * 2 = 8. An empty list leaves the number as it is.",
    "Escribe applyAll :: [Int -> Int] -> Int -> Int. Aplica cada función de la lista al número, la primera función primero: applyAll [(+1), (*2)] 3 es (3 + 1) * 2 = 8. Una lista vacía deja el número igual.",
    "applyAll :: [Int -> Int] -> Int -> Int を書こう。リストの関数を先頭から順に数へ適用する。applyAll [(+1), (*2)] 3 は (3 + 1) * 2 = 8。空リストなら数はそのまま。",
  ),
  starter: "applyAll :: [Int -> Int] -> Int -> Int\napplyAll _ x = x -- your code here\n",
  solution: "applyAll :: [Int -> Int] -> Int -> Int\napplyAll fs x = foldl (\\acc f -> f acc) x fs\n",
  nearMiss: [
    // Composition runs right to left: the LAST function is applied first.
    "applyAll :: [Int -> Int] -> Int -> Int\napplyAll fs x = foldr (.) id fs x\n",
    // Stops after the first function.
    "applyAll :: [Int -> Int] -> Int -> Int\napplyAll [] x = x\napplyAll (f:_) x = f x\n",
  ],
  tests: [
    { run: "print (applyAll [(+1), (*2)] 3)", expect: "8" },
    { run: "print (applyAll [] 5)", expect: "5" },
    { run: "print (applyAll [(*2), (+1)] 3)", expect: "7", hidden: true },
    { run: "print (applyAll [subtract 10, abs] 4)", expect: "6", hidden: true },
    { run: "print (applyAll (replicate 3 (*2)) 1)", expect: "8", hidden: true },
  ],
  hint: L(
    "The number is an accumulator that every function updates in turn. Which fold walks the list from the left?",
    "El número es un acumulador que cada función actualiza por turno. ¿Qué fold recorre la lista desde la izquierda?",
    "数は、関数が順番に更新するアキュムレータ。リストを左から進む fold はどれ？",
  ),
  note: "recap-folds",
  explain: L(
    "foldl starts from x and feeds each result to the next function, left to right. foldr (.) id would apply the last one first.",
    "foldl parte de x y pasa cada resultado a la siguiente función, de izquierda a derecha. foldr (.) id aplicaría la última primero.",
    "foldl は x から始めて、結果を次の関数へ左から順に渡す。foldr (.) id だと最後の関数が先に効く。",
  ),
};

/** Lazy Mountain boss (The Bottom Wraith): a binary search tree as an algebraic data type. */
export const searchTreeTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: a sorted treasure tree", "Mini proyecto: un árbol de tesoros", "ミニ課題：整列する宝の木"),
  brief: L(
    "With data Tree = Leaf | Node Tree Int Tree, write insert :: Int -> Tree -> Tree (smaller numbers go left, bigger go right, a number already in the tree is not added again) and inOrder :: Tree -> [Int], which lists the numbers left subtree first, then the node, then the right subtree, so the result is sorted.",
    "Con data Tree = Leaf | Node Tree Int Tree, escribe insert :: Int -> Tree -> Tree (los menores van a la izquierda, los mayores a la derecha, un número que ya está no se agrega otra vez) e inOrder :: Tree -> [Int], que lista primero el subárbol izquierdo, luego el nodo y luego el derecho, así el resultado sale ordenado.",
    "data Tree = Leaf | Node Tree Int Tree で insert :: Int -> Tree -> Tree（小さい数は左、大きい数は右、すでにある数は追加しない）と inOrder :: Tree -> [Int]（左の部分木、ノード、右の部分木の順に並べるので結果は整列する）を書こう。",
  ),
  starter:
    "data Tree = Leaf | Node Tree Int Tree\n\ninsert :: Int -> Tree -> Tree\ninsert _ t = t -- your code here\n\ninOrder :: Tree -> [Int]\ninOrder _ = [] -- your code here\n",
  solution:
    "data Tree = Leaf | Node Tree Int Tree\n\ninsert :: Int -> Tree -> Tree\ninsert x Leaf = Node Leaf x Leaf\ninsert x t@(Node l v r)\n  | x < v = Node (insert x l) v r\n  | x > v = Node l v (insert x r)\n  | otherwise = t\n\ninOrder :: Tree -> [Int]\ninOrder Leaf = []\ninOrder (Node l v r) = inOrder l ++ [v] ++ inOrder r\n",
  nearMiss: [
    // Duplicates go left instead of being skipped.
    "data Tree = Leaf | Node Tree Int Tree\n\ninsert :: Int -> Tree -> Tree\ninsert x Leaf = Node Leaf x Leaf\ninsert x (Node l v r)\n  | x <= v = Node (insert x l) v r\n  | otherwise = Node l v (insert x r)\n\ninOrder :: Tree -> [Int]\ninOrder Leaf = []\ninOrder (Node l v r) = inOrder l ++ [v] ++ inOrder r\n",
    // Lists the node before its subtrees (pre-order), so the result is not sorted.
    "data Tree = Leaf | Node Tree Int Tree\n\ninsert :: Int -> Tree -> Tree\ninsert x Leaf = Node Leaf x Leaf\ninsert x t@(Node l v r)\n  | x < v = Node (insert x l) v r\n  | x > v = Node l v (insert x r)\n  | otherwise = t\n\ninOrder :: Tree -> [Int]\ninOrder Leaf = []\ninOrder (Node l v r) = v : inOrder l ++ inOrder r\n",
  ],
  tests: [
    { run: "print (inOrder (foldr insert Leaf [5, 3, 8]))", expect: "[3,5,8]" },
    { run: "print (inOrder Leaf)", expect: "[]" },
    { run: "print (inOrder (foldr insert Leaf [2, 7, 2, 7]))", expect: "[2,7]", hidden: true },
    { run: "print (inOrder (insert 4 (insert 9 (insert 1 Leaf))))", expect: "[1,4,9]", hidden: true },
    { run: "print (inOrder (foldr insert Leaf [-1, 0, -5]))", expect: "[-5,-1,0]", hidden: true },
  ],
  hint: L(
    "One equation per constructor: Leaf is where a new number lands; at a Node, compare with its value.",
    "Una ecuación por constructor: en Leaf cae el número nuevo; en un Node, compara con su valor.",
    "コンストラクタごとに式を1つ。新しい数は Leaf に入る。Node ではその値と比べよう。",
  ),
  note: "recap-data",
  explain: L(
    "insert rebuilds only the path it walks and returns the tree unchanged on an equal value. inOrder goes left, node, right.",
    "insert reconstruye solo el camino que recorre y devuelve el árbol igual si el valor ya está. inOrder va izquierda, nodo, derecha.",
    "insert は通った道だけ作り直し、同じ値なら木をそのまま返す。inOrder は左・ノード・右の順。",
  ),
};

/** Monad Tower boss (The Tower Guardian): a Data.Map chest with Either errors, chained with >>=. */
export const withdrawTask: CodeTaskBeat = {
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the guarded chest", "Mini proyecto: el cofre vigilado", "ミニ課題：見張られた宝箱"),
  brief: L(
    "Write withdraw :: String -> Int -> M.Map String Int -> Either String (M.Map String Int). It takes n of an item out of the chest. Missing item: Left \"no gem\". Fewer than n: Left \"not enough gem\". Otherwise Right the new chest; when the count reaches 0, remove the item. Results can be chained with >>=.",
    "Escribe withdraw :: String -> Int -> M.Map String Int -> Either String (M.Map String Int). Saca n de un objeto del cofre. Si no está: Left \"no gem\". Si hay menos de n: Left \"not enough gem\". Si no, Right con el cofre nuevo; si la cantidad llega a 0, quita el objeto. Se puede encadenar con >>=.",
    "withdraw :: String -> Int -> M.Map String Int -> Either String (M.Map String Int) を書こう。宝箱からアイテムを n 個取り出す。ないなら Left \"no gem\"、n 個未満なら Left \"not enough gem\"。それ以外は新しい宝箱を Right で返し、0 個になったらアイテムを消す。>>= でつなげられる。",
  ),
  starter:
    "import qualified Data.Map as M\n\nwithdraw :: String -> Int -> M.Map String Int -> Either String (M.Map String Int)\nwithdraw item _ _ = Left (\"no \" ++ item) -- your code here\n",
  solution:
    "import qualified Data.Map as M\n\nwithdraw :: String -> Int -> M.Map String Int -> Either String (M.Map String Int)\nwithdraw item n chest = case M.lookup item chest of\n  Nothing -> Left (\"no \" ++ item)\n  Just have\n    | have < n -> Left (\"not enough \" ++ item)\n    | have == n -> Right (M.delete item chest)\n    | otherwise -> Right (M.insert item (have - n) chest)\n",
  nearMiss: [
    // Leaves the item in the chest with a count of 0.
    "import qualified Data.Map as M\n\nwithdraw :: String -> Int -> M.Map String Int -> Either String (M.Map String Int)\nwithdraw item n chest = case M.lookup item chest of\n  Nothing -> Left (\"no \" ++ item)\n  Just have\n    | have < n -> Left (\"not enough \" ++ item)\n    | otherwise -> Right (M.insert item (have - n) chest)\n",
    // Off by one: taking exactly what is there is refused.
    "import qualified Data.Map as M\n\nwithdraw :: String -> Int -> M.Map String Int -> Either String (M.Map String Int)\nwithdraw item n chest = case M.lookup item chest of\n  Nothing -> Left (\"no \" ++ item)\n  Just have\n    | have <= n -> Left (\"not enough \" ++ item)\n    | otherwise -> Right (M.insert item (have - n) chest)\n",
  ],
  tests: [
    { run: 'print (fmap M.toList (withdraw "gem" 1 (M.fromList [("gem", 3)])))', expect: 'Right [("gem",2)]' },
    { run: 'print (fmap M.toList (withdraw "key" 1 (M.fromList [("gem", 3)])))', expect: 'Left "no key"' },
    { run: 'print (fmap M.toList (withdraw "gem" 3 (M.fromList [("gem", 3), ("owl", 1)])))', expect: 'Right [("owl",1)]', hidden: true },
    { run: 'print (fmap M.toList (withdraw "gem" 4 (M.fromList [("gem", 3)])))', expect: 'Left "not enough gem"', hidden: true },
    { run: 'print (fmap M.toList (withdraw "gem" 1 (M.fromList [("gem", 2), ("key", 1)]) >>= withdraw "key" 1 >>= withdraw "gem" 1))', expect: "Right []", hidden: true },
    { run: 'print (fmap M.toList (withdraw "gem" 2 (M.fromList [("gem", 2)]) >>= withdraw "gem" 1))', expect: 'Left "no gem"', hidden: true },
  ],
  hint: L(
    "Start with M.lookup and handle each case: missing, too few, exactly enough, more than enough.",
    "Empieza con M.lookup y trata cada caso: no está, muy pocos, justo lo necesario, más que suficiente.",
    "M.lookup から始め、ない・足りない・ちょうど・多い、の各場合を扱おう。",
  ),
  note: "recap-io-map",
  explain: L(
    "M.lookup gives a Maybe to case on. Guards pick the error or the new map; M.delete drops an item that reaches 0.",
    "M.lookup da un Maybe para hacer case. Las guardas eligen el error o el mapa nuevo; M.delete quita el objeto que llega a 0.",
    "M.lookup の Maybe を case で分ける。ガードでエラーか新しい Map を選び、0 個になったら M.delete で消す。",
  ),
};

// ─── Junior screening (mode "ide") ──────────────────────────────────────────

export const countVowelsTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "lists",
  difficulty: 1,
  prompt: L("Coding: count the vowels", "Código: cuenta las vocales", "コーディング：母音を数える"),
  brief: L(
    "Write countVowels :: String -> Int that returns how many vowels (a, e, i, o, u) the text has, in upper or lower case.",
    "Escribe countVowels :: String -> Int que devuelva cuántas vocales (a, e, i, o, u) tiene el texto, en mayúscula o minúscula.",
    "countVowels :: String -> Int を書こう。文字列の母音（a, e, i, o, u）の数を、大文字・小文字どちらも数えて返す。",
  ),
  starter: "countVowels :: String -> Int\ncountVowels _ = 0 -- your code here\n",
  solution: "countVowels :: String -> Int\ncountVowels = length . filter (`elem` \"aeiouAEIOU\")\n",
  nearMiss: [
    // Only lower-case vowels count.
    "countVowels :: String -> Int\ncountVowels = length . filter (`elem` \"aeiou\")\n",
  ],
  tests: [
    { run: 'print (countVowels "Bitwise")', expect: "3" },
    { run: 'print (countVowels "")', expect: "0" },
    { run: 'print (countVowels "AEIOU xyz")', expect: "5", hidden: true },
    { run: 'print (countVowels "rhythm")', expect: "0", hidden: true },
    { run: 'print (countVowels "Queue")', expect: "4", hidden: true },
  ],
  explain: L(
    "Keep the characters that are vowels with filter and count them with length. List both cases, or lower-case with toLower first.",
    "Quédate con los caracteres que son vocales con filter y cuéntalos con length. Lista ambos casos, o pasa a minúsculas con toLower.",
    "filter で母音だけ残し、length で数える。大文字も並べるか、先に toLower で小文字にする。",
  ),
};

export const digitSumTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "recursion",
  difficulty: 1,
  prompt: L("Coding: add up the digits", "Código: suma los dígitos", "コーディング：各桁の和"),
  brief: L(
    "Write digitSum :: Int -> Int that adds up the decimal digits of a number with recursion: digitSum 123 is 6. For a negative number, use its digits without the sign: digitSum (-45) is 9. digitSum 0 is 0.",
    "Escribe digitSum :: Int -> Int que sume los dígitos decimales de un número con recursión: digitSum 123 es 6. Para un número negativo, usa sus dígitos sin el signo: digitSum (-45) es 9. digitSum 0 es 0.",
    "再帰で数の各桁を足す digitSum :: Int -> Int を書こう。digitSum 123 は 6。負の数は符号なしの桁で数える：digitSum (-45) は 9。digitSum 0 は 0。",
  ),
  starter: "digitSum :: Int -> Int\ndigitSum _ = 0 -- your code here\n",
  solution:
    "digitSum :: Int -> Int\ndigitSum n\n  | n < 0 = digitSum (negate n)\n  | n < 10 = n\n  | otherwise = n `mod` 10 + digitSum (n `div` 10)\n",
  nearMiss: [
    // Forgets negatives: -45 is already "< 10" and comes back as is.
    "digitSum :: Int -> Int\ndigitSum n\n  | n < 10 = n\n  | otherwise = n `mod` 10 + digitSum (n `div` 10)\n",
    // Wrong base case: the last digit is dropped.
    "digitSum :: Int -> Int\ndigitSum n\n  | n < 0 = digitSum (negate n)\n  | n < 10 = 0\n  | otherwise = n `mod` 10 + digitSum (n `div` 10)\n",
  ],
  tests: [
    { run: "print (digitSum 123)", expect: "6" },
    { run: "print (digitSum 0)", expect: "0" },
    { run: "print (digitSum 7)", expect: "7", hidden: true },
    { run: "print (digitSum (-45))", expect: "9", hidden: true },
    { run: "print (digitSum 1000)", expect: "1", hidden: true },
    { run: "print (digitSum 99999)", expect: "45", hidden: true },
  ],
  explain: L(
    "n `mod` 10 is the last digit and n `div` 10 drops it. A one-digit number is its own sum; negate a negative first.",
    "n `mod` 10 es el último dígito y n `div` 10 lo quita. Un número de un dígito es su propia suma; a un negativo, cámbiale el signo primero.",
    "n `mod` 10 が最後の桁、n `div` 10 でその桁を落とす。1桁ならそれ自体が和。負の数は先に negate。",
  ),
};

export const fizzBuzzTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "patterns",
  difficulty: 1,
  prompt: L("Coding: FizzBuzz with guards", "Código: FizzBuzz con guardas", "コーディング：ガードで FizzBuzz"),
  brief: L(
    "Write fizzBuzz :: Int -> String. Multiples of both 3 and 5 give \"FizzBuzz\", other multiples of 3 give \"Fizz\", other multiples of 5 give \"Buzz\", and any other number gives its digits, e.g. \"7\".",
    "Escribe fizzBuzz :: Int -> String. Los múltiplos de 3 y de 5 a la vez dan \"FizzBuzz\", los demás múltiplos de 3 dan \"Fizz\", los demás de 5 dan \"Buzz\" y cualquier otro número da sus dígitos, p. ej. \"7\".",
    "fizzBuzz :: Int -> String を書こう。3 と 5 両方の倍数は \"FizzBuzz\"、それ以外の 3 の倍数は \"Fizz\"、5 の倍数は \"Buzz\"、その他の数は \"7\" のように数字を返す。",
  ),
  starter: "fizzBuzz :: Int -> String\nfizzBuzz n = show n -- your code here\n",
  solution:
    "fizzBuzz :: Int -> String\nfizzBuzz n\n  | n `mod` 15 == 0 = \"FizzBuzz\"\n  | n `mod` 3 == 0 = \"Fizz\"\n  | n `mod` 5 == 0 = \"Buzz\"\n  | otherwise = show n\n",
  nearMiss: [
    // Checks 3 before 15: multiples of 15 stop at "Fizz".
    "fizzBuzz :: Int -> String\nfizzBuzz n\n  | n `mod` 3 == 0 = \"Fizz\"\n  | n `mod` 5 == 0 = \"Buzz\"\n  | n `mod` 15 == 0 = \"FizzBuzz\"\n  | otherwise = show n\n",
  ],
  tests: [
    { run: "print (map fizzBuzz [1 .. 5])", expect: '["1","2","Fizz","4","Buzz"]' },
    { run: "print (fizzBuzz 15)", expect: '"FizzBuzz"' },
    { run: "print (fizzBuzz 30)", expect: '"FizzBuzz"', hidden: true },
    { run: "print (fizzBuzz 9)", expect: '"Fizz"', hidden: true },
    { run: "print (fizzBuzz 7)", expect: '"7"', hidden: true },
  ],
  explain: L(
    "Guards are tried top to bottom, so the most specific test (divisible by 15) must come first.",
    "Las guardas se prueban de arriba abajo, así que la prueba más específica (divisible por 15) va primero.",
    "ガードは上から試すので、いちばん具体的な条件（15 で割り切れる）を先に書く。",
  ),
};

export const compressTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "lists",
  difficulty: 2,
  prompt: L("Coding: squash repeated neighbours", "Código: junta vecinos repetidos", "コーディング：となりの重複をまとめる"),
  brief: L(
    "Write compress :: Eq a => [a] -> [a] that replaces each run of equal neighbours with a single copy: compress \"aaabccaa\" is \"abca\". Equal values that are not next to each other stay. Empty in, empty out.",
    "Escribe compress :: Eq a => [a] -> [a] que reemplace cada racha de vecinos iguales por una sola copia: compress \"aaabccaa\" es \"abca\". Los valores iguales que no están juntos se quedan. Vacía entra, vacía sale.",
    "compress :: Eq a => [a] -> [a] を書こう。となり合う同じ値の連続を1つにまとめる。compress \"aaabccaa\" は \"abca\"。離れている同じ値は残す。空なら空を返す。",
  ),
  starter: "compress :: Eq a => [a] -> [a]\ncompress xs = xs -- your code here\n",
  solution:
    "compress :: Eq a => [a] -> [a]\ncompress (x:y:rest)\n  | x == y = compress (y : rest)\n  | otherwise = x : compress (y : rest)\ncompress xs = xs\n",
  nearMiss: [
    // nub removes every later duplicate, not just neighbours.
    "import Data.List (nub)\n\ncompress :: Eq a => [a] -> [a]\ncompress = nub\n",
    // Drops both neighbours instead of keeping one.
    "compress :: Eq a => [a] -> [a]\ncompress (x:y:rest)\n  | x == y = compress rest\n  | otherwise = x : compress (y : rest)\ncompress xs = xs\n",
  ],
  tests: [
    { run: 'print (compress "aaabccaa")', expect: '"abca"' },
    { run: "print (compress [1, 1, 2, 3, 3 :: Int])", expect: "[1,2,3]" },
    { run: 'print (compress "")', expect: '""', hidden: true },
    { run: "print (compress [5 :: Int])", expect: "[5]", hidden: true },
    { run: 'print (compress "abab")', expect: '"abab"', hidden: true },
  ],
  explain: L(
    "Look at two items at a time: when they are equal, keep only the second and go on; otherwise emit the first.",
    "Mira dos elementos a la vez: si son iguales, quédate solo con el segundo y sigue; si no, emite el primero.",
    "2つずつ見る。同じなら2つ目だけ残して続け、ちがえば1つ目を出す。",
  ),
};

// ─── Mid screening (2 "ide" + 2 "paper") ───────────────────────────────────

export const wordFreqTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "containers",
  difficulty: 2,
  prompt: L("Coding: word frequencies with Data.Map", "Código: frecuencia de palabras con Data.Map", "コーディング：Data.Map で単語を数える"),
  brief: L(
    "Write wordFreq :: String -> [(String, Int)]. Split the text into words (any whitespace), lower-case them and count each one. Return the pairs sorted by word. Empty text gives [].",
    "Escribe wordFreq :: String -> [(String, Int)]. Separa el texto en palabras (cualquier espacio en blanco), pásalas a minúsculas y cuenta cada una. Devuelve los pares ordenados por palabra. Un texto vacío da [].",
    "wordFreq :: String -> [(String, Int)] を書こう。テキストを空白で単語に分け、小文字にしてそれぞれ数える。単語順に並べたペアを返す。空なら []。",
  ),
  starter:
    "import qualified Data.Map as M\nimport Data.Char (toLower)\n\nwordFreq :: String -> [(String, Int)]\nwordFreq _ = [] -- your code here\n",
  solution:
    "import qualified Data.Map as M\nimport Data.Char (toLower)\n\nwordFreq :: String -> [(String, Int)]\nwordFreq text = M.toList (M.fromListWith (+) [(map toLower w, 1) | w <- words text])\n",
  nearMiss: [
    // fromList keeps only the last value per key: every count is 1.
    "import qualified Data.Map as M\nimport Data.Char (toLower)\n\nwordFreq :: String -> [(String, Int)]\nwordFreq text = M.toList (M.fromList [(map toLower w, 1) | w <- words text])\n",
    // Forgets to lower-case.
    "import qualified Data.Map as M\nimport Data.Char (toLower)\n\nwordFreq :: String -> [(String, Int)]\nwordFreq text = M.toList (M.fromListWith (+) [(w, 1) | w <- words text])\n",
  ],
  tests: [
    { run: 'print (wordFreq "the cat the")', expect: '[("cat",1),("the",2)]' },
    { run: 'print (wordFreq "")', expect: "[]" },
    { run: 'print (wordFreq "Go go GO stop")', expect: '[("go",3),("stop",1)]', hidden: true },
    { run: 'print (wordFreq "  b   a  b ")', expect: '[("a",1),("b",2)]', hidden: true },
    { run: 'print (wordFreq "Zed apple")', expect: '[("apple",1),("zed",1)]', hidden: true },
  ],
  explain: L(
    "M.fromListWith (+) adds the 1s of repeated keys, and M.toList returns the pairs sorted by key. words splits on any whitespace.",
    "M.fromListWith (+) suma los 1 de las claves repetidas y M.toList devuelve los pares ordenados por clave. words separa con cualquier espacio.",
    "M.fromListWith (+) は同じキーの 1 を足し、M.toList はキー順でペアを返す。words はどんな空白でも分ける。",
  ),
};

export const parseAgeTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "maybe_either",
  difficulty: 2,
  prompt: L("Coding: parse an age safely", "Código: lee una edad sin caerte", "コーディング：年齢を安全に読む"),
  brief: L(
    "Write parseAge :: String -> Either String Int. Text that is not a whole number gives Left \"not a number\"; a number below 0 or above 150 gives Left \"out of range\"; anything else gives Right with the age. It must never crash.",
    "Escribe parseAge :: String -> Either String Int. Un texto que no es un número entero da Left \"not a number\"; un número menor que 0 o mayor que 150 da Left \"out of range\"; lo demás da Right con la edad. Nunca debe caerse.",
    "parseAge :: String -> Either String Int を書こう。整数でない文字列は Left \"not a number\"、0 未満か 150 より大きい数は Left \"out of range\"、それ以外は Right で年齢を返す。絶対に落ちないこと。",
  ),
  starter:
    "import Text.Read (readMaybe)\n\nparseAge :: String -> Either String Int\nparseAge _ = Left \"not a number\" -- your code here\n",
  solution:
    "import Text.Read (readMaybe)\n\nparseAge :: String -> Either String Int\nparseAge s = case readMaybe s of\n  Nothing -> Left \"not a number\"\n  Just n\n    | n < 0 || n > 150 -> Left \"out of range\"\n    | otherwise -> Right n\n",
  nearMiss: [
    // read crashes with "no parse" on bad text.
    "parseAge :: String -> Either String Int\nparseAge s =\n  let n = read s\n  in if n < 0 || n > 150 then Left \"out of range\" else Right n\n",
    // Off by one: 150 itself is refused.
    "import Text.Read (readMaybe)\n\nparseAge :: String -> Either String Int\nparseAge s = case readMaybe s of\n  Nothing -> Left \"not a number\"\n  Just n\n    | n < 0 || n >= 150 -> Left \"out of range\"\n    | otherwise -> Right n\n",
  ],
  tests: [
    { run: 'print (parseAge "42")', expect: "Right 42" },
    { run: 'print (parseAge "abc")', expect: 'Left "not a number"' },
    { run: 'print (parseAge "")', expect: 'Left "not a number"', hidden: true },
    { run: 'print (parseAge "150")', expect: "Right 150", hidden: true },
    { run: 'print (parseAge "-1")', expect: 'Left "out of range"', hidden: true },
    { run: 'print (parseAge "151")', expect: 'Left "out of range"', hidden: true },
  ],
  explain: L(
    "readMaybe returns Nothing instead of crashing like read. Then guards check the range; 0 and 150 are both allowed.",
    "readMaybe devuelve Nothing en vez de caerse como read. Luego las guardas revisan el rango; 0 y 150 están permitidos.",
    "readMaybe は read のように落ちず Nothing を返す。その後ガードで範囲を確認。0 と 150 は OK。",
  ),
};

export const finalBalanceTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "folds",
  difficulty: 2,
  prompt: L("Written test: replay a ledger with a fold", "Prueba escrita: repasa un libro con un fold", "筆記：fold で取引をたどる"),
  brief: L(
    "Write finalBalance :: [(String, Int)] -> Int. Start at 0 and process the operations in order: (\"deposit\", n) adds n; (\"withdraw\", n) subtracts n only if the balance is at least n, otherwise it is ignored; any other operation is ignored.",
    "Escribe finalBalance :: [(String, Int)] -> Int. Empieza en 0 y procesa las operaciones en orden: (\"deposit\", n) suma n; (\"withdraw\", n) resta n solo si el saldo es al menos n, si no se ignora; cualquier otra operación se ignora.",
    "finalBalance :: [(String, Int)] -> Int を書こう。残高 0 から操作を順番に処理する。(\"deposit\", n) は n を足す。(\"withdraw\", n) は残高が n 以上のときだけ引き、足りなければ無視。その他の操作も無視。",
  ),
  starter: "finalBalance :: [(String, Int)] -> Int\nfinalBalance _ = 0 -- your code here\n",
  solution:
    "finalBalance :: [(String, Int)] -> Int\nfinalBalance = foldl step 0\n  where\n    step bal (\"deposit\", n) = bal + n\n    step bal (\"withdraw\", n) | n <= bal = bal - n\n    step bal _ = bal\n",
  nearMiss: [
    // foldr replays the operations from the last one.
    "finalBalance :: [(String, Int)] -> Int\nfinalBalance = foldr (flip step) 0\n  where\n    step bal (\"deposit\", n) = bal + n\n    step bal (\"withdraw\", n) | n <= bal = bal - n\n    step bal _ = bal\n",
    // Off by one: withdrawing the whole balance is refused.
    "finalBalance :: [(String, Int)] -> Int\nfinalBalance = foldl step 0\n  where\n    step bal (\"deposit\", n) = bal + n\n    step bal (\"withdraw\", n) | n < bal = bal - n\n    step bal _ = bal\n",
  ],
  tests: [
    { run: 'print (finalBalance [("deposit", 100), ("withdraw", 30)])', expect: "70" },
    { run: "print (finalBalance [])", expect: "0" },
    { run: 'print (finalBalance [("withdraw", 5), ("deposit", 10)])', expect: "10", hidden: true },
    { run: 'print (finalBalance [("deposit", 10), ("withdraw", 10)])', expect: "0", hidden: true },
    { run: 'print (finalBalance [("deposit", 5), ("refund", 50), ("withdraw", 6)])', expect: "5", hidden: true },
  ],
  explain: L(
    "foldl carries the balance from the first operation to the last. Order matters here, so foldr would give wrong answers.",
    "foldl lleva el saldo de la primera operación a la última. Aquí el orden importa, así que foldr daría respuestas erróneas.",
    "foldl は残高を最初の操作から最後まで運ぶ。ここでは順番が大事なので foldr だとまちがえる。",
  ),
};

export const evalExprTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "adts",
  difficulty: 2,
  prompt: L("Written test: evaluate an expression tree", "Prueba escrita: evalúa un árbol de expresiones", "筆記：式の木を評価する"),
  brief: L(
    "Given data Expr = Num Int | Add Expr Expr | Mul Expr Expr | Neg Expr, write eval :: Expr -> Int. Add adds, Mul multiplies and Neg flips the sign of its expression. Example: eval (Add (Num 2) (Mul (Num 3) (Num 4))) is 14.",
    "Dado data Expr = Num Int | Add Expr Expr | Mul Expr Expr | Neg Expr, escribe eval :: Expr -> Int. Add suma, Mul multiplica y Neg cambia el signo de su expresión. Ejemplo: eval (Add (Num 2) (Mul (Num 3) (Num 4))) es 14.",
    "data Expr = Num Int | Add Expr Expr | Mul Expr Expr | Neg Expr に対し eval :: Expr -> Int を書こう。Add は足し算、Mul は掛け算、Neg は符号を反転。例：eval (Add (Num 2) (Mul (Num 3) (Num 4))) は 14。",
  ),
  starter: "data Expr = Num Int | Add Expr Expr | Mul Expr Expr | Neg Expr\n\neval :: Expr -> Int\neval _ = 0 -- your code here\n",
  solution:
    "data Expr = Num Int | Add Expr Expr | Mul Expr Expr | Neg Expr\n\neval :: Expr -> Int\neval (Num n) = n\neval (Add a b) = eval a + eval b\neval (Mul a b) = eval a * eval b\neval (Neg e) = negate (eval e)\n",
  nearMiss: [
    // Neg is passed through unchanged.
    "data Expr = Num Int | Add Expr Expr | Mul Expr Expr | Neg Expr\n\neval :: Expr -> Int\neval (Num n) = n\neval (Add a b) = eval a + eval b\neval (Mul a b) = eval a * eval b\neval (Neg e) = eval e\n",
    // Copy-paste slip: Mul adds.
    "data Expr = Num Int | Add Expr Expr | Mul Expr Expr | Neg Expr\n\neval :: Expr -> Int\neval (Num n) = n\neval (Add a b) = eval a + eval b\neval (Mul a b) = eval a + eval b\neval (Neg e) = negate (eval e)\n",
  ],
  tests: [
    { run: "print (eval (Add (Num 2) (Mul (Num 3) (Num 4))))", expect: "14" },
    { run: "print (eval (Num 7))", expect: "7" },
    { run: "print (eval (Neg (Add (Num 1) (Num 2))))", expect: "-3", hidden: true },
    { run: "print (eval (Mul (Neg (Num 2)) (Num 5)))", expect: "-10", hidden: true },
    { run: "print (eval (Mul (Num 0) (Num 9)))", expect: "0", hidden: true },
  ],
  explain: L(
    "One equation per constructor, recursing into the sub-expressions. Neg needs negate on the result of eval.",
    "Una ecuación por constructor, con recursión en las subexpresiones. Neg necesita negate sobre el resultado de eval.",
    "コンストラクタごとに式を1つ書き、部分式は再帰で評価。Neg は eval の結果に negate を使う。",
  ),
};

// ─── Senior screening (1 "ide" + 3 "paper") ────────────────────────────────

export const statsMonoidTask: ExamQuestion = {
  kind: "code",
  mode: "ide",
  topic: "typeclasses",
  difficulty: 3,
  prompt: L("Coding: a Semigroup for statistics", "Código: un Semigroup de estadísticas", "コーディング：統計の Semigroup"),
  brief: L(
    "Stats keeps a count, a total and the biggest value seen (Nothing when empty). Implement the Semigroup instance so that <> combines two Stats: counts and totals add up, biggest is the larger of the two. mempty and single are given; mconcat (map single xs) must summarize any list, including negative numbers.",
    "Stats guarda una cantidad, un total y el mayor valor visto (Nothing si está vacío). Implementa la instancia Semigroup para que <> combine dos Stats: cantidades y totales se suman, biggest es el mayor de los dos. mempty y single ya están; mconcat (map single xs) debe resumir cualquier lista, también con negativos.",
    "Stats は個数・合計・最大値（空なら Nothing）を持つ。<> で2つの Stats をまとめる Semigroup インスタンスを実装しよう。個数と合計は足し、biggest は大きい方。mempty と single は用意済み。mconcat (map single xs) は負の数を含むどんなリストもまとめること。",
  ),
  starter:
    "data Stats = Stats { count :: Int, total :: Int, biggest :: Maybe Int } deriving (Show, Eq)\n\nsingle :: Int -> Stats\nsingle x = Stats 1 x (Just x)\n\ninstance Semigroup Stats where\n  a <> _ = a -- your code here\n\ninstance Monoid Stats where\n  mempty = Stats 0 0 Nothing\n",
  solution:
    "data Stats = Stats { count :: Int, total :: Int, biggest :: Maybe Int } deriving (Show, Eq)\n\nsingle :: Int -> Stats\nsingle x = Stats 1 x (Just x)\n\ninstance Semigroup Stats where\n  Stats c1 t1 b1 <> Stats c2 t2 b2 = Stats (c1 + c2) (t1 + t2) (max b1 b2)\n\ninstance Monoid Stats where\n  mempty = Stats 0 0 Nothing\n",
  nearMiss: [
    // Treats a missing biggest as 0, which beats every negative number.
    "import Data.Maybe (fromMaybe)\n\ndata Stats = Stats { count :: Int, total :: Int, biggest :: Maybe Int } deriving (Show, Eq)\n\nsingle :: Int -> Stats\nsingle x = Stats 1 x (Just x)\n\ninstance Semigroup Stats where\n  Stats c1 t1 b1 <> Stats c2 t2 b2 = Stats (c1 + c2) (t1 + t2) (Just (max (fromMaybe 0 b1) (fromMaybe 0 b2)))\n\ninstance Monoid Stats where\n  mempty = Stats 0 0 Nothing\n",
    // Counts one per combination instead of adding the counts.
    "data Stats = Stats { count :: Int, total :: Int, biggest :: Maybe Int } deriving (Show, Eq)\n\nsingle :: Int -> Stats\nsingle x = Stats 1 x (Just x)\n\ninstance Semigroup Stats where\n  Stats c1 t1 b1 <> Stats _ t2 b2 = Stats (c1 + 1) (t1 + t2) (max b1 b2)\n\ninstance Monoid Stats where\n  mempty = Stats 0 0 Nothing\n",
  ],
  tests: [
    { run: "print (mconcat (map single [3, 1, 4]))", expect: "Stats {count = 3, total = 8, biggest = Just 4}" },
    { run: "print (single 5 <> mempty)", expect: "Stats {count = 1, total = 5, biggest = Just 5}" },
    { run: "print (mconcat (map single [-7, -2]))", expect: "Stats {count = 2, total = -9, biggest = Just (-2)}", hidden: true },
    { run: "print (mempty <> single 2 <> single 2)", expect: "Stats {count = 2, total = 4, biggest = Just 2}", hidden: true },
    { run: "print (mempty <> mempty :: Stats)", expect: "Stats {count = 0, total = 0, biggest = Nothing}", hidden: true },
  ],
  explain: L(
    "Add the counts and totals field by field. Maybe's Ord puts Nothing below any Just, so max b1 b2 handles empty sides and negatives.",
    "Suma cantidades y totales campo a campo. El Ord de Maybe pone Nothing debajo de cualquier Just, así max b1 b2 maneja lados vacíos y negativos.",
    "個数と合計はフィールドごとに足す。Maybe の Ord では Nothing はどの Just より小さいので、max b1 b2 で空も負の数も扱える。",
  ),
};

export const parseAllTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "monads",
  difficulty: 3,
  prompt: L("Written test: parse all or report the first error", "Prueba escrita: lee todo o el primer error", "筆記：全部読むか最初のエラー"),
  brief: L(
    "Write parseAll :: [String] -> Either String [Int]. If every string is a whole number, return Right with all of them in order. Otherwise return Left \"bad: \" followed by the FIRST string that is not a number. An empty list gives Right [].",
    "Escribe parseAll :: [String] -> Either String [Int]. Si cada string es un número entero, devuelve Right con todos en orden. Si no, devuelve Left \"bad: \" seguido del PRIMER string que no es número. Una lista vacía da Right [].",
    "parseAll :: [String] -> Either String [Int] を書こう。全部が整数なら順番どおり Right で返す。そうでなければ、数でない「最初の」文字列を Left \"bad: \" に続けて返す。空リストは Right []。",
  ),
  starter: "import Text.Read (readMaybe)\n\nparseAll :: [String] -> Either String [Int]\nparseAll _ = Right [] -- your code here\n",
  solution:
    "import Text.Read (readMaybe)\n\nparseAll :: [String] -> Either String [Int]\nparseAll = traverse parseOne\n  where\n    parseOne s = maybe (Left (\"bad: \" ++ s)) Right (readMaybe s)\n",
  nearMiss: [
    // Silently skips the bad strings.
    "import Data.Maybe (mapMaybe)\nimport Text.Read (readMaybe)\n\nparseAll :: [String] -> Either String [Int]\nparseAll xs = Right (mapMaybe readMaybe xs)\n",
    // Reports the last bad string, not the first.
    "import Text.Read (readMaybe)\n\nparseAll :: [String] -> Either String [Int]\nparseAll xs = case [s | s <- xs, (readMaybe s :: Maybe Int) == Nothing] of\n  [] -> Right (map read xs)\n  bad -> Left (\"bad: \" ++ last bad)\n",
  ],
  tests: [
    { run: 'print (parseAll ["1", "22", "-3"])', expect: "Right [1,22,-3]" },
    { run: 'print (parseAll ["1", "x", "y"])', expect: 'Left "bad: x"' },
    { run: "print (parseAll [])", expect: "Right []", hidden: true },
    { run: 'print (parseAll ["4", "2.5"])', expect: 'Left "bad: 2.5"', hidden: true },
    { run: 'print (parseAll ["a", "9", "b"])', expect: 'Left "bad: a"', hidden: true },
  ],
  explain: L(
    "traverse runs the parser on each string in the Either monad: it collects the Rights and stops at the first Left.",
    "traverse aplica el parser a cada string en la mónada Either: junta los Right y se detiene en el primer Left.",
    "traverse は Either モナドで各文字列を解析し、Right を集めて最初の Left で止まる。",
  ),
};

export const groupByLengthTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "containers",
  difficulty: 3,
  prompt: L("Written test: group words by length", "Prueba escrita: agrupa palabras por largo", "筆記：単語を長さでまとめる"),
  brief: L(
    "Write groupByLength :: [String] -> M.Map Int [String] (Data.Map imported as M). Each key is a word length; its value lists the words of that length in the order they appear in the input, duplicates included. An empty input gives an empty map.",
    "Escribe groupByLength :: [String] -> M.Map Int [String] (Data.Map importado como M). Cada clave es un largo de palabra; su valor lista las palabras de ese largo en el orden en que aparecen en la entrada, con repetidas. Una entrada vacía da un mapa vacío.",
    "groupByLength :: [String] -> M.Map Int [String] を書こう（Data.Map は M として import）。キーは単語の長さ、値はその長さの単語を入力と同じ順に、重複も含めて並べたもの。空の入力なら空の Map。",
  ),
  starter:
    "import qualified Data.Map as M\n\ngroupByLength :: [String] -> M.Map Int [String]\ngroupByLength _ = M.empty -- your code here\n",
  solution:
    "import qualified Data.Map as M\n\ngroupByLength :: [String] -> M.Map Int [String]\ngroupByLength ws = M.fromListWith (flip (++)) [(length w, [w]) | w <- ws]\n",
  nearMiss: [
    // fromListWith calls f new old: plain (++) puts later words first.
    "import qualified Data.Map as M\n\ngroupByLength :: [String] -> M.Map Int [String]\ngroupByLength ws = M.fromListWith (++) [(length w, [w]) | w <- ws]\n",
    // fromList keeps only the last word of each length.
    "import qualified Data.Map as M\n\ngroupByLength :: [String] -> M.Map Int [String]\ngroupByLength ws = M.fromList [(length w, [w]) | w <- ws]\n",
  ],
  tests: [
    { run: 'print (M.toList (groupByLength ["hi", "sun", "yo", "cat"]))', expect: '[(2,["hi","yo"]),(3,["sun","cat"])]' },
    { run: "print (M.toList (groupByLength []))", expect: "[]" },
    { run: 'print (M.toList (groupByLength ["c", "b", "a"]))', expect: '[(1,["c","b","a"])]', hidden: true },
    { run: 'print (M.toList (groupByLength ["owl", "a", "owl"]))', expect: '[(1,["a"]),(3,["owl","owl"])]', hidden: true },
    { run: 'print (M.toList (groupByLength ["", "x"]))', expect: '[(0,[""]),(1,["x"])]', hidden: true },
  ],
  explain: L(
    "fromListWith passes the new value first. flip (++) appends it after the old list, keeping input order.",
    "fromListWith pasa primero el valor nuevo. flip (++) lo agrega después de la lista vieja y mantiene el orden de entrada.",
    "fromListWith は新しい値を先に渡す。flip (++) なら古いリストの後ろに足すので入力順が保たれる。",
  ),
};

export const rpnTask: ExamQuestion = {
  kind: "code",
  mode: "paper",
  topic: "maybe_either",
  difficulty: 3,
  prompt: L("Written test: a safe RPN calculator", "Prueba escrita: calculadora RPN segura", "筆記：安全な逆ポーランド電卓"),
  brief: L(
    "Write rpn :: String -> Maybe Int for reverse Polish notation: tokens split by spaces, numbers are pushed, + - * pop two values (\"10 3 -\" is 7). Return Just the result when exactly one value is left at the end; Nothing for an unknown token, too few values for an operator, or extra values left over.",
    "Escribe rpn :: String -> Maybe Int para notación polaca inversa: tokens separados por espacios, los números se apilan, + - * sacan dos valores (\"10 3 -\" es 7). Devuelve Just el resultado si al final queda exactamente un valor; Nothing ante un token desconocido, faltan valores para un operador o sobran valores.",
    "逆ポーランド記法の rpn :: String -> Maybe Int を書こう。トークンは空白区切り、数はスタックに積み、+ - * は2つ取り出す（\"10 3 -\" は 7）。最後に値がちょうど1つなら Just。不明なトークン、演算子の値不足、値の余りは Nothing。",
  ),
  starter: "import Text.Read (readMaybe)\n\nrpn :: String -> Maybe Int\nrpn _ = Nothing -- your code here\n",
  solution:
    "import Text.Read (readMaybe)\n\nrpn :: String -> Maybe Int\nrpn = go [] . words\n  where\n    go [x] [] = Just x\n    go _ [] = Nothing\n    go (y:x:st) (t:ts) | Just f <- op t = go (f x y : st) ts\n    go st (t:ts) = case readMaybe t of\n      Just n -> go (n : st) ts\n      Nothing -> Nothing\n    op \"+\" = Just (+)\n    op \"-\" = Just (-)\n    op \"*\" = Just (*)\n    op _ = Nothing\n",
  nearMiss: [
    // Pops the operands in the wrong order: "10 3 -" becomes 3 - 10.
    "import Text.Read (readMaybe)\n\nrpn :: String -> Maybe Int\nrpn = go [] . words\n  where\n    go [x] [] = Just x\n    go _ [] = Nothing\n    go (y:x:st) (t:ts) | Just f <- op t = go (f y x : st) ts\n    go st (t:ts) = case readMaybe t of\n      Just n -> go (n : st) ts\n      Nothing -> Nothing\n    op \"+\" = Just (+)\n    op \"-\" = Just (-)\n    op \"*\" = Just (*)\n    op _ = Nothing\n",
    // Ignores leftover values on the stack.
    "import Text.Read (readMaybe)\n\nrpn :: String -> Maybe Int\nrpn = go [] . words\n  where\n    go (x:_) [] = Just x\n    go _ [] = Nothing\n    go (y:x:st) (t:ts) | Just f <- op t = go (f x y : st) ts\n    go st (t:ts) = case readMaybe t of\n      Just n -> go (n : st) ts\n      Nothing -> Nothing\n    op \"+\" = Just (+)\n    op \"-\" = Just (-)\n    op \"*\" = Just (*)\n    op _ = Nothing\n",
  ],
  tests: [
    { run: 'print (rpn "3 4 +")', expect: "Just 7" },
    { run: 'print (rpn "1 +")', expect: "Nothing" },
    { run: 'print (rpn "10 3 -")', expect: "Just 7", hidden: true },
    { run: 'print (rpn "5 1 2 + 4 * + 3 -")', expect: "Just 14", hidden: true },
    { run: 'print (rpn "1 2")', expect: "Nothing", hidden: true },
    { run: 'print (rpn "2 x +")', expect: "Nothing", hidden: true },
  ],
  explain: L(
    "Keep a stack as a list: the top is the SECOND operand. Every failure returns Nothing, and only a single final value is Just.",
    "Usa una lista como pila: el tope es el SEGUNDO operando. Todo fallo devuelve Nothing y solo un único valor final es Just.",
    "リストをスタックにする。先頭は「2つ目」のオペランド。失敗はすべて Nothing、最後に値が1つだけなら Just。",
  ),
};
