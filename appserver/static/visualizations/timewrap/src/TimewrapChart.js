import React, { Component, PropTypes } from 'react';
import {
    XYPlot,
    HorizontalGridLines,
    LineMarkSeries,
    XAxis,
    YAxis,
    DiscreteColorLegend,
    Hint,
} from 'react-vis';
import property from 'lodash/property';
import isUndefined from 'lodash/isUndefined';
import { processData, computeSeriesNames } from './format-data';
import './TimewrapChart.css';

const LEGEND_WIDTH = 150;

const dataPointToVizValue = (point, seriesIndex, pointIndex) => ({
    x: point.label,
    y: point.fieldValue,
    date: point.date,
    fieldName: point.fieldName,
    seriesIndex,
    pointIndex,
});

class TimewrapChart extends Component {

    constructor() {
        super();
        this.onValueMouseOver = this.onValueMouseOver.bind(this);
        this.onValueMouseOut = this.onValueMouseOut.bind(this);
        this.state = { data: [], seriesNames: [], hintCoordinates: null };
    }

    componentWillMount() {
        this.setStateFromProps(this.props);
    }

    componentWillReceiveProps(nextProps) {
        this.setStateFromProps(nextProps);
    }

    onValueMouseOver(value) {
        this.setState({ hintCoordinates: [value.seriesIndex, value.pointIndex] });
    }

    onValueMouseOut() {
        this.setState({ hintCoordinates: null });
    }

    setStateFromProps(props) {
        const { timeSeries, dataSeries, dataFields } = props;
        if (!timeSeries || timeSeries.length === 0) {
            this.setState({ data: [], seriesNames: [] });
            return;
        }
        const data = processData(timeSeries, dataSeries[0], dataFields[0]);
        const seriesNames = computeSeriesNames(data);
        this.setState({ data, seriesNames });
    }

    renderHint(value) {
        const { date, fieldName, y } = value;
        return (<Hint value={value}>
            <div className="timewrap-tooltip">
                <div>{date.format('MMM Do, YYYY h:mm A')}</div>
                <div>
                    <span>{fieldName}:</span>
                    <span style={{ float: 'right' }}>{y}</span>
                </div>
            </div>
        </Hint>);
    }

    render() {
        const { colors, width, height } = this.props;
        const { data, seriesNames, hintCoordinates } = this.state;
        if (data.length === 0) {
            return null;
        }
        const xAxisLabels = data[0].map(property('label'));
        const seriesData = data.map((partition, i) =>
            partition.map((point, j) => dataPointToVizValue(point, i, j))
            .filter(point => !isUndefined(point.y))
        );
        const legendItems = seriesNames.map((name, i) => ({
            title: name,
            color: colors[i % colors.length],
        }));
        let hintValue = null;
        if (hintCoordinates) {
            const [hintSeriesIndex, hintPointIndex] = hintCoordinates;
            const hintDataPoint = data[hintSeriesIndex][hintPointIndex];
            hintValue = dataPointToVizValue(hintDataPoint, hintSeriesIndex, hintPointIndex);
        }

        return (<div className="custom-timewrap-visualization">
            <div style={{ float: 'left' }}>
                <XYPlot
                    width={width - LEGEND_WIDTH}
                    height={height}
                    xType="ordinal"
                    xDomain={xAxisLabels}
                >
                    <HorizontalGridLines />
                    <XAxis />
                    <YAxis />
                    {seriesData.map((points, i) =>
                        <LineMarkSeries
                            key={i}
                            data={points}
                            color={colors[i % colors.length]}
                            size={3}
                            onValueMouseOver={this.onValueMouseOver}
                            onValueMouseOut={this.onValueMouseOut}
                        />
                    )}
                    {hintValue ? this.renderHint(hintValue) : null}
                </XYPlot>
            </div>
            <DiscreteColorLegend items={legendItems} width={LEGEND_WIDTH} />
        </div>);
    }
}

TimewrapChart.propTypes = {
    timeSeries: PropTypes.array,
    dataSeries: PropTypes.array,
    dataFields: PropTypes.array,
    colors: PropTypes.array,
    width: PropTypes.number,
    height: PropTypes.number,
};

export default TimewrapChart;