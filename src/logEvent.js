const isLog = text =>
    text && text.substring(0, 4) === '#   '
;

const cleanup = t => t.replace('#   ', '');

const removeLastReturn = log =>({
    ...log, message: log.message.replace(/\n$/m, '')
});

const concatMessage = (log, message) => ({
    ...log, message: log.message + message
});

const local = {
    result: null,
    log: null
};

// comments are emitted line by line with no reference to their parent result

export default (send, source) => value => {
    const { log, result } = local;

    if(source.is('comment') && isLog(value)) {
        const message = cleanup(value);
        if(log && log.result === result) {
            local.log = concatMessage(log, message);
        } else {
            local.log = { result, message };
        }
    } else if (source.is('result')) {
        if (log) send(removeLastReturn(log))
        local.result = value;
        local.log = null;
    } else if (source.is('complete')) {
        if(log) send(removeLastReturn(log))
    }
};
