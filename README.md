# sitegen

Small static-site generator for any host that serves static files (GitHub Pages, Netlify, S3, nginx, `python3 -m http.server`): two Python scripts (standard library only), a shared CSS/JS theme, and a convention for how they fit together.

| Piece | What it does |
| --- | --- |
| `bin/md2html` | markdown page + template to HTML (cards, tables, code blocks with a Copy button, links into the man page) |
| `bin/man2html` | mandoc man page + template to collapsible HTML sections with deep-link anchors (needs `mandoc`) |
| `theme/` | `style.css` (light/dark), `script.js` (theme toggle, copy buttons, deep links) and `icons.svg` |
| `example/` | a minimal site to copy |
| `docs/` | the reference, `SITEGEN.md`, built with sitegen itself |

```sh
make docs      # build docs/index.html
make example   # build example/public/
make check     # both, plus a dead-link test
```

[Documentation](https://amazebb.github.io/sitegen/) · [Example site](https://amazebb.github.io/sitegen/example/)
