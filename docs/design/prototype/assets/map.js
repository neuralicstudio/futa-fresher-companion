// The campus map: OpenStreetMap data (assets/campus-map.js, baked by tools/bake-map.mjs) drawn as SVG in
// Sabi's dark branded style. No tiles, no satellite imagery, no network, so it works offline. No routing
// in v1: there is no "get directions" and no walking time anywhere. Pan with a finger or the arrow keys,
// zoom with the buttons, the wheel, or + and -. Every pin is a real button, and the place list under the
// map is the full alternative (the map itself is a picture for people who can see it).
//
// Loaded only by the Map and Place detail pages (a lazy chunk in the app, about 32 KB gzipped).
(function () {
  'use strict';
  var M = window.SABI_MAP;
  var NS = 'http://www.w3.org/2000/svg';

  // Category: the Phosphor icon id and the colour token of its pin.
  var CATS = {
    lecture: { icon: 'graduation-cap', color: 'var(--color-pin-lecture)' }, building: { icon: 'buildings', color: 'var(--color-pin-building)' },
    library: { icon: 'book-open-text', color: 'var(--color-pin-library)' }, food: { icon: 'fork-knife', color: 'var(--color-pin-food)' },
    sports: { icon: 'soccer-ball', color: 'var(--color-pin-sports)' }, health: { icon: 'first-aid-kit', color: 'var(--color-pin-health)' },
    hostel: { icon: 'house-line', color: 'var(--color-pin-hostel)' }, gate: { icon: 'compass', color: 'var(--color-pin-gate)' },
  };
  // Photos that show the place itself (its sign is readable in the photo). Others have no photo yet.
  var PHOTO_OF = { library: 'library', computing: 'computing', 'cce-hall': 'hall', crc: 'crc' };

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function byId(id) { return M.places.filter(function (p) { return p.id === id; })[0]; }

  // render(host, { selected, filter, onSelect, h, locate })  ->  controller
  function render(host, o) {
    o = o || {};
    var W = M.size[0], H = M.size[1];
    var start = byId(o.selected) || byId('library') || M.places[0];
    var view = { x: start.x, y: start.y, w: 1500 }; // centre and width in drawing units (0.5 m each)
    var svg = el('svg', { class: 'campus-map', role: 'img', 'aria-label': (window.SABI_COPY ? window.SABI_COPY.map.mapLabel : 'Campus map'), tabindex: '0' });
    var g = el('g', {}, svg);
    el('rect', { class: 'm-ground', x: 0, y: 0, width: W, height: H }, g);
    ['grass', 'wood', 'water', 'pitch'].forEach(function (k) { el('path', { class: 'm-' + k, d: M.layers[k] }, g); });
    el('path', { class: 'm-lane', d: M.layers.lanes, fill: 'none' }, g);
    el('path', { class: 'm-road', d: M.layers.roads, fill: 'none' }, g);
    el('path', { class: 'm-building', d: M.layers.buildings }, g);
    var pinsG = el('g', { class: 'm-pins' }, g);
    var pins = {};
    M.places.forEach(function (p) {
      var c = CATS[p.cat] || CATS.building;
      var pin = el('g', { class: 'm-pin', transform: 'translate(' + p.x + ' ' + p.y + ')', role: 'button', tabindex: '-1', 'data-id': p.id, 'aria-label': p.name }, pinsG);
      var s = el('g', { class: 'm-pin__s' }, pin);
      el('path', { class: 'm-pin__body', d: 'M0 0C-9-9-14-14-14-20a14 14 0 0 1 28 0C14-14 9-9 0 0z', style: 'fill:' + c.color }, s);
      var use = el('use', { href: '#i-' + c.icon, x: -9, y: -29, width: 18, height: 18, class: 'm-pin__icon' }, s);
      void use;
      pin.addEventListener('click', function (e) { e.stopPropagation(); select(p.id, true); });
      pin.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(p.id, true); } });
      pins[p.id] = pin;
    });
    var labelG = el('g', { class: 'm-label', visibility: 'hidden' }, g);
    var me = el('g', { class: 'm-me', visibility: 'hidden' }, g);
    el('circle', { class: 'm-me__pulse', r: 30 }, me); el('circle', { class: 'm-me__dot', r: 12 }, me);
    host.innerHTML = '';
    host.appendChild(svg);

    function fit() {
      var r = host.getBoundingClientRect(), ar = (r.height || 300) / (r.width || 400);
      var h = view.w * ar;
      view.x = Math.max(view.w / 2, Math.min(W - view.w / 2, view.x)); view.y = Math.max(h / 2, Math.min(H - h / 2, view.y));
      svg.setAttribute('viewBox', [view.x - view.w / 2, view.y - h / 2, view.w, h].join(' '));
      var k = view.w / (r.width || 400);
      svg.style.setProperty('--k', k.toFixed(3));
      svg.querySelectorAll('.m-pin__s, .m-label__s').forEach(function (n) { n.setAttribute('transform', 'scale(' + k.toFixed(3) + ')'); }); // pins keep their screen size at every zoom
    }
    function setVisible() {
      Object.keys(pins).forEach(function (id) {
        var p = byId(id), on = !o.filter || o.filter === 'all' || p.cat === o.filter;
        pins[id].style.display = on ? '' : 'none'; pins[id].setAttribute('tabindex', on ? '0' : '-1');
      });
    }
    function select(id, notify) {
      var p = byId(id); o.selected = id;
      Object.keys(pins).forEach(function (k) { pins[k].classList.toggle('is-selected', k === id); });
      if (pins[id]) pinsG.appendChild(pins[id]); // selected pin on top
      if (p) {
        // A name tag over the selected pin, in the same units as the pin so it scales with it.
        labelG.innerHTML = '';
        labelG.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ')');
        var s = el('g', { class: 'm-label__s' }, labelG), w = Math.min(p.name.length, 26) * 7.4 + 36;
        el('rect', { x: -w / 2, y: -78, width: w, height: 30, rx: 15 }, s);
        var t = el('text', { x: 0, y: -58, 'text-anchor': 'middle' }, s); t.textContent = p.name.length > 26 ? p.name.slice(0, 25) + '…' : p.name;
        labelG.setAttribute('visibility', 'visible'); fit();
      }
      if (notify && o.onSelect) o.onSelect(id);
    }
    function zoom(f, cx, cy) {
      var nw = Math.max(420, Math.min(W, view.w * f)), s = nw / view.w;
      if (cx != null) { view.x = cx + (view.x - cx) * s; view.y = cy + (view.y - cy) * s; }
      view.w = nw; fit();
    }
    function pan(dx, dy) { view.x += dx * view.w; view.y += dy * view.w; fit(); }
    function center(id) { var p = byId(id); if (p) { view.x = p.x; view.y = p.y; fit(); } }

    // Pointer drag (one pointer), wheel zoom, keys.
    var drag = null;
    svg.addEventListener('pointerdown', function (e) { if (e.target.closest('.m-pin')) return; drag = { x: e.clientX, y: e.clientY }; svg.setPointerCapture(e.pointerId); svg.classList.add('is-drag'); });
    svg.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var k = view.w / host.getBoundingClientRect().width; view.x -= (e.clientX - drag.x) * k; view.y -= (e.clientY - drag.y) * k; drag = { x: e.clientX, y: e.clientY }; fit();
    });
    ['pointerup', 'pointercancel'].forEach(function (n) { svg.addEventListener(n, function () { drag = null; svg.classList.remove('is-drag'); }); });
    svg.addEventListener('wheel', function (e) { e.preventDefault(); zoom(e.deltaY > 0 ? 1.2 : 1 / 1.2); }, { passive: false });
    svg.addEventListener('keydown', function (e) {
      var k = { ArrowLeft: [-0.1, 0], ArrowRight: [0.1, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] }[e.key];
      if (k) { e.preventDefault(); pan(k[0], k[1]); }
      if (e.key === '+' || e.key === '=') zoom(1 / 1.3);
      if (e.key === '-') zoom(1.3);
    });
    if (window.ResizeObserver) new ResizeObserver(fit).observe(host);

    var ctl = {
      select: select, zoomIn: function () { zoom(1 / 1.35); }, zoomOut: function () { zoom(1.35); }, center: center,
      setFilter: function (f) { o.filter = f; setVisible(); },
      locate: function () { var p = byId('west-gate'); me.setAttribute('transform', 'translate(' + (p.x + 140) + ' ' + (p.y - 90) + ')'); me.setAttribute('visibility', 'visible'); center('west-gate'); },
    };
    fit(); setVisible(); if (o.selected) select(o.selected);
    return ctl;
  }

  window.SABI_MAPVIEW = { render: render, cats: CATS, photoOf: PHOTO_OF, place: byId, places: M.places };
})();
