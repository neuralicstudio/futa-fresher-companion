# Campus photos: slots, budget and a guide for taking them

The design has room for real FUTA photos, but none are in this repo and none were generated or downloaded. Teammates take them. Until a slot has a photo, it shows the drawn contour ground (the band) or the place icon (a building row), so it never looks empty.

## Where photos go

| Slot (`data-slot`) | Screen | Shape | Shown at | How it is treated |
|---|---|---|---|---|
| `department-cover` (one per department) | Department detail, behind the band | 3:2 landscape | Full width, about 240px tall on a phone | Greyscale, 50% opacity, under a maroon scrim, so the title keeps its contrast |
| `school-cover` (one per school; optional) | School page, behind the band | 3:2 landscape | Same as department | Same |
| `building-<id>` | Map, each building row | 1:1 square | 72 × 72px | Natural colour, rounded corners |
| `home-hero` (optional, later) | Home, behind the band | 3:2 landscape | Full width | Same as department |

Never more than one photo per screen above the fold. People's photos are never used: lecturers and class reps get initials on a disc.

## Size budget (per file, as delivered)

| Slot | Files to deliver | Budget |
|---|---|---|
| Covers (`department-cover`, `school-cover`, `home-hero`) | AVIF and WebP, 720 × 480 and 1080 × 720 | 720w: **25 KB** or less. 1080w: **45 KB** or less |
| Building thumbnails | AVIF and WebP, 144 × 144 (2× of 72px) | **6 KB** or less |

Rules the app follows (hand-off):

- **No photo on first load.** Photos load after the page has settled, lazily, with `width`, `height` and `decoding="async"`, and only when the slot is near the screen.
- **Never in Lite mode.** When Lite is on (the phone asked to save data, or the person turned it on), no photo request is made at all. The contour or icon fallback shows instead.
- **Not part of the offline save.** First sync saves text data only. Photos are cached by the service worker only after they have been seen once, and are the first thing dropped when storage is short.
- A department screen with its cover costs at most 25 KB extra on a phone. Four building thumbnails on the Map list cost at most 24 KB extra.

## Taking the photos

**What to shoot**

- The building's entrance or the side people walk up to, with its sign in view if it has one. The goal is "I recognise this when I get there".
- One building per photo, straight on or at a slight angle. Fill the frame with the building; avoid wide empty sky or car parks.
- For covers: shoot in **landscape**, and leave calm space (sky, a plain wall) in the **top third**, because the title sits over it.
- For thumbnails: a tight crop of the entrance or the sign works best; a whole building at 72px is too small to read.

**When and how**

- Morning (before 10 am) or late afternoon (after 4 pm). Noon sun makes hard shadows and washed-out walls.
- Hold the phone level (turn on the camera grid) and keep the walls upright.
- No zoom; walk closer instead. No filters, no stickers, no text added.
- Take three or four of each, so there is a choice.

**People and privacy (NDPR)**

- No faces that can be recognised. Wait for people to pass, or shoot when the area is quiet. If someone is clearly in the photo, do not use it.
- No car number plates, no notice boards with personal details, no ID cards, no screens.
- Turn off location tagging, or strip the location data before sharing (most phone gallery apps can remove it when sharing; check the file's details).
- Only photograph public outdoor areas. Ask the department before photographing inside a building.

**Naming and handing over**

- Name files `department-<code>-cover.jpg` or `building-<name-in-short>.jpg`, for example `department-smc-cover.jpg`.
- Put the original photos in the team's shared folder (not in git). Say who took each one and that you agree it can be used in the app.
- Whoever adds them to `web/` exports AVIF and WebP at the sizes above (any image tool that can export AVIF and WebP; nothing new is added to the repo) and checks each file against the budget.
- After adding a cover, check the department title on top of it on a phone, in daylight. If the photo has a bright patch behind the title, crop differently or pick another.
