import type { PlanetDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

export const cppPlanet: PlanetDef = {
  name: L("Velocis", "Velocis", "ヴェロシス"),
  story: L(
    "Velocis is a forge world of blinding speed, where builders shape raw memory by hand. One stray pointer cracks the ground into segfault rifts, and forgotten allocations ooze through the vents. Vecta, a swift steel knight, never trades control for speed.",
    "Velocis es un mundo forja de velocidad cegadora, donde se moldea la memoria a mano. Un puntero perdido abre grietas de segfault y las reservas olvidadas rezuman por las rendijas. Vecta, un veloz caballero de acero, nunca cambia control por rapidez.",
    "ヴェロシスは目にもとまらぬ速さの鍛冶の星。職人たちはメモリを手で直接きたえる。迷子のポインタ一つで大地に segfault の裂け目が走り、忘れられた確保が通気口からにじみ出す。俊足の鋼の騎士ヴェクタは、速さのために制御を手放さない。",
  ),
  guide: {
    name: L("Vecta", "Vecta", "ヴェクタ"),
    sprite: "cpp/guide",
    title: L("Swift steel knight of control", "Veloz caballero del control", "制御をつかさどる俊足の騎士"),
  },
  colors: { surface: "#1f5fa8", accent: "#7fc8ff", ring: "#c0d8f0" },
  moons: 2,
  bugs: ["cpp/segfault-skull", "cpp/dangling-wraith", "cpp/leak-slime", "cpp/ub-imp"],
};
