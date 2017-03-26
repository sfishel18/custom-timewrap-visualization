import moment from 'moment';
import findIndex from 'lodash/findIndex';

export default (date, dateSeries, spanSeries) => {
    const matchingIndex = findIndex(dateSeries, d => moment(d).isSame(date));
    if (matchingIndex === -1) {
        return 1;
    }
    if (spanSeries && spanSeries[matchingIndex]) {
        return spanSeries[matchingIndex];
    }
    const nextDate = dateSeries[matchingIndex + 1];
    if (nextDate) {
        return moment(nextDate).diff(date, 'seconds');
    }
    const previousDate = dateSeries[matchingIndex - 1];
    if (previousDate) {
        return moment(date).diff(previousDate, 'seconds');
    }
    return 1;
};