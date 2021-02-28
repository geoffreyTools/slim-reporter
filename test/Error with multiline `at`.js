import avaBabel from 'ava-babel-wrapper';

const plugin = () => ({
    visitor: {
        Identifier() {
            throw new Error('this plugin sucks')
        }
    },
});

const test = avaBabel([plugin]);

test('compile-time error on identifiers', t => {
    const a = 1;
    t.is(a, 1);
})