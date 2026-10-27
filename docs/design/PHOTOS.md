# The photo pack

Photos make Sabi look like campus, and they are **optional**. They are never part of the first load. Where each photo came from, its author and licence are in [CREDITS.md](CREDITS.md).

## How it works (for the frontend)

- **First load: zero photos.** Every photo slot first draws a scene in SVG (`prototype/assets/scenes.js`) over the photo's own placeholder colours, so no slot is ever an empty grey box. Those drawings are the **placeholders** wherever there is no photo we can credit.
- **When it downloads:** quietly, after the first sync finishes, and only on a good connection: never when `navigator.connection.saveData` is on, nor when `effectiveType` is `slow-2g`, `2g` or `3g`. "Only on Wi-Fi" is on by default; where the browser cannot tell the connection type, the app waits for the person to tap "Download now".
- **Where it lives:** the service worker caches the files under their own versioned cache name and keeps them for offline use. They are the first thing dropped when storage runs short.
- **How a photo appears:** once the pack is on the phone, each slot adds an `<img>` that fades in over the drawing. If a file is missing, the drawing stays.
- **Lite mode** never downloads or shows the pack, and the Settings card says "Off in Lite mode".
- **Where the controls are:** Settings, "Photo pack": Download now, Only on Wi-Fi, Remove, and its states (not downloaded, downloading, waiting for Wi-Fi, on this phone, off in Lite). First sync's "You're set" offers it once.

## Budget (checked by `tools/budget.mjs`)

| What | Rule |
|---|---|
| Each file | WebP, **at most 60 KB** |
| Sizes | `<id>-l.webp` 768 px wide for heroes; `<id>-s.webp` 384 px for cards and thumbnails |
| Metadata | None: no EXIF, GPS or XMP (the tool fails on any) |
| The whole pack | **At most 1.5 MB.** Today 943 KB: 677 KB in the repo (11 photos, 22 files), 265 KB local only on one machine |

## Text over photos

Hero text never sits on a raw photo. A night scrim is under every line (72% or more); `tools/tokens.mjs` measures the text colours against it over a pure white pixel, the worst case (the lowest is 4.97:1). Credits show on a dark chip.

## Which photos may be committed

- **Committed** (`prototype/pack/photos/`): photos with an open licence and a verified credit. Today: 11 from Wikimedia Commons.
- **Local only** (`prototype/photos-local/`, excluded from git): photos with no known licence. They are **placeholders on David's machine** and never listed as credited. The committed screenshots are taken with `?local=0`, so they show the credited photos or the drawings.
- To add a photo to the repo: find its owner and licence, record it in CREDITS.md and `assets/pack.js`, export at 768 and 384 px as WebP of at most 60 KB, run `node docs/design/tools/budget.mjs` and `check.mjs`.

## Photos wanted (no open photo exists yet)

Hostels, the main walkway, lecture theatres from inside (empty), and the gate at night in portrait. Shoot the entrance with its sign readable (a building is named only when a sign shows it), in the morning or late afternoon, no zoom, no filters. **No recognisable faces, number plates, ID cards or screens.** Turn off location tagging. Public outdoor areas only; ask the department before shooting inside.
