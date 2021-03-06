/* eslint "import/no-extraneous-dependencies": ["error", {"devDependencies": true}] */
import { Plots } from 'plottable';
import TimewrapChart from '../../src/charting/TimewrapChart';
import { processData, decorateWithLabels, computeSeriesNames } from '../../src/format-data';
import generateTimeSeries from '../../test/generate-time-series';

const DEFAULT_COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];

TimewrapChart.useSynchronousUpdates();

export default class TimewrapChartHarness {

    static generateTimeSeries(...args) {
        return generateTimeSeries(...args);
    }

    constructor(el) {
        this.el = el;
        this.chart = new TimewrapChart(this.el, DEFAULT_COLORS);
    }

    setProperties({
        timeSeries,
        dataSeries,
        dataField,
        axisLabelFormat = null,
        legendFormat = null,
        tooltipFormat = null,
        pointMarkers = 'off',
        legendPlacement = 'right',
        xLabelRotation = 'off',
    }) {
        let vizData = processData(timeSeries, dataSeries, dataField);
        vizData = decorateWithLabels(vizData, axisLabelFormat);
        const seriesNames = computeSeriesNames(vizData, legendFormat);
        const config = { tooltipFormat, pointMarkers, legendPlacement, xLabelRotation };
        this.chart.update(vizData, config, seriesNames);
    }

    reset() {
        this.chart.remove();
        this.chart = new TimewrapChart(this.el, DEFAULT_COLORS);
    }

    simulateHover(seriesIndex, pointIndex) {
        const group = this.chart.chart.componentAt(0, 1);
        const plots = group.components().filter(c =>
            (c instanceof Plots.Line || c instanceof Plots.Scatter),
        );
        const point = plots[seriesIndex].entities()[pointIndex];
        this.chart.tooltip.pointerMoveCallback(point.position);
    }

    simulateHoverEnd() {
        this.chart.tooltip.pointerExitCallback();
    }

}