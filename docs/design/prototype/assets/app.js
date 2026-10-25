// Draws each prototype screen from window.SABI_TEXT (assets/strings.js). No network, no build.
// A page says which screen it is with <body data-screen="...">. Its state comes from ?state=...
// and the prototype bar; the theme from ?theme=light|dark or the bar (kept in localStorage).
(function () {
  'use strict';
  var T = window.SABI_TEXT;
  var params = new URLSearchParams(location.search);
  var STATE = params.get('state') || 'default';
  var SCREEN = document.body.getAttribute('data-screen');
  if (params.get('proto') === '0') document.body.classList.add('no-proto');
  // ?text=200 doubles the root text size, to check the screens at 200% text (WCAG 1.4.4).
  if (params.get('text')) document.documentElement.style.fontSize = Number(params.get('text')) + '%';

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

  // ---------------------------------------------------------------- icons (one set, 24px grid, 2px stroke)
  var PATHS = {
    home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5z"/><path d="M4 20a2 2 0 0 0 2 1h13"/><path d="M9 7h6"/>',
    notice: '<path d="M4 9v6h3l7 4V5L7 9H4z"/><path d="M18 9a4 4 0 0 1 0 6"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    'chevron-right': '<path d="m9 5 7 7-7 7"/>',
    'chevron-left': '<path d="m15 5-7 7 7 7"/>',
    arrow: '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
    check: '<path d="m5 12 4 4 10-10"/>',
    dashed: '<circle cx="12" cy="12" r="7" stroke-dasharray="3 3"/>',
    alert: '<path d="M12 4 3 20h18L12 4z"/><path d="M12 10v4M12 17v.5"/>',
    info: '<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8v.5"/>',
    offline: '<path d="M7 18h10a4 4 0 0 0 .8-7.9A6 6 0 0 0 7 9a4.5 4.5 0 0 0 0 9z"/><path d="m4 4 16 16"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.6 4.5L20 16"/><path d="M20 20v-4h-4"/>',
    pin: '<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
    trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    error: '<circle cx="12" cy="12" r="8"/><path d="m9 9 6 6M15 9l-6 6"/>',
    success: '<circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    sign: '<path d="M12 21V3"/><path d="M5 5h11l3 3-3 3H5z"/><path d="M19 13H8l-3 3 3 3h11z"/>',
    shield: '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3z"/><path d="m9 12 2 2 4-4"/>',
  };
  function icon(name, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + PATHS[name] + '</svg>';
  }

  // ---------------------------------------------------------------- shared pieces
  var TABS = [
    { key: 'home', href: 'home.html', icon: 'home' },
    { key: 'map', href: 'map.html', icon: 'map' },
    { key: 'academics', href: 'academics.html', icon: 'book' },
    { key: 'notices', href: 'announcements.html', icon: 'notice' },
  ];
  var CURRENT = { home: 'home', 'first-sync': 'home', map: 'map', academics: 'academics', department: 'academics', timetable: 'academics', announcements: 'notices' }[SCREEN];

  function links(cls) {
    return TABS.map(function (tab) {
      var cur = CURRENT === tab.key ? ' aria-current="page"' : '';
      return '<a href="' + tab.href + keep() + '"' + cur + '>' + icon(tab.icon) + '<span>' + t('shell.' + tab.key) + '</span></a>';
    }).join('');
  }
  function keep() {
    var p = new URLSearchParams();
    if (params.get('proto')) p.set('proto', params.get('proto'));
    var s = p.toString();
    return s ? '?' + s : '';
  }
  function topbar(opts) {
    var right = opts.signedIn
      ? '<a href="admin.html' + keep() + '">' + icon('shield') + '<span>' + t('shell.admin') + '</span></a>'
      : '<a href="login.html' + keep() + '">' + icon('user') + '<span>' + t('shell.login') + '</span></a>';
    return (
      '<header class="topbar"><div class="topbar__inner">' +
      '<a class="wordmark" href="home.html' + keep() + '" aria-label="' + t('app.name') + ', ' + t('shell.home') + '">' +
      '<span class="wordmark__mark">' + icon('sign', 'icon--lg') + '</span><span>' + t('app.name') + '</span></a>' +
      '<nav class="topbar__tabs" aria-label="' + t('shell.navLabel') + '">' + links() + '</nav>' +
      '<span class="topbar__spacer"></span>' + right + '</div></header>'
    );
  }
  function banner(kind) {
    if (kind === 'offline')
      return '<div class="banner banner--offline" role="status">' + icon('offline') + '<span class="banner__text">' + t('banners.offline') + '</span></div>';
    if (kind === 'syncFailed')
      return '<div class="banner banner--warn" role="status">' + icon('alert') + '<span class="banner__text">' + t('banners.syncFailed') + '</span><button class="btn btn--secondary" type="button">' + icon('refresh', 'icon--sm') + t('banners.tryAgain') + '</button></div>';
    return '';
  }
  function shell(content, opts) {
    opts = opts || {};
    var banners = opts.banner ? banner(opts.banner) : '';
    document.getElementById('app').innerHTML =
      '<a class="skip" href="#main">' + t('shell.skip') + '</a>' +
      topbar(opts) + banners +
      '<main id="main" class="page" tabindex="-1">' + content + '</main>' +
      '<nav class="tabs" aria-label="' + t('shell.navLabel') + '">' + links() + '</nav>' +
      protoBar(opts.states || []);
    document.title = (opts.title ? opts.title + ' | ' : '') + T.app.name;
  }
  function seal(status, updated, source) {
    var map = {
      verified: ['seal--verified', 'check', 'verification.verified'],
      unverified: ['seal--unverified', 'dashed', 'verification.unverified'],
      outdated: ['seal--outdated', 'alert', 'verification.outdated'],
    };
    var m = map[status] || ['seal--unverified', 'info', 'verification.unknown'];
    return (
      '<div class="facts-wrap"><p class="seal-line"><span class="seal ' + m[0] + '">' + icon(m[1], 'icon--sm') + t(m[2]) + '</span>' +
      '<span class="seal-line__date">' + (updated ? t('verification.updated', { date: updated }) : t('verification.updatedUnknown')) + '</span></p>' +
      '<details class="source"><summary>' + icon('chevron-right', 'icon--sm') + t('verification.source') + '</summary><p>' +
      (source ? esc(source) : t('verification.noSource')) + '</p></details></div>'
    );
  }
  function back(label, href) {
    return '<a class="back" href="' + href + keep() + '">' + icon('chevron-left', 'icon--sm') + label + '</a>';
  }
  function skeleton(rows) {
    var out = '<div class="skeleton" aria-hidden="true">';
    for (var i = 0; i < rows; i++) out += '<div class="skeleton__row"><div class="skeleton__bar skeleton__bar--title"></div><div class="skeleton__bar"></div><div class="skeleton__bar skeleton__bar--short"></div></div>';
    return out + '</div>';
  }
  function loading(textPath, rows) {
    return '<p role="status" class="muted">' + t(textPath) + '</p>' + skeleton(rows || 3);
  }
  function errorState(textPath, retryPath) {
    return '<div class="state state--error" role="alert">' + icon('error', 'icon--lg') +
      '<p class="state__body">' + t(textPath) + '</p>' +
      '<button class="btn btn--secondary" type="button">' + icon('refresh', 'icon--sm') + t(retryPath) + '</button></div>';
  }
  function emptyState(titleText, bodyText, action) {
    return '<div class="state" role="status">' + icon('sign', 'icon--lg') +
      '<p class="state__title">' + titleText + '</p>' + (bodyText ? '<p>' + bodyText + '</p>' : '') + (action || '') + '</div>';
  }

  // ---------------------------------------------------------------- the prototype bar
  function protoBar(states) {
    var opts = ['default'].concat(states).map(function (s) {
      return '<option value="' + s + '"' + (s === STATE ? ' selected' : '') + '>' + t('proto.states.' + s) + '</option>';
    }).join('');
    var mode = document.documentElement.getAttribute('data-mode') || 'auto';
    var themes = ['auto', 'light', 'dark'].map(function (m) {
      return '<option value="' + m + '"' + (m === mode ? ' selected' : '') + '>' + t('proto.themes.' + m) + '</option>';
    }).join('');
    return '<details class="proto"><summary>' + t('proto.bar') + '</summary><div class="proto__body">' +
      (states.length ? '<label>' + t('proto.state') + '<select data-proto="state">' + opts + '</select></label>' : '') +
      '<label>' + t('proto.theme') + '<select data-proto="theme">' + themes + '</select></label>' +
      '<a href="index.html">' + t('proto.index') + '</a></div></details>';
  }
  document.addEventListener('change', function (e) {
    var kind = e.target.getAttribute && e.target.getAttribute('data-proto');
    if (kind === 'state') { params.set('state', e.target.value); location.search = params.toString(); }
    if (kind === 'theme') {
      var v = e.target.value;
      try { v === 'auto' ? localStorage.removeItem('sabi-proto-mode') : localStorage.setItem('sabi-proto-mode', v); } catch (err) { /* storage blocked: this view only */ }
      if (v === 'auto') document.documentElement.removeAttribute('data-mode');
      else document.documentElement.setAttribute('data-mode', v);
    }
  });

  // ---------------------------------------------------------------- screens
  var screens = {};

  screens.home = function () {
    var signs = T.home.signs.map(function (s, i) {
      return '<a class="sign' + (i === 0 ? '' : '') + '" href="' + s.to + keep() + '"><span><span class="sign__title">' + esc(s.title) +
        '</span><span class="sign__sub">' + esc(s.sub) + '</span></span><span class="sign__go">' + icon('arrow', 'icon--lg') + '</span></a>';
    }).join('');
    var n = T.notices.items[0];
    var saved = STATE === 'syncFailed' ? '' :
      '<section class="plate plate--well" aria-labelledby="saved-h"><h2 id="saved-h" class="item-title">' + t('home.savedTitle') + '</h2>' +
      '<p>' + t('home.savedLine', { when: T.home.savedWhen }) + '</p>' +
      '<div class="btn-row"><button class="btn btn--secondary" type="button"' + (STATE === 'offline' ? ' disabled aria-describedby="saved-off"' : '') + '>' +
      icon('refresh', 'icon--sm') + t('home.savedButton') + '</button>' +
      (STATE === 'offline' ? '<span class="muted" id="saved-off">' + t('banners.offline') + '</span>' : '') + '</div></section>';
    shell(
      '<header><h1>' + t('home.title') + '</h1><p class="lead">' + t('home.lead') + '</p></header>' +
      '<div class="home-grid"><nav class="post" aria-label="' + t('home.postLabel') + '">' + signs + '</nav>' +
      '<div class="section" style="padding-top:0">' + saved +
      '<section aria-labelledby="latest-h" class="section"><div class="section__head"><h2 id="latest-h">' + t('home.latestTitle') + '</h2>' +
      '<a class="btn btn--quiet" href="announcements.html' + keep() + '">' + t('home.seeAll') + '</a></div>' +
      '<div class="facts-wrap"><p class="item-title">' + esc(n.title) + '</p><p class="meta"><span>' + t('notices.scopes.university') + '</span><span>' +
      t('notices.published', { date: n.date }) + '</span></p></div>' + seal(n.status, n.updated, n.source) + '</section></div></div>',
      { banner: STATE === 'offline' ? 'offline' : STATE === 'syncFailed' ? 'syncFailed' : '', states: ['offline', 'syncFailed'] }
    );
  };

  screens['first-sync'] = function () {
    shell(
      '<header><h1 id="fs-h">' + t('firstSync.title') + '</h1><p class="lead">' + t('firstSync.lead') + '</p></header>' +
      '<section class="plate" aria-labelledby="fs-h"><div class="progress" role="progressbar" aria-label="' + t('firstSync.title') + '"><div class="progress__bar"></div></div>' +
      '<p role="status"><span class="count">' + esc(T.firstSync.count) + '</span><br>' + t('firstSync.progress', { count: '' }).replace(/^\s+/, '') + '</p>' +
      '<div class="btn-row"><button class="btn btn--secondary" type="button">' + t('firstSync.continue') + '</button></div></section>' +
      '<details class="source"><summary>' + icon('chevron-right', 'icon--sm') + t('firstSync.why') + '</summary><p>' + t('firstSync.whyBody') + '</p></details>',
      { title: T.firstSync.title }
    );
  };

  screens.map = function () {
    var offline = STATE === 'offline';
    var q = STATE === 'searchEmpty' ? 'stadium' : '';
    var rows = q ? '' : T.map.buildings.map(function (b) {
      return '<li><p class="item-title">' + esc(b.name) + '</p><p class="meta"><span>' + t('map.typeLabel') + ': ' + esc(b.type) + '</span></p>' +
        seal(b.status, b.updated, b.source) +
        '<div class="btn-row"><button class="btn btn--secondary" type="button"' + (offline ? ' disabled' : '') + '>' + icon('pin', 'icon--sm') + t('map.directions') + '</button></div></li>';
    }).join('');
    shell(
      '<header><h1>' + t('map.title') + '</h1><p class="lead">' + t('map.lead') + '</p></header>' +
      '<div class="map-slot" data-slot="map">' + icon(offline ? 'offline' : 'map', 'icon--lg') + '<p>' + t(offline ? 'map.slotOffline' : 'map.slot') + '</p></div>' +
      '<div class="field"><label for="b-search">' + t('map.searchLabel') + '</label><p class="hint" id="b-search-hint">' + t('map.searchHint') + '</p>' +
      '<input class="input" id="b-search" type="search" autocomplete="off" aria-describedby="b-search-hint" value="' + esc(q) + '"></div>' +
      '<section class="section" aria-labelledby="b-h"><h2 id="b-h">' + t('map.listTitle') + '</h2>' +
      (q ? emptyState(t('map.noMatch', { q: q }), '', '') : '<ul class="list">' + rows + '</ul>') + '</section>',
      { title: T.map.title, banner: offline ? 'offline' : '', states: ['offline', 'searchEmpty'] }
    );
  };

  screens.academics = function () {
    var body;
    if (STATE === 'loading') body = loading('academics.loading', 4);
    else if (STATE === 'error') body = errorState('academics.error', 'academics.retry');
    else if (STATE === 'empty') body = emptyState(t('banners.savingList'), t('academics.emptyHelp'), '');
    else body = '<ul class="list">' + T.academics.schools.map(function (s) {
      return '<li><a class="row-link" href="department.html' + keep() + '"><span><span class="row-link__title">' + esc(s.name) + '</span>' +
        '<span class="meta"><span>' + esc(s.short) + '</span></span></span><span class="row-link__tip">' + icon('chevron-right') + '</span></a>' +
        seal(s.status, s.updated, s.source) + '</li>';
    }).join('') + '</ul>';
    shell('<header><h1>' + t('academics.title') + '</h1><p class="lead">' + t('academics.lead') + '</p></header>' + body,
      { title: T.academics.title, banner: STATE === 'offline' ? 'offline' : '', states: ['loading', 'empty', 'error', 'offline'] });
  };

  screens.department = function () {
    var d = T.department;
    var head = back(t('department.back'), 'academics.html');
    if (STATE === 'loading') return shell(head + '<h1>' + t('department.titleFallback') + '</h1>' + loading('department.loading', 3), opt());
    if (STATE === 'error') return shell(head + '<h1>' + t('department.titleFallback') + '</h1>' + errorState('department.error', 'department.retry'), opt());
    if (STATE === 'notFound') return shell(head + '<h1>' + t('department.titleFallback') + '</h1>' + emptyState(t('department.notFound'), t('academics.emptyHelp'), ''), opt());
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
      return '<li><p class="item-title">' + esc(l.name) + '</p>' + (l.rank ? '<p class="muted">' + esc(l.rank) + '</p>' : '') +
        (l.office || l.email ? '<dl class="facts">' + (l.office ? '<dt>' + t('department.officeShort') + '</dt><dd>' + esc(l.office) + '</dd>' : '') +
          (l.email ? '<dt>' + t('department.emailLabel') + '</dt><dd><a href="mailto:' + esc(l.email) + '">' + esc(l.email) + '</a></dd>' : '') + '</dl>' : '') +
        seal(l.status, l.updated, l.source) + '</li>';
    }).join('') + '</ul>';
    shell(
      head + '<header><h1>' + esc(d.name) + '</h1><p class="muted">' + esc(d.short) + '</p></header>' +
      '<dl class="facts"><dt>' + t('department.hodLabel') + '</dt><dd>' + esc(d.hod) + '</dd><dt>' + t('department.officeLabel') + '</dt><dd>' + esc(d.office) + '</dd></dl>' +
      seal(d.status, d.updated, d.source) +
      '<a class="sign sign--gold" href="timetable.html' + keep() + '"><span><span class="sign__title">' + t('department.timetableSign') + '</span><span class="sign__sub">' +
      t('department.timetableSub') + '</span></span><span class="sign__go">' + icon('arrow', 'icon--lg') + '</span></a>' +
      '<section class="section" aria-labelledby="c-h"><h2 id="c-h">' + t('department.coursesTitle') + '</h2>' + courses + '</section>' +
      '<section class="section" aria-labelledby="l-h"><h2 id="l-h">' + t('department.lecturersTitle') + '</h2>' + lecturers + '</section>',
      opt()
    );
    function opt() { return { title: T.department.name, banner: STATE === 'offline' ? 'offline' : '', states: ['loading', 'empty', 'error', 'notFound', 'offline'] }; }
  };

  screens.timetable = function () {
    var tt = T.timetable;
    var head = back(t('timetable.back'), 'department.html') + '<header><h1>' + t('timetable.title') + '</h1><p class="muted">' + esc(T.department.name) + '</p></header>';
    var o = { title: tt.title, banner: STATE === 'offline' ? 'offline' : '', states: ['loading', 'empty', 'levelEmpty', 'error', 'offline'] };
    if (STATE === 'loading') return shell(head + loading('timetable.loading', 3), o);
    if (STATE === 'error') return shell(head + errorState('timetable.error', 'timetable.retry'), o);
    if (STATE === 'empty') return shell(head + emptyState(t('timetable.empty'), '', ''), o);
    var picker = '<div class="field" style="max-width:16rem"><label for="lv">' + t('timetable.levelLabel') + '</label><div class="select-wrap"><select class="select" id="lv">' +
      ['100', '200', '300'].map(function (l) { return '<option' + (l === '100' ? ' selected' : '') + '>' + t('department.levelHeading', { level: l }) + '</option>'; }).join('') +
      '</select>' + icon('chevron-right', 'icon--sm') + '</div></div>';
    if (STATE === 'levelEmpty') return shell(head + picker + emptyState(t('timetable.levelEmpty'), '', ''), o);
    var days = tt.days.map(function (day, i) {
      return '<section class="day' + (day.today ? ' day--today' : '') + '" aria-labelledby="d-' + i + '"><div class="day__head"><h2 id="d-' + i + '">' + esc(day.day) + '</h2>' +
        (day.today ? '<span class="today-tag">' + t('timetable.today') + '</span>' : '') + '</div><ul class="tt">' +
        day.entries.map(function (e) {
          var course = e.code ? '<p class="item-title"><span class="code">' + esc(e.code) + '</span>' + esc(e.title) + '</p>' : '<p class="muted">' + t('timetable.courseMissing') + '</p>';
          return '<li><p class="tt__time"><span class="tt__start">' + esc(e.start) + '</span><span class="tt__end">' + esc(e.end) + '</span></p><div class="tt__body">' + course +
            '<p class="tt__venue">' + icon('pin', 'icon--sm') + '<span>' + (e.venue ? esc(e.venue) : '<span class="muted">' + t('timetable.venueMissing') + '</span>') + '</span></p>' +
            '<p class="meta"><span>' + t('timetable.semester', { n: e.semester }) + '</span></p></div></li>';
        }).join('') + '</ul></section>';
    }).join('');
    shell(head + picker + '<p class="hint">' + t('timetable.note') + '</p>' + days, o);
  };

  screens.announcements = function () {
    var n = T.notices;
    var o = { title: n.title, banner: STATE === 'offline' ? 'offline' : '', states: ['loading', 'empty', 'error', 'offline'] };
    var head = '<header><h1>' + t('notices.title') + '</h1><p class="lead">' + t('notices.lead') + '</p></header>';
    if (STATE === 'loading') return shell(head + loading('notices.loading', 3), o);
    if (STATE === 'error') return shell(head + errorState('notices.error', 'notices.retry'), o);
    if (STATE === 'empty') return shell(head + emptyState(t('notices.emptyOnline'), '', ''), o);
    var items = n.items.map(function (it, i) {
      var open = i === 0;
      var body = open ? esc(it.body) : esc(Array.from(it.body).slice(0, 90).join('').trimEnd()) + '…';
      var scope = n.scopes[it.scope] ? fill(n.scopes[it.scope], { name: it.name }) : '';
      return '<li><h2 class="item-title">' + esc(it.title) + '</h2>' +
        '<p class="meta"><span>' + esc(scope) + '</span><span>' + t('notices.published', { date: it.date }) + '</span></p>' +
        '<p class="notice__body" id="nb-' + i + '">' + body + '</p>' +
        '<button class="btn btn--quiet notice__more" type="button" aria-controls="nb-' + i + '" aria-expanded="' + open + '">' + t(open ? 'notices.less' : 'notices.more') + '</button>' +
        seal(it.status, it.updated, it.source) + '</li>';
    }).join('');
    shell(head + '<ul class="list">' + items + '</ul>', o);
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
      '<header><h1>' + t('login.title') + '</h1><p class="lead">' + t('login.lead') + '</p></header>' +
      (STATE === 'registered' ? '<div class="alert alert--success" role="status">' + icon('success') + '<p>' + t('login.registered') + '</p></div>' : '') +
      '<form class="form" novalidate>' +
      field('l-email', t('login.email'), { type: 'email', auto: 'username', value: invalid ? 'student@' : STATE === 'default' || STATE === 'registered' ? '' : L.emailSample, error: invalid ? t('login.errEmail') : '' }) +
      field('l-pass', t('login.password'), { type: 'password', auto: 'current-password', error: invalid ? t('login.errPassword') : '' }) +
      (formError ? '<div class="alert alert--error" role="alert">' + icon('error') + '<p>' + t(formError) + '</p></div>' : '') +
      '<div class="btn-row">' + submitButton(t('login.submit'), t('login.sending')) + '</div></form>' +
      '<p>' + t('login.newHere') + ' <a href="register.html' + keep() + '">' + t('login.create') + '</a></p>',
      { title: L.title, banner: STATE === 'offline' ? 'offline' : '', states: ['registered', 'invalid', 'sending', 'wrong', 'busy', 'offline'] }
    );
  };

  screens.register = function () {
    var R = T.register;
    var invalid = STATE === 'invalid';
    var levels = '<div class="select-wrap"><select class="select" id="r-level"><option value="">' + t('register.levelChoose') + '</option>' +
      [100, 200, 300, 400, 500, 600, 700].map(function (l) { return '<option>' + l + '</option>'; }).join('') + '</select>' + icon('chevron-right', 'icon--sm') + '</div>';
    var depts = '<div class="select-wrap"><select class="select" id="r-dept" aria-describedby="r-dept-hint"><option value="">' + t('register.departmentChoose') + '</option></select>' + icon('chevron-right', 'icon--sm') + '</div>';
    shell(
      '<header><h1>' + t('register.title') + '</h1><p class="lead">' + t('register.lead') + '</p></header>' +
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
      '<div class="btn-row">' + submitButton(t('register.submit'), t('register.sending')) + '</div></form>' +
      '<p>' + t('register.have') + ' <a href="login.html' + keep() + '">' + t('login.title') + '</a></p>',
      { title: R.title, states: ['invalid', 'sending', 'busy'] }
    );
  };

  screens.admin = function () {
    var A = T.admin;
    var o = { title: A.title, signedIn: STATE !== 'signedOut', states: ['signedOut', 'notAdmin', 'session', 'loading', 'empty', 'error', 'busy', 'confirm', 'published', 'invalid'] };
    var head = '<header><h1>' + t('admin.title') + '</h1>';
    if (STATE === 'signedOut') return shell(head + '</header>' + emptyState(t('admin.gateLogin'), '', '<a class="btn btn--primary" href="login.html' + keep() + '">' + t('admin.gateLoginLink') + '</a>'), Object.assign(o, { signedIn: false }));
    if (STATE === 'notAdmin') return shell(head + '</header><div class="state">' + icon('lock', 'icon--lg') + '<p class="state__title">' + t('admin.gateNotAdmin') + '</p><p>' + t('admin.gateNotAdminHelp') + '</p></div>', o);
    head += '<p class="muted">' + t('admin.signedInAs', { name: A.adminName, role: A.adminRole }) + '</p></header>';
    var tabs = '<nav class="page-tabs" aria-label="' + t('admin.tabsLabel') + '"><a href="#compose" aria-current="true">' + t('admin.tabCompose') + '</a><a href="#manage">' + t('admin.tabManage') +
      '</a><a href="#verify">' + t('admin.tabVerify') + '</a></nav>';
    var invalid = STATE === 'invalid';
    var title = invalid ? 'ab' : A.sampleTitle;
    var formAlert = STATE === 'session' ? '<div class="alert alert--error" role="alert">' + icon('lock') + '<p>' + t('banners.sessionEnded') + ' <a href="login.html' + keep() + '">' + t('login.title') + '</a></p></div>'
      : STATE === 'busy' ? '<div class="alert alert--error" role="alert">' + icon('error') + '<p>' + t('banners.busy') + '</p></div>'
      : STATE === 'published' ? '<div class="alert alert--success" role="status">' + icon('success') + '<p>' + t('admin.published', { title: A.sampleTitle }) + '</p></div>' : '';
    var scopeSel = '<div class="select-wrap"><select class="select" id="a-scope">' + A.scopeOptions.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select>' + icon('chevron-right', 'icon--sm') + '</div>';
    var targetSel = '<div class="select-wrap"><select class="select" id="a-target"><option>' + esc(A.targetValue) + '</option></select>' + icon('chevron-right', 'icon--sm') + '</div>';
    var compose = '<section class="section" id="compose" aria-labelledby="compose-h"><h2 id="compose-h">' + t('admin.composeTitle') + '</h2><p class="lead">' + t('admin.composeLead') + '</p>' +
      '<form class="form" novalidate>' +
      field('a-title', t('admin.fieldTitle'), { hint: t('admin.titleCount', { n: Array.from(title).length }), value: STATE === 'published' ? '' : title, error: invalid ? t('admin.errTitle') : '' }) +
      field('a-body', t('admin.fieldBody'), { hint: t('admin.bodyCount', { n: Array.from(A.sampleBody).length }), control: '<textarea class="textarea" id="a-body" aria-describedby="a-body-hint">' + (STATE === 'published' ? '' : esc(A.sampleBody)) + '</textarea>' }) +
      field('a-scope', t('admin.fieldScope'), { control: scopeSel }) +
      field('a-target', t('admin.fieldTarget'), { control: targetSel }) +
      field('a-exp', t('admin.fieldExpires'), { type: 'datetime-local', hint: t('admin.expiresHint') }) +
      formAlert + '<div class="btn-row">' + submitButton(t('admin.publish'), t('admin.publishing')) + '</div></form></section>';
    var manageBody;
    if (STATE === 'loading') manageBody = loading('admin.manageLoading', 2);
    else if (STATE === 'error') manageBody = errorState('admin.manageError', 'academics.retry');
    else if (STATE === 'empty') manageBody = emptyState(t('admin.manageEmpty'), '', '');
    else manageBody = '<ul class="list">' + A.manageItems.map(function (m, i) {
      var confirm = STATE === 'confirm' && i === 0;
      return '<li><p class="item-title">' + esc(m.title) + '</p><p class="meta"><span>' + esc(m.scope) + '</span><span>' + t('notices.published', { date: m.date }) + '</span><span>' +
        (m.expires ? t('admin.expires', { date: m.expires }) : t('admin.noExpiry')) + '</span></p>' +
        (confirm
          ? '<div class="inline-confirm" role="group" aria-label="' + t('admin.delete') + '"><p>' + t('admin.confirmDelete') + '</p><div class="btn-row"><button class="btn btn--danger" type="button">' + icon('trash', 'icon--sm') + t('admin.yesDelete') +
            '</button><button class="btn btn--secondary" type="button">' + t('admin.cancel') + '</button></div></div>'
          : '<div class="btn-row"><button class="btn btn--secondary" type="button">' + icon('edit', 'icon--sm') + t('admin.edit') + '</button><button class="btn btn--quiet" type="button">' + t('admin.delete') + '</button></div>') + '</li>';
    }).join('') + '</ul>';
    var manage = '<section class="section" id="manage" aria-labelledby="manage-h"><h2 id="manage-h">' + t('admin.manageTitle') + '</h2><p class="lead">' + t('admin.manageLead') + '</p>' + manageBody + '</section>';
    var verifyItems = STATE === 'empty' ? emptyState(t('admin.verifyEmpty'), '', '') : '<ul class="list">' + A.verifyItems.map(function (v, i) {
      var needSource = STATE === 'invalid' && i === 0;
      return '<li><p class="kind">' + esc(v.kind) + '</p><p class="item-title">' + esc(v.title) + '</p><p class="muted">' + esc(v.detail) + '</p>' + seal(v.status, v.updated, v.source) +
        field('v-src-' + i, t('admin.sourceLabel'), { hint: t('admin.sourceHint'), error: needSource ? t('admin.sourceNeeded') : '' }) +
        '<div class="btn-row"><button class="btn btn--primary" type="button">' + icon('check', 'icon--sm') + t('admin.markVerified') + '</button><button class="btn btn--secondary" type="button">' + icon('alert', 'icon--sm') + t('admin.markOutdated') + '</button></div></li>';
    }).join('') + '</ul>';
    var verify = '<section class="section" id="verify" aria-labelledby="verify-h"><h2 id="verify-h">' + t('admin.verifyTitle') + '</h2><p class="lead">' + t('admin.verifyLead') + '</p>' +
      '<div class="alert alert--info" role="note">' + icon('info') + '<p>' + t('admin.verifySoon') + '</p></div>' +
      '<div class="field"><span class="label" id="vf">' + t('admin.verifyFilterLabel') + '</span><div class="choice" role="group" aria-labelledby="vf">' +
      A.verifyFilters.map(function (f, i) { return '<button type="button" aria-pressed="' + (i === 0) + '">' + esc(f) + '</button>'; }).join('') + '</div></div>' + verifyItems + '</section>';
    shell(head + tabs + compose + manage + verify, o);
  };

  screens.components = function () {
    function cell(label, html) { return '<div class="sheet__cell"><span class="label">' + label + '</span>' + html + '</div>'; }
    function states(cls, text, extra) {
      return ['', 'is-hover', 'is-focus', 'is-active', 'is-disabled', 'is-loading'].map(function (s) {
        var name = s ? s.replace('is-', '') : 'default';
        var inner = s === 'is-loading' ? '<span class="spinner" aria-hidden="true"></span>' + text : (extra || '') + text;
        return cell(t('proto.sheet.stateNames.' + name), '<button class="btn ' + cls + ' ' + s + '" type="button"' + (s === 'is-disabled' || s === 'is-loading' ? ' disabled' : '') + '>' + inner + '</button>');
      }).join('');
    }
    var inputs = ['', 'is-hover', 'is-focus', 'is-disabled'].map(function (s) {
      var name = s ? s.replace('is-', '') : 'default';
      return cell(t('proto.sheet.stateNames.' + name), '<input class="input ' + s + '" aria-label="' + t('proto.sheet.stateNames.' + name) + '" value="' + t('proto.sheet.sampleValue') + '"' + (s === 'is-disabled' ? ' disabled' : '') + '>');
    }).join('') + cell(t('proto.sheet.stateNames.error'), '<div class="field" style="width:100%"><input class="input" aria-label="error" aria-invalid="true" value="student@"><p class="field-error">' + icon('error', 'icon--sm') + '<span>' + t('login.errEmail') + '</span></p></div>');
    var html =
      '<header><h1>' + t('proto.sheet.title') + '</h1><p class="lead">' + t('proto.sheet.lead') + '</p></header><div class="sheet">' +
      '<section class="sheet__group"><h2>' + t('proto.sheet.buttons') + '</h2><h3>' + t('proto.sheet.primary') + '</h3><div class="sheet__grid">' + states('btn--primary', t('admin.publish')) + '</div>' +
      '<h3>' + t('proto.sheet.secondary') + '</h3><div class="sheet__grid">' + states('btn--secondary', t('academics.retry'), icon('refresh', 'icon--sm')) + '</div>' +
      '<h3>' + t('proto.sheet.quiet') + '</h3><div class="sheet__grid">' + states('btn--quiet', t('home.seeAll')) + '</div>' +
      '<h3>' + t('proto.sheet.danger') + '</h3><div class="sheet__grid">' + states('btn--danger', t('admin.yesDelete'), icon('trash', 'icon--sm')) + '</div></section>' +
      '<section class="sheet__group"><h2>' + t('proto.sheet.inputs') + '</h2><div class="sheet__grid">' + inputs + '</div>' +
      '<div class="sheet__grid">' + cell(t('proto.sheet.select'), '<div class="select-wrap" style="width:100%"><select class="select" aria-label="' + t('timetable.levelLabel') + '"><option>' + t('department.levelHeading', { level: 100 }) + '</option></select>' + icon('chevron-right', 'icon--sm') + '</div>') +
      cell(t('proto.sheet.textarea'), '<textarea class="textarea" aria-label="' + t('admin.fieldBody') + '">' + esc(T.admin.sampleBody) + '</textarea>') + '</div></section>' +
      '<section class="sheet__group"><h2>' + t('proto.sheet.seal') + '</h2><div class="sheet__grid sheet__grid--wide">' +
      cell(t('verification.verified'), seal('verified', '21 Oct 2026', T.department.source)) + cell(t('verification.unverified'), seal('unverified', '9 Oct 2026', '')) + cell(t('verification.outdated'), seal('outdated', '2 Feb 2026', 'Sample source: 2025 handbook (sample)')) + '</div></section>' +
      '<section class="sheet__group"><h2>' + t('proto.sheet.badges') + '</h2><div class="sheet__grid sheet__grid--wide">' + cell(t('proto.sheet.today'), '<span class="today-tag">' + t('timetable.today') + '</span>') +
      cell(t('proto.sheet.choice'), '<div class="choice" role="group" aria-label="' + t('admin.verifyFilterLabel') + '"><button type="button" aria-pressed="true">' + esc(T.admin.verifyFilters[0]) + '</button><button type="button" aria-pressed="false">' + esc(T.admin.verifyFilters[2]) + '</button></div>') + '</div></section>' +
      '<section class="sheet__group"><h2>' + t('proto.sheet.signpost') + '</h2><nav class="post" aria-label="' + t('proto.sheet.signpost') + '">' +
      '<a class="sign" href="#"><span><span class="sign__title">' + t('shell.map') + '</span><span class="sign__sub">' + esc(T.home.signs[0].sub) + '</span></span><span class="sign__go">' + icon('arrow', 'icon--lg') + '</span></a>' +
      '<a class="sign sign--gold" href="#"><span><span class="sign__title">' + t('department.timetableSign') + '</span><span class="sign__sub">' + t('department.timetableSub') + '</span></span><span class="sign__go">' + icon('arrow', 'icon--lg') + '</span></a></nav></section>' +
      '<section class="sheet__group"><h2>' + t('proto.sheet.list') + '</h2><ul class="list"><li><a class="row-link" href="#"><span><span class="row-link__title">' + esc(T.academics.schools[0].name) +
      '</span><span class="meta"><span>SSS</span></span></span><span class="row-link__tip">' + icon('chevron-right') + '</span></a>' + seal('verified', '21 Oct 2026', T.academics.schools[0].source) + '</li></ul></section>' +
      '<section class="sheet__group"><h2>' + t('proto.sheet.banners') + '</h2><div class="sheet__frame">' + banner('offline') + '</div><div class="sheet__frame">' + banner('syncFailed') + '</div>' +
      '<div class="alert alert--error" role="alert">' + icon('error') + '<p>' + t('banners.busy') + '</p></div>' +
      '<div class="alert alert--error" role="alert">' + icon('lock') + '<p>' + t('banners.sessionEnded') + '</p></div>' +
      '<div class="alert alert--success" role="status">' + icon('success') + '<p>' + t('login.registered') + '</p></div>' +
      '<div class="alert alert--info" role="note">' + icon('info') + '<p>' + t('admin.verifySoon') + '</p></div></section>' +
      '<section class="sheet__group"><h2>' + t('proto.sheet.states') + '</h2><div class="sheet__grid sheet__grid--wide">' + cell(t('proto.sheet.loading'), '<div style="width:100%">' + skeleton(1) + '</div>') +
      cell(t('proto.sheet.empty'), emptyState(t('academics.empty'), t('academics.emptyHelp'), '')) + cell(t('proto.sheet.error'), errorState('academics.error', 'academics.retry')) + '</div></section>' +
      '<section class="sheet__group"><h2>' + t('proto.sheet.nav') + '</h2><div class="sheet__frame">' + topbar({}) + '</div><div class="sheet__frame"><nav class="tabs" aria-label="' + t('shell.navLabel') + '" style="display:grid">' + links() + '</nav></div></section>' +
      '<section class="sheet__group"><h2>' + t('proto.sheet.dialog') + '</h2><div class="dialog" role="dialog" aria-modal="false" aria-labelledby="dlg-h" style="position:static;display:block"><div class="dialog__body"><h3 id="dlg-h">' + t('admin.delete') + '</h3><p>' + t('admin.confirmDelete') +
      '</p><div class="btn-row"><button class="btn btn--danger" type="button">' + icon('trash', 'icon--sm') + t('admin.yesDelete') + '</button><button class="btn btn--secondary" type="button">' + t('admin.cancel') + '</button></div></div></div>' +
      '<p class="hint">' + t('proto.sheet.dialogNote') + '</p></section></div>';
    shell(html, { title: T.proto.sheet.title });
  };

  screens.index = function () {
    var pages = [
      ['home.html', 'home', ['offline', 'syncFailed']], ['first-sync.html', 'firstSync', []], ['map.html', 'map', ['offline', 'searchEmpty']],
      ['academics.html', 'academics', ['loading', 'empty', 'error', 'offline']], ['department.html', 'department', ['loading', 'empty', 'error', 'notFound', 'offline']],
      ['timetable.html', 'timetable', ['loading', 'empty', 'levelEmpty', 'error', 'offline']], ['announcements.html', 'notices', ['loading', 'empty', 'error', 'offline']],
      ['login.html', 'login', ['registered', 'invalid', 'sending', 'wrong', 'busy', 'offline']], ['register.html', 'register', ['invalid', 'sending', 'busy']],
      ['admin.html', 'admin', ['signedOut', 'notAdmin', 'session', 'loading', 'empty', 'error', 'busy', 'confirm', 'published', 'invalid']], ['components.html', 'components', []],
    ];
    var list = '<ul class="list">' + pages.map(function (p) {
      return '<li><a class="row-link" href="' + p[0] + '"><span class="row-link__title">' + t('proto.pages.' + p[1]) + '</span><span class="row-link__tip">' + icon('chevron-right') + '</span></a>' +
        (p[2].length ? '<p class="meta">' + p[2].map(function (s) { return '<a href="' + p[0] + '?state=' + s + '">' + t('proto.states.' + s) + '</a>'; }).join('') + '</p>' : '') + '</li>';
    }).join('') + '</ul>';
    shell('<header><h1>' + t('proto.indexTitle') + '</h1><p class="lead">' + t('proto.indexLead') + '</p></header>' + list, { title: fill(T.proto.indexTitle) });
  };

  (screens[SCREEN] || screens.index)();

  // Disclosure in the notices list works in the prototype too.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[aria-controls^="nb-"]');
    if (!b) return;
    var id = b.getAttribute('aria-controls');
    var i = Number(id.slice(3));
    var item = T.notices.items[i];
    var open = b.getAttribute('aria-expanded') !== 'true';
    document.querySelectorAll('[aria-controls="' + id + '"]').forEach(function (x) { x.setAttribute('aria-expanded', String(open)); });
    document.getElementById(id).textContent = open ? item.body : Array.from(item.body).slice(0, 90).join('').trimEnd() + '…';
    var more = document.querySelector('.notice__more[aria-controls="' + id + '"]');
    if (more) more.textContent = fill(open ? T.notices.less : T.notices.more);
  });
})();
