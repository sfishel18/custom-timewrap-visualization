import React from 'react';
import ReactDom from 'react-dom';
import range from 'lodash/range';
import TimewrapChart from '../src/charting/TimewrapChart';
import generateTimeSeries from '../test/generate-time-series';

const timeSeries = generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60);
const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ffffff'];
ReactDom.render(
    <TimewrapChart
        timeSeries={timeSeries}
        dataSeries={[range(timeSeries.length)]}
        dataFields={['count']}
        colors={colors}
        width={1000}
        height={500}
    />,
    document.getElementById('container')
);