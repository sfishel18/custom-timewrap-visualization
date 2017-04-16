/* eslint "import/no-extraneous-dependencies": ["error", {"devDependencies": true}] */
const postcssImport = require('postcss-import');
const selectorNamespace = require('postcss-selector-namespace');

module.exports = {
    plugins: [
        postcssImport,
        selectorNamespace({ namespace: '.custom-timewrap-visualization' }),
    ],
};