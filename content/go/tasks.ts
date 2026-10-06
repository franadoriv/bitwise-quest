import type { ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Coding tasks for planet Concurra (Go). The tests run on the Go Playground through /api/run, which
// appends them on the server: hidden tests never reach the player's browser.

/** Mid screening: slices and maps, in a normal editor. */
export const dedupeTask: ExamQuestion = {
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
