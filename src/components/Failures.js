import { icons, bg, syntaxColor } from '../looks/style.js';
import {id, splitJoin, wrap, prop, indent, $$, _ } from '../utils.js';
const [replace, join, map] = $$('replace', 'join', 'map');

const difference = prop('Difference:');

const coordOf = replace(/^.+(?:\..*js).*?:/, '');

const bannerText = ({ name, assertion, at }) => {
    const detail = assertion && wrap('(', ')')(assertion);
    const location = at && `at ${coordOf(at)}`;
    return [name, detail, location].filter(id).join(' ')
}

const DiffFailure = values => {
    const style = (type, line) =>
        line
        |> syntaxColor
        |> bg[type]
        |> replace(type, icons[type])
    ;

    const details = values
        |> difference
        |> splitJoin(
            map(line =>
                line && style(line[0], line)
            ), '\n'
        )
        |> (x => '\n' + x)
    ;

    return 'Difference:\n' + details;
}

const DetailedFailure = (message, values, wrapLine) => {
    const details = values
        |> Object.values
        |> join('/n')
        |> wrapLine
        |> join('/n')
        |> indent(3)
        |> syntaxColor
        |> (x => '\n' + x)
    ;

    return message + ':\n' + details;
}

const LaconicFailure = (message, wrapLine) =>
    (message |> wrapLine |> join('\n')) + '.'
;

const Failure = ({ message, values }, wrapLine) =>
    !values
    ? LaconicFailure(message, wrapLine)
    : difference(values)
    ? DiffFailure(values)
    : DetailedFailure(message, values, wrapLine)
;

export default _(Entries => Title => wrapLine => map(
    ({ result, entries }) => [
        Title(bg.fail, bannerText(result.diag)),
        wrap('\n')(Entries(entries)),
        Failure(result.diag, wrapLine)
    ].join('\n'))
);
