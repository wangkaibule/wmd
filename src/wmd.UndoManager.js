// Handles pushing and popping TextareaStates for undo/redo commands.
// I should rename the stack variables to list.
var UndoManager = function (wmd, textarea, pastePollInterval, callback) { // {{{
	var undoObj = this;
	var undoStack = []; // A stack of undo states
	var stackPtr = 0; // The index of the current state
	var mode = "none";
	var lastState; // The last state
	var poller;
	var timer; // The setTimeout handle for cancelling the timer
	var inputStateObj;

	// Set the mode for later logic steps.
	var setMode = function (newMode, noSave) {

		if (mode != newMode) {
			mode = newMode;
			if (!noSave) {
				saveState();
			}
		}

		if (!browser.isIE || mode != "moving") {
			timer = window.setTimeout(refreshState, 1);
		}
		else {
			inputStateObj = null;
		}
	};

	var refreshState = function () {
		inputStateObj = new TextareaState(textarea, wmd);
		poller.tick();
		timer = undefined;
	};

	this.setCommandMode = function () {
		mode = "command";
		saveState();
		timer = window.setTimeout(refreshState, 0);
	};

	this.canUndo = function () {
		return stackPtr > 1;
	};

	this.canRedo = function () {
		if (undoStack[stackPtr + 1]) {
			return true;
		}
		return false;
	};

	// Removes the last state and restores it.
	this.undo = function () {

		if (undoObj.canUndo()) {
			if (lastState) {
				// What about setting state -1 to null or checking for undefined?
				lastState.restore();
				lastState = null;
			}
			else {
				undoStack[stackPtr] = new TextareaState(textarea, wmd);
				undoStack[--stackPtr].restore();

				if (callback) {
					callback();
				}
			}
		}

		mode = "none";
		textarea.focus();
		refreshState();
	};

	// Redo an action.
	this.redo = function () {

		if (undoObj.canRedo()) {

			undoStack[++stackPtr].restore();

			if (callback) {
				callback();
			}
		}

		mode = "none";
		textarea.focus();
		refreshState();
	};

	// Push the input area state to the stack.
	var saveState = function () {

		var currState = inputStateObj || new TextareaState(textarea, wmd);

		if (!currState) {
			return false;
		}
		if (mode == "moving") {
			if (!lastState) {
				lastState = currState;
			}
			return;
		}
		if (lastState) {
			if (undoStack[stackPtr - 1].text != lastState.text) {
				undoStack[stackPtr++] = lastState;
			}
			lastState = null;
		}
		undoStack[stackPtr++] = currState;
		undoStack[stackPtr + 1] = null;
		if (callback) {
			callback();
		}
	};

	var handleCtrlYZ = function (event) {

		var handled = false;

		if (event.ctrlKey || event.metaKey) {

			// IE and Opera do not support charCode.
			var keyCode = event.charCode || event.keyCode;
			var keyCodeChar = String.fromCharCode(keyCode);

			switch (keyCodeChar) {

			case "y":
				undoObj.redo();
				handled = true;
				break;

			case "z":
				if (!event.shiftKey) {
					undoObj.undo();
				}
				else {
					undoObj.redo();
				}
				handled = true;
				break;
			}
		}

		if (handled) {
			if (event.preventDefault) {
				event.preventDefault();
			}
			if (window.event) {
				window.event.returnValue = false;
			}
			return;
		}
	};

	// Set the mode depending on what is going on in the input area.
	var handleModeChange = function (event) {

		if (!event.ctrlKey && !event.metaKey) {

			var keyCode = event.keyCode;

			if ((keyCode >= 33 && keyCode <= 40) || (keyCode >= 63232 && keyCode <= 63235)) {
				// 33 - 40: page up/dn and arrow keys
				// 63232 - 63235: page up/dn and arrow keys on safari
				setMode("moving");
			}
			else if (keyCode == 8 || keyCode == 46 || keyCode == 127) {
				// 8: backspace
				// 46: delete
				// 127: delete
				setMode("deleting");
			}
			else if (keyCode == 13) {
				// 13: Enter
				setMode("newlines");
			}
			else if (keyCode == 27) {
				// 27: escape
				setMode("escape");
			}
			else if ((keyCode < 16 || keyCode > 20) && keyCode != 91) {
				// 16-20 are shift, etc. 
				// 91: left window key
				// I think this might be a little messed up since there are
				// a lot of nonprinting keys above 20.
				setMode("typing");
			}
		}
	};

	var setEventHandlers = function () {

		util.addEvent(textarea, "keypress", function (event) {
			// keyCode 89: y
			// keyCode 90: z
			if ((event.ctrlKey || event.metaKey) && (event.keyCode == 89 || event.keyCode == 90)) {
				event.preventDefault();
			}
		});

		var handlePaste = function () {
			if (browser.isIE || (inputStateObj && inputStateObj.text != textarea.value)) {
				if (timer == undefined) {
					mode = "paste";
					saveState();
					refreshState();
				}
			}
		};

		poller = new InputPoller(textarea, handlePaste, pastePollInterval);

		util.addEvent(textarea, "keydown", handleCtrlYZ);
		util.addEvent(textarea, "keydown", handleModeChange);

		util.addEvent(textarea, "mousedown", function () {
			setMode("moving");
		});
		textarea.onpaste = handlePaste;
		textarea.ondrop = handlePaste;
	};

	var init = function () {
		setEventHandlers();
		refreshState();
		saveState();
	};

	this.destroy = function () {
		if (poller) {
			poller.destroy();
		}
	};

	init();
};	



