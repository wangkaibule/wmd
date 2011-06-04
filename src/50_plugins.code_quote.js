
(function () {

//  SETUP BUTTONS ------------------------------------------------------------------------------------------------------------

	WMD.registerButton('code', {titleText:'Code Sample <pre><code> Ctrl+K', shortcut:'k'});
	WMD.registerButton('quote', {titleText:'Blockquote <blockquote> Ctrl+Q', shortcut:'q'});


//  QUOTE AND CODE FORMATTING -----------------------------------------------------------------------------------------------------

	WMD.subscribe('editor-created', function () {
		var that = this;		

		// Auto-continue lists, code blocks and block quotes when
		// the enter key is pressed.
		if (!!that.options.autoFormatting) util.addEvent(that.panels.input, "keyup", function (event, target) {
			
			if (!event.shiftKey && !event.ctrlKey && !event.metaKey && (event.charCode || event.keyCode) === 13) {
				//no modifier keys, and pressed key is enter
				var chunk = this.selection.get();

				if (that.options.autoFormatting.quote) {
					chunk.before = chunk.before.replace(/(\n|^)[ ]{0,3}>[ \t]*\n$/, "\n\n"); //appears to empty the previous line if no body?
					if (/(\n|^)[ ]{0,3}>[ \t]+.*\n$/.test(chunk.before)) {
						//if previous line defined a quote block, trigger a quote block for this line
						//regexp needs to be updated to support nested blocks
						WMD.publish('toolbar-button:quote', self, [event, 'autoformatting']);
					}
				}

				if (that.options.autoFormatting.code) {
					chunk.before = chunk.before.replace(/(\n|^)[ \t]+\n$/, "\n\n"); //appears to empty the previous line if no body?
					if (/(\n|^)(\t|[ ]{4,}).*\n$/.test(chunk.before)) {
						//if previous line defined a code block, trigger a quote block for this line
						//regexp needs to be updated to support nested blocks
						WMD.publish('toolbar-button:code', self, [event, 'autoformatting']);
					}
				}

			}

		});

	});



})();

