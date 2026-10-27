// The shared UI pieces every Sabi screen is made from, drawn from window.SABI_COPY (copy.js, all the words)
// and window.SABI_SAMPLE (sample.js, stand-in data). Screens live in screens-*.js and call into SABI_UI.
// No network, no build. A page says which screen it is with <body data-screen="...">. Query options:
//   ?state=...  the screen's state     ?lite=1|0   ?pack=ready|none|downloading|waiting
//   ?as=guest|student|admin  who is signed in     ?local=0  hide David's local-only photos
//   ?text=200  200% text      ?proto=0  hide the Prototype button
(function () {
  'use strict';
  var C = window.SABI_COPY, S = window.SABI_SAMPLE, A = window.SABI_ART, PK = window.SABI_PACK, SC = window.SABI_SCENES, M = window.SABI_MOTION;
  var params = new URLSearchParams(location.search);
  var SCREEN = document.body.getAttribute('data-screen');
  var STATE = params.get('state') || 'default';
  var ADMIN_SCREENS = { admin: 1, publish: 1, mynotices: 1, verify: 1, role: 1 };
  var AS = params.get('as') || (ADMIN_SCREENS[SCREEN] ? 'admin' : 'student');
  if (params.get('proto') === '0') document.body.classList.add('no-proto');
  if (params.get('text')) document.documentElement.style.fontSize = Number(params.get('text')) + '%';
  var fmt = new Intl.NumberFormat('en-NG');

  // ---------------------------------------------------------------- text
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function get(path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, C); }
  function fill(text, vars) { return String(text).replace(/\{(\w+)\}/g, function (m, k) { return vars && k in vars ? vars[k] : m; }); }
  // t('home.title', {n: 3}) -> escaped string. raw('home.title') -> the unescaped string (for attributes you escape yourself).
  function t(path, vars) { var v = get(path); if (v == null) { console.error('missing copy key: ' + path); return esc(path); } return esc(fill(v, vars)); }
  function toMin(hhmm) { var p = hhmm.split(':'); return Number(p[0]) * 60 + Number(p[1]); }
  function clock12(hhmm) { var m = toMin(hhmm), h = Math.floor(m / 60), ap = h >= 12 ? 'PM' : 'AM'; return ((h + 11) % 12 + 1) + ':' + String(m % 60).padStart(2, '0') + ' ' + ap; }

  // ---------------------------------------------------------------- pieces
  function ic(name, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>'; }
  function keep(extra) {
    var p = new URLSearchParams();
    ['proto', 'lite', 'pack', 'local', 'as', 'text'].forEach(function (k) { if (params.get(k)) p.set(k, params.get(k)); });
    if (extra) Object.keys(extra).forEach(function (k) { if (extra[k] == null) p.delete(k); else p.set(k, extra[k]); });
    var s = p.toString(); return s ? '?' + s : '';
  }
  function href(page, extra) { return page + '.html' + keep(extra); }
  function chip(text, cls, icon) { return '<span class="chip' + (cls ? ' chip--' + cls : '') + '">' + (icon ? ic(icon, 'ic--sm') : '') + text + '</span>'; }
  function btn(label, o) {
    o = o || {};
    var cls = 'btn btn--' + (o.kind || 'gold') + (o.sm ? ' btn--sm' : '') + (o.cls ? ' ' + o.cls : '');
    var inner = (o.icon ? ic(o.icon) : '') + '<span>' + label + '</span>' + (o.after ? ic(o.after) : '');
    if (o.href) return '<a class="' + cls + '" href="' + o.href + '">' + inner + '</a>';
    return '<button class="' + cls + '" type="' + (o.type || 'button') + '"' + (o.attrs ? ' ' + o.attrs : '') + (o.disabled ? ' disabled' : '') + '>' + inner + '</button>';
  }
  function sampleBar() { return '<p class="sample-bar proto-only">' + ic('info', 'ic--sm') + '<span>' + t('app.sampleBar') + '</span></p>'; }

  // The seal: only a record an admin verified says "Verified". Notices never use it; they show their source.
  function seal(rec) {
    var map = { verified: ['seal--verified', 'check-circle-fill', 'status.verified'], unverified: ['seal--unverified', 'warning-circle', 'status.unverified'], outdated: ['seal--outdated', 'warning', 'status.outdated'] };
    var m = map[rec.status] || ['seal--unverified', 'info', 'status.unknown'];
    var by = rec.status === 'verified' && rec.verifiedBy ? t('status.verifiedBy', { who: rec.verifiedBy, date: rec.updated }) : '';
    return '<div class="seal-wrap"><p class="seal-line"><span class="seal ' + m[0] + '">' + ic(m[1], 'ic--sm') + t(m[2]) + '</span>' +
      '<span class="seal-line__date">' + (rec.updated ? t('shell.updated', { date: rec.updated }) : t('shell.updatedUnknown')) + '</span></p>' +
      '<details class="source"><summary>' + ic('caret-right', 'ic--sm') + t('shell.sourceLabel') + '</summary><p>' + (rec.source ? esc(rec.source) : t('shell.noSource')) + (by ? '<br>' + by : '') + '</p></details></div>';
  }

  function avatarBtn() {
    if (AS === 'guest') return '<button class="iconbtn" type="button" data-open-profile aria-haspopup="dialog" aria-label="' + t('shell.profile') + '">' + ic('user-circle') + '</button>';
    var nm = AS === 'admin' ? S.admin.name : S.user.name;
    return '<button class="iconbtn iconbtn--avatar" type="button" data-open-profile aria-haspopup="dialog" aria-label="' + t('shell.profile') + '">' + A.avatar(nm, 0) + '</button>';
  }
  function lockup() {
    return '<a class="lockup" href="' + href('home') + '" aria-label="' + t('app.name') + ', ' + t('shell.tabs.home') + '">' + A.logo() +
      '<span class="lockup__text"><b>' + t('app.name') + '</b><small>' + t('app.tagline') + '</small></span></a>';
  }
  function backLink(label, to) { return '<a class="back" href="' + to + '">' + ic('arrow-left') + '<span>' + label + '</span></a>'; }

  // ---------------------------------------------------------------- the hero
  // o: { size: tall|std|short|plain, photo (ids, local first), scene, seed, people, back: {label,href}, kicker, title, gold, lead, badge, after, cls, id }
  // The kicker is the screen's ONE handwritten line. The scrim sits under the text, never over the photo's top.
  function hero(o) {
    var size = o.size || 'std', id = o.id || 'h';
    var bg = '';
    if (size !== 'plain') {
      var art = SC.scene(o.scene || 'block', { daypart: 'night', seed: o.seed || 3, people: o.people });
      bg = '<div class="hero__bg" aria-hidden="' + (PK.on() ? 'false' : 'true') + '">' + PK.slot(o.photo || '', 'l', art, 'hero__pic') + '</div>';
    }
    var title = o.title ? '<h1 id="' + id + '">' + esc(o.title) + (o.gold ? ' <span class="gold">' + esc(o.gold) + '</span>' : '') + '</h1>' : '';
    var topRight = (o.noProfile ? '' : '<span class="lite-chip">' + t('shell.liteChip') + '</span>' + avatarBtn());
    var top = size === 'plain'
      ? '<div class="hero__top hero__top--plain">' + backLink(o.back ? o.back.label : t('shell.back'), o.back ? o.back.href : 'javascript:history.back()') + '<h1 class="hero__bar-title" id="' + id + '">' + esc(o.barTitle || '') + '</h1><a class="logo-sm" href="' + href('home') + '" aria-label="' + t('app.name') + '">' + A.logo() + '</a></div>'
      : '<div class="hero__top">' + (o.back ? backLink(o.back.label, o.back.href) : lockup()) + '<span class="hero__tools">' + topRight + '</span></div>';
    var body = '<div class="hero__body">' + (o.kicker ? '<p class="hand">' + esc(o.kicker) + '</p>' : '') + (size === 'plain' ? '' : title) +
      (o.lead ? '<p class="hero__lead">' + esc(o.lead) + '</p>' : '') + (o.after || '') + '</div>';
    var badge = o.badge ? '<div class="hero__badge">' + o.badge + '</div>' : '';
    return '<header class="hero hero--' + size + (o.cls ? ' ' + o.cls : '') + '"' + (size !== 'plain' ? ' aria-labelledby="' + id + '"' : '') + '>' + bg + top + body + badge + '</header>';
  }
  // The countdown badge: a ring with the number that matters.
  function badge(min) {
    var v = Math.max(0, Math.min(1, 1 - min / 60));
    return '<div class="badge-ring" role="img" aria-label="' + t('home.badge.value', { n: min }) + ' ' + t('home.badge.unit') + ' ' + t('home.badge.label') + '">' + A.ring(v, 'ring--badge') +
      '<span class="badge-ring__in">' + ic('clock') + '<b class="num">' + min + '</b><span>' + t('home.badge.unit') + '</span><small>' + t('home.badge.label') + '</small></span></div>';
  }

  // ---------------------------------------------------------------- tabs, footer, profile sheet
  var TABS = [['home', 'house', 'home'], ['map', 'map-pin', 'map'], ['academics', 'graduation-cap', 'academics'], ['timetable', 'calendar-dots', 'timetable'], ['notices', 'bell', 'notices']];
  var CURRENT = { home: 'home', map: 'map', place: 'map', academics: 'academics', timetable: 'timetable', notices: 'notices', notice: 'notices' }[SCREEN];
  function unreadCount() { return S.notices.filter(function (n) { return n.unread; }).length; }
  function tabbar() {
    return '<nav class="tabbar" aria-label="' + t('shell.nav') + '">' + TABS.map(function (x) {
      var cur = CURRENT === x[0];
      var dot = x[0] === 'notices' && unreadCount() ? '<i class="tab__dot" title="' + t('notices.unreadDot') + '"></i><span class="visually-hidden">' + t('notices.unreadDot') + '</span>' : '';
      return '<a class="tab" href="' + href(x[2]) + '"' + (cur ? ' aria-current="page"' : '') + '>' + ic(x[1] + (cur ? '-fill' : '')) + dot + '<span>' + t('shell.tabs.' + x[0]) + '</span></a>';
    }).join('') + '</nav>';
  }
  function footer() {
    return '<footer class="foot">' + A.waves() + '<p class="foot__line">' + A.logo('logo--xs') + '<span>' + t('app.footer') + '</span></p><p class="foot__unofficial">' + t('app.unofficial') + ' <a href="' + href('credits') + '">' + t('settings.creditsTitle') + '</a></p></footer>';
  }
  function profileSheet() {
    var who = AS === 'guest' ? '' : (AS === 'admin' ? S.admin.name : S.user.name);
    var head = AS === 'guest'
      ? '<div class="sheet__who">' + ic('user-circle', 'ic--xl') + '<div><b>' + t('profile.guest') + '</b><small>' + t('profile.guestHelp') + '</small></div></div>'
      : '<div class="sheet__who">' + A.avatar(who, 0, 'avatar--lg') + '<div><b>' + esc(who) + '</b><small>' + (AS === 'admin' ? esc(S.admin.roleLabel + ', ' + S.admin.scope) : t('profile.levelLine', { department: S.user.department, level: S.user.level })) + '</small></div></div>';
    function row(icon, title, sub, to, cls) { return '<a class="sheet__row' + (cls ? ' ' + cls : '') + '" href="' + to + '">' + ic(icon) + '<span><b>' + title + '</b><small>' + sub + '</small></span>' + ic('caret-right', 'ic--sm') + '</a>'; }
    var rows = row('gear', t('profile.settings'), t('profile.settingsSub'), href('settings')) +
      (AS === 'admin' ? row('shield-check', t('profile.admin'), t('profile.adminSub'), href('admin')) : '') +
      (AS === 'guest' ? row('user-circle', t('profile.login'), t('profile.guestHelp'), href('login')) + row('user-plus', t('profile.register'), t('register.optional'), href('register'))
        : row('sign-out', t('profile.logout'), t('profile.logoutSub'), href('login'), 'sheet__row--danger'));
    return '<div class="scrim" data-close-profile hidden></div><div class="sheet" id="profile-sheet" role="dialog" aria-modal="true" aria-labelledby="profile-h" hidden>' +
      '<div class="sheet__grab" aria-hidden="true"></div><h2 id="profile-h" class="visually-hidden">' + t('profile.title') + '</h2>' + head + '<div class="sheet__rows">' + rows + '</div>' +
      '<button class="btn btn--outline btn--block" type="button" data-close-profile>' + '<span>' + t('shell.close') + '</span></button></div>';
  }

  // ---------------------------------------------------------------- the prototype bar (review chrome, not the app)
  function protoBar(states) {
    function sel(kind, values, cur, label) {
      return '<label>' + esc(label) + '<select data-proto="' + kind + '">' + values.map(function (v) { return '<option value="' + v[0] + '"' + (v[0] === cur ? ' selected' : '') + '>' + esc(v[1]) + '</option>'; }).join('') + '</select></label>';
    }
    var lp = params.get('lite') === '1' ? 'on' : params.get('lite') === '0' ? 'off' : (function () { try { return localStorage.getItem('sabi-lite') || 'auto'; } catch (e) { return 'auto'; } })();
    var list = [['default', C.proto.states.default]].concat((states || []).map(function (s) { return [s, C.proto.states[s] || s]; }));
    return '<details class="proto proto-only"><summary>' + t('proto.bar') + '</summary><div class="proto__body">' +
      (states && states.length ? sel('state', list, STATE, C.proto.state) : '') +
      sel('lite', [['auto', C.proto.lites.auto], ['on', C.proto.lites.on], ['off', C.proto.lites.off]], lp, C.proto.lite) +
      sel('pack', [['ready', C.proto.packs.ready], ['none', C.proto.packs.none], ['downloading', C.proto.packs.downloading], ['waiting', C.proto.packs.waiting]], PK.state(), C.proto.pack) +
      sel('as', [['student', 'Student'], ['guest', 'Guest'], ['admin', 'Admin']], AS, 'Signed in as') +
      '<p class="proto__note">' + t('proto.sampleHelp') + '</p><a href="' + href('index') + '">' + t('proto.index') + '</a></div></details>';
  }

  // ---------------------------------------------------------------- the shell
  // o: { title, hero, content, states, tabs (default true), banner, fab, mainCls }
  function shell(o) {
    o = o || {};
    if (o.banner === 'offline' || STATE === 'offline') document.documentElement.setAttribute('data-net', 'offline');
    var banner = '';
    if (STATE === 'offline' && o.banner !== false) banner = '<div class="banner banner--offline" role="status">' + ic('wifi-slash') + '<span>' + t('states.offlineBanner') + '</span></div>';
    if (STATE === 'syncFailed') banner = '<div class="banner banner--warn" role="status">' + ic('warning-circle') + '<span>' + t('states.syncFailedBanner') + '</span>' + btn(t('states.retry'), { kind: 'outline', sm: true, icon: 'arrows-clockwise' }) + '</div>';
    document.getElementById('app').innerHTML =
      window.SABI_ICON_SPRITE + '<a class="skip" href="#main">' + t('shell.skip') + '</a>' +
      '<main id="main" tabindex="-1" class="' + (o.mainCls || '') + '">' + (o.hero || '') + '<div class="page' + (o.pageCls ? ' ' + o.pageCls : '') + '">' + banner + (o.sample === false ? '' : sampleBar()) + (o.content || '') + '</div>' + (o.noFooter ? '' : footer()) + '</main>' +
      (o.fab || '') + (o.tabs === false ? '' : tabbar()) + profileSheet() + protoBar(o.states);
    document.title = (o.title ? o.title + ' | ' : '') + C.app.name;
    var fav = document.createElement('link'); fav.rel = 'icon'; fav.type = 'image/svg+xml'; fav.href = A.favicon; document.head.appendChild(fav);
    M.init(document); PK.show(document);
  }

  // ---------------------------------------------------------------- states (empty, error, offline, loading)
  // One icon in a gold ring with spark dashes, a title, a line and an optional action.
  function stateBlock(o) {
    return '<div class="state' + (o.cls ? ' ' + o.cls : '') + '" role="' + (o.error ? 'alert' : 'status') + '"><span class="state__art">' + ic(o.icon || 'info', 'ic--xl') + A.sparks('l') + A.sparks('r') + '</span>' +
      '<p class="state__title">' + o.title + '</p>' + (o.body ? '<p class="state__body">' + o.body + '</p>' : '') + (o.action || '') + '</div>';
  }
  function loading(label, rows) {
    var r = ''; for (var i = 0; i < (rows || 3); i++) r += '<div class="skeleton__row"><span class="skeleton__bar skeleton__bar--title"></span><span class="skeleton__bar"></span><span class="skeleton__bar skeleton__bar--short"></span></div>';
    return '<p class="muted" role="status">' + label + '</p><div class="skeleton" aria-hidden="true" data-loop>' + r + '</div>';
  }

  // ---------------------------------------------------------------- shared interactions
  var lastFocus = null;
  function openProfile() {
    var s = document.getElementById('profile-sheet'), sc = document.querySelector('.scrim'); if (!s) return;
    lastFocus = document.activeElement; s.hidden = false; sc.hidden = false; document.body.classList.add('is-sheet');
    var f = s.querySelector('a,button'); if (f) f.focus();
  }
  function closeProfile() {
    var s = document.getElementById('profile-sheet'), sc = document.querySelector('.scrim'); if (!s || s.hidden) return;
    s.hidden = true; sc.hidden = true; document.body.classList.remove('is-sheet'); if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    var tg = e.target.closest ? e.target : null; if (!tg) return;
    if (tg.closest('[data-open-profile]')) { openProfile(); return; }
    if (tg.closest('[data-close-profile]')) { closeProfile(); return; }
    var sw = tg.closest('[data-lite-switch]'); if (sw) { M.setLite(sw.getAttribute('aria-checked') !== 'true'); return; }
    var pw = tg.closest('[data-toggle-pw]');
    if (pw) { var inp = document.getElementById(pw.getAttribute('data-toggle-pw')), show = inp.type === 'password'; inp.type = show ? 'text' : 'password'; pw.setAttribute('aria-pressed', String(show)); pw.setAttribute('aria-label', get(show ? 'login.hidePassword' : 'login.showPassword')); pw.innerHTML = ic(show ? 'eye-slash' : 'eye'); return; }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeProfile();
    var s = document.getElementById('profile-sheet');
    if (e.key === 'Tab' && s && !s.hidden) { // keep focus inside the open sheet
      var f = s.querySelectorAll('a,button'), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('change', function (e) {
    var kind = e.target.getAttribute && e.target.getAttribute('data-proto'); if (!kind) return;
    var v = e.target.value;
    if (kind === 'state') { params.set('state', v); if (v === 'default') params.delete('state'); location.search = params.toString(); }
    if (kind === 'as') { params.set('as', v); location.search = params.toString(); }
    if (kind === 'pack') { params.delete('pack'); try { localStorage.setItem('sabi-pack', v); } catch (err) { params.set('pack', v); } location.search = params.toString(); }
    if (kind === 'lite') { params.delete('lite'); try { v === 'auto' ? localStorage.removeItem('sabi-lite') : localStorage.setItem('sabi-lite', v); } catch (err) { if (v !== 'auto') params.set('lite', v === 'on' ? '1' : '0'); } location.search = params.toString(); }
  });
  document.addEventListener('sabi:lite', function () {
    var why = document.documentElement.getAttribute('data-lite');
    document.querySelectorAll('[data-lite-why]').forEach(function (p) { p.textContent = why ? get('settings.liteWhy.' + why) : ''; });
  });

  window.SABI_UI = {
    C: C, S: S, A: A, PK: PK, SC: SC, M: M, params: params, SCREEN: SCREEN, STATE: STATE, AS: AS, fmt: fmt,
    esc: esc, get: get, fill: fill, t: t, toMin: toMin, clock12: clock12, ic: ic, keep: keep, href: href, chip: chip, btn: btn, seal: seal, hero: hero, badge: badge, shell: shell,
    stateBlock: stateBlock, loading: loading, sampleBar: sampleBar, backLink: backLink, footer: footer, avatarBtn: avatarBtn, unreadCount: unreadCount,
  };
})();
