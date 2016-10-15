/* eslint-disable import/no-unresolved, import/no-extraneous-dependencies */
import SplunkVisualizationBase from 'api/SplunkVisualizationBase';
import SplunkVisualizationUtils from 'api/SplunkVisualizationUtils';
/* eslint-enable import/no-unresolved, import/no-extraneous-dependencies */

import moment from 'moment';
import React from 'react';
import ReactDom from 'react-dom';
import findIndex from 'lodash/findIndex';
import TimewrapChart from './charting/TimewrapChart';

export default SplunkVisualizationBase.extend({

    initialize() {
        this.onPointSelect = this.onPointSelect.bind(this);
    },

    getInitialDataParams() {
        return ({
            outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
            count: 10000,
        });
    },

    formatData(rawData) {
        const data = {
            timeSeries: (rawData.columns[0] || []).map(SplunkVisualizationUtils.parseTimestamp),
            dataFields: [],
            dataSeries: [],
        };

        rawData.fields.slice(1).forEach((field, i) => {
            if (field.name[0] === '_') {
                return;
            }
            data.dataFields.push(field.name);
            data.dataSeries.push(rawData.columns[i + 1].map(parseFloat));
        });

        const spanFieldIndex = rawData.fields.findIndex(field => field.name === '_span');
        if (spanFieldIndex > -1) {
            data.spanSeries = rawData.columns[spanFieldIndex].map(parseFloat);
        }

        return data;
    },

    updateView(data, rawConfig) {
        const config = {};
        const { propertyNamespace } = this.getPropertyNamespaceInfo();
        Object.keys(rawConfig).forEach((key) => {
            config[key.replace(propertyNamespace, '')] = rawConfig[key];
        });
        ReactDom.render(
            <TimewrapChart
                width={this.el.clientWidth}
                height={this.el.clientHeight}
                {...config}
                {...data}
                colors={SplunkVisualizationUtils.getColorPalette('splunkCategorical')}
                onPointSelect={this.onPointSelect}
            />,
            this.el
        );
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
        ReactDom.unmountComponentAtNode(this.el);
    },
});