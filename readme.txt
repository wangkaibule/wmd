Installing WMD
--------------

1. Add the CSS stylesheet to your head.

  <link rel="stylesheet" type="text/css" href="wmd.css" />

2. Add showdown.js (the markdown converter) to your head:

  <script type="text/javascript" src="showdown.js"></script>

3. Add wmd.js right before your closing body tag:

  <script type="text/javascript" src="wmd/wmd.js"></script>
  
 
You need to create:
-------------------

1. A button bar div

    This will contain WMD's buttons.  id and CSS class are "wmd-button-bar".

2. An input textarea

    This is where you'll enter markdown.  id and CSS class are "wmd-input".

3. A preview div (optional but recommended)

    This will give you a live preview of your markdown.  id and CSS class are
    "wmd-preview".

4. An HTML preview div (optional and you probably don't need this)

    This will show the raw HTML that the markdown will produce.  Not so
    useful for most web pages but useful for troubleshooting WMD :)  id and
    CSS class are "wmd-output".

Example:

  <!DOCTYPE html>
  <html>
    <head>
      <title>Test WMD Page</title>
      <link rel="stylesheet" type="text/css" href="wmd.css" />
      <script type="text/javascript" src="showdown.js"></script>
    </head>
	
    <body>
		
      <div id="wmd-button-bar" class="wmd-button-bar"></div>
      <br/>
      <textarea id="wmd-input" class="wmd-input"></textarea>
      <br/>
      <div id="wmd-preview" class="wmd-preview"></div>
      <br/>
      <div id="wmd-output" class="wmd-output"></div>	
		

      <script type="text/javascript" src="wmd.js"></script>
    </body>
  </html>

Support
-------

If you're having trouble getting WMD up and running, feel free to 
email me: <support@attacklab.net>
