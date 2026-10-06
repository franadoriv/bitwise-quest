import type { LanguagePack } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { pipelineVillage } from "./regions/pipeline-village.ts";
import { bufferForest } from "./regions/buffer-forest.ts";
import { matrixMountain } from "./regions/matrix-mountain.ts";
import { exams } from "./exams.ts";
import { topics } from "./topics.ts";
import { webglMoon } from "./planet.ts";

// Moon Shadera: WebGL, a moon of planet Scriptara (TS/JS). Runnable exercises are pure logic (no GPU in the runner); API usage is type-checked.
export const webgl: LanguagePack = {
  slug: "webgl",
  parent: "typescript",
  name: "WEBGL",
  tagline: L("Paint pixels with the GPU", "Pinta píxeles con la GPU", "GPU でピクセルを描く"),
  color: "#e8307a",
  status: "active",
  runner: "js-browser",
  codeLang: "ts",
  planet: webglMoon,
  regions: [pipelineVillage, bufferForest, matrixMountain],
  topics,
  exams,
};
