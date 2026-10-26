# Sabi design (docs/design)

The design for the FUTA campus guide (working name **Sabi**). Design only: nothing in `web/src`, `api`, `db` or `docs/openapi.yaml` was changed. All sample data is fake and says "(sample)".

This is **round 3, the premium pass**. Round 2 (PR #39) was clean but dry: mostly colour and text. Round 3 makes Sabi image-rich, layered and alive, and keeps it cheap:
- **First load:** 45.0 KB gzipped, both fonts included, zero photos.
- **Photos:** a separate visual pack of 872.6 KB, downloaded later on a good connection.
- **Lite mode:** never loads the pack, and keeps the look with drawings.

## What is here

| Path | What it is |
|---|---|
| [BRIEF.md](BRIEF.md) | The design brief: audience, job, concept, states, constraints, open decisions |
| [PRODUCT.md](PRODUCT.md) | Product truth (Impeccable `init`), with inferred facts marked |
| [DESIGN.md](DESIGN.md) | The design system in words, with tokens in its frontmatter |
| [CREDITS.md](CREDITS.md) | Every image and font: where it came from, its licence, its credit, what was changed |
| [PHOTOS.md](PHOTOS.md) | The visual pack: how it downloads, its slots and budget, text over photos, and a guide for taking more |
| [tokens.css](tokens.css), [tokens.json](tokens.json) | Colours (light, dark, night, the time-of-day tints, the drawing palette), the two fonts, type, spacing, radii, glass, shadows, motion, and every contrast ratio, computed. Text over photos is measured against the worst pixel |
| [fonts/](fonts/) | Bricolage Grotesque (display) and Atkinson Hyperlegible Next (body), subset woff2, with their OFL licences |
| [brand/](brand/) | The mark, the app icon and a maskable app icon, as SVG |
| [prototype/](prototype/) | Static HTML prototypes of every screen and state, the component sheet and an index |
| [prototype/pack/photos/](prototype/pack/photos/) | The open-licensed campus photos (the visual pack), 22 WebP files |
| [screenshots/](screenshots/) | WebP screenshots: every screen at 390 and 768px, every state at 390, plus dark, Lite, no photos, other times of day and 200% text |
| [tools/tokens.mjs](tools/tokens.mjs) | Writes both token files and checks contrast. Change a value there, never in the outputs |
| [tools/budget.mjs](tools/budget.mjs) | Measures the core layer and the visual pack against the budget below, checks every photo for size and metadata, and exits 1 if anything is over |
| [tools/screenshots.mjs](tools/screenshots.mjs) | Re-takes the screenshots (headless Chrome, no dependencies) and fails on any script error |
| [SKILLS.md](SKILLS.md) | Every design skill, command, mode and rule group, and where it was used (all rounds) |
| [LOG.md](LOG.md) | What ran, what it found, what changed, waivers and disagreements (all rounds) |

Not in the repo, on David's machine only: `inspiration/` (the reference mockups), `photos-source/` (his photos), `prototype/photos-local/` (the processed copies of photos with no open licence) and `screenshots-private/`. All four are listed in `.git/info/exclude`.

## How to view it

- **Open it:** double-click `prototype/index.html`. It works from the file system, with no server, no network and no build. Fonts and photos load from the repo.
- **Prototype button:** every screen has one at the left edge. It switches the state, the theme, **Lite mode**, **campus photos** (downloaded, not downloaded, downloading, waiting for Wi-Fi) and the **time of day** (the hero's tint and the drawn sky).
- **Links:**
  - `?state=error`, `?theme=dark` or `?lite=1`
  - `?pack=none` (the drawings a phone without the pack sees)
  - `?daypart=night`
  - `?text=200` (200% text)
  - `?local=0` (hide David's local-only photos, as a fresh clone does)
  - `?proto=0` (hide the button)
- **Page transitions:** View Transitions need http in Chrome, Edge or Safari 18.2+, for example `python -m http.server` in `docs/design`.
- **Words:** all of them, including the app's name, come from `prototype/assets/strings.js`.
- **Refresh:** `node docs/design/tools/tokens.mjs`, `node docs/design/tools/budget.mjs` and `node docs/design/tools/screenshots.mjs` (Node 22+, Chrome installed). Add `--private` to that last one for the local-photo set.

## The concept: the flyer

Students at FUTA read flyers every day: freshers' nights, fellowship programmes, SUG campaigns, departmental week. The good ones lead with a picture, set one line huge, and put the one number that matters (the date, the time, the price) in a round sticker. **Sabi is the best flyer on the notice board, and it's true.** Every screen is built like one:

- **The hero.** A real FUTA photo from the visual pack, or a drawn scene when the pack is not on the phone. A scrim sits under the text, and the title is set big in Bricolage Grotesque ExtraBold.
- **The sticker.** A round ring that holds the number that matters on that screen:
  - Home and Timetable: minutes to your next class
  - First sync: how much is saved
  - Department: classes today
  - Settings: how much of the photo pack has downloaded
- **The light follows your day.** The hero's scrim and the drawn sky change from morning (warm), to afternoon (maroon), to evening (coral), to night (blue-black, with stars and a moon). The colours change like aso-ebi for the hour.
- **Four students.** They are original drawn characters: a student with braids and a phone, one in glasses with a backpack, one in a hijab with books, and one with a folder. They walk you through the first run, wait with you while data saves, cheer when you're set, and stand in for photos that don't exist yet.
- **Layered glass.** The next-class card, forms and notes float in frosted glass over the picture. The tab bar is a floating pill of night glass, with the current tab in gold.

**The logo** keeps round 2's idea, an S drawn as a route, and improves it: the route now ends in a rising sun. You start at a station and arrive at sunrise: "I found it".

**Why it replaced the gold line.** The line gave Sabi a system, but it was all strokes on maroon. It could carry state, not pictures, people or place. The flyer can hold a photo of the actual library, a student who looks like the reader, and the hour of the day, and it still carries the state: the sticker counts down, the sky darkens, the drawings stand in offline and in Lite. Two pieces of the line survive: the route in the logo, and the ring strokes.

## What changed from round 2

| Area | Round 2 | Round 3 | Why |
|---|---|---|---|
| Concept | The gold line: a route with stations | The flyer: a picture, one big line, a sticker | Room for photos, people and place; still carries state |
| Fonts | System fonts only, 0 bytes | Bricolage Grotesque 800 for display, Atkinson Hyperlegible Next 400 to 700 for body: 23 KB, subset, served from the repo | A voice with personality, and a body face made for readers with low vision |
| Screen tops | The band: maroon sky with contour lines | A full-bleed photo or drawn scene, a scrim tinted by the hour, the title at 2.5 to 3rem | Image-rich and layered, as David asked |
| Photos | None (slots only) | 11 open-licensed FUTA photos in the visual pack, plus David's photos locally; every slot falls back to a drawing | Real places, without first-load cost |
| People | None; initials for lecturers | Four original drawn students in scenes and states; lecturers keep initials | Warmth without anyone's likeness |
| Navigation | Top bar, bottom tabs with a capsule | Glass top bar over the hero; a floating pill tab bar, the current tab in gold; floating actions on Map and Admin | The pill navigation and floating actions from the references |
| Home | Ticket and the line of stations | The hero with a greeting, a glass next-class card with a countdown sticker, four coloured doors, an "Around campus" photo row, saved data as a stacked bar | Home answers "what next" and shows the campus |
| First run | First sync only | A new **Welcome** screen, then first sync over a night scene, with a glowing ring, mini rings per collection, and sunrise and a burst when you're set, plus the offer to download the photos | A gorgeous first run that still works with no photos |
| Map | A grey slot with contour lines | An alive drawn campus map: a flowing route, a pulsing "you are here", numbered pins that match the building cards; photo cards; filter chips; a "Find a building" action | The map header feels alive, and stays honest (it says it's a drawing) |
| Data views | None | A countdown ring, a stacked bar of saved data, units by level, hours this week, a status donut on Admin | Charts and rings, always on real (sample) figures with text values |
| States | Line pieces | Small scenes: a student waiting, offline with a phone, on a detour, cheering, searching | The same meanings, with people |
| Settings | None | A new **Settings** screen: the visual pack (download now, only on Wi-Fi, remove), Lite, theme, photo credits | The controls the pack needs |
| Dark | Maroon-tinted dark | Night campus: near-black maroon, the gold carries selection and figures | Dark with a bright accent, as in the references |
| Radii | 10, 14, 18px | Fields 14px, cards 24px, sheets 32px, controls and chips as pills | Softer, as in the references |
| Screenshots | 95 WebP, 5.4 MB | 103 WebP, 6.0 MB; all round 2 shots deleted | More screens and looks, WebP at quality 72 |

The screen set and states are the same as round 2, plus **Welcome** and **Settings** (new screens) and Settings' states (Lite on, offline). Round 2's "No department yet" and "Finished" states are kept.

## Data budget (measured by `tools/budget.mjs`)

The binding limits are David's: the core layer at most **60 KB** gzipped (fonts and the SVG art included, zero photos), fonts at most **40 KB**, the visual pack at most **1.5 MB**, and each photo at most **60 KB**. I set the per-file lines inside the core while building. They are working limits, not targets I set before measuring.

| Core layer: first load | Measured | Budget |
|---|---|---|
| Tokens | 2.0 KB | 4 KB |
| Stylesheet | 10.6 KB | 16 KB |
| Art: logo, icons, rings, scenes, four students, the map | 5.7 KB | 9 KB |
| Motion and Lite, plus the inline head script | 1.7 KB | 2.5 KB |
| Photo slots and the pack switch | 2.0 KB | 2.5 KB |
| Fonts (two woff2) | 23.0 KB | 40 KB |
| **Core, total** | **45.0 KB** | **60 KB** |
| Photos on first load | 0 | 0 |

| Visual pack | Measured | Budget |
|---|---|---|
| Open-licensed photos in the repo (11 photos, 22 files) | 677.3 KB | |
| David's local-only photos (5 photos, 10 files, not in the repo) | 195.3 KB | |
| **Pack, total** | **872.6 KB** | **1.5 MB** |
| Largest single file | 58.4 KB | 60 KB |
| Files with EXIF or XMP metadata | 0 | 0 |

For reference, the prototype's own renderers and sample text add 24.8 KB. The app has its own React code for that. The app's whole first-load limit is 150 KB gzipped (`npm run check:bundle`).

## Lite mode

- **On by itself** when the phone asks to save data (`saveData`, a 2G connection, `prefers-reduced-data`). The switch on Home and in Settings overrides it. A "Lite" chip shows in the top bar.
- **Off:** the visual pack is never downloaded or shown, and glass becomes solid. Drifting clouds, twinkling stars, the map's route, the ring sheen, entrances, transitions and the stamp all stop.
- **Stays:** every screen, the drawn scenes and students, the fonts, the colours, the stickers and rings (static), and the seal.

## Motion rules

- **Reduced motion:** under `prefers-reduced-motion: reduce` everything stops, and state still changes.
- **Ambient loops** (clouds, stars, the map's route and "you are here" pulse, the first-sync ring's sheen, skeletons) run only while their element is on screen (IntersectionObserver), and pause when the page is hidden. None runs in Lite.
- **One entrance per screen** (Home's doors rising in) plays once per session, on screen. Rings fill and bars grow when they appear.
- **Parallax-lite:** the hero's picture drifts slower than the page as you scroll. It's CSS scroll-driven animation, with no JS, and only where supported.
- **Page transitions** (View Transitions): the door you tap on Home slides into the next screen's title, and the tab bar stays put.
- **Delight moments:**
  - "You're set": sunrise, a gold burst, and a 12 ms buzz on Android.
  - "Mark verified": the seal stamps on with one small overshoot.

## Hand-off for frontend developers

Nothing below has been applied to `web/src`. These are the mappings for whoever does it.

### New files to bring across

| Prototype | Into `web/` | Notes |
|---|---|---|
| `fonts/*.woff2` and their OFL files | `web/public/fonts/` | Load with the `@font-face` rules at the top of `tokens.css`, `font-display: swap`. Preload the display face only |
| `tokens.css` | Replace the `:root` blocks in `web/src/styles.css` | New: night, the time-of-day tints, jade, sky, coral and their washes, the scene palette, glass, `scrim-alpha`, radii, `ease-pop`, `dur-ambient`, `text-5xl` |
| `prototype/assets/art.js` | `web/src/components/art/` | As small components: `Mark`, `Icon`, `Ring`, `Scene` (kind, daypart, people), `CampusMap`, `StateScene` |
| `prototype/assets/pack.js` | `web/src/lib/visualPack.ts` + the service worker | Photo entries (alt, credit, sign name, placeholder colours), `PhotoSlot`, and the download policy in PHOTOS.md |
| `prototype/assets/motion.js` | `web/src/lib/motion.ts` | As in round 2, plus scenes observed for their loops |
| `prototype/pack/photos/` | Served as static files, cached by the service worker under a versioned cache | Never precached with the app shell |
| `brand/*.svg` | `web/public/icons/` and the manifest | Export PNGs at 192 and 512 from the SVGs |

### Components

| Prototype (in `app.css`) | Existing in `web/src` | What changes |
|---|---|---|
| `.hero`, `.hero__media`, `.hero__inner`, `.pic` | the `<h1>` and intro of every page | Wraps each page title. `data-daypart` on `<html>` from the phone's clock (morning until 12, afternoon until 17, evening until 21, then night). The scrim is `.hero__inner::before` |
| `.topbar--over`, `.wordmark`, `.round`, `.lite-chip` | `nav` in `App.tsx` | Glass controls over the hero; a Settings button (new route) |
| `.tabbar` | bottom nav | Floating pill; the current tab in gold. From 1024px the tabs move into the top bar |
| `.fab` | new | Map ("Find a building", focuses the search) and Admin ("New announcement") |
| `.next`, `.sticker` | `Home.tsx` | Next class from the saved timetable; the sticker shows minutes to start, and the ring fills as the hour runs down. Without a department, the "Choose your department" state |
| `.doors`, `.door--*` | `Home.tsx` | Four coloured doors with `view-transition-name: vt-<key>` on the title |
| `.rail`, `.place-card` | `Home.tsx` (new) | "Around campus": photo cards, named only from signs |
| `.stack`, `.legend`, `.bars`, `.donut` | Home, Department, Timetable, Admin | Charts drawn from the data on the phone. Every value is also written as text |
| `.places`, `.place`, `.pin-code` | MapPage building rows (Maps owner) | Photo or drawn card; the code matches the pin on the map |
| `.campus-map` | MapPage (Maps owner) | Only until the live map loads; it says it is a drawing |
| `.schools`, `.school` | `Academics.tsx` | A card per school with a drawn header |
| `.go-card` | `DepartmentDetail.tsx` | Night card with "classes today" sticker |
| `.week`, `.day--today`, `.tt`, `.now` | `Timetable.tsx` | Cards per class; the next one outlined in gold |
| `.notices`, `.notice--lead`, `.filter` | `Announcements.tsx` | Scope chips: University maroon, SUG coral, School jade, Department sky. The first notice leads with a drawn scene |
| `.sync`, `.sync__ring`, `.sync-row`, `.offer` | `FirstSyncScreen.tsx` | Needs per-collection counts from `runSync`: a small change in `web/src/lib/sync.ts` for the frontend owner |
| `.welcome` | new, before first sync | Shown once, before the first sync |
| `.pack`, `.mosaic`, `.credits` | new Settings route | The visual pack card and credits |
| `.state` + `.piece` | empty and error blocks | Small scenes: `pending`, `detour`, `nomatch`, `arrived`, `break` |
| `.seal.is-stamped` | `VerificationNote.tsx` | Add the class only right after the admin marks it verified |

### Copy

- **Kept word for word from `web/src`:** loading, error, empty, "not saved", form errors, first-sync, offline and admin gate texts.
- **New, for David to approve:** "Find your way around FUTA" and the Welcome lead; "Around campus"; "Add campus photos?" and the visual pack copy; "Only on Wi-Fi"; "Find a building"; "Your department at a glance"; "Hours of lectures this week"; "Units by level"; "No photo yet". Round 2's open copy still stands.
- **Rules:** no em or en dashes, no middle-dot joins, sentence case, no tracked capitals.
