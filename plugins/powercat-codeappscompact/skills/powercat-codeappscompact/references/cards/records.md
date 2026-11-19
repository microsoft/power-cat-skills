# Flat record screen

Use inside a custom shell only when [workspace](workspace.md) is unsuitable. **Import:** `RecordScreen` from `codeappscompact`, `defineCollection` from `codeappscompact/collections`; `columnsFor`, `selectFilter` from `codeappscompact/authoring`. **API:** `records`, then `collections` only for service/query details.

```tsx
<RecordScreen {...screen} mobileLayout="cards" onFormStateChange={guard.onFormStateChange} />
```

`screen` is typed `RecordScreenProps<Record, Draft>`. Read [fields](fields.md), [save](../contracts/save.md), [data](../contracts/data.md) and [shell](shell.md) contracts. Configure fields, columns, defaults, service, search/query capabilities and mutation validation; retain the supplied editor lifecycle. Table and mobile cards share rendering and sort controls.

Scalar drafts only. The flat UTC date-time field is not a date-only field. Use [RecordFlow](flow.md) for nested/custom forms; do not invent unsupported field kinds or adapter capabilities.
