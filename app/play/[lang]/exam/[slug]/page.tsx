import { notFound } from "next/navigation";
import { connection } from "next/server";
import { LessonClient } from "@/components/game/LessonClient";
import { getExamPlay } from "@/lib/repo";

export default async function ExamPlayPage({ params }: PageProps<"/play/[lang]/exam/[slug]">) {
  await connection();
  const { lang, slug } = await params;
  const play = getExamPlay(lang, slug);
  if (!play) notFound();
  return <LessonClient play={play} />;
}
