import type { CodeTaskBeat, ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Coding tasks for moon Shadera (WebGL). The runner has no GPU, so every task is the pure logic a
// graphics engineer writes around WebGL: clip-space math, typed-array buffers, index buffers,
// column-major matrices, depth and color packing. Tests run in the player's browser (js-browser);
// the validator proves the solution passes, the starter fails and each near miss fails.

// ─── Region boss mini projects ────────────────────────────────────────────────

/** Pipeline Village boss: map canvas pixels to clip space. */
export const pixelsToClipTask: CodeTaskBeat = {
  slug: "pixels-to-clip",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: pixels to clip space", "Mini proyecto: de píxeles a clip space", "ミニ課題：ピクセルをクリップ空間へ"),
  brief: L(
    "Write pixelsToClip(points, width, height). points is a flat list [x0, y0, x1, y1, ...] of canvas pixels (origin top-left, y grows down). Return a NEW Float32Array of the same length with each point in clip space: x and y from -1 to 1, y pointing up. (0, 0) is the top-left corner (-1, 1).",
    "Escribe pixelsToClip(points, width, height). points es una lista plana [x0, y0, x1, y1, ...] de píxeles del canvas (origen arriba a la izquierda, y crece hacia abajo). Devuelve un Float32Array NUEVO del mismo largo con cada punto en clip space: x e y de -1 a 1, y hacia arriba. (0, 0) es la esquina superior izquierda (-1, 1).",
    "pixelsToClip(points, width, height) を書こう。points は canvas のピクセルの平らなリスト [x0, y0, x1, y1, ...]（原点は左上、y は下向き）。同じ長さの「新しい」Float32Array で、各点をクリップ空間（x も y も -1〜1、y は上向き）にして返す。(0, 0) は左上の (-1, 1)。",
  ),
  starter: "function pixelsToClip(points: number[], width: number, height: number): Float32Array {\n  // your code here\n  return new Float32Array(points.length);\n}\n",
  solution: "function pixelsToClip(points: number[], width: number, height: number): Float32Array {\n  const out = new Float32Array(points.length);\n  for (let i = 0; i < points.length; i += 2) {\n    out[i] = (points[i] / width) * 2 - 1;\n    out[i + 1] = 1 - (points[i + 1] / height) * 2;\n  }\n  return out;\n}\n",
  nearMiss: [
    // Forgets that clip-space y points up.
    "function pixelsToClip(points: number[], width: number, height: number): Float32Array {\n  const out = new Float32Array(points.length);\n  for (let i = 0; i < points.length; i += 2) {\n    out[i] = (points[i] / width) * 2 - 1;\n    out[i + 1] = (points[i + 1] / height) * 2 - 1;\n  }\n  return out;\n}\n",
    // Scales to 0..2 but never shifts by -1.
    "function pixelsToClip(points: number[], width: number, height: number): Float32Array {\n  const out = new Float32Array(points.length);\n  for (let i = 0; i < points.length; i += 2) {\n    out[i] = (points[i] / width) * 2;\n    out[i + 1] = 1 - (points[i + 1] / height) * 2;\n  }\n  return out;\n}\n",
  ],
  tests: [
    { run: 'console.log(Array.from(pixelsToClip([0, 0, 800, 600], 800, 600), (v) => v.toFixed(2)).join(" "));', expect: "-1.00 1.00 1.00 -1.00" },
    { run: 'console.log(Array.from(pixelsToClip([400, 300], 800, 600), (v) => v.toFixed(2)).join(" "));', expect: "0.00 0.00" },
    { run: 'console.log(Array.from(pixelsToClip([200, 150, 600, 450], 800, 600), (v) => v.toFixed(2)).join(" "));', expect: "-0.50 0.50 0.50 -0.50", hidden: true },
    { run: 'console.log(Array.from(pixelsToClip([100, 0], 400, 200), (v) => v.toFixed(2)).join(" "));', expect: "-0.50 1.00", hidden: true },
    { run: "console.log(pixelsToClip([], 10, 10).length);", expect: "0", hidden: true },
  ],
  hint: L(
    "Divide by the size to get 0..1, stretch to 0..2, then shift. Which axis has to flip?",
    "Divide por el tamaño para tener 0..1, estira a 0..2 y desplaza. ¿Qué eje hay que invertir?",
    "大きさで割って 0..1、2 倍して 0..2、そしてずらす。反転が必要な軸はどれ？",
  ),
  note: "recap-clip",
  explain: L(
    "x / width × 2 − 1 maps 0..width to -1..1. Canvas y grows down but clip y grows up, so y is 1 − y / height × 2.",
    "x / width × 2 − 1 lleva 0..width a -1..1. La y del canvas crece hacia abajo y la de clip hacia arriba: y es 1 − y / height × 2.",
    "x / width × 2 − 1 で 0..width が -1..1 に。canvas の y は下向き、クリップの y は上向きなので y は 1 − y / height × 2。",
  ),
};

/** Buffer Forest boss: interleave positions and UVs into one vertex buffer. */
export const interleaveTask: CodeTaskBeat = {
  slug: "interleave",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: interleave a vertex buffer", "Mini proyecto: intercala un vertex buffer", "ミニ課題：頂点バッファを交互に詰める"),
  brief: L(
    "Write interleave(positions, uvs). positions has 3 floats per vertex (x y z), uvs has 2 (u v). Return one Float32Array laid out x y z u v per vertex (a 20-byte stride). If the two lists describe a different number of vertices, throw an Error with the message \"vertex count mismatch\".",
    "Escribe interleave(positions, uvs). positions tiene 3 floats por vértice (x y z) y uvs tiene 2 (u v). Devuelve un solo Float32Array con x y z u v por vértice (stride de 20 bytes). Si las dos listas describen distinta cantidad de vértices, lanza un Error con el mensaje \"vertex count mismatch\".",
    "interleave(positions, uvs) を書こう。positions は頂点ごとに float 3 個（x y z）、uvs は 2 個（u v）。頂点ごとに x y z u v と並ぶ1つの Float32Array を返す（ストライド 20 バイト）。2 つのリストの頂点数がちがえば、メッセージ \"vertex count mismatch\" の Error を投げる。",
  ),
  starter: "function interleave(positions: number[], uvs: number[]): Float32Array {\n  // your code here\n  return new Float32Array(0);\n}\n",
  solution: "function interleave(positions: number[], uvs: number[]): Float32Array {\n  const count = positions.length / 3;\n  if (uvs.length / 2 !== count) throw new Error(\"vertex count mismatch\");\n  const out = new Float32Array(count * 5);\n  for (let i = 0; i < count; i++) {\n    out.set(positions.slice(i * 3, i * 3 + 3), i * 5);\n    out.set(uvs.slice(i * 2, i * 2 + 2), i * 5 + 3);\n  }\n  return out;\n}\n",
  nearMiss: [
    // Appends all UVs after all positions: two blocks, not interleaved.
    "function interleave(positions: number[], uvs: number[]): Float32Array {\n  if (uvs.length / 2 !== positions.length / 3) throw new Error(\"vertex count mismatch\");\n  return new Float32Array([...positions, ...uvs]);\n}\n",
    // Copy-pasted the position stride into the UV read.
    "function interleave(positions: number[], uvs: number[]): Float32Array {\n  const count = positions.length / 3;\n  if (uvs.length / 2 !== count) throw new Error(\"vertex count mismatch\");\n  const out = new Float32Array(count * 5);\n  for (let i = 0; i < count; i++) {\n    out.set(positions.slice(i * 3, i * 3 + 3), i * 5);\n    out.set(uvs.slice(i * 3, i * 3 + 2), i * 5 + 3);\n  }\n  return out;\n}\n",
  ],
  tests: [
    { run: 'console.log(interleave([1, 2, 3, 4, 5, 6], [0, 0, 1, 1]).join(","));', expect: "1,2,3,0,0,4,5,6,1,1" },
    { run: "console.log(interleave([0, 0, 0, 1, 0, 0, 0, 1, 0], [0, 0, 1, 0, 0, 1]).length);", expect: "15" },
    { run: 'console.log(interleave([0, 0, 0], [0.5, 0.25]).join(","));', expect: "0,0,0,0.5,0.25", hidden: true },
    { run: 'try {\n  interleave([0, 0, 0], []);\n  console.log("no error");\n} catch (e) {\n  console.log((e as Error).message);\n}', expect: "vertex count mismatch", hidden: true },
    { run: 'console.log(interleave([1, 1, 1, 2, 2, 2, 3, 3, 3], [7, 8, 9, 10, 11, 12]).slice(10).join(","));', expect: "3,3,3,11,12", hidden: true },
  ],
  hint: L(
    "Loop over vertices, not floats. Vertex i starts at float i × 5 in the output.",
    "Recorre vértices, no floats. El vértice i empieza en el float i × 5 de la salida.",
    "float ではなく頂点でループしよう。頂点 i は出力の i × 5 番目から始まる。",
  ),
  note: "recap-bytes",
  explain: L(
    "Each vertex takes 5 floats: copy its 3 position floats to i × 5 and its 2 UV floats to i × 5 + 3. Check the counts first.",
    "Cada vértice ocupa 5 floats: copia sus 3 de posición a i × 5 y sus 2 de UV a i × 5 + 3. Revisa antes las cantidades.",
    "1 頂点は float 5 個。位置の 3 個を i × 5 に、UV の 2 個を i × 5 + 3 にコピー。先に頂点数を確かめる。",
  ),
};

/** Matrix Mountain boss: multiply two column-major 4×4 matrices. */
export const multiplyMat4Task: CodeTaskBeat = {
  slug: "multiply-mat4",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: multiply two mat4", "Mini proyecto: multiplica dos mat4", "ミニ課題：mat4 のかけ算"),
  brief: L(
    "Write multiply(a, b) for 4×4 matrices stored column-major like WebGL: element (row r, column c) is at index c × 4 + r, so the translation sits in indices 12, 13, 14. Return a NEW 16-number array with the product a × b (b is applied first). Don't modify a or b.",
    "Escribe multiply(a, b) para matrices 4×4 guardadas por columnas como en WebGL: el elemento (fila r, columna c) está en el índice c × 4 + r, así que la traslación queda en 12, 13 y 14. Devuelve un array NUEVO de 16 números con el producto a × b (b se aplica primero). No modifiques a ni b.",
    "WebGL と同じ列優先の 4×4 行列で multiply(a, b) を書こう。要素（行 r, 列 c）は添字 c × 4 + r にあり、平行移動は 12, 13, 14 に入る。積 a × b（先に b がかかる）を「新しい」16 個の配列で返す。a も b も変えないこと。",
  ),
  starter: "function multiply(a: number[], b: number[]): number[] {\n  // your code here\n  return new Array<number>(16).fill(0);\n}\n",
  solution: "function multiply(a: number[], b: number[]): number[] {\n  const out = new Array<number>(16).fill(0);\n  for (let c = 0; c < 4; c++) {\n    for (let r = 0; r < 4; r++) {\n      let sum = 0;\n      for (let k = 0; k < 4; k++) sum += a[k * 4 + r] * b[c * 4 + k];\n      out[c * 4 + r] = sum;\n    }\n  }\n  return out;\n}\n",
  nearMiss: [
    // Row-major indexing: on column-major data this computes b × a.
    "function multiply(a: number[], b: number[]): number[] {\n  const out = new Array<number>(16).fill(0);\n  for (let r = 0; r < 4; r++) {\n    for (let c = 0; c < 4; c++) {\n      let sum = 0;\n      for (let k = 0; k < 4; k++) sum += a[r * 4 + k] * b[k * 4 + c];\n      out[r * 4 + c] = sum;\n    }\n  }\n  return out;\n}\n",
    // Treats it as a 3×3 product: the w row and column (and so translation) are lost.
    "function multiply(a: number[], b: number[]): number[] {\n  const out = new Array<number>(16).fill(0);\n  for (let c = 0; c < 4; c++) {\n    for (let r = 0; r < 4; r++) {\n      let sum = 0;\n      for (let k = 0; k < 3; k++) sum += a[k * 4 + r] * b[c * 4 + k];\n      out[c * 4 + r] = sum;\n    }\n  }\n  return out;\n}\n",
  ],
  tests: [
    { run: 'console.log(multiply([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 0, 0, 1], [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1]).join(","));', expect: "2,0,0,0,0,2,0,0,0,0,2,0,5,0,0,1" },
    { run: 'console.log(multiply([2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 0, 0, 1]).slice(12).join(","));', expect: "10,0,0,1" },
    { run: 'console.log(multiply([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 2, 3, 1], [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 5, 6, 1]).slice(12).join(","));', expect: "5,7,9,1", hidden: true },
    { run: 'console.log(multiply([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]).join(","));', expect: "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16", hidden: true },
    { run: 'console.log(multiply([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], [1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]).slice(0, 4).join(","));', expect: "14,16,18,20", hidden: true },
  ],
  hint: L(
    "Result (r, c) is row r of a times column c of b. Write the index of each element with c × 4 + r.",
    "El resultado (r, c) es la fila r de a por la columna c de b. Escribe el índice de cada elemento con c × 4 + r.",
    "結果の (r, c) は a の行 r と b の列 c の積の和。各要素の添字は c × 4 + r で書こう。",
  ),
  note: "recap-transforms",
  explain: L(
    "out[c×4+r] = Σk a[k×4+r] × b[c×4+k], with k up to 4. Row-major indexing silently computes b × a, so the translation lands wrong.",
    "out[c×4+r] = Σk a[k×4+r] × b[c×4+k], con k hasta 4. Indexar por filas calcula b × a sin avisar y la traslación queda mal.",
    "out[c×4+r] = Σk a[k×4+r] × b[c×4+k]（k は 4 まで）。行優先で添字を書くと黙って b × a になり、平行移動がずれる。",
  ),
};

// ─── Junior screening (ide) ───────────────────────────────────────────────────

export const toRgba8Task: ExamQuestion = {
  slug: "to-rgba8",
  kind: "code",
  mode: "ide",
  topic: "textures",
  difficulty: 1,
  prompt: L("Coding: float color to RGBA8", "Código: color float a RGBA8", "コーディング：float の色を RGBA8 に"),
  brief: L(
    "Write toRGBA8(r, g, b, a): each channel is a float that should be 0..1. Return the four bytes 0..255 for a RGBA8 texture: clamp each value to 0..1, multiply by 255 and round to the nearest integer.",
    "Escribe toRGBA8(r, g, b, a): cada canal es un float que debería estar en 0..1. Devuelve los cuatro bytes 0..255 de una textura RGBA8: limita cada valor a 0..1, multiplícalo por 255 y redondea al entero más cercano.",
    "toRGBA8(r, g, b, a) を書こう。各チャンネルは 0..1 のはずの float。RGBA8 テクスチャ用の 0..255 の 4 バイトを返す。各値を 0..1 におさめ、255 をかけて最も近い整数に丸める。",
  ),
  starter: "function toRGBA8(r: number, g: number, b: number, a: number): number[] {\n  // your code here\n  return [];\n}\n",
  solution: "function toRGBA8(r: number, g: number, b: number, a: number): number[] {\n  return [r, g, b, a].map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255));\n}\n",
  nearMiss: [
    // Truncates instead of rounding: 0.5 becomes 127.
    "function toRGBA8(r: number, g: number, b: number, a: number): number[] {\n  return [r, g, b, a].map((v) => Math.floor(Math.min(1, Math.max(0, v)) * 255));\n}\n",
    // No clamp: out-of-range values escape 0..255.
    "function toRGBA8(r: number, g: number, b: number, a: number): number[] {\n  return [r, g, b, a].map((v) => Math.round(v * 255));\n}\n",
  ],
  tests: [
    { run: 'console.log(toRGBA8(1, 0.5, 0, 1).join(","));', expect: "255,128,0,255" },
    { run: 'console.log(toRGBA8(0.2, 0.4, 0.6, 0.8).join(","));', expect: "51,102,153,204" },
    { run: 'console.log(toRGBA8(1.5, -0.2, 0.25, 1).join(","));', expect: "255,0,64,255", hidden: true },
    { run: 'console.log(toRGBA8(0, 0, 0, 0).join(","));', expect: "0,0,0,0", hidden: true },
  ],
  explain: L(
    "Clamp first so stray values stay in range, then Math.round(v × 255): Math.floor would turn 0.5 into 127.",
    "Limita primero para que los valores raros queden en rango y luego Math.round(v × 255): Math.floor haría de 0.5 un 127.",
    "先に範囲内におさめ、Math.round(v × 255) で丸める。Math.floor だと 0.5 が 127 になる。",
  ),
};

export const quadIndicesTask: ExamQuestion = {
  slug: "quad-indices",
  kind: "code",
  mode: "ide",
  topic: "drawing",
  difficulty: 1,
  prompt: L("Coding: index buffer for quads", "Código: index buffer para quads", "コーディング：四角形のインデックスバッファ"),
  brief: L(
    "Write quadIndices(quads): every quad uses 4 vertices in a row (quad q uses vertices 4q..4q+3, in order around the corner). Return a Uint16Array with two triangles per quad: (v0, v1, v2) and (v0, v2, v3), where v0 = 4q. Zero quads gives an empty array.",
    "Escribe quadIndices(quads): cada quad usa 4 vértices seguidos (el quad q usa los vértices 4q..4q+3, en orden alrededor). Devuelve un Uint16Array con dos triángulos por quad: (v0, v1, v2) y (v0, v2, v3), con v0 = 4q. Cero quads da un array vacío.",
    "quadIndices(quads) を書こう。四角形は連続した 4 頂点を使う（四角形 q は頂点 4q..4q+3 を周回順に）。四角形ごとに三角形 2 つ (v0, v1, v2) と (v0, v2, v3)（v0 = 4q）を入れた Uint16Array を返す。0 個なら空の配列。",
  ),
  starter: "function quadIndices(quads: number): Uint16Array {\n  // your code here\n  return new Uint16Array(0);\n}\n",
  solution: "function quadIndices(quads: number): Uint16Array {\n  const out = new Uint16Array(quads * 6);\n  for (let q = 0; q < quads; q++) {\n    const v = q * 4;\n    out.set([v, v + 1, v + 2, v, v + 2, v + 3], q * 6);\n  }\n  return out;\n}\n",
  nearMiss: [
    // Uses the index count (6) as the vertex step.
    "function quadIndices(quads: number): Uint16Array {\n  const out = new Uint16Array(quads * 6);\n  for (let q = 0; q < quads; q++) {\n    const v = q * 6;\n    out.set([v, v + 1, v + 2, v, v + 2, v + 3], q * 6);\n  }\n  return out;\n}\n",
    // Strip-style second triangle: (v1, v2, v3) instead of (v0, v2, v3).
    "function quadIndices(quads: number): Uint16Array {\n  const out = new Uint16Array(quads * 6);\n  for (let q = 0; q < quads; q++) {\n    const v = q * 4;\n    out.set([v, v + 1, v + 2, v + 1, v + 2, v + 3], q * 6);\n  }\n  return out;\n}\n",
  ],
  tests: [
    { run: 'console.log(quadIndices(1).join(","));', expect: "0,1,2,0,2,3" },
    { run: 'console.log(quadIndices(2).join(","));', expect: "0,1,2,0,2,3,4,5,6,4,6,7" },
    { run: "console.log(quadIndices(0).length);", expect: "0", hidden: true },
    { run: 'console.log(quadIndices(3).slice(12).join(","));', expect: "8,9,10,8,10,11", hidden: true },
    { run: "console.log(quadIndices(2) instanceof Uint16Array);", expect: "true", hidden: true },
  ],
  explain: L(
    "Quad q starts at vertex 4q (4 vertices per quad) and writes its 6 indices at 6q: v, v+1, v+2, then v, v+2, v+3.",
    "El quad q empieza en el vértice 4q (4 vértices por quad) y escribe sus 6 índices en 6q: v, v+1, v+2 y luego v, v+2, v+3.",
    "四角形 q は頂点 4q から（1 つにつき頂点 4）、6 個の番号を 6q に書く：v, v+1, v+2、次に v, v+2, v+3。",
  ),
};

export const triangleCountTask: ExamQuestion = {
  slug: "triangle-count",
  kind: "code",
  mode: "ide",
  topic: "pipeline",
  difficulty: 1,
  prompt: L("Coding: how many triangles?", "Código: ¿cuántos triángulos?", "コーディング：三角形はいくつ？"),
  brief: L(
    "Write triangleCount(mode, vertices): how many triangles a draw call assembles. mode is \"TRIANGLES\" (every 3 vertices make one; leftovers are dropped), \"TRIANGLE_STRIP\" or \"TRIANGLE_FAN\" (each vertex after the first two adds one). Any other mode (\"POINTS\", \"LINES\"...) makes 0. Never return a negative number.",
    "Escribe triangleCount(mode, vertices): cuántos triángulos arma un draw call. mode es \"TRIANGLES\" (cada 3 vértices forman uno; los que sobran se descartan), \"TRIANGLE_STRIP\" o \"TRIANGLE_FAN\" (cada vértice después de los dos primeros agrega uno). Cualquier otro modo (\"POINTS\", \"LINES\"...) da 0. Nunca devuelvas un número negativo.",
    "triangleCount(mode, vertices) を書こう。描画呼び出しが組み立てる三角形の数。mode は \"TRIANGLES\"（3 頂点ごとに 1 つ。余りは捨てる）、\"TRIANGLE_STRIP\" か \"TRIANGLE_FAN\"（最初の 2 つより後の頂点ごとに 1 つ）。それ以外（\"POINTS\", \"LINES\" など）は 0。負の数は返さない。",
  ),
  starter: "function triangleCount(mode: string, vertices: number): number {\n  // your code here\n  return 0;\n}\n",
  solution: "function triangleCount(mode: string, vertices: number): number {\n  if (mode === \"TRIANGLES\") return Math.floor(vertices / 3);\n  if (mode === \"TRIANGLE_STRIP\" || mode === \"TRIANGLE_FAN\") return Math.max(0, vertices - 2);\n  return 0;\n}\n",
  nearMiss: [
    // Forgets to drop leftover vertices.
    "function triangleCount(mode: string, vertices: number): number {\n  if (mode === \"TRIANGLES\") return vertices / 3;\n  if (mode === \"TRIANGLE_STRIP\" || mode === \"TRIANGLE_FAN\") return Math.max(0, vertices - 2);\n  return 0;\n}\n",
    // Goes negative with fewer than 2 vertices.
    "function triangleCount(mode: string, vertices: number): number {\n  if (mode === \"TRIANGLES\") return Math.floor(vertices / 3);\n  if (mode === \"TRIANGLE_STRIP\" || mode === \"TRIANGLE_FAN\") return vertices - 2;\n  return 0;\n}\n",
  ],
  tests: [
    { run: 'console.log(triangleCount("TRIANGLES", 6));', expect: "2" },
    { run: 'console.log(triangleCount("TRIANGLE_STRIP", 6));', expect: "4" },
    { run: 'console.log(triangleCount("TRIANGLES", 7));', expect: "2", hidden: true },
    { run: 'console.log(triangleCount("TRIANGLE_FAN", 1));', expect: "0", hidden: true },
    { run: 'console.log(triangleCount("LINES", 6));', expect: "0", hidden: true },
    { run: 'console.log(triangleCount("TRIANGLE_FAN", 5));', expect: "3", hidden: true },
  ],
  explain: L(
    "TRIANGLES: Math.floor(n / 3). Strips and fans share edges, so n − 2, but never below 0. Other modes draw no triangles.",
    "TRIANGLES: Math.floor(n / 3). Strips y fans comparten aristas, así que n − 2, pero nunca menos de 0. Los otros modos no dibujan triángulos.",
    "TRIANGLES は Math.floor(n / 3)。ストリップとファンは辺を共有するので n − 2、ただし 0 未満にしない。他のモードは三角形を描かない。",
  ),
};

export const clipToPixelTask: ExamQuestion = {
  slug: "clip-to-pixel",
  kind: "code",
  mode: "ide",
  topic: "clip_space",
  difficulty: 1,
  prompt: L("Coding: NDC to canvas pixels", "Código: de NDC a píxeles del canvas", "コーディング：NDC を canvas のピクセルへ"),
  brief: L(
    "Write clipToPixel(x, y, width, height). x and y are normalized device coordinates (-1..1, y up). Return [px, py] in canvas pixels, origin top-left with y growing down: (-1, 1) is [0, 0] and (1, -1) is [width, height]. Don't round.",
    "Escribe clipToPixel(x, y, width, height). x e y son coordenadas normalizadas (-1..1, y hacia arriba). Devuelve [px, py] en píxeles del canvas, con origen arriba a la izquierda e y creciendo hacia abajo: (-1, 1) es [0, 0] y (1, -1) es [width, height]. No redondees.",
    "clipToPixel(x, y, width, height) を書こう。x と y は正規化デバイス座標（-1..1、y は上向き）。canvas のピクセル [px, py]（原点は左上、y は下向き）を返す。(-1, 1) は [0, 0]、(1, -1) は [width, height]。丸めないこと。",
  ),
  starter: "function clipToPixel(x: number, y: number, width: number, height: number): number[] {\n  // your code here\n  return [0, 0];\n}\n",
  solution: "function clipToPixel(x: number, y: number, width: number, height: number): number[] {\n  return [((x + 1) / 2) * width, ((1 - y) / 2) * height];\n}\n",
  nearMiss: [
    // Keeps y pointing up (the GL window convention, not the canvas one).
    "function clipToPixel(x: number, y: number, width: number, height: number): number[] {\n  return [((x + 1) / 2) * width, ((y + 1) / 2) * height];\n}\n",
    // Forgets to shift -1..1 into 0..2 first.
    "function clipToPixel(x: number, y: number, width: number, height: number): number[] {\n  return [(x / 2) * width, ((1 - y) / 2) * height];\n}\n",
  ],
  tests: [
    { run: 'console.log(clipToPixel(0, 0, 800, 600).join(","));', expect: "400,300" },
    { run: 'console.log(clipToPixel(-1, 1, 800, 600).join(","));', expect: "0,0" },
    { run: 'console.log(clipToPixel(1, -1, 800, 600).join(","));', expect: "800,600", hidden: true },
    { run: 'console.log(clipToPixel(0.5, 0.5, 200, 100).join(","));', expect: "150,25", hidden: true },
    { run: 'console.log(clipToPixel(-0.5, -0.5, 640, 480).join(","));', expect: "160,360", hidden: true },
  ],
  explain: L(
    "(x + 1) / 2 turns -1..1 into 0..1; multiply by the width. For y use (1 − y) / 2, because canvas y grows down.",
    "(x + 1) / 2 convierte -1..1 en 0..1; multiplica por el ancho. Para y usa (1 − y) / 2, porque la y del canvas crece hacia abajo.",
    "(x + 1) / 2 で -1..1 が 0..1 に。幅をかける。canvas の y は下向きなので y は (1 − y) / 2。",
  ),
};

// ─── Mid screening (2 ide, 2 paper) ───────────────────────────────────────────

export const attribLayoutTask: ExamQuestion = {
  slug: "attrib-layout",
  kind: "code",
  mode: "ide",
  topic: "attributes",
  difficulty: 2,
  prompt: L("Coding: stride and offsets", "Código: stride y offsets", "コーディング：ストライドとオフセット"),
  brief: L(
    "Write attribLayout(sizes): the attributes of one interleaved vertex, each a number of FLOAT components (e.g. [3, 3, 2] for position, normal, uv). Return { stride, offsets } in BYTES, ready for vertexAttribPointer: offsets[i] is where attribute i starts, stride is the size of a whole vertex. No attributes: stride 0, no offsets.",
    "Escribe attribLayout(sizes): los atributos de un vértice intercalado, cada uno con una cantidad de componentes FLOAT (p. ej. [3, 3, 2] para posición, normal y uv). Devuelve { stride, offsets } en BYTES, listos para vertexAttribPointer: offsets[i] es donde empieza el atributo i y stride es el tamaño de un vértice entero. Sin atributos: stride 0 y sin offsets.",
    "attribLayout(sizes) を書こう。交互に並んだ 1 頂点の属性で、各要素は FLOAT の成分数（例：位置・法線・UV なら [3, 3, 2]）。vertexAttribPointer 用に「バイト」で { stride, offsets } を返す。offsets[i] は属性 i の開始位置、stride は頂点全体の大きさ。属性なしなら stride 0、offsets は空。",
  ),
  starter: "function attribLayout(sizes: number[]): { stride: number; offsets: number[] } {\n  // your code here\n  return { stride: 0, offsets: [] };\n}\n",
  solution: "function attribLayout(sizes: number[]): { stride: number; offsets: number[] } {\n  const offsets: number[] = [];\n  let bytes = 0;\n  for (const size of sizes) {\n    offsets.push(bytes);\n    bytes += size * 4;\n  }\n  return { stride: bytes, offsets };\n}\n",
  nearMiss: [
    // Offsets counted in floats, only the stride converted to bytes.
    "function attribLayout(sizes: number[]): { stride: number; offsets: number[] } {\n  const offsets: number[] = [];\n  let floats = 0;\n  for (const size of sizes) {\n    offsets.push(floats);\n    floats += size;\n  }\n  return { stride: floats * 4, offsets };\n}\n",
    // Records the offset after adding the attribute instead of before.
    "function attribLayout(sizes: number[]): { stride: number; offsets: number[] } {\n  const offsets: number[] = [];\n  let bytes = 0;\n  for (const size of sizes) {\n    bytes += size * 4;\n    offsets.push(bytes);\n  }\n  return { stride: bytes, offsets };\n}\n",
  ],
  tests: [
    { run: "console.log(JSON.stringify(attribLayout([3, 3, 2])));", expect: '{"stride":32,"offsets":[0,12,24]}' },
    { run: "console.log(JSON.stringify(attribLayout([3])));", expect: '{"stride":12,"offsets":[0]}' },
    { run: "console.log(JSON.stringify(attribLayout([])));", expect: '{"stride":0,"offsets":[]}', hidden: true },
    { run: "console.log(JSON.stringify(attribLayout([2, 4])));", expect: '{"stride":24,"offsets":[0,8]}', hidden: true },
    { run: "console.log(JSON.stringify(attribLayout([4, 4, 4, 4])));", expect: '{"stride":64,"offsets":[0,16,32,48]}', hidden: true },
  ],
  explain: L(
    "Keep a running byte total: push it as the attribute's offset, then add size × 4 (a FLOAT is 4 bytes). The final total is the stride.",
    "Lleva un total de bytes: guárdalo como offset del atributo y luego suma size × 4 (un FLOAT son 4 bytes). El total final es el stride.",
    "バイトの累計を持ち、それを属性の offset として入れてから size × 4 を足す（FLOAT は 4 バイト）。最後の累計が stride。",
  ),
};

export const gridIndicesTask: ExamQuestion = {
  slug: "grid-indices",
  kind: "code",
  mode: "ide",
  topic: "drawing",
  difficulty: 2,
  prompt: L("Coding: index buffer for a grid", "Código: index buffer de una grilla", "コーディング：グリッドのインデックス"),
  brief: L(
    "Write gridIndices(cols, rows) for a grid of cols × rows cells, whose (cols + 1) × (rows + 1) vertices are numbered row by row. For each cell, row by row, with a = its top-left vertex and w = cols + 1, emit (a, a+1, a+w) and (a+1, a+w+1, a+w). Return a Uint16Array if every index fits in 16 bits, otherwise a Uint32Array.",
    "Escribe gridIndices(cols, rows) para una grilla de cols × rows celdas, cuyos (cols + 1) × (rows + 1) vértices se numeran fila por fila. Para cada celda, fila por fila, con a = su vértice superior izquierdo y w = cols + 1, emite (a, a+1, a+w) y (a+1, a+w+1, a+w). Devuelve un Uint16Array si todos los índices caben en 16 bits; si no, un Uint32Array.",
    "gridIndices(cols, rows) を書こう。cols × rows マスのグリッドで、(cols + 1) × (rows + 1) 個の頂点は行ごとに番号がつく。各マスを行ごとに、a = 左上の頂点、w = cols + 1 として (a, a+1, a+w) と (a+1, a+w+1, a+w) を出す。番号がすべて 16 ビットに入るなら Uint16Array、入らなければ Uint32Array を返す。",
  ),
  starter: "function gridIndices(cols: number, rows: number): Uint16Array | Uint32Array {\n  // your code here\n  return new Uint16Array(0);\n}\n",
  solution: "function gridIndices(cols: number, rows: number): Uint16Array | Uint32Array {\n  const w = cols + 1;\n  const size = cols * rows * 6;\n  const out = w * (rows + 1) > 65536 ? new Uint32Array(size) : new Uint16Array(size);\n  let i = 0;\n  for (let y = 0; y < rows; y++) {\n    for (let x = 0; x < cols; x++) {\n      const a = y * w + x;\n      out.set([a, a + 1, a + w, a + 1, a + w + 1, a + w], i);\n      i += 6;\n    }\n  }\n  return out;\n}\n",
  nearMiss: [
    // Row width in cells, not in vertices.
    "function gridIndices(cols: number, rows: number): Uint16Array | Uint32Array {\n  const w = cols;\n  const size = cols * rows * 6;\n  const out = (cols + 1) * (rows + 1) > 65536 ? new Uint32Array(size) : new Uint16Array(size);\n  let i = 0;\n  for (let y = 0; y < rows; y++) {\n    for (let x = 0; x < cols; x++) {\n      const a = y * w + x;\n      out.set([a, a + 1, a + w, a + 1, a + w + 1, a + w], i);\n      i += 6;\n    }\n  }\n  return out;\n}\n",
    // Always 16-bit: big grids wrap their indices.
    "function gridIndices(cols: number, rows: number): Uint16Array | Uint32Array {\n  const w = cols + 1;\n  const out = new Uint16Array(cols * rows * 6);\n  let i = 0;\n  for (let y = 0; y < rows; y++) {\n    for (let x = 0; x < cols; x++) {\n      const a = y * w + x;\n      out.set([a, a + 1, a + w, a + 1, a + w + 1, a + w], i);\n      i += 6;\n    }\n  }\n  return out;\n}\n",
  ],
  tests: [
    { run: 'console.log(gridIndices(1, 1).join(","));', expect: "0,1,2,1,3,2" },
    { run: 'console.log(gridIndices(2, 1).join(","));', expect: "0,1,3,1,4,3,1,2,4,2,5,4" },
    { run: 'console.log(gridIndices(1, 2).slice(6).join(","));', expect: "2,3,4,3,5,4", hidden: true },
    { run: "console.log(gridIndices(300, 300) instanceof Uint32Array);", expect: "true", hidden: true },
    { run: "console.log(gridIndices(255, 255) instanceof Uint16Array);", expect: "true", hidden: true },
    { run: "console.log(gridIndices(0, 5).length);", expect: "0", hidden: true },
  ],
  explain: L(
    "A row has cols + 1 vertices, so a = y × (cols + 1) + x. 16-bit indices reach 65535: more than 65536 vertices needs a Uint32Array.",
    "Una fila tiene cols + 1 vértices, así que a = y × (cols + 1) + x. Los índices de 16 bits llegan a 65535: más de 65536 vértices necesita Uint32Array.",
    "1 行の頂点は cols + 1 個なので a = y × (cols + 1) + x。16 ビットの番号は 65535 まで。頂点が 65536 個を超えたら Uint32Array。",
  ),
};

export const transformPointTask: ExamQuestion = {
  slug: "transform-point",
  kind: "code",
  mode: "paper",
  topic: "matrices",
  difficulty: 2,
  prompt: L("Written test: transform a point by a mat4", "Prueba escrita: transforma un punto con mat4", "筆記：mat4 で点を変換"),
  brief: L(
    "Write transformPoint(m, p). m is a 4×4 matrix stored column-major like WebGL (element row r, column c at index c × 4 + r) and p is [x, y, z]. Treat p as (x, y, z, 1), multiply m × p, then divide x, y and z by the resulting w. Return [x, y, z].",
    "Escribe transformPoint(m, p). m es una matriz 4×4 guardada por columnas como en WebGL (fila r, columna c en el índice c × 4 + r) y p es [x, y, z]. Trata p como (x, y, z, 1), multiplica m × p y divide x, y y z por la w resultante. Devuelve [x, y, z].",
    "transformPoint(m, p) を書こう。m は WebGL と同じ列優先の 4×4 行列（行 r・列 c は添字 c × 4 + r）、p は [x, y, z]。p を (x, y, z, 1) として m × p を計算し、x, y, z を結果の w で割る。[x, y, z] を返す。",
  ),
  starter: "function transformPoint(m: number[], p: number[]): number[] {\n  // your code here\n  return p;\n}\n",
  solution: "function transformPoint(m: number[], p: number[]): number[] {\n  const [x, y, z] = p;\n  const w = m[3] * x + m[7] * y + m[11] * z + m[15];\n  return [0, 1, 2].map((r) => (m[r] * x + m[4 + r] * y + m[8 + r] * z + m[12 + r]) / w);\n}\n",
  nearMiss: [
    // Reads the matrix row-major.
    "function transformPoint(m: number[], p: number[]): number[] {\n  const [x, y, z] = p;\n  const w = m[12] * x + m[13] * y + m[14] * z + m[15];\n  return [0, 1, 2].map((r) => (m[r * 4] * x + m[r * 4 + 1] * y + m[r * 4 + 2] * z + m[r * 4 + 3]) / w);\n}\n",
    // Skips the divide by w.
    "function transformPoint(m: number[], p: number[]): number[] {\n  const [x, y, z] = p;\n  return [0, 1, 2].map((r) => m[r] * x + m[4 + r] * y + m[8 + r] * z + m[12 + r]);\n}\n",
  ],
  tests: [
    { run: 'console.log(transformPoint([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 6, 7, 1], [1, 1, 1]).join(","));', expect: "6,7,8" },
    { run: 'console.log(transformPoint([2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1], [1, 2, 3]).join(","));', expect: "2,4,6" },
    { run: 'console.log(transformPoint([0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], [1, 0, 0]).join(","));', expect: "0,1,0", hidden: true },
    { run: 'console.log(transformPoint([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2], [4, 6, 8]).join(","));', expect: "2,3,4", hidden: true },
    { run: 'console.log(transformPoint([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 0], [2, 4, -2]).join(","));', expect: "1,2,-1", hidden: true },
  ],
  explain: L(
    "Row r of the result is m[r]·x + m[4+r]·y + m[8+r]·z + m[12+r]; w uses indices 3, 7, 11, 15. Divide by w: perspective matrices make w ≠ 1.",
    "La fila r es m[r]·x + m[4+r]·y + m[8+r]·z + m[12+r]; w usa los índices 3, 7, 11 y 15. Divide por w: las perspectivas dan w ≠ 1.",
    "結果の行 r は m[r]·x + m[4+r]·y + m[8+r]·z + m[12+r]。w は添字 3, 7, 11, 15。透視行列では w ≠ 1 なので w で割る。",
  ),
};

export const mipChainTask: ExamQuestion = {
  slug: "mip-chain",
  kind: "code",
  mode: "paper",
  topic: "textures",
  difficulty: 2,
  prompt: L("Written test: the mipmap chain", "Prueba escrita: la cadena de mipmaps", "筆記：ミップマップの連なり"),
  brief: L(
    "Write mipChain(width, height): the size of every mip level as \"WxH\" strings, from the full texture down to 1x1. Each level halves both sides rounding down, but a side never goes below 1. A 4×2 texture gives [\"4x2\", \"2x1\", \"1x1\"].",
    "Escribe mipChain(width, height): el tamaño de cada nivel mip como strings \"WxH\", desde la textura completa hasta 1x1. Cada nivel divide ambos lados a la mitad redondeando hacia abajo, pero un lado nunca baja de 1. Una textura de 4×2 da [\"4x2\", \"2x1\", \"1x1\"].",
    "mipChain(width, height) を書こう。元のテクスチャから 1x1 まで、各ミップ段の大きさを \"WxH\" の文字列で返す。段ごとに両辺を半分にして切り捨てるが、辺は 1 未満にならない。4×2 なら [\"4x2\", \"2x1\", \"1x1\"]。",
  ),
  starter: "function mipChain(width: number, height: number): string[] {\n  // your code here\n  return [];\n}\n",
  solution: "function mipChain(width: number, height: number): string[] {\n  const out: string[] = [];\n  let w = width;\n  let h = height;\n  while (true) {\n    out.push(`${w}x${h}`);\n    if (w === 1 && h === 1) return out;\n    w = Math.max(1, Math.floor(w / 2));\n    h = Math.max(1, Math.floor(h / 2));\n  }\n}\n",
  nearMiss: [
    // Stops as soon as one side reaches 1.
    "function mipChain(width: number, height: number): string[] {\n  const out: string[] = [];\n  let w = width;\n  let h = height;\n  while (w > 1 && h > 1) {\n    out.push(`${w}x${h}`);\n    w = Math.floor(w / 2);\n    h = Math.floor(h / 2);\n  }\n  out.push(`${w}x${h}`);\n  return out;\n}\n",
    // Rounds up instead of down.
    "function mipChain(width: number, height: number): string[] {\n  const out: string[] = [];\n  let w = width;\n  let h = height;\n  while (true) {\n    out.push(`${w}x${h}`);\n    if (w === 1 && h === 1) return out;\n    w = Math.max(1, Math.ceil(w / 2));\n    h = Math.max(1, Math.ceil(h / 2));\n  }\n}\n",
  ],
  tests: [
    { run: 'console.log(mipChain(4, 4).join(" "));', expect: "4x4 2x2 1x1" },
    { run: 'console.log(mipChain(4, 2).join(" "));', expect: "4x2 2x1 1x1" },
    { run: 'console.log(mipChain(1, 1).join(" "));', expect: "1x1", hidden: true },
    { run: 'console.log(mipChain(5, 3).join(" "));', expect: "5x3 2x1 1x1", hidden: true },
    { run: 'console.log(mipChain(8, 1).join(" "));', expect: "8x1 4x1 2x1 1x1", hidden: true },
  ],
  explain: L(
    "Push the current size, stop at 1x1, else halve each side with Math.max(1, Math.floor(side / 2)). The longer side decides how many levels.",
    "Agrega el tamaño actual, para en 1x1 y si no, divide cada lado con Math.max(1, Math.floor(lado / 2)). El lado más largo decide cuántos niveles hay.",
    "今の大きさを入れ、1x1 なら終わり。そうでなければ各辺を Math.max(1, Math.floor(辺 / 2)) に。段数は長い辺で決まる。",
  ),
};

// ─── Senior screening (1 ide, 3 paper) ────────────────────────────────────────

export const linearizeDepthTask: ExamQuestion = {
  slug: "linearize-depth",
  kind: "code",
  mode: "ide",
  topic: "depth_blending",
  difficulty: 3,
  prompt: L("Coding: linearize a depth value", "Código: linealiza un valor de profundidad", "コーディング：深度値を線形に戻す"),
  brief: L(
    "Write linearizeDepth(d, near, far). d is a value read from the depth buffer (0..1, WebGL's default depth range) written by a standard perspective projection. Return the distance from the camera in eye space: d = 0 is near, d = 1 is far. Remember the buffer stores NDC z (-1..1) remapped to 0..1, and it isn't linear.",
    "Escribe linearizeDepth(d, near, far). d es un valor leído del depth buffer (0..1, el rango por defecto de WebGL) escrito por una proyección en perspectiva estándar. Devuelve la distancia a la cámara en espacio de vista: d = 0 es near y d = 1 es far. Recuerda que el buffer guarda la z de NDC (-1..1) llevada a 0..1, y no es lineal.",
    "linearizeDepth(d, near, far) を書こう。d は標準の透視投影で書かれた深度バッファの値（0..1、WebGL の既定の範囲）。カメラからの視点空間での距離を返す。d = 0 は near、d = 1 は far。バッファには NDC の z（-1..1）を 0..1 に移した値が入り、線形ではない。",
  ),
  starter: "function linearizeDepth(d: number, near: number, far: number): number {\n  // your code here\n  return 0;\n}\n",
  solution: "function linearizeDepth(d: number, near: number, far: number): number {\n  const z = d * 2 - 1;\n  return (2 * near * far) / (far + near - z * (far - near));\n}\n",
  nearMiss: [
    // Uses the 0..1 value as if it were NDC z.
    "function linearizeDepth(d: number, near: number, far: number): number {\n  return (2 * near * far) / (far + near - d * (far - near));\n}\n",
    // Assumes depth is linear between near and far.
    "function linearizeDepth(d: number, near: number, far: number): number {\n  return near + d * (far - near);\n}\n",
  ],
  tests: [
    { run: "console.log(linearizeDepth(0, 1, 100).toFixed(3));", expect: "1.000" },
    { run: "console.log(linearizeDepth(1, 1, 100).toFixed(3));", expect: "100.000" },
    { run: "console.log(linearizeDepth(0.5, 1, 100).toFixed(3));", expect: "1.980", hidden: true },
    { run: "console.log(linearizeDepth(0.99, 1, 1000).toFixed(3));", expect: "90.992", hidden: true },
    { run: "console.log(linearizeDepth(0.9, 0.1, 50).toFixed(3));", expect: "0.982", hidden: true },
  ],
  explain: L(
    "First z = 2d − 1 to get back to NDC, then invert the projection: 2nf / (f + n − z(f − n)). Most precision sits near the camera.",
    "Primero z = 2d − 1 para volver a NDC y luego invierte la proyección: 2nf / (f + n − z(f − n)). Casi toda la precisión queda cerca de la cámara.",
    "まず z = 2d − 1 で NDC に戻し、投影を逆にする：2nf / (f + n − z(f − n))。精度の大半はカメラの近くにある。",
  ),
};

export const renderOrderTask: ExamQuestion = {
  slug: "render-order",
  kind: "code",
  mode: "paper",
  topic: "depth_blending",
  difficulty: 3,
  prompt: L("Written test: the render queue", "Prueba escrita: la cola de render", "筆記：描画の順番"),
  brief: L(
    "Write renderOrder(objects): each object is { id, depth, transparent }, depth being its distance to the camera. Return the ids in draw order: first every opaque object front to back (smaller depth first), then every transparent one back to front. Equal depths keep their input order. Don't reorder the input array.",
    "Escribe renderOrder(objects): cada objeto es { id, depth, transparent } y depth es su distancia a la cámara. Devuelve los ids en orden de dibujo: primero todos los opacos de adelante hacia atrás (menor depth primero) y luego los transparentes de atrás hacia adelante. Las profundidades iguales mantienen el orden de entrada. No reordenes el array recibido.",
    "renderOrder(objects) を書こう。各オブジェクトは { id, depth, transparent } で、depth はカメラからの距離。描画順に id を返す。まず不透明なものを手前から奥へ（depth の小さい順）、次に透明なものを奥から手前へ。depth が同じなら入力順のまま。受けとった配列は並べかえないこと。",
  ),
  starter: "interface Drawable {\n  id: string;\n  depth: number;\n  transparent: boolean;\n}\n\nfunction renderOrder(objects: Drawable[]): string[] {\n  // your code here\n  return [];\n}\n",
  solution: "interface Drawable {\n  id: string;\n  depth: number;\n  transparent: boolean;\n}\n\nfunction renderOrder(objects: Drawable[]): string[] {\n  const opaque = objects.filter((o) => !o.transparent).sort((a, b) => a.depth - b.depth);\n  const clear = objects.filter((o) => o.transparent).sort((a, b) => b.depth - a.depth);\n  return [...opaque, ...clear].map((o) => o.id);\n}\n",
  nearMiss: [
    // Sorts transparent objects front to back as well.
    "interface Drawable {\n  id: string;\n  depth: number;\n  transparent: boolean;\n}\n\nfunction renderOrder(objects: Drawable[]): string[] {\n  const opaque = objects.filter((o) => !o.transparent).sort((a, b) => a.depth - b.depth);\n  const clear = objects.filter((o) => o.transparent).sort((a, b) => a.depth - b.depth);\n  return [...opaque, ...clear].map((o) => o.id);\n}\n",
    // Right order, but sorts the caller's array in place.
    "interface Drawable {\n  id: string;\n  depth: number;\n  transparent: boolean;\n}\n\nfunction renderOrder(objects: Drawable[]): string[] {\n  objects.sort((a, b) => Number(a.transparent) - Number(b.transparent) || (a.transparent ? b.depth - a.depth : a.depth - b.depth));\n  return objects.map((o) => o.id);\n}\n",
  ],
  tests: [
    { run: 'console.log(renderOrder([\n  { id: "wall", depth: 10, transparent: false },\n  { id: "glass", depth: 3, transparent: true },\n  { id: "floor", depth: 2, transparent: false },\n  { id: "smoke", depth: 8, transparent: true },\n]).join(","));', expect: "floor,wall,smoke,glass" },
    { run: "console.log(renderOrder([]).length);", expect: "0" },
    { run: 'console.log(renderOrder([\n  { id: "a", depth: 1, transparent: true },\n  { id: "b", depth: 9, transparent: true },\n  { id: "c", depth: 4, transparent: true },\n]).join(","));', expect: "b,c,a", hidden: true },
    { run: 'console.log(renderOrder([\n  { id: "x", depth: 2, transparent: false },\n  { id: "y", depth: 2, transparent: false },\n]).join(","));', expect: "x,y", hidden: true },
    { run: '{\n  const queue = [\n    { id: "far", depth: 5, transparent: false },\n    { id: "near", depth: 1, transparent: false },\n  ];\n  renderOrder(queue);\n  console.log(queue.map((o) => o.id).join(","));\n}', expect: "far,near", hidden: true },
  ],
  explain: L(
    "Opaque front to back lets the depth test skip hidden pixels; transparent back to front blends correctly. filter makes copies, so the input is untouched.",
    "Opacos de adelante hacia atrás: el depth test descarta píxeles. Transparentes de atrás hacia adelante: mezclan bien. filter copia, la entrada no cambia.",
    "不透明は手前から描けば深度テストで隠れた画素を省ける。透明は奥から描けば正しく混ざる。filter はコピーなので入力は変わらない。",
  ),
};

export const stateChangesTask: ExamQuestion = {
  slug: "state-changes",
  kind: "code",
  mode: "paper",
  topic: "performance",
  difficulty: 3,
  prompt: L("Written test: count GL state changes", "Prueba escrita: cuenta cambios de estado", "筆記：状態変更を数える"),
  brief: L(
    "A renderer caches GL state: it calls useProgram only when the program differs from the one in use, and bindTexture only when the texture differs from the one bound. Program and texture are independent bindings. Write stateChanges(draws): draws is a list of { program, texture } names in draw order (nothing is bound at the start). Return how many useProgram + bindTexture calls it makes.",
    "Un renderer guarda el estado de GL: llama a useProgram solo si el programa es distinto del que está en uso, y a bindTexture solo si la textura es distinta de la enlazada. Programa y textura son enlaces independientes. Escribe stateChanges(draws): draws es una lista de nombres { program, texture } en orden de dibujo (al inicio no hay nada enlazado). Devuelve cuántas llamadas a useProgram + bindTexture hace.",
    "レンダラーは GL の状態を覚えていて、使用中とちがうプログラムのときだけ useProgram を、バインド中とちがうテクスチャのときだけ bindTexture を呼ぶ。プログラムとテクスチャは別々のバインド。stateChanges(draws) を書こう。draws は描画順の { program, texture } 名のリスト（最初は何もバインドされていない）。useProgram と bindTexture の呼び出し回数の合計を返す。",
  ),
  starter: "interface Draw {\n  program: string;\n  texture: string;\n}\n\nfunction stateChanges(draws: Draw[]): number {\n  // your code here\n  return 0;\n}\n",
  solution: "interface Draw {\n  program: string;\n  texture: string;\n}\n\nfunction stateChanges(draws: Draw[]): number {\n  let program: string | null = null;\n  let texture: string | null = null;\n  let calls = 0;\n  for (const d of draws) {\n    if (d.program !== program) {\n      program = d.program;\n      calls++;\n    }\n    if (d.texture !== texture) {\n      texture = d.texture;\n      calls++;\n    }\n  }\n  return calls;\n}\n",
  nearMiss: [
    // Thinks switching program unbinds the texture.
    "interface Draw {\n  program: string;\n  texture: string;\n}\n\nfunction stateChanges(draws: Draw[]): number {\n  let program: string | null = null;\n  let texture: string | null = null;\n  let calls = 0;\n  for (const d of draws) {\n    if (d.program !== program) {\n      program = d.program;\n      texture = null;\n      calls++;\n    }\n    if (d.texture !== texture) {\n      texture = d.texture;\n      calls++;\n    }\n  }\n  return calls;\n}\n",
    // Counts distinct names instead of consecutive changes.
    "interface Draw {\n  program: string;\n  texture: string;\n}\n\nfunction stateChanges(draws: Draw[]): number {\n  return new Set(draws.map((d) => d.program)).size + new Set(draws.map((d) => d.texture)).size;\n}\n",
  ],
  tests: [
    { run: 'console.log(stateChanges([\n  { program: "a", texture: "x" },\n  { program: "a", texture: "x" },\n  { program: "a", texture: "y" },\n]));', expect: "3" },
    { run: "console.log(stateChanges([]));", expect: "0" },
    { run: 'console.log(stateChanges([\n  { program: "a", texture: "x" },\n  { program: "b", texture: "x" },\n  { program: "a", texture: "x" },\n]));', expect: "4", hidden: true },
    { run: 'console.log(stateChanges([\n  { program: "a", texture: "x" },\n  { program: "a", texture: "y" },\n  { program: "a", texture: "x" },\n]));', expect: "4", hidden: true },
    { run: 'console.log(stateChanges([\n  { program: "a", texture: "x" },\n  { program: "a", texture: "x" },\n  { program: "b", texture: "y" },\n  { program: "b", texture: "y" },\n]));', expect: "4", hidden: true },
  ],
  explain: L(
    "Track the current program and texture separately and count only real changes. That's why renderers sort draws by program, then texture.",
    "Sigue el programa y la textura actuales por separado y cuenta solo los cambios reales. Por eso los renderers ordenan por programa y luego por textura.",
    "今のプログラムとテクスチャを別々に追い、本当の変更だけ数える。だからレンダラーは描画をプログラム順、次にテクスチャ順に並べる。",
  ),
};

export const pickingIdTask: ExamQuestion = {
  slug: "picking-id",
  kind: "code",
  mode: "paper",
  topic: "framebuffers",
  difficulty: 3,
  prompt: L("Written test: color-ID picking", "Prueba escrita: picking por color", "筆記：色 ID によるピッキング"),
  brief: L(
    "For GPU picking, each object is drawn into a framebuffer with a unique color and readPixels gives it back. Write encodeId(id) → [r, g, b] (bytes, r holds the highest 8 bits, b the lowest) for ids 0..16777215, and decodeId(r, g, b) that returns the id. decodeId(...encodeId(n)) must be n.",
    "Para picking en GPU, cada objeto se dibuja en un framebuffer con un color único y readPixels lo devuelve. Escribe encodeId(id) → [r, g, b] (bytes; r guarda los 8 bits más altos y b los más bajos) para ids 0..16777215, y decodeId(r, g, b), que devuelve el id. decodeId(...encodeId(n)) debe ser n.",
    "GPU ピッキングでは、各オブジェクトを固有の色でフレームバッファに描き、readPixels で読み戻す。id 0..16777215 用に encodeId(id) → [r, g, b]（バイト。r に上位 8 ビット、b に下位 8 ビット）と、id を返す decodeId(r, g, b) を書こう。decodeId(...encodeId(n)) は n になること。",
  ),
  starter: "function encodeId(id: number): [number, number, number] {\n  // your code here\n  return [0, 0, 0];\n}\n\nfunction decodeId(r: number, g: number, b: number): number {\n  // your code here\n  return 0;\n}\n",
  solution: "function encodeId(id: number): [number, number, number] {\n  return [(id >> 16) & 255, (id >> 8) & 255, id & 255];\n}\n\nfunction decodeId(r: number, g: number, b: number): number {\n  return (r << 16) | (g << 8) | b;\n}\n",
  nearMiss: [
    // Byte order reversed: round trips work, but the colors are wrong.
    "function encodeId(id: number): [number, number, number] {\n  return [id & 255, (id >> 8) & 255, (id >> 16) & 255];\n}\n\nfunction decodeId(r: number, g: number, b: number): number {\n  return (b << 16) | (g << 8) | r;\n}\n",
    // Forgets to mask the middle byte.
    "function encodeId(id: number): [number, number, number] {\n  return [(id >> 16) & 255, id >> 8, id & 255];\n}\n\nfunction decodeId(r: number, g: number, b: number): number {\n  return (r << 16) | (g << 8) | b;\n}\n",
  ],
  tests: [
    { run: 'console.log(encodeId(0x010203).join(","));', expect: "1,2,3" },
    { run: "console.log(decodeId(1, 2, 3));", expect: "66051" },
    { run: 'console.log(encodeId(16777215).join(","));', expect: "255,255,255", hidden: true },
    { run: "console.log(decodeId(...encodeId(123456)));", expect: "123456", hidden: true },
    { run: 'console.log(encodeId(256).join(","));', expect: "0,1,0", hidden: true },
  ],
  explain: L(
    "Shift then mask with & 255 to take one byte: r = (id >> 16) & 255. Decoding shifts back: (r << 16) | (g << 8) | b.",
    "Desplaza y enmascara con & 255 para tomar un byte: r = (id >> 16) & 255. Para decodificar se desplaza de vuelta: (r << 16) | (g << 8) | b.",
    "シフトして & 255 で 1 バイトを取る：r = (id >> 16) & 255。戻すときは (r << 16) | (g << 8) | b。",
  ),
};

export const juniorTasks: ExamQuestion[] = [toRgba8Task, quadIndicesTask, triangleCountTask, clipToPixelTask];
export const midTasks: ExamQuestion[] = [attribLayoutTask, gridIndicesTask, transformPointTask, mipChainTask];
export const seniorTasks: ExamQuestion[] = [linearizeDepthTask, renderOrderTask, stateChangesTask, pickingIdTask];
