const _ = require('lodash');
const vrtUtils = require('./vrt-utils');

suite('Visual Regression Tests - Basic Rendering', () => {
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

    test('Rendering seven series, 8 hours between points', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries(
                    '1981-08-18 00:00:00',
                    21,
                    8 * 60 * 60
                ),
                dataSeries: ${JSON.stringify([_.range(21)])},
                dataFields: ['count']
            })
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('seven-series-8-hours')
        );
    });

    test('Rendering four series, 1 day between points', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-16 00:00:00', 25, 1, 'day'),
                dataSeries: ${JSON.stringify([_.range(25)])},
                dataFields: ['count']
            })
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('four-series-1-day')
        );
    });

    test('Rendering six series, 7 days between points', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 00:00:00', 24, 7, 'day'),
                dataSeries: ${JSON.stringify([_.range(24)])},
                dataFields: ['count']
            })
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('six-series-7-day')
        );
    });

    test('Rendering six series, 4 months between points', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries(
                    '1981-01-01 00:00:00',
                    15,
                    4,
                    'month'
                ),
                dataSeries: ${JSON.stringify([_.range(15)])},
                dataFields: ['count']
            })
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('six-series-4-months')
        );
    });

    test('Rendering long y-axis labels', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries(
                    '1981-01-01 00:00:00',
                    15,
                    4,
                    'month'
                ),
                dataSeries: ${JSON.stringify([_.range(15).map(y => y * 10000)])},
                dataFields: ['count']
            })
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('long-y-axis-labels')
        );
    });
});