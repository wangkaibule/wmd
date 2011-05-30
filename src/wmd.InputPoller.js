// Watches the input/textarea, polling at an interval and runs
// a callback function if anything has changed.
var InputPoller = function (textarea, callback, interval) {
	var self = this;
	
	// Stored start, end and text.  Used to see if there are changes to the input.
	var lastStart;
	var lastEnd;
	var lastContents;

	var timeoutHandle; // Used to cancel monitoring on destruction.	
	
	var hasChanged = function () {
		// Update the selection start and end, text.
		if (textarea.selectionStart || textarea.selectionStart === 0) {
			//first we test the text selection, since this is faster than a string comparison and it's unlikely the contents changed if the selection hasn't
			var start = textarea.selectionStart;
			var end = textarea.selectionEnd;
			if (start != lastStart || end != lastEnd) {				
				lastStart = start;
				lastEnd = end;
				
				//selection has changed, now verify the contents changed
				if (lastContents != textarea.value) {
					lastContents = textarea.value;
					return true;
				}
			}
		}
		return false;
	};


	var checkForUpdate = function () {
		if (!util.isVisible(textarea)) return; //text area isn't visible, no need to update

		if (hasChanged()) callback();
		
		timeoutHandle = window.setInterval(checkForUpdate, interval);
	};

	checkForUpdate();
};