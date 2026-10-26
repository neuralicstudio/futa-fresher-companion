// The visual pack: the campus photos that make Sabi image-rich, kept out of the first load.
// In the app they download quietly after the first sync, only on a good connection (never when the
// browser reports saveData or a slow effective type), then stay on the phone for offline use.
// Lite mode never downloads or shows them: every photo slot already holds a drawn scene, and the
// photo only fades in over it once the pack is on the phone.
//
// In the prototype "downloaded" is simulated: ?pack=ready|none|downloading|wifi, or the setting
// saved by the Settings screen (localStorage "sabi-pack"). The default is ready, so the screens
// show photos. ?local=0 hides the photos that live in photos-local/ (not in the repo), which is
// how the committed screenshots are made.
//
// Every photo: where it came from, its licence and credit are in docs/design/CREDITS.md. A name
// is shown only when the photo itself shows it on a sign; otherwise the alt text describes what
// is visible and nothing more.
(function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  var CC = 'CC BY-SA 4.0, Wikimedia Commons';
  var DAVID = 'supplied by David, local only';
  // id: [placeholder colours top, middle, bottom], alt, credit, sign name or '', local only
  var P = {
    gate: [['#f7f9f9', '#dae5e3', '#b2bab6'], 'The main gate, with "The Federal University of Technology Akure" across the top', 'Kaizenify, public domain, Wikimedia Commons', ''],
    library: [['#231b13', '#28231a', '#1d0e08'], 'The front of a building with a sign reading "Albert Ilemobade Library"', 'MediaMOF, ' + CC, 'Albert Ilemobade Library'],
    'library-inside': [['#6d736b', '#565750', '#565848'], 'A reading area with bookshelves and patterned cushions', 'Geekdidi, ' + CC, ''],
    computing: [['#577685', '#635e53', '#57442b'], 'A building entrance with a sign reading "School of Computing"', 'MediaMOF, ' + CC, 'School of Computing'],
    physics: [['#068fce', '#64a6bb', '#666735'], 'A roadside sign reading "Department of Physics" in front of low buildings', 'Jesu-loba, ' + CC, 'Department of Physics'],
    hall: [['#525f62', '#534c41', '#555838'], 'A hall with red angled supports and a sign reading "Centre for Continuing Education, Multi-purpose Hall"', 'MediaMOF, ' + CC, 'Multi-purpose Hall, Centre for Continuing Education'],
    crc: [['#5b728a', '#51403d', '#595336'], 'A red building with a sign reading "Chief (Dr) Joseph A. Sanusi Computer Resource Centre"', 'MediaMOF, ' + CC, 'Joseph A. Sanusi Computer Resource Centre'],
    techpark: [['#727268', '#484222', '#4a3f25'], 'A building with a sign reading "Technology Park and Incubation Centre"', 'MediaMOF, ' + CC, 'Technology Park and Incubation Centre'],
    studios: [['#99c3e0', '#6c7a6c', '#877042'], 'A long building with a sign reading "Industrial Design Studios"', 'Jesu-loba, ' + CC, 'Industrial Design Studios'],
    road: [['#5b6766', '#5f653d', '#77865e'], 'A road lined with tall trees', 'Omaonu, ' + CC, ''],
    tree: [['#98b2b6', '#718244', '#847c28'], 'A flowering tree in front of a long yellow building', 'Omaonu, ' + CC, ''],
    'local-gate': [['#dfe3e8', '#82796d', '#8d7d66'], 'The main gate seen from the road', DAVID, '', 1],
    'local-red-roof': [['#e8f2f6', '#d7ced2', '#a6988b'], 'A three-storey building with a red roof', DAVID, '', 1],
    'local-tall': [['#a3a19c', '#786e63', '#625a42'], 'A tall building with maroon columns among palm trees', DAVID, '', 1],
    'local-block': [['#e3ddca', '#c9b893', '#a38b75'], 'A long yellow building with parked cars in front', DAVID, '', 1],
    'local-building': [['#b4becf', '#7b7971', '#595239'], 'A cream three-storey building behind a lawn', DAVID, '', 1],
  };
  function root() { return document.documentElement; }
  function state() {
    var s = q.get('pack');
    if (!s) { try { s = localStorage.getItem('sabi-pack'); } catch (e) { s = null; } }
    return /^(ready|none|downloading|wifi)$/.test(s || '') ? s : 'ready';
  }
  function on() { return !root().hasAttribute('data-lite') && state() === 'ready'; }
  function info(id) { var p = P[id]; return p ? { ph: p[0], alt: p[1], credit: p[2], name: p[3], local: !!p[4] } : null; }

  // A photo slot: the drawn scene underneath, the photo's placeholder colours on the slot, and the
  // photo itself added by show() when the pack is on the phone.
  function slot(id, size, fallback, cls) {
    var p = info(id);
    var style = p ? ' style="--ph1:' + p.ph[0] + ';--ph2:' + p.ph[1] + ';--ph3:' + p.ph[2] + '"' : '';
    return '<div class="pic' + (cls ? ' ' + cls : '') + '"' + (p ? ' data-pic="' + id + '" data-size="' + (size || 'l') + '"' : '') + style + '>' + (fallback || '') + '</div>';
  }
  function show(scope) {
    if (!on()) return;
    (scope || document).querySelectorAll('[data-pic]').forEach(function (el) {
      var id = el.getAttribute('data-pic'), p = info(id);
      if (!p || el.querySelector('img') || (p.local && q.get('local') === '0')) return;
      var img = new Image();
      img.alt = p.alt; img.decoding = 'async'; img.loading = 'lazy';
      img.onload = function () {
        el.classList.add('has-photo');
        // CC BY-SA asks for the credit beside the work: a small chip on every large photo.
        // A hero's credit joins the text column, so it can never sit under the title, whatever the text size.
        var credit = '<small class="pic__credit">' + (window.SABI_TEXT ? SABI_TEXT.pack.photoBy : 'Photo:') + ' ' + p.credit + '</small>';
        var inner = el.closest('.hero') && el.closest('.hero').querySelector('.hero__inner');
        if (inner) inner.insertAdjacentHTML('beforeend', credit.replace('pic__credit', 'pic__credit pic__credit--hero'));
        else if (el.getAttribute('data-size') === 'l') el.insertAdjacentHTML('beforeend', credit);
      };
      img.onerror = function () { img.remove(); }; // not on this phone: the drawn scene stays
      img.src = (p.local ? 'photos-local/' : 'pack/photos/') + id + '-' + el.getAttribute('data-size') + '.webp';
      el.appendChild(img);
    });
  }
  document.addEventListener('sabi:lite', function (e) { if (!e.detail) show(); });

  window.SABI_PACK = { state: state, on: on, info: info, slot: slot, show: show, ids: Object.keys(P) };
})();
