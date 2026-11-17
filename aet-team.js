/* AET Learning Hub: team admins (separate file, index.html untouched)
   - Team tab (owner only): add an admin by email, copy their invite link, revoke or restore, see the activity log
   - "Set your password" screen for a new admin who opens their invite link
   Needs 35-team.sql run once and the updated hub-extras and cbt-admin functions. */
(function () {
  'use strict';
  var qs = new URLSearchParams(location.search);
  if (qs.get('admin') !== '1' || window.__aetTeam) return; window.__aetTeam = true;
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
  function ago(iso) {
    if (!iso) return 'never';
    var m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (m < 2) return 'just now'; if (m < 60) return m + ' min ago';
    var hr = Math.round(m / 60); if (hr < 24) return hr + 'h ago';
    var d = Math.round(hr / 24); return d + (d === 1 ? ' day ago' : ' days ago');
  }
  async function api(body) {
    var s = (await sb.auth.getSession()).data.session;
    if (!s) throw new Error('Please sign in as admin.');
    var res;
    try { res = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + s.access_token }, body: JSON.stringify(body) }); }
    catch (e) { throw new Error('Could not reach the server. Check your internet connection.'); }
    var data = null; try { data = await res.json(); } catch (e) {}
    if (!res.ok) { var err = new Error((data && data.error) || 'Something went wrong.'); err.status = res.status; throw err; }
    return data;
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, no) {
      var t = h('textarea', { style: 'position:fixed;opacity:0' }); t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand('copy') ? ok() : no(); } catch (e) { no(e); } t.remove();
    });
  }

  var css = [
    '#aet-admin-team{display:none;max-width:860px;margin:0 auto;padding:18px 16px 60px;color:#11152b;font-family:inherit}',
    'html.admin-mode[data-alog][data-atab="team"] body > #aet-admin-team#aet-admin-team#aet-admin-team{display:block!important}',
    'html[data-atab="team"] #aet-admin-upload,html[data-atab="team"] #aet-admin-cbt,html[data-atab="team"] #aet-admin-contrib,html[data-atab="team"] #aet-admin-extras,html[data-atab="team"] #aet-admin-v2{display:none!important}',
    '#aet-admin-team h2{font-size:20px;margin:0 0 4px}#aet-admin-team h3{font-size:16px;margin:26px 0 10px}.tm-sub{font-size:13.5px;color:#6d7185;margin:0 0 14px;line-height:1.45}',
    '.tm-card{background:#fff;border:1px solid #e7e9f1;border-radius:14px;padding:14px 16px;margin-bottom:10px}',
    '.tm-add{display:flex;gap:8px;flex-wrap:wrap}.tm-add input{flex:1;min-width:200px;border:1.5px solid #cfd3e6;border-radius:10px;padding:11px 12px;font:inherit;font-size:14.5px}',
    '.tm-btn{border:0;border-radius:10px;padding:10px 14px;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer;background:#080b63;color:#fff}',
    '.tm-btn.alt{background:#eef0f9;color:#080b63}.tm-btn.good{background:#12733a}.tm-btn.warn{background:#fff;color:#b42323;border:1.5px solid #f1b4b4}.tm-btn:disabled{opacity:.55;cursor:progress}',
    '.tm-msg{font-size:13px;font-weight:700;margin:8px 0 0}.tm-msg.bad{color:#b42323}',
    '.tm-link{display:flex;gap:8px;margin:10px 0}.tm-link input{flex:1;min-width:0;border:1.5px solid #cfd3e6;border-radius:10px;padding:10px;font:inherit;font-size:12.5px;background:#f6f7fb}',
    '.tm-note{font-size:12.5px;color:#6d7185;line-height:1.45;margin-top:6px}',
    '.tm-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.tm-who{flex:1;min-width:180px}.tm-em{font-weight:800;font-size:14.5px;overflow-wrap:anywhere}.tm-meta{font-size:12.5px;color:#6d7185;margin-top:2px}',
    '.tm-pill{display:inline-block;border-radius:99px;padding:2px 9px;font-size:11.5px;font-weight:800;margin-left:6px;vertical-align:middle;background:#eef0f9;color:#080b63}',
    '.tm-pill.active{background:#eaf8ef;color:#12733a}.tm-pill.invited{background:#fff4d6;color:#8a5a00}.tm-pill.revoked{background:#fdeaea;color:#b42323}.tm-pill.owner{background:#080b63;color:#ffd21c}',
    '.tm-acts{display:flex;gap:6px;flex-wrap:wrap}.tm-acts .tm-btn{padding:8px 11px}',
    '.tm-log{font-size:13.5px}.tm-li{display:flex;gap:10px;padding:8px 0;border-top:1px solid #eef0f5}.tm-li:first-child{border-top:0}.tm-lw{color:#6d7185;min-width:74px;font-size:12.5px;padding-top:1px}.tm-lt{overflow-wrap:anywhere}',
    '#tm-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:22px;z-index:9500;background:#111827;color:#fff;border-radius:12px;padding:11px 14px;font-size:14px;font-weight:700;display:flex;gap:14px;align-items:center;max-width:calc(100vw - 24px)}',
    '#tm-toast[hidden]{display:none}html.admin-mode body > #tm-toast#tm-toast#tm-toast:not([hidden]){display:flex!important}',
    '#tm-toast button{background:#ffd21c;color:#050747;border:0;border-radius:8px;padding:6px 12px;font:inherit;font-weight:800;cursor:pointer}',
    /* welcome screen */
    '#aet-welcome{display:none}',
    'html body > #aet-welcome#aet-welcome#aet-welcome#aet-welcome#aet-welcome{display:flex!important;position:fixed;inset:0;z-index:9800;background:#080b63;align-items:center;justify-content:center;padding:16px;overflow:auto}',
    '#aet-welcome .w-box{background:#fff;border-radius:18px;max-width:420px;width:100%;padding:24px 22px;color:#11152b;font-family:inherit}',
    '#aet-welcome h2{margin:0 0 6px;font-size:22px}#aet-welcome p{margin:0 0 14px;color:#5b6075;font-size:14px;line-height:1.5}',
    '#aet-welcome label{display:block;font-size:13px;font-weight:800;margin:10px 0 4px}#aet-welcome input{width:100%;box-sizing:border-box;border:1.5px solid #cfd3e6;border-radius:10px;padding:12px;font:inherit;font-size:15px}',
    '#aet-welcome .tm-btn{width:100%;margin-top:16px;padding:13px;font-size:15px;background:#ffd21c;color:#050747}'
  ].join('\n');
  document.head.appendChild(h('style', { text: css }));

  var toast = h('div', { id: 'tm-toast', hidden: true, role: 'status', 'aria-live': 'polite' }); document.body.appendChild(toast);
  var tt = null;
  function say(text, undo) {
    clearTimeout(tt); toast.textContent = ''; toast.hidden = false; toast.appendChild(h('span', { text: text }));
    if (undo) toast.appendChild(h('button', { type: 'button', text: 'Undo', onclick: async function (e) {
      e.target.disabled = true;
      try { await undo(); toast.firstChild.textContent = 'Undone.'; } catch (x) { toast.firstChild.textContent = 'Could not undo: ' + x.message; }
      e.target.remove(); tt = setTimeout(function () { toast.hidden = true; }, 3000);
    } }));
    tt = setTimeout(function () { toast.hidden = true; }, undo ? 10000 : 3500);
  }

  // ---------- Team tab ----------
  var panel = h('section', { id: 'aet-admin-team', 'aria-label': 'Team' });
  var state = { admins: [], log: [], result: null, busy: false };

  function waText(email, link) {
    return 'Hi, you have been added as an admin on the AET Learning Hub.\n\n1. Open this link and set your password (it works once and expires, so open it soon):\n' + link +
      '\n\n2. After that, sign in anytime at https://aetlearninghub.app/?admin=1 with ' + email + ' and your new password.';
  }
  function render() {
    panel.textContent = '';
    panel.appendChild(h('h2', { text: 'Your team' }));
    panel.appendChild(h('p', { class: 'tm-sub', text: 'Admins can do everything you can, except manage the team. You can revoke anyone at any time.' }));

    var email = h('input', { type: 'email', placeholder: 'their@email.com', 'aria-label': 'Email of the new admin', autocomplete: 'off' });
    var msg = h('div', { class: 'tm-msg bad', hidden: true });
    var go = h('button', { type: 'button', class: 'tm-btn', text: 'Create invite link' });
    go.addEventListener('click', async function () {
      msg.hidden = true; go.disabled = true;
      try { state.result = await api({ action: 'team_invite', email: email.value }); await load(); }
      catch (e) { msg.textContent = e.message; msg.hidden = false; go.disabled = false; }
    });
    email.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
    panel.appendChild(h('div', { class: 'tm-card' }, h('div', { class: 'tm-row', style: 'font-weight:800;margin-bottom:8px', text: 'Add an admin' }), h('div', { class: 'tm-add' }, email, go), msg));

    if (state.result) {
      var r = state.result, box = h('div', { class: 'tm-card', style: 'border-color:#bfe8cd;background:#f7fcf9' });
      var inp = h('input', { type: 'text', readonly: true, value: r.link, 'aria-label': 'Invite link' });
      box.appendChild(h('div', { style: 'font-weight:800', text: 'Link ready for ' + r.email }));
      box.appendChild(h('div', { class: 'tm-link' }, inp, h('button', { type: 'button', class: 'tm-btn', text: 'Copy link', onclick: function () { copy(r.link).then(function () { say('Link copied.'); }, function () { inp.select(); say('Select and copy the link.'); }); } })));
      box.appendChild(h('div', { class: 'tm-acts' },
        h('button', { type: 'button', class: 'tm-btn alt', text: 'Copy WhatsApp message', onclick: function () { copy(waText(r.email, r.link)).then(function () { say('Message copied. Paste it in WhatsApp.'); }, function () { say('Could not copy.'); }); } }),
        h('button', { type: 'button', class: 'tm-btn alt', text: 'Done', onclick: function () { state.result = null; render(); } })));
      box.appendChild(h('div', { class: 'tm-note', text: 'Send this only to them. The link works once and expires soon, so send it when they are ready. If it expires, use "New link" next to their name.' }));
      panel.appendChild(box);
    }

    state.admins.forEach(function (a) {
      var row = h('div', { class: 'tm-card tm-row' },
        h('div', { class: 'tm-who' },
          h('div', { class: 'tm-em' }, a.email, h('span', { class: 'tm-pill ' + (a.role === 'owner' ? 'owner' : a.status), text: a.role === 'owner' ? 'Owner' : (a.status === 'active' ? 'Active' : a.status === 'invited' ? 'Invite not opened' : 'Revoked') })),
          h('div', { class: 'tm-meta', text: a.role === 'owner' ? 'You. Cannot be revoked.' : (a.status === 'revoked' ? 'Access removed ' + ago(a.revokedAt) : 'Last sign-in: ' + ago(a.lastSignIn)) })));
      if (a.role !== 'owner') {
        var acts = h('div', { class: 'tm-acts' });
        if (a.status === 'revoked') acts.appendChild(h('button', { type: 'button', class: 'tm-btn good', text: 'Restore', onclick: function () { act('team_restore', a, 'Restored ' + a.email); } }));
        else {
          acts.appendChild(h('button', { type: 'button', class: 'tm-btn alt', text: 'New link', onclick: async function (e) { e.target.disabled = true; try { state.result = await api({ action: 'team_link', id: a.id }); render(); window.scrollTo(0, 0); } catch (x) { say(x.message); e.target.disabled = false; } } }));
          acts.appendChild(h('button', { type: 'button', class: 'tm-btn warn', text: 'Revoke', onclick: function () { if (window.confirm('Remove admin access for ' + a.email + '? They are locked out straight away.')) act('team_revoke', a, 'Revoked ' + a.email, 'team_restore'); } }));
        }
        row.appendChild(acts);
      }
      panel.appendChild(row);
    });

    panel.appendChild(h('h3', { text: 'Recent activity' }));
    var log = h('div', { class: 'tm-card tm-log' });
    if (!state.log.length) log.appendChild(h('div', { class: 'tm-note', text: 'Nothing yet. Uploads, edits, deletes, rep file decisions and team changes show up here.' }));
    state.log.forEach(function (l) { log.appendChild(h('div', { class: 'tm-li' }, h('div', { class: 'tm-lw', text: ago(l.created_at) }), h('div', { class: 'tm-lt' }, h('b', { text: (l.email || 'System').split('@')[0] }), ' ' + label(l.action) + (l.detail ? ': ' + l.detail : '')))); });
    panel.appendChild(log);
  }
  var LABELS = { 'insert resources': 'added a file', 'update resources': 'edited a file', 'delete resources': 'deleted a file', 'insert courses': 'added a course', 'delete courses': 'deleted a course',
    'rep file approve': 'approved a rep file', 'rep file reject': 'rejected a rep file', 'team invite': 'invited', 'team link again': 'sent a new link to', 'team new link': 'sent a new link to', 'team revoke': 'revoked', 'team restore': 'restored' };
  function label(a) { return LABELS[a] || a; }

  async function act(action, a, text, undoAction) {
    try {
      await api({ action: action, id: a.id }); await load();
      say(text + '.', undoAction ? async function () { await api({ action: undoAction, id: a.id }); await load(); } : null);
    } catch (e) { say(e.message); }
  }
  async function load() {
    var t = await api({ action: 'team_list' }); state.admins = t.admins;
    try { state.log = (await api({ action: 'log_list' })).log; } catch (e) { state.log = []; }
    render();
  }

  var started = false;
  async function start() {
    if (started) return; started = true;
    try { await load(); } catch (e) { started = false; if (e.status === 403 || e.status === 401) started = 'no'; return; }
    document.body.appendChild(panel);
    var inner = document.querySelector('#aet-admin-tabs .at-in'); if (!inner) return;
    if (!inner.querySelector('[data-tab="team"]')) {
      var b = h('button', { type: 'button', role: 'tab', 'data-tab': 'team', text: 'Team' });
      b.addEventListener('click', function () { document.documentElement.setAttribute('data-atab', 'team'); window.scrollTo(0, 0); });
      inner.insertBefore(b, inner.querySelector('.at-out'));
    }
    new MutationObserver(function () {
      var cur = document.documentElement.getAttribute('data-atab'), b2 = document.querySelector('#aet-admin-tabs [data-tab="team"]');
      if (b2) { b2.classList.toggle('on', cur === 'team'); b2.setAttribute('aria-selected', cur === 'team' ? 'true' : 'false'); }
      if (cur === 'team') load().catch(function () {});
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-atab'] });
  }
  setInterval(function () { if (started === false && document.getElementById('admin-logout-button') && document.querySelector('#aet-admin-tabs .at-in')) start(); if (started && !document.getElementById('admin-logout-button')) { /* logged out */ } }, 1000);

  // ---------- Welcome screen for a new admin ----------
  if (qs.get('welcome') === '1') {
    var wel = h('div', { id: 'aet-welcome', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Set your password' });
    document.body.appendChild(wel);
    var tries = 0, th = qs.get('th'), ty = qs.get('ty') === 'recovery' ? 'recovery' : 'invite', pre = Promise.resolve();
    if (th) pre = sb.auth.verifyOtp({ token_hash: th, type: ty }).catch(function () {});
    pre.then(function () { (function wait() {
      sb.auth.getSession().then(function (r) {
        var s = r.data && r.data.session;
        if (s) return showWelcome(s.user.email);
        if (++tries < 12) return setTimeout(wait, 700);
        wel.textContent = ''; wel.appendChild(h('div', { class: 'w-box' }, h('h2', { text: 'This link has expired' }), h('p', { text: 'Invite links work once and expire quickly. Ask AET to send you a new one.' }),
          h('button', { type: 'button', class: 'tm-btn', text: 'Go to the site', onclick: function () { location.replace('/'); } })));
      });
    })(); });
    function showWelcome(email) {
      wel.textContent = '';
      var p1 = h('input', { type: 'password', id: 'w-p1', autocomplete: 'new-password', minlength: '8' }), p2 = h('input', { type: 'password', id: 'w-p2', autocomplete: 'new-password' });
      var err = h('div', { class: 'tm-msg bad', hidden: true }), btn = h('button', { type: 'button', class: 'tm-btn', text: 'Save password and continue' });
      btn.addEventListener('click', async function () {
        err.hidden = true;
        if (p1.value.length < 8) { err.textContent = 'Use at least 8 characters.'; err.hidden = false; return; }
        if (p1.value !== p2.value) { err.textContent = 'The two passwords do not match.'; err.hidden = false; return; }
        btn.disabled = true; btn.textContent = 'Saving...';
        var r = await sb.auth.updateUser({ password: p1.value });
        if (r.error) { err.textContent = r.error.message || 'Could not save. Try again.'; err.hidden = false; btn.disabled = false; btn.textContent = 'Save password and continue'; return; }
        location.replace('/?admin=1');
      });
      wel.appendChild(h('div', { class: 'w-box' }, h('h2', { text: 'Welcome to the AET team' }), h('p', { text: 'Set a password for ' + email + '. You will use it to sign in to the admin page.' }),
        h('label', { for: 'w-p1', text: 'New password' }), p1, h('label', { for: 'w-p2', text: 'Type it again' }), p2, err, btn));
    }
  }
})();