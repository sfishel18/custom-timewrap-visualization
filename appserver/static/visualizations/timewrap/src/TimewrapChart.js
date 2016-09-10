import React, { PropTypes } from 'react';
import {
    XYPlot,
    HorizontalGridLines,
    LineSeries,
    XAxis,
    YAxis,
    DiscreteColorLegend,
} from 'react-vis';
import { processData, computeSeriesNames } from './format-data';

const LEGEND_WIDTH = 150;

const TimewrapChart = props => {
    const { timeSeries, dataSeries, dataFields, colors, width, height } = props;
    if (!timeSeries || timeSeries.length === 0) {
        return null;
    }
    const rawData = processData(timeSeries, dataSeries[0], dataFields[0]);
    const seriesNames = computeSeriesNames(rawData);
    const data = rawData.map(partition =>
        partition.map(point => ({
            y: point.fieldValue,
            x: point.label,
        }))
    );
    const legendItems = seriesNames.map((name, i) => ({
        title: name,
        color: colors[i % colors.length],
    }));

    return (<div>
        <div style={{ float: 'left' }}>
            <XYPlot width={width - LEGEND_WIDTH} height={height} xType="ordinal">
                <HorizontalGridLines />
                <XAxis />
                <YAxis />
                {data.map((seriesData, i) =>
                    <LineSeries key={i} data={seriesData} color={colors[i % colors.length]} />
                )}
            </XYPlot>
        </div>
        <DiscreteColorLegend items={legendItems} width={LEGEND_WIDTH} height={height} />
    </div>);
};

TimewrapChart.propTypes = {
    timeSeries: PropTypes.array,
    dataSeries: PropTypes.array,
    dataFields: PropTypes.array,
    colors: PropTypes.array,
    width: PropTypes.number,
    height: PropTypes.number,
};

export default TimewrapChart;