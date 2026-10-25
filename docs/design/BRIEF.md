# Design brief

Working name: **Sabi** (set in `web/src/appName.ts`; it may change). Written with Impeccable `shape` from David's task brief. Product facts live in [PRODUCT.md](PRODUCT.md).

## 1. Job and audience

New students of the Federal University of Technology, Akure (FUTA), in the first weeks of resumption, when everything is new and confusing. Mostly on phones, often cheap Android phones, often on weak or no network, often outdoors in daylight. They come to find a place, a person, a course, a time or a notice, and to know whether to trust it.

Visitor mode (Impeccable): **Operate**. The student is doing a task, not being persuaded.

## 2. Outcome and proof

- Primary task: get from "I am lost" to the right building, department, lecturer, lecture time or notice in a few taps, with or without data.
- Success: the answer is on screen, with its status (verified, unverified, may be outdated), its source and the date it was updated.
- Product truth no neighbour can claim: every fact says how sure we are and who said so.

## 3. Selected direction

- **Idea:** the campus signpost in your pocket. Every screen points the way and says who said so, and when.
- **Material** (Impeccable's assigned world: academic regalia): a maroon "cloth" shell with a gold trim edge, the way a hood's trim marks rank. Gold marks what is current or confirmed: the current tab, today in the timetable, the verified seal.
- **Signature** (brief-pinned wayfinding): Home is a signpost at a junction: four maroon direction boards on a pole. The department page's timetable link is one more sign, in gold.
- **Second signature:** the source seal on every fact (status, updated date, a Source disclosure).
- **Structure:** a standard app shell. Top bar (wordmark, account), four bottom tabs on phones (Home, Map, Academics, Notices), the tabs inline in the top bar from 768px.

## 4. Scope and boundaries

- Fidelity: static, self-contained HTML prototypes of every existing screen and its real states, a component sheet, tokens. Design only: nothing under `web/src`, `api`, `db` or `docs/openapi.yaml` changes.
- Anti-goals: a corporate dashboard; purple gradients; hero blobs; emoji icons; stock photos; invented numbers, people or campus facts; a fake map.

## 5. States and ranges

Real states, taken from `web/src`: loading, empty (including "still saving"), error with retry, offline, first-run sync, sync failed, 503 busy, 401 session ended, signed out, not an admin, field errors, sending, success. Content ranges: long school names, long notices (up to 4000 characters), missing lecturer office or email, a timetable entry whose course or venue is not saved.

## 6. Interaction and layout

- Mobile first at 360px. One column; the content column caps at 720px; Home goes two-column at 768px.
- Lists are rows separated by hairlines, each row a full-width target with a small "this way" tip.
- Disclosure for sources and long notices; an inline confirm for delete; native selects.
- Motion is state only: colour and press feedback (120ms), disclosure (200ms), a breathing skeleton. Reduced motion removes movement and keeps the state.

## 7. Constraints and open decisions

- System fonts only (zero font bytes). Inline SVG icons from one hand-drawn set. No images in content.
- WCAG AA in light and dark (ratios computed in `tokens.css`), 44px targets, visible focus, 200% text checked.
- Open for David: the "Notices" tab label (the app says "Announcements"; it does not fit four tabs at 360px), the exact maroon and gold (he will refine; change `tools/tokens.mjs`), the Timetable sign's destination before a student has picked a department.
