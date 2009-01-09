var Attacklab=Attacklab||{};
Attacklab.wmdPlus=function(){
	
	var self = top;
	var wmd = self["Attacklab"];
	var doc = self["document"];
	var re = self["RegExp"];
	var nav = self["navigator"];
	
	var util = wmd.Util;
	var position = wmd.Position;
	var command = wmd.Command;
	
	// DONE
	command.doAutoindent = function(chunk){
		
		chunk.before = chunk.before.replace(/(\n|^)[ ]{0,3}([*+-]|\d+[.])[ \t]*\n$/, "\n\n");
		chunk.before = chunk.before.replace(/(\n|^)[ ]{0,3}>[ \t]*\n$/, "\n\n");
		chunk.before = chunk.before.replace(/(\n|^)[ \t]+\n$/, "\n\n");
		if(/(\n|^)[ ]{0,3}([*+-]|\d+[.])[ \t]+.*\n$/.test(chunk.before)){
			if(command.doList){
				command.doList(chunk);
			}
		}
		if(/(\n|^)[ ]{0,3}>[ \t]+.*\n$/.test(chunk.before)){
			if(command.doBlockquote){
				command.doBlockquote(chunk);
			}
		}
		if(/(\n|^)(\t|[ ]{4,}).*\n$/.test(chunk.before)){
			if(command.doCode){
				command.doCode(chunk);
			}
		}
	};
	
	command.doBlockquote = function(chunk){
		
		chunk.selection = chunk.selection.replace(/^(\n*)([^\r]+?)(\n*)$/,
			function(_b, _c, _d, _e){
				chunk.before += _c;
				chunk.after = _e + chunk.after;
				return _d;
			});
			
		chunk.before = chunk.before.replace(/(>[ \t]*)$/,
			function(_f,_10){
				chunk.selection = _10 + chunk.selection;
				return "";
			});
			
		chunk.selection = chunk.selection.replace(/^(\s|>)+$/,"");
		chunk.selection = chunk.selection || "Blockquote";
		
		if(chunk.before){
			chunk.before = chunk.before.replace(/\n?$/,"\n");
		}
		
		if(chunk.after){
			chunk.after = chunk.after.replace(/^\n?/,"\n");
		}
		
		chunk.before = chunk.before.replace(/(((\n|^)(\n[ \t]*)*>(.+\n)*.*)+(\n[ \t]*)*$)/,
			function(_11){
				chunk.startTag = _11;
				return "";
			});
			
		chunk.after = chunk.after.replace(/^(((\n|^)(\n[ \t]*)*>(.+\n)*.*)+(\n[ \t]*)*)/,
			function(_12){
				chunk.endTag = _12;
				return "";
			});
		
		var _13 = function(_14){
			var _15 = _14 ? "> ":"";
			if(chunk.startTag){
				chunk.startTag = chunk.startTag.replace(/\n((>|\s)*)\n$/,
					function(_16, _17){
						return "\n" + _17.replace(/^[ ]{0,3}>?[ \t]*$/gm, _15) + "\n";
					});
			}
			if(chunk.endTag){
				chunk.endTag=chunk.endTag.replace(/^\n((>|\s)*)\n/,
				function(_18, _19){
					return "\n" + _19.replace(/^[ ]{0,3}>?[ \t]*$/gm,_15) + "\n";
				});
			}
		};
		
		if(/^(?![ ]{0,3}>)/m.test(chunk.selection)){
			command.wrap(chunk, wmd.wmd_env.lineLength - 2);
			chunk.selection = chunk.selection.replace(/^/gm, "> ");
			_13(true);
			chunk.skipLines();
		}
		else{
			chunk.selection = chunk.selection.replace(/^[ ]{0,3}> ?/gm, "");
			command.unwrap(chunk);
			_13(false);
			
			if(!/^(\n|^)[ ]{0,3}>/.test(chunk.selection) && chunk.startTag){
				chunk.startTag = chunk.startTag.replace(/\n{0,2}$/, "\n\n");
			}
			
			if(!/(\n|^)[ ]{0,3}>.*$/.test(chunk.selection) && chunk.endTag){
				chunk.endTag=chunk.endTag.replace(/^\n{0,2}/, "\n\n");
			}
		}
		
		if(!/\n/.test(chunk.selection)){
			chunk.selection=chunk.selection.replace(/^(> *)/,
			function(_1a, _1b){
				chunk.startTag += _1b;
				return "";
			});
		}
	};

	command.doCode = function(chunk){
		
		var _1d = /\S[ ]*$/.test(chunk.before);
		var _1e = /^[ ]*\S/.test(chunk.after);
		
		if((!_1e && !_1d) || /\n/.test(chunk.selection)){
			
			chunk.before = chunk.before.replace(/[ ]{4}$/,
				function(_1f){
					chunk.selection = _1f + chunk.selection;
					return "";
				});
				
			var _20 = 1;
			var _21 = 1;
			
			if(/\n(\t|[ ]{4,}).*\n$/.test(chunk.before)){
				_20 = 0;
			}
			if(/^\n(\t|[ ]{4,})/.test(chunk.after)){
				_21 = 0;
			}
			
			chunk.skipLines(_20, _21);
			
			if(!chunk.selection){
				chunk.startTag = "    ";
				chunk.selection = "print(\"code sample\");";
				return;
			}
			
			if(/^[ ]{0,3}\S/m.test(chunk.selection)){
				chunk.selection = chunk.selection.replace(/^/gm, "    ");
			}
			else{
				chunk.selection = chunk.selection.replace(/^[ ]{4}/gm, "");
			}
		}
		else{
			
			chunk.trimWhitespace();
			chunk.findTags(/`/,/`/);
			
			if(!chunk.startTag && !chunk.endTag){
				chunk.startTag = chunk.endTag="`";
				if(!chunk.selection){
					chunk.selection = "print(\"code sample\");";
				}
			}
			else if(chunk.endTag && !chunk.startTag){
				chunk.before += chunk.endTag;
				chunk.endTag = "";
			}
			else{
				chunk.startTag = chunk.endTag="";
			}
		}
	};
	
	command.autoindent={};
	command.autoindent.textOp = command.doAutoindent;
	command.blockquote = {};
	command.blockquote.description = "Blockquote <blockquote>";
	command.blockquote.image = "images/blockquote.png";
	command.blockquote.key = ".";
	command.blockquote.keyCode = 190;
	command.blockquote.textOp = function(chunk){
		return command.doBlockquote(chunk);
	};
	
	command.code = {};
	command.code.description = "Code Sample <pre><code>";
	command.code.image = "images/code.png";
	command.code.key = "k";
	command.code.textOp = command.doCode;
	
	command.img = {};
	command.img.description = "Image <img>";
	command.img.image = "images/img.png";
	command.img.key = "g";
	command.img.textOp = function(chunk, _24){
		return command.doLinkOrImage(chunk, true, _24);
	};
	
	command.doList = function(chunk, _26){
		
		var _27 = /(([ ]{0,3}([*+-]|\d+[.])[ \t]+.*)(\n.+|\n{2,}([*+-].*|\d+[.])[ \t]+.*|\n{2,}[ \t]+\S.*)*)\n*/;
		var _28 = "";
		var _29 = 1;
		
		var _2a = function(){
			if(_26){
				var _2b = " " + _29 + ". ";
				_29++;
				return _2b;
			}
			var _2c = _28 || "-";
			return "  " + _2c + " ";
		};
		
		var _2d = function(_2e){
			
			if(_26 == undefined){
				_26 = /^\s*\d/.test(_2e);
			}
			_2e = _2e.replace(/^[ ]{0,3}([*+-]|\d+[.])\s/gm,
				function(_2f){
					return _2a();
				});
				
			return _2e;
		};
		
		var _30 = function(){
			_31 = util.regexToString(_27);
			_31.expression = "^\n*" + _31.expression;
			var _32 = util.stringToRegex(_31);
			chunk.after = chunk.after.replace(_32,_2d);
		};
		
		chunk.findTags(/(\n|^)*[ ]{0,3}([*+-]|\d+[.])\s+/,null);
		var _33 = /^\n/;
		
		if(chunk.before && !/\n$/.test(chunk.before) && !_33.test(chunk.startTag)){
			chunk.before += chunk.startTag;
			chunk.startTag="";
		}
		
		if(chunk.startTag){
			var _34 = /\d+[.]/.test(chunk.startTag);
			chunk.startTag = "";
			chunk.selection = chunk.selection.replace(/\n[ ]{4}/g, "\n");
			command.unwrap(chunk);
			chunk.skipLines();
			
			if(_34){
				_30();
			}
			if(_26 == _34){
				return;
			}
		}
		
		var _35 = 1;
		var _31 = util.regexToString(_27);
		_31.expression = "(\\n|^)" + _31.expression + "$";
		var _36 = util.stringToRegex(_31);
		
		chunk.before = chunk.before.replace(_36,
			function(_37){
				if(/^\s*([*+-])/.test(_37)){
					_28 = re.$1;
				}
				_35 = /[^\n]\n\n[^\n]/.test(_37) ? 1 : 0;
				return _2d(_37);
			});
			
		if(!chunk.selection){
			chunk.selection = "List item";
		}
		
		var _38 = _2a();
		var _39 = 1;
		_31 = util.regexToString(_27);
		_31.expression = "^\n*" + _31.expression;
		_36 = util.stringToRegex(_31);
		
		chunk.after = chunk.after.replace(_36,
			function(_3a){
				_39 = /[^\n]\n\n[^\n]/.test(_3a) ? 1 : 0;
				return _2d(_3a);
			});
			
		chunk.trimWhitespace(true);
		chunk.skipLines(_35, _39, true);
		chunk.startTag = _38;
		var _3b = _38.replace(/./g, " ");
		command.wrap(chunk, wmd.wmd_env.lineLength - _3b.length);
		chunk.selection = chunk.selection.replace(/\n/g, "\n" + _3b);
	};
	
	// DONE
	command.doHeading = function(chunk){
		
		// Remove leading/trailing whitespace and reduce internal spaces to single spaces.
		chunk.selection = chunk.selection.replace(/\s+/g, " ");
		chunk.selection = chunk.selection.replace(/(^\s+|\s+$)/g, "");
		
		// If we clicked the button with no selected text, we just
		// make a level 2 hash header around some default text.
		if(!chunk.selection){
			chunk.startTag = "## ";
			chunk.selection = "Heading";
			chunk.endTag = " ##";
			return;
		}
		
		var headerLevel = 0;		// The existing header level of the selected text.
		
		// Remove any existing hash heading markdown and save the header level.
		chunk.findTags(/#+[ ]*/, /[ ]*#+/);
		if(/#+/.test(chunk.startTag)){
			headerLevel = re.lastMatch.length;
		}
		chunk.startTag = chunk.endTag = "";
		
		// Try to get the current header level by looking for - and = in the line
		// below the selection.
		chunk.findTags(null, /\s?(-+|=+)/);
		if(/=+/.test(chunk.endTag)){
			headerLevel = 1;
		}
		if(/-+/.test(chunk.endTag)){
			headerLevel = 2;
		}
		
		// Skip to the next line so we can create the header markdown.
		chunk.startTag = chunk.endTag = "";
		chunk.skipLines(1, 1);

		// We make a level 2 header if there is no current header.
		// If there is a header level, we substract one from the header level.
		// If it's already a level 1 header, it's removed.
		var headerLevelToCreate = headerLevel == 0 ? 2 : headerLevel - 1;
		
		if(headerLevelToCreate > 0){
			
			// The button only creates level 1 and 2 underline headers.
			// Why not have it iterate over hash header levels?  Wouldn't that be easier and cleaner?
			var headerChar = headerLevelToCreate >= 2 ? "-" : "=";
			var len = chunk.selection.length;
			if(len > wmd.wmd_env.lineLength){
				len = wmd.wmd_env.lineLength;
			}
			chunk.endTag = "\n";
			while(len--){
				chunk.endTag += headerChar;
			}
		}
	};
	
	command.ol = {};
	command.ol.description = "Numbered List <ol>";
	command.ol.image = "images/ol.png";
	command.ol.key = "o";
	command.ol.textOp = function(chunk){
		command.doList(chunk, true);
	};
	
	command.ul = {};
	command.ul.description = "Bulleted List <ul>";
	command.ul.image = "images/ul.png";
	command.ul.key = "u";
	command.ul.textOp = function(chunk){
		command.doList(chunk, false);
	};
	
	command.h1 = {};
	command.h1.description = "Heading <h1>/<h2>";
	command.h1.image = "images/h1.png";
	command.h1.key = "h";
	command.h1.textOp = command.doHeading;
	
	command.hr = {};
	command.hr.description = "Horizontal Rule <hr>";
	command.hr.image = "images/hr.png";
	command.hr.key = "r";
	command.hr.textOp = function(chunk){	
		chunk.startTag = "----------\n";
		chunk.selection = "";
		chunk.skipLines(2, 1, true);
	};
};

if(Attacklab.fileLoaded){
	Attacklab.fileLoaded("wmd-plus.js");
}

