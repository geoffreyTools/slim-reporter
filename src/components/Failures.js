import { icons, bg, bold, syntaxColor, isJSONLike } from '../looks/style.js';
import {id, splitJoin, wrap, pipe, prop, indent, either, $$, _ } from '../utils.js';
const [replace, join, map] = $$('replace', 'join', 'map');

const difference = prop('Difference:');

const extractAt = diag =>
    !diag.at
    ? null
    : diag.at.split('\n')
;

const multiline = arr => arr.length > 1;

const coordOf = replace(/^.+(?:\..*js).*?:/, '');

const bannerText = ({ name, assertion }, at) => {
    const detail = assertion && wrap('(', ')')(assertion);
    return [name, detail, at].filter(id).join(' ')
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
        |> wrapLine(0)
        |> join('/n')
        |> indent(3)
        |> syntaxColor
        |> (x => '\n' + x)
    ;

    const title = message
        ? message + ':'
        : Object.keys(values).join('\n')
    ;

    return [title, details].join('\n');
}


const LaconicFailure = (message, wrapLine) => {
    const nbsp = '\xa0';
    const formatMessage = pipe(
        x => bold('“') + nbsp + x + nbsp + bold('”'),
        wrapLine(2),
        join('\n')
    );

    return message |> either(isJSONLike, id, formatMessage);
};

const Failure = ({ message, values }, wrapLine) =>
    !values
    ? LaconicFailure(message, wrapLine)
    : difference(values)
    ? DiffFailure(values)
    : DetailedFailure(message, values, wrapLine)
;

const atInBanner = at =>
    at && !multiline(at)
    ? `at ${coordOf(at[0])}`
    : null
;

const atInText = (indentation, wrapLine, at) =>
    at && multiline(at)
    ? `at:\n${
        at
        |> map(x => '- ' + x)
        |> map(pipe(wrapLine(indentation), join('\n')))
        |> join('\n')
        |> indent(indentation)
      }\n`
    : null
;

export default _(Entries => Title => wrapLine => indentation => map(
    ({ result, entries }) => {
        const at = extractAt(result.diag);
        return [
            Title(bg.fail, bannerText(result.diag, atInBanner(at))),
            wrap('\n')(Entries(entries)),
            atInText(indentation, wrapLine, at),
            Failure(result.diag, wrapLine)
        ].filter(id).join('\n')
    })
);
