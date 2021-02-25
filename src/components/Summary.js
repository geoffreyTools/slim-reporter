import { icons, colors, bg } from '../looks/style.js';
import { id, pipe, $$, _ } from '../utils.js';
const [filter, join] = $$('filter', 'join');

const print = (s, x) =>
    !x ? null : colors[s](icons[s] + ' ' + x)
;

const space = pipe(filter(id), join(colors.info.bold(' | ')));


const render = ({ count, fail, pass, skip, todo }) =>
    space([
        print('run', count - todo - skip),
        print('pass', pass - skip),
        print('fail', fail - todo),
        print('skip', skip),
        print('todo', todo)
    ])
;

export default _(Title => summary =>
    Title(bg.info, render(summary))
);
