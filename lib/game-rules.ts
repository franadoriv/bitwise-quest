// Pure game math shared by client and server.
export const levelFromXp = (xp: number) => Math.floor(Math.sqrt(xp / 40)) + 1;
export const xpForLevel = (level: number) => (level - 1) * (level - 1) * 40;

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current: xp - base, needed: next - base, ratio: (xp - base) / (next - base) };
}

export const starsFor = (mistakes: number) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);

export const today = () => new Date().toISOString().slice(0, 10);
