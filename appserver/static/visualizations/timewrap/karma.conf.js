const _ = require('lodash');
const webpackConfig = require('./webpack.config');

module.exports = function karmaConfig(config) {
    config.set({
        basePath: '',
        frameworks: ['mocha'],
        plugins: [
            'karma-mocha',
            'karma-phantomjs-launcher',
            'karma-webpack',
            'karma-mocha-reporter',
        ],
        files: [{ pattern: 'test/**/*-test.js', watched: false }],
        preprocessors: { 'test/**/*-test.js': ['webpack'] },
        webpack: _.pick(webpackConfig, 'resolve', 'module'),
        webpackMiddleware: { stats: 'errors-only' },
        reporters: ['mocha'],
        mochaReporter: { showDiff: true },
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['PhantomJS'],
        singleRun: false,
        concurrency: Infinity,
        client: {
            mocha: { ui: 'tdd' },
        },
    });
};
