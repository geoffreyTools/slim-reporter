import Entries from './components/Entries.js';
import Title from './components/Title.js';
import Loading from './components/Loading.js';
import Report from './components/Report.js';
import Summary from './components/Summary.js';
import Failure from './components/Failure.js';
import Log from './components/Log.js';
import { id, pipe, wrapLine, indent, wrap, $$ } from './utils.js';
const [filter, join] = $$('filter', 'join');

const layout = ({ width }) => pipe(
    filter(id),
    join('\n\n'),
    indent((process.stdout.columns - width()) / 2 | 0),
    wrap('\n'),
);

const render = ({ width, indent, verbose }) => {
    const $Entries = Entries(width, indent);
    const $Title = Title({width});
    const $wrapLine = wrapLine(width(), indent)

    return state => [
        verbose && Report($Entries, $Title, state.results),
        state.summary && [
            Failure($Title, indent, $wrapLine, state.failures),
            verbose && Log($Entries, $Title, state.logs),
            Summary($Title, state.summary)
        ],
        !state.summary && Loading(state.elapsed)
    ].flat(2);
};

export default options => state => ({
    ...state,
    render: state |> render(options) |> layout(options)
});
