// Watches the input textarea, polling at an interval and runs
// a callback function if anything has changed.
var InputPoller = function (textarea, callback, interval) { // {{{
	var pollerObj = this;
	var inputArea = textarea;

	// Stored start, end and text.  Used to see if there are changes to the input.
	var lastStart;
	var lastEnd;
	var markdown;

	var killHandle; // Used to cancel monitoring on destruction.
	// Checks to see if anything has changed in the textarea.
	// If so, it runs the callback.
	this.tick = function () {

		if (!util.isVisible(inputArea)) {
			return;
		}

		// Update the selection start and end, text.
		if (inputArea.selectionStart || inputArea.selectionStart === 0) {
			var start = inputArea.selectionStart;
			var end = inputArea.selectionEnd;
			if (start != lastStart || end != lastEnd) {
				lastStart = start;
				lastEnd = end;

				if (markdown != inputArea.value) {
					markdown = inputArea.value;
					return true;
				}
			}
		}
		return false;
	};


	var doTickCallback = function () {

		if (!util.isVisible(inputArea)) {
			return;
		}

		// If anything has changed, call the function.
		if (pollerObj.tick()) {
			callback();
		}
	};

	// Set how often we poll the textarea for changes.
	var assignInterval = function () {
		killHandle = window.setInterval(doTickCallback, interval);
	};

	this.destroy = function () {
		window.clearInterval(killHandle);
	};

	assignInterval();
};