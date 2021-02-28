import { spaces, $$ } from '../utils.js';
import { icons, entryStyle } from '../looks/style.js';
const [map, join] = $$('map', 'join');

const layout = indent => ({ level, status }) => (line, i) =>
    i !== 0 ? line
    : indent(level) + icons[status] + ' ' + line
;

const formatEntry = (wrap, layout) => entry =>
    entry.text
    |> entryStyle(entry.level, entry.isLeaf)
    |> wrap(entry.level)
    |> map(layout(entry))
    |> join('\n')
;

export default (indent, wrapLine) => entry => {
    const indentBy = n => spaces(n * indent);
    const wrap = level => wrapLine(level * indent + 2);

    return entry |> formatEntry(wrap, layout(indentBy));
};
