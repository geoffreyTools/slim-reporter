import { wrapLine, spaces, last, init, empty, $$ } from '../utils.js';
import { icons, entryStyle } from '../looks/style.js';
const [map, reduce, flatMap, join] = $$('map', 'reduce', 'flatMap', 'join');

const layout = indent => ({ level, status }) => (line, i) =>
    i !== 0 ? line
    : indent(level) + icons[status] + ' ' + line
;

const formatEntry = (wrap, layout) => entry =>
    entry.text
    |> entryStyle(entry.level, entry.isLeaf)
    |> wrap(entry.level)
    |> map(layout(entry))
;

const formatEntries = (...xs) => flatMap(formatEntry(...xs));

const belongsToNextSuite = (groups, entry) => {
    const lastEntry = last(last(groups));
    return entry.level < lastEntry.level
    || !entry.isLeaf && lastEntry.isLeaf
}

const groupBySuite = reduce((groups, entry) =>
    empty(groups)
    ? [[entry]]
    : belongsToNextSuite(groups, entry)
    ? [...groups, [entry]]
    : [...init(groups), [...last(groups), entry]]
, []);

export default (width, indent) => entries => {
    const indentBy = n => spaces(n * indent);
    const wrap = level => wrapLine(width, level * indent + 2);

    return entries
        |> groupBySuite
        |> map(formatEntries(wrap, layout(indentBy)))
        |> map(join('\n'))
        |> join('\n\n')
    ;
};
