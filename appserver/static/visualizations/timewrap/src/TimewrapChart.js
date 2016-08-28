import React, { PropTypes } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
} from 'recharts';
import wrapData from './wrap-data';

const wrapTimeSeries = timeSeries => {
    return {
        labels: [':00', ':10', ':20', ':30', ':40', ':50'],
        seriesNames: ['10 AM - 11 AM', '11 AM - 12 PM', '12 PM - 1 PM', '1 PM - 2 PM'],
    };
};

const TimewrapChart = props => {
    const { timeSeries, dataSeries, colors } = props;
    // const wrapped = wrapData(timeSeries, dataSeries, props.dataFields[0]);
    // console.log(wrapped);
    const { labels, seriesNames } = wrapTimeSeries(timeSeries);
    const data = labels.map((label, i) => {
        const dataPoint = { label };
        seriesNames.forEach((seriesName, j) => {
            const computedIndex = (j * seriesNames.length) + i;
            dataPoint[seriesName] = dataSeries[0][computedIndex];
        });
        return dataPoint;
    });
    const lineProps = {
        isAnimationActive: false,
        dot: false,
    };

    return (<ResponsiveContainer>
        <LineChart data={data} >
            <XAxis dataKey="label" />
            <YAxis />
            <CartesianGrid vertical={false} />
            <Legend align="right" dataKey="seriesName" layout="vertical" verticalAlign="middle" />
            {seriesNames.map((seriesName, i) =>
                <Line dataKey={seriesName} {...lineProps} stroke={colors[i % colors.length]} />
            )}
        </LineChart>
    </ResponsiveContainer>);
};

TimewrapChart.propTypes = {
    timeSeries: PropTypes.array,
    dataSeries: PropTypes.array,
    dataFields: PropTypes.array,
    colors: PropTypes.array,
};

export default TimewrapChart;