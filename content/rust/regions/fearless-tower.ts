import type { LessonDef, RegionDef } from "../../../lib/content/types.ts";
import { enemySays, L, say } from "../helpers.ts";

// REGION 5 · FEARLESS TOWER  (closures and move, thread::spawn and join, Arc vs Rc, Mutex and
// Arc<Mutex<T>>, RwLock, mpsc channels, Send and Sync)

const T = "use std::thread;\n";
const A = "use std::sync::Arc;\nuse std::thread;\n";
const AM = "use std::sync::{Arc, Mutex};\nuse std::thread;\n";
const CH = "use std::sync::mpsc;\nuse std::thread;\n";

/** Full program: `body` inside main, the same way the validator wraps snippets. */
const prog = (body: string) => `#![allow(unused)]\nfn main() {\n${body.split("\n").map((l) => "    " + l).join("\n")}\n}\n`;

// Shared labels and answers.
const IMPORT = L("IMPORT", "IMPORTAR", "インポート");
const CLOSE = L("CLOSE", "CERRAR", "閉じる");
const WAIT = L("WAIT", "ESPERAR", "待つ");
const READ = L("READ", "LEER", "読む");
const CREATE = L("CREATE", "CREAR", "作る");
const ANOTHER_PASS = L("ANOTHER PASS", "OTRO PASE", "通行証を追加");
const COUNT = L("COUNT", "CONTAR", "数える");
const CHEST = L("CHEST", "COFRE", "宝箱");
const LAUNCH = L("LAUNCH", "LANZAR", "起動");
const CHANNEL = L("CHANNEL", "CANAL", "チャネル");
const WHAT_PRINTS = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const YES = L("Yes", "Sí", "はい");
const NO = L("No", "No", "いいえ");
const KEEPS_WAITING = L("It keeps waiting", "Se queda esperando", "ずっと待ち続ける");
const DEADLOCK = L("Freezes: deadlock", "Se congela: deadlock", "固まる: デッドロック");
const ASK_KEY = L("Ask for the key", "Pide la llave", "鍵をもらおう");

const threads: LessonDef = {
  slug: "threads-and-move",
  title: L("Helpers in parallel", "Ayudantes en paralelo", "並行して働く助っ人"),
  concept: "concurrency",
  mode: "lesson",
  xp: 75,
  enemy: "rust/mite",
  enemyName: L("IMPATIENT BUG", "BUG IMPACIENTE", "せっかちバグ"),
  beats: [
    say(L(
      "Welcome to the Fearless Tower. Here you don't work alone: you call HELPERS that run at the same time. They're called threads.",
      "Bienvenido a la Torre Fearless. Aquí no trabajas solo: llamas AYUDANTES que corren a la vez. Se llaman hilos.",
      "フィアレスの塔へようこそ。ここでは一人で働かない。同時に動く「助っ人」を呼ぶんだ。これをスレッドと呼ぶよ。",
    )),
    say(L(
      "First, a tool: a closure is a function with no name. |x| x * 2 takes x; || { ... } takes nothing.",
      "Antes, una herramienta: un closure es una función sin nombre. |x| x * 2 recibe x; || { ... } no recibe nada.",
      "まず道具をひとつ。クロージャは名前のない関数だ。|x| x * 2 は x を受け取り、|| { ... } は何も受け取らないよ。",
    )),
    {
      kind: "predict",
      prompt: WHAT_PRINTS,
      code: 'let double = |x: i32| x * 2;\nprintln!("{}", double(4));',
      options: ["8", "4", L("Error: missing fn", "Error: falta fn", "エラー: fnがない")],
      answer: 0,
      output: "8",
      explain: L(
        "double is a closure: you call it like a function. double(4) gives 8.",
        "double es un closure: se llama como una función. double(4) da 8.",
        "double はクロージャだ。関数のように呼べるよ。double(4) は 8 になる。",
      ),
      check: { compiles: true, stdout: "8" },
    },
    {
      kind: "act",
      prompt: L("Call a helper and wait for it", "Llama a un ayudante y espéralo", "助っ人を呼んで、終わるのを待とう"),
      setup: [],
      steps: [
        { label: IMPORT, line: "use std::thread;" },
        { label: L("CALL", "LLAMAR", "呼ぶ"), line: "let h = thread::spawn(|| {", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "h" }, { t: "banner", text: L("SPAWN", "SPAWN", "SPAWN") }] },
        { label: L("WORK", "TRABAJO", "作業"), line: '    println!("Working in parallel!");', effects: [{ t: "say", actor: "ally", text: L("Working!", "¡Trabajando!", "作業中!") }] },
        { label: CLOSE, line: "});" },
        { label: WAIT, line: "h.join().unwrap();", effects: [{ t: "say", actor: "hero", text: L("I'll wait...", "Te espero...", "待ってるよ…") }, { t: "banner", text: L("JOIN", "JOIN", "JOIN") }], output: "Working in parallel!" },
      ],
    },
    say(L(
      "spawn starts the thread and returns a JoinHandle. join() waits for it to finish. Without join, main might end first.",
      "spawn lanza el hilo y devuelve un JoinHandle. join() espera a que termine. Sin join, main podría acabar antes.",
      "spawn はスレッドを起動して JoinHandle を返す。join() は終わるまで待つ。join がないと main が先に終わるかも。",
    )),
    {
      kind: "pick",
      prompt: L("Wait for the helper to finish", "Espera a que el ayudante termine", "助っ人が終わるのを待とう"),
      code: `${T}let h = thread::spawn(|| {\n    println!("done");\n});\nh.___().unwrap();`,
      options: ["join", "wait", "end"],
      answer: 0,
      explain: L(
        "join() blocks main until the thread finishes.",
        "join() bloquea a main hasta que el hilo termina.",
        "join() はスレッドが終わるまで main を止めて待つよ。",
      ),
      check: { compiles: true, stdout: "done", wrongFail: true },
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "h" }],
      win: [{ t: "say", actor: "ally", text: L("Done!", "¡Listo!", "終わった!") }, { t: "print", text: "done" }],
    },
    {
      kind: "predict",
      prompt: L("join() also brings the result. What prints?", "join() también trae el resultado. ¿Qué imprime?", "join() は結果も運ぶ。何が表示される？"),
      code: `${T}let h = thread::spawn(|| 2 + 3);\nlet r = h.join().unwrap();\nprintln!("{}", r);`,
      options: ["5", "()", L("Error: a thread returns nothing", "Error: un hilo no devuelve nada", "エラー: スレッドは値を返さない")],
      answer: 0,
      output: "5",
      explain: L(
        "The value the closure returns reaches main through join().",
        "El valor que devuelve el closure llega a main por join().",
        "クロージャが返した値は join() を通って main に届くよ。",
      ),
      check: { compiles: true, stdout: "5" },
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "h" }],
      win: [{ t: "item", kind: "gem", holder: "ally" }, { t: "give", to: "hero" }, { t: "print", text: "5" }],
    },
    say(L(
      "Careful: two threads printing at once can come out in ANY order. The system decides who runs first.",
      "Ojo: dos hilos que imprimen a la vez pueden salir en CUALQUIER orden. El sistema decide quién corre primero.",
      "注意。同時に表示する2つのスレッドは、どんな順番にもなりうる。どちらが先に動くかはOSが決めるんだ。",
    )),
    {
      kind: "predict",
      prompt: L("In what order do A and B come out?", "¿En qué orden salen A y B?", "A と B はどの順で出る？"),
      code: `${T}let a = thread::spawn(|| println!("A"));\nlet b = thread::spawn(|| println!("B"));\na.join().unwrap();\nb.join().unwrap();`,
      options: [L("Always A, then B", "Siempre A y luego B", "いつも A、次に B"), L("It can vary on each run", "Puede variar en cada ejecución", "実行ごとに変わりうる")],
      answer: 1,
      explain: L(
        "Threads run in parallel. join only waits; it doesn't reorder what was already printed.",
        "Los hilos corren en paralelo. join solo espera; no ordena lo que ya se imprimió.",
        "スレッドは並行して動く。join は待つだけで、すでに表示されたものを並べ替えはしないよ。",
      ),
      check: { compiles: true },
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "a" }, { t: "tag", actor: "hero", text: "b" }],
      win: [{ t: "say", actor: "ally", text: L("Me first?", "¿Yo primero?", "ぼくが先?") }, { t: "say", actor: "hero", text: L("Or me?", "¿O yo?", "それとも私?") }],
    },
    say(L(
      "Now the classic error: the thread wants to use a variable from main. What if main ends and drops it first?",
      "Ahora el error clásico: el hilo quiere usar una variable de main. ¿Y si main termina y la suelta antes?",
      "次は定番のエラー。スレッドが main の変数を使いたい。でも main が先に終わって手放したら？",
    )),
    {
      kind: "act",
      prompt: L("Hand the loot to the helper", "Pasa el botín al ayudante", "戦利品を助っ人に渡そう"),
      setup: [],
      steps: [
        { label: L("FORGE", "FORJAR", "作る"), line: "let loot = vec![1, 2, 3];", effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "loot" }] },
        { label: L("LEND", "PRESTAR", "貸す"), line: "let h = thread::spawn(|| {", effects: [{ t: "enter", actor: "ally" }, { t: "lend", to: "ally" }] },
        {
          label: L("USE", "USAR", "使う"),
          line: '    println!("{:?}", loot);',
          effects: [{ t: "shake" }, { t: "say", actor: "ally", text: L("What if main leaves?", "¿Y si main se va?", "main が消えたら?") }],
          error: {
            compiler: "error[E0373]: closure may outlive the current function, but it borrows `loot`",
            plain: L(
              "The thread could outlive main. A borrow like that would be left dangling.",
              "El hilo podría vivir más que main. Un préstamo así quedaría colgando.",
              "スレッドは main より長生きするかも。そんな借用は宙ぶらりんになるよ。",
            ),
          },
        },
        { label: L("WITH move", "CON move", "move付き"), line: "let h = thread::spawn(move || {", effects: [{ t: "give", to: "ally" }, { t: "dead", actor: "hero" }, { t: "tag", actor: "ally", text: "loot" }, { t: "banner", text: L("MOVE", "MOVE", "MOVE") }] },
        { label: L("USE", "USAR", "使う"), line: '    println!("{:?}", loot);\n});\nh.join().unwrap();', effects: [{ t: "say", actor: "ally", text: L("Now it's mine!", "¡Ahora es mío!", "もうぼくのもの!") }], output: "[1, 2, 3]" },
      ],
    },
    say(L(
      "move || hands OWNERSHIP of whatever the closure uses to the thread. The helper owns it and nobody takes it away.",
      "move || entrega la PROPIEDAD de lo que usa el closure al hilo. El ayudante es dueño y nadie se lo quita.",
      "move || はクロージャが使う値の所有権をスレッドに渡す。助っ人が持ち主になり、誰にも奪われないよ。",
    )),
    {
      kind: "pick",
      prompt: L("Hand the loot to the thread", "Entrega el botín al hilo", "戦利品をスレッドに渡そう"),
      code: `${T}let loot = vec![1, 2, 3];\nlet h = thread::spawn(___ || {\n    println!("{:?}", loot);\n});\nh.join().unwrap();`,
      options: ["move", "ref", "mut"],
      answer: 0,
      explain: L(
        "move moves loot into the closure: the thread no longer depends on main.",
        "move mueve loot dentro del closure: el hilo ya no depende de main.",
        "move で loot をクロージャの中へムーブする。これでスレッドは main に頼らないよ。",
      ),
      check: { compiles: true, stdout: "[1, 2, 3]", wrongFail: true },
      setup: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "loot" }, { t: "enter", actor: "ally" }],
      win: [{ t: "give", to: "ally" }, { t: "dead", actor: "hero" }, { t: "print", text: "[1, 2, 3]" }],
    },
    {
      kind: "predict",
      prompt: L("main uses loot after the move. Does it compile?", "main usa loot después del move. ¿Compila?", "move の後に main が loot を使う。コンパイルできる？"),
      code: `${T}let loot = vec![1, 2, 3];\nlet h = thread::spawn(move || {\n    println!("{}", loot.len());\n});\nh.join().unwrap();\nprintln!("{:?}", loot);`,
      options: [L("Yes: prints 3 and [1, 2, 3]", "Sí: imprime 3 y [1, 2, 3]", "はい: 3 と [1, 2, 3] を表示"), L("No: loot moved into the thread", "No: loot se movió al hilo", "いいえ: loot はスレッドへムーブ済み")],
      answer: 1,
      explain: L(
        "move is a real move: loot now belongs to the thread. Using it in main is E0382.",
        "move es un move de verdad: loot ahora es del hilo. Usarlo en main es E0382.",
        "move は本物のムーブだ。loot はもうスレッドのもの。main で使うと E0382 になるよ。",
      ),
      check: { compiles: false },
      setup: [{ t: "item", kind: "gem", holder: "ally" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "loot" }, { t: "tag", actor: "hero", text: "loot" }, { t: "dead", actor: "hero" }],
      win: [{ t: "shake" }, { t: "say", actor: "hero", text: L("It's gone!", "¡Ya no lo tengo!", "もう持ってない!") }],
    },
    {
      kind: "type",
      prompt: L("Start the thread", "Lanza el hilo", "スレッドを起動しよう"),
      code: `${T}let h = thread::___(move || 7);\nprintln!("{}", h.join().unwrap());`,
      answer: "spawn",
      explain: L(
        "thread::spawn(closure) starts a new thread.",
        "thread::spawn(closure) lanza un hilo nuevo.",
        "thread::spawn(クロージャ) で新しいスレッドが起動するよ。",
      ),
      check: { compiles: true, stdout: "7" },
      win: [{ t: "enter", actor: "ally" }, { t: "say", actor: "ally", text: L("7!", "¡7!", "7だ!") }],
    },
    {
      kind: "order",
      prompt: L("Order: create, hand over, wait", "Ordena: crea, entrega, espera", "並べよう: 作る、渡す、待つ"),
      lines: ['let name = String::from("Ada");', "let h = thread::spawn(move || {", '    println!("Hello, {}", name);', "});", "h.join().unwrap();"],
      explain: L(
        "The value exists before the thread; move hands it over; join waits at the end.",
        "El valor existe antes del hilo; move lo entrega; join espera al final.",
        "値はスレッドより先に作る。move で渡し、最後に join で待つよ。",
      ),
      check: { program: prog(`${T}let name = String::from("Ada");\nlet h = thread::spawn(move || {\n    println!("Hello, {}", name);\n});\nh.join().unwrap();`), compiles: true, stdout: "Hello, Ada" },
      win: [{ t: "print", text: "Hello, Ada" }],
    },
    {
      kind: "run",
      prompt: L("Fix it: it must print Helper: Tower taken", "Arréglalo: debe imprimir Helper: Tower taken", "直そう: Helper: Tower taken と表示させる"),
      starter: 'use std::thread;\n\nfn main() {\n    let message = String::from("Tower taken");\n    let h = thread::spawn(|| {\n        println!("Helper: {}", message);\n    });\n    h.join().unwrap();\n}\n',
      expect: "Helper: Tower taken",
      solution: 'use std::thread;\n\nfn main() {\n    let message = String::from("Tower taken");\n    let h = thread::spawn(move || {\n        println!("Helper: {}", message);\n    });\n    h.join().unwrap();\n}\n',
      fallback: [String.raw`spawn\s*\(\s*move\s*\|`],
      explain: L(
        "The closure borrows message (E0373). With move || the thread takes it along.",
        "El closure toma prestado message (E0373). Con move || el hilo se lo lleva.",
        "クロージャが message を借りている (E0373)。move || にすればスレッドが持っていくよ。",
      ),
    },
  ],
};

const arc: LessonDef = {
  slug: "shared-arc",
  title: L("Passes to one treasure", "Pases al mismo tesoro", "同じ宝への通行証"),
  concept: "concurrency",
  mode: "lesson",
  xp: 80,
  enemy: "rust/dangler",
  enemyName: L("DUPLICATE BUG", "BUG DUPLICADO", "分身バグ"),
  beats: [
    say(L(
      "move hands the map to ONE helper. What if three helpers need to read the same map?",
      "move entrega el mapa a UN ayudante. ¿Y si tres ayudantes necesitan leer el mismo mapa?",
      "move は地図を「一人」の助っ人に渡す。では3人が同じ地図を読みたいときは？",
    )),
    say(L(
      "Arc<T> counts owners: Atomic Reference Counted. Each clone is a PASS to the same value, not a copy.",
      "Arc<T> cuenta dueños: Atomic Reference Counted. Cada clon es un PASE al mismo valor, no una copia.",
      "Arc<T> は持ち主を数える (Atomic Reference Counted)。clone するたびに同じ値への「通行証」が増える。コピーじゃないよ。",
    )),
    {
      kind: "act",
      prompt: L("Hand out passes to the same map", "Reparte pases al mismo mapa", "同じ地図の通行証を配ろう"),
      setup: [],
      steps: [
        { label: IMPORT, line: "use std::sync::Arc;" },
        { label: CREATE, line: 'let map = Arc::new(String::from("cave"));', effects: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "map", value: "1 pass" }] },
        { label: ANOTHER_PASS, line: "let pass = Arc::clone(&map);", effects: [{ t: "enter", actor: "ally" }, { t: "clone", to: "ally" }, { t: "tag", actor: "ally", text: "pass" }, { t: "value", actor: "hero", text: "2 passes" }] },
        { label: COUNT, line: 'println!("{}", Arc::strong_count(&map));', effects: [{ t: "say", actor: "hero", text: L("There are 2 of us!", "¡Somos 2!", "2人になった!") }], output: "2" },
        { label: L("DROP PASS", "SOLTAR PASE", "通行証を返す"), line: "drop(pass);", effects: [{ t: "untag", actor: "ally" }, { t: "exit", actor: "ally" }, { t: "value", actor: "hero", text: "1 pass" }] },
        { label: COUNT, line: 'println!("{}", Arc::strong_count(&map));', output: "1" },
      ],
    },
    say(L(
      "Arc::clone does NOT copy the map: it adds 1 to the counter. drop(x) drops a value right away. At 0 passes, the map is freed.",
      "Arc::clone NO copia el mapa: suma 1 al contador. drop(x) suelta un valor ya. Con 0 pases, el mapa se libera.",
      "Arc::clone は地図をコピーしない。カウンターに1足すだけ。drop(x) は値をすぐ手放す。通行証が0になると地図は解放されるよ。",
    )),
    {
      kind: "predict",
      prompt: WHAT_PRINTS,
      code: "use std::sync::Arc;\nlet a = Arc::new(5);\nlet b = Arc::clone(&a);\nlet c = Arc::clone(&a);\nprintln!(\"{}\", Arc::strong_count(&a));",
      options: ["1", "2", "3"],
      answer: 2,
      output: "3",
      explain: L(
        "a, b and c are three passes to the same 5: the counter is 3.",
        "a, b y c son tres pases al mismo 5: el contador vale 3.",
        "a、b、c は同じ 5 への3枚の通行証。カウンターは 3 だよ。",
      ),
      check: { compiles: true, stdout: "3" },
      setup: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "a", value: "1" }],
      win: [{ t: "enter", actor: "ally" }, { t: "clone", to: "ally" }, { t: "value", actor: "hero", text: "3" }, { t: "print", text: "3" }],
    },
    {
      kind: "pick",
      prompt: L("Ask how many passes there are", "Pregunta cuántos pases hay", "通行証が何枚あるか聞こう"),
      code: 'use std::sync::Arc;\nlet map = Arc::new(String::from("cave"));\nlet pass = Arc::clone(&map);\nprintln!("{}", Arc::___(&map));',
      options: ["strong_count", "len", "count"],
      answer: 0,
      explain: L(
        "Arc::strong_count(&x) tells how many passes (Arcs) point to the value.",
        "Arc::strong_count(&x) dice cuántos pases (Arc) apuntan al valor.",
        "Arc::strong_count(&x) は、値を指す通行証 (Arc) の数を教えてくれるよ。",
      ),
      check: { compiles: true, stdout: "2" },
      setup: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "map" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "pass" }],
      win: [{ t: "value", actor: "hero", text: "2" }, { t: "print", text: "2" }],
    },
    {
      kind: "predict",
      prompt: WHAT_PRINTS,
      code: 'use std::sync::Arc;\nlet map = Arc::new(String::from("cave"));\nlet pass = Arc::clone(&map);\nprintln!("{} {}", map, pass);',
      options: ["cave cave", L("cave and an error", "cave y un error", "cave とエラー"), L("Error: map was moved", "Error: map se movió", "エラー: map はムーブ済み")],
      answer: 0,
      output: "cave cave",
      explain: L(
        "Both passes read the same String. Arc::clone moves nothing.",
        "Ambos pases leen el mismo String. Arc::clone no mueve nada.",
        "どちらの通行証も同じ String を読む。Arc::clone は何もムーブしないよ。",
      ),
      check: { compiles: true, stdout: "cave cave" },
    },
    say(L(
      "And Rc<T>? It does the same and is cheaper, but its counter isn't atomic: it can't cross to another thread.",
      "¿Y Rc<T>? Hace lo mismo y es más barato, pero su contador no es atómico: no puede cruzar a otro hilo.",
      "Rc<T> は？同じことをもっと安くできる。でもカウンターがアトミックじゃないから、別のスレッドへ渡れないんだ。",
    )),
    {
      kind: "act",
      prompt: L("Try sending an Rc to another thread", "Intenta mandar un Rc a otro hilo", "Rc を別のスレッドに送ってみよう"),
      setup: [],
      steps: [
        { label: IMPORT, line: "use std::rc::Rc;" },
        { label: CREATE, line: 'let map = Rc::new(String::from("cave"));', effects: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "map: Rc" }] },
        { label: ANOTHER_PASS, line: "let pass = Rc::clone(&map);", effects: [{ t: "enter", actor: "ally" }, { t: "clone", to: "ally" }, { t: "tag", actor: "ally", text: "pass" }] },
        {
          label: L("TO THREAD", "AL HILO", "スレッドへ"),
          line: 'thread::spawn(move || println!("{}", pass));',
          effects: [{ t: "shake" }, { t: "say", actor: "enemy", text: L("Broken counter!", "¡Contador roto!", "カウンター崩壊!") }],
          error: {
            compiler: "error[E0277]: `Rc<String>` cannot be sent between threads safely",
            plain: L(
              "Two threads bumping Rc's counter at once would break it. Rust prevents it.",
              "Dos hilos sumando al contador de Rc a la vez lo romperían. Rust lo impide.",
              "2つのスレッドが同時に Rc のカウンターを変えると壊れる。Rust はそれを防ぐよ。",
            ),
          },
        },
        { label: L("USE Arc", "USAR Arc", "Arcを使う"), line: 'let map = Arc::new(String::from("cave"));', effects: [{ t: "tag", actor: "hero", text: "map: Arc" }, { t: "banner", text: L("Arc CROSSES THREADS!", "¡Arc CRUZA HILOS!", "Arcはスレッド越え!") }] },
      ],
    },
    say(L(
      "Send is an automatic badge: \"I can move to another thread.\" Arc has it. Rc doesn't.",
      "Send es una insignia automática: «puedo mudarme a otro hilo». Arc la tiene. Rc no.",
      "Send は自動でつくバッジ。「別のスレッドへ引っ越せる」という意味だ。Arc は持っていて、Rc は持っていない。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: `use std::rc::Rc;\n${T}let map = Rc::new(5);\nlet pass = Rc::clone(&map);\nlet h = thread::spawn(move || println!("{}", pass));\nh.join().unwrap();`,
      options: [L("Yes: prints 5", "Sí: imprime 5", "はい: 5 を表示"), L("No: Rc can't be sent between threads", "No: Rc no se puede enviar entre hilos", "いいえ: Rc はスレッド間で送れない")],
      answer: 1,
      explain: L(
        "Rc isn't Send: E0277. For threads, use Arc.",
        "Rc no es Send: E0277. Para hilos, usa Arc.",
        "Rc は Send じゃない: E0277。スレッドには Arc を使おう。",
      ),
      check: { compiles: false },
      setup: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "map: Rc" }, { t: "enter", actor: "ally" }],
      win: [{ t: "shake" }, { t: "say", actor: "enemy", text: L("You shall not pass!", "¡No pasas!", "通さないぞ!") }],
    },
    {
      kind: "pick",
      prompt: L("Main and the helper both read the map", "Main y el ayudante leen el mapa", "main と助っ人の両方が地図を読む"),
      code: `${A}let map = Arc::new(5);\nlet pass = ___;\nlet h = thread::spawn(move || println!("{}", pass));\nh.join().unwrap();\nprintln!("{}", map);`,
      options: ["Arc::clone(&map)", "map", "&map"],
      answer: 0,
      explain: L(
        "A new pass travels to the thread and map stays in main. map would move; &map would dangle.",
        "Un pase nuevo viaja al hilo y map sigue en main. map se movería; &map colgaría.",
        "新しい通行証がスレッドへ行き、map は main に残る。map だとムーブされ、&map だと宙ぶらりんになるよ。",
      ),
      check: { compiles: true, stdout: "5\n5", wrongFail: true },
      setup: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "map" }, { t: "enter", actor: "ally" }],
      win: [{ t: "clone", to: "ally" }, { t: "tag", actor: "ally", text: "pass" }, { t: "print", text: "5" }, { t: "print", text: "5" }],
    },
    {
      kind: "type",
      prompt: L("Get another pass", "Saca otro pase", "通行証をもう1枚"),
      code: 'use std::sync::Arc;\nlet map = Arc::new(String::from("cave"));\nlet pass = Arc::___(&map);\nprintln!("{}", Arc::strong_count(&pass));',
      answer: "clone",
      explain: L(
        "Arc::clone(&x) makes one more pass to the same value.",
        "Arc::clone(&x) crea un pase más al mismo valor.",
        "Arc::clone(&x) で同じ値への通行証が1枚増えるよ。",
      ),
      check: { compiles: true, stdout: "2" },
      win: [{ t: "enter", actor: "ally" }, { t: "clone", to: "ally" }],
    },
    {
      kind: "order",
      prompt: L("Order: the helper and the hero read the map", "Ordena: el ayudante y el héroe leen el mapa", "並べよう: 助っ人と勇者が地図を読む"),
      lines: ['let map = Arc::new(String::from("cave"));', "let pass = Arc::clone(&map);", 'let h = thread::spawn(move || println!("Helper: {}", pass));', "h.join().unwrap();", 'println!("Hero: {}", map);'],
      explain: L(
        "First the map, then the pass that travels to the thread, join, and finally the hero reads.",
        "Primero el mapa, luego el pase que viaja al hilo, join y al final lee el héroe.",
        "まず地図、次にスレッドへ行く通行証、join して、最後に勇者が読むよ。",
      ),
      check: { program: prog(`${A}let map = Arc::new(String::from("cave"));\nlet pass = Arc::clone(&map);\nlet h = thread::spawn(move || println!("Helper: {}", pass));\nh.join().unwrap();\nprintln!("Hero: {}", map);`), compiles: true, stdout: "Helper: cave\nHero: cave" },
      win: [{ t: "print", text: "Helper: cave" }, { t: "print", text: "Hero: cave" }],
    },
    {
      kind: "run",
      prompt: L("Fix it: it must print Helper reads: cave", "Arréglalo: debe imprimir Helper reads: cave", "直そう: Helper reads: cave と表示させる"),
      starter: 'use std::rc::Rc;\nuse std::thread;\n\nfn main() {\n    let map = Rc::new(String::from("cave"));\n    let pass = Rc::clone(&map);\n    let h = thread::spawn(move || {\n        println!("Helper reads: {}", pass);\n    });\n    h.join().unwrap();\n}\n',
      expect: "Helper reads: cave",
      solution: 'use std::sync::Arc;\nuse std::thread;\n\nfn main() {\n    let map = Arc::new(String::from("cave"));\n    let pass = Arc::clone(&map);\n    let h = thread::spawn(move || {\n        println!("Helper reads: {}", pass);\n    });\n    h.join().unwrap();\n}\n',
      fallback: [String.raw`Arc\s*::\s*new\s*\(`, String.raw`Arc\s*::\s*clone\s*\(`],
      explain: L(
        "Rc isn't Send. Swap Rc for Arc (and the use for std::sync::Arc).",
        "Rc no es Send. Cambia Rc por Arc (y el use por std::sync::Arc).",
        "Rc は Send じゃない。Rc を Arc に変えよう (use も std::sync::Arc に)。",
      ),
    },
  ],
};

const mutex: LessonDef = {
  slug: "mutex-chest",
  title: L("The locked chest", "El cofre con llave", "鍵付きの宝箱"),
  concept: "concurrency",
  mode: "lesson",
  xp: 85,
  enemy: "rust/cog-golem",
  enemyName: L("RACE BUG", "BUG DE CARRERA", "競合バグ"),
  beats: [
    say(L(
      "Arc lets several threads READ. And writing? If two add at once, the gold gets corrupted: a data race.",
      "Arc deja LEER desde varios hilos. ¿Y escribir? Si dos suman a la vez, el oro se corrompe: carrera de datos.",
      "Arc なら複数のスレッドが「読める」。では書くときは？2人が同時に足すと金貨が壊れる。データ競合だ。",
    )),
    say(L(
      "Mutex<T> keeps the value in a chest. To touch it you ask for the KEY with lock(). Only one holds it at a time.",
      "Mutex<T> guarda el valor en un cofre. Para tocarlo pides la LLAVE con lock(). Solo uno la tiene a la vez.",
      "Mutex<T> は値を宝箱にしまう。触るには lock() で「鍵」をもらう。鍵を持てるのは一度に一人だけだよ。",
    )),
    {
      kind: "act",
      prompt: L("Open the chest, add, and return the key", "Abre el cofre, suma y devuelve la llave", "宝箱を開けて足し、鍵を返そう"),
      setup: [],
      steps: [
        { label: IMPORT, line: "use std::sync::Mutex;" },
        { label: CHEST, line: "let chest = Mutex::new(0);", effects: [{ t: "item", kind: "key", holder: "hero" }, { t: "tag", actor: "hero", text: "chest", value: "0" }] },
        { label: L("OPEN BLOCK", "ABRIR BLOQUE", "ブロック開始"), line: "{" },
        { label: L("ASK FOR KEY", "PEDIR LLAVE", "鍵をもらう"), line: "    let mut gold = chest.lock().unwrap();", effects: [{ t: "enter", actor: "ally" }, { t: "give", to: "ally" }, { t: "tag", actor: "ally", text: "gold" }] },
        { label: L("ADD", "SUMAR", "足す"), line: "    *gold += 10;", effects: [{ t: "value", actor: "hero", text: "10" }, { t: "say", actor: "ally", text: L("+10!", "¡+10!", "+10!") }] },
        { label: CLOSE, line: "} // gold dies: the key is released", effects: [{ t: "give", to: "hero" }, { t: "untag", actor: "ally" }, { t: "banner", text: L("KEY RETURNED", "LLAVE DEVUELTA", "鍵を返却") }] },
        { label: READ, line: 'println!("{}", *chest.lock().unwrap());', output: "10" },
      ],
    },
    say(L(
      "lock() gives you a guard. With * you reach the value. When the guard dies at the closing }, the key comes back on its own.",
      "lock() da un guardián (guard). Con * llegas al valor. Cuando el guard muere al cerrar }, la llave vuelve sola.",
      "lock() はガード (guard) をくれる。* で中の値に届く。} でガードが消えると、鍵は自動で戻るよ。",
    )),
    {
      kind: "pick",
      prompt: L("Ask for the chest's key", "Pide la llave del cofre", "宝箱の鍵をもらおう"),
      code: 'use std::sync::Mutex;\nlet chest = Mutex::new(5);\n{\n    let mut gold = chest.___().unwrap();\n    *gold += 1;\n}\nprintln!("{}", *chest.lock().unwrap());',
      options: ["lock", "open", "key"],
      answer: 0,
      explain: L(
        "lock() waits for the key and returns the guard. Mutex has no open or key.",
        "lock() espera la llave y devuelve el guard. Mutex no tiene open ni key.",
        "lock() は鍵を待ってガードを返す。Mutex に open や key はないよ。",
      ),
      check: { compiles: true, stdout: "6", wrongFail: true },
      setup: [{ t: "item", kind: "key", holder: "hero" }, { t: "tag", actor: "hero", text: "chest", value: "5" }, { t: "enter", actor: "ally" }],
      win: [{ t: "give", to: "ally" }, { t: "value", actor: "hero", text: "6" }, { t: "give", to: "hero" }, { t: "print", text: "6" }],
    },
    {
      kind: "predict",
      prompt: WHAT_PRINTS,
      code: 'use std::sync::Mutex;\nlet chest = Mutex::new(vec![1, 2]);\nchest.lock().unwrap().push(3);\nprintln!("{}", chest.lock().unwrap().len());',
      options: ["3", "2", L("Freezes waiting for the key", "Se congela esperando la llave", "鍵を待って固まる")],
      answer: 0,
      output: "3",
      explain: L(
        "The temporary guard dies at the end of its line: the key comes back and the second lock() gets it.",
        "El guard temporal muere al final de su línea: la llave vuelve y el segundo lock() la obtiene.",
        "一時的なガードはその行の終わりで消える。鍵が戻り、2回目の lock() がそれを受け取るよ。",
      ),
      check: { compiles: true, stdout: "3" },
    },
    say(L(
      "To share the chest between threads, combine both: Arc<Mutex<T>>. Arc hands out passes; Mutex hands out the key.",
      "Para compartir el cofre entre hilos, combina ambos: Arc<Mutex<T>>. Arc reparte pases; Mutex reparte la llave.",
      "宝箱をスレッド間で共有するなら両方を組み合わせる: Arc<Mutex<T>>。Arc が通行証を、Mutex が鍵を配るんだ。",
    )),
    {
      kind: "act",
      prompt: L("Three helpers add to the same chest", "Tres ayudantes suman al mismo cofre", "3人の助っ人が同じ宝箱に足す"),
      setup: [],
      steps: [
        { label: CHEST, line: "let chest = Arc::new(Mutex::new(0));", effects: [{ t: "item", kind: "key", holder: "hero" }, { t: "tag", actor: "hero", text: "chest", value: "0" }] },
        { label: L("LIST", "LISTA", "リスト"), line: "let mut threads = vec![];" },
        { label: L("REPEAT", "REPETIR", "くり返す"), line: "for _ in 0..3 {" },
        { label: L("PASS", "PASE", "通行証"), line: "    let pass = Arc::clone(&chest);", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "pass" }] },
        { label: LAUNCH, line: "    threads.push(thread::spawn(move || {\n        *pass.lock().unwrap() += 1;\n    }));", effects: [{ t: "give", to: "ally" }, { t: "say", actor: "ally", text: L("+1, take the key!", "¡+1, toma la llave!", "+1、鍵どうぞ!") }, { t: "give", to: "hero" }, { t: "value", actor: "hero", text: "1, 2, 3..." }] },
        { label: CLOSE, line: "}" },
        { label: WAIT, line: "for h in threads { h.join().unwrap(); }", effects: [{ t: "value", actor: "hero", text: "3" }, { t: "banner", text: L("JOIN", "JOIN", "JOIN") }] },
        { label: READ, line: 'println!("{}", *chest.lock().unwrap());', output: "3" },
      ],
    },
    {
      kind: "predict",
      prompt: L("Five threads add 2 each. What prints?", "Cinco hilos suman 2 cada uno. ¿Qué imprime?", "5つのスレッドが2ずつ足す。何が表示される？"),
      code: "let chest = Arc::new(Mutex::new(0));\nlet mut threads = vec![];\nfor _ in 0..5 {\n    let pass = Arc::clone(&chest);\n    threads.push(thread::spawn(move || { *pass.lock().unwrap() += 2; }));\n}\nfor h in threads { h.join().unwrap(); }\nprintln!(\"{}\", *chest.lock().unwrap());",
      options: ["10", "2", L("Varies on each run", "Varía en cada ejecución", "実行ごとに変わる")],
      answer: 0,
      output: "10",
      explain: L(
        "Each thread adds with the key in hand, without stepping on the others. After the joins, 5 × 2 = 10.",
        "Cada hilo suma con la llave en mano, sin pisarse. Tras los join, 5 × 2 = 10.",
        "各スレッドは鍵を持って足すから、ぶつからない。全部 join した後は 5 × 2 = 10 だよ。",
      ),
      check: { program: prog(`${AM}let chest = Arc::new(Mutex::new(0));\nlet mut threads = vec![];\nfor _ in 0..5 {\n    let pass = Arc::clone(&chest);\n    threads.push(thread::spawn(move || { *pass.lock().unwrap() += 2; }));\n}\nfor h in threads { h.join().unwrap(); }\nprintln!("{}", *chest.lock().unwrap());`), compiles: true, stdout: "10" },
      setup: [{ t: "item", kind: "key", holder: "hero" }, { t: "tag", actor: "hero", text: "chest", value: "0" }],
      win: [{ t: "value", actor: "hero", text: "10" }, { t: "print", text: "10" }],
    },
    {
      kind: "pick",
      prompt: L("What goes inside the Arc so you can add?", "¿Qué va dentro del Arc para poder sumar?", "足せるように Arc の中に何を入れる？"),
      code: `${AM}let chest = Arc::new(___::new(0));\nlet pass = Arc::clone(&chest);\nlet h = thread::spawn(move || { *pass.lock().unwrap() += 5; });\nh.join().unwrap();\nprintln!("{}", *chest.lock().unwrap());`,
      options: ["Mutex", "Box", "Arc"],
      answer: 0,
      explain: L(
        "Only Mutex has lock(). Arc shares; Mutex lets you mutate in turns.",
        "Solo Mutex tiene lock(). Arc comparte; Mutex permite mutar por turnos.",
        "lock() を持つのは Mutex だけ。Arc は共有し、Mutex は順番に変更させるんだ。",
      ),
      check: { compiles: true, stdout: "5", wrongFail: true },
      win: [{ t: "item", kind: "key", holder: "hero" }, { t: "print", text: "5" }],
    },
    {
      kind: "predict",
      prompt: L("Arc without Mutex. Does it compile?", "Arc sin Mutex. ¿Compila?", "Mutex なしの Arc。コンパイルできる？"),
      code: `${A}let gold = Arc::new(0);\nlet pass = Arc::clone(&gold);\nlet h = thread::spawn(move || { *pass += 1; });\nh.join().unwrap();`,
      options: [YES, L("No: you can't mutate through Arc", "No: no se puede mutar a través de Arc", "いいえ: Arc 越しには変更できない")],
      answer: 1,
      explain: L(
        "Arc only gives shared (read) access. To write you need a Mutex inside.",
        "Arc solo da acceso compartido (lectura). Para escribir necesitas Mutex dentro.",
        "Arc がくれるのは共有 (読み取り) アクセスだけ。書くには中に Mutex が必要だよ。",
      ),
      check: { compiles: false },
      win: [{ t: "shake" }, { t: "say", actor: "enemy", text: L("No key, no way!", "¡Sin llave no!", "鍵なしはダメ!") }],
    },
    say(L(
      "Danger: if a thread waits for a key nobody releases, it freezes forever. That's a DEADLOCK.",
      "Peligro: si un hilo espera una llave que nadie suelta, se congela para siempre. Eso es un DEADLOCK.",
      "危険！誰も返さない鍵をスレッドが待つと、永遠に固まる。これがデッドロックだ。",
    )),
    {
      kind: "predict",
      prompt: L("The block frees the key before the 2nd lock. Output?", "El bloque suelta la llave antes del 2.º lock. ¿Qué imprime?", "2回目の lock の前に鍵が戻る。何が出る？"),
      code: 'use std::sync::Mutex;\nlet chest = Mutex::new(1);\n{\n    let mut a = chest.lock().unwrap();\n    *a += 1;\n}\nlet b = chest.lock().unwrap();\nprintln!("{}", *b);',
      options: ["2", "1", DEADLOCK],
      answer: 0,
      output: "2",
      explain: L(
        "a dies at } and returns the key. Without that block, the second lock() would wait forever.",
        "a muere en } y devuelve la llave. Sin ese bloque, el segundo lock() esperaría para siempre.",
        "a は } で消えて鍵を返す。このブロックがないと、2回目の lock() は永遠に待つよ。",
      ),
      check: { compiles: true, stdout: "2" },
      setup: [{ t: "item", kind: "key", holder: "hero" }, { t: "tag", actor: "hero", text: "chest", value: "1" }],
      win: [{ t: "value", actor: "hero", text: "2" }, { t: "print", text: "2" }],
    },
    say(L(
      "A variant: RwLock allows MANY readers at once with read(), or just ONE writer with write().",
      "Variante: RwLock deja MUCHOS lectores a la vez con read(), o UN solo escritor con write().",
      "仲間に RwLock がある。read() なら「何人でも」同時に読め、write() なら書けるのは「一人だけ」だ。",
    )),
    {
      kind: "predict",
      prompt: L("Two readers at once. What prints?", "Dos lectores a la vez. ¿Qué imprime?", "2人が同時に読む。何が表示される？"),
      code: 'use std::sync::RwLock;\nlet map = RwLock::new(5);\nlet r1 = map.read().unwrap();\nlet r2 = map.read().unwrap();\nprintln!("{}", *r1 + *r2);',
      options: ["10", "5", DEADLOCK],
      answer: 0,
      output: "10",
      explain: L(
        "Several read() calls coexist just fine. Only write() demands exclusive access.",
        "Varios read() conviven sin problema. Solo write() pide exclusividad.",
        "read() は何個あっても共存できる。独占を求めるのは write() だけだよ。",
      ),
      check: { compiles: true, stdout: "10" },
    },
    {
      kind: "type",
      prompt: ASK_KEY,
      code: 'use std::sync::Mutex;\nlet chest = Mutex::new(1);\nlet mut gold = chest.___().unwrap();\n*gold += 1;\nprintln!("{}", *gold);',
      answer: "lock",
      explain: L(
        "chest.lock().unwrap() gives you the guard with the key.",
        "chest.lock().unwrap() te da el guard con la llave.",
        "chest.lock().unwrap() で鍵付きのガードがもらえるよ。",
      ),
      check: { compiles: true, stdout: "2" },
      win: [{ t: "item", kind: "key", holder: "hero" }, { t: "print", text: "2" }],
    },
    {
      kind: "order",
      prompt: L("Order: a helper adds to the chest", "Ordena: un ayudante suma al cofre", "並べよう: 助っ人が宝箱に足す"),
      lines: ["let pass = Arc::clone(&chest);", "let h = thread::spawn(move || {", "    *pass.lock().unwrap() += 1;", "});", "h.join().unwrap();"],
      explain: L(
        "First the pass, then the thread that moves it, and finally join.",
        "Primero el pase, luego el hilo que lo mueve, y al final join.",
        "まず通行証、次にそれをムーブするスレッド、最後に join だよ。",
      ),
      check: { program: prog(`${AM}let chest = Arc::new(Mutex::new(0));\nlet pass = Arc::clone(&chest);\nlet h = thread::spawn(move || {\n    *pass.lock().unwrap() += 1;\n});\nh.join().unwrap();\nprintln!("{}", *chest.lock().unwrap());`), compiles: true, stdout: "1" },
      win: [{ t: "print", text: "1" }],
    },
    {
      kind: "run",
      prompt: L("Fix it: it must print Total gold: 4", "Arréglalo: debe imprimir Total gold: 4", "直そう: Total gold: 4 と表示させる"),
      starter: 'use std::sync::Arc;\nuse std::thread;\n\nfn main() {\n    let gold = Arc::new(0);\n    let mut threads = vec![];\n    for _ in 0..4 {\n        let pass = Arc::clone(&gold);\n        threads.push(thread::spawn(move || { *pass += 1; }));\n    }\n    for h in threads { h.join().unwrap(); }\n    println!("Total gold: {}", gold);\n}\n',
      expect: "Total gold: 4",
      solution: 'use std::sync::{Arc, Mutex};\nuse std::thread;\n\nfn main() {\n    let gold = Arc::new(Mutex::new(0));\n    let mut threads = vec![];\n    for _ in 0..4 {\n        let pass = Arc::clone(&gold);\n        threads.push(thread::spawn(move || { *pass.lock().unwrap() += 1; }));\n    }\n    for h in threads { h.join().unwrap(); }\n    println!("Total gold: {}", *gold.lock().unwrap());\n}\n',
      fallback: [String.raw`Mutex\s*::\s*new\s*\(`, String.raw`Atomic\w+\s*::\s*new\s*\(`],
      explain: L(
        "Put the gold in a chest: Arc::new(Mutex::new(0)), and add with *pass.lock().unwrap() += 1.",
        "Mete el oro en un cofre: Arc::new(Mutex::new(0)) y suma con *pass.lock().unwrap() += 1.",
        "金貨を宝箱に入れよう: Arc::new(Mutex::new(0))。足すときは *pass.lock().unwrap() += 1 だ。",
      ),
    },
  ],
};

const channels: LessonDef = {
  slug: "message-channels",
  title: L("Messenger scrolls", "Pergaminos mensajeros", "伝令の巻物"),
  concept: "concurrency",
  mode: "lesson",
  xp: 80,
  enemy: "rust/dangler",
  enemyName: L("GOSSIP BUG", "BUG CHISMOSO", "うわさバグ"),
  beats: [
    say(L(
      "Another way to cooperate: instead of sharing the chest, send MESSAGES. Don't share memory: communicate.",
      "Otra forma de cooperar: en vez de compartir el cofre, envía MENSAJES. No compartas memoria: comunícate.",
      "協力の別のやり方。宝箱を共有する代わりに「メッセージ」を送るんだ。メモリを共有せず、伝え合おう。",
    )),
    say(L(
      "mpsc::channel() creates a channel: tx sends and rx receives. mpsc means multiple producers, single consumer.",
      "mpsc::channel() crea un canal: tx envía y rx recibe. mpsc significa muchos productores, un consumidor.",
      "mpsc::channel() でチャネルを作る。tx が送り、rx が受け取る。mpsc は「送り手は複数、受け手は一人」の意味だ。",
    )),
    {
      kind: "act",
      prompt: L("The helper sends you a scroll", "El ayudante te envía un pergamino", "助っ人が巻物を送ってくる"),
      setup: [],
      steps: [
        { label: IMPORT, line: "use std::sync::mpsc;" },
        { label: CHANNEL, line: "let (tx, rx) = mpsc::channel();", effects: [{ t: "tag", actor: "hero", text: "rx" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "tx" }, { t: "banner", text: L("CHANNEL", "CANAL", "チャネル") }] },
        { label: LAUNCH, line: "thread::spawn(move || {", effects: [{ t: "say", actor: "ally", text: L("Heading north!", "¡Voy al norte!", "北へ行く!") }] },
        { label: L("SEND", "ENVIAR", "送る"), line: '    tx.send(String::from("Dragon to the north!")).unwrap();', effects: [{ t: "item", kind: "scroll", holder: "ally" }, { t: "give", to: "hero" }] },
        { label: CLOSE, line: "});" },
        { label: L("RECEIVE", "RECIBIR", "受け取る"), line: 'println!("{}", rx.recv().unwrap());', effects: [{ t: "say", actor: "hero", text: L("Got it!", "¡Recibido!", "受け取った!") }], output: "Dragon to the north!" },
      ],
    },
    say(L(
      "send() MOVES the value through the channel: it no longer belongs to the sender. recv() waits until something arrives.",
      "send() MUEVE el valor por el canal: deja de ser del que envía. recv() espera hasta que llegue algo.",
      "send() は値をチャネルへムーブする。もう送り手のものじゃない。recv() は何か届くまで待つよ。",
    )),
    {
      kind: "pick",
      prompt: L("Send the number through the channel", "Envía el número por el canal", "数をチャネルで送ろう"),
      code: `${CH}let (tx, rx) = mpsc::channel();\nthread::spawn(move || { tx.___(5).unwrap(); });\nprintln!("{}", rx.recv().unwrap());`,
      options: ["send", "push", "recv"],
      answer: 0,
      explain: L(
        "tx.send(value) sends; rx.recv() receives. Sender has no push or recv.",
        "tx.send(valor) envía; rx.recv() recibe. Sender no tiene push ni recv.",
        "tx.send(値) で送り、rx.recv() で受け取る。Sender に push や recv はないよ。",
      ),
      check: { compiles: true, stdout: "5", wrongFail: true },
      setup: [{ t: "tag", actor: "hero", text: "rx" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "tx" }, { t: "item", kind: "scroll", holder: "ally" }],
      win: [{ t: "give", to: "hero" }, { t: "print", text: "5" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: 'use std::sync::mpsc;\nlet (tx, rx) = mpsc::channel();\nlet letter = String::from("hello");\ntx.send(letter).unwrap();\nprintln!("{}", letter);',
      options: [L("Yes: prints hello", "Sí: imprime hello", "はい: hello を表示"), L("No: letter moved into the channel", "No: letter se movió al canal", "いいえ: letter はチャネルへムーブ済み")],
      answer: 1,
      explain: L(
        "send takes ownership. Using letter afterward is E0382, like any move.",
        "send toma la propiedad. Usar letter después es E0382, como cualquier move.",
        "send は所有権を受け取る。その後 letter を使うと、普通のムーブと同じく E0382 だよ。",
      ),
      check: { compiles: false },
      setup: [{ t: "item", kind: "scroll", holder: "ally" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "letter" }],
      win: [{ t: "give", to: "hero" }, { t: "dead", actor: "ally" }],
    },
    {
      kind: "type",
      prompt: L("Receive the message", "Recibe el mensaje", "メッセージを受け取ろう"),
      code: `${CH}let (tx, rx) = mpsc::channel();\nthread::spawn(move || { tx.send("hello").unwrap(); });\nlet msg = rx.___().unwrap();\nprintln!("{}", msg);`,
      answer: "recv",
      explain: L(
        "rx.recv() waits until a message arrives.",
        "rx.recv() espera hasta que llega un mensaje.",
        "rx.recv() はメッセージが届くまで待つよ。",
      ),
      check: { compiles: true, stdout: "hello" },
      win: [{ t: "say", actor: "hero", text: L("hello!", "¡hello!", "hello!") }, { t: "print", text: "hello" }],
    },
    say(L(
      "Several messengers? Clone tx: each thread carries its own tx to the same rx.",
      "¿Varios mensajeros? Clona tx: cada hilo lleva su propio tx hacia el mismo rx.",
      "伝令を何人も？tx を clone しよう。各スレッドが自分の tx を持って、同じ rx に送るんだ。",
    )),
    {
      kind: "act",
      prompt: L("Two messengers, a single receiver", "Dos mensajeros, un solo receptor", "伝令2人、受け手は1人"),
      setup: [],
      steps: [
        { label: CHANNEL, line: "let (tx, rx) = mpsc::channel();", effects: [{ t: "tag", actor: "hero", text: "rx" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "tx" }] },
        { label: L("CLONE tx", "CLONAR tx", "txを複製"), line: "let tx2 = tx.clone();", effects: [{ t: "tag", actor: "ally", text: "tx, tx2" }, { t: "banner", text: L("2 MESSENGERS", "2 MENSAJEROS", "伝令2人") }] },
        { label: L("SEND 1", "ENVÍA 1", "送信1"), line: "thread::spawn(move || { tx.send(1).unwrap(); });", effects: [{ t: "item", kind: "scroll", holder: "ally" }, { t: "give", to: "hero" }] },
        { label: L("SEND 2", "ENVÍA 2", "送信2"), line: "thread::spawn(move || { tx2.send(2).unwrap(); });", effects: [{ t: "item", kind: "scroll", holder: "ally" }, { t: "give", to: "hero" }] },
        { label: L("ADD UP", "SUMAR", "合計する"), line: "let mut total = 0;\nfor n in rx { total += n; }", effects: [{ t: "tag", actor: "hero", text: "total", value: "3" }] },
        { label: L("SHOW", "MOSTRAR", "表示"), line: 'println!("{}", total);', output: "3" },
      ],
    },
    say(L(
      "for n in rx receives until ALL the tx are gone. That's why you drop(tx) the original if you don't use it.",
      "for n in rx recibe hasta que TODOS los tx mueren. Por eso se hace drop(tx) del original si no lo usas.",
      "for n in rx は「すべての」tx が消えるまで受け取り続ける。だから使わない元の tx は drop(tx) するんだ。",
    )),
    {
      kind: "predict",
      prompt: L("Three messengers send 10, 20 and 30. What prints?", "Tres mensajeros envían 10, 20 y 30. ¿Qué imprime?", "3人が 10, 20, 30 を送る。何が表示される？"),
      code: `${CH}let (tx, rx) = mpsc::channel();\nfor i in 1..=3 {\n    let tx = tx.clone();\n    thread::spawn(move || { tx.send(i * 10).unwrap(); });\n}\ndrop(tx);\nlet mut total = 0;\nfor n in rx { total += n; }\nprintln!("{}", total);`,
      options: ["60", "10", KEEPS_WAITING],
      answer: 0,
      output: "60",
      explain: L(
        "All three arrive (in any order) and the sum doesn't depend on order. drop(tx) lets the for loop end.",
        "Llegan los tres (en cualquier orden) y la suma no depende del orden. drop(tx) deja terminar el for.",
        "3つとも届く (順番はバラバラ) けど、合計は順番に関係ない。drop(tx) のおかげで for が終われるよ。",
      ),
      check: { compiles: true, stdout: "60" },
      setup: [{ t: "tag", actor: "hero", text: "rx" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "tx × 3" }],
      win: [{ t: "item", kind: "scroll", holder: "ally" }, { t: "give", to: "hero" }, { t: "tag", actor: "hero", text: "total", value: "60" }, { t: "print", text: "60" }],
    },
    say(L(
      "Send: \"I can move to another thread.\" Sync: \"several threads can look at me at once.\" Rust adds them for you.",
      "Send: «puedo mudarme a otro hilo». Sync: «varios hilos pueden mirarme a la vez». Rust las pone solo.",
      "Send は「別のスレッドへ引っ越せる」、Sync は「複数のスレッドから同時に見られる」。Rust が自動でつけてくれるよ。",
    )),
    {
      kind: "pick",
      prompt: L("Which badge is needed to move x to another thread?", "¿Qué insignia exige mover x a otro hilo?", "x を別スレッドへ移すのに必要なバッジは？"),
      code: 'fn ship<T: ___ + \'static>(x: T) {\n    std::thread::spawn(move || drop(x)).join().unwrap();\n}\nship(String::from("letter"));\nprintln!("ok");',
      options: ["Send", "Sync", "Copy"],
      answer: 0,
      explain: L(
        "spawn requires whatever moves into the thread to be Send. Sync is for sharing through &.",
        "spawn exige que lo que se mueve al hilo sea Send. Sync es para compartir con &.",
        "spawn はスレッドへムーブするものに Send を求める。Sync は & で共有するためのものだよ。",
      ),
      check: { compiles: true, stdout: "ok", wrongFail: true },
    },
    {
      kind: "predict",
      prompt: L("An Rc through the channel. Does it compile?", "Un Rc por el canal. ¿Compila?", "Rc をチャネルで送る。コンパイルできる？"),
      code: `use std::rc::Rc;\n${CH}let (tx, rx) = mpsc::channel();\nthread::spawn(move || { tx.send(Rc::new(5)).unwrap(); });\nprintln!("{}", rx.recv().unwrap());`,
      options: [L("Yes: prints 5", "Sí: imprime 5", "はい: 5 を表示"), L("No: Rc isn't Send", "No: Rc no es Send", "いいえ: Rc は Send じゃない")],
      answer: 1,
      explain: L(
        "Sending means moving the value to another thread. Rc isn't Send: E0277.",
        "Enviar es mudar el valor a otro hilo. Rc no es Send: E0277.",
        "送るとは値を別のスレッドへ引っ越させること。Rc は Send じゃない: E0277。",
      ),
      check: { compiles: false },
      win: [{ t: "shake" }, { t: "say", actor: "enemy", text: L("Rc can't travel!", "¡Rc no viaja!", "Rcは旅できない!") }],
    },
    {
      kind: "order",
      prompt: L("Order: the helper signals and the hero listens", "Ordena: el ayudante avisa y el héroe escucha", "並べよう: 助っ人が知らせ、勇者が聞く"),
      lines: ["let (tx, rx) = mpsc::channel();", "thread::spawn(move || {", '    tx.send("done").unwrap();', "});", 'println!("{}", rx.recv().unwrap());'],
      explain: L(
        "First the channel, then the thread that sends, and finally main receives.",
        "Primero el canal, luego el hilo que envía, y al final main recibe.",
        "まずチャネル、次に送るスレッド、最後に main が受け取るよ。",
      ),
      check: { program: prog(`${CH}let (tx, rx) = mpsc::channel();\nthread::spawn(move || {\n    tx.send("done").unwrap();\n});\nprintln!("{}", rx.recv().unwrap());`), compiles: true, stdout: "done" },
      win: [{ t: "print", text: "done" }],
    },
    {
      kind: "run",
      prompt: L("Fix it: it must print Total: 42", "Arréglalo: debe imprimir Total: 42", "直そう: Total: 42 と表示させる"),
      starter: 'use std::sync::mpsc;\nuse std::thread;\n\nfn main() {\n    let (tx, rx) = mpsc::channel();\n    thread::spawn(move || { tx.send(20).unwrap(); });\n    thread::spawn(move || { tx.send(22).unwrap(); });\n    let mut total = 0;\n    for n in rx { total += n; }\n    println!("Total: {}", total);\n}\n',
      expect: "Total: 42",
      solution: 'use std::sync::mpsc;\nuse std::thread;\n\nfn main() {\n    let (tx, rx) = mpsc::channel();\n    let tx2 = tx.clone();\n    thread::spawn(move || { tx.send(20).unwrap(); });\n    thread::spawn(move || { tx2.send(22).unwrap(); });\n    let mut total = 0;\n    for n in rx { total += n; }\n    println!("Total: {}", total);\n}\n',
      fallback: [String.raw`tx\s*\.\s*clone\s*\(\s*\)`, String.raw`Sender\s*::\s*clone\s*\(`],
      explain: L(
        "The first thread took tx (E0382). Clone tx for the second messenger.",
        "El primer hilo se llevó tx (E0382). Clona tx para el segundo mensajero.",
        "最初のスレッドが tx を持っていった (E0382)。2人目の伝令のために tx を clone しよう。",
      ),
    },
  ],
};

const boss5: LessonDef = {
  slug: "boss-concurrency",
  title: L("BOSS: Fearless Dragon", "JEFE: Dragón Fearless", "ボス: フィアレス竜"),
  concept: "concurrency",
  mode: "boss",
  xp: 200,
  enemy: "rust/borrow-dragon",
  enemyName: L("FEARLESS DRAGON", "DRAGÓN FEARLESS", "フィアレス竜"),
  beats: [
    enemySays(L(
      "I AM THE TOWER'S DRAGON. My flames run on a thousand threads at once. Can you keep up?",
      "SOY EL DRAGÓN DE LA TORRE. Mis llamas corren en mil hilos a la vez. ¿Puedes seguirles el paso?",
      "我こそ塔の竜。我が炎は千のスレッドで同時に走る。ついてこられるか？",
    )),
    { kind: "predict", time: 12, prompt: COMPILES, code: `${T}let v = vec![1, 2];\nlet h = thread::spawn(|| println!("{:?}", v));\nh.join().unwrap();`, options: [YES, NO], answer: 1, explain: L("Missing move: E0373.", "Falta move: E0373.", "move がない: E0373。"), check: { compiles: false } },
    { kind: "pick", time: 12, prompt: L("Wait for the thread", "Espera al hilo", "スレッドを待とう"), code: `${T}let h = thread::spawn(|| 1);\nprintln!("{}", h.___().unwrap());`, options: ["join", "wait", "end"], answer: 0, explain: L("join() waits and brings back the value.", "join() espera y trae el valor.", "join() は待って値を持ち帰る。"), check: { compiles: true, stdout: "1", wrongFail: true } },
    { kind: "type", time: 12, prompt: L("Hand v to the thread", "Entrega v al hilo", "v をスレッドに渡そう"), code: `${T}let v = vec![1, 2];\nlet h = thread::spawn(___ || println!("{}", v.len()));\nh.join().unwrap();`, answer: "move", explain: L("move || takes v along.", "move || se lleva v.", "move || が v を持っていく。"), check: { compiles: true, stdout: "2" } },
    { kind: "predict", time: 12, prompt: COMPILES, code: `use std::rc::Rc;\n${T}let r = Rc::new(1);\nlet h = thread::spawn(move || println!("{}", r));\nh.join().unwrap();`, options: [YES, NO], answer: 1, explain: L("Rc isn't Send.", "Rc no es Send.", "Rc は Send じゃない。"), check: { compiles: false } },
    { kind: "predict", time: 12, prompt: WHAT_PRINTS, code: 'use std::sync::Arc;\nlet a = Arc::new(1);\nlet b = Arc::clone(&a);\nprintln!("{}", Arc::strong_count(&b));', options: ["1", "2"], answer: 1, explain: L("Two passes: a and b.", "Dos pases: a y b.", "通行証は2枚: a と b。"), check: { compiles: true, stdout: "2" } },
    { kind: "pick", time: 12, prompt: L("To mutate shared data", "Para mutar compartido", "共有データを変更するには"), code: 'use std::sync::{Arc, Mutex};\nlet c = Arc::new(___::new(0));\n*c.lock().unwrap() += 1;\nprintln!("{}", *c.lock().unwrap());', options: ["Mutex", "Box", "Arc"], answer: 0, explain: L("Arc<Mutex<T>>.", "Arc<Mutex<T>>.", "Arc<Mutex<T>> だ。"), check: { compiles: true, stdout: "1", wrongFail: true } },
    { kind: "predict", time: 12, prompt: COMPILES, code: "use std::sync::Arc;\nlet gold = Arc::new(0);\n*gold += 1;", options: [YES, NO], answer: 1, explain: L("Arc doesn't allow mutation: Mutex is missing.", "Arc no deja mutar: falta Mutex.", "Arc では変更できない。Mutex が足りない。"), check: { compiles: false } },
    { kind: "type", time: 12, prompt: ASK_KEY, code: 'use std::sync::Mutex;\nlet m = Mutex::new(1);\nlet mut g = m.___().unwrap();\n*g += 1;\nprintln!("{}", *g);', answer: "lock", explain: L("m.lock().unwrap()", "m.lock().unwrap()", "m.lock().unwrap() だよ。"), check: { compiles: true, stdout: "2" } },
    { kind: "predict", time: 15, prompt: WHAT_PRINTS, code: `${CH}let (tx, rx) = mpsc::channel();\nfor i in 1..=3 {\n    let tx = tx.clone();\n    thread::spawn(move || { tx.send(i).unwrap(); });\n}\ndrop(tx);\nlet mut t = 0;\nfor n in rx { t += n; }\nprintln!("{}", t);`, options: ["6", "3", KEEPS_WAITING], answer: 0, explain: L("1 + 2 + 3, and drop(tx) closes the channel.", "1 + 2 + 3, y drop(tx) cierra el canal.", "1 + 2 + 3。drop(tx) でチャネルが閉じる。"), check: { compiles: true, stdout: "6" } },
    { kind: "pick", time: 15, prompt: L("Badge to move to another thread", "Insignia para mudarse de hilo", "スレッドを移るためのバッジ"), code: "fn f<T: ___ + 'static>(x: T) {\n    std::thread::spawn(move || drop(x));\n}", options: ["Send", "Sync", "Copy"], answer: 0, explain: L("Moving to another thread requires Send.", "Mover a otro hilo exige Send.", "別スレッドへ移すには Send が必要。"), check: { compiles: true, wrongFail: true } },
    enemySays(L(
      "Grrr... not a single data race. Your threads work without fear. The Tower is yours, Rustacean.",
      "Grrr... ni una carrera de datos. Tus hilos trabajan sin miedo. La Torre es tuya, rustáceo.",
      "ぐぬぬ…データ競合がひとつもない。お前のスレッドは恐れなく働く。塔はお前のものだ、Rustacean よ。",
    )),
  ],
};

export const fearlessTower: RegionDef = {
  slug: "fearless-tower",
  name: L("Fearless Tower", "Torre Fearless", "フィアレスの塔"),
  subtitle: L("Threads · Arc · Mutex", "Hilos · Arc · Mutex", "スレッド・Arc・Mutex"),
  theme: "tower",
  lessons: [threads, arc, mutex, channels, boss5],
};
