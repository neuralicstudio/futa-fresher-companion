// Screens for students and accounts: Notices, Notice detail, Register, Login, First-time sync, Settings,
// Photo credits. Built from SABI_UI. Notices show their SOURCE ("From SUG"), never a Verified seal.
(function () {
  'use strict';
  var U = window.SABI_UI, C = U.C, S = U.S, t = U.t, ic = U.ic, esc = U.esc, A = U.A, PK = U.PK, SC = U.SC, M = U.M;
  var STATE = U.STATE, screens = {};
  var scopeChip = function (s) { return U.scopeChip(s); };

  // ---------------------------------------------------------------- Notices
  function noticeCard(n, i) {
    var lead = i === 0;
    return '<li data-scope="' + n.scope + '" data-text="' + esc((n.title + ' ' + n.body + ' ' + n.source).toLowerCase()) + '"><article class="card notice' + (lead ? ' card--hl' : '') + (n.unread ? ' is-unread' : '') + '">' +
      '<p class="notice__top">' + scopeChip(n.scope) + '<span class="notice__date">' + esc(n.date) + '</span>' + (n.unread ? '<span class="unread">' + t('notices.unread') + '</span>' : '') + '</p>' +
      '<h2 class="notice__title"><a href="' + U.href('notice', { id: n.id }) + '" class="stretch">' + esc(n.title) + '</a></h2>' +
      '<p class="notice__from">' + ic('megaphone', 'ic--sm') + t('notices.from', { source: n.source }) + '</p>' +
      '<p class="clamp3 notice__body">' + esc(n.body) + '</p>' +
      '<p class="notice__more">' + (n.attachment ? ic('paperclip') : '') + '<span>' + t('notices.viewDetails') + '</span>' + ic('arrow-right', 'ic--sm') + '</p>' + ic('caret-right', 'notice__go') + '</article></li>';
  }
  screens.notices = function () {
    var filters = ['all', 'university', 'sug', 'school', 'department'];
    var chips = '<div class="filter" role="group" aria-label="' + t('notices.title') + '">' + filters.map(function (f, i) { return '<button type="button" data-f="' + f + '" aria-pressed="' + (i === 0) + '">' + t('notices.filters.' + f) + '</button>'; }).join('') + '</div>';
    var content;
    if (STATE === 'loading') content = chips + U.loading(t('notices.loading'), 3);
    else if (STATE === 'error') content = U.stateBlock({ icon: 'warning-circle', error: true, title: t('notices.errorTitle'), body: t('notices.errorBody'), action: U.btn(t('notices.retry'), { kind: 'outline', icon: 'arrows-clockwise' }) });
    else if (STATE === 'empty') content = chips + U.stateBlock({ icon: 'bell', title: t('notices.emptyTitle'), body: t('notices.emptyBody') });
    else content = chips + '<ul class="notices" id="notices" role="list">' + S.notices.map(noticeCard).join('') + '</ul><div id="no-notices" hidden>' + U.stateBlock({ icon: 'bell', title: t('notices.emptyTitle'), body: '<span id="nn-body"></span>' }) + '</div>';
    U.shell({
      title: C.notices.title + ' ' + C.notices.titleGold, states: ['loading', 'empty', 'error', 'offline'],
      hero: U.hero({ size: 'std', photo: 'library', scene: 'library', seed: 4, kicker: C.notices.kicker, title: C.notices.title, gold: C.notices.titleGold, lead: C.notices.lead, id: 'nt-h', after: U.searchBar(C.notices.search, 'q-nt') }),
      content: content,
    });
    var f = 'all', q = document.getElementById('q-nt');
    function apply() {
      var items = document.querySelectorAll('#notices > li'), n = 0, s = q.value.trim().toLowerCase();
      items.forEach(function (li) { var on = (f === 'all' || li.getAttribute('data-scope') === f) && (!s || li.getAttribute('data-text').indexOf(s) > -1); li.hidden = !on; if (on) n++; });
      var empty = document.getElementById('no-notices'); if (!empty) return;
      empty.hidden = n > 0; document.getElementById('nn-body').textContent = C.notices.emptyFiltered.replace('{scope}', C.notices.filters[f]);
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-f]'); if (!b) return;
      f = b.getAttribute('data-f'); document.querySelectorAll('[data-f]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); apply();
    });
    q.addEventListener('input', apply);
  };

  screens.notice = function () {
    var n = S.notices.filter(function (x) { return x.id === (U.params.get('id') || 'n2'); })[0];
    var back = { label: t('notice.back'), href: U.href('notices') };
    if (!n || STATE === 'notFound') return U.shell({ title: t('notice.title'), states: ['notFound'], hero: U.hero({ size: 'plain', back: back, barTitle: C.notice.title, kicker: C.notice.kicker }), content: U.stateBlock({ icon: 'bell', title: t('notice.notFoundTitle'), body: t('notice.notFoundBody') }) });
    var audience = { university: 'Everyone', sug: 'Everyone', school: 'My school', department: 'My department' }[n.scope];
    U.shell({
      title: n.title, states: ['notFound'],
      hero: U.hero({ size: 'plain', back: back, barTitle: C.notice.title, kicker: C.notice.kicker, id: 'nd-h' }),
      content: '<article class="card card--hl notice-full"><p class="notice__top">' + scopeChip(n.scope) + '<span class="notice__date">' + t('notices.posted', { date: n.date }) + '</span></p><h2 class="notice-full__title">' + esc(n.title) + '</h2>' +
        '<p class="notice__from">' + ic('megaphone', 'ic--sm') + t('notices.from', { source: n.source }) + '</p><div class="prose"><p>' + esc(n.body) + '</p></div>' +
        (n.attachment ? '<a class="row row--box" href="#">' + ic('paperclip') + '<span class="row__title"><b>' + t('notices.attachment') + '</b><small>attachment-sample.pdf (sample)</small></span>' + ic('download-simple', 'ic--sm') + '</a>' : '') +
        '<dl class="facts"><dt>' + t('notice.audience', { audience: audience }).split(': ')[0] + '</dt><dd>' + esc(audience) + '</dd><dt>' + t('notice.expires', { date: '' }).trim() + '</dt><dd>' + t('notice.noExpiry') + '</dd></dl></article>' +
        '<article class="card"><h3>' + t('notice.sourceTitle') + '</h3><p>' + t('notice.sourceHelp') + '</p></article>' +
        '<div class="btn-row">' + U.btn(t('notice.share'), { kind: 'outline', icon: 'share-network' }) + U.btn(t('notice.back'), { kind: 'gold', icon: 'arrow-left', href: U.href('notices') }) + '</div>',
    });
  };

  // ---------------------------------------------------------------- forms
  function field(o) {
    var d = [o.hint ? o.id + '-hint' : '', o.err ? o.id + '-err' : ''].filter(Boolean).join(' ');
    var control = o.select
      ? '<select id="' + o.id + '"' + (o.disabled ? ' disabled' : '') + (d ? ' aria-describedby="' + d + '"' : '') + '>' + o.select + '</select>'
      : '<input id="' + o.id + '" type="' + (o.type || 'text') + '" placeholder="' + esc(o.ph || '') + '"' + (o.auto ? ' autocomplete="' + o.auto + '"' : '') + (o.value ? ' value="' + esc(o.value) + '"' : '') + (o.err ? ' aria-invalid="true"' : '') + (d ? ' aria-describedby="' + d + '"' : '') + (o.type === 'email' ? ' inputmode="email" autocapitalize="none" spellcheck="false"' : '') + '>';
    return '<div class="field' + (o.err ? ' is-error' : '') + '"><div class="field__box">' + ic(o.icon, 'field__icon') + '<span class="field__main"><label for="' + o.id + '">' + o.label + (o.optional ? ' <em>' + t('register.optionalTag') + '</em>' : '') + '</label>' + control + '</span>' + (o.trail || (o.select ? ic('caret-down', 'ic--sm field__caret') : '')) + '</div>' +
      (o.hint ? '<p class="field__hint" id="' + o.id + '-hint">' + o.hint + '</p>' : '') + (o.err ? '<p class="field__err" id="' + o.id + '-err">' + ic('warning-circle', 'ic--sm') + '<span>' + o.err + '</span></p>' : '') + '</div>';
  }
  function eye(id, kind) { return '<button class="iconbtn iconbtn--plain" type="button" data-toggle-pw="' + id + '" aria-pressed="false" aria-label="' + t(kind + '.showPassword') + '">' + ic('eye') + '</button>'; }
  function authHero(o) {
    // The student is drawn on top of the photo (an original character, no real person), as the mockups have a person on the right.
    var student = '<svg class="hero__student" viewBox="-62 -128 124 132" aria-hidden="true" focusable="false">' + SC.person(o.who, 0, 0, 1, o.pose) + '</svg>';
    return U.hero({ size: 'std', cls: 'hero--auth', photo: 'road', scene: 'walk', seed: 12, kicker: o.kicker, title: o.title, gold: o.gold, lead: o.lead, id: 'au-h', badge: student });
  }

  screens.register = function () {
    var bad = STATE === 'invalid', taken = STATE === 'taken', sending = STATE === 'sending';
    var errs = bad ? [['r-name', t('register.errName')], ['r-email', t('register.errEmail')], ['r-pass', t('register.errPassword')], ['r-consent', t('register.errConsent')]] : [];
    var summary = bad ? '<div class="alert alert--error" role="alert" tabindex="-1">' + ic('warning-circle') + '<div><b>' + t('register.errorSummary', { n: errs.length }) + '</b><ul>' + errs.map(function (e) { return '<li><a href="#' + e[0] + '">' + e[1] + '</a></li>'; }).join('') + '</ul></div></div>' : '';
    var levels = [100, 200, 300, 400, 500].map(function (l) { return '<option>' + l + '</option>'; }).join('');
    var schools = S.schools.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('');
    var seg = [0, 1, 2, 3].map(function (i) { return '<i class="meter__seg"></i>'; }).join('');
    var form = '<form class="form" novalidate id="reg">' + summary +
      field({ id: 'r-name', icon: 'user-circle', label: t('register.fullName'), ph: C.register.fullNamePh, auto: 'name', value: bad ? 'A' : '', err: bad ? t('register.errName') : '' }) +
      field({ id: 'r-email', icon: 'envelope-simple', label: t('register.email'), ph: C.register.emailPh, type: 'email', auto: 'email', hint: t('register.emailHint'), value: bad ? 'student@' : '', err: bad ? t('register.errEmail') : (taken ? t('register.errTaken') : '') }) +
      field({ id: 'r-pass', icon: 'lock', label: t('register.password'), ph: C.register.passwordPh, type: 'password', auto: 'new-password', trail: eye('r-pass', 'register'), err: bad ? t('register.errPassword') : '' }) +
      '<div class="meter" aria-live="polite"><div class="meter__bar" aria-hidden="true">' + seg + '</div><p class="meter__hint"><b id="meter-word">' + t('register.strength.empty') + '</b> ' + t('register.passwordHint') + '</p></div>' +
      field({ id: 'r-school', icon: 'bank', label: t('register.school'), select: '<option value="">' + t('register.schoolPh') + '</option>' + schools, optional: true }) +
      field({ id: 'r-dept', icon: 'book-open-text', label: t('register.department'), select: '<option value="">' + t('register.departmentPh') + '</option>', optional: true, disabled: true, hint: t('register.departmentHelp') }) +
      field({ id: 'r-level', icon: 'graduation-cap', label: t('register.level'), select: '<option value="">' + t('register.levelPh') + '</option>' + levels, optional: true }) +
      '<div class="check' + (bad ? ' is-error' : '') + '"><input type="checkbox" id="r-consent"' + (bad ? ' aria-invalid="true"' : '') + '><label for="r-consent">' + C.register.consent.replace('{privacy}', '<a href="#privacy">' + esc(C.register.consentLink) + '</a>') + '</label></div>' +
      (STATE === 'busy' ? '<div class="alert alert--error" role="alert">' + ic('warning-circle') + '<p>' + t('register.errBusy') + '</p></div>' : '') + (STATE === 'offline' ? '<div class="alert alert--error" role="alert">' + ic('wifi-slash') + '<p>' + t('register.errOffline') + '</p></div>' : '') +
      '<div class="btn-row">' + (sending ? U.btn(t('register.sending'), { cls: 'btn--block btn--lg is-loading', disabled: true, type: 'submit', icon: 'arrows-clockwise' }) : U.btn(t('register.submit'), { cls: 'btn--block btn--lg', type: 'submit', after: 'arrow-right' })) + '</div>' +
      '<p class="center">' + t('register.haveAccount') + ' <a href="' + U.href('login') + '">' + t('register.login') + '</a></p></form>';
    var takenBar = taken ? '<div class="toast toast--error" role="alert">' + ic('warning-circle') + '<span>' + t('register.errTaken') + '</span><button class="iconbtn iconbtn--plain" type="button" aria-label="' + t('register.dismiss') + '" data-dismiss>' + ic('x') + '</button></div>' : '';
    U.shell({ title: C.register.title + ' ' + C.register.titleGold, states: ['invalid', 'taken', 'sending', 'busy', 'offline'], sample: false, tabs: false,
      hero: authHero({ who: 0, pose: 'wave', kicker: C.register.kicker, title: C.register.title, gold: C.register.titleGold, lead: C.register.lead }),
      content: '<div class="card card--form">' + form + '</div>' + takenBar + '<p class="hint center">' + t('register.optional') + '</p>' });
    var pw = document.getElementById('r-pass'), words = ['empty', 'weak', 'fair', 'good', 'strong'];
    pw.addEventListener('input', function () {
      var v = pw.value, sc = 0; if (v.length >= 8) sc++; if (/[a-z]/.test(v) && /[A-Z]/.test(v)) sc++; if (/\d/.test(v)) sc++; if (/[^A-Za-z0-9]/.test(v)) sc++; if (!v) sc = -1;
      document.querySelectorAll('.meter__seg').forEach(function (s, i) { s.classList.toggle('is-on', i <= sc - 1 + (sc > 0 ? 0 : 0) && sc > 0); s.setAttribute('data-level', sc); });
      document.getElementById('meter-word').textContent = C.register.strength[words[Math.max(0, sc)]] || C.register.strength.empty;
    });
    var deps = { computing: ['Computer Science', 'Information Technology', 'Cyber Security', 'Software Engineering'] };
    document.getElementById('r-school').addEventListener('change', function (e) {
      var d = document.getElementById('r-dept'), list = deps[e.target.value] || (e.target.value ? ['Department one (sample)', 'Department two (sample)'] : []);
      d.disabled = !list.length; d.innerHTML = '<option value="">' + esc(C.register.departmentPh) + '</option>' + list.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
    });
    document.getElementById('reg').addEventListener('submit', function (e) { e.preventDefault(); location.href = U.href('sync'); });
    document.addEventListener('click', function (e) { var d = e.target.closest && e.target.closest('[data-dismiss]'); if (d) d.parentNode.remove(); });
  };

  screens.login = function () {
    var bad = STATE === 'invalid', wrong = STATE === 'wrong', sending = STATE === 'sending';
    var offline = U.stateBlock({ icon: 'wifi-slash', cls: 'state--inline', title: t('login.offlineTitle'), body: t('login.offlineBody') });
    var formErr = { wrong: C.login.errWrong, busy: C.login.errBusy, offline: C.login.errOffline, session: C.login.errSession }[STATE];
    var form = '<form class="form" novalidate id="log">' + (STATE === 'registered' ? '<div class="alert alert--success" role="status">' + ic('check-circle-fill') + '<p>' + t('login.registered') + '</p></div>' : '') +
      field({ id: 'l-email', icon: 'envelope-simple', label: t('login.email'), ph: C.login.emailPh, type: 'email', auto: 'username', value: bad ? 'student@' : wrong || sending ? 'sample@example.com' : '', err: bad ? t('login.errEmail') : '' }) +
      field({ id: 'l-pass', icon: 'lock', label: t('login.password'), ph: C.login.passwordPh, type: 'password', auto: 'current-password', trail: eye('l-pass', 'login'), err: bad ? t('login.errPassword') : (wrong ? t('login.errWrong') : '') }) +
      (formErr && !wrong ? '<div class="alert alert--error" role="alert">' + ic('warning-circle') + '<p>' + esc(formErr) + '</p></div>' : '') +
      '<div class="btn-row">' + (sending ? U.btn(t('login.sending'), { cls: 'btn--block btn--lg is-loading', disabled: true, type: 'submit', icon: 'arrows-clockwise' }) : U.btn(t('login.submit'), { cls: 'btn--block btn--lg', type: 'submit', after: 'arrow-right' })) + '</div>' +
      '<p class="or"><span>' + t('login.or') + '</span></p>' +
      '<a class="btn btn--outline btn--block btn--lg" href="' + U.href('register') + '">' + ic('user-plus') + '<span>' + t('login.noAccount') + ' <b>' + t('login.register') + '</b></span></a></form>';
    U.shell({ title: C.login.title + ' ' + C.login.titleGold, states: ['invalid', 'wrong', 'sending', 'busy', 'session', 'registered', 'offline'], sample: false, tabs: false,
      hero: authHero({ who: 1, pose: 'phone', kicker: C.login.kicker, title: C.login.title, gold: C.login.titleGold, lead: C.login.lead }),
      content: '<div class="card card--form">' + form + '</div>' + offline });
    document.getElementById('log').addEventListener('submit', function (e) { e.preventDefault(); location.href = U.href('home'); });
  };

  // ---------------------------------------------------------------- First-time sync
  screens.sync = function () {
    var done = STATE === 'done', fail = STATE === 'failed', Y = S.sync, rows = ['schools', 'departments', 'courses', 'timetables', 'buildings', 'notices'];
    var icons = { schools: 'graduation-cap', departments: 'buildings', courses: 'book-open-text', timetables: 'calendar-dots', buildings: 'map-pin', notices: 'bell' };
    var pct = done ? 100 : fail ? 41 : Y.percent;
    var list = rows.map(function (k) {
      var a = Y[k][0], b = Y[k][1]; if (done) a = b;
      var st = a >= b ? 'done' : (a > 0 && !fail ? 'now' : (fail && a > 0 ? 'fail' : 'wait'));
      var mark = { done: ic('check-circle-fill', 'st st--done'), now: '<span class="st st--now" aria-hidden="true"></span>', wait: ic('clock', 'st st--wait'), fail: ic('warning-circle-fill', 'st st--fail') }[st];
      return '<li><span class="sync-row__ic">' + ic(icons[k], 'ic--lg') + '</span><span class="sync-row__name">' + t('sync.items.' + k) + '</span><span class="sync-row__n num">' + a + '/' + b + '</span>' + mark + '<span class="visually-hidden">' + t({ done: 'sync.stateDoneTag', now: 'sync.stateSyncingTag', wait: 'sync.stateSyncingTag', fail: 'sync.stateFailTitle' }[st]) + '</span></li>';
    }).join('');
    var ringCard = '<section class="card card--hl-soft syncing" aria-labelledby="sv-h"><div class="syncing__ring" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + t('sync.savingTitle') + '">' + A.ring(pct / 100, 'ring--big') +
      '<span class="syncing__in"><b class="num" data-count="' + pct + '">' + pct + '%</b><small>' + t(done ? 'sync.stateDoneTag' : 'sync.syncing') + '</small></span></div>' +
      '<div class="syncing__list"><h2 id="sv-h">' + t('sync.savingTitle') + '</h2><ul role="list">' + list + '</ul></div></section>';
    var keep = '<div class="card card--soft note-row">' + ic('device-mobile', 'ic--xl') + '<div><b>' + t('sync.keepUsingTitle') + '</b><p>' + t('sync.keepUsingBody') + '</p></div></div>';
    var stateCard = done
      ? '<div class="card card--success note-row" role="status">' + ic('check-circle-fill', 'ic--xl ic--green') + '<div><b>' + t('sync.stateDoneTitle') + '</b><p>' + t('sync.stateDoneBody') + '</p></div></div>' +
        '<section class="card offer" aria-labelledby="of-h">' + ic('image', 'ic--xl') + '<div><h2 id="of-h">' + t('sync.packTitle') + '</h2><p>' + t('sync.packBody', { size: S.pack.size }) + '</p><div class="btn-row">' + U.btn(t('sync.packYes'), { kind: 'gold', icon: 'wifi-high', href: U.href('home', { pack: 'waiting' }) }) + U.btn(t('sync.packNo'), { kind: 'ghost', href: U.href('home', { pack: 'none' }) }) + '</div></div></section>'
      : fail ? '<div class="card card--danger note-row" role="alert">' + ic('wifi-slash', 'ic--xl ic--red') + '<div><b>' + t('sync.stateFailTitle') + '</b><p>' + t('sync.stateFailBody') + '</p></div>' + U.btn(t('sync.retry'), { kind: 'outline-red', sm: true, icon: 'arrows-clockwise' }) + '</div>' : keep;
    var cta = done ? U.btn(t('sync.doneAction'), { href: U.href('home'), after: 'arrow-right', cls: 'btn--block btn--lg' }) : U.btn(t('sync.continue'), { href: U.href('home'), after: 'arrow-right', cls: 'btn--block btn--lg' });
    U.shell({ title: C.sync.kicker, states: ['done', 'failed', 'offline'], tabs: false,
      hero: U.hero({ size: 'std', photo: 'local-gate-night gate', scene: 'gate', seed: 11, kicker: C.sync.kicker, title: C.sync.title, gold: C.sync.titleGold, lead: C.sync.lead, id: 'sy-h' }),
      content: ringCard + stateCard + cta +
        '<section class="card card--soft note-row">' + ic('lightbulb', 'ic--xl') + '<div><h2 class="h3">' + t('sync.whyTitle') + '</h2><p>' + t('sync.whyBody') + '</p></div></section>' +
        '<p class="meta-line meta-line--center">' + ic('database') + '<span>' + t('sync.dataLine', { size: S.sync.sizeMb }) + ' ' + t('sync.wifi') + '</span></p>' });
    if (done) M.buzz();
  };

  // ---------------------------------------------------------------- Settings
  function row(icon, title, sub, o) {
    o = o || {};
    var tag = o.href ? 'a' : 'div';
    return '<' + tag + ' class="srow' + (o.cls ? ' ' + o.cls : '') + '"' + (o.href ? ' href="' + o.href + '"' : '') + '>' + ic(icon, 'srow__ic') + '<span class="srow__main"><b>' + title + '</b><small>' + sub + '</small></span>' + (o.trail || (o.href ? ic('caret-right', 'ic--sm') : '')) + '</' + tag + '>';
  }
  function packState() { return document.documentElement.hasAttribute('data-lite') ? 'lite' : PK.state(); }
  function switchEl(label, on, attr) { return '<button class="switch" type="button" role="switch" aria-label="' + label + '" aria-checked="' + on + '" ' + attr + '></button>'; }
  screens.settings = function () {
    var ps = packState(), P = S.pack, why = document.documentElement.getAttribute('data-lite');
    var line = { none: t('settings.packStates.none'), downloading: t('settings.packStates.downloading', { done: P.downloaded, total: P.count }), waiting: t('settings.packStates.waiting'), ready: t('settings.packStates.ready', { n: P.count, size: P.size }), lite: t('settings.packStates.lite') }[ps];
    var action = ps === 'ready' ? '<button class="btn btn--ghost-red btn--sm" type="button" data-pack="none">' + ic('trash') + '<span>' + t('settings.packRemove') + '</span></button>'
      : ps === 'downloading' ? '<button class="btn btn--outline btn--sm" type="button" data-pack="none">' + t('settings.packStop') + '</button>'
      : ps === 'lite' ? '' : '<button class="btn btn--gold btn--sm" type="button" data-pack="waiting">' + ic('download-simple') + '<span>' + t('settings.packDownload') + '</span></button>';
    var profile = U.AS === 'guest'
      ? '<a class="card card--profile" href="' + U.href('login') + '">' + ic('user-circle', 'ic--xxl') + '<div><b>' + t('profile.guest') + '</b><small>' + t('settings.profileGuest') + '</small></div>' + ic('caret-right', 'ic--sm') + '</a>'
      : '<div class="card card--profile">' + A.avatar(U.AS === 'admin' ? S.admin.name : S.user.name, 0, 'avatar--xl') + '<div><b>' + esc(U.AS === 'admin' ? S.admin.name : S.user.name) + '</b><small>' + (U.AS === 'admin' ? esc(S.admin.roleLabel + ', ' + S.admin.scope) : esc(S.user.department + ', ' + S.user.level + ' Level')) + '</small><a href="#">' + t('settings.profileEdit') + '</a></div>' + ic('pencil-simple', 'ic--sm') + '</div>';
    U.shell({ title: C.settings.title, states: ['offline'], tabs: true, sample: true,
      hero: U.hero({ size: 'short', photo: 'tree', scene: 'hostel', seed: 6, kicker: C.settings.kicker, title: '', lead: C.settings.lead, id: 'se-h', cls: 'hero--settings' }),
      content: '<h1 class="visually-hidden">' + t('settings.title') + '</h1>' + profile +
        '<section class="card" aria-labelledby="od-h">' + row('cloud-arrow-down', '<span id="od-h">' + t('settings.offlineTitle') + '</span>', t('settings.lastSaved', { when: S.storage.lastSaved })) +
        '<button class="srow srow--btn" type="button" data-check>' + ic('arrows-clockwise', 'srow__ic') + '<span class="srow__main"><b>' + t('settings.check') + '</b><small id="check-msg" role="status"></small></span>' + ic('caret-right', 'ic--sm') + '</button>' +
        '<div class="srow">' + ic('database', 'srow__ic') + '<span class="srow__main"><b>' + t('settings.storage') + '</b><span class="bar" role="img" aria-label="' + t('settings.storageValue', { used: S.storage.used, total: S.storage.total }) + '"><i style="width:' + S.storage.pct + '%"></i></span><small>' + t('settings.storageHelp') + '</small></span><span class="srow__val num">' + t('settings.storageValue', { used: S.storage.used, total: S.storage.total }) + '</span></div></section>' +
        '<section class="card card--pack" aria-labelledby="pk-h"><div class="srow">' + ic('image', 'srow__ic') + '<span class="srow__main"><b id="pk-h">' + t('settings.packTitle') + '</b><small>' + t('settings.packBody') + '</small></span></div>' +
        '<p class="pack__state" role="status">' + (ps === 'downloading' ? A.ring(P.downloaded / P.count, 'ring--mini') : '') + '<span>' + line + '</span></p>' + (action ? '<div class="btn-row">' + action + '</div>' : '') +
        '<div class="srow">' + ic('wifi-high', 'srow__ic') + '<span class="srow__main"><b>' + t('settings.packWifi') + '</b><small>' + t('settings.packNote') + '</small></span>' + switchEl(t('settings.packWifi'), true, 'data-wifi') + '</div></section>' +
        '<section class="card">' + '<div class="srow">' + ic('leaf', 'srow__ic') + '<span class="srow__main"><b>' + t('settings.liteTitle') + '</b><small>' + t('settings.liteBody') + '</small><small data-lite-why>' + (why ? t('settings.liteWhy.' + why) : '') + '</small></span>' + switchEl(t('settings.liteTitle'), Boolean(why), 'data-lite-switch') + '</div>' +
'</section>' +
        '<section class="card">' + row('camera', t('settings.creditsTitle'), t('settings.creditsBody'), { href: U.href('credits') }) + row('globe', t('settings.languageTitle'), t('settings.languageBody')) +
        row('info', t('settings.aboutTitle'), t('settings.aboutBody', { version: C.settings.version })) + row('shield-check', t('settings.privacyTitle'), t('settings.privacyBody'), { href: '#privacy' }) + '</section>' +
        (U.AS === 'guest' ? '' : '<section class="card card--danger-soft">' + row('sign-out', t('settings.logout'), t('settings.logoutBody'), { href: U.href('login'), cls: 'srow--danger' }) + '</section>'),
    });
    document.addEventListener('click', function (e) {
      var pk = e.target.closest && e.target.closest('[data-pack]');
      if (pk) { try { localStorage.setItem('sabi-pack', pk.getAttribute('data-pack')); } catch (err) { /* this view only */ } var u = new URL(location.href); u.searchParams.delete('pack'); location.href = u.toString(); }
      var w = e.target.closest && e.target.closest('[data-wifi]'); if (w) w.setAttribute('aria-checked', String(w.getAttribute('aria-checked') !== 'true'));
      if (e.target.closest && e.target.closest('[data-check]')) { var m = document.getElementById('check-msg'); m.textContent = C.settings.checking; setTimeout(function () { m.textContent = C.settings.upToDate; }, 700); }
    });
  };

  // ---------------------------------------------------------------- Photo credits
  screens.credits = function () {
    // Every photo we can credit is listed. The night gate is credited to FUTA's official Facebook page, written permission pending, and is not in the repo yet; its row says only that.
    var shown = PK.ids.map(PK.info);
    var cards = shown.map(function (p, i) {
      return '<li class="card credit">' + PK.slot(p.id, 's', SC.scene('block', { daypart: 'night', seed: 70 + i }), 'credit__pic') + '<span class="num-badge">' + (i + 1) + '</span>' +
        '<div class="credit__body"><b>' + esc(p.alt) + '</b><small>' + t('credits.used', { where: p.used }) + '</small>' + (p.local ? '<small class="pending">' + t('credits.pending') + '</small>' : '<small>' + t('credits.author', { author: p.author }) + '</small><small>' + t('credits.licence', { licence: p.licence }) + '</small>') + '</div>' +
        (p.page ? '<a class="go" href="' + esc(p.page) + '" rel="noopener" aria-label="' + t('credits.source') + ': ' + esc(p.alt) + '">' + ic('arrow-up-right') + '</a>' : '') + '</li>';
    }).join('');
    U.shell({ title: C.credits.title, tabs: false, sample: false,
      hero: U.hero({ size: 'plain', back: { label: t('shell.back'), href: U.href('settings') }, barTitle: C.credits.title, kicker: C.credits.kicker }),
      content: '<p class="lead-text">' + t('credits.lead') + '</p><ul class="credits" role="list">' + cards + '</ul>' +
        '<section class="card"><h2 class="h3">' + t('credits.mapTitle') + '</h2><p>' + t('credits.mapBody') + '</p><p><a href="https://www.openstreetmap.org/copyright" rel="noopener">' + t('credits.mapLink') + '</a></p></section>' +
        '<section class="card"><h2 class="h3">' + t('credits.iconsTitle') + '</h2><p>' + t('credits.iconsBody') + '</p><h2 class="h3">' + t('credits.fontsTitle') + '</h2><p>' + t('credits.fontsBody') + '</p></section>' +
        '<section class="card card--soft"><h2 class="h3">' + t('credits.placeholdersTitle') + '</h2><p>' + t('credits.placeholdersBody') + '</p></section><p class="hint center">' + t('credits.attribution') + '</p><div class="card card--soft center"><b>' + t('credits.footer') + '</b></div>' });
  };

  Object.keys(screens).forEach(function (k) { U.screens[k] = screens[k]; });
  if (screens[U.SCREEN]) screens[U.SCREEN]();
})();
