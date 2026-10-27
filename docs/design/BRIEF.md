# Design brief and open questions

Working name: **Sabi**. Product facts are in [PRODUCT.md](PRODUCT.md); the system is in [DESIGN.md](DESIGN.md).

## Job and audience

New students of the Federal University of Technology, Akure, in the first weeks, mostly on cheap Android phones with weak or no data. They find a place, person, course, time or notice, and need to know whether to trust it. Mode: operate. The product's claim: **every fact says how sure we are and who said so**.

## Direction

The approved mockups, rebuilt as code: dark, the FUTA gate at night, crimson-outlined cards, gold accent, one handwritten line per screen, light Pidgin. Differences from the mockups (the fixes) are in the [README](README.md).

## Constraints

- First load about 60 KB gzipped before photos (56.1 KB measured, with fonts and icons). The map is a lazy chunk. Photos are an optional pack of 1.5 MB at most, never in Lite mode.
- Two open-licensed font families (25 KB), Phosphor icons (MIT), OpenStreetMap data (ODbL). No external requests at runtime.
- WCAG AA contrast (measured, including text over photos), 44px targets, visible focus, 200% text, reduced motion respected.
- Every screen has loading, empty, error and offline states.

## Open for David

1. **Light theme.** Dark only for now, as asked. The light code and screenshots were removed.
2. **The night gate photo.** It comes from FUTA's official Facebook page, used with FUTA's permission, credited in CREDITS.md and on the credits screen. **FUTA's written OK is pending**, so the file stays local-only and is not committed until David confirms. Other missing photos (a hostel, the walkway, lecture theatres inside) need an owner and a licence (PHOTOS.md).
3. **Map names.** Place names are exactly as written in OpenStreetMap, including odd spellings. FUTA needs to check them before any can say "Verified".
4. **Academics data.** The schools and departments are sample data; the real list needs the data team.
5. **Opening hours** are not known for any place, so every place says "Opening hours no dey" until an admin adds them.
6. **Copy sign-off.** [COPY.md](COPY.md) is about 600 strings. The Pidgin is light and meant for any fresher; a native speaker should read it before launch.
7. **Per-type sync counts** on first sync need a small change in `web/src/lib/sync.ts`.
8. **"Unread" on notices** needs the phone to remember when you last opened them.
9. **Forgot password** is in the mockup but not designed: the API has no such endpoint.
10. **Dependencies** to approve: `@phosphor-icons/core` (or inline the SVGs, which needs no approval).
