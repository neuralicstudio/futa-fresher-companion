// Admin screens, reached from the profile icon (never from the tab bar) and only for admins:
// Admin home, Publish notice, My notices, Verify data, Your role. Not in the approved mockups as
// full screens except Admin home and the collage, so Publish, My notices, Verify and Your role are
// built here from the same components. Authorisation is the server's: this UI only hides what the
// role cannot do (department admin: own department; faculty admin: own school; super admin: all).
(function () {
  'use strict';
  var U = window.SABI_UI, C = U.C, S = U.S, t = U.t, ic = U.ic, esc = U.esc, A = U.A, M = U.M;
  var STATE = U.STATE, screens = {};
  var back = { label: t('shell.back'), href: U.href('admin') };

  // Not an admin / signed out: the same gate on every admin screen.
  function gate() {
    if (U.AS === 'admin' && STATE !== 'signedOut') return null;
    var out = STATE === 'signedOut' || U.AS === 'guest';
    return U.stateBlock({ icon: out ? 'lock-key' : 'lock', title: out ? t('admin.gateLoginTitle') : t('admin.gateNotAdminTitle'), body: out ? t('admin.gateLoginBody') : t('admin.gateNotAdminBody'),
      action: out ? U.btn(t('profile.login'), { href: U.href('login') }) : U.btn(t('shell.tabs.home'), { kind: 'outline', href: U.href('home') }) });
  }
  function gated(title, states, hero, build) {
    var g = gate();
    U.shell({ title: title, states: states, tabs: true, hero: hero, content: g || build() });
    return !g;
  }

  // ---------------------------------------------------------------- Admin home
  screens.admin = function () {
    var tiles = [['publish', 'megaphone', U.href('publish')], ['mine', 'note-pencil', U.href('mynotices')], ['verify', 'shield-check', U.href('verify')], ['role', 'identification-badge', U.href('role')]];
    var count = S.queue.length;
    gated(C.admin.title, ['signedOut', 'session'],
      U.hero({ size: 'std', photo: 'tree', scene: 'hostel', seed: 6, kicker: C.admin.kicker, title: C.admin.title, lead: C.admin.lead, id: 'ad-h' }),
      function () {
        return (STATE === 'session' ? '<div class="alert alert--error" role="alert">' + ic('lock') + '<p>' + t('admin.sessionEnded') + ' <a href="' + U.href('login') + '">' + t('profile.login') + '</a></p></div>' : '') +
          '<div class="role-bar">' + ic('user-circle', 'ic--lg') + '<span><b>' + esc(S.admin.roleLabel) + '</b>, ' + esc(S.admin.scope) + '</span></div>' +
          '<ul class="tiles" role="list">' + tiles.map(function (x) {
            var tx = C.admin.tiles[x[0]], body = x[0] === 'role' ? t('admin.tiles.role.body', { role: S.admin.roleLabel, scope: S.admin.scope }) : t('admin.tiles.' + x[0] + '.body');
            return '<li><a class="tile" href="' + x[2] + '"><span class="tile__ic">' + ic(x[1], 'ic--xl') + (x[0] === 'verify' ? '<i class="tile__count num" aria-label="' + count + ' waiting">' + count + '</i>' : '') + '</span>' +
              '<b>' + esc(tx.title) + '</b><small>' + body + '</small><span class="go" aria-hidden="true">' + ic('arrow-right') + '</span></a></li>';
          }).join('') + '</ul>';
      });
  };

  // ---------------------------------------------------------------- Publish notice
  screens.publish = function () {
    var done = STATE === 'published', bad = STATE === 'invalid';
    var title = bad ? 'ab' : 'Lecture Theatre Change', msg = 'CSC 101 will now hold at LT A2 instead of LT A1 from Monday.\n\nThanks for your understanding!';
    function seg(k, locked) { return '<button type="button" data-to="' + k + '" aria-pressed="' + (k === 'department') + '"' + (locked ? ' aria-disabled="true" class="is-locked"' : '') + '>' + (locked ? ic('lock', 'ic--sm') : '') + t('publish.sendTo.' + k) + '</button>'; }
    var ok = gated(C.publish.title, ['invalid', 'published', 'session', 'busy', 'offline', 'signedOut'],
      U.hero({ size: 'plain', back: back, barTitle: C.publish.title, kicker: C.publish.kicker, id: 'pu-h' }),
      function () {
        var ban = { session: [C.publish.errSession, 'lock'], busy: [C.publish.errBusy, 'warning-circle'], offline: [C.publish.errOffline, 'wifi-slash'] }[STATE];
        return '<p class="lead-text">' + t('publish.lead') + '</p>' +
          '<form class="form" id="pub" novalidate><div class="field' + (bad ? ' is-error' : '') + '"><div class="field__box field__box--plain"><span class="field__main"><label for="p-title">' + t('publish.fieldTitle') + ' <em class="req" aria-hidden="true">*</em></label><input id="p-title" maxlength="200" value="' + esc(title) + '"' + (bad ? ' aria-invalid="true" aria-describedby="p-title-err"' : '') + '></span><span class="count num" id="c-title">' + t('publish.fieldTitleHint', { n: title.length }) + '</span></div>' +
          (bad ? '<p class="field__err" id="p-title-err">' + ic('warning-circle', 'ic--sm') + '<span>' + t('publish.errTitle') + '</span></p>' : '') + '</div>' +
          '<div class="field"><div class="field__box field__box--plain"><span class="field__main"><label for="p-msg">' + t('publish.fieldMessage') + ' <em class="req" aria-hidden="true">*</em></label><textarea id="p-msg" maxlength="500" rows="5">' + esc(msg) + '</textarea></span><span class="count num" id="c-msg">' + t('publish.fieldMessageHint', { n: msg.length }) + '</span></div><p class="field__hint">' + t('publish.plainText') + '</p></div>' +
          '<div class="field"><span class="label" id="sendto">' + t('publish.fieldSendTo') + ' <em class="req" aria-hidden="true">*</em></span><div class="seg seg--gold" role="group" aria-labelledby="sendto">' + seg('everyone', true) + seg('school', true) + seg('department', false) + '</div><p class="field__hint">' + t('publish.sendToLocked', { scope: 'your department' }) + '</p></div>' +
          '<div class="field"><div class="field__box"><span class="field__main"><span class="label" id="p-src-l">' + t('publish.fieldSource') + '</span><span class="field__value" aria-labelledby="p-src-l">' + esc(S.admin.scope + ' department') + '</span></span></div><p class="field__hint">' + t('publish.fieldSourceHint', { source: S.admin.scope + ' department' }) + '</p></div>' +
          '<div class="field"><div class="field__box"><span class="field__main"><label for="p-exp">' + t('publish.fieldExpires') + '</label><input id="p-exp" type="datetime-local"></span></div><p class="field__hint">' + t('publish.fieldExpiresHint') + '</p></div>' +
          '<section class="card preview" aria-labelledby="pv-h"><h2 id="pv-h" class="h3">' + t('publish.preview') + '</h2><div class="preview__row"><span class="preview__ic">' + ic('megaphone', 'ic--lg') + '</span><div><b id="pv-title">' + esc(title) + '</b><p id="pv-msg" class="clamp3">' + esc(msg) + '</p><small>' + t('publish.previewTo', { audience: 'My department' }) + ', ' + S.now.date + '</small></div></div></section>' +
          (ban ? '<div class="alert alert--error" role="alert">' + ic(ban[1]) + '<p>' + esc(ban[0]) + '</p></div>' : '') +
          '<div class="btn-row">' + U.btn(t('publish.publish'), { cls: 'btn--block btn--lg', type: 'submit', icon: 'paper-plane-tilt' }) + '</div>' +
          (done ? '<div class="card card--success note-row" role="status">' + ic('check-circle-fill', 'ic--xl ic--green') + '<div><b>' + t('publish.published') + '</b><p>' + t('publish.publishedBody') + '</p></div></div><div class="btn-row">' + U.btn(t('publish.publishedView'), { kind: 'outline', href: U.href('mynotices') }) + U.btn(t('publish.publishedAgain'), { kind: 'ghost', href: U.href('publish') }) + '</div>' : '') + '</form>';
      });
    if (!ok) return;
    var ti = document.getElementById('p-title'), ms = document.getElementById('p-msg');
    function sync() {
      document.getElementById('c-title').textContent = C.publish.fieldTitleHint.replace('{n}', ti.value.length); document.getElementById('c-msg').textContent = C.publish.fieldMessageHint.replace('{n}', ms.value.length);
      document.getElementById('pv-title').textContent = ti.value || '…'; document.getElementById('pv-msg').textContent = ms.value || '…';
    }
    ti.addEventListener('input', sync); ms.addEventListener('input', sync);
    document.getElementById('pub').addEventListener('submit', function (e) { e.preventDefault(); location.href = U.href('publish', { state: 'published' }); });
  };

  // ---------------------------------------------------------------- My notices
  screens.mynotices = function () {
    var items = S.mine, confirmId = STATE === 'confirm' ? 'm3' : '', f = STATE === 'drafts' ? 'draft' : 'all';
    function card(n) {
      var ic0 = { m1: 'megaphone', m2: 'calendar-dots', m3: 'info', m4: 'clipboard-text' }[n.id] || 'megaphone';
      if (n.id === confirmId) return '<li><div class="card confirm" role="group" aria-label="' + t('myNotices.confirmTitle') + '">' + ic('trash', 'ic--xl ic--red') + '<div><b>' + t('myNotices.confirmTitle') + '</b><p>' + t('myNotices.confirmBody') + '</p></div><div class="btn-row"><button class="btn btn--outline" type="button" data-cancel>' + t('myNotices.confirmNo') + '</button><button class="btn btn--danger" type="button" data-del="' + n.id + '">' + t('myNotices.confirmYes') + '</button></div></div></li>';
      return '<li data-status="' + n.status + '"><article class="card mine"><span class="mine__ic">' + ic(ic0, 'ic--lg') + '</span><div class="mine__body"><b>' + esc(n.title) + '</b><small>' + esc(n.date) + '</small><small>' + t('myNotices.to', { audience: n.audience }) + '</small></div>' +
        '<span class="pill pill--' + (n.status === 'published' ? 'green' : 'muted') + '">' + t('myNotices.status.' + n.status) + '</span><div class="mine__acts"><button class="iconbtn iconbtn--plain" type="button" aria-label="' + t('myNotices.edit') + ': ' + esc(n.title) + '">' + ic('pencil-simple') + '</button><button class="iconbtn iconbtn--plain iconbtn--red" type="button" data-ask="' + n.id + '" aria-label="' + t('myNotices.delete') + ': ' + esc(n.title) + '">' + ic('trash') + '</button></div></article></li>';
    }
    var chips = '<div class="filter" role="group" aria-label="' + t('myNotices.title') + '">' + ['all', 'published', 'drafts'].map(function (k, i) { return '<button type="button" data-f="' + k + '" aria-pressed="' + (k === 'drafts' ? f === 'draft' : f === 'all' && i === 0) + '">' + t('myNotices.filters.' + k) + '</button>'; }).join('') + '</div>';
    var ok = gated(C.myNotices.title, ['confirm', 'drafts', 'empty', 'loading', 'error', 'offline', 'signedOut'],
      U.hero({ size: 'plain', back: back, barTitle: C.myNotices.title, id: 'mn-h' }),
      function () {
        if (STATE === 'loading') return chips + U.loading(t('myNotices.loading'), 3);
        if (STATE === 'error') return U.stateBlock({ icon: 'warning-circle', error: true, title: t('myNotices.errorTitle'), body: t('myNotices.errorBody'), action: U.btn(t('myNotices.retry'), { kind: 'outline', icon: 'arrows-clockwise' }) });
        if (STATE === 'empty') return chips + U.stateBlock({ icon: 'note-pencil', title: t('myNotices.emptyTitle'), body: t('myNotices.emptyBody'), action: U.btn(t('myNotices.emptyAction'), { href: U.href('publish'), icon: 'megaphone' }) });
        return chips + '<ul class="mines" id="mines" role="list">' + items.map(card).join('') + '</ul><p id="deleted" class="toast toast--ok" role="status" hidden>' + ic('check-circle-fill') + '<span>' + t('myNotices.deleted') + '</span></p>';
      });
    if (!ok) return;
    function filter(k) { document.querySelectorAll('#mines > li[data-status]').forEach(function (li) { li.hidden = k !== 'all' && li.getAttribute('data-status') !== (k === 'drafts' ? 'draft' : k); }); }
    if (f === 'draft') filter('drafts');
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-f]');
      if (b) { document.querySelectorAll('[data-f]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); filter(b.getAttribute('data-f')); }
      var ask = e.target.closest && e.target.closest('[data-ask]');
      if (ask) { var li = ask.closest('li'), id = ask.getAttribute('data-ask'); var n = S.mine.filter(function (x) { return x.id === id; })[0]; li.innerHTML = '<div class="card confirm" role="group" aria-label="' + C.myNotices.confirmTitle + '">' + ic('trash', 'ic--xl ic--red') + '<div><b>' + C.myNotices.confirmTitle + '</b><p>' + C.myNotices.confirmBody + '</p></div><div class="btn-row"><button class="btn btn--outline" type="button" data-cancel>' + C.myNotices.confirmNo + '</button><button class="btn btn--danger" type="button" data-del="' + id + '">' + C.myNotices.confirmYes + '</button></div></div>'; void n; li.querySelector('[data-cancel]').focus(); }
      if (e.target.closest && e.target.closest('[data-cancel]')) location.href = U.href('mynotices');
      var del = e.target.closest && e.target.closest('[data-del]');
      if (del) { del.closest('li').remove(); var d = document.getElementById('deleted'); d.hidden = false; }
    });
  };

  // ---------------------------------------------------------------- Verify data
  screens.verify = function () {
    var id = U.params.get('id') || 'q1', rec = S.queue.filter(function (q) { return q.id === id; })[0] || S.queue[0];
    var detail = STATE === 'detail' || STATE === 'needSource', done = STATE === 'verified';
    var hero = U.hero({ size: 'plain', back: done || detail ? { label: t('verify.back'), href: U.href('verify') } : back, barTitle: C.verify.title, kicker: done ? '' : C.verify.kicker, id: 'vf-h' });
    var ok = gated(C.verify.title, ['detail', 'needSource', 'verified', 'empty', 'offline', 'loading', 'signedOut'], hero, function () {
      if (STATE === 'offline') return U.stateBlock({ icon: 'wifi-slash', error: true, title: t('verify.offlineTitle'), body: t('verify.offlineBody'), action: U.btn(t('verify.retry'), { kind: 'outline', icon: 'arrows-clockwise' }) });
      if (STATE === 'empty') return U.stateBlock({ icon: 'sparkle', title: t('verify.emptyTitle'), body: t('verify.emptyBody') });
      if (STATE === 'loading') return U.loading(t('verify.loading'), 3);
      if (done) return '<div class="state state--win" role="status"><span class="state__art state__art--green">' + ic('shield-check-fill', 'ic--xxl') + A.sparks('l') + A.sparks('r') + '</span><p class="state__title">' + t('verify.verifiedTitle') + '</p><p class="state__body">' + t('verify.verifiedBody') + '</p></div>' +
        '<article class="card queue"><span class="queue__ic">' + ic(rec.icon, 'ic--xl') + '</span><div class="queue__body"><b>' + esc(rec.title) + '</b><small>' + t('verify.source', { source: rec.source }) + '</small><small>' + t('verify.verifiedBy', { who: S.admin.name }) + ', ' + S.now.date + '</small></div></article>' + U.btn(t('verify.back'), { href: U.href('verify'), icon: 'arrow-left', cls: 'btn--block btn--lg' });
      if (detail) {
        var need = STATE === 'needSource';
        return '<article class="card queue"><span class="queue__ic">' + ic(rec.icon, 'ic--xl') + '</span><div class="queue__body"><b>' + esc(rec.title) + '</b><small>' + t('verify.source', { source: rec.source }) + '</small><small>' + t('verify.added', { date: rec.added }) + '</small></div></article>' +
          '<form class="form" id="vform" novalidate><div class="field' + (need ? ' is-error' : '') + '"><div class="field__box"><span class="field__main"><label for="v-src">' + t('verify.sourceChecked') + '</label><input id="v-src" maxlength="300"' + (need ? ' aria-invalid="true" aria-describedby="v-err"' : '') + '></span></div><p class="field__hint">' + t('verify.sourceHint') + '</p>' + (need ? '<p class="field__err" id="v-err">' + ic('warning-circle', 'ic--sm') + '<span>' + t('verify.needSource') + '</span></p>' : '') + '</div>' +
          '<p class="hint">' + t('verify.onlyYours', { scope: S.admin.scope }) + '</p><div class="btn-row">' + U.btn(t('verify.markVerified'), { type: 'submit', icon: 'shield-check', cls: 'btn--block btn--lg' }) + U.btn(t('verify.markOutdated'), { kind: 'outline', icon: 'warning', cls: 'btn--block' }) + '</div></form>';
      }
      var cats = ['all', 'buildings', 'departments', 'courses', 'lecturers'];
      var chips = '<div class="filter" role="group" aria-label="' + t('verify.title') + '">' + cats.map(function (k, i) { var n = k === 'all' ? S.queue.length : S.queue.filter(function (q) { return q.kind === k; }).length; return '<button type="button" data-f="' + k + '" aria-pressed="' + (i === 0) + '">' + t('verify.filters.' + k) + ' (' + n + ')</button>'; }).join('') + '</div>';
      return '<p class="lead-text">' + t('verify.lead') + '</p>' + chips + '<ul class="queue-list" id="queue" role="list">' + S.queue.map(function (q) {
        return '<li data-kind="' + q.kind + '"><article class="card queue"><span class="queue__ic">' + ic(q.icon, 'ic--xl') + '</span><div class="queue__body"><b>' + esc(q.title) + '</b><small>' + t('verify.source', { source: q.source }) + '</small><small>' + esc(q.added) + '</small></div>' +
          '<a class="btn btn--gold btn--sm" href="' + U.href('verify', { state: 'detail', id: q.id }) + '" aria-label="' + t('verify.action') + ': ' + esc(q.title) + '"><span>' + t('verify.action') + '</span></a>' + ic('caret-right', 'queue__go') + '</article></li>';
      }).join('') + '</ul>';
    });
    if (!ok) return;
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-f]'); if (!b) return;
      document.querySelectorAll('[data-f]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var k = b.getAttribute('data-f'); document.querySelectorAll('#queue > li').forEach(function (li) { li.hidden = k !== 'all' && li.getAttribute('data-kind') !== k; });
    });
    var form = document.getElementById('vform');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); var has = document.getElementById('v-src').value.trim(); location.href = U.href('verify', { state: has ? 'verified' : 'needSource', id: rec.id }); M.buzz(); });
  };

  // ---------------------------------------------------------------- Your role
  screens.role = function () {
    var rows = [[t('role.can.department'), true], [t('role.can.school'), true], [t('role.cannot'), false]];
    gated(C.role.title, ['signedOut'],
      U.hero({ size: 'plain', back: back, barTitle: C.role.title, kicker: C.role.kicker, id: 'ro-h' }),
      function () {
        return '<p class="lead-text">' + t('role.lead') + '</p><article class="card role"><span class="role__ic">' + ic('user-circle', 'ic--xxl') + '</span><div><b>' + esc(S.admin.name) + '</b><small>' + esc(S.admin.scope) + '</small></div><span class="pill pill--outline">' + esc(S.admin.roleLabel) + '</span></article>' +
          '<section class="card" aria-labelledby="can-h"><h2 id="can-h" class="h3">' + t('role.canTitle') + '</h2><ul class="checks" role="list">' + rows.map(function (r) { return '<li class="' + (r[1] ? 'is-yes' : 'is-no') + '">' + ic(r[1] ? 'check-circle-fill' : 'x', 'ic--lg') + '<span>' + r[0] + '</span><small>' + t(r[1] ? 'role.allowed' : 'role.notAllowed') + '</small></li>'; }).join('') + '</ul></section>' +
          '<article class="card card--hl note-row">' + ic('shield-check', 'ic--xl') + '<div><small>' + t('role.yourRole') + '</small><b>' + esc(S.admin.roleLabel) + '</b><p>' + t('role.roleHelp', { scope: S.admin.scope }) + '</p></div></article><p class="hint center">' + t('role.why') + '</p>';
      });
  };

  Object.keys(screens).forEach(function (k) { U.screens[k] = screens[k]; });
  if (screens[U.SCREEN]) screens[U.SCREEN]();
})();
