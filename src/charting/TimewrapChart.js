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
import flatten from 'lodash/flatten';
import Tooltip from './Tooltip';
import { processData, computeSeriesNames } from '../format-data';
import './TimewrapChart.css';

const LEGEND_WIDTH = 150;

const dataPointToVizValue = (point, seriesIndex, pointIndex) => ({
    x: pointIndex,
    y: point.fieldValue,
    label: point.label,
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
        this.onValueClick = this.onValueClick.bind(this);
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

    onValueClick(value, info) {
        const { seriesIndex, pointIndex } = value;
        const { date, fieldName, fieldValue } = this.state.data[seriesIndex][pointIndex];
        this.props.onPointSelect(
            { date: date.toDate(), [fieldName]: fieldValue },
            info.event
        );
    }

    setStateFromProps(props) {
        const { timeSeries, dataSeries, dataFields } = props;
        const axisLabelFormat = props.axisLabelFormat || null;
        const legendFormat = props.legendFormat || null;
        if (!timeSeries || timeSeries.length === 0) {
            this.setState({ data: [], seriesNames: [] });
            return;
        }
        const data = processData(timeSeries, dataSeries[0], dataFields[0], axisLabelFormat);
        const seriesNames = computeSeriesNames(data, legendFormat);
        this.setState({ data, seriesNames });
    }

    render() {
        const { colors, width, height, tooltipFormat } = this.props;
        const { data, seriesNames, hintCoordinates } = this.state;
        if (data.length === 0) {
            return null;
        }
        const xAxisLabels = data[0].map((point, i) => i);
        const seriesData = data.map((partition, i) =>
            partition.map((point, j) => dataPointToVizValue(point, i, j))
                .filter(point => !isUndefined(point.y))
        );
        const tickFormat = i => data[0][i].label;
        const flattenedData = flatten(seriesData).map(property('y'));
        const yAxisMin = Math.min(...(flattenedData.concat(0)));
        const yAxisMax = Math.max(...(flattenedData.concat(0)));
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
                    yDomain={[yAxisMin, yAxisMax]}
                    margin={{ left: 80 }}
                >
                    <HorizontalGridLines />
                    <XAxis tickFormat={tickFormat} />
                    <YAxis />
                    {seriesData.map((points, i) =>
                        <LineMarkSeries
                            key={i}
                            data={points}
                            color={colors[i % colors.length]}
                            size={3}
                            onValueMouseOver={this.onValueMouseOver}
                            onValueMouseOut={this.onValueMouseOut}
                            onValueClick={this.onValueClick}
                        />
                    )}
                    {hintValue ?
                        <Hint value={hintValue}>
                            <Tooltip value={hintValue} format={tooltipFormat || null} />
                        </Hint> :
                        null
                    }
                </XYPlot>
            </div>
            <DiscreteColorLegend items={legendItems} width={LEGEND_WIDTH} />
        </div>);
    }
}

TimewrapChart.propTypes = {
    // Eslint is confused by the way props are passed to a helper function.
    /* eslint-disable react/no-unused-prop-types */
    timeSeries: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
    dataSeries: PropTypes.arrayOf(
        PropTypes.arrayOf(PropTypes.number)
    ),
    dataFields: PropTypes.arrayOf(PropTypes.string),
    axisLabelFormat: PropTypes.string,
    legendFormat: PropTypes.string,
    /* eslint-enable react/no-unused-prop-types */
    tooltipFormat: PropTypes.string,
    colors: PropTypes.arrayOf(PropTypes.string),
    width: PropTypes.number,
    height: PropTypes.number,
    onPointSelect: PropTypes.func,
};

TimewrapChart.defaultProps = {
    onPointSelect: () => {},
};

export default TimewrapChart;