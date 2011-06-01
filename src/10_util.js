
var util = {
	isIE : /msie/.test(navigator.userAgent.toLowerCase()),

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
			return callback.apply(elem, [event, target]);
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
	}
};

WMD.util = util;
