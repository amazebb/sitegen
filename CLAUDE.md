# CLAUDE.md

sitegen: `bin/md2html` and `bin/man2html` (Python 3 standard library only), the shared CSS/JS in `theme/`, a minimal `example/` and the reference `docs/SITEGEN.md`.

- `make docs`, `make example`, `make check` build and test; `docs/` is the Pages site and is built with the tools themselves. `docs/index.html`, `style.css`, `script.js` and `img/` are build output, untracked (the Pages workflow rebuilds them); never edit generated files.
- Changing a class the tools emit means updating `theme/style.css` and the Output classes table in `docs/SITEGEN.md`; changing `theme/` means rebuilding the consuming sites (nnn: `make docs` in `~/Code/GitHub/nnn`).
- Site-specific styling does not belong in `theme/`; sites add a `site.css` loaded after `style.css`.
- No `?v=` cache queries. Commit messages: conventional commits with `-` bullets.
