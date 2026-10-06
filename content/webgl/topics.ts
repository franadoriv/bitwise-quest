import type { TopicDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// Exam topic ids (docs/research/webgl-threejs-curriculum.md, "Entry exams" > "WebGL moon"). `region` links a
// topic to the region that teaches it; topics without a region count toward the score but skip nothing.
export const topics: Record<string, TopicDef> = {
  pipeline: { name: L("The rendering pipeline", "El pipeline de renderizado", "描画パイプライン"), region: "pipeline-village" },
  clip_space: { name: L("Clip space, NDC and the viewport", "Clip space, NDC y el viewport", "クリップ空間・NDC・ビューポート"), region: "pipeline-village" },
  state_machine: { name: L("Contexts and the GPU state machine", "Contextos y la máquina de estados", "コンテキストと GPU の状態機械"), region: "pipeline-village" },
  shaders_glsl: { name: L("Shaders, GLSL ES, compile and link", "Shaders, GLSL ES, compilar y enlazar", "シェーダー・GLSL・コンパイルとリンク"), region: "pipeline-village" },
  buffers: { name: L("Typed arrays and buffers", "Typed arrays y buffers", "型付き配列とバッファ"), region: "buffer-forest" },
  attributes: { name: L("Attributes, stride, offset and VAOs", "Atributos, stride, offset y VAOs", "属性・stride・offset・VAO"), region: "buffer-forest" },
  drawing: { name: L("drawArrays, drawElements and indices", "drawArrays, drawElements e índices", "描画呼び出しとインデックス"), region: "buffer-forest" },
  textures: { name: L("Textures, UVs, filtering and mipmaps", "Texturas, UVs, filtrado y mipmaps", "テクスチャ・UV・フィルタ・ミップマップ"), region: "buffer-forest" },
  matrices: { name: L("Matrices and transforms", "Matrices y transformaciones", "行列と変換"), region: "matrix-mountain" },
  depth_blending: { name: L("Projection, depth and blending", "Proyección, profundidad y blending", "投影・深度・ブレンド"), region: "matrix-mountain" },
  lighting: { name: L("Normals and lighting", "Normales e iluminación", "法線とライティング"), region: "matrix-mountain" },
  framebuffers: { name: L("Framebuffers and render-to-texture", "Framebuffers y render a textura", "フレームバッファとテクスチャ描画"), region: "matrix-mountain" },
  performance: { name: L("Draw calls, state and instancing", "Draw calls, estados e instancing", "ドローコール・状態変更・インスタンス"), region: "matrix-mountain" },
  context_loss: { name: L("Context loss and restoration", "Pérdida y restauración del contexto", "コンテキストの消失と復元"), region: "matrix-mountain" },
  webgl2_differences: { name: L("WebGL1 vs WebGL2", "WebGL1 vs WebGL2", "WebGL1 と WebGL2 の違い") },
  debugging: { name: L("Errors, blocking calls and debugging", "Errores, bloqueos y depuración", "エラー・ブロッキング呼び出し・デバッグ") },
};
