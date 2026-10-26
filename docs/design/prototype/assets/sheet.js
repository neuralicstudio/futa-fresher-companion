// The component sheet and the prototype index. Loaded only by components.html and index.html, so
// Home and the other screens do not pay for them. Uses the helpers app.js hands over.
window.SABI_SHEET = function (h) {
  'use strict';
  var screens = h.screens, T = h.T, A = h.A, PK = h.PK, icon = h.icon, t = h.t, esc = h.esc, fill = h.fill, chip = h.chip, seal = h.seal,
    skeleton = h.skeleton, errorState = h.errorState, emptyState = h.emptyState, banner = h.banner, links = h.links,
    hero = h.hero, nextCard = h.nextCard, liteSwitch = h.liteSwitch, shell = h.shell, keep = h.keep, sticker = h.sticker, bars = h.bars,
    donut = h.donut, chips = h.chips, packCard = h.packCard, DAYPART = h.DAYPART;

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
    }).join('') + cell(t('proto.sheet.stateNames.error'), '<div class="field field--full"><input class="input" aria-label="error" aria-invalid="true" value="student@"><p class="field-error">' + icon('error', 'icon--sm') + '<span>' + t('login.errEmail') + '</span></p></div>');
    var iconNames = ['home', 'map', 'book', 'notice', 'calendar', 'clock', 'pin', 'search', 'route', 'user', 'shield', 'lock', 'refresh', 'offline', 'alert', 'info', 'check', 'edit', 'trash', 'arrow',
      'photo', 'download', 'wifi', 'settings', 'sparkle', 'locate', 'plus', 'sun', 'moon', 'layers'];
    var iconGrid = '<div class="icon-grid">' + iconNames.map(function (n) { return '<div>' + icon(n, 'icon--lg') + '<span>' + n + '</span></div>'; }).join('') + '</div>' +
      '<div class="icon-grid">' + iconNames.slice(0, 6).map(function (n) { return '<div>' + icon(n, 'icon--lg icon--lit') + '<span>' + n + ', ' + t('proto.sheet.iconCurrent') + '</span></div>'; }).join('') + '</div>';
    function sw(name) { return '<div class="swatch"><span class="swatch__chip" style="background:var(--color-' + name + ')"></span><span>' + name + '</span></div>'; }
    var colour = '<div class="swatch-row">' + ['night', 'night-2', 'maroon', 'gold', 'jade', 'sky', 'coral', 'accent', 'paper', 'paper-2', 'paper-3', 'ink', 'muted'].map(sw).join('') + '</div>' +
      '<h3>' + t('proto.sheet.bandEdges') + '</h3><div class="sheet__grid sheet__grid--wide">' + ['morning', 'afternoon', 'evening', 'night'].map(function (d) {
        return cell(t('proto.dayparts.' + d), '<div class="sheet__scene">' + A.scene('none', { daypart: d, seed: 3 }) + '</div>');
      }).join('') + '</div>';
    var rings = '<div class="sheet__grid">' + cell(t('home.ticket.in', { n: 25 }), sticker(25 / 60, 25, 'min', t('home.ticket.in', { n: 25 }), 'sticker--gold')) +
      cell(T.pack.progressLabel, sticker(0.45, '45', '%', T.pack.progressLabel, 'sticker--sm')) +
      cell(t('firstSync.ringLabel', { p: 80 }), '<div class="sheet__night"><div class="sync__ring" role="img" aria-label="' + t('firstSync.ringLabel', { p: 80 }) + '">' + A.ring(0.8, 'ring--big') + '<span class="sync__p"><span class="num">80%</span></span></div></div>') + '</div>';
    var pieces = '<div class="sheet__grid">' + Object.keys(S.pieceNames).map(function (k) { return cell(esc(S.pieceNames[k]), A.piece(k)); }).join('') + '</div>';
    var students = '<div class="sheet__scene sheet__scene--wide">' + A.scene('walk', { daypart: DAYPART, seed: 8, people: [[0, 110, 'stand'], [1, 175, 'wave'], [2, 240, 'phone'], [3, 305, 'walk']] }) + '</div>' +
      '<div class="sheet__grid sheet__grid--wide">' + ['block', 'hostel', 'hall', 'library', 'gate', 'walk'].map(function (k, i) { return cell(k, '<div class="sheet__scene">' + A.scene(k, { daypart: 'afternoon', seed: 50 + i }) + '</div>'); }).join('') + '</div>';
    var chipRow = '<div class="btn-row">' + chip(t('notices.scopes.university'), 'maroon') + chip(t('notices.scopes.sug'), 'coral') + chip(esc(fill(T.notices.scopes.faculty, { name: 'SSS' })), 'jade') +
      chip(esc(fill(T.notices.scopes.department, { name: 'SMC' })), 'sky') + chip(t('timetable.today'), 'solid') + chip(t('home.ticket.in', { n: 25 }), 'gold') + chip(t('map.noPhoto'), 'outline') + '<span class="code-chip">SSS</span><span class="pin-code">B1</span></div>' +
      chips(t('notices.filtersLabel'), T.notices.filters);
    var b = T.map.buildings;
    var places = '<ul class="places">' + [b[0], b[3]].map(function (x, i) {
      return '<li class="place">' + PK.slot(x.photo, 's', A.scene(x.scene, { daypart: 'afternoon', seed: 30 + i }), 'place__pic') + '<div class="place__body"><p class="place__top"><span class="pin-code">' + esc(x.code) + '</span><span class="muted">' + esc(x.type) + '</span></p><h3 class="item-title">' + esc(x.name) + '</h3></div></li>';
    }).join('') + '</ul>';
    var people = '<ul class="list"><li class="person"><span class="monogram monogram--jade" aria-hidden="true">' + esc(A.initials(T.department.lecturers[0].name)) + '</span><p class="item-title">' + esc(T.department.lecturers[0].name) + '</p><p class="muted">' + esc(T.department.lecturers[0].rank) + '</p></li></ul>';
    var charts = '<div class="sheet__grid sheet__grid--wide">' + cell(t('department.chartTitle'), '<div class="card">' + bars([['100 Level', 5, '5 units'], ['200 Level', 3, '3 units']], 5, 'maroon') + '</div>') +
      cell(t('admin.statsTitle'), '<div class="card">' + donut([[t('verification.verified'), 4, 'gold'], [t('verification.unverified'), 2, 'muted']], 6, t('admin.statsTotal', { n: 6 })) + '</div>') + '</div>';
    var stamp = '<div data-verify-item><div data-seal>' + seal('unverified', '9 Oct 2026', '') + '</div><div class="btn-row"><button class="btn btn--primary" type="button" data-verify>' + icon('check', 'icon--sm') + t('proto.sheet.stampTry') + '</button></div></div>';
    var html =
      '<div class="sheet">' +
      group(t('proto.sheet.brand'), '<div class="sheet__grid sheet__grid--wide">' +
        cell(t('proto.sheet.mark'), '<div class="sheet__night">' + A.mark('mark--xl') + '</div>') +
        cell(t('proto.sheet.appIcon'), '<img class="app-icon" src="' + A.favicon + '" alt="' + t('app.name') + '" width="72" height="72">') + '</div>') +
      group(t('proto.sheet.colour'), colour) +
      group(t('proto.sheet.icons'), iconGrid, t('proto.sheet.iconsLead')) +
      group(t('proto.sheet.line'), rings) +
      group(t('proto.sheet.ticket'), '<div class="sheet__photo">' + PK.slot('library', 'l', A.scene('library', { daypart: DAYPART, seed: 4 })) + nextCard() + '</div>') +
      group(t('proto.sheet.students'), students, t('proto.sheet.studentsLead')) +
      group(t('proto.sheet.pieces'), pieces) +
      group(t('proto.sheet.chips'), chipRow) +
      group(t('proto.sheet.people'), places + people) +
      group(t('proto.sheet.charts'), charts) +
      group(t('proto.sheet.pack'), packCard()) +
      group(t('proto.sheet.lite'), '<div class="card">' + liteSwitch() + '</div>') +
      group(t('proto.sheet.buttons'), '<h3>' + t('proto.sheet.primary') + '</h3><div class="sheet__grid">' + states('btn--primary', t('admin.publish')) + '</div>' +
        '<h3>' + t('proto.sheet.secondary') + '</h3><div class="sheet__grid">' + states('btn--secondary', t('academics.retry'), icon('refresh', 'icon--sm')) + '</div>' +
        '<h3>' + t('proto.sheet.quiet') + '</h3><div class="sheet__grid">' + states('btn--quiet', t('home.seeAll')) + '</div>' +
        '<h3>' + t('proto.sheet.danger') + '</h3><div class="sheet__grid">' + states('btn--danger', t('admin.yesDelete'), icon('trash', 'icon--sm')) + '</div>' +
        '<h3>' + t('proto.sheet.gold') + '</h3><div class="sheet__night"><a class="btn btn--gold btn--go" href="#"><span>' + t('welcome.start') + '</span><span class="btn__disc">' + icon('arrow', 'icon--sm') + '</span></a></div>') +
      group(t('proto.sheet.inputs'), '<div class="sheet__grid">' + inputs + '</div>' +
        '<div class="sheet__grid">' + cell(t('proto.sheet.select'), '<div class="select-wrap field--full"><select class="select" aria-label="' + t('timetable.levelLabel') + '"><option>' + t('department.levelHeading', { level: 100 }) + '</option></select>' + icon('chevron-right', 'icon--sm') + '</div>') +
        cell(t('proto.sheet.textarea'), '<textarea class="textarea" aria-label="' + t('admin.fieldBody') + '">' + esc(T.admin.sampleBody) + '</textarea>') + '</div>') +
      group(t('proto.sheet.seal'), '<div class="sheet__grid sheet__grid--wide">' +
        cell(t('verification.verified'), seal('verified', '21 Oct 2026', T.department.source)) + cell(t('verification.unverified'), seal('unverified', '9 Oct 2026', '')) + cell(t('verification.outdated'), seal('outdated', '2 Feb 2026', 'Sample source: 2025 handbook (sample)')) +
        cell(t('proto.sheet.stampTry'), stamp) + '</div>') +
      group(t('proto.sheet.banners'), banner('offline') + banner('syncFailed') +
        '<div class="alert alert--error" role="alert">' + icon('error') + '<p>' + t('banners.busy') + '</p></div>' +
        '<div class="alert alert--error" role="alert">' + icon('lock') + '<p>' + t('banners.sessionEnded') + '</p></div>' +
        '<div class="alert alert--success" role="status">' + icon('success') + '<p>' + t('login.registered') + '</p></div>' +
        '<div class="alert alert--info" role="note">' + icon('info') + '<p>' + t('admin.verifySoon') + '</p></div>') +
      group(t('proto.sheet.states'), '<div class="sheet__grid sheet__grid--wide">' + cell(t('proto.sheet.loading'), '<div class="field--full">' + skeleton(1) + '</div>') +
        cell(t('proto.sheet.empty'), emptyState(t('academics.empty'), t('academics.emptyHelp'), '')) + cell(t('proto.sheet.error'), errorState('academics.error', 'academics.retry')) + '</div>') +
      group(t('proto.sheet.nav'), '<div class="sheet__night"><nav class="tabbar tabbar--static" aria-label="' + t('shell.navLabel') + '">' + links() + '</nav></div>') +
      group(t('proto.sheet.dialog'), '<div class="dialog" role="dialog" aria-modal="false" aria-labelledby="dlg-h"><div class="dialog__body"><h3 id="dlg-h">' + t('admin.delete') + '</h3><p>' + t('admin.confirmDelete') +
        '</p><div class="btn-row"><button class="btn btn--danger" type="button">' + icon('trash', 'icon--sm') + t('admin.yesDelete') + '</button><button class="btn btn--secondary" type="button">' + t('admin.cancel') + '</button></div></div></div>' +
        '<p class="hint">' + t('proto.sheet.dialogNote') + '</p>') +
      '</div>';
    shell(html, { title: S.title, hero: hero({ cls: 'hero--short', scene: 'none', seed: 15, title: t('proto.sheet.title'), lead: t('proto.sheet.lead'), label: 'cp-h' }) });
  };

  screens.index = function () {
    var pages = [
      ['welcome.html', 'welcome', [], 'walk'], ['first-sync.html', 'firstSync', ['done'], 'hostel'], ['home.html', 'home', ['offline', 'syncFailed', 'noDept'], 'gate'],
      ['map.html', 'map', ['offline', 'searchEmpty'], 'none'], ['academics.html', 'academics', ['loading', 'empty', 'error', 'offline'], 'block'],
      ['department.html', 'department', ['loading', 'empty', 'error', 'notFound', 'offline'], 'block'], ['timetable.html', 'timetable', ['loading', 'empty', 'levelEmpty', 'error', 'offline'], 'block'],
      ['announcements.html', 'notices', ['loading', 'empty', 'error', 'offline'], 'hall'], ['login.html', 'login', ['registered', 'invalid', 'sending', 'wrong', 'busy', 'offline'], 'walk'],
      ['register.html', 'register', ['invalid', 'sending', 'busy'], 'library'], ['admin.html', 'admin', ['signedOut', 'notAdmin', 'session', 'loading', 'empty', 'error', 'busy', 'confirm', 'published', 'invalid'], 'block'],
      ['settings.html', 'settings', ['lite', 'offline'], 'none'], ['components.html', 'components', [], 'none'],
    ];
    var list = '<ul class="index">' + pages.map(function (p, i) {
      return '<li class="index__item"><div class="index__art">' + A.scene(p[3], { daypart: ['morning', 'afternoon', 'evening', 'night'][i % 4], seed: 80 + i }) + '</div>' +
        '<a class="index__link" href="' + p[0] + keep() + '">' + t('proto.pages.' + p[1]) + icon('arrow', 'icon--sm') + '</a>' +
        (p[2].length ? '<p class="meta">' + p[2].map(function (s) { return '<a href="' + p[0] + keep({ state: s }) + '">' + t('proto.states.' + s) + '</a>'; }).join('') + '</p>' : '') + '</li>';
    }).join('') + '</ul>';
    shell(list, { title: fill(T.proto.indexTitle), hero: hero({ cls: 'hero--short', scene: 'walk', seed: 1, people: [[0, 300, 'wave']], before: A.mark('mark--xl'), title: t('proto.indexTitle'), lead: t('proto.indexLead'), label: 'ix-h' }) });
  };
};
