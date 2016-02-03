chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.runtime.sendMessage('hackr:start');
});
