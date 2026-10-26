# Product

<!-- impeccable:product-schema 1 -->

> Written by `impeccable init` from David's task brief, with no interview round (the brief said to carry on without waiting). Facts below come from the brief and the repository; anything marked *(inferred)* is an assumption for David to confirm.

## Platform

web

## Users

New students of the Federal University of Technology, Akure (FUTA), in the first weeks of resumption, when everything on campus is new and confusing. Mostly on phones, often cheap Android phones, often on weak or no network. Secondary users: department, faculty, SUG and super admins who publish announcements and verify information.

## Product Purpose

An offline-first campus guide. It saves campus data on the phone once, then works without a connection: schools and departments, lecturers, courses, timetables, announcements and a campus map. Success: a fresher finds the right place, person or fact quickly, and can tell whether to trust it.

## Positioning

Every piece of information shows whether it is verified, where it came from and when it was updated. A WhatsApp forward or a notice-board photo cannot say that.

## Operating Context

Outdoors and between buildings in Akure daylight *(inferred)*, standing in queues, in lecture halls. Data is expensive, so the app downloads once and then reads from the phone. Timetables are read per department and per level.

## Capabilities and Constraints

- Real screens in `web/src/pages`: Home, Map (placeholder), Academics (schools), School departments, Department detail, Timetable, Announcements, Login, Register, Admin (composer; manage list in PR #34; verify list upcoming, API `POST /admin/verify` exists).
- Real states: loading, empty, error, offline, first-run sync, failed sync, 503 busy, expired session (401), not an admin.
- Plain text content only. No images in content.
- Accounts are optional and only for admin features.
- First-load JS+CSS under 150 KB gzip; inline SVG icons. From round 3 (David's brief): up to two open-licensed fonts (40 KB at most), a design core layer of 60 KB gzipped at most, and campus photos only in a separate visual pack of 1.5 MB at most, downloaded later on a good connection, never in Lite.

## Brand Commitments

- Working name **Sabi** (set in `web/src/appName.ts`; may change). Tagline "Your FUTA guide".
- Maroon and gold, from David's concept; he will refine.
- Home concept: wayfinding.
- Voice: a friendly, confident guide; warm; clear English. Not a corporate dashboard.
- Never: purple gradients, generic hero blobs, emoji as icons, a stock-AI look.

## Evidence on Hand

No real campus data, logos or numbers are supplied for design work. Photos: David supplied seven (most with no recorded source, kept local only), and round 3 adds openly licensed FUTA photos from Wikimedia Commons (CREDITS.md). Prototypes use obviously fake sample data labelled as sample. No user counts, testimonials or metrics exist and none may be invented.

## Product Principles

1. Say what is true and how sure we are: status, source and date beside every fact.
2. Work without a connection first; the network is a bonus.
3. Point the way: every screen answers "where do I go next".
4. Cheap phones are the target, not the fallback.

## Accessibility & Inclusion

WCAG AA contrast, 44px touch targets, visible focus, usable at 200% text size, reduced motion respected, dark mode. English, plain words; some users read English as a second language *(inferred)*.
