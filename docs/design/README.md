# Sabi design (docs/design)

The design for the FUTA campus guide (working name **Sabi**). Design only: nothing in `web/src`, `api`, `db` or `docs/openapi.yaml` was changed. All sample data is fake and says "(sample)".

This is **round 2**. Round 1 (PR #38) was clean but quiet. Round 2 gives the app an identity, depth, motion and a few moments of delight, and keeps it cheap: Home's design layer is **13.3 KB gzipped, no fonts, no images on first load**, and a **Lite mode** turns the heavy parts off.

## What is here

| Path | What it is |
|---|---|
| [BRIEF.md](BRIEF.md) | The design brief: audience, job, concept, states, constraints, open decisions |
| [PRODUCT.md](PRODUCT.md) | Product truth (Impeccable `init`), with inferred facts marked |
| [DESIGN.md](DESIGN.md) | The design system in words (Impeccable `document` format, tokens in its frontmatter) |
| [PHOTOS.md](PHOTOS.md) | Photo slots, their size budget, and a guide for teammates taking campus photos |
| [tokens.css](tokens.css), [tokens.json](tokens.json) | Colours (light, dark, the band), type, spacing, radii, shadows, motion, z-index, and every contrast ratio, computed |
| [brand/](brand/) | The mark, the app icon and a maskable app icon, as SVG (under 0.5 KB each) |
| [prototype/](prototype/) | Static HTML prototypes of every screen and state, plus the component sheet |
| [screenshots/](screenshots/) | 95 WebP screenshots: every screen at 360, 390 and 768px, every state at 390, plus dark, Lite, other times of day and 200% text |
| [tools/tokens.mjs](tools/tokens.mjs) | Writes both token files and checks contrast. Change a value there, never in the outputs |
| [tools/budget.mjs](tools/budget.mjs) | Measures Home's data cost against the budget below; exits 1 if over |
| [tools/screenshots.mjs](tools/screenshots.mjs) | Re-takes the screenshots (headless Chrome, no dependencies) and fails on any script error |
| [SKILLS.md](SKILLS.md) | Every design skill, command, mode and rule group, and where it was used (both rounds) |
| [LOG.md](LOG.md) | What ran, what it found, what changed, waivers, and every disagreement (both rounds) |

## How to view it

- Double-click `prototype/index.html`. It works from the file system: no server, no network, no build, no fonts.
- Every screen has a **Prototype** button in the corner: switch the state, the theme, **Lite mode** and the **time of day** (the band's colour). Links work too: `?state=error`, `?theme=dark`, `?lite=1`, `?daypart=evening`, `?text=200` (200% text), `?proto=0` (hide the button).
- Page transitions (View Transitions) need the pages served over http in Chrome, Edge or Safari 18.2+, for example `python -m http.server` in `docs/design`. From the file system the pages simply change.
- All words, including the app's name, come from `prototype/assets/strings.js`. Rename the app with `app.name`.
- Refresh: `node docs/design/tools/tokens.mjs`, `node docs/design/tools/budget.mjs`, `node docs/design/tools/screenshots.mjs` (Node 22+, Chrome installed).

## The concept: the gold line

Sabi draws a gold line from "I am lost" to "I found it". The line is the route you walk across campus, it is the gold trim on an academic gown, and it is the thread that ties each fact to who said so. It runs through the whole app, so the identity is something you use, not decoration:

- **The mark** is an S drawn as a route: it starts at a filled station (you are here), turns twice, and ends at an open one (where you are going).
- **The top bar** sits on the line. When the phone goes offline, **the line breaks into dashes**.
- **Home** is a line with four stations (Map, Academics, Timetable, Notices). It draws itself in once per session.
- **The ticket** on Home shows your next class like a transit ticket: the time large, "in 25 min", and the venue on the stub.
- **First sync** draws the mark, then fills a line of five stations as each kind of data is saved, and ends with "You're set".
- **The timetable** has a gold **Now** line across today, and the next class says how long until it starts.
- **Empty, error, offline and no-match states** each show a short stretch of the line that says what happened: still to come (dashes), a break, a detour, a station with no name.
- **The band**: every screen's title sits on a night-maroon "sky" with faint contour lines (a walker's map). Its lower edge follows the time of day: warm in the morning, maroon in the afternoon, deeper in the evening, near black at night.

Why this over round 1's signpost: a signpost is one picture on one screen. A line can run through every screen, move, and carry real state (online or offline, progress, now), so the brand works harder and costs almost nothing (lines are CSS borders and tiny SVG paths).

## What changed from round 1

| Area | Round 1 | Round 2 | Why |
|---|---|---|---|
| Identity | System font wordmark with a small signpost icon | The route mark; app icon and maskable icon in `brand/` | A logo students can recognise on their home screen |
| Shell | Maroon top bar, gold 4px trim | Night-maroon bar on the gold line; the line breaks when offline | The trim now carries meaning |
| Screen titles | Plain heading on paper | The band: maroon sky, contour lines, time-of-day edge | Depth and atmosphere without images |
| Home | Signpost boards on a pole | The ticket (next class) and the line of stations; a Lite switch | Home answers "what next?" before "where to?" |
| Icons | One stroke set | Same grid, plus one gold "you are here" detail that lights when current | An icon language, still one set |
| Lists | Rows with a "this way" tip | Same, plus school and department codes as line bullets, initials discs for people, photo slots for buildings | Easier scanning, no faces |
| Timetable | Days in a list, Today in gold | A week strip, today on a gold panel, the Now line, "Next, in 25 min" | The timetable knows what time it is |
| Notices | Scope in words | Scope chips (University, SUG, School, Department), New tag | Faster triage |
| Department | Facts and a gold sign | A band with a photo slot, a Timetable card | Room for real photos |
| States | Icon and text | Line pieces (pending, break, detour, arrived, no match) | One picture language |
| First sync | A breathing bar and a count | The mark draws; five stations with real counts; a Finished state | The one long wait becomes the welcome |
| Motion | Press and disclosure only | Page transitions, one entrance per screen, the stamp, counted numbers | Feels alive; all of it optional |
| Radii | 6px everywhere | Controls 10px, plates 14px, cards 18px | Softer, more like the best phone apps |
| Weights | 400, 500, 650, 800 | Plus 900 for band titles, the ticket time and the wordmark | A heavier display voice with zero font bytes |
| Screenshots | 155 PNGs, 9.1 MB | 95 WebPs, 5.4 MB | Smaller repo; every round 1 PNG deleted |

## Data budget (measured by `tools/budget.mjs`)

| What Home adds | Measured (gzip) | Budget |
|---|---|---|
| Art: mark, icons, contours, line pieces | 2.4 KB | 4 KB |
| Motion and Lite code (plus the inline head script) | 1.8 KB | 2.5 KB |
| Stylesheet | 7.7 KB | 10 KB |
| Tokens | 1.4 KB | 4 KB |
| **Round 2 design layer, total** | **13.3 KB** | **20 KB** |
| Fonts | 0 | 0 |
| Images on first load | 0 | 0 (photos come later, never in Lite: see PHOTOS.md) |
| Whole prototype Home page, every file, comments included | 38.0 KB | 40 KB |
| Added since round 1 (whole prototype Home) | 13.1 KB | 15 KB |

The app's first-load limit is 150 KB gzipped (`npm run check:bundle`). The design layer is about a tenth of that.

## Lite mode

- **On by itself** when the phone asks to save data: `navigator.connection.saveData`, a 2G connection (`effectiveType` `slow-2g` or `2g`), or `prefers-reduced-data: reduce`. Decided before the first paint by a short inline script.
- **A switch on Home** ("Lite mode", under "Saved on this phone") overrides it, remembered on the phone. The hint says why it is on. A small "Lite" chip shows in the top bar while it is on.
- **What turns off:** contour lines, photos (no request is made), the ticket's shadow, the band's gradient, page transitions, entrances, the stamp, counted numbers, loops and transitions. The Map does not load its tiles by itself ("Load the map" button).
- **What stays:** every screen, colour, type, the line and its stations, the seal. It still looks like Sabi.

## Motion rules

- Every animation stops under `prefers-reduced-motion: reduce` (state changes stay, movement goes).
- Loops (the loading skeleton, the first-sync bar) run only while on screen (IntersectionObserver) and pause when the page is hidden. There are no other loops.
- The one entrance per screen (the line drawing in, the mark drawing on first sync, the top bar's line) plays once per session, only when on screen.
- Page transitions: the station you tap on Home slides into the next screen's title; the tab capsule glides to the new tab. 420ms, ease-out. Same-page changes (open a notice, flip Lite, stamp a seal) morph with `startViewTransition` where supported.
- Haptics: a 12ms buzz on Android in two places only: a record marked verified, and first sync finished.

## Hand-off for frontend developers

Nothing below has been applied to `web/src`. These are the mappings for whoever does. Round 1's mappings still hold except where this table changes them.

### New files to bring across

| Prototype | Into `web/` | Notes |
|---|---|---|
| `prototype/assets/art.js` | `web/src/components/art/` as small React components (`Mark`, `Icon`, `Contours`, `LinePiece`) | Same SVG strings; `Icon` takes `name` and `current` |
| `prototype/assets/motion.js` | `web/src/lib/motion.ts` | `init` becomes a hook; `setLite` writes `sabi-lite` to localStorage |
| The inline `<head>` script in each page | `web/index.html` | Sets `data-lite` before first paint. The theme part is the prototype's |
| `brand/app-icon*.svg` | `web/public/icons/` and the manifest in `web/brand.ts` | Export PNGs at 192 and 512 from the SVGs; the maskable one keeps the mark in the safe zone |
| `tokens.css` | Replace the `:root` blocks in `web/src/styles.css` | New: band colours, `maroon-wash`, `gold-wash`, `accent`, radii, `dur-long`, `dur-focal`, `ease-in`, `text-4xl`, `weight-black`, `station`, `shadow-lift` |

### Components: what changed since round 1

| Prototype (in `app.css`) | Existing | What changes |
|---|---|---|
| `.topbar` + `.wordmark` + `.topbar::after` | `nav` in `App.tsx` | Background `--color-band-top`; the gold line is `::after`; `html[data-net="offline"]` makes it dashed (set from the same signal as `OfflineBanner`); the wordmark is `<Mark/>` + `APP_NAME` at weight 900 |
| `.tabs`, `.tabs__cap` | bottom nav (round 1) | The current tab's icon sits in a `maroon-wash` capsule with `view-transition-name: tab-cap` |
| `.band`, `.band__inner`, `.band__hello`, `.contours`, `.slot` | the `<h1>` + intro on every page | New wrapper for each page's title. `data-daypart` from the phone's clock (morning before 12, afternoon to 17, evening to 21, night). Detail screens use `.band--detail` with the back link inside |
| `.line`, `.stop`, `.stop__link`, `.stop__ring` | `Home.tsx` (signpost in round 1) | Home's four places as stations. Give each `--i` (0 to 3) and a `data-once` key |
| `.ticket-wrap`, `.ticket`, `.ticket__main`, `.ticket__stub` | `Home.tsx` (new) | Next class from the saved timetable for the student's department and level; minutes counted from the phone's clock (update every minute while visible). No department: "Choose your department" state |
| `.week`, `.day--today`, `li.now`, `.now__tag` | `Timetable.tsx` | Week strip of anchors; today on a gold-wash panel; the Now line inserted before the first entry that starts after now; "Next, in N min" chip |
| `.chip--maroon/gold/wash/outline` | `Announcements.tsx` scope text | Scope as a chip: University maroon, SUG gold, School wash, Department outline. "New" for unseen items (needs a "last opened" time saved on the phone) |
| `.code-chip` | `Academics.tsx`, `DepartmentDetail.tsx` | School and department codes as line bullets |
| `.person`, `.monogram` | lecturer rows | Initials disc (`initials()` in art.js) |
| `.place`, `.thumb` | MapPage building rows (Maps owner) | 72px photo slot with the pin icon fallback |
| `.go-card` | the Timetable link in `DepartmentDetail.tsx` | Replaces round 1's gold sign |
| `.state` + `.piece` | empty and error blocks | The line piece replaces the icon: `pending` (empty), `detour` (error), `nomatch` (search), `arrived` (all done), `break` (offline) |
| `.sync`, `.mark--xl`, `.count`, `.progress`, `.line` in the band | `FirstSyncScreen.tsx` | Full-height band. Needs per-collection counts from `runSync` (today it only counts total rows): a small change in `web/src/lib/sync.ts` for the frontend owner. A "Finished" state replaces the screen when the last page lands |
| `.seal.is-stamped` | `VerificationNote.tsx`, the verify screen | Add the class only right after the admin marks it verified |
| `.switch`, `.switch-row`, `.lite-chip` | `Home.tsx`, `App.tsx` (new) | The Lite switch (`role="switch"`) and the top bar chip |
| `.sheet-card` | `Login.tsx`, `Register.tsx` | The form sits on a raised card that overlaps the band |
| `.page-tabs` | `Admin.tsx` | Now sticky under the top bar |

### Copy to keep or change

- Kept word for word from `web/src`: loading, error, empty, "not saved", form errors, `friendlyError`, first-sync, offline and admin gate texts.
- New, for David to approve: the greetings ("Good morning", "Good afternoon", "Good evening", "Up late"), the ticket copy, "You're set", the Lite mode copy, "Load the map", "Now 08:35", "Next, in 25 min", "New". Round 1's open labels ("Notices", "Where to today?") still stand.
- Rules: no em or en dashes, no middle-dot joins, sentence case, no tracked capitals.

### Not designed here

The school (faculty departments) page uses the same band, list and seal as Academics. Class reps have an API but no screen yet. The map itself belongs to the Maps/GIS owner.
