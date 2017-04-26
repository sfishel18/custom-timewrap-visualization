/* eslint "import/no-extraneous-dependencies": ["error", {"devDependencies": true}] */
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const sharedConfig = require('../webpack/shared-config');

const extractCss = new ExtractTextPlugin({ filename: 'main.css' });

module.exports = {
    entry: path.join(__dirname, 'harness', 'main.js'),
    resolve: {
        modules: [path.join(__dirname, '..', 'src'), 'node_modules'],
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'build'),
    },
    module: {
        rules: [
            sharedConfig.BABEL_LOADER,
            {
                test: /\.css$/,
                use: extractCss.extract(['css-loader', 'postcss-loader']),
            },
        ],
    },
    plugins: [extractCss],
};