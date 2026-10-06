// Headless playtest bot. Plays a lesson/exam/review like a player, answering from the content
// packs (optionally making mistakes on purpose), and saves screenshots of each beat type.
//
//   npm run playtest -- /play/rust/lesson/hello-let
//   npm run playtest -- /play/rust/exam/junior --mistakes=2 --size=390x844 --out=.playtest
//
// Needs the dev server running (BASE_URL, default http://localhost:3000) and a local Chrome
// (CHROME_PATH, default macOS location). --locale=en|es|ja picks the UI language (default en). Exit code 1 on page errors or if the run doesn't finish.
import { chromium } from "playwright-core";
import fs from "node:fs";
import { LANGUAGE_PACKS } from "../content/index.ts";
import { MESSAGES } from "../lib/i18n/messages.ts";
import { tx } from "../lib/i18n/text.ts";
import { decodeSave, encodeSave, fromBase64, toBase64 } from "../lib/save/codec.ts";
import { newSave } from "../lib/save/schema.ts";
import { completeLesson } from "../lib/save/progress.ts";

const args = process.argv.slice(2);
const opt = (k, d) => args.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const path = args.find((a) => a.startsWith("/")) ?? "/play/rust/lesson/hello-let";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const [vw, vh] = opt("size", "1280x720").split("x").map(Number);
const out = opt("out", ".playtest");
let mistakesLeft = Number(opt("mistakes", "1"));
const locale = opt("locale", "en");
const M = MESSAGES[locale];
const T = (t) => tx(t, locale);
fs.mkdirSync(out, { recursive: true });

const all = LANGUAGE_PACKS.flatMap((p) => [...p.regions.flatMap((r) => r.lessons.flatMap((l) => l.beats)), ...p.exams.flatMap((e) => e.questions)]);
const norm = (s) => (s ?? "").replace(/\s+/g, "");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const context = await browser.newContext({ viewport: { width: vw, height: vh } });
await context.addCookies([{ name: "locale", value: locale, url: BASE }]);

// A fresh save in slot 1 with every lesson before the target already cleared, so any lesson is reachable.
const [, , langSlug, kind, target] = path.split("/");
const pack = LANGUAGE_PACKS.find((p) => p.slug === langSlug);
let save = newSave("BOT");
if (pack && kind === "lesson") {
  const world = { regions: pack.regions.map((r) => ({ ...r, status: r.status ?? "active", lessons: r.lessons.map((l) => ({ slug: l.slug, title: l.title, mode: l.mode, xp: l.xp })) })) };
  for (const l of world.regions.flatMap((r) => r.lessons)) {
    if (l.slug === target) break;
    save = completeLesson(save, langSlug, world, l, { score: 500, mistakes: 0, maxCombo: 3, correct: 5, attempts: [] }).save;
  }
}
if (pack) save.langs[langSlug] = { ...(save.langs[langSlug] ?? { lessons: {}, reviews: {}, exams: {} }), landedAt: Date.now() };
// Review runs need due "wandering bugs": seed the first questions of the first lesson.
let seeded = [];
if (pack && kind === "review") {
  const first = pack.regions[0].lessons[0];
  seeded = first.beats.map((b, i) => ({ b, i })).filter(({ b }) => !["dialog", "act", "run"].includes(b.kind)).slice(0, 3).map(({ i }) => `${first.slug}#${i}`);
  for (const k of seeded) save.langs[langSlug].reviews[k] = { box: 1, due: Date.now() - 1000 };
}
const encodedSave = toBase64(await encodeSave(save));
await context.addInitScript((b64) => {
  if (!localStorage.getItem("bwq:slot:1")) { localStorage.setItem("bwq:slot:1", b64); localStorage.setItem("bwq:active", "1"); }
}, encodedSave);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
let lastBeat = "";
page.on("crash", () => { console.log(`✗ page crashed (last beat: ${lastBeat})`); process.exit(1); });
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
page.on("worker", (w) => { if (process.env.PLAYTEST_DEBUG) console.log("worker started:", w.url()); });
await page.goto(BASE + path);
const sleep = (ms) => page.waitForTimeout(ms);
let n = 0;
const shot = (name) => page.screenshot({ path: `${out}/${String(n++).padStart(2, "0")}-${name}.png` });
const seen = new Set();
const once = async (k) => { if (!seen.has(k)) { seen.add(k); await sleep(600); await shot(k); } };

// Pre-lesson timer modal (lessons, bosses, reviews): pick a mode and start.
const timerStart = page.locator(`[aria-labelledby="timer-title"] button`, { hasText: M["timer.start"] });
if (await timerStart.waitFor({ timeout: 6000 }).then(() => true, () => false)) {
  await sleep(500);
  await shot("timer");
  if (process.env.PLAYTEST_TIMER) await page.locator(`[aria-labelledby="timer-title"] [role="radio"]`).nth(["off", "relaxed", "normal", "fast"].indexOf(process.env.PLAYTEST_TIMER)).click();
  await timerStart.click();
}
await sleep(4500);
let finished = false;
let helped = !process.env.PLAYTEST_HELP;
for (let step = 0; step < 200 && !finished; step++) {
  if (await page.locator(`text=${M["lesson.gameOver"]}`).count()) { await shot("gameover"); console.log("GAME OVER"); break; }
  if (await page.locator(`text=/${[M["common.maxCombo"], M["exam.byTopic"], M["exam.saveError"]].map(esc).join("|")}/`).count()) { await sleep(3500); await shot("result"); finished = true; break; }
  const dialog = page.locator(`button[aria-label="${M["dialog.continue"]}"]`);
  if (await dialog.count()) { await once("dialog"); await dialog.click(); await sleep(120); await dialog.click({ timeout: 300 }).catch(() => {}); await sleep(450); continue; }
  const prompt = ((await page.locator("main p.pixel").first().textContent({ timeout: 300 }).catch(() => "")) ?? "").replace(/^▶ /, "");
  const code = norm(await page.locator("main pre.codeblock").first().innerText({ timeout: 300 }).catch(() => ""));
  const cands = all.filter((b) => T(b.prompt) === prompt);
  // Match on the full code shown (every segment around the ___ slot), not just a prefix:
  // many questions share the same opening lines.
  const fits = (b) => !b.code || b.code.split("___").every((seg) => code.includes(norm(seg)));
  const beat = cands.find(fits) ?? cands.find((b) => code.includes(norm(b.code?.split("___")[0]).slice(0, 30))) ?? cands[0];
  if (!beat) { await sleep(400); continue; }
  lastBeat = `${beat.kind} "${prompt}"`;
  // PLAYTEST_HELP=1: on the first multiple-choice question, open the guidebook and spend a hint.
  if (!helped && (beat.kind === "pick" || beat.kind === "predict")) {
    helped = true;
    const explain = page.locator(`main button[aria-label="${M["lesson.explain"]}"]`);
    if (await explain.count()) {
      await explain.click(); await sleep(700); await shot("guidebook");
      await page.locator(`[aria-labelledby="note-title"] button`, { hasText: M["note.back"] }).click(); await sleep(500);
    }
    const hintBtn = page.locator(`main button[aria-label="${M["lesson.hint"]}"]`);
    if (await hintBtn.count() && await hintBtn.isEnabled()) { await hintBtn.click(); await sleep(700); await shot("hint"); }
  }
  if (process.env.PLAYTEST_DEBUG) console.log(`step ${step}: ${lastBeat}`);
  try {
    if (beat.kind === "act") {
      const btn = page.locator("main button.btn.primary:not([disabled]), main button.btn.good").first();
      if (await btn.count()) { await btn.click(); await sleep(1500); await once("act"); } else await sleep(300);
    } else if (beat.kind === "pick" || beat.kind === "predict") {
      await once(beat.kind);
      const grid = page.locator("main div[style*='grid'] button.btn");
      if (mistakesLeft > 0) {
        mistakesLeft--;
        const wrong = T(beat.options.find((_, i) => i !== beat.answer));
        await grid.filter({ hasText: new RegExp(`^${esc(wrong)}$`) }).first().click({ timeout: 2000 });
        await sleep(900); await once("wrong");
      }
      await grid.filter({ hasText: new RegExp(`^(✓ )?${esc(T(beat.options[beat.answer]))}$`) }).first().click({ timeout: 2000 }).catch(() => {});
      await sleep(2900);
    } else if (beat.kind === "type") {
      await page.locator(`input[aria-label="${M["type.aria"]}"]`).pressSequentially(beat.answer, { delay: 50 });
      await once("type"); await sleep(2800);
    } else if (beat.kind === "order") {
      for (const line of beat.lines) {
        await page.locator("main div[style*='column'] button.btn").filter({ hasText: line.trim() }).first().click({ timeout: 2000 });
        await sleep(220);
      }
      await once("order"); await sleep(2600);
    } else if (beat.kind === "run") {
      await page.locator(`textarea[aria-label="${M["run.editor"]}"]`).fill(beat.solution ?? beat.starter);
      await page.locator("button", { hasText: M["run.run"].replace("▶ ", "") }).click();
      await page.waitForSelector(`text=/${[M["run.ok"], M["run.offlineOk"], M["run.compileError"]].map((x) => esc(x.replace(/^[✓✗] /, ""))).join("|")}/`, { timeout: 30000 }).catch(() => {});
      if (!seen.has("run")) { seen.add("run"); await shot("run"); } // capture before the game moves on
      await sleep(2800);
    }
  } catch (e) {
    console.log(`step ${step} (${beat.kind}): ${String(e).split("\n")[0]}`);
  }
}
// The result must be persisted in the save slot.
let persisted = true;
if (finished && pack) {
  await sleep(1200);
  const b64 = await page.evaluate(() => localStorage.getItem("bwq:slot:1"));
  const after = b64 ? await decodeSave(fromBase64(b64)) : null;
  const rec = after?.langs[langSlug];
  persisted = kind === "lesson" ? !!rec?.lessons[target]?.doneAt
    : kind === "exam" ? (rec?.exams[target]?.attempts ?? 0) > 0
    : kind === "review" ? seeded.every((k) => (rec?.reviews[k]?.box ?? 0) >= 1 && (rec?.reviews[k]?.due ?? 0) > Date.now()) : true;
  console.log(persisted ? `✓ saved · xp ${after?.stats.xp} · streak ${after?.stats.streak}` : "✗ result was not saved to the slot");
}
console.log(finished ? `✓ finished ${path}` : `✗ did not finish ${path}`, `· screenshots in ${out}/`);
if (errors.length) console.log("page errors:", errors);
await browser.close();
process.exit(finished && persisted && !errors.length ? 0 : 1);
