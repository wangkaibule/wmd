
(function () {

//  SETUP BUTTONS ------------------------------------------------------------------------------------------------------------

	WMD.registerButton('link', {titleText:'Hyperlink <a> Ctrl+L', shortcut:'l'});
	WMD.registerButton('image', {titleText:'Image <img> Ctrl+G', shortcut:'g'});

	WMD.subscribe('toolbar-button:link', function (event, button) {
		var editor = this;
		var chunk = editor.selection.get();

		var startTag = '', endTag = '';

		chunk.before = chunk.before.replace(/!?\[([^\]]*)$/, function (match, extra) {
			chunk.selected = extra + chunk.selected;
			startTag = match.replace(extra,'');
			return "";
		});
		
		chunk.after = chunk.after.replace(/^([^\[]*)\][ ]?(?:\n[ ]*)?(\[.*?\])?/, function (match, extra) {
			chunk.selected = chunk.selected + extra;
			endTag = match.replace(extra,'');
			return "";
		});
		
		chunk.recount();
		
		if (endTag.length > 1) { //removing a link
			resequenceLinks(chunk);
			chunk.reset();
			editor.pushUpdate(chunk);
		} else {		

			promptForLink('', function (link) {
				if (!link) return;
			
				chunk.before += '[';
				chunk.start++;
				chunk.end++;
				chunk.after = "][999]" + chunk.after;
				
		
				resequenceLinks(chunk, {999:" [999]: "+link});
				editor.pushUpdate(chunk);
			});
			
		}
		
	});
	
	
	WMD.subscribe('toolbar-button:image', function (event, button) {
		var editor = this;
		var chunk = editor.selection.get();
	
	});
	

	var resequenceLinks = function (chunk, newAdditions) {
		// Start with a clean slate by removing all previous link definitions.
		// and saving them into oldDefinitions
		var oldDefinitions = newAdditions || {};
		var stripLinkDefs = function (text) {
			return text.replace(/^[ ]{0,3}\[(\d+)\]:[ \t]*\n?[ \t]*<?(\S+?)>?[ \t]*\n?[ \t]*(?:(\n*)["(](.+?)[")][ \t]*)?(?:\n+|$)/gm, function (totalMatch, id, link, newlines, title) {
				oldDefinitions[id] = totalMatch.replace(/\s*$/, "");
				if (newlines) {
					// Strip the title and return that separately.
					oldDefinitions[id] = totalMatch.replace(/["(](.+?)[")]$/, "");
					return newlines + title;
				}
				return "";
			});
		};
		chunk.before = stripLinkDefs(chunk.before);
		chunk.selected = stripLinkDefs(chunk.selected);
		chunk.after = stripLinkDefs(chunk.after);
		
		// Now we move through the document searching for links
		// as we find them, we renumber the definitions to match the new order.
		var refID = 0;
		var newDefinitions = [];
		var linkRegexPattern = /(\[(?:\[[^\]]*\]|[^\[\]])*\][ ]?(?:\n[ ]*)?\[)(\d+)(\])/g;
		var linkRegexFunction = function (wholeMatch, link, id, end) {
			if (oldDefinitions[id]) {
				newDefinitions.push(oldDefinitions[id].replace(/^[ ]{0,3}\[(\d+)\]:/, "  [" + (++refID) + "]:"));

				return link + refID + end;
			}
			return wholeMatch;
		};
		// chunk.before = chunk.before.replace(linkRegexPattern, linkRegexFunction);
		// chunk.selected = chunk.selected.replace(linkRegexPattern, linkRegexFunction);
		// chunk.after = chunk.after.replace(linkRegexPattern, linkRegexFunction);

		chunk.refill();
		chunk.content = chunk.content.replace(linkRegexPattern, linkRegexFunction);
		chunk.reset();


		//strip any superfluous newlines from the end of the document
		if (chunk.after) chunk.after = chunk.after.replace(/\n*$/, "");
		else chunk.selected = chunk.selected.replace(/\n*$/, "");
		
		//add the newly resequenced definitions
		chunk.after += "\n\n" + newDefinitions.join('\n');
		
		chunk.recount().refill();
	};

	var promptForLink = function (defaultLink, callback) {
		callback("http://www.apple.com");
	};

})();

