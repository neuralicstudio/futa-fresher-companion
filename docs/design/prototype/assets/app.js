// Draws each prototype screen from window.SABI_TEXT (assets/strings.js), with the drawn pieces from
// assets/art.js and the motion rules from assets/motion.js. No network, no build.
// A page says which screen it is with <body data-screen="...">. Its state comes from ?state=...
// and the prototype bar; the theme from ?theme=light|dark; Lite from ?lite=1|0; the band's time of
// day from ?daypart=morning|afternoon|evening|night (default: the sample clock in strings.js).
(function () {
  'use strict';
  var T = window.SABI_TEXT;
  var A = window.SABI_ART;
  var M = window.SABI_MOTION;
  var icon = A.icon;
  var params = new URLSearchParams(location.search);
  var STATE = params.get('state') || 'default';
  var SCREEN = document.body.getAttribute('data-screen');
  var NOW = T.home.sampleNow;
  var DAYPART = params.get('daypart') || NOW.daypart;
  if (params.get('proto') === '0') document.body.classList.add('no-proto');
  // ?text=200 doubles the root text size, to check the screens at 200% text (WCAG 1.4.4).
  if (params.get('text')) document.documentElement.style.fontSize = Number(params.get('text')) + '%';

  // The tab icon: the mark on its night-maroon tile, as a data URI (no request).
  var fav = document.createElement('link');
  fav.rel = 'icon'; fav.type = 'image/svg+xml'; fav.href = A.favicon;
  document.head.appendChild(fav);

  // ---------------------------------------------------------------- text
  function get(path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, T);
  }
  function fill(text, vars) {
    var all = Object.assign({ app: T.app.name }, vars || {});
    return String(text).replace(/\{(\w+)\}/g, function (m, k) { return k in all ? all[k] : m; });
  }
  function t(path, vars) { return esc(fill(get(path), vars)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toMin(hhmm) { var p = hhmm.split(':'); return Number(p[0]) * 60 + Number(p[1]); }

  // ---------------------------------------------------------------- shared pieces
  var TABS = [
    { key: 'home', href: 'home.html', icon: 'home' },
    { key: 'map', href: 'map.html', icon: 'map' },
    { key: 'academics', href: 'academics.html', icon: 'book' },
    { key: 'notices', href: 'announcements.html', icon: 'notice' },
  ];
  var CURRENT = { home: 'home', 'first-sync': 'home', map: 'map', academics: 'academics', department: 'academics', timetable: 'academics', announcements: 'notices' }[SCREEN];

  function keep(extra) {
    var p = new URLSearchParams();
    ['proto', 'lite', 'daypart'].forEach(function (k) { if (params.get(k)) p.set(k, params.get(k)); });
    if (extra) Object.keys(extra).forEach(function (k) { p.set(k, extra[k]); });
    var s = p.toString();
    return s ? '?' + s : '';
  }
  function links(bottom) {
    return TABS.map(function (tab) {
      var cur = CURRENT === tab.key ? ' aria-current="page"' : '';
      var ic = icon(tab.icon);
      return '<a href="' + tab.href + keep() + '"' + cur + '>' + (bottom ? '<span class="tabs__cap">' + ic + '</span>' : ic) + '<span>' + t('shell.' + tab.key) + '</span></a>';
    }).join('');
  }
  function topbar(opts) {
    var right = opts.signedIn
      ? '<a href="admin.html' + keep() + '">' + icon('shield') + '<span>' + t('shell.admin') + '</span></a>'
      : '<a href="login.html' + keep() + '">' + icon('user') + '<span>' + t('shell.login') + '</span></a>';
    return (
      '<header class="topbar"' + (opts.sheet ? '' : ' data-once="trim"') + '><div class="topbar__inner">' +
      '<a class="wordmark" href="home.html' + keep() + '" aria-label="' + t('app.name') + ', ' + t('shell.home') + '">' + A.mark() + '<span>' + t('app.name') + '</span></a>' +
      '<nav class="topbar__tabs" aria-label="' + t('shell.navLabel') + '">' + links(false) + '</nav>' +
      '<span class="topbar__spacer"></span><span class="lite-chip">' + t('shell.liteChip') + '</span>' + right + '</div></header>'
    );
  }
  function banner(kind) {
    if (kind === 'offline')
      return '<div class="banner banner--offline" role="status">' + icon('offline') + '<span class="banner__text">' + t('banners.offline') + '</span></div>';
    if (kind === 'syncFailed')
      return '<div class="banner banner--warn" role="status">' + icon('alert') + '<span class="banner__text">' + t('banners.syncFailed') + '</span><button class="btn btn--secondary" type="button">' + icon('refresh', 'icon--sm') + t('banners.tryAgain') + '</button></div>';
    return '';
  }
  // The band: the maroon sky behind a screen's title. vt names the title for the page transition, so
  // the station you tapped on Home slides into this title.
  function band(o) {
    return '<section class="band' + (o.cls ? ' ' + o.cls : '') + '" data-daypart="' + esc(DAYPART) + '">' +
      (o.slot ? '<div class="slot" data-slot="' + o.slot + '" data-alt="' + esc(o.alt || '') + '" data-src=""></div>' : '') +
      A.contours(o.seed || 3, { h: o.h || 220 }) +
      '<div class="band__inner">' + (o.back || '') + (o.before || '') +
      '<h1' + (o.vt ? ' style="view-transition-name:vt-' + o.vt + '"' : '') + (o.id ? ' id="' + o.id + '"' : '') + '>' + o.title + '</h1>' +
      (o.lead ? '<p class="lead">' + o.lead + '</p>' : '') + (o.after || '') + '</div></section>';
  }
  function shell(content, opts) {
    opts = opts || {};
    if (opts.banner === 'offline') document.documentElement.setAttribute('data-net', 'offline');
    document.getElementById('app').innerHTML =
      '<a class="skip" href="#main">' + t('shell.skip') + '</a>' +
      topbar(opts) + (opts.banner ? banner(opts.banner) : '') +
      '<main id="main" tabindex="-1">' + (opts.band || '') + (content ? '<div class="page">' + content + '</div>' : '') + '</main>' +
      '<nav class="tabs" aria-label="' + t('shell.navLabel') + '">' + links(true) + '</nav>' +
      protoBar(opts.states || []);
    document.title = (opts.title ? opts.title + ' | ' : '') + T.app.name;
    M.init(document);
    M.photos(document);
  }
  function seal(status, updated, source, stamped) {
    var map = {
      verified: ['seal--verified', 'check', 'verification.verified'],
      unverified: ['seal--unverified', 'dashed', 'verification.unverified'],
      outdated: ['seal--outdated', 'alert', 'verification.outdated'],
    };
    var m = map[status] || ['seal--unverified', 'info', 'verification.unknown'];
    return (
      '<div class="facts-wrap"><p class="seal-line"><span class="seal ' + m[0] + (stamped ? ' is-stamped' : '') + '">' + icon(m[1], 'icon--sm') + t(m[2]) + '</span>' +
      '<span class="seal-line__date">' + (updated ? (stamped ? esc(updated) : t('verification.updated', { date: updated })) : t('verification.updatedUnknown')) + '</span></p>' +
      '<details class="source"><summary>' + icon('chevron-right', 'icon--sm') + t('verification.source') + '</summary><p>' +
      (source ? esc(source) : t('verification.noSource')) + '</p></details></div>'
    );
  }
  function back(label, href) {
    return '<a class="back" href="' + href + keep() + '">' + icon('chevron-left', 'icon--sm') + label + '</a>';
  }
  function skeleton(rows) {
    var out = '<div class="skeleton" aria-hidden="true" data-loop>';
    for (var i = 0; i < rows; i++) out += '<div class="skeleton__row"><div class="skeleton__bar skeleton__bar--title"></div><div class="skeleton__bar"></div><div class="skeleton__bar skeleton__bar--short"></div></div>';
    return out + '</div>';
  }
  function loading(textPath, rows) {
    return '<p role="status" class="muted">' + t(textPath) + '</p>' + skeleton(rows || 3);
  }
  function errorState(textPath, retryPath) {
    return '<div class="state state--error" role="alert">' + A.piece('detour') +
      '<p class="state__body">' + t(textPath) + '</p>' +
      '<button class="btn btn--secondary" type="button">' + icon('refresh', 'icon--sm') + t(retryPath) + '</button></div>';
  }
  function emptyState(titleText, bodyText, action, pieceName) {
    return '<div class="state" role="status">' + A.piece(pieceName || 'pending') +
      '<p class="state__title">' + titleText + '</p>' + (bodyText ? '<p>' + bodyText + '</p>' : '') + (action || '') + '</div>';
  }
  function chip(text, kind) { return '<span class="chip chip--' + kind + '">' + text + '</span>'; }
  function stop(i, o) {
    return '<li class="stop' + (o.cls ? ' ' + o.cls : '') + '" style="--i:' + i + '">' +
      (o.href ? '<a class="stop__link" href="' + o.href + '">' : '<div class="stop__link">') +
      '<span class="stop__ring" aria-hidden="true">' + (o.done ? icon('check', 'icon--sm tick-icon') : '') + '</span>' +
      '<span class="stop__text"><span class="stop__title"' + (o.vt ? ' style="view-transition-name:vt-' + o.vt + '"' : '') + '>' + o.title + '</span>' +
      (o.sub ? '<span class="stop__sub">' + o.sub + '</span>' : '') + (o.extra ? '<span>' + o.extra + '</span>' : '') + '</span>' +
      (o.href ? '<span class="stop__go" aria-hidden="true">' + icon('arrow', 'icon--lg') + '</span></a>' : '</div>') + '</li>';
  }

  // ---------------------------------------------------------------- the prototype bar
  function protoBar(states) {
    function sel(kind, values, cur, path) {
      return '<label>' + t('proto.' + kind) + '<select data-proto="' + kind + '">' + values.map(function (v) {
        return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + t(path + '.' + v) + '</option>';
      }).join('') + '</select></label>';
    }
    var mode = document.documentElement.getAttribute('data-mode') || 'auto';
    var litePref = params.get('lite') === '1' ? 'on' : params.get('lite') === '0' ? 'off' : (function () { try { return localStorage.getItem('sabi-lite') || 'auto'; } catch (e) { return 'auto'; } })();
    return '<details class="proto"><summary>' + t('proto.bar') + '</summary><div class="proto__body">' +
      (states.length ? sel('state', ['default'].concat(states), STATE, 'proto.states') : '') +
      sel('theme', ['auto', 'light', 'dark'], mode, 'proto.themes') +
      sel('lite', ['auto', 'on', 'off'], litePref, 'proto.lites') +
      sel('daypart', ['morning', 'afternoon', 'evening', 'night'], DAYPART, 'proto.dayparts') +
      '<a href="index.html' + keep() + '">' + t('proto.index') + '</a></div></details>';
  }
  document.addEventListener('change', function (e) {
    var kind = e.target.getAttribute && e.target.getAttribute('data-proto');
    if (!kind) return;
    var v = e.target.value;
    if (kind === 'state') { params.set('state', v); location.search = params.toString(); }
    if (kind === 'daypart') { params.set('daypart', v); location.search = params.toString(); }
    if (kind === 'theme') {
      try { v === 'auto' ? localStorage.removeItem('sabi-proto-mode') : localStorage.setItem('sabi-proto-mode', v); } catch (err) { /* storage blocked: this view only */ }
      if (v === 'auto') document.documentElement.removeAttribute('data-mode');
      else document.documentElement.setAttribute('data-mode', v);
    }
    if (kind === 'lite') {
      params.delete('lite');
      try { v === 'auto' ? localStorage.removeItem('sabi-lite') : localStorage.setItem('sabi-lite', v); } catch (err) { if (v !== 'auto') params.set('lite', v === 'on' ? '1' : '0'); }
      location.search = params.toString();
    }
  });

  // ---------------------------------------------------------------- screens
  var screens = {};

  function nextClass() {
    var today = T.timetable.days.filter(function (d) { return d.today; })[0];
    if (!today) return null;
    var e = today.entries.filter(function (x) { return toMin(x.start) > NOW.minutes; })[0];
    return e ? { entry: e, inMin: toMin(e.start) - NOW.minutes, day: today.day } : null;
  }

  function ticket() {
    var tk = T.home.ticket;
    if (STATE === 'noDept') {
      return '<div class="ticket-wrap"><article class="ticket" aria-labelledby="tk-h"><div class="ticket__main">' +
        '<p class="ticket__label">' + icon('calendar', 'icon--sm') + t('home.ticket.label', { day: NOW.day }) + '</p>' +
        '<h2 class="item-title" id="tk-h">' + t('home.ticket.noneTitle') + '</h2><p class="muted">' + t('home.ticket.noneBody') + '</p></div>' +
        '<div class="ticket__stub"><a class="btn btn--primary" href="academics.html' + keep() + '">' + icon('book', 'icon--sm') + t('home.ticket.noneAction') + '</a></div></article></div>';
    }
    var n = nextClass();
    if (!n) return '';
    var e = n.entry;
    return '<div class="ticket-wrap"><article class="ticket" aria-labelledby="tk-h"><div class="ticket__main">' +
      '<p class="ticket__label">' + icon('clock', 'icon--sm') + '<span id="tk-h">' + t('home.ticket.label', { day: n.day }) + '</span></p>' +
      '<p class="ticket__time"><span class="num">' + esc(e.start) + '</span>' + chip(t('home.ticket.in', { n: n.inMin }), 'gold') + '</p>' +
      '<p class="ticket__course"><span class="code">' + esc(e.code) + '</span>' + esc(e.title) + '</p></div>' +
      '<div class="ticket__stub"><p class="ticket__venue">' + icon('pin', 'icon--sm') + '<span>' + esc(e.venue) + '</span></p>' +
      '<a class="btn btn--quiet" href="timetable.html' + keep() + '">' + t('home.ticket.timetable') + '</a></div></article></div>';
  }

  function liteSwitch() {
    var why = document.documentElement.getAttribute('data-lite');
    return '<div class="switch-row"><span class="label" id="lite-l">' + t('home.lite.label') + '</span>' +
      '<button class="switch" type="button" role="switch" aria-labelledby="lite-l" aria-describedby="lite-h lite-why" aria-checked="' + Boolean(why) + '" data-lite-switch></button>' +
      '<p class="hint" id="lite-h">' + t('home.lite.hint') + '</p>' +
      '<p class="hint" id="lite-why" data-lite-why>' + (why ? t('home.lite.why.' + why) : '') + '</p></div>';
  }

  screens.home = function () {
    var stations = T.home.signs.map(function (s, i) {
      return stop(i, { href: s.to + keep(), title: esc(s.title), sub: esc(s.sub), extra: s.extra ? chip(esc(s.extra), 'gold') : '', vt: s.key });
    }).join('');
    var n = T.notices.items[0];
    var offline = STATE === 'offline';
    var saved = STATE === 'syncFailed' ? '' :
      '<section class="plate plate--well" aria-labelledby="saved-h"><div class="plate__row">' + icon('route') + '<h2 id="saved-h" class="item-title">' + t('home.savedTitle') + '</h2></div>' +
      '<p>' + t('home.savedLine', { when: T.home.savedWhen }) + '</p>' +
      '<div class="btn-row"><button class="btn btn--secondary" type="button"' + (offline ? ' disabled aria-describedby="saved-off"' : '') + '>' +
      icon('refresh', 'icon--sm') + t('home.savedButton') + '</button>' +
      (offline ? '<span class="muted" id="saved-off">' + t('banners.offline') + '</span>' : '') + '</div>' + liteSwitch() + '</section>';
    shell(
      ticket() +
      '<div class="home-grid"><nav aria-label="' + t('home.postLabel') + '"><ol class="line" data-once="home-line">' + stations + '</ol></nav>' +
      '<div class="section" style="padding-top:0">' + saved +
      '<section aria-labelledby="latest-h" class="section"><div class="section__head"><h2 id="latest-h">' + t('home.latestTitle') + '</h2>' +
      '<a class="btn btn--quiet" href="announcements.html' + keep() + '">' + t('home.seeAll') + '</a></div>' +
      '<div class="notice"><p class="meta">' + chip(t('notices.scopes.university'), 'maroon') + '<span>' + t('notices.published', { date: n.date }) + '</span></p>' +
      '<p class="item-title">' + esc(n.title) + '</p></div>' + seal(n.status, n.updated, n.source) + '</section></div></div>',
      {
        band: band({ cls: 'band--tall', seed: 11, before: '<p class="band__hello">' + icon('clock', 'icon--sm') + t('home.hello.' + DAYPART) + '</p>', title: t('home.title'), lead: t('home.lead'), vt: 'home' }),
        banner: offline ? 'offline' : STATE === 'syncFailed' ? 'syncFailed' : '', states: ['offline', 'syncFailed', 'noDept'],
      }
    );
  };

  screens['first-sync'] = function () {
    var F = T.firstSync;
    var done = STATE === 'done';
    var total = F.stations.reduce(function (s, x) { return s + x.n; }, 0);
    var fmt = new Intl.NumberFormat('en-NG');
    var stations = F.stations.map(function (s, i) {
      var waiting = !done && !s.n;
      return stop(i, {
        cls: done ? 'stop--done' : waiting ? 'stop--wait' : '', done: done, title: esc(s.name),
        sub: waiting ? t('firstSync.waiting') : '<span class="num" data-count="' + s.n + '">' + fmt.format(s.n) + '</span> ' + t('firstSync.saved', { n: '' }).trim(),
      });
    }).join('');
    var body =
      '<svg class="mark mark--xl" viewBox="0 0 48 48" aria-hidden="true" focusable="false"' + (done ? '' : ' data-once="sync-mark"') + '>' +
      '<path class="mark__line" d="M33 12H19a6 6 0 0 0 0 12h10a6 6 0 0 1 0 12H15" pathLength="1"/><circle class="mark__from" cx="33" cy="12" r="4"/><circle class="mark__to" cx="15" cy="36" r="3.6"/></svg>' +
      '<h1 id="fs-h">' + t(done ? 'firstSync.doneTitle' : 'firstSync.title') + '</h1><p class="lead">' + t(done ? 'firstSync.doneLead' : 'firstSync.lead') + '</p>' +
      (done
        ? '<p role="status"><span class="count">' + fmt.format(total) + '</span><br>' + t('firstSync.doneTotal', { n: '' }).trim() + '</p>' +
          '<div class="progress" aria-hidden="true"><div class="progress__bar"></div></div>'
        : '<p role="status"><span class="count" data-count="' + total + '">' + fmt.format(total) + '</span><br>' + t('firstSync.progress', { count: '' }).trim() + '</p>' +
          '<div class="progress" role="progressbar" aria-label="' + t('firstSync.title') + '" data-loop><div class="progress__bar"></div></div>') +
      '<h2 class="visually-hidden">' + t('firstSync.stationsLabel') + '</h2><ol class="line">' + stations + '</ol>' +
      '<p class="band__meta">' + t('firstSync.sampleNote') + '</p>' +
      '<div class="btn-row">' + (done ? '<a class="btn btn--gold" href="home.html' + keep() + '">' + t('firstSync.doneAction') + icon('arrow', 'icon--sm') + '</a>'
        : '<button class="btn btn--secondary" type="button">' + t('firstSync.continue') + '</button>') + '</div>' +
      '<details class="source"><summary>' + icon('chevron-right', 'icon--sm') + t('firstSync.why') + '</summary><p>' + t('firstSync.whyBody') + '</p></details>';
    shell('', {
      title: done ? F.doneTitle : F.title, states: ['done'],
      band: '<section class="band sync' + (done ? ' sync--done' : '') + '" data-daypart="' + esc(DAYPART) + '" aria-labelledby="fs-h">' + A.contours(5, { h: 520, hills: 4 }) + '<div class="band__inner">' + body + '</div></section>',
    });
    if (done) M.buzz();
    else document.querySelectorAll('[data-count]').forEach(function (el) { M.count(el, Number(el.getAttribute('data-count')), 1600); });
  };

  screens.map = function () {
    var offline = STATE === 'offline';
    var q = STATE === 'searchEmpty' ? 'stadium' : '';
    var rows = q ? '' : T.map.buildings.map(function (b, i) {
      return '<li class="place"><div class="thumb" data-slot="building-' + (i + 1) + '" data-alt="' + t('map.photoAlt', { name: b.name }) + '" data-src="">' + icon('pin', 'icon--lg') + '</div>' +
        '<p class="item-title">' + esc(b.name) + '</p><p class="meta"><span>' + t('map.typeLabel') + ': ' + esc(b.type) + '</span></p>' +
        seal(b.status, b.updated, b.source) +
        '<div class="btn-row"><button class="btn btn--secondary" type="button"' + (offline ? ' disabled' : '') + '>' + icon('map', 'icon--sm') + t('map.directions') + '</button></div></li>';
    }).join('');
    shell(
      '<div class="map-slot" data-slot="map">' + A.contours(9, { h: 240, hills: 3 }) +
      (!offline && M.lite() ? '<div class="map-slot__note">' + icon('map') + '<div class="facts-wrap"><p>' + t('map.slotLite') + '</p><div class="btn-row"><button class="btn btn--secondary" type="button">' + t('map.loadMap') + '</button></div></div></div>'
        : '<p class="map-slot__note">' + icon(offline ? 'offline' : 'map') + '<span>' + t(offline ? 'map.slotOffline' : 'map.slot') + '</span></p>') + '</div>' +
      '<div class="field"><label for="b-search">' + t('map.searchLabel') + '</label><p class="hint" id="b-search-hint">' + t('map.searchHint') + '</p>' +
      '<div class="input-wrap">' + icon('search') + '<input class="input" id="b-search" type="search" autocomplete="off" aria-describedby="b-search-hint" value="' + esc(q) + '"></div></div>' +
      '<section class="section" aria-labelledby="b-h"><h2 id="b-h">' + t('map.listTitle') + '</h2>' +
      (q ? emptyState(t('map.noMatch', { q: q }), '', '', 'nomatch') : '<ul class="list">' + rows + '</ul>') + '</section>',
      { title: T.map.title, band: band({ seed: 9, title: t('map.title'), lead: t('map.lead'), vt: 'map' }), banner: offline ? 'offline' : '', states: ['offline', 'searchEmpty'] }
    );
  };

  screens.academics = function () {
    var body;
    if (STATE === 'loading') body = loading('academics.loading', 4);
    else if (STATE === 'error') body = errorState('academics.error', 'academics.retry');
    else if (STATE === 'empty') body = emptyState(t('banners.savingList'), t('academics.emptyHelp'), '');
    else body = '<ul class="list">' + T.academics.schools.map(function (s) {
      return '<li><a class="row-link" href="department.html' + keep() + '"><span class="code-chip">' + esc(s.short) + '</span><span class="row-link__body"><span class="row-link__title">' + esc(s.name) + '</span></span>' +
        '<span class="row-link__tip">' + icon('chevron-right') + '</span></a>' + seal(s.status, s.updated, s.source) + '</li>';
    }).join('') + '</ul>';
    shell(body, { title: T.academics.title, band: band({ seed: 4, title: t('academics.title'), lead: t('academics.lead'), vt: 'academics' }), banner: STATE === 'offline' ? 'offline' : '', states: ['loading', 'empty', 'error', 'offline'] });
  };

  screens.department = function () {
    var d = T.department;
    var head = back(t('department.back'), 'academics.html');
    function opt(title) {
      return { title: T.department.name, banner: STATE === 'offline' ? 'offline' : '', states: ['loading', 'empty', 'error', 'notFound', 'offline'],
        band: band({ cls: 'band--detail', seed: 6, back: head, title: title || t('department.titleFallback') }) };
    }
    if (STATE === 'loading') return shell(loading('department.loading', 3), opt());
    if (STATE === 'error') return shell(errorState('department.error', 'department.retry'), opt());
    if (STATE === 'notFound') return shell(emptyState(t('department.notFound'), t('academics.emptyHelp'), ''), opt());
    var empty = STATE === 'empty';
    var levels = {};
    d.courses.forEach(function (c) { (levels[c.level] = levels[c.level] || []).push(c); });
    var courses = empty ? emptyState(t('department.coursesEmpty'), '', '') : Object.keys(levels).map(function (lv) {
      return '<section class="section" aria-labelledby="lv-' + lv + '"><h3 id="lv-' + lv + '">' + t('department.levelHeading', { level: lv }) + '</h3><ul class="list">' +
        levels[lv].map(function (c) {
          return '<li><p class="item-title"><span class="code">' + esc(c.code) + '</span>' + esc(c.title) + '</p><p class="meta"><span>' +
            (c.units === 1 ? t('department.unit') : t('department.units', { n: c.units })) + '</span><span>' + t('department.semester', { n: c.semester }) + '</span></p>' +
            seal(c.status, c.updated, c.source) + '</li>';
        }).join('') + '</ul></section>';
    }).join('');
    var lecturers = empty ? emptyState(t('department.lecturersEmpty'), '', '') : '<ul class="list">' + d.lecturers.map(function (l) {
      return '<li class="person"><span class="monogram" aria-hidden="true">' + esc(A.initials(l.name)) + '</span><p class="item-title">' + esc(l.name) + '</p>' + (l.rank ? '<p class="muted">' + esc(l.rank) + '</p>' : '') +
        (l.office || l.email ? '<dl class="facts">' + (l.office ? '<dt>' + t('department.officeShort') + '</dt><dd>' + esc(l.office) + '</dd>' : '') +
          (l.email ? '<dt>' + t('department.emailLabel') + '</dt><dd><a href="mailto:' + esc(l.email) + '">' + esc(l.email) + '</a></dd>' : '') + '</dl>' : '') +
        seal(l.status, l.updated, l.source) + '</li>';
    }).join('') + '</ul>';
    var o = opt(esc(d.name));
    o.band = band({ cls: 'band--detail', seed: 6, slot: 'department-cover', alt: t('department.photoAlt'), back: head,
      before: '<p><span class="code-chip" title="' + t('department.codeLabel') + '">' + esc(d.short) + '</span></p>', title: esc(d.name) });
    shell(
      '<dl class="facts"><dt>' + t('department.hodLabel') + '</dt><dd>' + esc(d.hod) + '</dd><dt>' + t('department.officeLabel') + '</dt><dd>' + esc(d.office) + '</dd></dl>' +
      seal(d.status, d.updated, d.source) +
      '<a class="go-card" href="timetable.html' + keep() + '">' + icon('calendar', 'icon--lg icon--lit') + '<span class="row-link__body"><span class="go-card__title" style="view-transition-name:vt-timetable">' + t('department.timetableSign') + '</span><span class="muted">' +
      t('department.timetableSub') + '</span></span>' + icon('arrow', 'icon--lg') + '</a>' +
      '<section class="section" aria-labelledby="c-h"><h2 id="c-h">' + t('department.coursesTitle') + '</h2>' + courses + '</section>' +
      '<section class="section" aria-labelledby="l-h"><h2 id="l-h">' + t('department.lecturersTitle') + '</h2>' + lecturers + '</section>',
      o
    );
  };

  screens.timetable = function () {
    var tt = T.timetable;
    var o = { title: tt.title, banner: STATE === 'offline' ? 'offline' : '', states: ['loading', 'empty', 'levelEmpty', 'error', 'offline'],
      band: band({ cls: 'band--detail', seed: 8, back: back(t('timetable.back'), 'department.html'), title: t('timetable.title'), lead: esc(T.department.name), vt: 'timetable' }) };
    if (STATE === 'loading') return shell(loading('timetable.loading', 3), o);
    if (STATE === 'error') return shell(errorState('timetable.error', 'timetable.retry'), o);
    if (STATE === 'empty') return shell(emptyState(t('timetable.empty'), '', ''), o);
    var picker = '<div class="field" style="max-width:16rem"><label for="lv">' + t('timetable.levelLabel') + '</label><div class="select-wrap"><select class="select" id="lv">' +
      ['100', '200', '300'].map(function (l) { return '<option' + (l === '100' ? ' selected' : '') + '>' + t('department.levelHeading', { level: l }) + '</option>'; }).join('') +
      '</select>' + icon('chevron-right', 'icon--sm') + '</div></div>';
    if (STATE === 'levelEmpty') return shell(picker + emptyState(t('timetable.levelEmpty'), '', ''), o);
    var byDay = {};
    tt.days.forEach(function (d, i) { byDay[d.day] = i; });
    var week = '<nav class="week" aria-label="' + t('timetable.weekLabel') + '">' + tt.week.map(function (w) {
      var i = byDay[w[1]];
      if (i == null) return '<span>' + esc(w[0]) + '<small>' + t('timetable.noClasses') + '</small></span>';
      var d = tt.days[i];
      return '<a href="#d-' + i + '"' + (d.today ? ' aria-current="date"' : '') + ' aria-label="' + esc(w[1]) + (d.today ? ', ' + t('timetable.today') : '') + '">' + esc(w[0]) + '<small class="num">' + d.entries.length + '</small></a>';
    }).join('') + '</nav>';
    var days = tt.days.map(function (day, i) {
      var nowPlaced = false;
      var entries = day.entries.map(function (e) {
        var pre = '';
        var next = false;
        if (day.today && !nowPlaced && toMin(e.start) > NOW.minutes) {
          nowPlaced = true; next = true;
          pre = '<li class="now" aria-label="' + t('timetable.now', { time: NOW.time }) + '"><span class="now__tag">' + icon('clock', 'icon--sm') + t('timetable.now', { time: NOW.time }) + '</span></li>';
        }
        var course = e.code ? '<p class="item-title"><span class="code">' + esc(e.code) + '</span>' + esc(e.title) + '</p>' : '<p class="muted">' + t('timetable.courseMissing') + '</p>';
        return pre + '<li><p class="tt__time"><span class="tt__start">' + esc(e.start) + '</span><span class="tt__end">' + esc(e.end) + '</span></p><div class="tt__body">' +
          (next ? '<p>' + chip(t('timetable.nextIn', { n: toMin(e.start) - NOW.minutes }), 'gold') + '</p>' : '') + course +
          '<p class="tt__venue">' + icon('pin', 'icon--sm') + '<span>' + (e.venue ? esc(e.venue) : '<span class="muted">' + t('timetable.venueMissing') + '</span>') + '</span></p>' +
          '<p class="meta"><span>' + t('timetable.semester', { n: e.semester }) + '</span></p></div></li>';
      }).join('');
      return '<section class="day' + (day.today ? ' day--today' : '') + '" id="d-' + i + '" aria-labelledby="d-' + i + '-h"><div class="day__head"><h2 id="d-' + i + '-h">' + esc(day.day) + '</h2>' +
        (day.today ? chip(t('timetable.today'), 'solid') : '') + '</div><ul class="tt">' + entries + '</ul></section>';
    }).join('');
    shell(week + picker + '<p class="hint">' + t('timetable.note') + ' ' + t('home.ticket.sampleTime', { day: NOW.day, time: NOW.time }) + '</p>' + days, o);
  };

  screens.announcements = function () {
    var n = T.notices;
    var o = { title: n.title, band: band({ seed: 2, title: t('notices.title'), lead: t('notices.lead'), vt: 'notices' }), banner: STATE === 'offline' ? 'offline' : '', states: ['loading', 'empty', 'error', 'offline'] };
    if (STATE === 'loading') return shell(loading('notices.loading', 3), o);
    if (STATE === 'error') return shell(errorState('notices.error', 'notices.retry'), o);
    if (STATE === 'empty') return shell(emptyState(t('notices.emptyOnline'), '', ''), o);
    var kinds = { university: 'maroon', sug: 'gold', faculty: 'wash', department: 'outline' };
    var items = n.items.map(function (it, i) {
      var open = i === 0;
      var body = open ? esc(it.body) : esc(Array.from(it.body).slice(0, 90).join('').trimEnd()) + '…';
      var scope = n.scopes[it.scope] ? fill(n.scopes[it.scope], { name: it.name }) : '';
      return '<li class="notice"><p class="meta">' + chip(esc(scope), kinds[it.scope] || 'outline') + '<span>' + t('notices.published', { date: it.date }) + '</span>' +
        (i < 2 ? chip(t('notices.newTag'), 'gold') : '') + '</p>' +
        '<h2 class="item-title">' + esc(it.title) + '</h2>' +
        '<p class="notice__body" id="nb-' + i + '">' + body + '</p>' +
        '<button class="btn btn--quiet notice__more" type="button" aria-controls="nb-' + i + '" aria-expanded="' + open + '">' + t(open ? 'notices.less' : 'notices.more') + '</button>' +
        seal(it.status, it.updated, it.source) + '</li>';
    }).join('');
    shell('<ul class="list">' + items + '</ul>', o);
  };

  function field(id, label, opts) {
    opts = opts || {};
    var desc = [];
    if (opts.hint) desc.push(id + '-hint');
    if (opts.error) desc.push(id + '-error');
    return '<div class="field"><label for="' + id + '">' + label + '</label>' +
      (opts.hint ? '<p class="hint" id="' + id + '-hint">' + opts.hint + '</p>' : '') +
      (opts.control || '<input class="input" id="' + id + '" type="' + (opts.type || 'text') + '"' + (opts.auto ? ' autocomplete="' + opts.auto + '"' : '') +
        (opts.value ? ' value="' + esc(opts.value) + '"' : '') + (opts.error ? ' aria-invalid="true"' : '') +
        (desc.length ? ' aria-describedby="' + desc.join(' ') + '"' : '') + (opts.disabled ? ' disabled' : '') + '>') +
      (opts.error ? '<p class="field-error" id="' + id + '-error">' + icon('error', 'icon--sm') + '<span>' + opts.error + '</span></p>' : '') + '</div>';
  }
  function submitButton(label, sendingLabel) {
    return STATE === 'sending'
      ? '<button class="btn btn--primary is-loading" type="submit" disabled><span class="spinner" aria-hidden="true"></span>' + sendingLabel + '</button>'
      : '<button class="btn btn--primary" type="submit">' + label + '</button>';
  }

  screens.login = function () {
    var L = T.login;
    var invalid = STATE === 'invalid';
    var formError = { wrong: 'login.errWrong', busy: 'banners.busy', offline: 'login.errOffline' }[STATE];
    shell(
      '<div class="sheet-card">' +
      (STATE === 'registered' ? '<div class="alert alert--success" role="status">' + icon('success') + '<p>' + t('login.registered') + '</p></div>' : '') +
      '<form class="form" novalidate>' +
      field('l-email', t('login.email'), { type: 'email', auto: 'username', value: invalid ? 'student@' : STATE === 'default' || STATE === 'registered' ? '' : L.emailSample, error: invalid ? t('login.errEmail') : '' }) +
      field('l-pass', t('login.password'), { type: 'password', auto: 'current-password', error: invalid ? t('login.errPassword') : '' }) +
      (formError ? '<div class="alert alert--error" role="alert">' + icon('error') + '<p>' + t(formError) + '</p></div>' : '') +
      '<div class="btn-row">' + submitButton(t('login.submit'), t('login.sending')) + '</div></form></div>' +
      '<p>' + t('login.newHere') + ' <a href="register.html' + keep() + '">' + t('login.create') + '</a></p>',
      { title: L.title, band: band({ seed: 12, title: t('login.title'), lead: t('login.lead') }), banner: STATE === 'offline' ? 'offline' : '', states: ['registered', 'invalid', 'sending', 'wrong', 'busy', 'offline'] }
    );
  };

  screens.register = function () {
    var R = T.register;
    var invalid = STATE === 'invalid';
    var levels = '<div class="select-wrap"><select class="select" id="r-level"><option value="">' + t('register.levelChoose') + '</option>' +
      [100, 200, 300, 400, 500, 600, 700].map(function (l) { return '<option>' + l + '</option>'; }).join('') + '</select>' + icon('chevron-right', 'icon--sm') + '</div>';
    var depts = '<div class="select-wrap"><select class="select" id="r-dept" aria-describedby="r-dept-hint"><option value="">' + t('register.departmentChoose') + '</option></select>' + icon('chevron-right', 'icon--sm') + '</div>';
    shell(
      '<div class="sheet-card">' +
      (invalid ? '<div class="alert alert--error" role="alert" tabindex="-1">' + icon('error') + '<div><p><strong>' + t('register.errorSummary') + '</strong></p><ul>' +
        '<li><a href="#r-name">' + t('register.errName') + '</a></li><li><a href="#r-email">' + t('register.errEmail') + '</a></li><li><a href="#r-pass">' + t('register.errPassword') + '</a></li></ul></div></div>' : '') +
      '<form class="form" novalidate>' +
      field('r-name', t('register.name'), { auto: 'name', value: invalid ? 'A' : '', error: invalid ? t('register.errName') : '' }) +
      field('r-email', t('register.email'), { type: 'email', auto: 'username', value: invalid ? 'student@example' : '', error: invalid ? t('register.errEmail') : '' }) +
      field('r-pass', t('register.password'), { type: 'password', auto: 'new-password', hint: t('register.passwordHint'), error: invalid ? t('register.errPassword') : '' }) +
      field('r-matric', t('register.matric'), { hint: t('register.matricHint') }) +
      field('r-dept', t('register.department'), { hint: t('register.departmentHelp'), control: depts }) +
      field('r-level', t('register.level'), { control: levels }) +
      (STATE === 'busy' ? '<div class="alert alert--error" role="alert">' + icon('error') + '<p>' + t('banners.busy') + '</p></div>' : '') +
      '<div class="btn-row">' + submitButton(t('register.submit'), t('register.sending')) + '</div></form></div>' +
      '<p>' + t('register.have') + ' <a href="login.html' + keep() + '">' + t('login.title') + '</a></p>',
      { title: R.title, band: band({ seed: 13, title: t('register.title'), lead: t('register.lead') }), states: ['invalid', 'sending', 'busy'] }
    );
  };

  screens.admin = function () {
    var A2 = T.admin;
    var o = { title: A2.title, signedIn: STATE !== 'signedOut', states: ['signedOut', 'notAdmin', 'session', 'loading', 'empty', 'error', 'busy', 'confirm', 'published', 'invalid'] };
    var lead = STATE === 'signedOut' || STATE === 'notAdmin' ? '' : t('admin.signedInAs', { name: A2.adminName, role: A2.adminRole });
    o.band = band({ seed: 14, title: t('admin.title'), lead: lead });
    if (STATE === 'signedOut') return shell(emptyState(t('admin.gateLogin'), '', '<a class="btn btn--primary" href="login.html' + keep() + '">' + t('admin.gateLoginLink') + '</a>'), Object.assign(o, { signedIn: false }));
    if (STATE === 'notAdmin') return shell('<div class="state">' + icon('lock', 'icon--lg') + '<p class="state__title">' + t('admin.gateNotAdmin') + '</p><p>' + t('admin.gateNotAdminHelp') + '</p></div>', o);
    var tabs = '<nav class="page-tabs" aria-label="' + t('admin.tabsLabel') + '"><a href="#compose" aria-current="true">' + t('admin.tabCompose') + '</a><a href="#manage">' + t('admin.tabManage') +
      '</a><a href="#verify">' + t('admin.tabVerify') + '</a></nav>';
    var invalid = STATE === 'invalid';
    var title = invalid ? 'ab' : A2.sampleTitle;
    var formAlert = STATE === 'session' ? '<div class="alert alert--error" role="alert">' + icon('lock') + '<p>' + t('banners.sessionEnded') + ' <a href="login.html' + keep() + '">' + t('login.title') + '</a></p></div>'
      : STATE === 'busy' ? '<div class="alert alert--error" role="alert">' + icon('error') + '<p>' + t('banners.busy') + '</p></div>'
      : STATE === 'published' ? '<div class="alert alert--success" role="status">' + icon('success') + '<p>' + t('admin.published', { title: A2.sampleTitle }) + '</p></div>' : '';
    var scopeSel = '<div class="select-wrap"><select class="select" id="a-scope">' + A2.scopeOptions.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select>' + icon('chevron-right', 'icon--sm') + '</div>';
    var targetSel = '<div class="select-wrap"><select class="select" id="a-target"><option>' + esc(A2.targetValue) + '</option></select>' + icon('chevron-right', 'icon--sm') + '</div>';
    var compose = '<section class="section" id="compose" aria-labelledby="compose-h"><h2 id="compose-h">' + t('admin.composeTitle') + '</h2><p class="lead">' + t('admin.composeLead') + '</p>' +
      '<form class="form" novalidate>' +
      field('a-title', t('admin.fieldTitle'), { hint: t('admin.titleCount', { n: Array.from(title).length }), value: STATE === 'published' ? '' : title, error: invalid ? t('admin.errTitle') : '' }) +
      field('a-body', t('admin.fieldBody'), { hint: t('admin.bodyCount', { n: Array.from(A2.sampleBody).length }), control: '<textarea class="textarea" id="a-body" aria-describedby="a-body-hint">' + (STATE === 'published' ? '' : esc(A2.sampleBody)) + '</textarea>' }) +
      field('a-scope', t('admin.fieldScope'), { control: scopeSel }) +
      field('a-target', t('admin.fieldTarget'), { control: targetSel }) +
      field('a-exp', t('admin.fieldExpires'), { type: 'datetime-local', hint: t('admin.expiresHint') }) +
      formAlert + '<div class="btn-row">' + submitButton(t('admin.publish'), t('admin.publishing')) + '</div></form></section>';
    var manageBody;
    if (STATE === 'loading') manageBody = loading('admin.manageLoading', 2);
    else if (STATE === 'error') manageBody = errorState('admin.manageError', 'academics.retry');
    else if (STATE === 'empty') manageBody = emptyState(t('admin.manageEmpty'), '', '', 'arrived');
    else manageBody = '<ul class="list">' + A2.manageItems.map(function (m, i) {
      var confirm = STATE === 'confirm' && i === 0;
      return '<li><p class="item-title">' + esc(m.title) + '</p><p class="meta"><span>' + esc(m.scope) + '</span><span>' + t('notices.published', { date: m.date }) + '</span><span>' +
        (m.expires ? t('admin.expires', { date: m.expires }) : t('admin.noExpiry')) + '</span></p>' +
        (confirm
          ? '<div class="inline-confirm" role="group" aria-label="' + t('admin.delete') + '"><p>' + t('admin.confirmDelete') + '</p><div class="btn-row"><button class="btn btn--danger" type="button">' + icon('trash', 'icon--sm') + t('admin.yesDelete') +
            '</button><button class="btn btn--secondary" type="button">' + t('admin.cancel') + '</button></div></div>'
          : '<div class="btn-row"><button class="btn btn--secondary" type="button">' + icon('edit', 'icon--sm') + t('admin.edit') + '</button><button class="btn btn--quiet" type="button">' + t('admin.delete') + '</button></div>') + '</li>';
    }).join('') + '</ul>';
    var manage = '<section class="section" id="manage" aria-labelledby="manage-h"><h2 id="manage-h">' + t('admin.manageTitle') + '</h2><p class="lead">' + t('admin.manageLead') + '</p>' + manageBody + '</section>';
    var verifyItems = STATE === 'empty' ? emptyState(t('admin.verifyEmpty'), '', '', 'arrived') : '<ul class="list">' + A2.verifyItems.map(function (v, i) {
      var needSource = STATE === 'invalid' && i === 0;
      return '<li data-verify-item><p class="kind">' + esc(v.kind) + '</p><p class="item-title">' + esc(v.title) + '</p><p class="muted">' + esc(v.detail) + '</p><div data-seal>' + seal(v.status, v.updated, v.source) + '</div>' +
        field('v-src-' + i, t('admin.sourceLabel'), { hint: t('admin.sourceHint'), error: needSource ? t('admin.sourceNeeded') : '' }) +
        '<div class="btn-row"><button class="btn btn--primary" type="button" data-verify' + (needSource ? ' data-needs-source' : '') + '>' + icon('check', 'icon--sm') + t('admin.markVerified') + '</button><button class="btn btn--secondary" type="button">' + icon('alert', 'icon--sm') + t('admin.markOutdated') + '</button></div></li>';
    }).join('') + '</ul>';
    var verify = '<section class="section" id="verify" aria-labelledby="verify-h"><h2 id="verify-h">' + t('admin.verifyTitle') + '</h2><p class="lead">' + t('admin.verifyLead') + '</p>' +
      '<div class="alert alert--info" role="note">' + icon('info') + '<p>' + t('admin.verifySoon') + '</p></div>' +
      '<div class="field"><span class="label" id="vf">' + t('admin.verifyFilterLabel') + '</span><div class="choice" role="group" aria-labelledby="vf">' +
      A2.verifyFilters.map(function (f, i) { return '<button type="button" aria-pressed="' + (i === 0) + '">' + esc(f) + '</button>'; }).join('') + '</div></div>' + verifyItems + '</section>';
    shell(tabs + compose + manage + verify, o);
  };

  // The component sheet and the index live in sheet.js, which only those two pages load.
  if (window.SABI_SHEET) window.SABI_SHEET({ screens: screens, T: T, A: A, M: M, icon: icon, t: t, esc: esc, fill: fill, chip: chip, stop: stop, seal: seal, skeleton: skeleton,
    errorState: errorState, emptyState: emptyState, banner: banner, topbar: topbar, links: links, band: band, ticket: ticket, liteSwitch: liteSwitch, shell: shell, keep: keep, DAYPART: DAYPART });
  (screens[SCREEN] || screens.index || function () {})();

  // ---------------------------------------------------------------- interactions that work in the prototype
  document.addEventListener('click', function (e) {
    // Open and close a notice. The text change morphs (View Transitions) where allowed.
    var b = e.target.closest && e.target.closest('[aria-controls^="nb-"]');
    if (b) {
      var id = b.getAttribute('aria-controls');
      var item = T.notices.items[Number(id.slice(3))];
      var open = b.getAttribute('aria-expanded') !== 'true';
      M.morph(function () {
        b.setAttribute('aria-expanded', String(open));
        document.getElementById(id).textContent = open ? item.body : Array.from(item.body).slice(0, 90).join('').trimEnd() + '…';
        b.textContent = fill(open ? T.notices.less : T.notices.more);
      });
      return;
    }
    // Mark verified: the seal stamps on, with a short buzz on Android.
    var v = e.target.closest && e.target.closest('[data-verify]');
    if (v && !v.hasAttribute('data-needs-source')) {
      var holder = v.closest('[data-verify-item]').querySelector('[data-seal]');
      holder.innerHTML = seal('verified', T.admin.verifiedNow, holder.querySelector('.source p') ? holder.querySelector('.source p').textContent : '', !M.calm());
      M.buzz();
      return;
    }
    // The Lite switch.
    var sw = e.target.closest && e.target.closest('[data-lite-switch]');
    if (sw) M.setLite(sw.getAttribute('aria-checked') !== 'true');
  });
  document.addEventListener('sabi:lite', function () {
    var why = document.documentElement.getAttribute('data-lite');
    document.querySelectorAll('[data-lite-why]').forEach(function (p) { p.textContent = why ? fill(get('home.lite.why.' + why)) : ''; });
  });
})();
