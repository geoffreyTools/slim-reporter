import { bg } from '../looks/style.js';
import { pipe, _, $ } from '../utils.js';
const join = $('join');

const layout = _(Title => pipe(
    report => [
        Title(bg.info, 'Test Report'),
        report.replace(/^\n{2}/, '\n')
    ],
    join('\n'),
));

export default _(Entries => Title => pipe(
    Entries,
    xs => xs.length ? layout(Title, xs) : ''
));