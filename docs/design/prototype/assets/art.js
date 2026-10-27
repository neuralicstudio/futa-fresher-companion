// Sabi's own drawings, as SVG strings: the logo, progress rings, initials avatars and the gold wave lines
// in the corners. Icons come from Phosphor (assets/icons.js); scenes and students are in scenes.js.
// Colours come from CSS classes (tokens), except the favicon, which is a stand-alone file.
(function () {
  'use strict';

  // ---------------------------------------------------------------- the logo
  // A map pin with a mortarboard cap in it: "find your way" and "student". Gold pin, night cap.
  // Drawn for Sabi; it follows the approved mockups' idea without copying their artwork.
  var PIN = 'M24 3C14.6 3 7 10.4 7 19.5 7 31 24 45 24 45s17-14 17-25.5C41 10.4 33.4 3 24 3z';
  var CAP = 'M24 12.5 11.5 18.6 24 24.7l12.5-6.1L24 12.5z';
  function logo(cls) {
    return '<svg class="logo' + (cls ? ' ' + cls : '') + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
      '<path class="logo__pin" d="' + PIN + '"/>' +
      '<path class="logo__cap" d="' + CAP + '"/>' +
      '<path class="logo__cap-line" d="M17.5 22.3v4.6c0 1.6 3 3.1 6.5 3.1s6.5-1.5 6.5-3.1v-4.6M36.5 18.6v7"/></svg>';
  }
  var FAVICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#0a0309"/>' +
    '<path d="' + PIN + '" fill="#fcc13c"/><path d="' + CAP + '" fill="#0a0309"/>' +
    '<path d="M17.5 22.3v4.6c0 1.6 3 3.1 6.5 3.1s6.5-1.5 6.5-3.1v-4.6M36.5 18.6v7" fill="none" stroke="#0a0309" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ---------------------------------------------------------------- rings
  // value 0 to 1. The figure inside a ring is real HTML (css .ring), so it scales with text size and is read.
  function ring(value, cls) {
    var v = Math.max(0, Math.min(1, value)) * 100;
    return '<svg class="ring' + (cls ? ' ' + cls : '') + '" viewBox="0 0 44 44" aria-hidden="true" focusable="false">' +
      '<circle class="ring__track" cx="22" cy="22" r="19"/>' +
      '<circle class="ring__arc" cx="22" cy="22" r="19" pathLength="100" style="--v:' + v.toFixed(1) + '"/></svg>';
  }

  // ---------------------------------------------------------------- initials avatar
  // Lecturers and people are never shown as faces: an initials disc, in one of four brand tints.
  function initials(name) {
    var words = String(name).replace(/\(.*?\)/g, '').replace(/\b(Prof|Dr|Mr|Mrs|Ms|Engr)\.?\s*/gi, '').trim().split(/\s+/).filter(Boolean);
    var last = words[words.length - 1] || '';
    return ((words[0] || '').charAt(0) + (words.length > 1 ? last.charAt(0) : '')).toUpperCase();
  }
  var TINTS = ['gold', 'green', 'indigo', 'red'];
  function avatar(name, i, cls) {
    return '<span class="avatar avatar--' + TINTS[(i || 0) % TINTS.length] + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + initials(name) + '</span>';
  }

  // ---------------------------------------------------------------- decoration
  // The gold wave lines that curl in from the bottom corners (decoration only; hidden in Lite).
  function waves() {
    return '<svg class="waves" viewBox="0 0 390 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      '<g class="waves__l"><path d="M0 40C40 46 90 80 130 120"/><path d="M0 62C32 68 70 92 100 120"/><path d="M0 84C24 90 50 104 70 120"/></g>' +
      '<g class="waves__r"><path d="M390 40C350 46 300 80 260 120"/><path d="M390 62C358 68 320 92 290 120"/><path d="M390 84C366 90 340 104 320 120"/></g></svg>';
  }
  // Short gold dashes that burst around a button or a note (decoration, aria-hidden).
  function sparks(side) {
    return '<svg class="sparks sparks--' + side + '" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M6 8l9 5M3 20h12M6 32l9-5"/></svg>';
  }

  window.SABI_ART = { logo: logo, ring: ring, avatar: avatar, initials: initials, waves: waves, sparks: sparks, favicon: 'data:image/svg+xml,' + encodeURIComponent(FAVICON_SVG), faviconSvg: FAVICON_SVG };
})();
