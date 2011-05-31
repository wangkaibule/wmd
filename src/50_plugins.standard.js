
WMD.registerButton('link', {titleText:'Hyperlink <a> Ctrl+L', shortcut:'l'});
WMD.registerButton('image', {titleText:'Image <img> Ctrl+G', shortcut:'g'});

WMD.registerButton('ol', {titleText:'Numbered List <ol> Ctrl+O', shortcut:'o'});
WMD.registerButton('ul', {titleText:'Bulleted List <ul> Ctrl+U', shortcut:'u'});

WMD.registerButton('code', {titleText:'Code Sample <pre><code> Ctrl+K', shortcut:'k'});
WMD.registerButton('quote', {titleText:'Blockquote <blockquote> Ctrl+Q', shortcut:'q'});

WMD.registerButton('heading', {titleText:'Heading <h1>/<h2> Ctrl+H', shortcut:'h'});
WMD.registerButton('hr', {titleText:'Horizontal Rule <hr> Ctrl+R', shortcut:'r'});

WMD.registerButton('help', {titleText:'Markdown Quickhelp'});


(function () {

	var trimSelectionWhitespace = function (sel, remove) {
		sel.content = sel.content.replace(/^(\s*)/, "");
		if (!remove) sel.before += RegExp.$1;

		sel.content = sel.content.replace(/(\s*)$/, "");
		if (!remove) {
			sel.after = RegExp.$1 + sel.after;
			sel.end -= (RegExp.$1).length;
		}
	};
	
	// chunk: The selected region that will be enclosed with */**
	// nStars: 1 for italics, 2 for bold
	// insertText: If you just click the button without highlighting text, this gets inserted
	var doBoldOrItalic = function (chunk, nStars, insertText) {

		// Get rid of whitespace and fixup newlines.
		trimSelectionWhitespace(chunk);
		chunk.content = chunk.content.replace(/\n{2,}/g, "\n");

		// Look for stars before and after.  Is the chunk already marked up?
		var starsBefore = chunk.before.match(/(\**$)/)[1];
		var starsAfter = chunk.after.match(/(^\**)/)[1];

		var prevStars = Math.min(starsBefore.length, starsAfter.length);

		// Remove stars if we have to since the button acts as a toggle.
		if ((prevStars >= nStars) && (prevStars != 2 || nStars != 1)) {
			chunk.before = chunk.before.replace(RegExp("[*]{" + nStars + "}$", ""), "");
			chunk.after = chunk.after.replace(RegExp("^[*]{" + nStars + "}", ""), "");

			chunk.start = chunk.before.length;
			chunk.end = chunk.start + chunk.length;

		}
		else if (!chunk.content && starsAfter) {
			// It's not really clear why this code is necessary.  It just moves
			// some arbitrary stuff around.
			chunk.before = chunk.before.replace(/(\s?)$/, "");
			var whitespace = RegExp.$1;
			chunk.before = chunk.before + starsAfter + whitespace;
			chunk.start += (starsAfter + whitespace).length;
			chunk.end += (starsAfter + whitespace).length;
		}
		else {

			// In most cases, if you don't have any selected text and click the button
			// you'll get a selected, marked up region with the default text inserted.
			if (!chunk.content && !starsAfter) chunk.content = insertText;

			// Add the true markup.
			var markup = nStars <= 1 ? "*" : "**"; // shouldn't the test be = ?
			chunk.before = chunk.before + markup;
			chunk.start += markup.length;
			
			chunk.after = markup + chunk.after;
			chunk.end += markup.length;
		}

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