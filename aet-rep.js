/* AET Learning Hub: course rep upload page, send MANY files at once
   Separate file. index.html and the contribute function are not changed.
   Only runs on the rep link page (?contribute=...).
   - the file picker accepts many PDFs
   - every file gets its own title, filled from the file name, which the rep can edit
   - course, type, topic and note apply to all of them
   - files go one by one, with progress, and a clear result at the end
   - one file still uses the normal page, untouched */
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  if (!params.has('contribute')) return;
  var token = String(params.get('contribute') || '').trim();
  var MAX_BYTES = 50 * 1024 * 1024;
  var MAX_PENDING_AT_ONCE = 10;          // same limit the server enforces
  var busy = false;
  var rows = [];                         // {file, title, problem}

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function size(b) { return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }

  function niceTitle(name) {
    return String(name).replace(/\.pdf$/i, '').replace(/[_]+/g, ' ')
      .replace(/\s*\(\d+\)\s*$/, '').replace(/\s*[-–]\s*copy$/i, '')
      .replace(/\s+/g, ' ').trim().slice(0, 120);
  }

  async function call(payload) {
    try {
      var res = await fetch(CONTRIBUTE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({}, payload, { token: token })) });
      var data = null; try { data = await res.json(); } catch (e) {}
      return { ok: res.ok, status: res.status, data: data };
    } catch (e) { return { ok: false, status: 0, data: null }; }
  }
  function why(r, fallback) {
    if (r.status === 0) return 'No internet connection.';
    return (r.data && r.data.error) || fallback || 'Something went wrong.';
  }

  var st = document.createElement('style');
  st.textContent = [
    '#rp-box{margin:10px 0 4px}',
    '.rp-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin:0 0 8px;font-size:13.5px;font-weight:800;color:#080b63}',
    '.rp-head small{font-weight:600;color:#5b6075}',
    '.rp-row{display:grid;grid-template-columns:1fr auto;gap:4px 8px;align-items:center;padding:10px;border:1px solid #dfe3f3;border-radius:12px;background:#fff;margin-bottom:8px}',
    '.rp-row.bad{border-color:#f1b4b4;background:#fff6f6}.rp-row.ok{border-color:#bfe8cd;background:#f2fbf5}',
    '.rp-row input{width:100%;min-width:0;padding:9px 10px;border:1px solid #cdd2e8;border-radius:9px;font:inherit;font-size:14px}',
    '.rp-meta{grid-column:1/-1;font-size:12px;color:#5b6075;display:flex;justify-content:space-between;gap:8px}',
    '.rp-meta b{font-weight:700}.rp-row.bad .rp-meta{color:#b42323}.rp-row.ok .rp-meta{color:#12733a}',
    '.rp-x{border:0;background:#eef0f9;color:#080b63;width:32px;height:32px;border-radius:50%;font-size:18px;cursor:pointer}',
    '.rp-bar{height:8px;border-radius:99px;background:#e3e6f5;overflow:hidden;margin:8px 0}.rp-bar i{display:block;height:100%;width:0;background:#2f4bc4;transition:width .25s}',
    '.rp-sum{padding:12px 14px;border-radius:12px;background:#eef3ff;border:1px solid #cfdcff;font-size:14px;line-height:1.5;color:#1f2430;margin:10px 0}',
    '.rp-sum.good{background:#f2fbf5;border-color:#bfe8cd}.rp-sum ul{margin:6px 0 0;padding-left:18px}'
  ].join('');
  document.head.appendChild(st);

  function body() { return document.getElementById('cp-body'); }
  function $(sel) { var b = body(); return b && b.querySelector(sel); }

  async function checkOne(file) {
    if (!/\.pdf$/i.test(file.name)) return 'Not a PDF.';
    if (file.size < 1) return 'File is empty.';
    if (file.size > MAX_BYTES) return 'Bigger than 50 MB. Compress it first.';
    try {
      var head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
      if (new TextDecoder('latin1').decode(head).indexOf('%PDF-') === -1) return 'Does not look like a real PDF.';
    } catch (e) {}
    return '';
  }

  function paintRows() {
    var box = $('#rp-box'); if (!box) return;
    if (!rows.length) { box.innerHTML = ''; setSingle(true); return; }
    var good = rows.filter(function (r) { return !r.problem; }).length;
    box.innerHTML = '<div class="rp-head"><span>' + rows.length + ' files selected</span><small>Edit any title below</small></div>' +
      rows.map(function (r, i) {
        var cls = r.done ? 'ok' : (r.problem || r.error) ? 'bad' : '';
        var meta = r.done ? 'Sent for review' : (r.problem || r.error || size(r.file.size));
        return '<div class="rp-row ' + cls + '" data-i="' + i + '"><input type="text" maxlength="120" value="' + esc(r.title) + '" aria-label="Title for ' + esc(r.file.name) + '"' + (busy || r.done ? ' disabled' : '') + '>' +
          (busy || r.done ? '<span></span>' : '<button type="button" class="rp-x" aria-label="Remove ' + esc(r.file.name) + '">×</button>') +
          '<div class="rp-meta"><span>' + esc(r.file.name) + '</span><b>' + esc(meta) + '</b></div></div>';
      }).join('') + '<div class="rp-bar" id="rp-bar" hidden><i></i></div>';
    box.querySelectorAll('.rp-row input').forEach(function (inp) {
      inp.addEventListener('input', function () { rows[+inp.closest('.rp-row').dataset.i].title = inp.value; });
    });
    box.querySelectorAll('.rp-x').forEach(function (b) {
      b.addEventListener('click', function () { rows.splice(+b.closest('.rp-row').dataset.i, 1); syncInput(); paintRows(); });
    });
    var send = $('#cp-send'); if (send && !busy) send.textContent = good > 1 ? 'Send ' + good + ' files for review' : 'Send for review';
  }

  function syncInput() {
    // keep the real input in step so a single file still works with the normal page
    var input = $('#cp-file'); if (!input) return;
    try {
      var dt = new DataTransfer(); rows.forEach(function (r) { dt.items.add(r.file); }); input.files = dt.files;
    } catch (e) {}
  }

  function setSingle(single) {
    var title = $('#cp-title'); if (!title) return;
    var lab = body().querySelector('label[for="cp-title"]');
    title.style.display = single ? '' : 'none'; if (lab) lab.style.display = single ? '' : 'none';
  }

  function msg(text, kind) {
    var m = $('#cp-msg'); if (!m) return;
    m.textContent = text || ''; m.className = 'cp-msg' + (text ? ' show ' + kind : '');
  }

  function enhance() {
    var input = $('#cp-file');
    if (!input || input.getAttribute('data-rp')) return;
    input.setAttribute('data-rp', '1'); input.multiple = true;
    var lab = body().querySelector('label[for="cp-file"]'); if (lab) lab.textContent = 'PDF files (you can pick many)';
    var help = input.nextElementSibling; if (help && help.className === 'cp-help') help.textContent = 'PDF only, up to 50MB each. Hold and select several files to send them together.';
    var box = document.createElement('div'); box.id = 'rp-box'; input.insertAdjacentElement('afterend', box);
    if (help) box.insertAdjacentElement('afterend', help);

    input.addEventListener('change', async function () {
      if (busy) return;
      var files = Array.prototype.slice.call(input.files || []);
      if (files.length < 2) { rows = []; paintRows(); return; }   // normal single-file page takes over
      msg('', '');
      var next = [];
      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        next.push({ file: f, title: niceTitle(f.name), problem: await checkOne(f) });
      }
      rows = next; setSingle(false); paintRows();
    });

    var form = $('#cp-form');
    form.addEventListener('submit', function (e) {
      if (rows.length < 2 || busy) { if (busy) { e.preventDefault(); e.stopImmediatePropagation(); } return; }
      e.preventDefault(); e.stopImmediatePropagation();
      sendAll();
    }, true);
  }

  async function sendAll() {
    var courseSel = $('#cp-course'); var courseId = courseSel && courseSel.value;
    var typeEl = $('input[name="cp-type"]:checked'); var type = typeEl && typeEl.value;
    var topic = ($('#cp-topic').value || '').replace(/\s+/g, ' ').trim();
    var note = ($('#cp-note').value || '').trim();
    if (!courseId) return msg('Choose the course these files belong to.', 'bad');
    var isNew = courseId === '__new', newLevelId = '', newCode = '', newTitle = '';
    if (isNew) {
      newLevelId = $('#cp-newlevel').value; newCode = $('#cp-newcode').value.replace(/\s+/g, ' ').trim(); newTitle = $('#cp-newtitle').value.replace(/\s+/g, ' ').trim();
      if (!newLevelId) return msg('Choose the level of your course.', 'bad');
      if (newCode.length < 2) return msg('Type the course code, for example AGE201.', 'bad');
      if (newTitle.length < 3) return msg('Type the course name.', 'bad');
    }
    rows.forEach(function (r) { r.title = String(r.title || '').replace(/\s+/g, ' ').trim(); r.error = ''; });
    var todo = rows.filter(function (r) { return !r.done; });
    var bad = todo.filter(function (r) { return r.problem; });
    if (bad.length) return msg('Remove the files marked in red, then send again (' + bad[0].file.name + ': ' + bad[0].problem + ')', 'bad');
    var short = todo.filter(function (r) { return r.title.length < 3; });
    if (short.length) { short[0].error = 'Give this file a title (3 letters or more).'; paintRows(); return msg('Every file needs a title of at least 3 letters.', 'bad'); }

    // room check, so nothing is half-sent
    var info = await call({ action: 'info' });
    if (!info.ok) return msg(why(info, 'Could not check your link.'), 'bad');
    var room = Math.min(Number(info.data.remaining) || 0, MAX_PENDING_AT_ONCE - (Number(info.data.pending) || 0));
    if (todo.length > room) {
      return msg(room > 0 ? 'You can send ' + room + ' more file' + (room === 1 ? '' : 's') + ' right now. Remove ' + (todo.length - room) + ' and send again.' :
        'No room right now. Wait for AET to review your waiting files, or ask for a new link.', 'bad');
    }

    busy = true; setFormDisabled(true); paintRows();
    var bar = document.getElementById('rp-bar'); if (bar) bar.hidden = false;
    var sent = [], failed = [];
    for (var n = 0; n < todo.length; n++) {
      var r = todo[n];
      msg('Sending ' + (n + 1) + ' of ' + todo.length + ': ' + r.file.name + '. Keep this page open.', 'info');
      setBar(n / todo.length);
      var out = await sendOne(r, { courseId: courseId, isNew: isNew, newLevelId: newLevelId, newCode: newCode, newTitle: newTitle, type: type, topic: topic, note: note });
      if (out === '') { r.done = true; sent.push(r); } else { r.error = out; failed.push(r); }
      paintRows(); var b2 = document.getElementById('rp-bar'); if (b2) b2.hidden = false; setBar((n + 1) / todo.length);
    }
    busy = false; setFormDisabled(false);
    var left = await call({ action: 'info' });
    if (left.ok) { var el = document.getElementById('cp-left'); if (el) el.textContent = Math.max(0, left.data.remaining) + ' of ' + left.data.maxUploads; }
    var sum = document.createElement('div'); sum.className = 'rp-sum ' + (failed.length ? '' : 'good');
    sum.innerHTML = '<strong>' + sent.length + ' of ' + todo.length + ' files sent for review.</strong> AET checks every file before students see it.' +
      (failed.length ? '<ul>' + failed.map(function (f) { return '<li>' + esc(f.file.name) + ': ' + esc(f.error) + '</li>'; }).join('') + '</ul><div style="margin-top:6px">Fix or remove the red files, then tap send again. Files already sent will not be sent twice.</div>' : '');
    var old = document.getElementById('rp-sum'); if (old) old.remove(); sum.id = 'rp-sum';
    $('#rp-box').insertAdjacentElement('beforebegin', sum);
    msg('', '');
    if (!failed.length) { rows = []; syncInput(); var inp = $('#cp-file'); if (inp) inp.value = ''; setTimeout(function () { var bx = $('#rp-box'); if (bx) bx.innerHTML = ''; setSingle(true); var s = $('#cp-send'); if (s) s.textContent = 'Send for review'; }, 2500); }
    else { var s2 = $('#cp-send'); if (s2) s2.textContent = 'Send ' + failed.length + ' file' + (failed.length === 1 ? '' : 's') + ' again'; }
  }

  function setBar(f) { var i = document.querySelector('#rp-bar i'); if (i) i.style.width = Math.round(f * 100) + '%'; }
  function setFormDisabled(d) {
    var b = body(); if (!b) return;
    b.querySelectorAll('#cp-form input, #cp-form select, #cp-form textarea, #cp-form button').forEach(function (el) { el.disabled = d; });
  }

  async function sendOne(r, o) {
    var payload = o.isNew
      ? { action: 'start', courseId: 'new', newCode: o.newCode, newTitle: o.newTitle, newLevelId: o.newLevelId, title: r.title, type: o.type, topic: o.topic, note: o.note, fileName: r.file.name, size: r.file.size }
      : { action: 'start', courseId: o.courseId, title: r.title, type: o.type, topic: o.topic, note: o.note, fileName: r.file.name, size: r.file.size };
    var started = await call(payload);
    if (!started.ok) return why(started, 'Could not start the upload.');
    var up;
    try { up = await supabaseClient.storage.from('pending-uploads').uploadToSignedUrl(started.data.path, started.data.uploadToken, r.file, { contentType: 'application/pdf' }); }
    catch (e) { up = { error: e }; }
    if (up.error) { await call({ action: 'cancel', uploadId: started.data.uploadId }); return 'The upload did not go through.'; }
    var fin = await call({ action: 'finish', uploadId: started.data.uploadId });
    for (var a = 0; a < 2 && (fin.status === 0 || fin.status >= 500); a++) { await sleep(1500); fin = await call({ action: 'finish', uploadId: started.data.uploadId }); }
    if (fin.status === 0 || fin.status >= 500) return 'Uploaded, but could not be confirmed. Check with AET before sending it again.';
    if (!fin.ok) { if (fin.status === 409) await call({ action: 'cancel', uploadId: started.data.uploadId }); return why(fin, 'The file was not accepted.'); }
    return '';
  }

  // The page rebuilds its form after each single upload, so look again whenever it changes.
  function watch() {
    var b = body(); if (!b) return setTimeout(watch, 300);
    new MutationObserver(function () { enhance(); }).observe(b, { childList: true, subtree: true });
    enhance();
  }
  watch();

  // "Your files": what this link sent, with status, reject reason and student reports.
  var mineTimer = null, mineSig = '';
  function esc2(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ago2(iso) { var m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); if (m < 60) return 'just now'; var h = Math.round(m / 60); if (h < 24) return h + 'h ago'; return Math.round(h / 24) + 'd ago'; }
  async function showMine() {
    var b = body(); if (!b || busy) return;
    var r = await call({ action: 'mine' }); if (!r.ok || !r.data || !r.data.items) return;
    var items = r.data.items;
    var sig = JSON.stringify(items.map(function (i) { return [i.title, i.status, i.reports]; }));
    var old = document.getElementById('rp-mine');
    if (old && sig === mineSig) return;
    mineSig = sig; if (old) old.remove();
    if (!items.length) return;
    if (!document.getElementById('rp-mine-css')) {
      var st2 = document.createElement('style'); st2.id = 'rp-mine-css';
      st2.textContent = '#rp-mine{margin:22px 0 0;padding:16px;border:1px solid #e5e7eb;border-radius:14px;background:#fff}#rp-mine h3{margin:0 0 10px;font-size:16px}.rm-i{padding:9px 0;border-top:1px solid #eef0f5;font-size:14px}.rm-i:first-of-type{border-top:0}.rm-t{font-weight:700;overflow-wrap:anywhere}.rm-s{font-size:12.5px;margin-top:3px;color:#6b7280}.rm-p{display:inline-block;border-radius:99px;padding:2px 9px;font-weight:800;font-size:12px;margin-right:6px}.rm-p.pending{background:#fff4d6;color:#8a5a00}.rm-p.approved{background:#eaf8ef;color:#12733a}.rm-p.rejected{background:#fdeaea;color:#b42323}.rm-f{color:#b45309;font-weight:700}';
      document.head.appendChild(st2);
    }
    var label = { pending: 'Waiting', approved: 'Published', rejected: 'Not accepted' };
    var box = document.createElement('div'); box.id = 'rp-mine';
    box.innerHTML = '<h3>Your files</h3>' + items.slice(0, 30).map(function (i) {
      return '<div class="rm-i"><div class="rm-t">' + esc2(i.code ? i.code + ' · ' : '') + esc2(i.title) + '</div><div class="rm-s"><span class="rm-p ' + esc2(i.status) + '">' + label[i.status] + '</span>' + ago2(i.createdAt) +
        (i.status === 'rejected' && i.reason ? '<div>Reason: ' + esc2(i.reason) + '</div>' : '') +
        (i.reports ? '<div class="rm-f">' + i.reports + ' student' + (i.reports === 1 ? '' : 's') + ' reported a problem with this file. Check it and send a corrected one.</div>' : '') + '</div></div>';
    }).join('');
    b.appendChild(box);
  }
  setTimeout(showMine, 1500);
  mineTimer = setInterval(showMine, 20000);
})();