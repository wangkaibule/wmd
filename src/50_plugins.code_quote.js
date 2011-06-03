
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
			
			if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
				var keyCode = event.charCode || event.keyCode;
				// Key code 13 is Enter
				if (keyCode === 13) {// ENTER KEY

					var chunk = this.selection.get();
					if (that.options.autoFormatting.quote) chunk.before = chunk.before.replace(/(\n|^)[ ]{0,3}>[ \t]*\n$/, "\n\n");
					if (that.options.autoFormatting.code) chunk.before = chunk.before.replace(/(\n|^)[ \t]+\n$/, "\n\n");

					if (that.options.autoFormatting.quote) {
						if (/(\n|^)[ ]{0,3}>[ \t]+.*\n$/.test(chunk.before)) {
							WMD.publish('toolbar-button:quote', self, [event, 'autoformatting']);
						}
					}

					if (that.options.autoFormatting.code) {
						if (/(\n|^)(\t|[ ]{4,}).*\n$/.test(chunk.before)) {
							WMD.publish('toolbar-button:code', self, [event, 'autoformatting']);
						}
					}

				}
			}

		});

	});



})();

