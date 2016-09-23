module.exports = {
    env: { mocha: true },
    plugins: ['mocha'],
    rules: {
        'import/no-extraneous-dependencies': [
            'error',
            { devDependencies: true }
        ],
        'mocha/no-exclusive-tests': 'error'
    }
}