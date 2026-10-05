import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ReviewClient } from "@/components/game/LessonClient";
import { getLanguage } from "@/lib/repo";

export default async function ReviewPage({ params }: PageProps<"/play/[lang]/review">) {
  await connection();
  const { lang } = await params;
  if (getLanguage(lang)?.status !== "active") notFound();
  return <ReviewClient lang={lang} />;
}
