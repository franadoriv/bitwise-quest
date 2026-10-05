import { connection } from "next/server";
import { GalaxyClient } from "@/components/galaxy/GalaxyClient";
import { getLanguages, getWorldContent } from "@/lib/repo";

export default async function GalaxyPage() {
  await connection();
  const planets = getLanguages().map((language) => ({
    language,
    lessonSlugs: getWorldContent(language.slug)?.regions.flatMap((r) => r.lessons.map((l) => l.slug)) ?? [],
  }));
  return <GalaxyClient planets={planets} />;
}
