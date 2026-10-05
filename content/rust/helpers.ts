import type { Beat } from "../../lib/content/types.ts";

// Small helpers to keep lesson files compact.
export const say = (text: string, extra: Partial<Beat> = {}): Beat => ({ kind: "dialog", speaker: "master", text, ...extra }) as Beat;
export const enemySays = (text: string): Beat => ({ kind: "dialog", speaker: "enemy", text });
