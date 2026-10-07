import type { CodeTaskBeat, ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Coding tasks for planet Concurra (Go). The tests run on the Go Playground through /api/run, which
// appends them on the server: hidden tests never reach the player's browser.

/** Mid screening: slices and maps, in a normal editor. */
export const dedupeTask: ExamQuestion = {
  slug: "dedupe",
  kind: "code",
  mode: "ide",
  topic: "maps",
  difficulty: 2,
  prompt: L("Coding: remove duplicates", "Código: quita los duplicados", "コーディング：重複を消す"),
  brief: L(
    "Write Dedupe(xs []int) []int: return a new slice with each number once, keeping the order of first appearance.",
    "Escribe Dedupe(xs []int) []int: devuelve un slice nuevo con cada número una sola vez, en el orden en que aparece por primera vez.",
    "Dedupe(xs []int) []int を書こう。各数を1回だけ、最初に出てきた順で並べた新しいスライスを返す。",
  ),
  starter: 'package main\n\nimport "fmt"\n\nfunc Dedupe(xs []int) []int {\n\t// your code here\n\treturn nil\n}\n',
  solution: 'package main\n\nimport "fmt"\n\nfunc Dedupe(xs []int) []int {\n\tseen := map[int]bool{}\n\tout := []int{}\n\tfor _, x := range xs {\n\t\tif !seen[x] {\n\t\t\tseen[x] = true\n\t\t\tout = append(out, x)\n\t\t}\n\t}\n\treturn out\n}\n',
  nearMiss: [
    // Map keys come back in random order: sorting them loses the original order.
    'package main\n\nimport (\n\t"fmt"\n\t"sort"\n)\n\nfunc Dedupe(xs []int) []int {\n\tseen := map[int]bool{}\n\tfor _, x := range xs {\n\t\tseen[x] = true\n\t}\n\tout := []int{}\n\tfor x := range seen {\n\t\tout = append(out, x)\n\t}\n\tsort.Ints(out)\n\treturn out\n}\n',
  ],
  tests: [
    { run: "fmt.Println(Dedupe([]int{3, 1, 3, 2, 1}))", expect: "[3 1 2]" },
    { run: "fmt.Println(Dedupe([]int{}))", expect: "[]" },
    { run: "fmt.Println(Dedupe([]int{7, 7, 7}))", expect: "[7]", hidden: true },
    { run: "fmt.Println(Dedupe([]int{5, 4, 3}))", expect: "[5 4 3]", hidden: true },
    { run: "fmt.Println(Dedupe([]int{2, 1, 2, 1, 3}))", expect: "[2 1 3]", hidden: true },
  ],
  explain: L(
    "Keep a map of numbers already seen and append a number only the first time. Never range over the map for the result: its order is random.",
    "Guarda un map con los números ya vistos y agrega cada número solo la primera vez. No recorras el map para el resultado: su orden es aleatorio.",
    "見た数を map に記録し、初めてのときだけ append する。結果を map の range で作らないこと。順番がランダムになる。",
  ),
};

// ─── JUNIOR (online skills test, normal editor) ─────────────────────────────

export const reverseWordsTask: ExamQuestion = {
  slug: "reverse-words",
  kind: "code",
  mode: "ide",
  topic: "strings",
  difficulty: 1,
  prompt: L("Coding: reverse the words", "Código: invierte las palabras", "コーディング：単語を逆順に"),
  brief: L(
    'Write ReverseWords(s string) string: return the words of s in reverse order, joined by single spaces. Words are separated by one or more spaces; leading and trailing spaces don\'t count. A blank string gives "". Example: "hello big world" → "world big hello".',
    'Escribe ReverseWords(s string) string: devuelve las palabras de s en orden inverso, unidas por un solo espacio. Las palabras se separan con uno o más espacios; los espacios al inicio y al final no cuentan. Un string vacío o en blanco da "". Ejemplo: "hello big world" → "world big hello".',
    'ReverseWords(s string) string を書こう。s の単語を逆順にし、空白1つでつないで返す。単語の区切りは1つ以上の空白で、前後の空白は数えない。空や空白だけなら ""。例："hello big world" → "world big hello"。',
  ),
  starter: `package main

import "fmt"

func ReverseWords(s string) string {
\t// your code here
\treturn ""
}
`,
  solution: `package main

import (
\t"fmt"
\t"strings"
)

func ReverseWords(s string) string {
\twords := strings.Fields(s)
\tfor i, j := 0, len(words)-1; i < j; i, j = i+1, j-1 {
\t\twords[i], words[j] = words[j], words[i]
\t}
\treturn strings.Join(words, " ")
}
`,
  nearMiss: [
    // Split on a single space keeps empty "words" when spaces repeat.
    `package main

import (
\t"fmt"
\t"strings"
)

func ReverseWords(s string) string {
\twords := strings.Split(s, " ")
\tfor i, j := 0, len(words)-1; i < j; i, j = i+1, j-1 {
\t\twords[i], words[j] = words[j], words[i]
\t}
\treturn strings.Join(words, " ")
}
`,
    // Reverses the characters instead of the words.
    `package main

import "fmt"

func ReverseWords(s string) string {
\tb := []byte(s)
\tfor i, j := 0, len(b)-1; i < j; i, j = i+1, j-1 {
\t\tb[i], b[j] = b[j], b[i]
\t}
\treturn string(b)
}
`,
  ],
  tests: [
    { run: 'fmt.Printf("%q\\n", ReverseWords("hello big world"))', expect: '"world big hello"' },
    { run: 'fmt.Printf("%q\\n", ReverseWords("  go   is fun "))', expect: '"fun is go"' },
    { run: 'fmt.Printf("%q\\n", ReverseWords(""))', expect: '""', hidden: true },
    { run: 'fmt.Printf("%q\\n", ReverseWords("solo"))', expect: '"solo"', hidden: true },
    { run: 'fmt.Printf("%q\\n", ReverseWords("   "))', expect: '""', hidden: true },
    { run: 'fmt.Printf("%q\\n", ReverseWords("a  b c"))', expect: '"c b a"', hidden: true },
  ],
  explain: L(
    "strings.Fields splits on any run of spaces and drops the empty pieces; then swap from both ends and strings.Join with one space.",
    "strings.Fields corta por cualquier grupo de espacios y descarta los vacíos; luego intercambia desde los extremos y une con strings.Join.",
    "strings.Fields は連続した空白で区切り、空の部分を捨てる。両端から入れかえて strings.Join で空白1つでつなぐ。",
  ),
};

export const secondLargestTask: ExamQuestion = {
  slug: "second-largest",
  kind: "code",
  mode: "ide",
  topic: "slices",
  difficulty: 2,
  prompt: L("Coding: the second largest number", "Código: el segundo número más grande", "コーディング：2番目に大きい数"),
  brief: L(
    "Write SecondLargest(xs []int) (int, bool): return the largest value that is strictly smaller than the maximum, and true. If there is none (empty slice, or every value equal), return 0, false. Numbers can be negative. Example: [3 9 4 9] → 4 true.",
    "Escribe SecondLargest(xs []int) (int, bool): devuelve el mayor valor que sea estrictamente menor que el máximo, y true. Si no existe (slice vacío o todos iguales), devuelve 0, false. Puede haber negativos. Ejemplo: [3 9 4 9] → 4 true.",
    "SecondLargest(xs []int) (int, bool) を書こう。最大値より「真に小さい」中で最大の値と true を返す。ない場合（空、または全部同じ値）は 0, false。負の数もある。例：[3 9 4 9] → 4 true。",
  ),
  starter: `package main

import "fmt"

func SecondLargest(xs []int) (int, bool) {
\t// your code here
\treturn 0, false
}
`,
  solution: `package main

import "fmt"

func SecondLargest(xs []int) (int, bool) {
\tif len(xs) == 0 {
\t\treturn 0, false
\t}
\tmax := xs[0]
\tfor _, x := range xs {
\t\tif x > max {
\t\t\tmax = x
\t\t}
\t}
\tsecond, found := 0, false
\tfor _, x := range xs {
\t\tif x < max && (!found || x > second) {
\t\t\tsecond, found = x, true
\t\t}
\t}
\treturn second, found
}
`,
  nearMiss: [
    // Starts both trackers at 0, which breaks on all-negative input.
    `package main

import "fmt"

func SecondLargest(xs []int) (int, bool) {
\tfirst, second := 0, 0
\tfor _, x := range xs {
\t\tif x > first {
\t\t\tfirst, second = x, first
\t\t} else if x > second && x < first {
\t\t\tsecond = x
\t\t}
\t}
\treturn second, second != 0
}
`,
    // Sorts and takes the second to last item: duplicates of the maximum win.
    `package main

import (
\t"fmt"
\t"sort"
)

func SecondLargest(xs []int) (int, bool) {
\tif len(xs) < 2 {
\t\treturn 0, false
\t}
\ts := append([]int(nil), xs...)
\tsort.Ints(s)
\treturn s[len(s)-2], true
}
`,
  ],
  tests: [
    { run: "fmt.Println(SecondLargest([]int{3, 9, 4, 9}))", expect: "4 true" },
    { run: "fmt.Println(SecondLargest([]int{5}))", expect: "0 false" },
    { run: "fmt.Println(SecondLargest([]int{-5, -2, -9}))", expect: "-5 true", hidden: true },
    { run: "fmt.Println(SecondLargest([]int{7, 7, 7}))", expect: "0 false", hidden: true },
    { run: "fmt.Println(SecondLargest([]int{}))", expect: "0 false", hidden: true },
    { run: "fmt.Println(SecondLargest([]int{1, 2}))", expect: "1 true", hidden: true },
  ],
  explain: L(
    "Find the maximum first, then the biggest value below it. Start from the data, not from 0, or negative inputs break; repeated maxima don't count.",
    "Primero busca el máximo y luego el mayor valor por debajo. Parte de los datos, no de 0, o fallan los negativos; los máximos repetidos no cuentan.",
    "まず最大値を求め、次にそれより小さい中の最大を探す。0 から始めると負の数で壊れる。最大値の重複は数えない。",
  ),
};

export const topLetterTask: ExamQuestion = {
  slug: "top-letter",
  kind: "code",
  mode: "ide",
  topic: "maps",
  difficulty: 2,
  prompt: L("Coding: the most common letter", "Código: la letra más común", "コーディング：いちばん多い文字"),
  brief: L(
    'Write TopLetter(s string) string: return the letter a-z that appears most often in s, in lowercase. Ignore case ("A" counts as "a") and ignore anything that isn\'t a letter. On a tie, return the letter that comes first in the alphabet. With no letters, return "". Example: "Banana!" → "a".',
    'Escribe TopLetter(s string) string: devuelve en minúscula la letra a-z que más aparece en s. Ignora mayúsculas ("A" cuenta como "a") y todo lo que no sea letra. Si hay empate, devuelve la que va primero en el alfabeto. Sin letras, devuelve "". Ejemplo: "Banana!" → "a".',
    'TopLetter(s string) string を書こう。s で最も多く出る a-z の文字を小文字で返す。大文字小文字は区別せず（"A" は "a"）、文字以外は無視。同数ならアルファベット順で先の文字。文字がなければ ""。例："Banana!" → "a"。',
  ),
  starter: `package main

import "fmt"

func TopLetter(s string) string {
\t// your code here
\treturn ""
}
`,
  solution: `package main

import (
\t"fmt"
\t"strings"
)

func TopLetter(s string) string {
\tcounts := map[rune]int{}
\tfor _, r := range strings.ToLower(s) {
\t\tif r >= 'a' && r <= 'z' {
\t\t\tcounts[r]++
\t\t}
\t}
\tbest, bestN := "", 0
\tfor r := 'a'; r <= 'z'; r++ {
\t\tif counts[r] > bestN {
\t\t\tbest, bestN = string(r), counts[r]
\t\t}
\t}
\treturn best
}
`,
  nearMiss: [
    // Forgets to lowercase, so capital letters are never counted.
    `package main

import "fmt"

func TopLetter(s string) string {
\tcounts := map[rune]int{}
\tfor _, r := range s {
\t\tif r >= 'a' && r <= 'z' {
\t\t\tcounts[r]++
\t\t}
\t}
\tbest, bestN := "", 0
\tfor r := 'a'; r <= 'z'; r++ {
\t\tif counts[r] > bestN {
\t\t\tbest, bestN = string(r), counts[r]
\t\t}
\t}
\treturn best
}
`,
    // >= lets a later letter win a tie.
    `package main

import (
\t"fmt"
\t"strings"
)

func TopLetter(s string) string {
\tcounts := map[rune]int{}
\tfor _, r := range strings.ToLower(s) {
\t\tif r >= 'a' && r <= 'z' {
\t\t\tcounts[r]++
\t\t}
\t}
\tbest, bestN := "", 0
\tfor r := 'a'; r <= 'z'; r++ {
\t\tif counts[r] > 0 && counts[r] >= bestN {
\t\t\tbest, bestN = string(r), counts[r]
\t\t}
\t}
\treturn best
}
`,
  ],
  tests: [
    { run: 'fmt.Printf("%q\\n", TopLetter("Banana!"))', expect: '"a"' },
    { run: 'fmt.Printf("%q\\n", TopLetter("123 !?"))', expect: '""' },
    { run: 'fmt.Printf("%q\\n", TopLetter("AAbc"))', expect: '"a"', hidden: true },
    { run: 'fmt.Printf("%q\\n", TopLetter("zzyY"))', expect: '"y"', hidden: true },
    { run: 'fmt.Printf("%q\\n", TopLetter(""))', expect: '""', hidden: true },
    { run: 'fmt.Printf("%q\\n", TopLetter("Hello, World"))', expect: '"l"', hidden: true },
  ],
  explain: L(
    "Lowercase first, count letters in a map, then walk 'a' to 'z' keeping a strict >. Walking the alphabet (not the map) gives ties a fixed order.",
    "Pasa a minúsculas, cuenta en un map y recorre de 'a' a 'z' con > estricto. Recorrer el alfabeto (no el map) da a los empates un orden fijo.",
    "小文字にして map で数え、'a' から 'z' まで厳密な > で調べる。map ではなくアルファベット順に回すので同数の順が決まる。",
  ),
};

export const parseAgeTask: ExamQuestion = {
  slug: "parse-age",
  kind: "code",
  mode: "ide",
  topic: "errors",
  difficulty: 2,
  prompt: L("Coding: parse an age", "Código: lee una edad", "コーディング：年齢を読む"),
  brief: L(
    'Write ParseAge(s string) (int, error). s holds a whole number, maybe with spaces around it. Return the age and nil if it is between 0 and 150 inclusive. Otherwise (not a number, or out of range) return 0 and a non-nil error. Examples: "42" → 42 <nil>; " 7 " → 7 <nil>; "abc" and "200" → 0 and an error.',
    'Escribe ParseAge(s string) (int, error). s tiene un número entero, quizás con espacios alrededor. Devuelve la edad y nil si está entre 0 y 150 inclusive. Si no (no es número o está fuera de rango), devuelve 0 y un error no nil. Ejemplos: "42" → 42 <nil>; " 7 " → 7 <nil>; "abc" y "200" → 0 y un error.',
    'ParseAge(s string) (int, error) を書こう。s は整数（前後に空白があるかも）。0〜150 なら年齢と nil を返す。それ以外（数でない・範囲外）は 0 と nil でない error。例："42" → 42 <nil>、" 7 " → 7 <nil>、"abc" と "200" → 0 と error。',
  ),
  starter: `package main

import "fmt"

func ParseAge(s string) (int, error) {
\t// your code here
\treturn 0, nil
}
`,
  solution: `package main

import (
\t"fmt"
\t"strconv"
\t"strings"
)

func ParseAge(s string) (int, error) {
\tn, err := strconv.Atoi(strings.TrimSpace(s))
\tif err != nil {
\t\treturn 0, err
\t}
\tif n < 0 || n > 150 {
\t\treturn 0, fmt.Errorf("age out of range: %d", n)
\t}
\treturn n, nil
}
`,
  nearMiss: [
    // Doesn't trim, so " 7 " is rejected.
    `package main

import (
\t"fmt"
\t"strconv"
)

func ParseAge(s string) (int, error) {
\tn, err := strconv.Atoi(s)
\tif err != nil {
\t\treturn 0, err
\t}
\tif n < 0 || n > 150 {
\t\treturn 0, fmt.Errorf("age out of range: %d", n)
\t}
\treturn n, nil
}
`,
    // Returns the parsed number together with the range error.
    `package main

import (
\t"fmt"
\t"strconv"
\t"strings"
)

func ParseAge(s string) (int, error) {
\tn, err := strconv.Atoi(strings.TrimSpace(s))
\tif err != nil {
\t\treturn 0, err
\t}
\tif n < 0 || n > 150 {
\t\treturn n, fmt.Errorf("age out of range: %d", n)
\t}
\treturn n, nil
}
`,
  ],
  tests: [
    { run: 'fmt.Println(ParseAge("42"))', expect: "42 <nil>" },
    { run: '{ n, err := ParseAge("abc"); fmt.Println(n, err != nil) }', expect: "0 true" },
    { run: 'fmt.Println(ParseAge(" 7 "))', expect: "7 <nil>", hidden: true },
    { run: '{ n, err := ParseAge("200"); fmt.Println(n, err != nil) }', expect: "0 true", hidden: true },
    { run: '{ n, err := ParseAge("-1"); fmt.Println(n, err != nil) }', expect: "0 true", hidden: true },
    { run: 'fmt.Println(ParseAge("150"))', expect: "150 <nil>", hidden: true },
  ],
  explain: L(
    "Trim, then strconv.Atoi and return its error as is. Check the range yourself and return the zero value with every error, never a half result.",
    "Recorta, usa strconv.Atoi y devuelve su error tal cual. Revisa el rango tú y devuelve el valor cero con cada error, nunca un resultado a medias.",
    "空白を削って strconv.Atoi、その error はそのまま返す。範囲は自分で調べ、error のときは必ずゼロ値を返す。",
  ),
};

// ─── MID (technical screen: 2 in the editor, 2 written) ─────────────────────

export const stackTask: ExamQuestion = {
  slug: "stack",
  kind: "code",
  mode: "ide",
  topic: "generics",
  difficulty: 2,
  prompt: L("Coding: a generic stack", "Código: una pila genérica", "コーディング：ジェネリックなスタック"),
  brief: L(
    "Complete the generic Stack[T]. Push adds an item on top. Pop removes and returns the top item and true; on an empty stack it returns the zero value of T and false (it must not panic). Len returns how many items are stored. The zero value of Stack must be ready to use.",
    "Completa la pila genérica Stack[T]. Push agrega un elemento arriba. Pop quita y devuelve el de arriba y true; con la pila vacía devuelve el valor cero de T y false (no debe hacer panic). Len devuelve cuántos elementos hay. El valor cero de Stack debe poder usarse tal cual.",
    "ジェネリックな Stack[T] を完成させよう。Push は上に積む。Pop は一番上を取り出して true と返す。空なら T のゼロ値と false（panic しない）。Len は個数。Stack のゼロ値のまま使えること。",
  ),
  starter: `package main

import "fmt"

type Stack[T any] struct {
\titems []T
}

func (s *Stack[T]) Push(v T) {
\t// your code here
}

func (s *Stack[T]) Pop() (T, bool) {
\tvar zero T
\treturn zero, false
}

func (s *Stack[T]) Len() int {
\treturn 0
}
`,
  solution: `package main

import "fmt"

type Stack[T any] struct {
\titems []T
}

func (s *Stack[T]) Push(v T) {
\ts.items = append(s.items, v)
}

func (s *Stack[T]) Pop() (T, bool) {
\tvar zero T
\tif len(s.items) == 0 {
\t\treturn zero, false
\t}
\tv := s.items[len(s.items)-1]
\ts.items = s.items[:len(s.items)-1]
\treturn v, true
}

func (s *Stack[T]) Len() int {
\treturn len(s.items)
}
`,
  nearMiss: [
    // Pops from the front: that's a queue.
    `package main

import "fmt"

type Stack[T any] struct {
\titems []T
}

func (s *Stack[T]) Push(v T) {
\ts.items = append(s.items, v)
}

func (s *Stack[T]) Pop() (T, bool) {
\tvar zero T
\tif len(s.items) == 0 {
\t\treturn zero, false
\t}
\tv := s.items[0]
\ts.items = s.items[1:]
\treturn v, true
}

func (s *Stack[T]) Len() int {
\treturn len(s.items)
}
`,
    // No empty check: Pop on an empty stack panics.
    `package main

import "fmt"

type Stack[T any] struct {
\titems []T
}

func (s *Stack[T]) Push(v T) {
\ts.items = append(s.items, v)
}

func (s *Stack[T]) Pop() (T, bool) {
\tv := s.items[len(s.items)-1]
\ts.items = s.items[:len(s.items)-1]
\treturn v, true
}

func (s *Stack[T]) Len() int {
\treturn len(s.items)
}
`,
  ],
  tests: [
    { run: "{ var s Stack[int]; s.Push(1); s.Push(2); fmt.Println(s.Pop()) }", expect: "2 true" },
    { run: "{ var s Stack[int]; fmt.Println(s.Pop()) }", expect: "0 false" },
    { run: '{ var s Stack[string]; s.Push("a"); s.Push("b"); s.Push("c"); x, _ := s.Pop(); y, _ := s.Pop(); fmt.Println(x, y, s.Len()) }', expect: "c b 1", hidden: true },
    { run: "{ var s Stack[int]; s.Push(5); s.Pop(); _, ok := s.Pop(); fmt.Println(ok, s.Len()) }", expect: "false 0", hidden: true },
    { run: "{ var s Stack[int]; for i := 1; i <= 3; i++ { s.Push(i) }; s.Pop(); s.Push(9); v, _ := s.Pop(); fmt.Println(v, s.Len()) }", expect: "9 2", hidden: true },
  ],
  explain: L(
    "Use pointer receivers, append to push, and take the last item to pop. Check the length first so an empty Pop returns zero and false.",
    "Usa receptores puntero, append para apilar y toma el último para desapilar. Revisa el largo antes, así un Pop vacío devuelve cero y false.",
    "ポインタレシーバを使い、Push は append、Pop は最後の要素を取る。先に長さを調べれば、空の Pop はゼロ値と false を返せる。",
  ),
};

export const topKTask: ExamQuestion = {
  slug: "top-k",
  kind: "code",
  mode: "paper",
  topic: "maps",
  difficulty: 3,
  prompt: L("Written test: the k most frequent words", "Prueba escrita: las k palabras más frecuentes", "筆記：多い順に k 個の単語"),
  brief: L(
    "Write TopK(words []string, k int) []string: the k most frequent words, most frequent first. Ties go in alphabetical order. If k is larger than the number of distinct words, return them all; for empty input or k = 0 return an empty slice. Example: [go rust go zig rust go], k=2 → [go rust].",
    "Escribe TopK(words []string, k int) []string: las k palabras más frecuentes, de mayor a menor. Los empates van en orden alfabético. Si k supera la cantidad de palabras distintas, devuélvelas todas; con entrada vacía o k = 0 devuelve un slice vacío. Ejemplo: [go rust go zig rust go], k=2 → [go rust].",
    "TopK(words []string, k int) []string を書こう。出現回数の多い順に k 個の単語を返す。同数はアルファベット順。k が異なる単語数より大きければ全部、空入力や k = 0 なら空スライス。例：[go rust go zig rust go], k=2 → [go rust]。",
  ),
  starter: `package main

import "fmt"

func TopK(words []string, k int) []string {
\t// your code here
\treturn nil
}
`,
  solution: `package main

import (
\t"fmt"
\t"sort"
)

func TopK(words []string, k int) []string {
\tcounts := map[string]int{}
\tfor _, w := range words {
\t\tcounts[w]++
\t}
\tkeys := make([]string, 0, len(counts))
\tfor w := range counts {
\t\tkeys = append(keys, w)
\t}
\tsort.Slice(keys, func(i, j int) bool {
\t\tif counts[keys[i]] != counts[keys[j]] {
\t\t\treturn counts[keys[i]] > counts[keys[j]]
\t\t}
\t\treturn keys[i] < keys[j]
\t})
\tif k > len(keys) {
\t\tk = len(keys)
\t}
\treturn keys[:k]
}
`,
  nearMiss: [
    // Ties come out in reverse alphabetical order.
    `package main

import (
\t"fmt"
\t"sort"
)

func TopK(words []string, k int) []string {
\tcounts := map[string]int{}
\tfor _, w := range words {
\t\tcounts[w]++
\t}
\tkeys := make([]string, 0, len(counts))
\tfor w := range counts {
\t\tkeys = append(keys, w)
\t}
\tsort.Slice(keys, func(i, j int) bool {
\t\tif counts[keys[i]] != counts[keys[j]] {
\t\t\treturn counts[keys[i]] > counts[keys[j]]
\t\t}
\t\treturn keys[i] > keys[j]
\t})
\tif k > len(keys) {
\t\tk = len(keys)
\t}
\treturn keys[:k]
}
`,
    // Doesn't clamp k: slicing past the capacity panics.
    `package main

import (
\t"fmt"
\t"sort"
)

func TopK(words []string, k int) []string {
\tcounts := map[string]int{}
\tfor _, w := range words {
\t\tcounts[w]++
\t}
\tkeys := make([]string, 0, len(counts))
\tfor w := range counts {
\t\tkeys = append(keys, w)
\t}
\tsort.Slice(keys, func(i, j int) bool {
\t\tif counts[keys[i]] != counts[keys[j]] {
\t\t\treturn counts[keys[i]] > counts[keys[j]]
\t\t}
\t\treturn keys[i] < keys[j]
\t})
\treturn keys[:k]
}
`,
  ],
  tests: [
    { run: 'fmt.Println(TopK([]string{"go", "rust", "go", "zig", "rust", "go"}, 2))', expect: "[go rust]" },
    { run: 'fmt.Println(TopK([]string{"b", "a", "c", "a", "b"}, 2))', expect: "[a b]" },
    { run: 'fmt.Println(TopK([]string{"x", "y"}, 5))', expect: "[x y]", hidden: true },
    { run: "fmt.Println(TopK(nil, 3))", expect: "[]", hidden: true },
    { run: 'fmt.Println(TopK([]string{"a"}, 0))', expect: "[]", hidden: true },
    { run: 'fmt.Println(TopK([]string{"d", "c", "b", "c", "d", "b"}, 3))', expect: "[b c d]", hidden: true },
  ],
  explain: L(
    "Count in a map, copy the keys to a slice, then sort by count (descending) and name (ascending). Clamp k before slicing.",
    "Cuenta en un map, copia las claves a un slice y ordena por cantidad (descendente) y nombre (ascendente). Limita k antes de cortar.",
    "map で数え、キーをスライスに移し、回数の降順・名前の昇順で並べる。切り出す前に k を上限で抑える。",
  ),
};

export const withdrawTask: ExamQuestion = {
  slug: "withdraw",
  kind: "code",
  mode: "paper",
  topic: "errors",
  difficulty: 2,
  prompt: L("Written test: withdraw with wrapped errors", "Prueba escrita: retiro con errores envueltos", "筆記：エラーを包んで引き出す"),
  brief: L(
    'Write the Withdraw method. If n <= 0, return ErrInvalidAmount. If n is greater than the balance, return an error that wraps ErrInsufficientFunds (errors.Is must find it) with the exact text "insufficient funds: need 15, have 10" (your numbers). Otherwise subtract n and return nil. On any error the balance stays the same.',
    'Escribe el método Withdraw. Si n <= 0, devuelve ErrInvalidAmount. Si n es mayor que el saldo, devuelve un error que envuelva ErrInsufficientFunds (errors.Is debe encontrarlo) con el texto exacto "insufficient funds: need 15, have 10" (con tus números). Si no, resta n y devuelve nil. Ante cualquier error el saldo no cambia.',
    'Withdraw メソッドを書こう。n <= 0 なら ErrInvalidAmount。n が残高より大きければ ErrInsufficientFunds を包んだ error（errors.Is で見つかること）を、正確に "insufficient funds: need 15, have 10"（数は実際の値）の文で返す。それ以外は n を引いて nil。error のとき残高は変えない。',
  ),
  starter: `package main

import (
\t"errors"
\t"fmt"
)

var ErrInvalidAmount = errors.New("invalid amount")
var ErrInsufficientFunds = errors.New("insufficient funds")

type Account struct {
\tBalance int
}

func (a *Account) Withdraw(n int) error {
\t// your code here
\treturn nil
}
`,
  solution: `package main

import (
\t"errors"
\t"fmt"
)

var ErrInvalidAmount = errors.New("invalid amount")
var ErrInsufficientFunds = errors.New("insufficient funds")

type Account struct {
\tBalance int
}

func (a *Account) Withdraw(n int) error {
\tif n <= 0 {
\t\treturn ErrInvalidAmount
\t}
\tif n > a.Balance {
\t\treturn fmt.Errorf("%w: need %d, have %d", ErrInsufficientFunds, n, a.Balance)
\t}
\ta.Balance -= n
\treturn nil
}
`,
  nearMiss: [
    // %v formats the text but doesn't wrap: errors.Is can't find the sentinel.
    `package main

import (
\t"errors"
\t"fmt"
)

var ErrInvalidAmount = errors.New("invalid amount")
var ErrInsufficientFunds = errors.New("insufficient funds")

type Account struct {
\tBalance int
}

func (a *Account) Withdraw(n int) error {
\tif n <= 0 {
\t\treturn ErrInvalidAmount
\t}
\tif n > a.Balance {
\t\treturn fmt.Errorf("%v: need %d, have %d", ErrInsufficientFunds, n, a.Balance)
\t}
\ta.Balance -= n
\treturn nil
}
`,
    // >= refuses to withdraw the whole balance.
    `package main

import (
\t"errors"
\t"fmt"
)

var ErrInvalidAmount = errors.New("invalid amount")
var ErrInsufficientFunds = errors.New("insufficient funds")

type Account struct {
\tBalance int
}

func (a *Account) Withdraw(n int) error {
\tif n <= 0 {
\t\treturn ErrInvalidAmount
\t}
\tif n >= a.Balance {
\t\treturn fmt.Errorf("%w: need %d, have %d", ErrInsufficientFunds, n, a.Balance)
\t}
\ta.Balance -= n
\treturn nil
}
`,
    // A value receiver changes a copy: the balance never moves.
    `package main

import (
\t"errors"
\t"fmt"
)

var ErrInvalidAmount = errors.New("invalid amount")
var ErrInsufficientFunds = errors.New("insufficient funds")

type Account struct {
\tBalance int
}

func (a Account) Withdraw(n int) error {
\tif n <= 0 {
\t\treturn ErrInvalidAmount
\t}
\tif n > a.Balance {
\t\treturn fmt.Errorf("%w: need %d, have %d", ErrInsufficientFunds, n, a.Balance)
\t}
\ta.Balance -= n
\treturn nil
}
`,
  ],
  tests: [
    { run: "{ a := &Account{Balance: 10}; err := a.Withdraw(3); fmt.Println(err, a.Balance) }", expect: "<nil> 7" },
    { run: "{ a := &Account{Balance: 10}; err := a.Withdraw(15); fmt.Println(err, a.Balance) }", expect: "insufficient funds: need 15, have 10 10" },
    { run: "{ a := &Account{Balance: 10}; fmt.Println(errors.Is(a.Withdraw(15), ErrInsufficientFunds)) }", expect: "true", hidden: true },
    { run: "{ a := &Account{Balance: 5}; err := a.Withdraw(5); fmt.Println(err, a.Balance) }", expect: "<nil> 0", hidden: true },
    { run: "{ a := &Account{Balance: 5}; err := a.Withdraw(0); fmt.Println(err == ErrInvalidAmount, a.Balance) }", expect: "true 5", hidden: true },
    { run: "{ a := &Account{Balance: 5}; err := a.Withdraw(-2); fmt.Println(errors.Is(err, ErrInvalidAmount)) }", expect: "true", hidden: true },
  ],
  explain: L(
    "Use a pointer receiver so the change sticks, and fmt.Errorf with %w so errors.Is still finds the sentinel. Withdrawing the whole balance is allowed.",
    "Usa un receptor puntero para que el cambio quede, y fmt.Errorf con %w para que errors.Is siga hallando el centinela. Retirar todo el saldo se permite.",
    "変更を残すためポインタレシーバにし、errors.Is が見つけられるよう fmt.Errorf の %w で包む。残高ちょうどの引き出しは OK。",
  ),
};

// ─── SENIOR (interview: 1 in the editor, 3 written) ──────────────────────────

export const parallelMapTask: ExamQuestion = {
  slug: "parallel-map",
  kind: "code",
  mode: "ide",
  topic: "goroutines",
  difficulty: 3,
  prompt: L("Coding: a bounded parallel map", "Código: un map paralelo con límite", "コーディング：上限つき並列 map"),
  brief: L(
    "Write ParallelMap[T, R any](xs []T, workers int, f func(T) R) []R. Apply f to every item using at most `workers` goroutines at once (workers < 1 means 1). The result has the same length as xs and result[i] = f(xs[i]), in input order. Return only after every call has finished. Example: [1 2 3], 2 workers, square → [1 4 9].",
    "Escribe ParallelMap[T, R any](xs []T, workers int, f func(T) R) []R. Aplica f a cada elemento con a lo sumo `workers` goroutines a la vez (workers < 1 significa 1). El resultado tiene el largo de xs y result[i] = f(xs[i]), en el orden de entrada. Retorna solo cuando todas las llamadas terminaron. Ejemplo: [1 2 3], 2 workers, cuadrado → [1 4 9].",
    "ParallelMap[T, R any](xs []T, workers int, f func(T) R) []R を書こう。同時に最大 workers 個の goroutine で全要素に f を適用（workers < 1 は 1）。結果は xs と同じ長さで result[i] = f(xs[i])、入力順。全呼び出しが終わってから返す。例：[1 2 3]、2 workers、2乗 → [1 4 9]。",
  ),
  starter: `package main

import "fmt"

func ParallelMap[T, R any](xs []T, workers int, f func(T) R) []R {
\t// your code here
\treturn nil
}
`,
  solution: `package main

import (
\t"fmt"
\t"sync"
)

func ParallelMap[T, R any](xs []T, workers int, f func(T) R) []R {
\tif workers < 1 {
\t\tworkers = 1
\t}
\tout := make([]R, len(xs))
\tjobs := make(chan int)
\tvar wg sync.WaitGroup
\tfor w := 0; w < workers; w++ {
\t\twg.Add(1)
\t\tgo func() {
\t\t\tdefer wg.Done()
\t\t\tfor i := range jobs {
\t\t\t\tout[i] = f(xs[i])
\t\t\t}
\t\t}()
\t}
\tfor i := range xs {
\t\tjobs <- i
\t}
\tclose(jobs)
\twg.Wait()
\treturn out
}
`,
  nearMiss: [
    // workers = 0 starts no goroutine, so the first send blocks forever (deadlock).
    `package main

import (
\t"fmt"
\t"sync"
)

func ParallelMap[T, R any](xs []T, workers int, f func(T) R) []R {
\tout := make([]R, len(xs))
\tjobs := make(chan int)
\tvar wg sync.WaitGroup
\tfor w := 0; w < workers; w++ {
\t\twg.Add(1)
\t\tgo func() {
\t\t\tdefer wg.Done()
\t\t\tfor i := range jobs {
\t\t\t\tout[i] = f(xs[i])
\t\t\t}
\t\t}()
\t}
\tfor i := range xs {
\t\tjobs <- i
\t}
\tclose(jobs)
\twg.Wait()
\treturn out
}
`,
    // Fixed-size chunks drop the remainder: the last items are never computed.
    `package main

import (
\t"fmt"
\t"sync"
)

func ParallelMap[T, R any](xs []T, workers int, f func(T) R) []R {
\tif workers < 1 {
\t\tworkers = 1
\t}
\tout := make([]R, len(xs))
\tsize := len(xs) / workers
\tvar wg sync.WaitGroup
\tfor w := 0; w < workers; w++ {
\t\twg.Add(1)
\t\tgo func(lo, hi int) {
\t\t\tdefer wg.Done()
\t\t\tfor i := lo; i < hi; i++ {
\t\t\t\tout[i] = f(xs[i])
\t\t\t}
\t\t}(w*size, (w+1)*size)
\t}
\twg.Wait()
\treturn out
}
`,
  ],
  tests: [
    { run: "fmt.Println(ParallelMap([]int{1, 2, 3, 4, 5}, 2, func(x int) int { return x * x }))", expect: "[1 4 9 16 25]" },
    { run: 'fmt.Println(ParallelMap([]string{"go", "zig"}, 4, func(s string) int { return len(s) }))', expect: "[2 3]" },
    { run: "fmt.Println(ParallelMap([]int{}, 3, func(x int) int { return x }))", expect: "[]", hidden: true },
    { run: "fmt.Println(ParallelMap([]int{3, 1, 2}, 0, func(x int) int { return -x }))", expect: "[-3 -1 -2]", hidden: true },
    { run: "{ xs := make([]int, 100); for i := range xs { xs[i] = i }; r := ParallelMap(xs, 7, func(x int) int { return x * 2 }); fmt.Println(len(r), r[0], r[99]) }", expect: "100 0 198", hidden: true },
  ],
  explain: L(
    "Start `workers` goroutines reading indexes from a channel, each writing its own out[i]; close the channel and wg.Wait. Clamp workers to at least 1.",
    "Lanza `workers` goroutines que leen índices de un canal y escriben su propio out[i]; cierra el canal y haz wg.Wait. Asegura workers ≥ 1.",
    "workers 個の goroutine がチャネルから添字を読み、それぞれ自分の out[i] に書く。チャネルを閉じて wg.Wait。workers は最低 1。",
  ),
};

export const mergeIntervalsTask: ExamQuestion = {
  slug: "merge-intervals",
  kind: "code",
  mode: "paper",
  topic: "slices",
  difficulty: 3,
  prompt: L("Written test: merge the intervals", "Prueba escrita: fusiona los intervalos", "筆記：区間をまとめる"),
  brief: L(
    "Write Merge(iv [][2]int) [][2]int. Each item is [start, end] with start <= end, in any order. Merge intervals that overlap or touch ([1 4] and [4 5] become [1 5]) and return them sorted by start. Don't modify the input slice. Empty input gives an empty slice. Example: [[1 3] [8 10] [2 6]] → [[1 6] [8 10]].",
    "Escribe Merge(iv [][2]int) [][2]int. Cada elemento es [inicio, fin] con inicio <= fin, en cualquier orden. Fusiona los intervalos que se solapan o se tocan ([1 4] y [4 5] dan [1 5]) y devuélvelos ordenados por inicio. No modifiques el slice de entrada. Una entrada vacía da un slice vacío. Ejemplo: [[1 3] [8 10] [2 6]] → [[1 6] [8 10]].",
    "Merge(iv [][2]int) [][2]int を書こう。各要素は [start, end]（start <= end）で順不同。重なる・接する区間をまとめ（[1 4] と [4 5] は [1 5]）、start 順で返す。入力スライスは変えないこと。空なら空スライス。例：[[1 3] [8 10] [2 6]] → [[1 6] [8 10]]。",
  ),
  starter: `package main

import "fmt"

func Merge(iv [][2]int) [][2]int {
\t// your code here
\treturn nil
}
`,
  solution: `package main

import (
\t"fmt"
\t"sort"
)

func Merge(iv [][2]int) [][2]int {
\ts := make([][2]int, len(iv))
\tcopy(s, iv)
\tsort.Slice(s, func(i, j int) bool { return s[i][0] < s[j][0] })
\tout := [][2]int{}
\tfor _, cur := range s {
\t\tn := len(out)
\t\tif n > 0 && cur[0] <= out[n-1][1] {
\t\t\tif cur[1] > out[n-1][1] {
\t\t\t\tout[n-1][1] = cur[1]
\t\t\t}
\t\t} else {
\t\t\tout = append(out, cur)
\t\t}
\t}
\treturn out
}
`,
  nearMiss: [
    // < instead of <=: touching intervals stay apart.
    `package main

import (
\t"fmt"
\t"sort"
)

func Merge(iv [][2]int) [][2]int {
\ts := make([][2]int, len(iv))
\tcopy(s, iv)
\tsort.Slice(s, func(i, j int) bool { return s[i][0] < s[j][0] })
\tout := [][2]int{}
\tfor _, cur := range s {
\t\tn := len(out)
\t\tif n > 0 && cur[0] < out[n-1][1] {
\t\t\tif cur[1] > out[n-1][1] {
\t\t\t\tout[n-1][1] = cur[1]
\t\t\t}
\t\t} else {
\t\t\tout = append(out, cur)
\t\t}
\t}
\treturn out
}
`,
    // Always takes the new end, so an interval inside another one shrinks it.
    `package main

import (
\t"fmt"
\t"sort"
)

func Merge(iv [][2]int) [][2]int {
\ts := make([][2]int, len(iv))
\tcopy(s, iv)
\tsort.Slice(s, func(i, j int) bool { return s[i][0] < s[j][0] })
\tout := [][2]int{}
\tfor _, cur := range s {
\t\tn := len(out)
\t\tif n > 0 && cur[0] <= out[n-1][1] {
\t\t\tout[n-1][1] = cur[1]
\t\t} else {
\t\t\tout = append(out, cur)
\t\t}
\t}
\treturn out
}
`,
    // Sorts the caller's slice in place.
    `package main

import (
\t"fmt"
\t"sort"
)

func Merge(iv [][2]int) [][2]int {
\tsort.Slice(iv, func(i, j int) bool { return iv[i][0] < iv[j][0] })
\tout := [][2]int{}
\tfor _, cur := range iv {
\t\tn := len(out)
\t\tif n > 0 && cur[0] <= out[n-1][1] {
\t\t\tif cur[1] > out[n-1][1] {
\t\t\t\tout[n-1][1] = cur[1]
\t\t\t}
\t\t} else {
\t\t\tout = append(out, cur)
\t\t}
\t}
\treturn out
}
`,
  ],
  tests: [
    { run: "fmt.Println(Merge([][2]int{{1, 3}, {8, 10}, {2, 6}}))", expect: "[[1 6] [8 10]]" },
    { run: "fmt.Println(Merge([][2]int{{1, 4}, {4, 5}}))", expect: "[[1 5]]" },
    { run: "fmt.Println(Merge(nil))", expect: "[]", hidden: true },
    { run: "fmt.Println(Merge([][2]int{{1, 10}, {2, 3}, {11, 12}}))", expect: "[[1 10] [11 12]]", hidden: true },
    { run: "fmt.Println(Merge([][2]int{{-5, -1}, {-3, 0}, {2, 2}}))", expect: "[[-5 0] [2 2]]", hidden: true },
    { run: "{ in := [][2]int{{5, 6}, {1, 2}}; Merge(in); fmt.Println(in) }", expect: "[[5 6] [1 2]]", hidden: true },
  ],
  explain: L(
    "Sort a copy by start, then extend the last merged interval while the next start is <= its end, keeping the larger end. Otherwise append.",
    "Ordena una copia por inicio y extiende el último intervalo mientras el siguiente inicio sea <= su fin, quedándote con el fin mayor. Si no, agrega.",
    "コピーを start で並べ、次の start が直前の end 以下なら大きいほうの end で伸ばす。そうでなければ追加する。",
  ),
};

export const pipelineTask: ExamQuestion = {
  slug: "pipeline",
  kind: "code",
  mode: "paper",
  topic: "channels",
  difficulty: 3,
  prompt: L("Written test: a channel pipeline", "Prueba escrita: un pipeline de canales", "筆記：チャネルのパイプライン"),
  brief: L(
    "Write two pipeline stages. Gen(nums ...int) <-chan int sends each number in order, then closes the channel. Square(in <-chan int) <-chan int sends the square of every value from in and closes its channel when in is closed. Each stage returns at once and does its work in its own goroutine, so stages can be chained: Square(Square(Gen(2))) yields 16.",
    "Escribe dos etapas de un pipeline. Gen(nums ...int) <-chan int envía cada número en orden y luego cierra el canal. Square(in <-chan int) <-chan int envía el cuadrado de cada valor de in y cierra su canal cuando in se cierra. Cada etapa retorna de inmediato y trabaja en su propia goroutine, así se pueden encadenar: Square(Square(Gen(2))) produce 16.",
    "パイプラインの2段を書こう。Gen(nums ...int) <-chan int は数を順に送ってからチャネルを閉じる。Square(in <-chan int) <-chan int は in の各値の2乗を送り、in が閉じたら自分のチャネルも閉じる。各段はすぐ返り、自分の goroutine で動くので連結できる：Square(Square(Gen(2))) は 16。",
  ),
  starter: `package main

import "fmt"

func Gen(nums ...int) <-chan int {
\t// your code here
\treturn nil
}

func Square(in <-chan int) <-chan int {
\t// your code here
\treturn nil
}
`,
  solution: `package main

import "fmt"

func Gen(nums ...int) <-chan int {
\tout := make(chan int)
\tgo func() {
\t\tfor _, n := range nums {
\t\t\tout <- n
\t\t}
\t\tclose(out)
\t}()
\treturn out
}

func Square(in <-chan int) <-chan int {
\tout := make(chan int)
\tgo func() {
\t\tfor n := range in {
\t\t\tout <- n * n
\t\t}
\t\tclose(out)
\t}()
\treturn out
}
`,
  nearMiss: [
    // Square never closes its channel: ranging over it deadlocks.
    `package main

import "fmt"

func Gen(nums ...int) <-chan int {
\tout := make(chan int)
\tgo func() {
\t\tfor _, n := range nums {
\t\t\tout <- n
\t\t}
\t\tclose(out)
\t}()
\treturn out
}

func Square(in <-chan int) <-chan int {
\tout := make(chan int)
\tgo func() {
\t\tfor n := range in {
\t\t\tout <- n * n
\t\t}
\t}()
\treturn out
}
`,
    // Gen sends before returning, with nobody receiving yet: deadlock.
    `package main

import "fmt"

func Gen(nums ...int) <-chan int {
\tout := make(chan int)
\tfor _, n := range nums {
\t\tout <- n
\t}
\tclose(out)
\treturn out
}

func Square(in <-chan int) <-chan int {
\tout := make(chan int)
\tgo func() {
\t\tfor n := range in {
\t\t\tout <- n * n
\t\t}
\t\tclose(out)
\t}()
\treturn out
}
`,
  ],
  tests: [
    { run: "fmt.Println(func() (s []int) { for v := range Square(Gen(1, 2, 3)) { s = append(s, v) }; return }())", expect: "[1 4 9]" },
    { run: "{ n := 0; for range Gen(4, 5, 6, 7) { n++ }; fmt.Println(n) }", expect: "4" },
    { run: "fmt.Println(func() (s []int) { for v := range Square(Square(Gen(2, -3))) { s = append(s, v) }; return }())", expect: "[16 81]", hidden: true },
    { run: "{ n := 0; for range Square(Gen()) { n++ }; fmt.Println(n) }", expect: "0", hidden: true },
    { run: "{ c := Gen(7); <-c; _, ok := <-c; fmt.Println(ok) }", expect: "false", hidden: true },
  ],
  explain: L(
    "Each stage makes a channel, starts a goroutine that sends and then closes it, and returns the channel right away. The sender always closes.",
    "Cada etapa crea un canal, lanza una goroutine que envía y luego lo cierra, y devuelve el canal enseguida. Quien envía es quien cierra.",
    "各段はチャネルを作り、送信して最後に閉じる goroutine を起動し、すぐチャネルを返す。閉じるのは常に送信側。",
  ),
};

export const parseKVTask: ExamQuestion = {
  slug: "parse-k-v",
  kind: "code",
  mode: "paper",
  topic: "errors",
  difficulty: 2,
  prompt: L("Written test: parse a config string", "Prueba escrita: lee un string de configuración", "筆記：設定文字列を読む"),
  brief: L(
    'Write ParseKV(s string) (map[string]string, error) for strings like "host=db;port=5432". Pairs are split by ";"; key and value by the FIRST "=" (so "q=a=b" gives q → "a=b"). Trim spaces around keys and values. Skip empty or blank segments. A segment without "=" or with an empty key is an error: return nil and the error. Empty input gives an empty map.',
    'Escribe ParseKV(s string) (map[string]string, error) para strings como "host=db;port=5432". Los pares se separan con ";"; clave y valor con el PRIMER "=" (así "q=a=b" da q → "a=b"). Recorta espacios en claves y valores. Salta segmentos vacíos o en blanco. Un segmento sin "=" o con clave vacía es un error: devuelve nil y el error. Una entrada vacía da un map vacío.',
    'ParseKV(s string) (map[string]string, error) を書こう。入力は "host=db;port=5432" の形。ペアは ";" で、キーと値は「最初の」"=" で分ける（"q=a=b" は q → "a=b"）。前後の空白は削る。空や空白だけの区切りは飛ばす。"=" がない、またはキーが空なら nil と error。空入力は空の map。',
  ),
  starter: `package main

import "fmt"

func ParseKV(s string) (map[string]string, error) {
\t// your code here
\treturn nil, nil
}
`,
  solution: `package main

import (
\t"fmt"
\t"strings"
)

func ParseKV(s string) (map[string]string, error) {
\tout := map[string]string{}
\tfor _, part := range strings.Split(s, ";") {
\t\tif strings.TrimSpace(part) == "" {
\t\t\tcontinue
\t\t}
\t\tk, v, ok := strings.Cut(part, "=")
\t\tk = strings.TrimSpace(k)
\t\tif !ok || k == "" {
\t\t\treturn nil, fmt.Errorf("bad pair %q", part)
\t\t}
\t\tout[k] = strings.TrimSpace(v)
\t}
\treturn out, nil
}
`,
  nearMiss: [
    // Splitting on every "=" rejects values that contain one.
    `package main

import (
\t"fmt"
\t"strings"
)

func ParseKV(s string) (map[string]string, error) {
\tout := map[string]string{}
\tfor _, part := range strings.Split(s, ";") {
\t\tif strings.TrimSpace(part) == "" {
\t\t\tcontinue
\t\t}
\t\tkv := strings.Split(part, "=")
\t\tif len(kv) != 2 || strings.TrimSpace(kv[0]) == "" {
\t\t\treturn nil, fmt.Errorf("bad pair %q", part)
\t\t}
\t\tout[strings.TrimSpace(kv[0])] = strings.TrimSpace(kv[1])
\t}
\treturn out, nil
}
`,
    // Doesn't skip empty segments, so "" and a trailing ";" are errors.
    `package main

import (
\t"fmt"
\t"strings"
)

func ParseKV(s string) (map[string]string, error) {
\tout := map[string]string{}
\tfor _, part := range strings.Split(s, ";") {
\t\tk, v, ok := strings.Cut(part, "=")
\t\tk = strings.TrimSpace(k)
\t\tif !ok || k == "" {
\t\t\treturn nil, fmt.Errorf("bad pair %q", part)
\t\t}
\t\tout[k] = strings.TrimSpace(v)
\t}
\treturn out, nil
}
`,
    // Returns the half-filled map together with the error.
    `package main

import (
\t"fmt"
\t"strings"
)

func ParseKV(s string) (map[string]string, error) {
\tout := map[string]string{}
\tfor _, part := range strings.Split(s, ";") {
\t\tif strings.TrimSpace(part) == "" {
\t\t\tcontinue
\t\t}
\t\tk, v, ok := strings.Cut(part, "=")
\t\tk = strings.TrimSpace(k)
\t\tif !ok || k == "" {
\t\t\treturn out, fmt.Errorf("bad pair %q", part)
\t\t}
\t\tout[k] = strings.TrimSpace(v)
\t}
\treturn out, nil
}
`,
  ],
  tests: [
    { run: 'fmt.Println(ParseKV("host=db;port=5432"))', expect: "map[host:db port:5432] <nil>" },
    { run: '{ m, err := ParseKV("a=1;oops"); fmt.Println(m == nil, err != nil) }', expect: "true true" },
    { run: 'fmt.Println(ParseKV(" name = gopher ; ;"))', expect: "map[name:gopher] <nil>", hidden: true },
    { run: 'fmt.Println(ParseKV("q=a=b"))', expect: "map[q:a=b] <nil>", hidden: true },
    { run: 'fmt.Println(ParseKV(""))', expect: "map[] <nil>", hidden: true },
    { run: '{ _, err := ParseKV("=x"); fmt.Println(err != nil) }', expect: "true", hidden: true },
  ],
  explain: L(
    "Split on \";\", skip blank parts, cut each at the first \"=\" (strings.Cut) and trim. On a bad part return nil, err: never a half-filled map.",
    "Corta por \";\", salta partes en blanco, separa cada una en el primer \"=\" (strings.Cut) y recorta. Ante una parte mala devuelve nil, err: nunca un map a medias.",
    "\";\" で分け、空白だけの部分は飛ばし、最初の \"=\" で切って（strings.Cut）空白を削る。不正なら nil, err。作りかけの map は返さない。",
  ),
};

// ─── REGION BOSSES (mini projects, normal editor) ───────────────────────────

/** Gopher Village boss: strings, loops and functions. */
export const runLengthTask: CodeTaskBeat = {
  slug: "run-length",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: squeeze the scroll", "Mini proyecto: comprime el pergamino", "ミニ課題：巻物を縮める"),
  brief: L(
    'The village scribe writes long runs of the same letter. Write Encode(s string) string: replace each run of equal letters with the letter followed by the run\'s length. s holds only lowercase a-z letters. An empty string gives "". Examples: "aaabcc" → "a3b1c2"; "z" → "z1".',
    'El escriba del pueblo escribe largas rachas de la misma letra. Escribe Encode(s string) string: cambia cada racha de letras iguales por la letra seguida del largo de la racha. s solo tiene letras minúsculas a-z. Un string vacío da "". Ejemplos: "aaabcc" → "a3b1c2"; "z" → "z1".',
    '村の書記は同じ文字をずらりと書く。Encode(s string) string を書こう。同じ文字の連続を「その文字＋連続の長さ」に置きかえる。s は小文字 a-z のみ。空なら ""。例："aaabcc" → "a3b1c2"、"z" → "z1"。',
  ),
  hint: L(
    "Count how long each run of equal bytes lasts. The run at the very end of the string needs writing out too.",
    "Cuenta cuánto dura cada racha de bytes iguales. La racha del final del string también hay que escribirla.",
    "同じバイトの連続がどれだけ続くか数えよう。文字列の最後の連続も書き出すこと。",
  ),
  note: "recap-strings",
  starter: `package main

import "fmt"

func Encode(s string) string {
\t// your code here
\treturn ""
}
`,
  solution: `package main

import "fmt"

func Encode(s string) string {
\tout := ""
\tfor i := 0; i < len(s); {
\t\tj := i
\t\tfor j < len(s) && s[j] == s[i] {
\t\t\tj++
\t\t}
\t\tout += fmt.Sprintf("%c%d", s[i], j-i)
\t\ti = j
\t}
\treturn out
}
`,
  nearMiss: [
    // Writes a run only when the letter changes, so the last run is lost.
    `package main

import "fmt"

func Encode(s string) string {
\tout := ""
\tcount := 1
\tfor i := 1; i < len(s); i++ {
\t\tif s[i] == s[i-1] {
\t\t\tcount++
\t\t} else {
\t\t\tout += fmt.Sprintf("%c%d", s[i-1], count)
\t\t\tcount = 1
\t\t}
\t}
\treturn out
}
`,
    // Flushes the last run but forgets the empty string: s[len(s)-1] panics.
    `package main

import "fmt"

func Encode(s string) string {
\tout := ""
\tcount := 1
\tfor i := 1; i < len(s); i++ {
\t\tif s[i] == s[i-1] {
\t\t\tcount++
\t\t} else {
\t\t\tout += fmt.Sprintf("%c%d", s[i-1], count)
\t\t\tcount = 1
\t\t}
\t}
\treturn out + fmt.Sprintf("%c%d", s[len(s)-1], count)
}
`,
  ],
  tests: [
    { run: 'fmt.Printf("%q\\n", Encode("aaabcc"))', expect: '"a3b1c2"' },
    { run: 'fmt.Printf("%q\\n", Encode("z"))', expect: '"z1"' },
    { run: 'fmt.Printf("%q\\n", Encode(""))', expect: '""', hidden: true },
    { run: 'fmt.Printf("%q\\n", Encode("abab"))', expect: '"a1b1a1b1"', hidden: true },
    { run: 'fmt.Printf("%q\\n", Encode("bbbbbbbbbbbb"))', expect: '"b12"', hidden: true },
  ],
  explain: L(
    "For each position, move j forward while the byte repeats, write the letter and j-i, then jump to j. That also covers the last run and the empty string.",
    "En cada posición avanza j mientras el byte se repita, escribe la letra y j-i, y salta a j. Eso cubre también la última racha y el string vacío.",
    "各位置で同じバイトが続く間 j を進め、文字と j-i を書いて j へ飛ぶ。最後の連続も空文字列もこれで扱える。",
  ),
};

/** Slice Forest boss: maps, structs, slices and not touching the caller's data. */
export const mergeStockTask: CodeTaskBeat = {
  slug: "merge-stock",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: merge two stock lists", "Mini proyecto: fusiona dos inventarios", "ミニ課題：2つの在庫表をまとめる"),
  brief: L(
    "Two camps keep stock lists of Item{Name, Qty}. Write MergeStock(a, b []Item) []Item: a NEW slice with one Item per name, its Qty summed over a and b (a name can repeat inside a list too), sorted by Name. Don't modify a or b: the Hydra watches shared backing arrays! Empty input gives an empty slice.",
    "Dos campamentos llevan listas de Item{Name, Qty}. Escribe MergeStock(a, b []Item) []Item: un slice NUEVO con un Item por nombre, su Qty sumada entre a y b (un nombre puede repetirse dentro de una lista), ordenado por Name. No modifiques a ni b: ¡la Hidra vigila los arrays compartidos! Una entrada vacía da un slice vacío.",
    "2つの野営地が Item{Name, Qty} の在庫表を持つ。MergeStock(a, b []Item) []Item を書こう。名前ごとに1つの Item で、Qty は a と b の合計（同じ表の中で名前が重なることも）、Name 順の「新しい」スライスを返す。a も b も変えないこと。ヒドラは共有された配列を見張っている！空なら空スライス。",
  ),
  hint: L(
    "Sum the quantities in a map keyed by name, build a fresh slice from it, then sort that slice by Name.",
    "Suma las cantidades en un map con el nombre como clave, arma un slice nuevo con él y ordénalo por Name.",
    "名前をキーにした map で個数を足し、そこから新しいスライスを作って Name 順に並べよう。",
  ),
  note: "recap-maps",
  starter: `package main

import "fmt"

type Item struct {
\tName string
\tQty  int
}

func MergeStock(a, b []Item) []Item {
\t// your code here
\treturn nil
}
`,
  solution: `package main

import (
\t"fmt"
\t"sort"
)

type Item struct {
\tName string
\tQty  int
}

func MergeStock(a, b []Item) []Item {
\ttotals := map[string]int{}
\tfor _, it := range append(append([]Item{}, a...), b...) {
\t\ttotals[it.Name] += it.Qty
\t}
\tout := []Item{}
\tfor name, qty := range totals {
\t\tout = append(out, Item{name, qty})
\t}
\tsort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
\treturn out
}
`,
  nearMiss: [
    // Works on a's backing array: it changes the caller's quantities and order.
    `package main

import (
\t"fmt"
\t"sort"
)

type Item struct {
\tName string
\tQty  int
}

func MergeStock(a, b []Item) []Item {
\tout := a
\tfor _, it := range b {
\t\tfound := false
\t\tfor i := range out {
\t\t\tif out[i].Name == it.Name {
\t\t\t\tout[i].Qty += it.Qty
\t\t\t\tfound = true
\t\t\t}
\t\t}
\t\tif !found {
\t\t\tout = append(out, it)
\t\t}
\t}
\tsort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
\treturn out
}
`,
    // Copies a first (good) but never sorts and never merges repeats inside a.
    `package main

import "fmt"

type Item struct {
\tName string
\tQty  int
}

func MergeStock(a, b []Item) []Item {
\tout := make([]Item, len(a))
\tcopy(out, a)
\tfor _, it := range b {
\t\tfound := false
\t\tfor i := range out {
\t\t\tif out[i].Name == it.Name {
\t\t\t\tout[i].Qty += it.Qty
\t\t\t\tfound = true
\t\t\t}
\t\t}
\t\tif !found {
\t\t\tout = append(out, it)
\t\t}
\t}
\treturn out
}
`,
  ],
  tests: [
    { run: 'fmt.Println(MergeStock([]Item{{"rope", 1}, {"gem", 2}}, []Item{{"gem", 3}, {"axe", 1}}))', expect: "[{axe 1} {gem 5} {rope 1}]" },
    { run: "fmt.Println(MergeStock(nil, nil))", expect: "[]" },
    { run: '{ a := []Item{{"gem", 2}}; MergeStock(a, []Item{{"gem", 1}}); fmt.Println(a) }', expect: "[{gem 2}]", hidden: true },
    { run: 'fmt.Println(MergeStock([]Item{{"gem", 1}, {"gem", 2}}, nil))', expect: "[{gem 3}]", hidden: true },
    { run: 'fmt.Println(MergeStock(nil, []Item{{"orb", 0}, {"bow", 4}}))', expect: "[{bow 4} {orb 0}]", hidden: true },
  ],
  explain: L(
    "Sum into a map, build a brand-new slice, and sort it by Name. out := a shares a's backing array, so writing to out[i] changes the caller's list.",
    "Suma en un map, arma un slice totalmente nuevo y ordénalo por Name. out := a comparte el array de a, así que escribir en out[i] cambia la lista original.",
    "map で合計し、まったく新しいスライスを作って Name 順に。out := a は a の配列を共有するので、out[i] への書きこみは元の表を変える。",
  ),
};

/** Interface Castle boss: implicit interfaces, method sets and sentinel errors. */
export const largestShapeTask: CodeTaskBeat = {
  slug: "largest-shape",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the largest shield", "Mini proyecto: el escudo más grande", "ミニ課題：いちばん大きい盾"),
  brief: L(
    "Give Rect (W×H) and Square (Side×Side) an Area() float64 method so both satisfy Shape when stored as plain values. Then write Largest(shapes []Shape) (Shape, error): the shape with the biggest area; on a tie, the first one. With no shapes, return nil and ErrNoShapes. Example: [Rect{2 3} Square{2}] → {2 3} <nil>.",
    "Dale a Rect (W×H) y Square (Side×Side) un método Area() float64 para que ambos cumplan Shape guardados como valores. Luego escribe Largest(shapes []Shape) (Shape, error): la figura de mayor área; si hay empate, la primera. Sin figuras, devuelve nil y ErrNoShapes. Ejemplo: [Rect{2 3} Square{2}] → {2 3} <nil>.",
    "Rect（W×H）と Square（Side×Side）に Area() float64 を付け、値のままで Shape を満たすようにしよう。次に Largest(shapes []Shape) (Shape, error)：面積が最大の図形を返す。同じなら先のもの。空なら nil と ErrNoShapes。例：[Rect{2 3} Square{2}] → {2 3} <nil>。",
  ),
  hint: L(
    "A value stored in a Shape only has its value-receiver methods. For Largest, check the empty case before anything else.",
    "Un valor en un Shape solo tiene sus métodos con receptor de valor. En Largest, revisa primero el caso vacío.",
    "Shape に入れた「値」が持つのは値レシーバのメソッドだけ。Largest では最初に空の場合を調べよう。",
  ),
  note: "recap-interfaces",
  starter: `package main

import (
\t"errors"
\t"fmt"
)

type Shape interface {
\tArea() float64
}

type Rect struct{ W, H float64 }

type Square struct{ Side float64 }

var ErrNoShapes = errors.New("no shapes")

// Add the Area methods here.

func Largest(shapes []Shape) (Shape, error) {
\t// your code here
\treturn nil, nil
}
`,
  solution: `package main

import (
\t"errors"
\t"fmt"
)

type Shape interface {
\tArea() float64
}

type Rect struct{ W, H float64 }

type Square struct{ Side float64 }

var ErrNoShapes = errors.New("no shapes")

func (r Rect) Area() float64   { return r.W * r.H }
func (s Square) Area() float64 { return s.Side * s.Side }

func Largest(shapes []Shape) (Shape, error) {
\tif len(shapes) == 0 {
\t\treturn nil, ErrNoShapes
\t}
\tbest := shapes[0]
\tfor _, s := range shapes[1:] {
\t\tif s.Area() > best.Area() {
\t\t\tbest = s
\t\t}
\t}
\treturn best, nil
}
`,
  nearMiss: [
    // >= hands a tie to the later shape.
    `package main

import (
\t"errors"
\t"fmt"
)

type Shape interface {
\tArea() float64
}

type Rect struct{ W, H float64 }

type Square struct{ Side float64 }

var ErrNoShapes = errors.New("no shapes")

func (r Rect) Area() float64   { return r.W * r.H }
func (s Square) Area() float64 { return s.Side * s.Side }

func Largest(shapes []Shape) (Shape, error) {
\tif len(shapes) == 0 {
\t\treturn nil, ErrNoShapes
\t}
\tbest := shapes[0]
\tfor _, s := range shapes[1:] {
\t\tif s.Area() >= best.Area() {
\t\t\tbest = s
\t\t}
\t}
\treturn best, nil
}
`,
    // Pointer receivers: a plain Rect value no longer satisfies Shape (compile error).
    `package main

import (
\t"errors"
\t"fmt"
)

type Shape interface {
\tArea() float64
}

type Rect struct{ W, H float64 }

type Square struct{ Side float64 }

var ErrNoShapes = errors.New("no shapes")

func (r *Rect) Area() float64   { return r.W * r.H }
func (s *Square) Area() float64 { return s.Side * s.Side }

func Largest(shapes []Shape) (Shape, error) {
\tif len(shapes) == 0 {
\t\treturn nil, ErrNoShapes
\t}
\tbest := shapes[0]
\tfor _, s := range shapes[1:] {
\t\tif s.Area() > best.Area() {
\t\t\tbest = s
\t\t}
\t}
\treturn best, nil
}
`,
    // An empty list returns nil, nil instead of the sentinel error.
    `package main

import (
\t"errors"
\t"fmt"
)

type Shape interface {
\tArea() float64
}

type Rect struct{ W, H float64 }

type Square struct{ Side float64 }

var ErrNoShapes = errors.New("no shapes")

func (r Rect) Area() float64   { return r.W * r.H }
func (s Square) Area() float64 { return s.Side * s.Side }

func Largest(shapes []Shape) (Shape, error) {
\tvar best Shape
\tfor _, s := range shapes {
\t\tif best == nil || s.Area() > best.Area() {
\t\t\tbest = s
\t\t}
\t}
\treturn best, nil
}
`,
  ],
  tests: [
    { run: "fmt.Println(Largest([]Shape{Rect{2, 3}, Square{2}}))", expect: "{2 3} <nil>" },
    { run: "fmt.Println(Largest(nil))", expect: "<nil> no shapes" },
    { run: "fmt.Println(Largest([]Shape{Square{3}, Rect{1, 9}}))", expect: "{3} <nil>", hidden: true },
    { run: "fmt.Println(Square{1.5}.Area(), Rect{0.5, 4}.Area())", expect: "2.25 2", hidden: true },
    { run: "{ _, err := Largest([]Shape{}); fmt.Println(errors.Is(err, ErrNoShapes)) }", expect: "true", hidden: true },
    { run: "fmt.Println(Largest([]Shape{Rect{1, 1}, Rect{2, 1}, Square{1}}))", expect: "{2 1} <nil>", hidden: true },
  ],
  explain: L(
    "Value receivers let Rect{} and Square{} satisfy Shape. Return ErrNoShapes for an empty list, and use a strict > so the first of a tie wins.",
    "Los receptores de valor hacen que Rect{} y Square{} cumplan Shape. Devuelve ErrNoShapes con la lista vacía y usa > estricto para que gane el primero del empate.",
    "値レシーバなら Rect{} と Square{} が Shape を満たす。空なら ErrNoShapes を返し、厳密な > で同点は先のものを残す。",
  ),
};

/** Channel Tower boss: a worker pool whose results are collected and then sorted (deterministic). */
export const squareAllTask: CodeTaskBeat = {
  slug: "square-all",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: the tunnel worker pool", "Mini proyecto: el pool de trabajadores", "ミニ課題：トンネルのワーカープール"),
  brief: L(
    "Write SquareAll(nums []int, workers int) []int with a worker pool: start `workers` goroutines (at least 1) that read numbers from a jobs channel and send their squares on a results channel. Collect every result and return them sorted ascending (workers finish in any order). Empty input gives an empty slice. Example: [3 1 2], 2 → [1 4 9].",
    "Escribe SquareAll(nums []int, workers int) []int con un pool: lanza `workers` goroutines (al menos 1) que leen números de un canal jobs y envían sus cuadrados por un canal results. Junta todos los resultados y devuélvelos ordenados de menor a mayor (los workers terminan en cualquier orden). Una entrada vacía da un slice vacío. Ejemplo: [3 1 2], 2 → [1 4 9].",
    "ワーカープールで SquareAll(nums []int, workers int) []int を書こう。workers 個（最低1）の goroutine が jobs チャネルから数を読み、2乗を results チャネルに送る。結果を全部集めて昇順で返す（終わる順はばらばら）。空なら空スライス。例：[3 1 2], 2 → [1 4 9]。",
  ),
  hint: L(
    "Someone must close jobs so the workers' range loops end. Feed jobs from its own goroutine while you read results.",
    "Alguien debe cerrar jobs para que terminen los workers. Llena jobs desde otra goroutine mientras lees results.",
    "worker を終わらせるには jobs を閉じる必要がある。results を読む間、jobs は別の goroutine から送ろう。",
  ),
  note: "recap-channels",
  starter: `package main

import "fmt"

func SquareAll(nums []int, workers int) []int {
\t// your code here
\treturn nil
}
`,
  solution: `package main

import (
\t"fmt"
\t"sort"
\t"sync"
)

func SquareAll(nums []int, workers int) []int {
\tif workers < 1 {
\t\tworkers = 1
\t}
\tjobs := make(chan int)
\tresults := make(chan int)
\tvar wg sync.WaitGroup
\tfor w := 0; w < workers; w++ {
\t\twg.Add(1)
\t\tgo func() {
\t\t\tdefer wg.Done()
\t\t\tfor n := range jobs {
\t\t\t\tresults <- n * n
\t\t\t}
\t\t}()
\t}
\tgo func() {
\t\tfor _, n := range nums {
\t\t\tjobs <- n
\t\t}
\t\tclose(jobs)
\t\twg.Wait()
\t\tclose(results)
\t}()
\tout := []int{}
\tfor r := range results {
\t\tout = append(out, r)
\t}
\tsort.Ints(out)
\treturn out
}
`,
  nearMiss: [
    // jobs is never closed: the workers wait forever, so results never closes (deadlock).
    `package main

import (
\t"fmt"
\t"sort"
\t"sync"
)

func SquareAll(nums []int, workers int) []int {
\tif workers < 1 {
\t\tworkers = 1
\t}
\tjobs := make(chan int)
\tresults := make(chan int)
\tvar wg sync.WaitGroup
\tfor w := 0; w < workers; w++ {
\t\twg.Add(1)
\t\tgo func() {
\t\t\tdefer wg.Done()
\t\t\tfor n := range jobs {
\t\t\t\tresults <- n * n
\t\t\t}
\t\t}()
\t}
\tgo func() {
\t\tfor _, n := range nums {
\t\t\tjobs <- n
\t\t}
\t\twg.Wait()
\t\tclose(results)
\t}()
\tout := []int{}
\tfor r := range results {
\t\tout = append(out, r)
\t}
\tsort.Ints(out)
\treturn out
}
`,
    // workers = 0 starts nobody to read jobs: deadlock.
    `package main

import (
\t"fmt"
\t"sort"
\t"sync"
)

func SquareAll(nums []int, workers int) []int {
\tjobs := make(chan int)
\tresults := make(chan int)
\tvar wg sync.WaitGroup
\tfor w := 0; w < workers; w++ {
\t\twg.Add(1)
\t\tgo func() {
\t\t\tdefer wg.Done()
\t\t\tfor n := range jobs {
\t\t\t\tresults <- n * n
\t\t\t}
\t\t}()
\t}
\tgo func() {
\t\tfor _, n := range nums {
\t\t\tjobs <- n
\t\t}
\t\tclose(jobs)
\t\twg.Wait()
\t\tclose(results)
\t}()
\tout := []int{}
\tfor r := range results {
\t\tout = append(out, r)
\t}
\tsort.Ints(out)
\treturn out
}
`,
  ],
  tests: [
    { run: "fmt.Println(SquareAll([]int{3, 1, 2}, 2))", expect: "[1 4 9]" },
    { run: "fmt.Println(SquareAll([]int{}, 3))", expect: "[]" },
    { run: "fmt.Println(SquareAll([]int{-4, 4, 0}, 1))", expect: "[0 16 16]", hidden: true },
    { run: "fmt.Println(SquareAll([]int{5, 6}, 0))", expect: "[25 36]", hidden: true },
    { run: "{ xs := make([]int, 50); for i := range xs { xs[i] = 50 - i }; r := SquareAll(xs, 8); fmt.Println(len(r), r[0], r[49]) }", expect: "50 1 2500", hidden: true },
  ],
  explain: L(
    "Workers range over jobs; a feeder goroutine sends, closes jobs, waits for the workers and closes results. Read results until closed, then sort.",
    "Los workers recorren jobs; una goroutine envía, cierra jobs, espera a los workers y cierra results. Lee results hasta que cierre y ordena.",
    "worker は jobs を range。送り手の goroutine が送信→jobs を閉じる→worker を待つ→results を閉じる。閉じるまで読んで並べる。",
  ),
};
