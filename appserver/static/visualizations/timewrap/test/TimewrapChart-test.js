import { assert } from 'chai';
import { shallow } from 'enzyme';
import range from 'lodash/range';
import { LineChart, XAxis, Line } from 'recharts';
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
        const wrapper = shallow(
            <TimewrapChart
                timeSeries={timeSeries}
                dataSeries={[range(timeSeries.length)]}
                dataFields={['count']}
                colors={['#ff0000', '#00ff00', '#0000ff']}
            />
        );
        const lineChart = wrapper.find(LineChart);
        assert.equal(lineChart.length, 1, 'one LineChart node');
        const expectedData = [
            {
                label: ':00',
                '12:00 AM - 1:00 AM': 3,
                '1:00 AM - 2:00 AM': 7,
                '2:00 AM - 3:00 AM': 11,
                '3:00 AM - 4:00 AM': 15,
            },
            {
                label: ':15',
                '11:00 PM - 12:00 AM': 0,
                '12:00 AM - 1:00 AM': 4,
                '1:00 AM - 2:00 AM': 8,
                '2:00 AM - 3:00 AM': 12,
            },
            {
                label: ':30',
                '11:00 PM - 12:00 AM': 1,
                '12:00 AM - 1:00 AM': 5,
                '1:00 AM - 2:00 AM': 9,
                '2:00 AM - 3:00 AM': 13,
            },
            {
                label: ':45',
                '11:00 PM - 12:00 AM': 2,
                '12:00 AM - 1:00 AM': 6,
                '1:00 AM - 2:00 AM': 10,
                '2:00 AM - 3:00 AM': 14,
            },
        ];
        assert.deepEqual(lineChart.prop('data'), expectedData, 'correct data passed to LineChart');

        const xAxis = lineChart.find(XAxis);
        assert.equal(xAxis.length, 1, 'one XAxis node');
        assert.equal(xAxis.prop('dataKey'), 'label', 'correct data key passed to XAxis');

        const expectedSeriesNames = [
            '11:00 PM - 12:00 AM',
            '12:00 AM - 1:00 AM',
            '1:00 AM - 2:00 AM',
            '2:00 AM - 3:00 AM',
            '3:00 AM - 4:00 AM',
        ];
        const lines = lineChart.find(Line);
        assert.equal(lines.length, expectedSeriesNames.length, 'correct number of Line nodes');
        expectedSeriesNames.forEach((name, i) => {
            assert.equal(
                lines.at(i).prop('dataKey'),
                expectedSeriesNames[i],
                `line #${i + 1} has correct dataKey`
            );
        });
    });
});