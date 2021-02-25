import stripAnsi from 'strip-ansi';
import chalk from 'chalk';
import theme from './theme.js';
import { pipe, $ } from '../utils.js';
const replace = $('replace');

export const hasStyle = x => x !== stripAnsi(x);
export const length = text => stripAnsi(text).length;

export const colors = theme.text;
export const bg = theme.background;

export const italic = chalk.italic;
export const underline = chalk.underline;
export const bold = chalk.bold;

export const icons = {
    pass: colors.pass('✔'),
    fail: colors.fail.bold('⨯'),
    skip: colors.skip.bold('>'),
    todo: colors.todo.bold('❏'),
    mixed: colors.mixed.bold('✎'),
    run: colors.run.bold('⚑'),
    '+': colors.pass.bold('+'),
    '-': colors.fail.bold('-'),
    ' ': ' '
};

const match = reg => str => {
    const matches = reg.exec(str);
    return matches && matches[1];
};

const first = match(/^\s*(\S)/);
const last = match(/(\S)\s*$/);

export const isJSONLike = str => {
    const startBrackets = ['[', '{'];
    const endBrackets = { '[': ']', '{': '}' };
    return (
        startBrackets.includes(first(str))
        && endBrackets[first(str)] === last(str)
    );
};

export const syntaxColor = pipe(
    replace(/(\{|\}|\[|\])/g, colors.braces('$1')),
    replace(/( \d+)/g, colors.digit('$1')),
    replace(/( \w+:)/g, colors.default('$1')),
    replace(/,/g, colors.default(',')),
    colors.word
);

export const entryStyle = (level, isLeaf) => text =>
    isLeaf
    ? text
    : level === 0
    ? bold(text)
    : level === 1
    ? underline(text)
    : text
;