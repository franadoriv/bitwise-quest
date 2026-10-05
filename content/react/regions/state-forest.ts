import type { LessonDef, RegionDef } from "../../../lib/content/types.ts";
import { L } from "../../../lib/i18n/text.ts";
import { enemySays, say } from "../../rust/helpers.ts";

// REGION 2 · STATE FOREST  (useState, events, immutable updates, sharing state)
//
// A static render has no clicks, so click behavior is proven with pure logic: `queue()`
// builds a program that models React's update queue (setters queue values or updater
// functions; after the handler, React applies them in order to get the next state).

const HEAD = 'import React, { useState } from "react";\nimport { renderToStaticMarkup } from "react-dom/server";\n';
/** Full program: `body` (declarations), then print the static HTML of `el`. */
const show = (body: string, el: string) => `${HEAD}${body}\nconsole.log(renderToStaticMarkup(${el}));\n`;
/** Full program: a click handler `handler` runs once with `count` = `start`, then React applies the queue. */
const queue = (handler: string, start = 0) =>
  `type Update = number | ((n: number) => number);\nconst updates: Update[] = [];\nconst setCount = (u: Update) => { updates.push(u); };\nconst count: number = ${start};\n` +
  `const onClick = () => {\n${handler}\n};\nonClick();\nlet next = count;\nfor (const u of updates) next = typeof u === "function" ? u(next) : u;\nconsole.log(next);\n`;

const YES = L("Yes", "Sí", "はい");
const NO = L("No", "No", "いいえ");
const HTML = L("What HTML renders?", "¿Qué HTML se genera?", "どんな HTML になる？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const AFTER_CLICK = L("After ONE click, count shows…", "Tras UN clic, count muestra…", "1 回クリックすると count は…");
const LOGS = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const RENDER = L("RE-RENDER!", "¡RE-RENDER!", "再レンダー！");

// ─── 2.1 useState ────────────────────────────────────────────────────────────
const useStateLesson: LessonDef = {
  slug: "use-state",
  title: L("Memory crystals", "Cristales de memoria", "記憶のクリスタル"),
  concept: "state",
  mode: "lesson",
  xp: 75,
  enemy: "react/rerender-tornado",
  enemyName: L("RENDER TORNADO", "TORNADO RENDER", "レンダー竜巻"),
  beats: [
    say(L(
      "Welcome to the State Forest. A plain local variable resets every render, and changing it never re-renders.",
      "Bienvenido al Bosque del Estado. Una variable local se reinicia en cada render, y cambiarla nunca re-renderiza.",
      "状態の森へようこそ。普通のローカル変数はレンダーごとに戻り、変えても再レンダーされないんだ。",
    )),
    {
      kind: "act",
      prompt: L("Press in order and watch the crystal", "Pulsa en orden y mira el cristal", "順番に押して、クリスタルを見てね"),
      steps: [
        { label: L("IMPORT", "IMPORTAR", "インポート"), line: 'import { useState } from "react";' },
        {
          label: L("CRYSTAL", "CRISTAL", "クリスタル"),
          line: "const [count, setCount] = useState(0);",
          effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "count", value: "0" }],
        },
        {
          label: L("SET", "CAMBIAR", "セットする"),
          line: "setCount(count + 1);",
          effects: [{ t: "say", actor: "hero", text: L("Queued: 1", "En cola: 1", "予約：1") }],
        },
        {
          label: L("RE-RENDER", "RE-RENDER", "再レンダー"),
          line: "// React calls the component again",
          effects: [{ t: "banner", text: RENDER }, { t: "value", actor: "hero", text: "1" }],
        },
      ],
    },
    say(L(
      "useState keeps a value BETWEEN renders, and calling its setter asks React to render again with the new value.",
      "useState guarda un valor ENTRE renders, y llamar a su setter le pide a React renderizar de nuevo con el valor nuevo.",
      "useState はレンダーをまたいで値を保つ。セッターを呼ぶと、新しい値で再レンダーしてもらえるよ。",
    )),
    {
      kind: "predict",
      prompt: HTML,
      code: "function C() {\n  const [n] = useState(10);\n  return <p>{n}</p>;\n}\n<C />",
      options: ["<p>10</p>", "<p></p>", "<p>[10]</p>"],
      answer: 0,
      output: "<p>10</p>",
      check: { program: show("function C() {\n  const [n] = useState(10);\n  return <p>{n}</p>;\n}", "<C />"), compiles: true, stdout: "<p>10</p>" },
      explain: L("On the first render, state starts at the initial value: 10.", "En el primer render, el estado empieza con el valor inicial: 10.", "最初のレンダーでは、状態は初期値 10 から始まるよ。"),
      setup: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "n" }],
      win: [{ t: "value", actor: "hero", text: "10" }, { t: "print", text: "<p>10</p>" }],
    },
    {
      kind: "type",
      prompt: L("Name the setter by convention", "Nombra el setter según la convención", "慣例どおりにセッターを名付けよう"),
      code: "const [hp, ___] = useState(10);",
      answer: "setHp",
      check: { program: show("function Hero() {\n  const [hp, setHp] = useState(10);\n  return <b onClick={() => setHp(hp - 1)}>{hp}</b>;\n}", "<Hero />"), compiles: true, stdout: "<b>10</b>" },
      explain: L("Pairs read [thing, setThing]. The array destructuring lets you choose both names.", "El par se lee [cosa, setCosa]. La desestructuración te deja elegir ambos nombres.", "ペアは [thing, setThing] と読む。配列の分割代入で両方の名前を決められるよ。"),
      win: [{ t: "tag", actor: "hero", text: "hp", value: "10" }],
    },
    say(L(
      "State is a SNAPSHOT. Inside one render, count never changes, not even right after you call setCount.",
      "El estado es una FOTO. Dentro de un render, count nunca cambia, ni siquiera justo después de llamar a setCount.",
      "状態はスナップショット。1 回のレンダーの中では、setCount の直後でも count は変わらないよ。",
    )),
    {
      kind: "predict",
      prompt: AFTER_CLICK,
      code: "// count is 0\nonClick={() => {\n  setCount(count + 1);\n  setCount(count + 1);\n  setCount(count + 1);\n}}",
      options: ["1", "3", "0"],
      answer: 0,
      output: "1",
      check: { program: queue("  setCount(count + 1);\n  setCount(count + 1);\n  setCount(count + 1);"), compiles: true, stdout: "1" },
      explain: L("Each call reads the SAME snapshot (0) and asks for 0 + 1. Three times \"make it 1\" is still 1.", "Cada llamada lee la MISMA foto (0) y pide 0 + 1. Tres veces \"que sea 1\" sigue siendo 1.", "どの呼び出しも同じスナップショット 0 を読んで 0 + 1 を頼む。「1 にして」を 3 回でも 1 だよ。"),
      setup: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "count", value: "0" }],
      win: [{ t: "banner", text: RENDER }, { t: "value", actor: "hero", text: "1" }],
    },
    say(L(
      "To build on the latest value, pass an UPDATER: setCount(c => c + 1). React queues it and feeds it the newest c.",
      "Para partir del último valor, pasa un UPDATER: setCount(c => c + 1). React lo encola y le da el c más nuevo.",
      "最新の値をもとに更新するなら更新関数 setCount(c => c + 1) を渡そう。React が最新の c を渡してくれる。",
    )),
    {
      kind: "predict",
      prompt: AFTER_CLICK,
      code: "// count is 0\nonClick={() => {\n  setCount(c => c + 1);\n  setCount(c => c + 1);\n  setCount(c => c + 1);\n}}",
      options: ["1", "3", "0"],
      answer: 1,
      output: "3",
      check: { program: queue("  setCount(c => c + 1);\n  setCount(c => c + 1);\n  setCount(c => c + 1);"), compiles: true, stdout: "3" },
      explain: L("Updaters run in order on the queued value: 0 → 1 → 2 → 3.", "Los updaters corren en orden sobre el valor encolado: 0 → 1 → 2 → 3.", "更新関数は順番に前の結果へ適用される：0 → 1 → 2 → 3。"),
      setup: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "count", value: "0" }],
      win: [{ t: "banner", text: RENDER }, { t: "value", actor: "hero", text: "3" }],
    },
    {
      kind: "predict",
      prompt: AFTER_CLICK,
      code: "// count is 0\nonClick={() => {\n  setCount(count + 5);\n  setCount(c => c + 1);\n}}",
      options: ["1", "5", "6"],
      answer: 2,
      output: "6",
      check: { program: queue("  setCount(count + 5);\n  setCount(c => c + 1);"), compiles: true, stdout: "6" },
      explain: L("First \"replace with 5\", then the updater gets 5 and returns 6.", "Primero \"reemplaza por 5\", luego el updater recibe 5 y devuelve 6.", "まず「5 に置き換え」、次に更新関数が 5 を受け取って 6 を返す。"),
    },
    {
      kind: "predict",
      prompt: LOGS,
      code: "// count is 0\nonClick={() => {\n  setCount(count + 5);\n  console.log(count);\n}}",
      options: ["0", "5", "undefined"],
      answer: 0,
      output: "0",
      check: {
        program: "let count = 0;\nconst setCount = (n: number) => { /* React schedules the next render */ };\nconst onClick = () => {\n  setCount(count + 5);\n  console.log(count);\n};\nonClick();",
        compiles: true,
        stdout: "0",
      },
      explain: L("count is a constant of THIS render. The 5 only shows up in the next render.", "count es una constante de ESTE render. El 5 solo aparece en el siguiente render.", "count はこのレンダーの定数。5 になるのは次のレンダーだよ。"),
    },
    say(L(
      "TypeScript tip: an empty array needs a type, or it becomes never[]. Write useState<string[]>([]).",
      "Tip de TypeScript: un arreglo vacío necesita tipo, o se vuelve never[]. Escribe useState<string[]>([]).",
      "TS のコツ：空配列には型を付けよう。でないと never[] になる。useState<string[]>([]) と書こう。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: 'function Bag() {\n  const [items, setItems] = useState([]);\n  setItems(["a"]);\n  return null;\n}',
      options: [YES, NO],
      answer: 1,
      check: { program: `${HEAD}function Bag() {\n  const [items, setItems] = useState([]);\n  setItems(["a"]);\n  return null;\n}`, compiles: false },
      explain: L("useState([]) infers never[], so \"a\" doesn't fit (TS2322). Fix: useState<string[]>([]).", "useState([]) infiere never[], así que \"a\" no cabe (TS2322). Solución: useState<string[]>([]).", "useState([]) は never[] と推論され \"a\" が入らない（TS2322）。useState<string[]>([]) で直そう。"),
      win: [{ t: "shake" }],
    },
    {
      kind: "run",
      prompt: L("Fix the state queue: it must print 20", "Arregla la cola de estado: debe imprimir 20", "状態キューを直そう：20 と出して"),
      starter: 'type Update = number | ((n: number) => number);\n\nfunction getFinalState(base: number, queue: Update[]) {\n  let state = base;\n  for (const update of queue) {\n    state = update;\n  }\n  return state;\n}\n\nconsole.log(getFinalState(0, [1, n => n + 1, n => n * 10]));\n',
      solution: 'type Update = number | ((n: number) => number);\n\nfunction getFinalState(base: number, queue: Update[]) {\n  let state = base;\n  for (const update of queue) {\n    state = typeof update === "function" ? update(state) : update;\n  }\n  return state;\n}\n\nconsole.log(getFinalState(0, [1, n => n + 1, n => n * 10]));\n',
      expect: "20",
      fallback: [
        String.raw`typeof\s+update\s*===?\s*["']function["']`,
        String.raw`update\s+instanceof\s+Function`,
        String.raw`typeof\s+update\s*!==?\s*["']number["']`,
        String.raw`typeof\s+update\s*===?\s*["']number["']`,
      ],
      explain: L("A function is an updater: call it with the current state. A number replaces it. 0 → 1 → 2 → 20.", "Una función es un updater: llámala con el estado actual. Un número lo reemplaza. 0 → 1 → 2 → 20.", "関数なら更新関数として今の状態で呼ぶ。数値なら置き換える。0 → 1 → 2 → 20。"),
    },
  ],
};

// ─── 2.2 Events and forms ────────────────────────────────────────────────────
const eventsAndForms: LessonDef = {
  slug: "events-and-forms",
  title: L("Buttons and runes", "Botones y runas", "ボタンとルーン"),
  concept: "events",
  mode: "lesson",
  xp: 75,
  enemy: "typescript/callback-spaghetti",
  enemyName: L("CALLBACK KNOT", "NUDO CALLBACK", "コールバック結び"),
  beats: [
    say(L(
      "Events: hand the button a FUNCTION. React keeps it and calls it later, when the click actually happens.",
      "Eventos: dale al botón una FUNCIÓN. React la guarda y la llama después, cuando de verdad ocurre el clic.",
      "イベントではボタンに「関数」を渡す。React が預かって、クリックされたときに呼ぶんだ。",
    )),
    {
      kind: "act",
      prompt: L("Give the button a spell, then cast it too early", "Dale un hechizo al botón y luego lánzalo antes", "ボタンに呪文を渡し、早すぎる発動も試そう"),
      steps: [
        {
          label: L("HANDLER", "HANDLER", "ハンドラー"),
          line: 'const handleClick = () => console.log("boom");',
          effects: [{ t: "item", kind: "key", holder: "hero" }, { t: "tag", actor: "hero", text: "handleClick" }],
        },
        {
          label: L("HAND IT", "ENTREGARLA", "渡す"),
          line: "<button onClick={handleClick}>Go</button>",
          effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "button" }, { t: "give", to: "ally" }, { t: "say", actor: "ally", text: L("I'll wait.", "Esperaré.", "待ってるね") }],
        },
        {
          label: L("CALL IT ()", "LLAMARLA ()", "() で呼ぶ"),
          line: "<button onClick={handleClick()}>Go</button>",
          effects: [{ t: "shake" }, { t: "print", text: "boom" }, { t: "say", actor: "ally", text: L("Too early!", "¡Muy pronto!", "早すぎ！") }],
          error: {
            compiler: "TS2322: Type 'void' is not assignable to type 'MouseEventHandler<HTMLButtonElement> | undefined'.",
            plain: L("handleClick() runs NOW, while rendering, and hands over its result: undefined.", "handleClick() corre AHORA, al renderizar, y entrega su resultado: undefined.", "handleClick() はレンダー中の今すぐ実行され、結果の undefined を渡しちゃう。"),
          },
        },
      ],
    },
    {
      kind: "pick",
      prompt: L("Run handleClick only on click", "Ejecuta handleClick solo al hacer clic", "クリックのときだけ handleClick を実行"),
      code: 'import React from "react";\nconst handleClick = () => console.log("go");\nconst btn = <button onClick={___}>Go</button>;',
      options: ["handleClick", "handleClick()"],
      answer: 0,
      check: { compiles: true, wrongFail: true },
      explain: L("Pass the function itself. With () you call it during render and pass undefined.", "Pasa la función misma. Con () la llamas al renderizar y pasas undefined.", "関数そのものを渡そう。() を付けるとレンダー中に呼ばれ undefined が渡る。"),
      setup: [{ t: "item", kind: "key", holder: "hero" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "button" }],
      win: [{ t: "give", to: "ally" }],
    },
    {
      kind: "pick",
      prompt: L("Delete item id on click", "Borra el item id al hacer clic", "クリックで id の項目を削除"),
      code: 'import React from "react";\nconst remove = (id: number) => console.log("bye", id);\nconst id = 7;\nconst btn = <button onClick={___}>X</button>;',
      options: ["() => remove(id)", "remove(id)"],
      answer: 0,
      check: { compiles: true, wrongFail: true },
      explain: L("Need an argument? Wrap the call in an arrow: React calls the arrow on click.", "¿Necesitas un argumento? Envuelve la llamada en una flecha: React llama a la flecha al hacer clic.", "引数が必要ならアロー関数で包もう。クリック時に React がそのアローを呼ぶ。"),
    },
    {
      kind: "predict",
      prompt: HTML,
      code: "<button onClick={() => {}}>Go</button>",
      options: ["<button>Go</button>", '<button onclick="">Go</button>', '<button onClick="() => {}">Go</button>'],
      answer: 0,
      output: "<button>Go</button>",
      check: { program: show("", "<button onClick={() => {}}>Go</button>"), compiles: true, stdout: "<button>Go</button>" },
      explain: L("Handlers live in React, not in the HTML. The markup stays clean.", "Los handlers viven en React, no en el HTML. El marcado queda limpio.", "ハンドラーは React の中にあり、HTML には出ないよ。"),
    },
    say(L(
      "Forms: a CONTROLLED input takes value from state and reports each keystroke with onChange. React owns the value.",
      "Formularios: un input CONTROLADO toma value del estado y avisa cada tecla con onChange. React es dueño del valor.",
      "フォーム：制御された入力は value を状態から受け取り、onChange で入力を伝える。値の持ち主は React だよ。",
    )),
    {
      kind: "act",
      prompt: L("Wire a controlled input", "Conecta un input controlado", "制御された入力をつなごう"),
      steps: [
        {
          label: L("STATE", "ESTADO", "状態"),
          line: 'const [name, setName] = useState("");',
          effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "name", value: '""' }],
        },
        { label: L("BIND VALUE", "ATAR VALUE", "value をつなぐ"), line: "<input value={name}", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "input" }, { t: "clone", to: "ally" }] },
        {
          label: L("LISTEN", "ESCUCHAR", "聞き取る"),
          line: "  onChange={e => setName(e.target.value)} />",
          effects: [{ t: "say", actor: "ally", text: L("Typed: A", "Tecleé: A", "入力：A") }, { t: "banner", text: RENDER }, { t: "value", actor: "hero", text: '"A"' }],
        },
      ],
    },
    {
      kind: "type",
      prompt: L("Read what the user typed", "Lee lo que escribió el usuario", "ユーザーの入力を読もう"),
      code: "<input value={name} onChange={e => setName(e.target.___)} />",
      answer: "value",
      check: {
        program: `${HEAD}let name = "";\nconst setName = (v: string) => { name = v; };\nconst input = <input value={name} onChange={e => setName(e.target.value)} />;\ninput.props.onChange({ target: { value: "Ada" } }); // simulate typing\nconsole.log(name);`,
        compiles: true,
        stdout: "Ada",
      },
      explain: L("e.target is the input element; its value is the current text.", "e.target es el elemento input; su value es el texto actual.", "e.target は input 要素。その value がいまの文字列だよ。"),
      win: [{ t: "value", actor: "hero", text: '"Ada"' }],
    },
    {
      kind: "predict",
      prompt: HTML,
      code: '<input defaultValue="Ada" />',
      options: ['<input value="Ada"/>', '<input defaultValue="Ada"/>', "<input/>"],
      answer: 0,
      output: '<input value="Ada"/>',
      check: { program: show("", '<input defaultValue="Ada" />'), compiles: true, stdout: '<input value="Ada"/>' },
      explain: L("defaultValue is UNCONTROLLED: it only sets the starting text, then the DOM owns it.", "defaultValue es NO CONTROLADO: solo pone el texto inicial y luego el DOM es su dueño.", "defaultValue は非制御。最初の文字を入れるだけで、その後は DOM が持つよ。"),
    },
    {
      kind: "pick",
      prompt: L("Stop the form from reloading the page", "Evita que el formulario recargue la página", "フォームでページを再読み込みさせない"),
      code: "<form onSubmit={e => {\n  e.___();\n  save();\n}}>",
      options: ["preventDefault", "stopPropagation"],
      answer: 0,
      check: {
        program: `${HEAD}const save = () => console.log("saved");\nconst form = <form onSubmit={e => {\n  e.preventDefault();\n  save();\n}} />;\nform.props.onSubmit({ preventDefault: () => console.log("no reload") });`,
        compiles: true,
        stdout: "no reload\nsaved",
      },
      explain: L("preventDefault cancels the browser's default action (the reload). stopPropagation only stops bubbling.", "preventDefault cancela la acción por defecto (recargar). stopPropagation solo frena la propagación.", "preventDefault は既定の動作（再読み込み）を止める。stopPropagation は伝播を止めるだけ。"),
    },
    say(L(
      "Clicks BUBBLE: the button's handler runs first, then its parent's. e.stopPropagation() stops the climb.",
      "Los clics SUBEN: primero corre el handler del botón y luego el del padre. e.stopPropagation() frena la subida.",
      "クリックは伝播する。ボタンのハンドラーが先、次に親。e.stopPropagation() で止められるよ。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: "function onName(e: React.ChangeEvent<HTMLInputElement>) {\n  console.log(e.target.value);\n}\n<input onChange={onName} />",
      options: [YES, NO],
      answer: 0,
      check: { program: `${HEAD}function onName(e: React.ChangeEvent<HTMLInputElement>) {\n  console.log(e.target.value);\n}\nconst field = <input onChange={onName} />;`, compiles: true },
      explain: L("React.ChangeEvent<HTMLInputElement> is the exact type of an input's change event.", "React.ChangeEvent<HTMLInputElement> es el tipo exacto del evento change de un input.", "React.ChangeEvent<HTMLInputElement> が input の change イベントの正確な型だよ。"),
    },
    {
      kind: "run",
      prompt: L("Fix it: nothing may run during render", "Arréglalo: nada debe correr al renderizar", "直そう：レンダー中に実行させない"),
      starter: `${HEAD}\nconst log: string[] = [];\nfunction Button({ onPress, label }: { onPress: () => void; label: string }) {\n  return <button onClick={onPress()}>{label}</button>;\n}\n\nrenderToStaticMarkup(<Button label="Save" onPress={() => log.push("saved")} />);\nconsole.log("calls during render:", log.length);\n`,
      solution: `${HEAD}\nconst log: string[] = [];\nfunction Button({ onPress, label }: { onPress: () => void; label: string }) {\n  return <button onClick={onPress}>{label}</button>;\n}\n\nrenderToStaticMarkup(<Button label="Save" onPress={() => log.push("saved")} />);\nconsole.log("calls during render:", log.length);\n`,
      expect: "calls during render: 0",
      fallback: [
        String.raw`onClick=\{\s*onPress\s*\}`,
        String.raw`onClick=\{\s*\(\s*\)\s*=>\s*onPress\s*\(\s*\)\s*\}`,
      ],
      explain: L("onClick={onPress()} calls it while rendering. Pass onPress itself so React calls it on click.", "onClick={onPress()} la llama al renderizar. Pasa onPress tal cual para que React la llame al hacer clic.", "onClick={onPress()} はレンダー中に呼んでしまう。onPress そのものを渡そう。"),
    },
  ],
};

// ─── 2.3 Updating objects and arrays ─────────────────────────────────────────
const updatingObjectsAndArrays: LessonDef = {
  slug: "updating-objects-and-arrays",
  title: L("Never scratch the crystal", "Nunca rayes el cristal", "クリスタルを削らない"),
  concept: "immutability",
  mode: "lesson",
  xp: 80,
  enemy: "react/stale-closure",
  enemyName: L("OLD AMBER", "ÁMBAR VIEJO", "古びた琥珀"),
  beats: [
    say(L(
      "Never scratch the crystal. React compares state by reference: same object means nothing changed, so no re-render.",
      "Nunca rayes el cristal. React compara el estado por referencia: mismo objeto significa sin cambios, así que no re-renderiza.",
      "クリスタルは削らないで。React は参照で比べる。同じオブジェクトなら「変化なし」で再レンダーしないよ。",
    )),
    {
      kind: "act",
      prompt: L("Scratch the gem, then forge a new one", "Raya la gema y luego forja una nueva", "宝石を削ってから、新しく作ろう"),
      steps: [
        {
          label: L("STATE", "ESTADO", "状態"),
          line: "const [hero, setHero] = useState({ hp: 3 });",
          effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "hero", value: "hp: 3" }],
        },
        {
          label: L("SCRATCH", "RAYAR", "削る"),
          line: "hero.hp = 5; setHero(hero);",
          effects: [{ t: "value", actor: "hero", text: "hp: 5?" }, { t: "shake" }, { t: "banner", text: L("NO RENDER", "SIN RENDER", "レンダーなし") }],
        },
        {
          label: L("NEW COPY", "COPIA NUEVA", "新しいコピー"),
          line: "setHero({ ...hero, hp: 5 });",
          effects: [{ t: "enter", actor: "ally" }, { t: "clone", to: "ally" }, { t: "tag", actor: "ally", text: "next", value: "hp: 5" }, { t: "banner", text: RENDER }],
        },
      ],
    },
    {
      kind: "predict",
      prompt: LOGS,
      code: "const before = { hp: 3 };\nconst after = before;\nafter.hp = 5;\nconsole.log(Object.is(before, after));",
      options: ["true", "false"],
      answer: 0,
      output: "true",
      check: { program: "const before = { hp: 3 };\nconst after = before;\nafter.hp = 5;\nconsole.log(Object.is(before, after));", compiles: true, stdout: "true" },
      explain: L("Both names point to ONE object. React sees the same reference and skips the render.", "Ambos nombres apuntan a UN objeto. React ve la misma referencia y se salta el render.", "ふたつの名前はひとつのオブジェクトを指す。同じ参照なので React はレンダーを省くよ。"),
      setup: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "before" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "after" }],
      win: [{ t: "lend", to: "ally" }, { t: "say", actor: "ally", text: L("Same gem!", "¡Misma gema!", "同じ宝石！") }],
    },
    {
      kind: "pick",
      prompt: L("Which call triggers a re-render?", "¿Qué llamada provoca un re-render?", "再レンダーされるのはどれ？"),
      code: "// hero.hp was 3\nsetHero(___);",
      options: ["{ ...hero, hp: 5 }", "hero"],
      answer: 0,
      check: {
        program: "const hero = { hp: 3 };\nconst next = { ...hero, hp: 5 };\nconsole.log(Object.is(hero, next) ? \"skip\" : \"render\", next.hp);",
        compiles: true,
        stdout: "render 5",
      },
      explain: L("The spread makes a NEW object, so Object.is says it changed and React renders.", "El spread crea un objeto NUEVO, así que Object.is dice que cambió y React renderiza.", "スプレッドで新しいオブジェクトができ、Object.is が変化を検出して React がレンダーする。"),
      win: [{ t: "enter", actor: "ally" }, { t: "clone", to: "ally" }, { t: "banner", text: RENDER }],
      setup: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "hero", value: "hp: 3" }],
    },
    {
      kind: "pick",
      prompt: L("Add an item to the state array", "Agrega un item al arreglo del estado", "状態の配列に追加しよう"),
      code: 'import { useState } from "react";\nfunction Bag() {\n  const [items, setItems] = useState<string[]>([]);\n  const add = (item: string) => setItems(___);\n  return null;\n}',
      options: ["[...items, item]", "items.push(item)"],
      answer: 0,
      check: { compiles: true, wrongFail: true },
      explain: L("push mutates the old array and returns a number. A spread builds a new array.", "push muta el arreglo viejo y devuelve un número. Un spread crea un arreglo nuevo.", "push は古い配列を変更して数値を返す。スプレッドなら新しい配列ができる。"),
    },
    say(L(
      "Arrays: add with [...a, x], remove with filter, change with map. Avoid push, splice, sort and reverse on state.",
      "Arreglos: agrega con [...a, x], quita con filter, cambia con map. Evita push, splice, sort y reverse en el estado.",
      "配列は追加 [...a, x]、削除 filter、変更 map。状態に push・splice・sort・reverse は使わない。",
    )),
    {
      kind: "type",
      prompt: L("Remove the item with this id", "Quita el item con este id", "この id の項目を削除しよう"),
      code: "setItems(items.___(i => i.id !== id));",
      answer: "filter",
      check: {
        program: "const items = [{ id: 1 }, { id: 2 }];\nconst id = 1;\nconst next = items.filter(i => i.id !== id);\nconsole.log(next.length, items.length);",
        compiles: true,
        stdout: "1 2",
      },
      explain: L("filter returns a NEW array without the removed item; the old one stays intact.", "filter devuelve un arreglo NUEVO sin el item; el viejo queda intacto.", "filter は項目を除いた新しい配列を返す。元の配列はそのままだよ。"),
    },
    {
      kind: "predict",
      prompt: LOGS,
      code: "const a = [{ id: 1, done: false }];\nconst b = a.map(t => t.id === 1 ? { ...t, done: true } : t);\nconsole.log(a[0].done, a === b);",
      options: ["false false", "true false", "true true"],
      answer: 0,
      output: "false false",
      check: { program: "const a = [{ id: 1, done: false }];\nconst b = a.map(t => t.id === 1 ? { ...t, done: true } : t);\nconsole.log(a[0].done, a === b);", compiles: true, stdout: "false false" },
      explain: L("map builds a new array and the spread a new todo: the old state is untouched.", "map crea un arreglo nuevo y el spread un todo nuevo: el estado viejo no se toca.", "map で新しい配列、スプレッドで新しい todo。古い状態はそのまま。"),
    },
    {
      kind: "pick",
      prompt: L("Move Ada to Lima", "Muda a Ada a Lima", "Ada を Lima に引っ越させよう"),
      code: 'import { useState } from "react";\ntype Person = { name: string; address: { city: string } };\nfunction Profile() {\n  const [p, setP] = useState<Person>({ name: "Ada", address: { city: "Quito" } });\n  const move = () => setP(___);\n  return null;\n}',
      options: ['{ ...p, address: { ...p.address, city: "Lima" } }', '{ ...p, city: "Lima" }'],
      answer: 0,
      check: { compiles: true, wrongFail: true },
      explain: L("Nested data needs a nested spread: copy p, then copy address with the new city.", "Los datos anidados piden spread anidado: copia p y luego address con la nueva city.", "入れ子のデータには入れ子のスプレッド。p をコピーし、address も新しい city でコピー。"),
    },
    {
      kind: "predict",
      prompt: LOGS,
      code: "const items = [3, 1, 2];\nconst sorted = items.sort();\nconsole.log(sorted === items, items);",
      options: ["true [ 1, 2, 3 ]", "false [ 3, 1, 2 ]", "false [ 1, 2, 3 ]"],
      answer: 0,
      output: "true [ 1, 2, 3 ]",
      check: { program: "const items = [3, 1, 2];\nconst sorted = items.sort();\nconsole.log(sorted === items, items);", compiles: true, stdout: "true [ 1, 2, 3 ]" },
      explain: L("sort works IN PLACE and returns the same array. For state, sort a copy: [...items].sort().", "sort trabaja EN SITIO y devuelve el mismo arreglo. Para el estado, ordena una copia: [...items].sort().", "sort はその場で並べ替え、同じ配列を返す。状態ならコピー [...items].sort() を使おう。"),
      win: [{ t: "shake" }, { t: "say", actor: "enemy", text: L("Scratched!", "¡Rayado!", "削れた！") }],
    },
    {
      kind: "order",
      prompt: L("Order it: toggle a todo without mutating", "Ordena: alterna un todo sin mutar", "並べよう：変更せずに todo を切り替え"),
      lines: [
        "function toggle(todos: Todo[], id: number) {",
        "  return todos.map(t =>",
        "    t.id === id ? { ...t, done: !t.done } : t",
        "  );",
        "}",
      ],
      check: {
        program: "type Todo = { id: number; done: boolean };\nfunction toggle(todos: Todo[], id: number) {\n  return todos.map(t =>\n    t.id === id ? { ...t, done: !t.done } : t\n  );\n}\nconst a = [{ id: 1, done: false }];\nconsole.log(toggle(a, 1)[0].done, a[0].done);",
        compiles: true,
        stdout: "true false",
      },
      explain: L("map returns a new array; only the matching todo is replaced by a spread copy.", "map devuelve un arreglo nuevo; solo el todo que coincide se cambia por una copia con spread.", "map は新しい配列を返し、該当する todo だけをスプレッドのコピーに置き換える。"),
    },
    {
      kind: "run",
      prompt: L("Fix toggle: don't scratch the old state", "Arregla toggle: no rayes el estado viejo", "toggle を直そう：古い状態を削らない"),
      starter: 'type Todo = { id: number; done: boolean };\n\nfunction toggle(todos: Todo[], id: number) {\n  const t = todos.find(t => t.id === id)!;\n  t.done = !t.done;\n  return todos;\n}\n\nconst before = [{ id: 1, done: false }, { id: 2, done: false }];\nconst after = toggle(before, 2);\nconsole.log(after === before, before[1].done, after[1].done);\n',
      solution: 'type Todo = { id: number; done: boolean };\n\nfunction toggle(todos: Todo[], id: number) {\n  return todos.map(t => t.id === id ? { ...t, done: !t.done } : t);\n}\n\nconst before = [{ id: 1, done: false }, { id: 2, done: false }];\nconst after = toggle(before, 2);\nconsole.log(after === before, before[1].done, after[1].done);\n',
      expect: "false false true",
      fallback: [
        String.raw`todos\.map\([\s\S]*\.\.\.\s*t\b[\s\S]*done\s*:\s*!\s*t\.done`,
        String.raw`\[\s*\.\.\.\s*todos\s*\][\s\S]*\.\.\.\s*t\b`,
      ],
      explain: L("Return a NEW array with a NEW todo: map plus a spread. The old state stays as it was.", "Devuelve un arreglo NUEVO con un todo NUEVO: map más spread. El estado viejo queda como estaba.", "新しい配列と新しい todo を返そう。map とスプレッドで、古い状態はそのまま。"),
    },
  ],
};

// ─── 2.4 Sharing state ───────────────────────────────────────────────────────
const DISPLAY = "function Display({ value }: { value: number }) {\n  return <b>{value}</b>;\n}";
const PANEL = "function Panel() {\n  const [level] = useState(7);\n  return <div><Display value={level} /><Display value={level} /></div>;\n}";

const sharingState: LessonDef = {
  slug: "sharing-state",
  title: L("One source of truth", "Una sola fuente de verdad", "ただひとつの真実"),
  concept: "lifting-state",
  mode: "lesson",
  xp: 80,
  enemy: "react/key-twins",
  enemyName: L("QUARREL TWINS", "GEMELOS RIÑENDO", "けんか双子"),
  beats: [
    say(L(
      "These twins each kept their own crystal and now they disagree. Fix: LIFT the state up to their closest common parent.",
      "Estos gemelos guardaban cada uno su cristal y ahora no coinciden. Solución: SUBE el estado a su padre común más cercano.",
      "双子がそれぞれクリスタルを持ち、食い違ってしまった。状態をいちばん近い共通の親へ「持ち上げ」よう。",
    )),
    {
      kind: "act",
      prompt: L("Lift the crystal to the parent", "Sube el cristal al padre", "クリスタルを親に持ち上げよう"),
      steps: [
        {
          label: L("PARENT", "PADRE", "親"),
          line: "const [level, setLevel] = useState(7);",
          effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "Panel", value: "level: 7" }],
        },
        {
          label: L("CHILD 1", "HIJO 1", "子 1"),
          line: "<Display value={level} />",
          effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Display", value: "7" }, { t: "clone", to: "ally" }],
        },
        {
          label: L("CHILD 2", "HIJO 2", "子 2"),
          line: "<Display value={level} />",
          effects: [{ t: "enter", actor: "enemy" }, { t: "tag", actor: "enemy", text: "Display", value: "7" }, { t: "clone", to: "enemy" }],
        },
        {
          label: L("RENDER", "RENDERIZAR", "レンダー"),
          line: "renderToStaticMarkup(<Panel />);",
          effects: [{ t: "banner", text: L("IN SYNC", "EN SINTONÍA", "そろった！") }, { t: "print", text: "<div><b>7</b><b>7</b></div>" }],
          output: "<div><b>7</b><b>7</b></div>",
        },
      ],
    },
    {
      kind: "predict",
      prompt: HTML,
      code: `${DISPLAY}\n${PANEL}\n<Panel />`,
      options: ["<div><b>7</b><b>7</b></div>", "<div><b>7</b><b>0</b></div>", "<div><b></b><b></b></div>"],
      answer: 0,
      output: "<div><b>7</b><b>7</b></div>",
      check: { program: show(`${DISPLAY}\n${PANEL}`, "<Panel />"), compiles: true, stdout: "<div><b>7</b><b>7</b></div>" },
      explain: L("One state in the parent, passed down as a prop: both children show the same 7.", "Un estado en el padre, pasado como prop: ambos hijos muestran el mismo 7.", "親の状態ひとつをプロップスで渡すので、ふたりとも同じ 7 を表示する。"),
    },
    {
      kind: "predict",
      prompt: L("Two tabs must show the same active tab", "Dos pestañas deben mostrar la misma activa", "ふたつのタブで同じ active を表示するには"),
      code: "// Tab A and Tab B must always agree.\n// Where does this line live?\nconst [active, setActive] = useState(\"map\");",
      options: [L("In their common parent", "En su padre común", "共通の親に置く"), L("A copy in each tab", "Una copia en cada pestaña", "各タブに複製する")],
      answer: 0,
      check: {
        program: show('function Tab({ active }: { active: string }) {\n  return <b>{active}</b>;\n}\nfunction Tabs() {\n  const [active] = useState("map");\n  return <nav><Tab active={active} /><Tab active={active} /></nav>;\n}', "<Tabs />"),
        compiles: true,
        stdout: "<nav><b>map</b><b>map</b></nav>",
      },
      explain: L("Two copies can drift apart. One state in the parent is the single source of truth.", "Dos copias pueden desincronizarse. Un estado en el padre es la única fuente de verdad.", "複製はずれていく。親に状態をひとつ置けば、それが唯一の真実になる。"),
      win: [{ t: "banner", text: L("IN SYNC", "EN SINTONÍA", "そろった！") }],
    },
    say(L(
      "Don't store what you can COMPUTE. Derive values during render: const fullName = first + \" \" + last;",
      "No guardes lo que puedes CALCULAR. Deriva valores al renderizar: const fullName = first + \" \" + last;",
      "計算できるものは保存しない。レンダー中に導き出そう：const fullName = first + \" \" + last;",
    )),
    {
      kind: "pick",
      prompt: L("Derive fullName during render", "Deriva fullName al renderizar", "レンダー中に fullName を導こう"),
      code: 'function Name({ first, last }: { first: string; last: string }) {\n  const fullName = ___;\n  return <p>{fullName}</p>;\n}\n<Name first="Ada" last="Lovelace" />',
      options: ['first + " " + last', '"first last"'],
      answer: 0,
      check: { program: show('function Name({ first, last }: { first: string; last: string }) {\n  const fullName = first + " " + last;\n  return <p>{fullName}</p>;\n}', '<Name first="Ada" last="Lovelace" />'), compiles: true, stdout: "<p>Ada Lovelace</p>" },
      explain: L("Computed from props on every render, so it can never go out of date. No extra state needed.", "Se calcula desde las props en cada render, así nunca queda desactualizado. Sin estado extra.", "毎回プロップスから計算するので古くならない。余分な状態はいらないよ。"),
    },
    say(L(
      "State lives at a POSITION in the tree. Same component, same spot: state is kept. A new key: state resets.",
      "El estado vive en una POSICIÓN del árbol. Mismo componente, mismo lugar: se conserva. Una key nueva: se reinicia.",
      "状態はツリーの「位置」に住む。同じ部品・同じ場所なら保たれ、キーが変わればリセットされる。",
    )),
    {
      kind: "pick",
      prompt: L("Reset the form when userId changes", "Reinicia el formulario si cambia userId", "userId が変わったらフォームをリセット"),
      code: 'import React from "react";\nfunction Form() {\n  return <form />;\n}\nconst userId = 42;\nconst el = <Form ___={userId} />;',
      options: ["key", "id"],
      answer: 0,
      check: { compiles: true, wrongFail: true },
      explain: L("A different key makes React treat it as a NEW Form: old state is dropped. id isn't a prop of Form.", "Una key distinta hace que React lo trate como un Form NUEVO y descarta el estado. id no es prop de Form.", "キーが変わると React は新しい Form とみなし、古い状態を捨てる。id は Form のプロップスじゃない。"),
      win: [{ t: "drop" }, { t: "banner", text: L("FRESH FORM", "FORM NUEVO", "まっさら！") }],
    },
    say(L(
      "A child can't change its parent's state directly. Pass the setter down: data flows down, events flow up.",
      "Un hijo no puede cambiar el estado del padre directamente. Pásale el setter: los datos bajan, los eventos suben.",
      "子は親の状態を直接変えられない。セッターを渡そう。データは下へ、イベントは上へ流れる。",
    )),
    {
      kind: "predict",
      prompt: COMPILES,
      code: 'function Child({ onPick }: { onPick: (tab: string) => void }) {\n  return <button onClick={() => onPick("map")}>Map</button>;\n}\nfunction Parent() {\n  const [tab, setTab] = useState("bag");\n  return <Child onPick={setTab} />;\n}',
      options: [YES, NO],
      answer: 0,
      check: { program: `${HEAD}function Child({ onPick }: { onPick: (tab: string) => void }) {\n  return <button onClick={() => onPick("map")}>Map</button>;\n}\nfunction Parent() {\n  const [tab, setTab] = useState("bag");\n  return <Child onPick={setTab} />;\n}`, compiles: true },
      explain: L("setTab accepts a string, so it fits (tab: string) => void. The child calls it to ask for a change.", "setTab acepta un string, así que encaja en (tab: string) => void. El hijo lo llama para pedir un cambio.", "setTab は string を受け取るので (tab: string) => void に合う。子はそれを呼んで変更を頼む。"),
      setup: [{ t: "tag", actor: "hero", text: "Parent", value: "bag" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Child" }],
      win: [{ t: "say", actor: "ally", text: L("Map, please!", "¡Mapa, porfa!", "マップにして！") }, { t: "value", actor: "hero", text: "map" }],
    },
    {
      kind: "type",
      prompt: L("Pass level down to Display", "Pasa level hacia Display", "level を Display に渡そう"),
      code: `${DISPLAY}\n<Display ___={level} />`,
      answer: "value",
      check: { program: show(`${DISPLAY}\nconst level = 7;`, "<Display value={level} />"), compiles: true, stdout: "<b>7</b>" },
      explain: L("The prop name must match what Display destructures: value.", "El nombre de la prop debe coincidir con lo que Display desestructura: value.", "プロップスの名前は Display が受け取る名前 value と同じにしよう。"),
      win: [{ t: "print", text: "<b>7</b>" }],
    },
    {
      kind: "run",
      prompt: L("Fix it: both displays must show 7", "Arréglalo: ambos displays deben mostrar 7", "直そう：両方の Display に 7 を出して"),
      starter: `${HEAD}\nfunction Display({ value }: { value: number }) {\n  const [v] = useState(0);\n  return <b>{v}</b>;\n}\n${PANEL}\n\nconsole.log(renderToStaticMarkup(<Panel />));\n`,
      solution: `${HEAD}\nfunction Display({ value }: { value: number }) {\n  return <b>{value}</b>;\n}\n${PANEL}\n\nconsole.log(renderToStaticMarkup(<Panel />));\n`,
      expect: "<div><b>7</b><b>7</b></div>",
      fallback: [
        String.raw`<b>\{\s*value\s*\}<\/b>`,
        String.raw`useState\(\s*value\s*\)`,
      ],
      explain: L("Display kept its own copy at 0. Use the value prop: the parent's state is the single source of truth.", "Display tenía su propia copia en 0. Usa la prop value: el estado del padre es la única fuente de verdad.", "Display は自分用のコピー 0 を持っていた。プロップスの value を使えば、親の状態が唯一の真実になる。"),
    },
  ],
};

// ─── Boss: State Shade ───────────────────────────────────────────────────────
const COUNTER = "function Counter({ start }: { start: number }) {\n  const [n] = useState(start);\n  return <b>{n}</b>;\n}";

const stateShade: LessonDef = {
  slug: "state-shade",
  title: L("BOSS: State Shade", "JEFE: Sombra del Estado", "ボス：状態の影"),
  concept: "state",
  mode: "boss",
  xp: 190,
  enemy: "ghost",
  enemyName: L("STATE SHADE", "SOMBRA DEL ESTADO", "状態の影"),
  beats: [
    enemySays(L(
      "I whisper stale snapshots and scratch every crystal I touch. Click if you dare!",
      "Susurro fotos viejas y rayo cada cristal que toco. ¡Haz clic si te atreves!",
      "古いスナップショットをささやき、触れたクリスタルはすべて削ってやる。クリックしてみな！",
    )),
    {
      kind: "predict", time: 15, prompt: AFTER_CLICK,
      code: "// count is 0\nsetCount(count + 5);\nsetCount(c => c + 1);\nsetCount(42);",
      options: ["6", "42", "43"], answer: 1,
      check: { program: queue("  setCount(count + 5);\n  setCount(c => c + 1);\n  setCount(42);"), compiles: true, stdout: "42" },
      explain: L("The last update replaces everything with 42.", "La última actualización lo reemplaza todo por 42.", "最後の更新がすべてを 42 に置き換える。"),
    },
    {
      kind: "predict", time: 12, prompt: AFTER_CLICK,
      code: "// count is 0\nsetCount(c => c + 1);\nsetCount(c => c + 1);\nsetCount(c => c + 1);",
      options: ["1", "3"], answer: 1,
      check: { program: queue("  setCount(c => c + 1);\n  setCount(c => c + 1);\n  setCount(c => c + 1);"), compiles: true, stdout: "3" },
      explain: L("Updaters chain: 0 → 1 → 2 → 3.", "Los updaters se encadenan: 0 → 1 → 2 → 3.", "更新関数はつながる：0 → 1 → 2 → 3。"),
    },
    {
      kind: "predict", time: 12, prompt: LOGS,
      code: "// count is 0\nsetCount(count + 5);\nconsole.log(count);",
      options: ["0", "5"], answer: 0,
      check: { program: "const count = 0;\nconst setCount = (n: number) => {};\nsetCount(count + 5);\nconsole.log(count);", compiles: true, stdout: "0" },
      explain: L("A snapshot: count changes only in the next render.", "Una foto: count cambia solo en el siguiente render.", "スナップショット。count が変わるのは次のレンダー。"),
    },
    {
      kind: "pick", time: 12,
      prompt: L("Run handleClick only on click", "Ejecuta handleClick solo al hacer clic", "クリック時だけ handleClick を実行"),
      code: 'import React from "react";\nconst handleClick = () => console.log("go");\nconst btn = <button onClick={___}>Go</button>;',
      options: ["handleClick", "handleClick()"], answer: 0,
      check: { compiles: true, wrongFail: true },
      explain: L("Pass the function, don't call it.", "Pasa la función, no la llames.", "関数を渡す。呼ばないで。"),
    },
    {
      kind: "type", time: 15,
      prompt: L("Type the empty list of names", "Tipa la lista vacía de nombres", "空の名前リストに型を付けよう"),
      code: "const [names, setNames] = useState<___>([]);",
      answer: "string[]",
      check: { program: `${HEAD}function List() {\n  const [names, setNames] = useState<string[]>([]);\n  return <p onClick={() => setNames(["Ada"])}>{names.length}</p>;\n}\nconsole.log(renderToStaticMarkup(<List />));`, compiles: true, stdout: "<p>0</p>" },
      explain: L("Without it, [] is never[] and nothing fits.", "Sin él, [] es never[] y nada cabe.", "型がないと [] は never[] で何も入らない。"),
    },
    {
      kind: "pick", time: 12,
      prompt: L("Remove \"x\" from the state array", "Quita \"x\" del arreglo del estado", "状態の配列から \"x\" を削除"),
      code: 'import { useState } from "react";\nfunction Bag() {\n  const [items, setItems] = useState(["x", "y"]);\n  const drop = () => setItems(items.___(i => i !== "x"));\n  return null;\n}',
      options: ["filter", "splice", "forEach"], answer: 0,
      check: { compiles: true, wrongFail: true },
      explain: L("filter returns a new array without \"x\".", "filter devuelve un arreglo nuevo sin \"x\".", "filter は \"x\" を除いた新しい配列を返す。"),
    },
    {
      kind: "predict", time: 12, prompt: LOGS,
      code: "const a = { hp: 1 };\nconst b = { ...a, hp: 2 };\nconsole.log(a.hp, a === b);",
      options: ["1 false", "2 true", "2 false"], answer: 0,
      check: { program: "const a = { hp: 1 };\nconst b = { ...a, hp: 2 };\nconsole.log(a.hp, a === b);", compiles: true, stdout: "1 false" },
      explain: L("The spread copies; the original stays at 1.", "El spread copia; el original sigue en 1.", "スプレッドはコピー。元は 1 のまま。"),
    },
    {
      kind: "predict", time: 12, prompt: LOGS,
      code: 'const list = ["a"];\nlist.push("b");\nconsole.log(Object.is(list, list));',
      options: ["true", "false"], answer: 0,
      check: { program: 'const list = ["a"];\nlist.push("b");\nconsole.log(Object.is(list, list));', compiles: true, stdout: "true" },
      explain: L("Same reference after push: setList(list) would skip the render.", "Misma referencia tras push: setList(list) se saltaría el render.", "push 後も同じ参照。setList(list) ではレンダーされない。"),
    },
    {
      kind: "predict", time: 15, prompt: HTML,
      code: `${COUNTER}\n<div><Counter start={1} /><Counter start={2} /></div>`,
      options: ["<div><b>1</b><b>2</b></div>", "<div><b>1</b><b>1</b></div>", "<div><b>2</b><b>2</b></div>"], answer: 0,
      check: { program: show(COUNTER, "<div><Counter start={1} /><Counter start={2} /></div>"), compiles: true, stdout: "<div><b>1</b><b>2</b></div>" },
      explain: L("Each instance has its own state.", "Cada instancia tiene su propio estado.", "インスタンスごとに自分の状態を持つ。"),
    },
    {
      kind: "predict", time: 12, prompt: HTML,
      code: '<input defaultValue="Bo" />',
      options: ['<input value="Bo"/>', '<input defaultValue="Bo"/>'], answer: 0,
      check: { program: show("", '<input defaultValue="Bo" />'), compiles: true, stdout: '<input value="Bo"/>' },
      explain: L("defaultValue sets only the starting value.", "defaultValue solo fija el valor inicial.", "defaultValue は最初の値だけを決める。"),
    },
    {
      kind: "pick", time: 12,
      prompt: L("Reset the form when userId changes", "Reinicia el formulario si cambia userId", "userId が変わったらリセット"),
      code: 'import React from "react";\nfunction Form() {\n  return <form />;\n}\nconst userId = 42;\nconst el = <Form ___={userId} />;',
      options: ["key", "id"], answer: 0,
      check: { compiles: true, wrongFail: true },
      explain: L("A new key means a new Form with fresh state.", "Una key nueva es un Form nuevo con estado limpio.", "新しいキーは、まっさらな状態の新しい Form。"),
    },
    enemySays(L(
      "No stale snapshot fooled you... my crystals stay whole. The forest is yours, state keeper!",
      "Ninguna foto vieja te engañó... mis cristales siguen intactos. ¡El bosque es tuyo, guardián del estado!",
      "古いスナップショットにだまされなかったか…クリスタルは無傷だ。森はおまえのもの、状態の守り手よ！",
    )),
  ],
};

export const stateForest: RegionDef = {
  slug: "state-forest",
  name: L("State Forest", "Bosque del Estado", "状態の森"),
  subtitle: L("useState · events · updates · sharing", "useState · eventos · cambios · compartir", "useState・イベント・更新・共有"),
  theme: "forest",
  lessons: [useStateLesson, eventsAndForms, updatingObjectsAndArrays, sharingState, stateShade],
};
