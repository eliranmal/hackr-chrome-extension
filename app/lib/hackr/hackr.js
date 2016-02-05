(function(root, factory) {
    if (typeof define === 'function' && define.amd) { // amd
        define(['jquery', 'exports'], function($, exports) {
            root.Hackr = factory(exports, $);
        });
    } else if (typeof exports !== 'undefined') { // node js / common js
        factory(exports);
    } else { // global
        root.Hackr = factory({}, (root.jQuery || root.Zepto || root.ender ||
            root.$));
    }
}(this, function(Hackr, $) {

    // SETTINGS, SHARED MEMBERS

    var isRunning,
        isProgress,
        jQueryFxOffState,
        $wrapper,
        $code,
        $cursor,
        $input,
        $alert,
        buffer,
        options = {},
        intervals = {},
        colors = {
            RED: 'red',
            GREEN: 'green',
            YELLOW: 'yellow',
            BLUE: 'lightblue'
        },
        alertTypes = {
            SUCCESS: colors.GREEN,
            INFO: colors.BLUE,
            WARNING: colors.YELLOW,
            DANGER: colors.RED
        },
        mandatoryOptionKeys = [
            'fauxCode'
        ],
        defaultOptions = {
            cursorBlinkRate: 400,
            alerts: [{
                type: alertTypes.DANGER,
                message: 'security has been breached!',
                blink: true
            }, {
                type: alertTypes.SUCCESS,
                message: 'access granted',
                blink: true
            }]
        },
        regex = {
            comments: /(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm,
            emptyLines: /^\s*[\r\n]$/gm,
            splitter: {
                js: /(?=\{|\(|\.|,|\n|\||\&)/g // use positive lookahead, to not consume the delimiters
            }
        },
        numericKeyCodes = {
            48: 0,
            49: 1,
            50: 2,
            51: 3,
            52: 4,
            53: 5,
            54: 6,
            55: 7,
            56: 8,
            57: 9
        },
        css = {
            wrapper: {
                position: 'absolute',
                top: '0',
                bottom: '0',
                left: '0',
                right: '0',
                zIndex: '999999',
                overflow: 'auto',
                padding: '20px',
                lineHeight: '1.5',
                fontSize: '18px',
                fontFamily: 'monospace',
                backgroundColor: '#000',
                opacity: '0.9'
            },
            code: {
                display: 'inline',
                whiteSpace: 'pre-wrap',
                color: 'green',
                marginRight: '.2em'
            },
            cursor: {
                display: 'inline-block',
                width: '.7em',
                height: '1.2em',
                backgroundColor: 'green',
                marginBottom: '-.25em'
            },
            input: {
                position: 'absolute',
                left: '-999999px',
                bottom: '-999999px' // don't use TOP to hide it - it breaks the container's scroll-top update
            },
            alert: {
                position: 'fixed',
                top: '35%',
                left: '35%',
                display: 'table',
                width: '30%',
                height: '30%',
                padding: '2em',
                marginLeft: '-2em'
            },
            alertMessage: {
                display: 'table-cell',
                verticalAlign: 'middle',
                textAlign: 'center',
                fontSize: '2em',
                color: '#000',
                textTransform: 'uppercase'
            }
        };


    // PUBLIC API

    Hackr.VERSION = '0.1.0';

    Hackr.ALERT_TYPE = alertTypes;

    /**
     * starts the hacker simulator.
     * @param options options for the simulator.
     */
    Hackr.start = function(options) {
        isRunning || bootstrap(options) && (isRunning = true);
    };

    /**
     * stops the hacker simulator.
     */
    Hackr.stop = function() {
        isRunning && teardown() && (isRunning = false);
    };

    /**
     * prints a message in its own line, simulating a console prompt.
     * @param message the message to print.
     */
    Hackr.prompt = function(message) {
        isRunning && prompt('\n' + message + '\n');
    };

    /**
     * prints a sequence of dots, one by one, to simulate a progress.
     * @param dots the total number of dots to reach.
     * @param tick an interval for appending new dots, in milliseconds.
     * @param callback a function to execute once the progress is over.
     */
    Hackr.progress = function(dots, tick, callback) {
        isRunning && progress(dots, tick, callback);
    };

    /**
     * shows an alert box in the middle of the screen.
     * @param alertOptions the alert options:
     *      'message': {string} the message text to show in the alert box.
     *      'type': {enum} the alert type, sets the alert box background color. use values from Hackr.ALERT_TYPE.
     *      'blink': {boolean} optional - whether the alert box should blink.
     */
    Hackr.alert = function(alertOptions) {
        isRunning && alert(alertOptions);
    };


    // PRIVATE FUNCTIONS

    var bootstrap = function(opts) {
        opts = opts || {};
        validateOptions(opts);
        options = opts;

        buffer = initBuffer(opts.fauxCode);

        $wrapper = initWrapperEl();
        $code = initCodeEl();
        $cursor = initCursorEl();
        $input = initInputEl();

        disableAnimation(); // we don't want the blink to be animated
        initCursorBlink(opts.cursorBlinkRate);

        $wrapper.append($code);
        $wrapper.append($cursor);
        $wrapper.append($input);
        $(opts.targetEl || 'body').append($wrapper);
        $input.focus();

        greet(opts.greeting);

        return true;
    };

    var teardown = function() {
        clearAllIntervals();
        $wrapper.remove();
        restoreAnimation();

        return true;
    };

    var validateOptions = function(options) {
        // fill in default options
        merge(options, defaultOptions);
        // check mandatory options
        validateExists(options, mandatoryOptionKeys,
            'this option must be provided!');
    };

    var greet = function(msg) {
        msg && prompt('\n' + msg + '\n\n');
    };

    var prompt = function(msg) {
        msg && $code && $code.append(msg);
    };

    var progress = function(dots, tick, callback) {
        dots = dots || 10;
        tick = tick || 400;
        var count = 0;
        intervals.progress = setInterval(function() {
            count++;
            if (count <= dots) {
                prompt('.');
            } else {
                clearInterval(intervals.progress);
                delete intervals.progress;
                (typeof callback === 'function') && callback();
            }
        }, tick);
    };

    var alert = function(alertOptions) {
        alertOptions.message && contains(alertTypes, alertOptions.type) &&
            $wrapper && $wrapper.append($alert = initAlert(alertOptions));
    };

    var initAlert = function(alertOptions) {
        var $el = $('<div>')
            .css(css.alert)
            .css('backgroundColor', alertOptions.type || colors.RED)
            .append($('<span>')
                .text(alertOptions.message)
                .css(css.alertMessage));
        alertOptions.blink && blink('alertBlink', 300, $el);
        return $el;
    };

    var destroyAlert = function() {
        $alert.remove();
        $alert = null;
    };

    var initBuffer = function(fauxCode) {
        return fauxCode.replace(regex.comments, '') // strip code comments (naively)
            .replace(regex.emptyLines, '') // remove leftover space after stripping comments
            .split(regex.splitter.js); // turn the string into a stream
    };

    var initWrapperEl = function() {
        return $('<div>')
            .click(Hackr.stop)
            .css(css.wrapper);
    };

    var initCodeEl = function() {
        return $('<pre>')
            .css(css.code);
    };

    var initCursorEl = function() {
        return $('<span>')
            .css(css.cursor);
    };

    var initInputEl = function() {
        return $('<input>')
            .attr('type', 'text')
            .keydown(function(e) {
                (e.which === 13) && isRunning && e.preventDefault(); // ENTER breaks the auto-scroll. fuck it, we don't need it
            })
            .keyup(function(e) { // keypress won't detect ESC, use keyup instead to trigger teardown
                (e.which === 27) && Hackr.stop();
            })
            .keypress(function(e) {
                isRunning && !isProgress && onKeyPress(e);
            })
            .blur(function(e) {
                this.focus(); // keep focus at all costs!
            })
            .css(css.input);
    };

    var onKeyPress = function(e) {
        var nextToken, keyCode;
        $alert && destroyAlert();
        ((keyCode = e.which) in numericKeyCodes) ? numericKeyCodes.hasOwnProperty(
            keyCode) && onNumericKeyPress(keyCode): (nextToken =
            buffer.shift()) && onCharKeyPress(nextToken);

    };

    var onCharKeyPress = function(token) {
        $code.append(token);
        // input element must be hidden by negative bottom offset (and not top!) in order for the auto-scroll to work
        $wrapper.prop('scrollTop', $wrapper.height());
    };

    var onNumericKeyPress = function(keyCode) {
        var alertOptions;
        options.alerts && (alertOptions = options.alerts[
            numericKeyCodes[keyCode]]) && alert(alertOptions);
    };

    var initCursorBlink = function(cursorBlinkRate) {
        blink('cursorBlink', cursorBlinkRate, $cursor);
    };

    var blink = function(uid, rate, $el) {
        intervals[uid] = setInterval(function() {
            $el.toggle(function() {
                $el.css('visibility', 'hidden');
            }, function() {
                $el.css('visibility', 'visible');
            });
        }, rate);
    };

    var disableAnimation = function() {
        jQueryFxOffState = $.fx.off;
        $.fx.off = true;
    };

    var restoreAnimation = function() {
        $.fx.off = jQueryFxOffState;
    };

    var clearAllIntervals = function() {
        var prop, interval;
        for (prop in intervals) {
            if (intervals.hasOwnProperty(prop)) {
                interval = intervals[prop];
                clearInterval(interval);
                delete intervals[prop];
            }
        }
    };


    // GENERIC UTILITIES

    var contains = function(obj, val) {
        var key, prop;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                prop = obj[key];
                if (prop === val) {
                    return true;
                }
            }
        }
        return false;
    };

    var merge = function(target, source) {
        var srcKey, srcVal;
        for (srcKey in source) {
            if (source.hasOwnProperty(srcKey)) {
                srcVal = source[srcKey];
                (typeof target[srcKey] === 'undefined') && (target[
                    srcKey] = srcVal);
            }
        }
    };

    var validateExists = function(obj, keys, errMsg) {
        var i, key;
        for (i = 0; i < keys.length; i++) {
            key = keys[i];
            if (!obj[key]) {
                throw new Error('[' + key + '] not found. ' +
                    errMsg);
            }
        }
    };


    return Hackr;
}));
