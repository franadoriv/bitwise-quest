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
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
let lastBeat = "";
page.on("crash", () => { console.log(`✗ page crashed (last beat: ${lastBeat})`); process.exit(1); });
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
await page.goto(BASE + path);
const sleep = (ms) => page.waitForTimeout(ms);
let n = 0;
const shot = (name) => page.screenshot({ path: `${out}/${String(n++).padStart(2, "0")}-${name}.png` });
const seen = new Set();
const once = async (k) => { if (!seen.has(k)) { seen.add(k); await sleep(600); await shot(k); } };

await sleep(4500);
let finished = false;
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
console.log(finished ? `✓ finished ${path}` : `✗ did not finish ${path}`, `· screenshots in ${out}/`);
if (errors.length) console.log("page errors:", errors);
await browser.close();
process.exit(finished && !errors.length ? 0 : 1);
