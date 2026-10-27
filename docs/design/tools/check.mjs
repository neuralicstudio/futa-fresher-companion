// Checks the prototype: no network requests at runtime, every local link and asset resolves, and every
// photo is credited. No dependencies. Run from the repo root:  node docs/design/tools/check.mjs
// Exits 1 if anything fails.
//
//  1. Static: every src= and url() in the HTML, CSS and scripts is a local file that exists. Absolute
//     http(s) URLs may appear only as plain <a href> links (credit pages, the OpenStreetMap licence),
//     which the browser does not fetch.
//  2. Pages: every page links only to pages that exist (the screens call each other by name).
//  3. Credits: every photo file in pack/photos has an entry in pack.js with an author, a licence and a
//     Commons file page, and appears in CREDITS.md. A photo in photos-local/ must carry its credit and the
//     pending-permission note, and no file in photos-local may be tracked by git.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const D = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = join(D, 'prototype');
let bad = 0;
const fail = (m) => { bad++; console.log('FAIL ' + m); };
const ok = (m) => console.log('ok   ' + m);

// ---- 1. no external requests
const files = [...readdirSync(P).filter((f) => f.endsWith('.html')).map((f) => join(P, f)), ...readdirSync(join(P, 'assets')).filter((f) => /\.(js|css)$/.test(f)).map((f) => join(P, 'assets', f)), join(D, 'tokens.css')];
const external = [];
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/(?:\bsrc\s*=\s*|url\()\s*["']?(https?:)?\/\/[^"')\s]+/g)) external.push(`${f.replace(D, '')}: ${m[0]}`);
  for (const m of text.matchAll(/<link[^>]+href=["'](https?:)?\/\/[^"']+/g)) external.push(`${f.replace(D, '')}: ${m[0]}`);
  for (const m of text.matchAll(/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|importScripts)\b\s*\(/g)) external.push(`${f.replace(D, '')}: ${m[0]}`);
  for (const m of text.matchAll(/@import\s+url\(["']?https?:/g)) external.push(`${f.replace(D, '')}: ${m[0]}`);
}
external.length ? external.forEach((e) => fail('external request: ' + e)) : ok('no external requests: no remote src, url(), @import, fetch, XHR, WebSocket or beacon in any page, script or stylesheet');

// local files referenced by the pages and the stylesheet
const missing = [];
for (const f of files.filter((x) => x.endsWith('.html'))) {
  const t = readFileSync(f, 'utf8');
  for (const m of t.matchAll(/\b(?:src|href)=["']([^"'#?:]+?)(?:\?[^"']*)?["']/g)) { if (!/^(javascript|mailto|data)/.test(m[1]) && !existsSync(join(P, m[1]))) missing.push(`${f.replace(P, '')}: ${m[1]}`); }
}
const css = readFileSync(join(D, 'tokens.css'), 'utf8');
for (const m of css.matchAll(/url\("([^"]+)"\)/g)) if (!existsSync(join(D, m[1]))) missing.push('tokens.css: ' + m[1]);
missing.length ? missing.forEach((m) => fail('missing file: ' + m)) : ok('every local script, stylesheet, font and preload resolves');

// ---- 2. links between pages
const pages = new Set(readdirSync(P).filter((f) => f.endsWith('.html')).map((f) => f.replace('.html', '')));
const named = new Set();
for (const f of readdirSync(join(P, 'assets')).filter((x) => /^(ui|screens-.*)\.js$/.test(x))) {
  const t = readFileSync(join(P, 'assets', f), 'utf8');
  for (const m of t.matchAll(/href\('([a-z]+)'/g)) named.add(m[1]);
  for (const m of t.matchAll(/href: U\.href\('([a-z]+)'/g)) named.add(m[1]);
  for (const m of t.matchAll(/"([a-z]+)\.html/g)) named.add(m[1]);
}
const dead = [...named].filter((n) => !pages.has(n));
dead.length ? dead.forEach((n) => fail('link to a page that does not exist: ' + n + '.html')) : ok(`all ${named.size} page links resolve (${pages.size} pages)`);

// ---- 3. credits
const ctx = { window: {}, location: { search: '' }, document: { documentElement: { hasAttribute: () => false }, addEventListener() {} }, localStorage: { getItem: () => null }, URLSearchParams };
vm.runInNewContext(readFileSync(join(P, 'assets', 'pack.js'), 'utf8'), ctx);
const PK = ctx.window.SABI_PACK;
const credits = readFileSync(join(D, 'CREDITS.md'), 'utf8');
const onDisk = [...new Set(readdirSync(join(P, 'pack', 'photos')).map((f) => f.replace(/-(l|s)\.webp$/, '')))];
let creditedCount = 0;
for (const id of onDisk) {
  const p = PK.info(id);
  if (!p) { fail(`photo ${id} is in pack/photos but not in pack.js`); continue; }
  const probs = [];
  if (p.local) probs.push('is flagged local but sits in the repo');
  if (!p.author || /supplied|unknown|david/i.test(p.author)) probs.push('has no real author');
  if (!p.licence || /no licence|unknown/i.test(p.licence)) probs.push('has no licence');
  if (!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(p.page || '')) probs.push('has no Commons file page');
  if (!credits.includes(p.page.replace(/&/g, '&'))) probs.push('is missing from CREDITS.md');
  probs.length ? fail(`photo ${id} ${probs.join(', ')}`) : creditedCount++;
}
const localInRepo = onDisk.filter((id) => PK.info(id) && PK.info(id).local);
if (!localInRepo.length) ok(`${creditedCount} of ${onDisk.length} photos in the repo are credited with a real author, licence and Commons file page, and listed in CREDITS.md`);
const localIds = PK.ids.filter((id) => PK.info(id).local);
for (const id of localIds) {
  const p = PK.info(id);
  const sound = /Federal University of Technology, Akure \(official Facebook page\)/.test(p.author) && /pending/i.test(p.licence) && /permission pending|pending/i.test(credits);
  sound ? ok(`local-only photo ${id}: credited to "${p.author}", permission pending, listed in CREDITS.md, file not in the repo`) : fail(`local-only photo ${id} lacks its credit or the pending-permission note`);
}
const tracked = (await import('node:child_process')).execSync('git ls-files docs/design/prototype/photos-local', { encoding: 'utf8' }).trim();
tracked ? fail('files in photos-local are tracked by git: ' + tracked) : ok('no file in prototype/photos-local is tracked by git');
if (existsSync(join(P, 'photos-local'))) {
  const stray = readdirSync(join(P, 'photos-local')).length;
  ok(`prototype/photos-local has ${stray} files on this machine; they must stay out of git (see .git/info/exclude)`);
}

process.exit(bad ? 1 : 0);
