import { assert } from 'chai';
import moment from 'moment';
import generateTimeSeries from './generate-time-series';

const assertTimeSeriesEqual = (actual, expected, message) => {
    assert.deepEqual(
        actual.map(d => moment(d).format('YYYY-MM-DD HH:mm:ss')),
        expected.map(d => moment(d).format('YYYY-MM-DD HH:mm:ss')),
        message
    );
};

suite('generateTimeSeries', () => {
    test('a series of 12 hours', () => {
        const timeSeries = generateTimeSeries('1981-08-18 00:00:00', 12, 60 * 60);
        assertTimeSeriesEqual(
            timeSeries,
            [
                '1981-08-18 00:00:00',
                '1981-08-18 01:00:00',
                '1981-08-18 02:00:00',
                '1981-08-18 03:00:00',
                '1981-08-18 04:00:00',
                '1981-08-18 05:00:00',
                '1981-08-18 06:00:00',
                '1981-08-18 07:00:00',
                '1981-08-18 08:00:00',
                '1981-08-18 09:00:00',
                '1981-08-18 10:00:00',
                '1981-08-18 11:00:00',
            ]
        );
    });
    test('a series of 12 hours, spanning a day boundary', () => {
        const timeSeries = generateTimeSeries('1981-08-18 20:00:00', 12, 60 * 60);
        assertTimeSeriesEqual(
            timeSeries,
            [
                '1981-08-18 20:00:00',
                '1981-08-18 21:00:00',
                '1981-08-18 22:00:00',
                '1981-08-18 23:00:00',
                '1981-08-19 00:00:00',
                '1981-08-19 01:00:00',
                '1981-08-19 02:00:00',
                '1981-08-19 03:00:00',
                '1981-08-19 04:00:00',
                '1981-08-19 05:00:00',
                '1981-08-19 06:00:00',
                '1981-08-19 07:00:00',
            ]
        );
    });
    test('a series of 10 days', () => {
        const timeSeries = generateTimeSeries('1981-08-10 00:00:00', 10, 60 * 60 * 24);
        assertTimeSeriesEqual(
            timeSeries,
            [
                '1981-08-10 00:00:00',
                '1981-08-11 00:00:00',
                '1981-08-12 00:00:00',
                '1981-08-13 00:00:00',
                '1981-08-14 00:00:00',
                '1981-08-15 00:00:00',
                '1981-08-16 00:00:00',
                '1981-08-17 00:00:00',
                '1981-08-18 00:00:00',
                '1981-08-19 00:00:00',
            ]
        );
    });
    test('a series of 15 days, spanning a month boundary', () => {
        const timeSeries = generateTimeSeries('1981-08-18 00:00:00', 15, 60 * 60 * 24);
        assertTimeSeriesEqual(
            timeSeries,
            [
                '1981-08-18 00:00:00',
                '1981-08-19 00:00:00',
                '1981-08-20 00:00:00',
                '1981-08-21 00:00:00',
                '1981-08-22 00:00:00',
                '1981-08-23 00:00:00',
                '1981-08-24 00:00:00',
                '1981-08-25 00:00:00',
                '1981-08-26 00:00:00',
                '1981-08-27 00:00:00',
                '1981-08-28 00:00:00',
                '1981-08-29 00:00:00',
                '1981-08-30 00:00:00',
                '1981-08-31 00:00:00',
                '1981-09-01 00:00:00',
            ]
        );
    });
});