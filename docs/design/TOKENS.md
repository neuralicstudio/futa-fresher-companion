# Tokens

Exact values. **Generated** from [tools/tokens.mjs](tools/tokens.mjs) into [tokens.css](tokens.css) and [tokens.json](tokens.json): change a value in the script and run `node docs/design/tools/tokens.mjs`, never in the outputs. Use the CSS variables as they are named. In `web/`, put them in `:root` and keep `--color-*` names.

**Where the colours come from.** The palette was **sampled from the approved mockups** (a script read the dominant colour of boxes on each screen, within 4 levels per channel; `bg` and `card` come from the page and card fills, `gold` from the buttons, `green`, `red` and `indigo` from the Verified, SUG and department chips). **Dark only for now**: the mockups show only dark, so a light theme is a later task. **44 contrast pairs pass** (the full list, with ratios, is at the top of tokens.css), including text over photos measured against the worst pixel.

Two values differ from what was sampled, on purpose: `red-chip` (the SUG chip) is the sampled red darkened until white text passes 4.5:1, and `night-muted` and `muted` are lightened for the same reason.

## Colour

### Surfaces

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#0a0309` | The page |
| `--color-bg-raised` | `#12050e` | Bands between sections, sheets |
| `--color-card` | `#1b0714` | Every card |
| `--color-card-2` | `#240b1b` | A field or row on a card |
| `--color-field` | `#2c0c14` | The big search field |
| `--color-tabbar` | `#240414` | The floating tab bar |
| `--color-rule` | `#3a1228` | Hairlines inside cards |
| `--color-outline` | `#8c1c3c` | The crimson card outline (1.5px) |
| `--color-outline-strong` | `#b3254b` | Focused or selected outline |

### Text

| Token | Value | Use |
|---|---|---|
| `--color-text` | `#fff9f6` | Headings |
| `--color-text-2` | `#eadde2` | Body text |
| `--color-muted` | `#c3b2b9` | Meta text, placeholders |
| `--color-on-photo` | `#fff9f6` | Text on photos |
| `--color-night-text` | `#fff9f6` | Text on night surfaces |
| `--color-night-muted` | `#dccbd2` | Secondary text on night surfaces |

### Brand

| Token | Value | Use |
|---|---|---|
| `--color-gold` | `#fcc13c` | The signature accent: active tab, primary button, current things |
| `--color-gold-2` | `#e5a91b` | Gold pressed |
| `--color-on-gold` | `#1a0a05` | Text on gold |
| `--color-maroon` | `#7a142c` | Welcome start button, switch on |
| `--color-maroon-2` | `#611022` | Maroon pressed |
| `--color-on-maroon` | `#fff9f6` | Text on maroon |
| `--color-night` | `#0a0309` | Hero bottom edge, light-mode tab bar family |

### Status and scopes

| Token | Value | Use |
|---|---|---|
| `--color-green` | `#08c276` | Verified, success, done, School scope |
| `--color-on-green` | `#04140c` | Text on green |
| `--color-red` | `#fc344c` | Danger text, errors |
| `--color-red-chip` | `#df1b37` | SUG chip fill |
| `--color-on-red` | `#fff9f6` | Text on the SUG chip |
| `--color-indigo` | `#4a36d8` | Department scope |
| `--color-on-indigo` | `#fff9f6` | Text on indigo |
| `--color-amber` | `#ff9f43` | May be outdated |
| `--color-on-amber` | `#1a0a05` | Text on amber |
| `--color-error-fill` | `#2c040c` | Error bar fill |
| `--color-success-fill` | `#06261a` | Success card fill |

### Controls

| Token | Value | Use |
|---|---|---|
| `--color-focus` | `#ffd96b` | Focus ring |
| `--color-track-off` | `#2c344c` | Switch off |
| `--color-thumb-off` | `#acacc4` | Switch thumb off |
| `--color-strength-off` | `#4c4c5c` | Password meter, empty |
| `--color-ring-track` | `#24242c` | Progress ring track |
| `--color-scrim` | `#0a0a1a` | The navy-black under hero text |

### Map pins

| Token | Value | Use |
|---|---|---|
| `--color-pin-lecture` | `#2f6bff` |  |
| `--color-pin-library` | `#9566f0` |  |
| `--color-pin-building` | `#9566f0` |  |
| `--color-pin-food` | `#10b981` |  |
| `--color-pin-sports` | `#f08a24` |  |
| `--color-pin-health` | `#e5384a` |  |
| `--color-pin-hostel` | `#ec4899` |  |
| `--color-pin-gate` | `#fcc13c` |  |

### The dark branded map

| Token | Value | Use |
|---|---|---|
| `--color-map-ground` | `#0e0610` |  |
| `--color-map-grass` | `#14221a` |  |
| `--color-map-wood` | `#10261f` |  |
| `--color-map-water` | `#102a4c` |  |
| `--color-map-pitch` | `#1c3a24` |  |
| `--color-map-building` | `#3a1226` |  |
| `--color-map-building-edge` | `#5b1d3b` |  |
| `--color-map-road` | `#6e4b20` |  |
| `--color-map-lane` | `#3b2a2e` |  |
| `--color-map-me` | `#3f7fe8` |  |

### Drawn scenes (the photo fallbacks, same in both themes)

| Token | Value | Use |
|---|---|---|
| `--color-scene-sky-1` | `#0b1030` |  |
| `--color-scene-sky-2` | `#4a1a4e` |  |
| `--color-scene-sun` | `#ffd479` |  |
| `--color-scene-glow` | `#ffb25b` |  |
| `--color-scene-moon` | `#fff1cf` |  |
| `--color-scene-hill-1` | `#1f2a45` |  |
| `--color-scene-hill-2` | `#17304a` |  |
| `--color-scene-hill-3` | `#0f2a2e` |  |
| `--color-scene-rock` | `#2c2540` |  |
| `--color-scene-leaf` | `#12503d` |  |
| `--color-scene-leaf-2` | `#1b6b4c` |  |
| `--color-scene-trunk` | `#3a2a2a` |  |
| `--color-scene-earth` | `#6b4a3a` |  |
| `--color-scene-wall` | `#e9d3b4` |  |
| `--color-scene-wall-2` | `#c9a98a` |  |
| `--color-scene-roof` | `#9d2c3a` |  |
| `--color-scene-pane` | `#ffc65c` |  |
| `--color-scene-cloud` | `#6c5a8a` |  |
| `--color-scene-skin-1` | `#8a5a3c` |  |
| `--color-scene-skin-2` | `#6b4430` |  |
| `--color-scene-skin-3` | `#4a2e22` |  |
| `--color-scene-hair` | `#140a0a` |  |
| `--color-scene-cloth` | `#f5eee6` |  |

## Fonts

Two open-licensed families, served from [fonts/](fonts/) as woff2, subset to Latin plus the punctuation the copy uses, `font-display: swap` with a system fallback. **Total 4 files, 25.3 KB** (limit 40 KB). Licences are beside the files.

| Family | File | Weight | Licence |
|---|---|---|---|
| Poppins | `fonts/poppins-400.woff2` | 400 | SIL OFL 1.1 (`fonts/OFL-Poppins.txt`) |
| Poppins | `fonts/poppins-600.woff2` | 600 | SIL OFL 1.1 (`fonts/OFL-Poppins.txt`) |
| Poppins | `fonts/poppins-700.woff2` | 700 | SIL OFL 1.1 (`fonts/OFL-Poppins.txt`) |
| Yellowtail | `fonts/yellowtail-400.woff2` | 400 | Apache 2.0 (`fonts/LICENSE-Yellowtail-Apache-2.0.txt`) |

- Body: `--font-body`: `"Poppins", system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif`
- Handwriting: `--font-hand`: `"Yellowtail", "Segoe Script", "Bradley Hand", cursive`, **one line per screen**, only as the hero kicker.
- Numbers: `font-variant-numeric: tabular-nums` for times, counts and percentages.

## Type scale

| Token | Size | Used for |
|---|---|---|
| `--text-xs` | 0.75rem | Tab labels only |
| `--text-sm` | 0.875rem | Meta, hints, chips, placeholders |
| `--text-md` | 1rem | Body, fields |
| `--text-lg` | 1.125rem | Card titles |
| `--text-xl` | 1.375rem | Section headings |
| `--text-2xl` | 1.75rem | Big numbers (badge) |
| `--text-3xl` | 2.25rem | Hero titles |
| `--text-4xl` | 2.875rem | Welcome title |
| `--hand-md` | 1.75rem | Handwritten line (screens) |
| `--hand-lg` | 2.5rem | Handwritten line (Home, Welcome) |

Weights: `weight-body` 400, `weight-strong` 600, `weight-display` 700. Line heights: `leading-tight` 1.08, `leading-snug` 1.3, `leading-body` 1.55. Sizes are in rem so 200% text scales everything.

## Spacing, sizes and radii

| Token | Value |
|---|---|
| `--space-3xs` | `2px` |
| `--space-2xs` | `4px` |
| `--space-xs` | `8px` |
| `--space-sm` | `12px` |
| `--space-md` | `16px` |
| `--space-lg` | `24px` |
| `--space-xl` | `32px` |
| `--space-2xl` | `48px` |
| `--space-3xl` | `64px` |
| `--hit` | `44px` |
| `--control-h` | `56px` |
| `--pill-h` | `48px` |
| `--icon-sm` | `16px` |
| `--icon-md` | `22px` |
| `--icon-lg` | `28px` |
| `--icon-xl` | `40px` |
| `--gutter` | `16px` |
| `--container` | `480px` |
| `--container-wide` | `960px` |
| `--measure` | `65ch` |
| `--hero-h` | `440px` |
| `--hero-detail-h` | `300px` |
| `--tabbar` | `72px` |
| `--badge-ring` | `124px` |
| `--ring-stroke` | `8px` |
| `--outline` | `1.5px` |
| `--rule-hair` | `1px` |
| `--rule-bar` | `2px` |
| `--radius-sm` | `10px` |
| `--radius-md` | `16px` |
| `--radius-card` | `22px` |
| `--radius-sheet` | `28px` |
| `--radius-pill` | `999px` |

## Shadows and gradients

| Token | Value |
|---|---|
| `--shadow-card` | `0 10px 30px -14px rgba(0, 0, 0, 0.7)` |
| `--shadow-float` | `0 -12px 40px -12px rgba(0, 0, 0, 0.7), 0 18px 40px -14px rgba(0, 0, 0, 0.8)` |
| `--shadow-gold` | `0 10px 22px -10px rgba(0, 0, 0, 0.8)` |
| `--shadow-ring` | `0 14px 30px -10px rgba(0, 0, 0, 0.75)` |
| `--grad-hero-bottom` | `linear-gradient(180deg, rgba(10, 10, 26, 0) 0%, rgba(10, 10, 26, 0.72) 42%, #0a0309 100%)` |
| `--grad-hero-top` | `linear-gradient(180deg, rgba(10, 10, 26, 0.72) 0%, rgba(10, 10, 26, 0) 100%)` |
| `--grad-card` | `linear-gradient(160deg, #240b1b 0%, #14050f 100%)` |
| `--grad-card-photo` | `linear-gradient(180deg, rgba(10, 10, 26, 0) 0%, rgba(10, 10, 26, 0.85) 62%)` |
| `--grad-gold` | `linear-gradient(180deg, #fcc13c, #e5a91b)` |
| `--grad-maroon` | `linear-gradient(180deg, #8a1832, #6e1228)` |

- Shadows are offset and soft. The only glow is `--shadow-ring`, on the countdown badge (the mockups' one). `--shadow-gold` is a lit edge under gold buttons, not a halo.
- Gradients are scrims and card fills only; **never on text**.

## Motion

| Token | Value |
|---|---|
| `--dur-micro` | `120ms` |
| `--dur-short` | `220ms` |
| `--dur-long` | `480ms` |
| `--dur-focal` | `800ms` |
| `--dur-ambient` | `6s` |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |

- Feedback 120ms, state 220ms, page and ring changes 480ms, one entrance per screen 800ms (once per session, on screen).
- Loops (the skeleton, the map's "you are here" pulse) run only while on screen and pause when the page is hidden.
- `prefers-reduced-motion` removes all movement and keeps the state. **Lite mode** removes every transition, blur and loop, the photos and the decoration.

## Z-index

| Token | Value |
|---|---|
| `--z-sticky` | `200` |
| `--z-nav` | `300` |
| `--z-sheet` | `350` |
| `--z-dialog` | `400` |

## Semantic roles

| Role | Token |
|---|---|
| `surface.page` | bg |
| `surface.band` | bg-raised |
| `surface.card` | card (or grad-card) |
| `surface.field` | card-2 (field on a card), field (search) |
| `surface.tabbar` | tabbar |
| `outline.default` | outline at outline width |
| `outline.selected` | outline-strong, or gold for the one highlighted card |
| `text.heading` | text |
| `text.body` | text-2 |
| `text.meta` | muted |
| `text.on-photo` | on-photo over grad-hero-* |
| `action.primary` | maroon on on-maroon (Welcome); gold on on-gold (forms, hero actions) |
| `action.secondary` | outline gold on bg |
| `action.danger` | red |
| `status.verified` | green on on-green: only when a record has verification.status = verified |
| `status.unverified` | muted dashed outline |
| `status.outdated` | amber on on-amber |
| `scope.university` | gold |
| `scope.sug` | red-chip on on-red |
| `scope.school` | green |
| `scope.department` | indigo on on-indigo |
| `map.pins` | pin-<category> |
| `accent.handwriting` | gold in font-hand, once per screen |
