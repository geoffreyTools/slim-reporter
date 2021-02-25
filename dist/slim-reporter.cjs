'use strict';

var Parser = require('tap-parser');
var stripAnsi = require('strip-ansi');
var chalk = require('chalk');
var fs = require('fs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var Parser__default = /*#__PURE__*/_interopDefaultLegacy(Parser);
var stripAnsi__default = /*#__PURE__*/_interopDefaultLegacy(stripAnsi);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);

const id = x => x;
const compose = (f, g) => x => f(g(x));
const apply = (f, x) => f(x);
const pipe = (...fs) => fs.reduceRight(compose, id);
const $pipe = (...fs) => pipe(...fs.slice(1))(fs[0]);
const _ = f => (x, ...xs) => xs.reduce(apply, f(x));
const eq = a => b => a === b;
const prop = p => a => a[p];
const defined = x => x !== undefined;
const hasProp = _(p => pipe(prop(p), defined));
const either = _(p => t => f => x => p(x) ? t(x) : f(x));
const not = f => (...xs) => !f(...xs);

const $ = method => (...args) => a => {
    if (!a || !a[method])
        throw new Error(`${a} doesn't have a method ${method}`);
    return a[method](...args)
};

const map = f => a =>
    Array.isArray(a)
    ? a.map(f)
    : Object.fromEntries(
        Object.entries(a).map(f)
    )
;

const $$ = (...xs) => xs.map($);

const repeat = _(s => n => Array(n).fill(s).join(''));
const spaces = repeat(' ');
const wrap = (before, after = before) => x => before + x + after;
const splitJoin = (f, s1, s2 = s1) => str =>
    f(str.split(s1)).join(s2)
;

const indent = _(n =>
    splitJoin(xs => xs.map(x => spaces(n) + x), '\n')
);

const wrapLine = _(max => indentation => str => {
    const lines = [''];
    let current = 0;

    str.split(' ').forEach(word => {
        const length = word.length
            + indentation
            + lines[current].length
        ;
        if (length > max) lines[++current] = '';

        return lines[current] += ' ' + word
    });

    return lines
        .map(x => x.trim())
        .map((x, i) => !i ? x : spaces(indentation) + x)
    ;
});

const safe = f => {
    let out;
    try {
        out = f();
    } catch {
        out = null;
    }
    return out;
};

const Event = (type, value) => {
    const is = (...xs) => xs.reduce(
        (a, b) => a || b === type,
        false
    );
    const isNot = not(is);
    return { value, is, isNot };
};

const passEvent = _(store => f => type => value =>
    f({ ...store.frame, event: Event(type, value) })
);

const isLog = text =>
    text && text.substring(0, 4) === '#   '
;

const cleanup = t => t.replace('#   ', '');

const removeLastReturn = log =>({
    ...log, message: log.message.replace(/\n$/m, '')
});

const concatMessage = (log, message) => ({
    ...log, message: log.message + message
});

const local = {
    result: null,
    log: null
};

// comments are emitted line by line with no reference to their parent result

var logEvent = (send, source) => value => {
    const { log, result } = local;

    if(source.is('comment') && isLog(value)) {
        const message = cleanup(value);
        if(log && log.result === result) {
            local.log = concatMessage(log, message);
        } else {
            local.log = { result, message };
        }
    } else if (source.is('result')) {
        if (log) send(removeLastReturn(log));
        local.result = value;
        local.log = null;
    } else if (source.is('complete')) {
        if(log) send(removeLastReturn(log));
    }
};

const map$1 = $('map');

const reduceStatus = xs =>
      xs.every(eq('pass')) ? 'pass'
    : xs.find(eq('fail'))  ? 'fail'
    : xs.every(eq('todo')) ? 'todo'
    : xs.every(eq('skip')) ? 'skip'
    : 'mixed'
;

const isLeaf = hasProp('ok');

const getStatus = searchChild => either(
    isLeaf,
    x =>
          x.skip ? 'skip'
        : x.todo ? 'todo'
        : x.ok ? 'pass'
        : 'fail',
    searchChild
);

const statusOf = getStatus(
    childNode => pipe(
        Object.values,
        map$1(getStatus(statusOf)),
        reduceStatus
    )(childNode)
);

const [find, reduce] = $$('find', 'reduce');

const push = (path, result, node, index = 0) => {
    const name = path[index];
    const next = node ? node[name] : {};
    const done = index === path.length - 1;
    return done
        ? { ...node, [name]: result }
        : { ...node, [name]: push(path, result, next, index + 1) }
    ;
};

const isLeaf$1 = hasProp('ok');

const flattenBranches = level => ([text, node]) => {
    const entry = {
        text, level, isLeaf: isLeaf$1(node), status: statusOf(node)
    };

    return (!isLeaf$1(node))
        ? [entry, ...fold(node, level + 1)]
        : [entry]
    ;
};

const fold = (node, level = 0) =>
    Object.entries(node)
    .flatMap(flattenBranches(level))
;

const last = arr => arr[arr.length -1];

const getLastResult = node =>
    !isLeaf$1(node)
    ? getLastResult(last(Object.entries(node)))
    : node
;

const ResultsTree = (pathResolver, root = {}) => ({
    root,
    push: result => ResultsTree(pathResolver, push(pathResolver(result), result, root)),
    entries: () => fold(root),
    latest: () => getLastResult(root)
});

const findResult = (name, i) =>
    find(({ level, text }) => level === i && name === text)
;

const filterResults = _(results =>
    reduce((acc, name, i) =>
        [ ...acc, findResult(name, i)(results) ],
    [])
);

const resolvePath = ({ name }) => name.split(' › ');

const init = () => ({
    frame: {
        event: null,
        needsUpdate: false,
        write_lock: false,
        elapsed: 0,
        resultsTree: ResultsTree(resolvePath),
        results: [],
        logs: [],
        failures: [],
        summary: null,
        render: '',
        end: false
    }
});

const mutate = store => state => {
    store.frame = { ...state };
    return state;
};

const computeLog = _(results => log => ({
    ...log, subset: filterResults(results, log.path)
}));

const assocPath = _(log => ({
    ...log, path: resolvePath(log.result)
}));

const updateLogs = ({ results, logs, event }) =>
    event.is('log')
    ? [...logs, assocPath(event.value)]
    : event.is('complete')
    ? logs.map(computeLog(results))
    : logs
;

const updateFailures = ({ failures, event }) =>
    event.is('fail')
    ? [...failures, event.value]
    : failures
;

const updateResults = ({ resultsTree, event }) => {
    if (!event.is('result')) return {};

    const newTree = resultsTree.push(event.value);

    return {
        resultsTree: newTree,
        results: newTree.entries(),
    }
};

const updateElapsed = ({ elapsed }) =>
    elapsed + 1
;

const updateSummary = ({ summary, event }) =>
    event.is('complete')
    ? event.value
    : summary
;

const updateNeedsUpdate = ({ event }) =>
    event.isNot('write', 'log', 'fail')
;

const updateWriteLock = ({ write_lock, event }) =>
    event.is('write')
    ? event.value.write_lock
    : write_lock
;


const updateEnd = ({ write_lock, summary, event }) =>
    event.isNot('complete') && summary && !write_lock
;

const update = state => ({
    ...state,
    ...updateResults(state),
    logs: updateLogs(state),
    failures: updateFailures(state),
    elapsed: updateElapsed(state),
    summary: updateSummary(state),
    needsUpdate: updateNeedsUpdate(state),
    write_lock: updateWriteLock(state),
    end: updateEnd(state)
});

const split = $('split');

const options = process.argv
    .slice(2)
    .map(split('='))
    .reduce((acc, [key, val]) => {
        acc[key] = defined(val) ? val : true;
        return acc;
    }, {})
;

const width = () =>
    Math.min(process.stdout.columns, options['max-width'] || Infinity)
;
const indent$1 = options.indent || 2;
const verbose = Boolean(options.verbose);
const resize = Boolean(options.resize);
const themeVariant = options.theme || 'dark';

var options$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    width: width,
    indent: indent$1,
    verbose: verbose,
    resize: resize,
    themeVariant: themeVariant
});

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
    fs.readFileSync(
        './slim-reporter-theme.json',
        { encoding: 'utf8', flag: 'r' }
    )
);

const readColors = _(model => map(
    ([key, value]) => [key, chalk__default['default'][model](...value)]
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

var theme$1 = theme[themeVariant] || theme.dark;

const replace = $('replace');

const hasStyle = x => x !== stripAnsi__default['default'](x);
const length = text => stripAnsi__default['default'](text).length;

const colors = theme$1.text;
const bg = theme$1.background;

chalk__default['default'].italic;
const underline = chalk__default['default'].underline;
const bold = chalk__default['default'].bold;

const icons = {
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
const last$1 = match(/(\S)\s*$/);

const isJSONLike = str => {
    const startBrackets = ['[', '{'];
    const endBrackets = { '[': ']', '{': '}' };
    return (
        startBrackets.includes(first(str))
        && endBrackets[first(str)] === last$1(str)
    );
};

const syntaxColor = pipe(
    replace(/(\{|\}|\[|\])/g, colors.braces('$1')),
    replace(/( \d+)/g, colors.digit('$1')),
    replace(/( \w+:)/g, colors.default('$1')),
    replace(/,/g, colors.default(',')),
    colors.word
);

const entryStyle = (level, isLeaf) => text =>
    isLeaf
    ? text
    : level === 0
    ? bold(text)
    : level === 1
    ? underline(text)
    : text
;

const [map$2, flatMap, join] = $$('map', 'flatMap', 'join');

const wrap$1 = (width, indent) => level => wrapLine(width, level * indent + 2);

const entryLayout = indent => entry => (text, line) => {
    const { level, isLeaf, status } = entry;
    const indentation = spaces(level * indent);
    const bullet = icons[status];
    const spaceAbove = (level === 0 && !isLeaf) ? '\n' : '';
    return line === 0
        ? `${spaceAbove}${indentation}${bullet} ${text}`
        : text
};

const formatEntry = _(wrap => layout => entry =>
    pipe(
        entryStyle(entry.level, entry.isLeaf),
        wrap(entry.level),
        map$2(layout(entry))
    )(entry.text)
);

const formatEntries = (wrap, layout) => xs =>
    flatMap(formatEntry(wrap, layout))(xs)
;

var Entries = (width, indent) => pipe(
    formatEntries(
        wrap$1(width(), indent),
        entryLayout(indent)
    ),
    join('\n')
);

const _title = (color, width, text='') => {
    const w = Math.max(2, width - length(text));
    const space = spaces(Math.floor(w / 2));
    return color(space + text + space);
};

var Title = ({ width }) => _(color => text => {
    const render = text => _title(color, width(), text);

    return hasStyle(text)
        ? render(text)
        : wrapLine(width() - 1, 1, text)
            .map(render)
            .join('\n')
    ;
});

const dots = (n, i) =>
    i === undefined
    ? i => dots(n, i)
    : repeat('.', (i + 1) % (n + 1))
;

var Loading = waits => 'awaiting results' + dots(3, waits);

const join$1 = $('join');

const layout = _(Title => pipe(
    report => [
        Title(bg.info, 'Test Report'),
        report.replace(/^\n{2}/, '\n')
    ],
    join$1('\n'),
));

var Report = _(Entries => Title => pipe(
    Entries,
    xs => xs.length ? layout(Title, xs) : ''
));

const [filter, join$2] = $$('filter', 'join');

const print = (s, x) =>
    !x ? null : colors[s](icons[s] + ' ' + x)
;

const space = pipe(filter(id), join$2(colors.info.bold(' | ')));


const render = ({ count, fail, pass, skip, todo }) =>
    space([
        print('run', count - todo - skip),
        print('pass', pass - skip),
        print('fail', fail - todo),
        print('skip', skip),
        print('todo', todo)
    ])
;

var Summary = _(Title => summary =>
    Title(bg.info, render(summary))
);

const [slice, replace$1, join$3, map$3, split$1] = $$('slice', 'replace', 'join', 'map', 'split');

const style = _(type => pipe(
    syntaxColor,
    bg[type],
    replace$1(type, icons[type])
));

const render$1 = pipe(
    splitJoin(map$3(line => line && style(line[0], line)), '\n')
);

const coordOf = replace$1(/^[^0-9]*/, ''); splitJoin(slice(-2), ':');

const difference = prop('Difference:');

const messageDetails = values =>
    !values
    ? ''
    : difference(values)
    ? render$1(difference(values))
    : $pipe(values, Object.values, join$3('/n'), indent(3), syntaxColor)
;

const messageSummary = (message, values) =>
    values && difference(values)
    ? 'Difference:\n'
    : (message && values)
    ? message + ':\n'
    : message + '.'
;

const bannerText = ({ name, assertion, at }) => {
    const detail = assertion && wrap('(', ')')(assertion);
    const location = at && `at ${coordOf(at)}`;
    return [name, detail, location].filter(id).join(' ')
};

const diagnosis = (title, origin) => (text, details) =>
    [
        title(bg.fail, bannerText(details)) + '\n',
        origin(text),
        messageSummary(details.message, details.values),
        messageDetails(details.values)
    ].filter(id).join('\n')
;

const format = (indent) => (line, i, arr) =>
    spaces(i * indent)
    + icons.fail
    + ' ' + entryStyle(i, i === arr.length - 1)(line) + '\n'
;

const cascade = _(indent => pipe(
    split$1(' › '),
    map$3(format(indent)),
    join$3('')
));


var Failure = _(title => indent => map$3(
    ({ name, diag }) => {
        return diag
        ? diagnosis(title, cascade(indent))(name, diag)
        : title(bg.fail, 'Error') + wrap('\n')(cascade(indent, name))
    }
));

const [map$4, join$4] = $$('map', 'join');

const layout$1 = title => pipe(
    ({ origin, message }) => [title, origin, message],
    join$4('\n')
);

const formatMessage = either(isJSONLike, syntaxColor, id);

const format$1 = Entries => ({ subset, message }) => {
    const origin = Entries(subset) + '\n';
    return { origin, message: formatMessage(message) };
};

var Log = _(Entries => Title => pipe(
    map$4(pipe(
        format$1(Entries),
        layout$1(Title(bg.log, 'Log'))
    )),
));

const [filter$1, join$5, concat] = $$('filter', 'join', 'concat');

const layout$2 = pipe(
    filter$1(id),
    join$5('\n\n'),
    concat('\n'),
);

const render$2 = ({ width, indent, verbose }) => {
    const $Entries = Entries(width, indent);
    const $Title = Title({width});

    return state => [
        verbose && Report($Entries, $Title, state.results),
        state.summary && [
            Failure($Title, indent, state.failures),
            verbose && Log($Entries, $Title, state.logs),
            Summary($Title, state.summary)
        ],
        !state.summary && Loading(state.elapsed)
    ].flat(2);
};

var render$3 = options => state => ({
    ...state, render: $pipe(state, render$2(options), layout$2)
});

const clearAll = '\x1Bc\r';

var print$1 = event => state => {
    if (state.needsUpdate && !state.write_lock) {
        event('write', { write_lock: true });

        process.stdout.write(
            clearAll + state.render,
            null,
            () => setTimeout(
                () => event('write', { write_lock: false }),
                20
            )
        );
    }

    return state;
};

var resize$1 = (resize, event) => {
    if (resize) {
        process.stdout.on('resize', event);
        // keep the terminal session open
        setInterval(() => {}, 300);
    }
};

var Clock = (event, delta) => {
    const timer = setInterval(event, delta);
    return { stop: () => clearInterval(timer) }
};

const store = init();

const main = state =>
    $pipe(
        state,
        update,
        render$3(options$1),
        mutate(store),
        print$1(event),
        release(clock)
    )
;

const parser = new Parser__default['default']();
const event = _(passEvent(store, main));
const register = e => logEvent(event('log'), Event(e));

parser.on('result', event('result'));
parser.on('comment', register('comment'));
parser.on('complete', register('complete'));
parser.on('result', register('result'));
parser.on('complete', event('complete'));
parser.on('fail', event('fail'));
resize$1(resize, event('resize'));
const clock = Clock(event('clock'), 120);

const release = clock => ({ end }) =>
    end && clock.stop()
;

process.stdin.pipe(parser);

console.clear();
//# sourceMappingURL=slim-reporter.cjs.map
