chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.runtime.sendMessage(string extensionId, any message, object options, function responseCallback)


    // chrome.tabs.executeScript({
    // code: 'document.body.style.backgroundColor="red"'
    // });
});
