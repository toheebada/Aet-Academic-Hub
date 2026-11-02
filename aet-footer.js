/* AET Learning Hub: footer layout (separate file; index.html only loads it with one script line) */
(function () {
  'use strict';
  if (window.__aetFooter) return;
  window.__aetFooter = true;

  var CSS = [
    '.af{max-width:1180px;margin:0 auto}',
    '.af-grid{display:grid;grid-template-columns:1fr;gap:26px}',
    '.af-brand{display:flex;flex-wrap:wrap;align-items:center;align-content:flex-start;gap:12px 14px}',
    '.af-logo{width:46px;height:46px;border-radius:50%;object-fit:cover;background:#fff;box-shadow:0 0 0 2px rgba(255,210,28,.55)}',
    '.af-name{font-size:18px;font-weight:800;color:#fff;line-height:1.2}',
    '.af-sub{display:block;font-size:13px;color:#aeb2d6;margin-top:2px;font-weight:500}',
    '.af-tag{flex-basis:100%;margin:2px 0 0!important;color:#ffd21c!important;font-weight:800;font-size:13.5px!important}',
    '.af-h{font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:#8d92c4;font-weight:800;margin:0 0 10px}',
    '.af-links{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.af-links .footer-link,.af-links #install-wrap .footer-link{display:flex;align-items:center;gap:9px;min-height:44px;padding:9px 12px;border-radius:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);color:#fff;text-decoration:none;font-weight:700;font-size:13.5px;line-height:1.2}',
    '.af-links .footer-link:hover,.af-links .footer-link:focus-visible{background:rgba(255,255,255,.14);color:#fff}',
    '.af-links .footer-link svg{flex:none;width:18px;height:18px;color:#ffd21c}',
    '.af-links #install-wrap{display:contents}',
    '.af-links #install-wrap[hidden]{display:none!important}',
    '.af-links #install-link{order:1}.af-links #share-site-link{order:2}.af-links #ax-footer-req{order:3}.af-links #aa-footer-link{order:4}',
    '.af-help p{margin:0 0 10px!important;font-size:13.5px!important;line-height:1.5}',
    '.af-wa{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;background:rgba(37,211,102,.13);border:1px solid rgba(37,211,102,.55);color:#fff;text-decoration:none}',
    '.af-wa:hover,.af-wa:focus-visible{background:rgba(37,211,102,.22);color:#fff}',
    '.af-wa svg{flex:none;width:26px;height:26px;color:#4be08a}',
    '.af-wa b{display:block;font-size:14.5px;line-height:1.25}.af-wa span{display:block;font-size:13px;color:#cfe9da;margin-top:1px}',
    '.af-bar{margin-top:26px;padding-top:16px;border-top:1px solid rgba(255,255,255,.12);display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:space-between;font-size:12.5px;color:#8d92c4}',
    '.af-bar p{flex-basis:100%;margin:0!important;font-size:12px!important}',
    'footer.af-on .footer-inner{display:none}',
    '@media (min-width:820px){.af-grid{grid-template-columns:1.25fr 1fr 1fr;gap:48px}.af-links{grid-template-columns:1fr 1fr}.af-bar{margin-top:34px}}'
  ].join('\n');

  var ICONS = {
    'install-link': '<path d="M12 3v11"/><path d="m8 10 4 4 4-4"/><rect x="5" y="3" width="14" height="18" rx="3" opacity="0"/><path d="M5 17v1a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-1"/>',
    'share-site-link': '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    'ax-footer-req': '<path d="M4 5h16v11H4z" opacity="0"/><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="M12 9v6M9 12h6"/>',
    'aa-footer-link': '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>'
  };
  function svg(inner) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>'; }

  function decorate(a) {
    if (!a || !ICONS[a.id] || a.querySelector('svg')) return;
    a.insertAdjacentHTML('afterbegin', svg(ICONS[a.id]));
  }

  function build() {
    var footer = document.querySelector('footer');
    var inner = footer && footer.querySelector('.footer-inner');
    if (!footer || !inner || footer.classList.contains('af-on')) return;

    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

    var logoSrc = (document.querySelector('.brand-logo') || {}).src || '';
    var waHref = (inner.querySelector('a[href*="wa.me/2348050804036"]') || {}).href || 'https://wa.me/2348050804036';

    var root = document.createElement('div'); root.className = 'af';
    root.innerHTML =
      '<div class="af-grid">' +
        '<div class="af-brand">' +
          (logoSrc ? '<img class="af-logo" alt="" src="' + logoSrc + '">' : '') +
          '<div><span class="af-name">AET Learning Hub</span><span class="af-sub">Academic Excellence Team (AET)</span></div>' +
          '<p class="af-tag">Learn Better. Prepare Better. Become Better.</p>' +
        '</div>' +
        '<nav class="af-col" aria-label="Quick links"><h4 class="af-h">Quick links</h4><div class="af-links"></div></nav>' +
        '<div class="af-col af-help"><h4 class="af-h">Need help?</h4><p>Questions, or found a mistake? Message us on WhatsApp.</p>' +
          '<a class="af-wa" target="_blank" rel="noopener" href="' + waHref + '">' + svg('<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5A8.5 8.5 0 1 1 21 11.5z"/><path d="M9 8.5c0 3.5 2.5 6 6 6l1.2-1.4-2-1-.9.6c-.8-.3-1.6-1.1-1.9-1.9l.6-.9-1-2z"/>') + '<div><b>Chat with us</b><span>0805 080 4036</span></div></a>' +
        '</div>' +
      '</div>' +
      '<div class="af-bar"><span>© 2026 Academic Excellence Team</span><span>Built for FUTMinna students</span></div>';

    var box = root.querySelector('.af-links');
    var wrap = document.getElementById('install-wrap');
    if (wrap) { [].slice.call(wrap.childNodes).forEach(function (n) { if (n.nodeType === 3) wrap.removeChild(n); }); box.appendChild(wrap); }
    ['share-site-link', 'ax-footer-req', 'aa-footer-link'].forEach(function (id) { var a = document.getElementById(id); if (a) box.appendChild(a); });
    var note = document.getElementById('stats-note'); if (note) root.querySelector('.af-bar').appendChild(note);

    footer.insertBefore(root, inner); footer.classList.add('af-on');

    function tidy() {
      [].forEach.call(box.querySelectorAll('a'), decorate);
      [].slice.call(box.childNodes).forEach(function (n) { if (n.nodeType === 3) box.removeChild(n); });
      ['ax-footer-req', 'aa-footer-link'].forEach(function (id) { var a = document.getElementById(id); if (a && a.parentNode !== box && !box.contains(a)) box.appendChild(a); });
      [].forEach.call(box.querySelectorAll('a'), decorate);
    }
    tidy();
    new MutationObserver(tidy).observe(box, { childList: true });
    // links added by the other files after this one ran
    var tries = 0, t = setInterval(function () { tidy(); if (++tries > 20) clearInterval(t); }, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
