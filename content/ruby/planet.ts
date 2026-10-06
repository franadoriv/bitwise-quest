import type { PlanetDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

export const rubyPlanet: PlanetDef = {
  name: L("Rubion", "Rubión", "ルビオン"),
  story: L(
    "Rubion is a jewel world cut for programmer happiness, where everything, even a number, is an object that answers messages. Its gems sparkle until a nil ghost or a meddling imp slips in. Kira, a gem-hearted fox, shows travelers the joyful way.",
    "Rubión es un mundo joya tallado para la felicidad de quien programa, donde todo, hasta un número, es un objeto que responde mensajes. Sus gemas brillan hasta que se cuela un fantasma nil o un diablillo. Kira, una zorra de corazón de gema, guía con alegría.",
    "ルビオンはプログラマーの幸せのために磨かれた宝石の星。数でさえ、すべてがメッセージに答えるオブジェクトだ。nil の幽霊やいたずら小鬼が忍びこむまで、宝石は輝きつづける。宝石の心をもつキツネのキラが、楽しい道を教えてくれる。",
  ),
  guide: {
    name: L("Kira", "Kira", "キラ"),
    sprite: "ruby/guide",
    title: L("Gem-hearted fox of happy code", "Zorra de gema del código feliz", "楽しいコードの宝石ギツネ"),
  },
  colors: { surface: "#a3122e", accent: "#ff5c7a", ring: "#f4b6c2" },
  moons: 1,
  bugs: ["ruby/nil-ghost", "ruby/hash-mimic", "ruby/monkey-imp", "ruby/frozen-cube"],
};
