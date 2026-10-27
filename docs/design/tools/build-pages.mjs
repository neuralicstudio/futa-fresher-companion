// Writes the prototype's HTML pages. Every page is the same shell: a head script that decides the theme
// and Lite mode before first paint, the stylesheet, and the scripts in the order they depend on each other.
//   node docs/design/tools/build-pages.mjs
import { readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'prototype');
const PAGES = ['welcome', 'home', 'map', 'place', 'academics', 'timetable', 'notices', 'notice', 'register', 'login', 'sync', 'settings', 'credits',
  'admin', 'publish', 'mynotices', 'verify', 'role', 'states', 'components', 'index'];
const NEEDS_MAP = new Set(['map', 'place', 'components']);

const head = (screen) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Sabi design prototype. Sample data only.">
<meta name="theme-color" content="#0a0309">
<title>Sabi prototype</title>
<script>
  /* Before the first paint: Lite mode (the app is dark only for now).
   * Lite turns on by itself when the phone asks to save data or is on 2G; the switch in Settings overrides it. */
  (function () {
    var d = document.documentElement, q = new URLSearchParams(location.search), l = q.get('lite'), p = null;
    try { p = localStorage.getItem('sabi-lite'); } catch (e) {}
    var c = navigator.connection || {};
    var saver = c.saveData || /2g/.test(c.effectiveType || '') || (window.matchMedia && matchMedia('(prefers-reduced-data: reduce)').matches);
    var why = l === '1' ? 'url' : l === '0' ? '' : p === 'on' ? 'setting' : p === 'off' ? '' : saver ? 'saver' : '';
    if (why) d.setAttribute('data-lite', why);
  })();
</script>
<link rel="preload" href="../fonts/poppins-600.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/app.css">
</head>
<body data-screen="${screen}">
<div id="app"><noscript><p>Turn on JavaScript to view this prototype. Its words come from assets/copy.js.</p></noscript></div>
<script src="assets/copy.js"></script>
<script src="assets/sample.js"></script>
<script src="assets/icons.js"></script>
<script src="assets/art.js"></script>
<script src="assets/scenes.js"></script>
<script src="assets/motion.js"></script>
<script src="assets/pack.js"></script>
${NEEDS_MAP.has(screen) ? '<script src="assets/campus-map.js"></script>\n<script src="assets/map.js"></script>\n' : ''}<script src="assets/ui.js"></script>
<script src="assets/screens-app.js"></script>
<script src="assets/screens-user.js"></script>
<script src="assets/screens-admin.js"></script>
<script src="assets/screens-sys.js"></script>
</body>
</html>
`;

for (const f of readdirSync(DIR)) if (f.endsWith('.html')) rmSync(join(DIR, f));
for (const p of PAGES) writeFileSync(join(DIR, p + '.html'), head(p));
console.log(`${PAGES.length} pages written to prototype/`);
