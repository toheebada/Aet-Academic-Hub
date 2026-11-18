/* AET Learning Hub: move draft CBT questions to another course (separate file, index.html untouched)
   Adds a "Move drafts" button in the CBT tab. Pick drafts from the current course, pick the right course, move.
   Needs the "move" action added to the cbt-admin function (36-cbt-admin-patch.txt). */
(function () {
  'use strict';
  if (new URLSearchParams(location.search).get('admin') !== '1' || window.__aetCbtMove) return; window.__aetCbtMove = true;
  var sb = (typeof supabaseClient !== 'undefined') ? supabaseClient : null;
  var FN = ((typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : '') + '/functions/v1/cbt-admin';
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
    '#cm-modal{display:none}',
    'html body > #cm-modal#cm-modal#cm-modal#cm-modal#cm-modal:not([hidden]){display:flex!important;position:fixed;inset:0;z-index:9700;background:rgba(8,11,40,.55);align-items:flex-end;justify-content:center}',
    '@media(min-width:700px){html body > #cm-modal#cm-modal#cm-modal#cm-modal#cm-modal:not([hidden]){align-items:center;padding:20px}}',
    '#cm-modal[hidden]{display:none!important}',
    '#cm-modal .cm-box{background:#fff;width:100%;max-width:640px;max-height:92vh;display:flex;flex-direction:column;border-radius:18px 18px 0 0;color:#11152b;font-family:inherit;overflow:hidden}',
    '@media(min-width:700px){#cm-modal .cm-box{border-radius:18px;max-height:86vh}}',
    '.cm-head{padding:16px 18px 10px}.cm-head h2{margin:0 0 4px;font-size:19px}.cm-head p{margin:0;font-size:13px;color:#6d7185;line-height:1.45}',
    '.cm-to{padding:0 18px 10px}.cm-to label{display:block;font-size:13px;font-weight:800;margin:6px 0 4px}.cm-to select{width:100%;box-sizing:border-box;border:1.5px solid #cfd3e6;border-radius:10px;padding:11px;font:inherit;font-size:14.5px;background:#fff}',
    '.cm-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 18px;border-top:1px solid #eef0f5;border-bottom:1px solid #eef0f5;background:#f6f7fb;font-size:13px;font-weight:700}',
    '.cm-bar label{display:flex;align-items:center;gap:8px;cursor:pointer}',
    '.cm-list{overflow:auto;padding:4px 18px;flex:1;min-height:120px}',
    '.cm-q{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid #eef0f5;font-size:14px;line-height:1.4;cursor:pointer}.cm-q:first-child{border-top:0}',
    '.cm-q input,.cm-bar input{width:18px;height:18px;flex:none;margin-top:1px}.cm-q small{display:block;color:#6d7185;font-size:12px;margin-top:2px}',
    '.cm-empty{padding:24px 0;text-align:center;color:#6d7185;font-size:14px}',
    '.cm-foot{display:flex;gap:10px;padding:12px 18px;border-top:1px solid #eef0f5}',
    '.cm-btn{border:0;border-radius:10px;padding:12px 14px;font:inherit;font-size:14.5px;font-weight:800;cursor:pointer;background:#080b63;color:#fff;flex:1}',
    '.cm-btn.alt{background:#eef0f9;color:#080b63;flex:none}.cm-btn:disabled{opacity:.5;cursor:not-allowed}',
    '.cm-msg{padding:0 18px 8px;font-size:13px;font-weight:700;color:#b42323}',
    '#cm-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:22px;z-index:9750;background:#111827;color:#fff;border-radius:12px;padding:11px 14px;font-size:14px;font-weight:700;display:flex;gap:14px;align-items:center;max-width:calc(100vw - 24px)}',
    '#cm-toast[hidden]{display:none}html.admin-mode body > #cm-toast#cm-toast#cm-toast:not([hidden]){display:flex!important}',
    '#cm-toast button{background:#ffd21c;color:#050747;border:0;border-radius:8px;padding:6px 12px;font:inherit;font-weight:800;cursor:pointer}'
  ].join('\n');
  document.head.appendChild(h('style', { text: css }));

  var modal = h('div', { id: 'cm-modal', hidden: true, role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Move draft questions' });
  var toast = h('div', { id: 'cm-toast', hidden: true, role: 'status', 'aria-live': 'polite' });
  document.body.appendChild(modal); document.body.appendChild(toast);
  var tt = null;
  function say(text, undo) {
    clearTimeout(tt); toast.textContent = ''; toast.hidden = false; toast.appendChild(h('span', { text: text }));
    if (undo) toast.appendChild(h('button', { type: 'button', text: 'Undo', onclick: async function (e) {
      e.target.disabled = true;
      try { await undo(); toast.firstChild.textContent = 'Moved back.'; } catch (x) { toast.firstChild.textContent = 'Could not undo: ' + x.message; }
      e.target.remove(); tt = setTimeout(function () { toast.hidden = true; }, 3500);
    } }));
    tt = setTimeout(function () { toast.hidden = true; }, undo ? 12000 : 3500);
  }
  function refreshCbt() {
    var sel = document.getElementById('qb-course-select');
    if (sel) sel.dispatchEvent(new Event('change', { bubbles: true }));
  }

  var st = { fromId: '', fromCode: '', drafts: [], pick: {}, courses: [] };
  function close() { modal.hidden = true; modal.textContent = ''; }
  function code(c) { return c.code + ' · ' + c.title; }

  async function open() {
    var sel = document.getElementById('qb-course-select');
    if (!sel || !sel.value) { say('Choose a course first.'); return; }
    st.fromId = sel.value; st.pick = {};
    modal.hidden = false; modal.textContent = '';
    modal.appendChild(h('div', { class: 'cm-box' }, h('div', { class: 'cm-head' }, h('h2', { text: 'Loading...' }))));
    try {
      var ov = await api({ action: 'overview' }), ls = await api({ action: 'list', courseId: st.fromId });
      st.courses = ov.courses; var from = ov.courses.filter(function (c) { return c.id === st.fromId; })[0];
      st.fromCode = from ? from.code : 'this course';
      st.drafts = (ls.questions || []).filter(function (q) { return q.status === 'draft'; });
      render();
    } catch (e) { close(); say(e.message); }
  }

  function render() {
    modal.textContent = '';
    var count = Object.keys(st.pick).filter(function (k) { return st.pick[k]; }).length;
    var to = h('select', { id: 'cm-to', 'aria-label': 'Move to course' }, h('option', { value: '', text: 'Choose the correct course...' }),
      st.courses.filter(function (c) { return c.id !== st.fromId; }).map(function (c) { return h('option', { value: c.id, text: code(c) }); }));
    var msg = h('div', { class: 'cm-msg', hidden: true });
    var go = h('button', { type: 'button', class: 'cm-btn', disabled: true });
    function sync() {
      var n = Object.keys(st.pick).filter(function (k) { return st.pick[k]; }).length;
      var opt = to.options[to.selectedIndex];
      go.disabled = !(n && to.value);
      go.textContent = n ? 'Move ' + n + ' draft' + (n === 1 ? '' : 's') + (to.value ? ' to ' + opt.text.split(' · ')[0] : '') : 'Select drafts to move';
      all.checked = n > 0 && n === st.drafts.length;
      cnt.textContent = n + ' of ' + st.drafts.length + ' selected';
    }
    var all = h('input', { type: 'checkbox', 'aria-label': 'Select all drafts' });
    var cnt = h('span');
    all.addEventListener('change', function () { st.drafts.forEach(function (q) { st.pick[q.id] = all.checked; }); list.querySelectorAll('input').forEach(function (i) { i.checked = all.checked; }); sync(); });
    var list = h('div', { class: 'cm-list' });
    if (!st.drafts.length) list.appendChild(h('div', { class: 'cm-empty', text: 'There are no drafts in ' + st.fromCode + ' to move.' }));
    st.drafts.forEach(function (q) {
      var cb = h('input', { type: 'checkbox' }); cb.checked = !!st.pick[q.id];
      cb.addEventListener('change', function () { st.pick[q.id] = cb.checked; sync(); });
      var t = String(q.question_text || '').replace(/\s+/g, ' ').trim();
      list.appendChild(h('label', { class: 'cm-q' }, cb, h('span', null, t.length > 140 ? t.slice(0, 140) + '...' : t, q.topic ? h('small', { text: q.topic }) : null)));
    });
    to.addEventListener('change', sync);
    go.addEventListener('click', async function () {
      var ids = Object.keys(st.pick).filter(function (k) { return st.pick[k]; });
      var dest = to.options[to.selectedIndex].text;
      if (!ids.length || !to.value) return;
      if (!window.confirm('Move ' + ids.length + ' draft' + (ids.length === 1 ? '' : 's') + ' from ' + st.fromCode + ' to ' + dest + '?')) return;
      go.disabled = true; go.textContent = 'Moving...'; msg.hidden = true;
      try {
        var moved = [], skipped = 0;
        for (var i = 0; i < ids.length; i += 200) {
          var r = await api({ action: 'move', ids: ids.slice(i, i + 200), toCourseId: to.value });
          moved = moved.concat(r.ids || []); skipped += r.skipped || 0;
        }
        var fromId = st.fromId, toId = to.value;
        close(); refreshCbt();
        say('Moved ' + moved.length + ' to ' + dest.split(' · ')[0] + (skipped ? '. ' + skipped + ' skipped (not drafts).' : '.'), moved.length ? async function () {
          for (var j = 0; j < moved.length; j += 200) await api({ action: 'move', ids: moved.slice(j, j + 200), toCourseId: fromId });
          refreshCbt();
        } : null);
      } catch (e) { msg.textContent = e.message; msg.hidden = false; sync(); }
    });
    modal.appendChild(h('div', { class: 'cm-box' },
      h('div', { class: 'cm-head' }, h('h2', { text: 'Move drafts to another course' }), h('p', { text: 'Drafts in ' + st.fromCode + '. Tick the ones that belong somewhere else. Approved and published questions are not moved.' })),
      h('div', { class: 'cm-to' }, h('label', { for: 'cm-to', text: 'Move them to' }), to),
      h('div', { class: 'cm-bar' }, h('label', null, all, 'Select all'), cnt),
      list, msg,
      h('div', { class: 'cm-foot' }, h('button', { type: 'button', class: 'cm-btn alt', text: 'Cancel', onclick: close }), go)));
    sync();
  }
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });

  // put the button next to "+ New question"
  function inject() {
    var tb = document.getElementById('qb-toolbar'); if (!tb) return;
    if (tb.querySelector('.cm-open')) return;
    var anchor = tb.querySelector('[data-action="toggle-import"]'); if (!anchor) return;
    var b = h('button', { type: 'button', class: 'qb-btn cm-open', text: 'Move drafts' }); b.addEventListener('click', open);
    anchor.parentNode.insertBefore(b, anchor.nextSibling);
  }
  var obs = null;
  setInterval(function () {
    var tb = document.getElementById('qb-toolbar');
    if (tb && !obs) { obs = new MutationObserver(inject); obs.observe(tb, { childList: true, subtree: true }); inject(); }
    if (!tb) obs = null;
  }, 800);
})();