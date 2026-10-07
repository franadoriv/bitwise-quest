import { notFound } from "next/navigation";
import { connection } from "next/server";
import { LessonClient } from "@/components/game/LessonClient";
import { getPracticePlay } from "@/lib/repo";

export default async function PracticePlayPage({ params, searchParams }: PageProps<"/play/[lang]/practice/[slug]">) {
  await connection();
  const { lang, slug } = await params;
  const { paper } = await searchParams;
  const play = getPracticePlay(lang, slug, paper === "1");
  if (!play) notFound();
  return <LessonClient play={play} />;
}
