
(function () {
	
	// chunk: The selected region that will be enclosed with */**
	// nStars: 1 for italics, 2 for bold
	// insertText: If you just click the button without highlighting text, this gets inserted
	var doBoldOrItalic = function (chunk, nStars, insertText) {

		// Get rid of whitespace and fixup newlines.
		chunk.trimWhitespace();
		chunk.selected = chunk.selected.replace(/\n{2,}/g, "\n");

		// Look for stars before and after.  Is the chunk already marked up?
		var starsBefore = chunk.before.match(/(\**$)/)[1];
		var starsAfter = chunk.after.match(/(^\**)/)[1];

		var prevStars = Math.min(starsBefore.length, starsAfter.length);

		// Remove stars if we have to since the button acts as a toggle.
		if ((prevStars >= nStars) && (prevStars != 2 || nStars != 1)) {
			chunk.before = chunk.before.replace(RegExp("[*]{" + nStars + "}$", ""), "");
			chunk.after = chunk.after.replace(RegExp("^[*]{" + nStars + "}", ""), "");

		}
		else if (!chunk.selected && starsAfter) {
			// It's not really clear why this code is necessary.  It just moves
			// some arbitrary stuff around.
			chunk.before = chunk.before.replace(/(\s?)$/, "");
			chunk.before = chunk.before + starsAfter + RegExp.$1;
		}
		else {
			// In most cases, if you don't have any selected text and click the button
			// you'll get a selected, marked up region with the default text inserted.
			if (!chunk.selected && !starsAfter) chunk.selected = insertText;

			// Add the true markup.
			var markup = nStars <= 1 ? "*" : "**"; // shouldn't the test be = ?
			chunk.before = chunk.before + markup;
			chunk.after = markup + chunk.after;
		}
		chunk.recount().refill();
	};


	WMD.registerButton('bold', {titleText:'Strong <strong> Ctrl+B', shortcut:'b'});
	WMD.subscribe('toolbar-button:bold', function (event, button) {
		var self = this;
		var chunk = this.selection.get();
	
		doBoldOrItalic(chunk, 2, 'Bold Text');
		
		this.pushUpdate(chunk);
	});

	WMD.registerButton('italic', {titleText:'Emphasis <em> Ctrl+I', shortcut:'i'});
	WMD.subscribe('toolbar-button:italic', function (event, button) {
		var self = this;
		var chunk = this.selection.get();
	
		doBoldOrItalic(chunk, 1, 'Italic Text');

		this.pushUpdate(chunk);
	});


})();
