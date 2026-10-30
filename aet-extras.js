/* ============================================================
   AET Learning Hub: extras (Notices, Tutorials card, Request a material)
   One file. index.html only needs this line above </body>:
     <script src="aet-extras.js" defer></script>
   Nothing shows on the site until you post something in the admin page.
   ============================================================ */
(function () {
  'use strict';
  if (window.__aetExtras) return;
  window.__aetExtras = true;

  var sb = (typeof supabaseClient !== 'undefined') ? supabaseClient : null;
  var BASE = (typeof SUPABASE_URL !== 'undefined') ? SUPABASE_URL : '';
  var FN = BASE + '/functions/v1/hub-extras';
  var NOTES_BUCKET = 'academic-resources';
  var IS_ADMIN = new URLSearchParams(location.search).get('admin') === '1';
  if (!sb || !BASE) return;

  // ---------- small helpers ----------
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    function add(c) {
      if (c == null || c === false) return;
      if (Array.isArray(c)) { c.forEach(add); return; }
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    for (var i = 2; i < arguments.length; i++) add(arguments[i]);
    return el;
  }
  var TZ = 'Africa/Lagos';
  function fmtDay(d) { return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: TZ }).format(new Date(d)); }
  function fmtWhen(d) {
    var date = new Date(d);
    var wd = new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: TZ }).format(date);
    var tm = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ }).format(date);
    return wd + ' ' + fmtDay(date) + ' · ' + tm;
  }
  function isHttps(u) { return typeof u === 'string' && /^https:\/\/\S+$/i.test(u); }
  function notesUrl(path) {
    try { return sb.storage.from(NOTES_BUCKET).getPublicUrl(path).data.publicUrl; } catch (e) { return ''; }
  }

  // ---------- styles ----------
  var css = [
    '.ax-home{max-width:1100px;margin:0 auto;padding:22px 18px 4px}',
    '.ax-home[hidden]{display:none}',
    '.ax-tuts{display:grid;gap:12px;grid-template-columns:1fr}',
    '@media(min-width:760px){.ax-tuts{grid-template-columns:1fr 1fr}}',
    '.ax-tut{background:linear-gradient(160deg,#050747,#12167f);color:#fff;border-radius:18px;padding:16px;box-shadow:0 12px 35px rgba(8,11,99,.12)}',
    '.ax-k{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#aab0ff;font-weight:700}',
    '.ax-tut h3{font-size:19px;margin:6px 0 4px;color:#fff}',
    '.ax-when{color:#ffd21c;font-weight:800;font-size:14px}',
    '.ax-where{font-size:13px;color:#dde0ff;margin:4px 0 12px;line-height:1.45}',
    '.ax-tut .ax-note{font-size:13px;color:#dde0ff;margin:0 0 12px;line-height:1.45}',
    '.ax-btn{display:inline-block;text-align:center;font-weight:800;font-size:14px;padding:12px 18px;border-radius:12px;border:0;cursor:pointer;text-decoration:none;font-family:inherit;line-height:1.2}',
    '.ax-btn.y{background:#ffd21c;color:#050747}',
    '.ax-btn.n{background:#080b63;color:#fff}',
    '.ax-btn.g{background:#eef0f7;color:#454a63}',
    '.ax-btn.red{background:#fff;color:#b91c1c;border:1px solid #f3c4c4}',
    '.ax-btn.sm{padding:8px 12px;font-size:13px;border-radius:9px}',
    '.ax-btn:disabled{opacity:.6;cursor:progress}',
    '.ax-btn:focus-visible,.ax-x:focus-visible{outline:3px solid #ffd21c;outline-offset:2px}',
    '.ax-past{margin-top:12px;border-top:1px solid #2a2f9a;padding-top:10px;font-size:13px;color:#dde0ff}',
    '.ax-past a{color:#ffd21c;font-weight:800}',
    '.ax-h2{font-size:21px;margin:18px 0 4px;color:#11152b}',
    '.ax-lead{font-size:14px;color:#6d7185;margin:0 0 12px;line-height:1.5}',
    '.ax-notice{background:#fff;border:1px solid #e7e9f1;border-radius:16px;padding:14px;box-shadow:0 12px 35px rgba(8,11,99,.06)}',
    '.ax-notice+.ax-notice{margin-top:10px}',
    '.ax-nc{background:#fff;border:1px solid #e7e9f1;border-radius:18px;padding:16px;box-shadow:0 12px 35px rgba(8,11,99,.06)}',
    '.ax-nh{font-size:18px;margin:0 0 2px;color:#080b63}',
    '.ax-nc .ax-lead{font-size:12px;margin:0 0 4px}',
    '.ax-nc .ax-notice{background:none;border:0;border-top:1px solid #e7e9f1;border-radius:0;box-shadow:none;padding:12px 0 2px;margin-top:10px}',
    '.ax-nsrc{font-size:10px;letter-spacing:.06em;color:#6d7185;font-weight:700;text-transform:uppercase}',
    '.ax-nbody{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.ax-ntitle{font-weight:800;font-size:15px;margin:7px 0 3px;color:#11152b}',
    '.ax-nbody{font-size:13.5px;color:#454a63;line-height:1.5}',
    '.ax-nmeta{font-size:12px;color:#6d7185;margin-top:8px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}',
    '.ax-nmeta a{color:#080b63;font-weight:700;text-decoration:underline}',
    '.ax-chip{display:inline-block;font-size:11px;font-weight:800;padding:3px 9px;border-radius:99px;letter-spacing:.2px}',
    '.ax-chip.open,.ax-chip.done,.ax-chip.online{background:#e3f8ea;color:#12733a}',
    '.ax-chip.closing_soon,.ax-chip.in_progress{background:#fff7cc;color:#7a5b00}',
    '.ax-chip.closed{background:#eceef5;color:#5b6078}',
    '.ax-chip.new,.ax-chip.physical{background:#e5e8ff;color:#080b63}',
    /* request box + modal */
    '.ax-req{background:#fff7cc;border:1px solid #f1dc7a;border-radius:16px;padding:14px;margin:16px 0 8px}',
    '.ax-req b{font-size:15px;color:#11152b}.ax-req p{font-size:13px;color:#5b4a00;margin:4px 0 10px;line-height:1.45}',
    '.ax-ov{position:fixed;inset:0;z-index:9000;background:rgba(5,7,71,.55);display:flex;align-items:flex-start;justify-content:center;padding:70px 16px 16px;overflow:auto}',
    '.ax-modal{background:#fff;border-radius:18px;padding:16px 16px 18px;width:100%;max-width:380px;box-shadow:0 20px 50px rgba(0,0,0,.35);color:#11152b;font-family:inherit}',
    '.ax-mh{display:flex;align-items:center;margin-bottom:2px}.ax-mh b{font-size:17px}',
    '.ax-x{margin-left:auto;width:36px;height:36px;border-radius:50%;background:#eef0f7;border:0;font-size:20px;font-weight:800;color:#454a63;cursor:pointer;line-height:1}',
    '.ax-ms{font-size:12.5px;color:#6d7185;margin-bottom:4px}',
    '.ax-modal label,.ax-form label{display:block;font-size:12.5px;font-weight:800;margin:12px 0 5px}',
    '.ax-opt{font-weight:400;color:#6d7185}',
    '.ax-in{width:100%;box-sizing:border-box;background:#fff;border:1px solid #cfd3e6;border-radius:10px;padding:10px 11px;font:inherit;font-size:14px;color:#11152b;min-height:40px}',
    'textarea.ax-in{min-height:64px;resize:vertical;line-height:1.45}',
    '.ax-seg{display:flex;gap:8px;flex-wrap:wrap}',
    '.ax-seg label{margin:0;font-size:13px;font-weight:700;border:1.5px solid #cfd3e6;border-radius:99px;padding:7px 12px;background:#fff;cursor:pointer;display:inline-block}',
    '.ax-seg input{position:absolute;opacity:0;pointer-events:none}',
    '.ax-seg input:checked+span{color:#fff}',
    '.ax-seg label.on{background:#080b63;border-color:#080b63;color:#fff}',
    '.ax-seg label:focus-within{outline:3px solid #ffd21c;outline-offset:2px}',
    '.ax-link{background:none;border:0;padding:0;color:#080b63;font:inherit;font-size:12.5px;font-weight:700;text-decoration:underline;cursor:pointer;margin-top:8px}',
    '.ax-mb{display:flex;gap:8px;margin-top:14px}.ax-mb .ax-btn{flex:1}.ax-mb .ax-btn.g{flex:.6}',
    '.ax-err{color:#b91c1c;font-size:13px;margin-top:10px;font-weight:700;line-height:1.4}',
    '.ax-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
    '.ax-ok{width:56px;height:56px;border-radius:50%;background:#e3f8ea;color:#12733a;display:grid;place-items:center;font-size:28px;font-weight:800;margin:6px auto 10px}',
    '.ax-center{text-align:center}',
    '.ax-fine{font-size:11.5px;color:#6d7185;margin-top:5px;line-height:1.4}'
  ].join('\n');
  document.head.appendChild(h('style', { id: 'ax-style', text: css }));

  // ============================================================
  // STUDENT SIDE
  // ============================================================
  var live = { notices: [], sessions: [] };
  var homeBox = null;

  async function loadLive() {
    try {
      var r = await Promise.all([
        sb.from('hub_notices').select('*').order('ends_at', { ascending: true }),
        sb.from('hub_sessions').select('*').order('starts_at', { ascending: true })
      ]);
      live.notices = (r[0] && !r[0].error && r[0].data) || [];
      live.sessions = (r[1] && !r[1].error && r[1].data) || [];
    } catch (e) { live.notices = []; live.sessions = []; }
  }

  function tutorialCard(s, notesSession) {
    var card = h('div', { class: 'ax-tut' },
      h('div', { class: 'ax-k', text: 'AET Tutorial · ' + (s.mode === 'physical' ? 'Physical' : 'Online') }),
      h('h3', { text: s.title }),
      h('div', { class: 'ax-when', text: fmtWhen(s.starts_at) }),
      h('div', { class: 'ax-where', text: s.mode === 'physical' ? '📍 Venue: ' + (s.venue || '') : 'Held online' })
    );
    if (s.note) card.appendChild(h('p', { class: 'ax-note', text: s.note }));
    if (s.mode === 'online' && isHttps(s.join_link)) {
      card.appendChild(h('a', { class: 'ax-btn y', href: s.join_link, target: '_blank', rel: 'noopener noreferrer', text: 'Join the class' }));
    }
    var own = s.notes_path ? s : null;
    if (own) {
      card.appendChild(h('div', { class: 'ax-past' }, 'Notes for this session: ', h('a', { href: notesUrl(own.notes_path), target: '_blank', rel: 'noopener noreferrer', text: 'Download (PDF) →' })));
    } else if (notesSession) {
      card.appendChild(h('div', { class: 'ax-past' }, 'Last session notes: ', h('a', { href: notesUrl(notesSession.notes_path), target: '_blank', rel: 'noopener noreferrer', text: notesSession.title + ' (PDF) →' })));
    }
    return card;
  }

  function notesOnlyCard(s) {
    return h('div', { class: 'ax-tut' },
      h('div', { class: 'ax-k', text: 'AET Tutorial · Notes' }),
      h('h3', { text: s.title }),
      h('div', { class: 'ax-where', text: 'Notes from the ' + fmtDay(s.starts_at) + ' session' }),
      h('a', { class: 'ax-btn y', href: notesUrl(s.notes_path), target: '_blank', rel: 'noopener noreferrer', text: 'Download notes (PDF)' })
    );
  }

  function noticeCard(n) {
    var labels = { open: 'OPEN', closing_soon: 'CLOSING SOON', closed: 'CLOSED' };
    var host = n.source;
    if (isHttps(n.source)) { try { host = new URL(n.source).hostname.replace(/^www\./, ''); } catch (e) {} }
    var src = isHttps(n.source) ? h('a', { href: n.source, target: '_blank', rel: 'noopener noreferrer', text: 'Source ↗' }) : null;
    return h('div', { class: 'ax-notice' },
      h('div', { class: 'ax-nsrc', text: host }),
      h('div', { class: 'ax-ntitle', text: n.title }),
      n.details ? h('div', { class: 'ax-nbody', text: n.details }) : null,
      h('div', { class: 'ax-nmeta' },
        h('span', { text: 'Posted ' + fmtDay(n.shows_from) + ' · until ' + fmtDay(n.ends_at) }),
        n.tag && labels[n.tag] ? h('span', { class: 'ax-chip ' + n.tag, text: labels[n.tag] }) : src)
    );
  }

  // notices: side column next to the hero when the new hero is installed, else a block above the search
  var sideBox = null;
  function placeSide(notices) {
    var side = document.getElementById('hx-side');
    var wrap = document.getElementById('hx-wrap');
    if (sideBox && sideBox.parentNode) sideBox.parentNode.removeChild(sideBox);
    sideBox = null;
    if (wrap) wrap.classList.toggle('has-side', !!notices.length);
    if (!notices.length) return;
    var card = h('div', { class: 'ax-nc', id: 'aet-notices' },
      h('h2', { class: 'ax-nh', text: '🔔 Latest notices' }),
      h('p', { class: 'ax-lead', text: 'Posted by AET. Always check the source.' }));
    notices.forEach(function (n) { card.appendChild(noticeCard(n)); });
    if (side) side.appendChild(card);
    else { var a = document.getElementById('search-section'); if (a && a.parentNode) { var w = h('section', { class: 'ax-home' }, card); a.parentNode.insertBefore(w, a); sideBox = w; return; } }
    sideBox = card;
  }

  function renderHome() {
    var anchor = document.getElementById('search-section');
    if (!anchor || !anchor.parentNode) return;
    var now = Date.now();
    var notices = live.notices.filter(function (n) { return new Date(n.shows_from).getTime() <= now && new Date(n.ends_at).getTime() > now; })
      .sort(function (a, b) { return new Date(a.ends_at) - new Date(b.ends_at); });
    var upcoming = live.sessions.filter(function (s) { return new Date(s.hide_after).getTime() > now; })
      .sort(function (a, b) { return new Date(a.starts_at) - new Date(b.starts_at); }).slice(0, 3);
    var withNotes = live.sessions.filter(function (s) { return s.notes_path && new Date(s.hide_after).getTime() <= now; })
      .sort(function (a, b) { return new Date(b.starts_at) - new Date(a.starts_at); })[0] || null;

    placeSide(notices);
    if (!upcoming.length && !withNotes) {
      if (homeBox && homeBox.parentNode) homeBox.parentNode.removeChild(homeBox);
      homeBox = null;
      return;
    }
    var box = h('section', { class: 'ax-home', id: 'aet-home-extras', 'aria-label': 'Tutorials and notices' });
    if (upcoming.length) {
      var grid = h('div', { class: 'ax-tuts' });
      upcoming.forEach(function (s, i) { grid.appendChild(tutorialCard(s, i === 0 ? withNotes : null)); });
      box.appendChild(grid);
    } else if (withNotes) {
      box.appendChild(h('div', { class: 'ax-tuts' }, notesOnlyCard(withNotes)));
    }
    if (homeBox && homeBox.parentNode) homeBox.parentNode.replaceChild(box, homeBox);
    else anchor.parentNode.insertBefore(box, anchor);
    homeBox = box;
  }

  // ---------- request a material (pop-up) ----------
  var coursesCache = null;
  async function loadCourses() {
    if (coursesCache) return coursesCache;
    try {
      var r = await sb.from('courses').select('id, code, title').order('code', { ascending: true });
      coursesCache = (r && !r.error && r.data) || [];
    } catch (e) { coursesCache = []; }
    return coursesCache;
  }
  async function courseByCode(code) {
    var list = await loadCourses();
    var hits = list.filter(function (c) { return String(c.code).toUpperCase() === String(code).toUpperCase(); });
    return hits.length === 1 ? hits[0] : null;
  }

  var modal = null;
  function closeModal(fromPop) {
    if (!modal) return;
    var m = modal; modal = null;
    document.removeEventListener('keydown', m.onKey, true);
    if (m.lastFocus && m.lastFocus.focus) { try { m.lastFocus.focus(); } catch (e) {} }
    m.ov.parentNode && m.ov.parentNode.removeChild(m.ov);
    if (!fromPop && history.state && history.state.axModal) { try { history.back(); } catch (e) {} }
  }
  window.addEventListener('popstate', function () { if (modal) closeModal(true); });

  function openRequest(opts) {
    opts = opts || {};
    if (modal) return;
    var type = 'past_question';
    var m = { lastFocus: document.activeElement };
    var typeBox = h('div', { class: 'ax-seg', role: 'radiogroup', 'aria-label': 'What do you need?' });
    [['past_question', 'Past question'], ['study_material', 'Study material'], ['other', 'Other']].forEach(function (t) {
      var inp = h('input', { type: 'radio', name: 'ax-type', value: t[0], checked: t[0] === type });
      var lab = h('label', { class: t[0] === type ? 'on' : '' }, inp, h('span', { text: t[1] }));
      inp.addEventListener('change', function () {
        type = t[0];
        Array.prototype.forEach.call(typeBox.children, function (l) { l.classList.remove('on'); });
        lab.classList.add('on');
      });
      typeBox.appendChild(lab);
    });

    var details = h('textarea', { class: 'ax-in', maxlength: '300', id: 'ax-details', placeholder: 'For example: 2019/2020 first semester past question' });
    var contact = h('input', { class: 'ax-in', type: 'tel', inputmode: 'tel', id: 'ax-contact', placeholder: '08012345678', autocomplete: 'tel', maxlength: '20' });
    var contactWrap = h('div', { hidden: true },
      h('label', { for: 'ax-contact' }, 'WhatsApp number ', h('span', { class: 'ax-opt', text: '(optional)' })), contact,
      h('div', { class: 'ax-fine', text: 'Only used to tell you when it is added. If you leave it empty, we announce new uploads on the WhatsApp channel.' }));
    var contactLink = h('button', { type: 'button', class: 'ax-link', text: '+ Add WhatsApp number (optional)', onclick: function () { contactWrap.hidden = false; contactLink.hidden = true; contact.focus(); } });
    var hp = h('div', { class: 'ax-hp', 'aria-hidden': 'true' }, h('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off' }));
    var err = h('div', { class: 'ax-err', role: 'alert', hidden: true });

    var courseSelect = null, courseText = null, courseId = opts.courseId || null;
    var courseArea = h('div');
    if (opts.courseCode) {
      courseArea.appendChild(h('div', { class: 'ax-ms', style: 'margin-top:12px', text: 'For ' + opts.courseCode + (opts.courseTitle ? ' · ' + opts.courseTitle : '') }));
    } else {
      courseSelect = h('select', { class: 'ax-in', id: 'ax-course' }, h('option', { value: '', text: 'Choose a course' }));
      courseText = h('input', { class: 'ax-in', type: 'text', maxlength: '60', placeholder: 'Course code and name', hidden: true, 'aria-label': 'Course not listed' });
      courseSelect.addEventListener('change', function () { courseText.hidden = courseSelect.value !== '__other'; });
      courseArea.appendChild(h('label', { for: 'ax-course', text: 'Course' }));
      courseArea.appendChild(courseSelect); courseArea.appendChild(courseText);
      loadCourses().then(function (list) {
        list.forEach(function (c) { courseSelect.appendChild(h('option', { value: c.id, text: c.code + ' · ' + c.title })); });
        courseSelect.appendChild(h('option', { value: '__other', text: 'My course is not listed' }));
      });
    }

    var sendBtn = h('button', { type: 'submit', class: 'ax-btn n', text: 'Send request' });
    var cancelBtn = h('button', { type: 'button', class: 'ax-btn g', text: 'Cancel', onclick: function () { closeModal(); } });
    var form = h('form', { novalidate: true, class: 'ax-form' },
      h('label', { text: 'What do you need?' }), typeBox, courseArea,
      h('label', { for: 'ax-details', text: 'Details' }), details, contactLink, contactWrap, hp, err,
      h('div', { class: 'ax-mb' }, cancelBtn, sendBtn));

    var body = h('div');
    var title = h('b', { id: 'ax-mtitle', text: 'Request a material' });
    var xBtn = h('button', { type: 'button', class: 'ax-x', 'aria-label': 'Close', text: '×', onclick: function () { closeModal(); } });
    var dlg = h('div', { class: 'ax-modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ax-mtitle' },
      h('div', { class: 'ax-mh' }, title, xBtn), body);
    body.appendChild(form);
    var ov = h('div', { class: 'ax-ov' }, dlg);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) closeModal(); });
    m.ov = ov;
    m.onKey = function (e) { if (e.key === 'Escape') { e.stopPropagation(); closeModal(); } };
    document.addEventListener('keydown', m.onKey, true);
    // The site hides most page parts on course pages, but never the footer, so the pop-up lives there.
    (document.querySelector('footer') || document.body).appendChild(ov);
    modal = m;
    try { history.pushState({ axModal: 1 }, '', location.href); } catch (e) {}
    setTimeout(function () { details.focus(); }, 30);

    function showErr(t) { err.textContent = t; err.hidden = !t; }
    form.addEventListener('submit', async function (e) {
      e.preventDefault(); showErr('');
      var d = details.value.trim();
      if (d.length < 5) { showErr('Tell us a little more about what you need.'); details.focus(); return; }
      var payload = { action: 'request_submit', req_type: type, details: d, website: hp.querySelector('input').value };
      if (opts.courseCode) {
        if (courseId) payload.course_id = courseId; else payload.course_text = opts.courseCode;
      } else if (courseSelect) {
        if (courseSelect.value === '__other') payload.course_text = courseText.value.trim();
        else if (courseSelect.value) payload.course_id = courseSelect.value;
      }
      if (!contactWrap.hidden && contact.value.trim()) payload.contact = contact.value.trim();
      sendBtn.disabled = true; sendBtn.textContent = 'Sending...';
      try {
        var res = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        var data = null; try { data = await res.json(); } catch (x) {}
        if (!res.ok) throw new Error((data && data.error) || 'Something went wrong. Please try again.');
        showDone(data || {});
      } catch (x) {
        showErr(x && x.message ? (x.message === 'Failed to fetch' ? 'Could not reach the server. Check your internet connection.' : x.message) : 'Something went wrong.');
        sendBtn.disabled = false; sendBtn.textContent = 'Send request';
      }
    });

    function showDone(data) {
      title.textContent = '';
      body.textContent = '';
      var n = data.same_count;
      var line = (typeof n === 'number' && n > 1) ? (n + ' students have asked for this one so far. ') : '';
      body.appendChild(h('div', { class: 'ax-center' },
        h('div', { class: 'ax-ok', text: '✓' }),
        h('b', { style: 'font-size:18px', text: 'Request received' }),
        h('div', { class: 'ax-ms', style: 'margin-top:6px;line-height:1.45', text: line + 'We will announce it on the WhatsApp channel when it is added.' }),
        h('div', { class: 'ax-mb' }, h('button', { type: 'button', class: 'ax-btn n', text: 'Close', onclick: function () { closeModal(); } }))));
      var closeBtn = body.querySelector('button'); if (closeBtn) closeBtn.focus();
    }
  }

  // course page box
  var courseTimer = null;
  function placeRequestBox() {
    var app = document.getElementById('app-view');
    if (!app) return;
    var mt = location.hash.match(/^#course\/([^\/]+)\/([^\/]+)(?:\/(materials|past-questions))?\/?$/);
    var existing = document.getElementById('ax-req-box');
    if (!mt) { if (existing) existing.remove(); return; }
    var section = app.querySelector('section.section');
    if (!section) return;
    var code = decodeURIComponent(mt[2]);
    if (existing && existing.dataset.code === code && section.contains(existing)) return;
    if (existing) existing.remove();
    var title = '';
    var tEl = section.querySelector('.view-sub'); if (tEl) title = tEl.textContent.trim();
    var box = h('div', { class: 'ax-req', id: 'ax-req-box', 'data-code': code },
      h('b', { text: "Can't find what you need?" }),
      h('p', { text: 'Tell us what is missing and we will try to add it.' }),
      h('button', { type: 'button', class: 'ax-btn n', style: 'width:100%', text: 'Request a material', onclick: async function () {
        var c = await courseByCode(code);
        openRequest({ courseCode: code, courseTitle: (c && c.title) || title, courseId: c ? c.id : null });
      } }));
    section.appendChild(box);
  }
  function scheduleBox() { clearTimeout(courseTimer); courseTimer = setTimeout(placeRequestBox, 60); }

  function addFooterLink() {
    var share = document.getElementById('share-site-link');
    if (!share || document.getElementById('ax-footer-req')) return;
    var a = h('a', { class: 'footer-link', href: '#', id: 'ax-footer-req', text: 'Request a material' });
    a.addEventListener('click', function (e) { e.preventDefault(); openRequest({}); });
    share.parentNode.appendChild(document.createTextNode(' · '));
    share.parentNode.appendChild(a);
  }

  async function studentInit() {
    addFooterLink();
    var app = document.getElementById('app-view');
    if (app) new MutationObserver(scheduleBox).observe(app, { childList: true });
    window.addEventListener('hashchange', scheduleBox);
    scheduleBox();
    await loadLive();
    renderHome();
    setInterval(function () { loadLive().then(renderHome); }, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) loadLive().then(renderHome); });
  }

  // ============================================================
  // ADMIN SIDE
  // ============================================================
  function adminInit() {
    var adminCss = [
      '#aet-admin-extras{display:none;max-width:1000px;margin:0 auto;padding:18px 16px 60px;font-family:inherit;color:#11152b}',
      'html.admin-mode[data-axlog]:not([data-axtabs]) body > #aet-admin-extras#aet-admin-extras#aet-admin-extras#aet-admin-extras#aet-admin-extras{display:block!important}',
      'html.admin-mode[data-axlog][data-axtabs][data-atab="req"] body > #aet-admin-extras#aet-admin-extras#aet-admin-extras#aet-admin-extras#aet-admin-extras,',
      'html.admin-mode[data-axlog][data-axtabs][data-atab="nt"] body > #aet-admin-extras#aet-admin-extras#aet-admin-extras#aet-admin-extras#aet-admin-extras{display:block!important}',
      'html[data-axtabs][data-atab="req"] #aet-admin-upload,html[data-axtabs][data-atab="req"] #aet-admin-cbt,html[data-axtabs][data-atab="req"] #aet-admin-contrib,',
      'html[data-axtabs][data-atab="nt"] #aet-admin-upload,html[data-axtabs][data-atab="nt"] #aet-admin-cbt,html[data-axtabs][data-atab="nt"] #aet-admin-contrib{display:none!important}',
      'html[data-axtabs][data-atab="req"] #aet-admin-extras [data-view="nt"],html[data-axtabs][data-atab="nt"] #aet-admin-extras [data-view="req"]{display:none}',
      '#aet-admin-extras h2{font-size:20px;margin:0 0 4px}',
      '#aet-admin-extras .ax-sub{font-size:13.5px;color:#6d7185;margin:0 0 14px;line-height:1.45}',
      '.axa-stats{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}',
      '.axa-stat{background:#fff;border:1px solid #e7e9f1;border-radius:14px;padding:10px 16px;min-width:110px}.axa-stat b{font-size:22px;display:block}.axa-stat span{font-size:12px;color:#6d7185}',
      '.axa-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}',
      '.axa-filters button{border:1.5px solid #cfd3e6;background:#fff;border-radius:99px;padding:7px 13px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}',
      '.axa-filters button.on{background:#080b63;border-color:#080b63;color:#fff}',
      '.axa-card{background:#fff;border:1px solid #e7e9f1;border-radius:14px;padding:14px 16px;margin-bottom:10px}',
      '.axa-row{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}',
      '.axa-title{font-weight:800;font-size:14.5px;margin:4px 0 2px;overflow-wrap:anywhere}',
      '.axa-meta{font-size:12.5px;color:#6d7185}',
      '.axa-acts{display:flex;gap:6px;flex-wrap:wrap}',
      '.axa-more{margin-top:10px;border-top:1px solid #eef0f7;padding-top:8px;font-size:13px}',
      '.axa-more div{padding:5px 0;border-bottom:1px dashed #eef0f7;overflow-wrap:anywhere}.axa-more div:last-child{border:0}',
      '.axa-more a{color:#080b63;font-weight:700}',
      '.axa-two{display:grid;gap:16px;grid-template-columns:1fr}',
      '@media(min-width:900px){.axa-two{grid-template-columns:1fr 1fr}}',
      '.axa-panel{background:#fff;border:1px solid #e7e9f1;border-radius:14px;padding:16px}',
      '.axa-panel h3{font-size:17px;margin:0 0 4px}',
      '.axa-g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.axa-mode{display:flex;gap:8px;margin:8px 0 2px}.axa-mode button{flex:1;border:1.5px solid #cfd3e6;background:#fff;border-radius:12px;padding:11px;font:inherit;font-weight:800;font-size:14px;cursor:pointer}',
      '.axa-mode button.on{background:#080b63;border-color:#080b63;color:#fff}',
      '.axa-mini{display:flex;gap:10px;align-items:center;border:1px solid #e7e9f1;border-radius:10px;padding:10px 12px;margin-top:8px;font-size:13px;flex-wrap:wrap}',
      '.axa-mini .grow{flex:1;min-width:140px;overflow-wrap:anywhere}',
      '.axa-msg{font-size:13px;font-weight:700;margin:10px 0 0}.axa-msg.bad{color:#b91c1c}.axa-msg.ok{color:#12733a}',
      '.axa-empty{font-size:13.5px;color:#6d7185;padding:14px;border:1px dashed #cfd3e6;border-radius:12px;background:#fff}',
      '#ax-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:22px;z-index:9500;background:#111827;color:#fff;border-radius:12px;padding:11px 14px;font-size:14px;font-weight:700;display:flex;gap:14px;align-items:center;box-shadow:0 14px 34px rgba(0,0,0,.35);max-width:calc(100vw - 24px)}',
      '#ax-toast[hidden]{display:none}',
      'html.admin-mode body > #ax-toast#ax-toast#ax-toast#ax-toast#ax-toast:not([hidden]){display:flex!important}',
      '#ax-toast button{background:#ffd21c;color:#050747;border:0;border-radius:8px;padding:6px 12px;font:inherit;font-weight:800;cursor:pointer}',
      '#aet-admin-tabs .at-badge.ax-b{margin-left:2px}'
    ].join('\n');
    document.head.appendChild(h('style', { id: 'axa-style', text: adminCss }));

    var state = { req: null, notices: [], sessions: [], filter: 'open', open: {}, editNotice: null, editSession: null, mode: 'physical', busy: false };
    var panel = h('section', { id: 'aet-admin-extras', 'aria-label': 'Requests, notices and tutorials' });
    var reqView = h('div', { 'data-view': 'req' });
    var ntView = h('div', { 'data-view': 'nt' });
    panel.appendChild(reqView); panel.appendChild(ntView);
    document.body.appendChild(panel);

    // ---- server calls
    async function api(body) {
      var s = (await sb.auth.getSession()).data.session;
      if (!s) throw new Error('Please sign in as admin.');
      var res;
      try {
        res = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + s.access_token }, body: JSON.stringify(body) });
      } catch (e) { throw new Error('Could not reach the server. Check your internet connection.'); }
      var data = null; try { data = await res.json(); } catch (e) {}
      if (!res.ok) throw new Error((data && data.error) || 'Something went wrong.');
      return data;
    }

    // ---- toast with undo
    var toast = h('div', { id: 'ax-toast', hidden: true, role: 'status', 'aria-live': 'polite' });
    document.body.appendChild(toast);
    var toastTimer = null;
    function say(text, undo) {
      clearTimeout(toastTimer); toast.textContent = ''; toast.hidden = false;
      toast.appendChild(h('span', { text: text }));
      if (undo) toast.appendChild(h('button', { type: 'button', text: 'Undo', onclick: async function (e) {
        e.target.disabled = true;
        try { await undo(); toast.textContent = 'Undone.'; } catch (x) { toast.textContent = 'Could not undo: ' + x.message; }
        toastTimer = setTimeout(function () { toast.hidden = true; }, 3000);
      } }));
      toastTimer = setTimeout(function () { toast.hidden = true; }, undo ? 10000 : 3500);
    }

    // ---- tabs integration
    var tabBtns = {};
    function setupTabs() {
      var inner = document.querySelector('#aet-admin-tabs .at-in');
      if (!inner) return false;
      if (inner.querySelector('[data-tab="req"]')) return true;
      document.documentElement.setAttribute('data-axtabs', '');
      var out = inner.querySelector('.at-out');
      [['req', 'Requests'], ['nt', 'Notices + Tutorials']].forEach(function (t) {
        var b = h('button', { type: 'button', role: 'tab', 'data-tab': t[0] }, t[1]);
        if (t[0] === 'req') { var badge = h('span', { class: 'at-badge ax-b', hidden: true }); b.appendChild(badge); }
        b.addEventListener('click', function () { document.documentElement.setAttribute('data-atab', t[0]); window.scrollTo(0, 0); });
        inner.insertBefore(b, out || null); tabBtns[t[0]] = b;
      });
      new MutationObserver(syncTabs).observe(document.documentElement, { attributes: true, attributeFilter: ['data-atab'] });
      syncTabs();
      return true;
    }
    function syncTabs() {
      var cur = document.documentElement.getAttribute('data-atab');
      var all = document.querySelectorAll('#aet-admin-tabs [data-tab]');
      Array.prototype.forEach.call(all, function (b) { var on = b.dataset.tab === cur; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
      if (cur === 'req') loadRequests(); else if (cur === 'nt') loadNt();
    }
    function setBadge(n) {
      var b = tabBtns.req && tabBtns.req.querySelector('.at-badge');
      if (b) { b.textContent = n > 0 ? String(n) : ''; b.hidden = !(n > 0); }
    }

    // ---- login watch
    var wasLogged = false;
    function watchLogin() {
      var logged = !!document.getElementById('admin-logout-button');
      if (logged) document.documentElement.setAttribute('data-axlog', ''); else document.documentElement.removeAttribute('data-axlog');
      if (logged && !wasLogged) { setupTabs(); loadRequests(true); if (!document.documentElement.hasAttribute('data-axtabs')) { loadRequests(); loadNt(); } }
      wasLogged = logged;
      if (logged) setupTabs();
    }
    setInterval(watchLogin, 1000); watchLogin();
    setInterval(function () { if (wasLogged) pollCount(); }, 60000);
    async function pollCount() { try { var c = await api({ action: 'requests_count' }); setBadge(c.new || 0); } catch (e) {} }

    // ============ REQUESTS VIEW ============
    var TYPE = { past_question: 'Past question', study_material: 'Study material', other: 'Other' };
    var STATUS_LABEL = { new: 'NEW', in_progress: 'IN PROGRESS', done: 'DONE' };
    async function loadRequests(quiet) {
      try {
        var d = await api({ action: 'requests_list' });
        state.req = d; setBadge(d.counts.new || 0); renderRequests();
      } catch (e) { if (!quiet) { reqView.textContent = ''; reqView.appendChild(h('div', { class: 'axa-msg bad', text: e.message })); } }
    }
    function courseLabel(r) {
      if (r.course_id && state.req) { var c = state.req.courses.filter(function (x) { return x.id === r.course_id; })[0]; if (c) return c.code; }
      return r.course_text ? r.course_text + ' (not listed)' : 'No course';
    }
    function groups() {
      var rows = state.req ? state.req.requests : [];
      var map = {};
      rows.forEach(function (r) {
        var key = (r.course_id || 't:' + (r.course_text || '').toLowerCase()) + '|' + r.req_type;
        (map[key] = map[key] || { key: key, rows: [] }).rows.push(r);
      });
      return Object.keys(map).map(function (k) {
        var g = map[k]; g.rows.sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
        var statuses = g.rows.map(function (r) { return r.status; });
        g.status = statuses.indexOf('new') > -1 ? 'new' : statuses.indexOf('in_progress') > -1 ? 'in_progress' : 'done';
        g.openCount = g.rows.filter(function (r) { return r.status !== 'done'; }).length;
        return g;
      });
    }
    function renderRequests() {
      reqView.textContent = '';
      var c = state.req.counts;
      reqView.appendChild(h('h2', { text: 'Material requests' }));
      reqView.appendChild(h('p', { class: 'ax-sub', text: 'What students asked for. The most-asked come first. Upload the file, then mark it done.' }));
      reqView.appendChild(h('div', { class: 'axa-stats' },
        h('div', { class: 'axa-stat' }, h('b', { text: String(c.new) }), h('span', { text: 'New' })),
        h('div', { class: 'axa-stat' }, h('b', { text: String(c.in_progress) }), h('span', { text: 'In progress' })),
        h('div', { class: 'axa-stat' }, h('b', { text: String(c.done) }), h('span', { text: 'Done' }))));
      var fl = h('div', { class: 'axa-filters' });
      [['open', 'New + in progress'], ['new', 'New'], ['in_progress', 'In progress'], ['done', 'Done'], ['all', 'All']].forEach(function (f) {
        fl.appendChild(h('button', { type: 'button', class: state.filter === f[0] ? 'on' : '', text: f[1], onclick: function () { state.filter = f[0]; renderRequests(); } }));
      });
      reqView.appendChild(fl);
      var list = groups().filter(function (g) {
        if (state.filter === 'all') return true;
        if (state.filter === 'open') return g.status !== 'done';
        return g.status === state.filter;
      });
      list.sort(function (a, b) { return (b.openCount - a.openCount) || (a.rows[0].created_at < b.rows[0].created_at ? 1 : -1); });
      if (!list.length) { reqView.appendChild(h('div', { class: 'axa-empty', text: state.filter === 'done' ? 'Nothing marked done yet.' : 'No requests here. When students ask for something, it shows up here.' })); return; }
      list.forEach(function (g) { reqView.appendChild(groupCard(g)); });
    }
    async function setStatus(g, status, label) {
      var ids = g.rows.filter(function (r) { return status === 'done' ? r.status !== 'done' : (status === 'new' ? r.status === 'done' : r.status !== status); }).map(function (r) { return r.id; });
      if (!ids.length) return;
      var prev = {}; g.rows.forEach(function (r) { if (ids.indexOf(r.id) > -1) (prev[r.status] = prev[r.status] || []).push(r.id); });
      try {
        await api({ action: 'request_update', ids: ids, status: status });
        await loadRequests();
        say(label + ' (' + ids.length + ').', async function () {
          for (var s in prev) await api({ action: 'request_update', ids: prev[s], status: s });
          await loadRequests();
        });
      } catch (e) { say(e.message); }
    }
    function waLink(n) { var d = String(n).replace(/[^0-9]/g, ''); if (d.indexOf('0') === 0) d = '234' + d.slice(1); return 'https://wa.me/' + d; }
    function groupCard(g) {
      var first = g.rows[0];
      var details = h('div', { class: 'axa-more', hidden: !state.open[g.key] });
      g.rows.forEach(function (r) {
        details.appendChild(h('div', null,
          h('span', { class: 'ax-chip ' + r.status, text: STATUS_LABEL[r.status] }), ' ' + r.details + ' ',
          h('span', { class: 'axa-meta', text: '· ' + fmtDay(r.created_at) }),
          r.contact ? h('span', null, ' · ', h('a', { href: waLink(r.contact), target: '_blank', rel: 'noopener noreferrer', text: r.contact })) : null));
      });
      var acts = h('div', { class: 'axa-acts' });
      if (g.status !== 'done') {
        acts.appendChild(h('button', { type: 'button', class: 'ax-btn n sm', text: 'Mark done', onclick: function () { setStatus(g, 'done', 'Marked done'); } }));
        if (g.status === 'new') acts.appendChild(h('button', { type: 'button', class: 'ax-btn g sm', text: 'In progress', onclick: function () { setStatus(g, 'in_progress', 'Marked in progress'); } }));
      } else {
        acts.appendChild(h('button', { type: 'button', class: 'ax-btn g sm', text: 'Reopen', onclick: function () { setStatus(g, 'new', 'Reopened'); } }));
        acts.appendChild(h('button', { type: 'button', class: 'ax-btn g sm', text: 'Copy WhatsApp line', onclick: function () {
          var line = 'Now on the Hub: ' + courseLabel(first) + ' ' + TYPE[first.req_type].toLowerCase() + '. aetlearninghub.app';
          try { navigator.clipboard.writeText(line); say('Copied: ' + line); } catch (e) { say(line); }
        } }));
      }
      acts.appendChild(h('button', { type: 'button', class: 'ax-btn red sm', text: 'Delete', onclick: async function () {
        if (!window.confirm('Delete ' + g.rows.length + ' request' + (g.rows.length > 1 ? 's' : '') + ' for good? Use this for spam only.')) return;
        try { await api({ action: 'request_delete', ids: g.rows.map(function (r) { return r.id; }) }); await loadRequests(); say('Deleted.'); } catch (e) { say(e.message); }
      } }));
      var more = h('button', { type: 'button', class: 'ax-link', text: state.open[g.key] ? 'Hide details' : 'Show all ' + g.rows.length, onclick: function () { state.open[g.key] = !state.open[g.key]; renderRequests(); } });
      return h('div', { class: 'axa-card' },
        h('div', { class: 'axa-row' },
          h('div', { style: 'flex:1;min-width:200px' },
            h('span', { class: 'ax-chip ' + g.status, text: STATUS_LABEL[g.status] }), ' ',
            h('span', { class: 'axa-meta', text: courseLabel(first) + ' · ' + TYPE[first.req_type] }),
            h('div', { class: 'axa-title', text: first.details }),
            h('div', { class: 'axa-meta', text: g.rows.length + (g.rows.length === 1 ? ' student' : ' students') + ' · first asked ' + fmtDay(g.rows[g.rows.length - 1].created_at) })),
          acts),
        more, details);
    }

    // ============ NOTICES + TUTORIALS VIEW ============
    async function loadNt() {
      try {
        var r = await Promise.all([api({ action: 'notices_list' }), api({ action: 'sessions_list' })]);
        state.notices = r[0].notices; state.sessions = r[1].sessions; renderNt();
      } catch (e) { ntView.textContent = ''; ntView.appendChild(h('div', { class: 'axa-msg bad', text: e.message })); }
    }
    function field(label, input, optional) {
      return h('div', null, h('label', null, label, optional ? h('span', { class: 'ax-opt', text: ' (optional)' }) : null), input);
    }
    function lagosISO(dateStr, timeStr) { return new Date(dateStr + 'T' + (timeStr || '00:00') + ':00+01:00').toISOString(); }
    function lagosParts(iso) {
      var d = new Date(new Date(iso).getTime() + 3600000); var p = d.toISOString();
      return { date: p.slice(0, 10), time: p.slice(11, 16) };
    }

    function renderNt() {
      ntView.textContent = '';
      ntView.appendChild(h('h2', { text: 'Notices and tutorials' }));
      ntView.appendChild(h('p', { class: 'ax-sub', text: 'Both show on the home page only while something is posted. Remove an entry and the section disappears.' }));
      ntView.appendChild(h('div', { class: 'axa-two' }, tutorialPanel(), noticePanel()));
    }

    // ---- notices
    function noticePanel() {
      var edit = state.editNotice;
      var title = h('input', { class: 'ax-in', type: 'text', maxlength: '120', value: edit ? edit.title : '' });
      var details = h('textarea', { class: 'ax-in', maxlength: '400' }); details.value = edit && edit.details ? edit.details : '';
      var source = h('input', { class: 'ax-in', type: 'text', maxlength: '200', placeholder: 'A link (https://...) or a name, e.g. School portal', value: edit ? edit.source : '' });
      var ends = h('input', { class: 'ax-in', type: 'date', value: edit ? lagosParts(edit.ends_at).date : '' });
      var from = h('input', { class: 'ax-in', type: 'date', value: edit ? lagosParts(edit.shows_from).date : '' });
      var tag = h('select', { class: 'ax-in' }, [['', 'No tag'], ['open', 'Open'], ['closing_soon', 'Closing soon'], ['closed', 'Closed']].map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
      tag.value = edit && edit.tag ? edit.tag : '';
      var msg = h('div', { class: 'axa-msg', hidden: true });
      var save = h('button', { type: 'button', class: 'ax-btn n', text: edit ? 'Save changes' : 'Publish notice', onclick: async function () {
        msg.hidden = true;
        if (!ends.value) { msg.className = 'axa-msg bad'; msg.textContent = 'Choose the date the notice disappears.'; msg.hidden = false; return; }
        var body = { action: 'notice_save', title: title.value, details: details.value, source: source.value, tag: tag.value || null, ends_at: lagosISO(ends.value, '23:59') };
        if (from.value) body.shows_from = lagosISO(from.value, '00:00');
        if (edit) body.id = edit.id;
        save.disabled = true;
        try { await api(body); state.editNotice = null; await loadNt(); say(edit ? 'Notice updated.' : 'Notice published.'); }
        catch (e) { msg.className = 'axa-msg bad'; msg.textContent = e.message; msg.hidden = false; save.disabled = false; }
      } });
      var panel = h('div', { class: 'axa-panel' },
        h('h3', { text: edit ? 'Edit notice' : 'Add a notice' }),
        h('p', { class: 'ax-sub', text: 'Every notice needs a source and an end date, so old information never looks current.' }),
        field('Title', title), field('Details', details, true), field('Source', source),
        h('div', { class: 'axa-g2' }, field('Starts on', from, true), field('Disappears on', ends)),
        field('Tag', tag, true), msg,
        h('div', { style: 'margin-top:14px;display:flex;gap:8px' }, save, edit ? h('button', { type: 'button', class: 'ax-btn g', text: 'Cancel', onclick: function () { state.editNotice = null; renderNt(); } }) : null));
      var labels = { open: 'OPEN', closing_soon: 'CLOSING SOON', closed: 'CLOSED' };
      if (!state.notices.length) panel.appendChild(h('div', { class: 'axa-empty', style: 'margin-top:14px', text: 'No notices posted. Nothing shows on the home page.' }));
      state.notices.forEach(function (n) {
        var live = new Date(n.ends_at).getTime() > Date.now() && new Date(n.shows_from).getTime() <= Date.now();
        panel.appendChild(h('div', { class: 'axa-mini' },
          h('span', { class: 'ax-chip ' + (live ? 'open' : 'closed'), text: live ? 'LIVE' : (new Date(n.ends_at) > new Date() ? 'SCHEDULED' : 'ENDED') }),
          h('span', { class: 'grow', text: n.title + ' · until ' + fmtDay(n.ends_at) + (n.tag ? ' · ' + labels[n.tag] : '') }),
          h('button', { type: 'button', class: 'ax-link', text: 'Edit', onclick: function () { state.editNotice = n; renderNt(); } }),
          h('button', { type: 'button', class: 'ax-link', style: 'color:#b91c1c', text: 'Remove', onclick: async function () {
            try {
              await api({ action: 'notice_delete', id: n.id });
              await loadNt();
              say('Notice removed.', async function () {
                await api({ action: 'notice_save', title: n.title, details: n.details, source: n.source, tag: n.tag, shows_from: n.shows_from, ends_at: n.ends_at });
                await loadNt();
              });
            } catch (e) { say(e.message); }
          } })));
      });
      return panel;
    }

    // ---- tutorial sessions
    function tutorialPanel() {
      var edit = state.editSession;
      if (edit) state.mode = edit.mode;
      var mode = state.mode;
      var title = h('input', { class: 'ax-in', type: 'text', maxlength: '120', placeholder: 'e.g. MTH101: Limits, part 1', value: edit ? edit.title : '' });
      var sp = edit ? lagosParts(edit.starts_at) : { date: '', time: '' };
      var date = h('input', { class: 'ax-in', type: 'date', value: sp.date });
      var time = h('input', { class: 'ax-in', type: 'time', value: sp.time });
      var venue = h('input', { class: 'ax-in', type: 'text', maxlength: '160', placeholder: 'e.g. Lecture Theatre 2, main campus', value: edit && edit.venue ? edit.venue : '' });
      var link = h('input', { class: 'ax-in', type: 'url', maxlength: '300', placeholder: 'https://chat.whatsapp.com/...', value: edit && edit.join_link ? edit.join_link : '' });
      var note = h('input', { class: 'ax-in', type: 'text', maxlength: '200', placeholder: 'e.g. Bring pen and calculator', value: edit && edit.note ? edit.note : '' });
      var hp = edit ? lagosParts(edit.hide_after) : { date: '', time: '' };
      var hideAt = h('input', { class: 'ax-in', type: 'datetime-local', value: edit ? hp.date + 'T' + hp.time : '' });
      var file = h('input', { class: 'ax-in', type: 'file', accept: 'application/pdf,.pdf' });
      var msg = h('div', { class: 'axa-msg', hidden: true });
      function bad(t) { msg.className = 'axa-msg bad'; msg.textContent = t; msg.hidden = false; }
      var save = h('button', { type: 'button', class: 'ax-btn n', text: edit ? 'Save changes' : 'Publish session', onclick: async function () {
        msg.hidden = true;
        if (!date.value || !time.value) return bad('Choose the date and time.');
        var body = { action: 'session_save', mode: mode, title: title.value, starts_at: lagosISO(date.value, time.value), note: note.value };
        if (mode === 'physical') body.venue = venue.value; else body.join_link = link.value;
        if (hideAt.value) body.hide_after = lagosISO(hideAt.value.slice(0, 10), hideAt.value.slice(11, 16));
        if (edit) { body.id = edit.id; body.notes_path = edit.notes_path || null; }
        save.disabled = true;
        try {
          var f = file.files && file.files[0];
          var uploaded = null;
          if (f) {
            if (!/\.pdf$/i.test(f.name) || (f.type && f.type !== 'application/pdf')) throw new Error('Notes must be a PDF file.');
            if (f.size > 25 * 1024 * 1024) throw new Error('That PDF is over 25MB. Compress it first.');
            var safe = f.name.replace(/\.pdf$/i, '').replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 60) || 'notes';
            uploaded = 'tutorial-notes/' + Date.now() + '-' + safe + '.pdf';
            var up = await sb.storage.from(NOTES_BUCKET).upload(uploaded, f, { contentType: 'application/pdf', upsert: false });
            if (up.error) throw new Error('Could not upload the notes: ' + up.error.message);
            body.notes_path = uploaded;
          }
          await api(body);
          if (uploaded && edit && edit.notes_path) { try { await sb.storage.from(NOTES_BUCKET).remove([edit.notes_path]); } catch (e) {} }
          state.editSession = null; await loadNt(); say(edit ? 'Session updated.' : 'Session published.');
        } catch (e) { bad(e.message); save.disabled = false; }
      } });
      var modeBox = h('div', { class: 'axa-mode', role: 'radiogroup', 'aria-label': 'Physical or online' });
      [['physical', 'Physical'], ['online', 'Online']].forEach(function (o) {
        modeBox.appendChild(h('button', { type: 'button', class: mode === o[0] ? 'on' : '', 'aria-pressed': mode === o[0] ? 'true' : 'false', text: o[1], onclick: function () { state.mode = o[0]; renderNt(); } }));
      });
      var panel = h('div', { class: 'axa-panel' },
        h('h3', { text: edit ? 'Edit tutorial' : 'Schedule a tutorial' }),
        h('p', { class: 'ax-sub', text: 'Choose the type first. The card shows on the home page until it is hidden.' }),
        modeBox,
        field('Course and topic', title),
        mode === 'physical' ? field('Venue', venue) : field('Join link', link, true),
        mode === 'online' ? h('div', { class: 'ax-fine', style: 'margin-top:-2px', text: 'No link: the card shows the schedule and says "Held online".' }) : null,
        h('div', { class: 'axa-g2' }, field('Date', date), field('Time', time)),
        field('Extra note', note, true),
        field('Notes after class (PDF)', file, true),
        edit && edit.notes_path ? h('div', { class: 'ax-fine', text: 'This session already has notes. Choose a new PDF only if you want to replace them.' }) : null,
        field('Hide the card after', hideAt, true),
        h('div', { class: 'ax-fine', text: 'Leave empty to hide it 4 hours after it starts. Notes stay available on the home page for 14 days.' }),
        msg,
        h('div', { style: 'margin-top:14px;display:flex;gap:8px' }, save, edit ? h('button', { type: 'button', class: 'ax-btn g', text: 'Cancel', onclick: function () { state.editSession = null; renderNt(); } }) : null));
      if (!state.sessions.length) panel.appendChild(h('div', { class: 'axa-empty', style: 'margin-top:14px', text: 'No sessions posted. No Tutorials card shows on the home page.' }));
      state.sessions.forEach(function (s) {
        var liveS = new Date(s.hide_after).getTime() > Date.now();
        panel.appendChild(h('div', { class: 'axa-mini' },
          h('span', { class: 'ax-chip ' + (liveS ? s.mode : 'closed'), text: liveS ? s.mode.toUpperCase() : 'ENDED' }),
          h('span', { class: 'grow', text: s.title + ' · ' + fmtWhen(s.starts_at) + (s.notes_path ? ' · notes attached' : '') }),
          h('button', { type: 'button', class: 'ax-link', text: 'Edit', onclick: function () { state.editSession = s; renderNt(); window.scrollTo(0, 0); } }),
          h('button', { type: 'button', class: 'ax-link', style: 'color:#b91c1c', text: 'Remove', onclick: async function () {
            try {
              await api({ action: 'session_delete', id: s.id, keep_file: true });
              await loadNt();
              say('Session removed.', async function () {
                await api({ action: 'session_save', mode: s.mode, title: s.title, starts_at: s.starts_at, venue: s.venue, join_link: s.join_link, note: s.note, notes_path: s.notes_path, hide_after: s.hide_after });
                await loadNt();
              });
            } catch (e) { say(e.message); }
          } })));
      });
      return panel;
    }
  }

  // ---------- start ----------
  function start() {
    if (IS_ADMIN) { try { adminInit(); } catch (e) { console.error('aet-extras admin:', e); } return; }
    studentInit().catch(function (e) { console.error('aet-extras:', e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();


/* ============================================================
   AET Learning Hub: maths helper for "Import many" (admin page)
   Press Check as usual. The maths is wrapped in $ signs for you.
   ============================================================ */
(function () {
  'use strict';
  if (window.__aetMathfix) return;
  window.__aetMathfix = true;
  // ---------- maths helper for "Import many" (admin page) ----------
  // Before "Check" runs, tidy the pasted text so maths sits between single $ signs:
  //   - removes \bm / \boldsymbol markers that Gemini adds
  //   - wraps loose maths (x^2, \frac{1}{2}, \sqrt{x} ...) and anything after a \bm marker in $ ... $
  //   - turns $$..$$, \( .. \) and \[ .. \] into single $ ... $
  //   - repairs JSON where \frac, \times, \beta ... lost their backslash meaning (\f, \t, \b are JSON escapes)
  var OPS = /^(?:[+\-=*\/<>]|≤|≥|×|÷|·)$/;
  var CMD = /\\[A-Za-z]+/;
  var END_PUNCT = /[,.;:?!]+$/;

  function tokType(w) {
    if (/^\s+$/.test(w)) return 'S';
    var core = w.replace(END_PUNCT, '');
    if (/^\\(?:bm|boldsymbol)$/.test(core)) return 'B';
    if (OPS.test(core)) return 'O';
    if (CMD.test(core) || /[A-Za-z0-9)}\]][\^_]/.test(core)) return 'M';
    if (/^(?:[0-9]+(?:\.[0-9]+)?|[A-Za-z]|[0-9]*[A-Za-z]\([A-Za-z0-9]*\))$/.test(core)) return 'A';
    return 'P';
  }

  function cleanInside(s) {
    return s.replace(/\\(?:bm|boldsymbol|mathbf|mathbb)\b\s*/g, '').replace(/\s+$/, '');
  }

  function splitWords(s) {
    // split on spaces, but never inside { ... }
    var parts = [], cur = '', depth = 0, space = false;
    for (var i = 0; i < s.length; i++) {
      var c = s[i], sp = /\s/.test(c) && depth === 0;
      if (sp !== space && cur) { parts.push(cur); cur = ''; }
      space = sp;
      if (c === '{') depth++; else if (c === '}' && depth > 0) depth--;
      cur += c;
    }
    if (cur) parts.push(cur);
    return parts;
  }

  function wrapOutside(s) {
    if (!s) return s;
    var parts = splitWords(s), types = parts.map(tokType), n = parts.length, out = [], i = 0, count = 0;
    function nextNonSpace(k) { k++; while (k < n && types[k] === 'S') k++; return k; }
    while (i < n) {
      var t = types[i], start = -1, end = -1;
      if (t === 'B') {
        var f = nextNonSpace(i);
        if (f < n && types[f] !== 'B') { start = i; end = f; } else { out.push(''); i++; continue; }
      } else if (t === 'M') { start = i; end = i; }
      else if (t === 'A') {
        var k1 = nextNonSpace(i), k2 = k1 < n ? nextNonSpace(k1) : n;
        if (k1 < n && types[k1] === 'O' && k2 < n && (types[k2] === 'M' || types[k2] === 'A')) { start = i; end = i; }
      }
      if (start < 0) { out.push(parts[i]); i++; continue; }
      // extend to the right
      for (;;) {
        var a = nextNonSpace(end);
        if (a >= n) break;
        if (types[a] === 'M' || (types[a] === 'A' && /\(/.test(parts[a]))) { end = a; continue; }
        if (types[a] === 'O') {
          var b = nextNonSpace(a);
          if (b < n && (types[b] === 'M' || types[b] === 'A')) { end = b; continue; }
        }
        break;
      }
      var chunk = parts.slice(start, end + 1).join('');
      var trail = (chunk.match(END_PUNCT) || [''])[0];
      if (trail) chunk = chunk.slice(0, chunk.length - trail.length);
      chunk = cleanInside(chunk);
      if (chunk) { out.push('$' + chunk + '$' + trail); count++; } else out.push(trail);
      i = end + 1;
    }
    wrapOutside.count = (wrapOutside.count || 0) + count;
    return out.join('');
  }

  function fixMathString(text) {
    var s = String(text);
    s = s.replace(/\$\$/g, '$').replace(/\\\(|\\\)|\\\[|\\\]/g, '$');
    // control characters that are really lost backslashes (backspace, form feed)
    s = s.replace(/\u0008/g, '\\b').replace(/\u000c/g, '\\f');
    var out = '', i = 0, buf = '';
    while (i < s.length) {
      var c = s[i];
      if (c === '\\' && s[i + 1] === '$') { buf += '\\$'; i += 2; continue; }
      if (c === '$' && i + 1 < s.length && !/\s/.test(s[i + 1])) {
        var j = i + 1, found = -1;
        while (j < s.length && j - i <= 400) {
          if (s[j] === '\\') { j += 2; continue; }
          if (s[j] === '$') { if (!/\s/.test(s[j - 1]) && !/[0-9]/.test(s[j + 1] || '')) found = j; break; }
          j++;
        }
        if (found !== -1) {
          out += wrapOutside(buf); buf = '';
          out += '$' + cleanInside(s.slice(i + 1, found)) + '$';
          i = found + 1; continue;
        }
      }
      buf += c; i++;
    }
    return out + wrapOutside(buf);
  }

  var JSON_FIX = /(\\+)(frac|forall|beta|bar|bm|boldsymbol|binom|times|theta|tan|tau|text|textbf|neq|ne|nu|nabla|not|right|rho|rightarrow|rangle|rbrace|rfloor|rceil)(?![A-Za-z])/g;
  function fixImportText(raw) {
    var t = String(raw).trim();
    wrapOutside.count = 0;
    if (!t) return { text: raw, changed: 0 };
    if (t[0] === '[' || t[0] === '{') {
      var repaired = t.replace(JSON_FIX, function (m, bs, cmd) { return bs.length % 2 === 1 ? bs + '\\' + cmd : m; });
      var data;
      try { data = JSON.parse(repaired); } catch (e) { return { text: raw, changed: 0 }; }
      var walk = function (v, key) {
        if (typeof v === 'string') return /^(question|question_text|q|options|choices|explanation|why|A|B|C|D)$/.test(key || '') || key === 'item' ? fixMathString(v) : v;
        if (Array.isArray(v)) return v.map(function (x) { return walk(x, key === 'options' || key === 'choices' ? 'item' : key); });
        if (v && typeof v === 'object') { var o = {}; Object.keys(v).forEach(function (k) { o[k] = walk(v[k], k); }); return o; }
        return v;
      };
      var fixed = JSON.stringify(walk(data, ''), null, 2);
      return { text: fixed, changed: fixed === t ? 0 : Math.max(wrapOutside.count, 1) };
    }
    var fixedText = t.split('\n').map(function (line) {
      // leave the labels alone, fix the maths in the rest
      var m = line.match(/^(\s*(?:\(?[A-Da-d]\s*[.):\]]|(?:q(?:uestion)?\s*)?\d+\s*[.):\-]|answer\s*[:\-]|ans\s*[:\-]|correct(?:\s+answer)?\s*[:\-]|explanation\s*[:\-]|why\s*[:\-]|reason\s*[:\-]|topic\s*[:\-]|difficulty\s*[:\-])\s*)([\s\S]*)$/i);
      if (/^\s*(?:answer|ans|correct(?:\s+answer)?|topic|difficulty)\s*[:\-]/i.test(line)) return line;
      return m ? m[1] + fixMathString(m[2]) : fixMathString(line);
    }).join('\n');
    return { text: fixedText, changed: fixedText === t ? 0 : Math.max(wrapOutside.count, 1) };
  }

  var original = null, skipOnce = false;
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-action="import-check"],[data-axm="undo"]') : null;
    if (!t) return;
    var box = document.getElementById('qb-import-text');
    if (!box) return;
    if (t.getAttribute('data-axm') === 'undo') {
      e.preventDefault(); e.stopPropagation();
      if (original !== null) { box.value = original; skipOnce = true; var n = document.getElementById('axm-note'); if (n) n.textContent = 'Original text put back. Press Check to continue without the maths fix.'; }
      return;
    }
    if (skipOnce) { skipOnce = false; return; }
    var r;
    try { r = fixImportText(box.value); } catch (err) { return; }
    if (!r.changed) return;
    original = box.value;
    box.value = r.text;
    setTimeout(function () {
      var res = document.querySelector('#qb-import .qb-importresult');
      if (!res || document.getElementById('axm-note')) return;
      var p = document.createElement('p');
      p.className = 'qb-muted'; p.style.margin = '8px 0';
      var span = document.createElement('span'); span.id = 'axm-note';
      span.textContent = 'Maths tidied: loose maths was put between $ signs and any \\bm was removed. The text above is the fixed version. ';
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'qb-btn'; b.setAttribute('data-axm', 'undo'); b.textContent = 'Put my original text back';
      p.appendChild(span); p.appendChild(b); res.insertBefore(p, res.firstChild);
    }, 30);
  }, true);
})();