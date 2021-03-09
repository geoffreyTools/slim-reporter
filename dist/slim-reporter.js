#!/usr/bin/env node
import Parser from 'tap-parser';
import stripAnsi from 'strip-ansi';
import chalk from 'chalk';
import { readFileSync } from 'fs';

const id = x => x;

const compose = (f, g) => x => f(g(x));

const apply = (f, x) => f(x);

const pipe = (...fs) => fs.reduceRight(compose, id);
const _ = f => (x, ...xs) => xs.reduce(apply, f(x));
const eq = a => b => a === b;
const prop = p => a => a[p];
const defined = x => x !== undefined;
const hasProp = _(p => pipe(prop(p), defined));
const either = _(p => t => f => x => p(x) ? t(x) : f(x));
const last$1 = arr => arr[arr.length - 1];
const init$1 = arr => arr.slice(0, -1);
const empty = arr => !arr.length;
const not = f => (...xs) => !f(...xs);
const $ = method => (...args) => a => {
  if (!a || !a[method]) throw new Error(`${a} doesn't have a method ${method}`);
  return a[method](...args);
};
const map$6 = f => a => Array.isArray(a) ? a.map(f) : Object.fromEntries(Object.entries(a).map(f));
const $$ = (...xs) => xs.map($);
const repeat = _(s => n => Array(n).fill(s).join(''));
const spaces = repeat(' ');
const wrap = (before, after = before) => x => before + x + after;
const splitJoin = (f, s1, s2 = s1) => str => f(str.split(s1)).join(s2);
const indent$1 = _(n => splitJoin(xs => xs.map(x => spaces(n) + x), '\n'));
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
  const is = (...xs) => xs.reduce((a, b) => a || b === type, false);

  const isNot = not(is);
  return {
    value,
    is,
    isNot
  };
};
const passEvent = _(store => f => type => value => f({ ...store.frame,
  event: Event(type, value)
}));

const isLog = text => text && text.substring(0, 4) === '#   ';

const cleanup = t => t.replace('#   ', '');

const removeLastReturn = log => ({ ...log,
  message: log.message.replace(/\n$/m, '')
});

const concatMessage = (log, message) => ({ ...log,
  message: log.message + message
});

const local = {
  result: null,
  log: null
}; // comments are emitted line by line with no reference to their parent result

var logEvent = ((send, source) => value => {
  const {
    log,
    result
  } = local;

  if (source.is('comment') && isLog(value)) {
    const message = cleanup(value);

    if (log && log.result === result) {
      local.log = concatMessage(log, message);
    } else {
      local.log = {
        result,
        message
      };
    }
  } else if (source.is('result')) {
    if (log) send(removeLastReturn(log));
    local.result = value;
    local.log = null;
  } else if (source.is('complete')) {
    if (log) send(removeLastReturn(log));
  }
});

const map$5 = $('map');

const reduceStatus = xs => xs.every(eq('pass')) ? 'pass' : xs.find(eq('fail')) ? 'fail' : xs.every(eq('todo')) ? 'todo' : xs.every(eq('skip')) ? 'skip' : 'mixed';

const isLeaf$1 = hasProp('ok');

const getStatus = searchChild => either(isLeaf$1, x => x.skip ? 'skip' : x.todo ? 'todo' : x.ok ? 'pass' : 'fail', searchChild);

const statusOf = getStatus(childNode => {
  var _ref, _ref2, _childNode;

  return _ref = (_ref2 = (_childNode = childNode, Object.values(_childNode)), map$5(getStatus(statusOf))(_ref2)), reduceStatus(_ref);
});

const [find, reduce$2] = $$('find', 'reduce');

const push = (path, result, node, index = 0) => {
  const name = path[index];
  const next = node ? node[name] : {};
  const done = index === path.length - 1;
  return done ? { ...node,
    [name]: result
  } : { ...node,
    [name]: push(path, result, next, index + 1)
  };
};

const isLeaf = hasProp('ok');

const flattenBranches = level => ([text, node]) => {
  const entry = {
    text,
    level,
    isLeaf: isLeaf(node),
    status: statusOf(node)
  };
  return !isLeaf(node) ? [entry, ...fold(node, level + 1)] : [entry];
};

const fold = (node, level = 0) => Object.entries(node).flatMap(flattenBranches(level));

const last = arr => arr[arr.length - 1];

const getLastResult = node => !isLeaf(node) ? getLastResult(last(Object.entries(node))) : node;

const ResultsTree = (pathResolver, root = {}) => ({
  root,
  push: result => ResultsTree(pathResolver, push(pathResolver(result), result, root)),
  entries: () => fold(root),
  latest: () => getLastResult(root)
});

const findResult = (name, i) => find(({
  level,
  text
}) => level === i && name === text);

const filterResults = _(results => reduce$2((acc, name, i) => [...acc, findResult(name, i)(results)], []));

const resolvePath = name => name.split(' › ');

const [join$7, match$1, includes] = $$('join', 'match', 'includes');
const isNoTestFound = includes('No tests found in');
const isException = includes('exited with a non-zero exit code');
const isUncaughtException = includes('exited with a non-zero exit code: 1');
const isExceptionHandlerRunTimeFailure = includes('exited with a non-zero exit code: 7');
const standardName = join$7(' › ');
const noTestFoundToStandard = pipe(match$1(/^No tests found in [^/]+\/(.+)\..*js/), match => match && match[1].split('/'), standardName);
const exceptionToStandard = pipe(match$1(/^[^/]+\/(.+)\..*js exited with a non-zero exit code:/), match => match && match[1].split('/'), standardName);

const normaliseName = name => isNoTestFound(name) ? noTestFoundToStandard(name) : isException(name) ? exceptionToStandard(name) : name;

const diagName = name => isNoTestFound(name) ? 'NoTestFound' : isUncaughtException(name) ? 'UncaughtException' : isExceptionHandlerRunTimeFailure ? 'ExceptionHandlerRunTimeFailure' : 'Error';

const normaliseFailure = result => result.diag ? result : { ...result,
  name: normaliseName(result.name),
  diag: {
    name: diagName(result.name),
    message: result.name
  }
};

const resultToEntries = result => {
  const path = resolvePath(result.name);

  const isLeaf = i => path.length - 1 === i;

  return path.map((text, level) => ({
    text,
    level,
    isLeaf: isLeaf(level),
    status: 'fail'
  }));
};

const isFailure = result => !result.ok && !result.todo;

var Failure$1 = (value => {
  var _ref, _value;

  return !isFailure(value) ? null : (_ref = (_value = value, normaliseFailure(_value)), {
    result: _ref,
    entries: resultToEntries(_ref)
  });
});

const computeEntries = _(results => log => ({ ...log,
  subset: filterResults(results, log.path)
}));
const assocPath = _(log => ({ ...log,
  path: resolvePath(log.result.name)
}));

const init = () => ({
  frame: {
    event: null,
    needsUpdate: false,
    write_lock: false,
    elapsed: 0,
    resultsTree: ResultsTree(({
      name
    }) => resolvePath(name)),
    results: [],
    logs: [],
    failures: [],
    summary: null,
    render: '',
    end: false
  }
});
const mutate = store => state => {
  store.frame = { ...state
  };
  return state;
};

const updateLogs = ({
  results,
  logs,
  event
}) => event.is('log') ? [...logs, assocPath(event.value)] : event.is('complete') ? logs.map(computeEntries(results)) : logs;

const updateResults = ({
  failures,
  resultsTree,
  event
}) => {
  if (!event.is('result')) return {};
  const {
    value
  } = event;
  const failure = Failure$1(value);
  const newTree = resultsTree.push(failure && failure.result || value);
  return {
    resultsTree: newTree,
    results: newTree.entries(),
    failures: failure ? [...failures, failure] : failures
  };
};

const updateElapsed = ({
  elapsed
}) => elapsed + 1;

const updateSummary = ({
  summary,
  event
}) => event.is('complete') ? event.value : summary;

const updateNeedsUpdate = ({
  event
}) => event.isNot('write', 'log', 'fail');

const updateWriteLock = ({
  write_lock,
  event
}) => event.is('write') ? event.value.write_lock : write_lock;

const updateEnd = ({
  write_lock,
  summary,
  event
}) => event.isNot('complete') && summary && !write_lock;

const update = state => ({ ...state,
  ...updateResults(state),
  logs: updateLogs(state),
  elapsed: updateElapsed(state),
  summary: updateSummary(state),
  needsUpdate: updateNeedsUpdate(state),
  write_lock: updateWriteLock(state),
  end: updateEnd(state)
});

const split$1 = $('split');
const options = process.argv.slice(2).map(split$1('=')).reduce((acc, [key, val]) => {
  acc[key] = defined(val) ? val : true;
  return acc;
}, {});
const width = () => Math.min(process.stdout.columns, options['max-width'] || Infinity);
const indent = options.indent || 2;
const verbose = Boolean(options.verbose);
const resize$1 = Boolean(options.resize);
const themeVariant = options.theme || 'dark';

var options$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    width: width,
    indent: indent,
    verbose: verbose,
    resize: resize$1,
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
      run: [270, 80, 65],
      digit: [55, 100, 55],
      braces: [255, 80, 70],
      word: [16, 87, 65]
    },
    background: {
      fail: [355, 50, 27],
      info: [223, 27, 22],
      log: [215, 35, 27],
      '+': [160, 30, 25],
      '-': [340, 30, 25]
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
      run: [270, 80, 65],
      digit: [16, 100, 55],
      braces: [255, 80, 70],
      word: [165, 100, 37]
    },
    background: {
      fail: [0, 100, 86],
      info: [220, 55, 93],
      log: [180, 45, 90],
      '+': [160, 50, 90],
      '-': [340, 50, 90]
    }
  }
};
const emptyVariant = {
  text: {},
  background: {}
};

const getUserTheme = () => JSON.parse(readFileSync('./slim-reporter-theme.json', {
  encoding: 'utf8',
  flag: 'r'
}));

const readColors = _(model => map$6(([key, value]) => [key, chalk[model](...value)]));

const readVariant = (d, {
  text,
  background
}) => ({
  text: readColors('hsl', { ...d.text,
    ...text
  }),
  background: { ...readColors('bgHsl', { ...d.background,
      ...background
    }),
    ...{
      ' ': id
    }
  }
});

const readTheme = _(dfault => pipe(theme => theme ? { ...dfault,
  ...theme
} : dfault, map$6(([name, variant]) => [name, readVariant(dfault[name] || emptyVariant, variant)])));

const theme = readTheme(defaultDescription, safe(getUserTheme));
var theme$1 = theme[themeVariant] || theme.dark;

const [replace$1, split, reduce$1, map$4] = $$('replace', 'split', 'reduce', 'map');
const hasStyle = x => x !== stripAnsi(x);
const length = text => stripAnsi(text).length;
const colors = theme$1.text;
const bg = theme$1.background;
chalk.italic;
const underline = chalk.underline;
const bold = chalk.bold;
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

const isJSONLike = str => {
  const first = match(/^\s*(\S)/);
  const last = match(/(\S)\s*$/);
  const startBrackets = ['[', '{'];
  const endBrackets = {
    '[': ']',
    '{': '}'
  };
  return startBrackets.includes(first(str)) && endBrackets[first(str)] === last(str);
};
const syntaxColor = pipe(replace$1(/(\{|\}|\[|\])/g, colors.braces('$1')), replace$1(/( \d+)/g, colors.digit('$1')), replace$1(/( (?:\w+|"\w+"):)/g, colors.default('$1')), replace$1(/,/g, colors.default(',')), colors.word);
const entryStyle = _(level => isLeaf => text => isLeaf ? text : level === 0 ? bold(text) : level === 1 ? underline(text) : text);
const wrapLine = _(max => indent => str => {
  var _ref, _ref2, _ref3, _str;

  const separators = /[ /;:,.-]/g;
  const match = str.match(separators);
  return _ref = (_ref2 = (_ref3 = (_str = str, split(separators)(_str)), reduce$1((lines, word, i) => {
    const latest = last$1(lines);
    const len = length(word) + indent + length(latest) + 1;
    const next = word + (match && match[i] || '');
    return len > max ? [...lines, next] : [...init$1(lines), latest + next];
  }, [''])(_ref3)), map$4(x => x.trimEnd())(_ref2)), map$4((x, i) => !i ? x : spaces(indent) + x)(_ref);
});

const [map$3, join$6] = $$('map', 'join');

const layout$3 = indent => ({
  level,
  status
}) => (line, i) => i !== 0 ? line : indent(level) + icons[status] + ' ' + line;

const formatEntry = (wrap, layout) => entry => {
  var _ref, _ref2, _ref3, _entry$text;

  return _ref = (_ref2 = (_ref3 = (_entry$text = entry.text, entryStyle(entry.level, entry.isLeaf)(_entry$text)), wrap(entry.level)(_ref3)), map$3(layout(entry))(_ref2)), join$6('\n')(_ref);
};

var EntryFactory = ((indent, wrapLine) => entry => {
  var _entry;

  const indentBy = n => spaces(n * indent);

  const wrap = level => wrapLine(level * indent + 2);

  return _entry = entry, formatEntry(wrap, layout$3(indentBy))(_entry);
});

const [map$2, reduce, flatMap, join$5] = $$('map', 'reduce', 'flatMap', 'join');

const belongsToNextSuite = (groups, entry) => {
  const lastEntry = last$1(last$1(groups));
  return entry.level < lastEntry.level || !entry.isLeaf && lastEntry.isLeaf;
};

const groupBySuite = reduce((groups, entry) => empty(groups) ? [[entry]] : belongsToNextSuite(groups, entry) ? [...groups, [entry]] : [...init$1(groups), [...last$1(groups), entry]], []);
var EntriesFactory = (Entry => pipe(groupBySuite, map$2(flatMap(Entry)), map$2(join$5('\n')), join$5('\n\n')));

const _title = (color, width, text = '') => {
  const w = Math.max(2, width - length(text));
  const space = spaces(Math.floor(w / 2));
  return color(space + text + space);
};

var TitleFactory = ((width, wrapLine) => _(color => text => {
  const render = text => _title(color, width(), text);

  return hasStyle(text) ? render(text) : wrapLine(width() - 1, 1, text).map(render).join('\n');
}));

const dots = (n, i) => i === undefined ? i => dots(n, i) : repeat('.', (i + 1) % (n + 1));
var Loading = (waits => 'awaiting results' + dots(3, waits));

const join$4 = $('join');

const layout$2 = _(Title => pipe(report => [Title(bg.info, 'Test Report'), report.replace(/^\n*/, '')], join$4('\n\n')));

var Report = _(Entries => Title => pipe(Entries, xs => xs.length ? layout$2(Title, xs) : ''));

const [filter$1, join$3] = $$('filter', 'join');

const print$1 = (s, x) => !x ? null : colors[s](icons[s] + ' ' + x);

const space = pipe(filter$1(id), join$3(colors.info.bold(' | ')));

const render$2 = ({
  count,
  fail,
  pass,
  skip,
  todo
}) => space([print$1('run', count - todo - skip), print$1('pass', pass - skip), print$1('fail', fail - todo), print$1('skip', skip), print$1('todo', todo)]);

var Summary = _(Title => summary => Title(bg.info, render$2(summary)));

const [replace, join$2, map$1] = $$('replace', 'join', 'map');
const difference = prop('Difference:');

const extractAt = diag => !diag.at ? null : diag.at.split('\n');

const multiline = arr => arr.length > 1;

const coordOf = replace(/^.+(?:\..*js).*?:/, '');

const bannerText = ({
  name,
  assertion
}, at) => {
  const detail = assertion && wrap('(', ')')(assertion);
  return [name, detail, at].filter(id).join(' ');
};

const DiffFailure = values => {
  var _ref3, _ref4, _values;

  const style = (type, line) => {
    var _ref, _ref2, _line;

    return _ref = (_ref2 = (_line = line, syntaxColor(_line)), bg[type](_ref2)), replace(type, icons[type])(_ref);
  };

  const details = (_ref3 = (_ref4 = (_values = values, difference(_values)), splitJoin(map$1(line => line && style(line[0], line)), '\n')(_ref4)), '\n' + _ref3);
  return 'Difference:\n' + details;
};

const DetailedFailure = (message, values, wrapLine) => {
  var _ref5, _ref6, _ref7, _ref8, _ref9, _ref10, _values2;

  const details = (_ref5 = (_ref6 = (_ref7 = (_ref8 = (_ref9 = (_ref10 = (_values2 = values, Object.values(_values2)), join$2('/n')(_ref10)), wrapLine(0)(_ref9)), join$2('/n')(_ref8)), indent$1(3)(_ref7)), syntaxColor(_ref6)), '\n' + _ref5);
  const title = message ? message + ':' : Object.keys(values).join('\n');
  return [title, details].join('\n');
};

const LaconicFailure = (message, wrapLine) => {
  var _message;

  const nbsp = '\xa0';
  const formatMessage = pipe(x => bold('“') + nbsp + x + nbsp + bold('”'), wrapLine(2), join$2('\n'));
  return _message = message, either(isJSONLike, id, formatMessage)(_message);
};

const Failure = ({
  message,
  values
}, wrapLine) => !values ? LaconicFailure(message, wrapLine) : difference(values) ? DiffFailure(values) : DetailedFailure(message, values, wrapLine);

const atInBanner = at => at && !multiline(at) ? `at ${coordOf(at[0])}` : null;

const atInText = (indentation, wrapLine, width, at) => {
  var _ref11, _ref12, _ref13, _at;

  return at && multiline(at) ? `at:\n${(_ref11 = (_ref12 = (_ref13 = (_at = at, map$1(x => '- ' + x)(_at)), map$1(pipe(wrapLine(width - '- '.length)(indentation), join$2('\n')))(_ref13)), join$2('\n')(_ref12)), indent$1(indentation)(_ref11))}\n` : null;
};

var Failures = _(Entries => Title => wrapLine => width => indentation => map$1(({
  result,
  entries
}) => {
  const at = extractAt(result.diag);
  return [Title(bg.fail, bannerText(result.diag, atInBanner(at))), wrap('\n')(Entries(entries)), atInText(indentation, wrapLine, width, at), Failure(result.diag, wrapLine(width))].filter(id).join('\n');
}));

const [map, join$1] = $$('map', 'join');

const layout$1 = title => pipe(({
  origin,
  message
}) => [title, [origin, message].join('\n')], join$1('\n\n'));

const formatMessage = either(isJSONLike, syntaxColor, id);

const format = Entries => ({
  subset,
  message
}) => {
  const origin = Entries(subset) + '\n';
  return {
    origin,
    message: formatMessage(message)
  };
};

var Log = _(Entries => Title => map(pipe(format(Entries), layout$1(Title(bg.log, 'Log')))));

const [filter, join] = $$('filter', 'join');

const layout = ({
  width
}) => pipe(filter(id), join('\n\n'), indent$1((process.stdout.columns - width()) / 2 | 0), wrap('\n'));

const render = ({
  width,
  indent,
  verbose
}) => {
  const Entry = EntryFactory(indent, wrapLine(width()));
  const Entries = EntriesFactory(Entry);
  const Title = TitleFactory(width, wrapLine);
  return state => [verbose && Report(Entries, Title, state.results), state.summary && [Failures(Entries, Title, wrapLine, width(), indent, state.failures), verbose && Log(Entries, Title, state.logs), Summary(Title, state.summary)], !state.summary && Loading(state.elapsed)].flat(2);
};

var render$1 = (options => state => {
  var _ref, _state;

  return { ...state,
    render: (_ref = (_state = state, render(options)(_state)), layout(options)(_ref))
  };
});

const clearAll = '\x1Bc\r';
var print = (event => state => {
  if (state.needsUpdate && !state.write_lock) {
    event('write', {
      write_lock: true
    });
    process.stdout.write(clearAll + state.render, null, () => setTimeout(() => event('write', {
      write_lock: false
    }), 20));
  }

  return state;
});

var resize = ((resize, event) => {
  if (resize) {
    process.stdout.on('resize', event); // keep the terminal session open

    setInterval(() => {}, 300);
  }
});

var Clock = ((event, delta) => {
  const timer = setInterval(event, delta);
  return {
    stop: () => clearInterval(timer)
  };
});

const store = init();

const main = state => {
  var _ref, _ref2, _ref3, _ref4, _state;

  return _ref = (_ref2 = (_ref3 = (_ref4 = (_state = state, update(_state)), render$1(options$1)(_ref4)), mutate(store)(_ref3)), print(event)(_ref2)), release(clock)(_ref);
};

const parser = new Parser();

const event = _(passEvent(store, main));

const register = e => logEvent(event('log'), Event(e));

parser.on('result', event('result'));
parser.on('comment', register('comment'));
parser.on('complete', register('complete'));
parser.on('result', register('result'));
parser.on('complete', event('complete'));
resize(resize$1, event('resize'));
const clock = Clock(event('clock'), 120);

const release = clock => ({
  end
}) => end && clock.stop();

process.stdin.pipe(parser);
console.clear();
//# sourceMappingURL=slim-reporter.js.map
