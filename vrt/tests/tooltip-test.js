const _ = require('lodash');
const vrtUtils = require('./vrt-utils');

suite('Visual Regression Tests - Tooltips', function () {
    this.retries(2);

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

    test('Showing the tooltip', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60),
                dataSeries: ${JSON.stringify(_.range(16))},
                dataField: 'count'
            })
        `);
        this.browser.executeScript(`
            window.harness.simulateHover(1, 3)
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('tooltip-showing')
        );
    });

    test('Showing the tooltip, then hiding it', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60),
                dataSeries: ${JSON.stringify(_.range(16))},
                dataField: 'count'
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
        if (process.env.IS_CI) {
            return this.skip();
        }
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60),
                dataSeries: ${JSON.stringify(_.range(16))},
                dataField: 'count'
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

    test('Tooltip pops left when there\'s no room to the right', function () {
        if (process.env.IS_CI) {
            return this.skip();
        }
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60),
                dataSeries: ${JSON.stringify(_.range(16))},
                dataField: 'count',
                legendPlacement: 'none'
            })
        `);
        this.browser.executeScript(`
            window.harness.simulateHover(1, 3)
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('tooltip-popping-left')
        );
    });

    test('Tooltip on single-point series', function () {
        if (process.env.IS_CI) {
            return this.skip();
        }
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60),
                dataSeries: ${JSON.stringify(_.range(16))},
                dataField: 'count'
            })
        `);
        this.browser.executeScript(`
            window.harness.simulateHover(4, 0)
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('tooltip-single-point-series')
        );
    });
});