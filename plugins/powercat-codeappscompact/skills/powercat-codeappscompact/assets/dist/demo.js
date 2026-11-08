import { assertFlat, assertValidDraft, checkConfiguration, checkDraft, DataError, errorMessage, isObject, projectDraft } from './fields.js';
export function createDemoRepository(options) {
    if (!options.key.trim() || !Number.isSafeInteger(options.schemaVersion) || options.schemaVersion < 1)
        throw new Error('Demo storage needs a unique key and positive schemaVersion.');
    const defaults = structuredClone(options.defaults);
    const keys = Object.keys(defaults);
    if (!keys.length)
        throw new Error('At least one demo collection is required.');
    for (const key of keys) {
        assertFlat(defaults[key], `${key} defaults`);
        if (defaults[key].revision !== 0 || Object.hasOwn(defaults[key], 'id'))
            throw new Error(`${key} defaults must have revision: 0 and must not contain id.`);
        checkConfiguration(defaults[key], options.fields?.[key] ?? []);
    }
    const storage = options.storage ?? (() => window.localStorage);
    const serialize = options.serialize ?? (async (work) => {
        if (typeof navigator === 'undefined' || !navigator.locks)
            throw new DataError('storage', 'Safe demo writes require Web Locks in a secure context. Use current Edge on localhost or authenticated Local Play.');
        return navigator.locks.request(`codeappscompact:${options.key}`, { mode: 'exclusive' }, work);
    });
    const newId = options.newId ?? (() => crypto.randomUUID());
    const listeners = new Set();
    function notify(change) {
        for (const listener of listeners) {
            try {
                listener(change);
            }
            catch (error) {
                console.error('[PowerCat-CodeAppsCompact] Data was saved, but a refresh subscriber failed', error);
            }
        }
    }
    function onStorage(event) { if (event.key === options.key || event.key === null)
        notify({ collections: null }); }
    function assertState(value) {
        if (!isObject(value) || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key)))
            throw new DataError('storage', 'Stored demo collections do not match the configured schema. Existing data was preserved.');
        for (const key of keys) {
            const rawRows = value[key];
            if (!Array.isArray(rawRows))
                throw new DataError('storage', `Demo collection ${key} is not an array.`);
            const rows = rawRows;
            const ids = new Set();
            for (const row of rows) {
                assertFlat(row, `${key} record`);
                const { id, ...draft } = row;
                if (typeof id !== 'string' || !id.trim() || ids.has(id))
                    throw new DataError('storage', `Demo collection ${key} contains an invalid or duplicate ID.`);
                ids.add(id);
                checkDraft(draft, defaults[key], `${key} record`);
                if (!Number.isSafeInteger(row.revision) || Number(row.revision) < 1)
                    throw new DataError('storage', `Invalid record revision in ${key}.`);
                assertValidDraft(draft, defaults[key], options.fields?.[key] ?? []);
            }
        }
    }
    function readRaw() {
        try {
            return storage().getItem(options.key);
        }
        catch (error) {
            throw new DataError('storage', `Demo storage read failed: ${errorMessage(error)}`, { cause: error });
        }
    }
    function validate(next, previous) {
        assertState(next);
        options.validate?.(next, previous);
        assertState(next);
    }
    function persist(envelope, expected) {
        if (!Number.isSafeInteger(envelope.revision) || envelope.revision < 1)
            throw new DataError('storage', 'Demo revision limit reached. No data was written.');
        const encoded = JSON.stringify(envelope);
        if (readRaw() !== expected)
            throw new DataError('conflict', 'Demo storage changed outside the write lock. Reload before saving.');
        try {
            storage().setItem(options.key, encoded);
        }
        catch (error) {
            throw new DataError('storage', `Demo storage write failed: ${errorMessage(error)}`, { cause: error });
        }
        if (readRaw() !== encoded)
            throw new DataError('storage', 'Demo save could not be verified. Reload and inspect saved data before retrying.');
        return encoded;
    }
    function load() {
        const raw = readRaw();
        if (raw === null) {
            const collections = structuredClone(options.seed());
            validate(collections, null);
            const envelope = { schemaVersion: options.schemaVersion, revision: 1, collections };
            return { envelope, raw: persist(envelope, null) };
        }
        let decoded;
        try {
            decoded = JSON.parse(raw);
        }
        catch (error) {
            throw new DataError('storage', `Saved demo is not valid JSON. Existing data was preserved: ${errorMessage(error)}`, { cause: error });
        }
        if (!isObject(decoded) || decoded.schemaVersion !== options.schemaVersion || !Number.isSafeInteger(decoded.revision) || Number(decoded.revision) < 1)
            throw new DataError('storage', 'Saved demo schema or revision is incompatible. Existing data was preserved; an explicit migration or a new storage key is required.');
        assertState(decoded.collections);
        options.validate?.(decoded.collections, null);
        assertState(decoded.collections);
        return { envelope: { schemaVersion: options.schemaVersion, revision: Number(decoded.revision), collections: decoded.collections }, raw };
    }
    function service(kind) {
        if (!Object.hasOwn(defaults, kind))
            throw new Error(`Unknown demo collection: ${kind}`);
        async function change(id, draft) {
            const result = await serialize(() => {
                checkDraft(draft, defaults[kind]);
                assertValidDraft(draft, defaults[kind], options.fields?.[kind] ?? []);
                const { envelope, raw } = load();
                const rows = envelope.collections[kind];
                const current = id === null ? undefined : rows.find(row => row.id === id);
                if (id !== null && !current)
                    throw new DataError('conflict', 'Record no longer exists. Reload before saving.');
                if (id === null ? draft.revision !== 0 : draft.revision !== current?.revision)
                    throw new DataError('conflict', 'Record changed in another view. Your draft was preserved; reload the record before saving.');
                const recordId = current?.id ?? `${kind}-${newId()}`;
                if (!recordId.trim() || (id === null && rows.some(row => row.id === recordId)))
                    throw new Error('A unique demo record ID could not be created.');
                const row = { ...draft, id: recordId, revision: (current?.revision ?? 0) + 1 };
                const next = structuredClone(envelope.collections);
                next[kind] = id === null ? [...rows, row] : rows.map(item => item.id === id ? row : item);
                validate(next, envelope.collections);
                options.validateMutation?.({ collection: kind, operation: id === null ? 'create' : 'update', id: recordId, previous: structuredClone(envelope.collections), next: structuredClone(next) });
                persist({ schemaVersion: options.schemaVersion, revision: envelope.revision + 1, collections: next }, raw);
                return { success: true, data: structuredClone(row) };
            });
            notify({ collections: [kind] });
            return result;
        }
        return {
            capabilities: { search: 'local', filtering: 'local', sorting: 'local', pagination: 'none' },
            async getAll(request) {
                if (request?.skipToken !== undefined)
                    throw new Error('Demo collections are unpaged. Remove the continuation token.');
                if (request?.search !== undefined || request?.filters !== undefined || request?.sort !== undefined)
                    throw new Error('Demo querying is local. Do not send remote search, filters or sorting.');
                return serialize(() => ({ success: true, data: structuredClone(load().envelope.collections[kind]) }));
            },
            create: draft => change(null, draft),
            update: (id, draft) => change(id, draft),
        };
    }
    return {
        read: () => serialize(() => structuredClone(load().envelope.collections)),
        service,
        subscribe(listener) {
            if (!listeners.size && typeof window !== 'undefined')
                window.addEventListener('storage', onStorage);
            listeners.add(listener);
            return () => { listeners.delete(listener); if (!listeners.size && typeof window !== 'undefined')
                window.removeEventListener('storage', onStorage); };
        },
        project(kind) { return projectDraft(defaults[kind]); },
    };
}
