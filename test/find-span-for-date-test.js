import { assert } from 'chai';
import moment from 'moment';
import generateTimeSeries from './generate-time-series';
import findSpanForDate from '../src/find-span-for-date';

const timeSeries = generateTimeSeries('1981-08-18 00:00:00', 12, 1, 'hour');
timeSeries.push(moment('1981-08-18 11:30:00').toDate());
const spanSeries = timeSeries.map((date, i) => i + 10);

suite('The findSpanForDate function', () => {
    test('uses the spanSeries when possible', () => {
        const date = moment('1981-08-18 03:00:00').toDate();
        const span = findSpanForDate(date, timeSeries, spanSeries);
        assert.equal(span, 13);
    });

    test('diffs to next date when there is no span series', () => {
        const date = moment('1981-08-18 03:00:00').toDate();
        const span = findSpanForDate(date, timeSeries);
        assert.equal(span, 3600);
    });

    test('diffs to previous date when the given date is the last one', () => {
        const date = moment('1981-08-18 11:30:00').toDate();
        const span = findSpanForDate(date, timeSeries);
        assert.equal(span, 1800);
    });

    test('handles a single point if there is a span series', () => {
        const date = moment('1981-08-18 00:00:00').toDate();
        const span = findSpanForDate(date, timeSeries.slice(0, 1), spanSeries.slice(0, 1));
        assert.equal(span, 10);
    });

    test('returns 1 if given a single series with no span series', () => {
        const date = moment('1981-08-18 00:00:00').toDate();
        const span = findSpanForDate(date, timeSeries.slice(0, 1));
        assert.equal(span, 1);
    });

    test('returns 1 if the given date is not in the time series', () => {
        const date = moment('1981-08-18 09:30:00').toDate();
        const span = findSpanForDate(date, timeSeries);
        assert.equal(span, 1);
    });
});