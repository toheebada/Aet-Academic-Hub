/* AET Learning Hub: admin upgrade (separate file, index.html untouched)
   - Home tab: "Needs attention" (rep files waiting, student reports, material requests)
   - Reports tab: wrong-file reports from students, grouped by file
   - Rep uploads: "Approve all ready", "Tidy titles", and a warning when a file looks like a copy
   Needs: 33-reports.sql run once and the updated hub-extras function. Admin page only. */
(function () {
  'use strict';
  if (new URLSearchParams(location.search).get('admin') !== '1') return;
  if (window.__aetAdmin2) return; window.__aetAdmin2 = true;

  var sb = (typeof supabaseClient !== 'undefined') ? supabaseClient : null;
  var FN = ((typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : '') + '/functions/v1/hub-extras';
  if (!sb) return;

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k]; if (v == null || v === false) return;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  function squash(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }
  function ago(iso) {
    var m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (m < 2) return 'just now'; if (m < 60) return m + ' min ago';
    var hr = Math.round(m / 60); if (hr < 24) return hr + ' hour' + (hr === 1 ? '' : 's') + ' ago';
    var d = Math.round(hr / 24); return d + ' day' + (d === 1 ? '' : 's') + ' ago';
  }

  async function api(body) {
    var s = (await sb.auth.getSession()).data.session;
    if (!s) throw new Error('Please sign in as admin.');
    var res;
    try { res = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + s.access_token }, body: JSON.stringify(body) }); }
    catch (e) { throw new Error('Could not reach the server. Check your internet connection.'); }
    var data = null; try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error((data && data.error) || 'Something went wrong.');
    return data;
  }

  var css = [
    '#aet-admin-v2{display:none;max-width:1000px;margin:0 auto;padding:18px 16px 60px;font-family:inherit;color:#11152b}',
    'html.admin-mode[data-alog][data-atab="home"] body > #aet-admin-v2#aet-admin-v2#aet-admin-v2,html.admin-mode[data-alog][data-atab="rpt"] body > #aet-admin-v2#aet-admin-v2#aet-admin-v2{display:block!important}',
    'html[data-atab="home"] #aet-admin-upload,html[data-atab="home"] #aet-admin-cbt,html[data-atab="home"] #aet-admin-contrib,html[data-atab="home"] #aet-admin-extras,',
    'html[data-atab="rpt"] #aet-admin-upload,html[data-atab="rpt"] #aet-admin-cbt,html[data-atab="rpt"] #aet-admin-contrib,html[data-atab="rpt"] #aet-admin-extras{display:none!important}',
    '#aet-admin-v2 [data-v]{display:none}',
    'html[data-atab="home"] #aet-admin-v2 [data-v="home"],html[data-atab="rpt"] #aet-admin-v2 [data-v="rpt"]{display:block}',
    '#aet-admin-v2 h2{font-size:20px;margin:0 0 4px}.a2-sub{font-size:13.5px;color:#6d7185;margin:0 0 14px;line-height:1.45}',
    '.a2-cards{display:grid;gap:10px;grid-template-columns:1fr}@media(min-width:760px){.a2-cards{grid-template-columns:repeat(3,1fr)}}',
    '.a2-card{background:#fff;border:1px solid #e7e9f1;border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:6px}',
    '.a2-card.hot{border-color:#f0c24b;background:#fffaf0}',
    '.a2-n{font-size:34px;font-weight:800;color:#080b63;line-height:1}.a2-card.zero .a2-n{color:#9aa0b8}',
    '.a2-k{font-size:14px;font-weight:800}.a2-d{font-size:12.5px;color:#6d7185;min-height:17px}',
    '.a2-btn{border:0;border-radius:10px;padding:9px 14px;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer;background:#080b63;color:#fff;align-self:flex-start}',
    '.a2-btn.alt{background:#eef0f9;color:#080b63}.a2-btn.good{background:#12733a}.a2-btn.warn{background:#fff;color:#b42323;border:1.5px solid #f1b4b4}',
    '.a2-btn:disabled{opacity:.55;cursor:progress}',
    '.a2-clear{background:#f2fbf5;border:1px solid #bfe8cd;color:#12733a;border-radius:14px;padding:14px 16px;font-weight:800;margin-bottom:12px}',
    '.a2-quick{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}',
    '.a2-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}',
    '.a2-filters button{border:1.5px solid #cfd3e6;background:#fff;border-radius:99px;padding:7px 13px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}',
    '.a2-filters button.on{background:#080b63;border-color:#080b63;color:#fff}',
    '.a2-stats{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}.a2-stat{background:#fff;border:1px solid #e7e9f1;border-radius:14px;padding:10px 16px;min-width:100px}.a2-stat b{font-size:22px;display:block}.a2-stat span{font-size:12px;color:#6d7185}',
    '.a2-rep{background:#fff;border:1px solid #e7e9f1;border-radius:14px;padding:14px 16px;margin-bottom:10px}',
    '.a2-top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start}',
    '.a2-t{font-weight:800;font-size:14.5px;overflow-wrap:anywhere}.a2-m{font-size:12.5px;color:#6d7185;margin-top:2px}',
    '.a2-pill{display:inline-block;background:#fdeaea;color:#b42323;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:800;margin:6px 6px 0 0}',
    '.a2-pill.ok{background:#eaf8ef;color:#12733a}.a2-pill.gr{background:#eef0f9;color:#5b6075}',
    '.a2-note{font-size:13px;margin:6px 0 0;padding:6px 10px;background:#f6f7fb;border-radius:8px;overflow-wrap:anywhere}',
    '.a2-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}',
    '.a2-empty{font-size:13.5px;color:#6d7185;padding:14px;border:1px dashed #cfd3e6;border-radius:12px;background:#fff}',
    '.a2-msg{font-size:13px;font-weight:700;margin:10px 0 0}.a2-msg.bad{color:#b91c1c}',
    '#a2-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:22px;z-index:9500;background:#111827;color:#fff;border-radius:12px;padding:11px 14px;font-size:14px;font-weight:700;display:flex;gap:14px;align-items:center;max-width:calc(100vw - 24px)}',
    '#a2-toast[hidden]{display:none}html.admin-mode body > #a2-toast#a2-toast#a2-toast:not([hidden]){display:flex!important}',
    '#a2-toast button{background:#ffd21c;color:#050747;border:0;border-radius:8px;padding:6px 12px;font:inherit;font-weight:800;cursor:pointer}',
    /* rep review bar */
    '.a2-bar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px 12px;margin:0 0 12px;background:#f3f6ff;border:1px solid #dbe3ff;border-radius:12px;font-size:13px}',
    '.a2-bar b{color:#080b63}.a2-bar .a2-btn{padding:8px 12px}',
    '.a2-dup{margin:8px 0 0;padding:8px 10px;border-radius:10px;background:#fff6e5;border:1px solid #f0c24b;font-size:13px;line-height:1.4}'
  ].join('\n');
  document.head.appendChild(h('style', { text: css }));

  var state = { att: null, rpt: null, filter: 'new', userTab: false, busy: false };
  var panel = h('section', { id: 'aet-admin-v2', 'aria-label': 'Home and reports' });
  var homeV = h('div', { 'data-v': 'home' }), rptV = h('div', { 'data-v': 'rpt' });
  panel.appendChild(homeV); panel.appendChild(rptV); document.body.appendChild(panel);

  var toast = h('div', { id: 'a2-toast', hidden: true, role: 'status', 'aria-live': 'polite' });
  document.body.appendChild(toast);
  var tt = null;
  function say(text, undo) {
    clearTimeout(tt); toast.textContent = ''; toast.hidden = false; toast.appendChild(h('span', { text: text }));
    if (undo) toast.appendChild(h('button', { type: 'button', text: 'Undo', onclick: async function (e) {
      e.target.disabled = true;
      try { await undo(); toast.textContent = 'Undone.'; } catch (x) { toast.textContent = 'Could not undo: ' + x.message; }
      tt = setTimeout(function () { toast.hidden = true; }, 3000);
    } }));
    tt = setTimeout(function () { toast.hidden = true; }, undo ? 10000 : 3500);
  }

  // ---------- tabs ----------
  var tabBtns = {};
  function goTab(id) { state.userTab = true; document.documentElement.setAttribute('data-atab', id); window.scrollTo(0, 0); }
  function setupTabs() {
    var inner = document.querySelector('#aet-admin-tabs .at-in');
    if (!inner) return false;
    if (inner.querySelector('[data-tab="home"]')) return true;
    var out = inner.querySelector('.at-out');
    function mk(id, label) {
      var b = h('button', { type: 'button', role: 'tab', 'data-tab': id }, label, h('span', { class: 'at-badge', hidden: true }));
      b.addEventListener('click', function () { goTab(id); }); tabBtns[id] = b; return b;
    }
    inner.insertBefore(mk('home', 'Home'), inner.firstChild);
    var req = inner.querySelector('[data-tab="req"]');
    inner.insertBefore(mk('rpt', 'Reports'), req || out || null);
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-atab'] });
    sync();
    return true;
  }
  function sync() {
    var cur = document.documentElement.getAttribute('data-atab');
    Array.prototype.forEach.call(document.querySelectorAll('#aet-admin-tabs [data-tab]'), function (b) {
      var on = b.dataset.tab === cur; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (cur === 'home') loadAttention(); else if (cur === 'rpt') loadReports();
  }
  function badge(id, n) {
    var b = tabBtns[id] && tabBtns[id].querySelector('.at-badge'); if (!b) return;
    b.textContent = n > 0 ? String(n) : ''; b.hidden = !(n > 0);
  }

  // ---------- Home: needs attention ----------
  async function loadAttention(quiet) {
    try { state.att = await api({ action: 'attention' }); badge('home', total()); badge('rpt', state.att.reports || 0); renderHome(); }
    catch (e) { if (!quiet) { homeV.textContent = ''; homeV.appendChild(h('div', { class: 'a2-msg bad', text: e.message })); } }
  }
  function total() { var a = state.att || {}; return (a.waiting || 0) + (a.reports || 0) + (a.requests || 0); }
  function card(n, label, detail, btn, hot) {
    return h('div', { class: 'a2-card' + (n ? (hot ? ' hot' : '') : ' zero') },
      h('div', { class: 'a2-n', text: String(n) }), h('div', { class: 'a2-k', text: label }),
      h('div', { class: 'a2-d', text: detail || '' }), n ? btn : null);
  }
  function renderHome() {
    var a = state.att || { waiting: 0, reports: 0, requests: 0 };
    homeV.textContent = '';
    homeV.appendChild(h('h2', { text: 'Needs attention' }));
    homeV.appendChild(h('p', { class: 'a2-sub', text: 'What is waiting for you right now. Tap a card to deal with it.' }));
    if (!total()) homeV.appendChild(h('div', { class: 'a2-clear', text: 'All clear. Nothing is waiting for you.' }));
    homeV.appendChild(h('div', { class: 'a2-cards' },
      card(a.waiting || 0, 'Files from reps', a.oldestWaiting ? 'Oldest waiting ' + ago(a.oldestWaiting) : '', h('button', { type: 'button', class: 'a2-btn', text: 'Review files', onclick: function () { goTab('rep'); } }), true),
      card(a.reports || 0, 'Reports from students', 'Files students say are wrong', h('button', { type: 'button', class: 'a2-btn', text: 'Open reports', onclick: function () { goTab('rpt'); } }), true),
      card(a.requests || 0, 'Material requests', 'Things students asked for', h('button', { type: 'button', class: 'a2-btn', text: 'See requests', onclick: function () { goTab('req'); } }), false)));
    homeV.appendChild(h('div', { class: 'a2-quick' },
      h('button', { type: 'button', class: 'a2-btn alt', text: 'Upload a file', onclick: function () { goTab('res'); } }),
      h('button', { type: 'button', class: 'a2-btn alt', text: 'Make a rep link', onclick: function () { goTab('rep'); } }),
      h('button', { type: 'button', class: 'a2-btn alt', text: 'Post a notice', onclick: function () { goTab('nt'); } })));
  }

  // ---------- Reports ----------
  var REASON = { wrong_file: 'Wrong file', wrong_course: 'Wrong course', cant_open: "Can't open", outdated: 'Out of date', other: 'Other' };
  async function loadReports(quiet) {
    try { state.rpt = await api({ action: 'reports_list' }); badge('rpt', state.rpt.counts.new || 0); renderReports(); }
    catch (e) { if (!quiet) { rptV.textContent = ''; rptV.appendChild(h('div', { class: 'a2-msg bad', text: e.message })); } }
  }
  function grouped() {
    var map = {};
    (state.rpt ? state.rpt.reports : []).forEach(function (r) {
      var key = squash(r.course_code) + '|' + squash(r.resource_title);
      (map[key] = map[key] || { rows: [], code: r.course_code, title: r.resource_title, url: r.file_url, section: r.section, level: r.level }).rows.push(r);
    });
    return Object.keys(map).map(function (k) {
      var g = map[k]; g.rows.sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
      var st = g.rows.map(function (r) { return r.status; });
      g.status = st.indexOf('new') > -1 ? 'new' : (st.indexOf('fixed') > -1 ? 'fixed' : 'dismissed');
      g.open = g.rows.filter(function (r) { return r.status === 'new'; });
      if (!g.url) g.url = (g.rows.filter(function (r) { return r.file_url; })[0] || {}).file_url;
      return g;
    });
  }
  function renderReports() {
    rptV.textContent = '';
    var c = state.rpt.counts;
    rptV.appendChild(h('h2', { text: 'Reports from students' }));
    rptV.appendChild(h('p', { class: 'a2-sub', text: 'Files students flagged as wrong. Fix the file, then mark it fixed.' }));
    rptV.appendChild(h('div', { class: 'a2-stats' },
      h('div', { class: 'a2-stat' }, h('b', { text: String(c.new) }), h('span', { text: 'New' })),
      h('div', { class: 'a2-stat' }, h('b', { text: String(c.fixed) }), h('span', { text: 'Fixed' })),
      h('div', { class: 'a2-stat' }, h('b', { text: String(c.dismissed) }), h('span', { text: 'Dismissed' }))));
    var fl = h('div', { class: 'a2-filters' });
    [['new', 'New'], ['fixed', 'Fixed'], ['dismissed', 'Dismissed'], ['all', 'All']].forEach(function (f) {
      fl.appendChild(h('button', { type: 'button', class: state.filter === f[0] ? 'on' : '', text: f[1], onclick: function () { state.filter = f[0]; renderReports(); } }));
    });
    rptV.appendChild(fl);
    var list = grouped().filter(function (g) { return state.filter === 'all' || g.status === state.filter; });
    list.sort(function (a, b) { return (b.open.length - a.open.length) || (a.rows[0].created_at < b.rows[0].created_at ? 1 : -1); });
    if (!list.length) { rptV.appendChild(h('div', { class: 'a2-empty', text: state.filter === 'new' ? 'No new reports. When a student flags a file, it shows up here.' : 'Nothing here.' })); return; }
    list.forEach(function (g) { rptV.appendChild(reportCard(g)); });
  }
  function reportCard(g) {
    var show = state.filter === 'all' ? g.rows : g.rows.filter(function (r) { return state.filter === 'all' || r.status === state.filter; });
    var counts = {}; show.forEach(function (r) { counts[r.reason] = (counts[r.reason] || 0) + 1; });
    var notes = show.filter(function (r) { return r.note; }).slice(0, 3);
    var el = h('div', { class: 'a2-rep' },
      h('div', { class: 'a2-top' }, h('div', null, h('div', { class: 'a2-t', text: g.code + ' · ' + g.title }),
        h('div', { class: 'a2-m', text: (g.section === 'past-questions' ? 'Past question' : 'Study material') + ' · ' + show.length + ' report' + (show.length === 1 ? '' : 's') + ' · last ' + ago(show[0].created_at) }))),
      h('div', null, Object.keys(counts).map(function (k) { return h('span', { class: 'a2-pill' + (g.status !== 'new' ? ' gr' : ''), text: REASON[k] + (counts[k] > 1 ? ' ×' + counts[k] : '') }); })),
      notes.map(function (r) { return h('div', { class: 'a2-note', text: '“' + r.note + '”' }); }));
    var acts = h('div', { class: 'a2-acts' });
    if (g.url) acts.appendChild(h('a', { class: 'a2-btn alt', href: g.url, target: '_blank', rel: 'noopener', text: 'Open file', style: 'text-decoration:none' }));
    acts.appendChild(h('button', { type: 'button', class: 'a2-btn alt', text: 'Find in Resources', onclick: function () { findInResources(g); } }));
    if (g.open.length) {
      acts.appendChild(h('button', { type: 'button', class: 'a2-btn good', text: 'Mark fixed', onclick: function () { setStatus(g, 'fixed', 'Marked fixed'); } }));
      acts.appendChild(h('button', { type: 'button', class: 'a2-btn warn', text: 'Dismiss', onclick: function () { setStatus(g, 'dismissed', 'Dismissed'); } }));
    } else {
      acts.appendChild(h('button', { type: 'button', class: 'a2-btn alt', text: 'Reopen', onclick: function () { setStatus(g, 'new', 'Reopened'); } }));
    }
    el.appendChild(acts); return el;
  }
  function findInResources(g) {
    goTab('res');
    setTimeout(function () {
      var s = document.getElementById('aet-res-search');
      if (s) { s.value = g.title; s.dispatchEvent(new Event('input', { bubbles: true })); }
      say('Pick level ' + (g.level || '') + ' and ' + g.code + ' in Resources, then use Edit or upload a corrected file.');
    }, 150);
  }
  async function setStatus(g, status, label) {
    var targets = status === 'new' ? g.rows.filter(function (r) { return r.status !== 'new'; }) : g.open;
    var ids = targets.map(function (r) { return r.id; }); if (!ids.length) return;
    var prev = {}; targets.forEach(function (r) { (prev[r.status] = prev[r.status] || []).push(r.id); });
    try {
      await api({ action: 'report_update', ids: ids, status: status });
      await loadReports();
      say(label + ' (' + ids.length + ').', async function () { for (var s in prev) await api({ action: 'report_update', ids: prev[s], status: s }); await loadReports(); });
    } catch (e) { say(e.message); }
  }

  // ---------- Rep uploads: approve all ready, tidy titles, copy warning ----------
  var resCache = {};
  async function titlesFor(courseId) {
    if (!courseId || courseId === '__new') return [];
    if (resCache[courseId]) return resCache[courseId];
    try {
      var r = await sb.from('resources').select('title').eq('course_id', courseId);
      resCache[courseId] = (r.data || []).map(function (x) { return x.title; });
    } catch (e) { resCache[courseId] = []; }
    return resCache[courseId];
  }
  function looksLikeFileName(t) { return /_|\.pdf\b|\(\d+\)\s*$|\bfinal\b/i.test(t); }
  function tidy(t) {
    return String(t).replace(/\.pdf$/i, '').replace(/_+/g, ' ').replace(/\s*\(\d+\)\s*$/, '').replace(/\s+/g, ' ').trim();
  }
  var enh=false;
  async function enhanceReview() {
    if (enh) return; enh = true; try { await enhanceReview2(); } finally { enh = false; }
  }
  async function enhanceReview2() {
    var box = document.getElementById('ct-review'); if (!box) return;
    var items = Array.prototype.slice.call(box.querySelectorAll('.ct-item'));
    var old = box.querySelector('.a2-bar');
    if (!items.length) { if (old) old.remove(); return; }
    var sig = items.map(function (i) { return i.dataset.id; }).join(',');
    if (old && old.dataset.sig === sig) return;
    if (old) old.remove();
    var anyTidy = 0, ready = [], flagged = 0;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var sel = it.querySelector('[data-f="courseId"]'), ti = it.querySelector('[data-f="title"]');
      if (ti && looksLikeFileName(ti.value)) anyTidy++;
      var newCourse = !sel || sel.value === '__new';
      var dupe = null;
      if (!newCourse && ti) {
        var titles = await titlesFor(sel.value), want = squash(tidy(ti.value));
        dupe = titles.filter(function (t) { return squash(t) === want; })[0] || null;
      }
      var warn = it.querySelector('.a2-dup');
      if (dupe && !warn) { var w = h('div', { class: 'a2-dup' }, h('b', { text: 'Possible copy. ' }), 'This course already has a file called "' + dupe + '".'); var grid = it.querySelector('.ct-grid'); (grid || it).insertAdjacentElement('afterend', w); }
      if (!dupe && warn) warn.remove();
      if (dupe) flagged++; else if (!newCourse) ready.push(it.dataset.id); else flagged++;
    }
    var pendingTab = box.querySelector('.ct-tab.on'); if (pendingTab && !/waiting/i.test(pendingTab.textContent)) return;
    var bar = h('div', { class: 'a2-bar' }); bar.dataset.sig = sig;
    bar.appendChild(h('span', null, h('b', { text: items.length + ' waiting. ' }), ready.length + ' ready' + (flagged ? ', ' + flagged + ' need a look (copy or new course).' : '.')));
    if (anyTidy) bar.appendChild(h('button', { type: 'button', class: 'a2-btn alt', text: 'Tidy titles', onclick: function () {
      box.querySelectorAll('.ct-item [data-f="title"]').forEach(function (inp) { if (looksLikeFileName(inp.value)) { var n = tidy(inp.value); if (n.length >= 3) inp.value = n; } });
      bar.remove(); enhanceReview();
    } }));
    if (ready.length > 1) bar.appendChild(h('button', { type: 'button', class: 'a2-btn good', text: 'Approve all ready (' + ready.length + ')', onclick: function () { approveAll(ready, bar); } }));
    var tabs = box.querySelector('.ct-tabs'); if (tabs) tabs.insertAdjacentElement('afterend', bar); else box.insertBefore(bar, box.firstChild);
  }
  function waitGone(id, ms) {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function tick() {
        var el = document.querySelector('#ct-review .ct-item[data-id="' + id + '"]');
        if (!el) return resolve(true);
        if (Date.now() - t0 > ms) return resolve(false);
        setTimeout(tick, 250);
      })();
    });
  }
  async function approveAll(ids, bar) {
    if (state.busy) return;
    if (!window.confirm('Approve and publish ' + ids.length + ' files? You will still see each one in Resources afterwards.')) return;
    state.busy = true;
    var btns = bar.querySelectorAll('button'); btns.forEach(function (b) { b.disabled = true; });
    var done = 0, skipped = 0;
    for (var i = 0; i < ids.length; i++) {
      var b = document.querySelector('#ct-review [data-ct="approve"][data-id="' + ids[i] + '"]');
      if (!b) { skipped++; continue; }
      bar.firstChild.textContent = 'Approving ' + (i + 1) + ' of ' + ids.length + '...';
      b.click();
      if (await waitGone(ids[i], 25000)) done++; else { skipped++; break; }
    }
    state.busy = false;
    say(done + ' approved and published' + (skipped ? '. ' + skipped + ' left for you to check.' : '.'));
    loadAttention(true);
  }

  // ---------- wiring ----------
  var wasLogged = false;
  function watch() {
    var logged = !!document.getElementById('admin-logout-button');
    if (logged && !wasLogged) {
      state.userTab = false; setupTabs(); loadAttention(true);
      // land on Home after sign-in, unless the admin already chose another tab
      setTimeout(function () { if (!state.userTab && document.documentElement.hasAttribute('data-alog')) document.documentElement.setAttribute('data-atab', 'home'); }, 700);
    }
    wasLogged = logged; if (logged) setupTabs();
  }
  setInterval(watch, 1000); watch();
  setInterval(function () { if (wasLogged) loadAttention(true); }, 60000);
  var rv = null;
  setInterval(function () { var b = document.getElementById('ct-review'); if (b && !rv) { rv = new MutationObserver(function () { enhanceReview(); }); rv.observe(b, { childList: true, subtree: true }); enhanceReview(); } if (!b) rv = null; }, 800);
})();