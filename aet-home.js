/* AET Learning Hub: tidier search with a filter icon, "Continue" tab, share icon on files.
   Separate file. index.html only loads it with one script line. */
(function () {
  'use strict';
  if (window.__aetHome) return;
  window.__aetHome = true;

  var LS = 'aet_last_v1';

  function get() { try { return JSON.parse(localStorage.getItem(LS) || 'null') || {}; } catch (e) { return {}; } }
  function put(o) { try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {} }
  function dec(v) { try { return decodeURIComponent(v); } catch (e) { return v; } }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var CSS = [
    /* search: less space, filters behind an icon */
    '.search-section{padding-top:18px!important;padding-bottom:16px!important}',
    '.search-section .section-heading{margin-bottom:8px!important;display:flex;flex-wrap:wrap;align-items:center;gap:8px}',
    '.search-section .section-heading h2{flex-basis:100%;font-size:22px!important;margin:0!important}',
    '.search-section .section-heading p{display:none!important}',
    '.search-section .aa-chip,.search-section .ah-cont{margin-top:0!important}',
    '.ah-cont{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:99px;border:1.5px solid #e6c84a;background:#fff6cf;color:#080b63;font-weight:800;font-size:13.5px;text-decoration:none;max-width:100%}',
    '.ah-cont:hover,.ah-cont:focus-visible{background:#ffd21c;border-color:#ffd21c}',
    '.ah-cont svg{width:14px;height:14px;flex:none}',
    '.search-section .search-box-wrap{margin-bottom:0!important}',
    '.search-section .search-input{padding-right:52px!important}',
    '.ah-fbtn{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:38px;height:38px;border:0;border-radius:9px;background:transparent;color:#5b6088;display:grid;place-items:center;cursor:pointer;padding:0}',
    '.ah-fbtn:hover,.ah-fbtn:focus-visible,.ah-fbtn[aria-expanded="true"]{background:#eceef8;color:#080b63}',
    '.ah-fbtn svg{width:20px;height:20px}',
    '.ah-fbtn.ah-on::after{content:"";position:absolute;top:7px;right:7px;width:9px;height:9px;border-radius:50%;background:#ffd21c;box-shadow:0 0 0 2px #fff}',
    '.search-section .filters-row{display:none!important;margin-top:8px}',
    '.search-section.ah-open .filters-row{display:flex!important}',
    /* share icon on each file */
    '.academic-resource-buttons .ah-share{flex:0 0 46px!important;width:46px!important;min-width:46px!important;max-width:46px!important;padding:0!important;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}',
    '.academic-resource-buttons .ah-share svg{width:19px;height:19px;color:#1a9d55}',
    '@media (max-width:430px){.academic-resource-buttons .rp-btn{padding-left:8px!important;padding-right:8px!important}}'
  ].join('\n');

  var SHARE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>';
  var FILTER_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16l-6 7.5V19l-4-2v-4.5z"/></svg>';
  var PLAY_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';

  // ---------- home: hide the duplicate quick block, tidy the search ----------
  function arrange() {
    var quick = document.querySelector('.quick-grid');
    var sec = quick && quick.closest('section');
    if (sec) sec.hidden = true;
    var input = document.getElementById('hub-search-input');
    if (input) input.placeholder = 'Search course code, name or topic';
  }

  function filtersActive() {
    return ['filter-level', 'filter-type', 'filter-course'].some(function (id) { var e = document.getElementById(id); return e && e.value; });
  }
  function setupFilterButton() {
    var wrap = document.querySelector('.search-box-wrap');
    var section = document.getElementById('search-section');
    if (!wrap || !section || document.getElementById('ah-fbtn')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'ah-fbtn'; b.className = 'ah-fbtn';
    b.setAttribute('aria-label', 'Filters'); b.setAttribute('aria-expanded', 'false'); b.title = 'Filters';
    b.innerHTML = FILTER_SVG;
    b.addEventListener('click', function () {
      var open = !section.classList.contains('ah-open');
      section.classList.toggle('ah-open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    wrap.appendChild(b);
    function dot() { b.classList.toggle('ah-on', filtersActive()); }
    ['filter-level', 'filter-type', 'filter-course'].forEach(function (id) { var e = document.getElementById(id); if (e) e.addEventListener('change', dot); });
    var clr = document.getElementById('clear-filters-btn'); if (clr) clr.addEventListener('click', function () { setTimeout(dot, 0); });
    dot();
  }

  // ---------- remember the last course ----------
  function remember() {
    var p = location.hash.slice(1).split('/');
    if ((p[0] === 'course' || p[0] === 'resource') && /^\d{3}$/.test(p[1] || '') && p[2]) {
      var code = dec(p[2]).slice(0, 20), s = get();
      if (s.level !== p[1] || s.course !== code) put({ level: p[1], course: code });
    }
  }
  function courseExists(level, code) {
    try {
      if (typeof catalog === 'undefined') return null;
      var key = String(code).replace(/\s+/g, '').toUpperCase();
      return (catalog[level] || []).some(function (c) { return String(c.code).replace(/\s+/g, '').toUpperCase() === key; });
    } catch (e) { return null; }
  }
  function paintContinue() {
    var head = document.querySelector('#search-section .section-heading');
    if (!head) return;
    var s = get(), old = document.getElementById('ah-continue');
    var ok = s.level && s.course && courseExists(s.level, s.course);
    if (!ok) { if (old) old.remove(); return; }
    var href = '#course/' + s.level + '/' + encodeURIComponent(s.course);
    if (!old) {
      old = document.createElement('a'); old.id = 'ah-continue'; old.className = 'ah-cont';
      old.setAttribute('aria-label', 'Continue where you left off');
      var chip = document.getElementById('aa-chip');
      if (chip && chip.parentNode === head) head.insertBefore(old, chip.nextSibling); else head.appendChild(old);
    }
    old.href = href;
    old.innerHTML = PLAY_SVG + 'Continue ' + esc(s.course);
    old.title = 'Continue where you left off';
  }

  // ---------- share icon on each file ----------
  function sectionOf() {
    var p = location.hash.slice(1).split('/');
    if (p[0] === 'course' && (p[3] === 'materials' || p[3] === 'past-questions')) return { level: p[1], code: dec(p[2]), section: p[3] };
    return null;
  }
  function shareHref(text, hash) {
    try { if (typeof aetShareHref === 'function') return aetShareHref(text, hash); } catch (e) {}
    return 'https://wa.me/?text=' + encodeURIComponent(text + '\n' + location.origin + location.pathname + hash);
  }
  function decorate() {
    var app = document.getElementById('app-view');
    var c = sectionOf();
    if (!app || !c) return;
    var kind = c.section === 'past-questions' ? 'past question' : 'study material';
    [].forEach.call(app.querySelectorAll('.academic-resource-card'), function (card) {
      var box = card.querySelector('.academic-resource-buttons');
      var titleEl = card.querySelector('.academic-resource-title');
      if (!box || !titleEl || box.querySelector('.ah-share')) return;
      var title = titleEl.textContent.replace(/\s+/g, ' ').trim();
      var hash = '#course/' + c.level + '/' + encodeURIComponent(c.code) + '/' + c.section;
      var a = document.createElement('a');
      a.className = 'rp-btn rp-btn-secondary ah-share'; a.target = '_blank'; a.rel = 'noopener';
      a.setAttribute('data-track', 'share-course');
      a.setAttribute('aria-label', 'Share ' + title + ' on WhatsApp'); a.title = 'Share on WhatsApp';
      a.href = shareHref(title + ' (' + c.code + ' ' + kind + ') is on the AET Learning Hub:', hash);
      a.innerHTML = SHARE_SVG;
      var star = box.querySelector('.aa-star');
      if (star && star.nextSibling) box.insertBefore(a, star.nextSibling); else if (star) box.appendChild(a); else box.insertBefore(a, box.firstChild);
    });
  }

  function init() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    arrange(); setupFilterButton(); remember(); paintContinue();
    window.addEventListener('hashchange', function () { remember(); paintContinue(); decorate(); });
    var app = document.getElementById('app-view');
    if (app) new MutationObserver(function () { decorate(); }).observe(app, { childList: true, subtree: true });
    decorate();
    var n = 0, t = setInterval(function () { paintContinue(); decorate(); if (++n > 20) clearInterval(t); }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();