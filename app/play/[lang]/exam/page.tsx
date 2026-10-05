import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ExamHub } from "@/components/exam/ExamHub";
import { getExams } from "@/lib/repo";

export default async function ExamHubPage({ params }: PageProps<"/play/[lang]/exam">) {
  await connection();
  const { lang } = await params;
  const data = getExams(lang);
  if (!data || data.language.status !== "active") notFound();
  return <ExamHub language={data.language} exams={data.exams} />;
}
