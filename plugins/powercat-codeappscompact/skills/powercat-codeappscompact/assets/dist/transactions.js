import { DataError, errorMessage, isObject } from '../dist/fields.js';
export function browserTransactionPorts() {
    return {
        storage: { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) },
        lock: (name, work) => {
            if (typeof navigator === 'undefined' || !navigator.locks?.request)
                return Promise.reject(new DataError('storage', 'Safe multi-tab writes require Web Locks. Use current Edge on localhost or authenticated Local Play.'));
            return navigator.locks.request(`codeappscompact:${name}`, work);
        },
        id: () => crypto.randomUUID(), now: () => new Date().toISOString(),
    };
}
export function createTransactionStore(key, rules, ports = browserTransactionPorts()) {
    if (!key.trim())
        throw new Error('Transaction storage needs a unique nonempty key.');
    function readRaw() {
        try {
            return ports.storage.getItem(key);
        }
        catch (error) {
            throw new DataError('storage', `Demo storage read failed: ${errorMessage(error)}`, { cause: error });
        }
    }
    function decode(raw) {
        const state = rules.decode(raw);
        if (!isObject(state) || typeof state.revision !== 'string' || !state.revision.trim())
            throw new DataError('storage', 'A validated snapshot must have a nonempty string revision. Existing data was preserved.');
        return state;
    }
    function persist(next, expectedRaw) {
        const state = decode(JSON.stringify(next));
        const encoded = JSON.stringify(state);
        if (readRaw() !== expectedRaw)
            throw new DataError('conflict', 'Data changed outside the write lock. Reload before saving.');
        try {
            ports.storage.setItem(key, encoded);
        }
        catch (error) {
            throw new DataError('storage', `Demo storage write failed: ${errorMessage(error)}`, { cause: error });
        }
        if (readRaw() !== encoded)
            throw new DataError('storage', 'Save could not be verified. Data may have been written; reload and inspect it before retrying.');
        return state;
    }
    function read() {
        const raw = readRaw();
        if (raw !== null)
            return { state: decode(raw), raw };
        const state = persist({ ...rules.seed(), revision: ports.id() }, null);
        return { state, raw: JSON.stringify(state) };
    }
    return {
        load: () => ports.lock(key, () => read().state),
        raw: readRaw,
        commit: (expectedRevision, command, actor) => ports.lock(key, () => {
            const current = read();
            if (current.state.revision !== expectedRevision)
                throw new DataError('conflict', 'Data changed in another tab or view. Your draft is preserved. Cancel and reopen it against the latest records before saving.');
            const result = rules.reduce(current.state, command, actor, ports.now(), ports.id());
            const state = persist({ ...result.state, revision: ports.id() }, current.raw);
            return { ...result, state };
        }),
        reset: (expected) => ports.lock(key, () => {
            const raw = readRaw();
            if ('raw' in expected ? raw !== expected.raw : raw === null || decode(raw).revision !== expected.revision)
                throw new DataError('conflict', 'Data changed before reset. Nothing was reset; review the latest records and confirm again.');
            return persist({ ...rules.seed(), revision: ports.id() }, raw);
        }),
    };
}
