// The photo pack: the campus photos that make Sabi look like campus, kept out of the first load.
// In the app they download quietly after the first sync, only on a good connection (never when the
// browser reports saveData or a slow effective type), then stay on the phone for offline use. Lite mode
// never downloads or shows them: every photo slot already holds a drawn scene, and the photo fades in over
// it once the pack is on the phone.
//
// In the prototype "downloaded" is simulated: ?pack=ready|none|downloading|waiting, or the setting saved by
// the Settings screen (localStorage "sabi-pack"). The default is ready. ?local=0 hides the photos that live
// in photos-local/ (David's own, not in the repo), which is how the committed screenshots are made.
//
// Every entry below is a real photo with a verified credit: a Wikimedia Commons file page, or (the one local-only entry) FUTA's own page and permission. Authors and licences
// were read from the Commons API on 2026-10-27 and are repeated in docs/design/CREDITS.md. A name is
// shown only when the photo itself shows it on a sign; otherwise alt text says only what is visible.
(function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  var C = 'https://commons.wikimedia.org/wiki/File:';
  var BYSA = 'CC BY-SA 4.0';
  // id: placeholder colours (top, middle, bottom), alt, author, licence, file page, used on, local-only flag
  var P = {
    gate: [['#f7f9f9', '#dae5e3', '#b2bab6'], 'The main gate, with "The Federal University of Technology Akure" across the top', 'Kaizenify (Wikimedia User Group Nigeria)', 'Public domain', C + 'Federal_University_of_Technology,_Akure.jpg', 'Welcome, Home, First sync'],
    library: [['#231b13', '#28231a', '#1d0e08'], 'The front of a building with a sign reading "Albert Ilemobade Library"', 'MediaMOF', BYSA, C + 'Albert_Ilemobade_Library,_Federal_University_of_Technology,_Akure,_Ondo_State104.jpg', 'Home, Map, Place detail, Notices'],
    'library-inside': [['#6d736b', '#565750', '#565848'], 'A reading area with bookshelves and patterned cushions', 'Geekdidi', BYSA, C + 'FUTA_Library.jpeg', 'Place detail'],
    computing: [['#577685', '#635e53', '#57442b'], 'A building entrance with a sign reading "School of Computing"', 'MediaMOF', BYSA, C + 'School_of_Computing,_Federal_University_of_Technology,_Akure,_Ondo_State6.jpg', 'Home, Map, Academics'],
    physics: [['#068fce', '#64a6bb', '#666735'], 'A roadside sign reading "Department of Physics" in front of low buildings', 'Jesu-loba', BYSA, C + 'Department_of_Physics,_Federal_University_of_Technology,_Akure,_Ondo_State.jpg', 'Academics'],
    hall: [['#525f62', '#534c41', '#555838'], 'A hall with red angled supports and a sign reading "Centre for Continuing Education, Multi-purpose Hall"', 'MediaMOF', BYSA, C + 'CCE_Multipurpose_Hall,_Federal_University_of_Technology,_Akure,_Ondo_State4.jpg', 'Map, Place detail'],
    crc: [['#5b728a', '#51403d', '#595336'], 'A red building with a sign reading "Chief (Dr) Joseph A. Sanusi Computer Resource Centre"', 'MediaMOF', BYSA, C + 'Computer_Resource_Centre,_Federal_University_of_Technology,_Akure,_Ondo_State3.jpg', 'Map, Academics'],
    techpark: [['#727268', '#484222', '#4a3f25'], 'A building with a sign reading "Technology Park and Incubation Centre"', 'MediaMOF', BYSA, C + 'Technology_Park_and_Incubation_Centre,,_Federal_University_of_Technology,_Akure,_Ondo_State.jpg', 'Academics'],
    studios: [['#99c3e0', '#6c7a6c', '#877042'], 'A long building with a sign reading "Industrial Design Studios"', 'Jesu-loba', BYSA, C + 'Industrial_Design_Studios,_Federal_University_of_Technology,_Akure2.jpg', 'Academics'],
    road: [['#5b6766', '#5f653d', '#77865e'], 'A road lined with tall trees', 'Omaonu', BYSA, C + 'FUTA_farm_road.jpg', 'Home, Register, Login'],
    tree: [['#98b2b6', '#718244', '#847c28'], 'A flowering tree in front of a long yellow building', 'Omaonu', BYSA, C + 'School_of_Engineering_building_beside_ETF_FUTA.jpg', 'Settings, Admin'],
    // The night gate: a photo from FUTA's official Facebook page, used with FUTA's permission. David is adding
    // FUTA's written OK, which is still pending, so the file stays LOCAL ONLY (photos-local/, out of git) until he
    // confirms. The committed screenshots never show it (they use ?local=0).
    'local-gate-night': [['#0a0f2a', '#3a2418', '#1a1208'], 'The main gate at night, lit up', 'Federal University of Technology, Akure (official Facebook page)', "Used with FUTA's permission (written confirmation pending)", '', 'Welcome, Home, Map, Timetable, First sync (local preview only, not in the repo yet)', 1],
  };
  function root() { return document.documentElement; }
  function state() {
    var s = q.get('pack');
    if (!s) { try { s = localStorage.getItem('sabi-pack'); } catch (e) { s = null; } }
    return /^(ready|none|downloading|waiting)$/.test(s || '') ? s : 'ready';
  }
  function on() { return !root().hasAttribute('data-lite') && state() === 'ready'; }
  function info(id) { var p = P[id]; return p ? { id: id, ph: p[0], alt: p[1], author: p[2], licence: p[3], page: p[4], used: p[5], local: !!p[6] } : null; }

  // A photo slot: the drawn scene underneath, the photo's placeholder colours behind, and the photo added
  // by show() once the pack is on the phone. A slot may list a local-only photo first and a committed one
  // second ("local-gate-night gate"): the first that loads wins, so a fresh clone shows the second.
  function slot(ids, size, fallback, cls) {
    var list = String(ids || '').split(/\s+/).filter(Boolean), first = info(list[list.length - 1]);
    var style = first ? ' style="--ph1:' + first.ph[0] + ';--ph2:' + first.ph[1] + ';--ph3:' + first.ph[2] + '"' : '';
    return '<div class="pic' + (cls ? ' ' + cls : '') + '"' + (list.length ? ' data-pic="' + list.join(' ') + '" data-size="' + (size || 'l') + '"' : '') + style + '>' + (fallback || '') + '</div>';
  }
  function load(el, ids, size) {
    var id = ids.shift(), p = info(id);
    if (!p) return;
    if (p.local && q.get('local') === '0') return load(el, ids, size);
    var img = new Image();
    img.alt = p.alt; img.decoding = 'async'; img.loading = 'lazy';
    img.onload = function () {
      el.classList.add('has-photo');
      el.setAttribute('data-shown', id);
      if (size === 'l' && !p.local) el.setAttribute('data-credit', (window.SABI_COPY ? window.SABI_COPY.shell.photoBy : 'Photo:') + ' ' + p.author + ', ' + p.licence);
    };
    img.onerror = function () { img.remove(); if (ids.length) load(el, ids, size); }; // not on this phone: try the next, else the drawing stays
    img.src = (p.local ? 'photos-local/' : 'pack/photos/') + id + '-' + size + '.webp';
    el.appendChild(img);
  }
  function show(scope) {
    if (!on()) return;
    (scope || document).querySelectorAll('[data-pic]').forEach(function (el) {
      if (el.querySelector('img')) return;
      load(el, el.getAttribute('data-pic').split(' '), el.getAttribute('data-size'));
    });
  }
  document.addEventListener('sabi:lite', function (e) { if (!e.detail) show(); });

  window.SABI_PACK = { state: state, on: on, info: info, slot: slot, show: show, ids: Object.keys(P) };
})();
