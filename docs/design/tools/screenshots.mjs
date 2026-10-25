// Takes full-page screenshots of every prototype screen and state at 360, 390 and 768 px wide,
// with headless Chrome over the DevTools protocol, and re-compresses each PNG losslessly.
// No dependencies: Node 22+ (global WebSocket) and an installed Chrome or Edge.
//
//   node docs/design/tools/screenshots.mjs                 every screen, light mode
//   node docs/design/tools/screenshots.mjs --only home     only file names containing "home"
//   CHROME_PATH="C:/path/to/chrome.exe" node ...           a Chrome that is not in the usual place
//
// Files land in docs/design/screenshots/<screen>[-<state>][-dark]-<width>.png.
// The browser is started with a throwaway profile and closed at the end. Only file:// pages load.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROTO = join(HERE, '..', 'prototype');
const OUT = join(HERE, '..', 'screenshots');
const WIDTHS = [360, 390, 768];

// [file, states] in the same order as the prototype index. 'default' is the normal state.
const SCREENS = [
  ['home', ['default', 'offline', 'syncFailed']],
  ['first-sync', ['default']],
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
// Text at 200% (WCAG 1.4.4), at phone width only.
const ZOOM = [['home', 'default'], ['department', 'default'], ['timetable', 'default'], ['admin', 'default'], ['login', 'invalid']];
// A few screens again in dark mode, at phone width only.
const DARK = [['home', 'default'], ['academics', 'default'], ['timetable', 'default'], ['announcements', 'default'], ['admin', 'default'], ['components', 'default']];

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

// Lossless PNG re-compression: join the IDAT chunks, inflate, deflate at level 9, write one IDAT.
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
// Lossless: un-filter the rows, drop the alpha channel when every pixel is opaque (screenshots
// always are), re-filter each row with whichever PNG filter gives the smallest sum, deflate at 9.
function recompress(png) {
  const sig = png.subarray(0, 8);
  let ihdr, idat = [];
  for (let i = 8; i < png.length;) {
    const len = png.readUInt32BE(i);
    const type = png.toString('ascii', i + 4, i + 8);
    const data = png.subarray(i + 8, i + 8 + len);
    if (type === 'IHDR') ihdr = Buffer.from(data);
    if (type === 'IDAT') idat.push(data);
    i += 12 + len;
  }
  const w = ihdr.readUInt32BE(0), h = ihdr.readUInt32BE(4), depth = ihdr[8], ctype = ihdr[9], interlace = ihdr[12];
  if (depth !== 8 || interlace !== 0 || (ctype !== 6 && ctype !== 2)) return png; // not the shape Chrome writes
  const bpp = ctype === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = px.subarray(y * stride, (y + 1) * stride);
    const up = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? row[x - bpp] : 0, b = up ? up[x] : 0, c = up && x >= bpp ? up[x - bpp] : 0;
      row[x] = (src[x] + [0, a, b, (a + b) >> 1, paeth(a, b, c)][f]) & 255;
    }
  }
  let opaque = bpp === 4;
  if (opaque) for (let i = 3; i < px.length; i += 4) if (px[i] !== 255) { opaque = false; break; }
  const ob = opaque ? 3 : bpp;
  const os = w * ob;
  const out = Buffer.alloc(h * (os + 1));
  let cur = Buffer.alloc(os), prev = Buffer.alloc(os);
  const cand = [0, 1, 2, 3, 4].map(() => Buffer.alloc(os));
  for (let y = 0; y < h; y++) {
    for (let x = 0, k = 0; x < w; x++) for (let c = 0; c < ob; c++) cur[k++] = px[y * stride + x * bpp + c];
    let best = 0, bestSum = Infinity;
    for (let f = 0; f < 5; f++) {
      const o = cand[f];
      let sum = 0;
      for (let x = 0; x < os; x++) {
        const a = x >= ob ? cur[x - ob] : 0, b = y ? prev[x] : 0, c = y && x >= ob ? prev[x - ob] : 0;
        const v = (cur[x] - [0, a, b, (a + b) >> 1, paeth(a, b, c)][f]) & 255;
        o[x] = v; sum += v < 128 ? v : 256 - v;
      }
      if (sum < bestSum) { bestSum = sum; best = f; }
    }
    out[y * (os + 1)] = best;
    cand[best].copy(out, y * (os + 1) + 1);
    [cur, prev] = [prev, cur];
  }
  const head = Buffer.from(ihdr); head[9] = opaque ? 2 : ctype;
  return Buffer.concat([sig, chunk('IHDR', head), chunk('IDAT', deflateSync(out, { level: 9, memLevel: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

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
await send('Page.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

async function shoot(screen, state, width, dark, zoom) {
  const name = `${screen}${state === 'default' ? '' : '-' + state}${dark ? '-dark' : ''}${zoom ? '-text200' : ''}-${width}.png`;
  if (only && !name.includes(only)) return null;
  await send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: width < 600 });
  const q = new URLSearchParams({ proto: '0', state, theme: dark ? 'dark' : 'light' });
  if (zoom) q.set('text', '200');
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
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width, height: h, scale: 1 } });
  const raw = Buffer.from(shot.result.data, 'base64');
  const small = recompress(raw);
  writeFileSync(join(OUT, name), small.length < raw.length ? small : raw);
  return [name, raw.length, Math.min(small.length, raw.length)];
}

let count = 0, before = 0, after = 0;
try {
  for (const [screen, states] of SCREENS)
    for (const state of states)
      for (const w of WIDTHS) {
        const r = await shoot(screen, state, w, false);
        if (r) { count++; before += r[1]; after += r[2]; }
      }
  for (const [screen, state] of DARK) {
    const r = await shoot(screen, state, 390, true);
    if (r) { count++; before += r[1]; after += r[2]; }
  }
  for (const [screen, state] of ZOOM) {
    const r = await shoot(screen, state, 390, false, true);
    if (r) { count++; before += r[1]; after += r[2]; }
  }
} finally {
  ws.close();
  chrome.kill();
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* Windows may hold the profile a moment */ }
}
console.log(`${count} screenshots in docs/design/screenshots (${Math.round(before / 1024)} KB raw, ${Math.round(after / 1024)} KB after lossless re-compression)`);
console.log(readdirSync(OUT).length + ' files in the folder');
