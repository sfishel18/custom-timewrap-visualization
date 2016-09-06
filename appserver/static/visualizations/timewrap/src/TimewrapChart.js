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
import { processData, computeSeriesNames } from './format-data';

const TimewrapChart = props => {
    const { timeSeries, dataSeries, dataFields, colors } = props;
    if (!timeSeries || timeSeries.length === 0) {
        return null;
    }
    const rawData = processData(timeSeries, dataSeries[0], dataFields[0]);
    const seriesNames = computeSeriesNames(rawData);
    const data = rawData[0].map(({ label }) => ({ label }));
    rawData.forEach((group, i) => {
        group.forEach((point, j) => {
            if ({}.hasOwnProperty.call(point, 'fieldValue')) {
                data[j][seriesNames[i]] = point.fieldValue;
            }
        });
    });
    const lineProps = {
        isAnimationActive: false,
        dot: true,
    };
    const legendProps = {
        align: 'right',
        layout: 'vertical',
        verticalAlign: 'middle',
        wrapperStyle: { right: -5 },
    };

    return (<ResponsiveContainer>
        <LineChart data={data} >
            <XAxis dataKey="label" />
            <YAxis />
            <CartesianGrid vertical={false} />
            <Legend {...legendProps} />
            {seriesNames.map((seriesName, i) =>
                <Line
                    key={seriesName}
                    dataKey={seriesName}
                    stroke={colors[i % colors.length]}
                    {...lineProps}
                />
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