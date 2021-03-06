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
        webpack: Object.assign(
            _.pick(webpackConfig, 'resolve', 'module', 'plugins'),
            {
                // https://github.com/airbnb/enzyme/blob/master/docs/guides/webpack.md
                externals: {
                    cheerio: 'window',
                    'react/addons': true,
                    'react/lib/ExecutionEnvironment': true,
                    'react/lib/ReactContext': true,
                },
            }
        ),
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
