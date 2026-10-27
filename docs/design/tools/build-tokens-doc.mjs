// Writes docs/design/TOKENS.md from tokens.json, so the tokens document can never drift from the tokens.
//   node docs/design/tools/build-tokens-doc.mjs   (run tokens.mjs first)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const D = join(dirname(fileURLToPath(import.meta.url)), '..');
const J = JSON.parse(readFileSync(join(D, 'tokens.json'), 'utf8'));
const table = (head, rows) => `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n` + rows.map((r) => `| ${r.join(' | ')} |`).join('\n') + '\n';
const kv = (o) => Object.entries(o).map(([k, v]) => [`\`--${k}\``, `\`${v}\``]);

const dark = J.color.dark;
const ROLE = {
  bg: 'The page', 'bg-raised': 'Bands between sections, sheets', card: 'Every card', 'card-2': 'A field or row on a card', field: 'The big search field', tabbar: 'The floating tab bar',
  rule: 'Hairlines inside cards', outline: 'The crimson card outline (1.5px)', 'outline-strong': 'Focused or selected outline', text: 'Headings', 'text-2': 'Body text', muted: 'Meta text, placeholders',
  gold: 'The signature accent: active tab, primary button, current things', 'gold-2': 'Gold pressed', 'on-gold': 'Text on gold', maroon: 'Welcome start button, switch on', 'maroon-2': 'Maroon pressed', 'on-maroon': 'Text on maroon',
  green: 'Verified, success, done, School scope', 'on-green': 'Text on green', red: 'Danger text, errors', 'red-chip': 'SUG chip fill', 'on-red': 'Text on the SUG chip', indigo: 'Department scope', 'on-indigo': 'Text on indigo',
  amber: 'May be outdated', 'on-amber': 'Text on amber', 'error-fill': 'Error bar fill', 'success-fill': 'Success card fill',
  night: 'Hero bottom edge, light-mode tab bar family', scrim: 'The navy-black under hero text', 'on-photo': 'Text on photos', 'night-text': 'Text on night surfaces', 'night-muted': 'Secondary text on night surfaces', focus: 'Focus ring',
  'track-off': 'Switch off', 'thumb-off': 'Switch thumb off', 'strength-off': 'Password meter, empty', 'ring-track': 'Progress ring track',
};
const groups = [
  ['Surfaces', ['bg', 'bg-raised', 'card', 'card-2', 'field', 'tabbar', 'rule', 'outline', 'outline-strong']],
  ['Text', ['text', 'text-2', 'muted', 'on-photo', 'night-text', 'night-muted']],
  ['Brand', ['gold', 'gold-2', 'on-gold', 'maroon', 'maroon-2', 'on-maroon', 'night']],
  ['Status and scopes', ['green', 'on-green', 'red', 'red-chip', 'on-red', 'indigo', 'on-indigo', 'amber', 'on-amber', 'error-fill', 'success-fill']],
  ['Controls', ['focus', 'track-off', 'thumb-off', 'strength-off', 'ring-track', 'scrim']],
  ['Map pins', Object.keys(dark).filter((k) => k.startsWith('pin-'))],
  ['The dark branded map', Object.keys(dark).filter((k) => k.startsWith('map-'))],
  ['Drawn scenes (the photo fallbacks, same in both themes)', Object.keys(dark).filter((k) => k.startsWith('scene-'))],
];
let out = `# Tokens

Exact values. **Generated** from [tools/tokens.mjs](tools/tokens.mjs) into [tokens.css](tokens.css) and [tokens.json](tokens.json): change a value in the script and run \`node docs/design/tools/tokens.mjs\`, never in the outputs. Use the CSS variables as they are named. In \`web/\`, put them in \`:root\` and keep \`--color-*\` names.

**Where the colours come from.** The palette was **sampled from the approved mockups** (a script read the dominant colour of boxes on each screen, within 4 levels per channel; \`bg\` and \`card\` come from the page and card fills, \`gold\` from the buttons, \`green\`, \`red\` and \`indigo\` from the Verified, SUG and department chips). **Dark only for now**: the mockups show only dark, so a light theme is a later task. **${J.contrast.dark.length} contrast pairs pass** (the full list, with ratios, is at the top of tokens.css), including text over photos measured against the worst pixel.

Two values differ from what was sampled, on purpose: \`red-chip\` (the SUG chip) is the sampled red darkened until white text passes 4.5:1, and \`night-muted\` and \`muted\` are lightened for the same reason.

## Colour

`;
for (const [title, keys] of groups) {
  out += `### ${title}\n\n` + table(['Token', 'Value', 'Use'], keys.filter((k) => dark[k]).map((k) => [`\`--color-${k}\``, `\`${dark[k]}\``, ROLE[k] || ''])) + '\n';
}
out += `## Fonts

Two open-licensed families, served from [fonts/](fonts/) as woff2, subset to Latin plus the punctuation the copy uses, \`font-display: swap\` with a system fallback. **Total ${J.font.files.length} files, 25.3 KB** (limit 40 KB). Licences are beside the files.

` + table(['Family', 'File', 'Weight', 'Licence'], J.font.files.map((f) => [f.family, `\`${f.src}\``, f.weight, `${f.licence} (\`${f.licenceFile}\`)`])) + `
- Body: \`--font-body\`: ${'`' + J.font.body + '`'}
- Handwriting: \`--font-hand\`: ${'`' + J.font.hand + '`'}, **one line per screen**, only as the hero kicker.
- Numbers: \`font-variant-numeric: tabular-nums\` for times, counts and percentages.

## Type scale

` + table(['Token', 'Size', 'Used for'], [['`--text-xs`', J.type['text-xs'], 'Tab labels only'], ['`--text-sm`', J.type['text-sm'], 'Meta, hints, chips, placeholders'], ['`--text-md`', J.type['text-md'], 'Body, fields'], ['`--text-lg`', J.type['text-lg'], 'Card titles'], ['`--text-xl`', J.type['text-xl'], 'Section headings'], ['`--text-2xl`', J.type['text-2xl'], 'Big numbers (badge)'], ['`--text-3xl`', J.type['text-3xl'], 'Hero titles'], ['`--text-4xl`', J.type['text-4xl'], 'Welcome title'], ['`--hand-md`', J.type['hand-md'], 'Handwritten line (screens)'], ['`--hand-lg`', J.type['hand-lg'], 'Handwritten line (Home, Welcome)']]) +
  `\nWeights: ${Object.entries(J.weight).map(([k, v]) => `\`${k}\` ${v}`).join(', ')}. Line heights: ${Object.entries(J.leading).map(([k, v]) => `\`${k}\` ${v}`).join(', ')}. Sizes are in rem so 200% text scales everything.\n\n## Spacing, sizes and radii\n\n` +
  table(['Token', 'Value'], [...kv(J.space), ...kv(J.size), ...kv(J.radius)]) + `\n## Shadows and gradients\n\n` + table(['Token', 'Value'], [...kv(J.shadow), ...kv(J.gradient)]) +
  `\n- Shadows are offset and soft. The only glow is \`--shadow-ring\`, on the countdown badge (the mockups' one). \`--shadow-gold\` is a lit edge under gold buttons, not a halo.\n- Gradients are scrims and card fills only; **never on text**.\n\n## Motion\n\n` + table(['Token', 'Value'], kv(J.motion)) +
  `\n- Feedback 120ms, state 220ms, page and ring changes 480ms, one entrance per screen 800ms (once per session, on screen).\n- Loops (the skeleton, the map's "you are here" pulse) run only while on screen and pause when the page is hidden.\n- \`prefers-reduced-motion\` removes all movement and keeps the state. **Lite mode** removes every transition, blur and loop, the photos and the decoration.\n\n## Z-index\n\n` + table(['Token', 'Value'], kv(J.z)) + `\n## Semantic roles\n\n` + table(['Role', 'Token'], Object.entries(J.role).map(([k, v]) => [`\`${k}\``, Array.isArray(v) ? v.join(', ') : v]));
writeFileSync(join(D, 'TOKENS.md'), out);
console.log('TOKENS.md written');
