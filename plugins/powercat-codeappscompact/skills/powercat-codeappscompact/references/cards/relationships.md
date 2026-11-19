# Relationships

Use for friendly record identities, eligibility or async references. **Imports:** `ReferenceField`, `referenceOptions`, `referenceLabel` from `codeappscompact/reference`; `referenceBinding`, `bindReferences` from `codeappscompact/authoring`. **API:** `reference`; `authoring` only for bindings.

```ts
const options = referenceOptions(records, { getId: row => row.id, getLabel: row => row.name });
const label = referenceLabel(options, selectedId);
```

Configure ID/label mapping, `disabledReason`, data source and dependent choices. Flat workspace bindings preserve scalar constraints; standalone `ReferenceField` exposes `onStateChange({pending,issue})`. Prevent commit while a required lookup is pending/failed. Keep the selected missing ID visible and reject invalid relationships rather than silently choosing another.

Read the selected [data](../contracts/data.md) and [save](../contracts/save.md) contracts. Revalidate existence/eligibility in the real command/adapter; a disabled option is not authorization. Do not connect or invent real bindings without approval.
