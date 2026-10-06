import type { TopicDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Exam topic ids (docs/research/webgl-threejs-curriculum.md, "Entry exams" → three.js moon). `region` links a topic
// to the region that teaches it; topics without a region count toward the score but skip nothing.
export const topics: Record<string, TopicDef> = {
  scene_basics: { name: L("Scene, camera and renderer", "Escena, cámara y renderer", "シーン・カメラ・レンダラー"), region: "scene-village" },
  cameras: { name: L("Cameras, projection and resize", "Cámaras, proyección y resize", "カメラ・投影・リサイズ"), region: "scene-village" },
  materials: { name: L("Geometries, materials and colour", "Geometrías, materiales y color", "ジオメトリ・マテリアル・色"), region: "scene-village" },
  transforms: { name: L("Object3D position, rotation, scale", "Posición, rotación y escala", "位置・回転・スケール"), region: "scene-village" },
  scene_graph: { name: L("Scene graph, local and world space", "Grafo de escena, local y mundo", "シーングラフとローカル・ワールド"), region: "graph-forest" },
  vectors: { name: L("Vector math", "Matemática de vectores", "ベクトル計算"), region: "graph-forest" },
  rotations: { name: L("Matrices, quaternions and Euler", "Matrices, cuaterniones y Euler", "行列・クォータニオン・オイラー角"), region: "graph-forest" },
  render_loop: { name: L("Render loop and delta time", "Bucle de render y delta time", "描画ループとデルタタイム"), region: "loop-tower" },
  raycasting: { name: L("Raycasting and picking", "Raycasting y selección", "レイキャストと選択"), region: "loop-tower" },
  assets_color: { name: L("Loaders, textures, colour spaces", "Loaders, texturas y color", "ローダー・テクスチャ・色空間"), region: "loop-tower" },
  lights_shadows: { name: L("Lights and shadows", "Luces y sombras", "ライトと影"), region: "loop-tower" },
  disposal: { name: L("Disposing resources and memory", "Liberar recursos y memoria", "リソース解放とメモリ"), region: "loop-tower" },
  performance: { name: L("Draw calls, instancing and LOD", "Draw calls, instancing y LOD", "ドローコール・インスタンス・LOD"), region: "loop-tower" },
  shaders: { name: L("ShaderMaterial and custom shaders", "ShaderMaterial y shaders propios", "ShaderMaterial と自作シェーダー") },
  ecosystem: { name: L("Controls, R3F, post-processing", "Controles, R3F y postproceso", "コントロール・R3F・ポストエフェクト") },
  webgl_under_hood: { name: L("What the renderer does in WebGL", "Lo que hace el renderer en WebGL", "レンダラーが WebGL で行うこと") },
};
