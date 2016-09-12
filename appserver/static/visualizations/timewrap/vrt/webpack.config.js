/* eslint "import/no-extraneous-dependencies": ["error", {"devDependencies": true}] */
const path = require('path');
const postcssImport = require('postcss-import');
const selectorNamespace = require('postcss-selector-namespace');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const extractCss = new ExtractTextPlugin('main.css');

module.exports = {
    entry: path.join(__dirname, 'main.js'),
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
                loader: extractCss.extract(['css', 'postcss']),
            },
        ],
    },
    plugins: [extractCss],
    postcss() {
        return [postcssImport, selectorNamespace({ namespace: '.custom-timewrap-visualization' })];
    },
};