# Collections, queries and storage

```ts
const definition = defineCollection<Row, Draft>({
  namespace: 'inventory-demo-v1', id: 'items', title: 'Inventory',
  service, defaults, fields, columns,
  getId: row => row.id, getLabel: row => row.name,
  searchText: row => `${row.name} ${row.notes}`,
  filters: [{ id: 'status', label: 'Filter by status', options: statuses,
    matches: (row, value) => row.status === value }],
  mobileLayout: 'cards',
});
```

`defineCollection` supplies exact-key draft projection unless `toDraft` is provided, plus a namespaced infinite-query key. It is not a schema language or a repository generator. Identity, domain text and service behavior remain explicit. Optional `createDefaults:()=>Draft` supplies context-sensitive values; `defaults` remains the stable shape template.

`collectionKeys(namespace)` returns `.all`, `.workspace` and `.records(id)`. Keys begin with `['codeappscompact',namespace]`. Namespaces must distinguish applications, data modes and incompatible schemas. Do not share one key between finite/infinite queries or different services.

## Declare adapter capabilities honestly

```ts
const capabilities = {
  search: 'remote', filtering: 'remote', sorting: 'remote', pagination: 'cursor',
} satisfies QueryCapabilities;
```

Attach to `service.capabilities`, or explicitly supply `RecordScreen.capabilities`. Each querying operation is local or remote; pagination is none or cursor. `getAll` accepts optional `{skipToken,search,filters,sort:{column,direction},signal}`. Remote values are sent only for declared remote operations and become part of the list query key. An adapter MUST actually implement advertised operations and return errors for unsupported behavior. Server-specific field mapping/escaping belongs in the adapter, not raw query-string concatenation in a component.

Without a declaration, legacy services retain loaded-only local search/sort/filter plus cursor paging. Legacy `searchScope='all'` opts into an unpaged complete collection; a returned cursor then fails explicitly. The demo adapter declares complete local collections automatically. No invented pagination is added for already-loaded demo data.

Search labels distinguish all, loaded and service records. Local filters/sorts say whether they cover all or loaded rows; remote ones say they are performed by the service. Remote matching may still require Load more. Neither capabilities nor an empty cursor independently proves a real backend returned every eligible row; verify adapter behavior.

Sortable columns add a stable `id` and `sortValue(row): string|number|null`. Types must be consistent within a column. Local sort is stable; null sorts last; string order uses locale-aware numeric collation. Remote adapters map the column ID themselves. Filters use unique IDs, labeled options, optional blank/all choice, and a required `matches` callback for local mode. Views do not remount editors.

## Workspace refresh

`useWorkspace({namespace,repository,dependencies?})` accepts `read():Promise<State>` and `subscribe(listener)`. Events are `{collections:['items']}` for known changes or `{collections:null}` for unknown/cross-tab changes. The hook invalidates the workspace summary plus affected collection prefixes; it never invalidates another namespace. Optional `dependencies:{owners:['requests']}` declares that changing owners also requires requests to refetch. Keep repository and dependencies stable.

Render `query.error` and `query.refreshError`, with `query.retry()` available. `QueryState` is a small loading/error/retry/empty wrapper, not another state framework. New-app examples show this integration. Do not subscribe manually AND use the hook for the same source.

## Extend the existing demo adapter

`createDemoRepository` keeps its full-collection, exact-shape, revisioned behavior. `fields` adds shared scalar validation. Existing `validate(next,previous)` remains structural/referential validation, including reads; `previous` is null on initialization/read. New `validateMutation({collection,operation,id,previous,next})` runs ONLY before create/update persistence. Use it for future-date policies, status transitions and conditional activation rules. Policy inputs are snapshots; mutating them is not a supported way to rewrite a save.

Default writes/reads use Web Locks. No locks, blocked/quota storage, corrupted JSON, incompatible schemas, bad revisions and read-back mismatches fail explicitly. Invalid existing storage is never reset. Subscriptions identify same-page changed collections, preserve zero-argument subscriber compatibility, and conservatively mark cross-tab changes unknown. Storage events cannot reveal which collection changed without decoding a trusted envelope, so namespace-wide invalidation is intentional there.

The adapter remains browser-local synthetic data, not a transactional database, durable multi-user backend or production access-control mechanism. Production services can reuse field/query contracts while owning authentication, authorization, data integrity and real concurrency. No production connector, delete framework, nested drafts or universal transaction layer is added.
