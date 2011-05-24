
(function () { //BOLD AND ITALIC BUTTON SCOPE
	
	// chunk: The selected region that will be enclosed with */**
	// nStars: 1 for italics, 2 for bold
	// insertText: If you just click the button without highlighting text, this gets inserted
	var doBoldOrItalic = function (chunk, nStars, insertText) {

		// Get rid of whitespace and fixup newlines.
		chunk.trimWhitespace();
		chunk.selection = chunk.selection.replace(/\n{2,}/g, "\n");

		// Look for stars before and after.  Is the chunk already marked up?
		var starsBefore = chunk.before.match(/(\**$)/)[1];
		var starsAfter = chunk.after.match(/(^\**)/)[1];

		var prevStars = Math.min(starsBefore.length, starsAfter.length);

		// Remove stars if we have to since the button acts as a toggle.
		if ((prevStars >= nStars) && (prevStars != 2 || nStars != 1)) {
			chunk.before = chunk.before.replace(RegExp("[*]{" + nStars + "}$", ""), "");
			chunk.after = chunk.after.replace(RegExp("^[*]{" + nStars + "}", ""), "");
		}
		else if (!chunk.selection && starsAfter) {
			// It's not really clear why this code is necessary.  It just moves
			// some arbitrary stuff around.
			chunk.before = chunk.before.replace(/(\s?)$/, "");
			var whitespace = RegExp.$1;
			chunk.before = chunk.before + starsAfter + whitespace;
		}
		else {

			// In most cases, if you don't have any selected text and click the button
			// you'll get a selected, marked up region with the default text inserted.
			if (!chunk.selection && !starsAfter) chunk.selection = insertText;

			// Add the true markup.
			var markup = nStars <= 1 ? "*" : "**"; // shouldn't the test be = ?
			chunk.before = chunk.before + markup;
			chunk.after = markup + chunk.after;
		}

		return;
	};


	WMDEditor.Commands['bold'] = {
		buttonClass : 'wmd-bold-button',
		buttonTitle : 'Strong <strong> Ctrl+B',
		shortcut	: 'b',
		action		: function () {doBoldOrItalic(this,2, 'Bold Text');}
	}

	WMDEditor.Commands['italic'] = {
		buttonClass : 'wmd-italic-button',
		buttonTitle : 'Emphasis <em> Ctrl+I',
		shortcut	: 'i',
		action		: function () {doBoldOrItalic(this,2, 'Italic Text');}
	}

})();


(function () { //LINK AND IMAGE BUTTON SCOPE
	

	var stripLinkDefs = function (text, defsToAdd) {

		text = text.replace(/^[ ]{0,3}\[(\d+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?[ \t]*\n?[ \t]*(?:(\n*)["(](.+?)[")][ \t]*)?(?:\n+|$)/gm, function (totalMatch, id, link, newlines, title) {
			defsToAdd[id] = totalMatch.replace(/\s*$/, "");
			if (newlines) {
				// Strip the title and return that separately.
				defsToAdd[id] = totalMatch.replace(/["(](.+?)[")]$/, "");
				return newlines + title;
			}
			return "";
		});

		return text;
	};

	var addLinkDef = function (chunk, linkDef) {

		var refNumber = 0; // The current reference number
		var defsToAdd = {}; //
		// Start with a clean slate by removing all previous link definitions.
		chunk.before = stripLinkDefs(chunk.before, defsToAdd);
		chunk.selection = stripLinkDefs(chunk.selection, defsToAdd);
		chunk.after = stripLinkDefs(chunk.after, defsToAdd);

		var defs = "";
		var regex = /(\[(?:\[[^\]]*\]|[^\[\]])*\][ ]?(?:\n[ ]*)?\[)(\d+)(\])/g;

		var addDefNumber = function (def) {
			refNumber++;
			def = def.replace(/^[ ]{0,3}\[(\d+)\]:/, "  [" + refNumber + "]:");
			defs += "\n" + def;
		};

		var getLink = function (wholeMatch, link, id, end) {

			if (defsToAdd[id]) {
				addDefNumber(defsToAdd[id]);
				return link + refNumber + end;

			}
			return wholeMatch;
		};

		chunk.before = chunk.before.replace(regex, getLink);

		if (linkDef) {
			addDefNumber(linkDef);
		}
		else {
			chunk.selection = chunk.selection.replace(regex, getLink);
		}

		var refOut = refNumber;

		chunk.after = chunk.after.replace(regex, getLink);

		if (chunk.after) {
			chunk.after = chunk.after.replace(/\n*$/, "");
		}
		if (!chunk.after) {
			chunk.selection = chunk.selection.replace(/\n*$/, "");
		}

		chunk.after += "\n\n" + defs;

		return refOut;
	};

	var doLinkOrImage = function (chunk, postProcessing, isImage) {

		chunk.trimWhitespace();
		chunk.findTags(/\s*!?\[/, /\][ ]?(?:\n[ ]*)?(\[.*?\])?/);

		if (chunk.endTag.length > 1) {

			chunk.startTag = chunk.startTag.replace(/!?\[/, "");
			chunk.endTag = "";
			WMDEditor.Commands.addLinkDef(chunk, null);

		}
		else {

			if (/\n\n/.test(chunk.selection)) {
				WMDEditor.Commands.addLinkDef(chunk, null);
				return;
			}

			// The function to be executed when you enter a link and press OK or Cancel.
			// Marks up the link and adds the ref.
			var makeLinkMarkdown = function (link) {
				console.log(link);
				if (link !== null) {

					chunk.startTag = chunk.endTag = "";
					var linkDef = " [999]: " + link;

					var num = WMDEditor.Commands.addLinkDef(chunk, linkDef);
					chunk.startTag = isImage ? "![" : "[";
					chunk.endTag = "][" + num + "]";

					if (!chunk.selection) {
						if (isImage) {
							chunk.selection = "alt text";
						}
						else {
							chunk.selection = "link text";
						}
					}
				}
				postProcessing();
			};

			if (isImage) {
				util.prompt(wmd_options.imageDialogText, wmd_options.imageDefaultText, makeLinkMarkdown, 'Image');
			}
			else {
				util.prompt(wmd_options.linkDialogText, wmd_options.linkDefaultText, makeLinkMarkdown, 'Link');
			}
			return true;
		}
	};
	
	WMDEditor.Commands['link'] = {
		buttonClass : 'wmd-link-button',
		buttonTitle : 'Hyperlink <a> Ctrl+L',
		shortcut	: 'l',
		action		: function (postProcessing, useDefaultText) {return doLinkOrImage(this, postProcessing, false);}
	}

	WMDEditor.Commands['image'] = {
		buttonClass : 'wmd-image-button',
		buttonTitle : 'Image <img> Ctrl+G',
		shortcut	: 'g',
		action		: function (postProcessing, useDefaultText) {return doLinkOrImage(this, postProcessing, true);}
	}
	

})();



// Moves the cursor to the next line and continues lists, quotes and code.
WMDEditor.Commands.doAutoindent = function (chunk, postProcessing, useDefaultText) {
	if (!wmd.options.autoFormatting) return;

	if (wmd.options.autoFormatting.list) chunk.before = chunk.before.replace(/(\n|^)[ ]{0,3}([*+-]|\d+[.])[ \t]*\n$/, "\n\n");
	if (wmd.options.autoFormatting.quote) chunk.before = chunk.before.replace(/(\n|^)[ ]{0,3}>[ \t]*\n$/, "\n\n");
	if (wmd.options.autoFormatting.code) chunk.before = chunk.before.replace(/(\n|^)[ \t]+\n$/, "\n\n");

	useDefaultText = false;

	if (/(\n|^)[ ]{0,3}([*+-])[ \t]+.*\n$/.test(chunk.before)) {
		if (WMDEditor.Commands.doList && wmd.options.autoFormatting.list) {
			WMDEditor.Commands.doList(chunk, postProcessing, false, true);
		}
	}
	if (/(\n|^)[ ]{0,3}(\d+[.])[ \t]+.*\n$/.test(chunk.before)) {
		if (WMDEditor.Commands.doList && wmd.options.autoFormatting.list) {
			WMDEditor.Commands.doList(chunk, postProcessing, true, true);
		}
	}
	if (/(\n|^)[ ]{0,3}>[ \t]+.*\n$/.test(chunk.before)) {
		if (WMDEditor.Commands.doBlockquote && wmd.options.autoFormatting.quote) {
			WMDEditor.Commands.doBlockquote(chunk, postProcessing, useDefaultText);
		}
	}
	if (/(\n|^)(\t|[ ]{4,}).*\n$/.test(chunk.before)) {
		if (WMDEditor.Commands.doCode && wmd.options.autoFormatting.code) {
			WMDEditor.Commands.doCode(chunk, postProcessing, useDefaultText);
		}
	}
};

WMDEditor.Commands.doBlockquote = function (chunk, postProcessing, useDefaultText) {

	chunk.selection = chunk.selection.replace(/^(\n*)([^\r]+?)(\n*)$/, function (totalMatch, newlinesBefore, text, newlinesAfter) {
		chunk.before += newlinesBefore;
		chunk.after = newlinesAfter + chunk.after;
		return text;
	});

	chunk.before = chunk.before.replace(/(>[ \t]*)$/, function (totalMatch, blankLine) {
		chunk.selection = blankLine + chunk.selection;
		return "";
	});

	var defaultText = useDefaultText ? "Blockquote" : "";
	chunk.selection = chunk.selection.replace(/^(\s|>)+$/, "");
	chunk.selection = chunk.selection || defaultText;

	if (chunk.before) {
		chunk.before = chunk.before.replace(/\n?$/, "\n");
	}
	if (chunk.after) {
		chunk.after = chunk.after.replace(/^\n?/, "\n");
	}

	chunk.before = chunk.before.replace(/(((\n|^)(\n[ \t]*)*>(.+\n)*.*)+(\n[ \t]*)*$)/, function (totalMatch) {
		chunk.startTag = totalMatch;
		return "";
	});

	chunk.after = chunk.after.replace(/^(((\n|^)(\n[ \t]*)*>(.+\n)*.*)+(\n[ \t]*)*)/, function (totalMatch) {
		chunk.endTag = totalMatch;
		return "";
	});

	var replaceBlanksInTags = function (useBracket) {

		var replacement = useBracket ? "> " : "";

		if (chunk.startTag) {
			chunk.startTag = chunk.startTag.replace(/\n((>|\s)*)\n$/, function (totalMatch, markdown) {
				return "\n" + markdown.replace(/^[ ]{0,3}>?[ \t]*$/gm, replacement) + "\n";
			});
		}
		if (chunk.endTag) {
			chunk.endTag = chunk.endTag.replace(/^\n((>|\s)*)\n/, function (totalMatch, markdown) {
				return "\n" + markdown.replace(/^[ ]{0,3}>?[ \t]*$/gm, replacement) + "\n";
			});
		}
	};

	if (/^(?![ ]{0,3}>)/m.test(chunk.selection)) {
		chunk.wrap(wmd_options.lineLength - 2);
		chunk.selection = chunk.selection.replace(/^/gm, "> ");
		replaceBlanksInTags(true);
		chunk.addBlankLines();
	}
	else {
		chunk.selection = chunk.selection.replace(/^[ ]{0,3}> ?/gm, "");
		chunk.unwrap();
		replaceBlanksInTags(false);

		if (!/^(\n|^)[ ]{0,3}>/.test(chunk.selection) && chunk.startTag) {
			chunk.startTag = chunk.startTag.replace(/\n{0,2}$/, "\n\n");
		}

		if (!/(\n|^)[ ]{0,3}>.*$/.test(chunk.selection) && chunk.endTag) {
			chunk.endTag = chunk.endTag.replace(/^\n{0,2}/, "\n\n");
		}
	}

	if (!/\n/.test(chunk.selection)) {
		chunk.selection = chunk.selection.replace(/^(> *)/, function (wholeMatch, blanks) {
			chunk.startTag += blanks;
			return "";
		});
	}
};

WMDEditor.Commands.doCode = function (chunk, postProcessing, useDefaultText) {

	var hasTextBefore = /\S[ ]*$/.test(chunk.before);
	var hasTextAfter = /^[ ]*\S/.test(chunk.after);

	// Use 'four space' markdown if the selection is on its own
	// line or is multiline.
	if ((!hasTextAfter && !hasTextBefore) || /\n/.test(chunk.selection)) {

		chunk.before = chunk.before.replace(/[ ]{4}$/, function (totalMatch) {
			chunk.selection = totalMatch + chunk.selection;
			return "";
		});

		var nLinesBefore = 1;
		var nLinesAfter = 1;


		if (/\n(\t|[ ]{4,}).*\n$/.test(chunk.before) || chunk.after === "") {
			nLinesBefore = 0;
		}
		if (/^\n(\t|[ ]{4,})/.test(chunk.after)) {
			nLinesAfter = 0; // This needs to happen on line 1
		}

		chunk.addBlankLines(nLinesBefore, nLinesAfter);

		if (!chunk.selection) {
			chunk.startTag = "    ";
			chunk.selection = useDefaultText ? "enter code here" : "";
		}
		else {
			if (/^[ ]{0,3}\S/m.test(chunk.selection)) {
				chunk.selection = chunk.selection.replace(/^/gm, "    ");
			}
			else {
				chunk.selection = chunk.selection.replace(/^[ ]{4}/gm, "");
			}
		}
	}
	else {
		// Use backticks (`) to delimit the code block.
		chunk.trimWhitespace();
		chunk.findTags(/`/, /`/);

		if (!chunk.startTag && !chunk.endTag) {
			chunk.startTag = chunk.endTag = "`";
			if (!chunk.selection) {
				chunk.selection = useDefaultText ? "enter code here" : "";
			}
		}
		else if (chunk.endTag && !chunk.startTag) {
			chunk.before += chunk.endTag;
			chunk.endTag = "";
		}
		else {
			chunk.startTag = chunk.endTag = "";
		}
	}
};

WMDEditor.Commands.doList = function (chunk, postProcessing, isNumberedList, useDefaultText) {

	// These are identical except at the very beginning and end.
	// Should probably use the regex extension function to make this clearer.
	var previousItemsRegex = /(\n|^)(([ ]{0,3}([*+-]|\d+[.])[ \t]+.*)(\n.+|\n{2,}([*+-].*|\d+[.])[ \t]+.*|\n{2,}[ \t]+\S.*)*)\n*$/;
	var nextItemsRegex = /^\n*(([ ]{0,3}([*+-]|\d+[.])[ \t]+.*)(\n.+|\n{2,}([*+-].*|\d+[.])[ \t]+.*|\n{2,}[ \t]+\S.*)*)\n*/;

	// The default bullet is a dash but others are possible.
	// This has nothing to do with the particular HTML bullet,
	// it's just a markdown bullet.
	var bullet = "-";

	// The number in a numbered list.
	var num = 1;

	// Get the item prefix - e.g. " 1. " for a numbered list, " - " for a bulleted list.
	var getItemPrefix = function () {
		var prefix;
		if (isNumberedList) {
			prefix = " " + num + ". ";
			num++;
		}
		else {
			prefix = " " + bullet + " ";
		}
		return prefix;
	};

	// Fixes the prefixes of the other list items.
	var getPrefixedItem = function (itemText) {

		// The numbering flag is unset when called by autoindent.
		if (isNumberedList === undefined) {
			isNumberedList = /^\s*\d/.test(itemText);
		}

		// Renumber/bullet the list element.
		itemText = itemText.replace(/^[ ]{0,3}([*+-]|\d+[.])\s/gm, function (_) {
			return getItemPrefix();
		});

		return itemText;
	};

	chunk.findTags(/(\n|^)*[ ]{0,3}([*+-]|\d+[.])\s+/, null);

	if (chunk.before && !/\n$/.test(chunk.before) && !/^\n/.test(chunk.startTag)) {
		chunk.before += chunk.startTag;
		chunk.startTag = "";
	}

	if (chunk.startTag) {

		var hasDigits = /\d+[.]/.test(chunk.startTag);
		chunk.startTag = "";
		chunk.selection = chunk.selection.replace(/\n[ ]{4}/g, "\n");
		chunk.unwrap();
		chunk.addBlankLines();

		if (hasDigits) {
			// Have to renumber the bullet points if this is a numbered list.
			chunk.after = chunk.after.replace(nextItemsRegex, getPrefixedItem);
		}
		if (isNumberedList == hasDigits) {
			return;
		}
	}

	var nLinesBefore = 1;

	chunk.before = chunk.before.replace(previousItemsRegex, function (itemText) {
		if (/^\s*([*+-])/.test(itemText)) {
			bullet = re.$1;
		}
		nLinesBefore = /[^\n]\n\n[^\n]/.test(itemText) ? 1 : 0;
		return getPrefixedItem(itemText);
	});

	if (!chunk.selection) {
		chunk.selection = useDefaultText ? "List item" : " ";
	}

	var prefix = getItemPrefix();

	var nLinesAfter = 1;

	chunk.after = chunk.after.replace(nextItemsRegex, function (itemText) {
		nLinesAfter = /[^\n]\n\n[^\n]/.test(itemText) ? 1 : 0;
		return getPrefixedItem(itemText);
	});

	chunk.trimWhitespace(true);
	chunk.addBlankLines(nLinesBefore, nLinesAfter, true);
	chunk.startTag = prefix;
	var spaces = prefix.replace(/./g, " ");
	chunk.wrap(wmd_options.lineLength - spaces.length);
	chunk.selection = chunk.selection.replace(/\n/g, "\n" + spaces);

};

WMDEditor.Commands.doHeading = function (chunk, postProcessing, useDefaultText) {

	// Remove leading/trailing whitespace and reduce internal spaces to single spaces.
	chunk.selection = chunk.selection.replace(/\s+/g, " ");
	chunk.selection = chunk.selection.replace(/(^\s+|\s+$)/g, "");

	// If we clicked the button with no selected text, we just
	// make a level 2 hash header around some default text.
	if (!chunk.selection) {
		chunk.startTag = "## ";
		chunk.selection = "Heading";
		chunk.endTag = " ##";
		return;
	}

	var headerLevel = 0; // The existing header level of the selected text.
	// Remove any existing hash heading markdown and save the header level.
	chunk.findTags(/#+[ ]*/, /[ ]*#+/);
	if (/#+/.test(chunk.startTag)) {
		headerLevel = re.lastMatch.length;
	}
	chunk.startTag = chunk.endTag = "";

	// Try to get the current header level by looking for - and = in the line
	// below the selection.
	chunk.findTags(null, /\s?(-+|=+)/);
	if (/=+/.test(chunk.endTag)) {
		headerLevel = 1;
	}
	if (/-+/.test(chunk.endTag)) {
		headerLevel = 2;
	}

	// Skip to the next line so we can create the header markdown.
	chunk.startTag = chunk.endTag = "";
	chunk.addBlankLines(1, 1);

	// We make a level 2 header if there is no current header.
	// If there is a header level, we substract one from the header level.
	// If it's already a level 1 header, it's removed.
	var headerLevelToCreate = headerLevel == 0 ? 2 : headerLevel - 1;

	if (headerLevelToCreate > 0) {

		// The button only creates level 1 and 2 underline headers.
		// Why not have it iterate over hash header levels?  Wouldn't that be easier and cleaner?
		var headerChar = headerLevelToCreate >= 2 ? "-" : "=";
		var len = chunk.selection.length;
		if (len > wmd_options.lineLength) {
			len = wmd_options.lineLength;
		}
		chunk.endTag = "\n";
		while (len--) {
			chunk.endTag += headerChar;
		}
	}
};

WMDEditor.Commands.doHorizontalRule = function (chunk, postProcessing, useDefaultText) {
	chunk.startTag = "----------\n";
	chunk.selection = "";
	chunk.addBlankLines(2, 1, true);
};

