import test from 'ava';

test.todo('should show up as todo');

test.skip('should show up as skipped', () => {});

test('should work', t => {
    t.log('has passed')
    t.pass();
});

test('should wrap very long texts with correct indentation', t => {
    t.pass();
});

test('should log an object and pass', t => {
    t.log({ a: 1, b: 2, c: 'three' })
    t.pass();
});

test('should log and throw ', t => {
    t.log('has thrown')
    throw new Error('blow up!')
});

test.failing('expected to fail', t => {
    t.log('has failed expectedly')
    t.fail();
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
