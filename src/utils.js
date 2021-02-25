export const id = x => x;
const compose = (f, g) => x => f(g(x));
const apply = (f, x) => f(x);
export const pipe = (...fs) => fs.reduceRight(compose, id);
export const $pipe = (...fs) => pipe(...fs.slice(1))(fs[0]);
export const _ = f => (x, ...xs) => xs.reduce(apply, f(x));
export const eq = a => b => a === b;
export const prop = p => a => a[p];
export const defined = x => x !== undefined;
export const hasProp = _(p => pipe(prop(p), defined));
export const either = _(p => t => f => x => p(x) ? t(x) : f(x));
export const not = f => (...xs) => !f(...xs);

export const $ = method => (...args) => a => {
    if (!a || !a[method])
        throw new Error(`${a} doesn't have a method ${method}`);
    return a[method](...args)
};

export const map = f => a =>
    Array.isArray(a)
    ? a.map(f)
    : Object.fromEntries(
        Object.entries(a).map(f)
    )
;

export const $$ = (...xs) => xs.map($);

export const repeat = _(s => n => Array(n).fill(s).join(''));
export const spaces = repeat(' ');
export const wrap = (before, after = before) => x => before + x + after;
export const splitJoin = (f, s1, s2 = s1) => str =>
    f(str.split(s1)).join(s2)
;

export const indent = _(n =>
    splitJoin(xs => xs.map(x => spaces(n) + x), '\n')
);

export const wrapLine = _(max => indentation => str => {
    const lines = [''];
    let current = 0;

    str.split(' ').forEach(word => {
        const length = word.length
            + indentation
            + lines[current].length
        ;
        if (length > max) lines[++current] = '';

        return lines[current] += ' ' + word
    });

    return lines
        .map(x => x.trim())
        .map((x, i) => !i ? x : spaces(indentation) + x)
    ;
});

export const safe = f => {
    let out;
    try {
        out = f()
    } catch {
        out = null
    }
    return out;
};
