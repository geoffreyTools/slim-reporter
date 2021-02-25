const input = 'src/index.js';

const es6 = {
    file: 'dist/slim-reporter.mjs',
    sourcemap: true,
    format: 'es'
}

const commonJS = {
    file: 'dist/slim-reporter.cjs',
    sourcemap: true,
    format: 'cjs'
};

export default {
    input,
    output: [es6, commonJS],
    external: [
        'tap-parser',
        'strip-ansi',
        'chalk',
        'fs'
    ]
};
