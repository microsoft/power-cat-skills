# Related-record details

**Import:** `DetailTable` from `codeappscompact/aggregate`; **API:** `views` if needed. Use inside [RecordFlow](flow.md) or another detail layout.

```tsx
<DetailTable title="Related records" columns={['Name', 'Status']}
  rows={related.map(row => [row.name, row.status])} />
```

Provides captioned headers, a scrollable region and an empty state. App owns the current related query, calculated values, column/cell mapping and surrounding layout. Cells accept React nodes; use [display cells](display.md) when needed. Table columns and row lengths must agree.

No editing, joins or domain workflow are inferred. Prefer a real empty state over synthetic data disguised as a query result; surface load errors in the parent.
