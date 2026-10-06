"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import { useOrientation } from "@/components/ui/GameFrame";
import { useI18n } from "@/components/ui/I18n";
import type { MessageKey } from "@/lib/i18n/messages";
import type { LessonPlay } from "@/lib/repo";
import { prepareJs, preparePython, type LoadProgress } from "@/lib/runners/browser";
import { fx } from "@/lib/fx";
import { sfx } from "@/lib/sfx";

type GameComponent = typeof import("./LessonGame").LessonGame;
type StepId = "game" | "content" | "python" | "three";
interface Step { id: StepId; progress: number; done: boolean; failed?: boolean; bytes?: LoadProgress }

const LABELS: Record<StepId, MessageKey> = { game: "loading.game", content: "loading.content", python: "loading.python", three: "loading.three" };
const TIPS: MessageKey[] = ["loading.tip1", "loading.tip2", "loading.tip3", "loading.tip4", "loading.tip5", "loading.tip6"];
/** Waits shorter than this never show the loading screen (cached content starts instantly). */
const SHOW_AFTER_MS = 200;
const READY_MS = 800;

/** Heavy runtimes a play needs before its challenges can run in the browser. */
export function runtimeNeeds(play: LessonPlay) {
  const runs = play.beats.map((b) => b.beat).filter((b) => b.kind === "run");
  const tasks = play.beats.some((b) => b.beat.kind === "code");
  return {
    python: play.runner === "py-browser" && (runs.length > 0 || tasks),
    three: play.runner === "js-browser" && runs.some((b) => b.kind === "run" && /\bfrom\s*["']three["']/.test(b.starter)),
  };
}

const mb = (n: number) => (n / 1_000_000).toFixed(1);

/**
 * Downloads what a lesson, exam or review needs (the game code, its content, and runtimes such as
 * Python or three.js), showing an arcade loading screen while it takes noticeable time.
 */
export function Preloader({ play, children }: { play: LessonPlay | null; children: (Game: GameComponent) => ReactNode }) {
  const [Game, setGame] = useState<GameComponent | null>(null);
  const [steps, setSteps] = useState<Step[]>(() => [
    { id: "game", progress: 0.4, done: false },
    ...(play ? [] : [{ id: "content" as const, progress: 0.4, done: false }]),
  ]);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"loading" | "ready" | "done">("loading");
  const started = useRef(false);

  const update = (id: StepId, patch: Partial<Step>) => setSteps((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    void import("./LessonGame").then((m) => {
      setGame(() => m.LessonGame);
      update("game", { progress: 1, done: true });
    });
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!play || started.current) return;
    started.current = true;
    update("content", { progress: 1, done: true });
    const needs = runtimeNeeds(play);
    const extra: Step[] = [
      ...(needs.python ? [{ id: "python" as const, progress: 0.02, done: false }] : []),
      ...(needs.three ? [{ id: "three" as const, progress: 0.4, done: false }] : []),
    ];
    if (extra.length) setSteps((all) => [...all, ...extra]);
    if (needs.python) {
      void preparePython((p) => update("python", { bytes: p, progress: p.phase === "boot" ? 0.92 : 0.05 + 0.8 * (p.loaded / Math.max(1, p.total)) })).then((ok) =>
        update("python", { progress: 1, done: true, failed: !ok }),
      );
    }
    if (needs.three) void prepareJs({ three: true }).then((ok) => update("three", { progress: 1, done: true, failed: !ok }));
  }, [play]);

  const allDone = !!Game && !!play && steps.every((s) => s.done);
  useEffect(() => {
    if (!allDone || phase !== "loading") return;
    setPhase(visible ? "ready" : "done");
  }, [allDone, visible, phase]);
  // Hold the READY! hit for a moment, then start the game.
  useEffect(() => {
    if (phase !== "ready") return;
    const t = setTimeout(() => setPhase("done"), READY_MS);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "done" && Game) return <>{children(Game)}</>;
  if (!visible) return <div className="screen" />;
  return <LoadingScreen play={play} steps={steps} ready={phase === "ready"} />;
}

function LoadingScreen({ play, steps, ready }: { play: LessonPlay | null; steps: Step[]; ready: boolean }) {
  const { t, tx } = useI18n();
  const portrait = useOrientation() === "portrait";
  const pct = ready ? 100 : Math.round((steps.reduce((sum, s) => sum + s.progress, 0) / steps.length) * 100);
  const [tip, setTip] = useState(() => Math.floor(Math.random() * TIPS.length));
  const guideRef = useRef<HTMLDivElement>(null);
  const enemyRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLParagraphElement>(null);
  const doneCount = steps.filter((s) => s.done).length;
  const downloading = steps.find((s) => s.id === "python" && !s.done && s.bytes?.phase === "download");
  const blocks = portrait ? 12 : 20;

  // Idle animation: the guide bobs on the spot, the bug waits at the end of the track.
  useEffect(() => {
    const a = gsap.to(guideRef.current, { y: -4, duration: 0.18, repeat: -1, yoyo: true, ease: "steps(2)" });
    const b = gsap.to(enemyRef.current, { y: -3, duration: 0.3, repeat: -1, yoyo: true, ease: "steps(2)" });
    return () => { a.kill(); b.kill(); };
  }, []);

  // Rotate tips with a quick pixel fade.
  useEffect(() => {
    const id = setInterval(() => {
      gsap.fromTo(tipRef.current, { opacity: 0, x: 8 }, { opacity: 1, x: 0, duration: 0.25, ease: "steps(3)" });
      setTip((i) => (i + 1) % TIPS.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  // A blip for every finished step, a fanfare and a hit on the bug when everything is ready.
  const prevDone = useRef(doneCount);
  useEffect(() => {
    if (doneCount > prevDone.current) sfx.blip(doneCount * 2);
    prevDone.current = doneCount;
  }, [doneCount]);
  useEffect(() => {
    if (!ready) return;
    sfx.start();
    gsap.fromTo(guideRef.current, { y: 0 }, { y: -18, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" });
    fx.burst(enemyRef.current, { count: 18 });
    fx.shake(enemyRef.current, 6);
  }, [ready]);

  const exam = play?.mode === "exam";
  return (
    <div className="screen" style={{ display: "grid", placeItems: "center", padding: 16 }}>
      <div className="box dark" role="status" aria-live="polite" style={{ width: portrait ? "100%" : 640, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <span className={`pixel ${ready ? "" : "blink-soft"}`} style={{ fontSize: ready ? 20 : 16, color: ready ? "var(--good)" : "var(--gold)" }}>
            {ready ? t("loading.ready") : exam ? t("loading.exam") : t("loading.title")}
          </span>
          <span className="pixel" style={{ fontSize: 12, color: "var(--p3)" }}>{pct}%</span>
        </div>
        {play && <div style={{ fontSize: 19, color: "var(--p3)", marginTop: -6 }}>{tx(play.title)}</div>}

        {/* The guide walks toward the bug as the data arrives. */}
        <div style={{ position: "relative", height: 78 }}>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 8, borderTop: "4px dashed var(--p1)" }} />
          <div ref={guideRef} style={{ position: "absolute", bottom: 12, left: `calc(${Math.min(pct, 100)} * (100% - 120px) / 100)`, transition: "left 0.3s steps(4)" }}>
            <Sprite name={play?.guide.sprite ?? "hero"} size={56} />
          </div>
          <div ref={enemyRef} style={{ position: "absolute", bottom: 12, right: 0 }}>
            <Sprite name={play?.enemy ?? "slime"} size={56} flip />
          </div>
        </div>

        <div style={{ display: "flex", gap: 3 }} aria-hidden>
          {Array.from({ length: blocks }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 14, background: (i + 1) / blocks <= pct / 100 ? "var(--good)" : "var(--p1)", boxShadow: "inset 0 -3px 0 rgba(0,0,0,.25)" }} />
          ))}
        </div>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {steps.map((s) => (
            <li key={s.id} className="pixel" style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 10, color: s.failed ? "var(--red)" : s.done ? "var(--good)" : "var(--white)" }}>
              <span className={s.done ? "" : "blink"} style={{ width: 14 }}>{s.failed ? "✗" : s.done ? "✓" : "▶"}</span>
              <span>{t(LABELS[s.id])}</span>
              <span style={{ marginLeft: "auto", color: "var(--p3)" }}>
                {s.failed
                  ? t("loading.offline")
                  : !s.done && s.bytes?.phase === "download"
                    ? `${mb(s.bytes.loaded)} / ${mb(s.bytes.total)} MB`
                    : !s.done && s.bytes?.phase === "boot"
                      ? t("loading.pythonBoot")
                      : ""}
              </span>
            </li>
          ))}
        </ul>
        {downloading && <p style={{ fontSize: 15, color: "var(--p3)", margin: 0 }}>{t("loading.firstTime")}</p>}

        <div style={{ display: "flex", gap: 10, alignItems: "baseline", borderTop: "2px solid var(--p1)", paddingTop: 10 }}>
          <span className="pixel" style={{ fontSize: 9, color: "var(--gold)" }}>{t("loading.tip")}</span>
          <p ref={tipRef} style={{ fontSize: 17, margin: 0 }}>{t(TIPS[tip])}</p>
        </div>
      </div>
    </div>
  );
}
