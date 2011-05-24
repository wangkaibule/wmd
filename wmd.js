;(function () {

	WMDEditor = function (options) {
		this.options = WMDEditor.util.extend({}, WMDEditor.defaults, options || {});
		wmdBase(this, this.options);

		this.startEditor();
	};
	window.WMDEditor = WMDEditor;


	WMDEditor.prototype = {
		getPanels: function () {
			return {
				buttonBar: (typeof this.options.button_bar == 'string') ? document.getElementById(this.options.button_bar) : this.options.button_bar,
				preview: (typeof this.options.preview == 'string') ? document.getElementById(this.options.preview) : this.options.preview,
				output: (typeof this.options.output == 'string') ? document.getElementById(this.options.output) : this.options.output,
				input: (typeof this.options.input == 'string') ? document.getElementById(this.options.input) : this.options.input
			};
		},

		startEditor: function () {
			this.panels = this.getPanels();
			this.previewMgr = new PreviewManager(this);
			edit = new this.editor(this.previewMgr.refresh);
			this.previewMgr.refresh(true);
		}
	};



	// A few handy aliases for readability.
	var doc = window.document;
	var re = window.RegExp;
	var nav = window.navigator;

	function get_browser() {
		var b = {};
		b.isIE = /msie/.test(nav.userAgent.toLowerCase());
		b.isIE_5or6 = /msie 6/.test(nav.userAgent.toLowerCase()) || /msie 5/.test(nav.userAgent.toLowerCase());
		b.isIE_7plus = b.isIE && !b.isIE_5or6;
		b.isOpera = /opera/.test(nav.userAgent.toLowerCase());
		b.isKonqueror = /konqueror/.test(nav.userAgent.toLowerCase());
		return b;
	}

	// Used to work around some browser bugs where we can't use feature testing.
	var browser = get_browser();

	var wmdBase = function (wmd, wmd_options) { // {{{
		// Some namespaces.
		//wmd.Util = {};
		//wmd.Position = {};
		wmd.Command = {};
		wmd.Global = {};
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
					if (browser.isIE) {
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
				if (browser.isOpera) {
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
				if (browser.isIE) {
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
		// command {{{
		// The markdown symbols - 4 spaces = code, > = blockquote, etc.
		command.prefixes = "(?:\\s{4,}|\\s*>|\\s*-\\s+|\\s*\\d+\\.|=|\\+|-|_|\\*|#|\\s*\\[[^\n]]+\\]:)";

		// Remove markdown symbols from the chunk selection.
		command.unwrap = function (chunk) {
			var txt = new re("([^\\n])\\n(?!(\\n|" + command.prefixes + "))", "g");
			chunk.selection = chunk.selection.replace(txt, "$1 $2");
		};

		command.wrap = function (chunk, len) {
			command.unwrap(chunk);
			var regex = new re("(.{1," + len + "})( +|$\\n?)", "gm");

			chunk.selection = chunk.selection.replace(regex, function (line, marked) {
				if (new re("^" + command.prefixes, "").test(line)) {
					return line;
				}
				return marked + "\n";
			});

			chunk.selection = chunk.selection.replace(/\s+$/, "");
		};

		command.doBold = function (chunk, postProcessing, useDefaultText) {
			return command.doBorI(chunk, 2, "strong text");
		};

		command.doItalic = function (chunk, postProcessing, useDefaultText) {
			return command.doBorI(chunk, 1, "emphasized text");
		};

		// chunk: The selected region that will be enclosed with */**
		// nStars: 1 for italics, 2 for bold
		// insertText: If you just click the button without highlighting text, this gets inserted
		command.doBorI = function (chunk, nStars, insertText) {

			// Get rid of whitespace and fixup newlines.
			chunk.trimWhitespace();
			chunk.selection = chunk.selection.replace(/\n{2,}/g, "\n");

			// Look for stars before and after.  Is the chunk already marked up?
			chunk.before.search(/(\**$)/);
			var starsBefore = re.$1;

			chunk.after.search(/(^\**)/);
			var starsAfter = re.$1;

			var prevStars = Math.min(starsBefore.length, starsAfter.length);

			// Remove stars if we have to since the button acts as a toggle.
			if ((prevStars >= nStars) && (prevStars != 2 || nStars != 1)) {
				chunk.before = chunk.before.replace(re("[*]{" + nStars + "}$", ""), "");
				chunk.after = chunk.after.replace(re("^[*]{" + nStars + "}", ""), "");
			}
			else if (!chunk.selection && starsAfter) {
				// It's not really clear why this code is necessary.  It just moves
				// some arbitrary stuff around.
				chunk.after = chunk.after.replace(/^([*_]*)/, "");
				chunk.before = chunk.before.replace(/(\s?)$/, "");
				var whitespace = re.$1;
				chunk.before = chunk.before + starsAfter + whitespace;
			}
			else {

				// In most cases, if you don't have any selected text and click the button
				// you'll get a selected, marked up region with the default text inserted.
				if (!chunk.selection && !starsAfter) {
					chunk.selection = insertText;
				}

				// Add the true markup.
				var markup = nStars <= 1 ? "*" : "**"; // shouldn't the test be = ?
				chunk.before = chunk.before + markup;
				chunk.after = markup + chunk.after;
			}

			return;
		};

		command.stripLinkDefs = function (text, defsToAdd) {

			text = text.replace(/^[ ]{0,3}\[(\d+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?[ \t]*\n?[ \t]*(?:(\n*)["(](.+?)[")][ \t]*)?(?:\n+|$)/gm, function (totalMatch, id, link, newlines, title) {
				defsToAdd[id] = totalMatch.replace(/\s*$/, "");
				if (newlines) {
					// Strip the title and return that separately.
					defsToAdd[id] = totalMatch.replace(/["(](.+?)[")]$/, "");
					return newlines + title;
				}
				return "";
			});

			return text;
		};

		command.addLinkDef = function (chunk, linkDef) {

			var refNumber = 0; // The current reference number
			var defsToAdd = {}; //
			// Start with a clean slate by removing all previous link definitions.
			chunk.before = command.stripLinkDefs(chunk.before, defsToAdd);
			chunk.selection = command.stripLinkDefs(chunk.selection, defsToAdd);
			chunk.after = command.stripLinkDefs(chunk.after, defsToAdd);

			var defs = "";
			var regex = /(\[(?:\[[^\]]*\]|[^\[\]])*\][ ]?(?:\n[ ]*)?\[)(\d+)(\])/g;

			var addDefNumber = function (def) {
				refNumber++;
				def = def.replace(/^[ ]{0,3}\[(\d+)\]:/, "  [" + refNumber + "]:");
				defs += "\n" + def;
			};

			var getLink = function (wholeMatch, link, id, end) {

				if (defsToAdd[id]) {
					addDefNumber(defsToAdd[id]);
					return link + refNumber + end;

				}
				return wholeMatch;
			};

			chunk.before = chunk.before.replace(regex, getLink);

			if (linkDef) {
				addDefNumber(linkDef);
			}
			else {
				chunk.selection = chunk.selection.replace(regex, getLink);
			}

			var refOut = refNumber;

			chunk.after = chunk.after.replace(regex, getLink);

			if (chunk.after) {
				chunk.after = chunk.after.replace(/\n*$/, "");
			}
			if (!chunk.after) {
				chunk.selection = chunk.selection.replace(/\n*$/, "");
			}

			chunk.after += "\n\n" + defs;

			return refOut;
		};

		command.doLinkOrImage = function (chunk, postProcessing, isImage) {

			chunk.trimWhitespace();
			chunk.findTags(/\s*!?\[/, /\][ ]?(?:\n[ ]*)?(\[.*?\])?/);

			if (chunk.endTag.length > 1) {

				chunk.startTag = chunk.startTag.replace(/!?\[/, "");
				chunk.endTag = "";
				command.addLinkDef(chunk, null);

			}
			else {

				if (/\n\n/.test(chunk.selection)) {
					command.addLinkDef(chunk, null);
					return;
				}

				// The function to be executed when you enter a link and press OK or Cancel.
				// Marks up the link and adds the ref.
				var makeLinkMarkdown = function (link) {
					console.log(link);
					if (link !== null) {

						chunk.startTag = chunk.endTag = "";
						var linkDef = " [999]: " + link;

						var num = command.addLinkDef(chunk, linkDef);
						chunk.startTag = isImage ? "![" : "[";
						chunk.endTag = "][" + num + "]";

						if (!chunk.selection) {
							if (isImage) {
								chunk.selection = "alt text";
							}
							else {
								chunk.selection = "link text";
							}
						}
					}
					postProcessing();
				};

				if (isImage) {
					util.prompt(wmd_options.imageDialogText, wmd_options.imageDefaultText, makeLinkMarkdown, 'Image');
				}
				else {
					util.prompt(wmd_options.linkDialogText, wmd_options.linkDefaultText, makeLinkMarkdown, 'Link');
				}
				return true;
			}
		};

		// Moves the cursor to the next line and continues lists, quotes and code.
		command.doAutoindent = function (chunk, postProcessing, useDefaultText) {
			if (!wmd.options.autoFormatting) return;

			if (wmd.options.autoFormatting.list) chunk.before = chunk.before.replace(/(\n|^)[ ]{0,3}([*+-]|\d+[.])[ \t]*\n$/, "\n\n");
			if (wmd.options.autoFormatting.quote) chunk.before = chunk.before.replace(/(\n|^)[ ]{0,3}>[ \t]*\n$/, "\n\n");
			if (wmd.options.autoFormatting.code) chunk.before = chunk.before.replace(/(\n|^)[ \t]+\n$/, "\n\n");

			useDefaultText = false;

			if (/(\n|^)[ ]{0,3}([*+-])[ \t]+.*\n$/.test(chunk.before)) {
				if (command.doList && wmd.options.autoFormatting.list) {
					command.doList(chunk, postProcessing, false, true);
				}
			}
			if (/(\n|^)[ ]{0,3}(\d+[.])[ \t]+.*\n$/.test(chunk.before)) {
				if (command.doList && wmd.options.autoFormatting.list) {
					command.doList(chunk, postProcessing, true, true);
				}
			}
			if (/(\n|^)[ ]{0,3}>[ \t]+.*\n$/.test(chunk.before)) {
				if (command.doBlockquote && wmd.options.autoFormatting.quote) {
					command.doBlockquote(chunk, postProcessing, useDefaultText);
				}
			}
			if (/(\n|^)(\t|[ ]{4,}).*\n$/.test(chunk.before)) {
				if (command.doCode && wmd.options.autoFormatting.code) {
					command.doCode(chunk, postProcessing, useDefaultText);
				}
			}
		};

		command.doBlockquote = function (chunk, postProcessing, useDefaultText) {

			chunk.selection = chunk.selection.replace(/^(\n*)([^\r]+?)(\n*)$/, function (totalMatch, newlinesBefore, text, newlinesAfter) {
				chunk.before += newlinesBefore;
				chunk.after = newlinesAfter + chunk.after;
				return text;
			});

			chunk.before = chunk.before.replace(/(>[ \t]*)$/, function (totalMatch, blankLine) {
				chunk.selection = blankLine + chunk.selection;
				return "";
			});

			var defaultText = useDefaultText ? "Blockquote" : "";
			chunk.selection = chunk.selection.replace(/^(\s|>)+$/, "");
			chunk.selection = chunk.selection || defaultText;

			if (chunk.before) {
				chunk.before = chunk.before.replace(/\n?$/, "\n");
			}
			if (chunk.after) {
				chunk.after = chunk.after.replace(/^\n?/, "\n");
			}

			chunk.before = chunk.before.replace(/(((\n|^)(\n[ \t]*)*>(.+\n)*.*)+(\n[ \t]*)*$)/, function (totalMatch) {
				chunk.startTag = totalMatch;
				return "";
			});

			chunk.after = chunk.after.replace(/^(((\n|^)(\n[ \t]*)*>(.+\n)*.*)+(\n[ \t]*)*)/, function (totalMatch) {
				chunk.endTag = totalMatch;
				return "";
			});

			var replaceBlanksInTags = function (useBracket) {

				var replacement = useBracket ? "> " : "";

				if (chunk.startTag) {
					chunk.startTag = chunk.startTag.replace(/\n((>|\s)*)\n$/, function (totalMatch, markdown) {
						return "\n" + markdown.replace(/^[ ]{0,3}>?[ \t]*$/gm, replacement) + "\n";
					});
				}
				if (chunk.endTag) {
					chunk.endTag = chunk.endTag.replace(/^\n((>|\s)*)\n/, function (totalMatch, markdown) {
						return "\n" + markdown.replace(/^[ ]{0,3}>?[ \t]*$/gm, replacement) + "\n";
					});
				}
			};

			if (/^(?![ ]{0,3}>)/m.test(chunk.selection)) {
				command.wrap(chunk, wmd_options.lineLength - 2);
				chunk.selection = chunk.selection.replace(/^/gm, "> ");
				replaceBlanksInTags(true);
				chunk.addBlankLines();
			}
			else {
				chunk.selection = chunk.selection.replace(/^[ ]{0,3}> ?/gm, "");
				command.unwrap(chunk);
				replaceBlanksInTags(false);

				if (!/^(\n|^)[ ]{0,3}>/.test(chunk.selection) && chunk.startTag) {
					chunk.startTag = chunk.startTag.replace(/\n{0,2}$/, "\n\n");
				}

				if (!/(\n|^)[ ]{0,3}>.*$/.test(chunk.selection) && chunk.endTag) {
					chunk.endTag = chunk.endTag.replace(/^\n{0,2}/, "\n\n");
				}
			}

			if (!/\n/.test(chunk.selection)) {
				chunk.selection = chunk.selection.replace(/^(> *)/, function (wholeMatch, blanks) {
					chunk.startTag += blanks;
					return "";
				});
			}
		};

		command.doCode = function (chunk, postProcessing, useDefaultText) {

			var hasTextBefore = /\S[ ]*$/.test(chunk.before);
			var hasTextAfter = /^[ ]*\S/.test(chunk.after);

			// Use 'four space' markdown if the selection is on its own
			// line or is multiline.
			if ((!hasTextAfter && !hasTextBefore) || /\n/.test(chunk.selection)) {

				chunk.before = chunk.before.replace(/[ ]{4}$/, function (totalMatch) {
					chunk.selection = totalMatch + chunk.selection;
					return "";
				});

				var nLinesBefore = 1;
				var nLinesAfter = 1;


				if (/\n(\t|[ ]{4,}).*\n$/.test(chunk.before) || chunk.after === "") {
					nLinesBefore = 0;
				}
				if (/^\n(\t|[ ]{4,})/.test(chunk.after)) {
					nLinesAfter = 0; // This needs to happen on line 1
				}

				chunk.addBlankLines(nLinesBefore, nLinesAfter);

				if (!chunk.selection) {
					chunk.startTag = "    ";
					chunk.selection = useDefaultText ? "enter code here" : "";
				}
				else {
					if (/^[ ]{0,3}\S/m.test(chunk.selection)) {
						chunk.selection = chunk.selection.replace(/^/gm, "    ");
					}
					else {
						chunk.selection = chunk.selection.replace(/^[ ]{4}/gm, "");
					}
				}
			}
			else {
				// Use backticks (`) to delimit the code block.
				chunk.trimWhitespace();
				chunk.findTags(/`/, /`/);

				if (!chunk.startTag && !chunk.endTag) {
					chunk.startTag = chunk.endTag = "`";
					if (!chunk.selection) {
						chunk.selection = useDefaultText ? "enter code here" : "";
					}
				}
				else if (chunk.endTag && !chunk.startTag) {
					chunk.before += chunk.endTag;
					chunk.endTag = "";
				}
				else {
					chunk.startTag = chunk.endTag = "";
				}
			}
		};

		command.doList = function (chunk, postProcessing, isNumberedList, useDefaultText) {

			// These are identical except at the very beginning and end.
			// Should probably use the regex extension function to make this clearer.
			var previousItemsRegex = /(\n|^)(([ ]{0,3}([*+-]|\d+[.])[ \t]+.*)(\n.+|\n{2,}([*+-].*|\d+[.])[ \t]+.*|\n{2,}[ \t]+\S.*)*)\n*$/;
			var nextItemsRegex = /^\n*(([ ]{0,3}([*+-]|\d+[.])[ \t]+.*)(\n.+|\n{2,}([*+-].*|\d+[.])[ \t]+.*|\n{2,}[ \t]+\S.*)*)\n*/;

			// The default bullet is a dash but others are possible.
			// This has nothing to do with the particular HTML bullet,
			// it's just a markdown bullet.
			var bullet = "-";

			// The number in a numbered list.
			var num = 1;

			// Get the item prefix - e.g. " 1. " for a numbered list, " - " for a bulleted list.
			var getItemPrefix = function () {
				var prefix;
				if (isNumberedList) {
					prefix = " " + num + ". ";
					num++;
				}
				else {
					prefix = " " + bullet + " ";
				}
				return prefix;
			};

			// Fixes the prefixes of the other list items.
			var getPrefixedItem = function (itemText) {

				// The numbering flag is unset when called by autoindent.
				if (isNumberedList === undefined) {
					isNumberedList = /^\s*\d/.test(itemText);
				}

				// Renumber/bullet the list element.
				itemText = itemText.replace(/^[ ]{0,3}([*+-]|\d+[.])\s/gm, function (_) {
					return getItemPrefix();
				});

				return itemText;
			};

			chunk.findTags(/(\n|^)*[ ]{0,3}([*+-]|\d+[.])\s+/, null);

			if (chunk.before && !/\n$/.test(chunk.before) && !/^\n/.test(chunk.startTag)) {
				chunk.before += chunk.startTag;
				chunk.startTag = "";
			}

			if (chunk.startTag) {

				var hasDigits = /\d+[.]/.test(chunk.startTag);
				chunk.startTag = "";
				chunk.selection = chunk.selection.replace(/\n[ ]{4}/g, "\n");
				command.unwrap(chunk);
				chunk.addBlankLines();

				if (hasDigits) {
					// Have to renumber the bullet points if this is a numbered list.
					chunk.after = chunk.after.replace(nextItemsRegex, getPrefixedItem);
				}
				if (isNumberedList == hasDigits) {
					return;
				}
			}

			var nLinesBefore = 1;

			chunk.before = chunk.before.replace(previousItemsRegex, function (itemText) {
				if (/^\s*([*+-])/.test(itemText)) {
					bullet = re.$1;
				}
				nLinesBefore = /[^\n]\n\n[^\n]/.test(itemText) ? 1 : 0;
				return getPrefixedItem(itemText);
			});

			if (!chunk.selection) {
				chunk.selection = useDefaultText ? "List item" : " ";
			}

			var prefix = getItemPrefix();

			var nLinesAfter = 1;

			chunk.after = chunk.after.replace(nextItemsRegex, function (itemText) {
				nLinesAfter = /[^\n]\n\n[^\n]/.test(itemText) ? 1 : 0;
				return getPrefixedItem(itemText);
			});

			chunk.trimWhitespace(true);
			chunk.addBlankLines(nLinesBefore, nLinesAfter, true);
			chunk.startTag = prefix;
			var spaces = prefix.replace(/./g, " ");
			command.wrap(chunk, wmd_options.lineLength - spaces.length);
			chunk.selection = chunk.selection.replace(/\n/g, "\n" + spaces);

		};

		command.doHeading = function (chunk, postProcessing, useDefaultText) {

			// Remove leading/trailing whitespace and reduce internal spaces to single spaces.
			chunk.selection = chunk.selection.replace(/\s+/g, " ");
			chunk.selection = chunk.selection.replace(/(^\s+|\s+$)/g, "");

			// If we clicked the button with no selected text, we just
			// make a level 2 hash header around some default text.
			if (!chunk.selection) {
				chunk.startTag = "## ";
				chunk.selection = "Heading";
				chunk.endTag = " ##";
				return;
			}

			var headerLevel = 0; // The existing header level of the selected text.
			// Remove any existing hash heading markdown and save the header level.
			chunk.findTags(/#+[ ]*/, /[ ]*#+/);
			if (/#+/.test(chunk.startTag)) {
				headerLevel = re.lastMatch.length;
			}
			chunk.startTag = chunk.endTag = "";

			// Try to get the current header level by looking for - and = in the line
			// below the selection.
			chunk.findTags(null, /\s?(-+|=+)/);
			if (/=+/.test(chunk.endTag)) {
				headerLevel = 1;
			}
			if (/-+/.test(chunk.endTag)) {
				headerLevel = 2;
			}

			// Skip to the next line so we can create the header markdown.
			chunk.startTag = chunk.endTag = "";
			chunk.addBlankLines(1, 1);

			// We make a level 2 header if there is no current header.
			// If there is a header level, we substract one from the header level.
			// If it's already a level 1 header, it's removed.
			var headerLevelToCreate = headerLevel == 0 ? 2 : headerLevel - 1;

			if (headerLevelToCreate > 0) {

				// The button only creates level 1 and 2 underline headers.
				// Why not have it iterate over hash header levels?  Wouldn't that be easier and cleaner?
				var headerChar = headerLevelToCreate >= 2 ? "-" : "=";
				var len = chunk.selection.length;
				if (len > wmd_options.lineLength) {
					len = wmd_options.lineLength;
				}
				chunk.endTag = "\n";
				while (len--) {
					chunk.endTag += headerChar;
				}
			}
		};

		command.doHorizontalRule = function (chunk, postProcessing, useDefaultText) {
			chunk.startTag = "----------\n";
			chunk.selection = "";
			chunk.addBlankLines(2, 1, true);
		};
		// }}}
	}; // }}}
})();

// For backward compatibility

function setup_wmd(options) {
	return new WMDEditor(options);
}