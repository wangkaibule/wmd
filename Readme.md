##WMDEditor: The Wysiwym Markdown Editor

#YOU ARE VIEWING THE 3.0 REBUILD BRANCH. THIS BRANCH IS NOT YET READY FOR USE AND DOES NOT INCLUDE A COMPILED BUILD.  USE AT YOUR OWN RISK.

###Introduction

WMD is a JavaScript based code editor for the [Markdown](http://daringfireball.net/projects/markdown/) formatting language.  It includes a Markdown interpreter – Showdown – for live preview and output of the Markdown generated HTML.  If you have ever created or answered a question on StackOverflow or the StackExchange network, you have used WMD.

###How to use

Coming soon. See wmd-test.html

###Building WMDEditor From Source

From the terminal, CD to the root project directory and run the `make` command.  This performs the following actions:

1. Collates all source files into a single closure wrapped file: `build/wmd.js`
2. Combines wmd.js with showdown.js into `build/wmd.combined.js`
3. Runs the combined file through Google Closure Compile to produce the minified `build/wmd.combined.min.js`

###Plugin Authoring

Plugins may register their own toolbar buttons by calling `WMD.registerButton(name, options)`.  Name must be a unique string for the button containing only alpha numeric characters.  The following options are allowed:

- **className**: The css class that will be added to your button's LI element.  Use this to apply your button styling.  Defaults to `wmd-button-BUTTON_NAME`
- **titleText**: The hover tooltip text for your button. Default to an empty string
- **shortcut**: This is the control-key you wish to be bound to the button.  Note that if the key you've defined is already taken, this value will be ignored.

WMDEditor 3 uses a Publish/Subscribe event system for communicating with plugins.  Events can be subscribed to by calling:

    WMD.subscribe(eventName, callback)

EventName is the string identifier for the event itself, and callback is the function handle to be called.  Callbacks are always called with the context (`this` variable) of the WMDEditor instance that triggered the event.

Event Name | Arguments | Description
:-----------:|:--------------------------|:-----------|:
`editor-created`|None|Dispatched at the end of the WMDEditor constructor, signifying that an editor has been created and is ready for use.  Plugins should use this event to attach any DOM level Event Handlers that they may need.
`editor-ready`|None|Dispatched after all `editor-created` calls have completed. Plugins should have completed all setup before this event is triggered, but may occur before any asynchronous calls have finished.
`toolbar-button-clicked`|(DOMEvent)`event`, (DOMElement)`button`|Dispatched whenever any toolbar button is clicked.
`toolbar-button:BUTTONNAME`|(DOMEvent)`event`, (DOMElement or String)`source`|Dispatched when a specific button is clicked. BUTTONNAME is the name the button was registered under by the plugin.  The `source` argument will contain wither the button element which was clicked, the string 'shortcut' if the button was triggered via a shortcut key, or 'autoformatting' in the action was triggered automatically by a DOMEvent (such as with lists and code/quote blocks).
`toolbar-button-shortcut`|(DOMEvent)`event`, (String)keyPressed|Dispatched whenever any registered shortcut key is triggered.

Plugins can trigger their own events, and the native events, by calling:

     WMD.publish(eventName, context, arguments);

- **eventName** *(string)* : The name of the event.
- **context** *(object)* : `this` for the callback function.
- **arguments** *(array)* : The arguments passed to the callback function.

All plugin creation code should be performed at load time, before the DOMReadyState event has fired, as instantiation of WMDEditors is likely to be done either at load time further down the page, or in the DOM Ready or Document Loaded DOMEvents.

Authors may submit plugins for inclusion in the default WMDEditor project via a GitHub pull request, but the decision for inclusion is entirely at the active project manager's whim.  All submitted plugins *MUST* be wrapped in a closure function.

###History

1. The original WMDEditor was written by John Fraser of [AttackLabs](http://www.attacklabs.com/), who handed over control of the project to StackOverflow.
2. StackOverflow's [Chris Jester-Young](http://stackoverflow.com/users/13/chris-jester-young) de-minified the original source code and [made the project available](http://blog.stackoverflow.com/2008/12/reverse-engineering-the-wmd-editor/) on GitHub.  From here, StackOverflow's David Robins took over and made numerous improvements from December of 2008 to March of 2009.
3. For whatever reason, StackOverflow ceased releasing their modifications of the editor.  The version currently used on the StackExchange network is several generations different from the last GitHub push.  Ten months later (December 2009) the project was forked by [OpenLibrary.com](http://www.openlibrary.com)
4. OpenLibrary's most significant contribution to the project was changing the StackOverflow code to support multiple instances of the editor on a single page. They continued to make further bug fixes until June 9th, 2010.  The project once again went into hibernation until September 13th, 2010 when Jarvis Badgley of ChiperSoft Systems forked and began new development.
5. ChiperSoft made the following changes to WMD 2.0 and Showdown:
	* Extended showdown to support a series of Markdown extensions:
	  - Link urls that start with ! are opened in a new window
	  - Text wrapped with double carets is made superscript (ex: `^^this text is superscripted^^`)
	  - Text wrapped with double commas is made subscript (ex: `,,this text is subscripted,,`)
	  - Text wrapped with double tildes is made strikethrough (ex: `~~this text is struck~~`)
	  - (c), (r), (tm), -- and ... are converted into their respective html entities.
	  - Lines prefixed with "->" are right aligned.  Lines also postfixed with "<-" are center aligned.
	* Several ascii characters that may produce text-encoding issues (such as curled quotes) are converted into entities
	* Removed top level frame pollution, forcing WMD to run only in its own document.
	* Removed the automatic conversion from Markdown to HTML when the form is submitted.
	* Removed the automatic addition of http:// to image urls, preventing the entry of relative addresses.
	* Numerous bug fixes.
6. On May 29th, 2011, ChiperSoft began a total rewrite of the WMD editor for version 3.0.  The vast majority of the old code was replaced, and the editor architecture was redesigned around a plugin based editor platform.

###License

WMDEditor 3 is Copyright (c) 2011, Jarvis Badgley and is licensed under an [MIT License](http://github.com/chipersoft/wmd/raw/master/LICENSE).



