import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { defineCollection, QueryState, useWorkspace } from './collections.js';
import { createDemoRepository } from './demo.js';
import { AttentionList, MetricGrid } from './display.js';
import { useNavigationGuard } from './navigation.js';
import { RecordScreen } from './RecordScreen.js';
import { AppShell } from './shell.js';
export function collectionView(screen, count) {
    return { id: screen.id, title: screen.title, count,
        render: onFormStateChange => _jsx(RecordScreen, { ...screen, headingLevel: 2, onFormStateChange: onFormStateChange }) };
}
export function CollectionWorkspace({ title, subtitle, hostStatus, collections, initialId, metrics, attention, children }) {
    const [active, setActive] = useState(initialId ?? collections[0]?.id ?? '');
    const guard = useNavigationGuard();
    const view = collections.find(item => item.id === active);
    if (!view || new Set(collections.map(item => item.id)).size !== collections.length)
        throw new Error('Workspace needs unique collection IDs and a valid initial/active collection.');
    function navigate(id) {
        if (!collections.some(item => item.id === id))
            throw new Error(`Unknown workspace collection: ${id}`);
        if (id !== active)
            guard.requestNavigation(() => setActive(id));
    }
    const summary = metrics ?? collections.filter(item => item.count !== undefined).map(item => ({ id: item.id, title: item.title, value: item.count, collectionId: item.id }));
    for (const id of [...summary.map(item => item.collectionId), ...(attention ?? []).map(item => item.action?.collectionId)]) {
        if (id !== undefined && !collections.some(item => item.id === id))
            throw new Error(`Unknown dashboard collection: ${id}`);
    }
    return _jsxs(AppShell, { title: title, subtitle: subtitle, hostStatus: hostStatus, activeId: active, onNavigate: navigate, items: collections.map(item => ({ id: item.id, label: item.title, count: item.count })), children: [guard.message && _jsx("p", { role: "alert", children: guard.message }), children, summary.length > 0 && _jsx(MetricGrid, { items: summary.map(({ collectionId, ...metric }) => ({ ...metric, onActivate: collectionId === undefined ? undefined : () => navigate(collectionId) })) }), attention && _jsx(AttentionList, { items: attention.map(({ action, ...item }) => ({ ...item, action: action && { label: action.label, onActivate: () => navigate(action.collectionId) } })) }), _jsx("div", { "data-cc-part": "collection-view", children: view.render(guard.onFormStateChange) }, view.id)] });
}
export function defineDemoWorkspace(options) {
    const ids = Object.keys(options.defaults);
    if (Object.keys(options.collections).length !== ids.length || ids.some(id => !Object.hasOwn(options.collections, id)))
        throw new Error('Every demo collection needs exactly one view definition.');
    const repository = createDemoRepository(options);
    function views(state) {
        function makeView(id) {
            const view = options.collections[id](state);
            return collectionView(defineCollection({
                ...view, namespace: options.key, id, service: repository.service(id), defaults: options.defaults[id], fields: view.fields ?? options.fields[id],
            }), state[id].length);
        }
        return ids.map(makeView);
    }
    return { namespace: options.key, repository, views, dependencies: options.dependencies, metrics: options.metrics, attention: options.attention };
}
export function DemoWorkspace({ definition, title, subtitle = 'Synthetic demo - saved in this browser only', hostStatus }) {
    const query = useWorkspace({ namespace: definition.namespace, repository: definition.repository, dependencies: definition.dependencies });
    const status = _jsx(QueryState, { pending: query.isPending, error: query.error ?? query.refreshError, retrying: query.isFetching, onRetry: () => { void query.retry(); } });
    if (!query.data)
        return _jsx(AppShell, { title: title, subtitle: subtitle, hostStatus: hostStatus, items: [], activeId: "", onNavigate: () => { throw new Error('Wait for the workspace to load.'); }, children: status });
    return _jsx(CollectionWorkspace, { title: title, subtitle: subtitle, hostStatus: hostStatus, collections: definition.views(query.data), metrics: definition.metrics?.(query.data), attention: definition.attention?.(query.data), children: status });
}
