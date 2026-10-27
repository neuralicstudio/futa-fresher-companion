// Writes docs/design/COPY.md from prototype/assets/copy.js, so the copy document can never drift from the
// strings the prototypes actually show. Every string, by screen and key. Edit copy.js, then run:
//   node docs/design/tools/build-copy-doc.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const D = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { window: {} };
vm.runInNewContext(readFileSync(join(D, 'prototype/assets/copy.js'), 'utf8'), ctx);
const C = ctx.window.SABI_COPY;

const TITLES = {
  app: 'App (shared)', shell: 'Shell: tabs, navigation, common words', profile: 'Profile sheet (top right icon)', status: 'Verification status',
  welcome: 'Welcome', home: 'Home', map: 'Campus Map', place: 'Place detail', academics: 'Academics', timetable: 'Timetable', notices: 'Notices', notice: 'Notice detail',
  register: 'Register', login: 'Log in', sync: 'First-time sync', settings: 'Settings', credits: 'Photo credits',
  admin: 'Admin home', publish: 'Publish notice', myNotices: 'My notices', verify: 'Verify data', role: 'Your role',
  states: 'Empty, error and offline states', proto: 'Prototype only (not part of the app)',
};
const rows = [];
function walk(prefix, v) {
  if (Array.isArray(v)) v.forEach((x, i) => (typeof x === 'object' ? walk(`${prefix}.${i}`, x) : rows.push([prefix + '.' + i, x])));
  else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(prefix ? `${prefix}.${k}` : k, x));
  else rows.push([prefix, v]);
}
const esc = (s) => String(s).replace(/\|/g, '\\|');
let out = `# Sabi copy (Pidgin)

One file, every string, by screen and key. **This document is generated** from [prototype/assets/copy.js](prototype/assets/copy.js): edit that file, then run \`node docs/design/tools/build-copy-doc.mjs\`. In the real app the same keys become \`web/src/copy/pidgin.ts\`.

## The voice

- **Friendly and funny, facts exact.** The joke lives in the wrapper ("No class today. Rest small, king."), never in the fact. Dates, times, places, counts and statuses are never joked with.
- **A senior student who knows every shortcut.** Light Pidgin ("Oya", "no wahala", "abeg", "make we", "dey", "don", "go") that a fresher from any state can read. Where Pidgin could confuse, the plain English word is kept (Verified, Level, Semester, Department).
- **Notices are the admin's words.** A notice's title and body are exactly what an admin wrote; Sabi never rewrites them. Only the frame around a notice is Sabi's voice.
- **Honest labels.** "Verified" appears only on a record that an admin verified. Notices show their source ("From SUG"), never "Verified". Anything not checked says so ("Not verified yet", "Source: OpenStreetMap, not yet checked by FUTA").
- **One handwritten line per screen** (the hero's \`kicker\`, set in Yellowtail). Nowhere else.
- **It's Sabi's, not FUTA's.** The privacy policy is "Sabi's privacy policy". The footer says "Unofficial app, not affiliated with FUTA." It is "FUTA no go hard for you. We dey with you." as a friendly sign-off, not a claim of affiliation.
- **Mechanics.** Sentence case. No em or en dashes. No emoji. Placeholders are {braces}. Plurals are separate keys (\`department1\`, \`departments\`).

## Strings
`;
for (const [section, body] of Object.entries(C)) {
  rows.length = 0; walk(section, body);
  out += `\n### ${TITLES[section] || section}\n\n| Key | String |\n|---|---|\n` + rows.map(([k, v]) => `| \`${k}\` | ${esc(v)} |`).join('\n') + '\n';
}
const n = Object.values(C).reduce((s, b) => { rows.length = 0; walk('', b); return s + rows.length; }, 0);
out = out.replace('## Strings', `## Strings (${n})`);
writeFileSync(join(D, 'COPY.md'), out);
console.log(`COPY.md: ${n} strings in ${Object.keys(C).length} sections`);
