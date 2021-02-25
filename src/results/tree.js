import { hasProp } from '../utils.js';
import { statusOf } from './status.js';
import { $$, _ } from '../utils.js';
const [find, reduce] = $$('find', 'reduce');

const push = (path, result, node, index = 0) => {
    const name = path[index];
    const next = node ? node[name] : {};
    const done = index === path.length - 1;
    return done
        ? { ...node, [name]: result }
        : { ...node, [name]: push(path, result, next, index + 1) }
    ;
};

const isLeaf = hasProp('ok');

const flattenBranches = level => ([text, node]) => {
    const entry = {
        text, level, isLeaf: isLeaf(node), status: statusOf(node)
    };

    return (!isLeaf(node))
        ? [entry, ...fold(node, level + 1)]
        : [entry]
    ;
};

const fold = (node, level = 0) =>
    Object.entries(node)
    .flatMap(flattenBranches(level))
;

const last = arr => arr[arr.length -1];

const getLastResult = node =>
    !isLeaf(node)
    ? getLastResult(last(Object.entries(node)))
    : node
;

const ResultsTree = (pathResolver, root = {}) => ({
    root,
    push: result => ResultsTree(pathResolver, push(pathResolver(result), result, root)),
    entries: () => fold(root),
    latest: () => getLastResult(root)
});

const findResult = (name, i) =>
    find(({ level, text }) => level === i && name === text)
;

export const filterResults = _(results =>
    reduce((acc, name, i) =>
        [ ...acc, findResult(name, i)(results) ],
    [])
);

export default ResultsTree;
