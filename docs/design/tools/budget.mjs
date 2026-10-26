// Measures what Home costs to load, gzipped, and checks it against the data budget in
// docs/design/README.md ("Data budget"). No dependencies. Run from the repo root:
//   node docs/design/tools/budget.mjs
// Exits 1 if a line is over its budget.
//
// Two views:
//  1. The design layer the real app would ship for round 2's richness, with comments stripped as a
//     build would: the drawn art (logo, icons, contours, line pieces), the motion and Lite code, and
//     the stylesheet. These move into web/ as they are; the screen renderers and sample text do not.
//  2. The whole prototype Home page, every file it loads, against round 1's (measured from
//     git f720bed: 25,529 bytes gzipped), to show what round 2 added.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const D = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(D, f), 'utf8');
const gzs = (text) => gzipSync(Buffer.from(text), { level: 9 }).length;
const gz = (f) => gzs(read(f));
// What ships: the app's build strips comments (and minifies further, so these are upper bounds).
const strip = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\n\s*\n/g, '\n');
const shipped = (f) => gzs(strip(read(f)));
const headScript = read('prototype/home.html').match(/<script>([\s\S]*?)<\/script>/)[1];
const ROUND1_HOME = 25529;
const KB = 1024;

const art = shipped('prototype/assets/art.js');
const motion = shipped('prototype/assets/motion.js') + gzs(strip(headScript));
const css = shipped('prototype/assets/app.css');
const tokens = shipped('tokens.css');
const files = ['prototype/home.html', 'tokens.css', 'prototype/assets/app.css', 'prototype/assets/strings.js', 'prototype/assets/art.js', 'prototype/assets/motion.js', 'prototype/assets/app.js'];
const home = files.reduce((s, f) => s + gz(f), 0);

// [what, bytes, budget]
const lines = [
  ['Art: logo, icons, contours, line pieces (art.js)', art, 4 * KB],
  ['Motion and Lite (motion.js + the inline head script)', motion, 2.5 * KB],
  ['Stylesheet (app.css)', css, 10 * KB],
  ['Tokens (tokens.css)', tokens, 4 * KB],
  ['Fonts', 0, 0],
  ['Images on first load (photos load after, never in Lite)', 0, 0],
  ['Round 2 design layer, total, as shipped', art + motion + css + tokens, 20 * KB],
  ['Prototype Home, every file as it sits here (comments included)', home, 40 * KB],
  ['Prototype Home, added since round 1', home - ROUND1_HOME, 15 * KB],
];
let over = 0;
for (const [what, bytes, budget] of lines) {
  const ok = bytes <= budget;
  if (!ok) over++;
  console.log(`${ok ? 'ok  ' : 'OVER'} ${(bytes / KB).toFixed(1).padStart(5)} KB of ${(budget / KB).toFixed(1).padStart(4)} KB  ${what}`);
}
process.exit(over ? 1 : 0);
