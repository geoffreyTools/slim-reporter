import EntryFactory from './components/Entry.js';
import EntriesFactory from './components/Entries.js';
import TitleFactory from './components/Title.js';
import Loading from './components/Loading.js';
import Report from './components/Report.js';
import Summary from './components/Summary.js';
import Failures from './components/Failures.js';
import Log from './components/Log.js';
import { id, pipe, indent, wrap, $$ } from './utils.js';
import { wrapLine } from './looks/style.js';
const [filter, join] = $$('filter', 'join');

const layout = ({ width }) => pipe(
    filter(id),
    join('\n\n'),
    indent((process.stdout.columns - width()) / 2 | 0),
    wrap('\n'),
);

const render = ({ width, indent, verbose }) => {
    const Entry = EntryFactory(indent, wrapLine(width()));
    const Entries = EntriesFactory(Entry);
    const Title = TitleFactory(width, wrapLine);

    return state => [
        verbose && Report(Entries, Title, state.results),
        state.summary && [
            Failures(Entries, Title, wrapLine, width(), indent, state.failures),
            verbose && Log(Entries, Title, state.logs),
            Summary(Title, state.summary)
        ],
        !state.summary && Loading(state.elapsed)
    ].flat(2);
};

export default options => state => ({
    ...state,
    render: state |> render(options) |> layout(options)
});
