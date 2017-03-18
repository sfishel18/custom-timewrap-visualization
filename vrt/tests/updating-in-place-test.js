const _ = require('lodash');
const vrtUtils = require('./vrt-utils');

suite('Visual Regression Tests - Updating In Place', () => {
    suiteSetup(function () {
        vrtUtils.suiteSetup.call(this);
        this.browser = vrtUtils.createBrowser('chrome');
        return this.browser.get(vrtUtils.INDEX_PAGE_URL);
    });

    suiteTeardown(function () {
        vrtUtils.suiteTeardown.call(this);
        return this.browser.quit();
    });

    teardown(function () {
        return this.browser.executeScript('window.harness.reset()');
    });

    test('Minor updates to individual data points', function () {
        const dataSeries = _.range(16);
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60),
                dataSeries: ${JSON.stringify(dataSeries)},
                dataField: 'count'
            })
        `);
        // Changing points in the first and third series
        dataSeries[0] = 10;
        dataSeries[9] = 2;
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60),
                dataSeries: ${JSON.stringify(dataSeries)},
                dataField: 'count'
            })
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('minor-update-in-place')
        );
    });

    test('Major update with new point span', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60),
                dataSeries: ${JSON.stringify(_.range(0, 16, 10))},
                dataField: 'count'
            })
        `);
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries(
                    '1981-01-01 00:00:00',
                    15,
                    4,
                    'month'
                ),
                dataSeries: ${JSON.stringify(_.range(15))},
                dataField: 'count'
            })
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('major-update-in-place')
        );
    });
});