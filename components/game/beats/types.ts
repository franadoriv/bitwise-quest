import type { StageHandle } from "../Stage";

export interface BeatCtx {
  lang: string;
  /** Wrong answer. Only the first one per beat costs a heart. */
  wrong(at?: Element | null): void;
  /** Beat solved; the game takes over (rewards, animations, next beat). */
  solved(at?: Element | null): void;
  /** Something small and good happened (a correct char, a placed line...). */
  tick(at?: Element | null): void;
  stage: StageHandle | null;
  print(text: string): void;
  busy: boolean;
}

export const shuffle = <T,>(arr: T[], seed: number) => {
  const a = arr.map((v, i) => ({ v, i }));
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
