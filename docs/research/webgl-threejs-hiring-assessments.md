# WebGL and three.js hiring assessments: what companies test, by level

Research for the **WebGL moon** (pack `webgl`) and the **three.js moon** (pack `threejs`) of planet Scriptara
(TypeScript/JavaScript) in Bitwise Quest. Curriculum and entry exams built from this file are in
[webgl-threejs-curriculum.md](webgl-threejs-curriculum.md). Goal: simulate the technical screening a company runs when
hiring for web 3D roles (graphics engineer, creative developer, WebGL/three.js developer, game or product
configurator developer) at junior, mid-level and senior level, in an arcade format.

Researched October 2026, against three.js r186 (`three@0.186.1`, `@types/three@0.186.0`, the versions installed in
this repo), TypeScript 5.9 `lib.dom` WebGL typings and Node 25. Sources: public question collections, skill-test
vendors, job postings, MDN, WebGL2 Fundamentals, the Khronos specifications and the three.js manual. Interview
processes vary a lot in this niche: treat this as a synthesis, not a standard. Every runtime or type-checker claim used
in the curriculum was checked locally (see section 7).

## 1. How web 3D screening usually works

| Stage | Typical format | Source evidence |
|---|---|---|
| Portfolio review | Live demos, CodePen/GitHub links, "walk me through this effect" | Nearly every creative-developer posting (WeAreDevelopers "Creative WebGL Developer", Remotive three.js/WebGL developer); Proxify hiring guide |
| Online quiz | Short MCQ: read a three.js snippet and say what renders (colour, position, radius, segments) | WeLoveDevs three.js test: 20 questions drawn from a bank of 29, about 7 minutes, intermediate level |
| Conceptual screen | "Explain the graphics pipeline", "vertex vs fragment shader", "uniform vs attribute vs varying", "what is a draw call", "how do you handle context loss" | hyring.com WebGL (60 questions: fundamentals, practical, advanced scenarios), climbtheladder, index.dev |
| three.js fundamentals screen | Scene/Camera/Renderer, PerspectiveCamera vs OrthographicCamera, Basic vs Standard material, lights, scene graph, Raycaster, Clock/delta time, GLTFLoader, `dispose()` | lemon.io (28 junior/intermediate + 28 experienced questions), hyring.com three.js, index.dev |
| Math screen | Dot/cross products, normalizing, matrix multiplication order, local vs world space, quaternions vs Euler (gimbal lock), projecting a point to the screen | Job postings ("strong 3D math: vectors, matrices, quaternions"), Glassdoor graphics software engineer interviews |
| Take-home / live coding | Build a small scene: load a GLTF, orbit camera, click to select (raycast), responsive resize, 60 fps on mobile; or a raw-WebGL triangle with a texture | Postings asking for "interactive 3D experiences", "convert 3D models into optimized web-ready assets" (Rise Up Labs, Xsolla via Remotive) |
| Senior deep dive | Performance budget (draw calls, instancing vs merging, LOD, texture compression KTX2/Basis), memory leaks and `renderer.info`, custom shaders (`ShaderMaterial`), post-processing, PBR, shadows tuning, WebGPU/WebXR awareness | lemon.io experienced section; hirist "Senior Graphics Engineer (WebGL/three.js)"; Rise Up Labs senior posting; MDN WebGL best practices |

Observations:

- Pure "WebGL" roles are rarer than three.js (or react-three-fiber) roles; graphics-engineer interviews for WebGL lean on
  pipeline, GPU state, shaders, buffers and performance, and on math in general.
- Creative-developer roles weigh the portfolio and shaders (GLSL) heavily; product roles (configurators, maps, CAD
  viewers, games) weigh performance, memory and asset pipelines.
- Seniors are expected to know **why** three.js does things (it is a WebGL state manager), so a three.js senior bank
  should borrow WebGL topics (draw calls, state changes, shaders, context loss).

## 2. Topics per level: WebGL

| Area | Junior | Mid-level | Senior |
|---|---|---|---|
| What WebGL is (rasterization API on `<canvas>`, OpenGL ES 2.0 / 3.0 based), WebGL1 vs WebGL2 | Core | Know WebGL2 additions (VAOs, instancing, UNSIGNED_INT indices, NPOT mipmaps, `#version 300 es`) | WebGPU comparison |
| Rendering pipeline (vertex shader → primitive assembly → rasterization → fragment shader → per-fragment tests → framebuffer) | Name the stages | Core | Where costs go (vertex vs fragment bound, overdraw) |
| Clip space / NDC (-1..+1), `gl.viewport`, pixel ↔ clip conversion, Y flip | Core | Core | Perspective divide, depth range |
| GPU state machine (bind points, "current" buffer/program/texture unit) | Know "bind then act" | Core: bugs from the wrong thing bound | Minimising state changes, sorting draws |
| Context creation (`getContext("webgl2")` returns `null` if unsupported), attributes (`antialias`, `alpha`, `preserveDrawingBuffer`) | Core | Core | `powerPreference`, `OffscreenCanvas` in a worker |
| Shaders and GLSL ES basics (types, swizzling, precision, built-ins `gl_Position`) | Core | Core | Precision pitfalls on mobile, branching cost |
| attribute / uniform / varying (WebGL1) vs `in` / `out` / `uniform` (WebGL2) | Core | Core | Uniform buffer objects (WebGL2) |
| Compile / link / status checks, info logs | Know they exist | Core | Deferring status checks (parallel compile, `KHR_parallel_shader_compile`) |
| Buffers (ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER), typed arrays, usage hints | Core | Core | `bufferSubData`, streaming, orphaning |
| `vertexAttribPointer` size/type/normalize/stride/offset, interleaving | Know the call | Core: byte arithmetic | Packing (normalized bytes, half floats) |
| VAOs | Not required | Core | Static VAOs, no per-draw mutation |
| `drawArrays` vs `drawElements`, index types, winding and culling | Know both | Core | Index limits (65 535 for UNSIGNED_SHORT), triangle strips |
| Textures: UVs, filtering, wrapping, mipmaps, NPOT rules in WebGL1, `UNPACK_FLIP_Y_WEBGL`, texture units | Basic | Core | Compressed formats, atlases, VRAM budget |
| Blending and depth testing, draw order of transparent objects | Know `DEPTH_TEST` | Core | Order-independent transparency, premultiplied alpha |
| Framebuffers / render-to-texture | Not required | Know the idea | Post-processing chains, MRT, float targets (`EXT_color_buffer_float`) |
| Matrices: model/view/projection, column-major layout, multiplication order | Know MVP | Core | Normal matrix (inverse-transpose), precision |
| Normals and basic lighting (Lambert = max(dot(N, L), 0)) | Not required | Core | Phong/Blinn-Phong, PBR basics |
| Performance: draw calls, state changes, instancing, batching | Know "fewer draw calls" | Core | Profiling (Spector.js), GPU timers, mobile tiled GPUs |
| Context loss and restoration | Not required | Know `webglcontextlost` | Full resource recreation strategy |
| Errors (`getError`, debugging) | Know `getError` | Core | Avoid blocking calls in production |

## 3. Topics per level: three.js

| Area | Junior | Mid-level | Senior |
|---|---|---|---|
| Scene / Camera / Renderer trio, the render call | Core | Assumed | Multiple scenes/viewports, render targets |
| PerspectiveCamera (fov in degrees, aspect, near, far), `updateProjectionMatrix`, OrthographicCamera | Core | Core | Near/far and depth precision (z-fighting), logarithmic depth |
| Resize handling, `setPixelRatio` | Core | Core | Capping pixel ratio for performance |
| Mesh = Geometry + Material; built-in geometries | Core | Assumed | Custom BufferGeometry |
| BufferGeometry attributes (position/normal/uv, itemSize, index) | Know they exist | Core | Updating attributes (`needsUpdate`), interleaved buffers |
| Materials: Basic (unlit) vs Lambert/Phong vs Standard/Physical (PBR, need lights) | Core | Core | `ShaderMaterial` / `RawShaderMaterial`, `onBeforeCompile` |
| Lights (Ambient, Hemisphere, Directional, Point, Spot) | Core | Core | Cost of many lights, baked lighting, environment maps (PMREM) |
| Object3D position/rotation/scale, radians | Core | Assumed | `matrixAutoUpdate = false` for static objects |
| Scene graph, parent/child, local vs world, `add` vs `attach`, `traverse` | Basic | Core | Pivot tricks, world-space queries |
| Math: Vector3 (mutating API, `clone`), Matrix4, Quaternion, Euler order, gimbal lock | Vector basics | Core | Quaternion slerp, decomposition, column-major storage |
| Render loop: `requestAnimationFrame` / `setAnimationLoop`, delta time (`Timer`; `Clock` deprecated since r183) | Core | Core | Fixed-step physics, pausing in hidden tabs |
| Raycasting (NDC from pointer, `setFromCamera`, sorted hits, recursion) | Basic | Core | BVH acceleration, GPU picking |
| Loaders (GLTFLoader, async), traversing a loaded model | Basic | Core | DRACO/meshopt compression, KTX2 textures |
| Textures and color spaces (`texture.colorSpace = SRGBColorSpace` for colour maps, data maps stay linear) | Basic | Core | Color management pipeline, tone mapping |
| Shadows (renderer + light + mesh flags, shadow camera) | Know the flags | Core | Shadow map tuning, bias/acne, cascades |
| Disposal (geometry, material, texture, render target), `renderer.info` | Not required | Core | Leak hunting in SPAs |
| Performance: draw calls, InstancedMesh, merging geometries, LOD, frustum culling | Know "fewer objects" | Core | Budgets, profiling, texture compression, WebGPU renderer |
| Ecosystem: OrbitControls, react-three-fiber, post-processing, physics libraries | Know they exist | Use them | Choose and integrate |

### What makes a candidate senior (both moons)

- Explains costs in GPU terms: draw calls and state changes on the CPU side, overdraw and fragment cost on the GPU side,
  VRAM for textures and render targets.
- Knows that removing an object from a three.js scene does not free GPU memory and can find a leak with
  `renderer.info.memory`.
- Reasons about transforms fluently: multiplication order, local vs world space, column-major storage, quaternions.
- Knows the colour pipeline (sRGB textures vs linear data, output colour space) and why things look "washed out".
- Can drop down to raw WebGL / GLSL when three.js is not enough (custom shaders, render targets).

## 4. Question formats that fit the arcade

| Format | Example | Verification |
|---|---|---|
| Predict stdout of pure math | `new THREE.Vector3(3, 4, 0).length()` → `5` | Node + three (runs without a GPU) |
| Predict stdout of byte arithmetic | Stride of interleaved `xyz uv` floats → `20` | Node |
| Type-check "Does it compile?" | `gl.shaderSource(gl.createShader(gl.VERTEX_SHADER), src)` → No (`WebGLShader \| null`) | `tsc --strict` with `lib dom` |
| Pick the API call / enum | "Which call reads an attribute's layout from the bound buffer?" → `vertexAttribPointer` | Type-check the correct option |
| Order the steps | createBuffer → bindBuffer → bufferData → enableVertexAttribArray → vertexAttribPointer → drawArrays | Doc + type-check |
| Fix the run | Broken pixel→clip conversion, broken stride, forgotten `updateProjectionMatrix`, forgotten `dispose()` | Expected stdout substring |
| Conceptual pick | "Why does a MeshStandardMaterial render black?" → no lights | Doc (cite the manual) |

Not machine-verifiable here (no GPU, no GLSL compiler): what a shader renders, whether GLSL compiles, visual output.
Those stay conceptual `pick` questions with a doc citation; GLSL may appear as strings.

## 5. Ranked lists: most frequently asked items

Ranking is by how often the item appears across the sources in section 8 (question collections, vendor tests and
postings), weighted toward items that appear at more than one level.

### WebGL

1. Explain the rendering pipeline; vertex vs fragment shader.
2. attribute vs uniform vs varying (WebGL2: `in` / `out` / `uniform`).
3. Buffers and `vertexAttribPointer` (size, type, normalize, stride, offset).
4. Clip space / NDC and `gl.viewport`; converting pixels to clip space.
5. Draw calls and why to reduce them (batching, instancing, atlases).
6. Matrices: model/view/projection and multiplication order.
7. Textures: UVs, filtering, mipmaps, power-of-two in WebGL1.
8. `drawArrays` vs `drawElements` (index buffers).
9. Compiling and linking shaders, checking status and logs.
10. Depth testing and blending; drawing transparent objects.
11. WebGL1 vs WebGL2 differences (VAOs, instancing, GLSL ES 3.00).
12. Context loss and restoration.
13. The GPU state machine (binding).
14. Normals and lighting (dot product).
15. Framebuffers / render-to-texture and post-processing.
16. GLSL precision qualifiers and mobile.
17. Debugging (`getError`, Spector.js, blank canvas checklist).

### three.js

1. Scene / Camera / Renderer and a minimal scene.
2. Materials: Basic vs Standard (and why Standard is black without lights).
3. PerspectiveCamera parameters; resize handling with `updateProjectionMatrix`.
4. Performance: draw calls, InstancedMesh, merging, LOD.
5. Lights and shadows (the three flags).
6. Scene graph and parent/child transforms (local vs world).
7. Render loop with delta time (`Clock`/`Timer`).
8. Raycasting for mouse picking.
9. Loading models (GLTFLoader) and textures.
10. Memory management with `dispose()` and `renderer.info`.
11. Quaternions vs Euler angles (gimbal lock).
12. Custom shaders (`ShaderMaterial`), post-processing (`EffectComposer`).
13. Vector math (dot, cross, normalize, distance).
14. Color spaces / color management.
15. `setPixelRatio` trade-offs.
16. react-three-fiber integration.

## 6. Proposed bank layout (entry exams)

Matches the other packs ([../exams.md](../exams.md)): bank ≥ 1.6 × draws.

| Moon | Junior (draws / bank) | Mid | Senior |
|---|---|---|---|
| WebGL | 12 / 22 | 14 / 24 | 15 / 26 |
| three.js | 12 / 22 | 14 / 24 | 15 / 26 |

Topic ids, region links and example questions are in [webgl-threejs-curriculum.md](webgl-threejs-curriculum.md#entry-exams).

## 7. Verification notes (important for content authors)

Checked locally on 2026-10-06:

- **three.js in Node**: `import * as THREE from "three"` works in Node 25 (ESM). Math (`Vector3`, `Matrix4`,
  `Quaternion`, `Euler`, `Color`, `MathUtils`), the scene graph (`Object3D`, `Group`, `Scene`, `Mesh`), `Box3`,
  `Sphere`, `Ray`, `Plane`, `BufferGeometry` and built-in geometries, `InstancedMesh` matrices, `PerspectiveCamera`
  matrices and `Raycaster` against meshes all run without a GPU. `WebGLRenderer` does not.
- **Clock is deprecated** (since r183): `new THREE.Clock()` logs `THREE.Clock: This module has been deprecated. Please use
  THREE.Timer instead.` on **stderr** (`console.warn`). Use `THREE.Timer` (`update(timestamp?)`, `getDelta()`,
  `getElapsed()`) in new content. `Timer.getDelta()` is stable within a frame (calling it twice returns the same value),
  and `update(1000); update(1016)` gives `getDelta() === 0.016`; `getElapsed()` after the first `update` is not
  deterministic, avoid printing it.
- **Floating point**: `new THREE.Vector3(3, 4, 0).normalize()` prints `0.6000000000000001,0.8,0`; raycast distances
  can print `14.499999999999998`; some results print `-0.00`. Use `.toFixed(n)` and avoid values that land on `-0`.
- **Raycasting a box through its centre** hits the diagonal shared by two triangles and returns the same object twice
  (`near:9.5,near:9.5`). Offset the ray (e.g. origin `(0.2, 0.1, 10)`) or use spheres.
- **Raycaster uses `matrixWorld`**: a mesh moved with `position` but never updated (no render, no
  `updateMatrixWorld()`) is still hit at its old place. `getWorldPosition` updates the world matrix for you.
- **Type checks** (`tsc --strict`, TS 5.9, `lib: ["es2023","dom"]`): `getContext("webgl2")` is
  `WebGL2RenderingContext | null`; `createShader` is `WebGLShader | null`; `createProgram`, `createBuffer`,
  `createTexture`, `createFramebuffer` and `createVertexArray` return non-null types; `getUniformLocation` is
  `WebGLUniformLocation | null`; `getAttribLocation` is `number`; `getShaderParameter` / `getProgramParameter` return
  `any`; `WebGLRenderingContext` (WebGL1) has no `createVertexArray`; `bufferData` rejects a plain `number[]`;
  `drawArrays("TRIANGLES", …)` is rejected (enums are numbers). A `webglcontextlost` listener on a canvas receives a
  plain `Event` (no `statusMessage`): cast to `WebGLContextEvent`.
- **@types/three** (0.186): `mesh.position = …` is `TS2540` (read-only); `material.color = 0x00ff00` is `TS2322`
  (`Color` expected); `new THREE.Euler(0, 0, 0, "ABC")` is rejected (`EulerOrder`); `MeshBasicMaterial` has no
  `roughness`; `new THREE.BufferAttribute([0, 0, 0], 3)` is rejected (typed array required, use
  `Float32BufferAttribute`); `const m: THREE.Mesh = group.children[0]` is rejected (`Object3D`).
  `mesh.rotation.y = 90` compiles (degrees are a logic bug, not a type error).

## 8. Sources

Question collections and tests:

- hyring.com, WebGL interview questions (60, three levels): https://hyring.com/jobseeker-toolkit/interview-questions/technical/webgl
- hyring.com, three.js interview questions: https://hyring.com/jobseeker-toolkit/interview-questions/technical/threejs
- lemon.io, three.js interview questions (junior/intermediate and experienced): https://lemon.io/interview-questions/three-js
- climbtheladder, 20 WebGL interview questions: https://climbtheladder.com/webgl-interview-questions/
- index.dev, WebGL interview questions: https://www.index.dev/interview-questions/webgl
- index.dev, three.js interview questions: https://www.index.dev/interview-questions/three-js
- WeLoveDevs three.js test (20 of 29 questions, about 7 min): https://adrien.welovedevs.com/app/tests/threejs
- javainuse WebGL interview questions: https://javainuse.com/misc/webgl_intvw
- Glassdoor, graphics software engineer interview questions: https://www.glassdoor.com/Interview/graphics-software-engineer-interview-questions-SRCH_KO0,26.htm

Job postings and hiring guides:

- Rise Up Labs, Senior Three.js Developer: https://riseuplabs.com/jobs/senior-threejs-developer/
- Remotive, Three.js/WebGL Developer: https://remotive.com/remote/jobs/software-dev/three-js-webgl-developer-1380347
- WeAreDevelopers, Creative WebGL Developer: https://www.wearedevelopers.com/jobs/ext/6236464/creative-webgl-developer
- hirist, Senior Graphics Engineer (WebGL/three.js): https://www.hirist.tech/j/senior-graphics-engineer-webgl-threejs-1628219
- Artisan Talent, WebGL developer job description: https://artisantalent.com/job-descriptions/webgl-developer-job-description/
- Proxify, hire three.js developers: https://proxify.io/hire-threejs-developers
- Equip, strategy to hire a WebGL developer: https://equip.co/resources/how-to-hire-webgl-developer-apscj

Official documentation and specifications:

- MDN, WebGL API: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
- MDN, WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- MDN, Matrix math for the web: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web
- MDN, WebGL model view projection: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection
- MDN, `webglcontextlost` event: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event
- MDN, `vertexAttribPointer`: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
- MDN, `blendFunc`: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
- WebGL2 Fundamentals: https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html
- WebGL2 Fundamentals, how it works: https://webgl2fundamentals.org/webgl/lessons/webgl-how-it-works.html
- WebGL2 Fundamentals, textures: https://webgl2fundamentals.org/webgl/lessons/webgl-3d-textures.html
- WebGL2 Fundamentals, instanced drawing: https://webgl2fundamentals.org/webgl/lessons/webgl-instanced-drawing.html
- WebGL2 Fundamentals, WebGL1 to WebGL2: https://webgl2fundamentals.org/webgl/lessons/webgl1-to-webgl2.html
- Khronos, WebGL 1.0 specification: https://registry.khronos.org/webgl/specs/latest/1.0/
- Khronos, WebGL 2.0 specification: https://registry.khronos.org/webgl/specs/latest/2.0/
- Khronos, GLSL ES 3.00 specification: https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf
- three.js manual, fundamentals: https://threejs.org/manual/#en/fundamentals
- three.js manual, responsive design: https://threejs.org/manual/#en/responsive
- three.js manual, scene graph: https://threejs.org/manual/#en/scenegraph
- three.js manual, how to dispose of objects: https://threejs.org/manual/en/how-to-dispose-of-objects
- three.js manual, color management: https://threejs.org/manual/#en/color-management
- three.js manual, matrix transformations: https://threejs.org/manual/#en/matrix-transformations
- three.js manual, picking: https://threejs.org/manual/#en/picking
- three.js manual, shadows: https://threejs.org/manual/#en/shadows
- three.js manual, loading a glTF file: https://threejs.org/manual/#en/load-gltf
- three.js manual, optimizing lots of objects: https://threejs.org/manual/#en/optimize-lots-of-objects
- three.js docs, Raycaster: https://threejs.org/docs/#api/en/core/Raycaster
- three.js docs, Timer: https://threejs.org/docs/#Timer
- three.js docs, InstancedMesh: https://threejs.org/docs/#api/en/objects/InstancedMesh
