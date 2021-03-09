import test from 'ava';

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

test.failing('expected to fail', t => {
    t.log('has failed expectedly')
    t.fail();
});
