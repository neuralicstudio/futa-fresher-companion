// Sabi's drawn language, as SVG strings: the logo, the icon set, the contour ground and the line
// pieces used for empty, error and offline states. Everything is code, so it costs no requests and
// no image bytes. One rule runs through all of it: a gold line with stations on it.
(function () {
  'use strict';

  // ---------------------------------------------------------------- the mark
  // An "S" drawn as a route: it starts at a filled station (you are here), runs left, turns twice
  // and ends at an open station (where you are going). It still reads as a route if the name changes.
  var ROUTE = 'M33 12H19a6 6 0 0 0 0 12h10a6 6 0 0 1 0 12H15';
  function mark(cls) {
    return '<svg class="mark' + (cls ? ' ' + cls : '') + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<path class="mark__line" d="' + ROUTE + '" pathLength="1"/>' +
      '<circle class="mark__from" cx="33" cy="12" r="4"/><circle class="mark__to" cx="15" cy="36" r="3.6"/></svg>';
  }
  // The app icon: the mark on a night-maroon tile, for the home screen and the tab favicon.
  var ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="11" fill="#31060b"/>' +
    '<path d="' + ROUTE + '" fill="none" stroke="#f3be55" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="33" cy="12" r="4.4" fill="#f3be55"/><circle cx="15" cy="36" r="3.6" fill="#31060b" stroke="#f3be55" stroke-width="2.6"/></svg>';

  // ---------------------------------------------------------------- icons
  // 24px grid, 2px stroke, round ends. Each icon has an ink body and one "you are here" detail (.ac)
  // that turns gold when the icon is current (the active tab) or on maroon.
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
    leaf: ['<path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z"/>', '<path d="M5 19 13 11"/>'],
    route: ['<path d="M17 6H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7"/>', '<circle cx="17" cy="6" r="2"/>'],
  };
  function icon(name, cls) {
    var p = ICONS[name] || ICONS.info;
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      p[0] + (p[1] ? '<g class="ac">' + p[1] + '</g>' : '') + '</svg>';
  }

  // ---------------------------------------------------------------- the contour ground
  // Abstract height lines, like a walker's map: rings around two or three made-up rises. Drawn from a
  // seed so each screen has its own ground, but the same screen always looks the same. Not FUTA's
  // real terrain and no buildings: it is texture with a meaning (ground you can learn to read).
  function rand(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function ring(cx, cy, r, wob, ph) {
    var n = 28, pts = [];
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var k = 1 + wob * Math.sin(3 * a + ph) + wob * 0.5 * Math.sin(5 * a - ph * 1.7);
      pts.push([cx + Math.cos(a) * r * k * 1.25, cy + Math.sin(a) * r * k * 0.8]);
    }
    var mid = function (p, q) { return ((p[0] + q[0]) / 2).toFixed(1) + ' ' + ((p[1] + q[1]) / 2).toFixed(1); };
    var d = 'M' + mid(pts[0], pts[1]);
    for (var j = 1; j <= n; j++) {
      var p = pts[j % n], q = pts[(j + 1) % n];
      d += 'Q' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' ' + mid(p, q);
    }
    return '<path d="' + d + 'Z"/>';
  }
  function contours(seed, opts) {
    opts = opts || {};
    var R = rand(seed || 7), w = 400, h = opts.h || 220, out = '';
    var hills = opts.hills || 3;
    for (var k = 0; k < hills; k++) {
      var cx = 40 + R() * (w - 80), cy = 20 + R() * (h - 40), ph = R() * 6, rings = 4 + Math.floor(R() * 4);
      for (var i = 1; i <= rings; i++) out += ring(cx, cy, i * (14 + R() * 6), 0.1 + R() * 0.08, ph + i * 0.35);
    }
    return '<svg class="contours" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + out + '</svg>';
  }

  // ---------------------------------------------------------------- line pieces for states
  // 120 x 48: a short stretch of the line with what happened to it. Same stroke and stations as the
  // Home line, so a student learns one picture language.
  var PIECES = {
    // Nothing here yet: the line runs on as dashes to a station that is still to come.
    pending: '<path class="ln" d="M8 24h46"/><path class="ln ln--dash" d="M60 24h40"/><circle class="st st--full" cx="8" cy="24" r="6"/><circle class="st" cx="108" cy="24" r="6"/>',
    // Offline: the line is broken, both ends capped, nothing lost on either side.
    break: '<path class="ln" d="M8 24h38M74 24h38"/><path class="ln ln--thin" d="M52 16l6 16M62 16l6 16"/><circle class="st st--full" cx="8" cy="24" r="6"/><circle class="st st--full" cx="112" cy="24" r="6"/>',
    // Error: a detour. The line steps around the problem and comes back.
    detour: '<path class="ln" d="M8 34h26c6 0 8-20 14-20h24c6 0 8 20 14 20h26"/><circle class="st st--full" cx="8" cy="34" r="6"/><circle class="st" cx="112" cy="34" r="6"/>',
    // Arrived: the line reaches its station and the station fills.
    arrived: '<path class="ln" d="M8 24h94"/><circle class="st st--full" cx="8" cy="24" r="6"/><circle class="st st--goal" cx="108" cy="24" r="9"/><path class="tick" d="m103.5 24 3 3 6-6"/>',
    // Search found nothing: the line ends at a station with no name on it.
    nomatch: '<path class="ln" d="M8 24h70"/><circle class="st st--full" cx="8" cy="24" r="6"/><circle class="st" cx="90" cy="24" r="9"/><path class="ln ln--thin" d="m97 31 9 9"/>',
  };
  function piece(name) {
    return '<svg class="piece piece--' + name + '" viewBox="0 0 120 48" aria-hidden="true" focusable="false">' + (PIECES[name] || PIECES.pending) + '</svg>';
  }

  // Initials for a person, for the monogram disc (no photos of people).
  function initials(name) {
    var words = String(name).replace(/\(.*?\)/g, '').replace(/\b(Prof|Dr|Mr|Mrs|Ms|Engr)\.?\s*/g, '').trim().split(/\s+/);
    var last = words[words.length - 1] || '';
    return ((words[0] || '').charAt(0) + (words.length > 1 ? last.charAt(0) : '')).toUpperCase();
  }

  window.SABI_ART = {
    mark: mark, icon: icon, contours: contours, piece: piece, initials: initials,
    iconSvg: ICON_SVG, favicon: 'data:image/svg+xml,' + encodeURIComponent(ICON_SVG),
  };
})();
