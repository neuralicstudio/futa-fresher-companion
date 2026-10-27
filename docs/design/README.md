# Sabi design handoff (docs/design)

**The approved mockups in the design Inspo folder win over this prototype wherever they differ. The prototype is a reference for tokens, components, copy and states.**

The handoff for the FUTA campus guide (working name **Sabi**), built from the approved mockups. It is **design only**: nothing in `web/src`, `api`, `db` or `docs/openapi.yaml` changed, and no dependency was added. **Dark only for now**; a light theme is a later task.

Start with [prototype/index.html](prototype/index.html) (double-click it; it works from the file system with no server). Every screen has a **Prototype** button at the left edge: switch its state, Lite mode, the photo pack and who is signed in.

## What is here

| What | Where |
|---|---|
| **1. Tokens**: colours, fonts, sizes, spacing, radii, shadows, gradients, motion | [TOKENS.md](TOKENS.md) (generated), [tokens.css](tokens.css), [tokens.json](tokens.json), [tools/tokens.mjs](tools/tokens.mjs) |
| **2. Components** and their states | [COMPONENTS.md](COMPONENTS.md), live at [prototype/components.html](prototype/components.html) |
| **3. Screens**: a code prototype each, and a short spec | [SCREENS.md](SCREENS.md), [prototype/](prototype/) (21 pages) |
| **4. Pidgin copy**: every string by screen and key | [COPY.md](COPY.md) (generated from [prototype/assets/copy.js](prototype/assets/copy.js)) |
| **5. Screens that were not designed**: Publish Notice, My Notices, Verify Data, Your Role, Notice detail, Place detail, empty, error, offline | Built in the same style: `publish`, `mynotices`, `verify`, `role`, `notice`, `place`, `states` |
| **Credits**: every photo, the map data, icons and fonts, with verified file pages | [CREDITS.md](CREDITS.md) |
| The system in words, and the open questions | [DESIGN.md](DESIGN.md), [BRIEF.md](BRIEF.md), [PHOTOS.md](PHOTOS.md) |
| What ran and what it found | [LOG.md](LOG.md), [SKILLS.md](SKILLS.md) |
| Screenshots | [screenshots/](screenshots/): every screen at 390 and 768px, every state at 390, Lite, no photos, 200% text (WebP) |

## The fixes to the mockups (applied everywhere)

1. **Five tabs only**: Home, Map, Academics, Timetable, Notices. Settings and Admin open from the profile icon (Admin only for admins).
2. **"Verified" only when a record is truly verified** (an admin did it; who and when are in its Source). **Notices show their source** ("From SUG"), never "Verified".
3. **"Sabi's privacy policy"**, not FUTA's. The footer says **"Unofficial app, not affiliated with FUTA."**
4. **Every credit in the mockups was invented.** The credits here are read from the real Wikimedia Commons file pages (author, licence, link), see [CREDITS.md](CREDITS.md). Photos we cannot credit are **placeholders** (drawn scenes). The night gate photo is credited to FUTA's official Facebook page and stays local until FUTA's written OK arrives.
5. **No invented lecturers or faces**: initials avatars and "Prof. A. Sample" style names.
6. **At most one handwritten line per screen** (the hero kicker). Pidgin everywhere else; **the notice text is whatever the admin wrote**.
7. **Email fields accept any email** (the placeholder is gmail, not futa.edu.ng).
8. **The map is OpenStreetMap data** (vector, dark, works offline), not satellite tiles. **No routing**: no "Get directions", no walking times.
9. **Small first load** (below), the photo pack is optional, **Lite mode** strips the heavy visuals, and **reduced motion** is respected.

## How to build it (frontend)

1. **Tokens.** Copy `tokens.css` into `web/src` (its `:root` block and `@font-face` rules) and the `fonts/` woff2 files into `web/public/fonts/`. Keep the `--color-*` names. Never put a colour literal in a component.
2. **Icons.** `@phosphor-icons/core` (MIT) is not in `package.json` yet: either ask the lead to approve it, or inline the SVGs in [icons/](icons/) (regular and fill). The prototype uses a sprite built by `tools/build-icons.mjs`; the app should import only the icons it uses.
3. **Components.** Build the pieces in [COMPONENTS.md](COMPONENTS.md) once (Hero, Card, Button, Field, Chip, Seal, Avatar, Ring, StateBlock, TabBar, ProfileSheet), then each screen from [SCREENS.md](SCREENS.md). The prototype's `ui.js` is the reference for markup and `app.css` for styles; they are plain DOM and CSS so they map to React one to one.
4. **Copy.** Move [prototype/assets/copy.js](prototype/assets/copy.js) to `web/src/copy/pidgin.ts` with the same keys. Never hard-code a string in a component.
5. **Data.** Read it through the offline layer (`web/src/lib/offline.ts`, Dexie), never directly. The shapes of the sample data in [prototype/assets/sample.js](prototype/assets/sample.js) mirror the API; types come from `npm run gen:api`.
6. **Map.** Owned by the Maps/GIS role. `tools/bake-map.mjs` shows the approach (OpenStreetMap extract to vector paths, rendered as SVG, 34 KB gzipped). The app should keep it a lazy chunk, show "© OpenStreetMap contributors" on it, and add routing later.
7. **Photo pack.** Download after the first sync only on a good connection (see [PHOTOS.md](PHOTOS.md)), cache it under its own name, never in Lite mode.
8. **Check.** `node docs/design/tools/budget.mjs` and `node docs/design/tools/check.mjs` (see below).

## Sample data vs live

| Sample (made up, replace with the API) | Real (keep as is) |
|---|---|
| Everything in [sample.js](prototype/assets/sample.js): the user, admin, schools, department, courses, lecturers, classes, notices, "my notices", the verify queue, sync counts, storage figures, the clock (Tuesday 27 Oct 2026, 09:48) | **Place names on the map**, exactly as written in OpenStreetMap (their status is "not yet checked by FUTA"), and the map geometry |
| Names say "(sample)" or "Sample" wherever a real name could be mistaken for a fact | The photo credits (authors, licences, links) in [CREDITS.md](CREDITS.md) and `pack.js` |
| Every "Verified" in the prototype (it stands for a record an admin verified) | The strings in [COPY.md](COPY.md) (the voice), except the sample facts inside them |
| The profile, "Edit profile", the sample position on the map | Fonts, icons, the logo, the drawn scenes and students |

A **sample-data note** shows at the top of every screen in the prototype (hidden with `?proto=0`).

## Budget

The core layer (first load, with both fonts and the icon sprite, **no photos**) is **56.2 KB gzipped of 60 KB**; fonts **24.7 KB of 40 KB** (three Poppins weights and Yellowtail, OFL and Apache 2.0, subset to Latin, woff2). The map is a separate lazy chunk (34 KB). The photo pack is **943 KB of 1.5 MB** (11 open-licensed photos in the repo, 22 files, plus 12 local-only files on one machine), every photo WebP under 60 KB with no metadata. `node docs/design/tools/budget.mjs` measures all of it and exits 1 if anything is over.

## Checks

- `node docs/design/tools/tokens.mjs`: 44 contrast pairs, including text over photos against the worst pixel.
- `node docs/design/tools/budget.mjs`: bytes against budget; photos for size, format and metadata.
- `node docs/design/tools/check.mjs`: no external requests, every local file and page link resolves, every photo credited with a real author, licence and Commons page.
- `node docs/design/tools/screenshots.mjs`: re-takes the screenshots and fails on any script error. Add `--private` for the set with local-only photos (not committed).
- `node docs/design/tools/build-pages.mjs`, `build-icons.mjs`, `build-copy-doc.mjs`, `build-tokens-doc.mjs`, `bake-map.mjs`: regenerate the pages, icon sprite, COPY.md, TOKENS.md and the map from their sources.

## What is not in the repo (kept out on purpose)

`docs/design/inspo/` (the approved mockups: they contain AI-made people, invented credits and photos we have no licence to republish), `photos-source/`, `prototype/photos-local/` (photos with no licence), `screenshots-private/`, and the skills' working folders. All are listed in `.git/info/exclude`. A fresh clone is complete: every photo slot falls back to a drawn scene.
