import type { Beat, Effect, LessonDef, RegionDef, Text } from "../../../lib/content/types.ts";
import { L } from "../../../lib/i18n/text.ts";

// REGION 3 · EFFECT PEAKS  (useEffect and cleanup, dependency arrays, StrictMode, stale closures,
// useRef, data fetching and race conditions, effects you don't need)

const say = (text: Text): Beat => ({ kind: "dialog", speaker: "master", text });
const enemySays = (text: Text): Beat => ({ kind: "dialog", speaker: "enemy", text });

/** Imports every React snippet needs (JSX uses the classic runtime, so React must be in scope). */
const H =
  'import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useSyncExternalStore, StrictMode } from "react";\n' +
  'import { renderToStaticMarkup } from "react-dom/server";\n';
/** Full program for a top-level snippet: imports + optional declarations + code (answer filled in). */
const prog = (code: string, fill?: string, decl = "") => H + decl + (fill == null ? code : code.replace("___", fill));
/** Full program for a fragment that lives inside a component body. */
const comp = (code: string, fill?: string, decl = "", inner = "") =>
  H + decl + "function C() {\n" + inner + (fill == null ? code : code.replace("___", fill)) + "\n  return null;\n}\n";

const TODO = "type Todo = { id: number; text: string; done: boolean };\n";
const ROOM = "declare function connect(id: string): { close(): void };\n";
const COUNT = "  const [count, setCount] = useState(0);\n";

const WHAT_PRINTS = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const RENDER = L("RENDER", "RENDER", "レンダー");
const HIT: Effect[] = [{ t: "attack", from: "hero", to: "enemy" }];

// ─── 3.1 effects and cleanup ───────────────────────────────────────────────
const effectsAndCleanup: LessonDef = {
  slug: "effects-and-cleanup",
  title: L("Chores after the show", "Tareas tras la función", "ショーの後の用事"),
  concept: "effects",
  mode: "lesson",
  xp: 75,
  enemy: "react/rerender-tornado",
  enemyName: L("LOOP TORNADO", "TORNADO BUCLE", "ループ竜巻"),
  beats: [
    say(L(
      "Welcome to Effect Peaks! Rendering must stay pure: just compute the JSX. Chores that touch the outside world go in useEffect.",
      "¡Bienvenido a Effect Peaks! Renderizar debe ser puro: solo calcula el JSX. Las tareas con el mundo exterior van en useEffect.",
      "エフェクト山へようこそ！レンダーは純粋に JSX を計算するだけ。外の世界に触れる用事は useEffect に書こう。",
    )),
    {
      kind: "act",
      prompt: L("Build a chat room that connects after rendering", "Arma una sala que se conecta tras renderizar", "レンダー後に接続するチャット部屋を作ろう"),
      setup: [{ t: "enter", actor: "hero" }],
      steps: [
        { label: L("COMPONENT", "COMPONENTE", "部品"), line: "function Room({ roomId }: { roomId: string }) {", effects: [{ t: "tag", actor: "hero", text: "Room" }] },
        { label: L("EFFECT", "EFECTO", "副作用"), line: "  useEffect(() => {", effects: [{ t: "say", actor: "hero", text: L("After the show!", "¡Tras la función!", "ショーの後で!") }] },
        { label: L("CONNECT", "CONECTAR", "接続"), line: "    const c = connect(roomId);", effects: [{ t: "item", kind: "key", holder: "hero" }, { t: "say", actor: "hero", text: L("Connected!", "¡Conectado!", "接続した!") }] },
        { label: L("CLEANUP", "LIMPIEZA", "後片付け"), line: "    return () => c.close();", effects: [{ t: "banner", text: L("CLEANUP", "LIMPIEZA", "クリーンアップ") }] },
        { label: L("DEPENDENCIES", "DEPENDENCIAS", "依存配列"), line: "  }, [roomId]);", effects: [{ t: "value", actor: "hero", text: "[roomId]" }] },
        { label: L("RENDER", "RENDER", "描画"), line: "  return <h1>{roomId}</h1>;\n}", effects: [{ t: "banner", text: RENDER }, { t: "print", text: "<h1>music</h1>" }] },
        { label: L("NEW ROOM", "OTRA SALA", "部屋を変更"), effects: [{ t: "drop" }, { t: "say", actor: "hero", text: L("Bye, old room", "Adiós, sala vieja", "前の部屋を閉じる") }, { t: "item", kind: "key", holder: "hero" }] },
      ],
    },
    {
      kind: "predict",
      prompt: L("A static render (no browser). What prints?", "Render estático (sin navegador). ¿Qué imprime?", "静的レンダー（ブラウザなし）。何が出る？"),
      code: 'function C() {\n  useEffect(() => {\n    console.log("effect");\n  });\n  return <p>x</p>;\n}\nconsole.log(renderToStaticMarkup(<C />));',
      options: ["<p>x</p>", "effect <p>x</p>", "<p>x</p> effect"],
      answer: 0,
      output: "<p>x</p>",
      explain: L(
        "Effects run after the screen is committed in a browser. A server or static render never runs them, so only the HTML prints.",
        "Los efectos corren tras pintar en el navegador. Un render de servidor o estático nunca los ejecuta: solo sale el HTML.",
        "副作用はブラウザで画面に反映された後に動く。サーバーや静的レンダーでは実行されないので HTML だけが出るよ。",
      ),
      check: { program: prog('function C() {\n  useEffect(() => {\n    console.log("effect");\n  });\n  return <p>x</p>;\n}\nconsole.log(renderToStaticMarkup(<C />));'), compiles: true, stdout: "<p>x</p>" },
      setup: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "C" }],
      win: [{ t: "print", text: "<p>x</p>" }],
    },
    say(L(
      "The dependency array decides WHEN: none means after every render, [] only after mount, [a] whenever a changes.",
      "El arreglo de dependencias decide CUÁNDO: sin él, tras cada render; [] solo al montar; [a] cada vez que a cambia.",
      "依存配列が「いつ」を決める。なし→毎回のレンダー後、[]→マウント後だけ、[a]→a が変わったとき。",
    )),
    {
      kind: "pick",
      prompt: L("Run it only after the first render", "Que corra solo tras el primer render", "最初のレンダー後だけ実行しよう"),
      code: 'function Hello({ count }: { count: number }) {\n  useEffect(() => {\n    console.log("hello");\n  }, ___);\n  return <p>{count}</p>;\n}',
      options: ["[]", "[count]"],
      answer: 0,
      explain: L(
        "An empty array has nothing that can change, so the effect runs once after mount. [count] would re-run it whenever count changes.",
        "Un arreglo vacío no tiene nada que cambie: el efecto corre una vez al montar. [count] lo repetiría cada vez que count cambie.",
        "空の配列は変わるものがないので、マウント後に一度だけ動く。[count] だと count が変わるたびに再実行されるよ。",
      ),
      check: { program: prog('function Hello({ count }: { count: number }) {\n  useEffect(() => {\n    console.log("hello");\n  }, ___);\n  return <p>{count}</p>;\n}', "[]"), compiles: true },
      setup: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "Hello" }],
      win: [{ t: "say", actor: "hero", text: L("Just once!", "¡Solo una vez!", "一度だけ!") }],
    },
    {
      kind: "predict",
      prompt: L("When does c.close() run?", "¿Cuándo corre c.close()?", "c.close() はいつ動く？"),
      code: "useEffect(() => {\n  const c = connect(roomId);\n  return () => c.close();\n}, [roomId]);",
      options: [
        L("Before the next effect and on unmount", "Antes del siguiente efecto y al desmontar", "次の副作用の前とアンマウント時"),
        L("Only when the app closes", "Solo al cerrar la app", "アプリを閉じたときだけ"),
        L("Right after connect", "Justo después de connect", "connect の直後"),
      ],
      answer: 0,
      explain: L(
        "The cleanup undoes the last effect: React runs it before re-running the effect with a new roomId, and when the component leaves.",
        "La limpieza deshace el último efecto: React la corre antes de repetirlo con otro roomId y cuando el componente se va.",
        "クリーンアップは前回の副作用を元に戻す。roomId が変わって再実行する前と、部品が消えるときに動くよ。",
      ),
      check: { program: comp("  useEffect(() => {\n    const c = connect(roomId);\n    return () => c.close();\n  }, [roomId]);", undefined, ROOM, '  const roomId = "music";\n'), compiles: true },
      setup: [{ t: "enter", actor: "hero" }, { t: "item", kind: "key", holder: "hero" }],
      win: [{ t: "drop" }, { t: "say", actor: "hero", text: L("Disconnected", "Desconectado", "切断した") }],
    },
    say(L(
      "In development, StrictMode mounts, unmounts and mounts again on purpose. A missing cleanup shows up right away.",
      "En desarrollo, StrictMode monta, desmonta y vuelve a montar a propósito. Si falta la limpieza, se nota enseguida.",
      "開発中の StrictMode はわざとマウント→アンマウント→再マウントする。クリーンアップ漏れがすぐ分かるよ。",
    )),
    {
      kind: "predict",
      prompt: L("Dev + StrictMode, on mount the log shows…", "Desarrollo + StrictMode, al montar se ve…", "開発中の StrictMode、マウント時のログは？"),
      code: 'useEffect(() => {\n  console.log("connect");\n  return () => console.log("disconnect");\n}, []);',
      options: [
        "connect",
        "connect, disconnect, connect",
        "connect, connect",
      ],
      answer: 1,
      explain: L(
        "StrictMode runs setup, cleanup, setup once more in development. With a correct cleanup, the user sees no difference.",
        "StrictMode corre efecto, limpieza y efecto otra vez en desarrollo. Con una limpieza correcta, el usuario no nota nada.",
        "StrictMode は開発中に 実行→クリーンアップ→再実行 をする。正しく片付ければ利用者には違いが出ないよ。",
      ),
      check: { program: comp('  useEffect(() => {\n    console.log("connect");\n    return () => console.log("disconnect");\n  }, []);'), compiles: true },
      setup: [{ t: "enter", actor: "hero" }],
      win: [{ t: "print", text: "connect" }, { t: "print", text: "disconnect" }, { t: "print", text: "connect" }],
    },
    {
      kind: "predict",
      prompt: L("What happens with this effect?", "¿Qué pasa con este efecto?", "この副作用はどうなる？"),
      code: "useEffect(() => {\n  setCount(count + 1);\n});",
      options: [
        L("It runs once", "Corre una vez", "一度だけ動く"),
        L("Infinite re-render loop", "Bucle infinito de renders", "無限に再レンダー"),
      ],
      answer: 1,
      explain: L(
        "With no array the effect runs after every render, and setting state causes another render. Round and round forever.",
        "Sin arreglo el efecto corre tras cada render, y cambiar el estado provoca otro render. Gira y gira para siempre.",
        "配列がないと毎回のレンダー後に動き、状態更新でまたレンダーされる。永遠にぐるぐる回るよ。",
      ),
      check: { program: comp("  useEffect(() => {\n    setCount(count + 1);\n  });", undefined, "", COUNT), compiles: true },
      setup: [{ t: "enter", actor: "enemy" }],
      win: [{ t: "shake" }, { t: "banner", text: L("LOOP!", "¡BUCLE!", "ループ!") }],
    },
    {
      kind: "predict",
      prompt: WHAT_PRINTS,
      code: "console.log(Object.is({ a: 1 }, { a: 1 }));",
      options: ["true", "false"],
      answer: 1,
      output: "false",
      explain: L(
        "React compares dependencies with Object.is. Two objects that look equal are still two different objects.",
        "React compara dependencias con Object.is. Dos objetos que se ven iguales siguen siendo dos objetos distintos.",
        "React は依存配列を Object.is で比べる。見た目が同じでも別々のオブジェクトは別物だよ。",
      ),
      check: { compiles: true, stdout: "false" },
      setup: [{ t: "item", kind: "gem", holder: "hero" }],
      win: [{ t: "clone", to: "ally" }, { t: "print", text: "false" }],
    },
    {
      kind: "predict",
      prompt: L("Why does it re-run after every render?", "¿Por qué se repite tras cada render?", "なぜ毎回再実行される？"),
      code: "const options = { roomId };\nuseEffect(() => {\n  connect(options.roomId);\n}, [options]);",
      options: [
        L("options is a new object each render", "options es un objeto nuevo en cada render", "options が毎回新しいオブジェクト"),
        L("roomId is a string", "roomId es un string", "roomId が文字列だから"),
      ],
      answer: 0,
      explain: L(
        "Objects created during render are new every time, so the dependency always 'changed'. Depend on roomId itself instead.",
        "Los objetos creados al renderizar son nuevos cada vez, así que la dependencia siempre 'cambia'. Depende de roomId directamente.",
        "レンダー中に作るオブジェクトは毎回新品なので、依存が常に「変わった」ことになる。roomId そのものに依存しよう。",
      ),
      check: { program: comp("  const options = { roomId };\n  useEffect(() => {\n    connect(options.roomId);\n  }, [options]);", undefined, ROOM, '  const roomId = "music";\n'), compiles: true },
      setup: [{ t: "enter", actor: "enemy" }],
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "order",
      prompt: L("Order a ticking effect with its cleanup", "Ordena un efecto con reloj y su limpieza", "タイマーの副作用と片付けを並べよう"),
      lines: ["useEffect(() => {", "  const id = setInterval(tick, 1000);", "  return () => clearInterval(id);", "}, []);"],
      explain: L(
        "Start the interval inside the effect and return a function that clears it. Without it, every mount adds another timer.",
        "Inicia el intervalo dentro del efecto y devuelve una función que lo limpie. Sin ella, cada montaje suma otro temporizador.",
        "副作用の中でタイマーを開始し、止める関数を返す。これがないとマウントのたびにタイマーが増えるよ。",
      ),
      check: { program: comp("useEffect(() => {\n  const id = setInterval(tick, 1000);\n  return () => clearInterval(id);\n}, []);", undefined, "declare function tick(): void;\n"), compiles: true },
      setup: [{ t: "enter", actor: "hero" }],
      win: [{ t: "say", actor: "hero", text: L("Tick... and stop", "Tic... y alto", "チク…停止") }],
    },
    {
      kind: "pick",
      prompt: L("Measure the box before the browser paints", "Mide la caja antes de que pinte el navegador", "描画前に箱の大きさを測ろう"),
      code: "___(() => {\n  setHeight(box.current!.offsetHeight);\n}, []);",
      options: ["useLayoutEffect", "useEffect"],
      answer: 0,
      explain: L(
        "useLayoutEffect runs after the DOM updates but before paint, so a measurement never flickers. Prefer useEffect for everything else.",
        "useLayoutEffect corre tras actualizar el DOM pero antes de pintar, así la medición no parpadea. Para lo demás, usa useEffect.",
        "useLayoutEffect は DOM 更新後・描画前に動くので測定がちらつかない。それ以外は useEffect を使おう。",
      ),
      check: { program: comp("  ___(() => {\n    setHeight(box.current!.offsetHeight);\n  }, []);", "useLayoutEffect", "", "  const box = useRef<HTMLDivElement>(null);\n  const [height, setHeight] = useState(0);\n"), compiles: true },
      setup: [{ t: "item", kind: "shield", holder: "hero" }],
      win: [{ t: "value", actor: "hero", text: "120px" }],
    },
    {
      kind: "run",
      prompt: L("Compare dependencies like React does (Object.is)", "Compara dependencias como React (Object.is)", "React と同じく Object.is で依存を比べよう"),
      starter:
        'function depsChanged(prev: unknown[], next: unknown[]): boolean {\n  return prev !== next;\n}\nconsole.log(depsChanged([1, "a"], [1, "a"]), depsChanged([1], [2]), depsChanged([NaN], [NaN]));',
      solution:
        'function depsChanged(prev: unknown[], next: unknown[]): boolean {\n  return prev.length !== next.length || prev.some((d, i) => !Object.is(d, next[i]));\n}\nconsole.log(depsChanged([1, "a"], [1, "a"]), depsChanged([1], [2]), depsChanged([NaN], [NaN]));',
      expect: "false true false",
      fallback: ["Object\\.is\\("],
      explain: L(
        "Each render builds a new array, so compare item by item with Object.is: same values mean no change, and NaN equals NaN.",
        "Cada render crea un arreglo nuevo: compara elemento a elemento con Object.is. Mismos valores, sin cambio; y NaN es igual a NaN.",
        "配列は毎回新しく作られるので、要素ごとに Object.is で比べる。同じ値なら変化なし、NaN 同士も等しいよ。",
      ),
    },
  ],
};

// ─── 3.2 stale closures and refs ───────────────────────────────────────────
const STALE_INTERVAL = "useEffect(() => {\n  const id = setInterval(() => setCount(count + 1), 1000);\n  return () => clearInterval(id);\n}, []);";

const staleClosuresAndRefs: LessonDef = {
  slug: "stale-closures-and-refs",
  title: L("Old photographs", "Fotografías viejas", "古い写真"),
  concept: "refs",
  mode: "lesson",
  xp: 78,
  enemy: "react/stale-closure",
  enemyName: L("AMBER FOSSIL", "FÓSIL DE ÁMBAR", "琥珀の化石"),
  beats: [
    say(L(
      "Each render is a photograph: its own props, state and functions. A function made in an old render still sees the old values.",
      "Cada render es una foto: sus propias props, estado y funciones. Una función de un render viejo sigue viendo valores viejos.",
      "レンダーは一枚の写真。props も状態も関数もその時のもの。古いレンダーの関数は古い値を見続けるよ。",
    )),
    {
      kind: "act",
      prompt: L("Start a timer that only knows the first photo", "Inicia un reloj que solo conoce la primera foto", "最初の写真しか知らないタイマーを動かそう"),
      setup: [{ t: "enter", actor: "hero" }],
      steps: [
        { label: L("STATE", "ESTADO", "状態"), line: "const [count, setCount] = useState(0);", effects: [{ t: "tag", actor: "hero", text: "count", value: "0" }] },
        { label: L("EFFECT", "EFECTO", "副作用"), line: "useEffect(() => {" },
        { label: L("TIMER", "RELOJ", "タイマー"), line: "  const id = setInterval(() => setCount(count + 1), 1000);", effects: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "say", actor: "hero", text: L("count is 0", "count es 0", "count は 0") }] },
        { label: L("CLEANUP", "LIMPIEZA", "後片付け"), line: "  return () => clearInterval(id);" },
        { label: L("ONLY ONCE", "SOLO UNA VEZ", "一度だけ"), line: "}, []);", effects: [{ t: "value", actor: "hero", text: "1" }, { t: "wait", ms: 400 }, { t: "value", actor: "hero", text: "1" }, { t: "shake" }, { t: "banner", text: L("STUCK AT 1", "ATASCADO EN 1", "1 で止まる") }] },
        { label: L("UPDATER", "UPDATER", "更新関数"), line: "// fix: setCount(c => c + 1)", effects: [{ t: "value", actor: "hero", text: "2" }, { t: "value", actor: "hero", text: "3" }, { t: "say", actor: "hero", text: L("Moving again!", "¡Ya avanza!", "また進んだ!") }] },
      ],
    },
    {
      kind: "predict",
      prompt: WHAT_PRINTS,
      code: 'function makeHandler(count: number) {\n  return () => console.log("count is", count);\n}\nconst h = makeHandler(0);\nmakeHandler(5);\nh();',
      options: ["count is 0", "count is 5", "count is undefined"],
      answer: 0,
      output: "count is 0",
      explain: L(
        "h closed over count = 0 when it was created. A later call with 5 makes a new function; it doesn't change the old one.",
        "h capturó count = 0 al crearse. Llamar luego con 5 crea otra función; no cambia la vieja.",
        "h は作られたときの count = 0 を閉じ込めた。後で 5 を渡すと別の関数ができるだけで、古い方は変わらないよ。",
      ),
      check: { compiles: true, stdout: "count is 0" },
      setup: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "h", value: "0" }],
      win: [{ t: "print", text: "count is 0" }],
    },
    {
      kind: "predict",
      prompt: L("After 5 seconds the counter shows…", "Tras 5 segundos el contador muestra…", "5 秒後、カウンターの表示は？"),
      code: STALE_INTERVAL,
      options: ["1", "5", "0"],
      answer: 0,
      explain: L(
        "With [] the interval keeps the first render's count (0) forever, so it sets 0 + 1 = 1 again and again.",
        "Con [] el intervalo guarda para siempre el count del primer render (0): pone 0 + 1 = 1 una y otra vez.",
        "[] だとタイマーは最初のレンダーの count（0）を持ち続け、0 + 1 = 1 を何度もセットするだけ。",
      ),
      check: { program: comp(STALE_INTERVAL, undefined, "", COUNT), compiles: true },
      setup: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "count", value: "0" }],
      win: [{ t: "value", actor: "hero", text: "1" }, { t: "shake" }],
    },
    {
      kind: "pick",
      prompt: L("Fix it: always add to the latest value", "Arréglalo: suma siempre al valor actual", "直そう：常に最新の値に足す"),
      code: "const id = setInterval(() => setCount(___), 1000);",
      options: ["c => c + 1", "count + 1"],
      answer: 0,
      explain: L(
        "An updater function receives the latest state from React, so the old photo of count no longer matters.",
        "Una función updater recibe el estado más reciente de React, así que la foto vieja de count ya no importa.",
        "更新関数は React から最新の状態を受け取るので、古い写真の count はもう関係ないよ。",
      ),
      check: { program: comp("  const id = setInterval(() => setCount(___), 1000);", "c => c + 1", "", COUNT), compiles: true },
      setup: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "count", value: "1" }],
      win: [{ t: "value", actor: "hero", text: "2" }, { t: "value", actor: "hero", text: "3" }],
    },
    say(L(
      "useRef is a pocket notebook: ref.current changes silently and survives renders, but never triggers one. Great for timer ids.",
      "useRef es una libreta de bolsillo: ref.current cambia en silencio y sobrevive renders, pero nunca provoca uno.",
      "useRef はポケットの手帳。ref.current は静かに変わり、レンダーをまたいで残るけど再レンダーは起こさない。",
    )),
    {
      kind: "pick",
      prompt: L("Keep a timer id without re-rendering", "Guarda un id de timer sin re-renderizar", "再レンダーせずにタイマー ID を保存"),
      code: "const timer = ___<number | null>(null);",
      options: ["useRef", "useState"],
      answer: 0,
      explain: L(
        "A timer id is not shown on screen, so it doesn't need a render. useRef stores it; changing state would re-render for nothing.",
        "El id del timer no se muestra en pantalla: no necesita render. useRef lo guarda; con estado re-renderizarías por nada.",
        "タイマー ID は画面に出ないのでレンダー不要。useRef に保存しよう。状態にすると無駄に再レンダーされる。",
      ),
      check: { program: comp("  const timer = ___<number | null>(null);", "useRef"), compiles: true },
      setup: [{ t: "enter", actor: "hero" }],
      win: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "timer" }],
    },
    {
      kind: "predict",
      prompt: WHAT_PRINTS,
      code: "function C() {\n  const r = useRef(3);\n  return <p>{r.current}</p>;\n}\nconsole.log(renderToStaticMarkup(<C />));",
      options: ["<p>3</p>", "<p></p>", "<p>[object Object]</p>"],
      answer: 0,
      output: "<p>3</p>",
      explain: L(
        "useRef(3) returns { current: 3 } on the first render. Still, avoid reading refs while rendering: changes to them won't show.",
        "useRef(3) devuelve { current: 3 } en el primer render. Aun así, evita leer refs al renderizar: sus cambios no se verán.",
        "useRef(3) は最初に { current: 3 } を返す。ただしレンダー中に ref を読むのは避けよう。変更が画面に出ないから。",
      ),
      check: { program: prog("function C() {\n  const r = useRef(3);\n  return <p>{r.current}</p>;\n}\nconsole.log(renderToStaticMarkup(<C />));"), compiles: true, stdout: "<p>3</p>" },
      setup: [{ t: "item", kind: "scroll", holder: "hero" }],
      win: [{ t: "print", text: "<p>3</p>" }],
    },
    {
      kind: "predict",
      prompt: L("A click runs this. Does the screen re-render?", "Un clic ejecuta esto. ¿Se re-renderiza?", "クリックでこれが動く。再レンダーする？"),
      code: "function onClick() {\n  clicks.current++;\n}",
      options: [
        L("No: refs change silently", "No: los refs cambian en silencio", "しない：ref は静かに変わる"),
        L("Yes, like state", "Sí, como el estado", "する：状態と同じ"),
      ],
      answer: 0,
      explain: L(
        "Writing ref.current is invisible to React. Use state for anything the screen must show.",
        "Escribir ref.current es invisible para React. Usa estado para todo lo que la pantalla deba mostrar.",
        "ref.current への書き込みは React には見えない。画面に出すものは状態を使おう。",
      ),
      check: { program: comp("  const clicks = useRef(0);\n  function onClick() {\n    clicks.current++;\n  }"), compiles: true },
      setup: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "clicks", value: "0" }],
      win: [{ t: "value", actor: "hero", text: "1" }, { t: "say", actor: "hero", text: L("Shh, no render", "Shh, sin render", "しーっ、描画なし") }],
    },
    {
      kind: "type",
      prompt: L("Focus the input from a click handler", "Enfoca el input desde un clic", "クリックで入力欄にフォーカス"),
      code: "function onClick() {\n  inputRef.current?.___();\n}",
      answer: "focus",
      explain: L(
        "A DOM ref gives you the real <input> after mount. Call its methods in handlers or effects, never during render.",
        "Un ref al DOM te da el <input> real tras montar. Llama sus métodos en handlers o efectos, nunca al renderizar.",
        "DOM の ref はマウント後に本物の <input> を指す。メソッドはハンドラや副作用で呼ぼう。レンダー中は禁止。",
      ),
      check: { program: comp("  const inputRef = useRef<HTMLInputElement>(null);\n  function onClick() {\n    inputRef.current?.___();\n  }", "focus"), compiles: true },
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "input" }],
      win: [{ t: "lend", to: "ally" }, { t: "say", actor: "ally", text: L("Focused!", "¡Enfocado!", "フォーカス!") }],
    },
    {
      kind: "predict",
      prompt: L("React 19: does MyInput need forwardRef?", "React 19: ¿MyInput necesita forwardRef?", "React 19：MyInput に forwardRef は必要？"),
      code: "function MyInput({ ref }: { ref: React.Ref<HTMLInputElement> }) {\n  return <input ref={ref} />;\n}",
      options: [
        L("No: ref is a normal prop now", "No: ref ya es una prop normal", "不要：ref は普通の props"),
        L("Yes, it won't compile without it", "Sí, sin él no compila", "必要：ないとエラー"),
      ],
      answer: 0,
      explain: L(
        "Since React 19 a function component can receive ref as a prop. forwardRef still works, but it's no longer required.",
        "Desde React 19 un componente de función puede recibir ref como prop. forwardRef sigue funcionando, pero ya no hace falta.",
        "React 19 から関数コンポーネントは ref を props で受け取れる。forwardRef も動くけど、もう必須じゃないよ。",
      ),
      check: { program: prog("function MyInput({ ref }: { ref: React.Ref<HTMLInputElement> }) {\n  return <input ref={ref} />;\n}"), compiles: true },
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "MyInput" }],
      win: [{ t: "give", to: "ally" }],
    },
    {
      kind: "run",
      prompt: L("Make tick() read the latest state, not the photo", "Haz que tick() lea el estado actual, no la foto", "tick() が写真でなく最新の状態を読むように"),
      starter:
        'let state = 0;\nfunction render() {\n  const count = state;\n  return { tick: () => { state = count + 1; } };\n}\nconst first = render();\nfirst.tick();\nfirst.tick();\nfirst.tick();\nconsole.log("state:", state);',
      solution:
        'let state = 0;\nfunction render() {\n  const count = state;\n  return { tick: () => { state = state + 1; } };\n}\nconst first = render();\nfirst.tick();\nfirst.tick();\nfirst.tick();\nconsole.log("state:", state);',
      expect: "state: 3",
      fallback: ["state\\s*=\\s*state\\s*\\+\\s*1", "state\\s*\\+=\\s*1", "state\\+\\+", "\\+\\+state"],
      explain: L(
        "count is the photo from render(), so every tick wrote 0 + 1. Reading state itself is like setCount(c => c + 1).",
        "count es la foto de render(): cada tick escribía 0 + 1. Leer state directamente es como setCount(c => c + 1).",
        "count は render() の写真なので毎回 0 + 1 だった。state 自体を読むのは setCount(c => c + 1) と同じ考え方。",
      ),
    },
  ],
};

// ─── 3.3 data fetching ─────────────────────────────────────────────────────
const USER = "declare function fetchUser(id: number): Promise<{ name: string }>;\n";
const USER_STATE = "  const id = 1;\n  const [user, setUser] = useState<{ name: string } | null>(null);\n";
const RACE_FIX = ["useEffect(() => {", "  let ignore = false;", "  fetchUser(id).then(u => {", "    if (!ignore) setUser(u);", "  });", "  return () => { ignore = true; };", "}, [id]);"];

const dataFetching: LessonDef = {
  slug: "data-fetching",
  title: L("Messenger birds", "Aves mensajeras", "伝書バト"),
  concept: "data_fetching",
  mode: "lesson",
  xp: 80,
  enemy: "typescript/callback-spaghetti",
  enemyName: L("LATE BIRD BUG", "BUG TARDÍO", "遅刻バグ"),
  beats: [
    say(L(
      "To load data, fetch inside an effect and keep loading, data and error in state. Each request is a messenger bird.",
      "Para cargar datos, haz fetch dentro de un efecto y guarda carga, datos y error en estado. Cada petición es un ave mensajera.",
      "データは副作用の中で取得し、loading・データ・エラーを状態に持とう。リクエストは伝書バトだよ。",
    )),
    {
      kind: "act",
      prompt: L("Send a bird, and ignore it if the id changes", "Envía un ave e ignórala si cambia el id", "ハトを送り、id が変わったら無視しよう"),
      setup: [{ t: "enter", actor: "hero" }],
      steps: [
        { label: L("EFFECT", "EFECTO", "副作用"), line: "useEffect(() => {" },
        { label: L("FLAG", "BANDERA", "フラグ"), line: "  let ignore = false;", effects: [{ t: "tag", actor: "hero", text: "ignore", value: "false" }] },
        { label: L("SEND BIRD", "ENVIAR AVE", "ハトを送る"), line: "  fetchUser(id).then(u => {", effects: [{ t: "enter", actor: "ally" }, { t: "item", kind: "scroll", holder: "ally" }, { t: "say", actor: "ally", text: L("Flying!", "¡Volando!", "飛んでる!") }] },
        { label: L("GUARD", "GUARDIA", "見張り"), line: "    if (!ignore) setUser(u);\n  });", effects: [{ t: "item", kind: "shield", holder: "hero" }] },
        { label: L("CLEANUP", "LIMPIEZA", "後片付け"), line: "  return () => { ignore = true; };", effects: [{ t: "value", actor: "hero", text: "true" }, { t: "say", actor: "hero", text: L("Ignore that one!", "¡Ignora esa!", "それは無視!") }] },
        { label: L("DEPENDENCIES", "DEPENDENCIAS", "依存配列"), line: "}, [id]);", effects: [{ t: "exit", actor: "ally" }, { t: "banner", text: L("NO STALE NEWS", "SIN NOTICIA VIEJA", "古い知らせなし") }] },
      ],
    },
    {
      kind: "predict",
      prompt: L("Why is this effect wrong?", "¿Por qué este efecto está mal?", "この副作用はなぜダメ？"),
      code: "useEffect(async () => {\n  setUser(await fetchUser(id));\n}, [id]);",
      options: [
        L("It returns a promise, not a cleanup", "Devuelve una promesa, no una limpieza", "片付け関数でなく Promise を返す"),
        L("fetch is not allowed in React", "fetch no está permitido en React", "React では fetch 禁止"),
      ],
      answer: 0,
      explain: L(
        "An effect must return nothing or a cleanup function; an async one returns a promise, and TypeScript rejects it. Define an async function inside and call it.",
        "Un efecto debe devolver nada o una limpieza; uno async devuelve una promesa y TypeScript lo rechaza. Define una función async adentro y llámala.",
        "副作用は何も返さないか片付け関数を返す。async だと Promise を返し型エラーになる。中で async 関数を作って呼ぼう。",
      ),
      check: { program: comp("  useEffect(async () => {\n    setUser(await fetchUser(id));\n  }, [id]);", undefined, USER, USER_STATE), compiles: false },
      setup: [{ t: "enter", actor: "enemy" }],
      win: [{ t: "attack", from: "hero", to: "enemy" }],
    },
    {
      kind: "predict",
      prompt: L("Reply 2 lands first, then reply 1. It shows…", "La respuesta 2 llega primero, luego la 1. Muestra…", "返事2が先、返事1が後。表示は？"),
      code: 'let shown = "";\nconst load = (id: number, ms: number) =>\n  setTimeout(() => { shown = "user " + id; }, ms);\nload(1, 30);\nload(2, 10);\nsetTimeout(() => console.log(shown), 50);',
      options: ["user 1", "user 2"],
      answer: 0,
      output: "user 1",
      explain: L(
        "The slow reply for user 1 lands last and overwrites user 2. That's a race condition: stale news wins.",
        "La respuesta lenta del usuario 1 llega última y pisa al usuario 2. Es una condición de carrera: gana la noticia vieja.",
        "遅い user 1 の返事が最後に届いて user 2 を上書きする。これが競合状態。古い知らせが勝ってしまう。",
      ),
      check: { compiles: true, stdout: "user 1" },
      setup: [{ t: "enter", actor: "ally" }, { t: "item", kind: "scroll", holder: "ally" }],
      win: [{ t: "give", to: "hero" }, { t: "shake" }, { t: "print", text: "user 1" }],
    },
    say(L(
      "The fix: the cleanup flips an ignore flag, so a late bird is ignored. Or cancel the request with an AbortController.",
      "La solución: la limpieza activa una bandera ignore y el ave tardía se ignora. O cancela la petición con un AbortController.",
      "直し方：クリーンアップで ignore を立て、遅いハトを無視する。または AbortController で取り消そう。",
    )),
    {
      kind: "order",
      prompt: L("Order the race-condition fix", "Ordena la solución a la carrera", "競合状態の対策を並べよう"),
      lines: RACE_FIX,
      explain: L(
        "Each effect run has its own ignore flag. When id changes, the cleanup marks the old run, so its late reply is dropped.",
        "Cada ejecución tiene su propia bandera ignore. Si id cambia, la limpieza marca la vieja y su respuesta tardía se descarta.",
        "実行ごとに ignore フラグがある。id が変わると片付けが古い実行に印をつけ、遅い返事は捨てられるよ。",
      ),
      check: { program: comp(RACE_FIX.join("\n"), undefined, USER, USER_STATE), compiles: true },
      setup: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "ignore", value: "false" }],
      win: [{ t: "value", actor: "hero", text: "true" }, { t: "item", kind: "shield", holder: "hero" }],
    },
    {
      kind: "pick",
      prompt: L("Cancel the network request itself", "Cancela la petición de red en sí", "通信そのものを取り消そう"),
      code: 'const controller = new AbortController();\nfetch("/api/user", { signal: controller.signal });\ncontroller.___();',
      options: ["abort", "cancel", "stop"],
      answer: 0,
      explain: L(
        "abort() cancels every fetch that got its signal. Call it in the effect's cleanup.",
        "abort() cancela todo fetch que recibió su signal. Llámalo en la limpieza del efecto.",
        "abort() はその signal を渡した fetch をすべて取り消す。副作用のクリーンアップで呼ぼう。",
      ),
      check: { compiles: true, wrongFail: true },
      setup: [{ t: "enter", actor: "ally" }, { t: "item", kind: "scroll", holder: "ally" }],
      win: [{ t: "drop" }, { t: "exit", actor: "ally" }],
    },
    {
      kind: "predict",
      prompt: L("userId changes. What happens?", "userId cambia. ¿Qué pasa?", "userId が変わった。どうなる？"),
      code: "useEffect(() => {\n  load(userId);\n}, []);",
      options: [
        L("Nothing: it never refetches", "Nada: nunca vuelve a pedir", "何も起きない：再取得しない"),
        L("It refetches the new user", "Pide el nuevo usuario", "新しいユーザーを再取得"),
      ],
      answer: 0,
      explain: L(
        "The effect reads userId but doesn't list it, so it runs only once. Every value the effect uses belongs in the array.",
        "El efecto lee userId pero no lo lista, así que corre una sola vez. Todo valor que use el efecto va en el arreglo.",
        "userId を読むのに配列にないので一度しか動かない。副作用が使う値はすべて依存配列に入れよう。",
      ),
      check: { program: comp("  useEffect(() => {\n    load(userId);\n  }, []);", undefined, "declare function load(id: number): void;\n", "  const userId = 7;\n"), compiles: true },
      setup: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "userId", value: "7" }],
      win: [{ t: "value", actor: "hero", text: "8" }, { t: "say", actor: "hero", text: L("Still user 7...", "Sigue el 7...", "まだ 7 のまま…") }],
    },
    {
      kind: "pick",
      prompt: L("Hide the spinner on success AND error", "Oculta el spinner con éxito Y con error", "成功でも失敗でもスピナーを消す"),
      code: 'let loading = true;\nconst fetchUser = (id: number) => Promise.resolve({ id });\nfetchUser(1)\n  .then((u) => console.log("got", u.id))\n  .___(() => { loading = false; console.log("loading:", loading); });',
      options: ["finally", "always", "done"],
      answer: 0,
      explain: L(
        "finally runs whether the promise succeeds or fails, so loading never gets stuck at true after an error.",
        "finally corre tanto si la promesa sale bien como si falla: loading nunca queda atascado en true tras un error.",
        "finally は成功でも失敗でも動く。だからエラー後に loading が true のまま残らないよ。",
      ),
      check: { compiles: true, stdout: "got 1\nloading: false", wrongFail: true },
      setup: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "loading", value: "true" }],
      win: [{ t: "value", actor: "hero", text: "false" }, { t: "print", text: "loading: false" }],
    },
    {
      kind: "type",
      prompt: L("Create the object that can cancel a fetch", "Crea el objeto que puede cancelar un fetch", "fetch を取り消せるオブジェクトを作ろう"),
      code: "const controller = new ___();\nconst signal = controller.signal;",
      answer: "AbortController",
      explain: L(
        "AbortController gives you a signal to pass to fetch and an abort() to cancel it.",
        "AbortController te da un signal para pasar a fetch y un abort() para cancelarlo.",
        "AbortController は fetch に渡す signal と、取り消し用の abort() をくれるよ。",
      ),
      check: { compiles: true },
      setup: [{ t: "enter", actor: "hero" }],
      win: [{ t: "item", kind: "key", holder: "hero" }],
    },
    say(L(
      "In real apps, prefer your framework's data loader or a caching library: they handle races, caching and retries for you.",
      "En apps reales, prefiere el cargador de datos de tu framework o una librería de caché: manejan carreras, caché y reintentos.",
      "実際のアプリではフレームワークのローダーやキャッシュ用ライブラリがおすすめ。競合もキャッシュも任せられる。",
    )),
    {
      kind: "run",
      prompt: L("Ignore the late reply so user 2 stays on screen", "Ignora la respuesta tardía para que quede user 2", "遅い返事を無視して user 2 を表示しよう"),
      starter:
        'const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));\nlet shown = "";\nfunction load(id: number, delay: number) {\n  let ignore = false;\n  wait(delay).then(() => { shown = "user " + id; });\n  return () => { ignore = true; };\n}\nconst cleanup1 = load(1, 30);\ncleanup1(); // the id changed before user 1 arrived\nload(2, 10);\nsetTimeout(() => console.log(shown), 50);',
      solution:
        'const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));\nlet shown = "";\nfunction load(id: number, delay: number) {\n  let ignore = false;\n  wait(delay).then(() => { if (!ignore) shown = "user " + id; });\n  return () => { ignore = true; };\n}\nconst cleanup1 = load(1, 30);\ncleanup1(); // the id changed before user 1 arrived\nload(2, 10);\nsetTimeout(() => console.log(shown), 50);',
      expect: "user 2",
      fallback: ["if\\s*\\(\\s*!\\s*ignore\\s*\\)", "!\\s*ignore\\s*&&", "ignore\\s*\\?"],
      explain: L(
        "The cleanup already set ignore = true, but nobody read it. Checking !ignore before writing drops the stale reply.",
        "La limpieza ya ponía ignore = true, pero nadie lo leía. Revisar !ignore antes de escribir descarta la respuesta vieja.",
        "片付けで ignore = true になっていたのに誰も見ていなかった。書く前に !ignore を確かめれば古い返事を捨てられる。",
      ),
    },
  ],
};

// ─── 3.4 effects you don't need ────────────────────────────────────────────
const VISIBLE_EFFECT =
  'function Visible({ todos }: { todos: Todo[] }) {\n  const [visible, setVisible] = useState<Todo[]>([]);\n  useEffect(() => {\n    setVisible(todos.filter(t => !t.done));\n  }, [todos]);\n  return <ul>{visible.map(t => <li key={t.id}>{t.text}</li>)}</ul>;\n}\nconsole.log(renderToStaticMarkup(<Visible todos={[{ id: 1, text: "Train", done: false }]} />));';

const effectsYouDontNeed: LessonDef = {
  slug: "effects-you-dont-need",
  title: L("Fewer chores", "Menos tareas", "用事を減らそう"),
  concept: "effects",
  mode: "lesson",
  xp: 82,
  enemy: "react/key-twins",
  enemyName: L("ECHO TWINS", "GEMELOS ECO", "こだま双子"),
  beats: [
    say(L(
      "Effects are for syncing with OUTSIDE systems. If you can compute something from props or state, do it during render.",
      "Los efectos son para sincronizar con sistemas EXTERNOS. Si puedes calcular algo desde props o estado, hazlo al renderizar.",
      "副作用は「外の」システムと同期するためのもの。props や状態から計算できるなら、レンダー中に計算しよう。",
    )),
    {
      kind: "act",
      prompt: L("Compare an effect copy with a computed value", "Compara una copia con efecto y un valor calculado", "副作用でのコピーと計算した値を比べよう"),
      setup: [{ t: "enter", actor: "hero" }],
      steps: [
        { label: L("COPY STATE", "COPIAR ESTADO", "状態にコピー"), line: "const [visible, setVisible] = useState<Todo[]>([]);", effects: [{ t: "banner", text: RENDER }, { t: "print", text: "<ul></ul>" }] },
        { label: L("SYNC EFFECT", "EFECTO SYNC", "同期の副作用"), line: "useEffect(() => setVisible(todos.filter(t => !t.done)), [todos]);", effects: [{ t: "say", actor: "hero", text: L("Extra chore...", "Tarea extra...", "余計な用事…") }, { t: "banner", text: L("RENDER AGAIN", "OTRO RENDER", "再レンダー") }, { t: "shake" }] },
        { label: L("ERASE BOTH", "BORRAR AMBOS", "両方消す"), effects: [{ t: "drop" }] },
        { label: L("COMPUTE", "CALCULAR", "計算する"), line: "const visible = todos.filter(t => !t.done);", effects: [{ t: "banner", text: L("ONE RENDER", "UN RENDER", "1回で描画") }, { t: "print", text: "<ul><li>Train</li></ul>" }] },
      ],
    },
    {
      kind: "pick",
      prompt: L("Derive the visible todos", "Deriva las tareas visibles", "表示する todo を導き出そう"),
      code: "function List({ todos }: { todos: Todo[] }) {\n  const visible = ___;\n  return <ul>{visible.map(t => <li key={t.id}>{t.text}</li>)}</ul>;\n}",
      options: ["todos.filter(t => !t.done)", "useState<Todo[]>([])[0]"],
      answer: 0,
      explain: L(
        "Data computed from props needs no state and no effect. It's always in sync and renders correctly the first time.",
        "Los datos calculados desde props no necesitan estado ni efecto. Siempre están sincronizados y salen bien desde el primer render.",
        "props から計算できるデータに状態も副作用もいらない。常に同期していて、最初から正しく描画されるよ。",
      ),
      check: { program: prog("function List({ todos }: { todos: Todo[] }) {\n  const visible = ___;\n  return <ul>{visible.map(t => <li key={t.id}>{t.text}</li>)}</ul>;\n}", "todos.filter(t => !t.done)", TODO), compiles: true },
      setup: [{ t: "enter", actor: "hero" }, { t: "item", kind: "scroll", holder: "hero" }],
      win: [{ t: "print", text: "<ul><li>Train</li></ul>" }],
    },
    {
      kind: "predict",
      prompt: L("Where should the Buy analytics go?", "¿Dónde va la analítica de Comprar?", "購入の計測はどこに書く？"),
      code: 'function handleBuy() {\n  setBought(true);\n  post("/analytics", { event: "buy" });\n}',
      options: [
        L("Here, in the click handler", "Aquí, en el handler del clic", "ここ、クリックのハンドラ"),
        L("In an effect watching bought", "En un efecto que vigile bought", "bought を監視する副作用"),
      ],
      answer: 0,
      explain: L(
        "It happens because the user clicked, so it belongs in the handler. An effect would also fire on any other change to bought.",
        "Ocurre porque el usuario hizo clic, así que va en el handler. Un efecto también saltaría con cualquier otro cambio de bought.",
        "ユーザーがクリックしたから起きる処理なのでハンドラに書く。副作用だと bought の他の変化でも動いてしまう。",
      ),
      check: { program: comp('  const [bought, setBought] = useState(false);\n  function handleBuy() {\n    setBought(true);\n    post("/analytics", { event: "buy" });\n  }', undefined, "declare function post(url: string, body: object): void;\n"), compiles: true },
      setup: [{ t: "enter", actor: "hero" }],
      win: [{ t: "say", actor: "hero", text: L("Sent on click!", "¡Enviado al clic!", "クリックで送信!") }],
    },
    {
      kind: "pick",
      prompt: L("The filter is slow. Cache it between renders", "El filtro es lento. Guárdalo entre renders", "フィルタが重い。レンダー間でキャッシュ"),
      code: "const visible = ___(() => filterTodos(todos, tab), [todos, tab]);",
      options: ["useMemo", "useEffect"],
      answer: 0,
      explain: L(
        "useMemo returns the cached result until todos or tab change. useEffect returns nothing and runs after render.",
        "useMemo devuelve el resultado guardado hasta que cambien todos o tab. useEffect no devuelve nada y corre tras el render.",
        "useMemo は todos か tab が変わるまで結果を使い回す。useEffect は値を返さずレンダー後に動くだけ。",
      ),
      check: { program: comp("  const visible = ___(() => filterTodos(todos, tab), [todos, tab]);", "useMemo", TODO + "declare function filterTodos(t: Todo[], tab: string): Todo[];\n", '  const todos: Todo[] = [];\n  const tab = "all";\n'), compiles: true },
      setup: [{ t: "enter", actor: "hero" }, { t: "item", kind: "shield", holder: "hero" }],
      win: [{ t: "say", actor: "hero", text: L("Cached!", "¡En caché!", "キャッシュ済み!") }],
    },
    say(L(
      "Need to reset ALL state when a prop changes? Don't sync it in an effect: give the component a key. A new key means a fresh component.",
      "¿Reiniciar TODO el estado cuando cambia una prop? No lo sincronices con un efecto: dale una key. Key nueva, componente nuevo.",
      "prop が変わったら状態を全部リセット？副作用で同期せず key を渡そう。key が変われば新しい部品になる。",
    )),
    {
      kind: "type",
      prompt: L("Reset the form when the user changes", "Reinicia el formulario al cambiar de usuario", "ユーザーが変わったらフォームをリセット"),
      code: "<Profile userId={userId} ___={userId} />",
      answer: "key",
      explain: L(
        "When key changes, React throws away the old Profile and its state, and mounts a brand-new one.",
        "Cuando cambia la key, React descarta el Profile viejo con su estado y monta uno nuevo.",
        "key が変わると React は古い Profile を状態ごと捨て、新しいものをマウントするよ。",
      ),
      check: { program: prog("function Profile({ userId }: { userId: number }) {\n  const [note] = useState(\"\");\n  return <p>{userId}{note}</p>;\n}\nconst userId = 1;\nconst el = <Profile userId={userId} ___={userId} />;", "key"), compiles: true },
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Profile" }],
      win: [{ t: "exit", actor: "ally" }, { t: "enter", actor: "ally" }, { t: "say", actor: "ally", text: L("Fresh start!", "¡Desde cero!", "まっさら!") }],
    },
    {
      kind: "predict",
      prompt: L("Static render: what prints?", "Render estático: ¿qué imprime?", "静的レンダー：何が出る？"),
      code: VISIBLE_EFFECT,
      options: ["<ul></ul>", "<ul><li>Train</li></ul>"],
      answer: 0,
      output: "<ul></ul>",
      explain: L(
        "The first render uses the empty initial state, and the effect never runs on the server. The list only fills on a second render.",
        "El primer render usa el estado inicial vacío y el efecto nunca corre en el servidor. La lista solo se llena en un segundo render.",
        "最初のレンダーは空の初期状態を使い、サーバーでは副作用が動かない。リストは2回目のレンダーでやっと埋まる。",
      ),
      check: { program: prog(VISIBLE_EFFECT, undefined, TODO), compiles: true, stdout: "<ul></ul>" },
      setup: [{ t: "enter", actor: "hero" }, { t: "tag", actor: "hero", text: "Visible" }],
      win: [{ t: "print", text: "<ul></ul>" }, { t: "shake" }],
    },
    {
      kind: "pick",
      prompt: L("Subscribe to an outside store", "Suscríbete a un store externo", "外部ストアを購読しよう"),
      code: "const online = ___(subscribe, () => navigator.onLine);",
      options: ["useSyncExternalStore", "useEffect"],
      answer: 0,
      explain: L(
        "useSyncExternalStore reads an outside source and re-renders when it changes, without copying it into state by hand.",
        "useSyncExternalStore lee una fuente externa y re-renderiza cuando cambia, sin copiarla a mano en el estado.",
        "useSyncExternalStore は外部の値を読み、変われば再レンダーする。手で状態にコピーしなくていい。",
      ),
      check: { program: comp("  const online = ___(subscribe, () => navigator.onLine);", "useSyncExternalStore", "declare function subscribe(cb: () => void): () => void;\n"), compiles: true },
      setup: [{ t: "enter", actor: "ally" }],
      win: [{ t: "lend", to: "ally" }],
    },
    say(L(
      "Rule of thumb: if it's caused by a click, use the handler. If it's computed from what you have, use render. Effects are the last resort.",
      "Regla práctica: si lo causa un clic, usa el handler. Si se calcula con lo que tienes, usa el render. Los efectos son el último recurso.",
      "目安：クリックが原因ならハンドラ、手元の値から計算できるならレンダー。副作用は最後の手段だよ。",
    )),
    {
      kind: "run",
      prompt: L("Delete the state and effect: compute the list", "Borra estado y efecto: calcula la lista", "状態と副作用を消してリストを計算しよう"),
      starter: H + TODO + VISIBLE_EFFECT,
      solution:
        H + TODO +
        'function Visible({ todos }: { todos: Todo[] }) {\n  const visible = todos.filter(t => !t.done);\n  return <ul>{visible.map(t => <li key={t.id}>{t.text}</li>)}</ul>;\n}\nconsole.log(renderToStaticMarkup(<Visible todos={[{ id: 1, text: "Train", done: false }]} />));',
      expect: "<ul><li>Train</li></ul>",
      fallback: ["const\\s+visible\\s*=\\s*todos\\.filter", "visible\\s*=\\s*useMemo"],
      explain: L(
        "The list is derived from todos, so compute it during render. It's right on the first render, even on the server.",
        "La lista se deriva de todos: calcúlala al renderizar. Sale bien desde el primer render, incluso en el servidor.",
        "リストは todos から導けるのでレンダー中に計算しよう。サーバーでも最初のレンダーから正しく出る。",
      ),
    },
  ],
};

// ─── boss ──────────────────────────────────────────────────────────────────
const RESIZE = "declare const onResize: () => void;\n";
const ABORT_LINES = [
  "useEffect(() => {",
  "  const controller = new AbortController();",
  "  fetch(url, { signal: controller.signal }).then(r => r.json()).then(setData);",
  "  return () => controller.abort();",
  "}, [url]);",
];
const TOTAL =
  "function Total({ prices }: { prices: number[] }) {\n  const [total, setTotal] = useState(0);\n  useEffect(() => setTotal(prices.reduce((a, b) => a + b, 0)), [prices]);\n  return <p>{total}</p>;\n}\nconsole.log(renderToStaticMarkup(<Total prices={[2, 3]} />));";

const effectBasilisk: LessonDef = {
  slug: "effect-basilisk",
  title: L("The Effect Basilisk", "El Basilisco de Efectos", "副作用バジリスク"),
  concept: "effects",
  mode: "boss",
  xp: 190,
  enemy: "react/stale-closure",
  enemyName: L("BASILISK", "BASILISCO", "バジリスク"),
  beats: [
    enemySays(L(
      "My gaze freezes your closures in amber. Your timers will count to 1 forever!",
      "Mi mirada congela tus closures en ámbar. ¡Tus timers contarán hasta 1 para siempre!",
      "我が視線はクロージャを琥珀に閉じ込める。タイマーは永遠に 1 までしか数えぬ！",
    )),
    {
      kind: "predict",
      time: 14,
      prompt: L("After 5 seconds the counter shows…", "Tras 5 segundos el contador muestra…", "5 秒後、カウンターの表示は？"),
      code: STALE_INTERVAL,
      options: ["1", "5"],
      answer: 0,
      explain: L(
        "The [] effect keeps the first count (0), so every tick sets 1. Use setCount(c => c + 1).",
        "El efecto con [] guarda el primer count (0): cada tick pone 1. Usa setCount(c => c + 1).",
        "[] の副作用は最初の count（0）を持ち続け、毎回 1 をセットする。setCount(c => c + 1) を使おう。",
      ),
      check: { program: comp(STALE_INTERVAL, undefined, "", COUNT), compiles: true },
      win: HIT,
    },
    {
      kind: "pick",
      time: 12,
      prompt: L("Fix the frozen counter", "Arregla el contador congelado", "止まったカウンターを直そう"),
      code: "setInterval(() => setCount(___), 1000);",
      options: ["c => c + 1", "count + 1"],
      answer: 0,
      explain: L(
        "The updater gets the latest state, so the stale count from the first render doesn't matter.",
        "El updater recibe el estado más reciente: el count viejo del primer render ya no importa.",
        "更新関数は最新の状態を受け取るので、最初のレンダーの古い count は関係なくなる。",
      ),
      check: { program: comp("  setInterval(() => setCount(___), 1000);", "c => c + 1", "", COUNT), compiles: true },
      win: HIT,
    },
    {
      kind: "predict",
      time: 15,
      prompt: WHAT_PRINTS,
      code: "const same = (a: unknown[], b: unknown[]) =>\n  a.length === b.length && a.every((x, i) => Object.is(x, b[i]));\nconsole.log(same([NaN], [NaN]), same([{}], [{}]));",
      options: ["true false", "false false", "true true"],
      answer: 0,
      output: "true false",
      explain: L(
        "Object.is treats NaN as equal to NaN, but two {} literals are different objects. That's how React compares dependencies.",
        "Object.is trata NaN como igual a NaN, pero dos {} son objetos distintos. Así compara React las dependencias.",
        "Object.is では NaN 同士は等しいが、2つの {} は別物。React も依存配列をこう比べるよ。",
      ),
      check: { compiles: true, stdout: "true false" },
      win: HIT,
    },
    {
      kind: "predict",
      time: 13,
      prompt: L("An object literal in the deps causes…", "Un objeto literal en las deps causa…", "依存配列にオブジェクトを書くと？"),
      code: "const options = { roomId };\nuseEffect(() => {\n  connect(options.roomId);\n}, [options]);",
      options: [
        L("A re-run after every render", "Repetirse tras cada render", "毎回のレンダー後に再実行"),
        L("Nothing special", "Nada especial", "特に何も起きない"),
      ],
      answer: 0,
      explain: L(
        "options is a new object each render, so Object.is always says it changed. Depend on roomId instead.",
        "options es un objeto nuevo en cada render: Object.is siempre dice que cambió. Depende de roomId.",
        "options は毎回新しいので Object.is は常に「変わった」と判定する。roomId に依存しよう。",
      ),
      check: { program: comp("  const options = { roomId };\n  useEffect(() => {\n    connect(options.roomId);\n  }, [options]);", undefined, ROOM, '  const roomId = "music";\n'), compiles: true },
      win: HIT,
    },
    {
      kind: "predict",
      time: 14,
      prompt: L("No cleanup, and onResize changes often…", "Sin limpieza y onResize cambia seguido…", "片付けなし、onResize が頻繁に変わると？"),
      code: 'useEffect(() => {\n  window.addEventListener("resize", onResize);\n}, [onResize]);',
      options: [
        L("Listeners pile up: a leak", "Los listeners se acumulan: fuga", "リスナーが溜まる：リーク"),
        L("React removes them for you", "React los quita por ti", "React が自動で外す"),
      ],
      answer: 0,
      explain: L(
        "Each run adds one more listener and none is removed. Return () => window.removeEventListener(...) from the effect.",
        "Cada ejecución suma otro listener y ninguno se quita. Devuelve () => window.removeEventListener(...) desde el efecto.",
        "実行のたびにリスナーが増え、外されない。副作用から () => window.removeEventListener(...) を返そう。",
      ),
      check: { program: comp('  useEffect(() => {\n    window.addEventListener("resize", onResize);\n  }, [onResize]);', undefined, RESIZE), compiles: true },
      win: HIT,
    },
    {
      kind: "pick",
      time: 13,
      prompt: L("Write the missing cleanup", "Escribe la limpieza que falta", "足りない片付けを書こう"),
      code: 'return () => window.___("resize", onResize);',
      options: ["removeEventListener", "addEventListener"],
      answer: 0,
      explain: L(
        "The cleanup must undo exactly what the effect did: remove the same listener it added.",
        "La limpieza debe deshacer justo lo que hizo el efecto: quitar el mismo listener que agregó.",
        "片付けは副作用がしたことをちょうど元に戻す。追加したのと同じリスナーを外そう。",
      ),
      check: { program: comp('  useEffect(() => {\n    window.addEventListener("resize", onResize);\n    return () => window.___("resize", onResize);\n  }, []);', "removeEventListener", RESIZE), compiles: true },
      win: HIT,
    },
    {
      kind: "order",
      time: 15,
      prompt: L("Order a fetch that can be cancelled", "Ordena un fetch que se pueda cancelar", "取り消せる fetch を並べよう"),
      lines: ABORT_LINES,
      explain: L(
        "Create the controller, pass its signal to fetch, and abort in the cleanup when url changes or the component leaves.",
        "Crea el controller, pasa su signal a fetch y aborta en la limpieza cuando cambie url o se vaya el componente.",
        "controller を作り signal を fetch に渡す。url が変わるか部品が消えたら片付けで abort しよう。",
      ),
      check: { program: comp(ABORT_LINES.join("\n"), undefined, "", '  const url = "/api";\n  const [data, setData] = useState<unknown>(null);\n'), compiles: true },
      win: HIT,
    },
    {
      kind: "predict",
      time: 13,
      prompt: L("In dev, an effect runs twice on mount. Why?", "En desarrollo, un efecto corre dos veces. ¿Por qué?", "開発中、副作用が2回動く。なぜ？"),
      code: "<StrictMode>\n  <App />\n</StrictMode>",
      options: [
        L("StrictMode tests your cleanup", "StrictMode prueba tu limpieza", "StrictMode が片付けを試す"),
        L("A bug in React", "Un bug de React", "React のバグ"),
      ],
      answer: 0,
      explain: L(
        "StrictMode mounts, unmounts and mounts again in development only, to expose effects without a proper cleanup.",
        "StrictMode monta, desmonta y vuelve a montar solo en desarrollo, para exponer efectos sin limpieza correcta.",
        "StrictMode は開発中だけ マウント→アンマウント→再マウント して、片付けのない副作用をあぶり出す。",
      ),
      check: { program: prog("function App() {\n  return <p>hi</p>;\n}\nconst el = <StrictMode>\n  <App />\n</StrictMode>;"), compiles: true },
      win: HIT,
    },
    {
      kind: "pick",
      time: 12,
      prompt: L("Keep a value with no re-render", "Guarda un valor sin re-renderizar", "再レンダーなしで値を保持"),
      code: "const timerId = ___<number | null>(null);",
      options: ["useRef", "useState"],
      answer: 0,
      explain: L(
        "A ref survives renders and changing ref.current never triggers one. Perfect for ids the screen doesn't show.",
        "Un ref sobrevive renders y cambiar ref.current nunca provoca uno. Ideal para ids que no se muestran.",
        "ref はレンダーをまたいで残り、ref.current を変えても再レンダーしない。画面に出ない ID に最適。",
      ),
      check: { program: comp("  const timerId = ___<number | null>(null);", "useRef"), compiles: true },
      win: HIT,
    },
    {
      kind: "predict",
      time: 15,
      prompt: L("Static render: what prints?", "Render estático: ¿qué imprime?", "静的レンダー：何が出る？"),
      code: TOTAL,
      options: ["<p>0</p>", "<p>5</p>"],
      answer: 0,
      output: "<p>0</p>",
      explain: L(
        "The effect never runs on the server, so total keeps its initial 0. Compute the sum during render instead.",
        "El efecto nunca corre en el servidor: total queda en su 0 inicial. Calcula la suma al renderizar.",
        "サーバーでは副作用が動かず total は初期値 0 のまま。合計はレンダー中に計算しよう。",
      ),
      check: { program: prog(TOTAL), compiles: true, stdout: "<p>0</p>" },
      win: HIT,
    },
    {
      kind: "type",
      time: 14,
      prompt: L("Drop the late reply", "Descarta la respuesta tardía", "遅い返事を捨てよう"),
      code: "fetchUser(id).then(u => {\n  if (!___) setUser(u);\n});",
      answer: "ignore",
      explain: L(
        "The cleanup sets ignore = true when id changes, so the old request can't overwrite the new user.",
        "La limpieza pone ignore = true cuando id cambia: la petición vieja no pisa al nuevo usuario.",
        "id が変わると片付けで ignore = true になり、古いリクエストが新しいユーザーを上書きできない。",
      ),
      check: { program: comp("  useEffect(() => {\n    let ignore = false;\n    fetchUser(id).then(u => {\n      if (!___) setUser(u);\n    });\n    return () => { ignore = true; };\n  }, [id]);", "ignore", USER, USER_STATE), compiles: true },
      win: HIT,
    },
    enemySays(L(
      "My amber... cracked! Your effects clean up after themselves...",
      "Mi ámbar... ¡se agrietó! Tus efectos limpian lo que ensucian...",
      "琥珀が…割れた！お前の副作用はちゃんと後片付けをする…",
    )),
  ],
};

export const effectPeaks: RegionDef = {
  slug: "effect-peaks",
  name: L("Effect Peaks", "Picos del Efecto", "エフェクト山"),
  subtitle: L("Effects, cleanup, refs, data fetching", "Efectos, limpieza, refs, datos", "副作用・片付け・ref・データ取得"),
  theme: "mountain",
  status: "active",
  lessons: [effectsAndCleanup, staleClosuresAndRefs, dataFetching, effectsYouDontNeed, effectBasilisk],
};
