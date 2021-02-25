import Entries from './components/Entries.js';
import Title from './components/Title.js';
import Loading from './components/Loading.js';
import Report from './components/Report.js';
import Summary from './components/Summary.js';
import Failure from './components/Failure.js';
import Log from './components/Log.js';
import { id, pipe, $pipe, $$ } from './utils.js';
const [filter, join, concat] = $$('filter', 'join', 'concat');

const layout = pipe(
    filter(id),
    join('\n\n'),
    concat('\n'),
);

const render = ({ width, indent, verbose }) => {
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

export default options => state => ({
    ...state, render: $pipe(state, render(options), layout)
});
