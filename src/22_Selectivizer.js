
	var Selectivizer = function (element) {
		this.element = element;
	
		var self = this;
		//Internet Explorer 7 and under use a global text selection, so whenever 
		//the input loses focus we have to save the selection.
		var isIESelection = (typeof element.selectionStart === 'undefined' && !!document.selection);
		if (isIESelection) {
			self.IECachedSelection = null;
			util.addEvent(document, 'mousedown', function (event, element) {
				if (document.activeElement === self.element && element != self.element) {
					//the user clicked outside of this textarea while this textarea was active.
					//save the current selection for when focus returns
					self.IECachedSelection = document.selection.createRange();
				}
			});
		
			var clearCached = function (event, element) {
				self.IECachedSelection = null;
			};
		
			//focus has returned to the element, so we can use it's own selection.
			util.addEvent(element, 'focus',    clearCached);

			//even if we are focused, we sometimes set this value on gets to save processing time
			//a click or key press is a guarenteed selection change
			util.addEvent(element, 'click',    clearCached);
			util.addEvent(element, 'keypress', clearCached);
		}
	
	
	
	};


	Selectivizer.prototype = {
		get : function () {
			var start, end, ret;
			if (typeof this.element.selectionStart != 'undefined') {
				//W3C Method.  Firefox, Safari, Chrome, IE8+
				start = this.element.selectionStart;
				end = this.element.selectionEnd;
				ret = new Selectivizer.Selection({
					start       : start, 
					end         : end,
					content     : this.element.value
				});
				ret.reset();
				return ret;
			
			} else if (!!document.selection) {
				//Microsoft Method. IE7 and below

				//Because this process is so intensive, we save the results with the cached selection
				//If the results are still there, return them instead of running the computation again
				if (!!this.IECachedSelection && !!this.IECachedSelection.SECache) {
					ret = new Selectivizer.Selection(this.IECachedSelection.SECache);
					ret.reset();
					return ret;
				}
				

				//Invisible character used to locate selection position
				var marker = "\x07";
			
				//retrieve our text range
				var range = this.IECachedSelection || document.selection.createRange();
			
				//wrap the current selection in our marker.
				var rangeText = util.fixLineEndings(range.text);
				range.text = marker + rangeText + marker;
			
				//get the full text, containing our marker
				var markedText = util.fixLineEndings(this.element.value);
			
				//reset the selection back to what it was.
				range.moveStart("character", -(rangeText.length+2));
				range.text = rangeText;
			
				//return the selection location by searching our marked text for the markers
				// yes, we seriously have to do it this way, I wish I was joking.
				start = markedText.indexOf(marker);
				end = markedText.lastIndexOf(marker) - 1;
				ret = {
					content  : util.fixLineEndings(this.element.value),
					start    : start,
					end      : end
				};
				
				range.SECache = ret;
				this.IECachedSelection = range;
				
				ret = new Selectivizer.Selection(ret);
				ret.reset();
				return ret;
			}
		},
	
		set : function (sel) {
			if (typeof sel === 'number') sel = {start:sel, end:sel};
			else if (sel instanceof Array) sel = {start:sel[0], end:sel[1]};
		
			if (typeof this.element.selectionStart != 'undefined') {
				//W3C Method.  Firefox, Safari, Chrome, IE8+

				this.element.focus();
				this.element.selectionStart = sel.start;
				this.element.selectionEnd   = sel.end;
			
			} else if (!!document.selection) {

				var range = this.element.createTextRange();
				range.moveStart("character", -this.element.value.length);
				range.moveEnd("character",   -this.element.value.length);
				range.moveEnd("character",   sel.end);
				range.moveStart("character", sel.start);
				range.select();
				
				this.IECachedSelection = range;

			}		
		}
	
	};
	
	
	Selectivizer.Selection = function (sel) {
		if (!!sel) { //we're cloning from another selection
			this.start    = sel.start;
			this.end      = sel.end;
			this.length   = sel.length;
			this.selected = sel.selected;
			this.content  = sel.content;
			this.before   = sel.before;
			this.after	  = sel.after;
		} else {
			this.start    = 0;
			this.end      = 0;
			this.length   = 0;
			this.selected = '';
			this.content  = '';
			this.before   = '';
			this.after	  = '';
		}
	};
	
	Selectivizer.Selection.prototype = {
		prefixes : "(?:\\s{4,}|\\s*>|\\s*-\\s+|\\s*\\d+\\.|=|\\+|-|_|\\*|#|\\s*\\[[^\n]]+\\]:)",
		tabSize : '    ',
		
		trimWhitespace : function (remove) {
			this.selected = this.selected.replace(/^(\s*)/, "");
			if (!remove) this.before += RegExp.$1;

			this.selected = this.selected.replace(/(\s*)$/, "");
			if (!remove) this.after = RegExp.$1 + this.after;

			this.recount();
			
			return this;
		},
		
		
		reset : function () {
			if (this.end < this.start) this.end = this.start();
			
			var start = this.start,
				end = this.end;
			
			this.length   = end - start;
			this.selected = this.content.substring(start,end);
			this.before   = this.content.substring(0, start);
			this.after    = this.content.substring(end);
			
			return this;
		},
		
		recount : function () {
			this.start = this.before.length;
			this.end = this.start + this.selected.length;
			this.length = this.end - this.start;
			
			return this;		
		},
		
		refill : function () {
			this.content = [this.before,this.selected,this.after].join('');
			
			return this;
		},
		
		expandTo : function (size, nondestructive) {
			var that = nondestructive?new Selectivizer.Selection(this):this, 
				newStart = 0,
				newEnd = that.after.length;
				
			switch (size) {
			case 'word':
				newStart = that.before.lastIndexOf(' ');
				newEnd = that.after.indexOf(' ');
			case 'line':
				newStart = Math.max(newStart, that.before.lastIndexOf('\n'));
				newEnd = Math.min(newEnd, that.after.indexOf('\n'));
				break;
			}
			
			that.start = (~newStart) ? newStart+1 : 0;
			that.end = (~newEnd)?that.end + newEnd:that.content.length;
			that.reset();
			return that;
		}

	};
		
/*
		addBlankLines : function (nLinesBefore, nLinesAfter, findExtraNewlines) {

			if (nLinesBefore === undefined) {
				nLinesBefore = 1;
			}

			if (nLinesAfter === undefined) {
				nLinesAfter = 1;
			}

			nLinesBefore++;
			nLinesAfter++;

			var regexText;
			var replacementText;

		    // New bug discovered in Chrome, which appears to be related to use of RegExp.$1
		    // Hack it to hold the match results. Sucks because we're double matching...
			var match = /(^\n*)/.exec(this.selected);

			this.selected = this.selected.replace(/(^\n*)/, "");
			this.startTag = this.startTag + (match ? match[1] : "");
			match = /(\n*$)/.exec(this.selected);
			this.selected = this.selected.replace(/(\n*$)/, "");
			this.endTag = this.endTag + (match ? match[1] : "");
			match = /(^\n*)/.exec(this.startTag);
			this.startTag = this.startTag.replace(/(^\n*)/, "");
			this.before = this.before + (match ? match[1] : "");
			match = /(\n*$)/.exec(this.endTag);
			this.endTag = this.endTag.replace(/(\n*$)/, "");
			this.after = this.after + (match ? match[1] : "");

			if (this.before) {

				regexText = replacementText = "";

				while (nLinesBefore--) {
					regexText += "\\n?";
					replacementText += "\n";
				}

				if (findExtraNewlines) {
					regexText = "\\n*";
				}
				this.before = this.before.replace(new RegExp(regexText + "$", ""), replacementText);
			}

			if (this.after) {

				regexText = replacementText = "";

				while (nLinesAfter--) {
					regexText += "\\n?";
					replacementText += "\n";
				}
				if (findExtraNewlines) {
					regexText = "\\n*";
				}

				this.after = this.after.replace(new RegExp(regexText, ""), replacementText);
			}
		},
		
		wrap : function (len) {
			this.unwrap();
			var regex = new re("(.{1," + len + "})( +|$\\n?)", "gm");
			var prefixes = this.prefixes;

			this.selected = this.selected.replace(regex, function (line, marked) {
				if (new re("^" + prefixes, "").test(line)) {
					return line;
				}
				return marked + "\n";
			});

			this.selected = this.selected.replace(/\s+$/, "");
		},

		unwrap : function () {
			var prefixes = this.prefixes;
			var txt = new re("([^\\n])\\n(?!(\\n|" + prefixes + "))", "g");
			this.selected = this.selected.replace(txt, "$1 $2");
		},
		
		// startRegex: a regular expression to find the start tag
		// endRegex: a regular expresssion to find the end tag
		findTags : function (startRegex, endRegex) {

			var chunkObj = this;
			var regex;

			if (startRegex) {

				regex = util.extendRegExp(startRegex, "", "$");

				this.before = this.before.replace(regex, function (match) {
					chunkObj.startTag = chunkObj.startTag + match;
					return "";
				});

				regex = util.extendRegExp(startRegex, "^", "");

				this.selected = this.selected.replace(regex, function (match) {
					chunkObj.startTag = chunkObj.startTag + match;
					return "";
				});
			}

			if (endRegex) {

				regex = util.extendRegExp(endRegex, "", "$");

				this.selected = this.selected.replace(regex, function (match) {
					chunkObj.endTag = match + chunkObj.endTag;
					return "";
				});

				regex = util.extendRegExp(endRegex, "^", "");

				this.after = this.after.replace(regex, function (match) {
					chunkObj.endTag = match + chunkObj.endTag;
					return "";
				});
			}
		}
		
		
*/	
	