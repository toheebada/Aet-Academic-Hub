/* AET Learning Hub: find duplicate files (separate file, index.html untouched)
   Adds a "Find duplicates" button above the Existing Resources search box in the admin Resources tab.
   Same course + same type + same title (ignoring spaces, case, symbols) counts as a duplicate.
   Keep one, then hide the extras (can be undone) or delete them for good. */
(function () {
  'use strict';
  if (new URLSearchParams(location.search).get('admin') !== '1' || window.__aetDupes) return; window.__aetDupes = true;
  var sb = (typeof supabaseClient !== 'undefined') ? supabaseClient : null; if (!sb) return;

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
  function squash(t) { return String(t || '').toLowerCase().replace(/\.pdf$/i, '').replace(/[^a-z0-9]+/g, ''); }
  function day(iso) { return iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }

  var css = [
    '.du-open{margin:10px 0 0;border:1.5px solid #080b63;background:#fff;color:#080b63;border-radius:10px;padding:10px 14px;font:inherit;font-weight:800;font-size:14px;cursor:pointer}',
    '#du-modal{display:none}',
    'html body > #du-modal#du-modal#du-modal#du-modal#du-modal:not([hidden]){display:flex!important;position:fixed;inset:0;z-index:9700;background:rgba(8,11,40,.55);align-items:flex-end;justify-content:center}',
    '@media(min-width:700px){html body > #du-modal#du-modal#du-modal#du-modal#du-modal:not([hidden]){align-items:center;padding:20px}}',
    '#du-modal[hidden]{display:none!important}',
    '#du-modal .du-box{background:#fff;width:100%;max-width:700px;max-height:92vh;display:flex;flex-direction:column;border-radius:18px 18px 0 0;color:#11152b;font-family:inherit;overflow:hidden}',
    '@media(min-width:700px){#du-modal .du-box{border-radius:18px;max-height:86vh}}',
    '.du-head{padding:16px 18px 10px}.du-head h2{margin:0 0 4px;font-size:19px}.du-head p{margin:0;font-size:13px;color:#6d7185;line-height:1.45}',
    '.du-list{overflow:auto;padding:4px 18px 12px;flex:1}',
    '.du-g{border:1px solid #e7e9f1;border-radius:14px;padding:12px;margin-top:10px}.du-gt{font-weight:800;font-size:14.5px;overflow-wrap:anywhere}.du-gs{font-size:12.5px;color:#6d7185;margin:2px 0 6px}',
    '.du-r{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-top:1px solid #eef0f5;font-size:13.5px;cursor:pointer;line-height:1.35}.du-r:first-of-type{border-top:0}',
    '.du-r input{width:18px;height:18px;flex:none;margin-top:1px}.du-r small{display:block;color:#6d7185;font-size:12px;margin-top:2px}.du-r a{color:#080b63;font-weight:700}',
    '.du-keep{display:inline-block;background:#eaf8ef;color:#12733a;border-radius:99px;padding:1px 8px;font-size:11.5px;font-weight:800;margin-left:6px}',
    '.du-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}',
    '.du-btn{border:0;border-radius:10px;padding:10px 13px;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer;background:#080b63;color:#fff}.du-btn.alt{background:#eef0f9;color:#080b63}.du-btn.warn{background:#fff;color:#b42323;border:1.5px solid #f1b4b4}.du-btn:disabled{opacity:.5;cursor:progress}',
    '.du-foot{padding:12px 18px;border-top:1px solid #eef0f5;display:flex;gap:8px;flex-wrap:wrap}',
    '.du-empty{padding:30px 0;text-align:center;color:#6d7185;font-size:14.5px}',
    '#du-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:22px;z-index:9750;background:#111827;color:#fff;border-radius:12px;padding:11px 14px;font-size:14px;font-weight:700;display:flex;gap:14px;align-items:center;max-width:calc(100vw - 24px)}',
    '#du-toast[hidden]{display:none}html.admin-mode body > #du-toast#du-toast#du-toast:not([hidden]){display:flex!important}',
    '#du-toast button{background:#ffd21c;color:#050747;border:0;border-radius:8px;padding:6px 12px;font:inherit;font-weight:800;cursor:pointer}'
  ].join('\n');
  document.head.appendChild(h('style', { text: css }));

  var modal = h('div', { id: 'du-modal', hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Duplicate files' });
  var toast = h('div', { id: 'du-toast', hidden: true, role: 'status', 'aria-live': 'polite' });
  document.body.appendChild(modal); document.body.appendChild(toast);
  var tt = null;
  function say(text, undo) {
    clearTimeout(tt); toast.textContent = ''; toast.hidden = false; toast.appendChild(h('span', { text: text }));
    if (undo) toast.appendChild(h('button', { type: 'button', text: 'Undo', onclick: async function (e) {
      e.target.disabled = true;
      try { await undo(); toast.firstChild.textContent = 'Put back.'; } catch (x) { toast.firstChild.textContent = 'Could not undo: ' + x.message; }
      e.target.remove(); tt = setTimeout(function () { toast.hidden = true; }, 3500);
    } }));
    tt = setTimeout(function () { toast.hidden = true; }, undo ? 12000 : 4000);
  }
  function close() { modal.hidden = true; modal.textContent = ''; }
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });

  async function loadAll() {
    var courses = await sb.from('courses').select('id, code, title'); if (courses.error) throw courses.error;
    var rows = [], from = 0;
    for (;;) {
      var r = await sb.from('resources').select('*').range(from, from + 999); if (r.error) throw r.error;
      rows = rows.concat(r.data || []); if (!r.data || r.data.length < 1000) break; from += 1000;
    }
    var cmap = {}; (courses.data || []).forEach(function (c) { cmap[c.id] = c; });
    return { rows: rows, cmap: cmap };
  }
  function groups(data) {
    var map = {};
    data.rows.forEach(function (r) {
      if (r.published === false) return;                       // already hidden
      var k = r.course_id + '|' + (r.type || '') + '|' + squash(r.title); if (squash(r.title).length < 3) return;
      (map[k] = map[k] || []).push(r);
    });
    return Object.keys(map).map(function (k) { return map[k]; }).filter(function (g) { return g.length > 1; }).map(function (g) {
      g.sort(function (a, b) { return String(a.created_at || '') < String(b.created_at || '') ? -1 : 1; }); return g;
    }).sort(function (a, b) { var ca = data.cmap[a[0].course_id], cb = data.cmap[b[0].course_id]; return String(ca && ca.code).localeCompare(String(cb && cb.code)); });
  }

  async function openFinder() {
    modal.hidden = false; modal.textContent = '';
    modal.appendChild(h('div', { class: 'du-box' }, h('div', { class: 'du-head' }, h('h2', { text: 'Looking for duplicates...' }))));
    var data; try { data = await loadAll(); } catch (e) { close(); say('Could not load resources: ' + (e.message || e)); return; }
    render(data);
  }
  function render(data) {
    var gs = groups(data), keep = {}, box = h('div', { class: 'du-box' });
    var extras = gs.reduce(function (n, g) { return n + g.length - 1; }, 0);
    box.appendChild(h('div', { class: 'du-head' }, h('h2', { text: gs.length ? gs.length + ' duplicate group' + (gs.length === 1 ? '' : 's') + ' found' : 'No duplicates found' }),
      h('p', { text: gs.length ? 'Same course, type and title. In each group, pick the one to keep. The others (' + extras + ' in total) are hidden from students. Hiding can be undone. Deleting cannot.' : 'Nothing published shares a title within the same course.' })));
    var list = h('div', { class: 'du-list' });
    if (!gs.length) list.appendChild(h('div', { class: 'du-empty', text: 'All clear.' }));
    gs.forEach(function (g, gi) {
      keep[gi] = g[0].id;
      var c = data.cmap[g[0].course_id];
      var card = h('div', { class: 'du-g' }, h('div', { class: 'du-gt', text: g[0].title }), h('div', { class: 'du-gs', text: (c ? c.code : 'Unknown course') + ' · ' + (g[0].type === 'past_question' ? 'Past question' : 'Study material') + ' · ' + g.length + ' copies' }));
      g.forEach(function (r, ri) {
        var radio = h('input', { type: 'radio', name: 'du-g' + gi }); if (ri === 0) radio.checked = true;
        radio.addEventListener('change', function () { keep[gi] = r.id; });
        var url = r.file_path ? sb.storage.from('academic-resources').getPublicUrl(r.file_path).data.publicUrl : '';
        card.appendChild(h('label', { class: 'du-r' }, radio, h('span', null, 'Keep this one' + (ri === 0 ? ' (oldest)' : ''), r.topic ? ' · ' + r.topic : '', h('small', { text: 'Added ' + day(r.created_at) }), url ? h('a', { href: url, target: '_blank', rel: 'noopener', text: 'Open file', onclick: function (e) { e.stopPropagation(); } }) : null)));
      });
      var acts = h('div', { class: 'du-acts' });
      acts.appendChild(h('button', { type: 'button', class: 'du-btn', text: 'Hide the others', onclick: function (e) { act(e.target, g, keep[gi], 'hide', data); } }));
      acts.appendChild(h('button', { type: 'button', class: 'du-btn warn', text: 'Delete the others', onclick: function (e) { act(e.target, g, keep[gi], 'delete', data); } }));
      card.appendChild(acts); list.appendChild(card);
    });
    box.appendChild(list);
    box.appendChild(h('div', { class: 'du-foot' }, h('button', { type: 'button', class: 'du-btn alt', text: 'Close', onclick: close })));
    modal.textContent = ''; modal.appendChild(box);
  }
  async function act(btn, g, keepId, mode, data) {
    var others = g.filter(function (r) { return r.id !== keepId; });
    if (mode === 'delete' && !window.confirm('Delete ' + others.length + ' file' + (others.length === 1 ? '' : 's') + ' for good? The PDF and its record are removed and this cannot be undone.')) return;
    btn.disabled = true;
    try {
      var ids = others.map(function (r) { return r.id; });
      if (mode === 'hide') {
        var u = await sb.from('resources').update({ published: false }).in('id', ids); if (u.error) throw u.error;
        data.rows.forEach(function (r) { if (ids.indexOf(r.id) > -1) r.published = false; });
        say('Hid ' + ids.length + ' duplicate' + (ids.length === 1 ? '' : 's') + '. Refresh the Resources list to see it.', async function () {
          var b = await sb.from('resources').update({ published: true }).in('id', ids); if (b.error) throw b.error;
          data.rows.forEach(function (r) { if (ids.indexOf(r.id) > -1) r.published = true; }); render(data);
        });
      } else {
        var paths = others.map(function (r) { return r.file_path; }).filter(Boolean);
        // keep the file if the kept copy points at the very same stored file
        var keepRow = g.filter(function (r) { return r.id === keepId; })[0];
        paths = paths.filter(function (p) { return !keepRow || p !== keepRow.file_path; });
        if (paths.length) { var s = await sb.storage.from('academic-resources').remove(paths); if (s.error) throw s.error; }
        var d = await sb.from('resources').delete().in('id', ids); if (d.error) throw d.error;
        data.rows = data.rows.filter(function (r) { return ids.indexOf(r.id) === -1; });
        say('Deleted ' + ids.length + ' duplicate' + (ids.length === 1 ? '' : 's') + '. Refresh the Resources list to see it.');
      }
      render(data);
    } catch (e) { btn.disabled = false; say('Could not finish: ' + (e.message || e)); }
  }

  function inject() {
    var s = document.getElementById('aet-res-search'); if (!s || document.querySelector('.du-open')) return;
    s.parentNode.insertBefore(h('button', { type: 'button', class: 'du-open', text: 'Find duplicates', onclick: openFinder }), s);
  }
  setInterval(inject, 1000); inject();
})();