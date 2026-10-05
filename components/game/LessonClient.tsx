"use client";
import dynamic from "next/dynamic";
import type { LessonPlay } from "@/lib/repo";

// The game relies on browser-only APIs (audio, GSAP layout, random shuffles), so skip SSR.
const LessonGame = dynamic(() => import("./LessonGame").then((m) => m.LessonGame), {
  ssr: false,
  loading: () => <div className="pixel blink" style={{ display: "grid", placeItems: "center", minHeight: "100dvh", fontSize: 12 }}>CARGANDO...</div>,
});

export function LessonClient({ play }: { play: LessonPlay }) {
  return <LessonGame play={play} />;
}
