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
