const _ = require('lodash');
const vrtUtils = require('./vrt-utils');

suite('Visual Regression Tests - Custom Configuration Options', () => {
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

    test('Rendering six series, 7 days between points, custom label formats', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 00:00:00', 24, 7, 'day'),
                dataSeries: ${JSON.stringify(_.range(24))},
                dataField: 'count',
                axisLabelFormat: 'dd',
                legendFormat: 'MMMM'
            })
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('six-series-7-day-custom-label')
        );
    });

    test('Rendering six series, 7 days between points, markers enabled', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 00:00:00', 24, 7, 'day'),
                dataSeries: ${JSON.stringify(_.range(24))},
                dataField: 'count',
                pointMarkers: 'on'
            })
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('six-series-7-day-with-markers')
        );
    });

    test('Rendering six series, 7 days between points, legend bottom-aligned', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 00:00:00', 24, 7, 'day'),
                dataSeries: ${JSON.stringify(_.range(24))},
                dataField: 'count',
                legendPlacement: 'bottom'
            })
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('six-series-7-day-legend-bottom')
        );
    });

    test('Rendering six series, 7 days between points, legend hidden', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 00:00:00', 24, 7, 'day'),
                dataSeries: ${JSON.stringify(_.range(24))},
                dataField: 'count',
                legendPlacement: 'none'
            })
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('six-series-7-day-legend-hidden')
        );
    });

    test('Rendering six series, 7 days between points, with axis label rotation', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 00:00:00', 24, 7, 'day'),
                dataSeries: ${JSON.stringify(_.range(24))},
                dataField: 'count',
                xLabelRotation: 'on'
            })
        `);
        return this.browser.takeScreenshot().then(
            vrtUtils.assertScreenshotMatch('six-series-7-day-label-rotation')
        );
    });

    test('Showing the tooltip, custom label format', function () {
        this.browser.executeScript(`
            window.harness.setProperties({
                timeSeries: window.Harness.generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60),
                dataSeries: ${JSON.stringify(_.range(16))},
                dataField: 'count',
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
});