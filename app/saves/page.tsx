import { Suspense } from "react";
import { connection } from "next/server";
import { MemoryCard } from "@/components/save/MemoryCard";
import { getLanguages } from "@/lib/repo";

export default async function SavesPage() {
  await connection();
  const planets = getLanguages().map((l) => ({ slug: l.slug, name: l.planet.name, guideSprite: l.planet.guide.sprite, color: l.color }));
  return (
    <Suspense>
      <MemoryCard planets={planets} />
    </Suspense>
  );
}
