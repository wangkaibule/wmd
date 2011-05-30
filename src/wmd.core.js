var WMD = function (options) {
	var opts = this.options = util.extend(true, WMDEditor.defaults, options || {});
	var self = this;
	
	this.panels = {
		toolbar: util.$(opts.toolbar),
		preview: util.$(opts.preview),
		output: util.$(opts.output),
		input: util.$(opts.input)
	};
		

	//IF TOOLBAR EXISTS, POPULATE IT
	if (this.panels.toolbar) {
		//create the toolbar row
		var buttonRow = document.createElement("ul");
			buttonRow.className = "wmd-button-row";
			
			util.addEvent(buttonRow, 'click', function toolbarClickHandler(event, target) {
				var buttonName;
				if (target.tagName === 'LI') {
					var buttonName = target.getAttribute('data-button-name');
					if (buttonName) {
						//is a button item and has a defined button name
						WMD.publish('toolbar-button', self, [event, target]); //dispatch a click event for that button
						WMD.publish('toolbar-button:'+buttonName, self, [event, target]);
					}
				}
			});

		this.panels.toolbar.appendChild(buttonRow);
		
		var buttonList = opts.buttons.split(' '),
			buttonNode;
		for (var i=0;i<buttonList.length;i++) {
			var buttonName = buttonList[i],
				buttonObj;
			if (!buttonName) {
				//config string contained a double space, marking a divider
				buttonNode = document.createElement("li");
				buttonNode.className = "wmd-spacer";

				buttonRow.appendChild(buttonNode);
				
			} else if (buttonObj = WMD._buttons[buttonName]) {
				//button name exists, add button to button bar
				buttonNode = document.createElement("li");
				buttonNode.className = "wmd-button "+buttonObj.className;
				if (buttonObj.title) buttonNode.setAttribute('title', buttonObj.title);
				buttonNode.setAttribute('data-button-name', buttonName);
				
				buttonRow.appendChild(buttonNode);
			}
		
		}
	}



	// var previewMgr = new PreviewManager(this);
	// var edit = new this.editor(this.previewMgr.refresh);
	// previewMgr.refresh(true);

};

window.WMDEditor = WMD;

WMD.pluginDebug = true;

WMD._buttons = {};
WMD._shortcutKeys = {};


WMD.registerButton = function (name, options) {
	if (WMD._buttons[name]) throw "WMDEditor: A button named "+name+" is already defined.";
	
	var btn = util.extend({
				className:'wmd-button-'+name,
				titleText:'',
				shortcut:''
			}, options);
	
	WMD._buttons[name] = btn;
	if (btn.shortcut) WMD._shortcutKeys[btn.shortcut] = name;
}

/*


// A few handy aliases for readability.
var doc = window.document;
var re = window.RegExp;
var nav = window.navigator;

var wmdBase = function (wmd, wmd_options) {
	// Some namespaces.
	//wmd.Util = {};
	//wmd.Position = {};
	wmd.buttons = {};

	wmd.showdown = window.Showdown;

	var util = WMDEditor.util;
	var position = WMDEditor.position;
	var command = wmd.Command;

	// Internet explorer has problems with CSS sprite buttons that use HTML
	// lists.  When you click on the background image "button", IE will 
	// select the non-existent link text and discard the selection in the
	// textarea.  The solution to this is to cache the textarea selection
	// on the button's mousedown event and set a flag.  In the part of the
	// code where we need to grab the selection, we check for the flag
	// and, if it's set, use the cached area instead of querying the
	// textarea.
	//
	// This ONLY affects Internet Explorer (tested on versions 6, 7
	// and 8) and ONLY on button clicks.  Keyboard shortcuts work
	// normally since the focus never leaves the textarea.
	wmd.ieCachedRange = null; // cached textarea selection
	wmd.ieRetardedClick = false; // flag
	// I think my understanding of how the buttons and callbacks are stored in the array is incomplete.
	wmd.editor = function (previewRefreshCallback) { // {{{
		if (!previewRefreshCallback) {
			previewRefreshCallback = function () {};
		}

		var inputBox = wmd.panels.input;

		var offsetHeight = 0;

		var editObj = this;

		var mainDiv;
		var mainSpan;

		var div; // This name is pretty ambiguous.  I should rename this.
		// Used to cancel recurring events from setInterval.
		var creationHandle;

		var undoMgr; // The undo manager
		// Perform the button's action.
		var doClick = function (button) {

			inputBox.focus();

			if (button.textOp) {

				if (undoMgr) {
					undoMgr.setCommandMode();
				}

				var state = new TextareaState(wmd.panels.input, wmd);

				if (!state) {
					return;
				}

				var chunks = state.getChunks();

				// Some commands launch a "modal" prompt dialog.  Javascript
				// can't really make a modal dialog box and the WMD code
				// will continue to execute while the dialog is displayed.
				// This prevents the dialog pattern I'm used to and means
				// I can't do something like this:
				//
				// var link = CreateLinkDialog();
				// makeMarkdownLink(link);
				// 
				// Instead of this straightforward method of handling a
				// dialog I have to pass any code which would execute
				// after the dialog is dismissed (e.g. link creation)
				// in a function parameter.
				//
				// Yes this is awkward and I think it sucks, but there's
				// no real workaround.  Only the image and link code
				// create dialogs and require the function pointers.
				var fixupInputArea = function () {

					inputBox.focus();

					if (chunks) {
						state.setChunks(chunks);
					}

					state.restore();
					previewRefreshCallback();
				};

				var useDefaultText = true;
				var noCleanup = button.textOp(chunks, fixupInputArea, useDefaultText);

				if (!noCleanup) {
					fixupInputArea();
				}

			}

			if (button.execute) {
				button.execute(editObj);
			}
		};

		var setUndoRedoButtonStates = function () {
			if (undoMgr) {
				if (wmd.buttons["wmd-undo-button"]) setupButton(wmd.buttons["wmd-undo-button"], undoMgr.canUndo());
				if (wmd.buttons["wmd-redo-button"]) setupButton(wmd.buttons["wmd-redo-button"], undoMgr.canRedo());
			}
		};

		var setupButton = function (button, isEnabled) {

			if (isEnabled) {
				button.className = button.className.replace(new RegExp("(^|\\s+)disabled(\\s+|$)"), ' ');
			
				// IE tries to select the background image "button" text (it's
				// implemented in a list item) so we have to cache the selection
				// on mousedown.
				if (util.isIE) {
					button.onmousedown = function () {
						wmd.ieRetardedClick = true;
						wmd.ieCachedRange = document.selection.createRange();
					};
				}

				if (!button.isHelp) {
					button.onclick = function () {
						if (this.onmouseout) {
							this.onmouseout();
						}
						doClick(this);
						return false;
					};
				}
			}
			else {
				button.className += (button.className ? ' ' : '') + 'disabled';
				button.onmouseover = button.onmouseout = button.onclick = function () {};
			}
		};

		var makeSpritedButtonRow = function () {

			var buttonBar = (typeof wmd_options.button_bar == 'string') ? document.getElementById(wmd_options.button_bar || "wmd-button-bar") : wmd_options.button_bar;

			var normalYShift = "0px";
			var disabledYShift = "-20px";
			var highlightYShift = "-40px";

			var buttonRow = document.createElement("ul");
			buttonRow.className = "wmd-button-row";
			buttonRow = buttonBar.appendChild(buttonRow);

			var xoffset = 0;

			function createButton(name, title, textOp) {
				var button = document.createElement("li");
				wmd.buttons[name] = button;
				button.className = "wmd-button " + name;
				button.XShift = xoffset + "px";
				xoffset -= 20;

				if (title) button.title = title;

				if (textOp) button.textOp = textOp;

				return button;
			}

			function addButton(name, title, textOp) {
				var button = createButton(name, title, textOp);

				setupButton(button, true);
				buttonRow.appendChild(button);
				return button;
			}

			function addSpacer() {
				var spacer = document.createElement("li");
				spacer.className = "wmd-spacer";
				buttonRow.appendChild(spacer);
				return spacer;
			}

			var buttonlist = wmd_options.buttons.split(' ');
			for (var i=0;i<buttonlist.length;i++) {
				switch (buttonlist[i]) {
				case "bold":
					addButton("wmd-bold-button", "Strong <strong> Ctrl+B", command.doBold);
					break;
				case "italic":
					addButton("wmd-italic-button", "Emphasis <em> Ctrl+I", command.doItalic);
					break;
				case 'link':
					addButton("wmd-link-button", "Hyperlink <a> Ctrl+L", function (chunk, postProcessing, useDefaultText) {
						return command.doLinkOrImage(chunk, postProcessing, false);
					});
					break;
				case 'blockquote':
					addButton("wmd-quote-button", "Blockquote <blockquote> Ctrl+Q", command.doBlockquote);
					break;
				case 'code':
					addButton("wmd-code-button", "Code Sample <pre><code> Ctrl+K", command.doCode);
					break;
				case 'image':
					addButton("wmd-image-button", "Image <img> Ctrl+G", function (chunk, postProcessing, useDefaultText) {
						return command.doLinkOrImage(chunk, postProcessing, true);
					});
					break;
				case 'ol':
					addButton("wmd-olist-button", "Numbered List <ol> Ctrl+O", function (chunk, postProcessing, useDefaultText) {
						command.doList(chunk, postProcessing, true, useDefaultText);
					});
					break;
				case 'ul':
					addButton("wmd-ulist-button", "Bulleted List <ul> Ctrl+U", function (chunk, postProcessing, useDefaultText) {
						command.doList(chunk, postProcessing, false, useDefaultText);
					});
					break;
				case 'heading':
					addButton("wmd-heading-button", "Heading <h1>/<h2> Ctrl+H", command.doHeading);
					break;
				case 'hr':
					addButton("wmd-hr-button", "Horizontal Rule <hr> Ctrl+R", command.doHorizontalRule);
					break;
				case 'undo':
					var undoButton = addButton("wmd-undo-button", "Undo - Ctrl+Z");
					undoButton.execute = function (manager) {
						manager.undo();
					};
					break;
				case 'redo':
					var redoButton = addButton("wmd-redo-button", "Redo - Ctrl+Y");
					if (/win/.test(nav.platform.toLowerCase())) {
						redoButton.title = "Redo - Ctrl+Y";
					}
					else {
						// mac and other non-Windows platforms
						redoButton.title = "Redo - Ctrl+Shift+Z";
					}
					redoButton.execute = function (manager) {
						manager.redo();
					};
					break;
				case 'help':
					var helpButton = createButton("wmd-help-button");
					helpButton.isHelp = true;
					setupButton(helpButton, true);
					buttonRow.appendChild(helpButton);

					var helpAnchor = document.createElement("a");
					helpAnchor.href = wmd_options.helpLink;
					helpAnchor.target = wmd_options.helpTarget;
					helpAnchor.title = wmd_options.helpHoverTitle;
					helpButton.appendChild(helpAnchor);
					break;
				case '':
					addSpacer();
					break;
				}
			}

			setUndoRedoButtonStates();
		};

		var setupEditor = function () {

			if (/\?noundo/.test(document.location.href)) {
				wmd.nativeUndo = true;
			}

			if (!wmd.nativeUndo) {
				undoMgr = new UndoManager(wmd, wmd.panels.input, wmd.options.pastePollInterval, function () {
					previewRefreshCallback();
					setUndoRedoButtonStates();
				});
			}

			makeSpritedButtonRow();


			var keyEvent = "keydown";
			if (util.isOpera) {
				keyEvent = "keypress";
			}

			util.addEvent(inputBox, keyEvent, function (key) {

				// Check to see if we have a button key and, if so execute the callback.
				if (wmd.options.modifierKeys && (key.ctrlKey || key.metaKey)) {

					var keyCode = key.charCode || key.keyCode;
					var keyCodeStr = String.fromCharCode(keyCode).toLowerCase();

					switch (keyCodeStr) {
					case wmd.options.modifierKeys.bold:
						if (wmd.buttons["wmd-bold-button"]) doClick(wmd.buttons["wmd-bold-button"]);
						else return;
						break;
					case wmd.options.modifierKeys.italic:
						if (wmd.buttons["wmd-italic-button"]) doClick(wmd.buttons["wmd-italic-button"]);
						else return;
						break;
					case wmd.options.modifierKeys.link:
						if (wmd.buttons["wmd-link-button"]) doClick(wmd.buttons["wmd-link-button"]);
						else return;
						break;
					case wmd.options.modifierKeys.quote:
						if (wmd.buttons["wmd-quote-button"]) doClick(wmd.buttons["wmd-quote-button"]);
						else return;
						break;
					case wmd.options.modifierKeys.code:
						if (wmd.buttons["wmd-code-button"]) doClick(wmd.buttons["wmd-code-button"]);
						else return;
						break;
					case wmd.options.modifierKeys.image:
						if (wmd.buttons["wmd-image-button"]) doClick(wmd.buttons["wmd-image-button"]);
						else return;
						break;
					case wmd.options.modifierKeys.orderedList:
						if (wmd.buttons["wmd-olist-button"]) doClick(wmd.buttons["wmd-olist-button"]);
						else return;
						break;
					case wmd.options.modifierKeys.unorderedList:
						if (wmd.buttons["wmd-ulist-button"]) doClick(wmd.buttons["wmd-ulist-button"]);
						else return;
						break;
					case wmd.options.modifierKeys.heading:
						if (wmd.buttons["wmd-heading-button"]) doClick(wmd.buttons["wmd-heading-button"]);
						else return;
						break;
					case wmd.options.modifierKeys.horizontalRule:
						if (wmd.buttons["wmd-hr-button"]) doClick(wmd.buttons["wmd-hr-button"]);
						else return;
						break;
					case wmd.options.modifierKeys.redo:
						if (wmd.buttons["wmd-redo-button"]) doClick(wmd.buttons["wmd-redo-button"]);
						else return;
						break;
					case wmd.options.modifierKeys.undo:
						if (key.shiftKey) {
							if (wmd.buttons["wmd-redo-button"]) doClick(wmd.buttons["wmd-redo-button"]);
							else return;
						} else {
							if (wmd.buttons["wmd-undo-button"]) doClick(wmd.buttons["wmd-undo-button"]);
							else return;
						}
						break;
					default:
						return;
					}


					if (key.preventDefault) {
						key.preventDefault();
					}

					if (window.event) {
						window.event.returnValue = false;
					}
				}
			});

			// Auto-continue lists, code blocks and block quotes when
			// the enter key is pressed.
			util.addEvent(inputBox, "keyup", function (key) {
				if (!key.shiftKey && !key.ctrlKey && !key.metaKey) {
					var keyCode = key.charCode || key.keyCode;
					// Key code 13 is Enter
					if (keyCode === 13) {
						fakeButton = {};
						fakeButton.textOp = command.doAutoindent;
						doClick(fakeButton);
					}
				}
			});

			// Disable ESC clearing the input textarea on IE
			if (util.isIE) {
				util.addEvent(inputBox, "keydown", function (key) {
					var code = key.keyCode;
					// Key code 27 is ESC
					if (code === 27) {
						return false;
					}
				});
			}
		};


		this.undo = function () {
			if (undoMgr) {
				undoMgr.undo();
			}
		};

		this.redo = function () {
			if (undoMgr) {
				undoMgr.redo();
			}
		};

		// This is pretty useless.  The setupEditor function contents
		// should just be copied here.
		var init = function () {
			setupEditor();
		};

		this.destroy = function () {
			if (undoMgr) {
				undoMgr.destroy();
			}
			if (div.parentNode) {
				div.parentNode.removeChild(div);
			}
			if (inputBox) {
				inputBox.style.marginTop = "";
			}
			window.clearInterval(creationHandle);
		};

		init();
	}; // }}}
	
};

*/

