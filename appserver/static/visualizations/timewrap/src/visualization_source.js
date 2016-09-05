/* eslint-disable import/no-unresolved, import/no-extraneous-dependencies */
import SplunkVisualizationBase from 'vizapi/SplunkVisualizationBase';
/* eslint-disable import/no-unresolved, import/no-extraneous-dependencies */

import moment from 'moment';
import React from 'react';
import ReactDom from 'react-dom';
import TimewrapChart from './TimewrapChart';

const parseTimestamp = timestamp => moment(timestamp).toDate();

const COLORS = [
    '#0000ff',
    '#ffff00',
    '#ff0000',
    '#00ff00',
    '#ff00ff',
];

export default SplunkVisualizationBase.extend({

    getInitialDataParams() {
        return ({
            outputMode: SplunkVisualizationBase.COLUMN_MAJOR_OUTPUT_MODE,
            count: 10000,
        });
    },

    formatData(rawData) {
        const data = {
            timeSeries: (rawData.columns[0] || []).map(parseTimestamp),
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

        return data;
    },

    updateView(data, rawConfig) {
        const config = {};
        const { propertyNamespace } = this.getPropertyNamespaceInfo();
        Object.keys(rawConfig).forEach(key => {
            config[key.replace(propertyNamespace, '')] = rawConfig[key];
        });
        ReactDom.render(
            <TimewrapChart {...config} {...data} colors={COLORS} />,
            this.el
        );
    },

    remove() {
        ReactDom.unmountComponentAtNode(this.el);
    },
});