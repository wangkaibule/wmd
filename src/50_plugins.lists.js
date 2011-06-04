
(function () {

//  SETUP BUTTONS ------------------------------------------------------------------------------------------------------------

	WMD.registerButton('ol', {titleText:'Numbered List <ol> Ctrl+O', shortcut:'o'});
	WMD.registerButton('ul', {titleText:'Bulleted List <ul> Ctrl+U', shortcut:'u'});


//  LIST AUTO FORMATTING -----------------------------------------------------------------------------------------------------

	WMD.subscribe('editor-created', function () {
		var that = this;		
		
		// Auto-continue lists, code blocks and block quotes when
		// the enter key is pressed.
		if (!!that.options.autoFormatting) util.addEvent(that.panels.input, "keyup", function (event, target) {
			
			if (!event.shiftKey && !event.ctrlKey && !event.metaKey && (event.charCode || event.keyCode) === 13) {

				var chunk = this.selection.get();

				if (that.options.autoFormatting.list) {
					chunk.before = chunk.before.replace(/(\n|^)[ ]{0,3}([*+\-]|\d+[.])[ \t]*\n$/, "\n\n"); //appears to empty the previous line if no body?
					
					//both of the below regexps need to be updated for nested uls
					
					if (/(\n|^)[ ]{0,3}([*+\-])[ \t]+.*\n$/.test(chunk.before)) {
						//trigger a new ul line if the previous line contained a ul
						WMD.publish('toolbar-button:ul', self, [event, 'autoformatting']);
					}
					
					if (/(\n|^)[ ]{0,3}(\d+[.])[ \t]+.*\n$/.test(chunk.before)) {
						//trigger a new ol line if the previous line contain an ol
						WMD.publish('toolbar-button:ol', self, [event, 'autoformatting']);
					}
				}
			}
			
		});
		
	});




})();
