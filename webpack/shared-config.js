/* eslint "import/no-extraneous-dependencies": ["error", {"devDependencies": true}] */
const postcssImport = require('postcss-import');
const selectorNamespace = require('postcss-selector-namespace');

const BABEL_LOADER = {
    test: /.js$/,
    loader: 'babel-loader',
    exclude: /node_modules/,
    query: {
        cacheDirectory: true,
        presets: ['babel-preset-es2015', 'babel-preset-react'],
        plugins: ['babel-plugin-add-module-exports'],
    },
};

const postcss = () =>
    [postcssImport, selectorNamespace({ namespace: '.custom-timewrap-visualization' })];

module.exports = { BABEL_LOADER, postcss };