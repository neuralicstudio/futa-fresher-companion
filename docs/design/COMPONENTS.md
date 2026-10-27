# Components

Every reusable piece, its parts, its states and the rules for using it. The live versions, in every state, are on [prototype/components.html](prototype/components.html). Class names are the prototype's (`prototype/assets/app.css`); the real app can keep them or rename them. Values are CSS variables from [tokens.css](tokens.css) (full list in [TOKENS.md](TOKENS.md)). Icons are Phosphor (regular; fill for the current tab and status marks).

**Rules for all of them:** 44px touch targets, a visible focus ring in `--color-focus` (instant, 2px, 2px offset), meaning never by colour alone (a word or an icon always goes with it), text at 16px or more except labels (14px) and tab labels (12px), no animation off screen, and everything works with `prefers-reduced-motion` and in Lite mode.

## Layout and chrome

### Hero (`.hero`)
Full-bleed header: a photo slot (`.pic`) over a drawn scene, a top row (logo lockup or Back, and tools), and a body with the handwritten kicker, the title, a lead and optional extras (search, badge, call to action).
- **Sizes:** `tall` 600px (Home, Welcome), `std` 430px, `short` 340px, `plain` (no picture: Back, a bar title, the logo, then the kicker).
- **Text over a photo is always on a scrim**: night at 72% or more wherever text lands, fading to the page (`--grad-hero-bottom`, `--grad-hero-top`). Daytime photos get `brightness(.62)` so they read as night, like the mockups. `tokens.mjs` measures every text colour against this scrim over a pure white pixel (the lowest is 4.65:1).
- **One handwritten line** (`.hand`, Yellowtail, gold) per screen. It is the kicker, never anywhere else.
- **Light theme:** the hero keeps its night treatment and its bottom edge rounds into the page.
- **States:** photo not on the phone (the drawn scene), Lite (the drawn scene, no blur), and the photo fading in once the pack is ready.

### Tab bar (`.tabbar`)
A floating pill, 72px, `--color-tabbar` with the crimson outline, five equal tabs: **Home, Map, Academics, Timetable, Notices**, each an icon over a label. The current tab is gold with the filled icon and `aria-current="page"`. The Notices tab carries a gold dot when there are unread notices (and a visually hidden "New notices"). From 1024px the bar can move to the top. Settings and Admin are **not** tabs.

### Profile icon and sheet (`.iconbtn`, `.sheet`)
Top right of every hero: a round button with the user's initials (or a person icon for guests), `aria-haspopup="dialog"`. It opens a bottom sheet: who you are, **Settings**, **Admin centre** (admins only), and Log out (or Log in and Create account for guests). The sheet traps focus, closes with Escape or the scrim, and returns focus to the button.

### Footer (`.foot`)
Gold wave lines in the corners, the logo and "FUTA no go hard for you. We dey with you.", then "Unofficial app, not affiliated with FUTA." and a link to Photo credits.

### Banners and alerts (`.banner`, `.alert`, `.toast`)
Offline (red-tinted, wifi-slash icon), sync failed (amber, with Retry), error (red), success (green), info. A toast is a pill and can be dismissed.

## Surfaces

### Card (`.card`)
`--grad-card` fill, **1.5px crimson outline** (`--color-outline`), 22px radius, `--shadow-card`. Variants: `--hl` (gold outline: the one important card), `--hl-soft` (brighter crimson), `--soft` (flat), `--success`, `--danger`, `--form` (28px radius). **Never put a card in a card**: use rows and dividers inside.

### Notice card (`.notice`)
Scope chip, date, Unread (a gold dot and word), title, **"From {source}"**, three lines, "View full details" with a paperclip when there is an attachment, a caret. The whole card is the link (the title link stretches). Gold outline for the first; an Unread notice has the dot and word. **No Verified seal**: the source is the trust signal.

### Place and school cards (`.place-card`, `.place-row`, `.school`)
Photo on top (or a drawn building) and a name; a numbered gold badge on Home's rail; a category chip and pin code on Map rows; an icon, name and department count on school cards. If there is no photo, an icon tile in the category colour. A name is shown only if it is the sign's or OpenStreetMap's.

### Class card (`.class`)
Time, code, title, kind (Lecture or Practical), venue, caret. The next class: gold outline and a chip "Next up, in 12 min". Venue or course can be missing and says so.

### Role bar, tiles, queue and confirm cards
Admin pieces: a role pill, 2-by-2 tiles with a round icon and an optional count badge, a queue row with an icon tile and a gold **Verify** button, and the inline delete confirm (red, Cancel and Delete side by side).

### Empty-day, not-added and photo-missing notes
An icon, a bold line and one line of help in a card; the not-added note has one action.

## Controls

### Buttons (`.btn`)
56px large, 48px default, 44px small, pill radius. States: default, hover, focus, active, disabled, loading.
- **Gold** (`--gold`): the primary on night and photos.
- **Maroon**: only Welcome's start button (the mockups' own choice).
- **Outline** (gold border): secondary.
- **Quiet** (gold, underlined): tertiary.
- **Danger** (red): delete.
- **Glass**: on a photo or the map.
- **The call to action with a disc** (`.btn--go`) is not used; the arrow sits inside the label.

### Fields (`.field`)
A 64px box with a leading icon, a small label, the value, and an optional trailing action (show/hide password, caret). Hint below; error below in red with an icon and the words (and `aria-invalid`). A select shows its caret. **Email fields accept any address.** States: default, focus (gold border and ring), error, disabled.

### Search (`.search`)
A 56px pill with a magnifier, the input, and a filters button; on a hero it is on translucent field colour.

### Filter chips (`.filter`) and day strip (`.day`)
A horizontally scrolling row of pills with `aria-pressed`; the pressed one is gold. Day buttons add the date and a dot for today.

### Segmented control (`.seg`), switch (`.switch`), checkbox (`.check`)
The switch is a `role="switch"` with `aria-checked`; its thumb turns gold on, 44px hit area. The checkbox is native, 24px, gold accent. The password **strength meter** is four segments (red, amber, green) plus a word (Weak, Fair, Good, Strong) so colour is never alone.

### Tabs (`.tabs`)
`role="tablist"` with arrow-key movement; the selected tab is gold with a 3px underline.

## Data display

### Countdown badge (`.badge-ring`)
A 124px round badge: a clock icon, the minutes ("12 mins to my next class") and a gold ring that fills as the hour runs down. It has the mockups' one soft glow (`--shadow-ring`). It is a `role="img"` with the sentence as its label. Hidden when there is no next class.

### Progress ring (`.ring`, `.syncing__ring`)
A gold arc (`stroke-dasharray`) on a dark track, with the figure as real text in the middle. Used for sync progress and the pack download.

### Stacked bars and rows
Sync rows show a count (`132/256`) and a mark: a green check (done), a gold dot (now), a clock (waiting), a red warning (failed). The password meter is a bar. Every figure is also text.

### Seals (`.seal`)
**Verified** (green, check) only when `verification.status = verified`, with who and when in the Source disclosure. **Not verified yet** (dashed outline, muted). **May be outdated** (amber). The date, and a **Source** disclosure (`<details>`). **Notices do not use a seal.**

### Chips (`.chip`)
Scope: University (gold), SUG (red), School (green), Department (indigo), each with an icon and a word. Gold solid for "Next class" and "Next up". Dashed for "No photo yet" or "Not verified". Pills for status ("Published", "Draft").

### Avatar (`.avatar`)
An **initials disc** in one of four tints (gold, green, indigo, red). Used for people and the signed-in user. **No faces anywhere**, drawn or photographed.

### Map (`.campus-map`, `.m-pin`, `.mapcard`)
SVG from OpenStreetMap data in the dark branded style (ground, grass, wood, water, pitches, building fills with an edge, footpaths, roads). Pins are `role="button"`, coloured by category with a white outline, a name tag for the selected one, and keep their screen size at any zoom. Controls: zoom in and out, compass, My location (a blue dot), attribution. Keyboard: arrows pan, + and - zoom, pins are focusable. **No routing**, no distances.

## States (`.state`, `.skeleton`)
One pattern for empty, error, offline, not found, no match, storage full: a gold icon with two spark dashes, a bold title, one line, at most one action. Loading is a **skeleton** (three bars in a card) with `role="status"` text; its pulse runs only while on screen. The error variant uses `role="alert"` and a Try again button.

## Brand

### Logo (`.logo`)
A gold map pin with a night mortarboard cap in it, drawn for Sabi (it follows the idea of the mockups' pin and cap, not their artwork). The lockup is the logo, "Sabi" (Poppins 700, 32px) and "FUTA Fresher Companion" (14px). It is the Home link. App icon: the logo on `--color-night`.

### Handwriting, wave lines and sparks
Yellowtail in gold for the kicker (28px; 40px on Home and Welcome), thin gold wave lines at the bottom corners, and short gold spark dashes around state icons. All decoration, `aria-hidden`, hidden in Lite.

### Scenes (`svg.scene`)
The fallback behind every photo: a night sky, hills, trees, a generic building (block, hostel, hall, library, gate, walkway) and, in some, four original drawn students (braids and a phone; glasses and a backpack; hijab and books; a folder). They are original characters, not real people, and the buildings are not real FUTA buildings.
