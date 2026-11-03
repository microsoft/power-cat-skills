import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { checkConfiguration, errorMessage, fieldErrorsFrom, projectDraft } from './fields.js';
export { applyLocalView, queryCapabilities } from './query.js';
export function collectionKeys(namespace) {
    if (!namespace.trim())
        throw new Error('Collections require a nonempty app/data-mode namespace.');
    const all = ['codeappscompact', namespace];
    return { all, workspace: [...all, 'workspace'], records: (id) => {
            if (!id.trim())
                throw new Error('A collection ID is required.');
            return [...all, 'records', id];
        } };
}
export function defineCollection(config) {
    const { namespace, id, toDraft, ...props } = config;
    checkConfiguration(props.defaults, props.fields);
    return { ...props, id, queryKey: collectionKeys(namespace).records(id), toDraft: toDraft ?? projectDraft(props.defaults) };
}
export function useWorkspace({ namespace, repository, dependencies }) {
    const client = useQueryClient();
    const [refreshError, setRefreshError] = useState(null);
    const query = useQuery({ queryKey: collectionKeys(namespace).workspace, queryFn: repository.read, retry: false, refetchOnWindowFocus: false });
    useEffect(() => {
        let mounted = true;
        const unsubscribe = repository.subscribe(change => {
            const keys = collectionKeys(namespace);
            const changed = change.collections === null ? null : new Set(change.collections.flatMap(id => [id, ...(dependencies?.[id] ?? [])]));
            const targets = changed === null ? [keys.all] : [keys.workspace, ...[...changed].map(keys.records)];
            if (mounted)
                setRefreshError(null);
            void Promise.all(targets.map(queryKey => client.invalidateQueries({ queryKey }, { throwOnError: true }))).catch(error => {
                if (mounted)
                    setRefreshError(`Saved data changed, but refreshing failed: ${errorMessage(error)}`);
            });
        });
        return () => { mounted = false; unsubscribe(); };
    }, [client, namespace, repository, dependencies]);
    async function retry() {
        setRefreshError(null);
        try {
            await client.invalidateQueries({ queryKey: collectionKeys(namespace).all }, { throwOnError: true });
        }
        catch (error) {
            setRefreshError(errorMessage(error));
        }
    }
    return { ...query, refreshError, retry };
}
export function QueryState({ pending, error, empty = false, retrying = false, onRetry, children }) {
    if (pending)
        return _jsx("p", { "data-cc-part": "loading", role: "status", children: "Loading workspace..." });
    if (error)
        return _jsxs("div", { "data-cc-part": "read-error", children: [_jsx("p", { role: "alert", children: errorMessage(error) }), fieldErrorsFrom(error).size > 0 && _jsx("ul", { "aria-label": "Validation details", children: [...fieldErrorsFrom(error)].map(([field, message]) => _jsx("li", { children: message }, field)) }), onRetry && _jsx("button", { type: "button", disabled: retrying, onClick: onRetry, children: "Retry workspace read" })] });
    if (empty)
        return _jsx("p", { "data-cc-part": "empty", role: "status", children: "No records yet." });
    return _jsx(_Fragment, { children: children });
}
