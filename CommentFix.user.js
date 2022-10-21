// ==UserScript==
// @name         Comments Fix
// @version      1.1.1
// @description  Fixes comments to be like how they used to be!
// @author       Aubrey P.
// @icon         https://www.youtube.com/favicon.ico
// @updateURL    https://github.com/aubymori/MiscYouTubeScripts/raw/main/CommentFix.user.js
// @namespace    aubymori
// @license      Unlicense
// @match        www.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

var observingComments = false;
var hl;

const cfconfig = {
    unicodeEmojis: true
};

const cfi18n = {
    en: {
        viewSingular: "View reply",
        viewMulti: "View %s replies",
        viewSingularOwner: "View reply from %s",
        viewMultiOwner: "View %s replies from %s and others",
        hideSingular: "Hide reply",
        hideMulti: "Hide replies",
        replyCountIsolator: /( REPLIES)|( REPLY)/
    }
}

/**
 * Get a string from the localization strings.
 *
 * @param {string}   string  Name of string to get
 * @param {string}   hl      Language to use.
 * @param {...array} args    Strings.
 * @returns {string}
 */
 function getString(string, hl = "en", ...args) {
    if (!string) return;
    var str;
    if (cfi18n[hl]) {
        if (cfi18n[hl][string]) {
            str = cfi18n[hl][string];
        } else if (cfi18n.en[string]) {
            str = cfi18n.en[string];
        } else {
            return;
        }
    } else {
        if (cfi18n.en[string]) str = cfi18n.en[string];
    }

    for (var i = 0; i < args.length; i++) {
        str = str.replace(/%s/, args[i]);
    }

    return str;
}

/**
 * Wait for a selector to exist
 *
 * @param {string}       selector  CSS Selector
 * @param {HTMLElement}  base      Element to search inside
 * @returns {Node}
 */
async function waitForElm(selector, base = document) {
    if (!selector) return null;
    if (!base.querySelector) return null;
    while (base.querySelector(selector) == null) {
        await new Promise(r => requestAnimationFrame(r));
    };
    return base.querySelector(selector);
};

/**
 * Is a value in an array?
 * 
 * @param {*}     needle    Value to search
 * @param {Array} haystack  Array to search
 * @returns {boolean}
 */
 function inArray(needle, haystack) {
    for (var i = 0; i < haystack.length; i++) {
        if (needle == haystack[i]) return true;
    }
    return false;
}

/**
 * Get text of an InnerTube string.
 * 
 * @param {object} object  String container.
 */
function getSimpleString(object) {
    if (object.simpleText) return object.simpleText;
    
    var str = "";
    for (var i = 0; i < object.runs.length; i++) {
        str += object.runs[i].text;
    }
    return str;
}

/**
 * Format a commentRenderer.
 * 
 * @param {object} comment  commentRenderer from InnerTube.
 */
function formatComment(comment) {
    if (cfconfig.unicodeEmojis) {
        var runs;
        try {
            runs = comment.contentText.runs
            for (var i = 0; i < runs.length; i++) {
                delete runs[i].emoji;
                delete runs[i].loggingDirectives;
            }
        } catch(err) {}
    }

    return comment;
}

/**
 * Format a commentThreadRenderer.
 * 
 * @param {object} thread  commentThreadRenderer from InnerTube.
 */
async function formatCommentThread(thread) {
    if (thread.comment.commentRenderer) {
        thread.comment.commentRenderer = formatComment(thread.comment.commentRenderer);
    }

    var replies;
    try {
        replies = thread.replies.commentRepliesRenderer;
        if (replies.viewRepliesIcon) {
            replies.viewReplies.buttonRenderer.icon = replies.viewRepliesIcon.buttonRenderer.icon;
            delete replies.viewRepliesIcon;
        }

        if (replies.hideRepliesIcon) {
            replies.hideReplies.buttonRenderer.icon = replies.hideRepliesIcon.buttonRenderer.icon;
            delete replies.hideRepliesIcon;
        }

        var creatorName;
        try {
            creatorName = replies.viewRepliesCreatorThumbnail.accessibility.accessibilityData.label;
            delete replies.viewRepliesCreatorThumbnail;
        } catch(err) {}

        var replyCount = getSimpleString(replies.viewReplies.buttonRenderer.text);
        replyCount = +replyCount.replace(getString("replyCountIsolator", hl), "");

        var viewMultiString = creatorName ? "viewMultiOwner" : "viewMulti";
        var viewSingleString = creatorName ? "viewSingularOwner" : "viewSingular";

        replies.viewReplies.buttonRenderer.text = {
            runs: [
                {
                    text: (replyCount > 1) ? getString(viewMultiString, hl, replyCount, creatorName) : getString(viewSingleString, hl, creatorName)
                }
            ]
        }

        replies.hideReplies.buttonRenderer.text = {
            runs: [
                {
                    text: (replyCount > 1) ? getString("hideMulti", hl) :  getString("hideSingular", hl)
                }
            ]
        };
    } catch(err) {}

    return thread;
}

/**
 * Force Polymer to refresh data of an element.
 * 
 * @param {Node} element  Element to refresh data of.
 */
function refreshData(element) {
    var clone = element.cloneNode();
    clone.data = element.data;
    // Let the script know we left our mark
    // in a way that doesn't rely on classes
    // because Polymer likes to cast comments
    // into the fucking void for later reuse
    clone.data.fixedByCF = true;
    for (var i in element.properties) {
        clone[i] = element[i];
    }
    element.insertAdjacentElement("afterend", clone);
    element.remove();
}

var commentObserver = new MutationObserver((list) => {
    list.forEach(async (mutation) => {
        if (mutation.addedNodes) {
            for (var i = 0; i < mutation.addedNodes.length; i++) {
                var elm = mutation.addedNodes[i];
                if (elm.classList && elm.data && !elm.data.fixedByCF) {
                    if (elm.tagName == "YTD-COMMENT-THREAD-RENDERER") {
                        elm.data = await formatCommentThread(elm.data);
                        refreshData(elm);
                    } else if (elm.tagName == "YTD-COMMENT-RENDERER") {
                        if (!elm.classList.contains("ytd-comment-thread-renderer")) {
                            elm.data = formatComment(elm.data);
                            refreshData(elm);
                        }
                    }
                }
            }
        }
    });
});

document.addEventListener("yt-page-data-updated", async (e) => {
    hl = yt.config_.HL;
    commentObserver.observe(document.querySelector("ytd-app"),  { childList: true, subtree: true });
});