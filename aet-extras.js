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
    '.ax-fine{font-size:11.5px;color:#6d7185;margin-top:5px;line-height:1.4}',
    /* ---- notice rows ---- */
    '.ax-nc .ax-notice{padding:0;margin-top:0;border:0;border-top:1px solid #e7e9f1;border-radius:0;background:none;box-shadow:none}',
    '.ax-nc .ax-notice:first-of-type{margin-top:8px}',
    '.axn-head{display:flex;gap:12px;align-items:center;padding:12px 2px;cursor:pointer;text-align:left}',
    '.axn-head:focus-visible{outline:3px solid #ffd21c;outline-offset:2px;border-radius:10px}',
    '.axn-av{flex:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:17px}',
    '.axn-main{flex:1;min-width:0}',
    '.axn-img,.axn-ic{flex:none;width:42px;height:42px;border-radius:12px;overflow:hidden;display:grid;place-items:center}',
    '.axn-img{background:#eef0f7;border:1px solid #e1e4f0}.axn-img img{width:100%;height:100%;object-fit:cover;display:block}',
    '.axn-ic{font-size:20px;background:#eef0ff}',
    '.axn-ic.urgent{background:#fde4e4}.axn-ic.closing_soon{background:#fff3cf}.axn-ic.closed{background:#eef0f7}.axn-ic.open{background:#e3f6e8}',
    '.ax-nc .ax-notice.is-urgent{background:linear-gradient(90deg,#fff5f5,#fff);border-radius:12px;box-shadow:inset 3px 0 0 #d64545;padding-left:8px;border-top-color:transparent}',
    '.axn-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
    '.axn-src{font-size:10px;letter-spacing:.06em;color:#6d7185;font-weight:700;text-transform:uppercase;overflow-wrap:anywhere}',
    '.axn-main .ax-ntitle{margin:3px 0 2px;font-size:14.5px;line-height:1.3}',
    '.axn-prev{font-size:12.5px;color:#6d7185;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.axn-time{font-size:11.5px;color:#8a8fa6;margin-top:3px}',
    '.axn-chev{flex:none;color:#8a8fa6;font-size:24px;line-height:1;transition:transform .15s}',
    '.axn-head.open .axn-chev{transform:rotate(90deg)}',
    '.axn-more{padding:0 2px 12px 54px}',
    '.axn-more[hidden]{display:none}',
    '.axn-full{font-size:13.5px;color:#454a63;line-height:1.5;margin-bottom:6px;white-space:pre-line}',
    '.axn-meta{font-size:12px;color:#6d7185}.axn-meta a{color:#080b63;font-weight:700;text-decoration:underline}',
    '.axn-warn{margin-top:6px;padding:10px 12px;border-radius:10px;background:#f4f6fc;color:#5b6078;font-size:12px;line-height:1.4}',
    '.ax-chip.urgent{background:#fde4e4;color:#a83232}',
    /* ---- tutorial announcements ---- */
    '.axt-wrap{background:#fff;border:1px solid #e7e9f1;border-radius:20px;padding:18px;box-shadow:0 12px 35px rgba(8,11,99,.06)}',
    '.axt-h{font-size:20px;margin:0 0 2px;color:#080b63}',
    '.axt-wrap .ax-lead{font-size:13px;margin:0 0 14px}',
    '.axt-list{display:grid;gap:12px}',
    '.axt-card{display:flex;gap:12px;align-items:stretch;border:1px solid #e7e9f1;border-radius:16px;padding:10px;background:#fff}',
    '.axt-fly{flex:none;width:96px;border-radius:12px;overflow:hidden;background:#eef0f7;align-self:flex-start;line-height:0}',
    '.axt-fly img{width:100%;height:auto;display:block}',
    '.axt-body{flex:1;min-width:0;padding:2px 2px 2px 0}',
    '.axt-chips{display:flex;gap:6px;align-items:center;flex-wrap:wrap}',
    '.axt-st{font-size:11.5px;font-weight:800;padding:3px 10px;border-radius:99px}',
    '.axt-st.upcoming{background:#e3f6e8;color:#17703a}.axt-st.today{background:#fff3cf;color:#8a6200}.axt-st.ongoing{background:#fde4e4;color:#a83232}.axt-st.notes{background:#e5e8ff;color:#080b63}',
    '.axt-mode{font-size:11.5px;font-weight:700;color:#6d7185}',
    '.axt-body h3{font-size:16.5px;line-height:1.3;margin:6px 0 6px;color:#11152b}',
    '.axt-meta{display:flex;gap:6px 16px;flex-wrap:wrap;font-size:13px;color:#454a63;line-height:1.4}',
    '.axt-note{font-size:13px;color:#6d7185;margin:6px 0 0;line-height:1.45}',
    '.axt-btn{display:inline-block;margin-top:10px;padding:9px 16px;border-radius:12px;border:1.5px solid #1d5a42;color:#1d5a42;font-weight:800;font-size:14px;text-decoration:none;background:#fff}',
    '.axt-past{margin-top:10px;padding-top:8px;border-top:1px solid #e7e9f1;font-size:12.5px;color:#6d7185}',
    '.axt-past a{color:#1d5a42;font-weight:800}',
    '@media(max-width:420px){.axt-fly{width:78px}.axt-card{padding:8px}}',
    /* ---- join group strip ---- */
    '.axg{margin-top:10px;display:flex;align-items:center;gap:10px;background:#e8f6ec;border:1px solid #cfe8d8;border-radius:14px;padding:9px 10px 9px 12px}',
    '.axg-ic{flex:none;display:grid;place-items:center}.axg-ic svg{width:30px;height:30px}',
    '.axg-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}',
    '.axg-t b{font-size:14px;line-height:1.25;color:#1d3f30}.axg-t span{font-size:12px;color:#3d5a4b;line-height:1.35}',
    '.axg-btn{flex:none;display:inline-flex;align-items:center;gap:6px;background:#1d5a42;color:#fff;font-weight:800;font-size:13.5px;padding:9px 14px;border-radius:99px;text-decoration:none;white-space:nowrap}',
    '.axg-btn:focus-visible{outline:3px solid #ffd21c;outline-offset:2px}',
    '.axg-wa{display:grid;place-items:center}.axg-wa svg{width:16px;height:16px}',
    '@media(max-width:380px){.axg-t span{display:none}.axg-btn{padding:9px 12px}}',
    /* ---- material request banner ---- */
    '.ax-req.axr{display:flex;align-items:center;gap:12px;background:#e8f6ec;border:1px solid #cfe8d8;border-radius:14px;padding:10px 14px;margin:14px 0 6px}',
    '.axr-ic{flex:none;display:grid;place-items:center}',
    '.axr-ic svg{width:34px;height:34px}',
    '.axr-t{flex:1;min-width:0}',
    '.axr-t b{display:block;font-size:15px;line-height:1.2;color:#1d5a42;font-weight:800}',
    '.axr-t p{margin:2px 0 0;font-size:12.5px;line-height:1.35;color:#1d3f30}',
    '.axr-btn{flex:none;border:0;cursor:pointer;background:#1d5a42;color:#fff;font-weight:800;font-size:13.5px;line-height:1.2;font-family:inherit;padding:9px 16px;border-radius:99px;white-space:nowrap}',
    '.axr-btn:focus-visible{outline:3px solid #ffd21c;outline-offset:2px}',
    '@media(max-width:560px){.ax-req.axr{flex-wrap:wrap;padding:10px 12px}.axr-t{flex:1 1 calc(100% - 50px)}.axr-btn{width:100%;padding:9px 14px}}',  ].join('\n');
  document.head.appendChild(h('style', { id: 'ax-style', text: css }));

  // ============================================================
  // STUDENT SIDE
  // ============================================================
  var live = { notices: [], sessions: [] };
  var homeBox = null;

  async function loadLive() {
    try {
      var r = await Promise.all([
        sb.from('hub_notices').select('*').order('shows_from', { ascending: false }),
        sb.from('hub_sessions').select('*').order('starts_at', { ascending: true }),
        sb.from('hub_settings').select('key,value').eq('key', 'group_link')
      ]);
      live.notices = (r[0] && !r[0].error && r[0].data) || [];
      live.sessions = (r[1] && !r[1].error && r[1].data) || [];
      var g = (r[2] && !r[2].error && r[2].data && r[2].data[0]) || null;
      live.groupLink = g && isHttps(g.value) ? g.value : '';
    } catch (e) { live.notices = []; live.sessions = []; live.groupLink = ''; }
  }

  function publicUrl(path) { return notesUrl(path); }
  function svg(markup, cls) { var s = h('span', { class: cls || 'axi', 'aria-hidden': 'true' }); s.innerHTML = markup; return s; }
  var WA_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" focusable="false"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.23 8.22zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29z"/></svg>';
  var PEOPLE_ICON = '<svg viewBox="0 0 48 48" width="30" height="30" focusable="false"><g fill="#1d5a42"><circle cx="18" cy="16" r="6.5"/><path d="M4 39c0-7.600 6.200-12 14-12s14 4.400 14 12z"/><g opacity=".55"><circle cx="34" cy="18" r="5"/><path d="M34 27.500c6.200 0 10.500 3.500 10.500 11.500H35c0-4.200-1.400-7.800-4-9.800 1-.9 1.900-1.700 3-1.700z"/></g></g></svg>';
  var HEADSET_ICON = '<svg viewBox="0 0 64 64" width="64" height="64" focusable="false"><g fill="#1d5a42"><path d="M32 6C19.3 6 10 15.4 10 27v7h5v-7c0-9.4 7.2-17 17-17s17 7.6 17 17v7h5v-7C54 15.4 44.7 6 32 6z"/><rect x="6" y="26" width="9" height="16" rx="4.5"/><rect x="49" y="26" width="9" height="16" rx="4.5"/><circle cx="32" cy="27" r="9"/><path d="M12 58c0-9.9 8.1-16 20-16s20 6.100 20 16z"/><path d="M52 40c0 6-4 9-10 9h-3v-4h3c4 0 6-1.800 6-5z"/></g><circle cx="32" cy="27" r="9" fill="#e3f5e8"/><circle cx="32" cy="27" r="9" fill="none" stroke="#1d5a42" stroke-width="3"/></svg>';

  function timeAgo(iso) {
    var s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 90) return 'Just now';
    var m = Math.round(s / 60); if (m < 60) return m + ' minutes ago';
    var hr = Math.round(m / 60); if (hr < 24) return hr + (hr === 1 ? ' hour ago' : ' hours ago');
    var d = Math.round(hr / 24); if (d === 1) return 'Yesterday'; if (d < 8) return d + ' days ago';
    return fmtDay(iso);
  }
  var AV = [['#e3f6e8', '#17703a'], ['#e1ecfb', '#1a4f9c'], ['#ece6fb', '#5a3aa8'], ['#fdeedd', '#a45a0a'], ['#fde4e4', '#a83232'], ['#e0f4f4', '#136a6a']];
  function avatar(label) {
    var t = String(label || '?').replace(/^https?:\/\/(www\.)?/i, '').trim();
    var ch = (t.match(/[A-Za-z0-9]/) || ['?'])[0].toUpperCase();
    var sum = 0; for (var i = 0; i < t.length; i++) sum += t.charCodeAt(i);
    var c = AV[sum % AV.length];
    return h('span', { class: 'axn-av', style: 'background:' + c[0] + ';color:' + c[1], 'aria-hidden': 'true', text: ch });
  }
  var TAG_ICON = { urgent: '🚨', closing_soon: '⏳', closed: '🔒', open: '✅' };
  function noticeThumb(n, host) {
    var icon = h('span', { class: 'axn-ic ' + (n.tag || 'plain'), 'aria-hidden': 'true', text: TAG_ICON[n.tag] || '📢' });
    var url = n.image_path ? notesUrl(n.image_path) : '';
    if (!url) return icon;
    var wrap = h('span', { class: 'axn-img', 'aria-hidden': 'true' });
    var img = h('img', { src: url, alt: '', loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', function () { if (wrap.parentNode) wrap.parentNode.replaceChild(icon, wrap); });
    wrap.appendChild(img);
    return wrap;
  }
  function dayKey(t) { return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(t)); }
  function tutStatus(s) {
    var now = Date.now(), st = new Date(s.starts_at).getTime();
    if (now >= st) return ['ongoing', 'Ongoing'];
    return dayKey(now) === dayKey(st) ? ['today', 'Today'] : ['upcoming', 'Upcoming'];
  }

  function flyerBox(s) {
    if (!s.flyer_path) return null;
    var url = publicUrl(s.flyer_path);
    if (!url) return null;
    var img = h('img', { src: url, alt: 'Flyer for ' + s.title, loading: 'lazy', decoding: 'async' });
    var a = h('a', { class: 'axt-fly', href: url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Open the flyer' }, img);
    img.addEventListener('error', function () { if (a.parentNode) a.parentNode.removeChild(a); });
    return a;
  }

  function tutorialCard(s, notesSession) {
    var st = tutStatus(s);
    var body = h('div', { class: 'axt-body' },
      h('div', { class: 'axt-chips' },
        h('span', { class: 'axt-st ' + st[0], text: st[1] }),
        h('span', { class: 'axt-mode', text: s.mode === 'physical' ? 'Physical' : 'Online' })),
      h('h3', { text: s.title }),
      h('div', { class: 'axt-meta' },
        h('span', { text: '📅 ' + fmtWhen(s.starts_at) }),
        h('span', { text: s.mode === 'physical' ? '📍 ' + (s.venue || '') : '🌐 Held online' })));
    if (s.note) body.appendChild(h('p', { class: 'axt-note', text: s.note }));
    if (s.mode === 'online' && isHttps(s.join_link)) {
      body.appendChild(h('a', { class: 'axt-btn', href: s.join_link, target: '_blank', rel: 'noopener noreferrer', text: 'Join the class' }));
    }
    if (s.notes_path) {
      body.appendChild(h('div', { class: 'axt-past' }, 'Notes for this session: ', h('a', { href: notesUrl(s.notes_path), target: '_blank', rel: 'noopener noreferrer', text: 'Download (PDF) →' })));
    } else if (notesSession) {
      body.appendChild(h('div', { class: 'axt-past' }, 'Last session notes: ', h('a', { href: notesUrl(notesSession.notes_path), target: '_blank', rel: 'noopener noreferrer', text: notesSession.title + ' (PDF) →' })));
    }
    return h('div', { class: 'axt-card' }, flyerBox(s), body);
  }

  function notesOnlyCard(s) {
    return h('div', { class: 'axt-card' }, flyerBox(s),
      h('div', { class: 'axt-body' },
        h('div', { class: 'axt-chips' }, h('span', { class: 'axt-st notes', text: 'Notes' }), h('span', { class: 'axt-mode', text: 'AET Tutorial' })),
        h('h3', { text: s.title }),
        h('div', { class: 'axt-meta' }, h('span', { text: 'Notes from the ' + fmtDay(s.starts_at) + ' session' })),
        h('a', { class: 'axt-btn', href: notesUrl(s.notes_path), target: '_blank', rel: 'noopener noreferrer', text: 'Download notes (PDF)' })));
  }

  var NOTICE_LABELS = { open: 'OPEN', closing_soon: 'CLOSING SOON', closed: 'CLOSED', urgent: 'URGENT' };
  function noticeCard(n) {
    var host = n.source;
    if (isHttps(n.source)) { try { host = new URL(n.source).hostname.replace(/^www\./, ''); } catch (e) {} }
    var src = isHttps(n.source) ? h('a', { href: n.source, target: '_blank', rel: 'noopener noreferrer', text: 'Source ↗' }) : null;
    var tag = n.tag && NOTICE_LABELS[n.tag] ? h('span', { class: 'ax-chip ' + n.tag, text: NOTICE_LABELS[n.tag] }) : null;
    var more = h('div', { class: 'axn-more', hidden: true },
      n.details ? h('div', { class: 'axn-full', text: n.details }) : null,
      h('div', { class: 'axn-meta' }, h('span', { text: 'Posted ' + fmtDay(n.shows_from) + ' · until ' + fmtDay(n.ends_at) }), src ? h('span', null, ' · ', src) : h('span', { text: ' · Source: ' + n.source })));
    var chev = h('span', { class: 'axn-chev', 'aria-hidden': 'true', text: '›' });
    var head = h('div', { class: 'axn-head', role: 'button', tabindex: '0', 'aria-expanded': 'false' },
      noticeThumb(n, host),
      h('div', { class: 'axn-main' },
        h('div', { class: 'axn-top' }, h('span', { class: 'axn-src', text: host }), tag),
        h('div', { class: 'ax-ntitle', text: n.title }),
        n.details ? h('div', { class: 'axn-prev', text: n.details }) : null,
        h('div', { class: 'axn-time', text: timeAgo(n.shows_from) })),
      chev);
    function toggle() {
      var open = more.hidden; more.hidden = !open;
      head.setAttribute('aria-expanded', open ? 'true' : 'false'); head.classList.toggle('open', open);
    }
    head.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) return; toggle(); });
    head.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    return h('div', { class: 'ax-notice' + (n.tag === 'urgent' ? ' is-urgent' : '') }, head, more);
  }

  function noticeSort(a, b) {
    var ua = a.tag === 'urgent' ? 0 : 1, ub = b.tag === 'urgent' ? 0 : 1;
    if (ua !== ub) return ua - ub;
    return new Date(b.shows_from) - new Date(a.shows_from);
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
      h('h2', { class: 'ax-nh', text: '🔔 Notice Center' }),
      h('p', { class: 'ax-lead', text: 'Latest updates and important notices from AET.' }));
    notices.forEach(function (n) { card.appendChild(noticeCard(n)); });
    card.appendChild(h('div', { class: 'axn-warn' }, 'ⓘ Not sure if it\'s real? Always confirm important information from official sources.'));
    if (side) side.appendChild(card);
    else { var a = document.getElementById('search-section'); if (a && a.parentNode) { var w = h('section', { class: 'ax-home' }, card); a.parentNode.insertBefore(w, a); sideBox = w; return; } }
    sideBox = card;
  }

  function renderHome() {
    var anchor = document.getElementById('search-section');
    if (!anchor || !anchor.parentNode) return;
    var now = Date.now();
    var notices = live.notices.filter(function (n) { return new Date(n.shows_from).getTime() <= now && new Date(n.ends_at).getTime() > now; }).sort(noticeSort);
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
    var box = h('section', { class: 'ax-home', id: 'aet-home-extras', 'aria-label': 'Tutorials' });
    var wrapT = h('div', { class: 'axt-wrap' },
      h('h2', { class: 'axt-h', text: '🎓 Tutorial Announcements' }),
      h('p', { class: 'ax-lead', text: 'Upcoming and ongoing tutorial sessions from AET. Join, learn and grow.' }));
    var grid = h('div', { class: 'axt-list' });
    if (upcoming.length) upcoming.forEach(function (s, i) { grid.appendChild(tutorialCard(s, i === 0 ? withNotes : null)); });
    else grid.appendChild(notesOnlyCard(withNotes));
    wrapT.appendChild(grid);
    if (live.groupLink) {
      wrapT.appendChild(h('div', { class: 'axg', id: 'aet-group-strip' },
        svg(PEOPLE_ICON, 'axg-ic'),
        h('div', { class: 'axg-t' }, h('b', { text: 'Need help with a course?' }), h('span', { text: 'Join the AET Tutorial WhatsApp group.' })),
        h('a', { class: 'axg-btn', href: live.groupLink, target: '_blank', rel: 'noopener noreferrer' }, svg(WA_ICON, 'axg-wa'), 'Join Group')));
    }
    box.appendChild(wrapT);
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
    var box = h('div', { class: 'ax-req axr', id: 'ax-req-box', 'data-code': code },
      svg(HEADSET_ICON, 'axr-ic'),
      h('div', { class: 'axr-t' }, h('b', { text: 'Material Request' }), h('p', { text: "Need specific study materials? Request them here and we'll get back to you." })),
      h('button', { type: 'button', class: 'axr-btn', text: 'Request Materials →', onclick: async function () {
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
        var r = await Promise.all([api({ action: 'notices_list' }), api({ action: 'sessions_list' }), sb.from('hub_settings').select('key,value').eq('key', 'group_link')]);
        state.notices = r[0].notices; state.sessions = r[1].sessions;
        state.groupLink = (r[2] && !r[2].error && r[2].data && r[2].data[0] && r[2].data[0].value) || '';
        renderNt();
      } catch (e) { ntView.textContent = ''; ntView.appendChild(h('div', { class: 'axa-msg bad', text: e.message })); }
    }
    function squashImg(f, max) {
      return new Promise(function (resolve, reject) {
        var u = URL.createObjectURL(f), im = new Image();
        im.onload = function () {
          var w = im.naturalWidth, hh = im.naturalHeight, k = Math.min(1, max / Math.max(w, hh));
          var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(hh * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
          c.toBlob(function (b) {
            if (b && b.type === 'image/webp') return resolve({ blob: b, ext: 'webp', type: 'image/webp' });
            c.toBlob(function (j) { j ? resolve({ blob: j, ext: 'jpg', type: 'image/jpeg' }) : reject(new Error('Could not read that image.')); }, 'image/jpeg', 0.85);
          }, 'image/webp', 0.82);
        };
        im.onerror = function () { URL.revokeObjectURL(u); reject(new Error('That file is not a picture the browser can read.')); };
        im.src = u;
      });
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
      ntView.appendChild(groupPanel());
      ntView.appendChild(h('div', { class: 'axa-two' }, tutorialPanel(), noticePanel()));
    }

    // ---- tutorial group link (optional)
    function groupPanel() {
      var inp = h('input', { class: 'ax-in', type: 'url', maxlength: '300', placeholder: 'https://chat.whatsapp.com/...', value: state.groupLink || '' });
      var msg = h('div', { class: 'axa-msg', hidden: true });
      function bad(t) { msg.className = 'axa-msg bad'; msg.textContent = t; msg.hidden = false; }
      async function put(v, done) {
        msg.hidden = true;
        try { await api({ action: 'setting_save', key: 'group_link', value: v }); state.groupLink = v; renderNt(); say(done); }
        catch (e) { bad(e.message); }
      }
      return h('div', { class: 'axa-panel', style: 'margin-bottom:14px' },
        h('h3', { text: 'Tutorial group link' }),
        h('p', { class: 'ax-sub', text: 'Optional. When a link is saved, a "Join Group" strip shows under the Tutorial Announcements card on the home page. Leave it empty and no strip shows.' }),
        field('WhatsApp group link', inp, true), msg,
        h('div', { style: 'margin-top:12px;display:flex;gap:8px' },
          h('button', { type: 'button', class: 'ax-btn n', text: 'Save link', onclick: function () {
            var v = inp.value.trim();
            if (!v) return bad('Paste a link first, or use Remove link.');
            if (!/^https:\/\/\S+$/i.test(v)) return bad('The link must start with https://');
            put(v, 'Group link saved.');
          } }),
          state.groupLink ? h('button', { type: 'button', class: 'ax-btn g', text: 'Remove link', onclick: function () { put('', 'Group link removed.'); } }) : null));
    }

    // ---- notices
    function noticePanel() {
      var edit = state.editNotice;
      var title = h('input', { class: 'ax-in', type: 'text', maxlength: '120', value: edit ? edit.title : '' });
      var details = h('textarea', { class: 'ax-in', maxlength: '2000', rows: '6' }); details.value = edit && edit.details ? edit.details : '';
      var source = h('input', { class: 'ax-in', type: 'text', maxlength: '200', placeholder: 'A link (https://...) or a name, e.g. School portal', value: edit ? edit.source : '' });
      var ends = h('input', { class: 'ax-in', type: 'date', value: edit ? lagosParts(edit.ends_at).date : '' });
      var from = h('input', { class: 'ax-in', type: 'date', value: edit ? lagosParts(edit.shows_from).date : '' });
      var tag = h('select', { class: 'ax-in' }, [['', 'No tag'], ['open', 'Open'], ['closing_soon', 'Closing soon'], ['closed', 'Closed'], ['urgent', 'Urgent']].map(function (o) { return h('option', { value: o[0], text: o[1] }); }));
      tag.value = edit && edit.tag ? edit.tag : '';
      var imgIn = h('input', { class: 'ax-in', type: 'file', accept: 'image/*' });
      var dropImg = false;
      var imgPrev = h('div', { class: 'ax-fine' });
      if (edit && edit.image_path && notesUrl(edit.image_path)) {
        imgPrev.appendChild(h('img', { src: notesUrl(edit.image_path), alt: 'Current picture', style: 'width:56px;height:56px;object-fit:cover;border-radius:10px;display:block;margin-bottom:6px' }));
        imgPrev.appendChild(h('button', { type: 'button', class: 'ax-link', style: 'color:#b91c1c', text: 'Remove picture', onclick: function () { dropImg = true; imgPrev.textContent = 'The picture will be removed when you save.'; } }));
      }
      var detailsNote = h('div', { class: 'ax-fine' });
      function countDetails() { detailsNote.textContent = details.value.length + ' / 2000 characters. Line breaks are kept; the home page shows the first line, and the full text opens when a student taps the notice.'; }
      details.addEventListener('input', countDetails); countDetails();
      var msg = h('div', { class: 'axa-msg', hidden: true });
      var save = h('button', { type: 'button', class: 'ax-btn n', text: edit ? 'Save changes' : 'Publish notice', onclick: async function () {
        msg.hidden = true;
        if (!ends.value) { msg.className = 'axa-msg bad'; msg.textContent = 'Choose the date the notice disappears.'; msg.hidden = false; return; }
        var body = { action: 'notice_save', title: title.value, details: details.value, source: source.value, tag: tag.value || null, ends_at: lagosISO(ends.value, '23:59') };
        if (from.value) body.shows_from = lagosISO(from.value, '00:00');
        if (edit) { body.id = edit.id; body.image_path = dropImg ? null : (edit.image_path || null); }
        save.disabled = true;
        try {
          var im = imgIn.files && imgIn.files[0], newImg = null;
          if (im) {
            if (!/^image\//.test(im.type || '')) throw new Error('The picture must be a JPG, PNG or WebP image.');
            var sq = await squashImg(im, 400);
            var nm = im.name.replace(/\.[^.]*$/, '').replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 40) || 'notice';
            newImg = 'notice-images/' + Date.now() + '-' + nm + '.' + sq.ext;
            var up = await sb.storage.from(NOTES_BUCKET).upload(newImg, sq.blob, { contentType: sq.type, upsert: false });
            if (up.error) throw new Error('Could not upload the picture: ' + up.error.message);
            body.image_path = newImg;
          }
          await api(body);
          if (edit && edit.image_path && (newImg || dropImg)) { try { await sb.storage.from(NOTES_BUCKET).remove([edit.image_path]); } catch (e) {} }
          state.editNotice = null; await loadNt(); say(edit ? 'Notice updated.' : 'Notice published.');
        }
        catch (e) { msg.className = 'axa-msg bad'; msg.textContent = e.message; msg.hidden = false; save.disabled = false; }
      } });
      var panel = h('div', { class: 'axa-panel' },
        h('h3', { text: edit ? 'Edit notice' : 'Add a notice' }),
        h('p', { class: 'ax-sub', text: 'Every notice needs a source and an end date, so old information never looks current.' }),
        field('Title', title), field('Details', details, true), detailsNote, field('Source', source),
        h('div', { class: 'axa-g2' }, field('Starts on', from, true), field('Disappears on', ends)),
        field('Tag', tag, true),
        field('Picture', imgIn, true),
        h('div', { class: 'ax-fine', text: 'Optional, for example a logo. It is shrunk automatically. Without one, a small icon shows.' }),
        imgPrev, msg,
        h('div', { style: 'margin-top:14px;display:flex;gap:8px' }, save, edit ? h('button', { type: 'button', class: 'ax-btn g', text: 'Cancel', onclick: function () { state.editNotice = null; renderNt(); } }) : null));
      var labels = { open: 'OPEN', closing_soon: 'CLOSING SOON', closed: 'CLOSED', urgent: 'URGENT' };
      if (!state.notices.length) panel.appendChild(h('div', { class: 'axa-empty', style: 'margin-top:14px', text: 'No notices posted. Nothing shows on the home page.' }));
      state.notices.forEach(function (n) {
        var live = new Date(n.ends_at).getTime() > Date.now() && new Date(n.shows_from).getTime() <= Date.now();
        panel.appendChild(h('div', { class: 'axa-mini' },
          h('span', { class: 'ax-chip ' + (live ? 'open' : 'closed'), text: live ? 'LIVE' : (new Date(n.ends_at) > new Date() ? 'SCHEDULED' : 'ENDED') }),
          h('span', { class: 'grow', text: n.title + ' · until ' + fmtDay(n.ends_at) + (n.tag ? ' · ' + labels[n.tag] : '') }),
          h('button', { type: 'button', class: 'ax-link', text: 'Edit', onclick: function () { state.editNotice = n; renderNt(); } }),
          h('button', { type: 'button', class: 'ax-link', style: 'color:#b91c1c', text: 'Remove', onclick: async function () {
            try {
              await api({ action: 'notice_delete', id: n.id, keep_file: true });
              await loadNt();
              say('Notice removed.', async function () {
                await api({ action: 'notice_save', title: n.title, details: n.details, source: n.source, tag: n.tag, image_path: n.image_path || null, shows_from: n.shows_from, ends_at: n.ends_at });
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
      var flyerIn = h('input', { class: 'ax-in', type: 'file', accept: 'image/*' });
      var dropFlyer = false;
      var flyerPrev = h('div', { class: 'ax-fine' });
      if (edit && edit.flyer_path && notesUrl(edit.flyer_path)) {
        flyerPrev.appendChild(h('img', { src: notesUrl(edit.flyer_path), alt: 'Current flyer', style: 'width:72px;border-radius:8px;display:block;margin-bottom:6px' }));
        flyerPrev.appendChild(h('button', { type: 'button', class: 'ax-link', style: 'color:#b91c1c', text: 'Remove flyer', onclick: function () { dropFlyer = true; flyerPrev.textContent = 'The flyer will be removed when you save.'; } }));
      }
      function squash(f) {
        return new Promise(function (resolve, reject) {
          var u = URL.createObjectURL(f), im = new Image();
          im.onload = function () {
            var w = im.naturalWidth, hh = im.naturalHeight, k = Math.min(1, 800 / w);
            var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(hh * k);
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
            c.toBlob(function (b) {
              if (b && b.type === 'image/webp') return resolve({ blob: b, ext: 'webp', type: 'image/webp' });
              c.toBlob(function (j) { j ? resolve({ blob: j, ext: 'jpg', type: 'image/jpeg' }) : reject(new Error('Could not read that image.')); }, 'image/jpeg', 0.85);
            }, 'image/webp', 0.82);
          };
          im.onerror = function () { URL.revokeObjectURL(u); reject(new Error('That file is not a picture the browser can read.')); };
          im.src = u;
        });
      }
      var msg = h('div', { class: 'axa-msg', hidden: true });
      function bad(t) { msg.className = 'axa-msg bad'; msg.textContent = t; msg.hidden = false; }
      var save = h('button', { type: 'button', class: 'ax-btn n', text: edit ? 'Save changes' : 'Publish session', onclick: async function () {
        msg.hidden = true;
        if (!date.value || !time.value) return bad('Choose the date and time.');
        var body = { action: 'session_save', mode: mode, title: title.value, starts_at: lagosISO(date.value, time.value), note: note.value };
        if (mode === 'physical') body.venue = venue.value; else body.join_link = link.value;
        if (hideAt.value) body.hide_after = lagosISO(hideAt.value.slice(0, 10), hideAt.value.slice(11, 16));
        if (edit) { body.id = edit.id; body.notes_path = edit.notes_path || null; body.flyer_path = dropFlyer ? null : (edit.flyer_path || null); }
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
          var fl = flyerIn.files && flyerIn.files[0], newFly = null;
          if (fl) {
            if (!/^image\//.test(fl.type || '')) throw new Error('The flyer must be a picture (JPG, PNG or WebP).');
            var sq = await squash(fl);
            var fs = fl.name.replace(/\.[^.]*$/, '').replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 40) || 'flyer';
            newFly = 'tutorial-flyers/' + Date.now() + '-' + fs + '.' + sq.ext;
            var fu = await sb.storage.from(NOTES_BUCKET).upload(newFly, sq.blob, { contentType: sq.type, upsert: false });
            if (fu.error) throw new Error('Could not upload the flyer: ' + fu.error.message);
            body.flyer_path = newFly;
          }
          await api(body);
          if (uploaded && edit && edit.notes_path) { try { await sb.storage.from(NOTES_BUCKET).remove([edit.notes_path]); } catch (e) {} }
          if (edit && edit.flyer_path && (newFly || dropFlyer)) { try { await sb.storage.from(NOTES_BUCKET).remove([edit.flyer_path]); } catch (e) {} }
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
        field('Flyer picture', flyerIn, true),
        h('div', { class: 'ax-fine', text: 'Optional. Shown beside the card. It is shrunk automatically before upload.' }),
        flyerPrev,
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
                await api({ action: 'session_save', mode: s.mode, title: s.title, starts_at: s.starts_at, venue: s.venue, join_link: s.join_link, note: s.note, notes_path: s.notes_path, flyer_path: s.flyer_path || null, hide_after: s.hide_after });
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


/* ============================================================
   AET Learning Hub: polish (tighter CBT screen, submit pop-up,
   smaller gap above the footer, easier course ordering in admin)
   Remove this whole block to go back to how it was.
   ============================================================ */
(function () {
  'use strict';
  if (window.__aetPolish) return;
  window.__aetPolish = true;

  // ---------- styles ----------
  var css = [
    /* less empty space above the footer */
    'body.app-mode #app-view{padding-bottom:12px!important;min-height:0!important}',
    'body.app-mode #app-view .section{padding-bottom:22px}',
    '#courses.section{padding-bottom:26px}',
    '#cbt .section{padding-top:22px;padding-bottom:22px}',
    /* CBT: tighter */
    '.cbt-header-box{margin-bottom:16px}',
    '#quiz-stage .quiz-card{padding:18px}',
    '#quiz-stage .quiz-title{font-size:19px;margin-bottom:10px}',
    '#quiz-stage .quiz-rules{margin:0 0 14px 18px;gap:6px;font-size:14px;line-height:1.45}',
    '#quiz-stage .quiz-topbar{margin-bottom:8px}',
    '#quiz-stage .quiz-progress{margin-bottom:14px}',
    '#quiz-stage .quiz-card h3{font-size:17px;line-height:1.4;margin-bottom:14px}',
    '#quiz-stage .quiz-options{gap:8px}',
    '#quiz-stage .quiz-options button{padding:12px 14px;font-size:14.5px;border-radius:10px;gap:10px}',
    '#quiz-stage .quiz-nav-row{margin-top:16px}',
    '#quiz-stage .quiz-clear{margin-top:8px}',
    '#quiz-stage .quiz-grid{margin-top:16px;padding-top:14px;gap:6px;grid-template-columns:repeat(auto-fill,minmax(36px,1fr))}',
    '#quiz-stage .quiz-grid button{padding:6px 0}',
    '#quiz-stage .quiz-score{padding:4px 0 14px}',
    /* submit confirmation as a pop-up in the middle of the screen */
    '#quiz-stage .quiz-confirm{position:fixed;z-index:10000;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,400px);margin:0;padding:20px;background:#fff;border:0;border-radius:16px;box-shadow:0 0 0 100vmax rgba(5,7,71,.55),0 20px 50px rgba(0,0,0,.3)}',
    '#quiz-stage .quiz-confirm p{font-size:15px;margin-bottom:16px}',
    '#quiz-stage .quiz-confirm .quiz-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '#quiz-stage .quiz-confirm .rp-btn{width:100%;text-align:center;justify-content:center}',
    /* admin: compact, draggable course cards */
    '#admin-course-list.axc-on>div[data-axc]{display:flex!important;align-items:center;gap:8px;padding:7px 10px 7px 4px!important;margin-bottom:6px!important;background:#fff!important;border:1px solid #e5e7eb!important;border-radius:12px!important}',
    '#admin-course-list.axc-on>div[data-axc]>div:nth-child(2){flex:1;min-width:0}',
    '#admin-course-list.axc-on>div[data-axc]>div:nth-child(2)>div:nth-child(2){margin-top:1px!important;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#admin-course-list.axc-on>div[data-axc]>div:nth-child(2)>div:nth-child(3){display:none}',
    '#admin-course-list.axc-on>div[data-axc]>div:nth-child(3){margin-top:0!important;flex-wrap:nowrap!important;gap:6px!important;flex:none}',
    '#admin-course-list.axc-on .admin-move-up,#admin-course-list.axc-on .admin-move-down{display:none!important}',
    '#admin-course-list.axc-on .admin-edit-course,#admin-course-list.axc-on .admin-delete-course{padding:6px 10px!important;font-size:13px}',
    '.axc-grip{flex:none;width:28px;align-self:stretch;min-height:38px;display:grid;place-items:center;color:#9aa0b8;font-size:20px;line-height:1;letter-spacing:-3px;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}',
    '.axc-grip:active{cursor:grabbing}',
    '#admin-course-list>div.axc-drag{box-shadow:0 10px 24px rgba(8,11,99,.22)!important;border-color:#080b63!important;background:#f4f5ff!important;position:relative;z-index:5}'
  ].join('\n');
  var styleEl = document.createElement('style'); styleEl.id = 'aet-polish-css'; styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---------- quiz: result and error screens always start at the top ----------
  var lastCard = null;
  new MutationObserver(function () {
    var card = document.querySelector('#quiz-stage .quiz-card');
    if (!card || card === lastCard) return;
    lastCard = card;
    if (card.querySelector('.quiz-options') || card.querySelector('#quiz-start')) return; // normal question or intro: leave scroll alone
    try { card.scrollIntoView({ block: 'start', behavior: 'auto' }); window.scrollBy(0, -70); } catch (e) {}
  }).observe(document.body, { childList: true, subtree: true });

  // ---------- admin: drag to reorder courses ----------
  var cache = null, cacheAt = 0;
  function loadMap() {
    var sb = (typeof supabaseClient !== 'undefined') ? supabaseClient : null;
    if (!sb) return Promise.resolve(null);
    if (cache && Date.now() - cacheAt < 4000) return Promise.resolve(cache);
    return Promise.all([sb.from('courses').select('id,code,level_id,sort_order'), sb.from('levels').select('id,name')]).then(function (r) {
      if (r[0].error || r[1].error) return null;
      var lv = {}; (r[1].data || []).forEach(function (l) { lv[String(l.id)] = l.name; });
      var map = {};
      (r[0].data || []).forEach(function (c) { map[(lv[String(c.level_id)] || 'Unknown Level') + '|' + String(c.code || '').trim()] = c; });
      cache = map; cacheAt = Date.now(); return map;
    }).catch(function () { return null; });
  }

  function groupOf(list, it) {
    return [].filter.call(list.children, function (el) { return el.dataset && el.dataset.axc && el.dataset.axlevel === it.dataset.axlevel; });
  }

  function enhance(list) {
    var level = '', any = false;
    [].forEach.call(list.children, function (el) {
      var h4 = el.querySelector && el.querySelector('h4');
      if (h4) {
        level = h4.textContent.replace(/\s*\(\d+\)\s*$/, '').trim();
        var p = el.querySelector('p'); if (p) p.textContent = 'Hold the ⋮⋮ handle and drag a course up or down. It saves by itself.';
        return;
      }
      if (!el.querySelector || !el.querySelector('.admin-move-up')) return;
      el.dataset.axlevel = level;
      if (!el.dataset.axc) {
        el.dataset.axc = '1';
        var grip = document.createElement('span');
        grip.className = 'axc-grip'; grip.textContent = '⋮⋮'; grip.setAttribute('role', 'button'); grip.setAttribute('aria-label', 'Drag to reorder');
        el.insertBefore(grip, el.firstChild);
        grip.addEventListener('pointerdown', function (e) { if (e.button > 0) return; e.preventDefault(); startDrag(list, el, grip, e); });
      }
      any = true;
    });
    if (any) list.classList.add('axc-on');
  }

  function startDrag(list, it, grip, e) {
    var group = groupOf(list, it), before = group.slice();
    if (group.length < 2) return;
    it.classList.add('axc-drag');
    var scrollTimer = null, lastY = e.clientY;
    function place(y) {
      var others = groupOf(list, it).filter(function (o) { return o !== it; }), target = null;
      for (var i = 0; i < others.length; i++) {
        var r = others[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) { target = others[i]; break; }
      }
      if (target) { if (it.nextElementSibling !== target) list.insertBefore(it, target); }
      else { var last = others[others.length - 1]; if (last && last.nextElementSibling !== it) list.insertBefore(it, last.nextElementSibling); }
    }
    function move(ev) {
      lastY = ev.clientY; place(lastY);
      clearInterval(scrollTimer); scrollTimer = null;
      if (lastY < 90 || lastY > window.innerHeight - 90) {
        scrollTimer = setInterval(function () { window.scrollBy(0, lastY < 90 ? -14 : 14); place(lastY); }, 16);
      }
    }
    function end() {
      clearInterval(scrollTimer);
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end);
      it.classList.remove('axc-drag');
      var after = groupOf(list, it);
      if (after.every(function (el, i) { return el === before[i]; })) return;
      save(list, before, after);
    }
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
  }

  function restore(list, before) {
    var anchor = before[before.length - 1].nextElementSibling;
    before.forEach(function (el) { list.insertBefore(el, anchor); });
  }

  function say(text, bad) {
    var t = document.getElementById('axm-order-note');
    if (!t) {
      t = document.createElement('div'); t.id = 'axm-order-note';
      t.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:10001;padding:10px 16px;border-radius:12px;font:700 14px Arial,sans-serif;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.25)';
      document.body.appendChild(t);
    }
    t.style.background = bad ? '#b91c1c' : '#080b63'; t.textContent = text; t.style.display = 'block';
    clearTimeout(say.timer); say.timer = setTimeout(function () { t.style.display = 'none'; }, 2600);
  }

  function save(list, before, after) {
    var sb = (typeof supabaseClient !== 'undefined') ? supabaseClient : null;
    list.style.opacity = '.6'; list.style.pointerEvents = 'none';
    loadMap().then(function (map) {
      if (!sb || !map) throw new Error('no map');
      var rows = after.map(function (el) {
        var code = (el.querySelector('strong') || {}).textContent; code = String(code || '').trim();
        return map[el.dataset.axlevel + '|' + code];
      });
      if (rows.some(function (r) { return !r; })) throw new Error('unknown course');
      var chain = Promise.resolve();
      rows.forEach(function (row, position) {
        if (row.sort_order !== null && row.sort_order !== undefined && Number(row.sort_order) === position) return;
        chain = chain.then(function () {
          return sb.from('courses').update({ sort_order: position }).eq('id', row.id).select('id').then(function (r) {
            if (r.error || !r.data || !r.data.length) throw new Error('save failed');
            row.sort_order = position;
          });
        });
      });
      return chain;
    }).then(function () {
      cacheAt = 0;
      say('Order saved.');
      try { if (typeof refreshPublicCatalog === 'function') refreshPublicCatalog(); } catch (e) {}
    }).catch(function (err) {
      console.error('aet-polish order:', err);
      restore(list, before); cacheAt = 0;
      say('Could not save the new order. Nothing was lost.', true);
    }).then(function () { list.style.opacity = ''; list.style.pointerEvents = ''; });
  }

  // wait for the admin course list, then keep it enhanced after every redraw
  var watched = null, timer = null;
  setInterval(function () {
    var list = document.getElementById('admin-course-list');
    if (!list) return;
    if (list !== watched) {
      watched = list;
      new MutationObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(function () { try { enhance(list); } catch (e) { console.error('aet-polish:', e); } }, 60);
      }).observe(list, { childList: true });
    }
    if (!list.classList.contains('axc-on') && list.querySelector('.admin-move-up')) { try { enhance(list); } catch (e) {} }
  }, 800);
})();
