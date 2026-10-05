"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Sprite } from "@/components/pixel/Sprite";
import { Settings } from "@/components/ui/Settings";
import { useOrientation } from "@/components/ui/GameFrame";
import { isQuestion, type Beat, type Text } from "@/lib/content/types";
import { fx, wait } from "@/lib/fx";
import type { LessonPlay, PlayBeat } from "@/lib/repo";
import { useSave } from "@/components/save/SaveProvider";
import { completeExam, completeLesson, completeReview, recordFailedRun, type ExamReport, type Reward, type WorldContent } from "@/lib/save/progress";
import type { ExamQuestion } from "@/lib/content/types";
import { ExamReportView } from "@/components/exam/ExamReportView";
import { useI18n } from "@/components/ui/I18n";
import type { MessageKey } from "@/lib/i18n/messages";
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

const CHEERS: MessageKey[] = ["lesson.cheer1", "lesson.cheer2", "lesson.cheer3", "lesson.cheer4", "lesson.cheer5"];

export function LessonGame({ play, world }: { play: LessonPlay; world?: WorldContent }) {
  const { save, commit } = useSave();
  const saveRef = useRef(save);
  saveRef.current = save;
  const boss = play.mode === "boss";
  const placement = play.mode === "exam"; // exam: one shot per question, no hearts, no retries
  const review = play.mode === "review";
  const maxHearts = boss ? 3 : placement ? 99 : 5;
  const portrait = useOrientation() === "portrait";
  const { t, tx } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;

  const initialQueue = useMemo<QueueItem[]>(() => play.beats.map((b, i) => ({ ...b, retry: 0, key: `b${i}` })), [play]);
  const questionCount = initialQueue.filter((q) => isQuestion(q.beat)).length;

  const [queue, setQueue] = useState(initialQueue);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [hearts, setHearts] = useState(maxHearts);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [explain, setExplain] = useState<Text | null>(null);
  const [terminal, setTerminal] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(1);
  const [reward, setReward] = useState<Reward | null>(null);
  const [examReport, setExamReport] = useState<ExamReport | null>(null);

  const stats = useRef({ mistakes: 0, maxCombo: 0, correct: 0, attempts: [] as { lesson: string; beat: number; correct: boolean; ms: number }[], placement: [] as { topic: string; correct: boolean }[] });
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
      await fx.banner(tx(play.title).toUpperCase(), { size: 26, hold: 0.6, color: "var(--white)" });
      if (!alive) return;
      if (questionCount > 0) {
        stage.current?.setEnemyHp(questionCount, questionCount);
        sfx.whoosh();
        await wait(400);
        void fx.banner(boss ? t("lesson.bossAppears", { name: tx(play.enemyName) }) : t("lesson.wildBug"), { size: 22, hold: 0.3, color: boss ? "var(--red)" : "var(--gold)" });
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
        stage.current?.heroSay(tRef.current(CHEERS[Math.floor(Math.random() * CHEERS.length)]));
        stage.current?.heroCheer();
      }
    }, 1000);
    return () => { clearInterval(id); window.removeEventListener("pointerdown", touch); window.removeEventListener("keydown", touch); };
  }, [beat]);

  const print = useCallback((text: string) => setTerminal((t) => [...t.slice(-3), text]), []);

  const finish = async () => {
    setPhase("finishing");
    if (questionCount > 0) await stage.current?.enemyDefeated();
    await fx.banner(placement ? t("lesson.time") : boss ? t("lesson.bossDefeated") : t("lesson.clear"), { size: 28, hold: 0.7 });
    const s = stats.current;
    const current = saveRef.current;
    const lang = play.languageSlug;
    if (current) {
      if (placement && play.exam) {
        const r = completeExam(current, lang, play.exam, s.placement);
        setExamReport(r.report);
        await commit(r.save);
      } else if (review) {
        const r = completeReview(current, lang, s.attempts.map((a) => ({ key: `${a.lesson}#${a.beat}`, correct: a.correct })), score);
        setReward(r.reward);
        await commit(r.save);
      } else if (world) {
        const r = completeLesson(current, lang, world, { slug: play.slug, title: play.title, mode: play.mode as "lesson" | "boss", xp: play.xp }, {
          score, mistakes: s.mistakes, maxCombo: s.maxCombo, correct: s.correct, attempts: s.attempts.map((a) => ({ beat: a.beat, correct: a.correct })),
        });
        setReward(r.reward);
        await commit(r.save);
      }
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
    if (placement) stats.current.placement.push({ topic: (current.beat as ExamQuestion).topic ?? "", correct });
    else stats.current.attempts.push({ lesson: current.lesson, beat: current.index, correct, ms });
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
      const tierKey: MessageKey = speed > 0.66 ? "lesson.perfect" : speed > 0.33 ? "lesson.great" : "lesson.nice";
      const tier = t(tierKey);
      const points = Math.round((100 + Math.round(speed * 60)) * (1 + Math.min(newCombo - 1, 10) * 0.1));
      setCombo(newCombo);
      stats.current.maxCombo = Math.max(stats.current.maxCombo, newCombo);
      stats.current.correct++;
      setScore((s) => s + points);
      if (tierKey === "lesson.perfect") sfx.perfect(); else sfx.correct(newCombo);
      fx.burst(at ?? null, { count: 16 + newCombo * 2 });
      fx.float(at ?? null, `+${points}`, "var(--gold)", 18);
      fx.float(comboRef.current ?? null, tier, tierKey === "lesson.perfect" ? "var(--good)" : "var(--white)", 14);
      requestAnimationFrame(() => fx.pop(comboRef.current, 1.6));
      if (newCombo >= 3 && newCombo % (newCombo >= 10 ? 5 : 3) === 0) void fx.banner(newCombo >= 9 ? t("lesson.onFire", { n: newCombo }) : t("lesson.comboBanner", { n: newCombo }), { size: 26, hold: 0.2, color: "var(--good)" });
    } else {
      sfx.correct(0);
      fx.float(at ?? null, t("lesson.okAfterMiss"), "var(--white)", 14);
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
      if (!review && saveRef.current) {
        void commit(recordFailedRun(saveRef.current, play.languageSlug, play.slug, stats.current.attempts.map((a) => ({ beat: a.beat, correct: a.correct }))));
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
        <Link href={`/play/${play.languageSlug}`} className="btn small" onClick={() => sfx.select()} aria-label={t("lesson.back")}>✕</Link>
        <div ref={heartsRef} style={{ display: "flex", gap: 2 }} aria-label={t("lesson.lives", { n: hearts })}>
          {!placement && Array.from({ length: maxHearts }).map((_, i) => (
            <span key={i} data-heart><Sprite name={i < hearts ? "heart" : "heartEmpty"} size={22} /></span>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div className="pixel" style={{ fontSize: 9, color: "var(--p2)", marginBottom: 4 }}>
            {tx(play.regionName).toUpperCase()} · {tx(play.title).toUpperCase()}
            {placement && questionCount > 0 && <span style={{ color: "var(--gold)" }}> · {t("lesson.question", { n: Math.min(doneQuestions + 1, questionCount), total: questionCount })}</span>}
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: Math.max(1, questionCount) }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 8, background: i < doneQuestions ? "var(--good)" : "var(--p1)", transition: "background 200ms steps(2)" }} />
            ))}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="pixel" style={{ fontSize: 9, color: "var(--p2)" }}>{t("common.score")}</div>
          <span ref={scoreRef} className="pixel" style={{ fontSize: 14, color: "var(--gold)" }}>000000</span>
        </div>
        <div ref={comboRef} className="pixel" style={{ fontSize: 12, minWidth: 74, textAlign: "center", color: comboColor, display: "flex", alignItems: "center", gap: 4 }}>
          {combo >= 2 ? <><Sprite name="flame" size={16} />x{combo}</> : <span style={{ color: "var(--p1)" }}>{t("common.combo")}</span>}
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
            <Sprite name={play.guide.sprite} size={40} />
            <div>
              <div className="pixel" style={{ fontSize: 9, color: "var(--red)" }}>{t("lesson.almost", { name: tx(play.guide.name).toUpperCase() })}</div>
              <div style={{ fontSize: 18, color: "var(--p0)" }}>{tx(explain)}</div>
              {!placement && isQuestion(beat!) && current.retry < 2 && <div className="pixel" style={{ fontSize: 8, color: "var(--p1)", marginTop: 4 }}>{t("lesson.bugReturns")}</div>}
            </div>
          </div>
        )}
        <div ref={panelRef} key={current?.key}>
          {phase !== "intro" && beat && phase !== "result" && phase !== "gameover" && (
            <>
              {current.retry > 0 && <div className="pixel blink" style={{ fontSize: 10, color: "var(--red)", marginBottom: 8 }}>{t("lesson.bugBack")}</div>}
              {beat.kind === "dialog" && <DialogBeatView beat={beat} ctx={ctx} enemy={play.enemy} enemyName={play.enemyName} guide={play.guide} />}
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
            <div className="pixel" style={{ fontSize: 28, color: "var(--red)", marginBottom: 16 }}>{t("lesson.gameOver")}</div>
            <p style={{ fontSize: 18, marginBottom: 20 }}>{t("lesson.gameOverText")}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn primary" onClick={restart}>{t("common.retry")}</button>
              <Link className="btn" href={`/play/${play.languageSlug}`}>{t("common.map")}</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
