import { bg, syntaxColor, isJSONLike } from '../looks/style.js';
import { id, pipe, either, $$, _ } from '../utils.js';
const [map, join] = $$('map', 'join');

const layout = title => pipe(
    ({ origin, message }) => [title, origin, message],
    join('\n')
);

const formatMessage = either(isJSONLike, syntaxColor, id);

const format = Entries => ({ subset, message }) => {
    const origin = Entries(subset) + '\n';
    return { origin, message: formatMessage(message) };
};

export default _(Entries => Title => pipe(
    map(pipe(
        format(Entries),
        layout(Title(bg.log, 'Log'))
    )),
));
