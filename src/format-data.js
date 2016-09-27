import moment from 'moment';
import last from 'lodash/last';
import find from 'lodash/find';
import extend from 'lodash/extend';
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
export const computeTotalSpan = memoize((timeSeries) => {
    const pointSpan = computePointSpan(timeSeries);
    return last(timeSeries).clone().add(pointSpan.amount, pointSpan.unit)
        .diff(timeSeries[0], 'seconds');
});

const computeGranularity = (totalSpan) => {
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
    [SIX_HOUR]: (date) => {
        const hour = date.hour();
        return date.format(`YYYY-DDDD-${Math.floor(hour / 6)}`);
    },
    [TWELVE_HOUR]: (date) => {
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
        group.map((date) => {
            const decorated = {
                fieldName: dataFieldName,
                fieldValue: dataSeries[counter],
                date,
            };
            counter += 1;
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
    let partitionSpan;
    switch (granularity) {
    case HOUR: {
        const pointSpanMinutes = moment.duration(pointSpan.amount, pointSpan.unit).minutes();
        const partitionSpanMinutes = (60 % pointSpanMinutes === 0) ? pointSpanMinutes : 1;
        partitionSpan = { amount: partitionSpanMinutes, unit: 'minutes' };
        break;
    }
    case SIX_HOUR:
    case TWELVE_HOUR:
    case DAY:
        partitionSpan = { amount: 1, unit: 'hour' };
        break;
    case WEEK:
    case MONTH:
        partitionSpan = { amount: 1, unit: 'day' };
        break;
    case THREE_MONTH:
    case YEAR:
    default:
        partitionSpan = { amount: 1, unit: 'month' };
    }
    return partitions.map(p => fillPartition(p, granularity, partitionSpan));
};

// exported for testing only
export const decorateWithLabels = (partitions, granularity) => {
    let nameFn;
    switch (granularity) {
    case HOUR:
        nameFn = date => date.format(':mm');
        break;
    case SIX_HOUR:
        nameFn = date => `Hour ${(date.hour() % 6) + 1}`;
        break;
    case TWELVE_HOUR:
        nameFn = date => `Hour ${(date.hour() % 12) + 1}`;
        break;
    case DAY:
        nameFn = date => date.format('hA');
        break;
    case WEEK:
        nameFn = date => date.format('ddd');
        break;
    case MONTH:
        nameFn = date => date.format('Do');
        break;
    case THREE_MONTH:
        nameFn = date => `Month ${(date.month() % 3) + 1}`;
        break;
    case YEAR:
    default:
        nameFn = date => date.format('MMMM');
    }

    return partitions.map(group =>
        group.map(point => extend({ label: nameFn(point.date) }, point))
    );
};

export const processData = (rawTimeSeries, dataSeries, dataFieldName) => {
    const timeSeries = rawTimeSeries.map(date => moment(date));
    const pointSpan = computePointSpan(timeSeries);
    const totalSpan = computeTotalSpan(timeSeries);
    const granularity = computeGranularity(totalSpan);
    let partitions = partitionTimeSeries(timeSeries, granularity, pointSpan);
    partitions = decorateWithData(partitions, dataSeries, dataFieldName);
    partitions = fillNulls(partitions, granularity, pointSpan);
    partitions = decorateWithLabels(partitions, granularity);
    return partitions;
};

const computeGranularityFromPartitions = (partitions) => {
    const firstPartition = partitions[0];
    const firstDate = firstPartition[0].date;
    const secondDate = firstPartition[1].date;
    const lastDate = last(firstPartition).date;
    const pointSpan = spanBetweenDates(firstDate, secondDate);
    const partitionSpan = lastDate.clone().add(pointSpan.amount, pointSpan.unit)
        .diff(firstDate, 'seconds');

    if (partitionSpan >= MIN_SECONDS_PER_YEAR) {
        return YEAR;
    }
    if (partitionSpan >= 3 * MIN_SECONDS_PER_MONTH) {
        return THREE_MONTH;
    }
    if (partitionSpan >= MIN_SECONDS_PER_MONTH) {
        return MONTH;
    }
    if (partitionSpan >= 7 * MIN_SECONDS_PER_DAY) {
        return WEEK;
    }
    if (partitionSpan >= MIN_SECONDS_PER_DAY) {
        return DAY;
    }
    if (partitionSpan >= 12 * SECONDS_PER_HOUR) {
        return TWELVE_HOUR;
    }
    if (partitionSpan >= 6 * SECONDS_PER_HOUR) {
        return SIX_HOUR;
    }
    return HOUR;
};

export const computeSeriesNames = (partitions) => {
    const granularity = computeGranularityFromPartitions(partitions);
    let nameFn;
    switch (granularity) {
    case HOUR:
    case SIX_HOUR:
    case TWELVE_HOUR:
        nameFn = (start, end) => `${start.format('h:mm A')} - ${end.format('h:mm A')}`;
        break;
    case DAY:
        nameFn = start => start.format('MMM Do');
        break;
    case WEEK:
        nameFn = (start, end) => (start.month() === end.month() ?
            `${start.format('MMM Do')} - ${end.format('Do')}` :
            `${start.format('MMM Do')} - ${end.format('MMM Do')}`);
        break;
    case MONTH:
        nameFn = start => start.format('MMM');
        break;
    case THREE_MONTH:
        nameFn = (start, end) => `${start.format('MMM')} - ${end.format('MMM')}`;
        break;
    case YEAR:
    default:
        nameFn = start => start.format('YYYY');
    }
    return partitions.map((partition) => {
        const pointSpan = spanBetweenDates(partition[0].date, partition[1].date);
        return nameFn(
            partition[0].date,
            last(partition).date.clone().add(pointSpan.amount, pointSpan.unit)
        );
    });
};