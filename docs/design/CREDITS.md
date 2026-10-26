# Credits

Where every image and font in the design came from, its licence, and what was changed. The prototype also lists the photo credits on its Settings screen, and every large photo shows its credit in a chip.

Rules this follows (from David's brief for round 3):
- **Sources:** only FUTA's own websites and openly licensed images (here, Wikimedia Commons). No Google Maps or Street View, Dribbble, agencies, stock sites or other apps.
- **Licences:** only openly licensed images are in the repo. Images David did not take, with no open licence, stay on David's machine in `prototype/photos-local/`, which `.git/info/exclude` keeps out of git.
- **Names:** a building is named only when its sign is readable in the photo. Otherwise the alt text describes what is visible and nothing more.
- **Faces:** no identifiable faces. The one photo with people close to the camera was cropped above them.
- **Processing:** every photo was cropped where noted, resized to 768 px and 384 px wide, and re-encoded as WebP in headless Chrome, which drops all EXIF, GPS and camera metadata. `tools/budget.mjs` checks that no file has EXIF or XMP and that each is 60 KB or less.

## Photos in the repo (`prototype/pack/photos/`)

Each photo is in the repo at two sizes: `<id>-l.webp` (768 px) and `<id>-s.webp` (384 px).

**Licence for the CC BY-SA 4.0 photos.** These are [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The resized and cropped versions here are shared under the same licence, with the credit shown.

| ID | What it shows (name only where a sign shows it) | Source page | Licence | Credit | Changes |
|---|---|---|---|---|---|
| `gate` | The main gate, with "The Federal University of Technology Akure" across the top | [File:Federal University of Technology, Akure.jpg](https://commons.wikimedia.org/wiki/File:Federal_University_of_Technology,_Akure.jpg) | Public domain (as marked on Commons) | Kaizenify, Wikimedia User Group Nigeria | Cropped above the people in the street, so no faces; resized; WebP |
| `library` | A building with a sign reading "Albert Ilemobade Library" | [File:Albert Ilemobade Library, …, Ondo State104.jpg](https://commons.wikimedia.org/wiki/File:Albert_Ilemobade_Library,_Federal_University_of_Technology,_Akure,_Ondo_State104.jpg) | CC BY-SA 4.0 | MediaMOF | Resized; WebP |
| `library-inside` | A reading area with bookshelves and patterned cushions (titled "FUTA Library" on Commons; not named in the app, because no sign shows it) | [File:FUTA Library.jpeg](https://commons.wikimedia.org/wiki/File:FUTA_Library.jpeg) | CC BY-SA 4.0 | Geekdidi | Resized; WebP |
| `computing` | A building entrance with a sign reading "School of Computing" | [File:School of Computing, …, Ondo State6.jpg](https://commons.wikimedia.org/wiki/File:School_of_Computing,_Federal_University_of_Technology,_Akure,_Ondo_State6.jpg) | CC BY-SA 4.0 | MediaMOF | Resized; WebP |
| `physics` | A roadside sign reading "Department of Physics" | [File:Department of Physics, …, Ondo State.jpg](https://commons.wikimedia.org/wiki/File:Department_of_Physics,_Federal_University_of_Technology,_Akure,_Ondo_State.jpg) | CC BY-SA 4.0 | Jesu-loba | Resized; WebP |
| `hall` | A hall with a sign reading "Centre for Continuing Education, Multi-purpose Hall" | [File:CCE Multipurpose Hall, …, Ondo State4.jpg](https://commons.wikimedia.org/wiki/File:CCE_Multipurpose_Hall,_Federal_University_of_Technology,_Akure,_Ondo_State4.jpg) | CC BY-SA 4.0 | MediaMOF | Resized; WebP |
| `crc` | A building with a sign reading "Chief (Dr) Joseph A. Sanusi Computer Resource Centre" | [File:Computer Resource Centre, …, Ondo State3.jpg](https://commons.wikimedia.org/wiki/File:Computer_Resource_Centre,_Federal_University_of_Technology,_Akure,_Ondo_State3.jpg) | CC BY-SA 4.0 | MediaMOF | Resized; WebP |
| `techpark` | A building with a sign reading "Technology Park and Incubation Centre" | [File:Technology Park and Incubation Centre,, …, Ondo State.jpg](https://commons.wikimedia.org/wiki/File:Technology_Park_and_Incubation_Centre,,_Federal_University_of_Technology,_Akure,_Ondo_State.jpg) | CC BY-SA 4.0 | MediaMOF | Resized; WebP |
| `studios` | A long building with a sign reading "Industrial Design Studios" | [File:Industrial Design Studios, …, Akure2.jpg](https://commons.wikimedia.org/wiki/File:Industrial_Design_Studios,_Federal_University_of_Technology,_Akure2.jpg) | CC BY-SA 4.0 | Jesu-loba | Resized; WebP |
| `road` | A road lined with tall trees (titled "FUTA farm road" on Commons; shown without a name) | [File:FUTA farm road.jpg](https://commons.wikimedia.org/wiki/File:FUTA_farm_road.jpg) | CC BY-SA 4.0 | Omaonu | Resized; WebP. One person far down the road is a few pixels tall and cannot be identified |
| `tree` | A flowering tree in front of a long yellow building (titled "School of Engineering building beside ETF FUTA" on Commons; shown without a name) | [File:School of Engineering building beside ETF FUTA.jpg](https://commons.wikimedia.org/wiki/File:School_of_Engineering_building_beside_ETF_FUTA.jpg) | CC BY-SA 4.0 | Omaonu | Resized; WebP. Two people sitting far under the tree cannot be identified |

## David's photos (`docs/design/photos-source/`)

None of these is in the repo. The prototype uses the local-only copies in `prototype/photos-local/` when they are on the machine, and the drawn scenes when they are not.

| File | What it shows | Source and permission | Use |
|---|---|---|---|
| `Federal_University_of_Technology,_Akure.jpg` | The main gate, with people in the street | Same title and size as the public-domain Commons file above, so it was used from Commons as `gate` | In the repo as `gate`, cropped above the people |
| `FUTA.webp` | The main gate, seen from the road | Source not recorded; no licence known | Local only: `local-gate` (not used on a screen yet) |
| `images (2).jpg` | A three-storey building with a red roof | Source not recorded; no licence known | Local only: `local-red-roof` (not used on a screen yet) |
| `images (3).jpg` | A tall building with maroon columns among palm trees | Source not recorded; no licence known | Local only: `local-tall`, the Notices hero. A fresh clone shows the drawn hall scene there |
| `images (4).jpg` | A long yellow building with parked cars in front | Source not recorded; no licence known | Local only: `local-block` (not used on a screen yet) |
| `cropped-Oasdom-Federal-University-of-Technology-FUTA-courses.jpg` | A cream three-storey building behind a lawn | The file name suggests a third-party education site; no licence known | Local only: `local-building` (not used on a screen yet) |
| `Federal-University-of-Technology-Akure-FUTA.jpeg` | The FUTA sign and crest | Carries another site's watermark and an overlaid logo | **Not used** |

To move a local photo into the repo:
1. Find its owner and an open licence or written permission.
2. Record it in this file.
3. Move the files from `photos-local/` to `pack/photos/` and drop the `1` (local) flag in `assets/pack.js`.

## Searched, not used

- **FUTA's own websites:** not searched this round. Their photos carry no open licence, so they could only ever be local, and the Commons set already covered the gate, library, schools and halls.
- **Wikimedia Commons:** I looked at about 50 FUTA files. I didn't use:
  - those showing people close up
  - near-duplicates (the second gate photo, a white bungalow)
  - the wildlife park animals, which are off the brief
- **Hostels:** Commons has no hostel photos, so the hostel slot uses a drawn scene with a "No photo yet" tag.

## Drawings

- **What they are:** all scenes, the four students, the campus map drawing, the state vignettes, the logo and the icons were drawn for this project as SVG code (`prototype/assets/art.js`).
- **What they aren't:** the students are original characters, not real people. The buildings are generic types (a lecture block, a hostel, a hall, a library, a gate, a walkway), not real FUTA buildings. The hills and the map are invented shapes.
- **No outside material:** no AI image generation, no stock art, and nothing traced from the reference mockups in `inspiration/`.

## Fonts (`docs/design/fonts/`)

Both were downloaded from the official Google Fonts repository ([github.com/google/fonts](https://github.com/google/fonts)), then subset to Basic Latin plus `’ ‘ “ ” … × →` and no-break space, as woff2, with `fonttools` (run outside the repo).

| Font | File | Licence | Copyright | Changes |
|---|---|---|---|---|
| Bricolage Grotesque | `bricolage-grotesque-800.woff2` (11.7 KB) | SIL Open Font License 1.1, `OFL-BricolageGrotesque.txt` | The Bricolage Grotesque Project Authors ([github.com/ateliertriay/bricolage](https://github.com/ateliertriay/bricolage)) | Instanced at weight 800, optical size 96, width 100; subset |
| Atkinson Hyperlegible Next | `atkinson-hyperlegible-next.woff2` (11.4 KB) | SIL Open Font License 1.1, `OFL-AtkinsonHyperlegibleNext.txt` | The Atkinson Hyperlegible Next Project Authors ([github.com/googlefonts/atkinson-hyperlegible-next](https://github.com/googlefonts/atkinson-hyperlegible-next)) | Weight axis kept from 400 to 700; subset |
