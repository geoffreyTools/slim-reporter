import { pipe, wrapLine, spaces, _, $$ } from '../utils.js';
import { icons, entryStyle } from '../looks/style.js';
const [map, flatMap, join] = $$('map', 'flatMap', 'join');

const wrap = (width, indent) => level => wrapLine(width, level * indent + 2)

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
        map(layout(entry))
    )(entry.text)
);

const formatEntries = (wrap, layout) => xs =>
    flatMap(formatEntry(wrap, layout))(xs)
;

export default (width, indent) => pipe(
    formatEntries(
        wrap(width(), indent),
        entryLayout(indent)
    ),
    join('\n')
);