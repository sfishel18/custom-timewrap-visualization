const path = require('path');
const webdriver = require('selenium-webdriver');
const assert = require('chai').assert;
const resemble = require('node-resemble-js');
const fs = require('fs');
const rimraf = require('rimraf');
const _ = require('lodash');

const BASELINES_DIR = path.resolve(__dirname, '..', 'baselines');
const FAILURES_DIR = path.resolve(__dirname, '..', 'failures');

const INDEX_PAGE_URL = 'file:///vrt/index.html';

const DIFF_THRESHOLD = process.env.IS_CI ? 0.05 : 0;

const cleanFailuresDirectory = _.once(() => {
    if (fs.existsSync(FAILURES_DIR)) {
        rimraf.sync(FAILURES_DIR);
    }
    fs.mkdirSync(FAILURES_DIR);
});

const createBrowser = browserName =>
    new webdriver.Builder()
        .usingServer('http://localhost:4444/wd/hub')
        .withCapabilities({ browserName }).build();

const assertScreenshotMatch = filename =>
    (screenshotData) => {
        const baselinePath = path.resolve(BASELINES_DIR, `${filename}.png`);
        if (!fs.existsSync(baselinePath)) {
            fs.writeFileSync(
                baselinePath,
                screenshotData.replace(/^data:image\/png;base64,/, ''),
                'base64'
            );
            assert.ok(true, `created new baseline: ${filename}.png`);
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            resemble(fs.readFileSync(baselinePath))
                .compareTo(new Buffer(screenshotData, 'base64'))
                .ignoreAntialiasing()
                .onComplete((data) => {
                    const misMatchPercentage = Number(data.misMatchPercentage);
                    if (misMatchPercentage <= DIFF_THRESHOLD) {
                        assert.ok(true);
                    } else {
                        fs.writeFileSync(
                            path.resolve(FAILURES_DIR, `${filename}.png`),
                            screenshotData.replace(/^data:image\/png;base64,/, ''),
                            'base64'
                        );
                        data.getDiffImage().pack().pipe(
                            fs.createWriteStream(path.resolve(FAILURES_DIR, `${filename}.diff.png`))
                        );
                        assert.isAtMost(
                            misMatchPercentage,
                            DIFF_THRESHOLD,
                            'screenshot mismatch above threshold'
                        );
                    }
                    resolve();
                });
        });
    };

const suiteSetup = () => {
    cleanFailuresDirectory();
};

const suiteTeardown = () => {};

module.exports = {
    INDEX_PAGE_URL,
    createBrowser,
    assertScreenshotMatch,
    suiteSetup,
    suiteTeardown,
};