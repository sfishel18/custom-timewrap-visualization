/* eslint "import/no-extraneous-dependencies": ["error", {"devDependencies": true}] */
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const sharedConfig = require('./webpack/shared-config');

const extractCss = new ExtractTextPlugin('visualization.css');

module.exports = {
    entry: 'visualization_source',
    resolve: {
        root: [
            path.join(__dirname, 'src'),
        ],
    },
    output: {
        filename: 'visualization.js',
        path: path.join(__dirname, 'appserver', 'static', 'visualizations', 'timewrap'),
        libraryTarget: 'amd',
    },
    externals: [
        'vizapi/SplunkVisualizationBase',
        'vizapi/SplunkVisualizationUtils',
    ],
    module: {
        loaders: [
            sharedConfig.BABEL_LOADER,
            {
                test: /\.css$/,
                loader: extractCss.extract(['css', 'postcss']),
            },
        ],
    },
    plugins: [extractCss],
    postcss: sharedConfig.postcss,
};