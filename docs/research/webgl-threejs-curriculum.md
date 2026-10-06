# WebGL and three.js moons of Scriptara: proposed curriculum

Curriculum for two new moons of planet **Scriptara** (TypeScript/JavaScript): **WebGL** (pack `webgl`, 3 regions) and
**three.js** (pack `threejs`, 3 regions), plus the entry exams of each moon. It follows what companies assess when
hiring web 3D developers (see [webgl-threejs-hiring-assessments.md](webgl-threejs-hiring-assessments.md)). Content
authors turn this into language packs following [../content-model.md](../content-model.md),
[../authoring-lessons.md](../authoring-lessons.md) and [../exams.md](../exams.md), and the `add-moon` skill.

Both moons assume the learner has finished Scriptara's Regions 1-4 (values, functions and closures, objects and
references, TypeScript shapes). The WebGL moon does not require the three.js moon or vice versa, but three.js Region 3
mentions draw calls, which the WebGL moon explains in depth.

## Conventions used in this file

### Verification tags

Every question idea ends with a tag saying how its answer is proven. All `[R]` and `[TS]` answers were checked on
2026-10-06; authors should still wire each into `check` so `content:verify` keeps them honest.

| Tag | Meaning | How it was checked |
|---|---|---|
| `[R]` | Runtime output of pure logic | Saved as `.ts`, run with Node 25 (type stripping, ESM); three.js snippets use `import * as THREE from "three"` (three r186). Lines are joined by spaces below unless shown separately |
| `[TS]` | Type-checker claim ("Does it compile?", "which call/enum") | `tsc --strict --noEmit`, TS 5.9, `lib: ["es2023","dom"]`, `moduleResolution: "bundler"`, `@types/three` 0.186 |
| `[Doc]` | Conceptual (GPU behaviour, GLSL compile result, visual output); no GPU or GLSL compiler is available | Anchored to the MDN / WebGL2 Fundamentals / Khronos / three.js manual page listed in the lesson |

### Runner assumptions

- Exercises run in Node or a Web Worker **without a GPU or canvas**. A `run` therefore only prints results of pure
  logic: matrix/vector math, clip-space conversions, byte arithmetic for buffers, colour math, index buffers, and
  three.js math and scene-graph classes (`Vector3`, `Matrix4`, `Quaternion`, `Euler`, `Object3D`, `Group`, `Box3`,
  `BufferGeometry`, `InstancedMesh` matrices, `PerspectiveCamera` matrices, `Raycaster` against meshes). Never
  construct `WebGLRenderer` or call a real `gl` in a `run`.
- WebGL API questions (which call creates a shader, enum names, argument order, nullability) are verified by
  **type-checking only**: declare the context with `declare const gl: WebGL2RenderingContext;` (or
  `declare const canvas: HTMLCanvasElement;`) so the snippet type-checks without executing.
- GLSL appears only inside strings or as conceptual `pick` questions.
- `expect` is a stdout **substring** that the starter's output does not contain. Every starter below was run and its
  output is quoted.
- three.js prints: wrap floats in `.toFixed(n)` (`normalize()` gives `0.6000000000000001`, a raycast distance gives
  `14.499999999999998`); avoid values that print `-0.00`. `new THREE.Clock()` writes a deprecation warning to stderr:
  use `THREE.Timer`. Do not raycast a box exactly through its centre (two triangles report the same hit); offset the
  ray as the snippets below do.

### Question kinds

`pick` (one `___`, 2-4 options), `predict` (output or Yes/No), `type` (exact token for `___`), `order` (lines in the
correct order, unique), `run` (broken starter → expected stdout). Code at most 12 lines; snippets here are compact and
authors should split them into lines.

### Visual vocabulary (existing stage effects)

Only existing effects are used: `tag` (label above an actor), `value` (chip), `item` (sword, potion, gem, shield,
scroll, key), `give`, `clone`, `lend`, `drop`, `dead`, `say`, `print`, `shake`, `banner`, `enter`/`exit`,
`attack`/`hp`, `wait`; actors are `hero`, `ally`, `enemy`.

| Graphics idea | On stage |
|---|---|
| GPU / the context | The ally: a silent painter who only does what the hero hands over |
| Bind point (ARRAY_BUFFER, TEXTURE_2D, current program) | A pedestal `tag`ged with the bind-point name; binding = `give` the item onto the pedestal; the previous item is `give`n back |
| Buffer / typed array | A `scroll` with numbered slots; `value` chips are the numbers |
| Shader | A `scroll` held by an actor (vertex scroll, fragment scroll); compile ok = `banner` "COMPILED", failure = `shake` + `say` with the info log |
| Uniform | A `banner` every vertex/fragment can read |
| Attribute / `in` | A chip each vertex carries in its own backpack |
| Varying / `out`→`in` | An item `give`n from the vertex actor to the fragment actor |
| Draw call | The hero walks to the ally (`lend`), the painter paints, comes back; fewer trips = faster |
| Matrix | A `key` item; applying keys in order is shown with `print` of each step |
| three.js object | An actor; `position` is where it stands, `tag` shows the name |
| Parent/child | The child actor rides on the parent (`give` the child to the parent); world position `print`ed vs local `value` |
| Resource that needs `dispose()` | A `gem` the actor keeps holding after it `exit`s, until it `drop`s it |
| Lost context | All items turn `dead`, `banner` "CONTEXT LOST", the hero rebuilds them |

---

# Part A: WebGL moon (pack `webgl`)

| # | Region slug | Theme | Big idea | Lessons |
|---|---|---|---|---|
| 1 | `pipeline-village` | village | Clip space, the GPU state machine, shaders and GLSL | 3 + boss |
| 2 | `buffer-forest` | forest | Typed arrays, buffers, attributes, indexed drawing, textures | 4 + boss |
| 3 | `matrix-mountain` | mountain | Matrices, projection, depth and blending, lighting, framebuffers, performance, context loss | 4 + boss |

Exam-only WebGL topics (no region): `webgl2_differences`, `debugging`.

## Region 1: `pipeline-village`, Clip space, state and shaders

### 1.1 `clip-space`, "The -1 to +1 world"

- **Concept**: WebGL draws whatever the vertex shader puts in clip space; after the divide by `w`, x and y go from -1 to
  +1 whatever the canvas size (NDC), +y points up (pixel y grows down). `gl.viewport(x, y, w, h)` maps NDC to pixels of
  the drawing buffer (`gl.drawingBufferWidth/Height`, which can differ from the CSS size). Anything outside -1..+1 is
  clipped. Pipeline names: vertex shader → primitive assembly → rasterization → fragment shader → tests and blending →
  framebuffer.
- **Visual**: the village square is a grid with `tag`s -1, 0, +1 on its edges; the hero stands at (0, 0). An enemy
  shouts a pixel coordinate (`say` "0, 0!"), the hero converts it and walks to the top-left corner; an actor stepping
  past +1 turns `dead` (clipped).
- **Questions**:
  1. pick: "Clip-space x goes from…" `-1 to +1` / `0 to canvas.width` / `0 to 1` → `-1 to +1` [Doc: WebGL2 Fundamentals]
  2. predict: `const toClipX = (px: number, w: number) => (px / w) * 2 - 1; console.log(toClipX(400, 800), toClipX(800, 800));` → `0 1` [R]
  3. predict: `const toClipY = (py: number, h: number) => 1 - (py / h) * 2; console.log(toClipY(0, 600), toClipY(600, 600));` → `1 -1` [R]
  4. predict: `const ndcToPx = (x: number, w: number) => ((x + 1) / 2) * w; console.log(ndcToPx(0, 800), ndcToPx(-1, 800), ndcToPx(1, 800));` → `400 0 800` [R]
  5. pick: "In clip space, +y points…" up / down → up (screen pixels grow downward, hence the flip) [Doc]
  6. type: `gl.___(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);` → `viewport` [TS]
  7. pick: "A vertex lands at clip x = 1.5. It is…" drawn at the right edge / clipped / wrapped to -0.5 → clipped [Doc]
  8. order the pipeline: vertex shader, primitive assembly, rasterization, fragment shader, depth/blend tests [Doc: WebGL2 Fundamentals "How it works"]
- **Run**: starter `pixelToClip` forgets the Y flip:
  `function pixelToClip(x: number, y: number, w: number, h: number): [number, number] { return [(x / w) * 2 - 1, (y / h) * 2 - 1]; }`
  `console.log("clip " + pixelToClip(0, 0, 400, 300).join(","));` → prints `clip -1,-1`.
  Solution: `1 - (y / h) * 2`. `expect`: `clip -1,1`. [R]

### 1.2 `gpu-state-machine`, "The bound slot"

- **Concept**: `canvas.getContext("webgl2")` returns a `WebGL2RenderingContext` or `null` (unsupported). The context
  is a big state machine: you **bind** an object to a bind point (`ARRAY_BUFFER`, `TEXTURE_2D`, the current program
  via `useProgram`) and later calls act on whatever is bound. Enums are numbers (`gl.TRIANGLES`); state persists
  until changed (`clearColor` only sets the colour used by the next `clear`); `enable`/`disable` toggle features.
- **Visual**: a pedestal `tag`ged `ARRAY_BUFFER` in the square. The hero `give`s scroll A onto it, then scroll B (A comes
  back); the spell `bufferData` lands on whatever sits on the pedestal (B glows, A stays empty, `shake`).
- **Questions**:
  1. predict "Does it compile?": `declare const canvas: HTMLCanvasElement; const gl = canvas.getContext("webgl2"); gl.clearColor(0, 0, 0, 1);` → No: `TS18047 'gl' is possibly 'null'` [TS]
  2. pick: "`getContext("webgl2")` on a browser without WebGL2…" returns `null` / throws → `null` [Doc: MDN getContext][TS]
  3. predict "Does it compile?": `gl.drawArrays("TRIANGLES", 0, 3);` → No: `TS2345` (enums are numbers: `gl.TRIANGLES`) [TS]
  4. pick: after `gl.bindBuffer(gl.ARRAY_BUFFER, a); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);` the data goes to `a` / `b` / both → `b` [Doc]
  5. type: `gl.clear(gl.COLOR_BUFFER_BIT ___ gl.DEPTH_BUFFER_BIT);` → `|` [TS]
  6. predict: `const state = { program: "none" }; const use = (p: string) => { state.program = p; }; use("sky"); use("hero"); console.log("drawing with " + state.program);` → `drawing with hero` [R]
  7. pick: "`gl.clearColor(1, 0, 0, 1)` on its own…" paints the canvas red now / sets the colour the next `gl.clear(gl.COLOR_BUFFER_BIT)` uses → the second [Doc]
  8. predict "Does it compile?": `declare const gl1: WebGLRenderingContext; gl1.createVertexArray();` → No: `TS2339` (WebGL1 needs the `OES_vertex_array_object` extension; VAOs are core in WebGL2) [TS]
- **Run**: a tiny fake context makes the binding bug visible:
  `class FakeGL { bound: string | null = null; sizes: Record<string, number> = { A: 0, B: 0 }; bindBuffer(name: string): void { this.bound = name; } bufferData(data: number[]): void { if (this.bound) this.sizes[this.bound] = data.length; } }`
  `const gl = new FakeGL(); gl.bindBuffer("A"); gl.bindBuffer("B"); gl.bufferData([1, 2, 3]); // meant for A`
  `console.log(`A=${gl.sizes.A} B=${gl.sizes.B}`);` → prints `A=0 B=3`.
  Solution: call `gl.bufferData([1, 2, 3])` right after `gl.bindBuffer("A")`, before binding B. `expect`: `A=3 B=0`. [R]

### 1.3 `shaders-and-glsl`, "Two spellbooks"

- **Concept**: the vertex shader runs once per vertex and must write `gl_Position` (clip space); the fragment shader
  runs once per fragment and outputs a colour (`out vec4 outColor;` in WebGL2, `gl_FragColor` in WebGL1). GLSL ES
  types: `float`, `int`, `bool`, `vec2/3/4`, `mat4`, `sampler2D`; no implicit int→float (`1.0`, not `1`); swizzling
  (`v.xyz`, `v.rgba`, `v.stpq`, sets can't be mixed); fragment shaders have no default float precision
  (`precision highp float;`). WebGL1 `attribute`/`varying` vs WebGL2 `in`/`out`, and `#version 300 es` must be the very
  first line. Building: `createShader` → `shaderSource` → `compileShader` → (check `COMPILE_STATUS`,
  `getShaderInfoLog`) → `createProgram` → `attachShader` ×2 → `linkProgram` → check `LINK_STATUS` → `useProgram`.
- **Visual**: the ally holds the vertex scroll and places corner stones; the enemy holds the fragment scroll and paints
  each tile; a varying is an item `give`n from ally to enemy. Compiling: `banner` "COMPILED" or `shake` + `say` with the
  info log.
- **Questions**:
  1. pick: "Runs once per vertex" vertex shader / fragment shader → vertex shader [Doc]
  2. type: "The vertex shader must write `___`" → `gl_Position` [Doc]
  3. predict (swizzle emulated in TS): `const v = { x: 1, y: 2, z: 3, w: 4 }; console.log([..."zyx"].map(c => v[c as keyof typeof v]).join(","));` → `3,2,1` (in GLSL, `vec4(1.0, 2.0, 3.0, 4.0).zyx` is `vec3(3.0, 2.0, 1.0)`) [R][Doc]
  4. pick: "`float x = 1;` in a GLSL ES shader…" compiles / compile error → compile error (no implicit conversions; write `1.0`) [Doc: GLSL ES 3.00 spec]
  5. pick: "`v.xg`" valid / invalid → invalid (mixes the `xyzw` and `rgba` sets) [Doc]
  6. order: `createShader`, `shaderSource`, `compileShader`, `createProgram`, `attachShader`, `linkProgram`, `useProgram` [TS]
  7. pick: "WebGL2 replacement for `varying` in the vertex shader" `out` / `in` / `uniform` → `out` (and `in` in the fragment shader; `attribute` becomes `in`) [Doc: WebGL1 to WebGL2]
  8. predict "Does it compile?": `const vs = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vs, src);` → No: `TS2345 Argument of type 'WebGLShader | null'…` [TS]
  9. type: `if (!gl.getShaderParameter(sh, gl.___)) console.log(gl.getShaderInfoLog(sh));` → `COMPILE_STATUS` [TS]
  10. pick: "A fragment shader with no `precision` line…" compiles / fails with "No precision specified for (float)" → fails [Doc: GLSL ES spec 4.5.4]
- **Run**: a template literal starts with a newline, so `#version 300 es` is not the first line:
  ``const vs = `\n#version 300 es\nin vec4 a_position;\nvoid main() { gl_Position = a_position; }`;`` (written with a real
  line break after the backtick) and `function firstLineOk(src: string): boolean { return src.split("\n")[0] === "#version 300 es"; }`
  `console.log("valid: " + firstLineOk(vs));` → prints `valid: false`.
  Solution: start the template right after the backtick (`` `#version 300 es ``) (or `.trimStart()`). `expect`:
  `valid: true`. [R]

### 1.4 Boss `pipeline-golem`

1. predict: `const toClipY = (py: number, h: number) => 1 - (py / h) * 2; console.log(toClipY(300, 600));` → `0` [R]
2. predict "Does it compile?": `const gl = canvas.getContext("webgl2"); gl.clearColor(0, 0, 0, 1);` → No (`TS18047`) [TS]
3. pick: "Which shader decides the colour of each pixel?" fragment / vertex → fragment [Doc]
4. pick: "A uniform is…" the same value for every vertex in a draw call / different per vertex → the first (per-vertex data is an attribute / `in`) [Doc]
5. type: `if (!gl.getProgramParameter(prog, gl.___)) throw new Error(gl.getProgramInfoLog(prog) ?? "");` → `LINK_STATUS` [TS]
6. pick: "First line of a WebGL2 shader" `#version 300 es` / `precision highp float;` / a comment → `#version 300 es` [Doc]
7. predict: `const ndcToPx = (x: number, w: number) => ((x + 1) / 2) * w; console.log(ndcToPx(0.5, 800));` → `600` [R]

## Region 2: `buffer-forest`, Buffers, attributes, drawing and textures

### 2.1 `buffers-and-typed-arrays`, "Packing the cart"

- **Concept**: the GPU reads raw bytes from typed arrays (`Float32Array`, `Uint16Array`, `Uint8Array`), sized by
  `BYTES_PER_ELEMENT`; `Float32Array` rounds (`0.1` is stored as `0.10000000149011612`); `Uint16Array` wraps at 65 536;
  `Uint8ClampedArray` clamps. `createBuffer` → `bindBuffer(target, buf)` → `bufferData(target, typedArray, usage)`
  with `STATIC_DRAW` (set once) or `DYNAMIC_DRAW` (updated often); `bufferSubData` to update part.
  `ARRAY_BUFFER` holds vertex data, `ELEMENT_ARRAY_BUFFER` holds indices.
- **Visual**: a cart `scroll` with fixed-width slots; the hero `clone`s number chips into slots; a chip too big for a
  16-bit slot wraps to `0` (`shake`).
- **Questions**:
  1. predict: `console.log(Float32Array.BYTES_PER_ELEMENT, Uint16Array.BYTES_PER_ELEMENT, Uint8Array.BYTES_PER_ELEMENT);` → `4 2 1` [R]
  2. predict: `console.log(new Float32Array([0.1])[0]);` → `0.10000000149011612` [R]
  3. predict: `console.log(new Uint16Array([65535, 65536]).join(","));` → `65535,0` [R]
  4. predict: `console.log(new Uint8Array([300]).join(), new Uint8ClampedArray([300]).join());` → `44 255` [R]
  5. predict "Does it compile?": `gl.bufferData(gl.ARRAY_BUFFER, [0, 1, 2], gl.STATIC_DRAW);` → No: `TS2769 No overload matches this call` (wrap it in `new Float32Array(...)`) [TS]
  6. pick: "Bind point for an index buffer" `ARRAY_BUFFER` / `ELEMENT_ARRAY_BUFFER` → `ELEMENT_ARRAY_BUFFER` [TS]
  7. pick: "Particle positions rewritten every frame: usage hint" `STATIC_DRAW` / `DYNAMIC_DRAW` → `DYNAMIC_DRAW` [Doc: MDN bufferData]
  8. predict: `const tri = new Float32Array([0, 0, 1, 0, 0, 1]); console.log(tri.length, tri.byteLength);` → `6 24` [R]
- **Run**: starter `const cube = new Float32Array(8 * 3); const bytes = cube.length; console.log("bytes: " + bytes);` →
  prints `bytes: 24`. Solution: `cube.length * Float32Array.BYTES_PER_ELEMENT` (or `cube.byteLength`). `expect`:
  `bytes: 96`. [R]

### 2.2 `attributes-stride-offset`, "The interleaved caravan"

- **Concept**: `getAttribLocation(prog, name)` returns a number (-1 if the attribute is missing or unused);
  `enableVertexAttribArray(loc)`; `vertexAttribPointer(loc, size, type, normalize, stride, offset)` captures the buffer
  currently bound to `ARRAY_BUFFER`; `stride` and `offset` are in **bytes**; stride 0 means tightly packed;
  interleaved (`x y z u v x y z u v …`) vs one buffer per attribute; `normalize: true` maps `UNSIGNED_BYTE` 0..255 to
  0..1. A VAO (core in WebGL2) records the attribute setup so drawing needs a single `bindVertexArray`.
- **Visual**: a caravan of wagons (vertices); each wagon carries chips `x y z u v`. The hero walks `stride` steps to
  the next wagon and `offset` steps inside a wagon to reach `u`.
- **Questions**:
  1. predict: `const stride = (3 + 2) * 4; const uvOffset = 3 * 4; console.log(stride, uvOffset);` → `20 12` [R]
  2. predict: "Position as 3 floats + colour as 4 `UNSIGNED_BYTE`s: stride?" `console.log(3 * 4 + 4 * 1);` → `16` [R]
  3. predict: `const data = new Float32Array([0,0,0, 0,0, 1,0,0, 1,0]); const i = 1, F = 5; console.log(data[i * F + 3], data[i * F + 4]);` → `1 0` [R]
  4. pick: "`vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)`: stride 0 means…" tightly packed (2 × 4 bytes) / no data → tightly packed [Doc: MDN vertexAttribPointer]
  5. order: `getAttribLocation`, `createBuffer`, `bindBuffer`, `bufferData`, `enableVertexAttribArray`, `vertexAttribPointer`, `drawArrays` [TS][Doc]
  6. predict: "A normalized `UNSIGNED_BYTE` 128 reaches the shader as" `console.log((128 / 255).toFixed(3));` → `0.502` [R]
  7. pick: "A VAO stores…" attribute enables, pointers and their buffers, plus the `ELEMENT_ARRAY_BUFFER` binding / the current program and uniforms → the first [Doc: WebGL2 Fundamentals]
  8. type: "`gl.getAttribLocation(prog, "a_uv")` returns a `___`" → `number` [TS]
  9. pick: "`getAttribLocation` returned -1" the attribute is missing or unused (optimized out) / the buffer is empty → the first [Doc]
- **Run**: starter computes stride and offset in floats:
  `const FLOATS_PER_VERTEX = 5; const stride = FLOATS_PER_VERTEX; const uvOffset = 3; console.log(`stride=${stride} uvOffset=${uvOffset}`);`
  → prints `stride=5 uvOffset=3`. Solution: multiply both by `Float32Array.BYTES_PER_ELEMENT`. `expect`:
  `stride=20 uvOffset=12`. [R]

### 2.3 `indexed-drawing`, "Reusing corners"

- **Concept**: `drawArrays(mode, first, count)` reads vertices in order; `drawElements(mode, count, type, offset)` reads
  indices from the `ELEMENT_ARRAY_BUFFER` so shared corners are stored once (a quad: 4 vertices + 6 indices instead
  of 6 vertices). Primitives `TRIANGLES`, `TRIANGLE_STRIP`, `LINES`, `POINTS`; triangles = index count / 3.
  `UNSIGNED_SHORT` indices reach 65 535 (`UNSIGNED_INT` needs `OES_element_index_uint` in WebGL1, core in WebGL2).
  Winding: counter-clockwise is front by default; `gl.enable(gl.CULL_FACE)` drops back faces.
- **Visual**: corner stones in the forest; instead of carving new stones the ally points (`lend`) at existing ones by
  number; a rope (triangle) needs three numbers.
- **Questions**:
  1. predict: `const idx = [0, 1, 2, 2, 3, 0]; console.log(idx.length / 3);` → `2` [R]
  2. predict: `const verts = (c: number, r: number) => (c + 1) * (r + 1); const inds = (c: number, r: number) => c * r * 6; console.log(verts(2, 2), inds(2, 2));` → `9 24` [R]
  3. pick: "In `gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)` the `6` is…" the number of indices / triangles / vertices → indices [Doc: MDN drawElements]
  4. predict: `console.log(new Uint16Array([69999])[0]);` → `4463` (index silently wrapped: use `Uint32Array` + `UNSIGNED_INT`) [R]
  5. predict: "Bytes for a quad: indexed vs not (12-byte vertices, 2-byte indices)" `console.log(4 * 12 + 6 * 2, 6 * 12);` → `60 72` [R]
  6. pick: "Default front face" `gl.CCW` / `gl.CW` → `gl.CCW` [Doc]
  7. predict "Does it compile?": `gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT);` → No: `TS2554 Expected 4 arguments, but got 3` [TS]
  8. pick: "`drawArrays` needs an `ELEMENT_ARRAY_BUFFER`" yes / no → no [Doc]
- **Run**: starter builds indices for several quads but steps the base by 6:
  `function quadIndices(quads: number): Uint16Array { const out: number[] = []; for (let q = 0; q < quads; q++) { const b = q * 6; out.push(b, b + 1, b + 2, b + 2, b + 3, b); } return new Uint16Array(out); }`
  `console.log("indices: " + quadIndices(2).join(","));` → prints `indices: 0,1,2,2,3,0,6,7,8,8,9,6`.
  Solution: `const b = q * 4;` (each quad adds 4 vertices). `expect`: `indices: 0,1,2,2,3,0,4,5,6,6,7,4`. [R]

### 2.4 `textures-and-uvs`, "Painting by numbers"

- **Concept**: UVs from 0 to 1 pick a point in the image; `createTexture` → `bindTexture(TEXTURE_2D)` → `texImage2D`;
  texture units (`activeTexture(gl.TEXTURE0 + n)`, sampler uniform set with `uniform1i(loc, n)`); filtering
  `NEAREST` (pixel art) vs `LINEAR`; mipmaps (`generateMipmap`, levels = floor(log2(max side)) + 1, about +33 %
  memory); WebGL1 non-power-of-two textures: no mipmaps and `CLAMP_TO_EDGE` only (WebGL2 lifts this); the default
  `TEXTURE_MIN_FILTER` is `NEAREST_MIPMAP_LINEAR`, so a texture without mipmaps is incomplete and samples black;
  `pixelStorei(UNPACK_FLIP_Y_WEBGL, true)` flips images on upload.
- **Visual**: a painting `scroll` with a grid; the hero reads the colour at (u, v); mipmaps are smaller `clone`s of the
  painting stacked behind it.
- **Questions**:
  1. predict: `const isPow2 = (n: number) => (n & (n - 1)) === 0; console.log([256, 300, 1].map(isPow2).join(","));` → `true,false,true` [R]
  2. predict: `const texel = (u: number, size: number) => Math.min(Math.floor(u * size), size - 1); console.log(texel(0.5, 4), texel(1, 4));` → `2 3` [R]
  3. predict: `console.log(Math.floor(Math.log2(256)) + 1);` "mip levels of a 256×256 texture" → `9` [R]
  4. pick: "WebGL1: `generateMipmap` on a 300×200 texture" works / error (not power of two) → error [Doc: WebGL 1.0 spec]
  5. pick: "Crisp pixel-art magnification filter" `gl.NEAREST` / `gl.LINEAR` → `gl.NEAREST` [Doc]
  6. type: `gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.___);` (trilinear) → `LINEAR_MIPMAP_LINEAR` [TS]
  7. pick: "The image appears upside down" `gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)` before upload / `gl.cullFace(gl.FRONT)` → the first [TS][Doc]
  8. pick: "WebGL1, NPOT image, default parameters, the quad samples black because…" the default min filter needs mipmaps / the image is too big → the first [Doc: WebGL2 Fundamentals textures]
  9. pick: "`gl.uniform1i(samplerLoc, 2)` means" the sampler reads texture unit 2 / the texture is 2 px wide → unit 2 [Doc]
  10. predict: `let total = 0; for (let s = 4; s >= 1; s /= 2) total += s * s; console.log(total);` "texels in a 4×4 mip chain" → `21` [R]
- **Run**: starter `function mipLevels(width: number, height: number): number { return Math.floor(Math.log2(Math.max(width, height))); }`
  `console.log("levels: " + mipLevels(1024, 512));` → prints `levels: 10`. Solution: add `+ 1` (the 1×1 level counts).
  `expect`: `levels: 11`. [R]

### 2.5 Boss `buffer-hydra`

1. predict: `const stride = (3 + 3 + 2) * 4; console.log(stride);` (position, normal, uv) → `32` [R]
2. predict: `console.log(new Uint16Array([65536])[0]);` → `0` [R]
3. pick: "`vertexAttribPointer` reads from…" the buffer bound to `ARRAY_BUFFER` at call time / the last created buffer → the bound one [Doc]
4. predict "Does it compile?": `gl.bufferData(gl.ARRAY_BUFFER, [1, 2], gl.STATIC_DRAW);` → No (`TS2769`) [TS]
5. predict: `console.log(Math.floor(Math.log2(512)) + 1);` → `10` [R]
6. pick: "Indices for a 100 000-vertex mesh" `Uint16Array` + `UNSIGNED_SHORT` / `Uint32Array` + `UNSIGNED_INT` → `Uint32Array` [Doc]
7. type: `gl.drawElements(gl.TRIANGLES, count, gl.___, 0);` with a `Uint16Array` index buffer → `UNSIGNED_SHORT` [TS]

## Region 3: `matrix-mountain`, Matrices, depth, light and speed

### 3.1 `matrices-and-transforms`, "The order of spells"

- **Concept**: 4×4 matrices with homogeneous coordinates (points `w = 1`, directions `w = 0`, so directions ignore
  translation). WebGL expects **column-major** arrays: translation sits at indices 12, 13, 14; in WebGL1
  `uniformMatrix4fv(loc, false, m)` must pass `transpose = false`. `gl_Position = u_projection * u_view * u_model *
  a_position;`: the matrix nearest the vector applies first (model, then view, then projection); multiplication is not
  commutative; the view matrix is the inverse of the camera's world matrix.
- **Visual**: each matrix is a `key`; the hero applies keys right to left, `print`ing the position after each; swapping
  two keys sends the hero to a different ledge.
- **Questions**:
  1. predict: `const I = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; console.log(I[0] + I[5] + I[10] + I[15]);` → `4` [R]
  2. pick: "In a column-major translation matrix, `tx` is at index" 3 / 12 / 15 → 12 [Doc: MDN Matrix math]
  3. predict: `const T = (p: number) => p + 10; const S = (p: number) => p * 2; console.log(T(S(1)), S(T(1)));` → `12 22` [R]
  4. pick: "In `u_projection * u_view * u_model * a_position`, which applies first?" model / projection → model [Doc]
  5. predict: `const tx = 5; const apply = (x: number, w: number) => x + tx * w; console.log(apply(1, 1), apply(1, 0));` → `6 1` (a direction with `w = 0` is not moved) [R]
  6. type: "WebGL1: `gl.uniformMatrix4fv(loc, ___, m)`" → `false` [Doc: WebGL 1.0 spec][TS]
  7. pick: "The view matrix is…" the inverse of the camera's world matrix / the projection matrix → the inverse [Doc: MDN model view projection]
  8. predict: `const r = (x: number, y: number, a: number) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)].map(n => n.toFixed(2)); console.log(r(1, 0, Math.PI / 2).join(","));` → `0.00,1.00` [R]
- **Run**: starter writes the translation row-major, so the column-major `transformPoint` ignores it:
  `function translation(tx: number, ty: number, tz: number): number[] { return [1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz, 0, 0, 0, 1]; }`
  `function transformPoint(m: number[], [x, y, z]: number[]): number[] { return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]; }`
  `console.log("(" + transformPoint(translation(5, 0, 0), [1, 2, 3]).join(", ") + ")");` → prints `(1, 2, 3)`.
  Solution: `return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1];`. `expect`: `(6, 2, 3)`. [R]

### 3.2 `projection-and-depth`, "Near and far"

- **Concept**: a perspective matrix (fov, aspect, near, far) puts distance into `w`; the GPU divides x, y, z by `w`
  (perspective divide), so far things shrink toward the centre. Depth testing: `gl.enable(gl.DEPTH_TEST)`, clear
  `DEPTH_BUFFER_BIT` every frame, `depthFunc(gl.LESS)` by default; a tiny `near` wastes depth precision (z-fighting).
  Blending: `gl.enable(gl.BLEND)` + `gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)` gives
  `src × a + dst × (1 - a)`; draw opaque objects first, then transparent ones back to front.
- **Visual**: two fog gates (`near`, `far`) on the mountain path; actors farther away shrink (`print` x / w); with the
  depth test on, closer actors hide the rest; a ghost ally (transparent) must `enter` last or it erases what is behind.
- **Questions**:
  1. predict: `const clip = [2, 4, 6, 2]; console.log(clip.slice(0, 3).map(c => c / clip[3]).join(","));` → `1,2,3` [R]
  2. predict: `const ndcX = (x: number, w: number) => x / w; console.log(ndcX(2, 2), ndcX(2, 4));` → `1 0.5` (bigger `w` = farther = closer to the centre) [R]
  3. pick: "Without `gl.enable(gl.DEPTH_TEST)`…" later draws always cover earlier ones / nothing renders → later draws cover [Doc]
  4. type: "With depth testing, clear every frame: `gl.clear(gl.COLOR_BUFFER_BIT | gl.___)`" → `DEPTH_BUFFER_BIT` [TS]
  5. predict: `const blend = (s: number, d: number, a: number) => Math.round(s * a + d * (1 - a)); console.log(blend(255, 0, 0.5));` → `128` [R]
  6. pick: "Draw order with transparency" opaque first, then transparent back to front / transparent first → the first [Doc]
  7. pick: "Distant surfaces flicker (z-fighting). First thing to try" increase `near` / decrease `near` to 0.0001 → increase `near` (or shrink far/near ratio) [Doc]
  8. type: `gl.blendFunc(gl.SRC_ALPHA, gl.___);` → `ONE_MINUS_SRC_ALPHA` [TS]
  9. predict: `const f = 1 / Math.tan((90 * Math.PI / 180) / 2); console.log(f.toFixed(3), (f / 2).toFixed(3));` "projection [0] for fov 90 at aspect 1 and 2" → `1.000 0.500` [R]
- **Run**: starter swaps the weights of `SRC_ALPHA, ONE_MINUS_SRC_ALPHA`:
  `type RGB = [number, number, number]; function blend(src: RGB, dst: RGB, a: number): RGB { return src.map((s, i) => Math.round(s * (1 - a) + dst[i] * a)) as RGB; }`
  `console.log("blend: " + blend([255, 0, 0], [0, 0, 255], 0.75).join(","));` → prints `blend: 64,0,191`.
  Solution: `s * a + dst[i] * (1 - a)`. `expect`: `blend: 191,0,64`. [R]

### 3.3 `normals-and-lighting`, "Facing the sun"

- **Concept**: a normal is a unit vector perpendicular to the surface; a face normal is
  `normalize(cross(b - a, c - a))` (order matters: swapping flips it). Lambert diffuse = `max(dot(N, L), 0)` with
  **both** vectors normalized; add an ambient term so shadows aren't pure black. Interpolated normals get shorter, so
  normalize again in the fragment shader; with non-uniform scale use the normal matrix (inverse-transpose of the
  model-view's 3×3).
- **Visual**: the sun (enemy) on a peak; actors turn to face it and their `hp`-like brightness bar fills by
  `dot(N, L)`; an actor facing away gets 0, never negative.
- **Questions**:
  1. predict: `const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0); console.log(dot([0, 1, 0], [0, 1, 0]), dot([0, 1, 0], [1, 0, 0]), dot([0, 1, 0], [0, -1, 0]));` → `1 0 -1` [R]
  2. predict: `const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; console.log(cross([1, 0, 0], [0, 1, 0]).join(","), cross([0, 1, 0], [1, 0, 0]).join(","));` → `0,0,1 0,0,-1` [R]
  3. predict: `console.log(Math.max(-0.5, 0));` "light behind the surface" → `0` [R]
  4. predict: `console.log(Math.cos(Math.PI / 3).toFixed(2));` "brightness at 60° to the light" → `0.50` [R]
  5. predict: `console.log(Math.hypot(3, 4, 0));` → `5` [R]
  6. pick: "Why normalize again in the fragment shader?" interpolated normals are shorter than 1 / GLSL requires it → the first [Doc]
  7. pick: "After `scale(2, 1, 1)` lighting looks wrong. Transform normals with…" the model matrix / the inverse-transpose (normal matrix) → the normal matrix [Doc: WebGL2 Fundamentals directional lighting]
  8. pick: "An ambient term is added so that…" faces away from the light are not pure black / it casts shadows → the first [Doc]
- **Run**: starter forgets to normalize the light direction:
  `type V3 = [number, number, number]; const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; function lambert(normal: V3, toLight: V3): number { return Math.max(dot(normal, toLight), 0); }`
  `console.log("light " + lambert([0, 1, 0], [0, 2, 0]).toFixed(2));` → prints `light 2.00`.
  Solution: add `const normalize = (v: V3): V3 => { const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; };`
  and use `dot(normalize(normal), normalize(toLight))`. `expect`: `light 1.00`. [R]

### 3.4 `framebuffers-and-performance`, "The forge and the courier"

- **Concept**: framebuffers render into a texture instead of the canvas (`createFramebuffer`, `framebufferTexture2D`,
  `checkFramebufferStatus === FRAMEBUFFER_COMPLETE`, `bindFramebuffer(gl.FRAMEBUFFER, null)` returns to the canvas):
  post-processing, shadow maps, picking. Performance: every draw call costs CPU time; batch, sort draws by program and
  texture to cut state changes, use instancing (`drawArraysInstanced` + `vertexAttribDivisor(loc, 1)`; WebGL1 needs
  `ANGLE_instanced_arrays`), avoid blocking calls in the loop (`getError`, `readPixels`, status queries). Context loss:
  the browser may drop the GPU context (`webglcontextlost`); call `event.preventDefault()` to allow restoration, and on
  `webglcontextrestored` recreate every buffer, texture, shader and program.
- **Visual**: each draw call is the hero walking to the ally's forge (`lend` and back); instancing = one trip carrying a
  `scroll` of 100 positions. Context loss: every item turns `dead`, `banner` "CONTEXT LOST", the hero rebuilds them.
- **Questions**:
  1. predict: `const objs = ["tree", "tree", "rock"]; console.log(new Set(objs).size);` "draw calls with instancing per mesh type" → `2` [R]
  2. pick: "`gl.vertexAttribDivisor(loc, 1)`" the attribute advances once per instance / once per vertex → per instance [Doc: WebGL2 Fundamentals instanced drawing]
  3. predict "Does it compile?": `declare const gl1: WebGLRenderingContext; gl1.drawArraysInstanced(gl1.TRIANGLES, 0, 3, 100);` → No: `TS2339` (WebGL2 only; use the extension in WebGL1) [TS]
  4. pick: "Draw to the canvas again after rendering to a texture" `gl.bindFramebuffer(gl.FRAMEBUFFER, null)` / `gl.deleteFramebuffer(fb)` → the first [TS][Doc]
  5. pick: "In a `webglcontextlost` handler, to be allowed a restore" call `event.preventDefault()` / call `getContext` again → `preventDefault()` [Doc: MDN webglcontextlost]
  6. pick: "After `webglcontextrestored`" recreate all GPU resources / nothing, they come back → recreate [Doc]
  7. predict "Does it compile?": `canvas.addEventListener("webglcontextlost", (e) => console.log(e.statusMessage));` → No: `TS2339` (`e` is `Event`; cast `e as WebGLContextEvent`) [TS]
  8. pick: "Sort opaque draws by…" program/material to reduce state changes / object name → program/material [Doc: MDN best practices]
  9. pick: "Call to avoid every frame in production" `gl.getError()` / `gl.drawArrays()` → `getError` (forces a sync with the GPU) [Doc: MDN best practices]
  10. predict: `console.log(1000 * 16 * 4);` "bytes of a per-instance mat4 buffer for 1000 instances" → `64000` [R]
- **Run**: starter counts one draw call per object even though identical geometry+material pairs are instanced:
  `type Obj = { geometry: string; material: string };` five objects (3 × tree/bark, 2 × rock/stone),
  `function drawCalls(list: Obj[]): number { return list.length; }` `console.log("draw calls: " + drawCalls(objs));` →
  prints `draw calls: 5`. Solution: `return new Set(list.map(o => o.geometry + "|" + o.material)).size;`. `expect`:
  `draw calls: 2`. [R]

### 3.5 Boss `matrix-titan`

1. predict: `const T = (p: number) => p + 3; const S = (p: number) => p * 4; console.log(T(S(1)), S(T(1)));` → `7 16` [R]
2. pick: "`tx` in a column-major matrix" index 12 / index 3 → 12 [Doc]
3. predict: `const blend = (s: number, d: number, a: number) => Math.round(s * a + d * (1 - a)); console.log(blend(200, 100, 0.25));` → `125` [R]
4. predict: `const clip = [3, -3, 0, 3]; console.log(clip.slice(0, 2).map(c => c / clip[3]).join(","));` → `1,-1` [R]
5. pick: "Lambert with a light behind the face" negative / clamped to 0 → 0 [Doc]
6. pick: "1000 identical rocks, fastest" one instanced draw / 1000 draw calls → instanced [Doc]
7. predict "Does it compile?": `canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); });` → Yes [TS]

---

# Part B: three.js moon (pack `threejs`)

| # | Region slug | Theme | Big idea | Lessons |
|---|---|---|---|---|
| 1 | `scene-village` | village | Scene/Camera/Renderer, meshes and materials, Object3D transforms | 3 + boss |
| 2 | `graph-forest` | forest | Scene graph, vectors, matrices, quaternions and Euler angles | 3 + boss |
| 3 | `loop-tower` | tower | Render loop and time, raycasting, assets/colour/shadows, disposal and performance | 4 + boss |

Exam-only three.js topics (no region): `shaders` (ShaderMaterial, uniforms), `ecosystem` (OrbitControls,
react-three-fiber, post-processing, physics), `webgl_under_hood` (what the renderer does in WebGL terms).

Every three.js snippet starts with `import * as THREE from "three";` (omitted below).

## Region 1: `scene-village`, The stage, its actors and their poses

### 1.1 `scene-camera-renderer`, "Stage, eye and painter"

- **Concept**: a `Scene` holds objects, a camera is the viewpoint, `WebGLRenderer` draws the scene from the camera into
  a canvas (`renderer.render(scene, camera)`). `PerspectiveCamera(fov, aspect, near, far)`: vertical fov in degrees,
  defaults `50, 1, 0.1, 2000`; it starts at the origin looking down -Z, so move it back. Resize: set `camera.aspect`,
  call `camera.updateProjectionMatrix()`, call `renderer.setSize(w, h)`; `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
  `OrthographicCamera` has no perspective.
- **Visual**: the stage (scene), the eye (camera, an ally holding a `scroll` with fov/aspect/near/far chips) and the
  painter (renderer, the enemy who only paints when the hero calls `render`).
- **Questions**:
  1. predict: `const cam = new THREE.PerspectiveCamera(); console.log(cam.fov, cam.aspect, cam.near, cam.far);` → `50 1 0.1 2000` [R]
  2. predict: `const cam = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000); console.log(cam.position.z);` → `0` (inside the cube at the origin until you move it) [R]
  3. pick: "`fov` is measured in…" degrees (vertical) / radians → degrees [Doc: three.js docs PerspectiveCamera]
  4. order: create `Scene`, create `PerspectiveCamera`, create `WebGLRenderer`, `scene.add(mesh)`, `renderer.render(scene, camera)` [Doc: manual fundamentals]
  5. pick: "Correct resize handler" `camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);` / `renderer.setSize(w, h);` only → the first [Doc: manual responsive]
  6. predict "Does it compile?": `cam.fov = "75";` → No: `TS2322 Type 'string' is not assignable to type 'number'` [TS]
  7. pick: "Why cap `setPixelRatio` at 2?" pixel count (fragment work) grows with the square of the ratio / textures break → pixel count [Doc]
  8. pick: "A mesh 2500 units in front of a camera with `far = 2000`" drawn / not drawn → not drawn (outside the frustum) [Doc]
- **Run**: starter resize forgets `updateProjectionMatrix`:
  `const camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000); function onResize(width: number, height: number): void { camera.aspect = width / height; } onResize(800, 400);`
  `console.log("p00 " + camera.projectionMatrix.elements[0].toFixed(3));` → prints `p00 0.733`.
  Solution: add `camera.updateProjectionMatrix();`. `expect`: `p00 0.652`. [R]

### 1.2 `meshes-geometry-material`, "Body and skin"

- **Concept**: `new THREE.Mesh(geometry, material)`; built-in geometries (`BoxGeometry` has 24 vertices and 36 indices
  because each face needs its own normals; `PlaneGeometry` 4 and 6); `new THREE.Mesh()` defaults to a
  `BufferGeometry` and a `MeshBasicMaterial`. Materials: `MeshBasicMaterial` ignores lights; `MeshLambertMaterial`,
  `MeshPhongMaterial` (shininess, default 30), `MeshStandardMaterial` (PBR: `roughness` 1, `metalness` 0 by default)
  and `MeshPhysicalMaterial` need lights or they render black. `Color`: `set`, `getHexString`; hex/CSS colours are
  sRGB and stored in linear components (`"#808080"` → `r = 0.2159`).
- **Visual**: a mesh is an actor whose body (geometry, a `scroll` of vertices) wears a skin (material, a `gem`); the
  Standard skin stays dark until a light (`banner` "LIGHT") enters.
- **Questions**:
  1. predict: `const m = new THREE.Mesh(); console.log(m.geometry.type);` → `BufferGeometry` [R]
  2. predict: `const g = new THREE.BoxGeometry(1, 1, 1); console.log(g.attributes.position.count, g.index?.count);` → `24 36` [R]
  3. pick: "A cube with `MeshStandardMaterial` and no lights renders…" black / white / red → black [Doc: manual fundamentals]
  4. pick: "Material that ignores lighting" `MeshBasicMaterial` / `MeshStandardMaterial` / `MeshPhongMaterial` → `MeshBasicMaterial` [Doc]
  5. predict: `console.log(new THREE.Color(0xff0000).getHexString());` → `ff0000` [R]
  6. predict: `const c = new THREE.Color("#808080"); console.log(c.r.toFixed(4), c.getHexString());` → `0.2159 808080` (stored linear, read back as sRGB) [R]
  7. predict: `const s = new THREE.MeshStandardMaterial(); console.log(s.roughness, s.metalness);` → `1 0` [R]
  8. predict "Does it compile?": `new THREE.MeshBasicMaterial().roughness = 0.5;` → No: `TS2339 Property 'roughness' does not exist on type 'MeshBasicMaterial'` [TS]
  9. predict: `console.log(new THREE.PlaneGeometry(2, 2).attributes.position.count);` → `4` [R]
- **Run**: starter assigns a number to the colour (kept with `// @ts-expect-error` so it reaches the runtime; without
  it `tsc` reports `TS2322 Type 'number' is not assignable to type 'Color'`):
  `const mat = new THREE.MeshStandardMaterial({ color: 0xff0000 }); mat.color = 0x00ff00; console.log("color " + mat.color.getHexString());`
  → throws `TypeError: mat.color.getHexString is not a function`. Solution: `mat.color.set(0x00ff00);`. `expect`:
  `color 00ff00`. [R][TS]

### 1.3 `object3d-transforms`, "Move, turn, grow"

- **Concept**: every object is an `Object3D` with `position` (Vector3), `rotation` (Euler, **radians**), `scale`
  (Vector3) and `quaternion`; these properties are read-only references: change them with `set`/`copy` or by
  component. `MathUtils.degToRad`/`radToDeg`. The local `matrix` is rebuilt from them (`updateMatrix()`, done
  automatically before rendering while `matrixAutoUpdate` is true). `clone()` copies the transform but **shares**
  geometry and material. `lookAt` turns an object toward a point.
- **Visual**: the hero practises poses: `position` = walk, `rotation` = turn (a chip in radians; typing 90 makes the
  hero spin 14 times, `shake`), `scale` = grow. Clones share the same `gem` skin (`lend` arrow between them).
- **Questions**:
  1. predict: `const o = new THREE.Object3D(); console.log(o.position.toArray().join(","), o.scale.toArray().join(","));` → `0,0,0 1,1,1` [R]
  2. predict "Does it compile?": `mesh.position = new THREE.Vector3(1, 2, 3);` → No: `TS2540 Cannot assign to 'position' because it is a read-only property` (use `mesh.position.set(1, 2, 3)`) [TS]
  3. predict: `console.log(THREE.MathUtils.radToDeg(Math.PI / 2), THREE.MathUtils.degToRad(180) === Math.PI);` → `90 true` [R]
  4. predict: `const o = new THREE.Object3D(); o.position.set(1, 0, 0); console.log(o.matrix.elements[12]); o.updateMatrix(); console.log(o.matrix.elements[12]);` → `0` then `1` [R]
  5. predict: `const a = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); const b = a.clone(); console.log(b.geometry === a.geometry, b.material === a.material, b.position === a.position);` → `true true false` [R]
  6. predict: `const o = new THREE.Object3D(); o.lookAt(5, 0, 0); console.log(o.rotation.y.toFixed(3));` → `1.571` [R]
  7. predict "Does it compile?": `mesh.rotation.y = 90;` → Yes (but 90 radians, a logic bug) [TS]
  8. pick: "`mesh.scale.set(2, 1, 1)`" twice as wide / twice as big in every direction → twice as wide [Doc]
- **Run**: starter uses degrees:
  `const arm = new THREE.Object3D(); arm.rotation.z = 90; arm.updateMatrix(); const tip = new THREE.Vector3(1, 0, 0).applyMatrix4(arm.matrix); console.log(`tip ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`);`
  → prints `tip -0.45 0.89`. Solution: `arm.rotation.z = Math.PI / 2;` (or `THREE.MathUtils.degToRad(90)`). `expect`:
  `tip 0.00 1.00`. [R]

### 1.4 Boss `scene-gremlin`

1. predict: `const cam = new THREE.PerspectiveCamera(60); console.log(cam.fov, cam.aspect);` → `60 1` [R]
2. pick: "Standard material, black screen, objects present" add a light / increase `far` → add a light [Doc]
3. predict "Does it compile?": `mesh.scale = new THREE.Vector3(2, 2, 2);` → No (`TS2540`) [TS]
4. predict: `const m = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()); const c = m.clone(); c.position.x = 5; console.log(m.position.x, c.geometry === m.geometry);` → `0 true` [R]
5. predict: `console.log(new THREE.Color(0x00ff00).g, new THREE.Color(0x00ff00).getHexString());` → `1 00ff00` [R]
6. pick: "After changing `camera.fov`" call `camera.updateProjectionMatrix()` / nothing → call it [Doc]
7. predict: `console.log(THREE.MathUtils.degToRad(90).toFixed(4));` → `1.5708` [R]

## Region 2: `graph-forest`, Families, arrows and turns

### 2.1 `scene-graph`, "The family tree"

- **Concept**: `parent.add(child)`, `remove`, `children`, `parent`; an object has **one** parent (`add` moves it out of
  its old parent; adding twice keeps one entry). A child's transform is relative to its parent (local); world =
  parent's world × local; `getWorldPosition(target)` (updates world matrices for you), `localToWorld`/`worldToLocal`;
  `attach(child)` re-parents while keeping the world transform; `traverse` visits depth-first (parent before
  children); `traverseVisible` skips hidden subtrees; `getObjectByName`; `Group` is an empty container.
- **Visual**: a family tree of actors; a child rides on the parent's shoulders (`give` the child to the parent).
  Its local `value` chip says 1, the `print`ed world position says 11. `attach` = the child hops on without moving.
- **Questions**:
  1. predict: `const p = new THREE.Group(); p.position.x = 10; const kid = new THREE.Object3D(); kid.position.x = 1; p.add(kid); console.log(kid.getWorldPosition(new THREE.Vector3()).x, kid.position.x);` → `11 1` [R]
  2. predict: same but `p.scale.set(2, 2, 2)` before reading → `12 1` [R]
  3. predict: `const p1 = new THREE.Group(), p2 = new THREE.Group(), c = new THREE.Object3D(); p1.add(c); p2.add(c); console.log(p1.children.length, p2.children.length);` → `0 1` [R]
  4. predict: `root` has children `a` and `b`, `a` has child `c` (all named); `const names: string[] = []; root.traverse(o => names.push(o.name)); console.log(names.join(","));` → `root,a,c,b` [R]
  5. predict: `const p = new THREE.Group(), c = new THREE.Object3D(); p.add(c); p.add(c); console.log(p.children.length);` → `1` [R]
  6. predict: group at `y = 2` with `scale.setScalar(3)`, child at `(1, 1, 0)`, `scene.updateMatrixWorld();` `console.log(new THREE.Vector3().setFromMatrixPosition(child.matrixWorld).toArray().join(","));` → `3,5,0` [R]
  7. pick: "Re-parent but keep the world position" `newParent.attach(obj)` / `newParent.add(obj)` → `attach` [Doc: three.js docs Object3D]
  8. predict: `const g2 = new THREE.Group(); g2.position.set(10, 0, 0); console.log(g2.localToWorld(new THREE.Vector3(1, 0, 0)).x, g2.worldToLocal(new THREE.Vector3(11, 0, 0)).x);` → `11 1` [R]
  9. predict: `root` has `a` and a hidden `b` (`b.visible = false`) whose child is `c`; `traverseVisible` names vs `traverse` names → `root,a root,a,b,c` [R]
- **Run**: starter picks up a sword with `add`, which keeps its local x = 12 under a parent at x = 10:
  `const hero = new THREE.Group(); hero.position.x = 10; const sword = new THREE.Object3D(); sword.position.x = 12; hero.updateMatrixWorld(); hero.add(sword); const w = new THREE.Vector3(); sword.getWorldPosition(w); console.log("sword world x: " + w.x);`
  → prints `sword world x: 22`. Solution: `hero.attach(sword);`. `expect`: `sword world x: 12`. [R]

### 2.2 `vectors`, "Arrows in the quiver"

- **Concept**: `Vector3` methods mutate `this` and return it (chainable): `add`, `sub`, `multiplyScalar`,
  `normalize`, `applyMatrix4`, `lerp`…; assigning a vector copies the reference (aliasing), so use `clone()` or
  `copy()`. `length`, `distanceTo`, `dot` (0 when perpendicular), `cross` (perpendicular vector, order matters);
  `equals` compares values while `===` compares identity. Print with `toFixed`.
- **Visual**: vectors are arrows (`key` items); two actors `tag`ged with the same arrow share it (`lend` without
  return); `clone` gives each their own.
- **Questions**:
  1. predict: `const a = new THREE.Vector3(1, 2, 3); const b = a; b.x = 9; console.log(a.x);` → `9` [R]
  2. predict: `const v = new THREE.Vector3(1, 1, 1); const r = v.add(new THREE.Vector3(1, 0, 0)); console.log(v.x, r === v);` → `2 true` [R]
  3. predict: `console.log(new THREE.Vector3(3, 4, 0).length());` → `5` [R]
  4. predict: `console.log(new THREE.Vector3(3, 4, 0).normalize().toArray().join(","));` → `0.6000000000000001,0.8,0` [R]
  5. predict: `const c = new THREE.Vector3(1, 0, 0).cross(new THREE.Vector3(0, 1, 0)); console.log(new THREE.Vector3(1, 0, 0).dot(new THREE.Vector3(0, 1, 0)), c.x, c.y, c.z);` → `0 0 0 1` [R]
  6. predict: `console.log(new THREE.Vector3(0, 0, 0).distanceTo(new THREE.Vector3(0, 3, 4)));` → `5` [R]
  7. predict: `console.log(new THREE.Vector3(0, 0, 0).lerp(new THREE.Vector3(10, 0, 0), 0.25).x);` → `2.5` [R]
  8. predict: `const a = new THREE.Vector3(1, 1, 1), b = new THREE.Vector3(1, 1, 1); console.log(a === b, a.equals(b));` → `false true` [R]
  9. predict: `console.log(new THREE.Vector3(1, 2, 3).multiplyScalar(2).toArray().join(","));` → `2,4,6` [R]
  10. predict: `console.log(new THREE.Vector3(0, 0, 0).sub(new THREE.Vector3(1, 2, 3)).toArray().join(","));` → `-1,-2,-3` [R]
- **Run**: starter previews a move by mutating the real position:
  `const pos = new THREE.Vector3(0, 0, 0); const step = new THREE.Vector3(1, 0, 0); const next = pos.add(step); console.log(`pos ${pos.x} next ${next.x}`);`
  → prints `pos 1 next 1`. Solution: `const next = pos.clone().add(step);`. `expect`: `pos 0 next 1`. [R]

### 2.3 `matrices-quaternions-euler`, "Turning without tangles"

- **Concept**: `Matrix4.set(...)` takes arguments in row-major reading order but `elements` is stored column-major
  (translation at 12, 13, 14); `makeTranslation`, `makeScale`, `makeRotationZ`; `a.multiply(b)` = a × b (b applies to
  points first), `a.premultiply(b)` = b × a; `compose`/`decompose`; `determinant`. `Euler(x, y, z, order)` with default
  order `"XYZ"`; Euler angles can hit gimbal lock (two axes align, one degree of freedom is lost); `Quaternion`
  (x, y, z, w; identity w = 1) via `setFromAxisAngle`/`setFromEuler`, `slerp` for smooth turns. An object's `rotation`
  and `quaternion` stay in sync.
- **Visual**: three rings (X, Y, Z) around the hero; when two rings line up they lock (`shake`, `banner` "GIMBAL
  LOCK"); a quaternion is a single `key` that turns the hero without rings.
- **Questions**:
  1. predict: `const m = new THREE.Matrix4().set(1,2,3,4, 5,6,7,8, 9,10,11,12, 13,14,15,16); console.log(m.elements.slice(0, 4).join(","));` → `1,5,9,13` [R]
  2. predict: `console.log(new THREE.Matrix4().makeTranslation(5, 0, 0).elements[12]);` → `5` [R]
  3. predict: `const T = new THREE.Matrix4().makeTranslation(10, 0, 0), S = new THREE.Matrix4().makeScale(2, 2, 2); const p = (m: THREE.Matrix4) => new THREE.Vector3(1, 0, 0).applyMatrix4(m).x; console.log(p(new THREE.Matrix4().multiplyMatrices(T, S)), p(new THREE.Matrix4().multiplyMatrices(S, T)));` → `12 22` [R]
  4. predict: same `T`, `S`: `console.log(p(T.clone().multiply(S)), p(T.clone().premultiply(S)));` → `12 22` [R]
  5. predict: `console.log(new THREE.Matrix4().makeScale(2, 3, 4).determinant());` → `24` [R]
  6. predict: `console.log(new THREE.Euler().order, new THREE.Euler(0, 0, 0, "YXZ").order);` → `XYZ YXZ` [R]
  7. predict: `const o = new THREE.Object3D(); o.rotation.y = Math.PI / 2; console.log(o.quaternion.y.toFixed(3), o.quaternion.w.toFixed(3));` → `0.707 0.707` [R]
  8. predict: `const a = new THREE.Quaternion(); const b = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2); const h = a.clone().slerp(b, 0.5); console.log((2 * Math.acos(h.w) * 180 / Math.PI).toFixed(1));` → `45.0` [R]
  9. pick: "Gimbal lock is…" losing a rotational degree of freedom when two Euler axes align / a WebGL error → the first; fix with quaternions [Doc]
  10. predict: `const m = new THREE.Matrix4().compose(new THREE.Vector3(1, 2, 3), new THREE.Quaternion(), new THREE.Vector3(2, 2, 2)); const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); m.decompose(p, q, s); console.log(p.toArray().join(","), s.toArray().join(","));` → `1,2,3 2,2,2` [R]
  11. predict "Does it compile?": `new THREE.Euler(0, 0, 0, "ABC");` → No: `TS2345 … not assignable to parameter of type 'EulerOrder | undefined'` [TS]
- **Run**: starter wants "scale first, then translate" but multiplies in the wrong order:
  `const T = new THREE.Matrix4().makeTranslation(10, 0, 0); const S = new THREE.Matrix4().makeScale(2, 2, 2); const M = S.clone().multiply(T); console.log("x: " + new THREE.Vector3(1, 0, 0).applyMatrix4(M).x);`
  → prints `x: 22`. Solution: `const M = T.clone().multiply(S);`. `expect`: `x: 12`. [R]

### 2.4 Boss `graph-wraith`

1. predict: parent at `x = 5`, child at local `x = 2`: `console.log(child.getWorldPosition(new THREE.Vector3()).x);` → `7` [R]
2. predict: `const v = new THREE.Vector3(2, 0, 0); const w = v; w.multiplyScalar(3); console.log(v.x);` → `6` [R]
3. pick: "`a.multiply(b)` applied to a point" b first, then a / a first, then b → b first [Doc: three.js docs Matrix4]
4. predict: `console.log(new THREE.Quaternion().w, new THREE.Quaternion().length());` → `1 1` [R]
5. predict: `const g = new THREE.Group(); const c = new THREE.Object3D(); c.position.set(5, 0, 0); g.position.set(10, 0, 0); g.updateMatrixWorld(); g.attach(c); console.log(c.position.x);` → `-5` [R]
6. predict: `console.log(new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2).y.toFixed(3));` → `1.000` [R]
7. pick: "Smoothly turn from one orientation to another" `Quaternion.slerp` / lerp each Euler angle → `slerp` [Doc]

## Region 3: `loop-tower`, Time, picking, assets and cleanup

### 3.1 `render-loop`, "The heartbeat"

- **Concept**: `requestAnimationFrame(loop)` (or `renderer.setAnimationLoop(loop)`) calls you once per display frame:
  60, 120 or 144 times a second, paused in hidden tabs. Move by `speed × delta` seconds so motion is frame-rate
  independent. `THREE.Timer`: call `update()` once per frame, then `getDelta()`/`getElapsed()` (stable within the
  frame); `THREE.Clock` is deprecated since r183. Clamp huge deltas after a tab switch; physics prefers a fixed step
  with an accumulator.
- **Visual**: the tower's heartbeat drum (`wait` beats); on a fast machine the drum beats twice as often, and a hero who
  moves "one step per beat" races ahead (`print` positions) until the step is scaled by delta.
- **Questions**:
  1. predict: `const t = new THREE.Timer(); t.update(1000); t.update(1016); console.log(t.getDelta(), t.getDelta());` → `0.016 0.016` [R]
  2. predict: `console.log(5 * 0.016);` "units moved in one 16 ms frame at 5 units/s" → `0.08` [R]
  3. pick: "Moving `x += 0.1` per frame on a 120 Hz screen vs 60 Hz" twice as fast / the same → twice as fast [Doc: MDN requestAnimationFrame]
  4. pick: "`new THREE.Clock()` in r186" deprecated, use `THREE.Timer` / the recommended timer → deprecated (warns on stderr) [R]
  5. predict: `console.log(Math.min(2.5, 0.1));` "delta after the tab was hidden 2.5 s, clamped" → `0.1` [R]
  6. order the frame: `timer.update();`, `const dt = timer.getDelta();`, `mesh.rotation.y += dt;`, `renderer.render(scene, camera);` [Doc]
  7. pick: "Where to call `requestAnimationFrame(loop)`" inside `loop`, to schedule the next frame / once, it repeats forever → inside `loop` [Doc]
  8. predict: `let acc = 0.04, steps = 0; const STEP = 1 / 60; while (acc >= STEP) { acc -= STEP; steps++; } console.log(steps);` → `2` [R]
- **Run**: starter moves a fixed amount per frame:
  `const SPEED = 5; function simulate(fps: number, seconds: number): number { const dt = 1 / fps; let x = 0; for (let i = 0; i < fps * seconds; i++) x += SPEED; return x; }`
  ``console.log(`30fps=${simulate(30, 1).toFixed(2)} 60fps=${simulate(60, 1).toFixed(2)}`);`` → prints
  `30fps=150.00 60fps=300.00`. Solution: `x += SPEED * dt;`. `expect`: `30fps=5.00 60fps=5.00`. [R]

### 3.2 `raycasting`, "The pointing wand"

- **Concept**: convert the pointer from pixels to NDC (`x = px / w * 2 - 1`, `y = -(py / h) * 2 + 1`), then
  `raycaster.setFromCamera(ndc, camera)`; `intersectObjects(objects, recursive = true)` returns hits sorted by
  distance (nearest first) with `distance`, `point`, `object`, `face`; an empty array means a miss. Raycasting uses
  each object's `matrixWorld` (a mesh moved but not yet updated is hit at its old place) and respects
  `material.side` (a FrontSide plane is missed from behind). `near`/`far` limit the ray (defaults `0`, `Infinity`).
- **Visual**: the hero points a wand from the camera; a beam goes through the scene and every actor it touches lines
  up by distance; the first one `say`s "picked!".
- **Questions**:
  1. predict: ray from `(0.2, 0.1, 10)` toward `(0, 0, -1)`; boxes `near` at z = 0 and `far` at z = -5, both added (far first) and `scene.updateMatrixWorld()`; `console.log(rc.intersectObjects(scene.children).map(h => `${h.object.name}:${h.distance.toFixed(1)}`).join(","));` → `near:9.5,far:14.5` [R]
  2. predict: `const ndc = (px: number, py: number, w: number, h: number) => [(px / w) * 2 - 1, -(py / h) * 2 + 1]; console.log(ndc(400, 300, 800, 600).join(","), ndc(0, 0, 800, 600).join(","));` → `0,0 -1,1` [R]
  3. predict: the same ray against a box inside a `Group`: `console.log(rc.intersectObjects(scene.children).length, rc.intersectObjects(scene.children, false).length);` → `1 0` [R]
  4. predict: a `PlaneGeometry(2, 2)` mesh at the origin, ray from `(0.2, 0.1, -10)` toward `+z` (behind the plane): `intersectObject` length, then with `material.side = THREE.DoubleSide` → `0` then `1` [R]
  5. predict: `const rc = new THREE.Raycaster(); console.log(rc.near, rc.far);` → `0 Infinity` [R]
  6. pick: "`intersectObjects` results are ordered…" nearest first / scene order → nearest first [Doc: three.js docs Raycaster]
  7. predict: a box with `position.x = 3` never rendered or updated, ray along x = 0.2: hits before and after `mesh.updateMatrixWorld()` → `1` then `0` [R]
  8. predict: `const ray = new THREE.Ray(new THREE.Vector3(0, 0, 10), new THREE.Vector3(0, 0, -1)); const p = ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), new THREE.Vector3()); console.log(p?.toArray().join(","));` → `0,0,0` [R]
  9. predict: a ray parallel to that plane (`direction (1, 0, 0)`): `console.log(ray2.intersectPlane(plane, new THREE.Vector3()));` → `null` [R]
- **Run**: camera `PerspectiveCamera(50, 800 / 600, 0.1, 100)` at z = 5; a `gem` box at y = 1.2 and a `trap` box at
  y = -1.2; the starter's `toNdc` forgets to flip y:
  `function toNdc(px: number, py: number, w: number, h: number): THREE.Vector2 { return new THREE.Vector2((px / w) * 2 - 1, (py / h) * 2 - 1); }`
  `raycaster.setFromCamera(toNdc(400, 150, 800, 600), camera); const hits = raycaster.intersectObjects(scene.children); console.log("hit " + (hits.length > 0 ? hits[0].object.name : "nothing"));`
  → prints `hit trap`. Solution: `-(py / h) * 2 + 1`. `expect`: `hit gem`. (Call `camera.updateMatrixWorld()` and
  `scene.updateMatrixWorld()` in the setup.) [R]

### 3.3 `assets-lights-shadows`, "Treasure from afar"

- **Concept**: `GLTFLoader` (from `three/addons/loaders/GLTFLoader.js`) loads glTF/GLB; `await loader.loadAsync(url)`
  returns `gltf` whose `gltf.scene` is a `Group` you add and `traverse` to configure meshes. Colour management is on by
  default (`ColorManagement.enabled`, working space `srgb-linear`, `renderer.outputColorSpace = SRGBColorSpace`);
  colour textures loaded by hand need `texture.colorSpace = THREE.SRGBColorSpace` (glTF does it for you), data
  textures (normal, roughness, metalness) stay `NoColorSpace`. Lights: Ambient, Hemisphere (no direction, no
  shadows), Directional, Point, Spot (can cast shadows). Shadows need `renderer.shadowMap.enabled = true`,
  `light.castShadow = true`, and `castShadow`/`receiveShadow` on meshes; all default to `false`.
- **Visual**: a treasure chest arrives by messenger bird (`wait`, then `enter`); inside is a family of actors; the hero
  must give every actor (not just the chest) a shadow `tag`.
- **Questions**:
  1. predict: `console.log(new THREE.Texture().colorSpace === THREE.NoColorSpace, THREE.SRGBColorSpace);` → `true srgb` [R]
  2. predict: `console.log(THREE.ColorManagement.enabled, THREE.ColorManagement.workingColorSpace);` → `true srgb-linear` [R]
  3. predict: `const m = new THREE.Mesh(); const l = new THREE.DirectionalLight(); console.log(m.castShadow, m.receiveShadow, l.castShadow);` → `false false false` [R]
  4. pick: "Everything needed for a shadow besides the light" `renderer.shadowMap.enabled`, `light.castShadow`, `mesh.castShadow`, `floor.receiveShadow` / only `light.castShadow` → the first [Doc: manual shadows]
  5. pick: "Which light cannot cast shadows?" `AmbientLight` / `DirectionalLight` / `SpotLight` → `AmbientLight` [Doc]
  6. pick: "`colorSpace` for a normal map" `THREE.NoColorSpace` / `THREE.SRGBColorSpace` → `NoColorSpace` (it holds data, not colour) [Doc: manual color management]
  7. pick: "`loader.loadAsync(url)` resolves to…" a `gltf` object; add `gltf.scene` / a `Mesh` → the first [Doc: manual load-gltf]
  8. predict: `console.log(new THREE.Color(0.5, 0.5, 0.5).getHexString());` → `bcbcbc` (components are linear) [R]
  9. pick: "A photo texture looks washed out" set `texture.colorSpace = THREE.SRGBColorSpace` / raise light intensity → the first [Doc]
- **Run**: a stand-in for `gltf.scene` (a `Group` containing `body` → `arm` → `hand` meshes); starter sets
  `model.castShadow = true;` on the root only and counts with
  `let casters = 0; model.traverse((o) => { if (o instanceof THREE.Mesh && o.castShadow) casters++; }); console.log("shadow casters: " + casters);`
  → prints `shadow casters: 0`. Solution: `model.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });`.
  `expect`: `shadow casters: 3`. [R]

### 3.4 `dispose-and-performance`, "Sweep the stage"

- **Concept**: removing an object from the scene does **not** free GPU memory: call `dispose()` on geometries,
  materials, textures (`material.map`…) and render targets you no longer need (each fires a `"dispose"` event the
  renderer listens to); `renderer.info.memory` counts geometries and textures, `renderer.info.render.calls` counts draw
  calls; shared resources are disposed only when nobody uses them. Each visible mesh costs about one draw call:
  `InstancedMesh` draws many copies in one call (`setMatrixAt` + `instanceMatrix.needsUpdate = true`), merging static
  geometries (`BufferGeometryUtils.mergeGeometries`) helps for different static shapes; LOD and frustum culling cut
  work. Big index arrays automatically become `Uint32Array`.
- **Visual**: actors that `exit` keep holding their `gem`s (GPU memory) in the wings until they `drop` them
  (`dispose`); an `InstancedMesh` is one actor holding a `scroll` of 1000 positions.
- **Questions**:
  1. predict: `const g = new THREE.BoxGeometry(); let n = 0; g.addEventListener("dispose", () => n++); g.dispose(); console.log(n);` → `1` [R]
  2. predict: `const im = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 3); console.log(im.count, im.instanceMatrix.array.length);` → `3 48` [R]
  3. predict: `im.setMatrixAt(1, new THREE.Matrix4().makeTranslation(7, 0, 0)); const out = new THREE.Matrix4(); im.getMatrixAt(1, out); console.log(out.elements[12]);` → `7` [R]
  4. predict: `im.instanceMatrix.needsUpdate = true; console.log(im.instanceMatrix.version);` → `1` (the flag bumps the version the renderer uploads) [R]
  5. pick: "Does `scene.remove(mesh)` free GPU memory?" yes / no → no [Doc: manual dispose]
  6. pick: "Where to watch for leaks" `renderer.info.memory` / `scene.children.length` → `renderer.info.memory` [Doc]
  7. pick: "1000 trees, same geometry and material, each moving" `InstancedMesh` / merge into one geometry / 1000 meshes → `InstancedMesh` [Doc: manual optimize lots of objects]
  8. pick: "Dispose a material shared by 10 meshes when you remove one of them" yes / no, only when none use it → no [Doc]
  9. predict: `const g = new THREE.BufferGeometry(); g.setIndex([0, 1, 2]); const big = new THREE.BufferGeometry(); big.setIndex(Array.from({ length: 70000 }, (_, i) => i)); console.log(g.index?.array.constructor.name, big.index?.array.constructor.name);` → `Uint16Array Uint32Array` [R]
- **Run**: starter `clear` only removes children: two meshes, each with a geometry and a material that count `"dispose"`
  events;
  `function clear(root: THREE.Object3D): void { for (const child of [...root.children]) root.remove(child); }`
  ``clear(scene); console.log(`children: ${scene.children.length} disposed: ${disposed}`);`` → prints
  `children: 0 disposed: 0`. Solution: inside the loop,
  `if (child instanceof THREE.Mesh) { child.geometry.dispose(); child.material.dispose(); }` before `root.remove(child)`.
  `expect`: `disposed: 4`. [R][TS]

### 3.5 Boss `frame-dragon`

1. predict: `const t = new THREE.Timer(); t.update(0); t.update(50); console.log(t.getDelta());` → `0.05` [R]
2. pick: "Pointer at the top edge of the canvas: NDC y" `1` / `-1` → `1` [Doc]
3. predict: `const rc = new THREE.Raycaster(new THREE.Vector3(0.2, 0.1, 10), new THREE.Vector3(0, 0, -1), 0, 5);` against the `near`/`far` boxes (first at distance 9.5) → `0` hits [R]
4. pick: "Shadows enabled on light and meshes, still none" `renderer.shadowMap.enabled = true` missing / far plane too big → the first [Doc]
5. pick: "SPA route change leaks memory" dispose geometries, materials and textures of the removed scene / call `scene.clear()` only → dispose [Doc]
6. predict "Does it compile?": `const m: THREE.Mesh = group.children[0];` → No: `TS2739` (`children` are `Object3D`; narrow with `instanceof THREE.Mesh`) [TS]
7. predict: `const im = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 100); console.log(im.instanceMatrix.array.length);` → `1600` [R]

---

# Entry exams

Both exams follow [../exams.md](../exams.md): bank ≥ 1.6 × `count`, round-robin draw across topics, sorted by
difficulty. Topic ids that link to a region let a strong result skip it.

## WebGL moon

### Topics

| Topic id | Name (en) | Region |
|---|---|---|
| `pipeline` | The rendering pipeline | `pipeline-village` |
| `clip_space` | Clip space, NDC and the viewport | `pipeline-village` |
| `state_machine` | Contexts and the GPU state machine | `pipeline-village` |
| `shaders_glsl` | Shaders, GLSL ES, compile and link | `pipeline-village` |
| `buffers` | Typed arrays and buffers | `buffer-forest` |
| `attributes` | Attributes, stride, offset and VAOs | `buffer-forest` |
| `drawing` | drawArrays, drawElements and index buffers | `buffer-forest` |
| `textures` | Textures, UVs, filtering and mipmaps | `buffer-forest` |
| `matrices` | Matrices and transforms | `matrix-mountain` |
| `depth_blending` | Projection, depth testing and blending | `matrix-mountain` |
| `lighting` | Normals and lighting | `matrix-mountain` |
| `framebuffers` | Framebuffers and render-to-texture | `matrix-mountain` |
| `performance` | Draw calls, state changes and instancing | `matrix-mountain` |
| `context_loss` | Context loss and restoration | `matrix-mountain` |
| `webgl2_differences` | WebGL1 vs WebGL2 | (none) |
| `debugging` | Errors, blocking calls and debugging | (none) |

### Levels

| Exam | Draws / bank | Pass | s/question | Topic ids (bank count) |
|---|---|---|---|---|
| `junior`, Junior WebGL Developer | 12 / 22 | 70% | 30 | pipeline 3, clip_space 3, state_machine 3, shaders_glsl 3, buffers 3, attributes 3, drawing 2, textures 2 |
| `mid`, Mid-level WebGL Developer | 14 / 24 | 70% | 40 | shaders_glsl 2, attributes 3, drawing 2, textures 3, matrices 3, depth_blending 3, lighting 2, performance 2, webgl2_differences 2, debugging 2 |
| `senior`, Senior Graphics Engineer (WebGL) | 15 / 26 | 75% | 50 | matrices 3, depth_blending 2, lighting 2, performance 4, framebuffers 3, context_loss 3, textures 2, shaders_glsl 2, webgl2_differences 2, debugging 3 |

### Junior examples

1. `clip_space` predict: `const toClipX = (px: number, w: number) => (px / w) * 2 - 1; console.log(toClipX(200, 800));` → `-0.5` [R]
2. `pipeline` pick: "Which stage turns triangles into fragments?" rasterization / vertex shader → rasterization [Doc]
3. `state_machine` predict "Does it compile?": `const gl = canvas.getContext("webgl2"); gl.clearColor(0, 0, 0, 1);` → No (`TS18047`) [TS]
4. `shaders_glsl` type: "The vertex shader writes `___`" → `gl_Position` [Doc]
5. `buffers` predict: `console.log(new Float32Array(9).byteLength);` → `36` [R]
6. `attributes` predict: `console.log((3 + 2) * 4);` "stride of interleaved xyz + uv floats" → `20` [R]
7. `drawing` predict: `console.log([0, 1, 2, 2, 3, 0].length / 3);` → `2` [R]
8. `textures` pick: "UV (0, 0) to (1, 1) covers…" the whole image / one pixel → the whole image [Doc]
9. `shaders_glsl` pick: "Same value for every vertex in a draw" uniform / attribute → uniform [Doc]

### Mid examples

1. `attributes` predict: `console.log(3 * 4 + 4 * 1);` "xyz floats + rgba bytes stride" → `16` [R]
2. `drawing` predict: `console.log(new Uint16Array([65536])[0]);` → `0` [R]
3. `textures` pick: "WebGL1, 300×200 texture with mipmaps" error / works → error (NPOT) [Doc]
4. `matrices` predict: `const T = (p: number) => p + 10; const S = (p: number) => p * 2; console.log(S(T(1)));` "which order is `S × T` applied to a point?" → `22` [R]
5. `depth_blending` predict: `const blend = (s: number, d: number, a: number) => Math.round(s * a + d * (1 - a)); console.log(blend(255, 0, 0.5));` → `128` [R]
6. `lighting` predict: `console.log(Math.max(-0.3, 0));` → `0` [R]
7. `performance` pick: "Fewer draw calls for 500 identical sprites" instancing / one `drawArrays` each → instancing [Doc]
8. `webgl2_differences` predict "Does it compile?": `declare const gl1: WebGLRenderingContext; gl1.createVertexArray();` → No (`TS2339`) [TS]
9. `debugging` pick: "Shader failed to compile. Read why with…" `gl.getShaderInfoLog(sh)` / `gl.getError()` → `getShaderInfoLog` [TS][Doc]
10. `shaders_glsl` pick: "`float x = 1;`" compile error / ok → compile error [Doc]

### Senior examples

1. `matrices` pick: "Normals after non-uniform scale" inverse-transpose of the model-view 3×3 / the model matrix → inverse-transpose [Doc]
2. `depth_blending` pick: "Transparent objects" sorted back to front after opaque ones, often with `depthMask(false)` / any order with depth writes → the first [Doc]
3. `performance` pick: "Most effective first optimization for 5000 draw calls" batch/instance to cut draw calls / shorten shaders → batch/instance [Doc: MDN best practices]
4. `framebuffers` pick: "Validate a framebuffer before using it" `gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE` / `gl.getError()` → the first [TS][Doc]
5. `context_loss` predict "Does it compile?": `canvas.addEventListener("webglcontextlost", (e) => console.log(e.statusMessage));` → No (`TS2339`; cast to `WebGLContextEvent`) [TS]
6. `context_loss` pick: "After `webglcontextrestored`" rebuild every buffer, texture, shader and program / call `gl.flush()` → rebuild [Doc]
7. `debugging` pick: "Why check `COMPILE_STATUS` only when `LINK_STATUS` fails?" status queries block and stop parallel compilation / it is deprecated → the first [Doc: MDN best practices]
8. `textures` pick: "Cut texture VRAM on mobile" compressed formats (ETC/ASTC via Basis/KTX2) / bigger mipmaps → compressed [Doc]
9. `webgl2_differences` pick: "Render to a float texture in WebGL2 requires…" the `EXT_color_buffer_float` extension / nothing → the extension [Doc]
10. `performance` predict: `console.log(1000 * 16 * 4);` "bytes of per-instance mat4 data for 1000 instances" → `64000` [R]
11. `lighting` predict: `const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; console.log(cross([0, 1, 0], [1, 0, 0]).join(","));` → `0,0,-1` [R]

## three.js moon

### Topics

| Topic id | Name (en) | Region |
|---|---|---|
| `scene_basics` | Scene, camera and renderer | `scene-village` |
| `cameras` | Cameras, projection and resize | `scene-village` |
| `materials` | Geometries, materials and colour | `scene-village` |
| `transforms` | Object3D position, rotation and scale | `scene-village` |
| `scene_graph` | Scene graph, local and world space | `graph-forest` |
| `vectors` | Vector math | `graph-forest` |
| `rotations` | Matrices, quaternions and Euler angles | `graph-forest` |
| `render_loop` | Render loop and delta time | `loop-tower` |
| `raycasting` | Raycasting and picking | `loop-tower` |
| `assets_color` | Loaders, textures and colour spaces | `loop-tower` |
| `lights_shadows` | Lights and shadows | `loop-tower` |
| `disposal` | Disposing resources and memory | `loop-tower` |
| `performance` | Draw calls, instancing, merging and LOD | `loop-tower` |
| `shaders` | ShaderMaterial and custom shaders | (none) |
| `ecosystem` | Controls, react-three-fiber, post-processing, physics | (none) |
| `webgl_under_hood` | What the renderer does in WebGL | (none) |

### Levels

| Exam | Draws / bank | Pass | s/question | Topic ids (bank count) |
|---|---|---|---|---|
| `junior`, Junior three.js Developer | 12 / 22 | 70% | 30 | scene_basics 3, cameras 3, materials 3, transforms 3, scene_graph 3, vectors 3, render_loop 2, lights_shadows 2 |
| `mid`, Mid-level three.js Developer | 14 / 24 | 70% | 40 | cameras 2, scene_graph 3, vectors 2, rotations 3, render_loop 2, raycasting 3, assets_color 3, lights_shadows 2, disposal 2, ecosystem 2 |
| `senior`, Senior three.js / Creative Developer | 15 / 26 | 75% | 50 | rotations 3, raycasting 2, assets_color 3, disposal 3, performance 4, lights_shadows 2, shaders 3, webgl_under_hood 3, scene_graph 1, render_loop 2 |

### Junior examples

1. `scene_basics` pick: "Draws the scene" `renderer.render(scene, camera)` / `scene.render(camera)` → the first [Doc]
2. `cameras` predict: `console.log(new THREE.PerspectiveCamera().fov);` → `50` [R]
3. `materials` pick: "No lights in the scene; which material still shows its colour?" `MeshBasicMaterial` / `MeshStandardMaterial` → Basic [Doc]
4. `transforms` predict "Does it compile?": `mesh.position = new THREE.Vector3(1, 2, 3);` → No (`TS2540`) [TS]
5. `transforms` predict: `console.log(THREE.MathUtils.radToDeg(Math.PI));` → `180` [R]
6. `scene_graph` predict: parent at `x = 10`, child at local `x = 1`: world x → `11` [R]
7. `vectors` predict: `console.log(new THREE.Vector3(3, 4, 0).length());` → `5` [R]
8. `render_loop` pick: "Frame-rate independent movement" `x += speed * delta` / `x += speed` → the first [Doc]
9. `lights_shadows` predict: `console.log(new THREE.Mesh().castShadow);` → `false` [R]

### Mid examples

1. `cameras` predict: aspect changed from 16/9 to 2 without `updateProjectionMatrix()`: `projectionMatrix.elements[0].toFixed(3)` → `0.733` (unchanged; `0.652` after the update) [R]
2. `scene_graph` predict: `p1.add(c); p2.add(c); console.log(p1.children.length, p2.children.length);` → `0 1` [R]
3. `vectors` predict: `const v = new THREE.Vector3(1, 1, 1); const r = v.add(new THREE.Vector3(1, 0, 0)); console.log(r === v);` → `true` [R]
4. `rotations` predict: `const o = new THREE.Object3D(); o.rotation.y = Math.PI / 2; console.log(o.quaternion.y.toFixed(3));` → `0.707` [R]
5. `rotations` predict: `T.clone().multiply(S)` with T = translate 10, S = scale 2, applied to `(1, 0, 0)` → `12` [R]
6. `raycasting` predict: `const ndc = (py: number, h: number) => -(py / h) * 2 + 1; console.log(ndc(0, 600), ndc(600, 600));` → `1 -1` [R]
7. `assets_color` predict: `console.log(new THREE.Texture().colorSpace === THREE.NoColorSpace);` → `true` (tag colour maps as sRGB yourself) [R]
8. `disposal` pick: "`scene.remove(mesh)` frees GPU memory" yes / no → no [Doc]
9. `ecosystem` pick: "Declarative three.js in React" react-three-fiber / react-dom → react-three-fiber [Doc]
10. `lights_shadows` pick: "Cannot cast shadows" `HemisphereLight` / `SpotLight` → Hemisphere [Doc]

### Senior examples

1. `performance` pick: "10 000 static rocks of 5 different shapes" 5 `InstancedMesh` (or merged geometry per material) / 10 000 meshes → instancing/merging [Doc]
2. `performance` predict: `console.log(new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 100).instanceMatrix.array.length);` → `1600` [R]
3. `disposal` predict: two meshes whose geometries and materials count `"dispose"` events, removed with `root.remove` only → `disposed: 0`; with `geometry.dispose()` + `material.dispose()` → `disposed: 4` [R]
4. `rotations` predict: half-way `slerp` from identity to 90° about z → `45.0` degrees [R]
5. `raycasting` predict: a mesh moved to `x = 3` but never updated is still hit by a ray at `x = 0.2` → `1` hit (`0` after `updateMatrixWorld()`) [R]
6. `assets_color` predict: `console.log(new THREE.Color(0.5, 0.5, 0.5).getHexString());` → `bcbcbc` [R]
7. `shaders` pick: "Pass time to a `ShaderMaterial` each frame" `material.uniforms.uTime.value = t` / recreate the material → the uniform [Doc: three.js docs ShaderMaterial]
8. `webgl_under_hood` pick: "Each visible `Mesh` with its own material roughly costs…" one draw call / one shader compile per frame → one draw call [Doc]
9. `webgl_under_hood` pick: "`texture.needsUpdate = true` makes the renderer…" re-upload the image to the GPU / recompile shaders → re-upload [Doc]
10. `render_loop` pick: "Why `Timer` over `Clock`" `update()` once per frame gives stable `getDelta()`, optional Page Visibility handling / `Clock` is faster → the first [Doc: three.js Timer source docs]
11. `lights_shadows` pick: "Shadow acne" adjust `light.shadow.bias` / raise `castShadow` count → bias [Doc: manual shadows]
12. `scene_graph` predict: `g.attach(c)` where `g` is at x = 10 and `c` at world x = 5 → local `c.position.x` is `-5` [R]

---

# Sources for this curriculum

Research file: [webgl-threejs-hiring-assessments.md](webgl-threejs-hiring-assessments.md) (full source list). Pages
cited by `[Doc]` tags:

- MDN, WebGL API: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
- MDN, WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- MDN, Matrix math for the web: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
- MDN, WebGL model view projection: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection
- MDN, `HTMLCanvasElement.getContext`: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
- MDN, `bufferData`: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
- MDN, `vertexAttribPointer`: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
- MDN, `drawElements`: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
- MDN, `blendFunc`: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
- MDN, `webglcontextlost` event: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event
- MDN, `requestAnimationFrame`: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- WebGL2 Fundamentals: https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html
- WebGL2 Fundamentals, how it works: https://webgl2fundamentals.org/webgl/lessons/webgl-how-it-works.html
- WebGL2 Fundamentals, textures: https://webgl2fundamentals.org/webgl/lessons/webgl-3d-textures.html
- WebGL2 Fundamentals, directional lighting: https://webgl2fundamentals.org/webgl/lessons/webgl-3d-lighting-directional.html
- WebGL2 Fundamentals, instanced drawing: https://webgl2fundamentals.org/webgl/lessons/webgl-instanced-drawing.html
- WebGL2 Fundamentals, WebGL1 to WebGL2: https://webgl2fundamentals.org/webgl/lessons/webgl1-to-webgl2.html
- Khronos, WebGL 1.0 specification: https://registry.khronos.org/webgl/specs/latest/1.0/
- Khronos, WebGL 2.0 specification: https://registry.khronos.org/webgl/specs/latest/2.0/
- Khronos, GLSL ES 3.00 specification: https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf
- three.js manual, fundamentals: https://threejs.org/manual/#en/fundamentals
- three.js manual, responsive design: https://threejs.org/manual/#en/responsive
- three.js manual, scene graph: https://threejs.org/manual/#en/scenegraph
- three.js manual, matrix transformations: https://threejs.org/manual/#en/matrix-transformations
- three.js manual, picking: https://threejs.org/manual/#en/picking
- three.js manual, loading a glTF file: https://threejs.org/manual/#en/load-gltf
- three.js manual, color management: https://threejs.org/manual/#en/color-management
- three.js manual, shadows: https://threejs.org/manual/#en/shadows
- three.js manual, how to dispose of objects: https://threejs.org/manual/en/how-to-dispose-of-objects
- three.js manual, optimizing lots of objects: https://threejs.org/manual/#en/optimize-lots-of-objects
- three.js docs (Object3D, Matrix4, Raycaster, PerspectiveCamera, InstancedMesh, ShaderMaterial, Timer): https://threejs.org/docs/
