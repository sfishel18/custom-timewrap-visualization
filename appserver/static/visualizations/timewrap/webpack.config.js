/* eslint import/no-extraneous-dependencies: "off" */

const path = require('path');
const postcssImport = require('postcss-import');
const selectorNamespace = require('postcss-selector-namespace');

module.exports = {
    entry: 'visualization_source',
    resolve: {
        root: [
            path.join(__dirname, 'src'),
        ],
    },
    output: {
        filename: 'visualization.js',
        libraryTarget: 'amd',
    },
    externals: [
        'vizapi/SplunkVisualizationBase',
        'vizapi/SplunkVisualizationUtils',
    ],
    module: {
        loaders: [
            {
                test: /.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    cacheDirectory: true,
                    presets: ['babel-preset-es2015', 'babel-preset-react'],
                    plugins: ['babel-plugin-add-module-exports'],
                },
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader!postcss-loader',
            },
        ],
    },
    postcss() {
        return [postcssImport, selectorNamespace({ namespace: '.custom-timewrap-visualization' })];
    },
};