import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { LessonClient } from "@/components/game/LessonClient";
import { getLessonPlay, isLessonUnlocked } from "@/lib/repo";

export default async function LessonPage({ params }: PageProps<"/play/[lang]/lesson/[slug]">) {
  await connection();
  const { lang, slug } = await params;
  const play = getLessonPlay(lang, slug);
  if (!play) notFound();
  if (!isLessonUnlocked(lang, slug)) redirect(`/play/${lang}`);
  return <LessonClient play={play} />;
}
