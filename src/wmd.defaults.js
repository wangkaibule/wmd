
WMD.defaults = {
	version: 3.0,
	lineLength: 40,

	button_bar: "wmd-button-bar",
	preview: "wmd-preview",
	output: "wmd-output",
	input: "wmd-input",

	// The text that appears on the upper part of the dialog box when
	// entering links.
	imageDialogText: "<p style='margin-top: 0px'><b>Enter the image URL.</b></p><p>You can also add a title, which will be displayed as a tool tip.</p><p>Example:<br />http://i.imgur.com/1cZl4.jpg</p>",
	linkDialogText: "<p style='margin-top: 0px'><b>Enter the web address.</b></p><p>You can also add a title, which will be displayed as a tool tip.</p><p>Example:<br />http://www.google.com/</p>",

	// The default text that appears in the dialog input box when entering
	// links.
	imageDefaultText: "http://",
	linkDefaultText: "http://",
	imageDirectory: "images/",

	// The link and title for the help button
	helpLink: "/wmd/markdownhelp.html",
	helpHoverTitle: "Markdown Syntax",
	helpTarget: "_blank",

	// Some intervals in ms.  These can be adjusted to reduce the control's load.
	previewPollInterval: 500,
	pastePollInterval: 100,

	buttons: "bold italic  link blockquote code image  ol ul heading hr  undo redo help",
	
	autoFormatting: {
		list: true,
		quote: true,
		code: true,
	},
	
	modifierKeys: {  //replace this with null or false to disable key-combos
		bold: "b",
		italic: "i",
		link: "l",
		quote: "q",
		code: "k",
		image: "g",
		orderedList: "o",
		unorderedList: "u",
		heading: "h",
		horizontalRule: "r",
		redo: "y",
		undo: "z"
	},
	
	
	tagFilter: {
		enabled: false,
		allowedTags: /^(<\/?(b|blockquote|code|del|dd|dl|dt|em|h1|h2|h3|i|kbd|li|ol|p|pre|s|sup|sub|strong|strike|ul)>|<(br|hr)\s?\/?>)$/i,
		patternLink: /^(<a\shref=("|')(\#\d+|(https?:\/\/|ftp:\/\/|mailto:)[\-A-Za-z0-9+&@#\/%?=~_|!:,.;\(\)]+)\2(\stitle="[^"<>]+")?\s?>|<\/a>)$/i,
		patternImage: /^(<img\ssrc="https?:(\/\/[\-A-Za-z0-9+&@#\/%?=~_|!:,.;\(\)]+)"(\swidth="\d{1,3}")?(\sheight="\d{1,3}")?(\salt="[^"<>]*")?(\stitle="[^"<>]*")?\s?\/?>)$/i
	}
};