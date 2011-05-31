
WMD=src/header.js \
	src/wmd.core.js \
	src/wmd.defaults.js \
	src/wmd.util.js \
	src/wmd.pubsub.js \
	src/wmd.InputPoller.js \
	src/wmd.Selectivizer.js \
	src/wmd.plugins.standard.js \
	src/wmd.plugins.markright.js \
	src/footer.js

JSFILES=build/wmd.js build/showdown.js

all: build/wmd.js build/wmd.combined.js build/wmd.combined.min.js

build/wmd.js: $(WMD)
	cat $(WMD) > $@

build/wmd.combined.js: $(JSFILES)
	cat $(JSFILES) > $@

build/wmd.combined.min.js: $(JSFILES)
	cat $(JSFILES) | python jsmin.py > $@
