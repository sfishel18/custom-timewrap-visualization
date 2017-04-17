module.exports = {
    env: { mocha: true, node: true },
    plugins: ['mocha'],
    rules: {
        'import/no-extraneous-dependencies': [
            'error',
            { devDependencies: true }
        ],
        'mocha/no-exclusive-tests': 'error',
        'func-names': 'off',
    }
}