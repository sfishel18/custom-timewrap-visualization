import { assert } from 'chai';
import moment from 'moment';
import range from 'lodash/range';
import extend from 'lodash/extend';
import {
    HOUR,
    SIX_HOUR,
    TWELVE_HOUR,
    DAY,
    WEEK,
    MONTH,
    THREE_MONTH,
    YEAR,
    computePointSpan,
    computeTotalSpan,
    partitionTimeSeries,
    decorateWithData,
    fillNulls,
    decorateWithLabels,
    processData,
    computeSeriesNames,
} from '../src/format-data';
import generateTimeSeries from './generate-time-series';

const normalizeDateToString = d => moment(d).format('YYYY-MM-DD HH:mm:ss');

const assertPartitionsEqual = (actual, expected, message) => {
    assert.deepEqual(
        actual.map(p => p.map(normalizeDateToString)),
        expected.map(p => p.map(normalizeDateToString)),
        message,
    );
};

const assertDecoratedPartitionsEqual = (actual, expected, message) => {
    assert.deepEqual(
        actual.map(p => p.map(d =>
            extend({}, d, { date: normalizeDateToString(d.date) }),
        )),
        expected.map(p => p.map(d =>
            extend({}, d, { date: normalizeDateToString(d.date) }),
        )),
        message,
    );
};

const createNullFilledPartitions = (timeSeries, granularity) => {
    let partitions = partitionTimeSeries(timeSeries, granularity);
    const dataSeries = range(timeSeries.length);
    partitions = decorateWithData(partitions, dataSeries, 'count');
    partitions = fillNulls(partitions, granularity, computePointSpan(timeSeries));
    return partitions;
};

const assertNullFilledPartitionsEqual = (actual, expected, message) => {
    assert.deepEqual(
        actual.map(p => p.map((d) => {
            if ({}.hasOwnProperty.call(d, 'fieldValue')) {
                return normalizeDateToString(d.date);
            }
            return null;
        })),
        expected,
        message,
    );
};

const createLabeledPartitions = (timeSeries, granularity, customFormat = null) =>
    decorateWithLabels(
        createNullFilledPartitions(timeSeries, granularity),
        customFormat,
    );

const assertPartitionLabelsEqual = (actual, expected, message) => {
    assert.deepEqual(
        actual.map(p => p.map(d => d.label)),
        expected,
        message,
    );
};

suite('The format-data utility package', () => {
    suite('#computePointSpan', () => {
        test('two points, one minute apart', () => {
            const timeSeries = generateTimeSeries('1981-08-18 00:00:00', 2, 60);
            assert.deepEqual(computePointSpan(timeSeries), { amount: 60, unit: 'seconds' });
        });
        test('two points, one hour apart, spanning a day boundary', () => {
            const timeSeries = generateTimeSeries('1981-08-18 23:30:00', 2, 60 * 60);
            assert.deepEqual(computePointSpan(timeSeries), { amount: 60 * 60, unit: 'seconds' });
        });
    });

    suite('#computeTotalSpan', () => {
        test('five points, one minute apart', () => {
            const timeSeries = generateTimeSeries('1981-08-18 00:00:00', 5, 60);
            assert.equal(computeTotalSpan(timeSeries), 5 * 60);
        });
        test('30 points, one hour apart, spanning two day boundaries', () => {
            const timeSeries = generateTimeSeries('1981-08-18 23:30:00', 30, 60 * 60);
            assert.equal(computeTotalSpan(timeSeries), 30 * 60 * 60);
        });
    });

    suite('#partitionTimeSeries', () => {
        test('4 hours of data, 15 minute increments, hour granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-18 23:00:00', 16, 15 * 60);
            const partitions = partitionTimeSeries(timeSeries, HOUR);
            const expected = [
                ['1981-08-18 23:00:00', '1981-08-18 23:15:00',
                    '1981-08-18 23:30:00', '1981-08-18 23:45:00'],
                ['1981-08-19 00:00:00', '1981-08-19 00:15:00',
                    '1981-08-19 00:30:00', '1981-08-19 00:45:00'],
                ['1981-08-19 01:00:00', '1981-08-19 01:15:00',
                    '1981-08-19 01:30:00', '1981-08-19 01:45:00'],
                ['1981-08-19 02:00:00', '1981-08-19 02:15:00',
                    '1981-08-19 02:30:00', '1981-08-19 02:45:00'],
            ];
            assertPartitionsEqual(partitions, expected);
        });
        test('1 day 2 hours of data, 1 hour increments, six hour granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-18 00:00:00', 26, 60 * 60);
            const partitions = partitionTimeSeries(timeSeries, SIX_HOUR);
            const expected = [
                ['1981-08-18 00:00:00', '1981-08-18 01:00:00',
                    '1981-08-18 02:00:00', '1981-08-18 03:00:00',
                    '1981-08-18 04:00:00', '1981-08-18 05:00:00'],
                ['1981-08-18 06:00:00', '1981-08-18 07:00:00',
                    '1981-08-18 08:00:00', '1981-08-18 09:00:00',
                    '1981-08-18 10:00:00', '1981-08-18 11:00:00'],
                ['1981-08-18 12:00:00', '1981-08-18 13:00:00',
                    '1981-08-18 14:00:00', '1981-08-18 15:00:00',
                    '1981-08-18 16:00:00', '1981-08-18 17:00:00'],
                ['1981-08-18 18:00:00', '1981-08-18 19:00:00',
                    '1981-08-18 20:00:00', '1981-08-18 21:00:00',
                    '1981-08-18 22:00:00', '1981-08-18 23:00:00'],
                ['1981-08-19 00:00:00', '1981-08-19 01:00:00'],
            ];
            assertPartitionsEqual(partitions, expected);
        });
        test('3 days 8 hours of data, 4 hour increments, twelve hour granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-18 00:00:00', 20, 4 * 60 * 60);
            const partitions = partitionTimeSeries(timeSeries, TWELVE_HOUR);
            const expected = [
                ['1981-08-18 00:00:00', '1981-08-18 04:00:00', '1981-08-18 08:00:00'],
                ['1981-08-18 12:00:00', '1981-08-18 16:00:00', '1981-08-18 20:00:00'],
                ['1981-08-19 00:00:00', '1981-08-19 04:00:00', '1981-08-19 08:00:00'],
                ['1981-08-19 12:00:00', '1981-08-19 16:00:00', '1981-08-19 20:00:00'],
                ['1981-08-20 00:00:00', '1981-08-20 04:00:00', '1981-08-20 08:00:00'],
                ['1981-08-20 12:00:00', '1981-08-20 16:00:00', '1981-08-20 20:00:00'],
                ['1981-08-21 00:00:00', '1981-08-21 04:00:00'],
            ];
            assertPartitionsEqual(partitions, expected);
        });
        test('1 week of data, 8 hour increments, day granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-18 00:00:00', 21, 8 * 60 * 60);
            const partitions = partitionTimeSeries(timeSeries, DAY);
            const expected = [
                ['1981-08-18 00:00:00', '1981-08-18 08:00:00', '1981-08-18 16:00:00'],
                ['1981-08-19 00:00:00', '1981-08-19 08:00:00', '1981-08-19 16:00:00'],
                ['1981-08-20 00:00:00', '1981-08-20 08:00:00', '1981-08-20 16:00:00'],
                ['1981-08-21 00:00:00', '1981-08-21 08:00:00', '1981-08-21 16:00:00'],
                ['1981-08-22 00:00:00', '1981-08-22 08:00:00', '1981-08-22 16:00:00'],
                ['1981-08-23 00:00:00', '1981-08-23 08:00:00', '1981-08-23 16:00:00'],
                ['1981-08-24 00:00:00', '1981-08-24 08:00:00', '1981-08-24 16:00:00'],
            ];
            assertPartitionsEqual(partitions, expected);
        });
        test('3 weeks 4 days of data, 1 day increments, week granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-16 00:00:00', 25, 1, 'day');
            const partitions = partitionTimeSeries(timeSeries, WEEK);
            const expected = [
                ['1981-08-16 00:00:00', '1981-08-17 00:00:00', '1981-08-18 00:00:00',
                    '1981-08-19 00:00:00', '1981-08-20 00:00:00', '1981-08-21 00:00:00',
                    '1981-08-22 00:00:00'],
                ['1981-08-23 00:00:00', '1981-08-24 00:00:00', '1981-08-25 00:00:00',
                    '1981-08-26 00:00:00', '1981-08-27 00:00:00', '1981-08-28 00:00:00',
                    '1981-08-29 00:00:00'],
                ['1981-08-30 00:00:00', '1981-08-31 00:00:00', '1981-09-01 00:00:00',
                    '1981-09-02 00:00:00', '1981-09-03 00:00:00', '1981-09-04 00:00:00',
                    '1981-09-05 00:00:00'],
                ['1981-09-06 00:00:00', '1981-09-07 00:00:00', '1981-09-08 00:00:00',
                    '1981-09-09 00:00:00'],
            ];
            assertPartitionsEqual(partitions, expected);
        });
        test('~6 months of data, 1 week increments, month granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-18 00:00:00', 24, 7, 'day');
            const partitions = partitionTimeSeries(timeSeries, MONTH);
            const expected = [
                ['1981-08-18 00:00:00', '1981-08-25 00:00:00'],
                ['1981-09-01 00:00:00', '1981-09-08 00:00:00', '1981-09-15 00:00:00',
                    '1981-09-22 00:00:00', '1981-09-29 00:00:00'],
                ['1981-10-06 00:00:00', '1981-10-13 00:00:00', '1981-10-20 00:00:00',
                    '1981-10-27 00:00:00'],
                ['1981-11-03 00:00:00', '1981-11-10 00:00:00', '1981-11-17 00:00:00',
                    '1981-11-24 00:00:00'],
                ['1981-12-01 00:00:00', '1981-12-08 00:00:00', '1981-12-15 00:00:00',
                    '1981-12-22 00:00:00', '1981-12-29 00:00:00'],
                ['1982-01-05 00:00:00', '1982-01-12 00:00:00', '1982-01-19 00:00:00',
                    '1982-01-26 00:00:00'],
            ];
            assertPartitionsEqual(partitions, expected);
        });
        test('21 months of data, 1 month increments, three month granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-01 00:00:00', 21, 1, 'month');
            const partitions = partitionTimeSeries(timeSeries, THREE_MONTH);
            const expected = [
                ['1981-08-01 00:00:00', '1981-09-01 00:00:00'],
                ['1981-10-01 00:00:00', '1981-11-01 00:00:00', '1981-12-01 00:00:00'],
                ['1982-01-01 00:00:00', '1982-02-01 00:00:00', '1982-03-01 00:00:00'],
                ['1982-04-01 00:00:00', '1982-05-01 00:00:00', '1982-06-01 00:00:00'],
                ['1982-07-01 00:00:00', '1982-08-01 00:00:00', '1982-09-01 00:00:00'],
                ['1982-10-01 00:00:00', '1982-11-01 00:00:00', '1982-12-01 00:00:00'],
                ['1983-01-01 00:00:00', '1983-02-01 00:00:00', '1983-03-01 00:00:00'],
                ['1983-04-01 00:00:00'],
            ];
            assertPartitionsEqual(partitions, expected);
        });
        test('5 years of data, 4 month increments, year granularity', () => {
            const timeSeries = generateTimeSeries('1981-09-01 00:00:00', 15, 4, 'month');
            const partitions = partitionTimeSeries(timeSeries, YEAR);
            const expected = [
                ['1981-09-01 00:00:00'],
                ['1982-01-01 00:00:00', '1982-05-01 00:00:00', '1982-09-01 00:00:00'],
                ['1983-01-01 00:00:00', '1983-05-01 00:00:00', '1983-09-01 00:00:00'],
                ['1984-01-01 00:00:00', '1984-05-01 00:00:00', '1984-09-01 00:00:00'],
                ['1985-01-01 00:00:00', '1985-05-01 00:00:00', '1985-09-01 00:00:00'],
                ['1986-01-01 00:00:00', '1986-05-01 00:00:00'],
            ];
            assertPartitionsEqual(partitions, expected);
        });
    });

    suite('#decorateWithData', () => {
        test('~6 months of data, 1 week increments, month granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-18 00:00:00', 24, 7, DAY);
            const partitions = partitionTimeSeries(timeSeries, MONTH);
            const dataSeries = range(timeSeries.length);
            const decorated = decorateWithData(partitions, dataSeries, 'count');
            const expected = [
                [
                    { date: '1981-08-18 00:00:00', fieldName: 'count', fieldValue: 0 },
                    { date: '1981-08-25 00:00:00', fieldName: 'count', fieldValue: 1 },
                ],
                [
                    { date: '1981-09-01 00:00:00', fieldName: 'count', fieldValue: 2 },
                    { date: '1981-09-08 00:00:00', fieldName: 'count', fieldValue: 3 },
                    { date: '1981-09-15 00:00:00', fieldName: 'count', fieldValue: 4 },
                    { date: '1981-09-22 00:00:00', fieldName: 'count', fieldValue: 5 },
                    { date: '1981-09-29 00:00:00', fieldName: 'count', fieldValue: 6 },
                ],
                [
                    { date: '1981-10-06 00:00:00', fieldName: 'count', fieldValue: 7 },
                    { date: '1981-10-13 00:00:00', fieldName: 'count', fieldValue: 8 },
                    { date: '1981-10-20 00:00:00', fieldName: 'count', fieldValue: 9 },
                    { date: '1981-10-27 00:00:00', fieldName: 'count', fieldValue: 10 },
                ],
                [
                    { date: '1981-11-03 00:00:00', fieldName: 'count', fieldValue: 11 },
                    { date: '1981-11-10 00:00:00', fieldName: 'count', fieldValue: 12 },
                    { date: '1981-11-17 00:00:00', fieldName: 'count', fieldValue: 13 },
                    { date: '1981-11-24 00:00:00', fieldName: 'count', fieldValue: 14 },
                ],
                [
                    { date: '1981-12-01 00:00:00', fieldName: 'count', fieldValue: 15 },
                    { date: '1981-12-08 00:00:00', fieldName: 'count', fieldValue: 16 },
                    { date: '1981-12-15 00:00:00', fieldName: 'count', fieldValue: 17 },
                    { date: '1981-12-22 00:00:00', fieldName: 'count', fieldValue: 18 },
                    { date: '1981-12-29 00:00:00', fieldName: 'count', fieldValue: 19 },
                ],
                [
                    { date: '1982-01-05 00:00:00', fieldName: 'count', fieldValue: 20 },
                    { date: '1982-01-12 00:00:00', fieldName: 'count', fieldValue: 21 },
                    { date: '1982-01-19 00:00:00', fieldName: 'count', fieldValue: 22 },
                    { date: '1982-01-26 00:00:00', fieldName: 'count', fieldValue: 23 },
                ],
            ];
            assertDecoratedPartitionsEqual(decorated, expected);
        });
    });

    suite('#fillNulls', () => {
        test('~4 hours of data, 7 minute increments, hour granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-18 23:15:00', 35, 7 * 60);
            const partitions = createNullFilledPartitions(timeSeries, HOUR);
            const expected = [
                [null, null, null, null, null, null, null, null, null, null,
                    null, null, null, null, null, '1981-08-18 23:15:00', null, null, null, null,
                    null, null, '1981-08-18 23:22:00', null, null, null, null, null, null, '1981-08-18 23:29:00',
                    null, null, null, null, null, null, '1981-08-18 23:36:00', null, null, null,
                    null, null, null, '1981-08-18 23:43:00', null, null, null, null, null, null,
                    '1981-08-18 23:50:00', null, null, null, null, null, null, '1981-08-18 23:57:00', null, null],
                [null, null, null, null, '1981-08-19 00:04:00', null, null, null, null, null,
                    null, '1981-08-19 00:11:00', null, null, null, null, null, null, '1981-08-19 00:18:00', null,
                    null, null, null, null, null, '1981-08-19 00:25:00', null, null, null, null,
                    null, null, '1981-08-19 00:32:00', null, null, null, null, null, null, '1981-08-19 00:39:00',
                    null, null, null, null, null, null, '1981-08-19 00:46:00', null, null, null,
                    null, null, null, '1981-08-19 00:53:00', null, null, null, null, null, null],
                ['1981-08-19 01:00:00', null, null, null, null, null, null, '1981-08-19 01:07:00', null, null,
                    null, null, null, null, '1981-08-19 01:14:00', null, null, null, null, null,
                    null, '1981-08-19 01:21:00', null, null, null, null, null, null, '1981-08-19 01:28:00', null,
                    null, null, null, null, null, '1981-08-19 01:35:00', null, null, null, null,
                    null, null, '1981-08-19 01:42:00', null, null, null, null, null, null, '1981-08-19 01:49:00',
                    null, null, null, null, null, null, '1981-08-19 01:56:00', null, null, null],
                [null, null, null, '1981-08-19 02:03:00', null, null, null, null, null, null,
                    '1981-08-19 02:10:00', null, null, null, null, null, null, '1981-08-19 02:17:00', null, null,
                    null, null, null, null, '1981-08-19 02:24:00', null, null, null, null, null,
                    null, '1981-08-19 02:31:00', null, null, null, null, null, null, '1981-08-19 02:38:00', null,
                    null, null, null, null, null, '1981-08-19 02:45:00', null, null, null, null,
                    null, null, '1981-08-19 02:52:00', null, null, null, null, null, null, '1981-08-19 02:59:00'],
                [null, null, null, null, null, null, '1981-08-19 03:06:00', null, null, null,
                    null, null, null, '1981-08-19 03:13:00', null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null],
            ];
            assertNullFilledPartitionsEqual(partitions, expected);
        });
        test('4 hours of data, 15 minute increments, hour granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60);
            const partitions = createNullFilledPartitions(timeSeries, HOUR);
            const expected = [
                [null, '1981-08-18 23:15:00',
                    '1981-08-18 23:30:00', '1981-08-18 23:45:00'],
                ['1981-08-19 00:00:00', '1981-08-19 00:15:00',
                    '1981-08-19 00:30:00', '1981-08-19 00:45:00'],
                ['1981-08-19 01:00:00', '1981-08-19 01:15:00',
                    '1981-08-19 01:30:00', '1981-08-19 01:45:00'],
                ['1981-08-19 02:00:00', '1981-08-19 02:15:00',
                    '1981-08-19 02:30:00', '1981-08-19 02:45:00'],
                ['1981-08-19 03:00:00', null, null, null],
            ];
            assertNullFilledPartitionsEqual(partitions, expected);
        });
        test('1 day 2 hours of data, 1 hour increments, six hour granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-17 22:00:00', 26, 60 * 60);
            const partitions = createNullFilledPartitions(timeSeries, SIX_HOUR);
            const expected = [
                [null, null, null, null, '1981-08-17 22:00:00', '1981-08-17 23:00:00'],
                ['1981-08-18 00:00:00', '1981-08-18 01:00:00',
                    '1981-08-18 02:00:00', '1981-08-18 03:00:00',
                    '1981-08-18 04:00:00', '1981-08-18 05:00:00'],
                ['1981-08-18 06:00:00', '1981-08-18 07:00:00',
                    '1981-08-18 08:00:00', '1981-08-18 09:00:00',
                    '1981-08-18 10:00:00', '1981-08-18 11:00:00'],
                ['1981-08-18 12:00:00', '1981-08-18 13:00:00',
                    '1981-08-18 14:00:00', '1981-08-18 15:00:00',
                    '1981-08-18 16:00:00', '1981-08-18 17:00:00'],
                ['1981-08-18 18:00:00', '1981-08-18 19:00:00',
                    '1981-08-18 20:00:00', '1981-08-18 21:00:00',
                    '1981-08-18 22:00:00', '1981-08-18 23:00:00'],
            ];
            assertNullFilledPartitionsEqual(partitions, expected);
        });
        test('3 days 8 hours of data, 4 hour increments, twelve hour granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-17 20:00:00', 20, 4 * 60 * 60);
            const partitions = createNullFilledPartitions(timeSeries, TWELVE_HOUR);
            const expected = [
                [null, null, null, null, null, null, null, null, '1981-08-17 20:00:00', null, null, null],
                ['1981-08-18 00:00:00', null, null, null, '1981-08-18 04:00:00', null, null, null,
                    '1981-08-18 08:00:00', null, null, null],
                ['1981-08-18 12:00:00', null, null, null, '1981-08-18 16:00:00', null, null, null,
                    '1981-08-18 20:00:00', null, null, null],
                ['1981-08-19 00:00:00', null, null, null, '1981-08-19 04:00:00', null, null, null,
                    '1981-08-19 08:00:00', null, null, null],
                ['1981-08-19 12:00:00', null, null, null, '1981-08-19 16:00:00', null, null, null,
                    '1981-08-19 20:00:00', null, null, null],
                ['1981-08-20 00:00:00', null, null, null, '1981-08-20 04:00:00', null, null, null,
                    '1981-08-20 08:00:00', null, null, null],
                ['1981-08-20 12:00:00', null, null, null, '1981-08-20 16:00:00', null, null, null,
                    '1981-08-20 20:00:00', null, null, null],
                ['1981-08-21 00:00:00', null, null, null, null, null, null, null, null, null, null, null],
            ];
            assertNullFilledPartitionsEqual(partitions, expected);
        });
        test('1 week of data, 8 hour increments, day granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-17 08:00:00', 21, 8 * 60 * 60);
            const partitions = createNullFilledPartitions(timeSeries, DAY);
            const expected = [
                [null, null, null, null, null, null, null, null,
                    '1981-08-17 08:00:00', null, null, null, null, null, null, null,
                    '1981-08-17 16:00:00', null, null, null, null, null, null, null],
                ['1981-08-18 00:00:00', null, null, null, null, null, null, null,
                    '1981-08-18 08:00:00', null, null, null, null, null, null, null,
                    '1981-08-18 16:00:00', null, null, null, null, null, null, null],
                ['1981-08-19 00:00:00', null, null, null, null, null, null, null,
                    '1981-08-19 08:00:00', null, null, null, null, null, null, null,
                    '1981-08-19 16:00:00', null, null, null, null, null, null, null],
                ['1981-08-20 00:00:00', null, null, null, null, null, null, null,
                    '1981-08-20 08:00:00', null, null, null, null, null, null, null,
                    '1981-08-20 16:00:00', null, null, null, null, null, null, null],
                ['1981-08-21 00:00:00', null, null, null, null, null, null, null,
                    '1981-08-21 08:00:00', null, null, null, null, null, null, null,
                    '1981-08-21 16:00:00', null, null, null, null, null, null, null],
                ['1981-08-22 00:00:00', null, null, null, null, null, null, null,
                    '1981-08-22 08:00:00', null, null, null, null, null, null, null,
                    '1981-08-22 16:00:00', null, null, null, null, null, null, null],
                ['1981-08-23 00:00:00', null, null, null, null, null, null, null,
                    '1981-08-23 08:00:00', null, null, null, null, null, null, null,
                    '1981-08-23 16:00:00', null, null, null, null, null, null, null],
                ['1981-08-24 00:00:00', null, null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null],
            ];
            assertNullFilledPartitionsEqual(partitions, expected);
        });
        test('3 weeks 4 days of data, 1 day increments, week granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-18 00:00:00', 25, 1, 'day');
            const partitions = createNullFilledPartitions(timeSeries, WEEK);
            const expected = [
                [null, null, '1981-08-18 00:00:00',
                    '1981-08-19 00:00:00', '1981-08-20 00:00:00', '1981-08-21 00:00:00',
                    '1981-08-22 00:00:00'],
                ['1981-08-23 00:00:00', '1981-08-24 00:00:00', '1981-08-25 00:00:00',
                    '1981-08-26 00:00:00', '1981-08-27 00:00:00', '1981-08-28 00:00:00',
                    '1981-08-29 00:00:00'],
                ['1981-08-30 00:00:00', '1981-08-31 00:00:00', '1981-09-01 00:00:00',
                    '1981-09-02 00:00:00', '1981-09-03 00:00:00', '1981-09-04 00:00:00',
                    '1981-09-05 00:00:00'],
                ['1981-09-06 00:00:00', '1981-09-07 00:00:00', '1981-09-08 00:00:00',
                    '1981-09-09 00:00:00', '1981-09-10 00:00:00', '1981-09-11 00:00:00',
                    null],
            ];
            assertNullFilledPartitionsEqual(partitions, expected);
        });
        test('~6 months of data, 1 week increments, month granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-18 00:00:00', 24, 7, 'day');
            const partitions = createNullFilledPartitions(timeSeries, MONTH);
            const expected = [
                [null, null, null, null, null,
                    null, null, null, null, null,
                    null, null, null, null, null,
                    null, null, '1981-08-18 00:00:00', null, null,
                    null, null, null, null, '1981-08-25 00:00:00',
                    null, null, null, null, null,
                    null],
                ['1981-09-01 00:00:00', null, null, null, null,
                    null, null, '1981-09-08 00:00:00', null, null,
                    null, null, null, null, '1981-09-15 00:00:00',
                    null, null, null, null, null,
                    null, '1981-09-22 00:00:00', null, null, null,
                    null, null, null, '1981-09-29 00:00:00', null],
                [null, null, null, null, null,
                    '1981-10-06 00:00:00', null, null, null, null,
                    null, null, '1981-10-13 00:00:00', null, null,
                    null, null, null, null, '1981-10-20 00:00:00',
                    null, null, null, null, null,
                    null, '1981-10-27 00:00:00', null, null, null,
                    null],
                [null, null, '1981-11-03 00:00:00', null, null,
                    null, null, null, null, '1981-11-10 00:00:00',
                    null, null, null, null, null,
                    null, '1981-11-17 00:00:00', null, null, null,
                    null, null, null, '1981-11-24 00:00:00', null,
                    null, null, null, null, null],
                ['1981-12-01 00:00:00', null, null, null, null,
                    null, null, '1981-12-08 00:00:00', null, null,
                    null, null, null, null, '1981-12-15 00:00:00',
                    null, null, null, null, null,
                    null, '1981-12-22 00:00:00', null, null, null,
                    null, null, null, '1981-12-29 00:00:00', null,
                    null],
                [null, null, null, null, '1982-01-05 00:00:00',
                    null, null, null, null, null,
                    null, '1982-01-12 00:00:00', null, null, null,
                    null, null, null, '1982-01-19 00:00:00', null,
                    null, null, null, null, null,
                    '1982-01-26 00:00:00', null, null, null, null,
                    null],
            ];
            assertNullFilledPartitionsEqual(partitions, expected);
        });
        test('21 months of data, 1 month increments, three month granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-01 00:00:00', 21, 1, 'month');
            const partitions = createNullFilledPartitions(timeSeries, THREE_MONTH);
            const expected = [
                [null, '1981-08-01 00:00:00', '1981-09-01 00:00:00'],
                ['1981-10-01 00:00:00', '1981-11-01 00:00:00', '1981-12-01 00:00:00'],
                ['1982-01-01 00:00:00', '1982-02-01 00:00:00', '1982-03-01 00:00:00'],
                ['1982-04-01 00:00:00', '1982-05-01 00:00:00', '1982-06-01 00:00:00'],
                ['1982-07-01 00:00:00', '1982-08-01 00:00:00', '1982-09-01 00:00:00'],
                ['1982-10-01 00:00:00', '1982-11-01 00:00:00', '1982-12-01 00:00:00'],
                ['1983-01-01 00:00:00', '1983-02-01 00:00:00', '1983-03-01 00:00:00'],
                ['1983-04-01 00:00:00', null, null],
            ];
            assertNullFilledPartitionsEqual(partitions, expected);
        });
        test('5 years of data, 4 month increments, year granularity', () => {
            const timeSeries = generateTimeSeries('1981-09-01 00:00:00', 15, 4, 'month');
            const partitions = createNullFilledPartitions(timeSeries, YEAR);
            const expected = [
                [null, null, null, null, null, null, null, null,
                    '1981-09-01 00:00:00', null, null, null],
                ['1982-01-01 00:00:00', null, null, null, '1982-05-01 00:00:00', null, null, null,
                    '1982-09-01 00:00:00', null, null, null],
                ['1983-01-01 00:00:00', null, null, null, '1983-05-01 00:00:00', null, null, null,
                    '1983-09-01 00:00:00', null, null, null],
                ['1984-01-01 00:00:00', null, null, null, '1984-05-01 00:00:00', null, null, null,
                    '1984-09-01 00:00:00', null, null, null],
                ['1985-01-01 00:00:00', null, null, null, '1985-05-01 00:00:00', null, null, null,
                    '1985-09-01 00:00:00', null, null, null],
                ['1986-01-01 00:00:00', null, null, null, '1986-05-01 00:00:00', null, null, null,
                    null, null, null, null],
            ];
            assertNullFilledPartitionsEqual(partitions, expected);
        });
    });

    suite('#decorateWithLabels', () => {
        test('4 hours of data, 15 minute increments, hour granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60);
            const partitions = createLabeledPartitions(timeSeries, HOUR);
            const expected = [
                [':00', ':15', ':30', ':45'],
                [':00', ':15', ':30', ':45'],
                [':00', ':15', ':30', ':45'],
                [':00', ':15', ':30', ':45'],
                [':00', ':15', ':30', ':45'],
            ];
            assertPartitionLabelsEqual(partitions, expected);
        });
        test('4 hours of data, 15 minute increments, hour granularity, custom label format', () => {
            const timeSeries = generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60);
            const partitions = createLabeledPartitions(timeSeries, HOUR, ':mm:ss');
            const expected = [
                [':00:00', ':15:00', ':30:00', ':45:00'],
                [':00:00', ':15:00', ':30:00', ':45:00'],
                [':00:00', ':15:00', ':30:00', ':45:00'],
                [':00:00', ':15:00', ':30:00', ':45:00'],
                [':00:00', ':15:00', ':30:00', ':45:00'],
            ];
            assertPartitionLabelsEqual(partitions, expected);
        });
        test('5 years of data, 4 month increments, year granularity', () => {
            const timeSeries = generateTimeSeries('1981-09-01 00:00:00', 15, 4, 'month');
            const partitions = createLabeledPartitions(timeSeries, YEAR);
            const expected = [
                ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                    'September', 'October', 'November', 'December'],
                ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                    'September', 'October', 'November', 'December'],
                ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                    'September', 'October', 'November', 'December'],
                ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                    'September', 'October', 'November', 'December'],
                ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                    'September', 'October', 'November', 'December'],
                ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                    'September', 'October', 'November', 'December'],
            ];
            assertPartitionLabelsEqual(partitions, expected);
        });
    });

    suite('#computeSeriesNames', () => {
        test('4 hours of data, 15 minute increments, hour granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60);
            const partitions = processData(timeSeries, range(timeSeries.length), 'count');
            assert.deepEqual(
                computeSeriesNames(partitions),
                ['11:00 PM - 12:00 AM', '12:00 AM - 1:00 AM', '1:00 AM - 2:00 AM',
                    '2:00 AM - 3:00 AM', '3:00 AM - 4:00 AM'],
            );
        });
        test('4 hours of data, 15 minute increments, hour granularity, custom label format', () => {
            const timeSeries = generateTimeSeries('1981-08-18 23:15:00', 16, 15 * 60);
            const partitions = processData(timeSeries, range(timeSeries.length), 'count');
            assert.deepEqual(
                computeSeriesNames(partitions, 'h A'),
                ['11 PM - 12 AM', '12 AM - 1 AM', '1 AM - 2 AM', '2 AM - 3 AM', '3 AM - 4 AM'],
            );
        });
        test('1 week of data, 8 hour increments, day granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-17 08:00:00', 21, 8 * 60 * 60);
            const partitions = processData(timeSeries, range(timeSeries.length), 'count');
            assert.deepEqual(
                computeSeriesNames(partitions),
                ['Aug 17th', 'Aug 18th', 'Aug 19th', 'Aug 20th', 'Aug 21st', 'Aug 22nd',
                    'Aug 23rd', 'Aug 24th'],
            );
        });
        test('1 week of data, 8 hour increments, day granularity, custom label format', () => {
            const timeSeries = generateTimeSeries('1981-08-17 08:00:00', 21, 8 * 60 * 60);
            const partitions = processData(timeSeries, range(timeSeries.length), 'count');
            assert.deepEqual(
                computeSeriesNames(partitions, 'M/D'),
                ['8/17', '8/18', '8/19', '8/20', '8/21', '8/22', '8/23', '8/24'],
            );
        });
        test('3 weeks 4 days of data, 1 day increments, week granularity', () => {
            const timeSeries = generateTimeSeries('1981-08-18 00:00:00', 25, 1, 'day');
            const partitions = processData(timeSeries, range(timeSeries.length), 'count');
            assert.deepEqual(
                computeSeriesNames(partitions),
                ['Aug 16th - 23rd', 'Aug 23rd - 30th', 'Aug 30th - Sep 6th', 'Sep 6th - 13th'],
            );
        });
    });
});