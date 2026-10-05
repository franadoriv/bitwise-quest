// Retro palettes shared by CSS (as custom properties), SVG sprites and the Three.js map.
// p0..p3 are the 4-tone ramp (dark → light). The rest are accents used for feedback.
export type PaletteId = "orange" | "gb" | "nes";

export const PALETTE_ORDER: PaletteId[] = ["orange", "gb", "nes"];
export const DEFAULT_PALETTE: PaletteId = "orange";

export interface Palette {
  id: PaletteId;
  name: string;
  p0: string;
  p1: string;
  p2: string;
  p3: string;
  red: string;
  gold: string;
  blue: string;
  skin: string;
  white: string;
  good: string;
  purple: string;
  cyan: string;
}

export const PALETTES: Record<PaletteId, Palette> = {
  orange: {
    id: "orange",
    name: "NARANJA",
    p0: "#2a1206",
    p1: "#8a3510",
    p2: "#e8741f",
    p3: "#ffc56b",
    red: "#c81d25",
    gold: "#fff2a6",
    blue: "#2f6db5",
    skin: "#ffe0bd",
    white: "#fff8ea",
    good: "#a8ec4f",
    purple: "#7b4bb5",
    cyan: "#3fb8c8",
  },
  gb: {
    id: "gb",
    name: "GAME BOY",
    p0: "#0f380f",
    p1: "#306230",
    p2: "#8bac0f",
    p3: "#9bbc0f",
    red: "#b8312f",
    gold: "#f2c94c",
    blue: "#3a6ea5",
    skin: "#e8c9a0",
    white: "#e0f8d0",
    good: "#d6f26b",
    purple: "#4b5a8a",
    cyan: "#5fa8a0",
  },
  nes: {
    id: "nes",
    name: "NES",
    p0: "#0f0f1b",
    p1: "#3e3b65",
    p2: "#8a8fc4",
    p3: "#e9eaf7",
    red: "#e43b44",
    gold: "#feae34",
    blue: "#0099db",
    skin: "#f6c79e",
    white: "#ffffff",
    good: "#63c74d",
    purple: "#8a4fd8",
    cyan: "#2ce8f5",
  },
};

export function applyPalette(id: PaletteId) {
  const p = PALETTES[id];
  const root = document.documentElement;
  root.dataset.palette = id;
  for (const k of ["p0", "p1", "p2", "p3", "red", "gold", "blue", "skin", "white", "good", "purple", "cyan"] as const) {
    root.style.setProperty(`--${k}`, p[k]);
  }
}

export function currentPalette(): PaletteId {
  if (typeof document === "undefined") return DEFAULT_PALETTE;
  const id = document.documentElement.dataset.palette as PaletteId;
  return id in PALETTES ? id : DEFAULT_PALETTE;
}
