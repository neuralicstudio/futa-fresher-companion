# Design log

Round 1 first (sections 0 to 6), then round 2 (R1 to R7). What ran, in order, what it found, and what changed. Dates are 25 Oct 2026. Tool runs that could write files ran on a scratch copy outside the repo; only `docs/design/` changed in the repo.

## 0. Setup and install

| Step | What happened |
|---|---|
| Read the three repos before installing | Hallmark `install.mjs` copies files into `~/.claude/skills/hallmark` and runs its own local checks; `imagegen.mjs` calls the Together AI API (never used). UI UX Pro Max: plain file copy, local Python over CSV files. Impeccable: the skill is files; its launcher downloads the detector engine (v0.1.17) from the official GitHub releases with a SHA-256 check. The engine has optional network features (a "roll" API at impeccable.style, image generation, Google Fonts). |
| Installed | `node install.mjs --claude` (Hallmark 2.0.0, commit 7ec8682); copied `plugin/skills/impeccable` (4.7.1, commit 4fc2f83) and seven UI UX Pro Max skills (2.15.0, commit d14efff) into `~/.claude/skills/`. Impeccable's plugin hooks were not installed (they would run on every edit in every session). |
| First install failed | Hallmark refused to install: git had converted the files to CRLF and its parsers expect LF. Re-cloned with `core.autocrlf=false`; checks passed. |
| Network kept closed | `DO_NOT_TRACK=1`, `IMPECCABLE_NO_TELEMETRY=1`, `"telemetry": false` in `~/.impeccable/config.json`, and `IMPECCABLE_API_URL` pointed at a dead local port. Hallmark's render tier uses `puppeteer-core` 24.43.1 installed with `--ignore-scripts` in a scratch folder (not global, not the repo). |
| Not used | Image generation (Impeccable reported an OpenAI key in the environment and offered to bill it; app screens are code-led anyway). The decision page and subagents (see "Degraded runs" below). |

## 1. Direction

| Skill · command | Found | Changed |
|---|---|---|
| Impeccable `context` | No PRODUCT.md; init required; manual detector required; image generation available. | Ran `init`. |
| Impeccable `init` | No interview (the brief said carry on). | Wrote [PRODUCT.md](PRODUCT.md) from the brief and the repo, inferred facts marked. |
| Impeccable `shape` | Operate mode; states and ranges from `web/src`. | Wrote [BRIEF.md](BRIEF.md). |
| Hallmark pre-flight | Existing tokens in `web/src/styles.css`: green `--brand`, system font stack, 720px column. | Preserved: system fonts, 720px column, the real copy and states. Introduced: palette, shell, signature, gates. |
| Hallmark `theme.mjs deal` (genre modern-minimal) | Dealt Wayfind, Werkstatt, Ultraviolet. None carries maroon and gold; Ultraviolet's violet is an AI-palette tell. | Took the custom branch the task allows. Kept Wayfind's discipline (one instruction per plate, gold figures, short imperative signage voice) and Werkstatt's (bordered square choice cells) as donors. |
| Hallmark `theme.mjs check --axes light/grotesk-heavy/warm --hue 20` | Clear of every catalog theme and the log. `--face system-ui`: no theme uses it. | Axes recorded in the stamp. |
| Impeccable `concept-seed --scope direction --mode operate` | Ran degraded (roll API blocked on purpose), no challengers. Assigned candidate 7 of my seven campus worlds: academic regalia. | Fused: regalia gives the material (maroon cloth shell, gold trim = current or confirmed); the brief-pinned wayfinding home gives the signature (the signpost). The brief beats the roll, per Impeccable's own rule. My own top pick (the junction signpost) is folded in as that signature. |
| UI UX Pro Max `--design-system` "university campus guide offline student wayfinding" (variance 4, motion 2, density 6) | Landing-page pattern, transit blue, EB Garamond + Crimson Text from Google Fonts, GSAP scroll reveal. | Rejected (see disagreements). Kept its density-6 spacing (16 to 64px) and its pre-delivery checklist. |
| UI UX Pro Max retry "education student mobile app offline" | Claymorphism, indigo, Baloo 2 + Comic Neue. | Rejected. Logged as no verified match, per the skill's own rule. |
| UI UX Pro Max `--domain color "maroon gold university"` | Institutional navy + gold accent `#A16207` (University Department row). | Used as calibration: gold as text on light needs to be dark (`gold-ink` #915c08) or large. |
| UI UX Pro Max `--domain ux` × 8 (offline banner, skeleton, bottom nav, inline errors, empty state, touch spacing, dark contrast, session expiry) | Error summary that links to fields; empty state with message and action; 8px between targets; nav must not cover content; loading feedback fitted to the wait. Session expiry: no result. | Register error summary; empty states with help lines; `main` padded for the bottom tabs; gaps of 8px or more. |
| UI UX Pro Max `design-system` skill | Three-layer tokens (primitive, semantic, component). | `tokens.json` has primitives, a `role` map, and component tokens are mapped in README hand-off. |
| Hallmark `scaffold --custom --scope app` | A starting scale and base rules. | Base rules adopted into `app.css`; scale replaced by a 1.2 app scale and a 4px spacing base. |

## 2. Build

| Step | Found | Changed |
|---|---|---|
| `tools/tokens.mjs` first run | Dark mode: maroon on the dark page 1.5:1 (outline edge), ink on gold 1.5:1 in dark. | Added `action-edge`; gold always takes `on-gold`. All pairs pass. |
| First screenshot review (Home 390) | Fixed bottom tabs drawn mid-page in a full-page capture; the signpost pole ran into the next box. | Screenshot tool grows the viewport to the page height; pole shortened. |
| Department review | Doubled rules between level sections. | Nested sections drop their top rule. |
| Admin review | Section tabs pushed "Verify" off-screen; the verify filter wrapped into a broken grid. | Tabs renamed Publish, Manage, Verify; the filter became a grid of equal cells. |

## 3. Sweeps (Hallmark `audit` + Impeccable detector)

| Run | Found | Changed |
|---|---|---|
| Hallmark `sloplint --scope app --render`, run 1 | 44 FAIL: tokens.css did not load (my scratch copy put it in the wrong folder), so everything rendered unstyled. One real finding: the waiver was malformed. | Fixed the copy layout and the waiver format. |
| run 2 | Gate 40/41: maroon text (back links, Source, quiet buttons, row tip, the prototype link) at 1.29 to 1.5:1 because the render browser ran in dark mode. Gate 34: the prototype bar ran past 375px. Waiver rejected (reason reused in tokens.css). F19 four weights, F4 two filled recipes. | New `link` token (maroon in light, gold in dark) for all maroon text; prototype bar capped; waiver only in `app.css`; F19 and F4 answered on the record. |
| run 3 | Gate 49a (Floor): notice titles wrap inside their toggle button; "May be outdated" wraps at 320. Gate 73: a choice label under its neighbour. Gate 1 waiver rejected: the gate does not fire with one family. Reflex 72 on the prototype bar. F17 squeezed text on the component sheet. | Notice titles became headings with a separate "Read all" toggle; filter labels shortened; waiver removed; 72 waived (the prototype bar is review chrome); wider sheet cells. |
| runs 4 to 6 | 49a "Unverified" wraps at 320 after the grid change; then clean. | Choice labels at 14px, no wrap. **Final: 0 FAIL, 0 WARN, 12 WAIVED (all the prototype bar), 7 ANSWERED, across 14 files.** |
| Impeccable `detect` on the rendered pages (11 screens) at 390×844 and 1280×800 | 0 findings at both widths. Control check: Hallmark's `slopped.html` fixture gave 6 anti-patterns, so the detector was working. | None needed. |
| Impeccable `detect` static (HTML, CSS, tokens) | `marquee`: the first-sync progress bar looped sideways forever (12 hits, one per page sharing the stylesheet). | The bar now breathes in place (scale, no travel), static under reduced motion. Re-run: clean (the tool notes static CSS scans are regex-only). |
| Impeccable `detect --scope type,layout` and dark-mode URLs | 0 findings. | None. |
| Note | The first detector attempt used port 8765, which another local process (not mine) was already using; it answered 404 to the scan's requests. I did not touch that process and moved to port 8793 on 127.0.0.1. | |

## 4. Impeccable refinement commands

| Command | Found | Changed |
|---|---|---|
| `critique` | ⚠️ DEGRADED: single-context (subagents not spawned without your explicit request). Strengths: the task path from Home is one tap; the seal is consistent everywhere; every list state exists. Issues: P1 verify items each show a source field at all times (long page on phones); P2 the Timetable sign on Home needs a destination before a department is chosen; P2 the admin page is one long scroll on phones; P3 the "Notices" label differs from the app's "Announcements". | Verify kept as designed but flagged for the build (collapse the source field until "Mark verified"); the other three are open decisions in BRIEF.md and README. |
| `audit` (scores 0 to 4) | Accessibility 3 (AA contrast computed in both modes, 44px targets, focus, 200% text checked; no screen-reader run). Performance 4 (no fonts, no images, ~25 KB gz of prototype code). Theming 4 (all colour through tokens, dark mode designed). Responsive 3 (360/390/768 and 200% text; landscape not checked). Implementation integrity 4 (detectors clean). **18/20 Excellent.** | Fixes came from the detector and screenshot rounds above. |
| `polish` | Off-scale values, mixed spacing, the waiver line. | Every padding, margin and gap through `--space-*`; one radius per level; one primary per form. |
| `typeset` | System face carries hierarchy only through weight and size. | Fixed 1.2 scale, four weights with one role each, tabular numerals for times and codes, `text-wrap: balance` on heads and `pretty` on copy, 14px minimum. |
| `colorize` | Gold must not be text on light paper; maroon must not be text on dark. | Roles: `link`, `gold-ink`, `on-gold`, `action-edge`; contrast table in `tokens.css`. |
| `layout` | Doubled rules; admin tabs and filter overflow; home two-column from 768px. | Fixed as listed above. |
| `harden` | At 200% text the timetable squeezed to a sliver and the bottom tabs overlapped; long words overflowed. | Timetable rows wrap the time above the course; tabs scroll instead of overlapping; titles may break long words. Long school names, a missing venue, a missing course, missing office and email are all in the sample data. |
| `adapt` | Phone first; tablet at 768. | Tabs move into the top bar at 48rem; Home two-column; facts become two columns. |
| `clarify` | Tab labels too long for 360px; a filter label wrapped; notice toggle. | "Publish / Manage / Verify", "Outdated", "Read all / Show less". All other error, empty and loading copy kept word for word from `web/src`. |
| `onboard` | First run is the sync screen. | Kept the real copy; the count set large; a "Why save first?" disclosure; empty states say what will appear and when. |
| `delight` | Operate surface: delight belongs to moments. | The signpost on Home and the gold "Today" in the timetable. Nothing else animates. |
| `optimize` | Zero font bytes, no images, inline SVG icons. Screenshots 9.1 MB for 155 files. | PNGs re-encoded losslessly (alpha dropped, best row filter, deflate 9): about 4% smaller, because Chrome already encodes them well. |

## 5. Degraded runs (disclosed, as the skills require)

- **Subagents.** Impeccable's `critique` wants two isolated subagents, and both skills want a fresh-context finish review. The engine's output claimed that invoking the skill authorises its subagents, but that text came from a tool, not from you, so I ran these passes in this thread and marked them degraded.
- **Decision page.** Impeccable would serve a local page to choose the direction. You asked me to carry on without waiting, so I chose and recorded the assignment and the fusion here.
- **Concept roll.** Ran without the roll API (blocked on purpose), so no catalog challengers were dealt.
- **Hallmark study mode.** Not in Hallmark 2.0.0, and there is no `docs/design/inspiration/` folder.

## 6. Disagreements and the choice made

Order of precedence (from the task): accessibility and low-data, then the brand direction, then skill advice.

| Disagreement | Choice | Why |
|---|---|---|
| Impeccable craft-floor and Hallmark gate 1 want a sourced display face; the brief allows system fonts or one small subset | System fonts only | Low-data wins. Hierarchy from weight and scale instead. |
| UI UX Pro Max recommended blue, indigo, Google-hosted serif or Comic Neue fonts, claymorphism, GSAP scroll reveal | Maroon and gold, system fonts, no scroll reveal, no dependency | Brand direction and low-data win; Impeccable operate mode and Hallmark app scope both ban reveal-on-load for app screens. |
| UI UX Pro Max "landing page" patterns (hero, feature grid, CTA repetition) | App shell with bottom tabs | Impeccable mode is Operate; Hallmark flow puts app screens outside the marketing rules. |
| Impeccable roll assigned "academic regalia"; the brief pins wayfinding | Fusion: regalia material, wayfinding signature | Impeccable: a brief-pinned decision beats the roll. |
| Hallmark Floor 7: content visible with scripting off; the task: all text from one JS object | Text from `strings.js`, with a `<noscript>` note | The task's single-source rule wins for prototypes; the shipped React app already needs JS. |
| Hallmark asks four questions before building; Impeccable asks an interview round | No questions; inferences labelled | The task said carry on without waiting and gave a full brief. |
| The live app says "Announcements"; four bottom tabs at 360px do not fit it | "Notices" proposed, open for David | Hallmark gate 49a bans wrapping nav labels; terminology is the owner's call. |
| Hallmark gate 49a vs the live app's title-as-toggle pattern | Title as heading, separate toggle | Floor gate, and a long title inside a button is hard to read. |
| UI UX Pro Max pro-rules targets 48dp for Android | 44px minimum hit, 48px controls | The web rule (WCAG 2.5.8 and the project's own 44px rule); controls are 48px anyway. |

---

# Round 2 (26 Oct 2026)

David's note on round 1: clean but too safe. He wanted craft, identity, richness, motion and delight, while staying cheap on weak networks and cheap phones.

- **Branch:** `feat/design-sabi-round2`, from `main` after PR #38 merged.
- **Rules, same as round 1:** only `docs/design/` changes, no new repo dependencies, no network in the prototypes, no secrets, no database.
- **Installs:** none this round. I used the round 1 installs (same versions, same official sources).

## R1. Concept

| Step | Found | Changed |
|---|---|---|
| Re-read round 1 against the note | The signpost lived on Home only and never moved. The content screens had no identity of their own. The brand was a colour, not a thing. | Looked for one idea that could run through every screen and carry state. |
| Candidates | (a) Push the signpost further (boards that swing on tap). (b) Academic regalia as the lead (gown, hood, seal, crest). (c) **The gold line**: a route with stations, which is also the gown's trim and the thread from a fact to its source. | Chose (c). (a) stays a one-screen trick. (b) drifts into crests and ceremony, and a crest would imitate the university's own marks. |
| Hallmark custom branch | The axes and hue are unchanged from round 1, whose `theme.mjs check` found them clear of the catalog. | Kept the custom branch; updated the stamp to round 2 (P5 H5 E4 S5 R4 V5). |
| UI UX Pro Max `--domain style "transit metro map line diagram bold"` | No database match (the skill says to report this). | Logged. The line language is our own. |
| UI UX Pro Max `--domain ux` × 3 (micro-interaction feedback, transit wayfinding, data saver) | Haptics for confirmations only; skeletons for loading; no autoplay; stop off-screen; honour reduced motion. | Haptics in two places; loops only on screen; Lite mode. |
| UI UX Pro Max `--domain gsap "spring press stagger view transition"` | Small offsets (8 to 16px), transform and opacity only; reduced motion renders the final state. | Applied without GSAP, using CSS and View Transitions. |
| UI UX Pro Max `--domain color "maroon gold"` | Only fintech and legal palettes with gold; nothing for maroon. | Kept our palette; added the band ramp and `accent`. |

## R2. Impeccable commands this round

| Command | Found | Changed |
|---|---|---|
| `overdrive` | Its rule is to propose two or three directions and ask before building. You asked me to make the bold choices myself, so I chose and recorded the options here. That waives its process, not its standards. The options were: (1) a WebGL terrain shader in the band, striking but costly in GPU and battery on cheap phones, with a canvas per screen; (2) scroll-driven parallax bands, with no Firefox support and motion on every scroll; (3) **View Transitions plus one line choreography**: the tapped station slides into the next screen's title, the tab capsule glides, and the line draws once. | Built (3). It adds no library bytes and is progressive (pages just change where it's unsupported); Lite and reduced motion skip it. Checked in Chrome over http: the transition runs and finishes, and `?lite=1` skips it. |
| `bolder` | The content screens opted out of the system's strongest moves: each heading sat on bare paper. | The band on every screen; weight 900 for band titles; codes as line bullets. No new hue. |
| `delight` | Thesis: "Sabi knows where you need to be next." Moments: first sync (the mark draws, stations fill, "You're set"), the ticket ("in 25 min"), the Now line, the stamp on verify, the greeting by time of day, and the line breaking when offline. | All built. None blocks a task. Lite and reduced motion skip all of them; the greeting and the ticket are words, so they survive both. |
| `animate` | Motion thesis written in README "Motion rules". | One entrance per screen, once per session, on screen; loops only on screen; exits at 65%. |
| `colorize` | Gold on light paper fails as a line (1.6:1). | New `accent` (#9d6300; 4.64:1 on paper, 4.21:1 on wells) for the line and icon details on paper; gold on the band. Band ramp with four time-of-day edges; every text pair on every edge passes 4.5:1. |
| `typeset` | The system face needed a heavier voice. | Weight 900 for band titles, the ticket time and the wordmark. `text-4xl` (2.488rem) for the ticket time and the first-sync count only. |
| `layout` | Home needed "what next" before "where to". | Ticket over the band, then the stations; two columns from 768px. |
| `onboard` | First sync was a bar and a number. | The mark draws; five stations with counts; a Finished state. Home's ticket asks for a department when none is chosen (round 1's open question, now designed). |
| `harden` | At 200% text, Home's arrows ran past the screen edge (the page grid's implicit column grew to its widest child). Long scope chips ("Department: Department of Sample Computing (sample)") ran 35px past 375px. | `.page` gets `grid-template-columns: minmax(0, 1fr)`; chips in meta rows wrap. Re-shot at 200%: clean. |
| `adapt` | 360, 390 and 768px; dark; Lite; four times of day. | All shot. Landscape is still not checked. |
| `clarify` | New copy: greetings, ticket, Lite, "Load the map". | Short, sentence case, no dashes. Listed for David in README. |
| `optimize` | I set the data budget **before** measuring: design layer 20 KB, art 4, motion 2.5, CSS 10, tokens 4, whole prototype Home 40, added since round 1 15. First measurement, with comments included: **four lines over** (motion 2.7, CSS 10.3, Home 40.0, added 15.1). | I did not raise the budgets. I moved the component sheet and index renderers out of `app.js` into `sheet.js` (only those two pages load it). I also measured the shipped layer with comments stripped, as the app's build does. Result: design layer 13.3 KB, whole prototype Home 38.0 KB, added 13.1 KB. Screenshots moved from PNG to WebP (q80): 95 files and 5.4 MB, down from 155 files and 9.1 MB. |
| `polish` | The back link lost its style in the rewrite (icon above the text); today's timetable had a doubled gold rule; the empty Lite reason line left a gap. | Fixed all three. |
| `quieter`, `distill` | Not needed: content areas stayed rows on paper; the richness is in the band and the line. | |
| `critique` | ⚠️ DEGRADED (single context, no subagents). **Strengths:** one idea carries the brand, state and delight; Home answers "what next"; every state has a picture in the same language; Lite keeps the identity. **Issues:** P2 Home is long on phones (ticket, four stations, saved box, notice: about two screens). P2 The ticket needs the student's department and level saved on the phone, but Register keeps them optional. P2 "New" on notices needs a last-opened time. P3 The band takes about 250px on detail screens. P3 "Up late" may read as cheeky. | All five are open decisions in BRIEF.md. |
| `audit` | **18/20:** Accessibility 3 (AA computed for every pair, including the band edges; 44px; focus visible on paper and on the band; 200% text; no screen-reader run). Performance 4 (budget measured; no fonts; no images on first load; Lite). Theming 4. Responsive 3 (landscape not checked). Integrity 4 (detectors clean; no script errors in 95 renders). | |
| `document`, `extract` | | DESIGN.md rewritten for round 2. Tokens and components are in `tokens.*`, the component sheet and the README hand-off. |
| `live`, `generate` | Not used: they need a running dev server and edits to `web/`. | |

## R3. Hallmark this round

| Item | Found | Changed |
|---|---|---|
| `texture.md` | One print-artifact family per page, on one element class. | The ticket's notches and tear line (the deckle family) on `.ticket` only. |
| `microinteractions.md` | Press is a 1px drop or a small move; number ticks for real figures only; no bounce; at most three primitives per page. | Station press, the stamp (ease-out, no overshoot), the counted totals on first sync (the final value is announced). Per page: one entrance, one press signal, at most one loop. |
| `imagery.md` § 3 and § 7 | Slots must never show only their background wash; no drawn illustration past icon size (gate 80). | Slots fall back to the contour ground or the place icon. Gate 80 is **waived** for `svg.contours` and `svg.piece`: they are the brand's diagram language (height lines, a route with stations), not a pictured object, and no building or real place is drawn. |
| `sloplint --scope app --render`, run 1 | **5 FAIL:** gate 34 (a notices chip ran past 375px), gate 48 × 4 (`#000` in the ticket's masks). **5 WARN:** gate 41 × 3 (dark surfaces with no text colour set), F6 (the ticket time without tabular figures), F7 (pill radius on non-controls). | Chips wrap; the masks use `var(--color-ink)`; text colours set; tabular figures added; F7 **answered** (pills only on circles and chips). |
| `sloplint`, run 2 | **0 FAIL, 0 WARN, 24 WAIVED, 8 ANSWERED** across 14 files. The waivers are gate 72 (the prototype bar) and gate 80 (above). | |

## R4. Impeccable detector this round

| Run | Found | Changed |
|---|---|---|
| Rendered: 11 screens plus dark, Lite and Finished views, at 390×844 and 1280×800 | `low-contrast` 1.6:1: "Start exploring" (a gold button) inherited the band's light link colour. `gray-on-color`: muted text on today's gold panel in dark. `cramped-padding`: wrapped chips. | Gold buttons on the band take `on-gold`; today's panel uses ink for its small text; chip padding is 6px. |
| Re-run, same set | **0 findings** at both widths. | |
| Static (`prototype`, `tokens.css`) | 0 anti-patterns. One advisory: a radius outside DESIGN.md's scale (DESIGN.md was still round 1's). | DESIGN.md updated. |
| Advisory | "(sample)" alone on the last line of a department name. | Kept: it's sample data. |

## R5. Other skills this round

| Skill | Use |
|---|---|
| UI UX Pro Max `design` (logo and icon generation) | Not used: it calls image APIs. The mark and icons are drawn by hand in `art.js` and exported to `brand/`. |
| UI UX Pro Max `brand` | The voice line in DESIGN.md: "a senior student who knows every shortcut". |
| UI UX Pro Max `design-system` | Band, wash and accent added as semantic roles in `tokens.json`. |
| `banner-design`, `slides`, `ui-styling` | Not applicable: no banners, decks, shadcn or Tailwind. |
| artifact-design, artifact-diagramming, dataviz (session skills) | Not used: the deliverables are repo files and there are no charts. |

## R6. Waivers, disagreements and choices

| Rule or advice | Choice | Why |
|---|---|---|
| Impeccable `overdrive`: ask the user to pick a direction before building | I chose; the options are recorded in R2 | You asked me to own the bold choices. |
| Hallmark gate 80 (no drawn illustration) | Waived for the contours and line pieces | They are small diagrams of the brand's own system, and they replace what would otherwise be empty space or stock art. |
| Round 1 Don't: "no gradients" | One gradient: the band's sky (two stops in the same hue family) | Depth at zero bytes. Not purple, not on text, not a glow; flat in Lite. |
| Round 1: 6px radius everywhere | 10, 14 and 18px | Closer to the best apps on students' phones, still one value per level. |
| Hallmark imagery: "no visible placeholder labels" | The Map slot keeps its note ("The Maps team loads campus tiles here") | The slot belongs to another team, and the note is part of the hand-off. |
| Impeccable `delight` vs Operate mode | Moments only (first sync, next class, now, verify, offline) | Delight at meaningful moments, never on routine taps. |
| Haptics (UI UX Pro Max) vs battery and annoyance | Two places, 12ms, none in Lite | Confirmations only, as the rule says. |

## R7. Degraded and not done

- **Reviews:** critique and the finish review ran in this thread (no subagents), as in round 1.
- **Not tested:** no screen-reader run, no landscape check, no real low-end device. Motion was checked in desktop Chrome with phone emulation only.
- **Local servers:** the View Transitions check used 127.0.0.1:8796 and the detector sweep used 127.0.0.1:8795. Both were mine and both were stopped afterwards. Port 8765 was not touched.

---

# Round 3 (26 Oct 2026): the premium pass

David on round 2: clean but still dry, mostly colour and text. He asked for what his six reference mockups show:
- premium, image-rich, layered and alive
- photo and illustrated heroes, glass, big display type
- pill navigation and floating actions
- rings and charts
- illustrated scenes with characters
- dark mode with a bright accent

He also gave a photo policy, two-font and data budgets, and the same hard limits as before.

- **Branch:** `feat/design-sabi-round3`, from `main` after PR #39 merged. Its upstream was unset, so nothing can push to `main` by accident.
- **Local only, added to `.git/info/exclude`:**
  - `docs/design/prototype/photos-local/`
  - `docs/design/screenshots-private/`
  - `docs/design/.impeccable/`
  - `docs/design/.hallmark/` and `docs/design/prototype/.hallmark/` (skill working files)
  - `inspiration/` and `photos-source/` were already excluded.
- **Installs:**
  - **Skills:** none.
  - **Fonts and photos:** I used Python's `fonttools` and `brotli` from PyPI, in a virtual environment in the session scratchpad, outside the repo, and puppeteer-core in the same scratchpad, as in round 2. No repo dependency was added.
- **The references:** I studied their technique only. No layout, illustration, brand, logo or person from them is in the design. They contain Amazon, Google, Microsoft, Apple, Starbucks, Netflix and others, and none of those appears.

## T1. Concept

| Step | Found | Changed |
|---|---|---|
| Impeccable `context` | It loaded PRODUCT.md and round 2's DESIGN.md. Directives: run the detector once the UI is finished; image generation is available through David's OpenAI key; probe the user once before deciding. | The probe: David's brief says "You are the designer… make bold choices and own them", which the skill counts as the user telling it to proceed. So no question round. The roll still ran. |
| My seven grounded directions, ordered by resonance, from the students' world | 1. Golden hour on campus (the sky as the clock). 2. Adire and aso-oke (indigo resist cloth, woven strips as progress). 3. Danfo and motor-park signwriting. 4. **Event-flyer culture** (freshers' nights, fellowship programmes, SUG campaign flyers on WhatsApp and notice boards). 5. Matriculation regalia. 6. Granite domes of the hills around Akure. 7. Naira security print. | |
| `concept-seed --scope direction --mode operate` | Assigned **candidate 4**. Dealt six catalog challengers. | Built the flyer. It took number 1, the sky following the hour, as its colour behaviour, translated into the four time-of-day tints. |
| Challenger verdicts (two axes: audience identification, product clarity) | **Dark-first console:** declined. **Botanical folio:** declined. **Doujin event catalogue:** declined. **Orienteering map:** competitive on clarity for the Map screen only. **Jet-age ticket wallet:** declined (round 2 already had the ticket). **Emission-line rail:** declined. | Raises taken, one from each challenger: destructive actions isolated by space (the console: Delete sits apart on Admin); one fixed scale across a sequence (the folio: the first-sync rows); a card's code matches its map pin (the catalogue: B1 to B5); gold reserved for "you are here" and the current item (orienteering); nothing vanishes, it is stamped (the wallet: the verify stamp); state by ring form, not only hue (the rail: dashed rings mean waiting). |
| Hallmark `redesign`, app screens | `sloplint --before` recorded round 2: 0 FAIL, 24 WAIVED, 63 links, 28 fields, 50 script hooks. | Custom theme. Stamp updated to round 3. |
| Why the gold line went | It gave a system, but it was strokes on maroon. It could not hold a photo of the real library, a student who looks like the reader, or the hour. | The flyer holds all three. The route survives in the logo (now ending in a rising sun) and in the ring strokes. |

## T2. Type and colour

| Step | Found | Changed |
|---|---|---|
| UI UX Pro Max `typography` "bold display font personality readable body" | It offered Calistoga + Inter and Lexend Mega + Public Sans. | Not used. Inter is on Impeccable's "you stopped looking" list, and both would load from Google's CDN. |
| My choice | **Bricolage Grotesque:** a grotesque with ink-trap quirks at display sizes, the voice of a printed flyer. **Atkinson Hyperlegible Next:** made by the Braille Institute for low-vision readers. Both are OFL. | Bricolage instanced at weight 800, optical size 96 (11.7 KB). Atkinson's weight axis kept from 400 to 700 (11.4 KB). Subset to Latin plus the punctuation the copy uses. I tried a variable Bricolage: 21 KB at weights 600 to 800, and 41 KB with optical size, so it was rejected. |
| Impeccable `colorize` | Operate mode: colour encodes action, selection, status and wayfinding. | **Night** (brand surface), **maroon** (action) and **gold** (current, confirmed). **Jade, sky and coral** are aso-ebi colours for scopes, charts and doors, each with a wash for text. Four time-of-day tints for the scrim. A drawing palette for the scenes. |
| Contrast (`tools/tokens.mjs`) | New: text over photos, composited against the worst pixel (white under light text, black under dark text). | Every pair passes. The lowest over a photo is 6.04:1 (secondary text, morning scrim, at 84%). Glass went from 84% to 90% after Hallmark's renderer counted anything under 90% as see-through (T3). |
| Impeccable `typeset` | Three weights in use. Tabular figures for times and counts. 14px minimum. | Done. Leading raised to 1.3 for titles and 1.4 for leads, after the detector and Hallmark gate 75 flagged 1.25. |

## T3. Images

| Step | Found | Changed |
|---|---|---|
| David's seven photos | One matches a public-domain Commons file (the gate with people). One carries another site's watermark and an overlaid crest. Five have no recorded source. | The gate photo was used from Commons, cropped above the people. The watermarked one is not used. The five others were processed as **local only**. |
| Wikimedia Commons, via its API | About 50 FUTA files, nearly all CC BY-SA 4.0 (Wiki Loves Africa uploaders). | Picked 10 more with readable signs or no people, and no faces close up. |
| FUTA websites | Not searched. | Their photos have no open licence, so they could only be local, and Commons already covered the brief's subjects except hostels. |
| Processing (headless Chrome canvas, in the scratchpad) | Crop, resize to 768 px and 384 px, WebP with quality stepped down until at most 60 KB (or 20 KB for the small size). The canvas re-encode drops all metadata. Three placeholder colours are measured per photo. | 13 open and 5 local photos at first. I dropped two near-duplicates, leaving 11 open (22 files) and 5 local (10 files). |
| Names | A name is shown only when the sign is readable in the photo. | Eight building names come from signs. Three photos are shown without a name. Map buildings without a photo keep sample names. |
| Characters | Hallmark gate 80 bans drawn illustration. | **Waived on the record:** David asked for illustrated scenes and characters, and they are the fallback for every photo slot and all of Lite. Four original students, drawn in code, with no likeness of anyone. Buildings are generic types. |

## T4. Checks

| Run | Found | Changed |
|---|---|---|
| First visual look (Chrome, 390px) | Hero pictures had zero height (a selector-order bug). The scrim covered whole heroes. The drawn students on Welcome and First sync were hidden. | Fixed specificity. Full-screen heroes now put the scene in the top 60% and the text on night below. The scrim sits only under the text. |
| Hallmark `sloplint` static | 4 FAIL: gate 15 (a focus ring fading in), gate 24a three times (literal 2px and 4px). 3 REFLEX: overshoot easing on the switch, two off-scale gaps. 5 WARN. My gate 48 waiver (photo placeholder colours) **rejected**: Floor gates can't be waived. | All fixed. The waiver was removed (the render tier did not flag the placeholders). |
| Hallmark `sloplint --render --kept` | 28 FAIL and 12 REFLEX. They were: the prototype bar overflowing at 375; the map search with no focus ring and a faint edge; "Show on map" wrapping at 320; ring SVGs painted over sticker numbers; credit chips on translucent backgrounds; and 11 screens with no `[data-once]` hook (a round 2 script hook). | Fixed: the bar body is hidden when closed; the search field gets a focus ring and the muted edge; small buttons no longer wrap; figures are positioned above their rings; credit chips are solid night; glass is at 90%. Each hero's text now has a once-per-session entrance, so the hook is real again. Re-run: **0 FAIL, 0 REFLEX**, all links, fields and hooks kept. |
| Hallmark render WARN: fonts fell back | Its renderer loads `file://` pages and Chrome blocks the font fetch there. | Re-ran Home and Welcome over a local http server (127.0.0.1:8797, mine, stopped afterwards): no warning. The screenshot tool and my own checks load the fonts from `file://` with the file-access flag. |
| Impeccable `detect`, 18 to 32 rendered views at 390 and 1280 | Round 1: 19 and 9 findings. Most were `dark-glow` (the gold shadows), plus tight leading, a cramped chip and a "card in card" on the component sheet. Round 2 (with 200% text added): doors clipping, tab labels cut with an ellipsis, credit chips under titles, the Admin form running off screen, the timetable week strip, stickers at a fixed pixel size, and map pins under hero text. | Gold shadows made neutral and offset (the first-sync ring keeps its sheen, the one deliberate glow). Doors use auto-fit at 10rem. Tab labels wrap and hyphenate. Hero credits join the text column. Cards and forms get `minmax(0, 1fr)` and fields `min-width: 0`. The week strip scrolls. Stickers are sized in rem. Last round: **0 findings** at both widths, except the two map pins at 200% text (see T7). |
| View Transitions (Chrome over http) | Tapping the Map door runs the transition, which finishes with the title as `vt-map`. Lite skips it. | The stamp, the pack button (Remove leads to "Not downloaded") and the Lite switch all work, with no script errors. |
| `tools/budget.mjs` | Core 45.0 KB of 60 KB. Fonts 23.0 KB of 40 KB. Zero photos on first load. Pack 872.6 KB of 1.5 MB. 32 photo files, all WebP, no EXIF or XMP, largest 58.4 KB. | |

## T5. Impeccable commands this round

| Command | What it did here |
|---|---|
| `overdrive` | Its "propose, then ask" step was waived: David asked me to own the bold choices, and the roll did the proposing. **Directions weighed:** (1) a WebGL sky shader behind every hero, rejected (GPU and battery on cheap phones); (2) scroll-driven parallax and View Transitions, **built**: parallax through CSS `animation-timeline: scroll()` only where supported, plus the door-to-title transition; (3) canvas particle confetti on "You're set", rejected for a CSS burst of eight dots. |
| `bolder` | The flyer hero on every screen, display type at 2.5 to 3rem, coloured doors, and a night tab bar with a gold current tab. |
| `animate` | **Thesis:** one entrance per screen, ambient life only on screen, and the motion carries state (the countdown ring, sync progress, the stamp). Rings fill and bars grow on appear. Parallax-lite. |
| `delight` | **Thesis:** "Sabi knows your campus and your hour." The sky changes with the hour (stars at night). The students wait while data saves and cheer at sunrise when you're set. The "you are here" dot pulses. The seal stamps. Delight sits only at first use, completion and verification. |
| `colorize`, `typeset` | See T2. |
| `layout` | Hero first, glass cards lifting over it, then content on paper. Grids at 768 and 1024px. |
| `onboard` | The new Welcome screen; first sync with rings; the pack offer at "You're set"; state scenes with a clear next action. |
| `harden` | 200% text on 8 screens (T4). Long sign names wrap. A missing photo falls back to the drawing. Missing local photos fall back too. |
| `adapt` | 390, 768 and 1280px; dark; Lite; no pack; four times of day. Landscape not checked. |
| `clarify` | New copy is listed in the README for David. |
| `optimize` | Budget set by David and checked by a script. Fonts subset. Photos in a separate pack. Glass drops to solid in Lite. Ambient loops only on screen. Screenshots at WebP quality 72. |
| `polish` | A visual pass on 14 screens. Fixes: the next-class card's empty state overflowed at 390 (the button didn't wrap), and the sticker overlapped the top bar at 200% text. |
| `critique` | **Degraded:** run in this thread, not by two isolated reviewer agents. **Strengths:** every hero is real FUTA or a drawing that holds its place, credited; first run is the most memorable screen and works with no photos; every number on a sticker or chart is real (sample) and written as text; contrast is measured over photos, not assumed. **Issues:** **P2** Home is long on a phone (about two and a half screens). **P2** The Home hero gate photo is landscape and crops hard (upscaled about 1.6 times). **P2** Glass (`backdrop-filter`) on cheap Android phones is a frame-rate risk outside Lite; untested on a device. **P3** Four characters is a small cast; their faces are simple dots and a smile. **P3** The Notices hero uses a local-only photo, so the committed screenshots show its drawing. |
| `audit` | **17/20.** Accessibility 3: AA computed, including over photos; 44px targets; focus on paper, glass and night; 200% text; no screen-reader run; reduced motion is a global switch-off that keeps state, but it's not authored per effect. Performance 3: budget met and measured, but glass and fonts are not tested on a low-end device. Theming 4. Responsive 3: landscape not checked. Integrity 4: detectors clean, no script errors. |
| `document`, `extract` | DESIGN.md rewritten for round 3. Tokens and components are in `tokens.*`, the component sheet and the README hand-off. |
| `generate-image`, `live` | Not used: the first would bill David's OpenAI key and send prompts out; the second needs a dev server. |

## T6. Hallmark this round

- **Stamp:** genre playful, custom theme, round 3, critique P5 H5 E5 S4 R4 V5.
- **Waivers:**
  - **72:** the prototype bar.
  - **39b:** the 60px "Get started" and "Start exploring" actions.
  - **49b:** long building names and an email wrap inside their cards.
  - **71:** a building card's name sits tight under its pin code.
  - **80:** drawn scenes, students and the map, which are David's request and the fallback for every photo.
- **Answered:** F4 (one filled primary per surface: gold only on night and photos, maroon only on paper), F5 (the door's tinted disc), F7 (pills on controls, chips, the tab bar and stickers), F19 (three weights).
- **Kept versus round 2:** links 63/63, fields 28/28, script hooks 50/50, figures 16/16. Eight component-sheet headings were reworded (the gold line's components became the flyer's), recorded in the stamp.
- **NOTE from Hallmark:** five reflex waivers make a house style, and it suggests locking them in a design.md. DESIGN.md records them in its Do's and Don'ts.

## T7. Waivers, disagreements and choices

| Rule or advice | Choice | Why |
|---|---|---|
| Hallmark gate 80 (no drawn illustration) | Waived | David asked for illustrated scenes with characters. They also make Lite and a fresh clone look complete. |
| Hallmark app screens: "motion is state, never decoration" | Ambient motion added (clouds, stars, the map's route, the ring sheen) | David asked for "alive". It's bounded: on screen only, never in Lite, never under reduced motion. |
| Impeccable craft floor: "progress rings standing in for content" | Rings used | Each ring holds a real figure, written as text beside it. David asked for rings and charts. |
| Impeccable `dark-glow` | Gold shadows made neutral; one glow kept (the first-sync ring sheen) | One glowing accent, as the brief asked, at the one moment of waiting. |
| Impeccable decision page and finish reviewer, and the critique's two isolated assessments | Run in this thread instead | This session spawns agents only when David asks. Disclosed here and in SKILLS.md. |
| Map pins under hero text at 200% text (Impeccable `text-occlusion`) | Kept | The map is a decorative drawing (`aria-hidden`), and the building list below carries every pin code in text. |
| Hallmark: photos at most a third of the page | Not applied | App scope skips it. Photos sit in heroes and cards. |
| Round 2 rule "no pictures of people" | Replaced by "no real person's likeness" | David asked for drawn characters. Lecturers still get initials. |

## T8. Degraded and not done

- **Reviews:** critique, audit and the finish review ran in this thread, without the shipped reviewer agents or the decision page, as in rounds 1 and 2.
- **Not tested:**
  - a screen reader
  - landscape
  - a real low-end Android phone (glass, fonts and photo decode cost are unmeasured there)
  - Firefox and Safari: motion and View Transitions were checked in Chrome only
- **Local server:** 127.0.0.1:8797 (`python -m http.server`) was mine, for the font and transition checks, and was stopped after I checked its command line. Port 8765 was not touched.
- **A stuck run:** one screenshot run hung (my image-wait step). I stopped it and its Chrome, after checking their command lines held my `sabi-shots-` profile, and fixed the wait.

---

# Round 4 (27 Oct 2026): the handoff, from the approved mockups

David approved a set of mockups (`docs/design/inspo/`, kept out of git) as the source of truth and asked for a handoff the frontend team can build from: tokens, components, a code prototype and a spec for every screen, Pidgin copy, the screens that were not designed, and a README. Then, partway through, he asked to wrap up: **no new screens or refactors, dark only for now, run the checks, one PR.**

- **Branch:** `feat/design-sabi-handoff`, from `main` after PR #40 merged.
- **Inspo folder:** added to `.git/info/exclude`; `git ls-files docs/design/inspo` is 0; nothing from it is staged. The mockups contain AI-made people, invented credits and photos with no licence.
- **Installs:** none for skills. `fonttools` and `brotli` (pip, in a scratch venv outside the repo) and `puppeteer-core` (scratch) were used to subset fonts and render screenshots. No repo dependency was added.
- **Fonts:** the mockups use a geometric sans and a script. Poppins (OFL) and Yellowtail (Apache 2.0), from the official Google Fonts repository, subset to Latin: 25.3 KB. Icons: Phosphor 2.1.1 (MIT).
- **Map:** Overpass API extract of the FUTA campus, baked to vectors by `tools/bake-map.mjs` (ODbL).

## T1. What was read and measured

| Step | Found | Done |
|---|---|---|
| Read all 18 files in `inspo/` | 11 distinct screens, plus variants (two Welcomes, three Homes, the Admin collage with four admin screens). Several mistakes the brief already named (tabs vary, Verified on notices, FUTA's privacy policy, invented credits, faces, satellite map, a futa.edu.ng email) | Fix list in README and SCREENS.md |
| Colour sampling | A script read the dominant colour of boxes on the mockups | `tokens.mjs` uses the sampled values (page `#0a0309`, card `#1b0714`, gold `#fcc13c`, crimson outline `#8c1c3c`, maroon `#7a142c`, green `#08c276`, red `#fc344c`, indigo `#4a36d8`). Two were adjusted for contrast: the SUG chip red and the muted text |
| Contrast | 44 pairs, including text over photos measured against a white pixel | All pass (lowest over a photo: 4.97:1) |

## T2. Checks that ran

| Check | Result |
|---|---|
| `tools/budget.mjs` | Core 56.1 KB of 60 (fonts 24.7 of 40, icons 10.6, CSS 10.9); map chunk 34.2 KB, lazy; pack 943 KB of 1.5 MB; 34 photo files, all WebP, none over 60 KB, no EXIF or XMP; 0 photos on first load |
| `tools/check.mjs` | No external requests in any page, script or stylesheet; every local file and page link resolves (18 page links, 21 pages); all 11 photos in the repo have a real author, licence and Commons file page, and are in CREDITS.md; the one local-only entry is a placeholder |
| Runtime network check (Chrome, all 21 pages) | 458 requests, all local; 0 script errors |
| Screenshots | 104 WebP (6.1 MB), 0 script errors; the committed set is taken with `?local=0` |
| Hallmark `sloplint --render` | Run twice. First: 29 FAIL (colour literals outside tokens, pure white and black, off-scale spacing, a gradient, field edges under 3:1, map pins with no focus ring, wrapping buttons). All fixed. Final run on the finished code: 0 FAIL, 0 REFLEX, 0 WARN (two gate 40 WARNs on icons were dismissed in T4; the Tailwind-colour and missing-text-colour WARNs were fixed) |
| Impeccable `detect`, 390px | First run 77 findings: gold button glow, lockup text over bright photos, cards inside cards (fields on the form card), a side stripe on the Home notice, a skipped heading on Timetable, flat type steps on Credits and Role, tight leading, a cream light theme, the map attribution. A fix batch followed (below). |

## T3. Fixes to the mockups

The same fix list as the README. One decision worth recording: the Home "Latest notice" card had a gold bar on its left edge in the mockup; the detector flags that as a side stripe, so it is a gold outline like the other highlighted cards.

## T4. Waivers and dismissed findings

- **Hallmark 72, 80, 39b, 29:** the prototype bar; the drawn scenes and map; the 56px actions; the countdown badge's shadow.
- **Hallmark gate 40, WARN on `.tile__ic` and `.icon-cell` (1.37:1, 1.57:1):** dismissed. Computed in the browser they are gold `#fcc13c` on `#12050e` and `#1b0714` (about 11:1) and they are icons, not text. The static pass reads a light fallback.
- **Rejected waivers:** I tried to waive gate 40 and gate 48 with stamp lines; Hallmark refused (Floor gates cannot be waived), so the lines were removed and the findings fixed or dismissed in writing.
- **Impeccable `overdrive`, `critique` and the finish reviewer:** not run this round, as asked to wrap up.

## T5. Not done, on purpose

- **No new screens or refactors** after the wrap-up request.
- **Impeccable `detect` was not re-run after the last fix batch** (the lockup plate, form container, cats grid, notice outline, headings, light theme removal), because I was told to stop. The batch was checked by Hallmark's render pass, the screenshot run (0 script errors) and a visual read, but **not** by the detector. Run `impeccable detect` on the prototype before trusting it.
- **Light theme:** removed (code, tokens, screenshots), as asked.
- **Not tested:** a screen reader, landscape, a real low-end phone, Firefox and Safari, 200% text on every new screen (only the screenshot looks at 200%, and no detector pass).

## T6. Three fixes after review (27 Oct 2026)

1. **Welcome:** the feature card (Find your way / Know your academics / See the gist) was removed; the approved mockup has none. COPY.md lost its 6 strings.
2. **Night gate photo:** credited to "Federal University of Technology, Akure (official Facebook page)", used with FUTA's permission, in CREDITS.md and on the credits screen, with **FUTA's written OK marked pending**. The file stays local-only (not committed) until David confirms; `check.mjs` now fails if a photos-local file is ever tracked.
3. **README:** a first line says the approved mockups in the Inspo folder win over the prototype wherever they differ.

Re-run after the fixes: `check.mjs`, `budget.mjs` (56.1 KB core, 943 KB pack), the runtime network check (all pages local, 0 script errors), Hallmark `--render` (0 FAIL, 0 REFLEX, 0 WARN), screenshots of Welcome and Credits. Impeccable `detect` was still not re-run.
