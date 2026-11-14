/* AET Learning Hub: "Report a problem" on each file (students)
   Separate file. index.html is not changed.
   A small flag icon on every study material / past question card. It opens a short sheet,
   no login. The report goes to the Reports tab in the admin.
   Needs: 33-reports.sql run once, and the updated hub-extras function. */
(function () {
  'use strict';
  if (window.__aetReport) return; window.__aetReport = true;
  if (new URLSearchParams(location.search).get('admin') === '1') return;

  var FN = ((typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : '') + '/functions/v1/hub-extras';
  var FLAG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 21V4"/><path d="M5 4h11l-1.8 3.5L16 11H5"/></svg>';
  var REASONS = [
    ['wrong_file', 'Wrong file', 'It is not what the title says'],
    ['wrong_course', 'Wrong course', 'It belongs to a different course'],
    ['cant_open', "Can't open it", 'Blank, broken or unreadable'],
    ['outdated', 'Out of date', 'There is a newer version'],
    ['other', 'Something else', 'Tell us below']
  ];

  var css = [
    '.ar-flag{display:inline-flex;align-items:center;justify-content:center}',
    '.ar-flag.done{color:#12733a;background:#eaf8ef;border-color:#bfe8cd}',
    '.ar-back{position:fixed;inset:0;z-index:9600;background:rgba(5,7,71,.55);display:flex;align-items:flex-end;justify-content:center}',
    '.ar-sheet{background:#fff;color:#11152b;width:100%;max-width:440px;border-radius:20px 20px 0 0;padding:16px 16px 20px;max-height:92vh;overflow:auto;box-shadow:0 -10px 40px rgba(0,0,0,.3);font-family:inherit;animation:arUp .18s ease-out}',
    '@keyframes arUp{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}',
    '@media(min-width:600px){.ar-back{align-items:center}.ar-sheet{border-radius:20px}}',
    '.ar-sheet h3{margin:0 0 2px;font-size:18px}',
    '.ar-file{margin:0 0 12px;font-size:13px;color:#5b6075;overflow-wrap:anywhere}',
    '.ar-opt{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1.5px solid #dfe3f3;border-radius:12px;margin-bottom:8px;cursor:pointer}',
    '.ar-opt input{margin-top:3px;accent-color:#080b63}',
    '.ar-opt b{display:block;font-size:14px}.ar-opt small{display:block;font-size:12px;color:#6d7185}',
    '.ar-opt.on{border-color:#080b63;background:#f3f5ff}',
    '.ar-sheet textarea{width:100%;box-sizing:border-box;border:1.5px solid #cfd3e6;border-radius:12px;padding:10px 12px;font:inherit;font-size:14px;margin-top:4px;resize:vertical}',
    '.ar-sheet label.ar-l{display:block;font-size:12.5px;font-weight:800;margin:10px 0 2px}',
    '.ar-acts{display:flex;gap:8px;margin-top:12px}',
    '.ar-acts button{flex:1;border:0;border-radius:12px;padding:13px;font:inherit;font-weight:800;font-size:15px;cursor:pointer}',
    '.ar-send{background:#ffd21c;color:#050747}.ar-cancel{background:#eef0f9;color:#080b63}',
    '.ar-acts button:disabled{opacity:.6;cursor:progress}',
    '.ar-err{color:#b42323;font-size:13px;font-weight:700;margin:8px 0 0}',
    '.ar-ok{text-align:center;padding:14px 4px 6px}.ar-ok b{display:block;font-size:17px;margin-bottom:4px}.ar-ok span{font-size:14px;color:#5b6075}',
    '.ar-hp{position:absolute;left:-9999px;opacity:0;height:0;overflow:hidden}'
  ].join('\n');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function ctx() {
    var p = location.hash.slice(1).split('/');
    if (p[0] === 'course' && (p[3] === 'materials' || p[3] === 'past-questions')) {
      var code = p[2]; try { code = decodeURIComponent(code); } catch (e) {}
      return { level: p[1], code: code, section: p[3] };
    }
    return null;
  }
  function seen(key) { try { return sessionStorage.getItem('ar:' + key) === '1'; } catch (e) { return false; } }
  function mark(key) { try { sessionStorage.setItem('ar:' + key, '1'); } catch (e) {} }

  function open(info, btn) {
    var key = info.code + '|' + info.title;
    var back = document.createElement('div'); back.className = 'ar-back';
    var sheet = document.createElement('div'); sheet.className = 'ar-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'ar-t');
    var chosen = '';
    sheet.innerHTML = '<h3 id="ar-t">Something wrong with this file?</h3><p class="ar-file"></p><div class="ar-list"></div>' +
      '<label class="ar-l" for="ar-note">Anything to add? <span style="font-weight:600;color:#6d7185">(optional)</span></label>' +
      '<textarea id="ar-note" rows="2" maxlength="300" placeholder="e.g. Page 4 is blank"></textarea>' +
      '<div class="ar-hp" aria-hidden="true"><input type="text" tabindex="-1" autocomplete="off" name="website"></div>' +
      '<div class="ar-err" hidden></div><div class="ar-acts"><button type="button" class="ar-cancel">Cancel</button><button type="button" class="ar-send">Send report</button></div>';
    sheet.querySelector('.ar-file').textContent = info.code + ' · ' + info.title;
    var list = sheet.querySelector('.ar-list');
    REASONS.forEach(function (r) {
      var l = document.createElement('label'); l.className = 'ar-opt';
      l.innerHTML = '<input type="radio" name="ar-r" value="' + r[0] + '"><span><b>' + r[1] + '</b><small>' + r[2] + '</small></span>';
      l.querySelector('input').addEventListener('change', function () {
        chosen = r[0]; list.querySelectorAll('.ar-opt').forEach(function (o) { o.classList.remove('on'); }); l.classList.add('on'); err('');
      });
      list.appendChild(l);
    });
    var errEl = sheet.querySelector('.ar-err');
    function err(t) { errEl.textContent = t; errEl.hidden = !t; }
    function close() { if (back.parentNode) back.parentNode.removeChild(back); document.removeEventListener('keydown', onKey); if (btn) try { btn.focus(); } catch (e) {} }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    sheet.querySelector('.ar-cancel').addEventListener('click', close);
    var send = sheet.querySelector('.ar-send');
    send.addEventListener('click', async function () {
      if (!chosen) return err('Choose what is wrong.');
      send.disabled = true; send.textContent = 'Sending...'; err('');
      try {
        var res = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          action: 'report_submit', course_code: info.code, level: info.level, section: info.section, resource_title: info.title,
          file_url: info.url, reason: chosen, note: sheet.querySelector('#ar-note').value.trim(), website: sheet.querySelector('.ar-hp input').value
        }) });
        var data = null; try { data = await res.json(); } catch (e) {}
        if (!res.ok) throw new Error((data && data.error) || 'Something went wrong. Please try again.');
        mark(key); if (btn) { btn.classList.add('done'); btn.title = 'Reported'; }
        try { if (typeof window.aetTrack === 'function') window.aetTrack('report-sent'); } catch (e) {}
        sheet.innerHTML = '<div class="ar-ok"><b>Thank you</b><span>AET will check this file and fix it.</span></div><div class="ar-acts"><button type="button" class="ar-cancel">Close</button></div>';
        sheet.querySelector('.ar-cancel').addEventListener('click', close);
        setTimeout(close, 2600);
      } catch (e) {
        err(e && e.message ? (e.message === 'Failed to fetch' ? 'Could not reach the server. Check your internet connection.' : e.message) : 'Something went wrong.');
        send.disabled = false; send.textContent = 'Send report';
      }
    });
    back.appendChild(sheet); document.body.appendChild(back);
  }

  function decorate() {
    var app = document.getElementById('app-view'); var c = ctx();
    if (!app || !c) return;
    [].forEach.call(app.querySelectorAll('.academic-resource-card'), function (card) {
      var box = card.querySelector('.academic-resource-buttons'); var tEl = card.querySelector('.academic-resource-title');
      if (!box || !tEl || box.querySelector('.ar-flag')) return;
      var title = tEl.textContent.replace(/\s+/g, ' ').trim();
      var open1 = card.querySelector('a[data-track="open-pdf"]');
      var info = { code: c.code, level: c.level, section: c.section, title: title, url: open1 ? open1.href : '' };
      var b = document.createElement('button'); b.type = 'button'; b.className = 'rp-btn rp-btn-secondary ar-flag';
      b.setAttribute('aria-label', 'Report a problem with ' + title); b.title = 'Report a problem'; b.innerHTML = FLAG;
      if (seen(info.code + '|' + info.title)) { b.classList.add('done'); b.title = 'Reported'; }
      b.addEventListener('click', function () { open(info, b); });
      box.appendChild(b);
    });
  }

  function init() {
    var app = document.getElementById('app-view');
    if (app) new MutationObserver(decorate).observe(app, { childList: true, subtree: true });
    window.addEventListener('hashchange', decorate);
    decorate();
    var n = 0, t = setInterval(function () { decorate(); if (++n > 20) clearInterval(t); }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();