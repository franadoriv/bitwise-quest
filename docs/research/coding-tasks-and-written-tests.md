# Coding tasks and written ("no tools") coding tests

Research behind the **coding tasks** planned for entry exams and region bosses, and a design for
simulating the **written / no-tools coding rounds** that companies are bringing back because of AI
assistants. Researched October 2026; sources are listed at the end of each section and in
[Sources](#sources). Interview processes vary a lot between companies: treat this as a synthesis,
not a standard. Vendor marketing pages are cited for what the products *offer*, not as proof of how
well they work.

## Summary

- **Remote coding screens lost trust in 2025–2026.** Interviewers widely suspect AI-assisted
  cheating (81% of Big Tech interviewers in one survey; one vendor reports proctored-test cheating
  rising from 16% in 2024 to 35% in 2025). Companies answered in four ways: **(1) bring back
  in-person rounds** (Google, Cisco, McKinsey and others), **(2) lock down online tests** (paste
  blocking, full screen, tab tracking, webcam, typing-pattern and similarity analysis), **(3) change
  what is asked**: code reading, "explain this code", debugging unfamiliar code, and take-homes
  followed by a live walk-through, and **(4) allow AI assistants openly** in a dedicated round and
  grade judgment instead (Meta, Google, Canva, Coinbase).
- **Written / whiteboard coding is graded on logic, not syntax.** Graders ignore small slips
  (missing semicolons, typos) as long as the intent is unambiguous; pseudo-code earns at most about
  half credit; partial credit is common. Online assessments, in contrast, are graded by hidden test
  cases with per-test partial credit (Codility, HackerRank, CodeSignal).
- **Japan:** online coding tests (paiza, Track Test, HireRoo, AtCoder ranks / PAST) dominate
  screening and now ship paste/tab/behaviour logs. Paper-based programming is deeply familiar from
  national exams: the IT Passport/FE exam's subject B is 16 pseudo-language **trace** questions, and
  the university entrance exam's "Information I" uses the DNCL pseudo-language on paper.
- **Recommended design:** a `coding` task with two modes, **`ide`** (highlighting, run sample tests
  freely, unlimited submits) and **`paper`** (plain monospace editor, no highlighting/autocomplete,
  paste blocked, no runs, one submission judged by hidden tests on the real compiler, with one
  short *proofread* chance on a compile error). Plus two "paper" formats that need no free-text
  grading: **`trace`** (fill a trace table, verified offline by running the snippet) and
  **`debug`** (tap the buggy line, then fix it; judged by hidden tests). Score = weighted hidden
  tests passed, revealed one light at a time.

---

## 1. Findings: how hiring changed because of AI assistants

### 1.1 The trust problem

| Evidence | Source |
|---|---|
| 81% of interviewers at Big Tech / "New Big Tech" suspected AI cheating; about a third had caught a candidate | interviewing.io survey; The Pragmatic Engineer |
| Only 11% of FAANG interviewers use cheating-detection software (mostly Meta); 58% changed *question types* away from verbatim well-known problems; startups changed most (67%) | interviewing.io |
| One vendor flagged 38.5% of ~20,000 AI-run interviews (Jul 2025–Jan 2026) for cheating, 48% for software roles; CodeSignal reports proctored-assessment cheating rising from 16% (2024) to 35% (2025) | techinterview.org (secondary, quoting Fabric and CodeSignal) |
| Invisible overlay apps that hide from screen sharing are a known cheating vector; vendors now ship desktop apps to detect them | Codility; The Pragmatic Engineer |

### 1.2 Responses

**Return of in-person rounds.** Google's CEO said in a 2025 town hall that "some fraction of the
interviews" should be in person; Google piloted 2 virtual + 3–4 in-person SWE rounds. Cisco,
McKinsey and Deloitte reinstated face-to-face interviews for some roles. By early 2026 a Gartner
survey (as reported) put ~72% of recruiting leaders running at least some interviews in person,
naming fraud as the reason. Onsite loops typically contain: coding (laptop **or whiteboard**),
**debugging unfamiliar code on a shared machine**, system design on a whiteboard, and behavioural.

**Explicit "no AI" rules.** Amazon's candidate guidance: do not use generative AI tools during the
interview unless explicitly permitted; candidates caught can be disqualified.

**Changing the question, not the policing.** Formats that replaced or supplemented classic
algorithm problems (techinterview.org, interviewing.io, Coinbase write-up):

| Format | Typical length | What is graded |
|---|---|---|
| Classic algorithm problem (proctored / onsite) | 30–45 min | problem solving, correctness, complexity |
| Live debugging of an unfamiliar codebase | 45–60 min | navigation, hypotheses, minimal correct fix |
| "Explain this code" / code comprehension | 20–45 min | understanding behaviour and edge cases |
| Take-home + live walk-through | 2–8 h + 30–90 min | the follow-up is the real test: explain, modify one function live, justify a trade-off |
| AI-allowed coding round | ~60 min | judgment: verifying and correcting assistant output, decomposition, communication |
| Paid trial day/week | 1 day–1 week | real output |

Notable: Meta (from Oct 2025) runs one classic no-AI coding round **plus** one AI-enabled round in
a multi-file codebase; Google added an AI-assisted "code comprehension" round (read, debug and
optimize existing code); Coinbase replaced memorization-style rounds with repository-based coding
and debugging. The consistent lesson: **reading, tracing and debugging code are now treated as core
skills**, and they are much harder to outsource than writing a well-known function.

**Universities went back to paper.** Engineering faculties moved first-year assessments back to
pen-and-paper coding exams to counter generative-AI misuse (ASEE 2025 paper); in-person, closed-book,
handwritten exams are again described as the "gold standard" for verifying individual understanding.

### 1.3 How assessment vendors handle AI

| Vendor | Measures (as documented by the vendor) |
|---|---|
| **HackerRank** | *Secure Mode*: controlled browser, enforced full screen, **copy/paste blocked**, multiple monitors prevented, tab-switch alerts. *Proctor Mode*: adds webcam anomaly detection, screenshot analysis, AI-plagiarism model (claims 85–93% precision) on typing cadence, paste events and code patterns; MOSS similarity on by default; copy/paste tracking on by default. |
| **CodeSignal** | "Suspicion score": compares against all platform submissions and web-posted solutions, telemetry (typing/speaking patterns), **paste events flagged**; AI proctoring records video/audio/screen, human reviewers make final calls. GCA results are "certified" only if no unusual activity. |
| **Codility** | Similarity check against 12M+ assessments and leaked/AI-generated solutions (robust to renaming/reformatting); **typing-pattern detection** for retyping from another device; desktop app detecting hidden overlay tools; webcam/screen proctoring. Also offers tests "with full AI control" (allow or forbid). |
| **TestGorilla** | Disabled copy/paste, webcam snapshots every 30 s, full-screen and tab tracking, dev-tools and IP checks, randomized questions; three-tier behaviour rating. |
| **CoderPad** (live interviews) | Interviewer can **disable code execution** and **autocomplete**; optional in-pad AI assist so usage is visible instead of hidden. |
| **Karat** | Human-led interviews; 2025 "NextGen" product evaluates engineers for human + AI work. |

Common pattern: **block paste, keep the candidate in one window, log behaviour, compare to known
solutions, and let a human decide.** None of this is reliable in a consumer game, and most of it
(webcam, behaviour logs) would conflict with this project's privacy and stateless-server rules.

### 1.4 Written / whiteboard coding: format and grading

- **Environment.** Whiteboard or paper onsite; remotely, a shared text editor with **no execution
  and no autocomplete** (Google famously used a document-based editor; CoderPad can disable both).
  Candidates are told to manage braces and indentation by hand.
- **Syntax.** "Minor syntax barely counts." Stanford CS106A's exam rules state it precisely:
  *small syntax errors (forgetting semicolons, misspellings) are not penalized as long as the
  intention is clear*, but **errors that create ambiguity** (e.g. unclear loop body without braces)
  can make an answer wrong.
- **Pseudo-code.** Accepted for partial credit only: vague pseudo-code is worth almost nothing;
  precise pseudo-code of a correct algorithm earns **at most about half** (Stanford).
- **Partial credit** is normal on paper: a correct approach with a bug scores well; comments that
  reveal intent help.
- **What is really graded in interviews:** decomposition, edge cases considered, testing by hand
  (dry-running an example), and communication; final code correctness matters, but so does the
  path.
- **Online assessments, by contrast,** are graded by **hidden test cases**: Codility scores the
  percentage of assessed test cases passed (correctness + performance groups; example tests do not
  count); HackerRank sums per-test weights (hidden edge cases weighted higher, samples often worth
  0); CodeSignal's GCA (4 tasks, 70 min) allows repeated submissions and keeps the best.

### 1.5 Durations, sizes and problem types by level

| Level | Live / paper problem | Online test | Typical problems |
|---|---|---|---|
| Junior / new grad | 1 easy–medium problem in 30–45 min; solution ~10–25 lines | 2–4 tasks in 60–90 min | string and array manipulation, counting with hash maps, two pointers, simple recursion, basic SQL `SELECT`/`GROUP BY`, FizzBuzz-class warm-ups |
| Mid | 1 medium (sometimes multi-part) in 45 min; ~20–40 lines | 3–4 tasks in 70–90 min | hash map + sorting combos, sliding window, stack/queue, BFS/DFS on a grid, small class design (e.g. LRU cache, rate limiter), SQL joins/window functions, debugging a given function |
| Senior | medium–hard or multi-part with follow-ups; 45–60 min | often replaced by debugging / code review / design | extend or refactor existing code, concurrency issue, API design, "explain and fix" in an unfamiliar codebase, trade-off discussion |

Medium problems typically take 20–40 min. Senior loops shift weight to system design and
debugging/review (roughly coding 30%, design 40%, behavioural 20% of preparation).

Sources: interviewing.io; The Pragmatic Engineer; techinterview.org (two posts); GIGAZINE; Storyboard18;
Times of India (Amazon); Hello Interview (Meta); Northeastern career blog (Google); Coinbase via
ohbarye's notes; HackerRank knowledge base; CodeSignal; Codility support; TestGorilla; CoderPad docs;
Business Wire (Karat); Stanford CS106A exam strategies; ASEE PEER; Design Gurus; Code Fellows. URLs in [Sources](#sources).

---

## 2. Findings: Japan

- **Online coding tests are the standard screen.** Japanese career guides list four formats:
  online coding test, live coding, whiteboard, take-home; online is dominant since the pandemic, with
  screen-shared live coding growing. Whiteboard tests became more common as engineers (rather than HR)
  started running interviews.
- **paiza.** Problems are ranked S/A/B/C/D and solving them gives the candidate a rank S–E that
  drives job applications and scouting. Grading is by **test cases**. Using generative AI, others'
  code or hints is **explicitly treated as cheating**; submissions are checked and suspected cheaters
  can be refused job-hunting service. (A search snippet states an expected solve time of about 20
  minutes per problem; not confirmed on the fetched page.) paiza's 2025 survey: 84% of 2026–2029
  graduates use generative AI; over 90% for the 2026/2027 cohorts.
- **Track Test (Givery).** Problems written by top competitive programmers; beginner and advanced
  levels. **Action log** (paste, tab switches, session data) and **playback** of the whole coding
  process for reviewers.
- **HireRoo.** Since Oct 2024 shows an AI-computed **"suspiciousness" (不審度)** from page leaves,
  copy/paste and search time; 200+ companies (e.g. GMO Internet Group, KINTO Technologies). In
  May 2026 it added an "AI collaboration" format where assistant use is allowed and observed.
- **AtCoder.** AtCoder Jobs uses contest ratings (8 rank bands) for hiring; **PAST** (Algorithm
  Practical Skill Test) is a language-agnostic, non-knowledge-based algorithm exam companies use
  as a skill benchmark.
- **Paper programming is familiar.** The national **FE exam, subject B**: 20 multiple-choice
  questions in 100 min, 16 of them algorithms/programming in a **pseudo-language**, solved by
  **tracing** (search, sort, recursion), about 5 min per question. The university entrance exam
  subject **Information I** (from 2025) uses the **DNCL** pseudo-language, on paper, because no
  computer is available. Japanese players have trained on trace tables at school.
- **Japanese media coverage (2025–2026)** echoes the global trend: coding tests "no longer reflect
  the job", Big Tech restoring in-person interviews, and companies adding AI-allowed rounds that
  evaluate prompting, output verification and error spotting.

Sources: Geekly column; @IT (2016 whiteboard column; 2025–2026 hiring articles); paiza advice page;
CodeZine (paiza cheating policy, Track Test); ASCII/HireRoo release; HireRoo support (May 2026);
Impress/ASCII (AtCoder); kotora.jp and gihyo.jp (FE subject B); Okumura's notes and Impress (DNCL);
Business Insider Japan; Forbes Japan. URLs in [Sources](#sources).

---

## 3. What this means for the game

1. A **simulation, not proctoring.** The game cannot stop a player from using an AI assistant on a
   phone next to them, and it must not try (no webcam, no behaviour logs, no server-side data: see
   `docs/security.md` and the stateless-server rule). "Paper" mode recreates the *conditions* of a
   no-tools round (no highlighting, no runs, no paste, one shot) for practice, the way a mock exam
   does. Say so in the intro dialog; never claim "cheat detection".
2. **Hidden-test judging is the industry norm** for online tests and is exactly what the engine
   can do honestly with real compilers. Pure handwriting-style leniency is not verifiable with
   compilers (see 4.3), so the game should model leniency differently.
3. **Trace, debug and explain formats** are where hiring is moving, they are familiar to Japanese
   players (FE subject B, DNCL), and they can be graded without free-text judging.
4. Real rounds are 20–60 min per problem; a dopagaki game needs **minutes**, not half hours. Keep
   the *shape* (read → plan → write → submit → verdict) and shrink the size.

---

## 4. Recommended design

### 4.1 Task kinds

| Kind | What the player does | How it is judged |
|---|---|---|
| `coding` | Implements a function from a signature and a prompt with 1–2 examples | Engine appends hidden tests to the player's code and runs it on the pack's runner (Rust Playground, Go Playground, Godbolt, browser workers for JS/TS/Python). Score = weighted tests passed. |
| `trace` | Fills a trace table: the value of chosen variables after each marked line/iteration, or the final state | Exact match per cell (normalized as the language prints it). Answers are static content, **verified offline** by `content:verify` running an instrumented copy of the snippet. No runner at play time. |
| `debug` | Sees a function that fails a described case; taps the buggy line, then edits that line (or picks the fix from 3–4 options at junior level) | Line choice is static; the fixed code is judged by hidden tests like `coding`. |
| `explain` (structured) | "Explain this code" without free text: pick what the function does, pick its complexity, pick the input that breaks it, or order the steps of a dry run | Same as existing `pick` / `order` beats; this is mostly a framing of existing kinds under a "read only" banner. |

`coding` and `debug` are the only kinds that need a runner during play; `trace` and `explain`
work offline and on every planet.

### 4.2 Modes for `coding` and `debug`

| Rule | `ide` | `paper` |
|---|---|---|
| Editor | Syntax highlighting, auto-indent, bracket pairing | Plain monospace, **no highlighting, no autocomplete, no bracket pairing**; Tab inserts spaces; line numbers kept (paper has lines too) |
| Paste / drop | Allowed | **Blocked** inside the editor (paste and drop). IME composition must keep working (Japanese input). Starter code is pre-filled, so nothing legitimate needs pasting. |
| Running | "Run samples" as often as wanted; shows stdout and sample results | **No runs.** Samples are shown as text only (the player dry-runs them in their head, as on paper). |
| Submissions | Unlimited until time runs out; best score kept (CodeSignal style) | **One submission.** |
| Compile error on submit | Shown in full; player fixes and resubmits | **Proofread chance:** once, the engine shows only the *line number* of the first error (no message) and gives 30 s to fix it. A successful proofread caps the task at 90%. A second failure scores 0 for tests (the trace/plan bonus below can still apply). Models the interviewer saying "check line 7". |
| Guidebook / hints | Available in bosses (as today), hidden in exams | Hidden |
| Reward | Normal XP | ×1.25 XP and a "No tools" stamp on the result card |

**Is tolerating trivial syntax slips realistic and verifiable?** Realistic: yes, human graders do
it. Verifiable with real compilers: **not in general**. Silently "repairing" code (adding a missing
`;`, closing a brace) would require guessing intent, could turn wrong code into passing code, and
would differ per language. Options considered:

- *Auto-apply compiler suggestions* (e.g. rustc's machine-applicable fixes): only some languages
  offer them, the result is no longer the player's code, and it needs an extra round-trip. Rejected.
- *TypeScript type errors*: `tsc` still emits JavaScript, so a type-only error could be tolerated
  while syntax errors are not. Possible, but inconsistent across planets. Rejected for v1.
- **Proofread chance (recommended):** the compiler stays the single judge, the player fixes their
  own slip, and the cost is small and predictable. It captures the spirit of "small slips don't sink
  you" and is fully verifiable.

### 4.3 Scoring

- **Hidden tests carry weights**: basic cases 1, edge cases (empty input, one element, duplicates,
  negatives, Unicode where relevant) 2, performance cases (senior only) 2. Task score =
  passed weight / total weight. Samples shown to the player are also run but weigh 0 (Codility,
  HackerRank convention) — they confirm the verdict but do not pay.
- **Partial credit** is the point: a correct approach missing one edge case should score 70–85%, not 0.
- `trace`: per-cell credit; a wrong cell does not cascade (each row is judged against the true
  state, unlike IGCSE where one error can cost later marks; friendlier for a game).
- `debug`: 30% for the right line, 70% for the fix passing the tests.
- **Exam integration:** a coding task counts as **3 questions** worth of score in the exam
  percentage and is tagged with one topic, so the existing per-topic report and region skipping keep
  working (a task scoring ≥ 80% counts as correct for that topic).
- **Bosses:** a coding task replaces the final phase; hearts are lost only by timeouts and by
  scoring below 50%, never per failed test.
- Results stored per stable slug (best percentage, mode, passed), never the player's code. Any
  new save field follows the migration rule in `docs/save-system.md`.

### 4.4 Which levels and screens use which mode

| Screen | Formats | Mode | Size | Time limit |
|---|---|---|---|---|
| Early region bosses | `coding` | `ide` | solution ≤ 10 lines, 4–6 hidden tests | 4 min |
| Mid/late region bosses | `coding` or `debug` | `ide`; final region boss of a planet in `paper` ("the arena with no tools") | ≤ 15 lines, 6–8 tests | 5–6 min |
| Junior exam | 1 `trace` + 1 `coding` | `paper` | string/array, counting with a map, simple loop logic; ≤ 12 lines | trace 90 s, coding 6 min |
| Mid exam | 1 `debug` + 1 `coding` | `debug` in `ide`, `coding` in `paper` | map + sort, two pointers, stack, small class/struct with 2 methods; ≤ 20 lines | debug 3 min, coding 8 min |
| Senior exam | 1 `debug` (longer snippet, 20–30 lines, one subtle bug) + 1 structured `explain` set + optional `coding` | `paper` | edge cases, ownership/lifetimes/concurrency per language, complexity | debug 5 min, coding 10 min |
| Optional "Paper drill" from the planet menu | any exam task replayed | player picks `ide` or `paper` | | |

Rationale: exams simulate screenings, where "no tools" conditions are now common, so exams default
to `paper`; bosses are learning moments, so they default to `ide` and only the planet finale uses
`paper`. Time limits are ~1/5 of real rounds, matched by smaller problems; the timer is visible but
paused while the verdict animation plays. Senior emphasis follows the industry shift to reading and
debugging over writing from scratch.

**Problem types per pack:** reuse the per-language `*-hiring-assessments.md` research; across
languages favour string/array manipulation, hash-map counting, two pointers, simple recursion,
stack/queue, and a tiny class/struct design. SQL-style tasks only where a pack teaches it. Avoid
famous named problems verbatim (companies moved away from them, and they are the easiest to look up).

### 4.5 Keeping it fair

- Identical hidden tests for everyone; the result screen **reveals every hidden test** (input,
  expected, got) after submission, so a score is always explainable.
- Prompts state the signature, constraints and 1–2 examples; edge cases that will be tested are
  hinted in the constraints ("the list may be empty"), as good interview prompts do.
- Starter code compiles, so a "blank" submission fails tests rather than compilation.
- Runner unavailable (network, `BITWISE_RUNNER=off`): the task is **skipped and excluded** from the
  exam percentage with a notice, never scored 0. `trace` and `explain` never depend on the runner.
- Portrait / phone: `paper` and `coding` require a keyboard-friendly layout; on portrait offer a
  code-symbol key bar and allow switching a coding task to `trace`/`explain` alternatives so the
  exam stays completable.
- Accessibility: blocking paste must not block IME input, screen readers or keyboard navigation.
- Content rules: every `coding` task has a reference `solution` that `content:verify` runs against
  its hidden tests (all pass) and at least one known-wrong variant that must fail some tests (proves
  the tests bite). Player code is never executed on the server (existing runner rules).

### 4.6 Dopagaki pacing

Coding tasks are long beats, so break them into small wins:

1. **Read phase (15–20 s):** the guide reads the prompt aloud as dialog; tapping a sample "lights
   up" the example.
2. **Plan stamp (optional, 1 tap):** pick the approach from 3 options ("count with a map", "sort
   then scan", "two pointers"). Correct pick gives +5% and a small sound; it mirrors "talk through
   your approach" in interviews and gives a fast first reward.
3. **Write phase:** live line counter, a soft tick every minute, the hero cheers after 9 s idle (as
   today). In `paper`, the screen looks like squared exam paper with a pencil cursor.
4. **Submit:** a dramatic pause, then hidden tests reveal **one light at a time** (green/red, with
   a hit on the boss per green light and a floating score), edge-case lights bigger and louder.
5. **Debrief:** the guide explains the first failed test and shows the reference solution next to
   the player's code; the task returns in the "bug is back" review queue like other mistakes.

### 4.7 Open questions

- Whether `trace` should accept an "unchanged" ditto mark (like paper trace tables) or require every
  cell.
- Godbolt-based planets (C++, Zig, Haskell, C#) have higher latency; a per-task timeout plus a single
  batched run of all hidden tests is assumed.
- Whether senior exams should also offer an "AI-allowed review" format (judge or fix a provided,
  plausible-looking but wrong solution). It matches the industry trend and needs no assistant
  integration: the "assistant output" is just static content to review.

---

## Sources

Global hiring changes
- interviewing.io, "How is AI changing interview processes?": https://interviewing.io/blog/how-is-ai-changing-interview-processes-not-much-and-a-whole-lot
- The Pragmatic Engineer, "The Pulse #146" (in-person interviews returning): https://newsletter.pragmaticengineer.com/p/the-pulse-146
- techinterview.org, "Onsite interviews are back in 2026": https://www.techinterview.org/post/3233477250/onsite-interviews-back-2026-remote-screening-broke/
- techinterview.org, "The post-LLM coding interview format": https://www.techinterview.org/post/3233474920/post-llm-coding-interview-format/
- GIGAZINE, Google and others reviving face-to-face interviews (Mar 2025): https://gigazine.net/gsc_news/en/20250316-ai-tech-hiring
- Storyboard18, Google to reintroduce in-person interviews: https://www.storyboard18.com/brand-makers/google-to-reintroduce-in-person-interviews-amid-rising-ai-cheating-concerns-79624.htm
- Times of India, Amazon's no-GenAI interview guidance: https://timesofindia.indiatimes.com/technology/tech-news/amazon-to-job-seekers-to-ensure-a-fair-and-transparent-recruitment-process-please-do-not-/articleshow/118626691.cms
- Hello Interview, Meta AI-enabled coding interview: https://hellointerview.com/blog/meta-ai-enabled-coding
- Northeastern University career blog, Google's AI-assisted coding interview (2026): https://careers.northeastern.edu/blog/2026/05/13/googles-ai-assisted-coding-interview-2026-guide/
- ohbarye, notes on Coinbase's interview redesign: https://scrapbox.io/ohbarye/Interviewing_Engineers_in_the_AI_Era:_Lessons_from_a_Year_of_Rebuilding
- Fabric, how AI cheating changed take-home assignments: https://www.fabrichq.ai/blogs/how-ai-cheating-killed-take-home-assignments
- ASEE PEER, "Stepping back from a digital age: paper-and-pen coding exams in a post-GenAI world": https://peer.asee.org/stepping-back-from-a-digital-age-paper-and-pen-coding-exams-in-a-post-genai-world
- Design Gurus, problem duration by difficulty: https://designgurus.io/answers/detail/how-long-should-a-coding-problem-take-in-an-interview

Written coding: format and grading
- Stanford CS106A, Exam Strategies (syntax, pseudo-code, partial credit): https://web.stanford.edu/class/archive/cs/cs106a/cs106a.1184/handouts/15%20-%20Exam%20Strategies.pdf
- Code Fellows, coding in a document editor for interviews: https://www.codefellows.org/blog/setting-up-google-docs-for-technical-interview-happiness
- Save My Exams, IGCSE trace table questions: https://www.savemyexams.com/igcse/computer-science/cie/23/revision-notes/11-exam-technique/structuring-your-responses/how-to-answer-trace-table-questions

Assessment vendors
- HackerRank, Test Integrity / Secure and Proctor modes: https://hackerrank-knowledge-base.help.usepylon.com/articles/1079706165
- HackerRank, AI Plagiarism Detection: https://hackerrank-knowledge-base.help.usepylon.com/articles/7287334157-ai-plagiarism-detection
- HackerRank, test cases in coding questions: https://hackerrank-knowledge-base.help.usepylon.com/articles/3245197419
- CodeSignal, cheating and fraud: https://codesignal.com/cheating-and-fraud/
- CodeSignal, General Coding Assessment structure: https://support.codesignal.com/hc/en-us/articles/360040370853
- Codility, detecting AI cheating: https://www.codility.com/blog/detecting-ai-cheating-technical-assessment-integrity/
- Codility, Similarity Check improvements: https://support.codility.com/hc/en-us/articles/32149320196625-Improvements-to-Similarity-Check
- Codility, how tasks are scored: https://support.codility.com/hc/en-us/articles/360043318374
- TestGorilla, anti-cheating features: https://www.testgorilla.com/blog/talent-assessment-tools-anti-cheating/
- CoderPad, pad settings (execution, autocomplete): https://coderpad.io/resources/docs/interview/pads/settings
- CoderPad, cheating prevention: https://coderpad.io/resources/docs/cheating-prevention-in-interview/
- Business Wire, Karat NextGen (Dec 2025): https://www.businesswire.com/news/home/20251210685922/en

Japan
- Geekly, engineer coding tests (formats): https://www.geekly.co.jp/column/cat-jobsearch/selection/engineer_codingtest/
- @IT, "エンジニアのキャンバス、その名はホワイトボード" (2016): https://atmarkit.itmedia.co.jp/ait/articles/1604/25/news016_2.html
- paiza, スキルチェックとは: https://paiza.jp/advice/what-is-skillcheck
- CodeZine, paiza (generative AI and cheating policy, 2025 survey): https://codezine.jp/article/detail/22209
- CodeZine, Track Test (action log, playback): https://codezine.jp/article/detail/18172
- ASCII, HireRoo suspiciousness detection (Oct 2024): https://ascii.jp/elem/000/004/230/4230036/
- HireRoo, AI collaboration format (May 2026): https://support.hireroo.io/en/recruiters/release-ai-collaboration-format
- Impress Internet Watch, AtCoder hiring services: https://internet.watch.impress.co.jp/docs/news/1219838.html
- ASCII, AtCoder / PAST: https://ascii.jp/elem/000/004/007/4007016/
- kotora.jp, FE exam subject B: https://www.kotora.jp/c/120168-2/
- Gijutsu-Hyoron, FE subject B pseudo-language training book (2024): https://gihyo.jp/book/2024/978-4-297-14271-1
- Okumura, notes on Information I / DNCL: https://scrapbox.io/okumura/%E9%AB%98%E6%A0%A1%E3%80%8C%E6%83%85%E5%A0%B1I%E3%80%8D%E3%80%8C%E6%83%85%E5%A0%B1II%E3%80%8D
- Impress Kodomo IT, DNCL: https://www.watch.impress.co.jp/kodomo_it/news/1367503.html
- Business Insider Japan, AI and software-engineering hiring (Jan 2026): https://www.businessinsider.jp/article/2601-how-ai-integration-transforming-software-engineering-hiring/
- Forbes Japan, hiring in the AI era: https://forbesjapan.com/articles/detail/90798
