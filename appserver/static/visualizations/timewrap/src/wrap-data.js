const wrapData = (timeSeries, dataSeries, dataFieldName) => {
    const labels = [':00', ':10', ':20', ':30', ':40', ':50'];
    const seriesNames = ['10 AM - 11 AM', '11 AM - 12 PM', '12 PM - 1 PM', '1 PM - 2 PM'];
    const seriesList = [];
    seriesNames.forEach(() => seriesList.push([]));
    timeSeries.forEach((date, i) => {
        const seriesIndex = Math.floor(i / seriesNames.length);
        const labelIndex = i % labels.length;
        const datum = {
            label: labels[labelIndex],
            [dataFieldName]: dataSeries[i],
            date,
        };
        seriesList[seriesIndex].push(datum);
    });
    return seriesList.reduce(
        (memo, series, i) => Object.assign({}, memo, { [seriesNames[i]]: series }),
        {}
    );
};

export default wrapData;