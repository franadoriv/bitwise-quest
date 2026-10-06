import type { ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Written-test formats for moon Scenara (three.js): trace tables (dry-run the code, fill the values) and
// debugging tasks (tap the buggy line, then fix it). Everything uses three's math and scene graph, which
// run without a GPU; WebGLRenderer is never built. The validator runs every `verify` and proves each fix
// passes the tests while the buggy code and the near misses fail.

const code = (...lines: string[]) => lines.join("\n");
const T = 'import * as THREE from "three";\n\n';
/** Test helper: prints a vector with 2 decimals and no "-0.00". */
const F = "const f = (v: THREE.Vector3) => v.toArray().map((n) => (Math.abs(n) < 1e-9 ? 0 : n).toFixed(2)).join(\",\");\n";

// ─── Junior: trace tables ─────────────────────────────────────────────────────

/** Junior trace: a child's world position follows its parent. */
export const parentWorldTrace: ExamQuestion = {
  kind: "trace",
  topic: "scene_graph",
  difficulty: 1,
  prompt: L("Trace table: a child follows its parent", "Tabla de traza: el hijo sigue al padre", "トレース：子は親についていく"),
  brief: L(
    "One row per getWorldPosition call (lines 7, 9 and 11).",
    "Una fila por cada llamada a getWorldPosition (líneas 7, 9 y 11).",
    "getWorldPosition の呼び出しごとに1行（7・9・11行目）。",
  ),
  code: code(
    'import * as THREE from "three";',
    "const ship = new THREE.Object3D();",
    "const flag = new THREE.Object3D();",
    "ship.add(flag);",
    "const world = new THREE.Vector3();",
    "ship.position.x = 10; flag.position.x = 2;",
    "flag.getWorldPosition(world);",
    "ship.position.x += 5;",
    "flag.getWorldPosition(world);",
    "ship.scale.x = 2;",
    "flag.getWorldPosition(world);",
  ),
  columns: ["ship.position.x", "flag.position.x", "world.x"],
  rows: [
    { label: L("line 7", "línea 7", "7行目"), cells: ["10", "2", "12"], given: [0] },
    { label: L("line 9", "línea 9", "9行目"), cells: ["15", "2", "17"] },
    { label: L("line 11", "línea 11", "11行目"), cells: ["15", "2", "19"] },
  ],
  verify: code(
    'import * as THREE from "three";',
    "const ship = new THREE.Object3D();",
    "const flag = new THREE.Object3D();",
    "ship.add(flag);",
    "const world = new THREE.Vector3();",
    "ship.position.x = 10; flag.position.x = 2;",
    "flag.getWorldPosition(world);",
    "console.log(`${ship.position.x} | ${flag.position.x} | ${world.x}`);",
    "ship.position.x += 5;",
    "flag.getWorldPosition(world);",
    "console.log(`${ship.position.x} | ${flag.position.x} | ${world.x}`);",
    "ship.scale.x = 2;",
    "flag.getWorldPosition(world);",
    "console.log(`${ship.position.x} | ${flag.position.x} | ${world.x}`);",
  ),
  explain: L(
    "flag.position is local and never changes. Its world x is the parent's x plus the local x times the parent's scale: 15 + 2 × 2 = 19.",
    "flag.position es local y nunca cambia. Su x de mundo es la x del padre más la x local por la escala del padre: 15 + 2 × 2 = 19.",
    "flag.position はローカルで変わらない。ワールド x は親の x + ローカル x × 親のスケール：15 + 2 × 2 = 19。",
  ),
};

/** Junior trace: assignment shares a vector, clone copies it. */
export const sharedVectorTrace: ExamQuestion = {
  kind: "trace",
  topic: "vectors",
  difficulty: 1,
  prompt: L("Trace table: shared vector or clone?", "Tabla de traza: ¿vector compartido o clon?", "トレース：共有か clone か"),
  brief: L(
    "One row after each of lines 5, 6 and 7.",
    "Una fila después de cada una de las líneas 5, 6 y 7.",
    "5・6・7行目それぞれの後に1行。",
  ),
  code: code(
    'import * as THREE from "three";',
    "const a = new THREE.Vector3(1, 2, 0);",
    "const b = a;",
    "const c = a.clone();",
    "b.x = 5;",
    "c.add(a);",
    "a.multiplyScalar(2);",
  ),
  columns: ["a.x", "b.x", "c.x"],
  rows: [
    { label: L("after line 5", "tras la línea 5", "5行目の後"), cells: ["5", "5", "1"] },
    { label: L("after line 6", "tras la línea 6", "6行目の後"), cells: ["5", "5", "6"] },
    { label: L("after line 7", "tras la línea 7", "7行目の後"), cells: ["10", "10", "6"] },
  ],
  verify: code(
    'import * as THREE from "three";',
    "const a = new THREE.Vector3(1, 2, 0);",
    "const b = a;",
    "const c = a.clone();",
    "b.x = 5;",
    "console.log(`${a.x} | ${b.x} | ${c.x}`);",
    "c.add(a);",
    "console.log(`${a.x} | ${b.x} | ${c.x}`);",
    "a.multiplyScalar(2);",
    "console.log(`${a.x} | ${b.x} | ${c.x}`);",
  ),
  explain: L(
    "b = a copies the reference, so a and b are one vector. clone() made c a separate copy, and add and multiplyScalar mutate in place.",
    "b = a copia la referencia: a y b son el mismo vector. clone() hizo de c una copia aparte, y add y multiplyScalar mutan en el sitio.",
    "b = a は参照のコピーで a と b は同じベクトル。clone() の c は別物。add と multiplyScalar はその場で書き換える。",
  ),
};

// ─── Mid: trace tables ────────────────────────────────────────────────────────

/** Mid trace: delta-time movement with a clamped step. */
export const deltaTimeTrace: ExamQuestion = {
  kind: "trace",
  topic: "render_loop",
  difficulty: 2,
  prompt: L("Trace table: movement with delta time", "Tabla de traza: movimiento con delta time", "トレース：デルタタイムで移動"),
  brief: L(
    "One row per frame. Write pos.x with 3 decimals, as toFixed(3).",
    "Una fila por frame. Escribe pos.x con 3 decimales, como toFixed(3).",
    "1行が1フレーム。pos.x は toFixed(3) と同じく小数3桁。",
  ),
  code: code(
    'import * as THREE from "three";',
    "const pos = new THREE.Vector3();",
    "const dir = new THREE.Vector3(1, 0, 0);",
    "const speed = 4; // units per second",
    "for (const dt of [0.016, 0.5, 0.025]) {",
    "  const step = THREE.MathUtils.clamp(dt, 0, 0.1);",
    "  pos.addScaledVector(dir, speed * step);",
    "}",
  ),
  columns: ["dt", "step", "pos.x"],
  rows: [
    { label: L("frame 1", "frame 1", "1フレーム目"), cells: ["0.016", "0.016", "0.064"], given: [0] },
    { label: L("frame 2", "frame 2", "2フレーム目"), cells: ["0.5", "0.1", "0.464"], given: [0] },
    { label: L("frame 3", "frame 3", "3フレーム目"), cells: ["0.025", "0.025", "0.564"], given: [0] },
  ],
  verify: code(
    'import * as THREE from "three";',
    "const pos = new THREE.Vector3();",
    "const dir = new THREE.Vector3(1, 0, 0);",
    "const speed = 4; // units per second",
    "for (const dt of [0.016, 0.5, 0.025]) {",
    "  const step = THREE.MathUtils.clamp(dt, 0, 0.1);",
    "  pos.addScaledVector(dir, speed * step);",
    "  console.log(`${dt} | ${step} | ${pos.x.toFixed(3)}`);",
    "}",
  ),
  explain: L(
    "Each frame moves speed × step. The 0.5 s hitch is clamped to 0.1, so it moves 0.4 instead of jumping 2 units.",
    "Cada frame avanza speed × step. El tirón de 0.5 s se limita a 0.1, así que avanza 0.4 en vez de saltar 2 unidades.",
    "毎フレーム speed × step 進む。0.5 秒のカクつきは 0.1 に制限され、2 ではなく 0.4 だけ進む。",
  ),
};

/** Mid trace: applying the same quaternion step again and again. */
export const quaternionStepTrace: ExamQuestion = {
  kind: "trace",
  topic: "rotations",
  difficulty: 2,
  prompt: L("Trace table: quarter turns with a quaternion", "Tabla de traza: cuartos de vuelta con cuaternión", "トレース：クォータニオンで90°ずつ"),
  brief: L(
    "One row per pass. Round to whole numbers (0, 1 or -1).",
    "Una fila por vuelta. Redondea a enteros (0, 1 o -1).",
    "1行が1周。整数（0、1、-1）に丸める。",
  ),
  code: code(
    'import * as THREE from "three";',
    "const up = new THREE.Vector3(0, 1, 0);",
    "const q = new THREE.Quaternion().setFromAxisAngle(up, Math.PI / 2);",
    "const v = new THREE.Vector3(1, 0, 0);",
    "for (let i = 1; i <= 3; i++) {",
    "  v.applyQuaternion(q);",
    "}",
  ),
  columns: ["i", "v.x", "v.z"],
  rows: [
    { label: L("pass 1", "vuelta 1", "1周目"), cells: ["1", "0", "-1"], given: [0] },
    { label: L("pass 2", "vuelta 2", "2周目"), cells: ["2", "-1", "0"], given: [0] },
    { label: L("pass 3", "vuelta 3", "3周目"), cells: ["3", "0", "1"], given: [0] },
  ],
  verify: code(
    'import * as THREE from "three";',
    "const up = new THREE.Vector3(0, 1, 0);",
    "const q = new THREE.Quaternion().setFromAxisAngle(up, Math.PI / 2);",
    "const v = new THREE.Vector3(1, 0, 0);",
    "const r = (n: number) => Math.round(n) + 0;",
    "for (let i = 1; i <= 3; i++) {",
    "  v.applyQuaternion(q);",
    "  console.log(`${i} | ${r(v.x)} | ${r(v.z)}`);",
    "}",
  ),
  explain: L(
    "A positive turn about +Y goes counterclockwise seen from above: +X → -Z → -X → +Z. Each pass adds another 90°.",
    "Un giro positivo sobre +Y va antihorario visto desde arriba: +X → -Z → -X → +Z. Cada vuelta suma otros 90°.",
    "+Y 軸まわりの正の回転は上から見て反時計回り：+X → -Z → -X → +Z。毎周さらに 90° 回る。",
  ),
};

// ─── Mid: debugging tasks ─────────────────────────────────────────────────────

/** Mid debug: a centroid that mutates the caller's first point. */
export const centroidDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "vectors",
  difficulty: 2,
  prompt: L("Debug: the centroid of some points", "Depura: el centroide de unos puntos", "デバッグ：点の重心"),
  brief: L(
    "centroid(points) should return the average of the points without changing them. The first call looks right, but afterwards points[0] has moved: with points (2,0,0) and (4,0,0), centroid returns x 3.00 and points[0].x becomes 3.",
    "centroid(points) debería devolver el promedio de los puntos sin modificarlos. La primera llamada parece correcta, pero después points[0] se movió: con (2,0,0) y (4,0,0), centroid devuelve x 3.00 y points[0].x pasa a 3.",
    "centroid(points) は点を変えずに平均を返すはず。1回目は正しく見えるが、その後 points[0] が動く：(2,0,0) と (4,0,0) で x 3.00 を返し、points[0].x が 3 になる。",
  ),
  code: T + code(
    "function centroid(points: THREE.Vector3[]): THREE.Vector3 {",
    "  const sum = points[0];",
    "  for (let i = 1; i < points.length; i++) sum.add(points[i]);",
    "  return sum.divideScalar(points.length);",
    "}",
  ),
  bugLine: 4,
  solution: T + code(
    "function centroid(points: THREE.Vector3[]): THREE.Vector3 {",
    "  const sum = points[0].clone();",
    "  for (let i = 1; i < points.length; i++) sum.add(points[i]);",
    "  return sum.divideScalar(points.length);",
    "}",
  ),
  nearMiss: [
    // Starts from a fresh vector but still skips index 0.
    T + code(
      "function centroid(points: THREE.Vector3[]): THREE.Vector3 {",
      "  const sum = new THREE.Vector3();",
      "  for (let i = 1; i < points.length; i++) sum.add(points[i]);",
      "  return sum.divideScalar(points.length);",
      "}",
    ),
    // Clones only the result: the input was already mutated by add.
    T + code(
      "function centroid(points: THREE.Vector3[]): THREE.Vector3 {",
      "  const sum = points[0];",
      "  for (let i = 1; i < points.length; i++) sum.add(points[i]);",
      "  return sum.clone().divideScalar(points.length);",
      "}",
    ),
  ],
  tests: [
    { run: "{\n  const pts = [new THREE.Vector3(2, 0, 0), new THREE.Vector3(4, 0, 0)];\n  const c = centroid(pts);\n  console.log(c.x.toFixed(2), pts[0].x);\n}", expect: "3.00 2" },
    { run: "{\n  const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(3, 6, 9)];\n  console.log(centroid(pts).toArray().map((n) => n.toFixed(2)).join(\",\"));\n}", expect: "1.50,3.00,4.50" },
    { run: "{\n  const pts = [new THREE.Vector3(1, 1, 0), new THREE.Vector3(3, 1, 0), new THREE.Vector3(2, 4, 0)];\n  centroid(pts);\n  console.log(centroid(pts).toArray().map((n) => n.toFixed(2)).join(\",\"));\n}", expect: "2.00,2.00,0.00", hidden: true },
    { run: "{\n  const p = new THREE.Vector3(5, 5, 5);\n  const c = centroid([p]);\n  console.log(c === p, p.x);\n}", expect: "false 5", hidden: true },
    { run: "{\n  const pts = [new THREE.Vector3(-2, 0, 0), new THREE.Vector3(2, 0, 0)];\n  centroid(pts);\n  console.log(pts.map((v) => v.x).join(\",\"));\n}", expect: "-2,2", hidden: true },
  ],
  explain: L(
    "sum = points[0] is the caller's vector, and add mutates it. clone() gives a private copy, so the points stay untouched.",
    "sum = points[0] es el vector del llamador y add lo muta. clone() da una copia propia y los puntos quedan intactos.",
    "sum = points[0] は呼び出し側のベクトルで add が書き換える。clone() で専用コピーを作れば点はそのまま。",
  ),
};

/** Mid debug: degrees assigned to a rotation in radians. */
export const degreesDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "transforms",
  difficulty: 2,
  prompt: L("Debug: turn an arrow by degrees", "Depura: girar una flecha en grados", "デバッグ：矢印を度数で回す"),
  brief: L(
    "arrowTip(degrees) turns an arrow about Y and returns where its tip (local (1, 0, 0)) ends up in the world. arrowTip(0) gives 1.00,0.00,0.00, but arrowTip(90) gives -0.45,0.00,-0.89 instead of 0.00,0.00,-1.00.",
    "arrowTip(degrees) gira una flecha sobre Y y devuelve dónde queda su punta (local (1, 0, 0)) en el mundo. arrowTip(0) da 1.00,0.00,0.00, pero arrowTip(90) da -0.45,0.00,-0.89 en vez de 0.00,0.00,-1.00.",
    "arrowTip(degrees) は矢印を Y 軸まわりに回し、先端（ローカル (1, 0, 0)）のワールド位置を返す。arrowTip(0) は 1.00,0.00,0.00 だが arrowTip(90) が 0.00,0.00,-1.00 でなく -0.45,0.00,-0.89 になる。",
  ),
  code: T + code(
    "function arrowTip(degrees: number): THREE.Vector3 {",
    "  const arrow = new THREE.Object3D();",
    "  arrow.rotation.y = degrees;",
    "  arrow.updateMatrixWorld();",
    "  return new THREE.Vector3(1, 0, 0).applyMatrix4(arrow.matrixWorld);",
    "}",
  ),
  bugLine: 5,
  solution: T + code(
    "function arrowTip(degrees: number): THREE.Vector3 {",
    "  const arrow = new THREE.Object3D();",
    "  arrow.rotation.y = THREE.MathUtils.degToRad(degrees);",
    "  arrow.updateMatrixWorld();",
    "  return new THREE.Vector3(1, 0, 0).applyMatrix4(arrow.matrixWorld);",
    "}",
  ),
  nearMiss: [
    // Converts the wrong way round.
    T + code(
      "function arrowTip(degrees: number): THREE.Vector3 {",
      "  const arrow = new THREE.Object3D();",
      "  arrow.rotation.y = THREE.MathUtils.radToDeg(degrees);",
      "  arrow.updateMatrixWorld();",
      "  return new THREE.Vector3(1, 0, 0).applyMatrix4(arrow.matrixWorld);",
      "}",
    ),
    // Divides by 180 but forgets π.
    T + code(
      "function arrowTip(degrees: number): THREE.Vector3 {",
      "  const arrow = new THREE.Object3D();",
      "  arrow.rotation.y = degrees / 180;",
      "  arrow.updateMatrixWorld();",
      "  return new THREE.Vector3(1, 0, 0).applyMatrix4(arrow.matrixWorld);",
      "}",
    ),
  ],
  tests: [
    { run: "{\n  " + F + "  console.log(f(arrowTip(90)));\n}", expect: "0.00,0.00,-1.00" },
    { run: "{\n  " + F + "  console.log(f(arrowTip(0)));\n}", expect: "1.00,0.00,0.00" },
    { run: "{\n  " + F + "  console.log(f(arrowTip(180)));\n}", expect: "-1.00,0.00,0.00", hidden: true },
    { run: "{\n  " + F + "  console.log(f(arrowTip(-90)));\n}", expect: "0.00,0.00,1.00", hidden: true },
    { run: "{\n  " + F + "  console.log(f(arrowTip(360)));\n}", expect: "1.00,0.00,0.00", hidden: true },
  ],
  explain: L(
    "Euler angles in three.js are radians, so 90 meant 90 rad (about 14 turns plus 57°). degToRad turns 90° into π/2.",
    "Los ángulos Euler de three.js son radianes: 90 era 90 rad (unas 14 vueltas y 57°). degToRad convierte 90° en π/2.",
    "three.js のオイラー角はラジアン。90 は 90 rad（約14周と57°）だった。degToRad で 90° を π/2 にする。",
  ),
};

// ─── Senior: trace table ──────────────────────────────────────────────────────

/** Senior trace: matrixWorld is a cache that only some calls refresh. */
export const staleMatrixTrace: ExamQuestion = {
  kind: "trace",
  topic: "scene_graph",
  difficulty: 3,
  prompt: L("Trace table: a stale matrixWorld", "Tabla de traza: un matrixWorld desactualizado", "トレース：古い matrixWorld"),
  brief: L(
    "read() takes x from child.matrixWorld as it is now. In each row, read() runs first, then getWorldPosition.",
    "read() toma la x de child.matrixWorld tal como está. En cada fila corre primero read() y luego getWorldPosition.",
    "read() は今の child.matrixWorld から x を読む。各行は read() が先、次に getWorldPosition。",
  ),
  code: code(
    'import * as THREE from "three";',
    "const parent = new THREE.Object3D();",
    "const child = new THREE.Object3D();",
    "parent.add(child);",
    "child.position.x = 1; parent.position.x = 10;",
    "parent.updateMatrixWorld();",
    "const read = () => new THREE.Vector3().setFromMatrixPosition(child.matrixWorld).x;",
    "const world = () => child.getWorldPosition(new THREE.Vector3()).x;",
    "// start: read(), world()",
    "parent.position.x = 20;  // row 2: read(), world()",
    "parent.scale.setScalar(2); // row 3: read(), world()",
  ),
  columns: ["read()", "world()"],
  rows: [
    { label: L("at the start", "al inicio", "最初"), cells: ["11", "11"] },
    { label: L("after x = 20", "tras x = 20", "x = 20 の後"), cells: ["11", "21"] },
    { label: L("after scale 2", "tras escala 2", "スケール2の後"), cells: ["21", "22"] },
  ],
  verify: code(
    'import * as THREE from "three";',
    "const parent = new THREE.Object3D();",
    "const child = new THREE.Object3D();",
    "parent.add(child);",
    "child.position.x = 1; parent.position.x = 10;",
    "parent.updateMatrixWorld();",
    "const read = () => new THREE.Vector3().setFromMatrixPosition(child.matrixWorld).x;",
    "const world = () => child.getWorldPosition(new THREE.Vector3()).x;",
    "const row = () => { const r = read(); const w = world(); console.log(`${r} | ${w}`); };",
    "row();",
    "parent.position.x = 20;",
    "row();",
    "parent.scale.setScalar(2);",
    "row();",
  ),
  explain: L(
    "Setting position doesn't touch matrixWorld; read() sees the old value until something updates it. getWorldPosition updates the parents first.",
    "Cambiar position no toca matrixWorld: read() ve el valor viejo hasta que algo lo actualiza. getWorldPosition actualiza antes a los padres.",
    "position を変えても matrixWorld は変わらず、read() は更新されるまで古い値。getWorldPosition は先に親から更新する。",
  ),
};

// ─── Senior: debugging tasks ──────────────────────────────────────────────────

/** Senior debug (ide): a follow camera reading a stale matrixWorld. */
export const followCameraDebug: ExamQuestion = {
  kind: "debug",
  mode: "ide",
  topic: "scene_graph",
  difficulty: 3,
  prompt: L("Debug: a camera that follows a rider", "Depura: una cámara que sigue a un jinete", "デバッグ：乗り手を追うカメラ"),
  brief: L(
    "makeRig() puts a rider 1 unit along x inside a moving rig. tick(rig, dt) moves the rig 2 units per second along x and returns the camera, which must sit at the rider's world position plus (0, 2, 5) and look at it. After tick(rig, 1) the camera x should be 3.00, but it is 0.00.",
    "makeRig() pone un jinete a 1 unidad en x dentro de un rig que se mueve. tick(rig, dt) mueve el rig 2 unidades por segundo en x y devuelve la cámara, que debe quedar en la posición de mundo del jinete más (0, 2, 5) mirándolo. Tras tick(rig, 1) la x de la cámara debería ser 3.00, pero es 0.00.",
    "makeRig() は動く rig の中、x に1離れた位置に rider を置く。tick(rig, dt) は rig を x 方向に毎秒2動かし、rider のワールド位置 + (0, 2, 5) にいて rider を見るカメラを返す。tick(rig, 1) の後カメラ x は 3.00 のはずが 0.00。",
  ),
  code: T + code(
    "type Rig = { root: THREE.Object3D; rider: THREE.Object3D; camera: THREE.PerspectiveCamera };",
    "",
    "function makeRig(): Rig {",
    "  const root = new THREE.Object3D();",
    "  const rider = new THREE.Object3D();",
    "  rider.position.x = 1;",
    "  root.add(rider);",
    "  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);",
    "  return { root, rider, camera };",
    "}",
    "",
    "const OFFSET = new THREE.Vector3(0, 2, 5);",
    "",
    "function tick(rig: Rig, dt: number): THREE.PerspectiveCamera {",
    "  rig.root.position.x += 2 * dt;",
    "  const target = new THREE.Vector3().setFromMatrixPosition(rig.rider.matrixWorld);",
    "  rig.camera.position.copy(target).add(OFFSET);",
    "  rig.camera.lookAt(target);",
    "  return rig.camera;",
    "}",
  ),
  bugLine: 18,
  solution: T + code(
    "type Rig = { root: THREE.Object3D; rider: THREE.Object3D; camera: THREE.PerspectiveCamera };",
    "",
    "function makeRig(): Rig {",
    "  const root = new THREE.Object3D();",
    "  const rider = new THREE.Object3D();",
    "  rider.position.x = 1;",
    "  root.add(rider);",
    "  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);",
    "  return { root, rider, camera };",
    "}",
    "",
    "const OFFSET = new THREE.Vector3(0, 2, 5);",
    "",
    "function tick(rig: Rig, dt: number): THREE.PerspectiveCamera {",
    "  rig.root.position.x += 2 * dt;",
    "  const target = rig.rider.getWorldPosition(new THREE.Vector3());",
    "  rig.camera.position.copy(target).add(OFFSET);",
    "  rig.camera.lookAt(target);",
    "  return rig.camera;",
    "}",
  ),
  nearMiss: [
    // updateMatrixWorld goes down the tree, not up: the root's matrixWorld is still stale.
    T + code(
      "type Rig = { root: THREE.Object3D; rider: THREE.Object3D; camera: THREE.PerspectiveCamera };",
      "",
      "function makeRig(): Rig {",
      "  const root = new THREE.Object3D();",
      "  const rider = new THREE.Object3D();",
      "  rider.position.x = 1;",
      "  root.add(rider);",
      "  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);",
      "  return { root, rider, camera };",
      "}",
      "",
      "const OFFSET = new THREE.Vector3(0, 2, 5);",
      "",
      "function tick(rig: Rig, dt: number): THREE.PerspectiveCamera {",
      "  rig.root.position.x += 2 * dt;",
      "  rig.rider.updateMatrixWorld();",
      "  const target = new THREE.Vector3().setFromMatrixPosition(rig.rider.matrixWorld);",
      "  rig.camera.position.copy(target).add(OFFSET);",
      "  rig.camera.lookAt(target);",
      "  return rig.camera;",
      "}",
    ),
    // Uses the local position: right until the rig moves.
    T + code(
      "type Rig = { root: THREE.Object3D; rider: THREE.Object3D; camera: THREE.PerspectiveCamera };",
      "",
      "function makeRig(): Rig {",
      "  const root = new THREE.Object3D();",
      "  const rider = new THREE.Object3D();",
      "  rider.position.x = 1;",
      "  root.add(rider);",
      "  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 100);",
      "  return { root, rider, camera };",
      "}",
      "",
      "const OFFSET = new THREE.Vector3(0, 2, 5);",
      "",
      "function tick(rig: Rig, dt: number): THREE.PerspectiveCamera {",
      "  rig.root.position.x += 2 * dt;",
      "  const target = rig.rider.position.clone();",
      "  rig.camera.position.copy(target).add(OFFSET);",
      "  rig.camera.lookAt(target);",
      "  return rig.camera;",
      "}",
    ),
  ],
  tests: [
    { run: "{\n  const rig = makeRig();\n  console.log(tick(rig, 1).position.x.toFixed(2));\n}", expect: "3.00" },
    { run: "{\n  const rig = makeRig();\n  console.log(tick(rig, 0).position.toArray().map((n) => n.toFixed(2)).join(\",\"));\n}", expect: "1.00,2.00,5.00" },
    { run: "{\n  const rig = makeRig();\n  tick(rig, 0.5);\n  tick(rig, 0.5);\n  console.log(tick(rig, 1).position.x.toFixed(2));\n}", expect: "5.00", hidden: true },
    { run: "{\n  const rig = makeRig();\n  rig.root.rotation.y = Math.PI;\n  rig.root.updateMatrixWorld();\n  console.log(tick(rig, 0).position.x.toFixed(2));\n}", expect: "-1.00", hidden: true },
    { run: "{\n  const rig = makeRig();\n  const cam = tick(rig, 2);\n  const dir = cam.getWorldDirection(new THREE.Vector3());\n  console.log(cam.position.x.toFixed(2), dir.z.toFixed(2));\n}", expect: "5.00 -0.93", hidden: true },
  ],
  explain: L(
    "matrixWorld is only refreshed by an update or a render, so it lagged the rig. getWorldPosition updates the parents first, then reads.",
    "matrixWorld solo se refresca con un update o un render, así que iba detrás del rig. getWorldPosition actualiza a los padres y luego lee.",
    "matrixWorld は update か描画でしか更新されず rig に遅れていた。getWorldPosition は親から更新してから読む。",
  ),
};

/** Senior debug (paper): removing children while iterating the same array. */
export const clearLevelDebug: ExamQuestion = {
  kind: "debug",
  mode: "paper",
  topic: "disposal",
  difficulty: 3,
  prompt: L("Debug: clearing and disposing a level", "Depura: vaciar y liberar un nivel", "デバッグ：レベルの片付けと解放"),
  brief: L(
    "clearLevel(level) should remove every child of level, dispose each geometry and material once (they can be shared) and return how many it disposed. A level with 3 meshes sharing one geometry should return 4 and end empty, but it returns 3 and one mesh is still attached.",
    "clearLevel(level) debería quitar todos los hijos de level, liberar cada geometría y material una sola vez (pueden ser compartidos) y devolver cuántos liberó. Un nivel con 3 mallas que comparten una geometría debería devolver 4 y quedar vacío, pero devuelve 3 y queda una malla.",
    "clearLevel(level) は level の子を全部外し、ジオメトリとマテリアルを1回ずつ（共有あり）dispose して数を返すはず。ジオメトリを共有する3メッシュなら 4 を返し空になるはずが、3 を返し1つ残る。",
  ),
  code: T + code(
    "function clearLevel(level: THREE.Object3D): number {",
    "  const disposed = new Set<THREE.BufferGeometry | THREE.Material>();",
    "  for (const child of level.children) {",
    "    level.remove(child);",
    "    if (!(child instanceof THREE.Mesh)) continue;",
    "    const materials: THREE.Material[] = Array.isArray(child.material) ? child.material : [child.material];",
    "    for (const res of [child.geometry as THREE.BufferGeometry, ...materials]) {",
    "      if (disposed.has(res)) continue;",
    "      disposed.add(res);",
    "      res.dispose();",
    "    }",
    "  }",
    "  return disposed.size;",
    "}",
  ),
  bugLine: 5,
  solution: T + code(
    "function clearLevel(level: THREE.Object3D): number {",
    "  const disposed = new Set<THREE.BufferGeometry | THREE.Material>();",
    "  for (const child of [...level.children]) {",
    "    level.remove(child);",
    "    if (!(child instanceof THREE.Mesh)) continue;",
    "    const materials: THREE.Material[] = Array.isArray(child.material) ? child.material : [child.material];",
    "    for (const res of [child.geometry as THREE.BufferGeometry, ...materials]) {",
    "      if (disposed.has(res)) continue;",
    "      disposed.add(res);",
    "      res.dispose();",
    "    }",
    "  }",
    "  return disposed.size;",
    "}",
  ),
  nearMiss: [
    // An index loop over the live array skips exactly the same children.
    T + code(
      "function clearLevel(level: THREE.Object3D): number {",
      "  const disposed = new Set<THREE.BufferGeometry | THREE.Material>();",
      "  for (let i = 0; i < level.children.length; i++) {",
      "    const child = level.children[i];",
      "    level.remove(child);",
      "    if (!(child instanceof THREE.Mesh)) continue;",
      "    const materials: THREE.Material[] = Array.isArray(child.material) ? child.material : [child.material];",
      "    for (const res of [child.geometry as THREE.BufferGeometry, ...materials]) {",
      "      if (disposed.has(res)) continue;",
      "      disposed.add(res);",
      "      res.dispose();",
      "    }",
      "  }",
      "  return disposed.size;",
      "}",
    ),
    // Copies the list but disposes shared resources once per mesh.
    T + code(
      "function clearLevel(level: THREE.Object3D): number {",
      "  let disposed = 0;",
      "  for (const child of [...level.children]) {",
      "    level.remove(child);",
      "    if (!(child instanceof THREE.Mesh)) continue;",
      "    const materials: THREE.Material[] = Array.isArray(child.material) ? child.material : [child.material];",
      "    for (const res of [child.geometry as THREE.BufferGeometry, ...materials]) {",
      "      disposed++;",
      "      res.dispose();",
      "    }",
      "  }",
      "  return disposed;",
      "}",
    ),
  ],
  tests: [
    { run: "{\n  const level = new THREE.Object3D();\n  const box = new THREE.BoxGeometry();\n  for (let i = 0; i < 3; i++) level.add(new THREE.Mesh(box, new THREE.MeshBasicMaterial()));\n  console.log(clearLevel(level), level.children.length);\n}", expect: "4 0" },
    { run: "{\n  const level = new THREE.Object3D();\n  level.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));\n  console.log(clearLevel(level), level.children.length);\n}", expect: "2 0" },
    { run: "{\n  const level = new THREE.Object3D();\n  const mat = new THREE.MeshBasicMaterial();\n  level.add(new THREE.Object3D(), new THREE.Mesh(new THREE.BoxGeometry(), mat), new THREE.Mesh(new THREE.BoxGeometry(), mat), new THREE.Object3D());\n  console.log(clearLevel(level), level.children.length);\n}", expect: "3 0", hidden: true },
    { run: "{\n  const level = new THREE.Object3D();\n  const geo = new THREE.BoxGeometry();\n  let events = 0;\n  geo.addEventListener(\"dispose\", () => events++);\n  level.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial()), new THREE.Mesh(geo, new THREE.MeshBasicMaterial()));\n  clearLevel(level);\n  console.log(events, level.children.length);\n}", expect: "1 0", hidden: true },
    { run: "{\n  const level = new THREE.Object3D();\n  console.log(clearLevel(level), level.children.length);\n}", expect: "0 0", hidden: true },
  ],
  explain: L(
    "remove() splices level.children while for...of walks it, so every other child was skipped. Iterating a copy visits them all.",
    "remove() hace splice de level.children mientras for...of lo recorre, así que se saltaba uno de cada dos. Recorrer una copia los visita todos.",
    "for...of で回している level.children を remove() が splice するので1つおきに飛ばされた。コピーを回せば全部回る。",
  ),
};

/** Senior debug (paper): a fixed-timestep loop that integrates with the frame time. */
export const fixedStepDebug: ExamQuestion = {
  kind: "debug",
  mode: "paper",
  topic: "render_loop",
  difficulty: 3,
  prompt: L("Debug: a fixed-timestep physics loop", "Depura: un bucle de física con paso fijo", "デバッグ：固定ステップの物理ループ"),
  brief: L(
    "advance(world, dt) runs physics in fixed steps of 0.25 s: it adds the frame time (clamped to 1 s) to an accumulator and runs one step per whole 0.25 s, keeping the remainder. With velocity (2, 0, 0), advance(world, 0.5) should run 2 steps and reach x 1.00, but x is 2.00.",
    "advance(world, dt) corre la física en pasos fijos de 0.25 s: suma el tiempo del frame (limitado a 1 s) a un acumulador y hace un paso por cada 0.25 s completo, guardando el resto. Con velocidad (2, 0, 0), advance(world, 0.5) debería dar 2 pasos y llegar a x 1.00, pero x es 2.00.",
    "advance(world, dt) は 0.25 秒の固定ステップで物理を進める：フレーム時間（最大1秒）を累積し、0.25 秒ごとに1ステップ、余りは残す。速度 (2, 0, 0) で advance(world, 0.5) は2ステップで x 1.00 のはずが 2.00 になる。",
  ),
  code: T + code(
    "const STEP = 0.25;",
    "",
    "type World = { acc: number; steps: number; pos: THREE.Vector3; vel: THREE.Vector3 };",
    "",
    "function makeWorld(vx: number): World {",
    "  return { acc: 0, steps: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3(vx, 0, 0) };",
    "}",
    "",
    "function advance(world: World, dt: number): void {",
    "  world.acc += Math.min(dt, 1); // avoid the spiral of death",
    "  while (world.acc >= STEP) {",
    "    world.pos.addScaledVector(world.vel, dt);",
    "    world.steps++;",
    "    world.acc -= STEP;",
    "  }",
    "}",
  ),
  bugLine: 14,
  solution: T + code(
    "const STEP = 0.25;",
    "",
    "type World = { acc: number; steps: number; pos: THREE.Vector3; vel: THREE.Vector3 };",
    "",
    "function makeWorld(vx: number): World {",
    "  return { acc: 0, steps: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3(vx, 0, 0) };",
    "}",
    "",
    "function advance(world: World, dt: number): void {",
    "  world.acc += Math.min(dt, 1); // avoid the spiral of death",
    "  while (world.acc >= STEP) {",
    "    world.pos.addScaledVector(world.vel, STEP);",
    "    world.steps++;",
    "    world.acc -= STEP;",
    "  }",
    "}",
  ),
  nearMiss: [
    // Integrates with what is left in the accumulator, not the step.
    T + code(
      "const STEP = 0.25;",
      "",
      "type World = { acc: number; steps: number; pos: THREE.Vector3; vel: THREE.Vector3 };",
      "",
      "function makeWorld(vx: number): World {",
      "  return { acc: 0, steps: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3(vx, 0, 0) };",
      "}",
      "",
      "function advance(world: World, dt: number): void {",
      "  world.acc += Math.min(dt, 1); // avoid the spiral of death",
      "  while (world.acc >= STEP) {",
      "    world.pos.addScaledVector(world.vel, world.acc);",
      "    world.steps++;",
      "    world.acc -= STEP;",
      "  }",
      "}",
    ),
    // Uses the step, but drops the leftover time instead of keeping it.
    T + code(
      "const STEP = 0.25;",
      "",
      "type World = { acc: number; steps: number; pos: THREE.Vector3; vel: THREE.Vector3 };",
      "",
      "function makeWorld(vx: number): World {",
      "  return { acc: 0, steps: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3(vx, 0, 0) };",
      "}",
      "",
      "function advance(world: World, dt: number): void {",
      "  world.acc += Math.min(dt, 1); // avoid the spiral of death",
      "  while (world.acc >= STEP) {",
      "    world.pos.addScaledVector(world.vel, STEP);",
      "    world.steps++;",
      "    world.acc -= STEP;",
      "  }",
      "  world.acc = 0;",
      "}",
    ),
  ],
  tests: [
    { run: "{\n  const w = makeWorld(2);\n  advance(w, 0.5);\n  console.log(w.steps, w.pos.x.toFixed(2));\n}", expect: "2 1.00" },
    { run: "{\n  const w = makeWorld(2);\n  advance(w, 0.1);\n  console.log(w.steps, w.pos.x.toFixed(2));\n}", expect: "0 0.00" },
    { run: "{\n  const w = makeWorld(2);\n  advance(w, 0.1);\n  advance(w, 0.1);\n  advance(w, 0.1);\n  console.log(w.steps, w.pos.x.toFixed(2));\n}", expect: "1 0.50", hidden: true },
    { run: "{\n  const w = makeWorld(2);\n  advance(w, 5);\n  console.log(w.steps, w.pos.x.toFixed(2));\n}", expect: "4 2.00", hidden: true },
    { run: "{\n  const w = makeWorld(-4);\n  advance(w, 0.3);\n  advance(w, 0.3);\n  console.log(w.steps, w.pos.x.toFixed(2));\n}", expect: "2 -2.00", hidden: true },
  ],
  explain: L(
    "Each fixed step must advance by STEP. Scaling by the frame's dt moved the world dt for every step, too far whenever a frame ran more than one.",
    "Cada paso fijo debe avanzar STEP. Escalar por el dt del frame movía dt en cada paso, de más cuando un frame hacía más de uno.",
    "固定ステップは STEP ずつ進むべき。フレームの dt を使うと毎ステップ dt 進み、1フレームで複数回だと進みすぎる。",
  ),
};

export const juniorTraceDebug: ExamQuestion[] = [parentWorldTrace, sharedVectorTrace];
export const midTraceDebug: ExamQuestion[] = [deltaTimeTrace, quaternionStepTrace, centroidDebug, degreesDebug];
export const seniorTraceDebug: ExamQuestion[] = [staleMatrixTrace, followCameraDebug, clearLevelDebug, fixedStepDebug];
