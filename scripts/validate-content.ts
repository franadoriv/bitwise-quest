// Content validator. Run: `npm run content:check` (structure) or `npm run content:verify`
// (structure + compiles every `check`/`solution` with the language runner).
// Exit code 1 when anything is wrong, so it can gate CI and LLM-generated content.
import { LANGUAGE_PACKS } from "../content/index.ts";
import type { Beat, Effect, LanguagePack, SnippetCheck } from "../lib/content/types.ts";
import { LOCALES, isLocalized, tx, type Text } from "../lib/i18n/text.ts";
import { PACK_SPRITES } from "../content/sprites.ts";
import type { CodeLang } from "../lib/content/types.ts";
import { executeJs } from "../lib/runners/js-core.ts";
import { typecheck } from "./ts-check.ts";
import { wrapSnippet } from "./snippet-wrap.ts";
import { runAll, VERIFIABLE_LANGS } from "./remote-run.ts";

const VERIFY = process.argv.includes("--verify");
const ONLY = process.argv.find((a) => a.startsWith("--lang="))?.slice(7);
/** --only=<text>: report and verify only items whose location contains <text> (e.g. a region slug or "exam:"). */
const FILTER = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const inScope = (where: string) => !FILTER || where.includes(FILTER);

const ACTORS = ["hero", "ally", "enemy"];
const ITEMS = ["sword", "potion", "gem", "shield", "scroll", "key"];
const EFFECTS = ["enter", "exit", "tag", "untag", "value", "dead", "item", "give", "clone", "lend", "drop", "attack", "hp", "say", "print", "shake", "banner", "wait"];
const THEMES = ["village", "forest", "mountain", "castle", "tower"];
// Built-in sprites (components/pixel/sprites.ts) usable as enemies or guides; packs add their own in content/sprites.ts.
const BUILTIN_SPRITES = ["slime", "ghost", "golem", "dragon", "hero", "ally", "master"];
const LEGEND = new Set([".", "0", "1", "2", "3", "r", "y", "b", "s", "w", "g", "p", "c"]);
const spriteExists = (id: string) => BUILTIN_SPRITES.includes(id) || id in PACK_SPRITES;

function checkSprites() {
 for (const [id, rows] of Object.entries(PACK_SPRITES)) {
  const where = `sprite ${id}`;
  if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(id)) err(where, 'ids must be namespaced "<lang>/<name>"');
  if (!rows.length || rows.length > 24) err(where, `height ${rows.length} (1-24 rows)`);
  const w = rows[0]?.length ?? 0;
  rows.forEach((r, i) => {
    if (r.length !== w) err(where, `row ${i} is ${r.length} wide, expected ${w}`);
    for (const ch of r) if (!LEGEND.has(ch)) { err(where, `row ${i} uses unknown color "${ch}"`); break; }
  });
 }
}

const errors: string[] = [];
const warnings: string[] = [];
const err = (where: string, msg: string) => { if (inScope(where)) errors.push(`✗ ${where}: ${msg}`); };
const warn = (where: string, msg: string) => { if (inScope(where)) warnings.push(`! ${where}: ${msg}`); };

/** Prose must exist in every locale. `max` is the latin-script budget; Japanese gets ~65% of it. */
function prose(where: string, field: string, t: Text | undefined, max?: number) {
  if (t == null) return err(where, `missing ${field}`);
  if (!isLocalized(t)) return err(where, `${field} must be localized { ${LOCALES.join(", ")} }, got a plain string ${JSON.stringify(t).slice(0, 40)}`);
  for (const l of LOCALES) {
    const v = t[l]?.trim();
    if (!v) err(where, `${field}.${l} is empty`);
    else if (max) {
      const limit = l === "ja" ? Math.ceil(max * 0.65) : max;
      if (v.length > limit) warn(where, `${field}.${l} is ${v.length} chars (budget ${limit})`);
    }
  }
}

/** Options may be plain (code tokens) or localized (prose); never a partially localized object. */
function option(where: string, o: Text) {
  if (typeof o === "string") return;
  if (!isLocalized(o)) err(where, `option ${JSON.stringify(o).slice(0, 40)} must be a string or { ${LOCALES.join(", ")} }`);
  else prose(where, "option", o);
}

interface Job { where: string; program: string; compiles: boolean; stdout?: string; contains?: string; throws?: string; lang: CodeLang }

const codeLangOf = (p: LanguagePack): CodeLang => p.codeLang ?? (p.slug === "rust" ? "rust" : "ts");
let LANG: CodeLang = "rust"; // code language of the pack being checked
const jobs: Job[] = [];

function checkEffects(where: string, effects: Effect[] | undefined) {
  for (const e of effects ?? []) {
    if (!EFFECTS.includes(e.t)) err(where, `unknown effect "${e.t}"`);
    if ("actor" in e && !ACTORS.includes(e.actor)) err(where, `unknown actor "${e.actor}"`);
    if ("to" in e && !ACTORS.includes(e.to)) err(where, `unknown actor "${e.to}"`);
    if (e.t === "item" && !ITEMS.includes(e.kind)) err(where, `unknown item "${e.kind}"`);
    if (e.t === "say" || e.t === "banner") prose(where, `${e.t}.text`, e.text, 22);
    if (e.t === "tag" && e.text.length > 22) warn(where, `tag "${e.text}" is long for an in-world label (>22 chars)`);
  }
}

const slots = (code: string) => code.split("___").length - 1;

function buildProgram(code: string, check: SnippetCheck, fill?: string) {
  if (check.program) return check.program;
  const body = fill != null ? code.replace("___", fill) : code;
  return wrapSnippet(LANG, body);
}

function checkBeat(where: string, b: Beat, pack: LanguagePack) {
  if (b.hint != null) prose(where, "hint", b.hint, 120);
  checkEffects(where, b.setup);
  checkEffects(where, b.win);
  switch (b.kind) {
    case "dialog":
      prose(where, "text", b.text, 140);
      break;
    case "act":
      prose(where, "prompt", b.prompt, 70);
      if (!b.steps.length) err(where, "act without steps");
      b.steps.forEach((s, i) => {
        checkEffects(`${where} step ${i}`, s.effects);
        prose(`${where} step ${i}`, "label", s.label, 16);
        if (s.error) prose(`${where} step ${i}`, "error.plain", s.error.plain, 120);
      });
      break;
    case "pick":
    case "predict": {
      prose(where, "prompt", b.prompt, 60);
      prose(where, "explain", b.explain, 160);
      b.options.forEach((o) => option(where, o));
      if (b.kind === "pick" && slots(b.code) !== 1) err(where, `pick needs exactly one ___ (found ${slots(b.code)})`);
      if (b.options.length < 2 || b.options.length > 4) err(where, `needs 2-4 options (has ${b.options.length})`);
      if (new Set(b.options.map((o) => tx(o, "en"))).size !== b.options.length) err(where, "duplicate options");
      if (b.answer < 0 || b.answer >= b.options.length) err(where, `answer ${b.answer} out of range`);
      if (b.check) {
        jobs.push({ lang: LANG, where, program: buildProgram(b.code, b.check, b.kind === "pick" ? tx(b.options[b.answer], "en") : undefined), compiles: b.check.compiles, stdout: b.check.stdout, throws: b.check.throws });
        if (b.kind === "pick" && b.check.wrongFail && !b.check.program) {
          b.options.forEach((o, i) => { if (i !== b.answer) jobs.push({ lang: LANG, where: `${where} (wrong option "${tx(o, "en")}")`, program: buildProgram(b.code, b.check!, tx(o, "en")), compiles: false }); });
        }
      } else if (pack.runner && /compil|print|imprime/i.test(tx(b.prompt, "en") + tx(b.prompt, "es"))) warn(where, "claims compiler behavior but has no `check`");
      break;
    }
    case "type":
      prose(where, "prompt", b.prompt, 60);
      prose(where, "explain", b.explain, 160);
      if (slots(b.code) !== 1) err(where, `type needs exactly one ___ (found ${slots(b.code)})`);
      if (b.answer !== b.answer.trim() || !b.answer) err(where, "answer must be non-empty and trimmed");
      if (b.check) jobs.push({ lang: LANG, where, program: buildProgram(b.code, b.check, b.answer), compiles: b.check.compiles, stdout: b.check.stdout, throws: b.check.throws });
      break;
    case "order": {
      prose(where, "prompt", b.prompt, 60);
      prose(where, "explain", b.explain, 160);
      if (b.lines.length < 2) err(where, "order needs at least 2 lines");
      const trimmed = b.lines.map((l) => l.trim());
      if (new Set(trimmed).size !== trimmed.length) err(where, "order lines must be unique (after trim)");
      if (b.check) jobs.push({ lang: LANG, where, program: buildProgram(b.lines.join("\n"), b.check), compiles: b.check.compiles, stdout: b.check.stdout, throws: b.check.throws });
      break;
    }
    case "run":
      prose(where, "prompt", b.prompt, 70);
      prose(where, "explain", b.explain, 160);
      if (!b.expect) err(where, "run needs expect");
      if (!b.solution) warn(where, "run beat without `solution` cannot be verified");
      if (b.fallback) {
        const sources = Array.isArray(b.fallback) ? b.fallback : [b.fallback];
        try {
          const res = sources.map((src) => new RegExp(src));
          res.forEach((re, k) => { if (re.test(b.starter)) err(where, `fallback[${k}] matches the starter (offline mode would accept unchanged code)`); });
          if (b.solution && !res.some((re) => re.test(b.solution!))) err(where, "no fallback regex matches the solution");
        } catch (e) {
          err(where, `invalid fallback regex: ${String(e)}`);
        }
      }
      if (b.solution) jobs.push({ lang: LANG, where: `${where} (solution)`, program: b.solution, compiles: true, contains: b.expect });
      jobs.push({ lang: LANG, where: `${where} (starter)`, program: b.starter, compiles: true, contains: `\u0000NOT:${b.expect}` });
      break;
  }
}

checkSprites();
const slugs = new Set(LANGUAGE_PACKS.map((p) => p.slug));
for (const pack of LANGUAGE_PACKS) {
  if (ONLY && pack.slug !== ONLY) continue;
  LANG = codeLangOf(pack);
  if (pack.parent) {
    const parent = LANGUAGE_PACKS.find((p) => p.slug === pack.parent);
    if (!parent) err(pack.slug, `moon of unknown planet "${pack.parent}"`);
    else if (parent.parent) err(pack.slug, "moons cannot orbit other moons");
  }
  if (slugs.size !== LANGUAGE_PACKS.length) err(pack.slug, "duplicate pack slugs");
  const lessonSlugs = new Set<string>();
  const regionSlugs = new Set(pack.regions.map((r) => r.slug));
  if (regionSlugs.size !== pack.regions.length) err(pack.slug, "duplicate region slugs");
  for (const region of pack.regions) {
    const rw = `${pack.slug}/${region.slug}`;
    prose(rw, "name", region.name, 24);
    prose(rw, "subtitle", region.subtitle, 40);
    if (!THEMES.includes(region.theme)) err(rw, `unknown theme "${region.theme}"`);
    if (region.status !== "soon" && region.lessons.length === 0) err(rw, "active region without lessons");
    if (region.status !== "soon" && region.lessons.at(-1)?.mode !== "boss") warn(rw, "last lesson of a region should be a boss");
    for (const lesson of region.lessons) {
      const lw = `${rw}/${lesson.slug}`;
      if (lessonSlugs.has(lesson.slug)) err(lw, "lesson slug must be unique within the language");
      lessonSlugs.add(lesson.slug);
      prose(lw, "title", lesson.title, 28);
      prose(lw, "enemyName", lesson.enemyName, 20);
      if (!spriteExists(lesson.enemy)) err(lw, `unknown enemy sprite "${lesson.enemy}"`);
      if (!lesson.beats.some((b) => b.kind !== "dialog" && b.kind !== "act")) err(lw, "lesson without questions");
      lesson.beats.forEach((b, i) => checkBeat(`${lw}#${i}(${b.kind})`, b, pack));
    }
  }
  prose(pack.slug, "tagline", pack.tagline, 60);
  const pw = `${pack.slug}/planet`;
  prose(pw, "name", pack.planet?.name, 20);
  prose(pw, "story", pack.planet?.story, 260);
  prose(pw, "guide.name", pack.planet?.guide?.name, 14);
  prose(pw, "guide.title", pack.planet?.guide?.title, 40);
  if (pack.planet && !spriteExists(pack.planet.guide.sprite)) err(pw, `unknown guide sprite "${pack.planet.guide.sprite}"`);
  for (const b of pack.planet?.bugs ?? []) if (!spriteExists(b)) err(pw, `unknown bug sprite "${b}"`);
  for (const c of Object.values(pack.planet?.colors ?? {})) if (c && !/^#[0-9a-f]{6}$/i.test(c)) err(pw, `color "${c}" must be #rrggbb`);
  for (const [id, t] of Object.entries(pack.topics)) prose(`${pack.slug} topic ${id}`, "name", t.name, 36);
  for (const [id, t] of Object.entries(pack.topics)) if (t.region && !regionSlugs.has(t.region)) err(`${pack.slug} topic ${id}`, `unknown region "${t.region}"`);
  const examSlugs = new Set<string>();
  for (const exam of pack.exams) {
    const ew = `${pack.slug}/exam:${exam.slug}`;
    if (examSlugs.has(exam.slug)) err(ew, "duplicate exam slug");
    prose(ew, "title", exam.title, 32);
    prose(ew, "description", exam.description, 120);
    examSlugs.add(exam.slug);
    if (exam.count > exam.questions.length) err(ew, `count ${exam.count} > bank size ${exam.questions.length}`);
    if (exam.passPct < 1 || exam.passPct > 100) err(ew, "passPct must be 1-100");
    exam.questions.forEach((q, i) => {
      if (!pack.topics[q.topic]) err(`${ew}#${i}`, `unknown topic "${q.topic}"`);
      checkBeat(`${ew}#${i}(${q.kind})`, q, pack);
    });
  }
}

async function runRust(code: string) {
  const res = await fetch("https://play.rust-lang.org/execute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ channel: "stable", mode: "debug", edition: "2021", crateType: "bin", tests: false, backtrace: false, code }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as { success: boolean; stdout: string; stderr: string };
}

async function verifyTs(tsJobs: Job[]) {
  if (!tsJobs.length) return;
  console.log(`Type-checking ${tsJobs.length} TypeScript snippets (tsc --strict) and running them...`);
  const React = await import("react");
  const ReactDOMServer = await import("react-dom/server");
  const modules: Record<string, unknown> = { react: React, "react-dom/server": ReactDOMServer };
  if (tsJobs.some((j) => /\bfrom\s*["']three["']/.test(j.program))) modules.three = await import("three");
  const diags = typecheck(tsJobs.map((j, i) => ({ id: `s${i}`, code: j.program, tsx: j.lang === "tsx" })));
  for (const [i, job] of tsJobs.entries()) {
    const d = diags.get(`s${i}`) ?? [];
    const typeOk = d.length === 0;
    const notMode = job.contains?.startsWith("\u0000NOT:");
    if (notMode) {
      // The game runs code without type-checking, so a starter is judged by what it prints at runtime.
      const r = await executeJs(job.program, { jsx: job.lang === "tsx", modules });
      if (r.ok && r.stdout.includes(job.contains!.slice(5))) err(job.where, "starter already produces the expected output");
      continue;
    }
    if (typeOk !== job.compiles) {
      err(job.where, job.compiles ? `expected to type-check but failed: ${d[0]}` : "expected a type error but it type-checks");
      continue;
    }
    if (!typeOk || (job.stdout == null && job.contains == null && job.throws == null)) continue;
    const r = await executeJs(job.program, { jsx: job.lang === "tsx", modules });
    if (job.throws != null) {
      if (r.ok || !r.stderr.includes(job.throws)) err(job.where, `expected a runtime error containing ${JSON.stringify(job.throws)}, got ${r.ok ? "no error" : JSON.stringify(r.stderr)}`);
    } else if (!r.ok) {
      err(job.where, `runtime error: ${r.stderr.split("\n")[0]}`);
    } else if (job.stdout != null && r.stdout.trim() !== job.stdout.trim()) {
      err(job.where, `stdout ${JSON.stringify(r.stdout.trim())} ≠ expected ${JSON.stringify(job.stdout)}`);
    } else if (job.contains && !r.stdout.includes(job.contains)) {
      err(job.where, `stdout ${JSON.stringify(r.stdout.trim())} does not contain ${JSON.stringify(job.contains)}`);
    }
  }
}

/** Go, C++, C# (public sandboxes, cached) and Python (Pyodide in Node): same judging rules for all. */
async function verifyRunner(lang: CodeLang, list: Job[]) {
  if (!list.length) return;
  console.log(`Verifying ${list.length} ${lang} snippets...`);
  const results = await runAll(lang, list.map((j) => j.program));
  for (const [i, job] of list.entries()) {
    const r = results[i];
    if (!r.available) { warn(job.where, "runner unavailable"); continue; }
    const compiled = r.ok || r.phase === "runtime";
    const firstErr = r.stderr.split("\n").find((l) => /error|Error/.test(l)) ?? r.stderr.split("\n")[0];
    if (job.contains?.startsWith("\u0000NOT:")) {
      if (r.ok && r.stdout.includes(job.contains.slice(5))) err(job.where, "starter already produces the expected output");
    } else if (compiled !== job.compiles) {
      err(job.where, job.compiles ? `expected to compile but failed: ${firstErr}` : "expected a compile error but it compiled");
    } else if (!compiled) {
      continue;
    } else if (job.throws != null) {
      if (r.ok || !r.stderr.includes(job.throws)) err(job.where, `expected a runtime error containing ${JSON.stringify(job.throws)}, got ${r.ok ? "no error" : JSON.stringify(r.stderr.slice(0, 160))}`);
    } else if (!r.ok) {
      err(job.where, `runtime error: ${firstErr}`);
    } else if (job.stdout != null && r.stdout.trim() !== job.stdout.trim()) {
      err(job.where, `stdout ${JSON.stringify(r.stdout.trim())} ≠ expected ${JSON.stringify(job.stdout)}`);
    } else if (job.contains && !r.stdout.includes(job.contains)) {
      err(job.where, `stdout ${JSON.stringify(r.stdout.trim())} does not contain ${JSON.stringify(job.contains)}`);
    }
  }
}

async function verify() {
  await verifyTs(jobs.filter((j) => j.lang === "ts" || j.lang === "tsx"));
  for (const lang of VERIFIABLE_LANGS) await verifyRunner(lang, jobs.filter((j) => j.lang === lang));
  const rustJobs = jobs.filter((j) => j.lang === "rust");
  jobs.splice(0, jobs.length, ...rustJobs);
  if (!jobs.length) return;
  console.log(`Verifying ${jobs.length} snippets with the Rust Playground...`);
  let i = 0;
  const worker = async () => {
    while (i < jobs.length) {
      const job = jobs[i++];
      try {
        const r = await runRust(job.program);
        const firstErr = r.stderr.split("\n").find((l) => l.startsWith("error")) ?? "";
        if (job.contains?.startsWith("\u0000NOT:")) {
          const exp = job.contains.slice(5);
          if (r.success && r.stdout.includes(exp)) err(job.where, "starter already produces the expected output");
        } else if (r.success !== job.compiles) {
          err(job.where, job.compiles ? `expected to compile but failed: ${firstErr}` : "expected a compile error but it compiled");
        } else if (job.stdout != null && r.stdout.trim() !== job.stdout.trim()) {
          err(job.where, `stdout ${JSON.stringify(r.stdout.trim())} ≠ expected ${JSON.stringify(job.stdout)}`);
        } else if (job.contains && !r.stdout.includes(job.contains)) {
          err(job.where, `stdout ${JSON.stringify(r.stdout.trim())} does not contain ${JSON.stringify(job.contains)}`);
        }
      } catch (e) {
        warn(job.where, `runner unavailable: ${String(e)}`);
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}

if (FILTER) jobs.splice(0, jobs.length, ...jobs.filter((j) => inScope(j.where)));
if (VERIFY) await verify();
for (const w of warnings) console.log(w);
for (const e of errors) console.log(e);
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)${VERIFY ? "" : `, ${jobs.length} snippet(s) verifiable with --verify`}`);
process.exit(errors.length ? 1 : 0);
