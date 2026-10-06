import type { PlanetDef } from "../../lib/content/types.ts";
import { L } from "../../lib/i18n/text.ts";

export const pythonPlanet: PlanetDef = {
  name: L("Serpentia", "Serpentia", "サーペンティア"),
  story: L(
    "Serpentia is a garden world where paths follow indentation and every rule reads like plain English. One stray space topples whole terraces, and None ghosts drift between the hedges. Pippa, a gentle coil snake, shows travelers the one obvious way.",
    "Serpentia es un mundo jardín donde los senderos siguen la indentación y cada regla se lee como inglés sencillo. Un espacio de más derrumba terrazas enteras y los fantasmas None vagan entre los setos. Pippa, una serpiente amable, muestra el camino obvio.",
    "サーペンティアは、インデントが道をつくり、すべての決まりが平易な英語のように読める庭園の星。空白ひとつで段々畑がくずれ、None の幽霊が生け垣をただよう。やさしいヘビのピッパが、ただ一つの明らかな道を教えてくれる。",
  ),
  guide: {
    name: L("Pippa", "Pippa", "ピッパ"),
    sprite: "python/guide",
    title: L("Gentle snake of readable code", "Amable serpiente del código claro", "読みやすいコードのやさしいヘビ"),
  },
  colors: { surface: "#3f8a4e", accent: "#ffd43b", ring: "#b8e08c" },
  moons: 1,
  bugs: ["python/indent-gremlin", "python/mutable-mimic", "python/none-ghost", "python/keyerror-key"],
};
