# Design log

What ran, in order, what it found, and what changed. Dates are 25 Oct 2026. Tool runs that could write files ran on a scratch copy outside the repo; only `docs/design/` changed in the repo.

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
