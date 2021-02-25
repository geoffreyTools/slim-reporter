import chalk from 'chalk';
import { readFileSync } from 'fs';
import { themeVariant } from '../options.js';
import { id, pipe, map, safe, _ } from '../utils.js';

const defaultDescription = {
    dark: {
        text: {
            default: [0, 0, 85],
            pass: [100, 100, 37],
            fail: [0, 100, 60],
            info: [223, 30, 30],
            skip: [50, 100, 50],
            todo: [200, 100, 55],
            mixed: [0, 0, 65],
            run:  [270, 80, 65],
            digit: [55, 100, 55],
            braces: [255, 80, 70],
            word: [16, 87, 65]
        },
        background: {
            fail: [355, 50, 27],
            info: [223, 27, 22],
            log: [215, 35, 27],
            '+': [160, 30, 25],
            '-': [340, 30, 25],
        }
    },
    light: {
        text: {
            default: [0, 0, 35],
            pass: [100, 100, 37],
            fail: [0, 100, 60],
            info: [220, 65, 96],
            skip: [50, 100, 50],
            todo: [200, 100, 55],
            mixed: [0, 0, 65],
            run:  [270, 80, 65],
            digit: [16, 100, 55],
            braces: [255, 80, 70],
            word: [165, 100, 37]
        },
        background: {
            fail: [0, 100, 86],
            info: [220, 55, 93],
            log: [180, 45, 90],
            '+': [160, 50, 90],
            '-': [340, 50, 90],
        }
    }
};

const emptyVariant = { text: {}, background: {} };

const getUserTheme = () => JSON.parse(
    readFileSync(
        './slim-reporter-theme.json',
        { encoding: 'utf8', flag: 'r' }
    )
);

const readColors = _(model => map(
    ([key, value]) => [key, chalk[model](...value)]
));

const readVariant = (d, { text, background }) => ({
    text: readColors('hsl', { ...d.text, ...text }),
    background: {
        ...readColors('bgHsl', { ...d.background, ...background }),
        ... { ' ': id }
    }
});

const readTheme = _(dfault => pipe(
    theme => theme ? { ...dfault, ...theme } : dfault,
    map(([name, variant]) =>
        [name, readVariant(dfault[name] || emptyVariant, variant)]
    ),
));

const theme = readTheme(defaultDescription, safe(getUserTheme));

export default theme[themeVariant] || theme.dark;
