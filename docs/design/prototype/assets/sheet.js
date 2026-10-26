// The component sheet and the prototype index. Loaded only by components.html and index.html, so
// Home and the other screens do not pay for them. Uses the helpers app.js hands over.
window.SABI_SHEET = function (h) {
  'use strict';
  var screens = h.screens, T = h.T, A = h.A, icon = h.icon, t = h.t, esc = h.esc, fill = h.fill, chip = h.chip, stop = h.stop, seal = h.seal,
    skeleton = h.skeleton, errorState = h.errorState, emptyState = h.emptyState, banner = h.banner, topbar = h.topbar, links = h.links,
    band = h.band, ticket = h.ticket, liteSwitch = h.liteSwitch, shell = h.shell, keep = h.keep, DAYPART = h.DAYPART;

  screens.components = function () {
    var S = T.proto.sheet;
    function cell(label, html) { return '<div class="sheet__cell"><span class="label">' + label + '</span>' + html + '</div>'; }
    function group(title, html, lead) { return '<section class="sheet__group"><h2>' + title + '</h2>' + (lead ? '<p class="lead">' + lead + '</p>' : '') + html + '</section>'; }
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
    var iconNames = ['home', 'map', 'book', 'notice', 'calendar', 'clock', 'pin', 'search', 'route', 'user', 'shield', 'lock', 'refresh', 'offline', 'alert', 'info', 'check', 'edit', 'trash', 'arrow'];
    var iconGrid = '<div class="icon-grid">' + iconNames.map(function (n) { return '<div>' + icon(n, 'icon--lg') + '<span>' + n + '</span></div>'; }).join('') + '</div>' +
      '<div class="icon-grid">' + iconNames.slice(0, 6).map(function (n) { return '<div>' + icon(n, 'icon--lg icon--lit') + '<span>' + n + ', ' + t('proto.sheet.iconCurrent') + '</span></div>'; }).join('') + '</div>';
    function sw(name, label) { return '<div class="swatch"><span style="background:var(--color-' + name + ')"></span><span>' + (label || name) + '</span></div>'; }
    var colour = '<div class="swatch-row">' + ['band-top', 'maroon', 'gold', 'accent', 'paper', 'paper-2', 'paper-3', 'ink', 'muted', 'maroon-wash', 'gold-wash'].map(function (n) { return sw(n); }).join('') + '</div>' +
      '<h3>' + t('proto.sheet.bandEdges') + '</h3><div class="swatch-row">' + ['band-dawn', 'band-day', 'band-dusk', 'band-night'].map(function (n) { return sw(n); }).join('') + '</div>';
    var line = '<ol class="line">' + stop(0, { href: '#', title: t('shell.map'), sub: esc(T.home.signs[0].sub) }) + stop(1, { href: '#', title: t('shell.notices'), sub: esc(T.home.signs[3].sub), extra: chip(esc(T.home.signs[3].extra), 'gold') }) +
      stop(2, { title: esc(T.firstSync.stations[4].name), sub: t('firstSync.waiting'), cls: 'stop--wait' }) + '</ol>';
    var pieces = '<div class="sheet__grid">' + Object.keys(S.pieceNames).map(function (k) { return cell(esc(S.pieceNames[k]), A.piece(k)); }).join('') + '</div>';
    var chips = '<div class="btn-row">' + chip(t('notices.scopes.university'), 'maroon') + chip(t('notices.scopes.sug'), 'gold') + chip(esc(fill(T.notices.scopes.faculty, { name: 'SSS' })), 'wash') +
      chip(esc(fill(T.notices.scopes.department, { name: 'SMC' })), 'outline') + chip(t('timetable.today'), 'solid') + chip(t('home.ticket.in', { n: 25 }), 'gold') + '<span class="code-chip">SSS</span><span class="code-chip">SMC</span></div>';
    var people = '<ul class="list"><li class="person"><span class="monogram" aria-hidden="true">' + esc(A.initials(T.department.lecturers[0].name)) + '</span><p class="item-title">' + esc(T.department.lecturers[0].name) + '</p><p class="muted">' + esc(T.department.lecturers[0].rank) + '</p></li>' +
      '<li class="place"><div class="thumb" data-slot="building-sheet" data-alt="" data-src="">' + icon('pin', 'icon--lg') + '</div><p class="item-title">' + esc(T.map.buildings[0].name) + '</p><p class="meta"><span>' + esc(T.map.buildings[0].type) + '</span></p></li></ul>';
    var stamp = '<div data-verify-item><div data-seal>' + seal('unverified', '9 Oct 2026', '') + '</div><div class="btn-row"><button class="btn btn--primary" type="button" data-verify>' + icon('check', 'icon--sm') + t('proto.sheet.stampTry') + '</button></div></div>';
    var html =
      '<div class="sheet">' +
      group(t('proto.sheet.brand'), '<div class="sheet__grid sheet__grid--wide">' +
        cell(t('proto.sheet.mark'), '<div class="sheet__frame"><section class="band" data-daypart="' + DAYPART + '">' + A.contours(5, { h: 160 }) + '<div class="band__inner">' + A.mark('mark--xl') + '</div></section></div>') +
        cell(t('proto.sheet.appIcon'), '<img class="app-icon" src="' + A.favicon + '" alt="' + t('app.name') + '" width="72" height="72">') + '</div>' +
        cell(t('proto.sheet.wordmark'), '<div class="sheet__frame">' + topbar({ sheet: true }) + '</div>')) +
      group(t('proto.sheet.colour'), colour) +
      group(t('proto.sheet.icons'), iconGrid, t('proto.sheet.iconsLead')) +
      group(t('proto.sheet.line'), line) +
      group(t('proto.sheet.ticket'), '<div style="padding-top:var(--space-3xl)">' + ticket() + '</div>') +
      group(t('proto.sheet.pieces'), pieces) +
      group(t('proto.sheet.chips'), chips) +
      group(t('proto.sheet.people'), people) +
      group(t('proto.sheet.lite'), liteSwitch()) +
      group(t('proto.sheet.buttons'), '<h3>' + t('proto.sheet.primary') + '</h3><div class="sheet__grid">' + states('btn--primary', t('admin.publish')) + '</div>' +
        '<h3>' + t('proto.sheet.secondary') + '</h3><div class="sheet__grid">' + states('btn--secondary', t('academics.retry'), icon('refresh', 'icon--sm')) + '</div>' +
        '<h3>' + t('proto.sheet.quiet') + '</h3><div class="sheet__grid">' + states('btn--quiet', t('home.seeAll')) + '</div>' +
        '<h3>' + t('proto.sheet.danger') + '</h3><div class="sheet__grid">' + states('btn--danger', t('admin.yesDelete'), icon('trash', 'icon--sm')) + '</div>') +
      group(t('proto.sheet.inputs'), '<div class="sheet__grid">' + inputs + '</div>' +
        '<div class="sheet__grid">' + cell(t('proto.sheet.select'), '<div class="select-wrap" style="width:100%"><select class="select" aria-label="' + t('timetable.levelLabel') + '"><option>' + t('department.levelHeading', { level: 100 }) + '</option></select>' + icon('chevron-right', 'icon--sm') + '</div>') +
        cell(t('proto.sheet.textarea'), '<textarea class="textarea" aria-label="' + t('admin.fieldBody') + '">' + esc(T.admin.sampleBody) + '</textarea>') + '</div>') +
      group(t('proto.sheet.seal'), '<div class="sheet__grid sheet__grid--wide">' +
        cell(t('verification.verified'), seal('verified', '21 Oct 2026', T.department.source)) + cell(t('verification.unverified'), seal('unverified', '9 Oct 2026', '')) + cell(t('verification.outdated'), seal('outdated', '2 Feb 2026', 'Sample source: 2025 handbook (sample)')) +
        cell(t('proto.sheet.stampTry'), stamp) + '</div>') +
      group(t('proto.sheet.badges'), '<div class="sheet__grid sheet__grid--wide">' +
        cell(t('proto.sheet.choice'), '<div class="choice" role="group" aria-label="' + t('admin.verifyFilterLabel') + '"><button type="button" aria-pressed="true">' + esc(T.admin.verifyFilters[0]) + '</button><button type="button" aria-pressed="false">' + esc(T.admin.verifyFilters[2]) + '</button></div>') + '</div>') +
      group(t('proto.sheet.list'), '<ul class="list"><li><a class="row-link" href="#"><span class="code-chip">SSS</span><span class="row-link__body"><span class="row-link__title">' + esc(T.academics.schools[0].name) +
        '</span></span><span class="row-link__tip">' + icon('chevron-right') + '</span></a>' + seal('verified', '21 Oct 2026', T.academics.schools[0].source) + '</li></ul>') +
      group(t('proto.sheet.banners'), '<div class="sheet__frame">' + banner('offline') + '</div><div class="sheet__frame">' + banner('syncFailed') + '</div>' +
        '<div class="alert alert--error" role="alert">' + icon('error') + '<p>' + t('banners.busy') + '</p></div>' +
        '<div class="alert alert--error" role="alert">' + icon('lock') + '<p>' + t('banners.sessionEnded') + '</p></div>' +
        '<div class="alert alert--success" role="status">' + icon('success') + '<p>' + t('login.registered') + '</p></div>' +
        '<div class="alert alert--info" role="note">' + icon('info') + '<p>' + t('admin.verifySoon') + '</p></div>') +
      group(t('proto.sheet.states'), '<div class="sheet__grid sheet__grid--wide">' + cell(t('proto.sheet.loading'), '<div style="width:100%">' + skeleton(1) + '</div>') +
        cell(t('proto.sheet.empty'), emptyState(t('academics.empty'), t('academics.emptyHelp'), '')) + cell(t('proto.sheet.error'), errorState('academics.error', 'academics.retry')) + '</div>') +
      group(t('proto.sheet.nav'), '<div class="sheet__frame"><nav class="tabs" aria-label="' + t('shell.navLabel') + '" style="display:grid">' + links(true) + '</nav></div>') +
      group(t('proto.sheet.dialog'), '<div class="dialog" role="dialog" aria-modal="false" aria-labelledby="dlg-h" style="position:static;display:block"><div class="dialog__body"><h3 id="dlg-h">' + t('admin.delete') + '</h3><p>' + t('admin.confirmDelete') +
        '</p><div class="btn-row"><button class="btn btn--danger" type="button">' + icon('trash', 'icon--sm') + t('admin.yesDelete') + '</button><button class="btn btn--secondary" type="button">' + t('admin.cancel') + '</button></div></div></div>' +
        '<p class="hint">' + t('proto.sheet.dialogNote') + '</p>') +
      '</div>';
    shell(html, { title: S.title, band: band({ seed: 15, title: t('proto.sheet.title'), lead: t('proto.sheet.lead') }) });
  };

  screens.index = function () {
    var pages = [
      ['home.html', 'home', ['offline', 'syncFailed', 'noDept']], ['first-sync.html', 'firstSync', ['done']], ['map.html', 'map', ['offline', 'searchEmpty']],
      ['academics.html', 'academics', ['loading', 'empty', 'error', 'offline']], ['department.html', 'department', ['loading', 'empty', 'error', 'notFound', 'offline']],
      ['timetable.html', 'timetable', ['loading', 'empty', 'levelEmpty', 'error', 'offline']], ['announcements.html', 'notices', ['loading', 'empty', 'error', 'offline']],
      ['login.html', 'login', ['registered', 'invalid', 'sending', 'wrong', 'busy', 'offline']], ['register.html', 'register', ['invalid', 'sending', 'busy']],
      ['admin.html', 'admin', ['signedOut', 'notAdmin', 'session', 'loading', 'empty', 'error', 'busy', 'confirm', 'published', 'invalid']], ['components.html', 'components', []],
    ];
    var list = '<ul class="list">' + pages.map(function (p) {
      return '<li><a class="row-link row-link--plain" href="' + p[0] + keep() + '"><span class="row-link__title">' + t('proto.pages.' + p[1]) + '</span><span class="row-link__tip">' + icon('chevron-right') + '</span></a>' +
        (p[2].length ? '<p class="meta">' + p[2].map(function (s) { return '<a href="' + p[0] + keep({ state: s }) + '">' + t('proto.states.' + s) + '</a>'; }).join('') + '</p>' : '') + '</li>';
    }).join('') + '</ul>';
    shell(list, { title: fill(T.proto.indexTitle), band: band({ seed: 1, before: A.mark('mark--xl'), title: t('proto.indexTitle'), lead: t('proto.indexLead') }) });
  };

};
