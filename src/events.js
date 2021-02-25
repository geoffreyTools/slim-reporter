import { _, not } from './utils.js';

export const Event = (type, value) => {
    const is = (...xs) => xs.reduce(
        (a, b) => a || b === type,
        false
    );
    const isNot = not(is);
    return { value, is, isNot };
};

export const passEvent = _(store => f => type => value =>
    f({ ...store.frame, event: Event(type, value) })
);
