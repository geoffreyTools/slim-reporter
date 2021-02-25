import ResultsTree from './results/tree.js';
import { filterResults } from './results/tree.js';
import { _ } from './utils.js';

const resolvePath = ({ name }) => name.split(' › ');

export const init = () => ({
    frame: {
        event: null,
        needsUpdate: false,
        write_lock: false,
        elapsed: 0,
        resultsTree: ResultsTree(resolvePath),
        results: [],
        logs: [],
        failures: [],
        summary: null,
        render: '',
        end: false
    }
});

export const mutate = store => state => {
    store.frame = { ...state };
    return state;
};

const computeLog = _(results => log => ({
    ...log, subset: filterResults(results, log.path)
}));

const assocPath = _(log => ({
    ...log, path: resolvePath(log.result)
}));

const updateLogs = ({ results, logs, event }) =>
    event.is('log')
    ? [...logs, assocPath(event.value)]
    : event.is('complete')
    ? logs.map(computeLog(results))
    : logs
;

const updateFailures = ({ failures, event }) =>
    event.is('fail')
    ? [...failures, event.value]
    : failures
;

const updateResults = ({ resultsTree, event }) => {
    if (!event.is('result')) return {};

    const newTree = resultsTree.push(event.value);

    return {
        resultsTree: newTree,
        results: newTree.entries(),
    }
};

const updateElapsed = ({ elapsed }) =>
    elapsed + 1
;

const updateSummary = ({ summary, event }) =>
    event.is('complete')
    ? event.value
    : summary
;

const updateNeedsUpdate = ({ event }) =>
    event.isNot('write', 'log', 'fail')
;

const updateWriteLock = ({ write_lock, event }) =>
    event.is('write')
    ? event.value.write_lock
    : write_lock
;


const updateEnd = ({ write_lock, summary, event }) =>
    event.isNot('complete') && summary && !write_lock
;

export const update = state => ({
    ...state,
    ...updateResults(state),
    logs: updateLogs(state),
    failures: updateFailures(state),
    elapsed: updateElapsed(state),
    summary: updateSummary(state),
    needsUpdate: updateNeedsUpdate(state),
    write_lock: updateWriteLock(state),
    end: updateEnd(state)
});
