// Screens for students: Welcome, Home, Map, Place detail, Academics, Timetable. Built from SABI_UI.
// Each screen is a function that calls shell({ hero, content }). Sample data: sample.js. Words: copy.js.
(function () {
  'use strict';
  var U = window.SABI_UI, C = U.C, S = U.S, t = U.t, ic = U.ic, esc = U.esc, A = U.A, PK = U.PK, SC = U.SC, M = U.M;
  var STATE = U.STATE, screens = {};
  var NIGHT_GATE = 'local-gate-night gate';

  function today() { return S.week.filter(function (d) { return d.today; })[0]; }
  function nextClass() {
    var list = S.classes[today().short] || [];
    var n = list.filter(function (c) { return U.toMin(c.start) > S.now.minutes; })[0];
    return n ? { c: n, min: U.toMin(n.start) - S.now.minutes } : null;
  }
  function searchBar(ph, id, value) {
    return '<form class="search" role="search" onsubmit="return false"><label class="visually-hidden" for="' + id + '">' + ph + '</label>' + ic('magnifying-glass') +
      '<input id="' + id + '" type="search" autocomplete="off" placeholder="' + esc(ph) + '" value="' + esc(value || '') + '">' +
      '<button class="iconbtn iconbtn--plain" type="button" aria-label="' + t('home.searchFilters') + '">' + ic('sliders-horizontal') + '</button></form>';
  }
  function circleGo(to, label) { return '<a class="go" href="' + to + '" aria-label="' + label + '">' + ic('arrow-right') + '</a>'; }
  function scopeChip(scope) {
    var m = { university: ['gold', 'megaphone'], sug: ['red', 'bell-ringing'], school: ['green', 'buildings'], department: ['indigo', 'book-open-text'] }[scope] || ['gold', 'megaphone'];
    return U.chip(t('notices.scope.' + scope), 'scope-' + m[0], m[1]);
  }
  U.scopeChip = scopeChip; U.searchBar = searchBar; U.circleGo = circleGo; U.nextClass = nextClass; U.today = today;

  // ---------------------------------------------------------------- Welcome
  screens.welcome = function () {
    U.shell({
      title: C.welcome.title, tabs: false, mainCls: 'main--welcome', sample: false,
      hero: U.hero({ size: 'tall', cls: 'hero--welcome', photo: NIGHT_GATE, scene: 'gate', seed: 11, people: [[0, 92, 'walk'], [1, 326, 'wave']], kicker: C.welcome.kicker, title: C.welcome.title, gold: C.welcome.titleGold, lead: C.welcome.lead, noProfile: true, id: 'w-h',
        after: '<div class="cta">' + U.btn(C.welcome.start, { kind: 'maroon', href: U.href('sync'), after: 'arrow-right', cls: 'btn--block btn--lg' }) + '</div>' +
          '<p class="login-line">' + t('welcome.haveAccount') + ' <a href="' + U.href('login') + '">' + t('welcome.login') + '</a></p>' }),
      content: '',
    });
  };

  // ---------------------------------------------------------------- Home
  screens.home = function () {
    var n = nextClass(), noDept = STATE === 'noDept';
    var lecture = (n && !noDept)
      ? '<article class="card card--hl-soft next" aria-labelledby="nx-h">' + U.chip(t('home.nextTitle'), 'gold-solid') +
        '<h2 id="nx-h" class="next__code"><span class="next__icon">' + ic('book-open-text', 'ic--lg') + '</span>' + esc(n.c.code) + '</h2><p class="next__title">' + esc(n.c.title) + '</p>' +
        '<p class="meta-line">' + ic('clock') + '<span class="num">' + U.clock12(n.c.start) + ' to ' + U.clock12(n.c.end) + '</span></p><p class="meta-line">' + ic('map-pin') + '<span>' + esc(n.c.venue) + '</span></p>' +
        circleGo(U.href('timetable'), t('timetable.nextClass')) + '</article>'
      : '<article class="card next" aria-labelledby="nx-h">' + U.chip(t('home.nextTitle'), 'gold-solid') + '<h2 id="nx-h" class="next__code"><span class="next__icon">' + ic('calendar-dots', 'ic--lg') + '</span>' + t('home.noTimetableTitle') + '</h2>' +
        '<p class="next__title">' + t('home.noTimetableLine') + '</p>' + U.btn(t('home.noTimetableAction'), { kind: 'outline', sm: true, href: U.href('timetable', { state: 'noDept' }) }) + '</article>';
    var no = S.notices.filter(function (x) { return x.scope === 'sug'; })[0];
    var notice = STATE === 'noNotice' ? '' : '<article class="card card--hl notice-card" aria-labelledby="ln-h">' + U.chip(t('home.noticeTitle'), 'maroon') +
      '<div class="notice-card__row">' + ic('megaphone', 'ic--lg') + '<h2 id="ln-h" class="notice-card__title">' + esc(no.title) + '</h2></div><p>' + esc(no.body.length > 78 ? no.body.slice(0, 76).trimEnd() + '...' : no.body) + '</p>' +
      '<p class="meta-line">' + ic('calendar-check') + '<span>' + t('notices.from', { source: no.source }) + ' on ' + esc(no.date) + '</span></p>' + circleGo(U.href('notice', { id: no.id }), no.title) + '</article>';
    var places = S.homePlaces.map(function (p, i) {
      var scene = ['gate', 'library', 'block', 'walk'][i];
      return '<li class="place-card">' + PK.slot(p[0] === 'gate' ? 'gate' : p[0], 's', SC.scene(scene, { daypart: 'night', seed: 20 + i }), 'place-card__pic') +
        '<div class="place-card__info"><b><span class="num-badge">' + (i + 1) + '</span>' + esc(p[1]) + '</b><small>' + esc(p[2]) + '</small></div>' + circleGo(U.href('place', { id: ['north-gate', 'library', 'computing', 'north-gate'][i] }), p[1]) + '</li>';
    }).join('');
    U.shell({
      title: C.app.name, states: ['offline', 'syncFailed', 'noDept', 'noNotice'],
      hero: U.hero({ size: 'tall', photo: NIGHT_GATE, scene: 'gate', seed: 11, people: [[0, 92, 'walk'], [1, 326, 'wave']], kicker: C.home.kicker, title: C.home.title, lead: C.home.lead, id: 'home-h',
        badge: (n && !noDept) ? U.badge(n.min) : '', after: searchBar(C.home.search, 'q-home') }),
      content: '<div class="duo">' + lecture + notice + '</div>' +
        '<section class="section" aria-labelledby="pp-h"><div class="section__head"><h2 id="pp-h">' + ic('map-pin') + t('home.popular') + '</h2><a class="link" href="' + U.href('map') + '">' + t('shell.seeAll') + ic('arrow-right', 'ic--sm') + '</a></div>' +
        '<p class="hint">' + t('home.popularHelp') + '</p><ul class="rail" role="list">' + places + '</ul></section>',
    });
  };

  // ---------------------------------------------------------------- Map
  var CATORDER = ['lecture', 'building', 'food', 'library', 'sports', 'health', 'hostel'];
  function placeRow(p, i) {
    var V = window.SABI_MAPVIEW, cat = V.cats[p.cat], photo = V.photoOf[p.id];
    return '<li class="place-row" data-id="' + p.id + '" data-cat="' + p.cat + '" data-name="' + esc(p.name.toLowerCase()) + '">' +
      (photo ? PK.slot(photo, 's', SC.scene('block', { daypart: 'night', seed: 40 + i }), 'place-row__pic') : '<span class="place-row__pic place-row__pic--icon" style="--c:' + cat.color + '">' + ic(cat.icon, 'ic--lg') + '</span>') +
      '<div class="place-row__body"><b>' + esc(p.name) + '</b><small>' + t('map.categories.' + p.cat) + '</small></div>' +
      '<a class="go" href="' + U.href('place', { id: p.id }) + '" aria-label="' + t('map.openPlace') + ': ' + esc(p.name) + '">' + ic('arrow-right') + '</a></li>';
  }
  function placeCard(p) {
    var V = window.SABI_MAPVIEW, photo = V.photoOf[p.id];
    var pic = photo ? PK.slot(photo, 's', SC.scene('block', { daypart: 'night', seed: 5 }), 'sel__pic') : '<span class="sel__pic sel__pic--icon" style="--c:' + V.cats[p.cat].color + '">' + ic(V.cats[p.cat].icon, 'ic--xl') + '</span>';
    return pic + '<div class="sel__body">' + U.chip(t('map.categories.' + p.cat), 'gold-solid') + '<h3>' + esc(p.name) + '</h3>' +
      '<p class="meta-line">' + ic('map-pin') + '<span>' + t('map.sourceLine') + '</span></p><p class="meta-line">' + ic('clock') + '<span>' + t('place.hoursUnknown') + '</span></p>' +
      '<p class="sel__blurb">' + t('map.blurbs.' + p.cat) + '</p></div>';
  }
  screens.map = function () {
    var V = window.SABI_MAPVIEW, q = STATE === 'searchEmpty' ? 'stadium' : '';
    var cats = CATORDER.map(function (k) { return '<li><button class="cat" type="button" data-cat="' + k + '" aria-pressed="false" style="--c:' + V.cats[k].color + '"><span class="cat__icon">' + ic(V.cats[k].icon, 'ic--lg') + '</span><span>' + t('map.categories.' + k) + '</span></button></li>'; }).join('');
    var rows = V.places.map(placeRow).join('');
    var sel = V.place('library');
    U.shell({
      title: C.map.title + ' ' + C.map.titleGold, states: ['offline', 'searchEmpty'],
      hero: U.hero({ size: 'std', photo: NIGHT_GATE, scene: 'gate', seed: 11, kicker: C.map.kicker, title: C.map.title, gold: C.map.titleGold, lead: C.map.lead, id: 'map-h', after: searchBar(C.map.search, 'q-map', q) }),
      content: '<section class="section" aria-labelledby="qc-h"><div class="section__head"><h2 id="qc-h">' + ic('map-pin') + t('map.categoriesTitle') + '</h2></div><ul class="cats" role="list">' + cats + '</ul></section>' +
        '<section class="mapcard" aria-label="' + t('map.mapLabel') + '"><div class="mapcard__host" id="map-host"></div>' +
        '<span class="mapcard__compass" role="img" aria-label="' + t('map.compass') + '">' + ic('compass', 'ic--lg') + '<b>N</b></span>' +
        '<div class="mapcard__zoom"><button class="iconbtn iconbtn--glass" type="button" data-zoom="in" aria-label="' + t('map.zoomIn') + '">' + ic('plus') + '</button><button class="iconbtn iconbtn--glass" type="button" data-zoom="out" aria-label="' + t('map.zoomOut') + '"><svg class="ic" viewBox="0 0 256 256" aria-hidden="true"><path d="M40 128h176" stroke="currentColor" stroke-width="16" stroke-linecap="round" fill="none"/></svg></button></div>' +
        '<button class="btn btn--glass mapcard__me" type="button" data-locate>' + ic('crosshair-simple') + '<span>' + t('map.myLocation') + '</span></button>' +
        '<p class="mapcard__attr">' + t('map.attribution') + '. <a href="https://www.openstreetmap.org/copyright" rel="noopener">' + t('map.attributionLink') + '</a></p></section>' +
        '<p class="hint" id="map-msg" role="status">' + (STATE === 'offline' ? t('map.offlineNote') : t('map.routingSoon')) + '</p>' +
        '<article class="card sel" id="sel" aria-live="polite">' + placeCard(sel) + '<div class="btn-row"><a class="btn btn--outline" id="sel-more" href="' + U.href('place', { id: sel.id }) + '">' + ic('info') + '<span>' + t('map.openPlace') + '</span></a>' +
        '<button class="btn btn--gold" id="sel-map" type="button">' + ic('map-trifold') + '<span>' + t('map.viewOnMap') + '</span></button></div></article>' +
        '<section class="section" aria-labelledby="pl-h"><div class="section__head"><h2 id="pl-h">' + t('map.resultsTitle') + '</h2><span class="hint" id="count"></span></div><ul class="place-list" id="place-list" role="list">' + rows + '</ul>' +
        '<div id="no-match" hidden>' + U.stateBlock({ icon: 'magnifying-glass', title: '<span id="nm-title"></span>', body: t('map.noMatchBody') }) + '</div></section>',
    });
    var host = document.getElementById('map-host'), filter = 'all', ctl;
    function apply() {
      var qv = document.getElementById('q-map').value.trim().toLowerCase(), n = 0;
      document.querySelectorAll('#place-list .place-row').forEach(function (r) {
        var on = (filter === 'all' || r.getAttribute('data-cat') === filter) && (!qv || r.getAttribute('data-name').indexOf(qv) > -1);
        r.hidden = !on; if (on) n++;
      });
      document.getElementById('count').textContent = C.map.resultsCount.replace('{n}', n);
      document.getElementById('no-match').hidden = n > 0; document.getElementById('nm-title').textContent = C.map.noMatchTitle.replace('{q}', document.getElementById('q-map').value);
      if (ctl) ctl.setFilter(filter);
    }
    function choose(id) {
      var p = V.place(id); document.getElementById('sel').innerHTML = placeCard(p) + '<div class="btn-row"><a class="btn btn--outline" id="sel-more" href="' + U.href('place', { id: id }) + '">' + ic('info') + '<span>' + t('map.openPlace') + '</span></a><button class="btn btn--gold" id="sel-map" type="button">' + ic('map-trifold') + '<span>' + t('map.viewOnMap') + '</span></button></div>';
      PK.show(document.getElementById('sel'));
      document.getElementById('sel-map').onclick = function () { ctl.center(id); };
    }
    ctl = V.render(host, { selected: sel.id, onSelect: choose });
    document.getElementById('sel-map').onclick = function () { ctl.center(sel.id); };
    document.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('.cat');
      if (c) { var on = c.getAttribute('aria-pressed') !== 'true'; document.querySelectorAll('.cat').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); c.setAttribute('aria-pressed', String(on)); filter = on ? c.getAttribute('data-cat') : 'all'; apply(); }
      var z = e.target.closest && e.target.closest('[data-zoom]'); if (z) { z.getAttribute('data-zoom') === 'in' ? ctl.zoomIn() : ctl.zoomOut(); }
      if (e.target.closest && e.target.closest('[data-locate]')) { ctl.locate(); document.getElementById('map-msg').textContent = C.map.locationOff + ' (Sample position shown.)'; }
    });
    document.getElementById('q-map').addEventListener('input', apply);
    document.getElementById('place-list').addEventListener('click', function (e) { var r = e.target.closest('.place-row'); if (r && !e.target.closest('a')) { ctl.select(r.getAttribute('data-id'), true); ctl.center(r.getAttribute('data-id')); } });
    apply();
  };

  // ---------------------------------------------------------------- Place detail
  screens.place = function () {
    var V = window.SABI_MAPVIEW, id = U.params.get('id') || 'library', p = V.place(id);
    if (!p || STATE === 'notFound') {
      return U.shell({ title: t('place.title'), states: ['notFound'], hero: U.hero({ size: 'short', scene: 'block', back: { label: t('place.back'), href: U.href('map') }, title: t('place.notFoundTitle'), id: 'pl-h', noProfile: false }), content: U.stateBlock({ icon: 'map-pin', title: t('place.notFoundTitle'), body: t('place.notFoundBody') }) });
    }
    var photo = STATE === 'noPhoto' ? '' : V.photoOf[id], cat = V.cats[p.cat];
    var near = V.places.filter(function (x) { return x.id !== id; }).map(function (x) { return [x, Math.hypot(x.x - p.x, x.y - p.y)]; }).sort(function (a, b) { return a[1] - b[1]; }).slice(0, 3).map(function (x) { return x[0]; });
    var photoBlock = photo ? '' : '<div class="card card--empty-photo">' + ic('image', 'ic--xl') + '<div><b>' + t('place.noPhotoTitle') + '</b><p>' + t('place.noPhotoBody') + '</p></div></div>';
    U.shell({
      title: p.name, states: ['noPhoto', 'notFound'],
      hero: U.hero({ size: 'std', photo: photo, scene: 'block', seed: 7, back: { label: t('place.back'), href: U.href('map') }, kicker: t('place.kicker'), title: p.name, id: 'pl-h',
        after: '<p>' + U.chip(t('map.categories.' + p.cat), 'gold-solid', cat.icon) + '</p>' }),
      content: photoBlock +
        '<article class="card"><h2 class="visually-hidden">' + t('place.about') + '</h2><dl class="facts"><dt>' + t('place.category') + '</dt><dd>' + t('map.categories.' + p.cat) + '</dd><dt>' + t('place.where') + '</dt><dd>' + t('map.sourceLine') + '</dd><dt>' + t('place.hours') + '</dt><dd>' + t('place.hoursUnknown') + '</dd></dl>' +
        '<p>' + t('map.blurbs.' + p.cat) + '</p>' + U.seal({ status: 'unverified', updated: '27 Oct 2026', source: 'OpenStreetMap ' + p.osm + ', not yet checked by FUTA' }) +
        '<div class="btn-row">' + U.btn(t('place.viewOnMap'), { href: U.href('map'), icon: 'map-trifold' }) + '</div></article>' +
        '<section class="mapcard mapcard--small" aria-label="' + t('map.mapLabel') + '"><div class="mapcard__host" id="map-host"></div><p class="mapcard__attr">' + t('map.attribution') + '</p></section>' +
        '<section class="section" aria-labelledby="nb-h"><h2 id="nb-h">' + t('place.nearby') + '</h2><ul class="place-list" role="list">' + near.map(placeRow).join('') + '</ul></section>',
    });
    var host = document.getElementById('map-host'); if (host) V.render(host, { selected: id });
  };

  // ---------------------------------------------------------------- Academics
  screens.academics = function () {
    var d = S.department, sel = U.params.get('school') || 'computing', body;
    var cards = S.schools.map(function (s, i) {
      var on = s.id === sel;
      return '<li><button class="school' + (on ? ' is-on' : '') + '" type="button" data-school="' + s.id + '" aria-pressed="' + on + '">' + PK.slot(s.photo, 's', SC.scene(['block', 'hostel', 'hall', 'library', 'walk', 'gate'][i], { daypart: 'night', seed: 50 + i }), 'school__pic') +
        '<span class="school__body"><span class="school__name">' + ic(s.icon, 'ic--lg') + '<b>' + esc(s.name) + '</b></span><small>' + (s.departments === 1 ? t('academics.department1') : t('academics.departments', { n: s.departments })) + '</small></span>' + ic('arrow-right', 'ic--sm school__go') + '</button></li>';
    }).join('');
    function courseRows() { return d.courses.map(function (c) { return '<li><a class="row" href="#"><span class="code">' + esc(c.code) + '</span><span class="row__title">' + esc(c.title) + '</span>' + ic('caret-right', 'ic--sm') + '</a></li>'; }).join(''); }
    function lecturerRows(all) { return d.lecturers.slice(0, all ? 9 : 3).map(function (l, i) { return '<li><a class="row row--person" href="#">' + A.avatar(l.name, i) + '<span class="row__title"><b>' + esc(l.name) + (l.hod ? ' ' + ic('star-fill', 'ic--sm ic--gold') : '') + '</b><small>' + esc(l.rank) + '</small></span>' + ic('caret-right', 'ic--sm') + '</a></li>'; }).join(''); }
    var school = S.schools.filter(function (s) { return s.id === sel; })[0] || S.schools[0];
    var panel = school.id !== 'computing'
      ? '<article class="card dept">' + U.stateBlock({ icon: school.icon, title: esc(school.name), body: t('academics.lecturersEmpty').replace('lecturer', 'department') }) + '</article>'
      : '<article class="card dept" aria-labelledby="dept-h"><div class="dept__top">' + PK.slot(d.photo, 'l', SC.scene('block', { daypart: 'night', seed: 9 }), 'dept__pic') +
        '<a class="back back--chip" href="' + U.href('academics', { school: null }) + '" data-back-schools>' + ic('arrow-left') + '<span>' + t('academics.back') + '</span></a>' +
        '<div class="dept__head"><span class="dept__icon">' + ic(d.icon, 'ic--xl') + '</span><div><h2 id="dept-h">' + esc(d.name) + '</h2><p>' + esc(d.school) + ' in FUTA</p></div>' + (d.status === 'verified' ? U.chip(t('status.verified'), 'green', 'check-circle-fill') : U.chip(t('status.unverified'), 'dashed', 'warning-circle')) + '</div></div>' +
        '<p class="dept__blurb">' + esc(d.blurb) + '</p>' +
        '<div class="tabs" role="tablist" aria-label="' + esc(d.name) + '">' + ['courses', 'lecturers', 'about'].map(function (k, i) { return '<button class="tabs__tab" role="tab" id="tab-' + k + '" aria-selected="' + (i === 0) + '" aria-controls="pane-' + k + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + ic({ courses: 'book-open-text', lecturers: 'users', about: 'info' }[k]) + '<span>' + t('academics.tabs.' + k) + '</span></button>'; }).join('') + '</div>' +
        '<div class="tabs__pane" role="tabpanel" id="pane-courses" aria-labelledby="tab-courses"><div class="duo duo--flat"><section><h3>' + t('academics.popularCourses') + '</h3><ul class="rows" role="list">' + courseRows() + '</ul></section>' +
        '<section><div class="section__head"><h3>' + t('academics.keyLecturers') + '</h3><a class="link" href="#" data-tab="lecturers">' + t('shell.viewAll') + '</a></div><ul class="rows" role="list">' + lecturerRows() + '</ul></section></div></div>' +
        '<div class="tabs__pane" role="tabpanel" id="pane-lecturers" aria-labelledby="tab-lecturers" hidden><ul class="rows" role="list">' + lecturerRows(true) + '</ul></div>' +
        '<div class="tabs__pane" role="tabpanel" id="pane-about" aria-labelledby="tab-about" hidden><h3>' + t('academics.aboutTitle') + '</h3><dl class="facts"><dt>' + t('academics.office') + '</dt><dd>' + esc(d.office) + '</dd><dt>' + t('academics.email') + '</dt><dd><a href="mailto:' + esc(d.email) + '">' + esc(d.email) + '</a></dd></dl>' + U.seal(d) + '</div></article>';
    var content;
    if (STATE === 'loading') content = U.loading(t('academics.loading'), 4);
    else if (STATE === 'error') content = U.stateBlock({ icon: 'warning-circle', error: true, title: t('academics.errorTitle'), body: t('academics.errorBody'), action: U.btn(t('academics.retry'), { kind: 'outline', icon: 'arrows-clockwise' }) });
    else if (STATE === 'empty') content = U.stateBlock({ icon: 'bank', title: t('academics.emptyTitle'), body: t('academics.emptyBody') });
    else content = '<section class="section" aria-labelledby="sc-h"><div class="section__head"><h2 id="sc-h">' + ic('bank') + t('academics.schoolsTitle') + '</h2><span class="link link--static">' + t('academics.schoolsCount', { n: S.schools.length }) + '</span></div><ul class="schools" role="list">' + cards + '</ul></section>' + panel;
    U.shell({
      title: C.academics.kicker, states: ['loading', 'empty', 'error', 'offline'],
      hero: U.hero({ size: 'std', photo: 'library', scene: 'library', seed: 4, kicker: C.academics.kicker, title: C.academics.title, gold: C.academics.titleGold, lead: C.academics.lead, id: 'ac-h', after: searchBar(C.academics.search, 'q-ac') }),
      content: content,
    });
    document.addEventListener('click', function (e) {
      var s = e.target.closest && e.target.closest('[data-school]');
      if (s) { var u = new URL(location.href); u.searchParams.set('school', s.getAttribute('data-school')); location.href = u.toString(); }
      var tb = e.target.closest && e.target.closest('[data-tab]'); if (tb) { e.preventDefault(); document.getElementById('tab-' + tb.getAttribute('data-tab')).click(); }
    });
    var tabs = document.querySelectorAll('.tabs__tab');
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        tabs.forEach(function (x) { var on = x === b; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
      });
      b.addEventListener('keydown', function (e) {
        var i = Array.prototype.indexOf.call(tabs, b), n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1;
        if (n >= 0) { var nx = tabs[(n + tabs.length) % tabs.length]; nx.focus(); nx.click(); }
      });
    });
  };

  // ---------------------------------------------------------------- Timetable
  screens.timetable = function () {
    var week = S.week, tdy = today(), sel = week.indexOf(tdy);
    function dayCards(d) {
      var list = S.classes[d.short] || [], nx = d.today && nextClass();
      if (!list.length) return '<p class="day-head">' + ic('calendar-dots', 'ic--lg') + '<b>' + esc(d.long) + '</b></p>' + '<div class="card card--empty-day">' + ic('calendar-check', 'ic--xl') + '<div><b>' + t('timetable.emptyDayTitle') + '</b><p>' + t('timetable.emptyDayBody') + '</p></div></div>';
      return '<p class="day-head">' + ic('calendar-dots', 'ic--lg') + '<b>' + esc(d.long) + '</b>' + (d.today && nx ? U.chip(t('timetable.nextClass'), 'gold-solid', 'clock') : '') + '</p>' + list.map(function (c) {
        var isNext = nx && nx.c === c;
        return '<a class="card class' + (isNext ? ' card--hl' : '') + '" href="#"><p class="class__time">' + ic('clock') + '<span class="num">' + U.clock12(c.start) + ' to ' + U.clock12(c.end) + '</span>' + (isNext ? U.chip(t('timetable.nextUp') + ', ' + t('timetable.inMin', { n: nx.min }), 'gold-solid') : '') + '</p>' +
          '<h2 class="class__code">' + esc(c.code) + '</h2><p class="class__title">' + esc(c.title) + '</p><p class="class__meta"><span>' + ic('book-open-text') + t('timetable.' + c.kind) + '</span><span>' + ic('map-pin') + esc(c.venue) + '</span></p>' + ic('caret-right', 'class__go') + '</a>';
      }).join('');
    }
    var pills = week.map(function (d, i) { return '<li><button class="day" type="button" data-day="' + i + '" aria-pressed="' + (i === sel) + '"' + (d.today ? ' aria-current="date"' : '') + '><b>' + d.short + '</b><small>' + (d.date >= 26 ? 'Oct ' : 'Nov ') + d.date + '</small></button></li>'; }).join('');
    var content;
    if (STATE === 'loading') content = U.loading(t('timetable.loading'), 3);
    else if (STATE === 'error') content = U.stateBlock({ icon: 'warning-circle', error: true, title: t('timetable.errorTitle'), body: t('timetable.errorBody'), action: U.btn(t('timetable.retry'), { kind: 'outline', icon: 'arrows-clockwise' }) });
    else if (STATE === 'noDept') content = U.stateBlock({ icon: 'bank', title: t('timetable.chooseDepartmentTitle'), body: t('timetable.chooseDepartmentBody'), action: U.btn(t('timetable.chooseDepartment'), { href: U.href('register') }) });
    else {
      var picker = '<div class="pair"><div class="select-box">' + ic('stack') + '<span class="select-box__main"><label for="lv">' + t('timetable.level') + '</label><select id="lv"><option>' + t('timetable.levelValue', { n: 100 }) + '</option><option>' + t('timetable.levelValue', { n: 200 }) + '</option><option>' + t('timetable.levelValue', { n: 300 }) + '</option></select></span>' + ic('caret-down', 'ic--sm') + '</div>' +
        '<div class="select-box">' + ic('calendar-dots') + '<span class="select-box__main"><label for="sm">' + t('timetable.semester') + '</label><select id="sm"><option>' + t('timetable.semesters.first') + '</option><option>' + t('timetable.semesters.second') + '</option></select></span>' + ic('caret-down', 'ic--sm') + '</div></div>';
      var notAdded = STATE === 'empty' ? '<div class="card card--note">' + ic('clock', 'ic--xl') + '<div><b>' + t('timetable.notAddedTitle') + '</b><p>' + t('timetable.notAddedBody') + '</p></div>' + U.btn(t('timetable.contactDept'), { sm: true, icon: 'calendar-dots', href: U.href('academics') }) + '</div>' : '';
      content = picker + '<ul class="days" role="list" aria-label="' + t('timetable.weekNav') + '">' + pills + '</ul><div id="day-view" aria-live="polite">' + (STATE === 'empty' ? '' : dayCards(week[sel]) + (week[sel + 1] ? dayCards(week[sel + 1]) : '')) + '</div>' + notAdded + '<p class="hint">' + t('timetable.times') + ' Sample time: ' + S.now.day + ' ' + S.now.time + '.</p>';
    }
    U.shell({
      title: C.timetable.kicker, states: ['loading', 'empty', 'error', 'noDept', 'offline'],
      hero: U.hero({ size: 'std', photo: NIGHT_GATE, scene: 'gate', seed: 11, people: [[2, 130, 'walk'], [3, 280, 'walk']], kicker: C.timetable.kicker, title: C.timetable.title, lead: C.timetable.lead, id: 'tt-h' }),
      content: content,
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-day]'); if (!b) return;
      var i = Number(b.getAttribute('data-day'));
      M.morph(function () {
        document.querySelectorAll('[data-day]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        document.getElementById('day-view').innerHTML = dayCards(week[i]) + (week[i + 1] ? dayCards(week[i + 1]) : '');
      });
    });
  };

  U.screens = screens;
  if (screens[U.SCREEN]) screens[U.SCREEN]();
})();
