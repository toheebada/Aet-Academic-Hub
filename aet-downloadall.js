/* AET Learning Hub: "Download all" icon on a course's Study Material and Past Questions pages.
   Downloads every file as a normal PDF, one after another. No zip. index.html untouched. */
(function () {
  'use strict';
  if (window.__aetDownloadAll) return; window.__aetDownloadAll = true;
  var GAP = 1100; // ms between files, so phones do not skip any
  var busy = false, cancelled = false;

  var css = [
    '#app-view .view-header.da-host{position:relative;overflow:visible;padding-right:76px}',
    '#app-view .view-header.da-host::before{border-radius:var(--radius,14px) 0 0 var(--radius,14px)}',
    '.da-btn{position:absolute;right:16px;top:16px;width:46px;height:46px;border-radius:50%;border:1.5px solid #cfd3e6;background:#fff;color:#080b63;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;box-shadow:0 2px 6px rgba(8,11,99,.08);transition:background .15s,color .15s,transform .1s}',
    '.da-btn:hover{border-color:#080b63}.da-btn:active{transform:scale(.95)}',
    '.da-btn:focus-visible{outline:3px solid #ffd21c;outline-offset:2px}',
    '.da-btn.on{background:#080b63;color:#fff;border-color:#080b63}',
    '.da-n{position:absolute;top:-6px;right:-6px;min-width:21px;height:21px;border-radius:11px;background:#ffd21c;color:#050747;font-size:11.5px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fff;line-height:1}',
    '.da-ring{position:absolute;inset:-4px;width:54px;height:54px;transform:rotate(-90deg);display:none;pointer-events:none}',
    '.da-btn.run .da-ring{display:block}.da-btn.run .da-n{display:none}',
    '.da-ring circle{fill:none;stroke-width:3}.da-ring .bg{stroke:#e6e9f6}.da-ring .fg{stroke:#ffd21c;stroke-linecap:round;stroke-dasharray:151;stroke-dashoffset:151;transition:stroke-dashoffset .35s}',
    '.da-pop{position:absolute;right:12px;top:72px;z-index:30;width:min(280px,calc(100vw - 32px));background:#fff;border:1px solid #dfe3f3;border-radius:14px;padding:14px;box-shadow:0 14px 34px rgba(8,11,99,.2);font-family:inherit;color:#11152b}',
    '.da-pop:before{content:"";position:absolute;right:24px;top:-7px;width:12px;height:12px;background:#fff;border-left:1px solid #dfe3f3;border-top:1px solid #dfe3f3;transform:rotate(45deg)}',
    '.da-pop[hidden]{display:none}.da-pop b{display:block;font-size:15px}.da-pop p{margin:4px 0 12px;font-size:13px;color:#5b6075;line-height:1.4}',
    '.da-row{display:flex;gap:8px}.da-row button{flex:1;border:0;border-radius:10px;padding:10px;font:inherit;font-weight:800;font-size:13.5px;cursor:pointer}',
    '.da-go{background:#080b63;color:#fff}.da-no{background:#eef0f9;color:#080b63}',
    '.da-status{display:none;margin:0 0 14px;background:#111827;color:#fff;border-radius:12px;padding:11px 14px;font-size:13.5px;font-weight:700}',
    '.da-status.show{display:block}.da-status small{display:block;font-weight:500;color:#c9cde0;margin-top:2px;font-size:12px}',
    '.da-status.ok{background:#12733a}',
    '@media(prefers-reduced-motion:reduce){.da-ring .fg,.da-btn{transition:none}}'
  ].join('\n');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></svg>';
  var RING = '<svg class="da-ring" viewBox="0 0 52 52" aria-hidden="true"><circle class="bg" cx="26" cy="26" r="24"/><circle class="fg" cx="26" cy="26" r="24"/></svg>';

  function onCoursePage() {
    var p = location.hash.slice(1).split('/');
    return p[0] === 'course' && (p[3] === 'materials' || p[3] === 'past-questions');
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function setText(el, t) { if (el && el.textContent !== t) el.textContent = t; }

  function files(app) {
    var out = [], seen = {};
    [].forEach.call(app.querySelectorAll('.academic-resource-card'), function (card) {
      var a = card.querySelector('a[data-track="download-pdf"]'); if (!a || !a.href || seen[a.href]) return;
      seen[a.href] = 1; out.push(a.href);
    });
    return out;
  }

  function ui(head) {
    var s = head._da; if (s) return s;
    head.classList.add('da-host');
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'da-btn';
    btn.title = 'Download all'; btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = RING + ICON + '<span class="da-n"></span>';
    var pop = document.createElement('div'); pop.className = 'da-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Download all files');
    pop.innerHTML = '<b></b><p>Each file downloads as a normal PDF. If your phone asks, tap Allow.</p><div class="da-row"><button type="button" class="da-no">Cancel</button><button type="button" class="da-go">Download</button></div>';
    var status = document.createElement('div'); status.className = 'da-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    head.appendChild(btn); head.appendChild(pop);
    head.parentNode.insertBefore(status, head.nextSibling);
    s = head._da = { btn: btn, pop: pop, status: status, n: btn.querySelector('.da-n'), fg: btn.querySelector('.fg'), list: [] };

    function close() { pop.hidden = true; btn.classList.remove('on'); btn.setAttribute('aria-expanded', 'false'); }
    function open() { pop.hidden = false; btn.classList.add('on'); btn.setAttribute('aria-expanded', 'true'); pop.querySelector('.da-go').focus(); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (busy) { if (window.confirm('Stop downloading the rest?')) cancelled = true; return; }
      pop.hidden ? open() : close();
    });
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
    pop.querySelector('.da-no').addEventListener('click', function () { close(); btn.focus(); });
    pop.querySelector('.da-go').addEventListener('click', function () { close(); run(s); });
    document.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { close(); btn.focus(); } });
    return s;
  }

  async function run(s) {
    if (busy) return; busy = true; cancelled = false;
    var list = s.list.slice(), total = list.length;
    s.btn.classList.add('run'); s.btn.classList.remove('on'); s.btn.title = 'Tap to stop';
    s.status.classList.remove('ok'); s.status.classList.add('show');
    try { if (window.aetTrack) window.aetTrack('download-all'); } catch (e) {}
    var done = 0;
    for (var i = 0; i < total && !cancelled; i++) {
      s.status.innerHTML = '';
      s.status.appendChild(document.createTextNode('Downloading ' + (i + 1) + ' of ' + total));
      var sm = document.createElement('small'); sm.textContent = 'Keep this page open. Tap the icon to stop.'; s.status.appendChild(sm);
      s.fg.style.strokeDashoffset = String(151 - Math.round(151 * (i / total)));
      var a = document.createElement('a'); a.href = list[i]; a.download = ''; a.rel = 'noopener'; a.style.display = 'none';
      document.body.appendChild(a); a.click(); setTimeout((function (x) { return function () { x.remove(); }; })(a), 2000);
      done++; await sleep(GAP);
    }
    s.fg.style.strokeDashoffset = cancelled ? String(151 - Math.round(151 * (done / total))) : '0';
    await sleep(350);
    s.btn.classList.remove('run'); s.btn.title = 'Download all';
    s.status.classList.add('ok');
    s.status.innerHTML = '';
    s.status.appendChild(document.createTextNode(cancelled ? 'Stopped after ' + done + ' of ' + total : done + ' files downloaded'));
    var sm2 = document.createElement('small'); sm2.textContent = 'Check your Downloads or Files app. If some are missing, tap the icon and try again.'; s.status.appendChild(sm2);
    busy = false;
    setTimeout(function () { if (!busy) s.status.classList.remove('show'); }, 9000);
  }

  function decorate() {
    var app = document.getElementById('app-view'); if (!app) return;
    var head = app.querySelector('.view-header');
    if (!onCoursePage() || !head) return;
    var list = files(app);
    if (list.length < 2) { if (head._da && !busy) { head._da.btn.style.display = 'none'; } return; }
    var s = ui(head); s.list = list; s.btn.style.display = '';
    setText(s.n, String(list.length));
    setText(s.pop.querySelector('b'), 'Download all ' + list.length + ' files?');
    var label = 'Download all ' + list.length + ' files';
    if (s.btn.getAttribute('aria-label') !== label) s.btn.setAttribute('aria-label', label);
  }

  function init() {
    var app = document.getElementById('app-view');
    if (app) new MutationObserver(function () { decorate(); }).observe(app, { childList: true, subtree: true });
    window.addEventListener('hashchange', function () { cancelled = true; decorate(); });
    decorate();
    var n = 0, tm = setInterval(function () { decorate(); if (++n > 20) clearInterval(tm); }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();