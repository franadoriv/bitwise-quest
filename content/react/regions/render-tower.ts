import type { Beat, LessonDef, NoteBlock, NoteDef, RegionDef, Text } from "../../../lib/content/types.ts";
import { L } from "../../../lib/i18n/text.ts";

// REGION 4 · RENDER TOWER  (context and useReducer, memo/useMemo/useCallback and when not to,
// custom hooks and the rules of hooks, Suspense/lazy, error boundaries, transitions, "use client")

const say = (text: Text): Beat => ({ kind: "dialog", speaker: "master", text });
const enemySays = (text: Text): Beat => ({ kind: "dialog", speaker: "enemy", text });

/** Imports every React snippet needs; the player sees the compact code, the validator runs this. */
const H =
  'import React, { createContext, useContext, useReducer, memo, useMemo, useCallback, useState, useEffect, useRef, Suspense, lazy, use, startTransition, Component } from "react";\n' +
  'import type { ReactNode } from "react";\n' +
  'import { renderToStaticMarkup } from "react-dom/server";\n';
const prog = (code: string, fill?: string) => H + (fill == null ? code : code.replace("___", fill));

// Guidebook notes: long explanations players can reopen from any question (📖).
// Examples use names and values different from the questions so they never give an answer away.
const note = (id: string, title: Text, ...blocks: NoteBlock[]): NoteDef => ({ id, title, blocks });
const p = (en: string, es: string, ja: string): NoteBlock => ({ t: "p", text: L(en, es, ja) });
/** Runnable example: the player sees `code`; the validator runs it with the imports in H. */
const ex = (code: string, output: string, caption?: Text): NoteBlock => ({ t: "code", code, output, caption, check: { program: H + code, compiles: true, stdout: output } });
/** Type-checked example with no output (effects and handlers never run in a static render). */
const tc = (code: string, caption?: Text): NoteBlock => ({ t: "code", code, caption, check: { program: H + code, compiles: true } });
/** An example that must NOT type-check. */
const bad = (code: string, caption: Text): NoteBlock => ({ t: "code", code, caption, check: { program: H + code, compiles: false } });

// Shared prose.
const WHAT_PRINTS = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const YES = L("Yes", "Sí", "はい");
const RULES_OK = L("Does it follow the rules of hooks?", "¿Cumple las reglas de los hooks?", "フックのルールを守ってる？");

// Reusable snippets.
const THEME = 'const Theme = createContext("light");\nfunction T() {\n  return <p>{useContext(Theme)}</p>;\n}\n';
const NEAREST = `${THEME}console.log(renderToStaticMarkup(\n  <Theme.Provider value="dark">\n    <Theme value="neon"><T /></Theme>\n  </Theme.Provider>\n));`;
const TYPED_ACTION =
  'type Action = { type: "add"; n: number } | { type: "reset" };\nfunction reducer(s: number, a: Action): number {\n  return a.type === "add" ? s + a.n : 0;\n}\nreducer(1, { type: "add" });';
const BOUNDARY =
  "class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {\n" +
  "  state = { failed: false };\n" +
  "  static getDerivedStateFromError() {\n    return { failed: true };\n  }\n" +
  "  render() {\n    return this.state.failed ? this.props.fallback : this.props.children;\n  }\n}\n";

// ─── 4.1 context and useReducer ─────────────────────────────────────────────
const contextNotes: NoteDef[] = [
  note("context-basics", L("Context: broadcast a value", "Contexto: anunciar un valor", "コンテキストで値を届ける"),
    p(
      "Passing a prop through many components that don't use it is called prop drilling. Context fixes it: createContext(defaultValue) makes a channel, an ancestor provides a value with <Ctx value={...}>, and any component below reads it with useContext(Ctx), no matter how deep it is.",
      "Pasar una prop por muchos componentes que no la usan se llama prop drilling. El contexto lo resuelve: createContext(valorPorDefecto) crea un canal, un ancestro da un valor con <Ctx value={...}> y cualquier componente de abajo lo lee con useContext(Ctx), sin importar la profundidad.",
      "使わない部品を通して props を何段も渡すことを「バケツリレー」と呼ぶ。コンテキストなら createContext(既定値) で通り道を作り、祖先が <Ctx value={...}> で値を渡し、下の部品はどれだけ深くても useContext(Ctx) で読める。",
    ),
    ex('const Lang = createContext("en");\nfunction Greeting() {\n  const lang = useContext(Lang);\n  return <p>{lang === "es" ? "Hola" : "Hello"}</p>;\n}\nconsole.log(renderToStaticMarkup(<Greeting />));\nconsole.log(renderToStaticMarkup(<Lang value="es"><Greeting /></Lang>));', "<p>Hello</p>\n<p>Hola</p>",
      L("Without a provider: the default. With one: its value", "Sin proveedor: el valor por defecto. Con uno: su valor", "プロバイダなしは既定値、ありならその値")),
    p(
      "useContext looks UP the tree from the component and stops at the first provider of that context it meets: the nearest one wins. If it reaches the top without finding any, it returns the default value given to createContext. Missing a provider is not an error.",
      "useContext busca HACIA ARRIBA desde el componente y se detiene en el primer proveedor de ese contexto que encuentra: gana el más cercano. Si llega a la cima sin encontrar ninguno, devuelve el valor por defecto de createContext. Que falte un proveedor no es un error.",
      "useContext は部品から上へたどり、最初に出会ったそのコンテキストのプロバイダで止まる。一番近いものが勝つ。最後まで見つからなければ createContext の既定値を返す。プロバイダがなくてもエラーにはならない。",
    ),
    ex('const Size = createContext("M");\nfunction Tag() {\n  return <i>{useContext(Size)}</i>;\n}\nconsole.log(renderToStaticMarkup(\n  <Size value="L"><Tag /><Size value="S"><Tag /></Size></Size>\n));', "<i>L</i><i>S</i>",
      L("Each Tag reads the provider closest to it", "Cada Tag lee el proveedor más cercano", "各 Tag は一番近いプロバイダを読む")),
    p(
      "In React 19 the context object itself is the provider: <Ctx value=\"x\">. Older code writes <Ctx.Provider value=\"x\">; both work the same way. Common mistake: expecting a crash when there's no provider. You silently get the default, so if a value looks stuck, check that the provider really wraps the component.",
      "En React 19 el propio objeto de contexto es el proveedor: <Ctx value=\"x\">. El código antiguo escribe <Ctx.Provider value=\"x\">; ambos funcionan igual. Error común: esperar un fallo cuando no hay proveedor. Recibes el valor por defecto sin aviso; si un valor parece atascado, revisa que el proveedor envuelva al componente.",
      "React 19 ではコンテキスト自体がプロバイダ：<Ctx value=\"x\">。古いコードの <Ctx.Provider value=\"x\"> も同じように動く。よくあるミス：プロバイダがないとエラーになると思うこと。黙って既定値になるので、値が変わらないときはプロバイダが部品を包んでいるか確かめよう。",
    ),
  ),
  note("reducers", L("Reducers: the rulebook", "Reducers: el reglamento", "リデューサーは掟の書"),
    p(
      "A reducer is a function (state, action) => nextState. The action is a small object that describes what happened, usually with a type field. With useReducer, calling dispatch(action) makes React run your reducer with the current state and that action, and the value it returns becomes the new state.",
      "Un reducer es una función (state, action) => siguienteEstado. La acción es un objeto pequeño que describe qué pasó, normalmente con un campo type. Con useReducer, llamar a dispatch(action) hace que React ejecute tu reducer con el estado actual y esa acción, y lo que devuelve es el nuevo estado.",
      "リデューサーは (state, action) => 次の状態 という関数。action は何が起きたかを表す小さなオブジェクトで、ふつう type を持つ。useReducer で dispatch(action) を呼ぶと、React が今の状態と action でリデューサーを実行し、返した値が新しい状態になる。",
    ),
    ex('type Act = { type: "deposit"; amount: number } | { type: "fee" };\nfunction bank(balance: number, act: Act): number {\n  switch (act.type) {\n    case "deposit": return balance + act.amount;\n    case "fee": return balance - 1;\n  }\n}\nconst log: Act[] = [{ type: "deposit", amount: 10 }, { type: "fee" }];\nconsole.log(log.reduce(bank, 0));', "9",
      L("A list of actions folded through the reducer, like dispatch", "Una lista de acciones pasada por el reducer, como dispatch", "dispatch と同じく action を順に通す")),
    p(
      "To predict the result, start from the initial state and apply each action in order, writing the new state after every step. Array.reduce(reducer, start) does exactly that, which is where the name comes from.",
      "Para predecir el resultado, parte del estado inicial y aplica cada acción en orden, anotando el nuevo estado tras cada paso. Array.reduce(reducer, inicio) hace justo eso, y de ahí viene el nombre.",
      "結果を予想するには、初期状態から action を順に当てはめ、毎回の新しい状態を書き出そう。Array.reduce(reducer, 初期値) がまさにそれをする。名前の由来もここ。",
    ),
    ex('function reducer(n: number, a: { type: "up" }) {\n  return n + 1;\n}\nfunction Stairs() {\n  const [floor, dispatch] = useReducer(reducer, 0);\n  return <button onClick={() => dispatch({ type: "up" })}>{floor}</button>;\n}\nconsole.log(renderToStaticMarkup(<Stairs />));', "<button>0</button>",
      L("useReducer gives the state and a dispatch function", "useReducer da el estado y una función dispatch", "useReducer は状態と dispatch をくれる")),
    p(
      "Reducers must be pure: same state and action in, same result out. No fetch, no timers, no random numbers, and never mutate the old state; return a new value instead. In development StrictMode calls reducers twice on purpose, so a hidden side effect shows up right away.",
      "Los reducers deben ser puros: mismo estado y acción, mismo resultado. Nada de fetch, temporizadores ni números al azar, y nunca mutes el estado viejo; devuelve un valor nuevo. En desarrollo StrictMode llama a los reducers dos veces a propósito, así un efecto oculto se nota enseguida.",
      "リデューサーは純粋に：同じ状態と action なら同じ結果。fetch もタイマーも乱数もなし。古い状態は書き換えず新しい値を返す。開発中の StrictMode はわざと2回呼ぶので、隠れた副作用がすぐに分かる。",
    ),
    p(
      "Common mistake: a switch with no default case. An action the reducer doesn't know falls through, the function returns undefined, and the next render or action crashes. Always end with a default branch that hands back the state unchanged.",
      "Error común: un switch sin caso default. Una acción que el reducer no conoce no entra en ningún caso, la función devuelve undefined y el siguiente render o acción falla. Termina siempre con una rama default que devuelva el estado sin cambios.",
      "よくあるミス：default のない switch。知らない action はどの case にも入らず undefined が返り、次のレンダーや action で落ちる。最後に必ず、状態をそのまま返す default を書こう。",
    ),
    ex('function lamp(on: boolean, action: { type: string }): boolean {\n  switch (action.type) {\n    case "toggle": return !on;\n    default: return on;\n  }\n}\nconsole.log(lamp(true, { type: "toggle" }), lamp(true, { type: "dance" }));', "false true",
      L("An unknown action leaves the lamp as it was", "Una acción desconocida deja la lámpara como estaba", "知らない action ではランプはそのまま")),
  ),
  note("typed-actions", L("Typed actions with unions", "Acciones tipadas con uniones", "ユニオン型のアクション"),
    p(
      "In TypeScript, actions are usually a union of object types: one member per kind of action, each with a literal type tag and the fields it needs. type Move = { type: \"walk\"; steps: number } | { type: \"stop\" } means a walk action must carry steps, and a stop action has nothing else.",
      "En TypeScript las acciones suelen ser una unión de tipos de objeto: un miembro por clase de acción, cada uno con una etiqueta type literal y los campos que necesita. type Move = { type: \"walk\"; steps: number } | { type: \"stop\" } significa que walk debe llevar steps y stop no lleva nada más.",
      "TypeScript ではアクションをオブジェクト型のユニオンで書くことが多い。種類ごとに type のリテラルと必要な項目を持つ。type Move = { type: \"walk\"; steps: number } | { type: \"stop\" } なら walk には steps が必須、stop は他に何もない。",
    ),
    bad('type Move = { type: "walk"; steps: number } | { type: "stop" };\nconst m: Move = { type: "walk" };',
      L("Does not type-check: a walk action needs steps", "No compila: walk necesita steps", "型エラー：walk には steps が必要")),
    p(
      "The checker reads the type tag, finds the matching member and demands every field of that member. A missing field is caught before the code ever runs, which is the whole point: a typo in a dispatch can't sneak into production.",
      "El verificador lee la etiqueta type, busca el miembro que coincide y exige todos sus campos. Un campo que falta se detecta antes de ejecutar el código, y esa es la gracia: un error en un dispatch no llega a producción.",
      "型チェッカーは type を読んで対応するメンバーを探し、その項目をすべて要求する。足りない項目は実行前に見つかる。だから dispatch の打ち間違いが本番に紛れ込まない。",
    ),
    ex('type Move = { type: "walk"; steps: number } | { type: "stop" };\nfunction describe(m: Move): string {\n  if (m.type === "walk") return "walk " + m.steps;\n  return "stop";\n}\nconsole.log(describe({ type: "walk", steps: 4 }), describe({ type: "stop" }));', "walk 4 stop",
      L("After checking type, TS knows steps exists", "Tras revisar type, TS sabe que steps existe", "type を確かめると steps があると分かる")),
    p(
      "Inside if (m.type === \"walk\") or case \"walk\":, TypeScript narrows m to the walk member, so m.steps is allowed there and nowhere else. Common mistake: typing actions as { type: string }. It compiles, but you lose all of these checks.",
      "Dentro de if (m.type === \"walk\") o case \"walk\":, TypeScript estrecha m al miembro walk, así que m.steps está permitido ahí y en ningún otro sitio. Error común: tipar las acciones como { type: string }. Compila, pero pierdes todas estas comprobaciones.",
      "if (m.type === \"walk\") や case \"walk\": の中では m が walk に絞られ、そこでだけ m.steps が使える。よくあるミス：action を { type: string } と書くこと。コンパイルは通るが、このチェックが全部なくなる。",
    ),
  ),
  note("context-value", L("Context values and re-renders", "Valores de contexto y re-renders", "コンテキストの値と再レンダー"),
    p(
      "When a provider re-renders, React compares its new value with the old one using Object.is. If they differ, every component that reads that context re-renders. Numbers and strings compare by value, but an object literal like {{ a, b }} is a brand-new object each time, so it always counts as changed.",
      "Cuando un proveedor se re-renderiza, React compara su nuevo value con el anterior usando Object.is. Si difieren, todo componente que lee ese contexto se re-renderiza. Números y strings se comparan por valor, pero un objeto literal como {{ a, b }} es nuevo cada vez, así que siempre cuenta como cambio.",
      "プロバイダが再レンダーすると、React は新しい value を古い値と Object.is で比べる。違えば、そのコンテキストを読む部品が全部再レンダーする。数や文字列は値で比べるが、{{ a, b }} のようなオブジェクトは毎回新品なので常に「変わった」ことになる。",
    ),
    ex('const make = (score: number) => ({ score });\nconsole.log(Object.is(make(1), make(1)));\nconst kept = make(1);\nconsole.log(Object.is(kept, kept));', "false\ntrue",
      L("Same contents, different objects; only the same object is equal", "Mismo contenido, objetos distintos; solo el mismo objeto es igual", "中身が同じでも別物。同じオブジェクトだけが等しい")),
    p(
      "Fixes: wrap the value in useMemo so it stays the same object until its parts change (and keep functions stable with useCallback), or split the context in two, for example one for the data and one for the setter, so components that only need the setter don't re-render when the data changes.",
      "Soluciones: envuelve el value en useMemo para que sea el mismo objeto hasta que cambien sus partes (y mantén las funciones estables con useCallback), o divide el contexto en dos, por ejemplo uno para los datos y otro para el setter, así quien solo usa el setter no se re-renderiza al cambiar los datos.",
      "対策：value を useMemo で包み、中身が変わるまで同じオブジェクトにする（関数は useCallback で安定させる）。またはデータ用とセッター用などに分割し、セッターだけ使う部品がデータの変化で再レンダーしないようにする。",
    ),
    tc('const Cart = createContext<{ items: string[]; add: (i: string) => void } | null>(null);\nfunction CartProvider({ children }: { children: ReactNode }) {\n  const [items, setItems] = useState<string[]>([]);\n  const add = useCallback((i: string) => setItems((xs) => [...xs, i]), []);\n  const value = useMemo(() => ({ items, add }), [items, add]);\n  return <Cart value={value}>{children}</Cart>;\n}',
      L("The value object only changes when items changes", "El objeto value solo cambia cuando cambia items", "items が変わるときだけ value が変わる")),
    p(
      "Common mistake: blaming context for being slow when the real cause is a fresh object in value. Ask yourself on every render: is this exactly the same object as last time? If not, every consumer pays for it.",
      "Error común: culpar al contexto de ser lento cuando la causa real es un objeto nuevo en value. Pregúntate en cada render: ¿es exactamente el mismo objeto que la vez anterior? Si no, cada consumidor lo paga.",
      "よくあるミス：遅いのをコンテキストのせいにすること。本当の原因は value の新しいオブジェクトかもしれない。毎回「前回とまったく同じオブジェクト？」と考えよう。違えば利用側全員がその代償を払う。",
    ),
  ),
];

const contextAndReducer: LessonDef = {
  slug: "context-and-reducer",
  title: L("The crier and the rulebook", "El pregonero y el reglamento", "伝令と掟の書"),
  concept: "context_reducer",
  mode: "lesson",
  xp: 75,
  enemy: "react/rerender-tornado",
  enemyName: L("PROP DRILL BUG", "BUG TALADRO", "バケツリレーバグ"),
  beats: [
    say(L(
      "Welcome to the Render Tower! Passing a prop through ten floors is tiring. Context lets an ancestor broadcast a value to every floor below.",
      "¡Bienvenido a la Torre del Render! Bajar una prop diez pisos cansa. El contexto deja que un ancestro anuncie un valor a los pisos de abajo.",
      "レンダーの塔へようこそ！props を10階分リレーするのは大変。コンテキストなら祖先が下の階全部に値を届けられるよ。",
    )),
    {
      kind: "act",
      prompt: L("Broadcast a theme from the tower", "Anuncia un tema desde la torre", "塔からテーマを放送しよう"),
      setup: [],
      steps: [
        { label: L("CREATE", "CREAR", "作る"), line: 'const Theme = createContext("light");', effects: [{ t: "tag", actor: "hero", text: "Theme", value: "light" }, { t: "item", kind: "scroll", holder: "hero" }] },
        { label: L("PROVIDE", "PROVEER", "提供する"), line: '<Theme value="dark">', effects: [{ t: "value", actor: "hero", text: "dark" }, { t: "banner", text: L("DARK!", "¡OSCURO!", "ダーク！") }] },
        { label: L("LISTEN", "ESCUCHAR", "聞く"), line: "  <Label />  {/* useContext(Theme) */}", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Label" }, { t: "say", actor: "ally", text: L("I hear: dark", "Oigo: dark", "dark と聞こえた") }] },
        { label: L("CLOSE", "CERRAR", "閉じる"), line: "</Theme>", effects: [{ t: "print", text: "<p>dark</p>" }], output: "<p>dark</p>" },
      ],
    },
    say(L(
      "useContext reads the NEAREST provider above. With no provider at all, you get the default passed to createContext.",
      "useContext lee el proveedor MÁS CERCANO de arriba. Si no hay ninguno, recibes el valor por defecto de createContext.",
      "useContext は上にある一番近いプロバイダを読む。どこにもなければ createContext の既定値になるよ。",
    )),
    {
      kind: "predict",
      hint: L("Is there any provider above T? If not, where does useContext get its value?", "¿Hay algún proveedor sobre T? Si no, ¿de dónde saca useContext su valor?", "T の上にプロバイダはある？なければ useContext の値はどこから来る？"),
      note: "context-basics",
      prompt: L("No provider above. What prints?", "No hay proveedor. ¿Qué imprime?", "プロバイダなし。何が表示される？"),
      code: `${THEME}console.log(renderToStaticMarkup(<T />));`,
      options: ["<p>light</p>", "<p></p>", L("Error: no provider", "Error: no hay proveedor", "エラー：プロバイダなし")],
      answer: 0,
      output: "<p>light</p>",
      explain: L(
        "With no provider above, useContext returns the default value given to createContext: light.",
        "Sin proveedor arriba, useContext devuelve el valor por defecto de createContext: light.",
        "上にプロバイダがないと、useContext は createContext の既定値 light を返すよ。",
      ),
      check: { compiles: true, program: prog(`${THEME}console.log(renderToStaticMarkup(<T />));`), stdout: "<p>light</p>" },
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "T" }],
      win: [{ t: "print", text: "<p>light</p>" }],
    },
    {
      kind: "predict",
      hint: L("Start at T and walk up the tree: which provider do you meet first?", "Empieza en T y sube por el árbol: ¿qué proveedor encuentras primero?", "T から上へたどろう。最初に出会うプロバイダはどれ？"),
      note: "context-basics",
      prompt: L("Two criers. What prints?", "Dos pregoneros. ¿Qué imprime?", "伝令が2人。何が表示される？"),
      code: NEAREST,
      options: ["<p>neon</p>", "<p>dark</p>", "<p>light</p>"],
      answer: 0,
      output: "<p>neon</p>",
      explain: L(
        "The nearest provider wins. <Theme value> is the React 19 form; <Theme.Provider> still works too.",
        "Gana el proveedor más cercano. <Theme value> es la forma de React 19; <Theme.Provider> también sigue funcionando.",
        "一番近いプロバイダが勝つ。<Theme value> は React 19 の書き方で、<Theme.Provider> も動くよ。",
      ),
      check: { compiles: true, program: prog(NEAREST), stdout: "<p>neon</p>" },
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "T" }],
      win: [{ t: "banner", text: L("NEON!", "¡NEÓN!", "ネオン！") }, { t: "print", text: "<p>neon</p>" }],
    },
    say(L(
      "Now the rulebook: a reducer. It takes (state, action) and RETURNS the next state. Pure: no fetch, no mutation.",
      "Ahora el reglamento: un reducer. Recibe (state, action) y DEVUELVE el siguiente estado. Puro: sin fetch ni mutaciones.",
      "次は掟の書、リデューサー。(state, action) を受け取り次の状態を返す。純粋に：fetch も変更もなし。",
    )),
    {
      kind: "predict",
      hint: L("Apply each action in order, starting from 0. What does the default case do with the state?", "Aplica cada acción en orden, empezando en 0. ¿Qué hace el caso default con el estado?", "0 から順に action を当てはめよう。default は状態をどうする？"),
      note: "reducers",
      prompt: WHAT_PRINTS,
      code:
        'type A = { type: "add"; n: number } | { type: "skip" };\nconst reducer = (s: number, a: A): number => {\n  switch (a.type) {\n    case "add": return s + a.n;\n    default: return s;\n  }\n};\nconst acts: A[] = [{ type: "add", n: 2 }, { type: "skip" }, { type: "add", n: 3 }];\nconsole.log(acts.reduce(reducer, 0));',
      options: ["5", "2", "undefined"],
      answer: 0,
      output: "5",
      explain: L(
        "Each action card goes through the rulebook: 0 + 2, skip keeps 2, then + 3 = 5. That's what dispatch does.",
        "Cada acción pasa por el reglamento: 0 + 2, skip deja 2, luego + 3 = 5. Eso hace dispatch.",
        "アクションが順に掟を通る：0+2、skip で 2 のまま、+3 で 5。dispatch も同じ仕組みだよ。",
      ),
      check: { compiles: true, stdout: "5" },
      setup: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "state", value: "0" }],
      win: [{ t: "value", actor: "hero", text: "5" }, { t: "print", text: "5" }],
    },
    {
      kind: "predict",
      hint: L("A reducer must be predictable: same state and action in, same result out.", "Un reducer debe ser predecible: mismo estado y acción, mismo resultado.", "リデューサーは予測できること：同じ入力なら同じ結果。"),
      note: "reducers",
      prompt: L("What may a reducer do?", "¿Qué puede hacer un reducer?", "リデューサーがしていいことは？"),
      code: 'function reducer(state: number, action: { type: "inc" }) {\n  return state + 1;\n}',
      options: [
        L("Return a new state from state + action", "Devolver un estado nuevo con state + action", "state と action から新しい状態を返す"),
        L("Call fetch and mutate state", "Llamar a fetch y mutar el estado", "fetch を呼んで state を書き換える"),
      ],
      answer: 0,
      explain: L(
        "Reducers must be pure: same input, same output. StrictMode even calls them twice in development to catch side effects.",
        "Los reducers deben ser puros: misma entrada, misma salida. StrictMode los llama dos veces en desarrollo para detectar efectos.",
        "リデューサーは純粋に。StrictMode は開発中に2回呼んで副作用を見つけるよ。",
      ),
      check: { compiles: true },
    },
    {
      kind: "predict",
      hint: L("Look at the union: which fields does the \"add\" member require? Does the call pass all of them?", "Mira la unión: ¿qué campos exige el miembro \"add\"? ¿La llamada los pasa todos?", "ユニオンを見よう。\"add\" に必要な項目は？呼び出しは全部渡している？"),
      note: "typed-actions",
      prompt: COMPILES,
      code: TYPED_ACTION,
      options: [YES, L("No: n is missing", "No: falta n", "いいえ：n がない")],
      answer: 1,
      explain: L(
        "Typed actions are a union: the \"add\" card requires n. TypeScript rejects { type: \"add\" } before it ever runs.",
        "Las acciones tipadas son una unión: la carta \"add\" exige n. TypeScript rechaza { type: \"add\" } antes de ejecutarse.",
        "アクションはユニオン型。\"add\" には n が必須なので、TypeScript が実行前に弾くよ。",
      ),
      check: { compiles: false },
      win: [{ t: "shake" }],
    },
    {
      kind: "type",
      hint: L("An unknown action should change nothing. Which value already holds \"how things were\"?", "Una acción desconocida no debe cambiar nada. ¿Qué valor ya guarda \"cómo estaba todo\"?", "知らない action では何も変えない。「元の状態」を持つ値はどれ？"),
      note: "reducers",
      prompt: L("Unknown action: keep the state", "Acción desconocida: conserva el estado", "未知のアクションは状態を維持"),
      code: 'function reducer(state: number, action: { type: string }): number {\n  switch (action.type) {\n    case "inc": return state + 1;\n    default: return ___;\n  }\n}\nconsole.log(reducer(4, { type: "?" }));',
      answer: "state",
      explain: L(
        "default: return state; keeps everything as it was. Forgetting it returns undefined and breaks the next render.",
        "default: return state; deja todo como estaba. Si lo olvidas, devuelve undefined y rompe el siguiente render.",
        "default: return state; で元のまま。忘れると undefined が返り、次のレンダーが壊れるよ。",
      ),
      check: { compiles: true, stdout: "4" },
      win: [{ t: "print", text: "4" }],
    },
    {
      kind: "predict",
      hint: L("Is {{ user, setUser }} the same object on the next render? React compares the value with Object.is.", "¿{{ user, setUser }} es el mismo objeto en el siguiente render? React compara value con Object.is.", "{{ user, setUser }} は次のレンダーでも同じ？React は Object.is で比べる。"),
      note: "context-value",
      prompt: L("This App re-renders often. Consumers…", "Esta App se re-renderiza seguido. Los consumidores…", "App は頻繁に再レンダー。利用側は…"),
      code: 'const [user, setUser] = useState("Ada");\nreturn <Ctx value={{ user, setUser }}>{children}</Ctx>;',
      options: [
        L("All re-render: a new object each time", "Todos se re-renderizan: objeto nuevo cada vez", "全部再レンダー：毎回新オブジェクト"),
        L("Nothing happens", "No pasa nada", "何も起きない"),
      ],
      answer: 0,
      explain: L(
        "{{ user, setUser }} is a new object on every render, so every consumer re-renders. Memoize the value or split the context.",
        "{{ user, setUser }} es un objeto nuevo en cada render, así que todo consumidor se re-renderiza. Memoiza el valor o divide el contexto.",
        "{{ user, setUser }} は毎回新しいので利用側が全部再レンダー。値をメモ化するか分割しよう。",
      ),
      check: {
        compiles: true,
        program: prog(
          'const Ctx = createContext<{ user: string; setUser: (u: string) => void } | null>(null);\nfunction App({ children }: { children: ReactNode }) {\n  const [user, setUser] = useState("Ada");\n  return <Ctx value={{ user, setUser }}>{children}</Ctx>;\n}',
        ),
      },
      setup: [{ t: "enter", actor: "ally" }, { t: "enter", actor: "enemy" }],
      win: [{ t: "banner", text: L("RENDER x2", "RENDER x2", "レンダー x2") }, { t: "shake" }],
    },
    {
      kind: "run",
      hint: L("Trace the noop action: which case handles it, and what does the function return then?", "Sigue la acción noop: ¿qué caso la maneja y qué devuelve entonces la función?", "noop を追おう。どの case が受け取り、関数は何を返す？"),
      note: "reducers",
      prompt: L("The noop action crashes the reducer. Fix it", "La acción noop rompe el reducer. Arréglalo", "noop でリデューサーが落ちる。直そう"),
      starter:
        'type State = { items: string[] };\ntype Action = { type: string; item: string };\nfunction reducer(state: State, action: Action): State {\n  switch (action.type) {\n    case "add": return { items: [...state.items, action.item] };\n    case "remove": return { items: state.items.filter((i) => i !== action.item) };\n  }\n}\nconst acts: Action[] = [{ type: "add", item: "gem" }, { type: "noop", item: "" }, { type: "add", item: "key" }];\nconsole.log(acts.reduce(reducer, { items: [] }).items.join(","));',
      solution:
        'type State = { items: string[] };\ntype Action = { type: string; item: string };\nfunction reducer(state: State, action: Action): State {\n  switch (action.type) {\n    case "add": return { items: [...state.items, action.item] };\n    case "remove": return { items: state.items.filter((i) => i !== action.item) };\n    default: return state;\n  }\n}\nconst acts: Action[] = [{ type: "add", item: "gem" }, { type: "noop", item: "" }, { type: "add", item: "key" }];\nconsole.log(acts.reduce(reducer, { items: [] }).items.join(","));',
      expect: "gem,key",
      fallback: ["default\\s*:\\s*return\\s+state"],
      explain: L(
        "Without default, noop returns undefined and the next action reads undefined.items. default: return state keeps the state.",
        "Sin default, noop devuelve undefined y la siguiente acción lee undefined.items. default: return state conserva el estado.",
        "default がないと noop で undefined が返り、次で落ちる。default: return state で守ろう。",
      ),
    },
  ],
  notes: contextNotes,
};

// ─── 4.2 memo, useMemo, useCallback ─────────────────────────────────────────
const memoNotes: NoteDef[] = [
  note("memo-identity", L("memo and sameness", "memo y lo mismo", "memo と「同じ」"),
    p(
      "When a component re-renders, React re-renders all its children too, even if their props didn't change. memo(Child) adds a shield: before rendering the child, React compares each new prop with the old one, and if every prop is the same, it skips the child and reuses the last result.",
      "Cuando un componente se re-renderiza, React re-renderiza también a todos sus hijos, aunque sus props no cambien. memo(Child) añade un escudo: antes de renderizar al hijo, React compara cada prop nueva con la vieja y, si todas son iguales, salta al hijo y reutiliza el último resultado.",
      "部品が再レンダーすると、props が変わっていなくても子も全部再レンダーする。memo(Child) は盾になる。子を描く前に各 props を前回と比べ、全部同じなら子をスキップして前の結果を使い回す。",
    ),
    p(
      "\"Same\" means Object.is, roughly ===. Numbers, strings and booleans compare by value: 1 is 1. Objects, arrays and functions compare by identity: is it the very same object in memory? Two literals with equal contents are two different objects.",
      "\"Igual\" significa Object.is, casi como ===. Números, strings y booleanos se comparan por valor: 1 es 1. Objetos, arreglos y funciones se comparan por identidad: ¿es exactamente el mismo objeto en memoria? Dos literales con el mismo contenido son dos objetos distintos.",
      "「同じ」とは Object.is（ほぼ ===）のこと。数・文字列・真偽値は値で比べる：1 は 1。オブジェクト・配列・関数は「メモリ上でまったく同じものか」で比べる。中身が同じでも、2つのリテラルは別々のオブジェクトだ。",
    ),
    ex('const makeTag = () => ["red"];\nconsole.log(Object.is(makeTag(), makeTag()));\nconst hi = () => "hi";\nconsole.log(Object.is(hi, hi), Object.is(() => "hi", () => "hi"));', "false\ntrue false",
      L("Each call or arrow creates a new array or function", "Cada llamada o flecha crea un arreglo o función nuevo", "呼ぶたび・書くたびに新しい配列や関数ができる")),
    p(
      "The trap: every render runs the parent's code again, so an inline {} or [] or () => ... written in JSX is created fresh each time. The prop is never the same, and memo can never skip. memo compares shallowly: one level of props, with Object.is, never deep inside objects.",
      "La trampa: cada render ejecuta otra vez el código del padre, así que un {} o [] o () => ... escrito en el JSX se crea de nuevo cada vez. La prop nunca es la misma y memo nunca puede saltar. memo compara de forma superficial: un nivel de props, con Object.is, nunca dentro de los objetos.",
      "落とし穴：レンダーのたびに親のコードが再実行されるので、JSX に直接書いた {} や [] や () => ... は毎回新品。props が同じにならず、memo はスキップできない。memo の比較は浅く、props 1段を Object.is で比べるだけ。",
    ),
    tc('const Badge = memo(function Badge({ label }: { label: string }) {\n  return <span>{label}</span>;\n});\nfunction Bar({ label }: { label: string }) {\n  return <Badge label={label} />;\n}',
      L("A string prop compares by value, so memo can skip Badge", "Una prop string se compara por valor: memo puede saltar Badge", "文字列は値で比べるので memo がスキップできる")),
  ),
  note("callback-memo", L("useCallback vs useMemo", "useCallback vs useMemo", "useCallback と useMemo"),
    p(
      "Both hooks remember something between renders until a dependency changes. useMemo(fn, deps) CALLS fn and caches its result: a number, an array, an object. useCallback(fn, deps) caches fn ITSELF without calling it, so you get the same function back each render.",
      "Ambos hooks recuerdan algo entre renders hasta que cambia una dependencia. useMemo(fn, deps) LLAMA a fn y guarda su resultado: un número, un arreglo, un objeto. useCallback(fn, deps) guarda fn MISMA sin llamarla, así recibes la misma función en cada render.",
      "どちらも依存配列が変わるまでレンダー間で何かを覚えておく。useMemo(fn, deps) は fn を呼んで結果（数・配列・オブジェクト）を保存する。useCallback(fn, deps) は fn を呼ばずに関数そのものを保存し、毎回同じ関数を返す。",
    ),
    ex('function Stats({ scores }: { scores: number[] }) {\n  const best = useMemo(() => Math.max(...scores), [scores]);\n  return <p>{best}</p>;\n}\nconsole.log(renderToStaticMarkup(<Stats scores={[4, 9, 2]} />));', "<p>9</p>",
      L("useMemo runs during render, so the first render has the value", "useMemo corre al renderizar: el primer render ya tiene el valor", "useMemo はレンダー中に動くので最初から値がある")),
    p(
      "Unlike an effect, useMemo runs during render. On the very first render it computes the value right away, so even a static server render shows it. Later renders reuse the cached value as long as every dependency is the same (Object.is).",
      "A diferencia de un efecto, useMemo corre durante el render. En el primer render calcula el valor de inmediato, así que hasta un render estático de servidor lo muestra. Los renders siguientes reutilizan el valor guardado mientras cada dependencia sea la misma (Object.is).",
      "副作用と違い、useMemo はレンダー中に動く。最初のレンダーですぐ計算するので、サーバーの静的レンダーでも値が出る。後のレンダーでは依存がすべて同じ（Object.is）なら保存した値を使い回す。",
    ),
    tc('const Item = memo(function Item({ onRemove }: { onRemove: () => void }) {\n  return <button onClick={onRemove}>x</button>;\n});\nfunction List({ remove }: { remove: (n: number) => void }) {\n  const onRemove = useCallback(() => remove(3), [remove]);\n  return <Item onRemove={onRemove} />;\n}',
      L("A stable function lets memo(Item) skip", "Una función estable permite que memo(Item) salte", "安定した関数なら memo(Item) がスキップできる")),
    p(
      "Use useCallback when you pass a function to a memo child or to another hook's dependency list. Put in deps every value from the component that the function reads; when one changes you get a new function, which is what you want.",
      "Usa useCallback cuando pasas una función a un hijo con memo o a la lista de dependencias de otro hook. Pon en deps cada valor del componente que la función lee; cuando uno cambia recibes una función nueva, que es lo que quieres.",
      "useCallback は memo の子に関数を渡すときや、別のフックの依存配列に入れるときに使う。関数が読む部品の値は全部 deps に入れる。どれかが変われば新しい関数になる。それが正しい動きだ。",
    ),
    p(
      "Common mistake: mixing them up. useCallback(() => sum(xs), [xs]) gives you a function, and JSX can't show a function as text. Ask: do I want the RESULT (useMemo) or the FUNCTION to call later (useCallback)?",
      "Error común: confundirlos. useCallback(() => sum(xs), [xs]) te da una función, y el JSX no puede mostrar una función como texto. Pregúntate: ¿quiero el RESULTADO (useMemo) o la FUNCIÓN para llamar luego (useCallback)?",
      "よくあるミス：取り違え。useCallback(() => sum(xs), [xs]) は関数を返し、JSX は関数を文字として出せない。欲しいのは「結果」（useMemo）？それとも「後で呼ぶ関数」（useCallback）？",
    ),
  ),
  note("memo-limits", L("When memo isn't worth it", "Cuándo memo no vale la pena", "メモ化が要らないとき"),
    p(
      "Memoizing is not free: React stores the old value and compares every dependency on every render. For cheap work, like joining two strings or adding a few numbers, that bookkeeping costs about as much as just doing the work again. Memoize slow work, or values a memo child or hook depends on.",
      "Memoizar no es gratis: React guarda el valor viejo y compara cada dependencia en cada render. Para trabajo barato, como unir dos strings o sumar unos números, ese control cuesta casi lo mismo que repetir el trabajo. Memoiza trabajo lento, o valores de los que depende un hijo memo o un hook.",
      "メモ化はタダではない。React は古い値を保存し、毎回すべての依存を比べる。文字列2つの連結や少しの足し算なら、やり直すのとほぼ同じ手間だ。メモ化するのは重い処理か、memo の子やフックが依存する値だけ。",
    ),
    ex('function Title({ city }: { city: string }) {\n  const text = city.toUpperCase();\n  return <h1>{text}</h1>;\n}\nconsole.log(renderToStaticMarkup(<Title city="Lima" />));', "<h1>LIMA</h1>",
      L("Cheap work: just compute it on each render", "Trabajo barato: calcúlalo en cada render", "軽い処理は毎回計算すればいい")),
    p(
      "Measure before optimizing: the React DevTools Profiler shows which components are slow. And the React Compiler can add memoization automatically at build time, so in projects that use it you write plain code and rarely need manual useMemo or useCallback.",
      "Mide antes de optimizar: el Profiler de React DevTools muestra qué componentes son lentos. Y el React Compiler puede añadir memoización automáticamente al compilar, así que en proyectos que lo usan escribes código simple y rara vez necesitas useMemo o useCallback a mano.",
      "最適化の前に計測しよう。React DevTools の Profiler で遅い部品が分かる。React Compiler を使うプロジェクトではビルド時に自動でメモ化されるので、普通のコードを書けばよく、手動の useMemo や useCallback はほとんど要らない。",
    ),
    p(
      "memo has limits too: it only compares the props coming from the parent. A memo component still re-renders when its own state changes or when a context it reads with useContext changes. memo saves work from the outside, never from the inside.",
      "memo también tiene límites: solo compara las props que vienen del padre. Un componente memo se re-renderiza igual cuando cambia su propio estado o cuando cambia un contexto que lee con useContext. memo ahorra trabajo que viene de fuera, nunca de dentro.",
      "memo にも限界がある。比べるのは親から来る props だけ。memo の部品でも、自分の state が変わったときや useContext で読むコンテキストが変わったときは再レンダーする。memo が防ぐのは外からの再レンダーだけだ。",
    ),
    tc('const Mood = createContext("calm");\nconst Face = memo(function Face() {\n  const mood = useContext(Mood);\n  const [blink] = useState(false);\n  return <p>{mood}{blink ? "-" : "o"}</p>;\n});',
      L("No props, yet Mood or blink changes still re-render Face", "Sin props, pero cambios de Mood o blink re-renderizan Face", "props なしでも Mood や blink の変化で再レンダー")),
    p(
      "Common mistake: wrapping everything in memo, useMemo and useCallback just in case. It makes code harder to read and can be slower. Start simple, measure, and add memoization where it clearly helps.",
      "Error común: envolver todo en memo, useMemo y useCallback por si acaso. Hace el código más difícil de leer y puede ser más lento. Empieza simple, mide y añade memoización donde claramente ayude.",
      "よくあるミス：念のためにと何でも memo・useMemo・useCallback で包むこと。読みにくくなり、遅くなることさえある。まずはシンプルに書き、計測して、効果がはっきりある所だけメモ化しよう。",
    ),
  ),
];

const memoizationShield: LessonDef = {
  slug: "memoization-shield",
  title: L("The shield of sameness", "El escudo de lo mismo", "同一性の盾"),
  concept: "memoization",
  mode: "lesson",
  xp: 80,
  enemy: "react/rerender-tornado",
  enemyName: L("RE-RENDER STORM", "TORMENTA RENDER", "再レンダー嵐"),
  beats: [
    say(L(
      "When a parent re-renders, its children re-render too. memo(Child) is a shield: it skips the child if every prop is the SAME as last time.",
      "Cuando un padre se re-renderiza, sus hijos también. memo(Child) es un escudo: salta al hijo si cada prop es LA MISMA que antes.",
      "親が再レンダーすると子も再レンダー。memo(Child) は盾で、props が前回と同じなら子をスキップするよ。",
    )),
    {
      kind: "act",
      prompt: L("Raise the shield and watch which props pass", "Alza el escudo y mira qué props pasan", "盾を構え、通る props を見よう"),
      setup: [],
      steps: [
        { label: L("SHIELD", "ESCUDO", "盾"), line: "const Row = memo(RowImpl);", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Row" }, { t: "item", kind: "shield", holder: "ally" }] },
        { label: L("SAME id", "MISMO id", "同じ id"), line: "<Row id={1} />", effects: [{ t: "say", actor: "ally", text: L("Same 1: skip!", "Mismo 1: ¡salto!", "同じ1：スキップ！") }] },
        { label: L("NEW ARROW", "FLECHA NUEVA", "新しい関数"), line: "<Row id={1} onClick={() => pick(1)} />", effects: [{ t: "shake" }, { t: "banner", text: L("RENDER", "RENDER", "レンダー") }, { t: "say", actor: "ally", text: L("A new function!", "¡Función nueva!", "新しい関数だ！") }] },
        { label: L("STABLE FN", "FN ESTABLE", "安定した関数"), line: "const onPick = useCallback(() => pick(1), []);", effects: [{ t: "item", kind: "key", holder: "hero" }, { t: "tag", actor: "hero", text: "onPick" }] },
        { label: L("PASS IT", "PASARLA", "渡す"), line: "<Row id={1} onClick={onPick} />", effects: [{ t: "lend", to: "ally" }, { t: "say", actor: "ally", text: L("Same key: skip", "Misma llave: salto", "同じ鍵：スキップ") }] },
      ],
    },
    {
      kind: "predict",
      hint: L("=== on objects asks: is it the very same object? Each literal creates its own object.", "=== con objetos pregunta: ¿es exactamente el mismo objeto? Cada literal crea su propio objeto.", "オブジェクトの === は「まったく同じもの？」を問う。リテラルは毎回別物。"),
      note: "memo-identity",
      prompt: WHAT_PRINTS,
      code: "const a = { id: 1 };\nconst b = { id: 1 };\nconsole.log(a === b, a === a);",
      options: ["false true", "true true", "true false"],
      answer: 0,
      output: "false true",
      explain: L(
        "Two objects that look equal are still different objects. memo compares with Object.is, so a fresh object breaks the shield.",
        "Dos objetos que se ven iguales siguen siendo distintos. memo compara con Object.is, así que un objeto nuevo rompe el escudo.",
        "見た目が同じでも別のオブジェクト。memo は Object.is で比べるので、新しいオブジェクトは盾を破るよ。",
      ),
      check: { compiles: true, stdout: "false true" },
      setup: [{ t: "item", kind: "gem", holder: "hero" }, { t: "tag", actor: "hero", text: "a" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "b" }],
      win: [{ t: "clone", to: "ally" }, { t: "print", text: "false true" }],
    },
    {
      kind: "predict",
      hint: L("Each render runs the parent again. Is the arrow in onClick the same function as last time?", "Cada render ejecuta otra vez al padre. ¿La flecha de onClick es la misma función que antes?", "レンダーのたびに親が再実行される。onClick のアローは前回と同じ関数？"),
      note: "memo-identity",
      prompt: L("Parent re-renders. Does Row re-render?", "El padre se re-renderiza. ¿Y Row?", "親が再レンダー。Row は？"),
      code: 'const Row = memo(function Row({ onClick }: { onClick: () => void }) {\n  return <button onClick={onClick}>Pick</button>;\n});\n// in the parent:\n<Row onClick={() => select(id)} />',
      options: [
        L("Yes: a new function each render", "Sí: una función nueva en cada render", "する：毎回新しい関数"),
        L("No: memo skips it", "No: memo lo salta", "しない：memo がスキップ"),
      ],
      answer: 0,
      explain: L(
        "An inline arrow is a brand-new function on every render, so the prop is never the same and memo can't skip.",
        "Una flecha inline es una función nueva en cada render: la prop nunca es la misma y memo no puede saltar.",
        "インラインのアロー関数は毎回新しい関数。props が同じにならず memo はスキップできないよ。",
      ),
      check: {
        compiles: true,
        program: prog(
          'const Row = memo(function Row({ onClick }: { onClick: () => void }) {\n  return <button onClick={onClick}>Pick</button>;\n});\nfunction Parent({ id, select }: { id: number; select: (n: number) => void }) {\n  return <Row onClick={() => select(id)} />;\n}',
        ),
      },
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Row" }, { t: "item", kind: "shield", holder: "ally" }],
      win: [{ t: "shake" }, { t: "banner", text: L("RENDER", "RENDER", "レンダー") }],
    },
    {
      kind: "pick",
      hint: L("You want to keep a function, not a computed value, and refresh it when id changes.", "Quieres conservar una función, no un valor calculado, y renovarla cuando cambie id.", "残したいのは計算結果ではなく関数。id が変わったら作り直す。"),
      note: "callback-memo",
      prompt: L("Keep the same function between renders", "Mantén la misma función entre renders", "レンダー間で同じ関数を保とう"),
      code: "const onPick = ___(() => select(id), [id]);\nreturn <Row onClick={onPick} />;",
      options: ["useCallback", "useRef", "useState"],
      answer: 0,
      explain: L(
        "useCallback returns the same function until a dependency (id) changes, so memo(Row) can skip.",
        "useCallback devuelve la misma función hasta que cambia una dependencia (id), así memo(Row) puede saltar.",
        "useCallback は依存配列の id が変わるまで同じ関数を返す。だから memo(Row) がスキップできるよ。",
      ),
      check: {
        compiles: true,
        program: prog(
          'const Row = memo(function Row({ onClick }: { onClick: () => void }) {\n  return <button onClick={onClick}>Pick</button>;\n});\nfunction Parent({ id, select }: { id: number; select: (n: number) => void }) {\n  const onPick = useCallback(() => select(id), [id]);\n  return <Row onClick={onPick} />;\n}',
        ),
      },
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Row" }, { t: "item", kind: "shield", holder: "ally" }],
      win: [{ t: "say", actor: "ally", text: L("Same! Skipped.", "¡Igual! Salto.", "同じ！スキップ") }],
    },
    say(L(
      "useCallback caches a FUNCTION. useMemo caches a computed VALUE and recomputes only when its dependencies change.",
      "useCallback guarda una FUNCIÓN. useMemo guarda un VALOR calculado y solo lo recalcula cuando cambian sus dependencias.",
      "useCallback は関数をキャッシュ。useMemo は計算した値をキャッシュし、依存配列が変わった時だけ再計算するよ。",
    )),
    {
      kind: "pick",
      hint: L("<p> needs the number sum returns, not a function. Which hook caches a result?", "<p> necesita el número que devuelve sum, no una función. ¿Qué hook guarda un resultado?", "<p> に要るのは sum の結果の数。結果をキャッシュするフックは？"),
      note: "callback-memo",
      prompt: L("Cache the expensive total", "Guarda en caché el total costoso", "重い合計をキャッシュしよう"),
      code: "const total = ___(() => sum(items), [items]);\nreturn <p>{total}</p>;",
      options: ["useMemo", "useCallback"],
      answer: 0,
      explain: L(
        "useMemo stores the result. useCallback would store the function itself, and <p> can't render a function.",
        "useMemo guarda el resultado. useCallback guardaría la función misma, y <p> no puede renderizar una función.",
        "useMemo は結果を保存。useCallback だと関数自体が入り、<p> では関数を描画できないよ。",
      ),
      check: {
        compiles: true,
        program: prog(
          "const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);\nfunction Total({ items }: { items: number[] }) {\n  const total = useMemo(() => sum(items), [items]);\n  return <p>{total}</p>;\n}",
        ),
      },
      win: [{ t: "item", kind: "gem", holder: "hero" }, { t: "say", actor: "hero", text: L("Cached!", "¡En caché!", "キャッシュ！") }],
    },
    {
      kind: "predict",
      hint: L("Does useMemo run during render, or after it like an effect?", "¿useMemo corre durante el render o después, como un efecto?", "useMemo はレンダー中に動く？副作用のように後？"),
      note: "callback-memo",
      prompt: WHAT_PRINTS,
      code: "function C({ items }: { items: number[] }) {\n  const total = useMemo(() => items.reduce((a, b) => a + b, 0), [items]);\n  return <p>{total}</p>;\n}\nconsole.log(renderToStaticMarkup(<C items={[1, 2, 3]} />));",
      options: ["<p>6</p>", "<p></p>", "<p>123</p>"],
      answer: 0,
      output: "<p>6</p>",
      explain: L(
        "useMemo runs during render (unlike an effect), so the first render already shows 6.",
        "useMemo corre durante el render (no como un efecto), así que el primer render ya muestra 6.",
        "useMemo は副作用と違いレンダー中に動く。だから最初のレンダーで 6 が出るよ。",
      ),
      check: {
        compiles: true,
        program: prog("function C({ items }: { items: number[] }) {\n  const total = useMemo(() => items.reduce((a, b) => a + b, 0), [items]);\n  return <p>{total}</p>;\n}\nconsole.log(renderToStaticMarkup(<C items={[1, 2, 3]} />));"),
        stdout: "<p>6</p>",
      },
      win: [{ t: "print", text: "<p>6</p>" }],
    },
    {
      kind: "predict",
      hint: L("Memoizing has its own cost. How expensive is joining two short strings?", "Memoizar tiene su propio costo. ¿Cuánto cuesta unir dos strings cortos?", "メモ化にもコストがある。短い文字列の連結は重い？"),
      note: "memo-limits",
      prompt: L("Is this useMemo worth it?", "¿Vale la pena este useMemo?", "この useMemo は必要？"),
      code: 'const label = useMemo(() => first + " " + last, [first, last]);',
      options: [
        L("No: joining two strings is cheap", "No: unir dos strings es barato", "不要：文字列の連結は軽い"),
        L("Yes: always memoize", "Sí: memoiza siempre", "必要：常にメモ化"),
      ],
      answer: 0,
      explain: L(
        "Memoizing has a cost too. Skip it for cheap work; measure with the Profiler first. The React Compiler can memoize for you.",
        "Memoizar también cuesta. Evítalo en trabajo barato; mide antes con el Profiler. El React Compiler puede memoizar por ti.",
        "メモ化にもコストがある。軽い処理には不要で、まず Profiler で計測しよう。",
      ),
      check: { compiles: true, program: prog('function Name({ first, last }: { first: string; last: string }) {\n  const label = useMemo(() => first + " " + last, [first, last]);\n  return <p>{label}</p>;\n}') },
    },
    {
      kind: "predict",
      hint: L("memo compares props from the parent. What else can make a component render?", "memo compara las props del padre. ¿Qué más puede hacer que un componente se renderice?", "memo が比べるのは親からの props。他に再レンダーの原因は？"),
      note: "memo-limits",
      prompt: L("When does this memo child still re-render?", "¿Cuándo se re-renderiza igual este hijo memo?", "この memo の子が再レンダーするのは？"),
      code: "const Clock = memo(function Clock() {\n  const theme = useContext(Theme);\n  const [t, setT] = useState(0);\n  return <p>{theme} {t}</p>;\n});",
      options: [
        L("When its state or Theme changes", "Cuando cambia su estado o Theme", "自分の state か Theme が変わった時"),
        L("Never: memo blocks everything", "Nunca: memo bloquea todo", "しない：memo が全部止める"),
      ],
      answer: 0,
      explain: L(
        "memo only compares props from the parent. Its own state and the contexts it reads still trigger re-renders.",
        "memo solo compara las props del padre. Su propio estado y los contextos que lee siguen causando re-renders.",
        "memo が比べるのは親からの props だけ。自分の state や読むコンテキストの変化では再レンダーするよ。",
      ),
      check: { compiles: true, program: prog('const Theme = createContext("light");\nconst Clock = memo(function Clock() {\n  const theme = useContext(Theme);\n  const [t, setT] = useState(0);\n  return <p>{theme} {t}</p>;\n});') },
    },
    {
      kind: "type",
      hint: L("You need the hook that keeps the same function between renders until id changes.", "Necesitas el hook que mantiene la misma función entre renders hasta que cambia id.", "id が変わるまで同じ関数を保つフックを書こう。"),
      note: "callback-memo",
      prompt: L("Cache the save handler", "Guarda el handler de guardado", "保存ハンドラをキャッシュしよう"),
      code: "const save = ___(() => send(id), [id]);",
      answer: "useCallback",
      explain: L(
        "useCallback(fn, deps) keeps the same function between renders until id changes.",
        "useCallback(fn, deps) mantiene la misma función entre renders hasta que cambia id.",
        "useCallback(fn, deps) は id が変わるまでレンダー間で同じ関数を保つよ。",
      ),
      check: { compiles: true, program: prog("function Saver({ id, send }: { id: number; send: (n: number) => void }) {\n  const save = useCallback(() => send(id), [id]);\n  return <button onClick={save}>Save</button>;\n}") },
      win: [{ t: "item", kind: "key", holder: "hero" }],
    },
    {
      kind: "run",
      hint: L("What does JSON.stringify do with functions? Compare each key with the check memo uses.", "¿Qué hace JSON.stringify con las funciones? Compara cada clave con el chequeo que usa memo.", "JSON.stringify は関数をどう扱う？各キーを memo と同じ方法で比べよう。"),
      note: "memo-identity",
      prompt: L("Make shallowEqual compare props like memo does", "Haz que shallowEqual compare props como memo", "memo のように props を比べよう"),
      starter:
        "type Props = Record<string, unknown>;\nfunction shallowEqual(a: Props, b: Props): boolean {\n  return JSON.stringify(a) === JSON.stringify(b);\n}\nconst f1 = () => {};\nconst f2 = () => {};\nconsole.log(\n  shallowEqual({ id: 1, onClick: f1 }, { id: 1, onClick: f2 }),\n  shallowEqual({ id: 1, onClick: f1 }, { id: 1, onClick: f1 }),\n);",
      solution:
        "type Props = Record<string, unknown>;\nfunction shallowEqual(a: Props, b: Props): boolean {\n  const ka = Object.keys(a), kb = Object.keys(b);\n  return ka.length === kb.length && ka.every((k) => Object.is(a[k], b[k]));\n}\nconst f1 = () => {};\nconst f2 = () => {};\nconsole.log(\n  shallowEqual({ id: 1, onClick: f1 }, { id: 1, onClick: f2 }),\n  shallowEqual({ id: 1, onClick: f1 }, { id: 1, onClick: f1 }),\n);",
      expect: "false true",
      fallback: ["Object\\.is\\(", "a\\[k\\]\\s*===\\s*b\\[k\\]"],
      explain: L(
        "JSON.stringify drops functions, so f1 and f2 look equal. memo compares each prop with Object.is: f1 and f2 differ.",
        "JSON.stringify ignora las funciones, así que f1 y f2 parecen iguales. memo compara cada prop con Object.is: son distintas.",
        "JSON.stringify は関数を落とすので同じに見える。memo は各 props を Object.is で比べるよ。",
      ),
    },
  ],
  notes: memoNotes,
};

// ─── 4.3 custom hooks and the rules of hooks ────────────────────────────────
const hooksNotes: NoteDef[] = [
  note("hook-order", L("Why hooks keep the same order", "Por qué los hooks mantienen el orden", "フックの順番が大事な理由"),
    p(
      "Inside React, hooks have no names. For each component React keeps a list of slots, like numbered drawers. On every render the 1st hook call gets drawer 1, the 2nd gets drawer 2, and so on. The variable names you choose, like kind or legs, are only labels in your code; React never sees them.",
      "Dentro de React los hooks no tienen nombre. Para cada componente React guarda una lista de casillas, como cajones numerados. En cada render la 1.ª llamada a un hook recibe el cajón 1, la 2.ª el cajón 2, y así. Los nombres que eliges, como kind o legs, son solo etiquetas en tu código; React no los ve.",
      "React の中でフックに名前はない。部品ごとに番号付きの引き出しのような枠の列を持ち、毎回1つ目のフック呼び出しが引き出し1、2つ目が引き出し2…となる。kind や legs などの変数名はコードの中のラベルにすぎず、React には見えない。",
    ),
    ex('function Pet() {\n  const [kind] = useState("cat");\n  const [legs] = useState(4);\n  return <p>{`${kind} ${legs}`}</p>;\n}\nconsole.log(renderToStaticMarkup(<Pet />));', "<p>cat 4</p>",
      L("Two useState calls: drawer 1 and drawer 2", "Dos llamadas a useState: cajón 1 y cajón 2", "useState 2回：引き出し1と2")),
    p(
      "That's why the order must be identical on every render. If one render skips a hook, every hook after it shifts by one: the 2nd call now opens the drawer that belonged to the 3rd, and state ends up in the wrong place. React then warns that the number of hooks changed between renders.",
      "Por eso el orden debe ser idéntico en cada render. Si un render se salta un hook, todos los de después se corren uno: la 2.ª llamada abre el cajón que era del 3.º, y el estado termina en el lugar equivocado. Entonces React avisa de que cambió la cantidad de hooks entre renders.",
      "だから順番は毎回まったく同じでなければならない。あるレンダーでフックが1つ飛ばされると、後のフックが全部1つずれる。2つ目の呼び出しが3つ目の引き出しを開け、state が違う場所に入る。React はフックの数が変わったと警告する。",
    ),
    p(
      "Remember: React matches state by call position, not by name. Anything that can change how many hooks run, or in which order, breaks that matching.",
      "Recuerda: React asocia el estado por la posición de la llamada, no por el nombre. Todo lo que pueda cambiar cuántos hooks corren, o en qué orden, rompe esa asociación.",
      "覚えておこう：React は名前ではなく呼び出しの位置で state を対応させる。実行されるフックの数や順番を変えうるものは、すべてこの対応を壊す。",
    ),
  ),
  note("rules-of-hooks", L("The rules of hooks", "Las reglas de los hooks", "フックのルール"),
    p(
      "Rule 1: call hooks only at the top level of the component. Never inside an if, a loop, a nested function, or after an early return, because then they wouldn't run on every render. Rule 2: call hooks only from function components or from custom hooks, never from event handlers or ordinary helper functions.",
      "Regla 1: llama a los hooks solo en el nivel superior del componente. Nunca dentro de un if, un bucle, una función anidada o después de un return temprano, porque entonces no correrían en cada render. Regla 2: llama a los hooks solo desde componentes de función o hooks propios, nunca desde manejadores de eventos o funciones auxiliares.",
      "ルール1：フックは部品のトップレベルでだけ呼ぶ。if やループ、入れ子の関数の中、早期 return の後は禁止。毎回実行されなくなるからだ。ルール2：フックは関数コンポーネントかカスタムフックからだけ呼ぶ。イベントハンドラや普通の関数からは呼ばない。",
    ),
    tc('function Note({ text }: { text: string | null }) {\n  const [open, setOpen] = useState(false);\n  if (!text) return null;\n  return <p onClick={() => setOpen(!open)}>{text}</p>;\n}',
      L("Hooks first, the early return after them", "Primero los hooks, después el return temprano", "フックが先、早期 return はその後")),
    p(
      "An early return is a hidden condition: when it fires, every hook below it is skipped for that render. Move all hooks above any return. If you only need the hook's work sometimes, put the condition INSIDE the hook (for example inside the effect), not around it.",
      "Un return temprano es una condición oculta: cuando se cumple, todos los hooks de abajo se saltan en ese render. Sube todos los hooks por encima de cualquier return. Si solo a veces necesitas lo que hace el hook, pon la condición DENTRO del hook (por ejemplo dentro del efecto), no alrededor.",
      "早期 return は隠れた条件だ。それが働くと、その下のフックはそのレンダーで全部飛ばされる。フックはすべて return より上へ。ときどきしか必要ないなら、条件はフックの外ではなく中（たとえば副作用の中）に書こう。",
    ),
    p(
      "Handlers run later, when the user clicks, not during render, so a hook call there has no drawer. Read the value with the hook at the top of the component, then use that value inside the handler.",
      "Los manejadores corren después, cuando el usuario hace clic, no durante el render, así que un hook ahí no tiene cajón. Lee el valor con el hook arriba del componente y luego usa ese valor dentro del manejador.",
      "ハンドラはレンダー中ではなく、クリックされた後で動くので、そこでのフック呼び出しには引き出しがない。部品の上でフックを使って値を読み、その値をハンドラの中で使おう。",
    ),
    tc('const Volume = createContext(5);\nfunction Knob() {\n  const volume = useContext(Volume);\n  function onClick() {\n    console.log("volume", volume);\n  }\n  return <button onClick={onClick}>knob</button>;\n}',
      L("Read the context at the top, use the value in the handler", "Lee el contexto arriba y usa el valor en el manejador", "上で読み、ハンドラでは値を使う")),
    p(
      "Common mistake: trusting TypeScript. A hook inside an if type-checks perfectly; the rules are enforced by the eslint-plugin-react-hooks lint rule and by React at runtime. Keep that lint rule on.",
      "Error común: confiar en TypeScript. Un hook dentro de un if pasa el chequeo de tipos sin problema; las reglas las vigila la regla de lint eslint-plugin-react-hooks y React al ejecutar. Mantén activada esa regla de lint.",
      "よくあるミス：TypeScript を信じきること。if の中のフックも型チェックは通る。ルールを守らせるのは eslint-plugin-react-hooks の lint と実行時の React だ。この lint は必ず有効にしておこう。",
    ),
  ),
  note("custom-hooks", L("Custom hooks share logic", "Los hooks propios comparten lógica", "カスタムフックはロジックを共有"),
    p(
      "A custom hook is a plain function whose name starts with use and that calls other hooks. It lets several components reuse the same logic, like a counter, a timer or a subscription, without copying code. It returns whatever you like: a value, an array, an object.",
      "Un hook propio es una función normal cuyo nombre empieza con use y que llama a otros hooks. Permite que varios componentes reutilicen la misma lógica, como un contador, un temporizador o una suscripción, sin copiar código. Devuelve lo que quieras: un valor, un arreglo, un objeto.",
      "カスタムフックは名前が use で始まり、他のフックを呼ぶ普通の関数。カウンターやタイマー、購読などの同じロジックを、コードをコピーせずに複数の部品で使い回せる。返すものは値でも配列でもオブジェクトでも自由。",
    ),
    p(
      "It shares LOGIC, not state. Each component that calls the hook gets its own drawers, so its own state. Changing the state in one component never affects another one using the same hook. To truly share state, lift it up to a parent or put it in context.",
      "Comparte LÓGICA, no estado. Cada componente que llama al hook recibe sus propios cajones, y por tanto su propio estado. Cambiar el estado en un componente nunca afecta a otro que use el mismo hook. Para compartir estado de verdad, súbelo a un padre o ponlo en un contexto.",
      "共有するのはロジックで、state ではない。フックを呼ぶ部品ごとに自分の引き出し、つまり自分の state を持つ。ある部品で state を変えても、同じフックを使う別の部品には影響しない。本当に共有したいなら親へ持ち上げるかコンテキストに入れよう。",
    ),
    ex('function useScore(start: number) {\n  const [score, setScore] = useState(start);\n  return { score, add: () => setScore((s) => s + 10) };\n}\nfunction P1() { return <em>{useScore(100).score}</em>; }\nfunction P2() { return <u>{useScore(0).score}</u>; }\nconsole.log(renderToStaticMarkup(<div><P1 /><P2 /></div>));', "<div><em>100</em><u>0</u></div>",
      L("Same hook, separate state in each component", "Mismo hook, estado separado en cada componente", "同じフックでも state は部品ごとに別")),
    p(
      "The use prefix isn't decoration: it tells React and the linter that the function calls hooks, so the rules of hooks are checked inside it and wherever it's called. Inside, a custom hook can use state, effects with cleanup, refs or context, just like a component.",
      "El prefijo use no es decoración: le dice a React y al linter que la función llama hooks, así que las reglas de los hooks se revisan dentro y donde se llame. Dentro, un hook propio puede usar estado, efectos con limpieza, refs o contexto, igual que un componente.",
      "use という接頭辞は飾りではない。フックを呼ぶ関数だと React と lint に伝え、中でも呼び出し側でもフックのルールがチェックされる。カスタムフックの中では、部品と同じように state、片付け付きの副作用、ref、コンテキストが使える。",
    ),
    tc('function useTicker(ms: number) {\n  const [ticks, setTicks] = useState(0);\n  useEffect(() => {\n    const id = setInterval(() => setTicks((t) => t + 1), ms);\n    return () => clearInterval(id);\n  }, [ms]);\n  return ticks;\n}',
      L("State plus an effect with cleanup, packed into one hook", "Estado y un efecto con limpieza, en un solo hook", "state と片付け付き副作用を1つのフックに")),
    p(
      "Common mistake: expecting two components that call the same custom hook to see each other's changes. They won't: every call is independent, and it starts from the arguments that call passes in.",
      "Error común: esperar que dos componentes que llaman al mismo hook propio vean los cambios del otro. No pasa: cada llamada es independiente y parte de los argumentos que esa llamada recibe.",
      "よくあるミス：同じカスタムフックを呼ぶ2つの部品が、お互いの変化を見られると思うこと。見えない。呼び出しはそれぞれ独立していて、その呼び出しに渡された引数から始まる。",
    ),
  ),
];

const customHooks: LessonDef = {
  slug: "custom-hooks",
  title: L("Spell recipes", "Recetas de hechizos", "呪文のレシピ"),
  concept: "hooks_rules",
  mode: "lesson",
  xp: 80,
  enemy: "react/key-twins",
  enemyName: L("DRAWER MIXER", "MEZCLA CAJONES", "引き出し荒らし"),
  beats: [
    say(L(
      "Hooks are numbered drawers. Every render React opens drawer 1, 2, 3 in the SAME order. That's how it knows which state is which.",
      "Los hooks son cajones numerados. En cada render React abre el cajón 1, 2, 3 en el MISMO orden. Así sabe qué estado es cuál.",
      "フックは番号付きの引き出し。毎回1、2、3と同じ順で開けるから、どの state か React にわかるんだ。",
    )),
    {
      kind: "act",
      prompt: L("Open the drawers, then skip one", "Abre los cajones y luego salta uno", "引き出しを開け、ひとつ飛ばそう"),
      setup: [],
      steps: [
        { label: L("DRAWER 1", "CAJÓN 1", "引き出し1"), line: 'const [name] = useState("Ada");', effects: [{ t: "tag", actor: "hero", text: "#1 name", value: "Ada" }] },
        { label: L("DRAWER 2", "CAJÓN 2", "引き出し2"), line: "const [age] = useState(36);", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "#2 age", value: "36" }] },
        { label: L("ADD AN if", "AÑADIR if", "if を足す"), line: "if (guest) { const [x] = useState(0); }", effects: [{ t: "enter", actor: "enemy" }, { t: "say", actor: "enemy", text: L("Shuffle time!", "¡A mezclar!", "かき混ぜるぞ！") }] },
        {
          label: L("RE-RENDER", "RE-RENDER", "再レンダー"),
          line: "// guest changed: drawer 2 now gets x's slot",
          effects: [{ t: "shake" }, { t: "value", actor: "ally", text: "0?" }],
          error: {
            compiler: "React Hook \"useState\" is called conditionally. React Hooks must be called in the exact same order in every component render.",
            plain: L(
              "A hook inside an if changes the drawer order between renders, so state lands in the wrong drawer.",
              "Un hook dentro de un if cambia el orden de los cajones entre renders y el estado cae en el cajón equivocado.",
              "if の中のフックで順番がずれ、state が違う引き出しに入ってしまう。",
            ),
          },
        },
      ],
    },
    {
      kind: "predict",
      hint: L("Will useState run on every render, whatever the value of open is?", "¿useState se ejecutará en cada render, sea cual sea el valor de open?", "open の値にかかわらず、useState は毎回呼ばれる？"),
      note: "rules-of-hooks",
      prompt: RULES_OK,
      code: "function Panel({ open }: { open: boolean }) {\n  if (open) {\n    const [x] = useState(0);\n  }\n  return <p>Panel</p>;\n}",
      options: [YES, L("No: hook inside an if", "No: hook dentro de un if", "いいえ：if の中のフック")],
      answer: 1,
      explain: L(
        "It even type-checks, but the hooks lint rule rejects it: call hooks at the top level, never inside conditions or loops.",
        "Hasta compila, pero la regla de lint de hooks lo rechaza: llama hooks en el nivel superior, nunca en condiciones o bucles.",
        "型チェックは通るが lint が拒否する。フックは条件やループの中ではなくトップレベルで呼ぼう。",
      ),
      check: { compiles: true, program: prog("function Panel({ open }: { open: boolean }) {\n  if (open) {\n    const [x] = useState(0);\n  }\n  return <p>Panel</p>;\n}") },
      win: [{ t: "shake" }],
    },
    {
      kind: "predict",
      hint: L("When user is null, which lines run? Is the hook call one of them?", "Si user es null, ¿qué líneas se ejecutan? ¿La llamada al hook es una de ellas?", "user が null のとき実行される行は？フック呼び出しは含まれる？"),
      note: "rules-of-hooks",
      prompt: RULES_OK,
      code: "function Card({ user }: { user: string | null }) {\n  if (!user) return null;\n  const [x] = useState(0);\n  return <p>{user}</p>;\n}",
      options: [YES, L("No: hook after an early return", "No: hook tras un return temprano", "いいえ：早期 return の後")],
      answer: 1,
      explain: L(
        "When user is null, the hook is skipped, so the hook count changes between renders. Move hooks above the early return.",
        "Si user es null, el hook se salta y cambia la cantidad de hooks entre renders. Pon los hooks antes del return temprano.",
        "user が null だとフックが飛ばされ数が変わる。フックは早期 return より上に置こう。",
      ),
      check: { compiles: true, program: prog("function Card({ user }: { user: string | null }) {\n  if (!user) return null;\n  const [x] = useState(0);\n  return <p>{user}</p>;\n}") },
      win: [{ t: "shake" }],
    },
    {
      kind: "predict",
      hint: L("Where may hooks be called: in any function, or only in components and custom hooks?", "¿Dónde se pueden llamar los hooks: en cualquier función o solo en componentes y hooks propios?", "フックを呼べるのはどこ？どの関数でも？部品とカスタムフックだけ？"),
      note: "rules-of-hooks",
      prompt: RULES_OK,
      code: "function handleClick() {\n  const theme = useContext(Theme);\n  console.log(theme);\n}",
      options: [YES, L("No: hook in an event handler", "No: hook en un manejador", "いいえ：イベント内のフック")],
      answer: 1,
      explain: L(
        "Hooks belong to components and custom hooks only. Read the context at the top of the component and use it in the handler.",
        "Los hooks solo van en componentes y hooks propios. Lee el contexto arriba del componente y úsalo en el manejador.",
        "フックはコンポーネントとカスタムフック専用。上で読み、ハンドラでは値を使おう。",
      ),
      check: { compiles: true, program: prog('const Theme = createContext("light");\nfunction handleClick() {\n  const theme = useContext(Theme);\n  console.log(theme);\n}') },
    },
    {
      kind: "predict",
      hint: L("Hooks have no names inside React. How else could it tell the two calls apart?", "Los hooks no tienen nombre dentro de React. ¿Cómo más podría distinguir las dos llamadas?", "React の中でフックに名前はない。2つの呼び出しを何で区別する？"),
      note: "hook-order",
      prompt: L("Why must hooks keep the same order?", "¿Por qué los hooks mantienen el orden?", "フックの順番を保つ理由は？"),
      code: 'const [name] = useState("Ada");\nconst [age] = useState(36);',
      options: [
        L("React matches state by call order", "React asocia el estado por orden de llamada", "呼び出し順で state を対応させるから"),
        L("Only for performance", "Solo por rendimiento", "速度のためだけ"),
      ],
      answer: 0,
      explain: L(
        "Hooks have no names inside React: the 1st useState gets drawer 1, the 2nd gets drawer 2. Change the order and state gets mixed up.",
        "Los hooks no tienen nombre dentro de React: el 1.er useState usa el cajón 1, el 2.º el cajón 2. Si cambia el orden, se mezcla el estado.",
        "React の中でフックに名前はない。1つ目は引き出し1、2つ目は2。順番が変わると state が混ざる。",
      ),
      check: { compiles: true, program: prog('function Person() {\n  const [name] = useState("Ada");\n  const [age] = useState(36);\n  return <p>{name} {age}</p>;\n}') },
      setup: [{ t: "tag", actor: "hero", text: "#1 name", value: "Ada" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "#2 age", value: "36" }],
      win: [{ t: "say", actor: "hero", text: L("Order is key!", "¡El orden manda!", "順番が大事！") }],
    },
    say(L(
      "A custom hook is a function named use... that calls other hooks. It shares LOGIC, not state: each call gets its own drawers.",
      "Un hook propio es una función llamada use... que llama a otros hooks. Comparte LÓGICA, no estado: cada llamada tiene sus cajones.",
      "カスタムフックは use で始まり、他のフックを呼ぶ関数。共有するのはロジックで、state は呼ぶたびに別だよ。",
    )),
    {
      kind: "predict",
      hint: L("A and B each call useCounter on their own. One shared drawer, or one each?", "A y B llaman a useCounter por su cuenta. ¿Un cajón compartido o uno cada uno?", "A と B はそれぞれ useCounter を呼ぶ。引き出しは共有？別々？"),
      note: "custom-hooks",
      prompt: WHAT_PRINTS,
      code: "function useCounter(start: number) {\n  const [n, setN] = useState(start);\n  return { n, inc: () => setN(n + 1) };\n}\nfunction A() { return <b>{useCounter(1).n}</b>; }\nfunction B() { return <i>{useCounter(5).n}</i>; }\nconsole.log(renderToStaticMarkup(<><A /><B /></>));",
      options: ["<b>1</b><i>5</i>", "<b>5</b><i>5</i>", "<b>1</b><i>1</i>"],
      answer: 0,
      output: "<b>1</b><i>5</i>",
      explain: L(
        "Each component that calls useCounter gets its own state. Clicking inc in A would never change B.",
        "Cada componente que llama a useCounter tiene su propio estado. Hacer inc en A nunca cambiaría B.",
        "useCounter を呼ぶコンポーネントごとに state は別。A で inc しても B は変わらないよ。",
      ),
      check: {
        compiles: true,
        program: prog("function useCounter(start: number) {\n  const [n, setN] = useState(start);\n  return { n, inc: () => setN(n + 1) };\n}\nfunction A() { return <b>{useCounter(1).n}</b>; }\nfunction B() { return <i>{useCounter(5).n}</i>; }\nconsole.log(renderToStaticMarkup(<><A /><B /></>));"),
        stdout: "<b>1</b><i>5</i>",
      },
      setup: [{ t: "tag", actor: "hero", text: "A", value: "1" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "B", value: "5" }],
      win: [{ t: "print", text: "<b>1</b><i>5</i>" }],
    },
    {
      kind: "type",
      hint: L("The linter spots hooks by a short prefix that useState and useEffect share.", "El linter reconoce los hooks por un prefijo corto que comparten useState y useEffect.", "lint は useState と useEffect に共通の短い接頭辞でフックを見分ける。"),
      note: "custom-hooks",
      prompt: L("A custom hook's name starts with…", "El nombre de un hook propio empieza con…", "カスタムフックの名前の先頭は…"),
      code: "function ___Toggle(start: boolean) {\n  const [on, setOn] = useState(start);\n  return [on, () => setOn(!on)] as const;\n}",
      answer: "use",
      explain: L(
        "The use prefix tells React and the linter that the function calls hooks, so the rules of hooks apply inside it.",
        "El prefijo use le dice a React y al linter que la función llama hooks, así que las reglas aplican dentro.",
        "use で始めると、フックを呼ぶ関数だと React と lint に伝わり、ルールが適用されるよ。",
      ),
      check: { compiles: true, program: prog("function useToggle(start: boolean) {\n  const [on, setOn] = useState(start);\n  return [on, () => setOn(!on)] as const;\n}") },
      win: [{ t: "item", kind: "scroll", holder: "hero" }],
    },
    {
      kind: "order",
      hint: L("State first, then the effect. Inside it, start the timer before returning its cleanup.", "Primero el estado, luego el efecto. Dentro, inicia el timer antes de devolver la limpieza.", "まず state、次に副作用。中ではタイマー開始の後に片付けを返す。"),
      note: "custom-hooks",
      prompt: L("Build useDebouncedValue", "Arma useDebouncedValue", "useDebouncedValue を組み立てよう"),
      lines: [
        "function useDebouncedValue(value: string, ms: number) {",
        "  const [v, setV] = useState(value);",
        "  useEffect(() => {",
        "    const t = setTimeout(() => setV(value), ms);",
        "    return () => clearTimeout(t);",
        "  }, [value, ms]);",
        "  return v;",
        "}",
      ],
      explain: L(
        "State first, then an effect that waits ms before copying value; the cleanup cancels the timer if value changes sooner.",
        "Primero el estado, luego un efecto que espera ms antes de copiar value; la limpieza cancela el timer si value cambia antes.",
        "まず state、次に ms 待って value を写す副作用。早く変わればクリーンアップでタイマーを止める。",
      ),
      check: {
        compiles: true,
        program: prog("function useDebouncedValue(value: string, ms: number) {\n  const [v, setV] = useState(value);\n  useEffect(() => {\n    const t = setTimeout(() => setV(value), ms);\n    return () => clearTimeout(t);\n  }, [value, ms]);\n  return v;\n}"),
      },
    },
    {
      kind: "run",
      hint: L("Look at useState inside useToggle: does it use the value passed in?", "Mira el useState dentro de useToggle: ¿usa el valor que recibe?", "useToggle の中の useState を見よう。渡された値を使っている？"),
      note: "custom-hooks",
      prompt: L("Both lamps show OFF. Make useToggle use its argument", "Las dos lámparas dicen OFF. Usa el argumento", "両方 OFF。引数を使おう"),
      starter:
        'import React, { useState } from "react";\nimport { renderToStaticMarkup } from "react-dom/server";\nfunction useToggle(initial: boolean) {\n  const [on, setOn] = useState(false);\n  return [on, () => setOn((o) => !o)] as const;\n}\nfunction Lamps() {\n  const [a] = useToggle(true);\n  const [b] = useToggle(false);\n  return <p>{a ? "ON" : "OFF"}-{b ? "ON" : "OFF"}</p>;\n}\nconsole.log(renderToStaticMarkup(<Lamps />));',
      solution:
        'import React, { useState } from "react";\nimport { renderToStaticMarkup } from "react-dom/server";\nfunction useToggle(initial: boolean) {\n  const [on, setOn] = useState(initial);\n  return [on, () => setOn((o) => !o)] as const;\n}\nfunction Lamps() {\n  const [a] = useToggle(true);\n  const [b] = useToggle(false);\n  return <p>{a ? "ON" : "OFF"}-{b ? "ON" : "OFF"}</p>;\n}\nconsole.log(renderToStaticMarkup(<Lamps />));',
      expect: "<p>ON-OFF</p>",
      fallback: ["useState\\(\\s*initial\\s*\\)", "useState<boolean>\\(\\s*initial\\s*\\)"],
      explain: L(
        "The hook ignored initial and always started at false. useState(initial) gives each call its own starting value.",
        "El hook ignoraba initial y siempre empezaba en false. useState(initial) da a cada llamada su propio valor inicial.",
        "フックが initial を無視して常に false だった。useState(initial) で呼び出しごとの初期値になるよ。",
      ),
    },
  ],
  notes: hooksNotes,
};

// ─── 4.4 Suspense, lazy, error boundaries, transitions ──────────────────────
const LAZY_DECL = "const Chart = lazy(() => new Promise<{ default: React.ComponentType }>(() => {}));\n";

const suspenseNotes: NoteDef[] = [
  note("suspense", L("Suspense and lazy", "Suspense y lazy", "Suspense と lazy"),
    p(
      "Some parts of the screen aren't ready yet: code loaded with lazy, or data read with use(promise). Such a component suspends: it tells React \"not yet\". React then looks up for the nearest <Suspense> and shows its fallback in that spot until the component is ready.",
      "Algunas partes de la pantalla aún no están listas: código cargado con lazy o datos leídos con use(promise). Ese componente se suspende: le dice a React \"todavía no\". React busca hacia arriba el <Suspense> más cercano y muestra su fallback en ese lugar hasta que el componente esté listo.",
      "画面の一部はまだ準備できていないことがある。lazy で読み込むコードや use(promise) で読むデータだ。そうした部品は「まだ」と React に伝えて中断する。React は上で一番近い <Suspense> を探し、準備できるまでその場所にフォールバックを出す。",
    ),
    ex('console.log(renderToStaticMarkup(\n  <Suspense fallback={<b>wait</b>}>\n    <i>done</i>\n  </Suspense>\n));', "<i>done</i>",
      L("Nothing suspends: children render, Suspense adds no HTML", "Nada se suspende: los hijos salen y Suspense no añade HTML", "中断なし：子が描かれ Suspense 自体は何も出さない")),
    p(
      "If nothing inside suspends, the fallback never appears and Suspense itself adds no HTML. If a child suspends, the fallback takes the place of the whole boundary. A promise that never resolves keeps the fallback forever.",
      "Si nada dentro se suspende, el fallback nunca aparece y Suspense no añade HTML. Si un hijo se suspende, el fallback ocupa el lugar de todo el boundary. Una promesa que nunca se resuelve deja el fallback para siempre.",
      "中で何も中断しなければフォールバックは出ず、Suspense 自体も HTML を足さない。子が中断すると、境界全体の代わりにフォールバックが出る。解決しない Promise ならフォールバックがずっと出たままだ。",
    ),
    ex('const pending = new Promise<number>(() => {});\nfunction Score() {\n  return <i>{use(pending)}</i>;\n}\nconsole.log(renderToStaticMarkup(\n  <Suspense fallback={<b>wait</b>}><Score /></Suspense>\n));', "<b>wait</b>",
      L("use() waits for the promise, so the fallback shows", "use() espera la promesa, así que sale el fallback", "use() が Promise を待つのでフォールバックが出る")),
    p(
      "With no Suspense anywhere above a suspending component, there is nothing to show instead, and a synchronous render like renderToStaticMarkup throws an error. Every component that can suspend needs a boundary somewhere above it.",
      "Sin ningún Suspense encima de un componente que se suspende, no hay nada que mostrar en su lugar, y un render síncrono como renderToStaticMarkup lanza un error. Todo componente que pueda suspenderse necesita un boundary en algún lugar de arriba.",
      "中断する部品の上にどこにも Suspense がないと、代わりに出すものがなく、renderToStaticMarkup のような同期レンダーはエラーを投げる。中断しうる部品には、上のどこかに境界が必要だ。",
    ),
    p(
      "lazy(() => import(...)) creates a component type that loads its code on first use. Call it once at the top level of a module. Inside a component body it would run on every render and create a NEW component type each time, so React would throw away its state and reload it again and again.",
      "lazy(() => import(...)) crea un tipo de componente que carga su código la primera vez que se usa. Llámalo una vez en el nivel superior del módulo. Dentro del cuerpo de un componente correría en cada render y crearía un tipo NUEVO cada vez, así React descartaría su estado y lo recargaría una y otra vez.",
      "lazy(() => import(...)) は初めて使うときにコードを読み込む部品の型を作る。モジュールのトップレベルで一度だけ呼ぼう。部品の本体の中だと毎回のレンダーで新しい型ができ、React は state を捨てて何度も読み込み直してしまう。",
    ),
    tc('declare function loadMap(): Promise<{ default: React.ComponentType }>;\nconst WorldMap = lazy(() => loadMap());\nfunction Trip() {\n  return <Suspense fallback={<p>...</p>}><WorldMap /></Suspense>;\n}',
      L("lazy at module level, used inside a Suspense", "lazy en el nivel del módulo, usado dentro de un Suspense", "lazy はモジュール直下、使うのは Suspense の中")),
  ),
  note("error-boundaries", L("Error boundaries", "Error boundaries", "エラー境界"),
    p(
      "If a component throws while rendering, React would unmount the whole tree and leave a blank screen. An error boundary is a safety net around part of the tree: when a child throws during render, the boundary catches it and shows a fallback instead, while the rest of the app keeps working.",
      "Si un componente lanza un error al renderizar, React desmontaría todo el árbol y dejaría la pantalla en blanco. Un error boundary es una red de seguridad alrededor de una parte del árbol: cuando un hijo lanza al renderizar, el boundary lo atrapa y muestra un fallback, y el resto de la app sigue funcionando.",
      "レンダー中に部品がエラーを投げると、React はツリー全体を外して白い画面にしてしまう。エラー境界はツリーの一部を守るセーフティネット。子がレンダー中に投げたエラーを捕まえてフォールバックを出し、アプリの他の部分は動き続ける。",
    ),
    p(
      "There is no hook for this. A boundary is a class component with static getDerivedStateFromError, which returns the state that switches to the fallback, and optionally componentDidCatch for logging. Many apps use a small library wrapper so they don't write the class by hand.",
      "No hay un hook para esto. Un boundary es un componente de clase con static getDerivedStateFromError, que devuelve el estado que cambia al fallback, y opcionalmente componentDidCatch para registrar el error. Muchas apps usan una pequeña librería para no escribir la clase a mano.",
      "これ専用のフックはない。エラー境界はクラスコンポーネントで、フォールバックに切り替える state を返す static getDerivedStateFromError と、記録用の componentDidCatch（任意）を持つ。手で書かずに小さなライブラリを使うアプリも多い。",
    ),
    tc('class Net extends Component<{ children: ReactNode }, { broken: boolean }> {\n  state = { broken: false };\n  static getDerivedStateFromError() {\n    return { broken: true };\n  }\n  render() {\n    return this.state.broken ? <p>Try again</p> : this.props.children;\n  }\n}',
      L("A minimal boundary: a class that switches to a fallback", "Un boundary mínimo: una clase que cambia al fallback", "最小のエラー境界：フォールバックに切り替えるクラス")),
    p(
      "Boundaries only catch errors thrown while rendering (and in lifecycle methods). An error inside an event handler, a setTimeout or a promise happens later, outside rendering, so the boundary never sees it. Handle those with try/catch where they happen.",
      "Los boundaries solo atrapan errores lanzados al renderizar (y en métodos del ciclo de vida). Un error dentro de un manejador de eventos, un setTimeout o una promesa ocurre después, fuera del render, así que el boundary nunca lo ve. Manéjalos con try/catch donde ocurren.",
      "境界が捕まえるのはレンダー中（とライフサイクルメソッド）のエラーだけ。イベントハンドラや setTimeout、Promise の中のエラーはレンダーの外で後から起きるので、境界には見えない。起きる場所で try/catch しよう。",
    ),
    tc('function SaveButton({ save }: { save: () => void }) {\n  function onClick() {\n    try {\n      save();\n    } catch {\n      console.log("save failed");\n    }\n  }\n  return <button onClick={onClick}>Save</button>;\n}',
      L("Handler errors need their own try/catch", "Los errores de manejadores necesitan su propio try/catch", "ハンドラのエラーは自分で try/catch")),
  ),
  note("transitions", L("Transitions keep typing snappy", "Las transiciones agilizan la escritura", "トランジションで入力を軽く"),
    p(
      "By default every state update is urgent: React finishes it before handling anything else. If one keystroke also re-renders a huge list, typing starts to lag. startTransition(() => setSomething(...)) marks the updates inside it as non-urgent, so React can pause or drop that work when a new keystroke arrives.",
      "Por defecto cada actualización de estado es urgente: React la termina antes de atender otra cosa. Si una tecla también re-renderiza una lista enorme, escribir empieza a ir lento. startTransition(() => setAlgo(...)) marca las actualizaciones de dentro como no urgentes, así React puede pausar o descartar ese trabajo cuando llega otra tecla.",
      "ふつう state の更新はすべて急ぎで、React は他の処理より先に終わらせる。1回のキー入力で巨大なリストも再レンダーすると、入力がもたつく。startTransition(() => setXxx(...)) は中の更新を急ぎでないと印をつけ、新しいキー入力が来たらその処理を中断・破棄できるようにする。",
    ),
    tc('declare function filterSongs(q: string): string[];\nfunction Songs() {\n  const [text, setText] = useState("");\n  const [songs, setSongs] = useState<string[]>([]);\n  function onChange(next: string) {\n    setText(next);\n    startTransition(() => setSongs(filterSongs(next)));\n  }\n  return <input value={text} onChange={(e) => onChange(e.target.value)} />;\n}',
      L("The input updates at once; the song list can wait", "El input se actualiza ya; la lista puede esperar", "入力はすぐ更新、曲リストは後回しでいい")),
    p(
      "Keep the input's own value OUTSIDE the transition: what the user types must appear immediately. Only the expensive result goes inside. If you also want a loading hint, useTransition gives you [isPending, startTransition].",
      "Deja el valor del propio input FUERA de la transición: lo que el usuario escribe debe aparecer de inmediato. Solo el resultado costoso va dentro. Si además quieres un indicador de carga, useTransition te da [isPending, startTransition].",
      "入力欄そのものの値はトランジションの外に置く。打った文字はすぐに表示されないといけない。中に入れるのは重い結果だけ。読み込み中の表示も欲しければ、useTransition が [isPending, startTransition] をくれる。",
    ),
    p(
      "Don't confuse the tools: useMemo caches a computed value, lazy splits code so it loads later, and startTransition changes the priority of a state update. Common mistake: wrapping the input's setState in a transition, which makes typing feel worse, not better.",
      "No confundas las herramientas: useMemo guarda un valor calculado, lazy divide el código para cargarlo después y startTransition cambia la prioridad de una actualización de estado. Error común: meter el setState del input en una transición, lo que hace que escribir se sienta peor, no mejor.",
      "道具を混同しないこと。useMemo は計算した値のキャッシュ、lazy はコードを分けて後で読み込む、startTransition は state 更新の優先度を変える。よくあるミス：入力欄の setState をトランジションに入れること。かえって入力が重く感じる。",
    ),
  ),
  note("use-client", L("\"use client\" and server components", "\"use client\" y componentes de servidor", "\"use client\" とサーバー部品"),
    p(
      "Frameworks with React Server Components, like the Next.js App Router, render components on the server by default. Server components can read files or databases directly, but they can't hold state, run effects or handle clicks, because none of that exists on the server.",
      "Los frameworks con React Server Components, como el App Router de Next.js, renderizan los componentes en el servidor por defecto. Los componentes de servidor pueden leer archivos o bases de datos directamente, pero no pueden tener estado, correr efectos ni manejar clics, porque nada de eso existe en el servidor.",
      "Next.js の App Router のように React Server Components を使うフレームワークでは、部品はふつうサーバーで描かれる。サーバー部品はファイルやデータベースを直接読めるが、state も副作用もクリック処理も使えない。サーバーにはそれがないからだ。",
    ),
    p(
      "The directive \"use client\" as the very first line of a file marks it, and everything it imports, as client code: it ships to the browser and may use useState, effects and handlers. It's a plain string, written before any import.",
      "La directiva \"use client\" como primerísima línea de un archivo lo marca, junto con todo lo que importa, como código cliente: se envía al navegador y puede usar useState, efectos y manejadores. Es un string simple, escrito antes de cualquier import.",
      "ファイルの一番最初の行に書く \"use client\" は、そのファイルと読み込むものすべてをクライアントのコードにする。ブラウザに送られ、useState や副作用、ハンドラが使える。ただの文字列で、どの import よりも前に書く。",
    ),
    { t: "code", code: '"use client";\nexport function LikeButton() {\n  const [likes, setLikes] = useState(0);\n  return <button onClick={() => setLikes(likes + 1)}>♥ {likes}</button>;\n}', caption: L("Interactive, so this file is a client component", "Es interactivo, así que este archivo es cliente", "操作できるのでクライアント部品にする"), check: { program: '"use client";\n' + H + 'export function LikeButton() {\n  const [likes, setLikes] = useState(0);\n  return <button onClick={() => setLikes(likes + 1)}>♥ {likes}</button>;\n}', compiles: true } },
    p(
      "Server components can render client components, so put \"use client\" only on the interactive leaves, like buttons and forms, and keep the rest on the server. Common mistake: thinking client components render only in the browser; they are still pre-rendered to HTML on the server first.",
      "Los componentes de servidor pueden renderizar componentes cliente, así que pon \"use client\" solo en las hojas interactivas, como botones y formularios, y deja el resto en el servidor. Error común: creer que los componentes cliente solo se renderizan en el navegador; también se pre-renderizan a HTML en el servidor primero.",
      "サーバー部品はクライアント部品を描けるので、\"use client\" はボタンやフォームなど操作する末端だけにつけ、残りはサーバーに置こう。よくあるミス：クライアント部品はブラウザでしか描かれないと思うこと。最初はサーバーで HTML に事前レンダーされる。",
    ),
  ),
];

const suspenseAndBoundaries: LessonDef = {
  slug: "suspense-and-boundaries",
  title: L("Curtains and safety nets", "Telones y redes", "幕とセーフティネット"),
  concept: "suspense_boundaries",
  mode: "lesson",
  xp: 85,
  enemy: "typescript/undefined-ghost",
  enemyName: L("LOADING PHANTOM", "FANTASMA CARGA", "読み込み亡霊"),
  beats: [
    say(L(
      "Some parts arrive late: code split with lazy, or data read with use(promise). Suspense drops a curtain with a fallback until they're ready.",
      "Algo llega tarde: código dividido con lazy o datos leídos con use(promise). Suspense baja un telón con fallback hasta que lleguen.",
      "遅れて届く部品もある。lazy で分けたコードや use(promise) のデータだ。Suspense は準備できるまで幕を下ろすよ。",
    )),
    {
      kind: "act",
      prompt: L("Drop the curtain while the chart loads", "Baja el telón mientras carga el gráfico", "グラフの読み込み中は幕を下ろそう"),
      setup: [],
      steps: [
        { label: L("LAZY", "LAZY", "lazy"), line: 'const Chart = lazy(() => import("./Chart"));', effects: [{ t: "item", kind: "scroll", holder: "ally" }, { t: "enter", actor: "ally" }, { t: "say", actor: "ally", text: L("On my way...", "Ya voy...", "今向かってる…") }] },
        { label: L("CURTAIN", "TELÓN", "幕"), line: "<Suspense fallback={<p>Loading...</p>}>", effects: [{ t: "banner", text: L("LOADING...", "CARGANDO...", "読み込み中…") }], output: "<p>Loading...</p>" },
        { label: L("ACTOR", "ACTOR", "役者"), line: "  <Chart />", effects: [{ t: "wait", ms: 400 }, { t: "give", to: "hero" }] },
        { label: L("CLOSE", "CERRAR", "閉じる"), line: "</Suspense>", effects: [{ t: "say", actor: "hero", text: L("Chart is here!", "¡Llegó el gráfico!", "グラフ到着！") }] },
      ],
    },
    {
      kind: "predict",
      hint: L("The fallback is for children that aren't ready. Is anything here waiting?", "El fallback es para hijos que no están listos. ¿Algo aquí está esperando?", "フォールバックは準備中の子のため。ここで待っているものはある？"),
      note: "suspense",
      prompt: L("Nothing suspends. What prints?", "Nada se suspende. ¿Qué imprime?", "何も中断しない。何が表示される？"),
      code: 'console.log(renderToStaticMarkup(\n  <Suspense fallback={<p>Loading</p>}>\n    <p>Ready</p>\n  </Suspense>\n));',
      options: ["<p>Ready</p>", "<p>Loading</p>", "<p>Loading</p><p>Ready</p>"],
      answer: 0,
      output: "<p>Ready</p>",
      explain: L(
        "The fallback only shows while a child suspends. Ready children render normally, and Suspense adds no markup.",
        "El fallback solo aparece mientras un hijo se suspende. Los hijos listos se renderizan normal y Suspense no agrega HTML.",
        "フォールバックは子が中断している間だけ。準備済みなら普通に描画され、Suspense 自体は何も出さない。",
      ),
      check: { compiles: true, program: prog('console.log(renderToStaticMarkup(\n  <Suspense fallback={<p>Loading</p>}>\n    <p>Ready</p>\n  </Suspense>\n));'), stdout: "<p>Ready</p>" },
      win: [{ t: "print", text: "<p>Ready</p>" }],
    },
    {
      kind: "predict",
      hint: L("use(promise) waits for the promise. Will this one resolve? Who shows something meanwhile?", "use(promise) espera la promesa. ¿Esta se resolverá? ¿Quién muestra algo mientras?", "use(promise) は解決を待つ。これは解決する？その間は誰が何を出す？"),
      note: "suspense",
      prompt: L("The promise never resolves. What prints?", "La promesa nunca se resuelve. ¿Qué imprime?", "Promise は解決しない。何が出る？"),
      code: "const never = new Promise<string>(() => {});\nfunction Data() {\n  return <p>{use(never)}</p>;\n}\nconsole.log(renderToStaticMarkup(\n  <Suspense fallback={<p>Loading</p>}><Data /></Suspense>\n));",
      options: ["<p>Loading</p>", "<p></p>", "<p>undefined</p>"],
      answer: 0,
      output: "<p>Loading</p>",
      explain: L(
        "use(promise) suspends Data until the promise resolves, so the nearest Suspense shows its fallback.",
        "use(promise) suspende a Data hasta que la promesa se resuelva, así que el Suspense más cercano muestra su fallback.",
        "use(promise) は解決まで Data を中断させる。だから一番近い Suspense のフォールバックが出るよ。",
      ),
      check: {
        compiles: true,
        program: prog("const never = new Promise<string>(() => {});\nfunction Data() {\n  return <p>{use(never)}</p>;\n}\nconsole.log(renderToStaticMarkup(\n  <Suspense fallback={<p>Loading</p>}><Data /></Suspense>\n));"),
        stdout: "<p>Loading</p>",
      },
      setup: [{ t: "banner", text: L("LOADING...", "CARGANDO...", "読み込み中…") }],
      win: [{ t: "print", text: "<p>Loading</p>" }],
    },
    {
      kind: "predict",
      hint: L("This line runs on every render of Page. What does React see if the type is new each time?", "Esta línea corre en cada render de Page. ¿Qué ve React si el tipo es nuevo cada vez?", "この行は Page のレンダーごとに動く。型が毎回新しいと React には？"),
      note: "suspense",
      prompt: L("What's wrong with this lazy?", "¿Qué tiene de malo este lazy?", "この lazy の問題は？"),
      code: "function Page() {\n  const Chart = lazy(() => loadChart());\n  return <Chart />;\n}",
      options: [
        L("Call lazy at module top level", "lazy va en el nivel del módulo", "lazy はモジュール直下で呼ぶ"),
        L("Nothing, it's fine", "Nada, está bien", "問題ない"),
      ],
      answer: 0,
      explain: L(
        "Inside the body, every render creates a NEW component type, so React throws away its state. Declare lazy once, at the top.",
        "Dentro del cuerpo, cada render crea un tipo de componente NUEVO y React descarta su estado. Declara lazy una vez, arriba.",
        "本体内だと毎回新しい型ができ、state が捨てられる。lazy はトップレベルで一度だけ。",
      ),
      check: { compiles: true, program: prog("declare function loadChart(): Promise<{ default: React.ComponentType }>;\nfunction Page() {\n  const Chart = lazy(() => loadChart());\n  return <Chart />;\n}") },
    },
    say(L(
      "A safety net: an error boundary catches errors thrown while its children RENDER and shows a fallback instead of a blank screen.",
      "Una red de seguridad: un error boundary atrapa errores lanzados mientras sus hijos se RENDERIZAN y muestra un fallback.",
      "セーフティネット：エラー境界は子のレンダー中のエラーを捕まえ、白い画面の代わりにフォールバックを出す。",
    )),
    {
      kind: "predict",
      hint: L("Boundaries watch rendering. Does an onClick run while rendering, or later?", "Los boundaries vigilan el render. ¿Un onClick corre mientras se renderiza o después?", "境界はレンダーを見張る。onClick はレンダー中に動く？後で？"),
      note: "error-boundaries",
      prompt: L("Which error does the boundary catch?", "¿Qué error atrapa el boundary?", "境界が捕まえるエラーは？"),
      code: "<ErrorBoundary fallback={<p>Oops</p>}>\n  <Profile />\n</ErrorBoundary>",
      options: [
        L("A throw while Profile renders", "Un throw al renderizar Profile", "Profile のレンダー中の throw"),
        L("A throw inside an onClick", "Un throw dentro de un onClick", "onClick の中の throw"),
      ],
      answer: 0,
      explain: L(
        "Boundaries catch render errors. Errors in event handlers or async code are not caught: use try/catch there.",
        "Los boundaries atrapan errores de render. Los de manejadores de eventos o código async no: usa try/catch ahí.",
        "境界はレンダー中のエラーだけ。イベントハンドラや非同期処理は try/catch で扱おう。",
      ),
      check: { compiles: true, program: prog(`${BOUNDARY}function Profile() {\n  return <p>Ada</p>;\n}\nconst app = (\n  <ErrorBoundary fallback={<p>Oops</p>}>\n    <Profile />\n  </ErrorBoundary>\n);`) },
      setup: [{ t: "item", kind: "shield", holder: "hero" }],
      win: [{ t: "say", actor: "hero", text: L("Caught it!", "¡Atrapado!", "キャッチ！") }],
    },
    {
      kind: "predict",
      hint: L("Look at the keyword static and the method name. There is no hook for this.", "Mira la palabra static y el nombre del método. No hay hook para esto.", "static というキーワードとメソッド名を見よう。専用フックはない。"),
      note: "error-boundaries",
      prompt: L("Error boundaries are written as…", "Los error boundaries se escriben como…", "エラー境界の書き方は…"),
      code: "static getDerivedStateFromError() {\n  return { failed: true };\n}",
      options: [
        L("Class components", "Componentes de clase", "クラスコンポーネント"),
        L("Function components with a hook", "Funciones con un hook", "フック付きの関数"),
      ],
      answer: 0,
      explain: L(
        "There is no hook for it: a boundary is a class with getDerivedStateFromError or componentDidCatch (or a library wrapper).",
        "No hay hook para esto: un boundary es una clase con getDerivedStateFromError o componentDidCatch (o una librería).",
        "専用のフックはない。getDerivedStateFromError などを持つクラスで書く（またはライブラリ）。",
      ),
      check: { compiles: true, program: prog(BOUNDARY) },
    },
    say(L(
      "Typing feels slow when a huge list re-renders on each key. startTransition marks that update as non-urgent so typing stays snappy.",
      "Escribir se siente lento si una lista enorme se re-renderiza en cada tecla. startTransition marca esa actualización como no urgente.",
      "キー入力ごとに巨大リストが再レンダーすると重い。startTransition でその更新を急ぎでないと示そう。",
    )),
    {
      kind: "pick",
      hint: L("Typing stays urgent. Which option marks the results update as non-urgent?", "La escritura sigue urgente. ¿Qué opción marca la actualización de resultados como no urgente?", "入力は急ぎのまま。結果の更新を急ぎでないと示すのは？"),
      note: "transitions",
      prompt: L("Keep typing responsive", "Mantén la escritura fluida", "入力をなめらかに保とう"),
      code: "function onType(text: string) {\n  setQuery(text);\n  ___(() => setResults(search(text)));\n}",
      options: ["startTransition", "useMemo", "lazy"],
      answer: 0,
      explain: L(
        "The input update stays urgent; the results update inside startTransition can be interrupted by the next key.",
        "La actualización del input sigue urgente; la de resultados dentro de startTransition puede interrumpirse con la siguiente tecla.",
        "入力の更新は急ぎのまま。startTransition 内の結果更新は次のキーで中断できるよ。",
      ),
      check: {
        compiles: true,
        program: prog(
          'declare function search(q: string): string[];\nfunction Search() {\n  const [query, setQuery] = useState("");\n  const [results, setResults] = useState<string[]>([]);\n  function onType(text: string) {\n    setQuery(text);\n    startTransition(() => setResults(search(text)));\n  }\n  return <input value={query} onChange={(e) => onType(e.target.value)} />;\n}',
        ),
      },
      win: [{ t: "say", actor: "hero", text: L("Smooth typing!", "¡Fluido!", "サクサク！") }],
    },
    {
      kind: "type",
      hint: L("Server components can't hold state. The directive names the other kind of component.", "Los componentes de servidor no tienen estado. La directiva nombra el otro tipo de componente.", "サーバー部品は state を持てない。指示文はもう一方の部品の名前。"),
      note: "use-client",
      prompt: L("Mark this file as a client component", "Marca el archivo como componente cliente", "クライアントコンポーネントにしよう"),
      code: '"use ___";\nexport function Counter() {\n  const [n, setN] = useState(0);\n  return <button onClick={() => setN(n + 1)}>{n}</button>;\n}',
      answer: "client",
      explain: L(
        "Server components can't hold state. \"use client\" at the top of the file marks where interactive client components start.",
        "Los componentes de servidor no tienen estado. \"use client\" arriba del archivo marca dónde empiezan los componentes cliente.",
        "サーバーコンポーネントは state を持てない。先頭の \"use client\" がクライアント側の境目だよ。",
      ),
      check: { compiles: true, program: `"use client";\n${H}export function Counter() {\n  const [n, setN] = useState(0);\n  return <button onClick={() => setN(n + 1)}>{n}</button>;\n}` },
      win: [{ t: "banner", text: L("CLIENT", "CLIENTE", "クライアント") }],
    },
    {
      kind: "run",
      hint: L("Something above Chart must catch its suspend and show the Loading paragraph.", "Algo encima de Chart debe atrapar su suspensión y mostrar el párrafo Loading.", "Chart の上で中断を受け止め、Loading の段落を出すものが必要。"),
      note: "suspense",
      prompt: L("Chart is still loading and the render crashes. Add a curtain", "Chart aún carga y el render falla. Pon un telón", "読み込み中で落ちる。幕を足そう"),
      starter:
        `import React, { lazy, Suspense } from "react";\nimport { renderToStaticMarkup } from "react-dom/server";\n// A module that is still loading:\n${LAZY_DECL}// Wrap it in Suspense with fallback <p>Loading...</p>\nconsole.log(renderToStaticMarkup(<Chart />));`,
      solution:
        `import React, { lazy, Suspense } from "react";\nimport { renderToStaticMarkup } from "react-dom/server";\n// A module that is still loading:\n${LAZY_DECL}// Wrap it in Suspense with fallback <p>Loading...</p>\nconsole.log(renderToStaticMarkup(\n  <Suspense fallback={<p>Loading...</p>}><Chart /></Suspense>\n));`,
      expect: "<p>Loading...</p>",
      fallback: ["<Suspense\\s+fallback=\\{\\s*<p>Loading\\.\\.\\.</p>\\s*\\}\\s*>"],
      explain: L(
        "A component that suspends with no Suspense above makes the render fail. A boundary shows its fallback instead.",
        "Un componente que se suspende sin Suspense arriba hace fallar el render. Un boundary muestra su fallback en su lugar.",
        "上に Suspense がないまま中断するとレンダーが失敗する。境界があればフォールバックが出るよ。",
      ),
    },
  ],
  notes: suspenseNotes,
};

// ─── 4.5 Boss: the Render Overlord ──────────────────────────────────────────
const overlordNotes: NoteDef[] = [
  note("recap-rerenders", L("Recap: what re-renders a component", "Repaso: qué re-renderiza", "復習：再レンダーの原因"),
    p(
      "A component re-renders when its own state changes, when its parent re-renders, or when a context it reads changes. Writing ref.current is silent: the value is kept, but React isn't told, so nothing re-renders. Use state for anything the screen shows, refs for things it doesn't.",
      "Un componente se re-renderiza cuando cambia su propio estado, cuando su padre se re-renderiza o cuando cambia un contexto que lee. Escribir ref.current es silencioso: el valor se guarda, pero React no se entera y nada se re-renderiza. Usa estado para lo que se ve en pantalla y refs para lo que no.",
      "部品が再レンダーするのは、自分の state が変わったとき、親が再レンダーしたとき、読むコンテキストが変わったとき。ref.current への書き込みは静かで、値は残るが React に伝わらず再レンダーしない。画面に出るものは state、出ないものは ref に。",
    ),
    tc('function Stopwatch() {\n  const started = useRef<number | null>(null);\n  const [laps, setLaps] = useState(0);\n  function start() { started.current = Date.now(); }\n  function lap() { setLaps(laps + 1); }\n  return <button onClick={start} onDoubleClick={lap}>{laps}</button>;\n}',
      L("Writing started.current is silent; setLaps re-renders", "Escribir started.current es silencioso; setLaps re-renderiza", "started.current は静か、setLaps は再レンダー")),
    p(
      "React keeps a component's state between renders as long as the same component type stays in the same position with the same key. Change the key and React treats it as a different component: the old one and its state are thrown away and a fresh one mounts.",
      "React conserva el estado de un componente entre renders mientras el mismo tipo siga en la misma posición con la misma key. Si cambias la key, React lo trata como otro componente: descarta el viejo con su estado y monta uno nuevo.",
      "同じ型の部品が同じ位置に同じ key でいる限り、React はレンダー間で state を保つ。key を変えると別の部品として扱われ、古い部品は state ごと捨てられて新しいものがマウントされる。",
    ),
  ),
  note("recap-memo", L("Recap: sameness and memoization", "Repaso: identidad y memoización", "復習：同一性とメモ化"),
    p(
      "React compares props, dependencies and context values with Object.is. Objects, arrays and functions created during render are new every time, even with the same body. memo skips a child only when every prop is the same; useMemo caches a value and useCallback caches a function until a dependency changes.",
      "React compara props, dependencias y valores de contexto con Object.is. Los objetos, arreglos y funciones creados al renderizar son nuevos cada vez, aunque tengan el mismo cuerpo. memo salta a un hijo solo si cada prop es la misma; useMemo guarda un valor y useCallback una función hasta que cambia una dependencia.",
      "React は props・依存配列・コンテキストの値を Object.is で比べる。レンダー中に作るオブジェクト・配列・関数は、中身が同じでも毎回新品。memo は props が全部同じときだけ子をスキップし、useMemo は値を、useCallback は関数を依存が変わるまで保存する。",
    ),
    ex('const pick = () => 1;\nconst again = () => 1;\nconsole.log(pick === again, [pick].includes(pick));', "false true",
      L("Same body, two functions; only the same one matches", "Mismo cuerpo, dos funciones; solo la misma coincide", "中身が同じでも別の関数。同じものだけ一致")),
    p(
      "Memoizing has a cost, so skip it for cheap work. The React Compiler can add memoization automatically when the project is built, so plain code often needs no manual useMemo or useCallback at all.",
      "Memoizar tiene un costo, así que evítalo en trabajo barato. El React Compiler puede añadir memoización automáticamente al compilar el proyecto, así que el código simple a menudo no necesita useMemo ni useCallback a mano.",
      "メモ化にはコストがあるので、軽い処理には使わない。React Compiler はプロジェクトのビルド時に自動でメモ化を加えられるので、普通のコードなら手動の useMemo や useCallback が要らないことも多い。",
    ),
  ),
  note("recap-context-reducer", L("Recap: context and reducers", "Repaso: contexto y reducers", "復習：コンテキストとリデューサー"),
    p(
      "useContext reads the nearest provider above the component, and the createContext default when there is none. A reducer is a pure (state, action) => next function: it ends with a default branch that returns the state unchanged, and with a union of action types TypeScript rejects an action missing a required field.",
      "useContext lee el proveedor más cercano por encima del componente, y el valor por defecto de createContext si no hay ninguno. Un reducer es una función pura (state, action) => siguiente: termina con una rama default que devuelve el estado sin cambios, y con una unión de tipos de acción TypeScript rechaza una acción a la que le falta un campo.",
      "useContext は部品の上で一番近いプロバイダを読み、なければ createContext の既定値。リデューサーは純粋な (state, action) => 次 の関数で、最後は状態をそのまま返す default。action をユニオン型にすれば、必須の項目が欠けた action を TypeScript が拒否する。",
    ),
    ex('const Unit = createContext("kg");\nfunction W() {\n  return <b>{useContext(Unit)}</b>;\n}\nconsole.log(renderToStaticMarkup(<><W /><Unit value="lb"><W /></Unit></>));', "<b>kg</b><b>lb</b>",
      L("Outside any provider: the default. Inside: the provider's value", "Fuera de un proveedor: el valor por defecto. Dentro: el suyo", "プロバイダの外は既定値、中はその値")),
  ),
  note("recap-hooks-suspense", L("Recap: hook rules and Suspense", "Repaso: reglas de hooks y Suspense", "復習：フックのルールと Suspense"),
    p(
      "Hooks must run in the same order on every render, so call them at the top level, above any early return, never inside conditions, loops or handlers. React matches each hook to its state by call position.",
      "Los hooks deben correr en el mismo orden en cada render, así que llámalos en el nivel superior, antes de cualquier return temprano, nunca dentro de condiciones, bucles o manejadores. React asocia cada hook con su estado por la posición de la llamada.",
      "フックは毎回同じ順番で実行されなければならない。トップレベルで、早期 return より上で呼び、条件・ループ・ハンドラの中では呼ばない。React は呼び出しの位置で各フックと state を対応させる。",
    ),
    p(
      "A component that suspends (lazy code still loading, or use() on a pending promise) needs a <Suspense> boundary somewhere above it, which shows the fallback meanwhile. Without one, a synchronous render throws.",
      "Un componente que se suspende (código lazy aún cargando, o use() sobre una promesa pendiente) necesita un <Suspense> en algún lugar de arriba, que muestra el fallback mientras tanto. Sin él, un render síncrono lanza un error.",
      "中断する部品（読み込み中の lazy や、未解決の Promise への use()）には、上のどこかに <Suspense> が必要で、その間フォールバックを出す。なければ同期レンダーはエラーを投げる。",
    ),
    ex('const later = new Promise<string>(() => {});\nfunction Msg() {\n  return <p>{use(later)}</p>;\n}\nconsole.log(renderToStaticMarkup(\n  <Suspense fallback={<p>soon</p>}><Msg /></Suspense>\n));', "<p>soon</p>",
      L("The boundary catches the suspend and shows its fallback", "El boundary atrapa la suspensión y muestra su fallback", "境界が中断を受け止めフォールバックを出す")),
  ),
];

const renderOverlord: LessonDef = {
  slug: "render-overlord",
  title: L("The Render Overlord", "El Señor del Render", "レンダー大君主"),
  concept: "memoization",
  mode: "boss",
  xp: 190,
  enemy: "react/rerender-tornado",
  enemyName: L("RENDER OVERLORD", "SEÑOR DEL RENDER", "レンダー大君主"),
  beats: [
    enemySays(L(
      "At the top of my tower EVERYTHING re-renders, forever! Contexts, memos, hooks... you'll never tame them.",
      "¡En lo alto de mi torre TODO se re-renderiza, para siempre! Contextos, memos, hooks... nunca los domarás.",
      "塔の頂上では全てが永遠に再レンダー！コンテキストもメモも、フックも、お前には扱えまい。",
    )),
    {
      kind: "predict",
      hint: L("Three are signals React watches. Which one is a silent notebook?", "Tres son señales que React vigila. ¿Cuál es una libreta silenciosa?", "3つは React が見張る合図。静かな手帳はどれ？"),
      note: "recap-rerenders",
      prompt: L("Which does NOT re-render a component?", "¿Qué NO re-renderiza un componente?", "再レンダーを起こさないのは？"),
      code: "const clicks = useRef(0);\nclicks.current += 1;",
      options: [
        L("Its parent re-renders", "Su padre se re-renderiza", "親の再レンダー"),
        L("Its state changes", "Cambia su estado", "state の変化"),
        L("A context it reads changes", "Cambia un contexto que lee", "読むコンテキストの変化"),
        L("A ref it holds changes", "Cambia un ref que guarda", "持っている ref の変化"),
      ],
      answer: 3,
      time: 15,
      explain: L(
        "Changing ref.current is silent: no re-render. Parent renders, state and context changes all re-render.",
        "Cambiar ref.current es silencioso: no hay re-render. El padre, el estado y el contexto sí re-renderizan.",
        "ref.current の変更は静か。再レンダーしない。親・state・コンテキストの変化はする。",
      ),
      check: { compiles: true, program: prog("function Clicker() {\n  const clicks = useRef(0);\n  return <button onClick={() => { clicks.current += 1; }}>+</button>;\n}") },
    },
    {
      kind: "predict",
      hint: L("Same body, but is it the same function object? And f1 compared with itself?", "Mismo cuerpo, pero ¿es el mismo objeto función? ¿Y f1 comparada consigo misma?", "中身は同じでも同じ関数？f1 と f1 自身は？"),
      note: "recap-memo",
      prompt: WHAT_PRINTS,
      code: "const f1 = () => {};\nconst f2 = () => {};\nconsole.log(Object.is(f1, f2), Object.is(f1, f1));",
      options: ["false true", "true true", "false false"],
      answer: 0,
      output: "false true",
      time: 12,
      explain: L(
        "Two arrows with the same body are still two functions. That's why a fresh callback prop breaks memo.",
        "Dos flechas con el mismo cuerpo siguen siendo dos funciones. Por eso un callback nuevo rompe memo.",
        "同じ中身でも別の関数。だから新しいコールバックは memo を破るよ。",
      ),
      check: { compiles: true, stdout: "false true" },
    },
    {
      kind: "predict",
      hint: L("Start at T and walk up: which provider wraps it most closely?", "Empieza en T y sube: ¿qué proveedor lo envuelve más de cerca?", "T から上へ。一番近くで包むプロバイダは？"),
      note: "recap-context-reducer",
      prompt: WHAT_PRINTS,
      code: NEAREST,
      options: ["<p>neon</p>", "<p>dark</p>", "<p>light</p>"],
      answer: 0,
      output: "<p>neon</p>",
      time: 13,
      explain: L(
        "useContext reads the nearest provider: neon, which sits inside dark.",
        "useContext lee el proveedor más cercano: neon, que está dentro de dark.",
        "useContext は一番近いプロバイダを読む。dark の内側の neon だ。",
      ),
      check: { compiles: true, program: prog(NEAREST), stdout: "<p>neon</p>" },
    },
    {
      kind: "predict",
      hint: L("Check every field the \"add\" member of the union requires.", "Revisa cada campo que exige el miembro \"add\" de la unión.", "ユニオンの \"add\" に必要な項目を全部確かめよう。"),
      note: "recap-context-reducer",
      prompt: COMPILES,
      code: TYPED_ACTION,
      options: [YES, L("No: n is missing", "No: falta n", "いいえ：n がない")],
      answer: 1,
      time: 13,
      explain: L(
        "The \"add\" member of the union requires n, so TypeScript rejects the dispatch.",
        "El miembro \"add\" de la unión exige n, así que TypeScript rechaza el dispatch.",
        "ユニオンの \"add\" には n が必須。TypeScript が拒否するよ。",
      ),
      check: { compiles: false },
    },
    {
      kind: "pick",
      hint: L("You need the sorted array itself, cached until list changes.", "Necesitas el arreglo ordenado en sí, guardado hasta que cambie list.", "欲しいのは並べ替えた配列そのもの。list が変わるまで保存。"),
      note: "recap-memo",
      prompt: L("Cache the sorted copy", "Guarda la copia ordenada", "並べ替えた結果をキャッシュ"),
      code: 'const sorted = ___(() => [...list].sort(), [list]);\nreturn <p>{sorted.join(",")}</p>;',
      options: ["useMemo", "useCallback", "useRef"],
      answer: 0,
      time: 12,
      explain: L(
        "useMemo caches the computed value until list changes. useCallback would cache a function instead.",
        "useMemo guarda el valor calculado hasta que cambia list. useCallback guardaría una función.",
        "useMemo は list が変わるまで値をキャッシュ。useCallback なら関数になる。",
      ),
      check: { compiles: true, program: prog('function Sorted({ list }: { list: string[] }) {\n  const sorted = useMemo(() => [...list].sort(), [list]);\n  return <p>{sorted.join(",")}</p>;\n}') },
    },
    {
      kind: "predict",
      hint: L("When user is null, is useState still called?", "Si user es null, ¿se sigue llamando a useState?", "user が null でも useState は呼ばれる？"),
      note: "recap-hooks-suspense",
      prompt: RULES_OK,
      code: "if (!user) return null;\nconst [x] = useState(0);",
      options: [YES, L("No: hook after an early return", "No: hook tras un return temprano", "いいえ：早期 return の後")],
      answer: 1,
      time: 13,
      explain: L(
        "The hook runs only sometimes, so the drawer order changes. Hooks go above any early return.",
        "El hook corre solo a veces y el orden de cajones cambia. Los hooks van antes de cualquier return temprano.",
        "フックが時々しか呼ばれず順番が変わる。早期 return より上に置こう。",
      ),
      check: { compiles: true, program: prog("function Card({ user }: { user: string | null }) {\n  if (!user) return null;\n  const [x] = useState(0);\n  return <p>{user}</p>;\n}") },
    },
    {
      kind: "predict",
      hint: L("A suspending component needs something above it to show a fallback. Is there one?", "Un componente que se suspende necesita algo encima que muestre un fallback. ¿Lo hay?", "中断する部品には上でフォールバックを出すものが必要。ある？"),
      note: "recap-hooks-suspense",
      prompt: L("No Suspense above Chart. What happens?", "No hay Suspense arriba de Chart. ¿Qué pasa?", "Chart の上に Suspense なし。どうなる？"),
      code: `${LAZY_DECL}console.log(renderToStaticMarkup(<Chart />));`,
      options: [
        L("It throws: nothing to catch the suspend", "Lanza error: nadie atrapa la suspensión", "エラー：中断を受け止める所がない"),
        "<p>Loading...</p>",
        L("It prints an empty string", "Imprime un string vacío", "空文字が出る"),
      ],
      answer: 0,
      time: 15,
      explain: L(
        "A suspending component needs a Suspense boundary above it. Without one, the synchronous render fails.",
        "Un componente que se suspende necesita un Suspense arriba. Sin él, el render síncrono falla.",
        "中断するコンポーネントには上に Suspense が必要。ないと同期レンダーが失敗する。",
      ),
      check: { compiles: true, program: prog(`${LAZY_DECL}console.log(renderToStaticMarkup(<Chart />));`), throws: "suspended" },
    },
    {
      kind: "type",
      hint: L("An unknown action should change nothing. What should come back out?", "Una acción desconocida no debe cambiar nada. ¿Qué debe salir?", "知らない action では何も変えない。何を返す？"),
      note: "recap-context-reducer",
      prompt: L("Unknown action: keep the state", "Acción desconocida: conserva el estado", "未知のアクションは状態を維持"),
      code: 'function reducer(state: string[], action: { type: string }): string[] {\n  switch (action.type) {\n    case "clear": return [];\n    default: return ___;\n  }\n}\nconsole.log(reducer(["gem"], { type: "?" }));',
      answer: "state",
      time: 13,
      explain: L(
        "Returning the same state for unknown actions keeps the reducer total and safe.",
        "Devolver el mismo estado para acciones desconocidas mantiene el reducer completo y seguro.",
        "未知のアクションには同じ state を返す。これでリデューサーが安全になる。",
      ),
      check: { compiles: true, stdout: "[ 'gem' ]" },
    },
    {
      kind: "predict",
      hint: L("It's a compiler: it rewrites code at build time. Which option fits a build step?", "Es un compilador: reescribe el código al compilar. ¿Qué opción encaja con ese paso?", "コンパイラはビルド時にコードを書き換える。それに合う選択肢は？"),
      note: "recap-memo",
      prompt: L("The React Compiler…", "El React Compiler…", "React Compiler は…"),
      code: "function Total({ items }: { items: number[] }) {\n  const sum = items.reduce((a, b) => a + b, 0);\n  return <p>{sum}</p>;\n}",
      options: [
        L("Memoizes for you at build time", "Memoiza por ti al compilar", "ビルド時に自動でメモ化"),
        L("Replaces the virtual DOM", "Reemplaza el DOM virtual", "仮想 DOM を置き換える"),
      ],
      answer: 0,
      time: 13,
      explain: L(
        "The React Compiler adds memoization automatically at build time, so plain code like this needs no manual useMemo.",
        "El React Compiler agrega memoización automáticamente al compilar, así que código simple como este no necesita useMemo.",
        "React Compiler はビルド時に自動でメモ化する。こんなコードに手動の useMemo は不要だ。",
      ),
      check: { compiles: true, program: prog("function Total({ items }: { items: number[] }) {\n  const sum = items.reduce((a, b) => a + b, 0);\n  return <p>{sum}</p>;\n}") },
    },
    {
      kind: "predict",
      hint: L("React matches components by type, position and key. What differs between the two?", "React empareja componentes por tipo, posición y key. ¿Qué cambia entre los dos?", "React は型・位置・key で照合する。2つの違いは？"),
      note: "recap-rerenders",
      prompt: L("React keeps a component's state when…", "React conserva el estado de un componente si…", "React が state を保つのは…"),
      code: '{show ? <Counter key="a" /> : <Counter key="b" />}',
      options: [
        L("Same type, same spot, same key", "Mismo tipo, lugar y key", "同じ型・位置・key の時"),
        L("Its props look the same", "Sus props se ven iguales", "props が同じに見える時"),
      ],
      answer: 0,
      time: 14,
      explain: L(
        "Reconciliation matches by type, position and key. Here the key changes, so toggling show resets the counter.",
        "La reconciliación compara tipo, posición y key. Aquí cambia la key, así que alternar show reinicia el contador.",
        "差分検出は型・位置・key で照合する。ここでは key が変わるので show を切り替えるとリセット。",
      ),
      check: { compiles: true, program: prog('function Counter() {\n  const [n] = useState(0);\n  return <p>{n}</p>;\n}\nfunction App({ show }: { show: boolean }) {\n  return <div>{show ? <Counter key="a" /> : <Counter key="b" />}</div>;\n}') },
    },
    enemySays(L(
      "My storm... calmed by a single shield and a stable key? The tower is quiet... for now.",
      "¿Mi tormenta... calmada por un escudo y una llave estable? La torre está en calma... por ahora.",
      "嵐が…盾と安定した鍵ひとつで静まるとは…。塔は静かだ…今のところはな。",
    )),
  ],
  notes: overlordNotes,
};

export const renderTower: RegionDef = {
  slug: "render-tower",
  name: L("Render Tower", "Torre del Render", "レンダーの塔"),
  subtitle: L("Context, reducers, memo, hooks, Suspense", "Contexto, reducers, memo, hooks y más", "コンテキスト・メモ化・フック"),
  theme: "tower",
  status: "active",
  lessons: [contextAndReducer, memoizationShield, customHooks, suspenseAndBoundaries, renderOverlord],
};
