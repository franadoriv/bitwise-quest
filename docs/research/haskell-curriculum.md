# Haskell planet (Lambdara): proposed curriculum and entry exams

Curriculum for the **Haskell planet** (pack `haskell`, planet "Lambdara", guide Lambo, bugs
`haskell/thunk-pile`, `haskell/bottom-wraith`, `haskell/partial-moth`; see
`content/haskell/planet.ts`): 4 regions plus the entry exams. It is written for a learner who may
know nothing about programming, and it follows what companies actually assess (see
[haskell-hiring-assessments.md](haskell-hiring-assessments.md)). Content authors turn this into a
language pack following [../content-model.md](../content-model.md),
[../authoring-lessons.md](../authoring-lessons.md) and [../exams.md](../exams.md).

## Conventions used in this file

### How the snippets were verified

Every snippet below was compiled and run with **GHC 9.8.4** on Compiler Explorer
(`POST https://godbolt.org/api/compiler/ghc984/compile`, `lang: "haskell"`,
`filters.execute: true`, no libraries selected) on 2026-10-06. Many snippets were batched into
one program per lesson; the answers are copied from the real output.

- Snippets are shown as **lines of `main = do`** in a single-file `Main` module with
  `main :: IO ()`. Lines under `top:` are top-level declarations (signatures, functions, `data`,
  `class`, `instance`) placed above `main`. Lines under `imports:` go at the top of the file.
  When a snippet shows its own `main`, it is the whole file.
- Short snippets are written on one line with `;` for readability in this file. In the game,
  split them into lines (layout). Inside `do { ... }` with braces, a `let` needs its own braces:
  `do { x <- Just 3; let { y = x * 2 }; return (x + y) }` (without them: `parse error on input '}'`).
- `print x` is `putStrLn (show x)`: strings and chars come out **with quotes** (`print "hi"`
  prints `"hi"`), negative numbers inside structures get parentheses (`Just (-3)`).
- Literals in a `let` inside `do` that are used at two incompatible types are ambiguous
  (monomorphism restriction): `let coins = 17` used with both `/` and `div` does not compile.
  Annotate (`let coins = 17 :: Int`) or use separate bindings.

### Answer tags

| Tag | Meaning | How a Haskell runner checks it |
|---|---|---|
| `[OUT]` | Compiles; exact stdout given (`/` separates lines) | `check: { compiles: true, stdout }` |
| `[CE]` | Does not compile; the real GHC message headline is quoted (godbolt prints ASCII quotes `` `x' ``, a UTF-8 terminal prints `‘x’`) | `check: { compiles: false }` |
| `[ERR]` | Compiles, then dies with a runtime error; stderr contains the quoted message. Stdout printed before the crash is given too | compiles + stderr contains the message (the Haskell equivalent of `throws`) |
| `[DOC]` | Concept or behaviour not safely machine-checkable (infinite loops, memory blow-ups, types shown by GHCi) | cite the official page |

Runtime facts that shape every question (all observed on `ghc984`):

- Runtime error stderr looks like `output.s: Prelude.head: empty list` plus a
  `CallStack (from HasCallStack):` block. Check only the message substring.
- Programs that loop forever or blow memory are killed (`SIGKILL`) and **lose all buffered
  stdout**. A function without a base case, `length [1..]`, or `foldl (+) 0 [1..10000000]` are
  [DOC] only.
- `putStrLn` with a non-ASCII character crashes on godbolt
  (`commitBuffer: invalid argument (cannot encode character '\233')`). Keep printed text ASCII.
- stdin is empty (`getLine` fails with `<stdin>: hGetLine: end of file`).
- `head`/`tail` produce a `-Wx-partial` **warning** in the build output; the build still
  succeeds.
- `foldl'` is not in the GHC 9.8 Prelude (it arrived in base 4.20 / GHC 9.10): write
  `import Data.List (foldl')`.
- `GHC2021` is the default language: bang patterns (`go !acc ...`) work without a pragma.
- `import qualified Data.Map as M` works (containers 0.6.8); so do `Data.Set`, `Data.IORef`,
  `Control.Monad.State` (mtl 2.3: import `Control.Monad` yourself for `replicateM`, `forM_`),
  `Control.Concurrent.STM`, `Control.DeepSeq`.

### Question kinds

`pick` (one `___`, 2-4 options), `predict` (output, "Does it compile?", "What happens?"),
`type` (exact token for `___`), `order` (lines in the correct order, unique), `run` (broken
starter that compiles → expected stdout substring that the starter cannot print). Prompts are
short, code at most 12 lines.

### Visual vocabulary (existing stage effects)

The stage understands: `enter`/`exit`, `tag` (label above an actor = name, optional value),
`untag`, `value` (value chip), `dead` (binding invalid), `item` (sword, potion, gem, shield,
scroll, key), `give` (move item), `clone` (duplicate item), `lend` (ghost copy goes and comes
back; `mut` for a writable loan), `drop`, `attack`/`hp`, `say`, `print` (stdout), `shake`
(error), `banner`, `wait`. Actors: `hero`, `ally`, `enemy` (enemy sprites:
`haskell/thunk-pile`, `haskell/bottom-wraith`, `haskell/partial-moth`). Suggested mapping:

| Haskell idea | On stage |
|---|---|
| A name bound to a value (`let x = 5`) | `tag "x"` with a `value "5"` chip. It never changes: trying to change it makes Lambo `say` "values never change" |
| Shadowing (`let n = 1` then `let n = 2`) | A **new** tag `n` covers the old one; the old one goes grey (`dead`), nothing was mutated |
| Pure function | An ally that always hands back the same item for the same item (`give` in, `give` out); no side effects, never touches the stage |
| Function application / currying | Hero `give`s the first item; the ally `clone`s itself into a new ally holding it (a partially applied function) that waits for the next item |
| Lists | A row of items; `:` puts an item at the front, `++` walks to the end of the first row |
| `String = [Char]` | A scroll cut into single letter tiles |
| Pattern matching | The ally checks the shape of the item (empty row? an item and the rest?) and `say`s which equation fired |
| Guards | Signposts checked top to bottom; `otherwise` is the last sign that always says yes |
| Recursion | The ally `clone`s itself on a smaller row until the empty row (base case) answers; then answers flow back |
| `map` / `filter` / `fold` | A conveyor: every item passes through an ally (map), through a gate (filter), or is melted into one gem (fold) |
| Laziness / thunk | A wrapped gift box (`item scroll` sealed). It is only opened when someone needs its value (`print` or a pattern match) |
| Space leak | Unopened boxes pile up into the `haskell/thunk-pile` enemy; `foldl'`/`seq` open each box immediately |
| Bottom (`undefined`, `error`) | The `haskell/bottom-wraith` hides inside a box; if the box is opened the stage `shake`s with the message; if nobody opens it, nothing happens |
| Partial function (`head []`, `fromJust Nothing`, `Map.!`) | The `haskell/partial-moth` eats holes in the air: `attack`, `shake`, banner `Prelude.head: empty list` |
| `Maybe` | A chest that is either empty (`Nothing`) or holds one item (`Just x`) |
| `Either` | A chest with two doors: `Left` holds an error scroll, `Right` the good item |
| ADT / record | A labelled item (constructor = crest on the item); record fields are small `tag`s on the item |
| Type class instance | A badge (shield crest) given to a type: everything wearing the `Show` badge can be `print`ed |
| Functor `fmap` | The ally reaches into the chest without opening the lid, transforms the item, closes it |
| Monad `>>=` / `do` | A chain of chests: each step opens the previous chest; an empty chest (`Nothing`/`Left`) stops the chain (`banner "SHORT-CIRCUIT"`) |
| `IO` action | A sealed scroll of instructions. Building it does nothing; only `main` reads it aloud (`print`) |
| `Data.Map` | A key ring: each `key` item opens one chest; inserting returns a **new** key ring (`clone`), the old ring is unchanged |

---

## Region plan (learning order)

Learning order: expressions and types → functions as values → laziness and data → type classes
and effects. Monads come last because they need functions, `Maybe`/`Either`, ADTs and type
classes; IO is used from lesson 1 only as `print`/`putStrLn` in `main` (Lambo calls it "the
speaking scroll" until region 4 explains it).

| # | Region slug | Theme | Big idea | Lessons |
|---|---|---|---|---|
| 1 | `lambda-village` | village | Expressions, immutability, types, lists and strings, pattern matching | 4 + boss (`haskell/partial-moth`) |
| 2 | `fold-forest` | forest | Recursion, higher-order functions, currying and composition, folds | 4 + boss (`haskell/thunk-pile`) |
| 3 | `lazy-mountain` | mountain | Laziness, thunks and bottom, algebraic data types, Maybe/Either | 4 + boss (`haskell/bottom-wraith`) |
| 4 | `monad-tower` | tower | Type classes, Functor/Applicative, Monad and `do`, IO and `Data.Map` | 4 + boss (all three bugs) |

Exam-only topics with no region yet (candidates for a future region 5, castle theme, e.g.
`transformer-castle`): monad transformers and mtl (`State`, `Reader`, `ExceptT`), concurrency
(`forkIO`, `MVar`, STM), strictness tooling (`deepseq`, strict fields, profiling), testing
(QuickCheck/Hspec) and type-level extensions (GADTs, type families). Question ideas for them
are in the exam section.

---

## Region 1: `lambda-village`, Expressions, types and patterns

Sources: Learn You a Haskell, "Starting Out" and "Types and Typeclasses" and "Syntax in
Functions" (https://learnyouahaskell.github.io/chapters.html); Real World Haskell ch. 1-3
(https://book.realworldhaskell.org/read/); Haskell 2010 Report ch. 3 "Expressions" and ch. 4
(https://www.haskell.org/onlinereport/haskell2010/); Prelude docs
(https://hackage.haskell.org/package/base/docs/Prelude.html).

### 1.1 `pure-expressions`, "Everything is an expression"

- **Concept**: a program is built from expressions that produce values; operator precedence
  (`*` before `+`, `^` is right-associative, `-` is left-associative); `div`/`mod` (integer)
  vs `/` (fractional); `div`/`mod` round toward negative infinity, `quot`/`rem` toward zero;
  negative literals need parentheses (`abs (-3)`); `let` names a value, it never changes
  (shadowing creates a new name); `if` is an expression and always needs `else`;
  `putStrLn` vs `print` (quotes); `show` turns a value into text; `++` joins strings.
- **Visual**: Lambo writes `2 + 3 * 4` in the sky; the `*` chips merge first (banner
  "precedence"), then `+`: `print 14`. `let x = 5` puts `tag "x"` with chip `5` on the hero;
  `let y = x * 2` `clone`s the chip to an ally with tag `y`. Trying "x = 6" makes the stage
  `shake`: Lambo `say`s "values never change". `print` vs `putStrLn`: the same scroll is
  printed with and without quote marks.
- **Questions**:
  1. predict: `print (2 + 3 * 4)` → `14` [OUT]
  2. predict: `print (7 `div` 2, 7 `mod` 2, 7 / 2)` → `(3,1,3.5)` [OUT]
  3. predict: `print ((-7) `div` 2, (-7) `quot` 2, (-7) `mod` 2, (-7) `rem` 2)` → `(-4,-3,1,-1)` [OUT]
  4. predict: `putStrLn ("Hi, " ++ "Lambo"); print ("Hi, " ++ "Lambo")` → `Hi, Lambo` / `"Hi, Lambo"` [OUT]
  5. predict "Does it compile?": `print (abs -3)` → No: `No instance for 'Show (a0 -> a0)' arising from a use of 'print'` (it parses as `abs - 3`); `print (abs (-3))` prints `3` [CE]
  6. predict: `let n = 1; let n = 2; print n` (as two `let` lines in `do`) → `2` (shadowing: a new `n`, nothing mutated; GHC warns with `-Wall`) [OUT]
  7. predict "Does it compile?": top: `x :: Int; x = 1; x = 2` (three lines), body `print x` → No: `Multiple declarations of 'x'` [CE]
  8. predict: `print (if 3 > 2 then "yes" else "no")` → `"yes"` [OUT]
  9. predict "Does it compile?": `print (if True then 1)` → No: `parse error on input ')'` (`if` needs `else`) [CE]
  10. predict: `print (2 - 3 - 4, 2 ^ 3 ^ 2)` → `(-5,512)` (`-` groups left, `^` groups right) [OUT]
  11. predict: `putStrLn (show 42 ++ "!")` → `42!` [OUT]
  12. predict "Does it compile?": `print (1 + True)` → No: `No instance for 'Num Bool' arising from the literal '1'` [CE]
  13. predict: `print (-3 `mod` 5, (-3) `mod` 5)` → `(-3,2)` (unary minus binds looser than `mod`) [OUT]
  14. predict "Does it compile?": `print (2 * -3)` → No: `Precedence parsing error: cannot mix '*' [infixl 7] and prefix '-' [infixl 6] in the same infix expression` [CE]
  15. pick: `print (7 ___ 2)` printing `3` → `` `div` `` (options `` `div` `` / `/` / `%`) [OUT]
- **Run**: starter
  ```haskell
  main :: IO ()
  main = do
    let coins = 17
    let perBag = 5
    putStrLn (show (coins / perBag) ++ " full bags")
  ```
  → prints `3.4 full bags`. Task: count only full bags. Solution: ``coins `div` perBag``.
  `expect`: `3 full bags`. [OUT → OUT]

### 1.2 `types-and-signatures`, "Every value wears a type"

- **Concept**: `name :: Type` signatures; inference fills in types you omit; `Int` (fixed,
  wraps around) vs `Integer` (unbounded), `Double`, `Char`, `String`, `Bool`; function types
  `Int -> Int`, multi-argument `Double -> Double -> Double`; no implicit conversion:
  `fromIntegral`; `length` returns `Int`; `round` uses banker's rounding; `read` parses text;
  floating point is inexact.
- **Visual**: each value chip gets a coloured border by type (`Int` blue, `Double` green,
  `Char` yellow, `String` scroll). A function ally shows its signature as a `banner`
  `Int -> Int`; giving it a green chip makes it `shake` with "No instance for Fractional Int".
  `fromIntegral` is a dye potion that recolours a blue chip so `/` accepts it.
- **Questions**:
  1. predict: top: `double :: Int -> Int; double x = x * 2` (two lines), body `print (double 21)` → `42` [OUT]
  2. predict "Does it compile?": same `double`, body `print (double 2.5)` → No: `No instance for 'Fractional Int' arising from the literal '2.5'` [CE]
  3. predict: top: `area :: Double -> Double -> Double; area w h = w * h`, body `print (area 2 3.5)` → `7.0` [OUT]
  4. predict "Does it compile?": `print (length [1,2,3] / 2)` → No: `No instance for 'Fractional Int' arising from a use of '/'` [CE]
  5. predict: `print (fromIntegral (length [1,2,3]) / 2)` → `1.5` [OUT]
  6. predict: `print (3 :: Int, 3.0 :: Double, 'c', "c", True)` → `(3,3.0,'c',"c",True)` [OUT]
  7. predict: `print (2 ^ 64 :: Integer); print (2 ^ 64 :: Int)` → `18446744073709551616` / `0` (Int wraps) [OUT]
  8. predict: `print (round 2.5, round 3.5, truncate (-2.7 :: Double))` → `(2,4,-2)` (round half to even) [OUT]
  9. predict: `print (0.1 + 0.2)` → `0.30000000000000004` [OUT]
  10. predict "Does it compile?": `putStrLn ("Score: " ++ 10)` → No: `No instance for 'Num [Char]' arising from the literal '10'`; fix `show 10` [CE]
  11. predict: `print (read "42" + 1 :: Int)` → `43` [OUT]
  12. type: `double :: Int ___ Int` → `->` [OUT]
  13. predict: `print (maxBound :: Int)` → `9223372036854775807` [OUT]
  14. predict: `print (toEnum 65 :: Char, fromEnum 'a')` → `('A',97)` [OUT]
  15. predict: `print (ceiling 2.1, floor (-2.1))` → `(3,-3)` [OUT]
- **Run**: starter
  ```haskell
  half :: Int -> Int
  half x = x `div` 2

  main :: IO ()
  main = putStrLn ("half of 7 is " ++ show (half 7))
  ```
  → prints `half of 7 is 3`. Task: keep the fraction. Solution: `half :: Double -> Double` and
  `half x = x / 2`. `expect`: `half of 7 is 3.5`. [OUT → OUT]

### 1.3 `lists-and-strings`, "Rows of items, scrolls of letters"

- **Concept**: lists hold values of one type; `:` (cons) adds to the front, `++` appends;
  `head`/`tail`/`last`/`init`, `!!` (0-based); ranges `[1..5]`, `[2,4..10]`, `['a'..'e']`,
  `[5..1]` is empty; `String` is `[Char]` so list functions work on text; `length`, `reverse`,
  `take`/`drop`, `elem`, `sum`/`product`/`maximum`, `zip`, `words`/`unwords`/`lines`;
  list comprehensions; lists compare lexicographically.
- **Visual**: a row of gems; `0 : xs` makes a new gem `enter` at the front; `++` walks the hero
  along the first row (banner "walks the whole first list"). A string is a scroll cut into
  letter tiles; `reverse` flips the row. A comprehension is a conveyor with a generator
  (`x <- [1..5]`) and a gate (`odd x`).
- **Questions**:
  1. predict: `print ([1,2,3] ++ [4,5]); print (0 : [1,2,3])` → `[1,2,3,4,5]` / `[0,1,2,3]` [OUT]
  2. predict: `print ("abc" == ['a','b','c'])` → `True` (a String is a list of Char) [OUT]
  3. predict: `print [2,4..10]; print ['a'..'e']` → `[2,4,6,8,10]` / `"abcde"` [OUT]
  4. predict: `print [5..1]; print [10,8..1]` → `[]` / `[10,8,6,4,2]` [OUT]
  5. predict: `print [x * x | x <- [1..5], odd x]` → `[1,9,25]` [OUT]
  6. predict: `print ([1,2,3] !! 1, take 2 [5,6,7], drop 2 [5,6,7])` → `(2,[5,6],[7])` [OUT]
  7. predict "Does it compile?": `print [1, 'a']` → No: `No instance for 'Num Char' arising from the literal '1'` [CE]
  8. predict "Does it compile?": `print ("x" : "yz")` → No: `Couldn't match type 'Char' with '[Char]'`; `'x' : "yz"` prints `"xyz"` [CE]
  9. predict: `print (words "pure  lazy typed")` → `["pure","lazy","typed"]` [OUT]
  10. predict: `print (zip [1,2,3] "ab")` → `[(1,'a'),(2,'b')]` (stops at the shorter list) [OUT]
  11. predict: `print (sum [1..10], product [1..5], maximum [3,9,2])` → `(55,120,9)` [OUT]
  12. predict: `print [(x, y) | x <- [1,2], y <- "ab"]` → `[(1,'a'),(1,'b'),(2,'a'),(2,'b')]` [OUT]
  13. predict: `print ("Zebra" < "apple", compare [1,2] [1,2,3])` → `(True,LT)` (uppercase sorts before lowercase) [OUT]
  14. predict "What happens?": `putStrLn "before"; print (head ([] :: [Int]))` → prints `before`, then `Prelude.head: empty list` [ERR]
  15. predict: `print (length "abc", reverse "lambda")` → `(3,"adbmal")` [OUT]
- **Run**: starter
  ```haskell
  main :: IO ()
  main = putStrLn (drop 3 "Lambdara")
  ```
  → prints `bdara`. Task: the sign must show only the first six letters. Solution:
  `take 6 "Lambdara"`. `expect`: `Lambda`. [OUT → OUT]

### 1.4 `patterns-and-guards`, "Which shape is it?"

- **Concept**: functions defined by several equations, tried top to bottom; literal patterns,
  `_` wildcard, list patterns `[]` and `(x:xs)`, tuple patterns; guards `|` with `otherwise`;
  `where` for local names shared by guards; `let ... in` expressions; `case ... of`;
  as-patterns `all@(x:_)`; a pattern that never matches (non-exhaustive) is a runtime crash.
- **Visual**: the ally holds a sorting board with slots shaped like `0`, `[]`, `(x:xs)`; the
  item slides down until a slot fits and the ally `say`s which equation fired. Guards are
  signposts; `otherwise` is the final sign. With no matching sign the `haskell/partial-moth`
  bursts out (`shake`, banner `Non-exhaustive patterns`).
- **Questions**:
  1. predict: top: `isZero :: Int -> String; isZero 0 = "zero"; isZero _ = "other"`, body `print (isZero 0, isZero 5)` → `("zero","other")` [OUT]
  2. predict: top: `firstOr :: a -> [a] -> a; firstOr d [] = d; firstOr _ (x:_) = x`, body `print (firstOr 0 [], firstOr 0 [4,5])` → `(0,4)` [OUT]
  3. predict: top:
     ```haskell
     grade :: Int -> Char
     grade n
       | n >= 90 = 'A'
       | n >= 70 = 'B'
       | otherwise = 'C'
     ```
     body `print (map grade [95, 70, 10])` → `"ABC"` (a list of Char prints as a string) [OUT]
  4. predict: top:
     ```haskell
     bmi :: Double -> Double -> String
     bmi w h
       | v < 18.5 = "under"
       | v < 25 = "normal"
       | otherwise = "over"
       where v = w / h ^ 2
     ```
     body `print (bmi 50 1.8, bmi 70 1.75)` → `("under","normal")` [OUT]
  5. predict: `print (let a = 3; b = 4 in a * b)` → `12` [OUT]
  6. predict: top: `sizeOf xs = case xs of { [] -> "empty"; [_] -> "one"; _ -> "many" }`, body `print (sizeOf "abc", sizeOf "", sizeOf "x")` → `("many","empty","one")` [OUT]
  7. predict: top: `anyF :: Int -> String; anyF _ = "any"; anyF 0 = "zero"`, body `print (anyF 0)` → `"any"` (first matching equation wins; GHC warns the second is redundant) [OUT]
  8. predict: top: `dup all'@(x:_) = x : all'; dup [] = []`, body `print (dup [1,2])` → `[1,1,2]` [OUT]
  9. predict: `let (p, q) = (1, "x"); print (q, p, fst (8, 9), snd (8, 9))` → `("x",1,8,9)` [OUT]
  10. predict "What happens?": top: `describe :: Int -> String; describe 1 = "one"; describe 2 = "two"`, body `putStrLn (describe 3)` → runtime error `Non-exhaustive patterns in function describe` [ERR]
  11. type: the last guard that always matches: `| ___ = "zero"` → `otherwise` [OUT]
  12. order: a function: `grade :: Int -> Char` / `grade n` / `  | n >= 90 = 'A'` / `  | otherwise = 'C'` [OUT]
- **Run**: starter
  ```haskell
  describe :: Int -> String
  describe n
    | n < 0 = "negative"
    | n > 0 = "positive"

  main :: IO ()
  main = do
    putStrLn (describe 5)
    putStrLn (describe 0)
  ```
  → prints `positive`, then crashes with `Non-exhaustive patterns in function describe`
  (missing guards give the same message as missing patterns). Solution: add
  `| otherwise = "zero"`. `expect`: `zero`. [ERR → OUT]

### Boss: `village-boss`, "The Partial Moth" (enemy `haskell/partial-moth`)

1. predict "What happens?": `print (last ([] :: [Int]))` → `Prelude.last: empty list` [ERR]
2. predict "What happens?": `print ([1,2,3] !! 5)` → `Prelude.!!: index too large` [ERR]
3. predict "What happens?": `print (maximum ([] :: [Int]))` → `Prelude.maximum: empty list` [ERR]
4. pick: the total way to take the first element: top `safeFirst [] = ___; safeFirst (x:_) = Just x` → `Nothing` (options `Nothing` / `null` / `error "empty"`); with signature `safeFirst :: [a] -> Maybe a`, `print (safeFirst "", safeFirst "ab")` gives `(Nothing,Just 'a')` [OUT]
5. Reuse: 1.1 Q13, 1.2 Q4, 1.3 Q8, 1.4 Q7, 1.4 Q10.

---

## Region 2: `fold-forest`, Functions as values

Sources: LYAH "Recursion", "Higher Order Functions"; RWH ch. 4 "Functional programming"
(folds, `seq`, space leaks); Haskell Wiki "Foldr Foldl Foldl'"
(https://wiki.haskell.org/Foldr_Foldl_Foldl%27); Haskell 2010 Report 3.5 "Sections";
`Data.List` docs (https://hackage.haskell.org/package/base/docs/Data-List.html).

### 2.1 `recursion`, "The owl that asks itself"

- **Concept**: a recursive function calls itself on a smaller input until a base case;
  recursion on lists with `[]` and `(x:xs)`; recursion on numbers; accumulator helper `go`
  in a `where`; `Integer` vs `Int` overflow on big results; a missing base case never ends
  ([DOC]: the program is killed, never use as a check).
- **Visual**: the ally `clone`s itself for the tail of the row; the clones line up until the
  empty row (base case) `say`s `0`; answers flow back (`give`) adding 1 at each step.
- **Questions**:
  1. predict: top: `fact :: Integer -> Integer; fact 0 = 1; fact n = n * fact (n - 1)`, body `print (fact 5)` → `120` [OUT]
  2. predict: same `fact`, `print (fact 25)` → `15511210043330985984000000` [OUT]
  3. predict: top: `factInt :: Int -> Int` (same equations), `print (factInt 25)` → `7034535277573963776` (Int overflow, silently wrong) [OUT]
  4. predict: top: `len :: [a] -> Int; len [] = 0; len (_:xs) = 1 + len xs`, body `print (len "owl")` → `3` [OUT]
  5. predict: top: `fib :: Int -> Int; fib 0 = 0; fib 1 = 1; fib n = fib (n - 1) + fib (n - 2)`, body `print (fib 10)` → `55` [OUT]
  6. predict: top:
     ```haskell
     sumTo :: Int -> Int
     sumTo n = go 0 n
       where
         go acc 0 = acc
         go acc k = go (acc + k) (k - 1)
     ```
     body `print (sumTo 100)` → `5050` [OUT]
  7. predict: top: `myReverse [] = []; myReverse (x:xs) = myReverse xs ++ [x]`, body `print (myReverse [1,2,3])` → `[3,2,1]` [OUT]
  8. predict: top: `countdown :: Int -> [Int]; countdown 0 = [0]; countdown n = n : countdown (n - 1)`, body `print (countdown 3)` → `[3,2,1,0]` [OUT]
  9. predict: top: `myMax :: [Int] -> Int; myMax [x] = x; myMax (x:xs) = max x (myMax xs)`, body `print (myMax [3,9,2])` → `9` [OUT]
  10. predict: top: `collatz 1 = 0; collatz n | even n = 1 + collatz (n `div` 2) | otherwise = 1 + collatz (3 * n + 1)`, body `print (collatz 6)` → `8` [OUT]
  11. pick [DOC]: "`fact n = n * fact (n - 1)` with no `fact 0` equation. What happens for `fact 3`?" options `it never reaches a stop and the program runs out of memory or time` / `returns 0` / `compile error` → the first (observed: killed with SIGKILL, no output)
  12. order: `len :: [a] -> Int` / `len [] = 0` / `len (_:xs) = 1 + len xs` [OUT]
- **Run**: starter
  ```haskell
  myLength :: [a] -> Int
  myLength [] = 0
  myLength (_:xs) = myLength xs

  main :: IO ()
  main = putStrLn ("length: " ++ show (myLength "owls"))
  ```
  → prints `length: 0`. Solution: `myLength (_:xs) = 1 + myLength xs`. `expect`: `length: 4`.
  [OUT → OUT]

### 2.2 `higher-order-functions`, "Allies on the conveyor"

- **Concept**: functions are values: they can be passed and returned; lambdas `\x -> ...`;
  `map`, `filter`, `zipWith`, `takeWhile`/`dropWhile`, `any`/`all`, `concatMap`, `span`/`break`;
  a function that takes a function (`applyTwice`); tuple patterns in lambdas.
- **Visual**: a conveyor of gems passes an ally (`map`: each gem is transformed), a gate
  (`filter`: gems that fail the test `drop`), two conveyors merging (`zipWith`).
- **Questions**:
  1. predict: `print (map (\x -> x * 2) [1,2,3])` → `[2,4,6]` [OUT]
  2. predict: `print (filter even [1..10])` → `[2,4,6,8,10]` [OUT]
  3. predict: `print (zipWith (+) [1,2,3] [10,20,30])` → `[11,22,33]` [OUT]
  4. predict: `print (takeWhile (\x -> x < 5) [1,3,5,2], dropWhile (\x -> x < 5) [1,3,5,2])` → `([1,3],[5,2])` (stops at the first failure) [OUT]
  5. predict: `print (any even [1,3,5], all odd [1,3,5])` → `(False,True)` [OUT]
  6. predict: top: `applyTwice :: (a -> a) -> a -> a; applyTwice f x = f (f x)`, body `print (applyTwice (\x -> x + 3) 10, applyTwice reverse "abc")` → `(16,"abc")` [OUT]
  7. predict: imports `Data.Char (toUpper)`; `print (map toUpper "owl")` → `"OWL"` [OUT]
  8. predict: `print (concatMap (\x -> [x,x]) "ab")` → `"aabb"` [OUT]
  9. predict: `print (filter (\(k, v) -> v > 1) [('a',1),('b',2)])` → `[('b',2)]` [OUT]
  10. predict: `print (span even [2,4,5,6], break (== ' ') "hi there")` → `(([2,4],[5,6]),("hi"," there"))` [OUT]
  11. predict: `print (filter (\w -> length w > 3) (words "the wise owl hoots"))` → `["wise","hoots"]` [OUT]
  12. pick [DOC]: the type of `map` → `(a -> b) -> [a] -> [b]` (options also `a -> b -> [a]`, `[a] -> (a -> b) -> b`) (https://hackage.haskell.org/package/base/docs/Prelude.html#v:map)
  13. type: `print (___ odd [1,2,3])` printing `[1,3]` → `filter` [OUT]
- **Run**: starter
  ```haskell
  main :: IO ()
  main = print (map (\s -> s + 2) [3, 7, 10])
  ```
  → prints `[5,9,12]`. Task: double every score. Solution: `\s -> s * 2`.
  `expect`: `[6,14,20]`. [OUT → OUT]

### 2.3 `currying-and-composition`, "Half-cast spells"

- **Concept**: every function takes one argument; `Int -> Int -> Int` means
  `Int -> (Int -> Int)`; partial application (`add 5`); operator sections `(*2)`, `(2^)` vs
  `(^2)`, `(/ 2)` vs `(2 /)`; `(-1)` is the number minus one, not a section: use `subtract 1`;
  backticks make a function an operator (`` `div` ``); composition `f . g` (right to left);
  `$` applies with lowest precedence to save parentheses; `flip`, `uncurry`; function
  application binds tighter than any operator.
- **Visual**: `add` is an ally with two hands; giving one chip (`add 5`) `clone`s a new ally
  holding the `5` (tag `add5`) that waits for the second chip. Composition: two allies
  standing in a line, the item goes to the right one first. `$` is a long bridge that says
  "everything to my right first".
- **Questions**:
  1. predict: top: `add :: Int -> Int -> Int; add x y = x + y`, body `let add5 = add 5; print (add5 10)` → `15` [OUT]
  2. predict: `print (map (2^) [1,2,3], map (^2) [1,2,3])` → `([2,4,8],[1,4,9])` [OUT]
  3. predict: `print ((/ 2) 10, (2 /) 10)` → `(5.0,0.2)` [OUT]
  4. predict "Does it compile?": `print (map (-1) [1,2,3])` → No: `Ambiguous type variable 'b0' arising from a use of 'print'` (`(-1)` is a number, not a function); `map (subtract 1) [1,2]` prints `[0,1]` [CE]
  5. predict: `print ((negate . abs) (-5), (show . (+1)) 41)` → `(-5,"42")` [OUT]
  6. predict: `print $ sum $ map (*2) [1,2,3]` → `12` [OUT]
  7. predict "Does it compile?": `print (length . filter even [1..10])` → No: `Couldn't match expected type: a1 -> t0 a0 with actual type: [a2]` (`filter even [1..10]` is a list, not a function); `length . filter even $ [1..10]` prints `5` [CE]
  8. predict "Does it compile?": `print length [1,2,3]` → No: `The function 'print' is applied to two value arguments` [CE]
  9. predict: top: `processBad = filter odd . map (*2)`, `processGood = map (*2) . filter odd`, body `print (processBad [1..5], processGood [1..5])` → `([],[2,6,10])` (composition runs right to left) [OUT]
  10. predict: `print (flip (-) 1 10, map (uncurry (+)) [(1,2),(3,4)])` → `(9,[3,7])` [OUT]
  11. predict: `print ((`div` 3) 10, (10 `div`) 3)` → `(3,3)` [OUT]
  12. predict: `print (map (\f -> f 10) [(+1), (*2), subtract 3])` → `[11,20,7]` [OUT]
  13. predict: `print (let f = (* 2) . (+ 1) in f 3, let g = (+ 1) . (* 2) in g 3)` → `(8,7)` [OUT]
  14. type: `print ___ sum [1,2,3]` printing `6` → `$` [OUT]
- **Run**: starter
  ```haskell
  process :: [Int] -> [Int]
  process = filter odd . map (*2)

  main :: IO ()
  main = print (process [1, 2, 3, 4, 5])
  ```
  → prints `[]` (doubling first makes everything even). Task: keep the odd numbers, then
  double them. Solution: `process = map (*2) . filter odd`. `expect`: `[2,6,10]`. [OUT → OUT]

### 2.4 `folds`, "Melting the row into one gem"

- **Concept**: `foldr f z` replaces `:` with `f` and `[]` with `z`, grouping to the right;
  `foldl` groups to the left; non-associative operators show the difference; `foldl'`
  (import `Data.List`) forces the accumulator at each step, avoiding a pile of thunks
  ([DOC]: `foldl (+) 0 [1..10000000]` was killed on the test machine, `foldl'` finishes);
  `scanl`/`scanr` show the intermediate accumulators; `sum []` is `0`, `product []` is `1`;
  `foldr` can stop early on lazy operators (`&&`).
- **Visual**: the row of gems is melted into one big gem. `foldr`: the hero walks to the end
  and melts back to the front (brackets on the right); `foldl`: melts from the front. With
  plain `foldl` every step leaves a sealed box (thunk) on a growing pile (`haskell/thunk-pile`
  grows); `foldl'` opens each box at once and the pile never forms.
- **Questions**:
  1. predict: `print (foldr (+) 0 [1,2,3])` → `6` [OUT]
  2. predict: `print (foldr (-) 0 [1,2,3], foldl (-) 0 [1,2,3])` → `(2,-6)` (`1-(2-(3-0))` vs `((0-1)-2)-3`) [OUT]
  3. predict: `print (foldr (\x acc -> "(" ++ show x ++ "+" ++ acc ++ ")") "0" [1,2,3])` → `"(1+(2+(3+0)))"` [OUT]
  4. predict: `print (foldl (\acc x -> "(" ++ acc ++ "+" ++ show x ++ ")") "0" [1,2,3])` → `"(((0+1)+2)+3)"` [OUT]
  5. predict: `print (foldl (flip (:)) [] "abc", foldr (\x acc -> x : acc) [] "abc")` → `("cba","abc")` [OUT]
  6. predict "Does it compile?": no imports, `print (foldl' (+) 0 [1..10])` → No: `Variable not in scope: foldl'` (GHC 9.8 Prelude; add `import Data.List (foldl')`) [CE]
  7. predict: imports `Data.List (foldl')`; `print (foldl' (+) 0 [1..1000000])` → `500000500000` [OUT]
  8. predict: `print (scanl (+) 0 [1,2,3], scanr (+) 0 [1,2,3])` → `([0,1,3,6],[6,5,3,0])` [OUT]
  9. predict: `print (sum [], product [], and [], or [])` → `(0,1,True,False)` [OUT]
  10. predict: `print (foldr (&&) True [True, False, undefined])` → `False` (`foldr` stops; `undefined` is never evaluated) [OUT]
  11. predict: `print (foldr (\_ acc -> acc + 1) 0 "hello")` → `5` [OUT]
  12. predict: `print (foldr (\x acc -> if even x then x : acc else acc) [] [1..6])` → `[2,4,6]` [OUT]
  13. pick [DOC]: "Summing ten million numbers with `foldl (+)` blows memory. The usual fix?" options `` `foldl'` from Data.List `` / `foldr1` / `reverse the list first` → `foldl'` (https://wiki.haskell.org/Foldr_Foldl_Foldl%27)
- **Run**: starter
  ```haskell
  main :: IO ()
  main = putStrLn ("number: " ++ show (foldr (\d acc -> acc * 10 + d) 0 [4, 2, 7]))
  ```
  → prints `number: 724` (`foldr` starts from the right). Task: build `427`. Solution:
  `foldl (\acc d -> acc * 10 + d) 0 [4, 2, 7]`. `expect`: `number: 427`. [OUT → OUT]

### Boss: `forest-boss`, "The Thunk Pile" (enemy `haskell/thunk-pile`)

1. predict: `print (foldr (\x acc -> x + 10 * acc) 0 [1,2,3], foldl (\acc x -> acc * 10 + x) 0 [1,2,3])` → `(321,123)` [OUT]
2. predict: `print (scanl1 max [3,1,4,1,5])` → `[3,3,4,4,5]` [OUT]
3. predict: `print (zipWith3 (\a b c -> a + b + c) [1,2] [10,20] [100,200])` → `[111,222]` [OUT]
4. predict: `print ((+) 2 3, (.) (+1) (*2) 5)` → `(5,11)` [OUT]
5. Reuse: 2.1 Q3, 2.3 Q4, 2.3 Q9, 2.4 Q2, 2.4 Q6.

---

## Region 3: `lazy-mountain`, Laziness and data

Sources: Haskell Wiki "Lazy evaluation", "Thunk", "Space leak", "Bottom"
(https://wiki.haskell.org/Lazy_evaluation, https://wiki.haskell.org/Space_leak,
https://wiki.haskell.org/Bottom); RWH ch. 3 "Defining types" and ch. 4 "Avoiding space leaks
with seq"; LYAH "Making Our Own Types and Typeclasses"; `Data.Maybe` and `Text.Read` docs.

### 3.1 `infinite-lists`, "The endless staircase"

- **Concept**: values are computed only when needed, so a list may be infinite (`[1..]`,
  `cycle`, `repeat`, `iterate`) as long as you only consume a finite part (`take`,
  `takeWhile`, `!!`, `head`, `zip` with a finite list); self-referential lists (`fibs`);
  consuming everything (`length [1..]`, `filter (< 5) [1..]` then asking for a 5th element)
  never ends ([DOC]).
- **Visual**: a staircase that disappears into the clouds; each step is a sealed box that is
  only opened when the hero steps on it. `take 5` stops the hero after five boxes; the rest
  stay sealed.
- **Questions**:
  1. predict: `print (take 5 [1..])` → `[1,2,3,4,5]` [OUT]
  2. predict: `print (take 4 (cycle "ab"), take 3 (repeat 'x'))` → `("abab","xxx")` [OUT]
  3. predict: `print (take 5 (iterate (*2) 1))` → `[1,2,4,8,16]` [OUT]
  4. predict: `print (takeWhile (< 20) (map (^2) [1..]))` → `[1,4,9,16]` [OUT]
  5. predict: `print (zip [1..] "abc")` → `[(1,'a'),(2,'b'),(3,'c')]` [OUT]
  6. predict: top: `fibs :: [Integer]; fibs = 0 : 1 : zipWith (+) fibs (tail fibs)`, body `print (take 8 fibs)` → `[0,1,1,2,3,5,8,13]` [OUT]
  7. predict: `print (head (filter (> 100) [1..]))` → `101` [OUT]
  8. predict: `print ([x | x <- [1..], x `mod` 7 == 0] !! 2)` → `21` [OUT]
  9. predict: `print (foldr (\x acc -> x > 10 || acc) False [1..])` → `True` (lazy `||` stops the fold) [OUT]
  10. pick [DOC]: "`print (takeWhile (< 5) [1..])` vs `print (filter (< 5) [1..])`" → `takeWhile` prints `[1,2,3,4]`; `filter` prints `[1,2,3,4` and then keeps searching forever (verified only the safe half: `take 4 (filter (< 5) [1..])` prints `[1,2,3,4]`)
  11. predict: top: `primes = sieve [2..] where sieve (p:xs) = p : sieve [x | x <- xs, x `mod` p /= 0]`, body `print (take 5 primes)` → `[2,3,5,7,11]` [OUT]
  12. predict: `print (elem 10 [0,2..])` → `True` (found before the end, so it stops; `elem 11` would never stop, [DOC]) [OUT]
- **Run**: starter
  ```haskell
  main :: IO ()
  main = print (take 5 (iterate (+2) 1))
  ```
  → prints `[1,3,5,7,9]`. Task: the first five powers of two. Solution: `iterate (*2) 1`.
  `expect`: `[1,2,4,8,16]`. [OUT → OUT]

### 3.2 `thunks-and-bottom`, "Sealed boxes and the wraith inside"

- **Concept**: an unevaluated expression is a thunk; `undefined` and `error "msg"` are
  *bottom*: harmless until evaluated; `length` counts boxes without opening them; `fst`
  ignores the second component; `seq a b` evaluates `a` to weak head normal form (only the
  outermost constructor) before returning `b`; bang patterns (`go !acc`) do the same for an
  accumulator; `error` crashes with its message; `<<loop>>` when a value depends on itself.
- **Visual**: boxes with the `haskell/bottom-wraith` inside sit in a row; `length` counts them
  without opening (`say "3"`); `sum` opens every box and the wraith escapes (`shake`, banner
  `Prelude.undefined`). `seq` opens only the outer lid: a `Just` box with a wraith deeper
  inside stays safe.
- **Questions**:
  1. predict: `let xs = [1, undefined, 3] :: [Int]; print (length xs)` → `3` [OUT]
  2. predict: `print (fst (1, undefined), snd (undefined, "safe"))` → `(1,"safe")` [OUT]
  3. predict: `print (take 2 [1, 2, undefined])` → `[1,2]` [OUT]
  4. predict "What happens?": `putStrLn "start"; print (sum [1, undefined, 3 :: Int])` → prints `start`, then `Prelude.undefined` [ERR]
  5. predict: `print (Just undefined `seq` "ok")` → `"ok"` (seq only checks the outer `Just`) [OUT]
  6. predict: `print (length (map (\x -> x `div` 0) [1,2,3]))` → `3` (no division happens) [OUT]
  7. predict: `print (True || undefined, const 5 undefined)` → `(True,5)` [OUT]
  8. predict "What happens?": `let hp = 0 :: Int; if hp <= 0 then error "hero fainted" else print hp` → `hero fainted` [ERR]
  9. predict "What happens?": `let d = 0 :: Int; print (10 `div` d)` → `divide by zero` [ERR]
  10. predict: top:
      ```haskell
      sumStrict :: [Int] -> Int
      sumStrict = go 0
        where
          go !acc [] = acc
          go !acc (x:xs) = go (acc + x) xs
      ```
      body `print (sumStrict [1..100])` → `5050` (bang patterns, no pragma needed in GHC2021) [OUT]
  11. predict "What happens?": `let x = 1 :: Int; let y = y + x; print y` → `<<loop>>` (`y` is defined in terms of itself; GHC detected it on the test machine, but treat as [DOC] for checks because detection is not guaranteed) [ERR]
  12. pick [DOC]: "`seq a b` evaluates `a` to ..." options `weak head normal form (outermost constructor)` / `fully, every nested part` / `nothing, it is a no-op` → the first (https://hackage.haskell.org/package/base/docs/Prelude.html#v:seq)
- **Run**: starter
  ```haskell
  main :: IO ()
  main = do
    let scores = [10, 20, undefined, 40] :: [Int]
    print (sum scores)
  ```
  → crashes with `Prelude.undefined`. Task: add only the first two scores; never open the
  cursed box. Solution: `print (sum (take 2 scores))`. `expect`: `30`. [ERR → OUT]

### 3.3 `algebraic-data-types`, "Crafting your own items"

- **Concept**: `data` declares a new type with one or more constructors (sum of products);
  constructors carry fields; pattern matching on constructors; `deriving (Show, Eq, Ord,
  Enum, Bounded)`; record syntax creates field accessor functions; record update
  `h { hp = 7 }` builds a new value (the old one is unchanged); recursive types (trees);
  `type` is only a synonym; a record accessor used on the wrong constructor crashes.
- **Visual**: Lambo's forge: each constructor is a mould with a crest (`Circle`, `Rect`);
  fields are small tags on the item. A record update `clone`s the item with one tag changed;
  the original stays with the hero.
- **Questions**:
  1. predict: top: `data Shape = Circle Double | Rect Double Double deriving Show`, `area (Circle r) = 3 * r * r; area (Rect w h) = w * h`, body `print (map area [Circle 1, Rect 2 3])` → `[3.0,6.0]` [OUT]
  2. predict: same `Shape`, `print (Rect 2 3)` → `Rect 2.0 3.0` [OUT]
  3. predict "Does it compile?": top: `data Shape = Circle Double` (no deriving), body `print (Circle 1)` → No: `No instance for 'Show Shape' arising from a use of 'print'` [CE]
  4. predict: top: `data Hero = Hero { name :: String, hp :: Int } deriving Show`, body `let h = Hero { name = "Ada", hp = 10 }; print h` → `Hero {name = "Ada", hp = 10}` [OUT]
  5. predict: same, `let h2 = h { hp = 7 }; print (hp h, hp h2)` → `(10,7)` (update makes a new value) [OUT]
  6. predict: top: `data Color = Red | Green | Blue deriving (Show, Eq, Ord, Enum, Bounded)`, body `print [minBound .. maxBound :: Color]` → `[Red,Green,Blue]` [OUT]
  7. predict: same `Color`, `print (Red < Blue, succ Red, fromEnum Blue)` → `(True,Green,2)` (derived `Ord` follows declaration order) [OUT]
  8. predict: same `Shape`, `print (Circle (-1))` → `Circle (-1.0)` [OUT]
  9. predict: top: `data Tree = Leaf | Node Tree Int Tree`, `total Leaf = 0; total (Node l v r) = total l + v + total r`, body `print (total (Node (Node Leaf 1 Leaf) 2 (Node Leaf 3 Leaf)))` → `6` [OUT]
  10. predict "What happens?": top: `data Shape = Circle { radius :: Double } | Square { side :: Double }`, body `print (radius (Square 2))` → `No match in record selector radius` [ERR]
  11. predict: top: `type Name = String; hello :: Name -> String; hello n = "hello " ++ n`, body `putStrLn (hello "Lambo")` → `hello Lambo` (a synonym is interchangeable with `String`) [OUT]
  12. type: `data Color = Red | Green ___ (Show, Eq)` → `deriving` [OUT]
- **Run**: starter
  ```haskell
  data Hero = Hero { name :: String, hp :: Int } deriving Show

  heal :: Hero -> Hero
  heal h = h { hp = hp h }

  main :: IO ()
  main = do
    let h = Hero { name = "Ada", hp = 10 }
    putStrLn ("hp: " ++ show (hp (heal h)))
  ```
  → prints `hp: 10`. Task: a potion heals 5. Solution: `heal h = h { hp = hp h + 5 }`.
  `expect`: `hp: 15`. [OUT → OUT]

### 3.4 `maybe-and-either`, "Chests that may be empty"

- **Concept**: no `null`: absence is `Maybe a` (`Nothing` / `Just x`); failure with a reason
  is `Either e a` (`Left err` / `Right x`, right is "right"); safe versions of partial
  functions; `lookup` on association lists; `maybe`, `fromMaybe`, `either`, `catMaybes`,
  `mapMaybe`, `readMaybe`; `case` to open a chest; `fromJust Nothing` crashes; a `Maybe Int`
  is not an `Int`.
- **Visual**: a chest: empty (`Nothing`, Lambo `say`s "nothing here") or holding one item.
  `Either`: a chest with a red door (`Left`, error scroll) and a green door (`Right`, the gem).
  `fromJust` smashes the chest open: empty chest → `haskell/partial-moth` (`shake`).
- **Questions**:
  1. predict: top: `safeHead :: [a] -> Maybe a; safeHead [] = Nothing; safeHead (x:_) = Just x`, body `print (safeHead [] :: Maybe Int, safeHead [3,4])` → `(Nothing,Just 3)` [OUT]
  2. predict: `print (lookup "b" [("a",1),("b",2)], lookup "z" [("a",1)])` → `(Just 2,Nothing)` [OUT]
  3. predict: imports `Data.Maybe (fromMaybe)`; `print (maybe 0 (+1) (Just 5), maybe 0 (+1) Nothing, fromMaybe 0 Nothing)` → `(6,0,0)` [OUT]
  4. predict: top: `safeDiv :: Int -> Int -> Either String Int; safeDiv _ 0 = Left "divide by zero"; safeDiv a b = Right (a `div` b)`, body `print (safeDiv 10 2, safeDiv 1 0)` → `(Right 5,Left "divide by zero")` [OUT]
  5. predict: `print (either length negate (Left "abc" :: Either String Int))` → `3` [OUT]
  6. predict: `print (Just (-3))` → `Just (-3)` [OUT]
  7. predict: imports `Data.Maybe (catMaybes)`; `print (catMaybes [Just 1, Nothing, Just 3])` → `[1,3]` [OUT]
  8. predict: imports `Text.Read (readMaybe)`; `print (readMaybe "42" :: Maybe Int, readMaybe "4x" :: Maybe Int)` → `(Just 42,Nothing)` [OUT]
  9. predict "Does it compile?": `print (Just (3 :: Int) + 1)` → No: `No instance for 'Num (Maybe Int)' arising from a use of '+'` [CE]
  10. predict "What happens?": imports `Data.Maybe (fromJust)`; `print (fromJust (Nothing :: Maybe Int))` → `Maybe.fromJust: Nothing` [ERR]
  11. predict: `print (case lookup 'z' [('a', "owl")] of Nothing -> "missing"; Just v -> v)` → `"missing"` [OUT]
  12. predict "What happens?": `print (read "abc" :: Int)` → `Prelude.read: no parse` [ERR]
  13. type: `safeHead [] = ___` → `Nothing` [OUT]
- **Run**: starter
  ```haskell
  safeDiv :: Int -> Int -> Either String Int
  safeDiv _ 0 = Right 0
  safeDiv a b = Right (a `div` b)

  main :: IO ()
  main = print (safeDiv 7 0)
  ```
  → prints `Right 0` (a silent wrong answer). Solution: `safeDiv _ 0 = Left "cannot divide by zero"`.
  `expect`: `Left "cannot divide by zero"`. [OUT → OUT]

### Boss: `mountain-boss`, "The Bottom Wraith" (enemy `haskell/bottom-wraith`)

1. predict: `print (null [undefined], length [undefined, undefined], head [1, undefined])` → `(False,2,1)` [OUT]
2. predict: imports `Data.Maybe (mapMaybe)`, `Text.Read (readMaybe)`; `print (mapMaybe (\s -> readMaybe s :: Maybe Int) ["1","x","3"])` → `[1,3]` [OUT]
3. predict: top: `data Point = Point Int Int deriving (Show, Eq)`; `print (Point 1 2 == Point 1 2, Point 1 2)` → `(True,Point 1 2)` [OUT]
4. predict: top: `fibs` from 3.1; `print (fibs !! 50)` → `12586269025` [OUT]
5. Reuse: 3.2 Q1, 3.2 Q4, 3.2 Q5, 3.3 Q10, 3.4 Q10.

---

## Region 4: `monad-tower`, Type classes and effects

Sources: Typeclassopedia (https://wiki.haskell.org/Typeclassopedia); LYAH "Functors,
Applicative Functors and Monoids", "A Fistful of Monads", "Input and Output"; RWH ch. 6
"Using Typeclasses", ch. 7 "I/O", ch. 14 "Monads"; Haskell 2010 Report ch. 4.3 and 7;
`Data.Map` docs (https://hackage.haskell.org/package/containers/docs/Data-Map.html).

### 4.1 `type-classes`, "Badges for types"

- **Concept**: a type class declares operations (`class Describable a where describe :: a ->
  String`); an `instance` gives them for one type; constraints in signatures (`Eq a => a -> a
  -> Bool`); deriving vs hand-written instances (a custom `Show`); default methods;
  `Eq`, `Ord` (`compare` gives `LT`/`EQ`/`GT`), `Show`, `Read`, `Enum`, `Bounded`,
  `Semigroup` (`<>`) and `Monoid` (`mempty`, `mconcat`); `newtype` (one constructor, one
  field, a distinct type, no runtime cost) vs `data` vs `type` (synonym); one instance per
  type (duplicate instances are errors); `read` needs a known result type.
- **Visual**: badges (shield crests) are handed to types: the `Show` badge lets the item be
  `print`ed, `Eq` lets two items be compared on a scale, `Ord` puts them on a podium. A
  `newtype` is a gem in a sealed case with a new label: same gem, different type (the stage
  refuses to give a `Feet` case to an ally who wants `Meters`: `shake`).
- **Questions**:
  1. predict: top: `class Describable a where describe :: a -> String`; `instance Describable Bool where { describe True = "yes"; describe False = "no" }`, body `putStrLn (describe True)` → `yes` [OUT]
  2. predict: top: `data Owl = Owl`; `instance Show Owl where show Owl = "hoot"`, body `print Owl; print [Owl, Owl]` → `hoot` / `[hoot,hoot]` [OUT]
  3. predict: top: `data Size = S | M | L deriving (Eq, Ord, Show)`, body `print (maximum [M, S, L], compare S L, S < M)` → `(L,LT,True)` [OUT]
  4. predict: top: `data Coin = Coin Int`; `instance Eq Coin where Coin a == Coin b = a `mod` 2 == b `mod` 2`, body `print (Coin 1 == Coin 3, Coin 1 /= Coin 2)` → `(True,True)` (`/=` comes for free from `==`) [OUT]
  5. predict: top: `same :: Eq a => a -> a -> Bool; same x y = x == y`, body `print (same 'a' 'a', same [1,2] [2,1])` → `(True,False)` [OUT]
  6. predict: `putStrLn (show (Just "x")); print (show (Just "x"))` → `Just "x"` / `"Just \"x\""` [OUT]
  7. predict: `print ([1] <> [2], "ab" <> "cd", mconcat ["a","b","c"])` → `([1,2],"abcd","abc")` [OUT]
  8. predict: top: `class Shape a where { area :: a -> Double; label :: a -> String; label _ = "shape" }`, `data Sq = Sq Double`, `instance Shape Sq where area (Sq s) = s * s`, body `print (area (Sq 3), label (Sq 3))` → `(9.0,"shape")` (default method) [OUT]
  9. predict "Does it compile?": top: `newtype Meters = Meters Double; newtype Feet = Feet Double; climb :: Meters -> Double; climb (Meters m) = m`, body `print (climb (Feet 3))` → No: `Couldn't match expected type 'Meters' with actual type 'Feet'` [CE]
  10. predict "Does it compile?": `print (read "5")` → No: `Ambiguous type variable 'a0' arising from a use of 'print'` (which type should `read` produce?) [CE]
  11. predict "Does it compile?": top: `data Owl = Owl deriving Show` and `instance Show Owl where show Owl = "hoot"`, body `print Owl` → No: `Duplicate instance declarations` [CE]
  12. predict: top: `newtype Meters = Meters Double deriving Show`, body `print (Just (Meters 1.5))` → `Just (Meters 1.5)` [OUT]
  13. type: `instance ___ Owl where show Owl = "hoot"` → `Show` [OUT]
- **Run**: starter
  ```haskell
  data Potion = Potion Int deriving Show

  main :: IO ()
  main = print (Potion 3)
  ```
  → prints `Potion 3`. Task: shop labels must read `potion x3`. Solution: remove
  `deriving Show` and write `instance Show Potion where show (Potion n) = "potion x" ++ show n`.
  `expect`: `potion x3`. [OUT → OUT]

### 4.2 `functor-and-applicative`, "Reaching into chests"

- **Concept**: `Functor`: `fmap` / `<$>` applies a function inside a context (`Maybe`, list,
  `Either e`, tuples, functions) without changing its shape; `Nothing` and `Left` pass through;
  `fmap` on a pair touches only the second component and `length (1, 2)` is `1` (Foldable on
  pairs); `Applicative`: `pure`, `<*>` combine several contexts (`(+) <$> Just 3 <*> Just 4`);
  any `Nothing` makes the result `Nothing`; lists give all combinations; `Either` keeps the
  first `Left`.
- **Visual**: the ally reaches into the chest with a long arm, transforms the gem, closes the
  lid (`fmap`). For `<*>`, two chests are opened together; if either is empty the result
  chest is empty (`banner "Nothing"`).
- **Questions**:
  1. predict: `print (fmap (+1) (Just 2), fmap (+1) Nothing)` → `(Just 3,Nothing)` [OUT]
  2. predict: `print ((+1) <$> [1,2,3])` → `[2,3,4]` [OUT]
  3. predict: `print (fmap length (Right "abc" :: Either String String), fmap length (Left "e" :: Either String String))` → `(Right 3,Left "e")` [OUT]
  4. predict: `print (fmap (+1) (10, 20))` → `(10,21)` [OUT]
  5. predict: `print (length (1, 2), sum (3, 4), maximum (Just 9))` → `(1,4,9)` (Foldable sees only the last component of a pair) [OUT]
  6. predict: `print ((+) <$> Just 3 <*> Just 4, (+) <$> Just 3 <*> Nothing)` → `(Just 7,Nothing)` [OUT]
  7. predict: `print ([(+1), (*2)] <*> [10, 20])` → `[11,21,20,40]` [OUT]
  8. predict: `print ((+) <$> [1,2] <*> [10,20])` → `[11,21,12,22]` [OUT]
  9. predict: `print ((,) <$> Just 1 <*> Just "a")` → `Just (1,"a")` [OUT]
  10. predict: `print ((+) <$> Left "a" <*> (Left "b" :: Either String Int))` → `Left "a"` (first error wins) [OUT]
  11. predict: `print ((fmap (+1) (*2)) 5, 0 <$ Just 9)` → `(11,Just 0)` (`fmap` on functions is composition) [OUT]
  12. predict: `print ((fmap . fmap) (+1) [Just 1, Nothing])` → `[Just 2,Nothing]` [OUT]
  13. type: `print ((+1) ___ Just 2)` printing `Just 3` → `<$>` [OUT]
- **Run**: starter
  ```haskell
  main :: IO ()
  main = do
    let prices = [("apple", 3), ("pear", 4)]
    print ((+) <$> lookup "apple" prices <*> lookup "peach" prices)
  ```
  → prints `Nothing` (there is no peach). Task: add the apple and the pear. Solution:
  `lookup "pear" prices`. `expect`: `Just 7`. [OUT → OUT]

### 4.3 `monads-and-do`, "A chain of chests"

- **Concept**: `Monad`: `>>=` feeds the value in a context to a function that returns a new
  context; `do` notation is sugar for `>>=`; `Maybe` stops at the first `Nothing`, `Either`
  at the first `Left` (with the reason), lists try every combination; `return`/`pure` only
  wraps a value, it does **not** exit the block; `>>` sequences and discards; `sequence`
  turns a list of chests into a chest of a list; `let` inside `do`.
- **Visual**: a chain of chests along a corridor. The hero opens one, uses the gem to pick the
  next chest. An empty chest (`Nothing`) or a red door (`Left`) stops the chain: banner
  "SHORT-CIRCUIT", the rest of the corridor goes dark. `return 99` puts a gem on a shelf
  and walks on (it does not leave the corridor).
- **Questions**:
  1. predict: `print (Just 5 >>= \x -> Just (x * 2))` → `Just 10` [OUT]
  2. predict: `print (Nothing >>= \x -> Just (x * 2))` → `Nothing` [OUT]
  3. predict: top:
     ```haskell
     table :: [(Int, String)]
     table = [(1, "lam"), (2, "bda")]
     both :: Maybe String
     both = do
       a <- lookup 1 table
       b <- lookup 2 table
       return (a ++ b)
     ```
     body `print both` → `Just "lambda"`; with `lookup 3` in the second line → `Nothing` [OUT]
  4. predict: top: `parseAge :: String -> Either String Int; parseAge s = if all (`elem` "0123456789") s && not (null s) then Right (read s) else Left ("bad age: " ++ s)`; `check = do { a <- parseAge "30"; b <- parseAge "x1"; c <- parseAge "40"; return (a + b + c) }`, body `print check` → `Left "bad age: x1"` [OUT]
  5. predict: `print (do { x <- [1,2]; y <- "ab"; return (x, y) })` → `[(1,'a'),(1,'b'),(2,'a'),(2,'b')]` [OUT]
  6. predict: `print (do { x <- Just 1; return 99; Just (x + 1) })` → `Just 2` (`return` does not exit) [OUT]
  7. predict: `return (); putStrLn "still here"` (two lines in `main`) → `still here` [OUT]
  8. predict: `print ([1,2,3] >>= \x -> [x, x * 10])` → `[1,10,2,20,3,30]` [OUT]
  9. predict: `print (Just 1 >> Just 2, (Nothing :: Maybe Int) >> Just 2)` → `(Just 2,Nothing)` [OUT]
  10. predict: `print (sequence [Just 1, Just 2], sequence [Just 1, Nothing])` → `(Just [1,2],Nothing)` [OUT]
  11. predict: top: `positive :: Int -> Maybe Int; positive x = if x > 0 then Just x else Nothing`, body `print (Just 4 >>= positive >>= (\x -> positive (x - 10)))` → `Nothing` [OUT]
  12. predict "Does it compile?": `let line = "42"; n <- read line; print (n + 1 :: Int)` → No: `No instance for 'Read (IO Int)' arising from a use of 'read'` (`<-` needs an action; use `let n = read line`) [CE]
  13. predict "Does it compile?": `print (do { x <- Just 3; let y = x * 2; return (x + y) })` → No: `parse error on input '}'` (with braces, write `let { y = x * 2 }`, which prints `Just 9`) [CE]
  14. type: `Just 5 ___ \x -> Just (x * 2)` → `>>=` [OUT]
- **Run**: starter
  ```haskell
  withdraw :: Int -> Int -> Either String Int
  withdraw bal amt = if amt > bal then Right bal else Right (bal - amt)

  main :: IO ()
  main = print (do { b1 <- withdraw 100 30; withdraw b1 90 })
  ```
  → prints `Right 70` (the second withdrawal silently did nothing). Solution:
  `if amt > bal then Left "insufficient funds" else Right (bal - amt)`.
  `expect`: `Left "insufficient funds"`. [OUT → OUT]

### 4.4 `io-and-maps`, "Speaking scrolls and the key ring"

- **Concept**: `IO a` is a description of an action; pure functions cannot perform IO (a
  `String` function cannot `putStrLn`); building an action does nothing until `main` runs it
  (and it may run twice); `mapM_`/`forM_` run an action per element (`map print xs` only
  builds a list of actions and does not type-check as a statement); `traverse`/`mapM` collect
  results (`Maybe` fails as a whole); `when`/`unless`; `Data.Map`: `fromList`, `lookup`
  returns `Maybe`, `findWithDefault`, `insert` returns a new map, `insertWith`,
  `fromListWith` for counting, `adjust`, `delete`, `keys`/`elems`/`toList` (sorted by key),
  `Map.!` crashes on a missing key, duplicate keys in `fromList` keep the last value.
- **Visual**: an IO action is a sealed scroll of instructions; `let act = putStrLn "hi"` only
  writes the scroll (`item scroll`); each time `main` reads it, the hero `print`s. A
  `Data.Map` is a key ring; `M.insert` `clone`s the ring with one more key; the old ring is
  still in the hero's hand. `M.!` with a missing key: `haskell/partial-moth`.
- **Questions**:
  1. predict: `mapM_ print [1,2,3]` → `1` / `2` / `3` [OUT]
  2. predict: imports `Control.Monad (forM_)`; `forM_ [1..3] $ \i -> putStrLn (replicate i '*')` → `*` / `**` / `***` [OUT]
  3. predict "Does it compile?": `map print [1, 2, 3]` then `putStrLn "done"` as two lines of `main` → No: `Couldn't match type '[]' with 'IO'` [CE]
  4. predict "Does it compile?": top: `greet :: String -> String; greet n = putStrLn ("hi " ++ n)` → No: `Couldn't match type: IO () with: [Char]` (a pure function cannot print) [CE]
  5. predict: `let act = putStrLn "hi"; act; act` (three lines) → `hi` / `hi` [OUT]
  6. predict: top: `positive` from 4.3, body `print (traverse positive [1,2,3], traverse positive [1,0,3])` → `(Just [1,2,3],Nothing)` [OUT]
  7. predict: imports `qualified Data.Map as M`; `let m = M.fromList [("b",2),("a",1)]; print m` → `fromList [("a",1),("b",2)]` (sorted by key) [OUT]
  8. predict: same `m`, `print (M.lookup "a" m, M.lookup "z" m, M.findWithDefault 0 "z" m)` → `(Just 1,Nothing,0)` [OUT]
  9. predict: same `m`, `let m2 = M.insert "c" 3 m; print (M.size m, M.size m2)` → `(2,3)` (the old map is unchanged) [OUT]
  10. predict: `print (M.toList (M.fromListWith (+) [(c, 1) | c <- "banana"]))` → `[('a',3),('b',1),('n',2)]` [OUT]
  11. predict: `print (M.fromList [(1,"x"),(1,"y")])` → `fromList [(1,"y")]` (last one wins) [OUT]
  12. predict "What happens?": `let m = M.fromList [("a", 1 :: Int)]; print (m M.! "a"); print (m M.! "b")` → prints `1`, then `Map.!: given key is not an element in the map` [ERR]
  13. predict "Does it compile?": `print (M.lookup "a" m + 1)` with `m :: Map String Int` → No: `No instance for 'Num (Maybe Int)' arising from a use of '+'` [CE]
  14. predict: same `m` (`fromList [("a",1),("b",2)]`), `print (M.insertWith (+) "a" 10 m, M.adjust (*100) "b" m)` → `(fromList [("a",11),("b",2)],fromList [("a",1),("b",200)])` [OUT]
- **Run**: starter
  ```haskell
  import qualified Data.Map as M

  main :: IO ()
  main = do
    let counts = M.fromList [(w, 1) | w <- words "owl cat owl"]
    print (M.lookup "owl" counts)
  ```
  → prints `Just 1` (`fromList` keeps only the last duplicate). Task: count words. Solution:
  `M.fromListWith (+)`. `expect`: `Just 2`. [OUT → OUT]

### Boss: `tower-boss`, "The Tower Guardian" (all three bugs; `haskell/partial-moth` leads)

1. predict: `r <- mapM (\x -> do { print x; return (x * 2) }) [1,2]; print r` → `1` / `2` / `[2,4]` [OUT]
2. predict: `print (M.toList (M.unionWith (+) m (M.fromList [("a",5),("d",4)])))` with `m = M.fromList [("b",2),("a",1)]` → `[("a",6),("b",2),("d",4)]` [OUT]
3. predict: `print (sum (M.fromList [("a",3),("b",4)]), length (Just 'x'), length Nothing)` → `(7,1,0)` (a Map is Foldable over its values) [OUT]
4. predict: `print (Just [1] <> Nothing, Just [1] <> Just [2])` → `(Just [1],Just [1,2])` [OUT]
5. Reuse: 4.1 Q10, 4.2 Q4, 4.3 Q6, 4.4 Q3, 4.4 Q12.

---

## Entry exams

Format follows `content/rust/exams.ts`: exam questions are `pick`/`predict`/`type`/`order` beats
tagged with a topic; the engine draws round-robin across topics.

### Topic ids

| Topic id | Name (en) | Region link |
|---|---|---|
| `basics` | Expressions, immutability and arithmetic | `lambda-village` |
| `types` | Types, signatures and numbers | `lambda-village` |
| `lists` | Lists and strings | `lambda-village` |
| `patterns` | Pattern matching, guards and partial functions | `lambda-village` |
| `recursion` | Recursion | `fold-forest` |
| `hof` | Higher-order functions and lambdas | `fold-forest` |
| `currying` | Currying, sections and composition | `fold-forest` |
| `folds` | Folds | `fold-forest` |
| `laziness` | Laziness, thunks, seq and bottom | `lazy-mountain` |
| `adts` | Algebraic data types and records | `lazy-mountain` |
| `maybe_either` | Maybe and Either | `lazy-mountain` |
| `typeclasses` | Type classes, deriving, newtype | `monad-tower` |
| `functors` | Functor and Applicative | `monad-tower` |
| `monads` | Monads and do notation | `monad-tower` |
| `io` | IO, purity, mapM_ and traverse | `monad-tower` |
| `containers` | Data.Map and containers | `monad-tower` |
| `effects` | Monad transformers, State/Reader, GADTs | (none yet) |
| `concurrency` | forkIO, MVar, STM | (none yet) |
| `tooling` | Testing, build tools, profiling | (none yet) |

A region is skipped when all its topics are passed: junior can skip `lambda-village` and
`fold-forest` except `currying`/`folds` (which are in mid); mid covers the rest of
`fold-forest`, `lazy-mountain` and the first half of `monad-tower`; senior covers
`monad-tower`.

### Bank sizes

| Exam | Draws / bank | Pass | s/question | Topics in the bank (count) | Suggested kinds |
|---|---|---|---|---|---|
| `junior`, Junior Haskell Developer | 12 / 22 | 70% | 30 | basics 4, types 3, lists 4, patterns 4, recursion 3, hof 4 | predict 14, pick 5, type 2, order 1 |
| `mid`, Mid-level Haskell Developer | 14 / 24 | 70% | 40 | currying 3, folds 3, laziness 3, maybe_either 3, adts 3, typeclasses 4, functors 3, containers 2 | predict 16, pick 5, type 2, order 1 |
| `senior`, Senior Haskell Developer | 15 / 26 | 75% | 50 | laziness 4, folds 2, typeclasses 3, functors 2, monads 4, io 3, containers 2, effects 3, concurrency 2, tooling 1 | predict 18, pick 6, type 1, order 1 |

The lesson questions above are a large pool for the banks (exam questions should be new
wording or new snippets, not copies of lesson beats, so the exam is not a memory test). The
examples below are new snippets, all verified on `ghc984` unless marked [DOC].

### Junior example questions

1. [`basics`] predict: `print (10 - (-2), succ 'a', pred 10)` → `(12,'b',9)`
2. [`basics`] predict "Does it compile?": `putStrLn ("Level " ++ show 3 ++ 1)` → No (`No instance for 'Num [Char]' arising from the literal '1'`)
3. [`basics`] predict: `print (not True || False, True && False, 5 /= 5)` → `(False,False,False)`
4. [`types`] predict: `print (1 / 0 :: Double, 10 / 4, sqrt 16)` → `(Infinity,2.5,4.0)`
5. [`types`] predict: `print (toInteger (maxBound :: Int) + 1, (maxBound :: Int) + 1)` → `(9223372036854775808,-9223372036854775808)`
6. [`lists`] predict: `print (last [1,2,3], init [1,2,3], splitAt 2 [1,2,3,4])` → `(3,[1,2],([1,2],[3,4]))`
7. [`lists`] predict: `print (concat [[1],[2,3]], replicate 3 'x', 'x' : "yz")` → `([1,2,3],"xxx","xyz")`
8. [`lists`] predict: `print (unwords ["a","b"], lines "x\ny", words "a\tb\nc")` → `("a b",["x","y"],["a","b","c"])`
9. [`patterns`] predict "What happens?": top `f :: Int -> String; f 1 = "one"`, body `putStrLn (f 2)` → `Non-exhaustive patterns in function f`
10. [`patterns`] predict: `print (case [1,2,3] of { [] -> "empty"; [x] -> "one"; (x:y:_) -> show (x + y) })` → `"3"`
11. [`recursion`] predict: top `countdown` from 2.1; `print (countdown 2)` → `[2,1,0]`
12. [`hof`] predict: `print (map length ["a","bb","ccc"], zip "abc" [1..])` → `([1,2,3],[('a',1),('b',2),('c',3)])`
13. [`hof`] predict: `print (map fst (filter (even . snd) (zip "abcd" [1..])))` → `"bd"`
14. [`patterns`] predict "What happens?": `print (tail ([] :: [Int]))` → `Prelude.tail: empty list`

### Mid example questions

1. [`currying`] predict: `print (max 3 $ 2 + 5, (`elem` "aeiou") 'e', curry fst 1 2)` → `(7,True,1)`
2. [`currying`] predict: `print (zipWith ($) [(+1), (*2)] [10, 20], ($ 3) <$> [(+1), (*2)])` → `([11,40],[4,6])`
3. [`folds`] predict: `print (foldr (\x k acc -> k (acc + x)) id [1,2,3] 0)` → `6`
4. [`laziness`] predict: `print (let (a, b) = (b + 1, 10) in a)` → `11` (`let` is recursive and lazy)
5. [`laziness`] predict: `print (take 3 (map (* 10) [1..]), takeWhile (<= 10) [0,2..])` → `([10,20,30],[0,2,4,6,8,10])`
6. [`maybe_either`] predict: `print (either show (map succ) (Right "abc" :: Either Int String))` → `"bcd"`
7. [`maybe_either`] predict: `print (fmap (*2) (Left "e" :: Either String Int))` → `Left "e"`
8. [`adts`] predict: top `data Hero = Hero { name :: String, hp :: Int } deriving Show`; `print (Hero "Bo" 3, name (Hero "Bo" 3))` → `(Hero {name = "Bo", hp = 3},"Bo")`
9. [`adts`] predict: top `data Color = Red | Green | Blue deriving (Show, Eq, Ord, Enum, Bounded)`; `print (maximum [Green, Red, Blue], [Red ..])` → `(Blue,[Red,Green,Blue])`
10. [`typeclasses`] predict: top `class Greeter a where { hello :: a -> String; hello _ = "hello"; shout :: a -> String; shout x = hello x ++ "!" }`, `data Cat = Cat`, `instance Greeter Cat where hello _ = "meow"`; `putStrLn (shout Cat)` → `meow!`
11. [`typeclasses`] predict: `print (compare 2 3, compare "b" "a", minBound :: Int)` → `(LT,GT,-9223372036854775808)`
12. [`functors`] predict: `print (sequenceA [[1,2],[3]], pure 5 :: [Int])` → `([[1,3],[2,3]],[5])`
13. [`containers`] predict: imports `qualified Data.Map as M`; `let m = M.fromList [("b",2),("a",1)]; print (M.keys m, M.elems m, M.member "b" m)` → `(["a","b"],[1,2],True)`
14. [`containers`] predict: imports `qualified Data.Set as S`; `print (S.toList (S.fromList "banana"), S.member 'b' (S.fromList "abc"))` → `("abn",True)`
15. [`folds`] pick [DOC]: "Why can `foldr` work on an infinite list but `foldl` never can?" → `foldr` can stop when the combining function ignores its accumulator (lazy `||`, `&&`, `:`); `foldl` must reach the end of the list before returning anything (https://wiki.haskell.org/Foldr_Foldl_Foldl%27)

### Senior example questions

1. [`laziness`] predict: imports `Control.DeepSeq (deepseq)`, `Control.Exception`; `r <- try (evaluate ([1, undefined :: Int] `deepseq` "forced")) :: IO (Either SomeException String); putStrLn (either (const "deepseq hit undefined") id r)` → `deepseq hit undefined`; the same with `seq` prints `whnf` (verified with the string `"whnf"`)
2. [`laziness`] predict: top `data P = P !Int Int`; `case P 1 undefined of P a _ -> a` gives `1`, `case P undefined 1 of P _ b -> b` raises `Prelude.undefined` (strict field forced at construction); write as two separate predicts, the second as [ERR]
3. [`laziness`] predict: top `newtype NAge = NAge Int`; `print (case undefined of NAge _ -> "ok")` → `"ok"` (matching a newtype never forces; the same with `data DAge = DAge Int` raises `Prelude.undefined`)
4. [`typeclasses`] predict: top `newtype MaxI = MaxI Int deriving Show`, `instance Semigroup MaxI where MaxI a <> MaxI b = MaxI (max a b)`, `instance Monoid MaxI where mempty = MaxI minBound`; `print (mconcat (map MaxI [3,9,2]))` → `MaxI 9`
5. [`typeclasses`] predict: top `data Tree a = Leaf | Node (Tree a) a (Tree a)`, `instance Foldable Tree where { foldr _ z Leaf = z; foldr f z (Node l x r) = foldr f (f x (foldr f z r)) l }`; `print (sum (Node (Node Leaf 1 Leaf) 2 (Node Leaf 3 Leaf)), elem 3 (Node Leaf 3 Leaf))` → `(6,True)`
6. [`monads`] predict: `print (traverse (\x -> [x, x * 10]) [1, 2])` → `[[1,2],[1,20],[10,2],[10,20]]`
7. [`monads`] predict: imports `Control.Monad (replicateM)`; `print (replicateM 2 "ab")` → `["aa","ab","ba","bb"]`
8. [`io`] predict: imports `Data.Foldable (traverse_, for_)`; `traverse_ print "ab"; for_ [1, 2] print` → `'a'` / `'b'` / `1` / `2`
9. [`io`] predict: imports `Control.Exception`; `catch (evaluate (error "boom" :: Int) >>= print) (\(ErrorCall msg) -> putStrLn ("caught: " ++ msg))` → `caught: boom`
10. [`effects`] predict: imports `Control.Monad.State`, `Control.Monad (replicateM_)`; top `counter :: State Int Int; counter = do { modify (+1); modify (*10); get }`, `tick :: State Int (); tick = modify (+1)`; `print (runState counter 1, evalState counter 1, execState (replicateM_ 3 tick) 0)` → `((20,20),20,3)`
11. [`effects`] predict: imports `Control.Monad.Reader`; top `greet :: Reader String String; greet = do { n <- ask; return ("hi " ++ n) }`; `print (runReader greet "Lambo")` → `"hi Lambo"`
12. [`effects`] predict: GADT `Expr a` with `IntE`, `BoolE`, `Add`, `If` and `eval :: Expr a -> a` (pragma `{-# LANGUAGE GADTs #-}`); `print (eval (If (BoolE True) (Add (IntE 2) (IntE 3)) (IntE 0)))` → `5`
13. [`effects`] predict "Does it compile?": imports only `Control.Monad.State`; `print (execState (replicateM_ 3 (modify (+1))) 0)` → No (`Variable not in scope: replicateM_`; mtl 2.3 stopped re-exporting `Control.Monad`)
14. [`concurrency`] predict: imports `Control.Concurrent`; `mv <- newEmptyMVar; _ <- forkIO (putMVar mv (sum [1..100 :: Int])); takeMVar mv >>= print` → `5050` (deterministic: `takeMVar` waits)
15. [`concurrency`] predict: imports `Control.Concurrent.STM`; `tv <- newTVarIO (5 :: Int); atomically (modifyTVar' tv (*2)); readTVarIO tv >>= print` → `10`
16. [`containers`] predict: imports `Data.IORef`; `ref <- newIORef (0 :: Int); mapM_ (\x -> modifyIORef' ref (+x)) [1..10]; readIORef ref >>= print` → `55`
17. [`containers`] predict: imports `Data.List (sortBy, sortOn, group, sort)`, `Data.Ord (comparing, Down(..))`; `print (sortBy (comparing snd) [(1,'c'),(2,'a'),(3,'b')], sortOn Down [3,1,2], map (\g -> (head g, length g)) (group (sort "mississippi")))` → `([(2,'a'),(3,'b'),(1,'c')],[3,2,1],[('i',4),('m',1),('p',2),('s',4)])`
18. [`tooling`] pick [DOC]: "A QuickCheck property `prop_rev xs = reverse (reverse xs) == xs` is checked by ..." options `generating many random lists and testing each` / `proving it symbolically` / `running it once on []` → the first (https://hackage.haskell.org/package/QuickCheck)
19. [`tooling`] pick [DOC]: "Which GHC RTS flag prints a GC and allocation summary after a run?" options `+RTS -s` / `-Wall` / `-XStrict` → `+RTS -s` (https://downloads.haskell.org/ghc/9.8.4/docs/users_guide/runtime_control.html)
20. [`laziness`] pick [DOC]: "`Data.Map.Strict` differs from `Data.Map.Lazy` in that ..." → values are evaluated to WHNF before being stored (same API, same type) (https://hackage.haskell.org/package/containers/docs/Data-Map-Strict.html)

Extra verified gotchas usable at any level:

- `print (show 3.0, show (-2), read "[1,2,3]" :: [Int])` → `("3.0","-2",[1,2,3])`
- `print (1.0e7, 12345678.9, 0.1, 1.0e-2)` → `(1.0e7,1.23456789e7,0.1,1.0e-2)` (Double `show` switches to exponent notation at 1e7 and below 0.1)
- `print (div (-7) 2, quot (-7) 2, divMod 7 2, quotRem (-7) 2)` → `(-4,-3,(3,1),(-3,-1))`
- `print (until (> 100) (* 2) 1, iterate (`div` 2) 100 !! 3)` → `(128,12)`
- `print (min "b" "ab", max [2] [1,9])` → `("ab",[2])` (lexicographic)
- `print (show "a\"b", length (show "ab"))` → `("\"a\\\"b\"",4)`
- `print (words "  owl  ", unwords (words "  a   b "))` → `(["owl"],"a b")`
- `mapM_ print (M.fromList [(2,"two"),(1,"one")])` → `"one"` / `"two"` (Foldable over values in key order)
- `print (fromEnum True, toEnum 0 :: Bool, [False ..])` → `(1,False,[False,True])`
- monomorphism restriction: `let coins = 17; let perBag = 5` used with both `/` and `` `div` `` → does not compile (`Ambiguous type variable 'a0' arising from the literal '17'`)

### Things to avoid in Haskell questions

- Non-ASCII text in anything printed with `putStrLn`/`putStr` (crashes on the verifier);
  `print` of such text is fine but shows escapes (`"h\233llo"`).
- Infinite loops, missing base cases, `length [1..]`, big `foldl` leaks or anything that could
  be killed for time or memory: the run loses all stdout. Put them in `pick` with [DOC].
- Reading stdin (`getLine`, `interact`): stdin is empty.
- Printing `Double`s that depend on long computations (keep them short and exact), or
  pointer/`StableName`/timing output.
- Thread-scheduling-dependent output with `forkIO` (always synchronise with `MVar`/STM).
- Claims about `<<loop>>` as a check (detection is not guaranteed by GHC).
- Quoting compile errors with line/column numbers or `[GHC-xxxxx]` codes in the game; quote the
  headline only. Check runtime errors by message substring, without `output.s:`, file paths or
  the `CallStack` block.
- `foldl'` without `import Data.List (foldl')` (only in the Prelude from GHC 9.10).
- QuickCheck, Hspec, `text`-specific APIs in checked snippets beyond what was verified here
  (QuickCheck/Hspec are not installed).
