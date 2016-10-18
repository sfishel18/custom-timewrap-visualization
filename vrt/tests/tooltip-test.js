const _ = require('lodash');
const vrtUtils = require('./vrt-utils');

suite('Visual Regression Tests - Tooltips', () => {
    suiteSetup(function () {
        vrtUtils.suiteSetup.call(this);
        this.browser = vrtUtils.createBrowser('chrome');
        return this.browser.get(vrtUtils.INDEX_PAGE_URL);
    });

    suiteTeardown(function () {
        vrtUtils.suiteTeardown.call(this);
        return this.browser.quit();
    });

    test('Showing the tooltip', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60),
                dataSeries: ${JSON.stringify([_.range(16)])},
                dataFields: ['count']
            })
        `);
        this.browser.executeScript(`
            window.harness.simulateHover(1, 3)
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('tooltip-showing')
        );
    });

    test('Showing the tooltip, custom label format', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60),
                dataSeries: ${JSON.stringify([_.range(16)])},
                dataFields: ['count'],
                tooltipFormat: 'MM/DD/YY h:mm:ss'
            })
        `);
        this.browser.executeScript(`
            window.harness.simulateHover(1, 3)
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('tooltip-showing-custom-format')
        );
    });

    test('Showing the tooltip, then hiding it', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60),
                dataSeries: ${JSON.stringify([_.range(16)])},
                dataFields: ['count']
            })
        `);
        this.browser.executeScript(`
            window.harness.simulateHover(1, 3)
        `);
        this.browser.executeScript(`
            window.harness.simulateHoverEnd()
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('tooltip-shown-hidden')
        );
    });

    test('Showing the tooltip, then hiding it, then showing it on a different point', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60),
                dataSeries: ${JSON.stringify([_.range(16)])},
                dataFields: ['count']
            })
        `);
        this.browser.executeScript(`
            window.harness.simulateHover(1, 3)
        `);
        this.browser.executeScript(`
            window.harness.simulateHoverEnd()
        `);
        this.browser.executeScript(`
            window.harness.simulateHover(3, 0)
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('tooltip-shown-hidden-showing')
        );
    });
});