---
title: example
description: A minimal site built with sitegen.
intro: A **minimal** site built with [sitegen](../): this page is `index.md`, the manual is `example.1`.
---

## Features {#features .cards}

Cards, tables, code blocks and links into the manual, all from markdown.

### Cards

Every `###` under a `{.cards}` section is a card. `-q` and `EXAMPLE_NAME` below link to the manual on their own. [See manual](man.html#environment).

### A wide card {.wide}

Add `{.wide}` to a heading to span both columns.

::: tags
!New, markdown, tables, code blocks
:::

## Install {#install}

Build from source.

```sh
# get it
git clone https://example.invalid/site.git
make
```

| Setting | Effect |
| --- | --- |
| `-q` | Print nothing |
| `EXAMPLE_NAME=you` | Who to greet |

::: note
Edit `index.md` and run `make example`; never edit the generated HTML.
:::
