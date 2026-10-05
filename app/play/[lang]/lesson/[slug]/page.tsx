import { notFound } from "next/navigation";
import { connection } from "next/server";
import { LessonClient } from "@/components/game/LessonClient";
import { getLessonPlay, getWorldContent } from "@/lib/repo";

export default async function LessonPage({ params }: PageProps<"/play/[lang]/lesson/[slug]">) {
  await connection();
  const { lang, slug } = await params;
  const play = getLessonPlay(lang, slug);
  const content = getWorldContent(lang);
  if (!play || !content) notFound();
  return <LessonClient play={play} world={{ regions: content.regions }} />;
}
