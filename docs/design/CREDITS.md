# Credits

Where every photo, map, icon and font in the design came from, its licence, and what was changed. The prototype's Photo credits screen (Settings, then Photo credits) shows the photo rows from `prototype/assets/pack.js`, which carries the same data. In the app it should read from the same table.

**Verified on 27 Oct 2026.** Each photo's author and licence were read from the Wikimedia Commons API (`imageinfo` with `extmetadata`) for the file page linked in the table. They are not copied from the mockups: **every credit in the approved mockups is invented** (for example "FUTA Media Unit", "@futastudents (X)", "CC BY 4.0"), so none was used.

## Rules this follows

- **Sources:** openly licensed images (Wikimedia Commons) in the repo. Photos David supplied stay out of the repo: the night gate is credited to FUTA's official Facebook page with written permission pending, and the rest have no recorded licence.
- **Names:** a building is named only when its sign is readable in the photo. Otherwise the alt text says what is visible and nothing more.
- **Faces:** no identifiable faces. The one photo with people in the street was cropped above them.
- **Processing:** each photo was cropped where noted, resized to 768 px and 384 px wide and re-encoded as WebP in headless Chrome, which drops all EXIF, GPS and camera metadata. `tools/budget.mjs` fails if any file has EXIF or XMP, or is over 60 KB.
- **ShareAlike:** the CC BY-SA 4.0 photos here are modified (cropped, resized, recompressed), so these versions are shared under CC BY-SA 4.0 too. Credit is shown next to every large photo in the app and on the credits screen.

## Photos in the repo (`prototype/pack/photos/`)

Each is in the repo at two sizes: `<id>-l.webp` (768 px) and `<id>-s.webp` (384 px).

| ID | What it shows (named only where a sign shows it) | Commons file page | Author | Licence | Changes |
|---|---|---|---|---|---|
| `gate` | The main gate, "The Federal University of Technology Akure" on the sign | [Federal University of Technology, Akure.jpg](https://commons.wikimedia.org/wiki/File:Federal_University_of_Technology,_Akure.jpg) | Kaizenify (User:Kaizenify, Wikimedia User Group Nigeria), 2016 | Public domain, as marked on the file page | Cropped above the people in the street; resized; WebP |
| `library` | Front of a building with a sign reading "Albert Ilemobade Library" | [Albert Ilemobade Library, …, Ondo State104.jpg](https://commons.wikimedia.org/wiki/File:Albert_Ilemobade_Library,_Federal_University_of_Technology,_Akure,_Ondo_State104.jpg) | MediaMOF, 2021 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | Resized; WebP |
| `library-inside` | A reading area with bookshelves and patterned cushions (titled "FUTA Library" on Commons; no sign shows a name, so the app does not name it) | [FUTA Library.jpeg](https://commons.wikimedia.org/wiki/File:FUTA_Library.jpeg) | Geekdidi, 2018 | CC BY-SA 4.0 | Resized; WebP |
| `computing` | A building entrance with a sign reading "School of Computing" | [School of Computing, …, Ondo State6.jpg](https://commons.wikimedia.org/wiki/File:School_of_Computing,_Federal_University_of_Technology,_Akure,_Ondo_State6.jpg) | MediaMOF, 2021 | CC BY-SA 4.0 | Resized; WebP |
| `physics` | A roadside sign reading "Department of Physics" | [Department of Physics, …, Ondo State.jpg](https://commons.wikimedia.org/wiki/File:Department_of_Physics,_Federal_University_of_Technology,_Akure,_Ondo_State.jpg) | Jesu-loba, 2021 | CC BY-SA 4.0 | Resized; WebP |
| `hall` | A hall with red angled supports and a sign reading "Centre for Continuing Education, Multi-purpose Hall" | [CCE Multipurpose Hall, …, Ondo State4.jpg](https://commons.wikimedia.org/wiki/File:CCE_Multipurpose_Hall,_Federal_University_of_Technology,_Akure,_Ondo_State4.jpg) | MediaMOF, 2021 | CC BY-SA 4.0 | Resized; WebP |
| `crc` | A red building with a sign reading "Chief (Dr) Joseph A. Sanusi Computer Resource Centre" | [Computer Resource Centre, …, Ondo State3.jpg](https://commons.wikimedia.org/wiki/File:Computer_Resource_Centre,_Federal_University_of_Technology,_Akure,_Ondo_State3.jpg) | MediaMOF, 2021 | CC BY-SA 4.0 | Resized; WebP |
| `techpark` | A building with a sign reading "Technology Park and Incubation Centre" | [Technology Park and Incubation Centre,, …, Ondo State.jpg](https://commons.wikimedia.org/wiki/File:Technology_Park_and_Incubation_Centre,,_Federal_University_of_Technology,_Akure,_Ondo_State.jpg) | MediaMOF, 2021 | CC BY-SA 4.0 | Resized; WebP |
| `studios` | A long building with a sign reading "Industrial Design Studios" | [Industrial Design Studios, …, Akure2.jpg](https://commons.wikimedia.org/wiki/File:Industrial_Design_Studios,_Federal_University_of_Technology,_Akure2.jpg) | Jesu-loba, 2021 | CC BY-SA 4.0 | Resized; WebP |
| `road` | A road lined with tall trees (titled "FUTA farm road" on Commons; shown without a name) | [FUTA farm road.jpg](https://commons.wikimedia.org/wiki/File:FUTA_farm_road.jpg) | Omaonu, 2017 | CC BY-SA 4.0 | Resized; WebP. One person far down the road is a few pixels tall and cannot be identified |
| `tree` | A flowering tree in front of a long yellow building (titled "School of Engineering building beside ETF FUTA" on Commons; shown without a name) | [School of Engineering building beside ETF FUTA.jpg](https://commons.wikimedia.org/wiki/File:School_of_Engineering_building_beside_ETF_FUTA.jpg) | Omaonu, 2017 | CC BY-SA 4.0 | Resized; WebP. People far under the tree cannot be identified |

Of these, the photos used in the app screens are listed with where in `assets/pack.js` (the "used on" field).

## The night gate photo (local only, written permission pending)

| File | What it shows | Credit | Status |
|---|---|---|---|
| `prototype/photos-local/local-gate-night-{l,s}.webp` (from `inspo/images (2).jpg`) | The main gate at night, lit up, three people at its left | **Photo: Federal University of Technology, Akure (official Facebook page). Written permission pending.** | **Written permission from FUTA is pending** (David is adding it). Until it arrives, nothing here claims permission has been given. The file is **not in the repo and must not be committed until David confirms.** It is kept in `prototype/photos-local/`, which `.git/info/exclude` keeps out of git. |

- **Where it shows:** the Welcome, Home, Map, Timetable and First sync heroes, **on David's machine only**. A fresh clone shows the credited daytime `gate` photo (darkened) or the drawn gate scene. The committed screenshots are taken with `?local=0` and never show it.
- **The credits screen** lists it with exactly this line and nothing else about authorship or licence: "Photo: Federal University of Technology, Akure (official Facebook page). Written permission pending."
- **Faces:** three people stand at the left of the gate, small and unidentifiable. If FUTA's written OK does not cover them, crop them out before it is committed.
- **To move it into the repo** once David has FUTA's written OK: record the confirmation here, move the two files to `prototype/pack/photos/`, remove the local flag (the last `1`) in `assets/pack.js`, and run `node docs/design/tools/budget.mjs` and `check.mjs`.

## David's other photos (`docs/design/photos-source/`)

**None is in the repo.** They are placeholders on David's machine, never listed as credited.

| File | What it shows | Source and permission | Use |
|---|---|---|---|
| `Federal_University_of_Technology,_Akure.jpg` | The main gate, with people in the street | Same title and size as the public-domain Commons file above | In the repo as `gate`, cropped above the people |
| `FUTA.webp`, `images (2).jpg`, `images (3).jpg`, `images (4).jpg`, `cropped-Oasdom-…courses.jpg` | A gate, a red-roofed building, a tall building, a long yellow building, a cream building | No source recorded; no licence known | Local only (`prototype/photos-local/`); not used on a screen |
| `Federal-University-of-Technology-Akure-FUTA.jpeg` | The FUTA sign and crest | Carries another site's watermark and logo | Not used |

## The approved mockups (`docs/design/inspo/`, not in the repo)

They are the source of truth for look and feel, and are **kept out of git** (listed in `.git/info/exclude`): they contain AI-generated people and photos, and credits that are invented. Nothing from them is shipped: colours were sampled as numbers, layouts were rebuilt in code, and no photo, face, logo or text was copied as an image.

**Not carried over from the mockups:**
- the people's faces (lecturers get initials avatars)
- the invented photo credits
- the "FUTA's privacy policy" wording (it is Sabi's own)
- the "Verified" tick on notices (they show their source instead)
- the satellite map (the map is OpenStreetMap vectors)

## Map data

- **Source:** [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, licensed under the Open Database Licence (ODbL) 1.0.
- **What it is:** an extract of the FUTA campus area (south 7.2925, west 5.1285, north 7.3135, east 5.1500), fetched from the Overpass API on 27 Oct 2026 with `tools/bake-map.mjs`.
- **What was done:** simplified into vector paths in `prototype/assets/campus-map.js` (1,458 buildings, roads, footpaths, grass, water, pitches, and 25 named places). Place names are exactly as written in OpenStreetMap, including its spelling. The status of every place is "not yet checked by FUTA".
- **Attribution in the app:** "Map data © OpenStreetMap contributors" with a link to the licence, shown on the map.
- **No satellite or aerial imagery. No Google Maps or Street View.**

## Icons

[Phosphor Icons](https://phosphoricons.com) 2.1.1 (`@phosphor-icons/core`), MIT licence, copyright 2023 Phosphor Icons. The SVGs used are in `icons/regular/` and `icons/fill/`, with the licence in `icons/LICENSE-Phosphor-MIT.txt`. They are compiled into a sprite by `tools/build-icons.mjs`. The only drawings made for Sabi are the logo and the scenes.

## Fonts (`docs/design/fonts/`)

Both were downloaded from the official [Google Fonts repository](https://github.com/google/fonts) and subset to Basic Latin plus `’ ‘ “ ” … →` and no-break space, as woff2, with `fonttools` (run outside the repo). They total 25.3 KB, under the 40 KB limit.

| Font | Files | Licence | Copyright | Used for |
|---|---|---|---|---|
| Poppins | `poppins-400.woff2`, `poppins-600.woff2`, `poppins-700.woff2` (4.5 KB each) | SIL Open Font License 1.1, `OFL-Poppins.txt` | The Poppins Project Authors ([github.com/itfoundry/Poppins](https://github.com/itfoundry/Poppins)) | All text, as in the mockups |
| Yellowtail | `yellowtail-400.woff2` (11.8 KB) | Apache License 2.0, `LICENSE-Yellowtail-Apache-2.0.txt` | Astigmatic ([fonts.google.com/specimen/Yellowtail](https://fonts.google.com/specimen/Yellowtail)) | The one handwritten line per screen |

## Drawings

The logo, the scenes (sky, hills, trees, generic building types) and the four students were drawn for this project as SVG code (`prototype/assets/art.js`, `scenes.js`). The students are original characters, not real people, and the buildings are generic types, not real FUTA buildings. No AI image generation and no stock art was used, and nothing was traced from the mockups.
