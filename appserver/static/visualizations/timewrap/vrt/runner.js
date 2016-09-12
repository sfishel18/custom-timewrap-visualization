const assert = require('chai').assert;
const webdriver = require('selenium-webdriver');
const resemble = require('node-resemble-js');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

const BASELINES_DIR = path.resolve(__dirname, 'baselines');
const FAILURES_DIR = path.resolve(__dirname, 'failures');

const assertScreenshotMatch = function (filename) {
    return function (screenshotData) {
        if (!fs.existsSync(path.resolve(BASELINES_DIR, filename + '.png'))) {
            fs.writeFileSync(
                path.resolve(BASELINES_DIR, filename + '.png'),
                screenshotData.replace(/^data:image\/png;base64,/, ''),
                'base64'
            );
            assert.ok(true, 'created new baseline: ' + filename + '.png');
            return Promise.resolve();
        }
        return new Promise(function (resolve, reject) {
            resemble(fs.readFileSync(path.resolve(BASELINES_DIR, filename + '.png')))
                .compareTo(new Buffer(screenshotData, 'base64'))
                .ignoreAntialiasing()
                .onComplete(function (data) {
                    if (Number(data.misMatchPercentage) === 0) {
                        assert.ok(true);
                    } else {
                        fs.writeFileSync(
                            path.resolve(FAILURES_DIR, filename + '.png'),
                            screenshotData.replace(/^data:image\/png;base64,/, ''),
                            'base64'
                        );
                        data.getDiffImage().pack().pipe(
                            fs.createWriteStream(path.resolve(FAILURES_DIR, filename + '.diff.png'))
                        );
                        assert.ok(false, 'screenshot mismatch');
                    }
                    resolve();
                });
        });
    };
};

suite('Visual Regression Tests', function () {
    suiteSetup(function () {
        if (fs.existsSync(FAILURES_DIR)) {
            rimraf.sync(FAILURES_DIR);
        }
        fs.mkdirSync(FAILURES_DIR);
    });

    setup(function () {
        this.browser = new webdriver.Builder()
            .withCapabilities({
                browserName: 'chrome',
            }).build();

        return this.browser.get('file://' + path.resolve(__dirname, 'index.html'));
    });

    teardown(function () {
        return this.browser.quit();
    });

    test('Screenshot One', function () {
        return this.browser.takeScreenshot().then(assertScreenshotMatch('shot'));
    });
});