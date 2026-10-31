/* ============================================================
   AET Learning Hub: My activity (saved files, recently viewed, CBT history)
   Everything is stored in this browser only. No account, nothing sent to a server.
   Keys: aet_bookmarks_v1, aet_recent_v1, aet_quiz_history_v1
   ============================================================ */
(function () {
  'use strict';
  if (window.__aetActivity) return;
  window.__aetActivity = true;

  var K_B = 'aet_bookmarks_v1', K_R = 'aet_recent_v1', K_Q = 'aet_quiz_history_v1';
  var MAX_RECENT = 12, MAX_QUIZ = 30;

  // ---------- storage (failures are never fatal) ----------
  function load(k) {
    try { var v = JSON.parse(localStorage.getItem(k) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function track(name) { try { if (typeof window.aetTrack === 'function') window.aetTrack(name); } catch (e) {} }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function isHttp(u) { return /^https?:\/\//i.test(String(u || '')); }
  function txt(root, sel) { var el = root.querySelector(sel); return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function dec(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }

  // ---------- reading the page ----------
  function ctxFromHash() {
    var p = location.hash.slice(1).split('/');
    if (p[0] === 'course' && (p[3] === 'materials' || p[3] === 'past-questions')) return { level: p[1], course: dec(p[2]), section: p[3] };
    if (p[0] === 'resource') return { level: p[1], course: dec(p[2]), section: p[3] };
    return null;
  }
  function fromCard(card) {
    var a = card.querySelector('a[data-track="open-pdf"]');
    var url = a && a.getAttribute('href');
    var c = ctxFromHash();
    if (!url || !isHttp(url) || !c) return null;
    return { key: url, level: c.level, course: c.course, section: c.section, title: txt(card, '.academic-resource-title'), detail: txt(card, '.academic-resource-detail'), url: url };
  }
  function fromPreview(head) {
    var a = head.querySelector('.rp-actions a[href]');
    var url = a && a.getAttribute('href');
    var c = ctxFromHash();
    if (!url || !isHttp(url) || !c) return null;
    var ps = head.querySelectorAll('.rp-text p');
    return { key: url, level: c.level, course: c.course, section: c.section, title: txt(head, 'h1'), detail: ps.length ? ps[ps.length - 1].textContent.replace(/\s+/g, ' ').trim() : '', url: url };
  }
  function clean(r) {
    return { key: String(r.key).slice(0, 400), level: String(r.level || '').slice(0, 10), course: String(r.course || '').slice(0, 20), section: String(r.section || '').slice(0, 20), title: String(r.title || '').slice(0, 200), detail: String(r.detail || '').slice(0, 200), url: String(r.url || '').slice(0, 400) };
  }

  // ---------- saved + recent ----------
  function isSaved(key) { return load(K_B).some(function (b) { return b.key === key; }); }
  function toggleSave(r) {
    var list = load(K_B), i = list.findIndex(function (b) { return b.key === r.key; });
    if (i >= 0) { list.splice(i, 1); save(K_B, list); track('bookmark-removed'); return false; }
    var item = clean(r); item.savedAt = new Date().toISOString();
    list.unshift(item); save(K_B, list); track('bookmark-added'); return true;
  }
  function noteViewed(r) {
    if (!r) return;
    var list = load(K_R).filter(function (x) { return x.key !== r.key; });
    var item = clean(r); item.viewedAt = new Date().toISOString();
    list.unshift(item);
    save(K_R, list.slice(0, MAX_RECENT));
  }

  // ---------- CBT history ----------
  function num(s) { var m = String(s || '').match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : 0; }
  function noteQuizResult(app) {
    var sc = app.querySelector('.quiz-score-number');
    if (!sc || sc.getAttribute('data-aa-saved')) return;
    sc.setAttribute('data-aa-saved', '1');
    var parts = sc.textContent.split('/');
    var score = num(parts[0]), total = num(parts[1]);
    if (!total) return;
    var stats = app.querySelectorAll('.quiz-stats span'), correct = 0, wrong = 0, skipped = 0;
    stats.forEach(function (s) {
      var t = s.textContent.toLowerCase(), n = num(t);
      if (t.indexOf('not answered') >= 0) skipped = n; else if (t.indexOf('correct') >= 0) correct = n; else if (t.indexOf('wrong') >= 0) wrong = n;
    });
    var p = location.hash.slice(1).split('/');
    var code = p[0] === 'course' ? dec(p[2] || '') : '';
    var titleEl = app.querySelector('.view-sub');
    var rec = {
      code: code.slice(0, 20), title: (titleEl ? titleEl.textContent.trim() : '').slice(0, 120),
      score: score, total: total, percent: Math.round((score / total) * 100),
      correct: correct, wrong: wrong, unanswered: skipped, attemptedAt: new Date().toISOString()
    };
    var list = load(K_Q); list.unshift(rec);
    save(K_Q, list.slice(0, MAX_QUIZ));
    track('cbt-result-saved');
  }

  // ---------- styles ----------
  var css = [
    '.aa-star{cursor:pointer;font-family:inherit;flex:0 0 46px !important;width:46px !important;min-width:46px !important;max-width:46px !important;padding:0 !important;font-size:20px;line-height:1;display:inline-flex;align-items:center;justify-content:center}',
    '.aa-star[aria-pressed="true"]{background:#fff6cf;border-color:#e6b800;color:#c28a00}',
    '.aa-chip{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:7px 14px;border-radius:99px;border:1.5px solid #080b63;background:#fff;color:#080b63;font-weight:800;font-size:13.5px;text-decoration:none}',
    '.aa-chip:hover,.aa-chip:focus-visible{background:#ffd21c;border-color:#ffd21c}',
    '.aa-sum{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 4px}',
    '.aa-sum span{background:#f4f5ff;color:#080b63;border-radius:99px;padding:6px 14px;font-size:13px;font-weight:800}',
    '.aa-note{margin:12px 0 0;padding:10px 14px;border-radius:12px;background:#fff9dc;border:1px solid #f1e3a0;color:#5b4a00;font-size:13.5px;line-height:1.5}',
    '.aa-h{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:28px 0 10px}',
    '.aa-h h2{margin:0;font-size:20px;color:#080b63}',
    '.aa-link{background:none;border:0;padding:0;color:#6d7185;font:inherit;font-size:13px;text-decoration:underline;cursor:pointer}',
    '.aa-empty{padding:16px;border:1px dashed #cfd3ee;border-radius:12px;color:#6d7185;font-size:14px;line-height:1.5}',
    '.aa-list{display:grid;gap:10px}',
    '.aa-quiz{background:#fff;border:1px solid #e7e9f1;border-radius:12px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}',
    '.aa-quiz b{color:#080b63}.aa-quiz small{display:block;color:#6d7185;margin-top:2px;font-size:12.5px}',
    '.aa-score{font-weight:800;font-size:18px;color:#080b63;white-space:nowrap}',
    '.aa-score.good{color:#17703a}.aa-score.low{color:#a83232}',
    '.aa-go{font-size:12.5px;color:#6d7185;margin-top:2px}.aa-go a{color:#080b63;font-weight:700}'
  ].join('\n');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------- star buttons ----------
  function starButton(r) {
    var on = isSaved(r.key);
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'rp-btn rp-btn-secondary aa-star';
    b.setAttribute('data-aa-key', r.key);
    paint(b, on, r.title);
    return b;
  }
  function paint(b, on, title) {
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', (on ? 'Remove ' : 'Save ') + (title || 'this file') + (on ? ' from saved files' : ' for later'));
    b.textContent = on ? '★' : '☆'; b.title = on ? 'Saved' : 'Save for later';
  }
  function decorate() {
    var app = document.getElementById('app-view');
    if (!app) return;
    app.querySelectorAll('.academic-resource-card').forEach(function (card) {
      var box = card.querySelector('.academic-resource-buttons');
      if (!box || box.querySelector('.aa-star')) return;
      var r = fromCard(card); if (r) box.insertBefore(starButton(r), box.firstChild);
    });
    var head = app.querySelector('.resource-preview-header');
    if (head) {
      var r2 = fromPreview(head);
      var box2 = head.querySelector('.rp-actions');
      if (r2 && box2 && !box2.querySelector('.aa-star')) box2.insertBefore(starButton(r2), box2.firstChild);
      if (r2 && !head.getAttribute('data-aa-seen')) { head.setAttribute('data-aa-seen', '1'); noteViewed(r2); }
    }
  }

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    var star = t.closest('.aa-star');
    if (star) {
      e.preventDefault();
      var key = star.getAttribute('data-aa-key'), r = null;
      var card = star.closest('.academic-resource-card'), head = star.closest('.resource-preview-header'), row = star.closest('[data-aa-row]');
      if (row) {
        r = load(K_B).concat(load(K_R)).filter(function (x) { return x.key === key; })[0] || null;
      } else if (card) r = fromCard(card); else if (head) r = fromPreview(head);
      if (!r) return;
      var on = toggleSave(r);
      if (row) renderActivity(); else paint(star, on, r.title);
      return;
    }
    var open = t.closest('a[data-track="open-pdf"], a[data-track="download-pdf"]');
    if (open) {
      var c = open.closest('.academic-resource-card');
      if (c) noteViewed(fromCard(c));
      return;
    }
    var row2 = t.closest('[data-aa-viewlink]');
    if (row2) {
      var item = load(K_B).concat(load(K_R)).filter(function (x) { return x.key === row2.getAttribute('data-aa-viewlink'); })[0];
      if (item) noteViewed(item);
    }
    var clr = t.closest('[data-aa-clear]');
    if (clr) {
      var what = clr.getAttribute('data-aa-clear');
      if (what === 'recent' && window.confirm('Clear the list of recently viewed files?')) { save(K_R, []); renderActivity(); }
      if (what === 'quiz' && window.confirm('Clear your CBT history on this device?')) { save(K_Q, []); renderActivity(); }
    }
  });

  // ---------- the My activity page ----------
  var SEC = { 'materials': 'Study Materials', 'past-questions': 'Past Questions' };
  function when(iso) {
    var d = new Date(iso); if (isNaN(d)) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fileCard(it) {
    var href = '#course/' + encodeURIComponent(it.level) + '/' + encodeURIComponent(it.course) + '/' + encodeURIComponent(it.section);
    var saved = isSaved(it.key);
    return '<div class="academic-resource-card" data-aa-row="1">' +
      '<div class="academic-resource-info"><div class="academic-resource-icon">' + (it.section === 'past-questions' ? 'PQ' : 'PDF') + '</div>' +
      '<div class="academic-resource-text"><div class="academic-resource-title">' + esc(it.title) + '</div>' +
      '<div class="academic-resource-detail">' + esc(it.detail) + '</div>' +
      '<div class="aa-go">' + esc(it.course) + ' · ' + esc(SEC[it.section] || '') + ' · <a href="' + esc(href) + '">Go to course</a></div></div></div>' +
      '<div class="academic-resource-buttons">' +
      '<button type="button" class="rp-btn rp-btn-secondary aa-star" data-aa-key="' + esc(it.key) + '" title="' + (saved ? 'Saved' : 'Save for later') + '" aria-pressed="' + saved + '" aria-label="' + (saved ? 'Remove ' : 'Save ') + esc(it.title) + (saved ? ' from saved files' : ' for later') + '">' + (saved ? '★' : '☆') + '</button>' +
      (isHttp(it.url) ? '<a class="rp-btn rp-btn-primary" data-aa-viewlink="' + esc(it.key) + '" href="' + esc(it.url) + '" target="_blank" rel="noopener">Open PDF</a>' : '') +
      '</div></div>';
  }
  function renderActivity() {
    var app = document.getElementById('app-view');
    if (!app || location.hash !== '#activity') return;
    var y = window.scrollY;
    var saved = load(K_B), recent = load(K_R), quiz = load(K_Q);
    var avg = quiz.length ? Math.round(quiz.reduce(function (a, q) { return a + (Number(q.percent) || 0); }, 0) / quiz.length) : null;
    var html = '<section class="section" id="aet-act">' +
      '<a class="back-link" href="#">← Back to home</a>' +
      '<header class="view-header"><span class="view-eyebrow">On this device</span>' +
      '<h1 class="view-title" data-doc-title="My activity">My activity</h1>' +
      '<p class="view-sub">Your saved files, recently viewed files and CBT scores.</p></header>' +
      '<div class="aa-note">Saved on this phone only. No account needed. If you clear your browser data or change phones, this list starts fresh.</div>' +
      '<div class="aa-sum"><span>' + saved.length + ' saved</span><span>' + quiz.length + ' CBT ' + (quiz.length === 1 ? 'attempt' : 'attempts') + '</span>' +
      (avg === null ? '' : '<span>Average CBT score ' + avg + '%</span>') + '</div>';
    html += '<div class="aa-h"><h2>Saved files</h2></div>';
    html += saved.length ? '<div class="aa-list">' + saved.map(fileCard).join('') + '</div>'
      : '<div class="aa-empty">Nothing saved yet. Tap ☆ Save on any study material or past question and it shows up here.</div>';
    html += '<div class="aa-h"><h2>Recently viewed</h2>' + (recent.length ? '<button type="button" class="aa-link" data-aa-clear="recent">Clear</button>' : '') + '</div>';
    html += recent.length ? '<div class="aa-list">' + recent.map(fileCard).join('') + '</div>'
      : '<div class="aa-empty">Files you open will appear here.</div>';
    html += '<div class="aa-h"><h2>CBT history</h2>' + (quiz.length ? '<button type="button" class="aa-link" data-aa-clear="quiz">Clear</button>' : '') + '</div>';
    html += quiz.length ? '<div class="aa-list">' + quiz.map(function (q) {
      var cls = q.percent >= 60 ? 'good' : (q.percent < 40 ? 'low' : '');
      return '<div class="aa-quiz"><div><b>' + esc(q.code || 'CBT practice') + '</b>' + (q.title ? ' · ' + esc(q.title) : '') +
        '<small>' + esc(q.correct) + ' correct · ' + esc(q.wrong) + ' wrong · ' + esc(q.unanswered) + ' not answered · ' + esc(when(q.attemptedAt)) + '</small></div>' +
        '<div class="aa-score ' + cls + '">' + esc(q.score) + ' / ' + esc(q.total) + ' · ' + esc(q.percent) + '%</div></div>';
    }).join('') + '</div>'
      : '<div class="aa-empty">Finish a CBT practice and your score is kept here, so you can see yourself improve.</div>';
    html += '</section>';
    app.innerHTML = html;
    document.title = 'My activity · AET Learning Hub';
    window.scrollTo(0, y);
  }

  // ---------- links to the page ----------
  function addLinks() {
    var share = document.getElementById('share-site-link');
    if (share && !document.getElementById('aa-footer-link')) {
      var a = document.createElement('a'); a.className = 'footer-link'; a.id = 'aa-footer-link'; a.href = '#activity'; a.textContent = 'My activity';
      share.parentNode.appendChild(document.createTextNode(' · ')); share.parentNode.appendChild(a);
    }
    var head = document.querySelector('#search-section .section-heading');
    if (head && !document.getElementById('aa-chip')) {
      var c = document.createElement('a'); c.className = 'aa-chip'; c.id = 'aa-chip'; c.href = '#activity';
      c.setAttribute('aria-label', 'My activity: saved files, recently viewed and CBT scores'); c.textContent = '⭐ My activity';
      head.appendChild(c);
    }
  }

  // ---------- watch the page ----------
  var timer = null;
  function tick() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var app = document.getElementById('app-view'); if (!app) return;
      try {
        if (location.hash === '#activity') { if (!app.querySelector('#aet-act')) renderActivity(); }
        else { decorate(); noteQuizResult(app); }
        addLinks();
      } catch (e) { console.error('aet-activity:', e); }
    }, 60);
  }
  function start() {
    var app = document.getElementById('app-view');
    if (app) new MutationObserver(tick).observe(app, { childList: true, subtree: true });
    window.addEventListener('hashchange', tick);
    tick();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();