// Takes full-page screenshots of every prototype screen: each screen's normal state at 390 and 768 px
// wide, every other state at 390, and a few screens in dark, in Lite, without the campus photos, at
// other times of day and at 200% text. WebP at quality 72, with reduced motion on, so each shot shows
// the resting state. Any script error on a page stops the run.
//
// The committed screenshots never show David's local-only photos (prototype/photos-local/, not in the
// repo): they are taken with ?local=0, so those slots show their drawn scenes, as a fresh clone does.
// --private takes a small set with those photos into docs/design/screenshots-private/, which
// .git/info/exclude keeps out of git.
// No dependencies: Node 22+ (global WebSocket) and an installed Chrome or Edge.
//
//   node docs/design/tools/screenshots.mjs                 every screen, light mode
//   node docs/design/tools/screenshots.mjs --only home     only file names containing "home"
//   node docs/design/tools/screenshots.mjs --private       the local-photo set (not committed)
//   CHROME_PATH="C:/path/to/chrome.exe" node ...           a Chrome that is not in the usual place
//
// Files land in docs/design/screenshots/<screen>[-<state>][-dark|-lite|-<daypart>][-text200]-<width>.webp.
// The browser is started with a throwaway profile and closed at the end. Only file:// pages load.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROTO = join(HERE, '..', 'prototype');
const PRIVATE = process.argv.includes('--private');
const OUT = join(HERE, '..', PRIVATE ? 'screenshots-private' : 'screenshots');
const WIDTHS = [390, 768];
const SKIP_768 = new Set(['sync', 'states', 'components', 'index']);

// [file, states] in the same order as the prototype index. 'default' is the normal state.
const SCREENS = PRIVATE ? [['welcome', ['default']], ['home', ['default']], ['sync', ['default']]] : [
  ['welcome', ['default']],
  ['sync', ['default', 'done', 'failed']],
  ['home', ['default', 'offline', 'syncFailed', 'noDept', 'noNotice']],
  ['map', ['default', 'offline', 'searchEmpty']],
  ['place', ['default', 'noPhoto', 'notFound']],
  ['academics', ['default', 'loading', 'empty', 'error']],
  ['timetable', ['default', 'loading', 'empty', 'error', 'noDept']],
  ['notices', ['default', 'loading', 'empty', 'error']],
  ['notice', ['default', 'notFound']],
  ['register', ['default', 'invalid', 'taken', 'sending', 'busy']],
  ['login', ['default', 'invalid', 'wrong', 'sending', 'busy', 'offline']],
  ['settings', ['default', 'offline']],
  ['credits', ['default']],
  ['admin', ['default', 'signedOut', 'session']],
  ['publish', ['default', 'invalid', 'published', 'session']],
  ['mynotices', ['default', 'confirm', 'drafts', 'empty']],
  ['verify', ['default', 'detail', 'needSource', 'verified', 'empty', 'offline']],
  ['role', ['default']],
  ['states', ['default']],
  ['components', ['default']],
  ['index', ['default']],
];
// Looks, at phone width (dark only for now): lite, nopack (the photo pack not on the
// phone: drawings everywhere), waiting and downloading (the pack's states), text200 (WCAG 1.4.4).
const EXTRA = PRIVATE ? [] : [
  ...['welcome', 'home', 'map', 'academics', 'notices', 'sync'].map((s) => [s, 'default', 'lite']),
  ...['welcome', 'home', 'academics', 'notices', 'place'].map((s) => [s, 'default', 'nopack']),
  ['settings', 'default', 'waiting'], ['settings', 'default', 'downloading'], ['settings', 'default', 'lite'],
  ...[['home', 'default'], ['welcome', 'default'], ['academics', 'default'], ['timetable', 'default'], ['notices', 'default'], ['register', 'invalid'], ['publish', 'default'], ['settings', 'default']].map(([s, st]) => [s, st, 'text200']),
];

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const CHROMES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean);
const chromePath = CHROMES.find((p) => existsSync(p));
if (!chromePath) { console.error('No Chrome found. Set CHROME_PATH.'); process.exit(2); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), 'sabi-shots-'));
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });

let targets;
for (let i = 0; i < 60; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.find((t) => t.type === 'page')) break; } catch { /* starting */ }
  await sleep(250);
}
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const waiters = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method) waiters.filter((w) => w.method === msg.method).forEach((w) => w.resolve(msg));
};
const send = (method, params = {}) => new Promise((resolve) => { const mid = ++id; pending.set(mid, resolve); ws.send(JSON.stringify({ id: mid, method, params })); });
const once = (method) => new Promise((resolve) => { const w = { method, resolve: (m) => { waiters.splice(waiters.indexOf(w), 1); resolve(m); } }; waiters.push(w); });

mkdirSync(OUT, { recursive: true });
// A fresh full run replaces every earlier screenshot, so nothing stale stays in the repo.
if (!only) for (const f of readdirSync(OUT)) if (/\.(png|webp)$/.test(f)) unlinkSync(join(OUT, f));
await send('Page.enable');
await send('Runtime.enable');
const errors = [];
ws.addEventListener('message', (m) => {
  const msg = JSON.parse(m.data);
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
});
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

async function shoot(screen, state, width, look) {
  const name = `${screen}${state === 'default' ? '' : '-' + state}${look ? '-' + look : ''}-${width}.webp`;
  if (only && !name.includes(only)) return null;
  await send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: width < 600 });
  const q = new URLSearchParams({ proto: '0', state, lite: look === 'lite' ? '1' : '0', pack: look === 'nopack' ? 'none' : ['waiting', 'downloading'].includes(look) ? look : 'ready' });
  if (!PRIVATE) q.set('local', '0');
  if (look === 'text200') q.set('text', '200');
  const url = pathToFileURL(join(PROTO, `${screen}.html`)).href + '?' + q;
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;
  await sleep(150);
  // Grow the viewport to the page's height, so fixed bars (the bottom tabs) sit at the real bottom.
  const { result } = await send('Page.getLayoutMetrics');
  const h = Math.max(800, Math.ceil(result.cssContentSize.height));
  await send('Emulation.setDeviceMetricsOverride', { width, height: h, deviceScaleFactor: 1, mobile: width < 600 });
  // The page is now one tall viewport, so lazy photos load: wait for every one to settle.
  await send('Runtime.evaluate', { expression: 'new Promise((r) => { const t0 = Date.now(); (function poll() { if ([...document.images].every((i) => i.complete) || Date.now() - t0 > 5000) r(); else setTimeout(poll, 100); })(); })', awaitPromise: true });
  await sleep(300);
  const shot = await send('Page.captureScreenshot', { format: 'webp', quality: 72, clip: { x: 0, y: 0, width, height: h, scale: 1 } });
  const data = Buffer.from(shot.result.data, 'base64');
  writeFileSync(join(OUT, name), data);
  return [name, data.length];
}

let count = 0, bytes = 0;
try {
  for (const [screen, states] of SCREENS)
    for (const state of states)
      for (const w of state === 'default' && !SKIP_768.has(screen) ? WIDTHS : [390]) {
        const r = await shoot(screen, state, w, '');
        if (r) { count++; bytes += r[1]; }
      }
  for (const [screen, state, look] of EXTRA) {
    const r = await shoot(screen, state, 390, look);
    if (r) { count++; bytes += r[1]; }
  }
} finally {
  ws.close();
  chrome.kill();
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* Windows may hold the profile a moment */ }
}
console.log(`${count} screenshots in ${OUT}, ${Math.round(bytes / 1024)} KB`);
console.log(readdirSync(OUT).length + ' files in the folder');
if (errors.length) { console.error(['Script errors:', ...new Set(errors)].join('\n')); process.exit(1); }
