
WMD=src/closure.open.js \
	src/wmd.core.js \
	src/wmd.defaults.js \
	src/wmd.util.js \
	src/wmd.pubsub.js \
	src/wmd.InputPoller.js \
	src/wmd.Selectivizer.js \
	src/wmd.plugins.standard.js \
	src/wmd.plugins.markright.js \
	src/closure.close.js

JSFILES=src/header.js build/wmd.js build/showdown.js

all: build/wmd.js build/wmd.combined.js build/wmd.combined.min.js

build/wmd.js: $(WMD)
	cat $(WMD) > $@

build/wmd.combined.js: $(JSFILES)
	cat $(JSFILES) > $@

build/wmd.combined.min.js: build/wmd.combined.js
	rm -f $@
	cat src/header.js >> $@
	curl -s --data-urlencode 'js_code@build/wmd.combined.js' --data-urlencode 'output_format=text' \
		--data-urlencode 'output_info=compiled_code' http://closure-compiler.appspot.com/compile \
		>> $@