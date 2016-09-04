module.exports = {
    extends: 'airbnb',
    plugins: ['react'],
    rules: {
        // Set the required indent to 4 spaces
        indent: ['error', 4],
        // Do not require a newline at the end of every file
        'eol-last': 'off',
        'react/jsx-indent': 'off',
        'react/jsx-filename-extension': 'off'
    },
    env: {
        browser: true
    },
    settings: {
        'import/resolver': {
            'webpack': { config: './webpack.config.js' }
        }
    }
};