import type { Beat, LessonDef, NoteBlock, NoteDef, RegionDef, Text } from "../../../lib/content/types.ts";
import { L } from "../../../lib/i18n/text.ts";

// REGION 4 · CHANNEL TOWER  (goroutines and WaitGroup, channels, select and context, mutexes and races)
// Never quiz outputs that depend on scheduling: races, map order or "main exits before the goroutine"
// are conceptual questions without a check.

const say = (text: Text): Beat => ({ kind: "dialog", speaker: "master", text });
const enemySays = (text: Text): Beat => ({ kind: "dialog", speaker: "enemy", text });

/** Go code written indented in this file: keeps `\n` inside Go strings and strips the common indent. */
function go(s: TemplateStringsArray, ...v: unknown[]): string {
  const lines = String.raw(s, ...v).replace(/^\n/, "").replace(/\n[ \t]*$/, "").split("\n");
  const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  return lines.map((l) => l.slice(ind)).join("\n");
}

// Guidebook notes: long explanations players can reopen from any question (📖).
// Examples use names and values different from the questions so they never give an answer away,
// and only print output that never depends on scheduling.
const note = (id: string, title: Text, ...blocks: NoteBlock[]): NoteDef => ({ id, title, blocks });
const p = (en: string, es: string, ja: string): NoteBlock => ({ t: "p", text: L(en, es, ja) });
/** A runnable example; the validator checks `output` against the real compiler. */
const ex = (code: string, output: string, caption?: Text): NoteBlock => ({ t: "code", code, output, caption });
/** An example that must NOT compile (verified too). */
const bad = (code: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { compiles: false } });
/** An example that compiles and then crashes at runtime with this text (verified too). */
const crash = (code: string, throws: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { compiles: true, throws } });

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const NO_CE = L("No: compile error", "No: error de compilación", "いいえ：コンパイルエラー");
const DEADLOCK = L("Deadlock: fatal error", "Deadlock: error fatal", "デッドロックで停止");
const PANICS = L("It panics", "Hace panic", "panic する");
const DEADLOCK_FX = [{ t: "shake" } as const, { t: "banner", text: L("DEADLOCK!", "¡DEADLOCK!", "デッドロック！") } as const];

// ─── 4.1 Allies that work in parallel: goroutines and WaitGroup ────────────
const goroutineNotes: NoteDef[] = [
  note("goroutines-wait", L("Goroutines and waiting for them", "Goroutines y cómo esperarlas", "goroutine とその待ち方"),
    p(
      "Writing go before a function call starts that call in a new goroutine: a lightweight thread managed by Go. The line returns at once and the caller keeps running, side by side with the new goroutine. You can start thousands of them cheaply.",
      "Escribir go antes de una llamada la inicia en una goroutine nueva: un hilo ligero que maneja Go. La línea vuelve enseguida y quien llama sigue corriendo, al lado de la goroutine nueva. Puedes lanzar miles de ellas sin gran costo.",
      "関数呼び出しの前に go と書くと、その呼び出しが新しい goroutine（Go が管理する軽いスレッド）で始まる。その行はすぐ戻り、呼んだ側は新しい goroutine と並んで進み続ける。何千個も気軽に作れる。",
    ),
    p(
      "The catch: when main returns, the whole program ends, and every goroutine still working is stopped mid-way. Nothing makes main wait by itself, and the order in which goroutines run is not guaranteed. An output that depends on luck is a bug, even if it looks right on your machine.",
      "La trampa: cuando main termina, todo el programa acaba, y cada goroutine que seguía trabajando se detiene a medias. Nada hace esperar a main por sí solo, y el orden en que corren las goroutines no está garantizado. Una salida que depende de la suerte es un bug, aunque en tu máquina parezca bien.",
      "落とし穴：main が戻るとプログラム全体が終わり、働き中の goroutine は途中で止められる。main を自動で待たせるものはなく、goroutine の実行順も保証されない。運しだいの出力はバグ。自分の環境で正しく見えてもね。",
    ),
    p(
      "sync.WaitGroup is a counter for waiting: call Add(1) BEFORE each go, have each goroutine call Done() when it finishes (usually with defer), and call Wait() to block until the counter is back to 0. Only read the goroutines' results after Wait.",
      "sync.WaitGroup es un contador para esperar: llama a Add(1) ANTES de cada go, haz que cada goroutine llame a Done() al terminar (normalmente con defer) y llama a Wait() para bloquear hasta que el contador vuelva a 0. Lee los resultados de las goroutines solo después de Wait.",
      "sync.WaitGroup は待つためのカウンター。go の前に Add(1)、各 goroutine は終わったら Done()（ふつうは defer で）、Wait() でカウンターが 0 に戻るまで止まる。goroutine の結果を読むのは Wait のあとだけ。",
    ),
    ex(go`
      var wg sync.WaitGroup
      words := make([]string, 2)
      for i := range words {
        wg.Add(1)
        go func() { defer wg.Done(); words[i] = strings.Repeat("o", i+1) }()
      }
      wg.Wait()
      fmt.Println(words)`, "[o oo]",
      L("Each goroutine fills its own slot; main reads after Wait", "Cada goroutine llena su casilla; main lee tras Wait", "各 goroutine が自分の場所を埋め、main は Wait のあとに読む")),
    p(
      "Since Go 1.25, wg.Go(f) does Add(1), go and Done for you, so you can't forget one of them. Common mistake: calling Add inside the goroutine. Wait might run before that Add happens and return too early.",
      "Desde Go 1.25, wg.Go(f) hace Add(1), go y Done por ti, así que no puedes olvidar ninguno. Error común: llamar a Add dentro de la goroutine. Wait podría correr antes de ese Add y volver demasiado pronto.",
      "Go 1.25 からは wg.Go(f) が Add(1)・go・Done をまとめてやるので、どれかを忘れることがない。よくあるミス：goroutine の中で Add を呼ぶこと。その Add より先に Wait が動き、早く戻ってしまうかもしれない。",
    ),
    ex(go`
      var wg sync.WaitGroup
      names := []string{"ant", "bee", "wasp"}
      lens := make([]int, len(names))
      for i, n := range names {
        wg.Go(func() { lens[i] = len(n) })
      }
      wg.Wait()
      fmt.Println(lens)`, "[3 3 4]",
      L("wg.Go counts each goroutine for you", "wg.Go cuenta cada goroutine por ti", "wg.Go が goroutine を数えてくれる")),
  ),
  note("loop-vars", L("Loop variables and defer order", "Variables de bucle y orden de defer", "ループ変数と defer の順番"),
    p(
      "Since Go 1.22, every iteration of a for loop gets a brand new copy of the loop variable. A closure or a pointer created in one iteration keeps seeing that iteration's value, even if it runs later, after the loop has moved on.",
      "Desde Go 1.22, cada vuelta de un bucle for recibe una copia nueva de la variable del bucle. Un closure o un puntero creado en una vuelta sigue viendo el valor de esa vuelta, aunque corra después, cuando el bucle ya avanzó.",
      "Go 1.22 から、for ループは1回ごとにループ変数の新しいコピーを作る。ある回で作ったクロージャやポインタは、あとで動いてもその回の値を見続ける。",
    ),
    ex(go`
      var show []func()
      for _, w := range []string{"red", "blue"} {
        show = append(show, func() { fmt.Println(w) })
      }
      for _, f := range show {
        f()
      }`, "red\nblue",
      L("Each closure remembers its own w", "Cada closure recuerda su propio w", "各クロージャが自分の w を覚えている")),
    p(
      "Before Go 1.22, the whole loop shared ONE variable. Closures that ran after the loop all saw its final value: the value that made the loop stop. Old code fixed this with a line like n := n inside the loop. You will still meet that line in older projects.",
      "Antes de Go 1.22, todo el bucle compartía UNA variable. Los closures que corrían tras el bucle veían su valor final: el valor que hizo parar el bucle. El código viejo lo arreglaba con una línea como n := n dentro del bucle. Aún verás esa línea en proyectos antiguos.",
      "Go 1.22 より前は、ループ全体で変数が1つだけだった。ループのあとで動くクロージャはみな最後の値（ループを止めた値）を見た。昔は n := n という行で直していた。古いプロジェクトでは今も見かける。",
    ),
    p(
      "defer schedules a call to run when the surrounding function returns. Several defers run in reverse order: last in, first out, like a stack of plates. The arguments of a deferred call are evaluated right away, at the defer line.",
      "defer programa una llamada para cuando la función que la rodea termine. Varios defer corren en orden inverso: el último en entrar sale primero, como una pila de platos. Los argumentos de una llamada diferida se evalúan enseguida, en la línea del defer.",
      "defer は、囲んでいる関数が戻るときに呼び出しを実行するよう予約する。複数の defer は逆順に動く。皿の山のように、最後に積んだものが最初。defer した呼び出しの引数は、その行ですぐに評価される。",
    ),
    ex(go`
      for _, c := range []string{"x", "y", "z"} {
        defer fmt.Print(c)
      }
      fmt.Print("go ")`, "go zyx",
      L("Defers wait until the end, then run newest first", "Los defer esperan al final y corren del más nuevo al más viejo", "defer は最後まで待ち、新しいものから動く")),
    p(
      "Common mistakes: expecting defers to run in the order you wrote them, or applying the old shared-variable rule to modern Go. Ask two questions: which variable does this closure see, and when does it actually run?",
      "Errores comunes: esperar que los defer corran en el orden en que los escribiste, o aplicar la vieja regla de la variable compartida al Go moderno. Hazte dos preguntas: ¿qué variable ve este closure, y cuándo corre de verdad?",
      "よくあるミス：defer が書いた順に動くと思う、昔の共有変数のルールを今の Go に当てはめる。2つ考えよう：このクロージャはどの変数を見る？実際にいつ動く？",
    ),
  ),
  note("waitgroup-pitfalls", L("WaitGroup pitfalls", "Trampas del WaitGroup", "WaitGroup の落とし穴"),
    p(
      "A WaitGroup is a struct holding a counter. Passing it to a function by value copies the struct: Done then lowers the copy's counter, while main keeps waiting on the original, which never reaches 0. Always pass a pointer, *sync.WaitGroup, and call it with &wg.",
      "Un WaitGroup es un struct que guarda un contador. Pasarlo a una función por valor copia el struct: Done baja el contador de la copia, mientras main sigue esperando al original, que nunca llega a 0. Pasa siempre un puntero, *sync.WaitGroup, y llama con &wg.",
      "WaitGroup はカウンターを持つ struct。関数に値で渡すと struct がコピーされ、Done はコピーのカウンターを減らす。main は 0 にならない本物を待ち続ける。必ずポインタ *sync.WaitGroup で受け、&wg を渡そう。",
    ),
    ex(go`
      func job(id int, wg *sync.WaitGroup) {
        defer wg.Done()
        fmt.Println("job", id)
      }
      func main() {
        var wg sync.WaitGroup
        wg.Add(1)
        go job(7, &wg)
        wg.Wait()
      }`, "job 7",
      L("A pointer: Done lowers the real counter", "Un puntero: Done baja el contador real", "ポインタなら Done が本物を減らす")),
    p(
      "When every goroutine is blocked and none can ever wake up, the Go runtime notices and stops the program: fatal error: all goroutines are asleep - deadlock!. A WaitGroup whose Add calls outnumber its Done calls ends exactly like that.",
      "Cuando todas las goroutines están bloqueadas y ninguna puede despertar, el runtime de Go lo nota y detiene el programa: fatal error: all goroutines are asleep - deadlock!. Un WaitGroup con más Add que Done termina exactamente así.",
      "すべての goroutine が止まり、だれも起きられないと、Go のランタイムが気づいてプログラムを止める：fatal error: all goroutines are asleep - deadlock!。Add が Done より多い WaitGroup はまさにこうなる。",
    ),
    crash(go`
      var wg sync.WaitGroup
      wg.Add(2)
      go func() { defer wg.Done() }()
      wg.Wait()`, "all goroutines are asleep",
      L("Add(2) but only one Done: Wait never returns", "Add(2) pero un solo Done: Wait nunca vuelve", "Add(2) なのに Done は1回：Wait は戻らない")),
    p(
      "The opposite mistake, more Done calls than Add, takes the counter below zero, and Go panics with sync: negative WaitGroup counter. Rule: every Add(1) needs exactly one Done. go vet also warns when a WaitGroup or Mutex is copied.",
      "El error contrario, más Done que Add, baja el contador de cero, y Go hace panic con sync: negative WaitGroup counter. Regla: cada Add(1) necesita exactamente un Done. go vet también avisa cuando se copia un WaitGroup o un Mutex.",
      "逆のミス（Done が Add より多い）ではカウンターが 0 より下がり、sync: negative WaitGroup counter で panic。ルール：Add(1) 1つに Done はちょうど1つ。WaitGroup や Mutex をコピーすると go vet も警告する。",
    ),
  ),
];

const goroutines: LessonDef = {
  slug: "goroutines-and-waitgroups",
  title: L("Allies in parallel", "Aliados en paralelo", "並んで働く仲間"),
  concept: "goroutines",
  mode: "lesson",
  xp: 90,
  enemy: "go/deadlock-snail",
  enemyName: L("WAITING SNAIL", "CARACOL ESPERÓN", "待ちぼうけカタツムリ"),
  beats: [
    say(L(
      "Welcome to Channel Tower! Write go before a call and a new ally, a GOROUTINE, runs it beside you while you keep going.",
      "¡Bienvenido a la Torre de Canales! Escribe go antes de una llamada y un aliado nuevo, una GOROUTINE, la corre a tu lado.",
      "チャネルの塔へようこそ！呼び出しの前に go と書くと、新しい仲間 goroutine が並んで実行するよ。",
    )),
    say(L(
      "Catch: when main returns, the program ends, even if allies are still working. So we must WAIT for them.",
      "Ojo: cuando main termina, el programa acaba, aunque los aliados sigan trabajando. Así que hay que ESPERARLOS.",
      "ただし main が終わるとプログラムも終わる。仲間が働き中でもね。だから待つ必要があるよ。",
    )),
    {
      kind: "predict",
      prompt: L("Does main wait for this goroutine?", "¿main espera a esta goroutine?", "main はこの goroutine を待つ？"),
      code: go`
        go fmt.Println("hi")
        fmt.Println("done")`,
      options: [L("No: hi may never appear", "No: hi puede no salir nunca", "いいえ：hi は出ないかも"), L("Yes: always hi, then done", "Sí: siempre hi y luego done", "はい：必ず hi のあと done")],
      answer: 0,
      explain: L("Nothing makes main wait. It can print done and exit before the goroutine runs. Never rely on luck.", "Nada hace esperar a main. Puede imprimir done y salir antes de que corra la goroutine. No confíes en la suerte.", "main を待たせるものがない。goroutine が動く前に done を出して終わることもある。"),
      hint: L("go starts the call and moves on at once. Is there anything here that makes main wait before it ends?", "go lanza la llamada y sigue de inmediato. ¿Hay algo aquí que haga esperar a main antes de terminar?", "go は呼び出しを始めてすぐ先へ進む。main が終わる前に待たせるものはある？"),
      note: "goroutines-wait",
      win: [{ t: "say", actor: "hero", text: L("Need a wait!", "¡Hay que esperar!", "待たなきゃ！") }],
    },
    say(L(
      "sync.WaitGroup is a bell counter: Add(1) before each go, Done() when an ally finishes, Wait() until it reaches 0.",
      "sync.WaitGroup es un contador con campana: Add(1) antes de cada go, Done() al terminar un aliado, Wait() hasta llegar a 0.",
      "sync.WaitGroup はベルのカウンター。go の前に Add(1)、終わったら Done()、0 になるまで Wait()。",
    )),
    {
      kind: "act",
      prompt: L("Send an ally to work and wait for the bell", "Manda a un aliado a trabajar y espera la campana", "仲間を送り出して、ベルを待とう"),
      steps: [
        { label: L("COUNTER", "CONTADOR", "カウンター"), line: "var wg sync.WaitGroup", effects: [{ t: "tag", actor: "hero", text: "wg", value: "0" }] },
        { label: L("ADD 1", "SUMAR 1", "1 足す"), line: "wg.Add(1)", effects: [{ t: "value", actor: "hero", text: "1" }] },
        { label: L("GO!", "¡GO!", "go！"), line: 'go func() { defer wg.Done(); fmt.Println("dig") }()', effects: [{ t: "enter", actor: "ally" }, { t: "say", actor: "ally", text: L("Digging!", "¡Cavando!", "掘るよ！") }, { t: "print", text: "dig" }, { t: "exit", actor: "ally" }, { t: "value", actor: "hero", text: "0" }] },
        { label: L("WAIT", "ESPERAR", "待つ"), line: "wg.Wait()", effects: [{ t: "wait", ms: 300 }] },
        { label: L("FINISH", "TERMINAR", "おわり"), line: 'fmt.Println("all home")', effects: [{ t: "print", text: "all home" }], output: "dig\nall home" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var wg sync.WaitGroup
        results := make([]int, 3)
        for i := 0; i < 3; i++ {
          wg.Add(1)
          go func() {
            defer wg.Done()
            results[i] = i * i
          }()
        }
        wg.Wait()
        fmt.Println(results)`,
      options: ["[0 1 4]", "[0 0 0]", "[4 4 4]"],
      answer: 0,
      output: "[0 1 4]",
      check: { compiles: true, stdout: "[0 1 4]" },
      explain: L("Each goroutine writes its own slot, and Wait makes main read only after all are done.", "Cada goroutine escribe su propia casilla, y Wait hace que main lea solo cuando todas terminaron.", "goroutine ごとに別の場所に書き、Wait で全員終わってから main が読む。"),
      hint: L("Each goroutine writes a different slot, and main reads only after Wait. What does slot i get?", "Cada goroutine escribe una casilla distinta, y main lee solo tras Wait. ¿Qué recibe la casilla i?", "goroutine ごとに別の場所に書き、main は Wait のあとに読む。i 番目には何が入る？"),
      note: "goroutines-wait",
      setup: [{ t: "tag", actor: "hero", text: "results" }, { t: "enter", actor: "ally" }],
      win: [{ t: "print", text: "[0 1 4]" }],
    },
    say(L(
      "Since Go 1.22, every loop iteration gets its OWN i. Closures and goroutines each see their own value. Before, they shared one.",
      "Desde Go 1.22, cada vuelta del loop tiene su PROPIO i. Closures y goroutines ven su propio valor. Antes compartían uno.",
      "Go 1.22 から、ループの1回ごとに自分の i がある。クロージャも goroutine も自分の値を見るよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var ptrs []*int
        for _, v := range []int{1, 2, 3} {
          ptrs = append(ptrs, &v)
        }
        fmt.Println(*ptrs[0], *ptrs[1], *ptrs[2])`,
      options: ["1 2 3", "3 3 3", "1 1 1"],
      answer: 0,
      output: "1 2 3",
      check: { compiles: true, stdout: "1 2 3" },
      explain: L("Each iteration has a fresh v, so each pointer sees its own value.", "Cada vuelta tiene un v nuevo, así que cada puntero ve su propio valor.", "毎回新しい v ができるので、ポインタはそれぞれ自分の値を指す。"),
      hint: L("Since Go 1.22, is v one shared variable or a new one each iteration? Where does each pointer point?", "Desde Go 1.22, ¿v es una variable compartida o una nueva en cada vuelta? ¿A dónde apunta cada puntero?", "Go 1.22 以降、v は共有の1つ？毎回新しい？それぞれのポインタはどこを指す？"),
      note: "loop-vars",
      win: [{ t: "print", text: "1 2 3" }],
    },
    {
      kind: "predict",
      prompt: L("Before Go 1.22, what came out?", "Antes de Go 1.22, ¿qué salía?", "Go 1.22 より前は何が出た？"),
      code: go`
        for i := 0; i < 3; i++ {
          defer func() { fmt.Print(i) }()
        }`,
      options: ["333", "210", "012"],
      answer: 0,
      explain: L("Old Go had ONE shared i, already 3 when the defers ran: 333. Today each i is new, so it gives 210.", "El Go viejo tenía UN solo i, ya en 3 cuando corrían los defer: 333. Hoy cada i es nuevo y da 210.", "昔の Go は i が1つだけで、defer の時にはもう 3：333。今は毎回新しい i で 210。"),
      hint: L("In old Go, all closures shared ONE i. What value did i have when the deferred calls finally ran?", "En el Go viejo, todos los closures compartían UN i. ¿Qué valor tenía i cuando por fin corrían los defer?", "昔の Go では全クロージャが1つの i を共有。defer が動いた時、i はいくつ？"),
      note: "loop-vars",
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        for i := 0; i < 3; i++ {
          defer func() { fmt.Print(i) }()
        }`,
      options: ["210", "333", "012"],
      answer: 0,
      output: "210",
      check: { compiles: true, stdout: "210" },
      explain: L("Today each closure keeps its own i, and defers run last-in, first-out: 2, 1, 0.", "Hoy cada closure guarda su propio i, y los defer corren del último al primero: 2, 1, 0.", "今は各クロージャが自分の i を持ち、defer は後から順に動く：2, 1, 0。"),
      hint: L("Each closure keeps its own i today. In what order do deferred calls run?", "Hoy cada closure guarda su propio i. ¿En qué orden corren los defer?", "今は各クロージャが自分の i を持つ。defer はどの順番で動く？"),
      note: "loop-vars",
    },
    say(L(
      "Go 1.25 added wg.Go(f): it does Add(1), go and Done for you. Shorter and harder to get wrong.",
      "Go 1.25 trajo wg.Go(f): hace Add(1), go y Done por ti. Más corto y más difícil de romper.",
      "Go 1.25 で wg.Go(f) が登場。Add(1) と go と Done をまとめてやってくれるよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var wg sync.WaitGroup
        results := make([]int, 4)
        for i := range results {
          wg.Go(func() { results[i] = i * 10 })
        }
        wg.Wait()
        fmt.Println(results)`,
      options: ["[0 10 20 30]", "[30 30 30 30]", "[0 0 0 0]"],
      answer: 0,
      output: "[0 10 20 30]",
      check: { compiles: true, stdout: "[0 10 20 30]" },
      explain: L("wg.Go starts each function as a goroutine and tracks it; Wait returns when all four are done.", "wg.Go lanza cada función como goroutine y la cuenta; Wait vuelve cuando las cuatro terminan.", "wg.Go が関数を goroutine で動かして数える。4つ終わると Wait が戻る。"),
      hint: L("wg.Go runs each function as a tracked goroutine, and each writes its own slot. What lands in slot i?", "wg.Go corre cada función como goroutine contada, y cada una escribe su casilla. ¿Qué cae en la casilla i?", "wg.Go は関数を数えながら goroutine で動かす。それぞれ自分の場所に書く。i 番目は？"),
      note: "goroutines-wait",
      win: [{ t: "print", text: "[0 10 20 30]" }],
    },
    say(L(
      "Never COPY a WaitGroup. Passing it by value gives the ally a fake counter. Pass a pointer: *sync.WaitGroup.",
      "Nunca COPIES un WaitGroup. Pasarlo por valor le da al aliado un contador falso. Pasa un puntero: *sync.WaitGroup.",
      "WaitGroup はコピー禁止。値で渡すと仲間はにせのカウンターを持つ。*sync.WaitGroup で渡そう。",
    )),
    {
      kind: "predict",
      prompt: HAPPENS,
      code: go`
        func work(wg sync.WaitGroup) {
          defer wg.Done()
        }

        func main() {
          var wg sync.WaitGroup
          wg.Add(1)
          go work(wg)
          wg.Wait()
          fmt.Println("done")
        }`,
      options: ["done", DEADLOCK, NO_CE],
      answer: 1,
      check: { compiles: true, throws: "all goroutines are asleep" },
      explain: L("work rings Done on its copy. The real counter stays at 1, Wait never returns: all goroutines are asleep.", "work toca Done en su copia. El contador real sigue en 1 y Wait nunca vuelve: all goroutines are asleep.", "work はコピーに Done する。本物は 1 のままで Wait が戻らない：all goroutines are asleep。"),
      hint: L("work receives wg by value. Which counter does its Done change, and which one is main waiting on?", "work recibe wg por valor. ¿Qué contador cambia su Done, y a cuál espera main?", "work は wg を値で受け取る。Done が変えるのはどのカウンター？main が待つのは？"),
      note: "waitgroup-pitfalls",
      setup: [{ t: "tag", actor: "hero", text: "wg", value: "1" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "wg (copy)" }],
      win: DEADLOCK_FX,
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: go`
        var wg sync.WaitGroup
        wg.Done()
        fmt.Println("after")`,
      options: [PANICS, "after", DEADLOCK],
      answer: 0,
      check: { compiles: true, throws: "negative WaitGroup counter" },
      explain: L("Done without Add takes the counter below zero: panic: sync: negative WaitGroup counter.", "Done sin Add baja el contador de cero: panic: sync: negative WaitGroup counter.", "Add なしで Done すると 0 より下がる：panic: sync: negative WaitGroup counter。"),
      hint: L("The counter starts at 0 and nothing called Add. Where does Done take it?", "El contador empieza en 0 y nadie llamó a Add. ¿A dónde lo lleva Done?", "カウンターは 0 から始まり、Add はだれも呼んでいない。Done でいくつになる？"),
      note: "waitgroup-pitfalls",
      win: [{ t: "shake" }],
    },
    {
      kind: "order",
      prompt: L("Start one ally and wait for it", "Lanza un aliado y espéralo", "仲間を1人出して待とう"),
      lines: ["var wg sync.WaitGroup", "wg.Add(1)", 'go func() { defer wg.Done(); fmt.Println("work") }()', "wg.Wait()"],
      check: { compiles: true, stdout: "work" },
      explain: L("Declare, Add BEFORE go, Done when the ally finishes, then Wait.", "Declara, Add ANTES del go, Done al terminar el aliado y luego Wait.", "宣言、go の前に Add、終わったら Done、最後に Wait。"),
      hint: L("The counter must exist first and go up before the ally starts; waiting comes last.", "El contador debe existir primero y subir antes de que salga el aliado; esperar va al final.", "カウンターを先に作り、仲間が出る前に増やす。待つのは最後。"),
      note: "goroutines-wait",
      win: [{ t: "print", text: "work" }],
    },
    {
      kind: "run",
      prompt: L("The tower freezes. Fix it to print sum of squares: 14", "La torre se congela. Arréglala para imprimir sum of squares: 14", "塔が止まる。sum of squares: 14 と表示させよう"),
      starter: go`
        package main

        import (
          "fmt"
          "sync"
        )

        func square(n int, out []int, wg sync.WaitGroup) {
          defer wg.Done()
          out[n] = n * n
        }

        func main() {
          var wg sync.WaitGroup
          out := make([]int, 4)
          for i := range out {
            wg.Add(1)
            go square(i, out, wg)
          }
          wg.Wait()
          sum := 0
          for _, v := range out {
            sum += v
          }
          fmt.Println("sum of squares:", sum)
        }
      `,
      solution: go`
        package main

        import (
          "fmt"
          "sync"
        )

        func square(n int, out []int, wg *sync.WaitGroup) {
          defer wg.Done()
          out[n] = n * n
        }

        func main() {
          var wg sync.WaitGroup
          out := make([]int, 4)
          for i := range out {
            wg.Add(1)
            go square(i, out, &wg)
          }
          wg.Wait()
          sum := 0
          for _, v := range out {
            sum += v
          }
          fmt.Println("sum of squares:", sum)
        }
      `,
      expect: "sum of squares: 14",
      fallback: [String.raw`wg\s+\*sync\.WaitGroup`, String.raw`wg\.Go\(`],
      explain: L("square got a copy of wg, so Done never reached the real one. Take *sync.WaitGroup and pass &wg.", "square recibía una copia de wg, así que Done nunca llegaba al real. Usa *sync.WaitGroup y pasa &wg.", "square は wg のコピーを受け取っていた。*sync.WaitGroup にして &wg を渡そう。"),
      hint: L("square gets its own copy of wg. Make it share the real counter instead.", "square recibe su propia copia de wg. Haz que comparta el contador real.", "square は wg のコピーを受け取っている。本物のカウンターを共有させよう。"),
      note: "waitgroup-pitfalls",
    },
  ],
  notes: goroutineNotes,
};

// ─── 4.2 Tunnels between allies: channels ──────────────────────────────────
const channelNotes: NoteDef[] = [
  note("unbuffered", L("Unbuffered channels: hand to hand", "Canales sin buffer: mano a mano", "バッファなしチャネル：手渡し"),
    p(
      "A channel is a typed pipe between goroutines: ch <- v sends v, and <-ch receives a value. make(chan T) creates an unbuffered channel, which has no storage at all. A send waits until another goroutine is ready to receive, and a receive waits until someone sends: both sides must meet.",
      "Un canal es un tubo con tipo entre goroutines: ch <- v envía v, y <-ch recibe un valor. make(chan T) crea un canal sin buffer, que no guarda nada. Un envío espera hasta que otra goroutine esté lista para recibir, y una recepción espera hasta que alguien envíe: ambos lados deben encontrarse.",
      "チャネルは goroutine 間の型つきの管。ch <- v で送り、<-ch で受け取る。make(chan T) はバッファなし（しまう場所がない）チャネル。送信は受け手が来るまで、受信は送り手が来るまで待つ。両者が出会う必要がある。",
    ),
    ex(go`
      msgs := make(chan string)
      go func() { msgs <- "ping" }()
      reply := <-msgs
      fmt.Println("got", reply)`, "got ping",
      L("The goroutine sends while main is receiving", "La goroutine envía mientras main recibe", "goroutine が送り、main が受け取る")),
    p(
      "Code runs line by line, so one goroutine can't be in two places. If main sends on an unbuffered channel and the only receive is main's own next line, the send waits forever and the next line is never reached. With nobody else running, Go stops the program: all goroutines are asleep - deadlock!.",
      "El código corre línea por línea, así que una goroutine no puede estar en dos lugares. Si main envía por un canal sin buffer y la única recepción es la siguiente línea del propio main, el envío espera para siempre y nunca llega a esa línea. Sin nadie más corriendo, Go detiene el programa: all goroutines are asleep - deadlock!.",
      "コードは1行ずつ動くので、1つの goroutine が2か所にはいられない。main がバッファなしで送り、受信が main 自身の次の行だけなら、送信は永遠に待ち、次の行に届かない。ほかにだれもいなければ Go が止める：all goroutines are asleep - deadlock!。",
    ),
    crash(go`
      nums := make(chan int)
      <-nums`, "all goroutines are asleep",
      L("A receive with nobody who will ever send", "Una recepción sin nadie que vaya a enviar", "だれも送らないのに受信している")),
    p(
      "The fixes: do one side in another goroutine (go func() { ch <- v }()), or give the channel a buffer so the value has somewhere to wait. Common mistake: reading the code top to bottom as if the next line would \"pick up\" the value; an unbuffered send needs a receiver that is already running.",
      "Las soluciones: haz uno de los lados en otra goroutine (go func() { ch <- v }()), o dale un buffer al canal para que el valor tenga dónde esperar. Error común: leer el código de arriba abajo como si la siguiente línea \"recogiera\" el valor; un envío sin buffer necesita un receptor que ya esté corriendo.",
      "直し方：片方を別の goroutine でやる（go func() { ch <- v }()）か、値の待ち場所としてバッファをつける。よくあるミス：次の行が値を「拾ってくれる」と思うこと。バッファなしの送信には、すでに動いている受け手が必要。",
    ),
  ),
  note("buffered", L("Buffered channels: a box with slots", "Canales con buffer: una caja", "バッファつきチャネル：箱"),
    p(
      "make(chan T, n) creates a channel with a buffer of n slots. A send only waits when all slots are full; a receive only waits when the box is empty. Values come out in the order they went in (first in, first out).",
      "make(chan T, n) crea un canal con un buffer de n espacios. Un envío solo espera cuando todos los espacios están llenos; una recepción solo espera cuando la caja está vacía. Los valores salen en el orden en que entraron (el primero en entrar sale primero).",
      "make(chan T, n) は n 個分のバッファを持つチャネル。送信は全部うまっているときだけ、受信は空のときだけ待つ。値は入れた順に出てくる（先入れ先出し）。",
    ),
    ex(go`
      q := make(chan int, 2)
      q <- 5
      q <- 6
      fmt.Println(<-q, <-q)`, "5 6",
      L("Two free slots: neither send waits", "Dos espacios libres: ningún envío espera", "空きが2つ：どちらの送信も待たない")),
    p(
      "len(ch) tells how many values are waiting in the buffer right now; cap(ch) tells how many slots it has in total. An unbuffered channel has cap 0.",
      "len(ch) dice cuántos valores esperan en el buffer ahora mismo; cap(ch) dice cuántos espacios tiene en total. Un canal sin buffer tiene cap 0.",
      "len(ch) は今バッファで待っている値の数、cap(ch) は全部の空きの数。バッファなしチャネルの cap は 0。",
    ),
    ex(go`
      box := make(chan bool, 4)
      box <- true
      fmt.Println(len(box), cap(box))`, "1 4",
      L("One value waiting, four slots in total", "Un valor esperando, cuatro espacios en total", "待っている値は1つ、空きは全部で4つ")),
    p(
      "A buffer does not replace a receiver; it only lets the sender get ahead a little. Once every slot is full, the next send waits just like on an unbuffered channel, and if nobody will ever receive, that is a deadlock.",
      "Un buffer no reemplaza a un receptor; solo deja que el emisor se adelante un poco. Cuando todos los espacios están llenos, el siguiente envío espera igual que en un canal sin buffer, y si nadie va a recibir nunca, es un deadlock.",
      "バッファは受け手の代わりではなく、送り手が少し先に進めるだけ。全部うまると、次の送信はバッファなしと同じように待つ。だれも受け取らないなら、それはデッドロック。",
    ),
    p(
      "Common mistake: adding a big buffer to make a deadlock go away. It may hide the bug until the buffer fills up in production. Count the sends, the slots and the receives.",
      "Error común: poner un buffer grande para que desaparezca un deadlock. Puede esconder el bug hasta que el buffer se llene en producción. Cuenta los envíos, los espacios y las recepciones.",
      "よくあるミス：デッドロックを消すために大きなバッファをつけること。本番でバッファがうまるまでバグが隠れるだけ。送信・空き・受信の数を数えよう。",
    ),
  ),
  note("closing", L("Closing channels and range", "Cerrar canales y range", "チャネルを閉じる・range"),
    p(
      "close(ch) announces \"no more values will come\". Only the sender should close, and only when it is done. Closing does not erase anything: values already in the buffer can still be received.",
      "close(ch) anuncia \"no vendrán más valores\". Solo el emisor debe cerrar, y solo cuando termina. Cerrar no borra nada: los valores que ya están en el buffer todavía se pueden recibir.",
      "close(ch) は「もう値は来ない」という宣言。閉じるのは送る側だけ、それも終わったときだけ。閉じても何も消えず、バッファの値はまだ受け取れる。",
    ),
    p(
      "for v := range ch keeps receiving until the channel is closed AND empty, then the loop ends. If nobody ever closes the channel, range waits forever for the next value, and with no one else running that is a deadlock.",
      "for v := range ch sigue recibiendo hasta que el canal está cerrado Y vacío, y entonces el bucle termina. Si nadie cierra nunca el canal, range espera para siempre el siguiente valor, y sin nadie más corriendo es un deadlock.",
      "for v := range ch は、チャネルが閉じて空になるまで受け取り続け、そこでループが終わる。だれも閉じなければ range は次の値を永遠に待ち、ほかにだれもいなければデッドロック。",
    ),
    ex(go`
      letters := make(chan string)
      go func() { letters <- "p"; letters <- "q"; close(letters) }()
      for s := range letters {
        fmt.Println(s)
      }
      fmt.Println("end")`, "p\nq\nend",
      L("The sender closes, so range can finish", "El emisor cierra, así que range puede terminar", "送り手が閉じるので range は終われる")),
    p(
      "v, ok := <-ch tells real values apart from the end: ok is true for a value that was sent, and false once the channel is closed and empty; then v is the zero value. Receiving from a closed channel never waits. Closing a chan struct{} is a handy broadcast: every goroutine waiting on it wakes up.",
      "v, ok := <-ch distingue los valores reales del final: ok es true para un valor enviado, y false cuando el canal está cerrado y vacío; entonces v es el valor cero. Recibir de un canal cerrado nunca espera. Cerrar un chan struct{} es un aviso a todos: cada goroutine que espera en él despierta.",
      "v, ok := <-ch で本物の値と終わりを見分ける。送られた値なら ok は true、閉じて空なら false で v はゼロ値。閉じたチャネルからの受信は待たない。chan struct{} を閉じると全員への合図になり、待っている goroutine がみな起きる。",
    ),
    ex(go`
      c := make(chan int, 2)
      c <- 4
      close(c)
      for {
        v, ok := <-c
        if !ok { break }
        fmt.Println("got", v)
      }
      fmt.Println("closed")`, "got 4\nclosed",
      L("ok turns false once the channel is drained", "ok se vuelve false cuando el canal se vacía", "空になると ok が false になる")),
    p(
      "Three things panic: sending on a closed channel, closing a channel twice, and closing a nil channel. Receiving is always safe. Common mistake: letting a receiver close the channel while a sender may still send.",
      "Tres cosas hacen panic: enviar a un canal cerrado, cerrar un canal dos veces y cerrar un canal nil. Recibir siempre es seguro. Error común: dejar que un receptor cierre el canal mientras un emisor todavía puede enviar.",
      "panic になるのは3つ：閉じたチャネルへの送信、2回閉じる、nil チャネルを閉じる。受信はいつも安全。よくあるミス：送り手がまだ送るかもしれないのに、受け手が閉じること。",
    ),
    crash(go`
      c := make(chan int)
      close(c)
      close(c)`, "close of closed channel",
      L("Closing twice panics", "Cerrar dos veces hace panic", "2回閉じると panic")),
  ),
  note("directions", L("Channel directions", "Dirección de los canales", "チャネルの向き"),
    p(
      "A plain chan T can send and receive. A channel type can also carry a direction: chan<- T can only send, and <-chan T can only receive. Read the arrow: in chan<- the arrow points into the channel (values go in); in <-chan it points out of it (values come out).",
      "Un chan T simple puede enviar y recibir. Un tipo de canal también puede llevar dirección: chan<- T solo puede enviar, y <-chan T solo puede recibir. Lee la flecha: en chan<- la flecha apunta hacia el canal (los valores entran); en <-chan apunta hacia afuera (los valores salen).",
      "ふつうの chan T は送受信どちらもできる。チャネル型には向きもつけられる。chan<- T は送るだけ、<-chan T は受けるだけ。矢印を読もう：chan<- は矢印がチャネルに入る（値が入る）、<-chan は出てくる（値が出る）。",
    ),
    ex(go`
      func fill(out chan<- int) { out <- 42 }

      func drain(in <-chan int) { fmt.Println(<-in) }

      func main() {
        ch := make(chan int, 1)
        fill(ch)
        drain(ch)
      }`, "42",
      L("One channel, passed as send-only and as receive-only", "Un canal, pasado como solo envío y como solo recepción", "1つのチャネルを送信専用・受信専用として渡す")),
    p(
      "A two-way channel converts automatically to either direction when you pass it to a function, but not back. Inside the function, the compiler rejects the forbidden operation: cannot send to receive-only channel, or cannot receive from send-only channel.",
      "Un canal de doble sentido se convierte solo a cualquier dirección al pasarlo a una función, pero no al revés. Dentro de la función, el compilador rechaza la operación prohibida: cannot send to receive-only channel, o cannot receive from send-only channel.",
      "双方向のチャネルは、関数に渡すとどちらの向きにも自動で変わるが、逆には戻らない。関数の中で禁止された操作をすると、コンパイラが拒む：cannot send to receive-only channel など。",
    ),
    bad(go`
      func drain(in <-chan int) {
        in <- 1
      }

      func main() { drain(make(chan int, 1)) }`,
      L("Does not compile: in is receive-only", "No compila: in es solo de recepción", "コンパイル不可：in は受信専用")),
    p(
      "Why bother? The signature documents each function's role (producer or consumer), and the compiler catches mix-ups for free. It also protects the rule that only senders close: a receive-only channel can't be closed.",
      "¿Para qué? La firma documenta el papel de cada función (productor o consumidor), y el compilador atrapa las confusiones gratis. También protege la regla de que solo el emisor cierra: un canal de solo recepción no se puede cerrar.",
      "なぜ使う？シグネチャが関数の役割（作る側か使う側か）を示し、取り違えをコンパイラがただで見つけてくれる。「閉じるのは送る側だけ」も守られる。受信専用チャネルは閉じられない。",
    ),
  ),
];

const channels: LessonDef = {
  slug: "channels",
  title: L("Tunnels between allies", "Túneles entre aliados", "仲間をつなぐトンネル"),
  concept: "channels",
  mode: "lesson",
  xp: 95,
  enemy: "go/deadlock-snail",
  enemyName: L("DEADLOCK SNAIL", "CARACOL DEADLOCK", "デッドロックカタツムリ"),
  beats: [
    say(L(
      "A CHANNEL is a tunnel between goroutines: ch <- v sends, <-ch receives. An unbuffered one is hand to hand: both must meet.",
      "Un CANAL es un túnel entre goroutines: ch <- v envía, <-ch recibe. Uno sin buffer es mano a mano: ambos deben encontrarse.",
      "チャネルは goroutine 間のトンネル。ch <- v で送り、<-ch で受ける。バッファなしは手渡しだよ。",
    )),
    {
      kind: "act",
      prompt: L("Dig a tunnel and pass a gem through it", "Cava un túnel y pasa una gema por él", "トンネルを掘って宝石を渡そう"),
      steps: [
        { label: L("DIG", "CAVAR", "掘る"), line: "ch := make(chan string)", effects: [{ t: "tag", actor: "hero", text: "ch" }] },
        { label: L("ALLY SENDS", "ALIADO ENVÍA", "仲間が送る"), line: 'go func() { ch <- "gem" }()', effects: [{ t: "enter", actor: "ally" }, { t: "item", kind: "gem", holder: "ally" }, { t: "say", actor: "ally", text: L("Waiting for you", "Te espero", "待ってるよ") }] },
        { label: L("RECEIVE", "RECIBIR", "受け取る"), line: "fmt.Println(<-ch)", effects: [{ t: "give", to: "hero" }, { t: "print", text: "gem" }], output: "gem" },
      ],
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: go`
        ch := make(chan int)
        ch <- 1
        fmt.Println(<-ch)`,
      options: ["1", DEADLOCK, "0"],
      answer: 1,
      check: { compiles: true, throws: "all goroutines are asleep" },
      explain: L("main sends and waits for a receiver, but the only receiver is main itself, on the next line. Frozen.", "main envía y espera a un receptor, pero el único receptor es el propio main, en la línea siguiente. Congelado.", "main が送って受け手を待つけど、受け手は次の行の main 自身。止まってしまう。"),
      hint: L("An unbuffered send waits until someone receives. Who could receive while main is stuck on that line?", "Un envío sin buffer espera a que alguien reciba. ¿Quién podría recibir mientras main está atascado ahí?", "バッファなしの送信は受け手を待つ。main がその行で止まっている間、だれが受け取れる？"),
      note: "unbuffered",
      setup: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "ch" }],
      win: [{ t: "say", actor: "enemy", text: L("Everyone sleeps!", "¡Todos duermen!", "みんな眠った！") }, ...DEADLOCK_FX],
    },
    say(L(
      "A BUFFERED channel, make(chan T, n), is a box with n slots. Sending only waits when the box is full.",
      "Un canal CON BUFFER, make(chan T, n), es una caja con n espacios. Enviar solo espera cuando la caja está llena.",
      "バッファつきチャネル make(chan T, n) は n 個入る箱。いっぱいのときだけ送信が待つよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        ch := make(chan int, 1)
        ch <- 1
        fmt.Println(<-ch)`,
      options: ["1", DEADLOCK, "0"],
      answer: 0,
      output: "1",
      check: { compiles: true, stdout: "1" },
      explain: L("The box has one free slot, so the send doesn't wait. Then main takes it out.", "La caja tiene un espacio libre, así que el envío no espera. Luego main lo saca.", "箱に空きが1つあるので送信は待たない。そのあと main が取り出す。"),
      hint: L("The channel has room for one value. Does the send have to wait for a receiver?", "El canal tiene espacio para un valor. ¿El envío tiene que esperar a un receptor?", "チャネルには1つ分の空きがある。送信は受け手を待つ必要がある？"),
      note: "buffered",
      win: [{ t: "print", text: "1" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        ch := make(chan string, 3)
        ch <- "a"
        ch <- "b"
        fmt.Println(len(ch), cap(ch))`,
      options: ["2 3", "3 3", "2 2"],
      answer: 0,
      output: "2 3",
      check: { compiles: true, stdout: "2 3" },
      explain: L("len is how many items wait in the box; cap is how many slots it has.", "len es cuántos elementos esperan en la caja; cap es cuántos espacios tiene.", "len は箱の中の数、cap は箱の大きさだよ。"),
      hint: L("One of these counts the values waiting inside; the other counts all the slots.", "Uno cuenta los valores que esperan adentro; el otro cuenta todos los espacios.", "片方は中で待っている値の数、もう片方は全部の空きの数。"),
      note: "buffered",
      win: [{ t: "print", text: "2 3" }],
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: go`
        ch := make(chan int, 2)
        ch <- 1
        ch <- 2
        ch <- 3
        fmt.Println("full")`,
      options: ["full", DEADLOCK, PANICS],
      answer: 1,
      check: { compiles: true, throws: "all goroutines are asleep" },
      explain: L("The third send finds the box full and waits forever: nobody will ever take an item out.", "El tercer envío encuentra la caja llena y espera para siempre: nadie sacará nada.", "3つ目の送信は箱がいっぱいで永遠に待つ。だれも取り出さないからね。"),
      hint: L("Count the slots and the sends. Does anyone ever take a value out?", "Cuenta los espacios y los envíos. ¿Alguien saca algún valor alguna vez?", "空きの数と送信の数を数えよう。だれかが値を取り出す？"),
      note: "buffered",
      win: DEADLOCK_FX,
    },
    say(L(
      "The SENDER calls close(ch) when done. for v := range ch reads until the channel is closed and empty.",
      "El que ENVÍA llama a close(ch) al terminar. for v := range ch lee hasta que el canal está cerrado y vacío.",
      "送る側は終わったら close(ch)。for v := range ch は閉じて空になるまで読むよ。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        ch := make(chan int, 3)
        ch <- 1
        ch <- 2
        ch <- 3
        close(ch)
        sum := 0
        for v := range ch {
          sum += v
        }
        fmt.Println(sum)`,
      options: ["6", "0", DEADLOCK],
      answer: 0,
      output: "6",
      check: { compiles: true, stdout: "6" },
      explain: L("Closing keeps the items. range drains 1, 2, 3, then stops because the channel is closed.", "Cerrar no borra los elementos. range saca 1, 2, 3 y se detiene porque el canal está cerrado.", "閉じても中身は残る。range は 1, 2, 3 を読み、閉じているので止まる。"),
      hint: L("Closing doesn't erase what's in the box. When does range stop?", "Cerrar no borra lo que hay en la caja. ¿Cuándo se detiene range?", "閉じても箱の中身は消えない。range はいつ止まる？"),
      note: "closing",
      win: [{ t: "banner", text: L("CLOSED", "CERRADO", "クローズ") }, { t: "print", text: "6" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        ch := make(chan int, 1)
        ch <- 7
        close(ch)
        a, ok1 := <-ch
        b, ok2 := <-ch
        fmt.Println(a, ok1, b, ok2)`,
      options: ["7 true 0 false", "7 true 7 true", "7 false 0 false"],
      answer: 0,
      output: "7 true 0 false",
      check: { compiles: true, stdout: "7 true 0 false" },
      explain: L("First you get the real 7. After that, a closed empty channel gives the zero value and ok false.", "Primero recibes el 7 real. Después, un canal cerrado y vacío da el valor cero y ok false.", "まず本物の 7。そのあと、閉じた空のチャネルはゼロ値と ok false を返す。"),
      hint: L("The first receive finds a real value. What does a closed, empty channel give after that?", "La primera recepción encuentra un valor real. ¿Qué da un canal cerrado y vacío después?", "最初の受信は本物の値。そのあと、閉じた空のチャネルは何を返す？"),
      note: "closing",
      win: [{ t: "print", text: "7 true 0 false" }],
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: go`
        ch := make(chan int, 1)
        close(ch)
        ch <- 1
        fmt.Println("sent")`,
      options: [PANICS, "sent", DEADLOCK],
      answer: 0,
      check: { compiles: true, throws: "send on closed channel" },
      explain: L("Sending on a closed channel is a bug: panic: send on closed channel. Closing twice panics too.", "Enviar a un canal cerrado es un bug: panic: send on closed channel. Cerrar dos veces también hace panic.", "閉じたチャネルへの送信は panic：send on closed channel。2回閉じても panic。"),
      hint: L("After close, receiving is still allowed. Is sending allowed too?", "Tras close, recibir sigue permitido. ¿Enviar también?", "close のあとも受信はできる。では送信は？"),
      note: "closing",
      win: [{ t: "shake" }],
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: go`
        ch := make(chan int)
        go func() {
          ch <- 1
          ch <- 2
        }()
        for v := range ch {
          fmt.Println(v)
        }`,
      options: [L("1, 2, then deadlock", "1, 2 y luego deadlock", "1, 2 のあとデッドロック"), L("1, 2, then it ends", "1, 2 y termina", "1, 2 で正常終了")],
      answer: 0,
      check: { compiles: true, throws: "all goroutines are asleep" },
      explain: L("Nobody closes ch, so range keeps waiting for a third value that never comes.", "Nadie cierra ch, así que range sigue esperando un tercer valor que nunca llega.", "だれも ch を閉じないので、range は来ない3つ目を待ち続ける。"),
      hint: L("range ends only when the channel is closed. Who closes ch here?", "range solo termina cuando el canal se cierra. ¿Quién cierra ch aquí?", "range はチャネルが閉じたときだけ終わる。ここで ch を閉じるのはだれ？"),
      note: "closing",
      win: DEADLOCK_FX,
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        ch := make(chan int)
        go func() {
          for i := 1; i <= 3; i++ {
            ch <- i * 10
          }
          close(ch)
        }()
        for v := range ch {
          fmt.Print(v, " ")
        }`,
      options: ["10 20 30", "30 20 10", "10 10 10"],
      answer: 0,
      output: "10 20 30",
      check: { compiles: true, stdout: "10 20 30" },
      explain: L("One sender keeps the order. It closes when done, so range stops cleanly.", "Un solo emisor mantiene el orden. Cierra al terminar, así que range se detiene limpio.", "送り手が1人なら順番どおり。最後に閉じるので range はきれいに止まる。"),
      hint: L("There is a single sender, sending in a loop and closing at the end. Can the order change?", "Hay un solo emisor, que envía en un bucle y cierra al final. ¿Puede cambiar el orden?", "送り手は1人で、ループで送り最後に閉じる。順番は変わりうる？"),
      note: "closing",
      win: [{ t: "print", text: "10 20 30" }],
    },
    say(L(
      "Channel types can have a DIRECTION: chan<- int only sends, <-chan int only receives. The compiler guards the tunnel.",
      "Los tipos de canal pueden tener DIRECCIÓN: chan<- int solo envía, <-chan int solo recibe. El compilador vigila el túnel.",
      "チャネル型には向きがある。chan<- int は送るだけ、<-chan int は受けるだけ。コンパイラが見張るよ。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: go`
        func producer(out chan<- int) {
          v := <-out
          fmt.Println(v)
        }

        func main() {
          producer(make(chan int, 1))
        }`,
      options: [L("Yes", "Sí", "はい"), NO_CE],
      answer: 1,
      check: { compiles: false },
      explain: L("out is send-only (chan<- int): cannot receive from send-only channel.", "out es solo de envío (chan<- int): cannot receive from send-only channel.", "out は送信専用 (chan<- int)。cannot receive from send-only channel になる。"),
      hint: L("Read the arrow in out's type. Which operation does that direction allow?", "Lee la flecha en el tipo de out. ¿Qué operación permite esa dirección?", "out の型の矢印を読もう。その向きで許される操作はどっち？"),
      note: "directions",
      win: [{ t: "shake" }],
    },
    {
      kind: "type",
      prompt: L("Signal that the work is done", "Avisa que el trabajo terminó", "作業の終わりを知らせよう"),
      code: go`
        done := make(chan struct{})
        go func() {
          fmt.Println("working")
          ___(done)
        }()
        <-done
        fmt.Println("finished")`,
      answer: "close",
      check: { compiles: true, stdout: "working\nfinished" },
      explain: L("Closing a chan struct{} is a broadcast: every <-done waiting on it wakes up.", "Cerrar un chan struct{} es un aviso a todos: cada <-done que espera despierta.", "chan struct{} を閉じると全員への合図。待っている <-done がみんな起きる。"),
      hint: L("main waits on <-done. Which built-in wakes every receiver at once without sending a value?", "main espera en <-done. ¿Qué función incorporada despierta a todos los receptores sin enviar un valor?", "main は <-done で待つ。値を送らずに受け手全員を起こす組み込み関数は？"),
      note: "closing",
      win: [{ t: "print", text: "working" }, { t: "print", text: "finished" }],
    },
    {
      kind: "run",
      prompt: L("Nobody receives in time. Fix it to print got: hello", "Nadie recibe a tiempo. Arréglalo para imprimir got: hello", "受け手がいない。got: hello と表示させよう"),
      starter: go`
        package main

        import "fmt"

        func main() {
          ch := make(chan string)
          ch <- "hello"
          fmt.Println("got:", <-ch)
        }
      `,
      solution: go`
        package main

        import "fmt"

        func main() {
          ch := make(chan string)
          go func() { ch <- "hello" }()
          fmt.Println("got:", <-ch)
        }
      `,
      expect: "got: hello",
      fallback: [String.raw`go\s+func\s*\(\s*\)\s*\{[^}]*ch\s*<-`, String.raw`make\(\s*chan\s+string\s*,\s*[1-9]`],
      explain: L("Send from a goroutine so main can receive, or give the channel a buffer: make(chan string, 1).", "Envía desde una goroutine para que main reciba, o dale buffer al canal: make(chan string, 1).", "goroutine から送るか、バッファをつけよう：make(chan string, 1)。"),
      hint: L("main can't send and receive at the same time. Let someone else send, or give the value a place to wait.", "main no puede enviar y recibir a la vez. Deja que otro envíe, o dale al valor un lugar donde esperar.", "main は送信と受信を同時にできない。だれかに送らせるか、値の待ち場所を作ろう。"),
      note: "unbuffered",
    },
  ],
  notes: channelNotes,
};

// ─── 4.3 Choosing a tunnel, calling everyone home: select and context ──────
const selectNotes: NoteDef[] = [
  note("select", L("select: waiting on several channels", "select: esperar en varios canales", "select：複数のチャネルを待つ"),
    p(
      "select looks like a switch, but each case is a channel operation: a send or a receive. It waits until at least one case can go ahead, then runs that one. If several are ready at the same moment, it picks one at random, so never rely on the order of cases.",
      "select parece un switch, pero cada case es una operación de canal: un envío o una recepción. Espera hasta que al menos un case pueda avanzar y ejecuta ese. Si varios están listos a la vez, elige uno al azar, así que nunca dependas del orden de los cases.",
      "select は switch に似ているが、各 case はチャネル操作（送信か受信）。少なくとも1つが進めるまで待ち、それを実行する。同時に複数が準備できていればランダムに選ぶので、case の順番に頼らないこと。",
    ),
    ex(go`
      fast := make(chan string, 1)
      slow := make(chan string)
      fast <- "hare"
      select {
      case w := <-fast:
        fmt.Println(w)
      case w := <-slow:
        fmt.Println(w)
      }`, "hare",
      L("Only fast holds a value, so only its case is ready", "Solo fast tiene un valor, así que solo su case está listo", "値があるのは fast だけなので、その case だけが動ける")),
    p(
      "A default case runs immediately when no other case is ready, so the select never waits. That gives you non-blocking sends and receives: try the channel, and if it isn't ready, do something else.",
      "Un case default corre de inmediato cuando ningún otro case está listo, así que el select nunca espera. Eso da envíos y recepciones que no bloquean: prueba el canal y, si no está listo, haz otra cosa.",
      "default の case は、ほかに準備できた case がなければすぐ動くので、select は待たない。これで待たない送受信ができる。チャネルを試し、だめならほかのことをする。",
    ),
    ex(go`
      slots := make(chan int, 1)
      for i := 1; i <= 2; i++ {
        select {
        case slots <- i:
          fmt.Println("stored", i)
        default:
          fmt.Println("full, dropped", i)
        }
      }`, "stored 1\nfull, dropped 2",
      L("When the box is full, default runs instead of waiting", "Con la caja llena, corre default en vez de esperar", "箱がいっぱいなら、待たずに default が動く")),
    p(
      "Timeouts: time.After(d) returns a channel that receives a value once d has passed. Add it as a case and the select stops waiting after that time, whichever comes first. This is the classic way to give up on a slow answer.",
      "Timeouts: time.After(d) devuelve un canal que recibe un valor cuando pasa d. Agrégalo como case y el select deja de esperar tras ese tiempo, lo que ocurra primero. Es la forma clásica de rendirse ante una respuesta lenta.",
      "タイムアウト：time.After(d) は d たつと値が届くチャネルを返す。case に足せば、先に来たほうで select の待ちが終わる。遅い返事をあきらめる定番の方法。",
    ),
    ex(go`
      never := make(chan bool)
      select {
      case <-never:
        fmt.Println("signal")
      case <-time.After(20 * time.Millisecond):
        fmt.Println("too slow")
      }`, "too slow",
      L("Nobody sends on never, so the timer wins", "Nadie envía por never, así que gana el temporizador", "never にはだれも送らないのでタイマーが勝つ")),
    p(
      "Two special cases. A nil channel (declared but never made) blocks forever, so its case is never ready; setting a channel variable to nil is a way to switch a case off. And select {} with no cases waits forever; if no other goroutine is alive, that is a deadlock.",
      "Dos casos especiales. Un canal nil (declarado pero nunca creado con make) bloquea para siempre, así que su case nunca está listo; poner una variable de canal en nil sirve para apagar un case. Y select {} sin cases espera para siempre; si no hay otra goroutine viva, es un deadlock.",
      "特別な場合が2つ。nil チャネル（宣言だけで make していない）は永遠に止まるので、その case は準備できない。変数を nil にすれば case を止められる。case のない select {} は永遠に待ち、ほかに goroutine がいなければデッドロック。",
    ),
  ),
  note("context", L("context: cancel and timeouts", "context: cancelar y timeouts", "context：キャンセルとタイムアウト"),
    p(
      "A context.Context carries a stop signal across goroutines and function calls. context.Background() is the empty root. context.WithCancel(parent) returns a new ctx and a cancel function. Calling cancel() closes ctx.Done(), and ctx.Err() changes from nil to context.Canceled.",
      "Un context.Context lleva una señal de parada entre goroutines y llamadas. context.Background() es la raíz vacía. context.WithCancel(parent) devuelve un ctx nuevo y una función cancel. Llamar a cancel() cierra ctx.Done(), y ctx.Err() pasa de nil a context.Canceled.",
      "context.Context は goroutine や関数呼び出しをまたいで止める合図を運ぶ。context.Background() は空の根。context.WithCancel(parent) は新しい ctx と cancel 関数を返す。cancel() で ctx.Done() が閉じ、ctx.Err() は nil から context.Canceled に変わる。",
    ),
    ex(go`
      ctx, stop := context.WithCancel(context.Background())
      done := make(chan bool)
      go func() {
        <-ctx.Done()
        fmt.Println("worker saw:", ctx.Err())
        done <- true
      }()
      stop()
      <-done`, "worker saw: context canceled",
      L("The goroutine wakes up when Done closes", "La goroutine despierta cuando Done se cierra", "Done が閉じると goroutine が起きる")),
    p(
      "context.WithTimeout(parent, d) and WithDeadline cancel themselves when time runs out, and Err becomes context.DeadlineExceeded, which prints as context deadline exceeded. Still write defer cancel() right away: it frees the timer early if the work finishes first.",
      "context.WithTimeout(parent, d) y WithDeadline se cancelan solos cuando se acaba el tiempo, y Err pasa a context.DeadlineExceeded, que se imprime como context deadline exceeded. Igual escribe defer cancel() enseguida: libera el temporizador antes si el trabajo termina primero.",
      "context.WithTimeout(parent, d) や WithDeadline は時間切れで自分からキャンセルし、Err は context.DeadlineExceeded（表示は context deadline exceeded）になる。それでもすぐ defer cancel() を書こう。先に仕事が終われば早めにタイマーを片づける。",
    ),
    ex(go`
      ctx, cancel := context.WithTimeout(context.Background(), time.Second)
      defer cancel()
      select {
      case <-ctx.Done():
        fmt.Println(ctx.Err())
      case <-time.After(5 * time.Millisecond):
        fmt.Println("finished first")
      }`, "finished first",
      L("The work beat the one-second deadline", "El trabajo le ganó al plazo de un segundo", "仕事が1秒の期限より先に終わった")),
    p(
      "Contexts form a tree. Canceling a parent cancels every context derived from it, all the way down; canceling a child never affects its parent. That's how one cancel can stop a whole request with all its helpers.",
      "Los contextos forman un árbol. Cancelar a un padre cancela todo contexto derivado de él, hasta abajo; cancelar a un hijo nunca afecta al padre. Así un solo cancel detiene una petición entera con todos sus ayudantes.",
      "context は木になる。親をキャンセルすると、そこから作ったものが下まで全部キャンセルされる。子をキャンセルしても親には影響しない。だから1回の cancel でリクエスト全体を止められる。",
    ),
    ex(go`
      root, cancelRoot := context.WithCancel(context.Background())
      leaf, cancelLeaf := context.WithCancel(root)
      cancelLeaf()
      fmt.Println(root.Err(), leaf.Err())
      cancelRoot()`, "<nil> context canceled",
      L("Canceling the child leaves the parent running", "Cancelar al hijo deja al padre en marcha", "子をキャンセルしても親は動いたまま")),
    p(
      "Conventions: ctx is the first parameter of a function, named ctx, and is not stored in struct fields. A worker that sends in a loop selects on <-ctx.Done() next to its send, so it can return (and close its output) as soon as the work is canceled.",
      "Convenciones: ctx es el primer parámetro de una función, se llama ctx y no se guarda en campos de struct. Un worker que envía en un bucle hace select sobre <-ctx.Done() junto a su envío, para poder volver (y cerrar su salida) en cuanto se cancele el trabajo.",
      "決まりごと：ctx は関数の最初の引数で、名前は ctx、struct のフィールドにはしまわない。ループで送る worker は、送信と並べて <-ctx.Done() を select し、キャンセルされたらすぐ戻って出力を閉じる。",
    ),
  ),
];

const selectContext: LessonDef = {
  slug: "select-and-context",
  title: L("Crossroads and recall", "Cruces y retirada", "分かれ道と帰還命令"),
  concept: "select",
  mode: "lesson",
  xp: 95,
  enemy: "go/deadlock-snail",
  enemyName: L("STUCK SNAIL", "CARACOL ATASCADO", "立ち往生カタツムリ"),
  beats: [
    say(L(
      "select is a crossroads of channels: it waits until one case is ready and runs it. With default, it never waits.",
      "select es un cruce de canales: espera a que un case esté listo y lo ejecuta. Con default, nunca espera.",
      "select はチャネルの分かれ道。準備できた case を1つ実行する。default があれば待たないよ。",
    )),
    {
      kind: "act",
      prompt: L("Stand at the crossroads and check the tunnel", "Párate en el cruce y revisa el túnel", "分かれ道でトンネルを確かめよう"),
      steps: [
        { label: L("TUNNEL", "TÚNEL", "トンネル"), line: "ch := make(chan int)", effects: [{ t: "tag", actor: "hero", text: "ch" }] },
        { label: L("CROSSROADS", "CRUCE", "分かれ道"), line: "select {" },
        { label: L("TRY ch", "PROBAR ch", "ch を試す"), line: "case v := <-ch: fmt.Println(v)", effects: [{ t: "say", actor: "hero", text: L("Nobody there", "No hay nadie", "だれもいない") }] },
        { label: L("DEFAULT", "DEFAULT", "default"), line: 'default: fmt.Println("no value")', effects: [{ t: "print", text: "no value" }], output: "no value" },
        { label: L("CLOSE", "CERRAR", "とじる"), line: "}" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        ch := make(chan int)
        select {
        case v := <-ch:
          fmt.Println(v)
        default:
          fmt.Println("no value")
        }`,
      options: ["no value", "0", DEADLOCK],
      answer: 0,
      output: "no value",
      check: { compiles: true, stdout: "no value" },
      explain: L("Nobody is sending on ch, so the receive is not ready and default runs right away.", "Nadie envía por ch, así que recibir no está listo y default corre enseguida.", "ch にだれも送っていないので受信は準備できず、すぐ default が動く。"),
      hint: L("Is anyone sending on ch? When no case is ready, which branch runs?", "¿Alguien envía por ch? Si ningún case está listo, ¿qué rama corre?", "ch にだれか送っている？準備できた case がないとき、どの分岐が動く？"),
      note: "select",
      win: [{ t: "print", text: "no value" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        a := make(chan string, 1)
        b := make(chan string, 1)
        b <- "B"
        select {
        case v := <-a:
          fmt.Println(v)
        case v := <-b:
          fmt.Println(v)
        }`,
      options: ["B", DEADLOCK, '""'],
      answer: 0,
      output: "B",
      check: { compiles: true, stdout: "B" },
      explain: L("Only b has a value, so only that case is ready. (If several are ready, select picks one at random.)", "Solo b tiene un valor, así que solo ese case está listo. (Si hay varios listos, select elige uno al azar.)", "値があるのは b だけ。準備できた case が複数なら select はランダムに選ぶ。"),
      hint: L("Check which channel actually holds a value. Only a ready case can run.", "Revisa qué canal tiene de verdad un valor. Solo un case listo puede correr.", "本当に値が入っているチャネルはどれ？動けるのは準備できた case だけ。"),
      note: "select",
      win: [{ t: "print", text: "B" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        ch := make(chan int)
        select {
        case v := <-ch:
          fmt.Println(v)
        case <-time.After(10 * time.Millisecond):
          fmt.Println("timeout")
        }`,
      options: ["timeout", DEADLOCK, "0"],
      answer: 0,
      output: "timeout",
      check: { compiles: true, stdout: "timeout" },
      explain: L("time.After gives a channel that receives once the time passes. It's the classic timeout.", "time.After da un canal que recibe cuando pasa el tiempo. Es el timeout clásico.", "time.After は時間がたつと値が届くチャネル。定番のタイムアウトだよ。"),
      hint: L("Nobody sends on ch. What does time.After deliver, and when?", "Nadie envía por ch. ¿Qué entrega time.After, y cuándo?", "ch にはだれも送らない。time.After は何を、いつ届ける？"),
      note: "select",
      win: [{ t: "say", actor: "hero", text: L("Gave up waiting", "Dejé de esperar", "待つのやめた") }, { t: "print", text: "timeout" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var a chan int
        b := make(chan int, 1)
        b <- 2
        select {
        case v := <-a:
          fmt.Println("a", v)
        case v := <-b:
          fmt.Println("b", v)
        }`,
      options: ["b 2", "a 0", PANICS],
      answer: 0,
      output: "b 2",
      check: { compiles: true, stdout: "b 2" },
      explain: L("a is a nil channel: its case is never ready. That's a handy way to switch a case off.", "a es un canal nil: su case nunca está listo. Es una forma útil de apagar un case.", "a は nil チャネルで、その case は決して準備できない。case を止める便利な方法。"),
      hint: L("a was declared but never made, so it's nil. Can a nil channel ever be ready?", "a se declaró pero nunca se creó con make, así que es nil. ¿Puede un canal nil estar listo alguna vez?", "a は宣言だけで make していないので nil。nil チャネルが準備できることはある？"),
      note: "select",
      win: [{ t: "print", text: "b 2" }],
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: go`
        select {}`,
      options: [DEADLOCK, L("It ends at once", "Termina al instante", "すぐ終わる"), NO_CE],
      answer: 0,
      check: { compiles: true, throws: "all goroutines are asleep" },
      explain: L("A select with no cases waits forever. With no other goroutine alive, the runtime stops: deadlock.", "Un select sin cases espera para siempre. Sin otra goroutine viva, el runtime se detiene: deadlock.", "case のない select は永遠に待つ。ほかに goroutine がいないのでデッドロック。"),
      hint: L("A select with zero cases has nothing that could become ready. Is anyone else running?", "Un select sin cases no tiene nada que pueda estar listo. ¿Hay alguien más corriendo?", "case が0の select には準備できるものがない。ほかに動いている goroutine は？"),
      note: "select",
      win: DEADLOCK_FX,
    },
    say(L(
      "A context.Context is a recall scroll. Call cancel() and ctx.Done() closes: every ally watching it goes home.",
      "Un context.Context es un pergamino de retirada. Llama a cancel() y ctx.Done() se cierra: todo aliado que lo mira vuelve.",
      "context.Context は帰還命令の巻物。cancel() で ctx.Done() が閉じ、見ていた仲間はみんな帰る。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        ctx, cancel := context.WithCancel(context.Background())
        fmt.Println(ctx.Err())
        cancel()
        <-ctx.Done()
        fmt.Println(ctx.Err(), errors.Is(ctx.Err(), context.Canceled))`,
      options: ["<nil>\ncontext canceled true", "<nil>\n<nil> false", "context canceled\ncontext canceled true"],
      answer: 0,
      output: "<nil>\ncontext canceled true",
      check: { compiles: true, stdout: "<nil>\ncontext canceled true" },
      explain: L("Before cancel, Err is nil. After it, Done is closed and Err is context.Canceled.", "Antes de cancel, Err es nil. Después, Done está cerrado y Err es context.Canceled.", "cancel の前は Err が nil。あとは Done が閉じ、Err は context.Canceled。"),
      hint: L("Read Err before and after cancel. What does Done closing tell you about Err?", "Lee Err antes y después de cancel. ¿Qué te dice el cierre de Done sobre Err?", "cancel の前と後で Err を読もう。Done が閉じたら Err はどうなる？"),
      note: "context",
      setup: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "ctx" }],
      win: [{ t: "banner", text: L("CANCELED", "CANCELADO", "キャンセル") }, { t: "print", text: "context canceled true" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Millisecond)
        defer cancel()
        <-ctx.Done()
        fmt.Println(ctx.Err())`,
      options: ["context deadline exceeded", "context canceled", "<nil>"],
      answer: 0,
      output: "context deadline exceeded",
      check: { compiles: true, stdout: "context deadline exceeded" },
      explain: L("WithTimeout cancels itself when time runs out, with its own error. Still call cancel to free it early.", "WithTimeout se cancela solo al acabarse el tiempo, con su propio error. Igual llama a cancel para liberarlo.", "WithTimeout は時間切れで自動キャンセル、専用のエラー。それでも cancel は呼ぼう。"),
      hint: L("Nobody calls cancel before Done closes here. Why did this context end?", "Aquí nadie llama a cancel antes de que Done se cierre. ¿Por qué terminó este contexto?", "ここでは Done が閉じる前に cancel を呼んでいない。この context はなぜ終わった？"),
      note: "context",
      win: [{ t: "print", text: "context deadline exceeded" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        parent, cancel := context.WithCancel(context.Background())
        child, cancelChild := context.WithCancel(parent)
        defer cancelChild()
        cancel()
        <-child.Done()
        fmt.Println(child.Err())`,
      options: ["context canceled", "<nil>", DEADLOCK],
      answer: 0,
      output: "context canceled",
      check: { compiles: true, stdout: "context canceled" },
      explain: L("Canceling a parent cancels all its children. The recall reaches the whole family.", "Cancelar un padre cancela a todos sus hijos. La retirada llega a toda la familia.", "親をキャンセルすると子もすべてキャンセル。命令は家族全員に届く。"),
      hint: L("child was made from parent. What happens to children when their parent is canceled?", "child se creó a partir de parent. ¿Qué les pasa a los hijos cuando se cancela al padre?", "child は parent から作られた。親がキャンセルされると子はどうなる？"),
      note: "context",
      win: [{ t: "print", text: "context canceled" }],
    },
    {
      kind: "predict",
      prompt: L("Where does ctx go in a function?", "¿Dónde va ctx en una función?", "ctx は関数のどこに置く？"),
      code: go`
        func Fetch(___, url string) error`,
      options: [L("First parameter", "Primer parámetro", "最初の引数"), L("Last parameter", "Último parámetro", "最後の引数"), L("In a struct field", "En un campo de struct", "struct のフィールド")],
      answer: 0,
      explain: L("Go convention: ctx context.Context is the first parameter, and is not stored inside structs.", "Convención de Go: ctx context.Context es el primer parámetro, y no se guarda dentro de structs.", "Go の決まり：ctx context.Context は最初の引数。struct の中にはしまわない。"),
      hint: L("Think of standard library calls like db.QueryContext(ctx, ...). Where does ctx sit?", "Piensa en llamadas de la biblioteca estándar como db.QueryContext(ctx, ...). ¿Dónde va ctx?", "db.QueryContext(ctx, ...) のような標準ライブラリを思い出そう。ctx はどこにある？"),
      note: "context",
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        func worker(ctx context.Context, out chan<- int) {
          defer close(out)
          for i := 0; ; i++ {
            select {
            case <-ctx.Done():
              return
            case out <- i:
            }
          }
        }

        func main() {
          ctx, cancel := context.WithCancel(context.Background())
          out := make(chan int)
          go worker(ctx, out)
          for i := 0; i < 3; i++ {
            fmt.Print(<-out, " ")
          }
          cancel()
          for range out {
          }
          fmt.Println("stopped")
        }`,
      options: ["0 1 2 stopped", "0 1 2", DEADLOCK],
      answer: 0,
      output: "0 1 2 stopped",
      check: { compiles: true, stdout: "0 1 2 stopped" },
      explain: L("The worker sends until ctx is canceled, then returns and closes out, so the last range ends.", "El worker envía hasta que ctx se cancela; luego vuelve y cierra out, así que el último range termina.", "worker は ctx のキャンセルまで送り、戻って out を閉じる。だから最後の range も終わる。"),
      hint: L("Follow the worker after cancel: which case wins, and what does its defer do to out?", "Sigue al worker tras cancel: ¿qué case gana y qué hace su defer con out?", "cancel のあとの worker を追おう。どの case が勝ち、defer は out に何をする？"),
      note: "context",
      win: [{ t: "exit", actor: "ally" }, { t: "print", text: "0 1 2 stopped" }],
    },
    {
      kind: "run",
      prompt: L("The service never answers. Print timeout: gave up instead", "El servicio nunca responde. Imprime timeout: gave up", "返事が来ない。timeout: gave up と表示させよう"),
      starter: go`
        package main

        import "fmt"

        func main() {
          results := make(chan string)
          go func() {
            // the slow service never answers
          }()
          fmt.Println(<-results)
        }
      `,
      solution: go`
        package main

        import (
          "fmt"
          "time"
        )

        func main() {
          results := make(chan string)
          go func() {
            // the slow service never answers
          }()
          select {
          case r := <-results:
            fmt.Println(r)
          case <-time.After(50 * time.Millisecond):
            fmt.Println("timeout: gave up")
          }
        }
      `,
      expect: "timeout: gave up",
      fallback: [String.raw`time\.After\(`, String.raw`context\.WithTimeout\(`],
      explain: L("Wrap the receive in a select with a time.After case, so main stops waiting after a while.", "Pon la recepción en un select con un case time.After, así main deja de esperar al rato.", "受信を select に入れ、time.After の case を足そう。しばらくで待つのをやめる。"),
      hint: L("A plain receive waits forever. Race it against a timer inside a select.", "Una recepción simple espera para siempre. Ponla a competir con un temporizador dentro de un select.", "ただの受信は永遠に待つ。select の中でタイマーと競わせよう。"),
      note: "select",
    },
  ],
  notes: selectNotes,
};

// ─── 4.4 One key for the treasure: mutexes and races ───────────────────────
const mutexNotes: NoteDef[] = [
  note("data-races", L("Data races", "Data races", "データ競合"),
    p(
      "A data race happens when two goroutines access the same variable at the same time, at least one of them writes, and nothing synchronizes them. Even count++ is three steps (read, add, write), so two goroutines can interleave and lose updates. The result is unpredictable.",
      "Un data race ocurre cuando dos goroutines acceden a la misma variable a la vez, al menos una escribe, y nada las sincroniza. Incluso count++ son tres pasos (leer, sumar, escribir), así que dos goroutines pueden intercalarse y perder actualizaciones. El resultado es impredecible.",
      "データ競合は、2つの goroutine が同時に同じ変数に触り、少なくとも片方が書き、何も同期していないときに起きる。count++ でさえ読む・足す・書くの3手なので、交互に入りこんで更新が消える。結果は予測できない。",
    ),
    p(
      "A racy program can print the right answer a thousand times and fail on the next run or on another machine, so \"it works for me\" proves nothing. Reading is not safe either while someone else may be writing.",
      "Un programa con race puede imprimir la respuesta correcta mil veces y fallar en la siguiente ejecución o en otra máquina, así que \"a mí me funciona\" no prueba nada. Leer tampoco es seguro mientras otro puede estar escribiendo.",
      "競合のあるプログラムは千回正しく表示しても、次の実行や別のマシンで失敗しうる。「自分の環境では動く」は何の証明にもならない。だれかが書いているかもしれない間は、読むのも安全ではない。",
    ),
    p(
      "Go ships a race detector. Add -race to go run, go test or go build and the program watches its own memory accesses; when two goroutines collide it prints WARNING: DATA RACE with both stack traces. It only sees races that actually happen during that run, so use it in your tests.",
      "Go trae un detector de races. Agrega -race a go run, go test o go build y el programa vigila sus propios accesos a memoria; cuando dos goroutines chocan imprime WARNING: DATA RACE con ambas trazas. Solo ve los races que ocurren en esa ejecución, así que úsalo en tus tests.",
      "Go には競合検出器がある。go run・go test・go build に -race をつけると、プログラムが自分のメモリアクセスを見張り、ぶつかると両方のスタックつきで WARNING: DATA RACE と表示する。その実行で起きた競合しか見えないので、テストで使おう。",
    ),
    p(
      "Three fixes: guard the variable with a sync.Mutex, use the sync/atomic types for simple counters, or let only one goroutine own the data and send it values through a channel: \"share memory by communicating\".",
      "Tres soluciones: proteger la variable con un sync.Mutex, usar los tipos de sync/atomic para contadores simples, o dejar que una sola goroutine sea dueña del dato y enviarle valores por un canal: \"comparte memoria comunicándote\".",
      "直し方は3つ：sync.Mutex で守る、単純なカウンターなら sync/atomic の型を使う、データを1つの goroutine だけに持たせてチャネルで値を送る（「通信でメモリを共有する」）。",
    ),
    ex(go`
      hits := make(chan int)
      go func() { hits <- 1; hits <- 1; hits <- 1; close(hits) }()
      total := 0
      for h := range hits {
        total += h
      }
      fmt.Println(total)`, "3",
      L("Only main touches total; values arrive by channel", "Solo main toca total; los valores llegan por canal", "total に触るのは main だけ。値はチャネルで届く")),
  ),
  note("mutex", L("sync.Mutex: one key at a time", "sync.Mutex: una llave a la vez", "sync.Mutex：鍵はひとつ"),
    p(
      "A sync.Mutex is a lock with a single key. mu.Lock() takes the key, waiting if someone else has it; mu.Unlock() hands it back. The code between them is the critical section: only one goroutine at a time can be inside, so no update is lost.",
      "Un sync.Mutex es un candado con una sola llave. mu.Lock() toma la llave, esperando si otro la tiene; mu.Unlock() la devuelve. El código entre ambos es la sección crítica: solo una goroutine a la vez puede estar dentro, así que no se pierde ninguna actualización.",
      "sync.Mutex は鍵が1本だけの錠。mu.Lock() で鍵を取り（だれかが持っていれば待つ）、mu.Unlock() で返す。その間がクリティカルセクションで、一度に1つの goroutine しか入れないので更新は消えない。",
    ),
    ex(go`
      var mu sync.Mutex
      var wg sync.WaitGroup
      score := 0
      for i := 0; i < 20; i++ {
        wg.Go(func() { mu.Lock(); score += 3; mu.Unlock() })
      }
      wg.Wait()
      fmt.Println(score)`, "60",
      L("Every update happens while holding the key", "Cada actualización ocurre con la llave tomada", "どの更新も鍵を持ったまま行う")),
    p(
      "The habit: write defer mu.Unlock() on the line right after mu.Lock(). The key then comes back however the function ends: a normal return, an early return in an if, or a panic.",
      "La costumbre: escribe defer mu.Unlock() en la línea justo después de mu.Lock(). Así la llave vuelve sin importar cómo termine la función: un return normal, un return temprano en un if o un panic.",
      "習慣：mu.Lock() のすぐ次の行に defer mu.Unlock() と書く。そうすれば、ふつうの return でも、if の中の早い return でも、panic でも鍵が戻る。",
    ),
    ex(go`
      var mu sync.Mutex
      stock := map[string]int{"apple": 2}
      take := func(item string) bool {
        mu.Lock()
        defer mu.Unlock()
        if stock[item] == 0 { return false }
        stock[item]--
        return true
      }
      fmt.Println(take("apple"), take("apple"), take("apple"))`, "true true false",
      L("The early return still unlocks, thanks to defer", "El return temprano igual desbloquea, gracias a defer", "早い return でも defer のおかげで鍵が戻る")),
    p(
      "A Go mutex is not reentrant: a goroutine that already holds the key and calls Lock again waits for itself forever. This often hides in a locked method that calls another locked method. And Unlock on a mutex that isn't locked is a fatal error (sync: unlock of unlocked mutex) that recover can't catch.",
      "Un mutex de Go no es reentrante: una goroutine que ya tiene la llave y vuelve a llamar a Lock se espera a sí misma para siempre. Suele esconderse en un método bloqueado que llama a otro método bloqueado. Y Unlock sobre un mutex no bloqueado es un error fatal (sync: unlock of unlocked mutex) que recover no atrapa.",
      "Go の mutex は再入できない。鍵を持ったままもう一度 Lock すると、自分自身を永遠に待つ。ロックするメソッドが別のロックするメソッドを呼ぶところによく隠れている。ロックしていない mutex の Unlock は致命的エラー（sync: unlock of unlocked mutex）で、recover でも防げない。",
    ),
    crash(go`
      type Bank struct {
        mu  sync.Mutex
        sum int
      }

      func (b *Bank) Total() int { b.mu.Lock(); defer b.mu.Unlock(); return b.sum }
      func (b *Bank) Report() int { b.mu.Lock(); defer b.mu.Unlock(); return b.Total() }

      func main() { var b Bank; fmt.Println(b.Report()) }`, "all goroutines are asleep",
      L("Report holds the key and Total asks for it again", "Report tiene la llave y Total la pide otra vez", "Report が鍵を持ったまま Total がまた求める")),
  ),
  note("sync-tools", L("RWMutex, Once and atomic", "RWMutex, Once y atomic", "RWMutex・Once・atomic"),
    p(
      "sync.RWMutex has two kinds of key. RLock/RUnlock is for readers, and many readers may hold it at the same time. Lock/Unlock is for a writer and is exclusive: it waits until all readers have left, and blocks new ones meanwhile. Use it when reads are much more common than writes.",
      "sync.RWMutex tiene dos tipos de llave. RLock/RUnlock es para lectores, y muchos lectores pueden tenerla a la vez. Lock/Unlock es para un escritor y es exclusiva: espera a que salgan todos los lectores y bloquea a los nuevos mientras tanto. Úsalo cuando las lecturas son mucho más comunes que las escrituras.",
      "sync.RWMutex には2種類の鍵がある。RLock/RUnlock は読む人用で、何人でも同時に持てる。Lock/Unlock は書く人用で独占。読む人が全員出るまで待ち、その間は新しい読む人も止める。読むほうがずっと多いときに使う。",
    ),
    ex(go`
      var rw sync.RWMutex
      prices := map[string]int{"tea": 3}
      read := func(k string) int {
        rw.RLock()
        defer rw.RUnlock()
        return prices[k]
      }
      rw.Lock(); prices["tea"] = 4; rw.Unlock()
      fmt.Println(read("tea"))`, "4",
      L("Readers share RLock; the writer takes Lock alone", "Los lectores comparten RLock; el escritor toma Lock solo", "読む人は RLock を共有、書く人は Lock を独占")),
    p(
      "sync.Once runs a setup exactly one time: once.Do(f) calls f the first time, and every later Do does nothing, even from many goroutines and even with a different function. sync.OnceValue(f) returns a function that computes f's result on the first call and returns the remembered result after that.",
      "sync.Once ejecuta una preparación exactamente una vez: once.Do(f) llama a f la primera vez, y cada Do posterior no hace nada, incluso desde muchas goroutines e incluso con otra función. sync.OnceValue(f) devuelve una función que calcula el resultado de f en la primera llamada y después devuelve el resultado recordado.",
      "sync.Once は準備をちょうど1回だけ行う。once.Do(f) は最初だけ f を呼び、あとの Do は何もしない。goroutine がたくさんでも、別の関数を渡しても同じ。sync.OnceValue(f) は、最初の呼び出しで f の結果を計算し、あとは覚えた結果を返す関数を返す。",
    ),
    ex(go`
      var once sync.Once
      for _, who := range []string{"ana", "ben"} {
        once.Do(func() { fmt.Println("welcome", who) })
        fmt.Println("hi", who)
      }`, "welcome ana\nhi ana\nhi ben",
      L("The welcome runs only on the first Do", "La bienvenida corre solo en el primer Do", "welcome は最初の Do だけ")),
    p(
      "The sync/atomic types (atomic.Int64, atomic.Int32, atomic.Bool...) update a single value in one indivisible step with Add, Load, Store and CompareAndSwap. They're perfect for counters and flags. When several fields must change together, use a mutex instead.",
      "Los tipos de sync/atomic (atomic.Int64, atomic.Int32, atomic.Bool...) actualizan un solo valor en un paso indivisible con Add, Load, Store y CompareAndSwap. Son perfectos para contadores y banderas. Cuando varios campos deben cambiar juntos, usa un mutex.",
      "sync/atomic の型（atomic.Int64・atomic.Int32・atomic.Bool など）は、Add・Load・Store・CompareAndSwap で1つの値を分けられない1手で更新する。カウンターやフラグにぴったり。複数のフィールドをいっしょに変えるなら mutex を使う。",
    ),
    ex(go`
      var ready atomic.Bool
      var hits atomic.Int32
      hits.Add(2)
      hits.Add(3)
      ready.Store(true)
      fmt.Println(hits.Load(), ready.Load())`, "5 true",
      L("Add, Store and Load: no mutex needed", "Add, Store y Load: sin mutex", "Add・Store・Load なら mutex はいらない")),
  ),
];

const mutexes: LessonDef = {
  slug: "mutexes-and-races",
  title: L("One key for the treasure", "Una llave para el tesoro", "宝の鍵はひとつ"),
  concept: "mutex",
  mode: "lesson",
  xp: 95,
  enemy: "go/race-twins",
  enemyName: L("RACE TWINS", "GEMELOS RACE", "レース双子"),
  beats: [
    say(L(
      "A DATA RACE: two goroutines touch the same memory at once, at least one writing, with no sync. Results become random.",
      "Un DATA RACE: dos goroutines tocan la misma memoria a la vez, al menos una escribe, sin sincronizar. El resultado es azar.",
      "データ競合：2つの goroutine が同時に同じメモリに触り、片方が書く。同期なしだと結果はでたらめ。",
    )),
    {
      kind: "predict",
      prompt: L("Is this a data race?", "¿Es esto un data race?", "これはデータ競合？"),
      code: go`
        count := 0
        for i := 0; i < 2; i++ {
          go func() { count++ }()
        }`,
      options: [L("Yes", "Sí", "はい"), L("No", "No", "いいえ")],
      answer: 0,
      explain: L("Two goroutines write count with nothing guarding it. Its value is unpredictable, even if it looks right.", "Dos goroutines escriben count sin nada que lo proteja. Su valor es impredecible, aunque parezca bien.", "2つの goroutine が守りなしで count に書く。合って見えても値は予測できない。"),
      hint: L("Two goroutines, one variable, at least one write. Is anything coordinating them?", "Dos goroutines, una variable, al menos una escritura. ¿Algo las coordina?", "goroutine が2つ、変数が1つ、書き込みあり。何かで調整している？"),
      note: "data-races",
      setup: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "count" }],
      win: [{ t: "say", actor: "enemy", text: L("Both grab it!", "¡Lo agarramos!", "同時につかむ！") }, { t: "shake" }],
    },
    {
      kind: "pick",
      prompt: L("Which flag finds data races?", "¿Qué flag encuentra data races?", "データ競合を見つけるフラグは？"),
      code: go`
        // in the terminal
        go run ___ main.go`,
      options: ["-race", "-deadlock", "-vet"],
      answer: 0,
      explain: L("go run -race and go test -race add the race detector, which reports WARNING: DATA RACE.", "go run -race y go test -race activan el detector de races, que avisa WARNING: DATA RACE.", "go run -race や go test -race で競合検出器が動き、WARNING: DATA RACE と知らせる。"),
      hint: L("It's a build flag that turns on Go's built-in detector for the problem this lesson is about.", "Es un flag de compilación que activa el detector integrado de Go para el problema de esta lección.", "このレッスンの問題を見つける、Go 組み込みの検出器をオンにするフラグ。"),
      note: "data-races",
    },
    say(L(
      "The fix: a sync.Mutex is the ONE key to the treasure. Lock() takes it, Unlock() hands it back. Others wait their turn.",
      "La solución: un sync.Mutex es la ÚNICA llave del tesoro. Lock() la toma, Unlock() la devuelve. Los demás esperan turno.",
      "解決策：sync.Mutex は宝のたった1つの鍵。Lock() で取り、Unlock() で返す。ほかは順番待ち。",
    )),
    {
      kind: "act",
      prompt: L("Guard the treasure with one key", "Protege el tesoro con una llave", "鍵ひとつで宝を守ろう"),
      steps: [
        { label: L("THE KEY", "LA LLAVE", "鍵"), line: "var mu sync.Mutex", effects: [{ t: "item", kind: "key", holder: "hero" }, { t: "tag", actor: "hero", text: "mu" }] },
        { label: L("THE GEM", "LA GEMA", "宝石"), line: "count := 0", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "count", value: "0" }] },
        { label: L("LOCK", "LOCK", "Lock"), line: "mu.Lock()", effects: [{ t: "say", actor: "hero", text: L("My turn!", "¡Mi turno!", "ぼくの番！") }] },
        { label: L("ADD", "SUMAR", "足す"), line: "count++", effects: [{ t: "value", actor: "ally", text: "1" }] },
        { label: L("UNLOCK", "UNLOCK", "Unlock"), line: "mu.Unlock()", effects: [{ t: "say", actor: "hero", text: L("Next!", "¡Siguiente!", "次どうぞ！") }] },
        { label: L("SHOW", "MOSTRAR", "表示"), line: "fmt.Println(count)", effects: [{ t: "print", text: "1" }], output: "1" },
      ],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var mu sync.Mutex
        var wg sync.WaitGroup
        count := 0
        for i := 0; i < 100; i++ {
          wg.Add(1)
          go func() {
            defer wg.Done()
            mu.Lock()
            count++
            mu.Unlock()
          }()
        }
        wg.Wait()
        fmt.Println(count)`,
      options: ["100", L("Random", "Al azar", "でたらめ"), "1"],
      answer: 0,
      output: "100",
      check: { compiles: true, stdout: "100" },
      explain: L("Only the goroutine holding the key touches count, so no increment is lost: always 100.", "Solo la goroutine con la llave toca count, así que no se pierde ningún incremento: siempre 100.", "鍵を持つ goroutine だけが count に触るので、足し算は消えない。いつも 100。"),
      hint: L("Every increment happens while holding the key, and main waits for all. Can any increment get lost?", "Cada incremento ocurre con la llave tomada, y main espera a todos. ¿Puede perderse algún incremento?", "足し算は全部、鍵を持ったまま行い、main は全員を待つ。消える足し算はある？"),
      note: "mutex",
      win: [{ t: "print", text: "100" }],
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: go`
        var mu sync.Mutex
        mu.Lock()
        mu.Lock()
        fmt.Println("locked twice")`,
      options: [DEADLOCK, "locked twice", PANICS],
      answer: 0,
      check: { compiles: true, throws: "all goroutines are asleep" },
      explain: L("A Go mutex is not reentrant: the second Lock waits for a key that its own holder never returns.", "Un mutex de Go no es reentrante: el segundo Lock espera una llave que su dueño nunca devuelve.", "Go の mutex は再入できない。2回目の Lock は、自分が返さない鍵を待ち続ける。"),
      hint: L("The second Lock waits for the key to be returned. Who is holding it?", "El segundo Lock espera que devuelvan la llave. ¿Quién la tiene?", "2回目の Lock は鍵が返るのを待つ。いま鍵を持っているのはだれ？"),
      note: "mutex",
      win: DEADLOCK_FX,
    },
    {
      kind: "predict",
      prompt: HAPPENS,
      code: go`
        var mu sync.Mutex
        mu.Unlock()`,
      options: [L("Fatal error", "Error fatal", "致命的エラー"), L("Nothing", "Nada", "何も起きない"), NO_CE],
      answer: 0,
      check: { compiles: true, throws: "unlock of unlocked mutex" },
      explain: L("Returning a key you don't hold is fatal: fatal error: sync: unlock of unlocked mutex. recover can't catch it.", "Devolver una llave que no tienes es fatal: fatal error: sync: unlock of unlocked mutex. recover no lo atrapa.", "持っていない鍵を返すと致命的エラー：sync: unlock of unlocked mutex。recover でも防げない。"),
      hint: L("Nobody called Lock. What happens when you hand back a key you never took?", "Nadie llamó a Lock. ¿Qué pasa si devuelves una llave que nunca tomaste?", "Lock はだれも呼んでいない。取っていない鍵を返すとどうなる？"),
      note: "mutex",
      win: [{ t: "shake" }],
    },
    say(L(
      "More keys: RWMutex lets many readers in at once (RLock) or one writer. sync.Once runs a setup only once.",
      "Más llaves: RWMutex deja entrar a muchos lectores a la vez (RLock) o a un solo escritor. sync.Once corre algo una sola vez.",
      "ほかの鍵：RWMutex は読む人なら何人でも (RLock)、書く人は1人。sync.Once は1回だけ実行。",
    )),
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var rw sync.RWMutex
        rw.RLock()
        rw.RLock()
        fmt.Println("two readers")
        rw.RUnlock()
        rw.RUnlock()`,
      options: ["two readers", DEADLOCK, PANICS],
      answer: 0,
      output: "two readers",
      check: { compiles: true, stdout: "two readers" },
      explain: L("Read locks can be shared: many readers may hold RLock together. Only a writer's Lock is exclusive.", "Los bloqueos de lectura se comparten: muchos lectores pueden tener RLock juntos. Solo el Lock del escritor es exclusivo.", "読み取りロックは共有できる。RLock は何人でも同時に OK。Lock だけが独占。"),
      hint: L("RLock is the readers' lock. Can several readers be inside at the same time?", "RLock es el bloqueo de lectores. ¿Pueden estar varios lectores dentro a la vez?", "RLock は読む人用のロック。読む人は同時に何人も入れる？"),
      note: "sync-tools",
      win: [{ t: "print", text: "two readers" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var once sync.Once
        for i := 0; i < 3; i++ {
          once.Do(func() { fmt.Println("init", i) })
        }`,
      options: ["init 0", "init 0\ninit 1\ninit 2", "init 2"],
      answer: 0,
      output: "init 0",
      check: { compiles: true, stdout: "init 0" },
      explain: L("once.Do runs its function the first time only. Later calls do nothing.", "once.Do ejecuta su función solo la primera vez. Las siguientes llamadas no hacen nada.", "once.Do は最初の1回だけ関数を動かす。あとは何もしない。"),
      hint: L("once.Do is called three times. How many times does it actually run a function?", "once.Do se llama tres veces. ¿Cuántas veces ejecuta de verdad una función?", "once.Do は3回呼ばれる。実際に関数を動かすのは何回？"),
      note: "sync-tools",
      win: [{ t: "print", text: "init 0" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        getConfig := sync.OnceValue(func() string {
          fmt.Println("loading")
          return "cfg"
        })
        fmt.Println(getConfig(), getConfig())`,
      options: ["loading\ncfg cfg", "loading\nloading\ncfg cfg", "cfg cfg"],
      answer: 0,
      output: "loading\ncfg cfg",
      check: { compiles: true, stdout: "loading\ncfg cfg" },
      explain: L("sync.OnceValue computes the value once and remembers it for every later call.", "sync.OnceValue calcula el valor una vez y lo recuerda para todas las llamadas siguientes.", "sync.OnceValue は値を1回だけ計算して、あとはおぼえた値を返す。"),
      hint: L("OnceValue remembers its result. How many times does the inner function run?", "OnceValue recuerda su resultado. ¿Cuántas veces corre la función de adentro?", "OnceValue は結果を覚えている。中の関数は何回動く？"),
      note: "sync-tools",
      win: [{ t: "print", text: "loading" }, { t: "print", text: "cfg cfg" }],
    },
    {
      kind: "predict",
      prompt: PRINT,
      code: go`
        var n atomic.Int64
        var wg sync.WaitGroup
        for i := 0; i < 50; i++ {
          wg.Go(func() { n.Add(1) })
        }
        wg.Wait()
        fmt.Println(n.Load())`,
      options: ["50", L("Random", "Al azar", "でたらめ"), "0"],
      answer: 0,
      output: "50",
      check: { compiles: true, stdout: "50" },
      explain: L("atomic.Int64 updates in one unbreakable step, so a simple counter needs no mutex.", "atomic.Int64 se actualiza en un solo paso indivisible, así que un contador simple no necesita mutex.", "atomic.Int64 は分けられない1手で更新する。単純なカウンターなら mutex はいらない。"),
      hint: L("n.Add happens in one indivisible step, and Wait waits for all. Can any Add be lost?", "n.Add ocurre en un paso indivisible, y Wait espera a todos. ¿Puede perderse algún Add?", "n.Add は分けられない1手で、Wait は全員を待つ。消える Add はある？"),
      note: "sync-tools",
      win: [{ t: "print", text: "50" }],
    },
    {
      kind: "type",
      prompt: L("Always hand the key back", "Devuelve siempre la llave", "鍵は必ず返そう"),
      code: go`
        var mu sync.Mutex
        total := 0
        add := func(n int) {
          mu.Lock()
          ___ mu.Unlock()
          total += n
        }
        add(2)
        add(3)
        fmt.Println(total)`,
      answer: "defer",
      check: { compiles: true, stdout: "5" },
      explain: L("defer mu.Unlock() right after Lock guarantees the key comes back, even on early return or panic.", "defer mu.Unlock() justo tras Lock asegura que la llave vuelva, incluso con return temprano o panic.", "Lock の直後に defer mu.Unlock()。早めの return や panic でも鍵が戻る。"),
      hint: L("You want Unlock to run when the function returns, no matter how. Which keyword schedules that?", "Quieres que Unlock corra al volver la función, pase lo que pase. ¿Qué palabra clave lo programa?", "関数が戻るとき必ず Unlock を動かしたい。それを予約するキーワードは？"),
      note: "mutex",
      win: [{ t: "print", text: "5" }],
    },
    {
      kind: "run",
      prompt: L("Inc keeps the key forever. Make it print count: 3", "Inc se queda la llave. Haz que imprima count: 3", "Inc が鍵を返さない。count: 3 と表示させよう"),
      starter: go`
        package main

        import (
          "fmt"
          "sync"
        )

        type Counter struct {
          mu sync.Mutex
          n  int
        }

        func (c *Counter) Inc() {
          c.mu.Lock()
          c.n++
        }

        func main() {
          var c Counter
          for i := 0; i < 3; i++ {
            c.Inc()
          }
          fmt.Println("count:", c.n)
        }
      `,
      solution: go`
        package main

        import (
          "fmt"
          "sync"
        )

        type Counter struct {
          mu sync.Mutex
          n  int
        }

        func (c *Counter) Inc() {
          c.mu.Lock()
          defer c.mu.Unlock()
          c.n++
        }

        func main() {
          var c Counter
          for i := 0; i < 3; i++ {
            c.Inc()
          }
          fmt.Println("count:", c.n)
        }
      `,
      expect: "count: 3",
      fallback: [String.raw`c\.mu\.Unlock\(\)`],
      explain: L("The second Inc waits for a key nobody returned: deadlock. Add defer c.mu.Unlock() after Lock.", "El segundo Inc espera una llave que nadie devolvió: deadlock. Agrega defer c.mu.Unlock() tras Lock.", "2回目の Inc は返されない鍵を待ってデッドロック。Lock のあとに defer c.mu.Unlock()。"),
      hint: L("Inc takes the key but never gives it back. Hand it back every time Inc finishes.", "Inc toma la llave pero nunca la devuelve. Devuélvela cada vez que Inc termine.", "Inc は鍵を取るが返さない。Inc が終わるたびに返そう。"),
      note: "mutex",
    },
  ],
  notes: mutexNotes,
};

// ─── Boss: The Deadlock Snail ──────────────────────────────────────────────
const bossNotes: NoteDef[] = [
  note("recap-channels", L("Recap: channels", "Repaso: canales", "復習：チャネル"),
    p(
      "Unbuffered sends wait for a receiver; buffered sends wait only when the box is full. close(ch) means no more values; range drains what is left and stops only after close. Without close, range waits forever. After close, v, ok := <-ch gives the zero value and false.",
      "Los envíos sin buffer esperan a un receptor; con buffer solo esperan si la caja está llena. close(ch) significa que no hay más valores; range saca lo que queda y solo se detiene tras close. Sin close, range espera para siempre. Tras close, v, ok := <-ch da el valor cero y false.",
      "バッファなしの送信は受け手を待ち、バッファつきは満杯のときだけ待つ。close(ch) は「もう値はない」。range は残りを読み、close のあとでだけ止まる。close がなければ永遠に待つ。close 後の v, ok := <-ch はゼロ値と false。",
    ),
    p(
      "A pipeline chains stages: each stage receives from the previous channel, sends results on its own output, and closes that output when its input is drained. The close travels down the chain, so the final range ends cleanly.",
      "Una tubería encadena etapas: cada etapa recibe del canal anterior, envía resultados por su propia salida y cierra esa salida cuando su entrada se vacía. El close viaja por la cadena, así que el range final termina limpio.",
      "パイプラインは段をつなぐ。各段は前のチャネルから受け、自分の出口に結果を送り、入口が空になったら出口を閉じる。close が順に伝わるので、最後の range はきれいに終わる。",
    ),
    ex(go`
      func double(in <-chan int) <-chan int {
        out := make(chan int)
        go func() { defer close(out); for v := range in { out <- v * 2 } }()
        return out
      }

      func main() {
        src := make(chan int, 2)
        src <- 5; src <- 6; close(src)
        for v := range double(src) { fmt.Print(v, ";") }
      }`, "10;12;",
      L("One stage: receive, transform, send, close", "Una etapa: recibe, transforma, envía, cierra", "1つの段：受ける・変える・送る・閉じる")),
  ),
  note("recap-select", L("Recap: select and context", "Repaso: select y context", "復習：select と context"),
    p(
      "select runs one ready case; with default it never waits. A nil channel's case is never ready. A closed channel is always ready to receive, which is why a canceled ctx.Done() case wins over default.",
      "select ejecuta un case listo; con default nunca espera. El case de un canal nil nunca está listo. Un canal cerrado siempre está listo para recibir, por eso el case de un ctx.Done() cancelado le gana a default.",
      "select は準備できた case を1つ実行し、default があれば待たない。nil チャネルの case は準備できない。閉じたチャネルはいつでも受信できるので、キャンセル済みの ctx.Done() の case は default に勝つ。",
    ),
    ex(go`
      ctx, cancel := context.WithCancel(context.Background())
      defer cancel()
      select {
      case <-ctx.Done():
        fmt.Println("stopped")
      default:
        fmt.Println("busy")
      }`, "busy",
      L("Not canceled yet: Done isn't ready, default runs", "Aún sin cancelar: Done no está listo, corre default", "まだキャンセル前：Done は準備できず default が動く")),
    p(
      "cancel() closes Done and sets Err to context.Canceled; a timeout sets context.DeadlineExceeded. Canceling a parent cancels its children.",
      "cancel() cierra Done y pone Err en context.Canceled; un timeout pone context.DeadlineExceeded. Cancelar a un padre cancela a sus hijos.",
      "cancel() は Done を閉じ、Err を context.Canceled にする。タイムアウトなら context.DeadlineExceeded。親をキャンセルすると子もキャンセルされる。",
    ),
  ),
  note("recap-sync", L("Recap: WaitGroup and Mutex", "Repaso: WaitGroup y Mutex", "復習：WaitGroup と Mutex"),
    p(
      "WaitGroup: Add before go, one Done per Add, Wait last, and always pass *sync.WaitGroup, because a copy has its own counter. A Wait that can never reach zero ends in all goroutines are asleep.",
      "WaitGroup: Add antes del go, un Done por cada Add, Wait al final, y pasa siempre *sync.WaitGroup, porque una copia tiene su propio contador. Un Wait que nunca puede llegar a cero termina en all goroutines are asleep.",
      "WaitGroup：go の前に Add、Add 1つに Done 1つ、最後に Wait。コピーは別のカウンターを持つので、必ず *sync.WaitGroup で渡す。0 にならない Wait は all goroutines are asleep で終わる。",
    ),
    p(
      "Mutex: Lock, touch the shared data, Unlock, ideally with defer right after Lock. A goroutine can't Lock a mutex it already holds; the second Lock waits forever.",
      "Mutex: Lock, tocar el dato compartido, Unlock, idealmente con defer justo tras Lock. Una goroutine no puede hacer Lock de un mutex que ya tiene; el segundo Lock espera para siempre.",
      "Mutex：Lock して共有データに触り、Unlock。できれば Lock の直後に defer で。持っている mutex をもう一度 Lock はできず、2回目は永遠に待つ。",
    ),
    ex(go`
      var mu sync.Mutex
      var wg sync.WaitGroup
      seen := []string{}
      for _, s := range []string{"a", "b"} {
        wg.Go(func() { mu.Lock(); seen = append(seen, s); mu.Unlock() })
      }
      wg.Wait()
      fmt.Println(len(seen))`, "2",
      L("WaitGroup waits, Mutex guards the shared slice", "WaitGroup espera, Mutex protege el slice compartido", "WaitGroup が待ち、Mutex が共有 slice を守る")),
  ),
];

const boss: LessonDef = {
  slug: "tower-boss",
  title: L("The Deadlock Snail", "El Caracol Deadlock", "デッドロックの大カタツムリ"),
  concept: "boss",
  mode: "boss",
  xp: 200,
  enemy: "go/deadlock-snail",
  enemyName: L("DEADLOCK SNAIL", "CARACOL DEADLOCK", "大カタツムリ"),
  beats: [
    enemySays(L(
      "I AM THE DEADLOCK SNAIL. One wrong send and the whole tower falls asleep forever. Who waits for whom?",
      "SOY EL CARACOL DEADLOCK. Un envío mal hecho y toda la torre duerme para siempre. ¿Quién espera a quién?",
      "我はデッドロックの大カタツムリ。送信ひとつ誤れば塔は永遠の眠りへ。だれがだれを待つ？",
    )),
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: go`
        ch := make(chan int, 3)
        for i := range 3 {
          ch <- i
        }
        close(ch)
        for v := range ch {
          fmt.Print(v)
        }
        fmt.Println(len(ch))`,
      options: ["0120", "0123", "012"],
      answer: 0,
      output: "0120",
      check: { compiles: true, stdout: "0120" },
      explain: L("range drains 0, 1, 2; then len(ch) is 0, printed right after.", "range saca 0, 1, 2; luego len(ch) es 0 y se imprime pegado.", "range が 0, 1, 2 を読み、そのあと len(ch) は 0。"),
      hint: L("range drains the closed channel. How many values are left afterwards, and is there a newline in between?", "range vacía el canal cerrado. ¿Cuántos valores quedan después, y hay salto de línea entre medio?", "range が閉じたチャネルを空にする。そのあと残りはいくつ？間に改行はある？"),
      note: "recap-channels",
    },
    {
      kind: "predict", time: 15, prompt: HAPPENS,
      code: go`
        ch := make(chan int)
        go func() {
          ch <- 1
          ch <- 2
        }()
        for v := range ch {
          fmt.Println(v)
        }`,
      options: [L("1, 2, then deadlock", "1, 2 y luego deadlock", "1, 2 のあとデッドロック"), L("1, 2, then it ends", "1, 2 y termina", "1, 2 で正常終了")],
      answer: 0,
      check: { compiles: true, throws: "all goroutines are asleep" },
      explain: L("No close, so range waits forever for a third value.", "Sin close, range espera para siempre un tercer valor.", "close がないので range は3つ目を永遠に待つ。"),
      hint: L("range stops only on close. Does the sender ever close?", "range solo se detiene con close. ¿El emisor cierra alguna vez?", "range は close でしか止まらない。送り手は閉じる？"),
      note: "recap-channels",
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: go`
        ch := make(chan string, 1)
        ch <- "x"
        close(ch)
        a, ok1 := <-ch
        b, ok2 := <-ch
        fmt.Println(a, ok1, b == "", ok2)`,
      options: ["x true true false", "x true false true", "x false true false"],
      answer: 0,
      output: "x true true false",
      check: { compiles: true, stdout: "x true true false" },
      explain: L("The buffered x comes first; then the closed channel gives \"\" and ok false.", "Primero sale la x guardada; luego el canal cerrado da \"\" y ok false.", "まず箱の x、そのあと閉じたチャネルは \"\" と ok false。"),
      hint: L("The buffered value comes out first. What does a closed, empty channel give next?", "El valor guardado sale primero. ¿Qué da después un canal cerrado y vacío?", "箱の値が先に出る。次に、閉じた空のチャネルは何を返す？"),
      note: "recap-channels",
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: go`
        var a chan int
        b := make(chan int, 1)
        b <- 2
        select {
        case v := <-a:
          fmt.Println("a", v)
        case v := <-b:
          fmt.Println("b", v)
        }`,
      options: ["b 2", "a 0", DEADLOCK],
      answer: 0,
      output: "b 2",
      check: { compiles: true, stdout: "b 2" },
      explain: L("A nil channel's case is never ready; only b can fire.", "El case de un canal nil nunca está listo; solo b puede ejecutarse.", "nil チャネルの case は動かない。動けるのは b だけ。"),
      hint: L("a is a nil channel. Which case could possibly be ready?", "a es un canal nil. ¿Qué case podría estar listo?", "a は nil チャネル。準備できる可能性がある case は？"),
      note: "recap-select",
    },
    {
      kind: "predict", time: 15, prompt: HAPPENS,
      code: go`
        func work(wg sync.WaitGroup) {
          defer wg.Done()
        }

        func main() {
          var wg sync.WaitGroup
          wg.Add(1)
          go work(wg)
          wg.Wait()
        }`,
      options: [DEADLOCK, L("It ends fine", "Termina bien", "正常に終わる"), NO_CE],
      answer: 0,
      check: { compiles: true, throws: "all goroutines are asleep" },
      explain: L("work got a copy of wg; the real counter never reaches 0.", "work recibió una copia de wg; el contador real nunca llega a 0.", "work は wg のコピーを受け取った。本物は 0 にならない。"),
      hint: L("work gets wg by value. Which counter reaches zero, and which one is main waiting on?", "work recibe wg por valor. ¿Qué contador llega a cero, y a cuál espera main?", "work は wg を値で受け取る。0 になるのはどれ？main が待つのはどれ？"),
      note: "recap-sync",
    },
    {
      kind: "predict", time: 15, prompt: HAPPENS,
      code: go`
        var mu sync.Mutex
        mu.Lock()
        mu.Lock()
        fmt.Println("in")`,
      options: [DEADLOCK, "in", PANICS],
      answer: 0,
      check: { compiles: true, throws: "all goroutines are asleep" },
      explain: L("Mutexes are not reentrant: the second Lock waits forever.", "Los mutex no son reentrantes: el segundo Lock espera para siempre.", "mutex は再入できない。2回目の Lock は永遠に待つ。"),
      hint: L("Can the goroutine holding the key take it a second time?", "¿Puede la goroutine que tiene la llave tomarla por segunda vez?", "鍵を持っている goroutine が、もう一度それを取れる？"),
      note: "recap-sync",
    },
    {
      kind: "predict", time: 20, prompt: PRINT,
      code: go`
        func gen(n int) <-chan int {
          out := make(chan int)
          go func() {
            defer close(out)
            for i := 1; i <= n; i++ {
              out <- i
            }
          }()
          return out
        }

        func sq(in <-chan int) <-chan int {
          out := make(chan int)
          go func() {
            defer close(out)
            for v := range in {
              out <- v * v
            }
          }()
          return out
        }

        func main() {
          sum := 0
          for v := range sq(gen(3)) {
            sum += v
          }
          fmt.Println(sum)
        }`,
      options: ["14", "6", "36"],
      answer: 0,
      output: "14",
      check: { compiles: true, stdout: "14" },
      explain: L("A pipeline: gen sends 1, 2, 3; sq squares them; 1 + 4 + 9 = 14. Each stage closes its output.", "Una tubería: gen envía 1, 2, 3; sq los eleva al cuadrado; 1 + 4 + 9 = 14. Cada etapa cierra su salida.", "パイプライン：gen が 1, 2, 3、sq が2乗して 1 + 4 + 9 = 14。各段が出口を閉じる。"),
      hint: L("Follow each value through both stages, then add up the results.", "Sigue cada valor por ambas etapas y luego suma los resultados.", "各値が2つの段を通る様子を追い、結果を足そう。"),
      note: "recap-channels",
    },
    {
      kind: "predict", time: 15, prompt: PRINT,
      code: go`
        ctx, cancel := context.WithCancel(context.Background())
        cancel()
        select {
        case <-ctx.Done():
          fmt.Println(ctx.Err())
        default:
          fmt.Println("still running")
        }`,
      options: ["context canceled", "still running", "<nil>"],
      answer: 0,
      output: "context canceled",
      check: { compiles: true, stdout: "context canceled" },
      explain: L("After cancel, Done is closed, so that case is ready and wins over default.", "Tras cancel, Done está cerrado, así que ese case está listo y gana a default.", "cancel のあと Done は閉じているので、その case が default に勝つ。"),
      hint: L("cancel ran before the select. Is the Done case ready, and does default still get a chance?", "cancel corrió antes del select. ¿El case Done está listo, y default todavía tiene oportunidad?", "cancel は select の前に動いた。Done の case は準備できている？default に出番は？"),
      note: "recap-select",
    },
    {
      kind: "type", time: 12, prompt: L("End the range cleanly", "Termina el range limpio", "range をきれいに終わらせよう"),
      code: go`
        ch := make(chan int, 2)
        ch <- 4
        ch <- 5
        ___(ch)
        for v := range ch {
          fmt.Print(v)
        }`,
      answer: "close",
      check: { compiles: true, stdout: "45" },
      explain: L("close lets range finish after the last value instead of waiting forever.", "close deja que range termine tras el último valor en vez de esperar para siempre.", "close があれば range は最後の値のあと終われる。"),
      hint: L("range needs a signal that no more values are coming. Which built-in gives it?", "range necesita una señal de que no vienen más valores. ¿Qué función incorporada la da?", "range には「もう値は来ない」という合図が必要。それを出す組み込み関数は？"),
      note: "recap-channels",
    },
    {
      kind: "order", time: 20, prompt: L("Guard the counter", "Protege el contador", "カウンターを守ろう"),
      lines: ["var mu sync.Mutex", "n := 0", "mu.Lock()", "n++", "mu.Unlock()", "fmt.Println(n)"],
      check: { compiles: true, stdout: "1" },
      explain: L("Take the key, touch the shared value, give the key back.", "Toma la llave, toca el valor compartido, devuelve la llave.", "鍵を取り、共有の値に触れ、鍵を返す。"),
      hint: L("Declarations come first. The change happens while the key is held; printing comes after it's returned.", "Las declaraciones van primero. El cambio ocurre con la llave tomada; se imprime tras devolverla.", "宣言が先。変更は鍵を持っている間に、表示は鍵を返したあと。"),
      note: "recap-sync",
    },
    enemySays(L(
      "Nobody... is asleep? Every tunnel closed, every key returned. Concurra flows again. Well dug, little gopher.",
      "¿Nadie... duerme? Cada túnel cerrado, cada llave devuelta. Concurra vuelve a fluir. Bien cavado, pequeño gopher.",
      "だれも…眠っていない？トンネルは閉じ、鍵は返された。コンカーラはまた流れだす。見事だ。",
    )),
  ],
  notes: bossNotes,
};

export const channelTower: RegionDef = {
  slug: "channel-tower",
  name: L("Channel Tower", "Torre de Canales", "チャネルの塔"),
  subtitle: L("Goroutines · channels · select · sync", "Goroutines · canales · select · sync", "goroutine・チャネル・select・sync"),
  theme: "tower",
  lessons: [goroutines, channels, selectContext, mutexes, boss],
};
