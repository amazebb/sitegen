# sitegen: build the documentation site (docs/) and the example site (example/public/)
# with the tools in bin/ and the shared theme in theme/.
.PHONY: docs example check clean

THEME = theme/style.css theme/script.js

docs:
	mkdir -p docs/img
	cp $(THEME) docs/
	cp theme/icons.svg docs/img/icons.svg
	bin/md2html -T docs/index.template.html -o docs/index.html docs/SITEGEN.md

example:
	mkdir -p example/public/img
	cp $(THEME) example/public/
	cp theme/icons.svg example/public/img/icons.svg
	bin/man2html -T example/man.template.html -o example/public/man.html example/example.1
	bin/md2html -T example/index.template.html -a example/public/man.html -o example/public/index.html example/index.md

# both sites must build, and a dead link must fail the build
check: docs example
	@printf -- '---\ntitle: t\n---\n\n## A {#a}\n\n[x](#missing)\n' > /tmp/sitegen-dead.md
	@if bin/md2html -o /tmp/sitegen-dead.html /tmp/sitegen-dead.md 2>/dev/null; then echo "FAIL: dead link was accepted"; exit 1; else echo "ok: dead link rejected"; fi

clean:
	rm -rf example/public
