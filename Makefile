
WMD=src/header.js src/wmd.core.js src/wmd.defaults.js src/wmd.util.js src/wmd.InputPoller.js src/footer.js
JSFILES=wmd.js showdown.js

all: wmd.js wmd.combined.js wmd.combined.min.js

wmd.js: $(WMD)
	cat $(WMD) > $@

wmd.combined.js: $(JSFILES)
	cat $(JSFILES) > $@

wmd.combined.min.js: $(JSFILES)
	cat $(JSFILES) | python jsmin.py > $@
