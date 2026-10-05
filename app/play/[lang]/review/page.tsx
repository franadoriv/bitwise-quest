import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { LessonClient } from "@/components/game/LessonClient";
import { getReviewPlay } from "@/lib/repo";

export default async function ReviewPage({ params }: PageProps<"/play/[lang]/review">) {
  await connection();
  const { lang } = await params;
  const play = getReviewPlay(lang);
  if (!play) notFound();
  if (play.beats.length === 0) redirect(`/play/${lang}`);
  return <LessonClient play={play} />;
}
