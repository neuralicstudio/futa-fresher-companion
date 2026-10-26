// Sabi's drawn language, as SVG strings: the logo, the icon set, progress rings, the illustrated
// scenes (sky by time of day, hills, trees, generic campus buildings, and four students) and the
// drawn campus map. Everything is code: no requests, no image bytes, and it is what Lite mode and
// a phone without the visual pack see. Colours come from CSS classes (tokens), never literals,
// except the favicon, which is a stand-alone file.
// The buildings are generic types (a lecture block, a hostel, a hall), never a real FUTA building,
// and the hills are made-up shapes. The students are original characters, not real people.
(function () {
  'use strict';

  // ---------------------------------------------------------------- the mark
  // An "S" drawn as a route: from a filled station (you are here) to a rising sun (found it).
  var ROUTE = 'M33 12H19a6 6 0 0 0 0 12h10a6 6 0 0 1 0 12H17';
  var RAYS = 'M9 36H6M10.8 31.8l-2.1-2.1M15 30v-3';
  function mark(cls) {
    return '<svg class="mark' + (cls ? ' ' + cls : '') + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<path class="mark__line" d="' + ROUTE + '" pathLength="1"/>' +
      '<circle class="mark__from" cx="33" cy="12" r="4.2"/><path class="mark__rays" d="' + RAYS + '"/><circle class="mark__to" cx="15" cy="36" r="4.6"/></svg>';
  }
  var ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#290509"/>' +
    '<path d="' + ROUTE + '" fill="none" stroke="#f4be4f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="' + RAYS + '" fill="none" stroke="#f4be4f" stroke-width="2.4" stroke-linecap="round"/>' +
    '<circle cx="33" cy="12" r="4.4" fill="#f4be4f"/><circle cx="15" cy="36" r="4.6" fill="#f4be4f"/></svg>';

  // ---------------------------------------------------------------- icons
  // 24px grid, 2px stroke, round ends. An ink body and one detail (.ac) that turns gold when current.
  var ICONS = {
    home: ['<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/>', '<path d="M10 20v-5h4v5"/>'],
    map: ['<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14"/>', '<path d="M15 6v14"/>'],
    book: ['<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5z"/><path d="M4 20a2 2 0 0 0 2 1h13"/>', '<path d="M12 3v6l2-1.5L16 9V3"/>'],
    notice: ['<path d="M4 9v6h3l7 4V5L7 9H4z"/>', '<path d="M18 9a4 4 0 0 1 0 6"/>'],
    calendar: ['<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>', '<path d="M8 14h3"/>'],
    clock: ['<circle cx="12" cy="12" r="8"/>', '<path d="M12 8v4l3 2"/>'],
    user: ['<path d="M4 21a8 8 0 0 1 16 0"/>', '<circle cx="12" cy="8" r="4"/>'],
    'chevron-right': ['<path d="m9 5 7 7-7 7"/>', ''],
    'chevron-left': ['<path d="m15 5-7 7 7 7"/>', ''],
    arrow: ['<path d="M4 12h15"/>', '<path d="m13 6 6 6-6 6"/>'],
    check: ['<path d="m5 12 4 4 10-10"/>', ''],
    dashed: ['<circle cx="12" cy="12" r="7" stroke-dasharray="3 3"/>', ''],
    alert: ['<path d="M12 4 3 20h18L12 4z"/>', '<path d="M12 10v4M12 17v.5"/>'],
    info: ['<circle cx="12" cy="12" r="8"/>', '<path d="M12 11v5M12 8v.5"/>'],
    offline: ['<path d="M7 18h10a4 4 0 0 0 .8-7.9A6 6 0 0 0 7 9a4.5 4.5 0 0 0 0 9z"/>', '<path d="m4 4 16 16"/>'],
    refresh: ['<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8"/><path d="M4 13a8 8 0 0 0 14.6 4.5L20 16"/>', '<path d="M4 4v4h4M20 20v-4h-4"/>'],
    pin: ['<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/>', '<circle cx="12" cy="10" r="2"/>'],
    search: ['<circle cx="11" cy="11" r="6"/>', '<path d="m20 20-4.5-4.5"/>'],
    edit: ['<path d="M4 20h4L19 9l-4-4L4 16v4z"/>', '<path d="m13 7 4 4"/>'],
    trash: ['<path d="M7 7l1 13h8l1-13"/>', '<path d="M5 7h14M10 7V4h4v3"/>'],
    close: ['<path d="m6 6 12 12M18 6 6 18"/>', ''],
    error: ['<circle cx="12" cy="12" r="8"/>', '<path d="m9 9 6 6M15 9l-6 6"/>'],
    success: ['<circle cx="12" cy="12" r="8"/>', '<path d="m8.5 12 2.5 2.5 4.5-5"/>'],
    lock: ['<rect x="5" y="11" width="14" height="9" rx="2"/>', '<path d="M8 11V8a4 4 0 0 1 8 0v3"/>'],
    shield: ['<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3z"/>', '<path d="m9 12 2 2 4-4"/>'],
    route: ['<path d="M17 6H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7"/>', '<circle cx="17" cy="6" r="2"/>'],
    photo: ['<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 16 5-5 4 4 3-3 6 6"/>', '<circle cx="16" cy="9" r="1.6"/>'],
    download: ['<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/>', '<path d="M5 20h14"/>'],
    wifi: ['<path d="M3 9a13 13 0 0 1 18 0M6 12.5a8.5 8.5 0 0 1 12 0"/>', '<path d="M9 16a4 4 0 0 1 6 0M12 19v.5"/>'],
    settings: ['<path d="M4 7h10M4 17h6M18 7h2M14 17h6"/>', '<circle cx="16" cy="7" r="2"/><circle cx="12" cy="17" r="2"/>'],
    sparkle: ['<path d="M12 3c.8 4.6 2.4 6.2 7 7-4.6.8-6.2 2.4-7 7-.8-4.6-2.4-6.2-7-7 4.6-.8 6.2-2.4 7-7z"/>', '<path d="M19 17v4M17 19h4"/>'],
    locate: ['<circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>', '<circle cx="12" cy="12" r="2.5"/>'],
    plus: ['<path d="M12 5v14"/>', '<path d="M5 12h14"/>'],
    sun: ['<circle cx="12" cy="12" r="4"/>', '<path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>'],
    moon: ['<path d="M19 15A8 8 0 0 1 9 5a8 8 0 1 0 10 10z"/>', '<path d="M16 4v3M14.5 5.5h3"/>'],
    layers: ['<path d="m12 4 9 5-9 5-9-5 9-5z"/>', '<path d="m3 14 9 5 9-5"/>'],
  };
  function icon(name, cls) {
    var p = ICONS[name] || ICONS.info;
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      p[0] + (p[1] ? '<g class="ac">' + p[1] + '</g>' : '') + '</svg>';
  }

  // ---------------------------------------------------------------- rings
  // A progress ring: a track and an arc, value 0 to 1. The figure inside is real HTML (see app.css
  // .ring), so it scales with the text size and screen readers read it.
  function ring(value, cls) {
    var v = Math.max(0, Math.min(1, value)) * 100;
    return '<svg class="ring__svg' + (cls ? ' ' + cls : '') + '" viewBox="0 0 44 44" aria-hidden="true" focusable="false">' +
      '<circle class="ring__track" cx="22" cy="22" r="19"/>' +
      '<circle class="ring__arc" cx="22" cy="22" r="19" pathLength="100" style="--v:' + v.toFixed(1) + '"/></svg>';
  }

  // ---------------------------------------------------------------- the students
  // Four original characters, drawn in one style: rounded limbs, flat colour with one shade, a
  // simple face. Each is a function of (x, y, scale, pose) and draws from the feet up.
  // pose: stand, walk, wave, phone, cheer.
  var PEOPLE = [
    // braids in a high bun, maroon top, jeans, a phone
    { skin: 'k1', top: 'c-maroon', low: 'c-sky', hair: 'bun', bag: '' },
    // short fade, glasses, gold shirt, dark trousers, backpack
    { skin: 'k2', top: 'c-gold', low: 'c-night', hair: 'fade', bag: 'pack', specs: true },
    // hijab, jade top, long skirt, books
    { skin: 'k2', top: 'c-jade', low: 'c-maroon', hair: 'hijab', bag: 'books', skirt: true },
    // low cut, white shirt, coral trousers, a folder
    { skin: 'k3', top: 'c-cloth', low: 'c-coral', hair: 'low', bag: 'folder' },
  ];
  function limb(d, cls, w) { return '<path class="' + cls + ' ln" d="' + d + '" stroke-width="' + (w || 7) + '"/>'; }
  function person(i, x, y, s, pose) {
    var P = PEOPLE[i % PEOPLE.length], k = 's-' + P.skin, out = '';
    var walk = pose === 'walk';
    // legs (or a long skirt)
    if (P.skirt) out += '<path class="f-' + P.low.slice(2) + '" d="M-11 -46h22l5 44h-32z"/>' + limb('M-5 -2v2', 's-night', 6) + limb('M5 -2v2', 's-night', 6);
    else out += limb(walk ? 'M-3 -48 -11 -2' : 'M-4 -48v46', 's-' + P.low.slice(2), 9) + limb(walk ? 'M3 -48 9 -2' : 'M4 -48v46', 's-' + P.low.slice(2), 9) +
      '<path class="f-night" d="' + (walk ? 'M-17 0h10v-4h-8zM5 0h10l-1-4h-8z' : 'M-11 0h9v-4h-8zM2 0h9l-1-4h-8z') + '"/>';
    // backpack behind the body
    if (P.bag === 'pack') out += '<rect class="f-coral" x="-17" y="-80" width="12" height="26" rx="5"/>';
    // body
    out += '<path class="f-' + P.top.slice(2) + '" d="M-13 -46c-1-12 0-26 4-32 3-3 15-3 18 0 4 6 5 20 4 32z"/>' +
      '<path class="f-shade" d="M2 -78c3 0 5 1 7 3 4 6 5 20 4 29H4c2-10 1-24-2-32z"/>';
    // arms by pose
    var armL = 'M-10 -74c-4 8-6 16-5 26', armR = 'M10 -74c4 8 6 16 5 26';
    if (pose === 'wave') armR = 'M10 -74c6-4 9-12 9-22';
    if (pose === 'cheer') { armR = 'M10 -74c6-4 9-12 9-22'; armL = 'M-10 -74c-6-4-9-12-9-22'; }
    if (pose === 'phone') armR = 'M10 -74c5 6 4 14-3 16';
    if (walk) { armL = 'M-10 -74c-6 8-9 14-11 22'; armR = 'M10 -74c5 8 8 13 10 20'; }
    out += limb(armL, k, 6) + limb(armR, k, 6);
    if (pose === 'phone') out += '<rect class="f-night" x="-1" y="-66" width="7" height="11" rx="2"/>';
    if (P.bag === 'books') out += '<rect class="f-gold" x="-21" y="-56" width="13" height="16" rx="2"/><rect class="f-sky" x="-20" y="-60" width="12" height="5" rx="1.5"/>';
    if (P.bag === 'folder') out += '<rect class="f-sky" x="12" y="-58" width="12" height="15" rx="2"/>';
    // neck and head
    out += '<rect class="f-' + P.skin + '" x="-3.5" y="-84" width="7" height="8" rx="3"/><circle class="f-' + P.skin + '" cx="0" cy="-94" r="11"/>';
    if (P.hair === 'bun') out += '<path class="f-hair" d="M-11 -95c0-9 5-13 11-13s11 4 11 13c-3-5-7-7-11-7s-8 2-11 7z"/><circle class="f-hair" cx="2" cy="-110" r="6"/>';
    if (P.hair === 'fade') out += '<path class="f-hair" d="M-11 -96c0-8 5-12 11-12s11 4 11 12c-4-3-7-4-11-4s-8 1-11 4z"/>';
    if (P.hair === 'low') out += '<path class="f-hair" d="M-11 -97c1-7 5-10 11-10s10 3 11 10c-4-2-7-3-11-3s-7 1-11 3z"/>';
    if (P.hair === 'hijab') out += '<path class="f-sky" d="M-14 -92c-1-12 6-18 14-18s15 6 14 18c0 8-3 12-5 15H-9c-2-3-5-7-5-15z"/><path class="f-' + P.skin + '" d="M-8 -94c0-6 3-9 8-9s8 3 8 9c0 6-3 10-8 10s-8-4-8-10z"/><path class="f-cloth" d="M-9 -77h18l3 5h-24z"/>';
    // face: eyes and a smile
    out += '<circle class="f-hair" cx="-4" cy="-94" r="1.3"/><circle class="f-hair" cx="4" cy="-94" r="1.3"/><path class="s-hair ln" d="M-3 -89q3 2.4 6 0" stroke-width="1.4"/>';
    if (P.specs) out += '<g class="s-night ln" stroke-width="1.3"><circle cx="-4" cy="-94" r="3"/><circle cx="4" cy="-94" r="3"/><path d="M-1 -94h2"/></g>';
    return '<g class="person" transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' + out + '</g>';
  }

  // ---------------------------------------------------------------- scenes
  // 400 x 300, cropped to fit its box from the bottom up. kind: block, hostel, hall, library, gate,
  // walk, map, none. daypart sets the sky (CSS: .scene[data-daypart]). people: [[index, x, pose], ...].
  function rand(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  var SUN = { morning: [78, 150, 30], afternoon: [318, 64, 26], evening: [330, 176, 34], night: [312, 66, 20] };
  function tree(x, y, s, palm) {
    if (palm) return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path class="s-trunk ln" d="M0 0c2-20 0-40-4-58" stroke-width="5"/>' +
      '<path class="f-leaf" d="M-4 -58c-14-6-28-2-34 8 12-6 22-6 34-8zM-4 -58c10-10 26-12 36-4-12-2-24 0-36 4zM-4 -58c-4-12-16-20-28-18 12 4 20 10 28 18zM-4 -58c6-12 18-18 30-14-12 2-22 8-30 14z"/></g>';
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path class="s-trunk ln" d="M0 0v-24" stroke-width="5"/>' +
      '<circle class="f-leaf" cx="0" cy="-36" r="18"/><circle class="f-leaf-2" cx="-8" cy="-42" r="11"/><circle class="f-leaf" cx="10" cy="-30" r="12"/></g>';
  }
  function windows(x, y, cols, rows, w, h, gx, gy) {
    var o = '';
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) o += '<rect x="' + (x + c * gx) + '" y="' + (y + r * gy) + '" width="' + w + '" height="' + h + '" rx="1.5"/>';
    return '<g class="f-pane">' + o + '</g>';
  }
  var BUILD = {
    block: function () {
      return '<rect class="f-wall" x="110" y="150" width="200" height="90"/><rect class="f-wall-2" x="110" y="150" width="200" height="10"/>' +
        '<path class="f-roof" d="M102 150h216l-10-12H112z"/>' + windows(122, 168, 9, 2, 14, 18, 21, 30) +
        '<g class="f-wall-2"><rect x="150" y="226" width="6" height="14"/><rect x="264" y="226" width="6" height="14"/></g><rect class="f-maroon" x="196" y="214" width="28" height="26" rx="2"/>';
    },
    hostel: function () {
      return '<rect class="f-wall" x="140" y="110" width="140" height="130"/><path class="f-roof" d="M132 110h156l-14-14H146z"/>' +
        windows(152, 124, 5, 4, 16, 16, 25, 28) + '<g class="f-wall-2"><rect x="140" y="140" width="140" height="4"/><rect x="140" y="168" width="140" height="4"/><rect x="140" y="196" width="140" height="4"/></g>' +
        '<g class="f-coral"><rect x="158" y="146" width="8" height="10"/><rect x="230" y="174" width="8" height="10"/></g><g class="f-sky"><rect x="182" y="146" width="8" height="12"/></g><g class="f-gold"><rect x="250" y="202" width="8" height="10"/></g>';
    },
    hall: function () {
      return '<path class="f-wall" d="M100 240v-60c0-34 50-58 110-58s110 24 110 58v60z"/><path class="f-roof" d="M92 184c0-40 54-70 118-70s118 30 118 70h-12c0-30-48-58-106-58s-106 28-106 58z"/>' +
        windows(128, 196, 7, 1, 18, 24, 26, 0) + '<rect class="f-maroon" x="190" y="210" width="40" height="30" rx="2"/>';
    },
    library: function () {
      return '<rect class="f-wall" x="96" y="140" width="228" height="100"/><path class="f-roof" d="M88 140h244l-20-20H108z"/>' +
        '<g class="f-wall-2">' + [120, 160, 200, 240, 280].map(function (x) { return '<rect x="' + x + '" y="160" width="14" height="70"/>'; }).join('') + '</g>' +
        windows(138, 170, 4, 2, 14, 20, 40, 30) + '<rect class="f-earth" x="110" y="232" width="200" height="8"/>';
    },
    gate: function () {
      return '<rect class="f-wall" x="120" y="150" width="34" height="90"/><rect class="f-wall" x="266" y="150" width="34" height="90"/><rect class="f-wall" x="110" y="128" width="200" height="30" rx="3"/>' +
        '<g class="f-maroon"><rect x="128" y="160" width="6" height="80"/><rect x="140" y="160" width="6" height="80"/><rect x="274" y="160" width="6" height="80"/><rect x="286" y="160" width="6" height="80"/></g><rect class="f-gold" x="150" y="138" width="120" height="8" rx="4"/>';
    },
    walk: function () {
      return '<g class="f-wall-2"><rect x="76" y="150" width="4" height="70"/><rect x="330" y="150" width="4" height="70"/></g><g class="f-sun"><circle cx="78" cy="148" r="6"/><circle cx="332" cy="148" r="6"/></g>';
    },
    none: function () { return ''; },
  };
  function scene(kind, o) {
    o = o || {};
    var dp = o.daypart || 'morning', R = rand(o.seed || 5), id = 'g' + Math.floor(R() * 1e6), s = SUN[dp] || SUN.morning, out = '';
    out += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop class="sky1" offset="0"/><stop class="sky2" offset="1"/></linearGradient>' +
      '<radialGradient id="' + id + 'g"><stop class="glow" offset="0"/><stop class="glow glow--0" offset="1"/></radialGradient></defs>' +
      '<rect width="400" height="300" fill="url(#' + id + ')"/>';
    if (dp === 'night') for (var i = 0; i < 22; i++) out += '<circle class="f-moon star" cx="' + Math.round(R() * 400) + '" cy="' + Math.round(R() * 130) + '" r="' + (0.6 + R()).toFixed(1) + '" style="--d:' + (R() * 4).toFixed(1) + 's"/>';
    out += '<circle class="sun-glow" cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] * 3 + '" fill="url(#' + id + 'g)"/><circle class="' + (dp === 'night' ? 'f-moon' : 'f-sun') + '" cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '"/>';
    out += '<g class="drift f-cloud"><path d="M40 80c2-10 18-12 24-4 8-8 26-4 26 8 8 0 10 10 2 10H42c-10 0-12-12-2-14z"/><path d="M250 46c2-8 14-10 20-3 6-6 20-3 20 6 6 0 8 8 1 8h-40c-8 0-9-10-1-11z"/></g>';
    // the far hills: rounded granite domes over a green ridge (made-up shapes)
    out += '<path class="f-rock" d="M0 190c20-40 50-60 80-60s52 30 70 50c16-34 40-50 66-50s46 26 60 50c14-20 34-34 60-34s50 20 64 44v100H0z"/>' +
      '<path class="f-hill-1" d="M0 206c40-22 90-26 140-14s100 10 150-4 80-10 110 2v110H0z"/>' +
      '<path class="f-hill-2" d="M0 226c60-16 120-14 180-4s130 10 220-6v84H0z"/>';
    for (var t = 0; t < 4; t++) out += tree(Math.round(20 + R() * 360), Math.round(222 + R() * 8), 0.6 + R() * 0.3, R() > 0.55);
    out += (BUILD[kind] || BUILD.none)();
    out += '<path class="f-hill-3" d="M0 240c80-8 160-8 240-2s120 4 160 0v62H0z"/>';
    if (kind !== 'none' && kind !== 'map') out += '<path class="f-earth" d="M170 300c10-20 24-44 30-60h20c6 16 20 40 30 60z"/>';
    out += tree(28, 262, 1.1, true) + tree(372, 266, 1, false);
    (o.people || []).forEach(function (p) { out += person(p[0], p[1], p[3] || 290, p[4] || 1, p[2]); });
    return '<svg class="scene" data-daypart="' + dp + '" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' + out + '</svg>';
  }

  // ---------------------------------------------------------------- the drawn campus map
  // An invented campus: blocks, roads, trees, a route and numbered pins. Not FUTA's real layout;
  // the Maps team's live map replaces it. Pins carry the same codes as the building cards.
  function campusMap(pins) {
    var R = rand(11), out = '<rect class="f-map" width="400" height="300"/>';
    out += '<path class="s-road ln" d="M-10 210C80 200 120 120 200 120s150 70 210 60M120 -10c20 80 40 120 80 130M200 120c10 60 0 120-20 190" stroke-width="16"/>';
    out += '<path class="s-road-line ln" d="M-10 210C80 200 120 120 200 120s150 70 210 60" stroke-width="1.5" stroke-dasharray="6 8"/>';
    for (var b = 0; b < 14; b++) {
      var x = Math.round(R() * 360), y = Math.round(R() * 260), w = 24 + Math.round(R() * 30), h = 16 + Math.round(R() * 20);
      out += '<rect class="f-block" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4"/>';
    }
    for (var t = 0; t < 26; t++) out += '<circle class="f-leaf map-tree" cx="' + Math.round(R() * 400) + '" cy="' + Math.round(R() * 300) + '" r="' + (5 + Math.round(R() * 6)) + '"/>';
    out += '<path class="route ln" d="M60 250C100 240 120 180 170 150s90-40 130-60" stroke-width="5" pathLength="100"/>';
    out += '<g class="here"><circle class="here__pulse" cx="60" cy="250" r="16"/><circle class="here__dot" cx="60" cy="250" r="7"/></g>';
    (pins || []).forEach(function (p) {
      out += '<g class="pin" transform="translate(' + p[1] + ' ' + p[2] + ')"><path class="pin__body" d="M0 0c-10-12-14-18-14-24a14 14 0 0 1 28 0c0 6-4 12-14 24z"/>' +
        '<text class="pin__code" x="0" y="-21" text-anchor="middle">' + p[0] + '</text></g>';
    });
    return '<svg class="campus-map" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + out + '</svg>';
  }

  // ---------------------------------------------------------------- state vignettes
  // Small scenes for empty, error, offline and no-match states: one student and what happened.
  var VIGNETTE = {
    pending: function () { return '<circle class="f-gold-wash" cx="80" cy="64" r="50"/>' + icon2('clock', 104, 18) + person(2, 64, 116, 0.95, 'stand'); },
    break: function () { return '<circle class="f-sky-wash" cx="80" cy="64" r="50"/>' + icon2('offline', 98, 16) + person(0, 66, 116, 0.95, 'phone'); },
    detour: function () { return '<circle class="f-coral-wash" cx="80" cy="64" r="50"/>' + icon2('route', 100, 18) + person(3, 64, 116, 0.95, 'stand'); },
    arrived: function () { return '<circle class="f-jade-wash" cx="80" cy="64" r="50"/>' + icon2('check', 102, 16) + person(1, 66, 116, 0.95, 'cheer'); },
    nomatch: function () { return '<circle class="f-maroon-wash" cx="80" cy="64" r="50"/>' + icon2('search', 100, 18) + person(3, 62, 116, 0.95, 'phone'); },
  };
  function icon2(name, x, y) { var p = ICONS[name]; return '<g class="vig-icon" transform="translate(' + x + ' ' + y + ') scale(1.3)">' + p[0] + p[1] + '</g>'; }
  function piece(name) {
    return '<svg class="piece piece--' + name + '" viewBox="0 0 160 120" aria-hidden="true" focusable="false">' + (VIGNETTE[name] || VIGNETTE.pending)() + '</svg>';
  }

  // Initials for a person, for the monogram disc (no photos of people).
  function initials(name) {
    var words = String(name).replace(/\(.*?\)/g, '').replace(/\b(Prof|Dr|Mr|Mrs|Ms|Engr)\.?\s*/g, '').trim().split(/\s+/);
    var last = words[words.length - 1] || '';
    return ((words[0] || '').charAt(0) + (words.length > 1 ? last.charAt(0) : '')).toUpperCase();
  }

  window.SABI_ART = {
    mark: mark, icon: icon, ring: ring, scene: scene, person: person, campusMap: campusMap, piece: piece, initials: initials,
    iconSvg: ICON_SVG, favicon: 'data:image/svg+xml,' + encodeURIComponent(ICON_SVG),
  };
})();
