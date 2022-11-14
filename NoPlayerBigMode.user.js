// ==UserScript==
// @name         No Player Big Mode
// @version      1.0.0
// @description  Prevents the YouTube player from entering Big Mode (fullscreen)
// @author       Aubrey P.
// @icon         https://www.youtube.com/favicon.ico
// @updateURL    https://github.com/aubymori/MiscYouTubeScripts/raw/main/ActionBtnFix.user.js
// @namespace    aubymori
// @license      Unlicense
// @match        www.youtube.com/*
// @match        youtube-nocookie.com/*
// @match        youtube.googleapis.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

async function waitForElm(elm) {
    while (document.querySelector(elm) == null) {
        await new Promise(r => requestAnimationFrame(r));
    }
    return document.querySelector(elm);
}

var playerObserver = new MutationObserver((list) => {
    list.forEach((mutation) => {
        if (mutation.type === "attributes") {
            var elm = mutation.target;

            if (elm.classList
            &&  elm.classList.contains("html5-video-player")
            &&  elm.classList.contains("ytp-big-mode")) {
                elm.classList.remove("ytp-big-mode");
            }
        }
    });
});

// We have to observe each player by itself or else the browser kills itself
var playerFinder = new MutationObserver((list) => {
    list.forEach((mutation) => {
        if (mutation.addedNodes) {
            mutation.addedNodes.forEach((node) => {
                if (node.classList
                &&  node.classList.contains("html5-video-player")) {
                    playerObserver.observe(node, {
                        attributes: true
                    });
                }
            });
        }
    });
});

waitForElm("body").then(() => {
    playerFinder.observe(document.body, {
        childList: true,
        subtree: true
    });
})

document.addEventListener("DOMContentLoaded", function temp() {
    document.head.insertAdjacentHTML("beforeend", `
    <style>
    .ytp-fullerscreen-edu-button {
        display: none !important;
    }
    </style>
    `);
})