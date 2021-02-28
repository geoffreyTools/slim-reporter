import { hasStyle, length } from '../looks/style.js';
import { spaces, _ } from '../utils.js';

const _title = (color, width, text='') => {
    const w = Math.max(2, width - length(text));
    const space = spaces(Math.floor(w / 2));
    return color(space + text + space);
}

export default (width, wrapLine) => _(color => text => {
    const render = text => _title(color, width(), text);

    return hasStyle(text)
        ? render(text)
        : wrapLine(width() - 1, 1, text)
            .map(render)
            .join('\n')
    ;
});
