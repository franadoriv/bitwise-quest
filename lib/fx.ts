"use client";
import gsap from "gsap";

// Screen-space juice: particles, floating numbers, banners, flashes, shakes.
// Everything lives in one fixed overlay so effects can cross component boundaries.

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function layer(): HTMLElement {
  let el = document.getElementById("fx-layer");
  if (!el) {
    el = document.createElement("div");
    el.id = "fx-layer";
    Object.assign(el.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "800", overflow: "hidden" });
    document.body.appendChild(el);
  }
  return el;
}

export function centerOf(el: Element | null | undefined): { x: number; y: number } {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function make(tag: string, css: Partial<CSSStyleDeclaration>, text?: string) {
  const el = document.createElement(tag);
  Object.assign(el.style, { position: "absolute", left: "0", top: "0", ...css });
  if (text) el.textContent = text;
  layer().appendChild(el);
  return el;
}

export const fx = {
  burst(at: Element | { x: number; y: number } | null, opts: { colors?: string[]; count?: number; spread?: number; size?: number } = {}) {
    const p = at && "getBoundingClientRect" in at ? centerOf(at) : (at as { x: number; y: number }) ?? centerOf(null);
    const colors = opts.colors ?? ["var(--gold)", "var(--white)", "var(--good)"];
    const count = reduced() ? 4 : opts.count ?? 14;
    const spread = opts.spread ?? 90;
    for (let i = 0; i < count; i++) {
      const s = (opts.size ?? 6) * (Math.random() > 0.7 ? 1.6 : 1);
      const el = make("div", { width: `${s}px`, height: `${s}px`, background: colors[i % colors.length] });
      const ang = Math.random() * Math.PI * 2;
      const dist = spread * (0.4 + Math.random() * 0.8);
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist;
      gsap.set(el, { x: p.x - s / 2, y: p.y - s / 2 });
      gsap
        .timeline({ onComplete: () => el.remove() })
        .to(el, { x: `+=${dx}`, y: `+=${dy - 30}`, duration: 0.35, ease: "power2.out" })
        .to(el, { y: `+=${60 + Math.random() * 40}`, opacity: 0, duration: 0.5, ease: "power2.in" });
    }
  },

  float(at: Element | { x: number; y: number } | null, text: string, color = "var(--gold)", size = 16) {
    const p = at && "getBoundingClientRect" in at ? centerOf(at) : (at as { x: number; y: number }) ?? centerOf(null);
    const el = make("div", {
      fontFamily: "var(--font-pixel)",
      fontSize: `${size}px`,
      color,
      textShadow: "3px 3px 0 var(--p0), -2px -2px 0 var(--p0), 2px -2px 0 var(--p0), -2px 2px 0 var(--p0)",
      whiteSpace: "nowrap",
    }, text);
    const w = el.offsetWidth;
    gsap.set(el, { x: p.x - w / 2, y: p.y - 10, scale: 0.3 });
    gsap
      .timeline({ onComplete: () => el.remove() })
      .to(el, { scale: 1.2, y: "-=24", duration: 0.18, ease: "back.out(3)" })
      .to(el, { scale: 1, duration: 0.1 })
      .to(el, { y: "-=30", opacity: 0, duration: 0.6, delay: 0.25, ease: "power1.in" });
  },

  banner(text: string, opts: { color?: string; size?: number; hold?: number; y?: number } = {}) {
    return new Promise<void>((resolve) => {
      const size = Math.min(opts.size ?? 34, window.innerWidth / Math.max(6, text.length) * 1.4);
      const el = make("div", {
        width: "100%",
        textAlign: "center",
        fontFamily: "var(--font-pixel)",
        fontSize: `${size}px`,
        color: opts.color ?? "var(--gold)",
        textShadow: "4px 4px 0 var(--p0), -3px -3px 0 var(--p0), 3px -3px 0 var(--p0), -3px 3px 0 var(--p0), 0 8px 0 var(--red)",
      }, text);
      const y = (opts.y ?? 0.38) * window.innerHeight;
      gsap.set(el, { y, scale: 3, opacity: 0 });
      gsap
        .timeline({ onComplete: () => { el.remove(); resolve(); } })
        .to(el, { scale: 1, opacity: 1, duration: 0.22, ease: "power4.in" })
        .to(el, { x: () => (Math.random() - 0.5) * 8, duration: 0.05, repeat: 3, yoyo: true })
        .to(el, { x: 0, duration: 0.01 })
        .to(el, { x: window.innerWidth, opacity: 0, duration: 0.25, delay: opts.hold ?? 0.45, ease: "power2.in" });
    });
  },

  flash(color = "var(--white)", strength = 0.5) {
    if (reduced()) return;
    const el = make("div", { inset: "0", width: "100%", height: "100%", background: color, opacity: String(strength) });
    gsap.to(el, { opacity: 0, duration: 0.3, onComplete: () => el.remove() });
  },

  shake(el: Element | null, intensity = 8) {
    if (!el || reduced()) return;
    gsap.fromTo(
      el,
      { x: 0 },
      { keyframes: [{ x: -intensity }, { x: intensity }, { x: -intensity / 2 }, { x: intensity / 2 }, { x: 0 }], duration: 0.3, ease: "none", clearProps: "x" },
    );
  },

  pop(el: Element | null, scale = 1.25) {
    if (!el) return;
    gsap.fromTo(el, { scale }, { scale: 1, duration: 0.3, ease: "back.out(4)" });
  },

  /** Flies a text token from one element to another (used when picking an option). */
  fly(from: Element | null, to: Element | null, text: string) {
    return new Promise<void>((resolve) => {
      if (!from || !to || reduced()) return resolve();
      const a = centerOf(from);
      const b = centerOf(to);
      const el = make("div", {
        fontFamily: "var(--font-code)",
        fontSize: "24px",
        color: "var(--p0)",
        background: "var(--gold)",
        padding: "0 6px",
        whiteSpace: "nowrap",
      }, text);
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      gsap.set(el, { x: a.x - w / 2, y: a.y - h / 2 });
      gsap.to(el, {
        keyframes: [
          { x: (a.x + b.x) / 2 - w / 2, y: Math.min(a.y, b.y) - 60, duration: 0.14, ease: "power1.out" },
          { x: b.x - w / 2, y: b.y - h / 2, duration: 0.14, ease: "power1.in" },
        ],
        onComplete: () => { el.remove(); resolve(); },
      });
    });
  },
};

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
