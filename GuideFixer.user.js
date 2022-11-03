// ==UserScript==
// @name         Guide Fixer
// @version      1.0.0
// @description  Lets you customize the guide to your liking!!!!!!!!
// @author       Aubrey P.
// @icon         https://www.youtube.com/favicon.ico
// @updateURL    https://github.com/aubymori/MiscYouTubeScripts/raw/main/GuideFixer.user.js
// @namespace    aubymori
// @license      Unlicense
// @match        www.youtube.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

// Regex to isolate UCID from your videos item
const VIDEOS_URL_REGEX = /(https:\/\/studio.youtube.com\/channel\/)|(\/videos)/g;

const gfconfig = {
    homeToWhatToWatch: true,
    addMyChannel: true,
    addTrending: true,
    libraryAsGuideSectionTitle: true,
    libraryFolderIcon: true,
    historyItemSignedOut: true,
    exploreSectionToBestOfYT: true,
    expandSubscriptionsSection: true,
    remove: {
        shorts: true,
        yourVideos: true,
        yourClips: true,
        exploreSectionSignedIn: true,
        librarySignedOut: true,
        moreFromYouTube: true,
        settingsSection: true,
        guideFooter: true
    }
};

const gfi18n = {
    en: {
        whatToWatch: "What to Watch",
        myChannel: "My channel"
    }
};

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
    if (gfi18n[hl]) {
        if (gfi18n[hl][string]) {
            str = gfi18n[hl][string];
        } else if (gfi18n.en[string]) {
            str = gfi18n.en[string];
        } else {
            return;
        }
    } else {
        if (gfi18n.en[string]) str = gfi18n.en[string];
    }

    for (var i = 0; i < args.length; i++) {
        str = str.replace(/%s/, args[i]);
    }

    return str;
}

/**
 * Is the user signed in?
 * 
 * @returns bool
 */
function isSignedIn() {
    return yt.config_.LOGGED_IN ?? false;
}

/**
 * 
 * @param {object} sections  Guide sections array.
 * @param {string} icon      Icon type to look for
 */
function getItemByIcon(sections, icon) {
    for (var i = 0; i < sections.length; i++) {
        if (sections[i].guideSectionRenderer?.items) {
            var section = sections[i].guideSectionRenderer.items;
            for (var j = 0; j < section.length; j++) {
                if (section[j].guideEntryRenderer) {
                    if (section[j].guideEntryRenderer?.icon?.iconType == icon) {
                        return section[j];
                    }
                } else if (section[j]?.guideCollapsibleSectionEntryRenderer?.sectionItems) {
                    var colsection = section[j].guideCollapsibleSectionEntryRenderer.sectionItems;
                    for (var k = 0; k < colsection.length; k++) {
                        if (colsection[k].guideEntryRenderer) {
                            if (colsection[k].guideEntryRenderer?.icon?.iconType == icon) {
                                return colsection[k];
                            }
                        }
                    }
                }
            }
        }
    }
    return "Could not find item";
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
    clone.data.fixedByGF = true;
    for (var i in element.properties) {
        clone[i] = element[i];
    }
    element.insertAdjacentElement("afterend", clone);
    element.remove();
}

/**
 * Modify the guide.
 * 
 * @param {Node} guide  ytd-guide-renderer
 * @returns object
 */
function modifyGuide(guide) {
    if (gfconfig.remove.guideFooter) {
        waitForElm("#footer.ytd-guide-renderer").then((elm) => {
            elm.remove();
        });
    }

    var sections = guide.data.items;

    var mainSection = sections[0].guideSectionRenderer.items;
    for (var i = 0; i < mainSection.length; i++) {
        if (mainSection[i].guideEntryRenderer) {
            var item = mainSection[i].guideEntryRenderer;

            if (item.icon.iconType == "WHAT_TO_WATCH" && gfconfig.homeToWhatToWatch) {
                item.formattedTitle = {
                    simpleText: getString("whatToWatch", yt.config_.HL)
                };
            }

            if (item.icon.iconType == "TAB_SHORTS" && gfconfig.remove.shorts) {
                mainSection.splice(i, 1);
                i--;
            }

            if (item.icon.iconType == "SUBSCRIPTIONS") {
                if (gfconfig.addMyChannel && isSignedIn()) {
                    var yourVideos = getItemByIcon(sections, "MY_VIDEOS");
                    var ucid = yourVideos.guideEntryRenderer.navigationEndpoint.urlEndpoint.url.replace(VIDEOS_URL_REGEX, "");

                    mainSection.splice(i, 0, {
                        guideEntryRenderer: {
                            navigationEndpoint: {
                                clickTrackingParams: "CBwQtSwYASITCNqYh-qO_fACFcoRrQYdP44D9Q==",
                                commandMetadata: {
                                    webCommandMetadata: {
                                        url: "/channel/" + ucid,
                                        webPageType: "WEB_PAGE_TYPE_CHANNEL",
                                        rootVe: 6827,
                                        apiUrl: "/youtubei/v1/browse"
                                    }
                                },
                                browseEndpoint: {
                                    browseId: ucid
                                }
                            },
                            icon: {
                                iconType: "ACCOUNT_CIRCLE"
                            },
                            trackingParams: "CBwQtSwYASITCNqYh-qO_fACFcoRrQYdP44D9Q==",
                            formattedTitle: {
                                simpleText: getString("myChannel", yt.config_.HL)
                            },
                            accessibility: {
                                accessibilityData: {
                                    label: getString("myChannel", yt.config_.HL)
                                }
                            }
                        }
                    });
                    i++;
                }

                if (gfconfig.addTrending) {
                    mainSection.splice(i, 0, getItemByIcon(sections, "TRENDING"));
                    i++;
                }
                
                if (gfconfig.historyItemSignedOut && !isSignedIn()) {
                    mainSection[i] = getItemByIcon(sections, "WATCH_HISTORY");
                }
            }
        } else if (mainSection[i].guideCollapsibleSectionEntryRenderer) {
            if (gfconfig.remove.librarySignedOut && !isSignedIn()) {
                mainSection.splice(i, 1);
            }

            var librarySection = mainSection[i].guideCollapsibleSectionEntryRenderer;
            if (gfconfig.libraryFolderIcon) {
                librarySection.headerEntry.guideEntryRenderer.icon.iconType = "FOLDER";
            }

            for (var j = 0; j < librarySection.sectionItems.length; j++) {
                var item = librarySection.sectionItems[j].guideEntryRenderer;

                if ((item.icon.iconType == "MY_VIDEOS" && gfconfig.remove.yourVideos)
                 || (item.icon.iconType == "CONTENT_CUT" && gfconfig.remove.yourClips)) {
                    librarySection.sectionItems.splice(j, 1);
                    j--;
                 }
            }
        }
    }

    var temp = guide.data;
    guide.data = {};
    guide.data = temp;
}

/**
 * Wait for a selector to exist
 *
 * @param {string}       selector  CSS Selector
 * @param {HTMLElement}  base      Element to search inside
 * @return {Node}
 */
async function waitForElm(selector, base = document) {
    if (!selector) return null;
    if (!base.querySelector) return null;
    while (base.querySelector(selector) == null) {
        await new Promise(r => requestAnimationFrame(r));
    };
    return base.querySelector(selector);
};

var mo = new MutationObserver(list => {
    list.forEach(async mutation => {
        if (mutation.addedNodes) {
            for (var i = 0; i < mutation.addedNodes.length; i++) {
                if (mutation.addedNodes[i].tagName == "YTD-GUIDE-RENDERER") {
                    while (typeof mutation.addedNodes[i].data != "object") {
                        await new Promise(r => requestAnimationFrame(r));
                    }
                    modifyGuide(mutation.addedNodes[i]);
                    mo.disconnect();
                }
            }
        }
    })
});

var ytdApp = await waitForElm("ytd-app");
mo.observe(ytdApp, { childList: true, subtree: true });