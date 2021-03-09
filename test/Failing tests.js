import test from 'ava';

test('should log and throw ', t => {
    t.log('has thrown')
    throw new Error('blow up!')
});

test('should log and fail', t => {
    t.log('has failed')
    t.fail();
});

test('should fail with diff numbers', t => {
    t.is(0, 1);
});


test('should fail with diff objects', t => {
    t.deepEqual({a: {x: 1, y: 2}, b: 3}, {a: {x: 1, y: 1}, b: 3});
});


test.only('failing assert', t => {
    t.assert(false);
});
