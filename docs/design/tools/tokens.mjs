// Builds docs/design/tokens.css and docs/design/tokens.json from the values below, and computes
// every WCAG contrast ratio listed in PAIRS and OVER_PHOTO (measured, not typed).
// No dependencies. Run from the repo root:  node docs/design/tools/tokens.mjs
// To refine the palette, change a value here and run it again. The script exits 1 if a pair
// falls under its minimum.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- colour (OKLCH: L%, C, H)
// Round 3, "the flyer": maroon night and gold carry the brand; jade, sky and coral are the
// aso-ebi colours that change with the time of day and mark notice scopes and chart series.
// Neutrals are tinted toward the maroon hue.
const LIGHT = {
  paper: [97.4, 0.008, 40], // the page
  'paper-2': [94, 0.012, 35], // wells, the second neutral
  'paper-3': [99.4, 0.004, 60], // raised: cards, fields, glass (with alpha)
  ink: [22, 0.035, 18], // text and icons
  'ink-2': [33, 0.03, 18], // secondary headings
  muted: [46.5, 0.024, 20], // meta text (needs 4.5:1 on paper-2)
  rule: [88, 0.014, 30], // hairline dividers only, never text
  maroon: [36, 0.12, 18], // primary action, the University chip
  'maroon-2': [29.5, 0.105, 18], // pressed and hover on maroon
  'action-edge': [36, 0.12, 18], // outline buttons and chips
  link: [36, 0.12, 18], // links, quiet buttons
  'on-maroon': [97.5, 0.012, 75], // text and icons on maroon
  gold: [83, 0.14, 82], // stickers, verified seal, the active tab, figures on dark
  'gold-2': [77, 0.145, 76], // gold pressed
  'on-gold': [22, 0.035, 18], // text on gold
  'gold-ink': [52, 0.11, 70], // gold as large text on light paper
  accent: [55, 0.12, 70], // gold detail in icons on light paper (non-text, 3:1)
  focus: [36, 0.12, 18], // ring on paper
  'focus-on-dark': [83, 0.14, 82], // ring on the night surfaces and over photos
  jade: [50, 0.1, 165], // campus green: school scope, chart series
  sky: [50, 0.11, 245], // department scope, chart series
  coral: [57, 0.15, 38], // SUG scope, evening, chart series
  'jade-wash': [94.5, 0.03, 165],
  'sky-wash': [94.5, 0.025, 245],
  'coral-wash': [95, 0.03, 45],
  'maroon-wash': [94.5, 0.024, 18], // tinted chips, codes, initials
  'gold-wash': [95.5, 0.05, 88], // Today, time chips
  error: [47, 0.17, 28],
  'error-wash': [95, 0.025, 28],
  warning: [48, 0.11, 60],
  'warning-wash': [95.5, 0.03, 75],
  success: [44, 0.1, 150],
  'success-wash': [95.5, 0.025, 150],
  'offline-band': [22, 0.035, 18],
  'on-offline-band': [96, 0.01, 60],
  scrim: [18, 0.03, 18], // behind dialogs (55% alpha)
  // Night: the brand surface, the same in both modes. Heroes fade into it under the text; the tab
  // bar and the stickers' dark discs are made of it. Four dayparts tint the hero's scrim.
  night: [19, 0.06, 18], // the night surface and the hero scrim (at 84% over a photo)
  'night-2': [27, 0.07, 18], // raised on night: the tab bar's inner discs
  'tint-morning': [31, 0.1, 40], // the scrim's colour in the morning (warm)
  'tint-afternoon': [29, 0.1, 18], // afternoon: the brand maroon
  'tint-evening': [28, 0.11, 10], // evening: coral-maroon
  'tint-night': [17, 0.045, 260], // night: blue-black
  'on-night': [97.5, 0.012, 75], // text on night and over photos
  'on-night-muted': [88, 0.035, 65], // secondary text there
  // The illustrated scenes: sky, sun, hills, trees and people. Drawn colour, mode-independent.
  'sky-morning-1': [80, 0.09, 55], 'sky-morning-2': [92, 0.06, 85],
  'sky-afternoon-1': [72, 0.1, 235], 'sky-afternoon-2': [92, 0.04, 220],
  'sky-evening-1': [52, 0.16, 25], 'sky-evening-2': [78, 0.13, 60],
  'sky-night-1': [18, 0.05, 265], 'sky-night-2': [30, 0.07, 300],
  sun: [90, 0.15, 90], 'sun-glow': [86, 0.12, 80],
  moon: [95, 0.03, 95],
  'hill-1': [62, 0.08, 150], 'hill-2': [52, 0.1, 152], 'hill-3': [43, 0.1, 155], // far to near
  rock: [64, 0.03, 40], // the granite domes of the hills
  leaf: [46, 0.12, 150], 'leaf-2': [58, 0.13, 135], trunk: [42, 0.06, 50],
  earth: [72, 0.08, 55], // laterite paths
  wall: [93, 0.035, 85], 'wall-2': [84, 0.05, 75], roof: [50, 0.15, 30], pane: [62, 0.06, 230],
  'skin-1': [42, 0.07, 45], 'skin-2': [52, 0.08, 50], 'skin-3': [34, 0.06, 40], hair: [20, 0.02, 40],
  cloth: [97, 0.01, 80], // white shirts and light folds
};

// Dark: night campus. Near-black maroon page, raised cards a step lighter, the gold carries
// selection and figures. Light text on dark reads heavier, so body weight drops one step.
const DARK = {
  paper: [15, 0.022, 18],
  'paper-2': [19, 0.026, 18],
  'paper-3': [22.5, 0.03, 18],
  ink: [95, 0.01, 60],
  'ink-2': [87, 0.014, 40],
  muted: [75, 0.018, 30],
  rule: [31, 0.024, 18],
  maroon: [34, 0.1, 18],
  'maroon-2': [40, 0.105, 18],
  'action-edge': [87, 0.014, 40],
  link: [84, 0.135, 82], // gold: maroon text would vanish on the dark page
  'on-maroon': [97.5, 0.012, 75],
  gold: [84, 0.14, 82],
  'gold-2': [78, 0.14, 78],
  'on-gold': [20, 0.03, 18],
  'gold-ink': [84, 0.14, 82],
  accent: [84, 0.14, 82],
  focus: [84, 0.14, 82],
  'focus-on-dark': [84, 0.14, 82],
  jade: [74, 0.12, 165],
  sky: [74, 0.1, 240],
  coral: [74, 0.13, 40],
  'jade-wash': [26, 0.04, 165],
  'sky-wash': [26, 0.04, 245],
  'coral-wash': [27, 0.05, 40],
  'maroon-wash': [27, 0.05, 18],
  'gold-wash': [28, 0.05, 80],
  error: [74, 0.13, 28],
  'error-wash': [25, 0.05, 25],
  warning: [80, 0.11, 70],
  'warning-wash': [25, 0.035, 60],
  success: [76, 0.11, 150],
  'success-wash': [24, 0.035, 150],
  'offline-band': [34, 0.1, 18],
  'on-offline-band': [97.5, 0.012, 75],
  scrim: [6, 0.01, 18],
};
// The night surfaces and the scene palette do not change with the mode.
const SHARED = Object.keys(LIGHT).filter((k) => !(k in DARK));
for (const k of SHARED) DARK[k] = LIGHT[k];

// Pairs whose contrast must hold, in both modes: [foreground, background, minimum, what].
const PAIRS = [
  ['ink', 'paper', 4.5, 'body text'],
  ['ink', 'paper-2', 4.5, 'body text on wells'],
  ['ink', 'paper-3', 4.5, 'text on cards and fields'],
  ['ink-2', 'paper', 4.5, 'secondary headings'],
  ['muted', 'paper', 4.5, 'meta text'],
  ['muted', 'paper-2', 4.5, 'meta text on wells'],
  ['muted', 'paper-3', 4.5, 'meta text on cards'],
  ['on-maroon', 'maroon', 4.5, 'primary button label'],
  ['on-maroon', 'maroon-2', 4.5, 'pressed primary button label'],
  ['on-gold', 'gold', 4.5, 'verified seal, sticker figures, the active tab'],
  ['on-gold', 'gold-2', 4.5, 'pressed gold'],
  ['focus', 'paper', 3, 'focus ring on the page'],
  ['focus', 'paper-3', 3, 'focus ring on cards'],
  ['focus-on-dark', 'night', 3, 'focus ring on night surfaces'],
  ['error', 'paper', 4.5, 'error text'],
  ['error', 'error-wash', 4.5, 'error text in an error box'],
  ['warning', 'paper', 4.5, 'outdated text'],
  ['warning', 'warning-wash', 4.5, 'outdated text in its badge'],
  ['success', 'paper', 4.5, 'success text'],
  ['success', 'success-wash', 4.5, 'success text in its box'],
  ['on-offline-band', 'offline-band', 4.5, 'offline banner text'],
  ['action-edge', 'paper', 3, 'outline button and chip edge (non-text)'],
  ['link', 'paper', 4.5, 'links, quiet buttons'],
  ['link', 'paper-2', 4.5, 'links on wells'],
  ['link', 'paper-3', 4.5, 'links on cards'],
  ['ink', 'maroon-wash', 4.5, 'text on maroon chips'],
  ['ink', 'gold-wash', 4.5, 'text on gold chips'],
  ['ink', 'jade-wash', 4.5, 'text on school chips'],
  ['ink', 'sky-wash', 4.5, 'text on department chips'],
  ['ink', 'coral-wash', 4.5, 'text on SUG chips'],
  ['jade', 'paper-3', 3, 'chart series and icons on cards (non-text)'],
  ['sky', 'paper-3', 3, 'chart series and icons on cards (non-text)'],
  ['coral', 'paper-3', 3, 'chart series and icons on cards (non-text)'],
  ['accent', 'paper', 3, 'gold icon detail on the page (non-text)'],
  ['accent', 'paper-3', 3, 'gold icon detail on cards (non-text)'],
  ['on-night', 'night', 4.5, 'text on the tab bar and night panels'],
  ['on-night-muted', 'night', 4.5, 'secondary text on night'],
  ['on-night', 'night-2', 4.5, 'text on raised night'],
  ['gold', 'night', 4.5, 'gold text and the active ring on night'],
];
const LIGHT_ONLY = [
  ['gold-ink', 'paper', 3, 'gold text on paper (large text 24px+ or icons only)'],
  ['maroon', 'paper', 4.5, 'maroon text and links on the page'],
];
const DARK_ONLY = [['gold', 'paper', 4.5, 'gold text on the dark page']];

// Text over photographs. A photo can be any colour, so each pair is measured against the worst
// pixel: a pure white one under light text, a pure black one under dark text. The overlay sits
// between them at the alpha given. [foreground, overlay, alpha, worst pixel, minimum, what]
const OVER_PHOTO = [
  ['on-night', 'night', 0.84, 'white', 4.5, 'hero title and text over the scrim'],
  ['on-night-muted', 'night', 0.84, 'white', 4.5, 'hero secondary text over the scrim'],
  ['on-night', 'tint-morning', 0.84, 'white', 4.5, 'hero text, morning scrim'],
  ['on-night', 'tint-afternoon', 0.84, 'white', 4.5, 'hero text, afternoon scrim'],
  ['on-night', 'tint-evening', 0.84, 'white', 4.5, 'hero text, evening scrim'],
  ['on-night', 'tint-night', 0.84, 'white', 4.5, 'hero text, night scrim'],
  ['on-night-muted', 'tint-morning', 0.84, 'white', 4.5, 'hero secondary text, morning scrim'],
  ['on-night-muted', 'tint-afternoon', 0.84, 'white', 4.5, 'hero secondary text, afternoon scrim'],
  ['on-night-muted', 'tint-evening', 0.84, 'white', 4.5, 'hero secondary text, evening scrim'],
  ['on-night-muted', 'tint-night', 0.84, 'white', 4.5, 'hero secondary text, night scrim'],
  ['on-night', 'night', 0.72, 'white', 4.5, 'labels on dark glass buttons over a photo (the top bar)'],
  ['gold', 'night', 0.72, 'white', 3, 'gold icons on dark glass over a photo (non-text)'],
  ['ink', 'paper-3', 0.9, 'black', 4.5, 'text on light glass cards over a photo'],
  ['muted', 'paper-3', 0.9, 'black', 4.5, 'meta text on light glass cards over a photo'],
];
const OVER_PHOTO_DARK = [
  ['ink', 'paper-3', 0.9, 'white', 4.5, 'text on dark glass cards over a photo'],
  ['muted', 'paper-3', 0.9, 'white', 4.5, 'meta text on dark glass cards over a photo'],
];

// OKLCH -> sRGB (Björn Ottosson's matrices), then WCAG 2 relative luminance.
function oklchToLinearSrgb([L, C, h]) {
  const l = L / 100;
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const [l3, m3, s3] = [l_ ** 3, m_ ** 3, s_ ** 3];
  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ].map((v) => Math.min(1, Math.max(0, v)));
}
const toHex = (lch) =>
  '#' +
  oklchToLinearSrgb(lch)
    .map((v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055))
    .map((v) => Math.round(v * 255).toString(16).padStart(2, '0'))
    .join('');
const luminance = (lch) => {
  const [r, g, b] = oklchToLinearSrgb(lch);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const oklch = ([L, C, H]) => `oklch(${L}% ${C} ${H})`;
// Alpha compositing happens on gamma-encoded sRGB, as browsers do it. Returns a luminance.
const gamma = (lch) => oklchToLinearSrgb(lch).map((v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055));
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function composite(overlay, alpha, pixel) {
  const base = pixel === 'white' ? [1, 1, 1] : [0, 0, 0];
  const [r, g, b] = gamma(overlay).map((c, i) => lin(alpha * c + (1 - alpha) * base[i]));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ---------------------------------------------------------------- everything that is not colour
// Two open-licensed faces (SIL OFL 1.1), subset to Latin and served from docs/design/fonts/:
// Bricolage Grotesque at 800 for display (a flyer's voice), Atkinson Hyperlegible Next 400 to 700
// for everything else (made for low-vision readers). font-display: swap, so text shows at once in
// the fallback stack and the faces arrive when they load.
const FALLBACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif';
const FONT_BODY = `"Atkinson Hyperlegible Next", ${FALLBACK}`;
const FONT_DISPLAY = `"Bricolage Grotesque", ${FALLBACK}`;
const FONTS = [
  ['Bricolage Grotesque', 'fonts/bricolage-grotesque-800.woff2', '800'],
  ['Atkinson Hyperlegible Next', 'fonts/atkinson-hyperlegible-next.woff2', '400 700'],
];
const SCALE = {
  // A fixed rem scale, ratio 1.2 (app screens). The display face takes 2xl and up.
  'text-sm': '0.875rem', // 14px: meta, hints, badges. Never below this.
  'text-md': '1rem', // 16px: body, controls
  'text-lg': '1.2rem', // 19.2px: item titles
  'text-xl': '1.44rem', // 23px: section heads (h2)
  'text-2xl': '1.728rem', // 27.6px: card display titles
  'text-3xl': '2.074rem', // 33.2px: screen titles on detail screens
  'text-4xl': '2.488rem', // 39.8px: hero titles, the next-class time
  'text-5xl': '2.986rem', // 47.8px: Welcome and You're set only
};
const LEADING = { 'leading-tight': '1.05', 'leading-snug': '1.3', 'leading-body': '1.55' };
// Three weights in running use: body 400, strong 700 (titles, labels, buttons), display 800.
const WEIGHT = { 'weight-body': '400', 'weight-strong': '700', 'weight-display': '800' };
const SPACE = {
  'space-3xs': '2px', 'space-2xs': '4px', 'space-xs': '8px', 'space-sm': '12px', 'space-md': '16px',
  'space-lg': '24px', 'space-xl': '32px', 'space-2xl': '48px', 'space-3xl': '64px',
};
const SIZE = {
  'hit': '44px', // every touch target, at least
  'control-h': '48px', // buttons, inputs, selects
  'topbar-h': '64px',
  'tabbar-h': '68px', // the floating pill tab bar
  'icon-sm': '16px', 'icon-md': '20px', 'icon-lg': '24px',
  'measure': '65ch',
  'container': '720px',
  'container-wide': '1040px',
  'gutter': '16px',
  'hero-h': '440px', // Home's photo hero on a phone; detail heroes are 300px
  'sticker': '5.5rem', // the round sticker that holds the number that matters (grows with the text)
  'ring': '6px', // the stroke of every progress ring
  'rule-hair': '1px', 'rule-bar': '2px',
};
// Pills for controls and chips; cards and photos take the card radius.
const RADIUS = { 'radius-field': '14px', 'radius-card': '24px', 'radius-sheet': '32px', 'radius-pill': '999px' };
const GLASS = { 'glass-alpha': '90%', 'glass-dark-alpha': '72%', 'glass-blur': '18px', 'scrim-alpha': '84%' };
const SHADOW_LIGHT = {
  'shadow-1': '0 1px 2px oklch(20% 0.04 18 / 0.08), 0 6px 16px -8px oklch(20% 0.04 18 / 0.18)', // cards
  'shadow-2': '0 2px 4px oklch(20% 0.05 18 / 0.08), 0 18px 40px -16px oklch(20% 0.06 18 / 0.38)', // glass over photos, the tab bar
  'shadow-gold': '0 8px 20px -8px oklch(18% 0.05 18 / 0.45)', // the gold sticker and the active tab: neutral, offset, never a glow
};
const SHADOW_DARK = {
  'shadow-1': 'inset 0 0 0 1px oklch(30% 0.03 18)',
  'shadow-2': 'inset 0 0 0 1px oklch(34% 0.03 18), 0 18px 40px -16px oklch(2% 0.01 18 / 0.8)',
  'shadow-gold': '0 8px 20px -8px oklch(2% 0.01 18 / 0.7)',
};
const MOTION = {
  'dur-micro': '120ms', // colour and press feedback
  'dur-short': '220ms', // disclosure, tabs, chips
  'dur-long': '480ms', // page transitions, the stamp, a ring filling
  'dur-focal': '900ms', // the one authored entrance per screen
  'dur-ambient': '48s', // clouds drifting, the hero's slow light (on screen only)
  'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)', // arrivals
  'ease-in': 'cubic-bezier(0.7, 0, 0.84, 0)', // exits, at 65% of the entrance
  'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)', // toggles
  'ease-pop': 'cubic-bezier(0.34, 1.36, 0.64, 1)', // stickers and the seal landing: one small overshoot
};
const Z = { 'z-sticky': '200', 'z-nav': '300', 'z-banner': '350', 'z-dialog': '400' };

// ---------------------------------------------------------------- measure and write
let failed = 0;
function measure(palette, pairs) {
  return pairs.map(([fg, bg, min, what]) => {
    const r = ratio(palette[fg], palette[bg]);
    const pass = r >= min;
    if (!pass) failed += 1;
    return { fg, bg, ratio: Math.round(r * 100) / 100, min, pass, what };
  });
}
function measureOver(palette, rows) {
  return rows.map(([fg, overlay, alpha, pixel, min, what]) => {
    const [x, y] = [luminance(palette[fg]), composite(palette[overlay], alpha, pixel)].sort((p, q) => q - p);
    const r = (x + 0.05) / (y + 0.05);
    const pass = r >= min;
    if (!pass) failed += 1;
    return { fg, bg: `${overlay} at ${Math.round(alpha * 100)}% over a ${pixel} pixel`, ratio: Math.round(r * 100) / 100, min, pass, what };
  });
}
const lightPairs = [...measure(LIGHT, [...PAIRS, ...LIGHT_ONLY]), ...measureOver(LIGHT, OVER_PHOTO)];
const darkPairs = [...measure(DARK, [...PAIRS, ...DARK_ONLY]), ...measureOver(DARK, [...OVER_PHOTO.filter((p) => p[3] === 'white'), ...OVER_PHOTO_DARK])];

const block = (obj, prefix = '') =>
  Object.entries(obj)
    .map(([k, v]) => `  --${prefix}${k}: ${v};`)
    .join('\n');
const colours = (pal, keys = Object.keys(pal)) =>
  keys.map((k) => `  --color-${k}: ${oklch(pal[k])}; /* ${toHex(pal[k])} */`).join('\n');
const MODAL = Object.keys(DARK).filter((k) => !SHARED.includes(k));
const pairLines = (pairs) =>
  pairs.map((p) => ` *   ${p.fg} on ${p.bg}: ${p.ratio.toFixed(2)}:1 (needs ${p.min}) ${p.pass ? 'pass' : 'FAIL'}, ${p.what}`).join('\n');
const faces = FONTS.map(([family, src, weight]) =>
  `@font-face {\n  font-family: "${family}";\n  src: url("${src}") format("woff2");\n  font-weight: ${weight};\n  font-style: normal;\n  font-display: swap;\n}`).join('\n');

const css = `/* Hallmark · shape: app screen · genre: playful · theme: custom · round 3
 * idea: "the flyer: every screen leads with a layered hero and one sticker that holds the number that matters"
 * paper: oklch(97.4% 0.008 40) · accent: maroon oklch(36% 0.12 18), gold oklch(83% 0.14 82), night oklch(19% 0.06 18) · display: Bricolage Grotesque 800 · body: Atkinson Hyperlegible Next 400/700
 * nav: floating pill tab bar on night glass · signature: the flyer hero, the sticker ring, the illustrated scenes with their students
 * states: loading, empty, error, offline, first sync, sync done, sync failed, busy (503), session ended (401), not an admin, visual pack (none, downloading, waiting for Wi-Fi, ready)
 * axes: light/grotesk-heavy/warm · posture: committed · modes: light+dark · lite: yes · contrast: pass · v3.0.0 */
/* Hallmark · pre-emit critique: P5 H5 E5 S4 R4 V5 · weakest: S and R, photos and glass must stay cheap; the visual pack, Lite and the budget carry it */

/* Sabi design tokens. Generated by docs/design/tools/tokens.mjs. Do not edit by hand: change the
 * values in that script and run it again. Colours are OKLCH with the sRGB hex beside each for tools
 * that need hex. Every contrast ratio below was computed by the script (WCAG 2 relative luminance).
 * Rows that say "over a white pixel" or "over a black pixel" are text on a photo: the overlay is
 * composited over the worst pixel a photo could have there.
 *
 * Light mode
${pairLines(lightPairs)}
 *
 * Dark mode
${pairLines(darkPairs)}
 */

${faces}

:root {
  color-scheme: light dark;
  --font-body: ${FONT_BODY};
  --font-display: ${FONT_DISPLAY};
${block(SCALE)}
${block(LEADING)}
${block(WEIGHT)}
${block(SPACE)}
${block(SIZE)}
${block(RADIUS)}
${block(GLASS)}
${block(MOTION)}
${block(Z)}
${colours(LIGHT)}
${block(SHADOW_LIGHT)}
}

/* Dark, chosen by the person (the prototype's theme switch, or the app's own setting). */
:root[data-mode="dark"] {
${colours(DARK, MODAL)}
${block(SHADOW_DARK)}
}

/* Dark, following the phone, unless the person picked light. */
@media (prefers-color-scheme: dark) {
  :root:not([data-mode="light"]) {
${colours(DARK, MODAL).replace(/^/gm, '  ')}
${block(SHADOW_DARK).replace(/^/gm, '  ')}
  }
}
`;

const json = {
  $description:
    'Sabi design tokens, round 3. Generated by docs/design/tools/tokens.mjs. Three layers: primitive values here, semantic roles in "role", component tokens in docs/design/README.md (hand-off).',
  font: {
    body: FONT_BODY, display: FONT_DISPLAY, numeric: 'tabular-nums',
    files: FONTS.map(([family, src, weight]) => ({ family, src, weight, display: 'swap', license: 'SIL Open Font License 1.1' })),
  },
  type: SCALE,
  leading: LEADING,
  weight: WEIGHT,
  space: SPACE,
  size: SIZE,
  radius: RADIUS,
  glass: GLASS,
  shadow: { light: SHADOW_LIGHT, dark: SHADOW_DARK },
  motion: MOTION,
  z: Z,
  color: {
    light: Object.fromEntries(Object.entries(LIGHT).map(([k, v]) => [k, { oklch: oklch(v), hex: toHex(v) }])),
    dark: Object.fromEntries(MODAL.map((k) => [k, { oklch: oklch(DARK[k]), hex: toHex(DARK[k]) }])),
    shared: SHARED,
  },
  role: {
    'text.default': 'ink', 'text.secondary': 'muted', 'text.heading-2': 'ink-2',
    'surface.page': 'paper', 'surface.well': 'paper-2', 'surface.card': 'paper-3', 'surface.glass': 'paper-3 at glass-alpha',
    'surface.night': 'night', 'surface.night-raised': 'night-2', 'text.on-night': 'on-night', 'text.on-night-secondary': 'on-night-muted',
    'hero.scrim': 'night (or tint-<daypart>) at scrim-alpha under the text', 'hero.text': 'on-night',
    'action.primary.background': 'maroon', 'action.primary.text': 'on-maroon', 'action.primary.pressed': 'maroon-2', 'action.secondary.edge': 'action-edge',
    'action.gold.background': 'gold', 'action.gold.text': 'on-gold',
    'selection.background': 'gold', 'selection.text': 'on-gold', 'tab.active': 'gold',
    'verified.background': 'gold', 'verified.text': 'on-gold',
    'outdated.text': 'warning', 'outdated.background': 'warning-wash',
    'unverified.text': 'muted', 'unverified.border': 'muted',
    'error.text': 'error', 'error.background': 'error-wash',
    'success.text': 'success', 'success.background': 'success-wash',
    'focus.ring': 'focus', 'focus.ring-on-dark': 'focus-on-dark',
    'offline.background': 'offline-band', 'offline.text': 'on-offline-band',
    'scope.university': 'maroon-wash', 'scope.sug': 'coral-wash', 'scope.school': 'jade-wash', 'scope.department': 'sky-wash',
    'chart.series': ['maroon', 'gold', 'jade', 'sky', 'coral'],
    'ring.track': 'rule', 'ring.fill': 'gold on night, maroon on paper',
    'icon.detail': 'accent', 'link': 'link', 'divider': 'rule', 'field.edge': 'muted',
  },
  contrast: { light: lightPairs, dark: darkPairs },
};

writeFileSync(join(OUT, 'tokens.css'), css);
writeFileSync(join(OUT, 'tokens.json'), JSON.stringify(json, null, 2) + '\n');
for (const [mode, pairs] of [['light', lightPairs], ['dark', darkPairs]]) {
  for (const p of pairs) console.log(`${mode.padEnd(5)} ${p.pass ? 'pass' : 'FAIL'} ${p.ratio.toFixed(2).padStart(5)} ${p.fg} on ${p.bg}`);
}
console.log(failed ? `${failed} pair(s) under the minimum` : 'all pairs pass');
process.exit(failed ? 1 : 0);
