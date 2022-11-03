// ==UserScript==
// @name         Action Buttons Fix
// @version      1.0.0
// @description  Fixes watch action buttons to be like how they used to be!
// @author       Aubrey P.
// @icon         https://www.youtube.com/favicon.ico
// @updateURL    https://github.com/aubymori/MiscYouTubeScripts/raw/main/ActionBtnFix.user.js
// @namespace    aubymori
// @license      Unlicense
// @match        www.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

const abtnconfig = {
    unsegmentLikeButton: true,
    noFlexibleItems: true
};

function updateBtns() {
    var watchFlexy = document.querySelector("ytd-watch-flexy");
    var results = watchFlexy.data.contents.twoColumnWatchNextResults.results.results.contents;

    for (var i = 0; i < results.length; i++) {
        if (results[i].videoPrimaryInfoRenderer) {
            var actions = results[i].videoPrimaryInfoRenderer.videoActions.menuRenderer;

            if (abtnconfig.unsegmentLikeButton) {
                if (actions.topLevelButtons[0].segmentedLikeDislikeButtonRenderer) {
                    var segmented = actions.topLevelButtons[0].segmentedLikeDislikeButtonRenderer;
                    actions.topLevelButtons.splice(0, 1);
                    actions.topLevelButtons.unshift(segmented.dislikeButton);
                    actions.topLevelButtons.unshift(segmented.likeButton);
                }
            }

            if (abtnconfig.noFlexibleItems) {
                for (var i = 0; i < actions.flexibleItems.length; i++) {
                    actions.topLevelButtons.push(actions.flexibleItems[i].menuFlexibleItemRenderer.topLevelButton);
                }

                delete actions.flexibleItems
            }
        }
    }

    var temp = watchFlexy.data;
    watchFlexy.data = {};
    watchFlexy.data = temp;
}

document.addEventListener("yt-page-data-updated", (e) => {
    if (e.detail.pageType == "watch") {
        updateBtns();
    }
});