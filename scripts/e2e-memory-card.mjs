// End-to-end check of the memory card: new game, galaxy, landing, export, import, overwrite warning.
//   BASE_URL=http://localhost:3000 npm run e2e [-- --out=.playtest/memory-card]
import { chromium } from "playwright-core";
import fs from "node:fs";
import { decodeSave } from "../lib/save/codec.ts";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const out = process.argv.find((a) => a.startsWith("--out="))?.slice(6) ?? ".playtest/memory-card";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, acceptDownloads: true });
await context.addCookies([{ name: "locale", value: "en", url: BASE }]);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
let n = 0;
const shot = (name) => page.screenshot({ path: `${out}/${String(n++).padStart(2, "0")}-${name}.png` });
const step = async (name, fn) => { await fn(); await page.waitForTimeout(900); await shot(name); console.log("✓", name); };
const slot = (i) => page.locator(`button[aria-label="Slot ${i}"]`);

await page.goto(BASE + "/");
await page.waitForTimeout(1500);
await step("title", async () => {});
await step("memory-card", async () => { await page.locator("text=PRESS START").click(); await page.waitForURL("**/saves"); });
await step("name-entry", async () => { await slot(1).click(); });
await step("galaxy", async () => {
  await page.locator('input[aria-label="YOUR NAME"]').fill("Ada");
  await page.locator("button", { hasText: "START" }).click();
  await page.waitForURL("**/galaxy");
  await page.waitForTimeout(2500);
});
await step("landing", async () => { await page.locator("button", { hasText: "LAND" }).click(); await page.waitForURL("**/play/rust"); await page.waitForTimeout(3000); });
await step("map", async () => { await page.locator("button", { hasText: "I JUST WANT TO SEE THE MAP" }).click(); });

// back to the card, export slot 1
await page.goto(BASE + "/saves");
await page.waitForTimeout(1500);
await slot(1).hover();
const [download] = await Promise.all([page.waitForEvent("download"), page.locator("button", { hasText: "EXPORT" }).click()]);
const file = `${out}/${download.suggestedFilename()}`;
await download.saveAs(file);
const decoded = await decodeSave(new Uint8Array(fs.readFileSync(file)));
console.log("✓ exported", download.suggestedFilename(), "→ player", decoded.player.name, "landed:", !!decoded.langs.rust?.landedAt);
if (!/^BitwiseQuest_Ada_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.bwq$/.test(download.suggestedFilename())) errors.push("bad export file name");

// import into an empty slot
await step("import-pick", async () => { await page.locator('input[type="file"]').setInputFiles(file); });
await step("import-done", async () => { await slot(3).click(); });
// import again onto the filled slot 1 → overwrite warning
await step("overwrite-warning", async () => { await page.locator('input[type="file"]').setInputFiles(file); await page.waitForTimeout(500); await slot(1).click(); });
if (!(await page.locator("text=/Slot 1 holds/").count())) errors.push("overwrite warning not shown");
await step("overwrite-done", async () => { await page.locator("button", { hasText: "CONFIRM" }).click(); });
// a tampered file is rejected
const bad = new Uint8Array(fs.readFileSync(file)); bad[bad.length - 2] ^= 0xff; fs.writeFileSync(`${out}/tampered.bwq`, bad);
await step("tampered-rejected", async () => { await page.locator('input[type="file"]').setInputFiles(`${out}/tampered.bwq`); });
if (!(await page.locator("text=/modified or damaged/").count())) errors.push("tampered file was not rejected");

const slots = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("bwq:slot:")).sort());
console.log("slots in storage:", slots.join(", "));
if (slots.join() !== "bwq:slot:1,bwq:slot:3") errors.push(`unexpected slots: ${slots.join()}`);
console.log(errors.length ? `✗ errors: ${errors.join(" | ")}` : "✓ no page errors");
await browser.close();
process.exit(errors.length ? 1 : 0);
