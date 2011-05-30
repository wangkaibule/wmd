var util = {
	isIE : /msie/.test(nav.userAgent.toLowerCase()),
	isIE_5or6 : /msie 6/.test(nav.userAgent.toLowerCase()) || /msie 5/.test(nav.userAgent.toLowerCase()),
	isOpera : /opera/.test(nav.userAgent.toLowerCase()),
	isKonqueror : /konqueror/.test(nav.userAgent.toLowerCase()),


// ELEMENT FUNCTIONS

	$: function (elem) {
		return (typeof elem == 'string') ? document.getElementById(elem) : elem;
	},

	// Returns true if the DOM element is visible, false if it's hidden.
	// Checks if display is anything other than none.
	isVisible: function (elem) {
		// shamelessly copied from jQuery
		return elem.offsetWidth > 0 || elem.offsetHeight > 0;
	},

	// Adds a listener callback to a DOM element which is fired on a specified
	// event.
	addEvent: function (elem, event, callback) {
		var listener = function (event) {
			event = event || window.event;
			var target = event.target || event.srcElement; 
			callback.apply(elem, [event, target]);
		};
		if (elem.attachEvent) { // IE only.  The "on" is mandatory.
			elem.attachEvent("on" + event, listener);
		} else { // Other browsers.
			elem.addEventListener(event, listener, false);
		}
		return listener;
	},

	// Removes a listener callback from a DOM element which is fired on a specified
	// event.
	removeEvent: function (elem, event, listener) {
		if (elem.detachEvent) {	// IE only.  The "on" is mandatory.
			elem.detachEvent("on" + event, listener);
		} else { // Other browsers.
			elem.removeEventListener(event, listener, false);
		}
	},
	
	hasClassName: function(elem, className) { //copied and modified from Prototype.js
		if (!(elem = util.$(elem))) return;
		var eClassName = elem.className;
		return (eClassName.length > 0 && (eClassName == className || new RegExp("(^|\\s)" + className + "(\\s|$)").test(eClassName)));
	},

	addClassName: function(elem, className) { //copied and modified from Prototype.js
		if (!(elem = util.$(elem))) return;
		if (!util.hasClassName(elem, className)) elem.className += (elem.className ? ' ' : '') + className;
	},

	removeClassName: function(eleme, className) { //copied and modified from Prototype.js
		if (!(elem = util.$(elem))) return;
		elem.className = util.trimString(elem.className.replace(new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' '));
	},

	getTop: function (elem, isInner) {
		var result = elem.offsetTop;
		if (!isInner) {
			while ((elem = elem.offsetParent)) {
				result += elem.offsetTop;
			}
		}
		return result;
	},

	getHeight: function (elem) {
		return elem.offsetHeight || elem.scrollHeight;
	},

	getWidth: function (elem) {
		return elem.offsetWidth || elem.scrollWidth;
	},
	
	
// TEXT FUNCTIONS	
	
	trimString: function (input) {
		return input.replace(/^\s+/, '').replace(/\s+$/, '');
	},
	
	// Converts \r\n and \r to \n.
	fixLineEndings: function (text) {
		text = text.replace(/\r\n/g, "\n");
		text = text.replace(/\r/g, "\n");
		return text;
	},

	// Extends a regular expression.  Returns a new RegExp
	// using pre + regex + post as the expression.
	// Used in a few functions where we have a base
	// expression and we want to pre- or append some
	// conditions to it (e.g. adding "$" to the end).
	// The flags are unchanged.
	//
	// regex is a RegExp, pre and post are strings.
	extendRegExp: function (regex, pre, post) {

		if (pre === null || pre === undefined) {
			pre = "";
		}
		if (post === null || post === undefined) {
			post = "";
		}

		var pattern = regex.toString();
		var flags = "";

		// Replace the flags with empty space and store them.
		// Technically, this can match incorrect flags like "gmm".
		var result = pattern.match(/\/([gim]*)$/);
		if (result === null) {
			flags = result[0];
		}
		else {
			flags = "";
		}

		// Remove the flags and slash delimiters from the regular expression.
		pattern = pattern.replace(/(^\/|\/[gim]*$)/g, "");
		pattern = pre + pattern + post;

		return new RegExp(pattern, flags);
	},

	// Sets the image for a button passed to the WMD editor.
	// Returns a new element with the image attached.
	// Adds several style properties to the image.
	//
	// XXX-ANAND: Is this used anywhere?
	createImage: function (img) {

		var imgPath = imageDirectory + img;

		var elem = document.createElement("img");
		elem.className = "wmd-button";
		elem.src = imgPath;

		return elem;
	},

	// This simulates a modal dialog box and asks for the URL when you
	// click the hyperlink or image buttons.
	//
	// text: The html for the input box.
	// defaultInputText: The default value that appears in the input box.
	// makeLinkMarkdown: The function which is executed when the prompt is dismissed, either via OK or Cancel
	prompt: function (text, defaultInputText, makeLinkMarkdown, promptType) {

		// These variables need to be declared at this level since they are used
		// in multiple functions.
		var dialog; // The dialog box.
		var background; // The background beind the dialog box.
		var input; // The text box where you enter the hyperlink.
		var titleInput; // The text box for the image's title text
		var newWinCheckbox; //The checkbox to choose if a link should be opened in a new window.
		if (defaultInputText === undefined) {
			defaultInputText = "";
		}

		// Used as a keydown event handler. Esc dismisses the prompt.
		// Key code 27 is ESC.
		var checkEscape = function (key) {
			var code = (key.charCode || key.keyCode);
			if (code === 27) {
				close(true);
			}
		};

		// Dismisses the hyperlink input box.
		// isCancel is true if we don't care about the input text.
		// isCancel is false if we are going to keep the text.
		var close = function (isCancel) {
			util.removeEvent(document.body, "keydown", checkEscape);
			var text = input.value+ (titleInput.value?' "'+titleInput.value+'"':'');

			if (isCancel) {
				text = null;
			}
			else {
				// Fixes common pasting errors.
				text = text.replace('http://http://', 'http://');
				text = text.replace('http://https://', 'https://');
				text = text.replace('http://ftp://', 'ftp://');
				if (promptType=='link' && newWinCheckbox.checked) text = '!'+text;
			}

			dialog.parentNode.removeChild(dialog);
			background.parentNode.removeChild(background);
			makeLinkMarkdown(text);
			return false;
		};

		// Creates the background behind the hyperlink text entry box.
		// Most of this has been moved to CSS but the div creation and
		// browser-specific hacks remain here.
		var createBackground = function () {
			background = document.createElement("div");
			background.className = "wmd-prompt-background";
			style = background.style;
			style.position = "absolute";
			style.top = "0";

			style.zIndex = "10000";

			// Some versions of Konqueror don't support transparent colors
			// so we make the whole window transparent.
			//
			// Is this necessary on modern konqueror browsers?
			if (util.isKonqueror) {
				style.backgroundColor = "transparent";
			}
			else if (util.isIE) {
				style.filter = "alpha(opacity=50)";
			}
			else {
				style.opacity = "0.5";
			}

			var pageSize = position.getPageSize();
			style.height = pageSize[1] + "px";

			if (util.isIE) {
				style.left = document.documentElement.scrollLeft;
				style.width = document.documentElement.clientWidth;
			}
			else {
				style.left = "0";
				style.width = "100%";
			}

			document.body.appendChild(background);
		};

		// Create the text input box form/window.
		var createDialog = function () {

			// The main dialog box.
			dialog = document.createElement("div");
			dialog.className = "wmd-prompt-dialog";
			dialog.style.padding = "10px;";
			dialog.style.position = "fixed";
			dialog.style.width = "400px";
			dialog.style.zIndex = "10001";

			// The dialog text.
			var question = document.createElement("div");
			question.innerHTML = text;
			question.style.padding = "5px";
			dialog.appendChild(question);

			// The web form container for the text box and buttons.
			var form = document.createElement("form");
			form.onsubmit = function () {
				return close(false);
			};
			var style = form.style;
			style.padding = "0";
			style.margin = "0";
			style.cssFloat = "left";
			style.width = "100%";
			style.textAlign = "center";
			style.position = "relative";
			dialog.appendChild(form);
		
			var label = document.createElement("label");
			style = label.style;
			style.display = "block";
			style.width = "80%";
			style.marginLeft = style.marginRight = "auto";
			style.textAlign = "left";
			form.appendChild(label);

				label.appendChild(document.createTextNode(promptType+" URL:"));

				// The input text box
				input = document.createElement("input");
				input.type = "text";
				input.value = defaultInputText;
				style = input.style;
				style.display = "block";
				style.width = "100%";
				style.marginLeft = style.marginRight = "auto";
				label.appendChild(input);

			label = document.createElement("label");
			style = label.style;
			style.display = "block";
			style.width = "80%";
			style.marginLeft = style.marginRight = "auto";
			style.textAlign = "left";
			form.appendChild(label);
		
				label.appendChild(document.createTextNode(promptType+" Title (Hover Text):"));

				// The input text box
				titleInput = document.createElement("input");
				titleInput.type = "text";
				style = titleInput.style;
				style.display = "block";
				style.width = "100%";
				style.marginLeft = style.marginRight = "auto";
				label.appendChild(titleInput);
			
		
			if (promptType=='link') {
				label = document.createElement("label");
				style = label.style;
				style.display = "block";
				style.textAlign = "center";
				form.appendChild(label);
		
					newWinCheckbox = document.createElement("input");
					newWinCheckbox.type = 'checkbox';
					newWinCheckbox.value = '!';
					label.appendChild(newWinCheckbox);
	
					label.appendChild(document.createTextNode(" Have this link open in a new window"));
			}
		
			// The ok button
			var okButton = document.createElement("input");
			okButton.type = "button";
			okButton.onclick = function () {
				return close(false);
			};
			okButton.value = "OK";
			style = okButton.style;
			style.margin = "10px";
			style.display = "inline";
			style.width = "7em";


			// The cancel button
			var cancelButton = document.createElement("input");
			cancelButton.type = "button";
			cancelButton.onclick = function () {
				return close(true);
			};
			cancelButton.value = "Cancel";
			style = cancelButton.style;
			style.margin = "10px";
			style.display = "inline";
			style.width = "7em";

			// The order of these buttons is different on macs.
			if (/mac/.test(nav.platform.toLowerCase())) {
				form.appendChild(cancelButton);
				form.appendChild(okButton);
			}
			else {
				form.appendChild(okButton);
				form.appendChild(cancelButton);
			}

			util.addEvent(document.body, "keydown", checkEscape);
			dialog.style.top = "50%";
			dialog.style.left = "50%";
			dialog.style.display = "block";
			if (util.isIE_5or6) {
				dialog.style.position = "absolute";
				dialog.style.top = document.documentElement.scrollTop + 200 + "px";
				dialog.style.left = "50%";
			}
			document.body.appendChild(dialog);

			// This has to be done AFTER adding the dialog to the form if you
			// want it to be centered.
			dialog.style.marginTop = -(position.getHeight(dialog) / 2) + "px";
			dialog.style.marginLeft = -(position.getWidth(dialog) / 2) + "px";
		};

		createBackground();

		// Why is this in a zero-length timeout?
		// Is it working around a browser bug?
		setTimeout(function () {
			createDialog();

			var defTextLen = defaultInputText.length;
			if (input.selectionStart !== undefined) {
				input.selectionStart = 0;
				input.selectionEnd = defTextLen;
			}
			else if (input.createTextRange) {
				var range = input.createTextRange();
				range.collapse(false);
				range.moveStart("character", -defTextLen);
				range.moveEnd("character", defTextLen);
				range.select();
			}
			input.focus();
		}, 0);
	},

	extend: function () {
		/* Combines multiple objects into one.
		 * Syntax: util.extend([true], object1, object2, ... objectN)
		 * If first argument is true, function will merge recursively.
		 */
		
		var deep = (arguments[0]===true),
			d = {},
			i = deep?1:0;

		function _update(a, b) {
			for (var k in b) if (b.hasOwnProperty(k)){
				//if property is an object or array, merge the contents instead of overwriting, if extend() was called as such
				if (deep && typeof a[k] === 'object' && typeof b[k] === 'object') _update(a[k], b[k]);
				else a[k] = b[k];
			}
			return a;
		}

		for (; i < arguments.length; i++) {
			_update(d, arguments[i]);
		}
		return d;
	},

	getPageSize: function () {
		var scrollWidth, scrollHeight;
		var innerWidth, innerHeight;

		// It's not very clear which blocks work with which browsers.
		if (self.innerHeight && self.scrollMaxY) {
			scrollWidth = document.body.scrollWidth;
			scrollHeight = self.innerHeight + self.scrollMaxY;
		}
		else if (document.body.scrollHeight > document.body.offsetHeight) {
			scrollWidth = document.body.scrollWidth;
			scrollHeight = document.body.scrollHeight;
		}
		else {
			scrollWidth = document.body.offsetWidth;
			scrollHeight = document.body.offsetHeight;
		}

		if (self.innerHeight) {
			// Non-IE browser
			innerWidth = self.innerWidth;
			innerHeight = self.innerHeight;
		}
		else if (document.documentElement && document.documentElement.clientHeight) {
			// Some versions of IE (IE 6 w/ a DOCTYPE declaration)
			innerWidth = document.documentElement.clientWidth;
			innerHeight = document.documentElement.clientHeight;
		}
		else if (document.body) {
			// Other versions of IE
			innerWidth = document.body.clientWidth;
			innerHeight = document.body.clientHeight;
		}

		var maxWidth = Math.max(scrollWidth, innerWidth);
		var maxHeight = Math.max(scrollHeight, innerHeight);
		return [maxWidth, maxHeight, innerWidth, innerHeight];
	}
};