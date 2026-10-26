// Builds docs/design/tokens.css and docs/design/tokens.json from the values below, and computes
// every WCAG contrast ratio listed in PAIRS (so the ratios in the files are measured, not typed).
// No dependencies. Run from the repo root:  node docs/design/tools/tokens.mjs
// To refine the palette, change a value here and run it again. The script exits 1 if a pair
// falls under its minimum.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- colour (OKLCH: L%, C, H)
// One hue family: maroon at 18, gold at 82. Neutrals are tinted toward the maroon hue.
const LIGHT = {
  paper: [97.6, 0.006, 25], // the page
  'paper-2': [94.4, 0.01, 22], // wells, the second neutral (bottom nav, toolbars)
  'paper-3': [99.3, 0.003, 25], // raised: fields, plates, dialogs
  ink: [23, 0.035, 18], // text and icons
  'ink-2': [35, 0.03, 18], // secondary headings
  muted: [47.5, 0.022, 18], // meta text, field edges (needs 4.5:1 on paper-2)
  rule: [86, 0.012, 20], // hairline dividers only, never text
  maroon: [36, 0.118, 18], // the shell (top bar), primary action
  'maroon-2': [29.5, 0.1, 18], // pressed and hover on maroon
  'action-edge': [36, 0.118, 18], // the edge of outline buttons and chips
  link: [36, 0.118, 18], // links, back links, quiet buttons, small maroon icons (maroon as text)
  'on-maroon': [97, 0.012, 75], // text and icons on maroon
  gold: [83, 0.135, 82], // trim, verified seal, selection, figures on dark
  'gold-2': [76, 0.14, 78], // gold pressed, gold rule on light paper
  'on-gold': [23, 0.035, 18], // text on gold (same as ink)
  'gold-ink': [52, 0.11, 70], // gold as text on light paper (large text and icons only)
  focus: [36, 0.118, 18], // ring on paper surfaces
  'focus-on-maroon': [83, 0.135, 82], // ring on the maroon shell
  error: [47, 0.17, 28], // error text, border and icon
  'error-wash': [95, 0.025, 28], // error message background
  warning: [48, 0.11, 60], // "may be outdated" text and icon
  'warning-wash': [95.5, 0.03, 75],
  success: [44, 0.1, 150], // published, saved
  'success-wash': [95.5, 0.025, 150],
  'offline-band': [23, 0.035, 18], // the offline banner (ink band)
  'on-offline-band': [96, 0.01, 60],
  scrim: [18, 0.03, 18], // behind dialogs (used at 55% alpha)
  // The band: the maroon "sky" behind every screen title and the top bar. Mode-independent: it is
  // the brand surface, the same in light and dark. Four dayparts tint its lower edge (Home).
  'band-top': [21, 0.07, 18], // top of the band and the top bar (night maroon)
  'band-dawn': [41, 0.13, 32], // morning: the lower edge warms toward the gold
  'band-day': [36, 0.118, 18], // afternoon: the shell maroon
  'band-dusk': [30, 0.11, 8], // evening: a deeper, cooler maroon
  'band-night': [16, 0.045, 18], // night: almost the dark page
  'on-band': [97, 0.012, 75], // text on the band
  'on-band-muted': [87, 0.035, 60], // secondary text on the band
  'maroon-wash': [94.5, 0.022, 18], // tinted chips and the active tab capsule
  'gold-wash': [95.5, 0.045, 88], // "Today", "in 25 min" chips on paper
  accent: [55, 0.12, 70], // the gold detail in icons on light paper (non-text, 3:1)
};

// Dark: re-derived per Hallmark dark-mode.md (paper L 12-18, ink L 92-96, accents lighter and
// calmer, hue never moves). Light text on dark reads heavier, so body weight drops one step.
const DARK = {
  paper: [17, 0.02, 18],
  'paper-2': [20.5, 0.022, 18],
  'paper-3': [24, 0.024, 18],
  ink: [94.5, 0.01, 60],
  'ink-2': [86, 0.014, 40],
  muted: [74, 0.016, 30],
  rule: [33, 0.022, 18],
  maroon: [33, 0.095, 18],
  'maroon-2': [39, 0.1, 18],
  'action-edge': [86, 0.014, 40],
  link: [82, 0.125, 82], // gold: maroon text would vanish on the dark page
  'on-maroon': [97, 0.012, 75],
  gold: [82, 0.125, 82],
  'gold-2': [76, 0.13, 78],
  'on-gold': [20, 0.03, 18],
  'gold-ink': [82, 0.125, 82],
  focus: [82, 0.125, 82],
  'focus-on-maroon': [82, 0.125, 82],
  error: [74, 0.13, 28],
  'error-wash': [25, 0.05, 25],
  warning: [80, 0.11, 70],
  'warning-wash': [25, 0.035, 60],
  success: [76, 0.11, 150],
  'success-wash': [24, 0.035, 150],
  'offline-band': [33, 0.095, 18],
  'on-offline-band': [97, 0.012, 75],
  scrim: [8, 0.01, 18],
  // The band: the maroon "sky" behind every screen title and the top bar. Mode-independent: it is
  // the brand surface, the same in light and dark. Four dayparts tint its lower edge (Home).
  'band-top': [21, 0.07, 18], // top of the band and the top bar (night maroon)
  'band-dawn': [41, 0.13, 32], // morning: the lower edge warms toward the gold
  'band-day': [36, 0.118, 18], // afternoon: the shell maroon
  'band-dusk': [30, 0.11, 8], // evening: a deeper, cooler maroon
  'band-night': [16, 0.045, 18], // night: almost the dark page
  'on-band': [97, 0.012, 75], // text on the band
  'on-band-muted': [87, 0.035, 60], // secondary text on the band
  'maroon-wash': [27, 0.05, 18],
  'gold-wash': [28, 0.05, 80],
  accent: [82, 0.125, 82],
};

// Pairs whose contrast must hold, in both modes: [foreground, background, minimum, what].
const PAIRS = [
  ['ink', 'paper', 4.5, 'body text'],
  ['ink', 'paper-2', 4.5, 'body text on wells'],
  ['ink', 'paper-3', 4.5, 'text in fields and plates'],
  ['ink-2', 'paper', 4.5, 'secondary headings'],
  ['muted', 'paper', 4.5, 'meta text'],
  ['muted', 'paper-2', 4.5, 'meta text on wells'],
  ['muted', 'paper-3', 3, 'field edge (non-text, 3:1)'],
  ['on-maroon', 'maroon', 4.5, 'top bar text, primary button label'],
  ['on-maroon', 'maroon-2', 4.5, 'pressed primary button label'],
  ['gold', 'maroon', 3, 'gold trim and gold icons on the shell (non-text, 3:1)'],
  ['on-gold', 'gold', 4.5, 'verified seal text, selected chip text'],
  ['on-gold', 'gold-2', 4.5, 'pressed gold'],
  ['focus', 'paper', 3, 'focus ring on the page'],
  ['focus', 'paper-3', 3, 'focus ring on fields'],
  ['focus-on-maroon', 'maroon', 3, 'focus ring on the shell'],
  ['error', 'paper', 4.5, 'error text'],
  ['error', 'error-wash', 4.5, 'error text in an error box'],
  ['warning', 'paper', 4.5, 'outdated text'],
  ['warning', 'warning-wash', 4.5, 'outdated text in its badge'],
  ['success', 'paper', 4.5, 'success text'],
  ['success', 'success-wash', 4.5, 'success text in its box'],
  ['on-offline-band', 'offline-band', 4.5, 'offline banner text'],
  ['gold', 'offline-band', 3, 'gold icon on the offline banner (non-text)'],
  ['action-edge', 'paper', 3, 'outline button and chip edge (non-text)'],
  ['link', 'paper', 4.5, 'links, back links, quiet buttons'],
  ['link', 'paper-2', 4.5, 'links on wells (row tips, bottom tabs)'],
  ['on-band', 'band-top', 4.5, 'band text at the top'],
  ['on-band', 'band-dawn', 4.5, 'band text over the morning edge'],
  ['on-band', 'band-day', 4.5, 'band text over the afternoon edge'],
  ['on-band', 'band-dusk', 4.5, 'band text over the evening edge'],
  ['on-band', 'band-night', 4.5, 'band text over the night edge'],
  ['on-band-muted', 'band-top', 4.5, 'band secondary text'],
  ['on-band-muted', 'band-dawn', 4.5, 'band secondary text, morning'],
  ['on-band-muted', 'band-day', 4.5, 'band secondary text, afternoon'],
  ['on-band-muted', 'band-dusk', 4.5, 'band secondary text, evening'],
  ['gold', 'band-top', 4.5, 'gold text and the line on the band'],
  ['gold', 'band-dawn', 3, 'the gold line over the morning edge (non-text)'],
  ['ink', 'maroon-wash', 4.5, 'text on the active tab capsule'],
  ['link', 'maroon-wash', 4.5, 'active tab label'],
  ['ink', 'gold-wash', 4.5, 'text on gold chips'],
  ['accent', 'paper', 3, 'gold icon detail on the page (non-text)'],
  ['accent', 'paper-2', 3, 'gold icon detail on wells (non-text)'],
];
// Light only: gold as text sits on light paper only at large sizes.
const LIGHT_ONLY = [
  ['gold-ink', 'paper', 3, 'gold text on paper (large text 24px+ or icons only)'],
  ['maroon', 'paper', 4.5, 'maroon text and links on the page'],
];
const DARK_ONLY = [['gold', 'paper', 4.5, 'gold text on the dark page']];

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

// ---------------------------------------------------------------- everything that is not colour
const FONT_SYSTEM =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif';
const SCALE = {
  // A fixed rem scale, ratio 1.2 (app screens; Impeccable operate.md, Hallmark flow.md App screens).
  'text-sm': '0.875rem', // 14px: meta, hints, badges. Never below this.
  'text-md': '1rem', // 16px: body, controls
  'text-lg': '1.2rem', // 19.2px: item titles
  'text-xl': '1.44rem', // 23px: section heads (h2)
  'text-2xl': '1.728rem', // 27.6px: screen titles (h1)
  'text-3xl': '2.074rem', // 33.2px: band titles on top-level screens
  'text-4xl': '2.488rem', // 39.8px: the Home greeting and the ticket's time only
};
const LEADING = { 'leading-tight': '1.15', 'leading-snug': '1.3', 'leading-body': '1.55' };
const WEIGHT = { 'weight-body': '400', 'weight-medium': '500', 'weight-strong': '650', 'weight-display': '800', 'weight-black': '900' };
const SPACE = {
  'space-3xs': '2px', 'space-2xs': '4px', 'space-xs': '8px', 'space-sm': '12px', 'space-md': '16px',
  'space-lg': '24px', 'space-xl': '32px', 'space-2xl': '48px', 'space-3xl': '64px',
};
const SIZE = {
  'hit': '44px', // every touch target, at least
  'control-h': '48px', // buttons, inputs, selects
  'topbar-h': '56px',
  'bottomnav-h': '64px',
  'icon-sm': '16px', 'icon-md': '20px', 'icon-lg': '24px',
  'measure': '65ch', // running text
  'container': '720px', // content column (the app's current max width)
  'container-wide': '1040px', // tablet two-pane
  'gutter': '16px',
  'trim': '4px', // the gold line: under the top bar, the Home line, the first-sync line
  'station': '22px', // a station ring on the line
  'band-pad': '32px', // space under a band title
  'rule-hair': '1px', 'rule-bar': '2px',
};
const RADIUS = { 'radius-control': '10px', 'radius-plate': '14px', 'radius-card': '18px', 'radius-dialog': '18px', 'radius-pill': '999px' };
const SHADOW_LIGHT = {
  'shadow-float': '0 10px 28px -14px oklch(20% 0.04 18 / 0.45)', // dialogs, the prototype bar
  'shadow-lift': '0 12px 14px oklch(20% 0.06 18 / 0.22)', // the ticket over the band (used as a drop-shadow filter)
  'shadow-none': 'none',
};
const SHADOW_DARK = { 'shadow-float': 'inset 0 0 0 1px oklch(33% 0.022 18)', 'shadow-lift': '0 12px 14px oklch(4% 0.02 18 / 0.6)', 'shadow-none': 'none' };
const MOTION = {
  'dur-micro': '120ms', // colour and press feedback
  'dur-short': '220ms', // disclosure, tab indicator, banner in
  'dur-long': '420ms', // page transitions (View Transitions), the seal stamp
  'dur-focal': '760ms', // the one authored entrance per screen: the line drawing in
  'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)', // exponential ease-out: arrivals
  'ease-in': 'cubic-bezier(0.7, 0, 0.84, 0)', // exits, at 65% of the entrance
  'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)', // toggles
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
const lightPairs = measure(LIGHT, [...PAIRS, ...LIGHT_ONLY]);
const darkPairs = measure(DARK, [...PAIRS, ...DARK_ONLY]);

const block = (obj, prefix = '') =>
  Object.entries(obj)
    .map(([k, v]) => `  --${prefix}${k}: ${v};`)
    .join('\n');
const colours = (pal) =>
  Object.entries(pal)
    .map(([k, v]) => `  --color-${k}: ${oklch(v)}; /* ${toHex(v)} */`)
    .join('\n');
const pairLines = (pairs) =>
  pairs.map((p) => ` *   ${p.fg} on ${p.bg}: ${p.ratio.toFixed(2)}:1 (needs ${p.min}) ${p.pass ? 'pass' : 'FAIL'} · ${p.what}`).join('\n');

const css = `/* Hallmark · shape: app screen · genre: modern-minimal (inferred) · theme: custom · round 2
 * idea: "the gold line: Sabi draws the line from lost to found, and ties every fact to who said so"
 * paper: oklch(97.6% 0.006 25) · accent: maroon oklch(36% 0.118 18), gold oklch(83% 0.135 82), band oklch(21% 0.07 18) · display: system-ui 800/900 · body: system-ui 400
 * nav: night-maroon top bar over the gold line, four bottom tabs · signature: the line (logo, trim, Home stations, first sync, timetable now), the ticket, the source seal
 * states: loading, empty, error, offline (the line breaks), first sync, sync done, sync failed, busy (503), session ended (401), not an admin
 * axes: light/grotesk-heavy/warm · posture: committed · modes: light+dark · lite: yes · contrast: pass · v2.0.0 */
/* Hallmark · pre-emit critique: P5 H5 E4 S5 R4 V5 · weakest: E, motion and pictures must stay cheap; Lite mode and the data budget carry it */

/* Sabi design tokens. Generated by docs/design/tools/tokens.mjs. Do not edit by hand: change the
 * values in that script and run it again. Colours are OKLCH with the sRGB hex beside each for tools
 * that need hex. Every contrast ratio below was computed by the script (WCAG 2 relative luminance).
 *
 * Light mode
${pairLines(lightPairs)}
 *
 * Dark mode
${pairLines(darkPairs)}
 */

:root {
  color-scheme: light dark;
  --font-body: ${FONT_SYSTEM};
  --font-display: var(--font-body);
  --font-numeric: var(--font-body); /* with font-variant-numeric: tabular-nums */
${block(SCALE)}
${block(LEADING)}
${block(WEIGHT)}
${block(SPACE)}
${block(SIZE)}
${block(RADIUS)}
${block(MOTION)}
${block(Z)}
${colours(LIGHT)}
${block(SHADOW_LIGHT)}
}

/* Dark, chosen by the person (the prototype's theme switch, or the app's own setting). */
:root[data-mode="dark"] {
${colours(DARK)}
${block(SHADOW_DARK)}
  --weight-body: 380;
}

/* Dark, following the phone, unless the person picked light. */
@media (prefers-color-scheme: dark) {
  :root:not([data-mode="light"]) {
${colours(DARK).replace(/^/gm, '  ')}
${block(SHADOW_DARK).replace(/^/gm, '  ')}
    --weight-body: 380;
  }
}
`;

const json = {
  $description:
    'Sabi design tokens. Generated by docs/design/tools/tokens.mjs. Three layers: primitive values here, semantic roles in "role", component tokens in docs/design/README.md (hand-off).',
  font: { body: FONT_SYSTEM, display: 'var(--font-body) at weight 800', numeric: 'tabular-nums' },
  type: SCALE,
  leading: LEADING,
  weight: WEIGHT,
  space: SPACE,
  size: SIZE,
  radius: RADIUS,
  shadow: { light: SHADOW_LIGHT, dark: SHADOW_DARK },
  motion: MOTION,
  z: Z,
  color: {
    light: Object.fromEntries(Object.entries(LIGHT).map(([k, v]) => [k, { oklch: oklch(v), hex: toHex(v) }])),
    dark: Object.fromEntries(Object.entries(DARK).map(([k, v]) => [k, { oklch: oklch(v), hex: toHex(v) }])),
  },
  role: {
    'text.default': 'ink', 'text.secondary': 'muted', 'text.heading-2': 'ink-2',
    'surface.page': 'paper', 'surface.well': 'paper-2', 'surface.raised': 'paper-3',
    'shell.background': 'maroon', 'shell.text': 'on-maroon', 'shell.trim': 'gold',
    'action.primary.background': 'maroon', 'action.primary.text': 'on-maroon', 'action.primary.pressed': 'maroon-2', 'action.secondary.edge': 'action-edge',
    'selection.background': 'gold', 'selection.text': 'on-gold',
    'verified.background': 'gold', 'verified.text': 'on-gold',
    'outdated.text': 'warning', 'outdated.background': 'warning-wash',
    'unverified.text': 'muted', 'unverified.border': 'muted',
    'error.text': 'error', 'error.background': 'error-wash',
    'success.text': 'success', 'success.background': 'success-wash',
    'focus.ring': 'focus', 'focus.ring-on-shell': 'focus-on-maroon',
    'offline.background': 'offline-band', 'offline.text': 'on-offline-band', 'offline.icon': 'gold',
    'band.top': 'band-top', 'band.edge.morning': 'band-dawn', 'band.edge.afternoon': 'band-day', 'band.edge.evening': 'band-dusk', 'band.edge.night': 'band-night',
    'band.text': 'on-band', 'band.text-secondary': 'on-band-muted', 'line': 'gold', 'icon.detail': 'accent',
    'tab.active.background': 'maroon-wash', 'chip.gold.background': 'gold-wash',
    'link': 'link', 'divider': 'rule', 'field.edge': 'muted',
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
