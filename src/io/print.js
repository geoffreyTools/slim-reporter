const clearAll = '\x1Bc\r';

export default event => state => {
    if (state.needsUpdate && !state.write_lock) {
        event('write', { write_lock: true });

        process.stdout.write(
            clearAll + state.render,
            null,
            () => setTimeout(
                () => event('write', { write_lock: false }),
                20
            )
        )
    }

    return state;
};