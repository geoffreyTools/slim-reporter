import { pipe, last, init, empty, $$ } from '../utils.js';
const [map, reduce, flatMap, join] = $$('map', 'reduce', 'flatMap', 'join');

const belongsToNextSuite = (groups, entry) => {
    const lastEntry = last(last(groups));
    return entry.level < lastEntry.level
    || !entry.isLeaf && lastEntry.isLeaf
}

const groupBySuite = reduce((groups, entry) =>
    empty(groups)
    ? [[entry]]
    : belongsToNextSuite(groups, entry)
    ? [...groups, [entry]]
    : [...init(groups), [...last(groups), entry]]
, []);

export default Entry => pipe(
    groupBySuite,
    map(flatMap(Entry)),
    map(join('\n')),
    join('\n\n')
);

