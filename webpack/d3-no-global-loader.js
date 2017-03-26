module.exports = function d3NoGlobalLoader(source) {
    return [
        'var _d3 = window.d3;',
        source,
        'window.d3 = _d3;',
    ].join(' ');
};