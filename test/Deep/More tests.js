import test from 'ava';

test.todo('should write more tests');

test('one more test added', t => {
    t.log('log from nested folders test')
    t.pass();
});

test('takes a long time to pass', async t => {
    await new Promise((f) => setTimeout(f, 2000));
    t.pass();
});
