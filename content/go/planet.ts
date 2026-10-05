import type { PlanetDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

export const planet: PlanetDef = {
  name: L("Concurra", "Concurra", "コンカーラ"),
  story: L(
    "Concurra is a honeycomb of tunnels where thousands of goroutines carry messages through channels. When a channel waits forever, deadlocks freeze whole districts and nil voids swallow data. Gopi, a cheerful digger, keeps the tunnels simple and flowing.",
    "Concurra es un panal de túneles donde miles de goroutines llevan mensajes por canales. Si un canal espera para siempre, los deadlocks congelan barrios enteros y los vacíos nil se tragan los datos. Gopi, un alegre cavador, deja los túneles simples y fluidos.",
    "コンカーラはトンネルがはりめぐらされた星。無数の goroutine がチャネルでメッセージを運んでいる。チャネルが永遠に待たされると、デッドロックが街を凍らせ、nil の穴がデータをのみこむ。陽気な穴掘りのゴピが、トンネルをシンプルに保っている。",
  ),
  guide: { name: L("Gopi", "Gopi", "ゴピ"), sprite: "go/gopi", title: L("Cheerful tunnel digger", "Alegre cavador de túneles", "陽気なトンネル掘り") },
  colors: { surface: "#2f8fd0", accent: "#9fe3f0" },
  moons: 3,
  bugs: ["go/nil-blob", "go/deadlock-snail", "go/race-twins"],
};
