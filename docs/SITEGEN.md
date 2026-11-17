---
title: sitegen
description: Two small Python scripts, a CSS/JS theme and a set of conventions for building static documentation sites from markdown and man pages.
intro: Write the page text in **markdown** and the reference in a **man page**; sitegen turns both into one styled, linked static site. Standard library Python only, no build chain, no package manager.
---

## Overview {#overview}

A site is a few source files, a template shell and a copy of the shared theme. The generators fill the shell and write plain HTML, so the result can be served from GitHub Pages as is.

| Source | Tool | Output |
| --- | --- | --- |
| `index.md` (markdown, optional includes from other `.md` files) | `md2html` | `index.html` |
| `program.1` (mdoc or man page) | `man2html` | `man.html` |
| `theme/style.css`, `theme/script.js`, `theme/icons.svg` | copied | `style.css`, `script.js`, `img/icons.svg` |

The generated `.html` files are build output: edit the sources and rebuild, never the HTML. The man page is built first, because `md2html` reads its ids to turn code like `NNN_PILL=0` into links.

## Quick start {#quick-start}

Copy `example/` as the start of a site, then:

```sh
# theme files go next to the pages (Pages serves one folder)
cp theme/style.css theme/script.js site/
cp theme/icons.svg site/img/icons.svg
# man page first, then the page that links into it
bin/man2html -T site/man.template.html -o site/man.html program.1
bin/md2html  -T site/index.template.html -a site/man.html -o site/index.html site/index.md
```

`make example` in this repository does exactly that, and `make check` also fails if a dead link slips through.

## A site's files {#files}

| File | Role |
| --- | --- |
| `index.md` | page text and structure: front matter, sections, cards, tables |
| `index.template.html` | the page shell: hero, anything that is not markdown, `@BODY@` |
| `man.template.html` | the shell around the man page, `@MAN@` |
| `head.html`, `nav.html`, `foot.html` | parts shared by every template, pulled in with `@include(...)@` |
| `style.css`, `script.js`, `img/icons.svg` | the theme, copied from `theme/` |
| `site.css` | optional: styles for this site only, loaded after `style.css` |

## md2html {#md2html}

```sh
md2html [-T TEMPLATE] [-a ANCHORS.html] [-o OUT] FILE.md
```

| Option | Meaning |
| --- | --- |
| `-T` | page template; without it a minimal built-in page is used |
| `-a` | a page whose ids are link targets, normally the `man2html` output |
| `-o` | output file (default: the markdown file with `.html`) |

The exit status is 1 when a link to the manual or to an id on the page does not exist; the page is still written.

### Front matter

Keys between `---` lines at the top become template placeholders: `title: X` fills `@TITLE@` (plain text, escaped) and `@title@` (inline markdown). A value may continue on indented lines.

### Markdown

| Syntax | Result |
| --- | --- |
| `# ` to `#### ` headings, with `{#id .class}` | headings; see sections below |
| blank-line separated text | paragraphs |
| `- ` items | an unordered list |
| `\| a \| b \|` with a `\| --- \|` row | a table in `div.table-wrap` |
| fenced code | a dark code panel; `sh`, `bash`, `console` and `shell` fences also get a Copy button |
| `` `code` ``, `**bold**`, `*em*`, `[text](url)` | inline markup |
| raw tags such as `<kbd>y</kbd>` and entities such as `&rsquo;` | passed through unchanged |
| a line starting with `<div`, `<figure`, `<details`, `<table` and so on | a raw HTML block, up to the next blank line |
| `<!-- comment -->` | removed |

### Sections and cards

`## Title {#id}` opens a `section` with that id (the slug of the title when omitted). The first paragraph after it is the lede. Any `###` or deeper heading is a `h3.sub` sub heading.

With `{.cards}` on the `##` heading, each `###` becomes a card in a grid instead, and `{.wide}` on a card heading makes it span the row:

```md
## What's new {#features .cards}

Lede paragraph.

### A card

Text for the card.

### A wide card {.wide}

Text.
```

### Containers

A container opens with `::: name` and closes with `:::`.

| Container | Result |
| --- | --- |
| `::: tags` | a row of pills from a comma separated line; a leading `!` marks a highlighted one (`!New, Rex, chafa`) |
| `::: details Summary text` | a collapsible `details.fold`; the body is markdown |
| `::: note` | a small muted paragraph |

### Directives

A directive is a line of its own. A section is named by the GitHub style slug of its heading, so `## Sort keys (t / s / e)` is `sort-keys-t--s--e`.

| Directive | Pulls in |
| --- | --- |
| `{{include FILE#slug}}` | everything under that heading of another markdown file (deeper headings become sub headings) |
| `{{table FILE#slug N}}` | the Nth table of that section (the first when N is omitted) |
| `{{code FILE#slug N}}` | the Nth fenced code block of that section |

Paths are relative to the file that contains the directive. This keeps reference tables in one place: the page includes them from the project's own documentation.

### Links into the manual

With `-a man.html`, an inline code span that is exactly `ENV_VAR` or `ENV_VAR=value` (upper case words joined by underscores) links to `man.html#ENV_VAR`, and `-G` links to `man.html#opt-G`, whenever `man2html` produced that id. Code spans inside link text are never linked. In a table whose first header is `Key`, the code spans of the first column are drawn as `<kbd>`, with `Ctrl+B` as two keys and `;;` as two semicolons.

### Output classes

| Class | Element | Styled in the theme as |
| --- | --- | --- |
| `.lede` | first paragraph of a section | muted intro text |
| `.cards`, `.card`, `.wide` | card grid and cards | panel with a border and rounded corners |
| `.table-wrap` | wrapper of every table | bordered, scrolls sideways when narrow |
| `.sub` | `h3` outside cards | sub heading |
| `.codeblock`, `.copy`, `.c`, `.line` | code block; `.plain` has no Copy button | dark terminal panel (see script.js) |
| `.tags`, `.new` | pill row, highlighted pill | outlined pills, accent filled |
| `.fold` | `details` container | muted clickable summary |
| `.note` | note container | small muted text |
| `.nowrap` | code such as `-lncurses` | no line break inside |

## man2html {#man2html}

```sh
man2html [-T TEMPLATE] [-t TITLE] [-o OUT] MANFILE
```

It runs `mandoc -Thtml -O fragment` (install `mandoc`) and rebuilds the result as collapsible sections. The default title is `name(section)`, so `nnn.1` becomes `nnn(1)`; the default output is the man file with `.html` appended.

| Man page element | HTML |
| --- | --- |
| `.Sh NAME` | `details.man-sec` with a slug id (`#name`); NAME and SYNOPSIS start open |
| `.Ss Navigation` | nested `details.man-sub`, id `#navigation` |
| body of either | `div.man-body`, with mandoc's own classes inside (`.Bd`, `.Bl-tag`, `.Fl`, ...) |
| a paragraph starting `\fBVAR:\fR` | the paragraph gets `id="VAR"` |
| a paragraph starting with `.Fl x` | the paragraph gets `id="opt-x"` |
| one bold-italic letter, `\f(BIX\fR` | an underlined mnemonic key, the letter in `<u>` |
| a bare `https://...` | a link |

Permalink anchors from mandoc are dropped. A link to a closed section still works: `script.js` opens the sections around the target.

## Templates and parts {#templates}

| Placeholder | In | Replaced with |
| --- | --- | --- |
| `@BODY@` | `md2html` templates | the converted markdown |
| `@MAN@` | `man2html` templates | the section markup |
| `@TITLE@` | `man2html` templates | the page title |
| `@KEY@` | `md2html` templates | the front matter value `key`, as escaped plain text (for attributes and titles) |
| `@key@` | `md2html` templates | the same value as inline markdown (for paragraphs) |
| `@include(file)@` | both | the file, from the template's own folder |

Put what every page shares in `head.html` (meta tags, `style.css`, the theme boot script), `nav.html` and `foot.html` (the `script.js` tag). Browsers cannot include HTML themselves, so the tools copy these parts into each page at build time. Use links such as `index.html#features` in `nav.html` so the same nav works on every page. There is no version query on the stylesheet or script: Pages sets its own caching.

## Theme {#theme}

`theme/style.css` is a single stylesheet for the classes above plus the man page, with light and dark colours. A site copies it unchanged and adds `site.css` after it for anything of its own, such as a hero or a facts row.

| Variable | Used for |
| --- | --- |
| `--paper`, `--ink`, `--muted`, `--line`, `--panel` | page, text, secondary text, borders, card background |
| `--accent`, `--accent-ink` | buttons, links, highlighted pills and their text |
| `--code-bg` | inline code, key caps, hover backgrounds |
| `--mono`, `--serif`, `--ui` | font stacks |
| `--t-bg`, `--t-fg`, `--t-dim` | the dark code block |

Dark mode follows the system setting until the toggle is used. The toggle sets `data-theme="dark"` or `"light"` on `<html>`, and the stylesheet's colour variables switch on that attribute; the stored choice is applied by the boot script in `head.html` before the page paints, so there is no flash.

Animation lives in CSS: the manual's disclosure arrow turns with a transition, hover colours change in place, and a site can add its own (n3's headline flip is a few rules in its `site.css`, with a `prefers-reduced-motion` override).

The theme also has two optional pieces: `.tags .new` style pills, and paired screenshots, a `figure.shot` holding `img.th-light` and `img.th-dark` of which the page theme shows one.

## script.js {#script}

`theme/script.js` is plain JavaScript with no dependencies. Every feature does nothing when the element it works on is absent.

| Feature | Looks for | Does |
| --- | --- | --- |
| Code blocks | `.codeblock pre` (not `.plain`) | splits the text into lines: a line starting with `#` becomes `span.c` (dimmed, not copied), the rest `span.line` |
| Copy button | `.copy` | copies the `span.line` text of its block to the clipboard and shows "Copied" |
| Theme toggle | `.theme-toggle` | switches `data-theme` on `<html>`, remembers it in `localStorage` under `theme`, updates its aria label; the sun and moon icons are swapped by CSS |
| Expand all | `#man-all` | opens or closes every manual section so the browser's find works across them |
| Deep links | the URL fragment | opens every `details` around the target of `#id`, then scrolls to it |
| Screenshot switch | `.theme-switch` | a Dark and Light button pair that overrides which paired screenshot shows (`data-shot` on `<html>`) |

## Conventions {#conventions}

- Edit sources, rebuild, commit the generated HTML if the site is served from the repository.
- Build the man page before the pages that link to it.
- Keep code blocks as plain text lines in markdown and HTML; the script marks the comments.
- Reference tables live once, in the project's own markdown, and are pulled in with `{{table}}` and `{{include}}`.
- Format-on-save editors can re-indent hand written HTML; generated files are rewritten by the next build.
