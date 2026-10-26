# Campus photos: the visual pack, its slots and budget, and a guide for taking more

Round 3 makes photos the main ingredient, without making the app heavy. They live in the **visual pack**, which is never part of the first load. Where each photo came from is in [CREDITS.md](CREDITS.md).

## How the pack works (hand-off)

- **First load: zero photos.** Every photo slot first draws a scene in SVG (`art.js`) on top of the photo's own placeholder colours, so no slot is ever an empty grey box.
- **When it downloads:** quietly in the background, after the first sync finishes, only on a good connection. That means never when `navigator.connection.saveData` is on or `effectiveType` is `slow-2g`, `2g` or `3g`. "Only on Wi-Fi" is on by default; when the browser cannot tell the connection type, the app waits for the person to tap "Download now".
- **Where it is kept:** the service worker caches the files under their own cache name (for example `sabi-pack-v1`) and keeps them for offline use. They are the first thing dropped when storage runs short.
- **How a photo appears:** once the pack is on the phone, each slot adds an `<img>` that fades in over the drawing. If a file is missing, the drawing stays.
- **Lite mode:** never downloads or shows the pack. The drawings carry the look, and the Settings card says "Off in Lite mode".
- **States to design for, all in the prototype:**
  - **Not downloaded:** drawings, plus "Download now".
  - **Downloading:** a ring with a percentage, the number of photos done, and Stop.
  - **Waiting for Wi-Fi.**
  - **On this phone:** the size, the date, and Remove photos.
  - **Off in Lite mode.**
- **Where the controls live:** Settings, under Data. Home links to it from "Saved on this phone". First sync's "You're set" screen offers the pack once ("Add campus photos?").

## Slots

| Slot | Screen | Size used | Fallback drawing |
|---|---|---|---|
| Home hero | Home | `-l`, full width, behind the title | A generic gate with two students |
| Around campus | Home, a row of cards | `-s`, 4:3 | A building type per card |
| Screen heroes | Academics, Department, Notices, Log in | `-l` | A building type, sometimes with students |
| Building cards | Map | `-s`, square on phones, 16:10 from 768px | The building's type (library, hall, hostel, block) |
| Pack preview and credits | Settings | `-s` | A building type, or plain sky |

Welcome, First sync, Timetable, Register, Admin and Settings are always drawn, because first run happens before any photo can be on the phone.

## Size budget (checked by `tools/budget.mjs`)

| What | Rule |
|---|---|
| Each file | WebP (AVIF also fine), **at most 60 KB** |
| Sizes | `<id>-l.webp` at 768 px wide for heroes (shown 360 to 768 px), `<id>-s.webp` at 384 px for cards and thumbnails |
| Metadata | None: no EXIF, GPS or XMP. The tool fails on any of them |
| Placeholder | Three colours measured from the photo (top, middle, bottom), kept with the photo's entry in `assets/pack.js` |
| The whole pack | **At most 1.5 MB.** Today: 872.6 KB (677.3 KB open-licensed, in the repo; 195.3 KB local only) |

Today's files came out between 7.5 KB and 58.4 KB. The busiest photos (trees, HDR skies) needed WebP quality down to 0.5 to fit 60 KB at 768 px.

## Text over photos

Hero text never sits on a raw photo. Under every line of hero text there is a scrim:
- **Colour:** night, tinted by the time of day.
- **Strength:** 84%.
- **Measured:** `tools/tokens.mjs` measures the text against that scrim over a pure white pixel, the worst case. The lowest result is 6.04:1, for secondary text over the morning scrim.

Credits sit on a dark glass chip, and labels on cards sit on the same scrim.

## The git rule

- **Committed:** photos with an open licence (or that David took himself) go in `prototype/pack/photos/` and are committed.
- **Local only:** anything else goes in `prototype/photos-local/`. `.git/info/exclude` keeps that folder out of git, and the prototype uses it only when the files are there.
- **Screenshots:** the committed screenshots are taken with `?local=0`. Screenshots that show local photos go to `screenshots-private/`, which is also excluded.

## Taking more photos

These are wanted most, because there is no open photo of them yet:
- hostels
- the main walkway
- lecture theatres from the inside, empty
- the gate in portrait (the Home hero crops a landscape photo hard)

**What to shoot**
- The entrance people walk up to, with its sign readable: the app names a building only when a sign in the photo shows its name.
- One building per photo. Leave calm space (sky or a plain wall) in the top third of hero photos, and for the Home hero, shoot in portrait.
- Morning before 10 am or after 4 pm. Hold the phone level. No zoom, no filters, no added text.

**People and privacy (NDPR)**
- No recognisable faces. Wait for people to pass. No number plates, ID cards, screens, or notice boards with personal details.
- Turn off location tagging. The pipeline strips metadata anyway, but do not rely on it.
- Public outdoor areas only. Ask the department before shooting indoors.

**Handing over**
- Put originals in the team's shared folder, not in git.
- Say who took each one, and that they agree to share it under CC BY-SA 4.0 (or another open licence).
- Add each photo to CREDITS.md, export at 768 px and 384 px as WebP of at most 60 KB each, and run `node docs/design/tools/budget.mjs`.
