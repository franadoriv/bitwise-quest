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
    // Browsers only allow audio after a user gesture.
    const unlock = () => sfx.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  return <>{children}</>;
}
