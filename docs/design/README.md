# Sabi design (docs/design)

The design for the FUTA campus guide (working name **Sabi**). Design only: nothing in `web/src`, `api`, `db` or `docs/openapi.yaml` was changed. All sample data is fake and says "(sample)".

## What is here

| Path | What it is |
|---|---|
| [BRIEF.md](BRIEF.md) | The design brief: audience, job, direction, states, constraints, open decisions |
| [PRODUCT.md](PRODUCT.md) | Product truth (Impeccable `init`), with inferred facts marked |
| [DESIGN.md](DESIGN.md) | The design system in words (Impeccable `document` format, tokens in its frontmatter) |
| [tokens.css](tokens.css), [tokens.json](tokens.json) | Colours (light and dark), type scale, spacing, sizes, radii, shadows, motion, z-index, and every contrast ratio, computed |
| [tools/tokens.mjs](tools/tokens.mjs) | Writes both token files and checks contrast. Change a value there, never in the outputs |
| [prototype/](prototype/) | Static HTML prototypes of every screen and state, plus the component sheet |
| [screenshots/](screenshots/) | Every prototype at 360, 390 and 768px, some in dark mode and at 200% text |
| [tools/screenshots.mjs](tools/screenshots.mjs) | Re-takes the screenshots (headless Chrome, no dependencies) |
| [SKILLS.md](SKILLS.md) | Every design skill, command, mode and rule group, and where it was used |
| [LOG.md](LOG.md) | What ran, what it found, what changed, and every disagreement between skills |

## How to view it

- Double-click `prototype/index.html`. It works from the file system: no server, no network, no build, no fonts to download.
- Every screen has a **Prototype** button in the corner: switch the state (loading, empty, error, offline, busy...) and the theme (follow phone, light, dark). Links like `academics.html?state=error` open a state directly; `?theme=dark` forces dark; `?text=200` doubles the text size; `?proto=0` hides the button.
- All words, including the app's name, come from one object in `prototype/assets/strings.js`. Rename the app by changing `app.name` there.
- To refresh tokens or screenshots (Node 22+, Chrome installed): `node docs/design/tools/tokens.mjs` then `node docs/design/tools/screenshots.mjs`.

## The design in one paragraph

A maroon shell with a gold trim edge (the gown and its hood trim) carries the brief's wayfinding idea. Home is a signpost at a junction: four maroon direction boards on a pole, one per place in the app. Every fact on every screen carries a **source seal**: Verified (gold, a check), Unverified (dashed, an open circle) or May be outdated (amber, a warning), its updated date, and a Source disclosure. Gold always means current or confirmed: the current tab, today in the timetable, the verified seal. Everything else stays quiet so a student on a cheap phone in daylight can read it at a glance.

## Decisions and why

1. **System fonts only.** The brief caps font data at zero bytes. Hierarchy comes from four weights and a fixed 1.2 scale, so the system face does the work without a download. (Impeccable and Hallmark both prefer a sourced face for an own-world design; the low-data rule wins. See LOG.md.)
2. **Light by default.** Students read this outdoors. Dark is a designed second palette from the same hues, chosen by the phone or by the person.
3. **Bottom tabs on phones.** Four places within thumb reach; Admin and Log in sit in the top bar because most students never use them. From 768px the tabs move into the top bar.
4. **Rows, not cards.** Lists are rows between hairlines, each a 44px+ target with a small "this way" tip. Fewer boxes, more room for long Nigerian school and course names.
5. **The seal is not a symbol.** The live app's ✓ ○ ! glyphs become drawn icons inside a pill with the status in words; the date and the source sit beside it, not joined by a middle dot.
6. **States are designed, not left blank.** Loading is a skeleton in the shape of the list; empty says what is missing and why ("Saving campus data, this list will appear shortly" during the first sync); error says what broke and offers Try again; offline is an ink band that says the app is showing saved information.
7. **Notice titles are headings, not buttons.** A long title inside a button wraps the button label (Hallmark gate 49a). A short "Read all" button opens and closes the text.
8. **Delete confirms inline,** next to the item, not in a modal.
9. **No fake map.** The Map screen shows a labelled slot for the Maps team's tiles and a searchable building list that works offline.

## Hand-off for frontend developers

Nothing below has been applied to `web/src`. These are the mappings for whoever does.

### Tokens to the existing variables

| Existing (`web/src/styles.css`) | Use | Note |
|---|---|---|
| `--brand` (#0b6e4f) | `--color-maroon` | Shell, primary button. For text use `--color-link` (maroon in light, gold in dark) |
| `--bg` | `--color-paper` | Plus `--color-paper-2` (wells, bottom tabs) and `--color-paper-3` (fields) |
| `--fg` | `--color-ink` | |
| `--muted` | `--color-muted` | Now passes 4.5:1 on paper and wells in both modes |
| `.banner` background #b45309 | `--color-offline-band` / `--color-on-offline-band` | Offline; sync failed uses `--color-warning-wash` / `--color-warning` |
| hard-coded `#fff`, `#14201b` in `nav a`, `.sync-notice button` | `--color-on-maroon`, `--color-ink` | |
| `14px`, `12px`, `16px` paddings | `--space-*` | 4px base: 2, 4, 8, 12, 16, 24, 32, 48, 64 |
| `44px` min-heights | `--hit`; controls `--control-h` (48px) | |
| `prefers-color-scheme` block | the `[data-mode]` and media blocks in `tokens.css` | Copy `tokens.css` in, or import its values; keep `color-scheme: light dark` |

### Components to the existing classes and React components

| Prototype (in `prototype/assets/app.css`) | Existing | What changes |
|---|---|---|
| `.topbar` + `.wordmark` + `.topbar__tabs` | `nav` in `App.tsx` | Maroon bar with `border-bottom: var(--trim) solid var(--color-gold)`; wordmark reads `APP_NAME`; Log in / Admin on the right |
| `.tabs` (bottom, under 48rem) | `nav` links in `App.tsx` | New fixed bottom bar of four (Home, Map, Academics, Notices) with `aria-current="page"`; `main` needs bottom padding of `--bottomnav-h` |
| `.banner--offline` | `OfflineBanner.tsx`, `.banner` | Ink band, gold cloud-off icon, same text |
| `.banner--warn` + `.btn--secondary` | `SyncNotice.tsx`, `.sync-notice` | Warning wash; "Try again" as a secondary button |
| `.seal-line`, `.seal--verified/unverified/outdated`, `.source` | `VerificationNote.tsx`, `.verification` | Replace the glyph with an SVG icon in a pill; date in its own span (no "·"); `details.source` keeps the 44px summary |
| `.list`, `.row-link`, `.row-link__tip` | `.items`, `.items li > a` | Rows between hairlines; the link fills the row; the tip is decorative (`aria-hidden`) |
| `.back` | `.back-link` | Chevron icon, link colour, 44px |
| `dl.facts` | `.facts` | `dt` muted and small, `dd` medium weight; two columns from 48rem |
| `.sign`, `.sign--gold`, `.post` | `Home.tsx` (new); the Timetable link in `DepartmentDetail.tsx` | Home becomes the signpost; the department's Timetable link becomes a gold sign |
| `.skeleton` | the "Loading…" `<p role="status">` on each list screen | Keep the status text for screen readers; add the skeleton `aria-hidden` |
| `.state`, `.state--error` | the empty and `role="alert"` blocks | Empty: icon, message, help line. Error: message plus Try again |
| `.form`, `.field`, `.input`, `.select-wrap`, `.textarea`, `.hint`, `.field-error`, `.alert` | `.form`, `.field`, `.hint`, `.field-error` in Login, Register, Admin | Field edge `--color-muted`; inset focus ring; error icon; form-level error in `.alert--error`; Register gets an error summary that links to each field |
| `.btn--primary/secondary/quiet/danger` | bare `button`s | One primary per form; Delete is quiet until confirmed |
| `.tt`, `.tt__time`, `.tt__body`, `.day--today`, `.today-tag` | `Timetable.tsx`, `.today` | Start time large, end time small (no en dash range); venue with a pin icon; Today as a gold tag and a gold rule |
| `.select-wrap` + `.select` | `.level-picker select` | Native select, custom chevron |
| `.notice__body`, `.notice__more` | `.announcement-toggle`, `.announcement-body` | Title becomes a plain `h2`; a "Read all / Show less" button toggles (`aria-expanded`, `aria-controls`) |
| `.page-tabs`, `.inline-confirm`, `.choice` | `Admin.tsx`, `ManageAnnouncements` (PR #34) | Section anchors; inline delete confirm; the verify filter |
| `.progress`, `.count` | `FirstSyncScreen.tsx`, `.first-sync` | Indeterminate bar that breathes in place (static under reduced motion); the count large |
| `.map-slot` | `MapPage.tsx` | Placeholder for the Maps owner; building list below |

### Copy to keep or change

- Kept word for word from `web/src`: loading, error, empty and "not saved" messages, form errors, `friendlyError` texts, first-sync text, offline text, admin gate texts.
- Proposed, for David to approve: the "Notices" tab label (screen title also "Notices"; route stays `/announcements`), "Where to today?" on Home, the Verify screen copy, the timetable note "Times are in Nigerian time."
- Rules: no em or en dashes, no middle-dot joins, sentence case, no tracked capitals.

### Not designed here

The school (faculty departments) page uses the same list and seal as Academics. Class reps have an API but no screen yet. The map itself belongs to the Maps/GIS owner.
