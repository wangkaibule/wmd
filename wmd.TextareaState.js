// The input textarea state/contents.
// This is used to implement undo/redo by the undo manager.
var TextareaState = function (textarea, wmd) {
	// Aliases
	var stateObj = this;
	var inputArea = textarea;

	this.init = function () {

		if (!util.isVisible(inputArea)) {
			return;
		}

		this.setInputAreaSelectionStartEnd();
		this.scrollTop = inputArea.scrollTop;
		if (!this.text && inputArea.selectionStart || inputArea.selectionStart === 0) {
			this.text = inputArea.value;
		}

	};

	// Sets the selected text in the input box after we've performed an
	// operation.
	this.setInputAreaSelection = function () {

		if (!util.isVisible(inputArea)) {
			return;
		}

		if (inputArea.selectionStart !== undefined && !browser.isOpera) {

			inputArea.focus();
			inputArea.selectionStart = stateObj.start;
			inputArea.selectionEnd = stateObj.end;
			inputArea.scrollTop = stateObj.scrollTop;
		}
		else if (document.selection) {

			if (typeof(document.activeElement)!="unknown" && document.activeElement && document.activeElement !== inputArea) {
				return;
			}

			inputArea.focus();
			var range = inputArea.createTextRange();
			range.moveStart("character", -inputArea.value.length);
			range.moveEnd("character", -inputArea.value.length);
			range.moveEnd("character", stateObj.end);
			range.moveStart("character", stateObj.start);
			range.select();
		}
	};

	this.setInputAreaSelectionStartEnd = function () {

		if (inputArea.selectionStart || inputArea.selectionStart === 0) {

			stateObj.start = inputArea.selectionStart;
			stateObj.end = inputArea.selectionEnd;
		}
		else if (document.selection) {

			stateObj.text = util.fixLineEndings(inputArea.value);

			// IE loses the selection in the textarea when buttons are
			// clicked.  On IE we cache the selection and set a flag
			// which we check for here.
			var range;
			if (wmd.ieRetardedClick && wmd.ieCachedRange) {
				range = wmd.ieCachedRange;
				wmd.ieRetardedClick = false;
			}
			else {
				range = document.selection.createRange();
			}

			var fixedRange = util.fixLineEndings(range.text);
			var marker = "\x07";
			var markedRange = marker + fixedRange + marker;
			range.text = markedRange;
			var inputText = util.fixLineEndings(inputArea.value);

			range.moveStart("character", -markedRange.length);
			range.text = fixedRange;

			stateObj.start = inputText.indexOf(marker);
			stateObj.end = inputText.lastIndexOf(marker) - marker.length;

			var len = stateObj.text.length - util.fixLineEndings(inputArea.value).length;

			if (len) {
				range.moveStart("character", -fixedRange.length);
				while (len--) {
					fixedRange += "\n";
					stateObj.end += 1;
				}
				range.text = fixedRange;
			}

			this.setInputAreaSelection();
		}
	};

	// Restore this state into the input area.
	this.restore = function () {

		if (stateObj.text !== undefined && stateObj.text != inputArea.value) {
			inputArea.value = stateObj.text;
		}
		this.setInputAreaSelection();
		inputArea.scrollTop = stateObj.scrollTop;
	};

	// Gets a collection of HTML chunks from the inptut textarea.
	this.getChunks = function () {

		var chunk = new Chunks();

		chunk.before = util.fixLineEndings(stateObj.text.substring(0, stateObj.start));
		chunk.startTag = "";
		chunk.selection = util.fixLineEndings(stateObj.text.substring(stateObj.start, stateObj.end));
		chunk.endTag = "";
		chunk.after = util.fixLineEndings(stateObj.text.substring(stateObj.end));
		chunk.scrollTop = stateObj.scrollTop;

		return chunk;
	};

	// Sets the TextareaState properties given a chunk of markdown.
	this.setChunks = function (chunk) {

		chunk.before = chunk.before + chunk.startTag;
		chunk.after = chunk.endTag + chunk.after;

		if (browser.isOpera) {
			chunk.before = chunk.before.replace(/\n/g, "\r\n");
			chunk.selection = chunk.selection.replace(/\n/g, "\r\n");
			chunk.after = chunk.after.replace(/\n/g, "\r\n");
		}

		this.start = chunk.before.length;
		this.end = chunk.before.length + chunk.selection.length;
		this.text = chunk.before + chunk.selection + chunk.after;
		this.scrollTop = chunk.scrollTop;
	};

	this.init();
};