var init = function(data) {
    Hackr.start({
        greeting: '- - - - - yo, hackr! - - - - -',
        fauxCode: data
    });
    Hackr.progress(5, 400, function() {
        Hackr.prompt('loaded system configurations');
    });
};

// var loadDefault = function() {
//     $.get('https://rawgit.com/jrburke/r.js/master/dist/r.js', init);
// };


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message === 'hackr:start') {
        init();
    }
});
