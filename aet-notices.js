/* AET Learning Hub: Notice Center upgrade (separate file, index.html untouched)
   - open notice uses the full card width
   - full-size picture (tap to enlarge)
   - no repeated preview / posted / source lines
   - Share on WhatsApp button
   - one notice open at a time, 3 shown with "See all"
   Works by tidying the notices that aet-extras.js already draws. */
(function () {
  'use strict';
  var SHOW = 3;

  var css = [
    '#aet-notices .axn-more{padding:0 2px 12px 2px}',
    '#aet-notices .axn-head.open .axn-prev{display:none}',
    '#aet-notices .axn-head.open .ax-ntitle{white-space:normal}',
    '.axn2-pic{display:block;width:100%;max-height:420px;object-fit:contain;background:#eef0f7;border:1px solid #e1e4f0;border-radius:12px;margin:2px 0 12px;cursor:zoom-in}',
    '.axn2-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px 0 6px;flex-wrap:wrap}',
    '.axn2-share{display:inline-flex;align-items:center;gap:7px;background:#e8f8ee;color:#12733a;border:1px solid #bfe8cd;border-radius:99px;padding:8px 14px;font-size:13px;font-weight:800;text-decoration:none}',
    '.axn2-share svg{width:16px;height:16px}',
    '.axn2-share:active{transform:scale(.97)}',
    '.axn2-all{display:block;width:100%;margin:6px 0 4px;padding:11px;border:1px solid #d9dcef;border-radius:12px;background:#f6f7fd;color:#080b63;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer}',
    '#aet-notices .ax-notice[data-extra="1"][hidden]{display:none}',
    '.axn2-lb{position:fixed;inset:0;z-index:99999;background:rgba(3,4,31,.92);display:flex;align-items:center;justify-content:center;padding:14px;cursor:zoom-out}',
    '.axn2-lb img{max-width:100%;max-height:100%;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.6)}',
    '.axn2-lb button{position:absolute;top:12px;right:12px;width:42px;height:42px;border-radius:50%;border:0;background:#fff;color:#080b63;font-size:22px;font-weight:800;cursor:pointer}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'axn2-style'; st.textContent = css; document.head.appendChild(st);

  var WA = '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0 0 12.04 2zm4.52 11.99c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29z"/></svg>';

  function txt(el) { return el ? (el.textContent || '').trim() : ''; }

  function lightbox(src) {
    var lb = document.createElement('div'); lb.className = 'axn2-lb';
    var im = document.createElement('img'); im.src = src; im.alt = '';
    var x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Close');
    function close() { if (lb.parentNode) lb.parentNode.removeChild(lb); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    lb.addEventListener('click', close); document.addEventListener('keydown', onKey);
    lb.appendChild(im); lb.appendChild(x); document.body.appendChild(lb);
  }

  function tidyOne(n) {
    if (n.getAttribute('data-axn2')) return;
    n.setAttribute('data-axn2', '1');
    var more = n.querySelector('.axn-more'); if (!more) return;
    var title = txt(n.querySelector('.ax-ntitle'));
    var full = txt(more.querySelector('.axn-full'));

    // 1. full picture
    var thumb = n.querySelector('.axn-img img');
    if (thumb && thumb.getAttribute('src')) {
      var src = thumb.getAttribute('src');
      var pic = document.createElement('img');
      pic.className = 'axn2-pic'; pic.alt = 'Picture for: ' + title; pic.loading = 'lazy'; pic.src = src;
      pic.addEventListener('click', function () { lightbox(src); });
      pic.addEventListener('error', function () { if (pic.parentNode) pic.parentNode.removeChild(pic); });
      more.insertBefore(pic, more.firstChild);
    }

    // 2. less repeating: drop "Posted .. until .." and a plain-text "Source: X"
    var meta = more.querySelector('.axn-meta');
    if (meta) {
      var spans = meta.querySelectorAll('span');
      if (spans[0]) spans[0].style.display = 'none';
      if (!meta.querySelector('a')) meta.style.display = 'none';
      else if (spans[1]) spans[1].firstChild && (spans[1].firstChild.nodeType === 3) && (spans[1].firstChild.nodeValue = '');
    }

    // 3. share on WhatsApp
    var msg = '*' + title + '*' + (full ? '\n\n' + full : '') + '\n\nAET Learning Hub: ' + location.origin;
    var a = document.createElement('a');
    a.className = 'axn2-share'; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.href = 'https://wa.me/?text=' + encodeURIComponent(msg);
    a.setAttribute('data-track', 'share-notice');
    a.innerHTML = WA + '<span>Share</span>';
    var row = document.createElement('div'); row.className = 'axn2-row'; row.appendChild(a);
    var warn = more.querySelector('.axn-warn');
    if (warn) more.insertBefore(row, warn); else more.appendChild(row);
  }

  var busy = false;
  function openHead(n) { return n.querySelector('.axn-head.open'); }

  function tidyCard(card) {
    var list = Array.prototype.slice.call(card.querySelectorAll('.ax-notice'));
    list.forEach(tidyOne);

    // 4. one open at a time
    if (!card.getAttribute('data-axn2-acc')) {
      card.setAttribute('data-axn2-acc', '1');
      card.addEventListener('click', function (e) {
        if (busy) return;
        var head = e.target.closest && e.target.closest('.axn-head'); if (!head) return;
        setTimeout(function () {
          if (!head.classList.contains('open')) return;
          busy = true;
          card.querySelectorAll('.axn-head.open').forEach(function (h) { if (h !== head) h.click(); });
          busy = false;
        }, 0);
      }, false);
    }

    // 5. show 3, "See all" for the rest
    if (list.length > SHOW && !card.querySelector('.axn2-all')) {
      var extra = list.slice(SHOW);
      extra.forEach(function (n) { n.setAttribute('data-extra', '1'); n.hidden = true; });
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'axn2-all';
      var shown = false;
      function label() { btn.textContent = shown ? 'Show fewer' : 'See all ' + list.length + ' notices'; }
      label();
      btn.addEventListener('click', function () {
        shown = !shown; extra.forEach(function (n) { n.hidden = !shown; }); label();
      });
      var warn = card.querySelector(':scope > .axn-warn');
      if (warn) card.insertBefore(btn, warn); else card.appendChild(btn);
    }
  }

  function run() {
    var c = document.getElementById('aet-notices');
    if (c) tidyCard(c);
  }
  var t = null;
  function soon() { if (t) return; t = setTimeout(function () { t = null; run(); }, 60); }
  new MutationObserver(soon).observe(document.body, { childList: true, subtree: true });
  run();
})();