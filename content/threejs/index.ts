import type { LanguagePack } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { sceneVillage } from "./regions/scene-village.ts";
import { graphForest } from "./regions/graph-forest.ts";
import { loopTower } from "./regions/loop-tower.ts";
import { exams } from "./exams.ts";
import { topics } from "./topics.ts";
import { threejsMoon } from "./planet.ts";

// Moon Scenara: three.js, a moon of planet Scriptara (TS/JS). Exercises use three's math and scene graph, which run without a GPU.
export const threejs: LanguagePack = {
  slug: "threejs",
  parent: "typescript",
  name: "THREE.JS",
  tagline: L("Scenes, cameras and meshes", "Escenas, cámaras y mallas", "シーン・カメラ・メッシュ"),
  color: "#7ee05a",
  status: "active",
  runner: "js-browser",
  codeLang: "ts",
  planet: threejsMoon,
  regions: [sceneVillage, graphForest, loopTower],
  topics,
  exams,
};
