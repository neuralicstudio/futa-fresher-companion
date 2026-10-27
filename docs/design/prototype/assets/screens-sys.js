// The screens that are not screens of the app: the empty, error and offline states gallery, the component
// sheet (every reusable piece and its states) and the index of every screen.
(function () {
  'use strict';
  var U = window.SABI_UI, C = U.C, S = U.S, t = U.t, ic = U.ic, esc = U.esc, A = U.A, PK = U.PK, SC = U.SC, screens = {};

  function group(title, html, lead) { return '<section class="sheet-group"><h2>' + title + '</h2>' + (lead ? '<p class="hint">' + lead + '</p>' : '') + html + '</section>'; }
  function cell(label, html) { return '<div class="sheet-cell"><span class="label">' + label + '</span>' + html + '</div>'; }

  // ---------------------------------------------------------------- Empty, error and offline states
  screens.states = function () {
    var items = [
      ['Empty list', U.stateBlock({ icon: 'bell', title: t('notices.emptyTitle'), body: t('notices.emptyBody') })],
      ['Empty day', '<div class="card card--empty-day">' + ic('calendar-check', 'ic--xl') + '<div><b>' + t('timetable.emptyDayTitle') + '</b><p>' + t('timetable.emptyDayBody') + '</p></div></div>'],
      ['Not added yet', '<div class="card card--note">' + ic('clock', 'ic--xl') + '<div><b>' + t('timetable.notAddedTitle') + '</b><p>' + t('timetable.notAddedBody') + '</p></div>' + U.btn(t('timetable.contactDept'), { sm: true, icon: 'calendar-dots' }) + '</div>'],
      ['Error, with retry', U.stateBlock({ icon: 'warning-circle', error: true, title: t('states.errorTitle'), body: t('states.errorBody'), action: U.btn(t('states.retry'), { kind: 'outline', icon: 'arrows-clockwise' }) })],
      ['Offline', U.stateBlock({ icon: 'wifi-slash', title: t('states.offlineTitle'), body: t('states.offlineBody') })],
      ['Not found', U.stateBlock({ icon: 'magnifying-glass', title: t('states.notFoundTitle'), body: t('states.notFoundBody') })],
      ['No search match', U.stateBlock({ icon: 'magnifying-glass', title: t('states.noMatchTitle'), body: t('states.noMatchBody') })],
      ['Storage full', U.stateBlock({ icon: 'database', title: t('states.storageFullTitle'), body: t('states.storageFullBody') })],
      ['Loading', U.loading(t('states.loadingTitle'), 2)],
    ];
    var banners = '<div class="banner banner--offline">' + ic('wifi-slash') + '<span>' + t('states.offlineBanner') + '</span></div><div class="banner banner--warn">' + ic('warning-circle') + '<span>' + t('states.syncFailedBanner') + '</span>' + U.btn(t('states.retry'), { kind: 'outline', sm: true, icon: 'arrows-clockwise' }) + '</div>' +
      '<div class="alert alert--error" role="alert">' + ic('warning-circle') + '<p>' + t('states.busy') + '</p></div><div class="alert alert--error" role="alert">' + ic('lock') + '<p>' + t('login.errSession') + '</p></div><div class="alert alert--success" role="status">' + ic('check-circle-fill') + '<p>' + t('login.registered') + '</p></div>';
    U.shell({ title: C.proto.pages.states, tabs: true,
      hero: U.hero({ size: 'short', scene: 'walk', seed: 15, kicker: 'Wetin fit happen', title: C.proto.pages.states, id: 'st-h' }),
      content: '<p class="hint">Every screen has these states. Each uses one icon, one title, one line and at most one action, in the same card style.</p>' + items.map(function (x) { return cell(x[0], x[1]); }).join('') + group('Banners and alerts', banners) });
  };

  // ---------------------------------------------------------------- Components
  screens.components = function () {
    var btnKinds = [['gold', 'Gold'], ['maroon', 'Maroon'], ['outline', 'Outline'], ['ghost', 'Quiet'], ['danger', 'Danger']];
    function states(kind, label, icon) {
      return ['', 'is-hover', 'is-focus', 'is-active', 'is-disabled', 'is-loading'].map(function (s) {
        var nm = s ? s.replace('is-', '') : 'default';
        return cell(nm, '<button class="btn btn--' + kind + ' ' + s + '" type="button"' + (s === 'is-disabled' || s === 'is-loading' ? ' disabled' : '') + '>' + (s === 'is-loading' ? ic('arrows-clockwise') : (icon ? ic(icon) : '')) + '<span>' + label + '</span></button>');
      }).join('');
    }
    var swatches = [['bg', 'Page'], ['card', 'Card'], ['card-2', 'Field on card'], ['field', 'Search field'], ['tabbar', 'Tab bar'], ['outline', 'Card outline'], ['gold', 'Gold'], ['maroon', 'Maroon'], ['green', 'Green'], ['red', 'Red'], ['red-chip', 'SUG chip'], ['indigo', 'Indigo'], ['amber', 'Amber'], ['text', 'Text'], ['muted', 'Muted']]
      .map(function (s) { return '<div class="swatch"><span class="swatch__chip" style="background:var(--color-' + s[0] + ')"></span><span>' + s[1] + '</span><small>' + s[0] + '</small></div>'; }).join('');
    var type = '<div class="type"><p class="hand">Yellowtail, the handwritten line</p><p class="t-3xl">Poppins 700 / 36</p><p class="t-xl">Poppins 700 / 22 section heading</p><p class="t-lg">Poppins 600 / 18 card title</p><p>Poppins 400 / 16 body text</p><p class="hint">Poppins 400 / 14 meta text</p></div>';
    var icons = ['house', 'map-pin', 'graduation-cap', 'calendar-dots', 'bell', 'magnifying-glass', 'sliders-horizontal', 'megaphone', 'book-open-text', 'buildings', 'fork-knife', 'soccer-ball', 'first-aid-kit', 'house-line', 'compass', 'check-circle', 'warning-circle', 'wifi-slash', 'lock', 'eye', 'download-simple', 'trash', 'pencil-simple', 'gear']
      .map(function (n) { return '<div class="icon-cell">' + ic(n, 'ic--lg') + '<small>' + n + '</small></div>'; }).join('');
    var V = window.SABI_MAPVIEW;
    var cats = ['lecture', 'library', 'food', 'sports', 'health'].map(function (k) { return '<li><span class="cat" style="--c:' + V.cats[k].color + '"><span class="cat__icon">' + ic(V.cats[k].icon, 'ic--lg') + '</span><span>' + t('map.categories.' + k) + '</span></span></li>'; }).join('');
    var seals = [{ status: 'verified', updated: '21 Oct 2026', verifiedBy: 'Sample department admin', source: 'Sample source: HOD office' }, { status: 'unverified', updated: '9 Oct 2026', source: 'Sample source: told by a student' }, { status: 'outdated', updated: '2 Feb 2026', source: 'Sample source: 2025 handbook' }];
    var n = S.notices;
    var html = '<div class="sheet-page">' +
      group('Colour', '<div class="swatches">' + swatches + '</div>', 'Exact values in tokens.css. Dark is the default; light is derived.') +
      group('Type', type) +
      group('Brand', '<div class="sheet-row"><div class="sheet-night">' + A.logo('logo--xl') + '</div><div class="sheet-night"><span class="lockup">' + A.logo() + '<span class="lockup__text"><b>Sabi</b><small>' + t('app.tagline') + '</small></span></span></div></div>') +
      group('Icons (Phosphor)', '<div class="icon-grid">' + icons + '</div>') +
      group('Buttons', btnKinds.map(function (k) { return '<h3>' + k[1] + '</h3><div class="sheet-grid">' + states(k[0], k[1], k[0] === 'gold' ? 'arrow-right' : '') + '</div>'; }).join('')) +
      group('Fields', '<div class="sheet-grid sheet-grid--wide">' + cell('default', '<div class="field"><div class="field__box">' + ic('envelope-simple', 'field__icon') + '<span class="field__main"><label for="c1">Email address</label><input id="c1" placeholder="e.g. yourname@gmail.com"></span></div></div>') +
        cell('error', '<div class="field is-error"><div class="field__box">' + ic('envelope-simple', 'field__icon') + '<span class="field__main"><label for="c2">Email address</label><input id="c2" value="student@" aria-invalid="true" aria-describedby="c2e"></span></div><p class="field__err" id="c2e">' + ic('warning-circle', 'ic--sm') + '<span>' + t('login.errEmail') + '</span></p></div>') +
        cell('select', '<div class="field"><div class="field__box">' + ic('bank', 'field__icon') + '<span class="field__main"><label for="c3">School</label><select id="c3"><option>Select your school</option></select></span>' + ic('caret-down', 'ic--sm field__caret') + '</div></div>') +
        cell('search', U.searchBar('Search for a school', 'c4')) + cell('checkbox', '<div class="check"><input type="checkbox" id="c5" checked><label for="c5">I agree to Sabi\'s privacy policy.</label></div>') +
        cell('switch', '<button class="switch" type="button" role="switch" aria-checked="true" aria-label="Switch on"></button> <button class="switch" type="button" role="switch" aria-checked="false" aria-label="Switch off"></button>') +
        cell('segmented', '<div class="seg" role="group" aria-label="Theme"><button aria-pressed="true">Dark</button><button aria-pressed="false">Light</button><button aria-pressed="false">System</button></div>') +
        cell('password meter', '<div class="meter"><div class="meter__bar"><i class="meter__seg is-on" data-level="2"></i><i class="meter__seg is-on" data-level="2"></i><i class="meter__seg"></i><i class="meter__seg"></i></div><p class="meter__hint"><b>Fair</b> Use 8 characters or more.</p></div>') + '</div>') +
      group('Chips and seals', '<div class="btn-row">' + U.scopeChip('university') + U.scopeChip('sug') + U.scopeChip('school') + U.scopeChip('department') + U.chip('Next up', 'gold-solid') + U.chip('Unread', 'unread') + '<span class="num-badge">1</span></div>' +
        '<div class="filter" role="group" aria-label="Filter"><button aria-pressed="true">All</button><button aria-pressed="false">University</button><button aria-pressed="false">SUG</button></div>' +
        '<div class="sheet-grid sheet-grid--wide">' + seals.map(function (s) { return cell(s.status, U.seal(s)); }).join('') + '</div>', 'Verified appears only when an admin verified the record. Notices never carry it: they carry their source.') +
      group('Cards', '<div class="sheet-grid sheet-grid--one">' + cell('notice, highlighted', '<ul class="notices" role="list">' + n.slice(0, 1).map(function (x, i) { return '<li><article class="card notice card--hl"><p class="notice__top">' + U.scopeChip(x.scope) + '<span class="notice__date">' + x.date + '</span></p><h2 class="notice__title">' + esc(x.title) + '</h2><p class="notice__from">' + ic('megaphone', 'ic--sm') + t('notices.from', { source: x.source }) + '</p><p class="clamp3">' + esc(x.body) + '</p></article></li>'; }).join('') + '</ul>') +
        cell('notice, unread', '<ul class="notices" role="list"><li><article class="card notice is-unread"><p class="notice__top">' + U.scopeChip(n[2].scope) + '<span class="notice__date">' + n[2].date + '</span><span class="unread">' + t('notices.unread') + '</span></p><h2 class="notice__title">' + esc(n[2].title) + '</h2><p class="notice__from">' + ic('megaphone', 'ic--sm') + t('notices.from', { source: n[2].source }) + '</p></article></li></ul>') +
        cell('countdown badge', '<div class="sheet-night sheet-night--photo">' + U.badge(12) + '</div>') +
        cell('lecturer row (initials, no faces)', '<ul class="rows" role="list">' + S.department.lecturers.map(function (l, i) { return '<li><a class="row row--person" href="#">' + A.avatar(l.name, i) + '<span class="row__title"><b>' + esc(l.name) + '</b><small>' + esc(l.rank) + '</small></span>' + ic('caret-right', 'ic--sm') + '</a></li>'; }).join('') + '</ul>') +
        cell('map categories', '<ul class="cats" role="list">' + cats + '</ul>') + '</div>') +
      group('Progress', '<div class="sheet-row">' + cell('ring', '<div class="syncing__ring">' + A.ring(0.68, 'ring--big') + '<span class="syncing__in"><b class="num">68%</b><small>Syncing</small></span></div>') + cell('countdown', U.badge(12)) + '</div>') +
      group('Navigation', '<div class="sheet-night"><nav class="tabbar tabbar--static" aria-label="Tabs">' + [['house', 'Home', 1], ['map-pin', 'Map'], ['graduation-cap', 'Academics'], ['calendar-dots', 'Timetable'], ['bell', 'Notices']].map(function (x) { return '<a class="tab" href="#"' + (x[2] ? ' aria-current="page"' : '') + '>' + ic(x[0] + (x[2] ? '-fill' : '')) + '<span>' + x[1] + '</span></a>'; }).join('') + '</nav></div>' +
        '<p class="hint">The profile icon in the top right opens a sheet with Settings and, for admins only, the Admin centre. Open it from any screen.</p>') +
      group('Footer', '<div class="sheet-night">' + U.footer() + '</div>') + '</div>';
    U.shell({ title: C.proto.pages.components, tabs: false, sample: false,
      hero: U.hero({ size: 'short', scene: 'block', seed: 15, kicker: 'Everything we build with', title: C.proto.pages.components, id: 'cp-h' }), content: html });
  };

  // ---------------------------------------------------------------- Index
  screens.index = function () {
    var groups = [
      [C.proto.group.app, [['welcome', []], ['sync', ['done', 'failed', 'offline']], ['home', ['offline', 'syncFailed', 'noDept', 'noNotice']], ['map', ['offline', 'searchEmpty']], ['place', ['noPhoto', 'notFound']], ['academics', ['loading', 'empty', 'error']], ['timetable', ['loading', 'empty', 'error', 'noDept']], ['notices', ['loading', 'empty', 'error']], ['notice', ['notFound']], ['register', ['invalid', 'taken', 'sending', 'busy']], ['login', ['invalid', 'wrong', 'sending', 'busy', 'session']], ['settings', ['offline']], ['credits', []]]],
      [C.proto.group.admin, [['admin', ['signedOut', 'session']], ['publish', ['invalid', 'published', 'session']], ['mynotices', ['confirm', 'drafts', 'empty']], ['verify', ['detail', 'needSource', 'verified', 'empty', 'offline']], ['role', []]]],
      [C.proto.group.system, [['states', []], ['components', []]]],
    ];
    var html = groups.map(function (g) {
      return '<section class="index-group"><h2>' + g[0] + '</h2><ul class="index" role="list">' + g[1].map(function (p) {
        return '<li class="card index__item"><a class="index__link" href="' + U.href(p[0] === 'sync' ? 'sync' : p[0]) + '">' + t('proto.pages.' + p[0]) + ic('arrow-right', 'ic--sm') + '</a>' +
          (p[1].length ? '<p class="index__states">' + p[1].map(function (s) { return '<a href="' + U.href(p[0], { state: s }) + '">' + t('proto.states.' + s) + '</a>'; }).join('') + '</p>' : '') + '</li>';
      }).join('') + '</ul></section>';
    }).join('');
    U.shell({ title: C.proto.indexTitle, tabs: false, sample: false,
      hero: U.hero({ size: 'std', photo: 'local-gate-night gate', scene: 'gate', seed: 11, kicker: 'Oya, make we look', title: C.proto.indexTitle, lead: C.proto.indexLead, id: 'ix-h', noProfile: true }), content: html });
  };

  Object.keys(screens).forEach(function (k) { U.screens[k] = screens[k]; });
  if (screens[U.SCREEN]) screens[U.SCREEN]();
})();
