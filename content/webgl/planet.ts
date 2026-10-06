import type { PlanetDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

// WebGL is a moon of Scriptara; moons reuse the PlanetDef shape.
export const webglMoon: PlanetDef = {
  name: L("Shadera", "Shadera", "シェイデラ"),
  story: L(
    "Shadera is a moon where every pixel is painted by tiny shader programs running on the GPU. Vertices fly down the pipeline and fragments glow in their wake. Trix, a cheerful triangle, shows how to feed buffers and keep the screen from going black.",
    "Shadera es una luna donde cada píxel lo pintan pequeños shaders que corren en la GPU. Los vértices bajan por el pipeline y los fragmentos brillan a su paso. Trix, un triángulo alegre, enseña a llenar buffers y evitar la pantalla negra.",
    "シェイデラは、GPU で動く小さなシェーダーがすべてのピクセルを塗る月。頂点がパイプラインを駆け、フラグメントがその跡に輝く。陽気な三角形のトリックスが、バッファの渡し方と画面を真っ黒にしないコツを教えてくれる。",
  ),
  guide: {
    name: L("Trix", "Trix", "トリックス"),
    sprite: "webgl/guide",
    title: L("Hello-triangle of the pipeline", "Triángulo guía del pipeline", "パイプラインの案内三角形"),
  },
  colors: { surface: "#2a0f24", accent: "#e8307a" },
  bugs: ["webgl/black-screen", "webgl/z-fighting", "webgl/shader-goblin"],
};
