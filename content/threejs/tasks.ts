import type { CodeTaskBeat, ExamQuestion } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Coding tasks for moon Scenara (three.js). Tasks use three's math and scene graph, which run without a
// GPU (Vector3, Matrix4, Quaternion, Object3D, Box3, Ray, InstancedMesh); WebGLRenderer is never built.
// Tests run in the player's browser (js-browser); the validator proves the solution passes, the starter
// fails and each near miss fails. Floats are printed rounded so the output is exact.

const T = 'import * as THREE from "three";\n\n';

// ─── Region boss mini projects ────────────────────────────────────────────────

/** Scene Village boss: build a centered row of posts. */
export const makeFenceTask: CodeTaskBeat = {
  slug: "make-fence",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: build a fence", "Mini proyecto: arma una cerca", "ミニ課題：柵を作る"),
  brief: L(
    "Write makeFence(count, spacing): return a THREE.Group with count children, each an Object3D named \"post-0\", \"post-1\"... in order. The posts stand on the X axis, spacing units apart, and the row is centered on 0 (y and z stay 0). Three posts 2 apart sit at x = -2, 0, 2.",
    "Escribe makeFence(count, spacing): devuelve un THREE.Group con count hijos, cada uno un Object3D llamado \"post-0\", \"post-1\"... en orden. Los postes están sobre el eje X, separados spacing unidades, y la fila queda centrada en 0 (y y z siguen en 0). Tres postes separados 2 quedan en x = -2, 0, 2.",
    "makeFence(count, spacing) を書こう。子を count 個持つ THREE.Group を返す。子は順に \"post-0\", \"post-1\"... という名前の Object3D。柱は X 軸上に spacing ずつ離れて並び、列の中心は 0（y と z は 0 のまま）。間隔 2 で 3 本なら x = -2, 0, 2。",
  ),
  starter: T + "function makeFence(count: number, spacing: number): THREE.Group {\n  const fence = new THREE.Group();\n  // your code here\n  return fence;\n}\n",
  solution: T + "function makeFence(count: number, spacing: number): THREE.Group {\n  const fence = new THREE.Group();\n  for (let i = 0; i < count; i++) {\n    const post = new THREE.Object3D();\n    post.name = `post-${i}`;\n    post.position.x = (i - (count - 1) / 2) * spacing;\n    fence.add(post);\n  }\n  return fence;\n}\n",
  nearMiss: [
    // Starts at 0 instead of centering the row.
    T + "function makeFence(count: number, spacing: number): THREE.Group {\n  const fence = new THREE.Group();\n  for (let i = 0; i < count; i++) {\n    const post = new THREE.Object3D();\n    post.name = `post-${i}`;\n    post.position.x = i * spacing;\n    fence.add(post);\n  }\n  return fence;\n}\n",
    // Centers on count / 2: off by half a gap.
    T + "function makeFence(count: number, spacing: number): THREE.Group {\n  const fence = new THREE.Group();\n  for (let i = 0; i < count; i++) {\n    const post = new THREE.Object3D();\n    post.name = `post-${i}`;\n    post.position.x = (i - count / 2) * spacing;\n    fence.add(post);\n  }\n  return fence;\n}\n",
  ],
  tests: [
    { run: 'console.log(makeFence(3, 2).children.map((c) => c.position.x).join(","));', expect: "-2,0,2" },
    { run: 'console.log(makeFence(3, 2).children.map((c) => c.name).join(","));', expect: "post-0,post-1,post-2" },
    { run: 'console.log(makeFence(4, 1).children.map((c) => c.position.x).join(","));', expect: "-1.5,-0.5,0.5,1.5", hidden: true },
    { run: 'console.log(makeFence(1, 3).children.map((c) => c.position.x).join(","));', expect: "0", hidden: true },
    { run: "console.log(makeFence(0, 5).children.length);", expect: "0", hidden: true },
  ],
  hint: L(
    "The middle of the row is post (count − 1) / 2. Measure each post's distance from it in posts, then in units.",
    "El centro de la fila es el poste (count − 1) / 2. Mide la distancia de cada poste a él en postes y luego en unidades.",
    "列の真ん中は (count − 1) / 2 番目の柱。各柱がそこから何本ぶん離れているかを出し、単位に直そう。",
  ),
  note: "recap-pose",
  explain: L(
    "x = (i − (count − 1) / 2) × spacing puts the middle post (or the gap between the two middle ones) at 0. Group.add makes each post a child.",
    "x = (i − (count − 1) / 2) × spacing deja en 0 el poste del medio (o el hueco entre los dos del medio). Group.add hace hijo a cada poste.",
    "x = (i − (count − 1) / 2) × spacing で真ん中の柱（または中央 2 本の間）が 0 になる。Group.add で各柱を子にする。",
  ),
};

/** Graph Forest boss: distance between two objects in world space. */
export const worldDistanceTask: CodeTaskBeat = {
  slug: "world-distance",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: distance in world space", "Mini proyecto: distancia en el mundo", "ミニ課題：ワールド空間の距離"),
  brief: L(
    "Write worldDistance(a, b): the distance between two Object3D in WORLD space. They can sit anywhere in the scene graph, under parents that are moved, rotated or scaled, and their world matrices may not be updated yet. Two objects at the same place give 0.",
    "Escribe worldDistance(a, b): la distancia entre dos Object3D en espacio de MUNDO. Pueden estar en cualquier parte del grafo de escena, bajo padres movidos, rotados o escalados, y sus matrices de mundo quizá aún no estén actualizadas. Dos objetos en el mismo lugar dan 0.",
    "worldDistance(a, b) を書こう。2 つの Object3D の「ワールド空間」での距離。シーングラフのどこにあってもよく、親が移動・回転・拡大されていることもあり、ワールド行列はまだ更新されていないかもしれない。同じ場所なら 0。",
  ),
  starter: T + "function worldDistance(a: THREE.Object3D, b: THREE.Object3D): number {\n  // your code here\n  return 0;\n}\n",
  solution: T + "function worldDistance(a: THREE.Object3D, b: THREE.Object3D): number {\n  const pa = a.getWorldPosition(new THREE.Vector3());\n  const pb = b.getWorldPosition(new THREE.Vector3());\n  return pa.distanceTo(pb);\n}\n",
  nearMiss: [
    // Local positions: ignores every parent.
    T + "function worldDistance(a: THREE.Object3D, b: THREE.Object3D): number {\n  return a.position.distanceTo(b.position);\n}\n",
    // Adds the parent's position by hand: misses rotation and scale.
    T + "function worldDistance(a: THREE.Object3D, b: THREE.Object3D): number {\n  const pa = a.position.clone();\n  const pb = b.position.clone();\n  if (a.parent) pa.add(a.parent.position);\n  if (b.parent) pb.add(b.parent.position);\n  return pa.distanceTo(pb);\n}\n",
  ],
  tests: [
    { run: "{\n  const scene = new THREE.Scene();\n  const a = new THREE.Object3D();\n  const b = new THREE.Object3D();\n  b.position.set(3, 4, 0);\n  scene.add(a, b);\n  console.log(worldDistance(a, b).toFixed(2));\n}", expect: "5.00" },
    { run: "{\n  const scene = new THREE.Scene();\n  const ship = new THREE.Object3D();\n  ship.position.x = 10;\n  const flag = new THREE.Object3D();\n  flag.position.x = 1;\n  ship.add(flag);\n  const buoy = new THREE.Object3D();\n  scene.add(ship, buoy);\n  console.log(worldDistance(flag, buoy).toFixed(2));\n}", expect: "11.00" },
    { run: "{\n  const scene = new THREE.Scene();\n  const giant = new THREE.Object3D();\n  giant.scale.setScalar(2);\n  const hand = new THREE.Object3D();\n  hand.position.x = 3;\n  giant.add(hand);\n  const rock = new THREE.Object3D();\n  scene.add(giant, rock);\n  console.log(worldDistance(hand, rock).toFixed(2));\n}", expect: "6.00", hidden: true },
    { run: "{\n  const scene = new THREE.Scene();\n  const arm = new THREE.Object3D();\n  arm.rotation.y = Math.PI / 2;\n  const tip = new THREE.Object3D();\n  tip.position.x = 1;\n  arm.add(tip);\n  const mark = new THREE.Object3D();\n  mark.position.z = 1;\n  scene.add(arm, mark);\n  console.log(worldDistance(tip, mark).toFixed(2));\n}", expect: "2.00", hidden: true },
    { run: "{\n  const lone = new THREE.Object3D();\n  lone.position.set(1, 2, 3);\n  console.log(worldDistance(lone, lone).toFixed(2));\n}", expect: "0.00", hidden: true },
  ],
  hint: L(
    "position is local to the parent. Which Object3D method gives you the position after every parent is applied?",
    "position es local al padre. ¿Qué método de Object3D te da la posición con todos los padres aplicados?",
    "position は親から見たローカルな値。すべての親を反映した位置をくれる Object3D のメソッドは？",
  ),
  note: "recap-graph",
  explain: L(
    "getWorldPosition updates the parent chain's matrices and reads the world translation, so rotation and scale of every parent count.",
    "getWorldPosition actualiza las matrices de la cadena de padres y lee la traslación de mundo: cuentan la rotación y la escala de cada padre.",
    "getWorldPosition は親の連なりの行列を更新してワールドの平行移動を読む。だから各親の回転とスケールも反映される。",
  ),
};

/** Loop Tower boss: move toward a target at a fixed speed, frame-rate independent. */
export const approachTask: CodeTaskBeat = {
  slug: "approach",
  kind: "code",
  mode: "ide",
  prompt: L("Mini project: chase at a steady speed", "Mini proyecto: persigue a velocidad fija", "ミニ課題：一定の速さで追いかける"),
  brief: L(
    "Write approach(current, target, speed, dt): one frame of movement. Move from current toward target by speed × dt units (speed in units per second, dt in seconds) and return the new position as a NEW Vector3. Never overshoot: if the target is closer than one step, return a copy of target. Don't modify current or target.",
    "Escribe approach(current, target, speed, dt): un frame de movimiento. Avanza de current hacia target speed × dt unidades (speed en unidades por segundo, dt en segundos) y devuelve la nueva posición como un Vector3 NUEVO. Nunca te pases: si target está a menos de un paso, devuelve una copia de target. No modifiques current ni target.",
    "approach(current, target, speed, dt) を書こう。1 フレーム分の移動。current から target へ speed × dt だけ進み（speed は毎秒の単位数、dt は秒）、新しい位置を「新しい」Vector3 で返す。行き過ぎないこと：target が 1 歩より近ければ target のコピーを返す。current も target も変えないこと。",
  ),
  starter: T + "function approach(current: THREE.Vector3, target: THREE.Vector3, speed: number, dt: number): THREE.Vector3 {\n  // your code here\n  return current;\n}\n",
  solution: T + "function approach(current: THREE.Vector3, target: THREE.Vector3, speed: number, dt: number): THREE.Vector3 {\n  const toTarget = target.clone().sub(current);\n  const step = speed * dt;\n  if (toTarget.length() <= step) return target.clone();\n  return current.clone().add(toTarget.setLength(step));\n}\n",
  nearMiss: [
    // No clamp: a big step flies past the target.
    T + "function approach(current: THREE.Vector3, target: THREE.Vector3, speed: number, dt: number): THREE.Vector3 {\n  const dir = target.clone().sub(current).normalize();\n  return current.clone().add(dir.multiplyScalar(speed * dt));\n}\n",
    // Moves the caller's vector instead of returning a new one.
    T + "function approach(current: THREE.Vector3, target: THREE.Vector3, speed: number, dt: number): THREE.Vector3 {\n  const toTarget = target.clone().sub(current);\n  const step = speed * dt;\n  if (toTarget.length() <= step) return current.copy(target);\n  return current.add(toTarget.setLength(step));\n}\n",
    // Ignores dt: the speed depends on the frame rate.
    T + "function approach(current: THREE.Vector3, target: THREE.Vector3, speed: number, dt: number): THREE.Vector3 {\n  const toTarget = target.clone().sub(current);\n  if (toTarget.length() <= speed) return target.clone();\n  return current.clone().add(toTarget.setLength(speed));\n}\n",
  ],
  tests: [
    { run: 'console.log(approach(new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 0, 0), 2, 0.5).toArray().map((n) => n.toFixed(2)).join(","));', expect: "1.00,0.00,0.00" },
    { run: 'console.log(approach(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), 10, 1).toArray().map((n) => n.toFixed(2)).join(","));', expect: "1.00,0.00,0.00" },
    { run: 'console.log(approach(new THREE.Vector3(0, 0, 0), new THREE.Vector3(3, 4, 0), 5, 0.2).toArray().map((n) => n.toFixed(2)).join(","));', expect: "0.60,0.80,0.00", hidden: true },
    { run: '{\n  const from = new THREE.Vector3(0, 0, 0);\n  approach(from, new THREE.Vector3(0, 5, 0), 1, 1);\n  console.log(from.toArray().join(","));\n}', expect: "0,0,0", hidden: true },
    { run: 'console.log(approach(new THREE.Vector3(2, 0, 0), new THREE.Vector3(5, 0, 0), 3, 0).toArray().map((n) => n.toFixed(2)).join(","));', expect: "2.00,0.00,0.00", hidden: true },
  ],
  hint: L(
    "Compare the distance left with the step size first. Clone before you add, so the caller's vector stays put.",
    "Compara primero la distancia que falta con el paso. Clona antes de sumar para no mover el vector de quien llama.",
    "まず残りの距離と 1 歩の大きさをくらべよう。足す前に clone すれば、呼び出し側のベクトルは動かない。",
  ),
  note: "recap-time",
  explain: L(
    "step = speed × dt keeps the speed the same at any frame rate. If the distance left ≤ step, snap to the target; else add the direction scaled to step.",
    "step = speed × dt mantiene la velocidad a cualquier tasa de frames. Si lo que falta ≤ step, salta al objetivo; si no, suma la dirección escalada a step.",
    "step = speed × dt ならフレームレートに関係なく同じ速さ。残りが step 以下なら target に合わせ、そうでなければ長さ step の向きを足す。",
  ),
};

// ─── Junior screening (ide) ───────────────────────────────────────────────────

export const countMeshesTask: ExamQuestion = {
  slug: "count-meshes",
  kind: "code",
  mode: "ide",
  topic: "scene_basics",
  difficulty: 1,
  prompt: L("Coding: count the meshes", "Código: cuenta las mallas", "コーディング：メッシュを数える"),
  brief: L(
    "Write countMeshes(root): how many Mesh objects are in the tree under root, at any depth, including root itself if it's a Mesh. Groups, lights and plain Object3D don't count.",
    "Escribe countMeshes(root): cuántos Mesh hay en el árbol bajo root, a cualquier profundidad, incluido root si es un Mesh. Los Group, las luces y los Object3D simples no cuentan.",
    "countMeshes(root) を書こう。root の下の木に Mesh がいくつあるか（深さは問わず、root 自身が Mesh ならそれも数える）。Group・ライト・ただの Object3D は数えない。",
  ),
  starter: T + "function countMeshes(root: THREE.Object3D): number {\n  // your code here\n  return 0;\n}\n",
  solution: T + "function countMeshes(root: THREE.Object3D): number {\n  let count = 0;\n  root.traverse((obj) => {\n    if ((obj as THREE.Mesh).isMesh) count++;\n  });\n  return count;\n}\n",
  nearMiss: [
    // Only looks at direct children.
    T + "function countMeshes(root: THREE.Object3D): number {\n  return root.children.filter((c) => (c as THREE.Mesh).isMesh).length;\n}\n",
    // Counts every object, not only meshes.
    T + "function countMeshes(root: THREE.Object3D): number {\n  let count = 0;\n  root.traverse(() => {\n    count++;\n  });\n  return count - 1;\n}\n",
  ],
  tests: [
    { run: "{\n  const scene = new THREE.Scene();\n  scene.add(new THREE.Mesh(), new THREE.Mesh());\n  console.log(countMeshes(scene));\n}", expect: "2" },
    { run: "console.log(countMeshes(new THREE.Scene()));", expect: "0" },
    { run: "{\n  const scene = new THREE.Scene();\n  const group = new THREE.Group();\n  const body = new THREE.Mesh();\n  body.add(new THREE.Mesh());\n  group.add(body);\n  scene.add(group, new THREE.Object3D());\n  console.log(countMeshes(scene));\n}", expect: "2", hidden: true },
    { run: "console.log(countMeshes(new THREE.Mesh()));", expect: "1", hidden: true },
    { run: "{\n  const scene = new THREE.Scene();\n  scene.add(new THREE.PointLight(), new THREE.Group(), new THREE.Mesh());\n  console.log(countMeshes(scene));\n}", expect: "1", hidden: true },
  ],
  explain: L(
    "traverse visits root and every descendant at any depth; count the ones whose isMesh flag is true. children alone only sees one level.",
    "traverse visita root y todos sus descendientes a cualquier profundidad; cuenta los que tienen isMesh en true. children solo ve un nivel.",
    "traverse は root とすべての子孫をたどる。isMesh が true のものを数える。children だけでは 1 段しか見えない。",
  ),
};

export const resizeCameraTask: ExamQuestion = {
  slug: "resize-camera",
  kind: "code",
  mode: "ide",
  topic: "cameras",
  difficulty: 1,
  prompt: L("Coding: handle a resize", "Código: maneja un resize", "コーディング：リサイズに対応する"),
  brief: L(
    "The canvas was resized. Write resizeCamera(camera, width, height) that updates a PerspectiveCamera so the image isn't stretched: its aspect must match the new size, and its projection matrix must reflect that. Return nothing.",
    "Cambió el tamaño del canvas. Escribe resizeCamera(camera, width, height), que actualiza una PerspectiveCamera para que la imagen no se estire: su aspect debe coincidir con el nuevo tamaño y su matriz de proyección debe reflejarlo. No devuelve nada.",
    "canvas の大きさが変わった。resizeCamera(camera, width, height) を書こう。画像が伸びないように PerspectiveCamera を更新する。aspect を新しい大きさに合わせ、投影行列にもそれを反映させる。戻り値はなし。",
  ),
  starter: T + "function resizeCamera(camera: THREE.PerspectiveCamera, width: number, height: number): void {\n  // your code here\n}\n",
  solution: T + "function resizeCamera(camera: THREE.PerspectiveCamera, width: number, height: number): void {\n  camera.aspect = width / height;\n  camera.updateProjectionMatrix();\n}\n",
  nearMiss: [
    // Sets aspect but never rebuilds the projection matrix.
    T + "function resizeCamera(camera: THREE.PerspectiveCamera, width: number, height: number): void {\n  camera.aspect = width / height;\n}\n",
    // Aspect upside down.
    T + "function resizeCamera(camera: THREE.PerspectiveCamera, width: number, height: number): void {\n  camera.aspect = height / width;\n  camera.updateProjectionMatrix();\n}\n",
  ],
  tests: [
    { run: "{\n  const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);\n  resizeCamera(cam, 1600, 900);\n  console.log(cam.aspect.toFixed(3));\n}", expect: "1.778" },
    { run: "{\n  const cam = new THREE.PerspectiveCamera(90, 1, 0.1, 100);\n  resizeCamera(cam, 800, 400);\n  console.log(cam.projectionMatrix.elements[0].toFixed(3));\n}", expect: "0.500" },
    { run: "{\n  const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);\n  resizeCamera(cam, 900, 1600);\n  console.log(cam.aspect.toFixed(3));\n}", expect: "0.563", hidden: true },
    { run: "{\n  const cam = new THREE.PerspectiveCamera(90, 2, 0.1, 100);\n  resizeCamera(cam, 1000, 1000);\n  console.log(cam.projectionMatrix.elements[0].toFixed(3));\n}", expect: "1.000", hidden: true },
  ],
  explain: L(
    "aspect = width / height, then updateProjectionMatrix(): three.js caches the matrix, so changing aspect alone does nothing on screen.",
    "aspect = width / height y luego updateProjectionMatrix(): three.js guarda la matriz, así que cambiar solo aspect no cambia nada en pantalla.",
    "aspect = width / height のあと updateProjectionMatrix()。three.js は行列を保持しているので、aspect を変えるだけでは画面は変わらない。",
  ),
};

export const placeOnCircleTask: ExamQuestion = {
  slug: "place-on-circle",
  kind: "code",
  mode: "ide",
  topic: "transforms",
  difficulty: 1,
  prompt: L("Coding: place objects on a circle", "Código: ubica objetos en un círculo", "コーディング：円の上に並べる"),
  brief: L(
    "Write placeOnCircle(count, radius): count positions (THREE.Vector3) evenly spaced on a circle of that radius in the XZ plane (y = 0), centered on the origin. The first is at (radius, 0, 0); point i is at angle i × 2π / count, with x = cos and z = sin. count 0 gives an empty array.",
    "Escribe placeOnCircle(count, radius): count posiciones (THREE.Vector3) repartidas por igual en un círculo de ese radio en el plano XZ (y = 0), centrado en el origen. La primera está en (radius, 0, 0); el punto i está en el ángulo i × 2π / count, con x = cos y z = sin. count 0 da un array vacío.",
    "placeOnCircle(count, radius) を書こう。原点中心・半径 radius の XZ 平面上の円（y = 0）に、等間隔の位置（THREE.Vector3）を count 個返す。最初は (radius, 0, 0)。点 i の角度は i × 2π / count で、x = cos、z = sin。count が 0 なら空の配列。",
  ),
  starter: T + "function placeOnCircle(count: number, radius: number): THREE.Vector3[] {\n  // your code here\n  return [];\n}\n",
  solution: T + "function placeOnCircle(count: number, radius: number): THREE.Vector3[] {\n  const points: THREE.Vector3[] = [];\n  for (let i = 0; i < count; i++) {\n    const angle = (i / count) * Math.PI * 2;\n    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));\n  }\n  return points;\n}\n",
  nearMiss: [
    // Angles in degrees passed to Math.cos.
    T + "function placeOnCircle(count: number, radius: number): THREE.Vector3[] {\n  const points: THREE.Vector3[] = [];\n  for (let i = 0; i < count; i++) {\n    const angle = (i / count) * 360;\n    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));\n  }\n  return points;\n}\n",
    // Divides by count − 1: the last point lands on the first.
    T + "function placeOnCircle(count: number, radius: number): THREE.Vector3[] {\n  const points: THREE.Vector3[] = [];\n  for (let i = 0; i < count; i++) {\n    const angle = (i / Math.max(1, count - 1)) * Math.PI * 2;\n    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));\n  }\n  return points;\n}\n",
  ],
  tests: [
    { run: 'console.log(placeOnCircle(4, 2).map((p) => p.toArray().map((n) => Math.round(n * 100) / 100).join(",")).join(" "));', expect: "2,0,0 0,0,2 -2,0,0 0,0,-2" },
    { run: 'console.log(placeOnCircle(1, 5).map((p) => p.toArray().map((n) => Math.round(n * 100) / 100).join(",")).join(" "));', expect: "5,0,0" },
    { run: "console.log(placeOnCircle(0, 3).length);", expect: "0", hidden: true },
    { run: 'console.log(placeOnCircle(2, 1).map((p) => p.toArray().map((n) => Math.round(n * 100) / 100).join(",")).join(" "));', expect: "1,0,0 -1,0,0", hidden: true },
    { run: 'console.log(placeOnCircle(3, 1).map((p) => p.toArray().map((n) => Math.round(n * 100) / 100).join(",")).join(" "));', expect: "1,0,0 -0.5,0,0.87 -0.5,0,-0.87", hidden: true },
  ],
  explain: L(
    "Math.cos and Math.sin take radians: angle = i / count × 2π. Dividing by count (not count − 1) keeps the last point from landing on the first.",
    "Math.cos y Math.sin usan radianes: angle = i / count × 2π. Dividir entre count (no count − 1) evita que el último punto caiga sobre el primero.",
    "Math.cos と Math.sin はラジアン：angle = i / count × 2π。count − 1 ではなく count で割れば、最後の点が最初と重ならない。",
  ),
};

export const colorToHexTask: ExamQuestion = {
  slug: "color-to-hex",
  kind: "code",
  mode: "ide",
  topic: "materials",
  difficulty: 1,
  prompt: L("Coding: color to a hex string", "Código: color a string hex", "コーディング：色を16進の文字列に"),
  brief: L(
    "Write colorToHex(r, g, b): channels are floats that should be 0..1 (like a material color). Clamp each to 0..1, scale to 0..255, round to the nearest integer and return \"#rrggbb\" in lower case with two digits per channel.",
    "Escribe colorToHex(r, g, b): los canales son floats que deberían estar en 0..1 (como el color de un material). Limita cada uno a 0..1, escálalo a 0..255, redondea al entero más cercano y devuelve \"#rrggbb\" en minúsculas con dos dígitos por canal.",
    "colorToHex(r, g, b) を書こう。各チャンネルは 0..1 のはずの float（マテリアルの色のように）。それぞれ 0..1 におさめ、0..255 に広げて最も近い整数に丸め、チャンネルごと 2 桁の小文字で \"#rrggbb\" を返す。",
  ),
  starter: "function colorToHex(r: number, g: number, b: number): string {\n  // your code here\n  return \"#\";\n}\n",
  solution: "function colorToHex(r: number, g: number, b: number): string {\n  const byte = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255);\n  return \"#\" + [r, g, b].map((v) => byte(v).toString(16).padStart(2, \"0\")).join(\"\");\n}\n",
  nearMiss: [
    // Small values lose their leading zero.
    "function colorToHex(r: number, g: number, b: number): string {\n  const byte = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255);\n  return \"#\" + [r, g, b].map((v) => byte(v).toString(16)).join(\"\");\n}\n",
    // No clamp: 1.5 becomes 383 (three hex digits).
    "function colorToHex(r: number, g: number, b: number): string {\n  return \"#\" + [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, \"0\")).join(\"\");\n}\n",
  ],
  tests: [
    { run: "console.log(colorToHex(1, 0.5, 0));", expect: "#ff8000" },
    { run: "console.log(colorToHex(0, 0, 0));", expect: "#000000" },
    { run: "console.log(colorToHex(0.04, 1, 0.2));", expect: "#0aff33", hidden: true },
    { run: "console.log(colorToHex(1.5, -1, 0.5));", expect: "#ff0080", hidden: true },
  ],
  explain: L(
    "Clamp, then Math.round(v × 255).toString(16).padStart(2, \"0\"): without the padding, 10 becomes \"a\" and the string gets too short.",
    "Limita y luego Math.round(v × 255).toString(16).padStart(2, \"0\"): sin el relleno, 10 queda como \"a\" y el string se acorta.",
    "おさめてから Math.round(v × 255).toString(16).padStart(2, \"0\")。0 埋めがないと 10 が \"a\" になり、文字列が短くなる。",
  ),
};

// ─── Mid screening (2 ide, 2 paper) ───────────────────────────────────────────

export const fitsInsideTask: ExamQuestion = {
  slug: "fits-inside",
  kind: "code",
  mode: "ide",
  topic: "scene_graph",
  difficulty: 2,
  prompt: L("Coding: does it fit inside?", "Código: ¿cabe adentro?", "コーディング：中に収まる？"),
  brief: L(
    "Write fitsInside(inner, outer): true if the world-space bounding box of inner (with all its children) lies completely inside the one of outer; touching the border still counts. Objects can be moved or scaled through their parents, and world matrices may not be updated yet.",
    "Escribe fitsInside(inner, outer): true si la caja envolvente en espacio de mundo de inner (con todos sus hijos) queda por completo dentro de la de outer; tocar el borde también cuenta. Los objetos pueden estar movidos o escalados por sus padres, y las matrices de mundo quizá aún no estén actualizadas.",
    "fitsInside(inner, outer) を書こう。inner（子もすべて含む）のワールド空間のバウンディングボックスが outer のものに完全に入っていれば true。境界に触れていても入っているとみなす。親を通して移動・拡大されていることがあり、ワールド行列はまだ更新されていないかもしれない。",
  ),
  starter: T + "function fitsInside(inner: THREE.Object3D, outer: THREE.Object3D): boolean {\n  // your code here\n  return true;\n}\n",
  solution: T + "function fitsInside(inner: THREE.Object3D, outer: THREE.Object3D): boolean {\n  inner.updateWorldMatrix(true, true);\n  outer.updateWorldMatrix(true, true);\n  const a = new THREE.Box3().setFromObject(inner);\n  const b = new THREE.Box3().setFromObject(outer);\n  return b.containsBox(a);\n}\n",
  nearMiss: [
    // Overlap is not the same as containment.
    T + "function fitsInside(inner: THREE.Object3D, outer: THREE.Object3D): boolean {\n  inner.updateWorldMatrix(true, true);\n  outer.updateWorldMatrix(true, true);\n  return new THREE.Box3().setFromObject(outer).intersectsBox(new THREE.Box3().setFromObject(inner));\n}\n",
    // Trusts stale world matrices: a scaled parent is ignored.
    T + "function fitsInside(inner: THREE.Object3D, outer: THREE.Object3D): boolean {\n  return new THREE.Box3().setFromObject(outer).containsBox(new THREE.Box3().setFromObject(inner));\n}\n",
  ],
  tests: [
    { run: "{\n  const big = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4));\n  const small = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));\n  console.log(fitsInside(small, big));\n}", expect: "true" },
    { run: "{\n  const big = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4));\n  const small = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));\n  small.position.x = 3;\n  console.log(fitsInside(small, big));\n}", expect: "false" },
    { run: "{\n  const big = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4));\n  const small = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));\n  small.position.x = 1.8;\n  console.log(fitsInside(small, big));\n}", expect: "false", hidden: true },
    { run: "{\n  const big = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4));\n  const giant = new THREE.Group();\n  giant.scale.setScalar(10);\n  const small = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));\n  giant.add(small);\n  console.log(fitsInside(small, big));\n}", expect: "false", hidden: true },
    { run: "{\n  const a = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));\n  const b = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));\n  console.log(fitsInside(a, b));\n}", expect: "true", hidden: true },
  ],
  explain: L(
    "Update world matrices up the parent chain first (setFromObject skips parents), then outerBox.containsBox(innerBox). intersectsBox only means overlap.",
    "Actualiza antes las matrices de los padres (setFromObject no lo hace) y usa outerBox.containsBox(innerBox). intersectsBox solo indica solapamiento.",
    "先に親の連なりのワールド行列を更新し（Box3.setFromObject は親を更新しない）、outerBox.containsBox(innerBox)。intersectsBox は重なりだけ。",
  ),
};

export const fixedStepsTask: ExamQuestion = {
  slug: "fixed-steps",
  kind: "code",
  mode: "ide",
  topic: "render_loop",
  difficulty: 2,
  prompt: L("Coding: a fixed-timestep loop", "Código: un bucle de paso fijo", "コーディング：固定ステップのループ"),
  brief: L(
    "Physics runs in fixed steps. Write fixedSteps(accumulator, dt, step), all in whole milliseconds: add this frame's dt to the leftover accumulator, then return { steps, rest }: how many whole steps to simulate now and the time left over. To avoid a spiral of death, run at most 5 steps: if more are due, return 5 and drop the rest (rest = 0).",
    "La física corre en pasos fijos. Escribe fixedSteps(accumulator, dt, step), todo en milisegundos enteros: suma el dt de este frame al acumulado que sobró y devuelve { steps, rest }: cuántos pasos enteros simular ahora y el tiempo que sobra. Para evitar la espiral de la muerte, corre como mucho 5 pasos: si tocan más, devuelve 5 y descarta el resto (rest = 0).",
    "物理は固定ステップで進む。fixedSteps(accumulator, dt, step) を書こう（すべて整数のミリ秒）。残っていた accumulator にこのフレームの dt を足し、{ steps, rest }（今シミュレートする整数のステップ数と余り時間）を返す。死のスパイラルを防ぐため、最大 5 ステップ：それ以上必要なら 5 を返し余りは捨てる（rest = 0）。",
  ),
  starter: "function fixedSteps(accumulator: number, dt: number, step: number): { steps: number; rest: number } {\n  // your code here\n  return { steps: 0, rest: 0 };\n}\n",
  solution: "function fixedSteps(accumulator: number, dt: number, step: number): { steps: number; rest: number } {\n  const total = accumulator + dt;\n  const steps = Math.floor(total / step);\n  if (steps > 5) return { steps: 5, rest: 0 };\n  return { steps, rest: total - steps * step };\n}\n",
  nearMiss: [
    // No cap: a long frame queues dozens of steps.
    "function fixedSteps(accumulator: number, dt: number, step: number): { steps: number; rest: number } {\n  const total = accumulator + dt;\n  const steps = Math.floor(total / step);\n  return { steps, rest: total - steps * step };\n}\n",
    // Forgets the leftover from the last frame.
    "function fixedSteps(accumulator: number, dt: number, step: number): { steps: number; rest: number } {\n  const steps = Math.floor(dt / step);\n  if (steps > 5) return { steps: 5, rest: 0 };\n  return { steps, rest: dt - steps * step };\n}\n",
  ],
  tests: [
    { run: "{\n  const r = fixedSteps(0, 25, 10);\n  console.log(r.steps, r.rest);\n}", expect: "2 5" },
    { run: "{\n  const r = fixedSteps(5, 5, 10);\n  console.log(r.steps, r.rest);\n}", expect: "1 0" },
    { run: "{\n  const r = fixedSteps(0, 9, 10);\n  console.log(r.steps, r.rest);\n}", expect: "0 9", hidden: true },
    { run: "{\n  const r = fixedSteps(0, 100, 10);\n  console.log(r.steps, r.rest);\n}", expect: "5 0", hidden: true },
    { run: "{\n  const r = fixedSteps(4, 48, 10);\n  console.log(r.steps, r.rest);\n}", expect: "5 2", hidden: true },
  ],
  explain: L(
    "total = accumulator + dt; steps = Math.floor(total / step); rest = total − steps × step. Capping at 5 keeps one slow frame from freezing the game.",
    "total = accumulator + dt; steps = Math.floor(total / step); rest = total − steps × step. El tope de 5 evita que un frame lento congele el juego.",
    "total = accumulator + dt、steps = floor(total / step)、rest = total − steps × step。上限 5 で遅いフレームによる停止を防ぐ。",
  ),
};

export const rotateAroundTask: ExamQuestion = {
  slug: "rotate-around",
  kind: "code",
  mode: "paper",
  topic: "rotations",
  difficulty: 2,
  prompt: L("Written test: rotate around an axis", "Prueba escrita: rota alrededor de un eje", "筆記：軸のまわりに回す"),
  brief: L(
    "Write rotateAround(point, axis, degrees): return a NEW Vector3 with point rotated around axis (through the origin) by the given angle in degrees, counter-clockwise looking down the axis (the right-hand rule, like three.js). axis may not be unit length. Don't modify point or axis.",
    "Escribe rotateAround(point, axis, degrees): devuelve un Vector3 NUEVO con point rotado alrededor de axis (que pasa por el origen) el ángulo dado en grados, antihorario mirando desde la punta del eje (regla de la mano derecha, como three.js). axis puede no ser unitario. No modifiques point ni axis.",
    "rotateAround(point, axis, degrees) を書こう。原点を通る axis のまわりに point を degrees 度回した「新しい」Vector3 を返す。向きは軸の先から見て反時計回り（three.js と同じ右手の法則）。axis は単位長とは限らない。point も axis も変えないこと。",
  ),
  starter: T + "function rotateAround(point: THREE.Vector3, axis: THREE.Vector3, degrees: number): THREE.Vector3 {\n  // your code here\n  return point;\n}\n",
  solution: T + "function rotateAround(point: THREE.Vector3, axis: THREE.Vector3, degrees: number): THREE.Vector3 {\n  const q = new THREE.Quaternion().setFromAxisAngle(axis.clone().normalize(), THREE.MathUtils.degToRad(degrees));\n  return point.clone().applyQuaternion(q);\n}\n",
  nearMiss: [
    // Passes degrees where radians are expected.
    T + "function rotateAround(point: THREE.Vector3, axis: THREE.Vector3, degrees: number): THREE.Vector3 {\n  const q = new THREE.Quaternion().setFromAxisAngle(axis.clone().normalize(), degrees);\n  return point.clone().applyQuaternion(q);\n}\n",
    // Rotates the caller's point in place.
    T + "function rotateAround(point: THREE.Vector3, axis: THREE.Vector3, degrees: number): THREE.Vector3 {\n  const q = new THREE.Quaternion().setFromAxisAngle(axis.clone().normalize(), THREE.MathUtils.degToRad(degrees));\n  return point.applyQuaternion(q);\n}\n",
    // Forgets to normalize the axis.
    T + "function rotateAround(point: THREE.Vector3, axis: THREE.Vector3, degrees: number): THREE.Vector3 {\n  const q = new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(degrees));\n  return point.clone().applyQuaternion(q);\n}\n",
  ],
  tests: [
    { run: 'console.log(rotateAround(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), 90).toArray().map((n) => Math.round(n * 100) / 100).join(","));', expect: "0,0,-1" },
    { run: 'console.log(rotateAround(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), 180).toArray().map((n) => Math.round(n * 100) / 100).join(","));', expect: "0,-1,0" },
    { run: 'console.log(rotateAround(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 5), 90).toArray().map((n) => Math.round(n * 100) / 100).join(","));', expect: "0,1,0", hidden: true },
    { run: '{\n  const p = new THREE.Vector3(1, 2, 3);\n  rotateAround(p, new THREE.Vector3(0, 1, 0), 45);\n  console.log(p.toArray().join(","));\n}', expect: "1,2,3", hidden: true },
    { run: 'console.log(rotateAround(new THREE.Vector3(2, 3, 4), new THREE.Vector3(0, 1, 0), 0).toArray().join(","));', expect: "2,3,4", hidden: true },
  ],
  explain: L(
    "Quaternion.setFromAxisAngle needs a unit axis and radians: normalize a clone and use MathUtils.degToRad. applyQuaternion mutates, so clone the point first.",
    "Quaternion.setFromAxisAngle pide un eje unitario y radianes: normaliza una copia y usa MathUtils.degToRad. applyQuaternion muta, así que clona el punto antes.",
    "setFromAxisAngle は単位長の軸とラジアンが必要：コピーを normalize し degToRad を使う。applyQuaternion は書きかえるので先に clone。",
  ),
};

export const nearestHitTask: ExamQuestion = {
  slug: "nearest-hit",
  kind: "code",
  mode: "paper",
  topic: "raycasting",
  difficulty: 2,
  prompt: L("Written test: the nearest hit", "Prueba escrita: el impacto más cercano", "筆記：いちばん近い命中"),
  brief: L(
    "Write nearestHit(origin, direction, targets): cast a ray from origin along direction (not necessarily unit length). Each target is { name, center, radius }, a sphere. Return the name of the target whose SURFACE the ray hits first, or \"none\" if it hits nothing. Spheres behind the origin don't count; the origin is never inside a sphere.",
    "Escribe nearestHit(origin, direction, targets): lanza un rayo desde origin en la dirección direction (no necesariamente unitaria). Cada target es { name, center, radius }, una esfera. Devuelve el name del target cuya SUPERFICIE toca primero el rayo, o \"none\" si no toca nada. Las esferas detrás del origen no cuentan; el origen nunca está dentro de una esfera.",
    "nearestHit(origin, direction, targets) を書こう。origin から direction（単位長とは限らない）へレイを飛ばす。各 target は球 { name, center, radius }。レイが最初に「表面」に当たる target の name を、何にも当たらなければ \"none\" を返す。origin より後ろの球は数えない。origin が球の中にあることはない。",
  ),
  starter: T + "interface Target {\n  name: string;\n  center: THREE.Vector3;\n  radius: number;\n}\n\nfunction nearestHit(origin: THREE.Vector3, direction: THREE.Vector3, targets: Target[]): string {\n  // your code here\n  return \"none\";\n}\n",
  solution: T + "interface Target {\n  name: string;\n  center: THREE.Vector3;\n  radius: number;\n}\n\nfunction nearestHit(origin: THREE.Vector3, direction: THREE.Vector3, targets: Target[]): string {\n  const ray = new THREE.Ray(origin, direction.clone().normalize());\n  let best = \"none\";\n  let bestDistance = Infinity;\n  for (const t of targets) {\n    const hit = ray.intersectSphere(new THREE.Sphere(t.center, t.radius), new THREE.Vector3());\n    if (hit && hit.distanceTo(origin) < bestDistance) {\n      bestDistance = hit.distanceTo(origin);\n      best = t.name;\n    }\n  }\n  return best;\n}\n",
  nearMiss: [
    // Ranks hit spheres by center distance, not by where the ray enters.
    T + "interface Target {\n  name: string;\n  center: THREE.Vector3;\n  radius: number;\n}\n\nfunction nearestHit(origin: THREE.Vector3, direction: THREE.Vector3, targets: Target[]): string {\n  const ray = new THREE.Ray(origin, direction.clone().normalize());\n  let best = \"none\";\n  let bestDistance = Infinity;\n  for (const t of targets) {\n    if (ray.intersectsSphere(new THREE.Sphere(t.center, t.radius)) && t.center.distanceTo(origin) < bestDistance) {\n      bestDistance = t.center.distanceTo(origin);\n      best = t.name;\n    }\n  }\n  return best;\n}\n",
    // Returns the first sphere hit in list order.
    T + "interface Target {\n  name: string;\n  center: THREE.Vector3;\n  radius: number;\n}\n\nfunction nearestHit(origin: THREE.Vector3, direction: THREE.Vector3, targets: Target[]): string {\n  const ray = new THREE.Ray(origin, direction.clone().normalize());\n  const hit = targets.find((t) => ray.intersectsSphere(new THREE.Sphere(t.center, t.radius)));\n  return hit ? hit.name : \"none\";\n}\n",
  ],
  tests: [
    { run: 'console.log(nearestHit(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1), [\n  { name: "far", center: new THREE.Vector3(0, 0, -10), radius: 1 },\n  { name: "near", center: new THREE.Vector3(0, 0, -5), radius: 1 },\n]));', expect: "near" },
    { run: 'console.log(nearestHit(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1), [\n  { name: "aside", center: new THREE.Vector3(5, 0, -10), radius: 1 },\n]));', expect: "none" },
    { run: 'console.log(nearestHit(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1), [\n  { name: "pebble", center: new THREE.Vector3(0, 0, -6), radius: 0.5 },\n  { name: "boulder", center: new THREE.Vector3(0, 0, -8), radius: 4 },\n]));', expect: "boulder", hidden: true },
    { run: 'console.log(nearestHit(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1), [\n  { name: "behind", center: new THREE.Vector3(0, 0, 5), radius: 1 },\n]));', expect: "none", hidden: true },
    { run: 'console.log(nearestHit(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -3), [\n  { name: "far", center: new THREE.Vector3(0, 0, -10), radius: 1 },\n  { name: "near", center: new THREE.Vector3(0, 0, -5), radius: 1 },\n]));', expect: "near", hidden: true },
    { run: "console.log(nearestHit(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), []));", expect: "none", hidden: true },
  ],
  explain: L(
    "Ray.intersectSphere gives the entry point (null when missed or behind). Keep the hit with the smallest distance: a big sphere can be hit before a nearer center.",
    "Ray.intersectSphere da el punto de entrada (null si falla o está detrás). Elige el más cercano: una esfera grande puede tocarse antes que otra más cercana.",
    "Ray.intersectSphere は入る点を返す（外れや後ろなら null）。距離が最小の命中を残す。大きな球は、より近い中心の球より先に当たることがある。",
  ),
};

// ─── Senior screening (1 ide, 3 paper) ────────────────────────────────────────

export const disposeTreeTask: ExamQuestion = {
  slug: "dispose-tree",
  kind: "code",
  mode: "ide",
  topic: "disposal",
  difficulty: 3,
  prompt: L("Coding: dispose a subtree", "Código: libera un subárbol", "コーディング：部分木を解放する"),
  brief: L(
    "Write disposeTree(root): before removing a level, free GPU memory. Visit root and every descendant; for each Mesh, call dispose() on its geometry and its material (material can be an array of materials). Geometries and materials can be shared between meshes: dispose each one exactly once. Return how many distinct resources you disposed.",
    "Escribe disposeTree(root): antes de quitar un nivel, libera la memoria de la GPU. Visita root y todos sus descendientes; en cada Mesh, llama a dispose() de su geometría y de su material (material puede ser un array de materiales). Geometrías y materiales pueden compartirse entre mallas: libera cada uno exactamente una vez. Devuelve cuántos recursos distintos liberaste.",
    "disposeTree(root) を書こう。レベルを消す前に GPU メモリを解放する。root とすべての子孫をたどり、各 Mesh のジオメトリとマテリアル（マテリアルの配列のこともある）の dispose() を呼ぶ。ジオメトリやマテリアルはメッシュ間で共有されうるので、それぞれちょうど 1 回だけ解放する。解放したリソースの種類数を返す。",
  ),
  starter: T + "function disposeTree(root: THREE.Object3D): number {\n  // your code here\n  return 0;\n}\n",
  solution: T + "function disposeTree(root: THREE.Object3D): number {\n  const done = new Set<THREE.BufferGeometry | THREE.Material>();\n  root.traverse((obj) => {\n    const mesh = obj as THREE.Mesh;\n    if (!mesh.isMesh) return;\n    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];\n    for (const res of [mesh.geometry, ...materials]) {\n      if (done.has(res)) continue;\n      done.add(res);\n      res.dispose();\n    }\n  });\n  return done.size;\n}\n",
  nearMiss: [
    // Disposes (and counts) shared resources once per mesh.
    T + "function disposeTree(root: THREE.Object3D): number {\n  let count = 0;\n  root.traverse((obj) => {\n    const mesh = obj as THREE.Mesh;\n    if (!mesh.isMesh) return;\n    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];\n    for (const res of [mesh.geometry, ...materials]) {\n      res.dispose();\n      count++;\n    }\n  });\n  return count;\n}\n",
    // Only direct children: nested meshes leak.
    T + "function disposeTree(root: THREE.Object3D): number {\n  const done = new Set<THREE.BufferGeometry | THREE.Material>();\n  for (const obj of root.children) {\n    const mesh = obj as THREE.Mesh;\n    if (!mesh.isMesh) continue;\n    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];\n    for (const res of [mesh.geometry, ...materials]) {\n      if (done.has(res)) continue;\n      done.add(res);\n      res.dispose();\n    }\n  }\n  return done.size;\n}\n",
  ],
  tests: [
    { run: "{\n  const geo = new THREE.BoxGeometry();\n  const scene = new THREE.Scene();\n  scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial()), new THREE.Mesh(geo, new THREE.MeshBasicMaterial()));\n  console.log(disposeTree(scene));\n}", expect: "3" },
    { run: "console.log(disposeTree(new THREE.Scene()));", expect: "0" },
    { run: '{\n  const geo = new THREE.BoxGeometry();\n  let disposed = 0;\n  geo.addEventListener("dispose", () => disposed++);\n  const scene = new THREE.Scene();\n  scene.add(new THREE.Mesh(geo), new THREE.Mesh(geo), new THREE.Mesh(geo));\n  disposeTree(scene);\n  console.log(disposed);\n}', expect: "1", hidden: true },
    { run: "{\n  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), [new THREE.MeshBasicMaterial(), new THREE.MeshBasicMaterial()]);\n  console.log(disposeTree(mesh));\n}", expect: "3", hidden: true },
    { run: "{\n  const scene = new THREE.Scene();\n  const group = new THREE.Group();\n  group.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));\n  scene.add(group);\n  console.log(disposeTree(scene));\n}", expect: "2", hidden: true },
  ],
  explain: L(
    "traverse reaches nested meshes; a Set of resources already freed makes shared geometries and materials dispose once. Handle material arrays.",
    "traverse llega a las mallas anidadas; un Set de recursos ya liberados hace que lo compartido se libere una vez. Maneja arrays de materiales.",
    "traverse で入れ子のメッシュまで届く。解放済みを Set に入れれば共有のジオメトリやマテリアルも 1 回だけ。マテリアルの配列にも対応する。",
  ),
};

export const worldToScreenTask: ExamQuestion = {
  slug: "world-to-screen",
  kind: "code",
  mode: "paper",
  topic: "cameras",
  difficulty: 3,
  prompt: L("Written test: world point to screen pixel", "Prueba escrita: de punto del mundo a píxel", "筆記：ワールドの点を画面のピクセルへ"),
  brief: L(
    "Write worldToScreen(point, camera, width, height): where a world-space point appears on a canvas of width × height pixels, as { x, y } rounded to whole pixels, origin top-left with y down. The camera may have just been moved and its matrices not updated yet. Don't modify point.",
    "Escribe worldToScreen(point, camera, width, height): dónde aparece un punto del mundo en un canvas de width × height píxeles, como { x, y } redondeado a píxeles enteros, con origen arriba a la izquierda e y hacia abajo. La cámara puede haberse movido recién y sus matrices aún no estar actualizadas. No modifiques point.",
    "worldToScreen(point, camera, width, height) を書こう。ワールド空間の点が width × height ピクセルの canvas のどこに映るかを、整数ピクセルに丸めた { x, y }（原点は左上、y は下向き）で返す。カメラは動かされたばかりで行列がまだ更新されていないかもしれない。point は変えないこと。",
  ),
  starter: T + "function worldToScreen(point: THREE.Vector3, camera: THREE.Camera, width: number, height: number): { x: number; y: number } {\n  // your code here\n  return { x: 0, y: 0 };\n}\n",
  solution: T + "function worldToScreen(point: THREE.Vector3, camera: THREE.Camera, width: number, height: number): { x: number; y: number } {\n  camera.updateMatrixWorld();\n  const ndc = point.clone().project(camera);\n  return { x: Math.round(((ndc.x + 1) / 2) * width), y: Math.round(((1 - ndc.y) / 2) * height) };\n}\n",
  nearMiss: [
    // Uses stale camera matrices.
    T + "function worldToScreen(point: THREE.Vector3, camera: THREE.Camera, width: number, height: number): { x: number; y: number } {\n  const ndc = point.clone().project(camera);\n  return { x: Math.round(((ndc.x + 1) / 2) * width), y: Math.round(((1 - ndc.y) / 2) * height) };\n}\n",
    // Forgets that screen y grows down.
    T + "function worldToScreen(point: THREE.Vector3, camera: THREE.Camera, width: number, height: number): { x: number; y: number } {\n  camera.updateMatrixWorld();\n  const ndc = point.clone().project(camera);\n  return { x: Math.round(((ndc.x + 1) / 2) * width), y: Math.round(((ndc.y + 1) / 2) * height) };\n}\n",
  ],
  tests: [
    { run: "{\n  const cam = new THREE.PerspectiveCamera(90, 2, 0.1, 100);\n  cam.position.z = 10;\n  const s = worldToScreen(new THREE.Vector3(0, 0, 0), cam, 800, 400);\n  console.log(`${s.x},${s.y}`);\n}", expect: "400,200" },
    { run: "{\n  const cam = new THREE.PerspectiveCamera(90, 2, 0.1, 100);\n  cam.position.z = 10;\n  const s = worldToScreen(new THREE.Vector3(0, 5, 0), cam, 800, 400);\n  console.log(`${s.x},${s.y}`);\n}", expect: "400,100" },
    { run: "{\n  const cam = new THREE.PerspectiveCamera(90, 2, 0.1, 100);\n  cam.position.z = 10;\n  const s = worldToScreen(new THREE.Vector3(10, 0, 0), cam, 800, 400);\n  console.log(`${s.x},${s.y}`);\n}", expect: "600,200", hidden: true },
    { run: "{\n  const cam = new THREE.PerspectiveCamera(90, 2, 0.1, 100);\n  cam.position.set(5, 0, 10);\n  const s = worldToScreen(new THREE.Vector3(5, 0, 0), cam, 800, 400);\n  console.log(`${s.x},${s.y}`);\n}", expect: "400,200", hidden: true },
    { run: '{\n  const cam = new THREE.PerspectiveCamera(90, 2, 0.1, 100);\n  cam.position.z = 10;\n  const p = new THREE.Vector3(1, 2, 3);\n  worldToScreen(p, cam, 800, 400);\n  console.log(p.toArray().join(","));\n}', expect: "1,2,3", hidden: true },
  ],
  explain: L(
    "Call camera.updateMatrixWorld() so matrixWorldInverse is fresh, project a clone to NDC, then x = (ndc.x + 1) / 2 × w and y = (1 − ndc.y) / 2 × h.",
    "Llama a camera.updateMatrixWorld() para refrescar matrixWorldInverse, proyecta una copia a NDC y luego x = (ndc.x + 1) / 2 × w e y = (1 − ndc.y) / 2 × h.",
    "updateMatrixWorld() で行列を新しくし、コピーを NDC へ project。x = (ndc.x + 1) / 2 × w、y = (1 − ndc.y) / 2 × h。",
  ),
};

export const scatterTask: ExamQuestion = {
  slug: "scatter",
  kind: "code",
  mode: "paper",
  topic: "performance",
  difficulty: 3,
  prompt: L("Written test: fill an InstancedMesh", "Prueba escrita: llena un InstancedMesh", "筆記：InstancedMesh を埋める"),
  brief: L(
    "One InstancedMesh draws a forest in a single draw call. Write scatter(mesh, positions): instance i is a plain translation to positions[i] (no rotation, scale 1). Only the first positions.length instances must be drawn (it never exceeds the capacity), and three.js must know to upload the new matrices to the GPU.",
    "Un InstancedMesh dibuja un bosque en un solo draw call. Escribe scatter(mesh, positions): la instancia i es solo una traslación a positions[i] (sin rotación, escala 1). Solo deben dibujarse las primeras positions.length instancias (nunca supera la capacidad), y three.js debe saber que tiene que subir las matrices nuevas a la GPU.",
    "InstancedMesh なら森を 1 回の描画呼び出しで描ける。scatter(mesh, positions) を書こう。インスタンス i は positions[i] への平行移動だけ（回転なし、スケール 1）。描くのは最初の positions.length 個だけ（容量を超えることはない）。新しい行列を GPU に送る必要があることを three.js に伝えること。",
  ),
  starter: T + "function scatter(mesh: THREE.InstancedMesh, positions: THREE.Vector3[]): void {\n  // your code here\n}\n",
  solution: T + "function scatter(mesh: THREE.InstancedMesh, positions: THREE.Vector3[]): void {\n  const m = new THREE.Matrix4();\n  positions.forEach((p, i) => mesh.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));\n  mesh.count = positions.length;\n  mesh.instanceMatrix.needsUpdate = true;\n}\n",
  nearMiss: [
    // Matrices change on the CPU but never reach the GPU.
    T + "function scatter(mesh: THREE.InstancedMesh, positions: THREE.Vector3[]): void {\n  const m = new THREE.Matrix4();\n  positions.forEach((p, i) => mesh.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));\n  mesh.count = positions.length;\n}\n",
    // Leaves count at the capacity: unused instances still draw.
    T + "function scatter(mesh: THREE.InstancedMesh, positions: THREE.Vector3[]): void {\n  const m = new THREE.Matrix4();\n  positions.forEach((p, i) => mesh.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));\n  mesh.instanceMatrix.needsUpdate = true;\n}\n",
  ],
  tests: [
    { run: '{\n  const trees = new THREE.InstancedMesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial(), 10);\n  scatter(trees, [new THREE.Vector3(1, 2, 3), new THREE.Vector3(4, 5, 6)]);\n  const m = new THREE.Matrix4();\n  trees.getMatrixAt(1, m);\n  console.log(new THREE.Vector3().setFromMatrixPosition(m).toArray().join(","));\n}', expect: "4,5,6" },
    { run: "{\n  const trees = new THREE.InstancedMesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial(), 10);\n  scatter(trees, [new THREE.Vector3(1, 2, 3), new THREE.Vector3(4, 5, 6)]);\n  console.log(trees.count);\n}", expect: "2" },
    { run: "{\n  const trees = new THREE.InstancedMesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial(), 4);\n  scatter(trees, [new THREE.Vector3(0, 1, 0)]);\n  console.log(trees.instanceMatrix.version > 0);\n}", expect: "true", hidden: true },
    { run: "{\n  const trees = new THREE.InstancedMesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial(), 4);\n  scatter(trees, []);\n  console.log(trees.count);\n}", expect: "0", hidden: true },
    { run: '{\n  const trees = new THREE.InstancedMesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial(), 3);\n  scatter(trees, [new THREE.Vector3(7, 0, -2)]);\n  const m = new THREE.Matrix4();\n  trees.getMatrixAt(0, m);\n  console.log(m.elements.join(","));\n}', expect: "1,0,0,0,0,1,0,0,0,0,1,0,7,0,-2,1", hidden: true },
  ],
  explain: L(
    "setMatrixAt(i, makeTranslation(...)) per instance, count = positions.length, and instanceMatrix.needsUpdate = true, or the GPU keeps the old matrices.",
    "setMatrixAt(i, makeTranslation(...)) por instancia, count = positions.length e instanceMatrix.needsUpdate = true, o la GPU se queda con las matrices viejas.",
    "各インスタンスに setMatrixAt(i, makeTranslation(...))、count を設定し needsUpdate = true。忘れると GPU は古いまま。",
  ),
};

export const lerpAngleTask: ExamQuestion = {
  slug: "lerp-angle",
  kind: "code",
  mode: "paper",
  topic: "rotations",
  difficulty: 3,
  prompt: L("Written test: turn the short way", "Prueba escrita: gira por el lado corto", "筆記：近いほうへ回る"),
  brief: L(
    "Write lerpAngle(a, b, t): a and b are headings in degrees (0 ≤ angle < 360) and t is 0..1. Interpolate from a toward b along the SHORTEST arc, and return the result in [0, 360). When a and b are exactly opposite, turn in the positive direction. lerpAngle(350, 10, 0.5) is 0, not 180.",
    "Escribe lerpAngle(a, b, t): a y b son rumbos en grados (0 ≤ ángulo < 360) y t va de 0 a 1. Interpola de a hacia b por el arco MÁS CORTO y devuelve el resultado en [0, 360). Si a y b son exactamente opuestos, gira en sentido positivo. lerpAngle(350, 10, 0.5) es 0, no 180.",
    "lerpAngle(a, b, t) を書こう。a と b は度で表した向き（0 ≤ 角度 < 360）、t は 0..1。a から b へ「近いほうの弧」で補間し、結果を [0, 360) で返す。a と b がちょうど反対なら正の向きに回る。lerpAngle(350, 10, 0.5) は 180 ではなく 0。",
  ),
  starter: "function lerpAngle(a: number, b: number, t: number): number {\n  // your code here\n  return a;\n}\n",
  solution: "function lerpAngle(a: number, b: number, t: number): number {\n  let diff = ((((b - a) % 360) + 540) % 360) - 180;\n  if (diff === -180) diff = 180;\n  return (((a + diff * t) % 360) + 360) % 360;\n}\n",
  nearMiss: [
    // Plain lerp: goes the long way around.
    "function lerpAngle(a: number, b: number, t: number): number {\n  return a + (b - a) * t;\n}\n",
    // Shortest arc, but the result leaves 0..360.
    "function lerpAngle(a: number, b: number, t: number): number {\n  let diff = ((((b - a) % 360) + 540) % 360) - 180;\n  if (diff === -180) diff = 180;\n  return a + diff * t;\n}\n",
  ],
  tests: [
    { run: "console.log(lerpAngle(0, 90, 0.5));", expect: "45" },
    { run: "console.log(lerpAngle(350, 10, 0.5));", expect: "0" },
    { run: "console.log(lerpAngle(10, 350, 0.25));", expect: "5", hidden: true },
    { run: "console.log(lerpAngle(10, 340, 0.5));", expect: "355", hidden: true },
    { run: "console.log(lerpAngle(90, 270, 0.5));", expect: "180", hidden: true },
    { run: "console.log(lerpAngle(200, 100, 1));", expect: "100", hidden: true },
  ],
  explain: L(
    "Wrap the difference into -180..180 first, so 350 → 10 is +20, not -340. Then wrap the result back into 0..360 with ((x % 360) + 360) % 360.",
    "Primero lleva la diferencia a -180..180, así 350 → 10 es +20 y no -340. Luego devuelve el resultado a 0..360 con ((x % 360) + 360) % 360.",
    "まず差を -180..180 におさめる。350 → 10 は -340 ではなく +20。結果は ((x % 360) + 360) % 360 で 0..360 に戻す。",
  ),
};

export const juniorTasks: ExamQuestion[] = [countMeshesTask, resizeCameraTask, placeOnCircleTask, colorToHexTask];
export const midTasks: ExamQuestion[] = [fitsInsideTask, fixedStepsTask, rotateAroundTask, nearestHitTask];
export const seniorTasks: ExamQuestion[] = [disposeTreeTask, worldToScreenTask, scatterTask, lerpAngleTask];
