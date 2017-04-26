const BABEL_LOADER = {
    test: /.js$/,
    exclude: /node_modules/,
    use: {
        loader: 'babel-loader',
        options: {
            cacheDirectory: true,
            presets: ['babel-preset-es2015'],
            plugins: ['babel-plugin-add-module-exports'],
        },
    },
};

module.exports = { BABEL_LOADER };