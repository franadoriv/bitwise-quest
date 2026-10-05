import type { LessonDef, RegionDef } from "../../../lib/content/types.ts";
import { L } from "../../../lib/i18n/text.ts";
import { enemySays, say } from "../../rust/helpers.ts";

// REGION 1 · JSX VILLAGE  (JSX, components, props, lists and keys)
//
// Displayed snippets are compact JSX; every claim is proven by a full TSX program in
// `check.program` that renders with renderToStaticMarkup and prints the HTML.

const HEAD = 'import React from "react";\nimport { renderToStaticMarkup } from "react-dom/server";\n';
/** Full program: `body` (declarations), then print the static HTML of `el`. */
const show = (body: string, el: string) => `${HEAD}${body}\nconsole.log(renderToStaticMarkup(${el}));\n`;

const YES = L("Yes", "Sí", "はい");
const NO = L("No", "No", "いいえ");
const HTML = L("What HTML renders?", "¿Qué HTML se genera?", "どんな HTML になる？");
const COMPILES = L("Does it compile?", "¿Compila?", "コンパイルできる？");
const RENDER = L("RENDER!", "¡RENDER!", "レンダー！");

const HELLO = 'function Hello({ name }: { name: string }) {\n  return <p>Hi {name}</p>;\n}';

// ─── 1.1 JSX basics ──────────────────────────────────────────────────────────
const jsxBasics: LessonDef = {
  slug: "jsx-basics",
  title: L("Markup that thinks", "Marcado que piensa", "考えるマークアップ"),
  concept: "jsx",
  mode: "lesson",
  xp: 70,
  enemy: "typescript/undefined-ghost",
  enemyName: L("BLANK GHOST", "FANTASMA VACÍO", "からっぽゴースト"),
  beats: [
    say(L(
      "Welcome to JSX Village! Here markup lives INSIDE JavaScript: JSX describes what the screen should look like.",
      "¡Bienvenido a la Aldea JSX! Aquí el marcado vive DENTRO de JavaScript: JSX describe cómo debe verse la pantalla.",
      "JSX 村へようこそ！ここではマークアップが JavaScript の中に住んでいる。JSX は画面の見た目を表すんだ。",
    )),
    {
      kind: "act",
      prompt: L("Press in order and watch the board", "Pulsa en orden y mira el tablero", "順番に押して、看板を見てね"),
      steps: [
        { label: L("NAME", "NOMBRE", "なまえ"), line: 'const name = "Ada";', effects: [{ t: "tag", actor: "hero", text: "name", value: '"Ada"' }] },
        {
          label: L("WRITE JSX", "ESCRIBIR JSX", "JSX を書く"),
          line: "const el = <h1>Hi {name}</h1>;",
          effects: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "say", actor: "hero", text: L("{name} is a slot", "{name} es un hueco", "{name} は穴だよ") }],
        },
        {
          label: L("RENDER", "RENDERIZAR", "レンダー"),
          line: "renderToStaticMarkup(el);",
          effects: [{ t: "banner", text: RENDER }, { t: "print", text: "<h1>Hi Ada</h1>" }],
          output: "<h1>Hi Ada</h1>",
        },
      ],
    },
    say(L(
      "Curly braces {} are glowing slots: put any JS expression inside and its VALUE drops into the markup.",
      "Las llaves {} son huecos brillantes: pon dentro cualquier expresión JS y su VALOR cae en el marcado.",
      "波かっこ {} は光る穴。中に JS の式を書くと、その「値」がマークアップに入るよ。",
    )),
    {
      kind: "predict",
      prompt: HTML,
      code: "<p>{2 + 3}</p>",
      options: ["<p>2 + 3</p>", "<p>5</p>", "<p>{2 + 3}</p>"],
      answer: 1,
      output: "<p>5</p>",
      check: { program: show("", "<p>{2 + 3}</p>"), compiles: true, stdout: "<p>5</p>" },
      explain: L("Inside {} JavaScript runs first: 2 + 3 becomes 5.", "Dentro de {} primero corre JavaScript: 2 + 3 se vuelve 5.", "{} の中は先に JavaScript として計算される。2 + 3 は 5 だよ。"),
      setup: [{ t: "tag", actor: "hero", text: "{2 + 3}" }],
      win: [{ t: "value", actor: "hero", text: "5" }, { t: "print", text: "<p>5</p>" }],
    },
    {
      kind: "pick",
      prompt: L("Drop the variable into the slot", "Mete la variable en el hueco", "変数を穴に入れよう"),
      code: 'const name = "Ada";\n<h1>Hi ___</h1>',
      options: ["{name}", '"name"', "name"],
      answer: 0,
      check: { program: show('const name = "Ada";', "<h1>Hi {name}</h1>"), compiles: true, stdout: "<h1>Hi Ada</h1>" },
      explain: L("Without {} it is plain text: you'd see the word name, not Ada.", "Sin {} es texto plano: verías la palabra name, no Ada.", "{} がないとただの文字。Ada ではなく name と表示されちゃう。"),
      setup: [{ t: "tag", actor: "hero", text: "name", value: '"Ada"' }],
      win: [{ t: "print", text: "<h1>Hi Ada</h1>" }],
    },
    {
      kind: "type",
      prompt: L("JSX's name for the class attribute", "El nombre JSX del atributo class", "JSX での class 属性の名前は？"),
      code: '<div ___="card">Gem</div>',
      answer: "className",
      check: { program: show("", '<div className="card">Gem</div>'), compiles: true, stdout: '<div class="card">Gem</div>' },
      explain: L("class is a JS keyword, so JSX uses className. It still renders as class=\"card\".", "class es palabra reservada de JS, así que JSX usa className. Igual se genera class=\"card\".", "class は JS の予約語なので JSX では className。HTML では class=\"card\" になるよ。"),
      win: [{ t: "print", text: '<div class="card">Gem</div>' }],
    },
    say(L(
      "A component returns ONE parent. Two siblings side by side? Wrap them in a fragment: <>...</>.",
      "Un componente devuelve UN solo padre. ¿Dos hermanos juntos? Envuélvelos en un fragmento: <>...</>.",
      "返せる親はひとつだけ。兄弟を並べたいならフラグメント <>...</> で包もう。",
    )),
    {
      kind: "act",
      prompt: L("Return two tags, then fix it", "Devuelve dos etiquetas y luego arréglalo", "タグをふたつ返して、直そう"),
      steps: [
        { label: L("COMPONENT", "COMPONENTE", "部品をつくる"), line: "function Card() {", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Card" }] },
        {
          label: L("TWO ROOTS", "DOS RAÍCES", "根がふたつ"),
          line: "  return <h1>Title</h1><p>Body</p>;",
          effects: [{ t: "shake" }, { t: "say", actor: "ally", text: L("Two heads?!", "¿Dos cabezas?", "頭がふたつ？！") }],
          error: {
            compiler: "TS2657: JSX expressions must have one parent element.",
            plain: L("A JSX expression is ONE value. Two loose tags are two values.", "Una expresión JSX es UN valor. Dos etiquetas sueltas son dos valores.", "JSX の式は値ひとつ。バラバラのタグふたつは値ふたつだよ。"),
          },
        },
        {
          label: L("FRAGMENT", "FRAGMENTO", "フラグメント"),
          line: "  return <><h1>Title</h1><p>Body</p></>;",
          effects: [{ t: "banner", text: L("ONE PARENT", "UN PADRE", "親はひとつ") }, { t: "print", text: "<h1>Title</h1><p>Body</p>" }],
        },
        { label: L("CLOSE", "CERRAR", "とじる"), line: "}" },
      ],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: "function Card() {\n  return <h1>Title</h1><p>Body</p>;\n}",
      options: [YES, NO],
      answer: 1,
      check: { program: `${HEAD}function Card() {\n  return <h1>Title</h1><p>Body</p>;\n}`, compiles: false },
      explain: L("TS2657: JSX expressions must have one parent element. Wrap them in <>...</>.", "TS2657: las expresiones JSX deben tener un solo padre. Envuélvelas en <>...</>.", "TS2657：JSX には親がひとつ必要。<>...</> で包もう。"),
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Card" }],
      win: [{ t: "shake" }, { t: "say", actor: "ally", text: L("Need a parent!", "¡Falta un padre!", "親が必要！") }],
    },
    {
      kind: "predict",
      prompt: HTML,
      code: "<p>{true}{null}{undefined}{false}</p>",
      options: ["<p></p>", "<p>truenullundefinedfalse</p>", "<p>true false</p>"],
      answer: 0,
      output: "<p></p>",
      check: { program: show("", "<p>{true}{null}{undefined}{false}</p>"), compiles: true, stdout: "<p></p>" },
      explain: L("true, false, null and undefined render NOTHING. Handy for hiding things.", "true, false, null y undefined no generan NADA. Útil para ocultar cosas.", "true・false・null・undefined は何も表示しない。隠すのに便利だよ。"),
      win: [{ t: "say", actor: "enemy", text: L("Nothing to see!", "¡Nada que ver!", "なにもないよ！") }],
    },
    say(L(
      "Careful: 0 is a NUMBER, and numbers DO render. So count && \"items\" leaves a lonely 0 on screen.",
      "Ojo: 0 es un NÚMERO y los números SÍ se ven. Así que count && \"items\" deja un 0 solitario en pantalla.",
      "注意：0 は数値で、数値は表示される。だから count && \"items\" は画面に 0 を残すよ。",
    )),
    {
      kind: "predict",
      prompt: HTML,
      code: 'const count: number = 0;\n<p>{count && "items"}</p>',
      options: ["<p></p>", "<p>0</p>", "<p>items</p>"],
      answer: 1,
      output: "<p>0</p>",
      check: { program: show("const count: number = 0;", '<p>{count && "items"}</p>'), compiles: true, stdout: "<p>0</p>" },
      explain: L("0 && x evaluates to 0, and React renders numbers. Use count > 0 && ... instead.", "0 && x da 0, y React muestra los números. Usa count > 0 && ... en su lugar.", "0 && x は 0 になり、React は数値を表示する。count > 0 && ... と書こう。"),
      setup: [{ t: "tag", actor: "hero", text: "count", value: "0" }],
      win: [{ t: "print", text: "<p>0</p>" }, { t: "say", actor: "enemy", text: L("A wild 0!", "¡Un 0 salvaje!", "野生の 0 だ！") }],
    },
    {
      kind: "predict",
      prompt: HTML,
      code: 'const evil = "<b>boom</b>";\n<p>{evil}</p>',
      options: ["<p><b>boom</b></p>", "<p>&lt;b&gt;boom&lt;/b&gt;</p>", "<p>boom</p>"],
      answer: 1,
      output: "<p>&lt;b&gt;boom&lt;/b&gt;</p>",
      check: { program: show('const evil = "<b>boom</b>";', "<p>{evil}</p>"), compiles: true, stdout: "<p>&lt;b&gt;boom&lt;/b&gt;</p>" },
      explain: L("Text in {} is ESCAPED: a string never becomes real tags. That blocks HTML injection.", "El texto en {} se ESCAPA: un string nunca se vuelve etiquetas reales. Eso bloquea la inyección de HTML.", "{} の文字列はエスケープされ、本物のタグにはならない。HTML の注入を防げるよ。"),
      win: [{ t: "item", kind: "shield", holder: "hero" }, { t: "say", actor: "hero", text: L("Escaped!", "¡Escapado!", "エスケープ！") }],
    },
    {
      kind: "predict",
      prompt: HTML,
      code: '<div style={{ color: "red", fontSize: 12 }}>x</div>',
      options: ['<div style="color:red;font-size:12px">x</div>', '<div style="color:red;fontSize:12">x</div>', '<div style="{color: red}">x</div>'],
      answer: 0,
      output: '<div style="color:red;font-size:12px">x</div>',
      check: { program: show("", '<div style={{ color: "red", fontSize: 12 }}>x</div>'), compiles: true, stdout: '<div style="color:red;font-size:12px">x</div>' },
      explain: L("style takes an OBJECT with camelCase keys. React writes font-size and adds px to numbers.", "style recibe un OBJETO con claves camelCase. React escribe font-size y agrega px a los números.", "style にはキャメルケースのオブジェクトを渡す。React が font-size に直し、数値に px を付けるよ。"),
    },
    {
      kind: "run",
      prompt: L("Fix it: Card must render the title and the body", "Arréglalo: Card debe mostrar título y cuerpo", "直そう：Card に見出しと本文を出させて"),
      starter: `${HEAD}\nfunction Card() {\n  return <h1>Title</h1><p>Body</p>;\n}\n\nconsole.log(renderToStaticMarkup(<Card />));\n`,
      solution: `${HEAD}\nfunction Card() {\n  return <><h1>Title</h1><p>Body</p></>;\n}\n\nconsole.log(renderToStaticMarkup(<Card />));\n`,
      expect: "<h1>Title</h1><p>Body</p>",
      fallback: [
        String.raw`<>\s*<h1>Title<\/h1>\s*<p>Body<\/p>\s*<\/>`,
        String.raw`<(div|section|article|main|React\.Fragment|Fragment)>\s*<h1>Title<\/h1>\s*<p>Body<\/p>\s*<\/(div|section|article|main|React\.Fragment|Fragment)>`,
      ],
      explain: L("Wrap both tags in one parent: a fragment <>...</> adds no extra HTML.", "Envuelve ambas etiquetas en un padre: un fragmento <>...</> no agrega HTML extra.", "ふたつのタグを親ひとつで包もう。フラグメント <>...</> なら余分な HTML は出ないよ。"),
    },
  ],
};

// ─── 1.2 Components and props ────────────────────────────────────────────────
const componentsAndProps: LessonDef = {
  slug: "components-and-props",
  title: L("Actors and their gifts", "Actores y sus regalos", "役者と贈りもの"),
  concept: "components",
  mode: "lesson",
  xp: 75,
  enemy: "typescript/any-shifter",
  enemyName: L("PROP SNATCHER", "LADRÓN DE PROPS", "プロップスどろぼう"),
  beats: [
    say(L(
      "A component is a function that returns JSX. Its name starts with a CAPITAL letter so React knows it's yours.",
      "Un componente es una función que devuelve JSX. Su nombre empieza con MAYÚSCULA para que React sepa que es tuyo.",
      "コンポーネントは JSX を返す関数。名前は大文字で始めよう。そうすれば React が自作だとわかる。",
    )),
    {
      kind: "act",
      prompt: L("Build a component and hand it a prop", "Crea un componente y pásale una prop", "コンポーネントを作ってプロップスを渡そう"),
      steps: [
        { label: L("DEFINE", "DEFINIR", "定義する"), line: "function Hello({ name }: { name: string }) {", effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Hello" }] },
        { label: L("RETURN JSX", "DEVOLVER JSX", "JSX を返す"), line: "  return <p>Hi {name}</p>;" },
        { label: L("CLOSE", "CERRAR", "とじる"), line: "}" },
        {
          label: L("GIVE PROP", "PASAR PROP", "プロップスを渡す"),
          line: 'const el = <Hello name="Bo" />;',
          effects: [{ t: "item", kind: "gem", holder: "hero" }, { t: "give", to: "ally" }, { t: "say", actor: "ally", text: L("name = Bo", "name = Bo", "name = Bo") }],
        },
        {
          label: L("RENDER", "RENDERIZAR", "レンダー"),
          line: "renderToStaticMarkup(el);",
          effects: [{ t: "banner", text: RENDER }, { t: "print", text: "<p>Hi Bo</p>" }],
          output: "<p>Hi Bo</p>",
        },
      ],
    },
    {
      kind: "predict",
      prompt: HTML,
      code: `${HELLO}\n<Hello name="Cy" />`,
      options: ['<Hello name="Cy" />', "<p>Hi Cy</p>", "<p>Hi name</p>"],
      answer: 1,
      output: "<p>Hi Cy</p>",
      check: { program: show(HELLO, '<Hello name="Cy" />'), compiles: true, stdout: "<p>Hi Cy</p>" },
      explain: L("React calls Hello with { name: \"Cy\" } and prints what it returns. Components leave no tag of their own.", "React llama a Hello con { name: \"Cy\" } e imprime lo que devuelve. Los componentes no dejan etiqueta propia.", "React は Hello を { name: \"Cy\" } で呼び、その戻り値を出力する。部品自体のタグは残らないよ。"),
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Hello" }, { t: "item", kind: "gem", holder: "hero" }],
      win: [{ t: "give", to: "ally" }, { t: "print", text: "<p>Hi Cy</p>" }],
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: "function hello() {\n  return <p>Hi</p>;\n}\nconst el = <hello />;",
      options: [YES, NO],
      answer: 1,
      check: { program: `${HEAD}function hello() {\n  return <p>Hi</p>;\n}\nconst el = <hello />;`, compiles: false },
      explain: L("Lower case means an HTML tag. TS2339: 'hello' does not exist on JSX.IntrinsicElements. Call it Hello.", "Minúscula significa etiqueta HTML. TS2339: 'hello' no existe en JSX.IntrinsicElements. Llámalo Hello.", "小文字は HTML タグ扱い。TS2339：'hello' は JSX.IntrinsicElements にない。Hello と名付けよう。"),
      win: [{ t: "shake" }],
    },
    say(L(
      "Props are items the parent HANDS to the child. The child uses them but never repaints them: props are read-only.",
      "Las props son objetos que el padre le ENTREGA al hijo. El hijo los usa pero nunca los repinta: son de solo lectura.",
      "プロップスは親が子に手渡すアイテム。子は使えるけど塗り替えちゃだめ。読み取り専用だよ。",
    )),
    {
      kind: "predict",
      prompt: HTML,
      code: "function Box({ children }: { children: React.ReactNode }) {\n  return <div>{children}</div>;\n}\n<Box><b>gem</b></Box>",
      options: ["<div><b>gem</b></div>", "<Box><b>gem</b></Box>", "<div></div>"],
      answer: 0,
      output: "<div><b>gem</b></div>",
      check: { program: show("function Box({ children }: { children: React.ReactNode }) {\n  return <div>{children}</div>;\n}", "<Box><b>gem</b></Box>"), compiles: true, stdout: "<div><b>gem</b></div>" },
      explain: L("Whatever sits between <Box> and </Box> arrives as the children prop.", "Lo que va entre <Box> y </Box> llega como la prop children.", "<Box> と </Box> の間に書いたものは children として届くよ。"),
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Box" }, { t: "item", kind: "gem", holder: "hero" }],
      win: [{ t: "give", to: "ally" }, { t: "print", text: "<div><b>gem</b></div>" }],
    },
    {
      kind: "pick",
      prompt: L("Type children so any JSX fits", "Tipa children para que acepte cualquier JSX", "どんな JSX でも入る children の型は？"),
      code: 'import React from "react";\nfunction Box({ children }: { children: ___ }) {\n  return <div>{children}</div>;\n}\nconst box = <Box><b>gem</b></Box>;',
      options: ["React.ReactNode", "string", "number"],
      answer: 0,
      check: { compiles: true, wrongFail: true },
      explain: L("React.ReactNode covers elements, strings, numbers, null and arrays. A <b> is not a string.", "React.ReactNode cubre elementos, strings, números, null y arreglos. Un <b> no es un string.", "React.ReactNode は要素・文字列・数値・null・配列を含む。<b> は string じゃないよ。"),
    },
    {
      kind: "predict",
      prompt: HTML,
      code: 'function Btn({ label = "OK" }: { label?: string }) {\n  return <button>{label}</button>;\n}\n<Btn />',
      options: ["<button></button>", "<button>OK</button>", "<button>undefined</button>"],
      answer: 1,
      output: "<button>OK</button>",
      check: { program: show('function Btn({ label = "OK" }: { label?: string }) {\n  return <button>{label}</button>;\n}', "<Btn />"), compiles: true, stdout: "<button>OK</button>" },
      explain: L("A default in the destructuring fills a missing prop, like any JS function parameter.", "Un valor por defecto en la desestructuración llena la prop que falta, como en cualquier función JS.", "分割代入のデフォルト値が、渡されなかったプロップスを埋めるよ。"),
    },
    {
      kind: "predict",
      prompt: COMPILES,
      code: "type Props = { name: string };\nfunction Hello({ name }: Props) {\n  return <p>Hi {name}</p>;\n}\nconst el = <Hello />;",
      options: [YES, NO],
      answer: 1,
      check: { program: `${HEAD}type Props = { name: string };\nfunction Hello({ name }: Props) {\n  return <p>Hi {name}</p>;\n}\nconst el = <Hello />;`, compiles: false },
      explain: L("TS2741: Property 'name' is missing. Required props must be passed.", "TS2741: falta la propiedad 'name'. Las props obligatorias se deben pasar.", "TS2741：'name' がない。必須のプロップスは渡さないとだめ。"),
      setup: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Hello" }],
      win: [{ t: "shake" }, { t: "say", actor: "ally", text: L("No name?", "¿Sin nombre?", "名前は？") }],
    },
    say(L(
      "A child that wants a change ASKS the parent: the parent passes a callback prop and the child calls it.",
      "Un hijo que quiere un cambio se lo PIDE al padre: el padre pasa una prop callback y el hijo la llama.",
      "子が変えたいときは親に頼む。親がコールバックをプロップスで渡し、子がそれを呼ぶんだ。",
    )),
    {
      kind: "pick",
      prompt: L("The potion button heals the parent's hp via", "El botón de poción cura el hp del padre con", "ポーションボタンが親の hp を回復するには"),
      code: "function Potion({ onUse }: { onUse: (hp: number) => void }) {\n  return <button onClick={() => ___}>Use</button>;\n}",
      options: ["onUse(10)", "hp = 10"],
      answer: 0,
      check: {
        program: `${HEAD}let hp = 3;\nfunction Potion({ onUse }: { onUse: (hp: number) => void }) {\n  return <button onClick={() => onUse(10)}>Use</button>;\n}\nconst button = Potion({ onUse: (n) => { hp = n; } });\nbutton.props.onClick();\nconsole.log(hp);`,
        compiles: true,
        stdout: "10",
      },
      explain: L("The child can't touch the parent's data. It calls the callback; the parent does the change.", "El hijo no puede tocar los datos del padre. Llama al callback y el padre hace el cambio.", "子は親のデータに触れない。コールバックを呼べば、親が変更してくれるよ。"),
      setup: [{ t: "tag", actor: "hero", text: "hp", value: "3" }, { t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "Potion" }],
      win: [{ t: "item", kind: "potion", holder: "ally" }, { t: "give", to: "hero" }, { t: "value", actor: "hero", text: "10" }],
    },
    {
      kind: "type",
      prompt: L("Destructure the label prop", "Desestructura la prop label", "label を分割代入で受け取ろう"),
      code: "function Badge({ ___ }: { label: string }) {\n  return <span>{label}</span>;\n}",
      answer: "label",
      check: { program: show("function Badge({ label }: { label: string }) {\n  return <span>{label}</span>;\n}", '<Badge label="MVP" />'), compiles: true, stdout: "<span>MVP</span>" },
      explain: L("Props arrive as ONE object; { label } pulls the label field out of it.", "Las props llegan como UN objeto; { label } saca de él el campo label.", "プロップスはひとつのオブジェクトで届く。{ label } で label を取り出すよ。"),
    },
    {
      kind: "run",
      prompt: L("Fix it: the badge must say MVP", "Arréglalo: la insignia debe decir MVP", "直そう：バッジに MVP と出して"),
      starter: `${HEAD}\nfunction Badge({ label }: { label: string }) {\n  return <span>{props.label}</span>;\n}\n\nconsole.log(renderToStaticMarkup(<Badge label="MVP" />));\n`,
      solution: `${HEAD}\nfunction Badge({ label }: { label: string }) {\n  return <span>{label}</span>;\n}\n\nconsole.log(renderToStaticMarkup(<Badge label="MVP" />));\n`,
      expect: "<span>MVP</span>",
      fallback: [
        String.raw`<span>\{\s*label\s*\}<\/span>`,
        String.raw`function\s+Badge\s*\(\s*props\b[\s\S]*\{\s*props\.label\s*\}`,
      ],
      explain: L("There is no props variable here: the destructured label is already in scope.", "Aquí no existe la variable props: label ya está disponible tras desestructurar.", "ここに props という変数はない。分割代入した label をそのまま使おう。"),
    },
  ],
};

// ─── 1.3 Lists and keys ──────────────────────────────────────────────────────
const listsAndKeys: LessonDef = {
  slug: "lists-and-keys",
  title: L("Roll call", "Pasar lista", "点呼"),
  concept: "keys",
  mode: "lesson",
  xp: 80,
  enemy: "react/key-twins",
  enemyName: L("KEY TWINS", "GEMELOS SIN KEY", "キーなし双子"),
  beats: [
    say(L(
      "Got an array? map it to JSX. React renders the resulting array of elements in order.",
      "¿Tienes un arreglo? Conviértelo en JSX con map. React muestra el arreglo de elementos en orden.",
      "配列があるなら map で JSX に変えよう。React は要素の配列を順番に表示するよ。",
    )),
    {
      kind: "act",
      prompt: L("Line up the villagers", "Forma a los aldeanos", "村人を並べよう"),
      steps: [
        { label: L("ITEMS", "ITEMS", "配列"), line: 'const items = ["sword", "shield"];', effects: [{ t: "item", kind: "scroll", holder: "hero" }, { t: "tag", actor: "hero", text: "items" }] },
        {
          label: L("MAP", "MAP", "map する"),
          line: "const rows = items.map(x => <li key={x}>{x}</li>);",
          effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "key=sword" }, { t: "enter", actor: "enemy" }, { t: "tag", actor: "enemy", text: "key=shield" }],
        },
        { label: L("WRAP", "ENVOLVER", "包む"), line: "const list = <ul>{rows}</ul>;" },
        {
          label: L("RENDER", "RENDERIZAR", "レンダー"),
          line: "renderToStaticMarkup(list);",
          effects: [{ t: "banner", text: L("ROLL CALL", "PASAR LISTA", "点呼！") }, { t: "print", text: "<ul><li>sword</li><li>shield</li></ul>" }],
          output: "<ul><li>sword</li><li>shield</li></ul>",
        },
      ],
    },
    say(L(
      "Each item needs a key: a name tag unique among its siblings. React uses it to recognise each item after a shuffle.",
      "Cada elemento necesita una key: una etiqueta única entre sus hermanos. React la usa para reconocerlo tras mezclarlos.",
      "要素にはキーが必要。兄弟の中で一意な名札だよ。並べ替えても React が見分けられる。",
    )),
    {
      kind: "predict",
      prompt: HTML,
      code: '<ul>{["a", "b"].map(x => <li key={x}>{x}</li>)}</ul>',
      options: ["<ul><li>a</li><li>b</li></ul>", '<ul><li key="a">a</li><li key="b">b</li></ul>', "<ul>ab</ul>"],
      answer: 0,
      output: "<ul><li>a</li><li>b</li></ul>",
      check: { program: show("", '<ul>{["a", "b"].map(x => <li key={x}>{x}</li>)}</ul>'), compiles: true, stdout: "<ul><li>a</li><li>b</li></ul>" },
      explain: L("key is for React only: it never reaches the HTML.", "key es solo para React: nunca llega al HTML.", "キーは React 専用。HTML には出てこないよ。"),
      win: [{ t: "print", text: "<ul><li>a</li><li>b</li></ul>" }],
    },
    {
      kind: "pick",
      prompt: L("Best key for todos from a server", "La mejor key para todos del servidor", "サーバーから来た todo に最適なキー"),
      code: "todos.map(todo => <li key={___}>{todo.text}</li>)",
      options: ["todo.id", "Math.random()", '"todo"'],
      answer: 0,
      check: {
        program: show('const todos = [{ id: 7, text: "Feed cat" }, { id: 9, text: "Fix bug" }];', "<ul>{todos.map(todo => <li key={todo.id}>{todo.text}</li>)}</ul>"),
        compiles: true,
        stdout: "<ul><li>Feed cat</li><li>Fix bug</li></ul>",
      },
      explain: L("An id is stable and unique. Random keys change every render; a fixed string repeats.", "Un id es estable y único. Las keys aleatorias cambian en cada render; un string fijo se repite.", "id は安定していて一意。ランダムは毎回変わり、固定の文字列は重複するよ。"),
      setup: [{ t: "enter", actor: "ally" }, { t: "enter", actor: "enemy" }],
      win: [{ t: "tag", actor: "ally", text: "key=7" }, { t: "tag", actor: "enemy", text: "key=9" }],
    },
    {
      kind: "act",
      prompt: L("See why index keys trip up", "Mira por qué fallan las keys de índice", "インデックスのキーがつまずく理由"),
      steps: [
        {
          label: L("INDEX KEYS", "KEYS ÍNDICE", "番号キー"),
          line: "rows.map((row, i) => <Row key={i} row={row} />)",
          effects: [{ t: "enter", actor: "ally" }, { t: "tag", actor: "ally", text: "milk", value: "key=0" }, { t: "item", kind: "gem", holder: "ally" }, { t: "say", actor: "ally", text: L("typed: 2 L", "escribí: 2 L", "入力：2 L") }],
        },
        {
          label: L("INSERT TOP", "INSERTAR ARRIBA", "先頭に追加"),
          line: '// "eggs" is inserted at the top',
          effects: [{ t: "enter", actor: "enemy" }, { t: "tag", actor: "enemy", text: "eggs", value: "key=0" }, { t: "give", to: "enemy" }, { t: "value", actor: "ally", text: "key=1" }, { t: "shake" }, { t: "say", actor: "enemy", text: L("2 L of eggs?!", "¿2 L de huevos?", "卵 2 L？！") }],
        },
        {
          label: L("ID KEYS", "KEYS CON ID", "id のキー"),
          line: "rows.map(row => <Row key={row.id} row={row} />)",
          effects: [{ t: "give", to: "ally" }, { t: "value", actor: "ally", text: "key=m1" }, { t: "value", actor: "enemy", text: "key=e2" }, { t: "banner", text: L("FIXED", "ARREGLADO", "解決！") }],
        },
      ],
    },
    say(L(
      "Index keys glue state to the POSITION. Insert at the top and the typed text stays put, on the wrong row.",
      "Las keys de índice pegan el estado a la POSICIÓN. Inserta arriba y el texto escrito se queda ahí, en la fila equivocada.",
      "番号キーは状態を「位置」に結びつける。先頭に追加すると、入力が違う行に残っちゃう。",
    )),
    {
      kind: "predict",
      prompt: L("Index keys, insert at the top. Typed text…", "Keys de índice, insertas arriba. El texto…", "番号キーで先頭に追加。入力は…"),
      code: '// React keeps state by key; here keys are indexes\nconst typed = new Map([[0, "2 L"]]); // typed in "milk"\nconst rows = ["eggs", "milk"]; // "eggs" inserted\nrows.map((row, i) => row + ":" + (typed.get(i) ?? ""));',
      options: [L("Lands on the wrong row", "Cae en la fila equivocada", "違う行にのる"), L("Moves with its row", "Se mueve con su fila", "行と一緒に動く"), L("React throws an error", "React lanza un error", "React がエラーを出す")],
      answer: 0,
      check: {
        program: 'const typed = new Map([[0, "2 L"]]);\nconst rows = ["eggs", "milk"];\nconsole.log(rows.map((row, i) => row + ":" + (typed.get(i) ?? "")).join(" "));',
        compiles: true,
        stdout: "eggs:2 L milk:",
      },
      explain: L("React matches by key. With index keys, key 0 is now eggs, so eggs inherits milk's state. No error, just a silent bug.", "React empareja por key. Con índices, la key 0 ahora es eggs y hereda el estado de milk. Sin error: un bug silencioso.", "React はキーで対応づける。番号だとキー 0 は eggs になり、milk の状態を受け継ぐ。エラーなしの静かなバグ。"),
      win: [{ t: "say", actor: "enemy", text: L("Not my text!", "¡No es mi texto!", "ぼくのじゃない！") }],
    },
    {
      kind: "predict",
      prompt: HTML,
      code: "function Item({ done }: { done: boolean }) {\n  if (done) return null;\n  return <li>todo</li>;\n}\n<ul><Item done /><Item done={false} /></ul>",
      options: ["<ul><li>todo</li></ul>", "<ul><li>todo</li><li>todo</li></ul>", "<ul>null<li>todo</li></ul>"],
      answer: 0,
      output: "<ul><li>todo</li></ul>",
      check: { program: show("function Item({ done }: { done: boolean }) {\n  if (done) return null;\n  return <li>todo</li>;\n}", "<ul><Item done /><Item done={false} /></ul>"), compiles: true, stdout: "<ul><li>todo</li></ul>" },
      explain: L("Returning null renders nothing. done alone means done={true}.", "Devolver null no genera nada. done solo equivale a done={true}.", "null を返すと何も表示されない。done だけなら done={true} と同じだよ。"),
    },
    say(L(
      "Show or hide with cond && <X /> or a ternary a ? b : c. And beware: a length of 0 renders a 0!",
      "Muestra u oculta con cond && <X /> o un ternario a ? b : c. Y ojo: una longitud 0 muestra un 0.",
      "表示の切り替えは cond && <X /> か三項演算子 a ? b : c。長さ 0 は 0 と表示されるので注意！",
    )),
    {
      kind: "predict",
      prompt: HTML,
      code: "const items: string[] = [];\n<div>{items.length && <ul />}</div>",
      options: ["<div></div>", "<div>0</div>", "<div><ul></ul></div>"],
      answer: 1,
      output: "<div>0</div>",
      check: { program: show("const items: string[] = [];", "<div>{items.length && <ul />}</div>"), compiles: true, stdout: "<div>0</div>" },
      explain: L("items.length is 0, and 0 renders. Write items.length > 0 && <ul /> instead.", "items.length es 0, y el 0 se muestra. Escribe items.length > 0 && <ul /> en su lugar.", "items.length は 0 で、0 は表示される。items.length > 0 && <ul /> と書こう。"),
      win: [{ t: "say", actor: "enemy", text: L("Zero again!", "¡Otra vez cero!", "また 0 だ！") }],
    },
    {
      kind: "type",
      prompt: L("Complete the ternary", "Completa el ternario", "三項演算子を完成させよう"),
      code: '<p>{loggedIn ___ "Welcome back" : "Please sign in"}</p>',
      answer: "?",
      check: { program: show("const loggedIn: boolean = false;", '<p>{loggedIn ? "Welcome back" : "Please sign in"}</p>'), compiles: true, stdout: "<p>Please sign in</p>" },
      explain: L("cond ? a : b picks one of two values: perfect for either/or UI.", "cond ? a : b elige uno de dos valores: ideal para mostrar una cosa u otra.", "cond ? a : b はふたつの値からひとつを選ぶ。どちらかを出す UI にぴったり。"),
    },
    {
      kind: "order",
      prompt: L("Order it: build and print the list", "Ordena: arma e imprime la lista", "並べよう：リストを作って出力"),
      lines: [
        'const items = ["a", "b"];',
        "const rows = items.map(x => <li key={x}>{x}</li>);",
        "console.log(renderToStaticMarkup(<ul>{rows}</ul>));",
      ],
      check: {
        program: `${HEAD}const items = ["a", "b"];\nconst rows = items.map(x => <li key={x}>{x}</li>);\nconsole.log(renderToStaticMarkup(<ul>{rows}</ul>));`,
        compiles: true,
        stdout: "<ul><li>a</li><li>b</li></ul>",
      },
      explain: L("Data first, then map it to keyed elements, then render the list.", "Primero los datos, luego map a elementos con key, luego se renderiza la lista.", "まずデータ、次にキー付き要素へ map、最後にリストをレンダー。"),
    },
    {
      kind: "run",
      prompt: L("Fix it: the list comes out empty", "Arréglalo: la lista sale vacía", "直そう：リストが空っぽ"),
      starter: `${HEAD}\nconst items = [{ id: 1, name: "Sword" }, { id: 2, name: "Shield" }];\n\nconst list = <ul>{items.map(i => { <li key={i.id}>{i.name}</li> })}</ul>;\n\nconsole.log(renderToStaticMarkup(list));\n`,
      solution: `${HEAD}\nconst items = [{ id: 1, name: "Sword" }, { id: 2, name: "Shield" }];\n\nconst list = <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>;\n\nconsole.log(renderToStaticMarkup(list));\n`,
      expect: "<ul><li>Sword</li><li>Shield</li></ul>",
      fallback: [
        String.raw`map\(\s*\(?\s*i\s*\)?\s*=>\s*\(?\s*<li`,
        String.raw`=>\s*\{\s*return\s*\(?\s*<li`,
      ],
      explain: L("An arrow with { } needs return. Drop the braces so the <li> is the returned value.", "Una flecha con { } necesita return. Quita las llaves para que el <li> sea el valor devuelto.", "{ } 付きのアロー関数には return が必要。波かっこを外せば <li> が返るよ。"),
    },
  ],
};

// ─── Boss: JSX Gremlin ───────────────────────────────────────────────────────
const CARD = "function Card({ title, children }: { title: string; children: React.ReactNode }) {\n  return <section><h2>{title}</h2>{children}</section>;\n}";
const ACTION = 'type Props = { variant: "link"; href: string } | { variant: "button"; onClick: () => void };\nfunction Action(p: Props) {\n  return <span>{p.variant}</span>;\n}';

const jsxGremlin: LessonDef = {
  slug: "jsx-gremlin",
  title: L("BOSS: JSX Gremlin", "JEFE: Gremlin JSX", "ボス：JSX グレムリン"),
  concept: "jsx",
  mode: "boss",
  xp: 190,
  enemy: "typescript/nan-gremlin",
  enemyName: L("JSX GREMLIN", "GREMLIN JSX", "JSX グレムリン"),
  beats: [
    enemySays(L(
      "Hee hee! I sneak zeros into lists and steal keys from twins. Can you read my markup?",
      "¡Ji ji! Meto ceros en las listas y robo keys a los gemelos. ¿Sabes leer mi marcado?",
      "ヒヒッ！リストに 0 を忍ばせ、双子のキーを盗むのさ。俺のマークアップが読めるかな？",
    )),
    {
      kind: "predict", time: 12, prompt: HTML,
      code: '<p>{[1, 2, 3].length > 0 && "has items"}</p>',
      options: ["<p>has items</p>", "<p>true</p>", "<p>3</p>"], answer: 0,
      check: { program: show("", '<p>{[1, 2, 3].length > 0 && "has items"}</p>'), compiles: true, stdout: "<p>has items</p>" },
      explain: L("3 > 0 is true, so && returns the string.", "3 > 0 es true, así que && devuelve el string.", "3 > 0 は true なので && は文字列を返す。"),
    },
    {
      kind: "predict", time: 12, prompt: HTML,
      code: "const count: number = 0;\n<p>{count && \"items\"}</p>",
      options: ["<p></p>", "<p>0</p>", "<p>items</p>"], answer: 1,
      check: { program: show("const count: number = 0;", '<p>{count && "items"}</p>'), compiles: true, stdout: "<p>0</p>" },
      explain: L("0 is a number, and numbers render.", "0 es un número, y los números se muestran.", "0 は数値。数値は表示されるよ。"),
    },
    {
      kind: "predict", time: 15, prompt: COMPILES,
      code: 'const user = { name: "Ada" };\nconst el = <p>{user}</p>;',
      options: [YES, NO], answer: 1,
      check: { program: `${HEAD}const user = { name: "Ada" };\nconst el = <p>{user}</p>;`, compiles: false },
      explain: L("A plain object is not a ReactNode. Render a field: {user.name}.", "Un objeto plano no es un ReactNode. Muestra un campo: {user.name}.", "ただのオブジェクトは ReactNode じゃない。{user.name} と書こう。"),
    },
    {
      kind: "predict", time: 15, prompt: HTML,
      code: `${CARD}\n<Card title="Bag"><p>gem</p></Card>`,
      options: ["<section><h2>Bag</h2><p>gem</p></section>", "<section><h2>Bag</h2></section>", "<Card><p>gem</p></Card>"], answer: 0,
      check: { program: show(CARD, '<Card title="Bag"><p>gem</p></Card>'), compiles: true, stdout: "<section><h2>Bag</h2><p>gem</p></section>" },
      explain: L("title is a prop; the <p> arrives as children.", "title es una prop; el <p> llega como children.", "title はプロップス、<p> は children として届く。"),
    },
    {
      kind: "type", time: 12,
      prompt: L("JSX's name for the for attribute", "El nombre JSX del atributo for", "JSX での for 属性の名前は？"),
      code: '<label ___="email">Email</label>',
      answer: "htmlFor",
      check: { program: show("", '<label htmlFor="email">Email</label>'), compiles: true, stdout: '<label for="email">Email</label>' },
      explain: L("for is a JS keyword, so JSX uses htmlFor.", "for es palabra reservada de JS; JSX usa htmlFor.", "for は JS の予約語なので htmlFor を使う。"),
    },
    {
      kind: "pick", time: 12,
      prompt: L("Name it so JSX finds it", "Nómbralo para que JSX lo encuentre", "JSX が見つけられる名前は？"),
      code: 'import React from "react";\nfunction ___() {\n  return <p>Hi</p>;\n}\nconst el = <Greeting />;',
      options: ["Greeting", "greeting"], answer: 0,
      check: { compiles: true, wrongFail: true },
      explain: L("Components start with a capital letter.", "Los componentes empiezan con mayúscula.", "コンポーネントは大文字で始める。"),
    },
    {
      kind: "pick", time: 12,
      prompt: L("Which attribute tells React who is who?", "¿Qué atributo le dice a React quién es quién?", "React に誰が誰かを教える属性は？"),
      code: "todos.map(t => <li ___={t.id}>{t.text}</li>)",
      options: ["key", "id", "name"], answer: 0,
      check: {
        program: show('const todos = [{ id: 1, text: "Nap" }];', "<ul>{todos.map(t => <li key={t.id}>{t.text}</li>)}</ul>"),
        compiles: true,
        stdout: "<ul><li>Nap</li></ul>",
      },
      explain: L("key identifies siblings; id is just an HTML attribute.", "key identifica a los hermanos; id es solo un atributo HTML.", "兄弟を見分けるのは key。id はただの HTML 属性。"),
    },
    {
      kind: "predict", time: 12, prompt: HTML,
      code: '<p>{"<i>hi</i>"}</p>',
      options: ["<p><i>hi</i></p>", "<p>&lt;i&gt;hi&lt;/i&gt;</p>"], answer: 1,
      check: { program: show("", '<p>{"<i>hi</i>"}</p>'), compiles: true, stdout: "<p>&lt;i&gt;hi&lt;/i&gt;</p>" },
      explain: L("Strings are escaped, never parsed as tags.", "Los strings se escapan, nunca se leen como etiquetas.", "文字列はエスケープされ、タグにはならない。"),
    },
    {
      kind: "predict", time: 12, prompt: HTML,
      code: "function Hidden() {\n  return null;\n}\n<div><Hidden />x</div>",
      options: ["<div>x</div>", "<div>nullx</div>", "<div><Hidden></Hidden>x</div>"], answer: 0,
      check: { program: show("function Hidden() {\n  return null;\n}", "<div><Hidden />x</div>"), compiles: true, stdout: "<div>x</div>" },
      explain: L("A component returning null renders nothing.", "Un componente que devuelve null no genera nada.", "null を返す部品は何も表示しない。"),
    },
    {
      kind: "predict", time: 15, prompt: COMPILES,
      code: `${ACTION}\n<Action variant="link" onClick={() => {}} />`,
      options: [YES, NO], answer: 1,
      check: { program: `${HEAD}${ACTION}\nconst el = <Action variant="link" onClick={() => {}} />;`, compiles: false },
      explain: L("variant=\"link\" needs href and has no onClick: the union rejects the mix.", "variant=\"link\" requiere href y no tiene onClick: la unión rechaza la mezcla.", "variant=\"link\" には href が必要で onClick はない。ユニオンが混在を拒否する。"),
    },
    {
      kind: "predict", time: 12, prompt: HTML,
      code: "<b style={{ fontSize: 20 }}>x</b>",
      options: ['<b style="font-size:20px">x</b>', '<b style="fontSize:20">x</b>'], answer: 0,
      check: { program: show("", "<b style={{ fontSize: 20 }}>x</b>"), compiles: true, stdout: '<b style="font-size:20px">x</b>' },
      explain: L("camelCase becomes kebab-case and numbers get px.", "camelCase pasa a kebab-case y los números reciben px.", "キャメルケースはケバブケースに、数値には px が付く。"),
    },
    enemySays(L(
      "Grr... no stray zeros, no missing keys... The village is yours, component crafter!",
      "Grr... ni ceros sueltos ni keys perdidas... ¡La aldea es tuya, artesano de componentes!",
      "グルル…はぐれ 0 も、キーの抜けもなし…村はおまえのものだ、コンポーネント職人！",
    )),
  ],
};

export const jsxVillage: RegionDef = {
  slug: "jsx-village",
  name: L("JSX Village", "Aldea JSX", "JSX 村"),
  subtitle: L("JSX · components · props · keys", "JSX · componentes · props · keys", "JSX・コンポーネント・プロップス・キー"),
  theme: "village",
  lessons: [jsxBasics, componentsAndProps, listsAndKeys, jsxGremlin],
};
