/* AET Learning Hub: cleaner file cards (separate file, index.html untouched)
   - file size under each title, and no repeated description
   - search box and A to Z sort when a list is long
   - on phones: Open PDF and Download on one row, star / share / report on a tidy row below
   No "new" or "added" labels. */
(function () {
  'use strict';
  if (window.__aetCards) return; window.__aetCards = true;

  var css = [
    '.ac-meta{font-size:12.5px;color:#6d7185;margin-top:3px}',
    '.ac-hide{display:none!important}',
    '.ac-bar{display:flex;gap:8px;margin:0 0 12px;flex-wrap:wrap}',
    '.ac-bar input{flex:1 1 200px;min-width:0;box-sizing:border-box;border:1.5px solid #cfd3e6;border-radius:10px;padding:11px 12px;font:inherit;font-size:14.5px;background:#fff}',
    '.ac-bar select{flex:0 0 auto;border:1.5px solid #cfd3e6;border-radius:10px;padding:11px 10px;font:inherit;font-size:14px;background:#fff}',
    '.ac-none{padding:18px;text-align:center;color:#6d7185;font-size:14px;border:1px dashed #cfd3e6;border-radius:12px}',
    '@media(max-width:560px){',
    '.academic-resource-card .academic-resource-buttons{display:flex!important;flex-wrap:wrap!important;gap:8px!important;width:100%}',
    '.academic-resource-card .academic-resource-buttons > [data-track="open-pdf"],.academic-resource-card .academic-resource-buttons > [data-track="download-pdf"]{order:1;flex:1 1 calc(50% - 4px)!important;justify-content:center;text-align:center;min-height:44px}',
    '.academic-resource-card .academic-resource-buttons > :not([data-track="open-pdf"]):not([data-track="download-pdf"]){order:2;flex:1 1 0!important;width:auto!important;min-width:0!important;max-width:none!important;justify-content:center;min-height:40px}',
    '.academic-resource-card .aa-star::after{content:"Save"}.academic-resource-card .ah-share::after{content:"Share"}.academic-resource-card .ar-flag::after{content:"Report"}',
    '.academic-resource-card .aa-star::after,.academic-resource-card .ah-share::after,.academic-resource-card .ar-flag::after{font-size:12.5px;font-weight:700;margin-left:6px;line-height:1}',
    '}'
  ].join('\n');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function squash(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }
  function route() { var p = location.hash.slice(1).split('/'); return (p[0] === 'course' && (p[3] === 'materials' || p[3] === 'past-questions')) ? p[3] : ''; }
  function fmt(b) { if (b < 1024 * 1024) return Math.max(1, Math.round(b / 1024)) + ' KB'; var m = b / 1048576; return (m < 10 ? m.toFixed(1) : Math.round(m)) + ' MB'; }

  // ---------- file sizes (looked up once, remembered on the phone) ----------
  var queue = [], active = 0, mem = {};
  function cached(url) { if (mem[url] != null) return mem[url]; try { var v = localStorage.getItem('aet-sz:' + url); if (v) { mem[url] = +v; return mem[url]; } } catch (e) {} return null; }
  function fetchSize(url, cb) {
    var c = cached(url); if (c) return cb(c);
    queue.push([url, cb]); pump();
  }
  function pump() {
    while (active < 3 && queue.length) {
      (function (job) {
        active++;
        fetch(job[0], { method: 'HEAD' }).then(function (r) { var n = parseInt(r.headers.get('content-length') || '0', 10); if (n > 0) { mem[job[0]] = n; try { localStorage.setItem('aet-sz:' + job[0], String(n)); } catch (e) {} job[1](n); } })
          .catch(function () {}).then(function () { active--; pump(); });
      })(queue.shift());
    }
  }

  function decorateCard(card, kind, i) {
    if (card.dataset.acDone) return; card.dataset.acDone = '1'; card.dataset.acI = String(i);
    var title = card.querySelector('.academic-resource-title'), detail = card.querySelector('.academic-resource-detail');
    if (!title) return;
    var t = squash(title.textContent), d = detail ? squash(detail.textContent) : '';
    // hide a description that only repeats the title or says nothing
    if (detail && (!d || d.indexOf(t) > -1 || /^pdf(academicresource|studymaterial)?$/.test(d))) detail.classList.add('ac-hide');
    var meta = document.createElement('div'); meta.className = 'ac-meta'; meta.textContent = kind === 'past-questions' ? 'Past question · PDF' : 'PDF';
    (detail && !detail.classList.contains('ac-hide') ? detail : title).insertAdjacentElement('afterend', meta);
    var a = card.querySelector('a[data-track="open-pdf"]');
    if (a && a.href) fetchSize(a.href, function (n) { meta.textContent = (kind === 'past-questions' ? 'Past question · PDF · ' : 'PDF · ') + fmt(n); });
  }

  // ---------- search and sort ----------
  var sortMode = 'default';
  function applyFilter(scope, q) {
    var shown = 0; q = squash(q);
    [].forEach.call(scope.querySelectorAll('.academic-resource-card'), function (c) {
      var hit = !q || squash(c.textContent).indexOf(q) > -1; c.classList.toggle('ac-hide', !hit); if (hit) shown++;
    });
    [].forEach.call(scope.querySelectorAll('details.topic-group'), function (g) {
      var any = g.querySelector('.academic-resource-card:not(.ac-hide)'); g.classList.toggle('ac-hide', !any);
      if (q && any) g.open = true;
    });
    var none = scope.parentNode && scope.parentNode.querySelector('.ac-none');
    if (shown === 0 && q) { if (!none) { none = document.createElement('div'); none.className = 'ac-none'; none.textContent = 'Nothing matches that search.'; scope.insertAdjacentElement('afterend', none); } }
    else if (none) none.remove();
  }
  function sortScope(box) {
    function key(el) {
      if (sortMode === 'az') { var t = el.querySelector('.academic-resource-title, .topic-name'); return (t ? t.textContent : '').trim().toLowerCase(); }
      var f = el.dataset.acI != null ? el : el.querySelector('[data-ac-i]'); return f ? +f.dataset.acI : 0;
    }
    function reorder(parent) {
      var kids = [].filter.call(parent.children, function (c) { return c.classList.contains('academic-resource-card') || c.matches('details.topic-group'); });
      if (kids.length < 2) return;
      var sorted = kids.slice().sort(function (a, b) { var x = key(a), y = key(b); return x < y ? -1 : x > y ? 1 : 0; });
      var same = sorted.every(function (k, j) { return k === kids[j]; });
      if (!same) sorted.forEach(function (k) { parent.appendChild(k); });
    }
    reorder(box); [].forEach.call(box.querySelectorAll('details.topic-group .topic-body'), reorder);
  }
  function ensureBar(box, cards) {
    if (cards.length < 6) { var o = document.querySelector('.ac-bar'); if (o) o.remove(); return; }
    if (document.querySelector('.ac-bar')) return;
    var bar = document.createElement('div'); bar.className = 'ac-bar';
    var inp = document.createElement('input'); inp.type = 'search'; inp.placeholder = 'Search this list'; inp.setAttribute('aria-label', 'Search this list');
    var sel = document.createElement('select'); sel.setAttribute('aria-label', 'Sort');
    [['default', 'Default order'], ['az', 'A to Z']].forEach(function (o) { var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; if (o[0] === sortMode) op.selected = true; sel.appendChild(op); });
    inp.addEventListener('input', function () { applyFilter(box, inp.value); });
    sel.addEventListener('change', function () { sortMode = sel.value; sortScope(box); });
    bar.appendChild(inp); bar.appendChild(sel); box.insertAdjacentElement('beforebegin', bar);
  }

  function run() {
    var kind = route(); var app = document.getElementById('app-view'); if (!kind || !app) { var b = document.querySelector('.ac-bar'); if (b) b.remove(); return; }
    var first = app.querySelector('.academic-resource-card'); if (!first) return;
    var box = app.querySelector('.academic-resource-list') || first.parentNode;
    var cards = [].slice.call(app.querySelectorAll('.academic-resource-card'));
    cards.forEach(function (c, i) { decorateCard(c, kind, i); });
    ensureBar(box, cards);
    var inp = document.querySelector('.ac-bar input'); if (inp && inp.value) applyFilter(box, inp.value);
  }
  function init() {
    var app = document.getElementById('app-view');
    if (app) new MutationObserver(function () { run(); }).observe(app, { childList: true, subtree: true });
    window.addEventListener('hashchange', function () { sortMode = 'default'; run(); });
    run(); var n = 0, tm = setInterval(function () { run(); if (++n > 16) clearInterval(tm); }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();