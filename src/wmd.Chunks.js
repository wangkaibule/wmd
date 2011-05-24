// Chunks
// before: contains all the text in the input box BEFORE the selection.
// after: contains all the text in the input box AFTER the selection.
var Chunks = function () {};


// startRegex: a regular expression to find the start tag
// endRegex: a regular expresssion to find the end tag
Chunks.prototype.findTags = function (startRegex, endRegex) {

	var chunkObj = this;
	var regex;

	if (startRegex) {

		regex = util.extendRegExp(startRegex, "", "$");

		this.before = this.before.replace(regex, function (match) {
			chunkObj.startTag = chunkObj.startTag + match;
			return "";
		});

		regex = util.extendRegExp(startRegex, "^", "");

		this.selection = this.selection.replace(regex, function (match) {
			chunkObj.startTag = chunkObj.startTag + match;
			return "";
		});
	}

	if (endRegex) {

		regex = util.extendRegExp(endRegex, "", "$");

		this.selection = this.selection.replace(regex, function (match) {
			chunkObj.endTag = match + chunkObj.endTag;
			return "";
		});

		regex = util.extendRegExp(endRegex, "^", "");

		this.after = this.after.replace(regex, function (match) {
			chunkObj.endTag = match + chunkObj.endTag;
			return "";
		});
	}
};

// If remove is false, the whitespace is transferred
// to the before/after regions.
//
// If remove is true, the whitespace disappears.
Chunks.prototype.trimWhitespace = function (remove) {

	this.selection = this.selection.replace(/^(\s*)/, "");

	if (!remove) {
		this.before += re.$1;
	}

	this.selection = this.selection.replace(/(\s*)$/, "");

	if (!remove) {
		this.after = re.$1 + this.after;
	}
};


Chunks.prototype.addBlankLines = function (nLinesBefore, nLinesAfter, findExtraNewlines) {

	if (nLinesBefore === undefined) {
		nLinesBefore = 1;
	}

	if (nLinesAfter === undefined) {
		nLinesAfter = 1;
	}

	nLinesBefore++;
	nLinesAfter++;

	var regexText;
	var replacementText;

    // New bug discovered in Chrome, which appears to be related to use of RegExp.$1
    // Hack it to hold the match results. Sucks because we're double matching...
	var match = /(^\n*)/.exec(this.selection);

	this.selection = this.selection.replace(/(^\n*)/, "");
	this.startTag = this.startTag + (match ? match[1] : "");
	match = /(\n*$)/.exec(this.selection);
	this.selection = this.selection.replace(/(\n*$)/, "");
	this.endTag = this.endTag + (match ? match[1] : "");
	match = /(^\n*)/.exec(this.startTag);
	this.startTag = this.startTag.replace(/(^\n*)/, "");
	this.before = this.before + (match ? match[1] : "");
	match = /(\n*$)/.exec(this.endTag);
	this.endTag = this.endTag.replace(/(\n*$)/, "");
	this.after = this.after + (match ? match[1] : "");

	if (this.before) {

		regexText = replacementText = "";

		while (nLinesBefore--) {
			regexText += "\\n?";
			replacementText += "\n";
		}

		if (findExtraNewlines) {
			regexText = "\\n*";
		}
		this.before = this.before.replace(new re(regexText + "$", ""), replacementText);
	}

	if (this.after) {

		regexText = replacementText = "";

		while (nLinesAfter--) {
			regexText += "\\n?";
			replacementText += "\n";
		}
		if (findExtraNewlines) {
			regexText = "\\n*";
		}

		this.after = this.after.replace(new re(regexText, ""), replacementText);
	}
};

Chunks.prototype.prefixes = "(?:\\s{4,}|\\s*>|\\s*-\\s+|\\s*\\d+\\.|=|\\+|-|_|\\*|#|\\s*\\[[^\n]]+\\]:)";

Chunks.prototype.wrap = function (len) {
	this.unwrap();
	var regex = new re("(.{1," + len + "})( +|$\\n?)", "gm");
	var prefixes = this.prefixes;

	this.selection = this.selection.replace(regex, function (line, marked) {
		if (new re("^" + prefixes, "").test(line)) {
			return line;
		}
		return marked + "\n";
	});

	this.selection = this.selection.replace(/\s+$/, "");
};

Chunks.prototype.unwrap = function () {
	var prefixes = this.prefixes;
	var txt = new re("([^\\n])\\n(?!(\\n|" + prefixes + "))", "g");
	this.selection = this.selection.replace(txt, "$1 $2");
};
