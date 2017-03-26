/* eslint "import/no-extraneous-dependencies": ["error", {"devDependencies": true}] */
const path = require('path');
const UglifyJsPlugin = require('webpack').optimize.UglifyJsPlugin;
const DefinePlugin = require('webpack').DefinePlugin;
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const sharedConfig = require('./webpack/shared-config');

const extractCss = new ExtractTextPlugin('visualization.css');
const plugins = [
    extractCss,
    new DefinePlugin({
        'process.env': {
            NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        },
    }),
];

if (process.env.NODE_ENV === 'production') {
    plugins.push(new UglifyJsPlugin({ compress: { warnings: false } }));
}

module.exports = {
    entry: 'visualization_source',
    resolve: {
        root: [
            path.join(__dirname, 'src'),
        ],
    },
    resolveLoader: {
        modulesDirectories: [path.join(__dirname, 'webpack'), 'node_modules'],
    },
    output: {
        filename: 'visualization.js',
        path: path.join(__dirname, 'appserver', 'static', 'visualizations', 'timewrap'),
        libraryTarget: 'amd',
    },
    externals: [
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils',
    ],
    module: {
        loaders: [
            sharedConfig.BABEL_LOADER,
            {
                test: /\.css$/,
                loader: extractCss.extract(['css', 'postcss']),
            },
            {
                test: /d3/,
                loader: 'd3-no-global-loader',
            },
        ],
    },
    plugins,
    postcss: sharedConfig.postcss,
};