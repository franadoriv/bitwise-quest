import type { Beat, LessonDef, RegionDef, Text } from "../../../lib/content/types.ts";
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

const PRINT = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const HAPPENS = L("What happens?", "¿Qué pasa?", "どうなる？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const NO_CE = L("No: compile error", "No: error de compilación", "いいえ：コンパイルエラー");
const DEADLOCK = L("Deadlock: fatal error", "Deadlock: error fatal", "デッドロックで停止");
const PANICS = L("It panics", "Hace panic", "panic する");
const DEADLOCK_FX = [{ t: "shake" } as const, { t: "banner", text: L("DEADLOCK!", "¡DEADLOCK!", "デッドロック！") } as const];

// ─── 4.1 Allies that work in parallel: goroutines and WaitGroup ────────────
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
      win: [{ t: "shake" }],
    },
    {
      kind: "order",
      prompt: L("Start one ally and wait for it", "Lanza un aliado y espéralo", "仲間を1人出して待とう"),
      lines: ["var wg sync.WaitGroup", "wg.Add(1)", 'go func() { defer wg.Done(); fmt.Println("work") }()', "wg.Wait()"],
      check: { compiles: true, stdout: "work" },
      explain: L("Declare, Add BEFORE go, Done when the ally finishes, then Wait.", "Declara, Add ANTES del go, Done al terminar el aliado y luego Wait.", "宣言、go の前に Add、終わったら Done、最後に Wait。"),
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
    },
  ],
};

// ─── 4.2 Tunnels between allies: channels ──────────────────────────────────
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
    },
  ],
};

// ─── 4.3 Choosing a tunnel, calling everyone home: select and context ──────
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
    },
  ],
};

// ─── 4.4 One key for the treasure: mutexes and races ───────────────────────
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
    },
  ],
};

// ─── Boss: The Deadlock Snail ──────────────────────────────────────────────
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
    },
    {
      kind: "order", time: 20, prompt: L("Guard the counter", "Protege el contador", "カウンターを守ろう"),
      lines: ["var mu sync.Mutex", "n := 0", "mu.Lock()", "n++", "mu.Unlock()", "fmt.Println(n)"],
      check: { compiles: true, stdout: "1" },
      explain: L("Take the key, touch the shared value, give the key back.", "Toma la llave, toca el valor compartido, devuelve la llave.", "鍵を取り、共有の値に触れ、鍵を返す。"),
    },
    enemySays(L(
      "Nobody... is asleep? Every tunnel closed, every key returned. Concurra flows again. Well dug, little gopher.",
      "¿Nadie... duerme? Cada túnel cerrado, cada llave devuelta. Concurra vuelve a fluir. Bien cavado, pequeño gopher.",
      "だれも…眠っていない？トンネルは閉じ、鍵は返された。コンカーラはまた流れだす。見事だ。",
    )),
  ],
};

export const channelTower: RegionDef = {
  slug: "channel-tower",
  name: L("Channel Tower", "Torre de Canales", "チャネルの塔"),
  subtitle: L("Goroutines · channels · select · sync", "Goroutines · canales · select · sync", "goroutine・チャネル・select・sync"),
  theme: "tower",
  lessons: [goroutines, channels, selectContext, mutexes, boss],
};
