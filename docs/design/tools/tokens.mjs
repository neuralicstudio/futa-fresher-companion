// Builds docs/design/tokens.css and docs/design/tokens.json from the values below, and measures every
// WCAG contrast ratio in PAIRS and OVER_PHOTO (so the ratios in the files are computed, not typed).
// No dependencies. Run from the repo root:  node docs/design/tools/tokens.mjs
// Change a value here and run it again, never in the outputs. The script exits 1 if a pair falls
// under its minimum.
//
// Where the values come from: the palette was sampled from the approved Sabi mockups (docs/design/inspo, kept
// out of git) with a script that reads the dominant colour of a box, so the hex values are within 4 levels per
// channel of the mockups. Dark only for now; a light theme is a later task.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- colour
const DARK = {
  // Surfaces
  bg: '#0a0309', // the page: near-black with a maroon cast (mockup pages sample #0c0404 to #040414)
  'bg-raised': '#12050e', // bands between sections, the sheet behind a dialog
  card: '#1b0714', // every card (sampled #1c0414)
  'card-2': '#240b1b', // a field or a chip sitting on a card (sampled #240c1c)
  field: '#2c0c14', // the big search field (sampled #2c0c14)
  tabbar: '#240414', // the floating tab bar (sampled #240414)
  rule: '#3a1228', // hairlines inside cards
  outline: '#8c1c3c', // the crimson outline on cards and fields
  'outline-strong': '#b3254b', // the same on focus and on a selected card
  // Text
  text: '#fff9f6', // headings and primary text
  'text-2': '#eadde2', // body text
  muted: '#c3b2b9', // meta text, placeholders (4.5:1 or more on card)
  // Brand
  gold: '#fcc13c', // sampled #fcc03c: the signature accent, active tab, primary button on dark
  'gold-2': '#e5a91b', // gold pressed
  'on-gold': '#1a0a05', // text on gold
  maroon: '#7a142c', // sampled #7c142c: the "Get started" button
  'maroon-2': '#611022', // maroon pressed
  'on-maroon': '#fff9f6',
  // Status (always with a word or an icon, never colour alone)
  green: '#08c276', // sampled #04c474: verified seal, success, "done"
  'on-green': '#04140c',
  red: '#fc344c', // sampled #fc344c: danger text, errors, delete
  'red-chip': '#df1b37', // the SUG chip fill: the sampled red darkened until white text passes 4.5:1
  'on-red': '#fff9f6',
  indigo: '#4a36d8', // sampled #442cd4: department scope
  'on-indigo': '#fff9f6',
  amber: '#ff9f43', // "may be outdated"
  'on-amber': '#1a0a05',
  'error-fill': '#2c040c', // sampled #2c040c: the error bar
  'success-fill': '#06261a', // the "You're set" card
  // Map pins (category colours, drawn on a dark map)
  'pin-lecture': '#2f6bff', 'pin-library': '#9566f0', 'pin-building': '#9566f0', 'pin-food': '#10b981',
  'pin-sports': '#f08a24', 'pin-health': '#e5384a', 'pin-hostel': '#ec4899', 'pin-gate': '#fcc13c',
  // The dark branded map (OpenStreetMap data drawn in these colours)
  'map-ground': '#0e0610', 'map-grass': '#14221a', 'map-wood': '#10261f', 'map-water': '#102a4c', 'map-pitch': '#1c3a24',
  'map-building': '#3a1226', 'map-building-edge': '#5b1d3b', 'map-road': '#6e4b20', 'map-lane': '#3b2a2e',
  // Controls
  'track-off': '#2c344c', // switch off
  'thumb-off': '#acacc4',
  'strength-off': '#4c4c5c', // password meter (sampled #4c4c5c)
  'ring-track': '#24242c', // progress ring track (sampled #24242c)
  focus: '#ffd96b', // focus ring (on every dark surface)
  // Scrims and photo tints
  night: '#0a0309', // the brand night: the hero's bottom edge in every theme, the tab bar's family
  scrim: '#0a0a1a', // the navy-black that fades a photo into the page (hero scrim, card scrim)
  'on-photo': '#fff9f6',
  black: '#060207', // the tinted black: shadows and the desktop backdrop
  'chip-maroon': '#4c0424', // the University chip on night (sampled #4c0424)
  'red-hover': '#c4132d', // danger pressed
  'map-me': '#3f7fe8', // the blue "you are here" dot (a map convention)
  'field-edge': '#c2486a', // the edge of a field: 3:1 against the card and the field fill
  // The drawn scenes (photo fallbacks): a night campus. Drawing colour only, the same in both themes.
  'scene-sky-1': '#0b1030', 'scene-sky-2': '#4a1a4e', 'scene-sun': '#ffd479', 'scene-glow': '#ffb25b', 'scene-moon': '#fff1cf',
  'scene-hill-1': '#1f2a45', 'scene-hill-2': '#17304a', 'scene-hill-3': '#0f2a2e', 'scene-rock': '#2c2540',
  'scene-leaf': '#12503d', 'scene-leaf-2': '#1b6b4c', 'scene-trunk': '#3a2a2a', 'scene-earth': '#6b4a3a',
  'scene-wall': '#e9d3b4', 'scene-wall-2': '#c9a98a', 'scene-roof': '#9d2c3a', 'scene-pane': '#ffc65c', 'scene-cloud': '#6c5a8a',
  'scene-skin-1': '#8a5a3c', 'scene-skin-2': '#6b4430', 'scene-skin-3': '#4a2e22', 'scene-hair': '#140a0a', 'scene-cloth': '#f5eee6',
  // Text that sits on night surfaces (the tab bar, the hero) stays light in both themes.
  'night-text': '#fff9f6', 'night-muted': '#dccbd2',
};

// Pairs whose contrast must hold: [foreground, background, minimum, what].
const PAIRS = [
  ['text', 'bg', 4.5, 'headings on the page'], ['text-2', 'bg', 4.5, 'body text on the page'], ['muted', 'bg', 4.5, 'meta text on the page'],
  ['text', 'card', 4.5, 'text on cards'], ['text-2', 'card', 4.5, 'body text on cards'], ['muted', 'card', 4.5, 'meta text and placeholders on cards'],
  ['muted', 'card-2', 4.5, 'placeholders in fields on cards'], ['text', 'card-2', 4.5, 'text in fields'], ['muted', 'field', 4.5, 'placeholder in the big search field'],
  ['text', 'field', 4.5, 'typed text in the big search field'],
  ['on-gold', 'gold', 4.5, 'text on gold (buttons, the active filter)'], ['on-gold', 'gold-2', 4.5, 'text on pressed gold'],
  ['on-maroon', 'maroon', 4.5, 'the maroon button label'], ['on-maroon', 'maroon-2', 4.5, 'the pressed maroon button label'],
  ['on-green', 'green', 4.5, 'text on the green seal'], ['on-red', 'red-chip', 4.5, 'text on the SUG chip'], ['on-indigo', 'indigo', 4.5, 'text on the department chip'],
  ['on-amber', 'amber', 4.5, 'text on the outdated seal'],
  ['night-text', 'tabbar', 4.5, 'tab labels on the tab bar'], ['night-muted', 'tabbar', 4.5, 'inactive tab labels'], ['gold', 'tabbar', 4.5, 'the active tab'],
  ['field-edge', 'card', 3, 'field edge on a card (non-text)'], ['field-edge', 'card-2', 3, 'field edge on the field fill (non-text)'], ['field-edge', 'bg', 3, 'field edge on the page (non-text)'],
  ['on-photo', 'chip-maroon', 4.5, 'the University chip'],
  ['focus', 'bg', 3, 'focus ring on the page'], ['focus', 'card', 3, 'focus ring on cards'],
];
const DARK_ONLY = [
  ['focus', 'tabbar', 3, 'focus ring on the tab bar'], ['gold', 'bg', 4.5, 'gold text and links on the page'], ['gold', 'card', 4.5, 'gold text on cards'],
  ['red', 'card', 4.5, 'red text on cards (errors, delete)'], ['red', 'error-fill', 4.5, 'error text in the error bar'], ['green', 'card', 4.5, 'green text on cards'],
  ['green', 'success-fill', 4.5, 'green text in the success card'], ['amber', 'card', 4.5, 'amber text on cards'],
  ['outline-strong', 'card', 1.5, 'selected card outline (decoration; the gold chip and the word carry meaning)'],
  ['thumb-off', 'track-off', 3, 'switch thumb on its off track (non-text)'], ['gold', 'ring-track', 3, 'progress ring arc on its track (non-text)'],
  ['night-muted', 'bg', 4.5, 'muted text on night'],
];

// Text over photographs. A photo can be any colour, so each pair is measured against the worst pixel:
// a pure white one under light text. The overlay sits between at the alpha given.
// [foreground, overlay, alpha, worst pixel, minimum, what]
const OVER_PHOTO = [
  ['on-photo', 'scrim', 0.72, 'white', 4.5, 'hero title and body over the scrim (the scrim is at least this strong wherever text sits)'],
  ['night-muted', 'scrim', 0.72, 'white', 4.5, 'hero secondary text over the scrim'],
  ['gold', 'scrim', 0.72, 'white', 4.5, 'the handwritten kicker and gold words over the scrim'],
  ['on-photo', 'scrim', 0.55, 'white', 3, 'the logo row and profile button over the top scrim (large text and icons)'],
  ['on-photo', 'scrim', 0.85, 'white', 4.5, 'place and school names on card scrims'],
];

// ---------------------------------------------------------------- measure
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex) => { const [r, g, b] = rgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [a, b].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function over(overlay, alpha, pixel) {
  const base = pixel === 'white' ? [1, 1, 1] : [0, 0, 0];
  const [r, g, b] = rgb(overlay).map((c, i) => lin(alpha * c + (1 - alpha) * base[i]));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
let failed = 0;
function measure(pal, rows) {
  return rows.map(([fg, bg, min, what]) => {
    const r = ratio(lum(pal[fg]), lum(pal[bg])), pass = r >= min;
    if (!pass) failed++;
    return { fg, bg, ratio: Math.round(r * 100) / 100, min, pass, what };
  });
}
function measureOver(pal, rows) {
  return rows.map(([fg, overlay, alpha, pixel, min, what]) => {
    const r = ratio(lum(pal[fg]), over(pal[overlay], alpha, pixel)), pass = r >= min;
    if (!pass) failed++;
    return { fg, bg: `${overlay} at ${Math.round(alpha * 100)}% over a ${pixel} pixel`, ratio: Math.round(r * 100) / 100, min, pass, what };
  });
}
const darkPairs = [...measure(DARK, PAIRS), ...measure(DARK, DARK_ONLY), ...measureOver(DARK, OVER_PHOTO)];

// ---------------------------------------------------------------- everything that is not colour
const FALLBACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif';
const FONT_BODY = `"Poppins", ${FALLBACK}`;
const FONT_HAND = '"Yellowtail", "Segoe Script", "Bradley Hand", cursive';
const FONTS = [
  ['Poppins', 'fonts/poppins-400.woff2', '400', 'SIL OFL 1.1', 'fonts/OFL-Poppins.txt'],
  ['Poppins', 'fonts/poppins-600.woff2', '600', 'SIL OFL 1.1', 'fonts/OFL-Poppins.txt'],
  ['Poppins', 'fonts/poppins-700.woff2', '700', 'SIL OFL 1.1', 'fonts/OFL-Poppins.txt'],
  ['Yellowtail', 'fonts/yellowtail-400.woff2', '400', 'Apache 2.0', 'fonts/LICENSE-Yellowtail-Apache-2.0.txt'],
];
const SCALE = {
  // Poppins 600/700 for everything but the handwritten kicker. rem, so 200% text scales it all.
  'text-xs': '0.75rem', // 12px: tab labels only (a label, not reading text)
  'text-sm': '0.875rem', // 14px: meta, hints, chips
  'text-md': '1rem', // 16px: body, fields
  'text-lg': '1.125rem', // 18px: card titles
  'text-xl': '1.375rem', // 22px: section headings
  'text-2xl': '1.75rem', // 28px: sticker and big numbers
  'text-3xl': '2.25rem', // 36px: hero titles
  'text-4xl': '2.875rem', // 46px: Welcome title
  'hand-md': '1.75rem', // handwritten kicker on a screen
  'hand-lg': '2.5rem', // handwritten kicker on Welcome and Home
};
const LEADING = { 'leading-tight': '1.08', 'leading-snug': '1.3', 'leading-body': '1.55' };
const WEIGHT = { 'weight-body': '400', 'weight-strong': '600', 'weight-display': '700' };
const SPACE = { 'space-3xs': '2px', 'space-2xs': '4px', 'space-xs': '8px', 'space-sm': '12px', 'space-md': '16px', 'space-lg': '24px', 'space-xl': '32px', 'space-2xl': '48px', 'space-3xl': '64px' };
const SIZE = {
  hit: '44px', 'control-h': '56px', 'pill-h': '48px', 'icon-sm': '16px', 'icon-md': '22px', 'icon-lg': '28px', 'icon-xl': '40px',
  gutter: '16px', container: '480px', 'container-wide': '960px', measure: '65ch',
  'hero-h': '440px', 'hero-detail-h': '300px', tabbar: '72px', 'badge-ring': '124px', 'ring-stroke': '8px', outline: '1.5px', 'rule-hair': '1px', 'rule-bar': '2px',
};
const RADIUS = { 'radius-sm': '10px', 'radius-md': '16px', 'radius-card': '22px', 'radius-sheet': '28px', 'radius-pill': '999px' };
const SHADOW = {
  'shadow-card': '0 10px 30px -14px rgba(0, 0, 0, 0.7)',
  'shadow-float': '0 -12px 40px -12px rgba(0, 0, 0, 0.7), 0 18px 40px -14px rgba(0, 0, 0, 0.8)', // tab bar and sheets
  'shadow-gold': '0 10px 22px -10px rgba(0, 0, 0, 0.8)', // under gold buttons: neutral and offset, never a halo
  'shadow-ring': '0 14px 30px -10px rgba(0, 0, 0, 0.75)', // the countdown badge: lifted, with offset (the gold ring is its glow)
};
const GRADIENT = {
  'grad-hero-bottom': 'linear-gradient(180deg, rgba(10, 10, 26, 0) 0%, rgba(10, 10, 26, 0.72) 42%, #0a0309 100%)', // photo fades into the page; text sits below 42%
  'grad-hero-top': 'linear-gradient(180deg, rgba(10, 10, 26, 0.72) 0%, rgba(10, 10, 26, 0) 100%)', // under the logo row
  'grad-card': 'linear-gradient(160deg, #240b1b 0%, #14050f 100%)', // card fill
  'grad-card-photo': 'linear-gradient(180deg, rgba(10, 10, 26, 0) 0%, rgba(10, 10, 26, 0.85) 62%)', // name strip on a photo card
  'grad-gold': 'linear-gradient(180deg, #fcc13c, #e5a91b)', // the Notice card's left bar
  'grad-maroon': 'linear-gradient(180deg, #8a1832, #6e1228)', // the maroon button
};
const MOTION = {
  'dur-micro': '120ms', 'dur-short': '220ms', 'dur-long': '480ms', 'dur-focal': '800ms', 'dur-ambient': '6s',
  'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)', 'ease-in': 'cubic-bezier(0.7, 0, 0.84, 0)', 'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
};
const Z = { 'z-sticky': '200', 'z-nav': '300', 'z-sheet': '350', 'z-dialog': '400' };

// ---------------------------------------------------------------- write
const block = (obj) => Object.entries(obj).map(([k, v]) => `  --${k}: ${v};`).join('\n');
const colours = (pal) => Object.entries(pal).map(([k, v]) => `  --color-${k}: ${v};`).join('\n');
const pairLines = (rows) => rows.map((p) => ` *   ${p.fg} on ${p.bg}: ${p.ratio.toFixed(2)}:1 (needs ${p.min}) ${p.pass ? 'pass' : 'FAIL'}, ${p.what}`).join('\n');
const faces = FONTS.map(([family, src, weight]) => `@font-face {\n  font-family: "${family}";\n  src: url("${src}") format("woff2");\n  font-weight: ${weight};\n  font-style: normal;\n  font-display: swap;\n}`).join('\n');

const css = `/* Hallmark · shape: app screen · genre: playful · theme: custom · round 4, the approved Sabi mockups
 * idea: "Sabi at night: the FUTA gate, a crimson-outlined card, one gold accent and one handwritten line per screen"
 * paper: #0a0309 · accent: gold #fcc13c, maroon #7a142c, crimson outline #8c1c3c · display: Poppins 600/700 · hand: Yellowtail
 * nav: five-tab floating pill (Home, Map, Academics, Timetable, Notices); Settings and Admin from the profile icon
 * states: loading, empty, error, offline, first sync, sync done, sync failed, busy, session ended, not an admin, visual pack, Lite
 * axes: dark/geometric-sans/warm · posture: committed · modes: dark only · lite: yes · contrast: pass · v4.0.0 */
/* Hallmark · pre-emit critique: P5 H5 E5 S4 R4 V5 · weakest: S and R, photos and glass must stay cheap; the photo pack, Lite and the budget carry it */

/* Sabi design tokens. Generated by docs/design/tools/tokens.mjs. Do not edit by hand: change the values
 * in that script and run it again. Dark only for now (the mockups show only dark); a light theme is a later task.
 * Every contrast ratio below was computed by the script (WCAG 2 relative luminance). Rows that say "over a
 * white pixel" are text on a photo, measured against the worst pixel a photo could have there.
 *
 * Dark
${pairLines(darkPairs)}
 */

${faces}

:root {
  color-scheme: dark;
  --font-body: ${FONT_BODY};
  --font-hand: ${FONT_HAND};
  --hero-fade: var(--color-bg); /* where a hero's photo ends */
${block(SCALE)}
${block(LEADING)}
${block(WEIGHT)}
${block(SPACE)}
${block(SIZE)}
${block(RADIUS)}
${block(SHADOW)}
${block(GRADIENT)}
${block(MOTION)}
${block(Z)}
${colours(DARK)}
}

`;

const json = {
  $description: 'Sabi design tokens, round 4 (the approved mockups). Generated by docs/design/tools/tokens.mjs. Use the CSS variables as they are named; the semantic roles are in "role".',
  source: 'Dark values sampled from the approved mockups (within 4 levels per channel). Dark only for now.',
  font: {
    body: FONT_BODY, hand: FONT_HAND, numeric: 'font-variant-numeric: tabular-nums',
    files: FONTS.map(([family, src, weight, licence, licenceFile]) => ({ family, src, weight, display: 'swap', licence, licenceFile })),
  },
  type: SCALE, leading: LEADING, weight: WEIGHT, space: SPACE, size: SIZE, radius: RADIUS, shadow: SHADOW, gradient: GRADIENT, motion: MOTION, z: Z,
  color: { dark: DARK },
  role: {
    'surface.page': 'bg', 'surface.band': 'bg-raised', 'surface.card': 'card (or grad-card)', 'surface.field': 'card-2 (field on a card), field (search)', 'surface.tabbar': 'tabbar',
    'outline.default': 'outline at outline width', 'outline.selected': 'outline-strong, or gold for the one highlighted card',
    'text.heading': 'text', 'text.body': 'text-2', 'text.meta': 'muted', 'text.on-photo': 'on-photo over grad-hero-*',
    'action.primary': 'maroon on on-maroon (Welcome); gold on on-gold (forms, hero actions)', 'action.secondary': 'outline gold on bg', 'action.danger': 'red',
    'status.verified': 'green on on-green: only when a record has verification.status = verified', 'status.unverified': 'muted dashed outline', 'status.outdated': 'amber on on-amber',
    'scope.university': 'gold', 'scope.sug': 'red-chip on on-red', 'scope.school': 'green', 'scope.department': 'indigo on on-indigo',
    'map.pins': 'pin-<category>', 'accent.handwriting': 'gold in font-hand, once per screen',
  },
  contrast: { dark: darkPairs },
};

writeFileSync(join(OUT, 'tokens.css'), css);
writeFileSync(join(OUT, 'tokens.json'), JSON.stringify(json, null, 2) + '\n');
for (const [mode, pairs] of [['dark', darkPairs]]) for (const p of pairs) if (!p.pass) console.log(`${mode.padEnd(5)} FAIL ${p.ratio.toFixed(2).padStart(5)} (needs ${p.min}) ${p.fg} on ${p.bg}`);
console.log(failed ? `${failed} pair(s) under the minimum` : `all ${darkPairs.length} pairs pass`);
process.exit(failed ? 1 : 0);
