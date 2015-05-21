/// [Begin] Adapted from JsUnit
const error_prefix = '\u001B[31m';
const ok_prefix = '\u001B[32m';
const bold_prefix = '\u001B[1m';
const reset_suffix = '\u001B[39m';
const bold_suffix = '\u001B[22m';
const message_prefix = '\u001B[33m';
function _getStackTrace() {
    var result = '';

    // fake an exception so we can get Mozilla's error stack
    try {
        foo.bar;
    }
    catch (e) {
        result = _parseStackTrace(e);
    }

    return result;
};

function _parseStackTrace(e) {
    let result = '';

    if ((e !== null) && (e.stack !== null)) {
        let stacklist = e.stack.split('\n');

        // We start at 2 because we don't need to get the 'getStackTrace' &
        // 'GjsUnitException' lines
        for (let i = 0; i < stacklist.length - 1; i++) {
            let framedata = stacklist[i];
            let line = ' at ';
            let name = framedata.split('@')[0].replace('<', '');
            line += name === '' ? '_anonymous_' : name;
            line += " (";
            line += framedata.substring(framedata.lastIndexOf('/') + 1);
            line += ")";

            result += line + '\n';
        }

    }
    else {
        result = 'No stack trace';
    }

    return result;
};

function GjsUnitException(message) {
    this.isGjsUnitException = true;
    this.message      = message;
    this.stackTrace   = _getStackTrace();
}

function _processException(e, prefix) {
    let result = '\n' + prefix + e.message;

    if (e.stackTrace) {
      result += '\nStack trace:\n' + e.stackTrace;
    }

    return result;
}

// Assertion functions
function _assert(condition, message) {
    if (!condition) {
        throw new GjsUnitException('GjsUnitException: ' + message);
    }
}

function assertNull(o) {
    _assert(o === null, 'The object should be null, but is ' + o);
}

function assertTrue(o) {
    _assert(o === true, 'The input should be true and is false');
}

function assertFalse(o) {
    _assert(o === false, 'The input should be false and is true');
}

function assertNotNull(o) {
    _assert(o !== null, 'The object is null and should not be');
}

function assertEquals(o1, o2) {
    _assert(o1 === o2, 'The objects are different and should be equal, ' + o1 + ' is not ' + o2);
}

function assertNotEquals(o1, o2) {
    _assert(o1 !== o2, 'The objects are equal and should be different, ' + o1 + ' equals ' + o2);
}

function assertUndefined(o1) {
    _assert(o1 === undefined, 'The object should be undefined, but is ' + o1);
}

function fail(message) {
    _assert(false, message);
}
/// [End] Adapted from JsUnit

// A suite is a child of this class
const Suite = new imports.lang.Class({
    Name: 'Suite',

    // default constructor
    _init: function(title) {
        this._tests = null;
        this._descriptions = null;
        this._title = title;
        instance.addSuite(this);
    },

    // This function is called before each test execution
    // It is valid for all tests of this suite
    // If a different setup is needed, write a new suite
    setup: function() {},

    // This function is called after each test execution
    // It is valid for all tests of this suite
    // If a different teardown is needed, write a new suite
    teardown: function() {},

    // Title property
    get title() {
        return this._title;
    },

    set title(title) {
        this._title = title;
    },

    // Add a new test case to the suite
    // @description of the test
    // @f the test function, this function must take the suite as parameter
    addTest: function(description, f) {
        if (this._tests === null) {
            this._tests = [];
            this._descriptions = [];
        }

        this._descriptions.push(description);
        this._tests.push(f);
    },

    // Writing this as a property would be better but I don't know how
    // to code indexed properties in JS
    getTestDescription: function(index) {
        if (this._descriptions === null) {
            return null;
        }
        else if (index < 0 || index >= this._descriptions.length) {
            throw new Error('Suite.test_description: Index is out of range');
        }
        else {
            return this._descriptions[index];
        }
    },

    // Writing this as a property would be better but I don't know how
    // to code indexed properties in JS
    getTest: function(index) {
        if (this._tests === null) {
            return null;
        }
        else if (index < 0 || index >= this._tests.length) {
            throw new Error('Suite.test: Index is out of range');
        }
        else {
            return this._tests[index];
        }
    },

    get nbTests() {
        return this._tests === null ? 0 : this._tests.length;
    }
});

// The test runner is a singleton
const Runner = new imports.lang.Class({
    Name: 'Runner',

    // default constructor
    _init: function() {
        this._suites = null;
        this._instance = null;
        this._filters = [];
        this._negativeFilters = [];
        this.stopOnFail = false;
    },

    addSuite: function(suite) {
        if (this._suites === null) {
            this._suites = [];
        }

        this._suites.push(suite);
    },

    addFilter: function(filterString, negative) {
        if (typeof filterString == 'undefined' || filterString === null) {
            return;
        }
        if (negative === true) {
            this._negativeFilters.push(filterString);
            return;
        }
        this._filters.push(filterString);
    },

    run: function() {
        if (this._suites === null) {
            print('No test suite to run. End');
            return 0;
        }

        let nbSuites = this._suites.length;
        let gFailed = 0,
            gErrors = 0,
            gRun = 0,
            gSkipped = 0;
        let failedTests = [];
        let erroredTests = [];

        for (let i = 0; i < nbSuites; i++) {
            let aSuite = this._suites[i];
            let nb = aSuite.nbTests;
            let failed = 0,
                errors = 0,
                skipped = 0;
            let suitePrinted = false;
            gRun += nb;

            for (let j = 0; j < nb; j++) {
                let filterName = aSuite.title + '.' + aSuite.getTestDescription(j);
                if (this._filters.length > 0) {
                    let runTest = false;
                    for (let filter in this._filters) {
                        if (filterName.match(this._filters[filter])) {
                            runTest = true;
                            break;
                        }
                    }
                    if (!runTest) {
                        skipped++;
                        continue;
                    }
                }

                if (this._negativeFilters.length > 0) {
                    let runTest = true;
                    for (let filter in this._negativeFilters) {
                        if (filterName.match(this._negativeFilters[filter])) {
                            runTest = false;
                            break;
                        }
                    }
                    if (!runTest) {
                        skipped++;
                        continue;
                    }
                }

                if (!suitePrinted) {
                    let suiteTitle = 'Running suite ' + aSuite.title;
                    print(suiteTitle);
                    print(this._createSep(suiteTitle.length));
                    suitePrinted = true;
                }

                let test = aSuite.getTestDescription(j);
                let stack = '';

                try {
                    aSuite.setup();
                    aSuite.getTest(j)();
                    aSuite.teardown();
                    test = ok_prefix + '[   OK   ] ' + test + reset_suffix;
                }
                catch (e) {
                    if (typeof(e.isGjsUnitException) != 'undefined' && e.isGjsUnitException) {
                        stack += '\n' + e.message;
                        stack += '\n' + e.stackTrace;
                        failedTests.push(aSuite.title + '.' + aSuite.getTestDescription(j));
                        failed++;
                        test = error_prefix + '[  FAIL  ] ' + test + reset_suffix;
                    }
                    else {
                        stack += '\n' + e;
                        if (typeof(e.message) != 'undefined') {
                            stack += '\n' + e.message;
                        }
                        stack += '\n' + _parseStackTrace(e);
                        erroredTests.push(aSuite.title + '.' + aSuite.getTestDescription(j));
                        errors++;
                        test = error_prefix + bold_prefix + '[  ERROR ] ' + test + bold_suffix +
                            reset_suffix;
                    }
                    aSuite.teardown();
                }

                print(test);
                if (stack.length > 0) {
                    print(stack);
                }
                if (this.stopOnFail === true) {
                    if ((failed + errors) > 0) {
                        return 1;
                    }
                }
            }

            let passed = nb - failed - errors - skipped;
            let rate = (passed / (nb - skipped) * 100).toPrecision(4);
            gFailed += failed;
            gErrors += errors;
            gSkipped += skipped;

            // Display the results for the suite
            if (nb == skipped) {
                // no tests run
                continue;
            }
            let trace = 'Suite(' + rate + '%) - Run: ' + (nb - skipped) + ' - OK: ' + passed +
                ' - Failed: ' + failed + ' - Errors: ' + errors;
            let sep = this._createSep(trace.length);
            if (failed > 0) {
                trace = error_prefix + trace + reset_suffix;
            }
            if (errors > 0) {
                trace = bold_prefix + error_prefix + trace + reset_suffix + bold_suffix;
            }
            print(sep);
            print(trace);
            print(sep);
        }

        // Output global results
        let gPassed = gRun - gFailed - gErrors - gSkipped;
        if (gRun == gSkipped) {
            // no tests run
            print('No tests run');
            return 0;
        }
        let gRate = (gPassed / (gRun - gSkipped) * 100).toPrecision(4);
        let trace = 'GLOBAL(' + gRate + '%) - Suites: ' + nbSuites + ' - Tests: ' + (gRun - gSkipped) +
            ' - OK: ' + gPassed + ' - Failed: ' + gFailed + ' - Errors: ' + gErrors;
        let sep = this._createSep(trace.length);
        if (gFailed > 0) {
            trace = error_prefix + trace + reset_suffix;
        }
        if (gErrors > 0) {
            trace = bold_prefix + error_prefix + trace + reset_suffix + bold_suffix;
        }
        print(sep);
        print(trace);
        print(sep);

        if (gFailed > 0) {
            let title = 'Failed tests: ';
            print(title);
            print(this._createSep(title.length));
            for (let i in failedTests) {
                if (failedTests.hasOwnProperty(i)) {
                    print(error_prefix + failedTests[i] + reset_suffix);
                }
            }
            print('\n');
        }

        if (gErrors > 0) {
            let title = 'Tests with errors: ';
            print(title);
            print(this._createSep(title.length));
            for (let i in erroredTests) {
                if (erroredTests.hasOwnProperty(i)) {
                    print(error_prefix + bold_prefix + erroredTests[i] + bold_suffix + reset_suffix);
                }
            }
            print('\n');
        }
        if ((gErrors + gFailed) > 0) {
            return 1;
        }
        return 0;
    },

    _createSep: function(length) {
        let sep = new Array(length);
        for (let i = 0; i < length; i++) {
            sep[i] = '-';
        }

        return sep.join('');
    }
});

// The runner is a singleton, use only this instance.
var instance = new Runner();
