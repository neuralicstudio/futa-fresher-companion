// Takes full-page screenshots of every prototype screen: each screen's normal state at 360, 390 and
// 768 px wide, every other state at 390, and a few screens in dark, in Lite, at other times of day
// and at 200% text. WebP at quality 80 (about a fifth of the PNG size), with reduced motion on, so
// each shot shows the resting state. Any script error on a page stops the run.
// No dependencies: Node 22+ (global WebSocket) and an installed Chrome or Edge.
//
//   node docs/design/tools/screenshots.mjs                 every screen, light mode
//   node docs/design/tools/screenshots.mjs --only home     only file names containing "home"
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
const OUT = join(HERE, '..', 'screenshots');
const WIDTHS = [360, 390, 768];

// [file, states] in the same order as the prototype index. 'default' is the normal state.
const SCREENS = [
  ['home', ['default', 'offline', 'syncFailed', 'noDept']],
  ['first-sync', ['default', 'done']],
  ['map', ['default', 'offline', 'searchEmpty']],
  ['academics', ['default', 'loading', 'empty', 'error', 'offline']],
  ['department', ['default', 'loading', 'empty', 'error', 'notFound']],
  ['timetable', ['default', 'loading', 'empty', 'levelEmpty', 'error']],
  ['announcements', ['default', 'loading', 'empty', 'error', 'offline']],
  ['login', ['default', 'registered', 'invalid', 'sending', 'wrong', 'busy', 'offline']],
  ['register', ['default', 'invalid', 'busy']],
  ['admin', ['default', 'signedOut', 'notAdmin', 'session', 'loading', 'empty', 'error', 'confirm', 'published', 'invalid']],
  ['components', ['default']],
];
// The extra looks, at phone width only: [screen, state, look]. Looks: dark, lite, a daypart, text200 (WCAG 1.4.4).
const EXTRA = [
  ...['home', 'first-sync', 'academics', 'department', 'timetable', 'announcements', 'admin', 'components'].map((s) => [s, 'default', 'dark']),
  ...['home', 'first-sync', 'map', 'department', 'components'].map((s) => [s, 'default', 'lite']),
  ['home', 'default', 'afternoon'], ['home', 'default', 'evening'], ['home', 'default', 'night'], ['home', 'default', 'night-dark'],
  ...[['home', 'default'], ['department', 'default'], ['timetable', 'default'], ['admin', 'default'], ['login', 'invalid'], ['first-sync', 'default']].map(([s, st]) => [s, st, 'text200']),
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
  const dark = look && look.includes('dark');
  const q = new URLSearchParams({ proto: '0', state, theme: dark ? 'dark' : 'light', lite: look === 'lite' ? '1' : '0' });
  if (look === 'text200') q.set('text', '200');
  if (['afternoon', 'evening', 'night', 'night-dark'].includes(look)) q.set('daypart', look.replace('-dark', ''));
  const url = pathToFileURL(join(PROTO, `${screen}.html`)).href + '?' + q;
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;
  await sleep(150);
  // Grow the viewport to the page's height, so fixed bars (the bottom tabs) sit at the real bottom.
  const { result } = await send('Page.getLayoutMetrics');
  const h = Math.max(800, Math.ceil(result.cssContentSize.height));
  await send('Emulation.setDeviceMetricsOverride', { width, height: h, deviceScaleFactor: 1, mobile: width < 600 });
  await sleep(120);
  const shot = await send('Page.captureScreenshot', { format: 'webp', quality: 80, clip: { x: 0, y: 0, width, height: h, scale: 1 } });
  const data = Buffer.from(shot.result.data, 'base64');
  writeFileSync(join(OUT, name), data);
  return [name, data.length];
}

let count = 0, bytes = 0;
try {
  for (const [screen, states] of SCREENS)
    for (const state of states)
      for (const w of state === 'default' ? WIDTHS : [390]) {
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
console.log(`${count} screenshots in docs/design/screenshots, ${Math.round(bytes / 1024)} KB`);
console.log(readdirSync(OUT).length + ' files in the folder');
if (errors.length) { console.error(['Script errors:', ...new Set(errors)].join('\n')); process.exit(1); }
