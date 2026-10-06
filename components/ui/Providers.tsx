"use client";
import { useEffect } from "react";
import { PALETTES, applyPalette, type PaletteId } from "@/lib/palette";
import { sfx } from "@/lib/sfx";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bwq:palette") as PaletteId | null;
      if (saved && saved in PALETTES) applyPalette(saved);
    } catch {}
    // Browsers only allow audio after a user gesture, and mobile Safari only from some of them
    // (touchend/click, not touchstart). Keep trying on every gesture until audio really runs.
    const events = ["pointerdown", "pointerup", "touchend", "click", "keydown"] as const;
    const unlock = () => {
      if (sfx.unlock()) events.forEach((ev) => window.removeEventListener(ev, unlock, true));
    };
    events.forEach((ev) => window.addEventListener(ev, unlock, true));
    // iOS suspends audio when the tab is hidden; resume it when the player comes back.
    const onVisible = () => { if (document.visibilityState === "visible") sfx.wake(); };
    document.addEventListener("visibilitychange", onVisible);
    // A pinch zoom would break the game's fixed 16:9 frame: block it (Safari ignores the viewport
    // meta for pinch, so its gesture events are cancelled here too).
    const noGesture = (e: Event) => e.preventDefault();
    const noPinch = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };
    document.addEventListener("gesturestart", noGesture);
    document.addEventListener("touchmove", noPinch, { passive: false });
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, unlock, true));
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("gesturestart", noGesture);
      document.removeEventListener("touchmove", noPinch);
    };
  }, []);
  return <>{children}</>;
}
