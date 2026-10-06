import type { ExamDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { juniorTasks, midTasks, seniorTasks } from "./tasks.ts";
import { juniorTraceDebug, midTraceDebug, seniorTraceDebug } from "./trace-debug.ts";

// Entry exams that simulate company screenings for WebGL roles. Topics, levels and bank sizes follow
// docs/research/webgl-threejs-curriculum.md ("Entry exams" > "WebGL moon") and
// docs/research/webgl-threejs-hiring-assessments.md. The runner has no GPU: runnable claims are pure math,
// and WebGL API claims are proven by type-checking against `declare const gl: WebGL2RenderingContext`.
// `npm run content:verify -- --lang=webgl --only=exam:`.

const code = (...lines: string[]) => lines.join("\n");

const YN = [L("Yes", "Sí", "はい"), L("No", "No", "いいえ")];
const PRINTS = L("What does it print?", "¿Qué imprime?", "何が表示される？");
const COMPILES = L("Does it compile (tsc --strict)?", "¿Compila (tsc --strict)?", "コンパイルは通る？(strict)");
const GL = "declare const gl: WebGL2RenderingContext;";

const PIPELINE_TYPES = code(
  'type Vertex = { kind: "vertex" };',
  'type ClipPos = { kind: "clip" };',
  'type Triangle = { kind: "triangle" };',
  'type Fragment = { kind: "fragment" };',
  'type Color = { kind: "color" };',
  "declare const vertices: Vertex[];",
  "declare function runVertexShader(v: Vertex[]): ClipPos[];",
  "declare function assemble(c: ClipPos[]): Triangle[];",
  "declare function rasterize(t: Triangle[]): Fragment[];",
  "declare function runFragmentShader(f: Fragment[]): Color[];",
);
const PIPELINE_LINES = [
  "const clip = runVertexShader(vertices);",
  "const triangles = assemble(clip);",
  "const fragments = rasterize(triangles);",
  "const colors = runFragmentShader(fragments);",
];

const BUILD_LINES = [
  "const sh = gl.createShader(gl.VERTEX_SHADER)!;",
  "gl.shaderSource(sh, src);",
  "gl.compileShader(sh);",
  "gl.attachShader(prog, sh);",
  "gl.linkProgram(prog);",
  "gl.useProgram(prog);",
];

export const exams: ExamDef[] = [
  // ─── JUNIOR ───────────────────────────────────────────────────────────────
  {
    slug: "junior",
    level: "junior",
    title: L("Junior WebGL Developer", "WebGL Developer Junior", "ジュニア WebGL 開発者"),
    description: L(
      "Screening for a junior WebGL role: pipeline, clip space, GPU state, shaders, buffers, attributes, drawing, textures.",
      "Filtro para un puesto junior de WebGL: pipeline, clip space, estado, shaders, buffers, atributos, dibujo y texturas.",
      "ジュニア WebGL 職の選考：パイプライン、クリップ空間、状態、シェーダー、バッファ、属性、描画、テクスチャ。",
    ),
    count: 12,
    passPct: 70,
    secondsPerQuestion: 30,
    codeCount: 1,
    questions: [
      ...juniorTraceDebug,
      ...juniorTasks,
      // pipeline
      {
        topic: "pipeline", difficulty: 1, kind: "predict",
        prompt: L("drawArrays with 6 vertices: shader runs, triangles?", "drawArrays con 6 vértices: ¿ejecuciones y triángulos?", "6頂点の描画：実行回数と三角形数は？"),
        code: code(
          "let vsRuns = 0;",
          "const vertexShader = (v: number[]) => { vsRuns++; return v; };",
          "const verts = [[0, 0], [1, 0], [0, 1], [1, 1], [1, 0], [0, 1]];",
          "verts.map(vertexShader);",
          "console.log(vsRuns, verts.length / 3);",
        ),
        options: ["6 2", "2 6", "1 2"], answer: 0,
        explain: L(
          "The vertex shader runs once per vertex. With TRIANGLES, every 3 vertices make one triangle: 6 / 3 = 2.",
          "El vertex shader corre una vez por vértice. Con TRIANGLES, cada 3 vértices forman un triángulo: 6 / 3 = 2.",
          "頂点シェーダーは頂点ごとに1回動く。TRIANGLES では3頂点で1つの三角形：6 / 3 = 2。",
        ),
        check: { compiles: true, stdout: "6 2" },
      },
      {
        topic: "pipeline", difficulty: 2, kind: "predict",
        prompt: L("A triangle covers 40 pixels: VS runs, FS runs?", "Un triángulo cubre 40 píxeles: ¿VS y FS?", "三角形が40ピクセル：VS と FS の回数は？"),
        code: code(
          "let vs = 0, fs = 0;",
          "const triangle = [[0, 0], [8, 0], [0, 10]];",
          "triangle.forEach(() => vs++);",
          "const covered = (8 * 10) / 2;",
          "for (let i = 0; i < covered; i++) fs++;",
          "console.log(vs, fs);",
        ),
        options: ["3 40", "40 3", "3 3"], answer: 0,
        explain: L(
          "Vertex shader: once per vertex (3). Rasterization makes one fragment per covered pixel, and the fragment shader runs for each (40).",
          "Vertex shader: una vez por vértice (3). La rasterización crea un fragmento por píxel cubierto y el fragment shader corre en cada uno (40).",
          "頂点シェーダーは頂点ごと（3回）。ラスタライズで覆ったピクセルごとにフラグメントができ、それぞれでフラグメントシェーダーが動く（40回）。",
        ),
        check: { compiles: true, stdout: "3 40" },
      },
      {
        topic: "pipeline", difficulty: 2, kind: "order",
        prompt: L("Order the pipeline stages", "Ordena las etapas del pipeline", "パイプラインの順に並べよう"),
        lines: PIPELINE_LINES,
        explain: L(
          "Vertex shader → primitive assembly → rasterization → fragment shader. Then depth/blend tests write the framebuffer.",
          "Vertex shader → ensamblado de primitivas → rasterización → fragment shader. Luego los tests de profundidad y blending escriben el framebuffer.",
          "頂点シェーダー → プリミティブ組み立て → ラスタライズ → フラグメントシェーダー。最後に深度・ブレンドを経て書き込む。",
        ),
        check: { compiles: true, program: code(PIPELINE_TYPES, ...PIPELINE_LINES) },
      },
      // clip_space
      {
        topic: "clip_space", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("const toClipX = (px: number, w: number) => (px / w) * 2 - 1;", "console.log(toClipX(200, 800));"),
        options: ["-0.5", "0.25", "0.5"], answer: 0,
        explain: L(
          "Clip x goes from -1 (left) to +1 (right). 200 of 800 is a quarter: 0.25 × 2 − 1 = −0.5.",
          "El clip x va de -1 (izquierda) a +1 (derecha). 200 de 800 es un cuarto: 0.25 × 2 − 1 = −0.5.",
          "クリップ x は -1（左）〜 +1（右）。800 中 200 は 1/4：0.25 × 2 − 1 = −0.5。",
        ),
        check: { compiles: true, stdout: "-0.5" },
      },
      {
        topic: "clip_space", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code("const toClipY = (py: number, h: number) => 1 - (py / h) * 2;", "console.log(toClipY(0, 600), toClipY(150, 600));"),
        options: ["1 0.5", "-1 -0.5", "0 0.25"], answer: 0,
        explain: L(
          "Pixel y grows DOWN, clip y grows UP, so the formula flips: the top row (0) is +1, a quarter down is 0.5.",
          "El y en píxeles crece hacia ABAJO y el y de clip hacia ARRIBA, así que se invierte: la fila 0 es +1, un cuarto abajo es 0.5.",
          "ピクセルの y は下へ、クリップの y は上へ増えるので反転する。一番上（0）は +1、1/4 下は 0.5。",
        ),
        check: { compiles: true, stdout: "1 0.5" },
      },
      {
        topic: "clip_space", difficulty: 2, kind: "predict",
        prompt: L("Which vertices are inside clip space?", "¿Qué vértices quedan dentro del clip space?", "クリップ空間の内側にあるのは？"),
        code: code("const inside = (x: number) => x >= -1 && x <= 1;", "console.log([1.5, -1, 0.2].map(inside).join(\",\"));"),
        options: ["false,true,true", "true,true,true", "false,false,true"], answer: 0,
        explain: L(
          "After the divide by w, only -1..+1 is visible. x = 1.5 is outside and gets clipped; -1 is exactly on the edge.",
          "Tras dividir entre w, solo -1..+1 es visible. x = 1.5 queda fuera y se recorta; -1 está justo en el borde.",
          "w で割ったあと見えるのは -1〜+1 だけ。x = 1.5 は外なのでクリップされ、-1 はちょうど端。",
        ),
        check: { compiles: true, stdout: "false,true,true" },
      },
      // state_machine
      {
        topic: "state_machine", difficulty: 1, kind: "predict", prompt: COMPILES,
        code: code("declare const canvas: HTMLCanvasElement;", 'const gl = canvas.getContext("webgl2");', "gl.clearColor(0, 0, 0, 1);"),
        options: YN, answer: 1,
        explain: L(
          "TS18047: gl is possibly null. getContext returns null when WebGL2 is unsupported, so check it before use.",
          "TS18047: gl puede ser null. getContext devuelve null si no hay WebGL2, así que compruébalo antes de usarlo.",
          "TS18047：gl は null かもしれない。WebGL2 非対応なら getContext は null を返すので先に確認しよう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "state_machine", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code(GL, 'gl.drawArrays("TRIANGLES", 0, 3);'),
        options: YN, answer: 1,
        explain: L(
          "TS2345: WebGL enums are numbers on the context, like gl.TRIANGLES, not strings.",
          "TS2345: los enums de WebGL son números del contexto, como gl.TRIANGLES, no strings.",
          "TS2345：WebGL の列挙値は gl.TRIANGLES のようなコンテキスト上の数値で、文字列ではない。",
        ),
        check: { compiles: false },
      },
      {
        topic: "state_machine", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: code(
          "class FakeGL {",
          "  bound = \"\";",
          "  sizes: Record<string, number> = { A: 0, B: 0 };",
          "  bindBuffer(name: string) { this.bound = name; }",
          "  bufferData(data: number[]) { this.sizes[this.bound] = data.length; }",
          "}",
          "const gl = new FakeGL();",
          'gl.bindBuffer("A");',
          'gl.bindBuffer("B");',
          "gl.bufferData([1, 2, 3]);",
          "console.log(`A=${gl.sizes.A} B=${gl.sizes.B}`);",
        ),
        options: ["A=0 B=3", "A=3 B=0", "A=3 B=3"], answer: 0,
        explain: L(
          "Bind, then act: bufferData fills whatever is bound to ARRAY_BUFFER at that moment, which is B.",
          "Enlaza y luego actúa: bufferData llena lo que esté enlazado a ARRAY_BUFFER en ese momento, que es B.",
          "バインドしてから操作。bufferData はその時 ARRAY_BUFFER にバインドされている B に入る。",
        ),
        check: { compiles: true, stdout: "A=0 B=3" },
      },
      // shaders_glsl
      {
        topic: "shaders_glsl", difficulty: 1, kind: "pick",
        prompt: L("Create the shader that runs per vertex", "Crea el shader que corre por vértice", "頂点ごとに動くシェーダーを作ろう"),
        code: code(GL, "const sh = gl.createShader(gl.___);"),
        options: ["VERTEX_SHADER", "FRAGMENT_SHADER", "PIXEL_SHADER"], answer: 0,
        explain: L(
          "VERTEX_SHADER runs per vertex and writes gl_Position. FRAGMENT_SHADER runs per fragment. There is no PIXEL_SHADER.",
          "VERTEX_SHADER corre por vértice y escribe gl_Position. FRAGMENT_SHADER corre por fragmento. PIXEL_SHADER no existe.",
          "VERTEX_SHADER は頂点ごとに動き gl_Position を書く。FRAGMENT_SHADER はフラグメントごと。PIXEL_SHADER はない。",
        ),
        check: { compiles: true },
      },
      {
        topic: "shaders_glsl", difficulty: 1, kind: "pick",
        prompt: L("u_color is the same for the whole draw: set it", "u_color es igual en todo el draw: asígnalo", "u_color は描画全体で共通：設定しよう"),
        code: code(GL, "declare const loc: WebGLUniformLocation | null;", "gl.___(loc, 1, 0, 0, 1);"),
        options: ["uniform4f", "vertexAttrib4f"], answer: 0,
        explain: L(
          "A uniform has one value for every vertex and fragment in a draw. vertexAttrib4f takes an attribute index, not a uniform location.",
          "Un uniform tiene un solo valor para todos los vértices y fragmentos del draw. vertexAttrib4f recibe un índice de atributo.",
          "uniform は描画中の全頂点・全フラグメントで同じ値。vertexAttrib4f は属性の番号を受け取る別物。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "shaders_glsl", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code(GL, "declare const src: string;", "const vs = gl.createShader(gl.VERTEX_SHADER);", "gl.shaderSource(vs, src);"),
        options: YN, answer: 1,
        explain: L(
          "TS2345: createShader returns WebGLShader | null. Check for null (or throw) before passing it on.",
          "TS2345: createShader devuelve WebGLShader | null. Comprueba null (o lanza un error) antes de pasarlo.",
          "TS2345：createShader は WebGLShader | null を返す。渡す前に null を確認しよう。",
        ),
        check: { compiles: false },
      },
      // buffers
      {
        topic: "buffers", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: "console.log(new Float32Array(9).byteLength);",
        options: ["36", "9", "72"], answer: 0,
        explain: L(
          "A Float32Array element is 4 bytes, so 9 floats (3 vertices of xyz) take 36 bytes.",
          "Cada elemento de Float32Array ocupa 4 bytes, así que 9 floats (3 vértices xyz) ocupan 36 bytes.",
          "Float32Array の要素は 4 バイト。9 個（xyz の3頂点）で 36 バイト。",
        ),
        check: { compiles: true, stdout: "36" },
      },
      {
        topic: "buffers", difficulty: 2, kind: "predict", prompt: PRINTS,
        code: "console.log(new Uint16Array([65535, 65536]).join(\",\"));",
        options: ["65535,0", "65535,65536", "65535,65535"], answer: 0,
        explain: L(
          "Uint16 holds 0..65535. 65536 wraps around to 0 silently, no error. Big index buffers need Uint32Array.",
          "Uint16 guarda 0..65535. 65536 da la vuelta a 0 en silencio, sin error. Los índices grandes necesitan Uint32Array.",
          "Uint16 は 0〜65535。65536 はエラーなしで 0 に戻る。大きなインデックスには Uint32Array を。",
        ),
        check: { compiles: true, stdout: "65535,0" },
      },
      {
        topic: "buffers", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code(GL, "gl.bufferData(gl.ARRAY_BUFFER, [0, 1, 2], gl.STATIC_DRAW);"),
        options: YN, answer: 1,
        explain: L(
          "No overload accepts a plain number[]: the GPU reads raw bytes. Wrap it: new Float32Array([0, 1, 2]).",
          "Ninguna sobrecarga acepta un number[] común: la GPU lee bytes crudos. Envuélvelo: new Float32Array([0, 1, 2]).",
          "普通の number[] を受け取るオーバーロードはない。GPU は生のバイトを読む。new Float32Array([0, 1, 2]) で包もう。",
        ),
        check: { compiles: false },
      },
      // attributes
      {
        topic: "attributes", difficulty: 1, kind: "predict",
        prompt: L("Interleaved xyz + uv floats: stride and uv offset", "xyz + uv intercalados: stride y offset de uv", "xyz + uv 交互配置：stride と uv の offset"),
        code: code("const stride = (3 + 2) * Float32Array.BYTES_PER_ELEMENT;", "const uvOffset = 3 * Float32Array.BYTES_PER_ELEMENT;", "console.log(stride, uvOffset);"),
        options: ["20 12", "5 3", "20 3"], answer: 0,
        explain: L(
          "stride and offset are in BYTES: 5 floats × 4 = 20 to reach the next vertex; uv starts after 3 floats = 12.",
          "stride y offset van en BYTES: 5 floats × 4 = 20 hasta el siguiente vértice; uv empieza tras 3 floats = 12.",
          "stride と offset はバイト単位。次の頂点まで 5 × 4 = 20、uv は float 3 個のあと = 12。",
        ),
        check: { compiles: true, stdout: "20 12" },
      },
      {
        topic: "attributes", difficulty: 2, kind: "predict",
        prompt: L("A normalized UNSIGNED_BYTE 128 reaches the shader as", "Un UNSIGNED_BYTE 128 normalizado llega como", "正規化した UNSIGNED_BYTE 128 は？"),
        code: "console.log((128 / 255).toFixed(3));",
        options: ["0.502", "128.000", "0.500"], answer: 0,
        explain: L(
          "With normalize = true, unsigned bytes 0..255 map to 0..1: 128 / 255 ≈ 0.502. Handy for compact colors.",
          "Con normalize = true, los bytes 0..255 pasan a 0..1: 128 / 255 ≈ 0.502. Útil para colores compactos.",
          "normalize = true なら 0〜255 が 0〜1 になる：128 / 255 ≈ 0.502。色を小さく詰めるのに便利。",
        ),
        check: { compiles: true, stdout: "0.502" },
      },
      {
        topic: "attributes", difficulty: 2, kind: "pick",
        prompt: L("a_position is per-vertex: get its location", "a_position es por vértice: obtén su ubicación", "a_position は頂点ごと：場所を取ろう"),
        code: code(GL, "declare const prog: WebGLProgram;", 'const loc = gl.___(prog, "a_position");', "gl.enableVertexAttribArray(loc);"),
        options: ["getAttribLocation", "getUniformLocation"], answer: 0,
        explain: L(
          "getAttribLocation returns a number (-1 if missing). getUniformLocation returns WebGLUniformLocation | null: TS2345 here.",
          "getAttribLocation devuelve un number (-1 si falta). getUniformLocation devuelve WebGLUniformLocation | null: TS2345 aquí.",
          "getAttribLocation は number（なければ -1）。getUniformLocation は WebGLUniformLocation | null なのでここでは TS2345。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      // drawing
      {
        topic: "drawing", difficulty: 1, kind: "predict",
        prompt: L("How many triangles does this index buffer draw?", "¿Cuántos triángulos dibuja este índice?", "このインデックスで三角形はいくつ？"),
        code: code("const indices = new Uint16Array([0, 1, 2, 2, 3, 0]);", "console.log(indices.length / 3);"),
        options: ["2", "6", "4"], answer: 0,
        explain: L(
          "With TRIANGLES every 3 indices make a triangle. A quad reuses corners 0 and 2: 4 vertices, 6 indices, 2 triangles.",
          "Con TRIANGLES cada 3 índices forman un triángulo. Un quad reutiliza las esquinas 0 y 2: 4 vértices, 6 índices, 2 triángulos.",
          "TRIANGLES では3つのインデックスで1つの三角形。四角形は角 0 と 2 を再利用：4頂点、6インデックス、2三角形。",
        ),
        check: { compiles: true, stdout: "2" },
      },
      {
        topic: "drawing", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code(GL, "gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT);"),
        options: YN, answer: 1,
        explain: L(
          "TS2554: drawElements needs 4 arguments: mode, count, index type and a byte offset into the index buffer (often 0).",
          "TS2554: drawElements necesita 4 argumentos: modo, cantidad, tipo de índice y un offset en bytes (a menudo 0).",
          "TS2554：drawElements は4引数。モード、個数、インデックスの型、バイトオフセット（たいてい 0）。",
        ),
        check: { compiles: false },
      },
      // textures
      {
        topic: "textures", difficulty: 1, kind: "predict",
        prompt: L("Which sizes are powers of two?", "¿Qué tamaños son potencias de dos?", "2のべき乗のサイズは？"),
        code: code("const isPow2 = (n: number) => (n & (n - 1)) === 0;", "console.log([256, 300, 1].map(isPow2).join(\",\"));"),
        options: ["true,false,true", "true,false,false", "true,true,true"], answer: 0,
        explain: L(
          "A power of two has a single 1 bit, so n & (n − 1) is 0. 1 = 2⁰ counts. WebGL1 limits mipmaps to these sizes.",
          "Una potencia de dos tiene un solo bit en 1, así que n & (n − 1) da 0. 1 = 2⁰ cuenta. WebGL1 limita los mipmaps a esos tamaños.",
          "2のべき乗は 1 のビットが1つだけなので n & (n − 1) は 0。1 = 2⁰ も入る。WebGL1 のミップマップはこのサイズだけ。",
        ),
        check: { compiles: true, stdout: "true,false,true" },
      },
      {
        topic: "textures", difficulty: 2, kind: "predict",
        prompt: L("Texel column for u = 0.5 and u = 1, width 4", "Columna de texel para u = 0.5 y u = 1, ancho 4", "幅4で u = 0.5 と u = 1 のテクセル列"),
        code: code("const texel = (u: number, size: number) => Math.min(Math.floor(u * size), size - 1);", "console.log(texel(0.5, 4), texel(1, 4));"),
        options: ["2 3", "2 4", "1 3"], answer: 0,
        explain: L(
          "UVs run 0..1 across the whole image. u = 0.5 lands on column 2; u = 1 is the right edge, clamped to the last column 3.",
          "Las UV van de 0 a 1 en toda la imagen. u = 0.5 cae en la columna 2; u = 1 es el borde derecho, limitado a la última, 3.",
          "UV は画像全体で 0〜1。u = 0.5 は 2 列目、u = 1 は右端で最後の 3 列目に収まる。",
        ),
        check: { compiles: true, stdout: "2 3" },
      },
    ],
  },

  // ─── MID ──────────────────────────────────────────────────────────────────
  {
    slug: "mid",
    level: "mid",
    title: L("Mid-level WebGL Developer", "WebGL Developer Semi-Senior", "中堅 WebGL 開発者"),
    description: L(
      "Technical interview for a mid-level WebGL role: VAOs, indices, mipmaps, matrices, depth, light, instancing, debugging.",
      "Entrevista técnica para WebGL semi-senior: VAOs, índices, mipmaps, matrices, profundidad, luz, instancing y depuración.",
      "中堅 WebGL 職の技術面接：VAO、インデックス、ミップマップ、行列、深度、光、インスタンス、デバッグ。",
    ),
    count: 14,
    passPct: 70,
    secondsPerQuestion: 40,
    codeCount: 2,
    questions: [
      ...midTraceDebug,
      ...midTasks,
      // shaders_glsl
      {
        topic: "shaders_glsl", difficulty: 2, kind: "order",
        prompt: L("Build and use a shader program", "Arma y usa un programa de shaders", "シェーダープログラムを作って使おう"),
        lines: BUILD_LINES,
        explain: L(
          "Create the shader, give it source, compile it; attach it to the program, link, then useProgram before drawing.",
          "Crea el shader, dale el código y compílalo; únelo al programa, enlaza y luego useProgram antes de dibujar.",
          "シェーダーを作り、ソースを渡してコンパイル。プログラムにつけてリンクし、描く前に useProgram。",
        ),
        check: { compiles: true, program: code(GL, "declare const src: string;", "declare const prog: WebGLProgram;", ...BUILD_LINES) },
      },
      {
        topic: "shaders_glsl", difficulty: 2, kind: "type",
        prompt: L("Did the shader compile?", "¿Compiló el shader?", "シェーダーはコンパイルできた？"),
        code: code(GL, "declare const sh: WebGLShader;", "if (!gl.getShaderParameter(sh, gl.___)) {", "  console.log(gl.getShaderInfoLog(sh));", "}"),
        answer: "COMPILE_STATUS",
        explain: L(
          "compileShader never throws. Ask for COMPILE_STATUS, and on failure read getShaderInfoLog for the GLSL errors.",
          "compileShader nunca lanza errores. Pide COMPILE_STATUS y, si falla, lee getShaderInfoLog para ver los errores GLSL.",
          "compileShader は例外を出さない。COMPILE_STATUS を聞き、失敗なら getShaderInfoLog で GLSL のエラーを読もう。",
        ),
        check: { compiles: true },
      },
      // attributes
      {
        topic: "attributes", difficulty: 1, kind: "predict",
        prompt: L("Stride: xyz floats + rgba UNSIGNED_BYTEs", "Stride: xyz en floats + rgba en UNSIGNED_BYTE", "stride：xyz の float + rgba のバイト"),
        code: "console.log(3 * Float32Array.BYTES_PER_ELEMENT + 4 * Uint8Array.BYTES_PER_ELEMENT);",
        options: ["16", "28", "7"], answer: 0,
        explain: L(
          "12 bytes of position plus 4 bytes of color: 16. Packing colors as normalized bytes saves 12 bytes per vertex.",
          "12 bytes de posición más 4 de color: 16. Guardar colores como bytes normalizados ahorra 12 bytes por vértice.",
          "位置 12 バイト + 色 4 バイトで 16。色を正規化バイトにすると1頂点 12 バイト節約できる。",
        ),
        check: { compiles: true, stdout: "16" },
      },
      {
        topic: "attributes", difficulty: 2, kind: "predict",
        prompt: L("Interleaved xyz uv: uv of vertex 1?", "xyz uv intercalados: ¿uv del vértice 1?", "xyz uv 交互配置：頂点1の uv は？"),
        code: code("const data = new Float32Array([0, 0, 0, 0, 0, 1, 0, 0, 1, 0]);", "const i = 1;", "const F = 5;", "console.log(data[i * F + 3], data[i * F + 4]);"),
        options: ["1 0", "0 0", "0 1"], answer: 0,
        explain: L(
          "Vertex i starts at i × 5 floats; uv sits 3 floats in. Elements 8 and 9 hold 1 and 0.",
          "El vértice i empieza en i × 5 floats; uv está 3 floats adentro. Los elementos 8 y 9 tienen 1 y 0.",
          "頂点 i は i × 5 個目から始まり、uv はその 3 個先。8 番と 9 番は 1 と 0。",
        ),
        check: { compiles: true, stdout: "1 0" },
      },
      {
        topic: "attributes", difficulty: 2, kind: "pick",
        prompt: L("Restore all attribute setup in one call", "Restaura todos los atributos en una llamada", "属性の設定を1回で復元しよう"),
        code: code(GL, "const vao = gl.createVertexArray();", "gl.___(vao);"),
        options: ["bindVertexArray", "bindVAO", "useVertexArray"], answer: 0,
        explain: L(
          "A VAO records enables, pointers and the index buffer. bindVertexArray brings them all back. The other names don't exist.",
          "Un VAO guarda los enables, punteros y el buffer de índices. bindVertexArray los recupera todos. Los otros nombres no existen.",
          "VAO は有効化・ポインタ・インデックスバッファを記録する。bindVertexArray で全部もどる。ほかの名前は存在しない。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      // drawing
      {
        topic: "drawing", difficulty: 2, kind: "predict",
        prompt: L("A mesh has 70000 vertices. Index 69999 becomes", "Una malla tiene 70000 vértices. El índice 69999 queda", "70000頂点のメッシュ。69999 は？"),
        code: "console.log(new Uint16Array([69999])[0]);",
        options: ["4463", "69999", "65535"], answer: 0,
        explain: L(
          "Uint16 wraps silently (69999 − 65536 = 4463) and draws the wrong triangle. Use Uint32Array with gl.UNSIGNED_INT.",
          "Uint16 da la vuelta en silencio (69999 − 65536 = 4463) y dibuja mal. Usa Uint32Array con gl.UNSIGNED_INT.",
          "Uint16 は黙って一周し（69999 − 65536 = 4463）三角形が崩れる。Uint32Array と gl.UNSIGNED_INT を使おう。",
        ),
        check: { compiles: true, stdout: "4463" },
      },
      {
        topic: "drawing", difficulty: 2, kind: "predict",
        prompt: L("Quad bytes: indexed vs not (12 B vertex, 2 B index)", "Bytes de un quad: indexado o no (12 B, 2 B)", "四角形のバイト数：インデックスあり/なし"),
        code: "console.log(4 * 12 + 6 * 2, 6 * 12);",
        options: ["60 72", "72 60", "48 72"], answer: 0,
        explain: L(
          "Indexed: 4 unique vertices + 6 small indices = 60 bytes. Without indices, 6 full vertices = 72. Savings grow with mesh size.",
          "Indexado: 4 vértices únicos + 6 índices pequeños = 60 bytes. Sin índices, 6 vértices completos = 72. El ahorro crece con la malla.",
          "インデックスあり：4頂点 + 小さな6インデックス = 60。なしは6頂点で 72。メッシュが大きいほど得。",
        ),
        check: { compiles: true, stdout: "60 72" },
      },
      // textures
      {
        topic: "textures", difficulty: 1, kind: "predict",
        prompt: L("Mip levels of a 256×256 texture", "Niveles de mip de una textura 256×256", "256×256 のミップレベル数"),
        code: "console.log(Math.floor(Math.log2(256)) + 1);",
        options: ["9", "8", "256"], answer: 0,
        explain: L(
          "256, 128, 64, 32, 16, 8, 4, 2, 1: log2(256) = 8 halvings plus the base level = 9.",
          "256, 128, 64, 32, 16, 8, 4, 2, 1: log2(256) = 8 mitades más el nivel base = 9.",
          "256, 128, 64, 32, 16, 8, 4, 2, 1：log2(256) = 8 回の半分 + 元の 1 段 = 9。",
        ),
        check: { compiles: true, stdout: "9" },
      },
      {
        topic: "textures", difficulty: 2, kind: "predict",
        prompt: L("Texels in a full 4×4 mip chain", "Texels en una cadena de mips 4×4", "4×4 のミップチェーンのテクセル数"),
        code: code("let total = 0;", "for (let s = 4; s >= 1; s /= 2) total += s * s;", "console.log(total);"),
        options: ["21", "16", "32"], answer: 0,
        explain: L(
          "16 + 4 + 1 = 21. A mip chain costs about one third more memory than the base level alone.",
          "16 + 4 + 1 = 21. Una cadena de mips cuesta cerca de un tercio más de memoria que el nivel base solo.",
          "16 + 4 + 1 = 21。ミップチェーンは元の画像より約 1/3 多くメモリを使う。",
        ),
        check: { compiles: true, stdout: "21" },
      },
      {
        topic: "textures", difficulty: 2, kind: "type",
        prompt: L("Trilinear minification filter", "Filtro de minificación trilineal", "トライリニアの縮小フィルタ"),
        code: code(GL, "gl.generateMipmap(gl.TEXTURE_2D);", "gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.___);"),
        answer: "LINEAR_MIPMAP_LINEAR",
        explain: L(
          "LINEAR_MIPMAP_LINEAR blends texels within a level and between two mip levels: smooth with no shimmer in the distance.",
          "LINEAR_MIPMAP_LINEAR mezcla texels dentro de un nivel y entre dos niveles de mip: suave y sin parpadeo a lo lejos.",
          "LINEAR_MIPMAP_LINEAR はレベル内と2つのミップ間を補間。遠くでもチラつかず滑らか。",
        ),
        check: { compiles: true },
      },
      // matrices
      {
        topic: "matrices", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("const T = (p: number) => p + 10;", "const S = (p: number) => p * 2;", "console.log(T(S(1)), S(T(1)));"),
        options: ["12 22", "22 12", "12 12"], answer: 0,
        explain: L(
          "Transforms don't commute: scale-then-move gives 12, move-then-scale gives 22. In T * S * p, S applies first.",
          "Las transformaciones no conmutan: escalar y mover da 12, mover y escalar da 22. En T * S * p, S se aplica primero.",
          "変換は交換できない。拡大→移動で 12、移動→拡大で 22。T * S * p では S が先。",
        ),
        check: { compiles: true, stdout: "12 22" },
      },
      {
        topic: "matrices", difficulty: 2, kind: "pick",
        prompt: L("Read tz from a column-major matrix", "Lee tz de una matriz column-major", "列優先の行列から tz を読もう"),
        code: code("const tz = -4;", "const T = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,tz,1];", "console.log(T[___]);"),
        options: ["14", "11", "2"], answer: 0,
        explain: L(
          "WebGL arrays are column-major: the translation column is at indices 12, 13, 14, so tz is T[14].",
          "Los arrays de WebGL son column-major: la columna de traslación está en 12, 13, 14, así que tz es T[14].",
          "WebGL の配列は列優先。平行移動の列は 12, 13, 14 番なので tz は T[14]。",
        ),
        check: { compiles: true, stdout: "-4" },
      },
      {
        topic: "matrices", difficulty: 2, kind: "predict",
        prompt: L("Translate a point and a direction by 5", "Traslada un punto y una dirección en 5", "点と方向を 5 だけ平行移動"),
        code: code("const tx = 5;", "const apply = (x: number, w: number) => x + tx * w;", "console.log(apply(1, 1), apply(1, 0));"),
        options: ["6 1", "6 6", "1 1"], answer: 0,
        explain: L(
          "Translation is scaled by w: points (w = 1) move, directions like normals (w = 0) only rotate and scale.",
          "La traslación se multiplica por w: los puntos (w = 1) se mueven; las direcciones como normales (w = 0) solo giran y escalan.",
          "平行移動は w 倍。点（w = 1）は動き、法線などの方向（w = 0）は回転と拡大だけ。",
        ),
        check: { compiles: true, stdout: "6 1" },
      },
      // depth_blending
      {
        topic: "depth_blending", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("const blend = (s: number, d: number, a: number) => Math.round(s * a + d * (1 - a));", "console.log(blend(255, 0, 0.5));"),
        options: ["128", "255", "0"], answer: 0,
        explain: L(
          "SRC_ALPHA, ONE_MINUS_SRC_ALPHA computes s × a + d × (1 − a): 127.5, rounded to 128.",
          "SRC_ALPHA, ONE_MINUS_SRC_ALPHA calcula s × a + d × (1 − a): 127.5, redondeado a 128.",
          "SRC_ALPHA, ONE_MINUS_SRC_ALPHA は s × a + d × (1 − a)：127.5 を丸めて 128。",
        ),
        check: { compiles: true, stdout: "128" },
      },
      {
        topic: "depth_blending", difficulty: 2, kind: "predict",
        prompt: L("depthFunc LESS: which color is left?", "depthFunc LESS: ¿qué color queda?", "depthFunc LESS：残る色は？"),
        code: code(
          "let depth = 1;",
          'let color = "sky";',
          "const draw = (name: string, z: number) => {",
          "  if (z < depth) { depth = z; color = name; }",
          "};",
          'draw("wall", 0.4);',
          'draw("tree", 0.8);',
          'draw("bird", 0.2);',
          "console.log(color);",
        ),
        options: ["bird", "tree", "wall"], answer: 0,
        explain: L(
          "The tree fails the test (0.8 > 0.4); the bird passes (0.2 < 0.4). With depth testing, the closest wins, not the last.",
          "El árbol falla el test (0.8 > 0.4); el pájaro pasa (0.2 < 0.4). Con depth test gana el más cercano, no el último.",
          "木は失敗（0.8 > 0.4）、鳥は合格（0.2 < 0.4）。深度テストでは最後ではなく一番近い物が勝つ。",
        ),
        check: { compiles: true, stdout: "bird" },
      },
      {
        topic: "depth_blending", difficulty: 3, kind: "predict",
        prompt: L("Draw order for this frame", "Orden de dibujo de este cuadro", "このフレームの描画順"),
        code: code(
          "const objs = [",
          '  { n: "glass", z: 2, alpha: true },',
          '  { n: "wall", z: 9, alpha: false },',
          '  { n: "smoke", z: 6, alpha: true },',
          '  { n: "rock", z: 4, alpha: false },',
          "];",
          "const opaque = objs.filter((o) => !o.alpha);",
          "const clear = objs.filter((o) => o.alpha).sort((a, b) => b.z - a.z);",
          'console.log([...opaque, ...clear].map((o) => o.n).join(" > "));',
        ),
        options: ["wall > rock > smoke > glass", "glass > smoke > rock > wall", "rock > wall > glass > smoke"], answer: 0,
        explain: L(
          "Opaque first (the depth test sorts them out), then transparent from far to near so each one blends over what's behind.",
          "Primero lo opaco (el depth test lo resuelve), luego lo transparente de lejos a cerca para que cada uno se mezcle con lo de atrás.",
          "不透明が先（深度テストが処理）、透明は遠い順に描いて奥の色と正しく混ぜる。",
        ),
        check: { compiles: true, stdout: "wall > rock > smoke > glass" },
      },
      // lighting
      {
        topic: "lighting", difficulty: 1, kind: "predict", prompt: PRINTS,
        code: code("const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);", "console.log(dot([0, 1, 0], [0, 1, 0]), dot([0, 1, 0], [1, 0, 0]), dot([0, 1, 0], [0, -1, 0]));"),
        options: ["1 0 -1", "1 1 1", "0 1 0"], answer: 0,
        explain: L(
          "For unit vectors dot = cos(angle). Lambert lighting uses max(dot(N, L), 0): facing 1, sideways 0, away clamped to 0.",
          "Con unitarios, dot = cos(ángulo). Lambert usa max(dot(N, L), 0): de frente 1, de lado 0, de espaldas se recorta a 0.",
          "単位ベクトルの dot は cos(角度)。ランバートは max(dot(N, L), 0)：正面 1、真横 0、裏は 0 に切る。",
        ),
        check: { compiles: true, stdout: "1 0 -1" },
      },
      {
        topic: "lighting", difficulty: 2, kind: "predict",
        prompt: L("Why is this face too bright?", "¿Por qué esta cara brilla de más?", "この面が明るすぎる理由は？"),
        code: code("const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);", "const toLight = [0, 3, 0];", "console.log(Math.max(dot([0, 1, 0], toLight), 0));"),
        options: ["3", "1", "0"], answer: 0,
        explain: L(
          "toLight has length 3, so the dot is 3, not 1. Lambert only works with BOTH vectors normalized.",
          "toLight mide 3, así que el dot da 3 y no 1. Lambert solo funciona con AMBOS vectores normalizados.",
          "toLight の長さが 3 なので dot は 1 でなく 3。ランバートは両方を正規化して初めて正しい。",
        ),
        check: { compiles: true, stdout: "3" },
      },
      // performance
      {
        topic: "performance", difficulty: 1, kind: "predict",
        prompt: L("Draw calls with one instanced draw per type", "Draw calls con un draw instanciado por tipo", "種類ごとに1回のインスタンス描画なら？"),
        code: code('const sprites = ["ship", "ship", "star", "ship", "star", "ship"];', "console.log(new Set(sprites).size);"),
        options: ["2", "6", "4"], answer: 0,
        explain: L(
          "Instancing draws every copy of a mesh in one call. Two kinds of sprite means 2 draw calls instead of 6.",
          "El instancing dibuja todas las copias de una malla en una llamada. Dos tipos de sprite son 2 draw calls en vez de 6.",
          "インスタンシングは同じメッシュを1回で全部描く。2種類なら 6 回ではなく 2 回。",
        ),
        check: { compiles: true, stdout: "2" },
      },
      {
        topic: "performance", difficulty: 2, kind: "pick",
        prompt: L("Draw 500 copies of a sprite in one call", "Dibuja 500 copias de un sprite en una llamada", "スプライト500個を1回で描こう"),
        code: code(GL, "gl.___(gl.TRIANGLES, 0, 6, 500);"),
        options: ["drawArraysInstanced", "drawArrays"], answer: 0,
        explain: L(
          "drawArraysInstanced takes an instance count as its 4th argument. drawArrays takes only 3 (TS2554) and would need 500 calls.",
          "drawArraysInstanced recibe la cantidad de instancias como 4.º argumento. drawArrays solo recibe 3 (TS2554) y necesitaría 500 llamadas.",
          "drawArraysInstanced は4つ目にインスタンス数を取る。drawArrays は3引数だけ（TS2554）で 500 回呼ぶことになる。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      // webgl2_differences
      {
        topic: "webgl2_differences", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("declare const gl1: WebGLRenderingContext;", "const vao = gl1.createVertexArray();"),
        options: YN, answer: 1,
        explain: L(
          "TS2339: VAOs are core only in WebGL2. WebGL1 needs the OES_vertex_array_object extension.",
          "TS2339: los VAO solo son nativos en WebGL2. WebGL1 necesita la extensión OES_vertex_array_object.",
          "TS2339：VAO が標準なのは WebGL2 だけ。WebGL1 は OES_vertex_array_object 拡張が必要。",
        ),
        check: { compiles: false },
      },
      {
        topic: "webgl2_differences", difficulty: 2, kind: "predict",
        prompt: L("Is #version 300 es on the first line?", "¿Está #version 300 es en la primera línea?", "#version 300 es は1行目にある？"),
        code: code("const vs = `", "#version 300 es", "in vec4 a_position;", "void main() { gl_Position = a_position; }`;", 'console.log(vs.split("\\n")[0] === "#version 300 es");'),
        options: ["false", "true"], answer: 0,
        explain: L(
          "The template starts with a newline, so line 1 is empty and the shader falls back to GLSL ES 1.00. Start right after the backtick.",
          "La plantilla empieza con un salto de línea: la línea 1 está vacía y el shader cae a GLSL ES 1.00. Empieza justo tras el backtick.",
          "テンプレートが改行で始まるので1行目は空になり GLSL ES 1.00 扱い。バッククォートの直後から書こう。",
        ),
        check: { compiles: true, stdout: "false" },
      },
      // debugging
      {
        topic: "debugging", difficulty: 1, kind: "pick",
        prompt: L("The shader failed. Read why", "El shader falló. Lee por qué", "シェーダーが失敗。理由を読もう"),
        code: code(GL, "declare const sh: WebGLShader;", "console.log(gl.___(sh));"),
        options: ["getShaderInfoLog", "getError", "getShaderLog"], answer: 0,
        explain: L(
          "getShaderInfoLog returns the GLSL compiler messages. getError takes no arguments (TS2554) and getShaderLog doesn't exist.",
          "getShaderInfoLog devuelve los mensajes del compilador GLSL. getError no recibe argumentos (TS2554) y getShaderLog no existe.",
          "getShaderInfoLog は GLSL コンパイラのメッセージを返す。getError は引数なし（TS2554）、getShaderLog は存在しない。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "debugging", difficulty: 2, kind: "type",
        prompt: L("Any GL error since the last check?", "¿Algún error GL desde la última vez?", "前回からGLエラーはある？"),
        code: code(GL, "if (gl.getError() !== gl.___) {", '  console.log("GL error");', "}"),
        answer: "NO_ERROR",
        explain: L(
          "getError returns NO_ERROR (0) when all is well. It syncs with the GPU, so use it while debugging, not every frame.",
          "getError devuelve NO_ERROR (0) si todo va bien. Se sincroniza con la GPU: úsalo al depurar, no en cada cuadro.",
          "問題なければ getError は NO_ERROR（0）。GPU と同期するのでデバッグ中だけ使い、毎フレームは避けよう。",
        ),
        check: { compiles: true },
      },
    ],
  },

  // ─── SENIOR ───────────────────────────────────────────────────────────────
  {
    slug: "senior",
    level: "senior",
    title: L("Senior Graphics Engineer", "Graphics Engineer Senior", "シニアグラフィックスエンジニア"),
    description: L(
      "Senior WebGL deep dive: transforms, depth precision, normal matrix, draw cost, render targets, context loss.",
      "Entrevista senior de WebGL: transformaciones, precisión, normal matrix, costo de draws, render targets.",
      "シニア WebGL 職の深掘り面接：変換、深度精度、法線行列、描画コスト、レンダーターゲット、ロスト。",
    ),
    count: 15,
    passPct: 75,
    secondsPerQuestion: 50,
    codeCount: 2,
    questions: [
      ...seniorTraceDebug,
      ...seniorTasks,
      // matrices
      {
        topic: "matrices", difficulty: 2, kind: "predict",
        prompt: L("Rotate (1, 0) by 90°", "Gira (1, 0) 90°", "(1, 0) を 90° 回転"),
        code: code(
          "const rot = (x: number, y: number, a: number) =>",
          "  [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];",
          "console.log(rot(1, 0, Math.PI / 2).map((n) => n.toFixed(2)).join(\",\"));",
        ),
        options: ["0.00,1.00", "1.00,0.00", "0.00,-1.00"], answer: 0,
        explain: L(
          "A positive angle turns counter-clockwise: +x goes to +y. cos(π/2) is 6e-17, not 0, hence toFixed.",
          "Un ángulo positivo gira en sentido antihorario: +x va a +y. cos(π/2) es 6e-17, no 0; por eso toFixed.",
          "正の角度は反時計回りで +x は +y へ。cos(π/2) は 0 ではなく 6e-17 なので toFixed を使う。",
        ),
        check: { compiles: true, stdout: "0.00,1.00" },
      },
      {
        topic: "matrices", difficulty: 2, kind: "predict",
        prompt: L("Camera at x = 5: view-space x of these points", "Cámara en x = 5: x en view space de estos puntos", "カメラが x = 5：ビュー空間の x は？"),
        code: code("const cameraX = 5;", "const view = (x: number) => x - cameraX;", "console.log(view(5), view(7));"),
        options: ["0 2", "10 12", "5 7"], answer: 0,
        explain: L(
          "The view matrix is the INVERSE of the camera's world matrix: it moves the world by −5, so the camera sits at the origin.",
          "La matriz view es la INVERSA de la matriz de mundo de la cámara: mueve el mundo −5 y la cámara queda en el origen.",
          "ビュー行列はカメラのワールド行列の逆行列。世界を −5 動かし、カメラを原点に置く。",
        ),
        check: { compiles: true, stdout: "0 2" },
      },
      {
        topic: "matrices", difficulty: 3, kind: "predict", prompt: PRINTS,
        code: code(
          "const m = [2,0,0,0, 0,2,0,0, 0,0,2,0, 1,2,3,1];",
          "const apply = (m: number[], [x, y, z]: number[]) =>",
          "  [0, 1, 2].map((r) => m[r] * x + m[4 + r] * y + m[8 + r] * z + m[12 + r]);",
          "console.log(apply(m, [1, 1, 1]).join(\",\"));",
        ),
        options: ["3,4,5", "4,6,8", "2,2,2"], answer: 0,
        explain: L(
          "Column-major: the diagonal scales by 2, then the last column adds (1, 2, 3). Scale first, then translate: 2+1, 2+2, 2+3.",
          "Column-major: la diagonal escala por 2 y la última columna suma (1, 2, 3). Escala primero y luego traslada: 2+1, 2+2, 2+3.",
          "列優先：対角で2倍し、最後の列で (1, 2, 3) を足す。拡大してから移動：2+1, 2+2, 2+3。",
        ),
        check: { compiles: true, stdout: "3,4,5" },
      },
      // depth_blending
      {
        topic: "depth_blending", difficulty: 3, kind: "predict",
        prompt: L("16-bit depth: do the walls share a value?", "Profundidad 16 bits: ¿los muros coinciden?", "16bit 深度：壁は同じ値になる？"),
        code: code(
          "const depth = (z: number, n: number, f: number) => (1 / n - 1 / z) / (1 / n - 1 / f);",
          "const bucket = (z: number, n: number) => Math.round(depth(z, n, 1000) * 65535);",
          "const same = (n: number) => bucket(100, n) === bucket(100.5, n);",
          "console.log(same(0.01), same(1));",
        ),
        options: ["true false", "false true", "false false"], answer: 0,
        explain: L(
          "Perspective depth is non-linear: most precision sits near the near plane. near 0.01 merges the walls (z-fighting); near 1 splits them.",
          "La profundidad en perspectiva no es lineal: casi toda la precisión está cerca del near. near 0.01 junta los muros (z-fighting); near 1 los separa.",
          "透視の深度は非線形で精度は near 付近に集中。near 0.01 だと壁が重なり（Zファイティング）、near 1 なら分かれる。",
        ),
        check: { compiles: true, stdout: "true false" },
      },
      {
        topic: "depth_blending", difficulty: 2, kind: "type",
        prompt: L("Transparent pass: test depth, don't write it", "Pase transparente: prueba depth sin escribirlo", "透明パス：深度は試すが書かない"),
        code: code(GL, "gl.enable(gl.BLEND);", "gl.___(false);", "// draw transparent objects back to front", "gl.depthMask(true);"),
        answer: "depthMask",
        explain: L(
          "depthMask(false) keeps the depth test but stops writes, so overlapping transparent layers don't hide each other.",
          "depthMask(false) mantiene el depth test pero no escribe, así las capas transparentes no se ocultan entre sí.",
          "depthMask(false) で深度テストは残しつつ書き込みを止める。重なった透明面がお互いを隠さない。",
        ),
        check: { compiles: true },
      },
      // lighting
      {
        topic: "lighting", difficulty: 2, kind: "predict",
        prompt: L("Length of an interpolated normal", "Largo de una normal interpolada", "補間された法線の長さ"),
        code: code("const a = [1, 0, 0];", "const b = [0, 1, 0];", "const mid = a.map((v, i) => (v + b[i]) / 2);", "console.log(Math.hypot(...mid).toFixed(3));"),
        options: ["0.707", "1.000", "0.500"], answer: 0,
        explain: L(
          "Varyings are interpolated linearly, so a normal halfway between two unit normals is shorter. Normalize it in the fragment shader.",
          "Los varyings se interpolan linealmente: una normal a mitad de dos unitarias es más corta. Normalízala en el fragment shader.",
          "varying は線形補間されるので、2つの単位法線の中間は短くなる。フラグメントシェーダーで正規化しよう。",
        ),
        check: { compiles: true, stdout: "0.707" },
      },
      {
        topic: "lighting", difficulty: 3, kind: "predict",
        prompt: L("After scale(2, 1, 1): dot with the tangent", "Tras scale(2, 1, 1): dot con la tangente", "scale(2, 1, 1) 後：接線との dot"),
        code: code(
          "const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];",
          "const tangent = [2, -1, 0]; // [1, -1, 0] scaled",
          "const byModel = [2, 1, 0]; // normal [1, 1, 0] × model",
          "const byNormalMatrix = [0.5, 1, 0]; // × inverse-transpose",
          "console.log(dot(tangent, byModel), dot(tangent, byNormalMatrix));",
        ),
        options: ["3 0", "0 3", "0 0"], answer: 0,
        explain: L(
          "Under non-uniform scale the model matrix tilts normals off the surface (dot 3). The normal matrix (inverse-transpose) keeps them perpendicular.",
          "Con escala no uniforme, la matriz model inclina las normales (dot 3). La normal matrix (inversa traspuesta) las mantiene perpendiculares.",
          "非一様スケールでは model 行列で法線が傾く（dot 3）。法線行列（逆転置）なら垂直のまま。",
        ),
        check: { compiles: true, stdout: "3 0" },
      },
      // performance
      {
        topic: "performance", difficulty: 1, kind: "predict",
        prompt: L("Bytes of per-instance mat4 data, 1000 instances", "Bytes de mat4 por instancia, 1000 instancias", "1000個ぶんの mat4 のバイト数"),
        code: "console.log(1000 * 16 * Float32Array.BYTES_PER_ELEMENT);",
        options: ["64000", "16000", "4000"], answer: 0,
        explain: L(
          "16 floats × 4 bytes = 64 bytes per instance. A mat4 attribute uses 4 consecutive locations, one per column.",
          "16 floats × 4 bytes = 64 bytes por instancia. Un atributo mat4 ocupa 4 ubicaciones seguidas, una por columna.",
          "16 個 × 4 バイト = 1個 64 バイト。mat4 属性は列ごとに連続した4つのロケーションを使う。",
        ),
        check: { compiles: true, stdout: "64000" },
      },
      {
        topic: "performance", difficulty: 2, kind: "predict",
        prompt: L("Program switches: as given vs sorted", "Cambios de programa: tal cual vs ordenados", "プログラム切替：そのまま vs ソート"),
        code: code(
          'const draws = ["rock", "tree", "rock", "tree"];',
          "const switches = (list: string[]) => list.filter((p, i) => p !== list[i - 1]).length;",
          "console.log(switches(draws), switches([...draws].sort()));",
        ),
        options: ["4 2", "2 4", "4 4"], answer: 0,
        explain: L(
          "Each useProgram/bindTexture change costs CPU and driver time. Sorting opaque draws by program and material groups them.",
          "Cada cambio de useProgram/bindTexture cuesta tiempo de CPU y driver. Ordenar los draws opacos por programa y material los agrupa.",
          "useProgram や bindTexture の切り替えは CPU とドライバの時間を食う。不透明物をプログラムと素材でソートしてまとめよう。",
        ),
        check: { compiles: true, stdout: "4 2" },
      },
      {
        topic: "performance", difficulty: 2, kind: "predict",
        prompt: L("Instanced draws: one per geometry + material", "Draws instanciados: uno por geometría + material", "ジオメトリ+マテリアルごとに1回なら？"),
        code: code(
          "const objs = [",
          '  { g: "tree", m: "bark" }, { g: "tree", m: "bark" },',
          '  { g: "tree", m: "leaf" }, { g: "rock", m: "stone" },',
          '  { g: "rock", m: "stone" }, { g: "tree", m: "bark" },',
          "];",
          'console.log(new Set(objs.map((o) => o.g + "|" + o.m)).size);',
        ),
        options: ["3", "2", "6"], answer: 0,
        explain: L(
          "Only objects sharing geometry AND material can be instanced together: tree|bark, tree|leaf, rock|stone.",
          "Solo los objetos que comparten geometría Y material se instancian juntos: tree|bark, tree|leaf, rock|stone.",
          "まとめてインスタンス化できるのはジオメトリもマテリアルも同じ物だけ：tree|bark、tree|leaf、rock|stone。",
        ),
        check: { compiles: true, stdout: "3" },
      },
      {
        topic: "performance", difficulty: 3, kind: "predict",
        prompt: L("Vertex 2 of instance 3: divisor 1, then 0", "Vértice 2 de la instancia 3: divisor 1 y 0", "インスタンス3の頂点2：divisor 1 と 0"),
        code: code(
          "const offsets = [5, 6, 7, 8];",
          "const read = (vertex: number, instance: number, divisor: number) =>",
          "  divisor === 0 ? offsets[vertex] : offsets[Math.floor(instance / divisor)];",
          "console.log(read(2, 3, 1), read(2, 3, 0));",
        ),
        options: ["8 7", "7 8", "8 8"], answer: 0,
        explain: L(
          "vertexAttribDivisor(loc, 1) advances once per instance (index 3 → 8); divisor 0 advances per vertex (index 2 → 7).",
          "vertexAttribDivisor(loc, 1) avanza una vez por instancia (índice 3 → 8); divisor 0 avanza por vértice (índice 2 → 7).",
          "vertexAttribDivisor(loc, 1) はインスタンスごと（3 番 → 8）、divisor 0 は頂点ごと（2 番 → 7）。",
        ),
        check: { compiles: true, stdout: "8 7" },
      },
      // framebuffers
      {
        topic: "framebuffers", difficulty: 1, kind: "pick",
        prompt: L("Post-processing done: draw to the canvas", "Post-proceso listo: dibuja en el canvas", "ポスト処理完了：キャンバスへ描こう"),
        code: code(GL, "gl.bindFramebuffer(gl.FRAMEBUFFER, ___);"),
        options: ["null", "undefined"], answer: 0,
        explain: L(
          "null selects the default framebuffer, which is the canvas. undefined is not a WebGLFramebuffer | null (TS2345).",
          "null elige el framebuffer por defecto, que es el canvas. undefined no es WebGLFramebuffer | null (TS2345).",
          "null で標準のフレームバッファ（キャンバス）を選ぶ。undefined は WebGLFramebuffer | null ではない（TS2345）。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "framebuffers", difficulty: 2, kind: "pick",
        prompt: L("Render into the texture's color", "Renderiza en el color de la textura", "テクスチャの色へ描き込もう"),
        code: code(GL, "declare const tex: WebGLTexture;", "gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.___, gl.TEXTURE_2D, tex, 0);"),
        options: ["COLOR_ATTACHMENT0", "COLOR_OUTPUT", "COLOR_TARGET"], answer: 0,
        explain: L(
          "COLOR_ATTACHMENT0 is the first color slot (WebGL2 MRT adds 1, 2...). Depth goes in DEPTH_ATTACHMENT. The others don't exist.",
          "COLOR_ATTACHMENT0 es la primera ranura de color (MRT en WebGL2 añade 1, 2...). La profundidad va en DEPTH_ATTACHMENT. Los otros no existen.",
          "COLOR_ATTACHMENT0 は最初の色スロット（WebGL2 の MRT で 1, 2…）。深度は DEPTH_ATTACHMENT。ほかは存在しない。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      {
        topic: "framebuffers", difficulty: 2, kind: "type",
        prompt: L("Validate the framebuffer after setup", "Valida el framebuffer tras configurarlo", "設定後にフレームバッファを検証"),
        code: code(GL, "const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);", "if (status !== gl.___) {", '  throw new Error("incomplete framebuffer");', "}"),
        answer: "FRAMEBUFFER_COMPLETE",
        explain: L(
          "Attachments with mismatched sizes or unrenderable formats are incomplete. Check once after setup, not every frame.",
          "Adjuntos de distinto tamaño o formatos no renderizables lo dejan incompleto. Revísalo una vez al configurar, no en cada cuadro.",
          "サイズ違いや描けない形式の接続は不完全になる。毎フレームではなく設定後に一度だけ確認しよう。",
        ),
        check: { compiles: true },
      },
      // context_loss
      {
        topic: "context_loss", difficulty: 1, kind: "predict", prompt: COMPILES,
        code: code("declare const canvas: HTMLCanvasElement;", 'canvas.addEventListener("webglcontextlost", (e) => {', "  e.preventDefault();", "});"),
        options: YN, answer: 0,
        explain: L(
          "It compiles: every Event has preventDefault. Calling it in webglcontextlost tells the browser you can restore.",
          "Compila: todo Event tiene preventDefault. Llamarlo en webglcontextlost le dice al navegador que puedes restaurar.",
          "通る。どの Event にも preventDefault がある。webglcontextlost で呼ぶと復元できると伝えられる。",
        ),
        check: { compiles: true },
      },
      {
        topic: "context_loss", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("declare const canvas: HTMLCanvasElement;", 'canvas.addEventListener("webglcontextlost", (e) => {', "  console.log(e.statusMessage);", "});"),
        options: YN, answer: 1,
        explain: L(
          "TS2339: the canvas event map types this listener's event as a plain Event. Cast it to WebGLContextEvent first.",
          "TS2339: el mapa de eventos del canvas tipa este evento como un Event común. Conviértelo antes a WebGLContextEvent.",
          "TS2339：キャンバスのイベントマップではこれはただの Event。先に WebGLContextEvent にキャストしよう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "context_loss", difficulty: 2, kind: "pick",
        prompt: L("After webglcontextrestored, the textures are", "Tras webglcontextrestored, las texturas están", "webglcontextrestored 後のテクスチャは？"),
        code: code(
          "const gpu = new Map<string, string>();",
          'const init = () => { gpu.set("tex", "ok"); gpu.set("prog", "ok"); };',
          "init();",
          "gpu.clear(); // webglcontextlost",
          "console.log(gpu.has(\"tex\") ? \"still there\" : \"___\");",
        ),
        options: ["gone: run init() again", "still there"], answer: 0,
        check: { compiles: true, stdout: "gone: run init() again" },
        explain: L(
          "Loss invalidates every buffer, texture, shader and program. On restore, rerun your full init; keep CPU-side copies to rebuild.",
          "La pérdida invalida cada buffer, textura, shader y programa. Al restaurar, vuelve a correr el init completo; guarda copias en CPU.",
          "ロストですべてのバッファ・テクスチャ・シェーダー・プログラムが無効に。復元時は初期化をやり直す。CPU 側に元データを残そう。",
        ),
      },
      // textures
      {
        topic: "textures", difficulty: 2, kind: "predict",
        prompt: L("MB of a 2048×2048 RGBA8 texture (no mips)", "MB de una textura RGBA8 2048×2048 (sin mips)", "2048×2048 RGBA8 の MB（ミップなし）"),
        code: "console.log((2048 * 2048 * 4) / (1024 * 1024));",
        options: ["16", "4", "8"], answer: 0,
        explain: L(
          "4 bytes per texel × 4M texels = 16 MB of VRAM, about 21 MB with mips. Compressed formats (KTX2/Basis) cut it 4–8×.",
          "4 bytes por texel × 4M texels = 16 MB de VRAM, unos 21 MB con mips. Los formatos comprimidos (KTX2/Basis) lo reducen 4–8×.",
          "1テクセル 4 バイト × 4M で VRAM 16 MB、ミップ込みで約 21 MB。圧縮形式（KTX2/Basis）なら 4〜8 分の1。",
        ),
        check: { compiles: true, stdout: "16" },
      },
      {
        topic: "textures", difficulty: 2, kind: "predict",
        prompt: L("Mip chain memory vs the base level", "Memoria de mips frente al nivel base", "ミップチェーンは元の何倍？"),
        code: code("let total = 0;", "for (let s = 1024; s >= 1; s /= 2) total += s * s;", "console.log((total / (1024 * 1024)).toFixed(2));"),
        options: ["1.33", "2.00", "1.00"], answer: 0,
        explain: L(
          "Each level is a quarter of the previous: 1 + 1/4 + 1/16 + … ≈ 4/3. Mipmaps cost about 33% extra VRAM.",
          "Cada nivel es un cuarto del anterior: 1 + 1/4 + 1/16 + … ≈ 4/3. Los mipmaps cuestan cerca de 33% más de VRAM.",
          "各レベルは前の 1/4：1 + 1/4 + 1/16 + … ≈ 4/3。ミップマップで VRAM は約 33% 増える。",
        ),
        check: { compiles: true, stdout: "1.33" },
      },
      // shaders_glsl
      {
        topic: "shaders_glsl", difficulty: 2, kind: "type",
        prompt: L("Did the program link?", "¿Se enlazó el programa?", "プログラムはリンクできた？"),
        code: code(GL, "declare const prog: WebGLProgram;", "if (!gl.getProgramParameter(prog, gl.___)) {", '  throw new Error(gl.getProgramInfoLog(prog) ?? "");', "}"),
        answer: "LINK_STATUS",
        explain: L(
          "LINK_STATUS catches mismatched varyings and missing main. Check it once; read shader logs only when linking fails.",
          "LINK_STATUS detecta varyings que no coinciden y main faltante. Revísalo una vez; lee los logs de shaders solo si falla.",
          "LINK_STATUS は varying の不一致や main の欠落を捕まえる。一度だけ確認し、失敗時だけシェーダーのログを読もう。",
        ),
        check: { compiles: true },
      },
      {
        topic: "shaders_glsl", difficulty: 3, kind: "pick",
        prompt: L("Bind the uniform block Lights to point 0", "Enlaza el bloque uniform Lights al punto 0", "uniform ブロック Lights を 0 番へ"),
        code: code(GL, "declare const prog: WebGLProgram;", 'const index = gl.___(prog, "Lights");', "gl.uniformBlockBinding(prog, index, 0);"),
        options: ["getUniformBlockIndex", "getUniformLocation"], answer: 0,
        explain: L(
          "WebGL2 uniform buffer objects use a block index (a number). getUniformLocation returns WebGLUniformLocation | null: TS2345.",
          "Los uniform buffer objects de WebGL2 usan un índice de bloque (number). getUniformLocation devuelve WebGLUniformLocation | null: TS2345.",
          "WebGL2 のユニフォームバッファはブロック番号（number）を使う。getUniformLocation は WebGLUniformLocation | null なので TS2345。",
        ),
        check: { compiles: true, wrongFail: true },
      },
      // webgl2_differences
      {
        topic: "webgl2_differences", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code("declare const gl1: WebGLRenderingContext;", "gl1.drawArraysInstanced(gl1.TRIANGLES, 0, 3, 100);"),
        options: YN, answer: 1,
        explain: L(
          "TS2339: instancing is core in WebGL2 only. On WebGL1 use the ANGLE_instanced_arrays extension's ...ANGLE methods.",
          "TS2339: el instancing solo es nativo en WebGL2. En WebGL1 usa los métodos ...ANGLE de la extensión ANGLE_instanced_arrays.",
          "TS2339：インスタンシングが標準なのは WebGL2 だけ。WebGL1 では ANGLE_instanced_arrays 拡張の ...ANGLE メソッドを使う。",
        ),
        check: { compiles: false },
      },
      {
        topic: "webgl2_differences", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code(
          "declare const gl1: WebGLRenderingContext;",
          'const ext = gl1.getExtension("ANGLE_instanced_arrays");',
          "ext?.drawArraysInstancedANGLE(gl1.TRIANGLES, 0, 3, 100);",
        ),
        options: YN, answer: 0,
        explain: L(
          "It compiles: getExtension with a known name returns a typed extension or null, hence ?. — the WebGL1 path to instancing.",
          "Compila: getExtension con un nombre conocido devuelve la extensión tipada o null, de ahí el ?. — el camino de WebGL1 al instancing.",
          "通る。既知の名前なら getExtension は型付きの拡張か null を返すので ?. を使う。WebGL1 でのインスタンシング手段。",
        ),
        check: { compiles: true },
      },
      // debugging
      {
        topic: "debugging", difficulty: 2, kind: "predict", prompt: COMPILES,
        code: code(GL, "declare const sh: WebGLShader;", "const log: string = gl.getShaderInfoLog(sh);"),
        options: YN, answer: 1,
        explain: L(
          "TS2322: getShaderInfoLog returns string | null. Handle null, e.g. gl.getShaderInfoLog(sh) ?? \"\".",
          "TS2322: getShaderInfoLog devuelve string | null. Maneja el null, por ejemplo gl.getShaderInfoLog(sh) ?? \"\".",
          "TS2322：getShaderInfoLog は string | null を返す。gl.getShaderInfoLog(sh) ?? \"\" などで null を処理しよう。",
        ),
        check: { compiles: false },
      },
      {
        topic: "debugging", difficulty: 3, kind: "predict", prompt: COMPILES,
        code: code(GL, "declare const sh: WebGLShader;", "const ok: string = gl.getShaderParameter(sh, gl.COMPILE_STATUS);"),
        options: YN, answer: 0,
        explain: L(
          "It compiles, wrongly: getShaderParameter returns any, so tsc can't help. COMPILE_STATUS is really a boolean; type it yourself.",
          "Compila, por error: getShaderParameter devuelve any y tsc no ayuda. COMPILE_STATUS en realidad es boolean; tipéalo tú.",
          "通ってしまう。getShaderParameter は any を返すので tsc は助けない。COMPILE_STATUS は本当は boolean、自分で型をつけよう。",
        ),
        check: { compiles: true },
      },
      {
        topic: "debugging", difficulty: 2, kind: "predict",
        prompt: L("GPU syncs if you check every status eagerly", "Sincronizaciones si revisas todo enseguida", "全部すぐ確認すると同期は何回？"),
        code: code(
          'const shaders = ["sky", "hero", "rock"];',
          "let syncs = 0;",
          "const getParam = () => { syncs++; return true; };",
          "shaders.forEach(() => getParam()); // COMPILE_STATUS each",
          "getParam(); // LINK_STATUS",
          "console.log(syncs);",
        ),
        options: ["4", "1", "0"], answer: 0,
        explain: L(
          "Each status query can stall the pipeline. Check only LINK_STATUS (1 sync) and read compile logs when it fails.",
          "Cada consulta de estado puede frenar el pipeline. Revisa solo LINK_STATUS (1 sincronización) y lee los logs si falla.",
          "状態の問い合わせはパイプラインを止めうる。LINK_STATUS だけ確認（同期1回）し、失敗時にログを読もう。",
        ),
        check: { compiles: true, stdout: "4" },
      },
    ],
  },
];
