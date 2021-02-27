import { resolvePath } from '../results/resolvePath.js';
import { pipe, $$ } from '../utils.js';
const [join, match, includes] = $$('join', 'match', 'includes')

const isNoTestFound = includes('No tests found in');
const isException = includes('exited with a non-zero exit code');
const isUncaughtException = includes('exited with a non-zero exit code: 1');
const isExceptionHandlerRunTimeFailure = includes('exited with a non-zero exit code: 7');

const standardName = join(' › ');

const noTestFoundToStandard = pipe(
    match(/^No tests found in [^/]+\/(.+)\..*js/),
    match => match && match[1].split('/'),
    standardName
);

const exceptionToStandard = pipe(
    match(/^[^/]+\/(.+)\..*js exited with a non-zero exit code:/),
    match => match && match[1].split('/'),
    standardName
);

const normaliseName = name =>
    isNoTestFound(name)
    ? noTestFoundToStandard(name)
    : isException(name)
    ? exceptionToStandard(name)
    : name
;

const diagName = name =>
    isNoTestFound(name)
    ? 'NoTestFound'
    : isUncaughtException(name)
    ? 'UncaughtException'
    : isExceptionHandlerRunTimeFailure
    ? 'ExceptionHandlerRunTimeFailure'
    : 'Error'
;

const normaliseFailure = result =>
    result.diag
    ? result
    : {
        ...result,
        name: normaliseName(result.name),
        diag: {
            name: diagName(result.name),
            message: result.name,
        }
    }
;

const resultToEntries = result => {
    const path = resolvePath(result.name);
    const isLeaf = i => path.length - 1 === i;
    return path.map((text, level) => ({
        text, level, isLeaf: isLeaf(level), status: 'fail'
    }))
};

const isFailure = result => !result.ok && !result.todo;

export default value =>
    !isFailure(value)
    ? null
    : (value
        |> normaliseFailure
        |> (result => ({
            result, entries: resultToEntries(result)
        }))
    )
;