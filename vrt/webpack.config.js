/* eslint "import/no-extraneous-dependencies": ["error", {"devDependencies": true}] */
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const sharedConfig = require('../webpack/shared-config');

const extractCss = new ExtractTextPlugin('main.css');

module.exports = {
    entry: path.join(__dirname, 'harness', 'main.js'),
    resolve: {
        root: [
            path.join(__dirname, '..', 'src'),
        ],
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'build'),
    },
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