# AI Trip Planner architecture walkthrough: handoff

Read this first. It replaces the earlier conversation, which happened on another account.

The project is a single interactive HTML page (`index.html`). The user will present it in an
interview-style walkthrough with a product person and an engineer. It explains the architecture of an
AI trip planner. Scope is **plan, validate, edit**. Booking and payment are out of scope.

Status on 2 Oct 2026: four tabs are built (Goals was added last, on the far left). The user likes the current state and has said they still
want "some changes", without saying which yet. **Ask them what to change next. Don't guess.**

## Where things are

| What | Where |
|---|---|
| The page (HTML, CSS, JS and icons, all inline) | `index.html`, about 3,250 lines. Open it directly in a browser. It only needs the internet for Google Fonts. |
| All work | Branch `claude/serene-goldberg-34szu0`, the only branch on GitHub. There is no `main` yet. |
| Helper scripts | `tools/build_artifact.py`, `tools/shoot.js`, `tools/sprite.py` (see below) |
| Last published version | https://claude.ai/artifact/Qn8ZB5kATKPnY9LSwcw1LQ (version 8). It belongs to the old account and is private to it. A new account cannot update it, so publish a new artifact (see Publishing). |
| Original inputs, not in the repo | `trip-planner-context.md` (design context) and `AI_Travel_Planning_Research_Expanded.pdf` (7 papers). Both are summarized below. Ask the user to re-upload them if you need more detail. |

## How the user works, and rules they set

- They build iteratively and review each version through the artifact link, giving feedback in batches.
  After each change: commit, push, republish, then reply briefly with what changed and anything they should check.
- Standing guidelines:
  - Components that get added stay on screen in later steps. Removed ones go away.
  - Super visual, minimal animation, limited text, easy to read.
  - One running example everywhere (the Japan trip below).
- Explicit decisions, don't undo them:
  - "Not bookable" (G4) is still a gap. Only actually booking and paying are out of scope.
  - G2, G7 and G8 are only *partially* solved after Flow 2 (orange), not closed.
  - No mention of the ladder labels L1, L2, L3 in the Research tab ("do not talk about our L1, L2, L3 anywhere").
  - The Architecture tab has no progress bar at the top (removed on request).
  - Revised architecture: one component in focus, the others minimized; the final step shows all of them minimized.
  - Maths appears **only** in C6 › Trip score. Everywhere else it's "How it works" plus examples.
  - The Research synthesis uses the user's exact wording (quoted in the Research section below), highlighted.

## The page

**Stage and layout**
- The design is a fixed 1440×900 stage, scaled to the window like a slide (`fit()`, `W`/`H`).
- Below 1000px wide ("narrow mode") the stage unrolls into one column and the wires are hidden.

**Look**
- All colors are tokens on `:root` (light), redefined in two dark blocks: `prefers-color-scheme` guarded by `:root:not([data-theme="light"])`, and `:root[data-theme="dark"]`.
- Fonts are Archivo (variable width) and IBM Plex Mono from Google Fonts. The accent is indigo `#3949C9`.
- Icons are Lucide `<symbol>`s in the sprite at the top of `<body>`. Use them as `<svg class="ic"><use href="#i-NAME"/></svg>`, or `ic('NAME')` in the revised-tab content. Add new ones with `tools/sprite.py`.

**Navigation**
- Four tabs with deep links: Goals (default, no hash or `#goals`), `#architecture`, `#research`, `#revised`.
- ← → keys (or PageUp/PageDown, or the round buttons top right) step through the current tab. Each tab remembers its position.
- `#now` is the step label, shown in narrow mode only.

**Script**
- One IIFE at the end of the file.
- Shared: `setTab`, `syncNav`, `step`, `fit`, plus `box`/`geom` for wire geometry.
- Architecture: `go`, `layout`, `flow`, `paintGaps`.
- Goals: `ggo`, `gsync` (sections with `data-g` reveal one per step).
- Research: `reveal`, `renderResearch`, `showPaper`.
- Revised: `rrender`, `renderFocus`, `rlayout`, `rstep`, `rclick`, `rsync`.

### Tab 0: Goals (two steps)

Built from the user's goal slide. Each → reveals one section; earlier ones stay.
- **Step 1, the goal:** "Turn user intent into a personalised, feasible and bookable trip." plus a short supporting paragraph (`.g-sub`). User inputs → AI trip planner → a bookable itinerary.
- **Step 2, what a bookable itinerary is:** it resolves where, when, where to stay, what to do and how to move. Three layers: 1 Trip structure, 2 Trip execution, 3 Bookable inventory, each with a Japan example. Beside them: a valid output must be Real, Feasible, Consistent, Measurable.
- The "Why plan the itinerary before flights and hotels?" section was removed on request.
- Takeaway: "The output is not a suggestion. It is a trip that can be booked as is."

### Tab 1: Architecture (two flows, beats 1 and 2.1–2.4)

**Flow 1, "Basic AI Search" (beat 1)**
- Left: the trip input card. Middle: an LLM with web search. Right: a prose itinerary.
- The gap board below shows G1–G10, all open (red).
- Takeaway: "AI needs factual data to plan and act."

**Flow 2, "AI armed with data" (beats 2.1–2.5)**
- 2.1: Data feeds (real-time: flights, hotels, weather; periodic: POIs, maps, festivals) flow into the travel knowledge repository. The repository is shown already filled (~100k places); there is no "empty" state and no click-through on how it is filled (removed on request). G3 and G10 close here.
- 2.2: A broken link between the repository and the LLM opens four options: RAG (shows why it fails), typed constraints, agentic search, and "the right way". RAG carries a red "Fails on exact names and IDs" flag, and its panel leads with a highlighted block of near misses (Nishi Chaya → Higashi Chaya, SQ 511 → SQ 517, H-20418 → H-20481).
- 2.3: The right way adds a query box with Trip facts, Trip dials and Residual text, each with a popover.
- 2.4: "Find candidates" (100k → 5k → 800 → 200, weighted score) returns ranked cities and activities to the LLM.
- Takeaway: "Filters make candidates valid, ranking makes them few."
- Gaps after Flow 2: closed G1, G3, G10 (G3, G10 at 2.1); partial G2, G7, G8; open G4, G5, G6, G9 ("4 open · 3 partial · 3 closed").

**Config at the top of the script**
- `FLOWS`: flows and their beats.
- `POS`: node boxes per beat.
- `WIRES`: wires between nodes.
- `FLOW`: the travelling dot.
- `GAPS`: gap state changes per beat.
- `POP_POS`: popover positions.
- `STATES`: classes that hold until a beat.
- Nodes appear and disappear by beat through `data-in`/`data-out`.

### Tab 2: Research

- Each paper card shows the Key takeaway as a full-width band right under the title (moved to the top on request).
- The tab is blank at first. Each → brings the next paper in as a large focus card, and earlier papers shrink into a timeline on the left (click one to reopen it).
- `PAPER_DATA` has seven papers:
  - 2014 Tourist Trip Design survey (Gavalas et al.)
  - 2022 Tourist Trip Design review (Ruiz-Meza & Montoya-Torres)
  - 2024 TravelPlanner (Xie et al.): GPT-4 met every constraint in 0.6% of plans (arXiv 2402.01622)
  - 2024 LLM-Modulo (Kambhampati et al.)
  - 2025 Formal verification (Hao et al.): 93.9% on TravelPlanner, in their setup
  - 2025 AoT+ structured search (Sel, Jia & Jin)
  - 2026 TravelBench (Cheng et al.): 1,100 tasks
- The last step is the synthesis card, built by `synthesisCard()`. Two boxes styled the same (no highlighted box, on request), each a list of verb + one line:
  - **The LLM: semantic interface and search partner.** Pills: not the source of truth, not the constraint solver. Understand, Clarify, Judge, Resolve, Explain.
  - **What our design depends on: deterministic tools and optimization algorithms.** Pills: same input same answer, every result traceable. Ground, Enforce, Optimize, Validate.
  - LLM points follow the revised architecture: Understand, Clarify, Judge, Resolve, Explain.
  - The user asked for these sharper points in place of their original wording; keep them short.
- A bottom takeaway appears at the end: "The LLM handles meaning. Data, solvers and validators handle guarantees."

### Tab 3: Revised architecture (where the recent work is)

**Steps**
- **Step 0:** only the trip input card and an empty itinerary.
- **Steps 1–37:** one part of one component at a time. A compact map band on top (chips; the open one highlighted), the focus card below: code, name, role, In / Out / Example, part chips, then "How it works" and "Example".
- **Step 38:** all components on a spread-out map in four lanes: Conversation (and the trip state), Judgement, Planning, Data. A legend sits bottom-left.
- No LLM / Code / Data badges anywhere (removed on request). Instead chips are tinted: LLM components violet (`--llm*` tokens, `is-llm`), data and state grey (`is-data`), code white. The focus card's code square turns violet for LLM components.
- Components with more than 6 parts (C6) show compact part chips (`.stabs.many`).

**Interaction**
- Click any revealed chip to open that component ("peek"). ←/→ move through its parts; Esc or "Back to …" returns.
- Click a part chip to jump to that part.

**Components and parts** (→ means the parts run in order). Restructured on request: the dialogue manager and the trip state are separate, and a horizontal Judgement LLM handles every judgement call.

| | Component (chip label) | Tint | Parts |
|---|---|---|---|
| C1 | Dialogue manager | LLM | Understand input → Update trip state → Clarify & offer options |
| C2 | Trip state | Data | Hard constraints · Dials & residual text · Versions |
| C3 | Candidate generator | Code | Hard-constraint filter → Semantic match (asks C5) → Preference ranker → Shortlist builder |
| C4 | Data feeds & knowledge repository (Data feeds & repository) | Data | Real-time & periodic feeds → Knowledge repository |
| C5 | Judgement LLM (full-width bar) | LLM | Semantic judge → Failure interpreter → Fix or ask → Change writer |
| C6 | Itinerary optimizer | Code | Trip score (objective, the only part with maths), then City & leg planner → Activity selector → Base locator → Day scheduler → Top-K & trade-off log → No-solution report |
| C7 | Booking option search (Booking search) | Code | Slot builder → Option ranker → Bundle assembler → No-inventory report |
| C8 | Feasibility validator | Code | Constraint checks → Repair or reject → Final scorer |
| C9 | Plan presenter & narrator (Plan presenter) | LLM | Grounded narration · Trade-off explainer · Plan comparison |
| C10 | Re-planning loop (kept as is, on request) | Code | Change triggers → Change interpreter (uses C5) → Impact analyzer → Partial re-planner |

**How the Judgement LLM works (the story to tell)**
- Code reports, the LLM decides, code applies and checks. The LLM never edits anything directly; it writes typed patches that code validates (C5 › Change writer).
- Fix quietly when inside what the traveller allowed (shojin lunch full at 10:45 → 11:30). Ask via C1 when a hard rule or real trade-off is involved (budget clash → "raise to ₹3.2 L or travel 10–16 May"). Drop when alternatives remain (plan C, no Takayama rooms).
- Only C1 (with the traveller) and C5 (approved changes) write to C2. Changes to C2 trigger C10.

**Data structures**
- **`RK`**: one entry per component with these fields:
  - `id`, `code`, `name`, `short` (chip label), `kinds`, `cls` (`is-llm` or `is-data` tint), `role`, `in`, `out`
  - `seq`: the parts run in order, so arrows are drawn
  - `obj`: the first part is the objective
  - `subs`: the parts, each with
    - `n`: name
    - `d`: one-line role on the part chip
    - `t`: short tag on the spread-out map
    - `kind`, `lead`
    - `terms`: trip-score terms it optimizes (`fit`, `cost`, `transit`, `stay`, `score`)
    - `how`: short lines
    - `math`: C6 Trip score only
    - `ex`: example HTML
- **`RSTEPS`** is derived from `RK` (start, every part, then the spread-out map at `OVER = RK.length + 1`), so adding a part needs no other change.
- **`RPOS.band` and `RPOS.over`**: chip boxes `[left, top, width, height]` in the 1376×788 view, for the band and the spread-out map. The focus card starts at `top: 226px` (`.fk` in the CSS). Lane labels and dashed rules are positioned inline in the HTML.
- **`RW`**: wires.
  - `n` is the component that reveals a wire.
  - `over: 1` wires show only on the spread-out map. All labels show only there.
  - `rgeom()` draws straight lines, plus `diag` and `arc` routes.
- **Example builders:**
  - `tb(head, rows)` makes tables; a `#` before a heading makes that column numeric.
  - Others: `pl` (pill), `eh` (heading), `note`, `msg`, `dials`, `json`, `rbars`, `slots`.
  - Charts (drawn to scale): `waterfall`, `crowdChart`, `dayStrip`.
  - `.ex2` is a two-column example; `.wide` and `.flip` change the split.

### Running example and the numbers chain

All numbers are illustrative but checked to agree across components. If you change one, update the
ones that depend on it.

**The trip**
- Japan, 2 adults, from Bengaluru, 28 Apr – 4 May (7 days, 6 nights, overlapping Golden Week).
- Interests: food, temples, photography.
- Prompt: "We're vegetarian, one of us has a bad knee, we hate crowds, and we want it to feel like old Japan."

**C2 trip state**
- Hard constraints: dates; vegetarian with no dashi; walking ≤ 4 km a day; stairs low; budget ≤ ₹3.2 L.
- How the budget got there: the traveller said ₹2.5 L, C6 found that Golden Week fares don't fit, C5 decided to ask, and C1 offered "raise to ₹3.2 L" or "travel 10–16 May".
- Dials: crowd_tolerance 0.14, pace 0.30, temples 0.80, food 0.80, photography 0.70, hidden_gem_share 0.30.
- Residual text: "feel like old Japan".

**C3**
- Places: 100k → 38k (open on the dates) → 14k (knee-safe) → 5k (veg-safe). Cities: 46 → 11.
- Weights: interests .30, old Japan .15, quality .20, price .10, crowd .20, distance .05.
- Scores: Nishi Chaya 0.86, Yanaka walk 0.83, Kinkaku-ji 0.61 (crowd .06 in Golden Week).
- Cities: Kanazawa .81, Kyoto .77, Tokyo .72, Takayama .70, Nara .66. The top 4 go to C6.

**C6 trip score**
- S = Fit − 0.15·(cost ÷ budget) − 0.016·(transit hours) − 0.02·Stay
- Stay = Σ max(0, nights − ideal)² + 0.5 per one-night stop + 3 per hotel change
- The transit weight is doubled for the knee.

**The three plans**

| Plan | Cities and nights | Fit | Cost ÷ budget | Transit | Stay | Score |
|---|---|---|---|---|---|---|
| A, Classic, slow | Tokyo 2 · Kanazawa 2 · Kyoto 2 | .88 | .91 | 9.5 h | 6 | 0.47 |
| B, Fewer moves | Tokyo 3 · Kyoto 3 | .76 | .88 | 7.5 h | 4 | 0.43 |
| C, Mountain towns | Tokyo 1 · Kanazawa 2 · Takayama 1 · Kyoto 2 | .90 | .95 | 13.3 h | 10 | 0.35 |

**C6 City & leg planner**
- City score = Σ city·(1 − e^(−nights/τ)) − 0.016·(leg hours) − 0.02·Stay, with τ = Tokyo 2, Kanazawa 2, Kyoto 3, Takayama 2.
- Ranking: A 1.13, C 1.09, Tokyo 1·Kanazawa 2·Kyoto 3 1.06, Tokyo 2·Kanazawa 1·Kyoto 3 1.04, Tokyo 2·Takayama 2·Kyoto 2 1.00, B 0.91, Tokyo 2·Kyoto 4 0.89.
- Kept: the best plan with 2, 3 and 4 cities (B, A, C).
- Plan A legs:
  - Shinkansen Tokyo → Kanazawa, 2 h 30 (day 3, 10:24)
  - Via Tsuruga to Kyoto, 2 h 10 (day 5, 10:00)
  - Haruka to KIX, 1 h 20 (day 7, 08:40)
- Day 6 is 3 May in Kyoto: Fushimi Inari at 07:00 (crowd 0.16, against 0.96 at 11:00).

**C7**
- Flights BLR → Tokyo (price / generalized cost): Singapore ₹82k / ₹115.0k, Delhi ₹68k / ₹112.2k, Bangkok ₹71k / ₹106.0k (chosen).
- Time is valued at ₹1,200 an hour per person, and each connection adds ₹5k.
- JR Pass ¥50,000 against single tickets ≈ ¥25,800.
- Bundle 1: ₹2.38 L bookable + ₹0.77 L daily spend = ₹3.15 L.

**C8**
- B is repaired on day 5: walking 4.6 → 3.4 km with a taxi. C is rejected: no Takayama rooms on 1 May.
- Final scores: A·1 0.46 (sent on), A·2 0.45, A·3 rejected (₹3.26 L, over budget), B·1 0.43 (sent on), B·2 0.42.

**C9**
- A against B: A's fit is 0.12 higher; B is ₹45k cheaper, with 2 h less transit and one move fewer.
- Explained trade-offs: Kinkaku-ji, the Inari summit, the Gion ryokan.

**C10**
- The flight via Bangkok is cancelled; the next seat lands 29 Apr at 07:40.
- Days 1–2 and the Tokyo hotel are impacted.
- A partial re-plan changes 6 things (score 0.46 → 0.43); a full re-plan changes 25 (score 0.44).

## Checking a change

```bash
python3 -c "s=open('index.html').read(); open('/tmp/page.js','w').write(s[s.index('<script>')+8:s.index('</script>')])" && node --check /tmp/page.js
node tools/shoot.js revised /tmp/shots 9 38            # light; prints every step, flags overflow
node tools/shoot.js revised /tmp/shots 9 --dark
node tools/shoot.js revised /tmp/shots 9 --phone       # also prints horizontal overflow
node tools/shoot.js architecture /tmp/shots 0 5
```

- `shoot.js` presses → to reach each listed step, saves `<tab>-<step>.png`, and on the revised tab reports any focus-card column or table that spills.
- The workflow used so far: one screenshot pass, one round of fixes, then publish.
- The last run was clean on all 39 revised steps, with no console errors. A rare "too wide" flag mid-animation does not reproduce on a re-run.

## Publishing

```bash
python3 tools/build_artifact.py /tmp/ai-trip-planner.html
```

- Publish that file as an artifact with the title "AI Trip Planner Architecture" (it's in the `<title>`) and the icon "map".
- Publish the same file path again to update the same URL.
- The copy drops the doctype/html/head/body wrapper because the artifact host adds its own.

## Open items

- **The itinerary card on the revised tab stays empty.** The user was asked whether C7 should fill it with the top plans; no answer yet.
- **The Research tab's bottom takeaway** may be kept or dropped; no answer yet.
- **Architecture tab leftovers:** `FLOWS` still has placeholder flows "Step 3/4/5", and the codes `L0` and `L1–L2` appear in the narrow-mode step label (`#now`). These are probably worth removing, but check with the user first.
- **Approximate facts to verify before presenting:** train times, the JR Pass price, and the paper figures.

## Background from the original design context (summary)

**The ladder**
- The design was framed as a ladder, where each level moves one job off the LLM: L0 Ask (LLM + web), L1 Know (data layer), L2 Find (parse, filter, score, select), L3 Plan (cities, days, base, routes, validate, narrate), L4 Edit (typed patches, partial re-plan).
- The Architecture tab shows L0 and L1–L2.
- The revised architecture maps onto the ladder like this:

  | Revised components | Ladder level |
  |---|---|
  | C4 | L1 |
  | C1, C2, C3 | L2 |
  | C6–C8 | L3 |
  | C10 | L4 |

  C5 (Judgement LLM) and C9 (presenter) cut across levels.

**Gaps at L0**

| Gap | Problem |
|---|---|
| G1 | Invented or stale places |
| G2 | Blind to time (Golden Week) |
| G3 | Untrusted sources |
| G4 | Not bookable |
| G5 | Cost is a guess |
| G6 | Geographically sloppy |
| G7 | Generic, popularity-biased |
| G8 | Constraints silently dropped |
| G9 | Unrepeatable, unmeasurable |
| G10 | Slow and expensive |

**Trip dials** are typed settings inferred from the prompt.
- Each stores a value, strictness, scope, source and confidence.
- The PM owns the catalog that maps a level to a number; the LLM only picks the level.

**Not visualized yet:** the context doc also defined an evaluation plan: about 20 hand-built trips, automated checks per gap, blind human ratings, edit metrics, and a headline pitch sentence.
