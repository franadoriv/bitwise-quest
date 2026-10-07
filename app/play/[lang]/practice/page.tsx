import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PracticeRoom } from "@/components/practice/PracticeRoom";
import { getLanguage, getPracticeList } from "@/lib/repo";

export default async function PracticeRoomPage({ params }: PageProps<"/play/[lang]/practice">) {
  await connection();
  const { lang } = await params;
  const language = getLanguage(lang);
  const items = getPracticeList(lang);
  if (!language || language.status !== "active" || !items) notFound();
  return <PracticeRoom language={language} items={items} />;
}
