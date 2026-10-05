import type { LanguagePack } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";
import { reactMoon } from "./planet.ts";

// Moon Reactia: React, a framework moon of planet Scriptara (TS/JS). Exercises are TSX.
export const react: LanguagePack = {
  slug: "react",
  parent: "typescript",
  name: "REACT",
  tagline: L("Components, state and hooks", "Componentes, estado y hooks", "コンポーネント・状態・フック"),
  color: "#61dafb",
  status: "soon",
  runner: "js-browser",
  codeLang: "tsx",
  planet: reactMoon,
  regions: [],
  topics: {},
  exams: [],
};
