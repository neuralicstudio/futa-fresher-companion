# Design brief

Working name: **Sabi** (set in `web/src/appName.ts`; it may change). Written with Impeccable `shape` from David's task brief. Product facts live in [PRODUCT.md](PRODUCT.md).

## 1. Job and audience

New students of the Federal University of Technology, Akure (FUTA), in the first weeks of resumption, when everything is new and confusing. Mostly on phones, often cheap Android phones, often on weak or no network, often outdoors in daylight. They come to find a place, a person, a course, a time or a notice, and to know whether to trust it.

Visitor mode (Impeccable): **Operate**. The student is doing a task, not being persuaded.

## 2. Outcome and proof

- Primary task: get from "I am lost" to the right building, department, lecturer, lecture time or notice in a few taps, with or without data.
- Success: the answer is on screen, with its status (verified, unverified, may be outdated), its source and the date it was updated.
- Product truth no neighbour can claim: every fact says how sure we are and who said so.

## 3. Selected direction (round 3)

- **Concept: the flyer.** Sabi is the best flyer on the notice board, and it's true. Every screen leads with a layered hero (a FUTA photo from the visual pack, or a drawn scene), a big title, and one round sticker that holds the number that matters.
- **Why it replaced the gold line:** David found rounds 1 and 2 clean but dry. The line could carry state but not pictures, people or place. The flyer carries all of them, and still carries state (the countdown, the sky by the hour, drawings offline and in Lite).
- **Signatures:**
  - the flyer hero
  - the sticker ring
  - four original drawn students
  - the time-of-day sky and scrim
  - the floating pill tab bar
  - the logo: a route ending in a rising sun
- **Structure:** a glass top bar over each hero, and a floating tab bar on phones (Home, Map, Academics, Notices) that moves into the top bar from 1024px. Settings is a new route from the top bar.
- **New screens:** Welcome (before first sync) and Settings (the visual pack, Lite, theme, photo credits).
- **History:** round 2's direction (the gold line) and round 1's (the signpost) are recorded in LOG.md.

## 4. Scope and boundaries

- Fidelity: static, self-contained HTML prototypes of every existing screen and its real states, a component sheet, tokens. Design only: nothing under `web/src`, `api`, `db` or `docs/openapi.yaml` changes.
- Anti-goals: a corporate dashboard; purple gradients; hero blobs; emoji icons; stock photos; invented numbers, people or campus facts; a map that pretends to be real (the drawn map says it is a drawing); any real person's likeness; any brand from the reference mockups.

## 5. States and ranges

Real states, taken from `web/src`: loading, empty (including "still saving"), error with retry, offline, first-run sync, sync failed, 503 busy, 401 session ended, signed out, not an admin, field errors, sending, success. Content ranges: long school names, long notices (up to 4000 characters), missing lecturer office or email, a timetable entry whose course or venue is not saved.

## 6. Interaction and layout

- **Mobile first at 360px.**
  - One column. The content column caps at 720px, and grids go to 1040px.
  - Home's doors go four across at 768px.
- **Heroes and cards:**
  - Heroes are full bleed.
  - Cards that float over a hero are glass.
  - Lists are cards with photos or drawings, or rows on paper for dense content (courses, lecturers, admin).
- **Controls:**
  - Disclosure for sources and long notices.
  - An inline confirm for delete.
  - Native selects.
  - Filter chips that keep one pressed.
- **Motion:**
  - Durations: feedback 120ms; state 220ms; transitions, rings and the stamp 480ms; one entrance per screen 900ms (once per session, on screen).
  - Ambient loops run only on screen, never in Lite.
  - Reduced motion removes all of it and keeps the state.

## 7. Constraints and open decisions

- **Fonts:** two OFL faces, 23 KB, served from the repo.
- **Photos:** only in the visual pack, never on first load or in Lite (PHOTOS.md). Each is credited (CREDITS.md).
- **Data budget:**
  - core layer at most 60 KB gzipped, measured 45.0 KB
  - visual pack at most 1.5 MB, measured 872.6 KB
  - `tools/budget.mjs` checks both
- **Accessibility:**
  - WCAG AA in light and dark, including text over photos measured against a white pixel.
  - 44px targets, visible focus, and 200% text checked.
- **Open for David (round 3):**
  - The concept itself (the flyer) and its new copy (README "Copy").
  - Whether the four drawn students fit what freshers expect, and their look (skin tones, hair, hijab, clothes).
  - The Home hero: today's open gate photo is landscape, so it crops hard on a phone. A portrait gate photo would be better.
  - Whether to ask the owners of the local-only photos for permission, so they can ship.
  - The scope colours (University maroon, SUG coral, School jade, Department sky).
  - Per-collection counts on first sync (a small change in `web/src/lib/sync.ts`).
  - How the service worker should cache the pack (its own cache, dropped first when storage is short).
- **Still open from earlier rounds:**
  - the greetings and "Up late"
  - "New" on notices (it needs a last-opened time)
  - the "Notices" tab label
  - the exact maroon and gold
