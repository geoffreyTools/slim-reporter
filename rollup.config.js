import babel from '@rollup/plugin-babel';
import shebang from 'rollup-plugin-preserve-shebang';

export default {
    input: 'src/index.js',
    output: {
        file: 'dist/slim-reporter.js',
        sourcemap: true,
        format: 'es'
    },
    plugins: [
        shebang(),
        babel({ babelHelpers: 'bundled' })
    ],
    external: [
        'tap-parser',
        'strip-ansi',
        'chalk',
        'fs'
    ]
};