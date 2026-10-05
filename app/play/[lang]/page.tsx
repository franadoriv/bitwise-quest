import { notFound } from "next/navigation";
import { connection } from "next/server";
import { WorldClient } from "@/components/world/WorldClient";
import { getWorld } from "@/lib/repo";

export default async function WorldPage({ params }: PageProps<"/play/[lang]">) {
  await connection();
  const { lang } = await params;
  const world = getWorld(lang);
  if (!world || world.language.status !== "active") notFound();
  return <WorldClient world={world} />;
}
