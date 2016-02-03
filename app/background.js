chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.runtime.sendMessage(null, 'hackr:start');
});
