# Design brief

Working name: **Sabi** (set in `web/src/appName.ts`; it may change). Written with Impeccable `shape` from David's task brief. Product facts live in [PRODUCT.md](PRODUCT.md).

## 1. Job and audience

New students of the Federal University of Technology, Akure (FUTA), in the first weeks of resumption, when everything is new and confusing. Mostly on phones, often cheap Android phones, often on weak or no network, often outdoors in daylight. They come to find a place, a person, a course, a time or a notice, and to know whether to trust it.

Visitor mode (Impeccable): **Operate**. The student is doing a task, not being persuaded.

## 2. Outcome and proof

- Primary task: get from "I am lost" to the right building, department, lecturer, lecture time or notice in a few taps, with or without data.
- Success: the answer is on screen, with its status (verified, unverified, may be outdated), its source and the date it was updated.
- Product truth no neighbour can claim: every fact says how sure we are and who said so.

## 3. Selected direction (round 2)

- **Concept: the gold line.** Sabi draws the line from "I am lost" to "I found it". The line is the route across campus, the gold trim of the gown (round 1's regalia material, kept), and the thread from each fact to its source.
- **Why it replaced the signpost:** the signpost lived on one screen and stood still. The line runs through every screen and carries real state: offline (it breaks), progress (first sync), now (the timetable). It costs almost nothing to draw.
- **Signatures:** the route mark; the band (a night-maroon sky with contour lines and a time-of-day edge); Home's ticket (next class) and line of stations; the Now line; the source seal, which stamps on when verified.
- **Structure:** unchanged app shell. Top bar, four bottom tabs on phones (Home, Map, Academics, Notices), inline from 768px.
- Round 1's direction (signpost, regalia) is recorded in LOG.md section 1.

## 4. Scope and boundaries

- Fidelity: static, self-contained HTML prototypes of every existing screen and its real states, a component sheet, tokens. Design only: nothing under `web/src`, `api`, `db` or `docs/openapi.yaml` changes.
- Anti-goals: a corporate dashboard; purple gradients; hero blobs; emoji icons; stock photos; invented numbers, people or campus facts; a fake map.

## 5. States and ranges

Real states, taken from `web/src`: loading, empty (including "still saving"), error with retry, offline, first-run sync, sync failed, 503 busy, 401 session ended, signed out, not an admin, field errors, sending, success. Content ranges: long school names, long notices (up to 4000 characters), missing lecturer office or email, a timetable entry whose course or venue is not saved.

## 6. Interaction and layout

- Mobile first at 360px. One column; the content column caps at 720px; Home goes two-column at 768px.
- Lists are rows separated by hairlines, each row a full-width target with a small "this way" tip.
- Disclosure for sources and long notices; an inline confirm for delete; native selects.
- Motion: feedback 120ms, state 220ms, page transitions 420ms, one entrance per screen 760ms (once per session, on screen). Loops only while on screen. Reduced motion and Lite remove movement and keep the state.

## 7. Constraints and open decisions

- System fonts only (zero font bytes). Inline SVG for the mark, icons, contours and line pieces. Photos only in designed slots, from teammates, never on first load or in Lite (PHOTOS.md).
- Data budget for Home's design layer: 20 KB gzipped (measured 13.3 KB by `tools/budget.mjs`).
- WCAG AA in light and dark (ratios computed in `tokens.css`), 44px targets, visible focus, 200% text checked.
- Open for David (round 2): the greetings and "Up late"; whether "New" on notices is wanted (it needs a last-opened time on the phone); the band's height on detail screens; per-collection counts on first sync (a small change in `web/src/lib/sync.ts`).
- Still open from round 1: the "Notices" tab label (the app says "Announcements"; it does not fit four tabs at 360px), the exact maroon and gold (he will refine; change `tools/tokens.mjs`), the Timetable sign's destination before a student has picked a department.
