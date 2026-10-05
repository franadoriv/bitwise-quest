import { notFound } from "next/navigation";
import { connection } from "next/server";
import { WorldClient } from "@/components/world/WorldClient";
import { getWorldContent } from "@/lib/repo";

export default async function WorldPage({ params }: PageProps<"/play/[lang]">) {
  await connection();
  const { lang } = await params;
  const content = getWorldContent(lang);
  if (!content || content.language.status !== "active") notFound();
  return <WorldClient content={content} />;
}
