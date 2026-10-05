"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { LessonPlay } from "@/lib/repo";
import { useI18n } from "@/components/ui/I18n";
import { RequireSave } from "@/components/save/SaveProvider";
import { dueReviews, isUnlocked, type WorldContent } from "@/lib/save/progress";
import type { SaveData } from "@/lib/save/schema";

function Loading() {
  const { t } = useI18n();
  return <div className="pixel blink" style={{ display: "grid", placeItems: "center", height: "100%", fontSize: 12 }}>{t("lesson.loading")}</div>;
}

// The game relies on browser-only APIs (audio, GSAP layout, random shuffles), so skip SSR.
const LessonGame = dynamic(() => import("./LessonGame").then((m) => m.LessonGame), { ssr: false, loading: () => <Loading /> });

/** Lessons and exams: the server sends the play; the save decides whether it is unlocked. */
export function LessonClient({ play, world }: { play: LessonPlay; world?: WorldContent }) {
  return <RequireSave>{(save) => <Guarded play={play} world={world} save={save} />}</RequireSave>;
}

function Guarded({ play, world, save }: { play: LessonPlay; world?: WorldContent; save: SaveData }) {
  const router = useRouter();
  const locked = play.mode !== "exam" && !!world && !isUnlocked(world, save.langs[play.languageSlug], play.slug);
  useEffect(() => { if (locked) router.replace(`/play/${play.languageSlug}`); }, [locked, router, play.languageSlug]);
  if (locked) return null;
  return <LessonGame play={play} world={world} />;
}

/** Review: due keys come from the save, beats from the server. */
export function ReviewClient({ lang }: { lang: string }) {
  return <RequireSave>{(save) => <Review lang={lang} save={save} />}</RequireSave>;
}

function Review({ lang, save }: { lang: string; save: SaveData }) {
  const router = useRouter();
  const [play, setPlay] = useState<LessonPlay | null>(null);
  useEffect(() => {
    const keys = dueReviews(save.langs[lang]);
    if (!keys.length) { router.replace(`/play/${lang}`); return; }
    void fetch("/api/review-play", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lang, keys }) })
      .then((r) => (r.ok ? (r.json() as Promise<LessonPlay>) : null))
      .then((p) => (p && p.beats.length ? setPlay(p) : router.replace(`/play/${lang}`)));
    // load once per visit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);
  return play ? <LessonGame play={play} /> : <Loading />;
}
