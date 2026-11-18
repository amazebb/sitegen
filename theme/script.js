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
const openTarget = () => {
  if (!location.hash) return;
  let el = null;
  try { el = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) {}
  if (!el) return;
  for (let d = el.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true;
  el.scrollIntoView();
  flash(el);
};
openTarget();
window.addEventListener('hashchange', openTarget);

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
