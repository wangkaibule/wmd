
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
			var start, end;
			if (typeof this.element.selectionStart != 'undefined') {
				//W3C Method.  Firefox, Safari, Chrome, IE8+
				start = this.element.selectionStart;
				end = this.element.selectionEnd;
				return new Selectivizer.Selection({
					start   : start, 
					end     : end,
					length  : end - start,
					content : this.element.value.substring(start,end),
					before  : this.element.value.substring(0, start),
					after	: this.element.value.substring(end)
				});
			
			} else if (!!document.selection) {
				//Microsoft Method. IE7 and below

				//Because this process is so intensive, we save the results with the cached selection
				//If the results are still there, return them instead of running the computation again
				if (!!this.IECachedSelection && !!this.IECachedSelection.SECache) return new Selectivizer.Selection(this.IECachedSelection.SECache);
				

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
				var ret = {
						start   : start,
						end     : end,
						length  : start - end,
						content : rangeText,
						before  : this.element.value.substring(0, start),
						after	: this.element.value.substring(end)
					};
				
				range.SECache = ret;
				this.IECachedSelection = range;

				return new Selectivizer.Selection(ret);
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
		},
		
		textReplace : function (newText) {
			var sel = this.get();
			this.element.value = this.element.value.substring(0,sel.start) + newText + this.element.value.substring(sel.end);
			sel.end = sel.start + newText.length;
			sel.content = newText;
			this.set(sel);
			return sel;
		}
	
	};
	
	
	Selectivizer.Selection = function (sel) {
		if (!!sel) { //we're cloning from another selection
			this.start   = sel.start;
			this.end     = sel.end;
			this.length  = sel.length;
			this.content = sel.content;
			this.before  = sel.before;
			this.after	 = sel.after;
		} else {
			this.start   = 0;
			this.end     = 0;
			this.length  = 0;
			this.content = '';
			this.before  = '';
			this.after	 = '';
		}
	};
	
	
	