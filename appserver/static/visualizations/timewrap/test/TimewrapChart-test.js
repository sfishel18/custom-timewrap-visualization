import { assert } from 'chai';
import { shallow } from 'enzyme';
import range from 'lodash/range';
import { XYPlot, LineSeries, DiscreteColorLegend } from 'react-vis';
import React from 'react';
import TimewrapChart from '../src/TimewrapChart';
import generateTimeSeries from './generate-time-series';

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
                timeSeries={timeSeries}
                dataSeries={[range(timeSeries.length)]}
                dataFields={['count']}
                colors={colors}
                width={600}
                height={400}
            />
        );
        const xyPlot = wrapper.find(XYPlot);
        assert.equal(xyPlot.length, 1, 'one XYPlot node');

        const expectedData = [
            [
                { x: ':00', y: undefined },
                { x: ':15', y: 0 },
                { x: ':30', y: 1 },
                { x: ':45', y: 2 },
            ],
            [
                { x: ':00', y: 3 },
                { x: ':15', y: 4 },
                { x: ':30', y: 5 },
                { x: ':45', y: 6 },
            ],
            [
                { x: ':00', y: 7 },
                { x: ':15', y: 8 },
                { x: ':30', y: 9 },
                { x: ':45', y: 10 },
            ],
            [
                { x: ':00', y: 11 },
                { x: ':15', y: 12 },
                { x: ':30', y: 13 },
                { x: ':45', y: 14 },
            ],
            [
                { x: ':00', y: 15 },
                { x: ':15', y: undefined },
                { x: ':30', y: undefined },
                { x: ':45', y: undefined },
            ],
        ];
        const lines = xyPlot.find(LineSeries);
        assert.equal(lines.length, expectedData.length, 'correct number of Line nodes');
        expectedData.forEach((name, i) => {
            assert.deepEqual(
                lines.at(i).prop('data'),
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
});