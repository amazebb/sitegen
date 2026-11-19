// Code blocks are plain text lines in the HTML (so a formatter cannot re-indent them). Mark each
// line here: a leading # is a comment (coloured, not copied), anything else is a command (copied).
document.querySelectorAll('.codeblock:not(.plain) pre').forEach((pre) => {
  const lines = pre.textContent.split('\n').map((l) => l.trim()).filter(Boolean);
  pre.textContent = '';
  lines.forEach((l, i) => {
    const span = document.createElement('span');
    span.className = l.startsWith('#') ? 'c' : 'line';
    span.textContent = l;
    pre.append(span);
    if (i < lines.length - 1) pre.append('\n');
  });
});

// Copy buttons for the install snippets.
document.querySelectorAll('.copy').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const pre = btn.parentElement.querySelector('pre');
    if (!pre) return;
    // Copy the commands only, not the comment lines.
    const text = Array.from(pre.querySelectorAll('.line'))
      .map((el) => el.textContent)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copied';
    } catch (e) {
      btn.textContent = 'Press Ctrl+C';
    }
    setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
  });
});

// Expand every manual section so the browser's find works across all of them.
const manAll = document.getElementById('man-all');
if (manAll) {
  manAll.addEventListener('click', () => {
    const secs = document.querySelectorAll('.man-sec, .man-sub');
    const open = Array.from(secs).some((d) => !d.open);
    secs.forEach((d) => { d.open = open; });
    manAll.textContent = open ? 'collapse everything' : 'expand everything';
  });
}

// Dark/Light switch for every screenshot: follows the page theme until a button is used.
const themeSwitch = document.querySelector('.theme-switch');
if (themeSwitch) {
  const btns = themeSwitch.querySelectorAll('button');
  const dark = window.matchMedia('(prefers-color-scheme: dark)');
  const show = (theme) => {
    document.documentElement.dataset.shot = theme;
    btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.theme === theme)));
  };
  show(dark.matches ? 'dark' : 'light');
  btns.forEach((b) => b.addEventListener('click', () => show(b.dataset.theme)));
}

// Page theme toggle (sun icon in the nav): follows the OS until used, then remembers the choice.
const themeBtn = document.querySelector('.theme-toggle');
if (themeBtn) {
  const root = document.documentElement;
  const osDark = window.matchMedia('(prefers-color-scheme: dark)');
  const current = () => root.dataset.theme || (osDark.matches ? 'dark' : 'light');
  const label = () => themeBtn.setAttribute('aria-label', 'Switch to ' + (current() === 'dark' ? 'light' : 'dark') + ' theme');
  label();
  themeBtn.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
  });
}

// A brief highlight on the element a link lands on: a section's title, a key's whole table row.
// A link that lands at the top of the screen is where people look, so only the others flash.
// Where the jump ends is worked out from the layout (not measured mid-scroll): the element's
// page position, limited by how far the page can scroll.
const flash = (target) => {
  const el = target.matches('details') ? target.querySelector(':scope > summary') : (target.closest('tr') || target);
  const y = el.getBoundingClientRect().top + window.scrollY;
  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  if (y - Math.min(Math.max(y, 0), maxY) < 120) return;
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
  el.addEventListener('animationend', () => el.classList.remove('flash'), { once: true });
};

// Deep links into the manual: open the collapsed sections around the target, then scroll to it.
// Going Back to an entry whose scroll position was saved (see below) returns to that exact spot.
// Only the manual does this itself; other pages keep the browser's own scroll restoration, so Back from
// the manual returns to the spot you left on the page that linked to it.
if (document.querySelector('.man') && 'scrollRestoration' in history) history.scrollRestoration = 'manual';
const openTarget = () => {
  if (!location.hash) return;
  let el = null;
  try { el = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
  if (!el) return;
  for (let d = el.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true;
  const st = history.state;
  if (st && typeof st.y === 'number') {
    // Put the link that was clicked back where it was on screen. A section opened since then may have
    // moved it, so the saved page position (y) is only the fallback.
    const link = typeof st.link === 'number' ? document.querySelectorAll('a[href^="#"]')[st.link] : null;
    const top = link ? link.getBoundingClientRect().top + window.scrollY - st.top : st.y;
    window.scrollTo({ top, behavior: 'instant' });
    return;
  }
  el.scrollIntoView();
  flash(el);
};
openTarget();
window.addEventListener('hashchange', openTarget);

// Remember where you were when you follow a link on the page, so Back lands there and not at the
// top of the section that was open.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const link = Array.prototype.indexOf.call(document.querySelectorAll('a[href^="#"]'), a);
  try {
    history.replaceState({ ...(history.state || {}), y: window.scrollY, link, top: a.getBoundingClientRect().top }, '', location.href);
  } catch (err) {}
});

// Keep the address in step with the section you last opened by hand, so Back returns to it
// instead of to an older deep link. Replacing the entry adds no history of its own.
document.addEventListener('click', (e) => {
  const sum = e.target.closest('details.man-sec > summary, details.man-sub > summary');
  if (!sum) return;
  const d = sum.parentElement;
  setTimeout(() => {
    let id = d.open ? d.id : '';
    if (!id) {
      const p = d.parentElement && d.parentElement.closest('details');
      if (p && p.open) id = p.id;
    }
    try { history.replaceState(history.state, '', location.pathname + location.search + (id ? '#' + id : '')); } catch (err) {}
  }, 0);
});

// Click a table header to sort the table by that column, A to Z; again for Z to A; a third time
// restores the original order.
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
document.querySelectorAll('table').forEach((table) => {
  const body = table.tBodies[0];
  const heads = table.tHead && table.tHead.rows[0] ? Array.from(table.tHead.rows[0].cells) : [];
  if (!body || !heads.length) return;
  Array.from(body.rows).forEach((row, i) => { row.dataset.order = i; });
  heads.forEach((th, col) => {
    th.classList.add('sortable');
    th.tabIndex = 0;
    const sort = () => {
      const next = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : th.getAttribute('aria-sort') === 'descending' ? '' : 'ascending';
      heads.forEach((h) => h.removeAttribute('aria-sort'));
      if (next) th.setAttribute('aria-sort', next);
      const dir = next === 'descending' ? -1 : 1;
      const text = (row) => (row.cells[col] ? row.cells[col].textContent.trim() : '');
      Array.from(body.rows)
        .sort((a, b) => next ? dir * collator.compare(text(a), text(b)) : a.dataset.order - b.dataset.order)
        .forEach((row) => body.append(row));
    };
    th.addEventListener('click', sort);
    th.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sort(); } });
  });
});
