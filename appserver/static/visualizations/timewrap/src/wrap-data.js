import moment from 'moment';
import last from 'lodash/last';
import find from 'lodash/find';
import groupBy from 'lodash/groupBy';
import memoize from 'lodash/memoize';

const SECONDS_PER_HOUR = 60 * 60;
const MIN_SECONDS_PER_DAY = 23 * SECONDS_PER_HOUR;
const MIN_SECONDS_PER_MONTH = 28 * 24 * SECONDS_PER_HOUR;
const MIN_SECONDS_PER_YEAR = 365 * 24 * SECONDS_PER_HOUR;

// exported for testing only
export const HOUR = 'hour';
export const SIX_HOUR = 'six-hour';
export const TWELVE_HOUR = 'twelve-hour';
export const DAY = 'day';
export const WEEK = 'week';
export const MONTH = 'month';
export const THREE_MONTH = 'three-month';
export const YEAR = 'year';

const spanBetweenDates = (date1, date2) => {
    const secondsDifference = date2.diff(date1, 'seconds');
    if (secondsDifference < MIN_SECONDS_PER_DAY) {
        return { amount: secondsDifference, unit: 'seconds' };
    }
    if (secondsDifference < MIN_SECONDS_PER_MONTH) {
        return { amount: date2.diff(date1, 'days'), unit: 'days' };
    }
    if (secondsDifference < MIN_SECONDS_PER_YEAR) {
        return { amount: date2.diff(date1, 'months'), unit: 'months' };
    }
    return { amount: date2.diff(date1, 'years'), unit: 'years' };
};

// exported for testing only
export const computePointSpan = memoize(timeSeries =>
    spanBetweenDates(timeSeries[0], timeSeries[1])
);

// exported for testing only
export const computeTotalSpan = memoize(timeSeries => {
    const pointSpan = computePointSpan(timeSeries);
    return last(timeSeries).clone().add(pointSpan.amount, pointSpan.unit)
        .diff(timeSeries[0], 'seconds');
});

const computeGranularity = totalSpan => {
    if (totalSpan < MIN_SECONDS_PER_DAY) {
        return HOUR;
    }
    if (totalSpan < 2 * MIN_SECONDS_PER_DAY) {
        return SIX_HOUR;
    }
    if (totalSpan < 4 * MIN_SECONDS_PER_DAY) {
        return TWELVE_HOUR;
    }
    if (totalSpan < 14 * MIN_SECONDS_PER_DAY) {
        return DAY;
    }
    if (totalSpan < 60 * MIN_SECONDS_PER_DAY) {
        return WEEK;
    }
    if (totalSpan < 365 * MIN_SECONDS_PER_DAY) {
        return MONTH;
    }
    if (totalSpan < 2 * 365 * MIN_SECONDS_PER_DAY) {
        return THREE_MONTH;
    }
    return YEAR;
};

const GROUP_BYS = {
    [HOUR]: date => date.format('YYYY-DDDD-HH'),
    [SIX_HOUR]: date => {
        const hour = date.hour();
        return date.format(`YYYY-DDDD-${Math.floor(hour / 6)}`);
    },
    [TWELVE_HOUR]: date => {
        const hour = date.hour();
        return date.format(`YYYY-DDDD-${Math.floor(hour / 12)}`);
    },
    [DAY]: date => date.format('YYYY-DDDD'),
    [WEEK]: date => date.format('YYYY-ww'),
    [MONTH]: date => date.format('YYYY-MM'),
    [THREE_MONTH]: date => date.format('YYYY-Q'),
    [YEAR]: date => date.format('YYYY'),
};

// exported for testing only
export const partitionTimeSeries = (timeSeries, granularity) => {
    const groupByFn = GROUP_BYS[granularity];
    const grouped = groupBy(timeSeries, groupByFn);
    return Object.keys(grouped).sort().map(key => grouped[key]);
};

// exported for testing only
export const decorateWithData = (partitions, dataSeries, dataFieldName) => {
    let counter = 0;
    return partitions.map(group =>
        group.map(date => {
            const decorated = {
                fieldName: dataFieldName,
                fieldValue: dataSeries[counter],
                date,
            };
            counter++;
            return decorated;
        })
    );
};

const fillPartition = (partition, granularity, pointSpan) => {
    const groupByFn = GROUP_BYS[granularity];
    const filled = [];

    let earliestDate = null;
    let currentDate = partition[0].date;
    while (!earliestDate) {
        const nextEarliestDate = currentDate.clone().subtract(pointSpan.amount, pointSpan.unit);
        if (groupByFn(currentDate) !== groupByFn(nextEarliestDate)) {
            earliestDate = currentDate;
        }
        currentDate = nextEarliestDate;
    }

    currentDate = earliestDate;
    const pointMatches = point => point.date.isSame(currentDate);
    while (groupByFn(currentDate) === groupByFn(earliestDate)) {
        const matchingPoint = find(partition, pointMatches);
        if (matchingPoint) {
            filled.push(matchingPoint);
        } else {
            filled.push({ date: currentDate });
        }
        currentDate = currentDate.clone().add(pointSpan.amount, pointSpan.unit);
    }
    return filled;
};

// exported for testing only
export const fillNulls = (partitions, granularity, pointSpan) => {
    const partitionSpan = granularity === 'month' ? { amount: 1, unit: 'day' } : pointSpan;
    return partitions.map(p => fillPartition(p, granularity, partitionSpan));
};

export default (rawTimeSeries, dataSeries, dataFieldName) => {
    const timeSeries = rawTimeSeries.map(moment);
    const pointSpan = computePointSpan(timeSeries);
    const totalSpan = computeTotalSpan(timeSeries);
    const granularity = computeGranularity(pointSpan, totalSpan);
    let partitions = partitionTimeSeries(timeSeries, granularity, pointSpan);
    partitions = decorateWithData(partitions, dataSeries, dataFieldName);
    return partitions;
};