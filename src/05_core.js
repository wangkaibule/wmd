var WMD = function (options) {
	var opts = this.options = util.extend(true, WMD.defaults, options || {});
	var that = this;
	
	that.panels = {
		toolbar: util.$(opts.toolbar),
		preview: util.$(opts.preview),
		output: util.$(opts.output),
		input: util.$(opts.input)
	};
	
	if (!that.panels.input) throw "WMDEditor: You must define an input textarea for WMD to work on.";

	that.selection = new Selectivizer(that.panels.input);
	
	
	util.addEvent(that.panels.input, 'keydown', function (event) {
		// Check to see if we have a button key and, if so execute the callback.
		if (!that.options.disableKeyShortcuts && event.ctrlKey) {

			var keyCode = event.charCode || event.keyCode,
				keyCodeStr = String.fromCharCode(keyCode).toLowerCase(),
				buttonName;
			
			if ((buttonName = WMD._shortcutKeys[keyCodeStr])) {
				WMD.publish('toolbar-button-shortcut', that, [event, keyCodeStr]); //dispatch a click event for that button
				WMD.publish('toolbar-button:'+buttonName, that, [event, 'shortcut']);
				if (!!event.preventDefault) event.preventDefault();
				if (typeof event.returnValue !== 'undefined') event.returnValue = false;
			}
						
		}
	});


	// Disable ESC clearing the input textarea on IE
	if (util.isIE) {
		util.addEvent(that.panels.input, "keydown", function (key) {
			var code = key.keyCode;
			if (code === 27) return false; //ESC Key
		});
	}
		

	//IF TOOLBAR EXISTS, POPULATE IT
	if (that.panels.toolbar) {
		//create the toolbar row
		var buttonRow = document.createElement("ul");
			buttonRow.className = "wmd-button-row";
			
			util.addEvent(buttonRow, 'click', function toolbarClickHandler(event, target) {
				var buttonName;
				if (target.tagName === 'LI') {
					buttonName = target.getAttribute('data-button-name');
					if (buttonName) {
						//is a button item and has a defined button name
						WMD.publish('toolbar-button-clicked', that, [event, target]); //dispatch a click event for that button
						WMD.publish('toolbar-button:'+buttonName, that, [event, target]);
					}
				}				
				
			});

		that.panels.toolbar.appendChild(buttonRow);
		
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
				
			} else if ((buttonObj = WMD._buttons[buttonName]) && !!buttonObj.className) {
				//button name exists, add button to button bar
				buttonNode = document.createElement("li");
				buttonNode.className = "wmd-button "+buttonObj.className;
				if (buttonObj.titleText) buttonNode.setAttribute('title', buttonObj.titleText);
				buttonNode.setAttribute('data-button-name', buttonName);
				
				buttonRow.appendChild(buttonNode);
			}
		
		}
	}

	//IF AN OUTPUT SOURCE IS DEFINED, SETUP THE SHOWDOWN CONVERTER
	if (that.panels.output || that.panels.preview) {
		var converter = new Showdown(opts.markdown);
		var updateOutput = function buildHTMLFromMarkdown() {
			var html = converter.makeHtml(that.panels.input.value);
			
			//write to output field
			if (that.panels.output) {
				// The value property is only defined if the output is a textarea/input.
				// If value is not defined, then we're treating output as a DOMElement
				if (that.panels.output.value !== undefined) {
					that.panels.output.value = html;
				} else {
					that.panels.output.innerHTML = html;
				}
			}

			//write to preview container
			if (that.panels.preview) {
				that.panels.preview.innerHTML = html;
			}
		};
		
		var ip = new InputPoller(that.panels.input, updateOutput, opts.previewPollInterval);
		WMD.subscribe('content-changed', function (chunk) {
			if (this == that) updateOutput();
		});
	}


	WMD.publish('editor-created', that);
	WMD.publish('editor-ready', that);
};

window.WMDEditor = WMD;

WMD.defaults = {
	lineLength: 40,

	button_bar: "wmd-button-bar",
	preview: "wmd-preview",
	output: "wmd-output",
	input: "wmd-input",
	
	markdown: {
		markright: true,
		specialChars: true
	},

	// Some intervals in ms.  These can be adjusted to reduce the control's load.
	previewPollInterval: 500,
	pastePollInterval: 100,

	buttons: "bold italic  link blockquote code image  ol ul heading hr  undo redo help",
	disableKeyShortcuts: false,
	
	autoFormatting: {
		list: true,
		quote: true,
		code: true
	}

};

WMD.prototype = {
	pushUpdate : function (chunk) {
		this.panels.input.value = [chunk.before,chunk.content,chunk.after].join('');
		this.selection.set(chunk);
		WMD.publish('content-changed', this, [chunk]); //dispatch a content change event containing the new chunk
	}
};

WMD.Version = 3.0;
WMD.pluginDebug = false;

WMD._buttons = {};
WMD._shortcutKeys = {};


WMD.registerButton = function (name, options) {
	if (WMD._buttons[name]) throw "WMDEditor: A button named "+name+" is already defined.";
	
	var btn = util.extend({
				className:'wmd-button-'+name,
				titleText:'',
				shortcut:''
			}, options || {});
	
	WMD._buttons[name] = btn;
	if (btn.shortcut && !WMD._shortcutKeys[btn.shortcut]) WMD._shortcutKeys[btn.shortcut] = name;
};

/*

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


*/

