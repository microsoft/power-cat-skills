import { useCallback, useEffect, useRef, useState } from 'react';
import { DataError, errorMessage } from '../dist/fields.js';
export function useTransactionState(store, storageKey) {
    const [state, setState] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [externalChange, setExternalChange] = useState(0);
    const live = useRef(false);
    const sequence = useRef(0);
    const pending = useRef(false);
    const reload = useCallback(async () => {
        const ticket = ++sequence.current;
        setLoading(true);
        try {
            const next = await store.load();
            if (live.current && sequence.current === ticket) {
                setState(next);
                setError('');
            }
        }
        catch (failure) {
            if (live.current && sequence.current === ticket)
                setError(errorMessage(failure));
        }
        finally {
            if (live.current && sequence.current === ticket)
                setLoading(false);
        }
    }, [store]);
    useEffect(() => {
        live.current = true;
        void reload();
        const changed = (event) => {
            if (event.storageArea !== null && event.storageArea !== window.localStorage)
                return;
            if (event.key !== storageKey && event.key !== null)
                return;
            setExternalChange(count => count + 1);
            void reload();
        };
        const focused = () => { void reload(); };
        window.addEventListener('storage', changed);
        window.addEventListener('focus', focused);
        return () => { live.current = false; sequence.current++; window.removeEventListener('storage', changed); window.removeEventListener('focus', focused); };
    }, [reload, storageKey]);
    const write = useCallback(async (work) => {
        if (pending.current)
            throw new DataError('conflict', 'A save is already in progress. Wait for its result before retrying.');
        pending.current = true;
        const ticket = ++sequence.current;
        setSaving(true);
        try {
            const result = await work();
            if (live.current && sequence.current === ticket) {
                setState(result.state);
                setError('');
                setLoading(false);
            }
            return result;
        }
        finally {
            pending.current = false;
            if (live.current) {
                setSaving(false);
                if (sequence.current === ticket)
                    setLoading(false);
            }
        }
    }, []);
    const commit = useCallback((expectedRevision, command, actor) => write(() => store.commit(expectedRevision, command, actor)), [store, write]);
    const reset = useCallback(async (expected) => (await write(async () => ({ state: await store.reset(expected) }))).state, [store, write]);
    return { state, error, loading, saving, externalChange, reload, commit, reset };
}
