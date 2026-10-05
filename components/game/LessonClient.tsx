"use client";
import dynamic from "next/dynamic";
import type { LessonPlay } from "@/lib/repo";
import { useI18n } from "@/components/ui/I18n";

function Loading() {
  const { t } = useI18n();
  return <div className="pixel blink" style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 12 }}>{t("lesson.loading")}</div>;
}

// The game relies on browser-only APIs (audio, GSAP layout, random shuffles), so skip SSR.
const LessonGame = dynamic(() => import("./LessonGame").then((m) => m.LessonGame), {
  ssr: false,
  loading: () => <Loading />,
});

export function LessonClient({ play }: { play: LessonPlay }) {
  return <LessonGame play={play} />;
}
