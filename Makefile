
WMD=src/01_closure.open.js \
	src/05_core.js \
	src/10_util.js \
	src/20_MinPubSub.js \
	src/21_InputPoller.js \
	src/22_Selectivizer.js \
	src/50_plugins.standard.js \
	src/60_plugins.markright.js \
	src/55_plugins.undo.js \
	src/99_closure.close.js

JSFILES=src/00_header.js build/wmd.js build/showdown.js

all: build/wmd.js build/wmd.combined.js build/wmd.combined.min.js

build/wmd.js: $(WMD)
	cat $(WMD) > $@

build/wmd.combined.js: $(JSFILES)
	cat $(JSFILES) > $@

build/wmd.combined.min.js: build/wmd.combined.js
	rm -f $@
	cat src/00_header.js >> $@
	curl -s --data-urlencode 'js_code@build/wmd.combined.js' --data-urlencode 'output_format=text' \
		--data-urlencode 'output_info=compiled_code' http://closure-compiler.appspot.com/compile \
		>> $@