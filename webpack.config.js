/* eslint "import/no-extraneous-dependencies": ["error", {"devDependencies": true}] */
const path = require('path');
const UglifyJsPlugin = require('webpack').optimize.UglifyJsPlugin;
const DefinePlugin = require('webpack').DefinePlugin;
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const sharedConfig = require('./webpack/shared-config');

const extractCss = new ExtractTextPlugin({ filename: 'visualization.css' });
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

process.traceDeprecation = true;

module.exports = {
    entry: 'visualization_source',
    resolve: {
        modules: [path.join(__dirname, 'src'), 'node_modules'],
    },
    resolveLoader: {
        modules: [path.join(__dirname, 'webpack'), 'node_modules'],
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
        rules: [
            sharedConfig.BABEL_LOADER,
            {
                test: /\.css$/,
                use: extractCss.extract({ use: ['css-loader', 'postcss-loader'] }),
            },
            // {
            //     test: /^d3$/,
            //     use: {
            //         loader: 'd3-no-global-loader',
            //     },
            // },
        ],
    },
    plugins,
};