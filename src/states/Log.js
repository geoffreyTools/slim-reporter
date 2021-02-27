import { _ } from '../utils.js';
import { filterResults } from '../results/tree.js';
import { resolvePath } from '../results/resolvePath.js';

export const computeEntries = _(results => log => ({
    ...log, subset: filterResults(results, log.path)
}));

export const assocPath = _(log => ({
    ...log, path: resolvePath(log.result.name)
}));