
WMD.defaults = {
	version: 3.0,
	lineLength: 40,

	button_bar: "wmd-button-bar",
	preview: "wmd-preview",
	output: "wmd-output",
	input: "wmd-input",

	// Some intervals in ms.  These can be adjusted to reduce the control's load.
	previewPollInterval: 500,
	pastePollInterval: 100,

	buttons: "bold italic  link blockquote code image  ol ul heading hr  undo redo help",
	
	autoFormatting: {
		list: true,
		quote: true,
		code: true,
	}

};