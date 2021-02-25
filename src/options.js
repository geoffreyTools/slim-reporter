import { defined, $ } from './utils.js';
const split = $('split');

const options = process.argv
    .slice(2)
    .map(split('='))
    .reduce((acc, [key, val]) => {
        acc[key] = defined(val) ? val : true;
        return acc;
    }, {})
;

export const width = () =>
    Math.min(process.stdout.columns, options['max-width'] || Infinity)
;
export const indent = options.indent || 2;
export const verbose = Boolean(options.verbose);
export const resize = Boolean(options.resize);
export const themeVariant = options.theme || 'dark';
