import { hasProp, either, pipe, eq, $ } from '../utils.js';
const map = $('map');

const reduceStatus = xs =>
      xs.every(eq('pass')) ? 'pass'
    : xs.find(eq('fail'))  ? 'fail'
    : xs.every(eq('todo')) ? 'todo'
    : xs.every(eq('skip')) ? 'skip'
    : 'mixed'
;

const isLeaf = hasProp('ok');

const getStatus = searchChild => either(
    isLeaf,
    x =>
          x.skip ? 'skip'
        : x.todo ? 'todo'
        : x.ok ? 'pass'
        : 'fail',
    searchChild
);

export const statusOf = getStatus(
    childNode => pipe(
        Object.values,
        map(getStatus(statusOf)),
        reduceStatus
    )(childNode)
);
