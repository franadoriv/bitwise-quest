// Regenerates the README screenshots in docs/screenshots (dev server must be running).
//   BASE_URL=http://localhost:3000 node scripts/shots.mjs
import { chromium } from "playwright-core";
import { LANGUAGE_PACKS } from "../content/index.ts";
import { encodeSave, toBase64 } from "../lib/save/codec.ts";
import { newSave, langOf } from "../lib/save/schema.ts";
import { completeLesson } from "../lib/save/progress.ts";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "docs/screenshots";
const rust = LANGUAGE_PACKS.find((p) => p.slug === "rust");
const world = { regions: rust.regions.map((r) => ({ ...r, status: r.status ?? "active", lessons: r.lessons.map((l) => ({ slug: l.slug, title: l.title, mode: l.mode, xp: l.xp })) })) };

// a mid-game save: first four regions cleared with mixed stars
async function makeSave(name, upTo) {
  let s = newSave(name);
  let i = 0;
  for (const l of world.regions.flatMap((r) => r.lessons)) {
    if (l.slug === upTo) break;
    s = completeLesson(s, "rust", world, l, { score: 700, mistakes: i++ % 3, maxCombo: 5, correct: 7, attempts: [] }).save;
  }
  langOf(s, "rust").landedAt = Date.now();
  s.player.playMs = 3 * 3600_000 + 17 * 60_000;
  return toBase64(await encodeSave(s));
}
const slots = { 1: await makeSave("Ada", "threads-and-move"), 2: await makeSave("Linus", "boss-lifetimes"), 4: await makeSave("Grace", "one-owner"), 7: await makeSave("Ferris", "skill-contract") };

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errors = [];
async function page({ locale = "en", palette = "orange", viewport = { width: 1280, height: 720 }, scale = 1 } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale });
  await ctx.addCookies([{ name: "locale", value: locale, url: BASE }]);
  await ctx.addInitScript(({ slots, palette }) => {
    for (const [k, v] of Object.entries(slots)) localStorage.setItem(`bwq:slot:${k}`, v);
    localStorage.setItem("bwq:active", "1");
    localStorage.setItem("bwq:palette", palette);
  }, { slots, palette });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  return p;
}
const dialogs = async (p, label, n) => {
  for (let i = 0; i < n; i++) { const d = p.locator(`button[aria-label="${label}"]`); await d.click({ timeout: 5000 }); await p.waitForTimeout(150); await d.click({ timeout: 300 }).catch(() => {}); await p.waitForTimeout(500); }
};
const act = async (p, labels) => { for (const l of labels) { await p.locator("main button", { hasText: l }).click(); await p.waitForTimeout(2300); } };

let p = await page();
await p.goto(BASE + "/"); await p.waitForTimeout(2600);
await p.screenshot({ path: `${OUT}/title.png` });
await p.goto(BASE + "/saves"); await p.waitForTimeout(2000);
await p.screenshot({ path: `${OUT}/memory-card.png` });
await p.goto(BASE + "/galaxy"); await p.waitForTimeout(3500);
await p.screenshot({ path: `${OUT}/galaxy.png` });
await p.locator('button[aria-label="Next planet"]').click(); await p.waitForTimeout(2200);
await p.screenshot({ path: `${OUT}/galaxy-go.png` });
await p.goto(BASE + "/play/rust"); await p.waitForTimeout(4500);
await p.screenshot({ path: `${OUT}/map.png` });
await p.goto(BASE + "/play/rust/lesson/one-owner"); await p.waitForTimeout(4500);
await dialogs(p, "Continue dialog", 2);
await act(p, ["FORGE", "GIVE TO b", "USE a"]);
await p.screenshot({ path: `${OUT}/lesson-act.png` });
await p.close();

for (const pal of ["gb", "nes"]) {
  p = await page({ palette: pal });
  await p.goto(BASE + "/play/rust/lesson/clone"); await p.waitForTimeout(4500);
  await dialogs(p, "Continue dialog", 1);
  await act(p, ["FORGE", "CLONE"]);
  await p.screenshot({ path: `${OUT}/palette-${pal}.png` }); await p.close();
}
for (const [loc, label, labels] of [["ja", "会話をすすめる", ["きたえる", "b にわたす", "a を使う"]], ["es", "Continuar diálogo", ["FORJAR", "DAR A b", "USAR a"]]]) {
  p = await page({ locale: loc });
  await p.goto(BASE + "/play/rust/lesson/one-owner"); await p.waitForTimeout(4500);
  await dialogs(p, label, 2);
  await act(p, labels);
  await p.screenshot({ path: `${OUT}/locale-${loc}.png` }); await p.close();
}
p = await page({ viewport: { width: 390, height: 844 }, scale: 2 });
await p.goto(BASE + "/play/rust/lesson/borrowing"); await p.waitForTimeout(4500);
await dialogs(p, "Continue dialog", 1);
await act(p, ["FORGE", "LEND"]);
await p.screenshot({ path: `${OUT}/mobile.png` }); await p.close();

console.log(errors.length ? `✗ ${errors.join(" | ")}` : "✓ screenshots written to docs/screenshots");
await browser.close();
