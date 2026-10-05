"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import { Settings } from "@/components/ui/Settings";
import { useOrientation } from "@/components/ui/GameFrame";
import { isQuestion, type Beat } from "@/lib/content/types";
import { fx, wait } from "@/lib/fx";
import type { ExamReport, LessonPlay, PlayBeat, RewardView } from "@/lib/repo";
import { ExamReportView } from "@/components/exam/ExamReportView";
import { music, sfx } from "@/lib/sfx";
import { Stage, type StageHandle } from "./Stage";
import { ResultScreen } from "./ResultScreen";
import { DialogBeatView } from "./beats/DialogBeatView";
import { ActBeatView } from "./beats/ActBeatView";
import { ChoiceBeatView } from "./beats/PickBeatView";
import { TypeBeatView } from "./beats/TypeBeatView";
import { OrderBeatView } from "./beats/OrderBeatView";
import { RunBeatView } from "./beats/RunBeatView";
import type { BeatCtx } from "./beats/types";

type QueueItem = PlayBeat & { retry: number; key: string };
type Phase = "intro" | "play" | "anim" | "finishing" | "result" | "gameover";

const CHEERS = ["¡Tú puedes!", "Piensa...", "¡Vamos!", "¿Mmm?", "¡Ánimo!"];

export function LessonGame({ play }: { play: LessonPlay }) {
  const boss = play.mode === "boss";
  const placement = play.mode === "exam"; // exam: one shot per question, no hearts, no retries
  const review = play.mode === "review";
  const maxHearts = boss ? 3 : placement ? 99 : 5;
  const portrait = useOrientation() === "portrait";

  const initialQueue = useMemo<QueueItem[]>(() => play.beats.map((b, i) => ({ ...b, retry: 0, key: `b${i}` })), [play]);
  const questionCount = initialQueue.filter((q) => isQuestion(q.beat)).length;

  const [queue, setQueue] = useState(initialQueue);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [hearts, setHearts] = useState(maxHearts);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [explain, setExplain] = useState<string | null>(null);
  const [terminal, setTerminal] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(1);
  const [reward, setReward] = useState<RewardView | null>(null);
  const [examReport, setExamReport] = useState<ExamReport | null>(null);

  const stats = useRef({ mistakes: 0, maxCombo: 0, correct: 0, attempts: [] as { lessonId: number; beat: number; correct: boolean; ms: number }[], placement: [] as { index: number; correct: boolean }[] });
  const failed = useRef(false);
  const beatStart = useRef(Date.now());
  const stage = useRef<StageHandle>(null);
  const heartsRef = useRef<HTMLDivElement>(null);
  const comboRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const explainRef = useRef<HTMLDivElement>(null);
  const lastInput = useRef(Date.now());
  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;

  const current = queue[idx];
  const beat: Beat | undefined = current?.beat;
  const doneQuestions = queue.slice(0, idx).filter((q) => isQuestion(q.beat) && q.retry === 0).length;

  // ── score counter tween ──
  const shownScore = useRef({ v: 0 });
  useEffect(() => {
    gsap.to(shownScore.current, {
      v: score,
      duration: 0.6,
      ease: "power2.out",
      onUpdate: () => { if (scoreRef.current) scoreRef.current.textContent = String(Math.round(shownScore.current.v)).padStart(6, "0"); },
    });
  }, [score]);

  // ── intro ──
  useEffect(() => {
    music.play("battle");
    let alive = true;
    (async () => {
      await wait(250);
      await fx.banner(play.title.toUpperCase(), { size: 26, hold: 0.6, color: "var(--white)" });
      if (!alive) return;
      if (questionCount > 0) {
        stage.current?.setEnemyHp(questionCount, questionCount);
        sfx.whoosh();
        await wait(400);
        void fx.banner(boss ? `¡${play.enemyName}!` : "¡UN BUG SALVAJE!", { size: 22, hold: 0.3, color: boss ? "var(--red)" : "var(--gold)" });
        await wait(700);
      }
      if (alive) setPhase("play");
    })();
    return () => { alive = false; music.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── per-beat setup ──
  useEffect(() => {
    if (phase !== "play" || !beat) return;
    failed.current = false;
    setExplain(null);
    setTimeLeft(1);
    beatStart.current = Date.now();
    lastInput.current = Date.now();
    if (beat.setup) {
      stage.current?.reset();
      void stage.current?.run(beat.setup);
    }
    gsap.fromTo(panelRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: "back.out(2)" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase === "play"]);

  // ── speed timer (bonus; in boss fights running out is a hit) ──
  const limit = (beat && isQuestion(beat) ? beat.time ?? (beat.kind === "run" ? 120 : 25) : 0) * 1000;
  useEffect(() => {
    if (phase !== "play" || !limit) return;
    const id = setInterval(() => {
      if (failed.current) return;
      const left = Math.max(0, 1 - (Date.now() - beatStart.current) / limit);
      setTimeLeft(left);
      if (left <= 0 && (boss || placement) && !failed.current) onWrong(null);
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase, limit]);

  // ── idle micro-events: never let the screen go quiet ──
  useEffect(() => {
    const touch = () => { lastInput.current = Date.now(); };
    window.addEventListener("pointerdown", touch);
    window.addEventListener("keydown", touch);
    const id = setInterval(() => {
      if (phaseRef.current !== "play" || !beat || !isQuestion(beat)) return;
      if (Date.now() - lastInput.current > 9000) {
        lastInput.current = Date.now();
        stage.current?.heroSay(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
        stage.current?.heroCheer();
      }
    }, 1000);
    return () => { clearInterval(id); window.removeEventListener("pointerdown", touch); window.removeEventListener("keydown", touch); };
  }, [beat]);

  const print = useCallback((text: string) => setTerminal((t) => [...t.slice(-3), text]), []);

  const finish = async () => {
    setPhase("finishing");
    if (questionCount > 0) await stage.current?.enemyDefeated();
    await fx.banner(placement ? "¡TIEMPO!" : boss ? "¡JEFE DERROTADO!" : "¡STAGE CLEAR!", { size: 28, hold: 0.7 });
    const s = stats.current;
    try {
      if (placement) {
        const r = await fetch("/api/exam", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lang: play.languageSlug, exam: play.slug, answers: s.placement }) });
        if (r.ok) setExamReport((await r.json()) as ExamReport);
      } else {
        const url = review ? "/api/review" : "/api/complete";
        const r = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lang: play.languageSlug, slug: play.slug, score, mistakes: s.mistakes, maxCombo: s.maxCombo, correct: s.correct, attempts: s.attempts }),
        });
        if (r.ok) setReward((await r.json()) as RewardView);
      }
    } catch {
      /* offline: still show the result screen */
    }
    setPhase("result");
  };

  const next = async () => {
    const nextIdx = idx + 1;
    if (nextIdx >= queue.length) { await finish(); return; }
    setIdx(nextIdx);
    setPhase("play");
  };

  const record = (correct: boolean) => {
    if (!current || current.retry > 0) return;
    const ms = Date.now() - beatStart.current;
    if (placement) stats.current.placement.push({ index: current.index, correct });
    else stats.current.attempts.push({ lessonId: current.lessonId, beat: current.index, correct, ms });
  };

  async function onSolved(at?: Element | null) {
    if (phaseRef.current !== "play" || !beat) return;
    setPhase("anim");
    if (!isQuestion(beat)) {
      if (beat.kind === "act") { fx.float(at ?? panelRef.current, "+10", "var(--good)"); setScore((s) => s + 10); }
      await wait(beat.kind === "dialog" ? 60 : 200);
      await next();
      return;
    }
    if (!failed.current) {
      record(true);
      if (placement) { sfx.correct(0); fx.burst(at ?? null); await wait(350); await next(); return; }
      const newCombo = combo + 1;
      const speed = limit ? Math.max(0, 1 - (Date.now() - beatStart.current) / limit) : 0;
      const tier = speed > 0.66 ? "PERFECT!" : speed > 0.33 ? "GREAT!" : "NICE!";
      const points = Math.round((100 + Math.round(speed * 60)) * (1 + Math.min(newCombo - 1, 10) * 0.1));
      setCombo(newCombo);
      stats.current.maxCombo = Math.max(stats.current.maxCombo, newCombo);
      stats.current.correct++;
      setScore((s) => s + points);
      if (tier === "PERFECT!") sfx.perfect(); else sfx.correct(newCombo);
      fx.burst(at ?? null, { count: 16 + newCombo * 2 });
      fx.float(at ?? null, `+${points}`, "var(--gold)", 18);
      fx.float(comboRef.current ?? null, tier, tier === "PERFECT!" ? "var(--good)" : "var(--white)", 14);
      requestAnimationFrame(() => fx.pop(comboRef.current, 1.6));
      if (newCombo >= 3 && newCombo % (newCombo >= 10 ? 5 : 3) === 0) void fx.banner(newCombo >= 9 ? `ON FIRE x${newCombo}!` : `COMBO x${newCombo}!`, { size: 26, hold: 0.2, color: "var(--good)" });
    } else {
      sfx.correct(0);
      fx.float(at ?? null, "¡BIEN!", "var(--white)", 14);
    }
    await stage.current?.run(beat.win);
    if (questionCount > 0) await stage.current?.attackEnemy();
    await wait(220);
    await next();
  }

  function onWrong(at?: Element | null) {
    if (phaseRef.current !== "play" || !beat) return;
    if (failed.current) { sfx.wrong(); return; }
    failed.current = true;
    record(false);
    sfx.wrong();
    setCombo(0);
    stats.current.mistakes++;
    if (isQuestion(beat)) setExplain(beat.explain);
    requestAnimationFrame(() => {
      if (explainRef.current) gsap.fromTo(explainRef.current, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, ease: "back.out(2)" });
    });

    if (placement) {
      fx.float(at ?? null, "✗", "var(--red)", 22);
      setPhase("anim");
      setTimeout(() => { void next(); }, 1800);
      return;
    }

    sfx.hurt();
    fx.flash("var(--red)", 0.3);
    void stage.current?.enemyAttack();
    const heartEls = heartsRef.current?.querySelectorAll("[data-heart]");
    const lost = heartEls?.[hearts - 1];
    if (lost) { fx.burst(lost, { colors: ["var(--red)", "var(--white)"], count: 12, spread: 50 }); fx.shake(heartsRef.current, 6); }
    const h = hearts - 1;
    setHearts(h);

    // the bug comes back later: the beat is retried at the end of the stage
    if (isQuestion(beat) && current.retry < 2) {
      setQueue((q) => [...q, { ...current, retry: current.retry + 1, key: `${current.key}r` }]);
      setTimeout(() => stage.current?.healEnemy(), 500);
    }
    if (h <= 0) {
      setTimeout(() => { sfx.gameOver(); music.stop(); setPhase("gameover"); }, 900);
      if (!review) {
        void fetch("/api/attempts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lang: play.languageSlug, slug: play.slug, attempts: stats.current.attempts }),
        }).catch(() => {});
      }
    }
  }

  const ctx: BeatCtx = {
    lang: play.languageSlug,
    wrong: onWrong,
    solved: (at) => void onSolved(at),
    tick: (at) => { sfx.coin(); if (at) fx.burst(at, { count: 6, spread: 30 }); setScore((s) => s + 5); },
    stage: stage.current,
    print,
    busy: phase !== "play",
  };

  const seed = idx * 7 + 3;

  const restart = () => window.location.reload();
  const comboColor = combo >= 9 ? "var(--red)" : combo >= 5 ? "var(--gold)" : "var(--white)";

  return (
    <div className="screen">
      {/* ── HUD ── */}
      <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", flexWrap: "wrap" }}>
        <Link href={`/play/${play.languageSlug}`} className="btn small" onClick={() => sfx.select()} aria-label="Volver al mapa">✕</Link>
        <div ref={heartsRef} style={{ display: "flex", gap: 2 }} aria-label={`${hearts} vidas`}>
          {!placement && Array.from({ length: maxHearts }).map((_, i) => (
            <span key={i} data-heart><Sprite name={i < hearts ? "heart" : "heartEmpty"} size={22} /></span>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div className="pixel" style={{ fontSize: 9, color: "var(--p2)", marginBottom: 4 }}>
            {play.regionName.toUpperCase()} · {play.title.toUpperCase()}
            {placement && questionCount > 0 && <span style={{ color: "var(--gold)" }}> · PREGUNTA {Math.min(doneQuestions + 1, questionCount)}/{questionCount}</span>}
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: Math.max(1, questionCount) }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 8, background: i < doneQuestions ? "var(--good)" : "var(--p1)", transition: "background 200ms steps(2)" }} />
            ))}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="pixel" style={{ fontSize: 9, color: "var(--p2)" }}>SCORE</div>
          <span ref={scoreRef} className="pixel" style={{ fontSize: 14, color: "var(--gold)" }}>000000</span>
        </div>
        <div ref={comboRef} className="pixel" style={{ fontSize: 12, minWidth: 74, textAlign: "center", color: comboColor, display: "flex", alignItems: "center", gap: 4 }}>
          {combo >= 2 ? <><Sprite name="flame" size={16} />x{combo}</> : <span style={{ color: "var(--p1)" }}>COMBO</span>}
        </div>
        <Settings />
      </header>

      {/* ── WORLD ── */}
      <div style={{ position: "relative", margin: "0 16px", flex: portrait ? "0 0 30%" : "0 0 46%", minHeight: 0 }} className="box">
        <Stage ref={stage} theme={play.theme} enemy={play.enemy} boss={boss} onPrint={print} />
        {terminal.length > 0 && (
          <div className="code" style={{ position: "absolute", left: 6, top: 6, background: "var(--p0)", color: "var(--good)", padding: "4px 8px", fontSize: 18, lineHeight: 1, boxShadow: "0 0 0 2px var(--p2)", maxWidth: "55%" }}>
            <div className="pixel" style={{ fontSize: 7, color: "var(--p2)", marginBottom: 2 }}>STDOUT</div>
            {terminal.map((t, i) => <div key={i}>&gt; {t}</div>)}
          </div>
        )}
        {limit > 0 && phase === "play" && !failed.current && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 5, background: "var(--p0)" }}>
            <div style={{ height: "100%", width: `${timeLeft * 100}%`, background: timeLeft > 0.33 ? "var(--gold)" : "var(--red)", transition: "width 100ms linear" }} />
          </div>
        )}
      </div>

      {/* ── PANEL ── */}
      <main className="scroll" style={{ padding: "14px 16px 24px", flex: 1, minHeight: 0 }}>
        {explain && (
          <div ref={explainRef} className="box" style={{ display: "flex", gap: 12, padding: 10, marginBottom: 14, background: "var(--white)", alignItems: "center" }}>
            <Sprite name="master" size={40} />
            <div>
              <div className="pixel" style={{ fontSize: 9, color: "var(--red)" }}>FERRO: ¡CASI!</div>
              <div style={{ fontSize: 18, color: "var(--p0)" }}>{explain}</div>
              {!placement && isQuestion(beat!) && current.retry < 2 && <div className="pixel" style={{ fontSize: 8, color: "var(--p1)", marginTop: 4 }}>EL BUG VOLVERÁ AL FINAL · ¡INTÉNTALO DE NUEVO!</div>}
            </div>
          </div>
        )}
        <div ref={panelRef} key={current?.key}>
          {phase !== "intro" && beat && phase !== "result" && phase !== "gameover" && (
            <>
              {current.retry > 0 && <div className="pixel blink" style={{ fontSize: 10, color: "var(--red)", marginBottom: 8 }}>¡EL BUG HA VUELTO!</div>}
              {beat.kind === "dialog" && <DialogBeatView beat={beat} ctx={ctx} enemy={play.enemy} enemyName={play.enemyName} />}
              {beat.kind === "act" && <ActBeatView beat={beat} ctx={ctx} />}
              {(beat.kind === "pick" || beat.kind === "predict") && <ChoiceBeatView beat={beat} ctx={ctx} seed={seed} />}
              {beat.kind === "type" && <TypeBeatView beat={beat} ctx={ctx} />}
              {beat.kind === "order" && <OrderBeatView beat={beat} ctx={ctx} seed={seed} />}
              {beat.kind === "run" && <RunBeatView beat={beat} ctx={ctx} />}
            </>
          )}
        </div>
      </main>

      {phase === "result" && placement && <ExamReportView report={examReport} lang={play.languageSlug} />}
      {phase === "result" && !placement && (
        <ResultScreen
          play={play}
          score={score}
          maxCombo={stats.current.maxCombo}
          mistakes={stats.current.mistakes}
          reward={reward}
        />
      )}
      {phase === "gameover" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.75)", display: "grid", placeItems: "center", zIndex: 600, padding: 16 }}>
          <div className="box dark" style={{ padding: 28, textAlign: "center", maxWidth: 420 }}>
            <div className="pixel" style={{ fontSize: 28, color: "var(--red)", marginBottom: 16 }}>GAME OVER</div>
            <p style={{ fontSize: 18, marginBottom: 20 }}>Los bugs ganaron esta vez. Lo que fallaste volverá como repaso: ¡así se aprende!</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn primary" onClick={restart}>REINTENTAR</button>
              <Link className="btn" href={`/play/${play.languageSlug}`}>MAPA</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
