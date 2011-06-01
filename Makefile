
WMD=src/01_closure.open.js \
	src/05_core.js \
	src/10_util.js \
	src/20_MinPubSub.js \
	src/21_InputPoller.js \
	src/22_Selectivizer.js \
	src/50_plugins.bold_italic.js \
	src/50_plugins.code_quote.js \
	src/50_plugins.lists.js \
	src/50_plugins.link.js \
	src/50_plugins.image.js \
	src/50_plugins.heading.js \
	src/50_plugins.hr.js \
	src/55_plugins.markright.js \
	src/59_plugins.help.js \
	src/59_plugins.undo.js \
	src/99_closure.close.js

JSFILES=src/00_header.js build/wmd.js build/showdown.js

all: build/wmd.js build/wmd.combined.js build/wmd.combined.min.js

build/wmd.js: $(WMD)
	rm -f $@
	cat $(WMD) > $@

build/wmd.combined.js: $(JSFILES)
	rm -f $@
	cat $(JSFILES) > $@

build/wmd.combined.min.js: build/wmd.combined.js
	rm -f $@
	cat src/00_header.js >> $@
	curl -s --data-urlencode 'js_code@build/wmd.combined.js' --data-urlencode 'output_format=text' \
		--data-urlencode 'output_info=compiled_code' http://closure-compiler.appspot.com/compile \
		>> $@