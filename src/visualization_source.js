/* eslint-disable import/no-unresolved, import/no-extraneous-dependencies, import/extensions */
import SplunkVisualizationBase from 'api/SplunkVisualizationBase';
import SplunkVisualizationUtils from 'api/SplunkVisualizationUtils';
/* eslint-enable import/no-unresolved, import/no-extraneous-dependencies */

import moment from 'moment';
import some from 'lodash/some';
import findIndex from 'lodash/findIndex';
import TimewrapChart from './charting/TimewrapChart';
import { processData, decorateWithLabels, computeSeriesNames } from './format-data';

export default SplunkVisualizationBase.extend({

    initialize() {
        this.chart = new TimewrapChart(this.el, SplunkVisualizationUtils.getColorPalette('splunkCategorical'));
        this.onPointSelect = this.onPointSelect.bind(this);
        this.chart.onClick(this.onPointSelect);
    },

    getInitialDataParams() {
        return ({
            outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
            count: 10000,
        });
    },

    formatData(rawData) {
        if (!rawData || rawData.fields.length === 0) {
            return null;
        }
        const timeSeries = (rawData.columns[0] || []).map(SplunkVisualizationUtils.parseTimestamp);
        if (some(timeSeries, date => !isFinite(date))) {
            throw new SplunkVisualizationBase.VisualizationError('First column of results must contain timestamps');
        }
        let dataField = null;
        let dataSeries = null;
        for (let i = 1; i < rawData.fields.length; i += 1) {
            const field = rawData.fields[i];
            if (field.name[0] !== '_') {
                dataField = field.name;
                dataSeries = rawData.columns[i];
                break;
            }
        }

        let spanSeries = null;
        const spanFieldIndex = rawData.fields.findIndex(field => field.name === '_span');
        if (spanFieldIndex > -1) {
            spanSeries = rawData.columns[spanFieldIndex].map(parseFloat);
        }

        return {
            vizData: processData(timeSeries, dataSeries, dataField),
            timeSeries,
            spanSeries,
        };
    },

    updateView(data, rawConfig) {
        if (data === null) {
            return;
        }
        const config = {};
        const { propertyNamespace } = this.getPropertyNamespaceInfo();
        Object.keys(rawConfig).forEach((key) => {
            config[key.replace(propertyNamespace, '')] = rawConfig[key];
        });

        let { vizData } = data;
        vizData = decorateWithLabels(vizData, config.axisLabelFormat || null);
        const seriesNames = computeSeriesNames(vizData, config.legendFormat || null);
        this.chart.update(vizData, config, seriesNames);
    },

    onPointSelect(pointInfo, event) {
        const data = this.getCurrentData();
        const matchingIndex = findIndex(data.timeSeries, date =>
            moment(date).isSame(pointInfo.date)
        );
        const epochDateSeconds = pointInfo.date.getTime() / 1000;
        const span = data.spanSeries[matchingIndex];
        this.drilldown({
            earliest: epochDateSeconds,
            latest: epochDateSeconds + span,
        }, event);
    },

    reflow() {
        this.invalidateUpdateView();
    },

    remove() {
        this.chart.remove();
    },
});