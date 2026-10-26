// Motion and Lite mode for the prototypes. Small on purpose: everything here is what the real app
// would ship for these effects (see README "Hand-off"). No library.
//
// The rules it enforces:
//  - Lite mode (html[data-lite]) is decided before first paint by the inline script in each page's
//    <head>: on when the phone asks to save data (navigator.connection.saveData, a 2G connection,
//    or prefers-reduced-data), or when the person turns it on. Lite skips every effect below.
//  - prefers-reduced-motion skips every effect below. The CSS also collapses durations.
//  - Loops (the skeleton, the first-sync bar) run only while on screen and while the page is visible.
//  - The one authored entrance per screen (the line drawing in) plays once per session, on screen.
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function lite() { return root.hasAttribute('data-lite'); }
  function calm() { return reduce || lite(); }

  // ---------------------------------------------------------------- pause everything when hidden
  document.addEventListener('visibilitychange', function () { root.classList.toggle('is-hidden', document.hidden); });

  // ---------------------------------------------------------------- loops run only on screen
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.target.hasAttribute('data-once')) {
        if (e.isIntersecting) { play(e.target); io.unobserve(e.target); }
        return;
      }
      if (e.isIntersecting) e.target.setAttribute('data-inview', '');
      else e.target.removeAttribute('data-inview');
    });
  }, { rootMargin: '0px 0px -10% 0px' }) : null;

  function play(el) {
    el.classList.remove('is-waiting');
    el.classList.add('is-playing'); // the keyframes fill backwards, so the end state is the resting state
  }

  // Entrances: elements with data-once="<key>" draw in once per session.
  function seen(key) { try { return sessionStorage.getItem('sabi-drawn-' + key) === '1'; } catch (e) { return false; } }
  function mark(key) { try { sessionStorage.setItem('sabi-drawn-' + key, '1'); } catch (e) { /* storage blocked: it may draw again */ } }

  function init(scope) {
    scope = scope || document;
    scope.querySelectorAll('[data-loop]').forEach(function (el) {
      if (io) io.observe(el); else el.setAttribute('data-inview', '');
    });
    scope.querySelectorAll('[data-once]').forEach(function (el) {
      var key = el.getAttribute('data-once');
      if (calm() || seen(key) || !io) return;
      mark(key);
      el.classList.add('is-waiting'); // set before first paint, so nothing flashes
      io.observe(el);
    });
  }

  // ---------------------------------------------------------------- page transitions
  // Cross-document View Transitions are declared in CSS. Lite and reduced motion skip them here.
  function skip(e) { if (e.viewTransition && calm()) e.viewTransition.skipTransition(); }
  window.addEventListener('pageswap', skip);
  window.addEventListener('pagereveal', skip);

  // Same-page changes (open a notice, stamp a seal, flip Lite) morph instead of jumping, when allowed.
  function morph(update) {
    if (calm() || !document.startViewTransition) { update(); return; }
    document.startViewTransition(update);
  }

  // ---------------------------------------------------------------- a counted number (first sync)
  // Real figures only: counts up from the last value to the new one, announces only the final value.
  function count(el, to, ms) {
    var fmt = new Intl.NumberFormat('en-NG');
    if (calm()) { el.textContent = fmt.format(to); return; }
    var from = Number(el.getAttribute('data-from') || 0), t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / ms), eased = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt.format(Math.round(from + (to - from) * eased));
      if (k < 1 && !document.hidden) requestAnimationFrame(step); else el.textContent = fmt.format(to);
    })(t0);
  }

  // ---------------------------------------------------------------- a short buzz for big moments
  // Android only; two places in the app (a record marked verified, first sync finished).
  function buzz() { if (!lite() && navigator.vibrate) { try { navigator.vibrate(12); } catch (e) { /* not allowed here */ } } }

  // ---------------------------------------------------------------- Lite switch
  function setLite(on) {
    try { localStorage.setItem('sabi-lite', on ? 'on' : 'off'); } catch (e) { /* this view only */ }
    morph(function () {
      if (on) root.setAttribute('data-lite', 'setting'); else root.removeAttribute('data-lite');
      document.querySelectorAll('[data-lite-switch]').forEach(function (b) { b.setAttribute('aria-checked', String(on)); });
      document.dispatchEvent(new CustomEvent('sabi:lite', { detail: on }));
    });
  }

  // Photos: a slot's picture loads only outside Lite, lazily, after the page has settled.
  function photos(scope) {
    if (lite()) return;
    (scope || document).querySelectorAll('[data-slot][data-src]').forEach(function (slot) {
      if (slot.querySelector('img') || !slot.getAttribute('data-src')) return;
      var img = new Image();
      img.alt = slot.getAttribute('data-alt') || '';
      img.loading = 'lazy'; img.decoding = 'async';
      img.src = slot.getAttribute('data-src');
      slot.appendChild(img);
    });
  }
  document.addEventListener('sabi:lite', function (e) { if (!e.detail) photos(); });

  window.SABI_MOTION = { init: init, morph: morph, count: count, buzz: buzz, setLite: setLite, lite: lite, calm: calm, photos: photos };
})();
