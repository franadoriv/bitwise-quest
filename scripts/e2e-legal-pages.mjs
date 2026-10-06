// Public policy access and keyboard navigation must work before a player signs in.
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import fs from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = ".playtest/legal";
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const errors = [];
try {
  for (const locale of ["en", "es", "ja"]) {
    for (const portrait of [false, true]) {
      const context = await browser.newContext({ viewport: portrait ? { width: 390, height: 844 } : { width: 1280, height: 720 } });
      await context.addCookies([{ name: "locale", value: locale, url: base }]);
      const page = await context.newPage();
      page.on("pageerror", (error) => errors.push(error.message));
      for (const kind of ["privacy", "terms"]) {
        const response = await page.goto(`${base}/${kind}`);
        assert.equal(response.status(), 200);
        // Google and readers receive the actual policy in the initial response.
        assert.match(await response.text(), /legal-article/);
        assert.match(await response.text(), /mailto:/);
        await page.locator(".game-frame").waitFor({ state: "visible" });
        assert.equal(await page.locator("[data-save-choice]").count(), 0);
        assert.equal(await page.locator(".legal-article").evaluate((el) => el.scrollWidth > el.clientWidth + 2), false);
        await page.screenshot({ path: `${out}/${locale}-${portrait ? "portrait" : "landscape"}-${kind}.png` });
        await page.locator(".legal-article footer").scrollIntoViewIfNeeded();
        const contact = page.locator('.legal-article a[href^="mailto:"]');
        assert.equal(await contact.count(), 1);
        assert.equal(await contact.getAttribute("href"), `mailto:${await contact.textContent()}`);
        await page.screenshot({ path: `${out}/${locale}-${portrait ? "portrait" : "landscape"}-${kind}-footer.png` });
      }
      await page.goto(base);
      await page.locator(".game-frame").waitFor({ state: "visible" });
      await page.locator('.title-legal a[href="/privacy"]').focus();
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("href")), "/privacy");
      await page.keyboard.press("Enter");
      await page.waitForURL(`${base}/privacy`);
      await page.waitForTimeout(450); // A leaked title-screen start timer would navigate to /saves.
      assert.equal(new URL(page.url()).pathname, "/privacy");
      await page.locator('.legal-nav a[href="/"]').click();
      await page.waitForURL(`${base}/`);
      await page.locator('.title-legal a[href="/terms"]').click();
      await page.waitForURL(`${base}/terms`);
      await page.goto(`${base}/saves`);
      await page.locator("[data-save-choice]").waitFor();
      await page.locator('.save-choice a[href="/privacy"]').click();
      await page.waitForURL(`${base}/privacy`);
      await context.close();
    }
  }
  assert.deepEqual(errors, []);
  console.log("✓ public policy pages, initial HTML, EN/ES/JA layouts, keyboard and pre-login links");
} finally { await browser.close(); }
