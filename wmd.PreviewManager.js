var PreviewManager = function (wmd) { // {{{
	var managerObj = this;
	var converter;
	var poller;
	var timeout;
	var elapsedTime;
	var oldInputText;
	var htmlOut;
	var maxDelay = 3000;
	var startType = "delayed"; // The other legal value is "manual"
	// Adds event listeners to elements and creates the input poller.
	var setupEvents = function (inputElem, listener) {

		util.addEvent(inputElem, "input", listener);
		inputElem.onpaste = listener;
		inputElem.ondrop = listener;

		util.addEvent(inputElem, "keypress", listener);
		util.addEvent(inputElem, "keydown", listener);
		// previewPollInterval is set at the top of this file.
		poller = new InputPoller(wmd.panels.input, listener, wmd.options.previewPollInterval);
	};

	var getDocScrollTop = function () {

		var result = 0;

		if (window.innerHeight) {
			result = window.pageYOffset;
		}
		else if (document.documentElement && document.documentElement.scrollTop) {
			result = document.documentElement.scrollTop;
		}
		else if (document.body) {
			result = document.body.scrollTop;
		}

		return result;
	};

	var makePreviewHtml = function () {

		// If there are no registered preview and output panels
		// there is nothing to do.
		if (!wmd.panels.preview && !wmd.panels.output) {
			return;
		}

		var text = wmd.panels.input.value;
		if (text && text == oldInputText) {
			return; // Input text hasn't changed.
		}
		else {
			oldInputText = text;
		}

		var prevTime = new Date().getTime();

		if (!converter && wmd.showdown) {
			converter = new wmd.showdown.converter();
		}

		if (converter) {
			text = converter.makeHtml(text);
		}

		// Calculate the processing time of the HTML creation.
		// It's used as the delay time in the event listener.
		var currTime = new Date().getTime();
		elapsedTime = currTime - prevTime;

		pushPreviewHtml(text);
		htmlOut = text;
	};

	// setTimeout is already used.  Used as an event listener.
	var applyTimeout = function () {

		if (timeout) {
			window.clearTimeout(timeout);
			timeout = undefined;
		}

		if (startType !== "manual") {

			var delay = 0;

			if (startType === "delayed") {
				delay = elapsedTime;
			}

			if (delay > maxDelay) {
				delay = maxDelay;
			}
			timeout = window.setTimeout(makePreviewHtml, delay);
		}
	};

	var getScaleFactor = function (panel) {
		if (panel.scrollHeight <= panel.clientHeight) {
			return 1;
		}
		return panel.scrollTop / (panel.scrollHeight - panel.clientHeight);
	};

	var setPanelScrollTops = function () {

		if (wmd.panels.preview) {
			wmd.panels.preview.scrollTop = (wmd.panels.preview.scrollHeight - wmd.panels.preview.clientHeight) * getScaleFactor(wmd.panels.preview);
		}

		if (wmd.panels.output) {
			wmd.panels.output.scrollTop = (wmd.panels.output.scrollHeight - wmd.panels.output.clientHeight) * getScaleFactor(wmd.panels.output);
		}
	};

	this.refresh = function (requiresRefresh) {

		if (requiresRefresh) {
			oldInputText = "";
			makePreviewHtml();
		}
		else {
			applyTimeout();
		}
	};

	this.processingTime = function () {
		return elapsedTime;
	};

	// The output HTML
	this.output = function () {
		return htmlOut;
	};

	// The mode can be "manual" or "delayed"
	this.setUpdateMode = function (mode) {
		startType = mode;
		managerObj.refresh();
	};

	var isFirstTimeFilled = true;

	var pushPreviewHtml = function (text) {

		var emptyTop = position.getTop(wmd.panels.input) - getDocScrollTop();

		// Send the encoded HTML to the output textarea/div.
		if (wmd.panels.output) {
			// The value property is only defined if the output is a textarea.
			if (wmd.panels.output.value !== undefined) {
				wmd.panels.output.value = text;
			}
			// Otherwise we are just replacing the text in a div.
			// Send the HTML wrapped in <pre><code>
			else {
				var newText = text.replace(/&/g, "&amp;");
				newText = newText.replace(/</g, "&lt;");
				wmd.panels.output.innerHTML = "<pre><code>" + newText + "</code></pre>";
			}
		}

		if (wmd.panels.preview) {
			// original WMD code allowed javascript injection, like this:
			//	  <img src="http://www.google.com/intl/en_ALL/images/srpr/logo1w.png" onload="alert('haha');"/>
			// now, we first ensure elements (and attributes of IMG and A elements) are in a whitelist
			// and if not in whitelist, replace with blanks in preview to prevent XSS attacks
			// when editing malicious markdown
			// code courtesy of https://github.com/polestarsoft/wmd/commit/e7a09c9170ea23e7e806425f46d7423af2a74641
			if (wmd.options.tagFilter.enabled) {
				text = text.replace(/<[^<>]*>?/gi, function (tag) {
					return (tag.match(wmd.options.tagFilter.allowedTags) || tag.match(wmd.options.tagFilter.patternLink) || tag.match(wmd.options.tagFilter.patternImage)) ? tag : "";
				});
			}
			wmd.panels.preview.innerHTML = text;
		}

		setPanelScrollTops();

		if (isFirstTimeFilled) {
			isFirstTimeFilled = false;
			return;
		}

		var fullTop = position.getTop(wmd.panels.input) - getDocScrollTop();

		if (browser.isIE) {
			window.setTimeout(function () {
				window.scrollBy(0, fullTop - emptyTop);
			}, 0);
		}
		else {
			window.scrollBy(0, fullTop - emptyTop);
		}
	};

	var init = function () {

		setupEvents(wmd.panels.input, applyTimeout);
		makePreviewHtml();

		if (wmd.panels.preview) {
			wmd.panels.preview.scrollTop = 0;
		}
		if (wmd.panels.output) {
			wmd.panels.output.scrollTop = 0;
		}
	};

	this.destroy = function () {
		if (poller) {
			poller.destroy();
		}
	};

	init();
};
