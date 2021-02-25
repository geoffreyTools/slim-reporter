import { repeat } from '../utils.js';

export const dots = (n, i) =>
    i === undefined
    ? i => dots(n, i)
    : repeat('.', (i + 1) % (n + 1))
;

export default waits => 'awaiting results' + dots(3, waits);