import { connection } from "next/server";
import { GalaxyClient } from "@/components/galaxy/GalaxyClient";
import { getLanguages, getWorldContent } from "@/lib/repo";

export default async function GalaxyPage() {
  await connection();
  const all = getLanguages().map((language) => ({
    language,
    lessonSlugs: getWorldContent(language.slug)?.regions.flatMap((r) => r.lessons.map((l) => l.slug)) ?? [],
  }));
  // Planets are top-level packs; moons (frameworks) are listed under their planet.
  const planets = all.filter((p) => !p.language.parent).map((p) => ({ ...p, moons: all.filter((m) => m.language.parent === p.language.slug) }));
  return <GalaxyClient planets={planets} />;
}
