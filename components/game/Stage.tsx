"use client";
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { SpriteG } from "@/components/pixel/Sprite";
import type { ActorId, Effect, EnemyKind, ItemKind, Theme } from "@/lib/content/types";
import { fx, wait } from "@/lib/fx";
import { sfx } from "@/lib/sfx";

export interface StageHandle {
  run(effects: Effect[] | undefined): Promise<void>;
  reset(): void;
  attackEnemy(): Promise<void>;
  enemyAttack(): Promise<void>;
  healEnemy(): void;
  setEnemyHp(hp: number, max: number): void;
  enemyDefeated(): Promise<void>;
  heroSay(text: string): void;
  heroCheer(): void;
  root(): HTMLDivElement | null;
}

interface Props {
  theme: Theme;
  enemy: EnemyKind;
  boss: boolean;
  onPrint(text: string): void;
}

const W = 240;
const H = 96;
const GROUND = 84;
const OFF_L = -200; // off-stage positions sit outside the extended backdrop
const OFF_R = W + 180;
const EXT = 600; // how far the backdrop extends beyond the viewBox

interface TagState { text: string; value?: string; dead?: boolean }

export const Stage = forwardRef<StageHandle, Props>(function Stage({ theme, enemy, boss, onPrint }, ref) {
  const wrap = useRef<HTMLDivElement>(null);
  const actor = { hero: useRef<SVGGElement>(null), ally: useRef<SVGGElement>(null), enemy: useRef<SVGGElement>(null) };
  const body = { hero: useRef<SVGGElement>(null), ally: useRef<SVGGElement>(null), enemy: useRef<SVGGElement>(null) };
  const tagRef = { hero: useRef<SVGGElement>(null), ally: useRef<SVGGElement>(null), enemy: useRef<SVGGElement>(null) };
  const bubbleRef = { hero: useRef<SVGGElement>(null), ally: useRef<SVGGElement>(null), enemy: useRef<SVGGElement>(null) };
  const itemRef = useRef<SVGGElement>(null);
  const ghostRef = useRef<SVGGElement>(null);
  const chainRef = useRef<SVGLineElement>(null);
  const enemyBarRef = useRef<SVGGElement>(null);
  const clouds = useRef<SVGGElement>(null);

  const [tags, setTags] = useState<Partial<Record<ActorId, TagState>>>({});
  const [hp, setHp] = useState<Partial<Record<ActorId, number>>>({});
  const [bubbles, setBubbles] = useState<Partial<Record<ActorId, string>>>({});
  const [itemKind, setItemKind] = useState<ItemKind>("sword");
  const [ghostLabel, setGhostLabel] = useState<string>("");
  const [enemyHp, setEnemyHpState] = useState({ hp: 1, max: 1 });

  const state = useRef({ holder: null as ActorId | null, cloneHolder: null as ActorId | null, visible: { hero: true, ally: false, enemy: false } as Record<ActorId, boolean> });

  const size = (id: ActorId) => (id === "enemy" && boss ? 40 : 26);
  const homeX: Record<ActorId, number> = { hero: 34, ally: 96, enemy: boss ? 178 : 184 };
  const topY = (id: ActorId) => GROUND - size(id);
  const handPos = (id: ActorId) => (id === "enemy" ? { x: homeX.enemy - 8, y: topY(id) + 8 } : { x: homeX[id] + 20, y: topY(id) + 6 });

  // ── idle life: bobbing actors, drifting clouds ──
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      (["hero", "ally", "enemy"] as ActorId[]).forEach((id) => {
        const vis = state.current.visible[id];
        gsap.set(actor[id].current, { x: vis ? homeX[id] : id === "enemy" ? OFF_R : OFF_L, y: topY(id), autoAlpha: vis ? 1 : 0 });
        gsap.to(body[id].current, { y: -1, duration: 0.45 + Math.random() * 0.2, repeat: -1, yoyo: true, ease: "steps(1)" });
      });
      gsap.set([itemRef.current, ghostRef.current, chainRef.current], { autoAlpha: 0 });
      gsap.to(clouds.current, { x: -W, duration: 60, repeat: -1, ease: "none" });
    }, wrap);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boss]);

  const popTag = (id: ActorId) => {
    const el = tagRef[id].current;
    if (el) gsap.fromTo(el, { scale: 0, transformOrigin: "50% 100%" }, { scale: 1, duration: 0.3, ease: "back.out(3)" });
  };

  const placeItem = (el: SVGGElement | null, holder: ActorId) => {
    const p = handPos(holder);
    gsap.set(el, { x: p.x, y: p.y });
  };

  async function enter(id: ActorId) {
    if (state.current.visible[id]) return;
    state.current.visible[id] = true;
    sfx.whoosh();
    await gsap.fromTo(actor[id].current, { x: id === "enemy" ? OFF_R : OFF_L, autoAlpha: 1 }, { x: homeX[id], duration: 0.55, ease: "back.out(1.4)" });
  }

  async function exit(id: ActorId, instant = false) {
    if (!state.current.visible[id]) return;
    state.current.visible[id] = false;
    const x = id === "enemy" ? OFF_R : OFF_L;
    if (instant) gsap.set(actor[id].current, { x, autoAlpha: 0 });
    else await gsap.to(actor[id].current, { x, autoAlpha: 0, duration: 0.35, ease: "power2.in" });
  }

  async function arc(el: SVGGElement | null, to: ActorId, dur = 0.5) {
    if (!el) return;
    const p = handPos(to);
    const cur = { x: Number(gsap.getProperty(el, "x")), y: Number(gsap.getProperty(el, "y")) };
    await gsap.to(el, {
      keyframes: [
        { x: (cur.x + p.x) / 2, y: Math.min(cur.y, p.y) - 22, duration: dur / 2, ease: "power1.out" },
        { x: p.x, y: p.y, duration: dur / 2, ease: "power1.in" },
      ],
    });
  }

  function say(id: ActorId, text: string) {
    flushSync(() => setBubbles((b) => ({ ...b, [id]: text })));
    const el = bubbleRef[id].current;
    if (!el) return;
    sfx.blip(2);
    gsap.killTweensOf(el);
    gsap.fromTo(el, { autoAlpha: 1, scale: 0, transformOrigin: "50% 100%" }, { scale: 1, duration: 0.25, ease: "back.out(3)" });
    gsap.to(el, { autoAlpha: 0, delay: 1.8, duration: 0.2 });
  }

  async function hitFlash(id: ActorId) {
    const el = body[id].current;
    await gsap.to(el, { opacity: 0, duration: 0.05, repeat: 5, yoyo: true, ease: "steps(1)" });
    gsap.set(el, { opacity: 1 });
  }

  async function attack(from: ActorId, to: ActorId, dmg?: number) {
    const a = actor[from].current;
    const dir = homeX[to] > homeX[from] ? 1 : -1;
    await gsap.to(a, { x: homeX[from] + dir * 18, duration: 0.1, ease: "power2.in" });
    sfx.hit();
    fx.burst(actor[to].current, { colors: ["var(--white)", "var(--red)", "var(--gold)"], count: 10, spread: 50 });
    if (dmg) fx.float(actor[to].current, `-${dmg}`, "var(--red)", 18);
    gsap.to(actor[to].current, { x: homeX[to] + dir * 8, duration: 0.08, yoyo: true, repeat: 1 });
    await Promise.all([hitFlash(to), gsap.to(a, { x: homeX[from], duration: 0.25, ease: "power2.out" })]);
  }

  async function one(e: Effect) {
    const s = state.current;
    switch (e.t) {
      case "enter": return enter(e.actor);
      case "exit": return exit(e.actor);
      case "tag":
        flushSync(() => setTags((t) => ({ ...t, [e.actor]: { text: e.text, value: e.value } })));
        sfx.blip(5);
        popTag(e.actor);
        return wait(250);
      case "untag":
        flushSync(() => setTags((t) => ({ ...t, [e.actor]: undefined })));
        return;
      case "value":
        flushSync(() => setTags((t) => ({ ...t, [e.actor]: { ...(t[e.actor] ?? { text: "" }), value: e.text } })));
        sfx.blip(8);
        popTag(e.actor);
        return wait(250);
      case "dead":
        flushSync(() => setTags((t) => ({ ...t, [e.actor]: { ...(t[e.actor] ?? { text: "?" }), dead: true } })));
        sfx.drop();
        fx.shake(tagRef[e.actor].current, 3);
        return wait(300);
      case "item": {
        flushSync(() => setItemKind(e.kind));
        s.holder = e.holder;
        placeItem(itemRef.current, e.holder);
        sfx.coin();
        await gsap.fromTo(itemRef.current, { autoAlpha: 1, scale: 0, rotation: -180, transformOrigin: "50% 50%" }, { scale: 1, rotation: 0, duration: 0.35, ease: "back.out(2)" });
        return;
      }
      case "give":
        if (!s.holder) return;
        sfx.whoosh();
        await arc(itemRef.current, e.to);
        s.holder = e.to;
        sfx.coin();
        fx.pop(body[e.to].current, 1.15);
        return;
      case "clone": {
        if (!s.holder) return;
        flushSync(() => setGhostLabel(""));
        placeItem(ghostRef.current, s.holder);
        gsap.set(ghostRef.current, { autoAlpha: 1, opacity: 1 });
        fx.burst(itemRef.current, { count: 8, spread: 30 });
        sfx.select();
        await arc(ghostRef.current, e.to);
        s.cloneHolder = e.to;
        fx.burst(ghostRef.current, { count: 10, spread: 40 });
        return;
      }
      case "lend": {
        if (!s.holder) return;
        flushSync(() => setGhostLabel(e.mut ? "&mut" : "&"));
        const from = handPos(s.holder);
        const to = handPos(e.to);
        placeItem(ghostRef.current, s.holder);
        gsap.set(ghostRef.current, { autoAlpha: 1, opacity: 0.75 });
        gsap.set(chainRef.current, { attr: { x1: from.x + 6, y1: from.y + 6, x2: from.x + 6, y2: from.y + 6 }, autoAlpha: 1 });
        sfx.whoosh();
        await Promise.all([
          arc(ghostRef.current, e.to),
          gsap.to(chainRef.current, { attr: { x2: to.x + 6, y2: to.y + 6 }, duration: 0.5 }),
        ]);
        sfx.coin();
        await wait(700);
        await Promise.all([
          arc(ghostRef.current, s.holder, 0.4),
          gsap.to(chainRef.current, { attr: { x2: from.x + 6, y2: from.y + 6 }, duration: 0.4 }),
        ]);
        gsap.set([ghostRef.current, chainRef.current], { autoAlpha: 0 });
        return;
      }
      case "drop":
        if (!s.holder) return;
        sfx.drop();
        fx.burst(itemRef.current, { colors: ["var(--p2)", "var(--white)"], count: 16, spread: 60 });
        await gsap.to(itemRef.current, { scale: 0, rotation: 360, transformOrigin: "50% 50%", duration: 0.35 });
        gsap.set(itemRef.current, { autoAlpha: 0, scale: 1, rotation: 0 });
        s.holder = null;
        return;
      case "attack":
        return attack(e.from, e.to, e.dmg);
      case "hp":
        flushSync(() => setHp((h) => ({ ...h, [e.actor]: e.value })));
        sfx.blip(10);
        return wait(150);
      case "say":
        say(e.actor, e.text);
        return wait(600);
      case "print":
        onPrint(e.text);
        sfx.blip(-3);
        return wait(250);
      case "shake":
        fx.shake(wrap.current, 10);
        sfx.hurt();
        return wait(300);
      case "banner":
        await fx.banner(e.text, { size: 28, hold: 0.25 });
        return;
      case "wait":
        return wait(e.ms);
    }
  }

  useImperativeHandle(ref, () => ({
    async run(effects) {
      // Effects can be started from React effects; flushSync needs to run outside of render.
      await Promise.resolve();
      for (const e of effects ?? []) await one(e);
    },
    reset() {
      setTags({});
      setHp({});
      setBubbles({});
      state.current.holder = null;
      state.current.cloneHolder = null;
      gsap.set([itemRef.current, ghostRef.current, chainRef.current], { autoAlpha: 0 });
      void exit("ally", true);
    },
    async attackEnemy() {
      if (!state.current.visible.enemy) return;
      await attack("hero", "enemy", 1);
      setEnemyHpState((s) => ({ ...s, hp: Math.max(0, s.hp - 1) }));
    },
    async enemyAttack() {
      if (!state.current.visible.enemy) {
        fx.shake(wrap.current, 10);
        await hitFlash("hero");
        return;
      }
      await attack("enemy", "hero");
    },
    healEnemy() {
      setEnemyHpState((s) => ({ hp: s.hp + 1, max: Math.max(s.max, s.hp + 1) }));
      fx.float(actor.enemy.current, "+1", "var(--good)", 14);
    },
    setEnemyHp(h, max) {
      setEnemyHpState({ hp: h, max });
      void enter("enemy");
    },
    async enemyDefeated() {
      const el = actor.enemy.current;
      if (!state.current.visible.enemy) return;
      sfx.boom();
      fx.flash("var(--white)", 0.6);
      fx.burst(el, { count: 30, spread: 140, colors: ["var(--gold)", "var(--red)", "var(--white)", "var(--good)"] });
      await gsap.to(body.enemy.current, { opacity: 0, duration: 0.06, repeat: 9, yoyo: true, ease: "steps(1)" });
      await gsap.to(el, { y: GROUND, scaleY: 0, autoAlpha: 0, duration: 0.3, transformOrigin: "50% 100%" });
      state.current.visible.enemy = false;
    },
    heroSay(text) { say("hero", text); },
    heroCheer() {
      gsap.fromTo(actor.hero.current, { y: topY("hero") }, { y: topY("hero") - 10, duration: 0.15, yoyo: true, repeat: 1, ease: "power1.out" });
    },
    root: () => wrap.current,
  }));

  const enemySprite = enemy;
  const dark = boss;

  return (
    <div ref={wrap} style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "var(--p3)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style={{ display: "block", overflow: "visible" }}>
        <Backdrop theme={theme} dark={dark} cloudsRef={clouds} />

        {(["hero", "ally", "enemy"] as ActorId[]).map((id) => {
          const sz = size(id);
          const tag = tags[id];
          const label = tag ? (tag.value != null ? `${tag.text} = ${tag.value}` : tag.text) : "";
          const tagW = Math.max(14, label.length * 5 + 6);
          const bubble = bubbles[id] ?? "";
          const bw = Math.max(16, bubble.length * 5 + 8);
          return (
            <g key={id} ref={actor[id]}>
              <g ref={body[id]}>
                <SpriteG name={id === "enemy" ? enemySprite : id} scale={sz / 16} flip={id === "enemy"} />
              </g>
              {/* variable binding label */}
              <g ref={tagRef[id]} transform={`translate(${sz / 2} -4)`} style={{ visibility: tag ? "visible" : "hidden" }}>
                <rect x={-tagW / 2} y={-9} width={tagW} height={9} fill={tag?.dead ? "var(--p1)" : "var(--p0)"} />
                <rect x={-1.5} y={0} width={3} height={2} fill={tag?.dead ? "var(--p1)" : "var(--p0)"} />
                <text x={0} y={-2.4} textAnchor="middle" fontSize={5} fill={tag?.dead ? "var(--p2)" : "var(--gold)"} style={{ fontFamily: "var(--font-pixel)" }}>
                  {label}
                </text>
                {tag?.dead && <line x1={-tagW / 2 + 1} x2={tagW / 2 - 1} y1={-4.5} y2={-4.5} stroke="var(--red)" strokeWidth={1.2} />}
              </g>
              {/* speech bubble */}
              <g ref={bubbleRef[id]} transform={`translate(${sz / 2} ${tag ? -16 : -6})`} style={{ visibility: "hidden" }}>
                <rect x={-bw / 2} y={-11} width={bw} height={10} fill="var(--white)" stroke="var(--p0)" strokeWidth={1} />
                <rect x={-2} y={-1.5} width={4} height={2} fill="var(--white)" />
                <text x={0} y={-4} textAnchor="middle" fontSize={5} fill="var(--p0)" style={{ fontFamily: "var(--font-pixel)" }}>{bubble}</text>
              </g>
              {/* world hp (a variable's value) */}
              {hp[id] != null && (
                <g transform={`translate(${sz / 2 - 12} ${GROUND - topY(id) + 4})`}>
                  {Array.from({ length: Math.min(8, hp[id]!) }).map((_, i) => (
                    <rect key={i} x={i * 3.2} y={0} width={2.4} height={3} fill="var(--red)" />
                  ))}
                  <text x={26} y={3} fontSize={4} fill="var(--p0)" style={{ fontFamily: "var(--font-pixel)" }}>{hp[id]}</text>
                </g>
              )}
              {id === "enemy" && (
                <g ref={enemyBarRef} transform={`translate(${sz / 2 - 16} ${-(tag ? 18 : 6)})`}>
                  <rect x={-1} y={-1} width={34} height={5} fill="var(--p0)" />
                  <rect x={0} y={0} width={32} height={3} fill="var(--p1)" />
                  <rect x={0} y={0} width={(32 * enemyHp.hp) / Math.max(1, enemyHp.max)} height={3} fill={enemyHp.hp / enemyHp.max > 0.3 ? "var(--good)" : "var(--red)"} style={{ transition: "width 250ms steps(4)" }} />
                </g>
              )}
            </g>
          );
        })}

        <line ref={chainRef} stroke="var(--gold)" strokeWidth={1.5} strokeDasharray="2 2" />
        <g ref={itemRef}>
          <SpriteG name={itemKind} scale={1.5} />
        </g>
        <g ref={ghostRef}>
          <SpriteG name={itemKind} scale={1.5} />
          {ghostLabel && (
            <text x={6} y={-2} textAnchor="middle" fontSize={5} fill={ghostLabel === "&mut" ? "var(--red)" : "var(--blue)"} stroke="var(--white)" strokeWidth={0.4} style={{ fontFamily: "var(--font-pixel)" }}>
              {ghostLabel}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
});

function Backdrop({ theme, dark, cloudsRef }: { theme: Theme; dark: boolean; cloudsRef: React.RefObject<SVGGElement | null> }) {
  const sky = dark ? "var(--p1)" : "var(--p3)";
  const cloud = (x: number, y: number, k: number) => (
    <g key={`${x}-${k}`} transform={`translate(${x} ${y})`} fill={dark ? "var(--p2)" : "var(--white)"}>
      <rect x={4} y={0} width={12} height={3} />
      <rect x={0} y={3} width={22} height={4} />
    </g>
  );
  return (
    <g>
      <rect x={-EXT} y={-EXT} width={W + EXT * 2} height={H + EXT} fill={sky} />
      {/* dithered horizon band */}
      {Array.from({ length: 360 }).map((_, i) => (
        <rect key={i} x={-EXT + i * 4 + ((i % 2) * 2)} y={46 + (i % 3)} width={2} height={2} fill="var(--p2)" opacity={0.6} />
      ))}
      {dark && <g><rect x={200} y={10} width={12} height={12} fill="var(--red)" /><rect x={188} y={12} width={16} height={8} fill="var(--red)" /></g>}
      <g ref={cloudsRef}>
        {[-2 * W, -W, 0, W, 2 * W, 3 * W].map((off) => [cloud(off + 20, 10, 1), cloud(off + 110, 18, 2), cloud(off + 180, 8, 3)])}
      </g>
      {/* far mountains */}
      {[-3, -2, -1, 0, 1, 2, 3].map((k) => (
        <polygon key={k} transform={`translate(${k * W} 0)`} points={`0,60 30,36 52,52 80,28 112,56 140,34 170,58 200,30 240,60 240,70 0,70`} fill="var(--p2)" />
      ))}
      {/* theme silhouettes */}
      {theme === "village" &&
        [-226, -180, -112, -44, 14, 60, 128, 196, 254, 300, 368, 436].map((x, i) => (
          <g key={i} transform={`translate(${x} ${i % 2 ? 58 : 60})`} fill="var(--p1)">
            <polygon points="0,8 10,0 20,8" />
            <rect x={2} y={8} width={16} height={12} />
            <rect x={8} y={13} width={4} height={7} fill="var(--p2)" />
          </g>
        ))}
      {theme === "mountain" &&
        Array.from({ length: 22 }).map((_, i) => {
          const x = -EXT + i * 46 + (i % 3) * 7;
          const h = 22 + (i % 4) * 7;
          return (
            <g key={i} transform={`translate(${x} ${GROUND - h})`}>
              <polygon points={`0,${h} ${14 + (i % 2) * 4},0 ${30 + (i % 3) * 4},${h}`} fill="var(--p1)" />
              <polygon points={`${10 + (i % 2) * 4},${5} ${14 + (i % 2) * 4},0 ${18 + (i % 2) * 4},${5}`} fill="var(--white)" />
            </g>
          );
        })}
      {(theme === "castle" || theme === "tower") &&
        Array.from({ length: 16 }).map((_, i) => {
          const x = -EXT + i * 66;
          const h = theme === "tower" ? 34 + (i % 3) * 6 : 20 + (i % 2) * 8;
          return (
            <g key={i} transform={`translate(${x} ${GROUND - h})`} fill="var(--p1)">
              <rect x={0} y={0} width={14} height={h} />
              {[0, 5, 10].map((bx) => <rect key={bx} x={bx} y={-3} width={4} height={3} />)}
              <rect x={5} y={6} width={4} height={5} fill="var(--p2)" />
              {theme === "castle" && <rect x={14} y={h * 0.45} width={28} height={h * 0.55} />}
            </g>
          );
        })}
      {theme === "forest" &&
        Array.from({ length: 48 }).map((_, i) => (
          <g key={i} transform={`translate(${-EXT + i * 21 + 4} ${56 + (i % 3) * 3})`} fill="var(--p1)">
            <polygon points="8,0 16,12 0,12" />
            <polygon points="8,6 18,22 -2,22" />
            <rect x={6} y={22} width={4} height={6} fill="var(--p0)" />
          </g>
        ))}
      {/* ground */}
      <rect x={-EXT} y={GROUND} width={W + EXT * 2} height={H - GROUND + EXT} fill="var(--p1)" />
      <rect x={-EXT} y={GROUND} width={W + EXT * 2} height={2} fill="var(--p0)" />
      {Array.from({ length: 180 }).map((_, i) => (
        <rect key={i} x={-EXT + i * 8 + (i % 3) * 2} y={GROUND + 5 + (i % 2) * 3} width={2} height={1} fill="var(--p2)" />
      ))}
    </g>
  );
}
