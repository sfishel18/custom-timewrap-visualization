/* eslint "import/no-extraneous-dependencies": ["error", {"devDependencies": true}] */
import React from 'react';
import ReactDom from 'react-dom';
import TimewrapChart from '../../src/charting/TimewrapChart';
import generateTimeSeries from '../../test/generate-time-series';

const DEFAULT_COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
const DEFAULT_WIDTH = 1000;
const DEFAULT_HEIGHT = 500;

export default class TimewrapChartHarness {

    static generateTimeSeries(...args) {
        return generateTimeSeries(...args);
    }

    constructor(el) {
        this.el = el;
    }

    setProperties({
        timeSeries,
        dataSeries,
        dataFields,
        colors = DEFAULT_COLORS,
        width = DEFAULT_WIDTH,
        height = DEFAULT_HEIGHT,
        axisLabelFormat = null,
        legendFormat = null,
        tooltipFormat = null,
    }) {
        this.reactTree = ReactDom.render(
            <TimewrapChart
                timeSeries={timeSeries}
                dataSeries={dataSeries}
                dataFields={dataFields}
                colors={colors}
                width={width}
                height={height}
                axisLabelFormat={axisLabelFormat}
                legendFormat={legendFormat}
                tooltipFormat={tooltipFormat}
            />,
            this.el
        );
    }

    simulateHover(seriesIndex, pointIndex) {
        this.reactTree.onValueMouseOver({ seriesIndex, pointIndex });
    }

    simulateHoverEnd() {
        this.reactTree.onValueMouseOut();
    }

}