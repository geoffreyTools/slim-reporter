import ResultsTree from '../results/tree.js';
import { resolvePath } from '../results/resolvePath.js';
import Failure from './Failure.js';
import * as Log from './Log.js';

export const init = () => ({
    frame: {
        event: null,
        needsUpdate: false,
        write_lock: false,
        elapsed: 0,
        resultsTree: ResultsTree(({ name }) => resolvePath(name)),
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


const updateLogs = ({ results, logs, event }) =>
    event.is('log')
    ? [...logs, Log.assocPath(event.value)]
    : event.is('complete')
    ? logs.map(Log.computeEntries(results))
    : logs
;

const updateResults = ({ failures, resultsTree, event }) => {
    if (!event.is('result')) return {};

    const { value } = event;

    const failure = Failure(value);

    const newTree = resultsTree.push(
        failure && failure.result || value
    );

    return {
        resultsTree: newTree,
        results: newTree.entries(),
        failures: failure ? [...failures, failure] : failures
    };
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
    elapsed: updateElapsed(state),
    summary: updateSummary(state),
    needsUpdate: updateNeedsUpdate(state),
    write_lock: updateWriteLock(state),
    end: updateEnd(state)
});
