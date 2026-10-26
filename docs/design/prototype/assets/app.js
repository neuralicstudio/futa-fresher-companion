// Draws each prototype screen from window.SABI_TEXT (assets/strings.js), with the drawn pieces from
// assets/art.js, the photos from assets/pack.js and the motion rules from assets/motion.js. No
// network, no build.
// A page says which screen it is with <body data-screen="...">. Its state comes from ?state=...
// and the prototype bar; the theme from ?theme=light|dark; Lite from ?lite=1|0; the photos from
// ?pack=ready|none|downloading|wifi; the time of day from ?daypart=morning|afternoon|evening|night
// (default: the sample clock in strings.js).
(function () {
  'use strict';
  var T = window.SABI_TEXT;
  var A = window.SABI_ART;
  var M = window.SABI_MOTION;
  var PK = window.SABI_PACK;
  var icon = A.icon;
  var params = new URLSearchParams(location.search);
  var STATE = params.get('state') || 'default';
  var SCREEN = document.body.getAttribute('data-screen');
  var NOW = T.home.sampleNow;
  var DAYPART = params.get('daypart') || NOW.daypart;
  var fmt = new Intl.NumberFormat('en-NG');
  if (params.get('proto') === '0') document.body.classList.add('no-proto');
  // ?text=200 doubles the root text size, to check the screens at 200% text (WCAG 1.4.4).
  if (params.get('text')) document.documentElement.style.fontSize = Number(params.get('text')) + '%';
  document.documentElement.setAttribute('data-daypart', DAYPART);

  // The tab icon: the mark on its night tile, as a data URI (no request).
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
    ['proto', 'lite', 'daypart', 'pack', 'local'].forEach(function (k) { if (params.get(k)) p.set(k, params.get(k)); });
    if (extra) Object.keys(extra).forEach(function (k) { p.set(k, extra[k]); });
    var s = p.toString();
    return s ? '?' + s : '';
  }
  function links() {
    return TABS.map(function (tab) {
      var cur = CURRENT === tab.key ? ' aria-current="page"' : '';
      return '<a href="' + tab.href + keep() + '"' + cur + '>' + icon(tab.icon) + '<span>' + t('shell.' + tab.key) + '</span></a>';
    }).join('');
  }
  function topbar(opts) {
    var right = opts.signedIn
      ? '<a class="round" href="admin.html' + keep() + '" aria-label="' + t('shell.admin') + '">' + icon('shield') + '</a>'
      : '<a class="round" href="login.html' + keep() + '" aria-label="' + t('shell.login') + '">' + icon('user') + '</a>';
    return (
      '<header class="topbar' + (opts.hero ? ' topbar--over' : '') + '"><div class="topbar__inner">' +
      '<a class="wordmark" href="home.html' + keep() + '" aria-label="' + t('app.name') + ', ' + t('shell.home') + '">' + A.mark() + '<span>' + t('app.name') + '</span></a>' +
      '<nav class="topbar__tabs" aria-label="' + t('shell.navLabel') + '">' + links() + '</nav>' +
      '<span class="topbar__spacer"></span><span class="lite-chip">' + t('shell.liteChip') + '</span>' +
      '<a class="round" href="settings.html' + keep() + '" aria-label="' + t('shell.settings') + '"' + (SCREEN === 'settings' ? ' aria-current="page"' : '') + '>' + icon('settings') + '</a>' +
      right + '</div></header>'
    );
  }
  function banner(kind) {
    if (kind === 'offline')
      return '<div class="banner banner--offline" role="status">' + icon('offline') + '<span class="banner__text">' + t('banners.offline') + '</span></div>';
    if (kind === 'syncFailed')
      return '<div class="banner banner--warn" role="status">' + icon('alert') + '<span class="banner__text">' + t('banners.syncFailed') + '</span><button class="btn btn--secondary btn--sm" type="button">' + icon('refresh', 'icon--sm') + t('banners.tryAgain') + '</button></div>';
    return '';
  }
  // The flyer hero: a photo from the visual pack (or the drawn scene under it), a scrim tinted by
  // the time of day, and the title set big over it. vt names the title for the page transition, so
  // the door you tapped on Home slides into this title.
  function hero(o) {
    var art = o.art || A.scene(o.scene || 'block', { daypart: DAYPART, seed: o.seed || 3, people: o.people });
    return '<section class="hero' + (o.cls ? ' ' + o.cls : '') + '"' + (o.label ? ' aria-labelledby="' + o.label + '"' : '') + '>' +
      '<div class="hero__media" data-parallax>' + (o.photo ? PK.slot(o.photo, 'l', art, 'hero__pic') : '<div class="pic hero__pic">' + art + '</div>') + '</div>' +
      '<div class="hero__inner" data-once="hero-' + SCREEN + '">' + (o.back || '') + (o.before || '') +
      '<h1' + (o.vt ? ' style="view-transition-name:vt-' + o.vt + '"' : '') + (o.label ? ' id="' + o.label + '"' : '') + '>' + o.title + '</h1>' +
      (o.lead ? '<p class="lead">' + o.lead + '</p>' : '') + (o.after || '') + '</div></section>';
  }
  function shell(content, opts) {
    opts = opts || {};
    if (opts.banner === 'offline') document.documentElement.setAttribute('data-net', 'offline');
    document.getElementById('app').innerHTML =
      '<a class="skip" href="#main">' + t('shell.skip') + '</a>' +
      topbar({ signedIn: opts.signedIn, hero: Boolean(opts.hero) }) +
      '<main id="main" tabindex="-1"' + (opts.mainCls ? ' class="' + opts.mainCls + '"' : '') + '>' + (opts.hero || '') +
      (content ? '<div class="page">' + (opts.banner ? banner(opts.banner) : '') + content + '</div>' : '') + '</main>' +
      (opts.fab || '') +
      (opts.noTabs ? '' : '<nav class="tabbar" aria-label="' + t('shell.navLabel') + '">' + links() + '</nav>') +
      protoBar(opts.states || []);
    document.title = (opts.title ? opts.title + ' | ' : '') + T.app.name;
    M.init(document);
    PK.show(document);
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
    return '<a class="back" href="' + href + keep() + '">' + icon('chevron-left', 'icon--sm') + '<span>' + label + '</span></a>';
  }
  function skeleton(rows) {
    var out = '<div class="skeleton" aria-hidden="true" data-loop>';
    for (var i = 0; i < rows; i++) out += '<div class="skeleton__row"><div class="skeleton__pic"></div><div class="skeleton__lines"><div class="skeleton__bar skeleton__bar--title"></div><div class="skeleton__bar"></div><div class="skeleton__bar skeleton__bar--short"></div></div></div>';
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
  // A sticker: a ring with the number that matters inside it. label is what a screen reader says.
  function sticker(value, n, unit, label, cls) {
    return '<div class="sticker' + (cls ? ' ' + cls : '') + '" role="img" aria-label="' + label + '">' + A.ring(value) +
      '<span class="sticker__n num">' + n + '</span>' + (unit ? '<span class="sticker__u">' + unit + '</span>' : '') + '</div>';
  }
  function switchRow(id, label, hint, on, attr, extra) {
    return '<div class="switch-row"><span class="label" id="' + id + '-l">' + label + '</span>' +
      '<button class="switch" type="button" role="switch" aria-labelledby="' + id + '-l" aria-describedby="' + id + '-h' + (extra ? ' ' + id + '-why' : '') + '" aria-checked="' + on + '" ' + attr + '></button>' +
      '<p class="hint" id="' + id + '-h">' + hint + '</p>' + (extra || '') + '</div>';
  }
  function liteSwitch() {
    var why = document.documentElement.getAttribute('data-lite');
    return switchRow('lite', t('home.lite.label'), t('home.lite.hint'), Boolean(why), 'data-lite-switch',
      '<p class="hint" id="lite-why" data-lite-why>' + (why ? t('home.lite.why.' + why) : '') + '</p>');
  }
  // A bar chart as a list: each row says its value in words, the bar only draws it.
  function bars(rows, max, tone) {
    return '<ul class="bars">' + rows.map(function (r, i) {
      return '<li><span class="bars__label">' + r[0] + '</span><span class="bars__track" aria-hidden="true"><span class="bars__bar' + (tone ? ' bars__bar--' + tone : '') + '" style="--w:' + (r[1] / max * 100).toFixed(1) + '%;--i:' + i + '"></span></span>' +
        '<span class="bars__value num">' + r[2] + '</span></li>';
    }).join('') + '</ul>';
  }
  // A donut of parts with its legend. parts: [[label, n, tone], ...]
  function donut(parts, centre, label) {
    var total = parts.reduce(function (s, p) { return s + p[1]; }, 0), at = 0;
    var arcs = parts.map(function (p) {
      var len = p[1] / total * 100, a = '<circle class="donut__arc donut__arc--' + p[2] + '" cx="22" cy="22" r="19" pathLength="100" stroke-dasharray="' + Math.max(0, len - 1.5).toFixed(1) + ' 100" stroke-dashoffset="' + (-at).toFixed(1) + '"/>';
      at += len; return a;
    }).join('');
    return '<div class="donut"><div class="donut__fig" role="img" aria-label="' + label + '"><svg viewBox="0 0 44 44" aria-hidden="true" focusable="false"><circle class="ring__track" cx="22" cy="22" r="19"/>' + arcs + '</svg>' +
      '<span class="donut__n num">' + centre + '</span></div><ul class="legend">' + parts.map(function (p) {
        return '<li><span class="legend__key legend__key--' + p[2] + '" aria-hidden="true"></span>' + p[0] + '<span class="num">' + p[1] + '</span></li>';
      }).join('') + '</ul></div>';
  }
  function fab(label, ic, href) {
    return '<a class="fab" href="' + href + '">' + icon(ic) + '<span>' + label + '</span></a>';
  }
  function chips(label, items, id) {
    return '<div class="filter" role="group" aria-label="' + label + '"' + (id ? ' data-filter="' + id + '"' : '') + '>' + items.map(function (f, i) {
      return '<button type="button" aria-pressed="' + (i === 0) + '" data-value="' + i + '">' + esc(f) + '</button>';
    }).join('') + '</div>';
  }
  function packState() { return document.documentElement.hasAttribute('data-lite') ? 'lite' : PK.state(); }

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
      sel('pack', ['ready', 'none', 'downloading', 'wifi'], PK.state(), 'proto.packs') +
      sel('daypart', ['morning', 'afternoon', 'evening', 'night'], DAYPART, 'proto.dayparts') +
      '<a href="index.html' + keep() + '">' + t('proto.index') + '</a></div></details>';
  }
  document.addEventListener('change', function (e) {
    var kind = e.target.getAttribute && e.target.getAttribute('data-proto');
    if (!kind) return;
    var v = e.target.value;
    if (kind === 'state' || kind === 'daypart') { params.set(kind, v); location.search = params.toString(); }
    if (kind === 'pack') { params.delete('pack'); try { localStorage.setItem('sabi-pack', v); } catch (err) { params.set('pack', v); } location.search = params.toString(); }
    if (kind === 'theme') setTheme(v);
    if (kind === 'lite') {
      params.delete('lite');
      try { v === 'auto' ? localStorage.removeItem('sabi-lite') : localStorage.setItem('sabi-lite', v); } catch (err) { if (v !== 'auto') params.set('lite', v === 'on' ? '1' : '0'); }
      location.search = params.toString();
    }
  });
  function setTheme(v) {
    try { v === 'auto' ? localStorage.removeItem('sabi-proto-mode') : localStorage.setItem('sabi-proto-mode', v); } catch (err) { /* storage blocked: this view only */ }
    if (v === 'auto') document.documentElement.removeAttribute('data-mode');
    else document.documentElement.setAttribute('data-mode', v);
  }

  // ---------------------------------------------------------------- screens
  var screens = {};

  function nextClass() {
    var today = T.timetable.days.filter(function (d) { return d.today; })[0];
    if (!today) return null;
    var e = today.entries.filter(function (x) { return toMin(x.start) > NOW.minutes; })[0];
    return e ? { entry: e, inMin: toMin(e.start) - NOW.minutes, day: today.day, count: today.entries.length } : null;
  }

  // Next class: a glass card over the foot of Home's hero, its sticker counting down the hour.
  function nextCard() {
    var tk = T.home.ticket;
    if (STATE === 'noDept') {
      return '<article class="next glass" aria-labelledby="tk-h">' + A.piece('pending') +
        '<div class="next__body"><h2 class="item-title" id="tk-h">' + t('home.ticket.noneTitle') + '</h2><p class="muted">' + t('home.ticket.noneBody') + '</p>' +
        '<a class="btn btn--primary" href="academics.html' + keep() + '">' + icon('book', 'icon--sm') + t('home.ticket.noneAction') + '</a></div></article>';
    }
    var n = nextClass();
    if (!n) return '';
    var e = n.entry;
    return '<article class="next glass" aria-labelledby="tk-h">' +
      sticker(n.inMin / 60, n.inMin, 'min', t('home.ticket.in', { n: n.inMin }), 'sticker--gold') +
      '<div class="next__body"><p class="next__label" id="tk-h">' + t('home.ticket.label', { day: n.day }) + '</p>' +
      '<p class="next__time num">' + esc(e.start) + '</p>' +
      '<p class="next__course"><span class="code">' + esc(e.code) + '</span>' + esc(e.title) + '</p>' +
      '<p class="next__venue">' + icon('pin', 'icon--sm') + '<span>' + esc(e.venue) + '</span></p></div>' +
      '<a class="next__go btn btn--quiet" href="timetable.html' + keep() + '">' + t('home.ticket.timetable') + icon('arrow', 'icon--sm') + '</a></article>';
  }

  screens.home = function () {
    var doors = T.home.signs.map(function (s, i) {
      return '<li><a class="door door--' + s.key + '" href="' + s.to + keep() + '" style="--i:' + i + '">' +
        '<span class="door__icon" aria-hidden="true">' + icon({ map: 'map', academics: 'book', timetable: 'calendar', notices: 'notice' }[s.key]) + '</span>' +
        '<span class="door__title" style="view-transition-name:vt-' + s.key + '">' + esc(s.title) + '</span>' +
        '<span class="door__sub">' + esc(s.sub) + '</span>' + (s.extra ? chip(esc(s.extra), 'gold') : '') + '</a></li>';
    }).join('');
    var kinds = { library: 'library', computing: 'block', crc: 'block', techpark: 'block', studios: 'hall', physics: 'walk' };
    var explore = '<ul class="rail" role="list">' + T.map.explore.map(function (x, i) {
      return '<li class="place-card">' + PK.slot(x[0], 's', A.scene(kinds[x[0]], { daypart: 'afternoon', seed: 20 + i }), 'place-card__pic') +
        '<a class="place-card__name" href="map.html' + keep() + '">' + esc(x[1]) + '</a></li>';
    }).join('') + '</ul>';
    var n = T.notices.items[0];
    var offline = STATE === 'offline';
    var F = T.firstSync, total = F.stations.reduce(function (s, x) { return s + x.n; }, 0);
    var tones = ['maroon', 'gold', 'jade', 'sky', 'coral'];
    var ps = packState();
    var saved = STATE === 'syncFailed' ? '' :
      '<section class="card saved" aria-labelledby="saved-h"><div class="card__head">' + icon('route') + '<h2 id="saved-h" class="item-title">' + t('home.savedTitle') + '</h2></div>' +
      '<p class="saved__total"><span class="num">' + fmt.format(total) + '</span> ' + t('home.savedItems', { n: '' }).trim() + '</p>' +
      '<div class="stack" role="img" aria-label="' + esc(F.stations.filter(function (s) { return s.n; }).map(function (s) { return s.name + ' ' + s.n; }).join(', ')) + '">' +
      F.stations.map(function (s, i) { return s.n ? '<span class="stack__part stack__part--' + tones[i] + '" style="flex:' + s.n + '"></span>' : ''; }).join('') + '</div>' +
      '<ul class="legend legend--inline">' + F.stations.map(function (s, i) { return s.n ? '<li><span class="legend__key legend__key--' + tones[i] + '" aria-hidden="true"></span>' + esc(s.name) + '</li>' : ''; }).join('') + '</ul>' +
      '<p class="muted">' + t('home.savedLine', { when: T.home.savedWhen }) + '</p>' +
      '<div class="btn-row"><button class="btn btn--secondary" type="button"' + (offline ? ' disabled aria-describedby="saved-off"' : '') + '>' +
      icon('refresh', 'icon--sm') + t('home.savedButton') + '</button>' +
      (offline ? '<span class="muted" id="saved-off">' + t('banners.offline') + '</span>' : '') + '</div>' +
      '<a class="row-link" href="settings.html' + keep() + '">' + icon('photo') + '<span class="row-link__body"><span class="row-link__title">' + t('pack.title') + '</span><span class="muted">' + t('pack.' + ps) + '</span></span>' + icon('chevron-right') + '</a>' +
      liteSwitch() + '</section>';
    shell(
      nextCard() +
      '<nav aria-label="' + t('home.postLabel') + '"><ul class="doors" data-once="home-doors">' + doors + '</ul></nav>' +
      '<section class="section" aria-labelledby="ex-h"><div class="section__head"><h2 id="ex-h">' + t('home.exploreTitle') + '</h2><a class="btn btn--quiet" href="map.html' + keep() + '">' + t('home.exploreAll') + '</a></div>' +
      '<p class="hint">' + t('home.exploreLead') + '</p>' + explore + '</section>' +
      '<div class="home-grid">' + saved +
      '<section aria-labelledby="latest-h" class="card"><div class="section__head"><h2 id="latest-h" class="item-title">' + t('home.latestTitle') + '</h2>' +
      '<a class="btn btn--quiet" href="announcements.html' + keep() + '">' + t('home.seeAll') + '</a></div>' +
      '<p class="meta">' + chip(t('notices.scopes.university'), 'maroon') + '<span>' + t('notices.published', { date: n.date }) + '</span></p>' +
      '<p class="item-title">' + esc(n.title) + '</p>' + seal(n.status, n.updated, n.source) + '</section></div>',
      {
        hero: hero({ cls: 'hero--home', photo: 'gate', scene: 'gate', seed: 11, people: [[0, 92, 'walk'], [1, 326, 'wave']], label: 'home-h',
          before: '<p class="hello">' + icon(DAYPART === 'night' || DAYPART === 'evening' ? 'moon' : 'sun', 'icon--sm') + t('home.hello.' + DAYPART) + '</p>', title: t('home.title'), lead: t('home.lead'), vt: 'home' }),
        banner: offline ? 'offline' : STATE === 'syncFailed' ? 'syncFailed' : '', states: ['offline', 'syncFailed', 'noDept'],
      }
    );
  };

  screens.welcome = function () {
    shell('', {
      title: T.welcome.title, noTabs: true, mainCls: 'main--full',
      hero: '<section class="hero hero--full welcome" aria-labelledby="w-h">' +
        '<div class="hero__media"><div class="pic hero__pic">' + A.scene('walk', { daypart: DAYPART, seed: 8, people: [[2, 124, 'walk', 286, 1], [0, 170, 'walk', 292, 1.08], [1, 226, 'wave', 288, 1.04], [3, 276, 'walk', 292, 1]] }) + '</div></div>' +
        '<div class="hero__inner" data-once="hero-welcome">' + A.mark('mark--xl') +
        '<h1 id="w-h" class="display">' + t('welcome.title') + '</h1><p class="lead">' + t('welcome.lead') + '</p>' +
        '<a class="btn btn--gold btn--go" href="first-sync.html' + keep() + '"><span>' + t('welcome.start') + '</span><span class="btn__disc">' + icon('arrow', 'icon--sm') + '</span></a>' +
        '<p class="welcome__login">' + t('welcome.have') + ' <a href="login.html' + keep() + '">' + t('welcome.login') + '</a></p></div></section>',
    });
  };

  screens['first-sync'] = function () {
    var F = T.firstSync;
    var done = STATE === 'done';
    var total = F.stations.reduce(function (s, x) { return s + x.n; }, 0);
    var savedParts = F.stations.filter(function (s) { return s.n; }).length;
    var p = done ? 100 : Math.round(savedParts / F.stations.length * 100);
    var rows = F.stations.map(function (s, i) {
      var waiting = !done && !s.n;
      return '<li class="sync-row' + (waiting ? ' sync-row--wait' : '') + '" style="--i:' + i + '">' +
        '<span class="sync-row__ring" aria-hidden="true">' + A.ring(waiting ? 0 : 1) + (waiting ? '' : icon('check', 'icon--sm')) + '</span>' +
        '<span class="sync-row__name">' + esc(s.name) + '</span>' +
        '<span class="sync-row__n">' + (waiting ? t('firstSync.waiting') : '<span class="num" data-count="' + s.n + '">' + fmt.format(s.n) + '</span>') + '</span></li>';
    }).join('');
    var offer = done ? '<section class="offer glass" aria-labelledby="offer-h">' + icon('photo', 'icon--lg') + '<div><h2 id="offer-h" class="item-title">' + t('firstSync.packTitle') + '</h2>' +
      '<p>' + t('firstSync.packBody', { size: T.pack.size }) + '</p><div class="btn-row"><a class="btn btn--primary" href="home.html' + keep({ pack: 'wifi' }) + '">' + icon('wifi', 'icon--sm') + t('firstSync.packYes') + '</a>' +
      '<a class="btn btn--quiet" href="home.html' + keep({ pack: 'none' }) + '">' + t('firstSync.packNo') + '</a></div></div></section>' : '';
    var body =
      '<div class="sync__ring' + (done ? ' is-done' : '') + '" role="' + (done ? 'img' : 'progressbar') + '" aria-label="' + t('firstSync.ringLabel', { p: p }) + '"' + (done ? '' : ' aria-valuenow="' + p + '" aria-valuemin="0" aria-valuemax="100"') + (done ? '' : ' data-loop') + '>' +
      A.ring(p / 100, 'ring--big') + (done ? '<span class="sync__burst" aria-hidden="true">' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return '<i style="--k:' + k + '"></i>'; }).join('') + '</span>' : '') +
      '<span class="sync__p"><span class="num">' + (done ? fmt.format(total) : p + '%') + '</span><small>' + (done ? t('firstSync.doneTotal', { n: '' }).trim() : t('firstSync.progress', { count: '' }).trim().replace(/^items /, '')) + '</small></span></div>' +
      '<h1 id="fs-h" class="display">' + t(done ? 'firstSync.doneTitle' : 'firstSync.title') + '</h1><p class="lead">' + t(done ? 'firstSync.doneLead' : 'firstSync.lead') + '</p>' +
      (done ? '' : '<p role="status" class="sync__count"><span class="num" data-count="' + total + '">' + fmt.format(total) + '</span> ' + t('firstSync.progress', { count: '' }).trim() + '</p>') +
      '<h2 class="visually-hidden">' + t('firstSync.stationsLabel') + '</h2><ol class="sync-rows">' + rows + '</ol>' +
      '<p class="hint">' + t('firstSync.sampleNote') + '</p>' + offer +
      '<div class="btn-row">' + (done ? '<a class="btn btn--gold btn--go" href="home.html' + keep() + '"><span>' + t('firstSync.doneAction') + '</span><span class="btn__disc">' + icon('arrow', 'icon--sm') + '</span></a>'
        : '<button class="btn btn--glass" type="button">' + t('firstSync.continue') + '</button>') + '</div>' +
      '<details class="source source--on-night"><summary>' + icon('chevron-right', 'icon--sm') + t('firstSync.why') + '</summary><p>' + t('firstSync.whyBody') + '</p></details>';
    shell('', {
      title: done ? F.doneTitle : F.title, states: ['done'], noTabs: true, mainCls: 'main--full',
      hero: '<section class="hero hero--full sync' + (done ? ' sync--done' : '') + '" aria-labelledby="fs-h">' +
        '<div class="hero__media"><div class="pic hero__pic">' + A.scene('hostel', { daypart: done ? 'morning' : 'night', seed: 5, people: done ? [[0, 150, 'cheer', 292], [3, 250, 'cheer', 292]] : [[2, 160, 'phone', 292]] }) + '</div></div>' +
        '<div class="hero__inner" data-once="hero-sync">' + body + '</div></section>',
    });
    if (done) M.buzz();
    else document.querySelectorAll('[data-count]').forEach(function (el) { M.count(el, Number(el.getAttribute('data-count')), 1600); });
  };

  screens.map = function () {
    var offline = STATE === 'offline';
    var q = STATE === 'searchEmpty' ? 'stadium' : '';
    var B = T.map.buildings;
    var pins = [['B1', 168, 152], ['B2', 300, 92], ['B3', 236, 214], ['B4', 92, 108], ['B5', 330, 236]];
    var cards = q ? '' : B.map(function (b, i) {
      return '<li class="place" data-kind="' + esc(b.type) + '">' + PK.slot(b.photo, 's', A.scene(b.scene, { daypart: 'afternoon', seed: 30 + i }), 'place__pic') +
        '<div class="place__body"><p class="place__top"><span class="pin-code" aria-label="' + esc(b.code) + '">' + esc(b.code) + '</span><span class="muted">' + esc(b.type) + '</span>' + (b.photo ? '' : chip(t('map.noPhoto'), 'outline')) + '</p>' +
        '<h3 class="item-title">' + esc(b.name) + '</h3>' + seal(b.status, b.updated, b.source) +
        '<div class="btn-row"><button class="btn btn--secondary btn--sm" type="button"' + (offline ? ' disabled' : '') + '>' + icon('map', 'icon--sm') + t('map.directions') + '</button></div></div></li>';
    }).join('');
    var note = !offline && M.lite()
      ? '<div class="map-note glass">' + icon('map') + '<div><p>' + t('map.slotLite') + '</p><button class="btn btn--secondary btn--sm" type="button">' + t('map.loadMap') + '</button></div></div>'
      : '<p class="map-note glass">' + icon(offline ? 'offline' : 'info', 'icon--sm') + '<span>' + t(offline ? 'map.slotOffline' : 'map.slot') + '</span></p>';
    shell(
      '<div class="field field--search"><label for="b-search" class="visually-hidden">' + t('map.searchLabel') + '</label>' +
      '<div class="input-wrap">' + icon('search') + '<input class="input" id="b-search" type="search" autocomplete="off" placeholder="' + t('map.searchLabel') + '" aria-describedby="b-search-hint" value="' + esc(q) + '"></div><p class="hint" id="b-search-hint">' + t('map.searchHint') + '</p></div>' +
      chips(t('map.filtersLabel'), T.map.filters, 'map') +
      '<section class="section" aria-labelledby="b-h"><h2 id="b-h">' + t('map.listTitle') + '</h2><p class="hint">' + t('map.namesNote') + '</p>' +
      (q ? emptyState(t('map.noMatch', { q: q }), '', '', 'nomatch') : '<ul class="places">' + cards + '</ul>') + '</section>',
      {
        title: T.map.title, banner: offline ? 'offline' : '', states: ['offline', 'searchEmpty'],
        hero: hero({ cls: 'hero--map', art: A.campusMap(pins), title: t('map.title'), lead: t('map.lead'), vt: 'map', label: 'map-h', after: note }),
        fab: fab(t('map.findFab'), 'search', '#b-search'),
      }
    );
  };

  screens.academics = function () {
    var body;
    if (STATE === 'loading') body = loading('academics.loading', 4);
    else if (STATE === 'error') body = errorState('academics.error', 'academics.retry');
    else if (STATE === 'empty') body = emptyState(t('banners.savingList'), t('academics.emptyHelp'), '');
    else body = '<p class="hint">' + t('academics.savedLine', { n: T.academics.schools.length }) + '</p><ul class="schools">' + T.academics.schools.map(function (s, i) {
      return '<li class="school school--' + ['jade', 'sky', 'coral', 'gold'][i % 4] + '"><div class="school__art">' + A.scene(['block', 'library', 'hostel', 'hall'][i % 4], { daypart: ['morning', 'afternoon', 'evening', 'afternoon'][i % 4], seed: 40 + i }) + '</div>' +
        '<a class="school__link" href="department.html' + keep() + '"><span class="code-chip">' + esc(s.short) + '</span><span class="school__name">' + esc(s.name) + '</span>' + icon('arrow') + '</a>' + seal(s.status, s.updated, s.source) + '</li>';
    }).join('') + '</ul>';
    shell(body, {
      title: T.academics.title, banner: STATE === 'offline' ? 'offline' : '', states: ['loading', 'empty', 'error', 'offline'],
      hero: hero({ photo: 'computing', scene: 'block', seed: 4, people: [[3, 330, 'stand']], title: t('academics.title'), lead: t('academics.lead'), vt: 'academics', label: 'ac-h' }),
    });
  };

  screens.department = function () {
    var d = T.department;
    function opt(title, more) {
      return Object.assign({ title: T.department.name, banner: STATE === 'offline' ? 'offline' : '', states: ['loading', 'empty', 'error', 'notFound', 'offline'],
        hero: hero({ cls: 'hero--detail', photo: 'tree', scene: 'block', seed: 6, back: back(t('department.back'), 'academics.html'), title: title || t('department.titleFallback'), label: 'dp-h' }) }, more || {});
    }
    if (STATE === 'loading') return shell(loading('department.loading', 3), opt());
    if (STATE === 'error') return shell(errorState('department.error', 'department.retry'), opt());
    if (STATE === 'notFound') return shell(emptyState(t('department.notFound'), t('academics.emptyHelp'), ''), opt());
    var empty = STATE === 'empty';
    var levels = {};
    d.courses.forEach(function (c) { (levels[c.level] = levels[c.level] || []).push(c); });
    var unitRows = Object.keys(levels).map(function (lv) { var u = levels[lv].reduce(function (s, c) { return s + c.units; }, 0); return [t('department.levelHeading', { level: lv }), u, t('department.units', { n: u })]; });
    var chart = empty ? '' : '<section class="card" aria-labelledby="ch-h"><h2 id="ch-h" class="item-title">' + t('department.chartTitle') + '</h2><p class="hint">' + t('department.chartLead') + '</p>' +
      bars(unitRows, Math.max.apply(null, unitRows.map(function (r) { return r[1]; })), 'maroon') + '</section>';
    var courses = empty ? emptyState(t('department.coursesEmpty'), '', '') : Object.keys(levels).map(function (lv) {
      return '<section class="section" aria-labelledby="lv-' + lv + '"><h3 id="lv-' + lv + '">' + t('department.levelHeading', { level: lv }) + '</h3><ul class="list">' +
        levels[lv].map(function (c) {
          return '<li><p class="item-title"><span class="code">' + esc(c.code) + '</span>' + esc(c.title) + '</p><p class="meta"><span>' +
            (c.units === 1 ? t('department.unit') : t('department.units', { n: c.units })) + '</span><span>' + t('department.semester', { n: c.semester }) + '</span></p>' +
            seal(c.status, c.updated, c.source) + '</li>';
        }).join('') + '</ul></section>';
    }).join('');
    var lecturers = empty ? emptyState(t('department.lecturersEmpty'), '', '') : '<ul class="list">' + d.lecturers.map(function (l, i) {
      return '<li class="person"><span class="monogram monogram--' + ['jade', 'coral'][i % 2] + '" aria-hidden="true">' + esc(A.initials(l.name)) + '</span><p class="item-title">' + esc(l.name) + '</p>' + (l.rank ? '<p class="muted">' + esc(l.rank) + '</p>' : '') +
        (l.office || l.email ? '<dl class="facts">' + (l.office ? '<dt>' + t('department.officeShort') + '</dt><dd>' + esc(l.office) + '</dd>' : '') +
          (l.email ? '<dt>' + t('department.emailLabel') + '</dt><dd><a href="mailto:' + esc(l.email) + '">' + esc(l.email) + '</a></dd>' : '') + '</dl>' : '') +
        seal(l.status, l.updated, l.source) + '</li>';
    }).join('') + '</ul>';
    var today = T.timetable.days.filter(function (x) { return x.today; })[0];
    var n = nextClass();
    var o = opt(esc(d.name));
    o.hero = hero({ cls: 'hero--detail', photo: 'tree', scene: 'block', seed: 6, back: back(t('department.back'), 'academics.html'), label: 'dp-h',
      before: '<p><span class="code-chip code-chip--night" title="' + t('department.codeLabel') + '">' + esc(d.short) + '</span></p>', title: esc(d.name) });
    shell(
      '<div class="card glass card--lift"><dl class="facts"><dt>' + t('department.hodLabel') + '</dt><dd>' + esc(d.hod) + '</dd><dt>' + t('department.officeLabel') + '</dt><dd>' + esc(d.office) + '</dd></dl>' +
      seal(d.status, d.updated, d.source) + '</div>' +
      '<a class="go-card" href="timetable.html' + keep() + '">' + (n ? sticker(n.inMin / 60, today.entries.length, '', t('department.todayCount', { n: today.entries.length }), 'sticker--sm') : icon('calendar', 'icon--lg')) +
      '<span class="row-link__body"><span class="go-card__title" style="view-transition-name:vt-timetable">' + t('department.timetableSign') + '</span><span>' +
      t('department.todayCount', { n: today.entries.length }) + '</span></span>' + icon('arrow', 'icon--lg') + '</a>' +
      chart +
      '<section class="section" aria-labelledby="c-h"><h2 id="c-h">' + t('department.coursesTitle') + '</h2>' + courses + '</section>' +
      '<section class="section" aria-labelledby="l-h"><h2 id="l-h">' + t('department.lecturersTitle') + '</h2>' + lecturers + '</section>',
      o
    );
  };

  screens.timetable = function () {
    var tt = T.timetable;
    var n = nextClass();
    var o = { title: tt.title, banner: STATE === 'offline' ? 'offline' : '', states: ['loading', 'empty', 'levelEmpty', 'error', 'offline'],
      hero: hero({ cls: 'hero--detail', scene: 'block', seed: 8, people: [[1, 96, 'walk'], [2, 140, 'walk']], back: back(t('timetable.back'), 'department.html'), title: t('timetable.title'), lead: esc(T.department.name), vt: 'timetable', label: 'tt-h',
        after: n && ['default', 'offline'].indexOf(STATE) > -1 ? sticker(n.inMin / 60, n.inMin, 'min', t('timetable.nextIn', { n: n.inMin }), 'sticker--gold hero__sticker') : '' }) };
    if (STATE === 'loading') return shell(loading('timetable.loading', 3), o);
    if (STATE === 'error') return shell(errorState('timetable.error', 'timetable.retry'), o);
    if (STATE === 'empty') return shell(emptyState(t('timetable.empty'), '', ''), o);
    var picker = '<div class="field field--narrow"><label for="lv">' + t('timetable.levelLabel') + '</label><div class="select-wrap"><select class="select" id="lv">' +
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
    var hours = tt.week.map(function (w) {
      var d = tt.days[byDay[w[1]]];
      var h = d ? d.entries.reduce(function (s, e) { return s + (toMin(e.end) - toMin(e.start)) / 60; }, 0) : 0;
      return [esc(w[0]), h, t('timetable.hours', { n: h })];
    });
    var chart = '<section class="card" aria-labelledby="wk-h"><h2 id="wk-h" class="item-title">' + t('timetable.weekChart') + '</h2><p class="hint">' + t('timetable.weekChartLead') + '</p>' +
      bars(hours, Math.max.apply(null, hours.map(function (r) { return r[1]; })), 'gold') + '</section>';
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
        return pre + '<li class="' + (next ? 'is-next' : '') + '"><p class="tt__time"><span class="tt__start num">' + esc(e.start) + '</span><span class="tt__end num">' + esc(e.end) + '</span></p><div class="tt__body">' +
          (next ? '<p>' + chip(t('timetable.nextIn', { n: toMin(e.start) - NOW.minutes }), 'gold') + '</p>' : '') + course +
          '<p class="tt__venue">' + icon('pin', 'icon--sm') + '<span>' + (e.venue ? esc(e.venue) : '<span class="muted">' + t('timetable.venueMissing') + '</span>') + '</span></p>' +
          '<p class="meta"><span>' + t('timetable.semester', { n: e.semester }) + '</span></p></div></li>';
      }).join('');
      return '<section class="day' + (day.today ? ' day--today' : '') + '" id="d-' + i + '" aria-labelledby="d-' + i + '-h"><div class="day__head"><h2 id="d-' + i + '-h">' + esc(day.day) + '</h2>' +
        (day.today ? chip(t('timetable.today'), 'solid') : '') + '</div><ul class="tt">' + entries + '</ul></section>';
    }).join('');
    shell(week + picker + '<p class="hint">' + t('timetable.note') + ' ' + t('home.ticket.sampleTime', { day: NOW.day, time: NOW.time }) + '</p>' + days + chart, o);
  };

  screens.announcements = function () {
    var n = T.notices;
    var o = { title: n.title, banner: STATE === 'offline' ? 'offline' : '', states: ['loading', 'empty', 'error', 'offline'],
      hero: hero({ photo: 'local-tall', scene: 'hall', seed: 2, people: [[1, 300, 'phone'], [0, 346, 'stand']], title: t('notices.title'), lead: t('notices.lead'), vt: 'notices', label: 'nt-h' }) };
    if (STATE === 'loading') return shell(loading('notices.loading', 3), o);
    if (STATE === 'error') return shell(errorState('notices.error', 'notices.retry'), o);
    if (STATE === 'empty') return shell(emptyState(t('notices.emptyOnline'), '', ''), o);
    var kinds = { university: 'maroon', sug: 'coral', faculty: 'jade', department: 'sky' };
    var items = n.items.map(function (it, i) {
      var open = i === 0;
      var body = open ? esc(it.body) : esc(Array.from(it.body).slice(0, 90).join('').trimEnd()) + '…';
      var scope = n.scopes[it.scope] ? fill(n.scopes[it.scope], { name: it.name }) : '';
      return '<li class="notice notice--' + (kinds[it.scope] || 'maroon') + (i === 0 ? ' notice--lead' : '') + '" data-scope="' + it.scope + '">' +
        (i === 0 ? '<div class="notice__art">' + A.scene('walk', { daypart: DAYPART, seed: 61, people: [[3, 150, 'walk'], [2, 250, 'stand']] }) + '</div>' : '') +
        '<div class="notice__body-wrap"><p class="meta">' + chip(esc(scope), kinds[it.scope] || 'outline') + '<span>' + t('notices.published', { date: it.date }) + '</span>' +
        (i < 2 ? chip(t('notices.newTag'), 'gold') : '') + '</p>' +
        '<h2 class="item-title">' + esc(it.title) + '</h2>' +
        '<p class="notice__body" id="nb-' + i + '">' + body + '</p>' +
        '<button class="btn btn--quiet notice__more" type="button" aria-controls="nb-' + i + '" aria-expanded="' + open + '">' + t(open ? 'notices.less' : 'notices.more') + '</button>' +
        seal(it.status, it.updated, it.source) + '</div></li>';
    }).join('');
    shell(chips(t('notices.filtersLabel'), n.filters, 'notices') + '<ul class="notices">' + items + '</ul>', o);
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
      '<div class="sheet-card glass card--lift">' +
      (STATE === 'registered' ? '<div class="alert alert--success" role="status">' + icon('success') + '<p>' + t('login.registered') + '</p></div>' : '') +
      '<form class="form" novalidate>' +
      field('l-email', t('login.email'), { type: 'email', auto: 'username', value: invalid ? 'student@' : STATE === 'default' || STATE === 'registered' ? '' : L.emailSample, error: invalid ? t('login.errEmail') : '' }) +
      field('l-pass', t('login.password'), { type: 'password', auto: 'current-password', error: invalid ? t('login.errPassword') : '' }) +
      (formError ? '<div class="alert alert--error" role="alert">' + icon('error') + '<p>' + t(formError) + '</p></div>' : '') +
      '<div class="btn-row">' + submitButton(t('login.submit'), t('login.sending')) + '</div></form></div>' +
      '<p>' + t('login.newHere') + ' <a href="register.html' + keep() + '">' + t('login.create') + '</a></p>',
      { title: L.title, banner: STATE === 'offline' ? 'offline' : '', states: ['registered', 'invalid', 'sending', 'wrong', 'busy', 'offline'],
        hero: hero({ photo: 'road', scene: 'walk', seed: 12, people: [[0, 300, 'phone']], title: t('login.title'), lead: t('login.lead'), label: 'lg-h' }) }
    );
  };

  screens.register = function () {
    var invalid = STATE === 'invalid';
    var levels = '<div class="select-wrap"><select class="select" id="r-level"><option value="">' + t('register.levelChoose') + '</option>' +
      [100, 200, 300, 400, 500, 600, 700].map(function (l) { return '<option>' + l + '</option>'; }).join('') + '</select>' + icon('chevron-right', 'icon--sm') + '</div>';
    var depts = '<div class="select-wrap"><select class="select" id="r-dept" aria-describedby="r-dept-hint"><option value="">' + t('register.departmentChoose') + '</option></select>' + icon('chevron-right', 'icon--sm') + '</div>';
    shell(
      '<div class="sheet-card glass card--lift">' +
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
      { title: T.register.title, states: ['invalid', 'sending', 'busy'],
        hero: hero({ scene: 'library', seed: 13, people: [[1, 74, 'wave'], [2, 330, 'stand']], title: t('register.title'), lead: t('register.lead'), label: 'rg-h' }) }
    );
  };

  screens.admin = function () {
    var A2 = T.admin;
    var o = { title: A2.title, signedIn: STATE !== 'signedOut', states: ['signedOut', 'notAdmin', 'session', 'loading', 'empty', 'error', 'busy', 'confirm', 'published', 'invalid'] };
    var lead = STATE === 'signedOut' || STATE === 'notAdmin' ? '' : t('admin.signedInAs', { name: A2.adminName, role: A2.adminRole });
    o.hero = hero({ scene: 'block', seed: 14, people: [[3, 330, 'phone']], title: t('admin.title'), lead: lead, label: 'ad-h' });
    if (STATE === 'signedOut') return shell(emptyState(t('admin.gateLogin'), '', '<a class="btn btn--primary" href="login.html' + keep() + '">' + t('admin.gateLoginLink') + '</a>'), Object.assign(o, { signedIn: false }));
    if (STATE === 'notAdmin') return shell('<div class="state">' + A.piece('nomatch') + '<p class="state__title">' + t('admin.gateNotAdmin') + '</p><p>' + t('admin.gateNotAdminHelp') + '</p></div>', o);
    o.fab = fab(A2.fab, 'plus', '#compose');
    // At a glance: the department's records by status, counted from the sample data.
    var D = T.department, recs = [D].concat(D.courses, D.lecturers), count = { verified: 0, unverified: 0, outdated: 0 };
    recs.forEach(function (r) { count[r.status] = (count[r.status] || 0) + 1; });
    var stats = '<section class="card" aria-labelledby="st-h"><h2 id="st-h" class="item-title">' + t('admin.statsTitle') + '</h2><p class="hint">' + t('admin.statsLead') + '</p>' +
      donut([[t('verification.verified'), count.verified, 'gold'], [t('verification.unverified'), count.unverified, 'muted'], [t('verification.outdated'), count.outdated, 'coral']].filter(function (p) { return p[1]; }),
        recs.length, t('admin.statsTotal', { n: recs.length })) + '</section>';
    var tabs = '<nav class="page-tabs" aria-label="' + t('admin.tabsLabel') + '"><a href="#compose" aria-current="true">' + t('admin.tabCompose') + '</a><a href="#manage">' + t('admin.tabManage') +
      '</a><a href="#verify">' + t('admin.tabVerify') + '</a></nav>';
    var invalid = STATE === 'invalid';
    var title = invalid ? 'ab' : A2.sampleTitle;
    var formAlert = STATE === 'session' ? '<div class="alert alert--error" role="alert">' + icon('lock') + '<p>' + t('banners.sessionEnded') + ' <a href="login.html' + keep() + '">' + t('login.title') + '</a></p></div>'
      : STATE === 'busy' ? '<div class="alert alert--error" role="alert">' + icon('error') + '<p>' + t('banners.busy') + '</p></div>'
      : STATE === 'published' ? '<div class="alert alert--success" role="status">' + icon('success') + '<p>' + t('admin.published', { title: A2.sampleTitle }) + '</p></div>' : '';
    var scopeSel = '<div class="select-wrap"><select class="select" id="a-scope">' + A2.scopeOptions.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select>' + icon('chevron-right', 'icon--sm') + '</div>';
    var targetSel = '<div class="select-wrap"><select class="select" id="a-target"><option>' + esc(A2.targetValue) + '</option></select>' + icon('chevron-right', 'icon--sm') + '</div>';
    var compose = '<section class="section card" id="compose" aria-labelledby="compose-h"><h2 id="compose-h">' + t('admin.composeTitle') + '</h2><p class="lead">' + t('admin.composeLead') + '</p>' +
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
          : '<div class="btn-row btn-row--apart"><button class="btn btn--secondary btn--sm" type="button">' + icon('edit', 'icon--sm') + t('admin.edit') + '</button><button class="btn btn--quiet btn--sm" type="button">' + t('admin.delete') + '</button></div>') + '</li>';
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
      '<div class="field"><span class="label" id="vf">' + t('admin.verifyFilterLabel') + '</span><div class="filter" role="group" aria-labelledby="vf">' +
      A2.verifyFilters.map(function (f, i) { return '<button type="button" aria-pressed="' + (i === 0) + '">' + esc(f) + '</button>'; }).join('') + '</div></div>' + verifyItems + '</section>';
    shell(stats + tabs + compose + manage + verify, o);
  };

  // The visual pack card: its state, a preview of what is in it, and the controls.
  function packCard() {
    var ps = packState(), P = T.pack, count = P.count;
    var status = { ready: ['jade', 'check'], none: ['outline', 'photo'], downloading: ['gold', 'download'], wifi: ['sky', 'wifi'], lite: ['outline', 'leaf'] }[ps];
    var line = { ready: t('pack.readyLine', { n: count, size: P.size, when: P.when }), none: t('pack.noneLine'), downloading: t('pack.downloadingLine', { done: 5, total: count }), wifi: t('pack.wifiLine'), lite: t('pack.liteLine') }[ps];
    var preview = ['library', 'computing', 'hall', 'techpark'].map(function (id, i) { return PK.slot(id, 's', A.scene(['library', 'block', 'hall', 'block'][i], { daypart: 'afternoon', seed: 70 + i }), 'mosaic__pic'); }).join('');
    var actions = ps === 'ready' ? '<button class="btn btn--quiet" type="button" data-pack="none">' + icon('trash', 'icon--sm') + P.remove + '</button>'
      : ps === 'downloading' ? '<button class="btn btn--secondary" type="button" data-pack="none">' + P.cancel + '</button>'
      : ps === 'lite' ? '' : '<button class="btn btn--primary" type="button" data-pack="downloading">' + icon('download', 'icon--sm') + P.download + '</button>';
    return '<section class="card pack" aria-labelledby="pk-h"><div class="mosaic' + (ps === 'ready' ? '' : ' mosaic--off') + '">' + preview + '</div>' +
      '<div class="pack__head">' + (ps === 'downloading' ? sticker(5 / count, '45', '%', P.progressLabel + ' 45%', 'sticker--sm') : '') +
      '<div><h2 id="pk-h" class="item-title">' + P.title + '</h2><p>' + chip(icon(status[1], 'icon--sm') + t('pack.' + ps), status[0]) + '<span class="muted"> ' + P.size + '</span></p></div></div>' +
      '<p>' + line + '</p><p class="hint">' + P.lead + '</p>' + (actions ? '<div class="btn-row">' + actions + '</div>' : '') +
      switchRow('wifi', P.wifiOnly, P.wifiOnlyHint, true, 'data-wifi-switch') + '</section>';
  }

  screens.settings = function () {
    var S = T.settings;
    var mode = document.documentElement.getAttribute('data-mode') || 'auto';
    var credits = PK.ids.filter(function (id) { return !PK.info(id).local || params.get('local') !== '0'; }).map(function (id) {
      var p = PK.info(id);
      return '<li>' + PK.slot(id, 's', A.scene('none', { daypart: 'afternoon', seed: 90 }), 'credit__pic') + '<span><span class="credit__what">' + esc(p.name || p.alt) + '</span><span class="muted">' + esc(p.credit) + '</span></span></li>';
    }).join('');
    shell(
      '<section class="section" aria-labelledby="d-h"><h2 id="d-h">' + t('settings.dataTitle') + '</h2>' + packCard() +
      '<div class="card">' + liteSwitch() + '</div></section>' +
      '<section class="section" aria-labelledby="look-h"><h2 id="look-h">' + t('settings.lookTitle') + '</h2><div class="card"><div class="field"><span class="label" id="th-l">' + t('settings.theme') + '</span>' +
      '<div class="filter" role="group" aria-labelledby="th-l" data-theme-choice>' + ['auto', 'light', 'dark'].map(function (v) {
        return '<button type="button" aria-pressed="' + (v === mode) + '" data-value="' + v + '">' + icon({ auto: 'layers', light: 'sun', dark: 'moon' }[v], 'icon--sm') + t('settings.themes.' + v) + '</button>';
      }).join('') + '</div></div></div></section>' +
      '<section class="section" aria-labelledby="cr-h"><h2 id="cr-h">' + t('settings.creditsTitle') + '</h2><p class="hint">' + t('settings.creditsLead') + '</p><ul class="credits">' + credits + '</ul></section>',
      { title: S.title, states: ['lite', 'offline'], banner: STATE === 'offline' ? 'offline' : '',
        hero: hero({ cls: 'hero--short', scene: 'none', seed: 15, title: t('settings.title'), lead: t('settings.lead'), label: 'se-h' }) }
    );
  };

  // The component sheet and the index live in sheet.js, which only those two pages load.
  if (window.SABI_SHEET) window.SABI_SHEET({ screens: screens, T: T, A: A, M: M, PK: PK, icon: icon, t: t, esc: esc, fill: fill, chip: chip, seal: seal, skeleton: skeleton,
    errorState: errorState, emptyState: emptyState, banner: banner, topbar: topbar, links: links, hero: hero, nextCard: nextCard, liteSwitch: liteSwitch, shell: shell, keep: keep,
    sticker: sticker, bars: bars, donut: donut, chips: chips, fab: fab, packCard: packCard, DAYPART: DAYPART });
  if (SCREEN === 'settings' && STATE === 'lite' && !document.documentElement.hasAttribute('data-lite')) document.documentElement.setAttribute('data-lite', 'url');
  (screens[SCREEN] || screens.index || function () {})();

  // ---------------------------------------------------------------- interactions that work in the prototype
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target : null;
    if (!el) return;
    // Open and close a notice. The text change morphs (View Transitions) where allowed.
    var b = el.closest('[aria-controls^="nb-"]');
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
    var v = el.closest('[data-verify]');
    if (v && !v.hasAttribute('data-needs-source')) {
      var holder = v.closest('[data-verify-item]').querySelector('[data-seal]');
      holder.innerHTML = seal('verified', T.admin.verifiedNow, holder.querySelector('.source p') ? holder.querySelector('.source p').textContent : '', !M.calm());
      M.buzz();
      return;
    }
    // Filter chips: one pressed at a time. Notices and the map filter their lists by it.
    var f = el.closest('.filter button');
    if (f) {
      var group = f.parentNode;
      M.morph(function () {
        group.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === f)); });
        if (group.hasAttribute('data-theme-choice')) setTheme(f.getAttribute('data-value'));
        var which = group.getAttribute('data-filter'), i = Number(f.getAttribute('data-value'));
        if (which === 'notices') document.querySelectorAll('.notice').forEach(function (n) { n.hidden = i > 0 && n.getAttribute('data-scope') !== ['', 'university', 'sug', 'department'][i]; });
        if (which === 'map') document.querySelectorAll('.place').forEach(function (p) { p.hidden = i > 0 && p.getAttribute('data-kind').indexOf(['', 'Library', 'Hall', 'School', 'Hostel'][i]) < 0; });
      });
      return;
    }
    // The visual pack buttons (simulated: nothing downloads in the prototype).
    var pk = el.closest('[data-pack]');
    if (pk) {
      params.delete('pack');
      try { localStorage.setItem('sabi-pack', pk.getAttribute('data-pack')); } catch (err) { params.set('pack', pk.getAttribute('data-pack')); }
      location.search = params.toString();
      return;
    }
    var w = el.closest('[data-wifi-switch]');
    if (w) { w.setAttribute('aria-checked', String(w.getAttribute('aria-checked') !== 'true')); return; }
    // The Lite switch.
    var sw = el.closest('[data-lite-switch]');
    if (sw) M.setLite(sw.getAttribute('aria-checked') !== 'true');
  });
  document.addEventListener('sabi:lite', function () {
    var why = document.documentElement.getAttribute('data-lite');
    document.querySelectorAll('[data-lite-why]').forEach(function (p) { p.textContent = why ? fill(get('home.lite.why.' + why)) : ''; });
  });
})();
