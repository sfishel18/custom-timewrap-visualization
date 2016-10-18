import { assert } from 'chai';
import { shallow } from 'enzyme';
import moment from 'moment';
import range from 'lodash/range';
import pick from 'lodash/pick';
import { XYPlot, LineMarkSeries, DiscreteColorLegend, Hint } from 'react-vis';
import React from 'react';
import TimewrapChart from '../../src/charting/TimewrapChart';
import generateTimeSeries from '../generate-time-series';

suite('TimewrapChart', () => {
    test('renders empty with no data', () => {
        const wrapper = shallow(
            <TimewrapChart timeSeries={[]} dataSeries={[]} dataFields={[]} colors={[]} />
        );
        assert.equal(wrapper.html(), null);
    });
    test('renders correctly with three series', () => {
        const timeSeries = generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60);
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        const wrapper = shallow(
            <TimewrapChart
                timeSeries={timeSeries.map(m => m.toDate())}
                dataSeries={[range(timeSeries.length)]}
                dataFields={['count']}
                colors={colors}
                width={600}
                height={400}
            />
        );
        const xyPlot = wrapper.find(XYPlot);
        assert.equal(xyPlot.length, 1, 'one XYPlot node');
        assert.deepEqual(
            xyPlot.prop('xDomain'),
            [0, 1, 2, 3],
            'x-axis domain is correct'
        );

        const expectedData = [
            [
                { label: ':15', y: 0, x: 1 },
                { label: ':30', y: 1, x: 2 },
                { label: ':45', y: 2, x: 3 },
            ],
            [
                { label: ':00', y: 3, x: 0 },
                { label: ':15', y: 4, x: 1 },
                { label: ':30', y: 5, x: 2 },
                { label: ':45', y: 6, x: 3 },
            ],
            [
                { label: ':00', y: 7, x: 0 },
                { label: ':15', y: 8, x: 1 },
                { label: ':30', y: 9, x: 2 },
                { label: ':45', y: 10, x: 3 },
            ],
            [
                { label: ':00', y: 11, x: 0 },
                { label: ':15', y: 12, x: 1 },
                { label: ':30', y: 13, x: 2 },
                { label: ':45', y: 14, x: 3 },
            ],
            [
                { label: ':00', y: 15, x: 0 },
            ],
        ];
        const lines = xyPlot.find(LineMarkSeries);
        assert.equal(lines.length, expectedData.length, 'correct number of Line nodes');
        expectedData.forEach((name, i) => {
            assert.deepEqual(
                lines.at(i).prop('data').map(point => pick(point, 'x', 'y', 'label')),
                expectedData[i],
                `line #${i + 1} has correct data`
            );
            assert.equal(lines.at(i).prop('color'), colors[i], `line #${i + 1} has correct color`);
        });

        const expectedLegendItems = [
            { title: '11:00 PM - 12:00 AM', color: colors[0] },
            { title: '12:00 AM - 1:00 AM', color: colors[1] },
            { title: '1:00 AM - 2:00 AM', color: colors[2] },
            { title: '2:00 AM - 3:00 AM', color: colors[3] },
            { title: '3:00 AM - 4:00 AM', color: colors[4] },
        ];
        const legend = wrapper.find(DiscreteColorLegend);
        assert.deepEqual(legend.prop('items'), expectedLegendItems, 'legend items are correct');
    });
    test('shows hints correctly', () => {
        const timeSeries = generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60);
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        const wrapper = shallow(
            <TimewrapChart
                timeSeries={timeSeries.map(m => m.toDate())}
                dataSeries={[range(timeSeries.length)]}
                dataFields={['count']}
                colors={colors}
                width={600}
                height={400}
            />
        );

        assert.equal(wrapper.find(Hint).length, 0, 'no hint present initially');

        const secondSeries = wrapper.find(LineMarkSeries).at(1);

        // simulating a mouse over on the third point in the second series
        secondSeries.prop('onValueMouseOver')({ seriesIndex: 1, pointIndex: 2 });
        assert.deepEqual(wrapper.state('hintCoordinates'), [1, 2]);
        // forcing the state transition from above to go through
        wrapper.setState({ hintCoordinates: [1, 2] });
        const hint = wrapper.find(Hint);
        assert.equal(hint.length, 1, 'one hint present');
        assert.deepEqual(
            pick(hint.at(0).prop('value'), 'x', 'y', 'label'),
            { label: ':30', y: 5, x: 2 },
            'correct value passed to hint'
        );

        // simulating a mouse out on the third point in the second series
        secondSeries.prop('onValueMouseOut')();
        assert.equal(wrapper.state('hintCoordinates'), null);
        // forcing the state transition from above to go through
        wrapper.setState({ hintCoordinates: null });
        assert.equal(wrapper.find(Hint).length, 0, 'no hint present');
    });
    test('shows hint correctly for incomplete series', () => {
        const timeSeries = generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60);
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        const wrapper = shallow(
            <TimewrapChart
                timeSeries={timeSeries.map(m => m.toDate())}
                dataSeries={[range(timeSeries.length)]}
                dataFields={['count']}
                colors={colors}
                width={600}
                height={400}
            />
        );
        const lastSeries = wrapper.find(LineMarkSeries).at(4);
        // simulating a mouse over on the first point in the last series
        lastSeries.prop('onValueMouseOver')({ seriesIndex: 4, pointIndex: 0 });
        assert.deepEqual(wrapper.state('hintCoordinates'), [4, 0]);
        // forcing the state transition from above to go through
        wrapper.setState({ hintCoordinates: [4, 0] });
        const hint = wrapper.find(Hint);
        assert.equal(hint.length, 1, 'one hint present');
        assert.deepEqual(
            pick(hint.at(0).prop('value'), 'x', 'y', 'label'),
            { label: ':00', y: 15, x: 0 },
            'correct value passed to hint'
        );
    });
    test('onPointSelect callback', () => {
        const timeSeries = generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60);
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        let selectionInfo = null;
        const onPointSelect = (info) => {
            selectionInfo = info;
        };
        const wrapper = shallow(
            <TimewrapChart
                timeSeries={timeSeries.map(m => m.toDate())}
                dataSeries={[range(timeSeries.length)]}
                dataFields={['count']}
                colors={colors}
                width={600}
                height={400}
                onPointSelect={onPointSelect}
            />
        );

        assert.equal(selectionInfo, null, 'onPointSelect not called on initial render');

        const secondSeries = wrapper.find(LineMarkSeries).at(1);
        // simulating a click on the second point of the second series
        secondSeries.prop('onValueClick')({ seriesIndex: 1, pointIndex: 2 }, {});
        assert.equal(selectionInfo.count, 5, 'field name/value of selection is correct');
        assert.equal(
            moment(selectionInfo.date).format('YYYY-MM-DD HH:mm:ss'),
            '1981-08-19 00:30:00',
            'date of selection is correct'
        );
    });
    test('includes zero when all points are positive', () => {
        const timeSeries = generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60);
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        const wrapper = shallow(
            <TimewrapChart
                timeSeries={timeSeries.map(m => m.toDate())}
                dataSeries={[range(timeSeries.length).map(y => y + 100)]}
                dataFields={['count']}
                colors={colors}
                width={600}
                height={400}
            />
        );
        const xyPlot = wrapper.find(XYPlot);
        assert.deepEqual(xyPlot.prop('yDomain'), [0, 115],
            'y domain extended to include 0 as min');
    });
    test('includes zero when all points are negative', () => {
        const timeSeries = generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60);
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        const wrapper = shallow(
            <TimewrapChart
                timeSeries={timeSeries.map(m => m.toDate())}
                dataSeries={[range(timeSeries.length).map(y => y - 100)]}
                dataFields={['count']}
                colors={colors}
                width={600}
                height={400}
            />
        );
        const xyPlot = wrapper.find(XYPlot);
        assert.deepEqual(xyPlot.prop('yDomain'), [-100, 0],
            'y domain extended to include 0 as max');
    });
});