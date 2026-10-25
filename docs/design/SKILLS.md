# Skills used

Every installed design skill, each of its commands, modes and rule groups: what it does and where it was used in this project, or why it cannot apply. Run order and results are in [LOG.md](LOG.md).

Installed at user level (`~/.claude/skills/`), nothing in the repo:

| Skill | Version | Source |
|---|---|---|
| Impeccable | 4.7.1, engine 0.1.17 | github.com/pbakaus/impeccable @ 4fc2f83 |
| UI UX Pro Max (+ six sister skills) | 2.15.0 | github.com/nextlevelbuilder/ui-ux-pro-max-skill @ d14efff |
| Hallmark | 2.0.0 | github.com/Nutlope/hallmark @ 7ec8682 |

How the work was divided (as the task proposed; the skills' own docs agreed): UI UX Pro Max for the design-system inputs and UX rules; Hallmark for the direction branch, its gates and the audit sweep; Impeccable for product context, direction, every refinement command and the detector.

What I read: every SKILL.md in full; for Impeccable the core flow (new-work, shape, init, operate, mode-operate, craft-floor) and every command reference used below in full, the rest by section; for Hallmark SKILL.md, flow.md, gates.md, direction.md, interaction-and-states.md, dark-mode.md and the Wayfind theme in full, the 48 themes through their index, the macrostructure and genre files by index (app screens do not use them); for UI UX Pro Max the SKILL.md, the pre-delivery checklist in pro-rules.md and the sister skills' outlines. Reading every byte of all three (about 170,000 words plus CSV data) was not possible in one session.

## Impeccable

### Commands (24)

| Command | What it does | Where used |
|---|---|---|
| `craft` | Deprecated alias for new work | Not separately: its job is `new-work`, which ran |
| `shape` | Plans UX before code | Wrote BRIEF.md |
| `init` (`teach`) | Captures product truth | Wrote PRODUCT.md (inferred facts marked) |
| `document` | Writes DESIGN.md from the built world | Wrote DESIGN.md in its format, tokens in the frontmatter |
| `extract` | Pulls reusable tokens and components into a system | Tokens into `tokens.css/json`; components into the sheet and the README hand-off |
| `critique` | UX review with scoring | Ran degraded (single context); findings in LOG.md § 4 |
| `audit` | Technical checks (a11y, perf, theming, responsive, integrity) | Scored 18/20; LOG.md § 4 |
| `polish` | Final consistency pass | Spacing, radius, one primary per form |
| `bolder` | Amplify a bland design | Not needed: the signpost and the maroon shell already commit; Operate mode keeps expression to one signature |
| `quieter` | Tone down a loud design | Not needed: nothing loud to reduce; content areas are already restrained |
| `distill` | Strip to essence | Applied in effect: one family, no cards, rows only. Not run as a separate pass |
| `harden` | Long text, errors, i18n, network edge cases | 200% text fixes, long names, missing venue, course and email, offline, 503, 401 |
| `onboard` | First-run and empty states | First-sync screen and every empty state |
| `animate` | Purposeful motion | Motion limited to state (press, disclosure, skeleton, progress); reduced-motion fallbacks |
| `colorize` | Strategic colour | Colour roles, link token, gold rules |
| `typeset` | Type hierarchy | Scale, weights, tabular numerals, wrapping |
| `layout` | Spacing, rhythm, hierarchy | Fixed doubled rules and overflow; tablet two-column |
| `delight` | Earned personality | Signpost, gold Today; nothing else |
| `overdrive` | Push past convention | Not used: Operate mode and cheap phones; spectacle would cost data and clarity |
| `clarify` | UX copy | Tab and filter labels, notice toggle; real copy kept |
| `adapt` | Devices and sizes | 360, 390, 768, 200% text |
| `optimize` | Performance | Zero font bytes, no images, PNG optimisation |
| `live` | Variant mode in a running dev server | Not used: needs a dev server and edits to `web/`, which is out of scope |
| `generate` | Variants of one element in the live browser | Not used: same reason as `live` |

Other verbs: `pin` (shortcut commands; not needed), `hooks` (the per-edit detector hook; not installed so nothing runs in other sessions; the detector ran manually instead), `doctor` (repairs Impeccable artifacts; none in the repo to repair), `context` (ran once in a scratch project).

### Modes, flows and references

| Item | Where used |
|---|---|
| Mode: Operate | The whole app (task screens) |
| Mode: Persuade, Read, Experience | Not applicable: no landing page, docs or showcase in scope |
| new-work (world, roll, direction contract) | Direction; roll degraded; contract in BRIEF.md § 3 |
| concept-seed | Ran (degraded, no network) |
| serve-question decision page | Not used: you asked me to carry on without waiting |
| visualize, region-map, component-review, build-phase, comp-spec, font-match | Comp-led path only; Operate surfaces are code-led by Impeccable's own rule |
| craft-floor | Applied before every UI edit |
| ios.md, android.md, audit.native.md, adapt.native.md | Not applicable: the platform is web (a PWA) |
| degraded/finish-reviewer, documenter | Used as the in-thread substitutes (no subagents) |
| asset-producer, manual-edit-applier | Not applicable: no raster assets, no live mode |

### Detector rules (62)

Ran on the rendered pages at 390 and 1280, in dark mode, with `--scope type,layout`, and on the static files. Final: 0 findings.

| Group | Rules |
|---|---|
| Slop tells (31) | side-tab, border-accent-on-rounded, overused-font, flat-type-hierarchy, gradient-text, ai-color-palette, cream-palette, nested-cards, monotonous-spacing, bounce-easing, pulsing-dot, blinking-cursor, shape-assembled-illustration, dark-glow, radial-halo, radial-spotlight-glow, marquee, icon-tile-stack, italic-serif-display, hero-eyebrow-chip, kicker-above-heading, numbered-section-labels, em-dash-overuse, marketing-buzzword, aphoristic-cadence, oversized-h1, extreme-negative-tracking, gpt-thin-border-wide-shadow, repeating-stripes-gradient, codex-grid-background, theater-slop-phrase |
| Quality (27) | organic-clip-path, buried-raster, hard-offset-shadow, broken-image, script-error, content-hidden-at-rest, edge-flush-cards, text-occlusion, first-viewport-column-overflow, gray-on-color, low-contrast, line-length, cramped-padding, body-text-viewport-edge, tight-leading, skipped-heading, heading-rhythm, justified-text, straggler, unbalanced-heading, tiny-text, undersized-ui-text, all-caps-body, wide-tracking, text-overflow, repeated-container-text, clipped-overflow-container |
| Design-system drift (4) | design-system-font, -color, -radius, -font-size (active once a project DESIGN.md is found; the scans ran with docs/design/DESIGN.md beside them in the copy) |

Caught and fixed: `marquee` (the first-sync bar). Everything else was clean at every pass.

## Hallmark

| Item | What it does | Where used |
|---|---|---|
| Default build flow (pre-flight, ask, shape, direction, load, picks, build, sweep) | Builds a new page | Pre-flight and custom direction; the ask was skipped (carry on); Picks are BRIEF.md § 3 and the CSS stamp |
| `redesign <target>` | Rebuilds an existing design | Not used: the task forbids changing `web/src`; the hand-off covers it |
| `audit <target>` | Report by tier, changes nothing | Ran as the sweep over the prototypes; LOG.md § 3 |
| "study" | Named in the task | Not in Hallmark 2.0.0, and no `docs/design/inspiration/` folder exists |
| Custom branch (direction.md) | A world of its own | Used, because no catalog theme carries maroon and gold |
| Theme deal (`theme.mjs deal`) and 48 themes | Deals three fitting themes | Ran; dealt Wayfind, Werkstatt, Ultraviolet; Wayfind and Werkstatt donated discipline |
| `theme.mjs check` | Checks axes, face, hue against the catalog | Ran: clear |
| `theme.mjs scaffold --custom --scope app` | Starting tokens and base CSS | Ran in scratch; base rules adopted |
| `theme.mjs draw`, `photos`, `log` | Shape draw, library photos, rotation log | Not used: app screens take no macrostructure and no stand-in photos (flow.md App screens); the log lives in scratch, not the repo |
| App-screens branch | The rules for working screens | Applied throughout |
| Component scope branch | Eight-state previews | The component sheet follows it (states forced with helper classes) |
| Fast mode, signal 8 (Inspo), signal 9 (comp, Together AI) | Branches | Not applicable: not a quick build; no Inspo server; no Together key and no network images |
| Edit-time hook (`install-hook.mjs`) | Lints on every edit | Not installed (it would apply to every session); the sweep ran instead |
| `capture.mjs`, `picture.mjs`, `imagegen.mjs` | Product capture, picture tools, image generation | Not used: no running product to capture for a prototype; no images in this design |
| `sloplint.mjs` static + `--render` | The gates | Ran six times; final 0 FAIL, 0 WARN |
| Gate groups (90 numbered gates: 39 Floor, 50 Reflex, 1 Ledger) | Colour and surface; Type; Structure and layout; Chrome and copy; Motion and interaction; Assets and access | All applied; app scope skips the marketing-only gates by design |
| Finish checks F1 to F26 | Craft details | Answered: F4, F19 |
| Pre-emit critique (P H E S R V) | Scores the plan | In the CSS stamp: P4 H5 E4 S4 R4 V4 |
| Macrostructures (21), genres (4), layout.md, anatomy.md, imagery.md, scroll-choreography.md, texture.md | Page shapes and marketing craft | Not applicable to app screens (flow.md); read by index only |
| interaction-and-states.md, dark-mode.md, patterns.md, craft.md § 9 | States, fields, overlays, dual mode | Used for every control, the fields, the inline confirm and dark mode |
| design-md.md ("lock the system") | Portable system file | DESIGN.md serves both skills |
| fonts.md, brand-truth.md, comp.md, data-viz.md, export-formats.md, review-*.md | Fonts, real brands, comps, charts, exports, reviewer prompts | Not needed: system fonts; no real brand assets supplied; no comps or charts; reviews ran in-thread without reading the reviewer prompts, as the skill asks |

## UI UX Pro Max

| Item | Where used |
|---|---|
| `--design-system` (with dials `--variance 4 --motion 2 --density 6`) | Ran twice; rejected palette, fonts, style and pattern (LOG.md § 6); kept spacing and the checklist |
| `--persist`, `--page` | Not used: they write `design-system/` folders; our system lives in `docs/design/` |
| Domain `ux` | Eight searches (LOG.md § 1) |
| Domain `color` | Gold calibration |
| Domain `typography` | Confirmed no system-font pairing suits; system stack kept |
| Domains `product`, `style`, `landing`, `google-fonts`, `chart`, `icons`, `gsap`, `react`, `web` | Not needed: product type known; no landing page; no web fonts; no charts; icons are drawn in-house (one stroke family, the skill's own rule); no GSAP; React performance is the app's concern, not the design's; `web` targets native |
| `--stack` (22 stacks) | Not used: design only, no implementation in `web/` |
| references/quick-reference.md (119 rules by priority) | Priorities 1 to 9 applied: contrast, touch, performance, style, layout, type and colour, animation, forms, navigation |
| references/pro-rules.md pre-delivery checklist | Applied: no emoji icons, one icon family, stable press states, semantic tokens, 375px and reduced motion checked, dark contrast checked separately |
| Sister: `design-system` | Three-layer tokens in `tokens.json` |
| Sister: `ui-styling` | Not used: shadcn and Tailwind are not in this project |
| Sister: `brand` | Voice and messaging: the voice lines in BRIEF.md and DESIGN.md |
| Sister: `design` (logo, CIP, icons, social) | Logo and icon generation need image APIs; not used. The wordmark is type plus the drawn signpost icon |
| Sister: `banner-design`, `slides` | Not applicable: no banners or decks in scope |

## Other design skills in this environment

| Skill | Where used |
|---|---|
| frontend-design | Not installed in this environment |
| artifact-design, artifact-diagramming, dataviz | Built into this session for claude.ai artifacts and charts; not used, because the deliverables are repo files and there are no charts |
