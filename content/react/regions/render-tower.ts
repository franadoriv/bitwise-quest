import type { Beat, LessonDef, RegionDef, Text } from "../../../lib/content/types.ts";
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
};

// ─── 4.2 memo, useMemo, useCallback ─────────────────────────────────────────
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
};

// ─── 4.3 custom hooks and the rules of hooks ────────────────────────────────
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
};

// ─── 4.4 Suspense, lazy, error boundaries, transitions ──────────────────────
const LAZY_DECL = "const Chart = lazy(() => new Promise<{ default: React.ComponentType }>(() => {}));\n";

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
};

// ─── 4.5 Boss: the Render Overlord ──────────────────────────────────────────
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
};

export const renderTower: RegionDef = {
  slug: "render-tower",
  name: L("Render Tower", "Torre del Render", "レンダーの塔"),
  subtitle: L("Context, reducers, memo, hooks, Suspense", "Contexto, reducers, memo, hooks y más", "コンテキスト・メモ化・フック"),
  theme: "tower",
  status: "active",
  lessons: [contextAndReducer, memoizationShield, customHooks, suspenseAndBoundaries, renderOverlord],
};
