
(function (context) {

	var SelectionEngine = function (element) {
		this.element = element;
	
		var self = this;
		//Internet Explorer 7 and under use a global text selection, so whenever 
		//the input loses focus we have to save the selection.
		var isIESelection = (typeof element.selectionStart === 'undefined' && !!document.selection);
		if (isIESelection) {
			self.IECachedSelection = null;
			util.addEvent(document, 'mousedown', function (event, element) {
				if (document.activeElement === element && element != document.activeElement) {
					//the user clicked outside of this textarea while this textarea was active.
					//save the current selection for when focus returns
					self.IECachedSelection = document.selection.createRange();
				}
			});
		
			util.addEvent(element, 'focus', function (event, element) {
				//focus has returned to the element, so we can use it's own selection.
				self.IECachedSelection = null;
			});
		}
	
	
	
	};

	SelectionEngine.fixLineEndings = function (text) {
		text = text.replace(/\r\n/g, "\n");
		text = text.replace(/\r/g, "\n");
		return text;
	};


	SelectionEngine.prototype = {
		get : function () {
			if (typeof this.element.selectionStart != 'undefined') {
				//W3C Method.  Firefox, Safari, Chrome, IE8+
				return {
					start   : this.element.selectionStart, 
					end     : this.element.selectionEnd,
					length  : this.element.selectionEnd - this.element.selectionStart,
					content : this.element.value.substring(this.element.selectionStart,this.element.selectionEnd)
				};
			
			} else if (!!document.selection) {
				//Microsoft Method. IE7 and below

				//Invisible character used to locate selection position
				var marker = "\x07";
			
				//retrieve our text range
				var range = this.IECachedSelection || document.selection.createRange();
			
				//wrap the current selection in our marker.
				var rangeText = SelectionEngine.fixLineEndings(range.text);
				range.text = marker + rangeText + marker;
			
				//get the full text, containing our marker
				var markedText = SelectionEngine.fixLineEndings(this.element.value);
			
				//reset the selection back to what it was.
				range.moveStart("character", -(rangeText.length+2));
				range.text = rangeText;
			
				//return the selection location by searching our marked text for the markers
				// yes, we seriously have to do it this way, I wish I was joking.
				return {
					start   : markedText.indexOf(marker),
					end     : markedText.lastIndexOf(marker) - 1,
					length  : markedText.length - 2,
					content : rangeText
				};

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

			}		
		}
	
	};
	
	var oldSelectionEngine = context.SelectionEngine;
	SelectionEngine.noConflict = function () {
		var self = SelectionEngine;
		context.SelectionEngine = oldSelectionEngine;
		return self;
	};
	context.SelectionEngine = SelectionEngine;
	
	
})(this);
