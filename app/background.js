// demo: https://jsfiddle.net/eliranmal/y696ro11/

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.sendMessage(tab.id, 'hackr:start');
});
