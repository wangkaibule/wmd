/*! BEGIN: wmd.js */
var Attacklab = Attacklab || {};
Attacklab.wmd_env = {};
Attacklab.account_options = {};
Attacklab.wmd_defaults = { version: 1, output: "Markdown", lineLength: 40, delayLoad: false };
if (!Attacklab.wmd) {
    Attacklab.wmd = function() {
        Attacklab.loadEnv = function() {
            var _1 = function(_2) {
                if (!_2) {
                    return;
                }
                for (var _3 in _2) {
                    Attacklab.wmd_env[_3] = _2[_3];
                }
            };
            _1(Attacklab.wmd_defaults);
            _1(Attacklab.account_options);
            _1(top["wmd_options"]);
            Attacklab.full = true;
            var _4 = "bold italic | link blockquote code image | ol ul heading hr";
            Attacklab.wmd_env.buttons = Attacklab.wmd_env.buttons || _4;
        };
        Attacklab.loadEnv();
        var _5 = ["showdown.js", "wmd-base.js", "wmd-plus.js"];
        var _6 = function(_7) {
        };
        Attacklab.fileLoaded = function(_8) {
            arguments.callee.count = arguments.callee.count || 0;
            if (++arguments.callee.count >= _5.length) {
                var go = function() {
                    Attacklab.wmdBase();
                    Attacklab.Util.startEditor();
                };
                if (Attacklab.wmd_env.delayLoad) {
                    window.setTimeout(go, 0);
                } else {
                    go();
                }
            }
        };
        Attacklab.editorInit = function() {
            Attacklab.wmdPlus();
        };
        var _a = function(_b, _c) {
            var _d = Attacklab.basePath + _b;
            if (_c) {
                _d += "?nocache=" + (new Date()).getTime();
            }
            var _e = document.createElement("script");
            _e.src = _d;
            top.document.documentElement.firstChild.appendChild(_e);
        };
        var _f = function(_10) {
            var _11 = RegExp("(.*)" + _10 + "(\\?(.+))?$", "g");
            var _12 = document.getElementsByTagName("script");
            for (var i = 0; i < _12.length; i++) {
                if (_11.test(_12[i].src)) {
                    var _14 = RegExp.$1;
                    if (/wmd-editor.com/.test(_12[i].src)) {
                        return null;
                    }
                    return _14;
                }
            }
        };
        Attacklab.basePath = _f("wmd.js") || "/Content/Js/";
        for (var f, i = 0; f = _5[i]; i++) {
            _a(f, false);
        }
    };
    Attacklab.wmd();
}
/* END: wmd.js */

/*! BEGIN: jquery.typewatch.js */
(function(jQuery) {
    jQuery.fn.typeWatch = function(o) {
        var options = jQuery.extend({
            wait: 750,
            callback: function() { },
            highlight: true,
            captureLength: 2
        }, o);

        function checkElement(timer, override) {
            var elTxt = jQuery(timer.el).val();

            if ((elTxt.length > options.captureLength && elTxt.toUpperCase() != timer.text)
			|| (override && elTxt.length > options.captureLength)) {
                timer.text = elTxt.toUpperCase();
                timer.cb(elTxt);
            }
        };

        function watchElement(elem) {
            if (elem.type.toUpperCase() == "TEXT" || elem.nodeName.toUpperCase() == "TEXTAREA") {
                var timer = {
                    timer: null,
                    text: jQuery(elem).val().toUpperCase(),
                    cb: options.callback,
                    el: elem,
                    wait: options.wait
                };

                if (options.highlight) {
                    jQuery(elem).focus(
						function() {
						    this.select();
						});
                }

                var startWatch = function(evt) {
                    var timerWait = timer.wait;
                    var overrideBool = false;

                    if (evt.keyCode == 13 && this.type.toUpperCase() == "TEXT") {
                        timerWait = 1;
                        overrideBool = true;
                    }

                    var timerCallbackFx = function() {
                        checkElement(timer, overrideBool)
                    }

                    clearTimeout(timer.timer);
                    timer.timer = setTimeout(timerCallbackFx, timerWait);

                };

                jQuery(elem).keydown(startWatch);
            }
        };

        return this.each(function(index) {
            watchElement(this);
        });

    };

})(jQuery);
/* END: jquery.typewatch.js */

/*! BEGIN: jquery.textarearesizer.js */
(function($) {
    var textarea, staticOffset;
    var iLastMousePos = 0;
    var iMin = 32;
    var grip;
    $.fn.TextAreaResizer = function() {
        return this.each(function() {
            textarea = $(this).addClass('processed'), staticOffset = null;
            $(this).parent().append($('<div class="grippie"></div>').bind("mousedown", { el: this }, startDrag));
            var grippie = $('div.grippie', $(this).parent())[0];
            grippie.style.marginRight = (grippie.offsetWidth - $(this)[0].offsetWidth) + 'px';

        });
    };
    function startDrag(e) {
        textarea = $(e.data.el);
        textarea.blur();
        iLastMousePos = mousePosition(e).y;
        staticOffset = textarea.height() - iLastMousePos;
        textarea.css('opacity', 0.25);
        $(document).mousemove(performDrag).mouseup(endDrag);
        return false;
    }

    function performDrag(e) {
        var iThisMousePos = mousePosition(e).y;
        var iMousePos = staticOffset + iThisMousePos;
        if (iLastMousePos >= (iThisMousePos)) {
            iMousePos -= 5;
        }
        iLastMousePos = iThisMousePos;
        iMousePos = Math.max(iMin, iMousePos);
        textarea.height(iMousePos + 'px');
        if (iMousePos < iMin) {
            endDrag(e);
        }
        return false;
    }

    function endDrag(e) {
        $(document).unbind('mousemove', performDrag).unbind('mouseup', endDrag);
        textarea.css('opacity', 1);
        textarea.focus();
        textarea = null;
        staticOffset = null;
        iLastMousePos = 0;
    }

    function mousePosition(e) {
        return { x: e.clientX + document.documentElement.scrollLeft, y: e.clientY + document.documentElement.scrollTop };
    };
})(jQuery);
/* END: jquery.textarearesizer.js */

/* BEGIN: new-activity-heartbeat */
var heartbeat = function() {
    
    var timeout = 1000 * 60;
    var serverCount = 0;
    var questionId;
    
    return {
        start: function() {
            $("#post-text").unbind("keypress", heartbeat.start);
            questionId = location.href.match(/\/questions\/(\d+)/i)[1];
            setTimeout(heartbeat.ping, timeout);    
        },
        
        ping: function() {
            var answerIds = ""; // Pass a space-delimited string of all answer ids currently on the page
                        
            $("div.answer").each(function() {
                answerIds += this.id.substring("answer-".length) + " ";
            });
            
            $.post("/posts/" + questionId + "/new-activity-heartbeat", { "answerIds": answerIds }, heartbeat.result, "json");
        },
        
        result: function(data) {
            if (data && data.Result && data.Count != serverCount) { // Server returns true when there are more answers
                serverCount = data.Count;
                var msg = data.Count + " new answer" + (data.Count == 1 ? " has" : "s have") + " been posted - "
                msg += '<a onclick="heartbeat.update()">load new answers.</a>';
                notify.show(msg);                
            }
            
            setTimeout(heartbeat.ping, timeout);
        },
        
        update: function() {
            var divIdsToAdd = [];
            
            // For now (naively), fetch the entire page again..
            $.get("/questions/" + questionId, function(html) {
                var jHtml = $(html);
                
                jHtml.find("div.answer").each(function() {
                    var id = this.id.substring("answer-".length);
                    if ($("#answer-" + id).length == 0) {
                        divIdsToAdd.push(this.id);
                    }
                });
                
                if (divIdsToAdd.length > 0) {
                    var selector = "#" + divIdsToAdd.join(",#");
                    var divs = jHtml.find(selector);
                    var appendAfter = $("div.answer:last");
                    
                    if (appendAfter.length == 0)
                        appendAfter = $("#answers-header");
                    
                    divs.hide();    
                    appendAfter.after(divs);
                    divs.fadeIn("slow");
                    // Update answer count..
                    var totalAnswers = $("div.answer").length;
                    $("#subheader h2").text(totalAnswers + " Answer" + (totalAnswers > 1 ? "s" : ""));
                    
                    // Rebind all click handlers on page..
                    vote.init(questionId);
                    comments.init();
                }
                
                notify.close();
            }, "html");
        }
        
        
    };

} ();
/* END: new-activity-heartbeat */