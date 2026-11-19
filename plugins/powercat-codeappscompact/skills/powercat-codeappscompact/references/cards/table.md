# Aggregate table

Use for read-only or custom aggregate screens; prefer [RecordFlow](flow.md) when list/details/edit are all required. **Import:** `DataTable` from `codeappscompact/aggregate`. **API:** `table`. Load aggregate styles after theme.

```tsx
<DataTable title="Records" rows={rows} columns={columns} onOpen={openRecord} />
```

Rows are `{id,label,values,search?}` with stable IDs and string/number values. Columns are `{key,label,format?}`; format returns a string. Optional `filters`, `initialFilters`, `onAdd`/`addLabel`, `selected`/`onSelect` and `alternate(filteredRows)` support custom views.

Includes search/filter/sort, ten-row pagination and filtered CSV export. Definition/drill-down changes reset table state; ordinary data refresh does not. Parent owns loading/read errors and actual actions. Read [shell](shell.md) if opening records can abandon a draft; read [CSV](csv.md) only for a custom import/export action.

No configurable page size/export toggle or arbitrary React cell renderer. An alternate renderer is not a shipped board. Never add no-op actions or remount a parent draft to reset the table.
