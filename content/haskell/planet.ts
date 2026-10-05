import type { PlanetDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

export const planet: PlanetDef = {
  name: L("Lambdara", "Lambdara", "ラムダラ"),
  story: L(
    "Lambdara floats in pure, calm skies where nothing changes once made, and every value lazily waits until someone needs it. But forgotten thunks pile into towers and partial functions tear holes in the air. Lambo, a wise old owl, guides you with types and λ.",
    "Lambdara flota en cielos puros donde nada cambia una vez creado y cada valor espera con pereza a que alguien lo necesite. Pero los thunks olvidados se apilan en torres y las funciones parciales rasgan el aire. Lambo, un búho sabio, te guía con tipos y λ.",
    "ラムダラは、一度作られたものが変わらない純粋な空に浮かぶ星。値はだれかに必要とされるまでのんびり待っている。でも忘れられたサンクは塔のように積み上がり、部分関数が空に穴をあける。賢いフクロウのランボが、型と λ で導いてくれる。",
  ),
  guide: { name: L("Lambo", "Lambo", "ランボ"), sprite: "haskell/lambo", title: L("Wise owl of pure functions", "Búho sabio de funciones puras", "純粋関数の賢いフクロウ") },
  colors: { surface: "#5e4b8b", accent: "#c8b6ff", ring: "#8a6fd1" },
  moons: 2,
  bugs: ["haskell/thunk-pile", "haskell/bottom-wraith", "haskell/partial-moth"],
};
