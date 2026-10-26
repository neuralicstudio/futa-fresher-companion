// Measures what Sabi's design costs to load and checks it against the data budget in
// docs/design/README.md ("Data budget"). No dependencies. Run from the repo root:
//   node docs/design/tools/budget.mjs
// Exits 1, and says OVER or FAIL on the line, if anything is over its budget.
//
// Three layers:
//  1. Core: what the app ships on first load for this design, with comments stripped as its build
//     would: tokens, the stylesheet, the drawn art (logo, icons, rings, scenes, students, the map),
//     motion and Lite, the photo-slot code, the inline head script, and both fonts. Zero photos.
//  2. The visual pack: every campus photo, downloaded after the first sync on a good connection
//     only, never in Lite. Counted from prototype/pack/photos/ (in the repo) and
//     prototype/photos-local/ (on David's machine only, when present).
//  3. The prototype's own harness (screen renderers and sample text), reported for reference: the
//     app has its own React code for this.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const D = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(D, f), 'utf8');
const gzs = (text) => gzipSync(Buffer.from(text), { level: 9 }).length;
const strip = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\n\s*\n/g, '\n');
const shipped = (f) => gzs(strip(read(f)));
const KB = 1024;
const MB = 1024 * 1024;
let over = 0;
const line = (ok, text) => { if (!ok) over++; console.log(`${ok ? 'ok  ' : 'OVER'} ${text}`); };
const kb = (b) => (b / KB).toFixed(1).padStart(6) + ' KB';

// ---------------------------------------------------------------- 1. core
const headScript = read('prototype/home.html').match(/<script>([\s\S]*?)<\/script>/)[1];
const fonts = readdirSync(join(D, 'fonts')).filter((f) => f.endsWith('.woff2'));
const fontBytes = fonts.reduce((s, f) => s + statSync(join(D, 'fonts', f)).size, 0);
const core = [
  ['Tokens (tokens.css)', shipped('tokens.css'), 4 * KB],
  ['Stylesheet (app.css)', shipped('prototype/assets/app.css'), 16 * KB],
  ['Art: logo, icons, rings, scenes, students, map (art.js)', shipped('prototype/assets/art.js'), 9 * KB],
  ['Motion and Lite (motion.js + the inline head script)', shipped('prototype/assets/motion.js') + gzs(strip(headScript)), 2.5 * KB],
  ['Photo slots and the pack switch (pack.js)', shipped('prototype/assets/pack.js'), 2.5 * KB],
  [`Fonts, woff2 (${fonts.join(', ')})`, fontBytes, 40 * KB],
];
console.log('Core layer: first load, gzipped');
for (const [what, bytes, budget] of core) line(bytes <= budget, `${kb(bytes)} of ${kb(budget)}  ${what}`);
const coreTotal = core.reduce((s, c) => s + c[1], 0);
line(coreTotal <= 60 * KB, `${kb(coreTotal)} of ${kb(60 * KB)}  Core layer, total`);

// Zero photos on first load: no image is referenced from the stylesheets or the pages, and the only
// code that adds a photo is pack.js show(), which needs the pack downloaded and Lite off.
const imageRefs = ['tokens.css', 'prototype/assets/app.css'].flatMap((f) => (read(f).match(/url\([^)]*\.(webp|avif|jpe?g|png)\)/g) || []));
const pageImgs = readdirSync(join(D, 'prototype')).filter((f) => f.endsWith('.html')).filter((f) => /<img\b/.test(read('prototype/' + f)));
const gated = /function show[\s\S]*?if \(!on\(\)\) return;/.test(read('prototype/assets/pack.js'));
line(!imageRefs.length && !pageImgs.length && gated, `${String(imageRefs.length + pageImgs.length).padStart(6)} photos on first load (pack.js adds them only when the pack is on the phone and Lite is off)`);
const licences = ['OFL-BricolageGrotesque.txt', 'OFL-AtkinsonHyperlegibleNext.txt'].filter((f) => existsSync(join(D, 'fonts', f)));
line(licences.length === 2, `${String(licences.length).padStart(6)} of 2 font licence files beside the fonts`);

// ---------------------------------------------------------------- 2. the visual pack
console.log('\nVisual pack: downloaded after the first sync, on a good connection, never in Lite');
function photosIn(dir) {
  const full = join(D, dir);
  return existsSync(full) ? readdirSync(full).filter((f) => !f.startsWith('.')).map((f) => ({ f: dir + '/' + f, bytes: statSync(join(full, f)).size, buf: readFileSync(join(full, f)) })) : [];
}
// A WebP is a RIFF file of chunks; EXIF and XMP chunks would carry camera and location data.
function webpChunks(buf) {
  const out = [];
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  for (let i = 12; i + 8 <= buf.length;) { const id = buf.toString('ascii', i, i + 4), n = buf.readUInt32LE(i + 4); out.push(id); i += 8 + n + (n % 2); }
  return out;
}
const open = photosIn('prototype/pack/photos');
const local = photosIn('prototype/photos-local');
let bad = 0;
for (const p of [...open, ...local]) {
  const chunks = webpChunks(p.buf);
  const problems = [];
  if (!chunks) problems.push('not WebP');
  else if (chunks.some((c) => c === 'EXIF' || c === 'XMP ')) problems.push('has EXIF/XMP metadata');
  if (p.bytes > 60 * KB) problems.push(`${(p.bytes / KB).toFixed(1)} KB, over 60 KB`);
  if (problems.length) { bad++; console.log(`FAIL ${p.f}: ${problems.join(', ')}`); }
}
const largest = [...open, ...local].reduce((m, p) => Math.max(m, p.bytes), 0);
line(!bad, `${String(open.length + local.length).padStart(6)} photo files, all WebP, no EXIF or XMP, largest ${(largest / KB).toFixed(1)} KB of 60 KB`);
const openBytes = open.reduce((s, p) => s + p.bytes, 0), localBytes = local.reduce((s, p) => s + p.bytes, 0);
console.log(`     ${kb(openBytes)}  open-licensed photos in the repo (${open.length} files)`);
console.log(`     ${kb(localBytes)}  local-only photos on this machine (${local.length} files${local.length ? '' : ': none here, the drawn scenes stand in'})`);
line(openBytes + localBytes <= 1.5 * MB, `${kb(openBytes + localBytes)} of ${kb(1.5 * MB)}  Visual pack, total`);

// ---------------------------------------------------------------- 3. the prototype harness, for reference
const harness = ['prototype/home.html', 'prototype/assets/strings.js', 'prototype/assets/app.js'].reduce((s, f) => s + gz(f), 0);
function gz(f) { return gzs(read(f)); }
console.log('\nFor reference (not shipped as is: the app renders these screens in React)');
console.log(`     ${kb(harness)}  prototype harness: the page, the screen renderers and the sample text`);
console.log(`     ${kb(coreTotal + harness)}  everything the prototype Home loads before photos`);

if (over) { console.error(`\n${over} line(s) OVER budget`); process.exit(1); }
console.log('\nAll within budget.');
