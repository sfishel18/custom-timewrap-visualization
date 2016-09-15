const _ = require('lodash');
const vrtUtils = require('./vrt-utils');

suite('Visual Regression Tests', () => {
    suiteSetup(function () {
        vrtUtils.suiteSetup.call(this);
        this.browser = vrtUtils.createBrowser('chrome');
        return this.browser.get(vrtUtils.INDEX_PAGE_URL);
    });

    suiteTeardown(function () {
        vrtUtils.suiteTeardown.call(this);
        return this.browser.quit();
    });

    test('Rendering five series, 15 minutes between points', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60),
                dataSeries: ${JSON.stringify([_.range(16)])},
                dataFields: ['count']
            })
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('five-series-15-min')
        );
    });
});