# Screens

A short spec for every screen: what it is for, what is on it in order, its data, its states, and where it differs from the approved mockups on purpose. The code prototype of each is in [prototype/](prototype/) (`<name>.html`; open `index.html` for the list). Its `?state=` values are the state names below. Words are in [COPY.md](COPY.md), data shapes in [prototype/assets/sample.js](prototype/assets/sample.js). Parts are described in [COMPONENTS.md](COMPONENTS.md).

**Every screen:** dark by default, one handwritten line (the hero's kicker), the five-tab floating bar (Home, Map, Academics, Timetable, Notices) unless noted, the profile icon top right (Settings, and Admin for admins only), the footer ("FUTA no go hard for you. We dey with you." and "Unofficial app, not affiliated with FUTA." with a link to Photo credits), and loading, empty, error and offline states.

**Differences from the mockups, applied everywhere** (these fix the mockups' mistakes):

| In the mockups | Here | Why |
|---|---|---|
| Tabs vary: some show Profile, More, Classes or Admin; one has 4 and one 6 | Five tabs on every screen: Home, Map, Academics, Timetable, Notices. Settings and Admin open from the profile icon (Admin only for admins) | One navigation model |
| A green "Verified" on notices and on the department | "Verified" only on a record an admin verified. A notice shows its source ("From SUG") | Verified is a claim the data must back |
| "FUTA's privacy policy" | "Sabi's privacy policy" | Sabi is not FUTA's app |
| No disclaimer | Footer: "Unofficial app, not affiliated with FUTA." | Same |
| Invented photo credits ("FUTA Media Unit", "@futastudents (X)", "CC BY 4.0") | Real credits from the Commons file pages (CREDITS.md) | They were made up |
| Named lecturers with AI faces | Placeholders with initials avatars | No invented people or faces |
| Handwritten notes in two or three places on a screen | One per screen | The mockups overdid it |
| Email placeholder "yourname@futa.edu.ng" | "yourname@gmail.com", and any email is accepted | Not every student has a FUTA email |
| Satellite map with a route and "Get directions", "3 mins walk (220 m)" | OpenStreetMap vector map, no routing, no walking times | No routing yet; no invented distances |
| Invented place details ("Open 7:00 AM to 8:00 PM") | "Opening hours no dey" until an admin adds them | No invented facts |
| Fresher-only photo people | Drawn original students in fallback scenes; no real faces | Privacy |

---

## 1. Welcome (`welcome.html`)

**For:** the first screen before anything is saved. **Mockups:** Welcome (night gate; "Get started"), and the "Oya, fresher!" variant. I used the second's copy and the first's layout (one maroon button, a text link for Log in), with the three pillars from the third as a card below.
- Full-bleed night gate hero (the photo pack, or the drawn gate scene), logo lockup top left, no profile icon, no tab bar.
- Handwritten "Oya, fresher!", title "Welcome to FUTA, **Akure**", one line, a maroon "Oya, make we start!" button (goes to First-time sync), "I don get account. Log in".
- A gold-outlined card: Find your way, Know your academics, See the gist.
- **Data:** none. **States:** none (it is static).
- **Photo:** `gate`; David's night photo when present locally. On first run no pack is on the phone, so the scene shows.

## 2. Home (`home.html`)
**Mockups:** Dashboard (12 mins badge, Next Lecture, Latest Notice, Popular Places).
- Hero with the gate, "How far, fresher!", "Welcome to FUTA, Akure.", a lead, the **countdown badge** (minutes to the next class, as a gold ring) and the big search field.
- Two cards: **Next lecture** (course code and title, time, venue, arrow to Timetable) and **Latest notice** (gold bar on its left edge, title, three lines, source and date).
- **Popular places**: a horizontal rail of four photo cards (numbered), "See all" goes to Map.
- **Data:** the next class from the saved timetable (needs department and level), the latest notice, the places list. **Differences:** the notice card shows "From SUG on 25 Oct 2026", not "Verified".
- **States:** `offline` (banner), `syncFailed` (banner with retry), `noDept` (the next-lecture card asks for your department; no badge), `noNotice` (the notice card is hidden).

## 3. Campus Map (`map.html`)
**Mockups:** Campus Map at Night.
- Hero ("Find your way!", "Campus **Map**"), search, **Quick categories** (lecture theatres, buildings, food, libraries, sports, health, hostels), the **map card**, the **selected place card**, then the list of all places.
- The map is drawn from **OpenStreetMap data** (1,458 buildings, roads, paths, pitches, water) in the brand's dark colours, so it works offline. Pins are coloured by category and keep their size when you zoom. Pan by drag or arrow keys; zoom with + and -, the wheel, or the keys. A compass, "My location" (sample position), and the "© OpenStreetMap contributors" attribution.
- The selected place shows its category, "Source: OpenStreetMap, not yet checked by FUTA", "Opening hours no dey", a one-line blurb for its category, **See details** and **View on map**. **No Get directions and no walking time**: routing is not in v1, and the screen says so ("Directions no dey yet").
- **Data:** the places list: id, name (exactly as in OpenStreetMap), category, coordinates, an optional photo, status. **States:** `offline` (the map still draws), `searchEmpty`.
- **Accessible alternative:** every pin is a button, and the place list below carries the same places as links.

## 4. Place detail (`place.html?id=library`)
**Not in the mockups; designed here** in the same style.
- Hero with the place's photo (or a drawn building), its name as the title, its category chip. A card with category, where, hours, a blurb, the source seal (unverified until an admin checks it) and **View on map**; a small map; **Nearby** (three closest).
- **States:** `noPhoto` (a card says "Photo dey come" and asks for one; the hero shows a drawing), `notFound`.

## 5. Academics (`academics.html`)
**Mockups:** Academics (FUTA Schools grid, Computer Science panel with tabs).
- Hero ("Your academics, **no stress!**"), search, **FUTA Schools** grid of photo cards (icon, name, number of departments), then the **department panel**: photo, back chip, icon, name, **Verified** chip only if verified, blurb, tabs (Courses, Lecturers, About), **Popular courses** and **Key lecturers** side by side from 640px, stacked on phones.
- Lecturers are **initials avatars** and sample names ("Prof. A. Sample"); a star marks the head of department.
- **Data:** schools, departments, courses, lecturers, each with a status, date and source. **States:** `loading`, `empty`, `error`, `offline`; a school with no saved departments shows an empty state.

## 6. Timetable (`timetable.html`)
**Mockups:** Timetable ("Your timetable, sorted!").
- Hero, **Level** and **Semester** selects in one pill, a scrolling **day strip** (today dotted, the selected day gold), then the day's classes as cards (time, code, title, kind, venue; the next one gold-outlined with "Next up, in 12 min"), then the next day. A day with no class shows "No class today. Rest small, king. You don earn am."
- **Data:** classes by day, level and semester; the venue may be missing ("Venue never dey yet."). **States:** `loading`, `empty` (adds the "Timetable never dey yet?" card with Contact dept.), `error`, `noDept` (choose your department), `offline`.
- The mockups had Academics highlighted on this screen; here **Timetable is its own tab**.

## 7. Notices (`notices.html`)
**Mockups:** Latest Notices.
- Hero ("Don't miss out!", "Latest **Notices**"), search, filter chips (All, University, SUG, My school, My department), then notice cards: a **scope chip** (University gold, SUG red, School green, Department indigo), the date, **Unread**, the title, **From {source}**, three lines, "View full details" with a paperclip when there is an attachment. The first is gold-outlined.
- **The text is whatever the admin wrote.** There is no Verified tick: the source line is the trust signal.
- **States:** `loading`, `empty` ("No new notices"), `error`, `offline`; filtering to an empty scope shows "No notice from {scope} yet." An unread dot sits on the Notices tab.

## 8. Notice detail (`notice.html?id=n2`)
**Not in the mockups; designed here.** A plain header with Back, then a gold-outlined card: scope chip, date, title, "From {source}", the full text, the attachment row, who it is for and when it expires; a card on where this came from; Share and Back to notices. **States:** `notFound`.

## 9. Register (`register.html`)
**Mockups:** Create your account.
- Hero with a drawn student waving, form on a rounded card: full name, email, password with show/hide and a **strength meter** (four segments and a word), school, department (disabled until a school is chosen), level (these three are optional), the consent checkbox ("I agree to **Sabi's** privacy policy"), **Create account**, "Already get account? Log in".
- **Email accepts any address.** The placeholder is gmail, and the hint says a FUTA email is not needed.
- **States:** `invalid` (an error summary with links, per-field errors), `taken` ("This email don dey registered", as a dismissible bar), `sending`, `busy` (503), `offline`.

## 10. Log in (`login.html`)
**Mockups:** Welcome back, future star.
- Hero with a drawn student, email, password (show/hide), **Log in**, "Or", "Don't have an account? Register", and the offline reassurance ("No data? No wahala!").
- "Forgot password?" is shown only when the backend supports it; it is not designed.
- **States:** `invalid`, `wrong` (the mockup's "Incorrect email or password. Try again, abeg."), `sending`, `busy`, `session` (401), `registered`, `offline`.

## 11. First-time sync (`sync.html`)
**Mockups:** Let's sync your FUTA life.
- Hero, then a card with the **progress ring** (68%) and six rows: Schools, Departments, Courses, Timetables, Buildings, Notices (counts such as 132/256, with done, in-progress and waiting marks); "You fit keep using Sabi"; **Continue without saving**; **Why save first?**; "Uses about 12 to 30 MB of data. Wi-Fi better (e no be scam)."
- **States:** `default` (syncing), `done` ("You're set!", with the offer to add the photo pack: "Download on Wi-Fi" or "Not now", and "Start exploring"), `failed` ("Network no strong", with Retry), `offline`. Per-collection counts need a small change in `web/src/lib/sync.ts`.
- The mockups' three state tiles (syncing, set, network) are shown here as the three states of the same screen, not all at once.

## 12. Settings (`settings.html`)
**Mockups:** Settings.
- Reached from the profile icon. Profile card (name, department and level, Edit profile; guests see "You no sign in"), **Offline data** (last saved, Check for updates, storage used), **Photo pack** (state, Download now, Remove, "Only on Wi-Fi"), **Lite mode**, **Theme** (Dark, Light, System), **Photo credits**, Language ("Pidgin (na our own)"), About ("Unofficial app, not affiliated with FUTA."), **Sabi's privacy policy**, Log out.
- **Pack states:** not downloaded, downloading (a ring and "5 of 11 photos"), waiting for Wi-Fi, on this phone, off in Lite mode. The pack never downloads on slow data or when the phone is saving data.
- **States:** `offline`, `lite`.

## 13. Photo credits (`credits.html`)
**Mockups:** Photo Credits. A plain header; one card per photo (thumbnail, what it shows, where it is used, **photographer, licence**, a link to the file page); then Map data (© OpenStreetMap contributors, ODbL), Icons (Phosphor, MIT) and Fonts. Every row is real (see [CREDITS.md](CREDITS.md)). The prototype shows only rows for photos that are in the pack.

## 14. Admin home (`admin.html`) *(admin only)*
**Mockups:** Admin Home. Reached from the profile icon, never from a tab. A role bar ("Department admin, Computer Science"), four tiles: **Publish notice**, **My notices**, **Verify data** (with a count badge), **Your role**. **States:** `signedOut`, `session` (401). A signed-in non-admin sees "Admins only o" instead.

## 15. Publish notice (`publish.html`) *(designed here, from the collage)*
Title (200), message (500), **Send to** (Everyone, My school, My department; options the role cannot post to are locked), the **source shown to students** ("From Computer Science department"), optional expiry, a **preview** card, **Publish notice**. **States:** `invalid`, `published` ("Notice published successfully!"), `session`, `busy`, `offline`. Plain text only; it goes live straight away. The server enforces scope; the UI only hides what the role cannot do.

## 16. My notices (`mynotices.html`) *(designed here)*
Filters (All, Published, Drafts), a card per notice (icon, title, date, audience, status, edit and delete), an **inline delete confirmation** (not a modal), a "Notice deleted" toast. **Delete is separated by space from the other actions** and needs a second tap. **States:** `confirm`, `drafts`, `empty`, `loading`, `error`.

## 17. Verify data (`verify.html`) *(designed here)*
A queue of records waiting for a check, filterable by kind (Buildings, Departments, Courses, Lecturers) with counts; each row has its source, when it was added and **Verify**. The detail asks for **the source you checked** (required), then **Mark verified** or **Mark outdated**; success shows "Verified!" with who and when. **States:** `detail`, `needSource`, `verified`, `empty`, `offline`, `loading`. **This is the only place a record becomes Verified**, and the server records who.

## 18. Your role (`role.html`) *(designed here)*
Name, scope and role; a list of what you can publish to (allowed and not allowed, with icons and words); a note that roles come from the server.

## 19. States (`states.html`)
Every empty, error, offline, not-found, no-match, storage-full and loading state in one place, with the banners and alerts. **They all use one pattern:** one gold icon in the same sparkle frame, a title, a line and at most one action.

## 20. Components (`components.html`), 21. Index (`index.html`)
The component sheet (colour, type, brand, icons, buttons in six states, fields, chips, seals, cards, rings, tab bar, footer) and the list of every screen with its states.

---

## How a screen is built

1. A **hero** (photo slot over a drawn scene, scrim under the text, one handwritten kicker), or a **plain** header on the admin and detail screens.
2. A `.page` column on the dark page: the **sample-data note** (prototype only), the optional banner for offline or sync-failed, then the content.
3. Cards use the crimson outline; the one important card per screen is gold-outlined.
4. The footer, then the tab bar (fixed, floating).
