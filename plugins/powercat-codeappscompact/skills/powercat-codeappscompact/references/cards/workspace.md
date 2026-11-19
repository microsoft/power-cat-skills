# Flat workspace

Use first for compatible flat CRUD across collections. **Import:** `DemoWorkspace`, `defineDemoWorkspace`, `CollectionWorkspace`, `collectionView` from `codeappscompact/workspace`. **API:** `workspace`.

```tsx
<DemoWorkspace definition={definition} title="Team workspace" />
```

Read the [definition contract](../authoring.md) and [data contract](../contracts/data.md). Configure typed collections, fields, defaults, relations, metrics and mutation rules; scaffold with `--definition <typed-folder>`. Services/query keys, navigation and guarded editors are already wired. Use `mobileLayout="cards"` in the collection when appropriate. Static/global metrics must derive from the complete state, not UI search results.

Use `CollectionWorkspace` with `collectionView` for approved non-demo adapters. No automatic binding discovery or schema changes. For nested drafts/atomic commands choose [RecordFlow](flow.md), not both demo stores for the same records.
