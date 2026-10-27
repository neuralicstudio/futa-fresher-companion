// Bakes the campus map the prototypes draw: real OpenStreetMap data for the FUTA campus, simplified
// into a few SVG path strings, so the Map screen works offline with no tiles, no satellite imagery and
// no network at runtime. The data is © OpenStreetMap contributors, ODbL 1.0 (see CREDITS.md).
//
//   node docs/design/tools/bake-map.mjs                  fetch from Overpass and bake
//   node docs/design/tools/bake-map.mjs --from raw.json  bake from a saved Overpass response
//
// Output: docs/design/prototype/assets/campus-map.js (window.SABI_MAP). The real app's Maps owner
// replaces this with the same idea at production quality (vector tiles or a bundled extract).
// Nothing here is routing: there are no directions in v1.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'prototype', 'assets', 'campus-map.js');
const BBOX = [7.2925, 5.1285, 7.3135, 5.1500]; // south, west, north, east: the academic core and hostels
const UNIT = 0.5; // metres per drawing unit
const from = process.argv.includes('--from') ? process.argv[process.argv.indexOf('--from') + 1] : null;

async function load() {
  if (from) return JSON.parse(readFileSync(from, 'utf8'));
  const bb = BBOX.join(',');
  const q = `[out:json][timeout:90];(way["building"](${bb});way["highway"~"^(primary|secondary|tertiary|residential|unclassified|service|trunk|pedestrian)$"](${bb});` +
    `way["leisure"~"pitch|track|stadium|sports_centre|park"](${bb});way["landuse"~"grass|forest|recreation_ground"](${bb});way["natural"~"water|wood|scrub"](${bb});` +
    `nwr["name"](${bb}););out geom tags;`;
  for (let i = 0; i < 4; i++) {
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: new URLSearchParams({ data: q }), headers: { 'User-Agent': 'SabiDesignHandoff/1.0 (campus map bake)' } });
    if (res.ok) return res.json();
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error('Overpass did not answer');
}

const [S, W, N, E] = BBOX;
const lat0 = (S + N) / 2, lon0 = W;
const kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110574;
const proj = (p) => [((p.lon - lon0) * kx) / UNIT, ((N - p.lat) * ky) / UNIT];
const W_U = Math.round(((E - W) * kx) / UNIT), H_U = Math.round(((N - S) * ky) / UNIT);

function simplify(pts, eps) {
  const closed = pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
  if (!closed) return dp(pts, eps);
  // A closed ring cannot be simplified from first to last (they are the same point): split it at the
  // point farthest from the start and simplify the two halves.
  let far = 1, max = 0;
  pts.forEach((p, i) => { const d = Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]); if (d > max) { max = d; far = i; } });
  return dp(pts.slice(0, far + 1), eps).slice(0, -1).concat(dp(pts.slice(far), eps));
}
function dp(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let idx = 0, max = 0;
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / len;
    if (d > max) { max = d; idx = i; }
  }
  if (max <= eps) return [a, b];
  return dp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(dp(pts.slice(idx), eps));
}
const area = (r) => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + (p[0] * q[1] - q[0] * p[1]); }, 0)) / 2 * UNIT * UNIT;
const inside = (r) => r.some((p) => p[0] >= 0 && p[0] <= W_U && p[1] >= 0 && p[1] <= H_U);
function path(rings, close, eps) {
  let d = '';
  for (const ring of rings) {
    let pts = simplify(ring.map(proj), eps).map((p) => [Math.round(p[0]), Math.round(p[1])]);
    pts = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
    if (close && pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
    if (pts.length < (close ? 3 : 2) || !inside(pts)) continue;
    d += `M${pts[0][0]} ${pts[0][1]}l` + pts.slice(1).map((p, i) => `${p[0] - pts[i][0]} ${p[1] - pts[i][1]}`).join(' ') + (close ? 'z' : '');
  }
  return d;
}
function rings(e) {
  if (e.geometry) return [e.geometry];
  return (e.members || []).filter((m) => m.role === 'outer' && m.geometry).map((m) => m.geometry);
}
const center = (e) => {
  if (e.type === 'node') return { lat: e.lat, lon: e.lon };
  if (e.bounds) return { lat: (e.bounds.minlat + e.bounds.maxlat) / 2, lon: (e.bounds.minlon + e.bounds.maxlon) / 2 };
  const pts = (e.geometry ? [e.geometry] : (e.members || []).map((m) => m.geometry || [])).flat();
  return pts.length ? { lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length, lon: pts.reduce((s, p) => s + p.lon, 0) / pts.length } : null;
};

// The places the prototypes name. Each is matched by its exact OpenStreetMap name; the id is the
// stable key the app would use. cat: lecture, building, library, food, sports, health, hostel, gate.
const PLACES = [
  ['library', 'Albert Ilemobade Library', 'library'], ['seet-library', 'SEET Library', 'library'], ['saat-library', 'SAAT Library', 'library'],
  ['bukar-lt', 'Bukar Ibrahim Lecture Theatre', 'lecture'], ['etf-lt', 'E T F Lecture Theatre', 'lecture'], ['firstbank-lt', 'FirstBank Lecture Theatre', 'lecture'],
  ['cce-hall', 'Center for Continuing Education Lecture hall (CCE)', 'lecture'], ['two-in-one', '2 IN 1 Lecture Theatre', 'lecture'],
  ['computing', 'School of Computing (SOC)', 'building'], ['senate', 'New Senate Building', 'building'], ['great-hall', 'Great Hall', 'building'],
  ['multipurpose', 'FUTA MULTIPURPOSE HALL', 'building'], ['crc', 'CRC', 'building'],
  ['toppers', 'Toppers Restaurant', 'food'], ['iya-bola', 'IYA BOLA RESTAURANT', 'food'], ['all-for-god', 'All For God Restaurant', 'food'],
  ['main-pitch', 'Futa Main Pitch', 'sports'], ['akindeko-pitch', 'Akindeko Football Pitch', 'sports'], ['gym', 'FUTA GYM CENTER', 'sports'],
  ['health', 'Federal university of technogy Health Center', 'health'],
  ['abiola', 'ABIOLAHALL1', 'hostel'], ['akindeko', 'Akindeko Hall', 'hostel'], ['pg-hostel', 'Postgraduate Hostel', 'hostel'],
  ['north-gate', 'FUTA North Gate', 'gate'], ['west-gate', 'FUTA West Gate', 'gate'],
];

const data = await load();
const els = data.elements;
const L = { grass: [], wood: [], water: [], pitch: [], buildings: [], roads: [], lanes: [] };
for (const e of els) {
  const t = e.tags || {};
  const rs = rings(e);
  if (!rs.length) continue;
  if (t.building) { for (const r of rs) if (area(r.map(proj)) >= (t.name ? 20 : 45)) L.buildings.push(r); }
  else if (t.highway) { (['primary', 'secondary', 'tertiary', 'trunk'].includes(t.highway) ? L.roads : L.lanes).push(...rs); }
  else if (t.natural === 'water') L.water.push(...rs.filter((r) => area(r.map(proj)) > 150));
  else if (t.natural === 'wood' || t.natural === 'scrub' || t.landuse === 'forest') L.wood.push(...rs.filter((r) => area(r.map(proj)) > 400));
  else if (t.leisure === 'pitch' || t.leisure === 'track' || t.leisure === 'stadium') L.pitch.push(...rs);
  else if (t.landuse === 'grass' || t.leisure === 'park' || t.landuse === 'recreation_ground') L.grass.push(...rs.filter((r) => area(r.map(proj)) > 500));
}
const layers = {
  grass: path(L.grass, true, 2), wood: path(L.wood, true, 2.4), water: path(L.water, true, 2), pitch: path(L.pitch, true, 1.2),
  lanes: path(L.lanes, false, 1.6), roads: path(L.roads, false, 1.6), buildings: path(L.buildings, true, 1.1),
};

const places = [];
for (const [id, name, cat] of PLACES) {
  const e = els.find((x) => x.tags && x.tags.name === name && center(x)) || els.find((x) => x.tags && x.tags.name && x.tags.name.toLowerCase() === name.toLowerCase() && center(x));
  if (!e) { console.warn('not found in OSM data:', name); continue; }
  const [x, y] = proj(center(e));
  places.push({ id, name: e.tags.name, cat, x: Math.round(x), y: Math.round(y), osm: `${e.type}/${e.id}` });
}

const out = `// Generated by tools/bake-map.mjs from OpenStreetMap data. Do not edit by hand.
// Map data © OpenStreetMap contributors, Open Database Licence 1.0 (https://www.openstreetmap.org/copyright).
// Baked ${data.osm3s && data.osm3s.timestamp_osm_base ? data.osm3s.timestamp_osm_base.slice(0, 10) : 'from a saved response'}. Units are ${UNIT} m; the origin is the top left (${N}, ${W}).
// Place names are exactly as written in OpenStreetMap. Status of every place: not verified by FUTA.
window.SABI_MAP = ${JSON.stringify({ attribution: '© OpenStreetMap contributors', licence: 'ODbL 1.0', unit: UNIT, size: [W_U, H_U], bbox: BBOX, layers, places })};
`;
writeFileSync(OUT, out);
const gz = (await import('node:zlib')).gzipSync(Buffer.from(out), { level: 9 }).length;
console.log(`campus-map.js: ${(out.length / 1024).toFixed(1)} KB, ${(gz / 1024).toFixed(1)} KB gzipped; ${L.buildings.length} buildings, ${places.length} places`);
for (const k of Object.keys(layers)) console.log(' ', k.padEnd(10), (layers[k].length / 1024).toFixed(1), 'KB');
