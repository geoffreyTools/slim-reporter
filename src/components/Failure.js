import { icons, bg, syntaxColor, entryStyle } from '../looks/style.js';
import {id, splitJoin, wrap, prop, pipe, $pipe, indent, spaces, $$, _ } from '../utils.js';
const [slice, replace, join, map, split] = $$('slice', 'replace', 'join', 'map', 'split');

const style = _(type => pipe(
    syntaxColor,
    bg[type],
    replace(type, icons[type])
));

const render = pipe(
    splitJoin(map(line => line && style(line[0], line)), '\n')
);

const coordOf = replace(/^[^0-9]*/, ''); splitJoin(slice(-2), ':');

const difference = prop('Difference:');

const messageDetails = values =>
    !values
    ? ''
    : difference(values)
    ? render(difference(values))
    : values |> Object.values |> join('/n') |> indent(3) |> syntaxColor
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
}

const diagnosis = (title, origin) => (text, details) =>
    [
        title(bg.fail, bannerText(details)) + '\n',
        origin(text),
        messageSummary(details.message, details.values),
        messageDetails(details.values)
    ].filter(id).join('\n')
;

const format = (indentBy, wrapLine) => (line, i, arr) =>
    indentBy(i)
    + icons.fail
    + ' ' + wrapLine(entryStyle(i, i === arr.length - 1, line)).join('\n') + '\n'
;

const cascade = _(indentBy => wrapLine => pipe(
    split(' › '),
    map(format(indentBy, wrapLine)),
    join(''),
));


export default _(title => indent => wrapLine => map(
    ({ name, diag }) => {
        const indentBy = n => spaces(n * indent);
        return diag
        ? diagnosis(title, cascade(indentBy, wrapLine))(name, diag)
        : title(bg.fail, 'Error') + wrap('\n')(cascade(indentBy, wrapLine, name))
    }
));
