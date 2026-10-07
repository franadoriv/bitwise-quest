import type { CodeTaskBeat, ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Coding tasks for moon Reactia (React). Code is TSX run by the browser runner: the tests are
// appended after the player's file and print with console.log. Components are tested with a static
// render (renderToStaticMarkup), where effects and handlers never run, so state logic (reducers,
// derived data, comparisons) is tested as plain functions. Any implementation that passes is accepted.

/** Every starter and solution begins with these imports, so the tests can render JSX. */
const IMPORTS = 'import React from "react";\nimport { renderToStaticMarkup } from "react-dom/server";\n\n';
const tsx = (code: string) => IMPORTS + code;

// ─── REGION BOSSES (mini projects) ──────────────────────────────────────────

/** JSX Village boss: a list with keys and conditional UI. */
export const inventoryTask: CodeTaskBeat = {
  slug: "inventory",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: show the loot bag", "Mini proyecto: muestra la bolsa de botín", "ミニ課題：戦利品の袋を表示"),
  brief: L(
    "Write Inventory({ items }). Each item is { id, name, qty }. Render a <ul> with one <li> per item as \"name xqty\" (e.g. gem x2), with a key. Skip items with qty 0. If nothing is left to show, render <p>Empty bag</p> instead. Watch out for stray zeros!",
    "Escribe Inventory({ items }). Cada item es { id, name, qty }. Renderiza un <ul> con un <li> por item como \"name xqty\" (p. ej. gem x2), con key. Omite los items con qty 0. Si no queda nada que mostrar, renderiza <p>Empty bag</p>. ¡Cuidado con los ceros sueltos!",
    "Inventory({ items }) を書こう。item は { id, name, qty }。<ul> に item ごとの <li> を key 付きで「name xqty」（例 gem x2）と描く。qty 0 は出さない。表示するものがなければ <p>Empty bag</p> を描く。はぐれ 0 に注意！",
  ),
  starter: tsx("type Item = { id: number; name: string; qty: number };\n\nfunction Inventory({ items }: { items: Item[] }) {\n  // your code here\n  return null;\n}\n"),
  solution: tsx("type Item = { id: number; name: string; qty: number };\n\nfunction Inventory({ items }: { items: Item[] }) {\n  const shown = items.filter((item) => item.qty > 0);\n  if (shown.length === 0) return <p>Empty bag</p>;\n  return (\n    <ul>\n      {shown.map((item) => (\n        <li key={item.id}>{item.name} x{item.qty}</li>\n      ))}\n    </ul>\n  );\n}\n"),
  nearMiss: [
    // Checks for an empty bag before filtering: a bag of zeros renders an empty <ul>.
    tsx("type Item = { id: number; name: string; qty: number };\n\nfunction Inventory({ items }: { items: Item[] }) {\n  if (items.length === 0) return <p>Empty bag</p>;\n  return (\n    <ul>\n      {items.filter((item) => item.qty > 0).map((item) => (\n        <li key={item.id}>{item.name} x{item.qty}</li>\n      ))}\n    </ul>\n  );\n}\n"),
    // `qty && ...` renders the 0 itself.
    tsx("type Item = { id: number; name: string; qty: number };\n\nfunction Inventory({ items }: { items: Item[] }) {\n  if (items.length === 0) return <p>Empty bag</p>;\n  return (\n    <ul>\n      {items.map((item) => item.qty && <li key={item.id}>{item.name} x{item.qty}</li>)}\n    </ul>\n  );\n}\n"),
  ],
  tests: [
    { run: 'console.log(renderToStaticMarkup(<Inventory items={[{ id: 1, name: "gem", qty: 2 }, { id: 2, name: "key", qty: 0 }, { id: 3, name: "map", qty: 1 }]} />));', expect: "<ul><li>gem x2</li><li>map x1</li></ul>" },
    { run: "console.log(renderToStaticMarkup(<Inventory items={[]} />));", expect: "<p>Empty bag</p>" },
    { run: 'console.log(renderToStaticMarkup(<Inventory items={[{ id: 1, name: "rope", qty: 0 }, { id: 2, name: "lamp", qty: 0 }]} />));', expect: "<p>Empty bag</p>", hidden: true },
    { run: 'console.log(renderToStaticMarkup(<Inventory items={[{ id: 7, name: "coin", qty: 0 }, { id: 8, name: "orb", qty: 5 }]} />));', expect: "<ul><li>orb x5</li></ul>", hidden: true },
  ],
  hint: L(
    "Decide what to show before you decide how: work out the visible items first, then pick the list or the message.",
    "Decide qué mostrar antes de decidir cómo: primero calcula los items visibles y luego elige la lista o el mensaje.",
    "どう描くかの前に何を見せるかを決めよう。先に見せる item を出してから、リストかメッセージかを選ぶ。",
  ),
  note: "recap-conditional",
  explain: L(
    "Filter out qty 0 first, then check if anything is left. `qty && <li>` would render the 0 itself.",
    "Primero filtra los qty 0 y luego mira si queda algo. `qty && <li>` renderizaría el propio 0.",
    "先に qty 0 を除き、残りがあるか確かめる。`qty && <li>` だと 0 そのものが描かれる。",
  ),
};

/** State Forest boss: replay React's state update queue. */
export const applyQueueTask: CodeTaskBeat = {
  slug: "apply-queue",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: replay the update queue", "Mini proyecto: reproduce la cola de cambios", "ミニ課題：更新キューを再生"),
  brief: L(
    "Write applyQueue(start, queue), like React does with the setter calls of one event. start is a number; queue is a list of updates, each a number or a function. Go through them in order: a number replaces the running value, a function receives the running value and returns the next one. Return the final value. An empty queue returns start.",
    "Escribe applyQueue(start, queue), como hace React con las llamadas al setter de un evento. start es un número; queue es una lista de cambios, cada uno un número o una función. Recórrelos en orden: un número reemplaza el valor acumulado y una función recibe el valor acumulado y devuelve el siguiente. Devuelve el valor final. Una cola vacía devuelve start.",
    "applyQueue(start, queue) を書こう。1つのイベントでのセッター呼び出しを React が処理するのと同じ。start は数、queue は数か関数の更新リスト。順に処理し、数は途中の値を置きかえ、関数は途中の値を受け取って次の値を返す。最終値を返す。空のキューなら start。",
  ),
  starter: tsx("type Update = number | ((prev: number) => number);\n\nfunction applyQueue(start: number, queue: Update[]): number {\n  // your code here\n  return start;\n}\n"),
  solution: tsx('type Update = number | ((prev: number) => number);\n\nfunction applyQueue(start: number, queue: Update[]): number {\n  let value = start;\n  for (const update of queue) {\n    value = typeof update === "function" ? update(value) : update;\n  }\n  return value;\n}\n'),
  nearMiss: [
    // Every updater sees the snapshot (start) instead of the running value.
    tsx('type Update = number | ((prev: number) => number);\n\nfunction applyQueue(start: number, queue: Update[]): number {\n  let value = start;\n  for (const update of queue) {\n    value = typeof update === "function" ? update(start) : update;\n  }\n  return value;\n}\n'),
    // A truthiness check skips the update 0.
    tsx('type Update = number | ((prev: number) => number);\n\nfunction applyQueue(start: number, queue: Update[]): number {\n  let value = start;\n  for (const update of queue) {\n    if (update) value = typeof update === "function" ? update(value) : update;\n  }\n  return value;\n}\n'),
  ],
  tests: [
    { run: "console.log(applyQueue(0, [(n) => n + 1, (n) => n + 1, (n) => n + 1]));", expect: "3" },
    { run: "console.log(applyQueue(5, [10, (n) => n * 2]));", expect: "20" },
    { run: "console.log(applyQueue(0, []));", expect: "0", hidden: true },
    { run: "console.log(applyQueue(1, [(n) => n + 1, 7, (n) => n + 1]));", expect: "8", hidden: true },
    { run: "console.log(applyQueue(4, [0]));", expect: "0", hidden: true },
  ],
  hint: L(
    "Keep one running value. Each update works on that value, never on the snapshot you started with.",
    "Lleva un valor acumulado. Cada cambio trabaja sobre ese valor, nunca sobre la foto inicial.",
    "途中の値を1つ持とう。各更新はその値に作用し、最初のスナップショットには作用しない。",
  ),
  note: "recap-queue",
  explain: L(
    "Loop with a running value: a number replaces it, a function gets it. Check typeof, not truthiness, so 0 still counts.",
    "Recorre con un valor acumulado: un número lo reemplaza, una función lo recibe. Usa typeof, no veracidad, para que 0 cuente.",
    "途中の値でループ。数なら置きかえ、関数なら渡す。真偽ではなく typeof で判定すれば 0 も数える。",
  ),
};

/** Effect Peaks boss: React's dependency-array comparison. */
export const shouldRunEffectTask: CodeTaskBeat = {
  slug: "should-run-effect",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: should the effect run?", "Mini proyecto: ¿se ejecuta el efecto?", "ミニ課題：副作用は走る？"),
  brief: L(
    "Write shouldRunEffect(prev, next), the check React makes after each render. next is the new dependency array (undefined when the effect has none); prev is the array from the last run (undefined on the first render). Return true when there is no array, on the first render, or when the lengths differ or any item changed. Compare items like React: with Object.is, never by content.",
    "Escribe shouldRunEffect(prev, next), la comprobación que hace React tras cada render. next es el nuevo array de dependencias (undefined si el efecto no tiene); prev es el de la última ejecución (undefined en el primer render). Devuelve true si no hay array, en el primer render, o si los largos difieren o algún elemento cambió. Compara como React: con Object.is, nunca por contenido.",
    "shouldRunEffect(prev, next) を書こう。React が毎レンダー後に行う判定だ。next は新しい依存配列（なければ undefined）、prev は前回実行時の配列（初回は undefined）。配列がない、初回、長さが違う、どれかの要素が変わった、のどれかなら true。比較は React と同じく Object.is で、中身では比べない。",
  ),
  starter: tsx("function shouldRunEffect(prev: unknown[] | undefined, next: unknown[] | undefined): boolean {\n  // your code here\n  return false;\n}\n"),
  solution: tsx("function shouldRunEffect(prev: unknown[] | undefined, next: unknown[] | undefined): boolean {\n  if (next === undefined || prev === undefined) return true;\n  if (prev.length !== next.length) return true;\n  return next.some((dep, i) => !Object.is(dep, prev[i]));\n}\n"),
  nearMiss: [
    // Compares by content: a new object with the same fields looks unchanged.
    tsx("function shouldRunEffect(prev: unknown[] | undefined, next: unknown[] | undefined): boolean {\n  if (next === undefined || prev === undefined) return true;\n  return JSON.stringify(prev) !== JSON.stringify(next);\n}\n"),
    // === treats NaN as always changed.
    tsx("function shouldRunEffect(prev: unknown[] | undefined, next: unknown[] | undefined): boolean {\n  if (next === undefined || prev === undefined) return true;\n  if (prev.length !== next.length) return true;\n  return next.some((dep, i) => dep !== prev[i]);\n}\n"),
  ],
  tests: [
    { run: 'console.log(shouldRunEffect(undefined, [1]), shouldRunEffect([1, "a"], [1, "a"]));', expect: "true false" },
    { run: "console.log(shouldRunEffect([1], [2]));", expect: "true" },
    { run: "console.log(shouldRunEffect([], []), shouldRunEffect(undefined, undefined), shouldRunEffect([1], undefined));", expect: "false true true", hidden: true },
    { run: "console.log(shouldRunEffect([{ id: 1 }], [{ id: 1 }]));", expect: "true", hidden: true },
    { run: "const room = { id: 2 };\nconsole.log(shouldRunEffect([room, NaN], [room, NaN]));", expect: "false", hidden: true },
  ],
  hint: L(
    "Handle the missing arrays first. Then compare item by item by identity: a fresh object is a change.",
    "Resuelve primero los arrays que faltan. Luego compara elemento a elemento por identidad: un objeto nuevo es un cambio.",
    "まず配列がない場合を片付けよう。次に要素ごとに同一性で比べる。新しく作ったオブジェクトは変更だ。",
  ),
  note: "recap-deps",
  explain: L(
    "No array or first render: run. Otherwise run if the lengths differ or some item fails Object.is. Same-looking new objects count as changed.",
    "Sin array o primer render: se ejecuta. Si no, se ejecuta si los largos difieren o algún elemento falla Object.is. Objetos nuevos iguales cuentan como cambio.",
    "配列なしか初回なら実行。それ以外は長さが違うか Object.is で違う要素があれば実行。同じ形の新オブジェクトも変更扱い。",
  ),
};

/** Render Tower boss: the props comparison React.memo makes. */
export const shallowEqualTask: CodeTaskBeat = {
  slug: "shallow-equal",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: memo's props check", "Mini proyecto: la comparación de memo", "ミニ課題：memo の props 比較"),
  brief: L(
    "Write shallowEqual(a, b), the default check React.memo uses to skip a re-render. a and b are props objects. Return true only when both have exactly the same keys and every value is the same by Object.is. Don't look inside values: a new array with the same items is a different value.",
    "Escribe shallowEqual(a, b), la comprobación por defecto de React.memo para saltarse un render. a y b son objetos de props. Devuelve true solo si ambos tienen exactamente las mismas claves y cada valor es el mismo según Object.is. No mires dentro de los valores: un array nuevo con los mismos elementos es otro valor.",
    "shallowEqual(a, b) を書こう。React.memo が再レンダーを省くときの標準の比較だ。a と b は props オブジェクト。キーがまったく同じで、すべての値が Object.is で同じときだけ true。値の中は見ない。同じ要素の新しい配列は別の値。",
  ),
  starter: tsx("type Props = Record<string, unknown>;\n\nfunction shallowEqual(a: Props, b: Props): boolean {\n  // your code here\n  return true;\n}\n"),
  solution: tsx("type Props = Record<string, unknown>;\n\nfunction shallowEqual(a: Props, b: Props): boolean {\n  const keys = Object.keys(a);\n  if (keys.length !== Object.keys(b).length) return false;\n  return keys.every((k) => Object.hasOwn(b, k) && Object.is(a[k], b[k]));\n}\n"),
  nearMiss: [
    // Only walks a's keys: extra props in b go unnoticed.
    tsx("type Props = Record<string, unknown>;\n\nfunction shallowEqual(a: Props, b: Props): boolean {\n  return Object.keys(a).every((k) => Object.is(a[k], b[k]));\n}\n"),
    // Deep comparison by content: new arrays with the same items look equal.
    tsx("type Props = Record<string, unknown>;\n\nfunction shallowEqual(a: Props, b: Props): boolean {\n  return JSON.stringify(a) === JSON.stringify(b);\n}\n"),
  ],
  tests: [
    { run: 'console.log(shallowEqual({ a: 1, b: "x" }, { a: 1, b: "x" }), shallowEqual({ a: 1 }, { a: 2 }));', expect: "true false" },
    { run: "console.log(shallowEqual({ list: [1] }, { list: [1] }));", expect: "false" },
    { run: "console.log(shallowEqual({ a: 1 }, { a: 1, b: 2 }), shallowEqual({ a: 1, b: 2 }, { a: 1 }));", expect: "false false", hidden: true },
    { run: "console.log(shallowEqual({}, {}), shallowEqual({ a: undefined }, { b: undefined }));", expect: "true false", hidden: true },
    { run: "const onHit = () => 0;\nconsole.log(shallowEqual({ onHit, hp: NaN }, { onHit, hp: NaN }));", expect: "true", hidden: true },
  ],
  hint: L(
    "Compare the key counts first, then check each key exists on both sides with the very same value.",
    "Compara primero cuántas claves hay y luego que cada clave exista en ambos lados con exactamente el mismo valor.",
    "まずキーの数を比べ、次に各キーが両方にあり、値がまったく同じかを確かめよう。",
  ),
  note: "recap-memo",
  explain: L(
    "Same number of keys, each key present in b, each value Object.is-equal. A new array or object prop always breaks memo.",
    "Mismo número de claves, cada clave presente en b y cada valor igual por Object.is. Una prop array u objeto nueva siempre rompe memo.",
    "キー数が同じ、各キーが b にあり、値が Object.is で等しい。新しい配列やオブジェクトの props は必ず memo を破る。",
  ),
};

// ─── JUNIOR (ide) ────────────────────────────────────────────────────────────

export const navMenuTask: ExamQuestion = {
  slug: "nav-menu",
  kind: "code",
  mode: "ide",
  topic: "lists_keys",
  difficulty: 1,
  prompt: L("Coding: a navigation menu", "Código: un menú de navegación", "コーディング：ナビゲーションメニュー"),
  brief: L(
    "Write NavMenu({ links, current }). links is a list of { href, label }. Render <nav><ul> with one <li> per link (give it a key). Inside, render <a href={href}>{label}</a>, except for the link whose href equals current: show it as <span>{label}</span>. With no links, render <p>No pages</p>.",
    "Escribe NavMenu({ links, current }). links es una lista de { href, label }. Renderiza <nav><ul> con un <li> por link (con key). Dentro, renderiza <a href={href}>{label}</a>, salvo el link cuyo href es igual a current: muéstralo como <span>{label}</span>. Sin links, renderiza <p>No pages</p>.",
    "NavMenu({ links, current }) を書こう。links は { href, label } のリスト。<nav><ul> の中にリンクごとの <li>（key 付き）を描き、中身は <a href={href}>{label}</a>。ただし href が current と同じものは <span>{label}</span> にする。リンクがなければ <p>No pages</p>。",
  ),
  starter: tsx("type Link = { href: string; label: string };\n\nfunction NavMenu({ links, current }: { links: Link[]; current: string }) {\n  // your code here\n  return null;\n}\n"),
  solution: tsx("type Link = { href: string; label: string };\n\nfunction NavMenu({ links, current }: { links: Link[]; current: string }) {\n  if (links.length === 0) return <p>No pages</p>;\n  return (\n    <nav>\n      <ul>\n        {links.map((link) => (\n          <li key={link.href}>\n            {link.href === current ? <span>{link.label}</span> : <a href={link.href}>{link.label}</a>}\n          </li>\n        ))}\n      </ul>\n    </nav>\n  );\n}\n"),
  nearMiss: [
    // Forgets the empty case: renders an empty menu.
    tsx("type Link = { href: string; label: string };\n\nfunction NavMenu({ links, current }: { links: Link[]; current: string }) {\n  return (\n    <nav>\n      <ul>\n        {links.map((link) => (\n          <li key={link.href}>\n            {link.href === current ? <span>{link.label}</span> : <a href={link.href}>{link.label}</a>}\n          </li>\n        ))}\n      </ul>\n    </nav>\n  );\n}\n"),
    // Compares the label instead of the href.
    tsx("type Link = { href: string; label: string };\n\nfunction NavMenu({ links, current }: { links: Link[]; current: string }) {\n  if (links.length === 0) return <p>No pages</p>;\n  return (\n    <nav>\n      <ul>\n        {links.map((link) => (\n          <li key={link.href}>\n            {link.label === current ? <span>{link.label}</span> : <a href={link.href}>{link.label}</a>}\n          </li>\n        ))}\n      </ul>\n    </nav>\n  );\n}\n"),
  ],
  tests: [
    { run: 'console.log(renderToStaticMarkup(<NavMenu links={[{ href: "/", label: "Home" }, { href: "/shop", label: "Shop" }]} current="/" />));', expect: '<nav><ul><li><span>Home</span></li><li><a href="/shop">Shop</a></li></ul></nav>' },
    { run: 'console.log(renderToStaticMarkup(<NavMenu links={[]} current="/" />));', expect: "<p>No pages</p>" },
    { run: 'console.log(renderToStaticMarkup(<NavMenu links={[{ href: "/a", label: "A" }]} current="/zzz" />));', expect: '<nav><ul><li><a href="/a">A</a></li></ul></nav>', hidden: true },
    { run: 'console.log(renderToStaticMarkup(<NavMenu links={[{ href: "/", label: "Home" }, { href: "/faq", label: "FAQ" }, { href: "/help", label: "/faq" }]} current="/faq" />));', expect: '<nav><ul><li><a href="/">Home</a></li><li><span>FAQ</span></li><li><a href="/help">/faq</a></li></ul></nav>', hidden: true },
  ],
  explain: L(
    "Return <p>No pages</p> early when the list is empty. Otherwise map each link to a keyed <li> and compare its href with current.",
    "Devuelve <p>No pages</p> antes si la lista está vacía. Si no, mapea cada link a un <li> con key y compara su href con current.",
    "空なら先に <p>No pages</p> を返す。そうでなければ各リンクを key 付き <li> に map し、href を current と比べる。",
  ),
};

export const badgeTask: ExamQuestion = {
  slug: "badge",
  kind: "code",
  mode: "ide",
  topic: "components",
  difficulty: 1,
  prompt: L("Coding: a notification badge", "Código: una insignia de avisos", "コーディング：通知バッジ"),
  brief: L(
    "Write Badge({ label, count }). Render <div className=\"badge\"><span>{label}</span>…</div>. After the span, add <b>{count}</b> only when count is greater than 0; when count is over 99, the <b> shows \"99+\". Example: label Inbox, count 3 → <div class=\"badge\"><span>Inbox</span><b>3</b></div>.",
    "Escribe Badge({ label, count }). Renderiza <div className=\"badge\"><span>{label}</span>…</div>. Tras el span, agrega <b>{count}</b> solo si count es mayor que 0; si count pasa de 99, el <b> muestra \"99+\". Ejemplo: label Inbox, count 3 → <div class=\"badge\"><span>Inbox</span><b>3</b></div>.",
    "Badge({ label, count }) を書こう。<div className=\"badge\"><span>{label}</span>…</div> を描く。count が 0 より大きいときだけ span の後に <b>{count}</b> を足し、99 を超えたら <b> は「99+」。例：Inbox と 3 → <div class=\"badge\"><span>Inbox</span><b>3</b></div>。",
  ),
  starter: tsx("function Badge({ label, count }: { label: string; count: number }) {\n  // your code here\n  return null;\n}\n"),
  solution: tsx('function Badge({ label, count }: { label: string; count: number }) {\n  return (\n    <div className="badge">\n      <span>{label}</span>\n      {count > 0 && <b>{count > 99 ? "99+" : count}</b>}\n    </div>\n  );\n}\n'),
  nearMiss: [
    // `count && ...` renders a stray 0 (and shows negative counts).
    tsx('function Badge({ label, count }: { label: string; count: number }) {\n  return (\n    <div className="badge">\n      <span>{label}</span>\n      {count && <b>{count > 99 ? "99+" : count}</b>}\n    </div>\n  );\n}\n'),
    // Off by one: 99 already shows 99+.
    tsx('function Badge({ label, count }: { label: string; count: number }) {\n  return (\n    <div className="badge">\n      <span>{label}</span>\n      {count > 0 && <b>{count >= 99 ? "99+" : count}</b>}\n    </div>\n  );\n}\n'),
  ],
  tests: [
    { run: 'console.log(renderToStaticMarkup(<Badge label="Inbox" count={3} />));', expect: '<div class="badge"><span>Inbox</span><b>3</b></div>' },
    { run: 'console.log(renderToStaticMarkup(<Badge label="Inbox" count={0} />));', expect: '<div class="badge"><span>Inbox</span></div>' },
    { run: 'console.log(renderToStaticMarkup(<Badge label="Alerts" count={99} />));', expect: '<div class="badge"><span>Alerts</span><b>99</b></div>', hidden: true },
    { run: 'console.log(renderToStaticMarkup(<Badge label="Alerts" count={100} />));', expect: '<div class="badge"><span>Alerts</span><b>99+</b></div>', hidden: true },
    { run: 'console.log(renderToStaticMarkup(<Badge label="Spam" count={-2} />));', expect: '<div class="badge"><span>Spam</span></div>', hidden: true },
  ],
  explain: L(
    "Use a real boolean, count > 0 && <b>…</b>: count && … renders the 0. Then count > 99 picks \"99+\".",
    "Usa un booleano real, count > 0 && <b>…</b>: count && … renderiza el 0. Luego count > 99 elige \"99+\".",
    "count > 0 && <b>…</b> のように本物の真偽値を使う。count && … だと 0 が描かれる。次に count > 99 で「99+」。",
  ),
};

export const productCardTask: ExamQuestion = {
  slug: "product-card",
  kind: "code",
  mode: "ide",
  topic: "jsx",
  difficulty: 2,
  prompt: L("Coding: a product card with children", "Código: una tarjeta de producto con children", "コーディング：children 付き商品カード"),
  brief: L(
    "Write ProductCard({ name, cents, children }). Render <article> with <h3>{name}</h3>, then <p> with the price in dollars and always two decimals (1250 cents → $12.50, 5 → $0.05), then whatever children it receives. Without children, nothing comes after the price.",
    "Escribe ProductCard({ name, cents, children }). Renderiza <article> con <h3>{name}</h3>, luego un <p> con el precio en dólares y siempre dos decimales (1250 centavos → $12.50, 5 → $0.05), y luego los children que reciba. Sin children, no hay nada después del precio.",
    "ProductCard({ name, cents, children }) を書こう。<article> の中に <h3>{name}</h3>、次に価格をドルで常に小数2桁で表す <p>（1250 セント → $12.50、5 → $0.05）、その後に受け取った children を描く。children がなければ価格の後は何もない。",
  ),
  starter: tsx("function ProductCard({ name, cents, children }: { name: string; cents: number; children?: React.ReactNode }) {\n  // your code here\n  return null;\n}\n"),
  solution: tsx('function ProductCard({ name, cents, children }: { name: string; cents: number; children?: React.ReactNode }) {\n  return (\n    <article>\n      <h3>{name}</h3>\n      <p>{"$" + (cents / 100).toFixed(2)}</p>\n      {children}\n    </article>\n  );\n}\n'),
  nearMiss: [
    // No toFixed: 1250 prints $12.5.
    tsx('function ProductCard({ name, cents, children }: { name: string; cents: number; children?: React.ReactNode }) {\n  return (\n    <article>\n      <h3>{name}</h3>\n      <p>{"$" + cents / 100}</p>\n      {children}\n    </article>\n  );\n}\n'),
    // Forgets to place children.
    tsx('function ProductCard({ name, cents }: { name: string; cents: number; children?: React.ReactNode }) {\n  return (\n    <article>\n      <h3>{name}</h3>\n      <p>{"$" + (cents / 100).toFixed(2)}</p>\n    </article>\n  );\n}\n'),
  ],
  tests: [
    { run: 'console.log(renderToStaticMarkup(<ProductCard name="Tea" cents={1250} />));', expect: "<article><h3>Tea</h3><p>$12.50</p></article>" },
    { run: 'console.log(renderToStaticMarkup(<ProductCard name="Jam" cents={300}><em>New</em></ProductCard>));', expect: "<article><h3>Jam</h3><p>$3.00</p><em>New</em></article>" },
    { run: 'console.log(renderToStaticMarkup(<ProductCard name="Gum" cents={5} />));', expect: "<article><h3>Gum</h3><p>$0.05</p></article>", hidden: true },
    { run: 'console.log(renderToStaticMarkup(<ProductCard name="Box" cents={1999}><i>A</i><i>B</i></ProductCard>));', expect: "<article><h3>Box</h3><p>$19.99</p><i>A</i><i>B</i></article>", hidden: true },
  ],
  explain: L(
    "toFixed(2) always gives two decimals. children is just a prop: put {children} where the extra content goes.",
    "toFixed(2) siempre da dos decimales. children es solo una prop: pon {children} donde va el contenido extra.",
    "toFixed(2) は常に小数2桁。children はただの props なので、追加の中身を置く場所に {children} を書く。",
  ),
};

export const toggleTodoTask: ExamQuestion = {
  slug: "toggle-todo",
  kind: "code",
  mode: "ide",
  topic: "immutability",
  difficulty: 2,
  prompt: L("Coding: toggle a todo without mutating", "Código: alterna un todo sin mutar", "コーディング：変更せずに todo を切り替え"),
  brief: L(
    "Write toggleTodo(todos, id) for a state setter. Each todo is { id, text, done }. Return a NEW array where the todo with that id has done flipped (as a new object). Every other todo stays the very same object. Never modify the input. An unknown id gives a copy with the same todos.",
    "Escribe toggleTodo(todos, id) para un setter de estado. Cada todo es { id, text, done }. Devuelve un array NUEVO donde el todo con ese id tiene done invertido (como objeto nuevo). Los demás todos siguen siendo exactamente el mismo objeto. Nunca modifiques la entrada. Un id desconocido da una copia con los mismos todos.",
    "状態セッター用に toggleTodo(todos, id) を書こう。todo は { id, text, done }。その id の todo だけ done を反転した（新しいオブジェクトの）「新しい」配列を返す。他の todo はまったく同じオブジェクトのまま。入力は決して変えない。未知の id なら同じ todo のコピー。",
  ),
  starter: tsx("type Todo = { id: number; text: string; done: boolean };\n\nfunction toggleTodo(todos: Todo[], id: number): Todo[] {\n  // your code here\n  return todos;\n}\n"),
  solution: tsx("type Todo = { id: number; text: string; done: boolean };\n\nfunction toggleTodo(todos: Todo[], id: number): Todo[] {\n  return todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));\n}\n"),
  nearMiss: [
    // Flips done on the original object.
    tsx("type Todo = { id: number; text: string; done: boolean };\n\nfunction toggleTodo(todos: Todo[], id: number): Todo[] {\n  return todos.map((t) => {\n    if (t.id === id) t.done = !t.done;\n    return t;\n  });\n}\n"),
    // Deep-copies everything: untouched todos lose their identity.
    tsx("type Todo = { id: number; text: string; done: boolean };\n\nfunction toggleTodo(todos: Todo[], id: number): Todo[] {\n  const copy: Todo[] = JSON.parse(JSON.stringify(todos));\n  return copy.map((t) => (t.id === id ? { ...t, done: !t.done } : t));\n}\n"),
  ],
  tests: [
    { run: 'console.log(JSON.stringify(toggleTodo([{ id: 1, text: "a", done: false }, { id: 2, text: "b", done: true }], 2)));', expect: '[{"id":1,"text":"a","done":false},{"id":2,"text":"b","done":false}]' },
    { run: 'console.log(JSON.stringify(toggleTodo([{ id: 1, text: "a", done: false }], 9)));', expect: '[{"id":1,"text":"a","done":false}]' },
    { run: 'const list2 = [{ id: 1, text: "a", done: false }];\nconst next2 = toggleTodo(list2, 1);\nconsole.log(list2[0].done, next2 !== list2, next2[0].done);', expect: "false true true", hidden: true },
    { run: 'const list3 = [{ id: 1, text: "a", done: false }, { id: 2, text: "b", done: false }];\nconst next3 = toggleTodo(list3, 2);\nconsole.log(next3[0] === list3[0], next3[1] === list3[1]);', expect: "true false", hidden: true },
    { run: "console.log(JSON.stringify(toggleTodo([], 1)));", expect: "[]", hidden: true },
  ],
  explain: L(
    "map returns a new array; spread the matching todo into a new object with done flipped and return the rest as they are.",
    "map devuelve un array nuevo; copia el todo que coincide en un objeto nuevo con done invertido y devuelve el resto tal cual.",
    "map は新しい配列を返す。一致する todo はスプレッドで新しいオブジェクトにして done を反転し、他はそのまま返す。",
  ),
};

// ─── MID (2 ide + 2 paper) ───────────────────────────────────────────────────

export const cartReducerTask: ExamQuestion = {
  slug: "cart-reducer",
  kind: "code",
  mode: "ide",
  topic: "context_reducer",
  difficulty: 2,
  prompt: L("Coding: a shopping cart reducer", "Código: un reducer de carrito", "コーディング：カートのリデューサー"),
  brief: L(
    "Write cartReducer(state, action) for useReducer. state is a list of { id, qty }. Actions: { type: \"add\", id } adds 1 to that item, or appends { id, qty: 1 } at the end if it isn't there; { type: \"remove\", id } subtracts 1 and drops the item when it reaches 0 (an unknown id changes nothing); { type: \"clear\" } empties the cart. Never mutate state or its items.",
    "Escribe cartReducer(state, action) para useReducer. state es una lista de { id, qty }. Acciones: { type: \"add\", id } suma 1 a ese item, o agrega { id, qty: 1 } al final si no está; { type: \"remove\", id } resta 1 y quita el item al llegar a 0 (un id desconocido no cambia nada); { type: \"clear\" } vacía el carrito. Nunca mutes state ni sus items.",
    "useReducer 用の cartReducer(state, action) を書こう。state は { id, qty } のリスト。{ type: \"add\", id } はその item に 1 足し、なければ末尾に { id, qty: 1 } を追加。{ type: \"remove\", id } は 1 引き、0 になったら取り除く（未知の id は何もしない）。{ type: \"clear\" } は空にする。state も item も変更しないこと。",
  ),
  starter: tsx('type Item = { id: string; qty: number };\ntype Action = { type: "add"; id: string } | { type: "remove"; id: string } | { type: "clear" };\n\nfunction cartReducer(state: Item[], action: Action): Item[] {\n  // your code here\n  return state;\n}\n'),
  solution: tsx('type Item = { id: string; qty: number };\ntype Action = { type: "add"; id: string } | { type: "remove"; id: string } | { type: "clear" };\n\nfunction cartReducer(state: Item[], action: Action): Item[] {\n  switch (action.type) {\n    case "add":\n      return state.some((i) => i.id === action.id)\n        ? state.map((i) => (i.id === action.id ? { ...i, qty: i.qty + 1 } : i))\n        : [...state, { id: action.id, qty: 1 }];\n    case "remove":\n      return state\n        .map((i) => (i.id === action.id ? { ...i, qty: i.qty - 1 } : i))\n        .filter((i) => i.qty > 0);\n    case "clear":\n      return [];\n  }\n}\n'),
  nearMiss: [
    // Mutates the current state (push and qty++).
    tsx('type Item = { id: string; qty: number };\ntype Action = { type: "add"; id: string } | { type: "remove"; id: string } | { type: "clear" };\n\nfunction cartReducer(state: Item[], action: Action): Item[] {\n  switch (action.type) {\n    case "add": {\n      const found = state.find((i) => i.id === action.id);\n      if (found) found.qty++;\n      else state.push({ id: action.id, qty: 1 });\n      return [...state];\n    }\n    case "remove":\n      return state\n        .map((i) => (i.id === action.id ? { ...i, qty: i.qty - 1 } : i))\n        .filter((i) => i.qty > 0);\n    case "clear":\n      return [];\n  }\n}\n'),
    // remove drops the whole line instead of one unit.
    tsx('type Item = { id: string; qty: number };\ntype Action = { type: "add"; id: string } | { type: "remove"; id: string } | { type: "clear" };\n\nfunction cartReducer(state: Item[], action: Action): Item[] {\n  switch (action.type) {\n    case "add":\n      return state.some((i) => i.id === action.id)\n        ? state.map((i) => (i.id === action.id ? { ...i, qty: i.qty + 1 } : i))\n        : [...state, { id: action.id, qty: 1 }];\n    case "remove":\n      return state.filter((i) => i.id !== action.id);\n    case "clear":\n      return [];\n  }\n}\n'),
  ],
  tests: [
    { run: 'let cart0 = cartReducer([], { type: "add", id: "tea" });\ncart0 = cartReducer(cart0, { type: "add", id: "jam" });\ncart0 = cartReducer(cart0, { type: "add", id: "tea" });\nconsole.log(JSON.stringify(cart0));', expect: '[{"id":"tea","qty":2},{"id":"jam","qty":1}]' },
    { run: 'console.log(JSON.stringify(cartReducer([{ id: "tea", qty: 1 }, { id: "jam", qty: 2 }], { type: "remove", id: "tea" })));', expect: '[{"id":"jam","qty":2}]' },
    { run: 'console.log(JSON.stringify(cartReducer([{ id: "tea", qty: 2 }], { type: "remove", id: "tea" })), JSON.stringify(cartReducer([{ id: "a", qty: 1 }], { type: "remove", id: "zzz" })));', expect: '[{"id":"tea","qty":1}] [{"id":"a","qty":1}]', hidden: true },
    { run: 'const cart3 = [{ id: "tea", qty: 1 }];\ncartReducer(cart3, { type: "add", id: "tea" });\ncartReducer(cart3, { type: "add", id: "jam" });\nconsole.log(JSON.stringify(cart3));', expect: '[{"id":"tea","qty":1}]', hidden: true },
    { run: 'console.log(JSON.stringify(cartReducer([{ id: "x", qty: 4 }], { type: "clear" })));', expect: "[]", hidden: true },
  ],
  explain: L(
    "Return new arrays and objects: map with a spread to change qty, spread the array to append, filter to drop items at 0.",
    "Devuelve arrays y objetos nuevos: map con spread para cambiar qty, spread del array para agregar y filter para quitar los que llegan a 0.",
    "新しい配列とオブジェクトを返す。qty の変更は map とスプレッド、追加は配列スプレッド、0 の削除は filter。",
  ),
};

export const visibleProductsTask: ExamQuestion = {
  slug: "visible-products",
  kind: "code",
  mode: "ide",
  topic: "state",
  difficulty: 2,
  prompt: L("Coding: derive the filtered, sorted list", "Código: deriva la lista filtrada y ordenada", "コーディング：絞り込み・並べ替えを導出"),
  brief: L(
    "Instead of storing a second state, derive it. Write visibleProducts(products, query): keep the products whose name contains query, ignoring case (an empty query keeps all). Sort them by price, cheapest first; on a tie, by name A→Z. Return a new array and never reorder the input: it is state.",
    "En vez de guardar un segundo estado, derívalo. Escribe visibleProducts(products, query): deja los productos cuyo name contiene query, sin importar mayúsculas (un query vacío deja todos). Ordénalos por price, el más barato primero; si empatan, por name de la A a la Z. Devuelve un array nuevo y nunca reordenes la entrada: es estado.",
    "2つ目の状態を持たずに導出しよう。visibleProducts(products, query) を書く。name に query を含む商品を大文字小文字を無視して残す（空の query は全部）。price の安い順、同じなら name の A→Z。新しい配列を返し、入力は状態なので並べ替えないこと。",
  ),
  starter: tsx("type Product = { name: string; price: number };\n\nfunction visibleProducts(products: Product[], query: string): Product[] {\n  // your code here\n  return products;\n}\n"),
  solution: tsx("type Product = { name: string; price: number };\n\nfunction visibleProducts(products: Product[], query: string): Product[] {\n  const q = query.toLowerCase();\n  return products\n    .filter((p) => p.name.toLowerCase().includes(q))\n    .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));\n}\n"),
  nearMiss: [
    // Sorts the state array in place before filtering.
    tsx("type Product = { name: string; price: number };\n\nfunction visibleProducts(products: Product[], query: string): Product[] {\n  const q = query.toLowerCase();\n  return products\n    .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name))\n    .filter((p) => p.name.toLowerCase().includes(q));\n}\n"),
    // Case-sensitive search.
    tsx("type Product = { name: string; price: number };\n\nfunction visibleProducts(products: Product[], query: string): Product[] {\n  return products\n    .filter((p) => p.name.includes(query))\n    .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));\n}\n"),
  ],
  tests: [
    { run: 'console.log(visibleProducts([{ name: "Tea", price: 3 }, { name: "Jam", price: 5 }, { name: "Green tea", price: 2 }], "tea").map((p) => p.name).join(","));', expect: "Green tea,Tea" },
    { run: 'console.log(visibleProducts([{ name: "Tea", price: 3 }, { name: "Jam", price: 5 }, { name: "Green tea", price: 2 }], "").map((p) => p.name).join(","));', expect: "Green tea,Tea,Jam" },
    { run: 'console.log(visibleProducts([{ name: "Tea", price: 3 }, { name: "Jam", price: 5 }], "TEA").map((p) => p.name).join(","));', expect: "Tea", hidden: true },
    { run: 'console.log(visibleProducts([{ name: "b", price: 1 }, { name: "a", price: 1 }, { name: "c", price: 0 }], "").map((p) => p.name).join(","));', expect: "c,a,b", hidden: true },
    { run: 'const stock4 = [{ name: "z", price: 2 }, { name: "y", price: 1 }];\nvisibleProducts(stock4, "");\nconsole.log(stock4.map((p) => p.name).join(","));', expect: "z,y", hidden: true },
  ],
  explain: L(
    "Lower-case both sides to compare, filter first (it returns a new array), then sort by price - price, falling back to the name.",
    "Pasa ambos lados a minúsculas, filtra primero (devuelve un array nuevo) y luego ordena por diferencia de price, desempatando por name.",
    "両方を小文字にして比べ、先に filter（新しい配列を返す）、それから price の差で sort し、同じなら name で比べる。",
  ),
};

export const contactListTask: ExamQuestion = {
  slug: "contact-list",
  kind: "code",
  mode: "paper",
  topic: "lists_keys",
  difficulty: 2,
  prompt: L("Written test: a contact list grouped by letter", "Prueba escrita: contactos agrupados por letra", "筆記：頭文字でまとめた連絡先"),
  brief: L(
    "Write ContactList({ names }). Group the names by their first letter in upper case (\"ada\" goes under A). Render a <div> with one <section> per letter, letters A→Z, each with <h2>{letter}</h2> and a <ul> of <li>{name}</li> in the order the names came. Use keys. Names are unique and non-empty; no names gives an empty <div>.",
    "Escribe ContactList({ names }). Agrupa los nombres por su primera letra en mayúscula (\"ada\" va en la A). Renderiza un <div> con un <section> por letra, de la A a la Z, cada uno con <h2>{letter}</h2> y un <ul> de <li>{name}</li> en el orden en que llegaron. Usa keys. Los nombres son únicos y no vacíos; sin nombres, un <div> vacío.",
    "ContactList({ names }) を書こう。名前を大文字にした頭文字でまとめる（\"ada\" は A）。<div> の中に文字ごとの <section> を A→Z で描き、それぞれ <h2>{letter}</h2> と、来た順の <li>{name}</li> を並べた <ul> を入れる。key を使う。名前は重複なし・空でない。名前がなければ空の <div>。",
  ),
  starter: tsx("function ContactList({ names }: { names: string[] }) {\n  // your code here\n  return <div></div>;\n}\n"),
  solution: tsx("function ContactList({ names }: { names: string[] }) {\n  const groups = new Map<string, string[]>();\n  for (const name of names) {\n    const letter = name[0].toUpperCase();\n    groups.set(letter, [...(groups.get(letter) ?? []), name]);\n  }\n  const letters = [...groups.keys()].sort();\n  return (\n    <div>\n      {letters.map((letter) => (\n        <section key={letter}>\n          <h2>{letter}</h2>\n          <ul>{groups.get(letter)!.map((name) => <li key={name}>{name}</li>)}</ul>\n        </section>\n      ))}\n    </div>\n  );\n}\n"),
  nearMiss: [
    // Letters in first-seen order instead of A→Z.
    tsx("function ContactList({ names }: { names: string[] }) {\n  const groups = new Map<string, string[]>();\n  for (const name of names) {\n    const letter = name[0].toUpperCase();\n    groups.set(letter, [...(groups.get(letter) ?? []), name]);\n  }\n  return (\n    <div>\n      {[...groups.keys()].map((letter) => (\n        <section key={letter}>\n          <h2>{letter}</h2>\n          <ul>{groups.get(letter)!.map((name) => <li key={name}>{name}</li>)}</ul>\n        </section>\n      ))}\n    </div>\n  );\n}\n"),
    // Forgets to upper-case: "ada" gets its own lower-case group.
    tsx("function ContactList({ names }: { names: string[] }) {\n  const groups = new Map<string, string[]>();\n  for (const name of names) {\n    const letter = name[0];\n    groups.set(letter, [...(groups.get(letter) ?? []), name]);\n  }\n  const letters = [...groups.keys()].sort();\n  return (\n    <div>\n      {letters.map((letter) => (\n        <section key={letter}>\n          <h2>{letter}</h2>\n          <ul>{groups.get(letter)!.map((name) => <li key={name}>{name}</li>)}</ul>\n        </section>\n      ))}\n    </div>\n  );\n}\n"),
  ],
  tests: [
    { run: 'console.log(renderToStaticMarkup(<ContactList names={["Bo", "Ada", "Ben"]} />));', expect: "<div><section><h2>A</h2><ul><li>Ada</li></ul></section><section><h2>B</h2><ul><li>Bo</li><li>Ben</li></ul></section></div>" },
    { run: "console.log(renderToStaticMarkup(<ContactList names={[]} />));", expect: "<div></div>" },
    { run: 'console.log(renderToStaticMarkup(<ContactList names={["ada", "Al"]} />));', expect: "<div><section><h2>A</h2><ul><li>ada</li><li>Al</li></ul></section></div>", hidden: true },
    { run: 'console.log(renderToStaticMarkup(<ContactList names={["Zed", "Yu", "Xi"]} />));', expect: "<div><section><h2>X</h2><ul><li>Xi</li></ul></section><section><h2>Y</h2><ul><li>Yu</li></ul></section><section><h2>Z</h2><ul><li>Zed</li></ul></section></div>", hidden: true },
  ],
  explain: L(
    "Build the groups first (key: first letter upper-cased), sort the letters, then map letters to sections and names to <li>.",
    "Arma primero los grupos (clave: primera letra en mayúscula), ordena las letras y luego mapea letras a sections y nombres a <li>.",
    "先に頭文字（大文字）でグループを作り、文字を sort してから、文字を section に、名前を <li> に map する。",
  ),
};

export const validateSignupTask: ExamQuestion = {
  slug: "validate-signup",
  kind: "code",
  mode: "paper",
  topic: "events_forms",
  difficulty: 2,
  prompt: L("Written test: validate a signup form", "Prueba escrita: valida un formulario de registro", "筆記：登録フォームの検証"),
  brief: L(
    "Write validateSignup({ email, password, confirm }), called on submit. Return an object with an entry only for each failing field, in this order: email (trimmed) needs an @ with at least one character before and after it, else email: \"Invalid email\"; password needs at least 8 characters, else password: \"Too short\"; confirm must equal password, else confirm: \"Does not match\". A valid form gives {}.",
    "Escribe validateSignup({ email, password, confirm }), que se llama al enviar. Devuelve un objeto con una entrada solo por cada campo que falla, en este orden: email (sin espacios a los lados) necesita una @ con al menos un carácter antes y después, si no email: \"Invalid email\"; password necesita al menos 8 caracteres, si no password: \"Too short\"; confirm debe ser igual a password, si no confirm: \"Does not match\". Un formulario válido da {}.",
    "送信時に呼ぶ validateSignup({ email, password, confirm }) を書こう。失敗した項目だけを次の順で入れたオブジェクトを返す。email（前後の空白を除く）は前後に1文字以上ある @ が必要、なければ email: \"Invalid email\"。password は8文字以上、なければ password: \"Too short\"。confirm は password と同じ、でなければ confirm: \"Does not match\"。正しければ {}。",
  ),
  starter: tsx("type Signup = { email: string; password: string; confirm: string };\n\nfunction validateSignup(form: Signup): Record<string, string> {\n  // your code here\n  return {};\n}\n"),
  solution: tsx('type Signup = { email: string; password: string; confirm: string };\n\nfunction validateSignup(form: Signup): Record<string, string> {\n  const errors: Record<string, string> = {};\n  const email = form.email.trim();\n  const at = email.indexOf("@");\n  if (at < 1 || at === email.length - 1) errors.email = "Invalid email";\n  if (form.password.length < 8) errors.password = "Too short";\n  if (form.confirm !== form.password) errors.confirm = "Does not match";\n  return errors;\n}\n'),
  nearMiss: [
    // Only checks that an @ exists somewhere.
    tsx('type Signup = { email: string; password: string; confirm: string };\n\nfunction validateSignup(form: Signup): Record<string, string> {\n  const errors: Record<string, string> = {};\n  if (!form.email.includes("@")) errors.email = "Invalid email";\n  if (form.password.length < 8) errors.password = "Too short";\n  if (form.confirm !== form.password) errors.confirm = "Does not match";\n  return errors;\n}\n'),
    // Off by one: exactly 8 characters counts as too short.
    tsx('type Signup = { email: string; password: string; confirm: string };\n\nfunction validateSignup(form: Signup): Record<string, string> {\n  const errors: Record<string, string> = {};\n  const email = form.email.trim();\n  const at = email.indexOf("@");\n  if (at < 1 || at === email.length - 1) errors.email = "Invalid email";\n  if (form.password.length <= 8) errors.password = "Too short";\n  if (form.confirm !== form.password) errors.confirm = "Does not match";\n  return errors;\n}\n'),
  ],
  tests: [
    { run: 'console.log(JSON.stringify(validateSignup({ email: "ada@bitwise.dev", password: "secret123", confirm: "secret123" })));', expect: "{}" },
    { run: 'console.log(JSON.stringify(validateSignup({ email: "ada", password: "short", confirm: "short" })));', expect: '{"email":"Invalid email","password":"Too short"}' },
    { run: 'console.log(JSON.stringify(validateSignup({ email: "bo@x.io", password: "longenough", confirm: "longenougj" })));', expect: '{"confirm":"Does not match"}', hidden: true },
    { run: 'console.log(JSON.stringify(validateSignup({ email: "  ada@x.io ", password: "12345678", confirm: "12345678" })));', expect: "{}", hidden: true },
    { run: 'console.log(JSON.stringify(validateSignup({ email: "@x.io", password: "12345678", confirm: "1234567" })), JSON.stringify(validateSignup({ email: "ada@", password: "abcdefgh", confirm: "abcdefgh" })));', expect: '{"email":"Invalid email","confirm":"Does not match"} {"email":"Invalid email"}', hidden: true },
  ],
  explain: L(
    "Trim, then find the @: index 0 or the last index means nothing before or after it. 8 characters is enough (< 8 fails).",
    "Recorta y busca la @: en el índice 0 o en el último no hay nada antes o después. 8 caracteres bastan (falla < 8).",
    "trim してから @ を探す。位置が 0 か最後なら前後に何もない。8文字で十分（< 8 が失敗）。",
  ),
};

// ─── SENIOR (1 ide + 3 paper) ────────────────────────────────────────────────

export const undoableTask: ExamQuestion = {
  slug: "undoable",
  kind: "code",
  mode: "ide",
  topic: "context_reducer",
  difficulty: 3,
  prompt: L("Coding: add undo/redo to any reducer", "Código: agrega deshacer/rehacer a un reducer", "コーディング：任意のリデューサーに undo/redo"),
  brief: L(
    "Write undoable(reducer): it returns a new reducer over { past, present, future }. { type: \"do\", action } runs reducer(present, action), pushes the old present onto past and clears future. { type: \"undo\" } moves present to the front of future and takes the last of past as present; { type: \"redo\" } does the opposite. Undo with an empty past (or redo with an empty future) returns the state unchanged. Never mutate.",
    "Escribe undoable(reducer): devuelve un reducer nuevo sobre { past, present, future }. { type: \"do\", action } ejecuta reducer(present, action), pone el present viejo al final de past y vacía future. { type: \"undo\" } mueve present al inicio de future y toma el último de past como present; { type: \"redo\" } hace lo contrario. Undo con past vacío (o redo con future vacío) devuelve el estado sin cambios. Nunca mutes.",
    "undoable(reducer) を書こう。{ past, present, future } を扱う新しいリデューサーを返す。{ type: \"do\", action } は reducer(present, action) を実行し、古い present を past の末尾へ、future は空に。{ type: \"undo\" } は present を future の先頭へ移し、past の最後を present にする。{ type: \"redo\" } はその逆。past が空の undo（future が空の redo）は状態をそのまま返す。変更はしない。",
  ),
  starter: tsx('type History<T> = { past: T[]; present: T; future: T[] };\ntype HistoryAction<A> = { type: "do"; action: A } | { type: "undo" } | { type: "redo" };\n\nfunction undoable<T, A>(reducer: (state: T, action: A) => T) {\n  return (state: History<T>, action: HistoryAction<A>): History<T> => {\n    // your code here\n    return state;\n  };\n}\n'),
  solution: tsx('type History<T> = { past: T[]; present: T; future: T[] };\ntype HistoryAction<A> = { type: "do"; action: A } | { type: "undo" } | { type: "redo" };\n\nfunction undoable<T, A>(reducer: (state: T, action: A) => T) {\n  return (state: History<T>, action: HistoryAction<A>): History<T> => {\n    const { past, present, future } = state;\n    switch (action.type) {\n      case "do":\n        return { past: [...past, present], present: reducer(present, action.action), future: [] };\n      case "undo":\n        if (past.length === 0) return state;\n        return { past: past.slice(0, -1), present: past[past.length - 1], future: [present, ...future] };\n      case "redo":\n        if (future.length === 0) return state;\n        return { past: [...past, present], present: future[0], future: future.slice(1) };\n    }\n  };\n}\n'),
  nearMiss: [
    // A new action keeps the old redo branch.
    tsx('type History<T> = { past: T[]; present: T; future: T[] };\ntype HistoryAction<A> = { type: "do"; action: A } | { type: "undo" } | { type: "redo" };\n\nfunction undoable<T, A>(reducer: (state: T, action: A) => T) {\n  return (state: History<T>, action: HistoryAction<A>): History<T> => {\n    const { past, present, future } = state;\n    switch (action.type) {\n      case "do":\n        return { past: [...past, present], present: reducer(present, action.action), future };\n      case "undo":\n        if (past.length === 0) return state;\n        return { past: past.slice(0, -1), present: past[past.length - 1], future: [present, ...future] };\n      case "redo":\n        if (future.length === 0) return state;\n        return { past: [...past, present], present: future[0], future: future.slice(1) };\n    }\n  };\n}\n'),
    // No empty checks: undo at the start loses the present.
    tsx('type History<T> = { past: T[]; present: T; future: T[] };\ntype HistoryAction<A> = { type: "do"; action: A } | { type: "undo" } | { type: "redo" };\n\nfunction undoable<T, A>(reducer: (state: T, action: A) => T) {\n  return (state: History<T>, action: HistoryAction<A>): History<T> => {\n    const { past, present, future } = state;\n    switch (action.type) {\n      case "do":\n        return { past: [...past, present], present: reducer(present, action.action), future: [] };\n      case "undo":\n        return { past: past.slice(0, -1), present: past[past.length - 1], future: [present, ...future] };\n      case "redo":\n        return { past: [...past, present], present: future[0], future: future.slice(1) };\n    }\n  };\n}\n'),
  ],
  tests: [
    { run: 'const add0 = undoable((n: number, by: number) => n + by);\nlet h0 = { past: [] as number[], present: 0, future: [] as number[] };\nh0 = add0(h0, { type: "do", action: 5 });\nh0 = add0(h0, { type: "do", action: 2 });\nconsole.log(JSON.stringify(h0));', expect: '{"past":[0,5],"present":7,"future":[]}' },
    { run: 'const add1 = undoable((n: number, by: number) => n + by);\nconsole.log(JSON.stringify(add1({ past: [0, 5], present: 7, future: [] }, { type: "undo" })));', expect: '{"past":[0],"present":5,"future":[7]}' },
    { run: 'const add2 = undoable((n: number, by: number) => n + by);\nconsole.log(JSON.stringify(add2({ past: [0], present: 5, future: [7, 9] }, { type: "redo" })));', expect: '{"past":[0,5],"present":7,"future":[9]}', hidden: true },
    { run: 'const add3 = undoable((n: number, by: number) => n + by);\nlet h3 = add3({ past: [], present: 0, future: [] }, { type: "do", action: 5 });\nh3 = add3(h3, { type: "undo" });\nh3 = add3(h3, { type: "do", action: 1 });\nconsole.log(JSON.stringify(h3));', expect: '{"past":[0],"present":1,"future":[]}', hidden: true },
    { run: 'const add4 = undoable((n: number, by: number) => n + by);\nconst h4 = { past: [] as number[], present: 0, future: [] as number[] };\nconsole.log(JSON.stringify(add4(h4, { type: "undo" })), JSON.stringify(add4(h4, { type: "redo" })));', expect: '{"past":[],"present":0,"future":[]} {"past":[],"present":0,"future":[]}', hidden: true },
  ],
  explain: L(
    "\"do\" pushes present to past and clears future (a new branch). Undo/redo move one value between past, present and future, guarding empty lists.",
    "\"do\" pone present en past y vacía future (una rama nueva). Undo/redo mueven un valor entre past, present y future, cuidando las listas vacías.",
    "\"do\" は present を past へ送り future を空に（新しい分岐）。undo/redo は値を1つ移すだけで、空のリストは守る。",
  ),
};

export const visibleRangeTask: ExamQuestion = {
  slug: "visible-range",
  kind: "code",
  mode: "paper",
  topic: "performance",
  difficulty: 3,
  prompt: L("Written test: rows to render in a virtual list", "Prueba escrita: filas de una lista virtual", "筆記：仮想リストで描く行"),
  brief: L(
    "Long lists render only the rows on screen. Write visibleRange(total, rowHeight, viewport, scrollTop, overscan) returning { start, end } (end excluded). The first visible row is floor(scrollTop / rowHeight); the row after the last visible one is ceil((scrollTop + viewport) / rowHeight). Widen both sides by overscan rows, then clamp to 0 and total.",
    "Las listas largas solo renderizan las filas en pantalla. Escribe visibleRange(total, rowHeight, viewport, scrollTop, overscan) que devuelva { start, end } (end excluido). La primera fila visible es floor(scrollTop / rowHeight); la siguiente a la última visible es ceil((scrollTop + viewport) / rowHeight). Amplía ambos lados en overscan filas y luego limita a 0 y total.",
    "長いリストは画面上の行だけ描く。visibleRange(total, rowHeight, viewport, scrollTop, overscan) を書き、{ start, end }（end は含まない）を返す。最初の見える行は floor(scrollTop / rowHeight)、最後の見える行の次は ceil((scrollTop + viewport) / rowHeight)。両側を overscan 行広げ、0 と total の範囲に収める。",
  ),
  starter: tsx("function visibleRange(total: number, rowHeight: number, viewport: number, scrollTop: number, overscan: number) {\n  // your code here\n  return { start: 0, end: total };\n}\n"),
  solution: tsx("function visibleRange(total: number, rowHeight: number, viewport: number, scrollTop: number, overscan: number) {\n  const first = Math.floor(scrollTop / rowHeight);\n  const last = Math.ceil((scrollTop + viewport) / rowHeight);\n  return { start: Math.max(0, first - overscan), end: Math.min(total, last + overscan) };\n}\n"),
  nearMiss: [
    // Never clamps to the end of the list.
    tsx("function visibleRange(total: number, rowHeight: number, viewport: number, scrollTop: number, overscan: number) {\n  const first = Math.floor(scrollTop / rowHeight);\n  const last = Math.ceil((scrollTop + viewport) / rowHeight);\n  return { start: Math.max(0, first - overscan), end: last + overscan };\n}\n"),
    // floor for the end cuts off a half-visible last row.
    tsx("function visibleRange(total: number, rowHeight: number, viewport: number, scrollTop: number, overscan: number) {\n  const first = Math.floor(scrollTop / rowHeight);\n  const last = Math.floor((scrollTop + viewport) / rowHeight);\n  return { start: Math.max(0, first - overscan), end: Math.min(total, last + overscan) };\n}\n"),
  ],
  tests: [
    { run: "console.log(JSON.stringify(visibleRange(1000, 20, 100, 0, 2)));", expect: '{"start":0,"end":7}' },
    { run: "console.log(JSON.stringify(visibleRange(1000, 20, 100, 210, 2)));", expect: '{"start":8,"end":18}' },
    { run: "console.log(JSON.stringify(visibleRange(10, 20, 100, 150, 3)));", expect: '{"start":4,"end":10}', hidden: true },
    { run: "console.log(JSON.stringify(visibleRange(0, 20, 100, 0, 2)));", expect: '{"start":0,"end":0}', hidden: true },
    { run: "console.log(JSON.stringify(visibleRange(100, 30, 100, 45, 0)));", expect: '{"start":1,"end":5}', hidden: true },
  ],
  explain: L(
    "floor the first row, ceil the end so a half-visible row still renders, add overscan, then clamp with Math.max(0, …) and Math.min(total, …).",
    "floor para la primera fila, ceil para el final (así se ve una fila a medias), suma overscan y limita con Math.max(0, …) y Math.min(total, …).",
    "最初の行は floor、終わりは ceil（半分見える行も描く）。overscan を足し、Math.max(0, …) と Math.min(total, …) で収める。",
  ),
};

export const treeViewTask: ExamQuestion = {
  slug: "tree-view",
  kind: "code",
  mode: "paper",
  topic: "rendering",
  difficulty: 3,
  prompt: L("Written test: a recursive file tree", "Prueba escrita: un árbol de archivos recursivo", "筆記：再帰するファイルツリー"),
  brief: L(
    "Write Tree({ nodes }). Each node is { name, children? } and children can nest at any depth. Render a <ul> with one <li> per node: its name, followed by a nested <ul> of its children only when it has at least one child. The top-level <ul> is always rendered (an empty list gives <ul></ul>). Use keys.",
    "Escribe Tree({ nodes }). Cada nodo es { name, children? } y children puede anidarse a cualquier profundidad. Renderiza un <ul> con un <li> por nodo: su name, seguido de un <ul> anidado con sus children solo si tiene al menos un hijo. El <ul> de primer nivel siempre se renderiza (una lista vacía da <ul></ul>). Usa keys.",
    "Tree({ nodes }) を書こう。node は { name, children? } で、children はどこまでも入れ子になる。node ごとの <li> を並べた <ul> を描き、<li> は name の後に、子が1つ以上あるときだけ子の <ul> を入れる。一番外の <ul> は常に描く（空なら <ul></ul>）。key を使う。",
  ),
  starter: tsx("type TreeNode = { name: string; children?: TreeNode[] };\n\nfunction Tree({ nodes }: { nodes: TreeNode[] }) {\n  // your code here\n  return <ul></ul>;\n}\n"),
  solution: tsx("type TreeNode = { name: string; children?: TreeNode[] };\n\nfunction Tree({ nodes }: { nodes: TreeNode[] }): React.ReactElement {\n  return (\n    <ul>\n      {nodes.map((node) => (\n        <li key={node.name}>\n          {node.name}\n          {node.children && node.children.length > 0 && <Tree nodes={node.children} />}\n        </li>\n      ))}\n    </ul>\n  );\n}\n"),
  nearMiss: [
    // `children &&` is true for an empty array: renders a stray <ul></ul>.
    tsx("type TreeNode = { name: string; children?: TreeNode[] };\n\nfunction Tree({ nodes }: { nodes: TreeNode[] }): React.ReactElement {\n  return (\n    <ul>\n      {nodes.map((node) => (\n        <li key={node.name}>\n          {node.name}\n          {node.children && <Tree nodes={node.children} />}\n        </li>\n      ))}\n    </ul>\n  );\n}\n"),
    // Only two levels: grandchildren are lost.
    tsx("type TreeNode = { name: string; children?: TreeNode[] };\n\nfunction Tree({ nodes }: { nodes: TreeNode[] }) {\n  return (\n    <ul>\n      {nodes.map((node) => (\n        <li key={node.name}>\n          {node.name}\n          {node.children && node.children.length > 0 && (\n            <ul>{node.children.map((c) => <li key={c.name}>{c.name}</li>)}</ul>\n          )}\n        </li>\n      ))}\n    </ul>\n  );\n}\n"),
  ],
  tests: [
    { run: 'console.log(renderToStaticMarkup(<Tree nodes={[{ name: "src", children: [{ name: "app.tsx" }] }, { name: "README" }]} />));', expect: "<ul><li>src<ul><li>app.tsx</li></ul></li><li>README</li></ul>" },
    { run: "console.log(renderToStaticMarkup(<Tree nodes={[]} />));", expect: "<ul></ul>" },
    { run: 'console.log(renderToStaticMarkup(<Tree nodes={[{ name: "a", children: [{ name: "b", children: [{ name: "c" }] }] }]} />));', expect: "<ul><li>a<ul><li>b<ul><li>c</li></ul></li></ul></li></ul>", hidden: true },
    { run: 'console.log(renderToStaticMarkup(<Tree nodes={[{ name: "x", children: [] }, { name: "y" }]} />));', expect: "<ul><li>x</li><li>y</li></ul>", hidden: true },
  ],
  explain: L(
    "A component can render itself: <Tree nodes={node.children} /> handles any depth. Check length > 0, since an empty array is truthy.",
    "Un componente puede renderizarse a sí mismo: <Tree nodes={node.children} /> sirve a cualquier profundidad. Revisa length > 0: un array vacío es truthy.",
    "コンポーネントは自分自身を描ける。<Tree nodes={node.children} /> でどの深さも扱える。空配列は truthy なので length > 0 を確かめる。",
  ),
};

export const safeHrefTask: ExamQuestion = {
  slug: "safe-href",
  kind: "code",
  mode: "paper",
  topic: "security",
  difficulty: 2,
  prompt: L("Written test: sanitize a user-supplied link", "Prueba escrita: sanea un link del usuario", "筆記：ユーザーのリンクを安全に"),
  brief: L(
    "React escapes text, but an href from users can still run code (javascript:...). Write safeHref(url): trim it, then return it only if it starts with http://, https:// or mailto: (in any case), or is a site path starting with a single / (not //). Anything else returns \"#\". Use an allowlist, not a blocklist.",
    "React escapa el texto, pero un href del usuario aún puede ejecutar código (javascript:...). Escribe safeHref(url): recórtalo y devuélvelo solo si empieza con http://, https:// o mailto: (en cualquier mayúscula/minúscula), o es una ruta del sitio que empieza con una sola / (no //). Todo lo demás devuelve \"#\". Usa una lista permitida, no una prohibida.",
    "React はテキストをエスケープするが、ユーザーの href はまだコードを実行できる（javascript:...）。safeHref(url) を書こう。trim して、http://・https://・mailto:（大文字小文字は問わない）で始まるか、/ 1つで始まるサイト内パス（// は不可）のときだけ返す。それ以外は \"#\"。禁止リストではなく許可リストで。",
  ),
  starter: tsx("function safeHref(url: string): string {\n  // your code here\n  return url;\n}\n"),
  solution: tsx("function safeHref(url: string): string {\n  const u = url.trim();\n  if (/^(https?:\\/\\/|mailto:)/i.test(u)) return u;\n  if (u.startsWith(\"/\") && !u.startsWith(\"//\")) return u;\n  return \"#\";\n}\n"),
  nearMiss: [
    // Blocklist: misses mixed case, leading spaces and protocol-relative URLs.
    tsx('function safeHref(url: string): string {\n  return url.startsWith("javascript:") ? "#" : url.trim();\n}\n'),
    // Case-sensitive allowlist rejects valid HTTPS:// links.
    tsx('function safeHref(url: string): string {\n  const u = url.trim();\n  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("mailto:")) return u;\n  if (u.startsWith("/") && !u.startsWith("//")) return u;\n  return "#";\n}\n'),
  ],
  tests: [
    { run: 'console.log(safeHref("https://bitwise.dev"), safeHref("mailto:hi@bitwise.dev"));', expect: "https://bitwise.dev mailto:hi@bitwise.dev" },
    { run: 'console.log(safeHref("javascript:alert(1)"));', expect: "#" },
    { run: 'console.log(safeHref("  JavaScript:alert(1)"));', expect: "#", hidden: true },
    { run: 'console.log(safeHref("HTTPS://A.IO"), safeHref(" /shop "));', expect: "HTTPS://A.IO /shop", hidden: true },
    { run: 'console.log(safeHref("//evil.io"), safeHref("data:text/html,hi"));', expect: "# #", hidden: true },
  ],
  explain: L(
    "Allow only known-safe schemes, case-insensitively, after trimming. Blocklists miss variants like \" JavaScript:\" or //evil.io.",
    "Permite solo esquemas seguros conocidos, sin importar mayúsculas y tras recortar. Las listas prohibidas fallan con \" JavaScript:\" o //evil.io.",
    "trim 後、大文字小文字を無視して安全なスキームだけ許可する。禁止リストは \" JavaScript:\" や //evil.io を見逃す。",
  ),
};

/** Exam banks by level (prepended to each exam's questions). */
export const juniorTasks: ExamQuestion[] = [navMenuTask, badgeTask, productCardTask, toggleTodoTask];
export const midTasks: ExamQuestion[] = [cartReducerTask, visibleProductsTask, contactListTask, validateSignupTask];
export const seniorTasks: ExamQuestion[] = [undoableTask, visibleRangeTask, treeViewTask, safeHrefTask];
