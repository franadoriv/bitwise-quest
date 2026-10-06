import type { ExamDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { juniorTasks, midTasks, seniorTasks } from "./tasks.ts";
import { juniorTraceDebug, midTraceDebug, seniorTraceDebug } from "./trace-debug.ts";

// Entry exams that simulate company technical screenings for React roles.
// Topic mix, bank sizes and question ideas follow docs/research/typescript-react-curriculum.md
// (React moon, entry exams) and docs/research/react-hiring-assessments.md.
// Snippets are TSX. Render claims are proven with renderToStaticMarkup; behavior after clicks or
// effects (not observable in a static render) is anchored to react.dev and checked to type-check.

/** Imports every snippet program starts with (hidden from the player to keep code short). */
const H = `import React, { useState, useEffect, useLayoutEffect, useRef, useContext, createContext, useReducer, memo, useMemo, useCallback, useTransition, Suspense, lazy, StrictMode, Profiler, Component } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
`;
/** Outside-world functions the snippets call (an API, a chat server...). */
const STUBS = `declare function tick(): void;
declare function connect(o: { roomId: string }): () => void;
declare function fetchUser(id: number): Promise<string>;
declare function select(id: number): void;
declare function measure(): void;
`;
/** Full program for a snippet: imports + stubs + extra hidden declarations + the code (answer filled in). */
const P = (code: string, fill?: string, extra = "") => H + STUBS + extra + (fill == null ? code : code.replace("___", fill));

const YES = L("Yes", "Sí", "はい");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルは通る？");
const PRINTS = L("What does it print?", "¿Qué imprime?", "何が出力される？");
const SERVER_PRINTS = L("Server render: what does it print?", "Render en servidor: ¿qué imprime?", "サーバー描画で何が出力される？");
const AFTER_CLICK = L("After one click, the button shows…", "Tras un clic, el botón muestra…", "1回クリック後、ボタンの表示は？");

export const exams: ExamDef[] = [
  // ─── JUNIOR ───────────────────────────────────────────────────────────────
  {
    slug: "junior",
    level: "junior",
    title: L("Junior React Developer", "React Developer Junior", "ジュニア React 開発者"),
    description: L(
      "Initial screen (online quiz): JSX, components, props, lists and keys, state, events, immutable updates, effects.",
      "Filtro inicial (quiz online): JSX, componentes, props, listas y keys, estado, eventos, cambios inmutables, efectos.",
      "初期スクリーニング（オンライン選択式）：JSX、コンポーネント、props、リストと key、状態、イベント、副作用。",
    ),
    count: 12,
    passPct: 70,
    secondsPerQuestion: 30,
    codeCount: 1,
    questions: [
      ...juniorTraceDebug,
      ...juniorTasks,
      // jsx
      {
        topic: "jsx", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'const count = 0;\nconsole.log(renderToStaticMarkup(\n  <p>{count && "items"}</p>\n));',
        options: ["<p>0</p>", "<p></p>", "<p>items</p>"], answer: 0,
        explain: L(
          "&& returns the left side when it is falsy, and React renders the number 0. Only false, null and undefined render nothing. Write count > 0 && ...",
          "&& devuelve el lado izquierdo si es falsy y React pinta el número 0. Solo false, null y undefined no pintan nada. Escribe count > 0 && ...",
          "&& は左辺が falsy ならそれを返し、数値の 0 はそのまま描画される。何も出ないのは false・null・undefined だけ。count > 0 && と書こう。",
        ),
        check: { compiles: true, stdout: "<p>0</p>", program: P('const count = 0;\nconsole.log(renderToStaticMarkup(\n  <p>{count && "items"}</p>\n));') },
      },
      {
        topic: "jsx", difficulty: 1, kind: "pick", prompt: L("Give the div a CSS class", "Dale una clase CSS al div", "div に CSS クラスを付ける"),
        code: 'import React from "react";\nconst card = <div ___="card">Hi</div>;',
        options: ["className", "class", "cssClass"], answer: 0,
        explain: L(
          "JSX is JavaScript, where class is a reserved word, so React uses the DOM property name className. TypeScript rejects class on a div.",
          "JSX es JavaScript, donde class es palabra reservada, así que React usa el nombre de la propiedad del DOM: className. TypeScript rechaza class.",
          "JSX は JavaScript で class は予約語なので、DOM のプロパティ名 className を使う。TypeScript は div の class を拒否するよ。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "jsx", difficulty: 1, kind: "type", prompt: L("Show the variable name inside the p", "Muestra la variable name dentro del p", "p の中に変数 name を表示"),
        code: 'const name = "Ada";\nconsole.log(renderToStaticMarkup(<p>___</p>));', answer: "{name}",
        explain: L(
          "Curly braces open a window to JavaScript inside JSX: {name} inserts its value. Without braces you'd get the literal text name.",
          "Las llaves abren una ventana a JavaScript dentro de JSX: {name} inserta su valor. Sin llaves saldría el texto literal name.",
          "波かっこは JSX の中で JavaScript を使う窓。{name} で値が入る。かっこがないと name という文字がそのまま出るよ。",
        ),
        check: { compiles: true, stdout: "<p>Ada</p>", program: P('const name = "Ada";\nconsole.log(renderToStaticMarkup(<p>___</p>));', "{name}") },
      },
      {
        topic: "jsx", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: "console.log(renderToStaticMarkup(\n  <p>{false}{null}{undefined}ok</p>\n));",
        options: ["<p>ok</p>", "<p>falsenullok</p>", "<p>false null ok</p>"], answer: 0,
        explain: L(
          "false, null and undefined are valid children that render nothing. That's why cond && <Tag /> works for conditional rendering.",
          "false, null y undefined son hijos válidos que no pintan nada. Por eso cond && <Tag /> sirve para renderizar con condición.",
          "false・null・undefined は何も描画しない有効な子要素。だから cond && <Tag /> で条件付き描画ができるんだ。",
        ),
        check: { compiles: true, stdout: "<p>ok</p>", program: P("console.log(renderToStaticMarkup(\n  <p>{false}{null}{undefined}ok</p>\n));") },
      },
      // components
      {
        topic: "components", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: "function hello() {\n  return <p>Hi</p>;\n}\nconst el = <hello />;",
        options: [L("Yes: renders <p>Hi</p>", "Sí: pinta <p>Hi</p>", "はい：<p>Hi</p> を描画"), L("No: lowercase tags are HTML elements", "No: las etiquetas en minúscula son HTML", "いいえ：小文字のタグは HTML 要素")], answer: 1,
        explain: L(
          "JSX treats lowercase tags as built-in HTML elements and capitalized ones as components. TypeScript says <hello> isn't a known element: name it Hello.",
          "JSX trata las etiquetas en minúscula como HTML y las capitalizadas como componentes. TypeScript dice que <hello> no existe: llámalo Hello.",
          "JSX は小文字のタグを HTML 要素、大文字始まりをコンポーネントとして扱う。<hello> は未知の要素とエラーになる。Hello と名付けよう。",
        ),
        check: { compiles: false, program: P("function hello() {\n  return <p>Hi</p>;\n}\nconst el = <hello />;") },
      },
      {
        topic: "components", difficulty: 1, kind: "pick", prompt: L("Read the label prop", "Lee la prop label", "label プロップを受け取る"),
        code: 'import React from "react";\nimport { renderToStaticMarkup } from "react-dom/server";\nfunction Badge({ ___ }: { label: string }) {\n  return <b>{label}</b>;\n}\nconsole.log(renderToStaticMarkup(<Badge label="Gem" />));',
        options: ["label", "props", "this.label"], answer: 0,
        explain: L(
          "Props arrive as one object; destructuring { label } pulls the field out. Function components have no this, and there's no prop named props.",
          "Las props llegan como un objeto; desestructurar { label } saca el campo. Los componentes función no tienen this ni una prop llamada props.",
          "props はひとつのオブジェクトで届き、{ label } と分割代入で取り出す。関数コンポーネントに this はなく、props という名の prop もない。",
        ),
        check: { compiles: true, stdout: "<b>Gem</b>", wrongFail: true },
      },
      {
        topic: "components", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: "function Box({ children }: { children: ReactNode }) {\n  return <div>{children}</div>;\n}\nconsole.log(renderToStaticMarkup(<Box><i>x</i></Box>));",
        options: ["<div><i>x</i></div>", "<div></div>", "<i>x</i>"], answer: 0,
        explain: L(
          "Whatever you nest between a component's tags arrives as the children prop. Box decides where to place it: inside its div.",
          "Lo que anidas entre las etiquetas de un componente llega como la prop children. Box decide dónde ponerlo: dentro de su div.",
          "コンポーネントのタグの間に書いたものは children プロップとして届く。置き場所は Box が決める。ここでは div の中だ。",
        ),
        check: { compiles: true, stdout: "<div><i>x</i></div>", program: P("function Box({ children }: { children: ReactNode }) {\n  return <div>{children}</div>;\n}\nconsole.log(renderToStaticMarkup(<Box><i>x</i></Box>));") },
      },
      // lists_keys
      {
        topic: "lists_keys", difficulty: 1, kind: "pick", prompt: L("Pick the best key", "Elige la mejor key", "いちばん良い key を選ぶ"),
        code: 'type Todo = { id: number; text: string };\nconst todos: Todo[] = [{ id: 7, text: "Train" }];\nconst list = todos.map((todo, i) => (\n  <li key={___}>{todo.text}</li>\n));',
        options: ["todo.id", "i", "Math.random()"], answer: 0,
        explain: L(
          "A key must be stable and unique among siblings. Indexes shift when items move, and random keys change every render, remounting rows and losing state.",
          "Una key debe ser estable y única entre hermanos. El índice cambia al mover items y una key aleatoria cambia en cada render: se pierde el estado.",
          "key は兄弟の中で安定かつ一意であるべき。index は並べ替えでずれ、乱数は毎回変わるので行が作り直され状態が消える。",
        ),
        check: { compiles: true, program: P('type Todo = { id: number; text: string };\nconst todos: Todo[] = [{ id: 7, text: "Train" }];\nconst list = todos.map((todo, i) => (\n  <li key={___}>{todo.text}</li>\n));', "todo.id") },
      },
      {
        topic: "lists_keys", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: 'const gems = ["ruby", "jade"];\nconsole.log(renderToStaticMarkup(\n  <ul>{gems.map((g) => <li key={g}>{g}</li>)}</ul>\n));',
        options: ["<ul><li>ruby</li><li>jade</li></ul>", "<ul>ruby,jade</ul>", "<ul><li>ruby,jade</li></ul>"], answer: 0,
        explain: L(
          "map turns each string into an <li>, and React renders an array of elements in order. The key isn't printed: React keeps it for itself.",
          "map convierte cada string en un <li> y React pinta el arreglo de elementos en orden. La key no se imprime: React la usa internamente.",
          "map で各文字列が <li> になり、React は要素の配列を順に描画する。key は出力されない。React が内部で使うだけだ。",
        ),
        check: { compiles: true, stdout: "<ul><li>ruby</li><li>jade</li></ul>", program: P('const gems = ["ruby", "jade"];\nconsole.log(renderToStaticMarkup(\n  <ul>{gems.map((g) => <li key={g}>{g}</li>)}</ul>\n));') },
      },
      {
        topic: "lists_keys", difficulty: 1, kind: "type", prompt: L("Help React tell the rows apart", "Ayuda a React a distinguir las filas", "React が行を見分けられるように"),
        code: 'const items = [{ id: 1, name: "Key" }];\nconst rows = items.map((item) => <li ___={item.id}>{item.name}</li>);', answer: "key",
        explain: L(
          "key identifies each child among its siblings so React can match it across renders. It isn't passed to the component as a prop.",
          "key identifica a cada hijo entre sus hermanos para que React lo reconozca entre renders. No llega al componente como prop.",
          "key は兄弟の中で各要素を識別し、React がレンダーをまたいで対応づけられるようにする。props としては渡らないよ。",
        ),
        check: { compiles: true, program: P('const items = [{ id: 1, name: "Key" }];\nconst rows = items.map((item) => <li ___={item.id}>{item.name}</li>);', "key") },
      },
      // state
      {
        topic: "state", difficulty: 2, kind: "predict", prompt: AFTER_CLICK,
        code: "function Counter() {\n  const [count, setCount] = useState(0);\n  function handleClick() {\n    setCount(count + 1);\n    setCount(count + 1);\n    setCount(count + 1);\n  }\n  return <button onClick={handleClick}>{count}</button>;\n}",
        options: ["1", "3", "0"], answer: 0,
        explain: L(
          "count is a snapshot: it is 0 for the whole handler, so all three calls ask for 0 + 1. Use setCount(c => c + 1) to stack updates.",
          "count es una foto: vale 0 en todo el handler, así que las tres llamadas piden 0 + 1. Usa setCount(c => c + 1) para acumular.",
          "count はスナップショット。ハンドラ中はずっと 0 なので、3回とも 0 + 1 になる。積み上げるなら setCount(c => c + 1)。",
        ),
        check: { compiles: true, program: P("function Counter() {\n  const [count, setCount] = useState(0);\n  function handleClick() {\n    setCount(count + 1);\n    setCount(count + 1);\n    setCount(count + 1);\n  }\n  return <button onClick={handleClick}>{count}</button>;\n}") },
      },
      {
        topic: "state", difficulty: 1, kind: "pick", prompt: L("Give the component memory", "Dale memoria al componente", "コンポーネントに記憶を持たせる"),
        code: 'import React, { useState, useRef } from "react";\nfunction Counter() {\n  const [count, setCount] = ___(0);\n  return <p>{count}</p>;\n}',
        options: ["useState", "useRef", "state"], answer: 0,
        explain: L(
          "useState returns a pair [value, setter] and keeps the value between renders; calling the setter re-renders. useRef returns one object, not a pair.",
          "useState devuelve un par [valor, setter] y guarda el valor entre renders; el setter re-renderiza. useRef devuelve un objeto, no un par.",
          "useState は [値, セッター] の組を返し、値をレンダー間で保つ。セッターで再レンダーされる。useRef は組でなくオブジェクトを返す。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "state", difficulty: 2, kind: "predict", prompt: AFTER_CLICK,
        code: "function Counter() {\n  const [count, setCount] = useState(0);\n  function handleClick() {\n    setCount((c) => c + 1);\n    setCount((c) => c + 1);\n    setCount((c) => c + 1);\n  }\n  return <button onClick={handleClick}>{count}</button>;\n}",
        options: ["3", "1", "0"], answer: 0,
        explain: L(
          "An updater function receives the pending state, so the three updates queue up: 0 → 1 → 2 → 3.",
          "Una función actualizadora recibe el estado pendiente, así que las tres actualizaciones se encadenan: 0 → 1 → 2 → 3.",
          "更新関数は保留中の状態を受け取るので、3つの更新が順に積み重なる：0 → 1 → 2 → 3。",
        ),
        check: { compiles: true, program: P("function Counter() {\n  const [count, setCount] = useState(0);\n  function handleClick() {\n    setCount((c) => c + 1);\n    setCount((c) => c + 1);\n    setCount((c) => c + 1);\n  }\n  return <button onClick={handleClick}>{count}</button>;\n}") },
      },
      {
        topic: "state", difficulty: 2, kind: "predict", prompt: L("First click: what does it log?", "Primer clic: ¿qué registra?", "最初のクリックで何がログに出る？"),
        code: "function Counter() {\n  const [count, setCount] = useState(0);\n  function handleClick() {\n    setCount(count + 1);\n    console.log(count);\n  }\n  return <button onClick={handleClick}>+</button>;\n}",
        options: ["0", "1", "undefined"], answer: 0,
        explain: L(
          "Setting state doesn't change the variable in the running code; it requests a new render. In this render count is still 0.",
          "Cambiar el estado no modifica la variable en el código que corre; pide un nuevo render. En este render count sigue en 0.",
          "状態をセットしても実行中のコードの変数は変わらない。新しいレンダーを頼むだけ。このレンダーの count は 0 のまま。",
        ),
        check: { compiles: true, program: P("function Counter() {\n  const [count, setCount] = useState(0);\n  function handleClick() {\n    setCount(count + 1);\n    console.log(count);\n  }\n  return <button onClick={handleClick}>+</button>;\n}") },
      },
      // events_forms
      {
        topic: "events_forms", difficulty: 1, kind: "pick", prompt: L("Run handleClick when clicked", "Ejecuta handleClick al hacer clic", "クリック時に handleClick を実行"),
        code: 'import React from "react";\nfunction handleClick() {\n  console.log("saved");\n}\nconst save = <button onClick={___}>Save</button>;',
        options: ["handleClick", "handleClick()"], answer: 0,
        explain: L(
          "Pass the function itself. handleClick() would run it during render and pass its result (void), which TypeScript rejects.",
          "Pasa la función misma. handleClick() la ejecutaría durante el render y pasaría su resultado (void), que TypeScript rechaza.",
          "関数そのものを渡そう。handleClick() だとレンダー中に実行され、戻り値（void）が渡ってしまい TypeScript が拒否する。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "events_forms", difficulty: 2, kind: "pick", prompt: L("Read what the user typed", "Lee lo que escribió el usuario", "入力された文字を読む"),
        code: 'import React, { useState } from "react";\nfunction Search() {\n  const [text, setText] = useState("");\n  function onChange(e: React.ChangeEvent<HTMLInputElement>) {\n    setText(e.target.___);\n  }\n  return <input value={text} onChange={onChange} />;\n}',
        options: ["value", "text", "val"], answer: 0,
        explain: L(
          "e.target is the input element and its text is in .value. Storing it in state and passing value back makes this a controlled input.",
          "e.target es el input y su texto está en .value. Guardarlo en el estado y devolverlo en value lo convierte en un input controlado.",
          "e.target は input 要素で、文字は .value にある。状態に保存して value に戻すと制御されたコンポーネントになる。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "events_forms", difficulty: 1, kind: "type", prompt: L("Stop the submit from reloading the page", "Evita que el envío recargue la página", "送信でページを再読み込みさせない"),
        code: 'function onSubmit(e: React.FormEvent<HTMLFormElement>) {\n  e.___();\n  console.log("sent");\n}', answer: "preventDefault",
        explain: L(
          "Submitting a form makes the browser navigate by default. e.preventDefault() cancels that so your code can handle the data.",
          "Enviar un formulario hace que el navegador navegue por defecto. e.preventDefault() lo cancela para que tu código maneje los datos.",
          "フォーム送信は既定でページ遷移を起こす。e.preventDefault() でそれを止め、データを自分のコードで扱おう。",
        ),
        check: { compiles: true, program: P('function onSubmit(e: React.FormEvent<HTMLFormElement>) {\n  e.___();\n  console.log("sent");\n}', "preventDefault") },
      },
      // immutability
      {
        topic: "immutability", difficulty: 1, kind: "pick", prompt: L("Add an item the React way", "Agrega un item al estilo React", "React 流にアイテムを追加"),
        code: 'import React, { useState } from "react";\nfunction Bag() {\n  const [items, setItems] = useState<string[]>([]);\n  const add = (item: string) => setItems(___);\n  return <p>{items.length}</p>;\n}',
        options: ["[...items, item]", "items.push(item)"], answer: 0,
        explain: L(
          "Replace state, don't mutate it: spread into a new array. push mutates and returns the new length (a number), so TypeScript rejects it.",
          "Reemplaza el estado, no lo mutes: copia en un arreglo nuevo. push muta y devuelve la nueva longitud (un número): TypeScript lo rechaza.",
          "状態は書き換えずに置き換える。スプレッドで新しい配列を作ろう。push は破壊的で長さ（数値）を返すので型エラーになる。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "immutability", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'const user = { name: "Ada", level: 3 };\nconst next = { ...user, name: "Bo" };\nconsole.log(user.name, next.name, user === next);',
        options: ["Ada Bo false", "Bo Bo true", "Ada Bo true"], answer: 0,
        explain: L(
          "Spread copies the fields into a NEW object, then name is overridden. The original stays intact, and the new reference tells React it changed.",
          "El spread copia los campos en un objeto NUEVO y luego cambia name. El original queda intacto y la nueva referencia le avisa a React del cambio.",
          "スプレッドはフィールドを新しいオブジェクトにコピーし name を上書きする。元はそのままで、新しい参照が変更を React に伝える。",
        ),
        check: { compiles: true, stdout: "Ada Bo false" },
      },
      // effects
      {
        topic: "effects", difficulty: 1, kind: "pick", prompt: L("Run the effect once, after mount", "Ejecuta el efecto una vez, al montar", "マウント後に一度だけ副作用を実行"),
        code: 'function Clock() {\n  useEffect(() => {\n    console.log("mounted");\n  }, ___);\n  return <p>tick</p>;\n}',
        options: ["[]", "undefined", "[Date.now()]"], answer: 0,
        explain: L(
          "An empty dependency array has nothing to watch, so the effect runs after the first render only. Without the array it runs after every render.",
          "Un arreglo de dependencias vacío no vigila nada: el efecto corre solo tras el primer render. Sin arreglo corre después de cada render.",
          "空の依存配列は監視する値がないので、最初のレンダー後だけ実行される。配列を省くと毎回のレンダー後に実行されるよ。",
        ),
        check: { compiles: true, program: P('function Clock() {\n  useEffect(() => {\n    console.log("mounted");\n  }, ___);\n  return <p>tick</p>;\n}', "[]") },
      },
      {
        topic: "effects", difficulty: 2, kind: "predict", prompt: SERVER_PRINTS,
        code: 'function C() {\n  useEffect(() => {\n    console.log("effect");\n  });\n  return <p>x</p>;\n}\nconsole.log(renderToStaticMarkup(<C />));',
        options: [L("Only <p>x</p>", "Solo <p>x</p>", "<p>x</p> だけ"), L("effect, then <p>x</p>", "effect y luego <p>x</p>", "effect の後に <p>x</p>"), L("<p>x</p>, then effect", "<p>x</p> y luego effect", "<p>x</p> の後に effect")], answer: 0,
        explain: L(
          "Effects run after React commits to the screen. A server or static render never commits, so the effect never runs.",
          "Los efectos corren después de que React confirma en pantalla. Un render en servidor o estático nunca confirma: el efecto no corre.",
          "副作用は React が画面に反映（コミット）した後に動く。サーバーや静的な描画はコミットしないので、副作用は実行されない。",
        ),
        check: { compiles: true, stdout: "<p>x</p>", program: P('function C() {\n  useEffect(() => {\n    console.log("effect");\n  });\n  return <p>x</p>;\n}\nconsole.log(renderToStaticMarkup(<C />));') },
      },
      // accessibility
      {
        topic: "accessibility", difficulty: 1, kind: "type", prompt: L("Link the label to the input #email", "Une la etiqueta al input #email", "ラベルを入力欄 #email に結ぶ"),
        code: 'console.log(renderToStaticMarkup(\n  <label ___="email">Email</label>\n));', answer: "htmlFor",
        explain: L(
          "In JSX the for attribute is htmlFor (for is a JS keyword). It links the label to the input: clicking it focuses the field and screen readers read it.",
          "En JSX el atributo for es htmlFor (for es palabra de JS). Une la etiqueta al input: al hacer clic enfoca el campo y los lectores de pantalla la leen.",
          "JSX では for 属性は htmlFor（for は JS の予約語）。ラベルと入力欄を結び、クリックでフォーカスし、読み上げにも使われる。",
        ),
        check: { compiles: true, stdout: '<label for="email">Email</label>', program: P('console.log(renderToStaticMarkup(\n  <label ___="email">Email</label>\n));', "htmlFor") },
      },
    ],
  },

  // ─── MID ──────────────────────────────────────────────────────────────────
  {
    slug: "mid",
    level: "mid",
    title: L("Mid-level React Developer", "React Developer Semi-Senior", "ミドル React 開発者"),
    description: L(
      "Technical interview: state queues, effects and cleanup, stale closures, fetch races, context, reducers, hooks, memo.",
      "Entrevista técnica: cola de estado, efectos, closures obsoletos, carreras de datos, contexto, reducers, hooks, memo.",
      "技術面接：状態の更新キュー、副作用、古いクロージャ、データ取得の競合、コンテキスト、フック、メモ化。",
    ),
    count: 14,
    passPct: 70,
    secondsPerQuestion: 40,
    codeCount: 2,
    questions: [
      ...midTraceDebug,
      ...midTasks,
      // state
      {
        topic: "state", difficulty: 2, kind: "predict", prompt: AFTER_CLICK,
        code: "function Score() {\n  const [number, setNumber] = useState(0);\n  function handleClick() {\n    setNumber(number + 5);\n    setNumber((n) => n + 1);\n  }\n  return <button onClick={handleClick}>{number}</button>;\n}",
        options: ["6", "1", "5"], answer: 0,
        explain: L(
          "The queue runs in order: \"replace with 0 + 5\" gives 5, then the updater adds 1 to the pending value: 6.",
          "La cola se procesa en orden: \"reemplaza con 0 + 5\" da 5 y luego la función suma 1 al valor pendiente: 6.",
          "キューは順に処理される。「0 + 5 で置き換え」で 5、次に更新関数が保留中の値に 1 を足して 6。",
        ),
        check: { compiles: true, program: P("function Score() {\n  const [number, setNumber] = useState(0);\n  function handleClick() {\n    setNumber(number + 5);\n    setNumber((n) => n + 1);\n  }\n  return <button onClick={handleClick}>{number}</button>;\n}") },
      },
      {
        topic: "state", difficulty: 2, kind: "predict", prompt: L("One click: how many re-renders?", "Un clic: ¿cuántos re-renders?", "1回のクリックで再レンダーは何回？"),
        code: "function Form() {\n  const [a, setA] = useState(0);\n  const [b, setB] = useState(0);\n  function handleClick() {\n    setA(1);\n    setB(2);\n    setA(3);\n  }\n  return <button onClick={handleClick}>{a + b}</button>;\n}",
        options: ["1", "3", "2"], answer: 0,
        explain: L(
          "React batches all state updates from the same event and re-renders once at the end, showing 5. Since React 18 this also applies in timeouts and promises.",
          "React agrupa las actualizaciones del mismo evento y re-renderiza una vez al final, mostrando 5. Desde React 18 también en timeouts y promesas.",
          "React は同じイベント内の更新をまとめ、最後に1回だけ再レンダーして 5 を表示する。React 18 からはタイマーや Promise 内も同様。",
        ),
        check: { compiles: true, program: P("function Form() {\n  const [a, setA] = useState(0);\n  const [b, setB] = useState(0);\n  function handleClick() {\n    setA(1);\n    setB(2);\n    setA(3);\n  }\n  return <button onClick={handleClick}>{a + b}</button>;\n}") },
      },
      // immutability
      {
        topic: "immutability", difficulty: 2, kind: "pick", prompt: L("Change only the city, keep the zip", "Cambia solo la ciudad, conserva el zip", "zip を残して city だけ変える"),
        code: 'import React, { useState } from "react";\ntype User = { name: string; address: { city: string; zip: string } };\nfunction Move({ start }: { start: User }) {\n  const [user, setUser] = useState(start);\n  const move = () => setUser({ ...user, address: { ___, city: "Lima" } });\n  return <p>{user.address.city}</p>;\n}',
        options: ["...user.address", "user.address", "...address"], answer: 0,
        explain: L(
          "Spread copies one level only. Copy the nested object too, then override city; otherwise zip is lost. user.address alone isn't valid object syntax.",
          "El spread copia un solo nivel. Copia también el objeto anidado y cambia city; si no, se pierde zip. user.address solo no es sintaxis válida.",
          "スプレッドは1階層だけコピーする。入れ子のオブジェクトもコピーしてから city を上書きしないと zip が消える。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "immutability", difficulty: 1, kind: "pick", prompt: L("Remove a todo without mutating", "Quita un todo sin mutar", "書き換えずに todo を削除"),
        code: 'import React, { useState } from "react";\ntype Todo = { id: number; text: string };\nfunction List({ start }: { start: Todo[] }) {\n  const [todos, setTodos] = useState(start);\n  const remove = (id: number) => setTodos(todos.___((t) => t.id !== id));\n  return <p>{todos.length}</p>;\n}',
        options: ["filter", "map", "forEach"], answer: 0,
        explain: L(
          "filter returns a new array without the matching item. map would return booleans and forEach returns nothing; splice would mutate state in place.",
          "filter devuelve un arreglo nuevo sin el item. map devolvería booleanos y forEach no devuelve nada; splice mutaría el estado.",
          "filter は該当要素を除いた新しい配列を返す。map は真偽値の配列、forEach は何も返さない。splice は状態を直接書き換えてしまう。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      // lifting_state
      {
        topic: "lifting_state", difficulty: 2, kind: "pick", prompt: L("Reset Profile's state when userId changes", "Reinicia el estado de Profile si cambia userId", "userId が変わったら状態をリセット"),
        code: 'import React from "react";\nfunction Profile({ userId }: { userId: string }) {\n  return <input defaultValue={userId} />;\n}\nfunction Page({ userId }: { userId: string }) {\n  return <Profile ___={userId} userId={userId} />;\n}',
        options: ["key", "id"], answer: 0,
        explain: L(
          "A different key makes React treat it as a new component: it unmounts the old one and mounts a fresh one with clean state. No effect needed.",
          "Una key distinta hace que React lo trate como otro componente: desmonta el viejo y monta uno nuevo con estado limpio. Sin efectos.",
          "key が変わると React は別のコンポーネントとみなし、古いものを外して新しく作り直す。状態はまっさら。副作用は不要だ。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "lifting_state", difficulty: 1, kind: "predict", prompt: L("Both panels show one count. Where's the state?", "Dos paneles muestran un conteo. ¿Dónde va el estado?", "2つのパネルが同じ数を表示。状態はどこ？"),
        code: "function Panel({ count }: { count: number }) {\n  return <p>{count}</p>;\n}\nfunction Dashboard() {\n  const [count, setCount] = useState(0);\n  return <><Panel count={count} /><Panel count={count} /></>;\n}",
        options: [L("In their closest common parent", "En su ancestro común más cercano", "いちばん近い共通の親"), L("A copy in each Panel", "Una copia en cada Panel", "各 Panel にコピー"), L("In a global variable", "En una variable global", "グローバル変数")], answer: 0,
        explain: L(
          "Lift state up to the closest common parent and pass it down as props: one source of truth, so the panels can never disagree.",
          "Sube el estado al ancestro común más cercano y pásalo como props: una sola fuente de verdad, así los paneles nunca difieren.",
          "状態を最も近い共通の親に持ち上げ、props で渡そう。信頼できる情報源がひとつなので、パネルの表示が食い違わない。",
        ),
        check: { compiles: true, program: P("function Panel({ count }: { count: number }) {\n  return <p>{count}</p>;\n}\nfunction Dashboard() {\n  const [count, setCount] = useState(0);\n  return <><Panel count={count} /><Panel count={count} /></>;\n}") },
      },
      // effects
      {
        topic: "effects", difficulty: 2, kind: "predict", prompt: L("Why does it reconnect after every render?", "¿Por qué se reconecta en cada render?", "なぜ毎回のレンダー後に再接続する？"),
        code: "function Chat({ roomId }: { roomId: string }) {\n  const options = { roomId };\n  useEffect(() => connect(options), [options]);\n  return <p>{roomId}</p>;\n}",
        options: [L("options is a new object each render", "options es un objeto nuevo en cada render", "options が毎回新しいオブジェクト"), L("roomId changes every render", "roomId cambia en cada render", "roomId が毎回変わる"), L("Effects ignore dependencies", "Los efectos ignoran las dependencias", "副作用は依存配列を無視する")], answer: 0,
        explain: L(
          "Dependencies are compared with Object.is. An object made during render is new each time, so the effect re-runs. Create it inside the effect; depend on roomId.",
          "Las dependencias se comparan con Object.is. Un objeto creado en el render es nuevo cada vez: el efecto se repite. Créalo dentro y depende de roomId.",
          "依存配列は Object.is で比べる。レンダー中に作ったオブジェクトは毎回別物なので再実行される。副作用の中で作り roomId に依存しよう。",
        ),
        check: { compiles: true, program: P("function Chat({ roomId }: { roomId: string }) {\n  const options = { roomId };\n  useEffect(() => connect(options), [options]);\n  return <p>{roomId}</p>;\n}") },
      },
      {
        topic: "effects", difficulty: 2, kind: "predict", prompt: L("What happens after mount?", "¿Qué pasa después de montar?", "マウント後に何が起きる？"),
        code: "function Counter() {\n  const [count, setCount] = useState(0);\n  useEffect(() => {\n    setCount(count + 1);\n  });\n  return <p>{count}</p>;\n}",
        options: [L("An infinite re-render loop", "Un bucle infinito de renders", "再レンダーの無限ループ"), L("It shows 1 and stops", "Muestra 1 y se detiene", "1 を表示して止まる"), L("It doesn't compile", "No compila", "コンパイルエラー")], answer: 0,
        explain: L(
          "With no dependency array the effect runs after every render. It sets state, which renders again, which runs the effect again. Forever.",
          "Sin arreglo de dependencias el efecto corre tras cada render. Cambia el estado, eso re-renderiza y vuelve a correr el efecto. Para siempre.",
          "依存配列がないと副作用は毎回のレンダー後に動く。状態を変える→再レンダー→また副作用、が永遠に続く。",
        ),
        check: { compiles: true, program: P("function Counter() {\n  const [count, setCount] = useState(0);\n  useEffect(() => {\n    setCount(count + 1);\n  });\n  return <p>{count}</p>;\n}") },
      },
      {
        topic: "effects", difficulty: 2, kind: "order", prompt: L("Order: an interval with cleanup", "Ordena: un intervalo con limpieza", "並べよう：クリーンアップ付きタイマー"),
        lines: ["useEffect(() => {", "  const id = setInterval(tick, 1000);", "  return () => clearInterval(id);", "}, []);"],
        explain: L(
          "Start the interval inside the effect and return a cleanup that clears it. React runs the cleanup on unmount, so timers never pile up.",
          "Inicia el intervalo dentro del efecto y devuelve una limpieza que lo borre. React la ejecuta al desmontar: los timers no se acumulan.",
          "副作用の中でタイマーを始め、止めるクリーンアップを返す。アンマウント時に実行されるのでタイマーが積み重ならない。",
        ),
        check: { compiles: true, program: P("function Clock() {\nuseEffect(() => {\n  const id = setInterval(tick, 1000);\n  return () => clearInterval(id);\n}, []);\nreturn <p>clock</p>;\n}") },
      },
      // refs
      {
        topic: "refs", difficulty: 3, kind: "predict", prompt: L("After 5 seconds the counter shows…", "Tras 5 segundos el contador muestra…", "5秒後のカウンター表示は？"),
        code: "function Timer() {\n  const [count, setCount] = useState(0);\n  useEffect(() => {\n    const id = setInterval(() => setCount(count + 1), 1000);\n    return () => clearInterval(id);\n  }, []);\n  return <p>{count}</p>;\n}",
        options: ["1", "5", "0"], answer: 0,
        explain: L(
          "The interval's closure comes from the first render, where count is 0, so it keeps setting 0 + 1: a stale closure. Fix: setCount(c => c + 1).",
          "El closure del intervalo viene del primer render, donde count es 0, así que siempre pone 0 + 1: closure obsoleto. Solución: setCount(c => c + 1).",
          "タイマーのクロージャは count が 0 の最初のレンダーのもの。ずっと 0 + 1 をセットする古いクロージャだ。setCount(c => c + 1) で直す。",
        ),
        check: { compiles: true, program: P("function Timer() {\n  const [count, setCount] = useState(0);\n  useEffect(() => {\n    const id = setInterval(() => setCount(count + 1), 1000);\n    return () => clearInterval(id);\n  }, []);\n  return <p>{count}</p>;\n}") },
      },
      {
        topic: "refs", difficulty: 1, kind: "pick", prompt: L("Keep the timer id without re-rendering", "Guarda el id del timer sin re-renderizar", "再レンダーせずタイマー id を保持"),
        code: 'import React, { useRef, useState, useMemo } from "react";\nfunction Stopwatch() {\n  const timer = ___<number | null>(null);\n  const start = () => { timer.current = window.setInterval(() => {}, 1000); };\n  return <button onClick={start}>Go</button>;\n}',
        options: ["useRef", "useState", "useMemo"], answer: 0,
        explain: L(
          "A ref is a box whose .current survives renders, and changing it doesn't trigger a render: perfect for timer ids. State would re-render on every change.",
          "Un ref es una caja cuyo .current sobrevive a los renders y cambiarlo no re-renderiza: ideal para ids de timers. El estado re-renderizaría.",
          "ref は .current がレンダーをまたいで残る箱で、変えても再レンダーしない。タイマー id に最適。状態だと毎回再レンダーする。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      // data_fetching
      {
        topic: "data_fetching", difficulty: 2, kind: "order", prompt: L("Order the race-condition fix", "Ordena la solución a la carrera", "競合状態の対策を並べよう"),
        lines: ["useEffect(() => {", "  let ignore = false;", "  fetchUser(id).then((u) => { if (!ignore) setUser(u); });", "  return () => { ignore = true; };", "}, [id]);"],
        explain: L(
          "Each effect run owns an ignore flag. When id changes, the cleanup flips the old flag, so a late, stale response is ignored.",
          "Cada ejecución del efecto tiene su bandera ignore. Si id cambia, la limpieza activa la vieja y la respuesta tardía se ignora.",
          "副作用の実行ごとに ignore フラグを持つ。id が変わるとクリーンアップが古いフラグを立て、遅れた古い応答は無視される。",
        ),
        check: { compiles: true, program: P('function Profile({ id }: { id: number }) {\nconst [user, setUser] = useState("");\nuseEffect(() => {\n  let ignore = false;\n  fetchUser(id).then((u) => { if (!ignore) setUser(u); });\n  return () => { ignore = true; };\n}, [id]);\nreturn <p>{user}</p>;\n}') },
      },
      {
        topic: "data_fetching", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: 'function User({ id }: { id: number }) {\n  const [name, setName] = useState("");\n  useEffect(async () => {\n    setName(await fetchUser(id));\n  }, [id]);\n  return <p>{name}</p>;\n}',
        options: [YES, L("No: an effect can't return a Promise", "No: un efecto no puede devolver una Promise", "いいえ：副作用は Promise を返せない")], answer: 1,
        explain: L(
          "An effect must return nothing or a cleanup function, but an async function returns a Promise. Define an async function inside the effect and call it.",
          "Un efecto debe devolver nada o una función de limpieza, pero una función async devuelve una Promise. Define una async dentro y llámala.",
          "副作用は何も返さないかクリーンアップ関数を返す。async 関数は Promise を返すのでダメ。中で async 関数を定義して呼ぼう。",
        ),
        check: { compiles: false, program: P('function User({ id }: { id: number }) {\n  const [name, setName] = useState("");\n  useEffect(async () => {\n    setName(await fetchUser(id));\n  }, [id]);\n  return <p>{name}</p>;\n}') },
      },
      // context_reducer
      {
        topic: "context_reducer", difficulty: 1, kind: "predict", prompt: L("No provider above. What does it print?", "Sin provider arriba. ¿Qué imprime?", "上に Provider なし。何が出力される？"),
        code: 'const Theme = createContext("light");\nfunction T() {\n  return <p>{useContext(Theme)}</p>;\n}\nconsole.log(renderToStaticMarkup(<T />));',
        options: ["<p>light</p>", "<p></p>", "<p>undefined</p>"], answer: 0,
        explain: L(
          "useContext returns the value of the nearest provider above. With none, it falls back to the default passed to createContext.",
          "useContext devuelve el valor del provider más cercano arriba. Si no hay ninguno, usa el valor por defecto de createContext.",
          "useContext は上にある最も近い Provider の値を返す。なければ createContext に渡した既定値になる。",
        ),
        check: { compiles: true, stdout: "<p>light</p>", program: P('const Theme = createContext("light");\nfunction T() {\n  return <p>{useContext(Theme)}</p>;\n}\nconsole.log(renderToStaticMarkup(<T />));') },
      },
      {
        topic: "context_reducer", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'type A = { type: "add"; n: number } | { type: "noop" };\nfunction reducer(s: number, a: A): number {\n  switch (a.type) {\n    case "add": return s + a.n;\n    default: return s;\n  }\n}\nconst acts: A[] = [{ type: "add", n: 2 }, { type: "noop" }, { type: "add", n: 3 }];\nconsole.log(acts.reduce(reducer, 0));',
        options: ["5", "2", "undefined"], answer: 0,
        explain: L(
          "A reducer is a pure (state, action) => newState. Unknown actions hit default and return the state unchanged, so 0 + 2 + 3 = 5.",
          "Un reducer es una función pura (state, action) => newState. Las acciones desconocidas caen en default y devuelven el estado igual: 0 + 2 + 3 = 5.",
          "リデューサーは純粋な (state, action) => newState。未知のアクションは default で状態をそのまま返すので 0 + 2 + 3 = 5。",
        ),
        check: { compiles: true, stdout: "5" },
      },
      {
        topic: "context_reducer", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: 'type Action = { type: "add"; n: number } | { type: "reset" };\nfunction reducer(s: number, a: Action): number {\n  return a.type === "add" ? s + a.n : 0;\n}\nfunction Score() {\n  const [score, dispatch] = useReducer(reducer, 0);\n  return <button onClick={() => dispatch({ type: "add" })}>{score}</button>;\n}',
        options: [YES, L("No: the add action needs n", "No: la acción add necesita n", "いいえ：add には n が必要")], answer: 1,
        explain: L(
          "Actions form a discriminated union: { type: \"add\" } must also carry n. TypeScript catches the missing field before it turns into NaN.",
          "Las acciones forman una unión discriminada: { type: \"add\" } también debe llevar n. TypeScript detecta el campo faltante antes de un NaN.",
          "アクションは判別可能なユニオン型。{ type: \"add\" } には n も必要で、TypeScript が NaN になる前に検出してくれる。",
        ),
        check: { compiles: false, program: P('type Action = { type: "add"; n: number } | { type: "reset" };\nfunction reducer(s: number, a: Action): number {\n  return a.type === "add" ? s + a.n : 0;\n}\nfunction Score() {\n  const [score, dispatch] = useReducer(reducer, 0);\n  return <button onClick={() => dispatch({ type: "add" })}>{score}</button>;\n}') },
      },
      // hooks_rules
      {
        topic: "hooks_rules", difficulty: 2, kind: "predict", prompt: L("Is this hook call valid?", "¿Es válida esta llamada al hook?", "このフック呼び出しは正しい？"),
        code: "function Profile({ user }: { user?: string }) {\n  if (!user) return null;\n  const [likes, setLikes] = useState(0);\n  return <p>{user}: {likes}</p>;\n}",
        options: [L("Yes: it's at the top level", "Sí: está en el nivel superior", "はい：トップレベルにある"), L("No: it runs after an early return", "No: corre tras un return temprano", "いいえ：早期 return の後にある")], answer: 1,
        explain: L(
          "Hooks must run in the same order every render. After an early return, useState is sometimes skipped. TypeScript allows it; the hooks lint rule flags it.",
          "Los hooks deben correr en el mismo orden en cada render. Tras un return temprano, useState a veces se salta. TypeScript lo permite; el linter no.",
          "フックは毎回同じ順で呼ぶ必要がある。早期 return の後だと useState が飛ばされることがある。型は通るがフック用 lint が検出する。",
        ),
        check: { compiles: true, program: P("function Profile({ user }: { user?: string }) {\n  if (!user) return null;\n  const [likes, setLikes] = useState(0);\n  return <p>{user}: {likes}</p>;\n}") },
      },
      {
        topic: "hooks_rules", difficulty: 2, kind: "predict", prompt: L("Clicking A's button changes…", "Al pulsar el botón de A cambia…", "A のボタンを押すと変わるのは？"),
        code: "function useCounter() {\n  const [n, setN] = useState(0);\n  return { n, inc: () => setN((x) => x + 1) };\n}\nfunction A() {\n  const c = useCounter();\n  return <button onClick={c.inc}>{c.n}</button>;\n}\nfunction B() {\n  const c = useCounter();\n  return <p>{c.n}</p>;\n}",
        options: [L("Only A's count", "Solo el conteo de A", "A の数だけ"), L("Both A's and B's count", "El de A y el de B", "A と B の両方")], answer: 0,
        explain: L(
          "Custom hooks share logic, not state. Each call to useCounter gets its own useState, so A and B count separately.",
          "Los hooks propios comparten lógica, no estado. Cada llamada a useCounter tiene su propio useState: A y B cuentan por separado.",
          "カスタムフックが共有するのはロジックで、状態ではない。useCounter の呼び出しごとに useState があり、A と B は別々に数える。",
        ),
        check: { compiles: true, program: P("function useCounter() {\n  const [n, setN] = useState(0);\n  return { n, inc: () => setN((x) => x + 1) };\n}\nfunction A() {\n  const c = useCounter();\n  return <button onClick={c.inc}>{c.n}</button>;\n}\nfunction B() {\n  const c = useCounter();\n  return <p>{c.n}</p>;\n}") },
      },
      {
        topic: "hooks_rules", difficulty: 1, kind: "type", prompt: L("Name it so React treats it as a hook", "Nómbralo para que React lo vea como hook", "フックと認識される名前にする"),
        code: "function ___Toggle(initial: boolean) {\n  const [on, setOn] = useState(initial);\n  return [on, () => setOn((o) => !o)] as const;\n}", answer: "use",
        explain: L(
          "A custom hook's name starts with use. That tells React and its lint rules to check the rules of hooks inside it and where it's called.",
          "El nombre de un hook propio empieza con use. Así React y su linter revisan las reglas de los hooks dentro y donde se llama.",
          "カスタムフックの名前は use で始める。そうすると React と lint が、中身と呼び出し側でフックのルールをチェックできる。",
        ),
        check: { compiles: true, program: P("function ___Toggle(initial: boolean) {\n  const [on, setOn] = useState(initial);\n  return [on, () => setOn((o) => !o)] as const;\n}", "use") },
      },
      // memoization
      {
        topic: "memoization", difficulty: 2, kind: "predict", prompt: L("List re-renders. Does Row re-render too?", "List se re-renderiza. ¿Row también?", "List が再レンダー。Row も？"),
        code: "const Row = memo(function Row({ onClick }: { onClick: () => void }) {\n  return <button onClick={onClick}>row</button>;\n});\nfunction List({ id }: { id: number }) {\n  return <Row onClick={() => select(id)} />;\n}",
        options: [L("Yes: the arrow is a new function", "Sí: la flecha es una función nueva", "はい：アロー関数が毎回新しい"), L("No: memo blocks it", "No: memo lo bloquea", "いいえ：memo が防ぐ")], answer: 0,
        explain: L(
          "memo compares props with Object.is. An inline arrow is a new function on each render, so the props differ. Wrap it in useCallback.",
          "memo compara las props con Object.is. Una flecha inline es una función nueva en cada render, así que las props difieren. Usa useCallback.",
          "memo は props を Object.is で比べる。インラインのアロー関数は毎回新しいので props が変わったと判断される。useCallback で包もう。",
        ),
        check: { compiles: true, program: P("const Row = memo(function Row({ onClick }: { onClick: () => void }) {\n  return <button onClick={onClick}>row</button>;\n});\nfunction List({ id }: { id: number }) {\n  return <Row onClick={() => select(id)} />;\n}") },
      },
      {
        topic: "memoization", difficulty: 2, kind: "pick", prompt: L("Keep onPick the same function", "Mantén onPick como la misma función", "onPick を同じ関数に保つ"),
        code: 'import React, { memo, useCallback, useMemo, useRef } from "react";\ndeclare function select(id: number): void;\nconst Row = memo(({ onPick }: { onPick: () => void }) => <i onClick={onPick} />);\nfunction List({ id }: { id: number }) {\n  const onPick = ___(() => select(id), [id]);\n  return <Row onPick={onPick} />;\n}',
        options: ["useCallback", "useMemo", "useRef"], answer: 0,
        explain: L(
          "useCallback returns the same function until id changes, so memo sees equal props. useMemo would cache the result of select(id), not the function.",
          "useCallback devuelve la misma función hasta que cambie id, así memo ve props iguales. useMemo guardaría el resultado de select(id), no la función.",
          "useCallback は id が変わるまで同じ関数を返すので memo が等しいと判断する。useMemo だと関数でなく select(id) の結果を保存してしまう。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      // testing
      {
        topic: "testing", difficulty: 2, kind: "predict", prompt: L("Why prefer getByRole in tests?", "¿Por qué preferir getByRole en tests?", "テストで getByRole が好まれる理由は？"),
        code: 'render(<SaveButton />);\nconst btn = screen.getByRole("button", { name: "Save" });',
        options: [L("It finds elements like users and screen readers do", "Busca como lo hacen usuarios y lectores de pantalla", "利用者や読み上げと同じ方法で探す"), L("It's the fastest DOM query", "Es la consulta al DOM más rápida", "最速の DOM 検索だから"), L("It works without rendering", "Funciona sin renderizar", "描画しなくても動くから")], answer: 0,
        explain: L(
          "Testing Library favors queries that match how people use the page. A role plus accessible name also checks accessibility, and CSS classes can change freely.",
          "Testing Library prefiere consultas parecidas a cómo se usa la página. Rol y nombre accesible también prueban accesibilidad, y las clases CSS pueden cambiar.",
          "Testing Library は人の使い方に近い検索を推奨する。ロールとアクセシブルな名前で探せばアクセシビリティも確かめられ、CSS も自由に変えられる。",
        ),
        check: {
          compiles: true,
          program: P('render(<SaveButton />);\nconst btn = screen.getByRole("button", { name: "Save" });', undefined,
            'declare function render(ui: ReactNode): void;\ndeclare const screen: { getByRole(role: string, o?: { name: string }): HTMLElement };\nfunction SaveButton() { return <button>Save</button>; }\n'),
        },
      },
      // rendering
      {
        topic: "rendering", difficulty: 2, kind: "predict", prompt: L("In development, StrictMode…", "En desarrollo, StrictMode…", "開発中の StrictMode は…"),
        code: 'function App() {\n  console.log("render");\n  return <p>app</p>;\n}\nconst tree = <StrictMode><App /></StrictMode>;',
        options: [L("Runs renders twice to expose impure code", "Renderiza dos veces para revelar código impuro", "2回描画して不純なコードを暴く"), L("Makes production builds slower", "Hace más lento el build de producción", "本番ビルドを遅くする"), L("Hides console logs", "Oculta los console.log", "console.log を隠す")], answer: 0,
        explain: L(
          "In development only, StrictMode double-invokes renders and effects (mount, unmount, mount) to reveal impure code and missing cleanups. Production is unaffected.",
          "Solo en desarrollo, StrictMode invoca dos veces renders y efectos (montar, desmontar, montar) para revelar impurezas y limpiezas faltantes.",
          "開発時だけ StrictMode は描画と副作用を2回実行し（マウント→解除→マウント）、不純な描画やクリーンアップ漏れを見つける。本番は影響なし。",
        ),
        check: { compiles: true, program: P('function App() {\n  console.log("render");\n  return <p>app</p>;\n}\nconst tree = <StrictMode><App /></StrictMode>;') },
      },
      {
        topic: "rendering", difficulty: 3, kind: "predict", prompt: L("Counter shows 3, then fancy flips. Is 3 kept?", "Counter muestra 3 y cambia fancy. ¿Sigue el 3?", "3 を表示中に fancy が反転。3 は残る？"),
        code: "function Counter({ color }: { color: string }) {\n  const [n, setN] = useState(0);\n  return <b onClick={() => setN(n + 1)}>{color} {n}</b>;\n}\nfunction Page({ fancy }: { fancy: boolean }) {\n  return fancy ? <Counter color=\"gold\" /> : <Counter color=\"gray\" />;\n}",
        options: [L("Yes: same type, same position", "Sí: mismo tipo, misma posición", "はい：同じ型・同じ位置"), L("No: it's a different branch", "No: es otra rama del ternario", "いいえ：別の分岐だから")], answer: 0,
        explain: L(
          "React keeps state by position in the tree. Both branches render a Counter in the same spot, so state survives. Give each a different key to reset it.",
          "React guarda el estado por posición en el árbol. Ambas ramas pintan un Counter en el mismo lugar: el estado se conserva. Usa keys distintas para reiniciar.",
          "React は木の中の位置で状態を保つ。どちらの分岐も同じ場所に Counter を描くので状態は残る。リセットしたいなら別の key を付けよう。",
        ),
        check: { compiles: true, program: P("function Counter({ color }: { color: string }) {\n  const [n, setN] = useState(0);\n  return <b onClick={() => setN(n + 1)}>{color} {n}</b>;\n}\nfunction Page({ fancy }: { fancy: boolean }) {\n  return fancy ? <Counter color=\"gold\" /> : <Counter color=\"gray\" />;\n}") },
      },
    ],
  },

  // ─── SENIOR ───────────────────────────────────────────────────────────────
  {
    slug: "senior",
    level: "senior",
    title: L("Senior React Developer", "React Developer Senior", "シニア React 開発者"),
    description: L(
      "Senior loop: rendering model, memoization trade-offs, effects discipline, Suspense, server components, performance.",
      "Proceso senior: modelo de render, memoización, disciplina con efectos, Suspense, server components, rendimiento.",
      "シニア面接：レンダーの仕組み、メモ化の判断、副作用、Suspense、サーバーコンポーネント、性能、セキュリティ。",
    ),
    count: 15,
    passPct: 75,
    secondsPerQuestion: 50,
    codeCount: 2,
    questions: [
      ...seniorTraceDebug,
      ...seniorTasks,
      // rendering
      {
        topic: "rendering", difficulty: 2, kind: "predict", prompt: L("Which one does NOT re-render Player?", "¿Cuál NO re-renderiza a Player?", "Player を再レンダーしないのは？"),
        code: 'const Theme = createContext("dark");\nfunction Player() {\n  const [hp, setHp] = useState(10);\n  const hits = useRef(0);\n  const theme = useContext(Theme);\n  return <p onClick={() => { hits.current++; }}>{hp}</p>;\n}',
        options: [L("hits.current changes", "Cambia hits.current", "hits.current の変更"), L("setHp gets a new value", "setHp recibe un valor nuevo", "setHp に新しい値"), L("Its parent re-renders", "Su padre se re-renderiza", "親の再レンダー"), L("The Theme value changes", "Cambia el valor de Theme", "Theme の値の変更")], answer: 0,
        explain: L(
          "A component re-renders when its state changes, its parent renders, or a context it reads changes. Mutating ref.current is invisible to React.",
          "Un componente se re-renderiza si cambia su estado, si su padre renderiza o si cambia un contexto que lee. Mutar ref.current es invisible para React.",
          "再レンダーの原因は、自分の状態の変更・親の再レンダー・読んでいるコンテキストの変更。ref.current の変更は React に見えない。",
        ),
        check: { compiles: true, program: P('const Theme = createContext("dark");\nfunction Player() {\n  const [hp, setHp] = useState(10);\n  const hits = useRef(0);\n  const theme = useContext(Theme);\n  return <p onClick={() => { hits.current++; }}>{hp}</p>;\n}') },
      },
      {
        topic: "rendering", difficulty: 3, kind: "predict", prompt: L("When does React keep a row's state?", "¿Cuándo conserva React el estado de una fila?", "React が行の状態を保つ条件は？"),
        code: "<ul>\n  {items.map((it) => <Row key={it.id} item={it} />)}\n</ul>",
        options: [L("Same type, position and key", "Mismo tipo, posición y key", "同じ型・位置・key"), L("Same props as last render", "Mismas props que antes", "前回と同じ props"), L("Same variable name", "Mismo nombre de variable", "同じ変数名")], answer: 0,
        explain: L(
          "Reconciliation matches the old tree by element type and position, using key among siblings. Change any of them and React remounts with fresh state.",
          "La reconciliación compara el árbol por tipo y posición, usando la key entre hermanos. Si cambia algo, React vuelve a montar con estado nuevo.",
          "差分検出は要素の型と位置、兄弟間では key で前の木と対応づける。どれかが変わると作り直され、状態は初期化される。",
        ),
        check: {
          compiles: true,
          program: P("const tree = <ul>\n  {items.map((it) => <Row key={it.id} item={it} />)}\n</ul>;", undefined,
            "type Item = { id: number };\nconst items: Item[] = [];\nfunction Row({ item }: { item: Item }) { return <li>{item.id}</li>; }\n"),
        },
      },
      {
        topic: "rendering", difficulty: 3, kind: "predict", prompt: L("React 18+: renders after the timeout?", "React 18+: ¿renders tras el timeout?", "React 18以降：タイマー後の描画回数は？"),
        code: "function Pair() {\n  const [a, setA] = useState(0);\n  const [b, setB] = useState(0);\n  function handleClick() {\n    setTimeout(() => {\n      setA(1);\n      setB(2);\n    }, 0);\n  }\n  return <button onClick={handleClick}>{a + b}</button>;\n}",
        options: ["1", "2"], answer: 0,
        explain: L(
          "Since React 18, automatic batching groups updates in timeouts, promises and native handlers too, not only React events: one render. flushSync opts out.",
          "Desde React 18, el batching automático agrupa también en timeouts, promesas y handlers nativos, no solo en eventos de React: un render. flushSync lo evita.",
          "React 18 からは自動バッチ処理がタイマーや Promise、ネイティブイベントにも効く。描画は1回。flushSync で回避できる。",
        ),
        check: { compiles: true, program: P("function Pair() {\n  const [a, setA] = useState(0);\n  const [b, setB] = useState(0);\n  function handleClick() {\n    setTimeout(() => {\n      setA(1);\n      setB(2);\n    }, 0);\n  }\n  return <button onClick={handleClick}>{a + b}</button>;\n}") },
      },
      {
        topic: "rendering", difficulty: 2, kind: "predict", prompt: L("What does hydrateRoot do?", "¿Qué hace hydrateRoot?", "hydrateRoot は何をする？"),
        code: 'hydrateRoot(document.getElementById("root")!, <App />);',
        options: [L("Attaches React to server-rendered HTML", "Conecta React al HTML del servidor", "サーバーの HTML に React をつなぐ"), L("Renders HTML on the server", "Genera HTML en el servidor", "サーバーで HTML を作る"), L("Reloads the page data", "Recarga los datos de la página", "ページのデータを再読み込み")], answer: 0,
        explain: L(
          "Hydration reuses the HTML the server sent and attaches state and event handlers in the browser. The first client render must match it, or React warns.",
          "La hidratación reutiliza el HTML del servidor y le conecta estado y eventos en el navegador. El primer render del cliente debe coincidir o React avisa.",
          "ハイドレーションはサーバーが送った HTML を再利用し、ブラウザで状態とイベントをつなぐ。最初の描画が一致しないと警告が出る。",
        ),
        check: {
          compiles: true,
          program: P('hydrateRoot(document.getElementById("root")!, <App />);', undefined,
            "declare function hydrateRoot(el: Element, ui: ReactNode): void;\nfunction App() { return <p>app</p>; }\n"),
        },
      },
      // memoization
      {
        topic: "memoization", difficulty: 2, kind: "predict", prompt: L("Is this useMemo worth it?", "¿Vale la pena este useMemo?", "この useMemo に価値はある？"),
        code: "function Cart({ items }: { items: number[] }) {\n  const total = useMemo(() => items.length * 2, [items]);\n  return <p>{total}</p>;\n}",
        options: [L("No: trivial work; measure first", "No: es trivial; mide primero", "いいえ：軽い処理。まず計測"), L("Yes: always memoize derived values", "Sí: memoiza siempre lo derivado", "はい：派生値は常にメモ化")], answer: 0,
        explain: L(
          "Memoization costs memory and comparisons. For cheap math it's noise: profile first, then memoize slow work or values that must keep the same reference.",
          "Memoizar cuesta memoria y comparaciones. Para cálculos baratos es ruido: mide primero y memoiza solo lo lento o lo que necesita la misma referencia.",
          "メモ化にはメモリと比較のコストがかかる。軽い計算には無駄。まず計測し、重い処理や参照を保つ必要がある値だけメモ化しよう。",
        ),
        check: { compiles: true, program: P("function Cart({ items }: { items: number[] }) {\n  const total = useMemo(() => items.length * 2, [items]);\n  return <p>{total}</p>;\n}") },
      },
      {
        topic: "memoization", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: "function same(a: Record<string, unknown>, b: Record<string, unknown>) {\n  const ka = Object.keys(a);\n  return ka.length === Object.keys(b).length && ka.every((k) => Object.is(a[k], b[k]));\n}\nconst f = () => {};\nconsole.log(same({ id: 1, on: f }, { id: 1, on: () => {} }), same({ id: 1, on: f }, { id: 1, on: f }));",
        options: ["false true", "true true", "false false"], answer: 0,
        explain: L(
          "memo compares props shallowly with Object.is: two equal-looking functions are different objects. Only the very same reference passes.",
          "memo compara las props superficialmente con Object.is: dos funciones que se ven iguales son objetos distintos. Solo pasa la misma referencia.",
          "memo は props を Object.is で浅く比べる。見た目が同じ関数でも別のオブジェクト。まったく同じ参照だけが等しいとみなされる。",
        ),
        check: { compiles: true, stdout: "false true" },
      },
      {
        topic: "memoization", difficulty: 2, kind: "predict", prompt: L("With the React Compiler on, this code…", "Con el React Compiler activo, este código…", "React Compiler 有効だとこのコードは…"),
        code: "function Total({ items }: { items: number[] }) {\n  const sum = items.reduce((a, b) => a + b, 0);\n  return <p>{sum}</p>;\n}",
        options: [L("Is memoized automatically at build time", "Se memoiza solo al compilar", "ビルド時に自動でメモ化される"), L("Needs useMemo by hand", "Necesita useMemo a mano", "手で useMemo が必要"), L("Runs without a virtual DOM", "Corre sin DOM virtual", "仮想 DOM なしで動く")], answer: 0,
        explain: L(
          "The React Compiler analyzes components at build time and inserts memoization for you, so manual useMemo/useCallback is rarely needed. Follow React's rules.",
          "El React Compiler analiza los componentes al compilar y agrega memoización por ti; rara vez hace falta useMemo/useCallback. El código debe seguir las reglas.",
          "React Compiler はビルド時にコンポーネントを解析し自動でメモ化する。手書きの useMemo/useCallback はほぼ不要。ただしルールに従うこと。",
        ),
        check: { compiles: true, program: P("function Total({ items }: { items: number[] }) {\n  const sum = items.reduce((a, b) => a + b, 0);\n  return <p>{sum}</p>;\n}") },
      },
      // effects
      {
        topic: "effects", difficulty: 2, kind: "predict", prompt: SERVER_PRINTS,
        code: 'type Todo = { text: string; done: boolean };\nfunction Visible({ todos }: { todos: Todo[] }) {\n  const [shown, setShown] = useState<Todo[]>([]);\n  useEffect(() => { setShown(todos.filter((t) => !t.done)); }, [todos]);\n  return <ul>{shown.map((t) => <li key={t.text}>{t.text}</li>)}</ul>;\n}\nconsole.log(renderToStaticMarkup(<Visible todos={[{ text: "Train", done: false }]} />));',
        options: ["<ul></ul>", "<ul><li>Train</li></ul>"], answer: 0,
        explain: L(
          "Effects don't run on the server, so the list starts empty; on the client it renders twice. Derive data during render instead: todos.filter(...).",
          "Los efectos no corren en el servidor: la lista empieza vacía y en el cliente se renderiza dos veces. Deriva los datos en el render: todos.filter(...).",
          "副作用はサーバーで動かないのでリストは空。クライアントでも2回描画になる。レンダー中に todos.filter(...) で導出しよう。",
        ),
        check: { compiles: true, stdout: "<ul></ul>", program: P('type Todo = { text: string; done: boolean };\nfunction Visible({ todos }: { todos: Todo[] }) {\n  const [shown, setShown] = useState<Todo[]>([]);\n  useEffect(() => { setShown(todos.filter((t) => !t.done)); }, [todos]);\n  return <ul>{shown.map((t) => <li key={t.text}>{t.text}</li>)}</ul>;\n}\nconsole.log(renderToStaticMarkup(<Visible todos={[{ text: "Train", done: false }]} />));') },
      },
      {
        topic: "effects", difficulty: 2, kind: "pick", prompt: L("Measure layout before the browser paints", "Mide el layout antes de que pinte el navegador", "ブラウザの描画前にレイアウトを測る"),
        code: "function Tooltip() {\n  const ref = useRef<HTMLDivElement>(null);\n  ___(() => {\n    measure();\n  }, []);\n  return <div ref={ref}>tip</div>;\n}",
        options: ["useLayoutEffect", "useEffect"], answer: 0,
        explain: L(
          "useLayoutEffect runs after DOM changes but before paint, so measuring and repositioning causes no flicker. It blocks painting: use it sparingly.",
          "useLayoutEffect corre tras cambiar el DOM pero antes de pintar: medir y reubicar no parpadea. Bloquea el pintado, así que úsalo con moderación.",
          "useLayoutEffect は DOM 更新後・画面描画前に動くので、測って位置を直してもちらつかない。描画を止めるので使いすぎ注意。",
        ),
        check: { compiles: true, program: P("function Tooltip() {\n  const ref = useRef<HTMLDivElement>(null);\n  ___(() => {\n    measure();\n  }, []);\n  return <div ref={ref}>tip</div>;\n}", "useLayoutEffect") },
      },
      {
        topic: "effects", difficulty: 3, kind: "pick", prompt: L("Subscribe to a store outside React", "Suscríbete a un store fuera de React", "React 外のストアを購読する"),
        code: 'import React, { useEffect, useState, useSyncExternalStore } from "react";\ndeclare function subscribe(cb: () => void): () => void;\nconst getSnapshot = () => navigator.onLine;\nfunction Status() {\n  const online = ___(subscribe, getSnapshot);\n  return <p>{online ? "on" : "off"}</p>;\n}',
        options: ["useSyncExternalStore", "useEffect", "useState"], answer: 0,
        explain: L(
          "useSyncExternalStore subscribes and reads a snapshot consistently, even during concurrent rendering. Copying it into state with an effect can tear or lag.",
          "useSyncExternalStore se suscribe y lee un snapshot consistente, incluso con render concurrente. Copiarlo al estado con un efecto puede desfasarse.",
          "useSyncExternalStore は購読とスナップショット読み取りを一貫して行う。並行レンダーでも安全。副作用で状態にコピーすると表示がずれうる。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      // data_fetching
      {
        topic: "data_fetching", difficulty: 2, kind: "pick", prompt: L("Cancel the request when url changes", "Cancela la petición si cambia url", "url が変わったらリクエストを中止"),
        code: 'import React, { useEffect, useState } from "react";\nfunction Data({ url }: { url: string }) {\n  const [data, setData] = useState<unknown>(null);\n  useEffect(() => {\n    const controller = new AbortController();\n    fetch(url, { signal: controller.signal }).then((r) => r.json()).then(setData);\n    return () => controller.___();\n  }, [url]);\n  return <p>{String(data)}</p>;\n}',
        options: ["abort", "cancel", "stop"], answer: 0,
        explain: L(
          "The cleanup aborts the old request: fetch rejects with an AbortError and the stale response never lands. Unlike an ignore flag, it stops the network work.",
          "La limpieza aborta la petición vieja: fetch falla con AbortError y la respuesta obsoleta nunca llega. A diferencia de ignore, detiene el trabajo de red.",
          "クリーンアップで古いリクエストを中止すると fetch は AbortError で失敗し、古い応答は反映されない。ignore と違い通信自体を止める。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "data_fetching", difficulty: 3, kind: "predict", prompt: L("The old request is slower. What prints?", "La petición vieja es más lenta. ¿Qué imprime?", "古いリクエストが遅い。何が出力される？"),
        code: 'const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));\nlet shown = "";\nfunction load(id: number, ms: number) {\n  wait(ms).then(() => { shown = "user " + id; });\n  return () => {}; // cleanup does nothing\n}\nload(1, 30)(); // id changed: clean up user 1\nload(2, 10);\nsetTimeout(() => console.log(shown), 50);',
        options: ["user 1", "user 2"], answer: 0,
        explain: L(
          "Nothing stops the stale response: user 1 lands last and overwrites user 2. A cleanup that sets an ignore flag (or aborts) fixes the race.",
          "Nada detiene la respuesta obsoleta: user 1 llega al final y pisa a user 2. Una limpieza que active ignore (o aborte) arregla la carrera.",
          "古い応答を止めるものがないので、最後に届いた user 1 が user 2 を上書きする。ignore フラグや中止をするクリーンアップで直る。",
        ),
        check: { compiles: true, stdout: "user 1" },
      },
      // suspense_boundaries
      {
        topic: "suspense_boundaries", difficulty: 2, kind: "predict", prompt: L("Buy's click throws. Does Boundary show Oops?", "El clic en Buy lanza un error. ¿Boundary muestra Oops?", "Buy で例外。Boundary は Oops を出す？"),
        code: 'class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {\n  state = { failed: false };\n  static getDerivedStateFromError() { return { failed: true }; }\n  render() { return this.state.failed ? <p>Oops</p> : this.props.children; }\n}\nfunction Buy() {\n  return <button onClick={() => { throw new Error("pay"); }}>Buy</button>;\n}\nconst app = <Boundary><Buy /></Boundary>;',
        options: [L("No: handler errors aren't caught", "No: no atrapa errores de handlers", "いいえ：ハンドラの例外は対象外"), L("Yes: it catches every error below", "Sí: atrapa todo error debajo", "はい：配下の例外はすべて捕まえる")], answer: 0,
        explain: L(
          "Error boundaries catch errors thrown while rendering children (and in lifecycles), not in event handlers or async code. Use try/catch there and set state.",
          "Los error boundaries atrapan errores al renderizar hijos (y en ciclos de vida), no en handlers ni código async. Ahí usa try/catch y estado.",
          "エラー境界が捕まえるのは子の描画中（とライフサイクル）の例外だけ。イベントハンドラや非同期処理は try/catch で状態を更新しよう。",
        ),
        check: { compiles: true, program: P('class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {\n  state = { failed: false };\n  static getDerivedStateFromError() { return { failed: true }; }\n  render() { return this.state.failed ? <p>Oops</p> : this.props.children; }\n}\nfunction Buy() {\n  return <button onClick={() => { throw new Error("pay"); }}>Buy</button>;\n}\nconst app = <Boundary><Buy /></Boundary>;') },
      },
      {
        topic: "suspense_boundaries", difficulty: 3, kind: "predict", prompt: L("Lazy still loading, no Suspense. Result?", "Lazy aún cargando, sin Suspense. ¿Resultado?", "読込中の lazy、Suspense なし。結果は？"),
        code: "const Lazy = lazy(() => new Promise<{ default: React.ComponentType }>(() => {}));\nconsole.log(renderToStaticMarkup(<Lazy />));",
        options: [L("It throws an error", "Lanza un error", "エラーが投げられる"), "<p>Loading…</p>", L("It prints an empty line", "Imprime una línea vacía", "空行が出力される")], answer: 0,
        explain: L(
          "A suspending component needs a <Suspense fallback> above it. With no boundary, a synchronous render throws; wrap it and the fallback is shown instead.",
          "Un componente que suspende necesita un <Suspense fallback> arriba. Sin él, un render síncrono lanza error; envuélvelo y se muestra el fallback.",
          "サスペンドする部品の上には <Suspense fallback> が必要。境界がないと同期描画はエラーになる。包めば fallback が表示される。",
        ),
        check: { compiles: true, throws: "suspended", program: P("const Lazy = lazy(() => new Promise<{ default: React.ComponentType }>(() => {}));\nconsole.log(renderToStaticMarkup(<Lazy />));") },
      },
      {
        topic: "suspense_boundaries", difficulty: 2, kind: "type", prompt: L("Mark the list update as non-urgent", "Marca la actualización como no urgente", "リスト更新を急がない更新にする"),
        code: 'function Search() {\n  const [isPending, startTransition] = ___();\n  return <p>{isPending ? "…" : "ok"}</p>;\n}', answer: "useTransition",
        explain: L(
          "useTransition gives isPending and startTransition. Updates inside a transition can be interrupted, so typing stays responsive while a big list re-renders.",
          "useTransition da isPending y startTransition. Las actualizaciones en una transición se pueden interrumpir: escribir sigue fluido mientras la lista se renderiza.",
          "useTransition は isPending と startTransition を返す。トランジション内の更新は中断できるので、大きなリストの描画中も入力が軽い。",
        ),
        check: { compiles: true, program: P('function Search() {\n  const [isPending, startTransition] = ___();\n  return <p>{isPending ? "…" : "ok"}</p>;\n}', "useTransition") },
      },
      // server_components
      {
        topic: "server_components", difficulty: 2, kind: "predict", prompt: L("A server Page needs a like counter. You…", "Una Page de servidor necesita un contador. Tú…", "サーバーの Page にいいね数が必要。"),
        code: "async function Page() {\n  const posts = await getPosts();\n  return <LikeButton initial={posts.length} />;\n}",
        options: [L("Put it in a \"use client\" component", "Lo pones en un componente \"use client\"", "\"use client\" の部品に置く"), L("Call useState inside Page", "Llamas useState dentro de Page", "Page で useState を呼ぶ"), L("Make Page a class", "Haces Page una clase", "Page をクラスにする")], answer: 0,
        explain: L(
          "Server components can be async and fetch data, but can't use state or effects. Move the interactive part into a \"use client\" component and render it.",
          "Los server components pueden ser async y pedir datos, pero no usar estado ni efectos. Mueve la parte interactiva a un componente \"use client\".",
          "サーバーコンポーネントは async でデータ取得できるが、状態や副作用は使えない。操作する部分は \"use client\" の部品に移そう。",
        ),
        check: {
          compiles: true,
          program: P("async function Page() {\n  const posts = await getPosts();\n  return <LikeButton initial={posts.length} />;\n}", undefined,
            "declare function getPosts(): Promise<string[]>;\nfunction LikeButton({ initial }: { initial: number }) { return <button>{initial}</button>; }\n"),
        },
      },
      {
        topic: "server_components", difficulty: 3, kind: "predict", prompt: L("Server → client props must be…", "Las props de servidor a cliente deben ser…", "サーバー→クライアントの props は？"),
        code: '"use client";\nexport function Like({ initial, onLike }: { initial: number; onLike: () => void }) {\n  return <button onClick={onLike}>{initial}</button>;\n}',
        options: [L("Serializable: no plain functions", "Serializables: sin funciones comunes", "シリアライズ可能（普通の関数は不可）"), L("Any JavaScript value", "Cualquier valor de JavaScript", "どんな JS の値でもよい"), L("Only strings", "Solo strings", "文字列だけ")], answer: 0,
        explain: L(
          "Props cross the network as serialized data. Plain values, arrays, objects, JSX and promises work; regular functions don't (only server actions).",
          "Las props viajan por la red serializadas. Valores simples, arreglos, objetos, JSX y promesas sirven; funciones comunes no (solo server actions).",
          "props はシリアライズされて通信で渡る。値・配列・オブジェクト・JSX・Promise は可。普通の関数は不可（サーバーアクションのみ可）。",
        ),
        check: { compiles: true, program: P('"use client";\nexport function Like({ initial, onLike }: { initial: number; onLike: () => void }) {\n  return <button onClick={onLike}>{initial}</button>;\n}') },
      },
      {
        topic: "server_components", difficulty: 1, kind: "type", prompt: L("Make this file a client component", "Convierte el archivo en componente cliente", "このファイルをクライアント部品に"),
        code: '"use ___";\nexport function Likes() {\n  const [n, setN] = useState(0);\n  return <button onClick={() => setN(n + 1)}>{n}</button>;\n}', answer: "client",
        explain: L(
          "The \"use client\" directive at the top of a file marks the boundary: this module and its imports run in the browser, where state and effects work.",
          "La directiva \"use client\" al inicio del archivo marca el límite: este módulo y sus imports corren en el navegador, donde hay estado y efectos.",
          "ファイル先頭の \"use client\" が境界の印。このモジュールと import 先はブラウザで動き、状態や副作用が使える。",
        ),
        check: { compiles: true, program: P('"use ___";\nexport function Likes() {\n  const [n, setN] = useState(0);\n  return <button onClick={() => setN(n + 1)}>{n}</button>;\n}', "client") },
      },
      // context_reducer
      {
        topic: "context_reducer", difficulty: 3, kind: "predict", prompt: L("App re-renders often. What's the cost?", "App se re-renderiza seguido. ¿El costo?", "App が頻繁に再レンダー。何が起きる？"),
        code: 'function App() {\n  const [user, setUser] = useState("Ada");\n  return (\n    <UserCtx value={{ user, setUser }}>\n      <Page />\n    </UserCtx>\n  );\n}',
        options: [L("Every consumer re-renders each time", "Todos los consumidores se re-renderizan", "利用側が毎回すべて再レンダー"), L("Nothing: context is free", "Nada: el contexto es gratis", "何も起きない"), L("setUser gets lost", "setUser se pierde", "setUser が失われる")], answer: 0,
        explain: L(
          "A new { user, setUser } object every render makes every consumer re-render. Memoize the value with useMemo, or split state and setter into two contexts.",
          "Un objeto { user, setUser } nuevo en cada render re-renderiza a todos los consumidores. Memoiza el valor con useMemo o separa en dos contextos.",
          "毎回新しい { user, setUser } を渡すと利用側がすべて再レンダーする。useMemo で値をメモ化するか、コンテキストを2つに分けよう。",
        ),
        check: {
          compiles: true,
          program: P('function App() {\n  const [user, setUser] = useState("Ada");\n  return (\n    <UserCtx value={{ user, setUser }}>\n      <Page />\n    </UserCtx>\n  );\n}', undefined,
            "const UserCtx = createContext<{ user: string; setUser: (u: string) => void } | null>(null);\nfunction Page() { return <p>page</p>; }\n"),
        },
      },
      {
        topic: "context_reducer", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'const Theme = createContext("light");\nfunction T() {\n  return <p>{useContext(Theme)}</p>;\n}\nconsole.log(renderToStaticMarkup(\n  <Theme value="dark">\n    <Theme value="neon"><T /></Theme>\n  </Theme>\n));',
        options: ["<p>neon</p>", "<p>dark</p>", "<p>light</p>"], answer: 0,
        explain: L(
          "useContext reads the NEAREST provider above. In React 19 the context itself works as a provider; <Theme.Provider> still works too.",
          "useContext lee el provider MÁS CERCANO arriba. En React 19 el propio contexto funciona como provider; <Theme.Provider> también sigue sirviendo.",
          "useContext は上にある「いちばん近い」Provider を読む。React 19 ではコンテキスト自体が Provider になる。<Theme.Provider> も使える。",
        ),
        check: { compiles: true, stdout: "<p>neon</p>", program: P('const Theme = createContext("light");\nfunction T() {\n  return <p>{useContext(Theme)}</p>;\n}\nconsole.log(renderToStaticMarkup(\n  <Theme value="dark">\n    <Theme value="neon"><T /></Theme>\n  </Theme>\n));') },
      },
      // hooks_rules
      {
        topic: "hooks_rules", difficulty: 3, kind: "predict", prompt: L("Why must hooks keep the same order?", "¿Por qué los hooks deben tener el mismo orden?", "フックの呼び出し順を保つ理由は？"),
        code: 'function Form({ more }: { more: boolean }) {\n  const [name, setName] = useState("");\n  if (more) useEffect(() => {});\n  const [age, setAge] = useState(0);\n  return <p>{name}{age}</p>;\n}',
        options: [L("React matches state to hooks by order", "React asocia el estado por orden de llamada", "React は呼び出し順で状態を対応づける"), L("It only makes rendering faster", "Solo hace el render más rápido", "描画を速くするためだけ"), L("TypeScript requires it", "Lo exige TypeScript", "TypeScript が要求するから")], answer: 0,
        explain: L(
          "React stores hook state in a list indexed by call order. A conditional hook shifts every later hook onto the wrong slot, mixing up state.",
          "React guarda el estado de los hooks en una lista según el orden de llamada. Un hook condicional corre a los siguientes de lugar y mezcla el estado.",
          "React はフックの状態を呼び出し順のリストで管理する。条件付きのフックがあると後ろがずれて、状態が取り違えられる。",
        ),
        check: { compiles: true, program: P('function Form({ more }: { more: boolean }) {\n  const [name, setName] = useState("");\n  if (more) useEffect(() => {});\n  const [age, setAge] = useState(0);\n  return <p>{name}{age}</p>;\n}') },
      },
      {
        topic: "hooks_rules", difficulty: 2, kind: "pick", prompt: L("Finish the debounce hook's cleanup", "Completa la limpieza del hook debounce", "デバウンスフックの片付けを完成"),
        code: 'import React, { useEffect, useState } from "react";\nfunction useDebounced<T>(value: T, ms: number): T {\n  const [v, setV] = useState(value);\n  useEffect(() => {\n    const t = setTimeout(() => setV(value), ms);\n    return () => ___(t);\n  }, [value, ms]);\n  return v;\n}',
        options: ["clearTimeout", "removeTimeout", "cancel"], answer: 0,
        explain: L(
          "Each new value clears the previous timer, so only the last value, after ms of quiet, reaches state. Without the cleanup every keystroke would land.",
          "Cada valor nuevo borra el timer anterior, así solo el último valor, tras ms de calma, llega al estado. Sin limpieza llegaría cada tecla.",
          "新しい値が来るたび前のタイマーを消すので、ms 間静かになった最後の値だけが状態に入る。片付けがないと全入力が反映される。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      // performance
      {
        topic: "performance", difficulty: 2, kind: "predict", prompt: L("10,000 rows scroll slowly. Best fix?", "10 000 filas van lentas. ¿Mejor arreglo?", "1万行のスクロールが重い。最善策は？"),
        code: "// rows.length === 10000\nfunction Feed({ rows }: { rows: string[] }) {\n  return <ul>{rows.map((r) => <li key={r}>{r}</li>)}</ul>;\n}",
        options: [L("Virtualize: render visible rows only", "Virtualizar: solo filas visibles", "仮想化：見える行だけ描画"), L("Wrap every row in useMemo", "Envolver cada fila en useMemo", "全行を useMemo で包む"), L("Switch to index keys", "Usar el índice como key", "index を key にする")], answer: 0,
        explain: L(
          "Virtualization (windowing) mounts only the rows on screen, so the DOM stays small. Memoizing 10,000 rows still mounts 10,000 nodes.",
          "La virtualización (windowing) monta solo las filas en pantalla y el DOM queda pequeño. Memoizar 10 000 filas igual monta 10 000 nodos.",
          "仮想化（ウィンドウ化）は画面内の行だけをマウントし DOM を小さく保つ。1万行をメモ化しても1万個のノードは作られる。",
        ),
        check: { compiles: true, program: P("// rows.length === 10000\nfunction Feed({ rows }: { rows: string[] }) {\n  return <ul>{rows.map((r) => <li key={r}>{r}</li>)}</ul>;\n}") },
      },
      {
        topic: "performance", difficulty: 2, kind: "predict", prompt: L("Typing feels slow. What do you do first?", "Escribir se siente lento. ¿Qué haces primero?", "入力が重い。まず何をする？"),
        code: 'function onRender(id: string, phase: string, ms: number) {\n  console.log(id, phase, ms);\n}\nconst app = (\n  <Profiler id="list" onRender={onRender}>\n    <p>list</p>\n  </Profiler>\n);',
        options: [L("Measure with the Profiler", "Medir con el Profiler", "Profiler で計測する"), L("Add memo everywhere", "Poner memo en todo", "全部に memo を付ける"), L("Rewrite it with classes", "Reescribir con clases", "クラスで書き直す")], answer: 0,
        explain: L(
          "Measure before optimizing: the Profiler (or DevTools) shows which components render, how often and for how long. Then fix the real hotspot.",
          "Mide antes de optimizar: el Profiler (o DevTools) muestra qué componentes renderizan, cuántas veces y cuánto tardan. Luego ataca el punto real.",
          "最適化の前に計測しよう。Profiler（や DevTools）で、どの部品が何回・何ミリ秒描画したかがわかる。本当の原因を直そう。",
        ),
        check: { compiles: true, program: P('function onRender(id: string, phase: string, ms: number) {\n  console.log(id, phase, ms);\n}\nconst app = (\n  <Profiler id="list" onRender={onRender}>\n    <p>list</p>\n  </Profiler>\n);') },
      },
      // accessibility
      {
        topic: "accessibility", difficulty: 2, kind: "predict", prompt: L("A clickable div acts as a button. Best fix?", "Un div clicable hace de botón. ¿Mejor arreglo?", "ボタン代わりの div。最善の直し方は？"),
        code: 'function Close({ onClose }: { onClose: () => void }) {\n  return <div className="btn" onClick={onClose}>Close</div>;\n}',
        options: [L("Use a real <button>", "Usar un <button> real", "本物の <button> を使う"), L("Add cursor: pointer", "Agregar cursor: pointer", "cursor: pointer を足す"), L("Add a title attribute", "Agregar un atributo title", "title 属性を足す")], answer: 0,
        explain: L(
          "A <button> is focusable, fires on Enter and Space and has the button role for screen readers. A div needs role, tabIndex and key handlers to match.",
          "Un <button> recibe foco, responde a Enter y Espacio y tiene el rol de botón para lectores de pantalla. Un div necesita role, tabIndex y teclas.",
          "<button> はフォーカスでき、Enter や Space で押せ、読み上げにもボタンと伝わる。div だと role・tabIndex・キー操作が必要。",
        ),
        check: { compiles: true, program: P('function Close({ onClose }: { onClose: () => void }) {\n  return <div className="btn" onClick={onClose}>Close</div>;\n}') },
      },
      // security
      {
        topic: "security", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: 'const comment = "<b>hi</b>";\nconsole.log(renderToStaticMarkup(<p>{comment}</p>));',
        options: ["<p>&lt;b&gt;hi&lt;/b&gt;</p>", "<p><b>hi</b></p>"], answer: 0,
        explain: L(
          "React escapes text in JSX, so injected tags show up as text, not HTML. Only dangerouslySetInnerHTML skips escaping: sanitize what you pass there.",
          "React escapa el texto en JSX: las etiquetas inyectadas se ven como texto, no como HTML. Solo dangerouslySetInnerHTML no escapa: sanitiza lo que pases.",
          "React は JSX の文字列をエスケープするので、混入したタグは HTML でなく文字になる。dangerouslySetInnerHTML だけは例外。必ず無害化を。",
        ),
        check: { compiles: true, stdout: "<p>&lt;b&gt;hi&lt;/b&gt;</p>", program: P('const comment = "<b>hi</b>";\nconsole.log(renderToStaticMarkup(<p>{comment}</p>));') },
      },
    ],
  },
];
