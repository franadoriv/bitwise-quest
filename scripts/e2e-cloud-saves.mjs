// Browser integration tests with a simulated Supabase transport. No requests reach the real project.
import { chromium } from "playwright-core";
import nextEnv from "@next/env";
import fs from "node:fs";
import assert from "node:assert/strict";
import { encodeSave } from "../lib/save/codec.ts";
import { newSave } from "../lib/save/schema.ts";

nextEnv.loadEnvConfig(process.cwd());
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const CLOUD = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!CLOUD) throw new Error("Cloud E2E needs NEXT_PUBLIC_SUPABASE_URL and the publishable key at build/dev time");
const project = new URL(CLOUD).hostname.split(".")[0];
const out = ".playtest/cloud";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errors = [];
const rows = new Map();
let writes = 0;
const uid = "00000000-0000-4000-8000-000000000001";
const contexts = [];
const sessionFor = (id) => {
  const payload = { sub: id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated", aud: "authenticated" };
  return {
    access_token: `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.test`,
    refresh_token: "test-only", expires_at: payload.exp, expires_in: 3600, token_type: "bearer",
    user: { id, aud: "authenticated", role: "authenticated", email: "player@example.test", app_metadata: { provider: "google" }, user_metadata: {}, created_at: new Date().toISOString() },
  };
};
async function device({ user = uid, locale = "en", viewport = { width: 1280, height: 720 }, guest = false } = {}) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  contexts.push(context);
  await context.addCookies([{ name: "locale", value: locale, url: BASE }]);
  if (user) await context.addInitScript(({ session, project }) => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem(`sb-${project}-auth-token`, JSON.stringify(session));
      localStorage.setItem("bwq:save-mode", "cloud"); sessionStorage.setItem("seeded", "yes");
    }
  }, { session: sessionFor(user), project });
  if (guest) {
    const bytes = Buffer.from(await encodeSave(newSave("GUEST"))).toString("base64");
    await context.addInitScript((data) => { if (!localStorage.getItem("bwq:slot:1")) localStorage.setItem("bwq:slot:1", data); }, bytes);
  }
  let offline = false;
  await context.route(`${CLOUD}/**`, async (route) => {
    if (offline) return route.abort("internetdisconnected");
    const req = route.request(); const url = new URL(req.url());
    const reply = (data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data), headers: { "access-control-allow-origin": BASE } });
    if (url.pathname === "/rest/v1/cloud_saves") return reply([...rows.values()].filter((r) => r.user_id === user));
    if (url.pathname === "/rest/v1/rpc/sync_cloud_save") {
      const { p_slot: slot, p_expected_revision: revision, p_data: data } = req.postDataJSON();
      const key = `${user}:${slot}`; const previous = rows.get(key);
      if ((previous?.revision ?? 0) !== revision) return reply([]);
      const next = { user_id: user, slot, revision: revision + 1, data };
      rows.set(key, next); writes++; return reply([next]);
    }
    if (url.pathname === "/auth/v1/token") return reply(sessionFor(user));
    if (url.pathname === "/auth/v1/user") return reply(sessionFor(user).user);
    if (url.pathname === "/auth/v1/logout") return route.fulfill({ status: 204 });
    if (url.pathname === "/auth/v1/authorize") return reply({});
    throw new Error(`Unexpected mocked cloud endpoint: ${url.pathname}`);
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    // Intentional simulated network failures are expected; CSP/runtime failures are not.
    if (msg.type() === "error" && !/ERR_INTERNET_DISCONNECTED|Failed to fetch|net::ERR_FAILED/.test(msg.text())) errors.push(msg.text());
  });
  return { page, context, offline: (value) => { offline = value; } };
}
const slot = (page, n) => page.locator(`button[aria-label="Slot ${n}"]`);
const settled = async (page) => { await page.locator(".cloud-status").filter({ hasText: "CLOUD SAVED" }).waitFor(); };
async function importSave(page, name) {
  const buffer = Buffer.from(await encodeSave(newSave(name)));
  await page.locator('input[type="file"]').setInputFiles({ name: `${name}.bwq`, mimeType: "application/octet-stream", buffer });
  await slot(page, 1).click();
  await page.getByRole("button", { name: "CONFIRM", exact: true }).click();
  await slot(page, 1).filter({ hasText: name }).waitFor();
}
try {
  if (!process.argv.includes("--layouts-only")) {
  const a = await device({ guest: true });
  await a.page.goto(`${BASE}/saves`);
  await settled(a.page);
  assert.equal(await a.page.getByText("GUEST", { exact: true }).count(), 0, "guest slots are isolated from the account");
  await slot(a.page, 1).click();
  await a.page.getByRole("textbox", { name: "YOUR NAME" }).fill("ADA");
  await a.page.getByRole("button", { name: "START ▶", exact: true }).click();
  await a.page.waitForURL("**/galaxy");
  await settled(a.page);
  assert.equal(rows.get(`${uid}:1`).data.player.name, "ADA");
  console.log("✓ new account save is uploaded from gameplay");

  const b = await device();
  await b.page.goto(`${BASE}/saves`); await settled(b.page);
  await slot(b.page, 1).filter({ hasText: "ADA" }).waitFor();
  const writesBefore = writes; await b.page.reload(); await settled(b.page);
  assert.equal(writes, writesBefore, "restoring a save does not write it back");
  await b.page.screenshot({ path: `${out}/restored.png` });
  console.log("✓ another device restores the save without redundant writes");

  b.offline(true);
  await importSave(b.page, "OFFLINE");
  await b.page.locator(".cloud-status").filter({ hasText: "CLOUD UNAVAILABLE" }).waitFor();
  await a.page.goto(`${BASE}/saves`); await settled(a.page);
  await importSave(a.page, "ONLINE"); await settled(a.page);
  b.offline(false);
  await b.page.evaluate(() => window.dispatchEvent(new Event("online")));
  try { await b.page.getByRole("dialog").waitFor(); }
  catch (error) {
    await b.page.screenshot({ path: `${out}/conflict-failed.png` });
    console.log("sync state", await b.page.locator(".cloud-toolbar").innerText(),
      await b.page.evaluate(() => Object.entries(localStorage).filter(([k]) => k.includes(":journal:"))));
    console.log("remote", [...rows.values()].map((r) => ({ slot: r.slot, revision: r.revision, name: r.data?.player.name })));
    throw error;
  }
  await b.page.getByText("OFFLINE ·", { exact: false }).waitFor();
  await b.page.getByText("ONLINE ·", { exact: false }).waitFor();
  await b.page.screenshot({ path: `${out}/conflict.png` });
  await b.page.getByRole("button", { name: "KEEP CLOUD VERSION" }).click();
  await settled(b.page);
  await slot(b.page, 1).filter({ hasText: "ONLINE" }).waitFor();
  await b.page.getByRole("button", { name: "RECOVER BACKUP" }).click();
  await slot(b.page, 2).click(); await slot(b.page, 2).filter({ hasText: "OFFLINE" }).waitFor(); await settled(b.page);
  assert.equal(rows.get(`${uid}:2`).data.player.name, "OFFLINE");
  console.log("✓ offline conflict, explicit cloud choice and recovery of the other version");

  const other = await device({ user: "00000000-0000-4000-8000-000000000002" });
  await other.page.goto(`${BASE}/saves`); await settled(other.page);
  assert.equal(await other.page.getByText("ONLINE", { exact: true }).count(), 0);
  // Export from cloud, switch to the independent local card, and import the identical file.
  await b.page.bringToFront(); await settled(b.page);
  await slot(b.page, 2).hover();
  let exported;
  try {
    [exported] = await Promise.all([
      b.page.waitForEvent("download", { timeout: 10000 }),
      b.page.locator("footer button", { hasText: "EXPORT" }).click(),
    ]);
  } catch (error) {
    await b.page.screenshot({ path: `${out}/export-failed.png` });
    console.log("export errors", errors, await b.page.locator("footer").innerText());
    throw error;
  }
  await exported.saveAs(`${out}/cloud-to-local.bwq`);
  await b.page.getByRole("button", { name: "CHANGE SAVE MODE" }).click();
  await b.page.locator('[data-option="local"]').click();
  await slot(b.page, 1).waitFor();
  await b.page.locator('input[type="file"]').setInputFiles(`${out}/cloud-to-local.bwq`);
  await slot(b.page, 3).click(); await slot(b.page, 3).filter({ hasText: "OFFLINE" }).waitFor();
  // Returning to cloud uses the existing login and preserves its separate slots.
  await b.page.getByRole("button", { name: "CONNECT CLOUD" }).click();
  await b.page.locator('[data-option="cloud"]').click();
  await settled(b.page); await slot(b.page, 1).filter({ hasText: "ONLINE" }).waitFor();
  assert.equal(await slot(b.page, 3).getByText("OFFLINE", { exact: true }).count(), 0);
  console.log("✓ cloud export imports locally, mode switching keeps separate cards");
  await a.page.getByRole("button", { name: "SIGN OUT" }).click();
  await slot(a.page, 1).filter({ hasText: "GUEST" }).waitFor();
  console.log("✓ account separation and original local card after logout");

  }

  for (const locale of ["en", "es", "ja"]) {
    for (const portrait of [false, true]) {
      const d = await device({ user: null, locale, viewport: portrait ? { width: 390, height: 844 } : { width: 1280, height: 720 } });
      await d.page.goto(`${BASE}/saves`); await d.page.locator("[data-save-choice]").waitFor(); await d.page.waitForTimeout(1800);
      await d.page.waitForFunction(() => [...document.querySelectorAll(".save-option")].every((element) => {
        const transform = getComputedStyle(element).transform;
        // Hover raises a card by four pixels after the entry animation clears its transform.
        return Math.abs(new DOMMatrix(transform === "none" ? undefined : transform).m42) < 4.1;
      }));
      assert.equal(await d.page.locator(".save-options").evaluate((el) => el.scrollWidth > el.clientWidth + 2), false, "no horizontal card overflow");
      await d.page.screenshot({ path: `${out}/${locale}-${portrait ? "portrait-top" : "landscape"}.png` });
      if (portrait) {
        await d.page.locator('[data-option="local"]').scrollIntoViewIfNeeded();
        await d.page.screenshot({ path: `${out}/${locale}-portrait-local.png` });
      }
      await d.page.locator('[data-option="local"]').click(); await slot(d.page, 1).waitFor();
      await d.page.reload(); await slot(d.page, 1).waitFor();
      assert.equal(await d.page.locator("[data-save-choice]").count(), 0, "local choice is remembered");
      await d.page.goto(`${BASE}/auth/callback?error=access_denied`);
      await d.page.locator(".save-loading button").waitFor();
      assert.equal(await d.page.locator(".save-loading").evaluate((el) => el.scrollWidth > el.clientWidth + 2), false, "cancelled login has no horizontal overflow");
      await d.page.screenshot({ path: `${out}/${locale}-${portrait ? "portrait" : "landscape"}-login-error.png` });
      await d.page.locator(".save-loading button").click(); await slot(d.page, 1).waitFor();
      await d.context.close();
    }
  }
  console.log("✓ English, Spanish, Japanese, portrait layouts and remembered local choice");
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
