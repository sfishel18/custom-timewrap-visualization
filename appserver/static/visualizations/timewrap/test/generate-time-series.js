import moment from 'moment';
import times from 'lodash/times';

export default (start, length, step, stepUnit = 'seconds') => {
    const timeSeries = [moment(start)];
    times(length - 1, i => {
        timeSeries.push(moment(start).add(step * (i + 1), stepUnit));
    });
    return timeSeries;
};