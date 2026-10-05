import type { Beat, Text } from "../../lib/content/types.ts";
export { L } from "../../lib/i18n/text.ts";

// Small helpers to keep lesson files compact. Pass localized text: say(L("Hi", "Hola", "やあ")).
export const say = (text: Text, extra: Partial<Beat> = {}): Beat => ({ kind: "dialog", speaker: "master", text, ...extra }) as Beat;
export const enemySays = (text: Text): Beat => ({ kind: "dialog", speaker: "enemy", text });
