/// <reference path="jquery-1.2.6-intellisense.js"/>

// Handles all client-side voting functionality
var vote = function() {

    var voteTypeIds = {
        undoMod: 0,
        acceptedByOwner: 1,
        upMod: 2,
        downMod: 3,
        offensive: 4,
        favorite: 5,
        close: 6,
        reopen: 7
    };

    var imgPrefix = "/content/img/vote-arrow-";
    var imgDownOff = imgPrefix + "down.png";
    var imgDownOn = imgPrefix + "down-on.png";
    var imgUpOff = imgPrefix + "up.png";
    var imgUpOn = imgPrefix + "up-on.png";

    var imgFavoritePrefix = "/content/img/vote-favorite-";
    var imgFavOn = imgFavoritePrefix + "on.png";
    var imgFavOff = imgFavoritePrefix + "off.png";

    var bindAnonymousDisclaimers = function() {
        var anchor = '<a href="/users/login?returnurl=' + escape(document.location) + '">login or register</a>';

        // Clicking on a voting arrow will show a message to login/register..
        $("div.vote").find("img").not(".vote-accepted").unbind("click").click(function(event) {
            showNotification($(event.target), 'Please ' + anchor + ' to use voting.');
        });

        getOffensiveLinks().unbind("click").click(function(event) {
            showNotification($(event.target), "Please " + anchor + " to mark something offensive.");
        });
    };

    var bindVoteClicks = function(jDivVote) {

        if (!jDivVote)
            jDivVote = "div.vote";

        // bind click events to our images..
        $(jDivVote).find("img.vote-up").unbind("click").click(function(event) {
            vote.up($(event.target));
        });
        $(jDivVote).find("img.vote-down").unbind("click").click(function(event) {
            vote.down($(event.target));
        });
        $(jDivVote).find("img.vote-favorite").unbind("click").click(function(event) {
            vote.favorite($(event.target));
        });
    };

    var unbindVoteClicks = function(jClicked) {
        jClicked.parent().find("img").not(".vote-accepted").unbind("click");
    };

    var highlightExistingVotes = function(jsonArray) {
        $.each(jsonArray, function() {
            var jDiv = $("div.vote:has(input[value=" + this.PostId + "])");

            switch (this.VoteTypeId) {
                case voteTypeIds.upMod:
                    jDiv.find("img.vote-up").attr("src", imgUpOn);
                    break;

                case voteTypeIds.downMod:
                    jDiv.find("img.vote-down").attr("src", imgDownOn);
                    break;

                case voteTypeIds.favorite:
                    jDiv.find("img.vote-favorite").attr("src", imgFavOn);
                    jDiv.find("div.favoritecount b").addClass("favoritecount-selected");
                    break;

                default:
                    alert("site.vote.js > highlightExistingVotes has no case for " + this.VoteTypeId);
                    break;
            }
        });
    };

    var getAcceptedAnswerLinks = function() {
        return $("div.vote img[id^='vote-accepted-']");
    };

    var getLockPostLinks = function() {
        return $("div.post-menu a[id^='lock-post-']");
    };

    var getOffensiveLinks = function() {
        return $("div.post-menu a[id^='vote-offensive-']");
    };

    var preloadImages = function() {
        var img = new Image();
        img.src = imgUpOn;

        img = new Image();
        img.src = imgDownOn;
    };

    var isUpSelected = function(jUp) {
        return jUp.attr("src") == imgUpOn;
    };

    var isFavoriteSelected = function(jFavorite) {
        return jFavorite.attr("src") == imgFavOn;
    };
    var isDownSelected = function(jDown) {
        return jDown.attr("src") == imgDownOn;
    };

    var getPostId = function(jClicked) {
        return jClicked.parent().find("input").val();
    };

    var reset = function(jUp, jDown) {
        if (isUpSelected(jUp)) {
            jUp.attr("src", imgUpOff);
        }

        if (isDownSelected(jDown)) {
            jDown.attr("src", imgDownOff);
        }
    };
    
    var updateModScore = function(jClicked, incrementAmount) {
        var jScore = jClicked.siblings("span.vote-count-post");
        jScore.text(parseInt(jScore.text(), 10) + incrementAmount);
    }
    
    var submitModVote = function(jClicked, voteTypeId) {
        unbindVoteClicks(jClicked); // disable voting during a vote..
        
        var postId = getPostId(jClicked);
        submit(jClicked, postId, voteTypeId, voteResult);
    };

    var submit = function(jClicked, postId, voteTypeId, callback, optionalFormData) {
        var formData = { "voteTypeId": voteTypeId, "fkey": fkey }; // fkey is found in Show.aspx's head..
        
        // merge call-specific form data..
        if (optionalFormData)
            for (var name in optionalFormData)
                formData[name] = optionalFormData[name];
        
        $.post("/questions/" + postId + "/vote", formData, function(data) { callback(jClicked, postId, data); }, "json");
    };

    var voteResult = function(jClicked, postId, data) {
        if (data.Success) {
            if (data.Message)
                showFadingNotification(jClicked, data.Message);
        }
        else {
            showNotification(jClicked, data.Message);
            
            reset(jClicked, jClicked);
            
            // Undo score change..
            jClicked.parent().find("span.vote-count-post").text(data.NewScore);
                        
            if (data.LastVoteTypeId) {
                selectPreviousVote(jClicked, data.LastVoteTypeId);
            }
        }
        bindVoteClicks(jClicked.parent()); // re-enable voting..
    };

    var selectPreviousVote = function(jClicked, voteTypeId) {
        var img, imgSelected;
        if (voteTypeId == voteTypeIds.upMod) {
            img = "img.vote-up";
            imgSelected = imgUpOn;
        }
        else if (voteTypeId == voteTypeIds.downMod) {
            img = "img.vote-down";
            imgSelected = imgDownOn;
        }

        if (img)
            jClicked.parent().find(img).attr("src", imgSelected);
    };

    var showNotification = function(jClicked, msg) {
        var div = $('<div class="vote-notification"><h2>' + msg + '</h2>(click on this box to dismiss)</div>');

        div.click(function(event) {
            $(".vote-notification").fadeOut("fast", function() { $(this).remove(); });
        });

        jClicked.parent().append(div);
        div.fadeIn("fast");
    };

    var showFadingNotification = function(jClicked, msg) {
        var div = $('<div class="vote-notification"><h2>' + msg + '</h2></div>');

        jClicked.parent().append(div);
        div.fadeIn("fast");

        var fadeOut = function() {
            $(".vote-notification").fadeOut("fast", function() { $(this).remove(); });
        };
        
        var duration = Math.max(2500, msg.length * 40); // longer messages should stick around..
        setTimeout(fadeOut, duration);
    }

    // Public methods on vote
    return {

        init: function(questionId) {
            if (isRegistered) { // isRegistered is on Show.aspx..
                preloadImages();

                // Fetches an array of postIds and how a user voted, e.g. [{"PostId":1, "VoteTypeId":2}]
                $.ajax({
                    type: "GET",
                    url: "/questions/" + questionId + "/votes",
                    dataType: "json",
                    success: highlightExistingVotes,
                    cache: false // IE will cache ajax calls - don't allow it..
                });

                bindVoteClicks();

                getOffensiveLinks().unbind("click").click(function(event) {
                    if (confirm("Do you really want to flag this post as hate speech, spam, or abuse?")) {
                        vote.offensive($(event.target));
                    }
                });
            }
            else bindAnonymousDisclaimers();

            // Always bind "Is Answer" ability..
            getAcceptedAnswerLinks().unbind("click").click(function(event) {
                vote.acceptedAnswer($(event.target));
            });

            getLockPostLinks().unbind("click").click(function(event) {
                vote.lock($(event.target));
            });

            var jCloseLink = $("div.post-menu a[id^='close-question-']");
            jCloseLink.unbind("click").click(function(event) {
                vote.close(jCloseLink);
            });

            $("div.post-menu a[id^='delete-question-']").unbind("click").click(function(event) {
                if (confirm("Delete or undelete this post?")) {
                    vote.deletePost($(event.target));
                }
            });
        },

        up: function(jClicked) {

            var jUp = jClicked.parent().find("img.vote-up");
            var jDown = jClicked.parent().find("img.vote-down");

            var isSelected = isUpSelected(jUp);
            var isReversal = isDownSelected(jDown);
            var incrementAmount = isSelected ? -1 : (isReversal ? 2 : 1);
            
            updateModScore(jClicked, incrementAmount);
            reset(jUp, jDown);

            if (!isSelected) { // now select it..
                jUp.attr("src", imgUpOn);
            }

            submitModVote(jClicked, isSelected ? voteTypeIds.undoMod : voteTypeIds.upMod);
        },


        down: function(jClicked) {

            var jUp = jClicked.parent().find("img.vote-up");
            var jDown = jClicked.parent().find("img.vote-down");

            var isSelected = isDownSelected(jDown);
            var isReversal = isUpSelected(jUp);
            var incrementAmount = isSelected ? 1 : (isReversal ? -2 : -1);
            
            updateModScore(jClicked, incrementAmount);
            reset(jUp, jDown);

            if (!isSelected) { // now select it..
                jDown.attr("src", imgDownOn);
            }

            submitModVote(jClicked, isSelected ? voteTypeIds.undoMod : voteTypeIds.downMod);
        },

        favorite: function(jClicked) {
            // TODO: implement callback error messages..
            var jFavoriteCount = jClicked.parent().find("div.favoritecount b");
            var count = parseInt("0" + jFavoriteCount.text().replace(/^\s+|\s+$/g, ""), 10);
            
            if (!isFavoriteSelected(jClicked)) {
                jClicked.attr("src", imgFavOn);
                jFavoriteCount.addClass("favoritecount-selected").text(++count);
            } else {
                jClicked.attr("src", imgFavOff);
                jFavoriteCount.removeClass("favoritecount-selected").text((count-- <= 0) ? "" : count);
            }
            
            // disallow favorite clicking during submission..
            jClicked.unbind("click");
            
            submit(jClicked, getPostId(jClicked), voteTypeIds.favorite, function(data) {
                // rebind once we come back (if evar! omg!)..
                jClicked.click(function(event) {
                    vote.favorite($(event.target));
                });
            });            
        },

        acceptedAnswer: function(jClicked) {
            // Prevent other clicks
            getAcceptedAnswerLinks().unbind("click");

            var postId = jClicked.attr("id").substring("vote-accepted-".length);

            submit(jClicked, postId, voteTypeIds.acceptedByOwner, function(jClicked, postId, data) {
                if (data.Success) {
                    var commentsLinkClass = "comments-link";
                    var commentsContainerClass = "comments-container";

                    // remove old styles..
                    $("div.answer").removeClass("accepted-answer");
                    $("img.vote-accepted").attr("src", "/content/img/vote-accepted.png");
                    $("a.comments-link-accepted").removeClass().addClass(commentsLinkClass);
                    $("div.comments-container-accepted").removeClass().addClass(commentsContainerClass);
                    
                    var resetOwnerStyles = function(jAnswerDiv) {
                        jAnswerDiv.find(".comments-link").removeClass().addClass("comments-link-owner")
                            .end().find(".comments-container").removeClass().addClass("comments-container-owner");
                    };
                    
                    // if we removed an accepted from the question owner's answer, ensure it's back to its blue..
                    $("div.answer:has(input[id$='-is-owned-by-question-owner'])").not(".owner-answer").addClass("owner-answer")
                        .each(function() { resetOwnerStyles($(this)) });
                    
                    if (data.Message == "/content/img/vote-accepted-on.png") {
                        $("div.answer:has(img[id^='vote-accepted-" + postId + "'])").removeClass("owner-answer").addClass("accepted-answer");
                        commentsLinkClass = commentsLinkClass + "-accepted";
                        commentsContainerClass = commentsContainerClass + "-accepted";
                    }
                    else if ($("#" + postId + "-is-owned-by-question-owner").length > 0) { // toggled own accepted..
                        resetOwnerStyles($("#answer-" + postId));
                    }

                    $("a[id='comments-link-" + postId + "']").removeClass().addClass(commentsLinkClass)
                        .siblings("div").removeClass().addClass(commentsContainerClass);

                    jClicked.attr("src", data.Message);
                }
                else {
                    showNotification(jClicked, data.Message);
                }
                // Rebind clicks
                getAcceptedAnswerLinks().click(function(event) {
                    vote.acceptedAnswer($(event.target));
                });
            });
        },

        offensive: function(jClicked) {
            var postId = jClicked.attr("id").substring("vote-offensive-".length);

            submit(jClicked, postId, voteTypeIds.offensive, function(jClicked, postId, data) {
                if (data.Success) {
                    var jSpan = jClicked.parent().find("span.vote-offensive-count");

                    if (jSpan.length > 0)
                        jSpan.text("(" + data.Message + ")");
                    else
                        jClicked.parent().html(jClicked.parent().html() + ' <span class="vote-offensive-count">(' + data.Message + ')</span>');
                }
                else if (data.Message) {
                    showNotification(jClicked, data.Message);
                }
            });
        },

        lock: function(jClicked) {
            var postId = jClicked.attr("id").substring("lock-post-".length);
            var action = jClicked.text();

            $.ajax(
            {
                type: "POST",
                url: "/posts/" + postId + "/" + action,
                dataType: "json",
                data: { "fkey": fkey },
                success: function(data) {
                    if (data.Success) {
                        if (action == "lock") {
                            jClicked.text("unlock");
                            jClicked.css("font-weight", "bold");
                        }
                        else {
                            jClicked.text("lock");
                            jClicked.css("font-weight", "normal");
                        }
                    }
                    else {
                        showAjaxError(jClicked.parent(), "Unable to " + action + " this post");
                    }
                },
                error: function(res, textStatus, errorThrown) {
                    showAjaxError("#lock-post-" + postId + ":parent", "A problem occurred during locking");
                }
            });
        },

        close: function(jClicked) {
            var isClosed = jClicked.text().indexOf("open") > -1;
            var postId = jClicked.attr("id").substring("close-question-".length);
            
            if (isClosed) {
                if (confirm("Nominate this question for reopening?"))
                    submit(jClicked, postId, voteTypeIds.reopen, vote.closeCallback);
            }
            else { // render a form with reasons for closing..
                var reasons = [
                    'exact duplicate',
                    'not programming related',
                    'subjective and argumentative',
                    'not a real question',
                    'blatantly offensive',
                    'no longer relevant',
                    'too localized',
                    'spam'
                ];


                var html = '<div class="vote-notification"><h2>Why should this question be closed?</h2><ul style="font-size:110%;">';
                for (var i = 0; i < reasons.length; i++) {
                    html += '<li style="padding-top:3px;"><a class="close-reason">' + reasons[i] + '</a></li>';
                }
                html += '</ul><a class="close-cancel" style="font-size:110%">Cancel</a>';
                html += '</div>';

                var jDiv = $(html);
                var hideDiv = function() {
                    jClicked.parent().find(".vote-notification").fadeOut("fast", function() { $(this).remove(); });
                };
                
                jDiv.find("a.close-reason").click(function() {
                    hideDiv();
                    submit(jClicked, postId, voteTypeIds.close, vote.closeCallback, { "closeReason" : $(this).text() });
                });

                jDiv.find("a.close-cancel").click(hideDiv);

                jClicked.parent().append(jDiv);
                jDiv.fadeIn("fast");
            }
        },

        closeCallback: function(jClicked, postId, data) {
            
            if (data && data.Success) {
                if (data.Message) {
                    var isClosed = jClicked.text().indexOf("open") > -1;
                    jClicked.text(jClicked.text().replace(/\w?\(\d\)/, "") + " " + data.Message);
                    showNotification(jClicked, "This question still needs " + data.NewScore + " vote(s) from other users to " + 
                        (isClosed ? "reopen" : "close"));
                }
                else { // HACK: lack of message denotes a state change
                    location.reload(true);
                }
            }
            else {
                var jDiv = jClicked.parent();
                if (data.Message)
                    showAjaxError(jDiv, data.Message);
                else 
                    showAjaxError(jDiv, "A problem occurred during closing/reopening");
            }
            
        },

        deletePost: function(jClicked) {
            var postId = jClicked.attr("id").substring("delete-question-".length);

            $.post("/posts/" + postId + "/delete", { "fkey": fkey }, function(data) {
                if (data.Success)
                    location.reload(true);
                else {
                    showNotification(jClicked, data.Message);
                }
            }, "json");
        }

    };
} ();


// site comments

var comments = function() {

    var jDivInit = function(postId) {
        return $("#comments-" + postId);
    };

    var appendLoaderImg = function(postId) {
        appendLoader("#comments-" + postId + " div.comments");
    };

    var canPostComments = function(postId, jDiv) {
        var jHidden = jDiv.siblings("#can-post-comments-" + postId);
        return jHidden.val() == "true";
    };

    var renderForm = function(postId, jDiv) {
        var formId = "form-comments-" + postId;

        // Only add form once to dom..
        if (canPostComments(postId, jDiv)) {
            if (jDiv.find("#" + formId).length == 0) {
                var form = '<form id="' + formId + '" class="post-comments"><div>';
                form += '<textarea name="comment" cols="70" rows="2" maxlength="300" onblur="comments.updateTextCounter(this)" ';
                form += 'onfocus="comments.updateTextCounter(this)" onkeyup="comments.updateTextCounter(this)"></textarea>';
                form += '<input type="submit" value="Add Comment" /><br/><span class="text-counter"></span>';
                form += '<span class="form-error"></span></div></form>';

                jDiv.append(form);

                setupFormValidation("#" + formId,
                    { comment: { required: true, minlength: 10} },
                    function() { postComment(postId, formId); });
            }
        }
        else { // Let users know how to post comments.. 
            if (jDiv.find("#" + formId).length == 0) {
                var msg = $("#can-post-comments-msg-" + postId).val();
                jDiv.append('<div id="' + formId + '" style="color:red">' + msg + '</span>');
            }
        }
    };

    var getComments = function(postId, jDiv) {
        appendLoaderImg(postId);
        $.getJSON("/posts/" + postId + "/comments", function(json) { showComments(postId, json); });
    };

    var showComments = function(postId, json) {
        var jDiv = jDivInit(postId);

        jDiv = jDiv.find("div.comments");   // this div should contain any fetched comments..
        jDiv.find("div[id^='comment-']").remove();  // clean previous calls..

        removeLoader();

        if (json && json.length > 0) {
            for (var i = 0; i < json.length; i++)
                renderComment(jDiv, json[i]);

            jDiv.children().show();
        }
    };

    // {"Id":6,"PostId":38589,"CreationDate":"an hour ago","Text":"hello there!","UserDisplayName":"Jarrod Dixon","UserUrl":"/users/3/jarrod-dixon","DeleteUrl":null}
    var renderComment = function(jDiv, json) {
        var html = '<div id="comment-' + json.Id + '" style="display:none">' + json.Text;
        html += json.UserUrl ? '&nbsp;&ndash;&nbsp;<a href="' + json.UserUrl + '"' : '<span';
        html += ' class="comment-user">' + json.UserDisplayName + (json.UserUrl ? '</a>' : '</span>');
        html += ' <span class="comment-date">(' + json.CreationDate + ')</span>';

        if (json.DeleteUrl) {
            var img = "/content/img/close-small.png";
            var imgHover = "/content/img/close-small-hover.png";
            html += '<img onclick="comments.deleteComment($(this), ' + json.PostId + ', \'' + json.DeleteUrl + '\')" src="' + img;
            html += '" onmouseover="$(this).attr(\'src\', \'' + imgHover + '\')" onmouseout="$(this).attr(\'src\', \'' + img
            html += '\')" title="remove this comment" />';
        }

        html += '</div>';

        jDiv.append(html);
    };

    var postComment = function(postId, formId) {
        appendLoaderImg(postId);

        var formSelector = "#" + formId;
        var textarea = $(formSelector + " textarea");

        $.ajax({
            type: "POST",
            url: "/posts/" + postId + "/comments",
            dataType: "json",
            data: { comment: textarea.val(), "fkey": fkey },
            success: function(json) {
                showComments(postId, json);
                textarea.val("");
                comments.updateTextCounter(textarea);
                enableSubmitButton(formSelector);
            },
            error: function(res, textStatus, errorThrown) {
                removeLoader();
                showAjaxError(formSelector, res.responseText);
                enableSubmitButton(formSelector);
            }
        });
    };

    // public methods..
    return {

        init: function() {
            // Setup "show comments" clicks..
            $("a[id^='comments-link-']").unbind("click").click(function() { comments.show($(this).attr("id").substr("comments-link-".length)); });
        },

        show: function(postId) {
            var jDiv = jDivInit(postId);
            getComments(postId, jDiv);
            renderForm(postId, jDiv);
            jDiv.show();
            if (canPostComments(postId, jDiv)) jDiv.find("textarea").get(0).focus();
            jDiv.siblings("a").unbind("click").click(function() { comments.hide(postId); }).text("hide comments");
        },

        hide: function(postId) {
            var jDiv = jDivInit(postId);
            var len = jDiv.children("div.comments").children().length;
            var anchorText = len == 0 ? "add comment" : "comments (<b>" + len + "</b>)";

            jDiv.hide();
            jDiv.siblings("a").unbind("click").click(function() { comments.show(postId); }).html(anchorText);
            jDiv.children("div.comments").children().hide();
        },

        deleteComment: function(jImg, postId, deleteUrl) {
            if (confirm("Really delete this comment?")) {
                jImg.hide();
                appendLoaderImg(postId);
                $.post(deleteUrl, { dataNeeded: "forIIS7" }, function(json) {
                    showComments(postId, json);
                }, "json");
            }
        },

        updateTextCounter: function(textarea) {
            var length = textarea.value ? textarea.value.length : 0;
            var color = length > 270 ? "#f00" : length > 200 ? "#f60" : "#999";
            var jSpan = $(textarea).siblings("span.text-counter");
            jSpan.html((300 - length) + ' character' + (length == 299 ? '' : 's') + ' left').css("color", color);
        }
    };

} ();

$().ready(function() {
    comments.init();
});

// http://plugins.jquery.com/files/jquery.color.js.txt
/*
 * jQuery Color Animations
 * Copyright 2007 John Resig
 * Released under the MIT and GPL licenses.
 */
(function(jQuery){
	jQuery.each(['backgroundColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'borderTopColor', 'color', 'outlineColor'], function(i,attr){
		jQuery.fx.step[attr] = function(fx){
			if ( fx.state == 0 ) {
				fx.start = getColor( fx.elem, attr );
				fx.end = getRGB( fx.end );
			}

			fx.elem.style[attr] = "rgb(" + [
				Math.max(Math.min( parseInt((fx.pos * (fx.end[0] - fx.start[0])) + fx.start[0]), 255), 0),
				Math.max(Math.min( parseInt((fx.pos * (fx.end[1] - fx.start[1])) + fx.start[1]), 255), 0),
				Math.max(Math.min( parseInt((fx.pos * (fx.end[2] - fx.start[2])) + fx.start[2]), 255), 0)
			].join(",") + ")";
		}
	});

	function getRGB(color) {
		var result;
		if ( color && color.constructor == Array && color.length == 3 )
			return color;
		if (result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color))
			return [parseInt(result[1]), parseInt(result[2]), parseInt(result[3])];
		if (result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(color))
			return [parseFloat(result[1])*2.55, parseFloat(result[2])*2.55, parseFloat(result[3])*2.55];
		if (result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color))
			return [parseInt(result[1],16), parseInt(result[2],16), parseInt(result[3],16)];
		if (result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color))
			return [parseInt(result[1]+result[1],16), parseInt(result[2]+result[2],16), parseInt(result[3]+result[3],16)];
	}
	
	function getColor(elem, attr) {
		var color;
		do {
			color = jQuery.curCSS(elem, attr);
			if ( color != '' && color != 'transparent' || jQuery.nodeName(elem, "body") )
				break; 
			attr = "backgroundColor";
		} while ( elem = elem.parentNode );
		return getRGB(color);
	};

})(jQuery);